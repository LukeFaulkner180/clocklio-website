"""Replace only the cover leaves of the DayRidge brochure; retain every internal page."""
from __future__ import annotations

import hashlib
from io import BytesIO
from pathlib import Path
from reportlab.lib.colors import Color, HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / 'public/downloads/dayridge-product-brochure.pdf'
COVER = ROOT / 'public/assets/dayridge-brochure-approved-cover.jpg'
ICON = ROOT / 'public/assets/dayridge-favicon.png'
ALIAS = ROOT / 'public/downloads/clocknexa-product-brochure.pdf'


def gradient_top_bottom(c: canvas.Canvas, width: float, height: float) -> None:
    top = (10, 29, 60)
    bottom = (9, 16, 44)
    strips = 170
    for i in range(strips):
        t = i / max(1, strips - 1)
        rgb = tuple((top[k] * t + bottom[k] * (1 - t)) / 255.0 for k in range(3))
        c.setFillColor(Color(*rgb))
        yy = height * i / strips
        c.rect(0, yy, width, height / strips + 1, stroke=0, fill=1)

    c.setStrokeColor(HexColor('#294b91'))
    c.setLineWidth(0.75)
    for radius in (165, 245, 335, 440):
        c.circle(width + 115, height + 82, radius, stroke=1, fill=0)
    c.setStrokeColor(HexColor('#273a81'))
    c.setLineWidth(0.6)
    for radius in (235, 325, 430):
        c.circle(-95, -100, radius, stroke=1, fill=0)
    c.setFillColor(HexColor('#303e9b'))
    p = c.beginPath()
    p.moveTo(width, height)
    p.lineTo(width - 56, height)
    p.curveTo(width - 52, height - 28, width - 27, height - 65, width, height - 72)
    p.close()
    c.drawPath(p, stroke=0, fill=1)
    c.setFillColor(HexColor('#253e96'))
    p = c.beginPath()
    p.moveTo(0, 0)
    p.lineTo(83, 0)
    p.curveTo(86, 45, 51, 85, 0, 98)
    p.close()
    c.drawPath(p, stroke=0, fill=1)


def build_cover_page(width: float, height: float, front: bool) -> BytesIO:
    stream = BytesIO()
    c = canvas.Canvas(stream, pagesize=(width, height), pageCompression=1)
    if front:
        # The approved cover is 1055 x 1491, matching the original A4 aspect ratio.
        c.drawImage(ImageReader(str(COVER)), 0, 0, width=width, height=height)
    else:
        gradient_top_bottom(c, width, height)
        font_path = Path('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')
        if font_path.exists():
            pdfmetrics.registerFont(TTFont('DayRidgeBackBold', str(font_path)))
            font = 'DayRidgeBackBold'
        else:
            font = 'Helvetica-Bold'
        font_size = 40
        mark = 69
        pad = 18
        name = 'DayRidge'
        text_width = pdfmetrics.stringWidth(name, font, font_size)
        group_width = mark + pad + text_width
        x = (width - group_width) / 2
        y = (height - mark) / 2
        c.drawImage(ImageReader(str(ICON)), x, y, width=mark, height=mark, mask='auto')
        c.setFont(font, font_size)
        c.setFillColor(HexColor('#ffffff'))
        c.drawString(x + mark + pad, y + (mark - font_size) / 2 + 5, name)
    c.showPage()
    c.save()
    stream.seek(0)
    return stream


def main() -> None:
    original = PdfReader(str(PDF))
    if len(original.pages) != 12:
        raise RuntimeError(f'Expected the existing 12-page DayRidge brochure; got {len(original.pages)}.')
    w = float(original.pages[0].mediabox.width)
    h = float(original.pages[0].mediabox.height)
    front_page = PdfReader(build_cover_page(w, h, True)).pages[0]
    back_page = PdfReader(build_cover_page(w, h, False)).pages[0]
    result = PdfWriter()
    result.add_page(front_page)
    for i in range(1, len(original.pages) - 1):
        result.add_page(original.pages[i])
    result.add_page(back_page)
    tmp = PDF.with_suffix('.covers-new.pdf')
    with tmp.open('wb') as output:
        result.write(output)
    verify = PdfReader(str(tmp))
    if len(verify.pages) != len(original.pages):
        raise RuntimeError('Brochure page count changed unexpectedly.')
    for i in range(1, len(original.pages) - 1):
        before = original.pages[i]
        after = verify.pages[i]
        if (before.extract_text() or '') != (after.extract_text() or ''):
            raise RuntimeError(f'Inside page {i + 1} text changed.')
        source_content = before.get_contents()
        result_content = after.get_contents()
        if hashlib.sha256(source_content.get_data()).digest() != hashlib.sha256(result_content.get_data()).digest():
            raise RuntimeError(f'Inside page {i + 1} artwork/content changed.')
    tmp.replace(PDF)
    ALIAS.write_bytes(PDF.read_bytes())
    print('PASS: replaced only cover pages; internal page streams unchanged (pages 2-11).')
    print('Cover file:', COVER)
    print('Published PDF:', PDF, PDF.stat().st_size, 'bytes')


if __name__ == '__main__':
    main()