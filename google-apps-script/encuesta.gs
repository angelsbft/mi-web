/**
 * SabFit · Guarda y organiza las respuestas del diagnóstico en esta hoja de cálculo.
 *
 * Cómo instalarlo o actualizarlo:
 * 1. En la hoja: Extensiones → Apps Script. Borra todo y pega este archivo completo. Guarda (💾).
 * 2. Implementar → Administrar implementaciones → ✏️ (editar) → Versión: "Nueva versión" → Implementar.
 *    (Así la URL /exec sigue siendo la misma y la página no se toca.)
 *    Si es la primera vez: Implementar → Nueva implementación → "Aplicación web",
 *    Ejecutar como "Yo", Acceso "Cualquier persona", y copia la URL /exec en SURVEY_ENDPOINT (js/main.js).
 * 3. Vuelve a la hoja y recárgala: aparece el menú "SabFit" → "Organizar respuestas".
 */
const SHEET_NAME = "Respuestas";

// Orden de las columnas: primero los datos de contacto, luego el diagnóstico actual
const COLUMNS = [
  "Fecha", "Nombre", "WhatsApp", "Escribir", "Perfil", "Plan recomendado",
  "Edad", "Cerca del objetivo (1-10)", "Días de ejercicio", "Veces que lo dejó (último año)",
  "Lo que más frena", "Lo último que intentó", "Pagó en el último año", "Resultado del pago",
  "Lo más valioso", "Modalidad y horario", "Inversión mensual", "Autoriza contacto", "Fuente",
];
const OLD_PREFIX = "Antes · "; // columnas de la primera versión del diagnóstico

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("SabFit")
    .addItem("Organizar respuestas", "organizar")
    .addToUi();
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

function headersOf_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
    formatSheet_(sheet);
  }
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
}

function whatsappLink_(phone) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) digits = "57" + digits;
  if (digits.length < 11) return null;
  return SpreadsheetApp.newRichTextValue()
    .setText("💬 Escribir")
    .setLinkUrl("https://wa.me/" + digits)
    .build();
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const answers = JSON.parse(e.postData.contents).answers || {};
    const sheet = getSheet_();
    const headers = headersOf_(sheet);

    // Preguntas nuevas que todavía no tienen columna: se agregan al final
    Object.keys(answers).forEach(function (key) {
      if (headers.indexOf(key) === -1) {
        headers.push(key);
        sheet.getRange(1, headers.length).setValue(key);
      }
    });

    const row = headers.map(function (h) {
      if (h === "Fecha") return new Date();
      if (h === "Escribir") return "";
      const value = answers[h];
      return value === undefined || value === null ? "" : String(value).slice(0, 1000);
    });
    sheet.appendRow(row);

    const link = whatsappLink_(answers["WhatsApp"]);
    const col = headers.indexOf("Escribir");
    if (link && col !== -1) sheet.getRange(sheet.getLastRow(), col + 1).setRichTextValue(link);

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

/**
 * Reordena la hoja: contacto primero, diagnóstico actual después y las
 * columnas de la versión anterior al final con el prefijo "Antes · ".
 * No borra ninguna respuesta.
 */
function organizar() {
  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  if (data.length === 0) return;
  const oldHeaders = data[0].map(String);

  const extra = oldHeaders.filter(function (h) {
    return h && COLUMNS.indexOf(h) === -1;
  });
  const finalHeaders = COLUMNS.concat(extra.map(function (h) {
    return h.indexOf(OLD_PREFIX) === 0 ? h : OLD_PREFIX + h;
  }));
  const sourceOf = COLUMNS.concat(extra);

  const rows = data.slice(1)
    .filter(function (r) { return r.some(function (v) { return v !== ""; }); })
    .map(function (r) {
      return sourceOf.map(function (h) {
        const i = oldHeaders.indexOf(h);
        return i === -1 || h === "Escribir" ? "" : r[i];
      });
    });

  sheet.clear();
  sheet.getRange(1, 1, 1, finalHeaders.length).setValues([finalHeaders]);
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, finalHeaders.length).setValues(rows);
    const phoneCol = finalHeaders.indexOf("WhatsApp");
    const linkCol = finalHeaders.indexOf("Escribir") + 1;
    rows.forEach(function (r, i) {
      const link = whatsappLink_(r[phoneCol]);
      if (link) sheet.getRange(i + 2, linkCol).setRichTextValue(link);
    });
  }
  formatSheet_(sheet, COLUMNS.length);
  SpreadsheetApp.getActiveSpreadsheet().toast("Respuestas organizadas ✅", "SabFit", 4);
}

function formatSheet_(sheet, currentCount) {
  const lastCol = Math.max(sheet.getLastColumn(), COLUMNS.length);
  const header = sheet.getRange(1, 1, 1, lastCol);
  header.setFontWeight("bold").setFontColor("#f2eee8").setBackground("#0f2a1d")
    .setWrap(true).setVerticalAlignment("middle");
  if (currentCount && lastCol > currentCount) {
    sheet.getRange(1, currentCount + 1, 1, lastCol - currentCount)
      .setBackground("#8a9590").setFontColor("#ffffff");
  }
  sheet.getRange(1, 2, 1, 3).setBackground("#ff5b1f").setFontColor("#0f2a1d");
  sheet.setRowHeight(1, 42);
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(3);
  sheet.getBandings().forEach(function (b) { b.remove(); });
  sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 2), lastCol)
    .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false);
  sheet.getRange(1, 1, 1, lastCol).setBackground("#0f2a1d");
  sheet.getRange(1, 2, 1, 3).setBackground("#ff5b1f");
  if (currentCount && lastCol > currentCount) {
    sheet.getRange(1, currentCount + 1, 1, lastCol - currentCount).setBackground("#8a9590");
  }
  sheet.getRange(2, 1, Math.max(sheet.getMaxRows() - 1, 1), 1).setNumberFormat("dd/mm/yyyy hh:mm");
  sheet.setColumnWidth(1, 130);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 120);
  sheet.setColumnWidth(4, 95);
  for (let c = 5; c <= lastCol; c++) sheet.setColumnWidth(c, 160);
}
