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
import { formAlanlariniTara, dosyaAlanOzeti, MODELE_GITMEYEN_KIMLIK } from '@/lib/doktor/dosyaAlanTara'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { yasamsalBulguOzeti } from '@/lib/clinical/yasamsalBulgular'
import { bosKart, kartBosMu, kartMetin, type HastaDosyaKart } from '@/lib/doktor/hastaDosyaKart'
import { pediatrikBaglamMi } from '@/lib/specialties/kapsam'
import { arsivsizAsilar, arsivsizIlaclar, arsivsizNotlar, arsivsizSeanslar } from '@/lib/doktor/arsiv'

function coz(v: string | null | undefined): string {
  if (!v) return ''
  try { return decrypt(v) } catch { return '' }
}

/**
 * NOTYA-BETA-0925: patients.notes_encrypted bir JSON kaydıdır (hasta kartı + form aktarımı: kan grubu, kronik,
 * alerji… ama AYNI ZAMANDA anne / baba adı, şehir). Eskiden tamamı "Doktor notu" olarak modele gidiyordu — kimlik
 * anahtarları atılır; düz metin not (eski kayıtlar) aynen kalır.
 */
const NOT_KIMLIK_ANAHTARLARI = new Set(['anneAdi', 'babaAdi', 'dogumYeri', 'sehir', 'adres', 'telefon', 'eposta', 'anneId', 'anneGebelikId'])
function modeleGidenNot(ham: string): string {
  if (!ham.trim().startsWith('{')) return ham
  try {
    const o = JSON.parse(ham) as Record<string, unknown>
    const kalan = Object.fromEntries(Object.entries(o).filter(([k, v]) => !NOT_KIMLIK_ANAHTARLARI.has(k) && v != null && v !== '' && !(Array.isArray(v) && !v.length)))
    return Object.keys(kalan).length ? JSON.stringify(kalan) : ''
  } catch { return ham }
}

function trTarih(d: string | null | undefined): string {
  if (!d) return '?'
  try { return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' }) } catch { return '?' }
}

export async function hastaDosyaPaketiniDerle(
  supabase: SupabaseClient,
  doktorId: string,
  patientId: string
): Promise<{ metin: string; kart: HastaDosyaKart } | null> {
  const { data: hasta } = await supabase
    .from('patients').select('*').eq('id', patientId).eq('doctor_id', doktorId).single()
  if (!hasta) return null

  // HASTA-IZOLASYON-01: every child read is scoped to the doctor as well as the patient, so a row
  // another doctor filed under this patient id can never enter this doctor's file or AI context.
  const [seanslarQ, ilaclarQ, asilarQ, intakeQ, goruntulemeQ, belgelerQ, cihazQ, analizQ, hekimQ, randevuQ, labQ, calismaQ] = await Promise.all([
    // NOTYA-ARSIV-01: arşivlenmiş muayene (ve notu) Ayşe'nin dosyasına / kartına girmez.
    arsivsizSeanslar(supabase, 'id, created_at, status, specialty, session_type').eq('patient_id', patientId).eq('doctor_id', doktorId).order('created_at', { ascending: true }),
    // NOTYA-ARSIV-02: arşivlenmiş muayenenin yazdığı ilaç da dosyaya / etkileşim bağlamına girmez.
    arsivsizIlaclar(supabase, '*').eq('patient_id', patientId).eq('doctor_id', doktorId).order('created_at', { ascending: false }),
    // NOTYA-ASI-NOT-01: nor the vaccines its note wrote into the aşı kartı.
    arsivsizAsilar(supabase, '*').eq('patient_id', patientId).eq('doktor_id', doktorId).order('uygulama_tarihi', { ascending: false }),
    supabase.from('hasta_intake_formlari').select('*').eq('patient_id', patientId).eq('doktor_id', doktorId).order('created_at', { ascending: false }).limit(1),
    supabase.from('hasta_goruntulemeler').select('*').eq('patient_id', patientId).eq('doctor_id', doktorId).order('created_at', { ascending: false }).limit(20),
    supabase.from('hasta_belgeler').select('*').eq('patient_id', patientId).eq('doctor_id', doktorId).order('created_at', { ascending: false }).limit(20),
    // NOTYA-BLE-06 + NOTYA-BELGE-05: cihazdan gelen ölçümler/dosyalar ve onaylı belge değerlendirmeleri Ayşe'nin bağlamına girer
    supabase.from('cihaz_olcumleri').select('tur, deger, birim, cihaz, profil, kaynak, alindi, onaylandi').eq('patient_id', patientId).eq('doctor_id', doktorId).eq('onaylandi', true).order('alindi', { ascending: false }).limit(12),
    supabase.from('belge_analizleri').select('modality_final, durum, sonuc, hekim_tanisi, hekim_ozet, onaylandi_at').eq('patient_id', patientId).eq('doctor_id', doktorId).in('durum', ['onaylandi', 'muayene_onaylandi']).order('onaylandi_at', { ascending: false }).limit(5),
    supabase.from('users').select('specialty').eq('id', doktorId).maybeSingle(),
    supabase.from('randevular').select('baslangic, tur, durum').eq('patient_id', patientId).eq('doktor_id', doktorId).neq('durum', 'iptal').order('baslangic', { ascending: true }).limit(20),
    supabase.from('lab_satirlar').select('canonical_key, kanonik_deger, value_text, numune_tarihi').eq('patient_id', patientId).eq('doctor_id', doktorId).eq('onayli', true).not('canonical_key', 'is', null).order('numune_tarihi', { ascending: false }).limit(40),
    supabase.from('goruntu_calisma').select('tip, modalite, bolge, tarih, onay_durum, hekim_yorum, created_at').eq('patient_id', patientId).eq('doctor_id', doktorId).order('created_at', { ascending: false }).limit(20),
  ])

  const seanslar = seanslarQ.data || []
  let notlar: Record<string, unknown>[] = []
  if (seanslar.length > 0) {
    const { data } = await arsivsizNotlar(supabase, '*').eq('doctor_id', doktorId).in('session_id', seanslar.map((s: { id: string }) => s.id))
    notlar = (data || []) as Record<string, unknown>[]
  }
  const notHaritasi = new Map<string, Record<string, unknown>>()
  for (const n of notlar) notHaritasi.set(String(n.session_id), n)

  const b: string[] = []
  const dogum = coz(hasta.dob_encrypted)
  const cinsiyet = cinsiyetTr(coz(hasta.gender_encrypted))
  const doktorNotu = modeleGidenNot(coz(hasta.notes_encrypted))

  const brans = bransAnahtari((hekimQ.data as { specialty?: string } | null)?.specialty)
  const pediatrik = pediatrikBaglamMi({ doktorBransi: brans, hastaDogumIso: dogum || null })
  const kimlikDobSatiri = (iso: string | null, kaynak?: string) =>
    iso ? `- Doğum tarihi: ${trTarih(iso)} (${yasHesapla(iso)})${kaynak ? ` — ${kaynak}` : ''}` : '- Doğum tarihi: kayıtlı değil'

  b.push('## HASTA KİMLİK ÖZETİ')
  b.push(kimlikDobSatiri(dogum || null))
  if (cinsiyet) b.push(`- Cinsiyet: ${cinsiyet}`)
  b.push(`- İlk kayıt: ${trTarih(hasta.created_at)}`)
  if (doktorNotu) b.push(`- Doktor notu: ${doktorNotu}`)

  const intake = intakeQ.data?.[0]
  // BRANS-ALAN-SIZMASI: "veli beyanı" yalnız formu gerçekten veli doldurduysa (pediatri formu: veliYakinligi) —
  // KD/dahiliye/göz hastasının dosyası modele "hasta/veli" diye sunulmaz (model özet metnine veli dilini taşıyordu)
  let yanitlar: Record<string, unknown> | null = null
  if (intake?.form_data_encrypted) {
    try { yanitlar = JSON.parse(decrypt(intake.form_data_encrypted)) as Record<string, unknown> } catch { yanitlar = null }
  }
  b.push(`\n## İLK KAYIT FORMU (ÖZGEÇMİŞ — ${yanitlar && yanitlar.veliYakinligi ? 'veli beyanı' : 'hasta beyanı'})`)
  if (intake?.form_data_encrypted) {
    try {
      if (!yanitlar) throw new Error('intake çözülemedi')
      // VELI-YASAL-ONAM: veli / yasal temsilcinin kimlik + iletişim bilgisi de modele gitmez (yakınlık gider: "anne beyanı")
      // NOTYA-BETA-0925: anne / baba adı ve doğum yeri de kimliktir — modele gitmez; doktor sorarsa sunucu cevaplar
      // (lib/doktor/kimlikSorusu.ts, değer model bağlamına hiç girmez).
      const gizli = new Set(['tcKimlik', 'ad', 'soyad', 'telefon', 'eposta', 'adres', 'acilKisiAdi', 'acilKisiTelefon', 'acilKisiYakinlik', 'policeNo', 'kurumAdi', 'veliAd', 'veliSoyad', 'veliTelefon', 'veliDigerAdSoyad', 'veliKimlikTeyidi', ...MODELE_GITMEYEN_KIMLIK])
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

  const lablar = labQ.data || []
  b.push('\n## ONAYLI LAB (en yeni, her kalem bir kez)')
  if (lablar.length === 0) b.push('- Onaylı lab satırı yok.')
  const labGorulenGovde = new Set<string>()
  for (const l of lablar) {
    const key = String(l.canonical_key || '')
    if (!key || labGorulenGovde.has(key)) continue
    labGorulenGovde.add(key)
    b.push(`- ${key}: ${l.kanonik_deger || l.value_text || '?'} (${trTarih(l.numune_tarihi)})`)
    if (labGorulenGovde.size >= 12) break
  }

  const randevular = randevuQ.data || []
  b.push('\n## RANDEVULAR')
  const simdiRandevu = Date.now()
  const gelecek = randevular.filter((r) => r.baslangic && new Date(r.baslangic).getTime() >= simdiRandevu)
  if (gelecek.length === 0) b.push('- Gelecek randevu yok.')
  for (const r of gelecek.slice(0, 5)) {
    b.push(`- ${trTarih(r.baslangic)}${r.tur ? ` — ${r.tur}` : ''}${r.durum ? ` (${r.durum})` : ''}`)
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
  const calismalar = (calismaQ.data || []) as { tip?: string; modalite?: string; bolge?: string | null; tarih?: string | null; onay_durum?: string; hekim_yorum?: string | null; created_at?: string }[]
  const goruntulemeler = goruntulemeQ.data || []
  if (calismalar.length === 0 && goruntulemeler.length === 0) b.push('- Kayıtlı görüntüleme yok.')
  for (const g of calismalar) {
    const ad = [g.tip, g.modalite, g.bolge].filter(Boolean).join(' · ') || 'Film'
    const tarih = trTarih(g.tarih || g.created_at)
    const yorum = String(g.hekim_yorum || '').trim()
    const onay = g.onay_durum === 'hasta_paylas' ? 'paylaşıldı' : g.onay_durum === 'taslak' ? 'taslak' : 'hekim'
    b.push(`- ${ad} — ${tarih} (${onay})${yorum ? ` — ${yorum.slice(0, 180)}` : ''}`)
  }
  for (const g of goruntulemeler) {
    b.push(`- ${g.tur || g.tip || g.baslik || g.dosya_adi || 'Görüntüleme'} — ${trTarih(g.created_at)}${g.aciklama ? ` — ${g.aciklama}` : ''}`)
  }

  b.push('\n## BELGELER (en yeni üstte)')
  const belgeler = belgelerQ.data || []
  if (belgeler.length === 0) b.push('- Kayıtlı belge yok.')
  for (const d of belgeler) {
    const ozet = d.ai_ozet && typeof d.ai_ozet === 'object' ? JSON.stringify(d.ai_ozet).replace(/[{}"[\]]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400) : ''
    b.push(`- ${d.baslik || d.dosya_adi || d.belge_turu || d.tur || 'Belge'} — ${trTarih(d.created_at)}${ozet ? ` — ${ozet}` : ''}`)
  }

  // Form boş / eksikse aynı başlıkları epikriz, SOAP, belge özetinde ara (Gökhan: doğum tarihi formda yoktu).
  const dolu = new Set<string>()
  if (dogum) dolu.add('dogumTarihi')
  if (cinsiyet) dolu.add('cinsiyet')
  if (yanitlar) {
    for (const [k, v] of Object.entries(yanitlar)) {
      if (v != null && String(v).trim()) dolu.add(k)
    }
  }
  const ham = b.join('\n')
  const taranan = formAlanlariniTara(ham, { brans, hastaDogumIso: dogum || null, dolu })
  const dosyadanDob = taranan.find((x) => x.id === 'dogumTarihi')
  if (!dogum && dosyadanDob) {
    const idx = b.findIndex((s) => s.startsWith('- Doğum tarihi:'))
    if (idx >= 0) b[idx] = kimlikDobSatiri(dosyadanDob.deger, `dosyadan, “${dosyadanDob.alinti}”`)
  }
  const ozet = dosyaAlanOzeti(taranan.filter((x) => !MODELE_GITMEYEN_KIMLIK.has(x.id)))
  if (ozet) b.push(ozet)

  const kart = kartKur({
    yas: (dogum || dosyadanDob?.deger) ? yasHesapla(dogum || dosyadanDob!.deger) : 'kayıtlı değil',
    cinsiyet,
    yanitlar,
    ilaclar: ilaclarQ.data || [],
    asilar: asilarQ.data || [],
    seanslar,
    notlar,
    cihaz: cihazQ.data || [],
    lablar: labQ.data || [],
    randevular: randevuQ.data || [],
    pediatrik,
    taranan,
  })

  const bas = kartMetin(kart)
  const govde = b.join('\n')
  const metin = dosyaKirp(bas, govde)
  return { metin, kart }
}

export async function hastaDosyasiniDerle(
  supabase: SupabaseClient,
  doktorId: string,
  patientId: string
): Promise<string | null> {
  const p = await hastaDosyaPaketiniDerle(supabase, doktorId, patientId)
  return p?.metin ?? null
}

function dosyaKirp(bas: string, govde: string, limit = 48000): string {
  const tam = `${bas}\n\n${govde}`
  if (tam.length <= limit) return tam
  const ara = '\n\n…(eski vizit özetleri kısaltıldı)…\n'
  const basBudce = Math.min(bas.length, 8000)
  const govdeBas = Math.min(12000, govde.length)
  const kalan = Math.max(8000, limit - basBudce - govdeBas - ara.length)
  return `${bas.slice(0, basBudce)}\n\n${govde.slice(0, govdeBas)}${ara}${govde.slice(-kalan)}`
}

function kartKur(g: {
  yas: string
  cinsiyet: string
  yanitlar: Record<string, unknown> | null
  ilaclar: Record<string, unknown>[]
  asilar: Record<string, unknown>[]
  seanslar: { id: string; created_at: string }[]
  notlar: Record<string, unknown>[]
  cihaz: { tur?: string; deger?: string | null; birim?: string | null; alindi?: string }[]
  lablar: { canonical_key?: string; kanonik_deger?: string | null; value_text?: string | null; numune_tarihi?: string | null }[]
  randevular: { baslangic?: string; tur?: string | null; durum?: string | null }[]
  pediatrik: boolean
  taranan: { id: string; deger: string }[]
}): HastaDosyaKart {
  const k = bosKart()
  k.yas = g.yas
  // NOTYA-SES-KART-01: a child is "kız / erkek çocuk", not "Kadın / Erkek".
  k.cinsiyet = g.pediatrik && /^kad/i.test(g.cinsiyet) ? 'kız çocuk' : g.pediatrik && /^erk/i.test(g.cinsiyet) ? 'erkek çocuk' : g.cinsiyet
  const y = g.yanitlar || {}
  const alerji = String(y.alerjiAciklama || y.alerji || '').trim()
  if (alerji) k.alerji = alerji
  const kronikHam = y.kronikHastaliklar ?? y.kronik
  if (Array.isArray(kronikHam)) {
    const birlesik = kronikHam.map(String).filter((s) => s.trim()).join(', ')
    if (birlesik) k.kronik = birlesik
  } else if (String(kronikHam || '').trim()) {
    k.kronik = String(kronikHam).trim()
  }
  const kan = String(y.kanGrubu || '').trim()
  if (kan) k.kanGrubu = kan

  const ilacSatir = g.ilaclar.slice(0, 8).map((i) => [i.ilac_adi || i.ad, i.doz].filter(Boolean).join(' ')).filter(Boolean)
  if (ilacSatir.length) k.ilaclar = ilacSatir.join('; ')

  const asiSatir = g.asilar.slice(0, 5).map((a) => `${a.asi_adi || '?'}${a.uygulama_tarihi ? ` ${trTarih(String(a.uygulama_tarihi))}` : ''}`)
  if (asiSatir.length) k.asilar = asiSatir.join('; ')

  const notlarSirali = [...g.notlar].sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')))
  k.vizitSayisi = g.seanslar.length
  if (g.seanslar.length) {
    k.vizitAralik = `${trTarih(g.seanslar[0].created_at)} – ${trTarih(g.seanslar[g.seanslar.length - 1].created_at)}`
    const son = g.seanslar[g.seanslar.length - 1]
    const n = notlarSirali.find((x) => String(x.session_id) === String(son.id))
    const sikayet = String(n?.basvuru_yakinmasi || '').trim() || String(n?.content_subjektif || '').slice(0, 120).trim()
    k.sonVizit = `${trTarih(son.created_at)}${sikayet ? ` — ${sikayet}` : ''}`
    if (sikayet) k.sonSikayet = sikayet
    if (n?.content_tani) k.sonTani = String(n.content_tani)
    // NOTYA-SES-KART-01 (Dr. Gökhan): the voice card also carries the examination and the plan / follow-up;
    // without them voice answered "kontrol bilgisi dosyada yok" although the note had it.
    const satir = (v: unknown) => String(v || '').split(String.fromCharCode(10)).map((x) => x.trim()).filter(Boolean).join(' ')
    const bulgu = satir(n?.content_objektif)
    if (bulgu) k.sonBulgu = bulgu.slice(0, 400)
    const plan = satir(n?.content_plan)
    if (plan) k.sonPlan = plan.slice(0, 700)
  }

  const receteler: string[] = []
  for (const n of [...notlarSirali].reverse()) {
    const liste = n.content_ilaclar
    if (!Array.isArray(liste)) continue
    for (const x of liste) {
      const ad = typeof x === 'string' ? x : String((x as { ad?: string }).ad || '')
      if (ad) receteler.push(ad)
    }
    if (receteler.length) {
      k.sonRecete = `${receteler.slice(0, 6).join(', ')} (${trTarih(String(n.created_at || ''))})`
      break
    }
  }

  const cihaz = g.cihaz[0]
  if (cihaz?.deger) k.olcum = `${cihaz.tur || 'ölçüm'} ${cihaz.deger} ${cihaz.birim || ''} (${trTarih(cihaz.alindi)})`.trim()
  if (k.olcum === 'kayıt yok') {
    const vitalNot = [...notlarSirali].reverse().find((n) => n.vitaller && typeof n.vitaller === 'object')
    if (vitalNot) {
      let ozet = yasamsalBulguOzeti(vitalNot.vitaller as never)
      if (!g.pediatrik) ozet = ozet.replace(/Baş Çevresi:[^·]+·?\s*/gi, '').trim()
      if (ozet) k.olcum = ozet
    }
  }

  const labGorulen = new Set<string>()
  const labSatir: string[] = []
  for (const l of g.lablar) {
    const key = String(l.canonical_key || '')
    if (!key || labGorulen.has(key)) continue
    labGorulen.add(key)
    labSatir.push(`${key} ${l.kanonik_deger || l.value_text || ''} (${trTarih(l.numune_tarihi)})`.trim())
    if (labSatir.length >= 6) break
  }
  if (labSatir.length) k.lab = labSatir.join('; ')

  const simdi = Date.now()
  const sonraki = g.randevular.find((r) => r.baslangic && new Date(r.baslangic).getTime() >= simdi)
  if (sonraki?.baslangic) k.randevu = `${trTarih(sonraki.baslangic)}${sonraki.tur ? ` — ${sonraki.tur}` : ''}`

  for (const f of g.taranan) {
    if (f.id === 'alerjiAciklama' && kartBosMu(k.alerji)) k.alerji = f.deger
    if (f.id === 'kanGrubu' && kartBosMu(k.kanGrubu)) k.kanGrubu = f.deger
    if (f.id === 'kronikHastaliklar' && kartBosMu(k.kronik)) k.kronik = f.deger
    if (f.id === 'kullanilanIlaclar' && kartBosMu(k.ilaclar)) k.ilaclar = f.deger
    if (f.id === 'cinsiyet' && !k.cinsiyet) k.cinsiyet = f.deger
  }

  return k
}
