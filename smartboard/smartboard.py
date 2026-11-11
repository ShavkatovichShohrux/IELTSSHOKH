"""SmartBoard: oddiy proyektor + oddiy doska + veb-kamera = sensorli doska.

Ishga tushirish:  python smartboard.py            (sozlamalar config.json da)
                  python smartboard.py --list      (kameralarni ko'rish)
                  python smartboard.py --mode pen  (yorug'lik ruchkasi rejimi)

Tugmalar (preview oynasida):
  C  avtomatik kalibrovka       M  qo'lda kalibrovka (4 burchak)
  H  qo'l rejimi                P  ruchka (yorug'lik) rejimi
  SPACE yoki F9  boshqaruvni yoqish/o'chirish (F9 hamma joyda ishlaydi)
  T  ruchka chegarasini avtomatik o'rnatish   [ ]  ekspozitsiya   - +  chegara
  D  ruchka debug-maskasi       Q / ESC  chiqish
"""
import argparse
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import cv2  # noqa: E402
import numpy as np  # noqa: E402

import sb_calib  # noqa: E402
from sb_camera import Camera, list_cameras  # noqa: E402
from sb_input import (enable_dpi_awareness, key_pressed_global, make_injector,  # noqa: E402
                      primary_screen_rect)
from sb_logic import TouchLogic  # noqa: E402
from sb_trackers import HandTracker, PenTracker  # noqa: E402

DEFAULTS = {
    "camera": 0,
    "camera_width": 1280,
    "camera_height": 720,
    "camera_exposure": None,
    "mode": "hand",
    "output": "touch",
    "screen_rect": None,
    "autostart_control": True,
    "hover_cursor": True,
    "dwell_click": True,
    "dwell_time": 0.8,
    "dwell_radius": 0.018,
    "click_slop": 0.012,
    "down_frames": 2,
    "up_frames": 3,
    "smooth_min_cutoff": 1.2,
    "smooth_beta": 0.015,
    "pinch_drag": True,
    "pinch_on": 0.30,
    "pinch_off": 0.42,
    "pen_action": "touch",
    "pen_threshold": 200,
    "pen_delta": 50,
    "pen_min_area": 2,
    "pen_max_area": 0.004,
    "preview_width": 640,
}

CONFIG_PATH = os.path.join(HERE, "config.json")
CALIB_PATH = os.path.join(HERE, "calibration.json")
MODEL_PATH = os.path.join(HERE, "models", "hand_landmarker.task")
VK_F9 = 0x78


def load_config(path):
    cfg = dict(DEFAULTS)
    if os.path.exists(path):
        try:
            with open(path, encoding="utf-8") as f:
                cfg.update(json.load(f))
        except Exception as e:
            print("[config] o'qib bo'lmadi:", e)
    else:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(DEFAULTS, f, indent=2)
    return cfg


def save_config(path, cfg):
    with open(path, "w", encoding="utf-8") as f:
        json.dump({k: cfg.get(k, v) for k, v in DEFAULTS.items()}, f, indent=2)


def make_tracker(mode, cfg):
    if mode == "hand":
        try:
            return HandTracker(cfg, MODEL_PATH)
        except Exception as e:
            print("[hand] MediaPipe ishlamadi: %s\n       -> 'pen' rejimiga o'tildi. "
                  "(pip install -r requirements.txt, Python 3.10-3.12 tavsiya)" % e)
            mode = "pen"
    return PenTracker(cfg)


class App:
    def __init__(self, args):
        self.cfg_path = args.config
        self.cfg = load_config(args.config)
        for k in ("camera", "mode", "output"):
            v = getattr(args, k)
            if v is not None:
                self.cfg[k] = v
        enable_dpi_awareness()
        self.rect = self.cfg["screen_rect"] or primary_screen_rect()
        print("Ekran:", self.rect)
        self.cam = Camera(self.cfg["camera"], self.cfg["camera_width"], self.cfg["camera_height"],
                          exposure=self.cfg["camera_exposure"])
        _, _, frame = self.cam.latest()
        self.frame_shape = frame.shape
        print("Kamera %d: %dx%d" % (self.cfg["camera"], frame.shape[1], frame.shape[0]))
        self.injector = make_injector(self.cfg["output"], self.cfg["hover_cursor"], verbose=args.verbose)
        print("Chiqish:", self.injector.name)
        self.logic = TouchLogic(self.rect[2], self.cfg)
        self.tracker = make_tracker(self.cfg["mode"], self.cfg)
        self.H = sb_calib.load(CALIB_PATH, self.rect, self.frame_shape, self.cfg["camera"])
        self.quad = None
        self._apply_calibration()
        self.enabled = bool(self.H is not None and self.cfg["autostart_control"])
        self.show_debug = False
        self.msg, self.msg_until = "", 0.0
        self._f9_prev = False
        if self.H is None:
            self.flash("Kalibrovka yo'q: C ni bosing (avto) yoki M (qo'lda)", 30)

    def flash(self, text, secs=4.0):
        print(text)
        self.msg, self.msg_until = text, time.time() + secs

    def _apply_calibration(self):
        self.quad = None if self.H is None else sb_calib.board_quad(self.H, self.rect)
        self.tracker.set_board(self.quad)

    def _release(self):
        for e in self.logic.release():
            self._emit(e)

    def _emit(self, e):
        kind, x, y = e
        getattr(self.injector, kind)(x, y)

    def set_mode(self, mode):
        if self.tracker.name == mode:
            return
        self._release()
        if hasattr(self.tracker, "close"):
            self.tracker.close()
        self.cfg["mode"] = mode
        self.tracker = make_tracker(mode, self.cfg)
        self._apply_calibration()
        self.flash("Rejim: " + self.tracker.name)

    def calibrate(self, manual=False):
        self._release()
        was = self.enabled
        self.enabled = False
        try:
            if manual:
                H = sb_calib.manual_calibrate(self.cam, self.rect)
            else:
                self.flash("Kalibrovka: doska oldidan chetga chiqing...", 2)
                H = sb_calib.auto_calibrate(self.cam, self.rect)
            self.H = H
            sb_calib.save(CALIB_PATH, H, self.rect, self.frame_shape, self.cfg["camera"])
            self._apply_calibration()
            self.enabled = True
            self.flash("Kalibrovka saqlandi. Boshqaruv YOQILDI.")
        except KeyboardInterrupt:
            self.enabled = was
            self.flash("Kalibrovka bekor qilindi")
        except Exception as e:
            self.enabled = was
            self.flash("Kalibrovka xatosi: %s  (M = qo'lda)" % e, 8)

    def toggle(self):
        if self.H is None:
            self.flash("Avval kalibrovka qiling (C)")
            return
        self.enabled = not self.enabled
        if not self.enabled:
            self._release()
        self.flash("Boshqaruv " + ("YOQILDI" if self.enabled else "O'CHIRILDI"))

    def draw(self, frame, pt_cam, contact, fps, info):
        vis = frame.copy()
        if self.show_debug and isinstance(self.tracker, PenTracker) and self.tracker.debug is not None:
            vis[self.tracker.debug > 0] = (0, 0, 255)
        if self.quad is not None:
            cv2.polylines(vis, [self.quad.astype(np.int32)], True, (0, 200, 255), 2)
        for pts in info.get("hands", []):
            for p in pts[:, :2]:
                cv2.circle(vis, (int(p[0]), int(p[1])), 3, (255, 180, 0), -1)
        if pt_cam is not None:
            col = (0, 0, 255) if self.logic.touching else (0, 255, 120)
            c = (int(pt_cam[0]), int(pt_cam[1]))
            cv2.circle(vis, c, 12, col, -1)
            if self.logic.dwell_progress > 0:
                cv2.ellipse(vis, c, (22, 22), -90, 0, 360 * self.logic.dwell_progress, (0, 255, 255), 4)
        s = self.cfg["preview_width"] / vis.shape[1]
        vis = cv2.resize(vis, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
        state = "BOSILGAN" if self.logic.touching else ("tegish" if contact else "-")
        lines = [
            "Rejim: %s | Chiqish: %s | %s | %.0f fps" % (
                self.tracker.name, self.injector.name, "YONIQ" if self.enabled else "O'CHIQ", fps),
            "Holat: %s" % state,
            "C avto-kalib  M qo'lda  H qo'l  P ruchka  SPACE/F9 yoq/o'ch  Q chiqish",
        ]
        if isinstance(self.tracker, PenTracker):
            lines.append("Ruchka chegara %.0f (-/+)  T auto  [ ] eksp=%s  D maska" % (
                self.tracker.abs_thr, self.cam.exposure))
        if time.time() < self.msg_until:
            lines.append(self.msg)
        y = 22
        for ln in lines:
            cv2.putText(vis, ln, (8, y), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 3, cv2.LINE_AA)
            cv2.putText(vis, ln, (8, y), cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                        (0, 255, 0) if self.enabled else (0, 200, 255), 1, cv2.LINE_AA)
            y += 20
        return vis

    def handle_key(self, k):
        if k in (ord("q"), ord("Q"), 27):
            return False
        if k in (ord("c"), ord("C")):
            self.calibrate(False)
        elif k in (ord("m"), ord("M")):
            self.calibrate(True)
        elif k in (ord("h"), ord("H")):
            self.set_mode("hand")
        elif k in (ord("p"), ord("P")):
            self.set_mode("pen")
        elif k == ord(" "):
            self.toggle()
        elif k in (ord("d"), ord("D")):
            self.show_debug = not self.show_debug
        elif isinstance(self.tracker, PenTracker) and k in (ord("-"), ord("+"), ord("=")):
            self.tracker.abs_thr = float(np.clip(self.tracker.abs_thr + (5 if k != ord("-") else -5), 30, 254))
            self.cfg["pen_threshold"] = self.tracker.abs_thr
        elif isinstance(self.tracker, PenTracker) and k in (ord("t"), ord("T")):
            self.flash("Ruchkani olib turing (1 s)...", 2)
            frames = self.cam.frames_after(time.time(), count=20, timeout=3)
            if frames:
                thr = self.tracker.calibrate_threshold(frames)
                self.cfg["pen_threshold"] = thr
                self.flash("Ruchka chegarasi: %.0f" % thr)
        elif k in (ord("["), ord("]")):
            e = self.cam.exposure if self.cam.exposure is not None else -5
            e = int(np.clip(e + (1 if k == ord("]") else -1), -13, 0))
            self.cam.set_exposure(e)
            self.cfg["camera_exposure"] = e
        return True

    def run(self):
        win = "SmartBoard"
        cv2.namedWindow(win, cv2.WINDOW_AUTOSIZE)
        seq = 0
        fps, t_prev = 0.0, time.time()
        try:
            while True:
                r = self.cam.wait_new(seq, timeout=1.0)
                if r is None:
                    k = cv2.waitKey(10) & 0xFF
                    if k != 255 and not self.handle_key(k):
                        break
                    continue
                seq, ts, frame = r
                now = time.time()
                fps = 0.9 * fps + 0.1 / max(1e-3, now - t_prev)
                t_prev = now

                pt_cam, contact, info = self.tracker.process(frame, ts * 1000.0)
                pt_scr = None
                if pt_cam is not None and self.H is not None:
                    pt_scr = sb_calib.cam_to_screen(self.H, pt_cam, self.rect)
                if self.enabled:
                    for e in self.logic.update(ts, pt_scr, contact):
                        self._emit(e)

                cv2.imshow(win, self.draw(frame, pt_cam, contact, fps, info))
                k = cv2.waitKey(1) & 0xFF
                if k != 255 and not self.handle_key(k):
                    break
                f9 = key_pressed_global(VK_F9)
                if f9 and not self._f9_prev:
                    self.toggle()
                self._f9_prev = f9
                if cv2.getWindowProperty(win, cv2.WND_PROP_VISIBLE) < 1:
                    break
        except KeyboardInterrupt:
            pass
        finally:
            self._release()
            self.injector.close()
            if hasattr(self.tracker, "close"):
                self.tracker.close()
            self.cam.release()
            save_config(self.cfg_path, self.cfg)
            cv2.destroyAllWindows()


def main():
    ap = argparse.ArgumentParser(description="Oddiy doskani sensorli doskaga aylantirish")
    ap.add_argument("--camera", type=int, default=None, help="kamera raqami (0, 1, 2...)")
    ap.add_argument("--mode", choices=["hand", "pen"], default=None)
    ap.add_argument("--output", choices=["touch", "mouse", "none"], default=None)
    ap.add_argument("--config", default=CONFIG_PATH)
    ap.add_argument("--list", action="store_true", help="ulangan kameralar ro'yxati")
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()
    if args.list:
        cams = list_cameras()
        if not cams:
            print("Kamera topilmadi")
        for i, w, h in cams:
            print("  kamera %d: %dx%d" % (i, w, h))
        return
    App(args).run()


if __name__ == "__main__":
    main()
