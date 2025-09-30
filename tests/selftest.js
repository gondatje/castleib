export function runSelfTests(ctx, renderAll){
function assert(cond, msg){ if(!cond){ console.error('[TEST FAIL]', msg); throw new Error(msg) } }
console.log('[TEST] start');


const { state } = ctx;
const addBtn = document.getElementById('addGuest');
const name = document.getElementById('guestName');
name.value='Test A'; addBtn.click(); name.value='Test B'; addBtn.click();
assert(state.guests.length===2, 'should have 2 guests');
ctx.renderGuests();
const firstX=document.querySelector('.chip .x'); if(firstX) firstX.click();
assert(state.guests.length===1 && state.guests[0].name==='Test B','pill delete should remove without confirm');


const oldFocus=new Date(state.focus);
state.focus=new Date(2025,8,1); document.getElementById('btnArrival').click();
state.focus=new Date(2025,7,31);
document.getElementById('btnDeparture').click();
assert(!state.departure || state.departure>=state.arrival,'dep cannot be before arrival');
state.focus=oldFocus;


renderAll();
const before=(state.itemsByDate.get(ctx.fmtDateKey(state.focus))||[]).length;
if(state.guests.length===0){ name.value='X'; addBtn.click(); }
state.guests[0].active=true; ctx.renderActivities();
const firstAdd=document.querySelector('#activities .item button'); if(firstAdd) firstAdd.click();
const after=(state.itemsByDate.get(ctx.fmtDateKey(state.focus))||[]).length;
assert(after>=before,'adding activity increased or created entry');


document.getElementById('clearAll').click();
assert(state.guests.length===0 && state.itemsByDate.size===0 && !state.arrival && !state.departure, 'clearAll should wipe all state');


console.log('[TEST] ok');
}