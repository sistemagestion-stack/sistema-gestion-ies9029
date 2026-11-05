const express = require('express');
const path = require('path');
const db = require('./database');

// Importar rutas de módulos existentes
const carrerasRoutes = require('./routes/carreras.routes');
const examenesRoutes = require('./routes/examenes.routes');
const inasistenciasRoutes = require('./routes/inasistencias.routes');
const licenciasRoutes = require('./routes/licencias.routes');

const app = express();
const PORT = 3000;

// Configurar límites para peticiones JSON y formularios
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'public')));

// Registrar endpoints de la API
app.use('/api/carreras', carrerasRoutes);
app.use('/api/examenes', examenesRoutes);
app.use('/api/inasistencias', inasistenciasRoutes);
app.use('/api/licencias', licenciasRoutes);

// Servir la vista HTML de Super Admin de forma directa
app.get('/modulos/super-admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/js/modulos/super-admin.html'));
});

app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`=================================`);
});
