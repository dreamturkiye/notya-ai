/**
 * SAGLIGIM-PORTAL-REGISTRY (Kaan 2026-09-17) — which specialty modules attach to one Sağlığım token.
 *
 * One shell, many chapters: core (mesajlar/ziyaretler/sonuçlar/ilaçlar/öykü/takip vitals) is always
 * loaded; everything else is declared on the chapter profile (`SpecialtyProfile.portal`) and attached
 * only when its eligibility fires for (doctor specialty of the token × patient records × age).
 *
 * Rules (.cursor/skills/specialty-hasta-portali/SKILL.md):
 *  - The token doctor's own chapter module is the primary module (doctor_specialty).
 *  - Gebeliğim follows a truly active pregnancy record for any practice (mixed care).
 *  - Cross-chapter "chart data" modules (büyüme age rule, jine reminders) fire only for a doctor whose
 *    branch has no portal module of its own — a göz / derm / dahiliye / KD doctor never gets pediatri
 *    growth curves, and only a KD doctor gets Pap/HPV as a default card. Same for the dahiliye ön anket
 *    (dahiliye doctor, or a baseline-branch doctor whose patient has dahiliye cards).
 * ASI-KARNESI-01: "Aşı Karnesi" EVRENSEL modüldür — branş kapısı yok; hastanın (bu token'ın doktoruna ait) aşı kaydı varsa
 * açılır. Aşı kaydı pediatri dışında da tutulur (yetişkin aşıları; `kategori` ayırır). Nav'ı hiçbir chapter profilinde
 * değil, burada (ASI_KARNESI_NAV) tanımlıdır.
 * KONSULTASYON-01: "Yönlendirmeleriniz" bir chapter modülü DEĞİLDİR — her branşın hastasına aynı, çekirdek omurgadır
 * (PortalBundle.yonlendirmeler, Ziyaretler sayfası). Bu çözücüye bilerek eklenmedi; branş kapısı yok.
 * Pure + client-safe (no fs, no Supabase).
 */
import { specialtyProfile } from '@/lib/specialties/registry'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import type { PortalModulId, PortalModulu, PortalNavOge } from '@/lib/specialties/profile'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'

/**
 * users.specialty is free text in older accounts ("İç Hastalıkları", "Göz Hastalıkları Uzmanı") and 'kadin-dogum' on
 * live KD profiles. Resolution is the single bransAnahtari(); an unknown value is passed through (lower-cased).
 */
export function portalBransAnahtari(ham: string | null | undefined): SpecialtyKey | null {
  const b = String(ham || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return null
  return bransAnahtari(b) ?? (b as SpecialtyKey)
}

export interface PortalUygunlukGirdisi {
  doktorBransi: string | null | undefined
  /** patient age in years (fractional), null when DOB unknown */
  hastaYasYil: number | null
  gebelikAktif: boolean
  /** kadin_sagligi / kontrasepsiyon row exists (KD chart data) */
  kdKaydi: boolean
  /** at least one kilo/boy/baş çevresi point on an approved note */
  buyumeOlcumu: boolean
  /** at least one dahiliye card (HT/DM/lipid/…) on the patient */
  dahiliyeKaydi: boolean
  /** ASI-KARNESI-01 — at least one asilar row (this token's doctor) — universal Aşı Karnesi, any branch */
  asiKaydi?: boolean
}

/** ASI-KARNESI-01 — evrensel modülün nav'ı (chapter profili yok). */
export const ASI_KARNESI_NAV: PortalNavOge = { key: 'asi-karnesi', label: 'Aşı Karnesi', path: '/asi-karnesi' }

export interface PortalModulSonucu {
  moduller: PortalModulId[]
  nav: PortalNavOge[]
}

function modul(key: SpecialtyKey, id: PortalModulId): PortalModulu | undefined {
  return specialtyProfile(key).portal?.find((m) => m.id === id)
}

export function portalModulleri(g: PortalUygunlukGirdisi): PortalModulSonucu {
  const brans = portalBransAnahtari(g.doktorBransi)
  const kendiModulleri = brans ? (specialtyProfile(brans).portal || []).filter((m) => m.derinlik !== 'Missing') : []
  const kendiModuluVar = !!brans && (specialtyProfile(brans).portal || []).length > 0
  const cocuk = g.hastaYasYil != null && g.hastaYasYil < 18
  const aktif = new Set<PortalModulId>()

  // pediatri: own doctor (child or unknown DOB), or a baseline-branch doctor with a child + growth data
  if (brans === 'pediatri' ? g.hastaYasYil == null || cocuk : !kendiModuluVar && cocuk && g.buyumeOlcumu) aktif.add('buyume')
  // KD: Gebeliğim on an active pregnancy for any practice
  if (g.gebelikAktif) aktif.add('gebelik')
  // KD jine reminders: KD doctor, or a baseline-branch doctor when KD chart data exists
  if (brans === 'kadin-hastaliklari-dogum' || (!kendiModuluVar && g.kdKaydi)) aktif.add('jinekoloji')
  // doctor_specialty modules
  // dahiliye ön anket: dahiliye doctor, or a baseline-branch doctor (aile hekimi, endokrin…) using dahiliye cards
  if (brans === 'dahiliye' || (!kendiModuluVar && g.dahiliyeKaydi)) aktif.add('dahiliye')
  if (brans === 'goz-hastaliklari') aktif.add('gozlerim')
  if (brans === 'dermatoloji') aktif.add('dermatoloji')
  // PSIK-EXCEPTIONAL-01 — Ruh Sağlığım yalnız psikiyatri hekiminin token'ında; başka branşa hiç taşınmaz
  // (ruh sağlığı içeriği hasta için en hassas veri: "çapraz kart verisi" ile açılmaz).
  if (brans === 'psikiyatri') aktif.add('psikiyatri')
  // KBB-EXCEPTIONAL-01 — Kulaklarım yalnız KBB hekiminin token'ında; başka branşa hiç taşınmaz
  // (kulak/burun/boğaz izlemi "çapraz kart verisi" ile açılmaz).
  if (brans === 'kulak-burun-bogaz') aktif.add('kulaklarim')
  // KARDIO-EXCEPTIONAL-01 — Kalbim yalnız kardiyoloji hekiminin token'ında; başka branşa hiç taşınmaz.
  if (brans === 'kardiyoloji') aktif.add('kalbim')
  // GOGUS-EXCEPTIONAL-01 — Akciğerlerim yalnız göğüs hastalıkları hekiminin token'ında; başka branşa
  // (dahiliye / gogus-cerrahisi dahil) hiç taşınmaz.
  if (brans === 'gogus-hastaliklari') aktif.add('akcigerlerim')
  // NOROLOJI-EXCEPTIONAL-01 — Nörolojimm yalnız nöroloji hekiminin token'ında.
  if (brans === 'noroloji') aktif.add('norolojim')
  // UROLOJI-EXCEPTIONAL-01 — Ürolojimm yalnız üroloji hekiminin token'ında; başka branşa hiç taşınmaz.
  if (brans === 'uroloji') aktif.add('urolojim')
  // SPOR-HEKIMLIGI-EXCEPTIONAL-01 — Sporum yalnız spor-hekimligi hekiminin token'ında; ortopedi/FTR'ye taşınmaz.
  if (brans === 'spor-hekimligi') aktif.add('sporum')
  // ORTOPEDI-EXCEPTIONAL-01 — Eklemlerim yalnız ortopedi hekiminin token'ında; başka branşa hiç taşınmaz.
  if (brans === 'ortopedi') aktif.add('eklemlerim')
  // FIZIK-TEDAVI-EXCEPTIONAL-01 — FTR'm yalnız fizik-tedavi hekiminin token'ında; başka branşa hiç taşınmaz.
  if (brans === 'fizik-tedavi') aktif.add('ftrm')
  // AILE-HEKIMLIGI-EXCEPTIONAL-01 — Sağlık Paketim yalnız aile hekimliği hekiminin token'ında.
  if (brans === 'aile-hekimligi') aktif.add('saglik-paketim')
  // ENDOKRINOLOJI-EXCEPTIONAL-01 — Hormonlarım yalnız endokrinoloji hekiminin token'ında; dahiliye'ye taşınmaz.
  if (brans === 'endokrinoloji') aktif.add('hormonlarim')
  // GASTROENTEROLOJI-EXCEPTIONAL-01 — Sindirimim yalnız gastroenteroloji hekiminin token'ında; dahiliye'ye taşınmaz.
  if (brans === 'gastroenteroloji') aktif.add('sindirimim')
  // ENFEKSIYON-EXCEPTIONAL-01 — Enfeksiyon Takibim yalnız enfeksiyon hastalıkları hekiminin token'ında.
  if (brans === 'enfeksiyon-hastaliklari') aktif.add('enfeksiyon-takibim')
  // NEFROLOJI-EXCEPTIONAL-01 — Böbreklerim yalnız nefroloji hekiminin token'ında; dahiliye/üroloji'ye taşınmaz.
  if (brans === 'nefroloji') aktif.add('bobreklerim')
  // ROMATOLOJI-EXCEPTIONAL-01 — Romatizmam yalnız romatoloji hekiminin token'ında; ortopedi/FTR/dahiliye'ye taşınmaz.
  if (brans === 'romatoloji') aktif.add('romatizmam')
  // ONKOLOJI-EXCEPTIONAL-01 — Tedavim yalnız onkoloji hekiminin token'ında; dahiliye'ye taşınmaz.
  if (brans === 'onkoloji') aktif.add('tedavim')
  // GENEL-CERRAHI-EXCEPTIONAL-01 — Ameliyatım yalnız genel-cerrahi hekiminin token'ında;
  // plastik / üroloji / ortopedi'ye taşınmaz.
  if (brans === 'genel-cerrahi') aktif.add('ameliyatim')
  // PLASTIK-CERRAHI-EXCEPTIONAL-01 — Yaram yalnız plastik-cerrahi hekiminin token'ında;
  // dermatoloji / genel-cerrahi'ye taşınmaz.
  if (brans === 'plastik-cerrahi') aktif.add('yaram')
  // GOGUS-CERRAHISI-EXCEPTIONAL-01 — Göğüs Cerrahisi takibi yalnız gogus-cerrahisi hekiminin token'ında;
  // gogus-hastaliklari Akciğerlerim / CAT-mMRC BURAYA TAŞINMAZ (ve tersi).
  if (brans === 'gogus-cerrahisi') aktif.add('gogus-cerrahisi-takibim')
  // BEYIN-CERRAHISI-EXCEPTIONAL-01 — Beyin Cerrahisi takibi yalnız beyin-cerrahisi hekiminin token'ında;
  // noroloji'ye taşınmaz (Migren/İnme sızıntısı yok).
  if (brans === 'beyin-cerrahisi') aktif.add('beyin-takibi')
  // COCUK-CERRAHISI-EXCEPTIONAL-01 — Çocuğumun Cerrahisi yalnız cocuk-cerrahisi hekiminin token'ında.
  if (brans === 'cocuk-cerrahisi') aktif.add('cocugumun-cerrahisi')
  // ANESTEZI-EXCEPTIONAL-01 — Anestezi Öncesi yalnız anestezi hekiminin token'ında;
  // genel-cerrahi / göğüs-cerrahisi pre-op tile'ları BURAYA TAŞINMAZ.
  if (brans === 'anestezi') aktif.add('anestezi-oncesi')
  // ACIL-TIP-EXCEPTIONAL-01 — Acil Sonrası yalnız acil-tip hekiminin token'ında.
  if (brans === 'acil-tip') aktif.add('acil-sonrasi')
  // KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 — Damar Cerrahisi takibi yalnız kalp-damar-cerrahisi;
  // kardiyoloji Kalbim / SCORE2 BURAYA TAŞINMAZ (ve tersi).
  if (brans === 'kalp-damar-cerrahisi') aktif.add('damar-cerrahisi-takibi')
  // RADYOLOJI-EXCEPTIONAL-01 — Tetkiklerim yalnız radyoloji hekiminin token'ında;
  // dahiliye / onkoloji / göğüs'e taşınmaz.
  if (brans === 'radyoloji') aktif.add('tetkiklerim')
  if (brans === 'sac-ekimi') aktif.add('sacim')
  if (brans === 'medikal-estetik') aktif.add('estetik-bakimim')
  if (brans === 'longevity') aktif.add('longevitim')
  if (brans === 'fizyoterapi') aktif.add('fizyom')
  if (brans === 'klinik-psikolog') aktif.add('seanslarim')
  if (brans === 'diyetisyen') aktif.add('beslenmem')
  if (brans === 'ergoterapi') aktif.add('ergom')
  if (brans === 'odyoloji') aktif.add('isitmem-odyoloji')
  // ASI-KARNESI-01 — evrensel: kayıt varsa her branşta (göz hekiminin kaydettiği grip aşısı da karnede görünür).
  if (g.asiKaydi) aktif.add('asi-karnesi')

  // Nav: own chapter's modules first, then anything else that attached (e.g. Gebeliğim for a göz patient).
  const sirali = [...kendiModulleri.map((m) => m.id).filter((id) => aktif.has(id)), ...[...aktif].filter((id) => !kendiModulleri.some((m) => m.id === id))]
  const SAHIP: Record<Exclude<PortalModulId, 'asi-karnesi'>, SpecialtyKey> = {
    buyume: 'pediatri', gebelik: 'kadin-hastaliklari-dogum', jinekoloji: 'kadin-hastaliklari-dogum',
    dahiliye: 'dahiliye', gozlerim: 'goz-hastaliklari', dermatoloji: 'dermatoloji', psikiyatri: 'psikiyatri',
    kulaklarim: 'kulak-burun-bogaz', kalbim: 'kardiyoloji', akcigerlerim: 'gogus-hastaliklari',
    norolojim: 'noroloji', urolojim: 'uroloji', sporum: 'spor-hekimligi', eklemlerim: 'ortopedi', ftrm: 'fizik-tedavi',
    'saglik-paketim': 'aile-hekimligi', hormonlarim: 'endokrinoloji', sindirimim: 'gastroenteroloji',
    'enfeksiyon-takibim': 'enfeksiyon-hastaliklari',
    bobreklerim: 'nefroloji', romatizmam: 'romatoloji', tedavim: 'onkoloji', ameliyatim: 'genel-cerrahi', yaram: 'plastik-cerrahi',
    'gogus-cerrahisi-takibim': 'gogus-cerrahisi',
    'beyin-takibi': 'beyin-cerrahisi',
    'cocugumun-cerrahisi': 'cocuk-cerrahisi',
    'anestezi-oncesi': 'anestezi',
    'acil-sonrasi': 'acil-tip',
    'damar-cerrahisi-takibi': 'kalp-damar-cerrahisi',
    tetkiklerim: 'radyoloji',
    sacim: 'sac-ekimi',
    'estetik-bakimim': 'medikal-estetik',
    longevitim: 'longevity',
    fizyom: 'fizyoterapi',
    seanslarim: 'klinik-psikolog',
    beslenmem: 'diyetisyen',
    ergom: 'ergoterapi',
    'isitmem-odyoloji': 'odyoloji',
  }
  const nav = sirali.flatMap((id) => (id === 'asi-karnesi' ? [ASI_KARNESI_NAV] : modul(SAHIP[id], id)?.nav || []))
  return { moduller: sirali, nav }
}

export function portalModulAktif(data: { portal?: { moduller: PortalModulId[] } | null }, id: PortalModulId): boolean {
  return !!data.portal?.moduller.includes(id)
}
