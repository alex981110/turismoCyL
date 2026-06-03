const SPA_ROUTES = {
  '/':                'spa-home',
  '/mapa':            'spa-mapa',
  '/sobre':           'spa-home',
  '/planificador':    'spa-mapa',
  '/itinerario':      'spa-itinerario',
  '/mis-itinerarios': 'spa-mis-itinerarios',
};

function showSection(path) {
  if (path === '/admin') {
    if (appState.currentUser?.role === 'admin') {
      _activateSection('spa-home');
      showAdmin();
    } else {
      navigateTo('/');
    }
    return;
  }

  const targetId = SPA_ROUTES[path] || 'spa-home';
  _activateSection(targetId);

  document.querySelectorAll('.nav-link-cyl').forEach(a => {
    a.classList.toggle('nav-active', a.getAttribute('href') === path);
  });

  const isHome = (targetId === 'spa-home');
  const navbar    = document.getElementById('mainNavbar');
  const navLinks  = document.getElementById('navLinks');
  const navSlogan = document.getElementById('navSlogan');
  const authArea  = document.getElementById('authArea');
  if (navbar)    navbar.classList.toggle('navbar-on-hero', isHome);
  if (navLinks)  navLinks.style.display  = isHome ? 'none'  : '';
  if (navSlogan) navSlogan.style.display = isHome ? 'block' : 'none';
  if (authArea)  authArea.style.opacity  = isHome ? '0'     : '1';

  window.scrollTo({ top: 0, behavior: 'instant' });
}

function _activateSection(targetId) {
  document.querySelectorAll('.spa-section').forEach(el => {
    el.style.display = 'none';
  });

  const target = document.getElementById(targetId);
  if (target) {
    target.style.display = 'block';
    if (targetId === 'spa-mapa') {
      initLeafletMap();
      setTimeout(() => {
        map.invalidateSize();
        if (appState.selectedProvince) {
          loadProvinceMarkers(appState.selectedProvince);
        }
      }, 80);
    }
    if (targetId === 'spa-mis-itinerarios') {
      sessionReady.then(() => {
        if (typeof loadMyItineraries === 'function') loadMyItineraries();
      });
    }
  }
}

function navigateTo(path) {
  if (window.location.pathname !== path) {
    history.pushState({ path }, '', path);
  }
  showSection(path);
}

window.addEventListener('popstate', (e) => {
  const path = e.state?.path || window.location.pathname;
  showSection(path);
});

// Si se carga directamente en /admin, esperar a que la sesión esté lista
(function initRouter() {
  const path = window.location.pathname;
  const validRoute = (SPA_ROUTES[path] || path === '/admin') ? path : '/';
  if (validRoute !== path) {
    history.replaceState({ path: '/' }, '', '/');
  }

  if (validRoute === '/admin') {
    // Esperar sesión antes de decidir si mostrar admin o redirigir
    sessionReady.then(() => showSection('/admin'));
  } else {
    showSection(validRoute);
  }
})();

// Navega al mapa, selecciona provincia y abre la pestaña Explorar
function goToProvince(province) {
  const sec = document.getElementById('spa-mapa');
  const alreadyOnMap = sec && sec.style.display !== 'none';

  const activate = () => {
    if (typeof selectProvince === 'function') selectProvince(province);
    if (typeof switchMapTab  === 'function')  switchMapTab('explorar');
  };

  if (alreadyOnMap) {
    activate();
  } else {
    navigateTo('/mapa');
    // _activateSection llama a initLeafletMap() + setTimeout(80ms) internamente
    // esperamos 150ms para que todo esté listo
    setTimeout(activate, 150);
  }
}
