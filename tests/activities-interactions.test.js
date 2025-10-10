const assert = require('assert');
const { attachRowPressInteractions, DEFAULT_THRESHOLD } = require('../activities-interactions');

class StubElement {
  constructor(){
    this.listeners = new Map();
    this.captured = new Set();
  }
  addEventListener(type, handler){
    if(!this.listeners.has(type)){
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(handler);
  }
  removeEventListener(type, handler){
    const list = this.listeners.get(type);
    if(!list) return;
    const idx = list.indexOf(handler);
    if(idx>-1){
      list.splice(idx,1);
    }
  }
  dispatch(type, event){
    const list = this.listeners.get(type) || [];
    list.slice().forEach(handler => handler(event));
  }
  setPointerCapture(id){
    this.captured.add(id);
  }
  releasePointerCapture(id){
    this.captured.delete(id);
  }
}

const makeEvent = (overrides = {}) => ({
  pointerId: 1,
  pointerType: 'touch',
  button: 0,
  clientX: 0,
  clientY: 0,
  target: { closest: () => null },
  ...overrides
});

(function activatesWithinThreshold(){
  const element = new StubElement();
  const changes = [];
  let activated = 0;
  attachRowPressInteractions(element, {
    onActivate: () => activated++,
    onPressChange: value => changes.push(value)
  });

  element.dispatch('pointerdown', makeEvent());
  element.dispatch('pointerup', makeEvent());

  assert.strictEqual(activated, 1, 'Row press should trigger activation when pointer does not move');
  assert.deepStrictEqual(changes, [true, false], 'Press state should emit true on down and false on release');
})();

(function suppressesWhenMovedBeyondThreshold(){
  const element = new StubElement();
  let activated = 0;
  attachRowPressInteractions(element, { onActivate: () => activated++ });

  element.dispatch('pointerdown', makeEvent());
  element.dispatch('pointermove', makeEvent({ clientX: DEFAULT_THRESHOLD + 1 }));
  element.dispatch('pointerup', makeEvent());

  assert.strictEqual(activated, 0, 'Movement beyond the threshold should cancel activation');
})();

(function respectsDisabledState(){
  const element = new StubElement();
  let activated = 0;
  let pressSignals = 0;
  attachRowPressInteractions(element, {
    onActivate: () => activated++,
    isDisabled: () => true,
    onPressChange: () => { pressSignals++; }
  });

  element.dispatch('pointerdown', makeEvent());
  element.dispatch('pointerup', makeEvent());

  assert.strictEqual(activated, 0, 'Disabled rows should never activate');
  assert.strictEqual(pressSignals, 0, 'Disabled rows should not emit pressed state changes');
})();

(function ignoresPressExemptTargets(){
  const element = new StubElement();
  let activated = 0;
  attachRowPressInteractions(element, { onActivate: () => activated++ });

  const exemptTarget = { closest: (selector) => selector === '[data-press-exempt="true"]' ? {} : null };

  element.dispatch('pointerdown', makeEvent({ target: exemptTarget }));
  element.dispatch('pointerup', makeEvent({ target: exemptTarget }));

  assert.strictEqual(activated, 0, 'Elements flagged as press exempt should block activation');
})();

(function detachesCleanly(){
  const element = new StubElement();
  let activated = 0;
  const controller = attachRowPressInteractions(element, { onActivate: () => activated++ });

  element.dispatch('pointerdown', makeEvent());
  controller.dispose();
  element.dispatch('pointerup', makeEvent());

  assert.strictEqual(activated, 0, 'Disposing the controller should remove listeners');
})();

console.log('Activities interaction tests passed.');
