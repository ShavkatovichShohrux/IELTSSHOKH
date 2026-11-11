"""Threaded camera reader: always hands out the newest frame (low latency)."""
import sys
import threading
import time

import cv2


def list_cameras(max_index=6):
    found = []
    for i in range(max_index):
        cap = _try_open(i)
        if cap is not None:
            ok, frame = cap.read()
            if ok and frame is not None:
                found.append((i, frame.shape[1], frame.shape[0]))
            cap.release()
    return found


def _backends():
    if sys.platform == "win32":
        # DSHOW opens fast and honours exposure settings; MSMF is the fallback.
        return [cv2.CAP_DSHOW, cv2.CAP_MSMF, cv2.CAP_ANY]
    return [cv2.CAP_ANY]


def _try_open(index, backend=None):
    for be in ([backend] if backend is not None else _backends()):
        try:
            cap = cv2.VideoCapture(index, be)
        except Exception:
            continue
        if cap.isOpened():
            return cap
        cap.release()
    return None


class Camera:
    def __init__(self, index=0, width=1280, height=720, fps=30, exposure=None):
        self.index = index
        self.width, self.height, self.fps = width, height, fps
        self.exposure = exposure
        self._lock = threading.Lock()
        self._cond = threading.Condition(self._lock)
        self.frame = None
        self.ts = 0.0
        self.seq = 0
        self.cap = None
        self._open()
        self._running = True
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()
        if self.wait_new(0, timeout=5.0) is None:
            raise RuntimeError("Kamera kadr bermayapti (camera %d)" % index)

    def _open(self):
        last_err = None
        for be in _backends():
            cap = _try_open(self.index, be)
            if cap is None:
                continue
            try:
                cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*"MJPG"))
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
                cap.set(cv2.CAP_PROP_FPS, self.fps)
                cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            except Exception as e:  # some drivers reject properties
                last_err = e
            ok, f = cap.read()
            if ok and f is not None:
                self.cap = cap
                self.backend = be
                if self.exposure is not None:
                    self.set_exposure(self.exposure)
                return
            cap.release()
        raise RuntimeError("Kamerani ochib bo'lmadi (index %d). %s" % (self.index, last_err or ""))

    def set_exposure(self, value):
        """value=None -> auto, number -> manual (DirectShow: -13..-1, log2 seconds)."""
        self.exposure = value
        if self.cap is None:
            return
        try:
            if value is None:
                self.cap.set(cv2.CAP_PROP_AUTO_EXPOSURE, 0.75)
                self.cap.set(cv2.CAP_PROP_AUTO_EXPOSURE, 1)
            else:
                self.cap.set(cv2.CAP_PROP_AUTO_EXPOSURE, 0.25)
                self.cap.set(cv2.CAP_PROP_EXPOSURE, float(value))
        except Exception:
            pass

    def _loop(self):
        fails = 0
        while self._running:
            ok, frame = self.cap.read()
            if not ok or frame is None:
                fails += 1
                if fails > 30:  # camera unplugged / driver hiccup -> reopen
                    try:
                        self.cap.release()
                        time.sleep(1.0)
                        self._open()
                    except Exception:
                        time.sleep(1.0)
                    fails = 0
                else:
                    time.sleep(0.01)
                continue
            fails = 0
            with self._cond:
                self.frame = frame
                self.ts = time.time()
                self.seq += 1
                self._cond.notify_all()

    def latest(self):
        with self._lock:
            return self.seq, self.ts, self.frame

    def wait_new(self, after_seq, timeout=1.0):
        """Block until a frame newer than after_seq arrives. Returns (seq, ts, frame) or None."""
        end = time.time() + timeout
        with self._cond:
            while self.seq <= after_seq:
                left = end - time.time()
                if left <= 0:
                    return None
                self._cond.wait(left)
            return self.seq, self.ts, self.frame

    def frames_after(self, t0, count=3, timeout=2.0):
        """Collect `count` frames captured strictly after wall-clock time t0."""
        out = []
        seq = self.seq
        end = time.time() + timeout
        while len(out) < count and time.time() < end:
            r = self.wait_new(seq, timeout=max(0.05, end - time.time()))
            if r is None:
                break
            seq, ts, frame = r
            if ts > t0:
                out.append(frame)
        return out

    def release(self):
        self._running = False
        self._thread.join(timeout=1.0)
        if self.cap is not None:
            self.cap.release()
