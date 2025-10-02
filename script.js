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

  function createWheel(values, options={}){
    const ITEM_HEIGHT = 44;
    const REPEAT = 9;
    const block = values.length;
    const totalItems = block * REPEAT;
    const baseBlock = Math.floor(REPEAT/2);
    const minIndex = block;
    const maxIndex = block * (REPEAT-1) - 1;
    const wrapSpan = block * (REPEAT-2);
    const SNAP_IDLE_MS = 140; // Idle window that defines the end of a gesture before snapping.
    const SNAP_DURATION_MS = 160; // Final ease duration so wheels glide into place instead of teleporting.
    const NUDGE_DURATION_MS = 90; // Short preload before settling when a blocked value is attempted.
    const MAX_VELOCITY = ITEM_HEIGHT * 1.35; // Clamp free-scroll momentum so fast flicks stay controlled.
    const VELOCITY_FRICTION = 0.76; // Frame-to-frame damping applied while the wheel is freely scrolling.
    const VELOCITY_EPSILON = 0.015; // Cut-off that stops the free-scroll integrator once motion is imperceptible.
    const MICRO_DELTA_THRESHOLD = 0.4; // Ignore extremely tiny alternating deltas to avoid visible jitter.
    const DELTA_GAIN = 0.22; // Scales pixel deltas into velocity so one hardware detent roughly equals one slot.

    let optionIndex = baseBlock * block;
    let position = optionIndex;
    let disabledChecker = options.disabledChecker || (()=>false);
    const formatValue = options.formatValue || (v=>v);
    const onChange = options.onChange || (()=>{});
    const lockController = options.lockController || null; // Shared lock keeps the sibling wheel frozen while this one settles.
    const lockId = options.lockId || null;

    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = !!reduceMotionQuery.matches;
    if(reduceMotionQuery.addEventListener){
      reduceMotionQuery.addEventListener('change', e => { prefersReducedMotion = !!e.matches; });
    }else if(reduceMotionQuery.addListener){
      reduceMotionQuery.addListener(e => { prefersReducedMotion = !!e.matches; });
    }

    const viewport=document.createElement('div');
    viewport.className='wheel-viewport';
    viewport.setAttribute('tabindex','0');

    const list=document.createElement('div');
    list.className='wheel-list';
    list.style.willChange='transform';
    viewport.appendChild(list);

    for(let i=0;i<totalItems;i++){
      const value = values[i % block];
      const item=document.createElement('div');
      item.className='wheel-option';
      item.dataset.value=value;
      item.textContent=formatValue(value);
      list.appendChild(item);
    }

    const modIndex = idx => ((idx % block)+block)%block;
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
    const easeInOutCubic = t => t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2;
    const motionDuration = ms => prefersReducedMotion ? 0 : ms;

    const getCenterOffset = ()=> Math.max(0, (viewport.clientHeight/2) - (ITEM_HEIGHT/2));
    const syncPosition = ()=>{
      const translate = getCenterOffset() - position * ITEM_HEIGHT;
      list.style.transform = `translate3d(0, ${translate}px, 0)`;
    };

    let animationFrame = null;
    let animationState = null;
    let pendingSettleId = 0;
    const cancelAnimation = ()=>{
      if(animationFrame){
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      animationState = null;
    };
    const tickAnimation = now => {
      if(!animationState){
        animationFrame = null;
        return;
      }
      const {from,to,start,duration,ease,onFinish} = animationState;
      const elapsed = Math.max(0, now - start);
      const progress = duration === 0 ? 1 : Math.min(1, elapsed / duration);
      const eased = ease(progress);
      position = from + (to - from) * eased;
      syncPosition();
      if(progress >= 1){
        animationState = null;
        animationFrame = null;
        if(onFinish) onFinish();
      }else{
        animationFrame = requestAnimationFrame(tickAnimation);
      }
    };
    const startAnimation = (target,{duration=140,ease=easeOutCubic,onFinish}={})=>{
      const animDuration = motionDuration(duration);
      cancelAnimation();
      if(wheelFrame){
        cancelAnimationFrame(wheelFrame);
        wheelFrame = null;
      }
      pendingPixelDelta = 0;
      microPixelDelta = 0;
      velocityPx = 0;
      if(animDuration === 0){
        position = target;
        syncPosition();
        if(onFinish) onFinish();
        return;
      }
      animationState = {
        from: position,
        to: target,
        start: performance.now(),
        duration: animDuration,
        ease,
        onFinish
      };
      animationFrame = requestAnimationFrame(tickAnimation);
    };

    const normalizeIndex = idx => {
      let next = idx;
      let shift = 0;
      if(next < minIndex){
        next += wrapSpan;
        shift = wrapSpan;
      }else if(next > maxIndex){
        next -= wrapSpan;
        shift = -wrapSpan;
      }
      return { index: next, shift };
    };

    const applySelection = ()=>{
      const children=list.children;
      for(let i=0;i<children.length;i++){
        const child=children[i];
        const value=Number(child.dataset.value);
        child.classList.toggle('selected', i===optionIndex);
        child.classList.toggle('disabled', !!disabledChecker(value));
      }
    };

    let lastValue = values[modIndex(optionIndex)];
    const emitChangeIfNeeded = value => {
      if(value===lastValue) return;
      lastValue = value;
      onChange(value);
    };

    const applyIndexCore = (idx, normalizedInfo) => {
      const info = normalizedInfo || normalizeIndex(idx);
      optionIndex = info.index;
      if(info.shift){
        position += info.shift;
      }
      const value = values[modIndex(optionIndex)];
      applySelection();
      emitChangeIfNeeded(value);
      return info;
    };

    const commitIndex = (idx, normalizedInfo, animationOptions={}) => {
      const info = applyIndexCore(idx, normalizedInfo);
      startAnimation(optionIndex, { duration: SNAP_DURATION_MS, ease: easeInOutCubic, ...animationOptions });
      return info;
    };

    // Tiny resist/bounce when a blocked option is hit so we never rest on invalid values.
    const bounce = direction => {
      if(prefersReducedMotion){
        startAnimation(optionIndex,{duration:0});
        finishGesture();
        return;
      }
      const overshoot = optionIndex + direction * 0.3;
      const settleId = ++pendingSettleId;
      startAnimation(overshoot,{duration:NUDGE_DURATION_MS,ease:easeOutCubic,onFinish:()=>{
        commitIndex(optionIndex,null,{onFinish:()=>{
          if(settleId===pendingSettleId){
            finishGesture();
          }
        }});
      }});
    };

    const tryStep = direction => {
      if(!direction) return false;
      const info = normalizeIndex(optionIndex + direction);
      const value = values[modIndex(info.index)];
      if(disabledChecker(value)){
        bounce(direction);
        return false;
      }
      commitIndex(info.index, info);
      return true;
    };

    const step = delta => {
      if(!delta) return;
      const direction = delta > 0 ? 1 : -1;
      let remaining = Math.abs(delta);
      let moved = false;
      while(remaining--){
        if(!tryStep(direction)){
          break;
        }
        moved = true;
      }
      if(moved){
        scheduleSnap();
      }
    };

    // Accumulate wheel/trackpad deltas and run them through a lightweight integrator so
    // the column stays free while input is active and only detents once the idle timer fires.
    let pendingPixelDelta = 0;
    let microPixelDelta = 0;
    let velocityPx = 0;
    let wheelFrame = null;
    let snapTimer = null;
    let activeGestureId = 0;
    let gestureSerial = 0;
    let lastGestureTs = 0;
    let lastScrollDirection = 0;

    // Exclusive gestures and speed limiting live here: we request the shared lock, reset the
    // per-gesture step budget, and only allow a bounded number of detents to convert each frame.
    const requestGesture = ()=>{
      if(lockController && !lockController.request(lockId)){
        return false;
      }
      const now = performance.now();
      const shouldReset = !activeGestureId || (now - lastGestureTs) > SNAP_IDLE_MS;
      lastGestureTs = now;
      if(shouldReset){
        activeGestureId = ++gestureSerial;
        lastScrollDirection = 0;
      }
      return true;
    };

    const finishGesture = ()=>{
      activeGestureId = 0;
      stopFreeScroll();
      if(snapTimer){
        clearTimeout(snapTimer);
        snapTimer = null;
      }
      if(lockController && lockController.release){
        lockController.release(lockId);
      }
    };

    // Wheel physics state: these helpers keep the column free while the wheel/trackpad
    // is active and only snap once an idle window expires.
    const stopFreeScroll = ()=>{
      if(wheelFrame){
        cancelAnimationFrame(wheelFrame);
        wheelFrame = null;
      }
      pendingPixelDelta = 0;
      microPixelDelta = 0;
      velocityPx = 0;
    };

    const wrapPosition = ()=>{
      if(position < minIndex){
        const wraps = Math.ceil((minIndex - position) / wrapSpan);
        position += wrapSpan * wraps;
      }else if(position > maxIndex){
        const wraps = Math.ceil((position - maxIndex) / wrapSpan);
        position -= wrapSpan * wraps;
      }
    };

    const syncActiveIndexFromPosition = ()=>{
      const nearest = Math.round(position);
      if(nearest === optionIndex) return;
      applyIndexCore(nearest);
    };

    // Integrate wheel deltas once per frame so micro-jitters get damped and fast flicks
    // stay capped. The transform tracks position continuously until input idles.
    const runFreeScroll = timestamp => {
      if(!activeGestureId){
        stopFreeScroll();
        return;
      }
      const delta = pendingPixelDelta;
      pendingPixelDelta = 0;
      if(delta !== 0){
        velocityPx += delta * DELTA_GAIN;
        lastScrollDirection = delta > 0 ? 1 : -1;
      }

      if(Math.abs(velocityPx) > MAX_VELOCITY){
        velocityPx = velocityPx > 0 ? MAX_VELOCITY : -MAX_VELOCITY;
      }

      if(Math.abs(velocityPx) > VELOCITY_EPSILON){
        position += (velocityPx / ITEM_HEIGHT);
      }

      wrapPosition();
      syncActiveIndexFromPosition();
      syncPosition();

      velocityPx *= VELOCITY_FRICTION;
      if(Math.abs(velocityPx) <= VELOCITY_EPSILON){
        velocityPx = 0;
      }

      if(pendingPixelDelta !== 0 || Math.abs(velocityPx) > VELOCITY_EPSILON){
        wheelFrame = requestAnimationFrame(runFreeScroll);
      }else{
        wheelFrame = null;
      }
    };

    const queueFreeScroll = ()=>{
      if(!wheelFrame){
        wheelFrame = requestAnimationFrame(runFreeScroll);
      }
    };

    const DOM_DELTA_LINE = typeof WheelEvent !== 'undefined' ? WheelEvent.DOM_DELTA_LINE : 1;
    const DOM_DELTA_PAGE = typeof WheelEvent !== 'undefined' ? WheelEvent.DOM_DELTA_PAGE : 2;

    const normalizeDelta = e => {
      if(e.deltaMode === DOM_DELTA_LINE){
        return e.deltaY * ITEM_HEIGHT;
      }
      if(e.deltaMode === DOM_DELTA_PAGE){
        return e.deltaY * ITEM_HEIGHT * 3;
      }
      return e.deltaY;
    };

    // Quantize extremely small alternating deltas so jittery trackpads do not cause a
    // visible wobble while still letting deliberate micro-scrolls through.
    const pushWheelDelta = delta => {
      if(delta === 0) return;
      const magnitude = Math.abs(delta);
      if(magnitude < MICRO_DELTA_THRESHOLD){
        microPixelDelta += delta;
        if(Math.abs(microPixelDelta) < MICRO_DELTA_THRESHOLD){
          return;
        }
        delta = microPixelDelta;
        microPixelDelta = 0;
      }else{
        microPixelDelta = 0;
      }
      pendingPixelDelta += delta;
      queueFreeScroll();
    };

    const findNearestValid = (startIndex, preferredDirection)=>{
      const directions = preferredDirection ? [preferredDirection, -preferredDirection] : [1,-1];
      for(const dir of directions){
        for(let step=1; step<=block; step++){
          const candidate = normalizeIndex(startIndex + dir * step);
          const value = values[modIndex(candidate.index)];
          if(!disabledChecker(value)){
            return { info: candidate, direction: dir };
          }
        }
      }
      return null;
    };

    // When the user finishes on a blocked value, play a short nudge in their attempted
    // direction before settling on the nearest valid detent.
    const nudgeAndSettle = (targetInfo, direction, settleId, gestureId)=>{
      const finishSnap = ()=>{
        commitIndex(targetInfo.index, targetInfo,{onFinish:()=>{
          if(pendingSettleId===settleId && activeGestureId===gestureId){
            finishGesture();
          }
        }});
      };
      if(prefersReducedMotion){
        finishSnap();
        return;
      }
      const overshoot = position + direction * 0.25;
      startAnimation(overshoot,{duration:NUDGE_DURATION_MS,ease:easeOutCubic,onFinish:finishSnap});
    };

    const settleAfterIdle = (gestureId, settleId)=>{
      if(activeGestureId !== gestureId) return;
      snapTimer = null;
      stopFreeScroll();
      const rawIndex = Math.round(position);
      const rawInfo = normalizeIndex(rawIndex);
      const rawValue = values[modIndex(rawInfo.index)];
      if(!disabledChecker(rawValue)){
        commitIndex(rawInfo.index, rawInfo,{onFinish:()=>{
          if(pendingSettleId===settleId && activeGestureId===gestureId){
            finishGesture();
          }
        }});
        return;
      }
      const fallbackDirection = lastScrollDirection || (rawIndex >= optionIndex ? 1 : -1) || 1;
      const nearest = findNearestValid(rawInfo.index, fallbackDirection);
      if(!nearest){
        commitIndex(optionIndex,null,{onFinish:()=>{
          if(pendingSettleId===settleId && activeGestureId===gestureId){
            finishGesture();
          }
        }});
        return;
      }
      const nudgeDirection = fallbackDirection || nearest.direction || 1;
      nudgeAndSettle(nearest.info, nudgeDirection, settleId, gestureId);
    };

    // Idle-based snap: restart the timer on every new delta so the wheel remains loose
    // while input is flowing, then snap after ~140ms of calm.
    const scheduleSnap = ()=>{
      if(!activeGestureId) return;
      clearTimeout(snapTimer);
      const settleId = ++pendingSettleId;
      const gestureId = activeGestureId;
      snapTimer = setTimeout(()=>{ settleAfterIdle(gestureId, settleId); }, SNAP_IDLE_MS);
    };

    viewport.addEventListener('wheel',e=>{
      if(Math.abs(e.deltaY)<=Math.abs(e.deltaX)) return;
      if(!requestGesture()){
        e.preventDefault();
        return;
      }
      e.preventDefault();
      cancelAnimation();
      const delta = normalizeDelta(e);
      if(delta !== 0){
        pushWheelDelta(delta);
        scheduleSnap();
      }
    },{passive:false});

    viewport.addEventListener('keydown',e=>{
      if(e.key==='ArrowUp'){
        e.preventDefault();
        if(!requestGesture()) return;
        cancelAnimation();
        stopFreeScroll();
        step(-1);
      }
      if(e.key==='ArrowDown'){
        e.preventDefault();
        if(!requestGesture()) return;
        cancelAnimation();
        stopFreeScroll();
        step(1);
      }
    });

    const setValue = val => {
      const valueIndex = values.indexOf(val);
      if(valueIndex===-1) return;
      const idx = baseBlock*block + valueIndex;
      const info = normalizeIndex(idx);
      optionIndex = info.index;
      if(info.shift){
        position += info.shift;
      }
      position = optionIndex;
      applySelection();
      lastValue = values[modIndex(optionIndex)];
      startAnimation(optionIndex,{duration:0});
    };

    const refresh = ()=>{
      position = optionIndex;
      syncPosition();
    };

    const onResize = ()=>{ syncPosition(); };
    window.addEventListener('resize', onResize);

    setTimeout(()=>{ setValue(options.initial ?? values[0]); },0);

    applySelection();
    syncPosition();

    return {
      element: viewport,
      get value(){ return values[modIndex(optionIndex)]; },
      setValue,
      step,
      setDisabledChecker(fn){
        disabledChecker = fn || (()=>false);
        applySelection();
        if(disabledChecker(values[modIndex(optionIndex)])){
          if(!tryStep(1)) tryStep(-1);
        }
      },
      refresh,
      dispose(){
        cancelAnimation();
        stopFreeScroll();
        window.removeEventListener('resize', onResize);
        clearTimeout(snapTimer);
        if(lockController && lockController.forceRelease){
          lockController.forceRelease(lockId);
        }
      }
    };
  }


  // Simple exclusive lock shared by the wheels so a gesture only moves one column at a time.
  function createWheelLockController(graceMs=160){
    let owner = null;
    let releaseTimer = null;
    return {
      request(id){
        if(!id) return true;
        if(owner && owner !== id){
          return false;
        }
        owner = id;
        if(releaseTimer){
          clearTimeout(releaseTimer);
          releaseTimer = null;
        }
        return true;
      },
      release(id){
        if(!id || owner !== id) return;
        if(releaseTimer){
          clearTimeout(releaseTimer);
        }
        releaseTimer = setTimeout(()=>{
          if(owner === id){
            owner = null;
          }
          releaseTimer = null;
        }, graceMs);
      },
      forceRelease(id){
        if(!id || owner !== id) return;
        if(releaseTimer){
          clearTimeout(releaseTimer);
          releaseTimer = null;
        }
        owner = null;
      }
    };
  }




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
  const toggleEditBtn=$('#toggleEdit');
  const copyBtn=$('#copy');
  const addDinnerBtn=$('#addDinner');
  toggleEditBtn.textContent='✎';
  toggleEditBtn.title='Edit';
  toggleEditBtn.setAttribute('aria-pressed','false');

  // ResizeObserver + visualViewport keep the calendar square by re-measuring once per frame on rotation.
  const calendarMetrics = (()=>{
    if(!calGrid) return { schedule: ()=>{} };
    const COLUMNS = 7;
    const MIN_SIZE = 44;
    let frame = null;
    const measure = ()=>{
      frame = null;
      const width = calGrid.clientWidth;
      const styles = getComputedStyle(calGrid);
      const gap = parseFloat(styles.columnGap || styles.gap || '0');
      const usable = width - gap * (COLUMNS - 1);
      const size = width <= 0 ? MIN_SIZE : Math.max(MIN_SIZE, Math.floor(usable / COLUMNS));
      calGrid.style.setProperty('--calendar-cell-size', `${size}px`);
    };
    const schedule = ()=>{
      if(frame !== null) return;
      frame = requestAnimationFrame(measure);
    };
    if(window.ResizeObserver){
      const ro = new ResizeObserver(()=>{ schedule(); });
      ro.observe(calGrid);
    }
    const viewport = window.visualViewport;
    const target = viewport && viewport.addEventListener ? viewport : window;
    target.addEventListener('resize', schedule, { passive: true });
    schedule();
    return { schedule };
  })();
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
    calendarMetrics.schedule();
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

  // ---------- Activities ----------
  function renderActivities(){
    const wname=weekdayName(state.focus);
    dayTitle.innerHTML = `${escapeHtml(wname)}, ${escapeHtml(state.focus.toLocaleString(undefined,{month:'long'}))} ${ordinalHtml(state.focus.getDate())}`;

    updateAddDinnerButton();

    if(state.dataStatus==='loading'){
      renderStatusMessage('Loading activities…');
      return;
    }

    if(state.dataStatus==='error'){
      renderStatusMessage('Activities unavailable — data failed to load.');
      return;
    }

    const season = activeSeason(state.focus);
    if(!season){
      renderStatusMessage(buildOutOfSeasonMessage());
      return;
    }

    const weekKey = weekdayKey(state.focus);
    const baseList = season ? window.CHSDataLayer.getActivitiesForSeasonDay(season.name, weekKey).slice().sort((a,b)=> a.start.localeCompare(b.start)) : [];
    const dateK = keyDate(state.focus);
    const dinnerEntry = getDinnerEntry(dateK);
    const combined = baseList.map(row=>({kind:'activity', data: row}));
    if(dinnerEntry){ combined.push({kind:'dinner', data: dinnerEntry}); }
    combined.sort((a,b)=>{
      const aStart = a.kind==='activity' ? a.data.start : (a.data.start || '');
      const bStart = b.kind==='activity' ? b.data.start : (b.data.start || '');
      return aStart.localeCompare(bStart);
    });

    activitiesEl.innerHTML='';
    combined.forEach(item=>{
      if(item.kind==='dinner'){
        renderDinner(item.data);
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
  }

  let dinnerDialog = null;

  function updateAddDinnerButton(){
    if(!addDinnerBtn) return;
    const enabled = state.dataStatus==='ready';
    addDinnerBtn.disabled = !enabled;
    const entry = enabled ? getDinnerEntry(keyDate(state.focus)) : null;
    addDinnerBtn.setAttribute('aria-pressed', entry ? 'true' : 'false');
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

    const wheels=document.createElement('div');
    wheels.className='dinner-wheels';

    let hourWheel;
    let minuteWheel;
    const wheelLock = createWheelLockController(160); // Shared lock so only one column responds per gesture.

    function updateMinuteDisabled(){
      if(!minuteWheel) return;
      const hour = hourWheel.value;
      const disabledSet = minuteRules[hour] || new Set();
      minuteWheel.setDisabledChecker(val=>disabledSet.has(val));
      if(disabledSet.has(minuteWheel.value)){
        const fallback = dinnerMinutes.find(v=>!disabledSet.has(v));
        if(fallback!==undefined){
          minuteWheel.setValue(fallback);
        }
      }else{
        minuteWheel.refresh();
      }
    }

    hourWheel = createWheel(dinnerHours, {
      initial: initialHour,
      formatValue: v=>v,
      onChange:()=> updateMinuteDisabled(),
      lockController: wheelLock,
      lockId: 'hours'
    });

    minuteWheel = createWheel(dinnerMinutes, {
      initial: initialMinute,
      formatValue: v=>pad(v),
      lockController: wheelLock,
      lockId: 'minutes'
    });

    updateMinuteDisabled();

    const hourCol=document.createElement('div');
    hourCol.className='dinner-wheel-col';
    hourCol.appendChild(hourWheel.element);

    const minuteCol=document.createElement('div');
    minuteCol.className='dinner-wheel-col';
    minuteCol.appendChild(minuteWheel.element);

    const meridiemCol=document.createElement('div');
    meridiemCol.className='dinner-meridiem';
    meridiemCol.textContent='pm';

    wheels.appendChild(hourCol);
    wheels.appendChild(minuteCol);
    wheels.appendChild(meridiemCol);

    body.appendChild(wheels);
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
      const hour = hourWheel.value;
      const minute = minuteWheel.value;
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
        hourWheel?.dispose?.();
        minuteWheel?.dispose?.();
      }
    };

    setTimeout(()=>{
      hourWheel.element.focus();
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
})();
