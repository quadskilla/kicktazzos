from __future__ import annotations

import json
import math
import random
import re
import unicodedata
from datetime import date
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps


SIZE = 1254
CENTER = SIZE // 2
RADIUS = 592
ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "tazzos" / "brazukas"
FONT_DIR = Path("C:/Windows/Fonts")


PLAYERS = [
    {
        "source_player": "Alex Sandro",
        "alias": "Sanduba da Faixa",
        "role": "DEF",
        "attrs": {"CHUTE": 74, "DRIBLE": 79, "VELOC.": 76, "STAMINA": 84},
        "number": 1,
        "skin": "#9d5b34",
        "hair": "#202020",
        "uniform": "gola verde torta e faixa de lateral gourmet",
    },
    {
        "source_player": "Bremer",
        "alias": "Muro de Turim",
        "role": "DEF",
        "attrs": {"CHUTE": 63, "DRIBLE": 61, "VELOC.": 74, "STAMINA": 88},
        "number": 2,
        "skin": "#7b472f",
        "hair": "#111111",
        "uniform": "colete blindado amarelo de zagueiro",
    },
    {
        "source_player": "Danilo",
        "alias": "Capita Chinelada",
        "role": "DEF",
        "attrs": {"CHUTE": 70, "DRIBLE": 75, "VELOC.": 73, "STAMINA": 87},
        "number": 3,
        "skin": "#8a5234",
        "hair": "#2b1a13",
        "uniform": "bracadeira torta de capitao de churrasco",
    },
    {
        "source_player": "Douglas Santos",
        "alias": "Doglao Siberiano",
        "role": "DEF",
        "attrs": {"CHUTE": 72, "DRIBLE": 80, "VELOC.": 78, "STAMINA": 86},
        "number": 4,
        "skin": "#b87545",
        "hair": "#2a2015",
        "uniform": "mangas verdes de frio imaginario",
    },
    {
        "source_player": "Gabriel Magalhaes",
        "alias": "Maga Paredao",
        "role": "DEF",
        "attrs": {"CHUTE": 66, "DRIBLE": 64, "VELOC.": 72, "STAMINA": 90},
        "number": 5,
        "skin": "#6d3f28",
        "hair": "#0f0f0f",
        "uniform": "camisa com tijolinhos desenhados",
    },
    {
        "source_player": "Ibanez",
        "alias": "Banheiras da Zaga",
        "role": "DEF",
        "attrs": {"CHUTE": 62, "DRIBLE": 66, "VELOC.": 78, "STAMINA": 86},
        "number": 6,
        "skin": "#9f6a43",
        "hair": "#2b1a10",
        "uniform": "estampa de saboneteira defensiva",
    },
    {
        "source_player": "Leo Pereira",
        "alias": "Lele Perereco",
        "role": "DEF",
        "attrs": {"CHUTE": 67, "DRIBLE": 70, "VELOC.": 71, "STAMINA": 84},
        "number": 7,
        "skin": "#a4643d",
        "hair": "#1a120d",
        "uniform": "listras de rubro-limao falsificado",
    },
    {
        "source_player": "Marquinhos",
        "alias": "Marques do Carrinho",
        "role": "DEF",
        "attrs": {"CHUTE": 68, "DRIBLE": 72, "VELOC.": 76, "STAMINA": 89},
        "number": 8,
        "skin": "#8f5736",
        "hair": "#1c1712",
        "uniform": "ombreiras de mini xerife",
    },
    {
        "source_player": "Wesley",
        "alias": "Foguetinho Romano",
        "role": "DEF",
        "attrs": {"CHUTE": 70, "DRIBLE": 82, "VELOC.": 88, "STAMINA": 86},
        "number": 9,
        "skin": "#7a4a31",
        "hair": "#161616",
        "uniform": "meias com escapamento turbo",
    },
    {
        "source_player": "Bruno Guimaraes",
        "alias": "Maestro Newcastleiro",
        "role": "MEI",
        "attrs": {"CHUTE": 78, "DRIBLE": 85, "VELOC.": 77, "STAMINA": 90},
        "number": 10,
        "skin": "#c48753",
        "hair": "#20140f",
        "uniform": "camisa com batuta de maestro no peito",
    },
    {
        "source_player": "Casemiro",
        "alias": "Tranca-Cofre",
        "role": "MEI",
        "attrs": {"CHUTE": 74, "DRIBLE": 76, "VELOC.": 64, "STAMINA": 88},
        "number": 11,
        "skin": "#8a5535",
        "hair": "#151515",
        "uniform": "cinto de seguranca no meio-campo",
    },
    {
        "source_player": "Danilo Santos",
        "alias": "Volante Estrela-Sol",
        "role": "MEI",
        "attrs": {"CHUTE": 73, "DRIBLE": 81, "VELOC.": 79, "STAMINA": 87},
        "number": 12,
        "skin": "#6f422b",
        "hair": "#131313",
        "uniform": "faixa preta com estrela dourada pirata",
    },
    {
        "source_player": "Fabinho",
        "alias": "Fivela Saudita",
        "role": "MEI",
        "attrs": {"CHUTE": 72, "DRIBLE": 77, "VELOC.": 67, "STAMINA": 85},
        "number": 13,
        "skin": "#9a603d",
        "hair": "#20130e",
        "uniform": "cinturao dourado de volante",
    },
    {
        "source_player": "Lucas Paqueta",
        "alias": "Pacotinho de Meia",
        "role": "MEI",
        "attrs": {"CHUTE": 80, "DRIBLE": 87, "VELOC.": 74, "STAMINA": 84},
        "number": 14,
        "skin": "#a76a43",
        "hair": "#21150e",
        "uniform": "embalagem de salgadinho no ombro",
    },
    {
        "source_player": "Endrick",
        "alias": "Garoto Canhao",
        "role": "ATA",
        "attrs": {"CHUTE": 87, "DRIBLE": 85, "VELOC.": 88, "STAMINA": 82},
        "number": 15,
        "skin": "#6f422b",
        "hair": "#0d0d0d",
        "uniform": "camisa juvenil com foguinho no peito",
    },
    {
        "source_player": "Gabriel Martinelli",
        "alias": "Martelo de Londres",
        "role": "ATA",
        "attrs": {"CHUTE": 84, "DRIBLE": 88, "VELOC.": 92, "STAMINA": 88},
        "number": 16,
        "skin": "#bd7d4e",
        "hair": "#3b2418",
        "uniform": "manga com martelo cartunesco",
    },
    {
        "source_player": "Igor Thiago",
        "alias": "Trovao de Brentford",
        "role": "ATA",
        "attrs": {"CHUTE": 86, "DRIBLE": 76, "VELOC.": 80, "STAMINA": 87},
        "number": 17,
        "skin": "#815035",
        "hair": "#15100d",
        "uniform": "raio preto em zigue-zague",
    },
    {
        "source_player": "Luiz Henrique",
        "alias": "Ligeirinho do Leste",
        "role": "ATA",
        "attrs": {"CHUTE": 81, "DRIBLE": 87, "VELOC.": 90, "STAMINA": 85},
        "number": 18,
        "skin": "#9c623f",
        "hair": "#1b120c",
        "uniform": "short azul com vento desenhado",
    },
    {
        "source_player": "Matheus Cunha",
        "alias": "Cunhador Mancuniano",
        "role": "ATA",
        "attrs": {"CHUTE": 84, "DRIBLE": 86, "VELOC.": 85, "STAMINA": 86},
        "number": 19,
        "skin": "#7d4a31",
        "hair": "#151515",
        "uniform": "gola vermelha escondida de brincadeira",
    },
    {
        "source_player": "Neymar",
        "alias": "Firula Real 10",
        "role": "ATA",
        "attrs": {"CHUTE": 88, "DRIBLE": 95, "VELOC.": 76, "STAMINA": 72},
        "number": 20,
        "skin": "#a86a42",
        "hair": "#f4d34b",
        "uniform": "camisa com purpurina de firula",
    },
    {
        "source_player": "Raphinha",
        "alias": "Rabisco Catalao",
        "role": "ATA",
        "attrs": {"CHUTE": 86, "DRIBLE": 90, "VELOC.": 89, "STAMINA": 87},
        "number": 21,
        "skin": "#9e5c39",
        "hair": "#262018",
        "uniform": "rabiscos azul-grana falsos na manga",
    },
    {
        "source_player": "Rayan",
        "alias": "Foguete da Praia",
        "role": "ATA",
        "attrs": {"CHUTE": 83, "DRIBLE": 86, "VELOC.": 91, "STAMINA": 82},
        "number": 22,
        "skin": "#71462e",
        "hair": "#151515",
        "uniform": "estampa de prancha turbo",
    },
    {
        "source_player": "Vini Jr.",
        "alias": "Drible do Raio",
        "role": "ATA",
        "attrs": {"CHUTE": 90, "DRIBLE": 96, "VELOC.": 98, "STAMINA": 86},
        "number": 23,
        "skin": "#5f3926",
        "hair": "#0f0f0f",
        "uniform": "raios verdes nas laterais da camisa",
    },
]


STAT_COLORS = {
    "CHUTE": "#ffd51f",
    "DRIBLE": "#38f04b",
    "VELOC.": "#20c9ff",
    "STAMINA": "#ff3a2f",
}

ROLE_COLORS = {
    "DEF": ("#087a36", "#ffd929", "#123ea6"),
    "MEI": ("#0b63b6", "#ffe45f", "#18b852"),
    "ATA": ("#13a538", "#ffd21c", "#1e52d9"),
}


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    candidates = {
        "black": ["ariblk.ttf", "Arial Black.ttf", "impact.ttf"],
        "bold": ["arialbd.ttf", "bahnschrift.ttf", "AGENCYB.TTF"],
        "regular": ["arial.ttf", "bahnschrift.ttf"],
        "condensed": ["AGENCYB.TTF", "bahnschrift.ttf", "arialbd.ttf"],
    }
    for filename in candidates.get(name, candidates["bold"]):
        path = FONT_DIR / filename
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = re.sub(r"[^a-zA-Z0-9]+", "_", text.lower()).strip("_")
    return text


def text_size(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont) -> tuple[int, int]:
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0], box[3] - box[1]


def fit_font(draw: ImageDraw.ImageDraw, text: str, max_width: int, start: int, face: str = "black") -> ImageFont.FreeTypeFont:
    size = start
    while size > 20:
        fnt = font(face, size)
        if text_size(draw, text, fnt)[0] <= max_width:
            return fnt
        size -= 3
    return font(face, size)


def wrap_words(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        if text_size(draw, trial, fnt)[0] <= max_width or not current:
            current = trial
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_text(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    fnt: ImageFont.FreeTypeFont,
    fill: str,
    stroke: str = "#050505",
    sw: int = 4,
    anchor: str | None = None,
) -> None:
    draw.text(xy, text, font=fnt, fill=fill, stroke_width=sw, stroke_fill=stroke, anchor=anchor)


def point_on_circle(angle: float, radius: int = RADIUS) -> tuple[int, int]:
    return (int(CENTER + math.cos(angle) * radius), int(CENTER + math.sin(angle) * radius))


def build_background(player: dict) -> Image.Image:
    random.seed(player["number"] * 991)
    base, gold, blue = ROLE_COLORS[player["role"]]
    layer = Image.new("RGB", (SIZE, SIZE), "#f7f8f5")
    bg = Image.new("RGB", (SIZE, SIZE), "#071936")
    d = ImageDraw.Draw(bg, "RGBA")

    for i in range(36):
        a1 = math.tau * i / 36 + random.uniform(-0.07, 0.07)
        a2 = a1 + random.uniform(0.08, 0.19)
        color = random.choice([base, gold, blue, "#00c86b", "#f2f900", "#052c7f"])
        alpha = random.randint(70, 135)
        pts = [(CENTER, CENTER), point_on_circle(a1, 660), point_on_circle(a2, 660)]
        d.polygon(pts, fill=(*Image.new("RGB", (1, 1), color).getpixel((0, 0)), alpha))

    for _ in range(120):
        x = random.randint(90, SIZE - 90)
        y = random.randint(90, SIZE - 90)
        r = random.randint(3, 16)
        color = random.choice([base, gold, blue, "#ffffff", "#20ff60"])
        d.ellipse((x - r, y - r, x + r, y + r), fill=color + "b8")

    for _ in range(26):
        x1 = random.randint(120, SIZE - 120)
        y1 = random.randint(120, SIZE - 120)
        x2 = x1 + random.randint(-230, 230)
        y2 = y1 + random.randint(-230, 230)
        color = random.choice(["#fff000", "#00ff70", "#21b9ff"])
        d.line((x1, y1, x2, y2), fill=color + "d8", width=random.randint(5, 12))
        d.line((x1, y1, x2, y2), fill="#ffffff90", width=2)

    mask = Image.new("L", (SIZE, SIZE), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse((CENTER - RADIUS, CENTER - RADIUS, CENTER + RADIUS, CENTER + RADIUS), fill=255)
    layer.paste(bg.filter(ImageFilter.GaussianBlur(0.4)), (0, 0), mask)
    return layer


def draw_outer_rings(img: Image.Image, player: dict) -> None:
    d = ImageDraw.Draw(img, "RGBA")
    base, gold, blue = ROLE_COLORS[player["role"]]
    rings = [
        (608, "#1b1d24", 8),
        (598, "#e7ebef", 5),
        (586, base, 26),
        (558, gold, 12),
        (541, "#071530", 8),
        (526, blue, 10),
        (511, "#ffffff80", 4),
    ]
    for r, color, width in rings:
        d.ellipse((CENTER - r, CENTER - r, CENTER + r, CENTER + r), outline=color, width=width)

    for i, a in enumerate([math.radians(18), math.radians(160), math.radians(205), math.radians(338)]):
        x, y = point_on_circle(a, 570)
        draw_star(d, x, y, 23, "#ffe736" if i % 2 == 0 else "#29ff5f", "#0b0b0b")


def draw_outer_highlight(img: Image.Image) -> None:
    d = ImageDraw.Draw(img, "RGBA")
    for r, color, width in [(610, "#171b24", 8), (599, "#ffffffc8", 4), (579, "#071530d8", 4)]:
        d.ellipse((CENTER - r, CENTER - r, CENTER + r, CENTER + r), outline=color, width=width)


def draw_star(d: ImageDraw.ImageDraw, cx: int, cy: int, r: int, fill: str, outline: str) -> None:
    pts = []
    for i in range(10):
        rr = r if i % 2 == 0 else r * 0.45
        a = -math.pi / 2 + i * math.pi / 5
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    d.polygon(pts, fill=fill, outline=outline)


def draw_body_line(d: ImageDraw.ImageDraw, points: list[tuple[int, int]], fill: str, width: int) -> None:
    d.line(points, fill=fill, width=width, joint="curve")
    for x, y in points:
        r = width // 2
        d.ellipse((x - r, y - r, x + r, y + r), fill=fill)


def draw_cartoon_player(img: Image.Image, player: dict) -> None:
    d = ImageDraw.Draw(img, "RGBA")
    random.seed(player["number"] * 433)
    skin = player["skin"]
    hair = player["hair"]
    jersey = "#ffdd22"
    green = "#00a84a"
    blue = "#173ca8"
    outline = "#07101f"
    offset = (player["number"] % 5 - 2) * 9
    cx = 768 + offset

    d.ellipse((410, 840, 610, 1040), fill="#ffffff80", outline="#050505", width=8)
    draw_soccer_ball(d, 508, 926, 92)

    draw_body_line(d, [(650, 645), (565, 760), (435, 875)], skin, 44)
    draw_body_line(d, [(830, 660), (965, 610), (1036, 530)], skin, 38)
    draw_body_line(d, [(710, 820), (660, 945), (540, 1018)], "#ffffff", 58)
    draw_body_line(d, [(818, 820), (930, 920), (1030, 950)], "#ffffff", 52)

    d.polygon([(600, 520), (895, 510), (955, 745), (820, 875), (660, 855), (545, 730)], fill=jersey, outline=outline)
    d.line([(600, 520), (895, 510), (955, 745), (820, 875), (660, 855), (545, 730), (600, 520)], fill=outline, width=8)
    d.polygon([(612, 525), (696, 505), (727, 562), (660, 588)], fill=green, outline=outline)
    d.polygon([(805, 508), (890, 514), (840, 595), (780, 560)], fill=green, outline=outline)
    d.polygon([(655, 847), (824, 870), (905, 788), (922, 875), (766, 950), (618, 930)], fill=blue, outline=outline)

    for stripe in range(4):
        sx = 610 + stripe * 76 + (player["number"] % 3) * 8
        d.line([(sx, 548), (sx + 110, 820)], fill="#0a9f3d70", width=16)
    d.rounded_rectangle((734, 604, 838, 674), radius=16, fill="#0b7e36", outline=outline, width=5)
    draw_text(d, (786, 614), "BZK", font("black", 34), "#ffe12a", stroke=outline, sw=2, anchor="ma")
    draw_text(d, (784, 714), str(player["number"]).zfill(2), font("black", 74), "#0c8e3a", stroke="#ffe937", sw=3, anchor="mm")

    d.ellipse((cx - 86, 280, cx + 82, 456), fill=skin, outline=outline, width=7)
    d.ellipse((cx - 100, 348, cx - 75, 389), fill=skin, outline=outline, width=5)
    d.ellipse((cx + 72, 348, cx + 99, 390), fill=skin, outline=outline, width=5)

    hair_top = 250 + (player["number"] % 4) * 4
    hair_pts = [
        (cx - 92, 320),
        (cx - 70, hair_top),
        (cx - 35, 280),
        (cx - 12, hair_top - 20),
        (cx + 18, 278),
        (cx + 55, hair_top + 5),
        (cx + 82, 320),
        (cx + 60, 300),
        (cx + 26, 310),
        (cx - 18, 300),
        (cx - 58, 314),
    ]
    d.polygon(hair_pts, fill=hair, outline=outline)

    if player["role"] == "ATA":
        d.arc((cx - 70, 370, cx + 70, 442), 12, 168, fill="#2b100a", width=7)
        d.ellipse((cx - 47, 345, cx - 12, 378), fill="#ffffff", outline=outline, width=3)
        d.ellipse((cx + 18, 343, cx + 53, 376), fill="#ffffff", outline=outline, width=3)
    elif player["role"] == "MEI":
        d.arc((cx - 64, 378, cx + 64, 430), 20, 160, fill="#2b100a", width=5)
        d.ellipse((cx - 52, 348, cx - 14, 377), fill="#ffffff", outline=outline, width=3)
        d.ellipse((cx + 13, 348, cx + 51, 377), fill="#ffffff", outline=outline, width=3)
    else:
        d.arc((cx - 56, 390, cx + 56, 438), 200, 340, fill="#2b100a", width=5)
        d.ellipse((cx - 49, 348, cx - 18, 376), fill="#ffffff", outline=outline, width=3)
        d.ellipse((cx + 17, 348, cx + 48, 376), fill="#ffffff", outline=outline, width=3)

    d.ellipse((cx - 35, 356, cx - 22, 369), fill="#0b0b0b")
    d.ellipse((cx + 31, 356, cx + 44, 369), fill="#0b0b0b")
    d.line((cx - 58, 332, cx - 18, 340), fill=outline, width=6)
    d.line((cx + 14, 340, cx + 58, 330), fill=outline, width=6)
    d.polygon([(cx + 2, 365), (cx - 10, 398), (cx + 16, 396)], fill="#7b392a", outline=outline)

    if player["number"] % 2 == 0:
        d.line((cx - 73, 324, cx + 73, 319), fill="#18b94e", width=12)
        d.line((cx - 73, 327, cx + 73, 322), fill="#ffe23c", width=4)
    if player["number"] % 3 == 0:
        d.ellipse((cx + 64, 371, cx + 78, 385), fill="#e8e8e8", outline=outline, width=2)

    for x, y in [(538, 1015), (1035, 955)]:
        d.polygon([(x - 58, y + 20), (x + 56, y - 16), (x + 76, y + 20), (x - 36, y + 45)], fill="#080808", outline="#ffffff", width=4)


def draw_soccer_ball(d: ImageDraw.ImageDraw, cx: int, cy: int, r: int) -> None:
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill="#f7f7f2", outline="#080808", width=7)
    pent = []
    for i in range(5):
        a = -math.pi / 2 + i * math.tau / 5
        pent.append((cx + math.cos(a) * r * 0.33, cy + math.sin(a) * r * 0.33))
    d.polygon(pent, fill="#0c0c0c")
    for x, y in pent:
        ex = cx + (x - cx) * 2.25
        ey = cy + (y - cy) * 2.25
        d.line((x, y, ex, ey), fill="#080808", width=4)


def draw_stat_icon(d: ImageDraw.ImageDraw, label: str, cx: int, cy: int, color: str) -> None:
    d.ellipse((cx - 48, cy - 48, cx + 48, cy + 48), fill=color, outline="#ffffff", width=5)
    d.ellipse((cx - 39, cy - 39, cx + 39, cy + 39), outline="#050505", width=5)
    if label == "CHUTE":
        draw_soccer_ball(d, cx, cy, 27)
    elif label == "DRIBLE":
        d.arc((cx - 35, cy - 25, cx + 32, cy + 28), 205, 40, fill="#050505", width=7)
        d.ellipse((cx - 26, cy - 4, cx - 6, cy + 16), fill="#050505")
        d.ellipse((cx + 14, cy - 19, cx + 34, cy + 1), fill="#050505")
        d.ellipse((cx + 19, cy + 21, cx + 36, cy + 38), fill="#050505")
    elif label == "VELOC.":
        pts = [(cx + 2, cy - 38), (cx - 28, cy + 6), (cx - 4, cy + 2), (cx - 17, cy + 39), (cx + 31, cy - 13), (cx + 5, cy - 8)]
        d.polygon(pts, fill="#fff22c", outline="#050505")
    else:
        pts = [(cx, cy + 34), (cx - 34, cy - 3), (cx - 20, cy - 30), (cx, cy - 14), (cx + 20, cy - 30), (cx + 34, cy - 3)]
        d.polygon(pts, fill="#ffefe7", outline="#050505")
        d.line((cx - 28, cy + 1, cx - 8, cy + 1, cx, cy - 13, cx + 11, cy + 15, cx + 24, cy + 15), fill=color, width=5)


def draw_stats(img: Image.Image, player: dict) -> None:
    d = ImageDraw.Draw(img, "RGBA")
    y0 = 213
    panel_w = 440
    panel_h = 118
    for i, (label, value) in enumerate(player["attrs"].items()):
        y = y0 + i * 132
        color = STAT_COLORS[label]
        shadow = [(83, y + 14), (483, y + 2), (526, y + panel_h + 12), (116, y + panel_h + 21)]
        d.polygon(shadow, fill="#00000080")
        pts = [(68, y), (470, y - 8), (513, y + panel_h), (100, y + panel_h + 10)]
        d.polygon(pts, fill="#050505e8", outline=color)
        d.line((92, y + panel_h + 4, 500, y + panel_h - 4), fill=color, width=6)
        draw_stat_icon(d, label, 122, y + 58, color)
        draw_text(d, (210, y + 18), label, font("black", 38), "#ffffff", stroke="#050505", sw=3)
        draw_text(d, (318, y + 76), str(value), font("black", 78), color, stroke="#050505", sw=5, anchor="mm")


def draw_number_badge(img: Image.Image, player: dict) -> None:
    d = ImageDraw.Draw(img, "RGBA")
    n = str(player["number"]).zfill(2)
    d.polygon([(890, 510), (1094, 482), (1140, 744), (932, 774)], fill="#000000c8", outline="#ffe125")
    d.polygon([(904, 528), (1079, 505), (1116, 726), (948, 752)], fill="#f4bb16", outline="#ffffff")
    draw_text(d, (1016, 462), "NUMERO", font("black", 47), "#ffffff", stroke="#050505", sw=5, anchor="mm")
    draw_text(d, (1014, 635), n, font("black", 152), "#fff3a5", stroke="#09101d", sw=7, anchor="mm")
    draw_text(d, (924, 705), "N.", font("black", 46), "#07101d", stroke="#ffffff", sw=3)


def draw_header(img: Image.Image, player: dict) -> None:
    d = ImageDraw.Draw(img, "RGBA")
    base, gold, blue = ROLE_COLORS[player["role"]]
    d.rounded_rectangle((360, 70, 895, 168), radius=28, fill="#050505d8", outline=gold, width=5)
    d.rounded_rectangle((383, 92, 872, 151), radius=18, fill=base, outline="#ffffff", width=3)
    draw_text(d, (628, 121), "BRAZUKAS", font("black", 58), "#ffe637", stroke="#062815", sw=4, anchor="mm")
    d.rounded_rectangle((900, 78, 1058, 158), radius=22, fill=blue, outline="#ffffff", width=4)
    draw_text(d, (979, 118), player["role"], font("black", 47), "#ffffff", stroke="#050505", sw=3, anchor="mm")


def draw_name_banner(img: Image.Image, player: dict) -> None:
    d = ImageDraw.Draw(img, "RGBA")
    alias = player["alias"].upper()
    d.polygon(
        [(230, 918), (988, 884), (1100, 1004), (1010, 1136), (278, 1148), (150, 1038)],
        fill="#050505e8",
        outline="#ffe729",
    )
    d.line((214, 1094, 1032, 1072), fill="#18e64e", width=12)
    d.line((244, 1122, 1000, 1108), fill="#1550db", width=7)

    start_size = 78 if len(alias) < 17 else 66
    fnt = fit_font(d, alias, 700, start_size)
    lines = wrap_words(d, alias, fnt, 700)
    if len(lines) > 2:
        fnt = fit_font(d, alias, 690, 54)
        lines = wrap_words(d, alias, fnt, 690)
    lines = lines[:2]
    line_centers = [1024] if len(lines) == 1 else [997, 1062]
    for idx, line in enumerate(lines):
        fill = "#ffe421" if idx == 0 else "#38ff54"
        draw_text(d, (CENTER, line_centers[idx]), line, fnt, fill, stroke="#050505", sw=6, anchor="mm")


def crop_to_disc(img: Image.Image) -> Image.Image:
    mask = Image.new("L", (SIZE, SIZE), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse((CENTER - 613, CENTER - 613, CENTER + 613, CENTER + 613), fill=255)
    white = Image.new("RGB", (SIZE, SIZE), "#f7f8f7")
    white.paste(img, (0, 0), mask)
    return white


def render_player(player: dict) -> Path:
    img = build_background(player)
    draw_outer_rings(img, player)
    draw_cartoon_player(img, player)
    draw_stats(img, player)
    draw_number_badge(img, player)
    draw_header(img, player)
    draw_name_banner(img, player)
    draw_outer_highlight(img)
    img = crop_to_disc(img)
    path = OUT_DIR / f"{player['number']:02d}_{slugify(player['alias'])}.png"
    img.save(path, optimize=True)
    return path


def create_contact_sheet(paths: list[Path]) -> Path:
    thumb_size = 246
    gap = 22
    cols = 4
    rows = math.ceil(len(paths) / cols)
    label_h = 48
    w = cols * thumb_size + (cols + 1) * gap
    h = rows * (thumb_size + label_h) + (rows + 1) * gap + 86
    sheet = Image.new("RGB", (w, h), "#10233d")
    d = ImageDraw.Draw(sheet, "RGBA")
    draw_text(d, (w // 2, 42), "BRAZUKAS - 23 TAZZOS", font("black", 44), "#ffe537", stroke="#06121e", sw=3, anchor="mm")
    for idx, path in enumerate(paths):
        row, col = divmod(idx, cols)
        x = gap + col * (thumb_size + gap)
        y = 86 + gap + row * (thumb_size + label_h + gap)
        im = Image.open(path).convert("RGB")
        im = ImageOps.contain(im, (thumb_size, thumb_size))
        sheet.paste(im, (x, y))
        alias = PLAYERS[idx]["alias"].upper()
        fnt = fit_font(d, alias, thumb_size, 22, "bold")
        tw, th = text_size(d, alias, fnt)
        draw_text(d, (x + thumb_size // 2, y + thumb_size + 22), alias, fnt, "#ffffff", stroke="#06121e", sw=2, anchor="mm")
    out = OUT_DIR / "brazukas_preview_sheet.png"
    sheet.save(out, optimize=True)
    return out


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    paths = [render_player(player) for player in PLAYERS]
    sheet = create_contact_sheet(paths)
    manifest = {
        "team": "Brazukas",
        "created_on": date.today().isoformat(),
        "count": len(paths),
        "notes": [
            "Satirical/non-official art. No official Brazil/CBF crest, sponsor, or literal player names appear in the PNGs.",
            "The source_player field is only a mapping reference for the creator.",
        ],
        "sources_checked": [
            "https://ge.globo.com/google/amp/futebol/copa-do-mundo/noticia/2026/05/18/convocados-da-selecao-brasileira-para-a-copa-do-mundo-2026-veja-a-lista-de-ancelotti.ghtml",
            "https://www.cnnbrasil.com.br/esportes/futebol/selecao-brasileira/selecao-brasileira-veja-a-lista-de-convocados-para-a-copa-do-mundo/",
            "https://www.uol.com.br/esporte/futebol/ultimas-noticias/2026/05/18/lista-do-brasil-na-copa-do-mundo-2026-veja-jogadores-convocados-para-copa.amp.htm",
        ],
        "players": [
            {
                "file": str(path.name),
                "alias": player["alias"],
                "source_player": player["source_player"],
                "role": player["role"],
                "attrs": player["attrs"],
                "uniform_satire": player["uniform"],
            }
            for path, player in zip(paths, PLAYERS)
        ],
        "preview": sheet.name,
    }
    (OUT_DIR / "manifest_brazukas.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Generated {len(paths)} tazzos in {OUT_DIR}")
    print(f"Preview sheet: {sheet}")


if __name__ == "__main__":
    main()
