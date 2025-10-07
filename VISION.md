Product

Castle Hot Springs Itinerary Builder — a responsive tool for PA Coordinators to assemble a guest’s stay, validate soft conflicts, and generate a beautiful email you can copy with one button. No exports, no printing—just Copy.

North Stars

Apple-polished visuals, calm motion, zero jank.

Instant feedback: focusing a day immediately shows that day’s activities.

One unified time-picker style across the app (configurable per use).

Data is pluggable (swap JSON, no code changes).

Personas

Coordinator: fast, accurate planning, guardrails not roadblocks.

Guest (indirect): clear, elegant email; no internal indicators.

Layout (baseline)

Desktop: 3 columns → Calendar | Activities | Preview (Preview scrollable; page itself stable).

iPad: Calendar + Activities fill the viewport on load; Preview spans full width below (below the fold). No overlapping, no header/content detaching.

iPhone: Adapted stack/tabs. Same rules, no horizontal scroll.

Core Modules
1) Calendar & Stay Controls

Focus defaults to today.

Month/year nav (title centered; prev/next pinned).

Arrival and Departure buttons assign to the current focus day.

ETA/ETD chips near those controls (editable via unified time picker).

Defaults: ETA 12:00pm, ETD 1:00pm.

For now these are visual notes only (used later for overlap logic).

Today button jumps to today.

Visual stay span (Arrival→Departure) on the grid.

Day-of-week headers: S M T W T F S.

2) Activities Pane (filtered by Focus Day & Season)

Renders instantly when focus changes.

Row format is strict:
Time range (top, left-aligned) over Title (bottom, left-aligned).
Hairline separators; fixed row height (rows never resize).

Entire row is clickable to assign; hover/press states are subtle.

Guest chips sit near the time/title cluster (left), vertically centered;
Dinner/Spa/Custom chips live hard-right, vertically centered.

No cards; hairline separators only.

Quick-add buttons

Dinner: unified time picker; hours allowed 5–8 only, 15-min steps; 6:45 excluded;
extra rules:

hour 8 ⇒ minutes :00 only

hour 6 ⇒ :45 disabled

hour 5 ⇒ :00 and :15 disabled
Default dinner time 7:00pm. Dinner has start only (no end).

Spa: choose Service → allowed Durations (per service) → Start time → auto End; Therapist Pref (Male/Female/No Pref); Location (Same/Separate/In-Room; honor availability); start must be 8:00am–7:00pm.

Custom: title (free or pick from known); start required (unified time picker); end optional; optional location (from known locations).

Edit/Delete

Pencil opens modal to edit; only inside that modal a Delete appears.

Editing a dinner/spa/custom reopens the same unified picker style.

3) Guests & Assignment

Add guests as colored pills; first added = primary. Delete asks confirm; next becomes primary.

Toggling one or more guest pills defines assignment targets.

Clicking an activity toggles chips for currently toggled guests.

Tag display rules (activity rows & email):

If all guests are assigned → no tags (given).

If subset → show names/initials.

One guest total in stay → no “Everyone” pill; show their chip only.

Two guests doing same thing → show Both pill.

3+ → Everyone pill; on hover fan-out into individual chips.

Merging spa rows: if two or more spa entries are identical in every field except name, merge into one row and join names with pipes:
… | Brittany | Megan | Steph
(still show Both/Everyone pills when appropriate).

4) Email Preview & Copy

Hello {PrimaryGuestName}, then fixed intro text (configurable).

Current Itinerary — bold, underlined, slightly larger.

Day header: Monday, September 29th (bold; same size as “Current Itinerary”).

Items under each day: • 9:00–10:00 Tai Chi; subset guests append — Brittany, Megan.

Arrival/Departure days include editable check-in/checkout lines.

No internal indicators (overlap, location, alcohol, lunch) in the email.

Copy copies email content only.

Preview edits are sticky/locked until you explicitly change them (don’t reset on day nav).

5) Indicators (soft, non-blocking; Activities pane only)

Overlap per guest (with “Override for this guest” affordance).

≤15 min gap & different locations note.

Alcohol → Spa < 60 min warning.

No 60-min lunch window (11a–2p) warning.

6) SPA Modal (key UX)

Opens scrolled to top (never to bottom).

AM/PM is a toggle (not infinite scroll); indicates the actually selected side.

Guest pills inside modal mirror colors/shape of main pills; checkmark appears inside pill on hover/focus like the main X, used to confirm per-guest variations.

If only one guest is in modal → header reads Guest; pill is a static nametag (no confirmation needed).

If you submit without confirming any guest → apply to all selected guests.

Confirming any guest locks that guest’s variant; all in-modal guests must be confirmed before submit if they differ.

When editing a merged row, modal shows all guests on that row, regardless of who was toggled later.

Sections and grid layout:

Left half: Service card fills full left side; expands inside its box; internal scroll; hairline list with 3-level accordion: Categories (Massages, Treatments, Therapies, Intentional Wellness Sessions) → Subcats (e.g., Facials, Full Body) → Services.

Right half: 2×4 grid with equal box sizing & stable height:
Top-left: Therapist Preference → below: Location → below: Guests (two boxes tall).
Right column: Start Time (three-quarters of column), bottom quarter: Duration (buttons labelled 60 / 90 / 120; output still “60-Minute”…).

“In-Room unavailable” banner removed (the disabled option is enough; no modal resizing).

Modal height is fixed to viewport (with safe margins), never reflows when lists expand.

Bottom-right floating “+” Add button; scrollbars auto-hide when idle.

Time Pickers (unified style & physics)

One component, style-consistent; configurable per use (e.g., dinner vs spa).

Dinner: hours 5–8, 15-min steps, special minute blocks as above; no AM/PM switch.

ETA/ETD: all hours, every 5 minutes, AM/PM toggle.

Spa: start 8:00am–7:00pm; AM/PM toggle; duration drives end time.

Physics: loose at first, smooth wheel/trackpad, then snap after a short idle; one axis at a time; speed clamp; bounce/resist on blocked values (no teleport).

Keyboard: Up/Down scroll current column; Left/Right moves between columns; Enter confirms when appropriate.

First frame is truthful (no greyed :00 at 7:00).

Data & Extensibility

/data/*.json: seasons, locations, activities, spa_services.

You can replace JSON to update content; no logic edits required.

Optional parsing scripts in /tools turn PDFs/images into those JSONs.

Defaults

Arrival 12:00pm; Departure 1:00pm.

Dinner default 7:00pm.

Date format: “Friday, October 10th”.

Accessibility & Performance

Semantic buttons, ARIA labels, trap focus in modals, ≥44px targets.

prefers-reduced-motion respected.

60fps target; transforms/opacity for motion.

Light/dark via tokens; hairline separators; no layout thrash.

Non-Goals (now)

No printing/exporting.

No pricing in the Activities pane.

No hard blocking from indicators (soft guidance only).


