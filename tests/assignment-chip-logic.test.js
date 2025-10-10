const assert = require('assert');
const { AssignmentChipMode, getAssignmentChipRenderPlan } = require('../assignment-chip-logic');

const makeGuest = (id, name = `Guest ${id}`, color = '#6366f1') => ({ id, name, color });

const planType = ({ total, assigned }) => {
  const guests = assigned.map(makeGuest);
  return getAssignmentChipRenderPlan({ totalGuestsInStay: total, assignedGuests: guests });
};

(function runUnitTests(){
  const singlePlan = planType({ total: 1, assigned: ['g1'] });
  assert.strictEqual(singlePlan.type, AssignmentChipMode.INDIVIDUAL, 'Single guest stays should render the individual chip');
  assert.strictEqual(singlePlan.guests.length, 1, 'Single guest plan should expose the assigned guest');

  const bothPlan = planType({ total: 2, assigned: ['g1', 'g2'] });
  assert.strictEqual(bothPlan.type, AssignmentChipMode.GROUP_BOTH, 'Two guest stays should render the Both pill when both guests are assigned');
  assert.strictEqual(bothPlan.pillLabel, 'Both', 'Both plan should label the pill as "Both"');

  const everyonePlan = planType({ total: 3, assigned: ['g1', 'g2', 'g3'] });
  assert.strictEqual(everyonePlan.type, AssignmentChipMode.GROUP_EVERYONE, 'Three or more guest stays should render Everyone when all are assigned');
  assert.strictEqual(everyonePlan.pillLabel, 'Everyone', 'Everyone plan should label the pill as "Everyone"');

  const partialPlan = planType({ total: 3, assigned: ['g1', 'g2'] });
  assert.strictEqual(partialPlan.type, AssignmentChipMode.INDIVIDUAL, 'Partial assignments should return to individual chips');
  assert.strictEqual(partialPlan.guests.length, 2, 'Partial plan should only expose assigned guests');
})();

(function runIntegrationScenario(){
  const guests = [makeGuest('g1', 'Alex'), makeGuest('g2', 'Blair'), makeGuest('g3', 'Casey')];

  let plan = getAssignmentChipRenderPlan({ totalGuestsInStay: 1, assignedGuests: guests.slice(0, 1) });
  assert.strictEqual(plan.type, AssignmentChipMode.INDIVIDUAL, 'Scenario step 1 should render a single chip');

  plan = getAssignmentChipRenderPlan({ totalGuestsInStay: 2, assignedGuests: guests.slice(0, 2) });
  assert.strictEqual(plan.type, AssignmentChipMode.GROUP_BOTH, 'Scenario step 2 should upgrade to the Both pill');
  assert.strictEqual(plan.pillAriaLabel, 'Both: 2 guests', 'Both pill should announce both guests with the correct count');

  plan = getAssignmentChipRenderPlan({ totalGuestsInStay: 3, assignedGuests: guests.slice(0, 3) });
  assert.strictEqual(plan.type, AssignmentChipMode.GROUP_EVERYONE, 'Scenario step 3 should upgrade to the Everyone pill');
  assert.strictEqual(plan.pillAriaLabel, 'Everyone: 3 guests', 'Everyone pill should announce the guest count');

  plan = getAssignmentChipRenderPlan({ totalGuestsInStay: 3, assignedGuests: guests.slice(1, 3) });
  assert.strictEqual(plan.type, AssignmentChipMode.INDIVIDUAL, 'Unassigning any guest should drop back to individual chips');
  assert.strictEqual(plan.guests.length, 2, 'Remaining chips should reflect currently assigned guests only');
})();

console.log('Assignment chip logic tests passed.');
