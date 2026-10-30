/* =========================================================
   SabFit · Configuración
   Escribe tu número de WhatsApp con código de país,
   solo números, sin "+", espacios ni guiones.
   Ejemplo Chile: 56912345678 · Colombia: 573001234567
   ========================================================= */
const WHATSAPP_NUMBER = "573156942956";

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
// Cada opción suma puntos a nutrición (n) y/o entrenamiento (t).
// El resultado (perfil) depende de la respuesta a la primera pregunta.
const QUIZ_QUESTIONS = [
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
  {
    question: "¿Cómo te gustaría el acompañamiento?",
    options: [
      { emoji: "📱", text: "Online, a mi ritmo" },
      { emoji: "🤝", text: "Presencial" },
      { emoji: "🔀", text: "Una mezcla de ambos" },
      { emoji: "💬", text: "Aún no sé, quiero conversarlo" },
    ],
  },
];

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
  combo: "Nutrición + Entrenamiento",
  nutrition: "Plan de nutrición",
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

  const showScreen = (name) =>
    screens.forEach((s) => (s.hidden = s.dataset.screen !== name));

  function renderQuestion() {
    const q = QUIZ_QUESTIONS[current];
    qCount.textContent = `Pregunta ${current + 1} de ${QUIZ_QUESTIONS.length}`;
    qBar.style.width = `${(current / QUIZ_QUESTIONS.length) * 100}%`;
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
    answers[current] = i;
    qOptions.querySelectorAll(".quiz__option").forEach((b) => b.classList.remove("is-selected"));
    btn.classList.add("is-selected");
    qOptions.style.pointerEvents = "none";
    setTimeout(() => {
      qOptions.style.pointerEvents = "";
      if (current < QUIZ_QUESTIONS.length - 1) {
        current++;
        renderQuestion();
      } else {
        showResult();
      }
    }, 300);
  }

  function showResult() {
    let n = 0;
    let t = 0;
    const chosen = answers.map((a, qi) => QUIZ_QUESTIONS[qi].options[a]);
    chosen.forEach((o) => {
      n += o.n || 0;
      t += o.t || 0;
    });

    let plan = "combo";
    if (n - t >= 4) plan = "nutrition";
    else if (t - n >= 4) plan = "training";

    const profile = QUIZ_PROFILES[chosen[0].profile];
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

    const summary = QUIZ_QUESTIONS.map((q, qi) => `• ${q.question} ${chosen[qi].text}`).join("\n");
    const msg =
      `¡Hola Ángel! 👋 Acabo de hacer el test de SabFit.\n\n` +
      `🏷️ Mi perfil: *${profile.title}*\n` +
      `✅ Plan recomendado: *${QUIZ_PLANS[plan]}*\n\n` +
      `📝 Mis respuestas:\n${summary}\n\n` +
      `¿Me cuentas cómo podemos empezar?`;
    const resultWa = document.getElementById("resultWa");
    resultWa.href = whatsappUrl(msg);
    resultWa.onclick = () => trackWhatsApp(`test_${chosen[0].profile}`);

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

document.getElementById("year").textContent = new Date().getFullYear();
