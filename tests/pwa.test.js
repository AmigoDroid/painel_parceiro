import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const pub = (f) => path.join(root, "public", f);
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const manifest = JSON.parse(fs.readFileSync(pub("manifest.webmanifest"), "utf8"));

function pngSize(file) {
  const b = fs.readFileSync(file);
  assert.equal(b.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `${file} não é PNG`);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

test("index.html liga favicon, apple-touch-icon e manifest", () => {
  for (const re of [/rel="icon"[^>]*href="\/favicon\.svg"/, /rel="icon"[^>]*href="\/favicon\.ico"/, /rel="apple-touch-icon"/, /rel="manifest"\s+href="\/manifest\.webmanifest"/, /<script src="\/pwa-register\.js"/])
    assert.match(html, re);
});

test("manifest cumpre os critérios de instalação do Chrome", () => {
  assert.ok(manifest.name && manifest.short_name);
  assert.equal(manifest.start_url, "/");
  assert.ok(["standalone", "fullscreen", "minimal-ui"].includes(manifest.display));
  const sizes = manifest.icons.map((i) => i.sizes);
  assert.ok(sizes.includes("192x192") && sizes.includes("512x512"));
  assert.ok(manifest.icons.some((i) => i.purpose === "maskable"));
});

test("todos os ícones do manifest existem e têm o tamanho declarado", () => {
  for (const icon of manifest.icons) {
    const [w, h] = pngSize(pub(icon.src.replace(/^\//, "")));
    assert.equal(`${w}x${h}`, icon.sizes, icon.src);
  }
  for (const f of ["favicon.svg", "favicon.ico", "favicon-32.png", "apple-touch-icon.png", "offline.html", "sw.js", "pwa-register.js"])
    assert.ok(fs.existsSync(pub(f)), f);
});

test("service worker tem handler de fetch e nunca intercepta convite/API/POST", () => {
  const sw = fs.readFileSync(pub("sw.js"), "utf8");
  assert.match(sw, /addEventListener\("fetch"/);
  assert.match(sw, /req\.method !== "GET" \|\| req\.mode !== "navigate"\) return/);
  assert.doesNotMatch(sw, /cache\.put|caches\.put/); // HTML de navegação nunca é guardado
});

test("bootstrap de convite continua sendo o primeiro <script> inline", () => {
  assert.match(html.match(/<script>([\s\S]*?)<\/script>/)[1], /delta-partner-pending-invite/);
});
