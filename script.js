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
    editing: false,
    userEdited: '',
    previewDirty: true,
    previewFrozen: false
  };

  // ---------- DOM ----------
  const $ = sel => document.querySelector(sel);
  const calMonth=$('#calMonth'), calYear=$('#calYear'), calGrid=$('#calGrid'), dow=$('#dow');
  const dayTitle=$('#dayTitle'), activitiesEl=$('#activities'), email=$('#email');
  const guestsEl=$('#guests'), guestName=$('#guestName');
  const toggleAllBtn=$('#toggleAll');
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const toggleIconTemplates = {
    allOn: createToggleSwitchSvg(true),
    someOff: createToggleSwitchSvg(false)
  };
  const toggleEditBtn=$('#toggleEdit');
  const copyBtn=$('#copy');
  toggleEditBtn.textContent='✎';
  toggleEditBtn.title='Edit';
  toggleEditBtn.setAttribute('aria-pressed','false');
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
    renderGuests(); renderActivities(); markPreviewDirty(); renderPreview();
  }
  function renderGuests(){
    guestsEl.innerHTML='';
    state.guests.forEach((g,ix)=>{
      const b=document.createElement('button');
      b.className='guest-pill'+(g.active?' active':'');

      b.style.setProperty('--pillColor', g.color);
      b.textContent='';
      if(g.primary){
        const star=document.createElement('span');
        star.className='star';
        star.textContent='★';
        star.setAttribute('aria-hidden','true');
        b.appendChild(star);
      }

      const nameSpan=document.createElement('span');
      nameSpan.className='label';
      nameSpan.textContent=g.name;
      b.appendChild(nameSpan);

      const remove=document.createElement('span');
      remove.className='x';
      remove.setAttribute('aria-hidden','true');
      remove.title='Remove';
      remove.textContent='×';
      b.appendChild(remove);
      b.onclick=(e)=>{
        if(e.target.classList.contains('x')){
          const wasPrimary = g.primary;
          state.guests.splice(ix,1);
          if(wasPrimary && state.guests.length){ state.guests[0].primary=true; }
          renderGuests(); renderActivities(); markPreviewDirty(); renderPreview();
        }else{
          g.active=!g.active; renderGuests();
        }
      };
      guestsEl.appendChild(b);
    });
    updateToggleAllButton();
  }
  function createToggleSwitchSvg(pressedTop){
    const svg=document.createElementNS(SVG_NS,'svg');
    svg.setAttribute('width','24');
    svg.setAttribute('height','24');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('aria-hidden','true');
    svg.setAttribute('focusable','false');

    const outline=document.createElementNS(SVG_NS,'rect');
    outline.setAttribute('x','7');
    outline.setAttribute('y','3.5');
    outline.setAttribute('width','10');
    outline.setAttribute('height','17');
    outline.setAttribute('rx','2.5');
    outline.setAttribute('fill','none');
    outline.setAttribute('stroke','currentColor');
    outline.setAttribute('stroke-width','1.5');
    svg.appendChild(outline);

    const divider=document.createElementNS(SVG_NS,'line');
    divider.setAttribute('x1','7');
    divider.setAttribute('y1','12');
    divider.setAttribute('x2','17');
    divider.setAttribute('y2','12');
    divider.setAttribute('stroke','currentColor');
    divider.setAttribute('stroke-width','1.25');
    divider.setAttribute('stroke-linecap','round');
    divider.setAttribute('opacity','0.6');
    svg.appendChild(divider);

    const pressed=document.createElementNS(SVG_NS,'rect');
    pressed.setAttribute('x','8.2');
    pressed.setAttribute('width','7.6');
    pressed.setAttribute('height','6');
    pressed.setAttribute('rx','1.4');
    pressed.setAttribute('fill','currentColor');
    pressed.setAttribute('opacity','0.18');
    pressed.setAttribute('y', pressedTop ? '5' : '12.9');
    svg.appendChild(pressed);

    return svg;
  }

  function setToggleIcon(state){
    if(!toggleAllBtn) return;
    const tpl = toggleIconTemplates[state];
    if(!tpl) return;
    toggleAllBtn.replaceChildren(tpl.cloneNode(true));
  }

  guestName.addEventListener('keydown',e=>{
    if(e.key==='Enter' || e.key==='NumpadEnter'){
      e.preventDefault();
      addGuest(guestName.value.trim());
    }
  });
  if(toggleAllBtn){
    toggleAllBtn.addEventListener('click',()=>{
      const anyInactive = state.guests.some(g=>!g.active);
      state.guests.forEach(g=>g.active = anyInactive ? true : false);
      renderGuests();
    });
  }

  function updateToggleAllButton(){
    if(!toggleAllBtn) return;
    const total = state.guests.length;
    const allActive = total>0 && state.guests.every(g=>g.active);
    const anyInactive = state.guests.some(g=>!g.active);
    toggleAllBtn.disabled = total===0;
    toggleAllBtn.setAttribute('aria-pressed', total>0 && allActive ? 'true' : 'false');
    if(total===0){
      setToggleIcon('allOn');
      toggleAllBtn.setAttribute('aria-label','Toggle all guests');
      toggleAllBtn.title = 'Toggle all guests';
      return;
    }
    if(anyInactive){
      setToggleIcon('someOff');
      toggleAllBtn.setAttribute('aria-label','Turn all guests on');
      toggleAllBtn.title = 'Turn all guests on';
    }else{
      setToggleIcon('allOn');
      toggleAllBtn.setAttribute('aria-label','Turn all guests off');
      toggleAllBtn.title = 'Turn all guests off';
    }
  }

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
        renderActivities(); markPreviewDirty(); renderPreview();
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
        const pill=document.createElement('button');
        pill.type='button';
        pill.className='tag-everyone';
        pill.setAttribute('aria-label','Show everyone assigned to this activity');
        pill.setAttribute('aria-haspopup','true');
        pill.setAttribute('aria-expanded','false');

        const label=document.createElement('span');
        label.textContent='Everyone';
        pill.appendChild(label);

        const pop=document.createElement('div');
        pop.className='popover';
        pop.setAttribute('role','group');
        pop.setAttribute('aria-label','Guests assigned');
        orderedIds.forEach(id=>{
          const guest = state.guests.find(g=>g.id===id);
          if(!guest) return;
          pop.appendChild(createChip(guest, entry, dateK));
        });
        pill.appendChild(pop);

        pill.addEventListener('click',()=>{
          const expanded = pill.getAttribute('aria-expanded')==='true';
          pill.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          if(expanded) pill.blur();
        });
        pill.addEventListener('focusin',()=>{
          pill.setAttribute('aria-expanded','true');
        });
        pill.addEventListener('focusout',()=>{
          setTimeout(()=>{
            if(!pill.contains(document.activeElement)){
              pill.setAttribute('aria-expanded','false');
            }
          },0);
        });
        pill.addEventListener('keydown',(e)=>{
          if(e.key==='Escape'){
            e.preventDefault();
            pill.setAttribute('aria-expanded','false');
            pill.blur();
          }
        });

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
      c.style.color = guest.color;
      c.title = guest.name;

      const initial=document.createElement('span');
      initial.className='initial';
      initial.textContent = guest.name.charAt(0).toUpperCase();
      c.appendChild(initial);

      const x=document.createElement('button');
      x.className='x';
      x.type='button';
      x.setAttribute('aria-label', `Remove ${guest.name}`);
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
        markPreviewDirty();
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
  function getStayKeys(){
    const keys=[];
    const { arrival, departure } = state;
    if(!arrival && !departure) return keys;
    let start = arrival ? zero(arrival) : (departure ? zero(departure) : null);
    let end = departure ? zero(departure) : (arrival ? zero(arrival) : null);
    if(!start || !end) return keys;
    if(start.getTime()>end.getTime()){
      const tmp=start; start=end; end=tmp;
    }
    for(const d=new Date(start); d.getTime()<=end.getTime(); d.setDate(d.getDate()+1)){
      keys.push(keyDate(d));
    }
    return keys;
  }

  function renderPreview(){
    if(state.editing) return;
    if(state.previewFrozen && !state.previewDirty){
      if(state.userEdited!==undefined) email.textContent = state.userEdited;
      return;
    }
    const lines = [];
    const primary = state.guests.find(g=>g.primary)?.name || 'Guest';
    lines.push(`Hello ${primary},`,'','Current Itinerary:','');

    const stayKeys = getStayKeys();

    if(stayKeys.length===0){
      lines.push('Set Arrival and Departure to build your preview.');
      email.textContent = lines.join('\n');
      state.previewFrozen = false;
      state.previewDirty = false;
      return;
    }

    stayKeys.forEach((k,ix)=>{
      const [y,m,d] = k.split('-').map(Number);
      const date = new Date(y, m-1, d);
      const w = weekdayName(date);
      lines.push(`${w}, ${date.toLocaleString(undefined,{month:'long'})} ${ordinal(date.getDate())}`);

      if(state.arrival && keyDate(state.arrival)===k)
        lines.push('4:00pm Guaranteed Check-In | Welcome to arrive as early as 12:00pm');

      const items = (state.schedule[k]||[]).slice().sort((a,b)=> (a.start||'').localeCompare(b.start||''));
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
      if(ix<stayKeys.length-1) lines.push('');
    });

    email.textContent = lines.join('\n');
    state.userEdited = email.textContent;
    state.previewFrozen = false;
    state.previewDirty = false;
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
    const nextArrival = zero(state.focus);
    if(state.departure && nextArrival.getTime()>state.departure.getTime()){
      state.departure = null;
    }
    state.arrival = nextArrival;
    markPreviewDirty();
    renderAll();
  }
  function setDeparture(){
    const nextDeparture = zero(state.focus);
    if(state.arrival && nextDeparture.getTime()<state.arrival.getTime()){
      state.arrival = null;
    }
    state.departure = nextDeparture;
    markPreviewDirty();
    renderAll();
  }
  $('#btnArrival').onclick=setArrival; $('#btnDeparture').onclick=setDeparture;

  // ---------- Edit / Copy / Clear ----------
  const lockSvg = '<svg class="lock-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 11V8a5 5 0 0 1 10 0v3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><rect x="5.75" y="11" width="12.5" height="9" rx="2.5" ry="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

  function setEditButton(editing){
    if(editing){
      toggleEditBtn.innerHTML = lockSvg;
      toggleEditBtn.title = 'Lock';
      toggleEditBtn.setAttribute('aria-pressed','true');
    }else{
      toggleEditBtn.textContent = '✎';
      toggleEditBtn.title = 'Edit';
      toggleEditBtn.setAttribute('aria-pressed','false');
    }
  }

  function enterEditMode(){
    state.userEdited = email.textContent;
    state.editing = true;
    email.contentEditable = 'true';
    email.style.outline = '2px dashed #bbb';
    setEditButton(true);
  }

  function exitEditMode(){
    state.editing = false;
    state.userEdited = email.textContent;
    state.previewFrozen = true;
    state.previewDirty = false;
    email.contentEditable = 'false';
    email.style.outline = 'none';
    setEditButton(false);
  }

  toggleEditBtn.onclick=()=>{
    if(state.editing){
      exitEditMode();
    }else{
      enterEditMode();
    }
  };
  email.addEventListener('dblclick', (e)=>{
    if(e.metaKey || e.ctrlKey) toggleEditBtn.click();
  });

  let copyTitleTimer = null;
  copyBtn.onclick=async ()=>{
    try{ await navigator.clipboard.writeText(email.textContent); }
    catch(e){
      const range=document.createRange(); range.selectNodeContents(email);
      const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
      document.execCommand('copy'); sel.removeAllRanges();
    }
    copyBtn.title='Copied';
    if(copyTitleTimer) clearTimeout(copyTitleTimer);
    copyTitleTimer = setTimeout(()=>{ copyBtn.title='Copy'; },1200);
  };

  $('#clearAll').onclick=()=>{
    if(!confirm('Clear all itinerary data?')) return;
    state.arrival=null; state.departure=null; state.guests.length=0; state.schedule={};
    markPreviewDirty();
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

  function markPreviewDirty(){ state.previewDirty = true; }
})();
