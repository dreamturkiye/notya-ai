/**
 * Shared English UI copy for letter studio + honest visit export (non-AU packs).
 * No MBS, no Best Practice / Genie / Gentu claims. Country packs may override labels.
 */
import type { MektupUzantiMetni, PmsEntegrasyonUzanti } from '@/lib/ulke/uzanti/tipler'

export function enMektupUzanti(yerel: {
  sevkAd: string
  sevkAciklama: string
}): MektupUzantiMetni {
  return {
    baslik: 'Letter studio',
    aciklama: 'Draft a letter from this approved visit. You read and edit every word. Nothing is sent or lodged from here.',
    turler: [
      { tur: 'gp', ad: yerel.sevkAd, aciklama: yerel.sevkAciklama },
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
    uyari: 'A draft only. Notya does not send letters or write silently to another practice system from here.',
    onayla: 'I have read this letter — include in export',
    onaylandi: 'Signed off for export. You can still edit; sign off again after changes.',
    onayBekliyor: 'Sign off this letter before it can enter the visit export pack.',
  }
}

/** Honest export pack only — no AU PMS vendor names in non-AU builds. */
export function enExportUzanti(): PmsEntegrasyonUzanti {
  return {
    baslik: 'Visit export',
    aciklama: 'Download an approved visit as a file you control. Notya does not silently sync notes into another product from this screen.',
    exportBaslik: 'Visit export pack',
    exportAciklama: 'Download the approved note (and any letter you signed off on the note screen) as JSON.',
    exportDugme: 'How it works',
    exportIndiriliyor: 'Preparing…',
    kalemler: [
      {
        anahtar: 'export-pack',
        ad: 'Visit export pack (JSON)',
        durum: 'hazir-export',
        aciklama: 'Ready on each approved note. No external practice system is contacted.',
      },
    ],
    uyari: 'Export only. Paste or import under your own control. Nothing is marked Synced.',
  }
}
