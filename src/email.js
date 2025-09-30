export function mountEmail(ctx, renderAll){
const { state, el, fmtDateKey, fromDateKey, weekdayName, monthName, ordinal, hmToAmPm } = ctx;
const email = el.email;


function dateHeadingFromKey(k){
const d=fromDateKey(k);
return `${weekdayName(d)}, ${d.toLocaleString(undefined,{month:'long'})} ${ordinal(d.getDate())}`;
}
function generateEmail(){
const pg=state.guests.find(g=>g.primary);
const hello=pg? pg.name : 'Guest';
const lines=[];
lines.push(`Hello ${hello},`);
lines.push('');
lines.push('Current Itinerary:');
const dayKeys=new Set(Array.from(state.itemsByDate.keys()));
if(state.arrival) dayKeys.add(fmtDateKey(state.arrival));
if(state.departure) dayKeys.add(fmtDateKey(state.departure));
const keys=Array.from(dayKeys).sort();
for(const k of keys){
const items=(state.itemsByDate.get(k)||[]).slice().sort((a,b)=>a.start.localeCompare(b.start));
const isArr=state.arrival && k===fmtDateKey(state.arrival);
const isDep=state.departure && k===fmtDateKey(state.departure);
if(items.length===0 && !isArr && !isDep) continue;
lines.push('');
lines.push(dateHeadingFromKey(k));
if(isArr){ lines.push(`4:00pm Guaranteed Check-In | Welcome to arrive as early as 12:00pm`) }
for(const it of items){
const timeTxt=it.end? `${hmToAmPm(it.start)} - ${hmToAmPm(it.end)}` : hmToAmPm(it.start);
lines.push(`${timeTxt} | ${it.title}`);
}
if(isDep){ lines.push(`11:00am Check-Out | Welcome to stay on property until 1:00pm`) }
}
return lines.join('\n');
}


function renderEmail(){ if(state.emailLocked || state.emailDirty) return; email.textContent = generateEmail() }


// inline edit with Cmd/Ctrl + dblclick
email.addEventListener('dblclick',(e)=>{
if(!(e.metaKey||e.ctrlKey)) return;
state.emailLocked=!state.emailLocked; email.contentEditable=state.emailLocked;
const use=document.getElementById('editIcon').querySelector('use');
use.setAttribute('href', state.emailLocked ? './assets/icons.svg#icon-lock' : './assets/icons.svg#icon-pencil');
if(state.emailLocked) state.emailDirty=true;
});
email.addEventListener('input',()=>{ if(state.emailLocked) state.emailDirty=true });


// copy
document.getElementById('toggleEdit').onclick=()=>{
const evt=new Event('dblclick'); evt.metaKey=true; email.dispatchEvent(evt);
};
document.getElementById('copy').onclick=async()=>{
const text=email.textContent;
try{ await navigator.clipboard.writeText(text); alert('Copied email to clipboard'); }
catch(e){ const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); alert('Copied (fallback)') }
};


return renderEmail;
}