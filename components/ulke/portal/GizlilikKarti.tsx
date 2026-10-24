'use client'

/**
 * AU-BETA-01 — THE PATIENT'S PRIVACY CARD (pack extension `uzanti.gizlilik`): the collection notice, an explicit
 * consent action with its stored record, and the access/correction request. Every sentence is the pack's. Like the rest
 * of the patient's page this file imports nothing of the signed-in application.
 *
 * Initial compliance draft – external legal review later. Not a statement that any law is met.
 */
import React, { useCallback, useEffect, useState, type ReactNode } from 'react'
import { tarihYaz } from '@/lib/ulke/arayuz/bicim'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import { ulkePaketi } from '@/lib/ulke/ulke'
import type { GizlilikMetni } from '@/lib/ulke/uzanti/tipler'
import type { PortalIstegi } from './HastaFormu'

/** The collection notice (APP 1 / APP 5 matters), as sections. Shown in the intake form and on the privacy card. */
export function GizlilikBildirimi({ g, acik }: { g: GizlilikMetni; acik?: boolean }) {
  return (
    <details className="uza-bildirim" open={acik} data-alan="gizlilik-bildirimi" data-surum={g.surum}>
      <summary><strong>{g.bildirim.baslik}</strong></summary>
      {g.taslakEtiketi ? <p className="uza-ipucu" data-alan="taslak-etiketi">{g.taslakEtiketi}</p> : null}
      <p className="uza-not-metin">{g.bildirim.giris}</p>
      {g.bildirim.bolumler.map((b) => (
        <div key={b.baslik}>
          <h3 className="uza-h2" style={{ fontSize: 15 }}>{b.baslik}</h3>
          {b.paragraflar.map((p, i) => <p key={i} className="uza-not-metin">{p}</p>)}
        </div>
      ))}
    </details>
  )
}

/** The pack's non-blocking note, shown on consent and clinical screens. */
export function EkNot(): ReactNode {
  const n = ulkePaketi().uzanti?.ekNot
  return n ? <p className="uza-ipucu" role="note" data-alan="ek-not">{n}</p> : null
}

type Riza = { surum: string; verildiAt: string } | null
type Talep = { id: string; tur: 'erisim' | 'duzeltme'; durum: 'yeni' | 'islemde' | 'tamamlandi' | 'reddedildi'; sonTarih: string; yanit?: string }

export function PortalGizlilikKarti({ iste, oturumBitti }: { iste: PortalIstegi; oturumBitti: () => void }) {
  const g = ulkePaketi().uzanti?.gizlilik
  const [riza, setRiza] = useState<Riza>(null)
  const [talepler, setTalepler] = useState<Talep[]>([])
  const [yuklendi, setYuklendi] = useState(false)
  const [kabul, setKabul] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [bekliyor, setBekliyor] = useState(false)
  const [tur, setTur] = useState<'erisim' | 'duzeltme'>('erisim')
  const [ayrinti, setAyrinti] = useState('')
  const [talepBilgi, setTalepBilgi] = useState<string | null>(null)

  const yukle = useCallback(async () => {
    try {
      const r = await iste('/gizlilik')
      if (r.status === 401) { oturumBitti(); return }
      if (r.status === 200) { setRiza((r.j.riza as Riza) ?? null); setTalepler(Array.isArray(r.j.talepler) ? (r.j.talepler as Talep[]) : []) }
    } catch { /* the card shows the notice anyway */ }
    setYuklendi(true)
  }, [iste, oturumBitti])
  useEffect(() => { void yukle() }, [yukle])
  if (!g) return null

  async function rizaGonder() {
    if (!kabul) { setHata(g!.riza.gerekli); return }
    setBekliyor(true); setHata(null)
    try {
      const r = await iste('/gizlilik', { eylem: 'riza', kabul: true })
      if (r.status === 200) setRiza(r.j.riza as Riza); else if (r.status === 401) oturumBitti(); else setHata(g!.riza.hata)
    } catch { setHata(g!.riza.hata) }
    setBekliyor(false)
  }
  async function geriCek() {
    setBekliyor(true); setHata(null)
    try {
      const r = await iste('/gizlilik', { eylem: 'geri' })
      if (r.status === 200) { setRiza(null); setKabul(false) } else setHata(g!.riza.hata)
    } catch { setHata(g!.riza.hata) }
    setBekliyor(false)
  }
  async function talepGonder() {
    setBekliyor(true); setHata(null); setTalepBilgi(null)
    try {
      const r = await iste('/gizlilik', { eylem: 'talep', tur, ayrinti })
      if (r.status === 200) { setAyrinti(''); setTalepBilgi(g!.talep.gonderildi); await yukle() }
      else if (r.j.code === 'BEKLEYEN_VAR') setHata(g!.talep.bekleyenVar)
      else if (r.status === 401) oturumBitti()
      else setHata(g!.talep.hata)
    } catch { setHata(g!.talep.hata) }
    setBekliyor(false)
  }

  return (
    <section className="uza-kart" data-alan="portal-gizlilik">
      <h2 className="uza-h2">{g.riza.baslik}</h2>
      {g.taslakEtiketi ? <p className="uza-ipucu">{g.taslakEtiketi}</p> : null}
      <GizlilikBildirimi g={g} />
      <p className="uza-not-metin" data-alan="riza-metni">{g.riza.metin}</p>
      {riza ? (
        <>
          <div role="status" className="uza-bilgi-kutu" data-alan="riza-kaydi">{g.riza.kaydedildi} {yerine(g.riza.kayitSatiri, tarihYaz(riza.verildiAt.slice(0, 10)), riza.surum)}</div>
          <div className="uza-eylemler"><button type="button" className="uza-dugme uza-dugme-cizgi" disabled={bekliyor} onClick={geriCek} data-eylem="riza-geri">{bekliyor ? g.riza.gonderiliyor : g.riza.geriCek}</button></div>
        </>
      ) : yuklendi ? (
        <div className="uza-form">
          <label className="uza-onay"><input type="checkbox" name="gizlilik-riza" checked={kabul} onChange={(e) => { setKabul(e.target.checked); setHata(null) }} /><span>{g.riza.kutu}</span></label>
          <div className="uza-eylemler" style={{ marginTop: 0 }}><button type="button" className="uza-dugme" disabled={bekliyor} onClick={rizaGonder} data-eylem="riza-gonder">{bekliyor ? g.riza.gonderiliyor : g.riza.gonder}</button></div>
        </div>
      ) : null}

      <h2 className="uza-h2" style={{ marginTop: 18 }}>{g.talep.baslik}</h2>
      <p className="uza-not-metin">{g.talep.aciklama}</p>
      <div className="uza-form">
        <div className="uza-alan">
          <label className="uza-etiket" htmlFor="uzp-talep-tur">{g.talep.baslik}</label>
          <select id="uzp-talep-tur" className="uza-girdi" value={tur} onChange={(e) => setTur(e.target.value as 'erisim' | 'duzeltme')}>
            <option value="erisim">{g.talep.erisim}</option>
            <option value="duzeltme">{g.talep.duzeltme}</option>
          </select>
        </div>
        <div className="uza-alan">
          <label className="uza-etiket" htmlFor="uzp-talep-ayrinti">{g.talep.ayrinti}</label>
          <textarea id="uzp-talep-ayrinti" className="uza-girdi" rows={3} maxLength={1000} value={ayrinti} onChange={(e) => setAyrinti(e.target.value)} />
          <p className="uza-ipucu">{g.talep.ayrintiIpucu}</p>
        </div>
        <div className="uza-eylemler" style={{ marginTop: 0 }}><button type="button" className="uza-dugme" disabled={bekliyor} onClick={talepGonder} data-eylem="talep-gonder">{bekliyor ? g.talep.gonderiliyor : g.talep.gonder}</button></div>
      </div>
      {hata ? <div role="alert" className="uza-uyari-kutu">{hata}</div> : null}
      {talepBilgi ? <div role="status" className="uza-bilgi-kutu">{talepBilgi}</div> : null}
      {talepler.length ? (
        <ul className="uza-liste" data-alan="talep-listesi">
          {talepler.map((t) => <li key={t.id}><div className="uza-satir"><span className="uza-liste-ad">{t.tur === 'erisim' ? g.talep.erisim : g.talep.duzeltme}<span className="uza-liste-alt">{g.talep.durumlar[t.durum]} · {yerine(g.talep.sonTarih, tarihYaz(t.sonTarih))}</span>{(t.durum === 'tamamlandi' || t.durum === 'reddedildi') && t.yanit ? <span className="uza-liste-alt" data-alan="talep-yanit"><strong>{g.talep.yanitBaslik}:</strong> {t.yanit}</span> : null}</span></div></li>)}
        </ul>
      ) : null}
    </section>
  )
}
