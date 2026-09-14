// ============================================
// CO.CA. — Drag & Drop Setup (SortableJS)
// Clone from deck, move between zones, touch support
// ============================================

import { UNITS, createRoleSelect, updateUnitCount, updateMultiIncarico } from './board.js';

// Store Sortable instances for cleanup
let sortableInstances = [];
// Store board change callback for remove handler
let _onBoardChangeCallback = null;

/**
 * Initialize drag & drop for the board
 * @param {Array} capi - Full capi list (for reference)
 * @param {Function} onBoardChange - Called when any drop zone changes
 */
export function initDragDrop(capi, onBoardChange) {
  // Store callback for remove handler
  _onBoardChangeCallback = onBoardChange;

  // Clean up existing instances
  destroyDragDrop();

  // Setup deck (source - clone mode)
  const deckContainer = document.getElementById('deck-cards');
  if (deckContainer) {
    const deckSortable = new Sortable(deckContainer, {
      group: {
        name: 'coca-cards',
        pull: true,     // Move cards from deck (deck re-render will put them at the bottom)
        put: false      // Don't allow dropping back into deck
      },
      sort: false,        // Don't sort within deck
      filter: '.deck-drawer__divider', // Don't drag the divider
      animation: 200,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      chosenClass: 'sortable-chosen',
      delay: 200,         // Touch delay to distinguish scroll vs drag
      delayOnTouchOnly: true,
      touchStartThreshold: 5,
      forceFallback: true, // Better cross-browser touch support
      fallbackOnBody: true,
      fallbackTolerance: 10,

      onStart: function(evt) {
        document.body.classList.add('is-dragging');
        // Highlight all drop zones
        document.querySelectorAll('.drop-zone__cards').forEach(zone => {
          zone.classList.add('drop-active');
        });
      },

      onEnd: function(evt) {
        document.body.classList.remove('is-dragging');
        document.querySelectorAll('.drop-zone__cards').forEach(zone => {
          zone.classList.remove('drop-active');
        });
      }
    });
    sortableInstances.push(deckSortable);
  }

  // Setup each drop zone dynamically across all years
  const dropZones = document.querySelectorAll('.drop-zone-list');
  dropZones.forEach(zoneEl => {
    const unitId = zoneEl.dataset.unitId;
    const yearIndex = zoneEl.dataset.yearIndex;
    const dropZoneContainer = zoneEl.closest('.drop-zone');
    const isReadonly = dropZoneContainer && dropZoneContainer.dataset.readonly === 'true';

    const zoneSortable = new Sortable(zoneEl, {
      group: {
        name: 'coca-cards',
        pull: !isReadonly,
        put: !isReadonly
      },
      animation: 200,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      chosenClass: 'sortable-chosen',
      delay: 100,
      delayOnTouchOnly: true,
      touchStartThreshold: 5,
      forceFallback: true,
      fallbackOnBody: true,
      fallbackTolerance: 5,

      onMove: function(evt) {
        const capoId = evt.dragged.dataset.capoId;
        const targetZone = evt.to;
        if (!targetZone || !targetZone.classList.contains('drop-zone-list')) return true;

        const targetYearIndex = targetZone.dataset.yearIndex;
        
        // Se stiamo spostando la carta all'interno dello stesso anno, permettiamolo
        if (evt.from.dataset && evt.from.dataset.yearIndex === targetYearIndex) {
          return true;
        }

        // Altrimenti, controlliamo se esiste già una carta con lo stesso capoId in questo anno
        const existing = document.querySelector(`.drop-zone-list[data-year-index="${targetYearIndex}"] .card[data-capo-id="${capoId}"]`);
        if (existing && existing !== evt.dragged) {
          return false; // Blocca il drop
        }
        return true;
      },

      onAdd: function(evt) {
        const card = evt.item;
        
        // Remove any existing role select
        const existingRole = card.querySelector('.card__role-select');
        if (existingRole) existingRole.remove();

        // Add role select for this unit
        const roleSelect = createRoleSelect(unitId);
        card.appendChild(roleSelect);

        // Add remove button if not present
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

        // Update counts and multi-incarico
        updateUnitCount(unitId, yearIndex);
        updateMultiIncarico(document.querySelectorAll('.year-section').length);
        setTimeout(() => onBoardChange(), 10);
      },

      onRemove: function(evt) {
        updateUnitCount(unitId, yearIndex);
        updateMultiIncarico(document.querySelectorAll('.year-section').length);
        setTimeout(() => onBoardChange(), 10);
      },

      onUpdate: function(evt) {
        setTimeout(() => onBoardChange(), 10);
      },

      onStart: function(evt) {
        document.body.classList.add('is-dragging');
        document.querySelectorAll('.drop-zone__cards').forEach(zone => {
          if (zone !== zoneEl) {
            zone.classList.add('drop-active');
          }
        });
      },

      onEnd: function(evt) {
        document.body.classList.remove('is-dragging');
        document.querySelectorAll('.drop-zone__cards').forEach(zone => {
          zone.classList.remove('drop-active');
        });

        // If the card was moved to a new unit, update the role select
        const card = evt.item;
        const newZone = card.closest('.drop-zone__cards');
        if (newZone) {
          const newUnitId = newZone.dataset.unitId;
          const newYearIndex = newZone.dataset.yearIndex;
          
          if (newUnitId && (newUnitId !== unitId || newYearIndex !== yearIndex)) {
            // Remove old role select and add new one
            const oldRole = card.querySelector('.card__role-select');
            if (oldRole) oldRole.remove();

            const roleSelect = createRoleSelect(newUnitId);
            card.appendChild(roleSelect);

            const select = card.querySelector('.card__role-dropdown');
            if (select) {
              select.addEventListener('change', () => {
                onBoardChange();
              });
            }
          }
          
          if (newUnitId) updateUnitCount(newUnitId, newYearIndex);
        }

        updateUnitCount(unitId, yearIndex);
        updateMultiIncarico(document.querySelectorAll('.year-section').length);
      }
    });

    sortableInstances.push(zoneSortable);
  });

  // Event delegation for remove buttons
  document.addEventListener('click', handleRemoveClick);
}

/**
 * Handle remove button clicks (event delegation)
 */
function handleRemoveClick(e) {
  const removeBtn = e.target.closest('[data-action="remove"]');
  if (!removeBtn) return;

  const card = removeBtn.closest('.card');
  if (!card) return;

  const zone = card.closest('.drop-zone__cards');
  if (!zone) return;

  const unitId = zone.dataset.unitId;
  const yearIndex = zone.dataset.yearIndex;

  // Remove with animation
  card.style.transition = 'all 0.2s ease';
  card.style.opacity = '0';
  card.style.transform = 'scale(0.8)';

  setTimeout(() => {
    card.remove();
    if (unitId && yearIndex) updateUnitCount(unitId, yearIndex);
    updateMultiIncarico(document.querySelectorAll('.year-section').length);
    
    // Trigger board change so deck re-syncs immediately
    if (_onBoardChangeCallback) _onBoardChangeCallback();
  }, 200);
}

/**
 * Destroy all Sortable instances (cleanup)
 */
export function destroyDragDrop() {
  sortableInstances.forEach(instance => {
    if (instance && instance.destroy) {
      instance.destroy();
    }
  });
  sortableInstances = [];
  document.removeEventListener('click', handleRemoveClick);
}

/**
 * Re-initialize role select listeners after loading saved assignments
 * @param {Function} onBoardChange
 */
export function reattachRoleListeners(onBoardChange) {
  document.querySelectorAll('.card__role-dropdown').forEach(select => {
    select.addEventListener('change', () => {
      onBoardChange();
    });
  });

  // Reattach remove buttons
  document.querySelectorAll('.drop-zone__cards .card__remove-btn').forEach(btn => {
    // Already handled by event delegation
  });
}
