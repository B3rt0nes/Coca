import { getYearLabel, UNITS, BRANCHES } from './board.js';
import { getProposals } from './db.js';

export async function loadConsensusView(container, capi) {
  container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">Caricamento aggregazione...</div>';
  
  const proposals = await getProposals();
  
  if (proposals.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">Nessuna proposta trovata.</div>';
    return;
  }
  
  let maxYears = 1;
  proposals.forEach(p => {
    if (p.assegnazioni && Array.isArray(p.assegnazioni)) {
      if (p.assegnazioni.length > maxYears) maxYears = p.assegnazioni.length;
    }
  });

  const yearsData = [];
  for (let y = 0; y < maxYears; y++) {
    yearsData.push({
      label: getYearLabel(y),
      units: {}
    });
    for (const unitId of Object.keys(UNITS)) {
      yearsData[y].units[unitId] = {}; 
    }
  }

  proposals.forEach(p => {
    if (!p.assegnazioni) return;
    const isArray = Array.isArray(p.assegnazioni);
    const assignArray = isArray ? p.assegnazioni : [{ units: p.assegnazioni }];
    
    assignArray.forEach((yearObj, y) => {
      const units = yearObj.units || {};
      for (const [unitId, assignments] of Object.entries(units)) {
        if (!yearsData[y].units[unitId]) continue;
        
        assignments.forEach(a => {
          if (!a.capoId) return;
          if (!yearsData[y].units[unitId][a.capoId]) {
            yearsData[y].units[unitId][a.capoId] = {};
          }
          const role = a.ruolo || 'Senza ruolo';
          yearsData[y].units[unitId][a.capoId][role] = (yearsData[y].units[unitId][a.capoId][role] || 0) + 1;
        });
      }
    });
  });

  for (let y = 0; y < maxYears; y++) {
    for (const unitId of Object.keys(UNITS)) {
      const capoMap = yearsData[y].units[unitId];
      const arr = Object.entries(capoMap).map(([capoId, roleCounts]) => {
        let total = 0;
        for (const count of Object.values(roleCounts)) total += count;
        return { capoId, roleCounts, total };
      });
      // Sort by total votes desc
      arr.sort((a, b) => b.total - a.total);
      yearsData[y].units[unitId] = arr;
    }
  }

  const capiMap = {};
  capi.forEach(c => capiMap[c.id] = c);

  container.innerHTML = '';

  for (let y = 0; y < maxYears; y++) {
    const yearDiv = document.createElement('div');
    yearDiv.className = 'consensus-year';
    
    yearDiv.innerHTML = `
      <div class="consensus-year__header" style="cursor: pointer; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>📅</span>
          <span>${yearsData[y].label}</span>
        </div>
        <div class="year-header__toggle">▼</div>
      </div>
    `;

    const yearBody = document.createElement('div');
    yearBody.className = 'consensus-year__body';

    // Year toggle logic
    const yearHeader = yearDiv.querySelector('.consensus-year__header');
    yearHeader.addEventListener('click', () => {
      const isHidden = yearBody.style.display === 'none';
      yearBody.style.display = isHidden ? 'block' : 'none';
      yearHeader.querySelector('.year-header__toggle').textContent = isHidden ? '▼' : '▶';
    });

    BRANCHES.forEach(branch => {
      let hasVotes = false;
      branch.units.forEach(unitId => {
        if (yearsData[y].units[unitId] && yearsData[y].units[unitId].length > 0) hasVotes = true;
      });

      // Skip rendering empty branches
      if (!hasVotes) return;

      const branchSec = document.createElement('div');
      branchSec.className = `branch-section ${branch.cssClass}`;
      
      branchSec.innerHTML = `
        <div class="branch-header" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span class="branch-header__icon">${branch.icon}</span>
            ${branch.name}
          </div>
          <div class="branch-toggle">▼</div>
        </div>
        <div class="branch-units" style="display: flex; flex-direction: column;"></div>
      `;

      const branchUnits = branchSec.querySelector('.branch-units');
      const branchHeader = branchSec.querySelector('.branch-header');
      
      // Branch toggle logic
      branchHeader.addEventListener('click', () => {
        const isHidden = branchUnits.style.display === 'none';
        branchUnits.style.display = isHidden ? 'flex' : 'none';
        branchHeader.querySelector('.branch-toggle').textContent = isHidden ? '▼' : '▶';
      });

      branch.units.forEach(unitId => {
        const unit = UNITS[unitId];
        const assignments = yearsData[y].units[unitId];
        
        // Skip empty units
        if (!assignments || assignments.length === 0) return;

        const rowDiv = document.createElement('div');
        // Add drop-zone to reuse styles (border color) and logic
        rowDiv.className = 'consensus-unit-row drop-zone';

        rowDiv.innerHTML = `
          <div class="consensus-unit-row__header drop-zone__header" style="cursor: pointer; margin-bottom: 0;">
            <div>
              ${unit.icon} ${unit.name} <span style="font-weight: 400; font-size: 0.85em; color: var(--text-muted); margin-left: 8px;">(${assignments.length} proposti)</span>
            </div>
            <div class="unit-toggle">▼</div>
          </div>
          <div class="consensus-unit-row__content drop-zone__cards">
            <div class="consensus-main-roles">
              <div class="consensus-section-title">👑 Capi Unità</div>
              <div class="consensus-cards-grid" id="main-roles-${y}-${unitId}"></div>
            </div>
            <div class="consensus-other-roles">
              <div class="consensus-section-title">👥 Altri Incarichi (Aiuti, AE, AS...)</div>
              <div class="consensus-cards-flex" id="other-roles-${y}-${unitId}"></div>
            </div>
          </div>
        `;
        
        // Unit toggle logic
        const unitHeader = rowDiv.querySelector('.consensus-unit-row__header');
        unitHeader.addEventListener('click', () => {
          rowDiv.classList.toggle('drop-zone--collapsed');
          const isCollapsed = rowDiv.classList.contains('drop-zone--collapsed');
          unitHeader.querySelector('.unit-toggle').textContent = isCollapsed ? '▶' : '▼';
        });
        
        branchUnits.appendChild(rowDiv);
      });

      yearBody.appendChild(branchSec);
    });

    yearDiv.appendChild(yearBody);
    container.appendChild(yearDiv);

    // Now populate the cards
    BRANCHES.forEach(branch => {
      branch.units.forEach(unitId => {
        const unit = UNITS[unitId];
        const assignments = yearsData[y].units[unitId];
        if (!assignments || assignments.length === 0) return;

        const mainContainer = document.getElementById(`main-roles-${y}-${unitId}`);
        const otherContainer = document.getElementById(`other-roles-${y}-${unitId}`);
        
        const mainRolesList = unit.mainRoles || [];

        assignments.forEach(a => {
          const capo = capiMap[a.capoId];
          if (!capo) return;

          let topRole = '';
          let maxRoleVotes = -1;
          for (const [role, count] of Object.entries(a.roleCounts)) {
            if (count > maxRoleVotes) {
              maxRoleVotes = count;
              topRole = role;
            }
          }
          
          const isMainRole = mainRolesList.includes(topRole);

          const card = createConsensusCard(capo, a.roleCounts, a.total);
          
          if (isMainRole) {
            mainContainer.appendChild(card);
          } else {
            otherContainer.appendChild(card);
          }
        });
        
        if (mainContainer.children.length === 0) {
          mainContainer.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">Nessuno proposto come Capo Unità</div>';
        }
        if (otherContainer.children.length === 0) {
          otherContainer.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">Nessun aiuto o altro incarico proposto, tutto solo soletto 😢</div>';
        }
      });
    });
  }
}

function createConsensusCard(capo, roleCounts, total) {
  const card = document.createElement('div');
  card.className = 'card card--consensus';
  card.style.cursor = 'default';
  
  const breakdown = Object.entries(roleCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([role, count]) => `<b>${role}</b>: ${count}`)
    .join('<br>');

  let avatarHTML = '';
  if (capo.fotoUrl) {
    avatarHTML = `<img src="${capo.fotoUrl}" class="card__photo" alt="Foto">`;
  } else {
    const sexClass = capo.sesso === 'M' ? 'card__sex-icon--m' : 'card__sex-icon--f';
    const sexSymbol = capo.sesso === 'M' ? '♂' : '♀';
    avatarHTML = `<span class="card__sex-icon ${sexClass}">${sexSymbol}</span>`;
  }

  const displayNameHTML = capo.soprannome
    ? `<span style="font-weight: 700;">${capo.soprannome}</span>`
    : `<span style="font-weight: 700;">${capo.nome}${capo.hasDuplicateName ? ` ${capo.cognome}` : ''}</span>`;

  card.innerHTML = `
    <div class="card__header" style="align-items: flex-start; gap: 8px;">
      ${avatarHTML}
      <div class="card__name" style="line-height: 1.2; flex: 1;">${displayNameHTML}</div>
      <span class="badge badge--consensus" style="background: var(--primary-main); color: white; padding: 2px 6px; font-size: 0.85rem; border-radius: 12px; margin-left: auto;">${total}</span>
    </div>
    <div class="card__roles-breakdown" style="font-size: 0.8rem; margin-top: 8px; color: var(--text-muted); background: rgba(0,0,0,0.03); padding: 6px; border-radius: 4px; border-left: 3px solid var(--primary-main);">
      ${breakdown}
    </div>
  `;
  
  return card;
}
