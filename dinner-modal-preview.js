(function(){
  const addIconSvg = '<svg viewBox="0 0 256 256" aria-hidden="true" focusable="false"><circle cx="128" cy="128" r="112" fill="none" stroke="currentColor" stroke-width="16"/><path d="M 80,128 H 176" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round"/><path d="M 128,80 V 176" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round"/></svg>';
  const saveIconSvg = '<svg viewBox="-3 -3 24 24" aria-hidden="true" focusable="false"><path d="M2 0h11.22a2 2 0 0 1 1.345.52l2.78 2.527A2 2 0 0 1 18 4.527V16a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm0 2v14h14V4.527L13.22 2H2zm4 8h6a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2zm0 2v4h6v-4H6zm7-9a1 1 0 0 1 1 1v3a1 1 0 0 1-2 0V4a1 1 0 0 1 1-1zM5 3h5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm1 3h3V5H6v1z" fill="currentColor"/></svg>';
  const deleteIconSvg = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2h4a1 1 0 1 1 0 2h-1.069l-.867 12.142A2 2 0 0 1 17.069 22H6.93a2 2 0 0 1-1.995-1.858L4.07 8H3a1 1 0 0 1 0-2h4V4zm2 2h6V4H9v2zM6.074 8l.857 12H17.07l.857-12H6.074zM10 10a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1zm4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1z" fill="currentColor"/></svg>';

  const dinnerHours = [5,6,7,8];
  const minuteRules = {
    5: new Set([0,15]),
    6: new Set([45]),
    7: new Set(),
    8: new Set([15,30,45])
  };

  const viewports = [
    { key:'desktop', label:'Desktop', time:{ hour:7, minute:30 } },
    { key:'ipad', label:'iPad', time:{ hour:7, minute:15 } },
    { key:'mobile', label:'Mobile', time:{ hour:7, minute:0 } }
  ];

  const modes = [
    { key:'edit', label:'Edit', showDelete:true },
    { key:'add', label:'Add', showDelete:false }
  ];

  const root = document.querySelector('[data-preview-root]');
  if(!root) return;

  modes.forEach(mode => {
    const section = document.createElement('section');
    section.className = 'preview-section';

    const heading = document.createElement('h2');
    heading.className = 'preview-section-title';
    heading.textContent = `Dinner — ${mode.label}`;
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
    overlay.className = `dinner-overlay preview-overlay preview-overlay--${viewport.key}`;

    const dialog = document.createElement('div');
    dialog.className = 'dinner-dialog';
    overlay.appendChild(dialog);

    const header = document.createElement('div');
    header.className = 'modal-header';
    const title = document.createElement('h2');
    title.className = 'modal-title';
    title.textContent = 'Dinner';
    header.appendChild(title);
    header.appendChild(createIconButton({ icon: '<span aria-hidden="true">×</span>', label: 'Close', extraClass: 'modal-close' }));
    dialog.appendChild(header);

    const body = document.createElement('div');
    body.className = 'modal-body dinner-body';
    dialog.appendChild(body);

    const shell = document.createElement('div');
    shell.className = 'dinner-time-shell';
    body.appendChild(shell);

    const section = document.createElement('section');
    section.className = 'dinner-time-section';
    const heading = document.createElement('h3');
    heading.className = 'dinner-time-heading';
    heading.textContent = 'Time';
    section.appendChild(heading);

    const content = document.createElement('div');
    content.className = 'dinner-time-content';
    section.appendChild(content);

    if(typeof createTimePicker === 'function'){
      const timePicker = createTimePicker({
        hourRange: [dinnerHours[0], dinnerHours[dinnerHours.length-1]],
        minuteStep: 15,
        showAmPm: false,
        fixedMeridiem: 'PM',
        staticMeridiemLabel: 'pm',
        defaultValue: { hour: viewport.time.hour, minute: viewport.time.minute, meridiem: 'PM' },
        isMinuteDisabled: ({hour, minute}) => {
          const disabledSet = minuteRules[hour] || new Set();
          return disabledSet.has(minute);
        }
      });
      timePicker.element.classList.add('dinner-time-picker');
      content.appendChild(timePicker.element);
    }else{
      const fallback = document.createElement('div');
      fallback.className = 'time-picker-fallback';
      fallback.textContent = 'Time picker unavailable.';
      content.appendChild(fallback);
    }

    shell.appendChild(section);

    const footer = document.createElement('div');
    footer.className = 'modal-footer dinner-footer';
    // Dinner is always all-guests; guest UI removed.
    const footerEnd = document.createElement('div');
    footerEnd.className = 'modal-footer-end dinner-footer-end';
    if(mode.showDelete){
      footerEnd.appendChild(createIconButton({ icon: deleteIconSvg, label: 'Delete dinner', extraClass: 'btn-icon--subtle' }));
    }
    const confirmIcon = mode.showDelete ? saveIconSvg : addIconSvg;
    const confirmLabel = mode.showDelete ? 'Save dinner time' : 'Add dinner time';
    footerEnd.appendChild(createIconButton({ icon: confirmIcon, label: confirmLabel, extraClass: 'btn-icon--primary' }));
    footer.appendChild(footerEnd);

    dialog.appendChild(footer);
    return overlay;
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
})();
