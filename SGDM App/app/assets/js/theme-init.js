// Inicialización temprana del tema (evita el parpadeo al cargar).
// Debe cargarse en <head>, antes del <link> de styles.css, sin async/defer,
// para que corra y fije data-theme ANTES de que el navegador pinte la
// página. Usa la misma clave ('lidenskap-theme') que toggleTheme() /
// initializeTheme() en main.js, así ese último no tiene nada que corregir
// cuando corre después.
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
