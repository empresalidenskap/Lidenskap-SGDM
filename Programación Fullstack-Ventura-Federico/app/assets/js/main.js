/* ============================================================
   LIDENSKAP — SGDM  |  main.js
   Funciones:
   - Tema claro / oscuro
   - Carrusel de imágenes con puntos
   - Sport chips con color dorado + estrella burst
   - Carrusel de torneos por disciplina
   ============================================================ */

'use strict';

/* ---- DATOS DEL CARRUSEL ---- */
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

/* ---- REFERENCIAS DOM ---- */
const btnAtras   = document.getElementById('atras');
const btnAdelante= document.getElementById('adelante');
const imgWrap    = document.getElementById('img');
const textoWrap  = document.getElementById('texto');
const puntosWrap = document.getElementById('puntos');
const themeBtn   = document.getElementById('themeBtn');
const starContainer = document.getElementById('star-container');
const logoImg = document.getElementById('logoImg');
const ilustracion = document.getElementById('ilustracion');

/* ============================================================
   CARRUSEL
   ============================================================ */
function renderSlide(idx, direction = 'right') {
  if (!imgWrap || !textoWrap) return; // esta página no tiene el carrusel de imágenes de la home

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

/* Auto-advance cada 5s, solamente en la página que contiene el carrusel. */
let autoTimer = null;
if (imgWrap) autoTimer = setInterval(nextSlide, 5000);
document.querySelector('.carrusel')?.addEventListener('mouseenter', () => {
  if (autoTimer) clearInterval(autoTimer);
});
document.querySelector('.carrusel')?.addEventListener('mouseleave', () => {
  if (autoTimer) clearInterval(autoTimer);
  autoTimer = setInterval(nextSlide, 5000);
});

/* Init */
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


/* ============================================================
   TEMA CLARO / OSCURO
   ============================================================ */
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

/* ============================================================
   SPORT CHIPS — color dorado + estrella burst al hacer clic
   ============================================================ */
const STAR_CHARS = [ '✦', '✧'];

function spawnStar(x, y) {
  if (!starContainer) return;
  const star = document.createElement('span');
  star.className = 'star-burst';
  star.textContent = STAR_CHARS[Math.floor(Math.random() * STAR_CHARS.length)];

  /* Dispersión aleatoria leve */
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

/* ============================================================
   SPORTS SELECTOR — flechas, barra de progreso y fades
   ============================================================ */

const sportsScroll      = document.getElementById('sportsScroll');
const sportsLeft        = document.getElementById('sportsLeft');
const sportsRight       = document.getElementById('sportsRight');
const progressThumb     = document.getElementById('sportsProgressThumb');
const fadeLeft          = document.querySelector('.sports-fade--left');
const fadeRight         = document.querySelector('.sports-fade--right');

/* Cuántos px se desplaza cada clic de flecha (≈ 2 chips) */
const SCROLL_STEP = 180;

function updateSportsUI() {
  if (!sportsScroll) return;

  const { scrollLeft, scrollWidth, clientWidth } = sportsScroll;
  const maxScroll = scrollWidth - clientWidth;

  /* ---- Barra de progreso ---- */
  if (progressThumb && maxScroll > 0) {
    const ratio      = scrollLeft / maxScroll;           // 0 → 1
    const thumbW     = clientWidth / scrollWidth * 100;  // % del track
    const thumbLeft  = ratio * (100 - thumbW);           // % de desplazamiento

    progressThumb.style.width     = thumbW + '%';
    progressThumb.style.transform = `translateX(${(thumbLeft / thumbW) * 100}%)`;
  }

  /* ---- Fades laterales ---- */
  if (fadeLeft)  fadeLeft.classList.toggle('hidden',  scrollLeft <= 2);
  if (fadeRight) fadeRight.classList.toggle('hidden', scrollLeft >= maxScroll - 2);

  /* ---- Estado disabled de flechas ---- */
  if (sportsLeft)  sportsLeft.disabled  = scrollLeft <= 2;
  if (sportsRight) sportsRight.disabled = scrollLeft >= maxScroll - 2;
}

/* Scroll suave al hacer clic en las flechas */
if (sportsLeft) {
  sportsLeft.addEventListener('click', () => {
    sportsScroll.scrollBy({ left: -SCROLL_STEP, behavior: 'smooth' });
    /* burst de estrella en la flecha */
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

/* Actualizar en cada evento de scroll (incluye swipe táctil) */
if (sportsScroll) {
  sportsScroll.addEventListener('scroll', updateSportsUI, { passive: true });
  /* Inicializar al cargar y al redimensionar */
  updateSportsUI();
  window.addEventListener('resize', updateSportsUI, { passive: true });
}

/* Delegación de click en chips */
if (sportsScroll) {
  sportsScroll.addEventListener('click', (e) => {
    const chip = e.target.closest('.sport-chip');
    if (!chip) return;

    document.querySelectorAll('.sport-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');

    /* Centrar el chip seleccionado en el scroll */
    chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

    /* Estrellas */
    const rect = chip.getBoundingClientRect();
    burstStars(rect.left + rect.width / 2, rect.top + rect.height / 2, 5);
  });
}

/* Burst en botones generales de la página */
document.querySelectorAll('.btn-hero, .btn-ghost, .btn-accent, .btn-outline, .format-card, .carrusel-btn').forEach(el => {
  el.addEventListener('click', () => {
    const rect = el.getBoundingClientRect();
    burstStars(rect.left + rect.width / 2, rect.top + rect.height / 2, 3);
  });
});

/* ============================================================
   FRONTEND DINÁMICO DE DISCIPLINAS
   ============================================================ */

// Base de datos de cada deporte (¡Ahora con Rugby y Voleibol!)
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

  // Generamos el HTML de la disciplina activa
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

/* ============================================================
   CARRUSEL DE TORNEOS POR DISCIPLINA
   ============================================================ */

// Vista derivada de SGDM_TOURNAMENTS. Se completa después de declarar
// la colección principal para evitar mantener dos listas diferentes.
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

// Escuchador que detecta el clic en los chips para refrescar la información
// (info de la disciplina + carrusel de torneos de esa disciplina)
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
/* ============================================================
   LIDENSKAP — SISTEMA DE AUTENTICACIÓN POR ROLES (INGENIERÍA)
   ============================================================ */

const SGDM_PERMISSIONS = {
  ADMIN: ['view_public', 'view_profile', 'edit_profile', 'create_tournament', 'manage_tournaments', 'manage_users', 'manage_participants', 'manage_results', 'view_reports', 'view_audit', 'manage_settings'],
  ORGANIZADOR: ['view_public', 'view_profile', 'manage_tournaments', 'manage_participants', 'manage_results', 'view_reports'],
  PARTICIPANTE: ['view_public', 'view_profile', 'edit_profile', 'join_tournament'],
  PUBLICO: ['view_public', 'view_profile']
};

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

function hasPermission(permission) {
  return Boolean(sesionUsuario && SGDM_PERMISSIONS[sesionUsuario.rol]?.includes(permission));
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
            <div class="field"><label for="loginPassword">Contraseña</label><input type="password" id="loginPassword" autocomplete="current-password" required></div>
            <p id="loginError" class="auth-error" hidden>Correo o contraseña incorrectos.</p>
            <button class="btn-primary" type="submit">Ingresar</button>
          </form>
          <details class="demo-accounts"><summary>Ver cuentas de demostración</summary><ul><li><b>Administrador:</b> admin@lidenskap.com / admin123</li><li><b>Organizador:</b> organizador@lidenskap.com / org123</li><li><b>Participante:</b> atleta@lidenskap.com / user123</li><li><b>Usuario público:</b> publico@lidenskap.com / guest123</li></ul></details>
        </section>
        <section id="viewRegister" hidden>
          <p class="section-eyebrow">Nueva cuenta</p><h2>REGISTRARSE</h2>
          <p class="auth-help">Se crea como cuenta de Usuario público. Para competir en un torneo, un Organizador debe inscribirte y validarte como Participante.</p>
          <form id="registerForm">
            <div class="field"><label for="registerNombre">Nombre</label><input id="registerNombre" autocomplete="given-name" required></div>
            <div class="field"><label for="registerApellido">Apellido</label><input id="registerApellido" autocomplete="family-name" required></div>
            <div class="field"><label for="registerEmail">Correo electrónico</label><input id="registerEmail" type="email" autocomplete="username" required></div>
            <div class="field"><label for="registerPassword">Contraseña</label><input id="registerPassword" type="password" autocomplete="new-password" minlength="8" required></div>
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
      const destination = authReturnTo || (sesionUsuario.rol === 'ADMIN' || sesionUsuario.rol === 'ORGANIZADOR' ? 'panel.html' : 'perfil.html');
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

  const accountButton = document.querySelector('nav .btn-outline');
  if (accountButton) {
    if (sesionUsuario) {
      accountButton.href = 'perfil.html';
      accountButton.textContent = 'Mi perfil';
      accountButton.setAttribute('aria-label', `Abrir perfil de ${sesionUsuario.nombre}`);
      const logout = document.createElement('button');
      logout.type = 'button';
      logout.className = 'nav-logout';
      logout.textContent = 'Salir';
      logout.addEventListener('click', cerrarSesion);
      accountButton.parentElement?.insertBefore(logout, accountButton.nextSibling);
    } else {
      accountButton.href = '#iniciar-sesion';
      accountButton.textContent = 'Iniciar sesión';
      accountButton.addEventListener('click', event => { event.preventDefault(); openAuthModal('login'); });
    }
  }

  document.getElementById('btnCrearCuentaGratis')?.addEventListener('click', event => { event.preventDefault(); openAuthModal('register'); });
  applyNavigationPermissions();
}
/* ============================================================
   LIDENSKAP — REDIRECCIÓN A LA PÁGINA DE TODAS LAS DISCIPLINAS
   ============================================================ */
document.addEventListener('click', function (e) {
  const btnTodas = e.target.closest('#btnTodasDisciplinas') || e.target.closest('[data-sport="todas"]');
  
  if (btnTodas && document.body.dataset.page !== 'disciplines') {
    e.preventDefault();
    // Nos lleva a la vista independiente de disciplinas
    window.location.href = 'disciplinas.html';
  }
});

/* ============================================================
   NAVEGACIÓN COMPARTIDA Y PÁGINAS DE LA PRIMERA ENTREGA
   ============================================================ */

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
    link.hidden = !hasPermission('create_tournament');
  });
  document.querySelectorAll('a[href="panel.html"]').forEach(link => {
    link.hidden = !(hasPermission('manage_tournaments') || hasPermission('manage_users'));
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
  if (page === 'create-tournament' && !hasPermission('create_tournament')) {
    const createAccessMessage = sesionUsuario?.rol === 'ORGANIZADOR'
      ? 'El Organizador no puede crear competencias nuevas. Puede configurar únicamente los torneos asignados desde su panel.'
      : sesionUsuario
        ? `El rol ${sesionUsuario.rolNombre} no tiene permiso para crear competencias.`
        : 'Esta función requiere una cuenta de Administrador general.';
    renderAccessGate('NO PODÉS CREAR COMPETENCIAS', createAccessMessage, !sesionUsuario);
  }
  if (page === 'dashboard' && !(hasPermission('manage_tournaments') || hasPermission('manage_users'))) {
    renderAccessGate('PANEL NO DISPONIBLE', sesionUsuario ? `El rol ${sesionUsuario.rolNombre} no tiene acceso a herramientas de gestión.` : 'Iniciá sesión como Administrador general u Organizador de torneo para acceder al panel.', !sesionUsuario);
  }
}

document.addEventListener('click', event => {
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
  } else if (href.startsWith('crear-competencia.html') && !hasPermission('create_tournament')) {
    event.preventDefault();
    if (!sesionUsuario) openAuthModal('login', href);
    else alert(`Acceso denegado: el rol ${sesionUsuario.rolNombre} no puede crear competencias.`);
  } else if (href.startsWith('panel.html') && !(hasPermission('manage_tournaments') || hasPermission('manage_users'))) {
    event.preventDefault();
    if (!sesionUsuario) openAuthModal('login', 'panel.html');
    else alert(`Acceso denegado: el rol ${sesionUsuario.rolNombre} no puede administrar el sistema.`);
  }
});

initializeSharedNavigation();
initializeAuthentication();
applyRouteGuard();

const SGDM_TOURNAMENTS = [
  { id: 'copa-apertura', name: 'Copa Apertura 2026', discipline: 'futbol', disciplineLabel: 'Fútbol', format: 'liga', formatLabel: 'Liga', status: 'abierto', statusLabel: 'Inscripciones abiertas', date: '3 Ago 2026', venue: 'Montevideo', slots: '10 / 16', description: 'Competencia abierta para clubes y equipos amateur de Montevideo.' },
  { id: 'futsal-relampago', name: 'Torneo Relámpago Futsal', discipline: 'futbol', disciplineLabel: 'Fútbol', format: 'eliminacion', formatLabel: 'Eliminación directa', status: 'curso', statusLabel: 'En curso', date: '20 Jul 2026', venue: 'Canelones', slots: '16 / 16', description: 'Llaves rápidas de futsal con definición durante una sola jornada.' },
  { id: 'suizo-invierno', name: 'Suizo Clásico de Invierno', discipline: 'ajedrez', disciplineLabel: 'Ajedrez', format: 'suizo', formatLabel: 'Sistema suizo', status: 'abierto', statusLabel: 'Inscripciones abiertas', date: '5 Ago 2026', venue: 'Montevideo', slots: '24 / 40', description: 'Siete rondas con emparejamiento por rendimiento y desempate Buchholz.' },
  { id: 'liga-juvenil', name: 'Liga Juvenil U18', discipline: 'basquet', disciplineLabel: 'Básquetbol', format: 'liga', formatLabel: 'Liga', status: 'curso', statusLabel: 'En curso', date: '1 Jul 2026', venue: 'Montevideo', slots: '10 / 10', description: 'Liga formativa para equipos juveniles con fase regular y playoffs.' },
  { id: 'open-tenis', name: 'Open Individual de Verano', discipline: 'tenis', disciplineLabel: 'Tenis', format: 'eliminacion', formatLabel: 'Eliminación directa', status: 'abierto', statusLabel: 'Inscripciones abiertas', date: '12 Ago 2026', venue: 'Carrasco', slots: '18 / 32', description: 'Torneo individual abierto, disputado al mejor de tres sets.' },
  { id: 'copa-esports', name: 'Copa Lidenskap VALORANT', discipline: 'esports', disciplineLabel: 'Esports', game: 'VALORANT', gameSlug: 'valorant', format: 'eliminacion', formatLabel: 'Eliminación directa', status: 'abierto', statusLabel: 'Inscripciones abiertas', date: '8 Ago 2026', venue: 'Online', slots: '12 / 16', description: 'Shooter táctico 5 contra 5 con veto de mapas y series al mejor de tres.' },
  { id: 'lol-rift-league', name: 'Liga de la Grieta LoL', discipline: 'esports', disciplineLabel: 'Esports', game: 'League of Legends', gameSlug: 'lol', format: 'liga', formatLabel: 'Liga + playoffs', status: 'curso', statusLabel: 'En curso', date: '10 Ago 2026', venue: 'Online', slots: '8 / 8', description: 'Liga de League of Legends con fase regular, playoffs y series Bo3.' },
  { id: 'cs2-open', name: 'Open Oriental CS2', discipline: 'esports', disciplineLabel: 'Esports', game: 'Counter-Strike 2', gameSlug: 'cs2', format: 'eliminacion', formatLabel: 'Eliminación directa', status: 'abierto', statusLabel: 'Inscripciones abiertas', date: '15 Ago 2026', venue: 'Online', slots: '12 / 16', description: 'Torneo de Counter-Strike 2 con veto competitivo y series Bo3.' },
  { id: 'tft-masters', name: 'Masters Tácticos TFT', discipline: 'esports', disciplineLabel: 'Esports', game: 'Teamfight Tactics', gameSlug: 'tft', format: 'suizo', formatLabel: 'Sistema suizo', status: 'abierto', statusLabel: 'Inscripciones abiertas', date: '18 Ago 2026', venue: 'Online', slots: '24 / 32', description: 'Competencia individual de TFT con lobbies suizos y puntos por posición.' },
  { id: 'voley-playa', name: 'Torneo Playa Ramírez', discipline: 'voleibol', disciplineLabel: 'Voleibol', format: 'eliminacion', formatLabel: 'Eliminación directa', status: 'abierto', statusLabel: 'Inscripciones abiertas', date: '16 Ago 2026', venue: 'Montevideo', slots: '9 / 16', description: 'Voleibol playa por parejas con fase de grupos y eliminación.' },
  { id: 'sevens-verano', name: 'Sevens de Verano', discipline: 'rugby', disciplineLabel: 'Rugby', format: 'eliminacion', formatLabel: 'Eliminación directa', status: 'cerrado', statusLabel: 'Finalizado', date: '2 Jul 2026', venue: 'Carrasco', slots: '16 / 16', description: 'Jornada de rugby seven con copa de oro y copa de plata.' }
];

torneosPorDisciplina = SGDM_TOURNAMENTS.reduce((groups, tournament) => {
  const card = {
    id: tournament.id,
    nombre: tournament.name,
    formato: tournament.formatLabel,
    estado: tournament.statusLabel,
    fecha: tournament.date,
    cupos: tournament.slots,
    sede: tournament.venue
  };
  if (!groups[tournament.discipline]) groups[tournament.discipline] = [];
  groups[tournament.discipline].push(card);
  return groups;
}, {});

const SGDM_TOURNAMENT_DETAILS = {
  'copa-apertura': {
    organizer: 'Lidenskap Club', mode: 'Todos contra todos', scoring: '3 victoria · 1 empate', duration: '2 tiempos de 45 min.', tiebreak: 'Diferencia de goles', participantLabel: 'Equipos destacados', standingLabel: 'Equipo',
    participants: [['Atlético Sur', 'Capitán: Diego Silva · 18 jugadores'], ['Deportivo Norte', 'Capitán: Bruno Sosa · 17 jugadores'], ['Unión Central', 'Capitana: Lucía Fernández · 18 jugadores'], ['Racing Juvenil', 'Capitán: Mateo Rodríguez · 16 jugadores']],
    matches: [['03 AGO · 18:00', 'Atlético Sur', 'Deportivo Norte', null, 'Cancha principal · Próximo'], ['03 AGO · 20:00', 'Unión Central', 'Racing Juvenil', null, 'Cancha principal · Próximo'], ['04 AGO · 19:00', 'Estrella Roja', 'Club del Parque', null, 'Cancha auxiliar · Próximo']],
    standings: [['Atlético Sur', 3, 3, 0, 0, 9], ['Unión Central', 3, 2, 1, 0, 7], ['Deportivo Norte', 3, 1, 1, 1, 4], ['Racing Juvenil', 3, 1, 0, 2, 3]]
  },
  'futsal-relampago': {
    organizer: 'Liga Canaria de Futsal', mode: 'Eliminación directa', scoring: 'Victoria por partido', duration: '2 tiempos de 20 min.', tiebreak: 'Penales', participantLabel: 'Equipos destacados', standingLabel: 'Equipo',
    participants: [['Fénix Futsal', 'Capitán: Joaquín Pérez · 10 jugadores'], ['Barrio Sur', 'Capitán: Emiliano Costa · 10 jugadores'], ['Los Halcones', 'Capitana: Valentina Ruiz · 9 jugadores'], ['Unión Canaria', 'Capitán: Santiago Lima · 10 jugadores']],
    matches: [['20 JUL · 16:00', 'Fénix Futsal', 'Barrio Sur', '5 – 3', 'Cuartos de final · Finalizado'], ['20 JUL · 17:30', 'Los Halcones', 'Unión Canaria', '2 – 2 (4–3 pen.)', 'Cuartos de final · Finalizado'], ['20 JUL · 20:00', 'Fénix Futsal', 'Los Halcones', null, 'Semifinal · Próximo']],
    standings: [['Fénix Futsal', 1, 1, 0, 0, 3], ['Los Halcones', 1, 1, 0, 0, 3], ['Unión Canaria', 1, 0, 1, 0, 1], ['Barrio Sur', 1, 0, 0, 1, 0]]
  },
  'suizo-invierno': {
    organizer: 'Club Uruguayo de Ajedrez', mode: 'Sistema suizo · 7 rondas', scoring: '1 victoria · ½ tablas', duration: '60 min. + 30 seg.', tiebreak: 'Buchholz', participantLabel: 'Jugadores destacados', standingLabel: 'Jugador',
    participants: [['Camila Torres', 'ELO 1842'], ['Nicolás Méndez', 'ELO 1798'], ['Martín Suárez', 'ELO 1765'], ['Agustina Ramos', 'ELO 1731']],
    matches: [['05 AGO · 18:00', 'Camila Torres', 'Nicolás Méndez', null, 'Mesa 1 · Ronda 1'], ['05 AGO · 18:00', 'Martín Suárez', 'Agustina Ramos', null, 'Mesa 2 · Ronda 1'], ['05 AGO · 18:00', 'Federico Silva', 'Paula Acosta', null, 'Mesa 3 · Ronda 1']],
    standings: [['Camila Torres', 3, 3, 0, 0, 3], ['Nicolás Méndez', 3, 2, 1, 0, 2.5], ['Martín Suárez', 3, 2, 0, 1, 2], ['Agustina Ramos', 3, 1, 1, 1, 1.5]]
  },
  'liga-juvenil': {
    organizer: 'Federación Juvenil Metropolitana', mode: 'Liga + playoffs', scoring: '2 victoria · 1 derrota', duration: '4 cuartos de 10 min.', tiebreak: 'Diferencia de puntos', participantLabel: 'Equipos destacados', standingLabel: 'Equipo',
    participants: [['Aguada U18', 'Entrenador: Pablo Gómez · 12 jugadores'], ['Malvín U18', 'Entrenadora: Laura Díaz · 12 jugadores'], ['Welcome U18', 'Entrenador: Andrés Pérez · 11 jugadores'], ['Bohemios U18', 'Entrenador: Martín Castro · 12 jugadores']],
    matches: [['18 JUL · 19:00', 'Aguada U18', 'Malvín U18', '78 – 72', 'Fecha 4 · Finalizado'], ['19 JUL · 18:30', 'Welcome U18', 'Bohemios U18', '64 – 69', 'Fecha 4 · Finalizado'], ['25 JUL · 20:00', 'Malvín U18', 'Welcome U18', null, 'Fecha 5 · Próximo']],
    standings: [['Aguada U18', 5, 5, 0, 0, 10], ['Malvín U18', 5, 4, 0, 1, 9], ['Bohemios U18', 5, 3, 0, 2, 8], ['Welcome U18', 5, 2, 0, 3, 7]]
  },
  'open-tenis': {
    organizer: 'Carrasco Lawn Tennis', mode: 'Eliminación individual', scoring: 'Sets al mejor de 3', duration: 'Sin límite de tiempo', tiebreak: 'Tie-break a 7', participantLabel: 'Jugadores destacados', standingLabel: 'Jugador',
    participants: [['Sofía Cabrera', 'Ranking local #4'], ['Martina López', 'Ranking local #7'], ['Valentina Núñez', 'Ranking local #11'], ['Florencia Silva', 'Ranking local #15']],
    matches: [['12 AGO · 10:00', 'Sofía Cabrera', 'Florencia Silva', null, 'Cancha 1 · Primera ronda'], ['12 AGO · 11:30', 'Martina López', 'Valentina Núñez', null, 'Cancha 2 · Primera ronda'], ['12 AGO · 13:00', 'Paula Méndez', 'Ana Rodríguez', null, 'Cancha 1 · Primera ronda']],
    standings: [['Sofía Cabrera', 0, 0, 0, 0, 0], ['Martina López', 0, 0, 0, 0, 0], ['Valentina Núñez', 0, 0, 0, 0, 0], ['Florencia Silva', 0, 0, 0, 0, 0]]
  },
  'copa-esports': {
    organizer: 'Lidenskap Gaming', mode: 'VALORANT · Llave de eliminación', scoring: 'Series Bo3', duration: 'Hasta 3 mapas', tiebreak: 'Mapa decisivo', participantLabel: 'Equipos de VALORANT', standingLabel: 'Equipo',
    participants: [['Ruby Wolves', 'Capitán: RBL Wolf · 5 jugadores'], ['Southern Byte', 'Capitana: SB Luna · 5 jugadores'], ['Montevideo Core', 'Capitán: MVC Zero · 5 jugadores'], ['Atlantic Five', 'Capitán: AF Neo · 5 jugadores']],
    matches: [['08 AGO · 18:00', 'Ruby Wolves', 'Atlantic Five', null, 'VALORANT · Grupo A · Bo3'], ['08 AGO · 20:30', 'Southern Byte', 'Montevideo Core', null, 'VALORANT · Grupo B · Bo3'], ['09 AGO · 19:00', 'Ganador llave A', 'Ganador llave B', null, 'VALORANT · Semifinal · Bo3']],
    standings: [['Ruby Wolves', 0, 0, 0, 0, 0], ['Southern Byte', 0, 0, 0, 0, 0], ['Montevideo Core', 0, 0, 0, 0, 0], ['Atlantic Five', 0, 0, 0, 0, 0]]
  },
  'lol-rift-league': {
    organizer: 'Liga Digital del Sur', mode: 'League of Legends · Liga + playoffs', scoring: '1 victoria por serie', duration: 'Series Bo3', tiebreak: 'Diferencia de partidas', participantLabel: 'Equipos de League of Legends', standingLabel: 'Equipo',
    participants: [['Nexus del Sur', 'Top · Jungle · Mid · ADC · Support'], ['River Plate Gaming', 'Plantel principal · 5 titulares'], ['Montevideo Titans', 'Plantel principal · 5 titulares'], ['Pampa Esports', 'Plantel principal · 5 titulares']],
    matches: [['10 AGO · 18:00', 'Nexus del Sur', 'Pampa Esports', '2 – 0', 'LoL · Fecha 1 · Finalizado'], ['10 AGO · 21:00', 'River Plate Gaming', 'Montevideo Titans', null, 'LoL · Fecha 1 · Próximo'], ['12 AGO · 20:00', 'Nexus del Sur', 'Montevideo Titans', null, 'LoL · Fecha 2 · Próximo']],
    standings: [['Nexus del Sur', 1, 1, 0, 0, 3], ['River Plate Gaming', 0, 0, 0, 0, 0], ['Montevideo Titans', 0, 0, 0, 0, 0], ['Pampa Esports', 1, 0, 0, 1, 0]]
  },
  'cs2-open': {
    organizer: 'Oriental Gaming League', mode: 'Counter-Strike 2 · Eliminación directa', scoring: 'Series Bo3', duration: 'Hasta 3 mapas', tiebreak: 'Overtime MR3', participantLabel: 'Equipos de Counter-Strike 2', standingLabel: 'Equipo',
    participants: [['Carbon Five', 'Roster CS2 · 5 titulares'], ['Delta Force UY', 'Roster CS2 · 5 titulares'], ['Aguada Gaming', 'Roster CS2 · 5 titulares'], ['Mate Club', 'Roster CS2 · 5 titulares']],
    matches: [['15 AGO · 17:00', 'Carbon Five', 'Mate Club', null, 'CS2 · Cuartos de final · Bo3'], ['15 AGO · 20:00', 'Delta Force UY', 'Aguada Gaming', null, 'CS2 · Cuartos de final · Bo3'], ['16 AGO · 19:00', 'Ganador cuarto 1', 'Ganador cuarto 2', null, 'CS2 · Semifinal · Bo3']],
    standings: [['Carbon Five', 0, 0, 0, 0, 0], ['Delta Force UY', 0, 0, 0, 0, 0], ['Aguada Gaming', 0, 0, 0, 0, 0], ['Mate Club', 0, 0, 0, 0, 0]]
  },
  'tft-masters': {
    organizer: 'Lidenskap Tactics', mode: 'Teamfight Tactics · Sistema suizo', scoring: '8 a 1 puntos por posición', duration: '3 partidas por ronda', tiebreak: 'Promedio de posición', participantLabel: 'Jugadores de Teamfight Tactics', standingLabel: 'Jugador',
    participants: [['LunaUY', 'Riot ID · TFT Challenger'], ['MateTáctico', 'Riot ID · TFT Grandmaster'], ['PampaRoll', 'Riot ID · TFT Master'], ['NeoComp', 'Riot ID · TFT Master']],
    matches: [['18 AGO · 18:00', 'Lobby A · 8 jugadores', '3 partidas', null, 'TFT · Ronda suiza 1'], ['18 AGO · 20:30', 'Lobby B · 8 jugadores', '3 partidas', null, 'TFT · Ronda suiza 1'], ['19 AGO · 19:00', 'Top 8 acumulado', 'Lobby final', null, 'TFT · Final']],
    standings: [['LunaUY', 3, 2, 1, 0, 22], ['MateTáctico', 3, 1, 2, 0, 19], ['PampaRoll', 3, 1, 1, 1, 16], ['NeoComp', 3, 1, 0, 2, 13]]
  },
  'voley-playa': {
    organizer: 'Intendencia de Montevideo', mode: 'Grupos + eliminación', scoring: 'Partidos al mejor de 3 sets', duration: 'Sets a 21 puntos', tiebreak: 'Diferencia de sets', participantLabel: 'Parejas destacadas', standingLabel: 'Pareja',
    participants: [['Pereira / Silva', 'Pareja #1'], ['Ramos / Costa', 'Pareja #2'], ['López / Méndez', 'Pareja #3'], ['Torres / Díaz', 'Pareja #4']],
    matches: [['16 AGO · 09:00', 'Pereira / Silva', 'Torres / Díaz', null, 'Cancha 1 · Grupo A'], ['16 AGO · 09:45', 'Ramos / Costa', 'López / Méndez', null, 'Cancha 2 · Grupo A'], ['16 AGO · 11:00', 'Pareja 1.ª Grupo A', 'Pareja 2.ª Grupo B', null, 'Semifinal']],
    standings: [['Pereira / Silva', 0, 0, 0, 0, 0], ['Ramos / Costa', 0, 0, 0, 0, 0], ['López / Méndez', 0, 0, 0, 0, 0], ['Torres / Díaz', 0, 0, 0, 0, 0]]
  },
  'sevens-verano': {
    organizer: 'Carrasco Polo Club', mode: 'Grupos + Copa de Oro/Plata', scoring: '3 victoria · 1 empate', duration: '2 tiempos de 7 min.', tiebreak: 'Diferencia de tantos', participantLabel: '16 equipos y sus planteles', standingLabel: 'Equipo',
    participants: [['Old Christians', 'Capitán: Mateo Silva · 7 titulares + 5 suplentes'], ['Carrasco Polo', 'Capitán: Felipe Ardao · 7 titulares + 5 suplentes'], ['Old Boys', 'Capitán: Joaquín Sosa · 7 titulares + 5 suplentes'], ['Trébol de Paysandú', 'Capitán: Lucas Pérez · 7 titulares + 5 suplentes'], ['Montevideo Cricket', 'Capitán: Tomás Costa · 7 titulares + 5 suplentes'], ['PSG Rugby', 'Capitán: Bruno Lima · 7 titulares + 5 suplentes'], ['Champagnat', 'Capitán: Ignacio Vidal · 7 titulares + 5 suplentes'], ['Seminario', 'Capitán: Agustín Ramos · 7 titulares + 5 suplentes'], ['Lobos de Punta del Este', 'Capitán: Nicolás Núñez · 7 titulares + 5 suplentes'], ['Cuervos Rugby', 'Capitán: Martín Suárez · 7 titulares + 5 suplentes'], ['Ceibos', 'Capitán: Franco Pereira · 7 titulares + 5 suplentes'], ['La Olla Florida', 'Capitán: Santiago Cabrera · 7 titulares + 5 suplentes'], ['Círculo de Tenis', 'Capitán: Emiliano Díaz · 7 titulares + 5 suplentes'], ['Cricket B', 'Capitán: Andrés López · 7 titulares + 5 suplentes'], ['Cardos Rugby', 'Capitán: Gonzalo Méndez · 7 titulares + 5 suplentes'], ['Toros de Durazno', 'Capitán: Facundo Rodríguez · 7 titulares + 5 suplentes']],
    matches: [['02 JUL · 14:00', 'Old Christians', 'Carrasco Polo', '26 – 19', 'Final Copa de Oro · Finalizado'], ['02 JUL · 13:20', 'Old Boys', 'Trébol de Paysandú', '17 – 22', 'Final Copa de Plata · Finalizado'], ['02 JUL · 12:40', 'Montevideo Cricket', 'PSG Rugby', '31 – 12', 'Partido por 5.º puesto · Finalizado']],
    standings: [['Old Christians', 5, 5, 0, 0, 15], ['Carrasco Polo', 5, 4, 0, 1, 12], ['Trébol de Paysandú', 5, 3, 0, 2, 9], ['Old Boys', 5, 2, 0, 3, 6], ['Montevideo Cricket', 4, 2, 0, 2, 6], ['PSG Rugby', 4, 1, 0, 3, 3]]
  }
};

const CALENDAR_MONTHS = {
  ENE: 1, FEB: 2, MAR: 3, ABR: 4, MAY: 5, JUN: 6,
  JUL: 7, AGO: 8, SEP: 9, OCT: 10, NOV: 11, DIC: 12
};
const CALENDAR_WEEKDAYS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const CALENDAR_MONTH_LABELS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const SGDM_SCHEDULE = SGDM_TOURNAMENTS.flatMap(tournament => {
  const detail = SGDM_TOURNAMENT_DETAILS[tournament.id];
  return (detail?.matches || []).map((match, index) => {
    const [datePart, time = '--:--'] = match[0].split('·').map(part => part.trim());
    const [dayText, monthText] = datePart.split(/\s+/);
    const month = CALENDAR_MONTHS[monthText];
    const year = tournament.date.match(/\b(20\d{2})\b/)?.[1] || '2026';
    const date = `${year}-${String(month).padStart(2, '0')}-${String(Number(dayText)).padStart(2, '0')}`;
    const phaseParts = match[4].split('·').map(part => part.trim());
    const phase = phaseParts.filter(part => !['Próximo', 'Finalizado', tournament.game].includes(part)).join(' · ');
    return {
      id: `${tournament.id}-${index}`,
      tournamentId: tournament.id,
      discipline: tournament.discipline,
      disciplineLabel: tournament.disciplineLabel,
      game: tournament.game || '',
      gameSlug: tournament.gameSlug || '',
      format: tournament.format,
      formatLabel: tournament.formatLabel,
      date,
      day: CALENDAR_WEEKDAYS[new Date(`${date}T12:00:00`).getDay()],
      dateLabel: datePart,
      time,
      phase: phase || tournament.formatLabel,
      home: match[1],
      away: match[2],
      score: match[3],
      status: match[3] ? 'finalizado' : 'proximo',
      statusLabel: match[3] ? 'Finalizado' : 'Próximo',
      venue: tournament.venue
    };
  });
}).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

function statusClass(status) {
  return status === 'abierto' ? 'status-open' : status === 'curso' ? 'status-progress' : 'status-closed';
}

// Mapeo del estado real de torneo (planificado/en_curso/finalizado/
// cancelado) al vocabulario que ya usa la UI de filtros (abierto/curso/
// cerrado), para no tener que rehacer el <select> de torneos.html.
const ESTADO_TORNEO_A_UI = {
  planificado: 'abierto',
  en_curso: 'curso',
  finalizado: 'cerrado',
  cancelado: 'cerrado',
};
const ESTADO_UI_LABEL = { abierto: 'Inscripciones abiertas', curso: 'En curso', cerrado: 'Finalizado' };
const FORMATO_LABEL = { liga: 'Liga', eliminacion: 'Eliminación Directa', suizo: 'Sistema Suizo' };

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
        <div class="card-category-line"><p class="section-eyebrow">${t.disciplinaNombre || 'Personalizada'}</p></div><h3>${t.nombre}</h3><p>${t.descripcion || ''}</p>
        <dl class="card-meta"><div><dt>Inicio</dt><dd>${t.fechaInicio || 'A definir'}</dd></div><div><dt>Cupos</dt><dd>${cupos}</dd></div><div><dt>Sede</dt><dd>${t.sede || 'A definir'}</dd></div></dl>
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
  let selectedYear = params.get('anio') || '2026';
  let selectedMonth = params.get('mes') ? String(Number(params.get('mes'))) : '';
  if (selectedGame) selectedDiscipline = 'esports';
  if (selectedDate) {
    selectedYear = selectedDate.slice(0, 4);
    selectedMonth = String(Number(selectedDate.slice(5, 7)));
  }
  yearSelect.value = selectedYear;
  gameSelect.value = selectedGame;

  const renderPeriodControls = () => {
    const yearMatches = SGDM_SCHEDULE.filter(match => match.date.startsWith(`${selectedYear}-`));
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
    const filtered = SGDM_SCHEDULE.filter(match =>
      match.date.startsWith(`${selectedYear}-`) &&
      (!selectedMonth || Number(match.date.slice(5, 7)) === Number(selectedMonth)) &&
      (!selectedDiscipline || match.discipline === selectedDiscipline) &&
      (!selectedGame || match.gameSlug === selectedGame) &&
      (!selectedDate || match.date === selectedDate) &&
      (!formatSelect.value || match.format === formatSelect.value) &&
      (!statusSelect.value || match.status === statusSelect.value)
    );
    grid.innerHTML = filtered.map(match => {
      const tournament = SGDM_TOURNAMENTS.find(item => item.id === match.tournamentId);
      return `<article class="schedule-card ${match.status === 'finalizado' ? 'schedule-finished' : ''}">
        <header><div class="schedule-badges"><span class="discipline-badge discipline-${match.discipline}">${match.disciplineLabel}</span>${match.game ? `<span class="game-badge game-${match.gameSlug}">${match.game}</span>` : ''}</div><span class="schedule-status schedule-${match.status}">${match.statusLabel}</span></header>
        <div class="schedule-body">
          <div class="schedule-time"><strong>${match.time}</strong><span>${match.dateLabel}</span><small>UTC−3</small></div>
          <div class="schedule-match">
            <p>${tournament.name}</p>
            <div><strong>${match.home}</strong><span>${match.score || 'VS.'}</span><strong>${match.away}</strong></div>
            <small>${match.phase} · ${match.formatLabel}</small>
          </div>
        </div>
        <div class="schedule-card-footer"><span>${match.venue}${match.game ? ' · Servidor LATAM' : ''}</span><a href="detalle-torneo.html?id=${match.tournamentId}">Ver torneo →</a></div>
      </article>`;
    }).join('');
    count.textContent = `${filtered.length} ${filtered.length === 1 ? 'encuentro' : 'encuentros'}`;
    document.getElementById('calendarTotal').textContent = SGDM_SCHEDULE.filter(match => match.date.startsWith(`${selectedYear}-`)).length;
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
    selectedYear = '2026';
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

  const ESTADOS = { planificado: 'Inscripciones Abiertas', en_curso: 'En Curso', finalizado: 'Finalizado', cancelado: 'Cancelado' };
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

      const teamsList = document.getElementById('teamsList');
      if (teamsList) {
        teamsList.innerHTML = confirmados.length
          ? confirmados.map(i => `<li><span class="team-bullet">🛡️</span> ${i.nombre}</li>`).join('')
          : '<li>Todavía no hay inscriptos confirmados.</li>';
      }

      const registerBtn = document.getElementById('btnRegisterInDetail');
      if (registerBtn) {
        if (!sesionUsuario) {
          registerBtn.textContent = 'Iniciar sesión para inscribirme';
          registerBtn.addEventListener('click', () => openAuthModal('login', `detalle-torneo.html?id=${t.id}`));
        } else {
          registerBtn.addEventListener('click', () => alert('La inscripción de equipos se habilita en la próxima etapa.'));
        }
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
      stats: [['Torneos activos', '10'], ['Usuarios administrativos', '3'], ['Reportes disponibles', '12'], ['Eventos de auditoría', '48']],
      extras: [['Nivel de acceso', 'Control completo'], ['Ámbito', 'Todo el sistema']],
      activityTitle: 'GESTIÓN RECIENTE',
      activity: [
        ['status-progress', 'Pendiente', 'Revisar resultado informado', 'Copa Apertura · Fecha 3', 'panel.html#panel-results'],
        ['status-open', 'Sistema', 'Administrar usuarios y roles', '3 cuentas administrativas', 'panel.html'],
        ['status-closed', 'Auditoría', 'Consultar registro de actividad', '48 eventos registrados', 'panel.html#panel-audit']
      ]
    },
    ORGANIZADOR: {
      subtitle: 'Gestión limitada a sus torneos asignados',
      stats: [['Torneos asignados', '3'], ['Participantes', '74'], ['Resultados pendientes', '6'], ['Reportes', '3']],
      extras: [['Nivel de acceso', 'Torneos asignados'], ['Ámbito', 'Organización y resultados']],
      activityTitle: 'TORNEOS ASIGNADOS',
      activity: [
        ['status-open', 'Abierto', 'Copa Apertura 2026', 'Fútbol · 10 de 16 cupos', 'detalle-torneo.html?id=copa-apertura'],
        ['status-progress', 'En curso', 'Liga Juvenil U18', 'Básquetbol · Fecha 5', 'detalle-torneo.html?id=liga-juvenil'],
        ['status-open', 'Abierto', 'Open Individual de Verano', 'Tenis · 18 de 32 cupos', 'detalle-torneo.html?id=open-tenis']
      ]
    },
    PARTICIPANTE: {
      subtitle: 'Montevideo, Uruguay · Miembro desde marzo de 2026',
      stats: [['Torneos jugados', '12'], ['Victorias', '28'], ['Posición histórica', '#18'], ['Próximo partido', '03 AGO']],
      extras: [['Equipo', 'Atlético Sur'], ['Disciplina principal', 'Fútbol']],
      activityTitle: 'MIS TORNEOS',
      activity: [
        ['status-open', 'Próximo', 'Copa Apertura 2026', 'Fútbol · 3 de agosto', 'detalle-torneo.html?id=copa-apertura'],
        ['status-progress', 'En curso', 'Suizo Clásico de Invierno', 'Ajedrez · Ronda 3 de 7', 'detalle-torneo.html?id=suizo-invierno'],
        ['status-closed', 'Finalizado', 'Liga Juvenil U18', 'Básquetbol · 4.º puesto', 'detalle-torneo.html?id=liga-juvenil']
      ]
    },
    PUBLICO: {
      subtitle: 'Cuenta de consulta · Sin permisos de modificación',
      stats: [['Torneos consultables', '11'], ['Calendarios públicos', '11'], ['Resultados oficiales', '24'], ['Acciones de gestión', '0']],
      extras: [['Nivel de acceso', 'Solo lectura'], ['Ámbito', 'Información pública']],
      activityTitle: 'ACCESO PÚBLICO',
      activity: [
        ['status-open', 'Consulta', 'Torneos publicados', 'Buscar por disciplina o formato', 'torneos.html'],
        ['status-progress', 'Consulta', 'Calendarios y resultados', 'Información oficial disponible', 'detalle-torneo.html?id=copa-apertura'],
        ['status-closed', 'Restringido', 'Sin acciones de modificación', 'No puede inscribirse ni administrar', 'torneos.html']
      ]
    }
  }[sesionUsuario.rol];

  let storedProfile = {};
  try { storedProfile = JSON.parse(localStorage.getItem(`lidenskap-profile-${sesionUsuario.email}`) || '{}'); } catch { storedProfile = {}; }
  const displayName = storedProfile.nombre || sesionUsuario.nombre;
  document.getElementById('profileContent').hidden = false;
  document.getElementById('profileInitials').textContent = sesionUsuario.iniciales;
  document.getElementById('profileRole').textContent = sesionUsuario.rolNombre;
  document.getElementById('profileHeading').textContent = displayName.toUpperCase();
  document.getElementById('profileSubtitle').textContent = profileData.subtitle;
  document.getElementById('profileEmail').textContent = sesionUsuario.email;
  document.getElementById('profileRoleDetail').textContent = sesionUsuario.rolNombre;
  profileData.stats.forEach(([label, value], index) => {
    document.getElementById(`statLabel${index + 1}`).textContent = label;
    document.getElementById(`statValue${index + 1}`).textContent = value;
  });
  document.getElementById('profileExtraLabel1').textContent = profileData.extras[0][0];
  document.getElementById('profileExtraValue1').textContent = profileData.extras[0][1];
  document.getElementById('profileExtraLabel2').textContent = profileData.extras[1][0];
  document.getElementById('profileExtraValue2').textContent = profileData.extras[1][1];
  document.getElementById('profileActivityTitle').textContent = profileData.activityTitle;
  document.getElementById('profileActivity').innerHTML = profileData.activity.map(([status, badge, title, subtitle, href]) => `<a href="${href}"><span class="status-pill ${status}">${badge}</span><div><strong>${title}</strong><small>${subtitle}</small></div><span>→</span></a>`).join('');

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
  const allowedModules = isAdmin
    ? ['users', 'tournaments', 'participants', 'results', 'rounds', 'reports', 'audit', 'settings']
    : ['tournaments', 'participants', 'results', 'rounds', 'reports'];
  document.getElementById('dashboardRole').textContent = sesionUsuario.rolNombre;
  document.getElementById('dashboardTitle').textContent = isAdmin ? 'PANEL GENERAL' : 'MIS TORNEOS';
  document.getElementById('dashboardDescription').textContent = isAdmin ? 'Control completo de usuarios, módulos, torneos, resultados, reportes y auditoría.' : 'Gestión limitada a las competencias asignadas a tu cuenta de organizador.';
  document.querySelectorAll('[data-admin-only]').forEach(element => {
    if (!element.hasAttribute('data-panel-module')) element.hidden = !isAdmin;
  });
  document.body.classList.toggle('organizer-panel', !isAdmin);
  if (!isAdmin) {
    const values = ['3', '74', '12', '6'];
    document.querySelectorAll('.stat-grid strong').forEach((element, index) => { if (values[index]) element.textContent = values[index]; });
  }

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
        return `<div class="field ${field.full ? 'field-full' : ''}"><label for="panel-${field.name}">${field.label}</label><select id="panel-${field.name}" name="${field.name}" required>${field.options.map(option => `<option value="${option}"${option === value ? ' selected' : ''}>${option}</option>`).join('')}</select></div>`;
      }
      return `<div class="field ${field.full ? 'field-full' : ''}"><label for="panel-${field.name}">${field.label}</label><input id="panel-${field.name}" name="${field.name}" type="${field.type || 'text'}" value="${value}" ${field.required === false ? '' : 'required'}></div>`;
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

  const ROL_LABEL = { ADMIN: 'Administrador general', ORGANIZADOR: 'Organizador', PARTICIPANTE: 'Participante', PUBLICO: 'Usuario público' };
  const ROL_LABEL_A_CODIGO = Object.fromEntries(Object.entries(ROL_LABEL).map(([code, label]) => [label, code]));

  if (isAdmin) {
    let users = [];

    const renderUsers = () => {
      const query = normalize(document.getElementById('usersSearch').value);
      const visible = users.filter(user => !query || normalize(Object.values(user).join(' ')).includes(query));
      document.getElementById('usersCount').textContent = `${visible.length} de ${users.length} usuarios`;
      document.getElementById('usersTableBody').innerHTML = visible.map(user => `<tr><td><strong>${user.nombre} ${user.apellido}</strong></td><td>${user.email}</td><td>${ROL_LABEL[user.rol] || user.rol}</td><td><span class="status-pill ${user.estado === 'activo' ? 'status-open' : 'status-closed'}">${user.estado}</span></td><td><div class="table-actions"><button class="table-action" type="button" data-user-edit="${user.id}">Editar</button>${user.id === sesionUsuario.id_usuario || user.estado !== 'activo' ? '' : `<button class="table-action danger-action" type="button" data-user-delete="${user.id}">Desactivar</button>`}</div></td></tr>`).join('');
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
          title: 'EDITAR USUARIO', help: 'Actualiza los datos básicos y el rol asignado.',
          fields: [{ name: 'nombre', label: 'Nombre' }, { name: 'apellido', label: 'Apellido' }, { name: 'email', label: 'Correo', type: 'email' }, { name: 'rol', label: 'Rol', type: 'select', options: Object.values(ROL_LABEL), full: true }],
          values: { ...user, rol: ROL_LABEL[user.rol] || user.rol },
          onSubmit: data => {
            fetch(`api/usuario.php?id=${user.id}`, {
              method: 'PUT', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ nombre: data.nombre, apellido: data.apellido, email: data.email, rol: ROL_LABEL_A_CODIGO[data.rol] || data.rol }),
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
      title: 'CREAR USUARIO ADMINISTRATIVO', help: 'Define la cuenta y su nivel de acceso. La contraseña inicial se la comunicás vos a la persona.',
      fields: [
        { name: 'nombre', label: 'Nombre' }, { name: 'apellido', label: 'Apellido' },
        { name: 'email', label: 'Correo', type: 'email' }, { name: 'password', label: 'Contraseña inicial', type: 'password' },
        { name: 'rol', label: 'Rol', type: 'select', options: ['Administrador general', 'Organizador'], full: true },
      ],
      onSubmit: data => {
        fetch('api/usuarios.php', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, rol: ROL_LABEL_A_CODIGO[data.rol] || data.rol }),
        })
          .then(response => response.json())
          .then(result => { showToast(result.success ? 'Usuario creado.' : result.error); if (result.success) cargarUsuarios(); });
      }
    }));
    cargarUsuarios();
  }

  const assignedIds = ['copa-apertura', 'liga-juvenil', 'open-tenis'];
  const dashboardTournaments = isAdmin ? SGDM_TOURNAMENTS : SGDM_TOURNAMENTS.filter(tournament => assignedIds.includes(tournament.id));
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
      return `<tr><td><strong>${t.nombre}</strong></td><td>${t.disciplinaNombre || 'Personalizada'}</td><td>${t.fechaInicio || 'A definir'}</td><td>${cupos}</td><td><span class="status-pill ${statusClass(estadoUi)}">${ESTADO_UI_LABEL[estadoUi]}</span></td><td><a class="table-action" href="detalle-torneo.html?id=${t.id}">Gestionar</a></td></tr>`;
    }).join('');
  };
  document.getElementById('panelTournamentSearch').addEventListener('input', renderTournaments);
  fetch('api/torneos.php').then(response => response.json()).then(data => { torneosReales = data.success ? data.torneos : []; renderTournaments(); });

  const firstNames = ['Lucía', 'Mateo', 'Sofía', 'Diego', 'Valentina', 'Joaquín', 'Camila', 'Nicolás', 'Martina', 'Santiago', 'Agustina', 'Bruno', 'Florencia', 'Emiliano', 'Paula', 'Facundo', 'Martín', 'Ana'];
  const lastNames = ['Fernández', 'Rodríguez', 'Martínez', 'Silva', 'Pérez', 'Sosa', 'Torres', 'Méndez', 'López', 'Costa', 'Ramos', 'Cabrera', 'Núñez', 'Díaz'];
  const teamNames = ['Unión Central', 'Club del Parque', 'Atlético Sur', 'Deportivo Norte', 'Racing Juvenil', 'Fénix Futsal', 'Barrio Sur', 'Los Halcones', 'Aguada U18', 'Malvín U18', 'Ruby Wolves', 'Southern Byte', 'Carrasco Polo', 'Old Christians', 'Trébol de Paysandú', 'Sin equipo'];
  const participants = Array.from({ length: isAdmin ? 246 : 74 }, (_, index) => ({
    name: `${firstNames[index % firstNames.length]} ${lastNames[(index * 5) % lastNames.length]}`,
    team: teamNames[(index * 3) % teamNames.length],
    tournament: dashboardTournaments[index % dashboardTournaments.length].name,
    role: index % 9 === 0 ? 'Capitán/a' : 'Jugador/a',
    status: index % 11 === 0 ? 'Pendiente' : 'Confirmada'
  }));
  paginate({
    rows: participants,
    tbody: document.getElementById('participantsTableBody'),
    count: document.getElementById('participantsCount'),
    pageLabel: document.getElementById('participantsPage'),
    prev: document.getElementById('participantsPrev'),
    next: document.getElementById('participantsNext'),
    search: document.getElementById('participantsSearch'),
    renderRow: row => `<tr><td><strong>${row.name}</strong></td><td>${row.team}</td><td>${row.tournament}</td><td>${row.role}</td><td><span class="status-pill ${row.status === 'Confirmada' ? 'status-open' : 'status-progress'}">${row.status}</span></td></tr>`
  });
  document.querySelector('[data-panel-form="participant"]')?.addEventListener('click', () => openPanelForm({
    title: 'INSCRIBIR PARTICIPANTE', help: 'Registra a una persona en un torneo dentro de tu ámbito.',
    fields: [{ name: 'name', label: 'Nombre completo' }, { name: 'team', label: 'Equipo' }, { name: 'tournament', label: 'Torneo', type: 'select', options: dashboardTournaments.map(tournament => tournament.name), full: true }],
    onSubmit: data => {
      participants.unshift({ ...data, role: 'Jugador/a', status: 'Pendiente' });
      document.getElementById('participantsSearch').dispatchEvent(new Event('input'));
      showToast('Participante agregado con estado pendiente.');
    }
  }));

  const disciplines = ['Fútbol', 'Futsal', 'Básquetbol', 'Ajedrez', 'Tenis', 'Esports', 'Voleibol', 'Rugby'];
  const teams = Array.from({ length: isAdmin ? 38 : 12 }, (_, index) => ({
    name: index < teamNames.length - 1 ? teamNames[index] : `${disciplines[index % disciplines.length]} Club ${index + 1}`,
    captain: `${firstNames[(index * 2) % firstNames.length]} ${lastNames[(index * 3) % lastNames.length]}`,
    discipline: disciplines[index % disciplines.length],
    members: 5 + ((index * 7) % 14),
    status: index % 10 === 0 ? 'En revisión' : 'Habilitado'
  }));
  paginate({
    rows: teams,
    tbody: document.getElementById('teamsTableBody'),
    count: document.getElementById('teamsCount'),
    pageLabel: document.getElementById('teamsPage'),
    prev: document.getElementById('teamsPrev'),
    next: document.getElementById('teamsNext'),
    search: document.getElementById('teamsSearch'),
    renderRow: row => `<tr><td><strong>${row.name}</strong></td><td>${row.captain}</td><td>${row.discipline}</td><td>${row.members}</td><td><span class="status-pill ${row.status === 'Habilitado' ? 'status-open' : 'status-progress'}">${row.status}</span></td></tr>`
  });
  document.querySelector('[data-panel-form="team"]')?.addEventListener('click', () => openPanelForm({
    title: 'REGISTRAR EQUIPO', help: 'Carga los datos básicos del nuevo plantel.',
    fields: [{ name: 'name', label: 'Nombre del equipo' }, { name: 'captain', label: 'Capitán/a' }, { name: 'discipline', label: 'Disciplina', type: 'select', options: disciplines }, { name: 'members', label: 'Integrantes', type: 'number' }],
    onSubmit: data => {
      teams.unshift({ ...data, members: Number(data.members), status: 'En revisión' });
      document.getElementById('teamsSearch').dispatchEvent(new Event('input'));
      showToast('Equipo agregado con estado en revisión.');
    }
  }));
  document.querySelectorAll('[data-roster-tab]').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('[data-roster-tab]').forEach(item => item.classList.toggle('active', item === tab));
    document.getElementById('participantsRoster').hidden = tab.dataset.rosterTab !== 'participants';
    document.getElementById('teamsRoster').hidden = tab.dataset.rosterTab !== 'teams';
  }));

  const results = dashboardTournaments.flatMap(tournament => (SGDM_TOURNAMENT_DETAILS[tournament.id]?.matches || []).map((match, index) => ({
    tournament: tournament.name,
    round: match[4],
    matchup: `${match[1]} vs. ${match[2]}`,
    score: match[3] || 'Sin cargar',
    status: match[3] ? 'Oficial' : (tournament.status === 'curso' ? 'Pendiente' : 'Próximo'),
    id: `${tournament.id}-${index}`
  })));
  paginate({
    rows: results,
    tbody: document.getElementById('resultsTableBody'),
    count: document.getElementById('resultsCount'),
    pageLabel: document.getElementById('resultsPage'),
    prev: document.getElementById('resultsPrev'),
    next: document.getElementById('resultsNext'),
    search: document.getElementById('resultsSearch'),
    filter: document.getElementById('resultsStatus'),
    pageSize: 10,
    renderRow: row => `<tr><td><strong>${row.tournament}</strong></td><td>${row.round}</td><td>${row.matchup}</td><td><strong>${row.score}</strong></td><td><span class="status-pill ${row.status === 'Oficial' ? 'status-open' : row.status === 'Pendiente' ? 'status-progress' : 'status-closed'}">${row.status}</span></td><td><button class="table-action" type="button" data-result-edit="${row.id}">${row.status === 'Oficial' ? (isAdmin ? 'Corregir' : 'Solicitar corrección') : 'Cargar'}</button></td></tr>`
  });
  document.getElementById('resultsTableBody').addEventListener('click', event => {
    const button = event.target.closest('[data-result-edit]');
    if (!button) return;
    const result = results.find(item => item.id === button.dataset.resultEdit);
    if (!result) return;
    if (!isAdmin && result.status === 'Oficial') {
      showToast('Solicitud de autorización enviada al administrador para corregir este resultado.');
      return;
    }
    openPanelForm({
      title: result.status === 'Oficial' ? 'CORREGIR RESULTADO' : 'CARGAR RESULTADO',
      help: result.matchup,
      fields: [{ name: 'score', label: 'Marcador' }, { name: 'status', label: 'Estado', type: 'select', options: ['Pendiente', 'Oficial'] }],
      values: result,
      onSubmit: data => {
        result.score = data.score;
        result.status = data.status;
        document.getElementById('resultsSearch').dispatchEvent(new Event('input'));
        showToast('Resultado guardado en el prototipo.');
      }
    });
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

  const roundSelect = document.getElementById('roundTournament');
  roundSelect.innerHTML = dashboardTournaments.map(tournament => `<option value="${tournament.id}">${tournament.name}</option>`).join('');
  const roundState = Object.fromEntries(dashboardTournaments.map(tournament => [tournament.id, { number: 1, status: tournament.status === 'cerrado' ? 'Cerrada' : 'Borrador' }]));
  const renderRounds = () => {
    const tournament = dashboardTournaments.find(item => item.id === roundSelect.value) || dashboardTournaments[0];
    const detail = SGDM_TOURNAMENT_DETAILS[tournament.id];
    const state = roundState[tournament.id];
    document.getElementById('roundFormat').textContent = tournament.formatLabel;
    document.getElementById('roundCurrent').textContent = `Ronda ${state.number}`;
    document.getElementById('roundStatus').textContent = state.status;
    document.getElementById('roundBracket').innerHTML = (detail?.matches || []).map((match, index) => `<article class="bracket-match"><span>Encuentro ${index + 1}</span><div><strong>${match[1]}</strong><b>${match[3] || 'vs.'}</b><strong>${match[2]}</strong></div><small>${match[0]} · ${match[4]}</small></article>`).join('');
    document.getElementById('publishRound').disabled = state.status === 'Publicada' || state.status === 'Cerrada';
    document.getElementById('closeRound').disabled = state.status === 'Cerrada';
  };
  roundSelect.addEventListener('change', renderRounds);
  document.getElementById('generateRound').addEventListener('click', () => {
    const state = roundState[roundSelect.value];
    state.number += 1;
    state.status = 'Borrador';
    renderRounds();
    document.getElementById('roundFeedback').textContent = `Ronda ${state.number} generada para revisión.`;
  });
  document.getElementById('publishRound').addEventListener('click', () => {
    roundState[roundSelect.value].status = 'Publicada';
    renderRounds();
    document.getElementById('roundFeedback').textContent = 'Ronda publicada en la consulta pública.';
  });
  document.getElementById('closeRound').addEventListener('click', () => {
    roundState[roundSelect.value].status = 'Cerrada';
    renderRounds();
    document.getElementById('roundFeedback').textContent = 'Ronda cerrada. Los resultados quedan bloqueados hasta una corrección autorizada.';
  });
  renderRounds();

  const reportSelect = document.getElementById('reportTournament');
  reportSelect.insertAdjacentHTML('beforeend', dashboardTournaments.map(tournament => `<option value="${tournament.id}">${tournament.name}</option>`).join(''));
  const reportRows = dashboardTournaments.map(tournament => {
    const [registered, capacity] = tournament.slots.split('/').map(value => Number(value.trim()));
    const matches = SGDM_TOURNAMENT_DETAILS[tournament.id]?.matches || [];
    return { id: tournament.id, name: tournament.name, discipline: tournament.disciplineLabel, registered, capacity, matches: matches.length, official: matches.filter(match => match[3]).length, status: tournament.statusLabel };
  });
  const renderReports = () => {
    const visible = reportSelect.value ? reportRows.filter(row => row.id === reportSelect.value) : reportRows;
    const registered = visible.reduce((sum, row) => sum + row.registered, 0);
    const capacity = visible.reduce((sum, row) => sum + row.capacity, 0);
    const matches = visible.reduce((sum, row) => sum + row.matches, 0);
    const official = visible.reduce((sum, row) => sum + row.official, 0);
    document.getElementById('reportRegistrations').textContent = registered;
    document.getElementById('reportOccupancy').textContent = capacity ? `${Math.round((registered / capacity) * 100)}%` : '0%';
    document.getElementById('reportMatches').textContent = matches;
    document.getElementById('reportOfficial').textContent = official;
    document.getElementById('reportsTableBody').innerHTML = visible.map(row => `<tr><td><strong>${row.name}</strong></td><td>${row.discipline}</td><td>${row.registered}</td><td>${row.capacity}</td><td>${row.matches}</td><td><span class="status-pill ${row.status.includes('abiertas') ? 'status-open' : row.status === 'En curso' ? 'status-progress' : 'status-closed'}">${row.status}</span></td></tr>`).join('');
  };
  reportSelect.addEventListener('change', renderReports);
  document.getElementById('exportReport').addEventListener('click', () => {
    const visible = reportSelect.value ? reportRows.filter(row => row.id === reportSelect.value) : reportRows;
    downloadCsv('reporte-torneos.csv', ['Torneo', 'Disciplina', 'Inscripciones', 'Cupo', 'Partidos', 'Resultados oficiales', 'Estado'], visible.map(row => [row.name, row.discipline, row.registered, row.capacity, row.matches, row.official, row.status]));
  });
  renderReports();

  if (isAdmin) {
    const auditActions = [
      ['admin@lidenskap.com', 'Resultado actualizado', 'Resultados'],
      ['organizador@lidenskap.com', 'Participante aprobado', 'Participantes'],
      ['admin@lidenskap.com', 'Torneo publicado', 'Torneos'],
      ['admin@lidenskap.com', 'Rol modificado', 'Usuarios'],
      ['organizador@lidenskap.com', 'Ronda cerrada', 'Torneos'],
      ['admin@lidenskap.com', 'Configuración guardada', 'Configuración']
    ];
    const auditRows = Array.from({ length: 48 }, (_, index) => {
      const base = auditActions[index % auditActions.length];
      return { date: `${String(23 - Math.floor(index / 8)).padStart(2, '0')}/07/2026 · ${String(22 - (index % 12)).padStart(2, '0')}:${String((index * 7) % 60).padStart(2, '0')}`, user: base[0], action: base[1], module: base[2], detail: `Registro #AUD-${String(1048 - index).padStart(4, '0')}` };
    });
    paginate({
      rows: auditRows,
      tbody: document.getElementById('auditTableBody'),
      count: document.getElementById('auditCount'),
      pageLabel: document.getElementById('auditPage'),
      prev: document.getElementById('auditPrev'),
      next: document.getElementById('auditNext'),
      search: document.getElementById('auditSearch'),
      pageSize: 12,
      renderRow: row => `<tr><td>${row.date}</td><td>${row.user}</td><td><strong>${row.action}</strong></td><td>${row.module}</td><td>${row.detail}</td></tr>`
    });
    document.getElementById('exportAudit').addEventListener('click', () => {
      downloadCsv('auditoria-lidenskap.csv', ['Fecha y hora', 'Usuario', 'Acción', 'Módulo', 'Detalle'], auditRows.map(row => [row.date, row.user, row.action, row.module, row.detail]));
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
      window.location.href = `detalle-torneo.html?id=${data.id}`;
    } catch {
      feedback.textContent = 'No se pudo conectar con el servidor. Intentá de nuevo.';
      feedback.style.color = 'var(--danger, #e05252)';
    } finally {
      submitBtn.disabled = false;
    }
  });
}
function initializeProfileDropdown() {
  const btn = document.getElementById('profileDropdownBtn');
  const menu = document.getElementById('profileMenu');
  const userEmailSpan = document.getElementById('dropdownUserEmail');
  const logoutBtn = document.getElementById('logoutBtn');

  if (!btn || !menu) return;

  // Email de la sesión real (la misma que usa el resto del sitio).
  if (userEmailSpan) {
    userEmailSpan.textContent = sesionUsuario?.email || 'usuario@lidenskap.com';
  }

  // Alternar apertura/cierre del menú
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = menu.hasAttribute('hidden');
    if (isHidden) {
      menu.removeAttribute('hidden');
      btn.setAttribute('aria-expanded', 'true');
    } else {
      menu.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  // Cerrar al hacer clic fuera del menú
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
      menu.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  // Evento de Cerrar Sesión
  if (logoutBtn) {
    logoutBtn.addEventListener('click', cerrarSesion);
  }
}

// Asegurarse de ejecutar la función al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  initializeProfileDropdown();
});