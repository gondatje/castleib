(function(){
  'use strict';

  const kit = window.TimePickerKit || {};
  const { createTimePicker } = kit;
  if(typeof createTimePicker !== 'function'){
    console.error('TimePickerKit missing. Load time-picker.js before time-picker-demo.js.');
    return;
  }

  const pad = n => String(n).padStart(2, '0');
  const formatValue = ({ hour, minute, meridiem }) => `${hour}:${pad(minute)} ${meridiem}`;

  const dinnerRules = {
    5: new Set([0, 15]),
    6: new Set([45]),
    7: new Set(),
    8: new Set([15, 30, 45])
  };

  const scenarios = [
    {
      id: 'dinner',
      title: 'Dinner',
      description: 'PM-only wheel with 15 minute steps and Harvest blocking rules.',
      defaults: [
        { label: 'Default 7:00', value: { hour: 7, minute: 0, meridiem: 'PM' } },
        { label: 'Default 8:00', value: { hour: 8, minute: 0, meridiem: 'PM' } },
        { label: 'Default 6:30', value: { hour: 6, minute: 30, meridiem: 'PM' } },
        { label: 'Default 5:30', value: { hour: 5, minute: 30, meridiem: 'PM' } }
      ],
      buildConfig(defaultValue, updateValue){
        return {
          hourRange: [5, 8],
          minuteStep: 15,
          showAmPm: false,
          fixedMeridiem: 'PM',
          staticMeridiemLabel: 'pm',
          defaultValue,
          isMinuteDisabled: ({ hour, minute }) => (dinnerRules[hour] || new Set()).has(minute),
          ariaLabels: {
            hours: 'Dinner hour',
            minutes: 'Dinner minutes'
          },
          onChange: updateValue
        };
      }
    },
    {
      id: 'spa',
      title: 'Spa',
      description: '12-hour wheel, visible AM/PM, five minute granularity.',
      defaults: [
        { label: 'Default 7:00 AM', value: { hour: 7, minute: 0, meridiem: 'AM' } },
        { label: 'Default 9:05 AM', value: { hour: 9, minute: 5, meridiem: 'AM' } },
        { label: 'Default 2:35 PM', value: { hour: 2, minute: 35, meridiem: 'PM' } }
      ],
      buildConfig(defaultValue, updateValue){
        return {
          hourRange: [1, 12],
          minuteStep: 5,
          showAmPm: true,
          defaultValue,
          ariaLabels: {
            hours: 'Spa hour',
            minutes: 'Spa minutes',
            meridiem: 'AM or PM'
          },
          onChange: updateValue
        };
      }
    },
    {
      id: 'eta',
      title: 'ETA / ETD',
      description: 'Shared picker with Start/End buttons for arrivals and departures.',
      showHelpers: true,
      defaults: [
        { label: 'Default 7:00 AM', value: { hour: 7, minute: 0, meridiem: 'AM' } },
        { label: 'Default 8:45 AM', value: { hour: 8, minute: 45, meridiem: 'AM' } },
        { label: 'Default 6:15 PM', value: { hour: 6, minute: 15, meridiem: 'PM' } }
      ],
      buildConfig(defaultValue, updateValue, helpers){
        return {
          hourRange: [1, 12],
          minuteStep: 15,
          showAmPm: true,
          defaultValue,
          ariaLabels: {
            hours: 'Travel hour',
            minutes: 'Travel minutes',
            meridiem: 'AM or PM'
          },
          onChange: updateValue,
          startEnd: {
            onSetStart(value){ helpers.updateStart(value); },
            onSetEnd(value){ helpers.updateEnd(value); }
          }
        };
      }
    }
  ];

  const grid = document.querySelector('[data-time-picker-grid]');
  if(!grid) return;

  const createButton = label => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'time-picker-demo-btn';
    button.textContent = label;
    return button;
  };

  scenarios.forEach(scenario => {
    const card = document.createElement('article');
    card.className = 'time-picker-demo-card';
    card.setAttribute('data-scenario', scenario.id);

    const heading = document.createElement('h3');
    heading.textContent = scenario.title;
    card.appendChild(heading);

    const description = document.createElement('p');
    description.className = 'time-picker-demo-copy';
    description.textContent = scenario.description;
    card.appendChild(description);

    const controls = document.createElement('div');
    controls.className = 'time-picker-demo-controls';
    card.appendChild(controls);

    const preview = document.createElement('div');
    preview.className = 'time-picker-demo-preview';
    card.appendChild(preview);

    const valueLabel = document.createElement('div');
    valueLabel.className = 'time-picker-demo-value';
    preview.appendChild(valueLabel);

    const helpersLabel = document.createElement('div');
    helpersLabel.className = 'time-picker-demo-helpers';
    preview.appendChild(helpersLabel);
    if(!scenario.showHelpers){
      helpersLabel.style.display = 'none';
    }

    const host = document.createElement('div');
    host.className = 'time-picker-demo-host';
    card.appendChild(host);

    let currentPicker = null;
    let startValue = null;
    let endValue = null;

    const updateValue = value => {
      valueLabel.textContent = `Selected: ${formatValue(value)}`;
    };

    const helpers = {
      updateStart(value){
        startValue = value;
        renderHelpers();
      },
      updateEnd(value){
        endValue = value;
        renderHelpers();
      }
    };

    const renderHelpers = () => {
      if(!scenario.showHelpers){
        helpersLabel.textContent = '';
        return;
      }
      const startText = startValue ? formatValue(startValue) : '—';
      const endText = endValue ? formatValue(endValue) : '—';
      helpersLabel.textContent = `Start: ${startText} · End: ${endText}`;
    };

    const rebuild = defaultValue => {
      if(currentPicker){
        currentPicker.dispose();
        host.innerHTML = '';
      }
      const config = scenario.buildConfig(defaultValue, updateValue, helpers);
      currentPicker = createTimePicker(config);
      host.appendChild(currentPicker.element);
      updateValue(currentPicker.getValue());
      renderHelpers();
      requestAnimationFrame(() => currentPicker.focus());
    };

    scenario.defaults.forEach(def => {
      const button = createButton(def.label);
      button.addEventListener('click', () => {
        startValue = null;
        endValue = null;
        rebuild(def.value);
      });
      controls.appendChild(button);
    });

    grid.appendChild(card);
    rebuild(scenario.defaults[0].value);
  });
})();
