(function(global){
  'use strict';

  // Shared formatter keeps every surface aligned on the h:mmam/pm spec.
  const pad = value => String(Math.trunc(Math.abs(value))).padStart(2,'0');

  const normalizeHour = value => {
    if(!Number.isFinite(value)) return null;
    return ((Math.trunc(value) % 24) + 24) % 24;
  };

  const normalizeMinute = value => {
    if(!Number.isFinite(value)) return null;
    return ((Math.trunc(value) % 60) + 60) % 60;
  };

  const parseFromObject = value => {
    const rawHour = value.hour ?? value.hours ?? value.h;
    const rawMinute = value.minute ?? value.minutes ?? value.m;
    if(rawHour == null) return null;
    const hour = Number(rawHour);
    const minute = Number(rawMinute ?? 0);
    if(!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    if(typeof value.meridiem === 'string'){
      const mer = value.meridiem.trim().toLowerCase();
      let hour12 = Math.trunc(hour) % 12;
      if(hour12 < 0) hour12 += 12;
      if(mer === 'pm'){
        return { hour: hour12 + 12, minute };
      }
      return { hour: hour12 % 12, minute };
    }
    return { hour, minute };
  };

  const parseFromString = value => {
    const str = String(value || '').trim();
    if(!str) return null;
    const strict = str.match(/^(\d{1,2}):(\d{2})$/);
    if(strict){
      const hour = Number(strict[1]);
      const minute = Number(strict[2]);
      if(Number.isFinite(hour) && Number.isFinite(minute)){
        return { hour, minute };
      }
      return null;
    }
    const loose = str.match(/^(\d{1,2})(?::?(\d{2}))?\s*(am|pm)?$/i);
    if(!loose) return null;
    let hour = Number(loose[1]);
    const minute = Number(loose[2] ?? 0);
    if(!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    const mer = loose[3] ? loose[3].toLowerCase() : null;
    if(mer){
      hour = ((Math.trunc(hour) % 12) + 12) % 12;
      if(mer === 'pm'){
        hour += 12;
      }
    }
    return { hour, minute };
  };

  const extractTimeParts = value => {
    if(value == null) return null;
    if(value instanceof Date){
      return { hour: value.getHours(), minute: value.getMinutes() };
    }
    if(typeof value === 'object'){
      const fromObject = parseFromObject(value);
      if(fromObject) return fromObject;
    }
    return parseFromString(value);
  };

  const formatTimeDisplay = value => {
    const parts = extractTimeParts(value);
    if(!parts) return '';
    const hour = normalizeHour(parts.hour);
    const minute = normalizeMinute(parts.minute);
    if(hour == null || minute == null) return '';
    const meridiem = hour >= 12 ? 'pm' : 'am';
    let displayHour = hour % 12;
    if(displayHour === 0) displayHour = 12;
    return `${displayHour}:${pad(minute)}${meridiem}`;
  };

  global.CHSFormatUtils = Object.assign({}, global.CHSFormatUtils, {
    formatTimeDisplay
  });
})(typeof window !== 'undefined' ? window : globalThis);
