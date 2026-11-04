const express = require('express');
const router = express.Router();
const db = require('../database');

// BASE DE DATOS DE INASISTENCIAS EN MEMORIA (O SQLITE)
let inasistenciasDB = [
  { idRow: 25, sede: "MARIANETTI", docente: "HERNANDEZ, Eduardo", emailDocente: "ehernandez@ies9029.edu.ar", fecha: "22/11/2026", carrera: "TECNICATURA SUPERIOR EN GESTIÓN DE RECURSOS HUMANOS (RES. N° 432-DGE-2019)", espacioCurricular: "Introducción a la Economía", hsCatedra: "", tardanzaMinutos: "30", gei: false },
  { idRow: 38, sede: "MARIANETTI", docente: "SALES, Lorena", emailDocente: "lsales@ies9029.edu.ar", fecha: "21/11/2026", carrera: "TECNICATURA SUPERIOR EN HIGIENE, SEGURIDAD Y AMBIENTE (RES. N° 120-DGE-2021)", espacioCurricular: "Problemática Ambiental", hsCatedra: "3", tardanzaMinutos: "", gei: false },
  { idRow: 41, sede: "MARIANETTI", docente: "SUAREZ, Marina", emailDocente: "msuarez@ies9029.edu.ar", fecha: "09/11/2026", carrera: "PERSONAL CON CARGO", espacioCurricular: "Bedel", hsCatedra: "", tardanzaMinutos: "", gei: false }
];

// OBTENER CARRERAS CON RESOLUCIÓN Y SUS ESPACIOS CURRICULARES DESDE LA BASE DE DATOS REAL
router.get('/carreras-y-espacios', (req, res) => {
  const sqlCarreras = 'SELECT id, nombre, codigo, resolucion FROM carreras ORDER BY nombre ASC';
  const sqlMaterias = 'SELECT id, carrera_id, nombre, codigo_espacio FROM materias ORDER BY carrera_id ASC, ano_cursado ASC, nombre ASC';

  db.all(sqlCarreras, [], (errC, carreras) => {
    if (errC || !carreras || carreras.length === 0) {
      return res.json({
        "PERSONAL CON CARGO": ["Bedel", "Coordinador/a de Carrera", "Secretaría / Bedelía", "Orientador/a Socioeducativo/a", "Personal Administrativo"]
      });
    }

    db.all(sqlMaterias, [], (errM, materias) => {
      const mapaFinal = {};

      carreras.forEach(c => {
        const resTexto = c.resolucion && String(c.resolucion).trim() !== '' ? ` (RES. N° ${c.resolucion.trim()})` : '';
        const nombreCarreraConRes = `${String(c.nombre || '').toUpperCase().trim()}${resTexto}`;
        
        const mats = (materias || [])
          .filter(m => m.carrera_id === c.id)
          .map(m => m.nombre.replace(/^\(\d+\)\s*-\s*/, '').trim());

        mapaFinal[nombreCarreraConRes] = mats;
      });

      // SECTOR INSTITUCIONAL
      mapaFinal["PERSONAL CON CARGO"] = [
        "Bedel",
        "Coordinador/a de Carrera",
        "Secretaría / Bedelía",
        "Orientador/a Socioeducativo/a",
        "Encargado/a de Laboratorio / Informática",
        "Personal Administrativo"
      ];

      res.json(mapaFinal);
    });
  });
});

// LISTADO DE INASISTENCIAS
router.get('/', (req, res) => {
  res.json(inasistenciasDB);
});

// REGISTRAR NUEVA INASISTENCIA O TARDANZA
router.post('/registrar', (req, res) => {
  try {
    const { tipo, sede, docente, emailDocente, fecha, carrera, espacioCurricular, hsCatedra, tardanzaMinutos } = req.body;

    if (!docente || !fecha || !espacioCurricular) {
      return res.status(400).json({ error: "Faltan campos obligatorios: Docente, Fecha o Espacio Curricular / Cargo." });
    }

    let fechaFormateada = fecha;
    if (fecha && fecha.includes('-')) {
      const partes = fecha.split('-');
      if (partes.length === 3) {
        fechaFormateada = `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
    }

    const nuevoIdRow = inasistenciasDB.length > 0 ? Math.max(...inasistenciasDB.map(i => i.idRow)) + 1 : 1;

    const nuevoRegistro = {
      idRow: nuevoIdRow,
      sede: sede || "MARIANETTI",
      docente,
      emailDocente: emailDocente || "docente@ies9029.edu.ar",
      fecha: fechaFormateada,
      carrera: carrera || "-",
      espacioCurricular,
      hsCatedra: hsCatedra || "",
      tardanzaMinutos: tardanzaMinutos || "",
      gei: false
    };

    inasistenciasDB.unshift(nuevoRegistro);
    console.log(`📧 [AVISO SIMULADO] Envio a: ${nuevoRegistro.emailDocente}`);

    res.json({ mensaje: "🟢 Novedad registrada con éxito." });
  } catch (error) {
    console.error("Error al registrar inasistencia:", error);
    res.status(500).json({ error: "Ocurrió un error interno al procesar la novedad." });
  }
});

// ACTUALIZAR ESTADO GEI
router.post('/actualizar-gei', (req, res) => {
  const { idRow, gei } = req.body;
  const item = inasistenciasDB.find(r => String(r.idRow) === String(idRow));

  if (item) {
    item.gei = gei;
    return res.json({ mensaje: "Estado GEI actualizado correctamente." });
  }

  res.status(404).json({ error: "Registro no encontrado." });
});

// RECLAMAR JUSTIFICACIÓN AL DOCENTE
router.post('/reclamar-justificacion', (req, res) => {
  const { idRow } = req.body;
  const item = inasistenciasDB.find(r => String(r.idRow) === String(idRow));

  if (!item) return res.status(404).json({ error: "Registro no encontrado." });

  console.log(`📧 [RECLAMO SIMULADO] Reclamo enviado a: ${item.emailDocente}`);
  res.json({ mensaje: `Reclamo enviado correctamente a ${item.docente}.` });
});

module.exports = router;
