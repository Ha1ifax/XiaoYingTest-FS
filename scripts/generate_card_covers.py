"""Create title-free card crops from the demo cover artwork.

The full cover is a poster with its own typography. Cards show the template
title as interface text, so they use this art-only version instead.
"""

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "frontend" / "public" / "demo"
TARGET = SOURCE / "cards"
ART_CROP_HEIGHT = 1000  # Keep the composition above the baked-in poster title.
OUTPUT_SIZE = (960, 800)

sys.path.insert(0, str(Path(__file__).resolve().parent))
from generate_demo_assets import S, W, add_grain, cover_birthday  # noqa: E402


def birthday_art() -> Image.Image:
    image = cover_birthday(include_copy=False).convert("RGB")
    image = image.crop((0, 0, W * S, ART_CROP_HEIGHT * S))
    image = add_grain(image, 7, 19)
    return image.resize(OUTPUT_SIZE, Image.Resampling.LANCZOS)


def main() -> None:
    TARGET.mkdir(parents=True, exist_ok=True)
    for path in sorted(SOURCE.glob("*.jpg")):
        if path.name == "birthday-cover.jpg":
            art = birthday_art()
        else:
            image = Image.open(path).convert("RGB")
            art = image.crop((0, 0, image.width, ART_CROP_HEIGHT))
            art = art.resize(OUTPUT_SIZE, Image.Resampling.LANCZOS)
        target = TARGET / path.name
        art.save(target, quality=88, optimize=True, progressive=True)
        print(f"wrote {target.relative_to(ROOT)} ({target.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
