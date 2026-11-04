var listaCronogramasExamenes = [];
var cronogramaActivoExamenes = null;
var detallesExamenesActivos = [];
var listaCarrerasTodas = [];
var listaDocentesTodas = [];

// CONFIGURACIÓN GLOBAL INSTITUCIONAL
var configGlobalEncabezado = {
  turno: 'ORDINARIO',
  llamado: 'DOS LLAMADOS',
  mes1: 'Noviembre',
  mes2: 'Diciembre',
  ano: '2026',
  fecha_inicio_1L: '',
  fecha_fin_1L: '',
  fecha_inicio_2L: '',
  fecha_fin_2L: ''
};

var idMesaAccion = null;
var modoCalendario = 'reprogramar';
var campoGlobalTarget = '';
var calMesAnoActual = new Date(2026, 10, 1);

async function init_examenes() {
  await cargarConfigGlobalServidor();
  await cargarCarrerasSistema();
  await cargarDocentesSistema();
  await cargarCronogramasExamenesLista();
  if (window.lucide) lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', () => {
  init_examenes();
});

// OBTENER CONFIGURACIÓN GLOBAL COMPARTIDA
async function cargarConfigGlobalServidor() {
  try {
    const res = await fetch('/api/examenes/config-global');
    if (res.ok) {
      const data = await res.json();
      if (data && data.id) {
        configGlobalEncabezado = data;

        document.getElementById('cfg-examenes-turno').value = configGlobalEncabezado.turno || 'ORDINARIO';
        document.getElementById('cfg-examenes-llamado').value = configGlobalEncabezado.llamado || 'DOS LLAMADOS';
        document.getElementById('cfg-examenes-mes1').value = configGlobalEncabezado.mes1 || 'Noviembre';
        document.getElementById('cfg-examenes-mes2').value = configGlobalEncabezado.mes2 || 'Diciembre';
        document.getElementById('cfg-examenes-ano').value = configGlobalEncabezado.ano || '2026';

        actualizarTextoBotonFecha('f1-desde', configGlobalEncabezado.fecha_inicio_1L);
        actualizarTextoBotonFecha('f1-hasta', configGlobalEncabezado.fecha_fin_1L);
        actualizarTextoBotonFecha('f2-desde', configGlobalEncabezado.fecha_inicio_2L);
        actualizarTextoBotonFecha('f2-hasta', configGlobalEncabezado.fecha_fin_2L);

        evaluarDespliegueFechasLlamado();
      }
    }
  } catch (err) {
    console.error('Error cargando configuración global:', err);
  }
}

async function guardarConfigGlobalServidor() {
  configGlobalEncabezado.turno = document.getElementById('cfg-examenes-turno')?.value || 'ORDINARIO';
  configGlobalEncabezado.llamado = document.getElementById('cfg-examenes-llamado')?.value || 'DOS LLAMADOS';
  configGlobalEncabezado.mes1 = document.getElementById('cfg-examenes-mes1')?.value || 'Noviembre';
  configGlobalEncabezado.mes2 = document.getElementById('cfg-examenes-mes2')?.value || 'Diciembre';
  configGlobalEncabezado.ano = document.getElementById('cfg-examenes-ano')?.value || '2026';

  try {
    await fetch('/api/examenes/config-global', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configGlobalEncabezado)
    });
    renderizarPDFExamenes();
  } catch (err) {
    console.error('Error al guardar configuración global:', err);
  }
}

async function cargarCarrerasSistema() {
  try {
    const res = await fetch('/api/carreras');
    if (res.ok) listaCarrerasTodas = await res.json();
  } catch (err) {
    console.error('Error cargando carreras:', err);
  }
}

async function cargarDocentesSistema() {
  try {
    const res = await fetch('/api/examenes/docentes-lista');
    if (res.ok) listaDocentesTodas = await res.json();
  } catch (err) {
    console.error('Error cargando docentes:', err);
  }
}

async function cargarCronogramasExamenesLista() {
  try {
    const res = await fetch('/api/examenes');
    if (!res.ok) return;
    listaCronogramasExamenes = await res.json();

    const select = document.getElementById('select-cronograma-examenes');
    if (!select) return;

    if (!listaCronogramasExamenes || listaCronogramasExamenes.length === 0) {
      select.innerHTML = `<option value="">No hay cronogramas creados</option>`;
      document.getElementById('contenedor-jornadas-carreras-tabla').innerHTML = `
        <div class="theme-card border p-8 text-center text-slate-400 font-medium">Haz clic en "Crear Cronograma" para comenzar.</div>
      `;
      return;
    }

    select.innerHTML = listaCronogramasExamenes.map(c => `
      <option value="${c.id}">${c.nombre}</option>
    `).join('');

    if (listaCronogramasExamenes.length > 0) {
      cambiarCronogramaExamenesActivo(listaCronogramasExamenes[0].id);
    }
  } catch (err) {
    console.error('Error al cargar cronogramas:', err);
  }
}

async function cambiarCronogramaExamenesActivo(cronogramaId) {
  if (!cronogramaId) return;

  try {
    const res = await fetch(`/api/examenes/${cronogramaId}/detalles`);
    if (!res.ok) return;
    const data = await res.json();

    cronogramaActivoExamenes = data.cronograma;
    detallesExamenesActivos = data.detalles || [];

    renderizarTablaExamenes();
    renderizarPDFExamenes();
  } catch (err) {
    console.error('Error cargando detalles:', err);
  }
}

function actualizarTextoBotonFecha(idKey, fechaVal) {
  const el = document.getElementById(`txt-${idKey}`);
  if (el) el.textContent = fechaVal && fechaVal.trim() !== '' ? fechaVal : 'Seleccionar';
}

function evaluarDespliegueFechasLlamado() {
  const selectLlamado = document.getElementById('cfg-examenes-llamado');
  const box2L = document.getElementById('box-rango-2L');
  const boxSelectMes2 = document.getElementById('box-select-mes2');
  const lbl1L = document.getElementById('lbl-rango-1L');

  if (selectLlamado) {
    const esDosLlamados = selectLlamado.value === 'DOS LLAMADOS';
    if (lbl1L) lbl1L.textContent = esDosLlamados ? '1° Llamado (Global):' : 'Llamado Único (Global):';
    
    if (box2L) {
      if (esDosLlamados) box2L.classList.remove('hidden');
      else box2L.classList.add('hidden');
    }

    if (boxSelectMes2) {
      if (esDosLlamados) boxSelectMes2.classList.remove('hidden');
      else boxSelectMes2.classList.add('hidden');
    }
  }
  guardarConfigGlobalServidor();
}

// RENDERIZADO TABLA PANTALLA
function renderizarTablaExamenes() {
  const container = document.getElementById('contenedor-jornadas-carreras-tabla');
  if (!container) return;

  if (!detallesExamenesActivos || detallesExamenesActivos.length === 0) {
    container.innerHTML = `
      <div class="theme-card border p-8 text-center text-slate-400 font-medium rounded-2xl">No hay materias asignadas en este cronograma.</div>
    `;
    return;
  }

  const estructura = {};
  const ordenDias = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES'];

  detallesExamenesActivos.forEach(item => {
    const dia = item.dia_semana || 'LUNES';
    const carrera = item.carrera_nombre || 'CARRERA';

    if (!estructura[dia]) estructura[dia] = {};
    if (!estructura[dia][carrera]) estructura[dia][carrera] = [];

    estructura[dia][carrera].push(item);
  });

  let docenteOptionsHtml = `<option value="">-- Sin Asignar --</option>`;
  if (listaDocentesTodas && listaDocentesTodas.length > 0) {
    docenteOptionsHtml += listaDocentesTodas.map(d => {
      const nom = `${d.apellido.toUpperCase()}, ${d.nombre}`;
      return `<option value="${nom}">${nom}</option>`;
    }).join('');
  }

  let htmlGeneral = '';

  ordenDias.forEach(diaKey => {
    if (!estructura[diaKey]) return;

    htmlGeneral += `
      <div class="theme-card border rounded-2xl overflow-hidden shadow-xl space-y-3 p-4">
        <div class="flex items-center justify-between border-b border-slate-700/60 pb-2">
          <h3 class="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <i data-lucide="calendar" class="w-4 h-4"></i> JORNADA ${diaKey}
          </h3>
        </div>
    `;

    Object.keys(estructura[diaKey]).forEach(carreraNombre => {
      const materiasCarrera = estructura[diaKey][carreraNombre];
      const datosCarreraObj = listaCarrerasTodas.find(c => c.nombre === carreraNombre);
      const resolucionTexto = datosCarreraObj && datosCarreraObj.resolucion ? ` (${datosCarreraObj.resolucion})` : '';

      materiasCarrera.sort((a, b) => {
        if (a.ano_cursado !== b.ano_cursado) return a.ano_cursado - b.ano_cursado;
        return String(a.codigo_espacio || '').localeCompare(String(b.codigo_espacio || ''));
      });

      let filasHtml = materiasCarrera.map(m => {
        const reprogramadaBadge = m.reprogramada_nota 
          ? `<div class="bg-rose-600 text-white font-black text-[10px] px-2 py-0.5 rounded-lg mt-1 inline-block uppercase">
              ${m.reprogramada_nota}
             </div>` 
          : '';

        const presSelectHtml = `
          <select onchange="actualizarCampoDirectoMesa(${m.id}, 'presidente', this.value)" class="w-full bg-[#182235] border border-slate-700/60 rounded-xl p-1.5 text-xs text-slate-200 outline-none cursor-pointer font-medium">
            ${docenteOptionsHtml.replace(`value="${m.presidente}"`, `value="${m.presidente}" selected`)}
          </select>
        `;

        const voc1SelectHtml = `
          <select onchange="actualizarCampoDirectoMesa(${m.id}, 'vocal1', this.value)" class="w-full bg-[#182235] border border-slate-700/60 rounded-xl p-1.5 text-xs text-slate-200 outline-none cursor-pointer font-medium">
            ${docenteOptionsHtml.replace(`value="${m.vocal1}"`, `value="${m.vocal1}" selected`)}
          </select>
        `;

        const voc2SelectHtml = `
          <select onchange="actualizarCampoDirectoMesa(${m.id}, 'vocal2', this.value)" class="w-full bg-[#182235] border border-slate-700/60 rounded-xl p-1.5 text-xs text-slate-200 outline-none cursor-pointer font-medium">
            ${docenteOptionsHtml.replace(`value="${m.vocal2}"`, `value="${m.vocal2}" selected`)}
          </select>
        `;

        const codigoEsp = String(m.codigo_espacio || '000').padStart(3, '0');
        const nombreMateriaLimpio = m.materia_nombre.replace(/^\(\d+\)\s*-\s*/, '');

        return `
          <tr class="hover:bg-slate-800/40 transition-colors border-b border-slate-800/40">
            <td class="p-3 w-16 text-center font-bold text-slate-300 text-xs">${m.ano_cursado}° Año</td>

            <td class="p-3 font-extrabold text-white">
              <span>(${codigoEsp}) - ${nombreMateriaLimpio}</span>
              ${reprogramadaBadge}
            </td>

            <td class="p-3 w-44">${presSelectHtml}</td>
            <td class="p-3 w-40">${voc1SelectHtml}</td>
            <td class="p-3 w-40">${voc2SelectHtml}</td>

            <td class="p-3 text-center w-28">
              <div class="flex items-center justify-center gap-1.5">
                <button type="button" onclick="abrirModalMoverMesaDia(${m.id}, '${m.dia_semana}')" class="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl transition-all cursor-pointer" title="Mover Día">
                  <i data-lucide="arrow-right-left" class="w-4 h-4"></i>
                </button>

                <button type="button" onclick="abrirCalendarioReprogramar(${m.id})" class="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl transition-all cursor-pointer" title="Reprogramar Mesa">
                  <i data-lucide="clock" class="w-4 h-4"></i>
                </button>

                <button type="button" onclick="eliminarDetalleExamen(${m.id})" class="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-800 rounded-xl transition-all cursor-pointer" title="Eliminar Mesa">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      htmlGeneral += `
        <div class="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div class="bg-slate-800/80 px-3 py-1.5 text-xs font-black text-slate-200 uppercase tracking-wide border-b border-slate-700/50">
            ${carreraNombre}${resolucionTexto}
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-950/40 text-slate-400 uppercase font-bold text-[9px]">
                  <th class="p-2 w-16 text-center">Año</th>
                  <th class="p-2">Materia / Espacio</th>
                  <th class="p-2 w-44">Pres. Mesa</th>
                  <th class="p-2 w-40">Vocal 1</th>
                  <th class="p-2 w-40">Vocal 2</th>
                  <th class="p-2 text-center w-28">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/40">
                ${filasHtml}
              </tbody>
            </table>
          </div>
        </div>
      `;
    });

    htmlGeneral += `</div>`;
  });

  container.innerHTML = htmlGeneral;
  if (window.lucide) lucide.createIcons();
}

async function actualizarCampoDirectoMesa(idDetalle, campo, valor) {
  try {
    await fetch(`/api/examenes/detalles/${idDetalle}/campo`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campo, valor })
    });
    const m = detallesExamenesActivos.find(item => item.id === idDetalle);
    if (m) m[campo] = valor;

    if (campo === 'dia_semana') {
      await cambiarCronogramaExamenesActivo(cronogramaActivoExamenes.id);
    } else {
      renderizarPDFExamenes();
    }
  } catch (err) {
    console.error('Error al actualizar:', err);
  }
}

// MOVER MESA DE DÍA
function abrirModalMoverMesaDia(idDetalle, diaActual) {
  idMesaAccion = idDetalle;
  document.getElementById('select-destino-dia-mesa').value = diaActual || 'LUNES';
  document.getElementById('modalMoverMesaDia').classList.remove('hidden');
}

function cerrarModalMoverMesaDia() {
  document.getElementById('modalMoverMesaDia').classList.add('hidden');
  idMesaAccion = null;
}

async function confirmarMoverMesaDia() {
  if (!idMesaAccion) return;
  const nuevoDia = document.getElementById('select-destino-dia-mesa').value;
  await actualizarCampoDirectoMesa(idMesaAccion, 'dia_semana', nuevoDia);
  cerrarModalMoverMesaDia();
}

// CALENDARIO TIPO CONSULTAS
function abrirCalendarioReprogramar(idDetalle) {
  modoCalendario = 'reprogramar';
  idMesaAccion = idDetalle;
  document.getElementById('btn-quitar-reprog').classList.remove('hidden');
  document.getElementById('cal-modal-titulo').innerHTML = `<i data-lucide="clock" class="w-4 h-4"></i> Reprogramar Mesa`;
  document.getElementById('modalCalendarioReprogramar').classList.remove('hidden');
  renderizarCalendarioExamenes();
  if (window.lucide) lucide.createIcons();
}

function abrirCalendarioGlobal(keyTarget) {
  modoCalendario = 'global';
  campoGlobalTarget = keyTarget;
  document.getElementById('btn-quitar-reprog').classList.add('hidden');
  document.getElementById('cal-modal-titulo').innerHTML = `<i data-lucide="calendar" class="w-4 h-4"></i> Seleccionar Fecha Rango`;
  document.getElementById('modalCalendarioReprogramar').classList.remove('hidden');
  renderizarCalendarioExamenes();
  if (window.lucide) lucide.createIcons();
}

function cerrarModalCalendarioReprogramar() {
  document.getElementById('modalCalendarioReprogramar').classList.add('hidden');
  idMesaAccion = null;
}

function cambiarMesCalendarioExamenes(dir) {
  calMesAnoActual.setMonth(calMesAnoActual.getMonth() + dir);
  renderizarCalendarioExamenes();
}

function renderizarCalendarioExamenes() {
  const label = document.getElementById('cal-examenes-mes-ano-label');
  const grid = document.getElementById('grid-dias-calendario-examenes');
  if (!label || !grid) return;

  const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
  const mes = calMesAnoActual.getMonth();
  const ano = calMesAnoActual.getFullYear();

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
      <button type="button" onclick="seleccionarFechaCalendarioExamenes('${fechaString}')" class="p-2 rounded-xl text-xs font-bold transition-all ${esHoy ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'hover:bg-amber-500/20 text-slate-200'} cursor-pointer">
        ${d}
      </button>
    `;
  }

  grid.innerHTML = html;
}

async function seleccionarFechaCalendarioExamenes(fechaStr) {
  if (modoCalendario === 'reprogramar') {
    if (!idMesaAccion) return;
    const textoNota = `Reprogramada para fecha ${fechaStr}`;
    await actualizarCampoDirectoMesa(idMesaAccion, 'reprogramada_nota', textoNota);
    cerrarModalCalendarioReprogramar();
    await cambiarCronogramaExamenesActivo(cronogramaActivoExamenes.id);
  } else if (modoCalendario === 'global') {
    if (campoGlobalTarget === 'f1_desde') configGlobalEncabezado.fecha_inicio_1L = fechaStr;
    if (campoGlobalTarget === 'f1_hasta') configGlobalEncabezado.fecha_fin_1L = fechaStr;
    if (campoGlobalTarget === 'f2_desde') configGlobalEncabezado.fecha_inicio_2L = fechaStr;
    if (campoGlobalTarget === 'f2_hasta') configGlobalEncabezado.fecha_fin_2L = fechaStr;

    actualizarTextoBotonFecha(campoGlobalTarget.replace('_', '-'), fechaStr);
    cerrarModalCalendarioReprogramar();
    await guardarConfigGlobalServidor();
  }
}

async function quitarReprogramacionMesa() {
  if (!idMesaAccion) return;
  await actualizarCampoDirectoMesa(idMesaAccion, 'reprogramada_nota', '');
  cerrarModalCalendarioReprogramar();
  await cambiarCronogramaExamenesActivo(cronogramaActivoExamenes.id);
}

// CREAR CRONOGRAMA
window.abrirModalNuevoCronogramaExamenes = function() {
  const modal = document.getElementById('modalNuevoCronogramaExamenes');
  const container = document.getElementById('contenedor-checkbox-carreras-examenes');
  if (!modal) return;

  if (container) {
    const renderCheckboxes = () => {
      if (!listaCarrerasTodas || listaCarrerasTodas.length === 0) {
        container.innerHTML = `<p class="text-slate-400 text-xs p-2">No hay carreras registradas.</p>`;
      } else {
        container.innerHTML = listaCarrerasTodas.map(c => `
          <label class="flex items-center gap-2 text-slate-200 text-xs font-bold cursor-pointer hover:bg-slate-800/40 p-1 rounded-lg">
            <input type="checkbox" name="carreras_check_examenes" value="${c.id}" class="accent-amber-400 rounded w-4 h-4 cursor-pointer">
            <span>(${c.codigo}) ${c.nombre}</span>
          </label>
        `).join('');
      }
    };

    if (!listaCarrerasTodas || listaCarrerasTodas.length === 0) {
      cargarCarrerasSistema().then(renderCheckboxes);
    } else {
      renderCheckboxes();
    }
  }

  modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
};

window.cerrarModalNuevoCronogramaExamenes = function() {
  const modal = document.getElementById('modalNuevoCronogramaExamenes');
  if (modal) modal.classList.add('hidden');
};

window.guardarNuevoCronogramaExamenes = async function(e) {
  if (e) e.preventDefault();

  const nombreInput = document.getElementById('crono-nombre-examenes');
  const nombre = nombreInput ? nombreInput.value.trim() : '';

  const checkboxes = document.querySelectorAll('input[name="carreras_check_examenes"]:checked');
  const carreras_ids = Array.from(checkboxes).map(cb => cb.value);

  if (!nombre) {
    alert('Por favor escribe un nombre para el cronograma.');
    return;
  }

  if (carreras_ids.length === 0) {
    alert('Por favor selecciona al menos una carrera.');
    return;
  }

  try {
    const res = await fetch('/api/examenes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, carreras_ids })
    });

    if (!res.ok) {
      const errData = await res.json();
      alert(`Error en el servidor: ${errData.error || 'No se pudo crear'}`);
      return;
    }

    const data = await res.json();
    window.cerrarModalNuevoCronogramaExamenes();
    if (nombreInput) nombreInput.value = '';

    await cargarCronogramasExamenesLista();
    if (data.id) {
      document.getElementById('select-cronograma-examenes').value = data.id;
      await cambiarCronogramaExamenesActivo(data.id);
    }
  } catch (err) {
    console.error('Error guardando cronograma:', err);
    alert('Ocurrió un error al conectar con el servidor.');
  }
};

async function eliminarDetalleExamen(idDetalle) {
  if (!confirm('¿Deseas quitar esta mesa del cronograma?')) return;

  try {
    const res = await fetch(`/api/examenes/detalles/${idDetalle}`, { method: 'DELETE' });
    if (res.ok) {
      await cambiarCronogramaExamenesActivo(cronogramaActivoExamenes.id);
    }
  } catch (err) {
    console.error('Error al eliminar detalle:', err);
  }
}

// RENDERIZADO DEL PDF CON LOGO GRANDE Y JERARQUÍA IMPONENTE
function renderizarPDFExamenes() {
  const container = document.getElementById('pdf-examenes-jornadas-container');
  if (!container || !cronogramaActivoExamenes) return;

  const turnoVal = configGlobalEncabezado.turno || 'ORDINARIO';
  const llamadoVal = configGlobalEncabezado.llamado || 'DOS LLAMADOS';
  const mes1Val = configGlobalEncabezado.mes1 || 'Noviembre';
  const mes2Val = configGlobalEncabezado.mes2 || 'Diciembre';
  const anoVal = configGlobalEncabezado.ano || '2026';

  document.getElementById('pdf-examenes-titulo').textContent = cronogramaActivoExamenes.nombre;
  document.getElementById('pdf-examenes-turno-llamado').textContent = `TURNO ${turnoVal} • ${llamadoVal}`;
  
  const textoMeses = llamadoVal === 'DOS LLAMADOS' ? `${mes1Val} / ${mes2Val} ${anoVal}` : `${mes1Val} ${anoVal}`;
  document.getElementById('pdf-examenes-periodo').textContent = textoMeses.toUpperCase();

  const idsCarreras = cronogramaActivoExamenes.carreras_ids ? cronogramaActivoExamenes.carreras_ids.split(',').map(n => parseInt(n.trim())) : [];
  const carrerasAsoc = listaCarrerasTodas.filter(c => idsCarreras.includes(c.id));

  const carreraPrincipal = carrerasAsoc[0] || {};
  const colorTema = carreraPrincipal.color_tema || '#059669';

  const banda = document.getElementById('pdf-examenes-banda');
  if (banda) banda.style.backgroundColor = colorTema;

  const footerDot = document.getElementById('pdf-footer-dot');
  if (footerDot) footerDot.style.backgroundColor = colorTema;

  // LOGO INSTITUCIONAL / CARRERA DE GRAN TAMAÑO IMPONENTE
  const logoContainer = document.getElementById('pdf-container-logo-carrera');
  if (logoContainer) {
    const carreraConLogo = carrerasAsoc.find(c => c.logo_url && c.logo_url.trim() !== '');
    if (carreraConLogo) {
      logoContainer.innerHTML = `<img src="${carreraConLogo.logo_url}" class="h-20 w-auto object-contain">`;
    } else {
      logoContainer.innerHTML = '';
    }
  }

  // LISTADO DE CARRERAS APILADO LIMPIAMENTE EN BLOQUES
  const contenedorCarrerasSub = document.getElementById('pdf-examenes-subcarreras');
  if (contenedorCarrerasSub) {
    contenedorCarrerasSub.innerHTML = carrerasAsoc.map(c => `
      <div class="block uppercase font-black text-slate-900 border-b border-slate-200/60 pb-0.5 last:border-b-0">
        ${c.nombre} <span class="font-bold text-slate-600">(RES. N° ${c.resolucion || '000-DGE-2026'})</span>
      </div>
    `).join('');
  }

  const ordenDias = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES'];
  const estructura = {};

  detallesExamenesActivos.forEach(d => {
    const dia = d.dia_semana || 'LUNES';
    const carrera = d.carrera_nombre || 'CARRERA';
    if (!estructura[dia]) estructura[dia] = {};
    if (!estructura[dia][carrera]) estructura[dia][carrera] = [];
    estructura[dia][carrera].push(d);
  });

  container.innerHTML = '';

  ordenDias.forEach((diaKey, indexDia) => {
    if (!estructura[diaKey]) return;

    // BLOQUE DE JORNADA COMPLETA Evitando saltos huérfanos
    const blockDia = document.createElement('div');
    blockDia.className = 'pdf-jornada-block border-2 border-slate-300 rounded-2xl overflow-hidden text-[11px] leading-relaxed mb-6 shadow-sm';
    blockDia.style.pageBreakInside = 'avoid';
    blockDia.style.breakInside = 'avoid';

    let fechaL1Str = '';
    let fechaL2Str = '';

    if (configGlobalEncabezado.fecha_inicio_1L) {
      const parts = configGlobalEncabezado.fecha_inicio_1L.split('/');
      if (parts.length === 3) {
        const base1 = new Date(parts[2], parts[1] - 1, parts[0]);
        base1.setDate(base1.getDate() + indexDia);
        fechaL1Str = `${String(base1.getDate()).padStart(2, '0')}/${String(base1.getMonth() + 1).padStart(2, '0')}/${base1.getFullYear()}`;
      } else {
        fechaL1Str = configGlobalEncabezado.fecha_inicio_1L;
      }
    }

    if (configGlobalEncabezado.fecha_inicio_2L) {
      const parts2 = configGlobalEncabezado.fecha_inicio_2L.split('/');
      if (parts2.length === 3) {
        const base2 = new Date(parts2[2], parts2[1] - 1, parts2[0]);
        base2.setDate(base2.getDate() + indexDia);
        fechaL2Str = `${String(base2.getDate()).padStart(2, '0')}/${String(base2.getMonth() + 1).padStart(2, '0')}/${base2.getFullYear()}`;
      } else {
        fechaL2Str = configGlobalEncabezado.fecha_inicio_2L;
      }
    }

    if (!fechaL1Str) fechaL1Str = `${String(2 + indexDia).padStart(2, '0')}/11/2026`;
    if (!fechaL2Str && llamadoVal === 'DOS LLAMADOS') fechaL2Str = `${String(16 + indexDia).padStart(2, '0')}/11/2026`;

    const txtFechasLlamados = llamadoVal === 'DOS LLAMADOS' 
      ? `(1° LLAMADO: ${fechaL1Str} | 2° LLAMADO: ${fechaL2Str})`
      : `(1° LLAMADO: ${fechaL1Str})`;

    let htmlCarreras = '';

    Object.keys(estructura[diaKey]).forEach(carreraNombre => {
      const items = estructura[diaKey][carreraNombre];
      const datosCarreraObj = listaCarrerasTodas.find(c => c.nombre === carreraNombre);
      const resolucionTexto = datosCarreraObj && datosCarreraObj.resolucion ? ` (RES. N° ${datosCarreraObj.resolucion})` : '';

      items.sort((a, b) => {
        if (a.ano_cursado !== b.ano_cursado) return a.ano_cursado - b.ano_cursado;
        return String(a.codigo_espacio || '').localeCompare(String(b.codigo_espacio || ''));
      });

      let filasTable = '';
      items.forEach(item => {
        const reprogramada = item.reprogramada_nota 
          ? `<div class="bg-rose-600 text-white font-black text-[9.5px] px-2.5 py-0.5 rounded-md shadow-sm inline-block uppercase mt-1">
              ${item.reprogramada_nota}
             </div>` 
          : '';

        const codigoEsp = String(item.codigo_espacio || '000').padStart(3, '0');
        const nombreMateriaLimpio = item.materia_nombre.replace(/^\(\d+\)\s*-\s*/, '');

        filasTable += `
          <tr class="border-b border-slate-200 hover:bg-slate-50">
            <td class="p-3 text-center font-extrabold w-18 border-r border-slate-200 text-slate-800 text-[11.5px]">${item.ano_cursado}° AÑO</td>
            <td class="p-3 font-black text-slate-950 text-[12px]">
              <div>(${codigoEsp}) - ${nombreMateriaLimpio}</div>
              ${reprogramada}
            </td>
            <td class="p-3 font-bold text-slate-800 border-l border-slate-200 w-52 text-[11px]">${item.presidente || '-'}</td>
            <td class="p-3 font-semibold text-slate-700 border-l border-slate-200 w-48 text-[11px]">${item.vocal1 || '-'}</td>
            <td class="p-3 font-semibold text-slate-700 border-l border-slate-200 w-48 text-[11px]">${item.vocal2 || '-'}</td>
          </tr>
        `;
      });

      htmlCarreras += `
        <div class="bg-slate-100 font-black px-3.5 py-2 text-[11.5px] uppercase border-b border-t border-slate-300 text-slate-900 tracking-wide">
          ${carreraNombre}${resolucionTexto}
        </div>
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-300 text-slate-600 font-extrabold uppercase text-[9.5px] tracking-wider">
              <th class="p-2.5 text-center w-18">AÑO</th>
              <th class="p-2.5">ESPACIO CURRICULAR</th>
              <th class="p-2.5 w-52">PRES. MESA</th>
              <th class="p-2.5 w-48">VOCAL 1</th>
              <th class="p-2.5 w-48">VOCAL 2</th>
            </tr>
          </thead>
          <tbody>
            ${filasTable}
          </tbody>
        </table>
      `;
    });

    const headerHtml = `
      <div class="text-white font-black px-4 py-2.5 flex items-center justify-between uppercase tracking-wider text-[12px]" style="background-color: ${colorTema};">
        <span>JORNADA ${diaKey} ${txtFechasLlamados}</span>
        <span class="text-white font-bold text-[11px]">19:00 HS - SEDE TORRES</span>
      </div>
    `;

    blockDia.innerHTML = headerHtml + htmlCarreras;
    container.appendChild(blockDia);
  });
}

function descargarExamenesPDF() {
  const element = document.getElementById('pdf-examenes-content');
  if (!element || typeof html2pdf === 'undefined') return;

  element.parentElement.classList.remove('hidden');
  const nombreArchivo = `Mesas_Examinadoras_${cronogramaActivoExamenes?.nombre || 'IES9029'}.pdf`;

  const opt = {
    margin:       [4, 4, 4, 4],
    filename:     nombreArchivo,
    image:        { type: 'jpeg', quality: 1.0 },
    html2canvas:  { scale: 3, useCORS: true, logging: false },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' },
    pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    element.parentElement.classList.add('hidden');
  });
}

function descargarExamenesJPG() {
  const element = document.getElementById('pdf-examenes-content');
  if (!element || typeof html2canvas === 'undefined') return;

  element.parentElement.classList.remove('hidden');
  const nombreArchivo = `Mesas_Examinadoras_${cronogramaActivoExamenes?.nombre || 'IES9029'}.jpg`;

  html2canvas(element, { scale: 3, useCORS: true, logging: false }).then(canvas => {
    const link = document.createElement('a');
    link.download = nombreArchivo;
    link.href = canvas.toDataURL('image/jpeg', 1.0);
    link.click();
    element.parentElement.classList.add('hidden');
  });
}
