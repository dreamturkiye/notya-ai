/**
 * AU-GAP-CLOSE-01 / 02 — Australia: client-safe UI copy for letter studio, MBS assist and PMS export roadmap.
 * Drawn only where the pack extension is present. No claim of lodgement, write-back or regulator endorsement.
 */
import type { MbsOneriUzantiMetni, MektupUzantiMetni, PmsEntegrasyonUzanti } from '@/lib/ulke/uzanti/tipler'

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

export const AU_MBS_ONERI: MbsOneriUzantiMetni = {
  baslik: 'MBS suggestions',
  aciklama: 'Possible MBS items that may fit this approved visit — for you to check against MBS Online. Suggest only.',
  oner: 'Suggest items',
  oneriliyor: 'Suggesting…',
  kopyala: 'Copy list',
  kopyalandi: 'Copied.',
  bos: 'No item suggestion fitted this note.',
  yazilamadi: 'Suggestions could not be prepared. Try again.',
  uyari: 'Suggestions only. Notya never lodges a Medicare claim and never decides that a benefit is payable. Check MBS Online before you bill.',
  kaynak: 'Matched where possible against the local MBS item → ACHI stem map (IHACPA). Unknown items without a descriptor are dropped.',
  onayla: 'Confirm selected items for export',
  onaylandi: 'Selected items signed off for export. Still never lodged from Notya.',
  onayBekliyor: 'Tick the items you accept, then confirm — only confirmed rows enter the export pack.',
}

/** Shown under “Upload an existing recording” on the visit screen — telehealth / dictate path. */
export const AU_TELEHEALTH_IPUCU =
  'Telehealth or dictate: upload the call recording, capture the call’s tab/window audio, or paste a transcript (same consent). Notya drafts the note for you to approve — same path as an in-room visit.'

export const AU_PMS_ENTEGRASYON: PmsEntegrasyonUzanti = {
  baslik: 'Practice systems',
  aciklama: 'Export an approved visit as a file you control. Live write-back to Best Practice, Genie or Gentu needs a partner API — credentials can be saved now; nothing is marked Synced until that API is live.',
  exportBaslik: 'Visit export pack',
  exportAciklama: 'Download the approved note (and any letter / MBS suggestions you signed off on the note screen) as JSON. Paste or import under your own control.',
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
      anahtar: 'best-practice',
      ad: 'Best Practice write-back',
      durum: 'partner-api',
      aciklama: 'Save Bp credentials below. Outbox queues an export pack; live write needs the partner API flag. Never shows Synced without an adapter ack.',
    },
    {
      anahtar: 'genie',
      ad: 'Genie sync',
      durum: 'partner-api',
      aciklama: 'Same vault + outbox as Best Practice. Partner API required for a live send.',
    },
    {
      anahtar: 'gentu',
      ad: 'Gentu sync',
      durum: 'yol-haritasi',
      aciklama: 'Vault + outbox ready; specialist write-back adapter still on the roadmap.',
    },
  ],
  uyari: 'Notya does not silently sync notes into another product. Until a partner API acknowledges a send, the honest path is the export pack — or a queued row that stays “prepared”, never “Synced”.',
  baglantiBaslik: 'Partner credentials',
  baglantiAciklama: 'Store a practice-system API key encrypted on this deployment. The browser never sees the secret again. Saving a key does not mean Synced.',
  baglantiKaydet: 'Save credentials',
  baglantiKaydedildi: 'Saved. Status: waiting for partner API — not Synced.',
  baglantiSil: 'Remove',
  kuyrukBaslik: 'Write-back queue',
  kuyrukAciklama: 'Queue an approved visit for Best Practice / Genie / Gentu. Without a live partner adapter the row stays prepared (PARTNER_YOK) — never marked sent.',
  kuyrukEkle: 'Queue this visit',
  kuyrukBekliyor: 'Prepared — partner API not live',
}
