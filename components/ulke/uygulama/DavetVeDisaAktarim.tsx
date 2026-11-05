'use client'

/**
 * REFERANS-01 / HASTA-DISA-AKTAR-01 (Kaan, 2026-11-05) — two rows of Settings, the same as Türkiye's (Ayarlar › Hekim davet
 * programı, Ayarlar › Hasta kayıtlarını dışa aktar), in the country's words:
 *   Invite a colleague       the account's own code, its sign-up link with a QR code, and what has come of it
 *   Export a patient's record one of the doctor's own patients as FHIR R4 JSON, or as a printable page (saved as PDF)
 * NO WORD IS WRITTEN HERE: every string is the pack's (`ayarlar.davet`, `ayarlar.disaAktar`). A pack without them has no row.
 */
import React, { useEffect, useState } from 'react'
import { Bilgi, Hata, type Uygulama } from './Kabuk'
import { AyarSatiri } from './AyarSatiri'
import { panoyaKopyala } from './pano'
import QrKod from '@/components/belge/QrKod'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import { araclarMetni, arayuz } from '@/lib/ulke/arayuz'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { unvanliAd } from '@/lib/ulke/uygulama/hekimUnvani'
import { YazdirKagidi, yazdirSozleri } from './YazdirKagidi'
import type { UlkeDisaAktarim } from '@/lib/ulke/belge/sunucu'
import { ulkeYolu } from '@/lib/ulke/yol'
import { ulkeIstemciSupabase } from '@/lib/ulke/istemciSupabase'

type Davet = { kod: string; baglanti: string; davet?: number; odeyen?: number; verilen?: number }

export function DavetSatiri({ u }: { u: Uygulama }) {
  const m = u.m.ayarlar.davet
  const [d, setD] = useState<Davet | null>(null)
  const [hata, setHata] = useState(false)
  const [kopya, setKopya] = useState(false)
  useEffect(() => {
    if (!m) return
    let iptal = false
    void u.api('/api/ulke/referans').then((r) => { if (iptal) return; if (r.ok && typeof r.j.kod === 'string') setD(r.j as Davet); else setHata(true) })
    return () => { iptal = true }
  }, [m, u])
  if (!m) return null
  const adres = d ? `${typeof window === 'undefined' ? '' : window.location.origin}${d.baglanti}` : ''
  return (
    <AyarSatiri emoji={'\u{1F91D}'} ad={m.baslik} alt={m.aciklama} alan="davet">
      <Hata>{hata ? m.yuklenemedi : null}</Hata>
      {d ? (
        <div data-davet-kodu={d.kod}>
          <p><span className="uza-etiket">{m.kod}</span> <b style={{ fontSize: 18, letterSpacing: 1 }}>{d.kod}</b></p>
          <p className="uza-etiket">{m.baglanti}</p>
          <p style={{ wordBreak: 'break-all' }}>{adres}</p>
          <QrKod metin={adres} boyut={132} etiket={m.baglanti} />
          <div className="uza-eylemler"><button type="button" className="uza-dugme uza-dugme-kucuk" onClick={() => { void panoyaKopyala(adres).then(setKopya) }}>{m.kopyala}</button></div>
          <Bilgi>{kopya ? m.kopyalandi : null}</Bilgi>
          <p className="uza-ipucu">{yerine(yerine(yerine(m.sayac, String(d.davet ?? 0)), String(d.odeyen ?? 0)), String(d.verilen ?? 0))}</p>
          <p className="uza-ipucu">{m.kosul}</p>
        </div>
      ) : null}
    </AyarSatiri>
  )
}

type HastaSatiri = { id: string; ad: string; dogumTarihi: string }

/** The printable text of an export: the patient's line, every approved note section by section, every kept tool result's numbers. */
function ozetMetni(v: UlkeDisaAktarim, m: NonNullable<Uygulama['m']['ayarlar']['disaAktar']>, dil: string): string {
  const araclar = arayuz().araclar?.araclar ?? []
  const ad = (k: string) => araclar.find((p) => p.anahtar === k)?.metin.ad[dil] ?? Object.values(araclar.find((p) => p.anahtar === k)?.metin.ad ?? {})[0] ?? k
  const satirlar = [v.hasta.dogumTarihi ? yerine(m.dogumTarihi, v.hasta.dogumTarihi) : '', '', `${m.notlar} (${v.notlar.length})`]
  for (const n of v.notlar) satirlar.push('', `— ${n.tarih.slice(0, 10)}`, ...n.bolumler.map(([b, t]) => `${b.toUpperCase()}: ${t}`), ...(n.ek ? [n.ek] : []))
  satirlar.push('', `${m.araclar} (${v.araclar.length})`)
  for (const a of v.araclar) {
    const s = a.sonuc as { sayilar?: { anahtar: string; deger: number }[] } | null
    satirlar.push(`— ${a.tarih.slice(0, 10)} ${ad(a.arac)}${s?.sayilar?.length ? `: ${s.sayilar.map((x) => `${x.anahtar} ${x.deger}`).join(', ')}` : ''}`)
  }
  return satirlar.join('\n').trim()
}

export function DisaAktarimSatiri({ u }: { u: Uygulama }) {
  const m = u.m.ayarlar.disaAktar
  const [q, setQ] = useState('')
  const [hastalar, setHastalar] = useState<HastaSatiri[] | null>(null)
  const [secili, setSecili] = useState<HastaSatiri | null>(null)
  const [bekliyor, setBekliyor] = useState(false)
  const [hata, setHata] = useState(false)
  const [veri, setVeri] = useState<UlkeDisaAktarim | null>(null)
  if (!m || !u.hesap) return null
  const ara = async (e: React.FormEvent) => {
    e.preventDefault(); setHata(false); setVeri(null)
    const r = await u.api(`/api/ulke/hastalar?q=${encodeURIComponent(q.trim())}`)
    setHastalar(r.ok && Array.isArray(r.j.hastalar) ? (r.j.hastalar as HastaSatiri[]).slice(0, 20).map((h) => ({ id: h.id, ad: h.ad, dogumTarihi: h.dogumTarihi })) : [])
  }
  const indir = async () => {
    if (!secili) return
    setBekliyor(true); setHata(false)
    try {
      const { data } = (await ulkeIstemciSupabase()?.auth.getSession()) ?? { data: { session: null } }
      const r = await fetch(ulkeYolu(`/api/ulke/disa-aktar?hasta=${encodeURIComponent(secili.id)}&bicim=json`), { headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}` }, cache: 'no-store' })
      if (!r.ok) throw new Error()
      const ad = /filename="([^"]+)"/.exec(r.headers.get('Content-Disposition') || '')?.[1] || 'notya-patient.fhir.json'
      const a = document.createElement('a'); a.href = URL.createObjectURL(await r.blob()); a.download = ad; a.click(); URL.revokeObjectURL(a.href)
    } catch { setHata(true) } finally { setBekliyor(false) }
  }
  const hazirla = async () => {
    if (!secili) return
    setBekliyor(true); setHata(false)
    const r = await u.api(`/api/ulke/disa-aktar?hasta=${encodeURIComponent(secili.id)}&bicim=pdf`)
    if (r.ok && r.j.veri) setVeri(r.j.veri as UlkeDisaAktarim); else setHata(true)
    setBekliyor(false)
  }
  let sozler = null
  try { sozler = yazdirSozleri(araclarMetni(u.dil)) } catch { sozler = null }
  return (
    <AyarSatiri emoji={'\u{1F4E4}'} ad={m.baslik} alt={m.aciklama} alan="disa-aktar">
      <form onSubmit={(e) => { void ara(e) }} role="search">
        <label className="uza-etiket" htmlFor="uza-disa-aktar-ara">{m.ara}</label>
        <input id="uza-disa-aktar-ara" className="uza-girdi" value={q} onChange={(e) => setQ(e.target.value)} />
      </form>
      {hastalar && !hastalar.length ? <p className="uza-bos">{m.bulunamadi}</p> : null}
      {hastalar?.length ? (
        <ul className="uza-liste">
          {hastalar.map((h) => (
            <li key={h.id}><label><input type="radio" name="disa-aktar-hasta" checked={secili?.id === h.id} onChange={() => { setSecili(h); setVeri(null) }} /> {h.ad}{h.dogumTarihi ? ` · ${h.dogumTarihi}` : ''}</label></li>
          ))}
        </ul>
      ) : null}
      <div className="uza-eylemler">
        <button type="button" className="uza-dugme uza-dugme-kucuk" disabled={!secili || bekliyor} onClick={() => { void indir() }}>{bekliyor ? m.hazirlaniyor : m.json}</button>
        <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" disabled={!secili || bekliyor} onClick={() => { void hazirla() }}>{m.yazdir}</button>
      </div>
      <Hata>{hata ? m.hata : null}</Hata>
      {veri && sozler ? (
        <div className="uza-eylemler" data-disa-aktar="hazir">
          <YazdirKagidi baslik={m.baslik} ozet={ozetMetni(veri, m, u.dil)} s={sozler}
            antet={{ hekim: unvanliAd(u.hesap.ad, u.hesap.unvan, u.hesap.unvanEki, ulkePaketi().hekimUnvani, u.dil), hasta: veri.hasta.ad, tarih: veri.olusturuldu.slice(0, 10) }}
            belge={{ onEk: 'disa', hastaId: veri.hasta.id, api: u.api, tur: 'hasta_disa_aktarim' }} />
        </div>
      ) : null}
    </AyarSatiri>
  )
}
