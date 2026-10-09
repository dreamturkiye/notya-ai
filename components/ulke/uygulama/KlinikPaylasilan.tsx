'use client'

/**
 * NOTYA-ULKE-KLINIK-01 — /clinic?gorunum=paylasilan: WHAT WAS SHARED WITH THE ACCOUNT, and WHAT IT COVERS.
 *
 * A share (an allied professional): one named patient of a doctor — the patient's approved notes.
 * Cover (another doctor): for its stated period, the covered doctor's patients found by name, their approved notes,
 * and that doctor's appointments.
 *
 * READ-ONLY. There is no field to type into and no button that changes anything of a patient: the server has no
 * route that would accept it. What is shown of a visit is the APPROVED note — its four sections and the fields of
 * its template; the server sends no draft, no transcript and nothing by which to reach the patient.
 * Every opening of a patient here is written to the owning doctor's record.
 *
 * Every sentence is the pack's (klinikMetni; section and field names from the note templates), in the account's form.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { Hata, tarihYaz, type Uygulama } from './Kabuk'
import { tamAd } from './Hastalar'
import { DurumRozeti, gunBasligi, saatAraligi, type RandevuDurumu } from './randevuOrtak'
import { alanAdi, alanTanimi, bolumAdi, klinikMetni, NOT_BOLUMLERI, randevuMetni, type KlinikMetni, type NotBolumu, type RandevuMetni, type UygulamaMetni } from '@/lib/ulke/arayuz'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import { gunEkle } from '@/lib/ulke/uygulama/zaman'
import { ozellikAcik } from '@/lib/ulke/ulke'
import type { DilKodu } from '@/lib/ulke/tipler'
import type { PaylasilanHasta, PaylasilanNot, PaylasilanSatir, VekaletRandevusu } from '@/lib/ulke/klinikHesabi/paylasim'

const API = '/api/ulke/klinik/paylasilan'
export type PaylasilanGirdi = PaylasilanSatir & { /** A shared patient's name, once it was read (and recorded). */ hasta?: PaylasilanHasta | null }
export type NotVerisi = { hasta: PaylasilanHasta; notlar: PaylasilanNot[] }

export function PaylasilanListeGorunumu({ k, girdiler, ac }: { k: KlinikMetni; girdiler: PaylasilanGirdi[] | null; ac: (g: PaylasilanGirdi) => void }) {
  const p = k.paylasilan
  return (
    <section className="uza-kart" data-alan="paylasilanlar">
      <h1 className="uza-h1">{p.baslik}</h1>
      <p className="uza-aciklama">{p.aciklama}</p>
      {girdiler === null ? null : girdiler.length === 0 ? <p className="uza-bos">{p.bos}</p> : (
        <ul className="uza-liste">
          {girdiler.map((g) => (
            <li key={g.yetkiId} data-paylasilan={g.tur} data-hekim={g.hekimId}>
              <div className="uza-satir">
                <span className="uza-liste-ad">
                  {g.tur === 'paylasim' ? (g.hasta ? tamAd(g.hasta) : k.yetkiTuru.paylasim) : k.yetkiTuru.vekalet}
                  <span className="uza-liste-alt">{[yerine(p.hekim, g.hekimAdi), g.bitis ? yerine(p.bitis, tarihYaz(new Date(new Date(g.bitis).getTime() - 1000).toISOString())) : ''].filter(Boolean).join(' · ')}</span>
                </span>
                <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => ac(g)} data-eylem="paylasilani-ac">{p.ac}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** The approved notes of one patient, read-only: the four sections under the template's own headings, then its fields. */
export function PaylasilanNotlarGorunumu({ k, m, dil, veri }: { k: KlinikMetni; m: UygulamaMetni; dil: DilKodu; veri: NotVerisi }) {
  const p = k.paylasilan
  const baslik = (sablon: string, b: NotBolumu) => bolumAdi(sablon, b, dil) ?? m.not[b]
  return (
    <section className="uza-kart" data-alan="paylasilan-notlar" data-hasta={veri.hasta.id}>
      <h2 className="uza-h1">{tamAd(veri.hasta)}</h2>
      {veri.hasta.dogumTarihi ? <p className="uza-aciklama">{yerine(p.dogum, tarihYaz(veri.hasta.dogumTarihi))}</p> : null}
      <div className="uza-bilgi-kutu" role="note" data-alan="salt-okunur">{p.saltOkunur}</div>
      <h3 className="uza-h2" style={{ marginTop: 16 }}>{p.notlar}</h3>
      {veri.notlar.length === 0 ? <p className="uza-bos">{p.notYok}</p> : veri.notlar.map((n) => (
        <article key={n.notId} data-not={n.notId} style={{ marginTop: 14 }}>
          <p className="uza-ust-yazi">{yerine(p.notTarihi, tarihYaz(n.muayeneTarihi), tarihYaz(n.onayTarihi))}</p>
          {NOT_BOLUMLERI.map((b) => (
            <div className="uza-not-bolum" key={b}>
              <h4 className="uza-alt-baslik">{baslik(n.sablon, b)}</h4>
              <p className="uza-not-metin" data-bolum={b}>{n.icerik[b]}</p>
              {n.alanAnahtarlari.filter((a) => alanTanimi(a)?.bolum === b && (n.icerik.alanlar?.[a] ?? '').trim()).map((a) => (
                <div className="uza-alt-alan" key={a} data-alan-anahtar={a}>
                  <h5 className="uza-alt-baslik">{alanAdi(a, dil)}</h5>
                  <p className="uza-not-metin">{n.icerik.alanlar?.[a]}</p>
                </div>
              ))}
            </div>
          ))}
        </article>
      ))}
    </section>
  )
}

export type VekaletDurumu = { q: string; hastalar: PaylasilanHasta[] | null; aramaKisa: boolean; gun: string; bugun: string; randevular: VekaletRandevusu[] | null }

/** Cover: find a patient of the covered doctor, and that doctor's appointments of a day. Nothing here can be changed. */
export function VekaletGorunumu({ k, r, hekimAdi, d, setQ, ara, hastaAc, git }: {
  k: KlinikMetni; r: RandevuMetni | null; hekimAdi: string; d: VekaletDurumu
  setQ: (x: string) => void; ara: () => void; hastaAc: (hastaId: string) => void; git: (gun: string) => void
}) {
  const p = k.paylasilan
  return (
    <>
      <section className="uza-kart" data-alan="vekalet-hasta-arama">
        <h2 className="uza-h2">{k.yetkiTuru.vekalet} · {hekimAdi}</h2>
        <div className="uza-bilgi-kutu" role="note" data-alan="salt-okunur">{p.saltOkunur}</div>
        <form className="uza-form" role="search" onSubmit={(e) => { e.preventDefault(); ara() }}>
          <div className="uza-alan">
            <label className="uza-etiket" htmlFor="uza-vk-q">{p.hastaAra}</label>
            <div className="uza-arama-satir">
              <input id="uza-vk-q" type="search" className="uza-girdi" value={d.q} onChange={(e) => setQ(e.target.value)} autoComplete="off" data-alan="vekalet-arama" />
              <button type="submit" className="uza-dugme uza-dugme-cizgi" data-eylem="vekalet-ara">{p.ara}</button>
            </div>
          </div>
        </form>
        <Hata>{d.aramaKisa ? p.aramaKisa : null}</Hata>
        {d.hastalar === null ? null : d.hastalar.length === 0 ? <p className="uza-bos">{p.sonucYok}</p> : (
          <ul className="uza-liste">
            {d.hastalar.map((h) => (
              <li key={h.id}><div className="uza-satir"><span className="uza-liste-ad">{tamAd(h)}<span className="uza-liste-alt">{tarihYaz(h.dogumTarihi)}</span></span><button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => hastaAc(h.id)} data-eylem="vekalet-hasta-ac">{p.ac}</button></div></li>
            ))}
          </ul>
        )}
      </section>
      {r && d.gun ? (
        <section className="uza-kart" data-alan="vekalet-randevular">
          <h2 className="uza-h2">{p.randevular}</h2>
          <div className="uza-takvim-ust">
            <strong>{gunBasligi(r, d.gun)}</strong>
            <div className="uza-takvim-gezinme">
              <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => git(gunEkle(d.gun, -1))}>{r.takvim.onceki}</button>
              <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => git(d.bugun || d.gun)}>{r.takvim.bugun}</button>
              <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => git(gunEkle(d.gun, 1))}>{r.takvim.sonraki}</button>
            </div>
          </div>
          {d.randevular === null ? null : d.randevular.length === 0 ? <p className="uza-bos">{p.randevuYok}</p> : (
            <ul className="uza-liste">
              {d.randevular.map((x) => (
                <li key={x.id} data-randevu={x.id}><div className="uza-satir"><span className="uza-saat">{saatAraligi(x.saat, x.sureDk)}</span><span className="uza-liste-ad">{x.hastaAdi}{x.neden ? <span className="uza-liste-alt">{x.neden}</span> : null}</span><DurumRozeti r={r} durum={x.durum as RandevuDurumu} /></div></li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </>
  )
}

export function KlinikPaylasilan({ u }: { u: Uygulama }) {
  const k = klinikMetni(u.dil)
  const p = k.paylasilan
  const { api, hesap } = u
  const [girdiler, setGirdiler] = useState<PaylasilanGirdi[] | null>(null)
  const [secili, setSecili] = useState<PaylasilanGirdi | null>(null)
  const [notlar, setNotlar] = useState<NotVerisi | null>(null)
  const [d, setD] = useState<VekaletDurumu>({ q: '', hastalar: null, aramaKisa: false, gun: '', bugun: '', randevular: null })
  const [hata, setHata] = useState(false)
  const randevuVar = ozellikAcik('randevu')

  const yukle = useCallback(async () => {
    const r = await api(API)
    if (!r.ok) { setHata(true); return }
    const liste = (Array.isArray(r.j.paylasilanlar) ? r.j.paylasilanlar : []) as PaylasilanGirdi[]
    // The name of a shared patient is read through the share itself (and so written to the doctor's record).
    const adli = await Promise.all(liste.map(async (g) => {
      if (g.tur !== 'paylasim' || !g.hastaId) return g
      try { const h = await api(`${API}?hekim=${g.hekimId}&hasta=${g.hastaId}&kart=1`); return { ...g, hasta: h.ok ? (h.j.hasta as PaylasilanHasta) : null } } catch { return g }
    }))
    setGirdiler(adli)
  }, [api])
  useEffect(() => { if (hesap) yukle().catch(() => setHata(true)) }, [hesap, yukle])

  const notlariAc = useCallback(async (hekimId: string, hastaId: string) => {
    setHata(false)
    try {
      const r = await api(`${API}?hekim=${hekimId}&hasta=${hastaId}`)
      if (r.ok && r.j.hasta) setNotlar({ hasta: r.j.hasta as PaylasilanHasta, notlar: (Array.isArray(r.j.notlar) ? r.j.notlar : []) as PaylasilanNot[] }); else { setNotlar(null); setHata(true) }
    } catch { setHata(true) }
  }, [api])
  const randevulariYukle = useCallback(async (hekimId: string, gun: string) => {
    try {
      const r = await api(`${API}?hekim=${hekimId}${gun ? `&gun=${encodeURIComponent(gun)}` : ''}`)
      if (r.ok) setD((e) => ({ ...e, gun: String(r.j.gunler?.[0] ?? gun), bugun: String(r.j.bugun ?? ''), randevular: (Array.isArray(r.j.randevular) ? r.j.randevular : []) as VekaletRandevusu[] }))
    } catch { /* the list stays as it was */ }
  }, [api])

  function ac(g: PaylasilanGirdi) {
    setSecili(g); setNotlar(null)
    if (g.tur === 'paylasim' && g.hastaId) void notlariAc(g.hekimId, g.hastaId)
    else { setD({ q: '', hastalar: null, aramaKisa: false, gun: '', bugun: '', randevular: null }); if (randevuVar) void randevulariYukle(g.hekimId, '') }
  }
  async function ara() {
    if (!secili) return
    try {
      const r = await api(`${API}?hekim=${secili.hekimId}&q=${encodeURIComponent(d.q)}`)
      if (r.ok) setD((e) => ({ ...e, aramaKisa: false, hastalar: (Array.isArray(r.j.hastalar) ? r.j.hastalar : []) as PaylasilanHasta[] }))
      else if (r.j.code === 'ARAMA_KISA') setD((e) => ({ ...e, aramaKisa: true }))
      else setHata(true)
    } catch { setHata(true) }
  }

  return (
    <>
      <PaylasilanListeGorunumu k={k} girdiler={girdiler} ac={ac} />
      <Hata>{hata ? p.okunamadi : null}</Hata>
      {secili?.tur === 'vekalet' ? (
        <VekaletGorunumu k={k} r={randevuVar ? randevuMetni(u.dil) : null} hekimAdi={secili.hekimAdi} d={d} setQ={(q) => setD((e) => ({ ...e, q }))} ara={() => { void ara() }}
          hastaAc={(hastaId) => { void notlariAc(secili.hekimId, hastaId) }} git={(gun) => { void randevulariYukle(secili.hekimId, gun) }} />
      ) : null}
      {notlar ? <PaylasilanNotlarGorunumu k={k} m={u.m} dil={u.dil} veri={notlar} /> : null}
    </>
  )
}
