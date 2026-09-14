// ============================================
// CO.CA. — Deck Management
// Renders cards, handles filtering
// ============================================

/**
 * Get the Fo.Ca. CSS class for a given level
 * @param {string} livello
 * @returns {string}
 */
export function getFocaBadgeClass(livello) {
  const map = {
    'Nulla': 'badge--foca-nulla',
    'Tirocinio': 'badge--foca-tirocinio',
    'CFM': 'badge--foca-cfm',
    'CFA': 'badge--foca-cfa',
    'WB': 'badge--foca-wb'
  };
  return map[livello] || 'badge--foca-nulla';
}

/**
 * Get a display label for Fo.Ca. level
 * @param {Object} capo
 * @returns {string}
 */
export function getFocaLabel(capo) {
  if (capo.livelloFoca === 'CFM' && capo.cfmDettaglio) {
    return `CFM (${capo.cfmDettaglio})`;
  }
  return capo.livelloFoca || 'Nulla';
}

/**
 * Create a card DOM element for a capo
 * @param {Object} capo - { id, nome, cognome, sesso, livelloFoca, cfmDettaglio, altriIncarichi }
 * @param {Object} options - { showRemove, showRoleSelect, unitId, role, readonly }
 * @returns {HTMLElement}
 */
export function createCardElement(capo, options = {}) {
  const {
    showRemove = false,
    showRoleSelect = false,
    unitId = null,
    role = '',
    readonly = false
  } = options;

  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.capoId = capo.id;
  if (unitId) card.dataset.unitId = unitId;

  // Sex icon
  const sexClass = capo.sesso === 'M' ? 'card__sex-icon--m' : 'card__sex-icon--f';
  const sexSymbol = capo.sesso === 'M' ? '♂' : '♀';

  // Fo.Ca. badge
  const focaBadgeClass = getFocaBadgeClass(capo.livelloFoca);
  const focaLabel = getFocaLabel(capo);

  // Incarichi badges
  const incarichiHTML = (capo.altriIncarichi || [])
    .filter(i => i !== 'Nessuno')
    .map(i => `<span class="badge badge--incarico">${i}</span>`)
    .join('');

  // Remove button (for cards in units)
  const removeHTML = showRemove && !readonly
    ? `<button class="card__remove-btn" title="Rimuovi dall'unità" data-action="remove">✕</button>`
    : '';

  // Role select (for cards in units)
  let roleHTML = '';
  if (showRoleSelect && unitId) {
    // This will be populated by board.js based on the unit
    roleHTML = `<div class="card__role-select" data-unit-id="${unitId}"></div>`;
  }

  const displayNameHTML = capo.soprannome
    ? `${capo.soprannome} <span style="font-size: 0.75em; opacity: 0.7; font-weight: normal; margin-left: 4px;">(${capo.nome} ${capo.cognome})</span>`
    : `${capo.cognome} ${capo.nome}`;

  card.innerHTML = `
    <div class="card__header">
      <span class="card__sex-icon ${sexClass}">${sexSymbol}</span>
      <span class="card__name">${displayNameHTML}</span>
      <span class="card__multi-badge">⚡ Multi</span>
      ${removeHTML}
    </div>
    <div class="card__tags">
      <span class="badge ${focaBadgeClass}">${focaLabel}</span>
      ${incarichiHTML}
    </div>
    ${roleHTML}
  `;

  return card;
}

/**
 * Helper to sort capi array
 */
function sortCapi(capi, sortBy) {
  return [...capi].sort((a, b) => {
    if (sortBy === 'foca') {
      const focaOrder = { 'WB': 1, 'CFA': 2, 'CFM': 3, 'Tirocinio': 4, 'Nulla': 5 };
      const valA = focaOrder[a.livelloFoca] || 99;
      const valB = focaOrder[b.livelloFoca] || 99;
      if (valA !== valB) return valA - valB;
      // fallback to name
      return a.cognome.localeCompare(b.cognome);
    }
    if (sortBy === 'sex') {
      if (a.sesso !== b.sesso) return a.sesso.localeCompare(b.sesso);
      // fallback to name
      return a.cognome.localeCompare(b.cognome);
    }
    // Default 'name'
    const nameA = a.soprannome ? a.soprannome : `${a.cognome} ${a.nome}`;
    const nameB = b.soprannome ? b.soprannome : `${b.cognome} ${b.nome}`;
    return nameA.localeCompare(nameB);
  });
}

/**
 * Render the deck of cards into a container
 * @param {HTMLElement} container - The deck container element
 * @param {Array} capi - Array of capo objects
 * @param {string} filter - Optional search filter
 * @param {string} sortBy - Sort order (name, foca, sex)
 */
export function renderDeck(container, capi, filter = '', sortBy = 'name') {
  container.innerHTML = '';

  let filtered = capi;
  if (filter) {
    const q = filter.toLowerCase();
    filtered = capi.filter(c =>
      `${c.nome} ${c.cognome}`.toLowerCase().includes(q) ||
      (c.soprannome || '').toLowerCase().includes(q) ||
      (c.livelloFoca || '').toLowerCase().includes(q)
    );
  }

  filtered = sortCapi(filtered, sortBy);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="deck-drawer__empty">
        ${capi.length === 0
          ? '🃏 Il mazzo è vuoto. Aggiungi dei capi dalla Dashboard!'
          : '🔍 Nessun capo trovato per questa ricerca.'
        }
      </div>
    `;
    return;
  }

  filtered.forEach(capo => {
    const card = createCardElement(capo);
    container.appendChild(card);
  });
}

/**
 * Render deck preview on dashboard (with delete buttons)
 * @param {HTMLElement} container
 * @param {Array} capi
 * @param {Function} onDelete - callback(capoId)
 * @param {string} sortBy - Sort order (name, foca, sex)
 */
export function renderDeckPreview(container, capi, onDelete, sortBy = 'name') {
  container.innerHTML = '';

  let sorted = sortCapi(capi, sortBy);

  if (sorted.length === 0) {
    container.innerHTML = `
      <div class="deck-drawer__empty" style="grid-column: 1 / -1;">
        🃏 Il mazzo è vuoto. Aggiungi il primo capo!
      </div>
    `;
    return;
  }

  sorted.forEach(capo => {
    const card = createCardElement(capo);
    // Add delete button for dashboard management
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'card__remove-btn';
    deleteBtn.title = 'Elimina capo';
    deleteBtn.textContent = '✕';
    deleteBtn.style.position = 'absolute';
    deleteBtn.style.top = '8px';
    deleteBtn.style.right = '8px';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const name = capo.soprannome ? `${capo.soprannome} (${capo.nome} ${capo.cognome})` : `${capo.nome} ${capo.cognome}`;
      onDelete(capo.id, name);
    });
    card.style.position = 'relative';
    card.appendChild(deleteBtn);
    container.appendChild(card);
  });
}
