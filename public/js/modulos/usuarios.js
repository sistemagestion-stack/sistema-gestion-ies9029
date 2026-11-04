function init_usuarios() {
  cargarPlan();
  cargarUsuarios();

  const form = document.getElementById('form-usuario');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nuevo = {
        usuario: document.getElementById('user-name').value,
        nombre: document.getElementById('nombre-completo').value,
        rol: document.getElementById('rol-user').value,
        email: document.getElementById('email-user').value
      };

      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevo)
      });

      if (res.ok) {
        form.reset();
        cargarUsuarios();
      } else {
        alert('Error al crear usuario');
      }
    });
  }
}

async function cargarPlan() {
  const res = await fetch('/api/usuarios/plan');
  const plan = await res.json();

  document.getElementById('plan-institución').textContent = plan.institución;
  document.getElementById('plan-nombre').textContent = plan.planActual;
  document.getElementById('plan-estado').textContent = plan.estadoCuenta;
  document.getElementById('plan-uso').textContent = `${plan.legajosUsados} / ${plan.legajosLimite} legajos ocupados`;
}

async function cargarUsuarios() {
  const res = await fetch('/api/usuarios');
  const lista = await res.json();
  
  const tbody = document.getElementById('tabla-usuarios');
  if (!tbody) return;

  tbody.innerHTML = lista.map(u => `
    <tr>
      <td><strong>${u.usuario}</strong></td>
      <td>${u.nombre}</td>
      <td><span style="background: #f1f5f9; padding: 3px 8px; border-radius: 4px; font-weight: 500;">${u.rol}</span></td>
      <td>${u.email}</td>
    </tr>
  `).join('');
}
