from pathlib import Path
import json, math, re
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle
from reportlab.graphics.shapes import Drawing, Group, Rect, Circle
from reportlab.graphics.svgpath import SvgPath
from reportlab.graphics import renderPDF
from reportlab.graphics.barcode import qr

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/pdf/DayRidge-Business-Owner-Guide.pdf'
OUT.parent.mkdir(parents=True,exist_ok=True)
PAGES=json.loads((ROOT/'content/business-owner-guide.json').read_text())
for name,file in [('Body','DejaVuSans.ttf'),('Strong','DejaVuSans-Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(name,'/usr/share/fonts/truetype/dejavu/'+file))
W,H=A4; M=45; CW=W-2*M
INK='#202A3C'; PURPLE='#6748DE'; MUTED='#647080'; PAPER='#FAF9F6'; LILAC='#EEE9FC'; MINT='#DDF2E9'; GREEN='#34785B'; LINE='#DDDDE7'
c=canvas.Canvas(str(OUT),pagesize=A4,pageCompression=1)
c.setTitle('DayRidge | Business Owner Guide')
c.setAuthor('DayRidge');c.setSubject('A practical guide to business setup, staff, rotas, attendance, payroll hours, documents, Geo Clock-in, Tasks and Stock Management.')
styles={}
for name,size,leading,color,font in [('body',9.4,14.5,INK,'Body'),('intro',10.5,16,MUTED,'Body'),('small',8,12,MUTED,'Body'),('cell',8,11.5,INK,'Body'),('headcell',8,11.5,'#FFFFFF','Strong')]:
    styles[name]=ParagraphStyle(name,fontName=font,fontSize=size,leading=leading,textColor=HexColor(color),spaceAfter=0,allowWidows=0,allowOrphans=0)
styles['body'].bulletIndent=0
styles['light']=ParagraphStyle('light',parent=styles['small'],textColor=HexColor('#D7DEEA'),fontSize=10,leading=15)

def txt(x,y,s,size=10,color=INK,bold=False):
    c.setFillColor(HexColor(color));c.setFont('Strong' if bold else 'Body',size);c.drawString(x,y,s)
def rect(x,y,w,h,fill='white',stroke=None,r=10):
    c.setFillColor(HexColor(fill));c.setStrokeColor(HexColor(stroke or fill));c.roundRect(x,y,w,h,r,stroke=bool(stroke),fill=1)
def rule(y):
    c.setStrokeColor(HexColor(LINE));c.setLineWidth(.6);c.line(M,y,W-M,y)
def paragraph(s,x,y,w=CW,style='body'):
    p=Paragraph(s,styles[style]);_,h=p.wrap(w,1000);p.drawOn(c,x,y-h);return y-h
def brand(x,y,width=173,light=False):
    d=Drawing(64,64);g=Group();g.transform=(1,0,0,-1,0,64)
    g.add(Rect(3,3,58,58,rx=19,ry=19,fillColor=HexColor('#6955D5'),strokeColor=None))
    g.add(Rect(4,4,56,56,rx=18,ry=18,fillColor=None,strokeColor=HexColor('#9A8CEA'),strokeWidth=1))
    g.add(SvgPath('M14.4 43.7c1.05-7.45 5.23-11.7 11.45-11.7 5.53 0 9.28 3.16 11.02 8.73',fillColor=None,strokeColor=HexColor('#FFFFFF'),strokeWidth=4.1,strokeLineCap=1))
    g.add(Circle(25.6,22.5,6.25,fillColor=HexColor('#FFFFFF'),strokeColor=None));g.add(Circle(42.4,22.3,4.45,fillColor=HexColor('#FFFFFF'),strokeColor=None))
    g.add(SvgPath('m35.3 41.2 5.5 5.25 10.75-12.1',fillColor=None,strokeColor=HexColor('#8CEACB'),strokeWidth=4.8,strokeLineCap=1,strokeLineJoin=1));d.add(g)
    c.saveState();c.translate(x,y);c.scale(width/190,width/190);c.saveState();c.scale(.71,.71);renderPDF.draw(d,c,0,0);c.restoreState()
    txt(54,12,'Day',24,'#FFFFFF' if light else '#10234B',True);txt(54+pdfmetrics.stringWidth('Day','Strong',24),12,'Ridge',24,'#C7BCFF' if light else '#6047E8',True);c.restoreState()

TOTAL=len(PAGES)+3
min_y=[]
def base(number,label,title,subtitle):
    c.setFillColor(HexColor(PAPER));c.rect(0,0,W,H,fill=1,stroke=0)
    brand(M,H-66,132);txt(W-M-pdfmetrics.stringWidth('BUSINESS OWNER GUIDE','Strong',7.1),H-47,'BUSINESS OWNER GUIDE',7.1,MUTED,True)
    rule(48);txt(M,29,'dayridge.co.uk',8.2,PURPLE,True);txt(W-M-40,29,f'{number:02d} / {TOTAL}',8,MUTED)
    c.linkURL('https://dayridge.co.uk/',(M,21,M+120,42),relative=0,thickness=0)
    if number>3:
        txt(W/2-28,29,'CONTENTS',7.2,MUTED);c.linkAbsolute('Contents','contents',(W/2-32,21,W/2+40,42),thickness=0)
    txt(M,H-102,label.upper(),8,PURPLE,True)
    y=H-139
    # Wrapping large titles preserves clear margins on every page.
    words=title.split();lines=[];line=''
    for word in words:
        nxt=(line+' '+word).strip()
        if pdfmetrics.stringWidth(nxt,'Strong',27)>CW and line:lines.append(line);line=word
        else:line=nxt
    lines.append(line)
    for s in lines:txt(M,y,s,27,INK,True);y-=34
    return paragraph(subtitle,M,y+3,style='intro')-19

def flow(items,y):
    n=len(items);gap=15;bw=(CW-gap*(n-1))/n;h=63
    for i,label in enumerate(items):
        x=M+i*(bw+gap);rect(x,y-h,bw,h,LILAC if i<n-1 else MINT,r=9)
        txt(x+12,y-19,f'0{i+1}',8,PURPLE,True)
        paragraph(escape(label),x+12,y-27,bw-24,'small')
        if i<n-1:txt(x+bw+4,y-35,'>',11,PURPLE,True)
    return y-h-17

def visual(kind,y):
    if kind=='geo':
        rect(M,y-115,CW,110,'#F0EDF9',LINE,r=10)
        txt(M+16,y-23,'CHOOSE ON MAP',8,PURPLE,True)
        txt(M+16,y-48,'Drag the pin. Check the circle.',13,INK,True)
        paragraph('Tap the map or use its centre, then save the workplace location.',M+16,y-61,290,'small')
        c.setFillColor(HexColor('#DCD5F4'));c.setStrokeColor(HexColor(PURPLE));c.setLineWidth(1.3);c.circle(W-M-68,y-58,38,stroke=1,fill=1)
        c.setFillColor(HexColor(PURPLE));c.circle(W-M-68,y-53,9,stroke=0,fill=1)
        p=c.beginPath();p.moveTo(W-M-75,y-58);p.lineTo(W-M-68,y-73);p.lineTo(W-M-61,y-58);p.close();c.drawPath(p,stroke=0,fill=1)
        txt(W-M-96,y-103,'Illustrative area',6.5,MUTED)
        return y-130
    if kind=='calendar':
        rect(M,y-124,CW,124,'#FFFFFF',LINE);txt(M+17,y-23,'Your shift calendar',12,INK,True)
        labels=[('shift',GREEN),('overtime','#F58220'),('sick / holiday','#8963AE')]
        for i,(s,col) in enumerate(labels):
            x=M+18+i*156;c.setFillColor(HexColor(col));c.circle(x+5,y-45,4,stroke=0,fill=1);txt(x+17,y-48,s,8,MUTED)
        for i,s in enumerate(['MON','TUE','WED','THU','FRI','SAT','SUN']):
            x=M+38+i*70;txt(x-11,y-69,s,7,MUTED,True)
            fill=[GREEN,GREEN,None,'#8963AE',None,'#F58220',GREEN][i]
            if fill:c.setFillColor(HexColor(fill));c.circle(x,y-94,16,fill=1,stroke=0)
            txt(x-5,y-98,str(12+i),10,'#FFFFFF' if fill else INK,True)
        return y-141
    if kind=='hours':
        rect(M,y-90,CW,90,INK);txt(M+18,y-23,'WORKED HOURS EXAMPLE',8,'#C7BCFF',True)
        for i,(value,label) in enumerate([('8h 00m','09:00 to 17:00'),('0h 30m','Unpaid break'),('7h 30m','Paid hours')]):
            x=M+18+i*164;txt(x,y-51,value,21,'#FFFFFF',True);txt(x,y-70,label,8,'#C7CCD8')
        return y-108
    if kind=='stock':
        rect(M,y-105,CW,105,MINT);txt(M+18,y-23,'ONE PRODUCT, ONE MATCHED PERIOD',8,GREEN,True)
        txt(M+18,y-48,'20 opening + 10 delivered - 18 closing - 2 waste',11,INK,True)
        txt(M+18,y-70,'10 sold x £5.00 = £50.00 expected sales',11,INK,True)
        txt(M+18,y-91,'£48.00 recorded till sales - £50.00 expected = £2.00 short',9.2,GREEN,True)
        return y-123
    return y

def block(item,y):
    kind=item[0]
    if kind=='h':
        txt(M,y-1,item[1],12,INK,True);return y-21
    if kind=='p':return paragraph(item[1],M,y)-12
    if kind=='steps':
        for i,s in enumerate(item[1],1):
            rect(M,y-17,19,19,LILAC,r=6);txt(M+6,y-11,str(i),8,PURPLE,True)
            y=paragraph(s,M+30,y,CW-30)-12
        return y+2
    if kind=='bullets':
        for s in item[1]:
            c.setFillColor(HexColor(PURPLE));c.circle(M+3,y-6,2.1,fill=1,stroke=0)
            y=paragraph(s,M+15,y,CW-15)-8
        return y-3
    if kind=='note':
        p=Paragraph(item[2],styles['body']);_,ph=p.wrap(CW-32,1000);height=ph+47
        rect(M,y-height,CW,height,MINT if len(item)>3 and item[3]=='mint' else LILAC,r=10)
        txt(M+16,y-20,item[1],10,INK,True);p.drawOn(c,M+16,y-33-ph)
        return y-height-16
    if kind=='table':
        headers,rows,widths=item[1:];data=[[Paragraph(escape(str(s)),styles['headcell']) for s in headers]]+[[Paragraph(escape(str(s)),styles['cell']) for s in row] for row in rows]
        t=Table(data,colWidths=[CW*v for v in widths],hAlign='LEFT');t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),HexColor(INK)),('ROWBACKGROUNDS',(0,1),(-1,-1),[HexColor('#FFFFFF'),HexColor('#F0EDF7')]),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9),('LINEBELOW',(0,0),(-1,0),.8,HexColor(INK))]));_,h=t.wrap(CW,1000);t.drawOn(c,M,y-h);return y-h-17
    if kind=='flow':return flow(item[1],y)
    if kind=='visual':return visual(item[1],y)
    raise ValueError(kind)

# Cover: a publication, not a software screenshot.
c.setFillColor(HexColor(PAPER));c.rect(0,0,W,H,fill=1,stroke=0)
c.setFillColor(HexColor(PURPLE));c.rect(0,H-10,W,10,fill=1,stroke=0);brand(M,H-114,236)
txt(M,H-171,'THE DAYRIDGE HANDBOOK',9,PURPLE,True)
for y,s,col in [(H-226,'Your business.',INK),(H-278,'Your people.',INK),(H-330,'A clearer day.',PURPLE)]:txt(M,y,s,43,col,True)
paragraph('The business owner guide to setting up your workspace and making DayRidge part of the working day.',M,H-365,425,'intro')
c.setFillColor(HexColor(INK));p=c.beginPath();p.moveTo(0,331);p.lineTo(W,382);p.lineTo(W,0);p.lineTo(0,0);p.close();c.drawPath(p,stroke=0,fill=1)
txt(M,284,'SET UP. RUN THE DAY. REVIEW THE DETAIL.',9,'#BDAFFB',True)
txt(M,241,'Practical steps.',25,'#FFFFFF',True);txt(M,204,'Confident decisions.',25,'#FFFFFF',True)
paragraph('Clockx and Full Workspace<br/>Geo Clock-in, Tasks and Stock Management add-ons',M,183,390,'light')
txt(M,132,'Rotas / Attendance / People / Payroll hours / Operations',8.6,'#D3CCEA')
rect(M,55,CW,58,'#FFFFFF',r=11);txt(M+17,90,'YOUR DAYRIDGE WORKSPACE',8,PURPLE,True);txt(M+17,71,'A practical guide for business owners',9,INK)
txt(W-M-132,75,'dayridge.co.uk',11,PURPLE,True);c.linkURL('https://dayridge.co.uk/',(W-M-140,62,W-M,105),relative=0,thickness=0)
c.showPage()

# Two-page clickable contents, with explicit section destinations.
split=(len(PAGES)+1)//2
groups=[PAGES[:split],PAGES[split:]]
for k,items in enumerate(groups):
    page_num=2+k
    if k==0:c.bookmarkPage('contents');c.addOutlineEntry('Contents','contents',0)
    y=base(page_num,'START HERE' if k==0 else 'FIND YOUR WORKFLOW','A guide for the working day' if k==0 else 'The detail, when you need it', 'Read the setup pages first, then use the linked contents to jump straight to a task.' if k==0 else 'Each workflow explains where to go, what to do and what a successful result looks like.')
    for item in items:
        idx=PAGES.index(item);num=idx+4
        txt(M,y-7,f'{num:02d}',9,PURPLE,True);txt(M+32,y-7,item['title'],10,INK,True)
        c.linkAbsolute(item['title'],f'section-{idx}',(M,y-16,W-M,y+7),thickness=0)
        y-=25
    if k==1:
        y-=10;y=paragraph('<b>How to use this guide</b><br/>Menu labels appear in bold. Feature availability depends on your package, enabled add-ons and permissions. Examples are fictional. Screens, totals and colours may vary with your account and later releases.',M,y,style='small')
        y-=12;y=paragraph('<b>A working guide, not a replacement for your policies</b><br/>Use your agreed employment terms, leave rules and payroll process alongside DayRidge. The app records and organises information; owners still review decisions and final pay.',M,y,style='small')
    min_y.append((page_num,y));c.showPage()

for idx,page in enumerate(PAGES):
    number=idx+4;c.bookmarkPage(f'section-{idx}');c.addOutlineEntry(page['title'],f'section-{idx}',0)
    y=base(number,page['section'],page['title'],page['intro'])
    if page.get('where'):
        rect(M,y-28,CW,28,'#FFFFFF',LINE,r=7);txt(M+11,y-18,'WHERE TO GO',7,PURPLE,True)
        txt(M+88,y-18,page['where'],8,MUTED);y-=44
    for item in page['blocks']:y=block(item,y)
    min_y.append((number,y))
    if y<63:raise RuntimeError(f'Page {number} overflows: {page["title"]} ends at {y:.1f}')
    c.showPage()
c.save()
# Keep document creation and modification dates out of the training PDF metadata.
from pypdf import PdfReader, PdfWriter
writer=PdfWriter();writer.clone_document_from_reader(PdfReader(OUT))
for key in ['/CreationDate','/ModDate']:writer._info.get_object().pop(key,None)
staged=OUT.with_suffix('.staged.pdf')
with staged.open('wb') as stream:writer.write(stream)
staged.replace(OUT)
(ROOT/'layout-audit.json').write_text(json.dumps({'pages':TOTAL,'bottom_positions':min_y,'min_bottom':min(y for _,y in min_y)},indent=2))
print(OUT);print('Pages:',TOTAL,'Lowest content point:',round(min(y for _,y in min_y),1))
