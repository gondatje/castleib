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
  const fmt12 = hm => {
    let [h, m] = hm.split(':').map(Number);
    const isAm = h < 12;
    h = ((h + 11) % 12) + 1;
    const meridiem = isAm ? 'AM' : 'PM';
    return `${h}:${pad(m)} ${meridiem}`;
  };
  const parse24Time = hm => { const [h,m] = hm.split(':').map(Number); return { hour: h, minute: m }; };
  const minutesFromTime = hm => {
    if(!hm) return null;
    const { hour, minute } = parse24Time(hm || '00:00');
    if(!Number.isFinite(hour) || !Number.isFinite(minute)){
      return null;
    }
    return (hour * 60) + minute;
  };
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
  // Duration buttons show compact numerals so the three-option case still fits
  // inside the fixed grid cell; downstream outputs continue to call the full
  // label helper so confirmation copy retains the "-Minute" suffix.
  const formatDurationLabel = minutes => `${minutes}-Minute`;
  const formatDurationButtonLabel = minutes => String(minutes);
  const keyDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

  // Utility focus helper so we can safely focus elements without the browser
  // restoring a previous scroll position. Safari will throw if it doesn't
  // support the options bag, so we fall back to a plain focus when needed.
  const focusWithoutScroll = element => {
    if(!element || typeof element.focus !== 'function'){
      return;
    }
    try{
      element.focus({ preventScroll:true });
    }catch(err){
      element.focus();
    }
  };

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
  const checkSvg = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M6.6 11.2a.75.75 0 0 1-1.18.15L2.8 8.73a.75.75 0 0 1 1.06-1.06l2.02 2.03 4.46-4.46a.75.75 0 0 1 1.06 1.06Z"/></svg>';

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
    { id: 'couples-massage', label: 'Couple’s Massage' },
    { id: 'in-room', label: 'In-Room' }
  ];

  const defaultSpaStartTime = '14:00';
  const generateSpaEntryId = () => (crypto.randomUUID ? crypto.randomUUID() : `spa_${Date.now()}_${Math.random().toString(16).slice(2)}`);

  const SPA_CATEGORY_BLUEPRINT = [
    {
      id: 'massages',
      label: 'Massages',
      match(entry){
        return entry.category === 'Massages';
      }
    },
    {
      id: 'treatments',
      label: 'Treatments',
      subcategories: [
        {
          id: 'treatments-facials',
          label: 'Facials',
          match(entry){
            return entry.category === 'Facials';
          }
        },
        {
          id: 'treatments-full-body',
          label: 'Full Body',
          match(entry){
            return entry.category === 'Treatments';
          }
        }
      ]
    },
    {
      id: 'therapies',
      label: 'Therapies',
      match(entry){
        return entry.category === 'Therapies';
      }
    },
    {
      id: 'intentional',
      label: 'Intentional Wellness Sessions',
      match(entry){
        return entry.category === 'Intentional Wellness';
      }
    }
  ];

  function buildSpaCatalog(dataset){
    const services = Array.isArray(dataset?.services) ? dataset.services : [];
    const entries = [];
    const byName = new Map();

    services.forEach(service => {
      const entry = {
        name: service.name,
        category: service.category,
        subcategory: service.subcategory,
        durations: Array.isArray(service.durations) ? service.durations.slice() : Array.isArray(service.durations_minutes) ? service.durations_minutes.slice() : [],
        supportsInRoom: service.supportsInRoom ?? service.supports_in_room ?? null,
        displayCategoryId: null,
        displayCategoryLabel: null,
        displaySubcategoryId: null,
        displaySubcategoryLabel: null
      };
      entries.push(entry);
      byName.set(entry.name, entry);
    });

    const categories = [];
    SPA_CATEGORY_BLUEPRINT.forEach(categoryBlueprint => {
      const category = {
        id: categoryBlueprint.id,
        label: categoryBlueprint.label,
        services: [],
        subcategories: []
      };

      if(Array.isArray(categoryBlueprint.subcategories) && categoryBlueprint.subcategories.length){
        categoryBlueprint.subcategories.forEach(subBlueprint => {
          const matched = entries.filter(entry => subBlueprint.match(entry));
          if(matched.length === 0) return;
          const subcategoryId = subBlueprint.id;
          const subcategory = {
            id: subcategoryId,
            label: subBlueprint.label,
            services: matched.slice().sort((a,b)=> a.name.localeCompare(b.name))
          };
          subcategory.services.forEach(entry => {
            entry.displayCategoryId = categoryBlueprint.id;
            entry.displayCategoryLabel = categoryBlueprint.label;
            entry.displaySubcategoryId = subcategoryId;
            entry.displaySubcategoryLabel = subBlueprint.label;
          });
          category.subcategories.push(subcategory);
        });
      }else{
        const matched = entries.filter(entry => categoryBlueprint.match(entry));
        if(matched.length === 0) return;
        category.services = matched.slice().sort((a,b)=> a.name.localeCompare(b.name));
        category.services.forEach(entry => {
          entry.displayCategoryId = categoryBlueprint.id;
          entry.displayCategoryLabel = categoryBlueprint.label;
          entry.displaySubcategoryId = null;
          entry.displaySubcategoryLabel = null;
        });
      }

      if(category.services.length || category.subcategories.length){
        categories.push(category);
      }
    });

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
    const spaOverlapById = computeSpaOverlapMap(spaEntries);
    const guestLookup = new Map(state.guests.map(g=>[g.id,g]));
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

      const appointments = Array.isArray(entry.appointments) ? entry.appointments : [];
      const firstAppointment = appointments[0] || null;
      const therapistLabel = spaTherapistLabel(firstAppointment?.therapist);
      const locationId = firstAppointment?.location || null;
      const locationAlwaysRelevant = locationId==='in-room' || locationId==='couples-massage';
      const showLocation = locationAlwaysRelevant || (entry.id && spaOverlapById.get(entry.id));
      const locationLabel = showLocation && locationId ? spaLocationLabel(locationId) : null;
      const singleAppointment = appointments.length===1;
      const guestName = singleAppointment ? (guestLookup.get(firstAppointment?.guestId)?.name || '') : '';
      // Surface therapist preference every time and append cabana/location and
      // guest details per the established `time | service | therapist | cabana | guest`
      // format the activities rail uses for spa rows.
      const metaParts = [therapistLabel || spaTherapistLabel('no-preference')];
      if(locationLabel){
        metaParts.push(locationLabel);
      }
      if(guestName){
        metaParts.push(guestName);
      }
      const metaRow=document.createElement('div');
      metaRow.className='spa-meta';
      const metaContent = metaParts.filter(Boolean).join(' | ');
      metaRow.textContent = metaContent;
      if(metaContent){
        body.appendChild(metaRow);
      }

      const tagWrap=document.createElement('div');
      tagWrap.className='tag-row';

      const assignmentGuests = Array.from(entry.guestIds || []).map(id => guestLookup.get(id)).filter(Boolean);
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
      if(timePicker?.focus){
        // Explicitly focus the picker without scrolling so the sheet stays
        // anchored at the top when it first opens.
        timePicker.focus({ preventScroll:true });
      }
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
    // Guest confirmation state mirrors the pill UX: included guests start pending
    // until their selections are locked via the checkmark control.
    const guestConfirmState = new Map();
    assignedIds.forEach(id => {
      guestConfirmState.set(id, !!existing);
    });

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

    let activeGuestId = assignedIds[0] || null;

    const orderedAssigned = () => state.guests.map(g=>g.id).filter(id => assignedSet.has(id));

    const countConfirmedGuests = () => orderedAssigned().filter(id => guestConfirmState.get(id)).length;

    const inUniformMode = () => {
      const assigned = orderedAssigned();
      if(assigned.length===0){
        return true;
      }
      return countConfirmedGuests() === 0;
    };

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
      if(inUniformMode()){
        activeGuestId = null;
        return assigned;
      }
      let target = (activeGuestId && assignedSet.has(activeGuestId)) ? activeGuestId : null;
      if(target && guestConfirmState.get(target)){
        target = null;
      }
      if(!target){
        target = assigned.find(id => !guestConfirmState.get(id)) || null;
      }
      if(target){
        activeGuestId = target;
        if(guestConfirmState.get(target)){
          return [];
        }
        return [target];
      }
      return [];
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
      if(inUniformMode()){
        const baseId = assigned[0];
        return selections.get(baseId) || ensureTemplateSelection();
      }
      let targetId = (activeGuestId && assignedSet.has(activeGuestId)) ? activeGuestId : null;
      if(!targetId){
        targetId = assigned.find(id => !guestConfirmState.get(id)) || assigned[0];
      }
      if(targetId){
        activeGuestId = targetId;
        return selections.get(targetId) || ensureTemplateSelection();
      }
      return ensureTemplateSelection();
    };

    const overlay = document.createElement('div');
    overlay.className='spa-overlay';
    const dialog = document.createElement('div');
    dialog.className='spa-dialog';

    const header = document.createElement('div');
    header.className='spa-header';
    const title=document.createElement('h2');
    title.className='spa-title';
    title.textContent='SPA Appointment';
    const closeBtn=document.createElement('button');
    closeBtn.type='button';
    closeBtn.className='spa-close';
    closeBtn.setAttribute('aria-label','Close');
    closeBtn.textContent='×';
    closeBtn.addEventListener('click',()=> closeSpaEditor({returnFocus:true}));
    header.appendChild(title);
    header.appendChild(closeBtn);
    dialog.appendChild(header);

    const body = document.createElement('div');
    body.className='spa-body';
    dialog.appendChild(body);

    // Compose the SPA flow left-to-right so each decision feeds the next stage:
    // service → duration → start time → therapist → location. Mutating one
    // step immediately cascades the data updates so the preview stays in sync.
    const layout=document.createElement('div');
    layout.className='spa-layout';
    body.appendChild(layout);

    const guestSection=document.createElement('section');
    guestSection.className='spa-section spa-section-guests spa-block spa-guest-card spa-detail-card spa-detail-card-guests';
    const guestHeading=document.createElement('h3');
    guestHeading.textContent='Guests';
    guestSection.appendChild(guestHeading);
    const guestList=document.createElement('div');
    guestList.className='spa-guest-list';
    guestList.setAttribute('role','group');
    guestSection.appendChild(guestList);
    const guestHint=document.createElement('p');
    guestHint.className='spa-helper-text spa-guest-hint';
    guestHint.id='spa-guest-hint';
    guestHint.setAttribute('aria-live','polite');
    guestHint.hidden=true;
    guestSection.appendChild(guestHint);

    const buildGuestLabel = guest => guest.name;

    // Submit remains enabled for the uniform fast-path (no confirmations) and only
    // re-locks when the user starts confirming individual guests.
    function areGuestsReady(){
      const assigned = orderedAssigned();
      if(assigned.length===0) return false;
      const confirmedCount = countConfirmedGuests();
      if(confirmedCount===0) return true;
      return confirmedCount===assigned.length;
    }

    // Modal pills reuse the roster styling so guests remain familiar. A guest is
    // editable until confirmed; once confirmed they are locked until the user
    // explicitly unconfirms them.
    function updateGuestControls(){
      guestList.innerHTML='';
      const singleGuestRoster = state.guests.length===1;
      if(singleGuestRoster && state.guests[0]){
        assignedSet.add(state.guests[0].id);
      }
      const assigned = orderedAssigned();
      const uniform = inUniformMode();
      const confirmedCount = countConfirmedGuests();
      const outstandingIds = confirmedCount>0 ? assigned.filter(id => !guestConfirmState.get(id)) : [];
      const outstandingNames = outstandingIds.map(id => {
        const entry = state.guests.find(g => g.id===id);
        return entry ? entry.name : '';
      }).filter(Boolean);
      const activeId = (!uniform && activeGuestId && assignedSet.has(activeGuestId)) ? activeGuestId : null;

      guestHeading.textContent = singleGuestRoster ? 'Guest' : 'Guests';

      if(singleGuestRoster){
        const solo = state.guests[0];
        if(solo){
          const wrapper=document.createElement('div');
          wrapper.className='spa-guest-chip spa-guest-chip-static included';
          wrapper.dataset.guestId = solo.id;
          // Single-guest stays render the pill as a static name tag so the
          // inline experience matches the roster while skipping the confirm
          // workflow entirely.
          const pill=document.createElement('span');
          pill.className='guest-pill spa-guest-pill spa-guest-pill-static';
          pill.style.setProperty('--pillColor', solo.color);
          if(solo.primary){
            const star=document.createElement('span');
            star.className='star';
            star.textContent='★';
            star.setAttribute('aria-hidden','true');
            pill.appendChild(star);
          }
          const labelSpan=document.createElement('span');
          labelSpan.className='label';
          labelSpan.textContent=buildGuestLabel(solo);
          pill.appendChild(labelSpan);
          wrapper.appendChild(pill);
          guestList.appendChild(wrapper);
        }
        guestHint.hidden=true;
        guestHint.textContent='';
        guestHint.classList.remove('spa-helper-error');
        updateConfirmState();
        return;
      }

      state.guests.forEach(guest => {
        const included = assignedSet.has(guest.id);
        const confirmed = !!guestConfirmState.get(guest.id);
        // Mirror the roster chips: reuse the shared guest-pill markup (and
        // color token) so the modal visuals stay 1:1 with the main rail.
        const wrapper=document.createElement('div');
        wrapper.className='spa-guest-chip';
        wrapper.dataset.guestId = guest.id;
        if(included) wrapper.classList.add('included');
        if(included && confirmed) wrapper.classList.add('confirmed');
        if(included && !confirmed && !uniform) wrapper.classList.add('needs-confirm');
        if(included && activeId===guest.id){
          wrapper.classList.add('active');
        }

        const pill=document.createElement('button');
        pill.type='button';
        pill.className='guest-pill spa-guest-pill';
        // Reuse the roster palette so the modal pills stay color-synced with the
        // main guest chips.
        pill.style.setProperty('--pillColor', guest.color);
        pill.setAttribute('aria-pressed', included ? 'true' : 'false');
        pill.classList.toggle('active', included);
        if(guest.primary){
          const star=document.createElement('span');
          star.className='star';
          star.textContent='★';
          star.setAttribute('aria-hidden','true');
          pill.appendChild(star);
        }
        const labelSpan=document.createElement('span');
        labelSpan.className='label';
        labelSpan.textContent=buildGuestLabel(guest);
        pill.appendChild(labelSpan);

        pill.addEventListener('click',()=>{
          if(!included){
            includeGuest(guest.id);
            return;
          }
          if(uniform){
            return;
          }
          setActiveGuest(guest.id);
        });
        pill.addEventListener('keydown',e=>{
          if(!included && (e.key==='Enter' || e.key===' ' || e.key==='Spacebar')){
            e.preventDefault();
            includeGuest(guest.id);
          }
        });
        if(included){
          wrapper.classList.add('has-confirm');
          pill.setAttribute('aria-label', uniform ? `${guest.name} selected` : `Edit selections for ${guest.name}`);
        }else{
          pill.setAttribute('aria-label',`Include ${guest.name} in this appointment`);
        }

        wrapper.appendChild(pill);

        if(included){
          // The checkmark replaces the hover “X” affordance from the roster chips;
          // keeping it inside the pill ensures the modal visuals stay pixel-identical
          // while still exposing a separate button for confirmation.
          const confirmBtn=document.createElement('button');
          confirmBtn.type='button';
          confirmBtn.className='spa-guest-confirm-toggle';
          confirmBtn.dataset.spaNoSubmit='true';
          confirmBtn.setAttribute('aria-pressed', confirmed ? 'true' : 'false');
          confirmBtn.setAttribute('aria-label', confirmed ? `Unconfirm ${guest.name}'s selections` : `Confirm ${guest.name}'s selections`);
          confirmBtn.innerHTML = `${checkSvg}<span class="sr-only">${confirmed ? `Unconfirm ${guest.name}'s selections` : `Confirm ${guest.name}'s selections`}</span>`;
          confirmBtn.addEventListener('click',e=>{
            e.stopPropagation();
            setGuestConfirmed(guest.id, !confirmed);
          });
          wrapper.appendChild(confirmBtn);
        }

        guestList.appendChild(wrapper);
      });

      if(assigned.length===0){
        guestHint.hidden=false;
        guestHint.textContent='Select at least one guest to add a spa appointment.';
        guestHint.classList.add('spa-helper-error');
      }else if(confirmedCount>0 && confirmedCount<assigned.length){
        guestHint.hidden=false;
        const namesText = outstandingNames.length ? `Confirm selections for: ${outstandingNames.join(', ')}. ` : '';
        guestHint.textContent=`${namesText}Confirm all guests or clear confirmations to apply to all.`.trim();
        guestHint.classList.add('spa-helper-error');
      }else{
        guestHint.hidden=true;
        guestHint.textContent='';
        guestHint.classList.remove('spa-helper-error');
      }

      updateConfirmState();
    }

    function includeGuest(id){
      if(!id || assignedSet.has(id)){
        if(id && assignedSet.has(id) && !inUniformMode()){
          setActiveGuest(id);
        }
        return;
      }
      assignedSet.add(id);
      const template = ensureTemplateSelection();
      const canonical = inUniformMode() ? (getCanonicalSelection() || template) : template;
      const nextSelection = canonical ? { ...canonical, guestId: id } : { ...template, guestId: id };
      selections.set(id, nextSelection);
      guestConfirmState.set(id, false);
      assignedIds = orderedAssigned();
      if(inUniformMode()){
        syncTemplateFromSourceId(id);
      }else{
        activeGuestId = id;
      }
      updateGuestControls();
      refreshAllControls();
    }

    function removeGuest(id){
      if(!assignedSet.has(id)) return;
      assignedSet.delete(id);
      selections.delete(id);
      guestConfirmState.delete(id);
      const assigned = orderedAssigned();
      assignedIds = assigned;
      if(assigned.length===0){
        activeGuestId = null;
      }else if(activeGuestId && !assignedSet.has(activeGuestId)){
        const fallback = assigned.find(gid => !guestConfirmState.get(gid)) || null;
        activeGuestId = fallback;
      }
      updateGuestControls();
      refreshAllControls();
    }

    function setGuestConfirmed(id, confirmed){
      if(!assignedSet.has(id)) return;
      const next = !!confirmed;
      guestConfirmState.set(id, next);
      if(next){
        const fallback = orderedAssigned().find(gid => !guestConfirmState.get(gid));
        activeGuestId = fallback || id;
      }else{
        activeGuestId = id;
      }
      updateGuestControls();
      updateConfirmState();
    }

    function setActiveGuest(id){
      if(!assignedSet.has(id)) return;
      if(inUniformMode()) return;
      if(activeGuestId===id) return;
      if(guestConfirmState.get(id)) return;
      activeGuestId = id;
      updateGuestControls();
      refreshAllControls();
    }

    function markGuestsDirty(ids){
      let touched=false;
      ids.forEach(targetId => {
        if(targetId===TEMPLATE_ID) return;
        if(guestConfirmState.get(targetId)){
          guestConfirmState.set(targetId, false);
          touched=true;
        }
      });
      if(touched){
        updateGuestControls();
      }else{
        updateConfirmState();
      }
    }

    const serviceSection=document.createElement('section');
    serviceSection.className='spa-section spa-section-services';
    const serviceCard=document.createElement('div');
    serviceCard.className='spa-block spa-service-card';
    const serviceHeading=document.createElement('h3');
    serviceHeading.textContent='Service';
    serviceCard.appendChild(serviceHeading);
    const serviceList=document.createElement('div');
    serviceList.className='spa-service-list';
    serviceList.setAttribute('role','tree');
    serviceList.setAttribute('aria-label','Spa services');
    const serviceScroll=document.createElement('div');
    serviceScroll.className='spa-service-scroll';
    serviceScroll.appendChild(serviceList);
    serviceCard.appendChild(serviceScroll);
    serviceSection.appendChild(serviceCard);

    // Auto-hide scrollbar: apply a class while the user scrolls or hovers so we
    // can expose a thin thumb, then clear it after a short idle period.
    let serviceScrollTimer=null;
    const queueServiceScrollReset=()=>{
      if(serviceScrollTimer) clearTimeout(serviceScrollTimer);
      serviceScrollTimer=setTimeout(()=>{
        serviceScroll.classList.remove('is-scrolling');
      }, 650);
    };
    const activateServiceScroll=()=>{
      serviceScroll.classList.add('is-scrolling');
      queueServiceScrollReset();
    };
    serviceScroll.addEventListener('scroll', activateServiceScroll, { passive:true });
    serviceScroll.addEventListener('wheel', activateServiceScroll, { passive:true });
    serviceScroll.addEventListener('pointermove', activateServiceScroll);
    serviceScroll.addEventListener('pointerdown', activateServiceScroll);
    serviceScroll.addEventListener('pointerenter', activateServiceScroll);
    serviceScroll.addEventListener('pointerleave', queueServiceScrollReset);

    // Category/subcategory accordions share a single state object so only one path
    // stays open at a time. This keeps the vertical stack compact, aligns the
    // hairline separators with the Activities column, and lets the scrollable
    // services pane live entirely inside the modal body.
    const cascadeState = {
      expandedCategoryId: null,
      expandedSubcategoryId: null
    };
    const categoryRows = new Map();
    const categoryPanels = new Map();
    const subcategoryRows = new Map();
    const subcategoryPanels = new Map();
    const serviceOptionButtons = new Map();
    let cascadeUserNavigated = false;

    const chevronSvg = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M5.22 2.97a.75.75 0 0 0 0 1.06L9.19 8l-3.97 3.97a.75.75 0 1 0 1.06 1.06l4.5-4.5a.75.75 0 0 0 0-1.06l-4.5-4.5a.75.75 0 0 0-1.06 0Z" fill="currentColor"/></svg>';
    const createChevron = () => {
      const span=document.createElement('span');
      span.className='spa-cascade-chevron';
      span.innerHTML=chevronSvg;
      span.setAttribute('aria-hidden','true');
      return span;
    };

    const setPanelState = (panel, open) => {
      if(!panel) return;
      panel.dataset.open = open ? 'true' : 'false';
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    };

    const applyCascadeState = () => {
      const activeCategoryId = cascadeState.expandedCategoryId;
      if(activeCategoryId && !categoryRows.has(activeCategoryId)){
        cascadeState.expandedCategoryId = null;
      }
      const activeSubId = cascadeState.expandedSubcategoryId;
      if(activeSubId && (!cascadeState.expandedCategoryId || !subcategoryPanels.has(`${cascadeState.expandedCategoryId}::${activeSubId}`))){
        cascadeState.expandedSubcategoryId = null;
      }

      categoryRows.forEach((row, id) => {
        const open = cascadeState.expandedCategoryId === id;
        row.setAttribute('aria-expanded', open ? 'true' : 'false');
        row.setAttribute('aria-label', `${open ? 'Collapse' : 'Open'} category: ${row.dataset.label}`);
        row.classList.toggle('open', open);
        setPanelState(categoryPanels.get(id), open);
        if(!open && activeSubId && subcategoryPanels.has(`${id}::${activeSubId}`)){
          cascadeState.expandedSubcategoryId = null;
        }
      });
      subcategoryRows.forEach((row, key) => {
        const catId = row.dataset.categoryId;
        const subId = row.dataset.subcategoryId;
        const categoryOpen = cascadeState.expandedCategoryId === catId;
        const open = categoryOpen && cascadeState.expandedSubcategoryId === subId;
        row.setAttribute('aria-expanded', open ? 'true' : 'false');
        row.setAttribute('aria-label', `${open ? 'Collapse' : 'Open'} sub-category: ${row.dataset.label}`);
        row.classList.toggle('open', open);
        row.tabIndex = categoryOpen ? 0 : -1;
        setPanelState(subcategoryPanels.get(key), open);
      });
      serviceOptionButtons.forEach(meta => {
        const { button, categoryId, subcategoryId } = meta;
        const categoryOpen = cascadeState.expandedCategoryId === categoryId;
        const subOpen = subcategoryId ? cascadeState.expandedSubcategoryId === subcategoryId : true;
        const visible = categoryOpen && subOpen;
        button.tabIndex = visible ? 0 : -1;
      });
    };

    const ensureCascadeForService = serviceName => {
      if(!cascadeUserNavigated) return;
      const meta = catalog.byName.get(serviceName);
      if(!meta) return;
      cascadeState.expandedCategoryId = meta.displayCategoryId || cascadeState.expandedCategoryId;
      if(meta.displaySubcategoryId){
        cascadeState.expandedSubcategoryId = meta.displaySubcategoryId;
      }else if(cascadeState.expandedCategoryId === meta.displayCategoryId){
        cascadeState.expandedSubcategoryId = null;
      }
    };

    catalog.categories.forEach(category => {
      const categoryRow=document.createElement('button');
      categoryRow.type='button';
      categoryRow.className='spa-cascade-row spa-category-row';
      categoryRow.dataset.label = category.label;
      categoryRow.dataset.categoryId = category.id;
      categoryRow.id = `spa-category-trigger-${category.id}`;
      categoryRow.setAttribute('aria-expanded','false');
      categoryRow.setAttribute('aria-controls', `spa-category-panel-${category.id}`);
      categoryRow.setAttribute('aria-label',`Open category: ${category.label}`);
      categoryRow.tabIndex = 0;
      const categoryLabel=document.createElement('span');
      categoryLabel.className='spa-cascade-label';
      categoryLabel.textContent=category.label;
      categoryRow.appendChild(categoryLabel);
      categoryRow.appendChild(createChevron());
      serviceList.appendChild(categoryRow);
      categoryRows.set(category.id, categoryRow);

      const categoryPanel=document.createElement('div');
      categoryPanel.className='spa-cascade-panel spa-category-panel';
      categoryPanel.id = `spa-category-panel-${category.id}`;
      categoryPanel.setAttribute('role','group');
      categoryPanel.dataset.categoryPanel = category.id;
      const categoryPanelInner=document.createElement('div');
      categoryPanelInner.className='spa-cascade-panel-inner';
      categoryPanel.appendChild(categoryPanelInner);
      serviceList.appendChild(categoryPanel);
      categoryPanels.set(category.id, categoryPanel);

      const expandCategory = () => {
        cascadeUserNavigated = true;
        const isOpen = cascadeState.expandedCategoryId === category.id;
        cascadeState.expandedCategoryId = isOpen ? null : category.id;
        if(isOpen){
          cascadeState.expandedSubcategoryId = null;
        }
        applyCascadeState();
      };

      categoryRow.addEventListener('click', expandCategory);
      categoryRow.addEventListener('keydown', e => {
        if(e.key==='ArrowRight'){
          e.preventDefault();
          if(cascadeState.expandedCategoryId !== category.id){
            cascadeUserNavigated = true;
            cascadeState.expandedCategoryId = category.id;
            applyCascadeState();
          }else if(category.subcategories && category.subcategories.length){
            const first = category.subcategories[0];
            if(first){
              cascadeUserNavigated = true;
              cascadeState.expandedSubcategoryId = first.id;
              applyCascadeState();
              const key = `${category.id}::${first.id}`;
              subcategoryRows.get(key)?.focus();
            }
          }else if(category.services.length){
            const firstService = serviceOptionButtons.get(category.services[0].name);
            firstService?.button.focus();
          }
        }
          if(e.key==='ArrowLeft'){
            e.preventDefault();
            if(category.subcategories && category.subcategories.length && cascadeState.expandedSubcategoryId){
              cascadeState.expandedSubcategoryId = null;
              applyCascadeState();
            }else if(cascadeState.expandedCategoryId === category.id){
              cascadeState.expandedCategoryId = null;
              cascadeState.expandedSubcategoryId = null;
              applyCascadeState();
            }
          }
      });

      if(category.subcategories && category.subcategories.length){
        category.subcategories.forEach(subcategory => {
          const subKey = `${category.id}::${subcategory.id}`;
          const subRow=document.createElement('button');
          subRow.type='button';
          subRow.className='spa-cascade-row spa-subcategory-row';
          subRow.dataset.categoryId = category.id;
          subRow.dataset.subcategoryId = subcategory.id;
          subRow.dataset.label = subcategory.label;
          subRow.id = `spa-subcategory-trigger-${subcategory.id}`;
          subRow.setAttribute('aria-expanded','false');
          subRow.setAttribute('aria-controls',`spa-subcategory-panel-${subcategory.id}`);
          subRow.setAttribute('aria-label',`Open sub-category: ${subcategory.label}`);
          subRow.tabIndex = -1;
          const subLabel=document.createElement('span');
          subLabel.className='spa-cascade-label';
          subLabel.textContent=subcategory.label;
          subRow.appendChild(subLabel);
          subRow.appendChild(createChevron());
          categoryPanelInner.appendChild(subRow);
          subcategoryRows.set(subKey, subRow);

          const subPanel=document.createElement('div');
          subPanel.className='spa-cascade-panel spa-subcategory-panel';
          subPanel.id = `spa-subcategory-panel-${subcategory.id}`;
          subPanel.setAttribute('role','group');
          subPanel.dataset.subcategoryPanel = subcategory.id;
          const subPanelInner=document.createElement('div');
          subPanelInner.className='spa-cascade-panel-inner';
          subPanel.appendChild(subPanelInner);
          categoryPanelInner.appendChild(subPanel);
          subcategoryPanels.set(subKey, subPanel);

          const expandSub = () => {
            cascadeUserNavigated = true;
            const categoryOpen = cascadeState.expandedCategoryId === category.id;
            const isOpen = categoryOpen && cascadeState.expandedSubcategoryId === subcategory.id;
            cascadeState.expandedCategoryId = category.id;
            cascadeState.expandedSubcategoryId = isOpen ? null : subcategory.id;
            applyCascadeState();
          };

          subRow.addEventListener('click', expandSub);
          subRow.addEventListener('keydown', e => {
            if(e.key==='ArrowRight'){
              e.preventDefault();
              cascadeState.expandedCategoryId = category.id;
              cascadeState.expandedSubcategoryId = subcategory.id;
              cascadeUserNavigated = true;
              applyCascadeState();
              const firstService = subcategory.services[0];
              if(firstService){
                serviceOptionButtons.get(firstService.name)?.button.focus();
              }
            }
            if(e.key==='ArrowLeft'){
              e.preventDefault();
              cascadeState.expandedSubcategoryId = null;
              applyCascadeState();
              categoryRow.focus();
            }
          });

          subcategory.services.forEach(service => {
            const option=document.createElement('button');
            option.type='button';
            option.className='spa-service-button';
            option.dataset.serviceName = service.name;
            option.dataset.categoryId = category.id;
            option.dataset.subcategoryId = subcategory.id;
            option.textContent=service.name;
            option.setAttribute('aria-pressed','false');
            option.setAttribute('aria-label',`Select service: ${service.name}`);
            option.tabIndex = -1;
            option.addEventListener('click',()=>{
              cascadeUserNavigated = true;
              selectService(service.name);
            });
            option.addEventListener('keydown', e => {
              if(e.key==='ArrowLeft'){
                e.preventDefault();
                subRow.focus();
              }
            });
            subPanelInner.appendChild(option);
            serviceOptionButtons.set(service.name, { button: option, categoryId: category.id, subcategoryId: subcategory.id });
          });
        });
      }else{
        category.services.forEach(service => {
          const option=document.createElement('button');
          option.type='button';
          option.className='spa-service-button';
          option.dataset.serviceName = service.name;
          option.dataset.categoryId = category.id;
          option.textContent=service.name;
          option.setAttribute('aria-pressed','false');
          option.setAttribute('aria-label',`Select service: ${service.name}`);
          option.tabIndex = -1;
          option.addEventListener('click',()=>{
            cascadeUserNavigated = true;
            selectService(service.name);
          });
          option.addEventListener('keydown', e => {
            if(e.key==='ArrowLeft'){
              e.preventDefault();
              categoryRow.focus();
            }
          });
          categoryPanelInner.appendChild(option);
          serviceOptionButtons.set(service.name, { button: option, categoryId: category.id, subcategoryId: null });
        });
      }
    });

    applyCascadeState();

    layout.appendChild(serviceSection);

    const detailsSection=document.createElement('section');
    detailsSection.className='spa-section spa-section-details';
    const detailsGrid=document.createElement('div');
    // Right-half layout: the grid owns two column subgrids stacked above the
    // full-width guests row. Column 1 (therapist/location) splits its height
    // 50/50, while column 2 (start time/duration) reserves roughly 3/4 for the
    // picker and 1/4 for duration so the controls stay proportionally balanced.
    detailsGrid.className='spa-details-grid';
    detailsSection.appendChild(detailsGrid);

    const primaryColumn=document.createElement('div');
    primaryColumn.className='spa-detail-column spa-detail-column-primary';
    detailsGrid.appendChild(primaryColumn);

    const secondaryColumn=document.createElement('div');
    secondaryColumn.className='spa-detail-column spa-detail-column-secondary';
    detailsGrid.appendChild(secondaryColumn);
    layout.appendChild(detailsSection);

    const durationGroup=document.createElement('div');
    durationGroup.className='spa-block spa-detail-card spa-detail-card-duration';
    const durationHeading=document.createElement('h3');
    durationHeading.textContent='Duration';
    durationGroup.appendChild(durationHeading);
    const durationList=document.createElement('div');
    durationList.className='spa-duration-list';
    durationList.setAttribute('role','radiogroup');
    durationList.setAttribute('aria-label','Duration');
    durationGroup.appendChild(durationList);

    const timeGroup=document.createElement('div');
    timeGroup.className='spa-block spa-detail-card spa-detail-card-time';
    const timeHeading=document.createElement('h3');
    timeHeading.textContent='Start Time';
    timeGroup.appendChild(timeHeading);
    const timeContainer=document.createElement('div');
    timeContainer.className='spa-time-picker';
    timeGroup.appendChild(timeContainer);
    const endPreview=document.createElement('div');
    endPreview.className='spa-end-preview';
    endPreview.setAttribute('aria-live','polite');
    const startTimeDisplay=document.createElement('button');
    startTimeDisplay.type='button';
    startTimeDisplay.className='spa-start-time-display';
    startTimeDisplay.setAttribute('aria-label','Edit start time manually');
    const timeSeparator=document.createElement('span');
    timeSeparator.className='spa-time-separator';
    timeSeparator.textContent='–';
    const endTimeValue=document.createElement('span');
    endTimeValue.className='spa-end-time-value';
    endPreview.appendChild(startTimeDisplay);
    endPreview.appendChild(timeSeparator);
    endPreview.appendChild(endTimeValue);
    timeGroup.appendChild(endPreview);
    const timeHint=document.createElement('p');
    timeHint.className='spa-helper-text spa-time-hint';
    timeHint.id='spa-time-hint';
    timeHint.hidden=true;
    startTimeDisplay.setAttribute('aria-describedby', timeHint.id);
    timeGroup.appendChild(timeHint);

    let startTimeInput=null;
    let startTimeEditing=false;

    const therapistGroup=document.createElement('div');
    therapistGroup.className='spa-block spa-detail-card spa-detail-card-therapist';
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

    const locationGroup=document.createElement('div');
    locationGroup.className='spa-block spa-detail-card spa-detail-card-location';
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
    locationHelper.className='spa-helper-text sr-only';
    locationHelper.id='spa-location-inroom-helper';
    locationHelper.setAttribute('aria-live','polite');
    // Keep the helper text sr-only so the gating reason is announced for assistive
    // tech without reserving vertical space, preventing layout shifts when
    // availability toggles.
    locationList.setAttribute('aria-describedby', locationHelper.id);
    locationGroup.appendChild(locationList);
    locationGroup.appendChild(locationHelper);
    secondaryColumn.appendChild(timeGroup);
    secondaryColumn.appendChild(durationGroup);
    primaryColumn.appendChild(therapistGroup);
    primaryColumn.appendChild(locationGroup);
    detailsGrid.appendChild(guestSection);

    const actions=document.createElement('div');
    actions.className='spa-actions';
    const confirmBtn=document.createElement('button');
    confirmBtn.type='button';
    confirmBtn.className='spa-confirm';
    const confirmLabel = (mode==='edit' || existing) ? 'Update spa appointment' : 'Add spa appointment';
    // Match the dinner flow: the visible copy is the plus glyph while screen
    // readers receive a descriptive label so both dialogs share the same
    // primary-action affordance.
    confirmBtn.innerHTML = `<span aria-hidden="true">+</span><span class="sr-only">${confirmLabel}</span>`;
    confirmBtn.setAttribute('aria-label', confirmLabel);
    actions.appendChild(confirmBtn);
    let removeBtn=null;
    if(mode==='edit' && existing){
      removeBtn=document.createElement('button');
      removeBtn.type='button';
      removeBtn.className='spa-remove';
      removeBtn.innerHTML=`${trashSvg}<span class="sr-only">Remove spa appointment</span>`;
      actions.appendChild(removeBtn);
    }
    // Floating action cluster: the container anchors the + pill to the modal's
    // bottom-right corner while keeping the optional delete button alongside it,
    // and the shared aria-label keeps the accessible add/update copy intact.
    body.appendChild(actions);

    const previousFocus=document.activeElement;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    document.body.classList.add('spa-lock');
    // Reset scroll so reopen/edit flows land at the top of the sheet regardless
    // of the previous scroll position.
    body.scrollTop = 0;
    dialog.scrollTop = 0;
    requestAnimationFrame(()=>{
      // Running the reset again on the next frame guards against any focus
      // shifting that might try to restore the previous scroll offset.
      body.scrollTop = 0;
      dialog.scrollTop = 0;
      body.scrollTo?.({ top:0, left:0, behavior:'auto' });
      dialog.scrollTo?.({ top:0, left:0, behavior:'auto' });
    });

    const initialTimeValue = from24Time(getCanonicalSelection()?.start || defaultSpaStartTime);
    // Replace the AM/PM wheel with a segmented toggle so SPA flows keep the
    // shared hour/minute physics while presenting a two-state, radiogroup-driven
    // control for keyboard and screen reader users.
    const MERIDIEM_VALUES = ['AM','PM'];
    const meridiemButtons = new Map();
    const syncMeridiemToggle = meridiem => {
      const normalized = meridiem === 'PM' ? 'PM' : 'AM';
      meridiemButtons.forEach((btn, value) => {
        const selected = value === normalized;
        btn.classList.toggle('selected', selected);
        btn.setAttribute('aria-checked', selected ? 'true' : 'false');
        btn.tabIndex = selected ? 0 : -1;
      });
    };

    const handleTimeChange = value => {
      const targets = resolveEditableTargets();
      const nextStart = to24Time(value);
      let touched = false;
      targets.forEach(id => {
        const selection = getSelectionFor(id);
        const prevStart = selection.start;
        const prevEnd = selection.end;
        const nextEnd = addMinutesToTime(nextStart, selection.durationMinutes);
        selection.start = nextStart;
        // Duration drives end time: recompute whenever start shifts so the preview stays live.
        selection.end = nextEnd;
        if(prevStart !== selection.start || prevEnd !== selection.end){
          touched = true;
        }
      });
      const sourceId = targets[0] || TEMPLATE_ID;
      syncTemplateFromSourceId(sourceId);
      if(touched){
        markGuestsDirty(targets);
      }else{
        updateConfirmState();
      }
      timeHint.hidden = true;
      timeHint.textContent='';
      if(startTimeEditing && startTimeInput){
        startTimeInput.removeAttribute('aria-invalid');
      }
      refreshEndPreview();
      syncMeridiemToggle(value.meridiem);
    };

    // Left/right arrows hop between the hour, minute, and AM/PM columns while
    // keeping each wheel's existing up/down physics untouched.
    const columnFocusOrder = [];
    const registerTimeColumn = (element, focus) => {
      if(!element) return -1;
      columnFocusOrder.push({
        element,
        focus: () => {
          if(typeof focus === 'function'){
            focus();
          }else{
            focusWithoutScroll(element);
          }
        }
      });
      return columnFocusOrder.length - 1;
    };
    const focusTimeColumn = index => {
      if(!columnFocusOrder.length) return;
      const normalized = (index + columnFocusOrder.length) % columnFocusOrder.length;
      const entry = columnFocusOrder[normalized];
      if(entry){
        entry.focus();
      }
    };
    let hourColumnIndex = -1;
    let minuteColumnIndex = -1;
    let meridiemColumnIndex = -1;

    const timePicker = createTimePicker ? createTimePicker({
      hourRange:[1,12],
      minuteStep:5,
      showAmPm:true,
      defaultValue: initialTimeValue,
      ariaLabels:{ hours:'Spa hour', minutes:'Spa minutes', meridiem:'AM or PM' },
      onChange: handleTimeChange
    }) : null;

    if(timePicker?.hourWheel?.element){
      hourColumnIndex = registerTimeColumn(timePicker.hourWheel.element, () => {
        if(typeof timePicker.hourWheel.focus === 'function'){
          timePicker.hourWheel.focus({ preventScroll:true });
        }else{
          focusWithoutScroll(timePicker.hourWheel.element);
        }
      });
    }
    if(timePicker?.minuteWheel?.element){
      minuteColumnIndex = registerTimeColumn(timePicker.minuteWheel.element, () => {
        if(typeof timePicker.minuteWheel.focus === 'function'){
          timePicker.minuteWheel.focus({ preventScroll:true });
        }else{
          focusWithoutScroll(timePicker.minuteWheel.element);
        }
      });
    }

    // Route segmented toggle changes through the picker change handler so the
    // AM/PM state, wheel physics, and selection model stay perfectly aligned.
    const handleMeridiemInput = (value, { focus, externalValue } = {}) => {
      if(!timePicker) return;
      const normalized = value === 'PM' ? 'PM' : 'AM';
      if(typeof timePicker.setMeridiem === 'function'){
        timePicker.setMeridiem(normalized);
      }else{
        timePicker.meridiemWheel?.setValue?.(normalized);
      }
      const snapshot = timePicker.getValue?.();
      const nextValue = externalValue ? { ...externalValue, meridiem: normalized } : snapshot ? { ...snapshot, meridiem: normalized } : {
        hour: timePicker.hourWheel?.value ?? initialTimeValue.hour,
        minute: timePicker.minuteWheel?.value ?? initialTimeValue.minute,
        meridiem: normalized
      };
      handleTimeChange(nextValue);
      if(focus){
        const btn = meridiemButtons.get(nextValue.meridiem);
        if(btn){
          focusWithoutScroll(btn);
        }
      }
    };

    startTimeDisplay.textContent='—';
    timeSeparator.hidden=true;

    if(timePicker){
      timeContainer.appendChild(timePicker.element);
      if(hourColumnIndex>-1){
        timePicker.hourWheel.element.addEventListener('keydown', e => {
          if(e.key==='ArrowLeft'){
            e.preventDefault();
            focusTimeColumn(hourColumnIndex - 1);
          }
          if(e.key==='ArrowRight'){
            e.preventDefault();
            focusTimeColumn(hourColumnIndex + 1);
          }
        });
      }
      if(minuteColumnIndex>-1){
        timePicker.minuteWheel.element.addEventListener('keydown', e => {
          if(e.key==='ArrowLeft'){
            e.preventDefault();
            focusTimeColumn(minuteColumnIndex - 1);
          }
          if(e.key==='ArrowRight'){
            e.preventDefault();
            focusTimeColumn(minuteColumnIndex + 1);
          }
        });
      }
      if(timePicker.meridiemWheel?.element){
        timePicker.meridiemWheel.element.setAttribute('tabindex','-1');
        const parent = timePicker.meridiemWheel.element.parentElement;
        if(parent){
          parent.setAttribute('aria-hidden','true');
        }
      }
      const toggle=document.createElement('div');
      toggle.className='spa-meridiem-toggle';
      toggle.setAttribute('role','radiogroup');
      toggle.setAttribute('aria-label','Select AM or PM');
      meridiemColumnIndex = registerTimeColumn(toggle, () => {
        const selected = Array.from(meridiemButtons.values()).find(btn => btn.getAttribute('aria-checked')==='true');
        const target = selected || toggle.querySelector('button');
        focusWithoutScroll(target);
      });
      MERIDIEM_VALUES.forEach(value => {
        const radio=document.createElement('button');
        radio.type='button';
        radio.className='spa-meridiem-option';
        radio.dataset.value = value;
        radio.setAttribute('role','radio');
        radio.setAttribute('aria-checked','false');
        radio.tabIndex = -1;
        radio.textContent = value;
        radio.addEventListener('click',()=>{
          handleMeridiemInput(value);
        });
        radio.addEventListener('keydown',e=>{
          if(e.key==='ArrowUp' || e.key==='ArrowDown'){
            e.preventDefault();
            const direction = e.key==='ArrowUp' ? -1 : 1;
            const index = MERIDIEM_VALUES.indexOf(value);
            const nextIndex = (index + direction + MERIDIEM_VALUES.length) % MERIDIEM_VALUES.length;
            handleMeridiemInput(MERIDIEM_VALUES[nextIndex], { focus:true });
            return;
          }
          if(e.key==='ArrowLeft'){
            e.preventDefault();
            focusTimeColumn(meridiemColumnIndex - 1);
            return;
          }
          if(e.key==='ArrowRight'){
            e.preventDefault();
            focusTimeColumn(meridiemColumnIndex + 1);
          }
        });
        toggle.appendChild(radio);
        meridiemButtons.set(value, radio);
      });
      timeContainer.appendChild(toggle);
      syncMeridiemToggle(initialTimeValue.meridiem);
    }else{
      const fallback=document.createElement('div');
      fallback.className='time-picker-fallback';
      fallback.textContent='Time picker unavailable.';
      timeContainer.appendChild(fallback);
    }

    // Parse freeform times like “7am” or “7 00 am” while rejecting entries that
    // omit a meridiem. Canonicalised values snap to the 5-minute wheel cadence
    // so manual edits remain in sync with the kinetic picker.
    function parseManualTimeInput(raw){
      if(raw==null) return { error:'missing-meridiem' };
      const trimmed = String(raw).trim();
      if(trimmed==='') return { error:'missing-meridiem' };
      const compact = trimmed.toLowerCase().replace(/\s+/g,'');
      if(!/(am|pm)$/.test(compact)){
        return { error:'missing-meridiem' };
      }
      const match = compact.match(/^(\d{1,2})(?::?(\d{2}))?(am|pm)$/);
      if(!match) return { error:'invalid' };
      const hour = Number(match[1]);
      const minute = match[2]!==undefined ? Number(match[2]) : 0;
      if(!Number.isInteger(hour) || hour<1 || hour>12) return { error:'invalid' };
      if(!Number.isInteger(minute) || minute<0 || minute>59) return { error:'invalid' };
      if(minute % 5 !== 0) return { error:'invalid' };
      return { hour, minute, meridiem: match[3].toUpperCase() };
    }

    function finalizeStartTimeEdit(commit){
      if(!startTimeEditing) return;
      const input = startTimeInput;
      if(!input) return;
      if(commit){
        const parsed = parseManualTimeInput(input.value);
        if(parsed.error){
          timeHint.textContent = parsed.error==='missing-meridiem' ? 'Include am or pm' : 'Enter a valid time (e.g., 7:00 AM)';
          timeHint.hidden = false;
          input.setAttribute('aria-invalid','true');
          setTimeout(()=>{
            input.focus({ preventScroll:true });
            input.select();
          },0);
          return;
        }
        input.removeAttribute('aria-invalid');
        timeHint.hidden = true;
        const canonical = fmt12(to24Time(parsed));
        startTimeDisplay.textContent = canonical;
        if(timePicker){
          timePicker.hourWheel?.setValue?.(parsed.hour);
          timePicker.minuteWheel?.setValue?.(parsed.minute);
        }
        handleMeridiemInput(parsed.meridiem, { externalValue: parsed });
      }else{
        timeHint.hidden = true;
        timeHint.textContent='';
      }
      input.replaceWith(startTimeDisplay);
      startTimeInput = null;
      startTimeEditing = false;
      if(!commit){
        startTimeDisplay.focus({ preventScroll:true });
      }
    }

    function openStartTimeEditor(){
      if(startTimeEditing) return;
      startTimeEditing = true;
      timeHint.hidden = true;
      timeHint.textContent='';
      const input=document.createElement('input');
      input.type='text';
      input.className='spa-start-time-input';
      input.value = startTimeDisplay.textContent?.trim() || '';
      input.setAttribute('aria-label','Start time');
      input.setAttribute('aria-describedby', timeHint.id);
      input.setAttribute('autocomplete','off');
      input.setAttribute('autocapitalize','none');
      input.setAttribute('spellcheck','false');
      input.setAttribute('inputmode','text');
      input.placeholder='e.g. 7:00 AM';
      input.dataset.spaNoSubmit='true';
      startTimeDisplay.replaceWith(input);
      startTimeInput = input;
      requestAnimationFrame(()=>{
        input.focus({ preventScroll:true });
        input.select();
      });
      input.addEventListener('blur',()=> finalizeStartTimeEdit(true));
      // Enter commits the parsed time but never auto-submits the dialog so users
      // can move on to other fields.
      input.addEventListener('keydown',e=>{
        if(e.key==='Enter'){
          e.preventDefault();
          e.stopPropagation();
          finalizeStartTimeEdit(true);
        }
        if(e.key==='Escape'){
          e.preventDefault();
          e.stopPropagation();
          finalizeStartTimeEdit(false);
        }
      });
    }

    startTimeDisplay.addEventListener('click', openStartTimeEditor);

    function refreshServiceOptions(){
      const selection = getCanonicalSelection();
      const activeName = selection?.serviceName || defaultService?.name || '';
      if(activeName){
        ensureCascadeForService(activeName);
      }
      serviceOptionButtons.forEach(({ button }, name) => {
        const selected = name===activeName;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', selected ? 'true' : 'false');
        button.setAttribute('aria-label', selected ? `Selected service: ${name}` : `Select service: ${name}`);
      });
      applyCascadeState();
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
        // Buttons surface numerals only while the aria-label keeps the
        // descriptive "-Minute" phrasing for assistive tech parity.
        btn.textContent=formatDurationButtonLabel(minutes);
        btn.setAttribute('aria-label', formatDurationLabel(minutes));
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
      // The helper content remains present for screen readers only; visually the
      // layout stays fixed because the element never takes up space.
      if(!supportsInRoom){
        locationHelper.textContent='In-Room service is unavailable for this treatment.';
      }else{
        locationHelper.textContent='';
      }
    }

    function refreshTimePickerSelection(){
      const selection = getCanonicalSelection();
      if(!selection || !timePicker) return;
      const { hour, minute, meridiem } = from24Time(selection.start);
      timePicker.hourWheel?.setValue?.(hour);
      timePicker.minuteWheel?.setValue?.(minute);
      if(typeof timePicker.setMeridiem === 'function'){
        timePicker.setMeridiem(meridiem);
      }else{
        timePicker.meridiemWheel?.setValue?.(meridiem);
      }
      syncMeridiemToggle(meridiem);
    }

    function refreshEndPreview(){
      const selection = getCanonicalSelection();
      if(selection){
        const startLabel = fmt12(selection.start);
        const endLabel = fmt12(selection.end);
        if(startTimeEditing && startTimeInput){
          startTimeInput.value = startLabel;
        }else{
          startTimeDisplay.textContent = startLabel;
        }
        timeSeparator.hidden = false;
        endTimeValue.textContent = endLabel;
      }else{
        if(startTimeEditing && startTimeInput){
          startTimeInput.value = '';
        }else{
          startTimeDisplay.textContent = '—';
        }
        timeSeparator.hidden = true;
        endTimeValue.textContent = '';
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
      const hasGuests = orderedAssigned().length>0;
      const ready = hasGuests && areGuestsReady();
      confirmBtn.disabled = !ready;
      confirmBtn.setAttribute('aria-disabled', ready ? 'false' : 'true');
    }

    function selectService(name){
      const service = findService(name) || defaultService;
      const targets = resolveEditableTargets();
      let touched = false;
      targets.forEach(id => {
        const selection = getSelectionFor(id, service);
        const prevService = selection.serviceName;
        const prevDuration = selection.durationMinutes;
        const prevLocation = selection.location;
        const prevSupports = selection.supportsInRoom;
        const prevEnd = selection.end;
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
        if(selection.serviceName!==prevService || selection.durationMinutes!==prevDuration || selection.location!==prevLocation || selection.supportsInRoom!==prevSupports || selection.end!==prevEnd){
          touched = true;
        }
      });
      if(touched){
        markGuestsDirty(targets);
      }else{
        updateConfirmState();
      }
      if(targets.length){
        syncTemplateFromSourceId(targets[0]);
      }
      refreshAllControls();
    }

    function selectDuration(minutes){
      const targets = resolveEditableTargets();
      let touched = false;
      targets.forEach(id => {
        const selection = getSelectionFor(id);
        const prevDuration = selection.durationMinutes;
        const prevEnd = selection.end;
        selection.durationMinutes = minutes;
        selection.end = addMinutesToTime(selection.start, minutes);
        if(selection.durationMinutes!==prevDuration || selection.end!==prevEnd){
          touched = true;
        }
      });
      if(touched){
        markGuestsDirty(targets);
      }else{
        updateConfirmState();
      }
      if(targets.length){
        syncTemplateFromSourceId(targets[0]);
      }
      refreshAllControls();
    }

    function selectTherapist(id){
      const targets = resolveEditableTargets();
      let touched = false;
      targets.forEach(targetId => {
        const selection = getSelectionFor(targetId);
        const prevTherapist = selection.therapist;
        selection.therapist = id;
        if(selection.therapist!==prevTherapist){
          touched = true;
        }
      });
      if(touched){
        markGuestsDirty(targets);
      }else{
        updateConfirmState();
      }
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
        // Surface the same helper copy for assistive tech without revealing
        // a visual banner so the modal never jumps.
        locationHelper.textContent='In-Room service is unavailable for this treatment.';
        return;
      }
      const targets = resolveEditableTargets();
      let touched = false;
      targets.forEach(targetId => {
        const selection = getSelectionFor(targetId);
        const service = findService(selection.serviceName) || defaultService;
        const supportsInRoom = service?.supportsInRoom !== false;
        if(id==='in-room' && !supportsInRoom){
          return;
        }
        const prevLocation = selection.location;
        selection.location = id;
        if(selection.location!==prevLocation){
          touched = true;
        }
      });
      if(touched){
        markGuestsDirty(targets);
      }else{
        updateConfirmState();
      }
      if(targets.length){
        syncTemplateFromSourceId(targets[0]);
      }
      refreshLocationOptions();
      updateConfirmState();
    }

    updateGuestControls();
    refreshAllControls();

    function confirmSelection(){
      const assigned = orderedAssigned();
      if(assigned.length===0) return;
      if(!areGuestsReady()){
        updateGuestControls();
        return;
      }
      const confirmedCount = countConfirmedGuests();
      const canonical = getCanonicalSelection() || ensureTemplateSelection();
      // Capture the final snapshot for every guest so we can either apply them
      // uniformly or split them into individual activities when variations exist.
      const snapshots = assigned.map(id => {
        const base = confirmedCount===0 ? canonical : (selections.get(id) || canonical);
        const startValue = base.start || defaultSpaStartTime;
        const endValue = addMinutesToTime(startValue, base.durationMinutes);
        const snapshot = {
          guestId: id,
          serviceName: base.serviceName,
          serviceCategory: base.serviceCategory,
          durationMinutes: base.durationMinutes,
          start: startValue,
          end: endValue,
          therapist: base.therapist,
          location: base.location
        };
        selections.set(id, { ...base, guestId: id, start: startValue, end: endValue });
        return snapshot;
      });

      const allIdentical = snapshots.every(snap => {
        const ref = snapshots[0];
        return snap.serviceName===ref.serviceName &&
          snap.serviceCategory===ref.serviceCategory &&
          snap.durationMinutes===ref.durationMinutes &&
          snap.start===ref.start &&
          snap.end===ref.end &&
          snap.therapist===ref.therapist &&
          snap.location===ref.location;
      });

      if(existing?.id && !allIdentical){
        removeSpaEntry(targetDateKey, existing.id);
      }

      if(allIdentical){
        const entryId = existing?.id || null;
        upsertSpaEntry(targetDateKey, { id: entryId, appointments: snapshots });
      }else{
        // Per-guest variations become independent rows so each guest carries their
        // own chip, edit affordance, and preview line.
        snapshots.forEach((snapshot, index) => {
          const entryId = (existing && index===0) ? existing.id : null;
          upsertSpaEntry(targetDateKey, { id: entryId, appointments: [snapshot] });
        });
      }
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
      if((e.key==='Enter' || e.key==='Return') && (!e.target || (e.target.tagName!=='BUTTON' && e.target.dataset?.spaNoSubmit!=='true'))){
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
      timePicker?.focus?.();
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

  function computeSpaOverlapMap(entries){
    // Detect overlapping appointments per instructions so the activities list can
    // surface cabana choices whenever two different guests share the same spa
    // window on a given day.
    const overlapMap = new Map();
    const windows = [];
    (entries || []).forEach(entry => {
      if(!entry || entry.type!=='spa' || !entry.id) return;
      overlapMap.set(entry.id, false);
      const apps = Array.isArray(entry.appointments) ? entry.appointments : [];
      apps.forEach(app => {
        if(!app) return;
        const start = minutesFromTime(app.start);
        const end = minutesFromTime(app.end);
        if(start==null || end==null) return;
        windows.push({
          entryId: entry.id,
          guestId: app.guestId || null,
          start,
          end
        });
      });
    });
    for(let i=0;i<windows.length;i+=1){
      const a = windows[i];
      for(let j=i+1;j<windows.length;j+=1){
        const b = windows[j];
        if(a.guestId && b.guestId && a.guestId===b.guestId) continue;
        if(a.start < b.end && a.end > b.start){
          if(overlapMap.has(a.entryId)) overlapMap.set(a.entryId, true);
          if(overlapMap.has(b.entryId)) overlapMap.set(b.entryId, true);
        }
      }
    }
    return overlapMap;
  }

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
