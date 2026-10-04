// ============================================================
async function openReviewsDrawer(name, province) {
  const rs = getRatings(name);
  document.getElementById('drawerTitle').textContent = name;
  document.getElementById('drawerSubtitle').textContent = rs.length
    ? `${rs.length} valoración${rs.length!==1?'es':''}`
    : 'Sin valoraciones aún';

  // Botón de favorito en la cabecera del drawer
  const mk = appState.markers.find(m => m.name === name && m.province === province)
          || appState.markers.find(m => m.name === name);
  const favHost = document.getElementById('drawerFavBtn');
  if (favHost) {
    if (mk && mk._id) {
      const isFav = isFavorite(mk._id);
      favHost.innerHTML = `
        <button onclick="toggleFavorite('${mk._id}','${name.replace(/'/g,"\\'")}');openReviewsDrawer('${name.replace(/'/g,"\\'")}','${province}')"
          title="${isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}"
          style="background:${isFav ? 'rgba(184,92,56,0.14)' : 'rgba(184,92,56,0.08)'};border:1px solid ${isFav ? 'rgba(184,92,56,0.45)' : 'rgba(184,92,56,0.3)'};border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:1.05rem;padding:0;transition:all 0.15s;"
          onmouseover="this.style.transform='scale(1.08)'"
          onmouseout="this.style.transform=''">
          ${favIcon(isFav)}
        </button>`;
      favHost.style.display = 'block';
    } else {
      favHost.style.display = 'none';
    }
  }

  // Avg block (valoraciones propias)
  const avgEl = document.getElementById('drawerAvg');
  if (!rs.length) {
    avgEl.innerHTML = `<div class="drawer-empty" style="padding:20px 0;text-align:left;"><span style="font-size:1.5rem;margin:0 0 6px;">★</span><span style="display:inline;font-size:0.88rem;color:var(--parch2);">Sé el primero en valorar este lugar.</span></div>`;
  } else {
    const avg = getAvgRating(name);
    const total = rs.length;
    const bars = [5,4,3,2,1].map(n => ({ n, count: rs.filter(r=>r.stars===n).length }));
    avgEl.innerHTML = `
      <div style="text-align:center;padding-right:16px;border-right:1px solid rgba(42,33,24,0.10);">
        <div class="big-avg">${avg.toFixed(1)}</div>
        <div style="color:var(--gold);font-size:1rem;letter-spacing:2px;margin:4px 0;">${starsHTML(avg,'1rem')}</div>
        <div style="font-size:0.72rem;color:var(--parch2);">${total} reseña${total!==1?'s':''}</div>
      </div>
      <div class="drawer-bars" style="flex:1;padding-left:16px;">
        ${bars.map(({n,count}) => `
          <div class="star-bar-row">
            <span style="min-width:14px;">${n}</span>
            <span style="color:var(--gold);font-size:0.7rem;">★</span>
            <div class="bar-track"><div class="bar-fill" style="width:${total?((count/total)*100).toFixed(0):0}%;"></div></div>
            <span style="min-width:16px;text-align:right;">${count}</span>
          </div>
        `).join('')}
      </div>`;
  }

  // Valoraciones propias
  const listEl = document.getElementById('drawerReviews');
  let ownHTML = '';
  if (!rs.length) {
    ownHTML = `<div class="drawer-empty"><span>✦</span>Nadie ha valorado este lugar todavía.<br><br>
      <button class="btn" onclick="closeReviewsDrawer();openRatingModal('${name.replace(/'/g,"\'")}','')">★ Ser el primero</button>
    </div>`;
  } else {
    const sorted = [...rs].reverse();
    ownHTML = sorted.map(r => `
      <div class="review-item">
        <div class="review-header">
          <span class="review-author">${r.userName}</span>
          <span class="review-date">${r.date}</span>
        </div>
        <div class="review-stars">${[1,2,3,4,5].map(i=>`<span style="color:${i<=r.stars?'var(--gold)':'rgba(42,33,24,0.13)'};">★</span>`).join('')}</div>
        ${r.comment ? `<div class="review-comment">"${r.comment}"</div>` : ''}
      </div>
    `).join('');
  }

  // Sección Google Reviews (carga asíncrona)
  listEl.innerHTML = ownHTML + `
    <div id="googleReviewsSection" style="margin-top:24px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding-top:16px;border-top:1px solid rgba(42,33,24,0.10);">
        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span style="font-family:'Instrument Serif',serif;color:var(--gold);font-size:0.9rem;letter-spacing:0.08em;">RESEÑAS DE GOOGLE</span>
      </div>
      <div id="googleReviewsContent" style="color:var(--parch2);font-size:0.85rem;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 0;">
          <div style="width:16px;height:16px;border:2px solid var(--gold);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;flex-shrink:0;"></div>
          Cargando reseñas de Google...
        </div>
      </div>
    </div>`;

  document.getElementById('drawerOverlay').classList.add('active');
  document.getElementById('reviewsDrawer').classList.add('open');

  // Cargar detalles de Google (reseñas + horarios + fotos)
  try {
    const prov = province || (appState.markers.find(m=>m.name===name)||{}).province || '';
    const res = await fetch(`/api/photos/details?name=${encodeURIComponent(name)}&province=${encodeURIComponent(prov)}`);
    const data = await res.json();
    const googleEl = document.getElementById('googleReviewsContent');
    if (!googleEl) return;

    if (!data.reviews?.length && !data.photos?.length && !data.schedule) {
      googleEl.innerHTML = `<div style="color:var(--parch2);font-style:italic;font-size:0.85rem;padding:8px 0;">Sin información de Google disponible para este lugar.</div>`;
      return;
    }

    // ── Fotos ──────────────────────────────────────────────
    const photosHTML = data.photos?.length ? `
      <div style="margin-bottom:18px;">
        <div style="font-size:0.72rem;letter-spacing:0.12em;color:var(--gold);margin-bottom:8px;">FOTOS</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">
          ${data.photos.map(url => `
            <img src="${url}" onclick="openPhotoModal('${url}','${name.replace(/'/g,"\'")}'))"
              style="width:100%;aspect-ratio:4/3;object-fit:cover;cursor:pointer;border:1px solid rgba(42,33,24,0.13);transition:opacity 0.2s;"
              onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'"
              onerror="this.parentElement.remove()">
          `).join('')}
        </div>
      </div>` : '';

    // ── Horarios ───────────────────────────────────────────
    let hoursHTML = '';
    if (data.schedule) {
      const isOpen = data.schedule.open_now;
      const badge = isOpen === null ? '' :
        isOpen
          ? `<span style="background:rgba(76,175,80,0.15);color:#4caf50;border:1px solid rgba(76,175,80,0.3);padding:2px 10px;font-size:0.72rem;letter-spacing:0.08em;">ABIERTO AHORA</span>`
          : `<span style="background:rgba(184,92,56,0.14);color:#e57373;border:1px solid rgba(229,115,115,0.3);padding:2px 10px;font-size:0.72rem;letter-spacing:0.08em;">CERRADO AHORA</span>`;

      const weekHTML = data.schedule.weekday_text?.length
        ? data.schedule.weekday_text.map(line => {
            const [day, ...rest] = line.split(':');
            return `<div style="display:flex;justify-content:space-between;gap:12px;padding:4px 0;border-bottom:1px solid rgba(42,33,24,0.04);font-size:0.8rem;">
              <span style="color:var(--gold);min-width:90px;">${day}</span>
              <span style="color:var(--parch2);text-align:right;">${rest.join(':').trim()}</span>
            </div>`;
          }).join('')
        : '';

      hoursHTML = `
        <div style="margin-bottom:18px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="font-size:0.72rem;letter-spacing:0.12em;color:var(--gold);">HORARIOS</div>
            ${badge}
          </div>
          <div style="background:var(--sand);border:1px solid rgba(184,92,56,0.08);padding:10px 14px;">
            ${weekHTML || '<span style="color:var(--parch2);font-size:0.8rem;font-style:italic;">Horario no disponible</span>'}
          </div>
        </div>`;
    }

    // ── Rating global ──────────────────────────────────────
    const ratingHTML = data.rating ? `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <span style="font-family:'Instrument Serif',serif;font-size:2rem;color:var(--gold);">${data.rating.toFixed(1)}</span>
        <div>
          <div style="color:var(--gold);font-size:0.9rem;letter-spacing:2px;">${[1,2,3,4,5].map(i=>`<span style="color:${i<=data.rating?'var(--gold)':'rgba(42,33,24,0.13)'};">★</span>`).join('')}</div>
          <div style="font-size:0.72rem;color:var(--parch2);margin-top:2px;">${(data.total_ratings||0).toLocaleString()} reseñas en Google</div>
        </div>
      </div>` : '';

    // ── Reseñas ────────────────────────────────────────────
    const reviewsHTML = data.reviews?.length ? data.reviews.map(r => `
      <div class="review-item" style="margin-bottom:14px;">
        <div class="review-header" style="display:flex;align-items:center;gap:10px;">
          ${r.photo ? `<img src="${r.photo}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:1px solid rgba(42,33,24,0.20);" onerror="this.style.display='none'">` : ''}
          <div>
            <span class="review-author">${r.author}</span>
            <span class="review-date" style="display:block;">${r.date}</span>
          </div>
        </div>
        <div class="review-stars" style="margin:6px 0 4px;">${[1,2,3,4,5].map(i=>`<span style="color:${i<=r.stars?'var(--gold)':'rgba(42,33,24,0.13)'};">★</span>`).join('')}</div>
        ${r.text ? `<div class="review-comment" style="font-style:normal;">${r.text}</div>` : ''}
      </div>
    `).join('') : '';

    googleEl.innerHTML = photosHTML + hoursHTML + ratingHTML + reviewsHTML;

  } catch(e) {
    const googleEl = document.getElementById('googleReviewsContent');
    if (googleEl) googleEl.innerHTML = `<div style="color:var(--ink-muted);font-size:0.8rem;padding:8px 0;">No se pudieron cargar los datos de Google.</div>`;
  }
}

function closeReviewsDrawer() {
  document.getElementById('reviewsDrawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('active');
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
