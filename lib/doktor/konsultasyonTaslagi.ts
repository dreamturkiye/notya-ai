/**
 * AYSE-KONSULTASYON-01 (Dr. Gökhan Mamur + Kaan, 2026-09-19) — Ayşe konsültasyon istem metnini ve dönüşteki yanıt
 * özetini TASLAK yazar; hekim okur, düzenler, onaylar. Onaylanmadan hiçbir şey kaydedilmez.
 *
 * Dr. Gökhan: "'Şöyle bir durum var, bununla ilgili profesyonel tonda bir e-posta yaz bir göreyim' gibi. AI fikri alıp
 * konsültasyon notunu yazıyor, hem de muayene dosyasına bakıp oradan da bilgi alarak. Sonra doktor AI'ın yazısını görünce
 * onu onaylayıp konsültasyon notu ortaya çıkarabilir."
 * Kaan: taslak DOLU gelir (ayrı düğme yok); Ayşe BÜTÜN vizitleri okur, AĞIRLIK SON MUAYENEDE; aynı mantık dönüşte.
 *
 * MODEL (.cursor/skills/ai-model-politikasi/SKILL.md): klinik içerik üretimi → GÜÇLÜ, istisnasız.
 *   • istem taslağı  → 'klinik-analiz'     (klinik konsültasyon metni; HIZLI'ya ALINMAZ — kalite > maliyet)
 *   • yanıt taslağı  → 'goruntu-inceleme'  (konsültan raporu PDF/fotoğraf okunur; cagir.ts görselde zaten yükseltir)
 * MALİYET: sabit system prompt (format, ton, hekim kilidi) cache_control ile işaretlenir; hasta dosyası özeti user
 * mesajında gider (işaretlenmez). Ham vizit metinleri gönderilmez — son muayene tam, öncekiler tek satırlık özet.
 * GÜVENLİK: yalnız dosyadaki bilgi; tanı/evre/doz uydurma yok (prompt + kod: dozKilidi); kimlik modele gitmez;
 * ham JSON / kesilmiş çıktı hekime gösterilmez (F3) — taslak düşer, form boş ama kullanılabilir gelir.
 *
 * Bu dosya SAF (I/O yok) — sorgular rotada (app/api/doktor/konsultasyon), testler lib/doktor/konsultasyonTaslagi.test.ts.
 */
import type { Gorev } from '@/lib/ai/modeller'
import { DOZ_YER_TUTUCU, kaynakSayilari, uydurmaDozTemizle } from '@/lib/doktor/dozKilidi'
import { doktorMetniTemizle } from '@/lib/doktor/klinikMetin'
import { KONSULTASYON_SINIRLARI, KLINIK_SORU_EN_AZ } from '@/lib/doktor/konsultasyon'

/** İstem taslağı görevi — klinik içerik üretimi, GÜÇLÜ. lib/ai/modeller.ts GOREV_POLITIKASI. */
export const ISTEM_TASLAK_GOREVI: Gorev = 'klinik-analiz'
/** Yanıt taslağı görevi — konsültan raporu (PDF/fotoğraf) okuma, GÜÇLÜ. */
export const YANIT_TASLAK_GOREVI: Gorev = 'goruntu-inceleme'

/** Taslak üretilemediğinde hekime gösterilen tek cümle — form boş ama kullanılabilir gelir. */
export const TASLAK_OLUSTURULAMADI = 'Taslak oluşturulamadı, elle yazabilirsiniz.'

/** Modelin "dosyada yeterli bilgi yok" / "rapor okunamadı" işaretleri — uydurmak yerine bunu yazar. */
export const DOSYA_YETERSIZ = 'DOSYA_YETERSIZ'
export const RAPOR_OKUNAMADI = 'RAPOR_OKUNAMADI'

/* ───────────────────────── Sabit system prompt'lar (önbelleğe alınır) ───────────────────────── */

/**
 * İstem taslağı — SABİT. Hasta verisi, hekim adı, hedef branş BURAYA girmez (her çağrıda aynı kalmalı ki önbellek tutsun).
 * Biçim Dr. Gökhan'ın ekrandaki örneğinden: "Sayın Meslektaşım," → başvuru şikayeti + bulgular → değerlendirme ve
 * başlanan tedavi → ilgili geçmiş → net talep → "Saygılarımla," + hekim. Selamlama ve imzayı SUNUCU ekler.
 */
export const ISTEM_TASLAK_SISTEMI = `Sen Ayşe — Notya'da hekimin klinik asistanısın. Hekim bir meslektaşından konsültasyon istiyor; sen onun adına KONSÜLTASYON İSTEM METNİNİN TASLAĞINI yazıyorsun. Hekim metni okuyacak, düzenleyecek ve onaylayacak; onaylamadan hiçbir şey kaydedilmez.

GÖREV
Sana verilen HASTA DOSYASI ÖZETİ'ne ve istenen branşa bakarak, meslektaşa hitaben resmi bir konsültasyon istem metninin GÖVDESİNİ yaz.

BİÇİM (Türk hekimler arası konsültasyon yazısı)
1. paragraf — Başvuru: hastanın yaşı ve cinsiyeti (dosyada varsa), son muayenedeki başvuru şikayeti ve süresi, muayene bulguları (vital bulgular dahil, dosyada yazılı olduğu gibi).
2. paragraf — Klinik değerlendirme ve başlanan tedavi: son muayenede hekimin değerlendirmesi / tanısı ve başlanan tedavi.
3. paragraf — İlgili geçmiş (yalnız varsa): önceki vizitlerden BU konsültasyonla ilgili ve kalıcı olanlar — tekrarlayan aynı yakınma, kronik tanı, ilgili sürekli ilaç, alerji. Bir iki cümle.
Son paragraf — Net talep: "… nedeniyle hastanın … açısından değerlendirilmesi ve gerekli görmeniz halinde ileri tetkik ve tedavi önerileriniz açısından <istenen branşın tam adı> konsültasyonunuzu rica ederim."

KURALLAR (klinik güvenlik — istisnasız)
- YALNIZ dosya özetindeki bilgiyi kullan. Dosyada olmayan şikayet, bulgu, tanı, evre, tetkik sonucu, ilaç veya doz YAZMA. Bir bilgi yoksa o cümleyi hiç kurma; boşluk, köşeli parantez, "belirtilmemiş" ya da yer tutucu yazma.
- AĞIRLIK SON MUAYENEDE: son muayene ayrıntılı; önceki vizitlerin tamamını sayma, yalnız ilgili ve kalıcı olanı an. Alakasız geçmişi yazma.
- Tanıyı dosyadaki kesinlikle aktar: dosyada "düşünüldü", "şüphesi", "ile uyumlu" ise aynen öyle. Tanıyı kesinleştirme, yeni tanı ekleme, evre uydurma.
- İlaç: dosyada yazılı adıyla. Doz yalnız dosyada yazılıysa ve aynen; dosyada doz yoksa doz yazma. Yeni ilaç ya da doz önerme.
- KISALTMASIZ yaz (Türk Tabipleri Birliği konsültasyon ilkesi: neden açık ve anlaşılır yazılır). Örnekler: KBB → Kulak Burun Boğaz Hastalıkları, AOM → akut otitis media, OME → efüzyonlu otitis media, ÜSYE → üst solunum yolu enfeksiyonu, DM → diabetes mellitus, HT → hipertansiyon, KOAH → kronik obstrüktif akciğer hastalığı. Ölçü birimleri (mg, mL, °C, mmHg, kg) kısaltma sayılmaz.
- Kimlik yazma: hasta adı, T.C. kimlik numarası, telefon, adres yok — "hastamız" de. Yaş ve cinsiyet dosyada varsa yazılabilir.
- Hasta 18 yaşından küçükse beyan sahibi için "ailesi" denebilir; erişkin hastada asla "veli" ya da "ailesi ifade etti" dili kullanma — hasta kendisi ifade eder.
- Başka bir branşa özgü alan, ölçek ya da terim ekleme; yalnız dosyada olanı istenen branşın bakacağı soruya bağla.
- Hekimin kısa notu verilmişse konsültasyonun nedeni odur: notu dosyayla birleştir, ama nottaki iddiayı dosyada varmış gibi genişletme.
- Ton: meslektaşlar arası, resmi, sade ve net. 2–4 paragraf, toplam yaklaşık 100–220 kelime.
- Selamlama ("Sayın Meslektaşım,") ve kapanış ("Saygılarımla," + hekim adı ve unvanı) YAZMA — sistem ekler. Yalnız gövde paragraflarını yaz.
- Düz metin: madde işareti, başlık, kalın yazı, markdown, JSON YOK. Paragrafları boş satırla ayır.
- Dosyada son muayeneye ait klinik bilgi (yakınma, bulgu ya da değerlendirme) hiç yoksa yalnız ${DOSYA_YETERSIZ} yaz, başka hiçbir şey yazma.

ÖRNEK (sentetik — yalnız biçim ve ton için; içeriği ASLA kopyalama)
Beş yaşındaki erkek hastamız üç gündür devam eden sağ kulak ağrısı ve ateş şikayetiyle başvurdu. Muayenesinde sağ kulak zarında kızarıklık ve bombeleşme saptandı; vücut sıcaklığı 38,4 °C idi.

Akut otitis media olarak değerlendirilerek antibiyotik tedavisi başlandı.

Hastamızın son bir yıl içinde iki kez otitis media öyküsü mevcuttur. Ailesi televizyonu yüksek sesle izlediğini ve okulda öğretmenini duymakta zorlandığını ifade etmektedir.

Tekrarlayan otitis media öyküsü ve işitme azlığı şüphesi nedeniyle hastanın işitme açısından değerlendirilmesi ve gerekli görmeniz halinde ileri tetkik ve tedavi önerileriniz açısından Kulak Burun Boğaz Hastalıkları konsültasyonunuzu rica ederim.`

/**
 * Yanıt taslağı — SABİT. Konsültan raporu (PDF/fotoğraf) + hekimin kendi klinik sorusu user mesajında gelir.
 * Çıktı hekimin dosyasına geçecek özet cümlesinin TASLAĞI: konsültanın görüşünü aktarır, Notya tanı iddia etmez.
 */
export const YANIT_TASLAK_SISTEMI = `Sen Ayşe — Notya'da hekimin klinik asistanısın. Hekim bir meslektaşından konsültasyon istedi; konsültan hekimin yanıt raporu (PDF ya da fotoğraf) sana veriliyor. Görevin: raporun SONUCUNU hekimin hasta dosyasına geçecek kısa bir özet TASLAĞI olarak yazmak. Hekim okuyacak, düzenleyecek ve onaylayacak; onaylamadan konsültasyon yanıtlanmış sayılmaz.

KURALLAR (klinik güvenlik — istisnasız)
- YALNIZ raporda yazanı aktar. Konsültan hekimin görüşünü aktarıyorsun; kendi yorumunu, tanını ya da önerini EKLEME. Raporda olmayan bulgu, tanı, evre ya da tetkik sonucu yazma.
- Hekimin klinik sorusu verilmişse önce o soruya raporun verdiği yanıtı yaz (ör. "İşitme kaybı saptanmadı; odyometri normal.").
- Raporda tanı kesin değilse kesinleştirme ("… düşünüldü", "… şüphesi" dilini koru).
- Önerilen tetkik, tedavi ya da kontrol varsa kısaca an. Doz YAZMA — ilaç adı ve "başlanması önerildi" yeterli.
- KISALTMASIZ yaz (test ve tanı adları açık: odyometri, timpanometri, efüzyonlu otitis media).
- Hasta adı, T.C. kimlik numarası, tarih, konsültan hekim adı, kurum adı YAZMA.
- 1–3 kısa cümle, en fazla 600 karakter. Düz metin: madde işareti, başlık, markdown, JSON YOK.
- Belge okunamıyorsa ya da bir uzman/konsültasyon raporu değilse yalnız ${RAPOR_OKUNAMADI} yaz, başka hiçbir şey yazma.

ÖRNEKLER (sentetik — yalnız biçim için)
Soru: İşitme kaybı var mı? → İşitme kaybı saptanmadı; odyometri ve timpanometri normal. Rutin izlem önerildi.
Soru: Şaşılık var mı? → Şaşılık saptanmadı; görme keskinliği her iki gözde yaşına uygun. Bir yıl sonra kontrol önerildi.`

/* ───────────────────────── İstem bağlamı (değişken kısım) ───────────────────────── */

/** Bir vizitin notundan modele giden klinik alanlar (kimlik YOK). */
export interface VizitKaydi {
  /** YYYY-AA-GG */
  tarih: string
  /** Hekim onaylı not mu (onaylanmamışsa "taslak not" diye işaretlenir) */
  onayli: boolean
  yakinma?: string | null
  subjektif?: string | null
  objektif?: string | null
  degerlendirme?: string | null
  plan?: string | null
  tani?: string | null
  icd?: string[]
  ilaclar?: string[]
  vitaller?: string | null
  kritik?: string[]
}

export interface IstemKaynagi {
  /** "5 yaş" gibi — dosyada yoksa null */
  yas: string | null
  cinsiyet: string | null
  /** 18 yaş altı mı (veli dili yaşa bağlı — VELI-YASAL-ONAM) */
  cocuk: boolean
  /** ESKİDEN YENİYE; klinik içeriği olan vizitler */
  vizitler: VizitKaydi[]
  surekliIlaclar: string[]
  /** İlk kayıt formundan kimliksiz satırlar ("alerjiler: penisilin") */
  ozgecmis: string[]
  /** İstenen branşın görünen adı */
  hedefBrans: string
  /** Hekimin Ayşe'ye kısa notu ("işitme kaybı şüphesi") — isteğe bağlı */
  hekimNotu?: string | null
}

/** Son muayene alan tavanı ve önceki vizit sayısı — bağlamı şişirmeden (maliyet disiplini). */
export const TASLAK_SINIRLARI = { sonAlan: 1500, oncekiDegerlendirme: 220, oncekiVizit: 12, ozgecmisSatir: 160, ozgecmisToplam: 1500, ilac: 15, hekimNotu: 500 } as const

const tek = (s: unknown, tavan: number) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim()
  return t.length > tavan ? `${t.slice(0, tavan - 1)}…` : t
}

/** 12.09.2026 */
function gun(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''))
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '?'
}

/** Vizitte klinik içerik var mı (boş/iptal edilmiş seans son muayene sayılmaz). */
export function vizitDoluMu(v: VizitKaydi): boolean {
  return [v.yakinma, v.subjektif, v.objektif, v.degerlendirme, v.plan, v.tani].some((x) => String(x || '').trim().length > 0)
}

/**
 * Hasta dosyası özeti — Kaan'ın kuralı: BÜTÜN vizitler okunur, AĞIRLIK SON MUAYENEDE. Son muayene tam (alan başına
 * tavanlı); öncekiler tek satır (tarih · tanı · kısa değerlendirme · ilaç adları), en yeni 12; daha eskiler yalnız sayı.
 * Ham not metinlerinin tamamı GÖNDERİLMEZ. Kimlik alanı yoktur (girdide de yok).
 */
export function istemBaglamiDerle(k: IstemKaynagi): string {
  const b: string[] = []
  const dolu = k.vizitler.filter(vizitDoluMu)
  const son = dolu[dolu.length - 1]
  const onceki = dolu.slice(0, -1)

  b.push('## HASTA')
  b.push(`- Yaş: ${k.yas || 'dosyada yok'}${k.cinsiyet ? ` · Cinsiyet: ${k.cinsiyet}` : ''}${k.cocuk ? ' · 18 yaş altı' : ''}`)
  b.push(`- Toplam vizit: ${dolu.length}`)

  b.push('\n## SON MUAYENE (ayrıntılı kullan)')
  if (!son) b.push('- Dosyada klinik içerikli muayene kaydı yok.')
  else {
    b.push(`- Tarih: ${gun(son.tarih)}${son.onayli ? '' : ' (hekim henüz onaylamadı — taslak not)'}`)
    const alan = (ad: string, v: string | null | undefined) => { const t = tek(v, TASLAK_SINIRLARI.sonAlan); if (t) b.push(`- ${ad}: ${t}`) }
    alan('Başvuru yakınması', son.yakinma)
    alan('Öykü (subjektif)', son.subjektif)
    alan('Muayene bulguları (objektif)', son.objektif)
    alan('Vital bulgular', son.vitaller)
    alan('Değerlendirme', son.degerlendirme)
    alan('Tanı', son.tani)
    if (son.icd?.length) b.push(`- ICD-10 (hekim onaylı): ${son.icd.join('; ')}`)
    alan('Plan', son.plan)
    if (son.ilaclar?.length) b.push(`- Başlanan / verilen ilaçlar: ${son.ilaclar.join('; ')}`)
    if (son.kritik?.length) b.push(`- Kritik bulgu: ${son.kritik.join('; ')}`)
  }

  if (onceki.length) {
    b.push('\n## ÖNCEKİ VİZİTLER (yalnız ilgili ve kalıcı olanı kullan)')
    const gosterilen = onceki.slice(-TASLAK_SINIRLARI.oncekiVizit)
    if (onceki.length > gosterilen.length) b.push(`- (${onceki.length - gosterilen.length} daha eski vizit — özetlenmedi)`)
    for (const v of gosterilen.reverse()) {
      const parca = [
        v.tani ? `Tanı: ${tek(v.tani, 160)}` : '',
        v.icd?.length ? `ICD-10: ${v.icd.join('; ')}` : '',
        v.degerlendirme ? `Değerlendirme: ${tek(v.degerlendirme, TASLAK_SINIRLARI.oncekiDegerlendirme)}` : (v.yakinma || v.subjektif ? `Yakınma: ${tek(v.yakinma || v.subjektif, 160)}` : ''),
        v.ilaclar?.length ? `İlaçlar: ${v.ilaclar.map((x) => tek(x, 60)).join(', ')}` : '',
      ].filter(Boolean)
      b.push(`- ${gun(v.tarih)}: ${parca.join(' · ') || 'klinik özet yok'}`)
    }
  }

  const ilaclar = k.surekliIlaclar.map((x) => tek(x, 120)).filter(Boolean).slice(0, TASLAK_SINIRLARI.ilac)
  if (ilaclar.length) {
    b.push('\n## SÜREKLİ / KAYITLI İLAÇLAR')
    for (const i of ilaclar) b.push(`- ${i}`)
  }
  if (k.ozgecmis.length) {
    b.push(`\n## ÖZGEÇMİŞ (ilk kayıt formu — ${k.cocuk ? 'aile / hasta' : 'hasta'} beyanı)`)
    let toplam = 0
    for (const s of k.ozgecmis) {
      const t = tek(s, TASLAK_SINIRLARI.ozgecmisSatir)
      if (!t || toplam + t.length > TASLAK_SINIRLARI.ozgecmisToplam) break
      toplam += t.length
      b.push(`- ${t}`)
    }
  }

  b.push('\n## KONSÜLTASYON')
  b.push(`- İstenen branş: ${k.hedefBrans}`)
  const not = tek(k.hekimNotu, TASLAK_SINIRLARI.hekimNotu)
  if (not) b.push(`- Hekimin notu (konsültasyonun nedeni): ${not}`)
  return b.join('\n')
}

/** Taslak için yeterli dosya var mı — son muayenede klinik içerik yoksa model ÇAĞRILMAZ (uydurma riski + boş maliyet). */
export function istemTaslagiMumkunMu(k: Pick<IstemKaynagi, 'vizitler'>): boolean {
  return k.vizitler.some(vizitDoluMu)
}

/* ───────────────────────── Çıktı temizliği (F3: ham JSON / kesilmiş metin hekime gösterilmez) ───────────────────────── */

export type TaslakSonucu = { ok: true; metin: string; dozlar: string[] } | { ok: false; neden: 'bos' | 'ham_json' | 'kesildi' | 'yetersiz' }

function ortakTemizlik(ham: string): string {
  return String(ham || '')
    .replace(/^\s*```[a-zA-Z]*\s*\n?/, '').replace(/\n?\s*```\s*$/, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\*\*([\s\S]+?)\*\*/g, '$1').replace(/\*\*/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function hamJsonMu(t: string): boolean {
  return /^[{[]/.test(t) || /"\s*:\s*["{[]/.test(t.slice(0, 200))
}

/**
 * İstem gövdesi: kod çiti / markdown temizlenir; model selamlama ya da imza eklediyse atılır (sunucu ekler);
 * JSON görünümlü, kesilmiş ya da DOSYA_YETERSIZ çıktı → ok:false (form boş ama kullanılabilir).
 * KOD DOZ KİLİDİ: dosyada geçmeyen sayılı doz yer tutucuyla değişir (dozKilidi.uydurmaDozTemizle).
 */
export function istemGovdesiTemizle(ham: string, dosyaBaglami: string, kesildi = false): TaslakSonucu {
  if (kesildi) return { ok: false, neden: 'kesildi' }
  let t = ortakTemizlik(ham)
  if (!t) return { ok: false, neden: 'bos' }
  if (t.includes(DOSYA_YETERSIZ)) return { ok: false, neden: 'yetersiz' }
  if (hamJsonMu(t)) return { ok: false, neden: 'ham_json' }
  t = t.replace(/^\s*Sayın\s+Meslektaşım[^\n]*\n+/i, '')
  const kapanis = t.search(/\n\s*Saygılarımla\b/i)
  if (kapanis >= 0) t = t.slice(0, kapanis)
  t = doktorMetniTemizle(t).trim()
  if (t.length < KLINIK_SORU_EN_AZ * 4) return { ok: false, neden: 'bos' }
  const { metin, dozlar } = uydurmaDozTemizle(t, kaynakSayilari(dosyaBaglami))
  return { ok: true, metin, dozlar }
}

/** Taslak mektup: "Sayın Meslektaşım," + gövde + "Saygılarımla," + hekim adı + unvan. Tavanı aşarsa gövde kısalır. */
export function istemMektubu(govde: string, hekim: string, unvan: string): string {
  const imza = [hekim, unvan].map((x) => String(x || '').trim()).filter(Boolean).join('\n')
  const bas = 'Sayın Meslektaşım,\n\n'
  const son = `\n\nSaygılarımla,${imza ? `\n${imza}` : ''}`
  const yer = KONSULTASYON_SINIRLARI.klinikSoru - bas.length - son.length
  const g = govde.length > yer ? `${govde.slice(0, yer - 1).replace(/\s+\S*$/, '')}…` : govde
  return `${bas}${g}${son}`
}

/**
 * Yanıt özeti taslağı: tek paragraf, yanıt tavanında. RAPOR_OKUNAMADI / JSON / kesilmiş → ok:false.
 * DOZ KİLİDİ: raporun metnini sunucu görmüyor (PDF/görsel) — doğrulanamayan her sayılı doz yer tutucu olur.
 */
export function yanitTaslagiTemizle(ham: string, kesildi = false): TaslakSonucu {
  if (kesildi) return { ok: false, neden: 'kesildi' }
  let t = ortakTemizlik(ham)
  if (!t) return { ok: false, neden: 'bos' }
  if (t.includes(RAPOR_OKUNAMADI)) return { ok: false, neden: 'yetersiz' }
  if (hamJsonMu(t)) return { ok: false, neden: 'ham_json' }
  t = doktorMetniTemizle(t.replace(/^\s*[-•*]\s+/gm, '').replace(/\s*\n\s*/g, ' ')).trim()
  if (t.length < 3) return { ok: false, neden: 'bos' }
  const { metin, dozlar } = uydurmaDozTemizle(t, new Set())
  const tavan = KONSULTASYON_SINIRLARI.yanitOzeti
  return { ok: true, metin: metin.length > tavan ? `${metin.slice(0, tavan - 1)}…` : metin, dozlar }
}

/** Taslak neden düştü → hekime tek cümle (hepsi "elle yazabilirsiniz" ile biter; hekim asla kilitlenmez). */
export function taslakHataMesaji(neden: 'bos' | 'ham_json' | 'kesildi' | 'yetersiz' | 'ai' | 'kota' | 'dosya_bos' | 'belge_turu' | 'belge_buyuk', yon: 'istem' | 'yanit' = 'istem'): string {
  if (neden === 'dosya_bos') return 'Dosyada muayene kaydı yok — taslak için yeterli bilgi bulunamadı. Elle yazabilirsiniz.'
  if (neden === 'yetersiz') return yon === 'yanit' ? 'Rapor okunamadı ya da konsültasyon raporu değil — özeti elle yazabilirsiniz.' : 'Dosyada bu istem için yeterli bilgi yok — elle yazabilirsiniz.'
  if (neden === 'belge_turu') return 'Bu belge türünden taslak çıkarılamıyor (yalnız PDF ve fotoğraf) — özeti elle yazabilirsiniz.'
  if (neden === 'belge_buyuk') return 'Belge taslak için çok büyük — özeti elle yazabilirsiniz.'
  if (neden === 'kota') return 'Günlük yapay zekâ kullanım sınırına ulaşıldı. Taslak oluşturulamadı, elle yazabilirsiniz.'
  return TASLAK_OLUSTURULAMADI
}

/** Hekimin metni taslakla değiştirilebilir mi — boşsa ya da hekim dokunmadığı son taslak duruyorsa. Hekimin yazısının üstüne yazılmaz. */
export function taslakUygulanir(mevcut: string, sonTaslak: string | null): boolean {
  const m = String(mevcut || '').trim()
  return !m || (sonTaslak != null && m === String(sonTaslak).trim())
}

export { DOZ_YER_TUTUCU }
