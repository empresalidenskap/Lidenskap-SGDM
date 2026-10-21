'use strict';

const imagenes = [
  {
    url: 'assets/img/imagen1.jpg',
    nombre: 'Competencias Deportivas',
    descripcion: 'Organizá torneos de fútbol, básquetbol, voleibol y más disciplinas físicas con gestión automática de fixtures y tablas de posiciones.'
  },
  {
    url: 'assets/img/imagen2.jpg',
    nombre: 'Torneos de Fútbol',
    descripcion: 'Generación automática de calendarios, llaves y clasificaciones. Gestión completa desde la inscripción hasta el campeón.'
  },
  {
    url: 'assets/img/imagen3.jpg',
    nombre: 'Deportes de Red',
    descripcion: 'Voleibol, tenis y más. El sistema se adapta a cualquier disciplina con módulos de Liga, Eliminación o Sistema Suizo.'
  }
];

let actual = 0;

const btnAtras   = document.getElementById('atras');
const btnAdelante= document.getElementById('adelante');
const imgWrap    = document.getElementById('img');
const textoWrap  = document.getElementById('texto');
const puntosWrap = document.getElementById('puntos');
const themeBtn   = document.getElementById('themeBtn');
const starContainer = document.getElementById('star-container');
const logoImg = document.getElementById('logoImg');
const ilustracion = document.getElementById('ilustracion');

function renderSlide(idx, direction = 'right') {
  if (!imgWrap || !textoWrap) return;

  const d = imagenes[idx];

  const animClass =
  direction === 'right'
    ? 'slide-in-right'
    : 'slide-in-left';

  imgWrap.innerHTML = `
    <img
      class="img ${animClass}"
      src="${d.url}"
      alt="${d.nombre}"
      loading="lazy"
    >
  `;

  textoWrap.innerHTML = `
    <h3>${d.nombre}</h3>
    <p>${d.descripcion}</p>
  `;

  renderPuntos();
}

function renderPuntos() {
  if (!puntosWrap) return;
  puntosWrap.innerHTML = '';
  imagenes.forEach((_, i) => {
    const p = document.createElement('div');
    p.className = 'punto' + (i === actual ? ' active' : '');
    p.addEventListener('click', () => {
  const direccion = i > actual ? 'right' : 'left';
  actual = i;
  renderSlide(actual, direccion);
    });
    puntosWrap.appendChild(p);
  });
}

function prevSlide() {
  actual = (actual - 1 + imagenes.length) % imagenes.length;
  renderSlide(actual, 'left');
}

function nextSlide() {
  actual = (actual + 1) % imagenes.length;
  renderSlide(actual, 'right');
}

if (btnAtras)    btnAtras.addEventListener('click', prevSlide);
if (btnAdelante) btnAdelante.addEventListener('click', nextSlide);

let autoTimer = null;
if (imgWrap) autoTimer = setInterval(nextSlide, 5000);
document.querySelector('.carrusel')?.addEventListener('mouseenter', () => {
  if (autoTimer) clearInterval(autoTimer);
});
document.querySelector('.carrusel')?.addEventListener('mouseleave', () => {
  if (autoTimer) clearInterval(autoTimer);
  autoTimer = setInterval(nextSlide, 5000);
});

renderSlide(actual);
if (logoImg) {
  logoImg.src =
    document.documentElement.dataset.theme === 'dark'
      ? 'assets/img/logodark.png'
      : 'assets/img/logo.png';

    }
if (ilustracion) {
  ilustracion.src =
  document.documentElement.dataset.theme === 'dark'
  ? 'assets/img/ilustracion-dark.png'
      : 'assets/img/ilustracion.png';
}

function toggleTheme() {
  const html = document.documentElement;
  const nextTheme = html.dataset.theme === 'dark' ? 'light' : 'dark';
  html.dataset.theme = nextTheme;

  if (nextTheme === 'light') {
    if (themeBtn) {
      themeBtn.textContent = '🌙';
      themeBtn.setAttribute('aria-label', 'Activar modo oscuro');
    }
    if (logoImg) logoImg.src = 'assets/img/logo.png';
    if (ilustracion) ilustracion.src = 'assets/img/ilustracion.png';
  } else {
    if (themeBtn) {
      themeBtn.textContent = '☀';
      themeBtn.setAttribute('aria-label', 'Activar modo claro');
    }
    if (logoImg) logoImg.src = 'assets/img/logodark.png';
    if (ilustracion) ilustracion.src = 'assets/img/ilustracion-dark.png';
  }

  try { localStorage.setItem('lidenskap-theme', nextTheme); } catch {}
}

function initializeTheme() {
  let storedTheme = '';
  try { storedTheme = localStorage.getItem('lidenskap-theme') || ''; } catch {}
  const initialTheme = storedTheme === 'light' || storedTheme === 'dark'
    ? storedTheme
    : document.documentElement.dataset.theme || 'dark';
  document.documentElement.dataset.theme = initialTheme;
  if (themeBtn) {
    themeBtn.type = 'button';
    themeBtn.textContent = initialTheme === 'dark' ? '☀' : '🌙';
    themeBtn.setAttribute('aria-label', initialTheme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro');
    themeBtn.addEventListener('click', toggleTheme);
  }
  if (logoImg) logoImg.src = initialTheme === 'dark' ? 'assets/img/logodark.png' : 'assets/img/logo.png';
  if (ilustracion) ilustracion.src = initialTheme === 'dark' ? 'assets/img/ilustracion-dark.png' : 'assets/img/ilustracion.png';
}

initializeTheme();

const STAR_CHARS = [ '✦', '✧'];

function spawnStar(x, y) {
  if (!starContainer) return;
  const star = document.createElement('span');
  star.className = 'star-burst';
  star.textContent = STAR_CHARS[Math.floor(Math.random() * STAR_CHARS.length)];

  const offsetX = (Math.random() - 0.5) * 60;
  const offsetY = (Math.random() - 0.5) * 40;

  star.style.left = (x + offsetX) + 'px';
  star.style.top  = (y + offsetY) + 'px';
  star.style.color = '#D4A017';
  star.style.textShadow = '0 0 8px rgba(212,160,23,0.8)';

  starContainer.appendChild(star);
  star.addEventListener('animationend', () => star.remove());
}

function burstStars(x, y, count = 4) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => spawnStar(x, y), i * 60);
  }
}

const sportsScroll      = document.getElementById('sportsScroll');
const sportsLeft        = document.getElementById('sportsLeft');
const sportsRight       = document.getElementById('sportsRight');
const progressThumb     = document.getElementById('sportsProgressThumb');
const fadeLeft          = document.querySelector('.sports-fade--left');
const fadeRight         = document.querySelector('.sports-fade--right');

const SCROLL_STEP = 180;

function updateSportsUI() {
  if (!sportsScroll) return;

  const { scrollLeft, scrollWidth, clientWidth } = sportsScroll;
  const maxScroll = scrollWidth - clientWidth;

  if (progressThumb && maxScroll > 0) {
    const ratio      = scrollLeft / maxScroll;
    const thumbW     = clientWidth / scrollWidth * 100;
    const thumbLeft  = ratio * (100 - thumbW);

    progressThumb.style.width     = thumbW + '%';
    progressThumb.style.transform = `translateX(${(thumbLeft / thumbW) * 100}%)`;
  }

  if (fadeLeft)  fadeLeft.classList.toggle('hidden',  scrollLeft <= 2);
  if (fadeRight) fadeRight.classList.toggle('hidden', scrollLeft >= maxScroll - 2);

  if (sportsLeft)  sportsLeft.disabled  = scrollLeft <= 2;
  if (sportsRight) sportsRight.disabled = scrollLeft >= maxScroll - 2;
}

if (sportsLeft) {
  sportsLeft.addEventListener('click', () => {
    sportsScroll.scrollBy({ left: -SCROLL_STEP, behavior: 'smooth' });

    const r = sportsLeft.getBoundingClientRect();
    burstStars(r.left + r.width / 2, r.top + r.height / 2, 2);
  });
}

if (sportsRight) {
  sportsRight.addEventListener('click', () => {
    sportsScroll.scrollBy({ left: SCROLL_STEP, behavior: 'smooth' });
    const r = sportsRight.getBoundingClientRect();
    burstStars(r.left + r.width / 2, r.top + r.height / 2, 2);
  });
}

if (sportsScroll) {
  sportsScroll.addEventListener('scroll', updateSportsUI, { passive: true });

  updateSportsUI();
  window.addEventListener('resize', updateSportsUI, { passive: true });
}

if (sportsScroll) {
  sportsScroll.addEventListener('click', (e) => {
    const chip = e.target.closest('.sport-chip');
    if (!chip) return;

    document.querySelectorAll('.sport-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');

    chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

    const rect = chip.getBoundingClientRect();
    burstStars(rect.left + rect.width / 2, rect.top + rect.height / 2, 5);
  });
}

document.querySelectorAll('.btn-hero, .btn-ghost, .btn-accent, .btn-outline, .format-card, .carrusel-btn').forEach(el => {
  el.addEventListener('click', () => {
    const rect = el.getBoundingClientRect();
    burstStars(rect.left + rect.width / 2, rect.top + rect.height / 2, 3);
  });
});

const infoDisciplinas = {
  futbol: {
    categoria: "Deporte de Campo",
    titulo: "FÚTBOL 11 / FÚTSAL",
    descripcion: "Gestiona ligas completas, torneos de eliminación directa o fases de grupos complejas. Configura de forma ágil planillas de partidos, control de amonestaciones, goleadores y tablas de posiciones integradas en tiempo real.",
    caracteristicas: [
      "Tabla de goleadores y juego limpio automática",
      "Soporte para ida y vuelta en llaves de eliminación",
      "Control de tarjetas (amarillas/rojas) y suspensiones"
    ],
    configuraciones: {
      "Sistema de Puntos": "3 por victoria, 1 por empate",
      "Duración estándar": "90 minutos (F11) / 40 minutos (Futsal)",
      "Formato sugerido": "Liga + Playoff final"
    }
  },
  basquet: {
    categoria: "Deporte de Pista",
    titulo: "BÁSQUETBOL",
    descripcion: "Monitorea estadísticas clave por cuarto y tiempos extra automáticos. Adapta el sistema para ligas locales o escolares con herramientas optimizadas para la velocidad de rotación de partidos de básquet.",
    caracteristicas: [
      "División automática de resultados por cuartos",
      "Control de prórrogas en empates",
      "Registro simplificado de puntos y faltas colectivas"
    ],
    configuraciones: {
      "Sistema de Puntos": "2 por victoria, 1 por derrota",
      "Duración estándar": "4 cuartos de 10 o 12 min",
      "Formato sugerido": "Fase de grupos + Brackets"
    }
  },
  tenis: {
    categoria: "Deportes de Raqueta",
    titulo: "TENIS / PÁDEL",
    descripcion: "Especialmente diseñado para duelos individuales o dobles. Controla sets de forma exacta, define ventajas (deuce) y desempates por tie-break sin margen de error.",
    caracteristicas: [
      "Marcador clásico de juegos (15, 30, 40) y sets",
      "Configuración personalizada de tie-break",
      "Clasificación individual mediante sistema de puntos ELO"
    ],
    configuraciones: {
      "Formato de Set": "Mejor de 3 o 5 sets",
      "Modalidades": "Individual / Dobles",
      "Formato sugerido": "Eliminación Directa con Consuelo"
    }
  },
  ajedrez: {
    categoria: "Deportes de Mente",
    titulo: "AJEDREZ",
    descripcion: "El escenario óptimo para el Sistema Suizo. Empareja a los jugadores de forma inteligente ronda tras ronda según su rendimiento acumulado, evitando que repitan rivales y automatizando los desempates Buchholz.",
    caracteristicas: [
      "Emparejamiento Suizo homologado",
      "Cálculo automatizado de Buchholz y Sonneborn-Berger",
      "Soporte para ritmos Blitz, Rápido y Clásico"
    ],
    configuraciones: {
      "Sistema de Puntos": "1 por victoria, 0.5 por tablas",
      "Criterio de Desempate": "Buchholz / Progresivo",
      "Formato sugerido": "Sistema Suizo a 5 o 7 rondas"
    }
  },
  esports: {
    categoria: "Competencia Digital",
    titulo: "ESPORTS MULTIJUEGO",
    descripcion: "Cada competencia identifica claramente el videojuego, su plataforma y sus reglas. El catálogo incluye League of Legends, Counter-Strike 2, VALORANT y Teamfight Tactics, con calendarios separados por fecha, fase y formato.",
    caracteristicas: [
      "League of Legends (LoL): equipos de 5 y series Bo3 / Bo5",
      "Counter-Strike 2 y VALORANT: mapas, vetos y series Bo1 / Bo3",
      "Teamfight Tactics (TFT): lobbies, rondas y puntos por posición"
    ],
    configuraciones: {
      "Juegos habilitados": "LoL · CS2 · VALORANT · TFT",
      "Formatos de serie": "Bo1 · Bo3 · Bo5",
      "Calendario": "Por juego, día, fase y estado"
    }
  },
  voleibol: {
    categoria: "Deporte de Pista",
    titulo: "VOLEIBOL",
    descripcion: "Administra partidos por sets con puntuación continua. Configura fácilmente el cambio de lado, límites de puntuación por set (25 puntos / tie-break a 15) y gestiona la diferencia obligatoria de dos puntos para ganar de forma automatizada.",
    caracteristicas: [
      "Control de sets (ganados/perdidos) en vivo",
      "Diferencia de 2 puntos automática para set points",
      "Soporte para Vóley Playa y Vóley de Salón"
    ],
    configuraciones: {
      "Formato de partido": "Al mejor de 3 o 5 sets",
      "Puntaje de Set": "25 puntos (quinto set a 15)",
      "Formato sugerido": "Grupos + Eliminación Directa"
    }
  },
  rugby: {
    categoria: "Deporte de Campo",
    titulo: "RUGBY (UNION / SEVENS)",
    descripcion: "Registra tries, conversiones, penales y drops en tiempo real con una planilla adaptada a las reglas de la World Rugby. Incluye sistemas de puntuación con bonus ofensivo y defensivo automático en la tabla de posiciones.",
    caracteristicas: [
      "Puntuación exacta (Tries, Conversiones, Penales y Drops)",
      "Soporte para puntos bonus en la tabla general",
      "Control de tarjetas amarillas temporales (Sin-bin)"
    ],
    configuraciones: {
      "Sistema de Puntos": "4 por ganar, 2 por empatar",
      "Bonus": "+1 por 4+ tries o perder por 7 o menos",
      "Formato sugerido": "Fase de grupos + Copa Oro/Plata"
    }
  },
  personalizada: {
    categoria: "Competencia configurable",
    titulo: "DISCIPLINA PERSONALIZADA",
    descripcion: "Crea una competencia para deportes, juegos o actividades que no estén incluidas en el catálogo. El organizador define las reglas, la puntuación y el formato más adecuado.",
    caracteristicas: [
      "Nombre y reglas definidos por el organizador",
      "Participación individual o por equipos",
      "Compatibilidad con liga, eliminación y sistema suizo"
    ],
    configuraciones: {
      "Reglamento": "Personalizable",
      "Participación": "Individual o equipos",
      "Formato sugerido": "A elección del organizador"
    }
  }
};

const displayContenedor = document.getElementById('disciplinaDisplay');

function actualizarVistaDisciplina(key) {
  if (!displayContenedor) return;

  const datos = infoDisciplinas[key];
  if (!datos) {
    displayContenedor.innerHTML = "";
    return;
  }

  displayContenedor.innerHTML = `
    <div class="disciplina-card-full">
      <div class="disciplina-info-left">
        <span class="disciplina-tag">${datos.categoria}</span>
        <h3 class="disciplina-title">${datos.titulo}</h3>
        <p class="disciplina-description">${datos.descripcion}</p>

        <ul class="disciplina-features">
          ${datos.caracteristicas.map(feat => `<li>${feat}</li>`).join('')}
        </ul>

        <div class="disciplina-actions">
          <a href="crear-competencia.html?disciplina=${key}" class="btn-primary">Crear torneo →</a>
          <a href="torneos.html?disciplina=${key}" class="btn-secondary">Ver torneos →</a>
          <a href="calendario.html?disciplina=${key}" class="btn-secondary">Ver calendario →</a>
        </div>
      </div>

      <div class="disciplina-preview-panel">
        <div>
          <div class="panel-title">Módulo de Configuración</div>
          ${Object.entries(datos.configuraciones).map(([campo, valor]) => `
            <div class="config-item">
              <span>${campo}</span>
              <span>${valor}</span>
            </div>
          `).join('')}
        </div>

        <div style="margin-top: 1.5rem; font-size: 0.75rem; color: var(--text-secondary); text-align: center;">
          * Módulo editable desde tu panel de organizador.
        </div>
      </div>
    </div>
  `;
  applyNavigationPermissions();
}

let torneosPorDisciplina = {};

const NOMBRES_DISCIPLINAS = {
  futbol: 'Fútbol', basquet: 'Básquetbol', tenis: 'Tenis',
  ajedrez: 'Ajedrez', esports: 'Esports', voleibol: 'Voleibol', rugby: 'Rugby'
};

let disciplinaTorneosActual = 'futbol';
let torneoActualIndex = 0;

const torneosTrack   = document.getElementById('torneosTrack');
const torneosPuntos  = document.getElementById('torneosPuntos');
const torneosTitulo  = document.getElementById('torneosDisciplinaTitulo');
const btnTorneoAtras = document.getElementById('torneoAtras');
const btnTorneoAdelante = document.getElementById('torneoAdelante');

function renderTorneoCard(direction = 'right') {
  if (!torneosTrack) return;

  const lista = torneosPorDisciplina[disciplinaTorneosActual] || [];

  if (lista.length === 0) {
    torneosTrack.innerHTML = `<div class="torneos-empty">Todavía no hay torneos publicados para esta disciplina.</div>`;
    if (torneosPuntos) torneosPuntos.innerHTML = '';
    if (btnTorneoAtras) btnTorneoAtras.disabled = true;
    if (btnTorneoAdelante) btnTorneoAdelante.disabled = true;
    return;
  }

  if (btnTorneoAtras) btnTorneoAtras.disabled = false;
  if (btnTorneoAdelante) btnTorneoAdelante.disabled = false;

  const t = lista[torneoActualIndex];
  const animClass = direction === 'right' ? 'slide-in-right' : 'slide-in-left';

  let estadoClass = 'estado-cerrado';
  if (t.estado === 'Inscripciones abiertas') estadoClass = 'estado-abierto';
  else if (t.estado === 'En curso') estadoClass = 'estado-curso';

  const tournamentHref = `detalle-torneo.html?id=${t.id}`;

  torneosTrack.innerHTML = `
    <div class="torneo-card ${animClass}">
      <div class="torneo-card-top">
        <span class="torneo-estado ${estadoClass}">${t.estado}</span>
        <span class="torneo-formato">${t.formato}</span>
      </div>
      <h3 class="torneo-nombre">${t.nombre}</h3>
      <div class="torneo-meta">
        <div class="torneo-meta-item"><span>Inicio</span><span>${t.fecha}</span></div>
        <div class="torneo-meta-item"><span>Equipos</span><span>${t.cupos}</span></div>
        <div class="torneo-meta-item"><span>Sede</span><span>${t.sede}</span></div>
      </div>
      <a href="${tournamentHref}" class="btn-accent torneo-cta">Ver torneo →</a>
    </div>
  `;

  renderTorneosPuntos();
}

function renderTorneosPuntos() {
  if (!torneosPuntos) return;
  const lista = torneosPorDisciplina[disciplinaTorneosActual] || [];
  torneosPuntos.innerHTML = '';

  lista.forEach((_, i) => {
    const p = document.createElement('div');
    p.className = 'punto' + (i === torneoActualIndex ? ' active' : '');
    p.addEventListener('click', () => {
      const dir = i > torneoActualIndex ? 'right' : 'left';
      torneoActualIndex = i;
      renderTorneoCard(dir);
    });
    torneosPuntos.appendChild(p);
  });
}

function cambiarDisciplinaTorneos(key) {
  disciplinaTorneosActual = torneosPorDisciplina[key] ? key : 'futbol';
  torneoActualIndex = 0;

  if (torneosTitulo) {
    torneosTitulo.textContent = NOMBRES_DISCIPLINAS[disciplinaTorneosActual] || disciplinaTorneosActual;
  }

  renderTorneoCard('right');
}

function torneoPrev() {
  const lista = torneosPorDisciplina[disciplinaTorneosActual] || [];
  if (lista.length === 0) return;
  torneoActualIndex = (torneoActualIndex - 1 + lista.length) % lista.length;
  renderTorneoCard('left');
}

function torneoNext() {
  const lista = torneosPorDisciplina[disciplinaTorneosActual] || [];
  if (lista.length === 0) return;
  torneoActualIndex = (torneoActualIndex + 1) % lista.length;
  renderTorneoCard('right');
}

if (btnTorneoAtras)    btnTorneoAtras.addEventListener('click', torneoPrev);
if (btnTorneoAdelante) btnTorneoAdelante.addEventListener('click', torneoNext);

const sportsScrollMenu = document.getElementById('sportsScroll');
if (sportsScrollMenu) {
  sportsScrollMenu.addEventListener('click', (e) => {
    const chip = e.target.closest('.sport-chip');
    if (!chip) return;

    const deporte = chip.getAttribute('data-sport');
    const isDisciplinesPage = document.body.dataset.page === 'disciplines';

    if (isDisciplinesPage) {
      const catalog = document.getElementById('disciplineCatalogSection');
      if (deporte === 'todas') {
        if (catalog) catalog.hidden = false;
        actualizarVistaDisciplina(null);
      } else {
        if (catalog) catalog.hidden = true;
        actualizarVistaDisciplina(deporte);
      }
      return;
    }

    if (deporte === 'todas') {
      actualizarVistaDisciplina(null);
      return;
    }
    actualizarVistaDisciplina(deporte);
    if (torneosPorDisciplina[deporte]) cambiarDisciplinaTorneos(deporte);
  });
}

const SGDM_PERMISSIONS = {
  ADMIN: ['view_public', 'view_profile', 'edit_profile', 'create_tournament', 'manage_tournaments', 'manage_users', 'manage_participants', 'manage_results', 'view_reports', 'view_audit', 'manage_settings'],
  ORGANIZADOR: ['view_public', 'view_profile', 'manage_tournaments', 'manage_participants', 'manage_results', 'view_reports'],
  ARBITRO: ['view_public', 'view_profile', 'edit_profile', 'manage_results'],
  PARTICIPANTE: ['view_public', 'view_profile', 'edit_profile', 'join_tournament'],
  PUBLICO: ['view_public', 'view_profile', 'request_tournament']
};

const ROL_LABEL = { ADMIN: 'Administrador general', ORGANIZADOR: 'Organizador', ARBITRO: 'Árbitro', PARTICIPANTE: 'Participante', PUBLICO: 'Usuario público' };

// Texto escrito por usuarios (nombres de torneo, de personas...) antes de
// meterlo en innerHTML, para que no pueda inyectar HTML o scripts.
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function readSession() {
  try {
    const stored = sessionStorage.getItem('lidenskap-user');
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

function cerrarSesion() {
  fetch('api/logout.php', { method: 'POST' }).catch(() => {});
  sessionStorage.removeItem('lidenskap-user');
  window.location.href = 'index.html';
}

let sesionUsuario = readSession();
let authReturnTo = '';

// sesionUsuario.rol es el rol global (ADMIN o PUBLICO); rolesTorneo trae los
// roles activos por torneo (ORGANIZADOR, ARBITRO, PARTICIPANTE). Los permisos
// son la unión de todos.
function hasPermission(permission) {
  if (!sesionUsuario) return false;
  const roles = [sesionUsuario.rol, ...(sesionUsuario.rolesTorneo || []).map(item => item.rol)];
  return roles.some(rol => SGDM_PERMISSIONS[rol]?.includes(permission));
}

function hasTorneoRole(idTorneo, rol) {
  return Boolean(sesionUsuario?.rolesTorneo?.some(item => item.idTorneo === Number(idTorneo) && item.rol === rol));
}

function canCreateTournament() {
  return hasPermission('create_tournament') || hasPermission('request_tournament');
}

function canUsePanel() {
  return hasPermission('manage_tournaments') || hasPermission('manage_users') || hasPermission('manage_results');
}

// Los roles por torneo cambian sin que el usuario vuelva a loguearse (le
// aprueban una solicitud, o el torneo termina y se le revoca). Si lo que
// devuelve el servidor no coincide con lo guardado, se actualiza y se recarga.
function refreshSession() {
  if (!sesionUsuario) return;
  fetch('api/sesion.php')
    .then(response => response.json())
    .then(data => {
      const actual = data.user ? JSON.stringify(data.user) : null;
      if (actual === sessionStorage.getItem('lidenskap-user')) return;
      if (actual) sessionStorage.setItem('lidenskap-user', actual);
      else sessionStorage.removeItem('lidenskap-user');
      window.location.reload();
    })
    .catch(() => {});
}

function passwordToggleButtonHtml() {
  return `<button type="button" class="password-toggle" aria-label="Mostrar contraseña" aria-pressed="false">
      <svg class="icon-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>
      <svg class="icon-eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" hidden><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.27 21.27 0 0 1 5.06-6.06M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a21.27 21.27 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    </button>`;
}

function createAuthModal() {
  document.getElementById('loginModal')?.remove();
  document.body.insertAdjacentHTML('beforeend', `
    <div id="loginModal" class="modal-overlay auth-modal" aria-hidden="true">
      <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="authTitle">
        <button class="modal-close" id="closeModalBtn" type="button" aria-label="Cerrar">&times;</button>
        <div class="auth-tabs" role="tablist">
          <button id="tabLogin" class="auth-tab active" type="button" role="tab" aria-selected="true">Iniciar sesión</button>
          <button id="tabRegister" class="auth-tab" type="button" role="tab" aria-selected="false">Registrarse</button>
        </div>
        <section id="viewLogin">
          <p class="section-eyebrow">Acceso al sistema</p><h2 id="authTitle">INICIAR SESIÓN</h2>
          <p class="auth-help">Ingresá con tu cuenta, o probá una de las cuentas de demostración.</p>
          <form id="loginForm">
            <div class="field"><label for="loginEmail">Correo electrónico</label><input type="email" id="loginEmail" autocomplete="username" required></div>
            <div class="field"><label for="loginPassword">Contraseña</label><div class="password-field"><input type="password" id="loginPassword" autocomplete="current-password" required>${passwordToggleButtonHtml()}</div></div>
            <p id="loginError" class="auth-error" hidden>Correo o contraseña incorrectos.</p>
            <button class="btn-primary" type="submit">Ingresar</button>
          </form>
          <details class="demo-accounts"><summary>Ver cuentas de demostración</summary><ul><li><b>Administrador:</b> admin@lidenskap.com / admin123</li><li><b>Organizador de 4 torneos:</b> organizador@lidenskap.com / org123</li><li><b>Árbitro de Copa Demo:</b> arbitro@lidenskap.com / arb123</li><li><b>Participante de Copa Demo (Halcones del Sur):</b> atleta@lidenskap.com / user123</li><li><b>Usuario público (con una invitación):</b> publico@lidenskap.com / guest123</li><li><b>Otros jugadores:</b> lucia@, mateo@, sofia@, camila@… (@lidenskap.com) / demo1234</li></ul></details>
        </section>
        <section id="viewRegister" hidden>
          <p class="section-eyebrow">Nueva cuenta</p><h2>REGISTRARSE</h2>
          <p class="auth-help">Se crea como cuenta de Usuario público. Con ella podés solicitar crear un torneo, participar o arbitrar en uno; el rol vale solo para ese torneo.</p>
          <form id="registerForm">
            <div class="field"><label for="registerNombre">Nombre</label><input id="registerNombre" autocomplete="given-name" required></div>
            <div class="field"><label for="registerApellido">Apellido</label><input id="registerApellido" autocomplete="family-name" required></div>
            <div class="field"><label for="registerEmail">Correo electrónico</label><input id="registerEmail" type="email" autocomplete="username" required></div>
            <div class="field"><label for="registerPassword">Contraseña</label><div class="password-field"><input id="registerPassword" type="password" autocomplete="new-password" minlength="8" required>${passwordToggleButtonHtml()}</div></div>
            <p id="registerError" class="auth-error" hidden></p>
            <button class="btn-primary" type="submit">Crear cuenta</button>
            <p id="registerFeedback" class="form-feedback" aria-live="polite"></p>
          </form>
        </section>
      </div>
    </div>`);
}

function setAuthTab(mode) {
  const loginView = document.getElementById('viewLogin');
  const registerView = document.getElementById('viewRegister');
  const loginTab = document.getElementById('tabLogin');
  const registerTab = document.getElementById('tabRegister');
  const registerMode = mode === 'register';
  if (loginView) loginView.hidden = registerMode;
  if (registerView) registerView.hidden = !registerMode;
  loginTab?.classList.toggle('active', !registerMode);
  registerTab?.classList.toggle('active', registerMode);
  loginTab?.setAttribute('aria-selected', String(!registerMode));
  registerTab?.setAttribute('aria-selected', String(registerMode));
}

function openAuthModal(mode = 'login', returnTo = '') {
  authReturnTo = returnTo;
  setAuthTab(mode);
  const modal = document.getElementById('loginModal');
  modal?.classList.add('active');
  modal?.setAttribute('aria-hidden', 'false');
  setTimeout(() => document.getElementById(mode === 'register' ? 'registerNombre' : 'loginEmail')?.focus(), 0);
}

function closeAuthModal() {
  const modal = document.getElementById('loginModal');
  modal?.classList.remove('active');
  modal?.setAttribute('aria-hidden', 'true');
  const error = document.getElementById('loginError');
  if (error) error.hidden = true;
}

function initializeAuthentication() {
  createAuthModal();
  const modal = document.getElementById('loginModal');
  document.getElementById('closeModalBtn')?.addEventListener('click', closeAuthModal);
  modal?.addEventListener('click', event => { if (event.target === modal) closeAuthModal(); });
  document.getElementById('tabLogin')?.addEventListener('click', () => setAuthTab('login'));
  document.getElementById('tabRegister')?.addEventListener('click', () => setAuthTab('register'));

  document.getElementById('loginForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const loginError = document.getElementById('loginError');
    loginError.hidden = true;
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    submitBtn.disabled = true;
    try {
      const response = await fetch('api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!data.success) {
        loginError.textContent = data.error || 'Correo o contraseña incorrectos.';
        loginError.hidden = false;
        return;
      }
      sessionStorage.setItem('lidenskap-user', JSON.stringify(data.user));
      sesionUsuario = data.user;
      const destination = authReturnTo || (canUsePanel() ? 'panel.html' : 'perfil.html');
      window.location.href = destination;
    } catch {
      loginError.textContent = 'No se pudo conectar con el servidor. Intentá de nuevo.';
      loginError.hidden = false;
    } finally {
      submitBtn.disabled = false;
    }
  });

  document.getElementById('registerForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const registerError = document.getElementById('registerError');
    const registerFeedback = document.getElementById('registerFeedback');
    registerError.hidden = true;
    registerFeedback.textContent = '';

    const nombre = document.getElementById('registerNombre').value.trim();
    const apellido = document.getElementById('registerApellido').value.trim();
    const email = document.getElementById('registerEmail').value.trim().toLowerCase();
    const password = document.getElementById('registerPassword').value;

    submitBtn.disabled = true;
    try {
      const response = await fetch('api/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, apellido, email, password })
      });
      const data = await response.json();
      if (!data.success) {
        registerError.textContent = data.error || 'No se pudo crear la cuenta.';
        registerError.hidden = false;
        return;
      }
      sessionStorage.setItem('lidenskap-user', JSON.stringify(data.user));
      sesionUsuario = data.user;
      window.location.href = authReturnTo || 'perfil.html';
    } catch {
      registerError.textContent = 'No se pudo conectar con el servidor. Intentá de nuevo.';
      registerError.hidden = false;
    } finally {
      submitBtn.disabled = false;
    }
  });

  renderAccountNav();

  document.getElementById('btnCrearCuentaGratis')?.addEventListener('click', event => { event.preventDefault(); openAuthModal('register'); });
}

function renderAccountNav() {
  const slot = document.getElementById('navAccount');
  if (!slot) return;

  if (!sesionUsuario) {
    slot.innerHTML = '<a href="#iniciar-sesion" class="btn-outline" id="navAccountBtn">Iniciar sesión</a>';
    document.getElementById('navAccountBtn')?.addEventListener('click', event => {
      event.preventDefault();
      openAuthModal('login');
    });
    return;
  }

  slot.innerHTML = `
    <div class="profile-dropdown" id="profileDropdownWrap">
      <button type="button" class="btn-outline profile-dropdown-btn" id="profileDropdownBtn" aria-expanded="false" aria-haspopup="true">
        Mi Perfil <span class="dropdown-caret" aria-hidden="true">▼</span>
      </button>
      <div class="profile-menu" id="profileMenu">
        <div class="profile-menu-header">
          <span class="user-email" id="dropdownUserEmail">${sesionUsuario.email || ''}</span>
        </div>
        <ul class="profile-menu-links">
          <li><a href="perfil.html">Mi Perfil</a></li>
          <li><a href="crear-competencia.html">Crear Competencia</a></li>
        </ul>
        <div class="profile-menu-footer">
          <button type="button" class="btn-logout" id="logoutBtn">Cerrar Sesión</button>
        </div>
      </div>
    </div>`;

  const btn = document.getElementById('profileDropdownBtn');
  const menu = document.getElementById('profileMenu');

  const closeMenu = () => {
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  };

  btn.addEventListener('click', event => {
    event.stopPropagation();
    const isOpen = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', event => {
    if (!menu.contains(event.target) && !btn.contains(event.target)) closeMenu();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.classList.contains('open')) {
      closeMenu();
      btn.focus();
    }
  });

  document.getElementById('logoutBtn')?.addEventListener('click', cerrarSesion);

  applyNavigationPermissions();
}

document.addEventListener('click', function (e) {
  const btnTodas = e.target.closest('#btnTodasDisciplinas') || e.target.closest('[data-sport="todas"]');

  if (btnTodas && document.body.dataset.page !== 'disciplines') {
    e.preventDefault();
    window.location.href = 'disciplinas.html';
  }
});

const SGDM_NAV_ITEMS = [
  ['index.html', 'Inicio'],
  ['disciplinas.html', 'Disciplinas'],
  ['torneos.html', 'Buscar torneos'],
  ['calendario.html', 'Calendario'],
  ['crear-competencia.html', 'Crear competencia'],
  ['panel.html', 'Panel'],
  ['perfil.html', 'Perfil']
];

function initializeSharedNavigation() {
  const nav = document.querySelector('nav');
  const links = nav?.querySelector('.nav-links');
  const navRight = nav?.querySelector('.nav-right');
  if (!nav || !links || !navRight) return;

  const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  links.innerHTML = SGDM_NAV_ITEMS.map(([href, label]) => {
    const active = currentPage === href.toLowerCase() ? ' aria-current="page" class="active"' : '';
    return `<li><a href="${href}"${active}>${label}</a></li>`;
  }).join('');

  links.id ||= 'primaryNavigation';
  const menuButton = navRight.querySelector('.nav-menu-toggle') || document.createElement('button');
  menuButton.type = 'button';
  menuButton.className = 'nav-menu-toggle';
  menuButton.setAttribute('aria-label', 'Abrir menú');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-controls', links.id);
  menuButton.innerHTML = '<span></span><span></span><span></span>';
  if (!menuButton.isConnected) navRight.appendChild(menuButton);

  const setMenuOpen = isOpen => {
    links.classList.toggle('nav-open', isOpen);
    menuButton.classList.toggle('active', isOpen);
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
  };

  menuButton.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true');
  });
  links.addEventListener('click', () => setMenuOpen(false));
  document.addEventListener('click', event => {
    if (!nav.contains(event.target)) setMenuOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setMenuOpen(false);
  });
}

function applyNavigationPermissions() {
  document.querySelectorAll('a[href^="crear-competencia.html"]').forEach(link => {
    link.hidden = !canCreateTournament();
  });
  document.querySelectorAll('a[href="panel.html"]').forEach(link => {
    link.hidden = !canUsePanel();
  });
}

function renderAccessGate(title, message, showAuth = false) {
  const main = document.querySelector('.page-shell');
  if (!main) return;
  main.innerHTML = `<section class="access-gate surface-card"><span class="access-lock" aria-hidden="true">●</span><p class="section-eyebrow">Acceso controlado</p><h1>${title}</h1><p>${message}</p><div class="card-actions">${showAuth ? '<button class="btn-primary" type="button" data-open-login>Iniciar sesión</button><button class="btn-secondary" type="button" data-open-register>Registrarse</button>' : '<a class="btn-primary" href="index.html">Volver al inicio</a><a class="btn-secondary" href="torneos.html">Consultar torneos</a>'}</div></section>`;
}

function applyRouteGuard() {
  const page = document.body.dataset.page;
  if (page === 'profile' && !sesionUsuario) {
    renderAccessGate('INICIÁ SESIÓN PARA VER TU PERFIL', 'Todavía no hay un usuario autenticado. Ingresá con una de las cuatro cuentas habilitadas o consultá el maquetado de registro.', true);
  }
  if (page === 'create-tournament' && !canCreateTournament()) {
    renderAccessGate('INICIÁ SESIÓN PARA CREAR UN TORNEO', 'Cualquier cuenta puede solicitar un torneo nuevo; el Administrador general revisa la solicitud y, si la aprueba, quedás como Organizador de ese torneo.', true);
  }
  if (page === 'dashboard' && !canUsePanel()) {
    renderAccessGate('PANEL NO DISPONIBLE', sesionUsuario ? 'Tu cuenta no organiza ni arbitra ningún torneo vigente. Podés solicitarlo desde la página de cada torneo.' : 'Iniciá sesión como Administrador general u Organizador de torneo para acceder al panel.', !sesionUsuario);
  }
}

document.addEventListener('click', event => {
  const passwordToggle = event.target.closest('.password-toggle');
  if (passwordToggle) {
    const input = passwordToggle.closest('.password-field')?.querySelector('input');
    if (input) {
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      passwordToggle.setAttribute('aria-pressed', String(!showing));
      passwordToggle.setAttribute('aria-label', showing ? 'Mostrar contraseña' : 'Ocultar contraseña');
      passwordToggle.querySelector('.icon-eye').hidden = !showing;
      passwordToggle.querySelector('.icon-eye-off').hidden = showing;
    }
    return;
  }

  const loginTrigger = event.target.closest('[data-open-login]');
  const registerTrigger = event.target.closest('[data-open-register]');
  if (loginTrigger) {
    event.preventDefault();
    const returnPages = { profile: 'perfil.html', 'create-tournament': `crear-competencia.html${window.location.search}`, dashboard: 'panel.html' };
    openAuthModal('login', returnPages[document.body.dataset.page] || '');
  }
  if (registerTrigger) { event.preventDefault(); openAuthModal('register'); }

  const protectedLink = event.target.closest('a[href]');
  if (!protectedLink) return;
  const href = protectedLink.getAttribute('href') || '';
  if (href.startsWith('perfil.html') && !sesionUsuario) {
    event.preventDefault(); openAuthModal('login', 'perfil.html');
  } else if (href.startsWith('crear-competencia.html') && !canCreateTournament()) {
    event.preventDefault();
    openAuthModal('login', href);
  } else if (href.startsWith('panel.html') && !canUsePanel()) {
    event.preventDefault();
    if (!sesionUsuario) openAuthModal('login', 'panel.html');
    else alert('Tu cuenta no organiza ni arbitra ningún torneo vigente, así que no tiene panel de gestión.');
  }
});

initializeSharedNavigation();
initializeAuthentication();
applyRouteGuard();
refreshSession();

const CALENDAR_WEEKDAYS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const CALENDAR_MONTH_LABELS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
// Calendario (F8): cada partido de api/calendario.php con la forma que usa
// initializeCalendar() (filtros por disciplina, formato, año, mes y día).
function partidoDeCalendario(p) {
  const mes = Number(p.fecha.slice(5, 7));
  return {
    id: p.id,
    tournamentId: p.torneoId,
    tournamentName: p.torneo,
    discipline: p.disciplina,
    disciplineLabel: p.disciplinaNombre || 'Personalizada',
    game: '',
    gameSlug: '',
    format: p.formato,
    formatLabel: p.formatoNombre,
    date: p.fecha,
    day: CALENDAR_WEEKDAYS[new Date(`${p.fecha}T12:00:00`).getDay()],
    dateLabel: `${Number(p.fecha.slice(8, 10))} ${CALENDAR_MONTH_LABELS[mes - 1].slice(0, 3)}`,
    time: p.hora || '--:--',
    phase: p.fase,
    home: p.local,
    away: p.visitante,
    score: p.resultado ? `${p.resultado}${p.walkover ? ' (WO)' : ''}` : '',
    status: p.resultado ? 'finalizado' : 'proximo',
    statusLabel: p.resultado ? 'Finalizado' : 'Próximo',
    venue: p.sede || 'A definir'
  };
}

function statusClass(status) {
  return status === 'abierto' ? 'status-open' : ['proximo', 'cerradas', 'curso'].includes(status) ? 'status-progress' : 'status-closed';
}

const ESTADO_TORNEO_A_UI = {
  planificado: 'proximo',
  inscripcion_abierta: 'abierto',
  inscripcion_cerrada: 'cerradas',
  en_curso: 'curso',
  finalizado: 'cerrado',
  cancelado: 'cerrado',
};
const ESTADO_UI_LABEL = { proximo: 'Próximamente', abierto: 'Inscripciones abiertas', cerradas: 'Inscripciones cerradas', curso: 'En curso', cerrado: 'Finalizado' };
const FORMATO_LABEL = { liga: 'Liga', eliminacion: 'Eliminación Directa', suizo: 'Sistema Suizo' };

// Finalizar un torneo (F7): lo mismo desde el detalle y desde el panel
const FINALIZAR_PREGUNTA = '¿Finalizar el torneo? Tienen que estar validados todos los resultados. Los roles de este torneo (organizador, árbitros y participantes) terminan: vuelven a ser Usuarios públicos con la misma cuenta, y el historial queda.';

// Partidos (F6): tarjeta de un partido para el panel y el detalle del torneo.
// Un resultado sin validar (solo lo ven el Organizador y el árbitro) va con *.
function fechaHoraCorta(valor) {
  return new Date(valor.replace(' ', 'T')).toLocaleString('es-UY', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function partidoHtml(p, controles = '') {
  const marcador = p.libre ? 'libre' : p.resultado ? `${p.resultado.local} - ${p.resultado.visitante}${p.resultado.validado ? '' : ' *'}` : 'vs.';
  const nota = p.estado === 'walkover' ? 'Walkover' : p.libre ? 'Pasa sin jugar' : p.fechaHora ? fechaHoraCorta(p.fechaHora) : 'Sin horario';
  const arbitro = p.arbitro && !controles ? ` · Árbitro: ${escapeHtml(p.arbitro)}` : '';
  return `<article class="bracket-match"><span>${nota}${arbitro}</span><div><strong>${escapeHtml(p.local)}</strong><b>${marcador}</b><strong>${p.libre ? '—' : escapeHtml(p.visitante)}</strong></div>${controles}</article>`;
}

function nombreRonda(formato, ronda) {
  if (formato === 'eliminacion') {
    const partidos = ronda.partidos.length;
    if (partidos === 1) return 'Final';
    if (partidos === 2) return 'Semifinales';
    if (partidos === 4) return 'Cuartos de final';
  }
  return formato === 'liga' ? `Fecha ${ronda.numero}` : `Ronda ${ronda.numero}`;
}

// Llaves (assets/js/bracket.js): la eliminación directa como árbol (al mejor
// de 1) y el suizo agrupado por récord (series al mejor de 3). Solo muestra
// resultados validados.
function datosLlave(rondas) {
  const results = {};
  rondas.forEach(ronda => ronda.partidos.forEach((p, i) => {
    const fecha = p.fechaHora ? fechaHoraCorta(p.fechaHora) : undefined;
    results[`${ronda.numero}-${i + 1}`] = p.resultado && p.resultado.validado
      ? { score: [p.resultado.local, p.resultado.visitante], date: fecha, note: p.estado === 'walkover' ? 'Walkover' : undefined }
      : { date: fecha };
  }));
  return { firstRound: rondas[0].partidos.map(p => [p.local, p.libre ? null : p.visitante]), results };
}

function dibujarLlave(contenedor, datos) {
  if (!contenedor || !window.SGDMBracket || !datos.rondas.length) return false;
  if (datos.torneo.formato === 'eliminacion') SGDMBracket.render(contenedor, datosLlave(datos.rondas));
  else if (datos.torneo.formato === 'suizo') SGDMBracket.renderSuizo(contenedor, { rondas: datos.rondas, umbral: datos.umbral });
  else return false;
  return true;
}

const LEYENDA_LLAVE = '<div class="bracket-legend" aria-hidden="true"><span><i class="legend-win"></i>Ganador / camino definido</span><span><i class="legend-next"></i>Partido por jugar</span><span><i></i>Por definir</span></div>';

// Tabla de posiciones (liga y suizo), ya ordenada por el servidor (RF-09)
function tablaPosicionesHtml(tabla) {
  // Suizo: récord (victorias-derrotas) y si ya se clasificó o quedó eliminado
  const suizo = tabla.some(f => f.estadoSuizo);
  const ESTADO_SUIZO = { clasificado: ['status-open', 'Clasificado'], eliminado: ['status-closed', 'Eliminado'], en_juego: ['status-progress', 'En juego'] };
  const extraTitulos = suizo ? '<th>Récord</th><th>Estado</th>' : '';
  const extra = f => (suizo ? `<td><strong>${f.victorias}-${f.derrotas}</strong></td><td><span class="status-pill ${ESTADO_SUIZO[f.estadoSuizo][0]}">${ESTADO_SUIZO[f.estadoSuizo][1]}</span></td>` : '');
  return `<div class="table-scroll standings-table"><table><thead><tr><th>#</th><th>Competidor</th>${extraTitulos}<th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th>Pts</th></tr></thead><tbody>${tabla.map(f => `<tr><td>${f.posicion}</td><td><strong>${escapeHtml(f.nombre)}</strong></td>${extra(f)}<td>${f.jugados}</td><td>${f.ganados}</td><td>${f.empatados}</td><td>${f.perdidos}</td><td>${f.golesAFavor}</td><td>${f.golesEnContra}</td><td>${f.diferencia}</td><td><strong>${f.puntos}</strong></td></tr>`).join('')}</tbody></table></div>`;
}

function initializeTournamentSearch() {
  const grid = document.getElementById('tournamentGrid');
  if (!grid) return;
  const search = document.getElementById('tournamentSearch');
  const discipline = document.getElementById('disciplineFilter');
  const format = document.getElementById('formatFilter');
  const status = document.getElementById('statusFilter');
  const count = document.getElementById('resultsCount');
  const empty = document.getElementById('emptyResults');
  const params = new URLSearchParams(window.location.search);
  if (params.get('disciplina')) discipline.value = params.get('disciplina');
  if (params.get('formato')) format.value = params.get('formato');

  let torneos = [];

  const render = () => {
    const query = search.value.trim().toLocaleLowerCase('es');
    const filtered = torneos.filter(t => {
      const estadoUi = ESTADO_TORNEO_A_UI[t.estado] || 'cerrado';
      return (!query || `${t.nombre} ${t.sede || ''} ${t.disciplinaNombre || ''}`.toLocaleLowerCase('es').includes(query)) &&
        (!discipline.value || t.disciplina === discipline.value) &&
        (!format.value || t.formato === format.value) &&
        (!status.value || estadoUi === status.value);
    });
    grid.innerHTML = filtered.map(t => {
      const estadoUi = ESTADO_TORNEO_A_UI[t.estado] || 'cerrado';
      const cupos = t.cupoMaximo ? `${t.inscriptos} / ${t.cupoMaximo}` : `${t.inscriptos}`;
      return `
      <article class="tournament-card">
        <div class="card-top"><span class="status-pill ${statusClass(estadoUi)}">${ESTADO_UI_LABEL[estadoUi]}</span><span class="neutral-pill">${FORMATO_LABEL[t.formato] || t.formatoNombre}</span></div>
        <div class="card-category-line"><p class="section-eyebrow">${escapeHtml(t.disciplinaNombre || 'Personalizada')}</p></div><h3>${escapeHtml(t.nombre)}</h3><p>${escapeHtml(t.descripcion)}</p>
        <dl class="card-meta"><div><dt>Inicio</dt><dd>${t.fechaInicio || 'A definir'}</dd></div><div><dt>Cupos</dt><dd>${cupos}</dd></div><div><dt>Sede</dt><dd>${escapeHtml(t.sede || 'A definir')}</dd></div></dl>
        <a class="btn-primary" href="detalle-torneo.html?id=${t.id}">Ver detalle</a>
      </article>`;
    }).join('');
    count.textContent = `${filtered.length} ${filtered.length === 1 ? 'torneo encontrado' : 'torneos encontrados'}`;
    empty.hidden = filtered.length !== 0;
    grid.hidden = filtered.length === 0;
  };

  [search, discipline, format, status].forEach(control => control.addEventListener(control === search ? 'input' : 'change', render));
  const clear = () => { search.value = ''; discipline.value = ''; format.value = ''; status.value = ''; render(); };
  document.getElementById('clearFilters')?.addEventListener('click', clear);
  document.querySelector('[data-clear-filters]')?.addEventListener('click', clear);

  fetch('api/torneos.php')
    .then(response => response.json())
    .then(data => { torneos = data.success ? data.torneos : []; render(); })
    .catch(() => { torneos = []; render(); });
}

function initializeCalendar() {
  const grid = document.getElementById('scheduleGrid');
  if (!grid) return;
  const disciplineButtons = [...document.querySelectorAll('[data-calendar-discipline]')];
  const monthRail = document.getElementById('calendarMonths');
  const dateRail = document.getElementById('calendarDates');
  const yearSelect = document.getElementById('calendarYear');
  const gameSelect = document.getElementById('calendarGame');
  const formatSelect = document.getElementById('calendarFormat');
  const statusSelect = document.getElementById('calendarStatus');
  const count = document.getElementById('scheduleCount');
  const empty = document.getElementById('scheduleEmpty');
  const title = document.getElementById('scheduleTitle');
  const periodLabel = document.getElementById('calendarPeriodLabel');
  const params = new URLSearchParams(window.location.search);
  let selectedDiscipline = params.get('disciplina') || '';
  let selectedGame = params.get('juego') || '';
  let selectedDate = params.get('fecha') || '';
  const anioActual = String(new Date().getFullYear());
  let selectedYear = params.get('anio') || anioActual;
  let partidos = [];
  let selectedMonth = params.get('mes') ? String(Number(params.get('mes'))) : '';
  if (selectedGame) selectedDiscipline = 'esports';
  if (selectedDate) {
    selectedYear = selectedDate.slice(0, 4);
    selectedMonth = String(Number(selectedDate.slice(5, 7)));
  }
  yearSelect.value = selectedYear;
  gameSelect.value = selectedGame;

  const renderPeriodControls = () => {
    const yearMatches = partidos.filter(match => match.date.startsWith(`${selectedYear}-`));
    monthRail.innerHTML = `<button class="${selectedMonth ? '' : 'active'}" type="button" data-calendar-month=""><span>Todo el año</span><strong>${yearMatches.length}</strong></button>` +
      CALENDAR_MONTH_LABELS.map((label, index) => {
        const month = String(index + 1);
        const paddedMonth = month.padStart(2, '0');
        const monthCount = yearMatches.filter(match => match.date.slice(5, 7) === paddedMonth).length;
        return `<button class="${selectedMonth === month ? 'active' : ''}" type="button" data-calendar-month="${month}"><span>${label.slice(0, 3)}</span><strong>${monthCount}</strong></button>`;
      }).join('');

    const periodMatches = yearMatches.filter(match => !selectedMonth || Number(match.date.slice(5, 7)) === Number(selectedMonth));
    const uniqueDates = [...new Map(periodMatches.map(match => [match.date, { date: match.date, day: match.day, label: match.dateLabel }])).values()];
    dateRail.innerHTML = uniqueDates.length
      ? `<button class="${selectedDate ? '' : 'active'}" type="button" data-calendar-date=""><span>TODAS</span><strong>${periodMatches.length}</strong></button>` +
        uniqueDates.map(item => `<button class="${selectedDate === item.date ? 'active' : ''}" type="button" data-calendar-date="${item.date}"><span>${item.day}</span><strong>${item.label}</strong></button>`).join('')
      : '<p class="calendar-no-dates">Todavía no hay encuentros programados en este período.</p>';
    periodLabel.textContent = selectedMonth ? `${CALENDAR_MONTH_LABELS[Number(selectedMonth) - 1]} ${selectedYear}` : `Todo ${selectedYear}`;
  };

  const render = () => {
    renderPeriodControls();
    const filtered = partidos.filter(match =>
      match.date.startsWith(`${selectedYear}-`) &&
      (!selectedMonth || Number(match.date.slice(5, 7)) === Number(selectedMonth)) &&
      (!selectedDiscipline || match.discipline === selectedDiscipline) &&
      (!selectedGame || match.gameSlug === selectedGame) &&
      (!selectedDate || match.date === selectedDate) &&
      (!formatSelect.value || match.format === formatSelect.value) &&
      (!statusSelect.value || match.status === statusSelect.value)
    );
    grid.innerHTML = filtered.map(match => {
      return `<article class="schedule-card ${match.status === 'finalizado' ? 'schedule-finished' : ''}">
        <header><div class="schedule-badges"><span class="discipline-badge discipline-${match.discipline}">${escapeHtml(match.disciplineLabel)}</span>${match.game ? `<span class="game-badge game-${match.gameSlug}">${match.game}</span>` : ''}</div><span class="schedule-status schedule-${match.status}">${match.statusLabel}</span></header>
        <div class="schedule-body">
          <div class="schedule-time"><strong>${match.time}</strong><span>${match.dateLabel}</span><small>UTC−3</small></div>
          <div class="schedule-match">
            <p>${escapeHtml(match.tournamentName)}</p>
            <div><strong>${escapeHtml(match.home)}</strong><span>${match.score || 'VS.'}</span><strong>${escapeHtml(match.away)}</strong></div>
            <small>${match.phase} · ${match.formatLabel}</small>
          </div>
        </div>
        <div class="schedule-card-footer"><span>${escapeHtml(match.venue)}${match.game ? ' · Servidor LATAM' : ''}</span><a href="detalle-torneo.html?id=${match.tournamentId}">Ver torneo →</a></div>
      </article>`;
    }).join('');
    count.textContent = `${filtered.length} ${filtered.length === 1 ? 'encuentro' : 'encuentros'}`;
    document.getElementById('calendarTotal').textContent = partidos.filter(match => match.date.startsWith(`${selectedYear}-`)).length;
    const selectedButton = disciplineButtons.find(button => button.dataset.calendarDiscipline === selectedDiscipline);
    title.textContent = selectedGame
      ? `PARTIDOS DE ${gameSelect.options[gameSelect.selectedIndex].text.toUpperCase()}`
      : selectedDiscipline
        ? `PARTIDOS DE ${selectedButton?.textContent.toUpperCase() || 'LA DISCIPLINA'}`
        : 'TODOS LOS PARTIDOS';
    grid.hidden = filtered.length === 0;
    empty.hidden = filtered.length !== 0;
    disciplineButtons.forEach(button => button.classList.toggle('active', button.dataset.calendarDiscipline === selectedDiscipline));
    document.querySelectorAll('[data-calendar-month]').forEach(button => button.classList.toggle('active', button.dataset.calendarMonth === selectedMonth));
    document.querySelectorAll('[data-calendar-date]').forEach(button => button.classList.toggle('active', button.dataset.calendarDate === selectedDate));
  };
  const reset = () => {
    selectedDiscipline = '';
    selectedGame = '';
    selectedDate = '';
    selectedYear = anioActual;
    selectedMonth = '';
    yearSelect.value = selectedYear;
    gameSelect.value = '';
    formatSelect.value = '';
    statusSelect.value = '';
    history.replaceState(null, '', 'calendario.html');
    render();
  };
  disciplineButtons.forEach(button => button.addEventListener('click', () => {
    selectedDiscipline = button.dataset.calendarDiscipline;
    if (selectedDiscipline !== 'esports') {
      selectedGame = '';
      gameSelect.value = '';
    }
    render();
  }));
  gameSelect.addEventListener('change', () => {
    selectedGame = gameSelect.value;
    if (selectedGame) selectedDiscipline = 'esports';
    render();
  });
  yearSelect.addEventListener('change', () => {
    selectedYear = yearSelect.value;
    selectedMonth = '';
    selectedDate = '';
    render();
  });
  monthRail.addEventListener('click', event => {
    const button = event.target.closest('[data-calendar-month]');
    if (!button) return;
    selectedMonth = button.dataset.calendarMonth;
    selectedDate = '';
    render();
  });
  dateRail.addEventListener('click', event => {
    const button = event.target.closest('[data-calendar-date]');
    if (!button) return;
    selectedDate = button.dataset.calendarDate;
    render();
  });
  [formatSelect, statusSelect].forEach(select => select.addEventListener('change', render));
  document.getElementById('clearCalendarFilters')?.addEventListener('click', reset);
  document.querySelector('[data-reset-calendar]')?.addEventListener('click', reset);
  render();
  fetch('api/calendario.php')
    .then(response => response.json())
    .then(data => { partidos = data.success ? data.partidos.map(partidoDeCalendario) : []; render(); })
    .catch(() => render());
}

function initializeTournamentDetail() {
  if (document.body.dataset.page !== 'tournament-detail') return;
  const id = new URLSearchParams(window.location.search).get('id');
  const detailPage = document.querySelector('.detail-page');

  const showNotFound = () => {
    document.title = 'Torneo no encontrado — Lidenskap';
    if (detailPage) detailPage.innerHTML = `
      <a class="back-link" href="torneos.html">← Volver a torneos</a>
      <section class="access-gate surface-card">
        <span class="access-lock" aria-hidden="true">?</span>
        <p class="section-eyebrow">Consulta pública</p>
        <h1>TORNEO NO ENCONTRADO</h1>
        <p>La competencia solicitada no existe o todavía no fue publicada.</p>
        <div class="card-actions"><a class="btn-primary" href="torneos.html">Buscar torneos</a><a class="btn-secondary" href="index.html">Volver al inicio</a></div>
      </section>`;
  };

  if (!id) { showNotFound(); return; }

  const ESTADOS = { solicitado: 'Solicitud pendiente', rechazado: 'Solicitud rechazada', planificado: 'Próximamente', inscripcion_abierta: 'Inscripciones Abiertas', inscripcion_cerrada: 'Inscripciones Cerradas', en_curso: 'En Curso', finalizado: 'Finalizado', cancelado: 'Cancelado' };
  const FORMATOS = { liga: 'Liga', eliminacion: 'Eliminación Directa', suizo: 'Sistema Suizo' };
  const set = (elementId, value) => { const el = document.getElementById(elementId); if (el) el.textContent = value; };

  fetch(`api/torneo.php?id=${encodeURIComponent(id)}`)
    .then(response => response.json())
    .then(data => {
      if (!data.success) { showNotFound(); return; }
      const t = data.torneo;

      document.title = `${t.nombre} – Lidenskap`;
      set('detailStatus', ESTADOS[t.estado] || t.estado);
      set('detailDisciplineTag', t.disciplinaNombre || 'Personalizada');
      set('detailTitle', t.nombre);
      set('detailSubtitle', `Organizado por: ${t.organizador}`);
      set('detailDescription', t.descripcion || 'Sin descripción.');
      set('detailFormat', FORMATOS[t.formato] || t.formatoNombre);
      set('detailVenue', t.sede || 'A definir');
      set('detailStartDate', t.fechaInicio
        ? new Date(`${t.fechaInicio}T12:00:00`).toLocaleDateString('es-UY', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'A definir');
      set('detailCapacity', t.cupoMaximo ? `${t.cupoMaximo} Equipos/Participantes` : 'Sin límite');

      const confirmados = t.inscriptos.filter(i => i.estado === 'confirmada');
      set('currentTeamsCount', String(confirmados.length));
      set('maxTeamsCount', t.cupoMaximo !== null ? String(t.cupoMaximo) : '—');
      set('detailTeamSize', t.maxIntegrantesEquipo ? `Hasta ${t.maxIntegrantesEquipo}` : 'Sin límite');

      const miRol = sesionUsuario?.rolesTorneo?.find(item => item.idTorneo === t.id);
      const abiertas = t.estado === 'inscripcion_abierta';
      const cupoLleno = t.cupoMaximo !== null && confirmados.length >= t.cupoMaximo;
      const gestiona = Boolean(sesionUsuario) && (sesionUsuario.rol === 'ADMIN' || hasTorneoRole(t.id, 'ORGANIZADOR'));
      const puedePedir = sesionUsuario?.rol === 'PUBLICO' && !miRol;

      // Inscriptos confirmados: los participantes individuales y los equipos
      // (con cuántos integrantes tienen). Un Usuario público puede pedir
      // unirse a un equipo que no está completo; lo resuelve el Organizador.
      const teamsList = document.getElementById('teamsList');
      const renderInscriptos = equipos => {
        if (!teamsList) return;
        const individuales = confirmados.filter(i => i.tipo === 'participante')
          .map(i => `<li><span class="team-bullet">👤</span> ${escapeHtml(i.nombre)}</li>`);
        const deEquipo = equipos.map(e => {
          const completo = t.maxIntegrantesEquipo !== null && e.integrantes >= t.maxIntegrantesEquipo;
          const unirse = puedePedir && abiertas && !completo
            ? ` <button class="table-action" type="button" data-join-team="${e.id}">Solicitar unirme</button>` : '';
          return `<li><span class="team-bullet">🛡️</span> ${escapeHtml(e.nombre)} <small>${e.integrantes}${t.maxIntegrantesEquipo ? ` / ${t.maxIntegrantesEquipo}` : ''} integrantes</small>${unirse}</li>`;
        });
        teamsList.innerHTML = [...deEquipo, ...individuales].join('') || '<li>Todavía no hay inscriptos confirmados.</li>';
      };
      renderInscriptos([]);
      fetch(`api/equipos.php?idTorneo=${t.id}`)
        .then(response => response.json())
        .then(data => renderInscriptos(data.success ? data.equipos : []));
      teamsList?.addEventListener('click', async event => {
        const button = event.target.closest('[data-join-team]');
        if (!button) return;
        button.disabled = true;
        const response = await fetch('api/equipos.php', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accion: 'unirse', idEquipo: Number(button.dataset.joinTeam) }),
        });
        const data = await response.json();
        if (!data.success) { alert(data.error || 'No se pudo enviar la solicitud.'); button.disabled = false; return; }
        teamsList.querySelectorAll('[data-join-team]').forEach(item => { item.disabled = true; });
        button.textContent = 'Solicitud enviada';
      });

      const registerBtn = document.getElementById('btnRegisterInDetail');
      const refereeBtn = document.getElementById('btnRefereeInDetail');
      const registerAs = document.getElementById('registerAs');
      const solicitar = async (tipo, button) => {
        button.disabled = true;
        const idEquipo = tipo === 'participar' ? Number(registerAs.value) || 0 : 0;
        try {
          const response = await fetch('api/solicitudes.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo, idTorneo: t.id, idEquipo }),
          });
          const data = await response.json();
          if (!data.success) { alert(data.error || 'No se pudo enviar la solicitud.'); button.disabled = false; return; }
          button.textContent = 'Solicitud enviada';
          registerBtn.disabled = true;
          refereeBtn.disabled = true;
          document.getElementById('registerAsField').hidden = true;
        } catch {
          alert('No se pudo conectar con el servidor. Intentá de nuevo.');
          button.disabled = false;
        }
      };
      if (registerBtn) {
        if (!sesionUsuario) {
          registerBtn.textContent = 'Iniciar sesión para inscribirme';
          registerBtn.addEventListener('click', () => openAuthModal('login', `detalle-torneo.html?id=${t.id}`));
        } else if (gestiona) {
          registerBtn.textContent = 'Gestionar solicitudes';
          registerBtn.addEventListener('click', () => { window.location.href = 'panel.html#panel-requests'; });
        } else if (miRol) {
          registerBtn.textContent = `Sos ${ROL_LABEL[miRol.rol]} de este torneo`;
          registerBtn.disabled = true;
        } else {
          registerBtn.hidden = !abiertas;
          if (abiertas && cupoLleno) {
            registerBtn.textContent = 'Cupo completo';
            registerBtn.disabled = true;
          } else if (abiertas) {
            registerBtn.textContent = 'Solicitar participar';
            registerBtn.addEventListener('click', () => solicitar('participar', registerBtn));
            // Equipos que creé y no están jugando otro torneo: puedo anotarlos
            fetch('api/equipos.php?mios=1')
              .then(response => response.json())
              .then(data => {
                const libres = (data.success ? data.equipos : []).filter(e => e.soyCapitan && !e.torneo);
                if (!libres.length) return;
                registerAs.innerHTML = '<option value="">Yo (individual)</option>' + libres.map(e => `<option value="${e.id}">Equipo ${escapeHtml(e.nombre)}</option>`).join('');
                document.getElementById('registerAsField').hidden = false;
              });
          }
          refereeBtn.hidden = !['planificado', 'inscripcion_abierta', 'inscripcion_cerrada'].includes(t.estado);
          refereeBtn.addEventListener('click', () => solicitar('arbitrar', refereeBtn));
        }
      }

      // Fases de inscripción (RF-08): el Organizador las abre y las cierra.
      const phaseBtn = document.getElementById('btnPhaseInDetail');
      const FASES = {
        planificado: ['abrir_inscripciones', 'Abrir inscripciones', '¿Abrir las inscripciones? Desde ahora los usuarios pueden pedir participar.'],
        inscripcion_abierta: ['cerrar_inscripciones', 'Cerrar inscripciones', '¿Cerrar las inscripciones? Las solicitudes e invitaciones sin resolver se rechazan solas y se sortea el orden de los confirmados.'],
        en_curso: ['finalizar', 'Finalizar torneo', FINALIZAR_PREGUNTA],
      };
      if (phaseBtn && gestiona && FASES[t.estado]) {
        const [accion, texto, pregunta] = FASES[t.estado];
        phaseBtn.textContent = texto;
        phaseBtn.hidden = false;
        phaseBtn.addEventListener('click', async () => {
          if (!window.confirm(pregunta)) return;
          phaseBtn.disabled = true;
          const response = await fetch(`api/torneo.php?id=${t.id}&accion=${accion}`, { method: 'PATCH' });
          const data = await response.json();
          if (!data.success) { alert(data.error || 'No se pudo cambiar la fase.'); phaseBtn.disabled = false; return; }
          window.location.reload();
        });
      }

      // Fixture, tabla y llaves (consulta pública, RF-18): solo resultados
      // validados, salvo para el Organizador y el árbitro de cada partido.
      fetch(`api/rondas.php?idTorneo=${t.id}`)
        .then(response => response.json())
        .then(data => {
          if (!data.success || !data.rondas.length) return;
          document.getElementById('detailFixtureCard').hidden = false;
          const campeon = document.getElementById('detailChampion');
          if (data.campeon) {
            campeon.innerHTML = `<span class="champion-banner">🏆 Campeón: ${escapeHtml(data.campeon)}</span>`;
            campeon.hidden = false;
          }
          document.getElementById('detailStandings').innerHTML = data.tabla.length ? tablaPosicionesHtml(data.tabla) : '';
          const rondasEl = document.getElementById('detailRounds');
          if (data.torneo.formato === 'liga') {
            rondasEl.innerHTML = data.rondas.map(ronda => `<section class="round-block"><header><strong>${nombreRonda(data.torneo.formato, ronda)}${ronda.fecha ? ` · ${ronda.fecha}` : ''}</strong></header><div class="bracket">${ronda.partidos.map(p => partidoHtml(p)).join('')}</div></section>`).join('');
          } else {
            rondasEl.innerHTML = (data.torneo.formato === 'eliminacion' ? LEYENDA_LLAVE : '<p class="helper-text">Etapa suiza: cada partido es una serie al mejor de 3. Con ' + data.umbral + ' victorias se clasifica y con ' + data.umbral + ' derrotas queda eliminado.</p>') + '<div class="detail-bracket"></div>';
            dibujarLlave(rondasEl.querySelector('.detail-bracket'), data);
          }
        });

      const deleteBtn = document.getElementById('btnDeleteTournament');
      if (deleteBtn && sesionUsuario?.rol === 'ADMIN') {
        deleteBtn.hidden = false;
        deleteBtn.addEventListener('click', async () => {
          if (!window.confirm(`¿Eliminar "${t.nombre}"? Esta acción no se puede deshacer.`)) return;
          deleteBtn.disabled = true;
          try {
            const response = await fetch(`api/torneo.php?id=${t.id}`, { method: 'DELETE' });
            const data = await response.json();
            if (!data.success) { alert(data.error || 'No se pudo eliminar el torneo.'); deleteBtn.disabled = false; return; }
            window.location.href = 'torneos.html';
          } catch {
            alert('No se pudo conectar con el servidor. Intentá de nuevo.');
            deleteBtn.disabled = false;
          }
        });
      }
    })
    .catch(showNotFound);
}

function initializeContactPrototype() {
  const form = document.getElementById('contactPrototypeForm');
  if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    document.getElementById('contactPrototypeFeedback').textContent = 'Mensaje validado en el prototipo. El envío se implementará en una próxima entrega.';
  });
}

function initializeProfileEditor() {
  if (document.body.dataset.page !== 'profile' || !sesionUsuario) return;
  const profileData = {
    ADMIN: {
      subtitle: 'Acceso completo al sistema · Administración general',
      stats: [['Torneos activos', 'torneosActivos'], ['Usuarios activos', 'usuarios'], ['Solicitudes pendientes', 'solicitudesPendientes'], ['Eventos de auditoría', 'eventosAuditoria']],
      extras: [['Nivel de acceso', 'Control completo'], ['Ámbito', 'Todo el sistema']],
      activityTitle: 'GESTIÓN PENDIENTE',
      activity: []
    },
    // Organizador/Árbitro/Participante no son roles de la cuenta: un Usuario
    // público los tiene en torneos puntuales (se listan abajo, desde la API).
    PUBLICO: {
      subtitle: 'Cuenta personal · Tus roles dependen de cada torneo',
      stats: [['Torneos jugados', 'torneosJugados'], ['Partidos ganados', 'partidosGanados'], ['Torneos organizados', 'torneosOrganizados'], ['Partidos arbitrados', 'partidosArbitrados']],
      extras: [['Nivel de acceso', 'Según cada torneo'], ['Ámbito', 'Torneos donde tenés un rol']],
      activityTitle: 'MIS TORNEOS Y SOLICITUDES',
      activity: []
    }
  }[sesionUsuario.rol === 'ADMIN' ? 'ADMIN' : 'PUBLICO'];

  let storedProfile = {};
  try { storedProfile = JSON.parse(localStorage.getItem(`lidenskap-profile-${sesionUsuario.email}`) || '{}'); } catch { storedProfile = {}; }
  const displayName = storedProfile.nombre || sesionUsuario.nombre;
  document.getElementById('profileContent').hidden = false;
  document.getElementById('profileInitials').textContent = sesionUsuario.iniciales;
  document.getElementById('profileRole').textContent = sesionUsuario.rolNombre;
  document.getElementById('profileHeading').textContent = displayName.toUpperCase();
  document.getElementById('profileSubtitle').textContent = profileData.subtitle;
  document.getElementById('profileEmail').textContent = sesionUsuario.email;
  // Estadísticas reales (api/perfil.php); cada stat dice qué dato mostrar
  profileData.stats.forEach(([label], index) => {
    document.getElementById(`statLabel${index + 1}`).textContent = label;
    document.getElementById(`statValue${index + 1}`).textContent = '…';
  });
  fetch('api/perfil.php')
    .then(response => response.json())
    .then(data => {
      if (!data.success) return;
      const e = data.estadisticas;
      profileData.stats.forEach(([, clave], index) => { document.getElementById(`statValue${index + 1}`).textContent = e[clave]; });
      if (sesionUsuario.rol === 'ADMIN') {
        const pendientes = [
          ['status-progress', 'Resultados', 'Resultados sin validar', `${e.resultadosSinValidar} en todos los torneos`, 'panel.html#panel-results'],
          ['status-progress', 'Solicitudes', 'Solicitudes pendientes', `${e.solicitudesPendientes} para resolver`, 'panel.html#panel-requests'],
          ['status-open', 'Sistema', 'Usuarios y roles', `${e.usuarios} cuentas activas`, 'panel.html#panel-users'],
          ['status-closed', 'Auditoría', 'Registro de actividad', `${e.eventosAuditoria} eventos registrados`, 'panel.html#panel-audit'],
        ];
        document.getElementById('profileActivity').innerHTML = pendientes.map(([status, badge, title, subtitle, href]) => `<a href="${href}"><span class="status-pill ${status}">${badge}</span><div><strong>${title}</strong><small>${subtitle}</small></div><span>→</span></a>`).join('');
      }
    });
  document.getElementById('profileExtraLabel1').textContent = profileData.extras[0][0];
  document.getElementById('profileExtraValue1').textContent = profileData.extras[0][1];
  document.getElementById('profileExtraLabel2').textContent = profileData.extras[1][0];
  document.getElementById('profileExtraValue2').textContent = profileData.extras[1][1];
  document.getElementById('profileActivityTitle').textContent = profileData.activityTitle;
  document.getElementById('profileActivity').innerHTML = profileData.activity.map(([status, badge, title, subtitle, href]) => `<a href="${href}"><span class="status-pill ${status}">${badge}</span><div><strong>${title}</strong><small>${subtitle}</small></div><span>→</span></a>`).join('');
  const rolesTorneo = sesionUsuario.rolesTorneo || [];
  document.getElementById('profileRoleDetail').textContent = [sesionUsuario.rolNombre, ...rolesTorneo.map(item => `${ROL_LABEL[item.rol]} de ${item.torneo}`)].join(' · ');

  // Usuario público: sus roles por torneo, el estado de cada solicitud y las
  // invitaciones del Organizador (las acepta o rechaza desde acá). Un rol
  // aprobado de un torneo que ya terminó figura como "Finalizado".
  if (sesionUsuario.rol !== 'ADMIN') {
    const ESTADO_SOLICITUD = { pendiente: ['status-progress', 'Pendiente'], invitada: ['status-progress', 'Invitación'], aprobada: ['status-open', 'Vigente'], rechazada: ['status-closed', 'Rechazada'] };
    const activity = document.getElementById('profileActivity');
    const cargarSolicitudes = () => fetch('api/solicitudes.php?ambito=mias')
      .then(response => response.json())
      .then(data => {
        const filas = data.success ? data.solicitudes : [];
        activity.innerHTML = filas.length
          ? filas.map(s => {
            const [pill, label] = s.estado === 'aprobada' && !s.activo ? ['status-closed', 'Finalizado'] : ESTADO_SOLICITUD[s.estado];
            const detalle = `${ROL_LABEL[s.rol]}${s.equipo ? ` · equipo ${escapeHtml(s.equipo)}` : ''}`;
            const textos = `<span class="status-pill ${pill}">${label}</span><div><strong>${escapeHtml(s.torneo)}</strong><small>${detalle}</small></div>`;
            if (s.estado !== 'invitada') return `<a href="detalle-torneo.html?id=${s.idTorneo}">${textos}<span>→</span></a>`;
            const datos = `data-invite-tipo="${s.tipo}" data-invite-id="${s.id}" data-invite-equipo="${s.idEquipo || 0}"`;
            return `<article class="profile-row">${textos}<span class="table-actions"><button class="table-action" type="button" data-invite-action="aprobar" ${datos}>Aceptar</button><button class="table-action danger-action" type="button" data-invite-action="rechazar" ${datos}>Rechazar</button></span></article>`;
          }).join('')
          : '<p>Todavía no tenés roles ni solicitudes. Buscá un torneo para participar o arbitrar, o solicitá crear el tuyo.</p>';
      });
    activity.addEventListener('click', async event => {
      const button = event.target.closest('[data-invite-action]');
      if (!button) return;
      const { inviteAction: accion, inviteTipo: tipo, inviteId: id, inviteEquipo: idEquipo } = button.dataset;
      if (accion === 'rechazar' && !window.confirm('¿Rechazar esta invitación?')) return;
      button.disabled = true;
      const response = await fetch('api/solicitudes.php', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, id: Number(id), idEquipo: Number(idEquipo), accion }),
      });
      const result = await response.json();
      if (!result.success) { alert(result.error || 'No se pudo responder la invitación.'); button.disabled = false; return; }
      // Aceptar cambia los roles de la sesión: se recarga para traerlos
      if (accion === 'aprobar') window.location.reload(); else cargarSolicitudes();
    });
    cargarSolicitudes();

    // Mis equipos: crear uno, ver su plantel y salir de un equipo
    const teamsSection = document.getElementById('profileTeams');
    const teamsList = document.getElementById('profileTeamsList');
    const teamsFeedback = document.getElementById('teamsFeedback');
    const ESTADO_INTEGRANTE = { solicitada: ' (pidió unirse)', invitada: ' (invitado/a)', aceptada: '' };
    const cargarEquipos = () => fetch('api/equipos.php?mios=1')
      .then(response => response.json())
      .then(data => {
        const equipos = data.success ? data.equipos : [];
        teamsList.innerHTML = equipos.length
          ? equipos.map(e => {
            const [pill, label] = e.torneo ? ['status-open', 'En torneo'] : ['status-closed', 'Sin torneo'];
            const torneo = e.torneo
              ? `Juega ${escapeHtml(e.torneo.nombre)}${e.torneo.inscripcion === 'pendiente' ? ' (inscripción pendiente)' : ''}${e.torneo.maxIntegrantes ? ` · hasta ${e.torneo.maxIntegrantes} integrantes` : ''}`
              : (e.soyCapitan ? 'Anotalo desde el detalle de un torneo con las inscripciones abiertas.' : 'Todavía no está anotado en un torneo.');
            const integrantes = e.integrantes.map(i => `${escapeHtml(i.nombre)}${i.esCapitan ? ' (capitán/a)' : ''}${ESTADO_INTEGRANTE[i.estado]}`).join(', ');
            const yo = e.integrantes.find(i => i.soyYo && i.estado === 'aceptada');
            const plantelAbierto = !e.torneo || ['planificado', 'inscripcion_abierta'].includes(e.torneo.estado);
            const salir = yo && plantelAbierto ? `<button class="table-action danger-action" type="button" data-leave-team="${e.id}" data-leave-participant="${yo.idParticipante}">Salir</button>` : '';
            return `<article class="profile-row"><span class="status-pill ${pill}">${label}</span><div><strong>${escapeHtml(e.nombre)}${e.soyCapitan ? ' · Capitán/a' : ''}</strong><small>${torneo}</small><small>Integrantes: ${integrantes || '—'}</small></div><span class="table-actions">${salir}</span></article>`;
          }).join('')
          : '<p>Todavía no estás en ningún equipo. Creá uno, o pedí unirte a un equipo desde el detalle de un torneo.</p>';
      });
    teamsSection.hidden = false;
    document.getElementById('teamCreateForm').addEventListener('submit', async event => {
      event.preventDefault();
      const input = document.getElementById('teamCreateName');
      const response = await fetch('api/equipos.php', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'crear', nombre: input.value.trim() }),
      });
      const result = await response.json();
      teamsFeedback.textContent = result.success ? 'Equipo creado.' : (result.error || 'No se pudo crear el equipo.');
      if (result.success) { input.value = ''; cargarEquipos(); }
    });
    teamsList.addEventListener('click', async event => {
      const button = event.target.closest('[data-leave-team]');
      if (!button || !window.confirm('¿Salir de este equipo?')) return;
      button.disabled = true;
      const response = await fetch(`api/equipos.php?idEquipo=${button.dataset.leaveTeam}&idParticipante=${button.dataset.leaveParticipant}`, { method: 'DELETE' });
      const result = await response.json();
      teamsFeedback.textContent = result.success ? 'Saliste del equipo.' : (result.error || 'No se pudo salir del equipo.');
      cargarEquipos();
    });
    cargarEquipos();
  }

  const editor = document.getElementById('profileEditor');
  const edit = document.getElementById('editProfile');
  if (!editor || !edit) return;
  edit.hidden = !hasPermission('edit_profile');
  document.getElementById('profileName').value = displayName;
  document.getElementById('profilePhone').value = storedProfile.telefono || '';
  document.getElementById('profileBio').value = storedProfile.presentacion || '';
  edit.addEventListener('click', () => { editor.hidden = false; editor.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  document.getElementById('cancelProfileEdit')?.addEventListener('click', () => { editor.hidden = true; });
  document.getElementById('profileForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const updated = { nombre: document.getElementById('profileName').value.trim(), telefono: document.getElementById('profilePhone').value.trim(), presentacion: document.getElementById('profileBio').value.trim() };
    localStorage.setItem(`lidenskap-profile-${sesionUsuario.email}`, JSON.stringify(updated));
    document.getElementById('profileHeading').textContent = updated.nombre.toUpperCase();
    document.getElementById('profileFeedback').textContent = 'Cambios guardados en este dispositivo.';
  });
  document.getElementById('profileLogout')?.addEventListener('click', cerrarSesion);
}

function initializeDashboardByRole() {
  if (document.body.dataset.page !== 'dashboard' || !sesionUsuario) return;
  if (!document.getElementById('dashboardTitle')) return;
  const isAdmin = sesionUsuario.rol === 'ADMIN';
  const isOrganizer = hasPermission('manage_tournaments');
  // Admin: todo. Organizador: lo de sus torneos. Solo Árbitro: resultados.
  const allowedModules = isAdmin
    ? ['users', 'requests', 'tournaments', 'participants', 'results', 'rounds', 'reports', 'audit', 'settings']
    : isOrganizer ? ['requests', 'tournaments', 'participants', 'results', 'rounds', 'reports'] : ['results'];
  const rolesTexto = (sesionUsuario.rolesTorneo || []).map(item => `${ROL_LABEL[item.rol]} · ${item.torneo}`).join(' / ');
  document.getElementById('dashboardRole').textContent = isAdmin ? sesionUsuario.rolNombre : rolesTexto;
  document.getElementById('dashboardTitle').textContent = isAdmin ? 'PANEL GENERAL' : 'MIS TORNEOS';
  document.getElementById('dashboardDescription').textContent = isAdmin ? 'Control completo de usuarios, solicitudes, torneos, resultados, reportes y auditoría.' : 'Gestión limitada a los torneos donde tenés un rol asignado.';
  document.querySelectorAll('[data-admin-only]').forEach(element => {
    if (!element.hasAttribute('data-panel-module')) element.hidden = !isAdmin;
  });
  document.querySelectorAll('.module-card[data-panel-target]').forEach(card => {
    card.hidden = !allowedModules.includes(card.dataset.panelTarget);
  });
  document.body.classList.toggle('organizer-panel', !isAdmin);

  const overview = document.getElementById('dashboardOverview');
  const modules = [...document.querySelectorAll('[data-panel-module]')];
  const showOverview = () => {
    modules.forEach(module => { module.hidden = true; });
    overview.hidden = false;
    if (window.location.hash.startsWith('#panel-')) history.replaceState(null, '', 'panel.html');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const openModule = (name, updateHash = true) => {
    if (!allowedModules.includes(name)) return;
    overview.hidden = true;
    modules.forEach(module => { module.hidden = module.dataset.panelModule !== name; });
    if (updateHash) history.replaceState(null, '', `#panel-${name}`);
    document.getElementById(`panel-${name}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  document.querySelectorAll('[data-panel-target]').forEach(control => {
    control.addEventListener('click', event => {
      event.preventDefault();
      openModule(control.dataset.panelTarget);
    });
  });
  document.querySelectorAll('[data-panel-back]').forEach(control => control.addEventListener('click', showOverview));

  const showToast = message => {
    const toast = document.getElementById('panelToast');
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { toast.hidden = true; }, 2800);
  };
  const panelFormModal = document.getElementById('panelFormModal');
  const panelRecordForm = document.getElementById('panelRecordForm');
  const closePanelForm = () => {
    panelFormModal.classList.remove('active');
    panelFormModal.setAttribute('aria-hidden', 'true');
  };
  const openPanelForm = ({ title, help, fields, submitLabel = 'Guardar cambios', values = {}, onSubmit }) => {
    document.getElementById('panelFormTitle').textContent = title;
    document.getElementById('panelFormHelp').textContent = help;
    panelRecordForm.innerHTML = fields.map(field => {
      const value = values[field.name] ?? '';
      if (field.type === 'select') {
        // option puede ser un texto o { value, label }
        const optionsHtml = field.options.map(option => {
          const { value: optionValue, label } = typeof option === 'object' ? option : { value: option, label: option };
          return `<option value="${optionValue}"${String(optionValue) === String(value) ? ' selected' : ''}>${label}</option>`;
        }).join('');
        return `<div class="field ${field.full ? 'field-full' : ''}"><label for="panel-${field.name}">${field.label}</label><select id="panel-${field.name}" name="${field.name}" ${field.required === false ? '' : 'required'}>${optionsHtml}</select></div>`;
      }
      const inputHtml = `<input id="panel-${field.name}" name="${field.name}" type="${field.type || 'text'}" value="${value}" ${field.required === false ? '' : 'required'}>`;
      if (field.type === 'password') {
        return `<div class="field ${field.full ? 'field-full' : ''}"><label for="panel-${field.name}">${field.label}</label><div class="password-field">${inputHtml}${passwordToggleButtonHtml()}</div></div>`;
      }
      return `<div class="field ${field.full ? 'field-full' : ''}"><label for="panel-${field.name}">${field.label}</label>${inputHtml}</div>`;
    }).join('') + `<div class="form-actions field-full"><button class="btn-primary" type="submit">${submitLabel}</button><button class="btn-secondary" type="button" data-cancel-panel-form>Cancelar</button></div>`;
    panelRecordForm.onsubmit = event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(panelRecordForm).entries());
      onSubmit(data);
      closePanelForm();
    };
    panelRecordForm.querySelector('[data-cancel-panel-form]').addEventListener('click', closePanelForm);
    panelFormModal.classList.add('active');
    panelFormModal.setAttribute('aria-hidden', 'false');
    panelRecordForm.querySelector('input, select')?.focus();
  };
  document.getElementById('closePanelForm')?.addEventListener('click', closePanelForm);
  panelFormModal?.addEventListener('click', event => { if (event.target === panelFormModal) closePanelForm(); });

  const normalize = value => String(value).toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const paginate = ({ rows, tbody, count, pageLabel, prev, next, search, filter, pageSize = 12, renderRow }) => {
    let page = 1;
    const render = () => {
      const query = normalize(search?.value || '');
      const filterValue = filter?.value || '';
      const visible = rows.filter(row => (!query || normalize(Object.values(row).join(' ')).includes(query)) && (!filterValue || row.status === filterValue));
      const pages = Math.max(1, Math.ceil(visible.length / pageSize));
      page = Math.min(page, pages);
      const start = (page - 1) * pageSize;
      tbody.innerHTML = visible.slice(start, start + pageSize).map(renderRow).join('');
      count.textContent = visible.length ? `Mostrando ${start + 1}–${Math.min(start + pageSize, visible.length)} de ${visible.length} registros` : 'No se encontraron registros.';
      pageLabel.textContent = `Página ${page} de ${pages}`;
      prev.disabled = page === 1;
      next.disabled = page === pages || visible.length === 0;
    };
    search?.addEventListener('input', () => { page = 1; render(); });
    filter?.addEventListener('change', () => { page = 1; render(); });
    prev.addEventListener('click', () => { if (page > 1) { page -= 1; render(); } });
    next.addEventListener('click', () => { page += 1; render(); });
    render();
  };


  if (isAdmin) {
    let users = [];

    const renderUsers = () => {
      const query = normalize(document.getElementById('usersSearch').value);
      const visible = users.filter(user => !query || normalize(Object.values(user).join(' ')).includes(query));
      document.getElementById('usersCount').textContent = `${visible.length} de ${users.length} usuarios`;
      document.getElementById('usersTableBody').innerHTML = visible.map(user => `<tr><td><strong>${escapeHtml(`${user.nombre} ${user.apellido}`)}</strong></td><td>${escapeHtml(user.email)}</td><td>${ROL_LABEL[user.rol] || user.rol}${user.rolesTorneo.map(item => `<br><small>${ROL_LABEL[item.rol]} · ${escapeHtml(item.torneo)}</small>`).join('')}</td><td><span class="status-pill ${user.estado === 'activo' ? 'status-open' : 'status-closed'}">${user.estado}</span></td><td><div class="table-actions"><button class="table-action" type="button" data-user-edit="${user.id}">Editar</button>${user.id === sesionUsuario.id_usuario || user.estado !== 'activo' ? '' : `<button class="table-action danger-action" type="button" data-user-delete="${user.id}">Desactivar</button>`}</div></td></tr>`).join('');
    };

    const cargarUsuarios = () => fetch('api/usuarios.php')
      .then(response => response.json())
      .then(data => { users = data.success ? data.usuarios : []; renderUsers(); });

    document.getElementById('usersSearch').addEventListener('input', renderUsers);
    document.getElementById('usersTableBody').addEventListener('click', event => {
      const editButton = event.target.closest('[data-user-edit]');
      const deleteButton = event.target.closest('[data-user-delete]');
      if (editButton) {
        const user = users.find(item => item.id === Number(editButton.dataset.userEdit));
        openPanelForm({
          title: 'EDITAR USUARIO', help: 'Actualiza los datos básicos y el rol de la cuenta. Los roles por torneo se asignan desde cada torneo.',
          fields: [{ name: 'nombre', label: 'Nombre' }, { name: 'apellido', label: 'Apellido' }, { name: 'email', label: 'Correo', type: 'email' }, { name: 'rol', label: 'Rol de la cuenta', type: 'select', options: ['ADMIN', 'PUBLICO'].map(code => ({ value: code, label: ROL_LABEL[code] })), full: true }],
          values: user,
          onSubmit: data => {
            fetch(`api/usuario.php?id=${user.id}`, {
              method: 'PUT', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ nombre: data.nombre, apellido: data.apellido, email: data.email, rol: data.rol }),
            })
              .then(response => response.json())
              .then(result => { showToast(result.success ? 'Usuario actualizado.' : result.error); if (result.success) cargarUsuarios(); });
          }
        });
      }
      if (deleteButton) {
        const user = users.find(item => item.id === Number(deleteButton.dataset.userDelete));
        if (user && window.confirm(`¿Desactivar la cuenta ${user.email}?`)) {
          fetch(`api/usuario.php?id=${user.id}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(result => { showToast(result.success ? 'Usuario desactivado.' : result.error); if (result.success) cargarUsuarios(); });
        }
      }
    });
    document.querySelector('[data-panel-form="user"]')?.addEventListener('click', () => openPanelForm({
      title: 'CREAR USUARIO', help: 'Organizador, Árbitro y Participante son roles de un torneo: elegí en cuál (un Participante también puede ir directo a un equipo; el torneo es el del equipo). La cuenta queda como Usuario público y el rol se le quita cuando el torneo termina. La contraseña inicial se la comunicás vos a la persona.',
      fields: [
        { name: 'nombre', label: 'Nombre' }, { name: 'apellido', label: 'Apellido' },
        { name: 'email', label: 'Correo', type: 'email' }, { name: 'password', label: 'Contraseña inicial', type: 'password' },
        { name: 'rol', label: 'Rol', type: 'select', options: ['ORGANIZADOR', 'ARBITRO', 'PARTICIPANTE', 'ADMIN'].map(code => ({ value: code, label: ROL_LABEL[code] })) },
        { name: 'idTorneo', label: 'Torneo', type: 'select', required: false, options: [{ value: '', label: 'Ninguno (solo para Administrador)' }, ...torneosReales.filter(t => ['planificado', 'inscripcion_abierta', 'inscripcion_cerrada', 'en_curso'].includes(t.estado)).map(t => ({ value: t.id, label: escapeHtml(t.nombre) }))] },
        { name: 'idEquipo', label: 'Equipo (solo Participante)', type: 'select', required: false, options: [{ value: '', label: 'Ninguno' }, ...inscripciones.filter(i => i.tipo === 'equipo' && ['pendiente', 'confirmada'].includes(i.estado) && ['planificado', 'inscripcion_abierta'].includes(i.estadoTorneo)).map(i => ({ value: i.idEquipo, label: `${escapeHtml(i.nombre)} (${escapeHtml(i.torneo)})` }))] },
      ],
      onSubmit: data => {
        fetch('api/usuarios.php', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, idTorneo: Number(data.idTorneo) || 0, idEquipo: Number(data.idEquipo) || 0 }),
        })
          .then(response => response.json())
          .then(result => { showToast(result.success ? 'Usuario creado.' : result.error); if (result.success) cargarUsuarios(); });
      }
    }));
    cargarUsuarios();
  }

  if (!isAdmin) document.getElementById('tournamentsScope').textContent = 'Solo se muestran las competencias que organizás vos.';

  let torneosReales = [];
  const renderTournaments = () => {
    const query = normalize(document.getElementById('panelTournamentSearch').value);
    const propios = isAdmin ? torneosReales : torneosReales.filter(t => t.organizadorId === sesionUsuario.id_usuario);
    const visible = propios.filter(t => !query || normalize(`${t.nombre} ${t.disciplinaNombre || ''}`).includes(query));
    document.getElementById('panelTournamentsCount').textContent = `${visible.length} torneo${visible.length === 1 ? '' : 's'}`;
    document.getElementById('panelTournamentsBody').innerHTML = visible.map(t => {
      const estadoUi = ESTADO_TORNEO_A_UI[t.estado] || 'cerrado';
      const cupos = t.cupoMaximo ? `${t.inscriptos} / ${t.cupoMaximo}` : `${t.inscriptos}`;
      return `<tr><td><strong>${escapeHtml(t.nombre)}</strong></td><td>${escapeHtml(t.disciplinaNombre || 'Personalizada')}</td><td>${t.fechaInicio || 'A definir'}</td><td>${cupos}</td><td><span class="status-pill ${statusClass(estadoUi)}">${ESTADO_UI_LABEL[estadoUi]}</span></td><td><a class="table-action" href="detalle-torneo.html?id=${t.id}">Gestionar</a></td></tr>`;
    }).join('');
  };
  document.getElementById('panelTournamentSearch').addEventListener('input', renderTournaments);
  const cargarTorneos = () => fetch('api/torneos.php').then(response => response.json()).then(data => { torneosReales = data.success ? data.torneos : []; renderTournaments(); });
  const torneosListos = cargarTorneos();

  // Solicitudes pendientes: el Admin ve todas (incluidas las de crear torneo);
  // el Organizador, las de árbitro/participante de sus torneos.
  if (allowedModules.includes('requests')) {
    const TIPO_SOLICITUD = { crear_torneo: 'Crear torneo', arbitrar: 'Arbitrar', participar: 'Participar', unirse_equipo: 'Unirse a equipo' };
    let solicitudes = [];
    const renderRequests = () => {
      document.getElementById('requestsCount').textContent = solicitudes.length
        ? `${solicitudes.length} solicitud${solicitudes.length === 1 ? '' : 'es'} pendiente${solicitudes.length === 1 ? '' : 's'}`
        : 'No hay solicitudes pendientes.';
      document.getElementById('requestsTableBody').innerHTML = solicitudes.map(s => {
        const datos = `data-request-tipo="${s.tipo}" data-request-id="${s.id}" data-request-equipo="${s.idEquipo || 0}"`;
        const equipo = s.equipo ? `<br><small>Equipo ${escapeHtml(s.equipo)}</small>` : '';
        return `<tr><td><strong>${TIPO_SOLICITUD[s.tipo]}</strong></td><td>${escapeHtml(s.solicitante)}<br><small>${escapeHtml(s.email)}</small></td><td><a href="detalle-torneo.html?id=${s.idTorneo}">${escapeHtml(s.torneo)}</a>${equipo}</td><td><div class="table-actions"><button class="table-action" type="button" data-request-action="aprobar" ${datos}>Aprobar</button><button class="table-action danger-action" type="button" data-request-action="rechazar" ${datos}>Rechazar</button></div></td></tr>`;
      }).join('');
    };
    const cargarSolicitudes = () => fetch('api/solicitudes.php')
      .then(response => response.json())
      .then(data => { solicitudes = data.success ? data.solicitudes : []; renderRequests(); });
    document.getElementById('requestsTableBody').addEventListener('click', event => {
      const button = event.target.closest('[data-request-action]');
      if (!button) return;
      const { requestAction: accion, requestTipo: tipo, requestId: id, requestEquipo: idEquipo } = button.dataset;
      if (accion === 'rechazar' && !window.confirm('¿Rechazar esta solicitud?')) return;
      button.disabled = true;
      fetch('api/solicitudes.php', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, id: Number(id), idEquipo: Number(idEquipo), accion }),
      })
        .then(response => response.json())
        .then(result => {
          showToast(result.success ? (accion === 'aprobar' ? 'Solicitud aprobada.' : 'Solicitud rechazada.') : result.error);
          cargarSolicitudes();
          if (result.success && tipo !== 'crear_torneo' && allowedModules.includes('participants')) cargarInscripciones();
          if (result.success && tipo === 'crear_torneo') cargarTorneos();
        });
    });
    cargarSolicitudes();
  }

  // Participantes y equipos: inscripciones reales de mis torneos (Admin:
  // todos), desde api/inscripciones.php. El Organizador invita y el Admin
  // asigna directo; los equipos los crea un Usuario público o el Organizador.
  const ESTADO_INSCRIPCION = { invitada: 'Invitada', pendiente: 'Pendiente', confirmada: 'Confirmada', rechazada: 'Rechazada' };
  const ESTADO_INTEGRANTE = { solicitada: 'Pidió unirse', invitada: 'Invitado/a', aceptada: 'Aceptado/a' };
  const pillDeEstado = label => ['Confirmada', 'Aceptado/a'].includes(label) ? 'status-open' : label === 'Rechazada' ? 'status-closed' : 'status-progress';
  let inscripciones = [];
  const participantRows = [];
  const teamRows = [];
  const cargarInscripciones = () => fetch('api/inscripciones.php')
    .then(response => response.json())
    .then(data => {
      inscripciones = data.success ? data.inscripciones : [];
      participantRows.splice(0, participantRows.length, ...inscripciones.flatMap(i => i.tipo === 'equipo'
        ? i.integrantes.map(m => ({ name: m.nombre, team: i.nombre, tournament: i.torneo, role: m.esCapitan ? 'Capitán/a' : 'Integrante', status: ESTADO_INTEGRANTE[m.estado], orden: i.id }))
        : [{ name: i.nombre, team: '—', tournament: i.torneo, role: 'Individual', status: ESTADO_INSCRIPCION[i.estado], orden: i.id }]));
      teamRows.splice(0, teamRows.length, ...inscripciones.filter(i => i.tipo === 'equipo').map(i => {
        const aceptados = i.integrantes.filter(m => m.estado === 'aceptada').length;
        return { name: i.nombre, captain: i.capitan || '—', tournament: i.torneo, members: `${aceptados}${i.maxIntegrantes ? ` / ${i.maxIntegrantes}` : ''}`, status: ESTADO_INSCRIPCION[i.estado] };
      }));
      document.getElementById('participantsTabCount').textContent = participantRows.length;
      // Resumen del panel: las 5 inscripciones más recientes
      const recientes = [...participantRows].sort((a, b) => b.orden - a.orden).slice(0, 5);
      if (recientes.length) {
        document.getElementById('recentParticipants').innerHTML = recientes.map(row => `<tr><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.team)}</td><td>${escapeHtml(row.tournament)}</td><td><span class="status-pill ${pillDeEstado(row.status)}">${row.status}</span></td></tr>`).join('');
      }
      document.getElementById('teamsTabCount').textContent = teamRows.length;
      document.getElementById('participantsSearch').dispatchEvent(new Event('input'));
      document.getElementById('teamsSearch').dispatchEvent(new Event('input'));
    });
  paginate({
    rows: participantRows,
    tbody: document.getElementById('participantsTableBody'),
    count: document.getElementById('participantsCount'),
    pageLabel: document.getElementById('participantsPage'),
    prev: document.getElementById('participantsPrev'),
    next: document.getElementById('participantsNext'),
    search: document.getElementById('participantsSearch'),
    renderRow: row => `<tr><td><strong>${escapeHtml(row.name)}</strong></td><td>${escapeHtml(row.team)}</td><td>${escapeHtml(row.tournament)}</td><td>${row.role}</td><td><span class="status-pill ${pillDeEstado(row.status)}">${row.status}</span></td></tr>`
  });
  paginate({
    rows: teamRows,
    tbody: document.getElementById('teamsTableBody'),
    count: document.getElementById('teamsCount'),
    pageLabel: document.getElementById('teamsPage'),
    prev: document.getElementById('teamsPrev'),
    next: document.getElementById('teamsNext'),
    search: document.getElementById('teamsSearch'),
    renderRow: row => `<tr><td><strong>${escapeHtml(row.name)}</strong></td><td>${escapeHtml(row.captain)}</td><td>${escapeHtml(row.tournament)}</td><td>${row.members}</td><td><span class="status-pill ${pillDeEstado(row.status)}">${row.status}</span></td></tr>`
  });
  const inscripcionesListas = allowedModules.includes('participants') ? cargarInscripciones() : Promise.resolve();

  // Torneos que gestiono y en qué fase admiten sumar gente (RF-08)
  const misTorneosEn = estados => (isAdmin ? torneosReales : torneosReales.filter(t => t.organizadorId === sesionUsuario.id_usuario))
    .filter(t => estados.includes(t.estado));
  const PLANTEL_ABIERTO = ['planificado', 'inscripcion_abierta'];
  const enviar = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(response => response.json());

  document.querySelector('[data-panel-form="participant"]')?.addEventListener('click', () => {
    const torneosAbiertos = misTorneosEn(PLANTEL_ABIERTO);
    const idsAbiertos = torneosAbiertos.map(t => t.id);
    const destinos = [
      ...torneosAbiertos.map(t => ({ value: `participar:${t.id}`, label: `Participante de ${escapeHtml(t.nombre)}` })),
      ...misTorneosEn([...PLANTEL_ABIERTO, 'inscripcion_cerrada']).map(t => ({ value: `arbitrar:${t.id}`, label: `Árbitro de ${escapeHtml(t.nombre)}` })),
      ...inscripciones.filter(i => i.tipo === 'equipo' && ['pendiente', 'confirmada'].includes(i.estado) && idsAbiertos.includes(i.idTorneo))
        .map(i => ({ value: `equipo:${i.idEquipo}`, label: `Integrante de ${escapeHtml(i.nombre)} (${escapeHtml(i.torneo)})` })),
    ];
    if (!destinos.length) { showToast('No tenés torneos que estén sumando gente en esta fase.'); return; }
    openPanelForm({
      title: isAdmin ? 'ASIGNAR A UN TORNEO' : 'INVITAR A UN TORNEO',
      help: isAdmin
        ? 'La cuenta (ya registrada) queda asignada directamente. Para una cuenta nueva usá Usuarios y roles.'
        : 'La persona tiene que tener una cuenta. Recibe la invitación en su perfil y la acepta o la rechaza.',
      fields: [{ name: 'email', label: 'Correo de la cuenta', type: 'email' }, { name: 'destino', label: 'Para', type: 'select', options: destinos, full: true }],
      submitLabel: isAdmin ? 'Asignar' : 'Enviar invitación',
      onSubmit: data => {
        const [que, id] = data.destino.split(':');
        const pedido = que === 'equipo'
          ? enviar('api/equipos.php', { accion: 'invitar', idEquipo: Number(id), email: data.email })
          : enviar('api/solicitudes.php', { tipo: 'invitar', rol: que, idTorneo: Number(id), email: data.email });
        pedido.then(result => {
          showToast(result.success ? (result.asignado ? 'Cuenta asignada.' : 'Invitación enviada.') : result.error);
          if (result.success) cargarInscripciones();
        });
      }
    });
  });
  document.querySelector('[data-panel-form="team"]')?.addEventListener('click', () => {
    const torneos = misTorneosEn(PLANTEL_ABIERTO);
    if (!torneos.length) { showToast('No tenés torneos con las inscripciones abiertas.'); return; }
    openPanelForm({
      title: 'CREAR EQUIPO', help: 'El equipo queda inscripto y confirmado en el torneo, sin capitán. Después sumás a sus integrantes con "+ Agregar participante".',
      fields: [{ name: 'nombre', label: 'Nombre del equipo' }, { name: 'idTorneo', label: 'Torneo', type: 'select', options: torneos.map(t => ({ value: t.id, label: escapeHtml(t.nombre) })) }],
      submitLabel: 'Crear equipo',
      onSubmit: data => enviar('api/equipos.php', { accion: 'crear', nombre: data.nombre, idTorneo: Number(data.idTorneo) })
        .then(result => { showToast(result.success ? 'Equipo creado.' : result.error); if (result.success) { cargarInscripciones(); cargarTorneos(); } })
    });
  });
  document.querySelectorAll('[data-roster-tab]').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('[data-roster-tab]').forEach(item => item.classList.toggle('active', item === tab));
    document.getElementById('participantsRoster').hidden = tab.dataset.rosterTab !== 'participants';
    document.getElementById('teamsRoster').hidden = tab.dataset.rosterTab !== 'teams';
  }));

  // Resultados (F6): el Organizador/Admin ve los partidos de sus torneos; el
  // árbitro, solo los que tiene asignados (RF-11). El árbitro carga, el
  // Organizador también puede cargar o corregir, y es quien valida.
  const PILL_RESULTADO = { Oficial: 'status-open', WO: 'status-open', 'Pendiente de validar': 'status-progress', 'Sin cargar': 'status-closed', Libre: 'status-closed' };
  const resultRows = [];
  const torneosConPartidos = () => [...new Set([
    ...misTorneosEn(['en_curso', 'finalizado']).map(t => t.id),
    ...(sesionUsuario.rolesTorneo || []).filter(r => r.rol === 'ARBITRO').map(r => r.idTorneo),
  ])];
  const cargarResultados = () => Promise.all(torneosConPartidos().map(id => fetch(`api/rondas.php?idTorneo=${id}`).then(response => response.json())))
    .then(lista => {
      const filas = [];
      lista.filter(d => d.success).forEach(d => d.rondas.forEach(ronda => ronda.partidos.forEach(p => {
        if (!d.gestiona && !p.esMio) return;
        const status = p.libre ? 'Libre' : p.estado === 'walkover' ? 'WO' : !p.resultado ? 'Sin cargar' : p.resultado.validado ? 'Oficial' : 'Pendiente de validar';
        filas.push({
          id: p.id, tournament: d.torneo.nombre, round: `${nombreRonda(d.torneo.formato, ronda)}${ronda.estado === 'finalizada' ? ' (cerrada)' : ''}`,
          matchup: p.libre ? `${p.local} (libre)` : `${p.local} vs. ${p.visitante}`, local: p.local, visitante: p.visitante,
          score: p.resultado ? `${p.resultado.local} - ${p.resultado.visitante}` : '—', status,
          gestiona: d.gestiona, abierta: ronda.estado !== 'finalizada', libre: p.libre, marcador: p.resultado, formato: d.torneo.formato,
        });
      })));
      resultRows.splice(0, resultRows.length, ...filas);
      document.getElementById('resultsSearch').dispatchEvent(new Event('input'));
    });
  paginate({
    rows: resultRows,
    tbody: document.getElementById('resultsTableBody'),
    count: document.getElementById('resultsCount'),
    pageLabel: document.getElementById('resultsPage'),
    prev: document.getElementById('resultsPrev'),
    next: document.getElementById('resultsNext'),
    search: document.getElementById('resultsSearch'),
    filter: document.getElementById('resultsStatus'),
    pageSize: 10,
    renderRow: row => {
      const acciones = [];
      if (row.abierta && !row.libre) {
        acciones.push(`<button class="table-action" type="button" data-result-load="${row.id}">${row.marcador ? 'Corregir' : 'Cargar'}</button>`);
        if (row.gestiona && row.status === 'Pendiente de validar') acciones.push(`<button class="table-action" type="button" data-result-validate="${row.id}">Validar</button>`);
        if (row.gestiona) acciones.push(`<button class="table-action danger-action" type="button" data-result-wo="${row.id}">Walkover</button>`);
      }
      return `<tr><td><strong>${escapeHtml(row.tournament)}</strong></td><td>${row.round}</td><td>${escapeHtml(row.matchup)}</td><td><strong>${row.score}</strong></td><td><span class="status-pill ${PILL_RESULTADO[row.status]}">${row.status}</span></td><td><div class="table-actions">${acciones.join('') || '—'}</div></td></tr>`;
    }
  });
  const enviarResultado = (metodo, body) => fetch('api/resultados.php', { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(response => response.json())
    .then(result => {
      showToast(result.success ? (result.rondaNueva ? 'Resultado validado: se armó la ronda siguiente de la llave.' : 'Resultado guardado.') : result.error);
      if (result.success) { cargarResultados(); if (allowedModules.includes('rounds')) cargarRondas(); }
    });
  document.getElementById('resultsTableBody').addEventListener('click', event => {
    const cargar = event.target.closest('[data-result-load]');
    const validar = event.target.closest('[data-result-validate]');
    const walkover = event.target.closest('[data-result-wo]');
    const boton = cargar || validar || walkover;
    const row = boton && resultRows.find(item => item.id === Number(boton.dataset.resultLoad ?? boton.dataset.resultValidate ?? boton.dataset.resultWo));
    if (!row) return;
    if (cargar) {
      openPanelForm({
        title: row.marcador ? 'CORREGIR RESULTADO' : 'CARGAR RESULTADO', help: `${row.local} vs. ${row.visitante} · ${row.round}${row.formato === 'suizo' ? ' · Serie al mejor de 3: 2-0 o 2-1' : row.formato === 'eliminacion' ? ' · Partido único, sin empate' : ''}`,
        fields: [
          { name: 'local', label: escapeHtml(row.local), type: 'number' },
          { name: 'visitante', label: escapeHtml(row.visitante), type: 'number' },
          ...(row.gestiona ? [{ name: 'validar', label: 'Al guardar', type: 'select', full: true, options: [{ value: '1', label: 'Validar: queda oficial' }, { value: '0', label: 'Dejar pendiente de validar' }] }] : []),
        ],
        values: { local: row.marcador?.local ?? '', visitante: row.marcador?.visitante ?? '' },
        submitLabel: 'Guardar resultado',
        onSubmit: data => enviarResultado('POST', { accion: 'cargar', idEnfrentamiento: row.id, local: Number(data.local), visitante: Number(data.visitante), validar: data.validar === '1' })
      });
    } else if (validar) {
      enviarResultado('PATCH', { idEnfrentamiento: row.id });
    } else if (walkover) {
      openPanelForm({
        title: 'WALKOVER', help: 'Se aplica el marcador de walkover del torneo y el partido queda marcado como WO, distinto de un partido jugado.',
        fields: [{ name: 'ganador', label: 'Gana por walkover', type: 'select', full: true, options: [{ value: 'local', label: escapeHtml(row.local) }, { value: 'visitante', label: escapeHtml(row.visitante) }] }],
        submitLabel: 'Registrar walkover',
        onSubmit: data => enviarResultado('POST', { accion: 'walkover', idEnfrentamiento: row.id, ganador: data.ganador })
      });
    }
  });

  const downloadCsv = (filename, headers, rows) => {
    const escapeCell = value => `"${String(value).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map(row => row.map(escapeCell).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Rondas y llaves (F6): fixture, cabezas de serie, árbitro y horario de
  // cada partido, y cierre de rondas. Solo el Admin reabre, con motivo (RF-13).
  const roundSelect = document.getElementById('roundTournament');
  const roundFeedback = document.getElementById('roundFeedback');
  const generateRound = document.getElementById('generateRound');
  const roundSeeds = document.getElementById('roundSeeds');
  const roundBracket = document.getElementById('roundBracket');
  const finishTournament = document.getElementById('finishTournament');
  const ESTADO_RONDA = { pendiente: 'Pendiente', en_curso: 'En juego', finalizada: 'Cerrada' };
  let competencia = null;
  const renderRondas = () => {
    const t = torneosReales.find(item => item.id === Number(roundSelect.value));
    roundSeeds.hidden = true;
    generateRound.hidden = true;
    finishTournament.hidden = true;
    if (!t || !competencia) {
      ['roundFormat', 'roundCurrent', 'roundStatus'].forEach(id => { document.getElementById(id).textContent = '-'; });
      roundBracket.innerHTML = '<p>No tenés torneos con las inscripciones cerradas o en curso.</p>';
      return;
    }
    const { rondas, torneo: datos } = competencia;
    const ultima = rondas[rondas.length - 1];
    document.getElementById('roundFormat').textContent = datos.formatoNombre;
    document.getElementById('roundCurrent').textContent = ultima ? nombreRonda(datos.formato, ultima) : 'Sin fixture';
    document.getElementById('roundStatus').textContent = competencia.campeon ? `Campeón: ${competencia.campeon}` : ultima ? ESTADO_RONDA[ultima.estado] : 'Listo para generar';
    if (!rondas.length && t.estado === 'inscripcion_cerrada') {
      generateRound.textContent = 'Generar fixture';
      generateRound.hidden = false;
      // Llaves: cabezas de serie antes de armar la primera ronda (RF-17)
      if (datos.formato === 'eliminacion') {
        const confirmadas = inscripciones.filter(i => i.idTorneo === t.id && i.estado === 'confirmada');
        roundSeeds.innerHTML = '<p class="helper-text">Cabezas de serie (1 = la mejor). Las que tengan número evitan cruzarse al principio y, si la llave no es potencia de 2, pasan sin jugar. El resto se ordena por el sorteo.</p>'
          + confirmadas.map(i => `<label>${escapeHtml(i.nombre)}<input type="number" min="1" data-seed="${i.id}" value="${i.cabezaSerie ?? ''}" placeholder="—"></label>`).join('');
        roundSeeds.hidden = false;
      }
    }
    finishTournament.hidden = !(competencia.gestiona && t.estado === 'en_curso' && rondas.length);
    if (rondas.length && datos.formato === 'suizo' && t.estado === 'en_curso') {
      generateRound.textContent = '+ Generar siguiente ronda';
      generateRound.hidden = false;
    }
    const conLlave = rondas.length && ['eliminacion', 'suizo'].includes(datos.formato);
    roundBracket.innerHTML = (conLlave ? '<div class="panel-bracket"></div>' : '') + rondas.map(ronda => {
      const abierta = ronda.estado !== 'finalizada';
      const acciones = (competencia.gestiona && abierta ? `<button class="table-action" type="button" data-round-close="${ronda.id}">Cerrar ronda</button>` : '')
        + (isAdmin && !abierta ? `<button class="table-action" type="button" data-round-reopen="${ronda.id}">Reabrir</button>` : '');
      const partidos = ronda.partidos.map(p => {
        const controles = competencia.gestiona && abierta && !p.libre
          ? `<p class="match-controls"><select data-match-referee="${p.id}" aria-label="Árbitro"><option value="0">Sin árbitro</option>${competencia.arbitros.map(a => `<option value="${a.id}"${a.id === p.idArbitro ? ' selected' : ''}>${escapeHtml(a.nombre)}</option>`).join('')}</select><input type="datetime-local" data-match-time="${p.id}" aria-label="Fecha y hora" value="${p.fechaHora ? p.fechaHora.replace(' ', 'T').slice(0, 16) : ''}"><button class="table-action" type="button" data-match-save="${p.id}">Guardar</button></p>`
          : '';
        return partidoHtml(p, controles);
      }).join('');
      return `<section class="round-block"><header><strong>${nombreRonda(datos.formato, ronda)}${ronda.fecha ? ` · ${ronda.fecha}` : ''} · ${ESTADO_RONDA[ronda.estado]}</strong><span class="table-actions">${acciones}</span></header><div class="bracket">${partidos}</div></section>`;
    }).join('') + (competencia.tabla.length ? tablaPosicionesHtml(competencia.tabla) : '');
    if (conLlave) dibujarLlave(roundBracket.querySelector('.panel-bracket'), competencia);
  };
  const cargarRondas = () => {
    const id = Number(roundSelect.value);
    if (!id) { competencia = null; renderRondas(); return Promise.resolve(); }
    return fetch(`api/rondas.php?idTorneo=${id}`).then(response => response.json())
      .then(data => { competencia = data.success ? data : null; renderRondas(); });
  };
  const llenarSelectRondas = () => {
    const lista = misTorneosEn(['inscripcion_cerrada', 'en_curso', 'finalizado']);
    const actual = roundSelect.value;
    roundSelect.innerHTML = lista.map(t => `<option value="${t.id}">${escapeHtml(t.nombre)}</option>`).join('');
    if (lista.some(t => String(t.id) === actual)) roundSelect.value = actual;
    return cargarRondas();
  };
  const accionRonda = (url, metodo, body, ok) => fetch(url, { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(response => response.json())
    .then(result => {
      roundFeedback.textContent = result.success ? ok : result.error;
      if (result.success) { cargarTorneos().then(llenarSelectRondas); if (allowedModules.includes('results')) cargarResultados(); }
    });
  roundSelect.addEventListener('change', cargarRondas);
  finishTournament.addEventListener('click', () => {
    if (window.confirm(FINALIZAR_PREGUNTA)) accionRonda(`api/torneo.php?id=${roundSelect.value}&accion=finalizar`, 'PATCH', {}, 'Torneo finalizado: los roles de este torneo terminaron.');
  });
  generateRound.addEventListener('click', () => {
    const primera = !competencia.rondas.length;
    if (primera && !window.confirm('¿Generar el fixture? El torneo pasa a estar en curso y ya no se puede cambiar quiénes juegan.')) return;
    accionRonda('api/rondas.php', 'POST', { accion: 'generar', idTorneo: Number(roundSelect.value) }, primera ? 'Fixture generado: el torneo está en curso.' : 'Ronda generada.');
  });
  roundSeeds.addEventListener('change', event => {
    const input = event.target.closest('[data-seed]');
    if (!input) return;
    fetch('api/inscripciones.php', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: Number(input.dataset.seed), cabezaSerie: Number(input.value) || 0 }) })
      .then(response => response.json())
      .then(result => { roundFeedback.textContent = result.success ? 'Cabeza de serie guardada.' : result.error; if (result.success) cargarInscripciones(); });
  });
  roundBracket.addEventListener('click', event => {
    const cerrar = event.target.closest('[data-round-close]');
    const reabrir = event.target.closest('[data-round-reopen]');
    const guardar = event.target.closest('[data-match-save]');
    if (cerrar) {
      accionRonda('api/rondas.php', 'PATCH', { accion: 'cerrar', idRonda: Number(cerrar.dataset.roundClose) }, 'Ronda cerrada: sus resultados quedan bloqueados.');
    } else if (reabrir) {
      const motivo = window.prompt('Motivo de la reapertura (queda en la auditoría):');
      if (motivo) accionRonda('api/rondas.php', 'PATCH', { accion: 'reabrir', idRonda: Number(reabrir.dataset.roundReopen), motivo }, 'Ronda reabierta.');
    } else if (guardar) {
      const id = guardar.dataset.matchSave;
      accionRonda('api/enfrentamientos.php', 'PATCH', {
        id: Number(id),
        idArbitro: Number(roundBracket.querySelector(`[data-match-referee="${id}"]`).value),
        fechaHora: roundBracket.querySelector(`[data-match-time="${id}"]`).value,
      }, 'Partido programado.');
    }
  });

  // Primero los torneos (y el plantel, para las cabezas de serie)
  Promise.all([torneosListos, inscripcionesListas]).then(() => {
    if (allowedModules.includes('results')) cargarResultados();
    if (allowedModules.includes('rounds')) llenarSelectRondas();
  });

  // Reportes (RF-19): datos reales de api/reportes.php. El Admin ve todos los
  // torneos; el Organizador, los suyos. Los walkovers van aparte (RF-12).
  // Las tarjetas del resumen del panel salen del mismo pedido.
  const reportSelect = document.getElementById('reportTournament');
  let reportRows = [];
  const visibleReports = () => reportSelect.value ? reportRows.filter(row => row.id === Number(reportSelect.value)) : reportRows;
  const estadoReporte = row => ESTADO_UI_LABEL[ESTADO_TORNEO_A_UI[row.estado] || 'cerrado'];
  const renderReports = () => {
    const visible = visibleReports();
    const suma = (lista, clave) => lista.reduce((total, row) => total + (row[clave] || 0), 0);
    const conCupo = visible.filter(row => row.cupoMaximo);
    const cupo = suma(conCupo, 'cupoMaximo');
    document.getElementById('reportRegistrations').textContent = suma(visible, 'inscriptos');
    document.getElementById('reportOccupancy').textContent = cupo ? `${Math.round((suma(conCupo, 'inscriptos') / cupo) * 100)}%` : '—';
    document.getElementById('reportMatches').textContent = suma(visible, 'partidos');
    document.getElementById('reportOfficial').textContent = suma(visible, 'oficiales');
    document.getElementById('reportsTableBody').innerHTML = visible.map(row => {
      const estadoUi = ESTADO_TORNEO_A_UI[row.estado] || 'cerrado';
      return `<tr><td><strong>${escapeHtml(row.nombre)}</strong></td><td>${escapeHtml(row.disciplinaNombre || 'Personalizada')}</td><td>${row.inscriptos}</td><td>${row.cupoMaximo ?? '—'}</td><td>${row.partidos}</td><td>${row.oficiales}</td><td>${row.walkovers}</td><td><span class="status-pill ${statusClass(estadoUi)}">${ESTADO_UI_LABEL[estadoUi]}</span></td></tr>`;
    }).join('') || '<tr><td colspan="8">No hay torneos en tu ámbito.</td></tr>';
  };
  reportSelect.addEventListener('change', renderReports);
  document.getElementById('exportReport').addEventListener('click', () => {
    downloadCsv('reporte-torneos.csv', ['Torneo', 'Disciplina', 'Inscripciones', 'Cupo', 'Partidos', 'Resultados oficiales', 'Walkovers', 'Sin validar', 'Estado'],
      visibleReports().map(row => [row.nombre, row.disciplinaNombre || 'Personalizada', row.inscriptos, row.cupoMaximo ?? '', row.partidos, row.oficiales, row.walkovers, row.sinValidar, estadoReporte(row)]));
  });
  if (allowedModules.includes('reports')) {
    fetch('api/reportes.php')
      .then(response => response.json())
      .then(data => {
        if (!data.success) return;
        reportRows = data.torneos;
        reportSelect.innerHTML = '<option value="">Todos los torneos</option>' + reportRows.map(row => `<option value="${row.id}">${escapeHtml(row.nombre)}</option>`).join('');
        renderReports();
        const { torneosActivos, participantes, equipos, resultadosSinValidar } = data.resumen;
        const tarjetas = document.querySelectorAll('.stat-grid strong');
        [torneosActivos, participantes, equipos, resultadosSinValidar].forEach((valor, i) => { if (tarjetas[i]) tarjetas[i].textContent = valor; });
      });
  }

  if (isAdmin) {
    // Registro de auditoría real (api/auditoria.php): lo escriben los
    // endpoints con App\Auditoria::registrar() en cada acción.
    const formatDate = value => new Date(value.replace(' ', 'T')).toLocaleString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    let auditRows = [];
    fetch('api/auditoria.php')
      .then(response => response.json())
      .then(data => {
        auditRows = (data.success ? data.eventos : []).map(evento => ({ date: formatDate(evento.fecha), user: evento.usuario, action: evento.accion, module: evento.tabla, ip: evento.ip || '-' }));
        paginate({
          rows: auditRows,
          tbody: document.getElementById('auditTableBody'),
          count: document.getElementById('auditCount'),
          pageLabel: document.getElementById('auditPage'),
          prev: document.getElementById('auditPrev'),
          next: document.getElementById('auditNext'),
          search: document.getElementById('auditSearch'),
          pageSize: 12,
          renderRow: row => `<tr><td>${row.date}</td><td>${escapeHtml(row.user)}</td><td><strong>${escapeHtml(row.action)}</strong></td><td>${row.module}</td><td>${escapeHtml(row.ip)}</td></tr>`
        });
        document.getElementById('recentActivity').innerHTML = auditRows.slice(0, 4).map(row => `<li><span>${row.date.split(', ')[1] || row.date}</span><p><strong>${escapeHtml(row.action)}</strong><small>${escapeHtml(row.user)}</small></p></li>`).join('') || '<li><p><strong>Sin actividad registrada todavía.</strong></p></li>';
      });
    document.getElementById('exportAudit').addEventListener('click', () => {
      downloadCsv('auditoria-lidenskap.csv', ['Fecha y hora', 'Usuario', 'Acción', 'Tabla', 'IP de origen'], auditRows.map(row => [row.date, row.user, row.action, row.module, row.ip]));
    });

    const settingsForm = document.getElementById('systemSettingsForm');
    let savedSettings = {};
    try { savedSettings = JSON.parse(localStorage.getItem('lidenskap-system-settings') || '{}'); } catch { savedSettings = {}; }
    [...settingsForm.elements].forEach(field => {
      if (!field.name || !(field.name in savedSettings)) return;
      if (field.type === 'checkbox') field.checked = savedSettings[field.name];
      else field.value = savedSettings[field.name];
    });
    settingsForm.addEventListener('submit', event => {
      event.preventDefault();
      const settings = {};
      [...settingsForm.elements].forEach(field => {
        if (!field.name) return;
        settings[field.name] = field.type === 'checkbox' ? field.checked : field.value.trim();
      });
      localStorage.setItem('lidenskap-system-settings', JSON.stringify(settings));
      document.getElementById('settingsFeedback').textContent = 'Configuración guardada correctamente en este dispositivo.';
    });
  }

  const requestedModule = window.location.hash.replace('#panel-', '');
  if (allowedModules.includes(requestedModule)) openModule(requestedModule, false);
}

initializeTournamentSearch();
initializeCalendar();
initializeTournamentDetail();
initializeCreateTournament();
initializeContactPrototype();
initializeProfileEditor();
initializeDashboardByRole();
function initializeCreateTournament() {
  const form = document.getElementById('createTournamentForm');
  if (!form) return;

  const disciplineSelect = document.getElementById('disciplineSelect');
  const customDisciplineGroup = document.getElementById('customDisciplineGroup');
  const customDisciplineInput = document.getElementById('customDisciplineName');
  const esportsGameGroup = document.getElementById('esportsGameGroup');
  const formatSelect = document.getElementById('formatSelect');
  const feedback = document.getElementById('formFeedback');
  const submitBtn = document.getElementById('btnSubmitTournament');

  // Solo el Admin publica directo; el resto envía una solicitud que el Admin aprueba.
  const esSolicitud = !hasPermission('create_tournament');
  if (esSolicitud) {
    submitBtn.textContent = 'Enviar solicitud';
    const intro = document.getElementById('createTournamentIntro');
    if (intro) intro.textContent = 'Completá los datos del torneo. El Administrador general revisa la solicitud y, si la aprueba, quedás como Organizador de este torneo.';
  }

  disciplineSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    const isCustom = val === 'custom';
    customDisciplineGroup.hidden = !isCustom;
    customDisciplineInput.required = isCustom;
    if (!isCustom) customDisciplineInput.value = '';

    const isEsports = val === 'esports';
    if (esportsGameGroup) esportsGameGroup.hidden = !isEsports;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    feedback.textContent = '';

    const payload = {
      nombre: document.getElementById('tournamentName').value.trim(),
      descripcion: document.getElementById('tournamentDescription').value.trim(),
      disciplina: disciplineSelect.value,
      disciplinaCustom: customDisciplineInput.value.trim(),
      formato: formatSelect.value,
      cupoMaximo: document.getElementById('maxTeams').value,
      maxIntegrantesEquipo: document.getElementById('maxTeamMembers').value,
      fechaInicio: document.getElementById('startDate').value,
      sede: document.getElementById('venueName').value.trim(),
    };

    submitBtn.disabled = true;
    try {
      const response = await fetch('api/torneos.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!data.success) {
        feedback.textContent = data.error || 'No se pudo crear el torneo.';
        feedback.style.color = 'var(--danger, #e05252)';
        return;
      }
      if (data.solicitud) {
        form.reset();
        feedback.textContent = 'Solicitud enviada. El Administrador general la va a revisar; podés seguir su estado desde tu perfil.';
        feedback.style.color = '';
        return;
      }
      window.location.href = `detalle-torneo.html?id=${data.id}`;
    } catch {
      feedback.textContent = 'No se pudo conectar con el servidor. Intentá de nuevo.';
      feedback.style.color = 'var(--danger, #e05252)';
    } finally {
      submitBtn.disabled = false;
    }
  });
}
