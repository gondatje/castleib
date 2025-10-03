// Minimal, Codex-ready Wave-1 core (calendar, guests, assign, arrival/departure, preview)
(function(){
  // ---------- Utils ----------
  const pad = n => String(n).padStart(2,'0');
  const zero = d => { const x=new Date(d); x.setHours(0,0,0,0); return x; };
  const monthName = (y,m) => new Date(y,m,1).toLocaleString(undefined,{month:'long'});
  const weekdayName = d => d.toLocaleDateString(undefined,{weekday:'long'});
  const ordinalSuffix = n => { const s=['th','st','nd','rd'],v=n%100; return s[(v-20)%10]||s[v]||s[0]; };
  const ordinal = n => `${n}${ordinalSuffix(n)}`;
  const ordinalHtml = n => `${n}<sup>${ordinalSuffix(n)}</sup>`;
  const escapeHtml = str => String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
  const fmt12 = hm => { let [h,m]=hm.split(':').map(Number); const am=h<12; h=((h+11)%12)+1; return `${h}:${pad(m)}${am?'am':'pm'}`; };
  const parse24Time = hm => { const [h,m] = hm.split(':').map(Number); return { hour: h, minute: m }; };
  const to24Time = ({ hour, minute, meridiem }) => {
    let h = Number(hour) || 0;
    const m = Number(minute) || 0;
    const normalizedMeridiem = (meridiem || '').toUpperCase() === 'PM' ? 'PM' : 'AM';
    if(normalizedMeridiem === 'AM'){
      if(h === 12) h = 0;
    }else{
      if(h < 12) h += 12;
      if(h === 24) h = 12; // guard against 12 PM interpreted as 24
    }
    return `${pad(h)}:${pad(m)}`;
  };
  const from24Time = hm => {
    const { hour, minute } = parse24Time(hm || '00:00');
    const meridiem = hour >= 12 ? 'PM' : 'AM';
    let displayHour = hour % 12;
    if(displayHour === 0) displayHour = 12;
    return { hour: displayHour, minute, meridiem };
  };
  const addMinutesToTime = (hm, duration) => {
    const { hour, minute } = parse24Time(hm || '00:00');
    const total = hour * 60 + minute + duration;
    const normalized = ((total % (24*60)) + (24*60)) % (24*60);
    const nextHour = Math.floor(normalized / 60);
    const nextMinute = normalized % 60;
    return `${pad(nextHour)}:${pad(nextMinute)}`;
  };
  const formatDurationLabel = minutes => `${minutes}-Minute`;
  const keyDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

  // Shared assignment chip helpers (injected via assignment-chip-logic.js). Provide fallbacks so
  // the UI continues to render individual chips if the helper fails to load in a dev sandbox.
  const fallbackAssignmentChipMode = {
    NONE: 'none',
    INDIVIDUAL: 'individual',
    GROUP_BOTH: 'group-both',
    GROUP_EVERYONE: 'group-everyone'
  };

  const assignmentChipLogic = window.AssignmentChipLogic || {};
  const AssignmentChipMode = assignmentChipLogic.AssignmentChipMode || fallbackAssignmentChipMode;
  const getAssignmentChipRenderPlan = assignmentChipLogic.getAssignmentChipRenderPlan || (({ assignedGuests }) => ({
    type: fallbackAssignmentChipMode.INDIVIDUAL,
    guests: (assignedGuests || []).filter(Boolean)
  }));
  const attachGroupPillInteractions = assignmentChipLogic.attachGroupPillInteractions || (() => ({ open: () => {}, close: () => {} }));

  const attachRowPressInteractions = (window.CHSActivitiesInteractions && typeof window.CHSActivitiesInteractions.attachRowPressInteractions === 'function')
    ? window.CHSActivitiesInteractions.attachRowPressInteractions
    : (element, { onActivate }) => {
        const handler = (event) => {
          if(event && event.target && event.target.closest && event.target.closest('[data-press-exempt="true"]')){
            return;
          }
          onActivate(event);
        };
        element.addEventListener('click', handler);
        return {
          dispose(){ element.removeEventListener('click', handler); }
        };
      };

  const dinnerIconSvg = `<svg viewBox="-96 0 512 512" aria-hidden="true" focusable="false" class="dinner-icon"><path fill="currentColor" d="M16,0c-8.837,0 -16,7.163 -16,16l0,187.643c0,7.328 0.667,13.595 2,18.802c1.333,5.207 2.917,9.305 4.75,12.294c1.833,2.989 4.5,5.641 8,7.955c3.5,2.314 6.583,3.953 9.25,4.917c2.667,0.965 6.542,2.266 11.625,3.905c2.399,0.774 5.771,1.515 8.997,2.224c1.163,0.256 2.306,0.507 3.378,0.754l0,225.506c0,17.673 14.327,32 32,32c17.673,0 32,-14.327 32,-32l0,-225.506c1.072,-0.247 2.215,-0.499 3.377,-0.754c3.227,-0.709 6.599,-1.45 8.998,-2.224c5.083,-1.639 8.958,-2.94 11.625,-3.905c2.667,-0.964 5.75,-2.603 9.25,-4.917c3.5,-2.314 6.167,-4.966 8,-7.955c1.833,-2.989 3.417,-7.087 4.75,-12.294c1.333,-5.207 2,-11.474 2,-18.802l0,-187.643c0,-8.837 -7.163,-16 -16,-16c-8.837,0 -16,7.163 -16,16l0,128c0,8.837 -7.163,16 -16,16c-8.837,0 -16,-7.163 -16,-16l0,-128c0,-8.837 -7.163,-16 -16,-16c-8.837,0 -16,7.163 -16,16l0,128c0,8.837 -7.163,16 -16,16c-8.837,0 -16,-7.163 -16,-16l0,-128c0,-8.837 -7.163,-16 -16,-16Zm304,18.286l0,267.143c0,0.458 -0.007,0.913 -0.022,1.364c0.015,0.4 0.022,0.803 0.022,1.207l0,192c0,17.673 -14.327,32 -32,32c-17.673,0 -32,-14.327 -32,-32l0,-160l-69.266,0c-2.41,0 -4.449,-0.952 -6.118,-2.857c-3.523,-3.619 -3.377,-8.286 0.887,-32.286c0.741,-4.762 2.178,-14.428 4.31,-29c2.133,-14.571 4.126,-28.19 5.98,-40.857c1.854,-12.667 4.449,-28.048 7.787,-46.143c3.337,-18.095 6.767,-34.428 10.29,-49c3.522,-14.571 7.926,-29.619 13.21,-45.143c5.284,-15.523 10.8,-28.476 16.547,-38.857c5.748,-10.381 12.515,-18.952 20.302,-25.714c7.787,-6.762 15.945,-10.143 24.473,-10.143l17.799,0c4.821,0 8.992,1.81 12.515,5.429c3.523,3.619 5.284,7.904 5.284,12.857Z"></path></svg>`;
  const spaIconSvg = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" class="spa-icon"><path fill="currentColor" d="M12 2c-.4 0-.78.2-1 .53C9.5 4.63 6 10.22 6 13.5 6 17.64 8.86 20 12 20s6-2.36 6-6.5c0-3.28-3.5-8.87-5-10.97A1.2 1.2 0 0 0 12 2Zm0 16c-2.37 0-4-1.4-4-4.5 0-1.58 1.57-4.68 4-8.08 2.43 3.4 4 6.5 4 8.08 0 3.1-1.63 4.5-4 4.5Zm-5.5 1a.75.75 0 0 0 0 1.5h11a.75.75 0 0 0 0-1.5Z"/></svg>';
  const pencilSvg = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.5 16.75 3 21l4.25-1.5L19.5 7.25 16.75 4.5 4.5 16.75Zm12.5-12.5 2.75 2.75 1-1a1.88 1.88 0 0 0 0-2.62l-.88-.88a1.88 1.88 0 0 0-2.62 0l-1 1Z" fill="currentColor"/></svg>';
  const trashSvg = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><g fill="currentColor"><path d="M0.982,5.073 L2.007,15.339 C2.007,15.705 2.314,16 2.691,16 L10.271,16 C10.648,16 10.955,15.705 10.955,15.339 L11.98,5.073 L0.982,5.073 L0.982,5.073 Z M7.033,14.068 L5.961,14.068 L5.961,6.989 L7.033,6.989 L7.033,14.068 L7.033,14.068 Z M9.033,14.068 L7.961,14.068 L8.961,6.989 L10.033,6.989 L9.033,14.068 L9.033,14.068 Z M5.033,14.068 L3.961,14.068 L2.961,6.989 L4.033,6.989 L5.033,14.068 L5.033,14.068 Z"/><path d="M12.075,2.105 L8.937,2.105 L8.937,0.709 C8.937,0.317 8.481,0 8.081,0 L4.986,0 C4.586,0 4.031,0.225 4.031,0.615 L4.031,2.011 L0.886,2.105 C0.485,2.105 0.159,2.421 0.159,2.813 L0.159,3.968 L12.8,3.968 L12.8,2.813 C12.801,2.422 12.477,2.105 12.075,2.105 L12.075,2.105 Z M4.947,1.44 C4.947,1.128 5.298,0.875 5.73,0.875 L7.294,0.875 C7.726,0.875 8.076,1.129 8.076,1.44 L8.076,2.105 L4.946,2.105 L4.946,1.44 L4.947,1.44 Z"/></g></svg>`;

  const dinnerMinutes = [0,15,30,45];
  const dinnerHours = [5,6,7,8];

  const minuteRules = {
    5: new Set([0,15]),
    6: new Set([45]),
    7: new Set(),
    8: new Set([15,30,45])
  };

  const dinnerTitle = 'Dinner at Harvest';
  const defaultDinnerTime = '19:00';

  const SPA_THERAPIST_OPTIONS = [
    { id: 'no-preference', label: 'No Preference' },
    { id: 'female', label: 'Female Therapist' },
    { id: 'male', label: 'Male Therapist' }
  ];

  const SPA_LOCATION_OPTIONS = [
    { id: 'same-cabana', label: 'Same Cabana' },
    { id: 'separate-cabanas', label: 'Separate Cabanas' },
    { id: 'in-room', label: 'In-Room' }
  ];

  const defaultSpaStartTime = '14:00';
  const generateSpaEntryId = () => (crypto.randomUUID ? crypto.randomUUID() : `spa_${Date.now()}_${Math.random().toString(16).slice(2)}`);

  function buildSpaCatalog(dataset){
    const services = Array.isArray(dataset?.services) ? dataset.services : [];
    const byCategory = new Map();
    const byName = new Map();
    services.forEach(service => {
      const entry = {
        name: service.name,
        category: service.category,
        subcategory: service.subcategory,
        durations: Array.isArray(service.durations) ? service.durations.slice() : Array.isArray(service.durations_minutes) ? service.durations_minutes.slice() : [],
        supportsInRoom: service.supportsInRoom ?? service.supports_in_room ?? null
      };
      byName.set(entry.name, entry);
      if(!byCategory.has(entry.category)){
        byCategory.set(entry.category, []);
      }
      byCategory.get(entry.category).push(entry);
    });
    const categories = Array.from(byCategory.entries()).map(([category, list]) => ({
      category,
      services: list.slice().sort((a,b)=> a.name.localeCompare(b.name))
    })).sort((a,b)=> a.category.localeCompare(b.category));
    return { categories, byName };
  }

  const TimePickerKit = window.TimePickerKit || {};
  const { createTimePicker } = TimePickerKit;



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
    previewFrozen: false,
    spaCatalog: null
  };

  // ---------- DOM ----------
  const $ = sel => document.querySelector(sel);
  const calMonth=$('#calMonth'), calYear=$('#calYear'), calGrid=$('#calGrid'), dow=$('#dow');
  const dayTitle=$('#dayTitle'), activitiesEl=$('#activities'), email=$('#email');
  const seasonIndicator=$('#seasonIndicator'), seasonValue=$('#seasonValue');
  const guestsEl=$('#guests'), guestName=$('#guestName');
  const toggleAllBtn=$('#toggleAll');
  const toggleEditBtn=$('#toggleEdit');
  const copyBtn=$('#copy');
  const addDinnerBtn=$('#addDinner');
  const addSpaBtn=$('#addSpa');
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

  // Activities + spa data now flow from the global CHSDataLayer helpers defined in data/data-layer.js.
  // This replaces the old fetch('data/*.json') wiring while keeping the UI render path intact.
  if(typeof window.CHSDataLayer === 'undefined'){
    const err = new Error('CHSDataLayer missing. Ensure data/data-layer.js is loaded.');
    console.error(err);
    state.data = null;
    state.dataStatus = 'error';
    // Defer the render until after script evaluation so const bindings below are initialized.
    setTimeout(renderAll, 0);
    email.textContent = 'Data layer missing. Load data/data-layer.js before script.js.';
  }else{
    try{
      const activitiesDataset = window.CHSDataLayer.getActivitiesDataset();
      const spaDataset = window.CHSDataLayer.getSpaDataset();
      state.data = { activities: activitiesDataset, spa: spaDataset };
      state.spaCatalog = buildSpaCatalog(spaDataset);
      state.dataStatus = 'ready';
      ensureFocusInSeason();
      // Wait for the rest of this module to register helpers (e.g. toggleIcons) before rendering.
      setTimeout(renderAll, 0);
    }catch(e){
      console.error(e);
      state.data = null;
      state.dataStatus = 'error';
      // Keep the render async so we don't hit TDZ checks while the script continues parsing.
      setTimeout(renderAll, 0);
      email.textContent = 'Data layer failed to initialize. See console for details.';
    }
  }

  // ---------- Season + weekday ----------
  function activeSeason(date){
    const ds = keyDate(date);
    const seasons = state.data?.activities?.seasons || [];
    for(const s of seasons){ if(ds>=s.start && ds<=s.end) return s; }
    return null;
  }
  const weekdayKey = d => ['sun','mon','tue','wed','thu','fri','sat'][d.getDay()];
  const SEASON_DAY_KEYS = ['sun','mon','tue','wed','thu','fri','sat'];
  const SEASON_NAME_PATTERN = /(Spring|Summer|Fall|Winter)/i;
  const seasonLabelCache = new Map();

  function normalizeSeasonWord(word){
    if(!word) return word;
    const lower = word.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }

  function parseSeasonLabelFromString(value){
    if(!value) return null;
    const match = SEASON_NAME_PATTERN.exec(String(value));
    if(!match) return null;
    const seasonWord = normalizeSeasonWord(match[1]);
    const after = String(value).slice(match.index);
    const afterYear = after.match(/(\d{4})/);
    if(afterYear) return `${seasonWord} ${afterYear[1]}`;
    const before = String(value).slice(0, match.index);
    const beforeYear = before.match(/(\d{4})(?!.*\d{4})/);
    if(beforeYear) return `${seasonWord} ${beforeYear[1]}`;
    return null;
  }

  function resolveSeasonLabelForSeasonDay({ season, dayKey, activities }){
    if(!season || !window.CHSDataLayer) return null;
    if(seasonLabelCache.has(season.name)) return seasonLabelCache.get(season.name);

    const daySequence = [];
    if(dayKey && !daySequence.includes(dayKey)) daySequence.push(dayKey);
    SEASON_DAY_KEYS.forEach(key=>{ if(!daySequence.includes(key)) daySequence.push(key); });

    for(const key of daySequence){
      const rows = (key===dayKey && Array.isArray(activities))
        ? activities
        : window.CHSDataLayer.getActivitiesForSeasonDay(season.name, key);
      if(!rows || rows.length===0) continue;
      for(const row of rows){
        // Activity metadata already powers the Preview card. Reusing it keeps the
        // season pill anchored to the same selected-day source instead of
        // guessing from Date.now(). Preferred fields (if present) cascade from a
        // dedicated label to the PDF/source title before we bail.
        const meta = window.CHSDataLayer.getActivityMetadata({ season: season.name, day: key, title: row.title, start: row.start });
        if(!meta) continue;
        const explicitLabel = parseSeasonLabelFromString(meta.seasonLabel || meta.title || '');
        if(explicitLabel){
          seasonLabelCache.set(season.name, explicitLabel);
          return explicitLabel;
        }
        const fromSource = parseSeasonLabelFromString(meta.source || '');
        if(fromSource){
          seasonLabelCache.set(season.name, fromSource);
          return fromSource;
        }
      }
    }

    // As a final fallback, try to parse the broader season name (date range) in case
    // the dataset happens to include "Fall 2025" directly in the label.
    const fallback = parseSeasonLabelFromString(season.name);
    if(fallback){
      seasonLabelCache.set(season.name, fallback);
      return fallback;
    }

    return null;
  }

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
  const toggleIcons = {
    allOn: `<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="7" y="3.5" width="10" height="17" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" opacity="0.6"/><rect x="8.2" y="5" width="7.6" height="6" rx="1.4" fill="currentColor" opacity="0.18"/></svg>`,
    someOff: `<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="7" y="3.5" width="10" height="17" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" opacity="0.6"/><rect x="8.2" y="12.9" width="7.6" height="6" rx="1.4" fill="currentColor" opacity="0.18"/></svg>`
  };

  function addGuest(name){
    const trimmed = name.trim();
    if(!trimmed) return;
    const id = (crypto.randomUUID ? crypto.randomUUID() : `g_${Date.now()}_${Math.random().toString(16).slice(2)}`);
    const color = state.colors[state.guests.length % state.colors.length];
    const g = {id,name: trimmed, color, active:true, primary: state.guests.length===0};
    state.guests.push(g);
    guestName.value='';
    renderGuests(); renderActivities(); markPreviewDirty(); renderPreview();
  }
  function renderGuests(){
    syncDinnerGuests();
    syncSpaGuests();
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
  const tryAddGuestFromInput = ()=> addGuest(guestName.value);
  guestName.addEventListener('keydown',e=>{
    const key=(e.key||'').toLowerCase();
    if(key==='enter' || key==='numpadenter' || key==='return'){
      e.preventDefault();
      if(e.repeat) return;
      tryAddGuestFromInput();
    }
  });
  guestName.addEventListener('blur', tryAddGuestFromInput);
  if(toggleAllBtn){
    toggleAllBtn.addEventListener('click',()=>{
      const anyInactive = state.guests.some(g=>!g.active);
      state.guests.forEach(g=>g.active = anyInactive ? true : false);
      renderGuests();
    });
  }

  if(addDinnerBtn){
    addDinnerBtn.addEventListener('click',()=>{
      openDinnerPicker({ mode:'add', dateKey: keyDate(state.focus) });
    });
  }

  if(addSpaBtn){
    addSpaBtn.addEventListener('click',()=>{
      openSpaEditor({ mode:'add', dateKey: keyDate(state.focus) });
    });
  }

  renderAll();

  function updateToggleAllButton(){
    if(!toggleAllBtn) return;
    const total = state.guests.length;
    const allActive = total>0 && state.guests.every(g=>g.active);
    const anyInactive = state.guests.some(g=>!g.active);
    toggleAllBtn.disabled = total===0;
    toggleAllBtn.setAttribute('aria-pressed', total>0 && allActive ? 'true' : 'false');
    if(total===0){
      toggleAllBtn.innerHTML = toggleIcons.allOn;
      toggleAllBtn.setAttribute('aria-label','Toggle all guests');
      toggleAllBtn.title = 'Toggle all guests';
      return;
    }
    if(anyInactive){
      toggleAllBtn.innerHTML = toggleIcons.someOff;
      toggleAllBtn.setAttribute('aria-label','Turn all guests on');
      toggleAllBtn.title = 'Turn all guests on';
    }else{
      toggleAllBtn.innerHTML = toggleIcons.allOn;
      toggleAllBtn.setAttribute('aria-label','Turn all guests off');
      toggleAllBtn.title = 'Turn all guests off';
    }
  }

  function updateSeasonPill(label){
    if(!seasonIndicator || !seasonValue) return;
    if(!label){
      seasonValue.textContent='';
      seasonIndicator.hidden = true;
      delete seasonIndicator.dataset.visible;
      seasonIndicator.removeAttribute('aria-label');
      return;
    }
    seasonValue.textContent = label;
    seasonIndicator.setAttribute('aria-label', `Season: ${label}`);
    if(seasonIndicator.hidden){
      seasonIndicator.hidden = false;
      requestAnimationFrame(()=>{ seasonIndicator.dataset.visible='true'; });
    }else{
      seasonIndicator.dataset.visible='true';
    }
  }

  // ---------- Activities ----------
  function renderActivities(){
    const wname=weekdayName(state.focus);
    dayTitle.innerHTML = `${escapeHtml(wname)}, ${escapeHtml(state.focus.toLocaleString(undefined,{month:'long'}))} ${ordinalHtml(state.focus.getDate())}`;

    updateAddDinnerButton();
    updateAddSpaButton();

    const weekKey = weekdayKey(state.focus);
    let season = null;
    let baseList = [];
    let seasonLabel = null;

    if(state.dataStatus==='ready'){
      season = activeSeason(state.focus);
      if(season){
        baseList = window.CHSDataLayer.getActivitiesForSeasonDay(season.name, weekKey).slice().sort((a,b)=> a.start.localeCompare(b.start));
        seasonLabel = resolveSeasonLabelForSeasonDay({ season, dayKey: weekKey, activities: baseList });
      }
    }

    updateSeasonPill(seasonLabel);

    if(state.dataStatus==='loading'){
      renderStatusMessage('Loading activities…');
      return;
    }

    if(state.dataStatus==='error'){
      renderStatusMessage('Activities unavailable — data failed to load.');
      return;
    }

    if(!season){
      renderStatusMessage(buildOutOfSeasonMessage());
      return;
    }
    const dateK = keyDate(state.focus);
    const dinnerEntry = getDinnerEntry(dateK);
    const spaEntries = getSpaEntries(dateK);
    const combined = baseList.map(row=>({kind:'activity', data: row}));
    if(dinnerEntry){ combined.push({kind:'dinner', data: dinnerEntry}); }
    // Inject saved SPA blocks alongside activities/dinner so the list remains time-ordered.
    spaEntries.forEach(entry => combined.push({ kind:'spa', data: entry }));
    combined.sort((a,b)=>{
      const resolveStart = item => {
        if(item.kind==='activity') return item.data.start || '';
        return item.data.start || '';
      };
      const aStart = resolveStart(a);
      const bStart = resolveStart(b);
      return aStart.localeCompare(bStart);
    });

    activitiesEl.innerHTML='';
    combined.forEach(item=>{
      if(item.kind==='dinner'){
        renderDinner(item.data);
        return;
      }
      if(item.kind==='spa'){
        renderSpa(item.data);
        return;
      }
      const row = item.data;
      const div=document.createElement('div');
      div.className='activity-row';
      div.setAttribute('role','button');
      const disabled = !!row.disabled;
      if(disabled){
        div.dataset.disabled='true';
        div.setAttribute('aria-disabled','true');
        div.tabIndex = -1;
      }else{
        div.tabIndex = 0;
        div.removeAttribute('aria-disabled');
      }
      const ariaLabel = `Add activity: ${fmt12(row.start)} to ${fmt12(row.end)} ${row.title}`;
      div.setAttribute('aria-label', ariaLabel);

      const body=document.createElement('div');
      body.className='activity-row-body';

      const headline=document.createElement('div');
      headline.className='activity-row-headline';

      const time=document.createElement('span');
      time.className='activity-row-time';
      time.textContent = `${fmt12(row.start)} – ${fmt12(row.end)}`;
      headline.appendChild(time);

      const title=document.createElement('span');
      title.className='activity-row-title';
      title.textContent = row.title;
      headline.appendChild(title);

      body.appendChild(headline);

      const tagWrap=document.createElement('div'); tagWrap.className='tag-row';

      const dateK = keyDate(state.focus);
      const day = getOrCreateDay(dateK);
      const entry = day.find(e=> e.type==='activity' && e.title===row.title && e.start===row.start && e.end===row.end);
      const assignedIds = entry ? Array.from(entry.guestIds) : [];

      if(state.guests.length>0){
        renderAssignments(tagWrap, entry, assignedIds, dateK);
      }

      body.appendChild(tagWrap);

      const setPressedState = (pressed)=>{
        if(pressed){
          div.dataset.pressed='true';
        }else{
          delete div.dataset.pressed;
        }
      };

      const activate = ()=>{
        if(disabled){ return; }
        const actives = state.guests.filter(g=>g.active);
        if(actives.length===0){ alert('Toggle at least one guest pill before assigning.'); return; }
        const d = getOrCreateDay(dateK);
        let target = d.find(e=> e.type==='activity' && e.title===row.title && e.start===row.start && e.end===row.end);
        if(!target){ target = {type:'activity', title:row.title, start:row.start, end:row.end, guestIds:new Set()}; d.push(target); }
        actives.forEach(g=> target.guestIds.add(g.id));
        sortDayEntries(dateK);
        renderActivities(); markPreviewDirty(); renderPreview();
      };

      // Guard against accidental scroll taps via shared pointer controller.
      attachRowPressInteractions(div, {
        onActivate: activate,
        isDisabled: () => disabled,
        onPressChange: setPressedState
      });

      let keyboardPress = false;
      div.addEventListener('keydown', (event)=>{
        if(disabled) return;
        if(event.key===' ' || event.key==='Spacebar'){
          event.preventDefault();
          if(!keyboardPress){
            keyboardPress = true;
            setPressedState(true);
          }
        }else if(event.key==='Enter'){
          event.preventDefault();
          activate();
        }
      });

      div.addEventListener('keyup', (event)=>{
        if(!keyboardPress) return;
        if(event.key===' ' || event.key==='Spacebar'){
          event.preventDefault();
          keyboardPress = false;
          setPressedState(false);
          if(!disabled){ activate(); }
        }
      });

      div.addEventListener('blur', ()=>{
        keyboardPress = false;
        setPressedState(false);
      });

      div.appendChild(body);
      activitiesEl.appendChild(div);
    });

    function renderAssignments(container, entry, ids, dateK){
      container.innerHTML='';
      if(ids.length===0) return;

      const idSet = new Set(ids);
      const guestLookup = new Map(state.guests.map(g=>[g.id,g]));
      const orderedIds = state.guests.map(g=>g.id).filter(id=>idSet.has(id));
      const assignedGuests = orderedIds.map(id=>guestLookup.get(id)).filter(Boolean);

      if(assignedGuests.length===0){
        return;
      }

      const plan = getAssignmentChipRenderPlan({
        totalGuestsInStay: state.guests.length,
        assignedGuests
      });

      if(plan.type===AssignmentChipMode.NONE || plan.guests.length===0){
        return;
      }

      if(plan.type===AssignmentChipMode.GROUP_BOTH || plan.type===AssignmentChipMode.GROUP_EVERYONE){
        const pill=document.createElement('button');
        pill.type='button';
        pill.className='tag-everyone';
        pill.dataset.assignmentPill = plan.type;
        pill.setAttribute('aria-label', plan.pillAriaLabel || plan.pillLabel || 'Assigned guests');
        pill.setAttribute('aria-haspopup','true');
        pill.setAttribute('aria-expanded','false');
        pill.dataset.pressExempt='true';
        pill.addEventListener('pointerdown', e=> e.stopPropagation());

        const label=document.createElement('span');
        label.textContent=plan.pillLabel || '';
        pill.appendChild(label);

        const pop=document.createElement('div');
        pop.className='popover';
        pop.setAttribute('role','group');
        pop.setAttribute('aria-label','Guests assigned');
        plan.guests.forEach(guest=>{
          pop.appendChild(createChip(guest, entry, dateK));
        });
        pill.appendChild(pop);

        attachGroupPillInteractions(pill);

        container.appendChild(pill);
        return;
      }

      plan.guests.forEach(guest=>{
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
      x.dataset.pressExempt='true';
      x.addEventListener('pointerdown', e=> e.stopPropagation());
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
      msg.style.padding='16px';
      msg.style.background='var(--panel)';
      msg.style.border='1px solid var(--border)';
      msg.style.borderRadius='14px';
      msg.style.color='var(--muted)';
      msg.style.textAlign='center';
      msg.style.boxShadow='0 1px 2px rgba(12,18,32,.06)';
      activitiesEl.appendChild(msg);
    }

    function renderDinner(entry){
      const div=document.createElement('div');
      div.className='activity-row dinner-item';
      const body=document.createElement('div');
      body.className='activity-row-body';
      const headline=document.createElement('div');
      headline.className='activity-row-headline';
      const time=document.createElement('span');
      time.className='activity-row-time';
      time.textContent = fmt12(entry.start);
      const title=document.createElement('span');
      title.className='activity-row-title';
      title.textContent = entry.title;
      headline.appendChild(time);
      headline.appendChild(title);
      body.appendChild(headline);

      const tagWrap=document.createElement('div');
      tagWrap.className='tag-row';

      const chip=document.createElement('button');
      chip.type='button';
      chip.className='dinner-chip';
      chip.innerHTML = `<span class="chip-icon">${dinnerIconSvg}</span><span class="chip-pencil">${pencilSvg}</span><span class="sr-only">Edit dinner time</span>`;
      chip.setAttribute('aria-label','Edit dinner time');
      chip.title='Edit dinner time';
      chip.dataset.pressExempt='true';
      chip.addEventListener('pointerdown', e=> e.stopPropagation());
      chip.addEventListener('click',()=> openDinnerPicker({ mode:'edit', dateKey: dateK }));
      tagWrap.appendChild(chip);

      body.appendChild(tagWrap);
      div.appendChild(body);
      activitiesEl.appendChild(div);
    }

    function renderSpa(entry){
      const div=document.createElement('div');
      div.className='activity-row spa-item';
      const body=document.createElement('div');
      body.className='activity-row-body';

      const headline=document.createElement('div');
      headline.className='activity-row-headline';

      const time=document.createElement('span');
      time.className='activity-row-time';
      const startLabel = entry.start ? fmt12(entry.start) : '';
      const endLabel = entry.end ? fmt12(entry.end) : '';
      time.textContent = startLabel && endLabel ? `${startLabel} – ${endLabel}` : startLabel || endLabel || '';
      headline.appendChild(time);

      const title=document.createElement('span');
      title.className='activity-row-title';
      const summary = summarizeSpaTitle(entry);
      title.textContent = summary;
      headline.appendChild(title);

      body.appendChild(headline);

      const tagWrap=document.createElement('div');
      tagWrap.className='tag-row';

      const assignmentGuests = Array.from(entry.guestIds || []).map(id => state.guests.find(g=>g.id===id)).filter(Boolean);
      const plan = getAssignmentChipRenderPlan({ totalGuestsInStay: state.guests.length, assignedGuests: assignmentGuests });
      if(plan.type === AssignmentChipMode.GROUP_BOTH || plan.type === AssignmentChipMode.GROUP_EVERYONE){
        const pill = document.createElement('button');
        pill.type='button';
        pill.className='tag-everyone';
        pill.dataset.assignmentPill = plan.type;
        pill.setAttribute('aria-haspopup','true');
        pill.setAttribute('aria-expanded','false');
        pill.setAttribute('aria-label', plan.pillAriaLabel || plan.pillLabel || 'Assigned guests');
        const label=document.createElement('span');
        label.textContent = plan.pillLabel || '';
        pill.appendChild(label);
        const pop=document.createElement('div');
        pop.className='popover';
        pop.setAttribute('role','group');
        pop.setAttribute('aria-label','Guests assigned');
        plan.guests.forEach(guest => {
          const chip=document.createElement('span');
          chip.className='chip';
          chip.style.borderColor = guest.color;
          chip.style.color = guest.color;
          chip.title = guest.name;
          const initial=document.createElement('span');
          initial.className='initial';
          initial.textContent = guest.name.charAt(0).toUpperCase();
          chip.appendChild(initial);
          const x=document.createElement('span');
          x.className='x';
          x.textContent='×';
          x.setAttribute('aria-hidden','true');
          chip.appendChild(x);
          pop.appendChild(chip);
        });
        pill.appendChild(pop);
        attachGroupPillInteractions(pill);
        tagWrap.appendChild(pill);
      }else if(plan.type === AssignmentChipMode.INDIVIDUAL){
        plan.guests.forEach(guest => {
          const chip=document.createElement('span');
          chip.className='chip';
          chip.style.borderColor = guest.color;
          chip.style.color = guest.color;
          chip.title = guest.name;
          const initial=document.createElement('span');
          initial.className='initial';
          initial.textContent = guest.name.charAt(0).toUpperCase();
          chip.appendChild(initial);
          const x=document.createElement('span');
          x.className='x';
          x.textContent='×';
          x.setAttribute('aria-hidden','true');
          chip.appendChild(x);
          tagWrap.appendChild(chip);
        });
      }

      const chip=document.createElement('button');
      chip.type='button';
      chip.className='spa-chip dinner-chip';
      // Reuse the dinner chip visuals to ensure the SPA edit affordance matches hover/focus
      // behaviour and sizing expectations from the existing activities list.
      chip.innerHTML = `<span class="chip-icon">${spaIconSvg}</span><span class="chip-pencil">${pencilSvg}</span><span class="sr-only">Edit spa appointment</span>`;
      chip.setAttribute('aria-label','Edit spa appointment');
      chip.title='Edit spa appointment';
      chip.dataset.pressExempt='true';
      chip.addEventListener('pointerdown', e=> e.stopPropagation());
      chip.addEventListener('click',()=> openSpaEditor({ mode:'edit', dateKey: dateK, entryId: entry.id }));
      tagWrap.appendChild(chip);

      body.appendChild(tagWrap);
      div.appendChild(body);
      activitiesEl.appendChild(div);
    }

    function summarizeSpaTitle(entry){
      if(!entry || !Array.isArray(entry.appointments) || entry.appointments.length===0){
        return 'Spa Appointment';
      }
      const first = entry.appointments[0];
      const sameService = entry.appointments.every(app => app.serviceName === first.serviceName);
      const sameDuration = entry.appointments.every(app => app.durationMinutes === first.durationMinutes);
      if(sameService && sameDuration){
        return `${formatDurationLabel(first.durationMinutes)} ${first.serviceName}`;
      }
      return 'Spa Appointments';
    }
  }

  let dinnerDialog = null;
  let spaDialog = null;

  function updateAddDinnerButton(){
    if(!addDinnerBtn) return;
    const enabled = state.dataStatus==='ready';
    addDinnerBtn.disabled = !enabled;
    const entry = enabled ? getDinnerEntry(keyDate(state.focus)) : null;
    addDinnerBtn.setAttribute('aria-pressed', entry ? 'true' : 'false');
  }

  function updateAddSpaButton(){
    if(!addSpaBtn) return;
    const enabled = state.dataStatus==='ready' && state.spaCatalog && state.spaCatalog.categories.length>0;
    addSpaBtn.disabled = !enabled;
    const hasEntry = enabled ? getSpaEntries(keyDate(state.focus)).length>0 : false;
    addSpaBtn.setAttribute('aria-pressed', hasEntry ? 'true' : 'false');
  }

  function closeDinnerPicker({returnFocus=false}={}){
    if(!dinnerDialog) return;
    const { overlay, previousFocus, cleanup } = dinnerDialog;
    overlay.remove();
    if(typeof cleanup === 'function'){
      cleanup();
    }
    if(returnFocus && previousFocus && typeof previousFocus.focus==='function'){
      previousFocus.focus();
    }
    dinnerDialog = null;
    document.body.classList.remove('dinner-lock');
  }

  function openDinnerPicker({mode='add', dateKey}={}){
    if(state.dataStatus!=='ready') return;
    const targetDateKey = dateKey || keyDate(state.focus);
    const existing = getDinnerEntry(targetDateKey);
    const initialTime = existing?.start || defaultDinnerTime;
    const [hour24Str, minuteStr] = initialTime.split(':');
    const hour24 = Number(hour24Str);
    const minuteNum = Number(minuteStr);
    const hour12 = hour24>12 ? hour24-12 : hour24;
    const initialHour = dinnerHours.includes(hour12) ? hour12 : 7;
    const initialMinute = dinnerMinutes.includes(minuteNum) ? minuteNum : 0;

    closeDinnerPicker();

    const overlay=document.createElement('div');
    overlay.className='dinner-overlay';

    const dialog=document.createElement('div');
    dialog.className='dinner-dialog';
    dialog.setAttribute('role','dialog');
    dialog.setAttribute('aria-modal','true');

    const header=document.createElement('div');
    header.className='dinner-header';
    const title=document.createElement('div');
    title.className='dinner-title';
    title.textContent='Dinner time';
    title.id='dinner-dialog-title';
    dialog.setAttribute('aria-labelledby','dinner-dialog-title');
    header.appendChild(title);

    const closeBtn=document.createElement('button');
    closeBtn.type='button';
    closeBtn.className='dinner-close';
    closeBtn.setAttribute('aria-label','Cancel dinner selection');
    closeBtn.textContent='×';
    closeBtn.addEventListener('click',()=> closeDinnerPicker({returnFocus:true}));
    header.appendChild(closeBtn);

    dialog.appendChild(header);

    const body=document.createElement('div');
    body.className='dinner-body';

    const timePicker = (typeof createTimePicker === 'function') ? createTimePicker({
      hourRange: [dinnerHours[0], dinnerHours[dinnerHours.length-1]],
      minuteStep: 15,
      showAmPm: false,
      fixedMeridiem: 'PM',
      staticMeridiemLabel: 'pm',
      defaultValue: { hour: initialHour, minute: initialMinute, meridiem: 'PM' },
      isMinuteDisabled: ({hour, minute}) => {
        const disabledSet = minuteRules[hour] || new Set();
        return disabledSet.has(minute);
      },
      ariaLabels: {
        hours: 'Dinner hour',
        minutes: 'Dinner minutes'
      }
    }) : null;

    if(!timePicker){
      const fallback = document.createElement('div');
      fallback.className = 'time-picker-fallback';
      fallback.textContent = 'Time picker failed to load.';
      body.appendChild(fallback);
    }else{
      body.appendChild(timePicker.element);
    }

    dialog.appendChild(body);

    const actions=document.createElement('div');
    actions.className='dinner-actions';

    const confirmBtn=document.createElement('button');
    confirmBtn.type='button';
    confirmBtn.className='dinner-confirm';
    const confirmLabel = (mode==='edit' || existing) ? 'Update dinner time' : 'Add dinner time';
    confirmBtn.innerHTML=`<span aria-hidden="true">+</span><span class="sr-only">${confirmLabel}</span>`;
    confirmBtn.setAttribute('aria-label', confirmLabel);
    actions.appendChild(confirmBtn);

    let removeBtn=null;
    if(mode==='edit' && existing){
      removeBtn=document.createElement('button');
      removeBtn.type='button';
      removeBtn.className='dinner-remove';
      removeBtn.innerHTML=`${trashSvg}<span class="sr-only">Remove dinner</span>`;
      actions.appendChild(removeBtn);
    }

    dialog.appendChild(actions);

    const previousFocus = document.activeElement;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    document.body.classList.add('dinner-lock');

    function confirmSelection(){
      if(!timePicker) return;
      const { hour, minute } = timePicker.getValue();
      const disabledSet = minuteRules[hour] || new Set();
      if(disabledSet.has(minute)) return;
      const hour24Value = hour + 12;
      const time = `${pad(hour24Value)}:${pad(minute)}`;
      upsertDinner(targetDateKey, time);
      markPreviewDirty();
      renderActivities();
      renderPreview();
      closeDinnerPicker({returnFocus:true});
    }

    confirmBtn.addEventListener('click', confirmSelection);

    if(removeBtn){
      removeBtn.addEventListener('click',()=>{
        removeDinner(targetDateKey);
        markPreviewDirty();
        renderActivities();
        renderPreview();
        closeDinnerPicker({returnFocus:true});
      });
    }

    overlay.addEventListener('click',e=>{
      if(e.target===overlay){
        closeDinnerPicker({returnFocus:true});
      }
    });

    const handleKeyDown = e => {
      if(e.key==='Escape'){
        e.preventDefault();
        closeDinnerPicker({returnFocus:true});
        return;
      }
      if((e.key==='Enter' || e.key==='Return') && (!e.target || e.target.tagName!=='BUTTON')){
        e.preventDefault();
        confirmSelection();
        return;
      }
      if(e.key==='Tab'){
        const focusable = Array.from(dialog.querySelectorAll('button,[tabindex]:not([tabindex="-1"])')).filter(el=> !el.disabled && el.offsetParent!==null);
        if(focusable.length===0) return;
        const first = focusable[0];
        const last = focusable[focusable.length-1];
        if(e.shiftKey){
          if(document.activeElement===first){
            e.preventDefault();
            last.focus();
          }
        }else{
          if(document.activeElement===last){
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);

    dinnerDialog = {
      overlay,
      dialog,
      previousFocus,
      cleanup(){
        timePicker?.dispose?.();
      }
    };

    setTimeout(()=>{
      timePicker?.focus?.();
    },0);
  }

  function closeSpaEditor({returnFocus=false}={}){
    if(!spaDialog) return;
    const { overlay, previousFocus, cleanup } = spaDialog;
    overlay.remove();
    if(typeof cleanup === 'function') cleanup();
    if(returnFocus && previousFocus && typeof previousFocus.focus==='function'){
      previousFocus.focus();
    }
    spaDialog = null;
    document.body.classList.remove('spa-lock');
  }

  function openSpaEditor({mode='add', dateKey, entryId}={}){
    if(state.dataStatus!=='ready' || !state.spaCatalog || state.spaCatalog.categories.length===0) return;
    closeSpaEditor();
    const targetDateKey = dateKey || keyDate(state.focus);
    const existing = entryId ? getSpaEntry(targetDateKey, entryId) : null;
    const catalog = state.spaCatalog;
    const findService = name => catalog.byName.get(name) || (catalog.categories[0]?.services[0] || null);

    const orderedGuests = () => state.guests.map(g=>g.id);
    let assignedIds = existing ? Array.from(existing.guestIds || []) : state.guests.filter(g=>g.active).map(g=>g.id);
    if(assignedIds.length===0){
      assignedIds = orderedGuests();
    }
    const assignedSet = new Set(assignedIds);

    const defaultService = (()=>{
      if(existing && existing.appointments?.length){
        const match = findService(existing.appointments[0].serviceName);
        if(match) return match;
      }
      return catalog.categories[0]?.services[0] || null;
    })();

    const createSelection = (service, overrides={}) => {
      const svc = service || defaultService;
      const baseDuration = Array.isArray(svc?.durations) && svc.durations.length ? svc.durations[0] : 60;
      const duration = overrides.durationMinutes ?? baseDuration;
      const start = overrides.start || defaultSpaStartTime;
      return {
        guestId: overrides.guestId || '',
        serviceName: svc?.name || overrides.serviceName || '',
        serviceCategory: svc?.category || overrides.serviceCategory || '',
        durationMinutes: duration,
        start,
        end: addMinutesToTime(start, duration),
        therapist: overrides.therapist || 'no-preference',
        location: overrides.location || 'same-cabana',
        supportsInRoom: svc?.supportsInRoom !== false
      };
    };

    const TEMPLATE_ID = '__template__';
    const selections = new Map();
    assignedIds.forEach(id => {
      const existingSelection = existing?.appointments?.find(app => app.guestId===id);
      if(existingSelection){
        const svc = findService(existingSelection.serviceName);
        const selection = createSelection(svc, {
          guestId: id,
          serviceName: existingSelection.serviceName,
          serviceCategory: existingSelection.serviceCategory,
          durationMinutes: existingSelection.durationMinutes,
          start: existingSelection.start,
          therapist: existingSelection.therapist,
          location: existingSelection.location,
          supportsInRoom: svc?.supportsInRoom !== false
        });
        selection.end = existingSelection.end || addMinutesToTime(selection.start, selection.durationMinutes);
        if(selection.location==='in-room' && selection.supportsInRoom===false){
          selection.location = 'same-cabana';
        }
        selections.set(id, selection);
      }else{
        const selection = createSelection(defaultService, { guestId: id });
        selections.set(id, selection);
      }
    });

    if(assignedIds.length>0){
      const baseId = assignedIds[0];
      const baseSelection = selections.get(baseId) || createSelection(defaultService, { guestId: baseId });
      selections.set(TEMPLATE_ID, { ...baseSelection, guestId: TEMPLATE_ID });
    }else{
      // The template slot retains the in-progress configuration so opening without
      // guests (or temporarily removing all assignees) keeps the flow populated.
      selections.set(TEMPLATE_ID, createSelection(defaultService, { guestId: TEMPLATE_ID }));
    }

    const identical = (()=>{
      const values = Array.from(selections.values());
      if(values.length<=2){
        // When only the template exists (no guests yet) treat the flow as linked so
        // the duration/time controls stay in sync once guests are added.
        return true;
      }
      const comparable = values.filter(sel => sel.guestId!==TEMPLATE_ID);
      if(comparable.length<=1) return true;
      const [first] = comparable;
      return comparable.every(sel => sel.serviceName===first.serviceName && sel.durationMinutes===first.durationMinutes && sel.start===first.start && sel.end===first.end && sel.therapist===first.therapist && sel.location===first.location);
    })();

    let linkGuests = identical || !existing;
    let activeGuestId = assignedIds[0] || null;

    const orderedAssigned = () => state.guests.map(g=>g.id).filter(id => assignedSet.has(id));

    const ensureTemplateSelection = () => {
      if(!selections.has(TEMPLATE_ID)){
        selections.set(TEMPLATE_ID, createSelection(defaultService, { guestId: TEMPLATE_ID }));
      }
      return selections.get(TEMPLATE_ID);
    };

    const syncTemplateFromSourceId = sourceId => {
      const source = sourceId ? selections.get(sourceId) : null;
      const base = source ? { ...source, guestId: TEMPLATE_ID } : createSelection(defaultService, { guestId: TEMPLATE_ID });
      selections.set(TEMPLATE_ID, base);
      return base;
    };

    const resolveEditableTargets = () => {
      const assigned = orderedAssigned();
      if(assigned.length===0){
        ensureTemplateSelection();
        return [TEMPLATE_ID];
      }
      if(linkGuests){
        return assigned;
      }
      if(activeGuestId && assignedSet.has(activeGuestId)){
        return [activeGuestId];
      }
      activeGuestId = assigned[0];
      return [activeGuestId];
    };

    const getSelectionFor = (id, fallbackService) => {
      if(id===TEMPLATE_ID){
        return ensureTemplateSelection();
      }
      let selection = selections.get(id);
      if(!selection){
        selection = createSelection(fallbackService || defaultService, { guestId: id });
        selections.set(id, selection);
      }
      return selection;
    };

    const getCanonicalSelection = () => {
      const assigned = orderedAssigned();
      if(assigned.length===0){
        return ensureTemplateSelection();
      }
      if(linkGuests){
        const baseId = assigned[0];
        return selections.get(baseId) || ensureTemplateSelection();
      }
      if(activeGuestId && assignedSet.has(activeGuestId)){
        return selections.get(activeGuestId) || ensureTemplateSelection();
      }
      const fallbackId = assigned[0];
      activeGuestId = fallbackId;
      return selections.get(fallbackId) || ensureTemplateSelection();
    };

    const syncFrom = (sourceId, { includeTemplate=false }={}) => {
      const base = selections.get(sourceId);
      if(!base){
        return;
      }
      orderedAssigned().forEach(id => {
        if(id===sourceId) return;
        selections.set(id, { ...base, guestId: id });
      });
      if(includeTemplate){
        syncTemplateFromSourceId(sourceId);
      }
    };

    const overlay = document.createElement('div');
    overlay.className='spa-overlay';
    const dialog = document.createElement('div');
    dialog.className='spa-dialog';

    const header = document.createElement('div');
    header.className='spa-header';
    const title=document.createElement('h2');
    title.className='spa-title';
    title.textContent = mode==='edit' ? 'Edit Spa Appointment' : 'Add Spa Appointment';
    const closeBtn=document.createElement('button');
    closeBtn.type='button';
    closeBtn.className='spa-close';
    closeBtn.setAttribute('aria-label','Close');
    closeBtn.textContent='×';
    closeBtn.addEventListener('click',()=> closeSpaEditor({returnFocus:true}));
    header.appendChild(title);
    header.appendChild(closeBtn);
    dialog.appendChild(header);

    // Compose the SPA flow left-to-right so each decision feeds the next stage:
    // service → duration → start time → therapist → location. Mutating one
    // step immediately cascades the data updates so the preview stays in sync.
    const layout=document.createElement('div');
    layout.className='spa-layout';
    dialog.appendChild(layout);

    const serviceSection=document.createElement('section');
    serviceSection.className='spa-section spa-section-services';
    const serviceHeading=document.createElement('h3');
    serviceHeading.textContent='Service';
    serviceSection.appendChild(serviceHeading);
    const serviceList=document.createElement('div');
    serviceList.className='spa-service-list';
    serviceList.setAttribute('role','listbox');
    serviceList.setAttribute('aria-label','Spa services');
    serviceSection.appendChild(serviceList);

    catalog.categories.forEach(group => {
      const cat=document.createElement('div');
      cat.className='spa-service-category';
      const catTitle=document.createElement('h4');
      catTitle.textContent=group.category;
      cat.appendChild(catTitle);
      const list=document.createElement('div');
      list.className='spa-service-options';
      group.services.forEach(service => {
        const option=document.createElement('button');
        option.type='button';
        option.className='spa-service-option';
        option.dataset.serviceName = service.name;
        option.setAttribute('role','option');
        option.textContent = service.name;
        option.addEventListener('click',()=>{
          selectService(service.name);
        });
        list.appendChild(option);
      });
      cat.appendChild(list);
      serviceList.appendChild(cat);
    });

    layout.appendChild(serviceSection);

    const detailsSection=document.createElement('section');
    detailsSection.className='spa-section spa-section-details';
    layout.appendChild(detailsSection);

    const durationGroup=document.createElement('div');
    durationGroup.className='spa-block';
    const durationHeading=document.createElement('h3');
    durationHeading.textContent='Duration';
    durationGroup.appendChild(durationHeading);
    const durationList=document.createElement('div');
    durationList.className='spa-duration-list';
    durationList.setAttribute('role','radiogroup');
    durationList.setAttribute('aria-label','Duration');
    durationGroup.appendChild(durationList);
    detailsSection.appendChild(durationGroup);

    const timeGroup=document.createElement('div');
    timeGroup.className='spa-block';
    const timeHeading=document.createElement('h3');
    timeHeading.textContent='Start Time';
    timeGroup.appendChild(timeHeading);
    const timeContainer=document.createElement('div');
    timeContainer.className='spa-time-picker';
    timeGroup.appendChild(timeContainer);
    const endPreview=document.createElement('div');
    endPreview.className='spa-end-preview';
    endPreview.setAttribute('aria-live','polite');
    timeGroup.appendChild(endPreview);
    detailsSection.appendChild(timeGroup);

    const therapistGroup=document.createElement('div');
    therapistGroup.className='spa-block';
    const therapistHeading=document.createElement('h3');
    therapistHeading.textContent='Therapist Preference';
    therapistGroup.appendChild(therapistHeading);
    const therapistList=document.createElement('div');
    therapistList.className='spa-radio-list';
    therapistList.setAttribute('role','radiogroup');
    therapistList.setAttribute('aria-label','Therapist preference');
    SPA_THERAPIST_OPTIONS.forEach(option => {
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='spa-radio';
      btn.dataset.value=option.id;
      btn.textContent=option.label;
      btn.addEventListener('click',()=> selectTherapist(option.id));
      therapistList.appendChild(btn);
    });
    therapistGroup.appendChild(therapistList);
    detailsSection.appendChild(therapistGroup);

    const locationGroup=document.createElement('div');
    locationGroup.className='spa-block';
    const locationHeading=document.createElement('h3');
    locationHeading.textContent='Location';
    locationGroup.appendChild(locationHeading);
    const locationList=document.createElement('div');
    locationList.className='spa-radio-list';
    locationList.setAttribute('role','radiogroup');
    locationList.setAttribute('aria-label','Location');
    SPA_LOCATION_OPTIONS.forEach(option => {
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='spa-radio';
      btn.dataset.value=option.id;
      btn.textContent=option.label;
      btn.addEventListener('click',()=> selectLocation(option.id));
      locationList.appendChild(btn);
    });
    const locationHelper=document.createElement('p');
    locationHelper.className='spa-helper-text';
    locationGroup.appendChild(locationList);
    locationGroup.appendChild(locationHelper);
    detailsSection.appendChild(locationGroup);

    const guestSection=document.createElement('section');
    guestSection.className='spa-section spa-section-guests';
    const guestHeading=document.createElement('h3');
    guestHeading.textContent='Guests';
    guestSection.appendChild(guestHeading);
    const guestList=document.createElement('div');
    guestList.className='spa-guest-list';
    guestSection.appendChild(guestList);

    const syncRow=document.createElement('label');
    syncRow.className='spa-sync-row';
    const syncCheckbox=document.createElement('input');
    syncCheckbox.type='checkbox';
    syncCheckbox.checked = linkGuests;
    syncCheckbox.addEventListener('change',()=>{
      linkGuests = syncCheckbox.checked;
      if(linkGuests){
        const ids = orderedAssigned();
        const sourceId = ids[0] || TEMPLATE_ID;
        if(ids.length){
          activeGuestId = ids[0];
        }
        syncFrom(sourceId, { includeTemplate:true });
      }else{
        const canonical = getCanonicalSelection();
        const sourceId = canonical?.guestId && canonical.guestId!==TEMPLATE_ID ? canonical.guestId : TEMPLATE_ID;
        syncTemplateFromSourceId(sourceId);
      }
      refreshGuestControls();
      refreshAllControls();
    });
    const syncLabel=document.createElement('span');
    syncLabel.textContent='Keep guests in sync';
    syncRow.appendChild(syncCheckbox);
    syncRow.appendChild(syncLabel);
    guestSection.appendChild(syncRow);

    const guestEditorRow=document.createElement('div');
    guestEditorRow.className='spa-guest-editor-row';
    const guestEditorLabel=document.createElement('label');
    guestEditorLabel.textContent='Editing details for';
    guestEditorLabel.className='spa-guest-editor-label';
    const guestSelect=document.createElement('select');
    guestSelect.className='spa-guest-select';
    guestSelect.addEventListener('change',()=>{
      activeGuestId = guestSelect.value || null;
      refreshAllControls();
    });
    guestEditorRow.appendChild(guestEditorLabel);
    guestEditorRow.appendChild(guestSelect);
    guestSection.appendChild(guestEditorRow);

    const guestHelper=document.createElement('p');
    guestHelper.className='spa-helper-text';
    guestSection.appendChild(guestHelper);

    dialog.appendChild(guestSection);

    const actions=document.createElement('div');
    actions.className='spa-actions';
    const confirmBtn=document.createElement('button');
    confirmBtn.type='button';
    confirmBtn.className='spa-confirm';
    confirmBtn.textContent = mode==='edit' ? 'Update appointment' : 'Add appointment';
    actions.appendChild(confirmBtn);
    let removeBtn=null;
    if(mode==='edit' && existing){
      removeBtn=document.createElement('button');
      removeBtn.type='button';
      removeBtn.className='spa-remove';
      removeBtn.innerHTML=`${trashSvg}<span class="sr-only">Remove spa appointment</span>`;
      actions.appendChild(removeBtn);
    }
    dialog.appendChild(actions);

    const previousFocus=document.activeElement;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    document.body.classList.add('spa-lock');

    const timePicker = createTimePicker ? createTimePicker({
      hourRange:[1,12],
      minuteStep:5,
      showAmPm:true,
      defaultValue: from24Time(getCanonicalSelection()?.start || defaultSpaStartTime),
      ariaLabels:{ hours:'Spa hour', minutes:'Spa minutes', meridiem:'AM or PM' },
      onChange(value){
        const targets = resolveEditableTargets();
        const nextStart = to24Time(value);
        targets.forEach(id => {
          const selection = getSelectionFor(id);
          selection.start = nextStart;
          // Duration drives end time: recompute whenever start shifts so preview stays live.
          selection.end = addMinutesToTime(selection.start, selection.durationMinutes);
        });
        const sourceId = targets[0] || TEMPLATE_ID;
        syncTemplateFromSourceId(sourceId);
        refreshEndPreview();
      }
    }) : null;
    if(timePicker){
      timeContainer.appendChild(timePicker.element);
    }else{
      const fallback=document.createElement('div');
      fallback.className='time-picker-fallback';
      fallback.textContent='Time picker unavailable.';
      timeContainer.appendChild(fallback);
    }

    function refreshServiceOptions(){
      const selection = getCanonicalSelection();
      const activeName = selection?.serviceName || defaultService?.name || '';
      serviceList.querySelectorAll('.spa-service-option').forEach(btn => {
        const selected = btn.dataset.serviceName===activeName;
        btn.classList.toggle('selected', selected);
        btn.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
    }

    function refreshDurationOptions(){
      durationList.innerHTML='';
      const selection = getCanonicalSelection();
      const service = findService(selection?.serviceName) || defaultService;
      const durations = service?.durations?.slice() || [];
      durations.forEach(minutes => {
        const btn=document.createElement('button');
        btn.type='button';
        btn.className='spa-radio';
        btn.dataset.value=String(minutes);
        btn.textContent=formatDurationLabel(minutes);
        const selected = selection?.durationMinutes===minutes;
        btn.classList.toggle('selected', selected);
        btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
        btn.addEventListener('click',()=> selectDuration(minutes));
        durationList.appendChild(btn);
      });
    }

    function refreshTherapistOptions(){
      const selection = getCanonicalSelection();
      therapistList.querySelectorAll('.spa-radio').forEach(btn => {
        const selected = btn.dataset.value===selection?.therapist;
        btn.classList.toggle('selected', selected);
        btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });
    }

    function refreshLocationOptions(){
      const selection = getCanonicalSelection();
      const service = findService(selection?.serviceName) || defaultService;
      const supportsInRoom = service?.supportsInRoom !== false;
      locationList.querySelectorAll('.spa-radio').forEach(btn => {
        const value = btn.dataset.value;
        const disabled = value==='in-room' && !supportsInRoom;
        btn.classList.toggle('selected', selection?.location===value);
        btn.setAttribute('aria-pressed', selection?.location===value ? 'true' : 'false');
        btn.disabled = disabled;
      });
      if(!supportsInRoom){
        locationHelper.textContent='In-Room service is unavailable for this treatment.';
      }else{
        locationHelper.textContent='';
      }
    }

    function refreshGuestControls(){
      guestList.innerHTML='';
      state.guests.forEach(guest => {
        const row=document.createElement('label');
        row.className='spa-guest-row';
        const checkbox=document.createElement('input');
        checkbox.type='checkbox';
        checkbox.checked = assignedSet.has(guest.id);
        checkbox.addEventListener('change',()=>{
          if(checkbox.checked){
            assignedSet.add(guest.id);
            const canonical = getCanonicalSelection() || ensureTemplateSelection();
            const clone = { ...canonical, guestId: guest.id };
            clone.end = addMinutesToTime(clone.start, clone.durationMinutes);
            selections.set(guest.id, clone);
            if(linkGuests){
              const ids = orderedAssigned();
              const sourceId = ids[0] || TEMPLATE_ID;
              if(ids.length){
                activeGuestId = ids[0];
              }
              syncFrom(sourceId, { includeTemplate:true });
            }else{
              syncTemplateFromSourceId(guest.id);
            }
          }else{
            assignedSet.delete(guest.id);
            selections.delete(guest.id);
            if(activeGuestId===guest.id){
              activeGuestId = orderedAssigned()[0] || null;
            }
            if(linkGuests){
              const ids = orderedAssigned();
              if(ids.length){
                syncFrom(ids[0], { includeTemplate:true });
              }else{
                syncTemplateFromSourceId(TEMPLATE_ID);
              }
            }
          }
          refreshGuestControls();
          refreshAllControls();
        });
        const swatch=document.createElement('span');
        swatch.className='spa-guest-swatch';
        swatch.style.background = guest.color;
        row.appendChild(checkbox);
        row.appendChild(swatch);
        const label=document.createElement('span');
        label.textContent=guest.name;
        row.appendChild(label);
        guestList.appendChild(row);
      });

      guestSelect.innerHTML='';
      orderedAssigned().forEach(id => {
        const guest = state.guests.find(g=>g.id===id);
        if(!guest) return;
        const opt=document.createElement('option');
        opt.value=id;
        opt.textContent=guest.name;
        guestSelect.appendChild(opt);
      });
      if(state.guests.length===0){
        guestHelper.textContent='Add guests to assign this appointment.';
      }else if(orderedAssigned().length===0){
        guestHelper.textContent='Select at least one guest to continue.';
      }else{
        guestHelper.textContent='';
      }
      if(!orderedAssigned().includes(activeGuestId)){
        activeGuestId = orderedAssigned()[0] || null;
      }
      guestSelect.disabled = linkGuests || orderedAssigned().length===0;
      guestSelect.value = activeGuestId || '';
    }

    function refreshTimePickerSelection(){
      const selection = getCanonicalSelection();
      if(!selection || !timePicker) return;
      const { hour, minute, meridiem } = from24Time(selection.start);
      timePicker.hourWheel?.setValue?.(hour);
      timePicker.minuteWheel?.setValue?.(minute);
      timePicker.meridiemWheel?.setValue?.(meridiem);
    }

    function refreshEndPreview(){
      const selection = getCanonicalSelection();
      if(selection){
        endPreview.textContent = `${fmt12(selection.start)} – ${fmt12(selection.end)}`;
      }else{
        endPreview.textContent = '';
      }
    }

    function refreshAllControls(){
      refreshServiceOptions();
      refreshDurationOptions();
      refreshTherapistOptions();
      refreshLocationOptions();
      refreshTimePickerSelection();
      refreshEndPreview();
      updateConfirmState();
    }

    function updateConfirmState(){
      confirmBtn.disabled = orderedAssigned().length===0;
    }

    function selectService(name){
      const service = findService(name) || defaultService;
      const targets = resolveEditableTargets();
      targets.forEach(id => {
        const selection = getSelectionFor(id, service);
        selection.serviceName = service?.name || name;
        selection.serviceCategory = service?.category || '';
        selection.supportsInRoom = service?.supportsInRoom !== false;
        const durations = service?.durations?.slice() || [];
        if(!durations.includes(selection.durationMinutes)){
          selection.durationMinutes = durations[0] || selection.durationMinutes;
        }
        // Whenever duration shifts, recompute the derived end time so the preview follows.
        selection.end = addMinutesToTime(selection.start, selection.durationMinutes);
        if(selection.location==='in-room' && selection.supportsInRoom===false){
          selection.location='same-cabana';
        }
      });
      if(targets.length){
        syncTemplateFromSourceId(targets[0]);
      }
      refreshAllControls();
    }

    function selectDuration(minutes){
      const targets = resolveEditableTargets();
      targets.forEach(id => {
        const selection = getSelectionFor(id);
        selection.durationMinutes = minutes;
        selection.end = addMinutesToTime(selection.start, minutes);
      });
      if(targets.length){
        syncTemplateFromSourceId(targets[0]);
      }
      refreshAllControls();
    }

    function selectTherapist(id){
      const targets = resolveEditableTargets();
      targets.forEach(targetId => {
        const selection = getSelectionFor(targetId);
        selection.therapist = id;
      });
      if(targets.length){
        syncTemplateFromSourceId(targets[0]);
      }
      refreshTherapistOptions();
      updateConfirmState();
    }

    function selectLocation(id){
      const canonical = getCanonicalSelection();
      const canonicalService = canonical ? findService(canonical.serviceName) || defaultService : defaultService;
      // Location gating mirrors the data model: if the current service blocks in-room,
      // surface the helper text and ignore attempts to re-enable the option.
      if(id==='in-room' && canonicalService?.supportsInRoom===false){
        locationHelper.textContent='In-Room service is unavailable for this treatment.';
        return;
      }
      const targets = resolveEditableTargets();
      targets.forEach(targetId => {
        const selection = getSelectionFor(targetId);
        const service = findService(selection.serviceName) || defaultService;
        const supportsInRoom = service?.supportsInRoom !== false;
        if(id==='in-room' && !supportsInRoom){
          return;
        }
        selection.location = id;
      });
      if(targets.length){
        syncTemplateFromSourceId(targets[0]);
      }
      refreshLocationOptions();
      updateConfirmState();
    }

    refreshGuestControls();
    refreshAllControls();

    function confirmSelection(){
      if(orderedAssigned().length===0) return;
      const appointments = orderedAssigned().map(id => {
        const selection = selections.get(id);
        return selection ? {
          guestId: id,
          serviceName: selection.serviceName,
          serviceCategory: selection.serviceCategory,
          durationMinutes: selection.durationMinutes,
          start: selection.start,
          end: addMinutesToTime(selection.start, selection.durationMinutes),
          therapist: selection.therapist,
          location: selection.location
        } : null;
      }).filter(Boolean);
      upsertSpaEntry(targetDateKey, { id: existing?.id, appointments });
      markPreviewDirty();
      renderActivities();
      renderPreview();
      closeSpaEditor({returnFocus:true});
    }

    confirmBtn.addEventListener('click', confirmSelection);

    if(removeBtn){
      removeBtn.addEventListener('click',()=>{
        removeSpaEntry(targetDateKey, existing.id);
        markPreviewDirty();
        renderActivities();
        renderPreview();
        closeSpaEditor({returnFocus:true});
      });
    }

    overlay.addEventListener('click', e=>{
      if(e.target===overlay){
        closeSpaEditor({returnFocus:true});
      }
    });

    const handleKeyDown = e => {
      if(e.key==='Escape'){
        e.preventDefault();
        closeSpaEditor({returnFocus:true});
        return;
      }
      if((e.key==='Enter' || e.key==='Return') && (!e.target || e.target.tagName!=='BUTTON')){
        e.preventDefault();
        confirmSelection();
        return;
      }
      if(e.key==='Tab'){
        const focusable = Array.from(dialog.querySelectorAll('button,select,input[type="checkbox"],[tabindex]:not([tabindex="-1"])')).filter(el => !el.disabled && el.offsetParent!==null);
        if(focusable.length===0) return;
        const first = focusable[0];
        const last = focusable[focusable.length-1];
        if(e.shiftKey){
          if(document.activeElement===first){
            e.preventDefault();
            last.focus();
          }
        }else{
          if(document.activeElement===last){
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);

    spaDialog = {
      overlay,
      dialog,
      previousFocus,
      cleanup(){
        timePicker?.dispose?.();
      }
    };

    setTimeout(()=>{
      if(linkGuests){
        timePicker?.focus?.();
      }else if(guestSelect && !guestSelect.disabled){
        guestSelect.focus();
      }
    },0);
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

  function getDinnerEntry(dateK){
    const day = state.schedule[dateK];
    if(!day) return null;
    return day.find(entry=>entry.type==='dinner') || null;
  }

  function syncDinnerGuests(){
    const allIds = state.guests.map(g=>g.id);
    for(const key of Object.keys(state.schedule)){
      const day = state.schedule[key];
      if(!day) continue;
      day.forEach(entry=>{
        if(entry.type==='dinner'){
          entry.guestIds = new Set(allIds);
        }
      });
    }
  }

  function syncSpaGuests(){
    const activeIds = new Set(state.guests.map(g=>g.id));
    const purgeKeys = [];
    for(const key of Object.keys(state.schedule)){
      const day = state.schedule[key];
      if(!day) continue;
      for(let i = day.length - 1; i >= 0; i--){
        const entry = day[i];
        if(entry.type!=='spa') continue;
        entry.appointments = entry.appointments.filter(app => activeIds.has(app.guestId));
        recomputeSpaEntrySummary(entry);
        if(entry.appointments.length===0){
          day.splice(i,1);
        }
      }
      if(day.length===0){
        purgeKeys.push(key);
      }
    }
    purgeKeys.forEach(key => delete state.schedule[key]);
  }

  function upsertDinner(dateK, time){
    const day = getOrCreateDay(dateK);
    let entry = getDinnerEntry(dateK);
    if(!entry){
      entry = { type:'dinner', title: dinnerTitle, start: time, guestIds: new Set(state.guests.map(g=>g.id)) };
      day.push(entry);
    }else{
      entry.start = time;
      entry.guestIds = new Set(state.guests.map(g=>g.id));
    }
    sortDayEntries(dateK);
  }

  function removeDinner(dateK){
    const day = state.schedule[dateK];
    if(!day) return;
    const idx = day.findIndex(entry=>entry.type==='dinner');
    if(idx>-1){
      day.splice(idx,1);
      if(day.length===0) delete state.schedule[dateK];
    }
  }

  function recomputeSpaEntrySummary(entry){
    if(!entry || entry.type!=='spa') return;
    let minStart = null;
    let maxEnd = null;
    const ids = new Set();
    entry.appointments = Array.isArray(entry.appointments) ? entry.appointments.filter(app => app && app.guestId) : [];
    entry.appointments.forEach(app => {
      ids.add(app.guestId);
      if(app.start){
        if(!minStart || app.start < minStart) minStart = app.start;
      }
      if(app.end){
        if(!maxEnd || app.end > maxEnd) maxEnd = app.end;
      }
    });
    entry.guestIds = ids;
    entry.start = minStart;
    entry.end = maxEnd;
  }

  function getSpaEntries(dateK){
    const day = state.schedule[dateK];
    if(!day) return [];
    return day.filter(entry=>entry.type==='spa');
  }

  function getSpaEntry(dateK, id){
    if(!id) return null;
    const day = state.schedule[dateK];
    if(!day) return null;
    return day.find(entry=> entry.type==='spa' && entry.id===id) || null;
  }

  function upsertSpaEntry(dateK, entry){
    const day = getOrCreateDay(dateK);
    let target = entry.id ? day.find(item => item.type==='spa' && item.id===entry.id) : null;
    if(!target){
      target = { type:'spa', id: entry.id || generateSpaEntryId(), appointments: [], guestIds: new Set(), start: null, end: null };
      day.push(target);
    }
    target.appointments = entry.appointments.map(app => ({ ...app }));
    recomputeSpaEntrySummary(target);
    sortDayEntries(dateK);
    return target;
  }

  function removeSpaEntry(dateK, entryId){
    const day = state.schedule[dateK];
    if(!day) return;
    const idx = day.findIndex(entry => entry.type==='spa' && entry.id===entryId);
    if(idx>-1){
      day.splice(idx,1);
      if(day.length===0) delete state.schedule[dateK];
    }
  }

  const spaTherapistLabel = id => (SPA_THERAPIST_OPTIONS.find(opt => opt.id===id)?.label) || 'No Preference';
  const spaLocationLabel = id => (SPA_LOCATION_OPTIONS.find(opt => opt.id===id)?.label) || 'Same Cabana';
  const pluralizeServiceTitle = name => {
    if(!name) return '';
    const trimmed = name.trim();
    return /s$/i.test(trimmed) ? trimmed : `${trimmed}s`;
  };

  function buildSpaPreviewLines(entry){
    if(!entry || !Array.isArray(entry.appointments)) return [];
    const appointments = entry.appointments.slice();
    if(appointments.length===0) return [];
    const guestLookup = new Map(state.guests.map(g=>[g.id,g]));
    const base = appointments[0];
    const everyoneMatches = appointments.every(app => app.serviceName===base.serviceName && app.durationMinutes===base.durationMinutes && app.start===base.start && app.end===base.end && app.therapist===base.therapist && app.location===base.location);
    const lines = [];
    if(everyoneMatches){
      // When every guest shares the same configuration, pluralise the service label
      // and omit the guest tags so the preview mirrors the shared experience.
      const serviceTitle = `${formatDurationLabel(base.durationMinutes)} ${pluralizeServiceTitle(base.serviceName)}`;
      const therapist = spaTherapistLabel(base.therapist);
      const location = spaLocationLabel(base.location);
      lines.push(`${escapeHtml(fmt12(base.start))} – ${escapeHtml(fmt12(base.end))} | ${escapeHtml(serviceTitle)} | ${escapeHtml(therapist)} | ${escapeHtml(location)}`);
      return lines;
    }
    const orderedIds = state.guests.map(g=>g.id).filter(id => appointments.some(app=>app.guestId===id));
    orderedIds.forEach(id => {
      const app = appointments.find(a=>a.guestId===id);
      if(!app) return;
      const guest = guestLookup.get(id);
      const serviceTitle = `${formatDurationLabel(app.durationMinutes)} ${app.serviceName}`;
      const therapist = spaTherapistLabel(app.therapist);
      const location = spaLocationLabel(app.location);
      const guestLabel = guest ? ` | ${escapeHtml(guest.name)}` : '';
      lines.push(`${escapeHtml(fmt12(app.start))} – ${escapeHtml(fmt12(app.end))} | ${escapeHtml(serviceTitle)} | ${escapeHtml(therapist)} | ${escapeHtml(location)}${guestLabel}`);
    });
    return lines;
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
      if(state.userEdited!==undefined) email.innerHTML = state.userEdited;
      return;
    }
    const primary = state.guests.find(g=>g.primary)?.name || 'Guest';

    const makeEl = (tag, className, text, options)=>{
      const el=document.createElement(tag);
      if(className) el.className=className;
      if(options?.html){
        el.innerHTML = text ?? '';
      }else if(text!==undefined){
        el.textContent=text;
      }
      return el;
    };

    email.innerHTML='';

    email.appendChild(makeEl('p','email-body',`Hello ${primary},`));
    email.appendChild(makeEl('p','email-body','Thank you for choosing Castle Hot Springs.'));
    email.appendChild(makeEl('h3','email-section-title','Current Itinerary:'));

    const stayKeys = getStayKeys();

    if(stayKeys.length===0){
      email.appendChild(makeEl('p','email-empty','Set Arrival and Departure to build your preview.'));
      state.userEdited = email.innerHTML;
      state.previewFrozen = false;
      state.previewDirty = false;
      return;
    }

    stayKeys.forEach((k)=>{
      const [y,m,d] = k.split('-').map(Number);
      const date = new Date(y, m-1, d);
      const w = weekdayName(date);
      const daySection = makeEl('section','email-day');
      const monthLabel = date.toLocaleString(undefined,{month:'long'});
      daySection.appendChild(
        makeEl(
          'h4',
          'email-day-title',
          `${escapeHtml(w)}, ${escapeHtml(monthLabel)} ${ordinalHtml(date.getDate())}`,
          {html:true}
        )
      );

      const checkoutLine = () => {
        // The arrival/departure subtitles live inside a bold container, so the parenthetical inherits the heavy weight.
        // Building the node tree manually lets us wrap the time (including parentheses)
        // in a scoped span that forces font-weight: 400.
        const row = makeEl('div', 'email-activity');
        row.appendChild(makeEl('strong', undefined, fmt12('11:00')));
        row.appendChild(document.createTextNode(' Check-Out | Welcome to stay on property until '));
        // Parentheses previously came from the template literal around fmt12(); removing them here keeps the
        // scoped font-weight styling while limiting the change to this specific time string.
        const stayWindow = makeEl('span', 'email-activity-parenthetical-time', fmt12('13:00'));
        row.appendChild(stayWindow);
        return row;
      };
      const checkinLine = () => {
        const row = makeEl('div', 'email-activity');
        row.appendChild(makeEl('strong', undefined, fmt12('16:00')));
        row.appendChild(document.createTextNode(' Guaranteed Check-In | Welcome to arrive as early as '));
        // Apply the same scoped span so the early-arrival window stays regular weight without reinstating parentheses.
        const arrivalWindow = makeEl('span', 'email-activity-parenthetical-time', fmt12('12:00'));
        row.appendChild(arrivalWindow);
        return row;
      };

      if(state.departure && keyDate(state.departure)===k)
        daySection.appendChild(checkoutLine());

      if(state.arrival && keyDate(state.arrival)===k)
        daySection.appendChild(checkinLine());

      const items = (state.schedule[k]||[]).slice().sort((a,b)=> (a.start||'').localeCompare(b.start||''));
      items.forEach(it=>{
        const isDinner = it.type==='dinner';
        if(it.type==='spa'){
          const spaLines = buildSpaPreviewLines(it);
          spaLines.forEach(line => {
            daySection.appendChild(
              makeEl('div','email-activity', line, {html:true})
            );
          });
          return;
        }
        const ids = isDinner ? state.guests.map(g=>g.id) : Array.from(it.guestIds||[]);
        if(!isDinner && ids.length===0) return;
        const everyone = isDinner || (ids.length===state.guests.length);
        const names = ids.map(id=> state.guests.find(g=>g.id===id)?.name).filter(Boolean);
        const tag = everyone ? '' : names.map(n=>` | ${escapeHtml(n)}`).join('');
        const startTime = it.start ? `<strong>${escapeHtml(fmt12(it.start))}</strong>` : '';
        const endTime = it.end ? `<strong>${escapeHtml(fmt12(it.end))}</strong>` : '';
        let timeSegment = '';
        if(startTime && endTime){
          timeSegment = `${startTime} - ${endTime}`;
        }else if(startTime){
          timeSegment = startTime;
        }else if(endTime){
          timeSegment = endTime;
        }
        const title = escapeHtml(it.title||'');
        daySection.appendChild(
          makeEl(
            'div',
            'email-activity',
            `${timeSegment}${timeSegment && title ? ' | ' : ''}${title}${tag}`,
            {html:true}
          )
        );
      });

      email.appendChild(daySection);
    });

    state.userEdited = email.innerHTML;
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
    state.userEdited = email.innerHTML;
    state.editing = true;
    email.contentEditable = 'true';
    email.style.outline = '2px dashed #bbb';
    setEditButton(true);
  }

  function exitEditMode(){
    state.editing = false;
    state.userEdited = email.innerHTML;
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
    const html=email.innerHTML;
    const text=email.textContent;
    try{
      if(window.ClipboardItem && navigator.clipboard?.write){
        const item=new ClipboardItem({
          'text/html': new Blob([html], {type:'text/html'}),
          'text/plain': new Blob([text], {type:'text/plain'})
        });
        await navigator.clipboard.write([item]);
      }else if(navigator.clipboard?.writeText){
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

  function ensureFocusInSeason(){
    if(state.dataStatus!=='ready') return;
    const seasons = state.data?.activities?.seasons || [];
    if(seasons.length===0) return;
    const focusKey = keyDate(state.focus);
    const inSeason = seasons.some(season=> focusKey>=season.start && focusKey<=season.end);
    if(inSeason) return;

    const todayKey = keyDate(state.today);
    let target = seasons.find(season=> todayKey>=season.start && todayKey<=season.end);
    if(!target){
      target = seasons.find(season=> todayKey < season.start) || seasons[seasons.length-1];
    }
    if(target?.start){
      const [y,m,d] = target.start.split('-').map(Number);
      state.focus = zero(new Date(y, m-1, d));
    }
  }

  function buildOutOfSeasonMessage(){
    const seasons = state.data?.activities?.seasons || [];
    if(seasons.length===0) return 'No activities scheduled for the selected date.';

    const focusDate = state.focus;
    const focusKey = keyDate(focusDate);
    const focusLabel = formatStayDate(focusDate, true);

    const next = seasons.find(season=> focusKey < season.start);
    if(next){
      const [ny,nm,nd] = next.start.split('-').map(Number);
      const startDate = new Date(ny, nm-1, nd);
      const startLabel = formatStayDate(startDate);
      return `No activities are scheduled for ${focusLabel}. Upcoming activities begin ${startLabel}.`;
    }

    const prev = [...seasons].reverse().find(season=> focusKey > season.end);
    if(prev){
      const [py,pm,pd] = prev.end.split('-').map(Number);
      const endDate = new Date(py, pm-1, pd);
      const endLabel = formatStayDate(endDate);
      return `No activities are scheduled for ${focusLabel}. The most recent season ended on ${endLabel}.`;
    }

    return 'No activities scheduled for the selected date.';
  }

  function formatStayDate(date, includeWeekday=false){
    const base = `${date.toLocaleString(undefined,{month:'long'})} ${ordinal(date.getDate())}, ${date.getFullYear()}`;
    return includeWeekday ? `${weekdayName(date)}, ${base}` : base;
  }

  if(typeof window !== 'undefined'){
    window.CHSBuilderDebug = {
      addGuest,
      setArrival,
      setDeparture,
      openSpaEditor,
      openDinnerPicker,
      focusDate(date){
        if(!(date instanceof Date)) return;
        state.focus = zero(date);
        renderAll();
      },
      getState(){ return state; }
    };
  }
})();
