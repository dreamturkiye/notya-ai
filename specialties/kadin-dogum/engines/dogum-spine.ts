/**
 * NOTYA-KD-02 — Obstetrics spine engine (kadın-doğum only; visible via arac.branşlar = ['kadin_dogum']).
 * Pure functions: task generation from SAT/TDT, window status, miss alternatives, onam library, C/S indication list
 * (SB Sezaryen KP), partograf fields, preterm card, taburcu gate, complication catalogs, bebek task rules.
 * Locked: AI never locks tanı or writes C/S indication as official; screening positive ≠ diagnosis;
 * taburcu cannot finalize without NTP-1, HepB-1, VitK, işitme OR a documented exception; no drug auto-orders.
 */

export type GorevTuru = 'lab' | 'usg' | 'onam' | 'tarama' | 'karar' | 'ilac' | 'test' | 'plan'
export type GorevSablonu = {
  kod: string; ad: string; tur: GorevTuru
  baslangicHafta: number; bitisHafta: number   // window in completed weeks (inclusive), e.g. 11.0–13.86 → 11–13
  sert?: boolean                                // hard reminder; missing it triggers alternatives
  kacirilinca?: string                          // offered alternative when the window closes
  kosul?: 'rh_negatif' | 'gbs_toggle' | 'klinik_protokol' | 'pap_gerekli'
  not?: string
}

export const GOREV_SABLONLARI: GorevSablonu[] = [
  { kod: 'kan_grubu', ad: 'Kan grubu + Rh', tur: 'lab', baslangicHafta: 0, bitisHafta: 8 },
  { kod: 'cbc_1', ad: 'Tam kan sayımı', tur: 'lab', baslangicHafta: 0, bitisHafta: 8 },
  { kod: 'idrar_1', ad: 'Tam idrar tahlili + kültür', tur: 'lab', baslangicHafta: 0, bitisHafta: 8 },
  { kod: 'hbsag', ad: 'HBsAg', tur: 'lab', baslangicHafta: 0, bitisHafta: 8 },
  { kod: 'rubella', ad: 'Rubella IgG', tur: 'lab', baslangicHafta: 0, bitisHafta: 8 },
  { kod: 'tsh_1', ad: 'TSH', tur: 'lab', baslangicHafta: 0, bitisHafta: 8 },
  { kod: 'hiv_vdrl', ad: 'HIV + VDRL', tur: 'lab', baslangicHafta: 0, bitisHafta: 8, kosul: 'klinik_protokol' },
  { kod: 'pap', ad: 'Pap smear (zamanı geldiyse)', tur: 'test', baslangicHafta: 0, bitisHafta: 12, kosul: 'pap_gerekli' },
  { kod: 'onam_takip', ad: 'Gebelik takibi onamı', tur: 'onam', baslangicHafta: 0, bitisHafta: 12 },
  { kod: 'ikili_nt', ad: 'İKİLİ TARAMA + NT (11+0–13+6)', tur: 'tarama', baslangicHafta: 11, bitisHafta: 13, sert: true, kacirilinca: 'Pencere kapandı: üçlü/dörtlü tarama (16–20 hf) veya NIPT önerin; hasta ile konuşun.' },
  { kod: 'onam_nt', ad: '11–14 hf detaylı / NT onamı', tur: 'onam', baslangicHafta: 11, bitisHafta: 13 },
  { kod: 'uclu_dortlu', ad: 'Üçlü / dörtlü tarama (ikili yapılmadıysa veya ek)', tur: 'tarama', baslangicHafta: 16, bitisHafta: 20 },
  { kod: 'ayrintili_usg', ad: 'Ayrıntılı obstetrik US', tur: 'usg', baslangicHafta: 18, bitisHafta: 22 },
  { kod: 'onam_ayrintili', ad: 'Ayrıntılı US onamı', tur: 'onam', baslangicHafta: 16, bitisHafta: 20 },
  { kod: 'gdm', ad: 'GDM tarama (50 g / 75 g — klinik ayarı)', tur: 'tarama', baslangicHafta: 24, bitisHafta: 28, sert: true, kacirilinca: 'GDM taraması gecikti: en kısa sürede 75 g OGTT planlayın.' },
  { kod: 'cbc_2', ad: 'Tam kan sayımı (2. trimester)', tur: 'lab', baslangicHafta: 24, bitisHafta: 28 },
  { kod: 'rhogam', ad: 'Anti-D (Rh negatif ise)', tur: 'ilac', baslangicHafta: 28, bitisHafta: 28, kosul: 'rh_negatif', not: 'Hekim uygular/yazar; sistem yalnız hatırlatır.' },
  { kod: 'tdap', ad: 'Tdap aşısı (27–36 hf)', tur: 'ilac', baslangicHafta: 27, bitisHafta: 36 },
  { kod: 'gbs', ad: 'GBS sürüntü (35–37 hf)', tur: 'test', baslangicHafta: 35, bitisHafta: 37, kosul: 'gbs_toggle' },
  { kod: 'nst_1', ad: 'NST (36+ hf, haftalık)', tur: 'test', baslangicHafta: 36, bitisHafta: 41 },
  { kod: 'dogum_plani', ad: 'Doğum planı (NSD | elektif C/S | SSVD deneme)', tur: 'plan', baslangicHafta: 36, bitisHafta: 38, sert: true },
  { kod: 'onam_dogum', ad: 'Doğum onamı (planlanan yola göre)', tur: 'onam', baslangicHafta: 36, bitisHafta: 40 },
]

export type GorevDurumu = 'bekliyor' | 'pencerede' | 'kacirildi' | 'tamam' | 'atlandi'
export type Gorev = GorevSablonu & { hedefBaslangic: string; hedefBitis: string }

function haftaTarihi(satIso: string, hafta: number, gun = 0): string {
  const [y, m, d] = satIso.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + hafta * 7 + gun)).toISOString().slice(0, 10)
}

/** Generate the task list from SAT (or TDT → SAT = TDT − 280 g). Conditional tasks are included only when the condition holds. */
export function gorevleriUret(opts: { sat?: string | null; tdt?: string | null; rhNegatif?: boolean; gbsToggle?: boolean; klinikHivVdrl?: boolean; papGerekli?: boolean }): Gorev[] {
  let sat = opts.sat || null
  if (!sat && opts.tdt) { const [y, m, d] = opts.tdt.slice(0, 10).split('-').map(Number); sat = new Date(Date.UTC(y, m - 1, d - 280)).toISOString().slice(0, 10) }
  if (!sat) return []
  return GOREV_SABLONLARI.filter((g) => {
    if (g.kosul === 'rh_negatif') return !!opts.rhNegatif
    if (g.kosul === 'gbs_toggle') return opts.gbsToggle !== false
    if (g.kosul === 'klinik_protokol') return opts.klinikHivVdrl !== false
    if (g.kosul === 'pap_gerekli') return !!opts.papGerekli
    return true
  }).map((g) => ({ ...g, hedefBaslangic: haftaTarihi(sat!, g.baslangicHafta), hedefBitis: haftaTarihi(sat!, g.bitisHafta, 6) }))
}

export function gorevDurumu(g: Gorev, bugun: string, tamam: boolean, atlandi = false): GorevDurumu {
  if (tamam) return 'tamam'
  if (atlandi) return 'atlandi'
  if (bugun < g.hedefBaslangic) return 'bekliyor'
  if (bugun > g.hedefBitis) return 'kacirildi'
  return 'pencerede'
}

// ---------- Onam library (TJOD-style; V1 = printable PDF + checkbox; e-imza later) ----------
export type OnamSablonu = { kod: string; ad: string; olay: string; maddeler: string[]; ekKutu?: string; riskler: string[] }
export const ONAM_KUTUPHANESI: OnamSablonu[] = [
  { kod: 'gebelik_takibi', ad: 'Gebelik Takibi Bilgilendirme ve Onam', olay: 'takip', maddeler: ['Gebelik izlemi Sağlık Bakanlığı Doğum Öncesi Bakım Yönetimi Rehberi ve TJOD önerilerine göre planlanır.', 'İzlem sıklığı, tarama testleri ve ultrason zamanlamaları anlatıldı; tarama testleri tanı koymaz.', 'Anormal bulgularda ileri tetkik ve sevk gerekebilir.'], riskler: ['Tarama testlerinde yanlış pozitif/negatif olabilir.'] },
  { kod: 'nt_11_14', ad: '11–14 Hafta Detaylı Ultrason ve Ense Kalınlığı (NT) Onamı', olay: 'tarama', maddeler: ['NT ölçümü ve ikili tarama bir risk hesabıdır, tanı değildir.', 'Yüksek risk sonucunda NIPT, CVS veya amniyosentez seçenekleri anlatıldı.'], riskler: ['Fetal pozisyona bağlı ölçüm yapılamayabilir; tekrar gerekebilir.'] },
  { kod: 'ayrintili_usg', ad: 'Ayrıntılı Obstetrik Ultrason Onamı', olay: 'usg', maddeler: ['Ayrıntılı US yapısal anomalilerin bir kısmını gösterir; tüm anomalileri dışlamaz.', 'Görüntü kalitesi anne kilosu, fetal pozisyon ve amniyon miktarına bağlıdır.'], riskler: ['Saptama oranı %100 değildir.'] },
  { kod: 'amniyosentez', ad: 'Amniyosentez Onamı', olay: 'invazif', maddeler: ['Ultrason eşliğinde amniyon sıvısı alınır; genetik/enfeksiyon incelemesi yapılır.', 'Sonuç süresi ve olası tekrar anlatıldı.'], riskler: ['Düşük riski yaklaşık 1/300–1/500', 'Amniyon sızıntısı, enfeksiyon, kanama'] },
  { kod: 'cvs', ad: 'Koryon Villus Örneklemesi (CVS) Onamı', olay: 'invazif', maddeler: ['10–13. haftada plasentadan örnek alınır.'], riskler: ['Düşük riski yaklaşık 1/100–1/200', 'Plasental mozaisizm nedeniyle ek test gerekebilir'] },
  { kod: 'kordosentez', ad: 'Kordosentez Onamı', olay: 'invazif', maddeler: ['Göbek kordonundan fetal kan örneği alınır.'], riskler: ['Fetal kayıp riski %1–2', 'Kordon kanaması, bradikardi'] },
  { kod: 'vajinal_dogum', ad: 'Normal ve Müdahaleli Vajinal Doğum Onamı', olay: 'dogum', maddeler: ['Doğum eyleminde gerekirse oksitosin, amniyotomi, epizyotomi, vakum/forseps ve epidural uygulanabilir; her biri ayrıca anlatıldı.', 'Doğum sırasında anne/bebek güvenliği için acil sezaryene geçilebilir.'], riskler: ['Perine yırtığı, kanama, enfeksiyon', 'Omuz distosisi, fetal distres', 'Epidural: baş ağrısı, tansiyon düşmesi'] },
  { kod: 'sezaryen', ad: 'Sezaryen Onamı', olay: 'dogum', maddeler: ['Sezaryen endikasyonu ve alternatifleri anlatıldı.', 'Anestezi tipi (spinal / epidural / genel) anestezi hekimince ayrıca değerlendirilecektir.', 'Sonraki gebeliklerde uterus rüptürü ve plasenta yerleşim anomalisi riski artar.'], ekKutu: 'Aynı seansta TÜP LİGASYONU istiyorum (ayrı onam; kalıcı yöntem olduğu anlatıldı).', riskler: ['Kanama, transfüzyon, enfeksiyon, tromboemboli', 'Mesane/barsak yaralanması', 'Histerektomi gerekebilir (nadir)'] },
  { kod: 'ssvd', ad: 'Sezaryen Sonrası Vajinal Doğum (SSVD) Danışmanlık ve Onam', olay: 'dogum', maddeler: ['Önceki kesi tipi ve sayısı değerlendirildi; SSVD adaylığı anlatıldı.', 'Uterus rüptürü riski (yaklaşık %0,5–1) ve acil sezaryen olasılığı anlatıldı.', 'Sürekli fetal monitorizasyon yapılacaktır.'], riskler: ['Uterus rüptürü', 'Acil sezaryen', 'Başarısız deneme'] },
  { kod: 'dc_dusuk', ad: 'Düşük / Küretaj (D&C) Onamı', olay: 'jinekoloji', maddeler: ['Tıbbi ve cerrahi seçenekler anlatıldı.', 'Rh negatif ise anti-D uygulanacaktır.'], riskler: ['Kanama, enfeksiyon, uterus perforasyonu, Asherman'] },
  { kod: 'ektopik', ad: 'Ektopik Gebelik Cerrahisi Onamı', olay: 'jinekoloji', maddeler: ['Laparoskopi/laparotomi ile salpenjektomi veya salpingostomi yapılabilir.', 'Metotreksat seçeneği (uygunsa) anlatıldı.'], riskler: ['Kanama, transfüzyon', 'Tüp kaybı', 'Tekrar ektopik riski'] },
  { kod: 'kolposkopi', ad: 'Kolposkopi ve Biyopsi Onamı', olay: 'jinekoloji', maddeler: ['Anormal smear/HPV sonrası serviks incelemesi ve gerekirse biyopsi.'], riskler: ['Kanama, enfeksiyon'] },
  { kod: 'sunnet', ad: 'Sünnet Onamı (erkek bebek — ayrı belge)', olay: 'bebek', maddeler: ['İşlem, anestezi ve bakım anlatıldı; hipospadias/inmemiş testis varsa üroloji değerlendirmesi önce yapılır.'], riskler: ['Kanama, enfeksiyon, meatal stenoz'] },
]

// ---------- C/S indications (SB Sezaryen Klinik Protokolü list, doctor selects; never AI-locked) ----------
export const CS_ENDIKASYONLARI = ['Fetal distres / kategori III KTG', 'İlerlemeyen eylem (distosi)', 'Başarısız indüksiyon', 'Önceki sezaryen (SSVD kabul etmiyor / uygun değil)', 'Makat / transvers prezentasyon', 'Plasenta previa', 'Ablasyo plasenta', 'Kordon sarkması', 'Çoğul gebelik (uygun olmayan prezentasyon)', 'Makrozomi (tahmini ≥4500 g / DM ≥4000 g)', 'Baş-pelvis uygunsuzluğu', 'Aktif genital herpes', 'Preeklampsi / eklampsi (vajinal doğum uygun değilse)', 'Uterus rüptürü şüphesi', 'Anne isteği (bilgilendirilmiş, 39+ hf)', 'Diğer (açıklayınız)']

export const PARTOGRAF_ALANLARI = [
  { kod: 'servikal_acilma', ad: 'Serviks açıklığı (cm)', birim: 'cm' }, { kod: 'inis', ad: 'İniş (-3…+3)', birim: '' }, { kod: 'kasilma_10dk', ad: 'Kasılma / 10 dk', birim: 'adet' },
  { kod: 'kasilma_sure', ad: 'Kasılma süresi', birim: 'sn' }, { kod: 'fetal_kalp', ad: 'Fetal kalp hızı', birim: 'atım/dk' }, { kod: 'anne_nabiz', ad: 'Anne nabız', birim: '/dk' },
  { kod: 'ta_sistolik', ad: 'TA sistolik', birim: 'mmHg' }, { kod: 'ta_diastolik', ad: 'TA diastolik', birim: 'mmHg' }, { kod: 'ates', ad: 'Ateş', birim: '°C' }, { kod: 'idrar', ad: 'İdrar (ml / protein / keton)', birim: '' },
  { kod: 'amniyon', ad: 'Amniyon (intakt / berrak / mekonyum / kanlı)', birim: '' }, { kod: 'oksitosin', ad: 'Oksitosin (mU/dk)', birim: 'mU/dk' }, { kod: 'ilac', ad: 'İlaç / analjezi', birim: '' },
] as const

/** WHO modified partograph alert/action logic on the active phase: <1 cm/h over 4 h → alert; dilation stalled ≥4 h → action. */
export function partografUyari(satirlar: { zaman: string; servikal_acilma?: number | null }[]): { uyari: string | null; aksiyon: string | null } {
  const s = satirlar.filter((r) => typeof r.servikal_acilma === 'number').sort((a, b) => a.zaman.localeCompare(b.zaman))
  if (s.length < 2) return { uyari: null, aksiyon: null }
  const aktif = s.filter((r) => (r.servikal_acilma as number) >= 4)
  if (aktif.length < 2) return { uyari: null, aksiyon: null }
  const ilk = aktif[0], son = aktif[aktif.length - 1]
  const saat = (new Date(son.zaman).getTime() - new Date(ilk.zaman).getTime()) / 3.6e6
  const hiz = ((son.servikal_acilma as number) - (ilk.servikal_acilma as number)) / Math.max(saat, 0.01)
  if (saat >= 4 && (son.servikal_acilma as number) === (ilk.servikal_acilma as number)) return { uyari: 'Uyarı çizgisi geçildi', aksiyon: 'Aksiyon çizgisi: ≥4 saat ilerleme yok — eylem yönetimini yeniden değerlendirin (amniyotomi/oksitosin/C/S kararı hekimindir).' }
  if (saat >= 2 && hiz < 1) return { uyari: `Uyarı çizgisi: açılma hızı ${hiz.toFixed(1)} cm/sa (<1 cm/sa)`, aksiyon: null }
  return { uyari: null, aksiyon: null }
}

// ---------- Preterm card (checklist + suggestion; never an order) ----------
export type PretermKart = { hafta: number; pprom: boolean; dogum24saatIcinde: boolean }
export function pretermOnerileri(k: PretermKart): { madde: string; neden: string }[] {
  const out: { madde: string; neden: string }[] = []
  if (k.hafta >= 24 && k.hafta < 34) out.push({ madde: 'Antenatal kortikosteroid: betametazon 12 mg IM ×2 (24 saat ara) — hekim kararı', neden: '24+0–33+6 hf, 7 gün içinde doğum riski' })
  if (k.hafta >= 34 && k.hafta < 37 && !k.pprom) out.push({ madde: 'Geç preterm steroid: bireysel karar (ACOG)', neden: '34+0–36+6 hf' })
  if (k.hafta <= 32 && k.dogum24saatIcinde) out.push({ madde: 'MgSO4 fetal nöroproteksiyon — hekim kararı', neden: '≤32 hf ve doğum 24 saat içinde bekleniyor' })
  if (k.pprom) { out.push({ madde: 'PPROM antibiyotik profilaksisi (latans) — hekim kararı', neden: 'PPROM' }); out.push({ madde: 'Koryoamniyonit izlemi: ateş, uterin hassasiyet, anne/fetal taşikardi, CRP/WBC', neden: 'PPROM' }) }
  if (!k.pprom && k.hafta < 34) out.push({ madde: 'Tokoliz (steroid penceresi için, 48 saat) — kontrendikasyon yoksa, hekim kararı', neden: '<34 hf' })
  if (k.hafta < 34) out.push({ madde: 'YDYBÜ olan merkeze doğum planı / sevk', neden: '<34 hf' })
  return out
}

// ---------- Taburcu gate ----------
export type TaburcuChecklist = { ntp1: boolean; ntp2_randevu: boolean; hepb1: boolean; vitk: boolean; isitme: boolean; pulseox: boolean; kirmizi_refleks: boolean; gkd: boolean; dvit: boolean; emzirme: boolean }
export type TaburcuIstisna = { tur: 'red' | 'erken_taburcu' | 'sevk'; aciklama: string } | null
export function taburcuKurali(c: Partial<TaburcuChecklist>, istisna: TaburcuIstisna): { kapatilabilir: boolean; zorunluEksik: string[]; onerilenEksik: string[] } {
  const zorunlu: [keyof TaburcuChecklist, string][] = [['ntp1', 'NTP-1 (topuk kanı, 3–5. gün)'], ['hepb1', 'Hepatit B aşısı 1. doz'], ['vitk', 'K vitamini'], ['isitme', 'İşitme taraması']]
  const onerilen: [keyof TaburcuChecklist, string][] = [['ntp2_randevu', 'NTP-2 randevusu (ASM, 3–5 g)'], ['pulseox', 'Pulse oksimetre (KKH taraması)'], ['kirmizi_refleks', 'Kırmızı refleks'], ['gkd', 'GKD muayenesi → kalça US planı'], ['dvit', 'D vitamini 3 damla/gün'], ['emzirme', 'Emzirme danışmanlığı']]
  const zorunluEksik = zorunlu.filter(([k]) => !c[k]).map(([, ad]) => ad)
  const onerilenEksik = onerilen.filter(([k]) => !c[k]).map(([, ad]) => ad)
  const istisnaGecerli = !!istisna && istisna.aciklama.trim().length >= 10
  return { kapatilabilir: zorunluEksik.length === 0 || istisnaGecerli, zorunluEksik, onerilenEksik }
}

// ---------- Complications ----------
export const ANNE_KOMPLIKASYONLARI = ['Uterin atoni / PPH', 'Plasenta retansiyonu', 'Mesane hasarı', 'Endometrit', 'Yara enfeksiyonu', 'Tromboemboli', 'Postpartum preeklampsi', 'Mastit', 'Perine yırtığı 3–4°', 'Anemi (transfüzyon)', 'Postpartum depresyon taraması (EPDS ≥13)']
export const BEBEK_KOMPLIKASYONLARI = ['Asfiksi / düşük Apgar', 'Mekonyum aspirasyonu', 'TTN', 'Hipoglisemi', 'Sarılık (fototerapi)', 'Omuz distosisi', 'Doğum travması (klavikula, brakiyal pleksus)', 'Sepsis şüphesi', 'RDS']
export const ERKEK_BEBEK_EK = ['Hipospadias → üroloji görevi', 'İnmemiş testis → üroloji görevi (6. ay kontrol)', 'Sünnet onamı (ayrı belge)']

export function pphKarti(tahminMl: number | null): { acil: boolean; siniflama: string } {
  if (tahminMl == null) return { acil: false, siniflama: '—' }
  if (tahminMl >= 1000) return { acil: true, siniflama: 'Majör PPH (≥1000 ml)' }
  if (tahminMl >= 500) return { acil: true, siniflama: 'Minör PPH (500–999 ml)' }
  return { acil: false, siniflama: 'Normal kanama (<500 ml)' }
}

// ---------- Bebek tasks at birth (owned by pediatri after) ----------
export type BebekDogumBilgisi = { hafta: number; kiloGram: number | null; cinsiyet: 'K' | 'E' | null; komplikasyonlar: string[]; canli: boolean }
export function bebekGorevleri(b: BebekDogumBilgisi): { kod: string; ad: string; sahip: 'pediatri' | 'uroloji' | 'kd' }[] {
  if (!b.canli) return []
  const out: { kod: string; ad: string; sahip: 'pediatri' | 'uroloji' | 'kd' }[] = [
    { kod: 'ntp1', ad: 'NTP-1 topuk kanı (3–5. gün)', sahip: 'pediatri' }, { kod: 'hepb1', ad: 'Hepatit B 1. doz', sahip: 'pediatri' }, { kod: 'vitk', ad: 'K vitamini', sahip: 'pediatri' },
    { kod: 'isitme', ad: 'İşitme taraması', sahip: 'pediatri' }, { kod: 'pulseox', ad: 'Pulse oksimetre KKH taraması', sahip: 'pediatri' }, { kod: 'kirmizi_refleks', ad: 'Kırmızı refleks', sahip: 'pediatri' },
    { kod: 'gkd', ad: 'GKD muayenesi → kalça US (4–6 hf)', sahip: 'pediatri' }, { kod: 'dvit', ad: 'D vitamini 3 damla/gün', sahip: 'pediatri' },
  ]
  if (b.hafta < 34 || (b.kiloGram != null && b.kiloGram < 2000)) out.push({ kod: 'ydybu', ad: 'YDYBÜ sevk / değerlendirme (<34 hf veya <2000 g)', sahip: 'pediatri' })
  if (b.hafta < 34 || (b.kiloGram != null && b.kiloGram <= 1500)) out.push({ kod: 'rop', ad: 'ROP taraması (göz, 4. hafta)', sahip: 'pediatri' })
  if (b.cinsiyet === 'E') out.push({ kod: 'uro_muayene', ad: 'Erkek bebek: hipospadias / inmemiş testis muayenesi', sahip: 'pediatri' })
  if (b.komplikasyonlar.some((k) => /hipospadias|inmemiş/i.test(k))) out.push({ kod: 'uroloji', ad: 'Üroloji görevi (hipospadias / inmemiş testis)', sahip: 'uroloji' })
  if (b.komplikasyonlar.some((k) => /sarılık/i.test(k))) out.push({ kod: 'bilirubin', ad: 'Bilirubin kontrolü', sahip: 'pediatri' })
  return out
}

export const LOHUSA_ZIYARETLERI = [{ kod: 'lohusa_1', ad: 'Lohusa izlem 1 (2–5. gün)', gunBas: 2, gunBit: 5 }, { kod: 'lohusa_2', ad: 'Lohusa izlem 2 (13–17. gün)', gunBas: 13, gunBit: 17 }, { kod: 'lohusa_3', ad: 'Lohusa izlem 3 (30–40. gün)', gunBas: 30, gunBit: 40 }]
