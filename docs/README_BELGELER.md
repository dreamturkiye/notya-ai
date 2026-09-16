# README_BELGELER — engine weights, licenses, exports, golden sets

Rule (Kaan 2026-09-15): an engine is registered in `motor_kayit` with `aktif=true` only when every column below is filled. No engine ships on a spec sheet. Non-commercial weights never ship (eval harness only).

| motor | tier | source | license (text link) | weights sha256 | ONNX export cmd | golden set + AUROC | model_url | aktif |
|---|---|---|---|---|---|---|---|---|
| claude-vision | A | Anthropic API (claude-sonnet-4-6) | Anthropic API terms | — | — | field only (docs/MOTOR-UYUMLULUK.md) | — | ✅ 2026-09-15 |
| txrv-densenet121 | B | github.com/mlmed/torchxrayvision (`densenet121-res224-all`) | Apache-2.0 | _pending_ | `python scripts/belgeler/export_txrv.py` (to write) → `txrv-densenet121-all.onnx` | CheXpert val, per-code AUROC _pending_ | Supabase Storage `motorlar/` _pending_ | ❌ |
| ptbxl-inception1d | B | github.com/helme/ecg_ptbxl_benchmarking | data CC-BY 4.0; code check | _pending_ | _pending_ | PTB-XL test | _pending_ | ❌ |
| hear-icbhi | B | google/hear-pytorch (HAI-DEF, gated) + our linear probe on ICBHI 2017 | HAI-DEF terms | _pending_ | _pending_ | ICBHI test | _pending_ | ❌ |
| hear-circor | B | google/hear-pytorch + our probe on CirCor 2022 | HAI-DEF terms | _pending_ | _pending_ | CirCor val | _pending_ | ❌ |
| grazpedwri-yolo | B | own YOLO head on GRAZPEDWRI-DX (CC BY 4.0 data) | CC BY 4.0 data; our weights | _pending_ | _pending_ | GRAZPEDWRI val | _pending_ | ❌ |
| rsna-boneage | B | RSNA Pediatric Bone Age (dataset open; weights source to pick) | verify | _pending_ | _pending_ | RSNA val | _pending_ | ❌ |
| fracatlas-yolo | B | own YOLO head on FracAtlas (CC BY 4.0 data) | CC BY 4.0 data; our weights | _pending_ | _pending_ | FracAtlas val | _pending_ | ❌ |

Blocked for commercial use (eval harness only): RETFound (CC BY-NC 4.0), UNI / CONCH (CC BY-NC-ND), HAM10000-trained heads (CC BY-NC-SA data), EchoNet-Dynamic (non-commercial data use agreement — write to Stanford), MURA-derived weights (research-only dataset — grey, treat as blocked).

## How a Tier B engine ships

1. Export to ONNX (opset 17), test in `onnxruntime-web` with WebGPU and WASM; record input/output tensor names and preprocessing (size, normalization) in the engine module under `core/belgeler/motorlar/<motor>.ts`.
2. Write `labelmap.json` (engine label → `bulgu_kodu`) — fusion only sees ontology codes.
3. Run the golden set; store per-code AUROC in `motor_kayit.dogrulama_auroc`.
4. Upload the ONNX to Supabase Storage bucket `motorlar/` (public, immutable filename with sha256), set `model_url`, `weights_sha256`.
5. Register with `motorKaydet(...)` in the module and import it from the belge page; set `aktif=true`.
6. Field rule: first 20 real drafts reviewed by a doctor → row in `docs/MOTOR-UYUMLULUK.md`.
