(function(global){
  'use strict';

  const pad = n => String(n).padStart(2, '0');
  let wheelInstanceCounter = 0;

  function createWheel(values, options = {}){
    // Shared physics core: each column clamps momentum, respects reduced motion,
    // and integrates deltas so gestures feel loose while active before snapping.
    const ITEM_HEIGHT = 44;
    const REPEAT = 9;
    const block = values.length;
    const totalItems = block * REPEAT;
    const baseBlock = Math.floor(REPEAT / 2);
    const minIndex = block;
    const maxIndex = block * (REPEAT - 1) - 1;
    const wrapSpan = block * (REPEAT - 2);
    const SNAP_IDLE_MS = 140;
    const SNAP_DURATION_MS = 160;
    const NUDGE_DURATION_MS = 90;
    const MICRO_DELTA_THRESHOLD = 0.4;
    const MAX_WHEEL_ROWS_PER_EVENT = 6;

    let optionIndex = baseBlock * block;
    let position = optionIndex;

    let disabledChecker = options.disabledChecker || (() => false);
    const formatValue = options.formatValue || (v => v);
    const getOptionLabel = options.getOptionLabel || formatValue;
    const onChange = options.onChange || (() => {});
    const lockController = options.lockController || null;
    const lockId = options.lockId || null;
    const ariaLabel = options.ariaLabel || '';

    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = !!reduceMotionQuery.matches;
    if(reduceMotionQuery.addEventListener){
      reduceMotionQuery.addEventListener('change', e => { prefersReducedMotion = !!e.matches; });
    }else if(reduceMotionQuery.addListener){
      reduceMotionQuery.addListener(e => { prefersReducedMotion = !!e.matches; });
    }

    const viewport = document.createElement('div');
    viewport.className = 'wheel-viewport';
    viewport.setAttribute('tabindex', '0');
    viewport.setAttribute('role', 'listbox');
    viewport.setAttribute('aria-orientation', 'vertical');
    const idPrefix = options.idPrefix || `wheel-${++wheelInstanceCounter}`;
    viewport.id = `${idPrefix}-viewport`;
    if(ariaLabel){
      viewport.setAttribute('aria-label', ariaLabel);
    }

    const list = document.createElement('div');
    list.className = 'wheel-list';
    list.style.willChange = 'transform';
    viewport.appendChild(list);

    const modIndex = idx => ((idx % block) + block) % block;
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
    const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const motionDuration = ms => prefersReducedMotion ? 0 : ms;

    for(let i = 0; i < totalItems; i++){
      const value = values[i % block];
      const item = document.createElement('div');
      item.className = 'wheel-option';
      item.dataset.value = String(value);
      item.textContent = formatValue(value);
      item.setAttribute('role', 'option');
      item.setAttribute('aria-hidden', 'true');
      list.appendChild(item);
    }

    const getCenterOffset = () => Math.max(0, (viewport.clientHeight / 2) - (ITEM_HEIGHT / 2));
    const syncPosition = () => {
      const translate = getCenterOffset() - position * ITEM_HEIGHT;
      list.style.transform = `translate3d(0, ${translate}px, 0)`;
    };

    let animationFrame = null;
    let animationState = null;
    let pendingSettleId = 0;
    const cancelAnimation = () => {
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
      const { from, to, start, duration, ease, onFinish } = animationState;
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

    const applySelection = () => {
      const children = list.children;
      for(let i = 0; i < children.length; i++){
        const child = children[i];
        const value = values[i % block];
        const disabled = !!disabledChecker(value);
        const selected = i === optionIndex;
        child.classList.toggle('selected', selected);
        child.classList.toggle('disabled', disabled);
        child.setAttribute('aria-selected', selected ? 'true' : 'false');
        child.setAttribute('aria-disabled', disabled ? 'true' : 'false');
        child.setAttribute('aria-hidden', selected ? 'false' : 'true');
        const optionId = `${idPrefix}-option-${i}`;
        child.id = optionId;
        child.setAttribute('data-label', getOptionLabel(value));
        if(selected){
          viewport.setAttribute('aria-activedescendant', optionId);
        }
      }
    };

    let lastValueIndex = modIndex(optionIndex);
    const emitChangeIfNeeded = valueIndex => {
      if(valueIndex === lastValueIndex) return;
      lastValueIndex = valueIndex;
      onChange(values[valueIndex]);
    };

    const applyIndexCore = (idx, normalizedInfo) => {
      const info = normalizedInfo || normalizeIndex(idx);
      optionIndex = info.index;
      if(info.shift){
        position += info.shift;
      }
      const valueIndex = modIndex(optionIndex);
      applySelection();
      emitChangeIfNeeded(valueIndex);
      return info;
    };

    const commitIndex = (idx, normalizedInfo, animationOptions = {}) => {
      const info = applyIndexCore(idx, normalizedInfo);
      startAnimation(optionIndex, { duration: SNAP_DURATION_MS, ease: easeInOutCubic, ...animationOptions });
      return info;
    };

    const startAnimation = (target, { duration = 140, ease = easeOutCubic, onFinish } = {}) => {
      const animDuration = motionDuration(duration);
      cancelAnimation();
      if(wheelFrame){
        cancelAnimationFrame(wheelFrame);
        wheelFrame = null;
      }
      pendingRowDelta = 0;
      microRowDelta = 0;
      rowAccumulator = 0;
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

    const bounce = direction => {
      if(prefersReducedMotion){
        startAnimation(optionIndex, { duration: 0 });
        finishGesture();
        return;
      }
      const overshoot = optionIndex + direction * 0.3;
      const settleId = ++pendingSettleId;
      startAnimation(overshoot, { duration: NUDGE_DURATION_MS, ease: easeOutCubic, onFinish: () => {
        commitIndex(optionIndex, null, { onFinish: () => {
          if(settleId === pendingSettleId){
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

    // Wheel quantizer state: accumulate deltas in row units so we can walk the
    // active index deterministically (≤ ±1 step per frame) without fighting the
    // idle snap animation.
    let pendingRowDelta = 0;
    let microRowDelta = 0;
    let rowAccumulator = 0;
    let lineRemainder = 0;
    let wheelFrame = null;
    let snapTimer = null;
    let activeGestureId = 0;
    let gestureSerial = 0;
    let lastGestureTs = 0;
    let lastScrollDirection = 0;
    const ROW_DECAY = 0.68;
    const ROW_EPSILON = 1e-3;

    const requestGesture = () => {
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

    const finishGesture = () => {
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

    const stopFreeScroll = () => {
      if(wheelFrame){
        cancelAnimationFrame(wheelFrame);
        wheelFrame = null;
      }
      pendingRowDelta = 0;
      microRowDelta = 0;
      rowAccumulator = 0;
    };

    const wrapPosition = () => {
      if(position < minIndex){
        const wraps = Math.ceil((minIndex - position) / wrapSpan);
        position += wrapSpan * wraps;
      }else if(position > maxIndex){
        const wraps = Math.ceil((position - maxIndex) / wrapSpan);
        position -= wrapSpan * wraps;
      }
    };

    const wheelStep = direction => {
      const info = normalizeIndex(optionIndex + direction);
      const value = values[modIndex(info.index)];
      if(disabledChecker(value)){
        // Resist path: dump the accumulator so we ease back to the current row
        // and let `bounce` nudge before settling.
        rowAccumulator = 0;
        bounce(direction);
        return false;
      }
      applyIndexCore(info.index, info);
      return true;
    };

    const runFreeScroll = () => {
      if(!activeGestureId){
        stopFreeScroll();
        return;
      }
      const delta = pendingRowDelta;
      pendingRowDelta = 0;
      if(delta !== 0){
        rowAccumulator += delta;
        lastScrollDirection = delta > 0 ? 1 : -1;
      }

      // Deterministic quantizer: clamp to a single adjacent step per frame so a
      // gentle wheel tick can never hop more than ±1 option. Any excess sticks in
      // `rowAccumulator` and will emit in following frames, preserving the smooth
      // progression during fast flicks.
      const step = Math.trunc(rowAccumulator);
      let moved = false;
      if(step !== 0){
        const clamped = step > 0 ? 1 : -1;
        if(wheelStep(clamped)){
          rowAccumulator -= clamped;
          moved = true;
        }
      }

      if(rowAccumulator !== 0){
        // Keep the visible offset within ±1 row. Any additional whole steps are
        // re-queued so subsequent animation frames can emit them one-at-a-time
        // without visually teleporting past intermediate options.
        const overflow = Math.trunc(rowAccumulator);
        if(overflow !== 0){
          pendingRowDelta += overflow;
          rowAccumulator -= overflow;
        }
      }

      if(!moved && delta === 0){
        // Idle decay keeps the free offset easing toward centre so the snap timer
        // never fights with live input.
        rowAccumulator *= ROW_DECAY;
        if(Math.abs(rowAccumulator) < ROW_EPSILON){
          rowAccumulator = 0;
        }
      }

      position = optionIndex + rowAccumulator;
      wrapPosition();
      syncPosition();

      if(pendingRowDelta !== 0 || Math.abs(rowAccumulator) > ROW_EPSILON){
        wheelFrame = requestAnimationFrame(runFreeScroll);
      }else{
        wheelFrame = null;
      }
    };

    const queueFreeScroll = () => {
      if(!wheelFrame){
        wheelFrame = requestAnimationFrame(runFreeScroll);
      }
    };

    const DOM_DELTA_LINE = typeof WheelEvent !== 'undefined' ? WheelEvent.DOM_DELTA_LINE : 1;
    const DOM_DELTA_PAGE = typeof WheelEvent !== 'undefined' ? WheelEvent.DOM_DELTA_PAGE : 2;

    const normalizeDelta = e => {
      if(e.deltaMode === DOM_DELTA_LINE){
        lineRemainder += e.deltaY;
        const lines = Math.sign(lineRemainder) * Math.min(1, Math.trunc(Math.abs(lineRemainder)));
        lineRemainder -= lines;
        return lines * ITEM_HEIGHT;
      }
      if(e.deltaMode === DOM_DELTA_PAGE){
        return e.deltaY * ITEM_HEIGHT * 3;
      }
      return e.deltaY;
    };

    const pushWheelDelta = delta => {
      if(delta === 0) return;
      // Normalise to rows and clamp extreme bursts so the accumulator releases
      // them over successive frames instead of teleporting.
      const rowDelta = Math.max(-MAX_WHEEL_ROWS_PER_EVENT, Math.min(MAX_WHEEL_ROWS_PER_EVENT, delta / ITEM_HEIGHT));
      const magnitude = Math.abs(rowDelta);
      const MICRO_ROW_THRESHOLD = MICRO_DELTA_THRESHOLD / ITEM_HEIGHT;
      if(magnitude < MICRO_ROW_THRESHOLD){
        microRowDelta += rowDelta;
        if(Math.abs(microRowDelta) < MICRO_ROW_THRESHOLD){
          return;
        }
        pendingRowDelta += microRowDelta;
        microRowDelta = 0;
      }else{
        microRowDelta = 0;
        pendingRowDelta += rowDelta;
      }
      queueFreeScroll();
    };

    const findNearestValid = (startIndex, preferredDirection) => {
      const directions = preferredDirection ? [preferredDirection, -preferredDirection] : [1, -1];
      for(const dir of directions){
        for(let stepCount = 1; stepCount <= block; stepCount++){
          const candidate = normalizeIndex(startIndex + dir * stepCount);
          const value = values[modIndex(candidate.index)];
          if(!disabledChecker(value)){
            return { info: candidate, direction: dir };
          }
        }
      }
      return null;
    };

    const nudgeAndSettle = (targetInfo, direction, settleId, gestureId) => {
      if(prefersReducedMotion){
        commitIndex(targetInfo.index, targetInfo, { duration: 0, onFinish: finishGesture });
        return;
      }
      startAnimation(optionIndex + direction * 0.35, {
        duration: NUDGE_DURATION_MS,
        ease: easeOutCubic,
        onFinish: () => {
          commitIndex(targetInfo.index, targetInfo, {
            onFinish: () => {
              if(settleId === pendingSettleId && gestureId === activeGestureId){
                finishGesture();
              }
            }
          });
        }
      });
    };

    // Idle-then-snap: we wait ~140ms after the last gesture delta before
    // animating back to center. Disabled targets trigger the resist path via
    // `findNearestValid`/`nudgeAndSettle`, so a blocked minute gently bounces
    // without teleporting.
    const scheduleSnap = () => {
      const settleId = ++pendingSettleId;
      if(snapTimer){
        clearTimeout(snapTimer);
      }
      snapTimer = setTimeout(() => {
        snapTimer = null;
        if(!activeGestureId){
          return;
        }
        const gestureId = activeGestureId;
        const value = values[modIndex(optionIndex)];
        if(disabledChecker(value)){
          const fallback = findNearestValid(optionIndex, lastScrollDirection);
          if(fallback){
            nudgeAndSettle(fallback.info, fallback.direction, settleId, gestureId);
          }else{
            bounce(lastScrollDirection || 1);
          }
          return;
        }
        commitIndex(optionIndex, null, {
          onFinish: () => {
            if(settleId === pendingSettleId && gestureId === activeGestureId){
              finishGesture();
            }
          }
        });
      }, SNAP_IDLE_MS);
    };

    viewport.addEventListener('wheel', e => {
      e.preventDefault();
      if(!requestGesture()) return;
      cancelAnimation();
      pushWheelDelta(normalizeDelta(e));
      scheduleSnap();
    }, { passive: false });

    viewport.addEventListener('keydown', e => {
      if(e.key === 'ArrowUp'){
        e.preventDefault();
        if(!requestGesture()) return;
        cancelAnimation();
        stopFreeScroll();
        step(-1);
      }
      if(e.key === 'ArrowDown'){
        e.preventDefault();
        if(!requestGesture()) return;
        cancelAnimation();
        stopFreeScroll();
        step(1);
      }
    });

    viewport.addEventListener('focusout', () => {
      if(lockController && lockController.forceRelease){
        lockController.forceRelease(lockId);
      }
    });

    viewport.addEventListener('touchstart', () => {
      if(lockController && lockController.forceRelease){
        lockController.forceRelease(lockId);
      }
    }, { passive: true });

    const setValue = val => {
      const valueIndex = values.indexOf(val);
      if(valueIndex === -1) return;
      const idx = baseBlock * block + valueIndex;
      const info = normalizeIndex(idx);
      optionIndex = info.index;
      if(info.shift){
        position += info.shift;
      }
      position = optionIndex;
      applySelection();
      lastValueIndex = modIndex(optionIndex);
      startAnimation(optionIndex, { duration: 0 });
    };

    const refresh = () => {
      position = optionIndex;
      syncPosition();
    };

    const onResize = () => { syncPosition(); };
    window.addEventListener('resize', onResize);
    // Centering fix: observe the viewport size so the very first paint (once the
    // element is measured) snaps the wheel to the exact middle instead of
    // rendering between options while waiting for a manual refresh.
    let resizeObserver = null;
    if(typeof ResizeObserver !== 'undefined'){
      resizeObserver = new ResizeObserver(() => { syncPosition(); });
      resizeObserver.observe(viewport);
    }

    const initial = options.initial;
    if(initial !== undefined && values.includes(initial)){
      const idx = baseBlock * block + values.indexOf(initial);
      const info = normalizeIndex(idx);
      optionIndex = info.index;
      if(info.shift){
        position += info.shift;
      }
      position = optionIndex;
      lastValueIndex = modIndex(optionIndex);
    }else{
      optionIndex = baseBlock * block;
      position = optionIndex;
      lastValueIndex = modIndex(optionIndex);
    }

    applySelection();
    syncPosition();

    return {
      element: viewport,
      get value(){ return values[modIndex(optionIndex)]; },
      setValue,
      step,
      setDisabledChecker(fn){
        disabledChecker = fn || (() => false);
        applySelection();
        const activeValue = values[modIndex(optionIndex)];
        if(disabledChecker(activeValue)){
          if(!tryStep(1)) tryStep(-1);
        }
      },
      refresh,
      focus(){ viewport.focus(); },
      dispose(){
        cancelAnimation();
        stopFreeScroll();
        window.removeEventListener('resize', onResize);
        if(resizeObserver){
          resizeObserver.disconnect();
          resizeObserver = null;
        }
        clearTimeout(snapTimer);
        if(lockController && lockController.forceRelease){
          lockController.forceRelease(lockId);
        }
      }
    };
  }

  function createWheelLockController(graceMs = 160){
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
        releaseTimer = setTimeout(() => {
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

  function createTimePicker(config = {}){
    const {
      hourRange = [1, 12],
      minuteStep = 15,
      showAmPm = true,
      fixedMeridiem = 'AM',
      staticMeridiemLabel = '',
      defaultValue,
      isMinuteDisabled = () => false,
      onChange = () => {},
      lockController: externalLock = null,
      formatHour = value => String(value),
      formatMinute = value => pad(value),
      formatMeridiem = value => value,
      ariaLabels = {},
      startEnd = null
    } = config;

    const hours = [];
    if(Array.isArray(hourRange)){
      const [start, end] = hourRange;
      for(let h = start; h <= end; h++){
        hours.push(h);
      }
    }else{
      hours.push(...hourRange);
    }

    const minutes = [];
    for(let m = 0; m < 60; m += minuteStep){
      minutes.push(m);
    }

    const meridiems = showAmPm ? ['AM', 'PM'] : [];

    const normalizeMeridiem = value => {
      if(showAmPm){
        const normalized = String(value || 'AM').toUpperCase();
        return meridiems.includes(normalized) ? normalized : meridiems[0];
      }
      return fixedMeridiem || 'AM';
    };

    const defaultMeridiem = normalizeMeridiem(defaultValue?.meridiem);
    const defaultHour = hours.includes(defaultValue?.hour) ? defaultValue.hour : hours[0];
    const defaultMinute = minutes.includes(defaultValue?.minute) ? defaultValue.minute : minutes[0];

    const computeDisabledMinutes = (hour, meridiem) => {
      const disabledSet = new Set();
      for(const minute of minutes){
        if(isMinuteDisabled({ hour, minute, meridiem })){
          disabledSet.add(minute);
        }
      }
      return disabledSet;
    };

    const deriveSafeMinute = (hour, meridiem, candidate, disabledSet) => {
      const isDisabled = value => disabledSet ? disabledSet.has(value) : isMinuteDisabled({ hour, minute: value, meridiem });
      if(!isDisabled(candidate)){
        return candidate;
      }
      for(const minute of minutes){
        if(!isDisabled(minute)){
          return minute;
        }
      }
      return candidate;
    };

    // Derive the first render snapshot (hour/minute/meridiem + disabled minutes)
    // synchronously so we never paint a greyed-out selection before the state is
    // ready. The fallback minute search also resolves blocked defaults up front.
    const initialHour = defaultHour;
    const initialMeridiem = defaultMeridiem;
    let disabledMinutes = computeDisabledMinutes(initialHour, initialMeridiem);
    // Tiny init fix: use the same disabled snapshot to pick the initial minute so
    // the first paint already knows which values are blocked.
    const initialMinute = deriveSafeMinute(initialHour, initialMeridiem, defaultMinute, disabledMinutes);

    let currentHour = initialHour;
    let currentMinute = initialMinute;
    let currentMeridiem = initialMeridiem;

    const minuteDisabledChecker = value => disabledMinutes.has(value);

    // Shared markup + tokens ensure each consumer lands on identical visuals.
    const root = document.createElement('div');
    root.className = 'time-picker';

    const wheels = document.createElement('div');
    wheels.className = 'time-picker-wheels';
    root.appendChild(wheels);

    // Lock controller keeps a single column active so horizontal drags never move
    // multiple axes at once. Callers can pass their own lock when synchronising
    // two pickers (e.g. start/end) or fall back to this default instance.
    const lock = externalLock || createWheelLockController(160);

    const hourColumn = document.createElement('div');
    hourColumn.className = 'time-picker-column';
    wheels.appendChild(hourColumn);

    const minuteColumn = document.createElement('div');
    minuteColumn.className = 'time-picker-column';
    wheels.appendChild(minuteColumn);

    const hourWheel = createWheel(hours, {
      initial: initialHour,
      formatValue: formatHour,
      lockController: lock,
      lockId: 'hours',
      ariaLabel: ariaLabels.hours || 'Hours',
      onChange(value){
        currentHour = value;
        disabledMinutes = computeDisabledMinutes(currentHour, currentMeridiem);
        minuteWheel.setDisabledChecker(minuteDisabledChecker);
        if(disabledMinutes.has(currentMinute)){
          const fallback = deriveSafeMinute(currentHour, currentMeridiem, currentMinute);
          if(minutes.includes(fallback)){
            minuteWheel.setValue(fallback);
            currentMinute = fallback;
          }
        }
        onChange(getValue());
      }
    });

    const minuteWheel = createWheel(minutes, {
      initial: initialMinute,
      formatValue: formatMinute,
      lockController: lock,
      lockId: 'minutes',
      disabledChecker: minuteDisabledChecker,
      ariaLabel: ariaLabels.minutes || 'Minutes',
      onChange(value){
        currentMinute = value;
        onChange(getValue());
      }
    });

    hourColumn.appendChild(hourWheel.element);
    minuteColumn.appendChild(minuteWheel.element);

    let meridiemWheel = null;
    let staticMeridiem = null;

    if(showAmPm){
      const meridiemColumn = document.createElement('div');
      meridiemColumn.className = 'time-picker-column time-picker-meridiem';
      wheels.appendChild(meridiemColumn);
      meridiemWheel = createWheel(meridiems, {
        initial: initialMeridiem,
        formatValue: formatMeridiem,
        lockController: lock,
        lockId: 'meridiem',
        ariaLabel: ariaLabels.meridiem || 'AM or PM',
        onChange(value){
          currentMeridiem = value;
          disabledMinutes = computeDisabledMinutes(currentHour, currentMeridiem);
          minuteWheel.setDisabledChecker(minuteDisabledChecker);
          if(disabledMinutes.has(currentMinute)){
            const fallback = deriveSafeMinute(currentHour, currentMeridiem, currentMinute);
            if(minutes.includes(fallback)){
              minuteWheel.setValue(fallback);
              currentMinute = fallback;
            }
          }
          onChange(getValue());
        }
      });
      meridiemColumn.appendChild(meridiemWheel.element);
    }else if(staticMeridiemLabel){
      staticMeridiem = document.createElement('div');
      staticMeridiem.className = 'time-picker-meridiem-static';
      staticMeridiem.textContent = staticMeridiemLabel;
      staticMeridiem.setAttribute('aria-hidden', 'true');
      wheels.appendChild(staticMeridiem);
    }

    const rangeActions = startEnd ? document.createElement('div') : null;
    if(rangeActions){
      rangeActions.className = 'time-picker-range-actions';
      const startBtn = document.createElement('button');
      startBtn.type = 'button';
      startBtn.className = 'time-picker-range-btn';
      startBtn.textContent = startEnd.startLabel || 'Set Start Time';
      startBtn.addEventListener('click', () => {
        if(startEnd.onSetStart){
          startEnd.onSetStart(getValue());
        }
      });
      rangeActions.appendChild(startBtn);
      if(startEnd.onSetEnd){
        const endBtn = document.createElement('button');
        endBtn.type = 'button';
        endBtn.className = 'time-picker-range-btn';
        endBtn.textContent = startEnd.endLabel || 'Set End Time';
        endBtn.addEventListener('click', () => {
          startEnd.onSetEnd(getValue());
        });
        rangeActions.appendChild(endBtn);
      }
      root.appendChild(rangeActions);
    }

    const getValue = () => ({
      hour: currentHour,
      minute: currentMinute,
      meridiem: currentMeridiem
    });

    disabledMinutes = computeDisabledMinutes(currentHour, currentMeridiem);
    minuteWheel.setDisabledChecker(minuteDisabledChecker);

    const focus = () => {
      hourWheel.focus();
    };

    const dispose = () => {
      hourWheel.dispose();
      minuteWheel.dispose();
      if(meridiemWheel){
        meridiemWheel.dispose();
      }
    };

    return {
      element: root,
      getValue,
      focus,
      dispose,
      get hourWheel(){ return hourWheel; },
      get minuteWheel(){ return minuteWheel; },
      get meridiemWheel(){ return meridiemWheel; }
    };
  }

  global.TimePickerKit = {
    createWheel,
    createTimePicker,
    createWheelLockController
  };
})(window);
