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

// Formulario de contacto → abre WhatsApp con el mensaje armado
const form = document.getElementById("contactForm");
const formError = document.getElementById("formError");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = form.elements.name.value.trim();
  const goal = form.elements.goal.value;
  const message = form.elements.message.value.trim();

  if (!name) {
    formError.textContent = "Por favor escribe tu nombre.";
    form.elements.name.classList.add("is-invalid");
    form.elements.name.focus();
    return;
  }
  formError.textContent = "";
  form.elements.name.classList.remove("is-invalid");

  let text = `¡Hola Ángel! 👋 Soy *${name}*.\n\nMe interesa: *${goal}*`;
  if (message) text += `\nMi objetivo: ${message}`;
  text += `\n\n¿Me cuentas cómo podemos empezar?`;

  trackWhatsApp("formulario_contacto");
  window.open(whatsappUrl(text), "_blank", "noopener");
});

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

// Test "¿Qué plan es para ti?"
// 1) La primera pregunta elige el tipo de acompañamiento (QUIZ_SEGMENT).
// 2) Cada tipo tiene sus propias preguntas (QUIZ_FLOWS).
// En el flujo general, cada opción suma puntos a nutrición (n) y/o entrenamiento (t)
// y el perfil depende de la respuesta a "¿Cuál es tu objetivo principal?".
const QUIZ_SEGMENT = {
  question: "¿Qué tipo de acompañamiento buscas?",
  options: [
    { emoji: "🏋️", text: "Quiero entrenar y/o comer mejor", segment: "general" },
    { emoji: "🧓", text: "Soy adulto mayor (60+) o busco para un familiar", segment: "mayor" },
    { emoji: "🏆", text: "Soy deportista", segment: "deportista" },
    { emoji: "❤️", text: "Tengo una condición de salud o una lesión", segment: "salud" },
    { emoji: "💬", text: "Solo quiero una consultoría puntual", segment: "consultoria" },
  ],
};

const QUIZ_MODALITY = {
  question: "¿Cómo te gustaría el acompañamiento?",
  options: [
    { emoji: "📱", text: "Online, a mi ritmo" },
    { emoji: "🤝", text: "Presencial" },
    { emoji: "🔀", text: "Una mezcla de ambos" },
    { emoji: "💬", text: "Aún no sé, quiero conversarlo" },
  ],
};

const QUIZ_GENERAL = [
  {
    question: "¿Cuál es tu objetivo principal?",
    options: [
      { emoji: "🔥", text: "Bajar de peso / grasa", n: 2, t: 2, profile: "fat" },
      { emoji: "💪", text: "Ganar masa muscular", n: 1, t: 2, profile: "muscle" },
      { emoji: "🌱", text: "Mejorar mi salud y energía", n: 2, t: 1, profile: "health" },
      { emoji: "🏃", text: "Rendir más en mi deporte", n: 1, t: 2, profile: "sport" },
      { emoji: "🧠", text: "Mejorar mi relación con la comida", n: 3, t: 0, profile: "habits" },
      { emoji: "✨", text: "Tonificar y sentirme mejor", n: 1, t: 2, profile: "tone" },
    ],
  },
  {
    question: "¿Cómo describirías tu alimentación hoy?",
    options: [
      { emoji: "🍔", text: "Desordenada, como lo que puedo", n: 3, t: 0 },
      { emoji: "😅", text: "Más o menos, a veces bien y a veces no", n: 2, t: 0 },
      { emoji: "🥗", text: "Bastante buena, pero quiero optimizarla", n: 1, t: 0 },
      { emoji: "🔄", text: "He probado muchas dietas sin éxito", n: 3, t: 0 },
    ],
  },
  {
    question: "¿Cuánta actividad física haces a la semana?",
    options: [
      { emoji: "🛋️", text: "Casi nada", n: 0, t: 3 },
      { emoji: "🚶", text: "1 o 2 días", n: 0, t: 2 },
      { emoji: "🏋️", text: "3 días o más", n: 0, t: 1 },
      { emoji: "🏆", text: "Entreno todos los días", n: 1, t: 1 },
    ],
  },
  {
    question: "¿Dónde prefieres entrenar?",
    options: [
      { emoji: "🏠", text: "En casa", n: 0, t: 1 },
      { emoji: "🏢", text: "En el gimnasio", n: 0, t: 1 },
      { emoji: "🌳", text: "Al aire libre", n: 0, t: 1 },
      { emoji: "🤷", text: "Por ahora solo quiero mejorar mi alimentación", n: 2, t: -3 },
    ],
  },
  {
    question: "¿Qué es lo que más te ha costado?",
    options: [
      { emoji: "📅", text: "Ser constante", n: 1, t: 1 },
      { emoji: "🍽️", text: "Saber qué y cuánto comer", n: 3, t: 0 },
      { emoji: "🤸", text: "Saber cómo entrenar bien", n: 0, t: 3 },
      { emoji: "⏰", text: "Encontrar tiempo", n: 1, t: 1 },
    ],
  },
  QUIZ_MODALITY,
];

const QUIZ_FLOWS = {
  general: { questions: QUIZ_GENERAL },
  mayor: {
    profile: "mayor",
    plan: "mayor",
    questions: [
      {
        question: "¿Qué es lo más importante para ti?",
        options: [
          { emoji: "🚶", text: "Moverme con más facilidad" },
          { emoji: "⚖️", text: "Ganar fuerza y equilibrio" },
          { emoji: "🩺", text: "Cuidar mi salud (presión, azúcar, huesos)" },
          { emoji: "☀️", text: "Mantenerme activo/a y con energía" },
        ],
      },
      {
        question: "¿Cómo está tu movilidad hoy?",
        options: [
          { emoji: "👍", text: "Me muevo bien" },
          { emoji: "😐", text: "Tengo algunas molestias" },
          { emoji: "🪜", text: "Me cuesta levantarme o subir escaleras" },
          { emoji: "🦯", text: "Uso apoyo (bastón o caminador)" },
        ],
      },
      {
        question: "¿Tienes alguna condición médica?",
        options: [
          { emoji: "✅", text: "No" },
          { emoji: "💊", text: "Sí, y está controlada" },
          { emoji: "❓", text: "Sí, y quiero orientación" },
          { emoji: "🔒", text: "Prefiero contarlo en privado" },
        ],
      },
      QUIZ_MODALITY,
    ],
  },
  deportista: {
    profile: "sport",
    plan: "deportista",
    questions: [
      {
        question: "¿Qué deporte practicas?",
        options: [
          { emoji: "⚽", text: "Fútbol u otro deporte de equipo" },
          { emoji: "🚴", text: "Running, ciclismo o resistencia" },
          { emoji: "🏋️", text: "Gimnasio, fuerza o culturismo" },
          { emoji: "🥊", text: "Otro deporte" },
        ],
      },
      {
        question: "¿Qué quieres mejorar?",
        options: [
          { emoji: "💥", text: "Fuerza y potencia" },
          { emoji: "💪", text: "Masa muscular" },
          { emoji: "🫁", text: "Resistencia" },
          { emoji: "🛡️", text: "Prevenir lesiones" },
        ],
      },
      {
        question: "¿En qué momento de tu temporada estás?",
        options: [
          { emoji: "📅", text: "Pretemporada" },
          { emoji: "🏁", text: "En competencia" },
          { emoji: "🌙", text: "Fuera de temporada" },
          { emoji: "🙋", text: "Entreno por mi cuenta, sin competir" },
        ],
      },
      {
        question: "¿Cómo está tu alimentación para rendir?",
        options: [
          { emoji: "🥗", text: "Bien, pero quiero optimizarla" },
          { emoji: "😅", text: "Podría mejorar bastante" },
          { emoji: "🤔", text: "No sé qué comer antes y después de entrenar" },
        ],
      },
      QUIZ_MODALITY,
    ],
  },
  salud: {
    profile: "salud",
    plan: "salud",
    questions: [
      {
        question: "¿Cuál es tu situación?",
        options: [
          { emoji: "⚖️", text: "Sobrepeso u obesidad" },
          { emoji: "🩸", text: "Diabetes o resistencia a la insulina" },
          { emoji: "❤️", text: "Hipertensión o colesterol alto" },
          { emoji: "🦴", text: "Dolor de espalda, articulaciones o una lesión" },
          { emoji: "📝", text: "Otra situación" },
        ],
      },
      {
        question: "¿Tienes el visto bueno de tu médico para hacer ejercicio?",
        options: [
          { emoji: "✅", text: "Sí" },
          { emoji: "⏳", text: "Todavía no" },
          { emoji: "🤷", text: "No sé si lo necesito" },
        ],
      },
      {
        question: "¿Qué tan activo/a eres hoy?",
        options: [
          { emoji: "🛋️", text: "Casi nada" },
          { emoji: "🚶", text: "Algo, camino o hago poco ejercicio" },
          { emoji: "🏃", text: "Bastante, pero quiero hacerlo bien" },
        ],
      },
      QUIZ_MODALITY,
    ],
  },
  consultoria: {
    profile: "consultoria",
    plan: "consultoria",
    questions: [
      {
        question: "¿Sobre qué quieres la consultoría?",
        options: [
          { emoji: "📋", text: "Revisar mi rutina actual" },
          { emoji: "🎯", text: "Corregir mi técnica" },
          { emoji: "🍽️", text: "Dudas de alimentación y hábitos" },
          { emoji: "🧭", text: "Armar un plan para empezar por mi cuenta" },
        ],
      },
      {
        question: "¿Cómo prefieres la consultoría?",
        options: [
          { emoji: "💻", text: "Videollamada" },
          { emoji: "🤝", text: "Presencial" },
          { emoji: "💬", text: "Por WhatsApp" },
        ],
      },
    ],
  },
};

const QUIZ_PROFILES = {
  fat: {
    emoji: "🔥",
    title: "Quema Grasa Inteligente",
    text: "Quieres bajar grasa sin pasar hambre ni perder energía. La clave está en un déficit calórico moderado, proteína suficiente y entrenamiento de fuerza para conservar músculo.",
    tips: [
      "Incluye una fuente de proteína en cada comida (huevo, pollo, pescado, legumbres).",
      "Llena la mitad de tu plato con verduras: más saciedad con menos calorías.",
      "Camina 8.000 pasos al día: suma más de lo que crees.",
    ],
  },
  muscle: {
    emoji: "💪",
    title: "Constructor de Músculo",
    text: "Tu meta es ganar fuerza y masa muscular. Necesitas un entrenamiento con progresión, comer lo suficiente (sí, a veces más de lo que crees) y descansar bien.",
    tips: [
      "Apunta a 1,6–2 g de proteína por kilo de peso al día.",
      "Entrena cada grupo muscular al menos 2 veces por semana.",
      "Duerme 7–9 horas: el músculo crece cuando descansas.",
    ],
  },
  health: {
    emoji: "🌱",
    title: "Bienestar y Energía",
    text: "Buscas sentirte mejor en tu día a día: más energía, mejor digestión y salud a largo plazo. Pequeños cambios sostenidos harán una gran diferencia.",
    tips: [
      "Toma agua apenas despiertes y lleva una botella contigo.",
      "Prioriza alimentos reales: frutas, verduras, legumbres y proteínas.",
      "Muévete al menos 30 minutos al día, aunque sea caminando.",
    ],
  },
  sport: {
    emoji: "🏃",
    title: "Atleta en Evolución",
    text: "Quieres rendir más en tu deporte. Tu alimentación y tu preparación física deben ir de la mano con tus entrenamientos y competencias.",
    tips: [
      "Come carbohidratos de calidad antes de entrenar para tener energía.",
      "Recupera con proteína + carbohidratos después de entrenar.",
      "Trabaja fuerza 2 veces por semana para prevenir lesiones.",
    ],
  },
  mayor: {
    emoji: "🧓",
    title: "Fuerza y Vitalidad 60+",
    text: "Tu prioridad es moverte con seguridad, ganar fuerza y mantener tu independencia. Con ejercicios adaptados y progresivos se puede mejorar a cualquier edad.",
    tips: [
      "Haz ejercicios de fuerza 2 o 3 veces por semana: protegen tus músculos y tus huesos.",
      "Practica equilibrio a diario, por ejemplo pararte en un pie apoyado en una silla.",
      "Camina todos los días a un ritmo cómodo y aumenta el tiempo poco a poco.",
    ],
  },
  salud: {
    emoji: "❤️",
    title: "Salud en Movimiento",
    text: "El ejercicio bien dosificado es una gran herramienta para tu salud. Trabajaremos de forma segura, progresiva y coordinada con las indicaciones de tu médico.",
    tips: [
      "Antes de empezar, consulta con tu médico y cuéntale qué ejercicio quieres hacer.",
      "Empieza suave y constante: 10 a 15 minutos al día ya suman.",
      "Anota cómo te sientes después de moverte: es información muy útil para ajustar tu plan.",
    ],
  },
  consultoria: {
    emoji: "💬",
    title: "Consultoría Puntual",
    text: "Necesitas respuestas concretas: revisar lo que haces, corregir detalles y salir con un plan claro, sin comprometerte a un programa mensual.",
    tips: [
      "Ten a mano tu rutina actual o lo que comes en un día normal.",
      "Escribe tus 3 dudas principales antes de la sesión.",
      "Si es de técnica, grábate haciendo el ejercicio para revisarlo juntos.",
    ],
  },
  habits: {
    emoji: "🧠",
    title: "Reconexión con la Comida",
    text: "Más que una dieta, necesitas hacer las paces con la comida: comer sin culpa, entender tu hambre y construir hábitos que puedas mantener toda la vida.",
    tips: [
      "Come sin pantallas al menos una comida al día.",
      "No elimines alimentos que te gustan: aprende a incluirlos.",
      "Antes de comer, pregúntate del 1 al 10 cuánta hambre tienes.",
    ],
  },
  tone: {
    emoji: "✨",
    title: "Tonificación Total",
    text: "Quieres verte más firme y sentirte con más energía. La combinación ganadora es entrenamiento de fuerza, buena alimentación y constancia.",
    tips: [
      "Prioriza ejercicios de fuerza por sobre el cardio largo.",
      "Asegura proteína en desayuno, almuerzo y cena.",
      "Mide tu progreso con fotos y medidas, no solo con la balanza.",
    ],
  },
};

const QUIZ_PLANS = {
  combo: "Entrenamiento + Orientación nutricional",
  nutrition: "Orientación nutricional",
  mayor: "Programa Adulto mayor 60+",
  deportista: "Programa Deportistas (entrenamiento + orientación nutricional)",
  salud: "Programa Salud y movimiento",
  consultoria: "Consultoría puntual",
  training: "Entrenamiento personal",
};

const quiz = document.getElementById("quiz");

if (quiz) {
  const screens = quiz.querySelectorAll(".quiz__screen");
  const qCount = document.getElementById("quizCount");
  const qBar = document.getElementById("quizBar");
  const qQuestion = document.getElementById("quizQuestion");
  const qOptions = document.getElementById("quizOptions");
  const backBtn = quiz.querySelector("[data-action='back']");
  let current = 0;
  let answers = [];

  // Preguntas actuales: la de segmento + las del flujo elegido
  const segmentOf = () => (answers[0] === undefined ? "general" : QUIZ_SEGMENT.options[answers[0]].segment);
  const questions = () => [QUIZ_SEGMENT, ...QUIZ_FLOWS[segmentOf()].questions];

  const showScreen = (name) =>
    screens.forEach((s) => (s.hidden = s.dataset.screen !== name));

  function renderQuestion() {
    const list = questions();
    const q = list[current];
    qCount.textContent = `Pregunta ${current + 1} de ${list.length}`;
    qBar.style.width = `${(current / list.length) * 100}%`;
    qQuestion.textContent = q.question;
    backBtn.disabled = current === 0;
    qOptions.innerHTML = "";
    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz__option";
      if (answers[current] === i) btn.classList.add("is-selected");
      btn.innerHTML = `<span class="quiz__option-emoji" aria-hidden="true"></span><span></span>`;
      btn.children[0].textContent = opt.emoji;
      btn.children[1].textContent = opt.text;
      btn.addEventListener("click", () => choose(i, btn));
      qOptions.appendChild(btn);
    });
    // reinicia la animación de entrada
    const screen = quiz.querySelector("[data-screen='question']");
    screen.style.animation = "none";
    void screen.offsetWidth;
    screen.style.animation = "";
    qQuestion.focus({ preventScroll: true });
  }

  function choose(i, btn) {
    // Si cambia el tipo de acompañamiento, se descartan las respuestas del flujo anterior
    if (current === 0 && answers[0] !== i) answers = [];
    answers[current] = i;
    qOptions.querySelectorAll(".quiz__option").forEach((b) => b.classList.remove("is-selected"));
    btn.classList.add("is-selected");
    qOptions.style.pointerEvents = "none";
    setTimeout(() => {
      qOptions.style.pointerEvents = "";
      if (current < questions().length - 1) {
        current++;
        renderQuestion();
      } else {
        showResult();
      }
    }, 300);
  }

  function showResult() {
    const list = questions();
    const chosen = answers.map((a, qi) => list[qi].options[a]);
    const segment = segmentOf();
    const flow = QUIZ_FLOWS[segment];

    let profileKey = flow.profile;
    let plan = flow.plan;
    if (segment === "general") {
      let n = 0;
      let t = 0;
      chosen.forEach((o) => {
        n += o.n || 0;
        t += o.t || 0;
      });
      plan = "combo";
      if (n - t >= 4) plan = "nutrition";
      else if (t - n >= 4) plan = "training";
      profileKey = chosen[1].profile;
    }

    const profile = QUIZ_PROFILES[profileKey];
    document.getElementById("resultEmoji").textContent = profile.emoji;
    document.getElementById("resultTitle").textContent = profile.title;
    document.getElementById("resultText").textContent = profile.text;
    document.getElementById("resultPlan").textContent = QUIZ_PLANS[plan];
    const tips = document.getElementById("resultTips");
    tips.innerHTML = "";
    profile.tips.forEach((tip) => {
      const li = document.createElement("li");
      li.textContent = tip;
      tips.appendChild(li);
    });

    const summary = list.map((q, qi) => `• ${q.question} ${chosen[qi].text}`).join("\n");
    const msg =
      `¡Hola Ángel! 👋 Acabo de hacer el test de SabFit.\n\n` +
      `🏷️ Mi perfil: *${profile.title}*\n` +
      `✅ Plan recomendado: *${QUIZ_PLANS[plan]}*\n\n` +
      `📝 Mis respuestas:\n${summary}\n\n` +
      `¿Me cuentas cómo podemos empezar?`;
    const resultWa = document.getElementById("resultWa");
    resultWa.href = whatsappUrl(msg);
    resultWa.onclick = () => trackWhatsApp(`test_${profileKey}`);

    qBar.style.width = "100%";
    showScreen("result");
    document.getElementById("resultTitle").focus({ preventScroll: true });
    quiz.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  quiz.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "start" || action === "restart") {
      current = 0;
      answers = [];
      showScreen("question");
      renderQuestion();
      if (action === "restart") quiz.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (action === "back" && current > 0) {
      current--;
      renderQuestion();
    }
  });
}

// Diagnóstico (encuesta de 12 preguntas) → Google Sheets + regalo de 5 hábitos
// type: "single" (avanza solo), "multi" (hasta "max"), "scale" (1 a 10), "text" (opcional)
const SURVEY_QUESTIONS = [
  { key: "Edad", type: "single", question: "¿Cuántos años tienes?",
    options: ["15 a 24", "25 a 34", "35 a 49", "50 a 59", "60 o más"] },
  { key: "Me describe", type: "single", question: "¿Qué te describe mejor?",
    options: ["Quiero verme mejor", "Quiero sentirme con más energía", "Soy deportista", "Tengo una condición de salud", "Busco ayuda para un familiar"] },
  { key: "Satisfacción (1-10)", type: "scale", question: "Del 1 al 10, ¿qué tan satisfecho/a estás hoy con tu cuerpo y tu salud?",
    low: "Nada", high: "Totalmente" },
  { key: "Veces que lo ha dejado", type: "single", question: "¿Cuántas veces has empezado a entrenar o a comer mejor y lo has dejado?",
    options: ["Nunca lo he dejado", "1 o 2 veces", "3 a 5 veces", "Perdí la cuenta 😅"] },
  { key: "Lo que más frena", type: "multi", max: 2, question: "¿Qué es lo que más te ha frenado?", hint: "Elige máximo 2.",
    options: ["No sé qué rutina hacer", "No sé qué comer", "Pierdo la motivación", "No tengo tiempo", "Me da pena ir al gimnasio", "Me lesioné o tengo molestias", "Es muy caro tener un entrenador"] },
  { key: "Información", type: "single", question: "Cuando buscas información de ejercicio o alimentación, ¿qué te pasa?",
    options: ["La encuentro y la aplico", "Encuentro cosas que se contradicen", "Hay tanta información que me abrumo", "No busco información"] },
  { key: "Su historia", type: "text", question: "Cuéntame la última vez que intentaste mejorar tu físico o tu salud. ¿Qué pasó?",
    hint: "Opcional, pero me ayuda muchísimo.", placeholder: "Ej: empecé el gimnasio en enero, a las 3 semanas lo dejé porque…" },
  { key: "Ha usado", type: "multi", max: 6, question: "¿Qué has usado para entrenar o comer mejor?", hint: "Puedes elegir varias.",
    options: ["Videos de YouTube o TikTok", "Apps", "Rutinas del gimnasio", "Entrenador personal", "Nutricionista", "Nada todavía"] },
  { key: "Ha pagado", type: "single", question: "¿Has pagado alguna vez por un plan, entrenador o app?",
    options: ["Sí, y me sirvió", "Sí, y no me sirvió", "No, nunca"] },
  { key: "Lo más valioso", type: "single", question: "Si tuvieras a alguien que te acompañe, ¿qué sería lo más valioso?",
    options: ["Una rutina hecha para mí", "Saber qué comer", "Que me haga seguimiento y me exija", "Que me corrija la técnica"] },
  { key: "Modalidad", type: "single", question: "¿Cómo lo preferirías?",
    options: ["Online", "Presencial", "Una mezcla de ambos"] },
  { key: "Inversión mensual", type: "single", question: "¿Cuánto invertirías al mes en algo que de verdad te funcione?",
    options: ["Menos de $50.000", "$50.000 a $100.000", "$100.000 a $150.000", "$150.000 a $250.000", "Más de $250.000"] },
];

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

  const showScreen = (name) => screens.forEach((el) => (el.hidden = el.dataset.screen !== name));
  const goTo = (i) => {
    current = i;
    if (current < total) renderQuestion();
    else {
      sBar.style.width = "100%";
      showScreen("contact");
    }
  };

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
      q.options.forEach((opt) =>
        sOptions.appendChild(optionButton(opt, answers[q.key] === opt, (btn) => {
          answers[q.key] = opt;
          sOptions.querySelectorAll(".quiz__option").forEach((b) => b.classList.remove("is-selected"));
          btn.classList.add("is-selected");
          advance();
        }))
      );
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
      area.addEventListener("input", () => (answers[q.key] = area.value.trim()));
      sOptions.appendChild(area);
      sNext.disabled = false;
    }
    sNext.textContent = q.type === "text" && !answers[q.key] ? "Omitir" : "Siguiente";
    if (q.type === "text") sOptions.querySelector("textarea").addEventListener("input", () => {
      sNext.textContent = answers[q.key] ? "Siguiente" : "Omitir";
    });
    sQuestion.focus({ preventScroll: true });
  }

  function sendAnswers(extra) {
    const row = {};
    SURVEY_QUESTIONS.forEach((q) => {
      const v = answers[q.key];
      row[q.key] = Array.isArray(v) ? v.join(" | ") : v ?? "";
    });
    Object.assign(row, extra);
    const params = new URLSearchParams(location.search);
    row["Fuente"] = params.get("utm_source") || (document.referrer ? new URL(document.referrer).hostname : "directo");

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "survey_complete" });

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
    const consent = contact.elements.sConsent.checked;
    if ((name || phone) && !consent) {
      error.textContent = "Para dejar tus datos necesito tu autorización (o deja los campos vacíos).";
      return;
    }
    error.textContent = "";
    // Campo trampa: si un robot lo llena, no se guarda nada
    if (!contact.elements.sWebsite.value) {
      sendAnswers({
        "Nombre": consent ? name : "",
        "WhatsApp": consent ? phone : "",
        "Autoriza contacto": consent ? "Sí" : "No",
      });
    }
    try { localStorage.setItem("sf-survey-done", "1"); } catch (err) {}
    showScreen("reward");
    document.getElementById("surveyRewardTitle").focus({ preventScroll: true });
    survey.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  survey.addEventListener("click", (e) => {
    const action = e.target.closest("[data-survey]")?.dataset.survey;
    if (action === "start") {
      answers = {};
      goTo(0);
    } else if (action === "back" && current > 0) {
      goTo(current - 1);
    } else if (action === "next") {
      goTo(current + 1);
    }
  });

  // Quien ya respondió puede volver a ver sus hábitos sin repetir la encuesta
  try {
    if (localStorage.getItem("sf-survey-done")) {
      const startBtn = survey.querySelector("[data-survey='start']");
      const again = document.createElement("button");
      again.type = "button";
      again.className = "quiz__restart";
      again.textContent = "Ya respondí: ver mis 5 hábitos";
      again.addEventListener("click", () => showScreen("reward"));
      startBtn.insertAdjacentElement("afterend", again);
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
