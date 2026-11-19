/* =========================================================
   SabFit · Configuración
   Escribe tu número de WhatsApp con código de país,
   solo números, sin "+", espacios ni guiones.
   Ejemplo Chile: 56912345678 · Colombia: 573001234567
   ========================================================= */
const WHATSAPP_NUMBER = "573156942956";

// Dirección de la hoja de Google donde se guardan las respuestas del diagnóstico
// (la "URL de la aplicación web" de Apps Script; ver google-apps-script/encuesta.gs).
const SURVEY_ENDPOINT = "https://script.google.com/macros/s/AKfycbyumyJ24qvV9qNXKTirsZCU0SK6QYv69T2wM3AgoMKiAK1b-nuWkomeWuVuohBThnA/exec";

document.documentElement.classList.add("js");

function whatsappUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// Medición: avisa a Google Tag Manager cada vez que alguien abre WhatsApp.
// En GTM se usa el evento personalizado "whatsapp_click" (variable de capa de datos: "origen").
function trackWhatsApp(origen) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: "whatsapp_click", origen });
}

function whatsappOrigin(el) {
  if (el.classList.contains("wa-float")) return "boton_flotante";
  if (el.closest(".nav")) return "menu";
  const section = el.closest("section[id]");
  return section ? section.id : "otro";
}

// Enlaces de WhatsApp: cualquier elemento con data-wa="mensaje"
document.querySelectorAll("[data-wa]").forEach((link) => {
  link.href = whatsappUrl(link.dataset.wa);
  link.target = "_blank";
  link.rel = "noopener";
  link.addEventListener("click", () => trackWhatsApp(whatsappOrigin(link)));
});

// Menú móvil
const header = document.getElementById("header");
const nav = document.getElementById("nav");
const navToggle = document.getElementById("navToggle");

function setMenu(open) {
  nav.classList.toggle("is-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
}

navToggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setMenu(false);
});

// Sombra del header al hacer scroll
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 10);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Resaltar la sección activa en el menú
const navLinks = document.querySelectorAll(".nav__link");
const sections = document.querySelectorAll("main section[id]");

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) =>
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`)
        );
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => sectionObserver.observe(s));

  // Animación de aparición
  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.15 }
  );
  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
} else {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
}

// Clics a Instagram (evento "instagram_click" en Tag Manager)
document.querySelectorAll("[data-ig]").forEach((link) =>
  link.addEventListener("click", () => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "instagram_click", origen: whatsappOrigin(link) });
  })
);

// Agendar primera cita → WhatsApp
const booking = document.getElementById("agendar");

if (booking) {
  // Los botones "Agendar…" de las tarjetas preseleccionan la modalidad
  document.querySelectorAll("[data-book]").forEach((btn) =>
    btn.addEventListener("click", () => {
      booking.querySelector(`input[name="mode"][value="${btn.dataset.book}"]`).checked = true;
    })
  );

  booking.addEventListener("submit", (e) => {
    e.preventDefault();
    const nameInput = booking.elements.bName;
    const name = nameInput.value.trim();
    const error = document.getElementById("bookingError");
    if (!name) {
      error.textContent = "Por favor escribe tu nombre.";
      nameInput.classList.add("is-invalid");
      nameInput.focus();
      return;
    }
    error.textContent = "";
    nameInput.classList.remove("is-invalid");

    const mode = booking.elements.mode.value;
    const what = mode === "presencial" ? "*evaluación presencial*" : "*primera reunión online* (videollamada)";
    const text =
      `¡Hola Ángel! 👋 Soy *${name}* y quiero agendar mi ${what} en SabFit.\n\n` +
      `📅 Día preferido: ${booking.elements.bDay.value}\n` +
      `🕐 Horario: ${booking.elements.bTime.value}\n\n` +
      `¿Qué disponibilidad tienes?`;

    trackWhatsApp(`agenda_${mode}`);
    window.open(whatsappUrl(text), "_blank", "noopener");
  });
}

// Diagnóstico (12 preguntas) → Google Sheets + 5 hábitos y plan según el perfil
// La primera pregunta define el perfil (SURVEY_PROFILES): de ahí salen los hábitos y el plan.
// type: "single" (avanza solo), "multi" (hasta "max"), "scale" (1 a 10), "text" (opcional)
const SURVEY_PROFILES = {
  grasa: {
    label: "Bajar grasa", emoji: "🔥", title: "Bajar grasa sin pasar hambre", plan: "combo",
    habits: [
      ["Proteína en cada comida", "Una porción del tamaño de tu palma: te mantiene lleno/a por más tiempo."],
      ["Medio plato de verduras", "En almuerzo y cena: más volumen y saciedad con pocas calorías."],
      ["8.000 pasos al día", "Camina en llamadas o después de comer: suma más que una hora de cardio a la semana."],
      ["Cambia las bebidas azucaradas por agua", "Gaseosas y jugos suman muchas calorías que no te quitan el hambre."],
      ["Duerme 7 a 9 horas", "Dormir poco aumenta el hambre y los antojos al día siguiente."],
    ],
  },
  musculo: {
    label: "Ganar músculo", emoji: "💪", title: "Ganar músculo y fuerza", plan: "training",
    habits: [
      ["1,6 a 2 g de proteína por kilo al día", "Repartida en 3 o 4 comidas: es la base para construir músculo."],
      ["Entrena cada músculo 2 veces por semana", "Rinde más que entrenarlo una sola vez con muchísimo volumen."],
      ["Anota tus pesos", "Cuando completes todas las repeticiones con buena técnica, sube un poco el peso."],
      ["No te saltes comidas", "Para crecer necesitas comer suficiente, todos los días."],
      ["Duerme 7 a 9 horas", "El músculo se construye mientras descansas."],
    ],
  },
  energia: {
    label: "Más energía y salud", emoji: "🌱", title: "Más energía y salud", plan: "combo",
    habits: [
      ["Un vaso de agua al despertar", "Y lleva una botella contigo: la deshidratación se siente como cansancio."],
      ["10 minutos de luz solar en la mañana", "Ayuda a regular tu reloj interno y a dormir mejor en la noche."],
      ["Camina 10 minutos después de comer", "Mejora tu digestión y el control del azúcar en la sangre."],
      ["2 sesiones de fuerza por semana", "20 minutos bastan para proteger tus músculos, tus huesos y tu metabolismo."],
      ["Acuéstate a la misma hora", "Un horario fijo de sueño es de lo que más mejora tu energía."],
    ],
  },
  deportista: {
    label: "Rendir en mi deporte", emoji: "🏆", title: "Rendir más en tu deporte", plan: "deportista",
    habits: [
      ["Carbohidratos de calidad antes de entrenar", "2 o 3 horas antes: arroz, avena, papa o fruta para tener energía."],
      ["Proteína + carbohidrato después", "En las 2 horas siguientes para recuperarte mejor."],
      ["Fuerza 2 veces por semana", "Te hace más potente y es la mejor prevención de lesiones."],
      ["Calentamiento dinámico de 10 minutos", "Movilidad y activación antes de cada entrenamiento o partido."],
      ["Hidrátate durante el entrenamiento", "Pequeños sorbos cada 15 o 20 minutos, sobre todo si sudas mucho."],
    ],
  },
  mayor: {
    label: "60+ años", emoji: "🧓", title: "Fuerza y vitalidad 60+", plan: "mayor",
    habits: [
      ["Fuerza 2 o 3 veces por semana", "Por ejemplo, sentarte y levantarte de una silla 10 veces: protege músculos y huesos."],
      ["Equilibrio todos los días", "Párate en un pie apoyado en una silla durante 20 segundos por lado."],
      ["Camina a diario", "A un ritmo cómodo, aumentando el tiempo poco a poco."],
      ["Proteína en cada comida", "Con la edad el cuerpo necesita más para mantener el músculo."],
      ["Toma agua aunque no tengas sed", "Con los años la sensación de sed disminuye."],
    ],
  },
  condicion: {
    label: "Condición de salud o lesión", emoji: "❤️", title: "Moverte con salud y seguridad", plan: "salud",
    habits: [
      ["Habla con tu médico antes de cambiar tu actividad", "Cuéntale qué ejercicio quieres hacer y pregunta tus límites."],
      ["Empieza con 10 a 15 minutos al día", "Constancia antes que intensidad: el cuerpo se adapta poco a poco."],
      ["Muévete cada hora", "Levántate y camina 2 o 3 minutos si pasas mucho tiempo sentado/a."],
      ["Arma tu plato en mitades", "Mitad verduras, un cuarto proteína y un cuarto carbohidratos."],
      ["Anota cómo te sientes", "Después de moverte: es información valiosa para ajustar tu plan."],
    ],
  },
};

const SURVEY_PLANS = {
  combo: "Entrenamiento + Orientación nutricional",
  training: "Entrenamiento online o presencial",
  nutrition: "Orientación nutricional",
  deportista: "Programa Deportistas",
  mayor: "Programa Adulto mayor 60+",
  salud: "Programa Salud y movimiento",
};

const SURVEY_QUESTIONS = [
  { key: "Perfil", type: "single", question: "¿Qué quieres lograr principalmente?",
    options: Object.entries(SURVEY_PROFILES).map(([value, p]) => ({ value, text: `${p.emoji} ${p.label}` })) },
  { key: "Edad", type: "single", question: "¿Cuántos años tienes?",
    options: ["15 a 24", "25 a 34", "35 a 49", "50 a 59", "60 o más"] },
  { key: "Cerca del objetivo (1-10)", type: "scale", question: "Del 1 al 10, ¿qué tan cerca estás hoy de ese objetivo?",
    low: "Muy lejos", high: "Ya lo logré" },
  { key: "Días de ejercicio", type: "single", question: "¿Cuántos días a la semana haces ejercicio hoy?",
    options: ["Ninguno", "1 o 2 días", "3 o 4 días", "5 o más días"] },
  { key: "Veces que lo dejó (último año)", type: "single", question: "En el último año, ¿cuántas veces empezaste a entrenar o a comer mejor y lo dejaste?",
    options: ["Ninguna, soy constante", "1 vez", "2 o 3 veces", "4 o más 😅"] },
  { key: "Lo que más frena", type: "multi", max: 2, question: "¿Qué te ha frenado más para lograrlo?", hint: "Elige máximo 2.",
    options: ["No sé qué rutina hacer", "No sé qué comer", "La información en internet se contradice", "Pierdo la motivación",
      "No tengo tiempo", "No veo resultados", "Me lesiono o tengo molestias", "Un entrenador es muy caro"] },
  { key: "Lo último que intentó", type: "text", question: "¿Qué fue lo último que intentaste para lograrlo y por qué lo dejaste?",
    hint: "Opcional, pero me ayuda muchísimo.", placeholder: "Ej: seguí una rutina de YouTube 3 semanas y la dejé porque no veía cambios…" },
  { key: "Pagó en el último año", type: "single", question: "En el último año, ¿por qué has pagado?",
    options: ["Por nada todavía", "Solo por el gimnasio", "Entrenador, nutricionista o app", "Varios de estos"] },
  { key: "Resultado del pago", type: "single", question: "Lo que has usado o pagado, ¿te dio resultados?",
    options: ["Sí, buenos resultados", "Algunos, pero no los esperados", "No, ninguno", "No he usado nada"] },
  { key: "Lo más valioso", type: "single", question: "¿Qué te ayudaría MÁS a lograrlo?",
    options: ["Una rutina hecha para mí", "Saber exactamente qué comer", "Que alguien me haga seguimiento y me exija", "Que me corrijan la técnica"] },
  { key: "Modalidad y horario", type: "single", question: "¿Cómo y cuándo te quedaría mejor?",
    options: ["Online, a mi ritmo", "Presencial entre semana", "Presencial fines de semana", "Una mezcla de online y presencial"] },
  { key: "Inversión mensual", type: "single", question: "¿Cuánto invertirías al mes en algo que de verdad te funcione?",
    options: ["Menos de $50.000", "$50.000 a $100.000", "$100.000 a $150.000", "$150.000 a $250.000", "Más de $250.000"] },
];

// Plan recomendado: el del perfil, ajustado por lo que la persona más valora
function recommendPlan(answers) {
  const profile = SURVEY_PROFILES[answers["Perfil"]];
  if (["deportista", "mayor", "salud"].includes(profile.plan)) return profile.plan;
  const valued = answers["Lo más valioso"] || "";
  if (valued.startsWith("Saber exactamente")) return "nutrition";
  if (valued.startsWith("Que alguien")) return "combo";
  if (valued.startsWith("Una rutina") || valued.startsWith("Que me corrijan")) {
    return profile.plan === "combo" ? "combo" : "training";
  }
  return profile.plan;
}

const survey = document.getElementById("survey");

if (survey) {
  const screens = survey.querySelectorAll(".quiz__screen");
  const sCount = document.getElementById("surveyCount");
  const sBar = document.getElementById("surveyBar");
  const sQuestion = document.getElementById("surveyQuestion");
  const sHint = document.getElementById("surveyHint");
  const sOptions = document.getElementById("surveyOptions");
  const sNext = document.getElementById("surveyNext");
  const sBack = survey.querySelector("[data-survey='back']");
  const contact = document.getElementById("surveyContact");
  const total = SURVEY_QUESTIONS.length;
  let current = 0;
  let answers = {};
  let lastFocus = null;

  const showScreen = (name) => screens.forEach((el) => (el.hidden = el.dataset.screen !== name));

  // Modo enfoque: el diagnóstico ocupa toda la pantalla y el resto de la página se oculta
  function openFocus() {
    if (survey.classList.contains("is-focus")) return;
    lastFocus = document.activeElement;
    survey.classList.add("is-focus", "is-visible");
    document.documentElement.classList.add("sf-lock");
    survey.scrollTop = 0;
  }
  function closeFocus() {
    survey.classList.remove("is-focus");
    document.documentElement.classList.remove("sf-lock");
    survey.scrollIntoView({ block: "start" });
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  const goTo = (i) => {
    current = i;
    survey.scrollTop = 0;
    if (current < total) renderQuestion();
    else {
      sBar.style.width = "100%";
      showScreen("contact");
    }
  };

  function start() {
    answers = {};
    openFocus();
    goTo(0);
  }

  function optionButton(label, selected, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz__option" + (selected ? " is-selected" : "");
    btn.textContent = label;
    btn.addEventListener("click", () => onClick(btn));
    return btn;
  }

  function renderQuestion() {
    const q = SURVEY_QUESTIONS[current];
    showScreen("question");
    sCount.textContent = `Pregunta ${current + 1} de ${total}`;
    sBar.style.width = `${(current / total) * 100}%`;
    sQuestion.textContent = q.question;
    sHint.textContent = q.hint || "";
    sBack.disabled = current === 0;
    sOptions.innerHTML = "";
    sOptions.className = "quiz__options" + (q.type === "scale" ? " quiz__options--scale" : "");
    sNext.hidden = !(q.type === "multi" || q.type === "text");
    const advance = () => setTimeout(() => goTo(current + 1), 250);

    if (q.type === "single") {
      q.options.forEach((opt) => {
        const value = typeof opt === "string" ? opt : opt.value;
        const text = typeof opt === "string" ? opt : opt.text;
        sOptions.appendChild(optionButton(text, answers[q.key] === value, (btn) => {
          answers[q.key] = value;
          sOptions.querySelectorAll(".quiz__option").forEach((b) => b.classList.remove("is-selected"));
          btn.classList.add("is-selected");
          advance();
        }));
      });
    } else if (q.type === "scale") {
      for (let n = 1; n <= 10; n++) {
        sOptions.appendChild(optionButton(String(n), answers[q.key] === n, (btn) => {
          answers[q.key] = n;
          btn.classList.add("is-selected");
          advance();
        }));
      }
      const labels = document.createElement("div");
      labels.className = "survey__scale-labels";
      labels.innerHTML = "<span></span><span></span>";
      labels.children[0].textContent = `1 · ${q.low}`;
      labels.children[1].textContent = `${q.high} · 10`;
      sOptions.appendChild(labels);
    } else if (q.type === "multi") {
      const chosen = new Set(answers[q.key] || []);
      const sync = () => { sNext.disabled = chosen.size === 0; };
      q.options.forEach((opt) =>
        sOptions.appendChild(optionButton(opt, chosen.has(opt), (btn) => {
          if (chosen.has(opt)) chosen.delete(opt);
          else if (chosen.size < q.max) chosen.add(opt);
          btn.classList.toggle("is-selected", chosen.has(opt));
          answers[q.key] = [...chosen];
          sync();
        }))
      );
      sync();
    } else if (q.type === "text") {
      const area = document.createElement("textarea");
      area.rows = 4;
      area.maxLength = 600;
      area.placeholder = q.placeholder || "";
      area.value = answers[q.key] || "";
      area.addEventListener("input", () => {
        answers[q.key] = area.value.trim();
        sNext.textContent = answers[q.key] ? "Siguiente" : "Omitir";
      });
      sOptions.appendChild(area);
      sNext.disabled = false;
    }
    sNext.textContent = q.type === "text" && !answers[q.key] ? "Omitir" : "Siguiente";
    sQuestion.focus({ preventScroll: true });
  }

  function showReward() {
    const profile = SURVEY_PROFILES[answers["Perfil"]] || SURVEY_PROFILES.energia;
    const plan = SURVEY_PLANS[recommendPlan(answers)];
    document.getElementById("rewardEmoji").textContent = profile.emoji;
    document.getElementById("surveyRewardTitle").textContent = profile.title;
    document.getElementById("rewardPlan").textContent = plan;
    const list = document.getElementById("rewardHabits");
    list.innerHTML = "";
    profile.habits.forEach(([title, text]) => {
      const li = document.createElement("li");
      li.innerHTML = "<strong></strong><span></span>";
      li.children[0].textContent = title;
      li.children[1].textContent = text;
      list.appendChild(li);
    });
    const name = contact.elements.sName.value.trim();
    const wa = document.getElementById("rewardWa");
    wa.href = whatsappUrl(
      `¡Hola Ángel! 👋 Soy *${name || "…"}* y acabo de hacer el diagnóstico de SabFit.\n\n` +
      `🎯 Mi objetivo: *${profile.label}*\n✅ Plan recomendado: *${plan}*\n\n` +
      `Quiero agendar mi *primera reunión online gratis*.`
    );
    wa.onclick = () => trackWhatsApp(`diagnostico_${answers["Perfil"]}`);
    showScreen("reward");
    survey.scrollTop = 0;
    document.getElementById("surveyRewardTitle").focus({ preventScroll: true });
    return plan;
  }

  function sendAnswers(extra) {
    const row = {};
    SURVEY_QUESTIONS.forEach((q) => {
      const v = answers[q.key];
      row[q.key] = q.key === "Perfil" && SURVEY_PROFILES[v] ? SURVEY_PROFILES[v].label : Array.isArray(v) ? v.join(" | ") : v ?? "";
    });
    Object.assign(row, extra);
    const params = new URLSearchParams(location.search);
    row["Fuente"] = params.get("utm_source") || (document.referrer ? new URL(document.referrer).hostname : "directo");

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "survey_complete", origen: answers["Perfil"] });

    if (!SURVEY_ENDPOINT) {
      console.warn("SabFit: falta SURVEY_ENDPOINT, la respuesta no se guardó.", row);
      return;
    }
    // text/plain evita el bloqueo CORS de Google; no necesitamos leer la respuesta
    fetch(SURVEY_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ answers: row }),
    }).catch(() => {});
  }

  contact.addEventListener("submit", (e) => {
    e.preventDefault();
    const error = document.getElementById("surveyError");
    const name = contact.elements.sName.value.trim();
    const phone = contact.elements.sPhone.value.trim();
    const digits = phone.replace(/\D/g, "");
    let problem = "";
    if (name.length < 2) problem = "Escribe tu nombre.";
    else if (digits.length < 10) problem = "Escribe tu número de WhatsApp completo (10 dígitos).";
    else if (!contact.elements.sConsent.checked) problem = "Necesito tu autorización para guardar tus datos.";
    if (problem) {
      error.textContent = problem;
      return;
    }
    error.textContent = "";
    const plan = showReward();
    // Campo trampa: si un robot lo llena, no se guarda nada
    if (!contact.elements.sWebsite.value) {
      sendAnswers({ "Nombre": name, "WhatsApp": phone, "Autoriza contacto": "Sí", "Plan recomendado": plan });
    }
    try { localStorage.setItem("sf-survey", JSON.stringify({ ...answers, _name: name })); } catch (err) {}
  });

  survey.addEventListener("click", (e) => {
    const action = e.target.closest("[data-survey]")?.dataset.survey;
    if (action === "start") start();
    else if (action === "back" && current > 0) goTo(current - 1);
    else if (action === "next") goTo(current + 1);
    else if (action === "close") closeFocus();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && survey.classList.contains("is-focus")) closeFocus();
  });

  // Botones de la página que abren el diagnóstico directamente
  document.querySelectorAll("[data-open-survey]").forEach((link) =>
    link.addEventListener("click", (e) => {
      e.preventDefault();
      start();
    })
  );

  // Quien ya respondió puede volver a ver sus hábitos sin repetir el diagnóstico
  try {
    const saved = JSON.parse(localStorage.getItem("sf-survey") || "null");
    if (saved && SURVEY_PROFILES[saved["Perfil"]]) {
      const again = document.createElement("button");
      again.type = "button";
      again.className = "quiz__restart";
      again.textContent = "Ya respondí: ver mis 5 hábitos";
      again.addEventListener("click", () => {
        answers = saved;
        contact.elements.sName.value = saved._name || "";
        openFocus();
        showReward();
      });
      survey.querySelector("[data-survey='start']").insertAdjacentElement("afterend", again);
    }
  } catch (err) {}
}

// Planes y precios: cambiar entre online y presencial
document.querySelectorAll('input[name="priceMode"]').forEach((radio) =>
  radio.addEventListener("change", () => {
    document.querySelectorAll("[data-price-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.pricePanel !== radio.value;
      panel.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
    });
  })
);

// Animaciones de la portada (si no te gustan, borra este bloque y la cinta en index.html)
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 1) La foto se mueve suavemente siguiendo el mouse (solo en computador)
const heroPhoto = document.getElementById("heroPhoto");
if (heroPhoto && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
  const hero = heroPhoto.closest(".hero");
  let frame = 0;
  hero.addEventListener("pointermove", (e) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      const r = hero.getBoundingClientRect();
      heroPhoto.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      heroPhoto.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      frame = 0;
    });
  });
  hero.addEventListener("pointerleave", () => {
    heroPhoto.style.setProperty("--mx", 0);
    heroPhoto.style.setProperty("--my", 0);
  });
}

// 2) La cinta de palabras acelera al hacer scroll y cambia de sentido al subir
const ribbon = document.getElementById("ribbon");
const ribbonAnim = ribbon && !reduceMotion && ribbon.getAnimations ? ribbon.getAnimations()[0] : null;
if (ribbonAnim) {
  let lastY = window.scrollY;
  let boost = 0;
  let ticking = false;
  const settle = () => {
    boost *= 0.9;
    ribbonAnim.playbackRate = Math.abs(boost) < 0.05 ? Math.sign(ribbonAnim.playbackRate) || 1 : boost;
    if (Math.abs(boost) >= 0.05) requestAnimationFrame(settle);
    else ticking = false;
  };
  window.addEventListener("scroll", () => {
    const dy = window.scrollY - lastY;
    lastY = window.scrollY;
    boost = Math.max(-6, Math.min(6, (Math.sign(dy) || 1) * (1 + Math.abs(dy) / 12)));
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(settle);
    }
  }, { passive: true });
}

document.getElementById("year").textContent = new Date().getFullYear();
