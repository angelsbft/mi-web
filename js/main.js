/* =========================================================
   SabFit · Configuración
   Escribe tu número de WhatsApp con código de país,
   solo números, sin "+", espacios ni guiones.
   Ejemplo Chile: 56912345678 · Colombia: 573001234567
   ========================================================= */
const WHATSAPP_NUMBER = "56900000000";

document.documentElement.classList.add("js");

function whatsappUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// Enlaces de WhatsApp: cualquier elemento con data-wa="mensaje"
document.querySelectorAll("[data-wa]").forEach((link) => {
  link.href = whatsappUrl(link.dataset.wa);
  link.target = "_blank";
  link.rel = "noopener";
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

  let text = `Hola! Soy ${name}. Me interesa: ${goal}.`;
  if (message) text += `\nMi objetivo: ${message}`;

  window.open(whatsappUrl(text), "_blank", "noopener");
});

document.getElementById("year").textContent = new Date().getFullYear();
