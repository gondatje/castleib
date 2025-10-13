(function(){
  const frames = Array.from(document.querySelectorAll('.spa-preview-iframe'));
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  function init(){
    frames.forEach(frame => {
      frame.addEventListener('load', () => {
        const mode = frame.dataset.mode === 'edit' ? 'edit' : 'add';
        if(mode === 'edit'){
          openEditPreview(frame).catch(logError);
        }else{
          openAddPreview(frame).catch(logError);
        }
      }, { once:true });
    });
  }

  function logError(error){
    console.error('SPA modal preview failed', error);
  }

  async function waitForApi(frame){
    while(true){
      const win = frame.contentWindow;
      if(win && win.CHSBuilderDebug){
        return win.CHSBuilderDebug;
      }
      await wait(60);
    }
  }

  async function waitForSelector(doc, selector, timeout = 4000){
    const start = performance.now();
    while(performance.now() - start < timeout){
      const node = doc.querySelector(selector);
      if(node) return node;
      await wait(50);
    }
    throw new Error(`Timeout waiting for ${selector}`);
  }

  async function waitForOverlayClose(doc, timeout = 4000){
    const start = performance.now();
    while(performance.now() - start < timeout){
      if(!doc.querySelector('.spa-overlay')) return;
      await wait(60);
    }
    throw new Error('SPA overlay did not close');
  }

  async function ensureGuests(api){
    const state = api.getState();
    if(!state.guests.some(g => g.name === 'Brittany')) api.addGuest('Brittany');
    if(!state.guests.some(g => g.name === 'Megan')) api.addGuest('Megan');
  }

  async function openAddPreview(frame){
    const api = await waitForApi(frame);
    await ensureGuests(api);
    api.focusDate(new Date());
    api.openSpaEditor({ mode:'add' });
    const doc = frame.contentWindow.document;
    await waitForSelector(doc, '.spa-overlay');
  }

  async function openEditPreview(frame){
    const api = await waitForApi(frame);
    await ensureGuests(api);
    api.focusDate(new Date());
    api.openSpaEditor({ mode:'add' });
    const doc = frame.contentWindow.document;
    await waitForSelector(doc, '.spa-overlay');
    const confirmBtn = doc.querySelector('.spa-overlay .spa-confirm');
    confirmBtn?.click();
    await waitForOverlayClose(doc);
    const state = api.getState();
    const dateKey = Object.keys(state.schedule).find(key => state.schedule[key].some(item => item.type === 'spa'));
    if(!dateKey) throw new Error('No spa entry seeded for preview');
    const entry = state.schedule[dateKey].find(item => item.type === 'spa');
    if(!entry) throw new Error('Spa entry missing for edit preview');
    api.openSpaEditor({ mode:'edit', dateKey, entryId: entry.id });
    await waitForSelector(doc, '.spa-overlay');
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
