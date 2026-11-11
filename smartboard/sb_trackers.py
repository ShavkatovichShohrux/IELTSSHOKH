"""Trackers: find the pointer in the camera image.

PenTracker  - bright light spot (IR pen, LED pen, laser pointer, phone torch).
              Most stable: works in any light, light on = pressed.
HandTracker - index fingertip via MediaPipe Tasks API (no extra hardware).
              Hover follows the finger; click = hold still (dwell) or pinch.
"""
import math
import os
import urllib.request

import cv2
import numpy as np

MODEL_URL = ("https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
             "hand_landmarker/float16/latest/hand_landmarker.task")


def _board_mask(shape, quad, expand=0.04):
    h, w = shape[:2]
    mask = np.zeros((h, w), np.uint8)
    if quad is None:
        mask[:] = 255
        return mask
    q = np.asarray(quad, np.float32)
    c = q.mean(axis=0)
    q = c + (q - c) * (1.0 + expand)
    cv2.fillConvexPoly(mask, q.astype(np.int32), 255)
    return mask


class PenTracker:
    name = "pen"

    def __init__(self, cfg):
        self.abs_thr = float(cfg.get("pen_threshold", 200))
        self.delta = float(cfg.get("pen_delta", 50))
        self.min_area = int(cfg.get("pen_min_area", 2))
        self.max_area_frac = float(cfg.get("pen_max_area", 0.004))
        self.contact_by_light = cfg.get("pen_action", "touch") == "touch"
        self.quad = None
        self.mask = None
        self.bg = None
        self.debug = None
        self.prev = None       # last pen position (camera px) or None
        self.suppress = 0      # frames to ignore NEW blobs after a slide change
        self.content_level = 0.0  # brightness of the brightest projected content
        self.frame_no = 0

    def set_board(self, quad):
        self.quad = quad
        self.mask = None
        self.bg = None
        self.prev = None
        self.content_level = 0.0

    def process(self, frame, t_ms):
        # max over channels: catches white/IR as well as red/green/blue LEDs & lasers
        gray = cv2.max(cv2.max(frame[:, :, 0], frame[:, :, 1]), frame[:, :, 2])
        if self.mask is None or self.mask.shape != gray.shape:
            self.mask = _board_mask(gray.shape, self.quad)
            self.board_area = max(1, int(cv2.countNonZero(self.mask)))
        g = gray.astype(np.float32)
        if self.bg is None:
            self.bg = g.copy()

        # Self-tuning floor: the pen must be brighter than the brightest projected
        # content (99th percentile of the board). A pen dot is far below 1% of the area.
        self.frame_no += 1
        if self.frame_no % 5 == 1:
            vals = g[self.mask > 0][::7]
            if vals.size:
                lvl = float(np.percentile(vals, 99))
                self.content_level = lvl if lvl > self.content_level else 0.9 * self.content_level + 0.1 * lvl
        floor = min(250.0, max(self.abs_thr, self.content_level + 15.0))
        # ...and brighter than what is normally projected at that very pixel;
        # capped at 250 so a saturated LED is still found on a bright white slide
        thr = np.maximum(np.minimum(self.bg + self.delta, 250.0), floor)
        cand = (((g > thr) & (g > self.bg + 4.0)).astype(np.uint8) * 255) & self.mask
        # Did the projected picture itself change (page flip, scroll, video)?
        changed = cv2.countNonZero(((cv2.absdiff(g, self.bg) > 40).astype(np.uint8)) & self.mask)
        big_change = changed > 0.01 * self.board_area
        if big_change:
            self.suppress = 3
        n, labels, stats, cents = cv2.connectedComponentsWithStats(cand, connectivity=8)
        max_area = max(self.min_area + 1, self.max_area_frac * self.board_area)
        best, best_score = None, -1.0
        total_cand = 0
        for i in range(1, n):
            area = stats[i, cv2.CC_STAT_AREA]
            total_cand += area
            if area < self.min_area or area > max_area:
                continue
            x, y, w, h = stats[i, :4]
            roi = g[y:y + h, x:x + w]
            peak = float(roi.max())
            score = peak * 4 + area
            if self.prev is not None:  # while drawing, stick to the same blob
                score -= 0.5 * float(np.hypot(cents[i][0] - self.prev[0], cents[i][1] - self.prev[1]))
            if score > best_score:
                best_score, best = score, i

        point = None
        busy = np.zeros_like(cand)
        if best is not None and self.prev is None and self.suppress > 0:
            best = None  # a "new light" appearing during a slide change = phantom, ignore
        if best is not None:
            x, y, w, h = stats[best, :4]
            sel = (labels[y:y + h, x:x + w] == best)
            wts = (g[y:y + h, x:x + w] - thr[y:y + h, x:x + w]) * sel
            wts = np.clip(wts, 0, None) + sel * 1e-3
            ys, xs = np.mgrid[y:y + h, x:x + w]
            s = wts.sum()
            point = (float((xs * wts).sum() / s), float((ys * wts).sum() / s))
            pad = max(w, h) + 6
            cv2.rectangle(busy, (int(x - pad), int(y - pad)), (int(x + w + pad), int(y + h + pad)), 255, -1)

        # Background adapts to the projected content, but not where the pen is.
        alpha = 0.5 if (big_change or total_cand > max_area * 3) else 0.06  # content changed -> learn fast
        upd = cv2.bitwise_not(busy)
        cv2.accumulateWeighted(g, self.bg, alpha, mask=upd)
        if self.suppress > 0 and not big_change:
            self.suppress -= 1
        self.prev = point

        self.debug = cand
        if point is None:
            return None, False, {}
        return point, self.contact_by_light, {}

    def calibrate_threshold(self, frames):
        """Learn threshold from frames with NO pen visible (normal slide on screen)."""
        mx = 0.0
        for f in frames:
            gray = cv2.max(cv2.max(f[:, :, 0], f[:, :, 1]), f[:, :, 2])
            if self.mask is not None and self.mask.shape == gray.shape:
                gray = cv2.bitwise_and(gray, self.mask)
            mx = max(mx, float(np.percentile(gray, 99.9)))
        self.abs_thr = min(250.0, mx + 25.0)
        return self.abs_thr


def ensure_model(path):
    if os.path.exists(path) and os.path.getsize(path) > 1_000_000:
        return path
    os.makedirs(os.path.dirname(path), exist_ok=True)
    print("[hand] Model yuklab olinmoqda:", MODEL_URL)
    tmp = path + ".part"
    urllib.request.urlretrieve(MODEL_URL, tmp)
    os.replace(tmp, path)
    return path


class HandTracker:
    name = "hand"
    TIP, THUMB, WRIST, MID_MCP = 8, 4, 0, 9

    def __init__(self, cfg, model_path):
        # New Tasks API. The old `mp.solutions.hands` was REMOVED in mediapipe>=0.10.30,
        # which is why older scripts crash with "module 'mediapipe' has no attribute 'solutions'".
        import mediapipe as mp
        from mediapipe.tasks.python import vision
        from mediapipe.tasks.python.core.base_options import BaseOptions

        self.mp = mp
        ensure_model(model_path)
        opts = vision.HandLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=model_path),
            running_mode=vision.RunningMode.VIDEO,
            num_hands=2,
            min_hand_detection_confidence=float(cfg.get("hand_detect_conf", 0.5)),
            min_hand_presence_confidence=float(cfg.get("hand_presence_conf", 0.5)),
            min_tracking_confidence=float(cfg.get("hand_track_conf", 0.5)),
        )
        self.landmarker = vision.HandLandmarker.create_from_options(opts)
        self.pinch_enabled = bool(cfg.get("pinch_drag", True))
        self.pinch_on = float(cfg.get("pinch_on", 0.30))
        self.pinch_off = float(cfg.get("pinch_off", 0.42))
        self.pinched = False
        self.quad = None
        self.roi = None
        self.last_t = -1
        self.prev_tip = None
        self.debug = None

    def set_board(self, quad):
        self.quad = None if quad is None else np.asarray(quad, np.float32)
        self.roi = None

    def _roi(self, shape):
        h, w = shape[:2]
        if self.quad is None:
            return 0, 0, w, h
        x0, y0 = self.quad.min(axis=0)
        x1, y1 = self.quad.max(axis=0)
        mx, my = (x1 - x0) * 0.2, (y1 - y0) * 0.2  # hand/arm may stick out of the board
        x0, y0 = int(max(0, x0 - mx)), int(max(0, y0 - my))
        x1, y1 = int(min(w, x1 + mx)), int(min(h, y1 + my))
        if x1 - x0 < 64 or y1 - y0 < 64:
            return 0, 0, w, h
        return x0, y0, x1, y1

    def process(self, frame, t_ms):
        if self.roi is None:
            self.roi = self._roi(frame.shape)
        x0, y0, x1, y1 = self.roi
        crop = np.ascontiguousarray(frame[y0:y1, x0:x1, ::-1])  # BGR->RGB
        t_ms = int(t_ms)
        if t_ms <= self.last_t:
            t_ms = self.last_t + 1
        self.last_t = t_ms
        img = self.mp.Image(image_format=self.mp.ImageFormat.SRGB, data=crop)
        res = self.landmarker.detect_for_video(img, t_ms)
        cw, ch = x1 - x0, y1 - y0

        hands = []
        for lms in (res.hand_landmarks or []):
            pts = np.array([[l.x * cw + x0, l.y * ch + y0, l.z * cw] for l in lms], np.float32)
            hands.append(pts)
        self.debug = hands
        if not hands:
            self.pinched = False
            self.prev_tip = None
            return None, False, {"hands": hands}

        def inside(pts):
            if self.quad is None:
                return 0.0
            return cv2.pointPolygonTest(self.quad.reshape(-1, 1, 2), (float(pts[self.TIP, 0]), float(pts[self.TIP, 1])), True)

        def key(pts):
            d_in = inside(pts)
            d_prev = 0.0
            if self.prev_tip is not None:
                d_prev = math.hypot(pts[self.TIP, 0] - self.prev_tip[0], pts[self.TIP, 1] - self.prev_tip[1])
            return (d_in >= -10, -d_prev)

        pts = max(hands, key=key)
        tip = (float(pts[self.TIP, 0]), float(pts[self.TIP, 1]))
        self.prev_tip = tip

        contact = False
        if self.pinch_enabled:
            size = float(np.linalg.norm(pts[self.WRIST] - pts[self.MID_MCP])) + 1e-6
            d = float(np.linalg.norm(pts[self.TIP] - pts[self.THUMB])) / size
            if self.pinched and d > self.pinch_off:
                self.pinched = False
            elif not self.pinched and d < self.pinch_on:
                self.pinched = True
            contact = self.pinched
        return tip, contact, {"hands": hands}

    def close(self):
        try:
            self.landmarker.close()
        except Exception:
            pass
