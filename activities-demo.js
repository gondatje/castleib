(function(){
  const interactions = window.CHSActivitiesInteractions;
  const attach = interactions && typeof interactions.attachRowPressInteractions === 'function'
    ? interactions.attachRowPressInteractions
    : (element, { onActivate }) => {
        element.addEventListener('click', onActivate);
        return { dispose(){} };
      };

  const attachGroupPillInteractions = (window.AssignmentChipLogic && typeof window.AssignmentChipLogic.attachGroupPillInteractions === 'function')
    ? window.AssignmentChipLogic.attachGroupPillInteractions
    : () => ({ open: () => {}, close: () => {} });

  // Mirror the production overflow controller so the preview keeps the guest
  // rail locked to one line and trades excess chips for a +N popover.
  const layoutGuestCluster = (container, chips, options = {}) => {
    if(!container) return;
    const items = Array.isArray(chips) ? chips.filter(Boolean) : [];
    container.innerHTML = '';
    if(items.length === 0){
      container.dataset.hasGuests = 'false';
      return;
    }

    const visible = items.slice();
    const hidden = [];
    let overflowButton = null;
    const measurementPadding = 1;
    const measureWidth = () => {
      if(typeof options.availableWidth === 'number' && options.availableWidth > 0){
        return options.availableWidth;
      }
      return container.clientWidth;
    };

    const applyLayout = () => {
      container.innerHTML = '';
      visible.forEach(chip => container.appendChild(chip));
      if(hidden.length > 0){
        if(!overflowButton){
          overflowButton = buildOverflowButton(options);
        }
        updateOverflowButton(overflowButton, hidden, options);
        container.appendChild(overflowButton);
      }
      container.dataset.hasGuests = 'true';
    };

    applyLayout();

    if(measureWidth() <= 0){
      if(typeof requestAnimationFrame === 'function'){
        requestAnimationFrame(() => layoutGuestCluster(container, items, options));
      }
      return;
    }

    let guard = 0;
    while(visible.length > 0 && container.scrollWidth > measureWidth() + measurementPadding && guard < items.length){
      // Peel chips from the far left until the measured width fits, then trade
      // the leftovers for the +N overflow pill.
      hidden.unshift(visible.pop());
      guard += 1;
      applyLayout();
    }

    if(hidden.length === 0){
      container.dataset.hasGuests = 'true';
      return;
    }

    guard = 0;
    while(visible.length > 0 && container.scrollWidth > measureWidth() + measurementPadding && guard < items.length){
      hidden.unshift(visible.pop());
      guard += 1;
      applyLayout();
    }

    applyLayout();
  };

  const buildOverflowButton = (options = {}) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tag-everyone guest-overflow-pill';
    button.dataset.pressExempt = 'true';
    button.dataset.overflowChip = 'true';
    button.dataset.guestChip = 'true';
    button.tabIndex = -1;
    button.setAttribute('aria-haspopup', 'true');
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('pointerdown', event => event.stopPropagation());
    button.addEventListener('click', event => event.stopPropagation());

    const label = document.createElement('span');
    label.className = 'guest-overflow-label';
    button.appendChild(label);

    const popover = document.createElement('div');
    popover.className = 'popover';
    popover.setAttribute('role', 'group');
    popover.setAttribute('aria-label', options.popoverLabel || 'Additional guests');
    button.appendChild(popover);

    attachGroupPillInteractions(button);
    return button;
  };

  const updateOverflowButton = (button, hiddenChips, options = {}) => {
    if(!button) return;
    const count = hiddenChips.length;
    const label = button.querySelector('.guest-overflow-label');
    if(label){
      label.textContent = `+${count}`;
    }
    const popover = button.querySelector('.popover');
    if(popover){
      popover.innerHTML = '';
      hiddenChips.forEach(chip => popover.appendChild(chip));
    }
    const tooltipNames = hiddenChips.map(chip => chip?.title || chip?.getAttribute?.('aria-label') || chip?.textContent || '').filter(Boolean);
    const prefix = options.ariaLabelPrefix || 'More guests';
    if(tooltipNames.length > 0){
      const joined = tooltipNames.join(', ');
      button.title = joined;
      button.setAttribute('aria-label', `${prefix}: ${joined}`);
    }else{
      button.removeAttribute('title');
      button.setAttribute('aria-label', `${prefix} (${count})`);
    }
  };

  const buildGuestChip = (guest, log) => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.dataset.guestChip = 'true';
    chip.tabIndex = -1;
    chip.style.borderColor = guest.color;
    chip.style.color = guest.color;
    const guestName = guest?.name || 'Guest';
    chip.title = guestName;
    chip.setAttribute('aria-label', guestName);

    const initial = document.createElement('span');
    initial.className = 'initial';
    initial.textContent = guestName.charAt(0).toUpperCase();
    chip.appendChild(initial);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'x';
    remove.textContent = '×';
    remove.dataset.pressExempt = 'true';
    remove.addEventListener('pointerdown', e => e.stopPropagation());
    remove.addEventListener('click', e => {
      e.stopPropagation();
      log(`Simulated removal of ${guestName}`);
    });
    chip.appendChild(remove);

    return chip;
  };

  const createGuestLane = (activity, log) => {
    const lane = document.createElement('div');
    lane.className = 'activity-row-guest-lane';

    const slot = document.createElement('div');
    slot.className = 'activity-row-guest-slot';
    slot.dataset.expanded = 'false';
    lane.appendChild(slot);

    const guests = Array.isArray(activity.guests) ? activity.guests : [];
    if(guests.length === 0){
      if(activity.pill){
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'tag-everyone guest-reveal-pill';
        pill.dataset.pressExempt = 'true';
        pill.textContent = activity.pill.label;
        pill.setAttribute('aria-expanded', 'false');
        if(activity.pill.aria){
          pill.setAttribute('aria-label', activity.pill.aria);
        }
        pill.addEventListener('pointerdown', event => event.stopPropagation());
        pill.addEventListener('click', event => {
          event.stopPropagation();
          log(`Previewed group pill: ${activity.pill.label}`);
        });
        slot.appendChild(pill);
      }
      return { lane, open: () => {}, close: () => {} };
    }

    const chips = guests.map(guest => buildGuestChip(guest, log));
    if(guests.length <= 1 || !activity.pill){
      const cluster = document.createElement('div');
      cluster.className = 'activity-row-guests';
      cluster.dataset.hasGuests = 'true';
      chips.forEach(chip => cluster.appendChild(chip));
      slot.appendChild(cluster);
      return { lane, open: () => {}, close: () => {} };
    }

    const cluster = document.createElement('div');
    cluster.className = 'activity-row-guest-cluster';

    const revealSlot = document.createElement('div');
    revealSlot.className = 'guest-reveal-slot';
    slot.appendChild(revealSlot);

    const collapsedLabel = activity.pill?.label || (guests.length === 2 ? 'Both' : 'Everyone');
    const allNames = guests.map(guest => guest.name).filter(Boolean).join(', ');
    const pillAria = activity.pill?.aria || (allNames ? `${collapsedLabel}: ${allNames}` : collapsedLabel);

    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'tag-everyone guest-reveal-pill';
    pill.dataset.pressExempt = 'true';
    pill.textContent = collapsedLabel;
    pill.setAttribute('aria-expanded', 'false');
    pill.setAttribute('aria-label', pillAria);
    if(allNames){
      pill.title = allNames;
    }
    pill.addEventListener('pointerdown', event => event.stopPropagation());
    revealSlot.appendChild(pill);

    let expanded = false;
    let availableWidth = 0;
    let focusIndex = 0;
    const getFocusTargets = () => Array.from(cluster.querySelectorAll('[data-guest-chip="true"]'));

    const focusByIndex = (index) => {
      const targets = getFocusTargets();
      if(targets.length === 0) return;
      const nextIndex = Math.max(0, Math.min(index, targets.length - 1));
      const target = targets[nextIndex];
      if(target && typeof target.focus === 'function'){
        target.focus({ preventScroll: true });
        focusIndex = nextIndex;
      }
    };

    const syncFocusIndex = () => {
      const active = document.activeElement;
      const targets = getFocusTargets();
      const current = targets.indexOf(active);
      if(current >= 0){
        focusIndex = current;
      }else{
        focusIndex = Math.min(focusIndex, Math.max(0, targets.length - 1));
      }
    };

    const mountCluster = () => {
      if(revealSlot.firstChild === cluster) return;
      // Swap the pill for the live cluster so chips inherit the pill's layout slot
      // without nudging the trailing rail.
      revealSlot.replaceChildren(cluster);
    };

    const mountPill = () => {
      if(revealSlot.firstChild === pill) return;
      revealSlot.replaceChildren(pill);
    };

    const renderCluster = () => {
      if(!expanded) return;
      mountCluster();
      const width = availableWidth > 0 ? availableWidth : lane.getBoundingClientRect().width;
      if(width <= 0){
        if(typeof requestAnimationFrame === 'function'){
          requestAnimationFrame(renderCluster);
        }
        return;
      }
      cluster.style.width = `${width}px`;
      revealSlot.style.width = `${width}px`;
      slot.style.setProperty('--guest-lane-width', `${width}px`);
      // Width is passed to the overflow controller so the row-reverse cluster can
      // trim from the left while keeping the reveal anchored to the action rail.
      // The helper handles +N overflow exactly the same as the always-expanded rows.
      layoutGuestCluster(cluster, chips, {
        popoverLabel: 'Guests',
        ariaLabelPrefix: 'More guests',
        availableWidth: width
      });
      syncFocusIndex();
    };

    const updateAvailableWidth = (width) => {
      const normalized = Math.max(0, Math.floor(width));
      if(normalized === availableWidth) return;
      availableWidth = normalized;
      renderCluster();
    };

    if(typeof ResizeObserver === 'function'){
      // Track the live width of the middle grid lane so overflow math knows how
      // many chips can fit without nudging the right rail.
      const observer = new ResizeObserver(entries => {
        entries.forEach(entry => updateAvailableWidth(entry.contentRect.width));
      });
      observer.observe(lane);
    }else{
      window.addEventListener('resize', () => updateAvailableWidth(lane.getBoundingClientRect().width));
    }

    requestAnimationFrame(() => updateAvailableWidth(lane.getBoundingClientRect().width));

    const open = ({ focusFirst = false, source = 'pointer' } = {}) => {
      if(expanded) return;
      expanded = true;
      slot.dataset.expanded = 'true';
      pill.setAttribute('aria-expanded', 'true');
      renderCluster();
      if(focusFirst){
        focusIndex = 0;
        requestAnimationFrame(() => focusByIndex(0));
      }
      if(source === 'action'){
        log(`Previewed group pill: ${collapsedLabel}`);
      }
    };

    const close = ({ restoreFocus = true } = {}) => {
      if(!expanded) return;
      expanded = false;
      slot.dataset.expanded = 'false';
      pill.setAttribute('aria-expanded', 'false');
      cluster.style.width = '';
      revealSlot.style.width = '';
      slot.style.removeProperty('--guest-lane-width');
      mountPill();
      focusIndex = 0;
      if(restoreFocus && typeof pill.focus === 'function'){
        pill.focus({ preventScroll: true });
      }
    };

    pill.addEventListener('mouseenter', () => open());
    pill.addEventListener('focus', () => open({ focusFirst: true, source: 'focus' }));

    pill.addEventListener('click', event => {
      event.stopPropagation();
      if(expanded){
        close({ restoreFocus: false });
      }else{
        open({ focusFirst: true, source: 'action' });
      }
    });

    pill.addEventListener('keydown', event => {
      if(event.key === ' ' || event.key === 'Spacebar' || event.key === 'Enter'){
        event.preventDefault();
      }
      if(event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar'){
        if(expanded){
          close();
        }else{
          open({ focusFirst: true, source: 'action' });
        }
      }
    });

    lane.addEventListener('mouseleave', () => {
      if(lane.matches(':focus-within')) return;
      close({ restoreFocus: false });
    });

    lane.addEventListener('focusout', event => {
      if(lane.contains(event.relatedTarget)) return;
      close({ restoreFocus: false });
    });

    lane.addEventListener('keydown', event => {
      if(event.key === 'Escape' && expanded){
        event.preventDefault();
        close();
        return;
      }
      if(!expanded) return;
      if(event.key === 'ArrowLeft' || event.key === 'ArrowRight'){
        // Arrow keys drive a roving focus order across the revealed chips so the
        // screen reader outline follows the right-to-left visual order without
        // changing the tab stop stack.
        const delta = event.key === 'ArrowRight' ? -1 : 1;
        event.preventDefault();
        focusByIndex(focusIndex + delta);
      }
    });

    return { lane, open, close };
  };

  const list = document.getElementById('demoActivities');
  const logEl = document.getElementById('demoLog');
  if(!list || !logEl) return;

  const sampleActivities = [
    {
      start: '8:00am',
      end: '8:45am',
      title: 'Sunrise Trail Run',
      guests: [
        { name: 'Aria', color: '#6366f1' }
      ]
    },
    {
      start: '10:15am',
      end: '11:00am',
      title: 'Couples Sound Bath',
      pill: { label: 'Both', aria: 'Both guests preview' },
      guests: [
        { name: 'Alex', color: '#6366f1' },
        { name: 'Bailey', color: '#ec4899' }
      ]
    },
    {
      start: '12:30pm',
      end: '1:30pm',
      title: 'Chef’s Garden Luncheon',
      pill: { label: 'Everyone', aria: 'All four guests preview' },
      guests: [
        { name: 'Casey', color: '#22c55e' },
        { name: 'Drew', color: '#f97316' },
        { name: 'Emery', color: '#6366f1' },
        { name: 'Finley', color: '#ec4899' }
      ]
    },
    {
      start: '5:30pm',
      end: '7:00pm',
      title: 'Stargazing Terrace',
      pill: { label: 'Everyone', aria: 'Full party preview' },
      guests: [
        { name: 'Grey', color: '#0ea5e9' },
        { name: 'Harper', color: '#f97316' },
        { name: 'Indie', color: '#22c55e' },
        { name: 'Jules', color: '#a855f7' },
        { name: 'Kai', color: '#6366f1' },
        { name: 'Lennon', color: '#ec4899' },
        { name: 'Milan', color: '#14b8a6' },
        { name: 'Noa', color: '#ef4444' }
      ]
    },
    {
      start: '8:30pm',
      end: '9:15pm',
      title: 'Moonlight Meditation',
      disabled: true
    }
  ];

  const log = (message) => {
    const entry = document.createElement('p');
    entry.className = 'demo-log-entry';
    entry.textContent = `${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })} — ${message}`;
    logEl.prepend(entry);
    while(logEl.children.length > 6){
      logEl.removeChild(logEl.lastChild);
    }
  };

  sampleActivities.forEach((activity, index) => {
    const row = document.createElement('div');
    row.className = 'activity-row';
    row.setAttribute('role', 'button');

    const disabled = !!activity.disabled;
    if(disabled){
      row.dataset.disabled = 'true';
      row.setAttribute('aria-disabled', 'true');
      row.tabIndex = -1;
    }else{
      row.tabIndex = 0;
    }

    const ariaLabel = `Add activity: ${activity.start} to ${activity.end} ${activity.title}`;
    row.setAttribute('aria-label', ariaLabel);

    const body = document.createElement('div');
    body.className = 'activity-row-body';

    const headline = document.createElement('div');
    headline.className = 'activity-row-headline';

    const time = document.createElement('span');
    time.className = 'activity-row-time';
    time.textContent = `${activity.start} – ${activity.end}`;
    headline.appendChild(time);

    const title = document.createElement('span');
    title.className = 'activity-row-title';
    title.textContent = activity.title;
    headline.appendChild(title);

    body.appendChild(headline);

    const { lane: guestLane } = createGuestLane(activity, log);
    guestLane.classList.add('guest-chips');

    const actionCluster = document.createElement('div');
    actionCluster.className = 'activity-row-rail add-chips';

    const trailing = document.createElement('div');
    trailing.className = 'activity-row-trailing row-trailing';
    trailing.appendChild(guestLane);
    trailing.appendChild(actionCluster);

    row.appendChild(body);
    row.appendChild(trailing);
    list.appendChild(row);

    const setPressed = (pressed) => {
      if(pressed){
        row.dataset.pressed = 'true';
      }else{
        delete row.dataset.pressed;
      }
    };

    const activate = () => {
      if(disabled){
        log(`Disabled activity blocked: ${activity.title}`);
        return;
      }
      log(`Activated ${activity.title}`);
    };

    attach(row, {
      onActivate: activate,
      isDisabled: () => disabled,
      onPressChange: setPressed
    });

    let keyboardPress = false;
    row.addEventListener('keydown', (event) => {
      if(disabled) return;
      if(event.key === ' ' || event.key === 'Spacebar'){
        event.preventDefault();
        if(!keyboardPress){
          keyboardPress = true;
          setPressed(true);
        }
      }else if(event.key === 'Enter'){
        event.preventDefault();
        activate();
      }
    });

    row.addEventListener('keyup', (event) => {
      if(!keyboardPress) return;
      if(event.key === ' ' || event.key === 'Spacebar'){
        event.preventDefault();
        keyboardPress = false;
        setPressed(false);
        if(!disabled){
          activate();
        }
      }
    });

    row.addEventListener('blur', () => {
      keyboardPress = false;
      setPressed(false);
    });

    if(disabled){
      log(`Disabled: ${activity.title}`);
    }
  });

  const focusFirstBtn = document.getElementById('demoFocusFirst');
  if(focusFirstBtn){
    focusFirstBtn.addEventListener('click', () => {
      const first = list.querySelector('.activity-row:not([data-disabled="true"])');
      if(first){
        first.focus();
      }
    });
  }

  const toggleThemeBtn = document.getElementById('demoThemeToggle');
  if(toggleThemeBtn){
    toggleThemeBtn.addEventListener('click', () => {
      const isDark = document.body.dataset.theme === 'dark';
      if(isDark){
        document.body.removeAttribute('data-theme');
      }else{
        document.body.dataset.theme = 'dark';
      }
    });
  }
})();
