/**
 * NOTYA-JINE-04 / KD-05 — Menoraji treatment ladder + KD clinic wow engines.
 * NICE NG88 / TJOD menoraji teaching; MoH e-Doğum field map; USG+SUT; Anti-D loop; CS defense; package ledger;
 * ürojine/onkoloji sevk-quality; infertilite deepen.
 */
import type { Dipnot } from './jinekoloji-v2'

// ---------- Menoraji treatment ladder ----------
export type MenorajiTedaviGirdi = {
  menoraji: boolean
  anemi: 'yok' | 'hafif' | 'orta' | 'agir' | 'bilinmiyor'
  gebelikIstegi: boolean
  myomBozucu: boolean /** cavity-distorting fibroid */
  adenomyozis: boolean
  medikalBasarisiz: boolean
  orneklemeSonucRiskli: boolean /** hyperplasia/malignancy concern */
}

export type MenorajiBasamak = {
  sira: number
  baslik: string
  detay: string
  doz?: string
  uygun: boolean
  gerekce: string
}

export function menorajiTedaviBasamagi(g: MenorajiTedaviGirdi): { basamaklar: MenorajiBasamak[]; dipnotlar: Dipnot[]; kirmizi: string[] } {
  const kirmizi: string[] = []
  if (g.anemi === 'agir') kirmizi.push('Hb <8: acil değerlendirme / hospitalizasyon kararı hekimde')
  if (g.orneklemeSonucRiskli) kirmizi.push('Örnekleme riskli: onkolojik yol — medikal HMB basamağı ertelenir')

  const basamaklar: MenorajiBasamak[] = []
  const lngOk = !g.myomBozucu && !g.orneklemeSonucRiskli
  basamaklar.push({
    sira: 1, baslik: 'LNG-IUS (birinci basamak)',
    detay: 'NICE/TJOD: kaviteyi bozmayan patolojide veya adenomyoziste tercih',
    doz: 'LNG 52 mg RİA — kontrasepsiyon + HMB ikili yarar',
    uygun: lngOk && g.menoraji, gerekce: lngOk ? 'Birinci basamak' : 'Bozucu myom / malignite şüphesi — uygun değil',
  })
  basamaklar.push({
    sira: 2, baslik: 'Traneksamik asit (TXA)',
    detay: 'Adet günlerinde antifibrinolitik; LNG yoksa veya beklerken',
    doz: 'TXA 1 g PO TID (adet günleri, genellikle 3–5 gün) — hekim reçete; VTE öyküsünde dikkat',
    uygun: g.menoraji && !g.orneklemeSonucRiskli, gerekce: 'İkinci basamak / köprü',
  })
  basamaklar.push({
    sira: 3, baslik: 'NSAİİ',
    detay: 'Prostaglandin inhibisyonu — ağrı + kanama azaltma',
    doz: 'İbuprofen / naproksen adet başı — hekim reçete',
    uygun: g.menoraji, gerekce: 'Semptomatik',
  })
  basamaklar.push({
    sira: 4, baslik: 'KOK veya siklik progestin',
    detay: 'Gebelik istemeyen; KOK kapısı (WHO MEC) geçilmeli',
    doz: 'KOK veya medroksiprogesteron / noretisteron siklus — hekim',
    uygun: g.menoraji && !g.gebelikIstegi && !g.orneklemeSonucRiskli, gerekce: g.gebelikIstegi ? 'Gebelik isteği — hormonal baskılama ertelenir' : 'Uygun',
  })
  basamaklar.push({
    sira: 5, baslik: 'Cerrahi seçenekler',
    detay: 'Medikal başarısızlık veya bozucu patoloji',
    doz: 'Endometriyal ablasyon · miyomektomi · histerektomi — sevk/cerrahi plan',
    uygun: g.medikalBasarisiz || g.myomBozucu || g.orneklemeSonucRiskli, gerekce: 'Sevk kalitesi — Notya endikasyon listeler',
  })

  return {
    basamaklar,
    dipnotlar: [
      { ref: 'TJOD_MENORAJI', not: 'LNG-IUS birinci basamak; TXA ikinci basamak' },
      { ref: 'BEREK', not: 'PALM-COEIN sonrası tedavi patolojiye göre' },
      { ref: 'ACOG', not: 'NICE NG88 ile uyumlu basamaklı yaklaşım' },
    ],
    kirmizi,
  }
}

// ---------- Anti-D closed loop ----------
export type AntiDTetik =
  | 'antenatal_28'
  | 'postpartum_rh_pos'
  | 'abortus'
  | 'ektopik'
  | 'kanama_antepartum'
  | 'amniyosentez'
  | 'dis_versiyon'
  | 'travma_karin'

export function antiDKapaliDongu(g: {
  rhNegatif: boolean
  partnerRhPozitifVeyaBilinmiyor: boolean
  indirektCoombsNegatif: boolean
  tetikler: AntiDTetik[]
  antenatalYapildi: boolean
  postpartumYapildi: boolean
}): { gorevler: { kod: string; ad: string; dueHint: string }[]; dozNotu: string } {
  if (!g.rhNegatif) return { gorevler: [], dozNotu: 'Rh pozitif — Anti-D gerekmez' }
  if (!g.indirektCoombsNegatif) return { gorevler: [{ kod: 'anti_d_coombs', ad: 'İndirekt Coombs pozitif — perinatoloji/hematoloji; Anti-D protokolü değişir', dueHint: 'hemen' }], dozNotu: 'Sensitize — standart profilaksi değil' }

  const gorevler: { kod: string; ad: string; dueHint: string }[] = []
  if (g.partnerRhPozitifVeyaBilinmiyor && !g.antenatalYapildi) {
    gorevler.push({ kod: 'anti_d_28', ad: 'Antenatal Anti-D ~28–30 hf (300 µg / 1500 IU IM) — MoH DÖB', dueHint: '28–30 hf' })
  }
  for (const t of g.tetikler) {
    const map: Record<AntiDTetik, string> = {
      antenatal_28: '28 hf rutin',
      postpartum_rh_pos: 'Doğum sonrası 72 sa içinde (yenidoğan Rh+)',
      abortus: 'Abortus / küretaj sonrası Anti-D',
      ektopik: 'Ektopik cerrahi/medikal sonrası Anti-D',
      kanama_antepartum: 'Antepartum kanama — doz tekrarı değerlendir',
      amniyosentez: 'Amniyosentez / CVS sonrası',
      dis_versiyon: 'Eksternal sefalik versiyon sonrası',
      travma_karin: 'Karın travması / abruptio şüphesi',
    }
    gorevler.push({ kod: `anti_d_${t}`, ad: map[t], dueHint: t === 'postpartum_rh_pos' ? '≤72 sa' : 'hemen' })
  }
  if (g.tetikler.includes('postpartum_rh_pos') && !g.postpartumYapildi) {
    /* already added */
  }
  return { gorevler, dozNotu: 'Tipik doz 300 µg (1500 IU) IM; büyük FMH\'de Kleihauer/doz artışı — hekim' }
}

// ---------- USG report + SUT ----------
export type UsgSablonKod = 'dating' | 'birinci_trimester' | 'anomali' | 'buyume' | 'doppler' | 'serviks' | 'plasenta' | 'jine_pelvik'

export const USG_SABLONLARI: { kod: UsgSablonKod; ad: string; maddeler: string[]; sutOneri: string; accretaBayrak?: boolean }[] = [
  { kod: 'dating', ad: 'Erken gebelik / dating', maddeler: ['GS / yolk / CRL', 'FHR', 'Yer (IU/ektopik)', 'Adneks', 'Korpus luteum'], sutOneri: 'Obstetrik US (erken) — klinik kodu hekim seçer' },
  { kod: 'birinci_trimester', ad: '11–14 hf (NT / kombine)', maddeler: ['CRL', 'NT', 'Burun kemiği', 'Duktus venozus', 'FHR', 'Koryonisite (çoğul)'], sutOneri: '1. trimester tarama US' },
  { kod: 'anomali', ad: '18–24 hf anomali taraması', maddeler: ['Biometri', 'MSS', 'Yüz', 'Toraks/kalp 4OD', 'Abdomen', 'Böbrek', 'Ekstremite', 'Omurga', 'Plasenta', 'Sıvı', 'Serviks'], sutOneri: 'Detaylı fetal anomali US — TMFTP kod talebi ile uyumlu faturalama' },
  { kod: 'buyume', ad: 'Büyüme / biyometri', maddeler: ['BPD/HC/AC/FL', 'EFW', 'Yüzde', 'AFI/SDP', 'Prezentasyon', 'Plasenta'], sutOneri: 'Fetal biyometri / büyüme US' },
  { kod: 'doppler', ad: 'Doppler (UA/MCA/DV)', maddeler: ['UA PI/RI', 'MCA', 'CPR', 'DV', 'End-diastolic akım'], sutOneri: 'Fetal Doppler — perinatoloji' },
  { kod: 'serviks', ad: 'Servikal uzunluk', maddeler: ['TVCL mm', 'Huni', 'Çamur'], sutOneri: 'Servikal uzunluk US' },
  { kod: 'plasenta', ad: 'Plasenta / previa / accreta risk', maddeler: ['Konum', 'Previa mesafesi', 'Lakün', 'Miyometriyum incelmesi', 'Mesane hattı'], sutOneri: 'Plasenta değerlendirme', accretaBayrak: true },
  { kod: 'jine_pelvik', ad: 'Jinekolojik pelvik US', maddeler: ['Uterus ölçü', 'ET', 'Myom FIGO', 'Overler', 'Doppler adneks', 'Serbest sıvı'], sutOneri: 'Jinekolojik US' },
]

export function usgRaporTaslagi(kod: UsgSablonKod, olcumler: Record<string, string>, hekimNotu?: string): {
  baslik: string
  govde: string
  sutOneri: string
  bayraklar: string[]
} {
  const s = USG_SABLONLARI.find((x) => x.kod === kod) || USG_SABLONLARI[0]
  const satırlar = s.maddeler.map((m) => {
    const key = m.split('/')[0].trim()
    const val = olcumler[m] || olcumler[key] || '……'
    return `• ${m}: ${val}`
  })
  const bayraklar: string[] = []
  if (s.accretaBayrak && /previa|accreta|lakün|inces/i.test(JSON.stringify(olcumler) + (hekimNotu || ''))) {
    bayraklar.push('Plasenta accreta spektrumu riski — perinatoloji / sezaryen histerektomi hazırlığı')
  }
  return {
    baslik: `Obstetrik/Jinekolojik US — ${s.ad}`,
    govde: [s.ad, ...satırlar, hekimNotu ? `\nHekim notu: ${hekimNotu}` : '', '\n(Taslak — hekim imzalar; tanı değildir.)'].filter(Boolean).join('\n'),
    sutOneri: s.sutOneri,
    bayraklar,
  }
}

// ---------- e-Doğum wizard fields ----------
export type EDogumAlan = { kod: string; etiket: string; zorunlu: boolean; kaynak: string }

export const E_DOGUM_ALANLARI: EDogumAlan[] = [
  { kod: 'anne_tc', etiket: 'Anne T.C. / kimlik', zorunlu: true, kaynak: 'hasta' },
  { kod: 'dogum_tarih_saat', etiket: 'Doğum tarih-saat', zorunlu: true, kaynak: 'dogum.dogum_zamani' },
  { kod: 'dogum_yeri', etiket: 'Doğum yeri (kurum)', zorunlu: true, kaynak: 'klinik' },
  { kod: 'dogum_sekli', etiket: 'Doğum şekli (vajinal/CS)', zorunlu: true, kaynak: 'dogum.dogum_sekli' },
  { kod: 'cs_endikasyon', etiket: 'C/S endikasyon(lar)', zorunlu: false, kaynak: 'dogum.cs_endikasyon' },
  { kod: 'gebelik_haftasi', etiket: 'Gebelik haftası', zorunlu: true, kaynak: 'bebek.gebelik_haftasi' },
  { kod: 'canli_olu', etiket: 'Canlı / ölü doğum', zorunlu: true, kaynak: 'dogum.canli_dogum' },
  { kod: 'cinsiyet', etiket: 'Cinsiyet', zorunlu: true, kaynak: 'bebek.cinsiyet' },
  { kod: 'kilo', etiket: 'Doğum kilosu (g)', zorunlu: true, kaynak: 'bebek.kilo_gram' },
  { kod: 'apgar1', etiket: 'Apgar 1', zorunlu: false, kaynak: 'bebek.apgar1' },
  { kod: 'apgar5', etiket: 'Apgar 5', zorunlu: false, kaynak: 'bebek.apgar5' },
  { kod: 'cogul', etiket: 'Çoğul gebelik sırası', zorunlu: false, kaynak: 'bebek.sira' },
  { kod: 'olu_dogum_esik', etiket: 'Ölü doğum ≥22 hf veya ≥500 g → bildirimi zorunlu', zorunlu: true, kaynak: 'hesap' },
]

export function eDogumSihirbaz(payload: Record<string, unknown>): { alanlar: { kod: string; etiket: string; deger: string; eksik: boolean }[]; tamam: boolean; uyari: string[] } {
  const uyari: string[] = []
  const kilo = Number(payload.kilo || 0)
  const hf = Number(payload.gebelik_haftasi || 0)
  const canli = payload.canli_olu === 'canli' || payload.canli_dogum === true
  const filled: Record<string, unknown> = {
    ...payload,
    olu_dogum_esik: !canli && (hf >= 22 || kilo >= 500) ? 'bildirim_zorunlu' : canli ? 'canli_dogum' : 'esik_alti',
  }
  const alanlar = E_DOGUM_ALANLARI.map((a) => {
    const deger = filled[a.kod] == null || filled[a.kod] === '' ? '' : String(filled[a.kod])
    return { kod: a.kod, etiket: a.etiket, deger, eksik: a.zorunlu && !deger }
  })
  if (!canli && (hf >= 22 || kilo >= 500)) uyari.push('Ölü doğum eşiği: e-Doğum bildirimi zorunlu (MoH DBS)')
  if (payload.dogum_sekli === 'cs' && !payload.cs_endikasyon) uyari.push('C/S için endikasyon savunma notu eksik')
  return { alanlar, tamam: alanlar.every((x) => !x.eksik), uyari }
}

// ---------- CS defensibility ----------
export function csSavunmaPaketi(endikasyonlar: string[], kararAt: string | null, fetalDistres: boolean): {
  checklist: string[]
  metin: string
  eksik: string[]
} {
  const checklist = [
    'Endikasyon SB listesinden seçildi',
    'Karar zamanı damgalandı',
    fetalDistres ? 'Fetal distres / KTG notu eklendi' : 'Fetal distres yok — maternal/obstetrik gerekçe net',
    'Onam imzalandı (sezaryen şablonu)',
    'Robson grubu notu (isteğe bağlı performans)',
  ]
  const eksik: string[] = []
  if (!endikasyonlar.length) eksik.push('En az bir C/S endikasyonu')
  if (!kararAt) eksik.push('Karar zamanı')
  const metin = [
    '— Sezaryen endikasyon savunma notu —',
    `Karar: ${kararAt || '—'}`,
    `Endikasyon(lar): ${endikasyonlar.join('; ') || '—'}`,
    fetalDistres ? 'Fetal iyilik hali kaygısı belgelendi.' : 'Fetal distres iddiası yok.',
    'Bu not GÖREN/performans incelemesinde hekim gerekçesini desteklemek içindir.',
  ].join('\n')
  return { checklist, metin, eksik }
}

// ---------- Private pregnancy package ledger ----------
export type PaketKota = { kod: string; ad: string; limit: number; kullanilan: number }

export function paketDurum(kotalar: PaketKota[]): { satirlar: (PaketKota & { kalan: number; asildi: boolean })[]; ozet: string } {
  const satirlar = kotalar.map((k) => ({ ...k, kalan: Math.max(0, k.limit - k.kullanilan), asildi: k.kullanilan > k.limit }))
  const asilan = satirlar.filter((s) => s.asildi)
  return {
    satirlar,
    ozet: asilan.length ? `Kota aşıldı: ${asilan.map((s) => s.ad).join(', ')}` : 'Paket kotaları limit içinde',
  }
}

export const VARSAYILAN_PAKET: PaketKota[] = [
  { kod: 'vizit', ad: 'Poliklinik viziti', limit: 12, kullanilan: 0 },
  { kod: 'usg', ad: 'Obstetrik US', limit: 6, kullanilan: 0 },
  { kod: 'nst', ad: 'NST', limit: 8, kullanilan: 0 },
  { kod: 'lab', ad: 'Rutin lab paneli', limit: 4, kullanilan: 0 },
]

// ---------- İnfertilite deepen (still stops before IVF lab) ----------
export const INFERTILITE_ADIM1_FULL = [
  { kod: 'sure', ad: 'Deneme süresi (≥12 ay; ≥35 yaş ≥6 ay)', zorunlu: true },
  { kod: 'amh', ad: 'AMH', zorunlu: true },
  { kod: 'tsh_prl', ad: 'TSH + PRL', zorunlu: true },
  { kod: 'semen', ad: 'Semen analizi (partner sevk)', zorunlu: true },
  { kod: 'hsg', ad: 'HSG / SIS / 3D kavite', zorunlu: true },
  { kod: 'ovulasyon', ad: 'Ovülasyon / siklus takibi', zorunlu: true },
  { kod: 'tvus', ad: 'Bazal TVUS (AFC, endometrioma)', zorunlu: false },
  { kod: 'hsg_sonuc', ad: 'HSG sonucu kaydı (açıklık / hidrosalpenks)', zorunlu: false },
  { kod: 'sevk', ad: 'ÜYTE/IVF merkezine sevk paketi', zorunlu: true },
]

export function infertiliteSevkPaketi(tamamlanan: string[]): { eksik: string[]; sevkMetni: string; hazir: boolean } {
  const zorunlu = INFERTILITE_ADIM1_FULL.filter((x) => x.zorunlu)
  const eksik = zorunlu.filter((x) => !tamamlanan.includes(x.kod)).map((x) => x.ad)
  return {
    eksik,
    hazir: eksik.length === 0,
    sevkMetni: eksik.length
      ? `Sevk öncesi eksik: ${eksik.join('; ')}`
      : '1. basamak tamam — ÜYTE merkezine sevk. Notya IVF laboratuvarı / stimülasyon protokolü tutmaz.',
  }
}

// ---------- Ürojine / onkoloji sevk-quality ----------
export type UrojineSkor = { madde: string; var: boolean }

export function urojinePopqHizli(g: { stresInkontinans: boolean; sikilik: boolean; prolapsusSikayet: boolean; residual?: number | null }): {
  oncelik: 'dusuk' | 'orta' | 'yuksek'
  gorevler: string[]
  not: string
} {
  const puan = [g.stresInkontinans, g.sikilik, g.prolapsusSikayet].filter(Boolean).length
  const oncelik = puan >= 2 || (g.residual != null && g.residual > 100) ? 'yuksek' : puan === 1 ? 'orta' : 'dusuk'
  const gorevler: string[] = []
  if (g.stresInkontinans) gorevler.push('Öksürük stres testi + mesane günlüğü')
  if (g.prolapsusSikayet) gorevler.push('POP-Q ofis ölçümü veya ürojine sevk')
  if (g.sikilik) gorevler.push('İdrar kültürü + postvoid residual')
  return { oncelik, gorevler, not: 'Ürojinekoloji derin cerrahi Notya kapsamı dışı — sevk kalitesi hedeflenir' }
}

export function onkolojiIotaTriyaj(g: {
  kistSolid: boolean
  asit: boolean
  papiller: boolean
  dopplerGuclu: boolean
  ca125?: number | null
  menopoz: boolean
}): { risk: 'benign_olasi' | 'ara' | 'yuksek'; sevk: boolean; not: string[] } {
  const kirmizi = [g.kistSolid, g.asit, g.papiller, g.dopplerGuclu].filter(Boolean).length
  const not: string[] = []
  if (g.ca125 != null && g.ca125 > 35) not.push(`CA-125 ${g.ca125} — tek başına tanı koymaz`)
  if (g.menopoz && kirmizi >= 1) not.push('Postmenopoz + şüpheli kitle → hızlandırılmış sevk')
  const risk = kirmizi >= 2 ? 'yuksek' : kirmizi === 1 ? 'ara' : 'benign_olasi'
  return { risk, sevk: risk !== 'benign_olasi', not: [...not, 'IOTA basit triyaj — kesin skorlama onkoloji merkezinde'] }
}

// ---------- JINE-03: violence + KOK annual ----------
export function siddetTarama(evet: boolean | null): { durum: 'sorulmadi' | 'hayir' | 'evet'; gorevler: string[]; not: string } {
  if (evet === null) return { durum: 'sorulmadi', gorevler: [], not: 'Yıllık kontrolde tek onay kutusuyla sorun' }
  if (evet === false) return { durum: 'hayir', gorevler: [], not: 'Kaydedildi' }
  return {
    durum: 'evet',
    gorevler: [
      'Güvenli alan / mahremiyet sağlandı',
      'Yerel şiddet hattı / merkez sevk bilgisi verildi',
      'Adli süreç hasta isterse — hekim yönlendirir',
      'EC / CYBH / gebelik testi ihtiyacını değerlendir',
    ],
    not: 'Şiddet beyanı özel nitelikli veri — KVKK; aileye otomatik bildirim yok',
  }
}

export function kokYillikGuvenlik(baslangic: string, bugun: string): { due: string; maddeler: string[] } {
  const [y, m, d] = baslangic.split('-').map(Number)
  const dueDate = new Date(Date.UTC(y + 1, m - 1, d))
  // roll forward yearly
  while (dueDate.toISOString().slice(0, 10) < bugun) dueDate.setUTCFullYear(dueDate.getUTCFullYear() + 1)
  return {
    due: dueDate.toISOString().slice(0, 10),
    maddeler: ['TA ölçümü', 'Kilo / BMI', 'Sigara sorgusu', 'Migren/aura sorgusu', 'VTE semptom', 'Memede kitle sorgusu', 'İlaç uyumu'],
  }
}
