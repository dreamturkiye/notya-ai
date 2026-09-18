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
import { yasHesapla } from '@/lib/doktor/yas'
import { cinsiyetTr } from '@/lib/utils/cinsiyet'

function coz(v: string | null | undefined): string {
  if (!v) return ''
  try { return decrypt(v) } catch { return '' }
}

function trTarih(d: string | null | undefined): string {
  if (!d) return '?'
  try { return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' }) } catch { return '?' }
}

export async function hastaDosyasiniDerle(
  supabase: SupabaseClient,
  doktorId: string,
  patientId: string
): Promise<string | null> {
  const { data: hasta } = await supabase
    .from('patients').select('*').eq('id', patientId).eq('doctor_id', doktorId).single()
  if (!hasta) return null

  // HASTA-IZOLASYON-01: every child read is scoped to the doctor as well as the patient, so a row
  // another doctor filed under this patient id can never enter this doctor's file or AI context.
  const [seanslarQ, ilaclarQ, asilarQ, intakeQ, goruntulemeQ, belgelerQ, cihazQ, analizQ] = await Promise.all([
    supabase.from('sessions').select('id, created_at, status, specialty, session_type').eq('patient_id', patientId).eq('doctor_id', doktorId).order('created_at', { ascending: true }),
    supabase.from('hasta_ilaclar').select('*').eq('patient_id', patientId).eq('doctor_id', doktorId).order('created_at', { ascending: false }),
    supabase.from('asilar').select('*').eq('patient_id', patientId).eq('doktor_id', doktorId).order('uygulama_tarihi', { ascending: false }),
    supabase.from('hasta_intake_formlari').select('*').eq('patient_id', patientId).eq('doktor_id', doktorId).order('created_at', { ascending: false }).limit(1),
    supabase.from('hasta_goruntulemeler').select('*').eq('patient_id', patientId).eq('doctor_id', doktorId).order('created_at', { ascending: false }).limit(20),
    supabase.from('hasta_belgeler').select('*').eq('patient_id', patientId).eq('doctor_id', doktorId).order('created_at', { ascending: false }).limit(20),
    // NOTYA-BLE-06 + NOTYA-BELGE-05: cihazdan gelen ölçümler/dosyalar ve onaylı belge değerlendirmeleri Ayşe'nin bağlamına girer
    supabase.from('cihaz_olcumleri').select('tur, deger, birim, cihaz, profil, kaynak, alindi, onaylandi').eq('patient_id', patientId).eq('doctor_id', doktorId).eq('onaylandi', true).order('alindi', { ascending: false }).limit(12),
    supabase.from('belge_analizleri').select('modality_final, durum, sonuc, hekim_tanisi, hekim_ozet, onaylandi_at').eq('patient_id', patientId).eq('doctor_id', doktorId).in('durum', ['onaylandi', 'muayene_onaylandi']).order('onaylandi_at', { ascending: false }).limit(5),
  ])

  const seanslar = seanslarQ.data || []
  let notlar: Record<string, unknown>[] = []
  if (seanslar.length > 0) {
    const { data } = await supabase.from('notes').select('*').eq('doctor_id', doktorId).in('session_id', seanslar.map((s) => s.id))
    notlar = (data || []) as Record<string, unknown>[]
  }
  const notHaritasi = new Map<string, Record<string, unknown>>()
  for (const n of notlar) notHaritasi.set(String(n.session_id), n)

  const b: string[] = []
  const dogum = coz(hasta.dob_encrypted)
  const cinsiyet = cinsiyetTr(coz(hasta.gender_encrypted))
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

  // NOTYA-BLE-06 / NOTYA-BELGE-05 — cihaz kaynaklı ölçümler ve onaylı belge değerlendirmeleri (VİZİT GEÇMİŞİ'nden önce: SOAP bağlam dilimine girsin)
  const cihazOlcumleri = (cihazQ?.data || []) as { tur: string; deger: string | null; birim: string | null; cihaz: { ad?: string; uretici?: string; model?: string } | null; profil: string | null; kaynak: string; alindi: string }[]
  const analizler = (analizQ?.data || []) as { modality_final: string; durum: string; sonuc: { ozet?: string; acil_bayrak?: boolean; engines_used?: string[] } | null; hekim_tanisi: { ad: string; icd10?: string | null }[] | null; hekim_ozet: string | null; onaylandi_at: string | null }[]
  if (cihazOlcumleri.length || analizler.length) {
    b.push('\n## CİHAZ VE BELGE DEĞERLENDİRMELERİ (en yeni üstte)')
    const TUR: Record<string, string> = { ates: 'Ateş', tansiyon: 'Tansiyon', nabiz: 'Nabız', spo2: 'SpO₂', kilo: 'Kilo', glukoz: 'Glukoz', steteskop: 'Steteskop kaydı', ekg: 'EKG dosyası', usg: 'USG görüntüsü', diger: 'Cihaz çıktısı' }
    for (const o of cihazOlcumleri) {
      const c = o.cihaz || {}
      const cihazAd = [c.uretici, c.model].filter(Boolean).join(' ') || c.ad || o.profil || 'cihaz'
      b.push(o.deger ? `- ${TUR[o.tur] || o.tur}: ${o.deger} ${o.birim || ''} (cihazdan: ${cihazAd}, ${trTarih(o.alindi)})` : `- ${TUR[o.tur] || o.tur} mevcut (cihazdan: ${cihazAd}, ${trTarih(o.alindi)}) — ses/dosya yorumlanmadı`)
    }
    for (const a of analizler) {
      const tani = (a.hekim_tanisi || []).map((t) => t.icd10 ? `${t.ad} (${t.icd10})` : t.ad).join(', ')
      const ozet = (a.hekim_ozet || a.sonuc?.ozet || '').replace(/\s+/g, ' ').slice(0, 400)
      b.push(`- Belge değerlendirmesi [${a.modality_final}, ${a.onaylandi_at ? trTarih(a.onaylandi_at) : 'onaylı'}]${a.sonuc?.acil_bayrak ? ' ⚠ acil bayrak' : ''}: ${ozet}${tani ? ` — Hekim tanısı: ${tani}` : ''} (motorlar: ${(a.sonuc?.engines_used || []).join(', ')})`)
    }
    b.push('- Not: bu değerlendirmeler yapay zekâ taslağı üzerinden hekim onayıyla kaydedilmiştir; klinik karar hekime aittir.')
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
