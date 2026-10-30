/**
 * AU gold depth — per-role care-plan / between-visit-log / care-goals Araçlar.
 *
 * CLASSIFIED BEFORE ADDING: specialty-only. Each tool's `roller` is exactly one role.
 * Dietetics keeps the meal-plan suite (`dieteticsTools.ts` + `portal.beslenme`); it is
 * NOT generated here. Cardiology, psychology and every other role must not see another
 * role's coaching keys.
 *
 * Mechanism mirrors AU-DIETETICS-MEAL-01 field shape (kahvalti/ogle/aksam/atistirmalik +
 * diary + goal ticks) so the shared portal card can render role-specific labels without
 * hard-coding country keys (wall D7). No diagnosis, no dose, no score.
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, gunMu, isaret, isaretliler, metin, sayi, secim, tarih } from '@/lib/ulke/araclar/yardimci'
import { AU_KOCLUK_MODULLERI, AU_KOCLUK_ANAHTARLARI, type AuKoclukModulu } from '../portalBransModulleri'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })
const METIN_AZAMI = 280
const OGUNLER = ['kahvalti', 'ogle', 'aksam', 'atistirmalik', 'diger'] as const
const KIMLER = ['diyetisyen', 'hasta'] as const

const KAYNAK =
  'https://www.safetyandquality.gov.au/ (read 2026-10-30): Australian Commission on Safety and Quality in Health Care — partnering with consumers. Care-plan and between-visit wording the clinician writes. No protocol text is copied; no dose or diagnosis is stored.'

function carePlanTanimi(anahtar: string): AracTanimi {
  return {
    anahtar,
    tur: 'liste',
    alanlar: [
      tarih('plan_tarihi'),
      metin('kahvalti', { enCok: METIN_AZAMI }),
      metin('ogle', { enCok: METIN_AZAMI }),
      metin('aksam', { enCok: METIN_AZAMI }),
      metin('atistirmalik', { enCok: METIN_AZAMI }),
      metin('notlar', { enCok: METIN_AZAMI }),
    ],
    cikti: { sayilar: ['dolu'], bantlar: [], uyarilar: ['plan_bos', 'portal'], tarihler: ['plan_tarihi'] },
    kaynak: `${KAYNAK} Structured care-plan slots. Labels are role-specific on the tile and portal.`,
    hesapla: (g) => {
      if (!gunMu(g.plan_tarihi)) return BOS_SONUC
      const slotlar = ['kahvalti', 'ogle', 'aksam', 'atistirmalik'] as const
      const dolu = slotlar.filter((k) => typeof g[k] === 'string' && String(g[k]).trim()).length
      if (!dolu) {
        return {
          tamam: true,
          sayilar: [{ anahtar: 'dolu', deger: 0, ondalik: 0, enCok: 4 }],
          bant: null,
          uyarilar: ['plan_bos'],
          tarihler: [{ anahtar: 'plan_tarihi', tarih: g.plan_tarihi as string }],
        }
      }
      return {
        tamam: true,
        sayilar: [{ anahtar: 'dolu', deger: dolu, ondalik: 0, enCok: 4 }],
        bant: null,
        uyarilar: ['portal'],
        tarihler: [{ anahtar: 'plan_tarihi', tarih: g.plan_tarihi as string }],
      }
    },
  }
}

function gunlukTanimi(anahtar: string): AracTanimi {
  return {
    anahtar,
    tur: 'liste',
    alanlar: [
      tarih('gun'),
      secim('ogun', OGUNLER),
      metin('aciklama', { istege: false, enCok: METIN_AZAMI }),
      secim('kim', KIMLER),
    ],
    cikti: { sayilar: ['dolu'], bantlar: [], uyarilar: ['portal'], tarihler: ['gun'] },
    kaynak: `${KAYNAK} Short between-visit note. Not a clinical assessment.`,
    hesapla: (g) => {
      if (!gunMu(g.gun)) return BOS_SONUC
      if (typeof g.ogun !== 'string' || !(OGUNLER as readonly string[]).includes(g.ogun)) return BOS_SONUC
      if (typeof g.kim !== 'string' || !(KIMLER as readonly string[]).includes(g.kim)) return BOS_SONUC
      if (typeof g.aciklama !== 'string' || !g.aciklama.trim()) return BOS_SONUC
      return {
        tamam: true,
        sayilar: [{ anahtar: 'dolu', deger: 1, ondalik: 0, enCok: 1 }],
        bant: null,
        uyarilar: ['portal'],
        tarihler: [{ anahtar: 'gun', tarih: g.gun as string }],
      }
    },
  }
}

function hedeflerTanimi(anahtar: string, hedefler: readonly string[]): AracTanimi {
  return {
    anahtar,
    tur: 'liste',
    alanlar: [...hedefler.map(isaret), sayi('aralik', 1, 180, { tam: true, istege: true })],
    cikti: { sayilar: ['isaretli'], bantlar: [], uyarilar: ['hedef_yok'], tarihler: [] },
    kaynak: `${KAYNAK} Person-centred care goals the clinician records with the patient. Ticks only.`,
    hesapla: (g) => {
      const secili = isaretliler(g, hedefler)
      if (!secili.length) {
        return {
          tamam: true,
          sayilar: [{ anahtar: 'isaretli', deger: 0, ondalik: 0, enCok: hedefler.length }],
          bant: null,
          uyarilar: ['hedef_yok'],
          tarihler: [],
        }
      }
      return {
        tamam: true,
        sayilar: [{ anahtar: 'isaretli', deger: secili.length, ondalik: 0, enCok: hedefler.length }],
        bant: null,
        uyarilar: [],
        tarihler: [],
      }
    },
  }
}

export const AU_KOCLUK_TANIMLAR: readonly AracTanimi[] = Object.values(AU_KOCLUK_MODULLERI).flatMap((mod) => [
  carePlanTanimi(mod.planAraci),
  gunlukTanimi(mod.gunlukAraci),
  hedeflerTanimi(mod.hedefAraci, mod.hedefler),
])

export { AU_KOCLUK_ANAHTARLARI }

function paketMetin(mod: AuKoclukModulu, tur: 'plan' | 'gunluk' | 'hedef'): PaketAraci {
  const e = mod.etiket
  if (tur === 'plan') {
    return {
      anahtar: mod.planAraci,
      roller: [mod.rol],
      metin: {
        ad: m(`${e.planBaslik} (keep on file)`),
        aciklama: m(
          `Structured care-plan wording you keep for this ${mod.rol.replace(/-/g, ' ')} patient. The patient can read it on the portal. No diagnosis and no dose.`,
        ),
        alanlar: {
          plan_tarihi: m('Plan date'),
          kahvalti: m(e.kahvalti),
          ogle: m(e.ogle),
          aksam: m(e.aksam),
          atistirmalik: m(e.atistirmalik),
          notlar: m(e.notlar),
        },
        sayilar: { dolu: m('Slots filled') },
        uyarilar: {
          plan_bos: m('No care-plan slot was filled. Add at least one line before relying on this note.'),
          portal: m('Kept for the patient portal coaching tab.'),
        },
        tarihler: { plan_tarihi: m('Plan date') },
        not: m('Patient-facing care plan. Clinical judgement stays with you. Emergency detail is not for the portal — use Triple Zero (000).'),
      },
      lisans: {
        durum: 'serbest',
        hakSahibi: 'Notya',
        kaynak: KAYNAK,
        bildirim: m('Care-plan wording you entered. Not a prescription and not a diagnosis.'),
      },
    }
  }
  if (tur === 'gunluk') {
    return {
      anahtar: mod.gunlukAraci,
      roller: [mod.rol],
      metin: {
        ad: m('Between-visit note (clinic or patient)'),
        aciklama: m(
          'Short dated note for coaching between visits. The patient may add a line from the portal. Not a clinical assessment.',
        ),
        alanlar: {
          gun: m('Date'),
          ogun: m('Note type'),
          aciklama: m('Note'),
          kim: m('Who wrote this'),
        },
        secenekler: {
          ogun: Object.fromEntries(Object.entries(e.ogunAdi).map(([k, v]) => [k, m(v)])),
          kim: {
            diyetisyen: m(e.kimAdi.diyetisyen ?? 'Clinician'),
            hasta: m(e.kimAdi.hasta ?? 'Patient'),
          },
        },
        sayilar: { dolu: m('Notes') },
        uyarilar: { portal: m('Kept for the patient portal coaching tab.') },
        tarihler: { gun: m('Date') },
        not: m('Between-visit coaching note only. Life-threatening emergencies: Triple Zero (000).'),
      },
      lisans: {
        durum: 'serbest',
        hakSahibi: 'Notya',
        kaynak: KAYNAK,
        bildirim: m('Between-visit note wording. Not a diagnosis.'),
      },
    }
  }
  const alanlar: Record<string, ReturnType<typeof m>> = {
    aralik: m('Review interval in days (optional)'),
  }
  for (const k of mod.hedefler) alanlar[k] = m(e.hedefAdi[k] ?? k)
  return {
    anahtar: mod.hedefAraci,
    roller: [mod.rol],
    metin: {
      ad: m('Care goals (ticks)'),
      aciklama: m('Person-centred goals you agree with the patient. Ticks only — no target number is stored as a prescription.'),
      alanlar,
      sayilar: { isaretli: m('Goals ticked') },
      uyarilar: { hedef_yok: m('No goal was ticked. Record at least one agreed goal when you use this note.') },
      not: m('Shared on the patient portal as agreed goals. Not a diagnosis.'),
    },
    lisans: {
      durum: 'serbest',
      hakSahibi: 'Notya',
      kaynak: KAYNAK,
      bildirim: m('Care goals you ticked with the patient. Not a prescription.'),
    },
  }
}

export function auBransKoclukAraclari(): readonly PaketAraci[] {
  const liste: PaketAraci[] = []
  for (const mod of Object.values(AU_KOCLUK_MODULLERI)) {
    liste.push(paketMetin(mod, 'plan'), paketMetin(mod, 'gunluk'), paketMetin(mod, 'hedef'))
  }
  return liste
}
