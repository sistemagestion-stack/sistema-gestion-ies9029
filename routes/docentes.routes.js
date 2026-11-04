const express = require('express');
const router = express.Router();

// Base de datos temporal en memoria para docentes
let docentes = [
  { id: 1, legajo: "DOC-001", nombre: "Carlos", apellido: "Mendoza", materia: "Matemática", email: "cmendoza@escuela.edu" },
  { id: 2, legajo: "DOC-002", nombre: "Laura", apellido: "Fernández", materia: "Historia", email: "lfernandez@escuela.edu" }
];

// Obtener todos los docentes
router.get('/', (req, res) => {
  res.json(docentes);
});

// Guardar un nuevo docente
router.post('/', (req, res) => {
  const { legajo, nombre, apellido, materia, email } = req.body;
  if (!legajo || !nombre || !apellido || !materia) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const nuevoDocente = {
    id: Date.now(),
    legajo,
    nombre,
    apellido,
    materia,
    email: email || 'Sin correo'
  };

  docentes.push(nuevoDocente);
  res.status(201).json(nuevoDocente);
});

module.exports = router;
