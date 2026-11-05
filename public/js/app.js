// DATA ESTRUCTURADA DE SECCIONES CON SUS SUBMÓDULOS
const SECCIONES_SISTEMA = {
  'docentes': {
    titulo: 'DOCENTES',
    icono: 'briefcase',
    color: 'emerald',
    tramites: '3/15 pendientes',
    submodulos: [
      { id: 'docentes', titulo: 'POF', desc: 'Planta Orgánico Funcional.', icono: 'file-spreadsheet' },
      { id: 'certificaciones-docentes', titulo: 'Certificaciones Docentes', desc: 'Emisión de cert. de servicios.', icono: 'award', pendientes: '2' },
      { id: 'docentes', titulo: 'Legajos Docentes', desc: 'Legajos digitales de profesores.', icono: 'folder-user' },
      { id: 'horarios-cursado', titulo: 'Horarios de Cursado', desc: 'Grillas horarias y comisiones.', icono: 'clock', pendientes: '1' }
    ]
  },
  'alumnos': {
    titulo: 'ALUMNOS',
    icono: 'graduation-cap',
    color: 'sky',
    tramites: '5/42 pendientes',
    submodulos: [
      { id: 'certificaciones-alumnos', titulo: 'Certificaciones Estudiantes', desc: 'Constancias de alumno regular.', icono: 'file-check', pendientes: '3' },
      { id: 'alumnos', titulo: 'Legajos Estudiantes', desc: 'Fichas personales y legajos.', icono: 'users' },
      { id: 'abanderados', titulo: 'Abanderados y Escoltas', desc: 'Escalafón por promedio.', icono: 'flag' },
      { id: 'inscripciones', titulo: 'Inscripción a 1° Año', desc: 'Formularios para ingresantes.', icono: 'user-plus', pendientes: '2' },
      { id: 'equivalencias', titulo: 'Equivalencias', desc: 'Solicitudes y resoluciones.', icono: 'arrow-right-left' }
    ]
  },
  'academica': {
    titulo: 'GESTIÓN ACADÉMICA',
    icono: 'book-open',
    color: 'amber',
    tramites: '0/8 pendientes',
    submodulos: [
      { id: 'practicas-profesionalizantes', titulo: 'Prácticas Profesionalizantes', desc: 'Gestión de convenio e informes de prácticas.', icono: 'building-2' },
      { id: 'practicas-docentes', titulo: 'Prácticas Profesionales Docentes', desc: 'Residencias y observaciones en escuelas.', icono: 'user-check' }
    ]
  },
  'admin': {
    titulo: 'GESTIÓN ADMINISTRATIVA',
    icono: 'clipboard-list',
    color: 'purple',
    tramites: '4/28 pendientes',
    submodulos: [
      { id: 'examenes', titulo: 'Cronograma de Mesas', desc: 'Fechas de exámenes y tribunales.', icono: 'calendar', pendientes: '1' },
      { id: 'consultas', titulo: 'Cronograma de Consultas', desc: 'Horarios de consulta docente.', icono: 'help-circle' },
      { id: 'inasistencias', titulo: 'Informar Inasistencias', desc: 'Avisos diarios de sedes.', icono: 'user-x', pendientes: '2' },
      { id: 'licencias', titulo: 'Licencias', desc: 'Trámites de licencias y adjuntos.', icono: 'file-text', pendientes: '1' },
      { id: 'calendario', titulo: 'Calendario Académico', desc: 'Recesos y fechas clave.', icono: 'calendar-days' },
      { id: 'resoluciones', titulo: 'Historial de Resoluciones', desc: 'Archivo de resoluciones IES.', icono: 'file-digit' },
      { id: 'planillas-asistencia', titulo: 'Planillas de Asistencia y Regularidad', desc: 'Generación de planillas.', icono: 'check-square' },
      { id: 'gestor-tareas', titulo: 'Gestor de Tareas Institucional', desc: 'Asignación y check de tareas.', icono: 'list-todo' }
    ]
  },
  'titulos': {
    titulo: 'TÍTULOS',
    icono: 'award',
    color: 'indigo',
    tramites: '6/19 pendientes',
    submodulos: [
      { id: 'analiticos-completos', titulo: 'Analíticos Completos', desc: 'Diplomas y analíticos finales.', icono: 'graduation-cap', pendientes: '4' },
      { id: 'analiticos-incompletos', titulo: 'Analíticos Incompletos', desc: 'Certificados parciales.', icono: 'file-minus' },
      { id: 'fp3', titulo: 'Formación Profesional 3', desc: 'Certificaciones FP3.', icono: 'briefcase' },
      { id: 'postitulos-titulos', titulo: 'Postítulos', desc: 'Titulaciones de postítulos.', icono: 'scroll' },
      { id: 'readmision', titulo: 'Resolución de Readmisión', desc: 'Solicitudes de readmisión.', icono: 'user-check', pendientes: '1' },
      { id: 'terminalidad', titulo: 'Resolución de Terminalidad', desc: 'Certificados de terminalidad.', icono: 'check-circle-2', pendientes: '1' }
    ]
  },
  'formacion': {
    titulo: 'FORMACIÓN CONTINUA',
    icono: 'school',
    color: 'rose',
    tramites: '1/12 pendientes',
    submodulos: [
      { id: 'cursos', titulo: 'Cursos', desc: 'Oferta de capacitaciones.', icono: 'book' },
      { id: 'postitulos', titulo: 'Postítulos', desc: 'Especializaciones y diplomaturas.', icono: 'award' },
      { id: 'pagos', titulo: 'Seguimiento de Pagos', desc: 'Control de cuotas e inscriptos.', icono: 'credit-card', pendientes: '1' }
    ]
  },
  'comunicacion': {
    titulo: 'COMUNICACIÓN',
    icono: 'megaphone',
    color: 'emerald',
    tramites: '0/3 pendientes',
    submodulos: [
      { id: 'comunicacion', titulo: 'Tablón de Anuncios', desc: 'Anuncios generales institucionales.', icono: 'megaphone' }
    ]
  },
  'config': {
    titulo: 'CONFIGURACIÓN',
    icono: 'settings',
    color: 'teal',
    tramites: '0/5 pendientes',
    submodulos: [
      { id: 'reclamos', titulo: 'Reclamos', desc: 'Tickets y soporte.', icono: 'alert-triangle' },
      { id: 'mejoras', titulo: 'Mejoras', desc: 'Sugerencias de funciones.', icono: 'sparkles' },
      { id: 'usuarios', titulo: 'Usuarios', desc: 'Gestión de usuarios del instituto.', icono: 'users' },
      { id: 'roles', titulo: 'Roles', desc: 'Permisos del sistema.', icono: 'shield' },
      { id: 'datos-institucionales', titulo: 'Datos Institucionales', desc: 'Logo, CUE, nombre del instituto.', icono: 'building' },
      { id: 'firmas', titulo: 'Firmas y Sellos', desc: 'Sellos digitales autorizados.', icono: 'pen-tool' },
      { id: 'mi-plan', titulo: 'Mi Plan', desc: 'Estado del plan contratado.', icono: 'credit-card' },
      { id: 'datos-personales', titulo: 'Mis Datos Personales', desc: 'Cambio de clave y datos de cuenta.', icono: 'user' },
      { id: 'carreras-sedes', titulo: 'Carreras, Sedes', desc: 'Configurar sedes y ofertas académicas.', icono: 'git-fork' },
      { id: 'admin-general', titulo: 'Administración General', desc: 'Acceso exclusivo Full Admin SaaS.', icono: 'shield-alert' }
    ]
  }
};

async function cargarModulo(nombreModulo, pushToHistory = true) {
  const contenedor = document.getElementById('contenedor-modulo');
  const titulo = document.getElementById('titulo-modulo');

  if (SECCIONES_SISTEMA[nombreModulo]) {
    mostrarSeccionConTarjetas(nombreModulo);
    if (pushToHistory) history.pushState({ modulo: nombreModulo }, '', `#${nombreModulo}`);
    return;
  }

  try {
    const resHtml = await fetch(`js/modulos/${nombreModulo}.html`);
    
    if (!resHtml.ok) {
      contenedor.innerHTML = `
        <div class="theme-card border p-8 rounded-3xl text-center max-w-xl mx-auto my-12 shadow-xl space-y-4">
          <div class="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-2xl flex items-center justify-center mx-auto">
            <i data-lucide="wrench" class="w-8 h-8"></i>
          </div>
          <h2 class="text-lg font-black tracking-tight dynamic-text-main">Módulo en Desarrollo</h2>
          <p class="text-xs dynamic-text-sub">La sección <strong>"${nombreModulo.toUpperCase()}"</strong> está programada en la hoja de ruta del sistema.</p>
          <button onclick="cargarInicio()" class="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-emerald-500 transition-colors">Volver al Inicio</button>
        </div>
      `;
      titulo.textContent = 'I.E.S. N° 9-029';
      if (window.lucide) lucide.createIcons();
      return;
    }

    contenedor.innerHTML = await resHtml.text();
    titulo.textContent = 'I.E.S. N° 9-029';

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

    if (pushToHistory) {
      history.pushState({ modulo: nombreModulo }, '', `#${nombreModulo}`);
    }

  } catch (error) {
    contenedor.innerHTML = `<p class="text-rose-500 font-bold p-4">Error al cargar el módulo ${nombreModulo}</p>`;
  }
}

function mostrarSeccionConTarjetas(keySeccion) {
  const sec = SECCIONES_SISTEMA[keySeccion];
  const contenedor = document.getElementById('contenedor-modulo');
  const titulo = document.getElementById('titulo-modulo');
  titulo.textContent = 'I.E.S. N° 9-029';

  let htmlTarjetas = sec.submodulos.map(sub => `
    <div onclick="cargarModulo('${sub.id}')" class="theme-card border p-5 rounded-2xl hover:border-emerald-500 cursor-pointer transition-all space-y-3 group relative overflow-hidden">
      <div class="flex items-center justify-between">
        <i data-lucide="${sub.icono}" class="w-6 h-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform"></i>
        ${sub.pendientes ? `<span class="px-2.5 py-0.5 bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[10px] font-black rounded-full">${sub.pendientes} pendientes</span>` : ''}
      </div>
      <div>
        <h3 class="font-extrabold text-sm dynamic-text-main group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">${sub.titulo}</h3>
        <p class="text-xs dynamic-text-sub mt-1">${sub.desc}</p>
      </div>
    </div>
  `).join('');

  contenedor.innerHTML = `
    <div class="space-y-6">
      <div class="theme-card border p-6 rounded-3xl flex items-center justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <i data-lucide="${sec.icono}" class="w-3.5 h-3.5"></i> ${sec.titulo}
            </span>
          </div>
          <h2 class="text-xl font-black dynamic-text-main">Submódulos y Trámites de ${sec.titulo}</h2>
        </div>
        <div class="text-right shrink-0">
          <span class="text-xs font-black text-amber-700 dark:text-amber-400 bg-amber-500/15 px-3 py-1.5 rounded-xl border border-amber-500/30 block">
            Trámites: ${sec.tramites}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${htmlTarjetas}
      </div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}

function cargarInicio(pushToHistory = true) {
  const contenedor = document.getElementById('contenedor-modulo');
  const titulo = document.getElementById('titulo-modulo');
  titulo.textContent = 'I.E.S. N° 9-029';

  contenedor.innerHTML = `
    <div class="space-y-6">
      <div class="theme-card border p-6 rounded-3xl relative overflow-hidden shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="space-y-2 max-w-2xl">
          <span class="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-full text-[10px] font-extrabold uppercase tracking-wider">Sistema Operativo Integrado</span>
          <h2 class="text-xl font-black tracking-tight dynamic-text-main">Bienvenido al Panel Institucional</h2>
          <p class="text-xs dynamic-text-sub leading-relaxed">Seleccione cualquiera de las áreas del sistema para administrar legajos, calendarios, mesas de examen y solicitudes.</p>
        </div>
        <img src="https://i0.wp.com/www.ies9029.edu.ar/wp-content/uploads/Nuevo-Logo-9029.png?ssl=1" class="h-16 bg-white p-2 rounded-2xl shadow-md object-contain shrink-0" alt="Logo">
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onclick="cargarModulo('docentes')" class="theme-card border p-5 rounded-2xl hover:border-emerald-500 cursor-pointer transition-all space-y-3 group">
          <div class="flex items-center justify-between">
            <i data-lucide="briefcase" class="w-6 h-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform"></i>
            <span class="text-[10px] dynamic-badge-neutral px-2.5 py-1 rounded-full">3 trámites</span>
          </div>
          <div>
            <h3 class="font-extrabold text-sm dynamic-text-main">DOCENTES</h3>
            <p class="text-xs dynamic-text-sub mt-1">POF, legajos, certificaciones y horarios.</p>
          </div>
        </div>

        <div onclick="cargarModulo('alumnos')" class="theme-card border p-5 rounded-2xl hover:border-sky-500 cursor-pointer transition-all space-y-3 group">
          <div class="flex items-center justify-between">
            <i data-lucide="graduation-cap" class="w-6 h-6 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform"></i>
            <span class="text-[10px] dynamic-badge-neutral px-2.5 py-1 rounded-full">5 trámites</span>
          </div>
          <div>
            <h3 class="font-extrabold text-sm dynamic-text-main">ALUMNOS</h3>
            <p class="text-xs dynamic-text-sub mt-1">Legajos, certificaciones y equivalencias.</p>
          </div>
        </div>

        <div onclick="cargarModulo('academica')" class="theme-card border p-5 rounded-2xl hover:border-amber-500 cursor-pointer transition-all space-y-3 group">
          <div class="flex items-center justify-between">
            <i data-lucide="book-open" class="w-6 h-6 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform"></i>
            <span class="text-[10px] dynamic-badge-neutral px-2.5 py-1 rounded-full">Al día</span>
          </div>
          <div>
            <h3 class="font-extrabold text-sm dynamic-text-main">GESTIÓN ACADÉMICA</h3>
            <p class="text-xs dynamic-text-sub mt-1">Prácticas profesionalizantes y docentes.</p>
          </div>
        </div>

        <div onclick="cargarModulo('admin')" class="theme-card border p-5 rounded-2xl hover:border-purple-500 cursor-pointer transition-all space-y-3 group">
          <div class="flex items-center justify-between">
            <i data-lucide="clipboard-list" class="w-6 h-6 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform"></i>
            <span class="text-[10px] dynamic-badge-neutral px-2.5 py-1 rounded-full">4 trámites</span>
          </div>
          <div>
            <h3 class="font-extrabold text-sm dynamic-text-main">GESTIÓN ADMINISTRATIVA</h3>
            <p class="text-xs dynamic-text-sub mt-1">Mesas, inasistencias, licencias y tareas.</p>
          </div>
        </div>

        <div onclick="cargarModulo('titulos')" class="theme-card border p-5 rounded-2xl hover:border-indigo-500 cursor-pointer transition-all space-y-3 group">
          <div class="flex items-center justify-between">
            <i data-lucide="award" class="w-6 h-6 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform"></i>
            <span class="text-[10px] dynamic-badge-neutral px-2.5 py-1 rounded-full">6 trámites</span>
          </div>
          <div>
            <h3 class="font-extrabold text-sm dynamic-text-main">TÍTULOS</h3>
            <p class="text-xs dynamic-text-sub mt-1">Analíticos, terminalidad y readmisión.</p>
          </div>
        </div>

        <div onclick="cargarModulo('formacion')" class="theme-card border p-5 rounded-2xl hover:border-rose-500 cursor-pointer transition-all space-y-3 group">
          <div class="flex items-center justify-between">
            <i data-lucide="school" class="w-6 h-6 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform"></i>
            <span class="text-[10px] dynamic-badge-neutral px-2.5 py-1 rounded-full">1 trámite</span>
          </div>
          <div>
            <h3 class="font-extrabold text-sm dynamic-text-main">FORMACIÓN CONTINUA</h3>
            <p class="text-xs dynamic-text-sub mt-1">Cursos, postítulos y pagos.</p>
          </div>
        </div>

        <div onclick="cargarModulo('comunicacion')" class="theme-card border p-5 rounded-2xl hover:border-emerald-500 cursor-pointer transition-all space-y-3 group">
          <div class="flex items-center justify-between">
            <i data-lucide="megaphone" class="w-6 h-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform"></i>
            <span class="text-[10px] dynamic-badge-neutral px-2.5 py-1 rounded-full">Al día</span>
          </div>
          <div>
            <h3 class="font-extrabold text-sm dynamic-text-main">COMUNICACIÓN</h3>
            <p class="text-xs dynamic-text-sub mt-1">Tablón de anuncios institucionales.</p>
          </div>
        </div>

        <div onclick="cargarModulo('config')" class="theme-card border p-5 rounded-2xl hover:border-teal-500 cursor-pointer transition-all space-y-3 group">
          <div class="flex items-center justify-between">
            <i data-lucide="settings" class="w-6 h-6 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform"></i>
            <span class="text-[10px] dynamic-badge-neutral px-2.5 py-1 rounded-full">Configuración</span>
          </div>
          <div>
            <h3 class="font-extrabold text-sm dynamic-text-main">CONFIGURACIÓN</h3>
            <p class="text-xs dynamic-text-sub mt-1">Datos institucionales, sedes y SaaS.</p>
          </div>
        </div>
      </div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();

  if (pushToHistory) {
    history.pushState({ modulo: 'inicio' }, '', '#inicio');
  }
}

window.addEventListener('popstate', (event) => {
  if (event.state && event.state.modulo) {
    if (event.state.modulo === 'inicio') cargarInicio(false);
    else cargarModulo(event.state.modulo, false);
  } else {
    const hash = window.location.hash.replace('#', '');
    if (hash && hash !== 'inicio') cargarModulo(hash, false);
    else cargarInicio(false);
  }
});

function inicializarRutaHash() {
  const hash = window.location.hash.replace('#', '');
  if (hash && hash !== 'inicio') cargarModulo(hash, false);
  else cargarInicio(false);
}

function cerrarSesion() {
  document.getElementById('modalDesktopLogin').classList.remove('hidden');
  const sidebar = document.getElementById('sidebarNav');
  const header = document.getElementById('mainHeader');
  sidebar.classList.add('hidden');
  sidebar.classList.remove('flex');
  header.classList.add('hidden');
  header.classList.remove('flex');
}
