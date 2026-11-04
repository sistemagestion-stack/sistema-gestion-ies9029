let listaCarrerasGlobal = [];
let datosPreviewGlobal = [];
let materiasCarreraActual = [];

// Helper robusto para transformar enlaces compartidos de Google Drive a directa descarga/incrustación
function convertirUrlGoogleDrive(url) {
  if (!url) return '';
  let strUrl = String(url).trim().replace(/^["']|["']$/g, '');

  if (strUrl.includes('drive.google.com')) {
    let fileId = '';
    const matchPath = strUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const matchQuery = strUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);

    if (matchPath && matchPath[1]) {
      fileId = matchPath[1];
    } else if (matchQuery && matchQuery[1]) {
      fileId = matchQuery[1];
    }

    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId}=s400`;
    }
  }

  return strUrl;
}

function init_carreras() {
  cargarCarrerasDesdeDB();
  if (window.lucide) lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', () => {
  init_carreras();
});

async function cargarCarrerasDesdeDB() {
  try {
    const res = await fetch('/api/carreras');
    listaCarrerasGlobal = await res.json();

    const grilla = document.getElementById('grilla-carreras');
    const badgeTotal = document.getElementById('badge-total-carreras');

    if (badgeTotal) badgeTotal.textContent = `${listaCarrerasGlobal.length} Carreras Registradas`;
    if (!grilla) return;

    if (!listaCarrerasGlobal || listaCarrerasGlobal.length === 0) {
      grilla.innerHTML = `
        <div class="col-span-full text-center text-slate-400 py-12 bg-slate-900/40 border border-slate-800 rounded-3xl">
          <i data-lucide="folder-open" class="w-10 h-10 mx-auto mb-2 text-slate-500"></i>
          <p class="font-bold text-sm">No hay carreras registradas en la base de datos.</p>
          <p class="text-xs text-slate-500 mt-1">Sube una planilla Excel o CSV para importar la oferta académica.</p>
        </div>`;
      if (window.lucide) lucide.createIcons();
      return;
    }

    grilla.innerHTML = listaCarrerasGlobal.map(c => {
      const urlProcesada = convertirUrlGoogleDrive(c.logo_url);
      const esUrlValida = urlProcesada && (urlProcesada.startsWith('http://') || urlProcesada.startsWith('https://'));
      
      const siglaMostrar = (c.codigo || 'CAR').substring(0, 3);
      const colorMostrar = c.color_tema || '#059669';

      const imgLogoHtml = esUrlValida
        ? `<div class="w-10 h-10 rounded-xl bg-white p-1 shadow-md shrink-0 flex items-center justify-center overflow-hidden border border-slate-700">
             <img src="${urlProcesada}" 
                  class="w-full h-full object-contain" 
                  alt="Logo" 
                  referrerpolicy="no-referrer"
                  onerror="this.onerror=null; this.parentElement.outerHTML='<div class=\\'w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-sm shrink-0\\' style=\\'background-color: ${colorMostrar}\\'>${siglaMostrar}</div>';">
           </div>`
        : `<div class="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-sm shrink-0" style="background-color: ${colorMostrar}">${siglaMostrar}</div>`;

      return `
        <div class="theme-card border p-5 rounded-2xl relative shadow-md hover:border-slate-600 transition-all space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              ${imgLogoHtml}
              <span class="px-2.5 py-1 rounded-lg text-white font-black text-xs" style="background-color: ${colorMostrar}">
                ${c.codigo}
              </span>
            </div>
            <div class="flex items-center gap-1">
              <button onclick="abrirModalEditarCarrera(${c.id})" class="p-1.5 text-slate-400 hover:text-emerald-400 transition-colors rounded-lg cursor-pointer" title="Editar Carrera">
                <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="eliminarCarreraDB(${c.id})" class="p-1.5 text-slate-400 hover:text-rose-500 transition-colors rounded-lg cursor-pointer" title="Eliminar Carrera">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>

          <div>
            <h3 class="font-black text-sm text-white leading-snug">${c.nombre}</h3>
            <p class="text-xs text-slate-400 font-medium mt-0.5">${c.resolucion || 'Sin resolución registrada'}</p>
          </div>

          <div class="pt-3 border-t border-slate-800 flex justify-between items-center text-[11px]">
            <button onclick="abrirPlanEstudios(${c.id})" class="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer">
              <i data-lucide="layers" class="w-3.5 h-3.5"></i>
              <span>Ver Plan de Estudios</span>
            </button>
            <span class="text-[11px] font-bold text-slate-400">${c.duracion_anos || 3} Años</span>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();

  } catch (error) {
    console.error('Error al cargar carreras:', error);
  }
}

// 1. VISTA PREVIA EXCEL
function seleccionarYPrevisualizarExcel(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (typeof XLSX === 'undefined') {
    alert('La librería XLSX no está cargada en la página principal.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      let workbook;
      if (file.name.endsWith('.csv')) {
        const text = new TextDecoder('utf-8').decode(e.target.result);
        workbook = XLSX.read(text, { type: 'string' });
      } else {
        const data = new Uint8Array(e.target.result);
        workbook = XLSX.read(data, { type: 'array', cellDates: true, raw: false });
      }

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      datosPreviewGlobal = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

      if (!datosPreviewGlobal || datosPreviewGlobal.length === 0) {
        alert('El archivo no contiene filas o datos válidos.');
        return;
      }

      mostrarModalVistaPrevia();
      event.target.value = '';

    } catch (err) {
      console.error('Error al previsualizar Excel:', err);
      alert('No se pudo procesar el archivo. Revisa que sea un formato .xlsx o .csv válido.');
    }
  };

  reader.readAsArrayBuffer(file);
}

function mostrarModalVistaPrevia() {
  const tbody = document.getElementById('tabla-preview-import');
  const cantSpan = document.getElementById('preview-resumen-cant');

  if (cantSpan) cantSpan.textContent = `${datosPreviewGlobal.length} filas detectadas`;

  if (tbody) {
    tbody.innerHTML = datosPreviewGlobal.slice(0, 50).map(row => {
      let sedeStr = 'T029';
      let carStr = '';
      let ucStr = '';
      let anoStr = '1';
      let hscStr = '-';
      let hsgStr = '-';
      let regStr = '-';
      let formStr = '-';
      let estStr = 'VIGENTE';

      Object.keys(row).forEach(k => {
        const keyUpper = k.toUpperCase();
        if (keyUpper.includes('SEDE')) sedeStr = row[k];
        else if (keyUpper.includes('CARRERA')) carStr = row[k];
        else if (keyUpper.includes('DENOMINACION') || keyUpper.includes('UNIDAD') || keyUpper.includes('ESPACIO') || keyUpper.includes('MATERIA')) ucStr = row[k];
        else if (keyUpper === 'ANO' || keyUpper === 'ANIO') anoStr = row[k];
        else if (keyUpper.includes('HSC') || keyUpper.includes('CATEDRA')) hscStr = row[k];
        else if (keyUpper.includes('HSG') || keyUpper.includes('RELOJ')) hsgStr = row[k];
        else if (keyUpper.includes('REGIMEN')) regStr = row[k];
        else if (keyUpper.includes('FORMATO')) formStr = row[k];
        else if (keyUpper.includes('ESTADO')) estStr = row[k];
      });

      return `
        <tr class="hover:bg-slate-800/40 transition-colors">
          <td class="p-3 text-[11px] font-bold text-amber-300">${sedeStr}</td>
          <td class="p-3 font-extrabold text-emerald-400">${carStr || 'N/A'}</td>
          <td class="p-3 font-bold text-slate-200">${ucStr || '-'}</td>
          <td class="p-3 text-center text-amber-400 font-bold min-w-[90px]">${anoStr || '1'}° Año</td>
          <td class="p-3 text-center text-slate-300">${hscStr || '-'}</td>
          <td class="p-3 text-center text-slate-300">${hsgStr || '-'}</td>
          <td class="p-3 text-center text-slate-300">${regStr || '-'}</td>
          <td class="p-3 text-center text-slate-300">${formStr || '-'}</td>
          <td class="p-3 text-center font-bold text-emerald-400 text-[10px]">${estStr || 'VIGENTE'}</td>
        </tr>
      `;
    }).join('');
  }

  document.getElementById('modalVistaPreviaImport').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function cerrarModalVistaPrevia() {
  document.getElementById('modalVistaPreviaImport').classList.add('hidden');
  datosPreviewGlobal = [];
}

async function confirmarImportacionDesdePreview() {
  if (datosPreviewGlobal.length === 0) return;

  try {
    const response = await fetch('/api/carreras/importar-excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registros: datosPreviewGlobal })
    });

    if (response.ok) {
      const resData = await response.json();
      alert(`¡Importación exitosa! Se guardaron ${resData.filasProcesadas} materias en la base de datos.`);
      cerrarModalVistaPrevia();
      cargarCarrerasDesdeDB();
    } else {
      const err = await response.json();
      alert(`Error al importar: ${err.error || 'Ocurrió un fallo en el servidor.'}`);
    }
  } catch (err) {
    console.error('Error enviando datos:', err);
    alert('Error al conectar con el servidor.');
  }
}

// 2. MODAL REGISTRO / EDICIÓN DE CARRERAS
function abrirModalNuevaCarrera() {
  document.getElementById('modal-carrera-titulo').textContent = 'Registrar Carrera';
  document.getElementById('edit-carrera-id').value = '';
  document.getElementById('formCarrera').reset();
  document.getElementById('car-color-picker').value = '#059669';
  document.getElementById('car-color-hex').value = '#059669';
  document.getElementById('modalFormCarrera').classList.remove('hidden');
}

function abrirModalEditarCarrera(id) {
  const c = listaCarrerasGlobal.find(item => item.id === id);
  if (!c) return;

  document.getElementById('modal-carrera-titulo').textContent = 'Editar Carrera';
  document.getElementById('edit-carrera-id').value = c.id;
  document.getElementById('car-codigo').value = c.codigo;
  document.getElementById('car-nombre').value = c.nombre;
  document.getElementById('car-resolucion').value = c.resolucion || '';
  document.getElementById('car-logo').value = c.logo_url || '';
  document.getElementById('car-duracion').value = c.duracion_anos || 3;
  document.getElementById('car-color-picker').value = c.color_tema || '#059669';
  document.getElementById('car-color-hex').value = c.color_tema || '#059669';

  document.getElementById('modalFormCarrera').classList.remove('hidden');
}

function cerrarModalFormCarrera() {
  document.getElementById('modalFormCarrera').classList.add('hidden');
  document.getElementById('formCarrera').reset();
}

async function guardarCarreraForm(e) {
  e.preventDefault();

  const id = document.getElementById('edit-carrera-id').value;
  const rawLogo = document.getElementById('car-logo').value;

  const carreraData = {
    codigo: document.getElementById('car-codigo').value.toUpperCase(),
    nombre: document.getElementById('car-nombre').value,
    resolucion: document.getElementById('car-resolucion').value,
    logo_url: convertirUrlGoogleDrive(rawLogo),
    duracion_anos: parseInt(document.getElementById('car-duracion').value) || 3,
    color_tema: document.getElementById('car-color-hex').value
  };

  const url = id ? `/api/carreras/${id}` : '/api/carreras';
  const method = id ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(carreraData)
  });

  if (res.ok) {
    cerrarModalFormCarrera();
    cargarCarrerasDesdeDB();
  } else {
    const errorData = await res.json();
    alert(`Error: ${errorData.error || 'No se pudo guardar la carrera.'}`);
  }
}

async function eliminarCarreraDB(id) {
  if (!confirm('¿Deseas eliminar esta carrera y todas sus materias asociadas?')) return;

  const res = await fetch(`/api/carreras/${id}`, { method: 'DELETE' });
  if (res.ok) {
    cargarCarrerasDesdeDB();
  }
}

// 3. PLAN DE ESTUDIOS
async function abrirPlanEstudios(carreraId) {
  const carrera = listaCarrerasGlobal.find(c => c.id === carreraId);
  if (!carrera) return;

  document.getElementById('plan-carrera-id-actual').value = carrera.id;
  document.getElementById('plan-carrera-titulo').textContent = `Plan de Estudios — (${carrera.codigo}) ${carrera.nombre}`;
  
  limpiarFiltrosTablaMaterias();
  await cargarMateriasCarreraDB(carreraId);

  document.getElementById('modalPlanEstudios').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function cerrarModalPlanEstudios() {
  document.getElementById('modalPlanEstudios').classList.add('hidden');
  const form = document.getElementById('formAgregarEspacioPlan');
  if (form) form.reset();
}

async function cargarMateriasCarreraDB(carreraId) {
  try {
    const res = await fetch(`/api/carreras/${carreraId}/materias`);
    materiasCarreraActual = await res.json();
    aplicarFiltrosMateriasTabla();
  } catch (err) {
    console.error('Error al cargar materias:', err);
  }
}

// RENDERIZADO REACTIVO CON FILTROS APLICADOS
function aplicarFiltrosMateriasTabla() {
  const tbody = document.getElementById('tabla-plan-materias');
  if (!tbody) return;

  const txtVal = (document.getElementById('filtro-mat-texto')?.value || '').toLowerCase().trim();
  const anoVal = document.getElementById('filtro-mat-ano')?.value || '';
  const regVal = document.getElementById('filtro-mat-regimen')?.value || '';
  const formVal = document.getElementById('filtro-mat-formato')?.value || '';
  const sedeVal = document.getElementById('filtro-mat-sede')?.value || '';
  const estVal = document.getElementById('filtro-mat-estado')?.value || '';

  const materiasFiltradas = materiasCarreraActual.filter(m => {
    const coincideTexto = !txtVal || (m.nombre || '').toLowerCase().includes(txtVal);
    const coincideAno = !anoVal || String(m.ano_cursado) === String(anoVal);
    const coincideRegimen = !regVal || (m.regimen || 'ANUAL').toUpperCase() === regVal.toUpperCase();
    const coincideFormato = !formVal || (m.formato || 'MÓDULO').toUpperCase() === formVal.toUpperCase();
    const coincideSede = !sedeVal || (m.sede || 'T029').toUpperCase() === sedeVal.toUpperCase();
    const coincideEstado = !estVal || (m.estado_materia || 'VIGENTE').toUpperCase() === estVal.toUpperCase();

    return coincideTexto && coincideAno && coincideRegimen && coincideFormato && coincideSede && coincideEstado;
  });

  if (!materiasFiltradas || materiasFiltradas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center p-6 text-slate-400 font-medium">No se encontraron espacios curriculares con los filtros seleccionados.</td></tr>`;
    return;
  }

  tbody.innerHTML = materiasFiltradas.map(m => {
    const estadoUpper = (m.estado_materia || 'VIGENTE').toUpperCase();
    let badgeClase = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    
    if (estadoUpper === 'EN CIERRE') {
      badgeClase = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    } else if (estadoUpper === 'NO VIGENTE' || estadoUpper === 'CERRADO') {
      badgeClase = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }

    return `
      <tr class="hover:bg-slate-800/40 transition-colors">
        <td class="p-3 font-extrabold text-slate-200">${m.nombre}</td>
        <td class="p-3 text-center min-w-[100px] whitespace-nowrap">
          <span class="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg font-black text-xs inline-block">${m.ano_cursado}° Año</span>
        </td>
        <td class="p-3 text-center text-slate-300 font-medium">${m.hs_c || '-'}</td>
        <td class="p-3 text-center text-slate-300 font-medium">${m.hs_g || '-'}</td>
        <td class="p-3 text-center text-slate-300 font-medium"><span class="bg-slate-800/80 px-2 py-0.5 rounded text-[11px] font-bold text-amber-300">${m.regimen || 'ANUAL'}</span></td>
        <td class="p-3 text-center text-slate-300 font-medium"><span class="bg-slate-800/80 px-2 py-0.5 rounded text-[11px] font-bold text-sky-300">${m.formato || 'MÓDULO'}</span></td>
        <td class="p-3 text-center text-slate-300 text-[11px] font-bold"><span class="bg-slate-800/80 px-2 py-0.5 rounded text-slate-200">${m.sede || 'T029'}</span></td>
        <td class="p-3 text-center">
          <button onclick="abrirModalEditarMateria(${m.id})" class="border ${badgeClase} px-2.5 py-0.5 rounded text-[10px] font-black uppercase hover:opacity-80 transition-opacity cursor-pointer">
            ${m.estado_materia || 'VIGENTE'}
          </button>
        </td>
        <td class="p-3 text-center">
          <div class="flex items-center justify-center gap-1">
            <button onclick="abrirModalEditarMateria(${m.id})" class="p-1.5 text-slate-400 hover:text-amber-400 transition-colors rounded-lg cursor-pointer" title="Editar Espacio Curricular">
              <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="eliminarMateriaDB(${m.id}, ${m.carrera_id})" class="p-1.5 text-slate-400 hover:text-rose-400 transition-colors rounded-lg cursor-pointer" title="Remover Espacio Curricular">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function limpiarFiltrosTablaMaterias() {
  if (document.getElementById('filtro-mat-texto')) document.getElementById('filtro-mat-texto').value = '';
  if (document.getElementById('filtro-mat-ano')) document.getElementById('filtro-mat-ano').value = '';
  if (document.getElementById('filtro-mat-regimen')) document.getElementById('filtro-mat-regimen').value = '';
  if (document.getElementById('filtro-mat-formato')) document.getElementById('filtro-mat-formato').value = '';
  if (document.getElementById('filtro-mat-sede')) document.getElementById('filtro-mat-sede').value = '';
  if (document.getElementById('filtro-mat-estado')) document.getElementById('filtro-mat-estado').value = '';
  aplicarFiltrosMateriasTabla();
}

async function guardarNuevoEspacioMateria(e) {
  e.preventDefault();

  const carreraId = document.getElementById('plan-carrera-id-actual').value;
  const nuevaMateria = {
    nombre: document.getElementById('espacio-nombre').value,
    ano_cursado: parseInt(document.getElementById('espacio-ano').value) || 1,
    hs_c: document.getElementById('espacio-hsc').value,
    hs_g: document.getElementById('espacio-hsg').value,
    regimen: document.getElementById('espacio-regimen').value,
    formato: document.getElementById('espacio-formato').value || 'MÓDULO',
    sede: document.getElementById('espacio-sede').value || 'T029',
    estado_materia: 'VIGENTE'
  };

  const res = await fetch(`/api/carreras/${carreraId}/materias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nuevaMateria)
  });

  if (res.ok) {
    document.getElementById('formAgregarEspacioPlan').reset();
    cargarMateriasCarreraDB(carreraId);
  } else {
    alert('Error al agregar el espacio curricular.');
  }
}

// 4. EDICIÓN INDIVIDUAL DE MATERIA EN MODAL
function abrirModalEditarMateria(materiaId) {
  const m = materiasCarreraActual.find(item => item.id === materiaId);
  if (!m) return;

  document.getElementById('edit-mat-id').value = m.id;
  document.getElementById('edit-mat-carrera-id').value = m.carrera_id;
  document.getElementById('edit-mat-nombre').value = m.nombre || '';
  document.getElementById('edit-mat-ano').value = m.ano_cursado || 1;
  document.getElementById('edit-mat-hsc').value = m.hs_c || '';
  document.getElementById('edit-mat-hsg').value = m.hs_g || '';
  document.getElementById('edit-mat-regimen').value = m.regimen || 'ANUAL';
  document.getElementById('edit-mat-formato').value = m.formato || 'MÓDULO';
  document.getElementById('edit-mat-sede').value = m.sede || 'T029';
  document.getElementById('edit-mat-estado').value = m.estado_materia || 'VIGENTE';

  document.getElementById('modalEditarMateria').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function cerrarModalEditarMateria() {
  document.getElementById('modalEditarMateria').classList.add('hidden');
}

async function guardarEdicionMateria(e) {
  e.preventDefault();

  const id = document.getElementById('edit-mat-id').value;
  const carreraId = document.getElementById('edit-mat-carrera-id').value;

  const materiaData = {
    nombre: document.getElementById('edit-mat-nombre').value,
    ano_cursado: parseInt(document.getElementById('edit-mat-ano').value) || 1,
    hs_c: document.getElementById('edit-mat-hsc').value,
    hs_g: document.getElementById('edit-mat-hsg').value,
    regimen: document.getElementById('edit-mat-regimen').value,
    formato: document.getElementById('edit-mat-formato').value,
    sede: document.getElementById('edit-mat-sede').value,
    estado_materia: document.getElementById('edit-mat-estado').value
  };

  const res = await fetch(`/api/carreras/materias/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(materiaData)
  });

  if (res.ok) {
    cerrarModalEditarMateria();
    cargarMateriasCarreraDB(carreraId);
  } else {
    alert('Error al guardar los cambios de la materia.');
  }
}

async function eliminarMateriaDB(materiaId, carreraId) {
  if (!confirm('¿Deseas remover este espacio curricular del plan de estudios?')) return;

  const res = await fetch(`/api/carreras/materias/${materiaId}`, { method: 'DELETE' });
  if (res.ok) {
    cargarMateriasCarreraDB(carreraId);
  }
}
