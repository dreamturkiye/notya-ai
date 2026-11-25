/**
 * HASTA-PORTALI-GUNLUK — scheduled work of the daily health home. Server only; called by /api/cron/saglik-evi.
 *
 *  doz        (every 15 min) web push for dose slots that came due in the last window and are not marked yet, plus
 *             postponed ("Ertele") doses whose snooze ended. One notification per patient per slot time, generic words
 *             only. Quiet hours and the patient's reminder switch are respected.
 *  gunluk     (once a day) gentle push after two missed days of a medicine (once per medicine per 3 days); a doctor-
 *             flagged kritik medicine also creates a hekime_bildir alert (consented patients only); the Kontrol Öncesi
 *             Özet for tomorrow's appointments.
 *
 * performans-butcesi-koruma: every step is a constant number of batched queries (`.in(...)` over the patients of the
 * window), never one round trip per patient or per slot. Idempotency: each notice first claims a unique key in
 * ev_bildirim_gunlugu (insert … on conflict do nothing); only claimed keys are sent, so a re-run sends nothing twice.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { gunSlotlari, ikiGunKacirdiMi } from './dozPlani'
import { gurultuSuz } from './kurallar'
import { kayitSatiri, planSatiri } from './sunucu'
import { kontrolOzetiOlustur } from './hekimSunucu'
import { pushGonder, type PushIcerigi, type PushSonucu, type VapidAnahtarlari } from './push/webPush'
import { gunEkle, sessizSaatteMi, trDakika, trGun, trGunBasi, GUN_MS } from './zaman'
import { hekimeBildir, type HekimGonderici, type YeniUyari } from './hekimBildirim'
import type { DozPlani, UyariDuzeyi } from './tipler'

type Sb = SupabaseClient
export const PENCERE_DK = 15
const ESZAMANLI = 20

type Gonderici = (abone: { endpoint: string; p256dh: string; auth: string }, icerik: PushIcerigi) => Promise<PushSonucu>

export function varsayilanGonderici(v: VapidAnahtarlari): Gonderici {
  return (a, i) => pushGonder(a, i, v)
}

/** Claim idempotency keys; returns the keys THIS run inserted. */
async function talepEt(sb: Sb, satirlar: Array<{ doctor_id: string; patient_id: string; tur: string; anahtar: string }>): Promise<Set<string>> {
  if (!satirlar.length) return new Set()
  const { data } = await sb.from('ev_bildirim_gunlugu').upsert(satirlar, { onConflict: 'anahtar', ignoreDuplicates: true }).select('anahtar')
  return new Set(((data || []) as Array<{ anahtar: string }>).map((r) => r.anahtar))
}

async function hepsiniGonder(sb: Sb, isler: Array<{ kisi: string; icerik: PushIcerigi }>, abonelikler: Map<string, Array<Record<string, any>>>, gonder: Gonderici) {
  const gorevler: Array<() => Promise<void>> = []
  let basarili = 0
  const silinecek: string[] = []
  for (const is of isler) for (const a of abonelikler.get(is.kisi) || []) {
    gorevler.push(async () => {
      const r = await gonder({ endpoint: a.endpoint, p256dh: a.p256dh, auth: a.auth }, is.icerik)
      if (r.ok) basarili++
      else if (r.sil) silinecek.push(String(a.id))
    })
  }
  for (let i = 0; i < gorevler.length; i += ESZAMANLI) await Promise.all(gorevler.slice(i, i + ESZAMANLI).map((g) => g()))
  if (silinecek.length) await sb.from('ev_push_abonelikleri').delete().in('id', silinecek)
  return { gonderilen: basarili, silinen: silinecek.length }
}

async function aboneVeTercihler(sb: Sb, simdiMs: number) {
  const { data: abo } = await sb.from('ev_push_abonelikleri').select('id, doctor_id, patient_id, endpoint, p256dh, auth').limit(5000)
  const abonelikler = new Map<string, Array<Record<string, any>>>()
  for (const a of (abo || []) as Record<string, any>[]) {
    const k = `${a.doctor_id}|${a.patient_id}`
    abonelikler.set(k, [...(abonelikler.get(k) || []), a])
  }
  const hastaIdler = [...new Set(((abo || []) as Record<string, any>[]).map((a) => String(a.patient_id)))]
  if (!hastaIdler.length) return { abonelikler, hastaIdler, uygun: new Set<string>() }
  const { data: ter } = await sb.from('ev_tercihler').select('doctor_id, patient_id, sessiz_bas, sessiz_bit, hatirlatma_acik').in('patient_id', hastaIdler)
  const tercih = new Map(((ter || []) as Record<string, any>[]).map((t) => [`${t.doctor_id}|${t.patient_id}`, t]))
  const dk = trDakika(simdiMs)
  const uygun = new Set<string>()
  for (const k of abonelikler.keys()) {
    const t = tercih.get(k)
    if (t && t.hatirlatma_acik === false) continue
    if (sessizSaatteMi(dk, t?.sessiz_bas || '23:00', t?.sessiz_bit || '07:00')) continue
    uygun.add(k)
  }
  return { abonelikler, hastaIdler, uygun }
}

export async function dozHatirlatmalari(sb: Sb, gonder: Gonderici, simdiMs = Date.now()) {
  const { abonelikler, uygun } = await aboneVeTercihler(sb, simdiMs)
  if (!uygun.size) return { aday: 0, gonderilen: 0, silinen: 0 }
  const hastaIdler = [...new Set([...uygun].map((k) => k.split('|')[1]))]
  const bugun = trGun(simdiMs)
  const [{ data: planR }, { data: kayitR }] = await Promise.all([
    sb.from('ev_ilac_planlari').select('*').in('patient_id', hastaIdler).eq('aktif', true).eq('gerektikce', false).limit(10000),
    sb.from('ev_doz_kayitlari').select('id, plan_id, planlanan_at, durum, kayit_at, ertele_until, doctor_id, patient_id').in('patient_id', hastaIdler).gte('planlanan_at', trGunBasi(gunEkle(bugun, -1)).toISOString()).limit(20000),
  ])
  const pencereBas = simdiMs - PENCERE_DK * 60_000
  const kayitlar = ((kayitR || []) as Record<string, any>[]).map((r) => ({ ...kayitSatiri(r), kisi: `${r.doctor_id}|${r.patient_id}` }))
  const isaretli = new Set(kayitlar.filter((k) => k.durum === 'alindi' || k.durum === 'atlandi').map((k) => `${k.planId}|${k.planlananAt}`))
  // kişi|slot → plan count
  const gruplar = new Map<string, { kisi: string; slot: string; sayi: number; ertele: boolean }>()
  for (const r of (planR || []) as Record<string, any>[]) {
    const kisi = `${r.doctor_id}|${r.patient_id}`
    if (!uygun.has(kisi)) continue
    const p: DozPlani = planSatiri(r)
    for (const s of gunSlotlari(p, bugun)) {
      const t = Date.parse(s)
      if (t <= pencereBas || t > simdiMs || isaretli.has(`${p.id}|${s}`)) continue
      const k = `${kisi}|${s}`
      gruplar.set(k, { kisi, slot: s, sayi: (gruplar.get(k)?.sayi || 0) + 1, ertele: false })
    }
  }
  for (const k of kayitlar) {
    if (k.durum !== 'ertelendi' || !k.erteleUntil || !uygun.has(k.kisi)) continue
    const t = Date.parse(k.erteleUntil)
    if (t <= pencereBas || t > simdiMs) continue
    const anahtar = `${k.kisi}|${k.planlananAt}|e`
    gruplar.set(anahtar, { kisi: k.kisi, slot: k.planlananAt, sayi: (gruplar.get(anahtar)?.sayi || 0) + 1, ertele: true })
  }
  const satirlar = [...gruplar.entries()].map(([k, g]) => { const [d, p] = g.kisi.split('|'); return { doctor_id: d, patient_id: p, tur: 'doz', anahtar: `doz:${k}` } })
  const alinan = await talepEt(sb, satirlar)
  const isler = [...gruplar.entries()].filter(([k]) => alinan.has(`doz:${k}`)).map(([, g]) => {
    const saat = new Date(Date.parse(g.slot) + 3 * 3600_000).toISOString().slice(11, 16)
    return { kisi: g.kisi, icerik: { baslik: g.ertele ? 'Ertelediğiniz ilaç' : `İlaç saati · ${saat}`, govde: g.sayi > 1 ? `${g.sayi} ilacınız işaretlenmeyi bekliyor. Aldıysanız "Aldım"a dokunun.` : 'Bir ilacınız işaretlenmeyi bekliyor. Aldıysanız "Aldım"a dokunun.', yol: '', etiket: `doz-${g.slot}` } }
  })
  const r = await hepsiniGonder(sb, isler, abonelikler, gonder)
  return { aday: gruplar.size, ...r }
}

export async function gunlukIsler(sb: Sb, gonder: Gonderici | null, simdiMs = Date.now(), hekimGonder: HekimGonderici | null = null) {
  const bugun = trGun(simdiMs)
  // ── 1) two missed days ──
  const { data: planR } = await sb.from('ev_ilac_planlari').select('*').eq('aktif', true).eq('gerektikce', false).limit(20000)
  const planlar = ((planR || []) as Record<string, any>[]).map((r) => ({ p: planSatiri(r), kisi: `${r.doctor_id}|${r.patient_id}`, doctorId: String(r.doctor_id), patientId: String(r.patient_id) }))
  const hastaIdler = [...new Set(planlar.map((x) => x.patientId))]
  let kacirma = 0, kritik = 0
  if (hastaIdler.length) {
    const [{ data: kayitR }, { data: ter }, { data: log }, { data: oncekiUyari }] = await Promise.all([
      sb.from('ev_doz_kayitlari').select('id, plan_id, planlanan_at, durum, kayit_at, ertele_until').in('patient_id', hastaIdler).gte('planlanan_at', trGunBasi(gunEkle(bugun, -2)).toISOString()).limit(50000),
      sb.from('ev_tercihler').select('doctor_id, patient_id, paylasim_onayi, hatirlatma_acik').in('patient_id', hastaIdler),
      sb.from('ev_bildirim_gunlugu').select('anahtar').eq('tur', 'kacirma').gte('created_at', new Date(simdiMs - 3 * GUN_MS).toISOString()).limit(20000),
      sb.from('ev_uyarilar').select('doctor_id, patient_id, anahtar, duzey, olusturma_at').in('patient_id', hastaIdler).eq('kural', 'kritik_ilac').gte('olusturma_at', new Date(simdiMs - 3 * GUN_MS).toISOString()).limit(5000),
    ])
    const kayitlar = ((kayitR || []) as Record<string, any>[]).map(kayitSatiri)
    const tercih = new Map(((ter || []) as Record<string, any>[]).map((t) => [`${t.doctor_id}|${t.patient_id}`, t]))
    const sonUc = new Set(((log || []) as Array<{ anahtar: string }>).map((l) => l.anahtar.split(':').slice(0, 2).join(':')))
    const hastaKayit: Array<{ doctor_id: string; patient_id: string; tur: string; anahtar: string }> = []
    const uyariSatirlari: Array<Record<string, unknown>> = []
    for (const x of planlar) {
      if (!ikiGunKacirdiMi(x.p, kayitlar, simdiMs)) continue
      const t = tercih.get(x.kisi)
      if (gonder && t?.hatirlatma_acik !== false && !sonUc.has(`kacirma:${x.p.id}`)) hastaKayit.push({ doctor_id: x.doctorId, patient_id: x.patientId, tur: 'kacirma', anahtar: `kacirma:${x.p.id}:${bugun}` })
      if (x.p.kritik && t?.paylasim_onayi) {
        const anahtar = `kritik_ilac:${x.p.id}`
        const onceki = ((oncekiUyari || []) as Record<string, any>[]).filter((u) => u.doctor_id === x.doctorId && u.patient_id === x.patientId).map((u) => ({ anahtar: String(u.anahtar), duzey: u.duzey as UyariDuzeyi, olusturmaAt: String(u.olusturma_at) }))
        const kural = { kural: 'kritik_ilac', anahtar, duzey: 'hekime_bildir' as const, metrik: 'ilac', hastaMetni: `${x.p.ad} için iki gündür doz işaretlenmedi. Doktorunuza bildirdik. İlacınızı bıraktıysanız ya da bir sorun yaşıyorsanız Mesajlar'dan yazın.`, hekimMetni: `Kritik ilaç "${x.p.ad}": son 2 günde hiç doz işaretlenmedi.`, veri: { planId: x.p.id } }
        if (gurultuSuz([kural], onceki, simdiMs).length) {
          uyariSatirlari.push({ doctor_id: x.doctorId, patient_id: x.patientId, kural: kural.kural, anahtar, duzey: kural.duzey, metrik: kural.metrik, hasta_metni: kural.hastaMetni, hekim_metni: kural.hekimMetni, veri: kural.veri, olusturma_at: new Date(simdiMs).toISOString() })
        }
      }
    }
    if (uyariSatirlari.length) {
      const { data: eklenen } = await sb.from('ev_uyarilar').insert(uyariSatirlari).select('id, doctor_id, patient_id, duzey, kural')
      kritik = uyariSatirlari.length
      // HEKIM-PUSH: a kritik medicine lapse is hekime_bildir (adherence family) → working-hours push or the morning summary.
      if (hekimGonder && eklenen?.length) await hekimeBildir(sb, hekimGonder, (eklenen as YeniUyari[]).map((u) => ({ ...u, id: String(u.id), doctor_id: String(u.doctor_id), patient_id: String(u.patient_id) })), simdiMs)
    }
    const alinan = await talepEt(sb, hastaKayit)
    if (gonder && alinan.size) {
      const { abonelikler, uygun } = await aboneVeTercihler(sb, simdiMs)
      const kisiler = new Map<string, number>()
      for (const h of hastaKayit) if (alinan.has(h.anahtar)) { const k = `${h.doctor_id}|${h.patient_id}`; if (uygun.has(k)) kisiler.set(k, (kisiler.get(k) || 0) + 1) }
      const r = await hepsiniGonder(sb, [...kisiler].map(([kisi, n]) => ({ kisi, icerik: { baslik: 'Sağlığım', govde: n > 1 ? `${n} ilacınız iki gündür işaretlenmedi. Unuttuysanız sorun değil — bugün yeniden başlayabilirsiniz.` : 'Bir ilacınız iki gündür işaretlenmedi. Unuttuysanız sorun değil — bugün yeniden başlayabilirsiniz.', yol: '/doz-takvimi', etiket: `kacirma-${bugun}` } })), abonelikler, gonder)
      kacirma = r.gonderilen
    }
  }

  // ── 2) Kontrol Öncesi Özet for tomorrow's appointments ──
  const yarin = gunEkle(bugun, 1)
  const { data: rv } = await sb.from('randevular').select('id, doktor_id, patient_id, baslangic').in('durum', ['planlandi', 'onaylandi']).not('patient_id', 'is', null).gte('baslangic', trGunBasi(yarin).toISOString()).lt('baslangic', trGunBasi(gunEkle(yarin, 1)).toISOString()).limit(2000)
  let ozet = 0
  const randevular = (rv || []) as Record<string, any>[]
  if (randevular.length) {
    const pids = [...new Set(randevular.map((r) => String(r.patient_id)))]
    const [{ data: onay }, { data: varOlan }, { data: veri }] = await Promise.all([
      sb.from('ev_tercihler').select('doctor_id, patient_id').eq('paylasim_onayi', true).in('patient_id', pids),
      sb.from('ev_kontrol_ozetleri').select('randevu_id').in('randevu_id', randevular.map((r) => String(r.id))),
      sb.from('ev_olcumleri').select('doctor_id, patient_id').in('patient_id', pids).gte('olcum_at', new Date(simdiMs - 28 * GUN_MS).toISOString()).limit(20000),
    ])
    const onayli = new Set(((onay || []) as Record<string, any>[]).map((r) => `${r.doctor_id}|${r.patient_id}`))
    const yapilmis = new Set(((varOlan || []) as Record<string, any>[]).map((r) => String(r.randevu_id)))
    const veriVar = new Set(((veri || []) as Record<string, any>[]).map((r) => `${r.doctor_id}|${r.patient_id}`))
    // Each summary needs that patient's own rows; capped per run so the cron stays inside its time budget.
    const adaylar = randevular.filter((r) => onayli.has(`${r.doktor_id}|${r.patient_id}`) && veriVar.has(`${r.doktor_id}|${r.patient_id}`) && !yapilmis.has(String(r.id))).slice(0, 40)
    for (let i = 0; i < adaylar.length; i += 8) {
      const sonuc = await Promise.all(adaylar.slice(i, i + 8).map((r) => kontrolOzetiOlustur(sb, String(r.doktor_id), String(r.patient_id), { id: String(r.id), baslangic: String(r.baslangic) }, simdiMs)))
      ozet += sonuc.filter((s) => s.ok).length
    }
  }
  return { kacirma, kritik, ozet }
}
