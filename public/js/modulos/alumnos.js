function init_alumnos() {
  cargarAlumnos();

  const form = document.getElementById('form-alumno');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const nuevoAlumno = {
        legajo: document.getElementById('legajo').value,
        nombre: document.getElementById('nombre').value,
        apellido: document.getElementById('apellido').value,
        dni: document.getElementById('dni').value
      };

      const res = await fetch('/api/alumnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoAlumno)
      });

      if (res.ok) {
        form.reset();
        cargarAlumnos();
      } else {
        alert('Error al guardar el alumno');
      }
    });
  }
}

async function cargarAlumnos() {
  const res = await fetch('/api/alumnos');
  const alumnos = await res.json();
  
  const tbody = document.getElementById('tabla-alumnos');
  if (!tbody) return;

  tbody.innerHTML = alumnos.map(a => `
    <tr>
      <td>${a.legajo}</td>
      <td>${a.nombre}</td>
      <td>${a.apellido}</td>
      <td>${a.dni}</td>
      <td><span style="color: green; font-weight: bold;">${a.estado}</span></td>
    </tr>
  `).join('');
}
