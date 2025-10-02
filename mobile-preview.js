(function(){
  const stage = document.querySelector('[data-stage-root]');
  if(!stage) return;
  const frame = stage.querySelector('iframe');
  const deviceSelect = document.querySelector('[data-device]');
  const orientationSelect = document.querySelector('[data-orientation]');
  const stageSelect = document.querySelector('select[data-stage]');
  const rotateBtn = document.querySelector('[data-rotate]');
  const reloadBtn = document.querySelector('[data-reload]');
  const dimensionsLabel = document.querySelector('[data-dimensions]');

  const devices = {
    'iphone-13': { type:'phone', portrait:{width:390,height:844}, landscape:{width:844,height:390} },
    'iphone-15pm': { type:'phone', portrait:{width:430,height:932}, landscape:{width:932,height:430} },
    'iphone-16pm': { type:'phone', portrait:{width:440,height:960}, landscape:{width:960,height:440} },
    'ipad-11': { type:'tablet', portrait:{width:834,height:1194}, landscape:{width:1194,height:834} }
  };

  const getStageScale = (device)=>{
    if(!stageSelect) return 1;
    const raw = parseFloat(stageSelect.value || '1');
    return device && device.type === 'tablet' ? raw : 1;
  };

  const applyFrameSize = ()=>{
    const deviceKey = deviceSelect ? deviceSelect.value : 'iphone-13';
    const orientationValue = orientationSelect && orientationSelect.value === 'landscape' ? 'landscape' : 'portrait';
    const device = devices[deviceKey] || devices['iphone-13'];
    const orientation = orientationValue;
    const metrics = device[orientation];
    if(stageSelect){
      const shouldDisable = device.type !== 'tablet';
      stageSelect.disabled = shouldDisable;
      if(shouldDisable && stageSelect.value !== '1'){
        stageSelect.value = '1';
      }
    }
    const scale = getStageScale(device);
    const width = Math.round(metrics.width * scale);
    const height = Math.round(metrics.height);
    stage.style.setProperty('--frame-width', `${width}px`);
    stage.style.setProperty('--frame-height', `${height}px`);
    if(dimensionsLabel){
      dimensionsLabel.textContent = `${width} × ${height}`;
    }
  };

  if(deviceSelect){
    deviceSelect.addEventListener('change', ()=>{
      applyFrameSize();
    });
  }

  if(orientationSelect){
    orientationSelect.addEventListener('change', ()=>{
      applyFrameSize();
    });
  }

  if(stageSelect){
    stageSelect.addEventListener('change', ()=>{
      applyFrameSize();
    });
  }

  if(rotateBtn && orientationSelect){
    rotateBtn.addEventListener('click', ()=>{
      orientationSelect.value = orientationSelect.value === 'portrait' ? 'landscape' : 'portrait';
      applyFrameSize();
    });
  }

  if(reloadBtn && frame){
    reloadBtn.addEventListener('click', ()=>{
      frame.contentWindow?.location.reload();
    });
  }

  applyFrameSize();
})();
