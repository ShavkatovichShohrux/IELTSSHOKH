"""Send input to the OS.

Windows: real multi-touch injection (InjectTouchInput) so swiping scrolls pages
in browsers / PDF viewers / PowerPoint exactly like a touch screen. Falls back
to mouse (SetCursorPos + mouse_event) if touch injection is unavailable.
Other OS: pynput mouse if installed, otherwise dry-run (prints events).
"""
import sys
import time

IS_WIN = sys.platform == "win32"


def enable_dpi_awareness():
    """Must be called before any window is created so coordinates are physical pixels."""
    if not IS_WIN:
        return
    import ctypes
    try:
        ctypes.windll.shcore.SetProcessDpiAwareness(2)  # per-monitor aware
        return
    except Exception:
        pass
    try:
        ctypes.windll.user32.SetProcessDPIAware()
    except Exception:
        pass


def primary_screen_rect():
    if IS_WIN:
        import ctypes
        u = ctypes.windll.user32
        return [0, 0, u.GetSystemMetrics(0), u.GetSystemMetrics(1)]
    try:
        import tkinter
        r = tkinter.Tk()
        r.withdraw()
        w, h = r.winfo_screenwidth(), r.winfo_screenheight()
        r.destroy()
        return [0, 0, w, h]
    except Exception:
        return [0, 0, 1920, 1080]


def key_pressed_global(vk):
    """Edge-free poll of a global key (Windows only), e.g. VK_F9=0x78."""
    if not IS_WIN:
        return False
    import ctypes
    return bool(ctypes.windll.user32.GetAsyncKeyState(vk) & 0x8000)


class BaseInjector:
    name = "none"

    def hover(self, x, y):
        pass

    def down(self, x, y):
        pass

    def move(self, x, y):
        pass

    def up(self, x, y):
        pass

    def click(self, x, y):
        self.down(x, y)
        time.sleep(0.03)
        self.up(x, y)

    def close(self):
        pass


class DryRunInjector(BaseInjector):
    name = "dry-run"

    def __init__(self, verbose=False):
        self.verbose = verbose

    def _p(self, *a):
        if self.verbose:
            print("[input]", *a)

    def down(self, x, y):
        self._p("down", x, y)

    def up(self, x, y):
        self._p("up", x, y)

    def click(self, x, y):
        self._p("click", x, y)


if IS_WIN:
    import ctypes
    from ctypes import wintypes

    _user32 = ctypes.windll.user32

    PT_TOUCH = 0x00000002
    POINTER_FLAG_NONE = 0x00000000
    POINTER_FLAG_NEW = 0x00000001
    POINTER_FLAG_INRANGE = 0x00000002
    POINTER_FLAG_INCONTACT = 0x00000004
    POINTER_FLAG_PRIMARY = 0x00002000
    POINTER_FLAG_CONFIDENCE = 0x00004000
    POINTER_FLAG_DOWN = 0x00010000
    POINTER_FLAG_UPDATE = 0x00020000
    POINTER_FLAG_UP = 0x00040000
    TOUCH_MASK_CONTACTAREA = 0x1
    TOUCH_MASK_ORIENTATION = 0x2
    TOUCH_MASK_PRESSURE = 0x4
    TOUCH_FEEDBACK_DEFAULT = 0x1

    class POINTER_INFO(ctypes.Structure):
        _fields_ = [
            ("pointerType", ctypes.c_uint32),
            ("pointerId", ctypes.c_uint32),
            ("frameId", ctypes.c_uint32),
            ("pointerFlags", ctypes.c_uint32),
            ("sourceDevice", wintypes.HANDLE),
            ("hwndTarget", wintypes.HWND),
            ("ptPixelLocation", wintypes.POINT),
            ("ptHimetricLocation", wintypes.POINT),
            ("ptPixelLocationRaw", wintypes.POINT),
            ("ptHimetricLocationRaw", wintypes.POINT),
            ("dwTime", wintypes.DWORD),
            ("historyCount", ctypes.c_uint32),
            ("InputData", ctypes.c_int32),
            ("dwKeyStates", wintypes.DWORD),
            ("PerformanceCount", ctypes.c_uint64),
            ("ButtonChangeType", ctypes.c_int),
        ]

    class POINTER_TOUCH_INFO(ctypes.Structure):
        _fields_ = [
            ("pointerInfo", POINTER_INFO),
            ("touchFlags", ctypes.c_uint32),
            ("touchMask", ctypes.c_uint32),
            ("rcContact", wintypes.RECT),
            ("rcContactRaw", wintypes.RECT),
            ("orientation", ctypes.c_uint32),
            ("pressure", ctypes.c_uint32),
        ]

    class WinMouseInjector(BaseInjector):
        name = "mouse"
        LEFTDOWN, LEFTUP = 0x0002, 0x0004

        def hover(self, x, y):
            _user32.SetCursorPos(int(x), int(y))

        def down(self, x, y):
            _user32.SetCursorPos(int(x), int(y))
            _user32.mouse_event(self.LEFTDOWN, 0, 0, 0, 0)

        def move(self, x, y):
            _user32.SetCursorPos(int(x), int(y))

        def up(self, x, y):
            _user32.SetCursorPos(int(x), int(y))
            _user32.mouse_event(self.LEFTUP, 0, 0, 0, 0)

    class WinTouchInjector(BaseInjector):
        name = "touch"

        def __init__(self, hover_cursor=True):
            self.hover_cursor = hover_cursor
            _user32.InitializeTouchInjection.argtypes = [ctypes.c_uint32, wintypes.DWORD]
            _user32.InitializeTouchInjection.restype = wintypes.BOOL
            _user32.InjectTouchInput.argtypes = [ctypes.c_uint32, ctypes.POINTER(POINTER_TOUCH_INFO)]
            _user32.InjectTouchInput.restype = wintypes.BOOL
            if not _user32.InitializeTouchInjection(1, TOUCH_FEEDBACK_DEFAULT):
                raise OSError("InitializeTouchInjection failed (err %d)" % ctypes.GetLastError())
            self.contact = False
            self.last = (0, 0)

        def _send(self, x, y, flags):
            ti = POINTER_TOUCH_INFO()
            ti.pointerInfo.pointerType = PT_TOUCH
            ti.pointerInfo.pointerId = 0
            ti.pointerInfo.pointerFlags = flags
            ti.pointerInfo.ptPixelLocation.x = int(x)
            ti.pointerInfo.ptPixelLocation.y = int(y)
            ti.touchFlags = 0
            ti.touchMask = TOUCH_MASK_CONTACTAREA | TOUCH_MASK_ORIENTATION | TOUCH_MASK_PRESSURE
            ti.rcContact.left, ti.rcContact.right = int(x) - 2, int(x) + 2
            ti.rcContact.top, ti.rcContact.bottom = int(y) - 2, int(y) + 2
            ti.orientation = 90
            ti.pressure = 32000
            ok = _user32.InjectTouchInput(1, ctypes.byref(ti))
            self.last = (int(x), int(y))
            return bool(ok)

        def hover(self, x, y):
            if self.hover_cursor and not self.contact:
                _user32.SetCursorPos(int(x), int(y))

        def down(self, x, y):
            if self.contact:
                self.up(*self.last)
            self.contact = self._send(
                x, y, POINTER_FLAG_DOWN | POINTER_FLAG_INRANGE | POINTER_FLAG_INCONTACT)
            if not self.contact:  # e.g. coordinates rejected -> fall back to mouse once
                _user32.SetCursorPos(int(x), int(y))
                _user32.mouse_event(0x0002, 0, 0, 0, 0)
                self._mouse_fallback = True

        def move(self, x, y):
            if getattr(self, "_mouse_fallback", False):
                _user32.SetCursorPos(int(x), int(y))
                return
            if self.contact:
                self._send(x, y, POINTER_FLAG_UPDATE | POINTER_FLAG_INRANGE | POINTER_FLAG_INCONTACT)

        def up(self, x, y):
            if getattr(self, "_mouse_fallback", False):
                _user32.SetCursorPos(int(x), int(y))
                _user32.mouse_event(0x0004, 0, 0, 0, 0)
                self._mouse_fallback = False
                return
            if self.contact:
                lx, ly = self.last
                self._send(lx, ly, POINTER_FLAG_UP)
                self.contact = False

        def click(self, x, y):
            self.down(x, y)
            time.sleep(0.02)
            self.move(x, y)
            time.sleep(0.02)
            self.up(x, y)

        def close(self):
            if self.contact:
                self.up(*self.last)


def make_injector(kind="touch", hover_cursor=True, verbose=False):
    """kind: touch | mouse | none"""
    if kind == "none":
        return DryRunInjector(verbose)
    if IS_WIN:
        if kind == "touch":
            try:
                return WinTouchInjector(hover_cursor)
            except Exception as e:
                print("[input] Touch injection ishlamadi (%s) -> mouse rejimi" % e)
        return WinMouseInjector()
    try:
        from pynput.mouse import Button, Controller

        class PynputInjector(BaseInjector):
            name = "mouse(pynput)"

            def __init__(self):
                self.m = Controller()

            def hover(self, x, y):
                self.m.position = (int(x), int(y))

            move = hover

            def down(self, x, y):
                self.m.position = (int(x), int(y))
                self.m.press(Button.left)

            def up(self, x, y):
                self.m.position = (int(x), int(y))
                self.m.release(Button.left)

        return PynputInjector()
    except Exception:
        print("[input] OS boshqaruvi yo'q -> dry-run rejimi")
        return DryRunInjector(verbose)
