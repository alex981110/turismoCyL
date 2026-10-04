require('dotenv').config();
const express  = require('express');
const path     = require('path');
const fs       = require('fs');
const mongoose = require('mongoose');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── MongoDB ─────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB conectado');
    const Marker = require('./pages/mapa/markers').Marker;
    const count  = await Marker.countDocuments();
    if (count === 0) {
      const jsonPath = path.join(__dirname, 'public/assets/data/markers.json');
      if (fs.existsSync(jsonPath)) {
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        await Marker.insertMany(data);
        console.log(`✅ ${data.length} marcadores importados`);
      }
    }
  })
  .catch(err => console.error('❌ Error MongoDB:', err));

// ── Middleware ───────────────────────────────────────────────
app.use(require('compression')());   // gzip para HTML, CSS, JS y JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rutas API ────────────────────────────────────────────────
app.use('/api/auth',        require('./pages/auth/route'));
app.use('/api/favorites',   require('./pages/shared/favorites'));
app.use('/api/markers',     require('./pages/mapa/markers'));
app.use('/api/photos',      require('./pages/mapa/photos'));
app.use('/api/itineraries', require('./pages/itinerario/itineraries'));

// ── Estáticos + vistas ───────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Páginas SPA ──────────────────────────────────────────────
const renderIndex = (req, res) => res.render('index');
app.get('/',                renderIndex);
app.get('/mapa',            renderIndex);
app.get('/itinerario',      renderIndex);
app.get('/mis-itinerarios', renderIndex);
app.get('/admin',           renderIndex);

app.listen(PORT, () =>
  console.log(`✦ Castilla y León corriendo en :${PORT}`)
);
