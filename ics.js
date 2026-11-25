// ics.js: parse a typed timetable and build an .ics file. No dependencies.
(function(root){
const DAYS={sun:0,sunday:0,"أحد":0,"احد":0,"الأحد":0,"الاحد":0,mon:1,monday:1,"اثنين":1,"إثنين":1,"الاثنين":1,"الإثنين":1,tue:2,tues:2,tuesday:2,"ثلاثاء":2,"الثلاثاء":2,wed:3,wednesday:3,"أربعاء":3,"اربعاء":3,"الأربعاء":3,"الاربعاء":3,thu:4,thur:4,thurs:4,thursday:4,"خميس":4,"الخميس":4,fri:5,friday:5,"جمعة":5,"الجمعة":5,sat:6,saturday:6,"سبت":6,"السبت":6};
const CODE=["SU","MO","TU","WE","TH","FR","SA"];
const AD="٠١٢٣٤٥٦٧٨٩";
const digits=s=>s.replace(/[٠-٩]/g,c=>AD.indexOf(c));
const p2=n=>String(n).padStart(2,"0");
function parseTime(s){const m=s.match(/^(\d{1,2})[:.](\d{2})$/);if(!m)return null;const h=+m[1],mi=+m[2];return h<24&&mi<60?[h,mi]:null}
function parseLines(text){
  const rows=[],errors=[];
  digits(text).split(/\r?\n/).forEach((raw,i)=>{
    const line=raw.trim();if(!line||line.startsWith("#"))return;
    const m=line.match(/^(\S+)\s+(\d{1,2}[:.]\d{2})\s*(?:-|–|—|to|إلى|الى)\s*(\d{1,2}[:.]\d{2})\s+(.+)$/i);
    if(!m){errors.push({line:i+1,text:raw,why:"format"});return}
    const day=DAYS[m[1].toLowerCase()];const a=parseTime(m[2]),b=parseTime(m[3]);
    if(day===undefined){errors.push({line:i+1,text:raw,why:"day"});return}
    if(!a||!b||b[0]*60+b[1]<=a[0]*60+a[1]){errors.push({line:i+1,text:raw,why:"time"});return}
    let title=m[4].trim(),loc="";
    const sp=title.split(/\s+@\s*|\s*[،,]\s+|\s+-\s+/);
    if(sp.length>1){title=sp[0].trim();loc=sp.slice(1).join(", ").trim()}
    rows.push({day,start:a,end:b,title,loc});
  });
  rows.sort((x,y)=>x.day-y.day||(x.start[0]*60+x.start[1])-(y.start[0]*60+y.start[1]));
  return{rows,errors};
}
const esc=s=>s.replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\n/g,"\\n");
function fold(l){const out=[];let s=l;while(s.length>73){out.push(s.slice(0,73));s=" "+s.slice(73)}out.push(s);return out.join("\r\n")}
function ymd(d){return d.getFullYear()+p2(d.getMonth()+1)+p2(d.getDate())}
function build(rows,startStr,endStr,opts){
  opts=opts||{};
  const start=new Date(startStr+"T00:00:00"),end=new Date(endStr+"T00:00:00");
  const skips=(opts.skip||"").split(/[\s,]+/).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x));
  const L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//classcal//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH"];
  const stamp=new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d+/,"");
  rows.forEach((r,i)=>{
    const first=new Date(start);while(first.getDay()!==r.day)first.setDate(first.getDate()+1);
    if(first>end)return;
    const d=ymd(first);
    L.push("BEGIN:VEVENT",`UID:classcal-${d}-${i}-${r.day}${p2(r.start[0])}${p2(r.start[1])}@classcal`,`DTSTAMP:${stamp}`,
      `DTSTART:${d}T${p2(r.start[0])}${p2(r.start[1])}00`,`DTEND:${d}T${p2(r.end[0])}${p2(r.end[1])}00`,
      `RRULE:FREQ=WEEKLY;BYDAY=${CODE[r.day]};UNTIL=${ymd(end)}T235959`);
    const ex=skips.filter(s=>new Date(s+"T00:00:00").getDay()===r.day).map(s=>s.replace(/-/g,"")+"T"+p2(r.start[0])+p2(r.start[1])+"00");
    if(ex.length)L.push("EXDATE:"+ex.join(","));
    L.push("SUMMARY:"+esc(r.title));if(r.loc)L.push("LOCATION:"+esc(r.loc));
    if(opts.alarm)L.push("BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:"+esc(r.title),"TRIGGER:-PT"+opts.alarm+"M","END:VALARM");
    L.push("END:VEVENT");
  });
  L.push("END:VCALENDAR");
  return L.map(fold).join("\r\n")+"\r\n";
}
root.ICS={parseLines,build,DAYS};
if(typeof module!=="undefined")module.exports=root.ICS;
})(typeof window!=="undefined"?window:globalThis);
