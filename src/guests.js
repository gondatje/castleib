export function mountGuests(ctx, renderAll){
const { state } = ctx;
const wrap = document.getElementById('guests');


function addGuest(name){
name = name?.trim(); if(!name) return;
const color = state.colors[state.guests.length % state.colors.length];
const primary = state.guests.length===0;
state.guests.push({name,color,primary,active:true});
renderGuests(); ctx.renderActivities(); ctx.renderEmail();
}
function removeGuest(i){
const wasPrimary=state.guests[i].primary;
state.guests.splice(i,1);
if(wasPrimary && state.guests[0]) state.guests[0].primary=true;
renderGuests(); ctx.renderActivities(); ctx.renderEmail();
}


function renderGuests(){
wrap.innerHTML='';
state.guests.forEach((g,i)=>{
const el=document.createElement('div'); el.className='chip'; el.classList.add(g.active?'on':'off');
el.style.borderColor=g.active? g.color : '#cfd6e7';
el.style.color=g.active? 'var(--ink)' : '#7d8aa0';
const star=g.primary? '<span class="star">⋆</span>' : '';
el.innerHTML=`${star}<strong>${g.name}</strong>`;
const x=document.createElement('span'); x.className='x'; x.textContent='×';
const onRemove=(e)=>{ e.preventDefault(); e.stopPropagation(); removeGuest(i) };
x.addEventListener('pointerdown', onRemove);
x.addEventListener('click', onRemove);
x.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') onRemove(e) });
el.addEventListener('click', (e)=>{ if(e.target.classList.contains('x')) return; g.active=!g.active; renderGuests(); ctx.renderActivities() });
el.appendChild(x);
wrap.appendChild(el);
});
}


// wire up controls
document.getElementById('addGuest').onclick=()=>{ const n=document.getElementById('guestName'); addGuest(n.value); n.value=''; n.focus() };
document.getElementById('guestName').addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); const n=e.target; addGuest(n.value); n.value=''; } });
document.getElementById('toggleAll').onclick=()=>{ const anyOff=state.guests.some(g=>!g.active); state.guests.forEach(g=>g.active=anyOff); renderGuests(); ctx.renderActivities() };


return renderGuests;
}