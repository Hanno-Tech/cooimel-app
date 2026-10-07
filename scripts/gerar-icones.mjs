// Gera os ícones do app (PWA/Android/iOS/favicon) a partir do logo em SVG.
// Uso: node scripts/gerar-icones.mjs
import { writeFile } from "node:fs/promises";
import sharp from "sharp";

const FUNDO = "#013220";

// Logo (gota + folhas) do components/brand/logo.tsx, viewBox 64×56.
const logo = `
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9ad8fb"/><stop offset="1" stop-color="#2b86d6"/>
    </linearGradient>
  </defs>
  <path d="M32 2c5 8 11 14 11 21a11 11 0 0 1-22 0c0-7 6-13 11-21z" fill="url(#g)"/>
  <path d="M6 38c8-10 22-13 36-11 6 1 11 0 16-3-5 9-15 14-28 14-9 0-16 1-24 6z" fill="#8fd14f"/>
  <path d="M10 50c10-8 24-10 38-8 4 0 8-1 11-3-5 8-14 12-26 12-8 0-15 0-23 3z" fill="#3fbf5a"/>`;

/** escala = fração do lado ocupada pelo logo; raio = cantos arredondados (0 = quadrado). */
function svg(lado, escala, raio = 0) {
  const w = lado * escala;
  const h = (w * 56) / 64;
  const x = (lado - w) / 2;
  const y = (lado - h) / 2 + lado * 0.02;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}">
  <rect width="${lado}" height="${lado}" rx="${raio}" fill="${FUNDO}"/>
  <svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 64 56">${logo}</svg>
</svg>`;
}

const png = (s, out) => sharp(Buffer.from(s)).png().toFile(out);

await png(svg(192, 0.7), "public/icons/icon-192.png");
await png(svg(512, 0.7), "public/icons/icon-512.png");
// maskable: Android recorta em círculo/squircle — logo dentro da zona segura (~60%)
await png(svg(512, 0.55), "public/icons/maskable-512.png");
await png(svg(180, 0.68), "app/apple-icon.png");
await writeFile("app/icon.svg", svg(64, 0.78, 14));
console.log("ícones gerados");
