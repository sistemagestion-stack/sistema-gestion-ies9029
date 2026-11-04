const express = require('express');
const router = express.Router();

let usuarios = [
  { id: 1, usuario: "admin", nombre: "Administrador General", rol: "Administrador", email: "admin@escuela.edu" },
  { id: 2, usuario: "secretaria_centro", nombre: "María López", rol: "Secretaría", email: "secretaria@escuela.edu" },
  { id: 3, usuario: "coord_norte", nombre: "Roberto Gómez", rol: "Coordinador de Sede", email: "coord.norte@escuela.edu" }
];

let planInfo = {
  institución: "Instituto de Educación Superior",
  planActual: "Plan Institucional PRO",
  legajosUsados: 450,
  legajosLimite: 1000,
  estadoCuenta: "Activa"
};

// Obtener usuarios
router.get('/', (req, res) => {
  res.json(usuarios);
});

// Obtener datos del plan
router.get('/plan', (req, res) => {
  res.json(planInfo);
});

// Registrar nuevo usuario
router.post('/', (req, res) => {
  const { usuario, nombre, rol, email } = req.body;
  if (!usuario || !nombre || !rol) {
    return res.status(400).json({ error: 'Campos obligatorios incompletos' });
  }

  const nuevoUsuario = {
    id: Date.now(),
    usuario,
    nombre,
    rol,
    email: email || 'Sin correo'
  };

  usuarios.push(nuevoUsuario);
  res.status(201).json(nuevoUsuario);
});

module.exports = router;
