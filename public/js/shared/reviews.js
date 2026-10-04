// ============================================================
// FICHA DEL LUGAR (drawer lateral)
// ============================================================
// Escapa texto de usuarios y de Google antes de insertarlo como HTML
function escHTML(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
// Para pasar un texto como argumento '...' dentro de un onclick
function jsArg(s) { return escHTML(String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")); }

// Si la foto de cabecera falla, usa otra de Google si la hay y si no el icono de la categoría
function placeHeroError(img) {
  const hero = img.parentElement;
  const failed = img.getAttribute('src');
  const next = ((_placeCurrent && _placeCurrent.gphotos) || []).find(u => u !== failed && !hero.dataset.tried.includes(u));
  hero.dataset.tried += failed + '|';
  if (next) { img.src = next; return; }
  hero.classList.remove('has-photo');
  hero.innerHTML = `<div class="place-hero-fallback">${catIcon[hero.dataset.cat] || catIcon.default}</div>`;
}

const _placeIco = {
  route: '<svg class="cat-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>',
  star:  '<svg class="cat-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>',
  web:   '<svg class="cat-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  mail:  '<svg class="cat-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
  clock: '<svg class="cat-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>'
};

function _stars(n) {
  const full = Math.round(n);
  return [1, 2, 3, 4, 5].map(i => `<span class="${i <= full ? 'is-on' : ''}">★</span>`).join('');
}

let _placeReq = 0;          // descarta respuestas de Google de una ficha anterior
let _placeLastFocus = null; // foco a devolver al cerrar
let _placeCurrent = null;   // { name, province, mk }

async function openReviewsDrawer(name, province) {
  const mk = appState.markers.find(m => m.name === name && m.province === province)
          || appState.markers.find(m => m.name === name) || null;
  province = province || (mk && mk.province) || '';
  _placeCurrent = { name, province, mk };
  const req = ++_placeReq;

  // Cabecera: foto propia o, mientras tanto, el icono de la categoría
  const hero = document.getElementById('placeHero');
  const cat = mk ? mk.cat : null;
  hero.dataset.cat = cat || '';
  hero.dataset.tried = '';
  hero.innerHTML = mk && mk.photo
    ? `<img src="${escHTML(mk.photo)}" alt="${escHTML(name)}" onerror="placeHeroError(this)">`
    : `<div class="place-hero-fallback">${catIcon[cat] || catIcon.default}</div>`;
  hero.classList.toggle('has-photo', !!(mk && mk.photo));

  document.getElementById('placeMeta').innerHTML =
    (cat ? `<span class="place-chip">${catIcon[cat] || catIcon.default} ${escHTML(catLabel[cat] || cat)}</span>` : '') +
    (province ? `<span class="place-province">${escHTML(province)}</span>` : '');
  document.getElementById('placeTitle').textContent = name;

  // La descripción del dataset a veces solo repite el nombre o la provincia: entonces no se muestra
  const rawDesc = (mk && mk.desc || '').trim();
  const desc = rawDesc && ![name, province].some(t => t && t.trim().toLowerCase() === rawDesc.toLowerCase()) ? rawDesc : '';
  const descEl = document.getElementById('placeDesc');
  descEl.textContent = desc;
  descEl.hidden = !desc;

  renderPlaceActions();

  const links = [];
  if (mk && mk.url) {
    let host = mk.url;
    try { host = new URL(mk.url).hostname.replace(/^www\./, ''); } catch (e) {}
    links.push(`<li><a href="${escHTML(mk.url)}" target="_blank" rel="noopener">${_placeIco.web}<span>${escHTML(host)}</span></a></li>`);
  }
  if (mk && mk.email) {
    links.push(`<li><a href="mailto:${escHTML(mk.email)}">${_placeIco.mail}<span>${escHTML(mk.email)}</span></a></li>`);
  }
  const linksEl = document.getElementById('placeLinks');
  linksEl.innerHTML = links.join('');
  linksEl.hidden = !links.length;

  renderPlaceRatings();

  const google = document.getElementById('placeGoogle');
  google.hidden = true;
  google.innerHTML = '';

  _placeLastFocus = document.activeElement;
  document.getElementById('drawerOverlay').classList.add('active');
  const drawer = document.getElementById('reviewsDrawer');
  drawer.classList.add('open');
  drawer.querySelector('.place-scroll').scrollTop = 0;
  drawer.querySelector('.place-close').focus({ preventScroll: true });

  // Datos de Google (fotos, horario, puntuación, reseñas). Si no hay nada, la sección no aparece.
  try {
    const res = await fetch(`/api/photos/details?name=${encodeURIComponent(name)}&province=${encodeURIComponent(province)}`);
    if (!res.ok) return;
    const data = await res.json();
    if (req !== _placeReq) return;
    renderPlaceGoogle(data, name);
  } catch (e) { /* sin datos de Google: la ficha sigue completa sin esa sección */ }
}

function renderPlaceActions() {
  const { name, province, mk } = _placeCurrent;
  const fav = mk && mk._id ? isFavorite(mk._id) : false;
  const route = mk ? `https://www.google.com/maps/dir/?api=1&destination=${mk.lat},${mk.lng}` : '';
  document.getElementById('placeActions').innerHTML = `
    ${route ? `<a class="place-btn place-btn--primary" href="${route}" target="_blank" rel="noopener">${_placeIco.route}Cómo llegar</a>` : ''}
    ${mk && mk._id ? `<button type="button" class="place-btn${fav ? ' is-on' : ''}" aria-pressed="${fav}" onclick="placeToggleFavorite()">${favIcon(fav)}${fav ? 'Guardado' : 'Guardar'}</button>` : ''}
    <button type="button" class="place-btn" onclick="closeReviewsDrawer();openRatingModal('${jsArg(name)}','${jsArg(province)}')">${_placeIco.star}Valorar</button>`;
}

async function placeToggleFavorite() {
  const { name, mk } = _placeCurrent || {};
  if (!mk || !mk._id) return;
  if (!appState.currentUser) closeReviewsDrawer(); // toggleFavorite abrirá el login
  await Promise.resolve(toggleFavorite(mk._id, name));
  renderPlaceActions();
}

function renderPlaceRatings() {
  const { name, province } = _placeCurrent;
  const rs = getRatings(name);
  const el = document.getElementById('placeRatings');
  if (!rs.length) {
    el.innerHTML = `<p class="place-empty">Todavía nadie lo ha valorado.
      <button type="button" class="place-link-btn" onclick="closeReviewsDrawer();openRatingModal('${jsArg(name)}','${jsArg(province)}')">Sé el primero</button></p>`;
    return;
  }
  const avg = getAvgRating(name), total = rs.length;
  const bars = [5, 4, 3, 2, 1].map(n => {
    const c = rs.filter(r => r.stars === n).length;
    return `<div class="place-bar"><span>${n}</span><div class="place-bar-track"><div style="width:${((c / total) * 100).toFixed(0)}%"></div></div><span>${c}</span></div>`;
  }).join('');
  el.innerHTML = `
    <div class="place-score">
      <div><div class="place-score-num">${avg.toFixed(1)}</div><div class="place-stars">${_stars(avg)}</div>
        <div class="place-score-count">${total} valoraci${total !== 1 ? 'ones' : 'ón'}</div></div>
      <div class="place-bars">${bars}</div>
    </div>
    ${[...rs].reverse().map(r => `
      <article class="place-review">
        <header><strong>${escHTML(r.userName)}</strong><time>${escHTML(r.date)}</time></header>
        <div class="place-stars">${_stars(r.stars)}</div>
        ${r.comment ? `<p>${escHTML(r.comment)}</p>` : ''}
      </article>`).join('')}`;
}

function renderPlaceGoogle(data, name) {
  const photos = (data.photos || []).slice();
  if (_placeCurrent) _placeCurrent.gphotos = photos.slice();
  const hero = document.getElementById('placeHero');
  // Sin foto propia: la primera de Google pasa a la cabecera
  if (!hero.classList.contains('has-photo') && photos.length) {
    const first = photos.shift();
    hero.innerHTML = `<img src="${escHTML(first)}" alt="${escHTML(name)}" onerror="placeHeroError(this)">`;
    hero.classList.add('has-photo');
  }

  const parts = [];
  if (data.rating) {
    parts.push(`<div class="place-g-rating"><span class="place-score-num">${Number(data.rating).toFixed(1)}</span>
      <div><div class="place-stars">${_stars(data.rating)}</div>
      <div class="place-score-count">${(data.total_ratings || 0).toLocaleString('es-ES')} reseñas en Google</div></div></div>`);
  }
  if (data.schedule && (data.schedule.weekday_text || []).length) {
    const open = data.schedule.open_now;
    const badge = open === true ? '<span class="place-open is-open">Abierto ahora</span>'
                : open === false ? '<span class="place-open">Cerrado ahora</span>' : '';
    parts.push(`<details class="place-hours"><summary>${_placeIco.clock}Horario ${badge}</summary>
      <dl>${data.schedule.weekday_text.map(line => {
        const i = line.indexOf(':');
        return `<dt>${escHTML(line.slice(0, i))}</dt><dd>${escHTML(line.slice(i + 1).trim())}</dd>`;
      }).join('')}</dl></details>`);
  }
  if (photos.length) {
    parts.push(`<div class="place-photos">${photos.slice(0, 6).map(url =>
      `<button type="button" onclick="openPhotoModal('${jsArg(url)}','${jsArg(name)}')" aria-label="Ampliar foto"><img src="${escHTML(url)}" alt="" loading="lazy" onerror="this.parentElement.remove()"></button>`).join('')}</div>`);
  }
  if ((data.reviews || []).length) {
    parts.push(data.reviews.map(r => `
      <article class="place-review">
        <header><strong>${escHTML(r.author)}</strong><time>${escHTML(r.date)}</time></header>
        <div class="place-stars">${_stars(r.stars)}</div>
        ${r.text ? `<p>${escHTML(r.text)}</p>` : ''}
      </article>`).join(''));
  }
  if (!parts.length) return;
  const sec = document.getElementById('placeGoogle');
  sec.innerHTML = `<h4 class="place-section-title">En Google</h4>` + parts.join('');
  sec.hidden = false;
}

function closeReviewsDrawer() {
  const drawer = document.getElementById('reviewsDrawer');
  if (!drawer.classList.contains('open')) return;
  drawer.classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('active');
  if (_placeLastFocus && document.contains(_placeLastFocus)) _placeLastFocus.focus({ preventScroll: true });
}

// Scroll → back to top
window.addEventListener('scroll', () => {
  const btn = document.getElementById('backToTop');
  if (btn) btn.classList.toggle('visible', window.scrollY > 400);
});

// ============================================================
// PHOTO LIGHTBOX
// ============================================================
function openPhotoModal(src, caption) {
  document.getElementById('photoModalImg').src = src;
  document.getElementById('photoModalCaption').textContent = caption || '';
  document.getElementById('photoModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closePhotoModal() {
  document.getElementById('photoModal').classList.remove('active');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closePhotoModal(); closeReviewsDrawer(); }
});

// ============================================================
// ADD PHOTO TO MARKER (from admin panel)
// ============================================================
async function setMarkerPhoto(id, url) {
  const trimmed = url.trim();
  const mk = appState.markers.find(m => m._id === id);
  if (!mk) return;

  try {
    const res = await fetch(`/api/markers/${id}/photo`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ photo: trimmed })
    });
    if (!res.ok) throw new Error();
    mk.photo = trimmed;
    if (appState.selectedProvince) loadProvinceMarkers(appState.selectedProvince);
    showToast('🖼️ Foto guardada en base de datos');
  } catch(e) {
    showToast('❌ Error guardando la foto');
  }
}

// ============================================================
// PDF ITINERARIO
// ============================================================
