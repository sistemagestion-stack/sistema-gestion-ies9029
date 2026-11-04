const express = require('express');
const router = express.Router();
const db = require('../database');

// Inicialización de la base de datos
db.serialize(() => {
  // Configuración global del encabezado institucional
  db.run(`
    CREATE TABLE IF NOT EXISTS mesas_configuracion_global (
      id INTEGER PRIMARY KEY DEFAULT 1,
      turno VARCHAR(100) DEFAULT 'ORDINARIO',
      llamado VARCHAR(50) DEFAULT 'DOS LLAMADOS',
      mes1 VARCHAR(50) DEFAULT 'Noviembre',
      mes2 VARCHAR(50) DEFAULT 'Diciembre',
      ano VARCHAR(10) DEFAULT '2026',
      fecha_inicio_1L VARCHAR(100) DEFAULT '',
      fecha_fin_1L VARCHAR(100) DEFAULT '',
      fecha_inicio_2L VARCHAR(100) DEFAULT '',
      fecha_fin_2L VARCHAR(100) DEFAULT ''
    )
  `);

  db.run(`
    INSERT OR IGNORE INTO mesas_configuracion_global (id, turno, llamado, mes1, mes2, ano) 
    VALUES (1, 'ORDINARIO', 'DOS LLAMADOS', 'Noviembre', 'Diciembre', '2026')
  `);

  // Cronogramas
  db.run(`
    CREATE TABLE IF NOT EXISTS mesas_cronogramas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre VARCHAR(255) NOT NULL,
      sede VARCHAR(150) DEFAULT 'SEDE TORRES',
      hora_defecto VARCHAR(50) DEFAULT '19:00 HS',
      carreras_ids TEXT,
      estado VARCHAR(50) DEFAULT 'ACTIVO',
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Detalles de cada mesa examinadora
  db.run(`
    CREATE TABLE IF NOT EXISTS mesas_detalles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cronograma_id INTEGER NOT NULL,
      materia_id INTEGER,
      carrera_id INTEGER,
      dia_semana VARCHAR(50) NOT NULL,
      hora VARCHAR(50) DEFAULT '19:00 HS',
      sede VARCHAR(150) DEFAULT 'SEDE TORRES',
      presidente VARCHAR(255) DEFAULT '',
      vocal1 VARCHAR(255) DEFAULT '',
      vocal2 VARCHAR(255) DEFAULT '',
      reprogramada_nota VARCHAR(255) DEFAULT '',
      orden INTEGER DEFAULT 0,
      FOREIGN KEY (cronograma_id) REFERENCES mesas_cronogramas(id) ON DELETE CASCADE
    )
  `);
});

// CONFIGURACIÓN GLOBAL COMPARTIDA
router.get('/config-global', (req, res) => {
  db.get('SELECT * FROM mesas_configuracion_global WHERE id = 1', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || {});
  });
});

router.put('/config-global', (req, res) => {
  const { turno, llamado, mes1, mes2, ano, fecha_inicio_1L, fecha_fin_1L, fecha_inicio_2L, fecha_fin_2L } = req.body;

  const query = `
    UPDATE mesas_configuracion_global 
    SET turno = ?, llamado = ?, mes1 = ?, mes2 = ?, ano = ?,
        fecha_inicio_1L = ?, fecha_fin_1L = ?, fecha_inicio_2L = ?, fecha_fin_2L = ?
    WHERE id = 1
  `;

  db.run(query, [
    turno || 'ORDINARIO',
    llamado || 'DOS LLAMADOS',
    mes1 || 'Noviembre',
    mes2 || 'Diciembre',
    ano || '2026',
    fecha_inicio_1L || '',
    fecha_fin_1L || '',
    fecha_inicio_2L || '',
    fecha_fin_2L || ''
  ], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Encabezado global actualizado' });
  });
});

// DOCENTES
router.get('/docentes-lista', (req, res) => {
  db.all('SELECT id, nombre, apellido FROM docentes ORDER BY apellido ASC, nombre ASC', [], (err, rows) => {
    if (err) return res.json([]);
    res.json(rows || []);
  });
});

// CRONOGRAMAS
router.get('/', (req, res) => {
  db.all('SELECT * FROM mesas_cronogramas ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

router.post('/', (req, res) => {
  const { nombre, carreras_ids } = req.body;
  if (!nombre || !String(nombre).trim()) {
    return res.status(400).json({ error: 'El nombre del cronograma es obligatorio.' });
  }

  const nombreLimpio = String(nombre).trim();
  const idsArray = Array.isArray(carreras_ids) ? carreras_ids.map(n => parseInt(n)).filter(Boolean) : [];
  const idsStr = idsArray.join(',');

  const query = `INSERT INTO mesas_cronogramas (nombre, carreras_ids) VALUES (?, ?)`;

  db.run(query, [nombreLimpio, idsStr], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const cronogramaId = this.lastID;

    if (idsArray.length > 0) {
      const placeholders = idsArray.map(() => '?').join(',');
      const sqlMaterias = `
        SELECT m.*, c.nombre as carrera_nombre 
        FROM materias m 
        JOIN carreras c ON m.carrera_id = c.id 
        WHERE m.carrera_id IN (${placeholders}) 
        ORDER BY m.carrera_id ASC, m.ano_cursado ASC, m.codigo_espacio ASC, m.id ASC
      `;
      
      db.all(sqlMaterias, idsArray, (mErr, materias) => {
        if (!mErr && materias && materias.length > 0) {
          const stmt = db.prepare(`
            INSERT INTO mesas_detalles (cronograma_id, materia_id, carrera_id, dia_semana, hora, sede, presidente, orden)
            VALUES (?, ?, ?, 'LUNES', '19:00 HS', 'SEDE TORRES', ?, ?)
          `);
          
          materias.forEach((m, idx) => {
            const profeTitular = (m.docente && m.docente !== 'Por designar') ? m.docente : '';
            stmt.run(cronogramaId, m.id, m.carrera_id, profeTitular, idx);
          });
          stmt.finalize();
        }
        res.status(201).json({ id: cronogramaId, nombre: nombreLimpio, carreras_ids: idsStr });
      });
    } else {
      res.status(201).json({ id: cronogramaId, nombre: nombreLimpio, carreras_ids: idsStr });
    }
  });
});

router.get('/:id/detalles', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM mesas_cronogramas WHERE id = ?', [id], (err, cronograma) => {
    if (err || !cronograma) return res.status(404).json({ error: 'Cronograma no encontrado.' });

    const queryDetalles = `
      SELECT md.*, m.nombre as materia_nombre, m.codigo_espacio, m.ano_cursado, c.nombre as carrera_nombre, c.codigo as carrera_codigo, c.resolucion as carrera_resolucion, c.color_tema, c.logo_url
      FROM mesas_detalles md
      LEFT JOIN materias m ON md.materia_id = m.id
      LEFT JOIN carreras c ON md.carrera_id = c.id
      WHERE md.cronograma_id = ?
      ORDER BY 
        CASE md.dia_semana
          WHEN 'LUNES' THEN 1
          WHEN 'MARTES' THEN 2
          WHEN 'MIÉRCOLES' THEN 3
          WHEN 'JUEVES' THEN 4
          WHEN 'VIERNES' THEN 5
          ELSE 6
        END ASC,
        c.id ASC,
        m.ano_cursado ASC,
        m.codigo_espacio ASC,
        md.id ASC
    `;

    db.all(queryDetalles, [id], (dErr, detalles) => {
      if (dErr) return res.status(500).json({ error: dErr.message });
      res.json({ cronograma, detalles: detalles || [] });
    });
  });
});

router.put('/detalles/:id/campo', (req, res) => {
  const { id } = req.params;
  const { campo, valor } = req.body;

  const camposPermitidos = ['dia_semana', 'presidente', 'vocal1', 'vocal2', 'reprogramada_nota'];
  if (!camposPermitidos.includes(campo)) {
    return res.status(400).json({ error: 'Campo no permitido' });
  }

  const query = `UPDATE mesas_detalles SET ${campo} = ? WHERE id = ?`;
  db.run(query, [valor || '', id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Actualizado con éxito' });
  });
});

router.delete('/detalles/:detalleId', (req, res) => {
  const { detalleId } = req.params;
  db.run('DELETE FROM mesas_detalles WHERE id = ?', [detalleId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Mesa eliminada' });
  });
});

module.exports = router;
