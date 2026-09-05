#!/usr/bin/env python3
"""Xuất ảnh 3 mặt của từng standee ra public/assets/standee3d/ cho component Standee3D.

    python3 scripts/standee-assets.py

Dùng lại đúng pipeline của skill standee-3d (skills/standee-3d/scripts/build_standee.py):
trang 1 -> mặt trước, trang 2 -> mặt sau, trang 3 -> mực in lên mặt đáy trong suốt.
Thêm/bớt mẫu thì sửa MODELS bên dưới rồi chạy lại; nhớ sửa data/standee3d.js cho khớp.
"""
import base64, os, sys, tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '.claude', 'skills',
                                'standee-3d', 'scripts'))
from build_standee import render, base_art, page_geometry  # noqa: E402

WIDTH = 900          # đủ nét ở cỡ hiển thị thật (~300px, màn Retina), file lại nhẹ
DEPTH_MM = 47        # phải khớp DEPTH trong components/Standee3D.jsx
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'standee3d')

MODELS = {
    'tripadvisor': 'tripadvisor_standee_ kvan997q.pdf',
    'google': 'google_standee_ e8idxv2t.pdf',
    'booking': 'booking_standee_ mr435uy7.pdf',
    'quicktap': 'standee_default_a2fnejcu.pdf',
}


def write(data_uri, path):
    with open(path, 'wb') as f:
        f.write(base64.b64decode(data_uri.split(',', 1)[1]))
    return os.path.getsize(path) // 1024


def main():
    root = os.path.join(os.path.dirname(__file__), '..')
    os.makedirs(OUT, exist_ok=True)
    for slug, pdf in MODELS.items():
        path = os.path.join(root, pdf)
        _, pw, _ = page_geometry(path)
        with tempfile.TemporaryDirectory() as tmp:
            parts = {
                'front': render(path, 0, tmp, WIDTH, 32),
                'back': render(path, 1, tmp, WIDTH, 32),
                'base': base_art(path, tmp, WIDTH, int(round(WIDTH * DEPTH_MM / pw))),
            }
        sizes = {k: write(v, os.path.join(OUT, '%s-%s.png' % (slug, k)))
                 for k, v in parts.items()}
        print(slug, ' '.join('%s %dKB' % kv for kv in sizes.items()))


if __name__ == '__main__':
    main()
