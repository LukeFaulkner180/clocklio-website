"""Generate the website brochure from the same plan-price functions as the calculator."""
from pathlib import Path
import json,subprocess,shutil
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import simpleSplit
ROOT=Path(__file__).resolve().parents[1]
SITE=json.loads((ROOT/'content/site.json').read_text())
DATA=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {clockxPlan,fullWorkspacePlan} from './public/pricing.js'; console.log(JSON.stringify({clockx:[5,10,20].map(clockxPlan),full:[5,15,30,50].map(fullWorkspacePlan)}))"],cwd=ROOT,text=True))
FONT=Path('/usr/share/fonts/truetype/dejavu')
pdfmetrics.registerFont(TTFont('UI',str(FONT/'DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('UIBold',str(FONT/'DejaVuSans-Bold.ttf')))
OUT=ROOT/'output/pdf/clocknexa-product-brochure.pdf';OUT.parent.mkdir(parents=True,exist_ok=True)
W,H=A4;M=45;CW=W-2*M
INK='#24253A';PURPLE='#7560CB';MUTED='#6D687D';LILAC='#F1EDFA';LINE='#E4DDED';PAPER='#FBFAFD'
c=canvas.Canvas(str(OUT),pagesize=A4,pageCompression=1)
c.setTitle(SITE['brandName']+' - Product Guide - October 2026');c.setAuthor(SITE['brandName']);c.setSubject('Clockx, Full Workspace and optional monthly add-ons')
def text(x,y,value,size=10,color=INK,bold=False):
 c.setFillColor(HexColor(color));c.setFont('UIBold' if bold else 'UI',size);c.drawString(x,y,value)
def lines(x,y,value,width,size=10,leading=16,color=MUTED,bold=False):
 font='UIBold' if bold else 'UI'
 for line in simpleSplit(value,font,size,width):text(x,y,line,size,color,bold);y-=leading
 return y
def box(x,y,w,h,fill=LILAC,border=None,r=13):
 c.setFillColor(HexColor(fill));c.setStrokeColor(HexColor(border or fill));c.roundRect(x,y,w,h,r,stroke=bool(border),fill=1)
def rule(x,y,w,color=LINE):
 c.setStrokeColor(HexColor(color));c.setLineWidth(.6);c.line(x,y,x+w,y)
def price(pence):return '£'+format(pence/100,',.2f')
def header(page):
 c.setFillColor(HexColor(PAPER));c.rect(0,0,W,H,stroke=0,fill=1)
 c.drawImage(ImageReader(str(ROOT/'public/assets/clocknexa-apple-touch-icon.png')),M,H-76,width=35,height=35,mask='auto')
 if SITE['brandName']=='ClockNexa':
  text(M+45,H-64,'Clock',20,INK,True);tw=pdfmetrics.stringWidth('Clock','UIBold',20);text(M+45+tw,H-64,'Nexa',20,PURPLE,True)
 else:text(M+45,H-64,SITE['brandName'],20,INK,True)
 text(W-M-114,H-50,'PRODUCT GUIDE',7.6,MUTED,True);text(W-M-114,H-65,'OCTOBER 2026',7.6,MUTED)
 rule(M,34,CW);text(M,20,'Based in Suffolk, United Kingdom',7.5,MUTED);text(W-M-64,20,str(page)+' / 2',7.5,MUTED)
header(1)
text(M,H-116,'YOUR WORKING DAY, MORE CONNECTED',8,PURPLE,True)
text(M,H-177,'Your team.',43,INK,True)
text(M,H-229,'Your business.',43,INK,True)
text(M,H-281,'In good rhythm.',43,PURPLE,True)
lines(M,H-319,'Rotas, recorded hours, leave and documents. One clear workspace for the working day.',CW-30,12,19,MUTED)
card_y=326;card_h=153
box(M,card_y,CW,card_h,LILAC,LINE,17)
text(M+22,card_y+card_h-28,'CLOCKX  /  EVERYDAY STAFF MANAGEMENT',9,PURPLE,True)
col=(CW-44)/3
for i,plan in enumerate(DATA['clockx']):
 x=M+22+i*col
 text(x,card_y+91,'Up to '+str(plan['employeeLimit'])+' employees',9.1,MUTED)
 text(x,card_y+54,price(plan['price']),25,PURPLE,True)
 text(x,card_y+30,'per business / year',8.2,MUTED)
text(M,299,'Your everyday tools',16,INK,True)
features=['Rotas and published shifts','Clock-ins, clock-outs and breaks','Annual leave and approvals','Extra hours and open shifts','Payroll hours and CSV exports','Private employee contracts','Company policies and documents','Basic employee details']
for i,label in enumerate(features):
 x=M+(i%2)*(CW/2);y=272-(i//2)*25
 c.setFillColor(HexColor(PURPLE));c.circle(x+3,y+3,2.2,stroke=0,fill=1);text(x+13,y,label,9.3,INK)
lines(M,160,'The same features are included in every Clockx tier. Above 20 employees needs an agreed custom quote.',CW,8.6,13,MUTED)
lines(M,128,'Pay tools organise recorded hours and gross estimates. Your existing payroll process handles deductions and payslips.',CW,8.5,13,MUTED)
box(M,49,CW,51,INK,r=12)
text(M+17,80,'Find the package for your team.',11,'#FFFFFF',True)
web=SITE['websiteURL'];short=web.replace('https://','').rstrip('/')+'/resources/'
text(M+17,62,short,7.4,'#DAD2EE');c.linkURL(web+'resources/',(M,49,W-M,100),relative=0,thickness=0)
c.showPage();header(2)
text(M,H-111,'FULL WORKSPACE',8.5,PURPLE,True)
text(M,H-149,'More people tools.',30,INK,True)
text(M,H-185,'More room to grow.',30,INK,True)
lines(M,H-214,'Everything in Clockx, plus employee onboarding, sickness and return-to-work records, protected personnel files and wider access controls.',CW,10.3,16,MUTED)
# Fixed annual Full Workspace bands.
top=H-266;row=32
box(M,top-26,CW,26,INK,r=6)
for x,label in [(M+13,'PLAN'),(M+162,'EMPLOYEES'),(M+CW-102,'PER YEAR')]:text(x,top-17,label,7.7,'#FFFFFF',True)
for i,plan in enumerate(DATA['full']):
 y=top-26-(i+1)*row
 box(M,y,CW,row,'#FFFFFF',r=0);rule(M,y,CW)
 band=['Up to 5','10-15','16-30','31-50'][i]
 text(M+13,y+11,plan['name'],9.7,INK,True);text(M+162,y+11,band,9.7,MUTED)
 text(M+CW-102,y+11,price(plan['price']),10.3,PURPLE,True)
y=top-26-4*row-22
lines(M,y,'Employees 6-9 add £45 each per year above the first five. From 10 employees, fixed annual bands apply. Above 50 needs a custom quote.',CW,8.6,13,MUTED)
# Add-on cards.
text(M,327,'Optional monthly add-ons',16,INK,True)
addon_y=192;addon_w=(CW-16)/2
for x in [M,M+addon_w+16]:box(x,addon_y,addon_w,113,LILAC,LINE,13)
text(M+17,282,'TASKS',8.4,PURPLE,True);text(M+17,251,'£4.99',25,PURPLE,True)
lines(M+17,231,'per business / month',addon_w-30,8.6,13,MUTED)
lines(M+17,213,'Plus £2.35 per agreed chargeable user / month.',addon_w-30,8.1,12,MUTED)
x=M+addon_w+33
text(x,282,'STOCK MANAGEMENT',8.4,PURPLE,True);text(x,251,'£9.99',25,PURPLE,True)
lines(x,231,'per business / month',addon_w-30,8.6,13,MUTED)
lines(x,213,'Products, counts, till comparisons and investigation notes.',addon_w-30,8.1,12,MUTED)
text(M,173,'Both monthly add-ons require Full Workspace.',8.7,MUTED,True)
text(M,145,'A clear next step',14,INK,True)
lines(M,125,'Agree your package and employee allowance. Set up the business and invite your team. Publish the rota and begin recording the working day.',CW,9.2,14,MUTED)
lines(M,86,'Annual access is arranged by bank transfer. Extra employees above the approved allowance need platform approval before access is activated. Confirm renewal and cancellation arrangements in your business agreement.',CW,8.1,12,MUTED)
text(M,44,web.replace('https://','').rstrip('/')+'/pricing/',8,PURPLE,True)
c.linkURL(web+'pricing/',(M,40,W-M,55),relative=0,thickness=0)
c.save()
asset=ROOT/'public/downloads/clocknexa-product-brochure.pdf';asset.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(OUT,asset)
print(OUT);print(asset);print('PDF bytes',OUT.stat().st_size)
