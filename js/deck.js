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

  // Photo
  let photoHTML = '';
  if (capo.fotoUrl) {
    photoHTML = `<img src="${capo.fotoUrl}" class="card__photo-large" alt="Foto di ${capo.nome}">`;
  } else {
    const initials = (capo.nome.charAt(0) + (capo.cognome ? capo.cognome.charAt(0) : '')).toUpperCase();
    photoHTML = `<div class="card__photo-large card__photo-placeholder">${initials}</div>`;
  }

  // Sex chip
  const sexClass = capo.sesso === 'M' ? 'chip--sex-m' : 'chip--sex-f';
  const sexLabel = capo.sesso === 'M' ? 'M' : 'F';
  const sexHTML = `<span class="chip ${sexClass}">${sexLabel}</span>`;

  // Fo.Ca. badge
  const focaBadgeClass = getFocaBadgeClass(capo.livelloFoca);
  const focaLabel = getFocaLabel(capo);

  // Incarichi logic
  const incarichi = (capo.altriIncarichi || []).filter(i => i !== 'Nessuno');
  let incarichiHTML = '';
  if (incarichi.length === 1) {
    incarichiHTML = `<div class="card__incarichi-container"><span class="badge badge--incarico">${incarichi[0]}</span></div>`;
  } else if (incarichi.length > 1) {
    const badges = incarichi.map(i => `<span class="badge badge--incarico">${i}</span>`).join('');
    incarichiHTML = `
      <div class="card__incarichi-container">
        <details class="incarichi-toggle">
          <summary>Incarichi (${incarichi.length})</summary>
          <div class="incarichi-list">${badges}</div>
        </details>
      </div>
    `;
  }

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
    ? `${capo.soprannome} <span class="card__name-sub">(${capo.nome} ${capo.cognome})</span>`
    : `${capo.cognome} ${capo.nome}`;

  card.innerHTML = `
    <div class="card__photo-wrapper">
      ${photoHTML}
      <span class="card__multi-badge">⚡ Multi</span>
      ${removeHTML}
    </div>
    <div class="card__name-row">
      <span class="card__name">${displayNameHTML}</span>
    </div>
    <div class="card__info-row">
      <span class="badge ${focaBadgeClass}">${focaLabel}</span>
      ${sexHTML}
    </div>
    ${incarichiHTML}
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
export function renderDeck(container, capi, filter = '', sortBy = 'name', assignedIds = new Set()) {
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

  const availableCapi = filtered.filter(c => !assignedIds.has(c.id));

  if (availableCapi.length === 0) {
    const allAssigned = capi.length > 0 && capi.every(c => assignedIds.has(c.id));
    container.innerHTML = `
      <div class="deck-drawer__empty">
        ${capi.length === 0
          ? '🃏 Il mazzo è vuoto. Aggiungi dei capi dalla Dashboard!'
          : allAssigned
            ? '✅ Tutti i capi sono stati assegnati!'
            : '🔍 Nessun capo trovato per questa ricerca.'
        }
      </div>
    `;
    return;
  }

  // Render only available (unassigned) capi
  availableCapi.forEach(capo => {
    const card = createCardElement(capo);
    card.addEventListener('click', () => {
      if (window.selectCapo) window.selectCapo(capo.id);
    });
    if (window.getSelectedCapoId && window.getSelectedCapoId() === capo.id) {
      card.classList.add('card--selected');
    }
    container.appendChild(card);
  });
}

/**
 * Render deck preview on dashboard (with edit buttons)
 * @param {HTMLElement} container
 * @param {Array} capi
 * @param {Function} onEdit - callback(capo)
 * @param {string} sortBy - Sort order (name, foca, sex)
 */
export function renderDeckPreview(container, capi, onEdit, sortBy = 'name') {
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
    // Add edit button for dashboard management
    const editBtn = document.createElement('button');
    editBtn.className = 'card__remove-btn'; // Reusing this class for styling
    editBtn.title = 'Modifica capo';
    editBtn.textContent = '✎';
    editBtn.style.position = 'absolute';
    editBtn.style.top = '8px';
    editBtn.style.right = '8px';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onEdit(capo);
    });
    card.style.position = 'relative';
    card.appendChild(editBtn);
    container.appendChild(card);
  });
}
