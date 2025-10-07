(function(){
  const frame = document.getElementById('customDemoFrame');
  const status = document.getElementById('customDemoStatus');
  const resetBtn = document.getElementById('customDemoReset');
  const freeBtn = document.getElementById('customDemoFreeText');
  const existingBtn = document.getElementById('customDemoExisting');
  let frameLoaded = false;
  let running = false;
  let baseReady = false;

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const log = message => { if(status) status.textContent = message; };

  frame.addEventListener('load', () => {
    frameLoaded = true;
    baseReady = false;
    log('Builder loaded. Run step 1 to prepare the stay.');
  });

  async function waitForApi(){
    while(true){
      if(!frameLoaded) await wait(60);
      const api = frame.contentWindow && frame.contentWindow.CHSBuilderDebug;
      if(api) return api;
      await wait(60);
    }
  }

  function disableButtons(flag){
    [resetBtn, freeBtn, existingBtn].forEach(btn => { if(btn) btn.disabled = flag; });
  }

  async function run(action){
    if(running) return;
    running = true;
    disableButtons(true);
    try{
      await action();
    }catch(error){
      console.error(error);
      log(error.message || 'Demo action failed. See console for details.');
    }finally{
      disableButtons(false);
      running = false;
    }
  }

  async function resetBuilder(){
    const api = await waitForApi();
    const doc = frame.contentWindow.document;
    const clearBtn = doc.getElementById('clearAll');
    if(clearBtn){
      const originalConfirm = frame.contentWindow.confirm;
      frame.contentWindow.confirm = () => true;
      clearBtn.click();
      frame.contentWindow.confirm = originalConfirm;
      await wait(150);
    }
    api.focusDate(new Date(2025, 9, 20));
    await wait(140);
    const state = api.getState();
    const ensureGuest = name => {
      if(!state.guests.some(g=>g.name===name)){
        api.addGuest(name);
      }
    };
    ensureGuest('Sam');
    ensureGuest('Jamie');
    state.guests.forEach(g => g.active = true);
    api.setArrival();
    api.setDeparture();
    await wait(160);
    baseReady = true;
    log('Stay reset for October 20, 2025. Guests Sam and Jamie are active.');
  }

  async function addFreeTextCustom(){
    if(!baseReady){
      log('Run step 1 first to prepare the day.');
      return;
    }
    const api = await waitForApi();
    api.focusDate(new Date(2025, 9, 20));
    await wait(120);
    const state = api.getState();
    const guestIds = state.guests.map(g=>g.id);
    api.createCustomEntry({
      date: new Date(2025, 9, 20),
      title: 'Sunrise Hot Springs Notes',
      start: '09:00',
      end: null,
      location: null,
      guestIds
    });
    await wait(200);
    log('Free-text custom activity added at 9:00 AM with start time only.');
  }

  async function addExistingCustom(){
    if(!baseReady){
      log('Run step 1 first to prepare the day.');
      return;
    }
    const api = await waitForApi();
    api.focusDate(new Date(2025, 9, 20));
    await wait(120);
    const state = api.getState();
    const guestIds = state.guests.map(g=>g.id);
    const dataLayer = frame.contentWindow.CHSDataLayer;
    const locationOptions = Array.isArray(state.customLocationOptions) ? state.customLocationOptions : [];
    let origin = null;
    let location = '';
    const targetSeason = 'October 16Th Through November 19Th';
    const targetDay = 'mon';
    if(dataLayer){
      const getMeta = typeof dataLayer.getActivityMetadata === 'function'
        ? dataLayer.getActivityMetadata.bind(dataLayer)
        : null;
      const getSeasonDay = typeof dataLayer.getActivitiesForSeasonDay === 'function'
        ? dataLayer.getActivitiesForSeasonDay.bind(dataLayer)
        : null;
      const meta = getMeta ? getMeta({
        season: targetSeason,
        day: targetDay,
        title: 'Wine Tasting',
        start: '15:00'
      }) : null;
      if(meta?.stableId){
        origin = {
          type:'existing',
          stableId: meta.stableId,
          season: targetSeason,
          dayKey: targetDay,
          start: meta.start || '15:00'
        };
      }
      if(typeof meta?.location === 'string' && meta.location.trim()){
        location = meta.location.trim();
      }else if(getSeasonDay){
        const rows = getSeasonDay(targetSeason, targetDay) || [];
        const fallback = rows.find(row => row && (row.title || '').toLowerCase() === 'wine tasting');
        if(fallback){
          const safeId = fallback.stableId || `${fallback.title}__${fallback.start || '15:00'}`;
          if(!origin){
            origin = {
              type:'existing',
              stableId: safeId,
              season: targetSeason,
              dayKey: targetDay,
              start: fallback.start || '15:00'
            };
          }
          if(!location && typeof fallback.location === 'string' && fallback.location.trim()){
            location = fallback.location.trim();
          }
        }
      }
    }
    if(!location){
      // Fall back to a known location chip so the demo still shows a venue even if
      // metadata changes upstream.
      const preferred = locationOptions.find(label => /murphy/i.test(label));
      location = preferred || locationOptions[0] || '';
    }
    api.createCustomEntry({
      date: new Date(2025, 9, 20),
      title: 'Wine Tasting',
      start: '15:00',
      end: '16:00',
      location: location || null,
      guestIds,
      origin
    });
    await wait(200);
    log('Catalog activity added at 3:00 PM with Murphy Hall as the location.');
  }

  resetBtn?.addEventListener('click', () => run(resetBuilder));
  freeBtn?.addEventListener('click', () => run(addFreeTextCustom));
  existingBtn?.addEventListener('click', () => run(addExistingCustom));
})();
