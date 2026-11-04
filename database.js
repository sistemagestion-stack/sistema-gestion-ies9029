const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'ies_database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con SQLite:', err.message);
  } else {
    console.log(' Conectado con éxito a la base de datos SQLite (ies_database.sqlite)');
  }
});

db.serialize(() => {
  // 1. CREAR TABLA CARRERAS (SI NO EXISTE)
  db.run(`
    CREATE TABLE IF NOT EXISTS carreras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      resolucion TEXT,
      duracion_anos INTEGER DEFAULT 3,
      color_tema TEXT DEFAULT '#059669',
      logo_url TEXT DEFAULT '',
      estado TEXT DEFAULT 'Activa',
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // MIGRACIONES AUTOMÁTICAS: AGREGAR COLUMNAS SI LA TABLA YA EXISTÍA PREVIAMENTE
  db.run(`ALTER TABLE carreras ADD COLUMN logo_url TEXT DEFAULT ''`, () => {});
  db.run(`ALTER TABLE carreras ADD COLUMN color_tema TEXT DEFAULT '#059669'`, () => {});

  // 2. CREAR TABLA MATERIAS / UNIDADES CURRICULARES (SI NO EXISTE)
  db.run(`
    CREATE TABLE IF NOT EXISTS materias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      carrera_id INTEGER NOT NULL,
      sede TEXT DEFAULT '',
      resolucion TEXT DEFAULT '',
      codigo_espacio TEXT DEFAULT '000',
      nombre TEXT NOT NULL,
      ano_cursado INTEGER NOT NULL,
      hs_c TEXT DEFAULT '',
      hs_g TEXT DEFAULT '',
      regimen TEXT DEFAULT '',
      formato TEXT DEFAULT '',
      estado_materia TEXT DEFAULT 'VIGENTE',
      desde TEXT DEFAULT '',
      hasta TEXT DEFAULT '',
      docente TEXT DEFAULT 'Por designar',
      FOREIGN KEY (carrera_id) REFERENCES carreras (id) ON DELETE CASCADE
    )
  `);
});

module.exports = db;
