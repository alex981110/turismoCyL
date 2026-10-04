// Acciones de la interfaz por delegación: los elementos llevan data-action="nombre"
// y sus datos en data-*; cada módulo registra sus acciones con registerActions().
// Con elementos anidados (un botón dentro de una fila) se ejecuta solo el más interno.
// Se carga antes que el resto de scripts para que todos puedan registrar acciones.
const UI_ACTIONS = {};
function registerActions(actions) { Object.assign(UI_ACTIONS, actions); }
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el || !UI_ACTIONS[el.dataset.action]) return;
  if (el.tagName === 'A') e.preventDefault();
  UI_ACTIONS[el.dataset.action](el.dataset, el, e);
});
registerActions({
  'open-modal': d => openModal(d.modal),
});
