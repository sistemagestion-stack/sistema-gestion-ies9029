function init_docentes() {
  cargarDocentes();

  const form = document.getElementById('form-docente');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const nuevoDocente = {
        legajo: document.getElementById('legajo-doc').value,
        nombre: document.getElementById('nombre-doc').value,
        apellido: document.getElementById('apellido-doc').value,
        materia: document.getElementById('materia-doc').value,
        email: document.getElementById('email-doc').value
      };

      const res = await fetch('/api/docentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoDocente)
      });

      if (res.ok) {
        form.reset();
        cargarDocentes();
      } else {
        alert('Error al guardar el docente');
      }
    });
  }
}

async function cargarDocentes() {
  const res = await fetch('/api/docentes');
  const docentes = await res.json();
  
  const tbody = document.getElementById('tabla-docentes');
  if (!tbody) return;

  tbody.innerHTML = docentes.map(d => `
    <tr>
      <td>${d.legajo}</td>
      <td>${d.nombre}</td>
      <td>${d.apellido}</td>
      <td><strong>${d.materia}</strong></td>
      <td>${d.email}</td>
    </tr>
  `).join('');
}
