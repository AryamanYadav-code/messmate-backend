from pathlib import Path
import math
import random
import textwrap

from PIL import Image, ImageDraw, ImageFont


WIDTH = 1800
HEIGHT = 1400
MARGIN_X = 80
TOP_MARGIN = 140
BOTTOM_MARGIN = 70
GAP_X = 40
GAP_Y = 35
COLS = 3
ROWS = 3
BOX_W = (WIDTH - (2 * MARGIN_X) - (GAP_X * (COLS - 1))) // COLS
BOX_H = (HEIGHT - TOP_MARGIN - BOTTOM_MARGIN - (GAP_Y * (ROWS - 1))) // ROWS

BG_TOP = (254, 247, 224)
BG_BOTTOM = (248, 233, 203)
BOX_FILL = (255, 252, 243)
INK = (50, 39, 31)
BLUE = (76, 126, 168)
GREEN = (92, 148, 92)
ORANGE = (222, 145, 79)
RED = (202, 92, 88)
YELLOW = (242, 206, 95)
GRAY = (120, 120, 120)

RANDOM = random.Random(11)


PANELS = [
    {
        "title": "1. LOGIN PAGE",
        "color": BLUE,
        "icon": "login",
        "text": "Student logs in with college ID and password to access mess services.",
    },
    {
        "title": "2. HOME SCREEN",
        "color": BLUE,
        "icon": "home",
        "text": "Dashboard shows Menu, Book Meal, Feedback and Profile options.",
    },
    {
        "title": "3. DAILY MENU",
        "color": ORANGE,
        "icon": "menu",
        "text": "Students can check breakfast, lunch and dinner items for the day.",
    },
    {
        "title": "4. MEAL BOOKING",
        "color": BLUE,
        "icon": "booking",
        "text": "Student confirms whether they will eat or skip that meal.",
    },
    {
        "title": "5. NOTIFICATION",
        "color": ORANGE,
        "icon": "notification",
        "text": "App sends reminders for meal timings, menu changes and booking alerts.",
    },
    {
        "title": "6. FEEDBACK",
        "color": BLUE,
        "icon": "feedback",
        "text": "Students rate food quality and share complaints or suggestions.",
    },
    {
        "title": "7. WASTE CONTROL",
        "color": GREEN,
        "icon": "waste",
        "text": "Booking data helps prepare only the needed food and reduce wastage.",
    },
    {
        "title": "8. ADMIN PANEL",
        "color": BLUE,
        "icon": "admin",
        "text": "Mess staff checks bookings, updates the menu and manages complaints.",
    },
    {
        "title": "9. HEALTHY FOOD",
        "color": GREEN,
        "icon": "health",
        "text": "Nutrition-friendly meal choices encourage healthy eating habits.",
    },
]


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = []
    if bold:
        candidates.extend(
            [
                r"C:\Windows\Fonts\comicbd.ttf",
                r"C:\Windows\Fonts\trebucbd.ttf",
                r"C:\Windows\Fonts\arialbd.ttf",
            ]
        )
    else:
        candidates.extend(
            [
                r"C:\Windows\Fonts\comic.ttf",
                r"C:\Windows\Fonts\comicbd.ttf",
                r"C:\Windows\Fonts\trebuc.ttf",
                r"C:\Windows\Fonts\arial.ttf",
            ]
        )
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


TITLE_FONT = load_font(44, bold=True)
SUBTITLE_FONT = load_font(24, bold=False)
BOX_TITLE_FONT = load_font(26, bold=True)
BODY_FONT = load_font(22, bold=False)


def draw_gradient_background(image: Image.Image) -> None:
    draw = ImageDraw.Draw(image)
    for y in range(HEIGHT):
        ratio = y / max(1, HEIGHT - 1)
        color = tuple(
            int(BG_TOP[i] * (1 - ratio) + BG_BOTTOM[i] * ratio) for i in range(3)
        )
        draw.line((0, y, WIDTH, y), fill=color)


def rough_line(draw: ImageDraw.ImageDraw, p1, p2, fill, width=3, wiggle=3, steps=7):
    points = []
    for i in range(steps + 1):
        t = i / steps
        x = p1[0] * (1 - t) + p2[0] * t
        y = p1[1] * (1 - t) + p2[1] * t
        if 0 < i < steps:
            x += RANDOM.randint(-wiggle, wiggle)
            y += RANDOM.randint(-wiggle, wiggle)
        points.append((x, y))
    draw.line(points, fill=fill, width=width)


def rough_rect(draw: ImageDraw.ImageDraw, box, outline, fill=None, width=3):
    x1, y1, x2, y2 = box
    if fill:
        draw.rounded_rectangle(box, radius=22, fill=fill)
    rough_line(draw, (x1, y1), (x2, y1), outline, width=width)
    rough_line(draw, (x2, y1), (x2, y2), outline, width=width)
    rough_line(draw, (x2, y2), (x1, y2), outline, width=width)
    rough_line(draw, (x1, y2), (x1, y1), outline, width=width)


def draw_arrow(draw: ImageDraw.ImageDraw, start, end):
    rough_line(draw, start, end, fill=INK, width=4, wiggle=2)
    angle = math.atan2(end[1] - start[1], end[0] - start[0])
    for delta in (math.pi / 8, -math.pi / 8):
        tip = (
            end[0] - 20 * math.cos(angle + delta),
            end[1] - 20 * math.sin(angle + delta),
        )
        rough_line(draw, end, tip, fill=INK, width=4, wiggle=2)


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font, max_width: int):
    words = text.split()
    lines = []
    current = []
    for word in words:
        test = " ".join(current + [word])
        width = draw.textbbox((0, 0), test, font=font)[2]
        if width <= max_width or not current:
            current.append(word)
        else:
            lines.append(" ".join(current))
            current = [word]
    if current:
        lines.append(" ".join(current))
    return lines


def centered_text(draw: ImageDraw.ImageDraw, x1, x2, y, text, font, fill):
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    draw.text(((x1 + x2 - w) / 2, y), text, font=font, fill=fill)


def icon_login(draw: ImageDraw.ImageDraw, area):
    x1, y1, x2, y2 = area
    cx = (x1 + x2) / 2
    cy = (y1 + y2) / 2
    draw.rounded_rectangle((cx - 85, cy - 55, cx + 30, cy + 65), radius=18, outline=BLUE, width=5)
    draw.ellipse((cx - 50, cy - 25, cx - 5, cy + 20), outline=INK, width=4)
    draw.arc((cx - 65, cy + 5, cx + 10, cy + 60), start=200, end=340, fill=INK, width=4)
    draw.rectangle((cx + 48, cy - 14, cx + 94, cy + 14), outline=GREEN, width=5)
    draw.polygon([(cx + 94, cy), (cx + 70, cy - 20), (cx + 70, cy + 20)], fill=GREEN)


def icon_home(draw: ImageDraw.ImageDraw, area):
    x1, y1, x2, y2 = area
    cx = (x1 + x2) / 2
    cy = (y1 + y2) / 2
    draw.rounded_rectangle((cx - 80, cy - 52, cx + 80, cy + 60), radius=18, outline=BLUE, width=5)
    for row in range(2):
        for col in range(2):
            rx = cx - 48 + col * 54
            ry = cy - 25 + row * 45
            draw.rounded_rectangle((rx, ry, rx + 36, ry + 26), radius=7, outline=ORANGE if col == 0 else GREEN, width=4)


def icon_menu(draw: ImageDraw.ImageDraw, area):
    x1, y1, x2, y2 = area
    cx = (x1 + x2) / 2
    cy = (y1 + y2) / 2
    draw.ellipse((cx - 82, cy - 54, cx + 82, cy + 54), outline=ORANGE, width=5)
    draw.ellipse((cx - 56, cy - 28, cx + 56, cy + 28), outline=INK, width=3)
    draw.arc((cx - 90, cy - 65, cx + 10, cy + 25), 10, 80, fill=GREEN, width=5)
    draw.line((cx + 100, cy - 48, cx + 100, cy + 46), fill=INK, width=5)
    draw.line((cx + 130, cy - 48, cx + 130, cy + 46), fill=INK, width=5)
    for fx in (cx + 116, cx + 123, cx + 130):
        draw.line((fx, cy - 48, fx, cy - 20), fill=INK, width=4)


def icon_booking(draw: ImageDraw.ImageDraw, area):
    x1, y1, x2, y2 = area
    cx = (x1 + x2) / 2
    cy = (y1 + y2) / 2
    draw.rounded_rectangle((cx - 90, cy - 58, cx + 55, cy + 58), radius=18, outline=BLUE, width=5)
    for i in range(3):
        y = cy - 25 + i * 28
        draw.line((cx - 68, y, cx - 10, y), fill=INK, width=4)
    draw.rectangle((cx + 10, cy - 18, cx + 55, cy + 18), outline=GREEN, width=4)
    draw.line((cx + 18, cy, cx + 28, cy + 12), fill=GREEN, width=4)
    draw.line((cx + 28, cy + 12, cx + 47, cy - 12), fill=GREEN, width=4)


def icon_notification(draw: ImageDraw.ImageDraw, area):
    x1, y1, x2, y2 = area
    cx = (x1 + x2) / 2
    cy = (y1 + y2) / 2
    draw.arc((cx - 55, cy - 62, cx + 55, cy + 45), 200, 340, fill=ORANGE, width=6)
    draw.line((cx - 38, cy + 10, cx + 38, cy + 10), fill=ORANGE, width=6)
    draw.ellipse((cx - 9, cy + 20, cx + 9, cy + 38), fill=INK)
    for offset in (-85, 85):
        draw.arc((cx + offset - 30, cy - 45, cx + offset + 30, cy + 15), 260, 100, fill=BLUE, width=4)


def icon_feedback(draw: ImageDraw.ImageDraw, area):
    x1, y1, x2, y2 = area
    cx = (x1 + x2) / 2
    cy = (y1 + y2) / 2
    draw.rounded_rectangle((cx - 86, cy - 52, cx + 54, cy + 38), radius=18, outline=BLUE, width=5)
    draw.polygon([(cx - 20, cy + 38), (cx - 6, cy + 70), (cx + 8, cy + 38)], outline=BLUE, fill=BOX_FILL)
    for i in range(3):
        star_x = cx - 55 + i * 42
        draw_regular_star(draw, (star_x, cy - 8), 14, 7, YELLOW)


def draw_regular_star(draw: ImageDraw.ImageDraw, center, outer_r, inner_r, fill):
    cx, cy = center
    points = []
    for i in range(10):
        angle = -math.pi / 2 + i * math.pi / 5
        r = outer_r if i % 2 == 0 else inner_r
        points.append((cx + math.cos(angle) * r, cy + math.sin(angle) * r))
    draw.polygon(points, fill=fill, outline=INK)


def icon_waste(draw: ImageDraw.ImageDraw, area):
    x1, y1, x2, y2 = area
    cx = (x1 + x2) / 2
    cy = (y1 + y2) / 2
    draw.rectangle((cx - 42, cy - 18, cx + 42, cy + 58), outline=GREEN, width=5)
    draw.rectangle((cx - 55, cy - 35, cx + 55, cy - 15), outline=INK, width=4)
    draw.line((cx - 18, cy - 45, cx + 18, cy - 45), fill=INK, width=4)
    draw.arc((cx + 55, cy - 25, cx + 140, cy + 60), 30, 300, fill=GREEN, width=5)
    draw.polygon([(cx + 136, cy + 24), (cx + 108, cy + 12), (cx + 120, cy + 40)], fill=GREEN)


def icon_admin(draw: ImageDraw.ImageDraw, area):
    x1, y1, x2, y2 = area
    cx = (x1 + x2) / 2
    cy = (y1 + y2) / 2
    draw.ellipse((cx - 88, cy - 38, cx - 34, cy + 16), outline=INK, width=4)
    draw.arc((cx - 104, cy + 3, cx - 18, cy + 72), 200, 340, fill=INK, width=4)
    draw.rounded_rectangle((cx + 10, cy - 50, cx + 118, cy + 36), radius=12, outline=BLUE, width=5)
    for idx, h in enumerate((36, 56, 26)):
        px = cx + 24 + idx * 24
        draw.rectangle((px, cy + 14 - h, px + 14, cy + 14), fill=(ORANGE if idx != 1 else GREEN))


def icon_health(draw: ImageDraw.ImageDraw, area):
    x1, y1, x2, y2 = area
    cx = (x1 + x2) / 2
    cy = (y1 + y2) / 2
    draw.ellipse((cx - 88, cy - 38, cx - 28, cy + 22), fill=(232, 100, 80), outline=INK, width=3)
    draw.polygon([(cx - 52, cy - 50), (cx - 38, cy - 72), (cx - 20, cy - 54)], fill=GREEN, outline=INK)
    draw.ellipse((cx + 14, cy - 18, cx + 88, cy + 50), outline=GREEN, width=5)
    for angle in (0, 60, 120):
        a = math.radians(angle)
        draw.line((cx + 51, cy + 16, cx + 51 + math.cos(a) * 32, cy + 16 + math.sin(a) * 32), fill=GREEN, width=3)


ICON_MAP = {
    "login": icon_login,
    "home": icon_home,
    "menu": icon_menu,
    "booking": icon_booking,
    "notification": icon_notification,
    "feedback": icon_feedback,
    "waste": icon_waste,
    "admin": icon_admin,
    "health": icon_health,
}


def draw_panel(draw: ImageDraw.ImageDraw, box, panel):
    x1, y1, x2, y2 = box
    rough_rect(draw, box, outline=INK, fill=BOX_FILL, width=3)
    draw.rounded_rectangle((x1 + 18, y1 + 15, x2 - 18, y1 + 56), radius=14, fill=panel["color"])
    centered_text(draw, x1 + 20, x2 - 20, y1 + 22, panel["title"], BOX_TITLE_FONT, BOX_FILL)

    icon_area = (x1 + 45, y1 + 70, x2 - 45, y1 + 180)
    ICON_MAP[panel["icon"]](draw, icon_area)

    lines = wrap_text(draw, panel["text"], BODY_FONT, max_width=BOX_W - 65)
    text_y = y1 + 194
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=BODY_FONT)
        line_w = bbox[2] - bbox[0]
        draw.text(((x1 + x2 - line_w) / 2, text_y), line, font=BODY_FONT, fill=INK)
        text_y += 31


def main():
    image = Image.new("RGB", (WIDTH, HEIGHT), BG_TOP)
    draw_gradient_background(image)
    draw = ImageDraw.Draw(image)

    centered_text(draw, 0, WIDTH, 28, "COLLEGE MESS APP STORYBOARD", TITLE_FONT, INK)
    centered_text(
        draw,
        0,
        WIDTH,
        82,
        "Hand-drawn style poster with app flow, icons and short explanation",
        SUBTITLE_FONT,
        GRAY,
    )

    boxes = []
    for index, panel in enumerate(PANELS):
        row = index // COLS
        col = index % COLS
        x1 = MARGIN_X + col * (BOX_W + GAP_X)
        y1 = TOP_MARGIN + row * (BOX_H + GAP_Y)
        box = (x1, y1, x1 + BOX_W, y1 + BOX_H)
        boxes.append(box)
        draw_panel(draw, box, panel)

    for row in range(ROWS):
        left = boxes[row * 3]
        middle = boxes[row * 3 + 1]
        right = boxes[row * 3 + 2]
        y = (left[1] + left[3]) / 2
        draw_arrow(draw, (left[2] + 10, y), (middle[0] - 10, y))
        draw_arrow(draw, (middle[2] + 10, y), (right[0] - 10, y))

    for col in range(COLS):
        top = boxes[col]
        mid = boxes[col + 3]
        bottom = boxes[col + 6]
        x = (top[0] + top[2]) / 2
        draw_arrow(draw, (x, top[3] + 8), (x, mid[1] - 8))
        draw_arrow(draw, (x, mid[3] + 8), (x, bottom[1] - 8))

    output_dir = Path("E:/PROJECT_ALPHA/report_assets/handdrawn_charts")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "college_mess_app_storyboard_chart.png"
    image.save(output_path, format="PNG")
    print(output_path)


if __name__ == "__main__":
    main()
