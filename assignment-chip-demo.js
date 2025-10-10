(function(){
  const logic = window.AssignmentChipLogic;
  if(!logic) return;

  const { AssignmentChipMode, getAssignmentChipRenderPlan } = logic;

  const sampleGuests = [
    { id: 'alex', name: 'Alex Rivera', color: '#6366f1' },
    { id: 'blair', name: 'Blair Morgan', color: '#06b6d4' },
    { id: 'casey', name: 'Casey Patel', color: '#22c55e' },
    { id: 'devon', name: 'Devon Lee', color: '#f59e0b' }
  ];

  const guestById = new Map(sampleGuests.map(g => [g.id, g]));

  const staticScenarios = [
    {
      id: 'single',
      title: 'Single guest stay',
      description: 'One guest is on the stay, so the UI always shows the individual chip.',
      total: 1,
      assigned: ['alex']
    },
    {
      id: 'both',
      title: 'Two guests assigned',
      description: 'Both guests are assigned, triggering the new “Both” pill.',
      total: 2,
      assigned: ['alex', 'blair']
    },
    {
      id: 'everyone',
      title: 'Three guests assigned',
      description: 'All guests are on the activity, so the “Everyone” pill renders.',
      total: 3,
      assigned: ['alex', 'blair', 'casey']
    },
    {
      id: 'partial',
      title: 'Partial assignment',
      description: 'Only some guests are assigned, so individual chips are rendered.',
      total: 4,
      assigned: ['alex', 'devon']
    }
  ];

  const scenarioSteps = [
    {
      label: 'Step 1 · Single guest',
      description: 'Start with one guest assigned to the activity.',
      total: 1,
      assigned: ['alex']
    },
    {
      label: 'Step 2 · Both guests',
      description: 'Add a second guest to the stay and assign both guests.',
      total: 2,
      assigned: ['alex', 'blair']
    },
    {
      label: 'Step 3 · Everyone assigned',
      description: 'Add a third guest and assign all guests to the activity.',
      total: 3,
      assigned: ['alex', 'blair', 'casey']
    },
    {
      label: 'Step 4 · Partial again',
      description: 'Unassign one guest so the pill collapses back to individual chips.',
      total: 3,
      assigned: ['blair', 'casey']
    }
  ];

  const staticContainer = document.getElementById('demoStatic');
  const scenarioPreview = document.getElementById('demoScenarioPreview');
  const scenarioLabel = document.getElementById('demoScenarioLabel');
  const scenarioDescription = document.getElementById('demoScenarioDescription');
  const scenarioAria = document.getElementById('demoScenarioAria');
  const prevBtn = document.getElementById('demoPrev');
  const nextBtn = document.getElementById('demoNext');

  const renderPreview = (container, total, guestIds) => {
    container.innerHTML = '';
    const guests = guestIds.map(id => guestById.get(id)).filter(Boolean);
    const plan = getAssignmentChipRenderPlan({ totalGuestsInStay: total, assignedGuests: guests });

    if(container.__demoInlineCleanup){
      container.__demoInlineCleanup();
    }

    if(plan.type === AssignmentChipMode.GROUP_BOTH || plan.type === AssignmentChipMode.GROUP_EVERYONE){
      attachDemoInlineSwap(container, plan);
      return plan;
    }

    plan.guests.forEach(guest => container.appendChild(createDemoChip(guest)));
    return plan;
  };

  const createDemoChip = guest => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.style.borderColor = guest.color;
    chip.style.color = guest.color;
    chip.title = guest.name;
    chip.tabIndex = 0;

    const initial = document.createElement('span');
    initial.className = 'initial';
    initial.textContent = guest.name.charAt(0).toUpperCase();
    chip.appendChild(initial);

    const close = document.createElement('span');
    close.className = 'x';
    close.setAttribute('aria-hidden', 'true');
    close.textContent = '×';
    chip.appendChild(close);

    return chip;
  };

  const attachDemoInlineSwap = (container, plan) => {
    const HIDE_DELAY = 260;
    let expanded = false;
    let hideTimer = null;

    const cleanupFns = [];
    const register = (target, type, handler, opts) => {
      if(!target) return;
      target.addEventListener(type, handler, opts);
      cleanupFns.push(() => target.removeEventListener(type, handler, opts));
    };

    const cancelHide = () => {
      if(hideTimer){
        clearTimeout(hideTimer);
        hideTimer = null;
      }
    };

    const collapse = (opts={}) => {
      cancelHide();
      renderPill(opts);
    };

    const scheduleHide = () => {
      // Demo mirrors production delay so the inline chips linger briefly after focus/hover exits.
      cancelHide();
      hideTimer = setTimeout(() => {
        if(!expanded) return;
        if(typeof document !== 'undefined' && container.contains(document.activeElement)){
          return;
        }
        collapse();
      }, HIDE_DELAY);
    };

    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'tag-everyone';
    pill.dataset.assignmentPill = plan.type;
    pill.setAttribute('aria-label', plan.pillAriaLabel || plan.pillLabel || 'Assigned guests');
    pill.setAttribute('aria-expanded', 'false');

    const label = document.createElement('span');
    label.textContent = plan.pillLabel || '';
    pill.appendChild(label);

    const focusFirstChip = () => {
      const first = container.querySelector('.chip');
      if(first && typeof first.focus === 'function'){
        first.focus();
      }
    };

    const renderChips = (opts={}) => {
      expanded = true;
      pill.setAttribute('aria-expanded', 'true');
      // Inline swap: trade the pill for the guest initials in-place.
      container.innerHTML = '';
      plan.guests.forEach(guest => container.appendChild(createDemoChip(guest)));
      if(opts.focusFirst){
        const focusTask = () => focusFirstChip();
        if(typeof requestAnimationFrame === 'function'){
          requestAnimationFrame(() => focusTask());
        }else{
          focusTask();
        }
      }
    };

    const renderPill = (opts={}) => {
      expanded = false;
      pill.setAttribute('aria-expanded', 'false');
      container.innerHTML = '';
      container.appendChild(pill);
      if(opts.focusPill && typeof pill.focus === 'function'){
        pill.focus();
      }
    };

    const expand = (opts={}) => {
      cancelHide();
      if(expanded) return;
      renderChips(opts);
    };

    register(container, 'pointerenter', cancelHide);
    register(container, 'pointerleave', () => {
      if(expanded){
        scheduleHide();
      }
    });
    register(container, 'focusin', cancelHide);
    register(container, 'focusout', () => {
      if(expanded){
        scheduleHide();
      }
    });
    register(container, 'keydown', event => {
      if(event.key === 'Escape' && expanded){
        event.preventDefault();
        collapse({ focusPill: true });
      }
    }, true);

    register(pill, 'pointerenter', () => expand());
    register(pill, 'focus', () => {
      const shouldFocus = !pill.matches(':hover');
      expand({ focusFirst: shouldFocus });
    });
    register(pill, 'keydown', event => {
      if(event.key === 'Enter' || event.key === ' '){
        event.preventDefault();
        expand({ focusFirst: true });
      }else if(event.key === 'Escape' && expanded){
        event.preventDefault();
        collapse({ focusPill: true });
      }
    });

    renderPill();

    container.__demoInlineCleanup = () => {
      cancelHide();
      cleanupFns.forEach(fn => fn());
      delete container.__demoInlineCleanup;
    };
  };

  staticScenarios.forEach(scenario => {
    const row = document.createElement('div');
    row.className = 'demo-row';

    const title = document.createElement('div');
    title.className = 'demo-row-title';
    title.textContent = scenario.title;
    row.appendChild(title);

    const preview = document.createElement('div');
    preview.className = 'demo-row-preview';
    preview.setAttribute('role', 'presentation');
    const plan = renderPreview(preview, scenario.total, scenario.assigned);
    row.appendChild(preview);

    const notes = document.createElement('div');
    notes.className = 'demo-row-notes';
    notes.textContent = scenario.description;
    if(plan.pillAriaLabel){
      const ariaLine = document.createElement('div');
      ariaLine.className = 'demo-row-aria';
      ariaLine.textContent = `Aria label: ${plan.pillAriaLabel}`;
      notes.appendChild(ariaLine);
    }
    row.appendChild(notes);

    staticContainer.appendChild(row);
  });

  let scenarioIndex = 0;

  const renderScenario = () => {
    const step = scenarioSteps[scenarioIndex];
    if(!step) return;

    scenarioLabel.textContent = step.label;
    scenarioDescription.textContent = step.description;
    const plan = renderPreview(scenarioPreview, step.total, step.assigned);
    scenarioAria.textContent = plan.pillAriaLabel ? `Aria label: ${plan.pillAriaLabel}` : 'Aria label: individual chips';
  };

  prevBtn.addEventListener('click', () => {
    scenarioIndex = (scenarioIndex - 1 + scenarioSteps.length) % scenarioSteps.length;
    renderScenario();
  });

  nextBtn.addEventListener('click', () => {
    scenarioIndex = (scenarioIndex + 1) % scenarioSteps.length;
    renderScenario();
  });

  renderScenario();
})();
