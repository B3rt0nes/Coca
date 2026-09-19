// ============================================
// CO.CA. — Board Configuration & Rendering
// Unit definitions, role mappings, board layout
// ============================================

import { createCardElement } from './deck.js';

// ══════════════════════════════════════════
// UNIT DEFINITIONS
// ══════════════════════════════════════════

export let UNITS = {};
export let BRANCHES = [];

export const DEFAULT_UNITS = {
  'branco-1': { type: 'branco', name: 'Branco' },
  'cerchio-1': { type: 'cerchio', name: 'Cerchio' },
  'reparto-1': { type: 'reparto', name: 'Reparto' },
  'noviziato': { type: 'noviziato', name: 'Noviziato' },
  'clan-1': { type: 'clan', name: 'Clan' },
  'coca': { type: 'coca', name: 'Co.Ca.' }
};

export function setUnits(dbUnits) {
  if (!dbUnits) {
    dbUnits = DEFAULT_UNITS;
  }

  const newUnits = {};
  const branchMap = {
    'LC': { id: 'LC', name: 'Branca L/C', icon: '🐺', cssClass: 'branch-section--lc', units: [] },
    'EG': { id: 'EG', name: 'Branca E/G', icon: '⚜️', cssClass: 'branch-section--eg', units: [] },
    'RS': { id: 'RS', name: 'Branca R/S', icon: '🔥', cssClass: 'branch-section--rs', units: [] },
    'COCA': { id: 'COCA', name: 'Comunità Capi', icon: '🏛️', cssClass: 'branch-section--coca', units: [] }
  };

  for (const [id, config] of Object.entries(dbUnits)) {
    const template = UNIT_TEMPLATES[config.type];
    if (template) {
      newUnits[id] = {
        name: config.name,
        branch: template.branch,
        icon: template.icon,
        roles: template.roles,
        mainRoles: template.mainRoles
      };
      
      if (branchMap[template.branch]) {
        branchMap[template.branch].units.push(id);
      }
    }
  }

  UNITS = newUnits;
  
  // Rebuild BRANCHES array, only keeping branches that have units
  BRANCHES = [
    branchMap['LC'],
    branchMap['EG'],
    branchMap['RS'],
    branchMap['COCA']
  ].filter(b => b.units.length > 0);
}

export const UNIT_TEMPLATES = {
  'branco': {
    branch: 'LC', icon: '🐺', mainRoles: ['CB'],
    roles: [
      { value: 'CB', label: 'CB - Capo Branco' },
      { value: 'ACB', label: 'ACB - Aiuto Capo Branco' },
      { value: 'AE', label: 'AE - Assistente Ecclesiastico' },
      { value: 'AS', label: 'AS - Animatore Spirituale' }
    ]
  },
  'cerchio': {
    branch: 'LC', icon: '🌸', mainRoles: ['CC'],
    roles: [
      { value: 'CC', label: 'CC - Capo Cerchio' },
      { value: 'ACC', label: 'ACC - Aiuto Capo Cerchio' },
      { value: 'AE', label: 'AE - Assistente Ecclesiastico' },
      { value: 'AS', label: 'AS - Animatore Spirituale' }
    ]
  },
  'reparto': {
    branch: 'EG', icon: '⛺', mainRoles: ['CR'],
    roles: [
      { value: 'CR', label: 'CR - Capo Reparto' },
      { value: 'ACR', label: 'ACR - Aiuto Capo Reparto' },
      { value: 'AE', label: 'AE - Assistente Ecclesiastico' },
      { value: 'AS', label: 'AS - Animatore Spirituale' }
    ]
  },
  'noviziato': {
    branch: 'RS', icon: '🧭', mainRoles: ['MdN'],
    roles: [
      { value: 'MdN', label: 'MdN - Maestro dei Novizi' },
      { value: 'AE', label: 'AE - Assistente Ecclesiastico' },
      { value: 'AS', label: 'AS - Animatore Spirituale' }
    ]
  },
  'clan': {
    branch: 'RS', icon: '🔥', mainRoles: ['CC/CF'],
    roles: [
      { value: 'CC/CF', label: 'CC/CF - Capo Clan/Fuoco' },
      { value: 'ACC/ACF', label: 'ACC/ACF - Aiuto Capo Clan/Fuoco' },
      { value: 'AE', label: 'AE - Assistente Ecclesiastico' },
      { value: 'AS', label: 'AS - Animatore Spirituale' }
    ]
  },
  'coca': {
    branch: 'COCA', icon: '🏛️', mainRoles: ['CG'],
    roles: [
      { value: 'CG', label: 'CG - Capo Gruppo' },
      { value: 'ACG', label: 'ACG - Aiuto Capo Gruppo' },
      { value: 'AA', label: 'AA - A supporto del gruppo' },
      { value: 'AE', label: 'AE - Assistente Ecclesiastico' },
      { value: 'AS', label: 'AS - Animatore Spirituale' }
    ]
  }
};


// ══════════════════════════════════════════
// BOARD RENDERING
// ══════════════════════════════════════════

/**
 * Generate a dynamic year label based on index (e.g. Anno 26/27)
 */
export function getYearLabel(index) {
  const now = new Date();
  let startYear = now.getFullYear();
  if (now.getMonth() < 8) {
    startYear -= 1;
  }
  
  // Il base-year (index = 0) è l'anno in chiusura (quindi startYear - 1)
  startYear = startYear - 1 + index;
  
  const yy1 = startYear.toString().slice(-2);
  const yy2 = (startYear + 1).toString().slice(-2);
  return `Anno ${yy1}/${yy2}`;
}

/**
 * Render the board layout with all branches and drop zones
 * @param {HTMLElement} container - The board grid container
 * @param {Array} years - Array of year objects { label }
 */
export function renderBoard(container, years = [{ label: getYearLabel(0) }]) {
  container.innerHTML = '';

  years.forEach((year, yearIndex) => {
    const section = document.createElement('div');
    section.className = 'year-section';
    
    // Check if there's more than 1 year to show delete button
    // Show delete only for years beyond the first two (base + next year)
    const deleteBtnHTML = years.length > 2 && yearIndex > 1 && window.deleteYear && !window.isBoardReadonly()
      ? `<button class="btn btn--danger btn--small year-header__delete" data-year="${yearIndex}" title="Elimina Anno">🗑️</button>`
      : '';

    const header = document.createElement('div');
    header.className = 'year-header';
    
    // Close base year by default or respect saved state
    const isClosed = year.isClosed !== undefined ? year.isClosed : year.isBaseYear;
    
    header.innerHTML = `
      <div class="year-header__title">
        <span>📅</span>
        <span>${year.label}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        ${deleteBtnHTML}
        <div class="year-header__toggle">${isClosed ? '▶' : '▼'}</div>
      </div>
    `;
    
    const body = document.createElement('div');
    body.className = 'year-body';
    body.style.display = isClosed ? 'none' : 'grid';
    
    header.addEventListener('click', (e) => {
      // Don't toggle if they clicked the delete button
      if (e.target.closest('.year-header__delete')) {
        if (window.deleteYear) window.deleteYear(yearIndex);
        return;
      }
      const isOpen = body.style.display === 'grid';
      body.style.display = isOpen ? 'none' : 'grid';
      header.querySelector('.year-header__toggle').textContent = isOpen ? '▶' : '▼';
      year.isClosed = isOpen;
    });
    
    BRANCHES.forEach((branch, branchIndex) => {
      const branchSec = document.createElement('div');
      branchSec.className = `branch-section ${branch.cssClass}`;
      
      const isBranchClosed = year.branchToggles && year.branchToggles[branchIndex];

      const unitsHTML = branch.units.map(unitId => {
        const unit = UNITS[unitId];
        const isUnitClosed = year.unitToggles && year.unitToggles[unitId];
        const collapsedClass = isUnitClosed ? ' drop-zone--collapsed' : '';
        const toggleIcon = isUnitClosed ? '▶' : '▼';
        
        const readonlyAttr = year.isBaseYear ? ' data-readonly="true"' : '';
        
        return `
          <div class="drop-zone${collapsedClass}" data-unit-id="${unitId}" data-year-index="${yearIndex}"${readonlyAttr}>
            <div class="drop-zone__header" style="cursor: pointer; display: flex; justify-content: space-between;">
              <div>
                <span class="drop-zone__name">${unit.icon} ${unit.name}</span>
                <span class="drop-zone__count" data-count-for="${unitId}" data-year-index="${yearIndex}">0 capi</span>
              </div>
              <div class="unit-toggle">${toggleIcon}</div>
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
          <div class="branch-toggle">${isBranchClosed ? '▶' : '▼'}</div>
        </div>
        <div class="branch-units" style="${isBranchClosed ? 'display: none;' : ''}">${unitsHTML}</div>
      `;

      // Branch Toggle Logic
      const branchHeader = branchSec.querySelector('.branch-header');
      const branchUnits = branchSec.querySelector('.branch-units');
      branchHeader.addEventListener('click', () => {
        const isHidden = branchUnits.style.display === 'none';
        branchUnits.style.display = isHidden ? '' : 'none';
        branchHeader.querySelector('.branch-toggle').textContent = isHidden ? '▼' : '▶';
        
        if (!year.branchToggles) year.branchToggles = {};
        year.branchToggles[branchIndex] = !isHidden;
      });

      // Unit Toggle Logic
      branchSec.querySelectorAll('.drop-zone__header').forEach(unitHeader => {
        unitHeader.addEventListener('click', () => {
          const zone = unitHeader.closest('.drop-zone');
          zone.classList.toggle('drop-zone--collapsed');
          const isCollapsed = zone.classList.contains('drop-zone--collapsed');
          unitHeader.querySelector('.unit-toggle').textContent = isCollapsed ? '▶' : '▼';
          
          const unitId = zone.dataset.unitId;
          if (!year.unitToggles) year.unitToggles = {};
          year.unitToggles[unitId] = isCollapsed;
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

  select.addEventListener('change', () => {
    if (select.value && select.value !== 'Senza ruolo') {
      const card = select.closest('.card');
      if (card) card.classList.remove('card--error');
    }
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
 * @param {number|Array} yearsDataOrCount - Number of years, or array of existing years objects (to preserve labels/flags)
 * @returns {Array} [{ label: 'Anno 1', units: { unitId: [{ capoId, ruolo }] } }]
 */
export function collectAssignments(capi, yearsDataOrCount = 1) {
  const yearsCount = typeof yearsDataOrCount === 'number' ? yearsDataOrCount : yearsDataOrCount.length;
  const oldYears = Array.isArray(yearsDataOrCount) ? yearsDataOrCount : [];
  
  const yearsData = [];

  for (let y = 0; y < yearsCount; y++) {
    const assignments = {};
    const unitToggles = oldYears[y]?.unitToggles || {};
    const branchToggles = oldYears[y]?.branchToggles || {};
    let isClosed = oldYears[y]?.isClosed !== undefined ? oldYears[y].isClosed : (oldYears[y]?.isBaseYear || false);
    
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
      label: oldYears[y]?.label || getYearLabel(y),
      isBaseYear: oldYears[y]?.isBaseYear || false,
      isClosed: isClosed,
      branchToggles: branchToggles,
      unitToggles: unitToggles,
      units: assignments
    });
  }

  return yearsData;
}

/**
 * Initialize the board view, loading base year and adding a second empty year
 */
export async function initBoardView() {
  // Init state for new proposal: fetch base-year if available
  const db = await import('./db.js');
  const baseYearProposal = await db.getBaseYear();

  if (baseYearProposal && baseYearProposal.assegnazioni && baseYearProposal.assegnazioni.length > 0) {
    const baseYear = baseYearProposal.assegnazioni[0]; // Prendi solo il primo anno
    AppState.years = [
      {
        label: 'Anno in corso (Base)',
        units: baseYear.units || {},
        isBaseYear: true
      },
      // New empty year ready for editing
      {
        label: getYearLabel(1),
        units: {},
        isBaseYear: false
      }
    ];
  } else {
    // No base-year yet: create base (closed) and next empty year
    AppState.years = [
      { label: getYearLabel(0), units: {}, isBaseYear: true },
      { label: getYearLabel(1), units: {}, isBaseYear: false }
    ];
  }

  // Render the board
  const boardGrid = document.getElementById('board-grid');
  renderBoard(boardGrid, AppState.years);

  // Load saved assignments from base year if present
  if (baseYearProposal && baseYearProposal.assegnazioni) {
    loadAssignments([AppState.years[0]], AppState.capi, false);
  }

  // Render deck in drawer
  renderDeckInDrawer();

  // Initialize drag & drop
  initDragDrop(AppState.capi, onBoardChange);
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
    yearsData = [{ label: getYearLabel(0), units: assegnazioni }];
  }

  yearsData.forEach((year, y) => {
    for (const [unitId, assignments] of Object.entries(year.units)) {
      const zone = document.getElementById(`zone-${y}-${unitId}`);
      if (!zone) continue;

      zone.innerHTML = '';

      const isYearReadonly = readonly || year.isBaseYear;

      assignments.forEach(assignment => {
        const capo = capiMap[assignment.capoId];
        if (!capo) return;

        const card = createCardElement(capo, {
          showRemove: !isYearReadonly,
          readonly: isYearReadonly
        });

        // Add role select
        const roleSelect = createRoleSelect(unitId, assignment.ruolo, isYearReadonly);
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

// ══════════════════════════════════════════
// DIFF MODE (Turnover visivo)
// ══════════════════════════════════════════

let diffModeActive = false;

export function toggleDiffMode(yearsData) {
  diffModeActive = !diffModeActive;
  const board = document.getElementById('board-grid');
  
  if (!diffModeActive) {
    board.querySelectorAll('.card').forEach(card => {
      card.classList.remove('status-kept', 'status-changed', 'status-new');
    });
    return;
  }

  const baseYear = yearsData.find(y => y.isBaseYear);
  if (!baseYear || !baseYear.units) return;

  board.querySelectorAll('.drop-zone').forEach(zone => {
    const yearIndex = parseInt(zone.dataset.yearIndex, 10);
    if (yearsData[yearIndex] && yearsData[yearIndex].isBaseYear) return;

    const unitId = zone.dataset.unitId;
    
    zone.querySelectorAll('.card').forEach(card => {
      const capoId = card.dataset.capoId;
      if (!capoId) return;
      
      card.classList.remove('status-kept', 'status-changed', 'status-new');

      let foundInBase = false;
      let inSameUnit = false;

      for (const [bUnitId, bAssignments] of Object.entries(baseYear.units)) {
        if (bAssignments.find(a => a.capoId === capoId)) {
          foundInBase = true;
          if (bUnitId === unitId) {
            inSameUnit = true;
          }
          break;
        }
      }

      if (!foundInBase) {
        card.classList.add('status-new'); 
      } else if (inSameUnit) {
        card.classList.add('status-kept'); 
      } else {
        card.classList.add('status-changed'); 
      }
    });
  });
}
