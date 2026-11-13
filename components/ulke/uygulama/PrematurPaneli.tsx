'use client'

/**
 * PREMATUR-ULKE-01 — Paediatrics › the preterm baby's follow-up plan, and the doctor's own list of such babies. Türkiye's own
 * screen (specialties/pediatri/ui/araclar/PrematurPlanPaneli.tsx: the baby's figures, the history form, the plan as cards with
 * a badge, the doctor's marks, the sources, the copyable plan) with the pack's words and the pack's table.
 *
 *   /tools?arac=prematur-takip&hasta=<id>   the plan of that baby
 *   /tools?arac=prematur-takip              the doctor's own babies, the most urgent first
 *
 * DECISION SUPPORT. The items are a checklist the DOCTOR confirms: nothing is ordered, referred, prescribed or sent, and there is
 * no dose. Every item shows its source and HOW that source was read; an item the country's source could not be read for is
 * "follow your local protocol", with no date and no criterion of ours. NO WORD IS WRITTEN HERE: every sentence is the pack's.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Bilgi, Hata, tarihYaz, YOL, type Uygulama } from './Kabuk'
import { aracYolu } from './aracOrtak'
import { panoyaKopyala } from './pano'
import { Istatistik, Katlanir, KaynakListesi, Rozet, UcDurum, type Ton } from './PrematurOrtak'
import { bicimli } from '@/lib/ulke/araclar/paket'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import type { PrematurMetni } from '@/lib/ulke/prematur/metin'
import { PREMATUR_ARACLARI, PREMATUR_API, type PrematurPaketi } from '@/lib/ulke/prematur/paket'
import type { BebekKohortYuku, BebekYuku } from '@/lib/ulke/prematur/apiTipleri'
import { bebekKohortu, DURUM_ANAHTARI, planMetni, yasSatirlari } from '@/lib/ulke/prematur/gorunum'
import { planGirdisiProfilden, profildenPlan, type OgeGorunum, type TakipOgesi } from '@/lib/ulke/prematur/plan'
import { gestasyonMetni } from '@/lib/ulke/prematur/yas'
import type { HekimDurumu, PrematurProfil } from '@/lib/ulke/prematur/tipler'

const TON: Record<OgeGorunum, Ton> = { gecikti: 'kirmizi', 'zamani-geldi': 'uyari', yaklasiyor: 'bilgi', planli: 'notr', 'kayit-eksik': 'uyari', yapildi: 'iyi', uygulanmaz: 'notr', 'kriter-disi': 'notr', bilgi: 'bilgi', 'veri-eksik': 'uyari', yerel: 'uyari' }
const BOOL_ALANLARI = ['oksijen28Gun', 'oksijen36Hafta', 'hsKkh', 'ototoksik5Gun', 'degisimTransfuzyonu', 'ecmo', 'ropSecili'] as const
const ANNE_ALANLARI = ['antenatalSteroid', 'pprom', 'magnezyum'] as const

type Form = { hf: string; gun: string; kilo: string; nicu: string } & Partial<Record<(typeof BOOL_ALANLARI)[number] | (typeof ANNE_ALANLARI)[number], boolean | null>>
const formdan = (p: PrematurProfil): Form => ({
  hf: p.gestasyonHafta != null ? String(p.gestasyonHafta) : '', gun: p.gestasyonHafta != null ? String(p.gestasyonGunKalan ?? 0) : '0', kilo: p.dogumKiloGr != null ? String(p.dogumKiloGr) : '', nicu: p.nicuGun != null ? String(p.nicuGun) : '',
  ...Object.fromEntries([...BOOL_ALANLARI, ...ANNE_ALANLARI].map((k) => [k, p[k] ?? null])),
})

/** The screen: the doctor's own list of babies (`kohort`), or the plan of one baby (`takip`: needs the patient the tools were opened for). */
export function PrematurPaneli({ u, hastaId, paket, mod }: { u: Uygulama; hastaId: string | null; paket: PrematurPaketi; mod: 'takip' | 'kohort' }) {
  const m = paket.metinler[u.dil]
  if (!m) return null
  if (mod === 'kohort') return <Kohort u={u} paket={paket} m={m} />
  return hastaId ? <Bebek u={u} hastaId={hastaId} paket={paket} m={m} /> : <section className="uza-kart" data-bolum="prematur-hasta-sec"><p className="uza-aciklama" style={{ marginTop: 0 }}>{m.ortak.hastaSec}</p><p className="uza-ipucu"><a className="uza-baglanti" href={YOL.hastalar}>{m.ortak.dosyayaGit}</a></p></section>
}

type M = PrematurMetni

function Kohort({ u, paket, m }: { u: Uygulama; paket: PrematurPaketi; m: M }) {
  const [y, setY] = useState<BebekKohortYuku | null>(null)
  const [hata, setHata] = useState(false)
  useEffect(() => {
    let iptal = false
    u.api(PREMATUR_API).then((r) => { if (!iptal) { if (r.ok) setY(r.j as BebekKohortYuku); else setHata(true) } }).catch(() => { if (!iptal) setHata(true) })
    return () => { iptal = true }
  }, [u])
  const satirlar = useMemo(() => (y ? bebekKohortu(y.satirlar, y.bugun, paket.protokol, m.bebek) : []), [y, paket, m])
  const b = m.bebek
  if (hata) return <Hata>{m.ortak.yuklenemedi}</Hata>
  if (!y) return <p className="uza-ipucu">{m.ortak.yukleniyor}</p>
  return (
    <section className="uza-kart" data-bolum="prematur-kohort">
      <h2 className="uza-h2">{b.kohortBaslik}</h2>
      {y.depo ? null : <Bilgi>{m.ortak.depoYok}</Bilgi>}
      {y.depo && !satirlar.length ? <p className="uza-ipucu" data-alan="kohort-bos">{b.kohortBos}</p> : null}
      <div style={{ display: 'grid', gap: 10 }}>
        {satirlar.map((k) => (
          <div key={k.satir.hastaId} data-hasta={k.satir.hastaId} style={{ border: '1px solid rgba(58,44,34,0.08)', borderRadius: 12, padding: '10px 14px', background: k.plan.ozet.gecikti ? '#FBF3F0' : '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <a className="uza-baglanti" href={aracYolu(PREMATUR_ARACLARI.bebek, k.satir.hastaId)} style={{ fontWeight: 700 }}>{k.satir.ad}</a>
              <span>{k.plan.ozet.gecikti ? <Rozet ton="kirmizi">{`${b.ozet.gecikti} ${k.plan.ozet.gecikti}`}</Rozet> : null}{k.plan.ozet.zamaniGeldi ? <> <Rozet ton="uyari">{`${b.ozet.zamaniGeldi} ${k.plan.ozet.zamaniGeldi}`}</Rozet></> : null}</span>
            </div>
            <div className="uza-ipucu">
              {yerine(b.kohortSatir.gestasyon, k.gestasyon)} {'·'} {yerine(b.kohortSatir.agirlik, k.dogumKiloGr ?? '—')} {'·'} {tarihYaz(k.satir.dogumTarihi)}
              {k.duzeltilmis ? <> {'·'} {yerine(b.kohortSatir.duzeltilmis, k.duzeltilmis)}</> : null}
            </div>
            <div className="uza-ipucu">{k.siradaki ? <>{yerine(b.kohortSatir.siradaki, bicimli(k.siradaki.baslik, u.dil), k.siradaki.hedef ? tarihYaz(k.siradaki.hedef) : '—')} <Rozet ton={TON[k.siradaki.durum]}>{b.durum[DURUM_ANAHTARI[k.siradaki.durum]]}</Rozet></> : b.kohortSatir.yok}</div>
          </div>
        ))}
      </div>
      <p className="uza-ipucu">{b.kohortNot}</p>
      <p className="uza-ipucu" data-karar>{b.karar}</p>
    </section>
  )
}

function Bebek({ u, hastaId, paket, m }: { u: Uygulama; hastaId: string; paket: PrematurPaketi; m: M }) {
  const [y, setY] = useState<BebekYuku | null>(null)
  const [hata, setHata] = useState<'yuk' | 'kayit' | null>(null)
  const [form, setForm] = useState<Form>({ hf: '', gun: '0', kilo: '', nicu: '' })
  const [yaziliyor, setYaziliyor] = useState(false)
  const [kopya, setKopya] = useState<'yok' | 'tamam' | 'hata'>('yok')
  const uygula = useCallback((j: BebekYuku) => { setY(j); setForm(formdan(j.profil)) }, [])
  useEffect(() => {
    let iptal = false
    setHata(null)
    u.api(`${PREMATUR_API}?hasta=${encodeURIComponent(hastaId)}`).then((r) => { if (!iptal) { if (r.ok) uygula(r.j as BebekYuku); else setHata('yuk') } }).catch(() => { if (!iptal) setHata('yuk') })
    return () => { iptal = true }
  }, [u, hastaId, uygula])

  const protokol = paket.protokol
  const plan = useMemo(() => (y && y.hasta.dogumTarihi ? profildenPlan({ dogumIso: y.hasta.dogumTarihi, profil: y.profil, durumlar: y.durumlar }, y.bugun, protokol) : null), [y, protokol])
  const b = m.bebek, o = m.ortak
  if (hata === 'yuk') return <Hata>{o.yuklenemedi}</Hata>
  if (!y) return <p className="uza-ipucu">{o.yukleniyor}</p>
  if (!y.hasta.dogumTarihi) return <section className="uza-kart"><Bilgi>{b.dogumTarihiYok}</Bilgi></section>

  const yaz = async (yontem: 'PUT' | 'POST', govde: Record<string, unknown>) => {
    setYaziliyor(true); setHata(null)
    try {
      const r = await u.api(PREMATUR_API, { method: yontem, govde: { hastaId, ...govde } })
      if (r.ok) uygula(r.j as BebekYuku); else setHata('kayit')
    } catch { setHata('kayit') } finally { setYaziliyor(false) }
  }
  const profilKaydet = () => {
    const profil: Record<string, unknown> = { gestasyonHafta: form.hf, gestasyonGunKalan: form.gun, dogumKiloGr: form.kilo, nicuGun: form.nicu }
    for (const k of [...BOOL_ALANLARI, ...ANNE_ALANLARI]) profil[k] = form[k] ?? null
    void yaz('PUT', { profil })
  }
  const isaretle = (oge: TakipOgesi, durum: HekimDurumu | null) => void yaz('POST', { ogeId: oge.id, durum, tarih: durum === 'yapildi' ? y.bugun : null })

  const { gestasyonGun, dogumKiloGr } = planGirdisiProfilden(y.profil)
  const yas = plan ? yasSatirlari(plan, y.bugun, b) : null
  const gorunur = plan ? plan.ogeler.filter((x) => x.kriter.durum === 'karsilandi' || x.durum === 'veri-eksik') : []
  const yerel = plan ? plan.ogeler.filter((x) => x.durum === 'yerel' || (x.kriter.durum === 'yerel')) : []
  const disi = plan ? plan.ogeler.filter((x) => !gorunur.includes(x) && !yerel.includes(x)) : []
  const gestMetni = gestasyonGun == null ? '—' : gestasyonMetni(gestasyonGun)
  const kapsamNedeni = plan && !plan.kapsamda ? ({ bilinmiyor: b.kapsamNedeni.bilinmiyor, degil: b.kapsamNedeni.degil, 'ust-ay': b.kapsamNedeni.ustAy, 'tarih-gecersiz': b.kapsamNedeni.tarihGecersiz } as Record<string, string>)[plan.kapsamNedeni] : null

  return (
    <>
      {y.depo ? null : <Bilgi>{o.depoYok}</Bilgi>}
      <section className="uza-kart" data-bolum="prematur-bebek">
        <h2 className="uza-h2">{b.bebek}{y.hasta.ad ? ` · ${y.hasta.ad}` : ''}</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Istatistik deger={gestasyonGun == null ? '—' : `${gestMetni} ${o.hafta}`} etiket={b.gestasyonDogumda} />
          <Istatistik deger={dogumKiloGr ? `${dogumKiloGr} ${o.gram}` : '—'} etiket={b.dogumAgirligi} />
          <Istatistik deger={yas?.kronolojik ?? '—'} etiket={b.kronolojikYas} />
          {yas?.duzeltilmis ? <Istatistik ton="uyari" deger={yas.duzeltilmis} etiket={b.duzeltilmisYas} /> : null}
          {yas?.postmenstruel ? <Istatistik deger={yas.postmenstruel} etiket={b.postmenstruel} /> : null}
        </div>
        {plan?.yas.terimTarihiIso ? <p className="uza-ipucu">{yerine(b.terimTarihi, tarihYaz(plan.yas.terimTarihiIso))} {b.duzeltmeNotu}</p> : null}
        {kapsamNedeni ? <Bilgi>{kapsamNedeni}</Bilgi> : null}
        {plan && plan.eksikVeri.length ? <Bilgi>{yerine(b.eksikVeri, plan.eksikVeri.map((k) => b.eksikAlan[k]).join(', '))}</Bilgi> : null}
      </section>

      <section className="uza-kart" data-bolum="prematur-oyku">
        <Katlanir baslik={b.oykuBaslik} acik={!plan || !plan.kapsamda || plan.eksikVeri.length > 0}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <label style={{ display: 'grid', gap: 4 }}><span className="uza-etiket">{b.gestasyonHafta}</span><input className="uza-girdi" data-alan="gestasyon-hafta" inputMode="numeric" value={form.hf} onChange={(e) => setForm({ ...form, hf: e.target.value })} /></label>
            <label style={{ display: 'grid', gap: 4 }}><span className="uza-etiket">{b.gestasyonGun}</span>
              <select className="uza-girdi" data-alan="gestasyon-gun" value={form.gun} onChange={(e) => setForm({ ...form, gun: e.target.value })}>{[0, 1, 2, 3, 4, 5, 6].map((d) => <option key={d} value={String(d)}>{d}</option>)}</select></label>
            <label style={{ display: 'grid', gap: 4 }}><span className="uza-etiket">{b.kilo}</span><input className="uza-girdi" data-alan="dogum-kilo" inputMode="numeric" value={form.kilo} onChange={(e) => setForm({ ...form, kilo: e.target.value })} /></label>
            <label style={{ display: 'grid', gap: 4 }}><span className="uza-etiket">{b.nicuGun}</span><input className="uza-girdi" data-alan="nicu-gun" inputMode="numeric" value={form.nicu} onChange={(e) => setForm({ ...form, nicu: e.target.value })} /></label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginTop: 14 }}>
            {[...BOOL_ALANLARI, ...ANNE_ALANLARI].map((k) => <UcDurum key={k} ad={`oyku-${k}`} etiket={b.alanlar[k]} deger={form[k]} degistir={(d) => setForm({ ...form, [k]: d })} o={o} />)}
          </div>
          <p className="uza-ipucu">{b.anneNot}</p>
          <p className="uza-ipucu">{b.oykuNot}</p>
          <div className="uza-eylemler"><button type="button" className="uza-dugme" data-eylem="oyku-kaydet" disabled={yaziliyor || !y.depo} onClick={profilKaydet}>{yaziliyor ? o.kaydediliyor : b.oykuKaydet}</button></div>
        </Katlanir>
      </section>

      {hata === 'kayit' ? <Hata>{o.kaydedilemedi}</Hata> : null}

      {plan && plan.kapsamda ? (
        <section className="uza-kart" data-bolum="prematur-plan" aria-live="polite">
          <h2 className="uza-h2">{b.planBaslik} <span className="uza-ipucu" style={{ fontWeight: 500 }}>{yerine(o.protokolSatiri, bicimli(protokol.ad, u.dil), protokol.surum)}</span></h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <Istatistik ton={plan.ozet.gecikti ? 'kirmizi' : 'notr'} deger={plan.ozet.gecikti} etiket={b.ozet.gecikti} />
            <Istatistik ton={plan.ozet.zamaniGeldi ? 'uyari' : 'notr'} deger={plan.ozet.zamaniGeldi} etiket={b.ozet.zamaniGeldi} />
            <Istatistik deger={plan.ozet.yaklasiyor} etiket={b.ozet.yaklasiyor} />
            <Istatistik ton="iyi" deger={plan.ozet.yapildi} etiket={b.ozet.yapildi} />
            <Istatistik ton={plan.ozet.veriEksik ? 'uyari' : 'notr'} deger={plan.ozet.veriEksik} etiket={b.ozet.veriEksik} />
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {[...gorunur, ...yerel].map((x) => <Oge key={x.id} x={x} u={u} m={m} isaretle={isaretle} kayit={y.depo && !yaziliyor} />)}
            {!gorunur.length && !yerel.length ? <p className="uza-ipucu">{b.kriterDisiYok}</p> : null}
          </div>
          {yerel.length ? <p className="uza-ipucu" data-alan="yerel-not">{b.yerelNot}</p> : null}
          {disi.length ? (
            <Katlanir baslik={b.kriterDisiBaslik} rozet={String(disi.length)}>
              <div style={{ display: 'grid', gap: 6 }}>{disi.map((x) => <div key={x.id} className="uza-ipucu"><b>{bicimli(x.baslik, u.dil)}</b> {'—'} {bicimli(x.etiket, u.dil)}: {x.kriter.gerekce.length ? x.kriter.gerekce.map((g) => g.map((c) => bicimli(c, u.dil)).join(' + ')).join(' · ') : b.kriterBelirsiz}</div>)}</div>
            </Katlanir>
          ) : null}
          <div className="uza-eylemler">
            <button type="button" className="uza-dugme uza-dugme-cizgi" data-eylem="plani-kopyala" onClick={() => void panoyaKopyala(planMetni(plan, { protokol, dil: u.dil, bugun: y.bugun, gestasyon: gestMetni, dogumKiloGr, tarih: tarihYaz }, m)).then((t) => setKopya(t ? 'tamam' : 'hata'))}>{b.planiKopyala}</button>
            {kopya === 'tamam' ? <span className="uza-ipucu" role="status">{o.kopyalandi}</span> : kopya === 'hata' ? <span className="uza-ipucu" role="alert">{o.kopyalanamadi}</span> : null}
          </div>
        </section>
      ) : null}
      <p className="uza-ipucu" data-karar>{b.karar} {yerine(b.kapsam, bicimli(protokol.kapsam.kaynak, u.dil))}</p>
    </>
  )
}

function Oge({ x, u, m, isaretle, kayit }: { x: TakipOgesi; u: Uygulama; m: M; isaretle: (x: TakipOgesi, d: HekimDurumu | null) => void; kayit: boolean }) {
  const b = m.bebek
  const dil = u.dil
  return (
    <div data-oge={x.id} data-durum={x.durum} style={{ border: '1px solid rgba(58,44,34,0.08)', borderRadius: 12, padding: '12px 14px', background: x.durum === 'gecikti' ? '#FBF3F0' : '#fff' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{bicimli(x.baslik, dil)} <span className="uza-ipucu" style={{ fontWeight: 500 }}>{'·'} {b.kategori[x.kategori]}</span></div>
        <Rozet ton={TON[x.durum]}>{x.durum === 'yerel' ? b.yerelBaslik : b.durum[DURUM_ANAHTARI[x.durum]]}</Rozet>
      </div>
      <div style={{ fontSize: 14, marginTop: 4 }}>{bicimli(x.etiket, dil)}</div>
      {x.bas || x.son ? <div className="uza-ipucu">{x.bas && x.son && x.bas !== x.son ? `${tarihYaz(x.bas)} – ${tarihYaz(x.son)}` : tarihYaz((x.son || x.bas) as string)}{x.hekim?.tarih ? ` · ${yerine(b.yapildiGun, tarihYaz(x.hekim.tarih))}` : ''}</div> : null}
      {x.kriter.durum === 'karsilandi' && x.kriter.gerekce.length ? <div className="uza-ipucu">{yerine(b.kriter, x.kriter.gerekce.map((g) => g.map((c) => bicimli(c, dil)).join(' + ')).join(' · '))}</div> : null}
      {x.kriter.durum === 'belirsiz' ? <div className="uza-ipucu">{yerine(b.kriter, `${b.kriterBelirsiz}: ${x.kriter.gerekce.map((g) => g.map((c) => bicimli(c, dil)).join(' + ')).join(' · ')}`)}</div> : null}
      {x.varsayim?.length ? <div className="uza-ipucu">{yerine(b.varsayim, x.varsayim.map((c) => bicimli(c, dil)).join(', '))}</div> : null}
      {x.durum === 'yerel' ? <div className="uza-ipucu" data-alan="yerel-kutu">{b.yerelKutu}</div> : null}
      {x.hekimNotu ? <div className="uza-ipucu" style={{ background: '#FBF0DC', borderRadius: 8, padding: '6px 10px', marginTop: 6 }}>{bicimli(x.hekimNotu, dil)}</div> : null}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {(x.durum === 'yerel' ? (['yapildi', 'uygulanmaz'] as const) : (['plana_alindi', 'yapildi', 'uygulanmaz'] as const)).map((d) => (
          <button key={d} type="button" className="uza-dugme uza-dugme-cizgi" data-isaret={d} aria-pressed={x.hekim?.durum === d} disabled={!kayit} onClick={() => isaretle(x, x.hekim?.durum === d ? null : d)} style={{ background: x.hekim?.durum === d ? '#E4F3EA' : 'transparent', minHeight: 36 }}>{d === 'plana_alindi' ? b.planaAl : d === 'yapildi' ? b.yapildi : b.uygulanmaz}</button>
        ))}
      </div>
      {x.kaynaklar.length ? <Katlanir baslik={m.ortak.kaynak}><KaynakListesi kaynaklar={x.kaynaklar} o={m.ortak} dil={dil} /></Katlanir> : null}
    </div>
  )
}
