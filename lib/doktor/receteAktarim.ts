/**
 * NOTYA-RECETE-01 — nottaki reçeteleri doktorun ilaç listesine aktar.
 *
 * QA 2026-09-08: muayene notu reçeteyi yapılandırılmış olarak saklıyor ama hasta
 * portalındaki "İlaçlarım" yalnızca hasta_ilaclar tablosunu okuyor. Tablo boş
 * kaldığı için doktor ilacı reçete etmiş olsa bile hasta "İlaç kaydı yok"
 * görüyordu.
 *
 * Dr. Gökhan Mamur'un kararı (Seçenek C, 2026-09-08): reçeteler doktorun listesine aktarılır,
 * portal yalnız onaylı satırları gösterir; sonlandırma kararı DOKTORUN.
 * Kaan direktifi (2026-09-09) ile güncellendi: NOT ONAYI = İLAÇ ONAYI. Doktor İnceleme'de ilaç
 * listesini görüp notu onayladığında satırlar `onayli` + `aktif` açılır ve hem hasta dosyasında
 * hem hasta portalında (Sağlığım › İlaçlarım) ANINDA görünür. Değişen doz/kullanım mevcut
 * satırı günceller. Ayrı bir "ilaç onayla" adımı yoktur; sonlandırma yine hekimin panelinden.
 *
 * Klinik güvenlik: kürün bitip bitmediğini tahmin ETMİYORUZ. Süre bilgisi yalnızca
 * doktorun okuyacağı nota yazılır; kararı o verir.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

/** notes.content_ilaclar öğesi. */
type NotIlaci = {
  ad?: string | null
  doz?: string | null
  kullanim?: string | null
  sure?: string | null
}

/** notes.recete_onerisi öğesi — etken madde ve SGK bilgisi burada. */
type ReceteOnerisi = {
  etkenMadde?: string | null
  ticariOrnek?: string | null
  doz?: string | null
  kullanim?: string | null
  sure?: string | null
  sgkListesinde?: boolean | null
  not?: string | null
}

export type AktarilacakIlac = {
  ilac_adi: string
  etken_madde: string | null
  doz: string | null
  kullanim_sikli: string | null
  notlar: string | null
}

function metin(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function dizi<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

/** Aynı ilaca ait iki kaydı eşlemek için sadeleştirilmiş ad. */
function adAnahtari(ad: string): string {
  return ad
    .toLocaleLowerCase('tr-TR')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/**
 * Farmasötik form / ambalaj / doz kelimeleri. İki ilacı "aynı" saymak için
 * anlamlı olmayan kelimeler: neredeyse her pediatri reçetesinde "süspansiyon"
 * geçer, bu yüzden ortak kelime sayılmamalı.
 */
const FORM_KELIMELERI = new Set([
  'süspansiyon', 'suspansiyon', 'şurup', 'surup', 'tablet', 'kapsül', 'kapsul',
  'damla', 'sprey', 'krem', 'pomat', 'ampul', 'flakon', 'oral', 'nazal',
  'bebek', 'baby', 'çocuk', 'cocuk', 'mg', 'ml', 'mcg', 'gr', 'g', 'iu',
  've', 'veya', 'ya', 'da', 'için', 'icin', 'sprey', 'serum', 'fort', 'bid',
  'bd', 'duo', 'plus',
])

/** Eşleştirmede kullanılacak anlamlı kelimeler (form/doz kelimeleri hariç). */
export function anlamliKelimeler(ad: string): Set<string> {
  const out = new Set<string>()
  for (const kelime of adAnahtari(ad).split(' ')) {
    if (kelime.length < 4) continue
    if (/^\d+$/.test(kelime)) continue
    if (FORM_KELIMELERI.has(kelime)) continue
    out.add(kelime)
  }
  return out
}

/** İki ad aynı ilacı mı anlatıyor? Ortak anlamlı kelime varsa evet. */
function ayniIlac(a: string, b: string): boolean {
  const ka = anlamliKelimeler(a)
  const kb = anlamliKelimeler(b)
  for (const k of ka) if (kb.has(k)) return true
  return false
}

/**
 * NOTYA-RECETE-04 (Kaan, 2026-09-24) — canlı vaka: hekim notun serbest metin "Plan"
 * alanındaki "1. TEDAVİ:" bölümünü elle düzenleyip "Amoksisilin ... 7 gün" yazısını
 * "Augmentin ES ... 10 gün" ile değiştirdi, ama AYRI bir alan olan yapılandırılmış
 * "İlaçlar" listesini (content_ilaclar — reçeteye ve hasta_ilaclar'a giden TEK kaynak)
 * güncellemedi. Sonuç: not "Augmentin, 10 gün" okunurken, gerçek reçete "Amoksisilin, 7
 * gün" basıyordu — farklı antibiyotik, farklı süre, hiçbir uyarı olmadan.
 *
 * Bu, notMetninAsiIpucuVarMi (lib/doktor/notAsilari.ts) ile aynı desendeki bir geri bildirim
 * ağı: serbest metin planın hiçbir yerinde, yapılandırılmış listedeki hiçbir ilacın adı
 * geçmiyorsa, ikisi muhtemelen birbirinden kopmuştur — hekime onaydan önce hatırlatılır,
 * bloklanmaz (aslında tutarlı olabilir, kelime eşleşmesi kaba bir sezgidir).
 */
export function planIlacTutarsizMi(planMetni: string | null | undefined, ilaclar: { ad: string }[]): boolean {
  const plan = String(planMetni || '').trim()
  if (!plan || !ilaclar.length) return false
  const planKelimeleri = anlamliKelimeler(plan)
  if (!planKelimeleri.size) return false
  // 2026-09-25: "hiçbiri geçmiyor" yerine "herhangi biri geçmiyor" — yalnız bir ilacın değiştiği
  // (Amoksisilin→Augmentin, Parasetamol aynı) revizyon da yakalanır. Yanlış pozitifin bedeli yalnız
  // Ayşe'nin bir karşılaştırması; listeler aynı çıkarsa kart hiç açılmaz (ilacListeleriAyniMi).
  return ilaclar.some((i) => {
    const kelimeler = anlamliKelimeler(i.ad)
    if (!kelimeler.size) return false
    for (const k of kelimeler) if (planKelimeleri.has(k)) return false
    return true
  })
}

/** Formdaki / nottaki yapılandırılmış ilaç satırı. */
export type IlacSatiri = { ad: string; doz: string; kullanim: string; sure: string }

/**
 * NOTYA-RECETE-04 (Kaan, 2026-09-25): uyuşmazlıkta Ayşe'ye (not-konsult) giden dar istek —
 * yalnız İlaçlar listesini Plan metninden çıkarır; sonucu hekim kartta görüp onaylar.
 */
export const ILAC_UYUM_ISTEK =
  "Yalnızca İlaçlar listesini, Plan / Tedavi metninde yazan ilaçlara göre baştan çıkar: her ilaç için ad (Plan'daki ürün adıyla birebir), doz, kullanım ve süre. Plan'da olmayan bir ilacı listeye koyma, Plan'daki hiçbir ilacı atlama; Plan'da yazmayan doz veya süreyi uydurma, boş bırak. Başka hiçbir alanı değiştirme — duzenlemeler içinde yalnızca ilaclar döndür."

/** Ayşe yanıtındaki duzenlemeler.ilaclar → satırlar. Nesne veya "Ad — doz — kullanım — süre" metni kabul edilir; boş/geçersiz → null. */
export function ilacOnerisiCoz(v: unknown): IlacSatiri[] | null {
  if (!Array.isArray(v)) return null
  const out: IlacSatiri[] = []
  for (const it of v) {
    if (typeof it === 'string') {
      const p = it.split(' — ').map((x) => x.trim())
      if (p[0]) out.push({ ad: p[0], doz: p[1] || '', kullanim: p[2] || '', sure: p[3] || '' })
    } else if (it && typeof it === 'object') {
      const o = it as Record<string, unknown>
      const ad = metin(o.ad)
      if (ad) out.push({ ad, doz: metin(o.doz), kullanim: metin(o.kullanim), sure: metin(o.sure) })
    }
  }
  return out.length ? out : null
}

function sade(v: string): string {
  return (v || '').toLocaleLowerCase('tr-TR').replace(/,/g, '.').replace(/[^\p{L}\p{N}./]+/gu, '')
}

/** İki liste aynı tedaviyi mi anlatıyor? (aynı ilaçlar, aynı doz/kullanım/süre; yazım farkları yok sayılır) */
export function ilacListeleriAyniMi(a: IlacSatiri[], b: IlacSatiri[]): boolean {
  if (a.length !== b.length) return false
  const kalan = [...b]
  for (const x of a) {
    const i = kalan.findIndex((y) => ayniIlac(x.ad, y.ad) && sade(x.doz) === sade(y.doz) && sade(x.kullanim) === sade(y.kullanim) && sade(x.sure) === sade(y.sure))
    if (i < 0) return false
    kalan.splice(i, 1)
  }
  return true
}

/**
 * NOTYA-RECETE-05 (Kaan, 2026-09-25): Onayla anında Ayşe karşılaştırması gerekir mi?
 * - tutarsiz: listedeki bir ilaç Plan metninde geçmiyor (değişen/çıkarılan ilaç).
 * - Plan düzenlendi: listedeki ilaçlar dururken Plan'a YENİ bir ilaç eklenmesini de yakalar
 *   (kelime eşleşmesi bunu göremez). ilkPlan = not açıldığında Plan metni; null ise bilinmiyor.
 */
export function ilacKontroluGerekliMi(
  plan: string | null | undefined,
  ilkPlan: string | null | undefined,
  ilaclar: { ad: string }[],
): { gerekli: boolean; tutarsiz: boolean } {
  const tutarsiz = planIlacTutarsizMi(plan, ilaclar)
  const simdi = String(plan || '').trim()
  const planDegisti = !!simdi && ilkPlan != null && simdi !== String(ilkPlan).trim()
  return { gerekli: tutarsiz || planDegisti, tutarsiz }
}

/**
 * NOTYA-RECETE-05: Ayşe önerisine göre karar. Aynıysa sessizce devam (kart yok). Ayşe okuyamadıysa
 * yalnız somut uyuşmazlık varken düz uyarı; yalnız Plan düzenlendiyse hekimi bekletmeden devam.
 */
export function ilacKontrolSonucu(
  tutarsiz: boolean,
  mevcut: IlacSatiri[],
  oneri: IlacSatiri[] | null,
): 'devam' | 'uyari' | 'oneri' {
  if (!oneri || !oneri.length) return tutarsiz ? 'uyari' : 'devam'
  return ilacListeleriAyniMi(mevcut, oneri) ? 'devam' : 'oneri'
}

/**
 * İlaç adını listeye yazılabilir hale getirir.
 *
 * Not üreticisi adı sık sık alternatiflerle ve açıklamayla birlikte yazıyor:
 * "Parol 120 mg/5 mL şurup veya Nurofen (ibuprofen) — ateş/ağrı için alternatif".
 * İlaç listesinde tek bir ürün adı olmalı; alternatif ve açıklama kuyruğu atılır.
 * Doz/güç bilgisi KORUNUR — "Amoksil 250 mg/5 mL" ile "Amoksil 500 mg" aynı şey değil.
 */
export function ilacAdiniSadelestir(ham: string): string {
  let ad = ham.trim()
  // "(veya X)" / "(ya da X)" parantezleri
  ad = ad.replace(/\((?:\s*(?:veya|ya da)\b)[^)]*\)/giu, ' ')
  // Açıklama kuyruğu: boşluklu tire/uzun tire sonrası
  ad = ad.split(/\s+[—–]\s+| - /u)[0]
  // Alternatif: " veya ", " / ", " ya da "
  ad = ad.split(/\s+veya\s+|\s+ya da\s+|\s+\/\s+/iu)[0]
  // Artık kapanmayan parantez kalmışsa temizle
  if ((ad.match(/\(/g) || []).length > (ad.match(/\)/g) || []).length) {
    ad = ad.replace(/\([^)]*$/, '')
  }
  return ad.replace(/[\s,;:.]+$/u, '').replace(/\s{2,}/g, ' ').trim()
}

/**
 * Notun reçete alanlarını tek bir ilaç listesine indirger.
 *
 * İki alan AYNI ilaçları iki farklı isimle taşıyor: content_ilaclar hekimin
 * nota yazdığı liste (çoğunlukla etken madde — "Amoksisilin"), recete_onerisi
 * ise aynı ilacın ticari örneği ve detayı ("Largopen 250 mg/5 mL süspansiyon",
 * etkenMadde: "Amoksisilin"). İlk sürüm ikisini ayrı satır olarak aktarıyordu ve
 * her ilaç listede iki kez çıkıyordu (4 satır = 2 ilaç).
 *
 * Bu yüzden content_ilaclar OTORİTEDİR: satırlar ondan üretilir, recete_onerisi
 * yalnızca eşleşen satırı zenginleştirir (etken madde, ticari örnek, SGK, süre).
 * Böylece hekimin yazmadığı bir ilaç asla listeye eklenmez. content_ilaclar boşsa
 * recete_onerisi'ne düşülür — aksi halde yalnızca öneri üreten bir not kaybolur.
 */
export function nottanIlaclariCikar(not: {
  content_ilaclar?: unknown
  recete_onerisi?: unknown
}): AktarilacakIlac[] {
  const notIlaclari = dizi<NotIlaci>(not.content_ilaclar).filter((i) => metin(i.ad))
  const oneriler = dizi<ReceteOnerisi>(not.recete_onerisi)

  const sonuc: AktarilacakIlac[] = []
  const gorulen: string[] = []

  const ekle = (hamAd: string, kaynak: NotIlaci, oneri?: ReceteOnerisi) => {
    const ad = ilacAdiniSadelestir(hamAd)
    if (!ad) return
    // Aynı ilaç iki kez gelmesin (ör. "Amoksisilin" ve "Amoksisilin süspansiyon").
    if (gorulen.some((v) => ayniIlac(v, ad))) return
    gorulen.push(ad)

    const sure = metin(kaynak.sure) || metin(oneri?.sure)
    const ticari = oneri ? ilacAdiniSadelestir(metin(oneri.ticariOrnek)) : ''
    const notParcalari = [
      sure ? `Süre: ${sure}` : '',
      ticari && !ayniIlac(ticari, ad) ? `Ticari örnek: ${ticari}` : '',
      metin(oneri?.not),
      oneri?.sgkListesinde === false ? 'SGK listesinde değil.' : '',
      'Not onayından aktarıldı — aktif/sonlandırıldı kararı hekimdedir.',
    ].filter(Boolean)

    sonuc.push({
      ilac_adi: ad,
      etken_madde: metin(oneri?.etkenMadde) || null,
      doz: metin(kaynak.doz) || metin(oneri?.doz) || null,
      kullanim_sikli: metin(kaynak.kullanim) || metin(oneri?.kullanim) || null,
      notlar: notParcalari.join(' · ') || null,
    })
  }

  if (notIlaclari.length) {
    for (const i of notIlaclari) {
      const ad = metin(i.ad)
      const oneri = oneriler.find(
        (o) =>
          ayniIlac(ad, metin(o.etkenMadde)) ||
          ayniIlac(ad, metin(o.ticariOrnek))
      )
      ekle(ad, i, oneri)
    }
    return sonuc
  }

  for (const o of oneriler) {
    const ad = metin(o.ticariOrnek) || metin(o.etkenMadde)
    if (!ad) continue
    ekle(ad, { doz: o.doz, kullanim: o.kullanim, sure: o.sure }, o)
  }

  return sonuc
}

export type AktarimSonucu = {
  aktarilan: number
  atlanan: number
  /** NOTYA-RECETE-02 (Kaan, 2026-09-24): "revizyona uğramış ilaç mutlaka reçetede de değişmeli" --
   * how many hasta_ilaclar rows this call deactivated because the note's current medication list
   * no longer includes them (see the deactivation pass below). */
  sonlandirilan: number
  hata: string | null
}

/**
 * Onaylanmış bir notun reçetelerini hasta_ilaclar'a 'beklemede' olarak yazar.
 *
 * Idempotent: (kaynak_note_id, ilac_adi) üzerinde tekil indeks var, aynı not
 * yeniden onaylanırsa satırlar çoğalmaz. Zaten listede bulunan (elle eklenmiş)
 * bir ilaç da tekrar aktarılmaz — doktorun kendi kaydı kazanır.
 */
export async function nottanIlacAktar(
  sb: SupabaseClient,
  opts: { noteId: string; doctorId: string; patientId: string; tarih?: string | null }
): Promise<AktarimSonucu> {
  const { data: not, error: notHata } = await sb
    .from('notes')
    .select('id, created_at, content_ilaclar, recete_onerisi')
    .eq('id', opts.noteId)
    .maybeSingle()

  if (notHata) return { aktarilan: 0, atlanan: 0, sonlandirilan: 0, hata: notHata.message }
  if (!not) return { aktarilan: 0, atlanan: 0, sonlandirilan: 0, hata: 'Not bulunamadı' }

  const ilaclar = nottanIlaclariCikar(not)

  // Bu hastada hâlihazırda kayıtlı ilaçlar — elle eklenmişi ezmeyelim.
  // NOTYA-ARSIV-02: raw read on purpose — rows hidden by an archived source note are included, so a
  // re-prescription re-claims that row (it reappears under this live note) instead of duplicating it.
  const { data: mevcut } = await sb
    .from('hasta_ilaclar')
    .select('id, ilac_adi, aktif, onay_durumu, baslangic_tarihi, doz, kullanim_sikli, kaynak_note_id')
    .eq('patient_id', opts.patientId)
    // HASTA-IZOLASYON-01: only this doctor's rows are "existing" — never update another doctor's row.
    .eq('doctor_id', opts.doctorId)

  const baslangic = String(opts.tarih || not.created_at || new Date().toISOString()).slice(0, 10)

  // NOTYA-RECETE-02 (Kaan, 2026-09-24): "tedavimi değiştirdikten sonra ... reçete bölümünde eski
  // ilaçlar devam ediyordu ... revizyona uğramış ilaç mutlaka reçetede de değişmeli." Kaan swapped
  // one antibiotic for another on the revision page; the note's own content_ilaclar updated
  // correctly, but nothing ever told hasta_ilaclar the OLD drug was gone — the insert/update loop
  // below only ever ADDS or UPDATES rows that match a CURRENT medication name, it never notices one
  // that disappeared. So Ayşe, asked "which medication did we give," read the still-active old row
  // straight out of hasta_ilaclar and reported it — correctly, given what the table actually said.
  // Fix: any row this SAME note previously wrote (kaynak_note_id = this note), still active, whose
  // name doesn't match anything in the note's CURRENT list, is deactivated here — the doctor's
  // latest, approved decision no longer includes it. A hand-added row (kaynak_note_id NULL) or one
  // written by a different note is never touched by this pass — same boundary the rest of this
  // file already draws.
  let sonlandirilan = 0
  for (const m of (mevcut || []) as { id: string; ilac_adi: string | null; aktif: boolean | null; kaynak_note_id: string | null }[]) {
    if (m.kaynak_note_id !== opts.noteId) continue
    if (!m.aktif) continue
    const hala_listede = ilaclar.some((i) => ayniIlac(String(m.ilac_adi || ''), i.ilac_adi))
    if (hala_listede) continue
    const { error: dErr } = await sb.from('hasta_ilaclar').update({ aktif: false }).eq('id', m.id)
    if (dErr) return { aktarilan: 0, atlanan: 0, sonlandirilan, hata: dErr.message }
    sonlandirilan += 1
  }

  if (!ilaclar.length) return { aktarilan: 0, atlanan: 0, sonlandirilan, hata: null }

  /**
   * Aynı ilaç zaten listede mi?
   *
   * Sadece ada bakmak yetmez: aynı çocuğa 4 ay sonra yeniden amoksisilin
   * yazıldığında bu YENİ bir kürdür ve listede görünmelidir. Bu yüzden yalnızca
   * "hâlâ güncel" bir kayıt varsa atlanır — aktif, hekim kararı bekleyen ya da
   * bu reçeteye 30 günden yakın bir kayıt. Bitmiş ve eski bir kür tekrarı engellemez.
   */
  type Mevcut = { id: string; ilac_adi: string | null; aktif: boolean | null; onay_durumu: string | null; baslangic_tarihi: string | null; doz: string | null; kullanim_sikli: string | null; kaynak_note_id: string | null }
  const guncelKayit = (ad: string): Mevcut | null => {
    for (const m of (mevcut || []) as Mevcut[]) {
      if (!ayniIlac(String(m.ilac_adi || ''), ad)) continue
      if (m.aktif) return m
      if (m.onay_durumu === 'beklemede') return m
      const eski = String(m.baslangic_tarihi || '').slice(0, 10)
      if (eski) {
        const fark = Math.abs(new Date(baslangic).getTime() - new Date(eski).getTime())
        if (fark <= 30 * 86400000) return m
      }
    }
    return null
  }

  let aktarilan = 0
  let atlanan = 0

  for (const ilac of ilaclar) {
    // Kaan direktifi (2026-09-09): yeni yazılan VEYA değiştirilen ilaç hem hasta dosyasına hem
    // portala anında intikal etmeli. Not onayı = ilaç onayı (doktor İnceleme'de listeyi görüp
    // onayladı); güncel kayıtta doz/kullanım değiştiyse satır GÜNCELLENİR, eski doz portalda kalmaz.
    const g = guncelKayit(ilac.ilac_adi)
    if (g) {
      const degisti = (g.doz || '') !== (ilac.doz || '') || (g.kullanim_sikli || '') !== (ilac.kullanim_sikli || '') || g.onay_durumu === 'beklemede' || !g.aktif
      if (!degisti) {
        // NOTYA-ARSIV-02: the row follows the latest approved note that wrote it. Left on the older note,
        // archiving that note would hide a drug this live note still prescribes. A hand-added row
        // (kaynak_note_id NULL) stays the doctor's own and always visible.
        if (g.kaynak_note_id && g.kaynak_note_id !== opts.noteId) {
          const { error: kErr } = await sb.from('hasta_ilaclar').update({ kaynak_note_id: opts.noteId }).eq('id', g.id)
          if (kErr) return { aktarilan, atlanan, sonlandirilan, hata: kErr.message }
        }
        atlanan += 1
        continue
      }
      const { error: gErr } = await sb.from('hasta_ilaclar').update({
        doz: ilac.doz, kullanim_sikli: ilac.kullanim_sikli, notlar: ilac.notlar,
        aktif: true, onay_durumu: 'onayli', kaynak_note_id: opts.noteId, baslangic_tarihi: baslangic,
      }).eq('id', g.id)
      if (gErr) return { aktarilan, atlanan, sonlandirilan, hata: gErr.message }
      aktarilan += 1
      continue
    }
    const { error } = await sb.from('hasta_ilaclar').insert({
      doctor_id: opts.doctorId,
      patient_id: opts.patientId,
      ilac_adi: ilac.ilac_adi,
      etken_madde: ilac.etken_madde,
      doz: ilac.doz,
      kullanim_sikli: ilac.kullanim_sikli,
      baslangic_tarihi: baslangic,
      // Not onayı = ilaç onayı: dosyada ve portalda hemen görünür; sonlandırma yine hekimde.
      aktif: true,
      onay_durumu: 'onayli',
      kaynak_note_id: opts.noteId,
      notlar: ilac.notlar,
    })
    if (error) {
      // Tekil indeks çakışması = bu not için zaten aktarılmış.
      if (/duplicate key|unique/i.test(error.message)) {
        atlanan += 1
        continue
      }
      return { aktarilan, atlanan, sonlandirilan, hata: error.message }
    }
    aktarilan += 1
  }

  return { aktarilan, atlanan, sonlandirilan, hata: null }
}
