---
name: Castilla y León · Billete y panel de salidas
description: El viaje por Castilla y León como documento de viaje; cada lugar es un billete y cada día del plan, un panel de salidas ordenado por hora.
colors:
  ink: "#0E1114"
  slate: "#1C2127"
  slate-2: "#2A3038"
  ink-soft: "#2E353D"
  steel: "#5A636E"
  panel: "#DCDFE3"
  ground: "#E6E8EB"
  surface: "#FCFCFB"
  line: "rgba(14,17,20,0.13)"
  line-strong: "rgba(14,17,20,0.26)"
  board-text: "#EEF0F2"
  board-muted: "#A3ACB7"
  board-line: "rgba(238,240,242,0.12)"
  signal: "#FFD400"
  signal-deep: "#EAC200"
  signal-wash: "rgba(255,212,0,0.18)"
  ok: "#1D7A47"
  danger: "#B42318"
  cat-patrimonio: "#B1432B"
  cat-cultura: "#2459A6"
  cat-escena: "#6A4C9C"
  cat-naturaleza: "#2D7A4C"
  cat-mesa: "#B35E0B"
  cat-cama: "#1D727A"
typography:
  display:
    fontFamily: "'Barlow Condensed', 'Barlow', system-ui, sans-serif"
    fontSize: "clamp(3.4rem, 6.6vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "0"
  headline:
    fontFamily: "'Barlow Condensed', 'Barlow', system-ui, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0.01em"
  title:
    fontFamily: "'Barlow Condensed', 'Barlow', system-ui, sans-serif"
    fontSize: "1.35rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0.02em"
  body:
    fontFamily: "'Barlow', system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "'Barlow Condensed', 'Barlow', system-ui, sans-serif"
    fontSize: "1.02rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.06em"
  data-label:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontSize: "0.72rem"
    fontWeight: 600
    letterSpacing: "0.08em"
  data-time:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontSize: "1.05rem"
    fontWeight: 600
    fontFeature: "'tnum' 1"
rounded:
  plate: "3px"
  base: "4px"
  md: "6px"
  lg: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  row: "12px"
  md: "16px"
  board: "18px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "#FFFFFF"
    typography: "{typography.label}"
    rounded: "{rounded.base}"
    padding: "0 22px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.slate-2}"
    textColor: "#FFFFFF"
  button-signal:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.base}"
    padding: "0 26px"
    height: "52px"
  button-signal-hover:
    backgroundColor: "{colors.signal-deep}"
    textColor: "{colors.ink}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.base}"
    padding: "0 22px"
    height: "44px"
  button-outline-hover:
    backgroundColor: "{colors.ink}"
    textColor: "#FFFFFF"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.base}"
    padding: "11px 14px"
    height: "46px"
  tab-segmented:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.steel}"
    rounded: "{rounded.base}"
    padding: "4px"
  tab-segmented-active:
    backgroundColor: "{colors.ink}"
    textColor: "#FFFFFF"
    rounded: "{rounded.plate}"
    height: "40px"
  plate-code:
    backgroundColor: "{colors.ink}"
    textColor: "#FFFFFF"
    typography: "{typography.data-label}"
    rounded: "{rounded.plate}"
    padding: "3px 6px"
  plate-code-signal:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.ink}"
    rounded: "{rounded.plate}"
    padding: "3px 7px"
  chip-category:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.base}"
    padding: "0 10px"
    height: "34px"
  chip-category-active:
    backgroundColor: "{colors.ink}"
    textColor: "#FFFFFF"
  departures-board:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.board-text}"
    rounded: "{rounded.lg}"
    padding: "12px 18px"
  departures-row-next:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.ink}"
    height: "48px"
  ticket-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "12px 14px"
---

# Design System: Castilla y León · Billete y panel de salidas

## Overview

**Creative North Star: "El billete y el panel de salidas"**

El sistema trata el viaje como papelería de transporte: cada lugar es un billete con su matriz perforada y cada día del plan es un panel de salidas en tinta, ordenado por hora. La señalética de carretera y aeropuerto manda: grotesca condensada en mayúsculas para titulares y botones, mono tabular para horas, kilómetros y recuentos, y las nueve provincias identificadas por su código de matrícula (AV BU LE P SA SG SO VA ZA) como si fueran códigos IATA.

La densidad es de panel informativo: filas de 48px separadas por filetes de 1px, columnas fijas (HORA · LUGAR · TIPO · DÍA) y poca ornamentación. Dos suelos conviven: los paneles en tinta (barra superior, panel de salidas, plan del día, cabeceras de cajón, pie) y las superficies claras de billete sobre gris panel (lista de lugares, ficha, tarjetas de provincia, formularios). La fotografía real de las provincias y el mapa son los protagonistas; el sistema los enmarca, no los decora. El amarillo señal es escaso y siempre significa algo: qué cambió, qué está seleccionado, cuál es la acción principal o la próxima parada.

El sistema rechaza explícitamente la portada turística de foto + titular serif + botón y la paleta crema-terracota del diseño anterior.

**Key Characteristics:**
- Tinta y pizarra para los paneles; blanco roto sobre gris panel para los billetes.
- Amarillo señal reservado a cambio, selección, acción principal y próxima parada.
- Barlow Condensed en mayúsculas (señal de carretera), Barlow para el texto, JetBrains Mono tabular para datos.
- Códigos de matrícula de provincia en placas mono de 3px.
- Esquinas pequeñas (3–8px), filetes de 1px y troqueles de billete con perforación discontinua.
- Colores de categoría como series de datos, nunca como decoración.
- Las celdas del panel voltean como tablillas (flap) al cambiar provincia.

## Colors

Una paleta casi monocroma de tinta y grises fríos, con un único acento de señal amarillo y seis colores de serie para las familias de categoría.

### Primary
- **Tinta de panel** (ink): barra superior, panel de salidas, plan del día, cabeceras de cajón, pie, botón principal neutro, pestaña activa, placas de código y texto principal sobre claro. Es el color estructural del sistema.
- **Amarillo señal** (signal): fila «próxima parada» del panel, código de provincia activo, provincia seleccionada, botón principal de cada pantalla (Explorar el mapa, Crear itinerario en el mapa), horas sobre tinta, línea de ruta del plan, anillo de foco y selección de texto. Su versión **Amarillo señal hundido** (signal-deep) es el hover de los botones amarillos y el subrayado de enlaces sobre claro; **Lavado señal** (signal-wash) es el fondo de hover de chips en el editor de itinerarios.

### Secondary
Series de datos por familia de categoría (asignadas con `data-fam` desde `catFam` en `public/js/shared/data.js`):
- **Rojo ladrillo patrimonio** (cat-patrimonio): monumento, historia.
- **Azul museo** (cat-cultura): museo, exposición, cultura, biblioteca; también la familia por defecto.
- **Violeta escena** (cat-escena): teatro, cine.
- **Verde monte** (cat-naturaleza): naturaleza.
- **Naranja mesón** (cat-mesa): gastronomía, bar.
- **Verde azulado posada** (cat-cama): alojamiento.

### Neutral
- **Pizarra** (slate) y **Pizarra clara** (slate-2): paneles secundarios del intro de ruta, hover de botones tinta, fondo de miniaturas sobre tinta.
- **Tinta suave** (ink-soft): texto largo de descripciones y reseñas sobre claro.
- **Acero** (steel): texto secundario, etiquetas mono, recuentos, iconos inactivos sobre claro.
- **Gris panel** (panel): fondo de los grupos de pestañas segmentadas, huecos de foto, estado deshabilitado.
- **Suelo** (ground): fondo de página y del mapa; hover de filas de lista.
- **Papel de billete** (surface): billetes, ficha, barra lateral, modales, campos.
- **Filete** (line) y **Filete marcado** (line-strong): divisores de 1px y bordes de 1.5px de controles y tarjetas.
- **Texto de panel** (board-text), **Texto de panel atenuado** (board-muted) y **Filete de panel** (board-line): sus equivalentes sobre tinta. Solo se usan sobre fondos tinta.
- **Abierto** (ok) y **Peligro** (danger): estado «abierto ahora» en horarios y acción de borrar itinerario.

### Named Rules
**The Signal Rule.** El amarillo señal solo marca cambio, selección, acción principal activa o próxima parada. Nunca rellena etiquetas informativas: la afinidad «Para ti» va en contorno amarillo sobre tinta, y el amarillo relleno queda para la línea de ruta y la fila siguiente.

**The Data Series Rule.** Los seis colores de categoría solo aparecen como serie de datos: fondo del marcador del mapa, miniatura de respaldo, cabecera del popup, icono del chip y etiqueta de contorno. Nunca como fondo de botones, paneles o titulares.

**The Two Grounds Rule.** Tinta o papel, sin término medio. Los tokens `board-*` solo viven sobre tinta; `steel` y `line` solo sobre claro.

## Typography

**Display Font:** Barlow Condensed (con Barlow, system-ui)
**Body Font:** Barlow (con system-ui)
**Label/Mono Font:** JetBrains Mono (con ui-monospace)

**Character:** Una grotesca condensada de señal de carretera en mayúsculas para todo lo que se lee de lejos, una grotesca humanista neutra para leer de cerca, y una mono tabular para todo lo que se cuenta o se cronometra. Las tres fuentes se sirven desde `/fonts` (Barlow 400–700, Barlow Condensed 500–700, JetBrains Mono 400/600).

### Hierarchy
- **Display** (Barlow Condensed 700, clamp(3.4rem, 6.6vw, 6rem), 0.9, mayúsculas): solo el titular-trayecto de la portada «SG → Tu fin de semana», con el código de provincia en placa amarilla.
- **Headline** (Barlow Condensed 700, clamp(2rem, 4vw, 3rem), 1.05, mayúsculas): títulos de sección (Mi itinerario, Mis itinerarios, plan), cabecera de provincias; título de ficha a clamp(1.9rem, 4.6vw, 2.4rem).
- **Title** (Barlow Condensed 700, 1.35rem, 1.05, 0.02em, mayúsculas): nombre de provincia en billete, secciones de la ficha, título de itinerario guardado; cabeceras del panel de salidas a 1.25–1.4rem con 0.04em.
- **Body** (Barlow 400, 16px, 1.55): texto corrido; descripciones a 1rem/1.6 con máximo 65ch, subtítulos de sección a 60ch. Nombres de lugar en listas a 600.
- **Label** (Barlow Condensed 600, 1.02rem, 0.06em, mayúsculas): botones, pestañas, enlaces de navegación.
- **Data label** (JetBrains Mono 600, 0.64–0.75rem, 0.04–0.1em, mayúsculas): cabeceras de columna del panel, etiquetas de formulario, encabezados de sección del panel lateral y del pie, tipo de lugar, códigos de provincia.
- **Data time** (JetBrains Mono 600, 0.86–1.05rem, cifras tabulares): horas del panel y del plan, reloj de cabecera, notas, recuentos, kilómetros.

### Named Rules
**The Tabular Clock Rule.** Toda hora, kilómetro, nota o recuento va en JetBrains Mono con `tabular-nums`. Si es un número que el viajero compara, es mono.

**The Plate Code Rule.** Una provincia se identifica por su código de matrícula en placa mono (3px de radio): tinta con texto blanco en reposo, amarillo con tinta cuando está activa o es la del carrusel.

**The Condensed Caps Rule.** Las mayúsculas son para Barlow Condensed (titulares, botones) y para etiquetas mono pequeñas. El texto de lectura en Barlow nunca va en mayúsculas.

## Layout

Contenido de portada y secciones con ancho máximo de 1320px y márgenes laterales `clamp(16px, 4vw, 56px)`; pie a 1240px en rejilla 1.6fr/1fr/1fr/1fr. La barra superior es fija, de 64px (60px por debajo de 768px).

- **Portada:** foto de provincia a sangre a altura completa (100svh), oscurecida en degradado desde la izquierda; rejilla de dos columnas (texto flexible + panel de salidas de 360–440px) que pasa a una columna por debajo de 960px. Los códigos del carrusel bajan a dos filas de cinco celdas de 44px en móvil.
- **Provincias:** rejilla de 4 columnas con un billete destacado de 2×2; 2 columnas por debajo de 960px; 1 columna por debajo de 560px.
- **Mapa:** carcasa a pantalla completa bajo la barra; panel lateral fijo de 400px a la izquierda y mapa claro a la derecha. Por debajo de 960px el panel se convierte en cajón superpuesto (`min(400px, 92vw)`) con botón flotante y velo.
- **Ritmo:** pasos de 4, 8, 12, 16, 18 y 24px. Las filas de lista y de panel usan 12px vertical y 16–18px horizontal; las secciones de portada respiran con `clamp(56px, 9vw, 112px)`.
- **Móvil:** los modales pasan a hoja inferior con radio solo arriba; los controles táctiles miden al menos 44px; los campos usan 16px para evitar el zoom.
- **Puntos de corte observados:** 960px (estructura), 768px (móvil), 600px y 560px (portada), 390px (compacto).

## Elevation & Depth

Sistema híbrido: las superficies de papel son planas y se separan con filetes de 1px; la profundidad se reserva a lo que flota sobre otra cosa (el panel de salidas sobre la foto, modales, cajones, controles y marcadores sobre el mapa). Todas las sombras son difusas y teñidas de tinta, nunca desplazadas en duro.

### Shadow Vocabulary
- **Reposo** (`box-shadow: 0 1px 2px rgba(14,17,20,0.08), 0 1px 1px rgba(14,17,20,0.05)`): billetes de itinerario guardado en reposo.
- **Flotante** (`box-shadow: 0 6px 18px rgba(14,17,20,0.12), 0 2px 4px rgba(14,17,20,0.08)`): controles sobre el mapa, chip de provincia, tooltip, plan del día, hover de billetes.
- **Elevado** (`box-shadow: 0 16px 40px rgba(14,17,20,0.18), 0 4px 10px rgba(14,17,20,0.08)`): popups del mapa, avisos.
- **Superpuesto** (`box-shadow: 0 28px 70px rgba(14,17,20,0.28)`): modales y panel de salidas sobre la foto.

### Named Rules
**The Flat Paper Rule.** El papel no flota en reposo. Un billete gana sombra y sube 2px solo al pasar el puntero; lo único que lleva sombra permanente es lo que está encima de foto o de mapa.

## Shapes

Rectángulos de esquina pequeña: 3px para placas de código, etiquetas y pestañas internas; 4px para botones, campos, chips, filas y controles; 6px para el marcador del mapa y la placa del titular; 8px para tarjetas, paneles de salidas, modales y popups. Los círculos solo aparecen en los puntos de parada de la línea de ruta y en el indicador de carga.

Los bordes son filetes de 1px (divisores) o 1.5px (controles y contornos de botón). La línea discontinua tiene significado propio en este mundo:
- **Perforación** (2px discontinua, tinta al 20–22%): separa la foto del cuerpo del billete en la ficha, las tarjetas de provincia, la tarjeta del intro y el popup.
- **Cambio de día**: la primera fila del domingo en el panel de salidas lleva el filete superior discontinuo.
- **Trayecto incierto**: la línea de ruta del plan es continua si la parada está situada en el mapa y discontinua si no tiene coordenadas; la afinidad baja también usa contorno discontinuo.

### Named Rules
**The Perforation Rule.** Entre la imagen y los datos de un billete siempre hay una perforación discontinua de 2px; la línea discontinua nunca es decorativa en otro lugar, solo señala discontinuidad.

## Components

### Buttons
Directos y de señalética: mayúsculas condensadas, alto fijo y respuesta física al pulsar.
- **Shape:** esquinas de 4px, borde de 1.5px, alto mínimo de 44px (52px en la portada).
- **Primary:** tinta con texto blanco para acciones neutras; en la barra tinta se invierte a blanco con texto tinta.
- **Signal:** amarillo con texto tinta para la única acción principal de cada pantalla (Explorar el mapa, botón flotante de itinerario).
- **Outline:** transparente con borde y texto tinta; se rellena de tinta al pasar el puntero. Sobre tinta, borde claro al 45–60%.
- **Hover / Focus / Active:** transiciones de color en 0.15s; al pulsar escala a 0.97 en 0.16s con `ease-out`. Foco global: contorno de 2px tinta más halo de 5px amarillo.

### Chips
- **Filtro de categoría:** papel con borde de 1.5px, icono SVG en el color de su familia y recuento en mono; activo en tinta con icono amarillo.
- **Etiqueta de categoría:** contorno de 1px y texto en el color de la familia, mono de 0.66rem en mayúsculas, 3px de radio. Sobre tinta pasa a texto de panel atenuado.
- **Afinidad «Para ti»:** etiqueta de contorno mono; la alta en contorno amarillo, la baja discontinua.

### Cards / Containers
- **Billete:** papel, borde de 1px `line-strong`, 8px de radio, foto arriba y matriz abajo tras la perforación, con placa de código, nombre en condensada y flecha.
- **Background:** papel sobre suelo gris.
- **Shadow Strategy:** plano en reposo; Flotante y −2px al pasar el puntero.
- **Internal Padding:** 12–14px en la matriz; 22–24px en el cuerpo de la ficha.

### Inputs / Fields
- **Style:** papel, borde de 1.5px `line-strong`, 4px de radio, 46px de alto, etiqueta encima en mono pequeña en mayúsculas.
- **Focus:** borde tinta más anillo amarillo de 3px.
- **Placeholder:** gris medio (#7A828C).

### Navigation
- **Barra superior:** tinta fija de 64px; sobre la foto de portada, tinta al 72% con desenfoque. Sello «CyL» en placa amarilla junto al nombre en condensada y el lema en mono.
- **Enlaces:** condensada 600 en mayúsculas, atenuados; activos en blanco con subrayado amarillo de 3px. En el menú móvil, el activo lleva una barra amarilla de 4px a la izquierda.
- **Pestañas segmentadas** (panel lateral, modales): grupo sobre gris panel con 4px de relleno; pestaña activa en tinta con texto blanco.

### Panel de salidas (componente firma)
Panel tinta de 8px de radio con cabecera (título condensado, placa de código amarilla, reloj mono), cabeceras de columna mono (HORA · LUGAR · TIPO · DÍA) y filas de 48px separadas por filetes de panel. La hora va en mono amarillo; el lugar en Barlow blanco. La fila de la próxima parada según el reloj se rellena de amarillo con texto tinta. Al cambiar de provincia, solo las celdas que cambian voltean como tablillas (rotación X de −92° a 0 en 0.42s). El plan del día reutiliza el mismo panel con una línea de ruta amarilla de 2px y un punto por parada entre la hora y el lugar.

### Marcadores del mapa
Cuadrado de 30px con 6px de radio en el color de la familia, borde blanco de 2px e icono SVG; en hover escala 1.14 con halo amarillo. Las agrupaciones son cuadrados tinta de 38px con recuento mono que pasan a amarillo en hover. Las teselas van en escala de grises para que el color quede para los datos.

### Ficha del lugar
Cajón lateral de hasta 460px que entra desde la derecha (0.36s, `ease-drawer`): foto 16:10, perforación, chip tinta de categoría, código de provincia mono, título condensado, acciones de 42px (activas en amarillo) y bloque de valoración en tinta con la nota en mono amarillo y barras de 4px.

## Do's and Don'ts

### Do:
- **Do** identificar cada provincia por su código de matrícula en placa mono de 3px (AV BU LE P SA SG SO VA ZA).
- **Do** poner horas, kilómetros, notas y recuentos en JetBrains Mono con cifras tabulares.
- **Do** reservar el amarillo señal (#FFD400) a la acción principal de la pantalla, la selección, la fila siguiente y la línea de ruta.
- **Do** separar foto y datos de un billete con una perforación discontinua de 2px.
- **Do** colorear por familia de categoría solo a través de `data-fam` y `--fam`, en marcadores, miniaturas y etiquetas de contorno.
- **Do** mantener los paneles en tinta con sus tokens `board-*` y las superficies de lectura en papel sobre suelo gris.
- **Do** usar iconos SVG de trazo que heredan `currentColor`.
- **Do** respetar `prefers-reduced-motion`: sin tablillas, sin zoom lento de foto, cajones solo con opacidad.

### Don't:
- **Don't** volver al titular serif sobre foto ni a la paleta crema-terracota del diseño anterior.
- **Don't** rellenar de amarillo etiquetas informativas como la afinidad «Para ti»; van en contorno.
- **Don't** usar los colores de categoría como fondo de botones, paneles o titulares.
- **Don't** usar sombras desplazadas en duro ni radios de píldora en controles; los círculos son solo para paradas de ruta y el indicador de carga.
- **Don't** usar líneas discontinuas como adorno: significan perforación, cambio de día o trayecto sin situar.
- **Don't** poner en mayúsculas el texto de lectura en Barlow.
