# README_BELGELER — engine weights, licenses, exports, golden sets

Rule (Kaan 2026-09-15): an engine is registered in `motor_kayit` with `aktif=true` only when every column below is filled. No engine ships on a spec sheet. Non-commercial weights never ship (eval harness only).

| motor | tier | source | license (text link) | weights sha256 | ONNX export cmd | golden set + AUROC | model_url | aktif |
|---|---|---|---|---|---|---|---|---|
| claude-vision | A | Anthropic API (claude-sonnet-4-6) | Anthropic API terms | — | — | field only (docs/MOTOR-UYUMLULUK.md) | — | ✅ 2026-09-15 |
| txrv-densenet121 | B | github.com/mlmed/torchxrayvision `densenet121-res224-all` (xrv 1.5.4) | Apache-2.0 | `6bb26f6b3246417b208ee0dbf9c3c4b6ea7ec7d70f441dfe41cd0e2023d2186c` (28.2 MB) | `/tmp/txrv-venv/bin/python scripts/belgeler/export_txrv.py /tmp/txrv-out` (static-shape wrapper: features→classifier→sigmoid→op_norm; parity vs stock forward 0.0, ONNX vs torch 1.3e-5) then `node scripts/belgeler/upload_txrv.cjs` | **published** AUROCs (Cohen et al. 2022, MIA) — own CheXpert-val eval PENDING | Supabase Storage `motorlar/undefined` | ✅ 2026-09-15 (dogrulama_seti marks own eval pending) |
| ptbxl-inception1d | B | github.com/helme/ecg_ptbxl_benchmarking | data CC-BY 4.0; code check | _pending_ | _pending_ | PTB-XL test | _pending_ | ❌ |
| hear-icbhi | B | google/hear-pytorch (HAI-DEF, gated) + our linear probe on ICBHI 2017 | HAI-DEF terms | _pending_ | _pending_ | ICBHI test | _pending_ | ❌ |
| hear-circor | B | google/hear-pytorch + our probe on CirCor 2022 | HAI-DEF terms | _pending_ | _pending_ | CirCor val | _pending_ | ❌ |
| grazpedwri-yolo | B | own YOLO head on GRAZPEDWRI-DX (CC BY 4.0 data) | CC BY 4.0 data; our weights | _pending_ | _pending_ | GRAZPEDWRI val | _pending_ | ❌ |
| rsna-boneage | B | RSNA Pediatric Bone Age (dataset open; weights source to pick) | verify | _pending_ | _pending_ | RSNA val | _pending_ | ❌ |
| fracatlas-yolo | B | own YOLO head on FracAtlas (CC BY 4.0 data) | CC BY 4.0 data; our weights | _pending_ | _pending_ | FracAtlas val | _pending_ | ❌ |

Blocked for commercial use (eval harness only): RETFound (CC BY-NC 4.0), UNI / CONCH (CC BY-NC-ND), HAM10000-trained heads (CC BY-NC-SA data), EchoNet-Dynamic (non-commercial data use agreement — write to Stanford), MURA-derived weights (research-only dataset — grey, treat as blocked).

## Runtime

onnxruntime-web 1.30.0 is NOT bundled by Next (Terser cannot parse its ESM). The web build lives in `public/ort/` (`ort.webgpu.min.mjs` + `ort-wasm-simd-threaded*.{wasm,mjs}`, copied from `node_modules/onnxruntime-web/dist` at that version) and is loaded at runtime by `core/belgeler/tarayiciMotor.ts` (`ortYukle()`, webpack-ignored import). WebGPU when `navigator.gpu` exists, else single-thread WASM (no cross-origin isolation headers). Model files are fetched from the public `motorlar` bucket (immutable sha-named, cache-control 1y) and cached by `sw.js`.

## How a Tier B engine ships

1. Export to ONNX (opset 17), test in `onnxruntime-web` with WebGPU and WASM; record input/output tensor names and preprocessing (size, normalization) in the engine module under `core/belgeler/motorlar/<motor>.ts`.
2. Write `labelmap.json` (engine label → `bulgu_kodu`) — fusion only sees ontology codes.
3. Run the golden set; store per-code AUROC in `motor_kayit.dogrulama_auroc`.
4. Upload the ONNX to Supabase Storage bucket `motorlar/` (public, immutable filename with sha256), set `model_url`, `weights_sha256`.
5. Register with `motorKaydet(...)` in the module and import it from the belge page; set `aktif=true`.
6. Field rule: first 20 real drafts reviewed by a doctor → row in `docs/MOTOR-UYUMLULUK.md`.
