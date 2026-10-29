"""Create the illustrated DayRidge guide; prices share the website calculator."""
from pathlib import Path
import json, subprocess, shutil
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import simpleSplit
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing, Group, Rect, Circle
from reportlab.graphics.svgpath import SvgPath
from reportlab.graphics import renderPDF
ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {clockxPlan,fullWorkspacePlan} from './public/pricing.js'; console.log(JSON.stringify({clockx:[5,10,20].map(clockxPlan),full:[5,15,30,50].map(fullWorkspacePlan)}))"],cwd=ROOT,text=True))
for name,file in [('UI','DejaVuSans.ttf'),('Bold','DejaVuSans-Bold.ttf')]:pdfmetrics.registerFont(TTFont(name,'/usr/share/fonts/truetype/dejavu/'+file))
OUT=ROOT/'output/pdf/dayridge-product-brochure.pdf';OUT.parent.mkdir(parents=True,exist_ok=True)
W,H=A4;M=42;CW=W-84
INK='#202A3C';PURPLE='#6748DE';MUTED='#657080';PAPER='#FAF9F6';LILAC='#EEE9FC';LINE='#DDDDE6';MINT='#DDF2E9';GREEN='#28705A';ORANGE='#F8E3C7'
c=canvas.Canvas(str(OUT),pagesize=A4,pageCompression=1)
c.setTitle('DayRidge | Product Brochure');c.setAuthor('DayRidge');c.setSubject('Clockx, Full Workspace, pricing, role views, values and product workflows')
def text(x,y,s,size=10,color=INK,bold=False):
 c.setFillColor(HexColor(color));c.setFont('Bold' if bold else 'UI',size);c.drawString(x,y,s)
def para(x,y,s,w=CW,size=10,leading=16,color=MUTED,bold=False):
 for line in simpleSplit(s,'Bold' if bold else 'UI',size,w):text(x,y,line,size,color,bold);y-=leading
 return y

def box(x,y,w,h,fill='white',border=None,r=12):
 c.setFillColor(HexColor(fill));c.setStrokeColor(HexColor(border or fill));c.roundRect(x,y,w,h,r,stroke=bool(border),fill=1)
def line(x,y,x2,y2,color=LINE,width=.7):
 c.setStrokeColor(HexColor(color));c.setLineWidth(width);c.line(x,y,x2,y2)
def pill(x,y,s,fill=LILAC,color=PURPLE):
 width=pdfmetrics.stringWidth(s,'Bold',8)+20;box(x,y-6,width,21,fill,r=10);text(x+10,y+1,s,8,color,True)
def price(p):return '£'+format(p/100,',.2f')
def begin(n,label,title,sub):
 c.setFillColor(HexColor(PAPER));c.rect(0,0,W,H,stroke=0,fill=1)
 text(M,H-48,'Day',18,INK,True);text(M+39,H-48,'Ridge',18,PURPLE,True)
 guide='PRODUCT GUIDE / 2026/27';text(W-M-pdfmetrics.stringWidth(guide,'Bold',7.3),H-44,guide,7.3,MUTED,True)
 line(M,43,W-M,43);text(M,26,'dayridge.co.uk',9,PURPLE,True);text(W-M-31,27,f'{c.getPageNumber()} / 12',7.6,MUTED);c.linkURL('https://dayridge.co.uk/',(M,18,180,39),relative=0,thickness=0)
 text(M,746,label.upper(),8.5,PURPLE,True)
 y=706
 for t in title.split('\n'):text(M,y,t,31,INK,True);y-=39
 return para(M,y-2,sub,CW,10.5,17)
def end():c.showPage()
def feature(x,y,num,title,body,w=235):
 pill(x,y,num);text(x+42,y,title,11,INK,True);return para(x+42,y-22,body,w-42,9.1,14)
def note(y,title,body,fill=LILAC):
 box(M,y,CW,75,fill);text(M+18,y+51,title,11,INK,True);para(M+18,y+31,body,CW-36,9,14)
def browser(x,y,w,h,title):
 box(x+5,y-5,w,h,'#E4DFEE');box(x,y,w,h,'#FFFFFF',LINE);box(x,y+h-35,w,35,INK,r=10)
 for i in range(3):c.setFillColor(HexColor(['#A391D8','#D6CBEF','#EEE9FC'][i]));c.circle(x+16+i*11,y+h-17,2.6,fill=1,stroke=0)
 text(x+58,y+h-21,title,8,'#FFFFFF',True)
def check(x,y,yes=True):
 if yes:
  c.setStrokeColor(HexColor(GREEN));c.setLineWidth(1.6);p=c.beginPath();p.moveTo(x,y+3);p.lineTo(x+4,y);p.lineTo(x+11,y+8);c.drawPath(p)
 else:line(x,y+4,x+10,y+4,MUTED,1.2)
# Branded sales covers use vector artwork so the printed logo and QR stay sharp.
def brand(x,y,width=190,light=False):
 icon=Drawing(64,64);g=Group();g.transform=(1,0,0,-1,0,64)
 g.add(Rect(3,3,58,58,rx=19,ry=19,fillColor=HexColor('#6955D5'),strokeColor=None))
 g.add(Rect(4,4,56,56,rx=18,ry=18,fillColor=None,strokeColor=HexColor('#9A8CEA'),strokeWidth=1))
 g.add(SvgPath('M14.4 43.7c1.05-7.45 5.23-11.7 11.45-11.7 5.53 0 9.28 3.16 11.02 8.73',fillColor=None,strokeColor=HexColor('#FFFFFF'),strokeWidth=4.1,strokeLineCap=1))
 g.add(Circle(25.6,22.5,6.25,fillColor=HexColor('#FFFFFF'),strokeColor=None))
 g.add(Circle(42.4,22.3,4.45,fillColor=HexColor('#FFFFFF'),strokeColor=None))
 g.add(SvgPath('m35.3 41.2 5.5 5.25 10.75-12.1',fillColor=None,strokeColor=HexColor('#8CEACB'),strokeWidth=4.8,strokeLineCap=1,strokeLineJoin=1))
 icon.add(g)
 scale=width/190
 c.saveState();c.translate(x,y);c.scale(scale,scale)
 c.saveState();c.scale(.71,.71);renderPDF.draw(icon,c,0,0);c.restoreState()
 text(54,12,'Day',24,'#FFFFFF' if light else '#10234B',True)
 text(54+pdfmetrics.stringWidth('Day','Bold',24),12,'Ridge',24,'#C7BCFF' if light else '#6047E8',True)
 c.restoreState()

def sales_cover():
 # A bold editorial cover with one unmistakable website call to action.
 navy='#18283C';white='#FFFFFF';lilac='#C9BEFF'
 c.setFillColor(HexColor('#FAF9F6'));c.rect(0,0,W,H,stroke=0,fill=1)
 c.setFillColor(HexColor(PURPLE));c.rect(0,H-10,W,10,stroke=0,fill=1)
 brand(M,H-113,230)
 text(M,663,'STAFF MANAGEMENT, MADE CLEARER',9,PURPLE,True)
 for y,t,col in [(603,'Your team.',navy),(546,'Your time.',navy),(484,'One place.',PURPLE)]:text(M,y,t,51,col,True)
 para(M,438,'Rotas. Clocking. People.\nBuilt around your working day.',380,13,20,MUTED)
 # Angled panels add depth while leaving the brand and headline easy to scan.
 c.setFillColor(HexColor(PURPLE));p=c.beginPath();p.moveTo(0,369);p.lineTo(W,422);p.lineTo(W,0);p.lineTo(0,0);p.close();c.drawPath(p,stroke=0,fill=1)
 c.setFillColor(HexColor(navy));p=c.beginPath();p.moveTo(0,354);p.lineTo(W,407);p.lineTo(W,0);p.lineTo(0,0);p.close();c.drawPath(p,stroke=0,fill=1)
 c.setFillColor(HexColor('#263650'));c.circle(W+13,243,156,stroke=0,fill=1)
 c.setStrokeColor(HexColor('#435277'));c.setLineWidth(1);c.circle(W+13,243,124,stroke=1,fill=0)
 text(M,313,'THE DAYRIDGE PRODUCT GUIDE',8.5,'#B8A9FF',True)
 text(M,269,'A clearer plan.',24,white,True)
 text(M,235,'A connected team.',24,white,True)
 text(M,192,'CLOCKX  /  FULL WORKSPACE',8.4,lilac,True)
 # The official vector mark becomes the cover's hero graphic.
 x=W-M-168;y=165
 c.saveState();clip=c.beginPath();clip.rect(x,y,178,178);c.clipPath(clip,stroke=0,fill=0);brand(x,y,720,True);c.restoreState()
 c.setFillColor(HexColor('#8CEACB'));c.circle(W-M-190,180,5,stroke=0,fill=1)
 c.setFillColor(HexColor('#9D8BEF'));c.circle(W-M-5,357,4,stroke=0,fill=1)
 box(M,55,CW,80,white,r=13)
 text(M+18,111,'EXPLORE THE PLATFORM',7.8,PURPLE,True)
 text(M+18,77,'dayridge.co.uk',26,navy,True)
 c.setFillColor(HexColor('#EEE9FC'));c.circle(W-M-34,95,19,stroke=0,fill=1)
 line(W-M-43,95,W-M-25,95,PURPLE,1.8);line(W-M-31,101,W-M-25,95,PURPLE,1.8);line(W-M-31,89,W-M-25,95,PURPLE,1.8)
 c.linkURL('https://dayridge.co.uk/',(M,55,W-M,135),relative=0,thickness=0)
 text(M,29,'PRODUCT BROCHURE / 2026/27',7.7,'#BFC9D7',True)
 text(361,29,'BASED IN SUFFOLK, UK',7.7,'#BFC9D7',True)

def contact_cover():
 navy='#18283C';pale='#BCC7D5';white='#FFFFFF'
 c.setFillColor(HexColor(navy));c.rect(0,0,W,H,stroke=0,fill=1)
 c.setFillColor(HexColor('#263450'));c.circle(W+40,H-35,213,stroke=0,fill=1)
 c.setFillColor(HexColor('#354363'));c.circle(W+57,H-15,150,stroke=0,fill=1)
 brand(M,H-102,190,True)
 text(M,668,'LET’S TALK ABOUT YOUR TEAM',8.5,'#C7BCFF',True)
 for y,t in [(616,'A simpler day'),(564,'starts with a'),(512,'conversation.')]:text(M,y,t,40,white,True)
 para(M,470,'Tell us about your business. We will help you find the right workspace and show you how DayRidge fits your team.',CW-12,11.3,18,pale)
 box(M,219,CW,180,white,r=15)
 text(M+20,368,'YOUR NEXT STEP',8,PURPLE,True)
 text(M+20,333,'dayridge.co.uk',23,INK,True)
 text(M+20,305,'Enquiries and demonstrations',9.5,MUTED)
 text(M+20,281,'dayridge.co.uk/contact/',13,PURPLE,True)
 text(M+20,247,'Based in Suffolk, United Kingdom',9,MUTED)
 code=qr.QrCodeWidget('https://dayridge.co.uk/contact/',barLevel='M')
 bounds=code.getBounds();size=116;factor=size/(bounds[2]-bounds[0])
 drawing=Drawing(size,size,transform=[factor,0,0,factor,-bounds[0]*factor,-bounds[1]*factor]);drawing.add(code)
 renderPDF.draw(drawing,c,W-M-137,264)
 text(W-M-132,247,'Scan to get in touch',8,MUTED,True)
 c.linkURL('https://dayridge.co.uk/contact/',(M+15,266,355,321),relative=0,thickness=0)
 c.linkURL('https://dayridge.co.uk/contact/',(W-M-137,259,W-M-21,382),relative=0,thickness=0)
 text(M,177,'LET’S FIND THE RIGHT FIT',8,'#C7BCFF',True)
 text(M,151,'A conversation about your business.',16,white,True)
 para(M,124,'Tell us your team size and the tools you need. We will walk through the options and explain the next steps.',CW,9,15,pale)
 line(M,63,W-M,63,'#465268')
 text(M,40,'DayRidge. Built around your working day.',9,white,True)
 text(391,40,'PRODUCT BROCHURE / 2026/27',7,pale)

sales_cover();end()
# 1 Product family (inside the sales cover)
begin(1,'The DayRidge product family','Choose the tools.\nKeep it simple.','Two annual packages for staff management. Geo Clock-in works with either package. Tasks and Stock Management extend Full Workspace.')
for x,title,tag,heading,items in [
 (M,'Clockx','FROM £149.99 / YEAR','The everyday essentials',[
  'Build and publish staff rotas.',
  'Record clock-ins, clock-outs and breaks.',
  'Request and approve annual leave.',
  'Review payroll hours and export CSVs.',
  'Keep basic employee details.']),
 (309,'Full Workspace','FROM £299.99 / YEAR','All Clockx tools, plus:',[
  'Open shifts and extra-hours requests.',
  'Sickness and return-to-work records.',
  'Onboarding and protected personnel files.',
  'Contracts and company documents.',
  'Wider role permissions.'])]:
 box(x,284,244,290,'#FFFFFF',LINE)
 text(x+17,548,title,19,INK,True)
 text(x+17,523,tag,8,PURPLE,True)
 text(x+17,492,heading,10.3,INK,True)
 for i,item in enumerate(items):
  yy=463-i*34
  check(x+18,yy-1)
  para(x+38,yy,item,187,8.7,13,INK)
text(M,256,'Add the extras that fit your working day',13,INK,True)
for x,title,body,fill,col in [
 (M,'Geo Clock-in','Workplace location checks. Available with both packages.',LILAC,PURPLE),
 (M+174,'Tasks','Individual work and shared shift checklists. Full Workspace.',MINT,GREEN),
 (M+348,'Stock Management','Counts, usage and till comparisons. Full Workspace.',LILAC,PURPLE)]:
 box(x,151,163,80,fill);text(x+12,208,title,10,col,True);para(x+12,190,body,139,8,12)
text(M,131,'Add-ons are separate charges. Package starting prices cover up to five employees.',7.9,MUTED)
box(M,65,CW,53,'#FFFFFF',LINE)
text(M+14,99,'PACKAGE = TOOLS. ROLE = ACCESS.',8.5,PURPLE,True)
para(M+14,82,'Your package decides which tools the business has. Roles and granted permissions decide what each person can see and do.',CW-28,8.2,12)
end()
# 2 Time
begin(2,'Clockx + Full Workspace','A clearer record\nof the working day.','Clock in, record breaks and review hours in one place. Employees can use My Time Clock or a registered workplace kiosk with their employee number and PIN.')
box(M,258,208,310,INK,r=24);box(M+9,268,190,288,'#FFFFFF',r=18)
text(M+26,526,'MY TIME CLOCK',8,PURPLE,True);text(M+26,495,'Good morning, Alex',11,INK,True);pill(M+26,464,'CLOCKED IN',MINT,GREEN)
text(M+26,415,'03h 15m',29,INK,True);text(M+26,393,'Paid time recorded',9,MUTED)
line(M+26,376,M+179,376);text(M+26,351,'£42.25',25,PURPLE,True);text(M+26,332,'Illustrative gross estimate',8,MUTED)
box(M+26,286,156,30,PURPLE);text(M+72,297,'Clock out',9,'#FFFFFF',True)
feature(274,551,'01','Record the real day','A rota is a plan. A clock-in records when work starts; clock-outs and breaks complete the record.',237)
feature(274,439,'02','Review and correct','Managers can review records, clock employees in or out and correct entries where needed.',237)
feature(274,327,'03','Prepare payroll hours','Review recorded hours and export a CSV for your existing payroll process.',237)
note(139,'An example you can follow','09:00–12:30 is 3h 30m elapsed. Less a 15-minute unpaid break gives 3h 15m paid. At £13/hour, the illustrative gross estimate is £42.25.',MINT)
para(M,110,'Break rules and manager corrections affect paid hours. Gross estimates exclude tax, pensions and other deductions; DayRidge does not generate payslips.',CW,8.8,14)
end()
# Geo Clock-in: an illustrated owner setup and employee arrival workflow.
begin(3,'Geo Clock-in / optional add-on','The right place.\nBefore the clock starts.','Available with Clockx and Full Workspace. Check an employee’s fresh phone location before accepting a personal-phone clock-in.')
pill(M,568,'CLOCKX + FULL WORKSPACE');pill(272,568,'NEW / GEO CLOCK-IN',MINT,GREEN)
browser(M,319,CW,224,'BUSINESS PROFILE / CHOOSE ON MAP')
box(M+13,333,CW-26,164,'#F0F3EF',r=7)
for x,y,x2,y2 in [(M+26,351,W-M-21,470),(M+30,459,W-M-22,351),(M+155,339,M+232,492)]:
 line(x,y,x2,y2,'#FFFFFF',12);line(x,y,x2,y2,'#D6DDDA',1)
c.setFillColor(HexColor('#E1DCF5'));c.setStrokeColor(HexColor(PURPLE));c.setLineWidth(1.5);c.circle(M+252,414,62,stroke=1,fill=1)
box(M+234,399,36,29,'#FFFFFF',PURPLE,r=4);text(M+239,410,'SITE',7,PURPLE,True)
c.setFillColor(HexColor(PURPLE));p=c.beginPath();p.moveTo(M+252,424);p.lineTo(M+242,441);p.lineTo(M+262,441);p.close();c.drawPath(p,fill=1,stroke=0);c.circle(M+252,444,11,fill=1,stroke=0)
c.setFillColor(HexColor('#FFFFFF'));c.circle(M+252,444,4,fill=1,stroke=0)
pill(M+23,477,'DRAG PIN OR TAP MAP');pill(M+330,346,'100 m / EXAMPLE',MINT,GREEN)
text(M,304,'Illustrative setup view. The actual app opens a movable map with an adjustable radius.',7.3,MUTED)
for i,(title,body) in enumerate([
 ('Choose the workplace','Business Owner opens Choose on map, taps a point or drags the purple pin, checks the radius and saves.'),
 ('Check arrival','The employee allows precise location. DayRidge checks the location and its accuracy before recording the clock-in.'),
 ('Handle exceptions','Registered kiosks remain available. Managers can record an arrival override with a reason. Clock-out needs no location.')]):
 x=M+i*174;pill(x,269,str(i+1));text(x,239,title,10,INK,True);para(x,218,body,158,8.4,13)
box(M,81,CW,65,LILAC);text(M+15,122,'£4.99 / business / month',13,PURPLE,True);text(M+15,101,'or £49.99 per business / year',10,INK,True)
para(M,62,'One workplace; radius 50-1,000 metres. No continuous tracking or stored raw employee coordinates. Phone locations can be inaccurate or spoofed. Managers can view the saved map; only the Business Owner edits it.',CW,7.4,11)
end()
# 3 Rota
begin(3,'Clockx + Full Workspace','Plan the week.\nKeep everyone informed.','Build a rota, check availability and publish shifts so employees can see their working week in My shifts.')
browser(M,351,280,214,'MANAGER / WEEKLY ROTA')
for i,day in enumerate(['MON','TUE','WED']):
 x=M+13+i*86;text(x+5,505,day,7.4,MUTED,True)
 for j in range(2):
  yy=449-j*47;fill=ORANGE if i==2 and j==1 else MINT
  box(x,yy,79,39,fill,r=5);text(x+7,yy+25,['Alex','Sam'][j],7.5,INK,True);text(x+7,yy+12,'09:00 - 17:00',6.4,MUTED)
pill(M+13,370,'PUBLISHED',MINT,GREEN);pill(M+139,370,'DRAFT',ORANGE,'#8A5A24')
rx=M+296
browser(rx,351,215,214,'MY SHIFTS / MONTH')
text(rx+14,506,'October 2026',10,INK,True)
for i,day in enumerate(['S','M','T','W','T','F','S']):text(rx+20+i*28,485,day,7.4,MUTED)
for i in range(21):
 day=i+4;x=rx+22+(i%7)*28;y=460-(i//7)*30
 kind='away' if day in [6,7] else 'overtime' if day in [13,20] else 'shift' if day in [4,10,11,15,17,18,22,24] else ''
 if kind:
  c.setFillColor(HexColor({'shift':'#34785B','away':'#8963AE','overtime':'#F58220'}[kind]));c.circle(x,y,11,stroke=0,fill=1)
 text(x-(2.5 if day<10 else 5),y-3,str(day),8,'#FFFFFF' if kind and kind!='overtime' else INK,True)
for x,label,col in [(rx+14,'Shift','#34785B'),(rx+78,'Away','#8963AE'),(rx+147,'OT','#F58220')]:
 c.setFillColor(HexColor(col));c.circle(x,370,3,stroke=0,fill=1);text(x+7,367,label,7,MUTED)
text(M,336,'Illustrative manager and employee views. Green: shifts. Purple: time away. Orange: overtime.',7.2,MUTED)
text(M,311,'Leave requests, with a clear decision',16,INK,True)
for i,(title,body) in enumerate([('Request','Choose dates and review estimated hours and balance.'),('Review','Manager checks cover, balances and published shifts.'),('Decide','Keep the request status clear: approved or declined.')]):
 x=M+i*174;box(x,174,163,110,'#FFFFFF',LINE);pill(x+13,258,str(i+1));text(x+13,226,title,11,INK,True);para(x+13,207,body,137,8.5,13)
para(M,143,'Leave estimates depend on published shifts, working patterns and the configured leave year. Requests crossing the leave-year boundary should be split.',CW,8.8,14)
para(M,91,'Need cover? Full Workspace also includes Open shifts and extra-hours requests.',CW,9.4,15,PURPLE,True)
end()
# 4 Full
begin(4,'Full Workspace','More of your people\npicture, together.','Bring the core rota and time tools together with the records and workflows that support your team throughout their time with you.')
browser(M,340,CW,226,'PEOPLE / OWNER VIEW')
box(M+18,441,56,56,LILAC,r=28);text(M+30,461,'AJ',20,PURPLE,True);text(M+90,478,'Alex Jones',15,INK,True);text(M+90,457,'Illustrative employee profile',8,MUTED)
for i,(title,status) in enumerate([('Contract','Available'),('Company policies','Available'),('Personnel file','Access controlled')]):
 x=M+17+i*160
 box(x,355,148,72,LILAC if i<2 else MINT,r=8)
 c.setStrokeColor(HexColor(PURPLE if i<2 else GREEN));c.setLineWidth(1)
 c.rect(x+12,390,12,18,stroke=1,fill=0);line(x+15,402,x+21,402,PURPLE);line(x+15,398,x+21,398,PURPLE)
 text(x+34,397,title,8.1,INK,True);text(x+12,372,status,7.8,PURPLE if i<2 else GREEN)
feature(M,300,'01','Start with structure','Keep onboarding, contracts and company policies alongside employee information.',244)
feature(310,300,'02','Support the full journey','Manage sickness and return-to-work records with the wider employee record.',243)
feature(M,176,'03','Give the right access','Use wider role permissions and protected personnel files to control who can see and manage records.',244)
feature(310,176,'04','Respond to changes','Use Open shifts for cover and extra-hours requests when the working week changes.',243)
end()
# 5 Addons
begin(5,'Tasks and Stock / optional add-ons','Useful extras.\nOnly when you need them.','Tasks and Stock Management extend Full Workspace. Geo Clock-in is available with either package; see the workplace map on page 4.')
box(M,310,244,248,'#FFFFFF',LINE);box(309,310,244,248,'#FFFFFF',LINE)
text(M+17,530,'Tasks',20,INK,True);text(326,530,'Stock Management',16,INK,True)
for i,(label,status,fill) in enumerate([('Opening checks','To do',LILAC),('Restock supplies','In progress',ORANGE),('Close-down checklist','Complete',MINT)]):
 yy=478-i*42;box(M+16,yy,211,34,fill,r=6);text(M+25,yy+21,label,8.1,INK,True);text(M+25,yy+8,status,7,MUTED)
text(326,495,'ITEM',6.8,MUTED,True);text(476,495,'CLOSING',6.8,MUTED,True)
for i,(item,count) in enumerate([('Coffee beans','12 bags'),('Milk','18 cartons')]):
 yy=473-i*24;box(321,yy-7,216,22,'#F4F1FA',r=4);text(328,yy,item,8,INK);text(475,yy,count,7.8,PURPLE,True)
for i,(label,val) in enumerate([('Expected takings','£840'),('Actual takings','£830'),('Difference','-£10')]):
 yy=415-i*25;text(326,yy,label,8.2,MUTED);text(480,yy,val,10,PURPLE,True);line(326,yy-10,535,yy-10)
text(M+17,328,'Illustrative task board',7,MUTED);text(326,328,'Illustrative reconciliation',7,MUTED)
text(M,281,'Clear actions for the team',12,INK,True);para(M,260,'Assign individual work or publish reusable shift checklists. Employees claim shared jobs, update progress and capture a fresh photo when required. Completed work has its own view.',244,9.1,14)
text(309,281,'Understand your stock',12,INK,True);para(309,260,'Record opening and closing counts, deliveries, adjustments and waste. Review usage and compare expected with actual takings.',244,9.1,14)
box(M,114,244,78,LILAC);text(M+15,168,'£4.99 / business / month',11,PURPLE,True);text(M+15,148,'+ £2.35 per agreed chargeable user',8.5,INK);text(M+15,130,'5 chargeable users = £16.74 / month',8.1,MUTED)
box(309,114,244,78,LILAC);text(324,168,'£9.99 / business / month',11,PURPLE,True);para(324,148,'Manual stock counts and till figures. No direct till integration in version 0.1.',214,8.2,12)
para(M,86,'Stock units must stay consistent. Recipes, portions and yields are not converted automatically.',CW,8.4,13)
end()
# 6 Matrix
begin(6,'Choose your workspace','Two packages.\nOne clear starting point.','Clockx covers everyday staff management. Full Workspace adds wider people tools. Geo Clock-in is optional with either package; Tasks and Stock Management extend Full Workspace.')
box(M,510,CW,40,INK);text(M+16,525,'WHAT YOUR TEAM NEEDS',8,'#FFFFFF',True);text(358,525,'CLOCKX',8,'#FFFFFF',True);text(435,525,'FULL',8,'#FFFFFF',True)
rows=[('Rotas and published shifts',1,1),('Clocking, breaks and manager corrections',1,1),('Annual leave requests and approvals',1,1),('Recorded payroll hours and CSV exports',1,1),('Basic employee details',1,1),('Open shifts and extra-hours requests',0,1),('Contracts and company policies / documents',0,1),('Onboarding and protected personnel files',0,1),('Sickness and return-to-work records',0,1),('Wider role permissions',0,1)]
for i,(label,a,b) in enumerate(rows):
 yy=510-(i+1)*33;box(M,yy,CW,33,'#FFFFFF' if i%2==0 else '#F0EEF5',r=0);text(M+14,yy+12,label,8.5,INK);check(378,yy+11,a);check(451,yy+11,b)
note(79,'Choose your add-ons','Geo Clock-in is optional with Clockx or Full Workspace (monthly or annual). Tasks and Stock Management are optional monthly tools for Full Workspace. Add-ons are charged separately.')
end()
# Role guide: explain the customer-facing views without exposing the platform admin console.
begin(7,'One system. The right view.','What each person\ncan see and do.','Your package provides the tools. Each person has a view suited to their role, with business access kept separate from personal information.')
roles=[
 ('01','Employee','CLOCKX + FULL WORKSPACE',
  'Their own published shifts, past clockings, recorded hours and estimated earnings. Clock in or out and request annual leave.',
  'Full Workspace adds relevant documents, open shifts, extra-hours requests and sickness reporting. My Tasks appears when the add-on is active.'),
 ('02','Manager','CLOCKX + FULL WORKSPACE',
  'Plan and publish rotas, review requests, manage the team and review or correct time records. A linked employee profile can use My shifts & pay.',
  'Full Workspace adds wider people and cover workflows. Team wage rates, gross-pay reporting and payroll access stay with the Business Owner.'),
 ('03','Team Leader','FULL WORKSPACE - PERMISSION BASED',
  'Help run the team through the sections the owner grants: rota management, team directory, open shifts, attendance totals or annual-leave reviews.',
  'Permissions are granted individually. Attendance totals exclude wages; private employee files and payroll remain restricted.'),
 ('04','Business Owner','CLOCKX + FULL WORKSPACE',
  'The main business manager view, plus payroll, wage rates, gross-pay reports, exports, business settings and control of manager or team-leader access.',
  'Full Workspace adds protected personnel tools. The Business Owner sets the Geo workplace pin and radius; Managers can view the saved map. Stock access is granted separately.')]
for i,(num,title,tag,body,extra) in enumerate(roles):
 yy=428-i*112
 box(M,yy,CW,103,'#FFFFFF',LINE)
 pill(M+13,yy+76,num)
 text(M+56,yy+77,title,13,INK,True)
 text(M+231,yy+79,tag,6.8,PURPLE,True)
 para(M+14,yy+53,body,CW-28,8.5,12.4,INK)
 para(M+14,yy+24,extra,CW-28,7.8,11.5,MUTED)
para(M,61,'Employees see their own records. Team tools depend on the package, active add-ons and permissions set for that person.',CW,8,12)
end()
# Values: an explicit, plain-English statement of the DayRidge business approach.
begin(8,'What we stand for','Good software.\nStraight talking.','DayRidge is built around real businesses and real working days. These are the values behind how we build, explain and improve the product.')
box(M,365,CW,181,INK,r=15)
text(M+23,514,'01 / OUR STARTING POINT',8.3,'#C7BCFF',True)
text(M+23,469,'Straight talking',31,'#FFFFFF',True)
para(M+23,432,'Straight answers. Clear pricing. Honest explanations of what is included, what costs extra and where the limits are.',CW-46,12,19,'#D7DEEA')
values=[
 ('02','Built for real working days','Practical tools for busy teams: plan the rota, record the hours and handle the requests that come with running a business.'),
 ('03','Respect your people','Clear responsibilities, appropriate access and care with employee information. Give people the information they need for their role.'),
 ('04','Constant innovation','Listen to businesses, challenge unnecessary admin and keep improving the tools that make a useful difference to the working day.')]
for i,(num,title,body) in enumerate(values):
 yy=325-i*75
 pill(M,yy,num)
 text(M+44,yy,title,13,INK,True)
 para(M+44,yy-22,body,CW-44,9.4,15)
box(M,65,CW,60,LILAC)
text(M+16,104,'What that means for your business',10.5,PURPLE,True)
para(M+16,85,'A clear package comparison, published prices and a straightforward conversation before you decide.',CW-32,9,14,INK)
end()
# 7 Pricing
begin(9,'Transparent package guide','A plan for your\nteam size.','Annual prices are per business. Your agreed quote confirms the package, employee allowance and any chosen add-ons.')
text(M,554,'CLOCKX',10,PURPLE,True)
for i,p in enumerate(DATA['clockx']):
 x=M+i*174;box(x,437,163,96,LILAC);text(x+13,508,'Up to '+str(p['employeeLimit'])+' employees',8.5,INK,True);text(x+13,474,price(p['price']),23,PURPLE,True);text(x+13,453,'per business / year',8,MUTED)
text(M,402,'FULL WORKSPACE',10,PURPLE,True)
for i,p in enumerate(DATA['full']):
 yy=348-i*35;box(M,yy,CW,35,'#FFFFFF' if i%2==0 else '#F0EEF5',r=0);text(M+14,yy+13,p['name'],10,INK,True);text(M+165,yy+13,['1–5 employees','10–15 employees','16–30 employees','31–50 employees'][i],9,MUTED);text(M+393,yy+13,price(p['price']),11,PURPLE,True)
para(M,213,'For 6–9 employees, add £45 per year for each employee above the first five. Example: 8 employees = £434.99 per year. Fixed bands apply from 10 employees.',CW,9,14)
para(M,161,'Geo Clock-in: £4.99 per business / month or £49.99 per business / year. Available with either package.',CW,9,14,PURPLE,True)
para(M,120,'Managers are included. A manager with an employee shift profile uses one employee slot. Extra staff above the approved allowance need platform approval.',CW,8.8,14)
para(M,79,'Over 20 employees on Clockx or over 50 on Full Workspace? Ask for a custom quote. Annual subscriptions are arranged by bank transfer or direct agreement.',CW,8.8,14)
end()
contact_cover();end();c.save()
for name in ['dayridge-product-brochure.pdf','clocknexa-product-brochure.pdf']:shutil.copy2(OUT,ROOT/'public/downloads'/name)
shutil.copy2(OUT,OUT.parent/'DayRidge-Product-Brochure.pdf')
print(OUT)

