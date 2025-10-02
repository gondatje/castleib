(() => {
  const toggle = document.getElementById('layoutDemoTheme');
  const widthLabel = document.querySelector('#layoutDemoWidth [data-width]');

  const updateWidth = () => {
    if (!widthLabel) return;
    widthLabel.textContent = Math.round(window.innerWidth);
  };

  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
      document.body.dataset.theme = next;
    });
  }

  updateWidth();
  window.addEventListener('resize', updateWidth);
})();
