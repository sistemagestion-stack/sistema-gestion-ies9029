async function cargarModulo(nombreModulo) {
  const contenedor = document.getElementById('contenedor-modulo');
  const titulo = document.getElementById('titulo-modulo');

  try {
    // 1. Cargar la vista HTML del módulo
    const resHtml = await fetch(`js/modulos/${nombreModulo}.html`);
    
    if (!resHtml.ok) {
      // Si el sub-módulo aún no existe, mostrar pantalla elegante "En desarrollo"
      contenedor.innerHTML = `
        <div class="theme-card border p-8 rounded-3xl text-center max-w-xl mx-auto my-12 shadow-xl space-y-4">
          <div class="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto">
            <i data-lucide="wrench" class="w-8 h-8"></i>
          </div>
          <h2 class="text-lg font-black tracking-tight">Módulo en Desarrollo</h2>
          <p class="text-xs text-slate-400">La sección <strong>"${nombreModulo.toUpperCase()}"</strong> está programada en la hoja de ruta del I.E.S. N° 9-029.</p>
          <button onclick="cargarInicio()" class="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-emerald-500 transition-colors">Volver al Inicio</button>
        </div>
      `;
      titulo.textContent = nombreModulo.replace('-', ' ').toUpperCase();
      if (window.lucide) lucide.createIcons();
      return;
    }

    contenedor.innerHTML = await resHtml.text();
    titulo.textContent = nombreModulo.replace('-', ' ').toUpperCase();

    // 2. Cargar dinámicamente el script JS si no está cargado
    if (!document.getElementById(`script-${nombreModulo}`)) {
      const script = document.createElement('script');
      script.id = `script-${nombreModulo}`;
      script.src = `js/modulos/${nombreModulo}.js`;
      script.onload = () => {
        const fnName = `init_${nombreModulo.replace('-', '_')}`;
        if (window[fnName]) window[fnName]();
        if (window.lucide) lucide.createIcons();
      };
      document.body.appendChild(script);
    } else {
      const fnName = `init_${nombreModulo.replace('-', '_')}`;
      if (window[fnName]) window[fnName]();
      if (window.lucide) lucide.createIcons();
    }

  } catch (error) {
    contenedor.innerHTML = `<p class="text-rose-500 font-bold p-4">Error al cargar el módulo ${nombreModulo}</p>`;
  }
}

function cargarInicio() {
  const contenedor = document.getElementById('contenedor-modulo');
  const titulo = document.getElementById('titulo-modulo');
  titulo.textContent = 'INICIO GENERAL';

  contenedor.innerHTML = `
    <div class="space-y-6">
      <!-- TARJETA DE BIENVENIDA -->
      <div class="theme-card border p-6 rounded-3xl relative overflow-hidden shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="space-y-2 max-w-xl">
          <span class="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-extrabold uppercase tracking-wider">Sistema Operativo</span>
          <h2 class="text-xl font-black">Bienvenido al Panel de Gestión I.E.S. N° 9-029</h2>
          <p class="text-xs text-slate-400">Selecciona cualquier opción de la barra lateral desplegable para acceder a las áreas de Docentes, Alumnos, Gestión Académica y Títulos.</p>
        </div>
        <img src="https://i0.wp.com/www.ies9029.edu.ar/wp-content/uploads/Nuevo-Logo-9029.png?ssl=1" class="h-16 bg-white p-2 rounded-2xl shadow-md object-contain shrink-0" alt="Logo IES">
      </div>

      <!-- ACCESOS RÁPIDOS -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onclick="cargarModulo('alumnos')" class="theme-card border p-5 rounded-2xl hover:border-sky-500 cursor-pointer transition-all space-y-2 group">
          <i data-lucide="graduation-cap" class="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform"></i>
          <h3 class="font-extrabold text-sm">Alumnos</h3>
          <p class="text-xs text-slate-400">Legajos, certificaciones y abanderados.</p>
        </div>

        <div onclick="cargarModulo('inasistencias')" class="theme-card border p-5 rounded-2xl hover:border-amber-500 cursor-pointer transition-all space-y-2 group">
          <i data-lucide="user-x" class="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform"></i>
          <h3 class="font-extrabold text-sm">Inasistencias / Tardanzas</h3>
          <p class="text-xs text-slate-400">Avisos y novedades diarias de sedes.</p>
        </div>

        <div onclick="cargarModulo('licencias')" class="theme-card border p-5 rounded-2xl hover:border-rose-500 cursor-pointer transition-all space-y-2 group">
          <i data-lucide="file-text" class="w-6 h-6 text-rose-400 group-hover:scale-110 transition-transform"></i>
          <h3 class="font-extrabold text-sm">Licencias Docentes</h3>
          <p class="text-xs text-slate-400">Solicitudes, trámites y visor de adjuntos.</p>
        </div>

        <div onclick="cargarModulo('usuarios')" class="theme-card border p-5 rounded-2xl hover:border-teal-500 cursor-pointer transition-all space-y-2 group">
          <i data-lucide="settings" class="w-6 h-6 text-teal-400 group-hover:scale-110 transition-transform"></i>
          <h3 class="font-extrabold text-sm">Configuración</h3>
          <p class="text-xs text-slate-400">Usuarios, roles y estado del plan.</p>
        </div>
      </div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}

function cerrarSesion() {
  document.getElementById('modalDesktopLogin').classList.remove('hidden');
}
