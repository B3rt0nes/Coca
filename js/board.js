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
      { value: 'CB', label: 'CB - Capo Branco' },
      { value: 'ACB', label: 'ACB - Aiuto Capo Branco' },
      { value: 'AE', label: 'AE - Assistente Ecclesiastico' },
      { value: 'AS', label: 'AS - Animatore Spirituale' }
    ],
    mainRoles: ['CB']
  },
  'cerchio-s-chiara': {
    name: 'Cerchio S. Chiara',
    branch: 'LC',
    icon: '🌸',
    roles: [
      { value: 'CC', label: 'CC - Capo Cerchio' },
      { value: 'ACC', label: 'ACC - Aiuto Capo Cerchio' },
      { value: 'AE', label: 'AE - Assistente Ecclesiastico' },
      { value: 'AS', label: 'AS - Animatore Spirituale' }
    ],
    mainRoles: ['CC']
  },
  'reparto-apollo': {
    name: 'Reparto Apollo',
    branch: 'EG',
    icon: '☀️',
    roles: [
      { value: 'CR', label: 'CR - Capo Reparto' },
      { value: 'ACR', label: 'ACR - Aiuto Capo Reparto' },
      { value: 'AE', label: 'AE - Assistente Ecclesiastico' },
      { value: 'AS', label: 'AS - Animatore Spirituale' }
    ],
    mainRoles: ['CR']
  },
  'reparto-artemide': {
    name: 'Reparto Artemide',
    branch: 'EG',
    icon: '🌙',
    roles: [
      { value: 'CR', label: 'CR - Capo Reparto' },
      { value: 'ACR', label: 'ACR - Aiuto Capo Reparto' },
      { value: 'AE', label: 'AE - Assistente Ecclesiastico' },
      { value: 'AS', label: 'AS - Animatore Spirituale' }
    ],
    mainRoles: ['CR']
  },
  'noviziato': {
    name: 'Noviziato',
    branch: 'RS',
    icon: '🧭',
    roles: [
      { value: 'MdN', label: 'MdN - Maestro dei Novizi' },
      { value: 'AE', label: 'AE - Assistente Ecclesiastico' },
      { value: 'AS', label: 'AS - Animatore Spirituale' }
    ],
    mainRoles: ['MdN']
  },
  'clan-boanerghes': {
    name: 'Clan Boanerghes',
    branch: 'RS',
    icon: '🔥',
    roles: [
      { value: 'CC/CF', label: 'CC/CF - Capo Clan/Fuoco' },
      { value: 'ACC/ACF', label: 'ACC/ACF - Aiuto Capo Clan/Fuoco' },
      { value: 'AE', label: 'AE - Assistente Ecclesiastico' },
      { value: 'AS', label: 'AS - Animatore Spirituale' }
    ],
    mainRoles: ['CC/CF']
  },
  'coca': {
    name: 'Co.Ca.',
    branch: 'COCA',
    icon: '🏛️',
    roles: [
      { value: 'CG', label: 'CG - Capo Gruppo' },
      { value: 'ACG', label: 'ACG - Aiuto Capo Gruppo' },
      { value: 'AA', label: 'AA - A supporto del gruppo' },
      { value: 'AE', label: 'AE - Assistente Ecclesiastico' },
      { value: 'AS', label: 'AS - Animatore Spirituale' }
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
 * @param {Array} years - Array of year objects { label }
 */
export function renderBoard(container, years = [{ label: 'Anno 1' }]) {
  container.innerHTML = '';

  years.forEach((year, yearIndex) => {
    const section = document.createElement('div');
    section.className = 'year-section';
    
    // Check if there's more than 1 year to show delete button
    const deleteBtnHTML = years.length > 1 && window.deleteYear && !window.isBoardReadonly()
      ? `<button class="btn btn--danger btn--small year-header__delete" data-year="${yearIndex}" title="Elimina Anno">🗑️</button>` 
      : '';

    const header = document.createElement('div');
    header.className = 'year-header';
    header.innerHTML = `
      <div class="year-header__title">
        <span>📅</span>
        <span>${year.label}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        ${deleteBtnHTML}
        <div class="year-header__toggle">▼</div>
      </div>
    `;
    
    const body = document.createElement('div');
    body.className = 'year-body';
    body.style.display = 'grid'; // Default open
    
    header.addEventListener('click', (e) => {
      // Don't toggle if they clicked the delete button
      if (e.target.closest('.year-header__delete')) {
        if (window.deleteYear) window.deleteYear(yearIndex);
        return;
      }
      const isOpen = body.style.display === 'grid';
      body.style.display = isOpen ? 'none' : 'grid';
      header.querySelector('.year-header__toggle').textContent = isOpen ? '▶' : '▼';
    });
    
    BRANCHES.forEach(branch => {
      const branchSec = document.createElement('div');
      branchSec.className = `branch-section ${branch.cssClass}`;

      const unitsHTML = branch.units.map(unitId => {
        const unit = UNITS[unitId];
        return `
          <div class="drop-zone" data-unit-id="${unitId}" data-year-index="${yearIndex}">
            <div class="drop-zone__header" style="cursor: pointer; display: flex; justify-content: space-between;">
              <div>
                <span class="drop-zone__name">${unit.icon} ${unit.name}</span>
                <span class="drop-zone__count" data-count-for="${unitId}" data-year-index="${yearIndex}">0 capi</span>
              </div>
              <div class="unit-toggle">▼</div>
            </div>
            <div class="drop-zone__cards drop-zone-list" id="zone-${yearIndex}-${unitId}" data-unit-id="${unitId}" data-year-index="${yearIndex}"></div>
          </div>
        `;
      }).join('');

      branchSec.innerHTML = `
        <div class="branch-header" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span class="branch-header__icon">${branch.icon}</span>
            ${branch.name}
          </div>
          <div class="branch-toggle">▼</div>
        </div>
        <div class="branch-units">${unitsHTML}</div>
      `;

      // Branch Toggle Logic
      const branchHeader = branchSec.querySelector('.branch-header');
      const branchUnits = branchSec.querySelector('.branch-units');
      branchHeader.addEventListener('click', () => {
        const isHidden = branchUnits.style.display === 'none';
        branchUnits.style.display = isHidden ? '' : 'none';
        branchHeader.querySelector('.branch-toggle').textContent = isHidden ? '▼' : '▶';
      });

      // Unit Toggle Logic
      branchSec.querySelectorAll('.drop-zone__header').forEach(unitHeader => {
        unitHeader.addEventListener('click', () => {
          const unitCards = unitHeader.nextElementSibling; // .drop-zone__cards
          const isHidden = unitCards.style.display === 'none';
          unitCards.style.display = isHidden ? 'grid' : 'none';
          unitHeader.querySelector('.unit-toggle').textContent = isHidden ? '▼' : '▶';
        });
      });

      body.appendChild(branchSec);

      // Add tap-to-place logic for drop zones
      branch.units.forEach(unitId => {
        const zone = branchSec.querySelector(`.drop-zone[data-unit-id="${unitId}"][data-year-index="${yearIndex}"]`);
        if (zone) {
          const zoneCards = zone.querySelector('.drop-zone__cards');
          zoneCards.addEventListener('click', (e) => {
            if (e.target.closest('.card')) return;
            if (window.assignSelectedCapo) window.assignSelectedCapo(unitId, yearIndex);
          });
          // Also allow clicking empty space on header if not clicking the toggle
          const zoneHeader = zone.querySelector('.drop-zone__header');
          zoneHeader.addEventListener('click', (e) => {
            // If they clicked to toggle, we don't assign
             // but if they just tapped the header empty space to assign? 
             // Actually, the user asked to make branches/units collapsible. We should just collapse on header click.
             // We'll leave tap-to-place to the empty space of `.drop-zone__cards`.
          });
        }
      });
    });

    section.appendChild(header);
    section.appendChild(body);
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
 * @param {number} yearIndex
 */
export function updateUnitCount(unitId, yearIndex) {
  const zone = document.getElementById(`zone-${yearIndex}-${unitId}`);
  const countEl = document.querySelector(`[data-count-for="${unitId}"][data-year-index="${yearIndex}"]`);
  if (zone && countEl) {
    // Only count actual cards, ignoring SortableJS drag elements
    const count = zone.querySelectorAll('.card:not(.sortable-ghost):not(.sortable-drag)').length;
    countEl.textContent = `${count} cap${count === 1 ? 'o' : 'i'}`;
  }
}

/**
 * Collect all assignments from the board
 * @param {Array} capi - Full capi list for reference
 * @param {number} yearsCount - How many years are on the board
 * @returns {Array} [{ label: 'Anno 1', units: { unitId: [{ capoId, ruolo }] } }]
 */
export function collectAssignments(capi, yearsCount = 1) {
  const yearsData = [];

  for (let y = 0; y < yearsCount; y++) {
    const assignments = {};
    for (const unitId of Object.keys(UNITS)) {
      const zone = document.getElementById(`zone-${y}-${unitId}`);
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
    yearsData.push({
      label: `Anno ${y + 1}`,
      units: assignments
    });
  }

  return yearsData;
}

/**
 * Load assignments into the board (for viewing saved proposals)
 * @param {Array|Object} assegnazioni - New array format or old object format
 * @param {Array} capi - Full capi list
 * @param {boolean} readonly - If true, cards are not draggable
 */
export function loadAssignments(assegnazioni, capi, readonly = false) {
  const capiMap = {};
  capi.forEach(c => { capiMap[c.id] = c; });

  // Handle retro-compatibility
  let yearsData = [];
  if (Array.isArray(assegnazioni)) {
    yearsData = assegnazioni;
  } else {
    // Old flat format
    yearsData = [{ label: 'Anno 1', units: assegnazioni }];
  }

  yearsData.forEach((year, y) => {
    for (const [unitId, assignments] of Object.entries(year.units)) {
      const zone = document.getElementById(`zone-${y}-${unitId}`);
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

      updateUnitCount(unitId, y);
    }
  });

  if (!readonly) {
    updateMultiIncarico(yearsData.length);
  } else {
    updateMultiIncaricoReadonly(yearsData);
  }
}

/**
 * Update multi-incarico visual indicators per year
 */
export function updateMultiIncarico(yearsCount = 1) {
  // We check multi-incarico independently for each year
  for (let y = 0; y < yearsCount; y++) {
    const capoCount = {};

    for (const unitId of Object.keys(UNITS)) {
      const zone = document.getElementById(`zone-${y}-${unitId}`);
      if (!zone) continue;

      zone.querySelectorAll('.card').forEach(card => {
        const capoId = card.dataset.capoId;
        if (!capoCount[capoId]) capoCount[capoId] = [];
        capoCount[capoId].push(card);
      });
    }

    // Apply/remove multi class within this year
    for (const [capoId, cards] of Object.entries(capoCount)) {
      const isMulti = cards.length > 1;
      cards.forEach(card => {
        card.classList.toggle('card--multi', isMulti);
      });
    }
  }

  // Also highlight cards in the deck that are assigned SOMEWHERE 
  // (We'll just mark them multi if they are assigned multiple times across ANY year for simplicity, 
  // or we can skip deck multi highlighting since it's complex with years. Let's just do global count for deck).
  const globalCapoCount = {};
  document.querySelectorAll('.board-grid .card').forEach(card => {
    const capoId = card.dataset.capoId;
    if (!globalCapoCount[capoId]) globalCapoCount[capoId] = 0;
    globalCapoCount[capoId]++;
  });

  const deckCards = document.querySelectorAll('.deck-drawer__cards .card');
  deckCards.forEach(card => {
    const capoId = card.dataset.capoId;
    const count = globalCapoCount[capoId] || 0;
    card.classList.toggle('card--multi', count > 1);
  });
}

/**
 * Update multi-incarico for readonly mode
 */
function updateMultiIncaricoReadonly(yearsData) {
  yearsData.forEach((year, y) => {
    const capoCount = {};

    for (const [unitId, assignments] of Object.entries(year.units)) {
      assignments.forEach(a => {
        if (!capoCount[a.capoId]) capoCount[a.capoId] = 0;
        capoCount[a.capoId]++;
      });
    }

    for (const unitId of Object.keys(UNITS)) {
      const zone = document.getElementById(`zone-${y}-${unitId}`);
      if (!zone) continue;

      zone.querySelectorAll('.card').forEach(card => {
        const capoId = card.dataset.capoId;
        card.classList.toggle('card--multi', (capoCount[capoId] || 0) > 1);
      });
    }
  });
}
