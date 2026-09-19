// ============================================
// CO.CA. — Validation Rules
// Validates proposals before saving
// ============================================

import { UNITS } from './board.js';

/**
 * Validate a proposal's assignments against scout rules.
 *
 * @param {Object} assegnazioni - { unitId: [{ capoId, ruolo }] }
 * @param {Array} capi - Full capi list for reference
 * @param {Object} baseYearUnits - { unitId: [{ capoId, ruolo }] }
 * @returns {Array<string>} Array of warning messages (empty if valid)
 */
export function validateProposal(assegnazioni, capi, baseYearUnits = null) {
  const warnings = [];

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

  // 2. Vincoli Formativi & Strutturali
  for (const [unitId, unitConfig] of Object.entries(UNITS)) {
    const assignments = assegnazioni[unitId] || [];
    if (assignments.length === 0) continue;

    const unitName = unitConfig.name;
    const type = unitConfig.type || (unitConfig.branch === 'LC' && unitName.toLowerCase().includes('branco') ? 'branco' : 
                                     unitConfig.branch === 'LC' && unitName.toLowerCase().includes('cerchio') ? 'cerchio' : 
                                     unitConfig.branch === 'EG' ? 'reparto' : 
                                     unitConfig.mainRoles.includes('MdN') ? 'noviziato' : 
                                     unitConfig.branch === 'RS' ? 'clan' : 
                                     'coca');

    // Mappa dei capi in questa unità
    const unitCapi = assignments.map(a => capiMap[a.capoId]).filter(Boolean);

    // --- Allerta Formazione ---
    let nonFormati = 0;
    let formati = 0;
    unitCapi.forEach(c => {
      if (c.livelloFoca === 'Nulla' || c.livelloFoca === 'Tirocinio') nonFormati++;
      if (c.livelloFoca === 'CFM' || c.livelloFoca === 'CFA' || c.livelloFoca === 'WB') formati++;
    });
    if (nonFormati >= formati && unitCapi.length > 0 && type !== 'coca') {
      warnings.push(`⚠ <strong>${unitName}</strong>: Il numero di capi in formazione (${nonFormati}) è maggiore o uguale a quelli formati (${formati}).`);
    }

    // --- Vincoli di Branca & Allerta Brevetto ---
    if (type === 'branco') {
      const cbList = assignments.filter(a => a.ruolo === 'CB');
      if (cbList.length > 1) warnings.push(`⚠ <strong>${unitName}</strong>: ci deve essere un solo capo unità maschio (CB).`);
      
      const cfaWb = cbList.some(a => capiMap[a.capoId]?.livelloFoca === 'CFA' || capiMap[a.capoId]?.livelloFoca === 'WB');
      if (cbList.length > 0 && !cfaWb) {
        warnings.push(`⚠ <strong>${unitName}</strong>: Il Capo Unità (CB) non ha brevetto CFA o WB.`);
      }
    } 
    else if (type === 'cerchio') {
      const ccList = assignments.filter(a => a.ruolo === 'CC');
      if (ccList.length > 1) warnings.push(`⚠ <strong>${unitName}</strong>: ci deve essere una sola capo unità femmina (CC).`);
      
      const cfaWb = ccList.some(a => capiMap[a.capoId]?.livelloFoca === 'CFA' || capiMap[a.capoId]?.livelloFoca === 'WB');
      if (ccList.length > 0 && !cfaWb) {
        warnings.push(`⚠ <strong>${unitName}</strong>: La Capo Unità (CC) non ha brevetto CFA o WB.`);
      }
    }
    else if (type === 'reparto') {
      const crList = assignments.filter(a => a.ruolo === 'CR');
      if (crList.length > 1) warnings.push(`⚠ <strong>${unitName}</strong>: ci deve essere un solo capo unità (CR).`);
      
      const cfaWb = crList.some(a => capiMap[a.capoId]?.livelloFoca === 'CFA' || capiMap[a.capoId]?.livelloFoca === 'WB');
      if (crList.length > 0 && !cfaWb) {
        warnings.push(`⚠ <strong>${unitName}</strong>: Il Capo Unità (CR) non ha brevetto CFA o WB.`);
      }
    }
    else if (type === 'noviziato') {
      const mdnList = assignments.filter(a => a.ruolo === 'MdN');
      if (mdnList.length === 0) warnings.push(`⚠ <strong>${unitName}</strong>: serve almeno un Maestro dei Novizi (MdN).`);
    }
    else if (type === 'clan') {
      const mainList = assignments.filter(a => a.ruolo === 'CC/CF');
      if (mainList.length > 2) warnings.push(`⚠ <strong>${unitName}</strong>: troppi capi clan (CC/CF).`);
      
      const cfaWb = mainList.some(a => capiMap[a.capoId]?.livelloFoca === 'CFA' || capiMap[a.capoId]?.livelloFoca === 'WB');
      if (mainList.length > 0 && !cfaWb) {
        warnings.push(`⚠ <strong>${unitName}</strong>: Nessuno dei Capi Clan (CC/CF) ha brevetto CFA o WB.`);
      }
    }
  }

  // 3. Allerta Turnover (comparazione con baseYear)
  if (baseYearUnits) {
    // Check if any capo has been in the same branch for 4 consecutive years.
    // In our simplified model, we just warn if they are in the exact same unit.
    for (const [unitId, assignments] of Object.entries(assegnazioni)) {
      const baseAssignments = baseYearUnits[unitId] || [];
      assignments.forEach(a => {
        const capo = capiMap[a.capoId];
        if (!capo || capo.isDummy) return;
        
        const inBase = baseAssignments.find(b => b.capoId === a.capoId);
        if (inBase) {
          // Turnover Alert: Capo nello stesso ramo/unità
          warnings.push(`ℹ <strong>Turnover</strong>: ${capo.nome} ${capo.cognome} è confermato in ${UNITS[unitId]?.name}. Considerare la continuità (o rischio fossilizzazione se > 3 anni).`);
        }
      });
    }
  }

  // 4. Unità vuote (informativo, eccetto Co.Ca.)
  for (const [unitId, unitConfig] of Object.entries(UNITS)) {
    if (unitId === 'coca') continue;
    const assignments = assegnazioni[unitId] || [];
    if (assignments.length === 0) {
      warnings.push(`ℹ <strong>${unitConfig.name}</strong>: nessun capo assegnato.`);
    }
  }

  return warnings;
}
