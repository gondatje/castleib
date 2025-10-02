(function(){
  const interactions = window.CHSActivitiesInteractions;
  const attach = interactions && typeof interactions.attachRowPressInteractions === 'function'
    ? interactions.attachRowPressInteractions
    : (element, { onActivate }) => {
        element.addEventListener('click', onActivate);
        return { dispose(){} };
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

    const tagRow = document.createElement('div');
    tagRow.className = 'tag-row';

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
      tagRow.appendChild(pill);
    }

    if(Array.isArray(activity.guests)){
      activity.guests.forEach(guest => {
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

        tagRow.appendChild(chip);
      });
    }

    body.appendChild(tagRow);
    row.appendChild(body);
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
