(function(){
  const addIconSvg = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M11 11V5a1 1 0 1 1 2 0v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6z" fill="currentColor"/></svg>';
  const saveIconSvg = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M17 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-2-2zm-1 0v5H8V3h8zM8 20v-6h8v6H8z" fill="currentColor"/></svg>';
  const deleteIconSvg = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 3h6a1 1 0 0 1 1 1v1h4a1 1 0 1 1 0 2h-1l-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7H4a1 1 0 1 1 0-2h4V4a1 1 0 0 1 1-1zm1 6a1 1 0 0 0-1 1v8a1 1 0 1 0 2 0V10a1 1 0 0 0-1-1zm4 0a1 1 0 0 0-1 1v8a1 1 0 1 0 2 0V10a1 1 0 0 0-1-1z" fill="currentColor"/></svg>';
  const chevronSvg = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M5.22 2.97a.75.75 0 0 0 0 1.06L9.19 8l-3.97 3.97a.75.75 0 1 0 1.06 1.06l4.5-4.5a.75.75 0 0 0 0-1.06l-4.5-4.5a.75.75 0 0 0-1.06 0Z" fill="currentColor"/></svg>';
  const toggleOnSvg = '<svg viewBox="0 0 44 26" aria-hidden="true" focusable="false"><rect x="1" y="1" width="42" height="24" rx="12" fill="currentColor" opacity=".18"/><circle cx="31" cy="13" r="9" fill="currentColor"/></svg>';
  const toggleOffSvg = '<svg viewBox="0 0 44 26" aria-hidden="true" focusable="false"><rect x="1" y="1" width="42" height="24" rx="12" fill="currentColor" opacity=".12"/><circle cx="13" cy="13" r="9" fill="currentColor" opacity=".45"/></svg>';
  const createTimePicker = typeof window !== 'undefined' && window.TimePickerKit && typeof window.TimePickerKit.createTimePicker === 'function'
    ? window.TimePickerKit.createTimePicker
    : null;

  const categories = [
    { label:'Massages', services:['Desert Stone Massage','Hot Springs Reflexology'] },
    { label:'Treatments', services:['Forest Aroma Facial','Springs Body Polish'] },
    { label:'Therapies', services:['Sound Bowl Therapy','Breathwork Reset'] },
    { label:'Wellness Sessions', services:['Guided Meditation','Mindful Stretch'] }
  ];

  const therapistOptions = [
    { id:'no-preference', label:'No Preference' },
    { id:'female', label:'Female Therapist' },
    { id:'male', label:'Male Therapist' }
  ];

  const locationOptions = [
    { id:'any', label:'Any Location' },
    { id:'same-cabana', label:'Same Cabana' },
    { id:'in-room', label:'In-Room' }
  ];

  const durationOptions = [60, 90, 120];

  const viewports = [
    { key:'desktop', label:'Desktop', time:{ hour:9, minute:15, meridiem:'AM' }, end:'10:45 AM', therapist:'no-preference', location:'any', duration:90 },
    { key:'ipad', label:'iPad', time:{ hour:8, minute:0, meridiem:'AM' }, end:'10:00 AM', therapist:'female', location:'same-cabana', duration:120 },
    { key:'mobile', label:'Mobile', time:{ hour:9, minute:0, meridiem:'AM' }, end:'10:30 AM', therapist:'no-preference', location:'same-cabana', duration:90 }
  ];

  const guests = [
    { id:'alex', name:'Alex', initial:'A', color:'#4C6EF5', primary:true },
    { id:'jordan', name:'Jordan', initial:'J', color:'#F59F00', primary:false }
  ];

  const modes = [
    { key:'edit', label:'Edit', confirmLabel:'Save spa appointment', confirmIcon:saveIconSvg, showDelete:true, guestsOn:true, guestHint:'' },
    { key:'add', label:'Add', confirmLabel:'Add spa appointment', confirmIcon:addIconSvg, showDelete:false, guestsOn:false, guestHint:'Turn all guests on to add these settings.' }
  ];

  const root = document.querySelector('[data-preview-root]');
  if(!root) return;

  modes.forEach(mode => {
    const section = document.createElement('section');
    section.className = 'preview-section';

    const heading = document.createElement('h2');
    heading.className = 'preview-section-title';
    heading.textContent = `SPA — ${mode.label}`;
    section.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'preview-grid';

    viewports.forEach(view => {
      grid.appendChild(buildCard(mode, view));
    });

    section.appendChild(grid);
    root.appendChild(section);
  });

  function buildCard(mode, viewport){
    const card = document.createElement('div');
    card.className = 'preview-card';

    const label = document.createElement('div');
    label.className = 'preview-label';
    label.textContent = viewport.label;
    card.appendChild(label);

    card.appendChild(buildModal(mode, viewport));
    return card;
  }

  function buildModal(mode, viewport){
    const overlay = document.createElement('div');
    overlay.className = `spa-overlay preview-overlay preview-overlay--${viewport.key}`;

    const dialog = document.createElement('div');
    dialog.className = 'spa-dialog';
    overlay.appendChild(dialog);

    dialog.appendChild(buildHeader());
    dialog.appendChild(buildBody(viewport));
    dialog.appendChild(buildFooter(mode));

    return overlay;
  }

  function buildHeader(){
    const header = document.createElement('div');
    header.className = 'modal-header';

    const title = document.createElement('h2');
    title.className = 'modal-title';
    title.textContent = 'SPA';
    header.appendChild(title);

    const closeBtn = createIconButton({ icon:'<span aria-hidden="true">×</span>', label:'Close', extraClass:'modal-close' });
    header.appendChild(closeBtn);

    return header;
  }

  function buildBody(viewport){
    const body = document.createElement('div');
    body.className = 'modal-body spa-body';

    const layout = document.createElement('div');
    layout.className = 'modal-sections spa-layout';
    body.appendChild(layout);

    const grid = document.createElement('div');
    grid.className = 'spa-layout-grid';
    layout.appendChild(grid);

    const serviceColumn = document.createElement('div');
    serviceColumn.className = 'spa-layout-column spa-layout-column-services';
    grid.appendChild(serviceColumn);
    serviceColumn.appendChild(buildServiceSection());

    const divider = document.createElement('div');
    divider.className = 'spa-layout-divider';
    divider.setAttribute('aria-hidden','true');
    grid.appendChild(divider);

    const detailsColumn = document.createElement('div');
    detailsColumn.className = 'spa-layout-column spa-layout-column-details';
    grid.appendChild(detailsColumn);
    detailsColumn.appendChild(buildDetailsSection(viewport));

    return body;
  }

  function buildServiceSection(){
    const section = document.createElement('section');
    section.className = 'modal-section spa-section spa-section-services';

    const card = document.createElement('div');
    card.className = 'spa-block spa-service-card';
    section.appendChild(card);

    const heading = document.createElement('h3');
    heading.className = 'sr-only';
    heading.textContent = 'Service';
    card.appendChild(heading);

    const scroll = document.createElement('div');
    scroll.className = 'spa-service-scroll';
    card.appendChild(scroll);

    const list = document.createElement('div');
    list.className = 'spa-service-list';
    scroll.appendChild(list);

    categories.forEach((category, index) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'spa-cascade-row spa-category-row';
      if(index === 0){
        row.classList.add('open');
      }
      const label = document.createElement('span');
      label.className = 'spa-cascade-label';
      label.textContent = category.label;
      row.appendChild(label);
      const icon = document.createElement('span');
      icon.className = 'spa-cascade-chevron';
      icon.innerHTML = chevronSvg;
      row.appendChild(icon);
      list.appendChild(row);

      const panel = document.createElement('div');
      panel.className = 'spa-cascade-panel';
      panel.dataset.open = index === 0 ? 'true' : 'false';
      panel.setAttribute('aria-hidden', index === 0 ? 'false' : 'true');
      const inner = document.createElement('div');
      inner.className = 'spa-cascade-panel-inner';
      panel.appendChild(inner);

      category.services.forEach((service, serviceIndex) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'spa-service-button';
        btn.textContent = service;
        if(index === 0 && serviceIndex === 0){
          btn.classList.add('selected');
        }
        inner.appendChild(btn);
      });

      list.appendChild(panel);
    });

    return section;
  }

  function buildDetailsSection(viewport){
    const section = document.createElement('section');
    section.className = 'modal-section spa-section spa-section-details';

    const grid = document.createElement('div');
    grid.className = 'spa-details-grid';
    section.appendChild(grid);

    grid.appendChild(buildTimeCard(viewport));

    const pickerStack = document.createElement('div');
    pickerStack.className = 'spa-picker-stack';
    pickerStack.appendChild(buildPickerCard({
      title:'Therapist Preference',
      srOnly:true,
      options:therapistOptions,
      selected:viewport.therapist,
      className:'spa-detail-card spa-detail-card-therapist',
      listClass:'spa-option-list spa-option-list-therapist list-hairline'
    }));
    pickerStack.appendChild(buildPickerCard({
      title:'Location',
      srOnly:false,
      options:locationOptions,
      selected:viewport.location,
      className:'spa-detail-card spa-detail-card-location',
      listClass:'spa-option-list spa-option-list-location list-hairline'
    }));
    pickerStack.appendChild(buildDurationCard(viewport.duration));
    grid.appendChild(pickerStack);

    return section;
  }

  function buildTimeCard(viewport){
    const card = document.createElement('div');
    card.className = 'spa-block spa-detail-card spa-detail-card-time spa-time-block';

    const heading = document.createElement('h3');
    heading.className = 'sr-only';
    heading.textContent = 'Start Time';
    card.appendChild(heading);

    const container = document.createElement('div');
    container.className = 'spa-time-picker';
    card.appendChild(container);

    if(typeof createTimePicker === 'function'){
      const picker = createTimePicker({
        hourRange:[1,12],
        minuteStep:5,
        showAmPm:true,
        defaultValue:{ hour:viewport.time.hour, minute:viewport.time.minute, meridiem:viewport.time.meridiem },
        ariaLabels:{ hours:'Hours', minutes:'Minutes', meridiem:'AM or PM' }
      });
      container.appendChild(picker.element);
    }else{
      const fallback = document.createElement('div');
      fallback.className = 'time-picker-fallback';
      fallback.textContent = 'Time picker unavailable.';
      container.appendChild(fallback);
    }

    const preview = document.createElement('div');
    preview.className = 'spa-end-preview';
    const start = document.createElement('button');
    start.type = 'button';
    start.className = 'spa-start-time-display';
    start.textContent = formatTime(viewport.time);
    const separator = document.createElement('span');
    separator.className = 'spa-time-separator';
    separator.textContent = '–';
    const endValue = document.createElement('span');
    endValue.className = 'spa-end-time-value';
    endValue.textContent = viewport.end;
    preview.appendChild(start);
    preview.appendChild(separator);
    preview.appendChild(endValue);
    card.appendChild(preview);

    const hint = document.createElement('p');
    hint.className = 'spa-helper-text spa-time-hint';
    hint.hidden = true;
    card.appendChild(hint);

    return card;
  }

  function buildPickerCard({ title, srOnly, options, selected, className, listClass = 'spa-option-list list-hairline' }){
    const card = document.createElement('div');
    card.className = `spa-block spa-detail-card ${className}`;

    const heading = document.createElement('h3');
    heading.textContent = title;
    if(srOnly){
      heading.className = 'sr-only';
    }
    card.appendChild(heading);

    const list = document.createElement('div');
    list.className = listClass;
    card.appendChild(list);

    options.forEach(option => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'spa-option-row';
      btn.dataset.value = option.id;
      const label = document.createElement('span');
      label.className = 'spa-option-label';
      label.textContent = option.label;
      const check = document.createElement('span');
      check.className = 'spa-option-check';
      check.innerHTML = '<span aria-hidden="true">✓</span>';
      btn.appendChild(label);
      btn.appendChild(check);
      if(option.id === selected){
        btn.classList.add('is-selected');
      }
      list.appendChild(btn);
    });

    return card;
  }

  function buildDurationCard(selected){
    const card = document.createElement('div');
    card.className = 'spa-block spa-detail-card spa-detail-card-duration';

    const heading = document.createElement('h3');
    heading.textContent = 'Duration';
    card.appendChild(heading);

    const list = document.createElement('div');
    list.className = 'spa-option-list spa-option-list-duration list-hairline';
    card.appendChild(list);

    durationOptions.forEach(value => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'spa-option-row';
      btn.dataset.value = String(value);
      const label = document.createElement('span');
      label.className = 'spa-option-label';
      label.textContent = `${value} Minutes`;
      const check = document.createElement('span');
      check.className = 'spa-option-check';
      check.innerHTML = '<span aria-hidden="true">✓</span>';
      btn.appendChild(label);
      btn.appendChild(check);
      if(value === selected){
        btn.classList.add('is-selected');
      }
      list.appendChild(btn);
    });

    return card;
  }

  function buildFooter(mode){
    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const start = document.createElement('div');
    start.className = 'modal-footer-start spa-footer-start';
    start.appendChild(buildGuestSection(mode));
    footer.appendChild(start);

    const end = document.createElement('div');
    end.className = 'modal-footer-end spa-footer-end';
    if(mode.showDelete){
      end.appendChild(createIconButton({ icon: deleteIconSvg, label: 'Delete spa appointment', extraClass: 'btn-icon--subtle' }));
    }
    const confirmBtn = createIconButton({ icon: mode.confirmIcon, label: mode.confirmLabel, extraClass: 'btn-icon--primary' });
    confirmBtn.classList.add('spa-confirm');
    end.appendChild(confirmBtn);
    footer.appendChild(end);

    return footer;
  }

  function buildGuestSection(mode){
    const section = document.createElement('section');
    section.className = 'modal-section spa-section spa-section-guests spa-block spa-guest-card spa-detail-card spa-detail-card-guests spa-footer-guests';

    const header = document.createElement('div');
    header.className = 'spa-guest-header';

    const heading = document.createElement('h3');
    heading.className = 'sr-only';
    heading.textContent = 'Guests';
    header.appendChild(heading);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'icon-btn spa-toggle-all spa-guest-switch';
    toggle.setAttribute('aria-label', mode.guestsOn ? 'Guests on' : 'Guests off');
    toggle.innerHTML = mode.guestsOn ? toggleOnSvg : toggleOffSvg;
    toggle.style.color = mode.guestsOn ? 'var(--brand)' : 'var(--muted)';
    header.appendChild(toggle);
    section.appendChild(header);

    const list = document.createElement('div');
    list.className = 'spa-option-list spa-option-list-guests list-hairline spa-guest-chip-list';
    section.appendChild(list);

    guests.forEach(guest => {
      const isSelected = mode.guestsOn;
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'spa-option-row spa-guest-row';
      if(isSelected){
        row.classList.add('is-selected');
      }else{
        row.classList.add('is-off');
      }

      const swatch = document.createElement('span');
      swatch.className = 'spa-guest-swatch';
      swatch.style.setProperty('--spa-guest-color', guest.color);
      swatch.setAttribute('aria-hidden','true');

      const label = document.createElement('span');
      label.className = 'spa-option-label';
      if(guest.primary){
        const star = document.createElement('span');
        star.className = 'spa-guest-star';
        star.textContent = '★';
        star.setAttribute('aria-hidden','true');
        label.appendChild(star);
      }
      const text = document.createElement('span');
      text.className = 'spa-option-text';
      text.textContent = guest.name;
      label.appendChild(text);

      const check = document.createElement('span');
      check.className = 'spa-option-check';
      check.innerHTML = '<span aria-hidden="true">✓</span>';

      row.appendChild(swatch);
      row.appendChild(label);
      row.appendChild(check);
      list.appendChild(row);
    });

    const hint = document.createElement('p');
    hint.className = 'spa-helper-text spa-guest-hint';
    hint.textContent = mode.guestHint;
    hint.hidden = !mode.guestHint;
    section.appendChild(hint);

    return section;
  }

  function createIconButton({ icon, label, extraClass='' }){
    const button = document.createElement('button');
    button.type = 'button';
    button.className = ['btn-icon', extraClass].filter(Boolean).join(' ');
    button.setAttribute('aria-label', label);
    button.title = label;
    button.innerHTML = icon;
    return button;
  }

  function formatTime({ hour, minute, meridiem }){
    const paddedMinute = String(minute).padStart(2,'0');
    return `${hour}:${paddedMinute} ${meridiem}`;
  }
})();
