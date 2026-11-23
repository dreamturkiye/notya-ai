'use client'
/**
 * ESNEK-MUAYENE-B6 — "Notya sizi böyle tanıyor": one visible card with everything Notya learned about the doctor — how he
 * works, his approval habit, abbreviations, style rules, suggestion preferences, autonomy steps, shadow mode, time meter.
 * Every line is correctable or reversible with one tap; no settings maze. Country-neutral (words + API injected).
 */
import { useCallback, useEffect, useState } from 'react'
import type { EsnekMetinleri } from '@/core/esnek/metinTr'
import type { OzerkAlan, Basamak } from '@/core/esnek/ozerklik'
import type { OneriTuru, ProfilDurumu, HekimKarari } from '@/core/esnek/oneriProfili'
import { saatMetni } from '@/core/esnek/metinAraclari'
import { EL_RENK as R } from '@/components/elNotu/renk'
import { dugme, type Getirici } from '@/components/elNotu/ElNotuYakala'
import GolgeSatiri, { type GolgeVeri } from './GolgeSatiri'
import ZamanSayaci from './ZamanSayaci'

type Sekil = 'kagit' | 'ses' | 'karma'
type Profil = {
  calisma: { sekil: Sekil | null; ogrenilen: Sekil | null; onay: { tur: 'gun_sonu' | 'anlik'; saatDk: number | null } | null; ogrenilenOnay: unknown }
  kisaltmalar: { id: string; kisaltma: string; anlam: string; kaynak: string }[]
  uslup: { anahtar: string; deger: string }[]
  oneri: { tur: OneriTuru; kabul: number; red: number; durum: ProfilDurumu; karar: HekimKarari }[]
  ozerklik: { alanlar: { alan: OzerkAlan; basamak: Basamak; seri: number; hekimTavani: Basamak; korumali: boolean }[]; b3Teklif: boolean; topluOnayIzni: boolean }
  golge: GolgeVeri
}

export default function TanimaKarti(p: { metin: EsnekMetinleri; getir: Getirici; api: string; golgeApi: string; elNotuApi: string }) {
  const M = p.metin, T = M.tanima
  const [v, setV] = useState<Profil | null>(null)
  const [duzenlenen, setDuzenlenen] = useState<{ id: string; anlam: string } | null>(null)
  const [saat, setSaat] = useState('')
  const [hata, setHata] = useState('')

  const { getir, api } = p
  const yukle = useCallback(async () => {
    const r = await getir(`${api}/profil`).catch(() => null)
    if (r?.ok) setV(await r.json())
  }, [getir, api])
  useEffect(() => { void yukle() }, [yukle])

  async function islem(govde: Record<string, unknown>) {
    setHata('')
    const r = await p.getir(`${p.api}/profil`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(govde) }).catch(() => null)
    if (r?.ok) setV(await r.json()); else setHata(M.hata)
  }
  async function golge(islem: string) {
    const r = await p.getir(p.golgeApi, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ islem }) }).catch(() => null)
    if (r?.ok) await yukle(); else setHata(M.hata)
  }

  if (!v) return null
  const bolum: React.CSSProperties = { display: 'grid', gap: 6, paddingTop: 12, borderTop: `1px solid ${R.cizgi}` }
  const baslik: React.CSSProperties = { fontSize: 14, fontWeight: 650 }
  const satir: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 14 }
  const bos = (m: string) => <div style={{ fontSize: 13, color: R.soluk }}>{m}</div>
  const onay = v.calisma.onay

  return (
    <section style={{ background: R.kagit, border: `1px solid ${R.cizgi}`, borderRadius: 16, padding: 18, display: 'grid', gap: 12, color: R.murekkep }} aria-label={T.baslik}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 650 }}>{T.baslik}</div>
        <div style={{ fontSize: 13, color: R.soluk, marginTop: 2 }}>{T.alt}</div>
      </div>
      {hata && <div role="alert" style={{ color: R.uyari, fontSize: 13 }}>{hata}</div>}

      <div style={bolum}>
        <div style={baslik}>{T.calisma}</div>
        <div style={satir}><span style={{ flex: 1 }}>{v.calisma.sekil ? T.sekil[v.calisma.sekil] : T.sekilYok}</span></div>
        <div style={satir}>
          {(['kagit', 'ses', 'karma'] as const).map((s) => <button key={s} type="button" style={dugme(v.calisma.sekil === s ? 'birincil' : 'kucuk')} aria-pressed={v.calisma.sekil === s} onClick={() => void islem({ islem: 'calisma', sekil: s })}>{T.sekil[s]}</button>)}
        </div>
      </div>

      <div style={bolum}>
        <div style={baslik}>{T.onay}</div>
        <div style={satir}><span style={{ flex: 1 }}>{onay ? (onay.tur === 'gun_sonu' && onay.saatDk !== null ? T.onayGunSonu(saatMetni(onay.saatDk)) : T.onayAnlik) : T.onayYok}</span></div>
        <div style={satir}>
          <button type="button" style={dugme(onay?.tur === 'anlik' ? 'birincil' : 'kucuk')} onClick={() => void islem({ islem: 'onay', tur: 'anlik' })}>{T.onayAnlik}</button>
          <input type="time" value={saat || (onay?.saatDk != null ? saatMetni(onay.saatDk) : '')} onChange={(e) => setSaat(e.target.value)} aria-label={T.onay} style={{ borderRadius: 8, border: `1px solid ${R.cizgi}`, padding: '4px 8px' }} />
          <button type="button" style={dugme('kucuk')} onClick={() => { const [h, m] = (saat || '18:00').split(':').map(Number); void islem({ islem: 'onay', tur: 'gun_sonu', saatDk: h * 60 + m }) }}>{T.kaydet}</button>
        </div>
      </div>

      <div style={bolum}>
        <div style={baslik}>{T.kisaltmalar}</div>
        {!v.kisaltmalar.length && bos(T.kisaltmaYok)}
        {v.kisaltmalar.map((k) => (
          <div key={k.id} style={satir}>
            <b style={{ minWidth: 56 }}>{k.kisaltma}</b>
            {duzenlenen?.id === k.id ? (
              <>
                <input value={duzenlenen.anlam} onChange={(e) => setDuzenlenen({ id: k.id, anlam: e.target.value })} aria-label={k.kisaltma} style={{ flex: 1, minWidth: 140, borderRadius: 8, border: `1px solid ${R.cizgi}`, padding: '4px 8px' }} />
                <button type="button" style={dugme('kucuk')} onClick={() => { void islem({ islem: 'sozluk_duzelt', id: k.id, anlam: duzenlenen.anlam }); setDuzenlenen(null) }}>{T.kaydet}</button>
                <button type="button" style={dugme('kucuk')} onClick={() => setDuzenlenen(null)}>{T.vazgec}</button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, minWidth: 0 }}>{k.anlam}</span>
                <button type="button" style={dugme('kucuk')} onClick={() => setDuzenlenen({ id: k.id, anlam: k.anlam })}>{T.duzelt}</button>
                <button type="button" style={dugme('kucuk')} onClick={() => void islem({ islem: 'sozluk_sil', id: k.id })}>{T.unut}</button>
              </>
            )}
          </div>
        ))}
      </div>

      <div style={bolum}>
        <div style={baslik}>{T.uslup}</div>
        {!v.uslup.length && bos(T.uslupYok)}
        {v.uslup.map((k) => (
          <div key={k.anahtar} style={satir}><span style={{ flex: 1, minWidth: 0 }}>{k.deger}</span><button type="button" style={dugme('kucuk')} onClick={() => void islem({ islem: 'uslup_unut', anahtar: k.anahtar })}>{T.unut}</button></div>
        ))}
      </div>

      <div style={bolum}>
        <div style={baslik}>{T.oneriler}</div>
        {!v.oneri.length && bos(T.oneriYok)}
        {v.oneri.map((o) => (
          <div key={o.tur} style={satir}>
            <span style={{ flex: 1, minWidth: 0 }}>{M.oneri.tur[o.tur]} · <span style={{ color: R.soluk }}>{M.oneri.durum[o.durum]}</span></span>
            {o.tur !== 'guvenlik' && (o.durum === 'sessiz'
              ? <button type="button" style={dugme('kucuk')} onClick={() => void islem({ islem: 'oneri', tur: o.tur, karar: 'goster' })}>{M.oneri.gosterYeniden}</button>
              : <button type="button" style={dugme('kucuk')} onClick={() => void islem({ islem: 'oneri', tur: o.tur, karar: 'sessiz' })}>{M.oneri.sessizeAl}</button>)}
          </div>
        ))}
      </div>

      <div style={bolum}>
        <div style={baslik}>{T.ozerklik}</div>
        <div style={{ fontSize: 12, color: R.soluk }}>{M.ozerklik.korumaliNot}</div>
        {v.ozerklik.alanlar.map((a) => (
          <div key={a.alan} style={satir}>
            <span style={{ flex: 1, minWidth: 0 }}>{M.ozerklik.alan[a.alan]}</span>
            <span title={M.ozerklik.basamakAlt[a.basamak]} style={{ fontSize: 12, fontWeight: 600, color: a.basamak >= 2 ? R.cam : R.soluk }}>{M.ozerklik.basamak[a.basamak]}</span>
            {a.basamak > 0 && <button type="button" style={dugme('kucuk')} onClick={() => void islem({ islem: 'ozerklik', alt: 'indir', alan: a.alan })}>{M.ozerklik.asagi}</button>}
          </div>
        ))}
        <div style={satir}>
          <button type="button" style={dugme(v.ozerklik.topluOnayIzni ? 'kucuk' : v.ozerklik.b3Teklif ? 'birincil' : 'kucuk')} onClick={() => void islem({ islem: 'ozerklik', alt: v.ozerklik.topluOnayIzni ? 'toplu_kapat' : 'toplu_ac' })}>
            {v.ozerklik.topluOnayIzni ? M.ozerklik.b3Kapat : M.ozerklik.b3Evet}
          </button>
          {v.ozerklik.b3Teklif && <span style={{ fontSize: 12, color: R.soluk }}>{M.ozerklik.b3Teklif}</span>}
        </div>
      </div>

      <div style={bolum}>
        <div style={baslik}>{T.golge}</div>
        <div style={{ fontSize: 12, color: R.soluk }}>{M.golge.aciklama}</div>
        <GolgeSatiri metin={M} getir={p.getir} api={p.golgeApi} veri={v.golge} degisti={() => void yukle()} />
        <div style={satir}>
          {v.golge.sekreterYazmasin
            ? null
            : v.golge.acik
              ? <button type="button" style={dugme('kucuk')} onClick={() => void golge('durdur')}>{M.golge.durdur}</button>
              : <button type="button" style={dugme('birincil')} onClick={() => void golge('baslat')}>{M.golge.baslat}</button>}
        </div>
      </div>

      <div style={bolum}>
        <div style={baslik}>{T.zaman}</div>
        <ZamanSayaci metin={M} getir={p.getir} api={p.elNotuApi} />
      </div>
    </section>
  )
}
