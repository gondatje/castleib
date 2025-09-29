📍 Wave 1 – Core Skeleton & Activity System Setup
🎯 Objective
Establish the foundational structure of the Itinerary Builder, with a fully functional daily activities list that loads instantly, renders cleanly, and responds dynamically to user interactions. This phase is about getting the “core brain” working perfectly before we add more advanced features in later waves.

📁 Project Scope – Wave 1 Must Deliver
1. 📊 Base Layout & Structure
Build responsive 3-file foundation (index.html, style.css, script.js).


Layout should include:


Header section with project title.


Left column: Calendar date picker.


Center column: Activity list (auto-populated).


Right column: Scheduled itinerary list (drag-and-drop enabled).


Design must be minimal, Apple-like, and optimized for mobile and desktop.



2. 📆 Date & Calendar Logic
Date selector defaults to today’s date.


Changing the date instantly refreshes the activity list with exact data for that day.


Calendar logic must support full season schedule data — no manual refreshes or reloads.



3. ⚡ Activities Column (Instant Loading)
Core requirement: Activities must load instantly with no “Loading…” state.


Pull every single activity title + time range for the selected date from a static data source (e.g., JSON or YAML).


Display them in a clean list with:


time range | activity title


No durations (e.g., 60m, 90m).


Support all seasonal schedule variations:


Correct activities per season.


Correct activities per day.


Correct activities per time slot.


Default behavior: Load all available activities for today immediately when the page loads.



4. ✅ Scheduling Logic (Basic)
Each activity should have a checkbox or add button.


When selected, the activity appears in the scheduled itinerary list (right column).


Scheduled activities must show:


time range | activity title


Removing an activity from the schedule list removes it from the itinerary.



5. 🕒 Time Picker (Polished & Functional)
Implement scroll-wheel style time pickers.


User can smoothly grab and scroll without glitches, jittering, or text selection.


Picker should:


Respect browser/device gestures.


Feel like a native iOS time selector.
