export async function initState(){
const saved=localStorage.getItem('chs-theme');
if(saved==='dark') document.body.classList.add('theme-dark');
setThemeIcon();


// Theme toggle
document.getElementById('themeToggle').addEventListener('click',()=>{
document.body.classList.toggle('theme-dark');
localStorage.setItem('chs-theme', document.body.classList.contains('theme-dark') ? 'dark':'light');
setThemeIcon();
});


function setThemeIcon(){
const use = document.getElementById('themeUse');
const isDark = document.body.classList.contains('theme-dark');
use.setAttribute('href', isDark ? './assets/icons.svg#icon-sun' : './assets/icons.svg#icon-moon');
}


// helpers
const pad = n => String(n).padStart(2,'0');
const fmtDateKey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const fromDateKey = k => { const [y,m,d]=k.split('-').map(Number); return new Date(y,m-1,d) };
const weekdayName = d => d.toLocaleDateString(undefined,{weekday:'long'});
const monthName = (y,m) => new Date(y,m,1).toLocaleString(undefined,{month:'long'});
const ordinal=(n)=>{const s=["th","st","nd","rd"],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0])};
const hmToAmPm=(hm)=>{let [h,m]=hm.split(':').map(Number);const am=h<12;h=((h+11)%12)+1;return `${h}:${pad(m)}${am?'am':'pm'}`};
const ensureDayList=(key)=>{ if(!state.itemsByDate.has(key)) state.itemsByDate.set(key,[]) };
const keyFor = it => `${it.start}|${it.end||''}|${it.title}`;
const programForDate = (d)=> (state.program[weekdayName(d)]||[]).map(x=>({...x}));


return { state, el, pad, fmtDateKey, fromDateKey, weekdayName, monthName, ordinal, hmToAmPm, ensureDayList, keyFor, programForDate };
}


function defaultProgram(){
return {
"Sunday":[{"start":"09:30","end":"10:15","title":"Nature Walk"}],
"Monday":[
{"start":"06:45","end":"08:15","title":"Overlook Hike"},
{"start":"07:00","end":"09:15","title":"Scenic Desert E-Bike Ride"},
{"start":"07:00","end":"10:00","title":"Castle Peak Via Ferrata Climb"},
{"start":"07:00","end":"10:00","title":"Crater Canyon Exploration"},
{"start":"08:30","end":"09:25","title":"Rise & Shine Flow Yoga"},
{"start":"09:00","end":"10:15","title":"E-Biking 101: Intro to E-Bike Tour"},
{"start":"09:30","end":"10:15","title":"Landscape Restoration and Development Tour"},
{"start":"09:40","end":"10:00","title":"Meditation"},
{"start":"10:00","end":"10:45","title":"Guided Archery"},
{"start":"10:15","end":"11:00","title":"Intro to Tai Chi"},
{"start":"10:30","end":"11:30","title":"Farm Tour"},
{"start":"11:00","end":"11:45","title":"Axe Throwing"},
{"start":"11:00","end":"12:00","title":"Paddle Board Yoga"},
{"start":"12:30","end":"13:30","title":"Sound Bath"},
{"start":"14:00","end":"14:45","title":"Mindfulness Activity - Rock Mandalas"},
{"start":"14:00","end":"15:00","title":"Cooling Aroma Restorative Yoga"},
{"start":"15:00","end":"16:00","title":"Wine Tasting"},
{"start":"15:15","end":"16:10","title":"Yoga"},
{"start":"16:00","end":"16:45","title":"Castle Hot Springs Documentary Viewing"},
{"start":"16:00","end":"17:00","title":"Connecting With Water"},
{"start":"16:30","end":"17:00","title":"Yoga Nidra"}
],
"Tuesday":[{"start":"09:00","end":"12:00","title":"UTV Razor Tour"},{"start":"16:00","end":"17:00","title":"Farm Tour"}],
"Wednesday":[{"start":"10:15","end":"11:00","title":"Intro to Tai Chi"}],
"Thursday":[{"start":"11:30","end":"12:15","title":"Guided Archery"}],
"Friday":[{"start":"12:30","end":"13:30","title":"Sound Bath"}],
"Saturday":[{"start":"09:00","end":"10:00","title":"Morning Stretch"}]
};
}