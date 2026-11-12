/**
 * GERI-CAGIRMA-01 — the loaders behind ./nedenler.ts. SERVER ONLY.
 *
 * Each entry imports the branş's EXISTING kohort reader (the same function its kohort panel's API calls) and the
 * engine's own flag labels. Dynamic imports: a request loads one branş's engine, never all thirty.
 * The reader already scopes every query by the doctor (hasta-izolasyon) and decrypts names for that doctor only.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export type KohortSatiri = { patientId: string; ad: string; bayraklar: string[]; sonVizit?: string | null; enErkenTarih?: string | null }
type Okuyucu = (sb: any, doktorId: string, bugun: string, sadece?: string[]) => Promise<{ satirlar: KohortSatiri[] }>
export type KohortYukleyici = () => Promise<{ veri: Okuyucu; etiket: Record<string, string> }>

const y = <M, E>(m: () => Promise<M>, e: () => Promise<E>, sec: (m: M, e: E) => { veri: unknown; etiket: Record<string, string> }): KohortYukleyici =>
  async () => {
    const [mm, ee] = await Promise.all([m(), e()])
    const s = sec(mm, ee)
    return { veri: s.veri as Okuyucu, etiket: s.etiket }
  }

export const KOHORT_YUKLEYICILERI: Record<string, KohortYukleyici> = {
  'acil-tip': y(() => import('@/app/api/doktor/acil-tip/_kohort'), () => import('@/specialties/acil-tip/engines/kohort'), (m, e) => ({ veri: m.atKohortVerisi, etiket: e.AT_BAYRAK_AD })),
  'aile-hekimligi': y(() => import('@/app/api/doktor/aile-hekimligi/_kohort'), () => import('@/specialties/aile-hekimligi/engines/kohort'), (m, e) => ({ veri: m.aileKohortVerisi, etiket: e.AILE_BAYRAK_AD })),
  anestezi: y(() => import('@/app/api/doktor/anestezi/_kohort'), () => import('@/specialties/anestezi/engines/kohort'), (m, e) => ({ veri: m.anesteziKohortVerisi, etiket: e.ANESTEZI_BAYRAK_AD })),
  'beyin-cerrahisi': y(() => import('@/app/api/doktor/beyin-cerrahisi/_kohort'), () => import('@/specialties/beyin-cerrahisi/engines/kohort'), (m, e) => ({ veri: m.bcKohortVerisi, etiket: e.BC_BAYRAK_AD })),
  'cocuk-cerrahisi': y(() => import('@/app/api/doktor/cocuk-cerrahisi/_kohort'), () => import('@/specialties/cocuk-cerrahisi/engines/kohort'), (m, e) => ({ veri: m.ccKohortVerisi, etiket: e.CC_BAYRAK_AD })),
  dahiliye: y(() => import('@/app/api/doktor/dahiliye/_kohort'), () => import('@/specialties/dahiliye/engines/kohort'), (m, e) => ({ veri: m.kohortVerisi, etiket: e.BAYRAK_AD })),
  dermatoloji: y(() => import('@/app/api/doktor/dermatoloji/_kohort'), () => import('@/specialties/dermatoloji/engines/kohort'), (m, e) => ({ veri: m.dermKohortVerisi, etiket: e.DERM_BAYRAK_AD })),
  endokrinoloji: y(() => import('@/app/api/doktor/endokrinoloji/_kohort'), () => import('@/specialties/endokrinoloji/engines/kohort'), (m, e) => ({ veri: m.endoKohortVerisi, etiket: e.ENDO_BAYRAK_AD })),
  'enfeksiyon-hastaliklari': y(() => import('@/app/api/doktor/enfeksiyon-hastaliklari/_kohort'), () => import('@/specialties/enfeksiyon-hastaliklari/engines/kohort'), (m, e) => ({ veri: m.enfKohortVerisi, etiket: e.ENF_BAYRAK_AD })),
  'fizik-tedavi': y(() => import('@/app/api/doktor/fizik-tedavi/_kohort'), () => import('@/specialties/fizik-tedavi/engines/kohort'), (m, e) => ({ veri: m.ftrKohortVerisi, etiket: e.FTR_BAYRAK_AD })),
  gastroenteroloji: y(() => import('@/app/api/doktor/gastroenteroloji/_kohort'), () => import('@/specialties/gastroenteroloji/engines/kohort'), (m, e) => ({ veri: m.gastroKohortVerisi, etiket: e.GASTRO_BAYRAK_AD })),
  'kadin-hastaliklari-dogum': y(() => import('@/app/api/doktor/gebelik/_kohort'), () => import('@/specialties/kadin-dogum/engines/kd-kohort'), (m, e) => ({ veri: m.kdKohortVerisi, etiket: e.KD_BAYRAK_AD })),
  'genel-cerrahi': y(() => import('@/app/api/doktor/genel-cerrahi/_kohort'), () => import('@/specialties/genel-cerrahi/engines/kohort'), (m, e) => ({ veri: m.gcKohortVerisi, etiket: e.GC_BAYRAK_AD })),
  'gogus-cerrahisi': y(() => import('@/app/api/doktor/gogus-cerrahisi/_kohort'), () => import('@/specialties/gogus-cerrahisi/engines/kohort'), (m, e) => ({ veri: m.gcKohortVerisi, etiket: e.GC_BAYRAK_AD })),
  'gogus-hastaliklari': y(() => import('@/app/api/doktor/gogus-hastaliklari/_kohort'), () => import('@/specialties/gogus-hastaliklari/engines/kohort'), (m, e) => ({ veri: m.gogusKohortVerisi, etiket: e.GOGUS_BAYRAK_AD })),
  'goz-hastaliklari': y(() => import('@/app/api/doktor/goz/_kohort'), () => import('@/specialties/goz-hastaliklari/engines/kohort'), (m, e) => ({ veri: m.gozKohortVerisi, etiket: e.GOZ_BAYRAK_AD })),
  'kalp-damar-cerrahisi': y(() => import('@/app/api/doktor/kalp-damar-cerrahisi/_kohort'), () => import('@/specialties/kalp-damar-cerrahisi/engines/kohort'), (m, e) => ({ veri: m.kdcKohortVerisi, etiket: e.KDC_BAYRAK_AD })),
  kardiyoloji: y(() => import('@/app/api/doktor/kardiyoloji/_kohort'), () => import('@/specialties/kardiyoloji/engines/kohort'), (m, e) => ({ veri: m.kardioKohortVerisi, etiket: e.KARDIO_BAYRAK_AD })),
  'kulak-burun-bogaz': y(() => import('@/app/api/doktor/kulak-burun-bogaz/_kohort'), () => import('@/specialties/kulak-burun-bogaz/engines/kohort'), (m, e) => ({ veri: m.kbbKohortVerisi, etiket: e.KBB_BAYRAK_AD })),
  nefroloji: y(() => import('@/app/api/doktor/nefroloji/_kohort'), () => import('@/specialties/nefroloji/engines/kohort'), (m, e) => ({ veri: m.nefKohortVerisi, etiket: e.NEF_BAYRAK_AD })),
  noroloji: y(() => import('@/app/api/doktor/noroloji/_kohort'), () => import('@/specialties/noroloji/engines/kohort'), (m, e) => ({ veri: m.noroKohortVerisi, etiket: e.NORO_BAYRAK_AD })),
  onkoloji: y(() => import('@/app/api/doktor/onkoloji/_kohort'), () => import('@/specialties/onkoloji/engines/kohort'), (m, e) => ({ veri: m.onkoKohortVerisi, etiket: e.ONKO_BAYRAK_AD })),
  ortopedi: y(() => import('@/app/api/doktor/ortopedi/_kohort'), () => import('@/specialties/ortopedi/engines/kohort'), (m, e) => ({ veri: m.ortoKohortVerisi, etiket: e.ORTO_BAYRAK_AD })),
  pediatri: y(() => import('@/app/api/doktor/pediatri/_kohort'), () => import('@/specialties/pediatri/engines/kohort'), (m, e) => ({ veri: m.pediKohortVerisi, etiket: e.PEDI_BAYRAK_AD })),
  'plastik-cerrahi': y(() => import('@/app/api/doktor/plastik-cerrahi/_kohort'), () => import('@/specialties/plastik-cerrahi/engines/kohort'), (m, e) => ({ veri: m.plastikKohortVerisi, etiket: e.PLASTIK_BAYRAK_AD })),
  psikiyatri: y(() => import('@/app/api/doktor/psikiyatri/_kohort'), () => import('@/specialties/psikiyatri/engines/kohort'), (m, e) => ({ veri: m.psikKohortVerisi, etiket: e.PSIK_BAYRAK_AD })),
  radyoloji: y(() => import('@/app/api/doktor/radyoloji/_kohort'), () => import('@/specialties/radyoloji/engines/kohort'), (m, e) => ({ veri: m.radyoKohortVerisi, etiket: e.RADYO_BAYRAK_AD })),
  romatoloji: y(() => import('@/app/api/doktor/romatoloji/_kohort'), () => import('@/specialties/romatoloji/engines/kohort'), (m, e) => ({ veri: m.romaKohortVerisi, etiket: e.ROMA_BAYRAK_AD })),
  'spor-hekimligi': y(() => import('@/app/api/doktor/spor-hekimligi/_kohort'), () => import('@/specialties/spor-hekimligi/engines/kohort'), (m, e) => ({ veri: m.sporKohortVerisi, etiket: e.SPOR_BAYRAK_AD })),
  uroloji: y(() => import('@/app/api/doktor/uroloji/_kohort'), () => import('@/specialties/uroloji/engines/kohort'), (m, e) => ({ veri: m.uroKohortVerisi, etiket: e.URO_BAYRAK_AD })),
}

export type OkuyucuTipi = Okuyucu
export type Sb = SupabaseClient
