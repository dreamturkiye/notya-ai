/**
 * NOTYA-KONSULT-01 — "Klinik meslektaş" hasta dosyası derleyicisi.
 *
 * Asistanın (Ayşe) doktora hasta hakkında danışmanlık verebilmesi için hastanın TÜM
 * dosyasını tek bir sınırlı metne derler: kimlik özeti, ilk kayıt (intake) formu,
 * sürekli ilaçlar, aşılar, vizit geçmişi (tümünün tarih+ana şikayeti; son 10'unun tam
 * SOAP notu), görüntüleme ve belge listeleri.
 *
 * KVKK: hastanın adı, TC'si ve iletişim bilgileri dosya metnine ASLA yazılmaz — model
 * hastayı "hasta" olarak anar; kimlik doktorun ekranında zaten görünür. Şifreli alanlar
 * yalnız klinik değer taşıyanlar için çözülür (doğum tarihi, cinsiyet, doktor notu).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/security/encryption'

function coz(v: string | null | undefined): string {
  if (!v) return ''
  try { return decrypt(v) } catch { return '' }
}

function trTarih(d: string | null | undefined): string {
  if (!d) return '?'
  try { return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' }) } catch { return '?' }
}

function yasHesapla(dogum: string): string {
  const d = new Date(dogum)
  if (isNaN(d.getTime())) return ''
  const ms = Date.now() - d.getTime()
  const ay = Math.floor(ms / (30.44 * 86400000))
  if (ay < 24) return `${ay} aylık`
  return `${Math.floor(ay / 12)} yaşında`
}

export async function hastaDosyasiniDerle(
  supabase: SupabaseClient,
  doktorId: string,
  patientId: string
): Promise<string | null> {
  const { data: hasta } = await supabase
    .from('patients').select('*').eq('id', patientId).eq('doctor_id', doktorId).single()
  if (!hasta) return null

  const [seanslarQ, ilaclarQ, asilarQ, intakeQ, goruntulemeQ, belgelerQ] = await Promise.all([
    supabase.from('sessions').select('id, created_at, status, specialty, session_type').eq('patient_id', patientId).order('created_at', { ascending: true }),
    supabase.from('hasta_ilaclar').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
    supabase.from('asilar').select('*').eq('patient_id', patientId).order('uygulama_tarihi', { ascending: false }),
    supabase.from('hasta_intake_formlari').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }).limit(1),
    supabase.from('hasta_goruntulemeler').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }).limit(20),
    supabase.from('hasta_belgeler').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }).limit(20),
  ])

  const seanslar = seanslarQ.data || []
  let notlar: Record<string, unknown>[] = []
  if (seanslar.length > 0) {
    const { data } = await supabase.from('notes').select('*').in('session_id', seanslar.map((s) => s.id))
    notlar = (data || []) as Record<string, unknown>[]
  }
  const notHaritasi = new Map<string, Record<string, unknown>>()
  for (const n of notlar) notHaritasi.set(String(n.session_id), n)

  const b: string[] = []
  const dogum = coz(hasta.dob_encrypted)
  const cinsiyet = coz(hasta.gender_encrypted)
  const doktorNotu = coz(hasta.notes_encrypted)

  b.push('## HASTA KİMLİK ÖZETİ')
  b.push(`- Doğum tarihi: ${dogum ? `${trTarih(dogum)} (${yasHesapla(dogum)})` : 'kayıtlı değil'}`)
  if (cinsiyet) b.push(`- Cinsiyet: ${cinsiyet}`)
  b.push(`- İlk kayıt: ${trTarih(hasta.created_at)}`)
  if (doktorNotu) b.push(`- Doktor notu: ${doktorNotu}`)

  const intake = intakeQ.data?.[0]
  b.push('\n## İLK KAYIT FORMU (ÖZGEÇMİŞ — hasta/veli beyanı)')
  if (intake?.form_data_encrypted) {
    try {
      const yanitlar = JSON.parse(decrypt(intake.form_data_encrypted)) as Record<string, unknown>
      const gizli = new Set(['tcKimlik', 'ad', 'soyad', 'telefon', 'eposta', 'adres', 'acilKisiAdi', 'acilKisiTelefon', 'acilKisiYakinlik', 'policeNo', 'kurumAdi'])
      for (const [k, v] of Object.entries(yanitlar)) {
        if (gizli.has(k) || v == null || v === '') continue
        const deger = Array.isArray(v) ? v.join(', ') : String(v)
        if (deger.trim()) b.push(`- ${k}: ${deger}`)
      }
      b.push(`(Form tarihi: ${trTarih(intake.created_at)})`)
    } catch { b.push('- Form kayıtlı ancak çözülemedi.') }
  } else {
    b.push('- İlk kayıt formu henüz doldurulmamış.')
  }

  b.push('\n## SÜREKLİ / KAYITLI İLAÇLAR')
  const ilaclar = ilaclarQ.data || []
  if (ilaclar.length === 0) b.push('- Kayıtlı ilaç yok.')
  for (const i of ilaclar) {
    const parca = [i.ilac_adi || i.ad || i.name, i.doz || i.dozaj, i.kullanim || i.siklik, i.durum || i.status].filter(Boolean).join(' — ')
    if (parca) b.push(`- ${parca}`)
  }

  b.push('\n## AŞILAR')
  const asilar = asilarQ.data || []
  if (asilar.length === 0) b.push('- Kayıtlı aşı yok.')
  for (const a of asilar) {
    b.push(`- ${a.asi_adi || '?'}${a.doz_no ? ` (${a.doz_no}. doz)` : ''} — ${trTarih(a.uygulama_tarihi)}`)
  }

  b.push(`\n## VİZİT GEÇMİŞİ — toplam ${seanslar.length} vizit`)
  const tamNotSayisi = 10
  seanslar.forEach((s, idx) => {
    const n = notHaritasi.get(String(s.id))
    const sira = idx + 1
    const sonlardan = idx >= seanslar.length - tamNotSayisi
    if (!sonlardan) {
      const kisa = n?.content_subjektif ? String(n.content_subjektif).slice(0, 160) : '(not yok)'
      b.push(`\n### Vizit ${sira} — ${trTarih(s.created_at)}\n- Özet: ${kisa}`)
      return
    }
    b.push(`\n### Vizit ${sira} — ${trTarih(s.created_at)} [TAM SOAP]`)
    if (!n) { b.push('- Not bulunamadı.'); return }
    if (n.content_subjektif) b.push(`S (Subjektif): ${n.content_subjektif}`)
    if (n.content_objektif) b.push(`O (Objektif): ${n.content_objektif}`)
    if (n.content_degerlendirme) b.push(`A (Değerlendirme): ${n.content_degerlendirme}`)
    if (n.content_plan) b.push(`P (Plan): ${n.content_plan}`)
    if (n.content_tani) b.push(`Tanı: ${n.content_tani}`)
    const icd = n.icd10_codes as { code?: string; description_tr?: string }[] | null
    if (Array.isArray(icd) && icd.length) b.push(`ICD-10 (doktor onaylı not içinden): ${icd.map((k) => [k.code, k.description_tr].filter(Boolean).join(' ')).join('; ')}`)
    const vIlac = n.content_ilaclar as { ad?: string; doz?: string; kullanim?: string }[] | null
    if (Array.isArray(vIlac) && vIlac.length) b.push(`Verilen ilaçlar: ${vIlac.map((x) => [x.ad, x.doz, x.kullanim].filter(Boolean).join(' ')).join('; ')}`)
    if (n.kritik_bulgular) b.push(`KRİTİK: ${Array.isArray(n.kritik_bulgular) ? (n.kritik_bulgular as string[]).join('; ') : n.kritik_bulgular}`)
  })

  b.push('\n## GÖRÜNTÜLEME KAYITLARI (en yeni üstte)')
  const goruntulemeler = goruntulemeQ.data || []
  if (goruntulemeler.length === 0) b.push('- Kayıtlı görüntüleme yok.')
  for (const g of goruntulemeler) {
    b.push(`- ${g.tur || g.tip || g.baslik || g.dosya_adi || 'Görüntüleme'} — ${trTarih(g.created_at)}${g.aciklama ? ` — ${g.aciklama}` : ''}`)
  }

  b.push('\n## BELGELER (en yeni üstte)')
  const belgeler = belgelerQ.data || []
  if (belgeler.length === 0) b.push('- Kayıtlı belge yok.')
  for (const d of belgeler) {
    b.push(`- ${d.baslik || d.dosya_adi || d.tur || 'Belge'} — ${trTarih(d.created_at)}`)
  }

  // Sınır: ~48k karakter (yaklaşık 15k token) — çok uzun dosyalarda baştan kes (eski vizit özetleri gider).
  const metin = b.join('\n')
  return metin.length > 48000 ? metin.slice(metin.length - 48000) : metin
}
