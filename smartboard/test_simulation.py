"""Headless self-test: synthetic projector/camera scene, no hardware needed.

    python test_simulation.py
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import cv2  # noqa: E402
import numpy as np  # noqa: E402

import sb_calib  # noqa: E402
from sb_logic import TouchLogic  # noqa: E402
from sb_trackers import PenTracker  # noqa: E402

SW, SH = 1920, 1080          # laptop screen (duplicated to projector)
CW, CH = 1280, 720           # camera frame
RECT = [0, 0, SW, SH]
# where the projected picture lands in the camera image (skewed, like a camera on a desk)
CAM_QUAD = np.float32([[300, 140], [1010, 90], [1060, 600], [260, 560]])
H_TRUE = cv2.getPerspectiveTransform(np.float32([[0, 0], [SW, 0], [SW, SH], [0, SH]]), CAM_QUAD)
rng = np.random.default_rng(1)


def camera_view(screen_img, ambient=40, noise=4):
    """What the webcam sees when `screen_img` is projected."""
    room = np.full((CH, CW, 3), ambient, np.uint8)
    warped = cv2.warpPerspective(screen_img, H_TRUE, (CW, CH))
    mask = cv2.warpPerspective(np.full((SH, SW), 255, np.uint8), H_TRUE, (CW, CH))
    out = room.copy()
    out[mask > 0] = (warped[mask > 0] * 0.75 + ambient).clip(0, 255).astype(np.uint8)
    out = cv2.GaussianBlur(out, (3, 3), 0)
    out = (out.astype(np.int16) + rng.normal(0, noise, out.shape)).clip(0, 255).astype(np.uint8)
    return out


def gray(f):
    return cv2.cvtColor(f, cv2.COLOR_BGR2GRAY).astype(np.float32)


def test_calibration():
    black = gray(camera_view(np.zeros((SH, SW, 3), np.uint8)))
    cam_pts, scr_pts = [], []
    r = int(0.035 * SH)
    for k, (sx, sy) in enumerate(sb_calib.grid_points(SW, SH)):
        img = np.zeros((SH, SW, 3), np.uint8)
        cv2.circle(img, (int(sx), int(sy)), r, (255, 255, 255), -1, cv2.LINE_AA)
        lit = camera_view(img)
        if k == 4:  # someone walks through the centre dot -> bogus bright blob elsewhere
            cv2.circle(lit, (200, 650), 25, (255, 255, 255), -1)
        pt, peak = sb_calib.find_dot(black, gray(lit))
        assert pt is not None, "dot %d not found" % k
        cam_pts.append(pt)
        scr_pts.append((sx, sy))
    H, err, inl = sb_calib.solve(cam_pts, scr_pts, SW)
    assert inl >= 8, inl
    # check mapping accuracy over the whole board
    worst = 0.0
    for fx in np.linspace(0.02, 0.98, 7):
        for fy in np.linspace(0.02, 0.98, 7):
            s = np.float32([[[fx * SW, fy * SH]]])
            c = cv2.perspectiveTransform(s, H_TRUE)[0, 0]
            back = sb_calib.cam_to_screen(H, (float(c[0]), float(c[1])), RECT)
            worst = max(worst, np.hypot(back[0] - s[0, 0, 0], back[1] - s[0, 0, 1]))
    print("calibration: inliers=%d reproj=%.2fpx worst-map-error=%.1fpx" % (inl, err, worst))
    assert worst < 12, worst  # < ~0.6% of screen width
    return H


def slide(page):
    img = np.full((SH, SW, 3), 235, np.uint8)
    cv2.putText(img, "GRAMMAR TEST page %d" % page, (200, 200), cv2.FONT_HERSHEY_SIMPLEX, 3, (20, 20, 20), 6)
    for i in range(12):
        cv2.line(img, (200, 300 + i * 60), (1700, 300 + i * 60), (60, 60, 60), 3)
    return img


def with_pen(frame, sx, sy):
    c = cv2.perspectiveTransform(np.float32([[[sx, sy]]]), H_TRUE)[0, 0]
    f = frame.copy()
    cv2.circle(f, (int(round(c[0])), int(round(c[1]))), 3, (255, 255, 255), -1)
    return f


def test_pen_and_logic(H):
    quad = sb_calib.board_quad(H, RECT)
    pen = PenTracker({"pen_threshold": 200, "pen_delta": 50})
    pen.set_board(quad)
    logic = TouchLogic(SW, {"dwell_click": False})
    events = []
    t = 0.0
    page = 1

    def step(frame):
        nonlocal t
        t += 1 / 30
        pt, contact, _ = pen.process(frame, t * 1000)
        scr = sb_calib.cam_to_screen(H, pt, RECT) if pt is not None else None
        events.extend(logic.update(t, scr, contact))
        return scr

    base = camera_view(slide(page))
    for _ in range(10):  # idle: projected bright slide must NOT trigger
        step(base)
    assert not events, events
    # tap at (600, 500)
    for _ in range(4):
        scr = step(with_pen(base, 600, 500))
    assert scr is not None and np.hypot(scr[0] - 600, scr[1] - 500) < 15, scr
    for _ in range(4):
        step(base)
    kinds = [e[0] for e in events]
    assert kinds[0] == "down" and kinds[-1] == "up", kinds
    assert all(np.hypot(e[1] - events[0][1], e[2] - events[0][2]) < 1e-6 for e in events), "tap jittered"
    print("pen tap: %s at (%.0f, %.0f)" % ("->".join(sorted(set(kinds), key=kinds.index)), events[0][1], events[0][2]))
    # swipe left across the board (scroll / next page gesture)
    events.clear()
    for x in np.linspace(1500, 400, 25):
        step(with_pen(base, x, 600))
    for _ in range(4):
        step(base)
    kinds = [e[0] for e in events]
    assert kinds[0] == "down" and kinds[-1] == "up"
    xs = [e[1] for e in events if e[0] == "move"]
    assert xs[-1] < 600 and xs[0] > 1300, (xs[0], xs[-1])
    print("pen swipe: %d moves, x %.0f -> %.0f" % (len(xs), xs[0], xs[-1]))
    # slide change (page flip) must not create a phantom touch
    events.clear()
    for p in range(2, 5):
        nb = camera_view(slide(p))
        for _ in range(6):
            step(nb)
    assert not events, events
    print("slide changes: no phantom touches")
    # a flicker dropout of 1 frame while drawing must not lift the pen
    events.clear()
    for i, x in enumerate(np.linspace(500, 900, 20)):
        step(base if i == 10 else with_pen(nb, x, 400))
    for _ in range(4):
        step(nb)
    kinds = [e[0] for e in events]
    assert kinds.count("down") == 1 and kinds.count("up") == 1, kinds
    print("1-frame dropout: still one continuous stroke")


def test_dwell():
    logic = TouchLogic(SW, {"dwell_click": True, "dwell_time": 0.8})
    ev = []
    t = 0
    for i in range(40):  # hold ~1.3 s with small jitter
        t += 1 / 30
        ev += logic.update(t, (800 + rng.normal(0, 3), 400 + rng.normal(0, 3)), False)
    clicks = [e for e in ev if e[0] == "click"]
    assert len(clicks) == 1, clicks
    for i in range(20):  # keep holding -> no repeated clicks
        t += 1 / 30
        ev += logic.update(t, (800, 400), False)
    assert len([e for e in ev if e[0] == "click"]) == 1
    print("dwell: exactly one click after %.1fs hold" % 0.8)


def test_hand_api():
    try:
        from sb_trackers import HandTracker
        ht = HandTracker({}, os.path.join(HERE, "models", "hand_landmarker.task"))
    except ImportError as e:
        print("hand: mediapipe not installed, skipped (%s)" % e)
        return
    blank = np.full((CH, CW, 3), 90, np.uint8)
    for i in range(3):
        pt, c, info = ht.process(blank, i * 33)
    assert pt is None
    sample = os.path.join(HERE, "models", "_sample_hand.jpg")
    if os.path.exists(sample):
        img = cv2.imread(sample)
        ht2 = HandTracker({}, os.path.join(HERE, "models", "hand_landmarker.task"))
        pt, c, info = ht2.process(img, 0)
        print("hand sample: fingertip=%s hands=%d" % (pt, len(info["hands"])))
        ht2.close()
    ht.close()
    print("hand: MediaPipe Tasks API OK")


if __name__ == "__main__":
    H = test_calibration()
    test_pen_and_logic(H)
    test_dwell()
    test_hand_api()
    print("ALL OK")
