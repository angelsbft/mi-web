/**
 * SabFit · Guarda las respuestas del diagnóstico en esta hoja de cálculo.
 *
 * Cómo instalarlo (una sola vez):
 * 1. Crea una hoja de cálculo nueva en Google Sheets ("Diagnóstico SabFit").
 * 2. Menú Extensiones → Apps Script. Borra lo que haya y pega este archivo completo.
 * 3. Guarda (ícono de disquete) → Implementar → Nueva implementación.
 *    Tipo: "Aplicación web" · Ejecutar como: "Yo" · Quién tiene acceso: "Cualquier persona".
 * 4. Implementar → Autorizar acceso (elige tu cuenta → Avanzado → Ir a ... → Permitir).
 * 5. Copia la "URL de la aplicación web" (termina en /exec) y pégala en
 *    SURVEY_ENDPOINT dentro de js/main.js (o envíasela a quien te ayuda con la web).
 */
const SHEET_NAME = "Respuestas";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const answers = JSON.parse(e.postData.contents).answers || {};
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    // Encabezados: "Fecha" + una columna por pregunta (se agregan solas si aparecen nuevas)
    let headers = sheet.getLastRow() > 0
      ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      : [];
    if (headers.length === 0) {
      headers = ["Fecha"];
      sheet.getRange(1, 1).setValue("Fecha");
    }
    Object.keys(answers).forEach(function (key) {
      if (headers.indexOf(key) === -1) {
        headers.push(key);
        sheet.getRange(1, headers.length).setValue(key);
      }
    });
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);

    const row = headers.map(function (h) {
      if (h === "Fecha") return new Date();
      const value = answers[h];
      return value === undefined || value === null ? "" : String(value).slice(0, 1000);
    });
    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Permite comprobar en el navegador que la URL funciona (debe mostrar "SabFit OK")
function doGet() {
  return ContentService.createTextOutput("SabFit OK");
}
