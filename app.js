(()=>{
const $=id=>document.getElementById(id);
const T={en:{tag:"timetable → calendar",l1:"Your timetable, one class per line",hint:"Format: <code>Day HH:MM-HH:MM Title @ Place</code>. Days in English or Arabic (Sun, السبت). Arabic digits work.",l2:"Semester starts",l3:"Semester ends",l4:"Dates to skip (holidays), comma separated",l5:"Remind me 15 minutes before",dl:"Download .ics",sample:"Sample",pv:"Preview",how:"Import: Google Calendar, Settings, Import & export, Import. On iPhone, open the file and tap Add All. Times are local (no timezone is stored), so they show up at the same clock time wherever your calendar is.",priv:"Nothing leaves your browser.",btn:"العربية",
  days:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],empty:"Your classes show up here.",e1:"Line {n} not understood: ",e2:"Pick the semester start and end dates.",e3:"End date is before start date.",e4:"Add at least one valid class line.",weeks:"weekly until"},
 ar:{tag:"من الجدول للتقويم",l1:"جدولك، حصة في كل سطر",hint:"الشكل: <code>اليوم HH:MM-HH:MM اسم المادة @ المكان</code>. الأيام بالعربي أو الإنجليزي (Sun، السبت). الأرقام العربي شغالة.",l2:"بداية الترم",l3:"نهاية الترم",l4:"أيام تتخطاها (إجازات)، افصل بينها بفاصلة",l5:"فكرني قبلها بـ 15 دقيقة",dl:"نزّل ملف .ics",sample:"مثال",pv:"معاينة",how:"الاستيراد: Google Calendar، الإعدادات، استيراد وتصدير، استيراد. على الآيفون افتح الملف واضغط Add All. الأوقات محلية (من غير منطقة زمنية) فبتظهر في نفس الساعة في أي مكان.",priv:"مفيش حاجة بتسيب متصفحك.",btn:"English",
  days:["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"],empty:"حصصك هتظهر هنا.",e1:"السطر {n} مش مفهوم: ",e2:"اختار بداية ونهاية الترم.",e3:"النهاية قبل البداية.",e4:"ضيف حصة صحيحة واحدة على الأقل.",weeks:"كل أسبوع لحد"}};
let lang=localStorage.getItem("classcal-lang")||"en";
const SAMPLE_EN="Sun 09:00-10:30 Data Structures @ Hall 3\nSun 11:00-12:30 Calculus II @ Hall 1\nTue 08:30-10:00 Physics @ Lab B\nWed 10:00-11:30 English @ Room 204\nThu 12:00-13:30 Algorithms @ Hall 3";
const SAMPLE_AR="الأحد \u200E09:00-10:30\u200E هياكل بيانات @ قاعة 3\nالأحد \u200E11:00-12:30\u200E تفاضل وتكامل @ قاعة 1\nالثلاثاء \u200E08:30-10:00\u200E فيزياء @ معمل ب\nالأربعاء \u200E10:00-11:30\u200E إنجليزي @ غرفة 204\nالخميس \u200E12:00-13:30\u200E خوارزميات @ قاعة 3";
function setDefaults(){
  const n=new Date(),iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  if(!$("start").value)$("start").value=iso(n);
  if(!$("end").value){const e=new Date(n);e.setDate(e.getDate()+105);$("end").value=iso(e)}
}
function ui(){
  const t=T[lang];document.documentElement.lang=lang;document.documentElement.dir=lang==="ar"?"rtl":"ltr";
  $("tag").textContent=t.tag;$("l1").textContent=t.l1;$("hint").innerHTML=t.hint;$("l2").textContent=t.l2;$("l3").textContent=t.l3;$("l4").textContent=t.l4;$("l5").textContent=t.l5;$("dl").textContent=t.dl;$("sample").textContent=t.sample;$("pv").textContent=t.pv;$("how").textContent=t.how;$("priv").textContent=t.priv;$("lang").textContent=t.btn;
  render();
}
function render(){
  const t=T[lang],r=ICS.parseLines($("txt").value);
  const bad=r.errors.map(e=>t.e1.replace("{n}",e.line)+e.text).join("\n");
  $("err").textContent=bad;$("err").style.whiteSpace="pre-line";
  if(!r.rows.length){$("out").innerHTML=`<p class="empty">${t.empty}</p>`;return}
  const by={};r.rows.forEach(x=>(by[x.day]=by[x.day]||[]).push(x));
  const p2=n=>String(n).padStart(2,"0"),esc=s=>s.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
  $("out").innerHTML=Object.keys(by).map(d=>`<div class="day"><b>${t.days[d]}</b>`+by[d].map(x=>`<div class="ev"><time>${p2(x.start[0])}:${p2(x.start[1])}–${p2(x.end[0])}:${p2(x.end[1])}</time><div>${esc(x.title)}${x.loc?`<small>${esc(x.loc)}</small>`:""}</div></div>`).join("")+`</div>`).join("");
}
$("txt").oninput=()=>{localStorage.setItem("classcal-txt",$("txt").value);render()};
$("sample").onclick=()=>{$("txt").value=lang==="ar"?SAMPLE_AR:SAMPLE_EN;render()};
$("lang").onclick=()=>{lang=lang==="en"?"ar":"en";localStorage.setItem("classcal-lang",lang);ui()};
$("dl").onclick=()=>{
  const t=T[lang],r=ICS.parseLines($("txt").value);
  if(!$("start").value||!$("end").value){$("err").textContent=t.e2;return}
  if($("end").value<$("start").value){$("err").textContent=t.e3;return}
  if(!r.rows.length){$("err").textContent=t.e4;return}
  const s=ICS.build(r.rows,$("start").value,$("end").value,{skip:$("skip").value,alarm:$("alarm").checked?15:0});
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([s],{type:"text/calendar;charset=utf-8"}));a.download="timetable.ics";document.body.appendChild(a);a.click();a.remove();
};
$("txt").value=localStorage.getItem("classcal-txt")||(lang==="ar"?SAMPLE_AR:SAMPLE_EN);
setDefaults();ui();
})();
