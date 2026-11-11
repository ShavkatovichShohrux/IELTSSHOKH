"""Camera -> screen calibration (homography).

Auto: the projector shows white dots one by one on black; the camera finds each
dot by frame differencing. 9 points + RANSAC => robust to any camera angle,
lens distortion is averaged out, a person walking by just drops one point.
Manual: click the 4 corners of the projected image in the camera preview.
"""
import json
import os
import time

import cv2
import numpy as np

WIN = "SmartBoard - kalibrovka"


def grid_points(w, h, n=3, margin=0.08):
    pts = []
    for j in range(n):
        for i in range(n):
            fx = margin + (1 - 2 * margin) * i / (n - 1)
            fy = margin + (1 - 2 * margin) * j / (n - 1)
            pts.append((fx * w, fy * h))
    return pts


def _open_fullscreen(rect):
    x, y, w, h = rect
    cv2.namedWindow(WIN, cv2.WINDOW_NORMAL | cv2.WINDOW_FREERATIO)
    cv2.moveWindow(WIN, int(x), int(y))
    cv2.setWindowProperty(WIN, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
    try:
        cv2.setWindowProperty(WIN, cv2.WND_PROP_TOPMOST, 1)
    except Exception:
        pass


def _show(img, wait_ms=1):
    cv2.imshow(WIN, img)
    return cv2.waitKey(wait_ms) & 0xFF


def _mean_gray(frames):
    acc = None
    for f in frames:
        g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY).astype(np.float32)
        acc = g if acc is None else acc + g
    return acc / len(frames)


def find_dot(black, lit, min_contrast=25.0):
    """Centroid of the brightest new blob in `lit` vs `black` (float gray images)."""
    diff = cv2.GaussianBlur(lit - black, (5, 5), 0)
    peak = float(diff.max())
    if peak < min_contrast:
        return None, peak
    mask = (diff > max(min_contrast * 0.6, peak * 0.5)).astype(np.uint8)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    if n <= 1:
        return None, peak
    best = 1 + int(np.argmax([diff[labels == i].sum() for i in range(1, n)]))
    ys, xs = np.nonzero(labels == best)
    w = diff[ys, xs]
    return (float((xs * w).sum() / w.sum()), float((ys * w).sum() / w.sum())), peak


def solve(cam_pts, scr_pts, screen_w):
    cam = np.asarray(cam_pts, np.float32)
    scr = np.asarray(scr_pts, np.float32)
    if len(cam) < 4:
        raise RuntimeError("Kamida 4 nuqta kerak, topildi: %d" % len(cam))
    if len(cam) == 4:
        H = cv2.getPerspectiveTransform(cam, scr)
        inl = np.ones(4, bool)
    else:
        H, m = cv2.findHomography(cam, scr, cv2.RANSAC, 0.02 * screen_w)
        if H is None:
            raise RuntimeError("Homografiya topilmadi")
        inl = m.ravel().astype(bool)
    proj = cv2.perspectiveTransform(cam.reshape(-1, 1, 2), H).reshape(-1, 2)
    err = np.linalg.norm(proj - scr, axis=1)
    return H, float(err[inl].mean()), int(inl.sum())


def auto_calibrate(cam, rect, log=print, settle=0.35, dot_frac=0.035):
    x, y, w, h = rect
    _open_fullscreen(rect)
    black_img = np.zeros((h, w, 3), np.uint8)
    try:
        for _ in range(15):  # let window appear & camera auto-exposure settle
            if _show(black_img, 60) == 27:
                raise KeyboardInterrupt
        t0 = time.time()
        black = _mean_gray(cam.frames_after(t0 + 0.15, count=4))
        cam_pts, scr_pts = [], []
        r = max(8, int(dot_frac * h))
        for k, (sx, sy) in enumerate(grid_points(w, h)):
            img = black_img.copy()
            cv2.circle(img, (int(sx), int(sy)), r, (255, 255, 255), -1, cv2.LINE_AA)
            if _show(img, 1) == 27:
                raise KeyboardInterrupt
            t_show = time.time()
            end = t_show + settle
            while time.time() < end:
                if _show(img, 15) == 27:
                    raise KeyboardInterrupt
            lit = _mean_gray(cam.frames_after(time.time(), count=3))
            pt, peak = find_dot(black, lit)
            log("  nuqta %d/9: %s (kontrast %.0f)" % (k + 1, "OK" if pt else "topilmadi", peak))
            if pt is not None:
                cam_pts.append(pt)
                scr_pts.append((sx, sy))
            _show(black_img, 120)  # back to black so the next dot is clean
    finally:
        cv2.destroyWindow(WIN)
        cv2.waitKey(1)
    H, err, inliers = solve(cam_pts, scr_pts, w)
    if inliers < 5 and len(cam_pts) > 4:
        raise RuntimeError("Faqat %d ta nuqta ishonchli. Kamerani doskaga to'g'riroq qarating." % inliers)
    if err > 0.03 * w:
        raise RuntimeError("Xato juda katta (%.0f px). Qayta urinib ko'ring." % err)
    log("Kalibrovka OK: %d nuqta, o'rtacha xato %.1f px" % (inliers, err))
    return H


def manual_calibrate(cam, rect, log=print, preview_w=960):
    """Click TL, TR, BR, BL corners of the projected picture in the camera image."""
    x, y, w, h = rect
    clicks = []
    win = "Burchaklarni bosing: chap-yuqori, o'ng-yuqori, o'ng-past, chap-past"
    cv2.namedWindow(win, cv2.WINDOW_AUTOSIZE)
    scale = [1.0]

    def on_mouse(ev, mx, my, flags, param):
        if ev == cv2.EVENT_LBUTTONDOWN and len(clicks) < 4:
            clicks.append((mx / scale[0], my / scale[0]))

    cv2.setMouseCallback(win, on_mouse)
    names = ["chap-yuqori", "o'ng-yuqori", "o'ng-past", "chap-past"]
    try:
        while True:
            _, _, frame = cam.latest()
            scale[0] = min(1.0, preview_w / frame.shape[1])
            vis = cv2.resize(frame, None, fx=scale[0], fy=scale[0])
            for i, (cx, cy) in enumerate(clicks):
                p = (int(cx * scale[0]), int(cy * scale[0]))
                cv2.circle(vis, p, 6, (0, 255, 0), -1)
                if i:
                    q = clicks[i - 1]
                    cv2.line(vis, (int(q[0] * scale[0]), int(q[1] * scale[0])), p, (0, 255, 0), 2)
            msg = ("Bosing: " + names[len(clicks)]) if len(clicks) < 4 else "Enter = saqlash, R = qayta"
            cv2.putText(vis, msg, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 4)
            cv2.putText(vis, msg, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
            cv2.imshow(win, vis)
            k = cv2.waitKey(30) & 0xFF
            if k == 27:
                raise KeyboardInterrupt
            if k in (ord("r"), ord("R")):
                clicks.clear()
            if k in (13, 10) and len(clicks) == 4:
                break
    finally:
        cv2.destroyWindow(win)
        cv2.waitKey(1)
    scr = [(0, 0), (w, 0), (w, h), (0, h)]
    H, err, _ = solve(clicks, scr, w)
    log("Qo'lda kalibrovka saqlandi")
    return H


def board_quad(H, rect):
    """Projected screen corners in camera coordinates."""
    _, _, w, h = rect
    Hi = np.linalg.inv(H)
    c = np.float32([[0, 0], [w, 0], [w, h], [0, h]]).reshape(-1, 1, 2)
    return cv2.perspectiveTransform(c, Hi).reshape(-1, 2)


def cam_to_screen(H, pt, rect, margin=0.03):
    x, y, w, h = rect
    p = cv2.perspectiveTransform(np.float32([[pt]]), H)[0, 0]
    px, py = float(p[0]), float(p[1])
    if px < -margin * w or py < -margin * h or px > w * (1 + margin) or py > h * (1 + margin):
        return None
    px = min(max(px, 0.0), w - 1.0)
    py = min(max(py, 0.0), h - 1.0)
    return (px + x, py + y)


def save(path, H, rect, frame_shape, cam_index):
    data = {"H": np.asarray(H).tolist(), "screen_rect": list(rect),
            "frame_size": [int(frame_shape[1]), int(frame_shape[0])], "camera": cam_index}
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def load(path, rect, frame_shape, cam_index):
    if not os.path.exists(path):
        return None
    try:
        with open(path, encoding="utf-8") as f:
            d = json.load(f)
        if d.get("screen_rect") != list(rect) or d.get("camera") != cam_index:
            return None
        if d.get("frame_size") != [int(frame_shape[1]), int(frame_shape[0])]:
            return None
        return np.array(d["H"], np.float64)
    except Exception:
        return None
