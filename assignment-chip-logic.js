(function(root){
  const AssignmentChipMode = Object.freeze({
    NONE: 'none',
    INDIVIDUAL: 'individual',
    GROUP_BOTH: 'group-both',
    GROUP_EVERYONE: 'group-everyone'
  });

  const DEFAULT_GROUP_HIDE_DELAY = 120;

  const logic = {};

  const pluralizeGuests = count => `${count} guest${count === 1 ? '' : 's'}`;

  const getGroupLabels = (mode, guestCount) => {
    switch(mode){
      case AssignmentChipMode.GROUP_BOTH:
        return { label: 'Both', ariaLabel: `Both: ${pluralizeGuests(guestCount)}` };
      case AssignmentChipMode.GROUP_EVERYONE:
        return { label: 'Everyone', ariaLabel: `Everyone: ${pluralizeGuests(guestCount)}` };
      default:
        return { label: '', ariaLabel: '' };
    }
  };

  // Core rule matrix: convert the stay/assignment counts into a render plan that the UI can apply
  // without additional conditional logic sprinkled throughout the DOM code.
  const getAssignmentChipRenderPlan = ({ totalGuestsInStay, assignedGuests }) => {
    const total = Number.isFinite(totalGuestsInStay) ? totalGuestsInStay : Number(totalGuestsInStay) || 0;
    const safeAssigned = Array.isArray(assignedGuests) ? assignedGuests.filter(Boolean) : [];
    const assignedCount = safeAssigned.length;

    if(total <= 0 || assignedCount === 0){
      return { type: AssignmentChipMode.NONE, guests: [] };
    }

    if(total === 1){
      return { type: AssignmentChipMode.INDIVIDUAL, guests: safeAssigned.slice() };
    }

    if(total === 2 && assignedCount === 2){
      const labels = getGroupLabels(AssignmentChipMode.GROUP_BOTH, assignedCount);
      return {
        type: AssignmentChipMode.GROUP_BOTH,
        guests: safeAssigned.slice(),
        pillLabel: labels.label,
        pillAriaLabel: labels.ariaLabel
      };
    }

    if(total >= 3 && assignedCount === total){
      const labels = getGroupLabels(AssignmentChipMode.GROUP_EVERYONE, assignedCount);
      return {
        type: AssignmentChipMode.GROUP_EVERYONE,
        guests: safeAssigned.slice(),
        pillLabel: labels.label,
        pillAriaLabel: labels.ariaLabel
      };
    }

    return { type: AssignmentChipMode.INDIVIDUAL, guests: safeAssigned.slice() };
  };

  // Wire up the hover/focus behaviour for the group pill so Both/Everyone match the legacy
  // "Everyone" interactions and stay keyboard-accessible.
  const attachGroupPillInteractions = pill => {
    if(!pill) return { open: () => {}, close: () => {} };
    const popover = pill.querySelector('.popover');
    let hideTimer = null;

    const open = () => {
      if(hideTimer){
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      pill.classList.add('open');
      pill.setAttribute('aria-expanded', 'true');
    };

    const close = () => {
      if(hideTimer){
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      pill.classList.remove('open');
      pill.setAttribute('aria-expanded', 'false');
    };

    const scheduleClose = () => {
      if(hideTimer){
        clearTimeout(hideTimer);
      }
      hideTimer = setTimeout(() => {
        close();
      }, DEFAULT_GROUP_HIDE_DELAY);
    };

    pill.addEventListener('pointerenter', open);
    pill.addEventListener('pointerleave', scheduleClose);

    if(popover){
      popover.addEventListener('pointerenter', open);
      popover.addEventListener('pointerleave', scheduleClose);
    }

    pill.addEventListener('click', event => {
      event.preventDefault();
      if(pill.classList.contains('open')){
        close();
      }else{
        open();
      }
    });

    pill.addEventListener('focusin', open);
    pill.addEventListener('focusout', () => {
      setTimeout(() => {
        if(typeof document !== 'undefined' && !pill.contains(document.activeElement)){
          close();
        }
      }, 0);
    });

    pill.addEventListener('keydown', event => {
      if(event.key === 'Escape'){
        event.preventDefault();
        close();
        if(typeof pill.blur === 'function'){
          pill.blur();
        }
      }
    });

    return { open, close };
  };

  logic.AssignmentChipMode = AssignmentChipMode;
  logic.getAssignmentChipRenderPlan = getAssignmentChipRenderPlan;
  logic.attachGroupPillInteractions = attachGroupPillInteractions;

  root.AssignmentChipLogic = logic;

  if(typeof module !== 'undefined' && module.exports){
    module.exports = logic;
  }
})(typeof window !== 'undefined' ? window : globalThis);
