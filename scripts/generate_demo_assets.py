"""Generate local, dependency-free demo artwork for MOMENTO.

Everything is drawn procedurally with Pillow: no external images, paid assets,
or stock services are involved. Re-run this script to refresh the artwork.

Usage:
    python scripts/generate_demo_assets.py
"""

from __future__ import annotations

import math
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
COVERS = ROOT / "frontend" / "public" / "demo"
SAMPLES = ROOT / "frontend" / "public" / "samples"
W, H = 1200, 1500
S = 2  # Supersample factor for silky edges.

FONT_CN = "C:/Windows/Fonts/msyh.ttc"
FONT_CN_BOLD = "C:/Windows/Fonts/msyhbd.ttc"
FONT_EN = "C:/Windows/Fonts/segoeui.ttf"
FONT_EN_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
FONT_SERIF = "C:/Windows/Fonts/georgia.ttf"


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size * S)


def hx(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def blend(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def gradient(top: str, bottom: str, width: int = W, height: int = H) -> Image.Image:
    channels = np.array([hx(top), hx(bottom)], dtype=np.float64)
    t = np.linspace(0.0, 1.0, height)[:, None, None]
    arr = channels[0] * (1 - t) + channels[1] * t
    arr = np.repeat(arr, width, axis=1)
    return Image.fromarray(arr.astype(np.uint8), "RGB").resize((width, height), Image.Resampling.BICUBIC)


def add_grain(image: Image.Image, amount: int = 9, seed: int = 1) -> Image.Image:
    arr = np.asarray(image).astype(np.int16)
    rng = np.random.default_rng(seed)
    noise = rng.normal(0, amount, (image.height, image.width, 1))
    out = np.clip(arr + noise, 0, 255).astype(np.uint8)
    return Image.fromarray(out, "RGB")


def soft_glow(base: Image.Image, box, color, blur=60, alpha=100) -> Image.Image:
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse(box, fill=(*hx(color), alpha))
    layer = layer.filter(ImageFilter.GaussianBlur(blur * S))
    return Image.alpha_composite(base.convert("RGBA"), layer).convert("RGB")


def blur_layer(size, draw_fn, blur=10):
    layer = Image.new("RGBA", (size[0] * S, size[1] * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    draw_fn(d)
    layer = layer.filter(ImageFilter.GaussianBlur(blur * S))
    return layer


def base_canvas(top: str, bottom: str, seed: int, glow=None):
    image = gradient(top, bottom).convert("RGBA")
    image = image.resize((W * S, H * S), Image.Resampling.BICUBIC)
    if glow:
        box, color, alpha = glow
        image = soft_glow(image, [v * S for v in box], color, 70, alpha).convert("RGBA")
    return image


def finish(image: Image.Image, path: Path, seed: int, grain: int = 7, quality: int = 92):
    image = image.convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    image = add_grain(image, grain, seed)
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, quality=quality, optimize=True, progressive=True)
    print(f"wrote {path.relative_to(ROOT)}  ({path.stat().st_size // 1024} KB)")


def draw_text(d, xy, text, fnt, fill, anchor="la"):
    d.text((xy[0] * S, xy[1] * S), text, font=fnt, fill=(*hx(fill), 255) if isinstance(fill, str) else fill, anchor=anchor)


def tracked_text(d, xy, text, fnt, fill, tracking=2):
    x, y = xy
    for char in text:
        draw_text(d, (x, y), char, fnt, fill)
        x += d.textlength(char, font=fnt) / S + tracking


def rounded(d, box, radius, fill=None, outline=None, width=1):
    x0, y0, x1, y1 = [v * S for v in box]
    d.rounded_rectangle((x0, y0, x1, y1), radius=radius * S, fill=fill, outline=outline, width=width * S)


def line(d, points, fill, width=1):
    d.line([(x * S, y * S) for x, y in points], fill=fill, width=width * S, joint="curve")


def stamp(d, label="MOMENTO", fill="#241F1A", opacity=190):
    tracked_text(d, (72, 66), label, font(FONT_EN_BOLD, 15), fill)
    line(d, [(72, 104), (72 + 72, 104)], fill, 2)
    tracked_text(d, (72, 118), "STUDIO / CUSTOM EDITION", font(FONT_EN, 10), "#5C554B", 2)


def cover_postcard():
    img = base_canvas("#F0C7A9", "#D89573", 11, ((720, 80, 1180, 540), "#FFE1B5", 180))
    d = ImageDraw.Draw(img)
    d.ellipse((720 * S, 170 * S, 1040 * S, 490 * S), fill=(*hx("#E45F3C"), 255))
    d.ellipse((760 * S, 200 * S, 1000 * S, 440 * S), fill=(*hx("#F08A5E"), 255))
    # distant coast
    d.polygon([(0, 780 * S), (280 * S, 610 * S), (560 * S, 730 * S), (920 * S, 570 * S), (1200 * S, 700 * S), (1200 * S, 1040 * S), (0, 1040 * S)], fill=(*hx("#B9664A"), 255))
    d.polygon([(0, 870 * S), (330 * S, 760 * S), (680 * S, 860 * S), (1200 * S, 730 * S), (1200 * S, 1110 * S), (0, 1110 * S)], fill=(*hx("#8F4534"), 255))
    d.polygon([(0, 980 * S), (320 * S, 900 * S), (640 * S, 1010 * S), (1200 * S, 880 * S), (1200 * S, 1500 * S), (0, 1500 * S)], fill=(*hx("#4D3A31"), 255))
    # road ribbon
    d.polygon([(520 * S, 1500 * S), (760 * S, 1500 * S), (690 * S, 1090 * S), (630 * S, 1090 * S)], fill=(*hx("#D9BBA3"), 255))
    for i in range(7):
        y = 1110 + i * 58
        d.rectangle((642 * S, y * S, 650 * S, (y + 26) * S), fill=(*hx("#EFE3D2"), 210))
    # texture strokes
    for i in range(12):
        line(d, [(80, 1220 + i * 15), (380 - i * 8, 1210 + i * 15)], (*hx("#D8A181"), 70), 2)
    stamp(d, fill="#3B2C25")
    draw_text(d, (72, 1126), "旅行", font(FONT_CN_BOLD, 88), "#FFF4E6")
    draw_text(d, (72, 1228), "明信片", font(FONT_CN_BOLD, 88), "#FFF4E6")
    draw_text(d, (74, 1372), "TRAVEL NOTES  /  TWO FRAMES", font(FONT_EN, 18), "#EED2BF")
    draw_text(d, (74, 1410), "把一路上的风景与同行的人收进一张明信片", font(FONT_CN, 20), "#E8C6B2")
    # postage motif
    rounded(d, (982, 1240, 1128, 1388), 2, fill=None, outline=(*hx("#F8E8D7"), 190), width=2)
    draw_text(d, (1006, 1266), "M", font(FONT_SERIF, 68), "#F8E8D7")
    tracked_text(d, (1008, 1340), "POST", font(FONT_EN_BOLD, 11), "#F8E8D7", 2)
    return img


def cover_coffee():
    img = base_canvas("#EAE0D2", "#BFA98E", 22, ((300, 220, 900, 820), "#FFF4E4", 150))
    d = ImageDraw.Draw(img)
    # window light
    for i in range(4):
        d.polygon([(720 + i * 105, 0), (860 + i * 105, 0), (520 + i * 80, 1500), (380 + i * 80, 1500)], fill=(*hx("#F5EADB"), 34))
    # table
    d.rectangle((0, 1030 * S, W * S, H * S), fill=(*hx("#5D4432"), 255))
    d.rectangle((0, 1030 * S, W * S, 1062 * S), fill=(*hx("#7B5C44"), 255))
    # saucer and cup
    d.ellipse((290 * S, 830 * S, 910 * S, 1110 * S), fill=(*hx("#D9C7B2"), 255))
    d.ellipse((338 * S, 856 * S, 862 * S, 1076 * S), fill=(*hx("#B09478"), 255))
    d.ellipse((410 * S, 720 * S, 790 * S, 1050 * S), fill=(*hx("#F0E5D5"), 255))
    d.ellipse((452 * S, 746 * S, 748 * S, 1004 * S), fill=(*hx("#3A2418"), 255))
    d.ellipse((488 * S, 772 * S, 712 * S, 964 * S), fill=(*hx("#5E3B29"), 255))
    d.arc((640 * S, 790 * S, 810 * S, 980 * S), 270, 90, fill=(*hx("#E8DCCB"), 255), width=22 * S)
    # steam
    for offset in (0, 46, 92):
        points = []
        for i in range(40):
            t = i / 39
            points.append((560 + offset + math.sin(t * 5.2 + offset) * 26, 650 - t * 210))
        d.line([(x * S, y * S) for x, y in points], fill=(*hx("#F7EFE4"), 46), width=6 * S)
    # beans
    random.seed(3)
    for _ in range(9):
        x, y = random.randint(120, 1080), random.randint(1120, 1430)
        d.ellipse((x * S, y * S, (x + 30) * S, (y + 20) * S), fill=(*hx("#3C2517"), 255))
        d.arc((x * S, y * S, (x + 30) * S, (y + 20) * S), 250, 290, fill=(*hx("#8A6045"), 255), width=2 * S)
    stamp(d, fill="#3A2C20")
    draw_text(d, (72, 1120), "咖啡时光", font(FONT_CN_BOLD, 82), "#F6EDDF")
    draw_text(d, (74, 1232), "SLOW MORNING  /  ONE QUIET FRAME", font(FONT_EN, 18), "#E4D2BD")
    line(d, [(74, 1292), (244, 1292)], "#C79A70", 2)
    draw_text(d, (74, 1322), "给日常留一点不被催促的时间。", font(FONT_CN, 22), "#D8C5B1")
    draw_text(d, (74, 1404), "MOMENTO · NO. 02", font(FONT_EN_BOLD, 12), "#B99C80")
    return img


def cover_pet():
    img = base_canvas("#F2DCCF", "#D8B09A", 33, ((720, 160, 1140, 580), "#FFE9D7", 170))
    d = ImageDraw.Draw(img)
    # arch window
    rounded(d, (620, 140, 1080, 930), 230, fill=(*hx("#C9977F"), 110))
    # cat body and head
    d.ellipse((300 * S, 700 * S, 860 * S, 1120 * S), fill=(*hx("#D9A983"), 255))
    d.polygon([(392 * S, 560 * S), (446 * S, 350 * S), (560 * S, 500 * S)], fill=(*hx("#D9A983"), 255))
    d.polygon([(772 * S, 500 * S), (870 * S, 342 * S), (912 * S, 568 * S)], fill=(*hx("#D9A983"), 255))
    d.ellipse((368 * S, 402 * S, 932 * S, 900 * S), fill=(*hx("#E4B997"), 255))
    d.polygon([(450 * S, 566 * S), (486 * S, 430 * S), (552 * S, 526 * S)], fill=(*hx("#E9A6A0"), 255))
    d.polygon([(748 * S, 528 * S), (820 * S, 430 * S), (854 * S, 574 * S)], fill=(*hx("#E9A6A0"), 255))
    # eyes and nose
    d.arc((492 * S, 592 * S, 590 * S, 660 * S), 200, 340, fill=(*hx("#3B2B22"), 255), width=9 * S)
    d.arc((708 * S, 592 * S, 806 * S, 660 * S), 200, 340, fill=(*hx("#3B2B22"), 255), width=9 * S)
    d.polygon([(622 * S, 690 * S), (668 * S, 690 * S), (646 * S, 716 * S)], fill=(*hx("#9D5B52"), 255))
    d.arc((588 * S, 704 * S, 646 * S, 748 * S), 20, 150, fill=(*hx("#5F4135"), 255), width=5 * S)
    d.arc((648 * S, 704 * S, 706 * S, 748 * S), 30, 160, fill=(*hx("#5F4135"), 255), width=5 * S)
    # whiskers
    for dy in (-4, 18):
        line(d, [(520, 716 + dy), (410, 700 + dy)], (*hx("#7A5442"), 190), 3)
        line(d, [(774, 716 + dy), (886, 700 + dy)], (*hx("#7A5442"), 190), 3)
    # floor
    d.rectangle((0, 1080 * S, W * S, H * S), fill=(*hx("#B98D75"), 90))
    for i in range(5):
        line(d, [(70, 1150 + i * 62), (360, 1130 + i * 62)], (*hx("#8B5F49"), 65), 2)
    stamp(d, fill="#4B352B")
    draw_text(d, (72, 1116), "宠物纪念卡", font(FONT_CN_BOLD, 78), "#FFF4E7")
    draw_text(d, (74, 1222), "LITTLE COMPANION  /  THREE FRAMES", font(FONT_EN, 17), "#F3D9C8")
    draw_text(d, (74, 1280), "三个瞬间，足够记住一生的陪伴。", font(FONT_CN, 22), "#EDD0BD")
    return img


def cover_podcast():
    img = base_canvas("#39463F", "#17211C", 44, ((560, 50, 1240, 660), "#7F9A89", 95))
    d = ImageDraw.Draw(img)
    # concentric arcs
    for i in range(7):
        r = 280 + i * 92
        d.arc((820 - r, 430 - r, 820 + r, 430 + r), 118, 300, fill=(*hx("#A9C2AF"), 70 - i * 7), width=2 * S)
    # mic
    rounded(d, (438, 318, 658, 790), 110, fill=(*hx("#C9B89C"), 255))
    for row in range(9):
        for col in range(5):
            x = 474 + col * 32 + (16 if row % 2 else 0)
            y = 360 + row * 44
            d.ellipse((x * S, y * S, (x + 10) * S, (y + 10) * S), fill=(*hx("#5C5140"), 150))
    d.arc((400 * S, 340 * S, 696 * S, 860 * S), 0, 180, fill=(*hx("#D9C9AF"), 255), width=13 * S)
    line(d, [(548, 850), (548, 1010)], "#D9C9AF", 10)
    line(d, [(438, 1010), (658, 1010)], "#D9C9AF", 10)
    # audio bars
    heights = [28, 64, 40, 92, 56, 120, 74, 38, 86, 52, 30, 68]
    for i, height in enumerate(heights):
        line(d, [(110 + i * 34, 1210), (110 + i * 34, 1210 - height)], "#A9C2AF", 8)
    stamp(d, fill="#E7DCC8")
    draw_text(d, (72, 1050), "本周播客", font(FONT_CN_BOLD, 86), "#F1E6D1")
    draw_text(d, (74, 1160), "ON AIR / EP. 07", font(FONT_EN_BOLD, 21), "#C6D4C5")
    draw_text(d, (74, 1270), "一张照片，为声音留一个入口。", font(FONT_CN, 22), "#BFCBBE")
    draw_text(d, (74, 1402), "MOMENTO · SOUND & IMAGE", font(FONT_EN, 12), "#8FA18F")
    return img


def cover_summer():
    img = base_canvas("#9ED8D4", "#2E7775", 55, ((780, 40, 1240, 500), "#FFF2B8", 170))
    d = ImageDraw.Draw(img)
    d.ellipse((790 * S, 170 * S, 1030 * S, 410 * S), fill=(*hx("#F7DD87"), 255))
    # sea bands
    for i, color in enumerate(["#6DB9B2", "#4E9C98", "#347D7D"]):
        y = 620 + i * 170
        d.rectangle((0, y * S, W * S, (y + 170) * S), fill=(*hx(color), 255))
    for i in range(16):
        y = 640 + i * 32
        line(d, [(0, y + math.sin(i) * 12), (1200, y + math.cos(i) * 14)], (*hx("#D7F1E7"), 52), 2)
    # film frames
    random.seed(7)
    for idx, box in enumerate([(90, 820, 560, 1190), (620, 880, 1120, 1130), (160, 1230, 1040, 1420)]):
        rounded(d, box, 6, fill=(*hx("#F4EBDD"), 255))
        inner = (box[0] + 22, box[1] + 22, box[2] - 22, box[3] - 22)
        color = ["#C68462", "#6E9B93", "#D5B06B"][idx]
        rounded(d, inner, 2, fill=(*hx(color), 255))
        if idx == 0:
            d.ellipse((inner[0] + 80, inner[1] + 50, inner[0] + 310, inner[1] + 280), fill=(*hx("#F3D39D"), 200))
        if idx == 1:
            for k in range(5):
                line(d, [(inner[0] + 10, inner[1] + 40 + k * 30), (inner[2] - 10, inner[1] + 22 + k * 30)], (*hx("#E7F0E7"), 70), 3)
        if idx == 2:
            for k in range(9):
                d.ellipse(((inner[0] + 40 + k * 88) * S, (inner[1] + 32) * S, (inner[0] + 86 + k * 88) * S, (inner[1] + 78) * S), fill=(*hx("#F1E5D1"), 120))
    stamp(d, fill="#1E4B49")
    draw_text(d, (72, 1040), "夏日胶片", font(FONT_CN_BOLD, 82), "#F3F7EA")
    draw_text(d, (74, 1148), "SUMMER ROLL  /  03 FRAMES", font(FONT_EN, 18), "#D7ECE2")
    return img


def cover_brand():
    img = base_canvas("#E9E1D4", "#C5B6A4", 66, ((700, 120, 1180, 620), "#FBF4E8", 150))
    d = ImageDraw.Draw(img)
    # dark editorial panel
    rounded(d, (620, 120, 1128, 980), 4, fill=(*hx("#3A3028"), 255))
    d.rectangle((620 * S, 120 * S, 1128 * S, 276 * S), fill=(*hx("#4A3C30"), 255))
    tracked_text(d, (660, 160), "OUR / STORY", font(FONT_EN_BOLD, 28), "#E8D7C0", 3)
    # woven still life
    d.ellipse((690 * S, 400 * S, 1000 * S, 710 * S), fill=(*hx("#B9865D"), 255))
    d.ellipse((740 * S, 450 * S, 950 * S, 660 * S), fill=(*hx("#D7AE84"), 255))
    for i in range(18):
        d.arc((740 * S, 450 * S, 950 * S, 660 * S), 0 + i * 3, 300 + i * 3, fill=(*hx("#9A704E"), 90), width=2 * S)
    line(d, [(770, 330), (770, 390)], "#D8C6AB", 3)
    line(d, [(820, 320), (820, 390)], "#D8C6AB", 3)
    # paper cards left
    for i, (x, y, w) in enumerate([(90, 330, 390), (120, 700, 420), (80, 1030, 360)]):
        rounded(d, (x, y, x + w, y + 220), 2, fill=(*hx("#FAF5EA"), 255))
        tracked_text(d, (x + 26, y + 24), f"0{i + 1} / PROCESS", font(FONT_EN_BOLD, 12), "#7E6D5B", 2)
        line(d, [(x + 26, y + 60), (x + w - 26, y + 60)], "#D7C8B7", 1)
        for k in range(3):
            line(d, [(x + 26, y + 96 + k * 26), (x + w - 60, y + 96 + k * 26)], "#C9B8A6", 1)
    stamp(d, fill="#3B3028")
    draw_text(d, (72, 1268), "品牌故事", font(FONT_CN_BOLD, 86), "#3B2E25")
    draw_text(d, (74, 1382), "OUR STORY  /  TWO FRAMES", font(FONT_EN, 18), "#6F5C4B")
    draw_text(d, (74, 1422), "把起点、现场与坚持，讲成一张有画面的故事。", font(FONT_CN, 20), "#5E4B3C")
    return img


def cover_birthday(include_copy: bool = True):
    img = base_canvas("#F2D6D5", "#CDA0A2", 77, ((680, 80, 1180, 590), "#FFE9E1", 170))
    d = ImageDraw.Draw(img)
    random.seed(19)
    # flowers
    for cx, cy, size, color in [(840, 440, 160, "#E7B5B2"), (990, 640, 120, "#D99598"), (760, 760, 90, "#F1C9C3"), (1080, 330, 80, "#F6DAD3")]:
        for petal in range(8):
            angle = petal * math.pi / 4
            px = cx + math.cos(angle) * size * 0.52
            py = cy + math.sin(angle) * size * 0.52
            d.ellipse(((px - size * 0.34) * S, (py - size * 0.26) * S, (px + size * 0.34) * S, (py + size * 0.26) * S), fill=(*hx(color), 225))
        d.ellipse(((cx - size * 0.18) * S, (cy - size * 0.18) * S, (cx + size * 0.18) * S, (cy + size * 0.18) * S), fill=(*hx("#B77A61"), 255))
    for i in range(9):
        x = 120 + i * 118
        y = 280 + math.sin(i * 1.7) * 120
        d.ellipse((x * S, y * S, (x + 14) * S, (y + 14) * S), fill=(*hx("#F7E2D8"), 120))
    # envelope
    rounded(d, (100, 960, 700, 1280), 4, fill=(*hx("#F9E9E2"), 255))
    d.polygon([(100 * S, 960 * S), (400 * S, 1160 * S), (700 * S, 960 * S)], fill=(*hx("#EFD4CE"), 255))
    line(d, [(100, 960), (400, 1160)], "#C99B94", 2)
    line(d, [(700, 960), (400, 1160)], "#C99B94", 2)
    d.ellipse((354 * S, 1108 * S, 446 * S, 1200 * S), fill=(*hx("#C78878"), 255))
    draw_text(d, (400, 1154), "M", font(FONT_SERIF, 62), "#F7E5DC", "mm")
    stamp(d, fill="#5B3E3D")
    if include_copy:
        draw_text(d, (72, 632), "生日花笺", font(FONT_CN_BOLD, 86), "#4A302F")
        draw_text(d, (74, 748), "HAPPY DAY  /  A NOTE FOR YOU", font(FONT_EN, 18), "#714A47")
        draw_text(d, (74, 810), "为重要的人，认真说一句生日快乐。", font(FONT_CN, 22), "#68423F")
    return img


def sample_coast():
    img = base_canvas("#F4D7B4", "#D98D67", 101, ((700, 100, 1160, 500), "#FFE8C2", 180))
    img = img.resize((W * S, H * S), Image.Resampling.BICUBIC)
    d = ImageDraw.Draw(img)
    d.ellipse((760 * S, 180 * S, 980 * S, 400 * S), fill=(*hx("#F7B766"), 255))
    d.rectangle((0, 760 * S, W * S, 1150 * S), fill=(*hx("#4D8A90"), 255))
    for i in range(24):
        y = 770 + i * 16
        line(d, [(0, y + math.sin(i) * 8), (1200, y + math.cos(i) * 8)], (*hx("#B8D6CE"), 36), 2)
    d.polygon([(0, 720 * S), (260 * S, 520 * S), (520 * S, 700 * S), (760 * S, 560 * S), (1200 * S, 720 * S), (1200 * S, 900 * S), (0, 900 * S)], fill=(*hx("#9B7E67"), 255))
    d.polygon([(0, 1130 * S), (380 * S, 880 * S), (820 * S, 1040 * S), (1200 * S, 860 * S), (1200 * S, 1500 * S), (0, 1500 * S)], fill=(*hx("#5C4B3F"), 255))
    # winding path
    d.polygon([(470 * S, 1500 * S), (690 * S, 1500 * S), (650 * S, 1110 * S), (600 * S, 1110 * S)], fill=(*hx("#D7BBA0"), 255))
    # two figures
    for x, y, scale in [(540, 1110, 1.0), (590, 1080, 0.86)]:
        d.ellipse(((x - 14 * scale) * S, (y - 120 * scale) * S, (x + 14 * scale) * S, (y - 90 * scale) * S), fill=(*hx("#2F2924"), 255))
        d.polygon([((x - 22 * scale) * S, (y - 92 * scale) * S), ((x + 22 * scale) * S, (y - 92 * scale) * S), ((x + 32 * scale) * S, y * S), ((x - 32 * scale) * S, y * S)], fill=(*hx("#3A3028"), 255))
    # grasses foreground
    for i in range(60):
        x = random.randint(0, W) * S
        y = random.randint(1330, 1500) * S
        d.line([(x, y), (x + random.randint(-12, 12) * S, y - random.randint(30, 110) * S)], fill=(*hx("#2F2924"), 170), width=2 * S)
    return img


def sample_cafe():
    img = base_canvas("#D9C6AC", "#8A6E55", 102, ((360, 120, 900, 680), "#FFF0D4", 170))
    img = img.resize((W * S, H * S), Image.Resampling.BICUBIC)
    d = ImageDraw.Draw(img)
    for i in range(3):
        d.polygon([(650 + i * 150, 0), (780 + i * 150, 0), (360 + i * 80, 1500), (200 + i * 80, 1500)], fill=(*hx("#F6E6CE"), 28))
    d.rectangle((0, 1010 * S, W * S, H * S), fill=(*hx("#6C4F3B"), 255))
    for i in range(12):
        y = 1030 + i * 42
        line(d, [(0, y), (1200, y + 8)], (*hx("#8A6850"), 70), 2)
    d.ellipse((250 * S, 810 * S, 950 * S, 1120 * S), fill=(*hx("#C8AC8D"), 255))
    d.ellipse((300 * S, 840 * S, 900 * S, 1080 * S), fill=(*hx("#A88B6D"), 255))
    d.ellipse((400 * S, 700 * S, 800 * S, 1050 * S), fill=(*hx("#F5E7D3"), 255))
    d.ellipse((440 * S, 730 * S, 760 * S, 1010 * S), fill=(*hx("#462C1B"), 255))
    d.ellipse((480 * S, 760 * S, 720 * S, 970 * S), fill=(*hx("#6C4630"), 255))
    d.arc((630 * S, 760 * S, 830 * S, 980 * S), 265, 95, fill=(*hx("#F5E7D3"), 255), width=24 * S)
    # spoon and beans
    d.rounded_rectangle((890 * S, 980 * S, 1030 * S, 1000 * S), radius=10 * S, fill=(*hx("#B7A48B"), 255))
    d.ellipse((850 * S, 960 * S, 900 * S, 1018 * S), fill=(*hx("#C6B59C"), 255))
    for x, y in [(180, 1180), (240, 1260), (160, 1340), (300, 1350), (980, 1210)]:
        d.ellipse((x * S, y * S, (x + 44) * S, (y + 30) * S), fill=(*hx("#3C2518"), 255))
        d.arc((x * S, y * S, (x + 44) * S, (y + 30) * S), 250, 290, fill=(*hx("#9B7358"), 255), width=3 * S)
    # light flecks
    random.seed(5)
    for _ in range(80):
        x, y = random.randint(0, W), random.randint(0, 900)
        d.ellipse((x * S, y * S, (x + 5) * S, (y + 5) * S), fill=(*hx("#FFF4DE"), 35))
    return img


def sample_cat():
    img = base_canvas("#EFE1D2", "#BFA089", 103, ((650, 90, 1150, 620), "#FFF1DD", 160))
    img = img.resize((W * S, H * S), Image.Resampling.BICUBIC)
    d = ImageDraw.Draw(img)
    d.rectangle((0, 1120 * S, W * S, H * S), fill=(*hx("#A5826A"), 255))
    d.ellipse((280 * S, 810 * S, 930 * S, 1240 * S), fill=(*hx("#CE9F7C"), 255))
    d.polygon([(370 * S, 600 * S), (422 * S, 360 * S), (548 * S, 514 * S)], fill=(*hx("#CE9F7C"), 255))
    d.polygon([(786 * S, 514 * S), (900 * S, 350 * S), (932 * S, 604 * S)], fill=(*hx("#CE9F7C"), 255))
    d.ellipse((340 * S, 430 * S, 950 * S, 980 * S), fill=(*hx("#DBAD8C"), 255))
    d.polygon([(426 * S, 602 * S), (468 * S, 438 * S), (546 * S, 562 * S)], fill=(*hx("#DE9C98"), 255))
    d.polygon([(754 * S, 560 * S), (840 * S, 430 * S), (878 * S, 606 * S)], fill=(*hx("#DE9C98"), 255))
    # eyes, nose, mouth
    d.ellipse((468 * S, 620 * S, 570 * S, 700 * S), fill=(*hx("#30241C"), 255))
    d.ellipse((716 * S, 620 * S, 818 * S, 700 * S), fill=(*hx("#30241C"), 255))
    d.ellipse((490 * S, 638 * S, 518 * S, 666 * S), fill=(*hx("#F1DDC2"), 230))
    d.ellipse((738 * S, 638 * S, 766 * S, 666 * S), fill=(*hx("#F1DDC2"), 230))
    d.polygon([(620 * S, 744 * S), (660 * S, 744 * S), (640 * S, 768 * S)], fill=(*hx("#A45F58"), 255))
    d.arc((580 * S, 750 * S, 640 * S, 800 * S), 10, 160, fill=(*hx("#5A3D31"), 255), width=5 * S)
    d.arc((642 * S, 750 * S, 702 * S, 800 * S), 20, 170, fill=(*hx("#5A3D31"), 255), width=5 * S)
    for dy in (0, 26):
        line(d, [(506, 770 + dy), (360, 742 + dy)], (*hx("#7C5845"), 180), 3)
        line(d, [(772, 770 + dy), (918, 742 + dy)], (*hx("#7C5845"), 180), 3)
    # window frame and curtain
    d.polygon([(0, 0), (280 * S, 0), (180 * S, 1200), (0, 1200)], fill=(*hx("#F8EBD7"), 55))
    line(d, [(950, 0), (870, 1100)], (*hx("#7E6755"), 65), 4)
    random.seed(11)
    for _ in range(60):
        x, y = random.randint(0, W), random.randint(0, 1100)
        d.ellipse((x * S, y * S, (x + 4) * S, (y + 4) * S), fill=(*hx("#FFF1DC"), 26))
    return img


def sample_flower():
    img = base_canvas("#E8D7C8", "#B59C87", 104, ((120, 80, 720, 640), "#FFF2D9", 170))
    img = img.resize((W * S, H * S), Image.Resampling.BICUBIC)
    d = ImageDraw.Draw(img)
    d.rectangle((0, 1080 * S, W * S, H * S), fill=(*hx("#8A6F5A"), 255))
    # window shadow
    d.polygon([(180, 0), (480, 0), (760, 1500), (420, 1500)], fill=(*hx("#F9E9D2"), 36))
    # vase
    d.ellipse((500 * S, 920 * S, 900 * S, 1010 * S), fill=(*hx("#6B5140"), 90))
    d.polygon([(560 * S, 660 * S), (840 * S, 660 * S), (900 * S, 1020 * S), (500 * S, 1020 * S)], fill=(*hx("#D4C0A9"), 255))
    d.ellipse((540 * S, 630 * S, 860 * S, 700 * S), fill=(*hx("#BBA58D"), 255))
    # stems and leaves
    random.seed(13)
    for i, (dx, top) in enumerate([(-110, 260), (-46, 190), (26, 230), (100, 300), (150, 380)]):
        base_x = 700
        stem = []
        for k in range(20):
            t = k / 19
            stem.append((base_x + dx * t + math.sin(t * 4 + i) * 24, 660 - (660 - top) * t))
        d.line([(x * S, y * S) for x, y in stem], fill=(*hx("#5D6A4E"), 255), width=6 * S)
        for _ in range(3):
            idx = random.randint(4, 16)
            sx, sy = stem[idx]
            d.ellipse(((sx - 34) * S, (sy - 12) * S, (sx + 10) * S, (sy + 16) * S), fill=(*hx("#71805B"), 255))
    flower_specs = [(620, 230, 92, "#E7B2A4"), (700, 160, 70, "#D98D89"), (790, 280, 82, "#F0C9B9"), (860, 370, 58, "#DCA49A"), (670, 330, 52, "#F3D5C5")]
    for cx, cy, size, color in flower_specs:
        for petal in range(9):
            angle = petal * 2 * math.pi / 9
            px = cx + math.cos(angle) * size * 0.55
            py = cy + math.sin(angle) * size * 0.55
            d.ellipse(((px - size * 0.36) * S, (py - size * 0.26) * S, (px + size * 0.36) * S, (py + size * 0.26) * S), fill=(*hx(color), 225))
        d.ellipse(((cx - 20) * S, (cy - 20) * S, (cx + 20) * S, (cy + 20) * S), fill=(*hx("#B77A55"), 255))
    # petals on table
    for x, y, angle in [(300, 1180, 20), (940, 1280, -20), (430, 1370, 10)]:
        layer = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
        dl = ImageDraw.Draw(layer)
        dl.ellipse(((x - 42) * S, (y - 20) * S, (x + 42) * S, (y + 20) * S), fill=(*hx("#E7B2A4"), 235))
        layer = layer.rotate(angle, center=(x * S, y * S), resample=Image.Resampling.BICUBIC)
        img = Image.alpha_composite(img, layer)
        d = ImageDraw.Draw(img)
    return img


def sample_street():
    img = base_canvas("#2A3439", "#111A1E", 105, ((620, 100, 1160, 560), "#E7965D", 150))
    img = img.resize((W * S, H * S), Image.Resampling.BICUBIC)
    d = ImageDraw.Draw(img)
    d.ellipse((720 * S, 210 * S, 980 * S, 470 * S), fill=(*hx("#E7A25F"), 220))
    # buildings
    buildings = [(0, 420, 260, 1200, "#1B272B"), (220, 320, 440, 1200, "#243237"), (400, 500, 620, 1200, "#182328"), (760, 380, 980, 1200, "#222F33"), (930, 470, 1200, 1200, "#1A2529")]
    for x0, y0, x1, y1, color in buildings:
        d.rectangle((x0 * S, y0 * S, x1 * S, y1 * S), fill=(*hx(color), 255))
        for row in range(4):
            for col in range(2):
                x = x0 + 40 + col * 72
                y = y0 + 70 + row * 110
                d.rectangle((x * S, y * S, (x + 34) * S, (y + 46) * S), fill=(*hx("#D1A36C"), 150))
    # street and lights
    d.polygon([(0, 1030 * S), (1200 * S, 980 * S), (1200 * S, 1500 * S), (0, 1500 * S)], fill=(*hx("#141D20"), 255))
    d.polygon([(500, 1030), (700, 1030), (820, 1500), (360, 1500)], fill=(*hx("#27363A"), 255))
    for i in range(6):
        y = 1080 + i * 68
        line(d, [(610, y), (610, y + 34)], (*hx("#E8C38F"), 110), 5)
    for x in (600, 720):
        d.ellipse(((x - 18) * S, 940 * S, (x + 18) * S, 976 * S), fill=(*hx("#F4C989"), 255))
        line(d, [(x, 976), (x, 1030)], "#F4C989", 3)
    # silhouettes
    for x, y, s in [(470, 1120, 1.0), (520, 1140, 0.9), (900, 1100, 0.8)]:
        d.ellipse(((x - 18 * s) * S, (y - 150 * s) * S, (x + 18 * s) * S, (y - 112 * s) * S), fill=(*hx("#0B1012"), 255))
        d.rectangle(((x - 24 * s) * S, (y - 112 * s) * S, (x + 24 * s) * S, y * S), fill=(*hx("#0B1012"), 255))
    return img


def main():
    COVERS.mkdir(parents=True, exist_ok=True)
    SAMPLES.mkdir(parents=True, exist_ok=True)
    finish(cover_postcard(), COVERS / "postcard-cover.jpg", 11)
    finish(cover_coffee(), COVERS / "coffee-cover.jpg", 22)
    finish(cover_pet(), COVERS / "pet-cover.jpg", 33)
    finish(cover_podcast(), COVERS / "podcast-cover.jpg", 44, grain=10)
    finish(cover_summer(), COVERS / "summer-cover.jpg", 55)
    finish(cover_brand(), COVERS / "brand-cover.jpg", 66)
    finish(cover_birthday(), COVERS / "birthday-cover.jpg", 77)
    finish(sample_coast(), SAMPLES / "sample-coast.jpg", 101)
    finish(sample_cafe(), SAMPLES / "sample-cafe.jpg", 102)
    finish(sample_cat(), SAMPLES / "sample-cat.jpg", 103)
    finish(sample_flower(), SAMPLES / "sample-flower.jpg", 104)
    finish(sample_street(), SAMPLES / "sample-street.jpg", 105, grain=12)


if __name__ == "__main__":
    main()
