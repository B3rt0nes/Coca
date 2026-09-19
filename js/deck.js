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
  const tizzoneSVG = `<svg class="badge-icon badge-tizzone" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
  </svg>`;
  
  const nodoSVG = `<svg class="badge-icon badge-nodo" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3v5.1L5.91 5.92A4.978 4.978 0 0 0 2.5 12c0 2.76 2.24 5 5 5h8v2h-8c-3.87 0-7-3.13-7-7 0-2.43 1.25-4.56 3.14-5.83l7.33 7.33C10.74 18.23 11 19.58 11 21h2c0-1.07-.36-2.06-.96-2.85l2.42-2.42C14.93 15.9 15.45 16 16 16c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
  </svg>`;

  if (capo.livelloFoca === 'CFA' || capo.livelloFoca === 'WB') {
    return `${tizzoneSVG} ${capo.livelloFoca}`;
  }
  if (capo.livelloFoca === 'Tirocinio') {
    return `${nodoSVG} Tirocinio`;
  }
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
    ? `${capo.soprannome}`
    : capo.hasDuplicateName
      ? `${capo.nome} ${capo.cognome}`
      : `${capo.nome}`;

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
  const assignedCapi = filtered.filter(c => assignedIds.has(c.id));

  if (availableCapi.length === 0 && assignedCapi.length === 0) {
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

  // Render available (unassigned) capi
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

  // Render assigned (già in servizio) capi
  if (assignedCapi.length > 0) {
    const divider = document.createElement('div');
    divider.className = 'deck-drawer__divider';
    divider.innerHTML = '<span>Già in servizio</span>';
    divider.style.width = '100%';
    divider.style.textAlign = 'center';
    divider.style.margin = '16px 0 8px 0';
    divider.style.fontWeight = 'bold';
    divider.style.color = 'var(--text-secondary)';
    divider.style.fontSize = '0.9rem';
    divider.style.gridColumn = '1 / -1';
    container.appendChild(divider);

    assignedCapi.forEach(capo => {
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
