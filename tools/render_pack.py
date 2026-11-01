import argparse
import json
import os
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO / "tools" / "tests"))
sys.path.insert(0, str(REPO / "tools"))

SETUP = """(id)=>{const g=__game,T=g.THREE;__paused=true;
 if(window.__e){g.scene.remove(window.__e.group);window.__e.alive=false;}
 for(const s of g.ships){if(s!==g.player){s.alive=false;s.dying=0;s.group.visible=false;}}
 g.player.group.visible=false;g.player.group.position.set(0,0,90000);
 const e=g.spawnShip(id,0,new T.Vector3(0,0,0),new T.Vector3(0,0,-100),{});e.vel.set(0,0,0);e.group.quaternion.set(0,0,0,1);e.shield.fore=0;e.shield.aft=0;window.__e=e;
 return e.def.length}"""
CAMERA = """([L])=>{const g=__game,c=g.camera;c.fov=30;c.updateProjectionMatrix();const d=L*2.5,a=35*Math.PI/180,b=20*Math.PI/180;
 c.position.set(Math.sin(a)*Math.cos(b)*d,Math.sin(b)*d,-Math.cos(a)*Math.cos(b)*d);c.up.set(0,1,0);c.lookAt(0,0,0);c.updateMatrixWorld(true)}"""

TILE_WIDTH = 620
RENDER_HEIGHT = 372
CAPTION_HEIGHT = 116
GAP = 18
MARGIN = 18


def load_font(size):
    candidates = (
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "C:/Windows/Fonts/arial.ttf",
    )
    for path in candidates:
        if os.path.isfile(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def fit_line(draw, text, font, max_width):
    words = text.split()
    lines = []
    line = ""
    for word in words:
        candidate = f"{line} {word}".strip()
        if line and draw.textbbox((0, 0), candidate, font=font)[2] > max_width:
            lines.append(line)
            line = word
        else:
            line = candidate
    if line:
        lines.append(line)
    return lines


def weapon_names(ship, weapons):
    ids = dict.fromkeys(
        mount["w"]
        for mount in ship.get("mounts", []) + ship.get("turrets", [])
        if mount.get("w") in weapons
    )
    return ", ".join(weapons[weapon_id]["name"] for weapon_id in ids) or "none"


def compose_sheet(faction, ships, weapons, renders, render_lengths, output_path):
    columns = 2
    rows = (len(ships) + columns - 1) // columns
    sheet_width = MARGIN * 2 + columns * TILE_WIDTH + (columns - 1) * GAP
    cell_height = RENDER_HEIGHT + CAPTION_HEIGHT
    sheet_height = MARGIN * 2 + 48 + rows * cell_height + (rows - 1) * GAP
    sheet = Image.new("RGB", (sheet_width, sheet_height), "#101923")
    draw = ImageDraw.Draw(sheet)
    title_font = load_font(25)
    name_font = load_font(22)
    detail_font = load_font(16)
    draw.text(
        (MARGIN, MARGIN),
        f"{faction.upper()} FLEET - {len(ships)} SHIPS",
        fill="#e6edf7",
        font=title_font,
    )
    top = MARGIN + 48

    for index, (ship_id, ship) in enumerate(ships):
        col, row = index % columns, index // columns
        x = MARGIN + col * (TILE_WIDTH + GAP)
        y = top + row * (cell_height + GAP)
        render = Image.open(renders[ship_id]).convert("RGB")
        render = render.resize((TILE_WIDTH, RENDER_HEIGHT), Image.Resampling.LANCZOS)
        sheet.paste(render, (x, y))
        draw.rectangle(
            (x, y + RENDER_HEIGHT, x + TILE_WIDTH, y + cell_height),
            fill="#18243a",
        )
        draw.text((x + 12, y + RENDER_HEIGHT + 7), ship["name"], fill="#ffffff", font=name_font)

        shield = ship.get("shield", {})
        rendered_length = render_lengths[ship_id]
        length_label = f'{ship["length"]:g} m'
        if rendered_length != ship["length"]:
            length_label += f" authored / {rendered_length:g} m rendered"
        stats = (
            f'{ship["cls"]} | {ship.get("role", "UNSPECIFIED")} | {length_label}',
            f'Speed {ship.get("maxSpeed", 0):g} m/s | Hull {ship.get("structure", 0):g} | '
            f'Shields F/A {shield.get("fore", 0):g}/{shield.get("aft", 0):g}',
        )
        detail_lines = list(stats)
        detail_lines.extend(
            fit_line(
                draw,
                f"Weapons: {weapon_names(ship, weapons)}",
                detail_font,
                TILE_WIDTH - 24,
            )
        )
        line_y = y + RENDER_HEIGHT + 36
        for line in detail_lines[:4]:
            draw.text((x + 12, line_y), line, fill="#c2ccda", font=detail_font)
            line_y += 19
    sheet.save(output_path)


def main():
    parser = argparse.ArgumentParser(description="Render faction contact sheets for image-generation reference.")
    parser.add_argument("--quality", choices=("low", "mid", "high", "ultra"), default="high")
    parser.add_argument(
        "--output",
        type=Path,
        default=REPO / "docs" / "img" / "ships" / "contact_sheets",
        help="output directory (defaults to the git-ignored docs/img/ships/contact_sheets)",
    )
    args = parser.parse_args()

    from lib import Runner

    import dbmarks
    database = dbmarks.resolve(json.loads((REPO / "data" / "db.json").read_text()))
    ships = database["ships"]
    weapons = database["weapons"]
    factions = {}
    for ship_id, ship in ships.items():
        faction = ship.get("fac")
        if not faction:
            raise ValueError(f"Ship {ship_id} has no faction in data/db.json")
        factions.setdefault(faction, []).append((ship_id, ship))

    args.output.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="game-space-render-pack-") as temp_dir:
        renders = {}
        render_lengths = {}
        with Runner() as runner:
            page = runner.page(900, 540, f"?free&n=0&wing=0&q={args.quality}")
            page.wait_for_timeout(1500)
            page.add_style_tag(content="body>*:not(#c){display:none!important}")
            for faction_ships in factions.values():
                for ship_id, _ in faction_ships:
                    length = page.evaluate(SETUP, ship_id)
                    page.wait_for_timeout(400)
                    page.evaluate(CAMERA, [length])
                    page.wait_for_timeout(300)
                    render_path = Path(temp_dir) / f"{ship_id}.png"
                    page.screenshot(path=str(render_path))
                    renders[ship_id] = render_path
                    render_lengths[ship_id] = length
                    print(f"rendered {ship_id}", flush=True)
            if runner.errs:
                raise RuntimeError(f"Browser reported errors or warnings: {runner.errs[:10]}")

        for faction, faction_ships in factions.items():
            output_path = args.output / f"{faction}.png"
            compose_sheet(faction, faction_ships, weapons, renders, render_lengths, output_path)
            print(f"wrote {output_path}", flush=True)


if __name__ == "__main__":
    main()
