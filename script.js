// Minimal, Codex-ready Wave-1 core (calendar, guests, assign, arrival/departure, preview)
(function(){
  // ---------- Utils ----------
  const pad = n => String(n).padStart(2,'0');
  const zero = d => { const x=new Date(d); x.setHours(0,0,0,0); return x; };
  const monthName = (y,m) => new Date(y,m,1).toLocaleString(undefined,{month:'long'});
  const weekdayName = d => d.toLocaleDateString(undefined,{weekday:'long'});
  const ordinal = n => { const s=['th','st','nd','rd'],v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); };
  const fmt12 = hm => { let [h,m]=hm.split(':').map(Number); const am=h<12; h=((h+11)%12)+1; return `${h}:${pad(m)}${am?'am':'pm'}`; };
  const keyDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

  // Exported API stub for Codex (time wheel later)
  window.createTimeWheelController = (el, initial="12:00") => ({ get:()=>initial, set:()=>{}, mount:()=>{}, destroy:()=>{} });

  // ---------- State ----------
  const state = {
    today: zero(new Date()),
    focus: zero(new Date()),
    arrival: null,
    departure: null,
    guests: [], // {id,name,color,active,primary}
    colors: ['#6366f1','#06b6d4','#22c55e','#f59e0b','#ef4444','#a855f7','#10b981','#f43f5e','#0ea5e9'],
    schedule: {}, // dateKey -> [{type:'activity',title,start,end,guestIds:Set}]
    data: null,
    dataStatus: 'loading',
    editing: false
  };

  // ---------- DOM ----------
  const $ = sel => document.querySelector(sel);
  const calMonth=$('#calMonth'), calYear=$('#calYear'), calGrid=$('#calGrid'), dow=$('#dow');
  const dayTitle=$('#dayTitle'), activitiesEl=$('#activities'), email=$('#email');
  const guestsEl=$('#guests'), guestName=$('#guestName');
  calGrid.addEventListener('keydown',e=>{
    if(e.target.tagName==='BUTTON' && (e.key==='Enter' || e.key===' ' || e.key==='Spacebar')){
      e.preventDefault();
      e.target.click();
    }
  });

  // DOW header
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(t=>{
    const d=document.createElement('div'); d.textContent=t; dow.appendChild(d);
  });

  // ---------- Data load ----------
  renderAll();

  Promise.all([
    fetch('data/activities.json').then(r=>r.json()),
    fetch('data/spa.json').then(r=>r.json()),
    fetch('data/locations.json').then(r=>r.json())
  ]).then(([acts,spa,locs])=>{
    state.data = { activities: acts, spa, locations: locs };
    state.dataStatus = 'ready';
    renderAll();
  }).catch(e=>{
    console.error(e);
    state.data = null;
    state.dataStatus = 'error';
    renderAll();
    email.textContent = 'Data load failed. Serve via http:// and verify /data files exist.';
  });

  // ---------- Season + weekday ----------
  function activeSeason(date){
    const ds = keyDate(date);
    const seasons = state.data?.activities?.seasons || [];
    for(const s of seasons){ if(ds>=s.start && ds<=s.end) return s; }
    return null;
  }
  const weekdayKey = d => ['sun','mon','tue','wed','thu','fri','sat'][d.getDay()];

  // ---------- Calendar ----------
  function renderCalendar(){
    const y=state.focus.getFullYear(), m=state.focus.getMonth();
    calMonth.textContent = monthName(y,m); calYear.textContent = y;
    calGrid.innerHTML='';
    const first=new Date(y,m,1), startOffset=first.getDay();
    for(let i=0;i<42;i++){
      const d=new Date(y,m,1 - startOffset + i);
      const btn=document.createElement('button');
      btn.textContent = d.getDate();
      btn.setAttribute('role','gridcell');
      btn.setAttribute('tabindex','0');
      btn.setAttribute('aria-selected','false');
      btn.setAttribute('aria-label', d.toDateString());
      if(d.getMonth()!==m) btn.classList.add('other');
      if(d.getTime()===state.today.getTime()){
        btn.classList.add('today');
        btn.setAttribute('aria-current','date');
      }
      if(d.getTime()===state.focus.getTime()){
        btn.classList.add('focus');
        btn.setAttribute('aria-selected','true');
      }

      if(state.arrival && state.departure){
        const t=d.getTime();
        if(t>state.arrival.getTime() && t<state.departure.getTime()) btn.classList.add('stay');
      }
      if(state.arrival && d.getTime()===state.arrival.getTime()) btn.classList.add('arrival');
      if(state.departure && d.getTime()===state.departure.getTime()) btn.classList.add('departure');

      btn.addEventListener('click',()=>{ state.focus=zero(d); renderAll(); });
      calGrid.appendChild(btn);
    }
  }

  // ---------- Guests ----------
  function addGuest(name){
    if(!name) return;
    const id = (crypto.randomUUID ? crypto.randomUUID() : `g_${Date.now()}_${Math.random().toString(16).slice(2)}`);
    const color = state.colors[state.guests.length % state.colors.length];
    const g = {id,name, color, active:true, primary: state.guests.length===0};
    state.guests.push(g);
    guestName.value='';
    renderGuests(); renderActivities(); renderPreview();
  }
  function renderGuests(){
    guestsEl.innerHTML='';
    state.guests.forEach((g,ix)=>{
      const b=document.createElement('button');
      b.className='guest-pill'+(g.active?' active':'');

      b.style.setProperty('--pillColor', g.color);
      const star = g.primary ? '<span class="star">★</span>' : '';
      b.innerHTML = `${star}${g.name} <span class="x" aria-hidden="true" title="Remove">×</span>`;
      b.onclick=(e)=>{
        if(e.target.classList.contains('x')){
          const wasPrimary = g.primary;
          state.guests.splice(ix,1);
          if(wasPrimary && state.guests.length){ state.guests[0].primary=true; }
          renderGuests(); renderActivities(); renderPreview();
        }else{
          g.active=!g.active; renderGuests();
        }
      };
      guestsEl.appendChild(b);
    });
  }
  $('#addGuest').onclick=()=>addGuest(guestName.value.trim());
  guestName.addEventListener('keydown',e=>{ if(e.key==='Enter') addGuest(guestName.value.trim()); });
  $('#toggleAll').onclick=()=>{
    const anyInactive = state.guests.some(g=>!g.active);
    state.guests.forEach(g=>g.active = anyInactive ? true : false);
    renderGuests();
  };

  // ---------- Activities ----------
  function renderActivities(){
    const wname=weekdayName(state.focus);
    dayTitle.textContent = `${wname}, ${state.focus.toLocaleString(undefined,{month:'long'})} ${ordinal(state.focus.getDate())}`;

    if(state.dataStatus==='loading'){
      renderStatusMessage('Loading activities…');
      return;
    }

    if(state.dataStatus==='error'){
      renderStatusMessage('Activities unavailable — data failed to load.');
      return;
    }

    const season = activeSeason(state.focus);
    const weekKey = weekdayKey(state.focus);
    const list = (season?.weekly?.[weekKey] || []).slice().sort((a,b)=> a.start.localeCompare(b.start));

    activitiesEl.innerHTML='';
    list.forEach(row=>{
      const div=document.createElement('div'); div.className='item';
      const left=document.createElement('div'); left.className='item-left';

      const text=document.createElement('div');
      text.textContent = `${fmt12(row.start)} - ${fmt12(row.end)} | ${row.title}`;
      left.appendChild(text);

      const tagWrap=document.createElement('div'); tagWrap.className='tag-row';

      const dateK = keyDate(state.focus);
      const day = getOrCreateDay(dateK);
      const entry = day.find(e=> e.type==='activity' && e.title===row.title && e.start===row.start && e.end===row.end);
      const assignedIds = entry ? Array.from(entry.guestIds) : [];

      if(state.guests.length>0){
        renderAssignments(tagWrap, entry, assignedIds, dateK);
      }

      left.appendChild(tagWrap);

      const add=document.createElement('button');
      add.className='add'; add.textContent='+'; add.title='Assign active guests';
      add.onclick=()=>{
        const actives = state.guests.filter(g=>g.active);
        if(actives.length===0){ alert('Toggle at least one guest pill before assigning.'); return; }
        const d = getOrCreateDay(dateK);
        let target = d.find(e=> e.type==='activity' && e.title===row.title && e.start===row.start && e.end===row.end);
        if(!target){ target = {type:'activity', title:row.title, start:row.start, end:row.end, guestIds:new Set()}; d.push(target); }
        actives.forEach(g=> target.guestIds.add(g.id));
        sortDayEntries(dateK);
        renderActivities(); renderPreview();
      };

      div.appendChild(left); div.appendChild(add);
      activitiesEl.appendChild(div);
    });

    function renderAssignments(container, entry, ids, dateK){
      container.innerHTML='';
      if(ids.length===0) return;

      const idSet = new Set(ids);
      const orderedIds = state.guests.map(g=>g.id).filter(id=>idSet.has(id));

      if(orderedIds.length===state.guests.length){
        const pill=document.createElement('span');
        pill.className='tag-everyone';
        const label=document.createElement('span');
        label.textContent='Everyone';
        pill.appendChild(label);

        const pop=document.createElement('div');
        pop.className='popover';
        orderedIds.forEach(id=>{
          const guest = state.guests.find(g=>g.id===id);
          if(!guest) return;
          pop.appendChild(createChip(guest, entry, dateK));
        });
        pill.appendChild(pop);
        container.appendChild(pill);
        return;
      }

      orderedIds.forEach(id=>{
        const guest = state.guests.find(g=>g.id===id);
        if(!guest) return;
        container.appendChild(createChip(guest, entry, dateK));
      });
    }

    function createChip(guest, entry, dateK){
      const c=document.createElement('span');
      c.className='chip';
      c.style.borderColor = guest.color;

      c.title = guest.name;

      const initial=document.createElement('span');
      initial.className='initial';
      initial.textContent = guest.name.charAt(0).toUpperCase();
      c.appendChild(initial);

      const x=document.createElement('button');
      x.className='x';
      x.type='button';
      x.title=`Remove ${guest.name}`;
      x.textContent='×';
      x.onclick=(e)=>{
        e.stopPropagation();
        if(!entry) return;
        entry.guestIds.delete(guest.id);
        if(entry.guestIds.size===0){
          const day = state.schedule[dateK];
          if(day){
            const idx = day.indexOf(entry);
            if(idx>-1) day.splice(idx,1);
            if(day.length===0) delete state.schedule[dateK];
          }
        }
        sortDayEntries(dateK);
        renderActivities();
        renderPreview();
      };
      c.appendChild(x);
      return c;
    }
    function renderStatusMessage(text){
      activitiesEl.innerHTML='';
      const msg=document.createElement('div');
      msg.className='data-status';
      msg.textContent=text;
      msg.style.padding='1rem';
      msg.style.background='#fef3c7';
      msg.style.border='1px solid #f59e0b';
      msg.style.borderRadius='0.75rem';
      msg.style.color='#92400e';
      msg.style.textAlign='center';
      activitiesEl.appendChild(msg);
    }
  }
  function getOrCreateDay(dateK){ if(!state.schedule[dateK]) state.schedule[dateK]=[]; return state.schedule[dateK]; }
  function sortDayEntries(dateK){
    const day = state.schedule[dateK];
    if(!day) return;
    day.sort((a,b)=>{
      const sa = a.start || '';
      const sb = b.start || '';
      return sa.localeCompare(sb);
    });
  }

  // ---------- Preview ----------
  function renderPreview(){
    if(state.editing) return;
    const lines = [];
    const primary = state.guests.find(g=>g.primary)?.name || 'Guest';
    lines.push(`Hello ${primary},`,'','Current Itinerary:','');

    const keys = new Set(Object.keys(state.schedule));
    if(state.arrival) keys.add(keyDate(state.arrival));
    if(state.departure) keys.add(keyDate(state.departure));
    const sorted = Array.from(keys).sort();

    if(sorted.length===0){
      lines.push(`${weekdayName(state.focus)}, ${state.focus.toLocaleString(undefined,{month:'long'})} ${ordinal(state.focus.getDate())}`);
      lines.push('(Assign an activity with + to start building the itinerary.)');
      email.textContent = lines.join('\n'); return;
    }

    sorted.forEach(k=>{
      const [y,m,d] = k.split('-').map(Number);
      const date = new Date(y, m-1, d);
      const w = weekdayName(date);
      lines.push(`${w}, ${date.toLocaleString(undefined,{month:'long'})} ${ordinal(date.getDate())}`);

      if(state.arrival && keyDate(state.arrival)===k)
        lines.push('4:00pm Guaranteed Check-In | Welcome to arrive as early as 12:00pm');

      const items = (state.schedule[k]||[]).slice().sort((a,b)=> a.start.localeCompare(b.start));
      items.forEach(it=>{
        const ids = Array.from(it.guestIds||[]);
        if(ids.length===0) return;
        const everyone = (ids.length===state.guests.length);
        const names = ids.map(id=> state.guests.find(g=>g.id===id)?.name).filter(Boolean);
        const tag = everyone ? '' : names.map(n=>` | ${n}`).join('');
        lines.push(`${fmt12(it.start)} - ${fmt12(it.end)} | ${it.title}${tag}`);
      });

      if(state.departure && keyDate(state.departure)===k)
        lines.push('11:00am Check-Out | Welcome to stay on property until 1:00pm');

      lines.push('');
    });

    email.textContent = lines.join('\n');
  }

  // ---------- Nav + Stay ----------
  $('#mPrev').onclick=()=>{ const d=new Date(state.focus); d.setMonth(d.getMonth()-1); state.focus=zero(d); renderAll(); };
  $('#mNext').onclick=()=>{ const d=new Date(state.focus); d.setMonth(d.getMonth()+1); state.focus=zero(d); renderAll(); };
  $('#yPrev').onclick=()=>{ const d=new Date(state.focus); d.setFullYear(d.getFullYear()-1); state.focus=zero(d); renderAll(); };
  $('#yNext').onclick=()=>{ const d=new Date(state.focus); d.setFullYear(d.getFullYear()+1); state.focus=zero(d); renderAll(); };
  $('#btnToday').onclick=()=>{ state.focus=zero(new Date()); renderAll(); };
  $('#prevDay').onclick=()=>{ const d=new Date(state.focus); d.setDate(d.getDate()-1); state.focus=zero(d); renderAll(); };
  $('#nextDay').onclick=()=>{ const d=new Date(state.focus); d.setDate(d.getDate()+1); state.focus=zero(d); renderAll(); };

  function setArrival(){
    if(state.departure && state.focus.getTime()>state.departure.getTime()){ alert('Arrival cannot be after Departure.'); return; }
    state.arrival = new Date(state.focus); renderAll();
  }
  function setDeparture(){
    if(state.arrival && state.focus.getTime()<state.arrival.getTime()){ alert('Departure cannot be before Arrival.'); return; }
    state.departure = new Date(state.focus); renderAll();
  }
  $('#btnArrival').onclick=setArrival; $('#btnDeparture').onclick=setDeparture;

  // ---------- Edit / Copy / Clear ----------
  $('#toggleEdit').onclick=()=>{
    state.editing = !state.editing;
    email.contentEditable = state.editing ? 'true' : 'false';
    email.style.outline = state.editing ? '2px dashed #bbb' : 'none';
  };
  email.addEventListener('dblclick', (e)=>{
    if(e.metaKey || e.ctrlKey) $('#toggleEdit').click();
  });

  $('#copy').onclick=async ()=>{
    try{ await navigator.clipboard.writeText(email.textContent); }
    catch(e){
      const range=document.createRange(); range.selectNodeContents(email);
      const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
      document.execCommand('copy'); sel.removeAllRanges();
    }
  };

  $('#clearAll').onclick=()=>{
    if(!confirm('Clear all itinerary data?')) return;
    state.arrival=null; state.departure=null; state.guests.length=0; state.schedule={};
    renderAll();
  };

  // ---------- Shortcuts (guard against browser defaults) ----------
  window.addEventListener('keydown', (e)=>{
    if(!(e.metaKey||e.ctrlKey)) return;
    // ignore when typing in inputs/contentEditable
    const ae = document.activeElement;
    if(ae && (ae.tagName==='INPUT' || ae.tagName==='TEXTAREA' || email.isContentEditable)) return;

    if(e.key.toLowerCase()==='a'){ e.preventDefault(); e.stopPropagation(); setArrival(); }
    if(e.key.toLowerCase()==='d'){ e.preventDefault(); e.stopPropagation(); setDeparture(); }
    if(e.key===',' ){ e.preventDefault(); e.stopPropagation(); const d=new Date(state.focus); d.setDate(d.getDate()-1); state.focus=zero(d); renderAll(); }
    if(e.key==='.' ){ e.preventDefault(); e.stopPropagation(); const d=new Date(state.focus); d.setDate(d.getDate()+1); state.focus=zero(d); renderAll(); }
    if(e.key.toLowerCase()==='t'){ e.preventDefault(); e.stopPropagation(); state.focus=zero(new Date()); renderAll(); }
  });

  // ---------- Render root ----------
  function renderAll(){
    renderCalendar();
    renderGuests();
    renderActivities();
    renderPreview();
  }
})();
