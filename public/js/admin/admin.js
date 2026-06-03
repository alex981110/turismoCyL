function showAdmin() {
  if (!appState.currentUser || appState.currentUser.role !== 'admin') return;
  document.getElementById('adminPanel').classList.add('active');
  refreshAdminData();
}
function hideAdmin() {
  document.getElementById('adminPanel').classList.remove('active');
  history.replaceState({ path: '/' }, '', '/');
  document.querySelectorAll('.nav-link-cyl').forEach(a => a.classList.remove('nav-active'));
}
function renderAdminMarkers() {
  const q = (document.getElementById('adminMarkerSearch')?.value || '').trim().toLowerCase();
  const filtered = q
    ? appState.markers.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.province.toLowerCase().includes(q) ||
        (m.cat || '').toLowerCase().includes(q))
    : appState.markers;

  const slice = filtered.slice(0, adminMarkersLimit);
  const remaining = filtered.length - slice.length;

  document.getElementById('markerShownCount').textContent = slice.length + (q ? ` de ${filtered.length} filtrados` : '');

  const tbody = document.getElementById('adminMarkersBody');
  if (!slice.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--parch2);padding:20px;font-style:italic;">${q ? 'Sin resultados para "' + q + '"' : 'Sin marcadores aún'}</td></tr>`;
  } else {
  tbody.innerHTML = slice.map(m => `
      <tr>
        <td style="font-family:'Playfair Display',serif;">
          ${m.photo ? `<img src="${m.photo}" style="width:32px;height:32px;object-fit:cover;vertical-align:middle;margin-right:6px;border:1px solid rgba(42,33,24,0.20);cursor:zoom-in;" onclick="openPhotoModal('${m.photo.replace(/'/g,"\\'")}','${m.name.replace(/'/g,"\\'")}')">` : ''}
          ${m.name}
        </td>
        <td>${m.province}</td>
        <td><span class="badge badge-cyl badge-outline-gold">${m.cat}</span></td>
        <td style="min-width:200px;">
          <div class="input-group input-group-sm input-group-cyl">
            <input type="text" class="form-control form-control-cyl" placeholder="URL de foto..." value="${m.photo||''}"
              id="photoInput_${m._id}" style="font-size:0.82rem;" />
            <button class="btn btn-sm" onclick="setMarkerPhoto('${m._id}',document.getElementById('photoInput_${m._id}').value);refreshAdminData();"
              style="background:rgba(184,92,56,0.08);border:1px solid rgba(42,33,24,0.20);color:var(--gold);white-space:nowrap;">
              🖼️
            </button>
          </div>
        </td>
        <td>
          <div class="d-flex gap-1 align-items-center">
            <button onclick="openMarkerEditModal('${m._id}')"
              class="btn btn-sm"
              style="background:none;border:1px solid rgba(42,33,24,0.20);color:var(--gold);font-size:0.72rem;padding:3px 8px;font-family:'Playfair Display',serif;" title="Editar">✏️</button>
            <button onclick="openReviewsDrawer('${m.name.replace(/'/g,"\\'")}');hideAdmin();"
              class="btn btn-sm"
              style="background:none;border:1px solid rgba(42,33,24,0.20);color:var(--gold);font-size:0.72rem;padding:3px 8px;font-family:'Playfair Display',serif;">★</button>
            <button onclick="deleteMarker('${m._id}')" class="btn btn-sm"
              style="background:none;border:none;color:#d44;font-size:0.85rem;" title="Eliminar">✕</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Show/hide "Ver más" button
  const moreEl = document.getElementById('adminMarkersMore');
  const remEl = document.getElementById('adminMarkersRemaining');
  if (remaining > 0) {
    moreEl.style.display = 'block';
    remEl.textContent = `(${remaining} restantes)`;
  } else {
    moreEl.style.display = 'none';
  }
}

function refreshAdminData() {
  // Markers table — delegate to renderAdminMarkers
  document.getElementById('markerTotalCount').textContent = appState.markers.length;
  adminMarkersLimit = 20;
  const searchEl = document.getElementById('adminMarkerSearch');
  if (searchEl) searchEl.value = '';
  renderAdminMarkers();

  // Users table — cargados desde MongoDB
  // Users table
  fetch('/api/auth/users', { headers: authHeaders() })
    .then(async r => {
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || `Error ${r.status}`);
      }
      return r.json();
    })
    .then(users => {
      const ubody = document.getElementById('usersBody');
      const countEl = document.getElementById('userTotalCount');
      if (countEl) countEl.textContent = users.length;
      if (ubody) ubody.innerHTML = users.map(u => `
        <tr>
          <td>${u.name}</td>
          <td>${u.email}</td>
          <td><span class="tag ${u.role==='admin'?'tag-castle':'tag-nature'}">${u.role}</span></td>
          <td>${new Date(u.date || u.createdAt).toLocaleDateString('es-ES')}</td>
        </tr>
      `).join('');
    })
    .catch(err => {
      const ubody = document.getElementById('usersBody');
      if (ubody) ubody.innerHTML =
        `<tr><td colspan="4" style="color:var(--parch2);text-align:center;">${err.message}</td></tr>`;
    });

  // Stats
  const stats = {};
  appState.markers.forEach(m => { stats[m.province] = (stats[m.province] || 0) + 1; });
  document.getElementById('statsContainer').innerHTML = Object.entries(stats)
    .sort((a,b) => b[1]-a[1])
    .map(([prov, count]) => `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
        <span style="min-width:100px;font-size:0.85rem;">${prov}</span>
        <div style="flex:1;background:rgba(184,92,56,0.08);height:8px;position:relative;">
          <div style="background:var(--gold);height:100%;width:${(count/Math.max(...Object.values(stats)))*100}%;transition:width 0.5s;"></div>
        </div>
        <span style="color:var(--gold);font-family:'Playfair Display',serif;font-weight:700;">${count}</span>
      </div>
    `).join('');

  // Ratings panel
  const allRatings = Object.entries(appState.ratings);
  const totalReviews = allRatings.reduce((s,[,rs])=>s+rs.length,0);
  document.getElementById('ratingsTotalCount').textContent = totalReviews;
  const ratingsEl = document.getElementById('adminRatingsContainer');
  if (!totalReviews) {
    ratingsEl.innerHTML = '<p style="color:var(--parch2);font-style:italic;font-size:0.88rem;">Sin valoraciones aún.</p>';
  } else {
    // Sort places by avg rating desc
    const ranked = allRatings
      .filter(([,rs])=>rs.length>0)
      .map(([name,rs])=>({ name, rs, avg: rs.reduce((s,r)=>s+r.stars,0)/rs.length }))
      .sort((a,b)=>b.avg-a.avg);
    ratingsEl.innerHTML = `
      <table class="admin-table">
        <thead><tr><th>Lugar</th><th>Puntuación</th><th>Reseñas</th><th>Última valoración</th><th></th></tr></thead>
        <tbody>
          ${ranked.map(({name,rs,avg})=>`
            <tr>
              <td style="font-family:'Playfair Display',serif;">${name}</td>
              <td>
                <span style="color:var(--gold);letter-spacing:1px;">${[1,2,3,4,5].map(i=>`<span style="color:${i<=Math.round(avg)?'var(--gold)':'rgba(42,33,24,0.13)'};font-size:0.85rem;">★</span>`).join('')}</span>
                <span style="color:var(--gold);font-weight:700;margin-left:4px;">${avg.toFixed(1)}</span>
              </td>
              <td>${rs.length}</td>
              <td style="color:var(--parch2);font-size:0.82rem;">${rs[rs.length-1].date} — ${rs[rs.length-1].userName}</td>
              <td><button onclick="openReviewsDrawer('${name.replace(/'/g,"\\'")}');hideAdmin();" style="background:none;border:1px solid rgba(42,33,24,0.20);color:var(--gold);cursor:pointer;font-size:0.75rem;padding:3px 10px;font-family:'Playfair Display',serif;transition:all 0.2s;" onmouseover="this.style.background='rgba(184,92,56,0.08)'" onmouseout="this.style.background='none'">Ver →</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
  }
}

function deleteMarker(id) {
  appState.markers = appState.markers.filter(m => m._id !== id);
  fetch(`/api/markers/${id}`, { method: 'DELETE', headers: authHeaders() }).catch(() => {});
  if (appState.selectedProvince) loadProvinceMarkers(appState.selectedProvince);
  refreshAdminData();
  showToast('📍 Marcador eliminado');
}

// ============================================================
// CSV UPLOAD
// ============================================================
function handleCSVUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    let added = 0;
    lines.slice(1).forEach(line => {
      // Handle quoted fields
      const parts = [];
      let current = '';
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) { parts.push(current.trim()); current = ''; }
        else current += char;
      }
      parts.push(current.trim());

      const obj = {};
      headers.forEach((h, i) => obj[h] = parts[i] || '');

      const lat = parseFloat(obj.lat || obj.latitud || obj.latitude);
      const lng = parseFloat(obj.lng || obj.longitud || obj.longitude);
      const name = obj.nombre || obj.name || obj.title || '';
      const province = obj.provincia || obj.province || '';
      const cat = obj.cat || obj.categoria || obj.category || 'monumento';
      const desc = obj.desc || obj.descripcion || obj.description || '';

      if (!isNaN(lat) && !isNaN(lng) && name && province) {
        const photo = obj.foto || obj.photo || obj.imagen || obj.image || obj.img || '';
        appState.markers.push({ id: Date.now() + added, name, lat, lng, province, cat, desc, photo });
        added++;
      }
    });

    document.getElementById('csvStatus').innerHTML = `<span style="color:#4a9e2a;">✅ ${added} marcadores importados correctamente</span>`;
    if (appState.selectedProvince) loadProvinceMarkers(appState.selectedProvince);
    refreshAdminData();
    showToast(`✅ ${added} marcadores importados`);
    event.target.value = '';
  };
  reader.readAsText(file);
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg) {
  document.getElementById('toastMsg').textContent = msg;
  const toastEl = document.getElementById('toast');
  const bsToast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3000 });
  bsToast.show();
}

// ============================================================
// INIT — markers are loaded async, see loadMarkers() below
// ============================================================

// Restaurar sesión guardada — verifica token con el servidor
