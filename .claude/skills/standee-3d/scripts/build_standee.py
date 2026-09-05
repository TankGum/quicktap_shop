#!/usr/bin/env python3
"""Dựng mô hình 3D standee chữ A liền đáy từ một file PDF thiết kế.

    python3 build_standee.py design.pdf -o standee.html

Trang 1 -> mặt trước, trang 2 -> mặt sau. Mặt đáy là tấm trong có đường khớp
giữa, in mực của trang 3 (đã bỏ nền trắng) xếp lại cho vừa khổ đáy.
Cần ImageMagick + Ghostscript để render PDF (brew install imagemagick ghostscript).
"""
import argparse, base64, math, os, re, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(HERE, '..', 'assets', 'template.html')
PT_MM = 25.4 / 72.0
A_SERIES = {(105, 148): 'A6', (148, 210): 'A5', (210, 297): 'A4', (74, 105): 'A7'}


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit('lỗi khi chạy %s\n%s' % (cmd[0], r.stderr.strip()))
    return r.stdout


def page_geometry(pdf):
    """Trả về (số trang, rộng mm, cao mm) đọc từ chính file PDF."""
    out = run(['magick', 'identify', '-format', '%w %h\n', pdf]).strip().splitlines()
    if not out:
        sys.exit('không đọc được trang nào trong %s' % pdf)
    w, h = (float(x) for x in out[0].split())
    return len(out), w * PT_MM, h * PT_MM


def render(pdf, index, tmp, width_px, colors):
    """Render 1 trang PDF ra PNG đã giảm màu, trả về data URI."""
    png = os.path.join(tmp, 'p%d.png' % index)
    cmd = ['magick', '-density', '300', '%s[%d]' % (pdf, index),
           '-background', 'white', '-alpha', 'remove', '-alpha', 'off']
    cmd += ['-resize', '%dx' % width_px,
            '+dither', '-colors', str(colors), '-depth', '8',
            '-define', 'png:compression-level=9', '-strip', png]
    run(cmd)
    with open(png, 'rb') as f:
        return 'data:image/png;base64,' + base64.b64encode(f.read()).decode()


CLEAR_PIXEL = ('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ'
               'AAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')


def ink_rows(img, height):
    """Trắc diện mực theo từng hàng: nén ảnh còn 1 pixel bề ngang rồi đọc alpha."""
    txt = run(['magick', img, '-alpha', 'extract', '-resize', '1x%d!' % height,
               '-depth', '8', 'txt:-'])
    vals = [0] * height
    for line in txt.splitlines():
        m = re.match(r'0,(\d+):\s*\((\d+)', line)
        if m:
            y = int(m.group(1))
            if y < height:
                vals[y] = int(m.group(2))
    return vals


def clusters_of(vals, gap_min, floor=4):
    """Gom các hàng có mực thành từng cụm, bỏ qua khe hở nhỏ hơn gap_min."""
    out, run_start, last = [], None, None
    for y, v in enumerate(vals):
        if v > floor:
            if run_start is None:
                run_start = y
            elif y - last > gap_min:
                out.append((run_start, last))
                run_start = y
            last = y
    if run_start is not None:
        out.append((run_start, last))
    return out


def base_art(pdf, tmp, width_px, base_h_px):
    """Bóc mực trang 3 (bỏ nền trắng) rồi xếp cho vừa mặt đáy.

    Trang 3 là khổ dọc còn đáy thì ngang và ngắn, nên không đặt nguyên trang được.
    Dò xem mực nằm thành mấy cụm: một cụm thì đặt giữa đáy, từ hai cụm trở lên thì
    dồn về hai cụm và đặt mỗi cụm vào một nửa — đúng chỗ hai cánh gấp.
    """
    ink = os.path.join(tmp, 'ink.png')
    run(['magick', '-density', '300', '%s[2]' % pdf, '-background', 'white',
         '-flatten', '-resize', '%dx' % width_px,
         '-fuzz', '12%', '-transparent', 'white', 'PNG32:' + ink])
    src_h = int(run(['magick', 'identify', '-format', '%h', ink]))
    pad = max(6, base_h_px // 22)

    groups = clusters_of(ink_rows(ink, src_h), gap_min=int(src_h * .04))
    if not groups:
        return CLEAR_PIXEL
    if len(groups) > 2:                      # dồn về hai cụm ở khe hở rộng nhất
        gaps = [(groups[i + 1][0] - groups[i][1], i) for i in range(len(groups) - 1)]
        cut = max(gaps)[1]
        groups = [(groups[0][0], groups[cut][1]),
                  (groups[cut + 1][0], groups[-1][1])]

    if len(groups) == 1:
        slots = [(groups[0], 'Center', base_h_px - 2 * pad)]
    else:
        slots = [(groups[0], 'North', base_h_px // 2 - 2 * pad),
                 (groups[1], 'South', base_h_px // 2 - 2 * pad)]

    cmd = ['magick', '-size', '%dx%d' % (width_px, base_h_px), 'xc:none']
    for (y0, y1), gravity, cap in slots:
        blk = os.path.join(tmp, 'blk%s.png' % gravity)
        run(['magick', ink, '-crop', '%dx%d+0+%d' % (width_px, y1 - y0 + 1, y0),
             '+repage', '-trim', '+repage',
             '-resize', '%dx%d>' % (width_px - 2 * pad, cap), 'PNG32:' + blk])
        h = int(run(['magick', 'identify', '-format', '%h', blk]))
        if gravity == 'Center':
            offset = 0
        else:
            offset = max(pad, (base_h_px // 2 - h) // 2)
        cmd += [blk, '-gravity', gravity, '-geometry', '+0+%d' % offset, '-composite']

    out = os.path.join(tmp, 'base.png')
    run(cmd + ['PNG32:' + out])
    with open(out, 'rb') as f:
        return 'data:image/png;base64,' + base64.b64encode(f.read()).decode()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('pdf')
    ap.add_argument('-o', '--out', default='standee.html')
    ap.add_argument('--depth', type=float, default=47,
                    help='chiều sâu mặt đáy, mm (mặc định 47)')
    ap.add_argument('--thickness', type=float, default=2, help='độ dày giấy, mm')
    ap.add_argument('--no-base-art', action='store_true',
                    help='đáy để kính trơn, không in nội dung trang 3')
    ap.add_argument('--width-px', type=int, default=1050, help='bề rộng ảnh nhúng')
    ap.add_argument('--colors', type=int, default=32, help='số màu khi giảm màu')
    a = ap.parse_args()

    if not shutil.which('magick'):
        sys.exit('thiếu ImageMagick — cài bằng: brew install imagemagick ghostscript')
    if not os.path.exists(a.pdf):
        sys.exit('không thấy file %s' % a.pdf)

    pages, pw, ph = page_geometry(a.pdf)
    if pages < 2:
        sys.exit('PDF chỉ có %d trang, cần ít nhất 2 (trước + sau)' % pages)

    span = 2 * ph                      # sải chân tối đa khi gấp 90 độ
    if a.depth >= span:
        sys.exit('đáy %.0fmm không thể sâu hơn %.0fmm với tấm cao %.0fmm'
                 % (a.depth, span, ph))
    t = math.asin(a.depth / span)      # góc gấp để hai chân chạm đúng mép đáy
    ang = math.degrees(t)

    with tempfile.TemporaryDirectory() as tmp:
        img1 = render(a.pdf, 0, tmp, a.width_px, a.colors)
        img2 = render(a.pdf, 1, tmp, a.width_px, a.colors)
        if pages >= 3 and not a.no_base_art:
            img3 = base_art(a.pdf, tmp, a.width_px,
                            int(round(a.width_px * a.depth / pw)))
        else:
            img3 = CLEAR_PIXEL

    size = A_SERIES.get((round(pw), round(ph)), '')
    label = size or '%.0f×%.0f mm' % (pw, ph)
    heading = 'Standee chữ A liền đáy' + (', khổ ' + size if size else '')

    with open(TEMPLATE, encoding='utf-8') as f:
        html = f.read()
    for key, val in {
        '__IMG1__': img1, '__IMG2__': img2, '__IMG3__': img3,
        '__PW__': '%g' % round(pw), '__PH__': '%g' % round(ph),
        '__TH__': '%g' % a.thickness, '__DEPTH__': '%g' % a.depth,
        '__ANG__': '%.3f' % ang, '__SIN__': '%.5f' % math.sin(t),
        '__COS__': '%.5f' % math.cos(t),
        '__ANGVN__': ('%.1f' % ang).replace('.', ','),
        '__SIZELABEL__': size or 'Khổ',
        '__TITLE__': 'QuickTap · Standee 3D', '__HEADING__': heading,
        '__PDFNAME__': os.path.basename(a.pdf),
    }.items():
        html = html.replace(key, val)

    left = re.findall(r'__[A-Z0-9]+__', html)
    if left:
        sys.exit('còn placeholder chưa thay: %s' % sorted(set(left)))

    with open(a.out, 'w', encoding='utf-8') as f:
        f.write(html)
    print('%s — %s %.0f×%.0f mm · dày %gmm · đáy %.0f×%g mm · cao %.0f mm · gấp %.1f° · %d KB'
          % (a.out, label, pw, ph, a.thickness, pw, a.depth,
             ph * math.cos(t) + a.thickness, ang, os.path.getsize(a.out) // 1024))


if __name__ == '__main__':
    main()
