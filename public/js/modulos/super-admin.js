window.dbSuperAdminInstitutos = JSON.parse(localStorage.getItem('db_super_admin_institutos')) || [
  {
    id: 1,
    nombre: 'IES N° 9-029',
    cue: '5001234',
    emailContacto: 'direccion@ies9029.edu.ar',
    telefono: '2614556677',
    fechaVencimiento: '2026-12-31',
    estadoCuenta: 'Al día',
    modulos: {
      'legajos': true,
      'alumnos': true,
      'horarios': true,
      'asistencia': false,
      'mesas_examen': true
    },
    historialPagos: [
      { id: 101, fecha: '2026-10-01', monto: 120000, periodo: '2026-10', metodo: 'Transferencia Bancaria', comprobante: 'TR-110293' }
    ]
  },
  {
    id: 2,
    nombre: 'Instituto Técnico Superior del Este',
    cue: '5005678',
    emailContacto: 'administracion@itse.edu.ar',
    telefono: '261998811',
    fechaVencimiento: '2026-10-15',
    estadoCuenta: 'Pendiente',
    modulos: {
      'legajos': true,
      'alumnos': false,
      'horarios': false,
      'asistencia': false,
      'mesas_examen': false
    },
    historialPagos: []
  }
];

const CAT_MODULOS = [
  { key: 'legajos', nombre: 'Legajos y Padrón Docente', desc: 'Gestión digital de legajos (001 a 011) y formularios' },
  { key: 'alumnos', nombre: 'Gestión de Alumnos y Matrícula', desc: 'Inscripciones, legajo estudiantil y boletines' },
  { key: 'horarios', nombre: 'Gestión de Horarios y Aulas', desc: 'Asignación de espacios y grilla horaria' },
  { key: 'asistencia', nombre: 'Control de Asistencia', desc: 'Registro diario y partes de presentismo' },
  { key: 'mesas_examen', nombre: 'Mesas de Examen y Calificaciones', desc: 'Actas de examen y carga de notas' }
];

let institutoSeleccionadoId = null;

function init_super_admin() {
  renderizarInstitutos();
  calcularEstadisticasGlobales();
}

function calcularEstadisticasGlobales() {
  const lista = window.dbSuperAdminInstitutos;
  const activos = lista.filter(i => i.estadoCuenta === 'Al día').length;
  const pendientes = lista.filter(i => i.estadoCuenta === 'Pendiente').length;

  let totalPagosMes = 0;
  const mesActualStr = new Date().toISOString().slice(0, 7);

  lista.forEach(inst => {
    (inst.historialPagos || []).forEach(p => {
      if (p.periodo === mesActualStr) totalPagosMes += parseFloat(p.monto || 0);
    });
  });

  document.getElementById('statInstitutosActivos').textContent = activos;
  document.getElementById('statPendientesPago').textContent = pendientes;
  document.getElementById('statPagosMes').textContent = `$${totalPagosMes.toLocaleString('es-AR')}`;
}

function renderizarInstitutos() {
  const container = document.getElementById('contenedorGridInstitutos');
  if (!container) return;

  if (window.dbSuperAdminInstitutos.length === 0) {
    container.innerHTML = `<div class="col-span-2 p-8 text-center text-slate-500">No hay institutos registrados en el sistema global.</div>`;
    return;
  }

  container.innerHTML = window.dbSuperAdminInstitutos.map(inst => {
    const modulosActivosCount = Object.values(inst.modulos || {}).filter(Boolean).length;
    const esAlDia = inst.estadoCuenta === 'Al día';

    const ultimoPago = (inst.historialPagos && inst.historialPagos.length > 0)
      ? inst.historialPagos[inst.historialPagos.length - 1]
      : null;

    return `
      <div class="bg-slate-800/70 border border-slate-700/80 rounded-3xl p-5 space-y-4 shadow-lg">
        <div class="flex items-start justify-between gap-3">
          <div>
            <span class="text-[10px] font-black uppercase text-amber-400">CUE: ${inst.cue}</span>
            <h4 class="text-base font-black text-white">${inst.nombre}</h4>
            <p class="text-xs text-sky-400 font-semibold">${inst.emailContacto} • ${inst.telefono}</p>
          </div>
          
          <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase border ${esAlDia ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'}">
            ${inst.estadoCuenta}
          </span>
        </div>

        <div class="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-2 text-xs">
          <div class="flex justify-between items-center text-slate-300">
            <span>Módulos Activos:</span>
            <strong class="text-amber-400 font-extrabold">${modulosActivosCount} de ${CAT_MODULOS.length}</strong>
          </div>
          <div class="flex justify-between items-center text-slate-300">
            <span>Último Pago:</span>
            <strong class="text-emerald-400">${ultimoPago ? `$${ultimoPago.monto.toLocaleString('es-AR')} (${ultimoPago.periodo})` : 'Sin registros'}</strong>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 pt-2 border-t border-slate-700/60">
          <button onclick="abrirModalModulos(${inst.id})" class="flex-1 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer">
            <i data-lucide="boxes" class="w-4 h-4"></i> Módulos
          </button>
          
          <button onclick="abrirModalPago(${inst.id})" class="flex-1 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer">
            <i data-lucide="credit-card" class="w-4 h-4"></i> Registrar Pago
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

// GESTIÓN DE SWITCHES DE MÓDULOS ACTIVOS / INACTIVOS
function abrirModalModulos(instId) {
  institutoSeleccionadoId = instId;
  const inst = window.dbSuperAdminInstitutos.find(i => i.id === instId);
  if (!inst) return;

  document.getElementById('modalModulosTitulo').textContent = `Módulos de ${inst.nombre}`;

  const listaHtml = CAT_MODULOS.map(mod => {
    const estaActivo = inst.modulos && inst.modulos[mod.key] === true;

    return `
      <div class="p-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl flex items-center justify-between gap-4">
        <div class="space-y-0.5">
          <h5 class="font-bold text-xs text-white">${mod.nombre}</h5>
          <p class="text-[10px] text-slate-400">${mod.desc}</p>
        </div>
        
        <label class="relative inline-flex items-center cursor-pointer shrink-0">
          <input type="checkbox" onchange="toggleModuloInstituto('${mod.key}', this.checked)" ${estaActivo ? 'checked' : ''} class="sr-only peer">
          <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
        </label>
      </div>
    `;
  }).join('');

  document.getElementById('listaModulosSwitches').innerHTML = listaHtml;
  document.getElementById('modalModulosInstituto').classList.remove('hidden');
}

function toggleModuloInstituto(moduloKey, nuevoEstado) {
  const inst = window.dbSuperAdminInstitutos.find(i => i.id === institutoSeleccionadoId);
  if (!inst) return;

  if (!inst.modulos) inst.modulos = {};
  inst.modulos[moduloKey] = nuevoEstado;

  localStorage.setItem('db_super_admin_institutos', JSON.stringify(window.dbSuperAdminInstitutos));
  renderizarInstitutos();
  calcularEstadisticasGlobales();
}

function cerrarModalModulos() {
  document.getElementById('modalModulosInstituto').classList.add('hidden');
}

// GESTIÓN Y REGISTRO DE PAGOS MENSUALES
function abrirModalPago(instId) {
  institutoSeleccionadoId = instId;
  const inst = window.dbSuperAdminInstitutos.find(i => i.id === instId);
  if (!inst) return;

  document.getElementById('modalPagoTitulo').textContent = `Registrar Pago: ${inst.nombre}`;
  document.getElementById('pagoInstitutoId').value = instId;
  document.getElementById('pagoMonto').value = '';
  document.getElementById('pagoPeriodo').value = new Date().toISOString().slice(0, 7);
  document.getElementById('pagoComprobante').value = '';

  document.getElementById('modalRegistrarPago').classList.remove('hidden');
}

function cerrarModalPago() {
  document.getElementById('modalRegistrarPago').classList.add('hidden');
}

function guardarPagoInstituto(e) {
  e.preventDefault();
  const inst = window.dbSuperAdminInstitutos.find(i => i.id === institutoSeleccionadoId);
  if (!inst) return;

  const monto = parseFloat(document.getElementById('pagoMonto').value);
  const periodo = document.getElementById('pagoPeriodo').value;
  const metodo = document.getElementById('pagoMetodo').value;
  const comprobante = document.getElementById('pagoComprobante').value.trim();

  const nuevoPago = {
    id: Date.now(),
    fecha: new Date().toISOString().slice(0, 10),
    monto: monto,
    periodo: periodo,
    metodo: metodo,
    comprobante: comprobante || 'S/D'
  };

  if (!inst.historialPagos) inst.historialPagos = [];
  inst.historialPagos.push(nuevoPago);

  // Se actualiza el estado de la cuenta a "Al día" tras recibir el pago
  inst.estadoCuenta = 'Al día';

  localStorage.setItem('db_super_admin_institutos', JSON.stringify(window.dbSuperAdminInstitutos));
  
  renderizarInstitutos();
  calcularEstadisticasGlobales();
  cerrarModalPago();
  alert(`Pago del periodo ${periodo} registrado con éxito para ${inst.nombre}.`);
}

function abrirModalNuevoInstituto() {
  const nombre = prompt('Ingresa el nombre del nuevo Instituto:');
  if (!nombre) return;
  const cue = prompt('Ingresa el CUE:');
  
  const nuevo = {
    id: Date.now(),
    nombre: nombre,
    cue: cue || '0000000',
    emailContacto: `contacto@${nombre.toLowerCase().replace(/\s+/g, '')}.edu.ar`,
    telefono: 'S/D',
    fechaVencimiento: new Date().toISOString().slice(0, 10),
    estadoCuenta: 'Al día',
    modulos: { 'legajos': true, 'alumnos': true },
    historialPagos: []
  };

  window.dbSuperAdminInstitutos.push(nuevo);
  localStorage.setItem('db_super_admin_institutos', JSON.stringify(window.dbSuperAdminInstitutos));
  renderizarInstitutos();
  calcularEstadisticasGlobales();
}
