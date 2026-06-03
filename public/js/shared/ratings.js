function getRatings(name) {
  return appState.ratings[name] || [];
}

function getAvgRating(name) {
  const rs = getRatings(name);
  if (!rs.length) return 0;
  return rs.reduce((s, r) => s + r.stars, 0) / rs.length;
}

function starsHTML(avg, size) {
  const full = Math.round(avg);
  return [1,2,3,4,5].map(i => `<span style="color:${i<=full?'var(--gold)':'rgba(42,33,24,0.13)'};font-size:${size||'0.85rem'};">★</span>`).join('');
}

function getRatingSummaryHTML(name) {
  const rs = getRatings(name);
  if (!rs.length) return `<div class="rating-summary" onclick="event.stopPropagation();openReviewsDrawer('${name.replace(/'/g,"\\'")}')"><span style="color:rgba(42,33,24,0.45);font-size:0.75rem;">★★★★★</span><span class="count" style="margin-left:5px;">Sin valoraciones</span></div>`;
  const avg = getAvgRating(name);
  return `<div class="rating-summary" onclick="event.stopPropagation();openReviewsDrawer('${name.replace(/'/g,"\\'")}')">
    <span class="avg-stars">${starsHTML(avg)}</span>
    <span style="color:var(--gold);font-weight:700;font-size:0.82rem;">${avg.toFixed(1)}</span>
    <span class="count">(${rs.length} valoración${rs.length!==1?'es':''})</span>
  </div>`;
}

function openRatingModal(name, province) {
  if (!appState.currentUser) {
    showToast('✦ Inicia sesión para valorar');
    openModal('login');
    return;
  }
  appState.pendingRating = { name, province };
  appState.pendingStars = 0;
  document.getElementById('ratingModalTitle').textContent = name;
  document.getElementById('ratingModalSubtitle').textContent = province + ' · Deja tu valoración';
  document.getElementById('ratingComment').value = '';

  // Check if user already rated
  const existing = getRatings(name).find(r => r.user === appState.currentUser.email);
  if (existing) {
    appState.pendingStars = existing.stars;
    document.getElementById('ratingComment').value = existing.comment || '';
  }

  renderModalStars(appState.pendingStars);
  document.getElementById('ratingModal').classList.add('active');
}

function closeRatingModal() {
  document.getElementById('ratingModal').classList.remove('active');
  appState.pendingRating = null;
}

document.getElementById('ratingModal').addEventListener('click', e => {
  if (e.target === document.getElementById('ratingModal')) closeRatingModal();
});

function renderModalStars(filled) {
  document.querySelectorAll('#ratingStars .star').forEach((s, i) => {
    s.classList.toggle('filled', i < filled);
  });
}

// Star hover & click interactions
document.querySelectorAll('#ratingStars .star').forEach((star, idx) => {
  star.addEventListener('mouseenter', () => {
    document.querySelectorAll('#ratingStars .star').forEach((s, i) => {
      s.classList.toggle('hover', i <= idx);
      s.classList.toggle('filled', false);
    });
  });
  star.addEventListener('mouseleave', () => {
    document.querySelectorAll('#ratingStars .star').forEach(s => s.classList.remove('hover'));
    renderModalStars(appState.pendingStars || 0);
  });
  star.addEventListener('click', () => {
    appState.pendingStars = idx + 1;
    renderModalStars(appState.pendingStars);
  });
});

function submitRating() {
  const { name } = appState.pendingRating || {};
  const stars = appState.pendingStars;
  if (!stars) { showToast('⚠️ Selecciona una puntuación'); return; }
  if (!name) return;

  if (!appState.ratings[name]) appState.ratings[name] = [];
  const userEmail = appState.currentUser.email;
  const existingIdx = appState.ratings[name].findIndex(r => r.user === userEmail);
  const entry = {
    user: userEmail,
    userName: appState.currentUser.name.split(' ')[0],
    stars,
    comment: document.getElementById('ratingComment').value.trim(),
    date: new Date().toLocaleDateString('es-ES')
  };
  if (existingIdx >= 0) {
    appState.ratings[name][existingIdx] = entry;
  } else {
    appState.ratings[name].push(entry);
  }

  closeRatingModal();
  showToast('✦ ¡Valoración enviada!');

  // Refresh cards if province is selected
  if (appState.selectedProvince) renderMarkerCards();
}

// ============================================================
// REVIEWS DRAWER
