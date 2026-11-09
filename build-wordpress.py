"""Genera una versión de un solo archivo para pegar en un bloque
"HTML personalizado" de WordPress.

Uso:
  python3 build-wordpress.py [salida]              (por defecto: sabfit-wordpress.txt)
  python3 build-wordpress.py --preview [salida]    vista previa con las propuestas de estilo
"""
import re
import sys
from pathlib import Path

root = Path(__file__).parent
args = [a for a in sys.argv[1:] if a != "--preview"]
preview = "--preview" in sys.argv
out = Path(args[0]) if args else root / ("sabfit-preview.html" if preview else "sabfit-wordpress.txt")

html = (root / "index.html").read_text(encoding="utf-8")
css = (root / "css/styles.css").read_text(encoding="utf-8")
js = (root / "js/main.js").read_text(encoding="utf-8")

fonts = re.search(r'<link href="https://fonts\.googleapis\.com/css2[^>]*>', html).group(0)
body = re.search(r"<body>(.*)</body>", html, re.S).group(1)
body = body.replace('<script src="js/main.js"></script>', "")
# El editor de WordPress puede alterar comentarios y líneas en blanco
body = re.sub(r"<!--.*?-->", "", body, flags=re.S)
body = re.sub(r"\n\s*\n+", "\n", body).strip()

# Los temas de WordPress meten el contenido en una columna angosta y añaden su
# propia cabecera, título y pie. Esto hace que SabFit ocupe toda la pantalla.
wp_css = """
/* ---------- WordPress: ancho completo y sin cabecera/pie del tema ---------- */
.sabfit-root {
  width: 100vw;
  max-width: 100vw !important;
  margin: 0 calc(50% - 50vw) !important;
}
body:has(.sabfit-root) :is(.wp-site-blocks > header, .wp-site-blocks > footer,
  header.wp-block-template-part, footer.wp-block-template-part, .wp-block-post-title,
  .site-header, .site-footer, .entry-header, .page-header) { display: none !important; }
body:has(.sabfit-root) :is(.wp-site-blocks, .site-content, .site-main, .entry-content,
  .wp-block-post-content, main.wp-block-group) {
  margin-top: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}
body.admin-bar .header { top: 32px; }
@media (max-width: 782px) { body.admin-bar .header { top: 46px; } }
"""

extra_head = ""
extra_body = ""
if preview:
    themes = (root / "design/themes.css").read_text(encoding="utf-8")
    wp_css += "\n" + themes
    extra_head = ('<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;800;900'
                  '&family=Montserrat:wght@700;800&family=Sora:wght@600;700'
                  '&family=Fraunces:opsz,wght@9..144,600;700&display=swap" rel="stylesheet">\n')
    extra_body = (root / "design/switcher.html").read_text(encoding="utf-8")

out.write_text(
    f'<!-- SabFit: pega TODO este contenido en un bloque "HTML personalizado" -->\n'
    f"{fonts}\n{extra_head}<style>\n{css}{wp_css}</style>\n"
    f'<div class="sabfit-root alignfull">\n{body}\n</div>\n{extra_body}'
    f"<script>\n{js}</script>\n"
    f"<!-- FIN SabFit: si ves esta línea una sola vez, el código está completo -->\n",
    encoding="utf-8",
)
print(f"Generado: {out}")
