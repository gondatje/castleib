export function mountCalendar(ctx, renderAll){
const { state, fmtDateKey, weekdayName, monthName } = ctx;


const dowEl = document.getElementById('dow');
const grid = document.getElementById('calGrid');


// static dow header
dowEl.innerHTML='';
['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d=>{
const c=document.createElement('div'); c.className='dow'; c.textContent=d; dowEl.appendChild(c);
});


function renderCalendar(){
const ref = state.monthView ? new Date(state.monthView.y, state.monthView.m, 1)
: new Date(state.focus.getFullYear(),state.focus.getMonth(),1);
document.getElementById('calMonth').textContent = monthName(ref.getFullYear(),ref.getMonth());
document.getElementById('calYear').textContent = ref.getFullYear();


grid.innerHTML='';
const first=new Date(ref.getFullYear(),ref.getMonth(),1);
const startWd=first.getDay(); // Sun=0
const totalCells=42; // 6 rows stable so layout doesn't jump
for(let i=0;i<totalCells;i++){
const dateObj=new Date(ref.getFullYear(),ref.getMonth(),1 - startWd + i);
const inMonth = dateObj.getMonth()===ref.getMonth();
const btn=document.createElement('button'); btn.className='day'+(inMonth?'':' faded'); btn.textContent=dateObj.getDate();
const today=new Date(); today.setHours(0,0,0,0);
const cd=new Date(dateObj); cd.setHours(0,0,0,0);
if(cd.getTime()===today.getTime()) btn.classList.add('today');
if(state.arrival){const a=new Date(state.arrival).setHours(0,0,0,0); if(cd.getTime()===a) btn.classList.add('arrival')}
if(state.departure){const d=new Date(state.departure).setHours(0,0,0,0); if(cd.getTime()===d) btn.classList.add('departure')}
if(state.arrival && state.departure){
const a=new Date(state.arrival).setHours(0,0,0,0); const d=new Date(state.departure).setHours(0,0,0,0);
const k=cd.getTime(); if(k>a&&k<d) btn.classList.add('stay');
}
if(cd.toDateString()===state.focus.toDateString()) btn.classList.add('focus');
btn.addEventListener('click',()=>{
state.focus=new Date(dateObj);
if(!inMonth){ state.monthView={y:dateObj.getFullYear(),m:dateObj.getMonth()} }
renderAll();
});
grid.appendChild(btn);
}
// nav
document.getElementById('mPrev').onclick=()=>{ const y=ref.getFullYear(),m=ref.getMonth()-1; state.monthView={y:y+(m<0?-1:0), m:(m+12)%12}; renderCalendar() };
document.getElementById('mNext').onclick=()=>{ const y=ref.getFullYear(),m=ref.getMonth()+1; state.monthView={y:y+(m>11?1:0), m:(m+12)%12}; renderCalendar() };
document.getElementById('yPrev').onclick=()=>{ state.monthView={y:ref.getFullYear()-1,m:ref.getMonth()}; renderCalendar() };
document.getElementById('yNext').onclick=()=>{ state.monthView={y:ref.getFullYear()+1,m:ref.getMonth()}; renderCalendar() };
document.getElementById('btnToday').onclick=()=>{ state.focus=new Date(); state.monthView=null; renderAll() };
}


return renderCalendar;
}