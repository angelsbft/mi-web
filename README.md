# SabFit · Web

Sitio estático (HTML, CSS y JS sin dependencias) para **sabfit.online**.

## Antes de publicar

1. **Número de WhatsApp**: abre `js/main.js` y cambia `WHATSAPP_NUMBER` por tu número con código de país, solo dígitos (ej. `56912345678`).
2. **Tu foto**: guarda tu imagen en `img/foto.jpg` y, en `index.html` (sección "Sobre mí"), reemplaza el bloque `about__placeholder` por:
   ```html
   <img src="img/foto.jpg" alt="Tu nombre, coach de SabFit" loading="lazy">
   ```
3. **Textos**: ajusta tu nombre, formación y servicios en `index.html`.
4. **Colores**: cambia las variables de `:root` al inicio de `css/styles.css`.

## Subir al hosting

Sube **todo el contenido** de esta carpeta (`index.html`, `favicon.svg`, `css/`, `js/` e `img/` si la agregas) a la carpeta pública de tu hosting (normalmente `public_html/`) usando el administrador de archivos o FTP.

## Probar localmente

Abre `index.html` en el navegador, o ejecuta `python3 -m http.server` y visita http://localhost:8000.
