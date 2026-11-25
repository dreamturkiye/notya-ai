# Sağlığım görselleri — kaynak (SAGLIGIM-GORUNUM-V3, 2026-11-25)

All images in this folder were **drawn by us** (hand-written SVG, Claude for Notya) — no stock photo, no generated
photo, no third-party asset, no people or faces, no brands or logos, no text, no medical-device look-alikes.

Kaan's mood reference (a stock flat-lay: fruit in a heart-shaped bowl, a blood-pressure monitor, stethoscope, dumbbells,
measuring tape on soft blue) was used only for mood. He asked explicitly not to copy it ("Aynısı gibi yapma ama"), so
the composition is different on purpose: a side view of a windowsill at sunrise instead of a top-down flat-lay; no
medical devices; cream / sage / pine instead of blue.

Image generation was tried first (Canva generate-image, 2026-11-25) and refused with "You have exceeded your credit
quota", so this hand-drawn fallback is what ships. Prompt sent: "Our OWN original imagery … Modern health & wellness
mood: fresh, calm, optimistic, premium … in harmony with Notya cream/pine. A soft flat-lay-style wellness composition.
No people/faces, no real brands or logos, no text in images, no medical-device brand look-alikes."

| File | What | How it was made |
|------|------|-----------------|
| `sabah-kaynak.svg` | Master drawing (720×480): sunrise whose sun wears the Bugün day rings (honey / teal / pine arcs), sage hills, a cream windowsill with herbal tea, a pine-glazed bowl (pear, fig, clementine), a carafe of water with lemon and mint, a ceramic vase with eucalyptus, a rosemary sprig. Left and right edges fade to transparent so the band colour shows through. | Written by hand as SVG |
| `sabah-{480,960,1440}.avif` / `.webp` | The hero band art (alpha), three widths | `rsvg-convert -w <w>` → Pillow (AVIF q60, WebP q78 m6) |
| `doku.svg` | Faint page texture (day rings + a eucalyptus sprig, line art) | Written by hand, 0.9 kB |
| `fide.svg` | Empty-state spot (a seedling under the day ring) | Written by hand, 0.6 kB |

To change the art: edit `sabah-kaynak.svg`, re-export the six rasters with the same commands, keep the 3:2 ratio (the
band reserves its height in CSS; `SaglikKahramani.tsx` declares 720×480).
