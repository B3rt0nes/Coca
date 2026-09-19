import { getYearLabel, UNITS } from './board.js';

export async function loadConsensusView(container, capi, proposals) {
  // 1. Header with Projector Mode button
  container.innerHTML = `
    <div class="consensus-header">
      <h2>Visione d'Insieme (Consensus)</h2>
      <button class="btn-projector" id="btn-toggle-projector">
        📽️ Modalità Proiettore
      </button>
    </div>
    <div id="consensus-content"></div>
  `;

  // Projector Toggle Logic
  document.getElementById('btn-toggle-projector').addEventListener('click', () => {
    const isProjector = document.body.classList.toggle('projector-mode');
    const btn = document.getElementById('btn-toggle-projector');
    if (isProjector) {
      btn.innerHTML = '❌ Esci da Proiettore';
    } else {
      btn.innerHTML = '📽️ Modalità Proiettore';
    }
  });

  const content = document.getElementById('consensus-content');

  // Filter out dummy capi
  const realCapi = capi.filter(c => !c.isDummy);
  
  // Sort realCapi alphabetically by name for the rows
  realCapi.sort((a, b) => a.nome.localeCompare(b.nome));

  if (!proposals || proposals.length === 0) {
    content.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Nessuna proposta salvata.</div>';
    return;
  }

  // Find max years across all proposals
  let maxYears = 1;
  proposals.forEach(p => {
    if (p.assegnazioni && Array.isArray(p.assegnazioni)) {
      if (p.assegnazioni.length > maxYears) maxYears = p.assegnazioni.length;
    }
  });

  const unitIds = Object.keys(UNITS);
  
  // 2. Loop through each year
  for (let y = 0; y < maxYears; y++) {
    // A. Heatmap Data Structure
    const capoMap = {}; // capoId -> { unitId: count, 'non-assegnato': count }
    realCapi.forEach(c => {
      capoMap[c.id] = { 'non-assegnato': 0 };
      unitIds.forEach(u => capoMap[c.id][u] = 0);
    });

    // B. Formations Data Structure
    const formations = {}; // unitId -> { "Formation String": count }
    unitIds.forEach(u => formations[u] = {});

    let maxHeatCount = 0;
    let validProposalsForYear = 0;

    // C. Aggregate Data from Proposals
    proposals.forEach(p => {
      if (!p.assegnazioni) return;
      const assignArray = Array.isArray(p.assegnazioni) ? p.assegnazioni : [{ units: p.assegnazioni }];
      
      // If this proposal doesn't have data for year 'y', skip
      if (y >= assignArray.length) return;
      
      validProposalsForYear++;
      const unitsData = assignArray[y].units || {};

      // Track which capi are assigned anywhere in this year
      const assignedCapiInProposal = new Set();

      // Process assignments for Heatmap and Formations
      unitIds.forEach(unitId => {
        const assignments = unitsData[unitId] || [];
        
        // --- For Heatmap ---
        assignments.forEach(a => {
          if (!a.capoId) return;
          assignedCapiInProposal.add(a.capoId);
          if (capoMap[a.capoId]) {
            capoMap[a.capoId][unitId]++;
            if (capoMap[a.capoId][unitId] > maxHeatCount) {
              maxHeatCount = capoMap[a.capoId][unitId];
            }
          }
        });

        // --- For Formations ---
        let formationString = 'Vuota';
        if (assignments.length > 0) {
          const members = assignments.map(a => {
            const capo = capi.find(c => c.id === a.capoId);
            const name = capo ? `${capo.nome} ${capo.cognome}`.trim() : 'Sconosciuto';
            const role = a.ruolo || '';
            return `${name} ${role ? `(${role})` : ''}`.trim();
          });
          // Sort alphabetically so permutations match
          members.sort();
          formationString = members.join(', ');
        }
        
        formations[unitId][formationString] = (formations[unitId][formationString] || 0) + 1;
      });

      // Track unassigned for Heatmap
      realCapi.forEach(c => {
        if (!assignedCapiInProposal.has(c.id)) {
          capoMap[c.id]['non-assegnato']++;
          if (capoMap[c.id]['non-assegnato'] > maxHeatCount) {
            maxHeatCount = capoMap[c.id]['non-assegnato'];
          }
        }
      });
    });

    if (validProposalsForYear === 0) continue;

    // Build DOM for this Year
    const yearBlock = document.createElement('div');
    yearBlock.className = 'consensus-year-block';
    
    // Year Title
    const yearTitle = document.createElement('div');
    yearTitle.className = 'consensus-year-title';
    yearTitle.textContent = `📅 ${getYearLabel(y)} (${validProposalsForYear} proposte)`;
    yearBlock.appendChild(yearTitle);

    // --- Section 1: Heatmap ---
    const heatmapContainer = document.createElement('div');
    heatmapContainer.className = 'heatmap-container';
    
    // Calculate columns: Capo + each unit + Unassigned
    const totalCols = 1 + unitIds.length + 1;
    const heatmapGrid = document.createElement('div');
    heatmapGrid.className = 'heatmap-grid';
    heatmapGrid.style.gridTemplateColumns = `220px repeat(${unitIds.length + 1}, minmax(100px, 1fr))`;

    // Headers
    heatmapGrid.innerHTML += `<div class="heatmap-cell-header heatmap-cell-name">Capo</div>`;
    unitIds.forEach(u => {
      heatmapGrid.innerHTML += `<div class="heatmap-cell-header">${UNITS[u].name}</div>`;
    });
    heatmapGrid.innerHTML += `<div class="heatmap-cell-header">Non Assegnato</div>`;

    // Rows
    const getHeatClass = (count, max) => {
      if (count === 0) return 'heat-0';
      if (count === max && max > 0) return 'heat-max';
      const step = Math.ceil((count / max) * 5); // 1 to 5
      return `heat-${step}`;
    };

    realCapi.forEach(capo => {
      heatmapGrid.innerHTML += `<div class="heatmap-cell-name">${capo.nome} ${capo.cognome}</div>`;
      
      unitIds.forEach(u => {
        const count = capoMap[capo.id][u];
        const heatClass = getHeatClass(count, maxHeatCount);
        heatmapGrid.innerHTML += `<div class="heatmap-cell ${heatClass}">${count > 0 ? count : ''}</div>`;
      });
      
      const unassignedCount = capoMap[capo.id]['non-assegnato'];
      const unassignedClass = getHeatClass(unassignedCount, maxHeatCount);
      heatmapGrid.innerHTML += `<div class="heatmap-cell ${unassignedClass}">${unassignedCount > 0 ? unassignedCount : ''}</div>`;
    });

    heatmapContainer.appendChild(heatmapGrid);
    yearBlock.appendChild(heatmapContainer);

    // --- Section 2: Formations (Unit Details) ---
    const formationsGrid = document.createElement('div');
    formationsGrid.className = 'formations-grid';

    unitIds.forEach(u => {
      const card = document.createElement('div');
      card.className = 'formation-card';
      
      card.innerHTML = `<div class="formation-card__title">${UNITS[u].name}</div>`;
      
      // Sort formations by count desc
      const sortedFormations = Object.entries(formations[u])
        .sort((a, b) => b[1] - a[1]); // [1] is count

      if (sortedFormations.length === 0) {
        card.innerHTML += `<div style="color: #666; font-style: italic;">Nessun dato</div>`;
      } else {
        // Show top 3 or all if few
        sortedFormations.slice(0, 4).forEach(([formationStr, count], idx) => {
          card.innerHTML += `
            <div class="formation-item">
              <div class="formation-item__votes">${count} preferenz${count === 1 ? 'a' : 'e'}</div>
              <div class="formation-item__list">${formationStr}</div>
            </div>
          `;
        });
      }

      formationsGrid.appendChild(card);
    });

    yearBlock.appendChild(formationsGrid);
    content.appendChild(yearBlock);
  }
}
