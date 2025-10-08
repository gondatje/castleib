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

    if(container.clientWidth <= 0){
      if(typeof requestAnimationFrame === 'function'){
        requestAnimationFrame(() => layoutGuestCluster(container, items, options));
      }
      return;
    }

    let guard = 0;
    while(visible.length > 0 && container.scrollWidth > container.clientWidth + measurementPadding && guard < items.length){
      hidden.unshift(visible.pop());
      guard += 1;
      applyLayout();
    }

    if(hidden.length === 0){
      container.dataset.hasGuests = 'true';
      return;
    }

    guard = 0;
    while(visible.length > 0 && container.scrollWidth > container.clientWidth + measurementPadding && guard < items.length){
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

  const list = document.getElementById('demoActivities');
  const logEl = document.getElementById('demoLog');
  if(!list || !logEl) return;

  const sampleActivities = [
    {
      start: '8:30am',
      end: '9:25am',
      title: 'Rise & Shine Flow Yoga',
      guests: [
        { name: 'Alex', color: '#6366f1' },
        { name: 'Bailey', color: '#ec4899' }
      ]
    },
    {
      start: '10:15am',
      end: '11:00am',
      title: 'Botanical Immersion Walk',
      pill: { label: 'Both', aria: 'Both guests preview' }
    },
    {
      start: '1:00pm',
      end: '2:00pm',
      title: 'Sound Bath Session',
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

    const guestCluster = document.createElement('div');
    guestCluster.className = 'activity-row-guests';

    const actionCluster = document.createElement('div');
    actionCluster.className = 'activity-row-rail';

    if(activity.pill){
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'tag-everyone';
      pill.dataset.pressExempt = 'true';
      pill.addEventListener('pointerdown', e => e.stopPropagation());
      pill.textContent = activity.pill.label;
      pill.setAttribute('aria-label', activity.pill.aria || activity.pill.label);
      pill.addEventListener('click', e => {
        e.stopPropagation();
        log(`Previewed group pill: ${activity.pill.label}`);
      });
      guestCluster.appendChild(pill);
      guestCluster.dataset.hasGuests = 'true';
    }

    if(Array.isArray(activity.guests) && activity.guests.length > 0){
      const chips = activity.guests.map(guest => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.style.borderColor = guest.color;
        chip.style.color = guest.color;
        chip.title = guest.name;

        const initial = document.createElement('span');
        initial.className = 'initial';
        initial.textContent = guest.name.charAt(0).toUpperCase();
        chip.appendChild(initial);

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'x';
        remove.textContent = '×';
        remove.dataset.pressExempt = 'true';
        remove.addEventListener('pointerdown', e => e.stopPropagation());
        remove.addEventListener('click', e => {
          e.stopPropagation();
          log(`Simulated removal of ${guest.name}`);
        });
        chip.appendChild(remove);

        return chip;
      });

      const targetCluster = activity.pill ? (() => {
        const wrapper = document.createElement('div');
        wrapper.className = 'activity-row-guests';
        guestCluster.appendChild(wrapper);
        return wrapper;
      })() : guestCluster;

      layoutGuestCluster(targetCluster, chips, {
        popoverLabel: 'Guests',
        ariaLabelPrefix: 'More guests'
      });
    }

    row.appendChild(body);
    row.appendChild(guestCluster);
    row.appendChild(actionCluster);
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
