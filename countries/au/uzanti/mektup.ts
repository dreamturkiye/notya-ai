/**
 * AU-GAP-CLOSE-01 / 02 / 03 — Australia: client-safe UI copy for letter studio, care-plan studio, MBS assist and PMS export.
 * Drawn only where the pack extension is present. No claim of lodgement, write-back or regulator endorsement.
 */
import type { BakimPlaniUzantiMetni, MbsOneriUzantiMetni, MektupUzantiMetni, PmsEntegrasyonUzanti } from '@/lib/ulke/uzanti/tipler'

export const AU_MEKTUP: MektupUzantiMetni = {
  baslik: 'Letter studio',
  aciklama: 'Draft a letter from this approved visit. You read and edit every word. Nothing is sent or lodged from here.',
  turler: [
    { tur: 'gp', ad: 'GP letter', aciklama: 'Update for the patient’s usual GP' },
    { tur: 'referral', ad: 'Referral', aciklama: 'Specialist referral draft' },
    { tur: 'patient', ad: 'Patient letter', aciklama: 'Plain-language note the patient could read' },
  ],
  yaz: 'Draft letter',
  yaziliyor: 'Drafting…',
  yenidenYaz: 'Draft again',
  etiket: 'Letter',
  kopyala: 'Copy',
  kopyalandi: 'Copied.',
  indir: 'Download .txt',
  yazdir: 'Print',
  makine: 'Drafted by the model from this approved note only. Edit before you use it.',
  yazilamadi: 'That letter could not be drafted. Try again.',
  onayliDegil: 'Approve the note before a letter can be drafted.',
  bos: 'The letter is empty.',
  uyari: 'A draft only. Notya does not send letters, lodge claims, or write to Best Practice, Genie or Gentu.',
  onayla: 'I have read this letter — include in export',
  onaylandi: 'Signed off for export. You can still edit; sign off again after changes.',
  onayBekliyor: 'Sign off this letter before it can enter the visit export or write-back queue.',
}

export const AU_BAKIM_PLANI: BakimPlaniUzantiMetni = {
  baslik: 'Care-plan studio',
  aciklama: 'Draft a Medicare care-plan document from this approved visit. You edit and sign off every word. Nothing is lodged or sent.',
  turler: [
    { tur: 'gpmp', ad: 'GP Management Plan (GPMP)', aciklama: 'Problems, goals and planned management from this note' },
    { tur: 'tca', ad: 'Team Care Arrangements (TCA)', aciklama: 'Coordinated care with other providers when the note supports it' },
    { tur: 'ccmp', ad: 'Chronic Condition Management Plan', aciklama: 'CCMP-style structure (965/967 family) — structure only' },
    { tur: 'mhcp', ad: 'Mental Health Treatment Plan', aciklama: 'Mental health plan draft from this note' },
  ],
  yaz: 'Draft care plan',
  yaziliyor: 'Drafting…',
  yenidenYaz: 'Draft again',
  etiket: 'Care plan',
  kopyala: 'Copy',
  kopyalandi: 'Copied.',
  indir: 'Download .txt',
  yazdir: 'Print',
  makine: 'Drafted by the model from this approved note only. Edit before you use it. Never lodges.',
  yazilamadi: 'That care plan could not be drafted. Try again.',
  onayliDegil: 'Approve the note before a care plan can be drafted.',
  bos: 'The care plan is empty.',
  uyari: 'A draft document only. Notya does not lodge Medicare claims and does not decide that a care-plan item is payable. Check MBS Online and your practice rules before you bill.',
  onayla: 'I have read this care plan — include in export',
  onaylandi: 'Signed off for export. Edit again and re-sign after changes.',
  onayBekliyor: 'Sign off this care plan before it can enter the visit export or write-back queue.',
  kaynak: 'Structure mirrors common Australian GPMP/TCA/CCMP/MHCP document headings. Item numbers are never asserted as payable. Awaiting named clinician review of prompts (mektupOnay.ts).',
}

export const AU_MBS_ONERI: MbsOneriUzantiMetni = {
  baslik: 'MBS suggestions',
  aciklama: 'Possible MBS items that may fit this approved visit — attendance, telehealth, procedures and care-plan families when the note supports them. Check MBS Online. Suggest only.',
  oner: 'Suggest items',
  oneriliyor: 'Suggesting…',
  kopyala: 'Copy list',
  kopyalandi: 'Copied.',
  bos: 'No item suggestion fitted this note.',
  yazilamadi: 'Suggestions could not be prepared. Try again.',
  uyari: 'Suggestions only. Notya never lodges a Medicare claim and never decides that a benefit is payable. Check MBS Online before you bill.',
  kaynak: 'Matched where possible against the local MBS item → ACHI stem map (IHACPA). Plan-item families may appear as suggestions when the note supports chronic-disease or care-plan work. Unknown items without a descriptor are dropped.',
  onayla: 'Confirm selected items for export',
  onaylandi: 'Selected items signed off for export. Still never lodged from Notya.',
  onayBekliyor: 'Tick the items you accept, then confirm — only confirmed rows enter the export pack.',
}

/** Shown under “Upload an existing recording” on the visit screen — telehealth / dictate path. */
export const AU_TELEHEALTH_IPUCU =
  'Telehealth or dictate: upload the call recording, capture the call’s tab/window audio, or paste a transcript (same consent). Notya drafts the note for you to approve — same path as an in-room visit.'

export const AU_PMS_ENTEGRASYON: PmsEntegrasyonUzanti = {
  baslik: 'Practice systems',
  aciklama: 'Cliniko write-back is live with your clinic API key. Genie/Gentu use Magentus Partner API keys when you have them. Best Practice stays on the partner-network track (back burner). Export pack always works.',
  exportBaslik: 'Visit export pack',
  exportAciklama: 'Download the approved note (and any letter / care plan / MBS suggestions you signed off on the note screen) as JSON. Paste or import under your own control.',
  exportDugme: 'How it works',
  exportIndiriliyor: 'Preparing…',
  kalemler: [
    {
      anahtar: 'export-pack',
      ad: 'Visit export pack (JSON)',
      durum: 'hazir-export',
      aciklama: 'Ready now on each approved note: download a structured pack. No PMS is contacted.',
    },
    {
      anahtar: 'cliniko',
      ad: 'Cliniko write-back',
      durum: 'partner-api',
      aciklama: 'Paste your Cliniko API key (My Info → Manage API keys). Notya validates it and can push an approved visit as a draft treatment note. Never shows Synced without Cliniko’s ack.',
    },
    {
      anahtar: 'gentu',
      ad: 'Gentu (Magentus) write-back',
      durum: 'partner-api',
      aciklama: 'Save Magentus Partner API key + OAuth client credentials. Live send when NOTYA_PMS_GENTU_ETKIN=1 and keys validate.',
    },
    {
      anahtar: 'genie',
      ad: 'Genie (Magentus) write-back',
      durum: 'partner-api',
      aciklama: 'Same Magentus Partner API as Gentu (one FHIR surface for both). Flag: NOTYA_PMS_GENIE_ETKIN=1.',
    },
    {
      anahtar: 'best-practice',
      ad: 'Best Practice write-back',
      durum: 'yol-haritasi',
      aciklama: 'Back burner. Bp Partner Network (NDA + monthly committee) in progress — credentials can still be saved; live HTTP stays PARTNER_YOK until Bp approves.',
    },
  ],
  uyari: 'Notya does not silently sync notes into another product. Cliniko only writes after your API key validates and the adapter receives a 2xx. Magentus/Bp without partner keys stay prepared — never Synced.',
  baglantiBaslik: 'Practice-system credentials',
  baglantiAciklama: 'Store an API key encrypted on this deployment. For Magentus (Genie/Gentu) also add OAuth client id/secret and token/API URLs from the developer portal. The browser never sees the secret again. Saving a key does not mean Synced.',
  baglantiKaydet: 'Save credentials',
  baglantiKaydedildi: 'Saved. Verified keys show as registered; Magentus/Bp without partner access stay pending — not Synced.',
  baglantiSil: 'Remove',
  kuyrukBaslik: 'Write-back queue',
  kuyrukAciklama: 'Queue an approved visit for Cliniko, Gentu, Genie or Best Practice. Cliniko sends live when the key works. Others stay prepared (PARTNER_YOK) until partner flags + keys are live — never marked sent without an ack.',
  kuyrukEkle: 'Queue this visit',
  kuyrukBekliyor: 'Prepared — waiting for partner API or patient match',
}
