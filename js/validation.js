// ============================================
// CO.CA. — Validation Rules
// Validates proposals before saving
// ============================================

import { UNITS } from './board.js';

/**
 * Validate a proposal's assignments against scout rules
 *
 * Rule: Every unit (except Co.Ca.) must have exactly 2 "main role" holders,
 *       one Male (M) and one Female (F).
 *
 * @param {Object} assegnazioni - { unitId: [{ capoId, ruolo, sesso }] }
 * @param {Array} capi - Full capi list for reference
 * @returns {Array<string>} Array of warning messages (empty if valid)
 */
export function validateProposal(assegnazioni, capi) {
  const warnings = [];

  // Build a lookup for capo data
  const capiMap = {};
  capi.forEach(c => { capiMap[c.id] = c; });

  for (const [unitId, unitConfig] of Object.entries(UNITS)) {
    // Skip Co.Ca. from main role validation
    if (unitId === 'coca') continue;

    const assignments = assegnazioni[unitId] || [];
    const mainRoles = unitConfig.mainRoles || [];
    const unitName = unitConfig.name;

    // Find assignments with main roles
    const mainAssignments = assignments.filter(a => mainRoles.includes(a.ruolo));

    // Check: need exactly 2 main role holders
    if (mainAssignments.length === 0) {
      warnings.push(`⚠ <strong>${unitName}</strong>: mancano entrambi i capi con ruolo principale (${mainRoles.join('/')}).`);
      continue;
    }

    if (mainAssignments.length === 1) {
      const existing = capiMap[mainAssignments[0].capoId];
      const existingSex = existing ? existing.sesso : '?';
      const missingSex = existingSex === 'M' ? 'Femmina' : 'Maschio';
      warnings.push(`⚠ <strong>${unitName}</strong>: manca il capo ${missingSex} con ruolo principale.`);
      continue;
    }

    if (mainAssignments.length > 2) {
      warnings.push(`⚠ <strong>${unitName}</strong>: ci sono ${mainAssignments.length} capi con ruolo principale (ne servono 2).`);
    }

    // Check sex distribution: need 1M + 1F among main role holders
    const sexes = mainAssignments.map(a => {
      const capo = capiMap[a.capoId];
      return capo ? capo.sesso : null;
    });

    const maleCount = sexes.filter(s => s === 'M').length;
    const femaleCount = sexes.filter(s => s === 'F').length;

    if (mainAssignments.length === 2) {
      if (maleCount === 0) {
        warnings.push(`⚠ <strong>${unitName}</strong>: manca un capo Maschio con ruolo principale.`);
      } else if (femaleCount === 0) {
        warnings.push(`⚠ <strong>${unitName}</strong>: manca un capo Femmina con ruolo principale.`);
      }
    }
  }

  // Check for empty units (optional info)
  for (const [unitId, unitConfig] of Object.entries(UNITS)) {
    if (unitId === 'coca') continue;
    const assignments = assegnazioni[unitId] || [];
    if (assignments.length === 0) {
      warnings.push(`ℹ <strong>${unitConfig.name}</strong>: nessun capo assegnato.`);
    }
  }

  return warnings;
}
