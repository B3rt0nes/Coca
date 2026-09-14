// ============================================
// CO.CA. — Validation Rules
// Validates proposals before saving
// ============================================

import { UNITS } from './board.js';

/**
 * Validate a proposal's assignments against scout rules:
 * - Branco: un solo capo unità maschio (CB)
 * - Cerchio: una sola capo unità femmina (CC)
 * - Reparto Apollo: un solo capo unità maschio (CR)
 * - Reparto Artemide: una sola capo unità femmina (CR)
 * - Noviziato: almeno un MdN, non importa il sesso
 * - Clan: un capo clan maschio ed una capo clan femmina (CC/CF)
 * - Co.Ca.: due capi gruppo, uno maschio ed uno femmina (CG)
 * - Controllo capi senza ruolo
 *
 * @param {Object} assegnazioni - { unitId: [{ capoId, ruolo }] }
 * @param {Array} capi - Full capi list for reference
 * @returns {Array<string>} Array of warning messages (empty if valid)
 */
export function validateProposal(assegnazioni, capi) {
  const warnings = [];

  // Build a lookup for capo data
  const capiMap = {};
  capi.forEach(c => { capiMap[c.id] = c; });

  // 1. Controlla capi senza ruolo
  for (const [unitId, unitConfig] of Object.entries(UNITS)) {
    const assignments = assegnazioni[unitId] || [];
    assignments.forEach(a => {
      if (!a.ruolo || a.ruolo.trim() === '' || a.ruolo === 'Senza ruolo') {
        const capo = capiMap[a.capoId];
        const nomeCapo = capo ? capo.nome : 'Un capo';
        warnings.push(`⚠ <strong>${unitConfig.name}</strong>: ${nomeCapo} è senza ruolo.`);
      }
    });
  }

  // 2. Vincoli specifici per unità
  for (const [unitId, unitConfig] of Object.entries(UNITS)) {
    const assignments = assegnazioni[unitId] || [];
    const unitName = unitConfig.name;

    if (unitId === 'branco-s-francesco') {
      const cbList = assignments.filter(a => a.ruolo === 'CB');
      const maleCb = cbList.filter(a => (capiMap[a.capoId]?.sesso === 'M'));
      const femaleCb = cbList.filter(a => (capiMap[a.capoId]?.sesso === 'F'));

      if (cbList.length === 0) {
        warnings.push(`⚠ <strong>${unitName}</strong>: manca il capo unità maschio (CB).`);
      } else if (cbList.length > 1) {
        warnings.push(`⚠ <strong>${unitName}</strong>: ci deve essere un solo capo unità maschio (CB), trovati ${cbList.length}.`);
      } else if (maleCb.length !== 1) {
        warnings.push(`⚠ <strong>${unitName}</strong>: il capo unità (CB) deve essere maschio.`);
      }
    } else if (unitId === 'cerchio-s-chiara') {
      const ccList = assignments.filter(a => a.ruolo === 'CC');
      const femaleCc = ccList.filter(a => (capiMap[a.capoId]?.sesso === 'F'));

      if (ccList.length === 0) {
        warnings.push(`⚠ <strong>${unitName}</strong>: manca la capo unità femmina (CC).`);
      } else if (ccList.length > 1) {
        warnings.push(`⚠ <strong>${unitName}</strong>: ci deve essere una sola capo unità femmina (CC), trovate ${ccList.length}.`);
      } else if (femaleCc.length !== 1) {
        warnings.push(`⚠ <strong>${unitName}</strong>: la capo unità (CC) deve essere femmina.`);
      }
    } else if (unitId === 'reparto-apollo') {
      const crList = assignments.filter(a => a.ruolo === 'CR');
      const maleCr = crList.filter(a => (capiMap[a.capoId]?.sesso === 'M'));

      if (crList.length === 0) {
        warnings.push(`⚠ <strong>${unitName}</strong>: manca il capo unità maschio (CR).`);
      } else if (crList.length > 1) {
        warnings.push(`⚠ <strong>${unitName}</strong>: ci deve essere un solo capo unità maschio (CR), trovati ${crList.length}.`);
      } else if (maleCr.length !== 1) {
        warnings.push(`⚠ <strong>${unitName}</strong>: il capo unità (CR) deve essere maschio.`);
      }
    } else if (unitId === 'reparto-artemide') {
      const crList = assignments.filter(a => a.ruolo === 'CR');
      const femaleCr = crList.filter(a => (capiMap[a.capoId]?.sesso === 'F'));

      if (crList.length === 0) {
        warnings.push(`⚠ <strong>${unitName}</strong>: manca la capo unità femmina (CR).`);
      } else if (crList.length > 1) {
        warnings.push(`⚠ <strong>${unitName}</strong>: ci deve essere una sola capo unità femmina (CR), trovate ${crList.length}.`);
      } else if (femaleCr.length !== 1) {
        warnings.push(`⚠ <strong>${unitName}</strong>: la capo unità (CR) deve essere femmina.`);
      }
    } else if (unitId === 'noviziato') {
      const mdnList = assignments.filter(a => a.ruolo === 'MdN');
      if (mdnList.length === 0) {
        warnings.push(`⚠ <strong>${unitName}</strong>: serve almeno un Maestro dei Novizi (MdN).`);
      }
    } else if (unitId === 'clan-boanerghes') {
      const mainList = assignments.filter(a => a.ruolo === 'CC/CF');
      const maleMain = mainList.filter(a => (capiMap[a.capoId]?.sesso === 'M'));
      const femaleMain = mainList.filter(a => (capiMap[a.capoId]?.sesso === 'F'));

      if (mainList.length === 0) {
        warnings.push(`⚠ <strong>${unitName}</strong>: mancano entrambi i capi clan (CC/CF: 1 maschio e 1 femmina).`);
      } else {
        if (maleMain.length === 0) {
          warnings.push(`⚠ <strong>${unitName}</strong>: manca il capo clan maschio (CC/CF).`);
        } else if (maleMain.length > 1) {
          warnings.push(`⚠ <strong>${unitName}</strong>: ci può essere un solo capo clan maschio (CC/CF).`);
        }

        if (femaleMain.length === 0) {
          warnings.push(`⚠ <strong>${unitName}</strong>: manca la capo clan femmina (CC/CF).`);
        } else if (femaleMain.length > 1) {
          warnings.push(`⚠ <strong>${unitName}</strong>: ci può essere una sola capo clan femmina (CC/CF).`);
        }
      }
    } else if (unitId === 'coca') {
      const cgList = assignments.filter(a => a.ruolo === 'CG');
      const maleCg = cgList.filter(a => (capiMap[a.capoId]?.sesso === 'M'));
      const femaleCg = cgList.filter(a => (capiMap[a.capoId]?.sesso === 'F'));

      if (cgList.length === 0) {
        warnings.push(`⚠ <strong>${unitName}</strong>: mancano i due capi gruppo (CG: 1 maschio e 1 femmina).`);
      } else {
        if (maleCg.length === 0) {
          warnings.push(`⚠ <strong>${unitName}</strong>: manca il capo gruppo maschio (CG).`);
        } else if (maleCg.length > 1) {
          warnings.push(`⚠ <strong>${unitName}</strong>: ci può essere un solo capo gruppo maschio (CG).`);
        }

        if (femaleCg.length === 0) {
          warnings.push(`⚠ <strong>${unitName}</strong>: manca la capo gruppo femmina (CG).`);
        } else if (femaleCg.length > 1) {
          warnings.push(`⚠ <strong>${unitName}</strong>: ci può essere una sola capo gruppo femmina (CG).`);
        }
      }
    }
  }

  // 3. Unità vuote (informativo, eccetto Co.Ca.)
  for (const [unitId, unitConfig] of Object.entries(UNITS)) {
    if (unitId === 'coca') continue;
    const assignments = assegnazioni[unitId] || [];
    if (assignments.length === 0) {
      warnings.push(`ℹ <strong>${unitConfig.name}</strong>: nessun capo assegnato.`);
    }
  }

  return warnings;
}
