const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Transportador de correos
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'secretaria9029@gmail.com',
    pass: process.env.EMAIL_PASS || 'contraseña_aplicacion'
  }
});

// BASE DE DATOS DE LICENCIAS EN MEMORIA (O TABLA SQLITE)
let licenciasDB = [
  {
    id: 101,
    timestamp: "04/11/2026 10:15",
    cargadaGEI: true,
    fechaCargaGEI: "04/11/2026 10:30",
    correoEnviado: true,
    dni: "20111222",
    docente: "BUSTOS, Gratia",
    email: "gbustos@ies9029.edu.ar",
    tipoLicencia: "Enfermedad Corta Tratamiento",
    codigo: "40",
    desde: "02/11/2026",
    hasta: "06/11/2026",
    comprobanteUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    tramiteOsep: "OSP-994821",
    detallesAdicionales: {
      "Formulario OSEP": "Adjunto OSEP N° 994821",
      "Número de Trámite": "OSP-994821"
    }
  },
  {
    id: 102,
    timestamp: "03/11/2026 14:30",
    cargadaGEI: false,
    fechaCargaGEI: "",
    correoEnviado: false,
    dni: "20333444",
    docente: "HERNANDEZ, Eduardo",
    email: "ehernandez@ies9029.edu.ar",
    tipoLicencia: "Licencia por ART / Accidentes de Trabajo",
    codigo: "52",
    desde: "01/11/2026",
    hasta: "15/11/2026",
    comprobanteUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    siniestroART: "ART-8839201",
    detallesAdicionales: {
      "Siniestro ART": "ART-8839201",
      "Formulario ART": "Presentado"
    }
  }
];

// OBTENER LICENCIAS
router.get('/', (req, res) => {
  res.json(licenciasDB);
});

// ACTUALIZAR CASILLA GEI Y ENVIAR MAIL AUTOMÁTICO
router.post('/actualizar-gei', async (req, res) => {
  try {
    const { id, cargadaGEI } = req.body;
    const item = licenciasDB.find(l => String(l.id) === String(id));

    if (!item) {
      return res.status(404).json({ error: "Licencia no encontrada." });
    }

    item.cargadaGEI = cargadaGEI;

    if (cargadaGEI) {
      const ahora = new Date();
      const dd = String(ahora.getDate()).padStart(2, '0');
      const mm = String(ahora.getMonth() + 1).padStart(2, '0');
      const yyyy = ahora.getFullYear();
      const hh = String(ahora.getHours()).padStart(2, '0');
      const min = String(ahora.getMinutes()).padStart(2, '0');
      
      item.fechaCargaGEI = `${dd}/${mm}/${yyyy} ${hh}:${min}`;

      // Plantilla de correo oficial GEI
      const linkGEI = "https://dti.mendoza.edu.ar/gem/usuarios/auth_login/login?redirect_url=";
      const cuerpoHTML = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            
            <!-- Encabezado Institucional -->
            <tr>
              <td style="background-color: #3a4fc7; padding: 20px 30px; border-bottom: 4px solid #f59e42;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="vertical-align: middle;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">I.E.S. N° 9-029</h1>
                      <p style="color: #e8edff; margin: 4px 0 0 0; font-size: 13px;">Sistema de Gestión Documental y Novedades</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Contenido Principal -->
            <tr>
              <td style="padding: 30px; color: #2d3748; font-size: 14px; line-height: 1.6;">
                <p style="margin-top: 0; font-size: 16px;">Estimado/a <strong>${item.docente}</strong>,</p>
                <p>Le informamos que se ha registrado correctamente la siguiente novedad en el sistema GEI:</p>
                
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #e8edff; border-left: 5px solid #f59e42; border-radius: 4px; margin: 20px 0;">
                  <tr>
                    <td style="padding: 15px;">
                      <span style="font-size: 11px; color: #3a4fc7; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 4px;">Tipo de Licencia / Novedad</span>
                      <strong style="font-size: 16px; color: #2d3748;">${item.tipoLicencia} (Cód. ${item.codigo})</strong>
                      <div style="font-size: 12px; color: #4a5568; margin-top: 4px;">Período: ${item.desde} al ${item.hasta}</div>
                    </td>
                  </tr>
                </table>

                <p>Puede consultar el estado y detalle ingresando a su rol <strong>GEI PAD</strong>:</p>

                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 25px 0;">
                  <tr>
                    <td align="center">
                      <a href="${linkGEI}" target="_blank" style="background-color: #5170ff; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">Acceder al Sistema GEI &rarr;</a>
                    </td>
                  </tr>
                </table>

                <div style="background-color: #ffffff; border: 1px dashed #3a4fc7; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
                  <p style="margin: 0 0 8px 0; font-weight: bold; color: #3a4fc7; font-size: 13px;">📌 ¿Cómo ver la novedad cargada?</p>
                  <p style="margin: 0; color: #2d3748; font-size: 13px;">
                    Una vez que haya ingresado al portal, diríjase a la sección:<br>
                    <strong style="color: #3a4fc7;">Servicios &rarr; Liquidaciones &rarr; Novedades</strong>.<br>
                    Al final de la lista encontrará las novedades procesadas recientemente.
                  </p>
                </div>

                <p style="margin-bottom: 0;">Si observa algún error o tiene dudas sobre el registro, no dude en comunicarse con Secretaría.</p>
              </td>
            </tr>

            <!-- Pie de página -->
            <tr>
              <td style="background-color: #e8edff; padding: 20px 30px; border-top: 2px solid #f59e42; color: #2d3748; font-size: 13px;">
                <p style="margin: 0; font-weight: bold; color: #3a4fc7;">Saludos cordiales,</p>
                <p style="margin: 4px 0 0 0;">
                  <strong>Leandro Giordanino</strong><br>
                  Secretario — IES 9-029
                </p>
              </td>
            </tr>

          </table>
        </body>
        </html>
      `;

      try {
        await transporter.sendMail({
          from: '"Secretaría IES N° 9-029" <secretaria9029@gmail.com>',
          to: item.email,
          subject: "Notificación: Carga de Novedad en Sistema GEI - IES 9-029",
          html: cuerpoHTML
        });
        item.correoEnviado = true;
      } catch (eMail) {
        console.log("Correo simulado localmente:", eMail.message);
      }
    } else {
      item.fechaCargaGEI = "";
    }

    res.json({ mensaje: "Estado GEI actualizado con éxito.", fechaCargaGEI: item.fechaCargaGEI });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar estado GEI." });
  }
});

// EDITAR LICENCIA
router.post('/editar', (req, res) => {
  const { id, dni, docente, email, tipoLicencia, codigo, desde, hasta, comprobanteUrl } = req.body;
  const item = licenciasDB.find(l => String(l.id) === String(id));

  if (!item) {
    return res.status(404).json({ error: "Licencia no encontrada." });
  }

  if (dni) item.dni = dni;
  if (docente) item.docente = docente;
  if (email) item.email = email;
  if (tipoLicencia) item.tipoLicencia = tipoLicencia;
  if (codigo) item.codigo = codigo;
  if (desde) item.desde = desde;
  if (hasta) item.hasta = hasta;
  if (comprobanteUrl) item.comprobanteUrl = comprobanteUrl;

  res.json({ mensaje: "Licencia actualizada con éxito.", licencia: item });
});

// ELIMINAR LICENCIA
router.post('/eliminar', (req, res) => {
  const { id } = req.body;
  const index = licenciasDB.findIndex(l => String(l.id) === String(id));

  if (index !== -1) {
    licenciasDB.splice(index, 1);
    return res.json({ mensaje: "Licencia eliminada correctamente." });
  }

  res.status(404).json({ error: "Registro no encontrado." });
});

module.exports = router;
