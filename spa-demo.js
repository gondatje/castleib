(function(){
  const frame = document.getElementById('demoFrame');
  const status = document.getElementById('demoStatus');
  const setupBtn = document.getElementById('demoSetup');
  const variationBtn = document.getElementById('demoVariation');
  const gatingBtn = document.getElementById('demoGating');
  let frameLoaded = false;
  let running = false;

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const log = message => { if(status) status.textContent = message; };

  frame.addEventListener('load', () => {
    frameLoaded = true;
    log('Builder loaded. Run step 1 to create the shared appointment.');
  });

  async function waitForApi(){
    while(true){
      if(!frameLoaded) await wait(60);
      const api = frame.contentWindow && frame.contentWindow.CHSBuilderDebug;
      if(api) return api;
      await wait(60);
    }
  }

  async function waitForSelector(selector, timeout=4000){
    const start = performance.now();
    while(performance.now() - start < timeout){
      const doc = frame.contentWindow && frame.contentWindow.document;
      const el = doc && doc.querySelector(selector);
      if(el) return el;
      await wait(50);
    }
    throw new Error(`Timeout waiting for ${selector}`);
  }

  async function waitForOverlayClose(){
    const start = performance.now();
    while(performance.now() - start < 4000){
      const overlay = frame.contentWindow?.document.querySelector('.spa-overlay');
      if(!overlay) return;
      await wait(60);
    }
    throw new Error('Overlay did not close');
  }

  async function closeOverlayIfOpen(){
    const overlay = frame.contentWindow?.document.querySelector('.spa-overlay');
    if(overlay){
      const closeBtn = overlay.querySelector('.spa-close');
      closeBtn?.click();
      await wait(200);
    }
  }

  function disableButtons(flag){
    [setupBtn, variationBtn, gatingBtn].forEach(btn => { if(btn) btn.disabled = flag; });
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

  async function createBaseAppointment(){
    const api = await waitForApi();
    await closeOverlayIfOpen();
    const doc = frame.contentWindow.document;
    const clearBtn = doc.getElementById('clearAll');
    if(clearBtn){
      const originalConfirm = frame.contentWindow.confirm;
      frame.contentWindow.confirm = () => true;
      clearBtn.click();
      frame.contentWindow.confirm = originalConfirm;
      await wait(120);
    }
    api.focusDate(new Date());
    const state = api.getState();
    if(!state.guests.some(g=>g.name==='Brittany')) api.addGuest('Brittany');
    if(!state.guests.some(g=>g.name==='Megan')) api.addGuest('Megan');
    api.setArrival();
    api.setDeparture();
    api.openSpaEditor({ mode:'add' });
    const confirmBtn = await waitForSelector('.spa-overlay .spa-confirm');
    confirmBtn.click();
    await waitForOverlayClose();
    log('Base SPA appointment added. Preview shows a pluralized service with no guest tags.');
  }

  async function applyVariation(){
    const api = await waitForApi();
    const doc = frame.contentWindow.document;
    const chip = doc.querySelector('.spa-chip');
    if(!chip) throw new Error('SPA appointment not found. Run step 1 first.');
    chip.click();
    await waitForSelector('.spa-overlay');
    const syncToggle = doc.querySelector('.spa-sync-row input');
    if(syncToggle && syncToggle.checked){
      syncToggle.click();
      await wait(160);
    }
    const select = doc.querySelector('.spa-guest-select');
    if(select && select.options.length > 1){
      select.value = select.options[1].value;
      select.dispatchEvent(new Event('change', { bubbles:true }));
      await wait(160);
    }
    const maleBtn = doc.querySelector('.spa-radio-list .spa-radio[data-value="male"]');
    maleBtn?.click();
    await wait(160);
    const confirmBtn = doc.querySelector('.spa-confirm');
    confirmBtn?.click();
    await waitForOverlayClose();
    log('Therapist preference updated for Megan. Preview now renders one line per guest.');
  }

  async function showInRoomGating(){
    const api = await waitForApi();
    const state = api.getState();
    const dateKey = Object.keys(state.schedule).find(key => state.schedule[key].some(item => item.type==='spa'));
    if(!dateKey) throw new Error('Run step 1 before previewing the gating helper.');
    const entry = state.schedule[dateKey].find(item => item.type==='spa');
    api.openSpaEditor({ mode:'edit', dateKey, entryId: entry.id });
    const doc = frame.contentWindow.document;
    await waitForSelector('.spa-overlay');
    const cbdBtn = doc.querySelector('.spa-service-button[data-service-name="CBD Massage"]');
    cbdBtn?.click();
    await wait(200);
    const helper = doc.querySelector('.spa-helper-text');
    log(helper ? `“In-Room” disabled message: ${helper.textContent.trim()}` : 'Select “CBD Massage” to see the In-Room gating message.');
  }

  setupBtn?.addEventListener('click', () => run(createBaseAppointment));
  variationBtn?.addEventListener('click', () => run(applyVariation));
  gatingBtn?.addEventListener('click', () => run(showInRoomGating));
})();
