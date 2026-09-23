/**
 * NOTYA-EYLEM — chapter actions contributed by shipped specialties (docs §4, P3).
 *
 * BRANS-ALAN-SIZMASI: gating is EXPLICIT. `branslar` names the branches that see the action, and
 * nothing leaks by default — a dermatoloji task is not offered to a kardiyolog, and the guard test
 * (core/eylemler/tests/gating.test.ts) walks every branch × every action to prove it.
 *
 * Each one writes into the chapter's own existing table, the one the chapter's UI already reads.
 * The three shipped chapters happen to share one task shape (kod, ad, due, kaynak, durum) — it is
 * still three separate definitions, because a shared row shape is not a shared clinical meaning
 * and a single "görev_ekle" would be exactly the leak this rule exists to prevent.
 *
 * Kept in core/ rather than under specialties/: the type contract lives here, `EylemTanimi` is
 * typed so a malformed contribution fails tsc, and the shipped chapters do not yet have a manifest
 * the shell imports (specialties/<brans>/manifest.ts is documentation today — see its header). Moving
 * these into the chapters is a mechanical follow-up once that wiring exists; the registry already
 * takes contributions as a list.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { semaYap } from './sema'
import type { AlanTanimi, EylemBaglami, EylemTanimi } from './types'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'

const GOREV_ALANLARI: AlanTanimi[] = [
  { anahtar: 'ad', etiket: 'Görev', tip: 'metin', zorunlu: true, aciklama: 'What has to happen, in the doctor\'s words' },
  { anahtar: 'due', etiket: 'Son tarih', tip: 'tarih', aciklama: 'When it is due. Do not guess a date the doctor did not give.' },
  { anahtar: 'kaynak', etiket: 'Kaynak', tip: 'metin', aciklama: 'Short tag for where the task came from' },
]

/** One definition per chapter — same row shape, different table, different branch gate. */
function gorevEylemi(o: {
  anahtar: string
  etiket: string
  aciklama: string
  tablo: string
  branslar: readonly SpecialtyKey[]
  sekme: { etiket: string; yol: (hastaId: string) => string }
}): EylemTanimi {
  const alanlar = GOREV_ALANLARI
  return {
    anahtar: o.anahtar,
    etiket: o.etiket,
    aciklama: o.aciklama,
    alanlar,
    zorunlu: ['ad'],
    kademe: 'T1',
    branslar: o.branslar,
    sema: semaYap(alanlar),
    makullukKontrol: (ctx, v) => (v.due && String(v.due) < ctx.bugunTRT ? `Son tarih geçmişte (${v.due}).` : null),
    mukerrerKontrol: async (ctx: EylemBaglami, v) => {
      const { data } = await (ctx.supabase as SupabaseClient)
        .from(o.tablo)
        .select('id, ad')
        .eq('doctor_id', ctx.doktorId)
        .eq('patient_id', ctx.hasta.id)
        .eq('durum', 'acik')
        .ilike('ad', String(v.ad || ''))
        .limit(1)
      return data?.length ? `"${v.ad}" bu hastada açık görev olarak zaten var.` : null
    },
    calistir: async (ctx, v) => {
      const satir = {
        doctor_id: ctx.doktorId,
        patient_id: ctx.hasta.id,
        // `kod` is NOT NULL on every chapter task table; assistant-prepared rows carry one stable
        // code so they can be told apart from engine-generated protocol tasks later.
        kod: 'ayse_eylem',
        ad: String(v.ad),
        due: v.due ?? null,
        kaynak: v.kaynak ?? 'ayse',
        durum: 'acik',
      }
      const { data, error } = await (ctx.supabase as SupabaseClient).from(o.tablo).insert(satir).select('id').single()
      if (error || !data) throw new Error(error?.message || 'Görev oluşturulamadı.')
      return { hedefTablo: o.tablo, hedefId: String(data.id), once: null, sonra: satir, ilgiliSekme: { etiket: o.sekme.etiket, yol: o.sekme.yol(ctx.hasta.id) } }
    },
    geriAl: async (ctx, k) => {
      await (ctx.supabase as SupabaseClient).from(o.tablo).delete().eq('id', k.hedefId).eq('doctor_id', ctx.doktorId).eq('patient_id', ctx.hasta.id)
    },
  }
}

export const JINE_GOREVI_EKLE = gorevEylemi({
  anahtar: 'jine_gorevi_ekle',
  etiket: 'Jinekoloji görevi',
  aciklama: 'Jinekoloji takip görevi açar (serviks taraması, CYBH kontrolü, RİA kontrolü gibi).',
  tablo: 'jine_gorevleri',
  branslar: ['kadin-hastaliklari-dogum'],
  sekme: { etiket: 'Kadın sağlığı sekmesinde gör', yol: (id) => `/dashboard/doktor/hastalar/${id}?tab=gebelik` },
})

export const DERM_GOREVI_EKLE = gorevEylemi({
  anahtar: 'derm_gorevi_ekle',
  etiket: 'Dermatoloji görevi',
  aciklama: 'Dermatoloji takip görevi açar (lezyon kontrolü, ilaç güvenlik takibi, fototerapi seansı gibi).',
  tablo: 'derm_gorevleri',
  branslar: ['dermatoloji'],
  sekme: { etiket: 'Dermatoloji sekmesinde gör', yol: (id) => `/dashboard/doktor/hastalar/${id}?tab=deri` },
})

export const DAHILIYE_GOREVI_EKLE = gorevEylemi({
  anahtar: 'dahiliye_gorevi_ekle',
  etiket: 'Dahiliye görevi',
  aciklama: 'Dahiliye takip görevi açar (HbA1c kontrolü, KB takibi, lipid kontrolü gibi).',
  tablo: 'dahiliye_gorevleri',
  branslar: ['dahiliye'],
  sekme: { etiket: 'Dahiliye sekmesinde gör', yol: (id) => `/dashboard/doktor/hastalar/${id}?tab=dahiliye` },
})

export const BRANS_EYLEMLERI: EylemTanimi[] = [JINE_GOREVI_EKLE, DERM_GOREVI_EKLE, DAHILIYE_GOREVI_EKLE]
