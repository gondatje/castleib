const USE_INLINE_SAMPLE_DATA = true;

const INLINE_CATALOG_YAML = `catalog:
  scenic-desert-e-bike:
    title: Scenic Desert E-Bike Ride
    duration_min: 135
    location: Canyon Base
  morning-hike:
    title: Sunrise Mesa Hike
    duration_min: 120
  pottery-workshop:
    title: Artisan Pottery Workshop
    duration_min: 90
  stargazing-session:
    title: Night Sky Stargazing
    duration_min: 75
`;

const INLINE_SEASONS_YAML = `seasons:
  - name: Spring Adventure
    start: 2023-01-01
    end: 2025-12-31
    weekly:
      mon:
        - slug: scenic-desert-e-bike
          time: "07:00"
        - slug: pottery-workshop
          time: "14:30"
      tue:
        - slug: morning-hike
          time: "06:30"
      wed:
        - slug: pottery-workshop
          time: "10:00"
      thu: []
      fri:
        - slug: scenic-desert-e-bike
          time: "09:00"
      sat:
        - slug: stargazing-session
          time: "20:15"
      sun:
        - slug: morning-hike
          time: "08:30"
  - name: Summer Solstice
    start: 2024-06-01
    end: 2024-08-31
    weekly:
      mon:
        - slug: morning-hike
          time: "06:00"
      wed:
        - slug: scenic-desert-e-bike
          time: "07:30"
        - slug: pottery-workshop
          time: "13:45"
      fri:
        - slug: stargazing-session
          time: "21:00"
      sat:
        - slug: scenic-desert-e-bike
          time: "08:00"
        - slug: pottery-workshop
          time: "11:30"
      sun:
        - slug: morning-hike
          time: "07:15"
`;

const DataStore = {
  ready: false,
  activitiesCatalog: { catalog: {} },
  activitiesSeasons: { seasons: [] },
};

const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekdayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const state = {
  focusDate: startOfDay(new Date()),
  viewMonth: startOfMonth(new Date()),
};

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return startOfDay(result);
}

function addMonths(date, amount) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + amount);
  return startOfMonth(result);
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isoToDate(iso) {
  if (!iso) return new Date();
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function ordinalSuffix(value) {
  const remainder = value % 100;
  if (remainder >= 11 && remainder <= 13) return "th";
  switch (value % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function formatDayHeader(date) {
  const weekday = weekdayNames[date.getDay()];
  const monthName = monthNames[date.getMonth()];
  const dayNumber = date.getDate();
  return `${weekday}, ${monthName} ${dayNumber}<sup>${ordinalSuffix(dayNumber)}</sup>`;
}

function parseTimeToMinutes(time24) {
  const [hours, minutes] = time24.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTimeRangeString(startMinutes, endMinutes) {
  return `${formatMinutes(startMinutes)} – ${formatMinutes(endMinutes)}`;
}

function formatMinutes(totalMinutes) {
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? "pm" : "am";
  const hour12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hour12}:${minutes.toString().padStart(2, "0")}${period}`;
}

function formatMonthLabel(date) {
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function loadYamlData() {
  if (USE_INLINE_SAMPLE_DATA) {
    const catalog = jsyaml.load(INLINE_CATALOG_YAML);
    const seasons = jsyaml.load(INLINE_SEASONS_YAML);
    populateDataStore(catalog, seasons);
    return Promise.resolve();
  }

  const catalogPromise = fetch("data/activities.catalog.yml").then((response) => response.text());
  const seasonsPromise = fetch("data/activities.seasons.yml").then((response) => response.text());

  return Promise.all([catalogPromise, seasonsPromise])
    .then(([catalogText, seasonsText]) => {
      const catalog = jsyaml.load(catalogText);
      const seasons = jsyaml.load(seasonsText);
      populateDataStore(catalog, seasons);
    })
    .catch((error) => {
      console.error("Failed to load schedule data", error);
    });
}

function populateDataStore(catalogData, seasonsData) {
  DataStore.activitiesCatalog = {
    catalog: catalogData.catalog || {},
  };

  const enrichedSeasons = (seasonsData.seasons || []).map((season) => ({
    ...season,
    startDate: startOfDay(isoToDate(season.start)),
    endDate: startOfDay(isoToDate(season.end)),
  }));

  DataStore.activitiesSeasons = { seasons: enrichedSeasons };
  DataStore.ready = true;

  document.dispatchEvent(
    new CustomEvent("chs:data-ready", {
      detail: { dataStore: DataStore },
    }),
  );
}

function renderCalendar() {
  const grid = document.getElementById("calendar-grid");
  const monthLabel = document.getElementById("calendar-current-month");
  grid.innerHTML = "";

  weekdayNames.forEach((weekday) => {
    const header = document.createElement("div");
    header.className = "calendar-day-header";
    header.textContent = weekday.slice(0, 3);
    grid.appendChild(header);
  });

  monthLabel.textContent = formatMonthLabel(state.viewMonth);

  const firstVisibleDate = addDays(state.viewMonth, -state.viewMonth.getDay());
  let cursor = firstVisibleDate;
  const todayISO = toISODate(startOfDay(new Date()));
  const focusISO = toISODate(state.focusDate);

  for (let i = 0; i < 42; i += 1) {
    const dayButton = document.createElement("button");
    dayButton.type = "button";
    dayButton.className = "calendar-day";
    const dayNumber = cursor.getDate();
    dayButton.textContent = String(dayNumber);
    const cursorISO = toISODate(cursor);
    dayButton.dataset.iso = cursorISO;
    dayButton.setAttribute(
      "aria-label",
      `${weekdayNames[cursor.getDay()]}, ${monthNames[cursor.getMonth()]} ${dayNumber}`,
    );

    if (cursor.getMonth() !== state.viewMonth.getMonth()) {
      dayButton.classList.add("other-month");
    }

    if (cursorISO === todayISO) {
      dayButton.classList.add("today");
    }

    if (cursorISO === focusISO) {
      dayButton.classList.add("selected");
      dayButton.setAttribute("aria-pressed", "true");
    } else {
      dayButton.setAttribute("aria-pressed", "false");
    }

    dayButton.addEventListener("click", () => {
      const newFocus = startOfDay(isoToDate(dayButton.dataset.iso));
      state.focusDate = newFocus;
      state.viewMonth = startOfMonth(newFocus);
      updateFocusedDay();
      renderCalendar();
      renderActivitiesForDate(newFocus);
    });

    grid.appendChild(dayButton);
    cursor = addDays(cursor, 1);
  }
}

function getActiveSeasons(date) {
  if (!DataStore.ready) return [];
  const targetTime = startOfDay(date).getTime();
  return DataStore.activitiesSeasons.seasons.filter((season) => {
    return targetTime >= season.startDate.getTime() && targetTime <= season.endDate.getTime();
  });
}

function buildScheduleForDate(date) {
  if (!DataStore.ready) return [];
  const activeSeasons = getActiveSeasons(date);
  if (!activeSeasons.length) return [];

  const weekdayKey = weekdayKeys[date.getDay()];
  const schedule = [];
  activeSeasons.forEach((season) => {
    const entries = (season.weekly && season.weekly[weekdayKey]) || [];
    entries.forEach((entry) => {
      const catalogEntry = DataStore.activitiesCatalog.catalog[entry.slug];
      if (!catalogEntry) return;
      const startMinutes = parseTimeToMinutes(entry.time);
      const endMinutes = startMinutes + Number(catalogEntry.duration_min || 0);
      schedule.push({
        startMinutes,
        endMinutes,
        title: catalogEntry.title,
      });
    });
  });

  return schedule.sort((a, b) => a.startMinutes - b.startMinutes);
}

function renderActivitiesForDate(date) {
  const activitiesList = document.getElementById("activities-list");
  const previewList = document.getElementById("preview-list");
  const placeholder = document.getElementById("activities-placeholder");
  const previewPlaceholder = document.getElementById("preview-placeholder");

  if (!DataStore.ready) {
    activitiesList.hidden = true;
    placeholder.hidden = false;
    placeholder.textContent = "Activities will appear once data is ready.";
    if (previewPlaceholder) {
      previewPlaceholder.hidden = false;
      previewPlaceholder.textContent = "Itinerary updates once data is ready.";
    }
    previewList.hidden = true;
    previewList.innerHTML = "";
    return;
  }

  const schedule = buildScheduleForDate(date);
  activitiesList.innerHTML = "";
  previewList.innerHTML = "";

  if (!schedule.length) {
    placeholder.hidden = false;
    placeholder.textContent = "No scheduled activities for this day.";
    activitiesList.hidden = true;
    if (previewPlaceholder) {
      previewPlaceholder.hidden = false;
      previewPlaceholder.textContent = "No scheduled activities for this day.";
    }
    previewList.hidden = true;
    previewList.innerHTML = "";
    return;
  }

  placeholder.hidden = true;
  activitiesList.hidden = false;
  if (previewPlaceholder) {
    previewPlaceholder.hidden = true;
  }
  previewList.hidden = false;

  const fragmentActivities = document.createDocumentFragment();
  const fragmentPreview = document.createDocumentFragment();

  schedule.forEach((item) => {
    const line = `${minutesToTimeRangeString(item.startMinutes, item.endMinutes)} | ${item.title}`;

    const activityItem = document.createElement("li");
    activityItem.textContent = line;
    fragmentActivities.appendChild(activityItem);

    const previewItem = document.createElement("li");
    previewItem.textContent = line;
    fragmentPreview.appendChild(previewItem);
  });

  activitiesList.appendChild(fragmentActivities);
  previewList.appendChild(fragmentPreview);
}

function updateFocusedDay() {
  const dayHeader = document.getElementById("day-header");
  dayHeader.innerHTML = formatDayHeader(state.focusDate);
}

function attachCalendarControls() {
  const prevButton = document.getElementById("calendar-prev");
  const nextButton = document.getElementById("calendar-next");
  const todayButton = document.getElementById("calendar-today");

  prevButton.addEventListener("click", () => {
    state.viewMonth = addMonths(state.viewMonth, -1);
    renderCalendar();
  });

  nextButton.addEventListener("click", () => {
    state.viewMonth = addMonths(state.viewMonth, 1);
    renderCalendar();
  });

  todayButton.addEventListener("click", () => {
    state.focusDate = startOfDay(new Date());
    state.viewMonth = startOfMonth(state.focusDate);
    updateFocusedDay();
    renderCalendar();
    renderActivitiesForDate(state.focusDate);
  });
}

function createTimeWheelController({
  hourSelector,
  minuteSelector,
  periodSelector,
  hours,
  minutes,
  periods,
  defaultSelection,
}) {
  const hourColumn = typeof hourSelector === "string" ? document.querySelector(hourSelector) : hourSelector;
  const minuteColumn = typeof minuteSelector === "string" ? document.querySelector(minuteSelector) : minuteSelector;
  const periodColumn = typeof periodSelector === "string" ? document.querySelector(periodSelector) : periodSelector;

  if (!hourColumn || !minuteColumn || !periodColumn) {
    throw new Error("Time wheel columns not found");
  }

  const root = hourColumn.closest(".time-wheel");

  const columnDefinitions = [
    { column: hourColumn, values: hours.map(String), key: "hour" },
    { column: minuteColumn, values: minutes.map((value) => value.toString().padStart(2, "0")), key: "minute" },
    { column: periodColumn, values: periods.map((value) => value.toLowerCase()), key: "period" },
  ];

  columnDefinitions.forEach(({ column, values }) => {
    column.innerHTML = "";
    values.forEach((value) => {
      const option = document.createElement("div");
      option.className = "time-wheel-option";
      option.dataset.value = value;
      option.textContent = value;
      column.appendChild(option);
    });
  });

  const selectedIndexes = new Map();
  const scrollTimers = new Map();

  function normalizeValue(key, value) {
    switch (key) {
      case "minute":
        return String(value).padStart(2, "0");
      case "period":
        return String(value).toLowerCase();
      case "hour":
        return String(parseInt(value, 10) || value);
      default:
        return String(value);
    }
  }

  function highlightColumn(column, index) {
    const children = Array.from(column.children);
    children.forEach((child, childIndex) => {
      child.classList.toggle("selected", childIndex === index);
    });
  }

  function scrollToIndex(column, index) {
    const option = column.children[index];
    if (!option) return;
    const top = option.offsetTop;
    column.scrollTo({ top, behavior: "smooth" });
    highlightColumn(column, index);
  }

  function snapColumn(column, values) {
    if (scrollTimers.has(column)) {
      clearTimeout(scrollTimers.get(column));
      scrollTimers.delete(column);
    }
    const optionHeight = column.firstElementChild?.offsetHeight || 1;
    const index = Math.round(column.scrollTop / optionHeight);
    const clampedIndex = Math.max(0, Math.min(values.length - 1, index));
    column.scrollTo({ top: clampedIndex * optionHeight, behavior: "smooth" });
    highlightColumn(column, clampedIndex);
    selectedIndexes.set(column, clampedIndex);
    emitChange();
  }

  function scheduleSnap(column, values) {
    if (scrollTimers.has(column)) {
      clearTimeout(scrollTimers.get(column));
    }
    scrollTimers.set(
      column,
      setTimeout(() => {
        snapColumn(column, values);
      }, 80),
    );
  }

  function emitChange() {
    if (!root) return;
    const value = getValue();
    root.dispatchEvent(
      new CustomEvent("wheelchange", {
        detail: { value },
        bubbles: true,
      }),
    );
  }

  columnDefinitions.forEach(({ column, values }) => {
    const updateHighlight = () => {
      const optionHeight = column.firstElementChild?.offsetHeight || 1;
      const index = Math.round(column.scrollTop / optionHeight);
      highlightColumn(column, Math.max(0, Math.min(values.length - 1, index)));
    };
    const schedule = () => {
      requestAnimationFrame(updateHighlight);
      scheduleSnap(column, values);
    };
    column.addEventListener("scroll", schedule);
    column.addEventListener("wheel", schedule, { passive: true });
    column.addEventListener("touchmove", schedule, { passive: true });
    column.addEventListener("pointerup", () => snapColumn(column, values));
    column.addEventListener("touchend", () => snapColumn(column, values), { passive: true });
    column.addEventListener("blur", () => snapColumn(column, values));
  });

  function setValue(selection) {
    columnDefinitions.forEach(({ column, values, key }) => {
      const desired = normalizeValue(key, selection[key]);
      const targetIndex = Math.max(0, values.indexOf(desired));
      selectedIndexes.set(column, targetIndex);
      requestAnimationFrame(() => {
        const optionHeight = column.firstElementChild?.offsetHeight || 0;
        column.scrollTop = targetIndex * optionHeight;
        highlightColumn(column, targetIndex);
      });
    });
    emitChange();
  }

  function getValue() {
    const result = {};
    columnDefinitions.forEach(({ column, values, key }) => {
      const index = selectedIndexes.get(column) ?? 0;
      result[key] = values[Math.max(0, Math.min(values.length - 1, index))];
    });
    return result;
  }

  const normalizedDefault = {
    hour: String(defaultSelection?.hour ?? hours[0]),
    minute: String(defaultSelection?.minute ?? minutes[0]).padStart(2, "0"),
    period: String(defaultSelection?.period ?? periods[0]).toLowerCase(),
  };

  requestAnimationFrame(() => {
    setValue(normalizedDefault);
  });

  window.addEventListener("resize", () => {
    columnDefinitions.forEach(({ column, values }) => {
      scheduleSnap(column, values);
    });
  });

  return {
    root,
    setValue,
    getValue,
  };
}

function setupTimeWheel() {
  const controller = createTimeWheelController({
    hourSelector: "#time-wheel-hours",
    minuteSelector: "#time-wheel-minutes",
    periodSelector: "#time-wheel-period",
    hours: Array.from({ length: 12 }, (_, index) => index + 1),
    minutes: [0, 15, 30, 45],
    periods: ["am", "pm"],
    defaultSelection: { hour: 9, minute: 0, period: "am" },
  });

  controller.root?.addEventListener("wheelchange", (event) => {
    const { value } = event.detail;
    controller.root.setAttribute("data-selected-time", `${value.hour}:${value.minute}${value.period}`);
  });
}

function initialize() {
  attachCalendarControls();
  updateFocusedDay();
  renderCalendar();
  setupTimeWheel();
  renderActivitiesForDate(state.focusDate);

  document.addEventListener("chs:data-ready", () => {
    renderActivitiesForDate(state.focusDate);
  });

  loadYamlData();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}
