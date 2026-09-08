/**
 * NOTYA-RECETE-01 — nottaki reçeteleri doktorun ilaç listesine aktar.
 *
 * QA 2026-09-08: muayene notu reçeteyi yapılandırılmış olarak saklıyor ama hasta
 * portalındaki "İlaçlarım" yalnızca hasta_ilaclar tablosunu okuyor. Tablo boş
 * kaldığı için doktor ilacı reçete etmiş olsa bile hasta "İlaç kaydı yok"
 * görüyordu.
 *
 * Dr. Gökhan Mamur'un kararı (Seçenek C): reçeteler doktorun listesine aktarılır,
 * aktif/sonlandırıldı kararını DOKTOR panelden verir, portal yalnızca onaylı
 * satırları gösterir. Bu yüzden aktarılan satırlar `onay_durumu = 'beklemede'`
 * ve `aktif = false` ile açılır — hastaya hiç görünmezler.
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
function anlamliKelimeler(ad: string): Set<string> {
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

  if (notHata) return { aktarilan: 0, atlanan: 0, hata: notHata.message }
  if (!not) return { aktarilan: 0, atlanan: 0, hata: 'Not bulunamadı' }

  const ilaclar = nottanIlaclariCikar(not)
  if (!ilaclar.length) return { aktarilan: 0, atlanan: 0, hata: null }

  // Bu hastada hâlihazırda kayıtlı ilaçlar — elle eklenmişi ezmeyelim.
  const { data: mevcut } = await sb
    .from('hasta_ilaclar')
    .select('ilac_adi, aktif, onay_durumu, baslangic_tarihi')
    .eq('patient_id', opts.patientId)

  const baslangic = String(opts.tarih || not.created_at || new Date().toISOString()).slice(0, 10)

  /**
   * Aynı ilaç zaten listede mi?
   *
   * Sadece ada bakmak yetmez: aynı çocuğa 4 ay sonra yeniden amoksisilin
   * yazıldığında bu YENİ bir kürdür ve listede görünmelidir. Bu yüzden yalnızca
   * "hâlâ güncel" bir kayıt varsa atlanır — aktif, hekim kararı bekleyen ya da
   * bu reçeteye 30 günden yakın bir kayıt. Bitmiş ve eski bir kür tekrarı engellemez.
   */
  const guncelKayitVar = (ad: string): boolean => {
    for (const m of mevcut || []) {
      if (!ayniIlac(String(m.ilac_adi || ''), ad)) continue
      if (m.aktif) return true
      if (m.onay_durumu === 'beklemede') return true
      const eski = String(m.baslangic_tarihi || '').slice(0, 10)
      if (eski) {
        const fark = Math.abs(new Date(baslangic).getTime() - new Date(eski).getTime())
        if (fark <= 30 * 86400000) return true
      }
    }
    return false
  }

  let aktarilan = 0
  let atlanan = 0

  for (const ilac of ilaclar) {
    if (guncelKayitVar(ilac.ilac_adi)) {
      atlanan += 1
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
      // Karar hekimin: aktarılan satır hastaya görünmez, aktif de sayılmaz.
      aktif: false,
      onay_durumu: 'beklemede',
      kaynak_note_id: opts.noteId,
      notlar: ilac.notlar,
    })
    if (error) {
      // Tekil indeks çakışması = bu not için zaten aktarılmış.
      if (/duplicate key|unique/i.test(error.message)) {
        atlanan += 1
        continue
      }
      return { aktarilan, atlanan, hata: error.message }
    }
    aktarilan += 1
  }

  return { aktarilan, atlanan, hata: null }
}
