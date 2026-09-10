/**
 * NOTYA-INTAKE-06 — Doldurulan ön bilgi formunu hasta kaydına aktar.
 *
 * Kaan (2026-09-10): "Hasta bilgi formunda bilgi var ama Özet sekmesinde görünmüyor." Form ve
 * hasta kaydı iki ayrı yerdi; artık form doldurulunca cevaplar hasta kaydındaki BOŞ alanlara
 * yazılır (doğum tarihi, cinsiyet, e-posta, kan grubu, kronik, alerji, sürekli ilaç, sigara/alkol).
 * Doktorun elle girdiği dolu alan asla ezilmez — form yalnız boşlukları doldurur.
 * Alan kimlikleri coreAlanlar.ts ile aynıdır (pediatri override'ı da aynı id'leri kullanır).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { encrypt, decrypt } from '@/lib/security/encryption'

function coz(v: string | null | undefined): string { if (!v) return ''; try { return decrypt(v) } catch { return '' } }
function metin(v: unknown): string { return Array.isArray(v) ? v.filter(Boolean).join(', ') : String(v ?? '').trim() }

export async function intakeYanitlariniHastayaAktar(sb: SupabaseClient, patientId: string, y: Record<string, unknown>): Promise<string[]> {
  const { data: p } = await sb.from('patients').select('dob_encrypted, gender_encrypted, email_encrypted, notes_encrypted').eq('id', patientId).maybeSingle()
  if (!p) return []
  const guncelleme: Record<string, unknown> = {}
  const doldurulan: string[] = []

  const dogum = metin(y.dogumTarihi)
  if (!coz(p.dob_encrypted) && /^\d{4}-\d{2}-\d{2}$/.test(dogum)) { guncelleme.dob_encrypted = encrypt(dogum); doldurulan.push('dogumTarihi') }

  const cins = metin(y.cinsiyet)
  if (!coz(p.gender_encrypted) && (cins === 'Kadın' || cins === 'Erkek')) { guncelleme.gender_encrypted = encrypt(cins === 'Kadın' ? 'female' : 'male'); doldurulan.push('cinsiyet') }

  const eposta = metin(y.eposta)
  if (!coz(p.email_encrypted) && eposta.includes('@')) { guncelleme.email_encrypted = encrypt(eposta); doldurulan.push('eposta') }

  let notlar: Record<string, unknown> = {}
  try { notlar = JSON.parse(coz(p.notes_encrypted) || '{}') } catch { notlar = {} }
  const bos = (k: string) => !metin(notlar[k])
  const yaz = (k: string, v: string) => { if (v && bos(k)) { notlar[k] = v; doldurulan.push(k) } }

  const kan = metin(y.kanGrubu)
  yaz('kanGrubu', kan && kan !== 'Bilmiyorum' ? kan : '')
  yaz('kronikHastaliklar', metin(y.kronikHastaliklar))
  const alerji = metin(y.alerjiVarMi)
  yaz('alerjiler', alerji.includes('var') ? (metin(y.alerjiAciklama) || 'Bilinen alerjisi var') : alerji ? 'Bilinen alerjisi yok' : '')
  yaz('suregenIlaclar', metin(y.kullanilanIlaclar) || (metin(y.kullaniyorMu) === 'Hayır' ? 'Yok' : ''))
  const sigara = metin(y.sigara); const alkol = metin(y.alkol)
  // Pediatride "Ailede Sigara Kullanımı" Evet/Hayır; erişkinde Kullanmıyorum/Kullanıyorum/Bıraktım + alkol
  const sigaraMetni = sigara === 'Evet' || sigara === 'Hayır' ? `Ailede sigara: ${sigara}` : sigara ? `Sigara: ${sigara}` : ''
  yaz('sigaraAlkol', [sigaraMetni, alkol ? `Alkol: ${alkol}` : ''].filter(Boolean).join(' · '))
  // Şehir: formda ayrı alan yok; adres varsa son satırı/kelimesi şehir olarak yeterli değil — doktor elle girer.

  if (doldurulan.some((k) => !['dogumTarihi', 'cinsiyet', 'eposta'].includes(k))) guncelleme.notes_encrypted = encrypt(JSON.stringify(notlar))
  if (Object.keys(guncelleme).length === 0) return []
  guncelleme.updated_at = new Date().toISOString()
  const { error } = await sb.from('patients').update(guncelleme).eq('id', patientId)
  if (error) { console.error('[intake→hasta]', error.message); return [] }
  return doldurulan
}
