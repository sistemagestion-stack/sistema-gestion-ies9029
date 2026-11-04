var datosLicenciasMemoria = [];
var listaDocentesLicenciasBD = [];

// DICIONARIO OFICIAL DE LICENCIAS Y CÓDIGOS
var DICCIONARIO_LICENCIAS = {
  "RAZONES PARTICULARES (ART. 50 INC. 9)": "50-9",
  "ENFERMEDAD PROPIA (ART. 40)": "40-0",
  "CUIDADO FAMILIAR ENFERMO (ART. 50 INC. 7)": "50-7",
  "EXAMEN COLPOSCOPÍA, PAPANICOLAU, MAMOGRAFIA (92-0)": "92-0",
  "MATERNIDAD-ADOPCIÓN (ART. 54)": "54-0",
  "PROTECCION MATERNIDAD (RESERVA DE CARGO) (ART. 56)": "56-0",
  "MISIÓN ESPECIAL (32-0)": "32-0",
  "SALIDA DOCENTE CON ALUMNOS (RESOLUCIÓN 1000/17) (ART. 68-0)": "68-0",
  "ACCIDENTE DE TRABAJO/ENFERMEDAD PROFESIONAL (ART. 44)": "44-0",
  "MATRIMONIO (ART. 50 INC. 2)": "50-2",
  "FALLECIMIENTO FAMILIAR DIRECTO (ART. 50 INC. 3)": "50-3",
  "FALLECIMIENTO FAMILIAR INDIRECTO (ART. 50 INC. 4)": "50-4",
  "EXAMEN Y MESA (ART. 50 INC. 5)": "50-5",
  "DONACIÓN DE SANGRE (ART. 50 INC. 6)": "50-6",
  "CAMBIO DE FUNCIONES (ART. 48)": "48-0",
  "ESTUDIOS DE PERFECCIONAMIENTO (ART. 50 INC. 8)": "50-8",
  "LICENCIA SIN GOCE DE HABERES (SÓLO TITULARES) (ART. 52)": "52-0",
  "PERFECCIONAMIENTO DOCENTE - FUERA DEL PAIS (SÓLO TITULARES) (ART. 53)": "53-0",
  "PERFECCIONAMIENTO DOCENTE - DENTRO DEL PAIS (SÓLO TITULARES) (ART. 53)": "53-0",
  "MAYOR JERARQUIA (RESERVA DE CARGO) (SÓLO TITUALRES) (ART. 61)": "61-0",
  "LICENCIA GREMIAL (RESERVA CARGO) (ART. 62)": "62-0",
  "VIOLENCIA DE GÉNERO - LEY 26485": "LEY 26485",
  "VACACIONES NO GOZADAS (ART. 38)": "38-0",
  "DONACIÓN ORGANOS - PRE (57-0)": "57-0",
  "DONACIÓN ORGANOS - POST (57-1)": "57-1",
  "CUMPLIMIENTO CARGA PÚBLICA (67-0)": "67-0",
  "CITACIÓN JUDICIAL (96-0)": "96-0",
  "RENUNCIA": "RENUNCIA",
  "NACIMIENTO PROGENITOR NO GESTANTE (54-BIS)": "54-BIS"
};

// Variables para el selector de calendario
var campoFechaCalendarioActivo = 'desde';
var fechaLicDesdeSeleccionada = '01/11/2026';
var fechaLicHastaSeleccionada = '15/11/2026';
var calMesAnoLicencias = new Date(2026, 10, 1);

async function init_licencias() {
  poblarDesplegableLicencias();
  await cargarDocentesSistemaLicencias();
  await cargarLicencias();
  if (window.lucide) lucide.createIcons();
}

// 1. CARGAR LISTA DE DOCENTES CON DNI
async function cargarDocentesSistemaLicencias() {
  const datalist = document.getElementById('dl-docentes-licencias');
  if (!datalist) return;

  try {
    const res = await fetch('/api/examenes/docentes-lista');
    if (res.ok) {
      const docentes = await res.json();
      if (docentes && docentes.length > 0) {
        listaDocentesLicenciasBD = docentes;
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

  // Lista fallback de docentes con DNI
  listaDocentesLicenciasBD = [
    { apellido: "BUSTOS", nombre: "Gratia", dni: "20111222", email: "gbustos@ies9029.edu.ar" },
    { apellido: "HERNANDEZ", nombre: "Eduardo", dni: "20333444", email: "ehernandez@ies9029.edu.ar" },
    { apellido: "SALES", nombre: "Lorena", dni: "27888999", email: "lsales@ies9029.edu.ar" },
    { apellido: "SUAREZ", nombre: "Marina", dni: "24555666", email: "msuarez@ies9029.edu.ar" }
  ];

  datalist.innerHTML = listaDocentesLicenciasBD.map(d => `<option value="${d.apellido}, ${d.nombre}">`).join('');
}

function alSeleccionarDocenteLicencia() {
  const valDocente = document.getElementById('edit-lic-docente').value.trim();
  const inputDni = document.getElementById('edit-lic-dni');

  if (!valDocente) {
    inputDni.value = '';
    return;
  }

  const encon = listaDocentesLicenciasBD.find(d => {
    const completo = `${d.apellido.toUpperCase()}, ${d.nombre}`.toLowerCase();
    return completo === valDocente.toLowerCase();
  });

  if (encon && encon.dni) {
    inputDni.value = encon.dni;
  }
}

// 2. POBLAR DESPLEGABLE DE LICENCIAS Y VINCULAR CÓDIGO
function poblarDesplegableLicencias() {
  const select = document.getElementById('edit-lic-tipo-select');
  if (!select) return;

  let html = '<option value="">-- SELECCIONAR TIPO DE LICENCIA --</option>';
  Object.keys(DICCIONARIO_LICENCIAS).forEach(lic => {
    html += `<option value="${lic}">${lic}</option>`;
  });

  select.innerHTML = html;
}

function actualizarCodigoLicenciaEditar() {
  const select = document.getElementById('edit-lic-tipo-select');
  const inputCodigo = document.getElementById('edit-lic-codigo');

  if (!select || !inputCodigo) return;

  const seleccionada = select.value;
  if (seleccionada && DICCIONARIO_LICENCIAS[seleccionada]) {
    inputCodigo.value = DICCIONARIO_LICENCIAS[seleccionada];
  } else {
    inputCodigo.value = '-';
  }
}

// 3. OBTENER LICENCIAS
async function cargarLicencias() {
  const tb = document.getElementById('tbLicenciasBody');
  if (!tb) return;

  tb.innerHTML = '<tr><td colspan="7" class="py-12 text-center text-slate-400 font-bold">Cargando licencias...</td></tr>';

  try {
    const res = await fetch('/api/licencias');
    if (!res.ok) throw new Error("No se pudo obtener el listado de licencias.");
    const data = await res.json();

    datosLicenciasMemoria = data || [];
    aplicarFiltrosLicencias();
  } catch (e) {
    tb.innerHTML = '<tr><td colspan="7" class="py-12 text-center text-rose-500 font-bold">Error al sincronizar las licencias.</td></tr>';
  }
}

// 4. FILTRADO
function aplicarFiltrosLicencias() {
  const mesFlt = document.getElementById('flt-lic-mes')?.value || '';
  const anoFlt = document.getElementById('flt-lic-ano')?.value || '2026';
  const buscarFlt = (document.getElementById('flt-lic-buscar')?.value || '').toLowerCase().trim();
  const geiFlt = document.getElementById('flt-lic-gei')?.value || '';

  let resultado = datosLicenciasMemoria.filter(item => {
    if (item.timestamp || item.desde) {
      const fechaBase = item.desde || item.timestamp.split(' ')[0];
      if (fechaBase.includes('/')) {
        const partes = fechaBase.split('/');
        if (partes.length === 3) {
          if (mesFlt && partes[1] !== mesFlt) return false;
          if (anoFlt && partes[2] !== anoFlt) return false;
        }
      }
    }

    if (geiFlt === 'SI' && !item.cargadaGEI) return false;
    if (geiFlt === 'NO' && item.cargadaGEI) return false;

    if (buscarFlt) {
      const doc = String(item.docente || '').toLowerCase();
      const dni = String(item.dni || '').toLowerCase();
      const tipo = String(item.tipoLicencia || '').toLowerCase();
      const cod = String(item.codigo || '').toLowerCase();

      if (!doc.includes(buscarFlt) && !dni.includes(buscarFlt) && !tipo.includes(buscarFlt) && !cod.includes(buscarFlt)) {
        return false;
      }
    }

    return true;
  });

  renderizarTablaLicencias(resultado);
}

// 5. RENDERIZADO DE LA TABLA
function renderizarTablaLicencias(lista) {
  const tb = document.getElementById('tbLicenciasBody');
  if (!tb) return;

  tb.innerHTML = '';

  if (!lista || lista.length === 0) {
    tb.innerHTML = '<tr><td colspan="7" class="py-12 text-center text-slate-500 font-bold">No hay licencias registradas que coincidan con los filtros.</td></tr>';
    return;
  }

  const rolesUsr = (window.usuarioSesion && window.usuarioSesion.roles) || [];
  const esPrivilegiado = rolesUsr.length === 0 || rolesUsr.includes('FULL ADMIN') || rolesUsr.includes('ADMIN IES') || rolesUsr.includes('EQUIPO DE GESTION') || rolesUsr.includes('SECRETARIA');

  lista.forEach(item => {
    const geiChecked = item.cargadaGEI ? 'checked' : '';
    const disabledAttr = esPrivilegiado ? '' : 'disabled';

    const botonVisorPDF = item.comprobanteUrl 
      ? `<button type="button" onclick="abrirVisorLicencia('${item.comprobanteUrl}', '${item.docente}', '${item.tipoLicencia}')" class="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold rounded-xl text-[11px] flex items-center gap-1 mx-auto transition-colors cursor-pointer" title="Ver Formulario / Certificado PDF">
          <i data-lucide="file-text" class="w-3.5 h-3.5"></i> Ver PDF
         </button>`
      : `<span class="text-slate-600 italic text-[10px]">Sin Adjunto</span>`;

    tb.innerHTML += `
      <tr class="hover:bg-slate-800/30 transition-colors">
        <td class="py-3 px-4 text-slate-400 font-medium text-[11px]">${item.timestamp || '-'}</td>
        <td class="py-3 px-4">
          <div class="font-bold text-white">${item.docente || '-'}</div>
          <div class="text-[10px] text-slate-400 font-medium">DNI: ${item.dni || '-'}</div>
        </td>
        <td class="py-3 px-4">
          <span class="font-extrabold text-amber-400">Cód. ${item.codigo || '-'}</span>
          <div class="text-slate-300 font-semibold text-[11px]">${item.tipoLicencia || '-'}</div>
        </td>
        <td class="py-3 px-4 text-center">
          <div class="font-black text-slate-200">${item.desde || '-'} a ${item.hasta || '-'}</div>
        </td>
        <td class="py-3 px-4 text-center">
          ${botonVisorPDF}
        </td>
        <td class="py-3 px-4 text-center">
          <input type="checkbox" ${geiChecked} ${disabledAttr} onchange="actualizarGEILicencia(${item.id}, this.checked)" class="w-4 h-4 accent-emerald-500 rounded cursor-pointer ${!esPrivilegiado ? 'opacity-40 cursor-not-allowed' : ''}">
        </td>
        <td class="py-3 px-4 text-center">
          <div class="flex items-center justify-center gap-1">
            <button type="button" onclick="abrirDetallesLicencia(${item.id})" class="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-all cursor-pointer" title="Ver Especificaciones y Fecha GEI">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
            ${esPrivilegiado ? `
              <button type="button" onclick="abrirEditarLicencia(${item.id})" class="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-xl transition-all cursor-pointer" title="Editar Licencia">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
              </button>
              <button type="button" onclick="eliminarLicencia(${item.id})" class="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all cursor-pointer" title="Eliminar Registro">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  });

  if (window.lucide) lucide.createIcons();
}

// 6. VISOR DE PDF Y DRIVE
function abrirVisorLicencia(urlDrive, docente, tipoLicencia) {
  const modal = document.getElementById('modalVisorLicencia');
  const iframe = document.getElementById('iframe-visor-pdf');
  const btnDirecto = document.getElementById('visor-btn-drive-directo');
  const titulo = document.getElementById('visor-docente-titulo');
  const subtitulo = document.getElementById('visor-tipo-subtitulo');

  if (!modal || !iframe) return;

  titulo.textContent = docente || 'Visor de Licencia';
  subtitulo.textContent = tipoLicencia || 'Documentación Adjunta';
  btnDirecto.href = urlDrive;

  let urlEmbed = urlDrive;
  if (urlDrive.includes('drive.google.com')) {
    if (urlDrive.includes('/file/d/')) {
      const fileId = urlDrive.split('/file/d/')[1].split('/')[0];
      urlEmbed = `https://drive.google.com/file/d/${fileId}/preview`;
    } else if (urlDrive.includes('id=')) {
      const fileId = new URLSearchParams(urlDrive.split('?')[1]).get('id');
      if (fileId) urlEmbed = `https://drive.google.com/file/d/${fileId}/preview`;
    }
  }

  iframe.src = urlEmbed;
  modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function cerrarVisorLicencia() {
  const modal = document.getElementById('modalVisorLicencia');
  const iframe = document.getElementById('iframe-visor-pdf');
  if (iframe) iframe.src = '';
  if (modal) modal.classList.add('hidden');
}

// 7. ABRIR DETALLES CON FECHA DE CARGA GEI
function abrirDetallesLicencia(idLicencia) {
  const item = datosLicenciasMemoria.find(l => l.id === idLicencia);
  const modal = document.getElementById('modalDetallesLicencia');
  const container = document.getElementById('contenedor-detalles-dinamicos-lic');

  if (!item || !container || !modal) return;

  const geiFechaTexto = item.cargadaGEI 
    ? `<span class="text-emerald-400 font-extrabold">${item.fechaCargaGEI || 'Cargada'}</span>`
    : `<span class="text-slate-500 italic">Pendiente de carga</span>`;

  let html = `
    <div class="py-2 flex justify-between bg-slate-900/60 p-2 rounded-xl mb-2">
      <span class="text-slate-300 font-bold">Fecha de Carga al GEI:</span>
      ${geiFechaTexto}
    </div>
    <div class="py-1.5 flex justify-between"><span class="text-slate-400 font-bold">Docente:</span><span class="text-white font-extrabold">${item.docente}</span></div>
    <div class="py-1.5 flex justify-between"><span class="text-slate-400 font-bold">DNI:</span><span class="text-slate-200">${item.dni}</span></div>
    <div class="py-1.5 flex justify-between"><span class="text-slate-400 font-bold">Email:</span><span class="text-slate-200">${item.email}</span></div>
    <div class="py-1.5 flex justify-between"><span class="text-slate-400 font-bold">Tipo:</span><span class="text-amber-400 font-bold">${item.tipoLicencia} (Cód. ${item.codigo})</span></div>
    <div class="py-1.5 flex justify-between"><span class="text-slate-400 font-bold">Período:</span><span class="text-slate-200 font-bold">${item.desde} al ${item.hasta}</span></div>
  `;

  if (item.detallesAdicionales && Object.keys(item.detallesAdicionales).length > 0) {
    Object.keys(item.detallesAdicionales).forEach(k => {
      html += `<div class="py-1.5 flex justify-between"><span class="text-slate-400 font-bold">${k}:</span><span class="text-slate-200">${item.detallesAdicionales[k]}</span></div>`;
    });
  }

  container.innerHTML = html;
  modal.classList.remove('hidden');
}

function cerrarModalDetallesLicencia() {
  document.getElementById('modalDetallesLicencia')?.classList.add('hidden');
}

// 8. CALENDARIOS FLOTANTES PARA FECHAS LICENCIA
function abrirCalendarioFechaLicencia(campo) {
  campoFechaCalendarioActivo = campo;
  const labelTitulo = document.getElementById('cal-lic-titulo-campo');
  if (labelTitulo) {
    labelTitulo.innerHTML = `<i data-lucide="calendar" class="w-4 h-4"></i> Seleccionar Fecha ${campo.toUpperCase()}`;
  }

  const modal = document.getElementById('modalCalendarioLicencias');
  if (modal) {
    modal.classList.remove('hidden');
    renderizarCalendarioLicencias();
    if (window.lucide) lucide.createIcons();
  }
}

function cerrarCalendarioLicencias() {
  document.getElementById('modalCalendarioLicencias')?.classList.add('hidden');
}

function cambiarMesCalendarioLicencias(dir) {
  calMesAnoLicencias.setMonth(calMesAnoLicencias.getMonth() + dir);
  renderizarCalendarioLicencias();
}

function renderizarCalendarioLicencias() {
  const label = document.getElementById('cal-lic-mes-ano-label');
  const grid = document.getElementById('grid-dias-calendario-licencias');
  if (!label || !grid) return;

  const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
  const mes = calMesAnoLicencias.getMonth();
  const ano = calMesAnoLicencias.getFullYear();

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
      <button type="button" onclick="seleccionarFechaCalendarioLicencias('${fechaString}')" class="p-2 rounded-xl text-xs font-bold transition-all ${esHoy ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'hover:bg-amber-500/20 text-slate-200'} cursor-pointer">
        ${d}
      </button>
    `;
  }

  grid.innerHTML = html;
}

function seleccionarFechaCalendarioLicencias(fechaStr) {
  if (campoFechaCalendarioActivo === 'desde') {
    fechaLicDesdeSeleccionada = fechaStr;
    document.getElementById('txt-fecha-lic-desde').textContent = fechaStr;
  } else {
    fechaLicHastaSeleccionada = fechaStr;
    document.getElementById('txt-fecha-lic-hasta').textContent = fechaStr;
  }
  cerrarCalendarioLicencias();
}

// 9. ABRIR Y GUARDAR EDICIÓN DE LICENCIAS
function abrirEditarLicencia(idLicencia) {
  const item = datosLicenciasMemoria.find(l => l.id === idLicencia);
  if (!item) return;

  document.getElementById('edit-lic-id').value = item.id;
  document.getElementById('edit-lic-docente').value = item.docente || '';
  document.getElementById('edit-lic-dni').value = item.dni || '';

  // Buscar coincidencia de tipo de licencia en desplegable
  const selectTipo = document.getElementById('edit-lic-tipo-select');
  if (selectTipo) {
    let encontrado = false;
    for (let i = 0; i < selectTipo.options.length; i++) {
      if (selectTipo.options[i].value.toLowerCase().includes((item.tipoLicencia || '').toLowerCase())) {
        selectTipo.selectedIndex = i;
        encontrado = true;
        break;
      }
    }
    if (!encontrado) selectTipo.selectedIndex = 0;
    actualizarCodigoLicenciaEditar();
  }

  fechaLicDesdeSeleccionada = item.desde || '01/11/2026';
  fechaLicHastaSeleccionada = item.hasta || '15/11/2026';

  document.getElementById('txt-fecha-lic-desde').textContent = fechaLicDesdeSeleccionada;
  document.getElementById('txt-fecha-lic-hasta').textContent = fechaLicHastaSeleccionada;

  document.getElementById('edit-lic-url').value = item.comprobanteUrl || '';

  document.getElementById('modalEditarLicencia').classList.remove('hidden');
}

function cerrarModalEditarLicencia() {
  document.getElementById('modalEditarLicencia')?.classList.add('hidden');
}

async function guardarEdicionLicencia() {
  const id = document.getElementById('edit-lic-id').value;
  const selectTipo = document.getElementById('edit-lic-tipo-select');

  const payload = {
    id,
    dni: document.getElementById('edit-lic-dni').value.trim(),
    docente: document.getElementById('edit-lic-docente').value.trim(),
    tipoLicencia: selectTipo.value,
    codigo: document.getElementById('edit-lic-codigo').value,
    desde: fechaLicDesdeSeleccionada,
    hasta: fechaLicHastaSeleccionada,
    comprobanteUrl: document.getElementById('edit-lic-url').value.trim()
  };

  try {
    const res = await fetch('/api/licencias/editar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Error al editar.");

    alert("🟢 Licencia modificada con éxito.");
    cerrarModalEditarLicencia();
    await cargarLicencias();
  } catch (e) {
    alert("Error al intentar modificar la licencia.");
  }
}

async function actualizarGEILicencia(idLicencia, checkVal) {
  try {
    const res = await fetch('/api/licencias/actualizar-gei', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: idLicencia, cargadaGEI: checkVal })
    });

    const data = await res.json();
    const item = datosLicenciasMemoria.find(l => l.id === idLicencia);
    if (item) {
      item.cargadaGEI = checkVal;
      item.fechaCargaGEI = data.fechaCargaGEI || "";
    }

    if (checkVal) {
      alert(`🟢 Licencia marcada en GEI. Notificación enviada al docente.`);
    }
  } catch (err) {
    console.error('Error al actualizar GEI:', err);
    alert('Error al actualizar el estado GEI.');
  }
}

async function eliminarLicencia(idLicencia) {
  const confirmacion = confirm("¿Estás seguro de que deseas eliminar este registro de licencia?");
  if (!confirmacion) return;

  try {
    const res = await fetch('/api/licencias/eliminar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: idLicencia })
    });

    if (!res.ok) throw new Error("Error al eliminar.");

    alert("🗑️ Registro eliminado correctamente.");
    await cargarLicencias();
  } catch (e) {
    alert("Error al intentar eliminar el registro.");
  }
}
