'use client'
/**
 * TR-PARITE-01 — Özel Branşlar › İstem · yönlendirme listesi. Dalın kendi listesi (lib/doktor/bransIstemleri.ts) aynı
 * seçiciyle (components/doktor/BransIstemSecici.tsx) seçilir ve BELGE-NO-01 künyeli tek sayfaya yazdırılır.
 * Müttefik meslekte (fizyoterapi, klinik psikolog, diyetisyen, ergoterapi, odyoloji) liste yalnız hekime yönlendirmedir
 * — yönetmelik md.16: tetkik isteyemez; kâğıdın başlığı da "Yönlendirme"dir. Hasta seçimi isteğe bağlıdır; hasta verisi
 * yalnız seçili hastanın adıdır.
 */
import React, { useEffect, useMemo, useState } from 'react'
import BelgeKunyesi from '@/components/doktor/yazdir/BelgeKunyesi'
import { BransIstemSecici, type IstemGrubu } from '@/components/doktor/BransIstemSecici'
import { bransIstemleri, ISTEM_MUTTEFIK } from '@/lib/doktor/bransIstemleri'
import { KLINIK_ETIKET, klinikSlugCoz } from '@/lib/specialties/klinikDikey'
import { TUM_TETKIKLER, NUMUNE_ADI } from '@/lib/doktor/tetkikKatalogu'

function jeton(): string {
  try { const raw = localStorage.getItem('auth-token'); return raw ? (JSON.parse(raw).access_token || '') : '' } catch { return '' }
}

export default function KlinikIstemPaneli() {
  const [uzmanlik, setUzmanlik] = useState<string | null>(null)
  const [hekim, setHekim] = useState('')
  const [secim, setSecim] = useState<Record<string, IstemGrubu | undefined>>({})
  const [not, setNot] = useState('')
  const [kagit, setKagit] = useState(false)
  useEffect(() => {
    let iptal = false
    ;(async () => {
      try {
        const r = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${jeton()}` } })
        const j = r.ok ? await r.json() : null
        if (!iptal) { setUzmanlik(String(j?.data?.specialty || '')); setHekim(String(j?.data?.full_name || j?.data?.name || '')) }
      } catch { if (!iptal) setUzmanlik('') }
    })()
    return () => { iptal = true }
  }, [])
  const slug = klinikSlugCoz(uzmanlik)
  const cozum = useMemo(() => (slug ? bransIstemleri(slug) : null), [slug])
  if (uzmanlik === null) return <div style={{ color: '#8b7d70' }}>Yükleniyor…</div>
  if (!slug || !cozum) return <div style={{ color: '#8b7d70' }}>Dalınız çözülemedi; liste gösterilmiyor.</div>
  const muttefik = ISTEM_MUTTEFIK.has(cozum.brans)
  const secili = (g: IstemGrubu, ad: string) => secim[ad] === g
  const degistir = (g: IstemGrubu, ad: string) => setSecim((p) => ({ ...p, [ad]: p[ad] === g ? undefined : g }))
  const hepsi = (g: IstemGrubu, adlar: readonly string[]) => setSecim((p) => { const n = { ...p }; adlar.forEach((a) => { n[a] = g }); return n })
  const kalemler = (g: IstemGrubu) => Object.keys(secim).filter((k) => secim[k] === g)
  const baslik = muttefik ? 'Yönlendirme' : 'Tetkik İstek ve Yönlendirme'
  const tarih = new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric' })
  return (
    <div style={{ fontSize: 13, color: '#3b2e24' }}>
      {muttefik && <p style={{ color: '#8b7d70', marginTop: 0 }}>Yönetmelik md.16: müttefik meslek tetkik isteyemez — bu liste yalnız hekime yönlendirme içindir.</p>}
      <BransIstemSecici bransAdi={KLINIK_ETIKET[slug]} liste={cozum.liste} secili={secili} degistir={degistir} hepsiniEkle={hepsi} />
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#8b7d70', margin: '12px 0 6px' }}>{muttefik ? 'Yönlendirme nedeni' : 'Klinik endikasyon'}</label>
      <textarea value={not} onChange={(e) => setNot(e.target.value)} rows={3} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid rgba(58,44,34,0.15)', borderRadius: 10, padding: 10, fontFamily: 'inherit', fontSize: 13 }} />
      <button type="button" onClick={() => setKagit(true)} disabled={!Object.values(secim).some(Boolean)} style={{ marginTop: 12, padding: '10px 16px', borderRadius: 8, border: 'none', background: '#2f4334', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: Object.values(secim).some(Boolean) ? 1 : 0.5 }}>Form oluştur</button>
      {kagit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(58,44,34,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ maxHeight: '92dvh', overflow: 'auto', width: '100%', maxWidth: 560 }}>
            <div id="print-area" style={{ background: 'white', color: '#111', padding: '36px 40px', fontFamily: 'Georgia, "Times New Roman", serif', minHeight: 600 }}>
              <BelgeKunyesi tur="tetkik_istem" kaynakId={`istem:${slug}:${new Date().toISOString().slice(0, 10)}`} hastaId={null} icerik={{ slug, secim, not }} />
              <div style={{ textAlign: 'center', borderBottom: '1.5px solid #111', paddingBottom: 8, marginBottom: 14 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{hekim || '________________'}</div>
                <div style={{ fontSize: 12 }}>{KLINIK_ETIKET[slug]}</div>
                <div style={{ fontSize: 13, fontStyle: 'italic', marginTop: 8 }}>{baslik}</div>
              </div>
              <div style={{ fontSize: 12, marginBottom: 14 }}><b>Hasta:</b> ________________ &nbsp; <b>Tarih:</b> {tarih}</div>
              {(['lab', 'goruntuleme', 'sevk'] as const).map((g) => kalemler(g).length ? (
                <div key={g} style={{ marginBottom: 12, fontSize: 13 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{g === 'lab' ? 'Laboratuvar' : g === 'goruntuleme' ? 'Görüntüleme ve testler' : 'Yönlendirme / konsültasyon'}</div>
                  <ol style={{ margin: 0, paddingLeft: 22, lineHeight: 1.55 }}>
                    {kalemler(g).map((t) => { const k = g === 'lab' ? TUM_TETKIKLER.find((x) => x.ad === t) : null; return <li key={t}><b>{t}</b>{k ? <span style={{ fontStyle: 'italic', color: '#333' }}> — {NUMUNE_ADI[k.n]}{k.aclik ? ', açlık gerekir' : ''}</span> : null}</li> })}
                  </ol>
                </div>
              ) : null)}
              <div style={{ marginTop: 14, fontSize: 13 }}><div style={{ fontWeight: 700, marginBottom: 6 }}>{muttefik ? 'Yönlendirme nedeni' : 'Klinik endikasyon'}</div><div style={{ borderBottom: '1px solid #111', minHeight: 40, whiteSpace: 'pre-wrap' }}>{not || ' '}</div></div>
              <div style={{ marginTop: 48, textAlign: 'right', fontSize: 11 }}>Kaşe / İmza</div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => window.print()} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#2f4334', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Yazdır</button>
              <button type="button" onClick={() => setKagit(false)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #2f4334', background: '#faf6ee', color: '#2f4334', fontWeight: 600, cursor: 'pointer' }}>Kapat</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@media print { body * { visibility: hidden !important; } #print-area, #print-area * { visibility: visible !important; } #print-area { position: absolute; left: 0; top: 0; width: 100%; } @page { size: A4 portrait; margin: 12mm; } }`}</style>
    </div>
  )
}
