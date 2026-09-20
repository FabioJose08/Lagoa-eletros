import base64, pathlib
root = pathlib.Path('/home/claude/lagoa-project')
def b64(path, mime): return f"data:{mime};base64," + base64.b64encode((root/path).read_bytes()).decode()
assets = {
  '__ASSET_MARK_SM__': b64('assets/logo-mark-sm.webp','image/webp'),
  '__ASSET_MARK__':    b64('assets/logo-mark.webp','image/webp'),
  '__ASSET_FULL__':    b64('assets/logo-full.webp','image/webp'),
  '__ASSET_FAVICON__': b64('assets/favicon.png','image/png'),
}
js = "(function () {\n'use strict';\n" + "\n".join((root/'src'/f).read_text() for f in ['icons.js','data.js','app.js']) + "\n})();"
for k,v in assets.items(): js = js.replace(k, v)
css = (root/'src/styles.css').read_text()
html = (root/'src/index.template.html').read_text()
html = html.replace('__CSS__', css).replace('__JS__', js)
for k,v in assets.items(): html = html.replace(k, v)
out = pathlib.Path('/mnt/user-data/outputs'); out.mkdir(parents=True, exist_ok=True)
(out/'lagoa-eletros.html').write_text(html, encoding='utf-8')
(root/'build').mkdir(exist_ok=True); (root/'build/check.js').write_text(js)
print('OK', len(html)//1024, 'KB')
