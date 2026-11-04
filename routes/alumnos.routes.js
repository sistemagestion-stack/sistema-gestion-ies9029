const express = require('express');
const router = express.Router();

// Base de datos temporal en memoria (luego se conectará a BD)
let alumnos = [
  { id: 1, legajo: "ALU-001", nombre: "Ana", apellido: "Pérez", dni: "40123456", estado: "Activo" },
  { id: 2, legajo: "ALU-002", nombre: "Lucas", apellido: "Gómez", dni: "39876543", estado: "Activo" }
];

// Obtener todos los alumnos
router.get('/', (req, res) => {
  res.json(alumnos);
});

// Guardar un nuevo alumno
router.post('/', (req, res) => {
  const { legajo, nombre, apellido, dni, estado } = req.body;
  if (!legajo || !nombre || !apellido || !dni) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const nuevoAlumno = {
    id: Date.now(),
    legajo,
    nombre,
    apellido,
    dni,
    estado: estado || 'Activo'
  };

  alumnos.push(nuevoAlumno);
  res.status(201).json(nuevoAlumno);
});

module.exports = router;
