(function(global){
  'use strict';

  // Shared formatter keeps every surface aligned on the h:mmam/pm spec.
  const pad = value => String(Math.trunc(Math.abs(value))).padStart(2,'0');

  const upperMeridiem = value => {
    if(typeof value !== 'string') return null;
    const trimmed = value.trim().toUpperCase();
    return trimmed === 'AM' || trimmed === 'PM' ? trimmed : null;
  };

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

  const formatMeridiemTime = value => {
    const parts = extractTimeParts(value);
    if(!parts) return '';
    const minute = normalizeMinute(parts.minute);
    if(minute == null) return '';
    const meridiem = upperMeridiem(value?.meridiem) || (normalizeHour(parts.hour) ?? 0) >= 12 ? 'PM' : 'AM';
    let hour = Number(parts.hour);
    if(!Number.isFinite(hour)) return '';
    hour = Math.trunc(hour);
    if(meridiem === 'AM'){
      hour = ((hour % 12) + 12) % 12;
    }else{
      const normalized = ((hour % 12) + 12) % 12;
      hour = normalized === 0 ? 12 : normalized;
    }
    if(hour === 0){
      hour = 12;
    }
    if(hour < 0){
      hour = ((hour % 12) + 12) % 12 || 12;
    }
    return `${hour}:${pad(minute)} ${meridiem}`;
  };

  const parseFlexibleMeridiemTime = value => {
    if(value == null) return null;
    const compact = String(value).trim();
    if(!compact) return null;
    const normalised = compact.replace(/\s+/g, '').toLowerCase();
    if(normalised.length < 3) return null;
    const meridiem = normalised.slice(-2);
    if(meridiem !== 'am' && meridiem !== 'pm') return null;
    const body = normalised.slice(0, -2);
    if(!body) return null;
    let hour = null;
    let minute = 0;
    if(body.includes(':')){
      const parts = body.split(':');
      if(parts.length !== 2) return null;
      const [rawHour, rawMinute] = parts;
      if(!/^\d{1,2}$/.test(rawHour) || !/^\d{2}$/.test(rawMinute)) return null;
      hour = Number(rawHour);
      minute = Number(rawMinute);
    }else{
      if(!/^\d{1,4}$/.test(body)) return null;
      if(body.length <= 2){
        hour = Number(body);
      }else{
        const rawHour = body.slice(0, body.length - 2);
        const rawMinute = body.slice(-2);
        if(!/^\d{1,2}$/.test(rawHour) || !/^\d{2}$/.test(rawMinute)) return null;
        hour = Number(rawHour);
        minute = Number(rawMinute);
      }
    }
    if(!Number.isInteger(hour) || hour < 1 || hour > 12) return null;
    if(!Number.isInteger(minute) || minute < 0 || minute > 59) return null;
    return { hour, minute, meridiem: meridiem.toUpperCase() };
  };

  global.CHSFormatUtils = Object.assign({}, global.CHSFormatUtils, {
    formatTimeDisplay,
    formatMeridiemTime,
    parseFlexibleMeridiemTime
  });
})(typeof window !== 'undefined' ? window : globalThis);
