window.dbDocentes = JSON.parse(localStorage.getItem('db_docentes')) || [
  { 
    id: 1, 
    nombre: 'María', 
    apellido: 'Pérez', 
    dni: '28456123', 
    cuil: '27-28456123-4', 
    email: 'mperez@ies9029.edu.ar', 
    telefono: '2615123456', 
    titulos: ['Lic. en Biología'],
    postitulos: ['Diplomatura en Educación Superior'],
    estado: 'Activo',
    linkLegajo: 'https://drive.google.com/',
    docs: {
      '001': '',
      '002': 'https://drive.google.com/dni',
      '003': 'https://drive.google.com/cuil',
      '004': ['https://drive.google.com/titulo-1'],
      '006': 'https://drive.google.com/psicofisico'
    }
  }
];

window.dbSolicitudesForms = JSON.parse(localStorage.getItem('db_solicitudes_forms')) || [];

let docenteSeleccionadoReclamo = null;

const REQUISITOS_OBLIGATORIOS = ['002', '003', '004', '006'];
const NOMBRES_DOCUMENTOS = {
  '001': '001. CV (Opcional)',
  '002': '002. DNI Escaneado',
  '003': '003. Constancia de CUIL',
  '004': '004. Títulos y Analíticos',
  '005': '005. Postítulos',
  '006': '006. Aptitud Psicofísica',
  '007': '007. Antecedentes Penales',
  '008': '008. Certificado Ley Micaela',
  '009': '009. Resolución Titularización',
  '010': '010. Res. Cargo de Gestión',
  '011': '011. MEMO (Exclusivo Celadores)'
};

function init_legajos_docentes() {
  renderizarTablaDocentes(window.dbDocentes);
  actualizarBadgeSolicitudes();
}

// CONEXIÓN DIRECTA DE LAS SOLICITUDES A LA CAMPANA DE NOTIFICACIONES GLOBAL
function actualizarBadgeSolicitudes() {
  const badgeModulo = document.getElementById('badgeFormsPendientes');
  const cant = window.dbSolicitudesForms.length;

  if (badgeModulo) {
    badgeModulo.textContent = cant;
    if (cant === 0) badgeModulo.classList.add('hidden');
    else badgeModulo.classList.remove('hidden');
  }

  // Integración con el componente global del header (campana superior)
  const badgeCampanaGlobal = document.getElementById('notifBadgeCount') || document.querySelector('.topbar-notif-badge');
  if (badgeCampanaGlobal) {
    badgeCampanaGlobal.textContent = cant;
    if (cant > 0) badgeCampanaGlobal.classList.remove('hidden');
    else badgeCampanaGlobal.classList.add('hidden');
  }

  // Notificación registrada en el gestor global window.notificaciones del sistema
  if (typeof window.registrarNotificacionGlobal === 'function') {
    window.registrarNotificacionGlobal({
      id: 'forms_pendientes_legajos',
      titulo: 'Legajos Pendientes de Revisión',
      mensaje: `Tienes ${cant} formulario(s) de Google Forms pendiente(s) por revisar.`,
      cant: cant,
      accion: () => abrirModalSolicitudesForms()
    });
  }
}

function generarReporteFaltantes() {
  const incompletos = window.dbDocentes.filter(d => !evaluarEstadoLegajo(d).completo);
  const tbody = document.getElementById('tablaReporteFaltantesBody');

  if (incompletos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-slate-400">¡Todos los legajos se encuentran 100% completos!</td></tr>`;
  } else {
    tbody.innerHTML = incompletos.map(d => {
      const docs = d.docs || {};
      const faltantesKeys = REQUISITOS_OBLIGATORIOS.filter(key => {
        const val = docs[key];
        if (Array.isArray(val)) return val.length === 0;
        return !val || val.trim() === '';
      });
      const listaFaltantesStr = faltantesKeys.map(k => NOMBRES_DOCUMENTOS[k]).join(', ');

      return `
        <tr class="border-b border-slate-800/80">
          <td class="py-3 px-3"><strong class="text-white">${d.apellido}, ${d.nombre}</strong><br><span class="text-[10px] text-slate-400">DNI: ${d.dni}</span></td>
          <td class="py-3 px-3 text-sky-400">${d.email}</td>
          <td class="py-3 px-3 text-amber-300">${listaFaltantesStr}</td>
          <td class="py-3 px-3 text-right">
            <button onclick="cerrarModalReporteFaltantes(); verLegajoCompleto(${d.id});" class="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 rounded-xl text-[11px] font-bold">
              Reclamar
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  document.getElementById('modalReporteFaltantes').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function cerrarModalReporteFaltantes() {
  document.getElementById('modalReporteFaltantes').classList.add('hidden');
}

function abrirModalReclamoDocente() {
  if (!docenteSeleccionadoReclamo) return;

  const doc = docenteSeleccionadoReclamo;
  const docs = doc.docs || {};

  const listaHtml = Object.keys(NOMBRES_DOCUMENTOS).map(k => {
    const val = docs[k];
    const estaCargado = Array.isArray(val) ? val.length > 0 : (val && val.trim() !== '');
    const esObligatorio = REQUISITOS_OBLIGATORIOS.includes(k);
    const checked = (!estaCargado && esObligatorio) ? 'checked' : '';

    return `
      <label class="p-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl flex items-center justify-between cursor-pointer hover:border-rose-500/50">
        <div class="flex items-center gap-2">
          <input type="checkbox" name="check_reclamo" value="${NOMBRES_DOCUMENTOS[k]}" ${checked} class="accent-rose-500 w-4 h-4">
          <span class="font-semibold text-white">${NOMBRES_DOCUMENTOS[k]}</span>
        </div>
        ${estaCargado ? '<span class="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">Presentado</span>' : '<span class="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">Faltante</span>'}
      </label>
    `;
  }).join('');

  document.getElementById('listaCheckReclamo').innerHTML = listaHtml;
  document.getElementById('txtObservacionReclamo').value = '';
  document.getElementById('modalReclamoDocente').classList.remove('hidden');
}

function cerrarModalReclamoDocente() {
  document.getElementById('modalReclamoDocente').classList.add('hidden');
}

function confirmarEnviarReclamoMail() {
  if (!docenteSeleccionadoReclamo) return;

  const doc = docenteSeleccionadoReclamo;
  const checkboxes = Array.from(document.querySelectorAll('input[name="check_reclamo"]:checked'));
  const adicionales = document.getElementById('txtObservacionReclamo').value.trim();

  if (checkboxes.length === 0 && !adicionales) {
    alert('Por favor selecciona al menos un documento a reclamar o ingresa una observación.');
    return;
  }

  const itemsReclamadosStr = checkboxes.map(cb => `• ${cb.value}`).join('\n');
  const mailSubject = encodeURIComponent("Reclamo de Documentación de Legajo - IES N° 9-029");
  
  let cuerpoMensaje = `Estimado/a ${doc.nombre} ${doc.apellido},\n\nNos comunicamos para solicitarle la presentación / actualización de la siguiente documentación correspondiente a su Legajo Digital:\n\n${itemsReclamadosStr}`;
  
  if (adicionales) {
    cuerpoMensaje += `\n\nObservaciones adicionales:\n"${adicionales}"`;
  }
  
  cuerpoMensaje += `\n\nPor favor, envíe los archivos digitalizados a la brevedad.\n\nAtentamente,\nEquipo Directivo IES N° 9-029`;

  window.open(`mailto:${doc.email}?subject=${mailSubject}&body=${encodeURIComponent(cuerpoMensaje)}`);

  cerrarModalReclamoDocente();
  alert(`Reclamo generado. Se abrió el cliente de correo para ${doc.email}.`);
}

function evaluarEstadoLegajo(doc) {
  const docs = doc.docs || {};
  const faltantes = REQUISITOS_OBLIGATORIOS.filter(key => {
    const val = docs[key];
    if (Array.isArray(val)) return val.length === 0;
    return !val || val.trim() === '';
  });
  return { completo: faltantes.length === 0, cantFaltantes: faltantes.length };
}

function renderizarTablaDocentes(lista) {
  const tbody = document.getElementById('tablaDocentesBody');
  if (!tbody) return;

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400">No se encontraron docentes registrados.</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(doc => {
    const est = evaluarEstadoLegajo(doc);
    let badge = est.completo ? `<span class="px-2.5 py-1 rounded-full text-[9px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Completo</span>` : `<span class="px-2.5 py-1 rounded-full text-[9px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30">Incompleto (Faltan ${est.cantFaltantes})</span>`;

    return `
      <tr class="hover:bg-slate-800/60 transition-colors border-b border-slate-700/40">
        <td class="py-3 px-3">
          <p class="font-bold dynamic-text-main select-text">${doc.apellido}, ${doc.nombre}</p>
          <p class="text-[10px] text-slate-400 select-text">DNI: ${doc.dni}</p>
        </td>
        <td class="py-3 px-3 dynamic-text-sub select-text font-medium">${doc.cuil || '-'}</td>
        <td class="py-3 px-3">
          <p class="dynamic-text-main font-semibold select-all text-sky-400">${doc.email}</p>
          <p class="text-[10px] text-slate-300 select-all">${doc.telefono || '-'}</p>
        </td>
        <td class="py-3 px-3">${badge}</td>
        <td class="py-3 px-3 text-right space-x-1">
          <button onclick="verLegajoCompleto(${doc.id})" class="p-1.5 text-emerald-400 hover:bg-emerald-500/20 rounded-lg cursor-pointer" title="Ver Legajo"><i data-lucide="search" class="w-4 h-4"></i></button>
          <button onclick="editarDocente(${doc.id})" class="p-1.5 text-sky-400 hover:bg-sky-500/20 rounded-lg cursor-pointer" title="Editar"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
          <button onclick="eliminarDocente(${doc.id})" class="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg cursor-pointer" title="Eliminar"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function verLegajoCompleto(id) {
  const doc = window.dbDocentes.find(d => d.id === id);
  if (!doc) return;

  docenteSeleccionadoReclamo = doc;

  document.getElementById('legajoNombreCompleto').textContent = `${doc.apellido}, ${doc.nombre}`;
  document.getElementById('legajoDniCuil').textContent = `DNI: ${doc.dni} | CUIL: ${doc.cuil || 'Sin cargar'}`;
  document.getElementById('legajoEmail').textContent = doc.email;
  document.getElementById('legajoTelefono').textContent = doc.telefono || 'Sin teléfono';

  const boxT = document.getElementById('boxLegajoTitulos');
  const titulos = doc.titulos || [];
  if (Array.isArray(titulos) && titulos.length > 0 && titulos[0].trim() !== '') {
    document.getElementById('listaLegajoTitulos').innerHTML = titulos.map(t => `<div class="p-2 bg-slate-900/80 rounded-xl border border-slate-700/60 flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-amber-400 shrink-0"></i><span class="font-semibold text-white">${t.trim()}</span></div>`).join('');
    boxT.classList.remove('hidden');
  } else boxT.classList.add('hidden');

  const boxP = document.getElementById('boxLegajoPostitulos');
  const postitulos = doc.postitulos || [];
  if (Array.isArray(postitulos) && postitulos.length > 0 && postitulos[0].trim() !== '') {
    document.getElementById('listaLegajoPostitulos').innerHTML = postitulos.map(p => `<div class="p-2 bg-slate-900/80 rounded-xl border border-slate-700/60 flex items-center gap-2"><i data-lucide="award" class="w-3.5 h-3.5 text-indigo-400 shrink-0"></i><span class="font-semibold text-white">${p.trim()}</span></div>`).join('');
    boxP.classList.remove('hidden');
  } else boxP.classList.add('hidden');

  const containerTP = document.getElementById('contenedorLegajoTitulosPostitulos');
  if (!boxT.classList.contains('hidden') || !boxP.classList.contains('hidden')) containerTP.classList.remove('hidden');
  else containerTP.classList.add('hidden');

  const linkCarpeta = document.getElementById('legajoLinkCarpeta');
  if (doc.linkLegajo) {
    linkCarpeta.innerHTML = `<a href="${doc.linkLegajo}" target="_blank" class="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 underline"><i data-lucide="folder-git-2" class="w-3.5 h-3.5"></i> Abrir Drive Legajo</a>`;
  } else linkCarpeta.innerHTML = `<span class="text-[10px] text-slate-500 italic">Sin carpeta enlazada</span>`;

  const itemsDoc = [
    { key: '001', titulo: '001. CV (Opcional)' },
    { key: '002', titulo: '002. DNI' },
    { key: '003', titulo: '003. CONSTANCIA DE CUIL' },
    { key: '004', titulo: '004. TÍTULOS Y ANALÍTICOS' },
    { key: '005', titulo: '005. POSTÍTULOS' },
    { key: '006', titulo: '006. APTITUD PSICOFÍSICA' },
    { key: '007', titulo: '007. ANTECEDENTES PENALES' },
    { key: '008', titulo: '008. LEY MICAELA' },
    { key: '009', titulo: '009. RESOLUCIÓN TITULARIZACIÓN' },
    { key: '010', titulo: '010. RESOLUCIÓN CARGO GESTIÓN' },
    { key: '011', titulo: '011. MEMO (Exclusivo Celadores)' }
  ];

  const docsDocente = doc.docs || {};
  const adjuntosDisponibles = itemsDoc.filter(it => {
    const val = docsDocente[it.key];
    if (Array.isArray(val)) return val.length > 0;
    return val && val.trim() !== '';
  });

  const gridHtml = adjuntosDisponibles.length > 0 ? adjuntosDisponibles.map(it => {
    const val = docsDocente[it.key];

    let btns = '';
    if (Array.isArray(val)) {
      btns = val.map((u, i) => `<a href="${u}" target="_blank" class="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center gap-1 font-bold text-[11px] shrink-0"><i data-lucide="external-link" class="w-3.5 h-3.5"></i> Abrir ${i+1}</a>`).join('');
    } else if (val && (val.startsWith('http://') || val.startsWith('https://'))) {
      btns = `<a href="${val}" target="_blank" class="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center gap-1.5 font-bold text-[11px] shrink-0"><i data-lucide="external-link" class="w-3.5 h-3.5"></i> Abrir</a>`;
    }

    return `
      <div class="p-3 bg-slate-800/70 border border-slate-700/80 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
        <div class="space-y-0.5 min-w-0 flex-1">
          <span class="text-[10px] font-bold text-slate-400 uppercase block truncate">${it.titulo}</span>
          <p class="font-semibold text-xs text-white truncate">${Array.isArray(val) ? `${val.length} enlace(s) cargado(s)` : val}</p>
        </div>
        <div class="flex flex-wrap gap-1">${btns}</div>
      </div>
    `;
  }).join('') : `<p class="col-span-2 p-4 text-center text-slate-500 italic">No hay documentos cargados en este legajo.</p>`;

  document.getElementById('gridDocumentosLegajo').innerHTML = gridHtml;
  document.getElementById('modalVerLegajo').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function cerrarModalVerLegajo() { document.getElementById('modalVerLegajo').classList.add('hidden'); }

function simularNuevaSolicitudForm() {
  const rand = Math.floor(Math.random() * 9000) + 1000;
  const nueva = {
    id: Date.now(),
    tipo: 'Alta de Legajo (Google Form)',
    nombre: `DocentePrueba_${rand}`,
    apellido: 'Fernández',
    dni: `35${rand}123`,
    cuil: `20-35${rand}123-8`,
    email: `docente${rand}@ies9029.edu.ar`,
    telefono: '2619998877',
    titulos: ['Profesor de Matemática'],
    postitulos: ['Posgrado en Tecnología'],
    linkLegajo: `https://drive.google.com/legajo-prueba-${rand}`,
    docs: {
      '001': '',
      '002': `https://drive.google.com/dni-${rand}`,
      '003': `https://drive.google.com/cuil-${rand}`,
      '004': [`https://drive.google.com/titulo-grado-${rand}`],
      '006': 'Apto Vigente 2028'
    }
  };

  window.dbSolicitudesForms.push(nueva);
  localStorage.setItem('db_solicitudes_forms', JSON.stringify(window.dbSolicitudesForms));
  actualizarBadgeSolicitudes();
  abrirModalSolicitudesForms();
}

function abrirModalSolicitudesForms() {
  const modal = document.getElementById('modalSolicitudesForms');
  const select = document.getElementById('selectSolicitudesForms');

  if (window.dbSolicitudesForms.length === 0) {
    document.getElementById('contenedorAuditoriaSesion').innerHTML = `<p class="p-8 text-center text-slate-400">No hay formularios pendientes por revisar.</p>`;
    select.innerHTML = `<option>Sin solicitudes</option>`;
  } else {
    select.innerHTML = window.dbSolicitudesForms.map(s => `<option value="${s.id}">${s.apellido}, ${s.nombre} (${s.tipo})</option>`).join('');
    cargarDetalleSesionForm(window.dbSolicitudesForms[0].id);
  }

  modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function cargarDetalleSesionForm(id) {
  const sol = window.dbSolicitudesForms.find(s => s.id == id);
  if (!sol) return;

  const docs = sol.docs || {};
  let docsHtml = '';

  for (let i = 1; i <= 11; i++) {
    const k = String(i).padStart(3, '0');
    const val = docs[k];
    
    let linksRender = '';
    if (Array.isArray(val)) {
      linksRender = val.map((u, idx) => `<a href="${u}" target="_blank" class="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0"><i data-lucide="external-link" class="w-3 h-3"></i> Enlace ${idx + 1}</a>`).join('');
    } else if (val && (val.startsWith('http://') || val.startsWith('https://'))) {
      linksRender = `<a href="${val}" target="_blank" class="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0"><i data-lucide="external-link" class="w-3 h-3"></i> Revisar</a>`;
    }

    docsHtml += `
      <div class="p-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-bold text-slate-400 uppercase">${NOMBRES_DOCUMENTOS[k]}</span>
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-1 text-[11px] text-emerald-400 font-bold cursor-pointer"><input type="radio" name="check_doc_${k}" value="aprobar" checked class="accent-emerald-500"> Aprobar</label>
            <label class="flex items-center gap-1 text-[11px] text-rose-400 font-bold cursor-pointer"><input type="radio" name="check_doc_${k}" value="rechazar" class="accent-rose-500"> Rechazar</label>
          </div>
        </div>

        <div class="flex items-center justify-between gap-2">
          <div class="flex flex-wrap gap-1">${linksRender || `<span class="text-xs text-white truncate font-medium">${val || '<span class="text-slate-500 italic">No adjuntado</span>'}</span>`}</div>
        </div>
        <input type="text" id="motivo_doc_${k}" placeholder="Motivo del rechazo..." class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-rose-500">
      </div>
    `;
  }

  document.getElementById('contenedorAuditoriaSesion').innerHTML = `
    <div class="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
      <div><span class="text-[10px] text-slate-400 font-bold block uppercase">Postulante</span><strong class="text-white text-sm">${sol.apellido}, ${sol.nombre}</strong></div>
      <div><span class="text-[10px] text-slate-400 font-bold block uppercase">DNI / CUIL</span><span class="text-emerald-400 font-bold">${sol.dni} / ${sol.cuil || '-'}</span></div>
      <div><span class="text-[10px] text-slate-400 font-bold block uppercase">Correo</span><span class="text-sky-400 font-bold">${sol.email}</span></div>
      <div><span class="text-[10px] text-slate-400 font-bold block uppercase">Teléfono</span><span class="text-slate-300">${sol.telefono || '-'}</span></div>
    </div>

    <div class="space-y-3">
      <h4 class="text-xs font-black uppercase text-amber-400">Revisión de Documentación (001 al 011)</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">${docsHtml}</div>
    </div>

    <div class="pt-4 border-t border-slate-800 flex justify-end gap-2">
      <button onclick="cerrarModalSolicitudesForms()" class="px-4 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">Cancelar</button>
      <button onclick="procesarSesionFormCompleta(${sol.id})" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-md flex items-center gap-2">
        <i data-lucide="send" class="w-4 h-4"></i> Guardar y Notificar por Mail
      </button>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

function procesarSesionFormCompleta(id) {
  const sol = window.dbSolicitudesForms.find(s => s.id == id);
  if (!sol) return;

  const aprobados = {};
  const rechazados = [];

  for (let i = 1; i <= 11; i++) {
    const k = String(i).padStart(3, '0');
    const radio = document.querySelector(`input[name="check_doc_${k}"]:checked`);
    const motivoInp = document.getElementById(`motivo_doc_${k}`);

    if (radio && radio.value === 'aprobar') {
      if (sol.docs && sol.docs[k]) aprobados[k] = sol.docs[k];
    } else {
      const motivo = motivoInp ? motivoInp.value.trim() : 'Documento no válido';
      rechazados.push({ doc: NOMBRES_DOCUMENTOS[k], motivo: motivo || 'No cumple con las especificaciones' });
    }
  }

  const idx = window.dbDocentes.findIndex(d => d.dni === sol.dni);
  if (idx !== -1) {
    window.dbDocentes[idx].docs = { ...window.dbDocentes[idx].docs, ...aprobados };
    if (sol.linkLegajo) window.dbDocentes[idx].linkLegajo = sol.linkLegajo;
  } else {
    window.dbDocentes.push({
      id: Date.now(),
      nombre: sol.nombre,
      apellido: sol.apellido,
      dni: sol.dni,
      cuil: sol.cuil,
      email: sol.email,
      telefono: sol.telefono,
      titulos: sol.titulos || [],
      postitulos: sol.postitulos || [],
      estado: 'Activo',
      linkLegajo: sol.linkLegajo || '',
      docs: aprobados
    });
  }

  if (rechazados.length > 0) {
    const listaRechazosStr = rechazados.map(r => `• ${r.doc}: ${r.motivo}`).join('\n');
    const mailSubject = encodeURIComponent("Revisión de Documentos de Legajo - IES N° 9-029");
    const mailBody = encodeURIComponent(`Estimado/a ${sol.nombre} ${sol.apellido},\n\nLe informamos que se ha procesado la documentación de su legajo. Los siguientes ítems requieren corrección:\n\n${listaRechazosStr}\n\nPor favor, actualice los enlaces requeridos a la brevedad.\n\nAtentamente,\nEquipo Directivo IES N° 9-029`);
    
    window.open(`mailto:${sol.email}?subject=${mailSubject}&body=${mailBody}`);
  }

  window.dbSolicitudesForms = window.dbSolicitudesForms.filter(s => s.id != id);
  localStorage.setItem('db_docentes', JSON.stringify(window.dbDocentes));
  localStorage.setItem('db_solicitudes_forms', JSON.stringify(window.dbSolicitudesForms));

  renderizarTablaDocentes(window.dbDocentes);
  actualizarBadgeSolicitudes();
  cerrarModalSolicitudesForms();
}

function cerrarModalSolicitudesForms() { document.getElementById('modalSolicitudesForms').classList.add('hidden'); }

function agregarCampoTitulo(valor = '') {
  const container = document.getElementById('containerTitulosInputs');
  const div = document.createElement('div');
  div.className = 'flex items-center gap-2';
  div.innerHTML = `<input type="text" value="${valor}" placeholder="Nombre del Título..." class="input-titulo-dinamico w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400"><button type="button" onclick="this.parentElement.remove()" class="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>`;
  container.appendChild(div);
  if (window.lucide) lucide.createIcons();
}

function agregarCampoPostitulo(valor = '') {
  const container = document.getElementById('containerPostitulosInputs');
  const div = document.createElement('div');
  div.className = 'flex items-center gap-2';
  div.innerHTML = `<input type="text" value="${valor}" placeholder="Nombre del Postítulo..." class="input-postitulo-dinamico w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-400"><button type="button" onclick="this.parentElement.remove()" class="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>`;
  container.appendChild(div);
  if (window.lucide) lucide.createIcons();
}

function agregarCampoUrlTitulo(val = '') {
  const container = document.getElementById('containerUrlsTitulos');
  const div = document.createElement('div');
  div.className = 'flex items-center gap-1.5';
  div.innerHTML = `<input type="text" value="${val}" placeholder="https://..." class="url-titulo-item w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"><button type="button" onclick="this.parentElement.remove()" class="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>`;
  container.appendChild(div);
  if (window.lucide) lucide.createIcons();
}

function agregarCampoUrlPostitulo(val = '') {
  const container = document.getElementById('containerUrlsPostitulos');
  const div = document.createElement('div');
  div.className = 'flex items-center gap-1.5';
  div.innerHTML = `<input type="text" value="${val}" placeholder="https://..." class="url-postitulo-item w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"><button type="button" onclick="this.parentElement.remove()" class="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>`;
  container.appendChild(div);
  if (window.lucide) lucide.createIcons();
}

function abrirModalDocente(doc = null) {
  const modal = document.getElementById('modalDocente');
  const titulo = document.getElementById('modalDocenteTitulo');
  
  document.getElementById('containerTitulosInputs').innerHTML = '';
  document.getElementById('containerPostitulosInputs').innerHTML = '';
  document.getElementById('containerUrlsTitulos').innerHTML = '';
  document.getElementById('containerUrlsPostitulos').innerHTML = '';

  if (doc) {
    titulo.innerHTML = `<i data-lucide="edit" class="w-4 h-4"></i> Editar Legajo Docente`;
    document.getElementById('docenteId').value = doc.id;
    document.getElementById('docNombre').value = doc.nombre;
    document.getElementById('docApellido').value = doc.apellido;
    document.getElementById('docDni').value = doc.dni;
    document.getElementById('docCuil').value = doc.cuil || '';
    document.getElementById('docEmail').value = doc.email;
    document.getElementById('docTelefono').value = doc.telefono || '';
    document.getElementById('docEstado').value = doc.estado || 'Activo';
    document.getElementById('docLinkLegajo').value = doc.linkLegajo || '';

    const titulos = Array.isArray(doc.titulos) ? doc.titulos : (doc.titulos ? doc.titulos.split(',') : []);
    if (titulos.length > 0) titulos.forEach(t => agregarCampoTitulo(t.trim()));
    else agregarCampoTitulo();

    const postitulos = Array.isArray(doc.postitulos) ? doc.postitulos : (doc.postitulos ? doc.postitulos.split(',') : []);
    if (postitulos.length > 0) postitulos.forEach(p => agregarCampoPostitulo(p.trim()));
    else agregarCampoPostitulo();

    const d = doc.docs || {};

    const uTitulos = Array.isArray(d['004']) ? d['004'] : (d['004'] ? [d['004']] : []);
    if (uTitulos.length > 0) uTitulos.forEach(u => agregarCampoUrlTitulo(u));
    else agregarCampoUrlTitulo();

    const uPostitulos = Array.isArray(d['005']) ? d['005'] : (d['005'] ? [d['005']] : []);
    if (uPostitulos.length > 0) uPostitulos.forEach(u => agregarCampoUrlPostitulo(u));
    else agregarCampoUrlPostitulo();

    for (let i = 1; i <= 11; i++) {
      if (i === 4 || i === 5) continue;
      const numKey = String(i).padStart(3, '0');
      const el = document.getElementById(`doc_${numKey}`);
      if (el) el.value = d[numKey] || '';
    }
  } else {
    titulo.innerHTML = `<i data-lucide="user-plus" class="w-4 h-4"></i> Registrar Legajo Docente`;
    document.getElementById('formDocente').reset();
    document.getElementById('docenteId').value = '';
    document.getElementById('docEstado').value = 'Activo';
    agregarCampoTitulo();
    agregarCampoPostitulo();
    agregarCampoUrlTitulo();
    agregarCampoUrlPostitulo();
  }
  
  modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function cerrarModalDocente() { document.getElementById('modalDocente').classList.add('hidden'); }

function guardarDocente(e) {
  e.preventDefault();
  const id = document.getElementById('docenteId').value;
  
  const titulosArr = Array.from(document.querySelectorAll('.input-titulo-dinamico')).map(inp => inp.value.trim()).filter(val => val !== '');
  const postitulosArr = Array.from(document.querySelectorAll('.input-postitulo-dinamico')).map(inp => inp.value.trim()).filter(val => val !== '');
  const urls004 = Array.from(document.querySelectorAll('.url-titulo-item')).map(inp => inp.value.trim()).filter(val => val !== '');
  const urls005 = Array.from(document.querySelectorAll('.url-postitulo-item')).map(inp => inp.value.trim()).filter(val => val !== '');

  const docsData = {};
  for (let i = 1; i <= 11; i++) {
    const numKey = String(i).padStart(3, '0');
    if (numKey === '004') docsData['004'] = urls004;
    else if (numKey === '005') docsData['005'] = urls005;
    else {
      const el = document.getElementById(`doc_${numKey}`);
      if (el) docsData[numKey] = el.value.trim();
    }
  }

  const nuevoDoc = {
    id: id ? parseInt(id) : Date.now(),
    nombre: document.getElementById('docNombre').value.trim(),
    apellido: document.getElementById('docApellido').value.trim(),
    dni: document.getElementById('docDni').value.trim(),
    cuil: document.getElementById('docCuil').value.trim(),
    email: document.getElementById('docEmail').value.trim(),
    telefono: document.getElementById('docTelefono').value.trim(),
    estado: document.getElementById('docEstado').value,
    titulos: titulosArr,
    postitulos: postitulosArr,
    linkLegajo: document.getElementById('docLinkLegajo').value.trim(),
    docs: docsData
  };

  if (id) {
    const idx = window.dbDocentes.findIndex(d => d.id === parseInt(id));
    if (idx !== -1) window.dbDocentes[idx] = nuevoDoc;
  } else window.dbDocentes.push(nuevoDoc);

  localStorage.setItem('db_docentes', JSON.stringify(window.dbDocentes));
  renderizarTablaDocentes(window.dbDocentes);
  cerrarModalDocente();
}

function editarDocente(id) {
  const doc = window.dbDocentes.find(d => d.id === id);
  if (doc) abrirModalDocente(doc);
}

function eliminarDocente(id) {
  if (confirm('¿Estás seguro de eliminar este docente?')) {
    window.dbDocentes = window.dbDocentes.filter(d => d.id !== id);
    localStorage.setItem('db_docentes', JSON.stringify(window.dbDocentes));
    renderizarTablaDocentes(window.dbDocentes);
  }
}

function filtrarDocentes() {
  const q = document.getElementById('busquedaDocente').value.toLowerCase();
  const filtrados = window.dbDocentes.filter(d => 
    d.nombre.toLowerCase().includes(q) ||
    d.apellido.toLowerCase().includes(q) ||
    d.dni.includes(q) ||
    (d.cuil && d.cuil.toLowerCase().includes(q))
  );
  renderizarTablaDocentes(filtrados);
}
