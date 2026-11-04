var datosInasistenciasMemoria = [];
var tipoNovedadSeleccionado = 'INASISTENCIA';
var mapaCarrerasYEspaciosDinamico = {};
var fechaSeleccionadaInasistencia = '';
var calMesAnoInasistencia = new Date(2026, 10, 1);

// FUNCIÓN DE INICIALIZACIÓN DISPARADA POR APP.JS
async function init_inasistencias() {
  establecerFechaHoyInasistencia();
  await cargarCarrerasYEspaciosDinamicos();
  await cargarDocentesSistemaInasistencias();
  await cargarInasistencias();
  if (window.lucide) lucide.createIcons();
}

function establecerFechaHoyInasistencia() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  fechaSeleccionadaInasistencia = `${dd}/${mm}/${yyyy}`;
  actualizarBotonFechaInasistencia();
}

function actualizarBotonFechaInasistencia() {
  const txt = document.getElementById('txt-fecha-inasistencia');
  if (txt) txt.textContent = fechaSeleccionadaInasistencia || 'Seleccionar Fecha';
}

// 1. CARGA DE CARRERAS Y ESPACIOS VÍA ENDPOINT API DE INASISTENCIAS/CARRERAS
async function cargarCarrerasYEspaciosDinamicos() {
  const selectCarrera = document.getElementById('insCarrera');
  if (!selectCarrera) return;

  try {
    const res = await fetch('/api/inasistencias/carreras-y-espacios');
    if (res.ok) {
      mapaCarrerasYEspaciosDinamico = await res.json();
    }
  } catch (err) {
    console.error('Error al conectar con la API de carreras:', err);
  }

  // Si falló el servidor o no hay datos, aplicar fallback con carreras básicas
  if (!mapaCarrerasYEspaciosDinamico || Object.keys(mapaCarrerasYEspaciosDinamico).length === 0) {
    mapaCarrerasYEspaciosDinamico = {
      "HIGIENE Y SEGURIDAD": ["Problemática Ambiental", "Seguridad Industrial I", "Higiene Laboral", "Medicina del Trabajo", "Ergonomía"],
      "RECURSOS HUMANOS": ["Introducción a la Economía", "Gestión de Personal", "Derecho Laboral", "Relaciones Humanas"],
      "EDUCACIÓN PRIMARIA": ["CS. Naturales y su Didáctica I", "Matemática y su Didáctica", "Lengua y Literatura"],
      "PERSONAL CON CARGO": ["Bedel", "Coordinador/a de Carrera", "Secretaría / Bedelía", "Orientador/a Socioeducativo/a"]
    };
  }

  let htmlOptions = '<option value="">-- Seleccionar Carrera --</option>';
  Object.keys(mapaCarrerasYEspaciosDinamico).forEach(carreraKey => {
    htmlOptions += `<option value="${carreraKey}">${carreraKey}</option>`;
  });

  selectCarrera.innerHTML = htmlOptions;
}

// 2. CAMBIO DINÁMICO DE ESPACIOS CURRICULARES / CARGOS SEGÚN CARRERA
function actualizarEspaciosCurriculares() {
  const carreraSelect = document.getElementById('insCarrera');
  const espacioSelect = document.getElementById('insEspacio');

  if (!carreraSelect || !espacioSelect) return;

  const carreraSeleccionada = carreraSelect.value;
  espacioSelect.innerHTML = '';

  if (!carreraSeleccionada || !mapaCarrerasYEspaciosDinamico[carreraSeleccionada]) {
    espacioSelect.innerHTML = '<option value="">-- Primero selecciona una carrera --</option>';
    return;
  }

  const espacios = mapaCarrerasYEspaciosDinamico[carreraSeleccionada];
  if (!espacios || espacios.length === 0) {
    espacioSelect.innerHTML = '<option value="">-- Sin espacios o cargos registrados --</option>';
    return;
  }

  const labelTexto = carreraSeleccionada === 'PERSONAL CON CARGO' ? 'Seleccionar Cargo' : 'Seleccionar Espacio Curricular';
  espacioSelect.innerHTML = `<option value="">-- ${labelTexto} --</option>`;

  espacios.forEach(espacio => {
    espacioSelect.innerHTML += `<option value="${espacio}">${espacio}</option>`;
  });
}

// 3. CARGA DE DOCENTES DESDE EL MÓDULO EXÁMENES / POF
async function cargarDocentesSistemaInasistencias() {
  const datalist = document.getElementById('listaDocentesDatalist');
  if (!datalist) return;

  try {
    const res = await fetch('/api/examenes/docentes-lista');
    if (res.ok) {
      const docentes = await res.json();
      if (docentes && docentes.length > 0) {
        datalist.innerHTML = docentes.map(d => {
          const nom = `${d.apellido.toUpperCase()}, ${d.nombre}`;
          return `<option value="${nom}">`;
        }).join('');
        return;
      }
    }
  } catch (err) {
    console.error('Error al cargar docentes:', err);
  }

  datalist.innerHTML = `
    <option value="BUSTOS, Gratia">
    <option value="HERNANDEZ, Eduardo">
    <option value="SALES, Lorena">
    <option value="SUAREZ, Marina">
  `;
}

// 4. CALENDARIO CON TEMÁTICA OBSCURA INSTITUCIONAL
function abrirCalendarioInasistencia() {
  const modal = document.getElementById('modalCalendarioInasistencia');
  if (modal) {
    modal.classList.remove('hidden');
    renderizarCalendarioInasistencia();
  }
}

function cerrarCalendarioInasistencia() {
  const modal = document.getElementById('modalCalendarioInasistencia');
  if (modal) modal.classList.add('hidden');
}

function cambiarMesCalendarioInasistencia(dir) {
  calMesAnoInasistencia.setMonth(calMesAnoInasistencia.getMonth() + dir);
  renderizarCalendarioInasistencia();
}

function renderizarCalendarioInasistencia() {
  const label = document.getElementById('cal-inasistencia-mes-ano-label');
  const grid = document.getElementById('grid-dias-calendario-inasistencia');
  if (!label || !grid) return;

  const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
  const mes = calMesAnoInasistencia.getMonth();
  const ano = calMesAnoInasistencia.getFullYear();

  label.textContent = `${meses[mes]} ${ano}`;

  const primerDiaSemana = new Date(ano, mes, 1).getDay();
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate();

  let html = '';
  for (let i = 0; i < primerDiaSemana; i++) {
    html += `<div></div>`;
  }

  const hoy = new Date();

  for (let d = 1; d <= totalDiasMes; d++) {
    const esHoy = hoy.getDate() === d && hoy.getMonth() === mes && hoy.getFullYear() === ano;
    const diaFormatted = String(d).padStart(2, '0');
    const mesFormatted = String(mes + 1).padStart(2, '0');
    const fechaString = `${diaFormatted}/${mesFormatted}/${ano}`;

    html += `
      <button type="button" onclick="seleccionarFechaCalendarioInasistencia('${fechaString}')" class="p-2 rounded-xl text-xs font-bold transition-all ${esHoy ? 'bg-emerald-500 text-slate-950 font-black shadow-md' : 'hover:bg-emerald-500/20 text-slate-200'} cursor-pointer">
        ${d}
      </button>
    `;
  }

  grid.innerHTML = html;
}

function seleccionarFechaCalendarioInasistencia(fechaStr) {
  fechaSeleccionadaInasistencia = fechaStr;
  actualizarBotonFechaInasistencia();
  cerrarCalendarioInasistencia();
}

function seleccionarTipoNovedad(tipo) {
  tipoNovedadSeleccionado = tipo;
  const btnInas = document.getElementById('btnTipoInasistencia');
  const btnTard = document.getElementById('btnTipoTardanza');
  const cntHs = document.getElementById('cntHsCatedra');
  const cntMin = document.getElementById('cntTardanza');

  if (tipo === 'INASISTENCIA') {
    btnInas.className = 'p-2 rounded-xl border border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold text-xs cursor-pointer';
    btnTard.className = 'p-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-400 font-bold text-xs cursor-pointer';
    cntHs.classList.remove('hidden');
    cntMin.classList.add('hidden');
  } else {
    btnTard.className = 'p-2 rounded-xl border border-amber-500 bg-amber-500/10 text-amber-400 font-bold text-xs cursor-pointer';
    btnInas.className = 'p-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-400 font-bold text-xs cursor-pointer';
    cntMin.classList.remove('hidden');
    cntHs.classList.add('hidden');
  }
}

function abrirModalNuevaInasistencia() {
  const modal = document.getElementById('modalNuevaInasistencia');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function cerrarModalNuevaInasistencia() {
  const modal = document.getElementById('modalNuevaInasistencia');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

async function cargarInasistencias() {
  const tb = document.getElementById('tbInasistenciasBody');
  if (!tb) return;

  tb.innerHTML = '<tr><td colspan="9" class="py-12 text-center text-slate-400 font-bold">Cargando inasistencias...</td></tr>';

  try {
    const res = await fetch('/api/inasistencias');
    if (!res.ok) throw new Error("No se pudo obtener el listado.");
    const data = await res.json();

    datosInasistenciasMemoria = data || [];
    renderizarTablaInasistencias();
  } catch (e) {
    tb.innerHTML = '<tr><td colspan="9" class="py-12 text-center text-rose-500 font-bold">Error al sincronizar inasistencias.</td></tr>';
  }
}

function renderizarTablaInasistencias() {
  const tb = document.getElementById('tbInasistenciasBody');
  if (!tb) return;

  tb.innerHTML = '';

  if (datosInasistenciasMemoria.length === 0) {
    tb.innerHTML = '<tr><td colspan="9" class="py-12 text-center text-slate-500 font-bold">No hay inasistencias ni tardanzas registradas.</td></tr>';
    return;
  }

  const rolesUsr = (window.usuarioSesion && window.usuarioSesion.roles) || [];
  const esPrivilegiado = rolesUsr.length === 0 || rolesUsr.includes('FULL ADMIN') || rolesUsr.includes('ADMIN IES') || rolesUsr.includes('EQUIPO DE GESTION') || rolesUsr.includes('SECRETARIA');

  datosInasistenciasMemoria.forEach(item => {
    const geiChecked = item.gei === true || item.gei === 'TRUE' ? 'checked' : '';
    const disabledAttr = esPrivilegiado ? '' : 'disabled';

    const botonReclamarHTML = esPrivilegiado ? `
      <button type="button" onclick="reclamarJustificacion('${item.idRow}', '${item.docente}')" class="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold rounded-lg text-[11px] flex items-center gap-1 mx-auto transition-colors cursor-pointer" title="Reenviar mail al docente solicitando justificación">
        <i data-lucide="mail-warning" class="w-3.5 h-3.5"></i> Reclamar
      </button>
    ` : '<span class="text-slate-600 italic text-[10px]">Sin acciones</span>';

    tb.innerHTML += `
      <tr class="hover:bg-slate-800/30 transition-colors">
        <td class="py-3 px-4 font-bold text-amber-400">${item.sede || '-'}</td>
        <td class="py-3 px-4 font-bold text-white">${item.docente || '-'}</td>
        <td class="py-3 px-4 text-slate-300">${item.fecha || '-'}</td>
        <td class="py-3 px-4 text-slate-400 font-bold uppercase text-[11px]">${item.carrera || '-'}</td>
        <td class="py-3 px-4 text-slate-300">${item.espacioCurricular || '-'}</td>
        <td class="py-3 px-4 text-center font-black ${item.hsCatedra ? 'text-amber-400' : 'text-slate-600'}">${item.hsCatedra || '-'}</td>
        <td class="py-3 px-4 text-center font-black ${item.tardanzaMinutos ? 'text-sky-400' : 'text-slate-600'}">${item.tardanzaMinutos ? `${item.tardanzaMinutos} min` : '-'}</td>
        <td class="py-3 px-4 text-center">
          <input type="checkbox" ${geiChecked} ${disabledAttr} onchange="actualizarEstadoGEI('${item.idRow}', this.checked)" class="w-4 h-4 accent-emerald-500 rounded cursor-pointer ${!esPrivilegiado ? 'opacity-40 cursor-not-allowed' : ''}">
        </td>
        <td class="py-3 px-4 text-center">
          ${botonReclamarHTML}
        </td>
      </tr>
    `;
  });

  if (window.lucide) lucide.createIcons();
}

async function guardarNovedadDocente() {
  const sede = document.getElementById('insSede').value;
  const docente = document.getElementById('insDocente').value.trim();
  const fecha = fechaSeleccionadaInasistencia;
  const carrera = document.getElementById('insCarrera').value;
  const espacioCurricular = document.getElementById('insEspacio').value;
  const hsCatedra = document.getElementById('insHsCatedra').value;
  const tardanzaMinutos = document.getElementById('insMinutos').value;

  if (!docente || !fecha || !carrera || !espacioCurricular) {
    alert("Por favor completa los campos obligatorios: Docente, Fecha, Carrera y Espacio Curricular / Cargo.");
    return;
  }

  const emailDocente = `${docente.toLowerCase().replace(/[^a-z]/g, '')}@ies9029.edu.ar`;

  const payload = {
    tipo: tipoNovedadSeleccionado,
    sede,
    docente,
    emailDocente,
    fecha,
    carrera,
    espacioCurricular,
    hsCatedra: tipoNovedadSeleccionado === 'INASISTENCIA' ? hsCatedra : '',
    tardanzaMinutos: tipoNovedadSeleccionado === 'TARDANZA' ? tardanzaMinutos : ''
  };

  try {
    const res = await fetch('/api/inasistencias/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudo procesar la solicitud.");

    alert(data.mensaje || "🟢 Novedad registrada con éxito.");
    cerrarModalNuevaInasistencia();
    await cargarInasistencias();
  } catch (e) {
    alert(e.message || "Error al intentar registrar la novedad.");
  }
}

async function actualizarEstadoGEI(idRow, valorChecked) {
  try {
    const res = await fetch('/api/inasistencias/actualizar-gei', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idRow, gei: valorChecked })
    });

    const data = await res.json();
    console.log("GEI actualizado:", data.mensaje);
  } catch (e) {
    alert("Error al actualizar la casilla GEI.");
    cargarInasistencias();
  }
}

async function reclamarJustificacion(idRow, nombreDocente) {
  const confirmacion = confirm(`¿Deseas enviar un correo a ${nombreDocente} solicitándole nuevamente la presentación de la justificación?`);
  if (!confirmacion) return;

  try {
    const res = await fetch('/api/inasistencias/reclamar-justificacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idRow })
    });

    const data = await res.json();
    alert(data.mensaje || "✉️ Reclamo enviado con éxito al docente.");
  } catch (e) {
    alert("Error al enviar el correo de reclamo.");
  }
}
var datosInasistenciasMemoria = [];
var tipoNovedadSeleccionado = 'INASISTENCIA';
var mapaCarrerasYEspaciosDinamico = {};
var fechaSeleccionadaInasistencia = '';
var calMesAnoInasistencia = new Date(2026, 10, 1);

async function init_inasistencias() {
  establecerFechaHoyInasistencia();
  await cargarCarrerasYEspaciosDinamicos();
  await cargarDocentesSistemaInasistencias();
  await cargarInasistencias();
  if (window.lucide) lucide.createIcons();
}

function establecerFechaHoyInasistencia() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  fechaSeleccionadaInasistencia = `${dd}/${mm}/${yyyy}`;
  actualizarBotonFechaInasistencia();
}

function actualizarBotonFechaInasistencia() {
  const txt = document.getElementById('txt-fecha-inasistencia');
  if (txt) txt.textContent = fechaSeleccionadaInasistencia || 'Seleccionar Fecha';
}

// 1. CARGA DE CARRERAS CON RESOLUCIÓN
async function cargarCarrerasYEspaciosDinamicos() {
  const selectCarrera = document.getElementById('insCarrera');
  if (!selectCarrera) return;

  try {
    const res = await fetch('/api/inasistencias/carreras-y-espacios');
    if (res.ok) {
      mapaCarrerasYEspaciosDinamico = await res.json();
    }
  } catch (err) {
    console.error('Error al conectar con la API de carreras:', err);
  }

  if (!mapaCarrerasYEspaciosDinamico || Object.keys(mapaCarrerasYEspaciosDinamico).length === 0) {
    mapaCarrerasYEspaciosDinamico = {
      "TECNICATURA SUPERIOR EN GESTIÓN DE RECURSOS HUMANOS (RES. N° 432-DGE-2019)": ["Introducción a la Economía", "Gestión de Personal", "Derecho Laboral"],
      "TECNICATURA SUPERIOR EN HIGIENE, SEGURIDAD Y AMBIENTE (RES. N° 120-DGE-2021)": ["Problemática Ambiental", "Seguridad Industrial I", "Higiene Laboral"],
      "PERSONAL CON CARGO": ["Bedel", "Coordinador/a de Carrera", "Secretaría / Bedelía"]
    };
  }

  let htmlOptions = '<option value="">-- SELECCIONAR CARRERA --</option>';
  Object.keys(mapaCarrerasYEspaciosDinamico).forEach(carreraKey => {
    htmlOptions += `<option value="${carreraKey}">${carreraKey}</option>`;
  });

  selectCarrera.innerHTML = htmlOptions;
}

function actualizarEspaciosCurriculares() {
  const carreraSelect = document.getElementById('insCarrera');
  const espacioSelect = document.getElementById('insEspacio');

  if (!carreraSelect || !espacioSelect) return;

  const carreraSeleccionada = carreraSelect.value;
  espacioSelect.innerHTML = '';

  if (!carreraSeleccionada || !mapaCarrerasYEspaciosDinamico[carreraSeleccionada]) {
    espacioSelect.innerHTML = '<option value="">-- Primero selecciona una carrera --</option>';
    return;
  }

  const espacios = mapaCarrerasYEspaciosDinamico[carreraSeleccionada];
  if (!espacios || espacios.length === 0) {
    espacioSelect.innerHTML = '<option value="">-- Sin espacios o cargos registrados --</option>';
    return;
  }

  const labelTexto = carreraSeleccionada.startsWith('PERSONAL CON CARGO') ? 'Seleccionar Cargo' : 'Seleccionar Espacio Curricular';
  espacioSelect.innerHTML = `<option value="">-- ${labelTexto} --</option>`;

  espacios.forEach(espacio => {
    espacioSelect.innerHTML += `<option value="${espacio}">${espacio}</option>`;
  });
}

// 2. OBTENER LISTA DE DOCENTES DESDE EL MÓDULO POF / EXÁMENES
async function cargarDocentesSistemaInasistencias() {
  const datalist = document.getElementById('listaDocentesDatalist');
  if (!datalist) return;

  try {
    const res = await fetch('/api/examenes/docentes-lista');
    if (res.ok) {
      const docentes = await res.json();
      if (docentes && docentes.length > 0) {
        datalist.innerHTML = docentes.map(d => {
          const nom = `${d.apellido.toUpperCase()}, ${d.nombre}`;
          return `<option value="${nom}">`;
        }).join('');
        return;
      }
    }
  } catch (err) {
    console.error('Error al cargar docentes:', err);
  }

  datalist.innerHTML = `
    <option value="BUSTOS, Gratia">
    <option value="HERNANDEZ, Eduardo">
    <option value="SALES, Lorena">
    <option value="SUAREZ, Marina">
  `;
}

// 3. CALENDARIO OBSCURO INSTITUCIONAL
function abrirCalendarioInasistencia() {
  const modal = document.getElementById('modalCalendarioInasistencia');
  if (modal) {
    modal.classList.remove('hidden');
    renderizarCalendarioInasistencia();
  }
}

function cerrarCalendarioInasistencia() {
  const modal = document.getElementById('modalCalendarioInasistencia');
  if (modal) modal.classList.add('hidden');
}

function cambiarMesCalendarioInasistencia(dir) {
  calMesAnoInasistencia.setMonth(calMesAnoInasistencia.getMonth() + dir);
  renderizarCalendarioInasistencia();
}

function renderizarCalendarioInasistencia() {
  const label = document.getElementById('cal-inasistencia-mes-ano-label');
  const grid = document.getElementById('grid-dias-calendario-inasistencia');
  if (!label || !grid) return;

  const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
  const mes = calMesAnoInasistencia.getMonth();
  const ano = calMesAnoInasistencia.getFullYear();

  label.textContent = `${meses[mes]} ${ano}`;

  const primerDiaSemana = new Date(ano, mes, 1).getDay();
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate();

  let html = '';
  for (let i = 0; i < primerDiaSemana; i++) {
    html += `<div></div>`;
  }

  const hoy = new Date();

  for (let d = 1; d <= totalDiasMes; d++) {
    const esHoy = hoy.getDate() === d && hoy.getMonth() === mes && hoy.getFullYear() === ano;
    const diaFormatted = String(d).padStart(2, '0');
    const mesFormatted = String(mes + 1).padStart(2, '0');
    const fechaString = `${diaFormatted}/${mesFormatted}/${ano}`;

    html += `
      <button type="button" onclick="seleccionarFechaCalendarioInasistencia('${fechaString}')" class="p-2 rounded-xl text-xs font-bold transition-all ${esHoy ? 'bg-emerald-500 text-slate-950 font-black shadow-md' : 'hover:bg-emerald-500/20 text-slate-200'} cursor-pointer">
        ${d}
      </button>
    `;
  }

  grid.innerHTML = html;
}

function seleccionarFechaCalendarioInasistencia(fechaStr) {
  fechaSeleccionadaInasistencia = fechaStr;
  actualizarBotonFechaInasistencia();
  cerrarCalendarioInasistencia();
}

function seleccionarTipoNovedad(tipo) {
  tipoNovedadSeleccionado = tipo;
  const btnInas = document.getElementById('btnTipoInasistencia');
  const btnTard = document.getElementById('btnTipoTardanza');
  const cntHs = document.getElementById('cntHsCatedra');
  const cntMin = document.getElementById('cntTardanza');

  if (tipo === 'INASISTENCIA') {
    btnInas.className = 'p-2 rounded-xl border border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold text-xs cursor-pointer';
    btnTard.className = 'p-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-400 font-bold text-xs cursor-pointer';
    cntHs.classList.remove('hidden');
    cntMin.classList.add('hidden');
  } else {
    btnTard.className = 'p-2 rounded-xl border border-amber-500 bg-amber-500/10 text-amber-400 font-bold text-xs cursor-pointer';
    btnInas.className = 'p-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-400 font-bold text-xs cursor-pointer';
    cntMin.classList.remove('hidden');
    cntHs.classList.add('hidden');
  }
}

function abrirModalNuevaInasistencia() {
  const modal = document.getElementById('modalNuevaInasistencia');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function cerrarModalNuevaInasistencia() {
  const modal = document.getElementById('modalNuevaInasistencia');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

async function cargarInasistencias() {
  const tb = document.getElementById('tbInasistenciasBody');
  if (!tb) return;

  tb.innerHTML = '<tr><td colspan="9" class="py-12 text-center text-slate-400 font-bold">Cargando inasistencias...</td></tr>';

  try {
    const res = await fetch('/api/inasistencias');
    if (!res.ok) throw new Error("No se pudo obtener el listado.");
    const data = await res.json();

    datosInasistenciasMemoria = data || [];
    aplicarFiltrosInasistencia();
  } catch (e) {
    tb.innerHTML = '<tr><td colspan="9" class="py-12 text-center text-rose-500 font-bold">Error al sincronizar inasistencias.</td></tr>';
  }
}

// 4. APLICACIÓN DE FILTROS Y ORDENAMIENTO EN LA PLANILLA
function aplicarFiltrosInasistencia() {
  const mesFlt = document.getElementById('flt-inasistencia-mes')?.value || '';
  const anoFlt = document.getElementById('flt-inasistencia-ano')?.value || '2026';
  const textoFlt = (document.getElementById('flt-inasistencia-buscar')?.value || '').toLowerCase().trim();
  const sedeFlt = document.getElementById('flt-inasistencia-sede')?.value || '';
  const ordenFlt = document.getElementById('flt-inasistencia-orden')?.value || 'FECHA_DESC';

  let resultado = datosInasistenciasMemoria.filter(item => {
    // Filtro por Fecha (Mes y Año)
    if (item.fecha && item.fecha.includes('/')) {
      const partes = item.fecha.split('/');
      if (partes.length === 3) {
        const mm = partes[1];
        const yyyy = partes[2];

        if (mesFlt && mm !== mesFlt) return false;
        if (anoFlt && yyyy !== anoFlt) return false;
      }
    }

    // Filtro por Sede
    if (sedeFlt && item.sede !== sedeFlt) return false;

    // Filtro de Búsqueda Textual (Docente, Carrera, Espacio)
    if (textoFlt) {
      const docenteStr = String(item.docente || '').toLowerCase();
      const carreraStr = String(item.carrera || '').toLowerCase();
      const espacioStr = String(item.espacioCurricular || '').toLowerCase();
      if (!docenteStr.includes(textoFlt) && !carreraStr.includes(textoFlt) && !espacioStr.includes(textoFlt)) {
        return false;
      }
    }

    return true;
  });

  // Ordenamiento
  resultado.sort((a, b) => {
    if (ordenFlt === 'DOCENTE_ASC') return String(a.docente).localeCompare(String(b.docente));
    if (ordenFlt === 'DOCENTE_DESC') return String(b.docente).localeCompare(String(a.docente));

    const parseFecha = (fStr) => {
      if (!fStr || !fStr.includes('/')) return 0;
      const p = fStr.split('/');
      return new Date(p[2], p[1] - 1, p[0]).getTime();
    };

    const tA = parseFecha(a.fecha);
    const tB = parseFecha(b.fecha);

    if (ordenFlt === 'FECHA_ASC') return tA - tB;
    return tB - tA; // FECHA_DESC por defecto
  });

  renderizarTablaInasistencias(resultado);
}

function renderizarTablaInasistencias(lista) {
  const tb = document.getElementById('tbInasistenciasBody');
  if (!tb) return;

  tb.innerHTML = '';

  if (!lista || lista.length === 0) {
    tb.innerHTML = '<tr><td colspan="9" class="py-12 text-center text-slate-500 font-bold">No hay registros que coincidan con los filtros seleccionados.</td></tr>';
    return;
  }

  const rolesUsr = (window.usuarioSesion && window.usuarioSesion.roles) || [];
  const esPrivilegiado = rolesUsr.length === 0 || rolesUsr.includes('FULL ADMIN') || rolesUsr.includes('ADMIN IES') || rolesUsr.includes('EQUIPO DE GESTION') || rolesUsr.includes('SECRETARIA');

  lista.forEach(item => {
    const geiChecked = item.gei === true || item.gei === 'TRUE' ? 'checked' : '';
    const disabledAttr = esPrivilegiado ? '' : 'disabled';

    const botonReclamarHTML = esPrivilegiado ? `
      <button type="button" onclick="reclamarJustificacion('${item.idRow}', '${item.docente}')" class="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold rounded-lg text-[11px] flex items-center gap-1 mx-auto transition-colors cursor-pointer" title="Reenviar mail al docente solicitando justificación">
        <i data-lucide="mail-warning" class="w-3.5 h-3.5"></i> Reclamar
      </button>
    ` : '<span class="text-slate-600 italic text-[10px]">Sin acciones</span>';

    tb.innerHTML += `
      <tr class="hover:bg-slate-800/30 transition-colors">
        <td class="py-3 px-4 font-bold text-amber-400">${item.sede || '-'}</td>
        <td class="py-3 px-4 font-bold text-white">${item.docente || '-'}</td>
        <td class="py-3 px-4 text-slate-300 font-bold">${item.fecha || '-'}</td>
        <td class="py-3 px-4 text-slate-400 font-bold uppercase text-[11px] max-w-[260px] truncate" title="${item.carrera}">${item.carrera || '-'}</td>
        <td class="py-3 px-4 text-slate-300">${item.espacioCurricular || '-'}</td>
        <td class="py-3 px-4 text-center font-black ${item.hsCatedra ? 'text-amber-400' : 'text-slate-600'}">${item.hsCatedra || '-'}</td>
        <td class="py-3 px-4 text-center font-black ${item.tardanzaMinutos ? 'text-sky-400' : 'text-slate-600'}">${item.tardanzaMinutos ? `${item.tardanzaMinutos} min` : '-'}</td>
        <td class="py-3 px-4 text-center">
          <input type="checkbox" ${geiChecked} ${disabledAttr} onchange="actualizarEstadoGEI('${item.idRow}', this.checked)" class="w-4 h-4 accent-emerald-500 rounded cursor-pointer ${!esPrivilegiado ? 'opacity-40 cursor-not-allowed' : ''}">
        </td>
        <td class="py-3 px-4 text-center">
          ${botonReclamarHTML}
        </td>
      </tr>
    `;
  });

  if (window.lucide) lucide.createIcons();
}

async function guardarNovedadDocente() {
  const sede = document.getElementById('insSede').value;
  const docente = document.getElementById('insDocente').value.trim();
  const fecha = fechaSeleccionadaInasistencia;
  const carrera = document.getElementById('insCarrera').value;
  const espacioCurricular = document.getElementById('insEspacio').value;
  const hsCatedra = document.getElementById('insHsCatedra').value;
  const tardanzaMinutos = document.getElementById('insMinutos').value;

  if (!docente || !fecha || !carrera || !espacioCurricular) {
    alert("Por favor completa los campos obligatorios: Docente, Fecha, Carrera y Espacio Curricular / Cargo.");
    return;
  }

  const emailDocente = `${docente.toLowerCase().replace(/[^a-z]/g, '')}@ies9029.edu.ar`;

  const payload = {
    tipo: tipoNovedadSeleccionado,
    sede,
    docente,
    emailDocente,
    fecha,
    carrera,
    espacioCurricular,
    hsCatedra: tipoNovedadSeleccionado === 'INASISTENCIA' ? hsCatedra : '',
    tardanzaMinutos: tipoNovedadSeleccionado === 'TARDANZA' ? tardanzaMinutos : ''
  };

  try {
    const res = await fetch('/api/inasistencias/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudo procesar la solicitud.");

    alert(data.mensaje || "🟢 Novedad registrada con éxito.");
    cerrarModalNuevaInasistencia();
    await cargarInasistencias();
  } catch (e) {
    alert(e.message || "Error al intentar registrar la novedad.");
  }
}

async function actualizarEstadoGEI(idRow, valorChecked) {
  try {
    const res = await fetch('/api/inasistencias/actualizar-gei', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idRow, gei: valorChecked })
    });

    const data = await res.json();
    console.log("GEI actualizado:", data.mensaje);
  } catch (e) {
    alert("Error al actualizar la casilla GEI.");
    cargarInasistencias();
  }
}

async function reclamarJustificacion(idRow, nombreDocente) {
  const confirmacion = confirm(`¿Deseas enviar un correo a ${nombreDocente} solicitándole nuevamente la presentación de la justificación?`);
  if (!confirmacion) return;

  try {
    const res = await fetch('/api/inasistencias/reclamar-justificacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idRow })
    });

    const data = await res.json();
    alert(data.mensaje || "✉️ Reclamo enviado con éxito al docente.");
  } catch (e) {
    alert("Error al enviar el correo de reclamo.");
  }
}
