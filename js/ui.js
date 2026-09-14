// ============================================
// CO.CA. — UI Helpers
// Toast notifications, Modals, Confirm dialogs
// ============================================

// ══════════════════════════════════════════
// TOAST NOTIFICATIONS
// ══════════════════════════════════════════

let toastContainer = null;

function ensureToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

const TOAST_ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ'
};

/**
 * Show a toast notification
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {number} duration - ms (default 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
  const container = ensureToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__icon">${TOAST_ICONS[type]}</span>
    <span class="toast__message">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}


// ══════════════════════════════════════════
// MODAL DIALOG
// ══════════════════════════════════════════

let modalOverlay = null;

function ensureModalOverlay() {
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.id = 'modal-overlay';
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        hideModal();
      }
    });
    document.body.appendChild(modalOverlay);
  }
  return modalOverlay;
}

/**
 * Show a modal dialog
 * @param {string} title
 * @param {string} bodyHTML - HTML content for the body
 * @param {Array} actions - Array of { label, class, onClick }
 */
export function showModal(title, bodyHTML, actions = []) {
  const overlay = ensureModalOverlay();

  const actionsHTML = actions.map(a =>
    `<button class="btn ${a.class || 'btn--secondary'}" data-action="${a.label}">${a.label}</button>`
  ).join('');

  overlay.innerHTML = `
    <div class="modal">
      <h3 class="modal__title">${title}</h3>
      <div class="modal__body">${bodyHTML}</div>
      <div class="modal__actions">${actionsHTML}</div>
    </div>
  `;

  // Bind action handlers
  actions.forEach(a => {
    const btn = overlay.querySelector(`[data-action="${a.label}"]`);
    if (btn && a.onClick) {
      btn.addEventListener('click', () => {
        a.onClick();
        hideModal();
      });
    }
  });

  // Activate with tiny delay for CSS transition
  requestAnimationFrame(() => {
    overlay.classList.add('active');
  });
}

/**
 * Hide the current modal
 */
export function hideModal() {
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
  }
}

/**
 * Show a confirmation dialog and return a Promise
 * @param {string} title
 * @param {string} message - Can be HTML
 * @returns {Promise<boolean>}
 */
export function showConfirm(title, message) {
  return new Promise((resolve) => {
    showModal(title, message, [
      {
        label: 'Annulla',
        class: 'btn--secondary',
        onClick: () => resolve(false)
      },
      {
        label: 'Conferma',
        class: 'btn--primary',
        onClick: () => resolve(true)
      }
    ]);
  });
}

/**
 * Show a warning confirmation (for validation)
 * @param {string} title
 * @param {string} message
 * @returns {Promise<boolean>}
 */
export function showWarningConfirm(title, message) {
  return new Promise((resolve) => {
    showModal(title, message, [
      {
        label: 'Torna al tabellone',
        class: 'btn--secondary',
        onClick: () => resolve(false)
      },
      {
        label: 'Salva comunque',
        class: 'btn--primary',
        onClick: () => resolve(true)
      }
    ]);
  });
}


// ══════════════════════════════════════════
// FORM MODAL (for adding Capo)
// ══════════════════════════════════════════

/**
 * Show the "Aggiungi Capo" or "Modifica Capo" form modal
 * @param {Function} onSubmit - Called with form data object
 * @param {Object} [capoToEdit] - Optional capo object to edit
 */
export function showAddCapoModal(onSubmit, capoToEdit = null) {
  const overlay = ensureModalOverlay();
  
  const isEditing = !!capoToEdit;
  const titleText = isEditing ? '🃏 Modifica Capo' : '🃏 Aggiungi Capo al Mazzo';
  const btnText = isEditing ? '✓ Salva Modifiche' : '✓ Aggiungi al Mazzo';

  overlay.innerHTML = `
    <div class="modal" style="max-width: 560px;">
      <h3 class="modal__title">${titleText}</h3>
      <form class="add-capo-form" id="add-capo-form">

        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label for="capo-nome">Nome</label>
            <input type="text" class="form-input" id="capo-nome" placeholder="Mario" required>
          </div>
          <div class="form-group">
            <label for="capo-cognome">Cognome</label>
            <input type="text" class="form-input" id="capo-cognome" placeholder="Rossi" required>
          </div>
        </div>

        <div class="form-group">
          <label for="capo-soprannome">Soprannome <span style="font-weight: 400; text-transform: none; letter-spacing: 0; font-size: 0.75rem; color: var(--text-muted);">(opzionale — se inserito, viene mostrato come nome principale)</span></label>
          <input type="text" class="form-input" id="capo-soprannome" placeholder="Es. Pippo, Lollo, Ale...">
        </div>

        <div class="form-group">
          <label>Foto <span style="font-weight: 400; text-transform: none; letter-spacing: 0; font-size: 0.75rem; color: var(--text-muted);">(opzionale)</span></label>
          <div style="display: flex; gap: 12px; align-items: center;">
            <div id="foto-preview-container" style="width: 60px; height: 60px; border-radius: 50%; background: var(--bg-input); border: 2px dashed var(--border-light); overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <span id="foto-preview-placeholder" style="font-size: 1.5rem; color: var(--text-muted);">📷</span>
              <img id="foto-preview-img" src="" style="width: 100%; height: 100%; object-fit: cover; display: none;">
            </div>
            <div style="flex: 1;">
              <input type="file" id="capo-foto-file" accept="image/*" style="display: none;">
              <button type="button" class="btn btn--secondary btn--small" onclick="document.getElementById('capo-foto-file').click()">Carica Foto</button>
              <button type="button" class="btn btn--secondary btn--small" id="btn-remove-foto" style="display: none; margin-left: 8px; color: var(--accent-red); border-color: rgba(231,76,60,0.3);">Rimuovi</button>
            </div>
          </div>
          <input type="hidden" id="capo-foto-base64">
        </div>

        <div class="form-group">
          <label>Sesso</label>
          <div class="radio-group">
            <label class="radio-option">
              <input type="radio" name="capo-sesso" value="M" required>
              <span class="radio-label">♂ Maschio</span>
            </label>
            <label class="radio-option">
              <input type="radio" name="capo-sesso" value="F" required>
              <span class="radio-label">♀ Femmina</span>
            </label>
          </div>
        </div>

        <div class="form-group">
          <label for="capo-foca">Livello Fo.Ca.</label>
          <select class="form-select" id="capo-foca" required>
            <option value="">Seleziona...</option>
            <option value="Nulla">Nulla</option>
            <option value="Tirocinio">Tirocinio</option>
            <option value="CFM">CFM</option>
            <option value="CFA">CFA</option>
            <option value="WB">WB - Nomina</option>
          </select>
        </div>

        <div class="form-group cfm-detail" id="cfm-detail-group">
          <label for="capo-cfm-detail">Specifica CFM</label>
          <input type="text" class="form-input" id="capo-cfm-detail" placeholder="Es. CFM del Bosco, CFM della Giungla...">
        </div>

        <div class="form-group">
          <label>Altri Incarichi extra-unità</label>
          <div class="checkbox-grid">
            <label class="checkbox-option">
              <input type="checkbox" name="capo-incarichi" value="IABZ">
              <span class="checkbox-mark"></span>
              IABZ
            </label>
            <label class="checkbox-option">
              <input type="checkbox" name="capo-incarichi" value="RDZ">
              <span class="checkbox-mark"></span>
              RDZ
            </label>
            <label class="checkbox-option">
              <input type="checkbox" name="capo-incarichi" value="Consigliere Generale">
              <span class="checkbox-mark"></span>
              Consigliere Generale
            </label>
            <label class="checkbox-option">
              <input type="checkbox" name="capo-incarichi" value="Eventi per Ragazzi">
              <span class="checkbox-mark"></span>
              Eventi per Ragazzi (PO, CdS, CdC, EPPPI, ROSS)
            </label>
            <label class="checkbox-option">
              <input type="checkbox" name="capo-incarichi" value="Formatore">
              <span class="checkbox-mark"></span>
              Formatore
            </label>
            <label class="checkbox-option">
              <input type="checkbox" name="capo-incarichi" value="Tesoriere">
              <span class="checkbox-mark"></span>
              Tesoriere
            </label>
          </div>
        </div>

        <div class="modal__actions">
          <button type="button" class="btn btn--secondary" id="capo-cancel">Annulla</button>
          <button type="submit" class="btn btn--green">${btnText}</button>
        </div>
      </form>
    </div>
  `;

  // CFM detail toggle
  const focaSelect = overlay.querySelector('#capo-foca');
  const cfmGroup = overlay.querySelector('#cfm-detail-group');
  focaSelect.addEventListener('change', () => {
    cfmGroup.classList.toggle('visible', focaSelect.value === 'CFM');
  });
  
  // Photo upload and resize logic
  const fileInput = overlay.querySelector('#capo-foto-file');
  const previewImg = overlay.querySelector('#foto-preview-img');
  const previewPlaceholder = overlay.querySelector('#foto-preview-placeholder');
  const base64Input = overlay.querySelector('#capo-foto-base64');
  const btnRemoveFoto = overlay.querySelector('#btn-remove-foto');

  const setFotoPreview = (src) => {
    if (src) {
      previewImg.src = src;
      previewImg.style.display = 'block';
      previewPlaceholder.style.display = 'none';
      base64Input.value = src;
      btnRemoveFoto.style.display = 'inline-flex';
    } else {
      previewImg.src = '';
      previewImg.style.display = 'none';
      previewPlaceholder.style.display = 'block';
      base64Input.value = '';
      btnRemoveFoto.style.display = 'none';
      fileInput.value = '';
    }
  };

  btnRemoveFoto.addEventListener('click', () => setFotoPreview(null));

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setFotoPreview(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Populate form if editing
  if (isEditing) {
    overlay.querySelector('#capo-nome').value = capoToEdit.nome || '';
    overlay.querySelector('#capo-cognome').value = capoToEdit.cognome || '';
    overlay.querySelector('#capo-soprannome').value = capoToEdit.soprannome || '';
    
    if (capoToEdit.fotoUrl) {
      setFotoPreview(capoToEdit.fotoUrl);
    }
    
    if (capoToEdit.sesso) {
      const radio = overlay.querySelector(`input[name="capo-sesso"][value="${capoToEdit.sesso}"]`);
      if (radio) radio.checked = true;
    }
    
    if (capoToEdit.livelloFoca) {
      focaSelect.value = capoToEdit.livelloFoca;
      cfmGroup.classList.toggle('visible', focaSelect.value === 'CFM');
    }
    
    overlay.querySelector('#capo-cfm-detail').value = capoToEdit.cfmDettaglio || '';
    
    if (capoToEdit.altriIncarichi && Array.isArray(capoToEdit.altriIncarichi)) {
      capoToEdit.altriIncarichi.forEach(incarico => {
        const cb = overlay.querySelector(`input[name="capo-incarichi"][value="${incarico}"]`);
        if (cb) cb.checked = true;
      });
    }
  }

  // Cancel button
  overlay.querySelector('#capo-cancel').addEventListener('click', hideModal);

  // Form submit
  overlay.querySelector('#add-capo-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const nome = overlay.querySelector('#capo-nome').value.trim();
    const cognome = overlay.querySelector('#capo-cognome').value.trim();
    const soprannome = overlay.querySelector('#capo-soprannome').value.trim();
    const fotoUrl = overlay.querySelector('#capo-foto-base64').value.trim();
    const sesso = overlay.querySelector('input[name="capo-sesso"]:checked')?.value;
    const livelloFoca = focaSelect.value;
    const cfmDettaglio = livelloFoca === 'CFM'
      ? overlay.querySelector('#capo-cfm-detail').value.trim()
      : '';

    const incarichi = Array.from(
      overlay.querySelectorAll('input[name="capo-incarichi"]:checked')
    ).map(cb => cb.value);

    if (!nome || !cognome || !sesso || !livelloFoca) {
      showToast('Compila tutti i campi obbligatori', 'error');
      return;
    }

    onSubmit({
      nome,
      cognome,
      soprannome,
      fotoUrl,
      sesso,
      livelloFoca,
      cfmDettaglio,
      altriIncarichi: incarichi.length > 0 ? incarichi : ['Nessuno']
    });

    hideModal();
  });

  requestAnimationFrame(() => {
    overlay.classList.add('active');
    overlay.querySelector('#capo-nome').focus();
  });
}


// ══════════════════════════════════════════
// NEW ENTRY MODAL
// ══════════════════════════════════════════

/**
 * Show a modal to create a quick "New Entry" dummy capo
 * @param {Function} onSubmit - Called with the comment string
 */
export function showNewEntryModal(onSubmit) {
  const overlay = ensureModalOverlay();
  
  overlay.innerHTML = `
    <div class="modal" style="max-width: 400px;">
      <h3 class="modal__title">➕ Nuovo Ingresso</h3>
      <p style="margin-bottom: 16px; font-size: 0.95rem; color: var(--text-secondary);">
        Inserisci un breve commento per identificare il nuovo ingresso (es. "Studente Padova", "Capo da altra zona").
      </p>
      <form id="new-entry-form">
        <div class="form-group">
          <input type="text" class="form-input" id="entry-comment" placeholder="Breve descrizione..." required maxlength="30">
        </div>
        <div class="modal__actions">
          <button type="button" class="btn btn--secondary" id="btn-cancel-entry">Annulla</button>
          <button type="submit" class="btn btn--primary">Aggiungi al Mazzo</button>
        </div>
      </form>
    </div>
  `;

  const btnCancel = overlay.querySelector('#btn-cancel-entry');
  btnCancel.addEventListener('click', hideModal);

  const form = overlay.querySelector('#new-entry-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const comment = overlay.querySelector('#entry-comment').value.trim();
    if (!comment) return;
    
    onSubmit(comment);
    hideModal();
  });

  requestAnimationFrame(() => {
    overlay.classList.add('active');
    overlay.querySelector('#entry-comment').focus();
  });
}


// ══════════════════════════════════════════
// LOADING INDICATOR
// ══════════════════════════════════════════

/**
 * Show/hide a loading overlay
 * @param {boolean} show
 */
export function setLoading(show) {
  let loader = document.getElementById('loading-overlay');
  if (show && !loader) {
    loader = document.createElement('div');
    loader.id = 'loading-overlay';
    loader.className = 'modal-overlay active';
    loader.style.cursor = 'wait';
    loader.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 2.5rem; margin-bottom: 12px; animation: spin 1.5s linear infinite;">🃏</div>
        <div style="color: var(--text-secondary); font-size: 0.9rem;">Caricamento...</div>
      </div>
    `;
    document.body.appendChild(loader);
  } else if (!show && loader) {
    loader.remove();
  }
}

// Add spin animation
if (!document.getElementById('spin-style')) {
  const style = document.createElement('style');
  style.id = 'spin-style';
  style.textContent = `@keyframes spin { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }`;
  document.head.appendChild(style);
}
