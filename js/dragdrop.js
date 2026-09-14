// ============================================
// CO.CA. — Drag & Drop Setup (SortableJS)
// Clone from deck, move between zones, touch support
// ============================================

import { UNITS, createRoleSelect, updateUnitCount, updateMultiIncarico } from './board.js';

// Store Sortable instances for cleanup
let sortableInstances = [];

/**
 * Initialize drag & drop for the board
 * @param {Array} capi - Full capi list (for reference)
 * @param {Function} onBoardChange - Called when any drop zone changes
 */
export function initDragDrop(capi, onBoardChange) {
  // Clean up existing instances
  destroyDragDrop();

  // Setup deck (source - clone mode)
  const deckContainer = document.getElementById('deck-cards');
  if (deckContainer) {
    const deckSortable = new Sortable(deckContainer, {
      group: {
        name: 'coca-cards',
        pull: 'clone',  // Clone cards from deck (don't remove)
        put: false       // Don't allow dropping back into deck
      },
      sort: false,        // Don't sort within deck
      animation: 200,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      chosenClass: 'sortable-chosen',
      delay: 150,         // Touch delay to distinguish scroll vs drag
      delayOnTouchOnly: true,
      touchStartThreshold: 5,
      forceFallback: true, // Better cross-browser touch support
      fallbackOnBody: true,
      fallbackTolerance: 5,

      onClone: function(evt) {
        // The clone stays in the deck, the dragged item goes to the zone
        // We need to add role select to the clone that gets placed in the zone
      },

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

  // Setup each drop zone
  for (const unitId of Object.keys(UNITS)) {
    const zoneEl = document.getElementById(`zone-${unitId}`);
    if (!zoneEl) continue;

    const zoneSortable = new Sortable(zoneEl, {
      group: {
        name: 'coca-cards',
        pull: true,
        put: true
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

      onAdd: function(evt) {
        const card = evt.item;
        const capoId = card.dataset.capoId;

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
        updateUnitCount(unitId);
        updateMultiIncarico();
        onBoardChange();
      },

      onRemove: function(evt) {
        updateUnitCount(unitId);
        updateMultiIncarico();
        onBoardChange();
      },

      onUpdate: function(evt) {
        // Card reordered within the same zone
        onBoardChange();
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
          if (newUnitId && newUnitId !== unitId) {
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
        }

        // Update all unit counts
        for (const uid of Object.keys(UNITS)) {
          updateUnitCount(uid);
        }
        updateMultiIncarico();
      }
    });

    sortableInstances.push(zoneSortable);
  }

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

  // Remove with animation
  card.style.transition = 'all 0.2s ease';
  card.style.opacity = '0';
  card.style.transform = 'scale(0.8)';

  setTimeout(() => {
    card.remove();
    if (unitId) updateUnitCount(unitId);
    updateMultiIncarico();
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
