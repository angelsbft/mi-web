/**
 * SabFit · Guarda y organiza las respuestas del diagnóstico en esta hoja de cálculo.
 *
 * Cómo instalarlo o actualizarlo:
 * 1. En la hoja: Extensiones → Apps Script. Borra todo y pega este archivo completo. Guarda (💾).
 * 2. Implementar → Administrar implementaciones → ✏️ (editar) → Versión: "Nueva versión" → Implementar.
 *    (Así la URL /exec sigue siendo la misma y la página no se toca.)
 *    Si es la primera vez: Implementar → Nueva implementación → "Aplicación web",
 *    Ejecutar como "Yo", Acceso "Cualquier persona", y copia la URL /exec en SURVEY_ENDPOINT (js/main.js).
 * 3. Vuelve a la hoja y recárgala: aparece el menú "SabFit" → "Organizar respuestas"
 *    (ordena la hoja y crea la pestaña "Panel" con gráficas que se actualizan solas).
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
    .addItem("Actualizar panel de gráficas", "crearPanel")
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

    try { updatePanelValues_(); } catch (err) {} // el panel nunca debe impedir guardar la respuesta

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
  crearPanel();
  SpreadsheetApp.getActiveSpreadsheet().toast("Respuestas organizadas y panel actualizado ✅", "SabFit", 5);
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

// ---------------------------------------------------------------------------
// Panel de gráficas: una tabla y una gráfica por pregunta. Los números los calcula
// el código (no fórmulas) y se actualizan con cada respuesta nueva.
// "contains" cuenta respuestas de selección múltiple.
// ---------------------------------------------------------------------------
const PANEL_NAME = "Panel";
const PANEL_COLORS = ["#2f6b4a", "#ff5b1f", "#8fd18a", "#0f2a1d", "#ffb547", "#5d6a61", "#c9d8cc", "#ff9a73"];
const PANEL_BLOCKS = [
  { column: "Perfil", title: "¿Qué quieren lograr?", chart: "PIE",
    options: ["Bajar grasa", "Ganar músculo", "Más energía y salud", "Rendir en mi deporte", "60+ años", "Condición de salud o lesión"] },
  { column: "Lo que más frena", title: "¿Qué los frena? (pueden elegir 2)", chart: "BAR", contains: true,
    options: ["No sé qué rutina hacer", "No sé qué comer", "La información en internet se contradice", "Pierdo la motivación",
      "No tengo tiempo", "No veo resultados", "Me lesiono o tengo molestias", "Un entrenador es muy caro"] },
  { column: "Inversión mensual", title: "¿Cuánto invertirían al mes?", chart: "COLUMN",
    options: ["Menos de $50.000", "$50.000 a $100.000", "$100.000 a $150.000", "$150.000 a $250.000", "Más de $250.000"] },
  { column: "Lo más valioso", title: "¿Qué les ayudaría más?", chart: "BAR",
    options: ["Una rutina hecha para mí", "Saber exactamente qué comer", "Que alguien me haga seguimiento y me exija", "Que me corrijan la técnica"] },
  { column: "Modalidad y horario", title: "¿Cómo y cuándo prefieren?", chart: "PIE",
    options: ["Online, a mi ritmo", "Presencial entre semana", "Presencial fines de semana", "Una mezcla de online y presencial"] },
  { column: "Edad", title: "Edad", chart: "COLUMN",
    options: ["15 a 24", "25 a 34", "35 a 49", "50 a 59", "60 o más"] },
  { column: "Días de ejercicio", title: "Días de ejercicio a la semana", chart: "COLUMN",
    options: ["Ninguno", "1 o 2 días", "3 o 4 días", "5 o más días"] },
  { column: "Resultado del pago", title: "Lo que han pagado, ¿les dio resultados?", chart: "PIE",
    options: ["Sí, buenos resultados", "Algunos, pero no los esperados", "No, ninguno", "No he usado nada"] },
  { column: "Fuente", title: "¿De dónde llegan?", chart: "PIE",
    options: ["instagram", "instagram_bio", "amigos", "directo"] },
];

// Posición de cada bloque en el Panel (la misma al crearlo y al actualizarlo)
function panelLayout_(headers) {
  const layout = [];
  let row = 10;
  PANEL_BLOCKS.forEach(function (block) {
    const col = headers.indexOf(block.column);
    if (col === -1) return;
    layout.push({ block: block, col: col, row: row });
    row += Math.max(block.options.length + 3, 17);
  });
  return layout;
}

// Calcula los números con el código (sin fórmulas: funciona en cualquier idioma de Sheets)
function updatePanelValues_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const panel = ss.getSheetByName(PANEL_NAME);
  if (!panel) return;
  const data = getSheet_().getDataRange().getValues();
  const headers = data[0].map(String);
  const rows = data.slice(1).filter(function (r) { return r[headers.indexOf("Fecha")] !== ""; });
  const colValues = function (name) {
    const i = headers.indexOf(name);
    return i === -1 ? [] : rows.map(function (r) { return String(r[i]).trim(); }).filter(function (v) { return v !== ""; });
  };

  const scores = colValues("Cerca del objetivo (1-10)").map(Number).filter(function (n) { return !isNaN(n); });
  const inv = colValues("Inversión mensual");
  const high = inv.filter(function (v) {
    return ["$100.000 a $150.000", "$150.000 a $250.000", "Más de $250.000"].indexOf(v) !== -1;
  }).length;
  panel.getRange(4, 2, 4, 1).setValues([
    [rows.length],
    [colValues("WhatsApp").length],
    [scores.length ? Math.round(scores.reduce(function (a, b) { return a + b; }, 0) / scores.length * 10) / 10 : "-"],
    [inv.length ? high / inv.length : "-"],
  ]);

  panelLayout_(headers).forEach(function (item) {
    const values = rows.map(function (r) { return String(r[item.col]); });
    const counts = item.block.options.map(function (opt) {
      return values.filter(function (v) {
        return item.block.contains ? v.split(" | ").indexOf(opt) !== -1 : v === opt;
      }).length;
    });
    const total = counts.reduce(function (a, b) { return a + b; }, 0);
    panel.getRange(item.row + 1, 2, counts.length, 2).setValues(counts.map(function (c) {
      return [c, total ? c / total : 0];
    }));
  });
}

function crearPanel() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const headers = headersOf_(getSheet_());

  let panel = ss.getSheetByName(PANEL_NAME);
  if (!panel) panel = ss.insertSheet(PANEL_NAME, 0);
  panel.getCharts().forEach(function (c) { panel.removeChart(c); });
  panel.clear();
  panel.setHiddenGridlines(true);
  panel.setColumnWidth(1, 300);
  panel.setColumnWidth(2, 90);
  panel.setColumnWidth(3, 70);

  panel.getRange("A1").setValue("SabFit · Panel del diagnóstico")
    .setFontSize(18).setFontWeight("bold").setFontColor("#0f2a1d");
  panel.getRange("A2").setValue("Se actualiza solo con cada respuesta nueva.").setFontColor("#5d6a61");

  // Indicadores principales
  ["Respuestas", "Con WhatsApp", "Promedio «qué tan cerca están» (1-10)", "Pagarían $100.000 o más al mes"]
    .forEach(function (label, i) {
      panel.getRange(4 + i, 1).setValue(label).setFontWeight("bold");
      panel.getRange(4 + i, 2).setFontSize(14).setFontWeight("bold").setFontColor("#ff5b1f").setHorizontalAlignment("left");
    });
  panel.getRange(7, 2).setNumberFormat("0%");

  // Una tabla + una gráfica por pregunta
  panelLayout_(headers).forEach(function (item) {
    const block = item.block;
    const row = item.row;
    const n = block.options.length;
    panel.getRange(row, 1, 1, 3).setValues([[block.title, "Personas", "%"]])
      .setFontWeight("bold").setBackground("#0f2a1d").setFontColor("#f2eee8");
    panel.getRange(row + 1, 1, n, 1).setValues(block.options.map(function (o) { return [o]; }));
    panel.getRange(row + 1, 3, n, 1).setNumberFormat("0%");
    panel.getRange(row + 1, 1, n, 3).setBackground("#f5f1ea");

    const type = { PIE: Charts.ChartType.PIE, BAR: Charts.ChartType.BAR, COLUMN: Charts.ChartType.COLUMN }[block.chart];
    const chart = panel.newChart()
      .setChartType(type)
      .addRange(panel.getRange(row, 1, n + 1, 2))
      .setNumHeaders(1)
      .setPosition(row, 5, 0, 0)
      .setOption("title", block.title)
      .setOption("legend", { position: block.chart === "PIE" ? "right" : "none" })
      .setOption("colors", block.chart === "PIE" ? PANEL_COLORS : ["#2f6b4a"])
      .setOption("pieHole", 0.45)
      .setOption("width", 560)
      .setOption("height", 300)
      .build();
    panel.insertChart(chart);
  });
  panel.setFrozenRows(2);
  updatePanelValues_();
}
