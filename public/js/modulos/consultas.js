let listaCarrerasConsultas = [];
let carreraSeleccionadaActual = null;
let listaMateriasCarreraActual = [];

let fechaCalendarioActual = new Date();
let diaSeleccionadoCal = null;
let mesSeleccionadoCal = null;
let anoSeleccionadoCal = null;
let diaSemanaSeleccionadoCal = '';

function convertirUrlGoogleDrive(url) {
  if (!url) return '';
  let strUrl = String(url).trim().replace(/^["']|["']$/g, '');

  if (strUrl.includes('drive.google.com')) {
    let fileId = '';
    const matchPath = strUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const matchQuery = strUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);

    if (matchPath && matchPath[1]) fileId = matchPath[1];
    else if (matchQuery && matchQuery[1]) fileId = matchQuery[1];

    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId}=s500`;
    }
  }

  return strUrl;
}

// GENERAR LISTADO COMPLETO DE MINUTOS DEL 00 AL 59
function poblarSelectorMinutos(minutoSeleccionado = '00') {
  const selectMin = document.getElementById('pick-min-num');
  if (!selectMin) return;

  let optionsHtml = '';
  for (let i = 0; i < 60; i++) {
    const minStr = String(i).padStart(2, '0');
    const isSelected = minStr === String(minutoSeleccionado).padStart(2, '0') ? 'selected' : '';
    optionsHtml += `<option value="${minStr}" ${isSelected}>${minStr}</option>`;
  }
  selectMin.innerHTML = optionsHtml;
}

async function init_consultas() {
  await cargarSelectorCarrerasConsultas();
  if (window.lucide) lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', () => {
  init_consultas();
});

// 1. CARGAR CARRERAS
async function cargarSelectorCarrerasConsultas() {
  try {
    const res = await fetch('/api/carreras');
    listaCarrerasConsultas = await res.json();

    const select = document.getElementById('select-carrera-consultas');
    if (!select) return;

    if (!listaCarrerasConsultas || listaCarrerasConsultas.length === 0) {
      select.innerHTML = `<option value="">No hay carreras creadas</option>`;
      return;
    }

    select.innerHTML = listaCarrerasConsultas.map(c => `
      <option value="${c.id}">(${c.codigo}) ${c.nombre}</option>
    `).join('');

    if (listaCarrerasConsultas.length > 0) {
      cambiarCarreraConsultas(listaCarrerasConsultas[0].id);
    }

  } catch (err) {
    console.error('Error al cargar carreras:', err);
  }
}

// 2. CAMBIAR CARRERA ACTIVA
async function cambiarCarreraConsultas(carreraId) {
  if (!carreraId) return;

  carreraSeleccionadaActual = listaCarrerasConsultas.find(c => String(c.id) === String(carreraId));
  if (!carreraSeleccionadaActual) return;

  const subtitulo = document.getElementById('subtitulo-carrera-consultas');
  if (subtitulo) {
    subtitulo.textContent = `${carreraSeleccionadaActual.nombre} • ${carreraSeleccionadaActual.resolucion || 'Plan Oficial'}`;
  }

  try {
    const res = await fetch(`/api/carreras/${carreraId}/materias`);
    listaMateriasCarreraActual = await res.json();

    renderizarTablaListaConsultas();
    renderizarPDFConsultas();

  } catch (err) {
    console.error('Error al obtener materias:', err);
  }
}

// 3. RENDERIZAR TABLA DE CONSULTAS
function renderizarTablaListaConsultas() {
  const tbody = document.getElementById('tabla-consultas-lista');
  if (!tbody) return;

  if (!listaMateriasCarreraActual || listaMateriasCarreraActual.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center p-8 text-slate-400 font-medium">No hay espacios curriculares registrados.</td></tr>`;
    return;
  }

  tbody.innerHTML = listaMateriasCarreraActual.map(m => {
    const diaFormatted = (m.desde && m.desde.trim() !== '' && m.desde !== 'Por designar') ? m.desde : '';
    const horaFormatted = (m.hasta && m.hasta.trim() !== '') ? (m.hasta.includes('h') ? m.hasta : `${m.hasta}h`) : '';
    const estaIncompleto = !diaFormatted || !horaFormatted;

    const estiloFila = estaIncompleto 
      ? `bg-rose-500/10 hover:bg-rose-500/15 text-rose-200 border-l-4 border-l-rose-500` 
      : `hover:bg-slate-800/30`;

    const contenidoHorario = estaIncompleto
      ? `<span class="bg-rose-500 text-white font-black text-[10px] px-3 py-1 rounded-md uppercase tracking-wider inline-block shadow-sm">FALTA</span>`
      : `<div class="flex items-center justify-center gap-1.5">
           <span class="bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold px-2 py-0.5 rounded text-xs">${diaFormatted}</span>
           <span class="bg-slate-800 text-slate-200 border border-slate-700 font-bold px-2 py-0.5 rounded text-xs">${horaFormatted}</span>
         </div>`;

    return `
      <tr class="${estiloFila} transition-colors">
        <td class="p-3 font-extrabold ${estaIncompleto ? 'text-rose-300' : 'text-slate-200'}">${m.nombre}</td>
        <td class="p-3 font-medium ${estaIncompleto ? 'text-rose-300/80' : 'text-slate-300'}">${m.docente || 'SIN ASIGNAR'}</td>
        <td class="p-3 text-center"><span class="bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded font-bold">${m.ano_cursado}° Año</span></td>
        <td class="p-3 text-center">${contenidoHorario}</td>
        <td class="p-3 text-center">
          <div class="flex items-center justify-center gap-1">
            <button onclick="abrirModalEditarConsulta(${m.id})" class="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-all cursor-pointer" title="Asignar Consulta">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            <button onclick="eliminarMateriaConsulta(${m.id})" class="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-800 rounded-xl transition-all cursor-pointer" title="Limpiar Horario de Consulta">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

// 4. AGREGAR MATERIA DESDE EL PLAN DE LA CARRERA
async function abrirModalAgregarMateria() {
  if (!carreraSeleccionadaActual) {
    alert('Por favor, selecciona una carrera primero.');
    return;
  }

  const selectPlan = document.getElementById('select-materia-plan-carrera');
  if (!selectPlan) return;

  try {
    const res = await fetch(`/api/carreras/${carreraSeleccionadaActual.id}/materias`);
    const materiasCarrera = await res.json();

    if (!materiasCarrera || materiasCarrera.length === 0) {
      selectPlan.innerHTML = `<option value="">No hay materias creadas en esta carrera</option>`;
    } else {
      selectPlan.innerHTML = materiasCarrera.map(m => `
        <option value="${m.nombre}" data-ano="${m.ano_cursado}">
          (${m.ano_cursado}° Año) - ${m.nombre}
        </option>
      `).join('');
    }

    document.getElementById('modalAgregarMateria').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error('Error al cargar plan de carrera:', err);
  }
}

function cerrarModalAgregarMateria() {
  document.getElementById('modalAgregarMateria').classList.add('hidden');
}

async function confirmarAgregarMateria(e) {
  e.preventDefault();

  const selectPlan = document.getElementById('select-materia-plan-carrera');
  const nombreMateria = selectPlan?.value;
  const anoCursado = document.getElementById('add-ano-cursado')?.value || 1;
  const docenteInicial = document.getElementById('add-profe-inicial')?.value.trim() || 'Por designar';

  if (!nombreMateria) {
    alert('Por favor selecciona una materia válida.');
    return;
  }

  const payload = {
    nombre: nombreMateria,
    ano_cursado: parseInt(anoCursado),
    docente: docenteInicial,
    desde: '',
    hasta: ''
  };

  try {
    const res = await fetch(`/api/carreras/${carreraSeleccionadaActual.id}/materias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      cerrarModalAgregarMateria();
      document.getElementById('add-profe-inicial').value = '';
      await cambiarCarreraConsultas(carreraSeleccionadaActual.id);
    } else {
      alert('Error al agregar el espacio curricular.');
    }
  } catch (err) {
    console.error('Error agregando materia:', err);
  }
}

// 5. LIMPIAR CONSULTAS MASIVO (ESCOBA) 🧹
async function limpiarConsultasGlobales() {
  if (!confirm('🧹 ¿Deseas resetear los horarios y docentes de TODAS las carreras cargadas?')) return;

  try {
    for (const car of listaCarrerasConsultas) {
      const mRes = await fetch(`/api/carreras/${car.id}/materias`);
      const mats = await mRes.json();
      for (const m of mats) {
        await fetch(`/api/carreras/materias/${m.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...m, docente: 'Por designar', desde: '', hasta: '' })
        });
      }
    }
    if (carreraSeleccionadaActual) await cambiarCarreraConsultas(carreraSeleccionadaActual.id);
  } catch (err) {
    console.error('Error limpiando consultas:', err);
  }
}

// CORREGIDO: AHORA NO BORRA LA MATERIA DE LA CARRERA, SOLO RESETEA LA CONSULTA
async function eliminarMateriaConsulta(materiaId) {
  if (!confirm('¿Deseas limpiar el horario de consulta y el docente de esta materia? (La materia no se eliminará de la carrera)')) return;

  try {
    const res = await fetch(`/api/carreras/materias/${materiaId}/limpiar-consulta`, { 
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok && carreraSeleccionadaActual) {
      await cambiarCarreraConsultas(carreraSeleccionadaActual.id);
    }
  } catch (err) {
    console.error('Error reseteando consulta de materia:', err);
  }
}

// 6. MÉTODOS DEL CALENDARIO ELEGANTE Y SELECTOR DE HORA
function renderizarCalendarioModal() {
  const lblMesAno = document.getElementById('cal-mes-ano-lbl');
  const grilla = document.getElementById('cal-grilla-dias');
  if (!lblMesAno || !grilla) return;

  const mesesNom = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const mes = fechaCalendarioActual.getMonth();
  const ano = fechaCalendarioActual.getFullYear();

  lblMesAno.textContent = `${mesesNom[mes]} ${ano}`;

  const primerDiaSemana = new Date(ano, mes, 1).getDay();
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate();

  grilla.innerHTML = '';

  for (let i = 0; i < primerDiaSemana; i++) {
    grilla.innerHTML += `<div class="p-1"></div>`;
  }

  for (let d = 1; d <= totalDiasMes; d++) {
    const esSeleccionado = (diaSeleccionadoCal === d && mesSeleccionadoCal === mes && anoSeleccionadoCal === ano);
    
    const claseBtn = esSeleccionado
      ? 'bg-amber-500 text-slate-950 font-black rounded-lg p-1 shadow-sm'
      : 'text-slate-300 hover:bg-amber-500/20 hover:text-amber-300 font-bold rounded-lg p-1 transition-all cursor-pointer';

    grilla.innerHTML += `
      <button type="button" onclick="seleccionarDiaCalendario(${d}, ${mes}, ${ano})" class="${claseBtn}">
        ${d}
      </button>
    `;
  }

  actualizarPrevisualizacionHora();
}

function navegarMesCalendario(delta) {
  fechaCalendarioActual.setMonth(fechaCalendarioActual.getMonth() + delta);
  renderizarCalendarioModal();
}

function seleccionarDiaCalendario(dia, mes, ano) {
  diaSeleccionadoCal = dia;
  mesSeleccionadoCal = mes;
  anoSeleccionadoCal = ano;

  const fechaObj = new Date(ano, mes, dia);
  const diasNom = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  diaSemanaSeleccionadoCal = diasNom[fechaObj.getDay()];

  renderizarCalendarioModal();
}

function actualizarPrevisualizacionHora() {
  const preview = document.getElementById('preview-seleccion-final');
  if (!preview) return;

  const hr = document.getElementById('pick-hora-num')?.value || '19';
  const min = document.getElementById('pick-min-num')?.value || '00';

  let horaString = `${hr}:${min}h`;

  if (diaSeleccionadoCal) {
    const diaNumStr = String(diaSeleccionadoCal).padStart(2, '0');
    const mesNumStr = String(mesSeleccionadoCal + 1).padStart(2, '0');
    const fechaTextoFormatted = `${diaSemanaSeleccionadoCal} ${diaNumStr}/${mesNumStr}`;
    
    preview.textContent = `${fechaTextoFormatted} — ${horaString}`;
  } else {
    preview.textContent = `Selecciona un día en el calendario`;
  }
}

function abrirModalEditarConsulta(materiaId) {
  const m = listaMateriasCarreraActual.find(item => item.id === materiaId);
  if (!m) return;

  document.getElementById('edit-mat-db-id').value = m.id;
  document.getElementById('edit-materia').value = m.nombre;
  document.getElementById('edit-profe').value = (m.docente && m.docente !== 'Por designar') ? m.docente : '';

  // Iniciar minutos del 00 al 59
  let minPrev = '00';
  if (m.hasta && m.hasta.includes(':')) {
    const partesH = m.hasta.replace('h', '').split(':');
    minPrev = partesH[1] || '00';
  }
  poblarSelectorMinutos(minPrev);

  fechaCalendarioActual = new Date();
  diaSeleccionadoCal = fechaCalendarioActual.getDate();
  mesSeleccionadoCal = fechaCalendarioActual.getMonth();
  anoSeleccionadoCal = fechaCalendarioActual.getFullYear();
  
  const diasNom = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  diaSemanaSeleccionadoCal = diasNom[fechaCalendarioActual.getDay()];

  renderizarCalendarioModal();

  document.getElementById('modalEditarConsulta').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function cerrarModalEditarConsulta() {
  document.getElementById('modalEditarConsulta').classList.add('hidden');
}

async function guardarEdicionConsulta(e) {
  e.preventDefault();
  const materiaId = document.getElementById('edit-mat-db-id').value;
  const m = listaMateriasCarreraActual.find(item => String(item.id) === String(materiaId));

  if (!m) return;

  const docenteInput = document.getElementById('edit-profe').value.trim() || 'Por designar';
  
  const hr = document.getElementById('pick-hora-num')?.value || '19';
  const min = document.getElementById('pick-min-num')?.value || '00';
  const horaTexto = `${hr}:${min}h`;

  let desdeFinal = '';
  if (diaSeleccionadoCal) {
    const diaNumStr = String(diaSeleccionadoCal).padStart(2, '0');
    const mesNumStr = String(mesSeleccionadoCal + 1).padStart(2, '0');
    desdeFinal = `${diaSemanaSeleccionadoCal} ${diaNumStr}/${mesNumStr}`;
  }

  const payload = {
    ...m,
    docente: docenteInput,
    desde: desdeFinal,
    hasta: horaTexto
  };

  try {
    const res = await fetch(`/api/carreras/materias/${materiaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      cerrarModalEditarConsulta();
      await cambiarCarreraConsultas(carreraSeleccionadaActual.id);
    } else {
      alert('Error al guardar los datos en la base de datos.');
    }
  } catch (err) {
    console.error('Error guardando consulta:', err);
  }
}

function filtrarColumnaConsultas() {
  const fMat = document.getElementById('filtro-materia')?.value.toLowerCase() || '';
  const fProf = document.getElementById('filtro-profe')?.value.toLowerCase() || '';
  const fAno = document.getElementById('filtro-ano')?.value || '';
  const fEst = document.getElementById('filtro-estado')?.value || '';

  const filas = document.querySelectorAll('#tabla-consultas-lista tr');

  listaMateriasCarreraActual.forEach((m, index) => {
    const diaFormatted = (m.desde && m.desde.trim() !== '' && m.desde !== 'Por designar') ? m.desde : '';
    const horaFormatted = (m.hasta && m.hasta.trim() !== '') ? (m.hasta.includes('h') ? m.hasta : `${m.hasta}h`) : '';
    const estaIncompleto = !diaFormatted || !horaFormatted;

    const coincideMat = (m.nombre || '').toLowerCase().includes(fMat);
    const coincideProf = (m.docente || '').toLowerCase().includes(fProf);
    const coincideAno = fAno === '' || String(m.ano_cursado) === fAno;
    
    let coincideEst = true;
    if (fEst === 'falta') coincideEst = estaIncompleto;
    if (fEst === 'completo') coincideEst = !estaIncompleto;

    if (filas[index]) {
      const mostrar = coincideMat && coincideProf && coincideAno && coincideEst;
      filas[index].style.display = mostrar ? '' : 'none';
    }
  });
}

// 7. RENDERIZADO DEL PDF
function renderizarPDFConsultas() {
  const container = document.getElementById('cards-consultas-container');
  if (!container || !carreraSeleccionadaActual) return;

  const colorTema = carreraSeleccionadaActual.color_tema || '#059669';
  const logoUrlProcessed = convertirUrlGoogleDrive(carreraSeleccionadaActual.logo_url);
  const siglaMostrar = (carreraSeleccionadaActual.codigo || 'CAR').substring(0, 4);

  const turnoVal = document.getElementById('cfg-turno')?.value || 'ORDINARIO';
  const mesVal = document.getElementById('cfg-mes')?.value || 'Julio';
  const anoVal = document.getElementById('cfg-ano')?.value || '2026';

  document.getElementById('pdf-nombre-carrera').textContent = carreraSeleccionadaActual.nombre;
  document.getElementById('pdf-subtitulo-periodo').textContent = `PLAN: ${carreraSeleccionadaActual.resolucion || 'OFICIAL'} — CRONOGRAMA DE CONSULTAS`;
  
  document.getElementById('pdf-lbl-turno').textContent = `TURNO ${turnoVal}`;
  document.getElementById('pdf-lbl-mes-ano').textContent = `${mesVal} ${anoVal}`;

  const bandaColor = document.getElementById('pdf-banda-color-tema');
  if (bandaColor) bandaColor.style.backgroundColor = colorTema;

  const logoContainer = document.getElementById('pdf-contenedor-logo-carrera');
  if (logoContainer) {
    if (logoUrlProcessed) {
      logoContainer.innerHTML = `<img src="${logoUrlProcessed}" class="w-full h-full object-contain" referrerpolicy="no-referrer" crossorigin="anonymous" onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'font-black text-xs text-white p-1 rounded-lg shadow-sm\\' style=\\'background-color: ${colorTema}\\'>${siglaMostrar}</span>';">`;
    } else {
      logoContainer.innerHTML = `<span class="font-black text-xs text-white p-1 rounded-lg shadow-sm" style="background-color: ${colorTema}">${siglaMostrar}</span>`;
    }
  }

  container.innerHTML = '';
  const anos = [1, 2, 3];

  anos.forEach(ano => {
    const itemsAno = listaMateriasCarreraActual.filter(m => m.ano_cursado === ano);
    if (itemsAno.length === 0) return;

    const section = document.createElement('section');

    const yearHeader = document.createElement('div');
    yearHeader.className = 'flex items-center gap-2 mb-1 mt-1';
    yearHeader.innerHTML = `
      <div class="text-white text-[9px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 shadow-2xs" style="background-color: ${colorTema}">
        <span class="w-1.5 h-1.5 rounded-full bg-white"></span> ${ano}° AÑO
      </div>
      <div class="h-[1.5px] flex-grow bg-slate-200"></div>
    `;
    section.appendChild(yearHeader);

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-2 gap-1.5';

    itemsAno.forEach(item => {
      const diaFormatted = (item.desde && item.desde.trim() !== '' && item.desde !== 'Por designar') ? item.desde : '';
      const horaFormatted = (item.hasta && item.hasta.trim() !== '') ? (item.hasta.includes('h') ? item.hasta : `${item.hasta}h`) : '';
      const estaIncompleto = !diaFormatted || !horaFormatted;

      const fechaHoraBadge = estaIncompleto
        ? `<span class="font-black bg-rose-600 text-white px-2 py-0.5 rounded text-[8px] uppercase tracking-wider shadow-2xs">FALTA</span>`
        : `<div class="flex items-center gap-1">
             <span class="font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-1.5 py-0.5 rounded text-[8px]">${diaFormatted}</span>
             <span class="font-black text-slate-900 bg-white border border-slate-300 px-1.5 py-0.5 rounded text-[8px] shadow-2xs">${horaFormatted}</span>
           </div>`;

      const card = document.createElement('div');
      card.className = 'bg-slate-50/90 p-2 rounded-xl border-l-2 border border-slate-200 flex items-center justify-between text-[8.5px] leading-tight shadow-2xs';
      card.style.borderLeftColor = colorTema;

      card.innerHTML = `
        <div class="pr-1.5 overflow-hidden">
          <span class="font-black text-slate-900 block truncate text-[9px]">${item.nombre}</span>
          <span class="text-slate-500 font-bold uppercase block truncate text-[8px] mt-0.5">${item.docente || 'POR DESIGNAR'}</span>
        </div>
        <div class="shrink-0">
          ${fechaHoraBadge}
        </div>
      `;
      grid.appendChild(card);
    });

    section.appendChild(grid);
    container.appendChild(section);
  });
}

// 8. EXPORTACIÓN PDF / JPG ALTA DEFINICIÓN
function descargarConsultasPDF() {
  const element = document.getElementById('pdf-consultas-content');
  if (!element || typeof html2pdf === 'undefined') return;

  element.parentElement.classList.remove('hidden');

  const nombreArchivo = `Consultas_${(carreraSeleccionadaActual?.codigo || 'IES9029')}.pdf`;

  const opt = {
    margin:       0,
    filename:     nombreArchivo,
    image:        { type: 'jpeg', quality: 1.0 },
    html2canvas:  { scale: 3, useCORS: true, logging: false },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    element.parentElement.classList.add('hidden');
  });
}

function descargarConsultasJPG() {
  const element = document.getElementById('pdf-consultas-content');
  if (!element || typeof html2canvas === 'undefined') return;

  element.parentElement.classList.remove('hidden');

  const nombreArchivo = `Consultas_${(carreraSeleccionadaActual?.codigo || 'IES9029')}.jpg`;

  html2canvas(element, { scale: 3, useCORS: true, logging: false }).then(canvas => {
    const link = document.createElement('a');
    link.download = nombreArchivo;
    link.href = canvas.toDataURL('image/jpeg', 1.0);
    link.click();
    element.parentElement.classList.add('hidden');
  });
}
