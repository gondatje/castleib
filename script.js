// Minimal, Codex-ready Wave-1 core (calendar, guests, assign, arrival/departure, preview)
(function(){
  // ---------- Utils ----------
  const pad = n => String(n).padStart(2,'0');
  const zero = d => { const x=new Date(d); x.setHours(0,0,0,0); return x; };
  const monthName = (y,m) => new Date(y,m,1).toLocaleString(undefined,{month:'long'});
  const weekdayName = d => d.toLocaleDateString(undefined,{weekday:'long'});
  const ordinalSuffix = n => { const s=['th','st','nd','rd'],v=n%100; return (s[(v-20)%10]||s[v]||s[0]); };
  const ordinalSup = n => {
    const sup=document.createElement('sup');
    sup.textContent = ordinalSuffix(n);
    sup.style.fontSize = '0.6em';
    sup.style.verticalAlign = 'super';
    return sup;
  };
  const fmt12 = hm => { let [h,m]=hm.split(':').map(Number); const am=h<12; h=((h+11)%12)+1; return `${h}:${pad(m)}${am?'am':'pm'}`; };
  const keyDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

  const applyStyles = (el, styles={})=>{ Object.assign(el.style, styles); return el; };
  const createEl = (tag, opts={}, ...children)=>{
    const el=document.createElement(tag);
    if(opts.className) el.className = opts.className;
    if(opts.text!=null) el.textContent = opts.text;
    if(opts.html!=null) el.innerHTML = opts.html;
    if(opts.attrs){ for(const [k,v] of Object.entries(opts.attrs)) el.setAttribute(k,v); }
    if(opts.style) applyStyles(el, opts.style);
    const kids = opts.children || children;
    kids.forEach(child=>{
      if(child==null) return;
      if(typeof child === 'string' || typeof child === 'number') el.appendChild(document.createTextNode(String(child)));
      else el.appendChild(child);
    });
    return el;
  };

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
    editing: false
  };

  // ---------- DOM ----------
  const $ = sel => document.querySelector(sel);
  const calMonth=$('#calMonth'), calYear=$('#calYear'), calGrid=$('#calGrid'), dow=$('#dow');
  const dayTitle=$('#dayTitle'), activitiesEl=$('#activities'), email=$('#email');
  const guestsEl=$('#guests'), guestName=$('#guestName');

  // DOW header
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(t=>{
    const d=document.createElement('div'); d.textContent=t; dow.appendChild(d);
  });

  // ---------- Data load ----------
  Promise.all([
    fetch('data/activities.json').then(r=>r.json()),
    fetch('data/spa.json').then(r=>r.json()),
    fetch('data/locations.json').then(r=>r.json())
  ]).then(([acts,spa,locs])=>{
    state.data = { activities: acts, spa, locations: locs };
    renderAll();
  }).catch(e=>{
    console.error(e);
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
      btn.setAttribute('aria-label', d.toDateString());
      if(d.getMonth()!==m) btn.classList.add('other');
      if(d.getTime()===state.today.getTime()) btn.classList.add('today');
      if(d.getTime()===state.focus.getTime()) btn.classList.add('focus');

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
      b.style.borderColor=g.color;
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
    dayTitle.innerHTML = '';
    const dayNum = state.focus.getDate();
    dayTitle.append(`${wname}, ${state.focus.toLocaleString(undefined,{month:'long'})} ${dayNum}`);
    dayTitle.appendChild(ordinalSup(dayNum));

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
      const ent = day.find(e=> e.type==='activity' && e.title===row.title && e.start===row.start && e.end===row.end);
      const assignedIds = ent ? Array.from(ent.guestIds) : [];

      if(state.guests.length>0){
        if(assignedIds.length===state.guests.length){
          const ev=document.createElement('span');
          ev.className='tag-everyone'; ev.textContent='Everyone'; ev.title='Click to show guests';
          ev.onclick=()=>{ ev.remove(); renderGuestChips(tagWrap, assignedIds); };
          tagWrap.appendChild(ev);
        }else{
          renderGuestChips(tagWrap, assignedIds);
        }
      }

      left.appendChild(tagWrap);

      const add=document.createElement('button');
      add.className='add'; add.textContent='+'; add.title='Assign active guests';
      add.onclick=()=>{
        const actives = state.guests.filter(g=>g.active);
        if(actives.length===0){ alert('Toggle at least one guest pill before assigning.'); return; }
        const d = getOrCreateDay(dateK);
        let entry = d.find(e=> e.type==='activity' && e.title===row.title && e.start===row.start && e.end===row.end);
        if(!entry){ entry = {type:'activity', title:row.title, start:row.start, end:row.end, guestIds:new Set()}; d.push(entry); }
        actives.forEach(g=> entry.guestIds.add(g.id));
        renderActivities(); renderPreview();
      };

      div.appendChild(left); div.appendChild(add);
      activitiesEl.appendChild(div);
    });

    function renderGuestChips(container, ids){
      container.innerHTML='';
      ids.forEach(id=>{
        const g = state.guests.find(x=>x.id===id); if(!g) return;
        const c=document.createElement('span'); c.className='chip';
        c.style.borderColor=g.color; c.style.background='#fff';
        c.textContent = g.name.charAt(0).toUpperCase();
        const x=document.createElement('button'); x.className='x'; x.title=`Remove ${g.name}`; x.textContent='×';
        x.onclick=()=>{
          const dk = keyDate(state.focus);
          const day = state.schedule[dk]||[];
          day.forEach(e=>{ if(e.guestIds) e.guestIds.delete(g.id); });
          renderActivities(); renderPreview();
        };
        c.appendChild(x);
        container.appendChild(c);
      });
    }
  }
  function getOrCreateDay(dateK){ if(!state.schedule[dateK]) state.schedule[dateK]=[]; return state.schedule[dateK]; }

  // ---------- Preview ----------
  function renderPreview(){
    if(state.editing) return;

    email.innerHTML='';
    applyStyles(email, {
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontSize: '15px',
      lineHeight: '1.6',
      color: '#111827'
    });

    const primary = state.guests.find(g=>g.primary)?.name || 'Guest';
    const greeting = createEl('div',{style:{marginBottom:'18px'}},
      createEl('p',{text:`Hello ${primary},`, style:{margin:'0 0 8px', fontSize:'16px'}}),
      createEl('p',{text:'Current Itinerary:', style:{margin:'0', fontSize:'16px', fontWeight:'600', textDecoration:'underline'}})
    );
    email.appendChild(greeting);

    const buildDayHeading = (date)=>{
      const heading = createEl('div',{style:{fontSize:'18px', fontWeight:'700', margin:'0 0 10px'}});
      heading.append(`${weekdayName(date)}, ${date.toLocaleString(undefined,{month:'long'})} ${date.getDate()}`);
      heading.appendChild(ordinalSup(date.getDate()));
      return heading;
    };

    const lineEntry = ()=> createEl('div',{style:{margin:'0 0 8px', fontSize:'15px'}});

    const infoEntry = (timeLabel, label, subtitle)=>{
      const row = lineEntry();
      row.appendChild(createEl('strong',{text:timeLabel, style:{fontSize:'15px', fontWeight:'700'}}));
      if(label){
        row.append(' ');
        row.append(label);
      }
      if(subtitle){
        row.append(' | ');
        row.append(subtitle);
      }
      return row;
    };

    const activityEntry = (it, names, everyone)=>{
      const row = lineEntry();
      const label = it.end ? `${fmt12(it.start)} - ${fmt12(it.end)}` : fmt12(it.start);
      row.appendChild(createEl('strong',{text:label, style:{fontSize:'15px', fontWeight:'700'}}));
      row.append(' | ');
      row.append(it.title);
      if(!everyone && names.length){
        row.append(' | ');
        row.append(names.join(' | '));
      }
      return row;
    };

    const keys = new Set(Object.keys(state.schedule));
    if(state.arrival) keys.add(keyDate(state.arrival));
    if(state.departure) keys.add(keyDate(state.departure));
    const sorted = Array.from(keys).sort();

    if(sorted.length===0){
      const fallback = createEl('div',{},
        buildDayHeading(state.focus),
        createEl('p',{text:'Assign an activity with + to start building the itinerary.', style:{margin:'4px 0 0', color:'#4b5563', fontStyle:'italic'}})
      );
      email.appendChild(fallback);
      return;
    }

    sorted.forEach(k=>{
      const [y,m,d] = k.split('-').map(Number);
      const date = new Date(y, m-1, d);
      const daySection = createEl('section',{style:{margin:'0 0 20px'}});
      daySection.appendChild(buildDayHeading(date));

      const entriesWrap = createEl('div',{style:{display:'flex', flexDirection:'column'}});
      const isArrival = state.arrival && keyDate(state.arrival)===k;
      const isDeparture = state.departure && keyDate(state.departure)===k;

      if(isDeparture){
        entriesWrap.appendChild(infoEntry('11:00am','Check-Out','Welcome to stay on property until 1:00pm'));
      }

      if(isArrival){
        entriesWrap.appendChild(infoEntry('4:00pm','Guaranteed Check-In','Welcome to arrive as early as 12:00pm'));
      }

      const items = (state.schedule[k]||[]).slice().sort((a,b)=> a.start.localeCompare(b.start));
      items.forEach(it=>{
        const rawIds = Array.from(it.guestIds||[]);
        const names = rawIds.map(id=> state.guests.find(g=>g.id===id)?.name).filter(Boolean);
        if(names.length===0) return;
        const everyone = rawIds.length===state.guests.length;
        entriesWrap.appendChild(activityEntry(it, names, everyone));
      });

      daySection.appendChild(entriesWrap);
      email.appendChild(daySection);
    });
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
    const html=email.innerHTML;
    const text=email.textContent;
    try{
      if(navigator.clipboard && typeof navigator.clipboard.write === 'function' && typeof ClipboardItem !== 'undefined'){
        const item = new ClipboardItem({
          'text/html': new Blob([html], {type:'text/html'}),
          'text/plain': new Blob([text], {type:'text/plain'})
        });
        await navigator.clipboard.write([item]);
      }else if(navigator.clipboard && typeof navigator.clipboard.writeText === 'function'){
        await navigator.clipboard.writeText(text);
      }else{
        throw new Error('Clipboard API unavailable');
      }
    }
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
  function renderAll(){ renderCalendar(); renderGuests(); renderActivities(); renderPreview(); }
})();
