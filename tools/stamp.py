"""Écrit dans index.html une carte d'import qui ajoute ?v=<empreinte> à chaque module JS et au dictionnaire.
Chaque publication change l'empreinte : le navigateur recharge alors tous les fichiers ensemble, sans mélange d'anciennes et de nouvelles versions.
Usage : python tools/stamp.py (depuis 03_APP)"""
import hashlib, json, pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
files = sorted(p for p in (root / 'js').rglob('*.js'))
h = hashlib.sha1()
for p in files + [root / 'data' / 'dict-fr.json', root / 'css' / 'base.css', root / 'css' / 'themes.css']:
    h.update(p.read_bytes())
v = h.hexdigest()[:8]
imports = {f'./{p.relative_to(root).as_posix()}': f'./{p.relative_to(root).as_posix()}?v={v}' for p in files}
block = f'<script type="importmap" id="stamp">{json.dumps({"imports": imports}, separators=(",", ":"))}</script>\n<script>window.APP_STAMP = "{v}";</script>'
html = (root / 'index.html').read_text(encoding='utf-8')
html = re.sub(r'<script type="importmap" id="stamp">.*?</script>\n<script>window.APP_STAMP = "\w+";</script>', '', html, flags=re.S)
html = re.sub(r'href="css/(base|themes)\.css(\?v=\w+)?"', lambda m: f'href="css/{m.group(1)}.css?v={v}"', html)
html = html.replace('<script type="module" src="js/app.js"></script>', '<script type="module" src="js/app.js"></script>')
html = re.sub(r'<script type="module" src="js/app\.js(\?v=\w+)?"></script>', block + f'\n<script type="module" src="js/app.js?v={v}"></script>', html)
(root / 'index.html').write_text(html, encoding='utf-8')
print('empreinte', v)
