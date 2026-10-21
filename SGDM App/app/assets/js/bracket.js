/* ============================================================
   LIDENSKAP — SGDM  |  bracket.js
   Vista de llaves (bracket), aportada por el equipo y adaptada a los datos
   reales de api/rondas.php.

   - SGDMBracket.render(contenedor, { firstRound, results })
     Eliminación directa (al mejor de 1): árbol con líneas, camino del
     ganador y campeón.
       firstRound: [['A', 'B'], ['C', null], ...]  cruces de la ronda 1 en
                   orden de llave (null = libre).
       results:    { '1-1': { score: [5, 3], date: '20/07 16:00', note } }
                   clave "ronda-partido" (desde 1). Solo resultados validados.
     También acepta participants: ['A', 'B', ...] ordenados por cabeza de
     serie, y arma la llave sola.
   - SGDMBracket.renderSuizo(contenedor, { rondas, umbral })
     Etapa suiza estilo esports (series al mejor de 3): una columna por
     ronda con los cruces agrupados por récord, y al final los clasificados
     (umbral victorias) y los eliminados (umbral derrotas).
   ============================================================ */

(function () {
  'use strict';

  /* ---------- UTILIDADES ---------- */
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
  ));

  /* Orden clásico de siembra: 1 vs 8, 4 vs 5, 2 vs 7, 3 vs 6...
     Así el 1 y el 2 solo pueden cruzarse en la final. */
  function seedOrder(size) {
    let order = [1];
    while (order.length < size) {
      const total = order.length * 2 + 1;
      order = order.flatMap(seed => [seed, total - seed]);
    }
    return order;
  }

  function roundName(matchCount, roundNumber) {
    const names = { 1: 'Final', 2: 'Semifinales', 4: 'Cuartos de final', 8: 'Octavos de final', 16: 'Dieciseisavos' };
    return names[matchCount] || `Ronda ${roundNumber}`;
  }

  function decideWinner(result) {
    if (!result) return null;
    if (result.winner === 0 || result.winner === 1) return result.winner;
    if (!result.score) return null;
    const [a, b] = result.score;
    if (a !== b) return a > b ? 0 : 1;
    if (result.penalties && result.penalties[0] !== result.penalties[1]) {
      return result.penalties[0] > result.penalties[1] ? 0 : 1;
    }
    return null; // empate sin definir
  }

  /* ---------- LÓGICA: arma todas las rondas ---------- */
  function buildBracket(config = {}) {
    let firstRound;

    if (Array.isArray(config.firstRound) && config.firstRound.length) {
      firstRound = config.firstRound.map(pair => pair.map(name => (name ? { name } : { bye: true })));
    } else {
      const names = (config.participants || []).filter(Boolean);
      if (names.length < 2) return null;
      let size = 2;
      while (size < names.length) size *= 2;
      const slots = seedOrder(size).map(seed => (names[seed - 1] ? { name: names[seed - 1], seed } : { bye: true }));
      firstRound = [];
      for (let i = 0; i < slots.length; i += 2) firstRound.push([slots[i], slots[i + 1]]);
    }

    if ((firstRound.length & (firstRound.length - 1)) !== 0) {
      console.warn('[bracket] La primera ronda debe tener 1, 2, 4, 8... partidos.');
      return null;
    }

    const results = config.results || {};
    const rounds = [];
    let current = firstRound;
    let roundNumber = 1;

    while (true) {
      const matches = current.map(([teamA, teamB], index) => {
        const key = `${roundNumber}-${index + 1}`;
        const result = results[key] || null;

        let winner = null;
        let bye = false;
        if (teamA.bye && teamB.name) { winner = 1; bye = true; }
        else if (teamB.bye && teamA.name) { winner = 0; bye = true; }
        else if (teamA.name && teamB.name) winner = decideWinner(result);

        return { key, number: index + 1, teams: [teamA, teamB], result, winner, bye };
      });

      rounds.push({ number: roundNumber, name: roundName(matches.length, roundNumber), matches });
      if (matches.length === 1) break;

      const advance = match => (match.winner !== null ? { ...match.teams[match.winner] } : { tbd: true });
      const next = [];
      for (let i = 0; i < matches.length; i += 2) next.push([advance(matches[i]), advance(matches[i + 1])]);
      current = next;
      roundNumber += 1;
    }

    const final = rounds[rounds.length - 1].matches[0];
    return { rounds, champion: final.winner !== null ? final.teams[final.winner] : null };
  }

  /* ---------- VISTA: genera el HTML ---------- */
  function teamLabel(team) {
    return team.name || (team.bye ? 'Libre' : 'Por definir');
  }

  function teamRow(team, index, match) {
    const classes = ['bk-team'];
    if (team.bye) classes.push('is-bye');
    if (team.tbd) classes.push('is-tbd');
    if (match.winner !== null && !team.bye) classes.push(match.winner === index ? 'is-winner' : 'is-loser');
    const score = match.result?.score ? match.result.score[index] : '';
    const label = teamLabel(team);
    return `<div class="${classes.join(' ')}">
      <span class="bk-seed">${esc(team.seed ?? '')}</span>
      <span class="bk-name" title="${esc(label)}">${esc(label)}</span>
      <span class="bk-score">${esc(score)}</span>
    </div>`;
  }

  function matchCard(match) {
    const state = match.bye ? 'is-bye' : match.winner !== null ? 'is-done' : 'is-pending';
    const pen = match.result?.penalties;
    const note = match.bye
      ? 'Pasa directo'
      : pen ? `Definido por penales ${pen[0]}–${pen[1]}`
        : match.result?.note || (match.winner !== null ? 'Finalizado' : 'Próximo');
    const [a, b] = match.teams;
    return `<article class="bk-match ${state}" aria-label="${esc(`${teamLabel(a)} contra ${teamLabel(b)}`)}">
      <div class="bk-match-head"><span>Partido ${match.number}</span>${match.result?.date ? `<time>${esc(match.result.date)}</time>` : ''}</div>
      ${teamRow(a, 0, match)}
      ${teamRow(b, 1, match)}
      <div class="bk-match-note">${esc(note)}</div>
    </article>`;
  }

  /* Aviso "Deslizá" solo si la llave no entra en pantalla */
  function scrollHint(container) {
    const hint = container.querySelector('.bk-hint');
    const scroller = container.querySelector('.bk-scroll');
    const updateHint = () => { hint.hidden = scroller.scrollWidth <= scroller.clientWidth + 2; };
    updateHint();
    window.addEventListener('resize', updateHint, { passive: true });
  }

  function renderBracket(container, config) {
    if (!container) return null;
    const data = buildBracket(config);
    if (!data) {
      container.innerHTML = '<p class="bk-empty">Todavía no hay participantes suficientes para generar la llave.</p>';
      return null;
    }

    const lastRound = data.rounds.length - 1;
    const roundsHtml = data.rounds.map((round, roundIndex) => `
      <section class="bk-round">
        <h3 class="bk-round-title">${esc(round.name)}<small>${round.matches.length} ${round.matches.length === 1 ? 'partido' : 'partidos'}</small></h3>
        <div class="bk-round-body">
          ${round.matches.map((match, matchIndex) => {
            const position = roundIndex === lastRound ? 'is-single' : matchIndex % 2 === 0 ? 'is-top' : 'is-bottom';
            const fed = roundIndex > 0 && match.teams.every(team => !team.tbd) ? ' is-fed' : '';
            const decided = match.winner !== null ? ' is-decided' : '';
            return `<div class="bk-slot ${position}${decided}${fed}">${matchCard(match)}</div>`;
          }).join('')}
        </div>
      </section>`).join('');

    const champion = data.champion;
    const championHtml = `
      <section class="bk-round bk-round--champion">
        <h3 class="bk-round-title">Campeón<small>${champion ? 'Definido' : 'En juego'}</small></h3>
        <div class="bk-round-body">
          <div class="bk-slot${champion ? ' is-fed' : ''}">
            <div class="bk-champion${champion ? ' is-crowned' : ''}">
              <span aria-hidden="true">🏆</span>
              <strong>${esc(champion ? champion.name : 'Por definir')}</strong>
            </div>
          </div>
        </div>
      </section>`;

    container.innerHTML = `
      <p class="bk-hint">Deslizá para ver todas las rondas →</p>
      <div class="bk-scroll" tabindex="0" role="region" aria-label="Llave de eliminación directa">
        <div class="bk-tree">${roundsHtml}${championHtml}</div>
      </div>`;
    scrollHint(container);
    return data;
  }

  /* ---------- ETAPA SUIZA ---------- */
  /* Récord "V-D" de un competidor antes de cada ronda. Solo cuentan los
     resultados validados; un partido libre cuenta como victoria. */
  function renderSuizo(container, { rondas = [], umbral = 2 } = {}) {
    if (!container) return null;
    if (!rondas.length) {
      container.innerHTML = '<p class="bk-empty">Todavía no hay rondas generadas.</p>';
      return null;
    }
    const record = new Map(); // id -> { nombre, v, d }
    const de = (id, nombre) => {
      if (!record.has(id)) record.set(id, { nombre, v: 0, d: 0 });
      return record.get(id);
    };
    const etiqueta = r => `${r.v}-${r.d}`;

    const columnas = rondas.map(ronda => {
      // Agrupa los cruces por el récord con el que llegó el local a esta ronda
      const grupos = new Map();
      ronda.partidos.forEach((p, i) => {
        const local = de(p.idLocal, p.local);
        const visitante = p.libre ? null : de(p.idVisitante, p.visitante);
        const clave = etiqueta(local);
        const validado = p.resultado && p.resultado.validado;
        const match = {
          number: i + 1,
          teams: [{ name: p.local }, visitante ? { name: p.visitante } : { bye: true }],
          result: validado ? { score: [p.resultado.local, p.resultado.visitante], note: p.estado === 'walkover' ? 'Walkover' : 'Serie al mejor de 3' } : null,
          winner: p.libre ? 0 : (validado ? (p.resultado.local > p.resultado.visitante ? 0 : 1) : null),
          bye: p.libre,
        };
        if (!grupos.has(clave)) grupos.set(clave, { v: local.v, d: local.d, partidos: [] });
        grupos.get(clave).partidos.push(match);
      });
      // Después de mostrar la ronda se suman sus resultados al récord
      ronda.partidos.forEach(p => {
        const local = record.get(p.idLocal);
        if (p.libre) { local.v += 1; return; }
        if (!(p.resultado && p.resultado.validado)) return;
        const visitante = record.get(p.idVisitante);
        const [ganador, perdedor] = p.resultado.local > p.resultado.visitante ? [local, visitante] : [visitante, local];
        ganador.v += 1;
        perdedor.d += 1;
      });
      const orden = [...grupos.values()].sort((a, b) => b.v - a.v || a.d - b.d);
      return `
        <section class="bk-round">
          <h3 class="bk-round-title">Ronda ${ronda.numero}<small>${ronda.partidos.length} ${ronda.partidos.length === 1 ? 'partido' : 'partidos'}</small></h3>
          <div class="bk-round-body bk-swiss-body">
            ${orden.map(g => `<div class="bk-group"><p class="bk-group-title">Récord ${g.v}-${g.d}</p>${g.partidos.map(matchCard).join('')}</div>`).join('')}
          </div>
        </section>`;
    }).join('');

    const lista = (titulo, clase, filtro) => {
      const filas = [...record.values()].filter(filtro).sort((a, b) => b.v - a.v || a.d - b.d);
      return `
        <section class="bk-round">
          <h3 class="bk-round-title">${titulo}<small>${filas.length} ${filas.length === 1 ? 'equipo' : 'equipos'}</small></h3>
          <div class="bk-round-body bk-swiss-body">
            <article class="bk-match bk-standing ${clase}">
              ${filas.length ? filas.map(r => `<div class="bk-team"><span class="bk-seed"></span><span class="bk-name" title="${esc(r.nombre)}">${esc(r.nombre)}</span><span class="bk-score">${etiqueta(r)}</span></div>`).join('') : '<div class="bk-match-note">Todavía nadie</div>'}
            </article>
          </div>
        </section>`;
    };

    container.innerHTML = `
      <p class="bk-hint">Deslizá para ver todas las rondas →</p>
      <div class="bk-scroll" tabindex="0" role="region" aria-label="Etapa suiza">
        <div class="bk-tree bk-swiss">
          ${columnas}
          ${lista(`Clasificados (${umbral} victorias)`, 'is-qualified', r => r.v >= umbral)}
          ${lista(`Eliminados (${umbral} derrotas)`, 'is-eliminated', r => r.d >= umbral)}
        </div>
      </div>`;
    scrollHint(container);
    return record;
  }

  window.SGDMBracket = { build: buildBracket, render: renderBracket, renderSuizo };
})();
