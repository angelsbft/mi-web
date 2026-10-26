"""Genera una versión de un solo archivo para pegar en un bloque
"HTML personalizado" de WordPress.

Uso: python3 build-wordpress.py [salida]   (por defecto: sabfit-wordpress.txt)
"""
import re
import sys
from pathlib import Path

root = Path(__file__).parent
out = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "sabfit-wordpress.txt"

html = (root / "index.html").read_text(encoding="utf-8")
css = (root / "css/styles.css").read_text(encoding="utf-8")
js = (root / "js/main.js").read_text(encoding="utf-8")

fonts = re.search(r'<link href="https://fonts\.googleapis\.com/css2[^>]*>', html).group(0)
body = re.search(r"<body>(.*)</body>", html, re.S).group(1)
body = body.replace('<script src="js/main.js"></script>', "")
# El editor de WordPress puede alterar comentarios y líneas en blanco
body = re.sub(r"<!--.*?-->", "", body, flags=re.S)
body = re.sub(r"\n\s*\n+", "\n", body).strip()

out.write_text(
    f'<!-- SabFit: pega TODO este contenido en un bloque "HTML personalizado" -->\n'
    f"{fonts}\n<style>\n{css}</style>\n{body}\n<script>\n{js}</script>\n",
    encoding="utf-8",
)
print(f"Generado: {out}")
