'use client'
/**
 * ESNEK-MUAYENE-B6 — the home screen adapts to how the doctor works (one request, no polling):
 *   - paper doctor → "El notu ekle" first (and the page drops its microphone / assistant push — `onKarar`);
 *   - end-of-day approver → ONE notification at his usual time (once a day, on this device), nothing during the day;
 *   - shadow mode → the one daily line + the offer;
 *   - "Bu hafta öğrendiklerim" (max 3), each one-tap reversible, plus the handwriting learned this week (ESNEK-GELISIM:
 *     "Yazınızdan 14 yeni kelime öğrendim"); the B3 offer when every field earned it.
 * Country-neutral: words, API and routes injected.
 */
import { useEffect, useState } from 'react'
import type { EsnekMetinleri } from '@/core/esnek/metinTr'
import { adayCumlesi, type Oneri } from '@/core/esnek/aday'
import type { AnaSayfaKarari } from '@/core/esnek/tanima'
import { EL_RENK as R } from '@/components/elNotu/renk'
import { dugme, type Getirici } from '@/components/elNotu/ElNotuYakala'
import GolgeSatiri, { type GolgeVeri } from './GolgeSatiri'

type Ana = { karar: AnaSayfaKarari; golge: GolgeVeri | null; haftalik: { id: string; tur: string; oneri: Oneri }[]; elYazisi?: { kelime: number; kisaltma: number }; b3Teklif: boolean; topluOnayIzni: boolean }
export type EsnekYollar = { elNotlari: string; inceleme: string; topluOnay: string; tanima: string }

const BILDIRIM_ANAHTARI = 'notya-esnek-bildirim'

export default function EsnekAnaSayfa(p: {
  metin: EsnekMetinleri; getir: Getirici; api: string; golgeApi: string; yollar: EsnekYollar; git: (yol: string) => void
  onKarar?: (k: AnaSayfaKarari) => void
}) {
  const M = p.metin
  const [v, setV] = useState<Ana | null>(null)
  const [bildirimKapali, setBildirimKapali] = useState(true)
  const [geriAlinan, setGeriAlinan] = useState<Set<string>>(new Set())
  const { getir, api, onKarar } = p

  useEffect(() => {
    let iptal = false
    void getir(`${api}/ana`).then((r) => (r.ok ? r.json() : null)).then((j: Ana | null) => {
      if (iptal || !j?.karar) return
      setV(j); onKarar?.(j.karar)
      try { setBildirimKapali(localStorage.getItem(BILDIRIM_ANAHTARI) === new Date().toLocaleDateString('en-CA')) } catch { setBildirimKapali(false) }
    }).catch(() => undefined)
    return () => { iptal = true }
  }, [getir, api, onKarar])

  if (!v) return null
  const bildirim = v.karar.bildirim.goster && !bildirimKapali
  async function geriAl(id: string) {
    const r = await getir(`${api}/ogrenilen`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => null)
    if (r?.ok) setGeriAlinan((s) => new Set(s).add(id))
  }
  async function topluAc() {
    const r = await getir(`${api}/profil`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ islem: 'ozerklik', alt: 'toplu_ac' }) }).catch(() => null)
    if (r?.ok) setV({ ...v!, b3Teklif: false, topluOnayIzni: true })
  }
  const elSatirlari = [v.elYazisi?.kelime ? M.ogrenme.elYazisiKelime(v.elYazisi.kelime) : null, v.elYazisi?.kisaltma ? M.ogrenme.elYazisiKisaltma(v.elYazisi.kisaltma) : null].filter((x): x is string => !!x)
  const kart: React.CSSProperties = { background: R.kagit, border: `1px solid ${R.cizgi}`, borderRadius: 14, padding: '12px 16px', color: R.murekkep }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {v.karar.elNotuOnce && (
        <button type="button" onClick={() => p.git(p.yollar.elNotlari)} style={{ ...kart, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: R.cam, color: '#fff', border: 'none' }}>
          <span aria-hidden style={{ fontSize: 22 }}>✎</span>
          <span style={{ flex: 1 }}><span style={{ display: 'block', fontWeight: 700, fontSize: 16 }}>{M.tanima.elNotuEkle}</span><span style={{ display: 'block', fontSize: 13, opacity: 0.85 }}>{M.tanima.elNotuAlt}</span></span>
        </button>
      )}
      {bildirim && (
        <div role="status" style={{ ...kart, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', background: R.amberAcik, borderColor: R.amberAcik }}>
          <span style={{ flex: 1, minWidth: 200, fontSize: 14, fontWeight: 600 }}>{M.tanima.bildirim(v.karar.bildirim.bekleyen)}</span>
          <button type="button" style={dugme('birincil')} onClick={() => p.git(v.topluOnayIzni ? p.yollar.topluOnay : p.yollar.inceleme)}>{v.topluOnayIzni ? M.tanima.topluOnayaGec : M.tanima.bildirimAc}</button>
          <button type="button" style={dugme('ikincil')} onClick={() => { try { localStorage.setItem(BILDIRIM_ANAHTARI, new Date().toLocaleDateString('en-CA')) } catch { /* yalnız bu oturum */ } setBildirimKapali(true) }}>{M.tanima.kapat}</button>
        </div>
      )}
      {v.golge && <GolgeSatiri metin={M} getir={getir} api={p.golgeApi} veri={v.golge} />}
      {v.b3Teklif && (
        <div style={{ ...kart, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ flex: 1, minWidth: 200, fontSize: 14 }}>{M.ozerklik.b3Teklif}</span>
          <button type="button" style={dugme('birincil')} onClick={() => void topluAc()}>{M.ozerklik.b3Evet}</button>
        </div>
      )}
      {(v.haftalik.length > 0 || elSatirlari.length > 0) && (
        <div style={kart}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{M.ogrenme.haftalik}</span>
            <button type="button" onClick={() => p.git(p.yollar.tanima)} style={{ border: 'none', background: 'none', color: R.cam, fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>{M.tanima.baslik}</button>
          </div>
          <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
            {elSatirlari.map((s) => <li key={s} style={{ fontSize: 14 }}>{s}</li>)}
            {v.haftalik.map((o) => (
              <li key={o.id} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, opacity: geriAlinan.has(o.id) ? 0.5 : 1 }}>
                <span style={{ flex: 1, minWidth: 0 }}>{adayCumlesi(o.oneri, M.ogrenme)}</span>
                {geriAlinan.has(o.id) ? <span style={{ fontSize: 12, color: R.soluk }}>{M.ogrenme.geriAlindi}</span> : <button type="button" style={dugme('kucuk')} onClick={() => void geriAl(o.id)}>{M.ogrenme.geriAl}</button>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
