# SabFit · Web

Sitio estático (HTML, CSS y JS sin dependencias) para **sabfit.online**.

## Antes de publicar

1. **Número de WhatsApp**: abre `js/main.js` y `WHATSAPP_NUMBER` ya tiene tu número (+57 315 694 2956); cámbialo aquí si algún día usas otro con código de país, solo dígitos (ej. `56912345678`).
2. **Tu foto**: está enlazada desde WordPress en la sección "Sobre mí" de `index.html`. Para cambiarla, reemplaza la URL del `<img>`, por ejemplo:
   ```html
   <img src="img/foto.jpg" alt="Tu nombre, coach de SabFit" loading="lazy">
   ```
3. **Textos**: ajusta tu nombre, formación y servicios en `index.html`.
4. **Colores**: cambia las variables de `:root` al inicio de `css/styles.css`.

## Subir al hosting

Sube **todo el contenido** de esta carpeta (`index.html`, `favicon.svg`, `css/`, `js/` e `img/` si la agregas) a la carpeta pública de tu hosting (normalmente `public_html/`) usando el administrador de archivos o FTP.

## Probar localmente

Abre `index.html` en el navegador, o ejecuta `python3 -m http.server` y visita http://localhost:8000.

## Versión para WordPress

`python3 build-wordpress.py` genera `sabfit-wordpress.txt`: todo el sitio en un solo archivo para pegar en un bloque **HTML personalizado** de WordPress.

## Test "¿Qué plan es para ti?"

Las preguntas, los puntajes y los perfiles están al final de `js/main.js` (`QUIZ_QUESTIONS`, `QUIZ_PROFILES`). El resultado se envía por WhatsApp con las respuestas.
