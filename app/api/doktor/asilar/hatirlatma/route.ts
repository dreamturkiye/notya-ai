/**
 * ASI-KARNESI-01 (D) — hekim onaylı aşı hatırlatması. Kaan'ın kararı: OTOMATİK GÖNDERİM YOK.
 *
 * GET  [?patientId] → hekimin kendi hastalarında (patientId verilirse yalnız o hasta — hasta dosyası › Aşılar) hekimin girdiği `sonraki_doz_tarihi` yaklaşan (≤ 30 gün) ya da geçmiş (≤ 90 gün)
 *        aşı satırları; her satırda gidecek metnin önizlemesi ve "gönderildi" durumu. Sonraki dozu aynı hastada daha
 *        sonra kaydedilmiş satır listelenmez. Hekim ya da sekreteri görebilir (ad çözümü yalnız doctor_id kapsamında).
 * POST { asiId, hekimOnayi: true } → YALNIZ hekim; açık onay yoksa 400. Önce `hatirlatma_gonderildi` atomik olarak
 *        işaretlenir (yalnız işaretli değilse) — ikinci gönderim 409; sonra MEVCUT Sağlığım mesaj yolu
 *        (hasta_mesaj_konulari + hasta_mesajlar + gövdesiz e-posta bildirimi, pediatri kohortuyla aynı). Mesaj
 *        yazılamazsa işaret geri alınır.
 *
 * HASTA-IZOLASYON-01: asiId dışarıdan gelir → satır (id, doktor_id) ile çözülür, hastası hastaSahibiMi ile yeniden
 * doğrulanır; liste sorguları doktor_id / doctor_id ile daraltılır, başka hekimin hastası adıyla çözülmez.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { decrypt } from '@/lib/security/encryption'
import { notifyPatientNewPracticeMessage } from '@/lib/portal/notifyPatientEmail'
import { veliOnamGerekliMi } from '@/lib/specialties/kapsam'
import { bugunTrIso } from '@/lib/asi/karneSunucu'
import {
  asiHatirlatmaMesaji, durumEtiketi, hatirlatmaDurumu, hatirlatmaPenceresi, hatirlatmaSirala, sonrakiDozKarsilandiMi,
  type AsiHatirlatmaSatiri,
} from '@/lib/asi/hatirlatma'

export const dynamic = 'force-dynamic'

const coz = (v: unknown): string => { if (!v) return ''; try { return decrypt(String(v)) } catch { return '' } }
const parcala = <T,>(x: T[], n = 150): T[][] => { const o: T[][] = []; for (let i = 0; i < x.length; i += n) o.push(x.slice(i, i + n)); return o }
const dogumIso = (v: unknown) => { const d = coz(v).slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null }

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum
  const bugun = bugunTrIso()
  const { bas, son } = hatirlatmaPenceresi(bugun)
  const tekHasta = req.nextUrl.searchParams.get('patientId')
  if (tekHasta && !(await hastaSahibiMi(supabase, doktorId, tekHasta))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })

  let sorgu = supabase
    .from('asilar')
    .select('id, patient_id, asi_adi, doz_no, uygulama_tarihi, sonraki_doz_tarihi, hatirlatma_gonderildi')
    .eq('doktor_id', doktorId)
  if (tekHasta) sorgu = sorgu.eq('patient_id', tekHasta)
  const { data: adaylar, error } = await sorgu
    .not('sonraki_doz_tarihi', 'is', null)
    .gte('sonraki_doz_tarihi', bas)
    .lte('sonraki_doz_tarihi', son)
    .order('sonraki_doz_tarihi', { ascending: true })
    .limit(500)
  if (error) return NextResponse.json({ error: 'Aşı hatırlatmaları alınamadı.' }, { status: 500 })
  const ids = Array.from(new Set((adaylar || []).map((a) => String(a.patient_id))))
  if (!ids.length) return NextResponse.json({ satirlar: [] })

  const [hastalar, tumAsilar, portal] = await Promise.all([
    Promise.all(parcala(ids).map((p) => supabase.from('patients').select('id, name_encrypted, dob_encrypted, is_active').eq('doctor_id', doktorId).in('id', p))),
    Promise.all(parcala(ids).map((p) => supabase.from('asilar').select('id, patient_id, asi_adi, uygulama_tarihi').eq('doktor_id', doktorId).in('patient_id', p).limit(5000))),
    Promise.all(parcala(ids).map((p) => supabase.from('hasta_portal_tokens').select('patient_id').eq('doctor_id', doktorId).in('patient_id', p).gt('expires_at', new Date().toISOString()))),
  ])
  const hasta = new Map<string, { ad: string; cocuk: boolean }>()
  for (const p of hastalar.flatMap((r) => r.data || [])) {
    if (p.is_active === false) continue
    let ad = 'Hasta'
    try { const j = JSON.parse(coz(p.name_encrypted) || '{}'); ad = `${j.ad || ''} ${j.soyad || ''}`.trim() || 'Hasta' } catch { /* varsayılan */ }
    hasta.set(String(p.id), { ad, cocuk: veliOnamGerekliMi(dogumIso(p.dob_encrypted)) })
  }
  const tum = tumAsilar.flatMap((r) => r.data || []).map((a) => ({ id: String(a.id), patient_id: String(a.patient_id), asi_adi: a.asi_adi, uygulama_tarihi: a.uygulama_tarihi }))
  const portalSet = new Set(portal.flatMap((r) => r.data || []).map((r) => String(r.patient_id)))

  const satirlar: AsiHatirlatmaSatiri[] = []
  for (const a of adaylar || []) {
    const h = hasta.get(String(a.patient_id))
    if (!h) continue // başka hekimin hastasına iliştirilmiş (kirli) satır ya da pasif hasta — ad çözülmez, listelenmez
    const sonraki = String(a.sonraki_doz_tarihi).slice(0, 10)
    const durum = hatirlatmaDurumu(sonraki, bugun)
    if (!durum) continue
    if (sonrakiDozKarsilandiMi({ id: String(a.id), patient_id: String(a.patient_id), asi_adi: a.asi_adi, uygulama_tarihi: a.uygulama_tarihi }, tum)) continue
    satirlar.push({
      asiId: String(a.id), patientId: String(a.patient_id), hastaAdi: h.ad, asiAdi: String(a.asi_adi || ''), dozNo: a.doz_no ?? null,
      sonrakiDozTarihi: sonraki, durum, durumEtiketi: durumEtiketi(sonraki, bugun), gonderildi: a.hatirlatma_gonderildi === true,
      portalVar: portalSet.has(String(a.patient_id)), onizleme: asiHatirlatmaMesaji({ tarihIso: sonraki, cocuk: h.cocuk }),
    })
  }
  return NextResponse.json({ satirlar: satirlar.sort(hatirlatmaSirala) })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  // Hatırlatmayı göndermek hekimin kararıdır (Kaan) — sekreter listeyi görür, gönderemez.
  const yasak = sadeceDoktor(oturum)
  if (yasak) return yasak
  const { supabase, doktorId } = oturum

  const body = (await req.json().catch(() => null)) as { asiId?: unknown; hekimOnayi?: unknown } | null
  if (body?.hekimOnayi !== true) return NextResponse.json({ error: 'Hatırlatma hekim onayı olmadan gönderilmez.' }, { status: 400 })
  const asiId = String(body.asiId || '')
  if (!asiId) return NextResponse.json({ error: 'asiId zorunludur.' }, { status: 400 })

  const { data: asi } = await supabase.from('asilar').select('id, patient_id, sonraki_doz_tarihi, hatirlatma_gonderildi').eq('id', asiId).eq('doktor_id', doktorId).maybeSingle()
  if (!asi) return NextResponse.json({ error: 'Aşı kaydı bulunamadı.' }, { status: 404 })
  const patientId = String(asi.patient_id)
  if (!(await hastaSahibiMi(supabase, doktorId, patientId))) return NextResponse.json({ error: 'Aşı kaydı bulunamadı.' }, { status: 404 })
  const tarih = String(asi.sonraki_doz_tarihi || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tarih)) return NextResponse.json({ error: 'Bu kayıtta sonraki doz tarihi yok.' }, { status: 400 })
  if (asi.hatirlatma_gonderildi === true) return NextResponse.json({ error: 'Bu aşı için hatırlatma zaten gönderildi.' }, { status: 409 })

  // Mükerrer gönderim engeli: yalnız HENÜZ işaretli değilse işaretle (eşzamanlı iki tık da tek mesaj üretir).
  const { data: kilit } = await supabase.from('asilar').update({ hatirlatma_gonderildi: true })
    .eq('id', asiId).eq('doktor_id', doktorId).not('hatirlatma_gonderildi', 'is', true).select('id')
  if (!kilit?.length) return NextResponse.json({ error: 'Bu aşı için hatırlatma zaten gönderildi.' }, { status: 409 })
  const geriAl = () => supabase.from('asilar').update({ hatirlatma_gonderildi: false }).eq('id', asiId).eq('doktor_id', doktorId)

  const { data: hastaRow } = await supabase.from('patients').select('dob_encrypted').eq('id', patientId).eq('doctor_id', doktorId).maybeSingle()
  const m = asiHatirlatmaMesaji({ tarihIso: tarih, cocuk: veliOnamGerekliMi(dogumIso(hastaRow?.dob_encrypted)) })
  const { data: konu, error: konuHata } = await supabase.from('hasta_mesaj_konulari')
    .insert({ doctor_id: doktorId, patient_id: patientId, konu: m.konu, hasta_klasor: 'gelen', son_mesaj_at: new Date().toISOString(), okundu_hasta: false, okundu_pratik: true })
    .select('id').single()
  if (konuHata || !konu) { await geriAl(); return NextResponse.json({ error: 'Hatırlatma gönderilemedi.' }, { status: 500 }) }
  const { error: mesajHata } = await supabase.from('hasta_mesajlar').insert({ konu_id: konu.id, taraf: 'doktor', yazar_user_id: doktorId, metin: m.metin })
  if (mesajHata) {
    await supabase.from('hasta_mesaj_konulari').delete().eq('id', konu.id).eq('doctor_id', doktorId)
    await geriAl()
    return NextResponse.json({ error: 'Hatırlatma gönderilemedi.' }, { status: 500 })
  }
  try { await notifyPatientNewPracticeMessage(supabase, { doctorId: doktorId, patientId }) } catch { /* bildirim hatası gönderimi bozmaz */ }
  return NextResponse.json({ ok: true, gonderildi: true })
}
