# Ayşe tool parity — what the model could call before the single brain, and what it can call today

Ledger id: NOTYA-AYSE-ARAC-PARITE (owner Claude). Branch `fix/ayse-arac-pariteti`. Written 2026-10-02.

This is a RESTORE, not a redesign. The search and file functions of 2026-09-14..25 all still exist and work when
called. What changed on 2026-09-25 (PR 432, commit `90270e1c`, NOTYA-TEK-BEYIN) is who may call them.

## 1. The two paths

**Before 2026-09-25 (two brains).**

- Written chat: `app/api/asistan/chat/route.ts` ran the routers (identity, patient resolver, quick card) and then the
  model. The model was offered the write / card tools only (`core/eylemler/araclar.ts`), and only with a resolved
  patient. It never had a read tool. Checked in `git show 90270e1c^:app/api/asistan/chat/route.ts`.
- Voice: a model hosted by ElevenLabs ran a COPY of the prompt (`buildVoiceSystemPrompt`, `lib/asistan/personaEngine.ts`)
  and five browser client tools. The model decided what to look up and sent the doctor's whole sentence to `hasta_bul`.
  The browser called our routes with the doctor's own token and handed the result string back to the model
  (`app/asistan/page.tsx` `clientTools` at `90270e1c^`, today `components/asistan/AsistanOturumContext.tsx`).

**Today (single brain).** `lib/asistan/ayseCevapla.ts` answers both channels. Reads are answered by model-free routers
BEFORE the model (scope gate, calendar, identity, record tables, patient search, quick card). The model was offered
only the write / card tools, and no tool at all on a non-command turn without a resolved patient. A router gap
(a phrasing nobody listed, a visit-bound measurement, parents' names said another way) was a dead end: the model
had no way to look anything up.

## 2. Inventory

Sources read: `scripts/_el-tool-kur.mts` (registration of the client tools), `lib/asistan/sesLlm.ts` (the Custom LLM
endpoint and its tool round trip), `lib/asistan/personaEngine.ts` (prompt rules), `core/eylemler/istem.ts` (the action
paragraph), and the tree before PR 432 (`git show 90270e1c^`).

| Tool | Kind | Parameter schema | Server-side executor | Before 09-25 | Single brain before this branch | Single brain on this branch | Prompt rules that name it |
|---|---|---|---|---|---|---|---|
| `hasta_bul` | read | `{ isim: string }` required `isim` — the doctor's whole sentence | `POST /api/asistan/hasta-bul`: scope gate (`kapsamKarariHastayla`) → `kimlikSorusunuCevapla` → `hastaninSozunuCoz` (name + practice search, `klinikAramaYurut`) → `hastaDosyaPaketiniDerle` → `dosyaSoruCevap` / `kartSoyle` | OFFERED on voice (ElevenLabs client tool, registered 2026-09-13, description widened 09-21 and 09-25). Not offered on written chat. | **MISSING** | **OFFERED** (item 1) | `personaEngine.ts` voice prompt: "Hasta arama: ad hatırlanmasa da hasta_bul çağır. Tam cümleyi isim olarak gönder …", "Kimlik / iletişim sorusu … için de hasta_bul çağır", "Bir ayrıntıyı bilmiyorsan … hasta_bul aracını kullan". Branch locks: `specialties/kadin-dogum/prompts/index.ts` and `specialties/dermatoloji/prompts/index.ts` `ARAC_NOTU` ("uygulamanın genel araçları (ör. hasta_bul) geçerliliğini korur") |
| `randevu_takvim` | read | `{ tarih: string (YYYY-MM-DD), saat?: string (HH:MM), sure_dk?: string }` required `tarih` | `POST /api/asistan/ses-eylem` `adim: 'takvim'`: `doktorunGununuOku` → `gunlukOzetMetni` | OFFERED on voice (registered 2026-09-20) | **MISSING** — `lib/randevu/takvimSorusu.ts` says so itself: "tek-beyin has no randevu_takvim client tool". Calendar reads exist only as the model-free router `takvimSorusuCoz`. | **OFFERED** (item 1) | `personaEngine.ts` voice prompt: "RANDEVU SAATİ: … takvimi oku (ses: randevu_takvim ya da sunucu gün listesi)". Before 09-29 `core/eylemler/istem.ts` rule 8 named it too; today rule 8 says "takvim cevabı sistemden gelir". |
| `dosyaya_kayit_hazirla` | write (draft card) | `{ eylem: string, hasta: string, alanlar?: string (JSON) }` required `eylem`, `hasta` | `POST /api/asistan/ses-eylem` `adim: 'hazirla'`: `hastaninSozunuCoz` → `oneriHazirla` (taslak only) | OFFERED on voice | REPLACED, not missing: the single brain offers one tool per action under the action's own key (`asi_kaydi_ekle`, `ilac_ekle`, `alerji_ekle`, `olcum_ekle`, `kontrol_randevusu_olustur`, `randevu_tasi`, `randevu_iptal`, … — `core/eylemler/araclar.ts`, slice S3). Same executor (`oneriHazirla` through `toolUseOnerileri`). | unchanged | `personaEngine.ts` voice prompt: "DOSYAYA KAYIT (ses …) … dosyaya_kayit_hazirla çağır", "KARTI GÜNCELLE …" |
| `eylem_onayla` | write (commit) | `{ onayMetni: string }` required `onayMetni` | `POST /api/asistan/ses-eylem` `adim: 'onayla'`: `eylemOnayla` | OFFERED on voice | NOT A MODEL TOOL by design: a spoken "Evet / Onaylıyorum" is not a model turn. `lib/asistan/sesliOnay.ts` (`sesliKarariUygula`) runs before the brain on both voice routes; the model cannot commit (`core/eylemler/tests/sessizYol.test.ts`). | unchanged | `personaEngine.ts` voice prompt: "Akış: … (2) Doktor Evet / Onaylıyorum / Kaydet / Tamam → eylem_onayla" |
| `eylem_vazgec` | write (withdraw) | `{}` | `POST /api/asistan/ses-eylem` `adim: 'vazgec'`: `eylemVazgec` | OFFERED on voice | NOT A MODEL TOOL by design, same as above (`sesliOnay.ts`). | unchanged | `personaEngine.ts` voice prompt: "(3) Hayır / vazgeç / iptal → eylem_vazgec" |
| `end_call` | ElevenLabs system tool | `{ reason }` | none (ElevenLabs closes the call) | OFFERED by ElevenLabs | Emitted by `lib/asistan/sesLlm.ts` itself on a goodbye sentence; never a model decision. Not used on the Fish route (`asistaniKapatMi`). | unchanged | none |
| Action tools (`asi_kaydi_ekle`, `ilac_ekle`, `ilac_sonlandir`, `ilac_doz_degistir`, `alerji_ekle`, `olcum_ekle`, `kronik_hastalik_ekle`, `dosya_notu_ekle`, `hasta_bilgisi_duzelt`, `kontrol_randevusu_olustur`, `randevu_tasi`, `randevu_iptal`, chapter actions) | write (draft card) | per action, `core/eylemler/sema.ts` | `toolUseOnerileri` → `oneriHazirla` | OFFERED on written chat with a resolved patient | OFFERED (resolved patient; or a command with no patient, with `hasta_adi`) | unchanged | `core/eylemler/istem.ts` rules 1–12 name `kontrol_randevusu_olustur`, `randevu_tasi`, `randevu_iptal` |

`app/api/asistan/ses-ekran` is not a model tool: the page polls it for the screen form of a voice turn (full answer,
cards, identity values rebuilt on the server).

## 3. What the audit brief got right and what it did not

- Right: the two read tools are gone from the single brain, the routers became gatekeepers, and every router gap ended
  in "bilemedim" or in the model being told to ask for a name.
- Not exact: the rules that tell the model to call `hasta_bul` (`personaEngine.ts`, the lines around 280 to 294) are in
  `buildVoiceSystemPrompt`. That prompt is sent only to an ElevenLabs-hosted model (`AsistanOturumContext.tsx`), which
  on that path still has its client tools. The single brain builds its prompt from `buildSystemPromptParcalari` plus
  tail blocks, and that prompt did NOT tell the model to call `hasta_bul` — with one exception: the Kadın Hastalıkları
  ve Doğum and Dermatoloji branch locks mention `hasta_bul` as a tool that "stays valid", and it was not offered.
  So in the single brain the defect was mostly a missing capability, and only for those two branches a prompt that
  named a tool the model did not have.
- Consequence for this branch: restoring the tools is not enough; the single-brain prompt must also say they exist.
  The rule text is taken from `personaEngine.ts` (one exported block, used by the voice prompt and by the single
  brain's tail), so the two cannot drift.

## 4. What this branch restores (items 1 and 2)

- `lib/asistan/okumaAraclari.ts`: the two read tools with the SAME names and parameter schemas as
  `scripts/_el-tool-kur.mts`, executed in process by the existing functions, scoped to the authenticated doctor.
- `lib/asistan/ayseCevapla.ts`: a server-side tool round trip (model call → read tools → tool result → final answer),
  at most 2 round trips, each tool call under a timeout, added time logged.
- The routers stay as the fast path. When none of them answers and the turn is not a command, the model is offered the
  read tools, with or without an open chart.
- Write tools are untouched: same list, same forcing, same card path. A command turn is not offered the read tools.

Reuse and new code are listed in the ledger entry (`docs/OPEN-COMMITMENTS.md`, NOTYA-AYSE-ARAC-PARITE).
