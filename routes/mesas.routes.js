const express = require('express');
const router = express.Router();
const db = require('../database');

// Inicializar tablas necesarias para mesas de examen si no existen
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS mesas_cronogramas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre VARCHAR(255) NOT NULL,
      turno VARCHAR(100) DEFAULT 'ORDINARIO',
      llamado VARCHAR(50) DEFAULT '1° LLAMADO',
      mes VARCHAR(50) DEFAULT 'SEPTIEMBRE',
      ano VARCHAR(10) DEFAULT '2026',
      sede VARCHAR(150) DEFAULT 'SEDE TORRES',
      hora_defecto VARCHAR(50) DEFAULT '19:00 HS',
      carreras_ids TEXT, -- IDs separadas por coma, ej: "1,2"
      estado VARCHAR(50) DEFAULT 'ACTIVO',
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS mesas_detalles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cronograma_id INTEGER NOT NULL,
      materia_id INTEGER,
      carrera_id INTEGER,
      dia_semana VARCHAR(50) NOT NULL, -- LUNES, MARTES, etc.
      fecha VARCHAR(50) NOT NULL,      -- 28-SEPTIEMBRE
      hora VARCHAR(50) DEFAULT '19:00 HS',
      sede VARCHAR(150) DEFAULT 'SEDE TORRES',
      presidente VARCHAR(255) DEFAULT '',
      vocal1 VARCHAR(255) DEFAULT '',
      vocal2 VARCHAR(255) DEFAULT '',
      reprogramada_nota VARCHAR(255) DEFAULT '', -- Ej: "PASA AL 29/09"
      orden INTEGER DEFAULT 0,
      FOREIGN KEY (cronograma_id) REFERENCES mesas_cronogramas(id) ON DELETE CASCADE
    )
  `);
});

// 1. OBTENER TODOS LOS CRONOGRAMAS DE MESAS
router.get('/', (req, res) => {
  db.all('SELECT * FROM mesas_cronogramas ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// 2. CREAR NUEVO CRONOGRAMA DE MESAS (MULTICARRERA)
router.post('/', (req, res) => {
  const { nombre, turno, llamado, mes, ano, sede, hora_defecto, carreras_ids } = req.body;
  
  if (!nombre || !carreras_ids || carreras_ids.length === 0) {
    return res.status(400).json({ error: 'Nombre del cronograma y al menos una carrera son obligatorios.' });
  }

  const idsStr = Array.isArray(carreras_ids) ? carreras_ids.join(',') : String(carreras_ids);

  const query = `
    INSERT INTO mesas_cronogramas (nombre, turno, llamado, mes, ano, sede, hora_defecto, carreras_ids)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [
    nombre,
    turno || 'ORDINARIO',
    llamado || '1° LLAMADO',
    mes || 'SEPTIEMBRE',
    ano || '2026',
    sede || 'SEDE TORRES',
    hora_defecto || '19:00 HS',
    idsStr
  ], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, mensaje: 'Cronograma creado con éxito' });
  });
});

// 3. OBTENER DETALLES Y MATERIAS DE UN CRONOGRAMA ESPECÍFICO
router.get('/:id/detalles', (req, res) => {
  const { id } = req.params;

  const queryCronograma = 'SELECT * FROM mesas_cronogramas WHERE id = ?';
  db.get(queryCronograma, [id], (err, cronograma) => {
    if (err || !cronograma) return res.status(404).json({ error: 'Cronograma no encontrado.' });

    const idsCarreras = cronograma.carreras_ids.split(',').map(n => parseInt(n.trim())).filter(Boolean);

    const placeholders = idsCarreras.map(() => '?').join(',');
    const queryMaterias = `
      SELECT m.*, c.nombre as carrera_nombre, c.codigo as carrera_codigo, c.color_tema, c.resolucion
      FROM materias m
      JOIN carreras c ON m.carrera_id = c.id
      WHERE m.carrera_id IN (${placeholders})
      ORDER BY c.id ASC, m.ano_cursado ASC, m.id ASC
    `;

    db.all(queryMaterias, idsCarreras, (mErr, materias) => {
      if (mErr) return res.status(500).json({ error: mErr.message });

      const queryDetalles = `
        SELECT md.*, m.nombre as materia_nombre, m.codigo_espacio, m.ano_cursado, c.nombre as carrera_nombre, c.codigo as carrera_codigo
        FROM mesas_detalles md
        LEFT JOIN materias m ON md.materia_id = m.id
        LEFT JOIN carreras c ON md.carrera_id = c.id
        WHERE md.cronograma_id = ?
        ORDER BY md.orden ASC, md.id ASC
      `;

      db.all(queryDetalles, [id], (dErr, detalles) => {
        if (dErr) return res.status(500).json({ error: dErr.message });
        res.json({ cronograma, materias, detalles: detalles || [] });
      });
    });
  });
});

// 4. GUARDAR O ACTUALIZAR UNA MESA INDIVIDUAL (TRIBUNAL / FECHA / HORA / REPROGRAMACIÓN)
router.post('/:id/guardar-mesa', (req, res) => {
  const cronograma_id = req.params.id;
  const { id_detalle, materia_id, carrera_id, dia_semana, fecha, hora, sede, presidente, vocal1, vocal2, reprogramada_nota, orden } = req.body;

  if (id_detalle) {
    const updateQuery = `
      UPDATE mesas_detalles 
      SET dia_semana = ?, fecha = ?, hora = ?, sede = ?, presidente = ?, vocal1 = ?, vocal2 = ?, reprogramada_nota = ?, orden = ?
      WHERE id = ? AND cronograma_id = ?
    `;
    db.run(updateQuery, [dia_semana, fecha, hora, sede, presidente, vocal1, vocal2, reprogramada_nota, orden || 0, id_detalle, cronograma_id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: 'Mesa actualizada correctamente' });
    });
  } else {
    const insertQuery = `
      INSERT INTO mesas_detalles (cronograma_id, materia_id, carrera_id, dia_semana, fecha, hora, sede, presidente, vocal1, vocal2, reprogramada_nota, orden)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.run(insertQuery, [cronograma_id, materia_id, carrera_id, dia_semana, fecha, hora, sede, presidente, vocal1, vocal2, reprogramada_nota, orden || 0], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, mensaje: 'Mesa asignada correctamente' });
    });
  }
});

// 5. ELIMINAR O REORDENAR DETALLES DE MESAS
router.delete('/detalles/:detalleId', (req, res) => {
  const { detalleId } = req.params;
  db.run('DELETE FROM mesas_detalles WHERE id = ?', [detalleId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Mesa quitada del cronograma' });
  });
});

// 6. REORDENAR ORDEN DE MESAS (SUBIR / BAJAR DÍAS O FILAS)
router.put('/:id/reordenar', (req, res) => {
  const { ordenes } = req.body; // Array de { id, orden }
  if (!ordenes || !Array.isArray(ordenes)) return res.status(400).json({ error: 'Array de órdenes inválido' });

  db.serialize(() => {
    const stmt = db.prepare('UPDATE mesas_detalles SET orden = ? WHERE id = ?');
    ordenes.forEach(item => {
      stmt.run(item.orden, item.id);
    });
    stmt.finalize(err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: 'Reordenamiento guardado con éxito' });
    });
  });
});

module.exports = router;
