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
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--ink-muted);padding:20px;">${q ? 'Sin resultados para "' + escHTML(q) + '"' : 'Sin marcadores aún'}</td></tr>`;
  } else {
  tbody.innerHTML = slice.map(m => `
      <tr>
        <td class="admin-name">
          ${m.photo ? `<img src="${escHTML(m.photo)}" alt="" data-action="photo-zoom" data-src="${escHTML(m.photo)}" data-caption="${escHTML(m.name)}">` : ''}
          ${escHTML(m.name)}
        </td>
        <td>${escHTML(m.province)}</td>
        <td><span class="mc-pill" data-fam="${catFam(m.cat)}">${escHTML(m.cat)}</span></td>
        <td style="min-width:200px;">
          <div class="input-group input-group-sm input-group-cyl">
            <input type="text" class="form-control form-control-cyl" placeholder="URL de foto..." value="${escHTML(m.photo||'')}"
              id="photoInput_${escHTML(m._id)}" aria-label="URL de foto de ${escHTML(m.name)}" />
            <button type="button" class="pw-toggle" data-action="admin-photo" data-id="${escHTML(m._id)}" title="Guardar foto" aria-label="Guardar foto">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
            </button>
          </div>
        </td>
        <td>
          <div class="d-flex gap-1 align-items-center">
            <button type="button" data-action="admin-edit" data-id="${escHTML(m._id)}" class="admin-icon-btn" title="Editar" aria-label="Editar ${escHTML(m.name)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
            </button>
            <button type="button" data-action="admin-place" data-name="${escHTML(m.name)}" class="admin-icon-btn" title="Ver ficha" aria-label="Ver ficha de ${escHTML(m.name)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button type="button" data-action="admin-delete" data-id="${escHTML(m._id)}" class="admin-icon-btn admin-icon-btn--danger" title="Eliminar" aria-label="Eliminar ${escHTML(m.name)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
            </button>
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
          <td>${escHTML(u.name)}</td>
          <td>${escHTML(u.email)}</td>
          <td><span class="tag ${u.role==='admin'?'tag-castle':'tag-nature'}">${escHTML(u.role)}</span></td>
          <td>${new Date(u.date || u.createdAt).toLocaleDateString('es-ES')}</td>
        </tr>
      `).join('');
    })
    .catch(err => {
      const ubody = document.getElementById('usersBody');
      if (ubody) ubody.innerHTML =
        `<tr><td colspan="4" style="color:var(--ink-muted);text-align:center;">${escHTML(err.message)}</td></tr>`;
    });

  // Stats
  const stats = {};
  appState.markers.forEach(m => { stats[m.province] = (stats[m.province] || 0) + 1; });
  document.getElementById('statsContainer').innerHTML = Object.entries(stats)
    .sort((a,b) => b[1]-a[1])
    .map(([prov, count]) => `
      <div class="admin-stat">
        <span class="admin-stat-name">${escHTML(prov)}</span>
        <div><div class="admin-stat-bar" style="width:${(count/Math.max(...Object.values(stats)))*100}%;"></div></div>
        <span class="admin-stat-n">${count}</span>
      </div>
    `).join('');

  // Ratings panel
  const allRatings = Object.entries(appState.ratings);
  const totalReviews = allRatings.reduce((s,[,rs])=>s+rs.length,0);
  document.getElementById('ratingsTotalCount').textContent = totalReviews;
  const ratingsEl = document.getElementById('adminRatingsContainer');
  if (!totalReviews) {
    ratingsEl.innerHTML = '<p style="color:var(--ink-muted);font-size:0.88rem;">Sin valoraciones aún.</p>';
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
              <td class="admin-name">${escHTML(name)}</td>
              <td>
                <span class="place-stars">${[1,2,3,4,5].map(i=>`<span class="${i<=Math.round(avg)?'is-on':''}">★</span>`).join('')}</span>
                <span style="font-family:var(--font-mono);font-weight:600;margin-left:6px;">${avg.toFixed(1)}</span>
              </td>
              <td>${rs.length}</td>
              <td style="color:var(--steel);font-size:0.88rem;">${escHTML(rs[rs.length-1].date)}, ${escHTML(rs[rs.length-1].userName)}</td>
              <td><button type="button" class="admin-link-btn" data-action="admin-place" data-name="${escHTML(name)}">Ver ficha</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
  }
}

registerActions({
  'admin-photo':  d => { setMarkerPhoto(d.id, document.getElementById('photoInput_' + d.id).value); refreshAdminData(); },
  'admin-edit':   d => openMarkerEditModal(d.id),
  'admin-place':  d => { openReviewsDrawer(d.name); hideAdmin(); },
  'admin-delete': d => deleteMarker(d.id),
});

function deleteMarker(id) {
  appState.markers = appState.markers.filter(m => m._id !== id);
  fetch(`/api/markers/${id}`, { method: 'DELETE', headers: authHeaders() }).catch(() => {});
  if (appState.selectedProvince) loadProvinceMarkers(appState.selectedProvince);
  refreshAdminData();
  showToast('Marcador eliminado');
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

    document.getElementById('csvStatus').innerHTML = `<span style="color:var(--ok);">${added} marcadores importados correctamente</span>`;
    if (appState.selectedProvince) loadProvinceMarkers(appState.selectedProvince);
    refreshAdminData();
    showToast(`${added} marcadores importados`);
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
