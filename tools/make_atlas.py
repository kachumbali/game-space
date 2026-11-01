#!/usr/bin/env python3
"""Atlas helper & validation tool for cutscene assets (docs/INTRO_TEST_SPEC.md).
Validates:
1. Exact image dimensions
2. Colour counts (<= 32 unique colours per image)
3. Head alignment: creates heads_test_sheet.png showing each character with overlays
4. Validates scene.json syntax
"""
import os, struct, zlib, json, sys

def read_png(path):
    with open(path, 'rb') as f:
        data = f.read()
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError(f"Not a PNG: {path}")

    idx = 8
    width = height = None
    idat_parts = []
    while idx < len(data):
        length = struct.unpack('>I', data[idx:idx+4])[0]
        tag = data[idx+4:idx+8]
        chunk_data = data[idx+8:idx+8+length]
        idx += 12 + length
        if tag == b'IHDR':
            width, height, bit_depth, color_type = struct.unpack('>IIBB', chunk_data[:10])
            if bit_depth != 8 or color_type != 6:
                pass # RGBA expected, we handle raw 8-bit RGBA
        elif tag == b'IDAT':
            idat_parts.append(chunk_data)
        elif tag == b'IEND':
            break

    raw = zlib.decompress(b''.join(idat_parts))
    pixels = []
    stride = width * 4
    for y in range(height):
        # 1 filter byte + stride
        row_offset = y * (stride + 1) + 1
        row = raw[row_offset : row_offset + stride]
        for x in range(width):
            pixels.append(tuple(row[x*4 : x*4+4]))
    return width, height, pixels

def save_png(filename, width, height, rgba_pixels):
    os.makedirs(os.path.dirname(os.path.abspath(filename)), exist_ok=True)
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    raw = bytearray()
    for y in range(height):
        raw.append(0)
        for x in range(width):
            raw.extend(rgba_pixels[y * width + x])
    idat = zlib.compress(bytes(raw), 9)
    with open(filename, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(chunk(b'IHDR', ihdr))
        f.write(chunk(b'IDAT', idat))
        f.write(chunk(b'IEND', b''))

def composite(base, overlay):
    out = []
    for (br, bg, bb, ba), (or_, og, ob, oa) in zip(base, overlay):
        if oa == 0:
            out.append((br, bg, bb, ba))
        elif oa == 255:
            out.append((or_, og, ob, oa))
        else:
            alpha = oa / 255.0
            r = int(or_ * alpha + br * (1.0 - alpha))
            g = int(og * alpha + bg * (1.0 - alpha))
            b = int(ob * alpha + bb * (1.0 - alpha))
            out.append((r, g, b, 255))
    return out

def main():
    root = 'assets/scenes/intro_test'
    specs = {
        f'{root}/bg_space.png': (320, 200),
        f'{root}/bg_briefing.png': (320, 200),
        f'{root}/ship_kestrel.png': (96, 48),
        f'{root}/ship_halberd.png': (160, 56),
        f'{root}/ui_frame.png': (320, 200),
    }

    head_chars = ['imani', 'hawk', 'meow']
    head_files = ['base.png', 'eyes_open.png', 'eyes_half.png', 'eyes_closed.png',
                  'mouth_rest.png', 'mouth_A.png', 'mouth_E.png', 'mouth_O.png', 'mouth_MB.png', 'mouth_FV.png']

    for c in head_chars:
        for hf in head_files:
            specs[f'{root}/heads/{c}/{hf}'] = (64, 64)

    errors = []
    print(f"=== Cutscene Assets Validation (<= 32 colours, exact sizes) ===")
    for path, (req_w, req_h) in specs.items():
        if not os.path.exists(path):
            errors.append(f"Missing file: {path}")
            continue
        w, h, px = read_png(path)
        colors = len(set(px))
        status = "OK"
        if w != req_w or h != req_h:
            status = f"ERROR: size is {w}x{h}, expected {req_w}x{req_h}"
            errors.append(f"{path}: {status}")
        elif colors > 32:
            status = f"ERROR: {colors} colours (must be <= 32)"
            errors.append(f"{path}: {status}")
        else:
            status = f"OK ({w}x{h}, {colors} colours)"
        print(f"  {path:45} {status}")

    # Validate head.json
    for c in head_chars:
        hj = f'{root}/heads/{c}/head.json'
        if not os.path.exists(hj):
            errors.append(f"Missing head.json: {hj}")
        else:
            try:
                data = json.load(open(hj))
                assert data.get('size') == [64, 64]
                assert 'eyes' in data and 'mouth' in data
                print(f"  {hj:45} OK (parsed, valid)")
            except Exception as e:
                errors.append(f"{hj}: invalid json ({e})")

    # Validate scene.json
    sj = f'{root}/scene.json'
    if not os.path.exists(sj):
        errors.append(f"Missing scene.json: {sj}")
    else:
        try:
            data = json.load(open(sj))
            assert data.get('id') == 'intro_test'
            assert data.get('size') == [320, 200]
            assert len(data.get('events', [])) > 0
            print(f"  {sj:45} OK ({len(data['events'])} events)")
        except Exception as e:
            errors.append(f"{sj}: invalid json ({e})")

    # Generate test sheet composite: 7 columns x 3 rows (64x64 each = 448 x 192)
    # Col 1: Base alone
    # Col 2: Base + Eyes Open + Mouth Rest
    # Col 3: Base + Eyes Open + Mouth A
    # Col 4: Base + Eyes Open + Mouth E
    # Col 5: Base + Eyes Open + Mouth O
    # Col 6: Base + Eyes Half + Mouth MB
    # Col 7: Base + Eyes Closed + Mouth FV
    print("\nGenerating head alignment test sheet (heads_test_sheet.png)...")
    sheet_w, sheet_h = 64 * 7, 64 * len(head_chars)
    sheet_px = [(10, 16, 24, 255)] * (sheet_w * sheet_h)

    for row_idx, char_id in enumerate(head_chars):
        hdir = f'{root}/heads/{char_id}'
        _, _, base_px = read_png(f'{hdir}/base.png')
        _, _, e_open = read_png(f'{hdir}/eyes_open.png')
        _, _, e_half = read_png(f'{hdir}/eyes_half.png')
        _, _, e_close = read_png(f'{hdir}/eyes_closed.png')
        _, _, m_rest = read_png(f'{hdir}/mouth_rest.png')
        _, _, m_a = read_png(f'{hdir}/mouth_A.png')
        _, _, m_e = read_png(f'{hdir}/mouth_E.png')
        _, _, m_o = read_png(f'{hdir}/mouth_O.png')
        _, _, m_mb = read_png(f'{hdir}/mouth_MB.png')
        _, _, m_fv = read_png(f'{hdir}/mouth_FV.png')

        cols = [
            base_px,
            composite(composite(base_px, e_open), m_rest),
            composite(composite(base_px, e_open), m_a),
            composite(composite(base_px, e_open), m_e),
            composite(composite(base_px, e_open), m_o),
            composite(composite(base_px, e_half), m_mb),
            composite(composite(base_px, e_close), m_fv)
        ]

        for col_idx, cell_px in enumerate(cols):
            x_offset = col_idx * 64
            y_offset = row_idx * 64
            for cy in range(64):
                for cx in range(64):
                    sheet_px[(y_offset + cy) * sheet_w + (x_offset + cx)] = cell_px[cy * 64 + cx]

    test_sheet_path = f'{root}/heads_test_sheet.png'
    save_png(test_sheet_path, sheet_w, sheet_h, sheet_px)
    print(f"Saved alignment test sheet: {test_sheet_path} ({sheet_w}x{sheet_h})")

    if errors:
        print("\nERRORS DETECTED:")
        for e in errors: print(f"  {e}")
        sys.exit(1)
    else:
        print("\nALL ASSETS VALIDATED SUCCESSFULLY! 0 ERRORS.")
        sys.exit(0)

if __name__ == '__main__':
    main()
