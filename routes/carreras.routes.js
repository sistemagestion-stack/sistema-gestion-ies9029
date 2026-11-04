const express = require('express');
const router = express.Router();
const db = require('../database');

function normalizar(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
}

function convertirUrlGoogleDrive(url) {
  if (!url) return '';
  const strUrl = String(url).trim().replace(/^["']|["']$/g, '');
  if (strUrl.includes('drive.google.com')) {
    let fileId = '';
    const matchPath = strUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const matchQuery = strUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchPath && matchPath[1]) fileId = matchPath[1];
    else if (matchQuery && matchQuery[1]) fileId = matchQuery[1];

    if (fileId) return `https://lh3.googleusercontent.com/d/${fileId}=s500`;
  }
  return strUrl;
}

// 1. OBTENER TODAS LAS CARRERAS
router.get('/', (req, res) => {
  db.all('SELECT * FROM carreras ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// 2. CREAR CARRERA MANUAL
router.post('/', (req, res) => {
  const { codigo, nombre, resolucion, duracion_anos, color_tema, logo_url } = req.body;
  if (!codigo || !nombre) {
    return res.status(400).json({ error: 'El código y el nombre son obligatorios.' });
  }

  const logoFinal = convertirUrlGoogleDrive(logo_url);

  const query = `
    INSERT INTO carreras (codigo, nombre, resolucion, duracion_anos, color_tema, logo_url) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.run(query, [codigo.toUpperCase(), nombre, resolucion || '', duracion_anos || 3, color_tema || '#059669', logoFinal], function(err) {
    if (err) return res.status(400).json({ error: 'El código o nombre de la carrera ya existe.' });
    res.status(201).json({ id: this.lastID, codigo: codigo.toUpperCase(), nombre, resolucion, duracion_anos, color_tema, logo_url: logoFinal, estado: 'Activa' });
  });
});

// 3. EDITAR CARRERA
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { codigo, nombre, resolucion, duracion_anos, color_tema, logo_url } = req.body;

  const logoFinal = convertirUrlGoogleDrive(logo_url);

  const query = `
    UPDATE carreras 
    SET codigo = ?, nombre = ?, resolucion = ?, duracion_anos = ?, color_tema = ?, logo_url = ?
    WHERE id = ?
  `;
  db.run(query, [codigo.toUpperCase(), nombre, resolucion || '', duracion_anos || 3, color_tema || '#059669', logoFinal, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Carrera actualizada con éxito' });
  });
});

// 4. ELIMINAR CARRERA
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM carreras WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.run('DELETE FROM materias WHERE carrera_id = ?', [id]);
    res.json({ mensaje: 'Carrera y materias eliminadas con éxito' });
  });
});

// 5. OBTENER MATERIAS DE UNA CARRERA
router.get('/:id/materias', (req, res) => {
  const { id } = req.params;
  db.all('SELECT * FROM materias WHERE carrera_id = ? ORDER BY ano_cursado ASC, id ASC', [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// 6. AGREGAR ESPACIO CURRICULAR COMPLETO
router.post('/:id/materias', (req, res) => {
  const { id } = req.params;
  const { nombre, ano_cursado, hs_c, hs_g, sede, regimen, formato, estado_materia } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre de la materia es obligatorio.' });
  }

  let codEsp = '000';
  const match = nombre.match(/\((.*?)\)/);
  if (match) codEsp = match[1].trim();

  const query = `
    INSERT INTO materias (carrera_id, sede, codigo_espacio, nombre, ano_cursado, hs_c, hs_g, regimen, formato, estado_materia, docente, desde, hasta)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [
    id,
    sede || 'T029',
    codEsp,
    nombre,
    ano_cursado || 1,
    hs_c || '',
    hs_g || '',
    regimen || 'ANUAL',
    formato || 'MÓDULO',
    estado_materia || 'VIGENTE',
    'Por designar',
    '',
    ''
  ], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, mensaje: 'Espacio curricular agregado con éxito' });
  });
});

// 7. EDITAR ESPACIO CURRICULAR COMPLETO + DOCENTE, DESDE Y HASTA
router.put('/materias/:materiaId', (req, res) => {
  const { materiaId } = req.params;
  const { nombre, ano_cursado, hs_c, hs_g, regimen, formato, sede, estado_materia, docente, desde, hasta } = req.body;

  let codEsp = '000';
  const match = (nombre || '').match(/\((.*?)\)/);
  if (match) codEsp = match[1].trim();

  const query = `
    UPDATE materias 
    SET codigo_espacio = ?, 
        nombre = ?, 
        ano_cursado = ?, 
        hs_c = ?, 
        hs_g = ?, 
        regimen = ?, 
        formato = ?, 
        sede = ?, 
        estado_materia = ?,
        docente = ?,
        desde = ?,
        hasta = ?
    WHERE id = ?
  `;

  db.run(query, [
    codEsp,
    nombre,
    ano_cursado || 1,
    hs_c || '',
    hs_g || '',
    regimen || 'ANUAL',
    formato || 'MÓDULO',
    sede || 'T029',
    estado_materia || 'VIGENTE',
    docente || 'Por designar',
    desde || '',
    hasta || '',
    materiaId
  ], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Espacio curricular y horarios de consulta actualizados con éxito' });
  });
});

// 8. LIMPIAR SOLAMENTE LA CONSULTA DE UNA MATERIA (NO BORRA LA MATERIA DEL PLAN)
router.put('/materias/:materiaId/limpiar-consulta', (req, res) => {
  const { materiaId } = req.params;
  const query = `
    UPDATE materias 
    SET docente = 'Por designar', desde = '', hasta = ''
    WHERE id = ?
  `;
  db.run(query, [materiaId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Datos de consulta reseteados sin eliminar la materia del plan' });
  });
});

// 9. REMOVER ESPACIO CURRICULAR FÍSICAMENTE (SOLO PARA MÓDULO CARRERAS)
router.delete('/materias/:materiaId', (req, res) => {
  const { materiaId } = req.params;
  db.run('DELETE FROM materias WHERE id = ?', [materiaId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Espacio curricular eliminado con éxito' });
  });
});

// 10. IMPORTACIÓN FLEXIBLE DE EXCEL
router.post('/importar-excel', (req, res) => {
  try {
    const { registros } = req.body;
    if (!registros || !Array.isArray(registros) || registros.length === 0) {
      return res.status(400).json({ error: 'No se recibieron registros válidos.' });
    }

    db.serialize(() => {
      let procesadas = 0;
      const procesarFila = (index) => {
        if (index >= registros.length) {
          return res.json({ mensaje: 'Importación completada con éxito', filasProcesadas: procesadas });
        }

        const rawRow = registros[index] || {};
        let nombreCarrera = '';
        let resolucion = '';
        let ucStr = '';
        let anoRaw = '1';
        let hsc = '';
        let hsg = '';
        let sede = 'T029';
        let regimen = '';
        let formato = 'MÓDULO';
        let estadoMat = 'VIGENTE';
        let logoRaw = '';
        let colorTema = '#059669';

        Object.keys(rawRow).forEach(key => {
          const normKey = normalizar(key);
          const val = String(rawRow[key] || '').trim();

          if (normKey.includes('CARRERA')) nombreCarrera = val;
          else if (normKey.includes('PLAN') || normKey.includes('RESOLUCION')) resolucion = val;
          else if (normKey.includes('DENOMINACION') || normKey.includes('UNIDAD') || normKey.includes('ESPACIO') || normKey.includes('MATERIA')) ucStr = val;
          else if (normKey === 'ANO' || normKey === 'ANIO') anoRaw = val;
          else if (normKey.includes('HSC') || normKey.includes('CATEDRA')) hsc = val;
          else if (normKey.includes('HSG') || normKey.includes('RELOJ')) hsg = val;
          else if (normKey.includes('SEDE')) sede = val;
          else if (normKey.includes('REGIMEN')) regimen = val;
          else if (normKey.includes('FORMATO')) formato = val;
          else if (normKey.includes('ESTADO')) estadoMat = val;
          else if (normKey.includes('LOGO')) logoRaw = val;
          else if (normKey.includes('COLOR')) colorTema = val;
        });

        if (!nombreCarrera) return procesarFila(index + 1);

        const logoFinal = convertirUrlGoogleDrive(logoRaw);

        let sigla = nombreCarrera.split(' ').map(w => w[0]).join('').substring(0, 6).toUpperCase();
        if (sigla.length < 2) sigla = 'CAR' + Math.floor(Math.random() * 100);

        db.get('SELECT id FROM carreras WHERE UPPER(nombre) = ?', [nombreCarrera.toUpperCase()], (err, carRow) => {
          const guardarMateria = (cID) => {
            if (!ucStr) return procesarFila(index + 1);

            let codEsp = '000';
            const match = ucStr.match(/\((.*?)\)/);
            if (match) codEsp = match[1].trim();

            const anoNum = parseInt(String(anoRaw).replace(/\D/g, '')) || 1;

            const qMat = `
              INSERT INTO materias (carrera_id, sede, resolucion, codigo_espacio, nombre, ano_cursado, hs_c, hs_g, regimen, formato, estado_materia, docente, desde, hasta)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.run(qMat, [
              cID, 
              sede || 'T029', 
              resolucion, 
              codEsp, 
              ucStr, 
              anoNum, 
              hsc, 
              hsg, 
              regimen || 'ANUAL', 
              formato || 'MÓDULO', 
              estadoMat || 'VIGENTE',
              'Por designar',
              '',
              ''
            ], (mErr) => {
              if (!mErr) procesadas++;
              procesarFila(index + 1);
            });
          };

          if (carRow && carRow.id) {
            guardarMateria(carRow.id);
          } else {
            const qCar = `INSERT INTO carreras (codigo, nombre, resolucion, duracion_anos, color_tema, logo_url) VALUES (?, ?, ?, ?, ?, ?)`;
            db.run(qCar, [sigla, nombreCarrera, resolucion, 3, colorTema, logoFinal], function(cErr) {
              const newID = this ? this.lastID : null;
              if (cErr || !newID) {
                sigla = sigla + Math.floor(Math.random() * 10);
                db.run(qCar, [sigla, nombreCarrera, resolucion, 3, colorTema, logoFinal], function() {
                  if (this && this.lastID) guardarMateria(this.lastID);
                  else procesarFila(index + 1);
                });
              } else {
                guardarMateria(newID);
              }
            });
          }
        });
      };

      procesarFila(0);
    });
  } catch (globalErr) {
    console.error('Error procesando la importación:', globalErr);
    res.status(500).json({ error: 'Error interno en el servidor.' });
  }
});

module.exports = router;
