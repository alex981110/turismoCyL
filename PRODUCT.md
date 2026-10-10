# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Viajero que planifica una escapada o un fin de semana a Castilla y León. Lo prepara desde casa (escritorio) o sobre la marcha (móvil) y quiere salir con un plan concreto: dónde ir, qué comer y dónde quedarse.

## Product Purpose

Descubrir lugares de las 9 provincias de Castilla y León y convertirlos en un plan de viaje. Éxito: el viajero termina con un itinerario guardado o descargado que encaja con sus gustos y es realizable en el tiempo que tiene.

## Positioning

No es un listado turístico genérico: el viajero indica sus gustos («Mis gustos», 7 perfiles) y la web puntúa cada lugar para él (insignia «Para ti»), monta un plan personalizado agrupado por zonas con horario calculado y lo dibuja como ruta real por carretera sobre el mapa.

## Operating Context

- SPA servida por Express + EJS (`views/index.ejs` monta todas las secciones; `public/js/shared/router.js` cambia entre ellas).
- Rutas: `/` portada, `/mapa` explorador, `/itinerario` generador, `/mis-itinerarios`, `/admin` (rol admin).
- Mapa interactivo Leaflet (marcadores por categoría, clusters, ruta OSRM) y mapa de provincias D3 sobre GeoJSON.
- Cuenta de usuario (JWT) para favoritos, reseñas e itinerarios guardados (máx. 3). PDF del itinerario con jsPDF.
- Despliegue en Render (plan gratuito) con MongoDB Atlas.

## Capabilities and Constraints

- Toda la funcionalidad existente se mantiene en un rediseño: filtros por categoría/provincia/texto, ficha del lugar con fotos, favoritos, reseñas y valoraciones, «Mis gustos», plan personalizado, itinerarios, ruta en mapa, PDF, panel de administración.
- Stack fijado: Express, EJS, Bootstrap 5.3, Leaflet 1.9 (+ MarkerCluster, Routing Machine), D3 7.8, jsPDF. Sin paso de build: CSS y JS planos en `public/`.
- Datos: unos 2.600 puntos de interés curados (`public/assets/data/markers.json`).

## Brand Commitments

- La animación de transición entre la portada y el mapa (route-intro) se conserva.
- Las fotos de las 9 provincias en `public/hero/` se conservan.
- Nombre «Castilla y León» y lema actual no son vinculantes.

## Evidence on Hand

- Fotos reales de provincias: `public/hero/*.webp|jpg`.
- Dataset real de lugares: `public/assets/data/markers.json`; GeoJSON de provincias: `public/assets/data/cyl-provinces.geojson`.
- No hay testimonios, cifras de uso ni prensa: no inventarlos.

## Product Principles

1. Del descubrimiento al plan: cada pantalla acerca al viajero a un itinerario concreto.
2. Personal antes que exhaustivo: los gustos del viajero ordenan lo que ve.
3. El territorio es el protagonista: mapa y fotografía de lugar reales mandan sobre la decoración.
4. Igual de útil en móvil que en escritorio.

## Accessibility & Inclusion

Uso equivalente en móvil y escritorio. WCAG 2.2 AA como mínimo: contraste, foco visible, navegación por teclado, `prefers-reduced-motion`.
