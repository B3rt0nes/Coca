// ============================================
// CO.CA. — Board Configuration & Rendering
// Unit definitions, role mappings, board layout
// ============================================

import { createCardElement } from './deck.js';

// ══════════════════════════════════════════
// UNIT DEFINITIONS
// ══════════════════════════════════════════

export const UNITS = {
  'branco-s-francesco': {
    name: 'Branco S. Francesco',
    branch: 'LC',
    icon: '🐺',
    roles: [
      { value: 'CB', label: 'Capo Branco (CB)' },
      { value: 'ACB', label: 'Aiuto Capo Branco (ACB)' },
      { value: 'AE', label: 'Assistente Ecclesiastico (AE)' },
      { value: 'AS', label: 'Animatore Spirituale (AS)' }
    ],
    mainRoles: ['CB']
  },
  'cerchio-s-chiara': {
    name: 'Cerchio S. Chiara',
    branch: 'LC',
    icon: '🌸',
    roles: [
      { value: 'CC', label: 'Capo Cerchio (CC)' },
      { value: 'ACC', label: 'Aiuto Capo Cerchio (ACC)' },
      { value: 'AE', label: 'Assistente Ecclesiastico (AE)' },
      { value: 'AS', label: 'Animatore Spirituale (AS)' }
    ],
    mainRoles: ['CC']
  },
  'reparto-apollo': {
    name: 'Reparto Apollo',
    branch: 'EG',
    icon: '☀️',
    roles: [
      { value: 'CR', label: 'Capo Reparto (CR)' },
      { value: 'ACR', label: 'Aiuto Capo Reparto (ACR)' },
      { value: 'AE', label: 'Assistente Ecclesiastico (AE)' },
      { value: 'AS', label: 'Animatore Spirituale (AS)' }
    ],
    mainRoles: ['CR']
  },
  'reparto-artemide': {
    name: 'Reparto Artemide',
    branch: 'EG',
    icon: '🌙',
    roles: [
      { value: 'CR', label: 'Capo Reparto (CR)' },
      { value: 'ACR', label: 'Aiuto Capo Reparto (ACR)' },
      { value: 'AE', label: 'Assistente Ecclesiastico (AE)' },
      { value: 'AS', label: 'Animatore Spirituale (AS)' }
    ],
    mainRoles: ['CR']
  },
  'noviziato': {
    name: 'Noviziato',
    branch: 'RS',
    icon: '🧭',
    roles: [
      { value: 'MdN', label: 'Maestro dei Novizi (MdN)' },
      { value: 'AE', label: 'Assistente Ecclesiastico (AE)' },
      { value: 'AS', label: 'Animatore Spirituale (AS)' }
    ],
    mainRoles: ['MdN']
  },
  'clan-boanerghes': {
    name: 'Clan Boanerghes',
    branch: 'RS',
    icon: '🔥',
    roles: [
      { value: 'CC/CF', label: 'Capo Clan/Fuoco (CC/CF)' },
      { value: 'ACC/ACF', label: 'Aiuto Capo Clan/Fuoco (ACC/ACF)' },
      { value: 'AE', label: 'Assistente Ecclesiastico (AE)' },
      { value: 'AS', label: 'Animatore Spirituale (AS)' }
    ],
    mainRoles: ['CC/CF']
  },
  'coca': {
    name: 'Co.Ca.',
    branch: 'COCA',
    icon: '🏛️',
    roles: [
      { value: 'CG', label: 'Capo Gruppo (CG)' },
      { value: 'ACG', label: 'Aiuto Capo Gruppo (ACG)' },
      { value: 'CD', label: 'Capo a disposizione' },
      { value: 'AA', label: 'A supporto del gruppo (AA)' },
      { value: 'AE', label: 'Assistente Ecclesiastico (AE)' },
      { value: 'AS', label: 'Animatore Spirituale (AS)' }
    ],
    mainRoles: [] // No main role validation for CoCa
  }
};

// Branch groupings for display
export const BRANCHES = [
  {
    id: 'LC',
    name: 'Branca L/C',
    icon: '🐺',
    cssClass: 'branch-section--lc',
    units: ['branco-s-francesco', 'cerchio-s-chiara']
  },
  {
    id: 'EG',
    name: 'Branca E/G',
    icon: '⚜️',
    cssClass: 'branch-section--eg',
    units: ['reparto-apollo', 'reparto-artemide']
  },
  {
    id: 'RS',
    name: 'Branca R/S',
    icon: '🔥',
    cssClass: 'branch-section--rs',
    units: ['noviziato', 'clan-boanerghes']
  },
  {
    id: 'COCA',
    name: 'Co.Ca.',
    icon: '🏛️',
    cssClass: 'branch-section--coca',
    units: ['coca']
  }
];


// ══════════════════════════════════════════
// BOARD RENDERING
// ══════════════════════════════════════════

/**
 * Render the board layout with all branches and drop zones
 * @param {HTMLElement} container - The board grid container
 */
export function renderBoard(container) {
  container.innerHTML = '';

  BRANCHES.forEach(branch => {
    const section = document.createElement('div');
    section.className = `branch-section ${branch.cssClass}`;

    const unitsHTML = branch.units.map(unitId => {
      const unit = UNITS[unitId];
      return `
        <div class="drop-zone" data-unit-id="${unitId}">
          <div class="drop-zone__header">
            <span class="drop-zone__name">${unit.icon} ${unit.name}</span>
            <span class="drop-zone__count" data-count-for="${unitId}">0 capi</span>
          </div>
          <div class="drop-zone__cards" id="zone-${unitId}" data-unit-id="${unitId}"></div>
        </div>
      `;
    }).join('');

    section.innerHTML = `
      <div class="branch-header">
        <span class="branch-header__icon">${branch.icon}</span>
        ${branch.name}
      </div>
      <div class="branch-units">${unitsHTML}</div>
    `;

    container.appendChild(section);
  });
}

/**
 * Create the role select dropdown for a card in a specific unit
 * @param {string} unitId - The unit identifier
 * @param {string} currentRole - Currently selected role (if any)
 * @param {boolean} readonly - If true, dropdown is disabled
 * @returns {HTMLElement}
 */
export function createRoleSelect(unitId, currentRole = '', readonly = false) {
  const unit = UNITS[unitId];
  if (!unit) return document.createElement('div');

  const wrapper = document.createElement('div');
  wrapper.className = 'card__role-select';

  const label = document.createElement('label');
  label.textContent = 'Ruolo';

  const select = document.createElement('select');
  select.className = 'card__role-dropdown';
  select.dataset.unitId = unitId;

  if (readonly) {
    select.disabled = true;
    select.style.opacity = '0.8';
  }

  // Default option
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = 'Seleziona ruolo...';
  select.appendChild(defaultOpt);

  // Add role options
  unit.roles.forEach(role => {
    const opt = document.createElement('option');
    opt.value = role.value;
    opt.textContent = role.label;
    if (role.value === currentRole) opt.selected = true;
    select.appendChild(opt);
  });

  wrapper.appendChild(label);
  wrapper.appendChild(select);

  return wrapper;
}

/**
 * Update the card count display for a specific unit
 * @param {string} unitId
 */
export function updateUnitCount(unitId) {
  const zone = document.getElementById(`zone-${unitId}`);
  const countEl = document.querySelector(`[data-count-for="${unitId}"]`);
  if (zone && countEl) {
    const count = zone.children.length;
    countEl.textContent = `${count} cap${count === 1 ? 'o' : 'i'}`;
  }
}

/**
 * Collect all assignments from the board
 * @param {Array} capi - Full capi list for reference
 * @returns {Object} { unitId: [{ capoId, ruolo }], ... }
 */
export function collectAssignments(capi) {
  const assignments = {};

  for (const unitId of Object.keys(UNITS)) {
    const zone = document.getElementById(`zone-${unitId}`);
    if (!zone) {
      assignments[unitId] = [];
      continue;
    }

    const cards = zone.querySelectorAll('.card');
    assignments[unitId] = Array.from(cards).map(card => {
      const capoId = card.dataset.capoId;
      const roleSelect = card.querySelector('.card__role-dropdown');
      const ruolo = roleSelect ? roleSelect.value : '';
      return { capoId, ruolo };
    });
  }

  return assignments;
}

/**
 * Load assignments into the board (for viewing saved proposals)
 * @param {Object} assegnazioni - { unitId: [{ capoId, ruolo }] }
 * @param {Array} capi - Full capi list
 * @param {boolean} readonly - If true, cards are not draggable
 */
export function loadAssignments(assegnazioni, capi, readonly = false) {
  const capiMap = {};
  capi.forEach(c => { capiMap[c.id] = c; });

  for (const [unitId, assignments] of Object.entries(assegnazioni)) {
    const zone = document.getElementById(`zone-${unitId}`);
    if (!zone) continue;

    zone.innerHTML = '';

    assignments.forEach(assignment => {
      const capo = capiMap[assignment.capoId];
      if (!capo) return;

      const card = createCardElement(capo, {
        showRemove: !readonly,
        readonly
      });

      // Add role select
      const roleSelect = createRoleSelect(unitId, assignment.ruolo, readonly);
      card.appendChild(roleSelect);

      zone.appendChild(card);
    });

    updateUnitCount(unitId);
  }

  // Update multi-incarico highlights
  if (!readonly) {
    updateMultiIncarico();
  } else {
    // Still show multi highlights in readonly
    updateMultiIncaricoReadonly(assegnazioni);
  }
}

/**
 * Update multi-incarico visual indicators
 * Scans all zones for cards with the same capoId in multiple units
 */
export function updateMultiIncarico() {
  // Count assignments per capo
  const capoCount = {};

  for (const unitId of Object.keys(UNITS)) {
    const zone = document.getElementById(`zone-${unitId}`);
    if (!zone) continue;

    zone.querySelectorAll('.card').forEach(card => {
      const capoId = card.dataset.capoId;
      if (!capoCount[capoId]) capoCount[capoId] = [];
      capoCount[capoId].push(card);
    });
  }

  // Apply/remove multi class
  for (const [capoId, cards] of Object.entries(capoCount)) {
    const isMulti = cards.length > 1;
    cards.forEach(card => {
      card.classList.toggle('card--multi', isMulti);
    });
  }

  // Also highlight cards in the deck that are assigned somewhere
  const deckCards = document.querySelectorAll('.deck-drawer__cards .card');
  deckCards.forEach(card => {
    const capoId = card.dataset.capoId;
    const count = capoCount[capoId] ? capoCount[capoId].length : 0;
    card.classList.toggle('card--multi', count > 1);
  });
}

/**
 * Update multi-incarico for readonly mode (from saved data)
 */
function updateMultiIncaricoReadonly(assegnazioni) {
  const capoCount = {};

  for (const [unitId, assignments] of Object.entries(assegnazioni)) {
    assignments.forEach(a => {
      if (!capoCount[a.capoId]) capoCount[a.capoId] = 0;
      capoCount[a.capoId]++;
    });
  }

  // Apply multi class to cards with count > 1
  for (const unitId of Object.keys(UNITS)) {
    const zone = document.getElementById(`zone-${unitId}`);
    if (!zone) continue;

    zone.querySelectorAll('.card').forEach(card => {
      const capoId = card.dataset.capoId;
      card.classList.toggle('card--multi', (capoCount[capoId] || 0) > 1);
    });
  }
}
