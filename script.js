// Minimal, Codex-ready Wave-1 core (calendar, guests, assign, arrival/departure, preview)
(function(){
  // ---------- Utils ----------
  const pad = n => String(n).padStart(2,'0');
  const zero = d => { const x=new Date(d); x.setHours(0,0,0,0); return x; };
  // Calendar navigation reuses a single helper so month/year rollover flows through the
  // same code path everywhere we add or subtract days.
  const addDays = (date, amount) => { const next = new Date(date); next.setDate(next.getDate()+amount); return next; };
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
  const parse24Time = hm => { const [h,m] = hm.split(':').map(Number); return { hour: h, minute: m }; };
  // Centralized formatter is provided by utils/format.js so every surface stays in sync.
  const formatTimeDisplay = (window.CHSFormatUtils && typeof window.CHSFormatUtils.formatTimeDisplay === 'function')
    ? window.CHSFormatUtils.formatTimeDisplay
    : (value => (value==null ? '' : String(value)));
  const minutesFromTime = hm => {
    if(!hm) return null;
    const { hour, minute } = parse24Time(hm || '00:00');
    if(!Number.isFinite(hour) || !Number.isFinite(minute)){
      return null;
    }
    return (hour * 60) + minute;
  };
  const rangesOverlap = (aStart, aEnd, bStart, bEnd) => {
    if(!Number.isFinite(aStart) || !Number.isFinite(aEnd) || !Number.isFinite(bStart) || !Number.isFinite(bEnd)){
      return false;
    }
    return aStart < bEnd && bStart < aEnd;
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
  const formatDurationButtonLabel = minutes => minutes.toString();
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
  const spaIconSvg = '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" focusable="false"><path clip-rule="evenodd" d="M5.99999 2C5.99999 0.895431 6.89542 0 7.99999 0C9.10456 0 9.99999 0.895431 9.99999 2V2.0359L10.0311 2.01795C10.9877 1.46566 12.2108 1.79341 12.7631 2.75C13.3154 3.70659 12.9877 4.92977 12.0311 5.48205L12 5.5L12.0311 5.51795C12.9877 6.07023 13.3154 7.29342 12.7631 8.25C12.2108 9.20658 10.9877 9.53434 10.0311 8.98205L9.99999 8.9641V9C9.99999 10.1046 9.10456 11 7.99999 11C6.89542 11 5.99999 10.1046 5.99999 9V8.9641L5.9689 8.98205C5.01232 9.53434 3.78914 9.20658 3.23685 8.25C2.68457 7.29342 3.01232 6.07023 3.9689 5.51795L3.99999 5.5L3.9689 5.48205C3.01232 4.92977 2.68457 3.70659 3.23685 2.75C3.78913 1.79341 5.01232 1.46566 5.9689 2.01795L5.99999 2.0359V2ZM9.99999 5.5C9.99999 6.60457 9.10456 7.5 7.99999 7.5C6.89542 7.5 5.99999 6.60457 5.99999 5.5C5.99999 4.39543 6.89542 3.5 7.99999 3.5C9.10456 3.5 9.99999 4.39543 9.99999 5.5Z" fill="currentColor" fill-rule="evenodd"/><path d="M7 16H6C3.23858 16 1 13.7614 1 11V10H2C4.76142 10 7 12.2386 7 15V16Z" fill="currentColor"/><path d="M10 16H9V15C9 12.2386 11.2386 10 14 10H15V11C15 13.7614 12.7614 16 10 16Z" fill="currentColor"/></svg>';
  const customSetStartSvg = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M6.16 4.6c1.114.734 1.84 1.979 1.84 3.394 0 0 0 0 0 .006 0-1.415.726-2.66 1.825-3.384.573-.385.984-.939 1.17-1.589l-5.995-.02c.191.67.603 1.225 1.15 1.594Zm5.02 1.46c1.107-.808 1.819-2.101 1.82-3.56v-.5h1v-2h-12v2h1v.5c.001 1.459.713 2.752 1.808 3.551.672.43 1.121 1.13 1.192 1.939-.093.848-.551 1.564-1.209 2.003-1.081.814-1.772 2.078-1.79 3.503l-.003.503h-1v2h12v-2h-1v-.5c-.018-1.429-.709-2.692-1.769-3.492-.68-.454-1.138-1.169-1.23-1.996.071-.831.52-1.532 1.169-1.946ZM9 8c.072 1.142.655 2.136 1.519 2.763.877.623 1.445 1.61 1.481 2.732l.003.505h-8v-.5c.036-1.127.604-2.114 1.459-2.723.886-.642 1.468-1.635 1.54-2.766-.063-1.124-.641-2.091-1.498-2.683-.914-.633-1.499-1.662-1.502-2.827v-.5h8v.5c-.003 1.166-.587 2.195-1.479 2.813C9.64 5.794 9.062 6.761 8.999 7.865Z"/></svg>';
  const customSetEndSvg = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M11.18 6.06c1.107-.808 1.819-2.101 1.82-3.56v-.5h1v-2h-12v2h1v.5c.001 1.459.713 2.752 1.808 3.551.672.43 1.121 1.13 1.192 1.939-.093.848-.551 1.564-1.209 2.003-1.081.814-1.772 2.078-1.79 3.503l-.003.503h-1v2h12v-2h-1v-.5c-.018-1.429-.709-2.692-1.769-3.492-.68-.454-1.138-1.169-1.23-1.996.071-.831.52-1.532 1.169-1.946ZM9 8c.072 1.142.655 2.136 1.519 2.763.877.623 1.445 1.61 1.481 2.732l.003.505h-1s-1.62-3.5-3-3.5-3 3.5-3 3.5h-1v-.5c.036-1.127.604-2.114 1.459-2.723.886-.642 1.468-1.635 1.54-2.766-.063-1.124-.641-2.091-1.498-2.683-.914-.633-1.499-1.662-1.502-2.827v-.5h8v.5c-.003 1.166-.587 2.195-1.479 2.813-.88.607-1.458 1.574-1.521 2.678Z"/></svg>';
  // Spec-supplied custom chip icon swaps in a unique glyph until hover/keyboard
  // focus reveals the standard pencil affordance for editing.
  const customChipIconSvg = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14 22V16L12 14M12 14L13 8M12 14H10M13 8C14 9.16667 15.6 11 18 11M13 8L12.8212 7.82124C12.2565 7.25648 11.2902 7.54905 11.1336 8.33223L10 14M10 14L8 22M18 9.5V22M8 7H7.72076C7.29033 7 6.90819 7.27543 6.77208 7.68377L5.5 11.5L7 12L8 7ZM14.5 3.5C14.5 4.05228 14.0523 4.5 13.5 4.5C12.9477 4.5 12.5 4.05228 12.5 3.5C12.5 2.94772 12.9477 2.5 13.5 2.5C14.0523 2.5 14.5 2.94772 14.5 3.5Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const pencilSvg = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.5 16.75 3 21l4.25-1.5L19.5 7.25 16.75 4.5 4.5 16.75Zm12.5-12.5 2.75 2.75 1-1a1.88 1.88 0 0 0 0-2.62l-.88-.88a1.88 1.88 0 0 0-2.62 0l-1 1Z" fill="currentColor" stroke="currentColor"/></svg>';
  // Shared modal glyphs keep every destructive/save affordance visually in sync while
  // letting the CSS drive color via `currentColor` so themes remain consistent.
  const saveIconSvg = '<svg viewBox="-3 -3 24 24" aria-hidden="true" focusable="false"><path d="M2 0h11.22a2 2 0 0 1 1.345.52l2.78 2.527A2 2 0 0 1 18 4.527V16a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm0 2v14h14V4.527L13.22 2H2zm4 8h6a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2zm0 2v4h6v-4H6zm7-9a1 1 0 0 1 1 1v3a1 1 0 0 1-2 0V4a1 1 0 0 1 1-1zM5 3h5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm1 3h3V5H6v1z" fill="currentColor"/></svg>';
  const deleteIconSvg = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2h4a1 1 0 1 1 0 2h-1.069l-.867 12.142A2 2 0 0 1 17.069 22H6.93a2 2 0 0 1-1.995-1.858L4.07 8H3a1 1 0 0 1 0-2h4V4zm2 2h6V4H9v2zM6.074 8l.857 12H17.07l.857-12H6.074zM10 10a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1zm4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1z" fill="currentColor"/></svg>';
  const addIconSvg = '<svg viewBox="0 0 256 256" aria-hidden="true" focusable="false"><circle cx="128" cy="128" r="112" fill="none" stroke="currentColor" stroke-width="16"/><path d="M 80,128 H 176" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round"/><path d="M 128,80 V 176" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round"/></svg>';
  // Toolbar clear button uses the MIT-licensed Ant Design delete glyph so destructive affordances stay readable at small sizes.
  const clearToolbarSvg = '<svg viewBox="0 0 1024 1024" aria-hidden="true" focusable="false"><path fill="currentColor" d="M899.1 869.6l-53-305.6H864c14.4 0 26-11.6 26-26V346c0-14.4-11.6-26-26-26H618V138c0-14.4-11.6-26-26-26H432c-14.4 0-26 11.6-26 26v182H160c-14.4 0-26 11.6-26 26v192c0 14.4 11.6 26 26 26h17.9l-53 305.6c-0.3 1.5-0.4 3-0.4 4.4 0 14.4 11.6 26 26 26h723c1.5 0 3-0.1 4.4-0.4 14.2-2.4 23.7-15.9 21.2-30zM204 390h272V182h72v208h272v104H204V390zm468 440V674c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v156H416V674c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v156H202.8l45.1-260H776l45.1 260H672z"/></svg>';
  const checkSvg = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M6.6 11.2a.75.75 0 0 1-1.18.15L2.8 8.73a.75.75 0 0 1 1.06-1.06l2.02 2.03 4.46-4.46a.75.75 0 0 1 1.06 1.06Z"/></svg>';

  // Reusable factory keeps icon-only buttons consistent across modals while retaining
  // semantic labels + tooltips for assistive tech and pointer affordances.
  const createIconButton = ({ icon, label, extraClass='' }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = ['btn-icon', extraClass].filter(Boolean).join(' ');
    button.setAttribute('aria-label', label);
    button.title = label;
    button.innerHTML = icon;
    return button;
  };

  // Close buttons reuse the shared icon styling so the hit target stays ≥44px and
  // the "×" glyph remains purely presentational under a uniform "Close" label.
  const createModalCloseButton = onClick => {
    const button = createIconButton({ icon: '<span aria-hidden="true">×</span>', label: 'Close', extraClass: 'modal-close' });
    if(typeof onClick === 'function'){
      button.addEventListener('click', onClick);
    }
    return button;
  };

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

  // Surface curated activity titles/locations so the custom builder can pull
  // from the authoritative dataset without mutating it. This lets us mirror
  // the “pick an existing activity” UX and feed the location select with
  // known venues pulled from CHSDataLayer metadata.
  function buildCustomCatalog(activitiesDataset){
    const titleMap = new Map();
    const locationSet = new Set();
    const seasons = Array.isArray(activitiesDataset?.seasons) ? activitiesDataset.seasons : [];
    const dayKeys = ['sun','mon','tue','wed','thu','fri','sat'];
    seasons.forEach(season => {
      dayKeys.forEach(dayKey => {
        const rows = (window.CHSDataLayer && typeof window.CHSDataLayer.getActivitiesForSeasonDay === 'function')
          ? window.CHSDataLayer.getActivitiesForSeasonDay(season.name, dayKey)
          : [];
        rows.forEach(row => {
          if(!row || !row.title) return;
          if(!titleMap.has(row.title)){
            titleMap.set(row.title, { title: row.title, location: null });
          }
          const meta = (window.CHSDataLayer && typeof window.CHSDataLayer.getActivityMetadata === 'function')
            ? window.CHSDataLayer.getActivityMetadata({ season: season.name, day: dayKey, title: row.title, start: row.start })
            : null;
          const location = (meta?.location || '').trim();
          if(location){
            locationSet.add(location);
            const existing = titleMap.get(row.title);
            if(existing && !existing.location){
              existing.location = location;
            }
          }
        });
      });
    });
    const titles = Array.from(titleMap.values()).sort((a,b)=> a.title.localeCompare(b.title));
    const locations = Array.from(locationSet.values()).sort((a,b)=> a.localeCompare(b));
    return { titles, locations };
  }

  const TimePickerKit = window.TimePickerKit || {};
  const { createTimePicker } = TimePickerKit;



  // ---------- State ----------
  const state = {
    today: zero(new Date()),
    focus: zero(new Date()),
    arrival: null,
    departure: null,
    arrivalNote: null, // Visual ETA note only; intentionally not wired into stay logic.
    departureNote: null, // Visual ETD note only; intentionally not wired into stay logic.
    guests: [], // {id,name,color,active,primary}
    colors: ['#6366f1','#06b6d4','#22c55e','#f59e0b','#ef4444','#a855f7','#10b981','#f43f5e','#0ea5e9'],
    schedule: {}, // dateKey -> [{type:'activity',title,start,end,guestIds:Set}]
    data: null,
    dataStatus: 'loading',
    editing: false,
    userEdited: '',
    previewDirty: true,
    previewFrozen: false,
    spaCatalog: null,
    customCatalog: { titles: [], locations: [] }
  };

  // ---------- DOM ----------
  const $ = sel => document.querySelector(sel);
  const calMonth=$('#calMonth'), calYear=$('#calYear'), calGrid=$('#calGrid'), dow=$('#dow');
  const arrivalEtaInput=$('#arrivalEta'), departureEtdInput=$('#departureEtd');
  const dayTitle=$('#dayTitle'), activitiesEl=$('#activities'), email=$('#email');
  const seasonIndicator=$('#seasonIndicator'), seasonValue=$('#seasonValue');
  const guestsEl=$('#guests'), guestName=$('#guestName');
  const toggleAllBtn=$('#toggleAll');
  const toggleEditBtn=$('#toggleEdit');
  const copyBtn=$('#copy');
  const addDinnerBtn=$('#addDinner');
  const addSpaBtn=$('#addSpa');
  const addCustomBtn=$('#addCustom');
  const clearAllBtn=$('#clearAll');
  function decorateToolbarButton(button, iconSvg, srText){
    if(!button){
      return;
    }
    // Toolbar triggers borrow the chip art so icon swaps stay centralized while the sr-only label mirrors aria-label/title.
    const srLabel = srText || button.getAttribute('aria-label') || '';
    button.innerHTML = `<span class="toolbar-icon" aria-hidden="true">${iconSvg}</span><span class="sr-only">${srLabel}</span>`;
  }

  decorateToolbarButton(addDinnerBtn, dinnerIconSvg, 'Add Dinner');
  decorateToolbarButton(addSpaBtn, spaIconSvg, 'Add SPA Service');
  decorateToolbarButton(addCustomBtn, customChipIconSvg, 'Add Custom Activity');
  decorateToolbarButton(clearAllBtn, clearToolbarSvg, 'Clear all itinerary data');
  toggleEditBtn.textContent='✎';
  toggleEditBtn.title='Edit';
  toggleEditBtn.setAttribute('aria-pressed','false');
  calGrid.setAttribute('tabindex','0');
  calGrid.addEventListener('focus',event=>{
    if(event.target===calGrid){
      const activeCell = calGrid.querySelector(`[data-date-key="${keyDate(state.focus)}"]`);
      focusWithoutScroll(activeCell);
    }
  }, true);

  // Track whether the calendar needs to restore focus after a re-render. Arrow navigation
  // updates state then triggers a full render, so we keep this flag outside the handler.
  let calendarFocusIntent = false;
  const calendarFocusExemptSelector = 'input, textarea, select, [contenteditable="true"], [role="textbox"], [role="combobox"], [role="spinbutton"]';
  // Calendar keyboard handling lives on the grid container so both the roving cell and
  // the grid itself can move the focus date with arrow keys.
  calGrid.addEventListener('keydown',event=>{
    const key = event.key;
    const target = event.target;
    const cellButton = target && target.closest('[data-date-key]');
    const isDayCell = !!cellButton;
    const isGridFocused = target === calGrid;
    if(!isDayCell && !isGridFocused){
      return;
    }
    if(target.closest(calendarFocusExemptSelector)){
      return;
    }

    if(key==='Enter' || key===' ' || key==='Spacebar'){
      event.preventDefault();
      if(isDayCell){
        cellButton.click();
      }
      return;
    }

    const deltas = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 };
    const delta = deltas[key];
    if(typeof delta !== 'number'){
      return;
    }

    event.preventDefault();
    calendarFocusIntent = true;
    // Date math helper manages month/year transitions so the render pipeline refreshes
    // the visible month before we restore focus to the new active cell.
    const next = addDays(state.focus, delta);
    state.focus = zero(next);
    renderAll();
  });

  // DOW header
  // Surface compact weekday initials while keeping full names available for assistive tech + tooltips.
  const weekdayInitials=['S','M','T','W','T','F','S'];
  const weekdayFull=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  weekdayInitials.forEach((abbr,ix)=>{
    const d=document.createElement('div');
    d.textContent=abbr;
    d.setAttribute('aria-label', weekdayFull[ix]);
    d.title = weekdayFull[ix];
    dow.appendChild(d);
  });

  let stayNotePicker=null;
  function updateStayNoteInputs(){
    if(arrivalEtaInput){
      const display = state.arrivalNote ? formatTimeDisplay(state.arrivalNote) : '';
      arrivalEtaInput.value = display;
      arrivalEtaInput.setAttribute('aria-expanded', stayNotePicker?.stateKey==='arrivalNote' ? 'true' : 'false');
    }
    if(departureEtdInput){
      const display = state.departureNote ? formatTimeDisplay(state.departureNote) : '';
      departureEtdInput.value = display;
      departureEtdInput.setAttribute('aria-expanded', stayNotePicker?.stateKey==='departureNote' ? 'true' : 'false');
    }
  }

  function closeStayNotePicker({ returnFocus=false }={}){
    if(!stayNotePicker) return;
    const { overlay, anchor, timePicker, handleKeydown, handleViewport } = stayNotePicker;
    document.removeEventListener('keydown', handleKeydown, true);
    window.removeEventListener('resize', handleViewport, true);
    window.removeEventListener('scroll', handleViewport, true);
    if(timePicker && typeof timePicker.dispose==='function'){
      timePicker.dispose();
    }
    if(overlay?.parentNode){
      overlay.parentNode.removeChild(overlay);
    }
    if(anchor){
      anchor.setAttribute('aria-expanded','false');
      if(returnFocus){
        focusWithoutScroll(anchor);
      }
    }
    stayNotePicker=null;
    updateStayNoteInputs();
  }

  function openStayNotePicker({ anchor, stateKey, label }){
    if(!anchor){
      return;
    }
    if(stayNotePicker && stayNotePicker.anchor===anchor){
      closeStayNotePicker({ returnFocus:true });
      return;
    }
    closeStayNotePicker();
    if(typeof createTimePicker!=='function'){
      return;
    }

    const overlay=document.createElement('div');
    overlay.className='stay-time-layer';
    const scrim=document.createElement('div');
    scrim.className='stay-time-scrim';
    overlay.appendChild(scrim);

    const surface=document.createElement('div');
    surface.className='stay-time-surface';
    surface.setAttribute('role','dialog');
    surface.setAttribute('aria-modal','true');
    const labelId=`${stateKey}-stay-time-label`;
    const srLabel=document.createElement('div');
    srLabel.className='sr-only';
    srLabel.id=labelId;
    srLabel.textContent=label;
    surface.setAttribute('aria-labelledby', labelId);
    surface.appendChild(srLabel);

    const pickerHost=document.createElement('div');
    surface.appendChild(pickerHost);

    const storedValue = state[stateKey];
    const defaultSnapshot = storedValue ? from24Time(storedValue) : { hour:12, minute:0, meridiem:'PM' };
    const ariaBase = stateKey==='arrivalNote' ? 'Arrival' : 'Departure';
    let pendingValue = defaultSnapshot;

    // Match the shared picker physics: 1–12 hours, 5-minute steps, AM/PM toggle.
    const pickerInstance=createTimePicker({
      hourRange:[1,12],
      minuteStep:5,
      showAmPm:true,
      defaultValue: defaultSnapshot,
      ariaLabels:{ hours:`${ariaBase} hour`, minutes:`${ariaBase} minutes`, meridiem:'AM or PM' },
      onChange:value=>{ pendingValue = value; }
    });

    if(pickerInstance && pickerInstance.element){
      pickerHost.appendChild(pickerInstance.element);
    }else{
      const fallback=document.createElement('div');
      fallback.className='stay-time-fallback';
      fallback.textContent='Time picker unavailable.';
      pickerHost.appendChild(fallback);
    }

    const actions=document.createElement('div');
    actions.className='stay-time-actions';

    const clearBtn=document.createElement('button');
    clearBtn.type='button';
    clearBtn.className='stay-time-clear';
    clearBtn.textContent='Clear';
    clearBtn.setAttribute('aria-label',`Clear ${ariaBase.toLowerCase()} time note`);
    clearBtn.addEventListener('click',()=>{
      state[stateKey]=null;
      closeStayNotePicker({ returnFocus:true });
      updateStayNoteInputs();
    });
    actions.appendChild(clearBtn);

    const saveBtn=document.createElement('button');
    saveBtn.type='button';
    saveBtn.className='stay-time-primary';
    saveBtn.textContent='Save';
    saveBtn.setAttribute('aria-label',`Save ${ariaBase.toLowerCase()} time note`);
    saveBtn.addEventListener('click',()=>{
      const snapshot = (pickerInstance && typeof pickerInstance.getValue==='function') ? pickerInstance.getValue() : pendingValue;
      if(snapshot){
        state[stateKey]=to24Time(snapshot);
      }
      closeStayNotePicker({ returnFocus:true });
      updateStayNoteInputs();
    });
    actions.appendChild(saveBtn);

    surface.appendChild(actions);

    overlay.appendChild(surface);
    document.body.appendChild(overlay);

    const reposition=()=>{
      const rect=anchor.getBoundingClientRect();
      const surfaceRect=surface.getBoundingClientRect();
      const viewportWidth=window.innerWidth || document.documentElement.clientWidth;
      const viewportHeight=window.innerHeight || document.documentElement.clientHeight;
      let left=rect.left+window.scrollX;
      let top=rect.bottom+window.scrollY+8;
      const maxLeft=window.scrollX+viewportWidth-surfaceRect.width-16;
      left=Math.min(Math.max(left, window.scrollX+16), Math.max(window.scrollX+16, maxLeft));
      if(top+surfaceRect.height>window.scrollY+viewportHeight-16){
        top=rect.top+window.scrollY-surfaceRect.height-8;
      }
      top=Math.max(top, window.scrollY+16);
      surface.style.left=`${left}px`;
      surface.style.top=`${top}px`;
    };

    // Delay positioning until the picker paints so measurements are accurate.
    requestAnimationFrame(()=>{
      reposition();
      pickerInstance?.focus?.({ preventScroll:true });
    });

    const getFocusableElements=()=> Array.from(surface.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')).filter(el=> !el.hasAttribute('disabled') && el.getAttribute('aria-hidden')!=='true');

    const handleKeydown=e=>{
      if(e.key==='Escape'){
        e.preventDefault();
        closeStayNotePicker({ returnFocus:true });
        return;
      }
      if(e.key==='Tab'){
        const focusable=getFocusableElements();
        if(!focusable.length) return;
        const active=document.activeElement;
        let index=focusable.indexOf(active);
        if(index===-1){
          index = e.shiftKey ? focusable.length-1 : 0;
        }else{
          index += e.shiftKey ? -1 : 1;
          if(index<0) index = focusable.length-1;
          if(index>=focusable.length) index = 0;
        }
        e.preventDefault();
        const target=focusable[index];
        if(target){
          focusWithoutScroll(target);
        }
      }
    };
    const handleViewport=()=>{ reposition(); };

    document.addEventListener('keydown', handleKeydown, true);
    window.addEventListener('resize', handleViewport, true);
    window.addEventListener('scroll', handleViewport, true);

    scrim.addEventListener('pointerdown', e=>{
      if(e.target===scrim){
        closeStayNotePicker({ returnFocus:true });
      }
    });
    surface.addEventListener('pointerdown', e=> e.stopPropagation());

    anchor.setAttribute('aria-expanded','true');

    stayNotePicker={ overlay, anchor, timePicker: pickerInstance, stateKey, handleKeydown, handleViewport };
    updateStayNoteInputs();
  }

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
      state.customCatalog = buildCustomCatalog(activitiesDataset);
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
    const focusKey = keyDate(state.focus);
    const shouldRestoreFocus = calendarFocusIntent || calGrid.contains(document.activeElement);
    calMonth.textContent = monthName(y,m); calYear.textContent = y;
    calGrid.innerHTML='';
    const first=new Date(y,m,1), startOffset=first.getDay();
    for(let i=0;i<42;i++){
      const d=new Date(y,m,1 - startOffset + i);
      const btn=document.createElement('button');
      btn.textContent = d.getDate();
      btn.setAttribute('role','gridcell');
      const dateKey = keyDate(d);
      btn.dataset.dateKey = dateKey;
      const isFocusDate = dateKey===focusKey;
      // Roving tabindex: only the active date stays in the tab order so keyboard focus
      // always lands on the highlighted cell.
      btn.setAttribute('tabindex', isFocusDate ? '0' : '-1');
      btn.setAttribute('aria-selected','false');
      btn.setAttribute('aria-label', d.toDateString());
      if(d.getMonth()!==m) btn.classList.add('other');
      if(d.getTime()===state.today.getTime()){
        btn.classList.add('today');
        btn.setAttribute('aria-current','date');
      }
      if(isFocusDate){
        btn.classList.add('focus');
        btn.setAttribute('aria-selected','true');
      }

      if(state.arrival && state.departure){
        const t=d.getTime();
        if(t>state.arrival.getTime() && t<state.departure.getTime()) btn.classList.add('stay');
      }
      if(state.arrival && d.getTime()===state.arrival.getTime()) btn.classList.add('arrival');
      if(state.departure && d.getTime()===state.departure.getTime()) btn.classList.add('departure');

      btn.addEventListener('click',()=>{
        state.focus=zero(d);
        renderAll();
      });
      calGrid.appendChild(btn);
    }
    if(shouldRestoreFocus){
      // After rebuilding the grid, re-focus the active cell without scrolling so arrow
      // key presses and clicks keep the visible focus ring in place across month changes.
      const activeCell = calGrid.querySelector(`[data-date-key="${focusKey}"]`);
      focusWithoutScroll(activeCell);
    }
    calendarFocusIntent = false;
    updateStayNoteInputs();
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
    syncCustomGuests();
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
      const activeGuestsSnapshot = state.guests.filter(g=>g.active).map(g=>g.id);
      openSpaEditor({ mode:'add', dateKey: keyDate(state.focus), guestIds: activeGuestsSnapshot });
    });
  }

  if(addCustomBtn){
    addCustomBtn.addEventListener('click',()=>{
      const activeGuestsSnapshot = state.guests.filter(g=>g.active).map(g=>g.id);
      openCustomBuilder({ mode:'add', dateKey: keyDate(state.focus), guestIds: activeGuestsSnapshot });
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
    updateAddCustomButton();

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
    mergeSpaEntriesForDay(dateK);
    const spaEntries = getSpaEntries(dateK);
    const customEntries = getCustomEntries(dateK);
    const spaOverlapById = computeSpaOverlapMap(spaEntries);
    const guestLookup = new Map(state.guests.map(g=>[g.id,g]));
    const combined = baseList.map(row=>({kind:'activity', data: row}));
    if(dinnerEntry){ combined.push({kind:'dinner', data: dinnerEntry}); }
    // Inject saved SPA blocks alongside activities/dinner so the list remains time-ordered.
    spaEntries.forEach(entry => combined.push({ kind:'spa', data: entry }));
    customEntries.forEach(entry => combined.push({ kind:'custom', data: entry }));
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
      if(item.kind==='custom'){
        renderCustom(item.data);
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
      const ariaLabel = `Add activity: ${formatTimeDisplay(row.start)} to ${formatTimeDisplay(row.end)} ${row.title}`;
      div.setAttribute('aria-label', ariaLabel);

      const body=document.createElement('div');
      body.className='activity-row-body';

      const headline=document.createElement('div');
      headline.className='activity-row-headline';

      const time=document.createElement('span');
      time.className='activity-row-time';
      time.textContent = `${formatTimeDisplay(row.start)} – ${formatTimeDisplay(row.end)}`;
      headline.appendChild(time);

      const title=document.createElement('span');
      title.className='activity-row-title';
      title.textContent = row.title;
      headline.appendChild(title);

      body.appendChild(headline);

      const dateK = keyDate(state.focus);
      const day = getOrCreateDay(dateK);
      const entry = day.find(e=> e.type==='activity' && e.title===row.title && e.start===row.start && e.end===row.end);
      const assignedIds = entry ? Array.from(entry.guestIds) : [];

      // Split the trailing rail into guest + action clusters so chips sit to the
      // right of the title stack without affecting row height.
      const guestCluster=document.createElement('div');
      guestCluster.className='activity-row-guests guest-chips';

      const actionRail=document.createElement('div');
      actionRail.className='activity-row-rail add-chips';

      // Wrapper keeps the trailing controls as a single right-aligned cluster.
      const trailing=document.createElement('div');
      trailing.className='activity-row-trailing row-trailing';
      trailing.appendChild(guestCluster);
      trailing.appendChild(actionRail);

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
      div.appendChild(trailing);
      activitiesEl.appendChild(div);

      if(state.guests.length>0){
        renderAssignments(guestCluster, entry, assignedIds, dateK);
      }
    });

    function renderAssignments(container, entry, ids, dateK){
      if(!container) return;
      container.innerHTML='';
      container.dataset.hasGuests='false';
      if(!Array.isArray(ids) || ids.length===0) return;

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

      if(container.__groupInlineCleanup){
        container.__groupInlineCleanup();
      }

      const handledGroup = renderGroupInlineSwap(container, plan, {
        createChips: ()=> plan.guests.map(guest=> createChip(guest, entry, dateK)),
        focusSelector: '.chip .x',
        hideDelay: 260,
        clusterOptions: {
          popoverLabel: 'Assigned guests',
          ariaLabelPrefix: 'More assigned guests'
        }
      });

      if(handledGroup){
        return;
      }

      const chips = plan.guests.map(guest=> createChip(guest, entry, dateK));
      layoutGuestCluster(container, chips, {
        popoverLabel: 'Assigned guests',
        ariaLabelPrefix: 'More assigned guests'
      });
    }

    // Measure the guest rail and collapse overflow into a +N pill whose popover
    // keeps the hidden chips interactive without altering the row height.
    function layoutGuestCluster(container, chips, options={}){
      if(!container) return;
      const items = Array.isArray(chips) ? chips.filter(Boolean) : [];
      container.innerHTML='';
      if(items.length===0){
        container.dataset.hasGuests='false';
        return;
      }

      const visible = items.slice();
      const hidden = [];
      const measurementPadding = 1;
      let overflowButton = null;
      let rafToken = null;

      const applyLayout = () => {
        container.innerHTML='';
        visible.forEach(chip => container.appendChild(chip));
        if(hidden.length>0){
          if(!overflowButton){
            overflowButton = buildOverflowButton(options);
          }
          updateOverflowButton(overflowButton, hidden, options);
          container.appendChild(overflowButton);
        }
        container.dataset.hasGuests='true';
      };

      const scheduleReflow = () => {
        if(rafToken!==null) return;
        if(typeof requestAnimationFrame==='function'){
          rafToken = requestAnimationFrame(()=>{
            rafToken = null;
            layoutGuestCluster(container, items, options);
          });
        }
      };

      applyLayout();

      if(container.clientWidth<=0){
        scheduleReflow();
        return;
      }

      let guard = 0;
      while(visible.length>0 && container.scrollWidth>container.clientWidth+measurementPadding && guard<items.length){
        hidden.unshift(visible.pop());
        guard+=1;
        applyLayout();
      }

      if(hidden.length===0){
        container.dataset.hasGuests='true';
        return;
      }

      guard = 0;
      while(visible.length>0 && container.scrollWidth>container.clientWidth+measurementPadding && guard<items.length){
        hidden.unshift(visible.pop());
        guard+=1;
        applyLayout();
      }

      applyLayout();
    }

    function renderGroupInlineSwap(container, plan, options={}){
      if(!container || !plan) return false;
      const isGroup = plan.type===AssignmentChipMode.GROUP_BOTH || plan.type===AssignmentChipMode.GROUP_EVERYONE;
      if(!isGroup) return false;

      const {
        createChips,
        focusSelector = '.chip .x',
        hideDelay = 260,
        clusterOptions = {}
      } = options || {};

      if(typeof createChips !== 'function'){
        return false;
      }

      const mergedClusterOptions = Object.assign({
        popoverLabel: 'Assigned guests',
        ariaLabelPrefix: 'More assigned guests'
      }, clusterOptions);

      let expanded = false;
      let hideTimer = null;
      const cleanupFns = [];
      const register = (target, type, handler, opts) => {
        if(!target) return;
        target.addEventListener(type, handler, opts);
        cleanupFns.push(()=> target.removeEventListener(type, handler, opts));
      };

      const cancelHide = () => {
        if(hideTimer){
          clearTimeout(hideTimer);
          hideTimer = null;
        }
      };

      const collapse = (opts={}) => {
        cancelHide();
        renderPill(opts);
      };

      const scheduleHide = () => {
        // Delay collapsing so brief exits (especially across chips) do not immediately snap back.
        cancelHide();
        hideTimer = setTimeout(() => {
          if(!expanded) return;
          if(typeof document !== 'undefined' && container.contains(document.activeElement)){
            return;
          }
          collapse();
        }, hideDelay);
      };

      const pill = document.createElement('button');
      pill.type='button';
      pill.className='tag-everyone';
      pill.dataset.assignmentPill = plan.type;
      pill.setAttribute('aria-label', plan.pillAriaLabel || plan.pillLabel || 'Assigned guests');
      pill.setAttribute('aria-expanded','false');
      pill.dataset.pressExempt='true';
      pill.addEventListener('pointerdown', e=> e.stopPropagation());
      pill.addEventListener('click', e=> e.stopPropagation());

      const label=document.createElement('span');
      label.textContent=plan.pillLabel || '';
      pill.appendChild(label);

      const focusFirstChip = () => {
        if(!focusSelector) return;
        const firstAction = container.querySelector(focusSelector);
        if(firstAction && typeof firstAction.focus==='function'){
          firstAction.focus();
        }
      };

      const renderChips = (opts={}) => {
        expanded = true;
        pill.setAttribute('aria-expanded','true');
        // Swap the pill inline for the real guest chips so the layout slot stays fixed
        // while reusing layoutGuestCluster for +N overflow handling.
        layoutGuestCluster(container, createChips(), mergedClusterOptions);
        container.dataset.groupExpanded='true';
        if(opts.focusFirst){
          const focusTask = () => focusFirstChip();
          if(typeof requestAnimationFrame==='function'){
            requestAnimationFrame(()=> focusTask());
          }else{
            focusTask();
          }
        }
      };

      const renderPill = (opts={}) => {
        expanded = false;
        pill.setAttribute('aria-expanded','false');
        container.innerHTML='';
        container.appendChild(pill);
        container.dataset.groupExpanded='false';
        container.dataset.hasGuests='true';
        if(opts.focusPill && typeof pill.focus==='function'){
          pill.focus();
        }
      };

      const expand = (opts={}) => {
        cancelHide();
        if(expanded) return;
        renderChips(opts);
      };

      register(container,'pointerenter',()=> cancelHide());
      register(container,'pointerleave',()=>{
        if(expanded){
          scheduleHide();
        }
      });

      register(container,'focusin',()=> cancelHide());
      register(container,'focusout',()=>{
        if(expanded){
          scheduleHide();
        }
      });

      register(container,'keydown',(event)=>{
        if(event.key==='Escape' && expanded){
          event.preventDefault();
          collapse({ focusPill:true });
        }
      }, true);

      register(pill,'pointerenter',()=> expand());
      register(pill,'focus',()=>{
        const shouldFocusChips=!pill.matches(':hover');
        expand({ focusFirst: shouldFocusChips });
      });
      register(pill,'keydown',(event)=>{
        if(event.key==='Enter' || event.key===' '){
          event.preventDefault();
          expand({ focusFirst:true });
        }else if(event.key==='Escape' && expanded){
          event.preventDefault();
          collapse({ focusPill:true });
        }
      });

      register(container,'click',(event)=>{
        if(event.target && event.target.matches('.chip, .chip *')){
          cancelHide();
        }
      });

      renderPill();

      container.__groupInlineCleanup=()=>{
        cancelHide();
        cleanupFns.forEach(fn=>fn());
        delete container.__groupInlineCleanup;
      };

      return true;
    }

    function buildOverflowButton(options={}){
      const button=document.createElement('button');
      button.type='button';
      button.className='tag-everyone guest-overflow-pill';
      button.dataset.pressExempt='true';
      button.dataset.overflowChip='true';
      button.setAttribute('aria-haspopup','true');
      button.setAttribute('aria-expanded','false');
      button.addEventListener('pointerdown', e=> e.stopPropagation());
      button.addEventListener('click', e=> e.stopPropagation());

      const label=document.createElement('span');
      label.className='guest-overflow-label';
      button.appendChild(label);

      const pop=document.createElement('div');
      pop.className='popover';
      pop.setAttribute('role','group');
      pop.setAttribute('aria-label', options.popoverLabel || 'Additional guests');
      button.appendChild(pop);

      attachGroupPillInteractions(button);
      return button;
    }

    function updateOverflowButton(button, hiddenChips, options={}){
      if(!button) return;
      const count = hiddenChips.length;
      const label = button.querySelector('.guest-overflow-label');
      if(label){
        label.textContent = `+${count}`;
      }
      const pop = button.querySelector('.popover');
      if(pop){
        pop.innerHTML='';
        hiddenChips.forEach(chip => pop.appendChild(chip));
      }
      const tooltipNames = hiddenChips.map(chip => chip?.title || chip?.getAttribute?.('aria-label') || chip?.textContent || '').filter(Boolean);
      const prefix = options.ariaLabelPrefix || 'More guests';
      if(tooltipNames.length>0){
        const joined = tooltipNames.join(', ');
        button.title = joined;
        button.setAttribute('aria-label', `${prefix}: ${joined}`);
      }else{
        button.removeAttribute('title');
        button.setAttribute('aria-label', `${prefix} (${count})`);
      }
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
      time.textContent = formatTimeDisplay(entry.start);
      const title=document.createElement('span');
      title.className='activity-row-title';
      title.textContent = entry.title;
      headline.appendChild(time);
      headline.appendChild(title);
      body.appendChild(headline);

      const chip=document.createElement('button');
      chip.type='button';
      chip.className='dinner-chip';
      chip.innerHTML = `<span class="chip-icon">${dinnerIconSvg}</span><span class="chip-pencil">${pencilSvg}</span><span class="sr-only">Edit dinner time</span>`;
      chip.setAttribute('aria-label','Edit dinner time');
      chip.title='Edit dinner time';
      chip.dataset.pressExempt='true';
      chip.addEventListener('pointerdown', e=> e.stopPropagation());
      chip.addEventListener('click',()=> openDinnerPicker({ mode:'edit', dateKey: dateK }));
      const guestCluster=document.createElement('div');
      guestCluster.className='activity-row-guests guest-chips';

      // Keep the dinner edit affordance in a dedicated rail so it pins to the right.
      const rail=document.createElement('div');
      rail.className='activity-row-rail add-chips';
      rail.appendChild(chip);

      const trailing=document.createElement('div');
      trailing.className='activity-row-trailing row-trailing';
      trailing.appendChild(guestCluster);
      trailing.appendChild(rail);

      div.appendChild(body);
      div.appendChild(trailing);
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
      const startLabel = entry.start ? formatTimeDisplay(entry.start) : '';
      const endLabel = entry.end ? formatTimeDisplay(entry.end) : '';
      time.textContent = startLabel && endLabel ? `${startLabel} – ${endLabel}` : startLabel || endLabel || '';
      headline.appendChild(time);

      const title=document.createElement('span');
      title.className='activity-row-title';
      // Activities column hides duration/sub-notes for spa rows so the service name
      // is the only label while preview/email continue to render the full summary.
      const summary = spaActivitiesTitle(entry);
      title.textContent = summary;
      headline.appendChild(title);

      body.appendChild(headline);

      const chip=document.createElement('button');
      chip.type='button';
      chip.className='spa-chip chip chip--spa';
      chip.innerHTML = `<span class="icon icon-spa" aria-hidden="true">${spaIconSvg}</span><span class="icon icon-pencil" aria-hidden="true">${pencilSvg}</span><span class="sr-only">Edit spa appointment</span>`;
      chip.setAttribute('aria-label','Edit spa appointment');
      chip.title='Edit spa appointment';
      chip.dataset.pressExempt='true';
      chip.addEventListener('pointerdown', e=> e.stopPropagation());
      chip.addEventListener('click',()=> openSpaEditor({ mode:'edit', dateKey: dateK, entryId: entry.id }));
      const guestCluster=document.createElement('div');
      guestCluster.className='activity-row-guests guest-chips';

      // Share the right rail treatment so every activity action aligns consistently.
      const rail=document.createElement('div');
      rail.className='activity-row-rail add-chips';
      rail.appendChild(chip);

      const trailing=document.createElement('div');
      trailing.className='activity-row-trailing row-trailing';
      trailing.appendChild(guestCluster);
      trailing.appendChild(rail);

      div.appendChild(body);
      div.appendChild(trailing);
      activitiesEl.appendChild(div);

      renderSpaGuestChips(guestCluster, entry, dateK);
    }

    function renderCustom(entry){
      if(!entry) return;
      const div=document.createElement('div');
      div.className='activity-row custom-item';
      const body=document.createElement('div');
      body.className='activity-row-body';

      const headline=document.createElement('div');
      headline.className='activity-row-headline';

      const time=document.createElement('span');
      time.className='activity-row-time';
      const startLabel = entry.start ? formatTimeDisplay(entry.start) : '';
      const endLabel = entry.end ? formatTimeDisplay(entry.end) : '';
      time.textContent = startLabel && endLabel ? `${startLabel} – ${endLabel}` : startLabel || endLabel || '';
      headline.appendChild(time);

      const title=document.createElement('span');
      title.className='activity-row-title';
      title.textContent = entry.title || 'Custom Activity';
      headline.appendChild(title);

      body.appendChild(headline);

      const guestIds = Array.isArray(entry.guestIds) ? entry.guestIds : Array.from(entry.guestIds || []);

      const chip=document.createElement('button');
      chip.type='button';
      chip.className='chip chip--custom';
      // Layer both icons so the custom glyph renders immediately and we can flip
      // to the pencil via hover/:focus-visible without resizing the pill.
      chip.innerHTML = `<span class="icon icon-custom" aria-hidden="true">${customChipIconSvg}</span><span class="icon icon-pencil" aria-hidden="true">${pencilSvg}</span>`;
      chip.dataset.pressExempt='true';
      chip.setAttribute('aria-label','Edit custom activity');
      chip.title='Edit custom activity';
      chip.addEventListener('pointerdown', e=> e.stopPropagation());
      chip.addEventListener('click',()=> openCustomBuilder({ mode:'edit', dateKey: dateK, entryId: entry.id }));

      const guestCluster=document.createElement('div');
      guestCluster.className='activity-row-guests guest-chips';

      const rail=document.createElement('div');
      rail.className='activity-row-rail add-chips';
      rail.appendChild(chip);

      const trailing=document.createElement('div');
      trailing.className='activity-row-trailing row-trailing';
      trailing.appendChild(guestCluster);
      trailing.appendChild(rail);

      div.appendChild(body);
      div.appendChild(trailing);
      activitiesEl.appendChild(div);

      if(state.guests.length>0){
        renderAssignments(guestCluster, entry, guestIds, dateK);
      }
    }

    function renderSpaGuestChips(container, entry, dateK){
      if(!container || !entry) return;
      container.innerHTML='';
      container.dataset.hasGuests='false';
      const guestIds = Array.from(entry.guestIds || []);
      if(guestIds.length===0) return;
      const idSet = new Set(guestIds);
      const orderedGuests = [];
      const seen = new Set();
      state.guests.forEach(guest => {
        if(idSet.has(guest.id) && !seen.has(guest.id)){
          orderedGuests.push(guest);
          seen.add(guest.id);
        }
      });
      guestIds.forEach(id => {
        if(!seen.has(id)){
          const guest = guestLookup.get(id);
          if(guest){
            orderedGuests.push(guest);
            seen.add(id);
          }
        }
      });
      if(orderedGuests.length===0) return;
      const plan = getAssignmentChipRenderPlan({
        totalGuestsInStay: state.guests.length,
        assignedGuests: orderedGuests
      });
      if(plan.type === AssignmentChipMode.NONE || plan.guests.length===0){
        return;
      }
      if(container.__groupInlineCleanup){
        container.__groupInlineCleanup();
      }

      const handledGroup = renderGroupInlineSwap(container, plan, {
        createChips: () => plan.guests.map(guest => createSpaAssignmentChip(guest, entry, dateK)),
        focusSelector: '.chip .x',
        hideDelay: 260,
        clusterOptions: {
          popoverLabel: 'Assigned guests',
          ariaLabelPrefix: 'More assigned guests'
        }
      });

      if(handledGroup){
        return;
      }
      const chips = plan.guests.map(guest => createSpaAssignmentChip(guest, entry, dateK));
      layoutGuestCluster(container, chips, {
        popoverLabel: 'Assigned guests',
        ariaLabelPrefix: 'More assigned guests'
      });
    }

    function createSpaAssignmentChip(guest, entry, dateK){
      if(!guest) return document.createElement('span');
      const chip=document.createElement('span');
      chip.className='chip';
      chip.style.borderColor = guest.color;
      chip.style.color = guest.color;
      chip.title = guest.name;
      const initial=document.createElement('span');
      initial.className='initial';
      initial.textContent = guest.name.charAt(0).toUpperCase();
      chip.appendChild(initial);
      const removeBtn=document.createElement('button');
      removeBtn.className='x';
      removeBtn.type='button';
      removeBtn.dataset.pressExempt='true';
      removeBtn.setAttribute('aria-label', `Remove ${guest.name}`);
      removeBtn.title=`Remove ${guest.name}`;
      removeBtn.textContent='×';
      removeBtn.addEventListener('pointerdown', e=> e.stopPropagation());
      removeBtn.addEventListener('click', event => {
        event.stopPropagation();
        if(removeSpaGuestFromEntry(dateK, entry?.id, guest.id)){
          // Inline removal only peels a single guest off the merged row; the
          // modal exposes a dedicated destructive control when the entire
          // appointment should be cleared.
          markPreviewDirty();
          renderActivities();
          renderPreview();
        }
      });
      chip.appendChild(removeBtn);
      return chip;
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

    function spaActivitiesTitle(entry){
      if(!entry || !Array.isArray(entry.appointments) || entry.appointments.length===0){
        return 'Spa Appointment';
      }
      const first = entry.appointments[0];
      const sameService = entry.appointments.every(app => app.serviceName === first.serviceName);
      if(sameService && first?.serviceName){
        return first.serviceName;
      }
      return 'Spa Appointments';
    }
  }

  let dinnerDialog = null;
  let spaDialog = null;
  let customDialog = null;

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

  function updateAddCustomButton(){
    if(!addCustomBtn) return;
    const enabled = state.dataStatus==='ready';
    addCustomBtn.disabled = !enabled;
    const hasEntry = enabled ? getCustomEntries(keyDate(state.focus)).length>0 : false;
    addCustomBtn.setAttribute('aria-pressed', hasEntry ? 'true' : 'false');
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

    // Shared modal header keeps the typography + spacing identical across flows.
    const header=document.createElement('div');
    header.className='modal-header';
    const title=document.createElement('h2');
    title.className='modal-title';
    title.textContent='Dinner';
    title.id='dinner-dialog-title';
    const modeDescriptor=document.createElement('span');
    modeDescriptor.className='sr-only';
    modeDescriptor.textContent = (mode==='edit' || existing) ? ' – Editing dinner time' : ' – Add dinner time';
    title.appendChild(modeDescriptor);
    dialog.setAttribute('aria-labelledby','dinner-dialog-title');
    header.appendChild(title);

    const closeBtn=createModalCloseButton(()=> closeDinnerPicker({returnFocus:true}));
    header.appendChild(closeBtn);

    dialog.appendChild(header);

    const body=document.createElement('div');
    body.className='modal-body dinner-body';

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

    const footer=document.createElement('div');
    footer.className='modal-footer';
    const footerStart=document.createElement('div');
    footerStart.className='modal-footer-start';
    const footerEnd=document.createElement('div');
    footerEnd.className='modal-footer-end';
    // Shared footer layout keeps destructive controls on the left while primary
    // actions stay grouped on the right for every modal.

    const confirmIsEdit = mode==='edit' && !!existing;
    const confirmLabel = confirmIsEdit ? 'Save dinner time' : 'Add dinner time';
    const confirmIcon = confirmIsEdit ? saveIconSvg : addIconSvg;
    const confirmBtn = createIconButton({ icon: confirmIcon, label: confirmLabel, extraClass: 'btn-icon--primary' });
    footerEnd.appendChild(confirmBtn);

    let removeBtn=null;
    if(confirmIsEdit){
      removeBtn=createIconButton({ icon: deleteIconSvg, label: 'Delete dinner', extraClass: 'btn-icon--subtle' });
      footerStart.appendChild(removeBtn);
    }

    footer.appendChild(footerStart);
    footer.appendChild(footerEnd);
    dialog.appendChild(footer);

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

  function openSpaEditor({mode='add', dateKey, entryId, guestIds}={}){
    if(state.dataStatus!=='ready' || !state.spaCatalog || state.spaCatalog.categories.length===0) return;
    closeSpaEditor();
    const targetDateKey = dateKey || keyDate(state.focus);
    const existing = entryId ? getSpaEntry(targetDateKey, entryId) : null;
    const catalog = state.spaCatalog;
    const stayGuestLookup = new Map(state.guests.map(g=>[g.id,g]));
    const singleGuestStay = state.guests.length === 1;
    const normalizeGuestIds = ids => {
      const requested = Array.isArray(ids) ? ids.filter(Boolean) : [];
      const requestedSet = new Set(requested);
      const seen = new Set();
      const normalized = [];
      state.guests.forEach(guest => {
        if(requestedSet.has(guest.id) && !seen.has(guest.id)){
          seen.add(guest.id);
          normalized.push(guest.id);
        }
      });
      requested.forEach(id => {
        if(!seen.has(id) && stayGuestLookup.has(id)){
          seen.add(id);
          normalized.push(id);
        }
      });
      return normalized;
    };
    const existingGuestIds = existing?.appointments ? existing.appointments.map(app => app.guestId) : [];
    // Capture the guest roster snapshot when the modal opens so the create flow
    // mirrors the exact toggle state at click time while edits always surface
    // every guest already represented on the activities row.
    const modalGuestIds = existing
      ? normalizeGuestIds(existingGuestIds)
      : normalizeGuestIds(Array.isArray(guestIds) ? guestIds : state.guests.filter(g=>g.active).map(g=>g.id));
    const modalGuestSet = new Set(modalGuestIds);
    const findService = name => catalog.byName.get(name) || (catalog.categories[0]?.services[0] || null);
    const orderedGuests = () => modalGuestIds.slice();
    let assignedIds = modalGuestIds.slice();
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
      const derivedEnd = addMinutesToTime(start, duration);
      const overrideEnd = overrides.end ? String(overrides.end).trim() : '';
      const hasOverrideEnd = overrideEnd !== '';
      const explicitEnd = overrides.explicitEnd ?? (hasOverrideEnd && overrideEnd !== derivedEnd);
      const end = explicitEnd ? overrideEnd : derivedEnd;
      return {
        guestId: overrides.guestId || '',
        serviceName: svc?.name || overrides.serviceName || '',
        serviceCategory: svc?.category || overrides.serviceCategory || '',
        durationMinutes: duration,
        start,
        end,
        explicitEnd,
        therapist: overrides.therapist || 'no-preference',
        location: overrides.location || 'same-cabana',
        supportsInRoom: svc?.supportsInRoom !== false
      };
    };

    const TEMPLATE_ID = '__template__';
    // Modal form state lives in `selections`; every time-related update mutates
    // these entries so the save handler can diff against this single source of truth.
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
          end: existingSelection.end,
          explicitEnd: existingSelection.explicitEnd === true,
          therapist: existingSelection.therapist,
          location: existingSelection.location,
          supportsInRoom: svc?.supportsInRoom !== false
        });
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

    const orderedAssigned = () => orderedGuests().filter(id => assignedSet.has(id));

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
    dialog.setAttribute('role','dialog');
    dialog.setAttribute('aria-modal','true');

    const header = document.createElement('div');
    header.className='modal-header';
    const title=document.createElement('h2');
    title.className='modal-title';
    title.id='spa-dialog-title';
    title.textContent='Spa';
    const spaModeDescriptor=document.createElement('span');
    spaModeDescriptor.className='sr-only';
    spaModeDescriptor.textContent = existing ? ' – Editing spa appointment' : ' – Add spa appointment';
    title.appendChild(spaModeDescriptor);
    dialog.setAttribute('aria-labelledby','spa-dialog-title');
    const closeBtn=createModalCloseButton(()=> closeSpaEditor({returnFocus:true}));
    header.appendChild(title);
    header.appendChild(closeBtn);
    dialog.appendChild(header);

    const body = document.createElement('div');
    body.className='modal-body spa-body';
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
      const visibleIds = orderedGuests();
      const visibleGuests = visibleIds.map(id => stayGuestLookup.get(id)).filter(Boolean);
      const singleGuestStay = state.guests.length===1;
      const singleGuestRoster = singleGuestStay && state.guests[0] && modalGuestSet.has(state.guests[0].id);
      if(singleGuestRoster && state.guests[0]){
        assignedSet.add(state.guests[0].id);
      }
      const assigned = orderedAssigned();
      const uniform = inUniformMode();
      const confirmedCount = countConfirmedGuests();
      const outstandingIds = confirmedCount>0 ? assigned.filter(id => !guestConfirmState.get(id)) : [];
      const outstandingNames = outstandingIds.map(id => {
        const entry = stayGuestLookup.get(id);
        return entry ? entry.name : '';
      }).filter(Boolean);
      const activeId = (!uniform && activeGuestId && assignedSet.has(activeGuestId)) ? activeGuestId : null;

      guestHeading.textContent = visibleIds.length===1 ? 'Guest' : 'Guests';

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
          // Mirror the roster color palette for static pills so the modal can
          // expose the same accent via CSS variables.
          wrapper.style.setProperty('--pill-bg', solo.color);
          wrapper.style.setProperty('--pill-fg', solo.color);
          wrapper.style.setProperty('--pill-accent', solo.color);
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

      if(visibleGuests.length===0){
        guestHint.hidden=false;
        guestHint.textContent='No guests were selected when the spa modal opened. Close the modal and toggle guest pills on to add them.';
        guestHint.classList.add('spa-helper-error');
        updateConfirmState();
        return;
      }

      visibleGuests.forEach(guest => {
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
        // main guest chips and expose that accent to the confirmation control.
        pill.style.setProperty('--pillColor', guest.color);
        wrapper.style.setProperty('--pill-bg', guest.color);
        wrapper.style.setProperty('--pill-fg', guest.color);
        wrapper.style.setProperty('--pill-accent', guest.color);
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
      if(!id || !modalGuestSet.has(id)){
        return;
      }
      if(assignedSet.has(id)){
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

    const footer=document.createElement('div');
    footer.className='modal-footer';
    const footerStart=document.createElement('div');
    footerStart.className='modal-footer-start';
    const footerEnd=document.createElement('div');
    footerEnd.className='modal-footer-end';
    const confirmIsEdit = mode==='edit' && !!existing;
    const confirmLabel = confirmIsEdit ? 'Save spa appointment' : 'Add spa appointment';
    const confirmIcon = confirmIsEdit ? saveIconSvg : addIconSvg;
    const confirmBtn = createIconButton({ icon: confirmIcon, label: confirmLabel, extraClass: 'btn-icon--primary' });
    footerEnd.appendChild(confirmBtn);
    let removeBtn=null;
    if(confirmIsEdit){
      // Editing exposes a destructive control that clears the entire merged
      // appointment; inline chips remain responsible for single-guest removals.
      removeBtn=createIconButton({ icon: deleteIconSvg, label: 'Delete spa appointment', extraClass: 'btn-icon--subtle' });
      footerStart.appendChild(removeBtn);
    }
    footer.appendChild(footerStart);
    footer.appendChild(footerEnd);
    dialog.appendChild(footer);

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
      const assigned = orderedAssigned();
      const effectiveTargets = targets.length>0
        ? targets
        : (assigned.length>0 ? assigned : [TEMPLATE_ID]);
      const nextStart = to24Time(value);
      let touched = false;
      effectiveTargets.forEach(id => {
        const selection = getSelectionFor(id);
        const prevStart = selection.start;
        const prevEnd = selection.end;
        selection.start = nextStart;
        if(selection.explicitEnd){
          // Manual end times should persist unless explicitly changed by the user.
        }else{
          selection.end = addMinutesToTime(selection.start, selection.durationMinutes);
        }
        if(prevStart !== selection.start || prevEnd !== selection.end){
          touched = true;
        }
      });
      const sourceId = effectiveTargets.find(id => id!==TEMPLATE_ID) || effectiveTargets[0] || TEMPLATE_ID;
      syncTemplateFromSourceId(sourceId);
      if(touched){
        markGuestsDirty(effectiveTargets);
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
          timeHint.textContent = parsed.error==='missing-meridiem' ? 'Include am or pm' : 'Enter a valid time (e.g., 7:00am)';
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
        const canonical = formatTimeDisplay(to24Time(parsed));
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
      input.placeholder='e.g. 7:00am';
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
        const singleGuestLocked = singleGuestStay && value !== 'in-room';
        const disabled = (value==='in-room' && !supportsInRoom) || singleGuestLocked;
        btn.classList.toggle('selected', selection?.location===value);
        btn.setAttribute('aria-pressed', selection?.location===value ? 'true' : 'false');
        btn.disabled = disabled;
        btn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
      });
      // The helper content remains present for screen readers only; visually the
      // layout stays fixed because the element never takes up space.
      const helperMessages = [];
      if(!supportsInRoom){
        helperMessages.push('In-Room service is unavailable for this treatment.');
      }
      if(singleGuestStay){
        helperMessages.push('Cabana sharing is available once another guest is added to the stay.');
      }
      locationHelper.textContent = helperMessages.join(' ');
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
        const startLabel = formatTimeDisplay(selection.start);
        const endLabel = formatTimeDisplay(selection.end);
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
        if(!selection.explicitEnd){
          selection.end = addMinutesToTime(selection.start, selection.durationMinutes);
        }
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
        if(!selection.explicitEnd){
          selection.end = addMinutesToTime(selection.start, minutes);
        }
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
      if(singleGuestStay && id !== 'in-room'){
        // Single-guest stays only allow in-room treatments; other cabana choices
        // remain visible but locked so ignore programmatic attempts as well.
        return;
      }
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
        const computedEnd = addMinutesToTime(startValue, base.durationMinutes);
        const hasExplicitEnd = base.explicitEnd && !!base.end;
        const endValue = hasExplicitEnd ? base.end : computedEnd;
        const snapshot = {
          guestId: id,
          serviceName: base.serviceName,
          serviceCategory: base.serviceCategory,
          durationMinutes: base.durationMinutes,
          start: startValue,
          end: endValue,
          therapist: base.therapist,
          location: base.location,
          explicitEnd: hasExplicitEnd
        };
        selections.set(id, {
          ...base,
          guestId: id,
          start: startValue,
          end: endValue,
          explicitEnd: hasExplicitEnd
        });
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

      // Persist by patching the existing schedule entry so activities + preview
      // immediately redraw from the updated state (the store handles resorting).
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

  function closeCustomBuilder({returnFocus=false}={}){
    if(!customDialog) return;
    const { overlay, previousFocus, cleanup } = customDialog;
    overlay.remove();
    if(typeof cleanup === 'function') cleanup();
    if(returnFocus && previousFocus && typeof previousFocus.focus==='function'){
      previousFocus.focus();
    }
    customDialog = null;
    document.body.classList.remove('custom-lock');
  }

  // Custom builder surfaces the dual title inputs (free text vs catalog) and
  // funnels start/end selection through the shared time picker kit so physics
  // stay consistent with dinner/spa flows.
  function openCustomBuilder({mode='add', dateKey, entryId, guestIds}={}){
    if(state.dataStatus!=='ready') return;
    closeCustomBuilder();

    const targetDateKey = dateKey || keyDate(state.focus);
    const existing = entryId ? getCustomEntry(targetDateKey, entryId) : null;
    const previousFocus = document.activeElement;
    const catalog = state.customCatalog || { titles: [], locations: [] };
    const stayGuestLookup = new Map(state.guests.map(g=>[g.id,g]));
    const normalizeGuestIds = ids => {
      const requested = Array.isArray(ids) ? ids.filter(Boolean) : [];
      const requestedSet = new Set(requested);
      const seen = new Set();
      const normalized = [];
      state.guests.forEach(guest => {
        if(requestedSet.has(guest.id) && !seen.has(guest.id)){
          seen.add(guest.id);
          normalized.push(guest.id);
        }
      });
      requested.forEach(id => {
        if(!seen.has(id) && stayGuestLookup.has(id)){
          seen.add(id);
          normalized.push(id);
        }
      });
      return normalized;
    };

    const defaultActiveIds = state.guests.filter(g=>g.active).map(g=>g.id);
    const requestedIds = existing
      ? Array.from(existing.guestIds || [])
      : (Array.isArray(guestIds) ? guestIds : defaultActiveIds);
    let modalGuestIds = normalizeGuestIds(requestedIds);
    if(modalGuestIds.length===0){
      modalGuestIds = normalizeGuestIds(defaultActiveIds);
    }
    // Guest assignments reuse the same chip helpers as the activities rail, so
    // we only need to capture the IDs once here before the chips handle any
    // inline removals after save.

    const initialTitle = existing?.title || '';
    const matchingActivity = catalog.titles.find(opt => opt.title === initialTitle) || null;
    let titleMode = 'free';
    let selectedActivity = matchingActivity;
    let freeTitleValue = initialTitle;
    let locationValue = existing?.location || selectedActivity?.location || '';
    let locationManual = Boolean(existing?.location);
    let startValue = existing?.start || '';
    let endValue = existing?.end || '';
    let currentTimeError = '';
    const initialPickerValue = startValue ? from24Time(startValue) : { hour:9, minute:0, meridiem:'AM' };
    let currentPickerValue = initialPickerValue;

    const overlay=document.createElement('div');
    overlay.className='custom-overlay';

    const dialog=document.createElement('div');
    dialog.className='custom-dialog';
    dialog.setAttribute('role','dialog');
    dialog.setAttribute('aria-modal','true');
    dialog.setAttribute('aria-labelledby','custom-dialog-title');

    const header=document.createElement('div');
    header.className='modal-header';
    const title=document.createElement('h2');
    title.className='modal-title';
    title.id='custom-dialog-title';
    title.textContent='Custom';
    const customModeDescriptor=document.createElement('span');
    customModeDescriptor.className='sr-only';
    customModeDescriptor.textContent = existing ? ' – Editing custom activity' : ' – Add custom activity';
    title.appendChild(customModeDescriptor);
    header.appendChild(title);

    const closeBtn=createModalCloseButton(()=> closeCustomBuilder({returnFocus:true}));
    header.appendChild(closeBtn);

    dialog.appendChild(header);

    const body=document.createElement('div');
    // Keep scrolling inside the content wrapper so the header/footer stay
    // pinned while the dialog respects the viewport-safe max height.
    body.className='modal-body custom-body';
    dialog.appendChild(body);

    const titleSection=document.createElement('section');
    titleSection.className='custom-section custom-section-title';
    const titleHeading=document.createElement('h3');
    titleHeading.textContent='Title';
    titleSection.appendChild(titleHeading);

    const toggleGroup=document.createElement('div');
    toggleGroup.className='custom-title-toggle-group';

    const freeToggle=document.createElement('button');
    freeToggle.type='button';
    freeToggle.className='custom-title-toggle';
    freeToggle.dataset.mode='free';
    freeToggle.textContent='Type a title';
    toggleGroup.appendChild(freeToggle);

    const existingToggle=document.createElement('button');
    existingToggle.type='button';
    existingToggle.className='custom-title-toggle';
    existingToggle.dataset.mode='existing';
    existingToggle.textContent='Choose existing';
    existingToggle.setAttribute('aria-haspopup','listbox');
    if(!catalog.titles.length){ existingToggle.disabled = true; }
    toggleGroup.appendChild(existingToggle);

    titleSection.appendChild(toggleGroup);

    const freePane=document.createElement('div');
    freePane.className='custom-title-pane';
    const freeInput=document.createElement('input');
    freeInput.type='text';
    freeInput.className='custom-title-input';
    freeInput.placeholder='Name this activity';
    freeInput.value = freeTitleValue;
    freePane.appendChild(freeInput);

    const existingPane=document.createElement('div');
    existingPane.className='custom-title-pane custom-existing-pane';
    const existingField=document.createElement('div');
    existingField.className='custom-existing-field';
    const existingHeader=document.createElement('div');
    existingHeader.className='custom-existing-header';
    const typeInsteadBtn=document.createElement('button');
    typeInsteadBtn.type='button';
    typeInsteadBtn.className='custom-existing-back';
    typeInsteadBtn.textContent='Type instead';
    typeInsteadBtn.setAttribute('aria-label','Return to typing');
    typeInsteadBtn.addEventListener('click',()=> setTitleMode('free'));
    existingHeader.appendChild(typeInsteadBtn);
    existingField.appendChild(existingHeader);

    // Inline list lives inside the field wrapper so the modal height stays fixed
    // while still surfacing catalog titles without a separate popover.
    const existingList=document.createElement('div');
    existingList.className='custom-existing-list';
    existingList.setAttribute('role','listbox');
    const existingListId = `custom-existing-list-${Date.now()}`;
    existingList.id = existingListId;
    existingToggle.setAttribute('aria-controls', existingListId);
    existingField.appendChild(existingList);
    existingPane.appendChild(existingField);

    titleSection.appendChild(freePane);
    titleSection.appendChild(existingPane);
    body.appendChild(titleSection);

    const timeSection=document.createElement('section');
    timeSection.className='custom-section custom-section-time';
    const timeHeading=document.createElement('h3');
    timeHeading.textContent='Time';
    timeSection.appendChild(timeHeading);

    const timeSummary=document.createElement('div');
    timeSummary.className='custom-time-summary';

    const startPill=document.createElement('div');
    startPill.className='custom-time-pill';
    const startLabel=document.createElement('span');
    startLabel.className='custom-time-pill-label';
    startLabel.textContent='Start';
    const startValueNode=document.createElement('span');
    startValueNode.className='custom-time-value';
    startPill.appendChild(startLabel);
    startPill.appendChild(startValueNode);
    timeSummary.appendChild(startPill);

    const endPill=document.createElement('div');
    endPill.className='custom-time-pill optional';
    const endLabel=document.createElement('span');
    endLabel.className='custom-time-pill-label';
    endLabel.textContent='End';
    const endValueNode=document.createElement('span');
    endValueNode.className='custom-time-value';
    const clearEndBtn=document.createElement('button');
    clearEndBtn.type='button';
    clearEndBtn.className='custom-clear-end';
    clearEndBtn.textContent='Clear';
    clearEndBtn.addEventListener('click',()=>{
      endValue='';
      updateEndDisplay();
      setTimeError('');
      refreshSaveState();
    });
    endPill.appendChild(endLabel);
    endPill.appendChild(endValueNode);
    endPill.appendChild(clearEndBtn);
    timeSummary.appendChild(endPill);

    timeSection.appendChild(timeSummary);

    const pickerContainer=document.createElement('div');
    pickerContainer.className='custom-picker';
    timeSection.appendChild(pickerContainer);

    const pickerActions=document.createElement('div');
    pickerActions.className='custom-picker-actions';

    const setStartBtn=document.createElement('button');
    setStartBtn.type='button';
    setStartBtn.className='custom-time-action';
    setStartBtn.setAttribute('aria-label','Set start time');
    setStartBtn.title='Set start time';
    // Icon-only affordance keeps the control compact while the aria-label
    // surfaces the accessible name after dropping the text caption.
    setStartBtn.innerHTML = `<span class="custom-time-icon">${customSetStartSvg}</span>`;
    pickerActions.appendChild(setStartBtn);

    const setEndBtn=document.createElement('button');
    setEndBtn.type='button';
    setEndBtn.className='custom-time-action';
    setEndBtn.setAttribute('aria-label','Set end time');
    setEndBtn.title='Set end time';
    setEndBtn.innerHTML = `<span class="custom-time-icon">${customSetEndSvg}</span>`;
    pickerActions.appendChild(setEndBtn);

    timeSection.appendChild(pickerActions);

    const timeError=document.createElement('p');
    timeError.className='custom-time-error';
    timeError.hidden=true;
    timeSection.appendChild(timeError);

    body.appendChild(timeSection);

    const locationSection=document.createElement('section');
    locationSection.className='custom-section custom-section-location';
    const locationHeading=document.createElement('h3');
    locationHeading.textContent='Location (optional)';
    locationSection.appendChild(locationHeading);
    // Location list is sourced from the CHS activities metadata so preview copy
    // and in-app chips both draw from the same canonical venue names.
    const locationSelect=document.createElement('select');
    locationSelect.className='custom-location-select';
    const emptyOption=document.createElement('option');
    emptyOption.value='';
    emptyOption.textContent='No location';
    locationSelect.appendChild(emptyOption);
    catalog.locations.forEach(loc=>{
      const opt=document.createElement('option');
      opt.value=loc;
      opt.textContent=loc;
      locationSelect.appendChild(opt);
    });
    locationSelect.value = locationValue || '';
    locationSelect.addEventListener('change',()=>{
      locationManual = true;
      locationValue = locationSelect.value;
    });
    locationSection.appendChild(locationSelect);
    body.appendChild(locationSection);

    const guestSection=document.createElement('section');
    guestSection.className='custom-section custom-section-guests';
    const guestHeading=document.createElement('h3');
    guestHeading.textContent='Guests';
    guestSection.appendChild(guestHeading);
    const guestSummary=document.createElement('p');
    guestSummary.className='custom-guest-summary';
    guestSection.appendChild(guestSummary);
    body.appendChild(guestSection);

    const footer=document.createElement('div');
    footer.className='modal-footer';
    const footerStart=document.createElement('div');
    footerStart.className='modal-footer-start';
    const footerEnd=document.createElement('div');
    footerEnd.className='modal-footer-end';
    const saveIsEdit = !!existing;
    const saveLabel = saveIsEdit ? 'Save custom activity' : 'Add custom activity';
    const saveIcon = saveIsEdit ? saveIconSvg : addIconSvg;
    const saveBtn=createIconButton({ icon: saveIcon, label: saveLabel, extraClass: 'btn-icon--primary' });
    footerEnd.appendChild(saveBtn);
    let deleteBtn=null;
    if(saveIsEdit){
      deleteBtn=createIconButton({ icon: deleteIconSvg, label: 'Delete custom activity', extraClass: 'btn-icon--subtle' });
      footerStart.appendChild(deleteBtn);
    }
    footer.appendChild(footerStart);
    footer.appendChild(footerEnd);
    dialog.appendChild(footer);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    document.body.classList.add('custom-lock');
    body.scrollTop = 0;
    body.scrollTo?.({ top:0, left:0, behavior:'auto' });
    requestAnimationFrame(()=>{
      body.scrollTop = 0;
      body.scrollTo?.({ top:0, left:0, behavior:'auto' });
    });

    const updateGuestSummary=()=>{
      const names=[];
      const seen=new Set();
      modalGuestIds.forEach(id=>{
        if(seen.has(id)) return;
        seen.add(id);
        const guest=stayGuestLookup.get(id);
        if(guest?.name){
          names.push(guest.name);
        }
      });
      if(names.length){
        guestSummary.textContent = `Guests: ${names.join(', ')}`;
        guestSummary.dataset.empty='false';
      }else{
        guestSummary.textContent = 'Guests: None selected (toggle guest pills before saving).';
        guestSummary.dataset.empty='true';
      }
    };

    const updateStartDisplay=()=>{
      if(startValue){
        startValueNode.textContent = formatTimeDisplay(startValue);
        startPill.dataset.empty='false';
      }else{
        startValueNode.textContent = 'Set start';
        startPill.dataset.empty='true';
      }
    };

    const updateEndDisplay=()=>{
      if(endValue){
        endValueNode.textContent = formatTimeDisplay(endValue);
        endPill.dataset.empty='false';
        clearEndBtn.disabled=false;
      }else{
        endValueNode.textContent = 'Optional';
        endPill.dataset.empty='true';
        clearEndBtn.disabled=true;
      }
    };

    const setTimeError=message=>{
      currentTimeError = message ? String(message) : '';
      if(currentTimeError){
        timeError.textContent = currentTimeError;
        timeError.hidden=false;
      }else{
        timeError.textContent='';
        timeError.hidden=true;
      }
    };

    const findCatalogIndex=title=>{
      if(!title) return -1;
      const normalized=String(title).trim().toLowerCase();
      if(!normalized) return -1;
      return catalog.titles.findIndex(opt=> opt.title.toLowerCase()===normalized);
    };

    const existingRows=[];
    let existingActiveIndex = selectedActivity ? findCatalogIndex(selectedActivity.title) : 0;
    if(existingActiveIndex<0) existingActiveIndex = 0;

    const resolveTitle=()=> freeTitleValue.trim();

    const syncSelectedActivityFromTitle=value=>{
      const matchIndex = findCatalogIndex(value);
      if(matchIndex>=0){
        selectedActivity = catalog.titles[matchIndex];
        if(!locationManual && selectedActivity.location){
          locationValue = selectedActivity.location;
          locationSelect.value = selectedActivity.location;
        }
        existingActiveIndex = matchIndex;
      }else{
        selectedActivity = null;
        existingActiveIndex = 0;
      }
    };

    // Roving focus keeps the embedded list keyboardable without moving the
    // surrounding shell, and we reuse the same helper for pointer + key input.
    const setExistingActive=(index,{focus=true,fromPointer=false}={})=>{
      if(!existingRows.length) return;
      const bounded = Math.max(0, Math.min(index, existingRows.length-1));
      existingActiveIndex = bounded;
      existingRows.forEach((row,i)=>{
        const isActive = i===bounded;
        row.classList.toggle('active', isActive);
        row.setAttribute('aria-selected', isActive ? 'true' : 'false');
        row.tabIndex = isActive ? 0 : -1;
      });
      const target = existingRows[bounded];
      if(target){
        if(focus){
          focusWithoutScroll(target);
        }
        if(!fromPointer){
          target.scrollIntoView({ block:'nearest', inline:'nearest' });
        }
      }
    };

    // Selecting a catalog row writes the title back into the text field so the
    // builder returns to its normal state without losing the dataset link.
    const chooseExistingByIndex=index=>{
      if(index<0 || index>=catalog.titles.length) return;
      const option = catalog.titles[index];
      if(!option) return;
      existingActiveIndex = index;
      selectedActivity = option;
      freeTitleValue = option.title;
      freeInput.value = option.title;
      if(!locationManual && option.location){
        locationValue = option.location;
        locationSelect.value = option.location;
      }
      setExistingActive(index,{ focus:false, fromPointer:true });
      setTitleMode('free');
      refreshSaveState();
    };

    catalog.titles.forEach((opt,index)=>{
      const row=document.createElement('button');
      row.type='button';
      row.className='custom-existing-row';
      row.dataset.index=String(index);
      row.setAttribute('role','option');
      row.setAttribute('aria-selected','false');
      row.tabIndex=-1;
      const titleLine=document.createElement('span');
      titleLine.className='custom-existing-title';
      titleLine.textContent = opt.title;
      row.appendChild(titleLine);
      if(opt.location){
        const locationLine=document.createElement('span');
        locationLine.className='custom-existing-sub';
        locationLine.textContent = opt.location;
        row.appendChild(locationLine);
        row.setAttribute('aria-label', `${opt.title} – ${opt.location}`);
      }else{
        row.setAttribute('aria-label', opt.title);
      }
      row.addEventListener('click',()=> chooseExistingByIndex(index));
      row.addEventListener('mouseenter',()=> setExistingActive(index,{ focus:false, fromPointer:true }));
      row.addEventListener('focus',()=> setExistingActive(index,{ focus:false }));
      existingList.appendChild(row);
      existingRows.push(row);
    });

    if(existingRows.length){
      setExistingActive(existingActiveIndex,{ focus:false, fromPointer:true });
    }

    const refreshSaveState=()=>{
      const titleValue = resolveTitle();
      const titleValid = titleValue.length>0;
      const startValid = !!startValue;
      const guestsValid = modalGuestIds.length>0;
      if(titleMode==='free'){
        if(titleValid){
          freeInput.removeAttribute('aria-invalid');
        }else{
          freeInput.setAttribute('aria-invalid','true');
        }
      }else{
        freeInput.removeAttribute('aria-invalid');
      }
      saveBtn.disabled = !(titleValid && startValid && guestsValid && !currentTimeError);
    };

    freeInput.addEventListener('input',()=>{
      freeTitleValue = freeInput.value;
      syncSelectedActivityFromTitle(freeTitleValue);
      refreshSaveState();
    });

    const setTitleMode=mode=>{
      const nextMode = (mode==='existing' && !existingToggle.disabled) ? 'existing' : 'free';
      titleMode = nextMode;
      const listActive = titleMode==='existing';
      freePane.hidden = listActive;
      existingPane.hidden = !listActive;
      freeToggle.classList.toggle('selected', !listActive);
      existingToggle.classList.toggle('selected', listActive);
      freeToggle.setAttribute('aria-pressed', !listActive ? 'true' : 'false');
      existingToggle.setAttribute('aria-pressed', listActive ? 'true' : 'false');
      existingToggle.setAttribute('aria-expanded', listActive ? 'true' : 'false');
      refreshSaveState();
      if(listActive){
        requestAnimationFrame(()=>{
          if(existingRows.length){
            const candidate = existingActiveIndex>=0 ? existingActiveIndex : 0;
            setExistingActive(candidate,{ focus:true });
          }else{
            focusWithoutScroll(typeInsteadBtn);
          }
        });
      }else{
        requestAnimationFrame(()=> focusWithoutScroll(freeInput));
      }
    };

    freeToggle.addEventListener('click',()=> setTitleMode('free'));
    existingToggle.addEventListener('click',()=>{
      if(titleMode==='existing'){
        setTitleMode('free');
      }else{
        setTitleMode('existing');
      }
    });

    existingPane.addEventListener('keydown',event=>{
      if(titleMode!=='existing') return;
      const key=event.key;
      if(key==='ArrowDown' || key==='Down'){
        event.preventDefault();
        setExistingActive(existingActiveIndex+1);
        return;
      }
      if(key==='ArrowUp' || key==='Up'){
        event.preventDefault();
        setExistingActive(existingActiveIndex-1);
        return;
      }
      if(key==='Home'){
        event.preventDefault();
        setExistingActive(0);
        return;
      }
      if(key==='End'){
        event.preventDefault();
        setExistingActive(existingRows.length-1);
        return;
      }
      if(key==='Escape'){
        event.preventDefault();
        setTitleMode('free');
        event.stopPropagation();
        return;
      }
      if((key==='Enter' || key===' ' || key==='Space' || key==='Spacebar') && document.activeElement && document.activeElement.classList.contains('custom-existing-row')){
        // Space/Enter should commit the highlighted row even if the browser skips the implicit click.
        event.preventDefault();
        const idx = Number(document.activeElement.dataset.index || existingActiveIndex);
        chooseExistingByIndex(Number.isFinite(idx) ? idx : existingActiveIndex);
      }
    });

    const applyStartValue=()=>{
      const snapshot = currentPickerValue || (typeof timePicker?.getValue==='function' ? timePicker.getValue() : null);
      if(!snapshot) return;
      startValue = to24Time(snapshot);
      updateStartDisplay();
      if(endValue && minutesFromTime(endValue) <= minutesFromTime(startValue)){
        setTimeError('End time must be after the start time.');
      }else{
        setTimeError('');
      }
      refreshSaveState();
    };

    const applyEndValue=()=>{
      if(!startValue){
        setTimeError('Set a start time before choosing an end time.');
        refreshSaveState();
        return;
      }
      const snapshot = currentPickerValue || (typeof timePicker?.getValue==='function' ? timePicker.getValue() : null);
      if(!snapshot) return;
      const candidate = to24Time(snapshot);
      if(minutesFromTime(candidate) <= minutesFromTime(startValue)){
        setTimeError('End time must be after the start time.');
        endValue = candidate;
      }else{
        endValue = candidate;
        setTimeError('');
      }
      updateEndDisplay();
      refreshSaveState();
    };

    setStartBtn.addEventListener('click', applyStartValue);
    setEndBtn.addEventListener('click', applyEndValue);

    let timePicker=null;
    if(typeof createTimePicker === 'function'){
      // Reuse the shared time picker so visuals + physics remain identical to
      // dinner/spa flows.
      timePicker = createTimePicker({
        hourRange:[1,12],
        minuteStep:5,
        showAmPm:true,
        defaultValue: initialPickerValue,
        ariaLabels:{ hours:'Hour', minutes:'Minutes', meridiem:'AM or PM' },
        onChange:value=>{ currentPickerValue = value; }
      });
    }

    if(timePicker){
      pickerContainer.appendChild(timePicker.element);
    }else{
      const fallback=document.createElement('div');
      fallback.className='custom-picker-fallback';
      fallback.textContent='Time picker unavailable.';
      pickerContainer.appendChild(fallback);
    }

    const handleSave=()=>{
      const titleValue = resolveTitle();
      if(!titleValue || !startValue || modalGuestIds.length===0 || currentTimeError){
        refreshSaveState();
        return;
      }
      const payload = {
        id: existing?.id,
        title: titleValue,
        start: startValue,
        end: endValue || '',
        location: locationValue,
        guestIds: modalGuestIds.slice()
      };
      upsertCustomEntry(targetDateKey, payload);
      markPreviewDirty();
      renderActivities();
      renderPreview();
      closeCustomBuilder({returnFocus:true});
    };

    saveBtn.addEventListener('click', handleSave);

    if(deleteBtn && existing){
      deleteBtn.addEventListener('click',()=>{
        removeCustomEntry(targetDateKey, existing.id);
        markPreviewDirty();
        renderActivities();
        renderPreview();
        closeCustomBuilder({returnFocus:true});
      });
    }

    overlay.addEventListener('click',event=>{
      if(event.target===overlay){
        closeCustomBuilder({returnFocus:true});
      }
    });

    const handleKeyDown=event=>{
      if(event.key==='Escape'){
        if(titleMode==='existing' && existingPane.contains(document.activeElement)){
          event.preventDefault();
          setTitleMode('free');
          return;
        }
        event.preventDefault();
        closeCustomBuilder({returnFocus:true});
        return;
      }
      if((event.key==='Enter' || event.key==='Return') && event.target && event.target.tagName!=='BUTTON'){
        event.preventDefault();
        handleSave();
        return;
      }
      if(event.key==='Tab'){
        const focusable = Array.from(dialog.querySelectorAll('button,select,input,[tabindex]:not([tabindex="-1"])')).filter(el=> !el.disabled && el.offsetParent!==null);
        if(focusable.length===0) return;
        const first=focusable[0];
        const last=focusable[focusable.length-1];
        if(event.shiftKey){
          if(document.activeElement===first){
            event.preventDefault();
            last.focus();
          }
        }else{
          if(document.activeElement===last){
            event.preventDefault();
            first.focus();
          }
        }
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);

    updateGuestSummary();
    updateStartDisplay();
    updateEndDisplay();
    setTimeError('');
    setTitleMode(titleMode);
    refreshSaveState();

    const focusInitial=()=>{
      if(titleMode==='existing' && existingRows.length){
        setExistingActive(existingActiveIndex>=0 ? existingActiveIndex : 0, { focus:true });
        return;
      }
      if(freeInput){
        focusWithoutScroll(freeInput);
        return;
      }
      if(timePicker?.focus){
        timePicker.focus({ preventScroll:true });
      }
    };

    setTimeout(focusInitial,0);

    customDialog = {
      overlay,
      dialog,
      previousFocus,
      cleanup(){
        timePicker?.dispose?.();
        dialog.removeEventListener('keydown', handleKeyDown);
      }
    };
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

  const generateCustomEntryId = () => (crypto.randomUUID ? crypto.randomUUID() : `custom_${Date.now()}_${Math.random().toString(16).slice(2)}`);

  function getCustomEntries(dateK){
    const day = state.schedule[dateK];
    if(!day) return [];
    return day.filter(entry => entry.type==='custom');
  }

  function getCustomEntry(dateK, entryId){
    const day = state.schedule[dateK];
    if(!day) return null;
    return day.find(entry => entry.type==='custom' && entry.id===entryId) || null;
  }

  // Custom entries sit inside the same day array as preset activities, so we
  // reuse the shared sorter after every save to keep chronological insertion in
  // lockstep with the existing row renderer.
  function upsertCustomEntry(dateK, config){
    if(!dateK || !config) return null;
    const title = (config.title || '').trim();
    const start = (config.start || '').trim();
    const end = (config.end || '').trim();
    const location = (config.location || '').trim();
    const guestIds = Array.isArray(config.guestIds) ? config.guestIds.filter(Boolean) : [];
    const day = getOrCreateDay(dateK);
    const existingId = config.id || null;
    let entry = existingId ? day.find(item => item.type==='custom' && item.id===existingId) : null;
    if(!entry){
      entry = { type:'custom', id: existingId || generateCustomEntryId(), title:'', start:'', end:null, location:null, guestIds:new Set() };
      day.push(entry);
    }
    entry.title = title;
    entry.start = start;
    entry.end = end ? end : null;
    entry.location = location ? location : null;
    entry.guestIds = new Set(guestIds);
    sortDayEntries(dateK);
    return entry;
  }

  function removeCustomEntry(dateK, entryId){
    const day = state.schedule[dateK];
    if(!day) return;
    const idx = day.findIndex(entry => entry.type==='custom' && entry.id===entryId);
    if(idx>-1){
      day.splice(idx,1);
      if(day.length===0) delete state.schedule[dateK];
    }
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
      mergeSpaEntriesForDay(key);
      if(day.length===0){
        purgeKeys.push(key);
      }
    }
    purgeKeys.forEach(key => delete state.schedule[key]);
  }

  function syncCustomGuests(){
    const activeIds = new Set(state.guests.map(g=>g.id));
    const purgeKeys = [];
    for(const key of Object.keys(state.schedule)){
      const day = state.schedule[key];
      if(!day) continue;
      for(let i = day.length - 1; i >= 0; i--){
        const entry = day[i];
        if(!entry || entry.type!=='custom') continue;
        const ids = entry.guestIds instanceof Set
          ? Array.from(entry.guestIds)
          : Array.isArray(entry.guestIds) ? entry.guestIds.slice() : [];
        const filtered = ids.filter(id => activeIds.has(id));
        entry.guestIds = new Set(filtered);
        if(entry.guestIds.size===0){
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

  const spaAppointmentKey = app => {
    if(!app) return null;
    const safe = value => value ?? '';
    return [
      safe(app.serviceName),
      safe(app.serviceCategory),
      safe(app.durationMinutes),
      safe(app.start),
      safe(app.end),
      safe(app.explicitEnd ? 'explicit' : ''),
      safe(app.therapist),
      safe(app.location)
    ].join('|');
  };

  function mergeSpaEntriesForDay(dateK){
    const day = state.schedule[dateK];
    if(!day) return;
    const spaEntries = day.filter(entry => entry.type==='spa');
    if(spaEntries.length < 2) return;

    const primaryByKey = new Map();
    const removals = new Set();

    spaEntries.forEach(entry => {
      if(!entry.appointments) entry.appointments = [];
      entry.appointments = entry.appointments.filter(app => app && app.guestId);
    });

    spaEntries.forEach(entry => {
      if(removals.has(entry)) return;
      if(entry.appointments.length===0) return;
      const keys = entry.appointments.map(spaAppointmentKey).filter(Boolean);
      if(keys.length===0) return;
      const canonical = keys[0];
      const uniform = keys.every(key => key===canonical);
      if(!uniform){
        recomputeSpaEntrySummary(entry);
        return;
      }
      if(!primaryByKey.has(canonical)){
        primaryByKey.set(canonical, entry);
        recomputeSpaEntrySummary(entry);
        return;
      }
      const primary = primaryByKey.get(canonical);
      const existingIds = new Set(Array.from(primary.guestIds || []));
      entry.appointments.forEach(app => {
        if(!app || !app.guestId) return;
        if(existingIds.has(app.guestId)) return;
        primary.appointments.push({ ...app });
        existingIds.add(app.guestId);
      });
      recomputeSpaEntrySummary(primary);
      removals.add(entry);
    });

    if(removals.size>0){
      state.schedule[dateK] = day.filter(entry => !removals.has(entry));
      sortDayEntries(dateK);
    }
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
    mergeSpaEntriesForDay(dateK);
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

  function removeSpaGuestFromEntry(dateK, entryId, guestId){
    if(!dateK || !entryId || !guestId) return false;
    const entry = getSpaEntry(dateK, entryId);
    if(!entry) return false;
    const before = Array.isArray(entry.appointments) ? entry.appointments.length : 0;
    entry.appointments = (Array.isArray(entry.appointments) ? entry.appointments : []).filter(app => app && app.guestId !== guestId);
    if(entry.appointments.length === before){
      return false;
    }
    if(entry.appointments.length === 0){
      removeSpaEntry(dateK, entryId);
    }else{
      recomputeSpaEntrySummary(entry);
    }
    mergeSpaEntriesForDay(dateK);
    sortDayEntries(dateK);
    return true;
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
        if(rangesOverlap(a.start, a.end, b.start, b.end)){
          if(overlapMap.has(a.entryId)) overlapMap.set(a.entryId, true);
          if(overlapMap.has(b.entryId)) overlapMap.set(b.entryId, true);
        }
      }
    }
    return overlapMap;
  }

  function normalizeGuestIdCollection(value){
    if(Array.isArray(value)){
      return value.slice();
    }
    if(value instanceof Set){
      return Array.from(value);
    }
    return [];
  }

  // Shared guest-label helper consumed by the activities rail and the email
  // preview. It centralises the "all guests" detection so both surfaces drop
  // redundant pipe-delimited name tags while keeping edit chips intact.
  function buildAssignedGuestNames(inputIds, options){
    const ids = normalizeGuestIdCollection(inputIds);
    if(ids.length===0) return [];
    const totalGuestsInStay = Number.isFinite(options?.totalGuestsInStay)
      ? options.totalGuestsInStay
      : state.guests.length;
    const uniqueIds = [];
    const seenIds = new Set();
    ids.forEach(id => {
      if(!id) return;
      if(seenIds.has(id)) return;
      seenIds.add(id);
      uniqueIds.push(id);
    });
    // Shared rule: when every guest on the stay is assigned, downstream callers
    // skip rendering pipe-delimited labels so the activities list and preview
    // both drop the redundant "everyone" name tags.
    if(totalGuestsInStay > 0 && uniqueIds.length === totalGuestsInStay){
      return [];
    }
    const lookup = options?.guestLookup instanceof Map
      ? options.guestLookup
      : new Map(state.guests.map(g=>[g.id,g]));
    const names = [];
    const seenNames = new Set();
    uniqueIds.forEach(id => {
      const guest = lookup.get(id);
      const raw = (guest?.name || '').trim();
      if(!raw) return;
      const key = raw.toLowerCase();
      if(seenNames.has(key)) return;
      seenNames.add(key);
      names.push(raw);
    });
    names.sort((a,b)=>a.localeCompare(b, undefined, { sensitivity:'base' }));
    return names;
  }

  function collectSpaGuestNames(entry, options){
    if(!entry) return [];
    const lookup = options?.guestLookup instanceof Map
      ? options.guestLookup
      : new Map(state.guests.map(g=>[g.id,g]));
    const assignedIds = normalizeGuestIdCollection(entry?.guestIds);
    const fallbackIds = [];
    if(assignedIds.length===0){
      const appointments = Array.isArray(entry.appointments) ? entry.appointments : [];
      appointments.forEach(app => {
        if(!app || !app.guestId) return;
        fallbackIds.push(app.guestId);
      });
    }
    return buildAssignedGuestNames(assignedIds.length ? assignedIds : fallbackIds, {
      guestLookup: lookup,
      totalGuestsInStay: options?.totalGuestsInStay
    });
  }

  function buildGuestNameListFromIds(ids, options){
    return buildAssignedGuestNames(ids, options);
  }

  const spaCabanaKey = (entryId, guestId) => `${entryId || 'unknown'}::${guestId || 'unknown'}`;

  // Preview-only helper that flags which appointment rows should surface a cabana
  // label. Activities rendering keeps its existing overlap rules so the column
  // stays untouched.
  function computeSpaCabanaVisibility(entries){
    const visibility = new Map();
    const windows = [];
    (entries || []).forEach(entry => {
      if(!entry || entry.type!=='spa') return;
      const entryId = entry.id || '';
      const apps = Array.isArray(entry.appointments) ? entry.appointments : [];
      apps.forEach(app => {
        if(!app) return;
        const guestId = app.guestId || '';
        const key = spaCabanaKey(entryId, guestId);
        const locationId = app.location || 'same-cabana';
        const isInRoom = locationId === 'in-room';
        if(isInRoom){
          visibility.set(key, true);
        }else if(!visibility.has(key)){
          visibility.set(key, false);
        }
        const start = minutesFromTime(app.start);
        const end = minutesFromTime(app.end);
        if(!Number.isFinite(start) || !Number.isFinite(end)) return;
        windows.push({
          key,
          guestId,
          start,
          end,
          isInRoom
        });
      });
    });
    for(let i=0;i<windows.length;i+=1){
      const a = windows[i];
      if(!a) continue;
      for(let j=i+1;j<windows.length;j+=1){
        const b = windows[j];
        if(!b) continue;
        if(!a.guestId || !b.guestId) continue;
        if(a.guestId === b.guestId) continue;
        if(rangesOverlap(a.start, a.end, b.start, b.end)){
          if(!a.isInRoom){
            visibility.set(a.key, true);
          }
          if(!b.isInRoom){
            visibility.set(b.key, true);
          }
        }
      }
    }
    return visibility;
  }

  function buildSpaPreviewLines(entry, options){
    if(!entry || !Array.isArray(entry.appointments)) return [];
    const appointments = entry.appointments.slice();
    if(appointments.length===0) return [];
    const guestLookup = new Map(state.guests.map(g=>[g.id,g]));
    const base = appointments[0];
    const everyoneMatches = appointments.every(app => app.serviceName===base.serviceName && app.durationMinutes===base.durationMinutes && app.start===base.start && app.end===base.end && app.therapist===base.therapist && app.location===base.location);
    const lines = [];
    const cabanaVisibility = options?.cabanaVisibility;
    if(everyoneMatches){
      // When every guest shares the same configuration, pluralise the service label
      // and append the same guest label string the activities row surfaces so the
      // preview mirrors the shared experience copy.
      const serviceTitle = `${formatDurationLabel(base.durationMinutes)} ${pluralizeServiceTitle(base.serviceName)}`;
      const therapist = spaTherapistLabel(base.therapist);
      const location = spaLocationLabel(base.location);
      const guestNames = collectSpaGuestNames(entry, {
        guestLookup,
        totalGuestsInStay: state.guests.length
      });
      const guestLabel = guestNames.length ? ` | ${guestNames.map(name => escapeHtml(name)).join(' | ')}` : '';
      const timeRangeStart = escapeHtml(formatTimeDisplay(base.start));
      const timeRangeEnd = escapeHtml(formatTimeDisplay(base.end));
      const timeRange = `<span class="email-activity-time">${timeRangeStart} – ${timeRangeEnd}</span>`;
      const showCabana = base.location === 'in-room' || appointments.length >= 2;
      const segments = [timeRange, escapeHtml(serviceTitle), escapeHtml(therapist)];
      if(showCabana){
        segments.push(escapeHtml(location));
      }
      // Wrap the spa time range so we can normalize its weight in the preview email.
      lines.push(`${segments.join(' | ')}${guestLabel}`);
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
      const timeRangeStart = escapeHtml(formatTimeDisplay(app.start));
      const timeRangeEnd = escapeHtml(formatTimeDisplay(app.end));
      const timeRange = `<span class="email-activity-time">${timeRangeStart} – ${timeRangeEnd}</span>`;
      const key = spaCabanaKey(entry.id, id);
      const showCabana = app.location === 'in-room' || (cabanaVisibility && cabanaVisibility.get(key));
      const segments = [timeRange, escapeHtml(serviceTitle), escapeHtml(therapist)];
      if(showCabana){
        segments.push(escapeHtml(location));
      }
      // Wrap the per-guest spa time so its font weight matches the rest of the itinerary line.
      lines.push(`${segments.join(' | ')}${guestLabel}`);
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
    const guestLookup = new Map(state.guests.map(g=>[g.id,g]));

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
        const row = makeEl('div', 'email-activity');
        row.appendChild(document.createTextNode(`${formatTimeDisplay('11:00')} Check-Out | Welcome to stay on property until `));
        const stayWindow = makeEl('span', 'email-activity-parenthetical-time', formatTimeDisplay('13:00'));
        row.appendChild(stayWindow);
        return row;
      };
      const checkinLine = () => {
        const row = makeEl('div', 'email-activity');
        row.appendChild(document.createTextNode(`${formatTimeDisplay('16:00')} Guaranteed Check-In | Welcome to arrive as early as `));
        const arrivalWindow = makeEl('span', 'email-activity-parenthetical-time', formatTimeDisplay('12:00'));
        row.appendChild(arrivalWindow);
        return row;
      };

      if(state.departure && keyDate(state.departure)===k)
        daySection.appendChild(checkoutLine());

      if(state.arrival && keyDate(state.arrival)===k)
        daySection.appendChild(checkinLine());

      const items = (state.schedule[k]||[]).slice().sort((a,b)=> (a.start||'').localeCompare(b.start||''));
      const cabanaVisibility = computeSpaCabanaVisibility(items.filter(item => item?.type==='spa'));
      items.forEach(it=>{
        const isDinner = it.type==='dinner';
        if(it.type==='spa'){
          const spaLines = buildSpaPreviewLines(it, { cabanaVisibility });
          spaLines.forEach(line => {
            daySection.appendChild(
              makeEl('div','email-activity', line, {html:true})
            );
          });
          return;
        }
        const ids = isDinner ? state.guests.map(g=>g.id) : Array.from(it.guestIds||[]);
        if(!isDinner && ids.length===0) return;
        // Dinner always applies to every guest on the stay, so the preview skips
        // individual name tags to avoid implying it can be scoped per person.
        const totalGuestsInStay = state.guests.length;
        // Shared label helper mirrors the activities rail: if every guest is
        // assigned we still render the activity but skip the pipe-delimited
        // names so the preview and row stay in sync.
        const guestNames = isDinner ? [] : buildGuestNameListFromIds(ids, {
          guestLookup,
          totalGuestsInStay
        });
        const assignmentCoversAll = !isDinner
          && totalGuestsInStay > 0
          && ids.length === totalGuestsInStay;
        if(!isDinner && guestNames.length===0 && !assignmentCoversAll) return;
        const startTime = it.start ? escapeHtml(formatTimeDisplay(it.start)) : '';
        const endTime = it.end ? escapeHtml(formatTimeDisplay(it.end)) : '';
        let timeSegment = '';
        if(startTime && endTime){
          timeSegment = `${startTime} - ${endTime}`;
        }else if(startTime){
          timeSegment = startTime;
        }else if(endTime){
          timeSegment = endTime;
        }
        // Wrap generic itinerary times so we can remove bold styling without affecting other text.
        const timeMarkup = timeSegment ? `<span class="email-activity-time">${timeSegment}</span>` : '';
        const title = escapeHtml(it.title||'');
        const segments = [];
        if(timeMarkup) segments.push(timeMarkup);
        if(title) segments.push(title);
        if(it.type==='custom' && it.location){
          segments.push(escapeHtml(it.location));
        }
        let lineMarkup = segments.join(' | ');
        if(!isDinner && guestNames.length){
          const guestSegment = guestNames.map(name => escapeHtml(name)).join(' | ');
          lineMarkup = lineMarkup ? `${lineMarkup} | ${guestSegment}` : guestSegment;
        }
        if(!lineMarkup){
          // Avoid injecting empty divs so the preview stays a continuous stack with no phantom gaps.
          return;
        }
        daySection.appendChild(
          makeEl(
            'div',
            'email-activity',
            lineMarkup,
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

  if(arrivalEtaInput){
    const openArrivalNote=()=> openStayNotePicker({ anchor: arrivalEtaInput, stateKey:'arrivalNote', label:'Set arrival time note' });
    arrivalEtaInput.addEventListener('click', openArrivalNote);
    arrivalEtaInput.addEventListener('keydown', e=>{
      if(e.key==='Enter' || e.key===' ' || e.key==='Spacebar'){
        e.preventDefault();
        openArrivalNote();
      }
    });
  }
  if(departureEtdInput){
    const openDepartureNote=()=> openStayNotePicker({ anchor: departureEtdInput, stateKey:'departureNote', label:'Set departure time note' });
    departureEtdInput.addEventListener('click', openDepartureNote);
    departureEtdInput.addEventListener('keydown', e=>{
      if(e.key==='Enter' || e.key===' ' || e.key==='Spacebar'){
        e.preventDefault();
        openDepartureNote();
      }
    });
  }

  updateStayNoteInputs();

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
    // Collapse stray blank lines so clipboard copy mirrors the on-screen, gap-free itinerary.
    const clipboardText=(email.textContent||'').replace(/\n{2,}/g,'\n').trim();
    try{
      if(window.ClipboardItem && navigator.clipboard?.write){
        const item=new ClipboardItem({
          'text/html': new Blob([html], {type:'text/html'}),
          'text/plain': new Blob([clipboardText], {type:'text/plain'})
        });
        await navigator.clipboard.write([item]);
      }else if(navigator.clipboard?.writeText){
        await navigator.clipboard.writeText(clipboardText);
      }else{
        throw new Error('Clipboard API unavailable');
      }
    }
    catch(e){
      // Legacy execCommand fallback still copies the sanitized text so older browsers get the gap-free output too.
      const fallback=document.createElement('textarea');
      fallback.value=clipboardText;
      fallback.setAttribute('readonly','');
      fallback.style.position='absolute';
      fallback.style.left='-9999px';
      document.body.appendChild(fallback);
      fallback.select();
      document.execCommand('copy');
      document.body.removeChild(fallback);
    }
    copyBtn.title='Copied';
    if(copyTitleTimer) clearTimeout(copyTitleTimer);
    copyTitleTimer = setTimeout(()=>{ copyBtn.title='Copy'; },1200);
  };

  if(clearAllBtn){
    clearAllBtn.onclick=()=>{
      if(!confirm('Clear all itinerary data?')) return;
      state.arrival=null; state.departure=null; state.arrivalNote=null; state.departureNote=null; state.guests.length=0; state.schedule={};
      markPreviewDirty();
      renderAll();
    };
  }

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
      openCustomBuilder,
      createCustomEntry(config = {}){
        const key = config.dateKey || (config.date instanceof Date ? keyDate(zero(config.date)) : keyDate(state.focus));
        const guestIds = Array.isArray(config.guestIds)
          ? config.guestIds.filter(Boolean)
          : state.guests.map(g=>g.id);
        upsertCustomEntry(key, {
          id: config.id,
          title: config.title || '',
          start: config.start || '09:00',
          end: config.end || '',
          location: config.location || '',
          guestIds
        });
        markPreviewDirty();
        renderActivities();
        renderPreview();
      },
      deleteCustomEntry(config = {}){
        const key = config.dateKey || (config.date instanceof Date ? keyDate(zero(config.date)) : keyDate(state.focus));
        if(config.entryId){
          removeCustomEntry(key, config.entryId);
          markPreviewDirty();
          renderActivities();
          renderPreview();
        }
      },
      focusDate(date){
        if(!(date instanceof Date)) return;
        state.focus = zero(date);
        renderAll();
      },
      getState(){ return state; }
    };
  }
})();
