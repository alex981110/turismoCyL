# 🗺️ CyL Turismo

**Aplicación web de descubrimiento turístico en Castilla y León**

Explora más de 2.600 puntos de interés en las 9 provincias de Castilla y León, genera itinerarios personalizados y visualiza rutas en mapa.

---

## ✨ Funcionalidades

- **Explorador de mapa** — Mapa interactivo Leaflet con marcadores por categoría y mapa D3 de provincias
- **Filtros en tiempo real** — Por categoría, provincia y texto libre
- **Generador de itinerarios** — Plan diario optimizado geográficamente (algoritmo Haversine)
- **Visualización de rutas** — Overlay de pantalla completa con cálculo de ruta real por carretera (OSRM)
- **Exportar PDF** — Descarga el itinerario completo
- **Favoritos y reseñas** — Guarda lugares y valora con puntuación y comentario
- **Mis Itinerarios** — Guarda hasta 3 itinerarios en tu cuenta
- **Panel de administración** — CRUD de marcadores (rol admin)
- **Diseño responsivo** — Adaptado a móvil, tablet y escritorio

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Servidor | Node.js + Express |
| Base de datos | MongoDB Atlas (Mongoose) |
| Autenticación | JWT + bcryptjs |
| Vistas | EJS |
| Mapa interactivo | Leaflet.js 1.9 + MarkerCluster + Routing Machine |
| Mapa de provincias | D3.js 7.8 |
| UI | Bootstrap 5.3 |
| PDF | jsPDF 2.5 |
| Tiles | CARTO Light (OpenStreetMap) |
| Routing | OSRM (open source) |

---

## 📁 Estructura del proyecto

```
cyl-turismo/
│
├── server.js                        # Entry point — Express + MongoDB
├── middleware/
│   └── auth.js                      # JWT: requireAuth, requireAdmin
├── models/
│   ├── User.js
│   ├── Marker.js
│   ├── Itinerary.js
│   └── Favorite.js
│
├── pages/                           # Vistas EJS + rutas API por página
│   ├── shared/                      # navbar, footer, head, modals, API auth/favoritos
│   ├── home/                        # hero.ejs
│   ├── mapa/                        # mapa.ejs + API marcadores y fotos
│   ├── itinerario/                  # itinerario.ejs, planner.ejs + API itinerarios
│   ├── mis-itinerarios/
│   └── admin/
│
├── public/
│   ├── css/
│   │   ├── shared.css               # Variables, navbar, modales, footer
│   │   ├── home.css                 # Hero, animación de viaje
│   │   ├── mapa.css                 # Mapa, sidebar, tarjetas
│   │   └── admin.css
│   ├── js/
│   │   ├── shared/                  # data, auth, utils, router, favorites, ratings, reviews
│   │   ├── mapa/                    # map-d3, map-leaflet, planner, overpass
│   │   ├── itinerario/              # itinerary, pdf, route
│   │   ├── home/                    # onboarding
│   │   └── admin/
│   ├── hero/                        # Imágenes de provincias
│   └── assets/data/markers.json    # Dataset inicial de marcadores
│
└── views/
    └── index.ejs                    # Shell SPA
```

---

## 🚀 Instalación y arranque

### Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- Cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas) (tier gratuito M0 es suficiente)

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/cyl-turismo.git
cd cyl-turismo
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un fichero `.env` en la raíz del proyecto:

```env
MONGO_URI=mongodb+srv://<usuario>:<contraseña>@<cluster>.mongodb.net/cyl-turismo
JWT_SECRET=<mínimo 32 caracteres aleatorios>
GOOGLE_PLACES_KEY=tu_api_key_de_google_places   # opcional, para fotos
GOOGLE_DAILY_CAP=1000                            # opcional, tope diario de llamadas a Google
TRUST_PROXY=0                                    # 1 si va detrás de un proxy (Render, Railway, nginx…)
NODE_ENV=production                              # en producción
PORT=3000
```

Genera el `JWT_SECRET` con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. En producción el servidor no arranca sin él; en desarrollo usa uno aleatorio (las sesiones se pierden al reiniciar).

El `.env` está en `.gitignore`: **nunca lo subas al repositorio**.

> **Nota:** Si no tienes clave de Google Places, las fotos de los marcadores no se cargarán pero la aplicación funcionará correctamente. Restringe la clave en Google Cloud a las APIs que usa (Places y Maps Static) y ponle un presupuesto con alertas.

### 4. Arrancar el servidor

```bash
npm start
```

La primera vez que arranca, si la colección de marcadores está vacía, el servidor importa automáticamente los datos desde `public/assets/data/markers.json`.

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

---

## 👤 Crear un usuario administrador

Regístrate desde la web y cambia el rol de tu usuario a `admin` en MongoDB Atlas (colección `users`, campo `role`). Después cierra sesión y vuelve a entrar para que el token incluya el nuevo rol. Eso da acceso al panel de administración (`/admin`).

---

## 🗺️ API REST

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Registro de usuario |
| POST | `/api/auth/login` | — | Login, devuelve JWT |
| GET | `/api/auth/me` | ✓ | Datos del usuario en sesión |
| GET | `/api/markers` | — | Lista de marcadores (filtros: `province`, `cat`, `q`) |
| POST | `/api/markers` | Admin | Crear marcador |
| PUT | `/api/markers/:id` | Admin | Editar marcador |
| DELETE | `/api/markers/:id` | Admin | Borrar marcador |
| GET | `/api/photos/details` | — | Foto de Google Places para un lugar |
| GET | `/api/itineraries` | ✓ | Itinerarios del usuario |
| POST | `/api/itineraries` | ✓ | Guardar itinerario |
| DELETE | `/api/itineraries/:id` | ✓ | Borrar itinerario |
| GET | `/api/favorites` | ✓ | Favoritos del usuario |
| POST | `/api/favorites` | ✓ | Añadir favorito |
| DELETE | `/api/favorites/:id` | ✓ | Eliminar favorito |

---

## 🧭 Rutas de la aplicación (SPA)

| URL | Sección |
|-----|---------|
| `/` | Home — hero y animación |
| `/mapa` | Explorador de mapa |
| `/itinerario` | Generador de itinerarios |
| `/mis-itinerarios` | Itinerarios guardados |
| `/admin` | Panel de administración (solo admin) |

---

## 📦 Scripts disponibles

```bash
npm start          # Arranca el servidor
npm run dev        # Arranca con recarga automática (nodemon)
```

---

## 📄 Licencia

Proyecto académico — Grado en Ingeniería de las Tecnologías de la Información Geoespacial  
Universidad Politécnica de Madrid — ETSITGC — Curso 2025/26
