// SAGLIGIM-ZEMIN — usage: node scripts/portal-zemin-uret.cjs <repoRoot>. Builds public/portal/zemin/* from public/sagligim/*.jpg
const path = require('path');
const root = process.argv[2];
const sharp = require(require.resolve('sharp', { paths: [root] }));
const fs = require('fs');
// focal x (0..1) for the phone's 4:5 crop; KUTU = the part of the source used at all (x0, y0, x1, y1 as fractions) —
// people photos are cut below the faces so no face ever sits behind the page title.
const IMG = { hero: 0.62, 'calm-empty': 0.62, 'empty-cool': 0.6, 'hero-atelier': 0.45, 'ilaclar-care': 0.45,
  'sonuclar-care': 0.5, 'wellness-cycle': 0.3, 'wellness-kitchen': 0.72, 'baby-health': 0.6 };
const KUTU = { 'wellness-kitchen': [0, 0.4, 1, 1] };
// BULANIK = a soft lens blur (sigma, source px): the seaside couple becomes a warm out-of-focus memory — no face, no detail
// competing with the charts in front of it.
const BULANIK = { 'wellness-cycle': 9 };
const SADECE = process.argv.slice(3);
const out = path.join(root, 'public/portal/zemin'); fs.mkdirSync(out, { recursive: true });
const BUT = { masaustu: { avif: 120e3, webp: 170e3 }, telefon: { avif: 50e3, webp: 75e3 } };
async function enc(pipe, fmt, limit) {
  for (let q = fmt === 'avif' ? 60 : 82; q >= 20; q -= 4) {
    const b = await pipe.clone()[fmt](fmt === 'avif' ? { quality: q, effort: 6, chromaSubsampling: '4:2:0' } : { quality: q, effort: 6, smartSubsample: true }).toBuffer();
    if (b.length <= limit) return [b, q];
  }
  throw new Error('budget');
}
(async () => {
  const log = [];
  for (const [ad, fx] of Object.entries(IMG)) {
    if (SADECE.length && !SADECE.includes(ad)) continue;
    const src = path.join(root, 'public/sagligim', ad + '.jpg');
    const m0 = await sharp(src).metadata();
    const [x0, y0, x1, y1] = KUTU[ad] || [0, 0, 1, 1];
    const kutu = { left: Math.round(x0 * m0.width), top: Math.round(y0 * m0.height), width: Math.round((x1 - x0) * m0.width), height: Math.round((y1 - y0) * m0.height) };
    const kaynak = await sharp(src).extract(kutu).toBuffer();
    const m = { width: kutu.width, height: kutu.height };
    const tone = (p) => { const t = p.modulate({ saturation: 0.78, brightness: 1.03 }); return BULANIK[ad] ? t.blur(BULANIK[ad]) : t; };
    const w = Math.min(1920, m.width);
    const desk = tone(sharp(kaynak).resize({ width: w }));
    // phone: 4:5 crop around the focal x, full height of the box
    const ch = m.height, cw = Math.min(m.width, Math.round(ch * 0.8));
    const left = Math.max(0, Math.min(m.width - cw, Math.round(fx * m.width - cw / 2)));
    const tel = tone(sharp(kaynak).extract({ left, top: 0, width: cw, height: ch }).resize({ width: 900 }));
    for (const [rol, p] of [['masaustu', desk], ['telefon', tel]]) for (const fmt of ['avif', 'webp']) {
      const [b, q] = await enc(p, fmt, BUT[rol][fmt]);
      fs.writeFileSync(path.join(out, `${ad}-${rol}.${fmt}`), b);
      const mm = await sharp(b).metadata();
      log.push(`${ad}-${rol}.${fmt} ${mm.width}x${mm.height} q${q} ${(b.length / 1024).toFixed(1)} kB`);
    }
  }
  console.log(log.join('\n'));
})();
