/**
 * DERM-CHAPTER — Biyolojik / sistemik tedavi SUT rapor taslağı (göz `engines/sgkRapor.ts` deseni:
 * aynı `SgkRaporDraft` şekli, zorunlu madde listesi, eksikler, hekim kilidi, Medula girişini hekim yapar).
 *
 * Kilitler:
 * - **Doz yazılmaz.** Etken madde / sınıf adı geçebilir; mg, sıklık, yükleme şeması YAZILMAZ (hekim yazar).
 * - SUT madde numarası bu repoda doğrulanmadı → kontrol maddeleri `tamam: null` ("hekim / idare teyit eder").
 * - PSOKİD 2025 basamak adları rol atfıyla anılır; kılavuz metni kopyalanmaz.
 * - T.C. kimlik numarası yazılmaz (göz deseni: `tcSon4` boş kalır).
 * - Tanı ve ICD-10 önerisi hekim doğrular.
 */
import type { SgkRaporDraft } from '@/lib/sgk/raporTipleri'
import type { Dipnot } from '../protocols/sources'
import { pasiBant, dlqiBant, easiBant } from './score-calculator'

export type BiyolojikEndikasyon = 'psoriasis' | 'psoriatik_artrit' | 'atopik_dermatit' | 'hidradenit' | 'kronik_urtiker'

export const BIYOLOJIK_ENDIKASYON_ADI: Record<BiyolojikEndikasyon, string> = {
  psoriasis: 'Plak psoriasis',
  psoriatik_artrit: 'Psoriatik artrit (deri tutulumu ile)',
  atopik_dermatit: 'Atopik dermatit',
  hidradenit: 'Hidradenitis suppurativa',
  kronik_urtiker: 'Kronik spontan ürtiker',
}

/** ICD-10 önerisi — hekim doğrular. */
const ICD: Record<BiyolojikEndikasyon, { icd10: string; aciklama: string }> = {
  psoriasis: { icd10: 'L40.0', aciklama: 'Psoriasis vulgaris' },
  psoriatik_artrit: { icd10: 'L40.5', aciklama: 'Artropatik psoriasis' },
  atopik_dermatit: { icd10: 'L20.9', aciklama: 'Atopik dermatit, tanımlanmamış' },
  hidradenit: { icd10: 'L73.2', aciklama: 'Hidradenitis suppurativa' },
  kronik_urtiker: { icd10: 'L50.1', aciklama: 'İdiyopatik ürtiker' },
}

export type BiyolojikSablon = 'baslangic' | 'idame'

export const BIYOLOJIK_SABLONLARI: Array<{ id: BiyolojikSablon; ad: string }> = [
  { id: 'baslangic', ad: 'Biyolojik / sistemik tedavi başlangıç raporu' },
  { id: 'idame', ad: 'İdame raporu (yanıt değerlendirmeli)' },
]

/** PSOKİD basamakları — rapor için "önceki basamak" beyanı. İlaç seçimi ve doz hekimindir. */
export type OncekiBasamak = 'topikal' | 'fototerapi' | 'konvansiyonel_sistemik' | 'biyolojik'

export const ONCEKI_BASAMAK_ADI: Record<OncekiBasamak, string> = {
  topikal: 'Topikal tedavi',
  fototerapi: 'Fototerapi (NB-UVB / PUVA)',
  konvansiyonel_sistemik: 'Konvansiyonel sistemik tedavi',
  biyolojik: 'Önceki biyolojik tedavi',
}

export type BasamakBeyani = {
  basamak: OncekiBasamak
  /** hekim beyanı: yanıtsız / kontrendike / intolerans */
  sonuc: 'yanitsiz' | 'kontrendike' | 'intolerans' | 'devam'
  /** hekim notu (süre, gerekçe) — serbest metin */
  not?: string
}

export const BASAMAK_SONUC_ADI: Record<BasamakBeyani['sonuc'], string> = {
  yanitsiz: 'yeterli yanıt alınamadı',
  kontrendike: 'kontrendike',
  intolerans: 'intolerans / yan etki',
  devam: 'devam ediyor',
}

export type BiyolojikSutGirdi = {
  sablon: BiyolojikSablon
  hasta: { adSoyad: string }
  endikasyon: BiyolojikEndikasyon | null
  /** hekimin yazdığı etken madde / sınıf adı — doz YAZILMAZ */
  etkenMadde?: string | null
  anamnez?: string | null
  /** başlangıç ve güncel skorlar (derm_skor_anlari) */
  pasiBaslangic?: number | null
  pasiSimdi?: number | null
  easiBaslangic?: number | null
  easiSimdi?: number | null
  dlqiBaslangic?: number | null
  dlqiSimdi?: number | null
  bsaPct?: number | null
  /** lab kapısı (derm-spine biyolojikKapisi ile aynı alanlar) */
  tbTarama?: boolean
  tbTaramaTarihi?: string | null
  akcigerGrafisi?: string | null
  hbvTarama?: boolean
  hcvTarama?: boolean
  hiv?: boolean | null
  /** gebelik / laktasyon durumu — hekim beyanı (yaşa ve cinsiyete göre hekim doldurur) */
  gebelikDurumu?: 'yok' | 'gebe' | 'laktasyon' | 'bilinmiyor' | null
  canliAsiBilgilendirme?: boolean
  /** önceki basamaklar */
  basamaklar: BasamakBeyani[]
  /** eklem tutulumu / PsA sevk notu */
  psaTutulumu?: boolean
  /** hekim, idame raporunda yanıt beyanını kendisi verir */
  hekimYanitVarBeyani?: boolean
  /** foto serisi: başlangıç ve 12. hafta */
  fotoBaslangic?: string | null
  fotoHafta12?: string | null
  bugun: string
}

export type SutKontrolMaddesi = { madde: string; tamam: boolean | null }

export type BiyolojikSutSonuc = {
  draft: SgkRaporDraft
  raporTipi: string
  sutKontrol: SutKontrolMaddesi[]
  eksikler: string[]
  dipnotlar: Dipnot[]
  /** tüm zorunlu maddeler tamam → hekim kilitleyebilir */
  kilitlenebilir: boolean
  dozKilidi: string
}

export const DOZ_KILIDI_METNI =
  'Doz, uygulama sıklığı ve yükleme şeması bu taslakta yer almaz — hekim raporda kendisi belirtir.'

export function biyolojikSutTaslak(g: BiyolojikSutGirdi): BiyolojikSutSonuc {
  const eksikler: string[] = []
  const sutKontrol: SutKontrolMaddesi[] = []
  const klinik: string[] = []
  const tetkik: string[] = []
  const dip: Dipnot[] = []
  const idame = g.sablon === 'idame'
  const end = g.endikasyon

  if (!end) eksikler.push('Endikasyon seçimi')
  const tani = end ? ICD[end] : { icd10: '', aciklama: 'Tanı hekim tarafından girilecek' }

  // ── Klinik zorunlu içerik ───────────────────────────────────────────────────
  if (g.anamnez) klinik.push(`Anamnez: ${g.anamnez}`)
  else eksikler.push('Hasta anamnezi (hastalık süresi, tutulan bölgeler)')

  const psoriasisGrubu = end === 'psoriasis' || end === 'psoriatik_artrit'
  const atopiGrubu = end === 'atopik_dermatit'

  if (psoriasisGrubu) {
    const pasi = idame ? g.pasiSimdi : g.pasiBaslangic ?? g.pasiSimdi
    if (pasi != null) klinik.push(`PASI: ${pasi} (${pasiBant(pasi)})`)
    else eksikler.push('PASI (bölge çalışma sayfasından)')
    if (g.bsaPct != null) klinik.push(`Tutulan vücut yüzey alanı: %${g.bsaPct}`)
    else eksikler.push('Vücut yüzey alanı (%)')
  }
  if (atopiGrubu) {
    const e = idame ? g.easiSimdi : g.easiBaslangic ?? g.easiSimdi
    if (e != null) klinik.push(`EASI: ${e} (${easiBant(e)})`)
    else eksikler.push('EASI (bölge çalışma sayfasından)')
  }

  const dlqi = idame ? g.dlqiSimdi : g.dlqiBaslangic ?? g.dlqiSimdi
  if (dlqi != null) klinik.push(`DLQI: ${dlqi} (${dlqiBant(dlqi)})`)
  else eksikler.push('DLQI')

  sutKontrol.push({
    madde: 'Rapor içeriği: anamnez, hastalık şiddeti skoru (PASI / EASI), DLQI, tutulan yüzey alanı',
    tamam: eksikler.filter((x) => /anamnez|PASI|EASI|DLQI|yüzey/i.test(x)).length === 0,
  })
  dip.push({ ref: 'PSOKID_2025', not: 'Hastalık şiddeti ve yaşam kalitesi ölçütleri (“onluk kuralı”) — basamak kararı hekimin' })

  // ── Önceki basamaklar (SUT basamak koşulu) ─────────────────────────────────
  const gecerli = g.basamaklar.filter((b) => b.sonuc !== 'devam')
  if (gecerli.length) {
    for (const b of gecerli) {
      klinik.push(`${ONCEKI_BASAMAK_ADI[b.basamak]}: ${BASAMAK_SONUC_ADI[b.sonuc]}${b.not ? ` — ${b.not}` : ''}`)
    }
  } else {
    eksikler.push('Önceki basamak tedavileri (yanıtsızlık / kontrendikasyon / intolerans beyanı)')
  }
  sutKontrol.push({
    madde: 'Basamak koşulu: önceki tedavi basamakları ve yanıtsızlık / kontrendikasyon hekim tarafından belgelendi',
    tamam: gecerli.length > 0 ? true : false,
  })
  sutKontrol.push({
    madde: 'İlgili SUT maddesinin güncel basamak, rapor süresi ve reçete koşulları — hekim / idare teyit eder',
    tamam: null,
  })
  dip.push({ ref: 'SUT_2026', not: 'Biyolojik / sistemik ilaç rapor ve basamak koşulları; madde numarası ve süre hekim / idare teyidiyle' })

  // ── Enfeksiyon taraması ────────────────────────────────────────────────────
  if (g.tbTarama) tetkik.push(`Tüberküloz taraması (PPD / IGRA)${g.tbTaramaTarihi ? ` — ${g.tbTaramaTarihi}` : ''}`)
  else eksikler.push('Tüberküloz taraması (PPD / IGRA)')
  if (g.akcigerGrafisi) tetkik.push(`Akciğer grafisi — ${g.akcigerGrafisi}`)
  else eksikler.push('Akciğer grafisi')
  if (g.hbvTarama) tetkik.push('HBV serolojisi')
  else eksikler.push('HBV serolojisi')
  if (g.hcvTarama) tetkik.push('HCV serolojisi')
  else eksikler.push('HCV serolojisi')
  if (g.hiv === true) tetkik.push('HIV serolojisi')
  sutKontrol.push({
    madde: 'Biyolojik öncesi TB (PPD/IGRA) + akciğer grafisi + HBV/HCV taraması tamam',
    tamam: !!(g.tbTarama && g.akcigerGrafisi && g.hbvTarama && g.hcvTarama),
  })
  dip.push({ ref: 'PSOKID_2025', not: 'Biyolojik öncesi tarama başlıkları; pozitif sonuçta yönlendirme ve tedavi kararı hekimin' })

  // ── Gebelik / laktasyon + canlı aşı ────────────────────────────────────────
  if (g.gebelikDurumu && g.gebelikDurumu !== 'bilinmiyor') {
    klinik.push(`Gebelik / laktasyon durumu (hekim beyanı): ${g.gebelikDurumu === 'yok' ? 'yok' : g.gebelikDurumu === 'gebe' ? 'gebe' : 'laktasyon'}`)
  } else {
    eksikler.push('Gebelik / laktasyon durumu beyanı')
  }
  sutKontrol.push({ madde: 'Gebelik / laktasyon durumu ve canlı virüs aşısı bilgilendirmesi kaydedildi', tamam: !!(g.gebelikDurumu && g.gebelikDurumu !== 'bilinmiyor' && g.canliAsiBilgilendirme) })
  if (!g.canliAsiBilgilendirme) eksikler.push('Canlı virüs aşısı yasağı bilgilendirmesi')

  // ── PsA / eklem ────────────────────────────────────────────────────────────
  if (g.psaTutulumu) {
    klinik.push('Eklem tutulumu bulguları var — romatoloji değerlendirmesi hekim tarafından planlandı (Notya romatoloji değerlendirmesi yapmaz).')
    sutKontrol.push({ madde: 'Eklem tutulumunda romatoloji iş birliği / sevk hekim tarafından planlandı', tamam: null })
  }

  // ── Foto serisi ────────────────────────────────────────────────────────────
  if (g.fotoBaslangic) tetkik.push(`Başlangıç klinik fotoğraf serisi (${g.fotoBaslangic})`)
  else eksikler.push('Başlangıç klinik fotoğraf serisi')
  if (idame) {
    if (g.fotoHafta12) tetkik.push(`12. hafta karşılaştırma fotoğrafı (${g.fotoHafta12})`)
    else eksikler.push('12. hafta karşılaştırma fotoğrafı')
  }

  // ── İdame: yanıt değerlendirmesi ───────────────────────────────────────────
  if (idame) {
    const satirlar: string[] = []
    if (psoriasisGrubu && g.pasiBaslangic != null && g.pasiSimdi != null) {
      const dusus = g.pasiBaslangic === 0 ? null : Math.round(((g.pasiBaslangic - g.pasiSimdi) / g.pasiBaslangic) * 1000) / 10
      satirlar.push(`PASI ${g.pasiBaslangic} → ${g.pasiSimdi}${dusus != null ? ` (%${dusus} değişim)` : ''}`)
    }
    if (atopiGrubu && g.easiBaslangic != null && g.easiSimdi != null) {
      const dusus = g.easiBaslangic === 0 ? null : Math.round(((g.easiBaslangic - g.easiSimdi) / g.easiBaslangic) * 1000) / 10
      satirlar.push(`EASI ${g.easiBaslangic} → ${g.easiSimdi}${dusus != null ? ` (%${dusus} değişim)` : ''}`)
    }
    if (g.dlqiBaslangic != null && g.dlqiSimdi != null) satirlar.push(`DLQI ${g.dlqiBaslangic} → ${g.dlqiSimdi}`)
    if (satirlar.length) klinik.push(`Tedaviye yanıt (başlangıca göre): ${satirlar.join('; ')}`)
    else eksikler.push('İdame için başlangıç ve güncel skor çifti')
    if (g.hekimYanitVarBeyani) klinik.push('Hekim beyanı: hasta tedaviye yanıt vermektedir.')
    else eksikler.push('Hekimin yanıt beyanı (idame raporunda zorunlu)')
    sutKontrol.push({ madde: 'İdame raporunda başlangıca göre yanıt değerlendirmesi ve hekim beyanı', tamam: !!(satirlar.length && g.hekimYanitVarBeyani) })
  }

  sutKontrol.push({ madde: 'Rapor süresi ve rapor tipi (tek hekim / sağlık kurulu) — hekim / idare teyit eder', tamam: null })
  sutKontrol.push({ madde: 'Medula girişi ve e-imza hekim tarafından yapılır (Notya canlı gönderim yapmaz)', tamam: null })
  dip.push({ ref: 'SUT_2026', not: 'Rapor tipi ve süresi endikasyona göre değişir — Medula girişi hekimin' })

  const etken = (g.etkenMadde || '').trim()
  const hekimDeg = [
    end ? `${BIYOLOJIK_ENDIKASYON_ADI[end]} tanısıyla` : 'Tanı hekim tarafından girilecek;',
    gecerli.length ? `önceki basamaklarda (${gecerli.map((b) => ONCEKI_BASAMAK_ADI[b.basamak]).join(', ')}) hedefe ulaşılamaması nedeniyle` : '',
    etken ? `${etken} ile` : 'seçilecek etken madde ile',
    idame ? 'tedavinin devamı uygundur.' : 'tedavi planlanmıştır.',
    '(Taslak — doz ve süre hekim tarafından yazılır; hekim düzenler ve onaylar.)',
  ].filter(Boolean).join(' ').replace(/\s+/g, ' ')

  const draft: SgkRaporDraft = {
    raporBasligi: idame ? 'Dermatoloji Sistemik / Biyolojik Tedavi İdame Raporu' : 'Dermatoloji Sistemik / Biyolojik Tedavi Raporu',
    raporTuru: idame ? 'Devam' : 'Ilk',
    hastaAdi: g.hasta.adSoyad,
    tcSon4: '',
    tani,
    anamnez: g.anamnez || undefined,
    mevcutDurum: klinik.join('\n'),
    hekim_degerlendirmesi: hekimDeg,
    etkenMaddeler: etken ? [etken] : [],
    zorunluTetkikler: tetkik,
  }

  const zorunluTamam = sutKontrol.filter((k) => k.tamam === false).length === 0 && eksikler.length === 0

  return {
    draft,
    raporTipi: 'Rapor tipi ve süresi SUT’un ilgili maddesine göre — hekim / idare teyit eder; Medula’ya hekim e-imza ile girer',
    sutKontrol,
    eksikler,
    dipnotlar: dip,
    kilitlenebilir: zorunluTamam,
    dozKilidi: DOZ_KILIDI_METNI,
  }
}

/** Panoya / yazdırmaya düz metin. Hasta adı ve T.C. Medula'da hekim tarafından doldurulur. */
export function biyolojikSutMetni(s: BiyolojikSutSonuc): string {
  const d = s.draft
  return [
    d.raporBasligi,
    `Rapor türü: ${s.raporTipi}`,
    `Tanı önerisi (hekim doğrular): ${d.tani.icd10 ? `${d.tani.icd10} ` : ''}${d.tani.aciklama}`,
    d.mevcutDurum ? `\n${d.mevcutDurum}` : '',
    d.zorunluTetkikler?.length ? `\nTetkikler:\n- ${d.zorunluTetkikler.join('\n- ')}` : '',
    d.etkenMaddeler?.length ? `\nEtken madde: ${d.etkenMaddeler.join(', ')} (doz hekim yazar)` : '',
    d.hekim_degerlendirmesi ? `\n${d.hekim_degerlendirmesi}` : '',
    s.eksikler.length ? `\nEksikler:\n- ${s.eksikler.join('\n- ')}` : '',
    `\n${s.dozKilidi}`,
  ].filter(Boolean).join('\n')
}
