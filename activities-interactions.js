(function(globalFactory){
  const globalRef = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this);
  if(typeof module === 'object' && module.exports){
    module.exports = globalFactory();
  }else{
    globalRef.CHSActivitiesInteractions = globalFactory();
  }
})(function(){
  const DEFAULT_THRESHOLD = 6;

  function attachRowPressInteractions(element, options = {}){
    if(!element || typeof element.addEventListener !== 'function'){
      throw new Error('attachRowPressInteractions requires an element with addEventListener.');
    }

    const {
      onActivate = () => {},
      threshold = DEFAULT_THRESHOLD,
      isDisabled = () => false,
      onPressChange = () => {}
    } = options;

    let activePointerId = null;
    let origin = null;
    let pointerMoved = false;
    let pressed = false;

    const supportsClosest = target => !!(target && typeof target.closest === 'function');

    const setPressed = (next) => {
      if(pressed === next) return;
      pressed = next;
      try{
        onPressChange(Boolean(next));
      }catch(err){
        if(typeof console !== 'undefined' && console.error){
          console.error(err);
        }
      }
    };

    const clearPointerState = () => {
      if(activePointerId !== null && typeof element.releasePointerCapture === 'function'){
        try{ element.releasePointerCapture(activePointerId); }catch(_){}
      }
      activePointerId = null;
      origin = null;
      pointerMoved = false;
      setPressed(false);
    };

    const isPressExempt = (target) => {
      if(!target) return false;
      if(supportsClosest(target)){
        const match = target.closest('[data-press-exempt="true"]');
        if(match) return true;
      }
      return false;
    };

    const handlePointerDown = (event) => {
      if(isDisabled()) return;
      if(event.pointerType === 'mouse' && event.button !== 0) return;
      if(isPressExempt(event.target)) return;

      activePointerId = event.pointerId ?? 'mouse';
      origin = { x: Number(event.clientX) || 0, y: Number(event.clientY) || 0 };
      pointerMoved = false;
      setPressed(true);

      if(typeof element.setPointerCapture === 'function' && activePointerId !== null){
        try{ element.setPointerCapture(activePointerId); }catch(_){}
      }
    };

    const handlePointerMove = (event) => {
      if(activePointerId === null || event.pointerId !== activePointerId) return;
      if(!origin) return;
      const dx = (Number(event.clientX) || 0) - origin.x;
      const dy = (Number(event.clientY) || 0) - origin.y;
      const distance = Math.hypot(dx, dy);
      if(distance > threshold){
        pointerMoved = true;
        setPressed(false);
      }
    };

    const handlePointerUp = (event) => {
      if(activePointerId === null || event.pointerId !== activePointerId) return;
      const shouldActivate = !pointerMoved && !isDisabled() && !isPressExempt(event.target);
      clearPointerState();
      if(shouldActivate){
        onActivate(event);
      }
    };

    const handlePointerCancel = (event) => {
      if(activePointerId === null || event.pointerId !== activePointerId) return;
      clearPointerState();
    };

    const handlePointerLeave = (event) => {
      if(activePointerId === null || event.pointerId !== activePointerId) return;
      setPressed(false);
    };

    element.addEventListener('pointerdown', handlePointerDown);
    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerup', handlePointerUp);
    element.addEventListener('pointercancel', handlePointerCancel);
    element.addEventListener('pointerleave', handlePointerLeave);

    return {
      dispose(){
        element.removeEventListener('pointerdown', handlePointerDown);
        element.removeEventListener('pointermove', handlePointerMove);
        element.removeEventListener('pointerup', handlePointerUp);
        element.removeEventListener('pointercancel', handlePointerCancel);
        element.removeEventListener('pointerleave', handlePointerLeave);
        clearPointerState();
      }
    };
  }

  return {
    attachRowPressInteractions,
    DEFAULT_THRESHOLD
  };
});
