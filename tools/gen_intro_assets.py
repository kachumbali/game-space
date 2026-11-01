#!/usr/bin/env python3
"""Generate all assets for docs/INTRO_TEST_SPEC.md intro cutscene test.
Outputs:
- assets/scenes/intro_test/bg_space.png (320x200)
- assets/scenes/intro_test/bg_briefing.png (320x200)
- assets/scenes/intro_test/ship_kestrel.png (96x48)
- assets/scenes/intro_test/ship_halberd.png (160x56)
- assets/scenes/intro_test/ui_frame.png (320x200)
- assets/scenes/intro_test/heads/imani/* (64x64 overlays + head.json)
- assets/scenes/intro_test/heads/hawk/* (64x64 overlays + head.json)
- assets/scenes/intro_test/heads/meow/* (64x64 overlays + head.json)
"""
import os, struct, zlib, json

def save_png(filename, width, height, rgba_data):
    os.makedirs(os.path.dirname(os.path.abspath(filename)), exist_ok=True)
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    raw = bytearray()
    for y in range(height):
        raw.append(0)
        raw.extend(rgba_data[y * width * 4 : (y + 1) * width * 4])
    idat = zlib.compress(bytes(raw), 9)
    with open(filename, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(chunk(b'IHDR', ihdr))
        f.write(chunk(b'IDAT', idat))
        f.write(chunk(b'IEND', b''))

def hex_to_rgba(h, a=255):
    h = h.lstrip('#')
    return [int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a]

# -------------------------------------------------------------
# 1. Background: bg_space.png (320x200)
# -------------------------------------------------------------
def make_bg_space():
    W, H = 320, 200
    pixels = [[4, 8, 16, 255] for _ in range(W * H)] # deep space

    # Distant blue/cyan nebula gradient with dithering
    for y in range(H):
        for x in range(W):
            # distance from top right nebula center
            dx = (x - 240) / 120.0
            dy = (y - 50) / 80.0
            d = (dx*dx + dy*dy)**0.5
            if d < 1.4:
                dither = ((x ^ y) & 1) * 0.1
                val = max(0.0, 1.0 - d + dither)
                if val > 0.6:
                    pixels[y * W + x] = [16, 44, 56, 255]
                elif val > 0.3:
                    pixels[y * W + x] = [8, 24, 34, 255]

    # Curved planet limb in lower left corner (center at -40, 280, radius 180)
    cx, cy, r = -20, 260, 170
    for y in range(H):
        for x in range(W):
            dist = ((x - cx)**2 + (y - cy)**2)**0.5
            if dist < r:
                # planet surface shading
                edge_dist = r - dist
                dither = ((x ^ y) & 1)
                if edge_dist < 4:
                    pixels[y * W + x] = [80, 180, 210, 255] # bright atmospheric limb
                elif edge_dist < 12:
                    pixels[y * W + x] = [40, 120, 150, 255] # upper atmosphere
                elif edge_dist < 35:
                    c = [24, 60, 80, 255] if dither else [18, 48, 64, 255]
                    pixels[y * W + x] = c
                else:
                    c = [12, 32, 44, 255] if dither else [8, 20, 28, 255]
                    pixels[y * W + x] = c

    # Stars (deterministic pseudo-random)
    seed = 1337
    for i in range(120):
        seed = (seed * 1103515245 + 12345) & 0x7fffffff
        sx = seed % W
        seed = (seed * 1103515245 + 12345) & 0x7fffffff
        sy = seed % H
        # don't put stars inside the planet core
        if ((sx - cx)**2 + (sy - cy)**2)**0.5 >= r:
            bright = (seed >> 8) % 3
            if bright == 0:
                pixels[sy * W + sx] = [240, 248, 255, 255]
            elif bright == 1:
                pixels[sy * W + sx] = [160, 200, 220, 255]
            else:
                pixels[sy * W + sx] = [100, 130, 150, 255]

    raw = []
    for p in pixels: raw.extend(p)
    save_png('assets/scenes/intro_test/bg_space.png', W, H, bytearray(raw))

# -------------------------------------------------------------
# 2. Background: bg_briefing.png (320x200)
# -------------------------------------------------------------
def make_bg_briefing():
    W, H = 320, 200
    pixels = [[36, 52, 64, 255] for _ in range(W * H)] # slate steel wall

    # Ceiling and upper bulkhead
    for y in range(40):
        for x in range(W):
            c = [24, 34, 42, 255] if (y < 20 or ((x ^ y) & 1)) else [30, 42, 52, 255]
            pixels[y * W + x] = c

    # Floor (y >= 140) with dithered perspective grid
    for y in range(140, H):
        for x in range(W):
            dither = ((x ^ y) & 1)
            base_floor = [18, 24, 30, 255] if dither else [14, 18, 24, 255]
            # hazard warning strip near bottom
            if 186 <= y <= 192:
                if (x + y // 2) % 16 < 8:
                    base_floor = [200, 140, 30, 255] # amber hazard
                else:
                    base_floor = [20, 20, 24, 255] # black hazard
            pixels[y * W + x] = base_floor

    # Metal panels, rivets and vertical wall struts
    for sx in [40, 100, 160, 220, 280]:
        for y in range(20, 140):
            for dx in range(-2, 3):
                x = sx + dx
                if 0 <= x < W:
                    pixels[y * W + x] = [48, 70, 84, 255] if dx == -2 else [18, 28, 36, 255] if dx == 2 else [36, 54, 66, 255]
        # Rivets
        for ry in [28, 60, 90, 120]:
            pixels[ry * W + sx] = [180, 210, 220, 255]
            pixels[(ry + 1) * W + sx] = [12, 18, 24, 255]

    # Amber indicator lamps along wall rib
    for sx in [40, 160, 280]:
        for dy in range(-2, 3):
            for dx in range(-2, 3):
                if dx*dx + dy*dy <= 4:
                    pixels[(32 + dy) * W + (sx + dx)] = [255, 180, 40, 255] if abs(dx)+abs(dy) <= 1 else [180, 90, 15, 255]

    # Central tactical star-map holo table (center at x=160, y=130)
    for y in range(115, 145):
        for x in range(100, 220):
            # table base
            if 125 <= y <= 145 and (110 <= x <= 210):
                pixels[y * W + x] = [44, 60, 72, 255] if y < 130 else [20, 30, 38, 255]

    # Holo table projection glow
    for y in range(70, 125):
        for x in range(120, 200):
            dx = (x - 160) / 36.0
            dy = (y - 100) / 24.0
            if dx*dx + dy*dy < 1.0:
                if ((x ^ y) & 3) == 0:
                    pixels[y * W + x] = [60, 200, 230, 255] # holographic cyan point

    raw = []
    for p in pixels: raw.extend(p)
    save_png('assets/scenes/intro_test/bg_briefing.png', W, H, bytearray(raw))

# -------------------------------------------------------------
# 3. Ship Sprite: ship_kestrel.png (96x48)
# -------------------------------------------------------------
def make_ship_kestrel():
    W, H = 96, 48
    pixels = [[0, 0, 0, 0] for _ in range(W * H)]

    # Draw 3/4 side profile of Kestrel heavy fighter
    # Forward is left-to-right (nose pointing towards x=78, y=24)
    for y in range(H):
        for x in range(W):
            # Fuselage core
            if 18 <= y <= 30 and 20 <= x <= 78:
                # taper towards nose at x=78
                taper = max(0, (x - 50) // 3)
                if abs(y - 24) <= (6 - taper):
                    pixels[y * W + x] = [180, 200, 210, 255] if y < 24 else [100, 120, 130, 255]
            # Cockpit canopy (amber/cyan glass near x=54..68, y=17..22)
            if 17 <= y <= 22 and 54 <= x <= 68:
                if abs(y - 20) <= 2:
                    pixels[y * W + x] = [60, 210, 240, 255] if y == 19 else [20, 110, 140, 255]
            # Main swept wings
            if 22 <= y <= 40 and 16 <= x <= 56:
                wing_x_end = 56 - (y - 22) * 1.6
                if 16 <= x <= wing_x_end:
                    pixels[y * W + x] = [130, 150, 160, 255] if y % 2 == 0 else [80, 95, 105, 255]
            # Upper fin
            if 8 <= y <= 18 and 18 <= x <= 36:
                if x >= 18 + (18 - y) * 1.4:
                    pixels[y * W + x] = [140, 160, 170, 255]
            # Engine thruster nozzle at x=14..20, y=20..28
            if 20 <= y <= 28 and 14 <= x <= 20:
                pixels[y * W + x] = [60, 70, 80, 255]
            # Engine plume / afterburner glow (x=4..13, y=22..26)
            if 22 <= y <= 26 and 4 <= x <= 13:
                pixels[y * W + x] = [255, 220, 100, 255] if abs(y - 24) == 0 else [255, 120, 30, 255]

    # Wingtip weapon pod & amber insignia stripe
    for x in range(32, 42):
        if pixels[24 * W + x][3] > 0:
            pixels[24 * W + x] = [240, 160, 30, 255] # amber chevron stripe

    raw = []
    for p in pixels: raw.extend(p)
    save_png('assets/scenes/intro_test/ship_kestrel.png', W, H, bytearray(raw))

# -------------------------------------------------------------
# 4. Ship Sprite: ship_halberd.png (160x56)
# -------------------------------------------------------------
def make_ship_halberd():
    W, H = 160, 56
    pixels = [[0, 0, 0, 0] for _ in range(W * H)]

    # Halberd 128m escort corvette (long armoured wedge profile)
    # Nose at x=145, y=28; Engines at x=18
    for y in range(H):
        for x in range(W):
            # Main hull wedge
            if 20 <= x <= 140:
                half_h = 12 if x < 100 else 12 - (x - 100) // 4
                if abs(y - 28) <= half_h:
                    if y < 24:
                        pixels[y * W + x] = [160, 180, 190, 255] # top armor highlight
                    elif y < 32:
                        pixels[y * W + x] = [110, 130, 140, 255] # mid hull
                    else:
                        pixels[y * W + x] = [70, 85, 95, 255] # shadowed ventral hull

            # Elevated bridge tower (x=60..85, y=10..20)
            if 10 <= y <= 20 and 60 <= x <= 85:
                if x >= 60 + (20 - y):
                    pixels[y * W + x] = [190, 210, 220, 255] if y < 15 else [120, 140, 150, 255]
                    # bridge viewport slit
                    if y == 14 and 74 <= x <= 82:
                        pixels[y * W + x] = [70, 220, 250, 255]

            # Forward mass-driver / railgun barrel sponson
            if 27 <= y <= 29 and 138 <= x <= 152:
                pixels[y * W + x] = [210, 225, 230, 255]

            # Heavy engine block (x=12..22, y=16..40)
            if 16 <= y <= 40 and 12 <= x <= 22:
                pixels[y * W + x] = [50, 60, 70, 255]

            # Dual engine thruster exhaust plumes (x=2..12, y=20..24 and y=32..36)
            if (20 <= y <= 24 or 32 <= y <= 36) and 2 <= x <= 12:
                pixels[y * W + x] = [80, 210, 240, 255] if ((y == 22 or y == 34) and x > 5) else [40, 130, 180, 255]

    # Dorsal and ventral point-defence turret housings
    for tx in [45, 95]:
        for ty in [14, 41]:
            for dy in range(-2, 3):
                for dx in range(-3, 4):
                    if dx*dx + dy*dy <= 7:
                        pixels[(ty + dy) * W + (tx + dx)] = [220, 230, 235, 255]

    raw = []
    for p in pixels: raw.extend(p)
    save_png('assets/scenes/intro_test/ship_halberd.png', W, H, bytearray(raw))

# -------------------------------------------------------------
# 5. UI Frame: ui_frame.png (320x200, transparent)
# -------------------------------------------------------------
def make_ui_frame():
    W, H = 320, 200
    pixels = [[0, 0, 0, 0] for _ in range(W * H)]

    # Bracket HUD corners in teal/cyan
    bracket_c = [64, 180, 200, 200]
    for x in range(16):
        pixels[6 * W + (6 + x)] = bracket_c
        pixels[6 * W + (W - 7 - x)] = bracket_c
        pixels[(H - 7) * W + (6 + x)] = bracket_c
        pixels[(H - 7) * W + (W - 7 - x)] = bracket_c
    for y in range(16):
        pixels[(6 + y) * W + 6] = bracket_c
        pixels[(6 + y) * W + (W - 7)] = bracket_c
        pixels[(H - 7 - y) * W + 6] = bracket_c
        pixels[(H - 7 - y) * W + (W - 7)] = bracket_c

    # Lower dialogue frame line
    for x in range(20, W - 20):
        pixels[150 * W + x] = [40, 90, 110, 180]
        pixels[194 * W + x] = [40, 90, 110, 180]

    raw = []
    for p in pixels: raw.extend(p)
    save_png('assets/scenes/intro_test/ui_frame.png', W, H, bytearray(raw))

# -------------------------------------------------------------
# 6. Talking Heads Generator (64x64)
# -------------------------------------------------------------
# Character coordinates:
# Eye region: y in [26..31], left eye x in [24..30], right eye x in [34..40]
# Mouth region: y in [38..46], mouth x in [25..39]

def make_head(char_id, name, skin_base, skin_shadow, hair_c, uniform_c, collar_c):
    folder = f'assets/scenes/intro_test/heads/{char_id}'
    os.makedirs(folder, exist_ok=True)
    W, H = 64, 64

    # --- BASE.PNG ---
    # Flat skin where eyes (y=26..32, x=22..42) and mouth (y=38..47, x=24..40) go
    base = [[0, 0, 0, 0] for _ in range(W * H)]

    for y in range(H):
        for x in range(W):
            # Shoulders / uniform body (y >= 44)
            if y >= 45:
                # Shoulder contour
                dx = abs(x - 32)
                if dx <= (y - 40) * 1.5 and dx <= 30:
                    base[y * W + x] = uniform_c
                    # Collar / lapels
                    if dx <= 8 and y <= 56:
                        base[y * W + x] = collar_c
                    # Insignia badge on chest / shoulder
                    if 50 <= y <= 54 and 10 <= x <= 14:
                        base[y * W + x] = [255, 190, 40, 255] # amber badge

            # Neck (y in 40..46, x in 26..38)
            if 40 <= y <= 47 and 26 <= x <= 38:
                base[y * W + x] = skin_shadow

            # Head oval (center at x=32, y=30, rx=13, ry=16)
            dx = (x - 32) / 13.0
            dy = (y - 30) / 16.0
            if dx*dx + dy*dy <= 1.0:
                # Shading: left lit, right slight shadow
                base[y * W + x] = skin_base if (x <= 34 or (y >= 26 and y <= 46)) else skin_shadow

            # Ears (y in 27..34, x in 17..19 and 45..47)
            if 27 <= y <= 34:
                if 17 <= x <= 19 or 45 <= x <= 47:
                    base[y * W + x] = skin_shadow

            # Hair cap (y in 12..25)
            dx = (x - 32) / 14.0
            dy = (y - 25) / 14.0
            if dx*dx + dy*dy <= 1.0 and y <= 24:
                base[y * W + x] = hair_c
            # Hair sides
            if 20 <= y <= 30 and (16 <= x <= 20 or 44 <= x <= 48):
                if ((x - 32)**2 / 15.0**2 + (y - 26)**2 / 12.0**2) <= 1.0:
                    base[y * W + x] = hair_c

            # Eyebrows (fixed on base, resting above eye slots at y=23..24)
            if y in (23, 24):
                if (24 <= x <= 30) or (34 <= x <= 40):
                    base[y * W + x] = [max(0, hair_c[0]-20), max(0, hair_c[1]-20), max(0, hair_c[2]-20), 255]

            # Nose bridge / nostrils (fixed on base at y=33..36, x=30..34)
            if 33 <= y <= 35 and x in (32, 33):
                base[y * W + x] = skin_shadow
            if y == 36 and 31 <= x <= 34:
                base[y * W + x] = skin_shadow

    # Ensure eye and mouth zones are flat skin (no features drawn!)
    for y in range(25, 33):
        for x in range(22, 43):
            if base[y * W + x][3] > 0:
                base[y * W + x] = skin_base
    for y in range(37, 48):
        for x in range(23, 42):
            if base[y * W + x][3] > 0:
                base[y * W + x] = skin_base

    # Special feature: Hawk's brow scar
    if char_id == 'hawk':
        for i in range(4):
            base[(22 + i) * W + (26 + i)] = [180, 120, 100, 255]

    raw = []
    for p in base: raw.extend(p)
    save_png(f'{folder}/base.png', W, H, bytearray(raw))

    # --- EYES OVERLAYS (64x64, transparent except eyes) ---
    def save_overlay(filename, draw_func):
        ov = [[0, 0, 0, 0] for _ in range(W * H)]
        draw_func(ov)
        raw = []
        for p in ov: raw.extend(p)
        save_png(f'{folder}/{filename}', W, H, bytearray(raw))

    # Eyes Open
    def draw_eyes_open(grid):
        for y in range(26, 31):
            for x in list(range(24, 30)) + list(range(34, 40)):
                grid[y * W + x] = [240, 245, 250, 255] # sclera
        # Pupils
        for y in range(27, 30):
            grid[y * W + 27] = [20, 24, 30, 255]
            grid[y * W + 28] = [20, 24, 30, 255]
            grid[y * W + 36] = [20, 24, 30, 255]
            grid[y * W + 37] = [20, 24, 30, 255]
        # Upper eyelid line
        for x in list(range(23, 31)) + list(range(33, 41)):
            grid[25 * W + x] = [30, 20, 16, 255]

    # Eyes Half
    def draw_eyes_half(grid):
        for y in range(28, 31):
            for x in list(range(24, 30)) + list(range(34, 40)):
                grid[y * W + x] = [230, 235, 240, 255]
        for y in range(28, 30):
            grid[y * W + 27] = [20, 24, 30, 255]
            grid[y * W + 36] = [20, 24, 30, 255]
        for x in list(range(23, 31)) + list(range(33, 41)):
            grid[27 * W + x] = [30, 20, 16, 255]

    # Eyes Closed
    def draw_eyes_closed(grid):
        for x in list(range(24, 30)) + list(range(34, 40)):
            grid[29 * W + x] = [30, 20, 16, 255]
            grid[30 * W + x] = skin_shadow

    save_overlay('eyes_open.png', draw_eyes_open)
    save_overlay('eyes_half.png', draw_eyes_half)
    save_overlay('eyes_closed.png', draw_eyes_closed)

    # --- MOUTH OVERLAYS (64x64, transparent except mouth) ---
    # Shapes: rest, A, E, O, MB, FV
    lip_c = [max(0, skin_base[0] - 30), max(0, skin_base[1] - 40), max(0, skin_base[2] - 30), 255]
    dark_c = [24, 10, 10, 255]
    teeth_c = [245, 245, 240, 255]

    # Mouth Rest (closed calm slit)
    def draw_mouth_rest(grid):
        for x in range(28, 37):
            grid[41 * W + x] = lip_c
        for x in range(29, 36):
            grid[42 * W + x] = [30, 14, 14, 255]

    # Mouth A (wide open jaw)
    def draw_mouth_a(grid):
        for y in range(40, 46):
            for x in range(28, 37):
                grid[y * W + x] = dark_c
        for x in range(29, 36):
            grid[40 * W + x] = teeth_c # upper teeth
        for x in range(27, 38):
            grid[39 * W + x] = lip_c # upper lip
            grid[46 * W + x] = lip_c # lower lip

    # Mouth E (wide, visible teeth smile/grimace)
    def draw_mouth_e(grid):
        for y in range(41, 44):
            for x in range(26, 39):
                grid[y * W + x] = dark_c
        for x in range(27, 38):
            grid[41 * W + x] = teeth_c
            grid[42 * W + x] = teeth_c
        for x in range(26, 39):
            grid[40 * W + x] = lip_c
            grid[44 * W + x] = lip_c

    # Mouth O (small round opening)
    def draw_mouth_o(grid):
        for y in range(40, 45):
            for x in range(29, 36):
                grid[y * W + x] = dark_c
        for x in range(30, 35):
            grid[39 * W + x] = lip_c
            grid[45 * W + x] = lip_c
        for y in range(40, 45):
            grid[y * W + 29] = lip_c
            grid[y * W + 35] = lip_c

    # Mouth MB (firmly closed, pressed together)
    def draw_mouth_mb(grid):
        for y in range(41, 43):
            for x in range(28, 37):
                grid[y * W + x] = [34, 16, 16, 255]
        for x in range(27, 38):
            grid[40 * W + x] = lip_c
            grid[43 * W + x] = lip_c

    # Mouth FV (lower lip pressed under upper teeth)
    def draw_mouth_fv(grid):
        for x in range(27, 38):
            grid[41 * W + x] = teeth_c
            grid[42 * W + x] = lip_c
            grid[40 * W + x] = lip_c

    save_overlay('mouth_rest.png', draw_mouth_rest)
    save_overlay('mouth_A.png', draw_mouth_a)
    save_overlay('mouth_E.png', draw_mouth_e)
    save_overlay('mouth_O.png', draw_mouth_o)
    save_overlay('mouth_MB.png', draw_mouth_mb)
    save_overlay('mouth_FV.png', draw_mouth_fv)

    # --- HEAD.JSON ---
    head_meta = {
        "name": name,
        "size": [64, 64],
        "eyes": {
            "open": "eyes_open.png",
            "half": "eyes_half.png",
            "closed": "eyes_closed.png"
        },
        "mouth": {
            "rest": "mouth_rest.png",
            "A": "mouth_A.png",
            "E": "mouth_E.png",
            "O": "mouth_O.png",
            "MB": "mouth_MB.png",
            "FV": "mouth_FV.png"
        },
        "blink": {"min": 2.0, "max": 5.0},
        "voiceBlip": 220 if char_id == 'imani' else 310 if char_id == 'hawk' else 260
    }
    with open(f'{folder}/head.json', 'w') as f:
        json.dump(head_meta, f, indent=2)

def main():
    print("Generating cutscene backgrounds and sprites...")
    make_bg_space()
    make_bg_briefing()
    make_ship_kestrel()
    make_ship_halberd()
    make_ui_frame()

    print("Generating talking heads...")
    # Cdr. Imani (older, calm, dark navy command collar, silver hair, dark skin)
    make_head('imani', 'CDR. IMANI',
              skin_base=[140, 95, 70, 255], skin_shadow=[100, 65, 45, 255],
              hair_c=[190, 195, 200, 255], uniform_c=[24, 32, 48, 255], collar_c=[220, 160, 30, 255])

    # Hawk (Lt. Maya Okafor, flight lead, late 30s Nigerian descent, short hair)
    make_head('hawk', 'HAWK',
              skin_base=[115, 75, 50, 255], skin_shadow=[80, 50, 32, 255],
              hair_c=[25, 18, 16, 255], uniform_c=[45, 48, 52, 255], collar_c=[200, 140, 25, 255])

    # Meow (Lt. Tom Cat, player pilot, calm focused)
    make_head('meow', 'MEOW',
              skin_base=[195, 145, 110, 255], skin_shadow=[145, 105, 75, 255],
              hair_c=[40, 28, 22, 255], uniform_c=[45, 48, 52, 255], collar_c=[200, 140, 25, 255])

    print("All cutscene assets generated successfully!")

if __name__ == '__main__':
    main()
