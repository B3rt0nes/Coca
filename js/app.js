// ============================================
// CO.CA. — Main Application
// SPA Router, State Management, Event Handling
// ============================================

import { getUsername, setUsername, logout, isLoggedIn } from './auth.js';
import { addCapo, updateCapo, getCapi, deleteCapo, onCapiChange, saveProposal, getProposals, getProposal, deleteProposal, onProposalsChange } from './db.js';
import { renderDeck, renderDeckPreview, createCardElement } from './deck.js';
import { renderBoard, collectAssignments, loadAssignments, updateMultiIncarico, UNITS, createRoleSelect, getYearLabel } from './board.js';
import { initDragDrop, destroyDragDrop, reattachRoleListeners } from './dragdrop.js';
import { validateProposal } from './validation.js';
import { showToast, showModal, hideModal, showConfirm, showWarningConfirm, showAddCapoModal, setLoading } from './ui.js';

// ══════════════════════════════════════════
// APPLICATION STATE
// ══════════════════════════════════════════

const AppState = {
  capi: [],
  proposals: [],
  currentView: 'login',
  currentProposalId: null,
  isReadonly: false,
  selectedCapoId: null,
  unsubscribeProposals: null,
  deckFilter: '',
  drawerCollapsed: true,
  years: [{ label: getYearLabel(0), units: {} }]
};


// ══════════════════════════════════════════
// SPA ROUTER
// ══════════════════════════════════════════

function navigate(hash) {
  window.location.hash = hash;
}

function handleRoute() {
  const hash = window.location.hash || '#login';
  const parts = hash.split('/');
  const route = parts[0];
  const param = parts[1];

  // Hide all views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

  // Clean up previous view
  destroyDragDrop();

  if (!isLoggedIn() && route !== '#login') {
    navigate('#login');
    return;
  }

  switch (route) {
    case '#login':
      showView('login-view');
      break;

    case '#dashboard':
      if (!isLoggedIn()) {
        navigate('#login');
        return;
      }
      
      // Clear any dummy capi from memory when returning to dashboard
      AppState.capi = AppState.capi.filter(c => !c.isDummy);

      showView('dashboard-view');
      updateDashboardHeader();
      loadDashboard();
      break;

    case '#proposta':
      if (!isLoggedIn()) {
        navigate('#login');
        return;
      }
      if (param === 'new') {
        AppState.isReadonly = false;
        AppState.currentProposalId = null;
        showView('board-view');
        initBoardView();
      } else if (param) {
        // View existing proposal
        showView('board-view');
        loadProposalView(param);
      }
      break;

    case '#consensus':
      if (!isLoggedIn()) {
        navigate('#login');
        return;
      }
      showView('consensus-view');
      import('./consensus.js').then(module => {
        module.loadConsensusView(document.getElementById('consensus-grid'), AppState.capi);
      });
      break;

    default:
      navigate(isLoggedIn() ? '#dashboard' : '#login');
  }
}

function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const view = document.getElementById(viewId);
  if (view) {
    view.classList.add('active');
  }
}


// ══════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════

function setupLogin() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('login-username');
    const username = input.value.trim();

    if (!username) {
      showToast('Inserisci un nome utente', 'error');
      return;
    }

    if (username.length < 2) {
      showToast('Il nome utente deve avere almeno 2 caratteri', 'error');
      return;
    }

    setUsername(username);
    showToast(`Benvenuto, ${username}! 🎉`, 'success');
    navigate('#dashboard');
  });
}


// ══════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════

function updateDashboardHeader() {
  const usernameEl = document.getElementById('header-username');
  if (usernameEl) {
    usernameEl.textContent = getUsername();
  }
}

async function loadDashboard() {
  // Subscribe to real-time capi updates
  if (AppState.unsubscribeCapi) AppState.unsubscribeCapi();
  AppState.unsubscribeCapi = onCapiChange((capi) => {
    AppState.capi = capi;
    renderDashboardDeck();
  });

  // Subscribe to real-time proposal updates
  if (AppState.unsubscribeProposals) AppState.unsubscribeProposals();
  AppState.unsubscribeProposals = onProposalsChange((proposals) => {
    AppState.proposals = proposals;
    renderDashboardProposals();
  });
}

function renderDashboardDeck() {
  const container = document.getElementById('dashboard-deck');
  if (!container) return;

  // Filter out dummy capi for the dashboard
  const realCapi = AppState.capi.filter(c => !c.isDummy);

  const countEl = document.getElementById('deck-count');
  if (countEl) {
    countEl.textContent = `(${realCapi.length})`;
  }

  const sortVal = document.getElementById('dashboard-deck-sort')?.value || 'name';

  renderDeckPreview(container, realCapi, (capo) => {
    showAddCapoModal(async (updatedData) => {
      try {
        await updateCapo(capo.id, updatedData);
        showToast(`${updatedData.nome} ${updatedData.cognome} aggiornato! ✏️`, 'success');
      } catch (err) {
        showToast('Errore nell\'aggiornamento del capo', 'error');
        console.error(err);
      }
    }, capo);
  }, sortVal);
}

function renderDashboardProposals() {
  const container = document.getElementById('proposals-list');
  if (!container) return;

  if (AppState.proposals.length === 0) {
    container.innerHTML = `
      <div class="proposal-list__empty">
        <div class="proposal-list__empty-icon">📋</div>
        <p>Nessuna proposta salvata.<br>Crea la prima proposta!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = AppState.proposals.map(p => {
    const date = p.createdAt
      ? new Date(p.createdAt.seconds * 1000).toLocaleDateString('it-IT', {
          day: '2-digit', month: 'short', year: 'numeric'
        })
      : '...';

    const isOwn = p.autore === getUsername();

    return `
      <div class="proposal-item" data-proposal-id="${p.id}" data-readonly="${!isOwn}">
        <div class="proposal-item__info">
          <div class="proposal-item__title">${p.titolo || 'Proposta senza titolo'}</div>
          <div class="proposal-item__meta">
            <span class="proposal-item__author">${p.autore}</span>
            <span>•</span>
            <span>${date}</span>
            ${isOwn ? '<span>• ✏️ Tua</span>' : '<span>• 👁️ Sola lettura</span>'}
          </div>
        </div>
        <span class="proposal-item__arrow">→</span>
      </div>
    `;
  }).join('');
}

function setupDashboardEvents() {
  // Add capo button
  document.getElementById('btn-add-capo')?.addEventListener('click', () => {
    showAddCapoModal(async (data) => {
      try {
        await addCapo(data);
        showToast(`${data.nome} ${data.cognome} aggiunto al mazzo! 🃏`, 'success');
      } catch (err) {
        showToast('Errore nel salvataggio del capo', 'error');
        console.error(err);
      }
    });
  });

  // Sort dropdown
  document.getElementById('dashboard-deck-sort')?.addEventListener('change', () => {
    renderDashboardDeck();
  });

  // Create proposal button
  document.getElementById('btn-new-proposal')?.addEventListener('click', () => {
    if (AppState.capi.length === 0) {
      showToast('Aggiungi almeno un capo al mazzo prima di creare una proposta', 'warning');
      return;
    }
    navigate('#proposta/new');
  });

  // Edit base year button
  document.getElementById('btn-edit-base-year')?.addEventListener('click', () => {
    if (AppState.capi.length === 0) {
      showToast('Aggiungi almeno un capo al mazzo prima di creare una proposta', 'warning');
      return;
    }
    navigate('#proposta/base-year');
  });

  // Consensus view button
  document.getElementById('btn-consensus-view')?.addEventListener('click', () => {
    navigate('#consensus');
  });

  // Logout button
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    logout();
    showToast('Arrivederci! 👋', 'info');
    navigate('#login');
  });

  // Proposal item clicks (event delegation)
  document.getElementById('proposals-list')?.addEventListener('click', (e) => {
    const item = e.target.closest('.proposal-item');
    if (!item) return;
    const proposalId = item.dataset.proposalId;
    navigate(`#proposta/${proposalId}`);
  });
}


// ══════════════════════════════════════════
// BOARD VIEW (Create/Edit Proposal)
// ══════════════════════════════════════════

function ensureBaseYear(baseYearProposal) {
  // Se l'anno base è già presente, non facciamo nulla
  if (AppState.years.some(y => y.isBaseYear)) return;

  if (baseYearProposal && baseYearProposal.assegnazioni && baseYearProposal.assegnazioni.length > 0) {
    const baseYear = baseYearProposal.assegnazioni[0];
    AppState.years = [{
      label: getYearLabel(0),
      units: baseYear.units || {},
      isBaseYear: true
    }];
  } else {
    AppState.years = [{ label: getYearLabel(0), units: {}, isBaseYear: true }];
  }
}

async function initBoardView() {
  const boardView = document.getElementById('board-view');
  boardView.classList.remove('board-view--readonly');

  setLoading(true);
  try {
    // Ensure we have capi data
    if (AppState.capi.length === 0) {
      const db = await import('./db.js');
      AppState.capi = await db.getCapi();
    }

    // Set title input
    const titleInput = document.getElementById('board-title');
    if (titleInput) {
      titleInput.value = '';
      titleInput.disabled = false;
    }

    // Show save/deck controls
    document.getElementById('btn-save-proposal')?.classList.remove('hidden');
    document.getElementById('deck-drawer')?.classList.remove('hidden');

    document.getElementById('drawer-search')?.addEventListener('input', (e) => {
      AppState.deckFilter = e.target.value;
      renderDeckInDrawer();
      initDragDrop(AppState.capi, onBoardChange);
    });

    // Init state for new proposal: fetch base-year if available
    const db = await import('./db.js');
    const baseYearProposal = await db.getBaseYear();

    ensureBaseYear(baseYearProposal);

    // Se non esiste ancora alcun altro anno, creiamo il secondo anno vuoto (es. Anno 1)
    if (AppState.years.length === 1) {
      AppState.years.push({ label: getYearLabel(1), units: {} });
    }

    // Render the board
    const boardGrid = document.getElementById('board-grid');
    renderBoard(boardGrid, AppState.years);

    // Load saved assignments from base year
    if (baseYearProposal && baseYearProposal.assegnazioni) {
      loadAssignments([AppState.years[0]], AppState.capi, false);
    }

    // Render deck in drawer
    renderDeckInDrawer();

    // Initialize drag & drop
    initDragDrop(AppState.capi, onBoardChange);

  } catch(e) {
    console.error(e);
    showToast('Errore durante il caricamento.', 'error');
  } finally {
    setLoading(false);
  }
}

async function loadProposalView(proposalId) {
  setLoading(true);

  try {
    // Ensure we have capi data
    if (AppState.capi.length === 0) {
      const db = await import('./db.js');
      AppState.capi = await db.getCapi();
    }

    const db = await import('./db.js');
    let proposal = null;

    if (proposalId === 'base-year') {
      proposal = await db.getBaseYear();
      if (!proposal) {
        proposal = {
          id: 'base-year',
          titolo: 'Organico Attuale (Anno di Base)',
          autore: getUsername(),
          assegnazioni: [{ label: 'Anno in corso (Base)', isBaseYear: true, units: {} }]
        };
      }
    } else {
      proposal = await db.getProposal(proposalId);
    }

    if (!proposal) {
      showToast('Proposta non trovata', 'error');
      navigate('#dashboard');
      return;
    }

    AppState.currentProposalId = proposal.id;
    const isOwn = proposal.autore === getUsername() || proposal.id === 'base-year';
    AppState.isReadonly = !isOwn;

    const boardView = document.getElementById('board-view');
    boardView.classList.toggle('board-view--readonly', !isOwn);

    // Set title
    const titleInput = document.getElementById('board-title');
    if (titleInput) {
      titleInput.value = proposal.titolo || '';
      titleInput.disabled = !isOwn;
    }

    // Hide save button and deck if readonly
    if (!isOwn) {
      document.getElementById('btn-save-proposal')?.classList.add('hidden');
      document.getElementById('deck-drawer')?.classList.add('hidden');
    } else {
      document.getElementById('btn-save-proposal')?.classList.remove('hidden');
      document.getElementById('deck-drawer')?.classList.remove('hidden');
    }

    // Process assignments to update AppState.years before rendering
    if (proposal.assegnazioni) {
      if (Array.isArray(proposal.assegnazioni)) {
        AppState.years = proposal.assegnazioni;
      } else {
        AppState.years = [{ label: getYearLabel(0), units: proposal.assegnazioni }];
      }
    } else {
      AppState.years = [{ label: getYearLabel(0), units: {} }];
    }

    // Reconstruct dummy capi if they exist in the saved assignments
    AppState.years.forEach(year => {
      Object.values(year.units || {}).forEach(unitAssignments => {
        unitAssignments.forEach(assignment => {
          if (assignment.capoId && assignment.capoId.startsWith('new-entry-')) {
            if (!AppState.capi.find(c => c.id === assignment.capoId)) {
              AppState.capi.push({
                id: assignment.capoId,
                nome: 'Nuovo',
                cognome: 'Entrato',
                sesso: 'M',
                livelloFoca: 'Nulla',
                altriIncarichi: ['Nessuno'],
                isDummy: true
              });
            }
          }
        });
      });
    });

    // Render the board
    const boardGrid = document.getElementById('board-grid');
    renderBoard(boardGrid, AppState.years);

    // Load saved assignments
    if (proposal.assegnazioni) {
      loadAssignments(proposal.assegnazioni, AppState.capi, !isOwn);
    }

    if (isOwn) {
      // Enable editing
      renderDeckInDrawer();
      initDragDrop(AppState.capi, onBoardChange);
      reattachRoleListeners(onBoardChange);
    }

  } catch (err) {
    console.error('Error loading proposal:', err);
    showToast('Errore nel caricamento della proposta', 'error');
    navigate('#dashboard');
  } finally {
    setLoading(false);
  }
}

function renderDeckInDrawer() {
  const container = document.getElementById('deck-cards');
  if (!container) return;

  // Collect currently assigned IDs
  const assignedIds = new Set();
  document.querySelectorAll('.board-grid .card').forEach(card => {
    if (card.dataset.capoId) assignedIds.add(card.dataset.capoId);
  });

  const sortVal = document.getElementById('drawer-deck-sort')?.value || 'name';
  renderDeck(container, AppState.capi, AppState.deckFilter, sortVal, assignedIds);

  // Update deck count (show available / total)
  const countEl = document.getElementById('drawer-deck-count');
  if (countEl) {
    const available = AppState.capi.filter(c => !assignedIds.has(c.id)).length;
    countEl.textContent = `(${available}/${AppState.capi.length})`;
  }
}

function onBoardChange() {
  // Update multi-incarico highlights
  updateMultiIncarico();
  
  // Re-render deck to update assigned vs available lists
  renderDeckInDrawer();
  
  // Re-init sortable on deck since DOM changed
  initDragDrop(AppState.capi, onBoardChange);
}

// Global selection handler for tap-to-place
window.selectCapo = function(capoId) {
  if (AppState.isReadonly) return;
  if (AppState.selectedCapoId === capoId) {
    AppState.selectedCapoId = null;
  } else {
    AppState.selectedCapoId = capoId;
  }
  renderDeckInDrawer();
};

window.getSelectedCapoId = function() {
  return AppState.selectedCapoId;
};

window.clearSelectedCapo = function() {
  AppState.selectedCapoId = null;
  renderDeckInDrawer();
};

window.isBoardReadonly = function() {
  return AppState.isReadonly;
};

window.deleteYear = async function(yearIndex) {
  if (AppState.isReadonly) return;
  if (AppState.years.length <= 1) return; // Must have at least 1 year
  
  const confirm = await showConfirm(
    'Elimina Anno',
    `Sei sicuro di voler eliminare l'Anno ${yearIndex + 1} e tutte le sue assegnazioni?`
  );
  if (!confirm) return;
  
  // Save current board state first (before removing)
  AppState.years = collectAssignments(AppState.capi, AppState.years);
  
  // Remove the specified year
  AppState.years.splice(yearIndex, 1);
  
  // Update labels of remaining years to be sequential
  AppState.years.forEach((y, i) => {
    y.label = getYearLabel(i);
  });
  
  // Re-render
  const boardGrid = document.getElementById('board-grid');
  renderBoard(boardGrid, AppState.years);
  
  // Restore assignments
  loadAssignments(AppState.years, AppState.capi, false);
  
  // Re-init dragdrop
  initDragDrop(AppState.capi, onBoardChange);
  reattachRoleListeners(onBoardChange);
  onBoardChange(); // Trigger unsaved changes
};

window.assignSelectedCapo = function(unitId, yearIndex = 0) {
  if (AppState.isReadonly) return;
  const capoId = window.getSelectedCapoId();
  if (!capoId) return;

  const capo = AppState.capi.find(c => c.id === capoId);
  if (!capo) return;

  const zone = document.getElementById(`zone-${yearIndex}-${unitId}`);
  if (!zone) return;

  // Check if card is already on the board in THIS year in another unit
  let card = document.querySelector(`.drop-zone[data-year-index="${yearIndex}"] .card[data-capo-id="${capoId}"]`);
  
  if (card) {
    zone.appendChild(card);
  } else {
    card = createCardElement(capo, { showRemove: true });
    zone.appendChild(card);
  }
  
  // Remove old role select
  const oldRole = card.querySelector('.card__role-select');
  if (oldRole) oldRole.remove();
  
  const roleSelect = createRoleSelect(unitId);
  card.appendChild(roleSelect);
  
  // Add remove button if not present (in case it was moved from another zone where it lost it, though it shouldn't)
  if (!card.querySelector('.card__remove-btn')) {
    const removeBtn = document.createElement('button');
    removeBtn.className = 'card__remove-btn';
    removeBtn.title = 'Rimuovi dall\'unità';
    removeBtn.textContent = '✕';
    removeBtn.dataset.action = 'remove';
    card.querySelector('.card__header').appendChild(removeBtn);
  }

  // Listen for role changes
  const select = card.querySelector('.card__role-dropdown');
  if (select) {
    select.addEventListener('change', () => {
      onBoardChange();
    });
  }

  // Update counts
  for (const uid of Object.keys(UNITS)) {
    updateUnitCount(uid, yearIndex);
  }
  
  window.clearSelectedCapo();
  onBoardChange();
};

function setupBoardEvents() {
  // Back button
  document.getElementById('btn-board-back')?.addEventListener('click', () => {
    destroyDragDrop();
    navigate('#dashboard');
  });

  // Consensus back button
  document.getElementById('btn-consensus-back')?.addEventListener('click', () => {
    navigate('#dashboard');
  });

  const sortSelect = document.getElementById('drawer-deck-sort');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      renderDeckInDrawer();
      initDragDrop(AppState.capi, onBoardChange);
    });
  }

  // Save proposal button
  document.getElementById('btn-save-proposal')?.addEventListener('click', async () => {
    await handleSaveProposal();
  });

  // Add year button
  const btnAddYear = document.getElementById('btn-add-year');
  if (btnAddYear) {
    btnAddYear.addEventListener('click', () => {
      if (AppState.isReadonly) return;
      
      // Save current board state first before re-rendering
      // Passiamo AppState.years come array per conservare label e isBaseYear
      AppState.years = collectAssignments(AppState.capi, AppState.years);
      
      // Add a new empty year
      const newYearIndex = AppState.years.length;
      AppState.years.push({ label: getYearLabel(newYearIndex), units: {} });
      
      // Re-render
      const boardGrid = document.getElementById('board-grid');
      renderBoard(boardGrid, AppState.years);
      
      // Restore assignments
      loadAssignments(AppState.years, AppState.capi, false);
      
      // Re-init dragdrop
      initDragDrop(AppState.capi, onBoardChange);
      reattachRoleListeners(onBoardChange);
    });
  }

  // Add new entry button
  const btnNewEntry = document.getElementById('btn-drawer-new-entry');
  if (btnNewEntry) {
    btnNewEntry.addEventListener('click', () => {
      if (AppState.isReadonly) return;
      import('./ui.js').then(({ showNewEntryModal }) => {
        showNewEntryModal((comment) => {
          const dummyId = `new-entry-${Date.now()}`;
          AppState.capi.push({
            id: dummyId,
            nome: comment,
            cognome: '', // or omit, but it's fine
            soprannome: comment, // to show it as the main name
            sesso: 'M',
            livelloFoca: 'Nulla',
            altriIncarichi: ['Nessuno'],
            isDummy: true
          });
          renderDeckInDrawer();
          initDragDrop(AppState.capi, onBoardChange);
          import('./ui.js').then(({ showToast }) => {
            showToast('Nuovo ingresso aggiunto al mazzo', 'success', 2000);
          });
        });
      });
    });
  }

  // Delete proposal button
  document.getElementById('btn-delete-proposal')?.addEventListener('click', async () => {
    if (!AppState.currentProposalId) return;

    const confirmed = await showConfirm(
      'Elimina Proposta',
      'Sei sicuro di voler eliminare questa proposta?<br>Questa azione non può essere annullata.'
    );

    if (confirmed) {
      try {
        await deleteProposal(AppState.currentProposalId);
        showToast('Proposta eliminata', 'success');
        navigate('#dashboard');
      } catch (err) {
        showToast('Errore nell\'eliminazione', 'error');
        console.error(err);
      }
    }
  });
}

async function handleSaveProposal() {
  const titleInput = document.getElementById('board-title');
  const titolo = titleInput ? titleInput.value.trim() : '';

  if (!titolo) {
    showToast('Inserisci un titolo per la proposta', 'warning');
    titleInput?.focus();
    return;
  }

  // Validate that all cards have a role selected
  let hasMissingRoles = false;
  document.querySelectorAll('.card--error').forEach(c => c.classList.remove('card--error'));
  
  document.querySelectorAll('.drop-zone__cards .card:not(.sortable-ghost)').forEach(card => {
    const select = card.querySelector('.card__role-dropdown');
    if (select && (!select.value || select.value === 'Senza ruolo' || select.value === '')) {
      card.classList.add('card--error');
      hasMissingRoles = true;
    }
  });

  if (hasMissingRoles) {
    showToast('Impossibile salvare: assegna un ruolo a tutti i capi (evidenziati in rosso)', 'error');
    return;
  }

  // Collect assignments from the board (array of years)
  const assegnazioni = collectAssignments(AppState.capi, AppState.years);

  // Validation currently only runs on the FIRST year or flat format.
  // We'll validate all years, merging the warnings.
  let warnings = [];
  assegnazioni.forEach((yearData, i) => {
    // validateProposal expects a flat object { unitId: [...] }
    const yearWarnings = validateProposal(yearData.units, AppState.capi);
    if (yearWarnings.length > 0) {
      warnings.push(`<strong>${yearData.label}:</strong>`);
      warnings.push(...yearWarnings);
    }
  });

  if (warnings.length > 0) {
    const warningList = warnings.map(w => `<li>${w}</li>`).join('');
    const shouldSave = await showWarningConfirm(
      '⚠️ Attenzione — Validazione',
      `<p>La proposta presenta i seguenti problemi:</p><ul>${warningList}</ul><p>Vuoi salvare comunque?</p>`
    );

    if (!shouldSave) return;
  }

  // Save to Firestore
  setLoading(true);

  try {
    const proposalData = {
      autore: getUsername(),
      titolo,
      assegnazioni,
      warnings: warnings.length > 0 ? warnings : []
    };

    if (AppState.currentProposalId) {
      if (AppState.currentProposalId === 'base-year') {
        // Update base-year
        await import('./db.js').then(db => db.saveBaseYear(proposalData));
        showToast('Organico attuale salvato! ✅', 'success');
      } else {
        // Update existing
        await import('./db.js').then(db => db.updateProposal(AppState.currentProposalId, proposalData));
        showToast('Proposta aggiornata! ✅', 'success');
      }
    } else {
      // Create new
      const db = await import('./db.js');
      const id = await db.saveProposal(proposalData);
      AppState.currentProposalId = id;
      showToast('Proposta salvata! 🎉', 'success');
    }

    navigate('#dashboard');
  } catch (err) {
    console.error('Error saving proposal:', err);
    showToast('Errore nel salvataggio della proposta', 'error');
  } finally {
    setLoading(false);
  }
}


// ══════════════════════════════════════════
// INITIALIZATION
// ══════════════════════════════════════════

function init() {
  setupLogin();
  setupDashboardEvents();
  setupBoardEvents();

  // Listen for route changes
  window.addEventListener('hashchange', handleRoute);

  // Handle initial route
  handleRoute();
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
