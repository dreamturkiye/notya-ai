/**
 * NOTYA-ARAMA-INDEKS-01 (Kaan, 2026-10-01): hasta adlari sifreli saklanir (KVKK 2018/10 -
 * ozel nitelikli veri elektronik ortamda kriptografik yontemlerle saklanmalidir). Duz metin
 * arama sutunu bu kurali ihlal eder. Bunun yerine: adin her parcasinin (>=3 harf,
 * hastaCozumleyici'deki eslestirme kuraliyla birebir ayni normalize/parcalama) tek yonlu
 * HMAC-SHA256 ozeti indekslenir - ozetten ad geri cikarilamaz, ama arama aninda anlik eslesir.
 * Onceki tasarim: doktor basina 500 hastayi HER mesajda tek tek coz + karsilastir (p95 fark
 * yarattigi dogrulandi - bkz NOTYA-PERF audit 2026-10-01).
 */
import { createHmac, scryptSync } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { duzle } from './hastaCozumleyici'

let onbellekliAnahtar: Buffer | null = null
function aramaAnahtari(): Buffer {
  if (onbellekliAnahtar) return onbellekliAnahtar
  const masterKey = process.env.ENCRYPTION_MASTER_KEY
  if (!masterKey) throw new Error('ENCRYPTION_MASTER_KEY ortam degiskeni tanimli degil')
  // Ayri amac (HMAC arama indeksi), ayri tuz - AES sifreleme anahtarindan kriptografik olarak bagimsiz.
  onbellekliAnahtar = scryptSync(masterKey, 'notya-ai-arama-indeks-tuz-2026', 32)
  return onbellekliAnahtar
}

export function tokenOzeti(token: string): string {
  return createHmac('sha256', aramaAnahtari()).update(token).digest('hex')
}

/** Bir adin indekslenecek parcalari - hastaCozumleyici'deki eslestirme kuraliyla birebir ayni (>=3 harf). */
export function adIndeksParcalari(adPlaintext: string): string[] {
  const parcalar = duzle(adPlaintext).split(' ').filter((p) => p.length >= 3)
  return Array.from(new Set(parcalar))
}

/** Hasta olusturma/guncellemede cagrilir - mevcut token satirlarini yeni adla degistirir. */
export async function hastaAramaIndeksiniGuncelle(
  supabase: SupabaseClient,
  doctorId: string,
  patientId: string,
  adPlaintext: string
): Promise<void> {
  const parcalar = adIndeksParcalari(adPlaintext)
  await supabase.from('patient_search_tokens').delete().eq('patient_id', patientId)
  if (parcalar.length === 0) return
  const satirlar = parcalar.map((p) => ({ patient_id: patientId, doctor_id: doctorId, token_hash: tokenOzeti(p) }))
  const { error } = await supabase.from('patient_search_tokens').insert(satirlar)
  if (error) console.error('NOTYA-ARAMA-INDEKS: token yazilamadi', patientId, error.message)
}

/**
 * Mesajdaki (zaten hesaplanmis) konusma token'larindan, bu doktorun olasi aday hasta id'lerini bulur.
 * null donerse indeks kullanilamiyor demektir - cagiran taraf eski tam-tarama davranisina donmelidir.
 */
/**
 * NOTYA-ARAMA-INDEKS-SUFFIX-01 (Kaan/Gökhan, 2026-10-01): a Turkish suffix glues onto a name
 * with no separator ("yeşilin" from patient "Yeşil", "Umutcanın" from "Umutcan") -- hastaCozumleyici's
 * inner comparison already tolerates this (NOTYA-SUFFIX-TOLERANS-01: a token STARTS WITH the name
 * part), but this blind index hashes only the EXACT name part, so a suffixed message token hashes to
 * a value the index never stored and the candidate is dropped before the inner comparison ever runs --
 * the real regression Dr. Gökhan hit on "yeşilin" reproduces again on any doctor whose index is used
 * (every doctor past the empty-index fallback). Fix: also hash every prefix (>=3 chars) of each
 * message token and query by those too, mirroring the inner check in reverse (name-part is a prefix of
 * the token, instead of the token starting with the name part). Purely additive -- can only surface a
 * candidate the exact-hash lookup missed, never drop one. Capped at 24 chars/token to bound query size.
 */
function tokenVeOnEkleri(token: string): string[] {
  const liste = [token]
  const sinir = Math.min(token.length - 1, 24)
  for (let i = 3; i <= sinir; i++) liste.push(token.slice(0, i))
  return liste
}

export async function mesajAdaylariniBul(
  supabase: SupabaseClient,
  doctorId: string,
  tokenlar: Set<string>
): Promise<Set<string> | null> {
  const adaylar = Array.from(tokenlar).filter((t) => t.length >= 3)
  if (adaylar.length === 0) return new Set()
  const genisletilmis = new Set<string>()
  for (const t of adaylar) for (const parca of tokenVeOnEkleri(t)) genisletilmis.add(parca)
  const hashler = Array.from(genisletilmis).map(tokenOzeti)
  const { data, error } = await supabase
    .from('patient_search_tokens')
    .select('patient_id')
    .eq('doctor_id', doctorId)
    .in('token_hash', hashler)
  if (error) return null
  return new Set((data || []).map((r) => r.patient_id as string))
}

/**
 * NOTYA-SES-YARIM-01: is this single word EXACTLY a name part of one of this doctor's patients? Exact hash only
 * (no prefix expansion) — "Umutcan" must not be answered by a patient called "Umut". Doctor-scoped; nothing is
 * decrypted. null = the index could not be read (the caller falls back to its own signal).
 */
export async function adParcasiMi(supabase: SupabaseClient, doctorId: string, kelime: string): Promise<boolean | null> {
  const parca = duzle(kelime)
  if (parca.length < 3 || parca.includes(' ')) return false
  const { data, error } = await supabase
    .from('patient_search_tokens')
    .select('patient_id')
    .eq('doctor_id', doctorId)
    .eq('token_hash', tokenOzeti(parca))
    .limit(1)
  if (error) return null
  return (data || []).length > 0
}
