You are: Codex working in this repo

Your job is to implement features exactly as defined in VISION.md, without inventing new patterns. When in doubt, prefer clarity, determinism, and small diffs.

Read-first order (every run)

VISION.md (this repo’s product spec)

/data/*.json (content contracts)

/docs if present (SPEC.md, RULES.md, etc.)

Unbreakable guardrails

Don’t change public props/events/contracts.

Don’t introduce frameworks; keep it dependency-light.

Preserve established UX: hairline lists, chip logic, unified time pickers, iPad layout (Preview full-width below), fixed row heights.

Two required PR deliverables on every task:

Code comments explaining non-obvious choices.

One preview screenshot (full-screen desktop) attached to the PR.
(Working demo route/story is welcome but optional unless task asks.)

House rules

Style: Apple-calm. No card chrome in lists; use hairline separators and tokenized spacing/typography.

Time math lives in one utility; no ad-hoc parsing sprinkled around.

Avoid layout thrash—prefer transforms/opacity; gate expensive work behind rAF.

Accessibility is not optional.

Known invariants to enforce

Activities row layout is fixed height. Title stacked over Time. Guest chips (left cluster) + action chips (right) are vertically centered and never cause the row to resize.

Dinner picker hours 5–8; steps 15m; 6:45 excluded; 7:00 default; special minute disables as specified.

Spa modal grid + behavior as in VISION.md; starts at top; AM/PM toggle reflects actual state.

Merging spa rows: identical entries across guests always merge; names joined with pipes. Keep Both/Everyone pills logic.

Preview edits are sticky; don’t reset on day navigation.

iPad: top row fills viewport on load; Preview spans full width under both columns; header stays attached to its section.

Do / Don’t

Do

Add concise comments where logic isn’t obvious.

Include a full-screen desktop screenshot with each PR.

Add small tests/QA notes inside PRs when relevant.

Don’t

Don’t default to dark/light overrides that flip themes without tokens.

Don’t make lists/cards grow/shrink on interaction (no shifting heights).

Don’t change chip logic or picker physics without updating VISION.md.

PR checklist (tick before submit)

 Matches VISION.md behavior and visual rules.

 Activities rows remain fixed height; no jank on hover/press.

 Time picker first frame is correct (no phantom disabled states).

 iPad: Preview spans full width under both columns; no overlaps; header attached.

 Spa modal opens at top; grid fits; AM/PM toggle accurate; duration labels 60 / 90 / 120.

 Merged spa rows & tag rules correct (All guests → no tags; subset → tags/pipes).

 Accessibility: focus rings visible; ARIA labels sane.

 Code comments added where decisions are non-obvious.

 1 preview screenshot (full-screen desktop) attached.

Small task template (you can paste into PR)

Context: (feature or bug)
Approach: (what you changed, why)
Guardrails upheld: (row height, tokens, iPad preview, etc.)
Screenshots: (full-screen desktop; add iPad if relevant)
Notes: (risks, follow-ups)

