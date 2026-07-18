"""
Creates a proper app icon:
- Navy blue background (#0d1b4b)
- White logo centered with padding (so all parts are visible in adaptive icon safe zone)
- Output: frontend/resources/icon.png (1024x1024)
"""
from PIL import Image, ImageDraw
import sys

ICON_SIZE = 1024
BG_COLOR = (13, 27, 75)      # #0d1b4b navy blue
LOGO_COLOR = (255, 255, 255)  # white

# Load logo
logo = Image.open("frontend/public/logo.png").convert("RGBA")

# Convert logo to white: replace all colored pixels with white, keep alpha
r, g, b, a = logo.split()
white_logo = Image.merge("RGBA", (
    Image.new("L", logo.size, 255),  # R=255
    Image.new("L", logo.size, 255),  # G=255
    Image.new("L", logo.size, 255),  # B=255
    a                                  # keep original alpha
))

# Create navy blue background
icon = Image.new("RGBA", (ICON_SIZE, ICON_SIZE), BG_COLOR + (255,))

# Scale logo to fit within 52% of icon (leaving 24% padding each side)
# Adaptive icon safe zone is center 66% — we use 52% to be safe
max_logo_size = int(ICON_SIZE * 0.52)
logo_w, logo_h = white_logo.size
scale = min(max_logo_size / logo_w, max_logo_size / logo_h)
new_w = int(logo_w * scale)
new_h = int(logo_h * scale)
white_logo_resized = white_logo.resize((new_w, new_h), Image.LANCZOS)

# Center logo
x = (ICON_SIZE - new_w) // 2
y = (ICON_SIZE - new_h) // 2

# Paste white logo onto navy background
icon.paste(white_logo_resized, (x, y), white_logo_resized)

# Save as PNG
out_path = "frontend/resources/icon.png"
icon.convert("RGB").save(out_path, "PNG")
print(f"Saved: {out_path} ({ICON_SIZE}x{ICON_SIZE})")
print(f"Logo size in icon: {new_w}x{new_h} at ({x},{y})")
