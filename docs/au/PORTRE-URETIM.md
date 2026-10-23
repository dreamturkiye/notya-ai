# AU persona portraits - generation (AU-PORTRE-02)
1. Prerequisites: Node 22+, a checkout of `release/au`, `npm i --no-save sharp`, and your WaveSpeed key in the environment as `WAVESPEED_API_KEY` (never commit it, never paste it into chat).
2. Preview without network or key: `node scripts/au-portreler-wavespeed.mjs --dry-run` (prints the 44 request bodies; add `--only cardiology` for one).
3. Try one first: `WAVESPEED_API_KEY=... node scripts/au-portreler-wavespeed.mjs --only paediatrics`, then look at `portre-ham/paediatrics.png`.
4. Run all: `WAVESPEED_API_KEY=... node scripts/au-portreler-wavespeed.mjs` (the script re-launches itself through `npx tsx` to read the TypeScript manifest).
5. Cost: one image per persona = 44 images (fewer on a resume); check the per-image price of the model on your WaveSpeed dashboard. Default model `bytedance/seedream-v4.5` at 2048*2048, overridable with `--model <id>` and `--size <w*h>`.
6. Resume-safe: finished slugs (file in `portre-ham/` or a valid WebP in `public/portreler/au/`) are skipped; re-run the same command after a failure; `--force` redoes them.
7. Output: raw PNGs in `portre-ham/` (do not commit), WebP 1024x1024 <=120 KB in `public/portreler/au/`, and `AU_PORTRE_URETILDI` in `countries/au/klinik/portreler.ts` is updated by the script (sorted, idempotent).
8. Commit and push: `git add public/portreler/au countries/au/klinik/portreler.ts && git commit -m "feat(au): persona portraits" && git push origin HEAD:release/au`.
9. Verify: `npx tsx --test countries/au/klinik/portreler.test.ts` (listed files exist and are within budget), `npx tsx scripts/au-portreler-uret.mjs --durum` (expects 44/44), then open `/asistan` on the AU deployment and check the faces.
10. Faces are AI-generated fictional people; discard and re-run `--only <slug> --force` for any result that looks like a real, recognisable person or has artefacts (extra fingers, text, logos).
11. Unit tests of the request builder, poller and list updater (mocked fetch, no network): `npm run test:portre`.
12. The key is read only from the environment and is never printed; error messages carry no URLs or headers.
