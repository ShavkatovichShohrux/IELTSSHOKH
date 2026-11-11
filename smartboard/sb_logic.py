"""Smoothing (One Euro filter) and the touch state machine shared by all trackers."""
import math


class _LowPass:
    def __init__(self):
        self.y = None

    def __call__(self, x, a):
        self.y = x if self.y is None else a * x + (1 - a) * self.y
        return self.y


class OneEuro2D:
    """One Euro filter (Casiez et al. 2012): smooth when still, responsive when moving."""

    def __init__(self, min_cutoff=1.2, beta=0.015, d_cutoff=1.0):
        self.min_cutoff, self.beta, self.d_cutoff = min_cutoff, beta, d_cutoff
        self.reset()

    def reset(self):
        self.t = None
        self.fx = [_LowPass(), _LowPass()]
        self.fdx = [_LowPass(), _LowPass()]
        self.prev = None

    @staticmethod
    def _alpha(cutoff, dt):
        tau = 1.0 / (2 * math.pi * cutoff)
        return 1.0 / (1.0 + tau / dt)

    def __call__(self, p, t):
        if self.t is None or t <= self.t:
            self.t, self.prev = t, p
            self.fx[0](p[0], 1.0)
            self.fx[1](p[1], 1.0)
            return p
        dt = t - self.t
        self.t = t
        out = []
        for i in range(2):
            dx = (p[i] - self.prev[i]) / dt
            edx = self.fdx[i](dx, self._alpha(self.d_cutoff, dt))
            cutoff = self.min_cutoff + self.beta * abs(edx)
            out.append(self.fx[i](p[i], self._alpha(cutoff, dt)))
        self.prev = p
        return (out[0], out[1])


def _dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


class TouchLogic:
    """Turns noisy per-frame observations into clean down/move/up/click/hover events.

    update(t, point, contact):
        point   - (x, y) in screen pixels or None if nothing seen
        contact - True if the tracker believes the surface is pressed
                  (pen light on / pinch), False for hover-only.
    Returns a list of (event, x, y) where event in hover|down|move|up|click.
    """

    def __init__(self, screen_w, cfg):
        self.down_frames = int(cfg.get("down_frames", 2))
        self.up_frames = int(cfg.get("up_frames", 3))
        self.slop = float(cfg.get("click_slop", 0.012)) * screen_w
        self.dwell_enabled = bool(cfg.get("dwell_click", True))
        self.dwell_time = float(cfg.get("dwell_time", 0.8))
        self.dwell_radius = float(cfg.get("dwell_radius", 0.018)) * screen_w
        self.gap_reset = 0.3
        self.filter = OneEuro2D(cfg.get("smooth_min_cutoff", 1.2), cfg.get("smooth_beta", 0.015))
        self.reset()

    def reset(self):
        self.touching = False
        self.contact_run = 0
        self.lost_run = 0
        self.anchor = None
        self.dragging = False
        self.last_out = None
        self.last_seen_t = None
        self.dwell_anchor = None
        self.dwell_start = 0.0
        self.dwell_armed = True
        self.dwell_progress = 0.0
        self.filter.reset()

    def release(self):
        """Force-up (e.g. when pausing). Returns events."""
        ev = []
        if self.touching and self.last_out is not None:
            ev.append(("up",) + self.last_out)
        self.reset()
        return ev

    def update(self, t, point, contact):
        ev = []
        if point is not None:
            if self.last_seen_t is not None and t - self.last_seen_t > self.gap_reset:
                self.filter.reset()
            self.last_seen_t = t
            p = self.filter(point, t)
        else:
            p = None

        pressed = p is not None and bool(contact)

        if self.touching:
            if pressed:
                self.lost_run = 0
                if not self.dragging and _dist(p, self.anchor) > self.slop:
                    self.dragging = True
                out = p if self.dragging else self.anchor
                self.last_out = (out[0], out[1])
                ev.append(("move",) + self.last_out)
            else:
                self.lost_run += 1
                if self.lost_run >= self.up_frames:
                    ev.append(("up",) + self.last_out)
                    self.touching = False
                    self.contact_run = 0
                    self.dwell_armed = False  # don't dwell-click right after a tap
                    self.dwell_anchor = None
                elif self.last_out is not None:
                    ev.append(("move",) + self.last_out)  # keep contact alive
            return ev

        if pressed:
            self.contact_run += 1
            if self.contact_run == 1:
                self.first_p = p  # touch starts where the light first appeared
            if self.contact_run >= self.down_frames:
                self.touching = True
                self.lost_run = 0
                self.anchor = self.first_p
                self.dragging = _dist(p, self.anchor) > self.slop
                self.dwell_progress = 0.0
                ev.append(("down", self.anchor[0], self.anchor[1]))
                out = p if self.dragging else self.anchor
                self.last_out = (out[0], out[1])
                if self.dragging:
                    ev.append(("move",) + self.last_out)
            return ev
        self.contact_run = 0

        if p is None:
            self.dwell_anchor = None
            self.dwell_progress = 0.0
            self.dwell_armed = True
            return ev

        ev.append(("hover", p[0], p[1]))
        if self.dwell_enabled:
            if self.dwell_anchor is None or _dist(p, self.dwell_anchor) > self.dwell_radius:
                if self.dwell_anchor is not None:
                    self.dwell_armed = True
                self.dwell_anchor = p
                self.dwell_start = t
                self.dwell_progress = 0.0
            elif self.dwell_armed:
                self.dwell_progress = min(1.0, (t - self.dwell_start) / self.dwell_time)
                if self.dwell_progress >= 1.0:
                    ev.append(("click", self.dwell_anchor[0], self.dwell_anchor[1]))
                    self.dwell_armed = False
                    self.dwell_progress = 0.0
        return ev
