---
version: 1
slug: "views-index-ejs"
primary_target: "views/index.ejs"
related_targets: ["pages/home/hero.ejs","pages/mapa/mapa.ejs"]
---

# Surface brief: aplicación completa (portada, mapa, itinerario, mis itinerarios, admin)

Mode: Operate (la portada es la entrada a la herramienta, no una landing de venta).
Audiencia y tarea: viajero que planifica una escapada por Castilla y León en coche; pasa de descubrir lugares a un plan con horario.
Constraints: conservar toda la funcionalidad, la animación portada→mapa (route-intro) y las fotos de provincias. Sin build; Bootstrap 5.3, Leaflet, D3.

## Direction contract

THESIS: El viaje por Castilla y León como documento de viaje: cada lugar es un billete segmentado y cada día del plan es un panel de salidas ordenado por hora. Rechaza la portada turística de foto + titular serif + botón y el crema-terracota del diseño anterior.

OWN-WORLD: Tinta #0B0D10 y pizarra #1C2127 para la barra y los paneles de salidas; superficies blancas sobre gris panel #E6E8EB; amarillo señal #FFD400 solo para cambio, selección y acción primaria activa; colores de categoría como series de datos. Barlow Condensed en mayúsculas para códigos y titulares (grotesca de señal de carretera), Barlow para el texto, JetBrains Mono tabular para horas, km y números. Esquinas de 4px, filetes de 1px, troqueles de billete con perforación punteada. Provincias con su código de matrícula (AV BU LE P SA SG SO VA ZA) como los códigos IATA.

STORY: El viajero ve en un vistazo qué provincia, qué lugares y a qué hora; entiende que la web le arma un plan con horario por zonas; explora el mapa y sale con su billete/itinerario guardado o en PDF.

FIRST VIEWPORT: Portada a 1440: foto de provincia a sangre conservada, oscurecida en su mitad izquierda. A la izquierda, titular en Barlow Condensed enorme «SG → TU FIN DE SEMANA» con el código de la provincia del carrusel, subtítulo y dos botones (Explorar el mapa en amarillo, Crear mi plan contorno). A la derecha, un panel de salidas tinta con 6 lugares reales de esa provincia (HORA · LUGAR · TIPO · ESTADO) que cambia con el carrusel. Abajo, banda de cifras y selector de provincias por código. Mapa: barra tinta, panel lateral de billetes, mapa claro.

SIGNATURE: El panel de salidas: las filas se reordenan en su sitio (FLIP) al cambiar provincia o plan y la fila cambiada mantiene el amarillo hasta que se ve; las paradas del itinerario se leen como salidas con hora, y el estado va también en forma de línea (continua/discontinua).

FORM: vernacular-ephemera-boarding-pass-and-gate-board (aspirante elegido por el usuario frente a la posición 6 asignada de mi lista); seed key 4f78267c.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
