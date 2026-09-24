/**
 * NOTYA-DAH-WOW W4.1 — kohort verisi: hekimin dahiliye kartı olan hastaları. Yalnız kart tabloları + onaylı lab + görevler + seanslar.
 * Hasta adı yalnız kimliği doğrulanmış hekim yanıtında (şifre çözülür); dışa aktarım / T.C. yok.
 */
import { decrypt } from '@/lib/security/encryption'
import { kohortSatirlari, type KohortGirdi } from '@/specialties/dahiliye/engines/kohort'
import { kilitDegeri, type HekimKilit } from '@/specialties/dahiliye/engines/kart'
import type { Sb } from './_ortak'
import { arsivsizSeanslar } from '@/lib/doktor/arsiv'

const KART_TABLOLARI = ['dahiliye_ht', 'dahiliye_dm', 'dahiliye_lipid', 'dahiliye_ckd', 'dahiliye_kvr', 'dahiliye_hf', 'dahiliye_antikoagulan', 'dahiliye_pulm', 'dahiliye_tiroid']

export async function kohortVerisi(sb: Sb, doctorId: string, bugun: string, sadece?: string[]) {
  const idKumeleri = await Promise.all(KART_TABLOLARI.map(async (t) => { const { data } = await sb.from(t).select('patient_id').eq('doctor_id', doctorId).limit(2000); return (data || []).map((r) => String(r.patient_id)) }))
  let ids = Array.from(new Set(idKumeleri.flat()))
  if (sadece) ids = ids.filter((x) => sadece.includes(x))
  ids = ids.slice(0, 500)
  if (!ids.length) return { satirlar: [], toplamHasta: 0 }
  const [pQ, htQ, dmQ, lipQ, kilitQ, labQ, gQ, sQ, tokQ] = await Promise.all([
    sb.from('patients').select('id, name_encrypted').eq('doctor_id', doctorId).in('id', ids),
    sb.from('dahiliye_ht').select('patient_id, tarih, degerlendirme, teknik_onay').eq('doctor_id', doctorId).in('patient_id', ids).order('tarih', { ascending: false }).limit(3000),
    sb.from('dahiliye_dm').select('patient_id').in('patient_id', ids),
    sb.from('dahiliye_lipid').select('patient_id, hedef_ldl').in('patient_id', ids),
    sb.from('dahiliye_kart_kilitleri').select('patient_id, kart, alan, deger, created_at').in('patient_id', ids).eq('kart', 'kvr').eq('alan', 'hedef_ldl').order('created_at', { ascending: false }).limit(3000),
    sb.from('lab_satirlar').select('patient_id, canonical_key, kanonik_deger, numune_tarihi').in('patient_id', ids).eq('onayli', true).in('canonical_key', ['HbA1c', 'LDL', 'eGFR']).not('numune_tarihi', 'is', null).order('numune_tarihi', { ascending: false }).limit(5000),
    sb.from('dahiliye_gorevleri').select('patient_id, kod, kaynak, due').eq('doctor_id', doctorId).eq('durum', 'acik').in('patient_id', ids).lt('due', bugun).limit(5000),
    arsivsizSeanslar(sb, 'patient_id, created_at').eq('doctor_id', doctorId).in('patient_id', ids).order('created_at', { ascending: false }).limit(5000),
    sb.from('hasta_portal_tokens').select('patient_id').eq('doctor_id', doctorId).in('patient_id', ids).gt('expires_at', new Date().toISOString()),
  ])
  const ad = new Map<string, string>()
  for (const p of pQ.data || []) { let n = 'Hasta'; try { const j = JSON.parse(decrypt(String(p.name_encrypted))); n = `${j.ad || ''} ${j.soyad || ''}`.trim() || 'Hasta' } catch { /* varsayılan */ } ad.set(String(p.id), n) }
  const ilk = <T extends { patient_id: string }>(rows: T[] | null) => { const m = new Map<string, T>(); for (const r of rows || []) if (!m.has(String(r.patient_id))) m.set(String(r.patient_id), r); return m }
  const ht = ilk(htQ.data as { patient_id: string; degerlendirme: { hedefteMi?: boolean } | null; teknik_onay: boolean | null }[] | null)
  const lip = ilk(lipQ.data as { patient_id: string; hedef_ldl: number | null }[] | null)
  const dm = new Set((dmQ.data || []).map((r) => String(r.patient_id)))
  const son = ilk(sQ.data as { patient_id: string; created_at: string }[] | null)
  const portal = new Set((tokQ.data || []).map((r) => String(r.patient_id)))
  const lab = new Map<string, number>()
  for (const r of labQ.data || []) { const k = `${r.patient_id}.${r.canonical_key}`; if (!lab.has(k) && r.kanonik_deger != null) lab.set(k, Number(r.kanonik_deger)) }
  const kilitHasta = new Map<string, HekimKilit[]>()
  for (const k of kilitQ.data || []) { const id = String(k.patient_id); if (!kilitHasta.has(id)) kilitHasta.set(id, []); kilitHasta.get(id)!.push(k as HekimKilit) }
  const girdi: KohortGirdi[] = ids.filter((id) => ad.has(id)).map((id) => {
    const h = ht.get(id)
    const hedefteMi = h?.degerlendirme?.hedefteMi
    return {
      patientId: id, ad: ad.get(id)!,
      hba1c: dm.has(id) || lab.has(`${id}.HbA1c`) ? lab.get(`${id}.HbA1c`) ?? null : null,
      kbHedefteMi: h && h.teknik_onay !== false && typeof hedefteMi === 'boolean' ? hedefteMi : null,
      ldl: lab.get(`${id}.LDL`) ?? null, ldlHedef: kilitDegeri<number>(kilitHasta.get(id) || [], 'kvr', 'hedef_ldl') ?? (lip.get(id)?.hedef_ldl != null ? Number(lip.get(id)!.hedef_ldl) : null),
      egfr: lab.get(`${id}.eGFR`) ?? null,
      gorevler: (gQ.data || []).filter((g) => String(g.patient_id) === id).map((g) => ({ kaynak: g.kaynak, kod: String(g.kod), due: g.due })),
      sonVizit: son.get(id)?.created_at ? String(son.get(id)!.created_at).slice(0, 10) : null,
      portalVar: portal.has(id),
    }
  })
  return { satirlar: kohortSatirlari(girdi, bugun), toplamHasta: girdi.length }
}
