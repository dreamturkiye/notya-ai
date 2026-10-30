/**
 * AU gold depth — per-role visit-prep / safety-net checklist (ticks only).
 *
 * CLASSIFIED: specialty-only. Each tool's `roller` is exactly one role.
 * No dose, score, triage scale, or pathway hours. Clinician ticks what was
 * discussed; empty ticks stay a note. Dietetics keeps meal-suite depth separately
 * but still gets a visit-prep key so Muayene motors stay uniform across 44 roles.
 *
 * Source: ACSQHC partnering-with-consumers pattern (same citation family as
 * bransKocluk) — checklist wording is Notya's, not a copied protocol table.
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, gunMu, isaret, isaretliler, tarih } from '@/lib/ulke/araclar/yardimci'
import type { Sunulan } from '../klinik/asistanAdlari'
import { AU_MUAYENE_MOTORLARI } from '../klinik/muayeneMotorlari'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })

const KAYNAK =
  'https://www.safetyandquality.gov.au/ (read 2026-10-30): Australian Commission on Safety and Quality in Health Care — partnering with consumers. Visit-prep ticks the clinician records. No protocol table is copied; no dose or score is stored.'

const MADDELER = ['riza', 'ilac', 'sonuc', 'guvenlik', 'izlem'] as const

type PrepSatiri = {
  anahtar: string
  rol: Sunulan
  ad: string
  aciklama: string
  etiket: Readonly<Record<(typeof MADDELER)[number], string>>
}

function satir(rol: Sunulan, ad: string, hitap: string, etiket: PrepSatiri['etiket']): PrepSatiri {
  return {
    anahtar: `au-${rol}-visit-prep`,
    rol,
    ad,
    aciklama: `Ticks what was covered in today's ${hitap} visit. Empty ticks stay empty — nothing is invented.`,
    etiket,
  }
}

/** One prep checklist per offered AU role (44). Labels are role-specific; keys are shared. */
const SATIRLAR: readonly PrepSatiri[] = (Object.keys(AU_MUAYENE_MOTORLARI) as Sunulan[]).map((rol) => {
  const motor = AU_MUAYENE_MOTORLARI[rol]
  const ortak = {
    riza: 'Consent / purpose of today’s visit confirmed as said',
    ilac: 'Medicines or therapies named today only (as said)',
    sonuc: 'Results or observations to chase as said',
    guvenlik: 'Safety-net / Triple Zero (000) wording if used',
    izlem: 'Follow-up venue and timing as said',
  } as const
  // Light specialty flavour without inventing clinical thresholds.
  if (rol === 'paediatrics' || rol === 'paediatric-surgery') {
    return satir(rol, `${motor.baslik} — visit prep`, 'paediatric', {
      ...ortak,
      riza: 'Parent/guardian history source confirmed if said',
      guvenlik: 'When to return / Triple Zero if said for the child',
    })
  }
  if (rol === 'dietetics') {
    return satir(rol, 'Nutrition visit prep', 'dietetics', {
      ...ortak,
      ilac: 'Supplements or nutrition products named today only',
      sonuc: 'Weight, labs or intake notes to chase as said',
    })
  }
  if (rol === 'emergency-medicine') {
    return satir(rol, 'ED disposition prep', 'emergency', {
      ...ortak,
      guvenlik: 'Disposition safety-net and Triple Zero if used',
      izlem: 'After-care venue and timing as said',
    })
  }
  if (rol === 'clinical-psychology' || rol === 'psychiatry') {
    return satir(rol, `${motor.baslik} — session prep`, 'mental health', {
      ...ortak,
      guvenlik: 'Safety plan / crisis pathway if used — no score stored',
      sonuc: 'Between-session practice or sleep notes as said',
    })
  }
  return satir(rol, `${motor.baslik} — visit prep`, 'clinic', ortak)
})

function tanim(anahtar: string): AracTanimi {
  return {
    anahtar,
    tur: 'liste',
    alanlar: [tarih('gun'), ...MADDELER.map((k) => isaret(k))],
    cikti: { sayilar: ['isaretli'], bantlar: [], uyarilar: ['bos', 'portal'], tarihler: ['gun'] },
    kaynak: KAYNAK,
    hesapla: (g) => {
      if (!gunMu(g.gun)) return BOS_SONUC
      const secili = isaretliler(g, MADDELER)
      if (secili.length === 0) {
        return {
          tamam: true,
          sayilar: [{ anahtar: 'isaretli', deger: 0, ondalik: 0, enCok: MADDELER.length }],
          bant: null,
          uyarilar: ['bos'],
          tarihler: [{ anahtar: 'gun', tarih: String(g.gun) }],
        }
      }
      return {
        tamam: true,
        sayilar: [{ anahtar: 'isaretli', deger: secili.length, ondalik: 0, enCok: MADDELER.length }],
        bant: null,
        uyarilar: ['portal'],
        tarihler: [{ anahtar: 'gun', tarih: String(g.gun) }],
      }
    },
  }
}

export const AU_VISIT_PREP_TANIMLAR: readonly AracTanimi[] = SATIRLAR.map((s) => tanim(s.anahtar))

export function auVisitPrepAraclari(): readonly PaketAraci[] {
  return SATIRLAR.map((s) => ({
    anahtar: s.anahtar,
    roller: [s.rol],
    metin: {
      ad: m(s.ad),
      aciklama: m(s.aciklama),
      alanlar: {
        gun: m('Date of this visit'),
        riza: m(s.etiket.riza),
        ilac: m(s.etiket.ilac),
        sonuc: m(s.etiket.sonuc),
        guvenlik: m(s.etiket.guvenlik),
        izlem: m(s.etiket.izlem),
      },
      sayilar: { isaretli: m('Items ticked') },
      uyarilar: {
        bos: m('No item was ticked. Record what was covered when you use this note.'),
        portal: m('Visit-prep ticks only. Not a diagnosis, dose or triage score.'),
      },
      tarihler: { gun: m('Visit date') },
      not: m('Shared as a visit-prep checklist on the file. Not a protocol.'),
    },
    lisans: {
      durum: 'serbest',
      hakSahibi: 'Notya',
      kaynak: KAYNAK,
      bildirim: m('Visit-prep ticks you recorded. Not a prescription or score.'),
    },
  }))
}

export const AU_VISIT_PREP_ANAHTARLARI: readonly string[] = auVisitPrepAraclari().map((p) => p.anahtar)

/** Map role → visit-prep tool key for motor enrichment. */
export const AU_VISIT_PREP_ROL: Readonly<Record<string, string>> = Object.fromEntries(
  SATIRLAR.map((s) => [s.rol, s.anahtar]),
)
