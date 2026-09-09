(function () {
  try {
    var saved = localStorage.getItem('lidenskap-theme');
    var theme = 'dark';
    if (saved === 'light' || saved === 'dark') {
      theme = saved;
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches === false) {
      theme = 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
