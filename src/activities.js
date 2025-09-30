export function mountActivities(ctx, renderAll){
  const {
    state, el, fmtDateKey, weekdayName, monthName, ordinal,
    hmToAmPm, ensureDayList, keyFor, programForDate
  } = ctx;

  const list  = el.activities;
  const title = el.dayTitle;
  let expandedEveryoneTag = null;

  function collapseExpanded(){
    if (expandedEveryoneTag){
      expandedEveryoneTag.textContent = 'Everyone';
      expandedEveryoneTag._expanded = false;
      expandedEveryoneTag = null;
    }
  }

  // Close expanded “Everyone” on outside click/tap
  document.addEventListener('pointerdown', (e) => {
    if (expandedEveryoneTag && !expandedEveryoneTag.contains(e.target)) {
      collapseExpanded();
    }
  }, { capture: true });

  function renderActivities(){
    const d = state.focus;
    title.textContent = `${weekdayName(d)}, ${monthName(d.getFullYear(), d.getMonth())} ${ordinal(d.getDate())}`;

    const base = programForDate(d);
    const key  = fmtDateKey(d);
    const added = (state.itemsByDate.get(key) || []);
    const addedMap = new Map(added.map(it => [keyFor(it), it]));

    list.innerHTML = '';

    function renderRow(item){
      const existing = addedMap.get(keyFor(item));
      const merged = existing ? existing : { ...item, type: 'activity' };

      const row  = document.createElement('div');
      row.className = 'item';

      const left = document.createElement('div');
      const t    = document.createElement('div');
      t.className = 'title';
      t.textContent = merged.title;

      const time = document.createElement('div');
      time.className = 'time';
      time.textContent = merged.end
        ? `${hmToAmPm(merged.start)} - ${hmToAmPm(merged.end)}`
        : hmToAmPm(merged.start);

      // Guest chips
      if (merged.guests && merged.guests.size){
        const names = Array.from(merged.guests);
        const everyone = state.guests.length > 0 && names.length === state.guests.length;

        if (everyone){
          const tag = document.createElement('span');
          tag.className = 'tag';
          tag.textContent = 'Everyone';
          tag.setAttribute('role','button');
          tag.tabIndex = 0;
          tag.title = 'Show guests';

          const open = () => {
            if (tag._expanded) return;
            tag._expanded = true;
            tag.textContent = '';
            names.forEach(n => {
              const chip = document.createElement('span');
              chip.className = 'initial';
              chip.textContent = (n[0] || '?').toUpperCase();
              const guestColor = (state.guests.find(g => g.name === n)?.color) || '#2a6bff';
              chip.style.color = guestColor;

              const removeOne = (e) => {
                e.preventDefault(); e.stopPropagation();
                const s = new Set(merged.guests);
                s.delete(n);
                merged.guests = s;
                if (s.size === 0){
                  const arr = state.itemsByDate.get(key) || [];
                  const idx = arr.indexOf(merged);
                  if (idx > -1) arr.splice(idx, 1);
                }
                collapseExpanded();
                renderAll();
              };
              chip.addEventListener('pointerdown', removeOne);
              chip.addEventListener('click', removeOne);
              tag.appendChild(chip);
            });
            expandedEveryoneTag = tag;
          };

          const close = () => {
            tag.textContent = 'Everyone';
            tag._expanded = false;
            if (expandedEveryoneTag === tag) expandedEveryoneTag = null;
          };

          tag.onmouseenter = () => {
            if ('ontouchstart' in window) return;
            open();
          };
          tag.onmouseleave = () => {
            if ('ontouchstart' in window) return;
            close();
          };
          tag.addEventListener('pointerdown', (e) => {
            e.preventDefault(); e.stopPropagation();
            if (tag._expanded) { close(); } else { collapseExpanded(); open(); }
          });

          t.appendChild(tag);
        } else {
          names.forEach(n => {
            const chip = document.createElement('span');
            chip.className = 'initial';
            chip.textContent = (n[0] || '?').toUpperCase();
            chip.title = n;
            const guestColor = (state.guests.find(g => g.name === n)?.color) || '#2a6bff';
            chip.style.color = guestColor;

            const removeOne = (e) => {
              e.preventDefault(); e.stopPropagation();
              const s = new Set(merged.guests);
              s.delete(n);
              merged.guests = s;
              if (s.size === 0){
                const arr = state.itemsByDate.get(key) || [];
                const idx = arr.indexOf(merged);
                if (idx > -1) arr.splice(idx, 1);
              }
              renderAll();
            };
            chip.addEventListener('pointerdown', removeOne);
            chip.addEventListener('click', removeOne);
            t.appendChild(chip);
          });
        }
      }

      left.append(t, time);

      const right = document.createElement('div');
      const add   = document.createElement('button');
      add.textContent = '+';
      add.title = 'Add for toggled guests';
      add.onclick = () => {
        const actives = state.guests.filter(g => g.active).map(g => g.name);
        if (actives.length === 0){
          alert('Toggle at least one guest first.');
          return;
        }
        ensureDayList(key);
        const arr = state.itemsByDate.get(key);
        const target = addedMap.get(keyFor(item)) || merged;
        const s = new Set(target.guests || []);
        actives.forEach(n => s.add(n));
        target.guests = s;
        if (!arr.includes(target)) arr.push(target);
        state.emailDirty = false;
        renderAll();
      };
      right.appendChild(add);

      row.append(left, right);
      list.appendChild(row);
    }

    // Render base activities first
    base.forEach(it => renderRow(it));
    // Then any added custom/spa/dinner not in base (keep chronological)
    added
      .filter(it => !base.some(b => keyFor(b) === keyFor(it)))
      .sort((a,b) => a.start.localeCompare(b.start))
      .forEach(it => renderRow(it));
  }

  // Day navigation
  const prev = document.getElementById('prevDay');
  const next = document.getElementById('nextDay');
  prev.onclick = () => {
    const nd = new Date(state.focus);
    nd.setDate(nd.getDate() - 1);
    state.focus = nd;
    state.monthView = null;
    renderAll();
  };
  next.onclick = () => {
    const nd = new Date(state.focus);
    nd.setDate(nd.getDate() + 1);
    state.focus = nd;
    state.monthView = null;
    renderAll();
  };

  return renderActivities;
}
