"""
Genera los PDF de ayuda (public/ayuda/*.pdf) a partir de lib/ayuda.json.
Uso:  python scripts/generar-guias-pdf.py
Requiere: pip install reportlab
Correrlo cada vez que se cambie lib/ayuda.json.
"""
import json, os, sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GUIAS = json.load(open(os.path.join(RAIZ, 'lib', 'ayuda.json'), encoding='utf-8'))
SALIDA = os.path.join(RAIZ, 'public', 'ayuda')
os.makedirs(SALIDA, exist_ok=True)

# Mismo orden que el menú de la app (lib/menu-revendedora.ts)
ORDEN = [
    ('', ['inicio']),
    ('Ventas', ['pedidos', 'clientes', 'estadisticas']),
    ('Mi tienda', ['diseno', 'productos', 'paginas', 'promos']),
    ('Comprar a Nadin', ['catalogo', 'mis-pedidos', 'consolidar', 'chat']),
    ('Configuración', ['cobros', 'entregas', 'marca', 'perfil', 'notificaciones']),
]

# Fuente con acentos y símbolos (DejaVu); si no está, Helvetica
FUENTE, NEGRITA = 'Helvetica', 'Helvetica-Bold'
for base in ['/usr/share/fonts/truetype/dejavu', 'C:/Windows/Fonts', os.path.join(RAIZ, 'scripts', 'fonts')]:
    reg, bold = os.path.join(base, 'DejaVuSans.ttf'), os.path.join(base, 'DejaVuSans-Bold.ttf')
    if os.path.exists(reg) and os.path.exists(bold):
        pdfmetrics.registerFont(TTFont('DejaVu', reg))
        pdfmetrics.registerFont(TTFont('DejaVu-Bold', bold))
        from reportlab.pdfbase.pdfmetrics import registerFontFamily
        registerFontFamily('DejaVu', normal='DejaVu', bold='DejaVu-Bold', italic='DejaVu', boldItalic='DejaVu-Bold')
        FUENTE, NEGRITA = 'DejaVu', 'DejaVu-Bold'
        break

ROSA, ROSA_CLARO, GRIS, TINTA, AMBAR = HexColor('#db2777'), HexColor('#fce7f3'), HexColor('#6b7280'), HexColor('#111827'), HexColor('#fffbeb')

st = {
    'tapa_t': ParagraphStyle('tt', fontName=NEGRITA, fontSize=26, leading=32, textColor=TINTA, spaceAfter=6),
    'tapa_s': ParagraphStyle('ts', fontName=FUENTE, fontSize=13, leading=18, textColor=GRIS),
    'grupo': ParagraphStyle('g', fontName=NEGRITA, fontSize=9, leading=12, textColor=ROSA, spaceAfter=2),
    'titulo': ParagraphStyle('t', fontName=NEGRITA, fontSize=20, leading=25, textColor=TINTA, spaceAfter=4),
    'para': ParagraphStyle('p', fontName=FUENTE, fontSize=11.5, leading=16, textColor=GRIS, spaceAfter=10),
    'h': ParagraphStyle('h', fontName=NEGRITA, fontSize=12, leading=16, textColor=TINTA, spaceBefore=6, spaceAfter=6),
    'paso': ParagraphStyle('ps', fontName=FUENTE, fontSize=11.5, leading=16, textColor=TINTA),
    'num': ParagraphStyle('n', fontName=NEGRITA, fontSize=11, leading=16, textColor=ROSA, alignment=1),
    'tip': ParagraphStyle('tp', fontName=FUENTE, fontSize=10.5, leading=15, textColor=HexColor('#78350f')),
    'idx': ParagraphStyle('ix', fontName=FUENTE, fontSize=11.5, leading=18, textColor=TINTA),
}

def esc(t):
    return t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

def bloque_guia(gid, grupo):
    g = GUIAS[gid]
    out = []
    if grupo:
        out.append(Paragraph(esc(grupo.upper()), st['grupo']))
    out.append(Paragraph(esc(g['titulo']), st['titulo']))
    out.append(Paragraph(esc(g['para']), st['para']))
    if g['pasos']:
        out.append(Paragraph('Paso a paso', st['h']))
        filas = [[Paragraph(str(i + 1), st['num']), Paragraph(esc(p), st['paso'])] for i, p in enumerate(g['pasos'])]
        t = Table(filas, colWidths=[9 * mm, None])
        t.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BACKGROUND', (0, 0), (0, -1), ROSA_CLARO),
            ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (1, 0), (1, -1), 8),
            ('LINEBELOW', (0, 0), (-1, -2), 0.5, HexColor('#f3f4f6')),
        ]))
        out.append(t)
    if g['consejos']:
        out.append(Spacer(1, 10))
        filas = [[Paragraph('<b>Consejos</b>', st['tip'])]] + [[Paragraph('• ' + esc(c), st['tip'])] for c in g['consejos']]
        t = Table(filas, colWidths=[None])
        t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), AMBAR), ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
                               ('TOPPADDING', (0, 0), (-1, -1), 3), ('BOTTOMPADDING', (0, 0), (-1, -1), 3)]))
        out.append(KeepTogether(t))
    return out

def pie(c, doc):
    c.saveState()
    c.setFont(FUENTE, 8.5)
    c.setFillColor(GRIS)
    c.drawString(18 * mm, 10 * mm, 'Mi Tienda · Nadin Lencería — Guía de uso')
    c.drawRightString(A4[0] - 18 * mm, 10 * mm, f'Página {doc.page}')
    c.setStrokeColor(ROSA); c.setLineWidth(2)
    c.line(18 * mm, A4[1] - 12 * mm, A4[0] - 18 * mm, A4[1] - 12 * mm)
    c.restoreState()

def doc(nombre, titulo):
    return SimpleDocTemplate(os.path.join(SALIDA, nombre), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm,
                             topMargin=20 * mm, bottomMargin=18 * mm, title=titulo, author='Nadin Lencería')

# Una por sección (más la de la página de ayuda)
grupo_de = {gid: gr for gr, ids in ORDEN for gid in ids}
for gid in GUIAS:
    d = doc(f'{gid}.pdf', GUIAS[gid]['titulo'])
    d.build(bloque_guia(gid, grupo_de.get(gid, '')), onFirstPage=pie, onLaterPages=pie)

# Guía completa con índice
historia = [Spacer(1, 40 * mm), Paragraph('Mi Tienda', st['tapa_t']), Paragraph('Guía completa de uso para revendedoras de Nadin Lencería', st['tapa_s']), Spacer(1, 12 * mm)]
for gr, ids in ORDEN:
    if gr:
        historia.append(Paragraph(esc(gr), st['h']))
    for gid in ids:
        historia.append(Paragraph('• ' + esc(GUIAS[gid]['titulo']), st['idx']))
for gr, ids in ORDEN:
    for gid in ids:
        historia.append(PageBreak())
        historia += bloque_guia(gid, gr)
doc('guia-completa.pdf', 'Mi Tienda — Guía completa').build(historia, onFirstPage=pie, onLaterPages=pie)
print('PDFs generados en', SALIDA, 'con fuente', FUENTE)
