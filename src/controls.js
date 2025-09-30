export function mountControls(ctx, renderAll){
const { state } = ctx;


// Arrival/Departure with guardrails
document.getElementById('btnArrival').onclick=()=>{
const d=new Date(state.focus);
if(state.departure && d>state.departure){ alert('Arrival cannot be after Departure.'); return }
state.arrival=d; state.emailDirty=false; renderAll();
};
document.getElementById('btnDeparture').onclick=()=>{
const d=new Date(state.focus);
if(state.arrival && d<state.arrival){ alert('Departure cannot be before Arrival.'); return }
state.departure=d; state.emailDirty=false; renderAll();
};
document.getElementById('eta').onchange=(e)=>{ state.eta=e.target.value; renderAll() };
document.getElementById('etd').onchange=(e)=>{ state.etd=e.target.value; renderAll() };


// Keyboard shortcuts (require Cmd/Ctrl)
document.addEventListener('keydown',e=>{
if(!(e.metaKey||e.ctrlKey)) return;
if(e.key==='t' || e.key==='T'){ e.preventDefault(); state.focus=new Date(); state.monthView=null; renderAll() }
if(e.key==='a' || e.key==='A'){ e.preventDefault(); const d=new Date(state.focus); if(state.departure && d>state.departure){ alert('Arrival cannot be after Departure.'); return } state.arrival=d; state.emailDirty=false; renderAll() }
if(e.key==='d' || e.key==='D'){ e.preventDefault(); const d=new Date(state.focus); if(state.arrival && d<state.arrival){ alert('Departure cannot be before Arrival.'); return } state.departure=d; state.emailDirty=false; renderAll() }
if(e.key===',' || e.code==='Comma'){ e.preventDefault(); const d=new Date(state.focus); d.setDate(d.getDate()-1); state.focus=d; state.monthView=null; renderAll() }
if(e.key==='.' || e.code==='Period'){ e.preventDefault(); const d=new Date(state.focus); d.setDate(d.getDate()+1); state.focus=d; state.monthView=null; renderAll() }
});


// Quick add / clear
document.getElementById('addDinner').onclick=()=>{
const hm=prompt('Dinner start time (HH:MM, 15-min steps between 17:30 and 20:00, excluding 18:45):','19:00'); if(!hm) return;
const [H,M]=hm.split(':').map(Number); const mins=H*60+M;
const ok=!(mins<17*60+30 || mins>20*60 || M%15!==0 || hm==='18:45');
if(!ok){ alert('Invalid dinner time.'); return }
const key=ctx.fmtDateKey(state.focus); ctx.ensureDayList(key);
const actives=state.guests.filter(g=>g.active).map(g=>g.name); if(actives.length===0){ alert('Toggle at least one guest first.'); return }
state.itemsByDate.get(key).push({start:hm,end:null,title:'Dinner at Harvest',type:'dinner',guests:new Set(actives)});
state.emailDirty=false; renderAll();
};
document.getElementById('addCustom').onclick=()=>{
const title=prompt('Custom title:','Custom Activity'); if(!title) return;
const start=prompt('Start time (HH:MM):','10:00'); if(!start) return;
const end=prompt('End time (HH:MM, optional):','')||null;
const key=ctx.fmtDateKey(state.focus); ctx.ensureDayList(key);
const actives=state.guests.filter(g=>g.active).map(g=>g.name); if(actives.length===0){ alert('Toggle at least one guest first.'); return }
state.itemsByDate.get(key).push({start,end,title,type:'custom',guests:new Set(actives)});
state.emailDirty=false; renderAll();
};
document.getElementById('clearAll').onclick=()=>{
state.arrival=null; state.departure=null; state.itemsByDate = new Map(); state.guests=[];
document.getElementById('eta').value='12:00'; document.getElementById('etd').value='13:00'; state.eta='12:00'; state.etd='13:00';
state.emailLocked=false; state.emailDirty=false; document.getElementById('email').contentEditable=false;
const use=document.getElementById('editIcon').querySelector('use'); use.setAttribute('href','./assets/icons.svg#icon-pencil');
renderAll();
};
}