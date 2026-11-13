'use client'

import { useEffect, useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { ensureDoctorAccessToken, DOKTOR_GIRIS } from '@/lib/doktor/clientAuth'
import { hafizaGrupla } from '@/lib/doktor/ogrenme/gorunum'
import { ogrenmeMetni } from '@/lib/doktor/ogrenme/metinler'
import { haftalikSatiri, ivmeYonMetni, type HaftalikOzet, type IvmeSonucu } from '@/lib/doktor/ogrenme/ivme'
import type { KuralOnizlemesi } from '@/lib/doktor/ogrenme/onizleme'
import type { HafizaKayit } from '@/lib/doktor/hafiza'

// AYSE-OGRENME-V3: bu sayfanın tüm kelimeleri ülke başına tek metin nesnesinden gelir (TR varsayılan, görünüm aynı).
const T = ogrenmeMetni()

const DUGME = { border: `1px solid ${CHROME_RENK.border}`, background: '#fff', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' } as const

function IvmeCizgisi({ seri }: { seri: { duzeltme: number }[] }) {
  const w = 240
  const h = 44
  const max = Math.max(1, ...seri.map((s) => s.duzeltme))
  const x = (i: number) => (seri.length === 1 ? w / 2 : (i / (seri.length - 1)) * (w - 8) + 4)
  const y = (v: number) => h - 4 - (v / max) * (h - 8)
  const yol = seri.map((s, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(s.duzeltme).toFixed(1)}`).join(' ')
  return (
    <svg width={w} height={h} role="img" aria-label={T.ivmeBirim} style={{ display: 'block', marginTop: 8 }}>
      <path d={yol} fill="none" stroke={CHROME_RENK.pine} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {seri.map((s, i) => <circle key={i} cx={x(i)} cy={y(s.duzeltme)} r={2.5} fill={CHROME_RENK.pine} />)}
    </svg>
  )
}

function OnizlemeKutusu({ o }: { o: KuralOnizlemesi }) {
  if (!o.var) return <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 8 }}>{T.onizlemeYok}</div>
  return (
    <div style={{ marginTop: 10, background: '#FBF8F3', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: CHROME_RENK.muted, marginBottom: 6 }}>{T.onizlemeBaslik}</div>
      {o.ciftler.map((c, i) => (
        <div key={i} style={{ marginBottom: i < o.ciftler.length - 1 ? 10 : 0 }}>
          <div style={{ fontSize: 11, color: CHROME_RENK.muted }}>{T.onizlemeOnce}</div>
          <div style={{ fontSize: 13, color: CHROME_RENK.ink, textDecoration: c.sonraki ? 'line-through' : 'none', opacity: 0.8 }}>{c.onceki || '—'}</div>
          <div style={{ fontSize: 11, color: CHROME_RENK.pine, fontWeight: 700, marginTop: 4 }}>{T.onizlemeSonra}</div>
          <div style={{ fontSize: 13, color: CHROME_RENK.ink }}>{c.sonraki || '—'}</div>
        </div>
      ))}
      <div style={{ fontSize: 11, color: CHROME_RENK.muted, marginTop: 8 }}>{T.onizlemeNotu}</div>
    </div>
  )
}

export default function AyseHafizasiPage() {
  const [kayitlar, setKayitlar] = useState<HafizaKayit[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [ivme, setIvme] = useState<IvmeSonucu | null>(null)
  const [haftalik, setHaftalik] = useState<HaftalikOzet | null>(null)
  const [onizlemeler, setOnizlemeler] = useState<Record<string, KuralOnizlemesi | undefined>>({})
  const [acik, setAcik] = useState<Record<string, boolean>>({})
  const [klinik, setKlinik] = useState<{ uye: boolean; aktif: boolean; gelen: number } | null>(null)

  const baslik = async () => {
    const t = await ensureDoctorAccessToken()
    if (!t) { window.location.href = DOKTOR_GIRIS; return null }
    return { Authorization: `Bearer ${t}` }
  }

  const yukle = async () => {
    const h = await baslik()
    if (!h) return
    const r = await fetch('/api/doktor/hafiza?tum=1', { headers: h, cache: 'no-store' })
    const j = await r.json()
    setKayitlar(Array.isArray(j.kayitlar) ? j.kayitlar : [])
    setYukleniyor(false)
  }

  const yukleV3 = async () => {
    const h = await baslik()
    if (!h) return
    try {
      const [a, b] = await Promise.all([
        fetch('/api/doktor/hafiza/ivme', { headers: h, cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/doktor/hafiza/klinik-uslup', { headers: h, cache: 'no-store' }).then((r) => r.json()),
      ])
      setIvme(a?.ivme || null)
      setHaftalik(a?.haftalik || null)
      setKlinik(b && typeof b.uye === 'boolean' ? b : null)
    } catch { /* ivme ve klinik bölümü sessizce gizlenir; kural listesi çalışmaya devam eder */ }
  }

  useEffect(() => { void yukle(); void yukleV3() }, [])

  const post = async (body: Record<string, unknown>) => {
    const t = await ensureDoctorAccessToken()
    const r = await fetch('/api/doktor/hafiza', {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const j = await r.json().catch(() => ({}))
    if (body.durum === 'uygulanir' && typeof body.anahtar === 'string' && j?.onizleme) {
      setOnizlemeler((o) => ({ ...o, [String(body.anahtar)]: j.onizleme as KuralOnizlemesi }))
      setAcik((a) => ({ ...a, [String(body.anahtar)]: true }))
    }
    await yukle()
    void yukleV3()
  }

  const onizlemeToggle = async (anahtar: string) => {
    const yeni = !acik[anahtar]
    setAcik((a) => ({ ...a, [anahtar]: yeni }))
    if (!yeni || onizlemeler[anahtar]) return
    const h = await baslik()
    if (!h) return
    try {
      const r = await fetch(`/api/doktor/hafiza/onizleme?anahtar=${encodeURIComponent(anahtar)}`, { headers: h, cache: 'no-store' })
      const j = await r.json()
      setOnizlemeler((o) => ({ ...o, [anahtar]: (j?.onizleme as KuralOnizlemesi) || { var: false, ciftler: [] } }))
    } catch { setOnizlemeler((o) => ({ ...o, [anahtar]: { var: false, ciftler: [] } })) }
  }

  const klinikDegistir = async (ac: boolean) => {
    const h = await baslik()
    if (!h) return
    const r = await fetch('/api/doktor/hafiza/klinik-uslup', { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ ac }) })
    const j = await r.json().catch(() => null)
    if (j && typeof j.uye === 'boolean') setKlinik(j)
  }

  const gruplar = hafizaGrupla(kayitlar)
  const haftaSatiri = haftalikSatiri(haftalik, T)

  return (
    <div style={{ maxWidth: 720, fontFamily: CHROME_FONT.sans }}>
      <a href="/dashboard/doktor/ayarlar" style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4, display: 'inline-block', textDecoration: 'none' }}>{T.sayfaGeri}</a>
      <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 32, margin: '0 0 6px', color: '#2e251d' }}>{T.sayfaBaslik}</h1>
      <p style={{ fontSize: 14, color: CHROME_RENK.muted, marginBottom: 22 }}>{T.sayfaAciklama}</p>

      {ivme && (
        <section style={{ background: '#fff', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 14, padding: '14px 16px', marginBottom: 22 }}>
          <h2 style={{ fontFamily: CHROME_FONT.serif, fontSize: 20, fontWeight: 500, margin: '0 0 6px', color: '#2e251d' }}>{T.ivmeBaslik}</h2>
          {!ivme.yeterli ? (
            <div style={{ fontSize: 13, color: CHROME_RENK.muted }}>{T.ivmeBos(ivme.n)}</div>
          ) : (
            <>
              <div style={{ fontSize: 15, fontWeight: 600, color: CHROME_RENK.ink }}>{T.ivmeSatir(ivme.n, String(ivme.ilkOrtalama), String(ivme.sonOrtalama))}</div>
              <div style={{ fontSize: 13, color: CHROME_RENK.pine, marginTop: 2 }}>{ivmeYonMetni(ivme, T)}</div>
              <IvmeCizgisi seri={ivme.seri.slice(-30)} />
              {haftaSatiri && <div style={{ fontSize: 13, color: CHROME_RENK.ink, marginTop: 8 }}>{haftaSatiri}</div>}
              <div style={{ fontSize: 11, color: CHROME_RENK.muted, marginTop: 6 }}>{T.ivmeNot(ivme.n)} · {T.ivmeBirim}</div>
            </>
          )}
        </section>
      )}

      {yukleniyor && <div style={{ color: CHROME_RENK.muted }}>{T.yukleniyor}</div>}
      {!yukleniyor && !gruplar.length && <div style={{ color: CHROME_RENK.muted }}>{T.kuralYok}</div>}
      {gruplar.map((g) => (
        <section key={g.kategori} style={{ marginBottom: 22 }}>
          <h2 style={{ fontFamily: CHROME_FONT.serif, fontSize: 20, fontWeight: 500, margin: '0 0 10px', color: '#2e251d' }}>{T.kategori[g.kategori] || g.kategori}</h2>
          {g.kayitlar.map((k) => {
            const kapali = k.durum === 'kapali' || k.aktif === false
            const durum = (k.durum || (k.kesin ? 'uygulanir' : 'aday')) as 'aday' | 'uygulanir' | 'kapali'
            const onizlenebilir = k.kaynak === 'duzeltme' && !kapali
            return (
              <div key={`${k.kategori}-${k.anahtar}`} style={{ background: '#fff', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 14, padding: '14px 16px', marginBottom: 8, opacity: kapali ? 0.55 : 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: CHROME_RENK.ink }}>{k.deger}</div>
                <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 4 }}>
                  {T.kaynak[k.kaynak] || k.kaynak} · {T.kanit(k.kanit_sayisi)} · {T.durum[durum]}
                  {k.ilk_gorulme ? ` · ${T.ilk} ${String(k.ilk_gorulme).slice(0, 10)}` : ''}
                  {k.son_gorulme ? ` · ${T.son} ${String(k.son_gorulme).slice(0, 10)}` : ''}
                </div>
                {Array.isArray(k.ornekler) && k.ornekler.length > 0 && (
                  <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 6 }}>{k.ornekler.map((o) => `“${o}”`).join(' · ')}</div>
                )}
                {acik[k.anahtar] && onizlemeler[k.anahtar] && <OnizlemeKutusu o={onizlemeler[k.anahtar]!} />}
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  {onizlenebilir && (
                    <button type="button" onClick={() => void onizlemeToggle(k.anahtar)} style={DUGME}>
                      {acik[k.anahtar] ? T.onizlemeKapat : T.onizlemeAc}
                    </button>
                  )}
                  {!kapali && k.durum === 'aday' && (
                    <button type="button" onClick={() => void post({ anahtar: k.anahtar, durum: 'uygulanir' })} style={DUGME}>{T.uygula}</button>
                  )}
                  {!kapali && (
                    <button type="button" onClick={() => void post({ kapat: k.anahtar })} style={DUGME}>{T.kapat}</button>
                  )}
                  {kapali && (
                    <button type="button" onClick={() => void post({ anahtar: k.anahtar, durum: 'uygulanir' })} style={DUGME}>{T.uygula}</button>
                  )}
                  <button type="button" onClick={() => void post({ unut: k.anahtar })} style={{ border: 'none', background: 'transparent', color: '#8C2F2F', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{T.unut}</button>
                </div>
              </div>
            )
          })}
        </section>
      ))}

      {klinik?.uye && (
        <section style={{ background: '#fff', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 14, padding: '14px 16px', marginBottom: 22 }}>
          <h2 style={{ fontFamily: CHROME_FONT.serif, fontSize: 20, fontWeight: 500, margin: '0 0 6px', color: '#2e251d' }}>{T.klinikBaslik}</h2>
          <div style={{ fontSize: 13, color: CHROME_RENK.ink }}>{T.klinikAciklama}</div>
          <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 6 }}>{T.klinikPaylasir} {T.klinikPaylasmaz}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: CHROME_RENK.ink, marginTop: 8 }}>{klinik.aktif ? T.klinikAktif(klinik.gelen) : T.klinikPasif}</div>
          <div style={{ marginTop: 10 }}>
            {klinik.aktif
              ? <button type="button" onClick={() => void klinikDegistir(false)} style={DUGME}>{T.klinikAyril}</button>
              : <button type="button" onClick={() => void klinikDegistir(true)} style={DUGME}>{T.klinikAc}</button>}
          </div>
        </section>
      )}
    </div>
  )
}
