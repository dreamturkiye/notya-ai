/**
 * PEDI-ARACLAR-02 — pediatri kohort verisi + hasta-güvenli hatırlatma (route.ts yalnız handler export edebilir).
 * Kohort = hekimin kendi patients satırlarından (doctor_id) 18 yaş altı çocuklar. Her kaynak sorgu doctor_id / doktor_id ile
 * kapsanır ve yalnız bu kimliklerle daraltılır; ad yalnız kimliği doğrulanmış hekime şifre çözülerek döner.
 * Hatırlatma: mevcut Sağlığım mesaj kanalı (hasta_mesaj_konulari + hasta_mesajlar) + gövdesiz e-posta bildirimi — göz / KD
 * kohortuyla aynı kalıp; 7 gün içinde aynı konu gönderildiyse atlanır.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/security/encryption'
import { pediKohortSatirlari, type PediKohortGirdi } from '@/specialties/pediatri/engines/kohort'
import type { AsiKaydi } from '@/specialties/pediatri/engines/asiPlan'
import type { TaramaKaydi, TaramaSonuc, TaramaTur } from '@/specialties/pediatri/engines/gelisimPlan'
import type { Olcum } from '@/specialties/pediatri/engines/buyume'
import { gunFarki } from '@/specialties/pediatri/engines/girdi'
import { arsivsizIlaclar, arsivsizNotlar, arsivsizSeanslar } from '@/lib/doktor/arsiv'

const cozum = (v: unknown): string => { if (!v) return ''; try { return decrypt(String(v)) } catch { return '' } }
const gun = (v: unknown) => String(v || '').slice(0, 10)
const sayi = (x: unknown): number | null => { const n = parseFloat(String(x ?? '').replace(',', '.').replace(/[^0-9.]/g, '')); return Number.isFinite(n) && n > 0 ? n : null }
/** PostgREST URL uzunluğu için kimlik listeleri parça parça sorgulanır. */
const parcala = <T,>(x: T[], n = 150): T[][] => { const out: T[][] = []; for (let i = 0; i < x.length; i += n) out.push(x.slice(i, i + n)); return out }
async function topla<R>(ids: string[], sorgu: (parca: string[]) => PromiseLike<{ data: R[] | null }>): Promise<R[]> {
  const sonuclar = await Promise.all(parcala(ids).map((p) => sorgu(p)))
  return sonuclar.flatMap((r) => r.data || [])
}
function grupla<T>(rows: T[], anahtar: (r: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>()
  for (const r of rows) { const k = anahtar(r); if (!m.has(k)) m.set(k, []); m.get(k)!.push(r) }
  return m
}

export const KOHORT_UST_SINIR = 600

export async function pediKohortGirdileri(sb: SupabaseClient, doktorId: string, bugun: string, sadece?: string[]): Promise<{ girdiler: PediKohortGirdi[]; taramaTablosu: boolean }> {
  let pq = sb.from('patients').select('id, name_encrypted, dob_encrypted, gender_encrypted, is_active').eq('doctor_id', doktorId)
  if (sadece) pq = pq.in('id', sadece)
  const { data: hastalar } = await pq.order('created_at', { ascending: false }).limit(3000)
  const cocuklar: Array<{ id: string; ad: string; dogumIso: string; cinsiyet: 'male' | 'female' | null }> = []
  for (const p of hastalar || []) {
    if (p.is_active === false) continue
    const dob = cozum(p.dob_encrypted).slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || dob > bugun || gunFarki(dob, bugun) >= 18 * 365.25) continue
    let ad = 'Hasta'
    try { const j = JSON.parse(cozum(p.name_encrypted)); ad = `${j.ad || ''} ${j.soyad || ''}`.trim() || 'Hasta' } catch { /* varsayılan */ }
    const g = cozum(p.gender_encrypted)
    cocuklar.push({ id: String(p.id), ad, dogumIso: dob, cinsiyet: g === 'male' || g === 'female' ? g : null })
    if (cocuklar.length >= KOHORT_UST_SINIR) break
  }
  const ids = cocuklar.map((c) => c.id)
  if (!ids.length) return { girdiler: [], taramaTablosu: true }

  const [asilar, taramalarQ, mchat, gidr, seanslar, ilaclar, gorevler, kartlar, portal, notlar] = await Promise.all([
    topla(ids, (p) => sb.from('asilar').select('id, patient_id, asi_adi, doz_no, uygulama_tarihi, kaynak, kategori').eq('doktor_id', doktorId).in('patient_id', p).limit(20000)),
    Promise.all(parcala(ids).map((p) => sb.from('pedi_taramalar').select('patient_id, tur, tarih, sonuc').eq('doctor_id', doktorId).in('patient_id', p).limit(20000))),
    topla(ids, (p) => sb.from('mchat_testleri').select('patient_id, risk_seviyesi, toplam_puan, created_at').eq('doctor_id', doktorId).in('patient_id', p).limit(20000)),
    topla(ids, (p) => sb.from('gelisim_taramalari').select('patient_id, sevk_onerisi, created_at').eq('doctor_id', doktorId).in('patient_id', p).limit(20000)),
    topla<{ patient_id: string; created_at: string }>(ids, (p) => arsivsizSeanslar(sb, 'patient_id, created_at').eq('doctor_id', doktorId).in('patient_id', p).limit(20000)),
    topla<{ patient_id: string; ilac_adi: string | null; etken_madde: string | null; aktif: boolean | null; baslangic_tarihi: string | null; bitis_tarihi: string | null }>(ids, (p) => arsivsizIlaclar(sb, 'patient_id, ilac_adi, etken_madde, aktif, baslangic_tarihi, bitis_tarihi').eq('doctor_id', doktorId).in('patient_id', p).limit(20000)),
    topla(ids, (p) => sb.from('bebek_gorevleri').select('bebek_id, kind, due_at, due_end_at, status, title').eq('doctor_id', doktorId).in('bebek_id', p).limit(20000)),
    topla(ids, (p) => sb.from('bebek_kartlari').select('bebek_patient_id, gebelik_haftasi, kilo_gram, yenidogan_tarama, dogum_zamani').eq('doctor_id', doktorId).in('bebek_patient_id', p).limit(5000)),
    topla(ids, (p) => sb.from('hasta_portal_tokens').select('patient_id').eq('doctor_id', doktorId).in('patient_id', p).gt('expires_at', new Date().toISOString())),
    topla(ids, (p) => arsivsizNotlar(sb, 'created_at, vitaller, sessions!inner(patient_id, doctor_id)').eq('doctor_id', doktorId).eq('sessions.doctor_id', doktorId).in('sessions.patient_id', p).not('approved_at', 'is', null).not('vitaller', 'is', null).limit(20000)),
  ])
  const taramaTablosu = taramalarQ.every((r) => !r.error)
  const taramalar = taramalarQ.flatMap((r) => r.data || [])

  const pid = (r: { patient_id?: unknown }) => String(r.patient_id)
  const asiG = grupla(asilar, pid), tarG = grupla(taramalar, pid), mG = grupla(mchat, pid), gG = grupla(gidr, pid)
  const sG = grupla(seanslar, pid), iG = grupla(ilaclar, pid)
  const gorG = grupla(gorevler, (r) => String(r.bebek_id)), kartG = grupla(kartlar, (r) => String(r.bebek_patient_id))
  const portalSet = new Set(portal.map(pid))
  const olcumG = new Map<string, Olcum[]>()
  for (const n of notlar as Array<{ created_at: string; vitaller: Record<string, unknown> | null; sessions: { patient_id: string } | Array<{ patient_id: string }> }>) {
    const s = Array.isArray(n.sessions) ? n.sessions[0] : n.sessions
    if (!s) continue
    const v = n.vitaller || {}
    const o: Olcum = { tarih: gun(n.created_at), kilo: sayi(v.kilo), boy: sayi(v.boy), basCevresi: sayi(v.basCevresi) }
    if (!o.kilo && !o.boy && !o.basCevresi) continue
    const k = String(s.patient_id)
    if (!olcumG.has(k)) olcumG.set(k, [])
    olcumG.get(k)!.push(o)
  }

  const girdi: PediKohortGirdi[] = cocuklar.map((c) => {
    const kart = (kartG.get(c.id) || [])[0] as { gebelik_haftasi?: number | null; kilo_gram?: number | null; yenidogan_tarama?: Record<string, unknown> | null; dogum_zamani?: string | null } | undefined
    const tar: TaramaKaydi[] = (tarG.get(c.id) || []).map((t) => ({ tur: t.tur as TaramaTur, tarih: gun(t.tarih), sonuc: t.sonuc as TaramaSonuc }))
    const isitmeKart = kart?.yenidogan_tarama?.isitme
    if (isitmeKart === true || isitmeKart === 'gec') tar.push({ tur: 'isitme', tarih: gun(kart?.dogum_zamani) || c.dogumIso, sonuc: 'normal', kaynak: 'bebek_karti' })
    if (isitmeKart === 'kaldi') tar.push({ tur: 'isitme', tarih: gun(kart?.dogum_zamani) || c.dogumIso, sonuc: 'ileri_degerlendirme', kaynak: 'bebek_karti' })
    return {
      patientId: c.id, ad: c.ad, dogumIso: c.dogumIso, cinsiyet: c.cinsiyet,
      asilar: (asiG.get(c.id) || []).filter((a) => a.kategori !== 'yetiskin').map((a): AsiKaydi => ({ id: String(a.id), ad: String(a.asi_adi), dozNo: a.doz_no ?? null, tarih: a.uygulama_tarihi ? gun(a.uygulama_tarihi) : null, kaynak: a.kaynak === 'beyan' ? 'beyan' : 'kayit' })),
      taramalar: tar,
      mchat: (mG.get(c.id) || []).map((m) => ({ tarih: gun(m.created_at), risk: m.risk_seviyesi, puan: m.toplam_puan })),
      gidr: (gG.get(c.id) || []).map((x) => ({ tarih: gun(x.created_at), sevk: !!x.sevk_onerisi })),
      seanslar: (sG.get(c.id) || []).map((s) => gun(s.created_at)),
      olcumler: (olcumG.get(c.id) || []).sort((a, b) => a.tarih.localeCompare(b.tarih)),
      ilaclar: (iG.get(c.id) || []).map((i) => ({ ad: `${i.ilac_adi || ''} ${i.etken_madde || ''}`, aktif: i.aktif !== false && (!i.bitis_tarihi || gun(i.bitis_tarihi) >= bugun), baslangic: i.baslangic_tarihi ? gun(i.baslangic_tarihi) : null, bitis: i.bitis_tarihi ? gun(i.bitis_tarihi) : null })),
      bebekGorevleri: (gorG.get(c.id) || []).map((x) => ({ kind: String(x.kind), due: gun(x.due_at), dueEnd: x.due_end_at ? gun(x.due_end_at) : null, status: String(x.status), title: String(x.title || '') })),
      gebelikHaftasi: kart?.gebelik_haftasi != null ? Number(kart.gebelik_haftasi) : null,
      dogumKiloGr: kart?.kilo_gram != null ? Number(kart.kilo_gram) : null,
      portalVar: portalSet.has(c.id),
    }
  })
  return { girdiler: girdi, taramaTablosu }
}

export async function pediKohortVerisi(sb: SupabaseClient, doktorId: string, bugun: string, sadece?: string[]) {
  const { girdiler, taramaTablosu } = await pediKohortGirdileri(sb, doktorId, bugun, sadece)
  return { satirlar: pediKohortSatirlari(girdiler, bugun), toplamCocuk: girdiler.length, taramaTablosu }
}
