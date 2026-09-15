'use client'

import { useEffect, useMemo, useRef, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import DoktorNav from '@/components/doktor/DoktorNav'
import HastaTypeahead from '@/components/doktor/HastaTypeahead'
import HedefBoyManken, { HedefBoySahneBos } from '@/components/hedefBoy/HedefBoyManken'
import {
  getAccessTokenAsync,
  toolsCard,
  toolsErrorBox,
  toolsInput,
  toolsLabel,
  toolsPrimaryBtn,
  toolsShell,
} from '@/lib/doktor/toolsUi'
import { hesaplaHedefBoy, parseBoyGirdi, formatBoyCm, type HedefBoySonuc } from '@/lib/clinical/hedefBoy'

export const dynamic = 'force-dynamic'

function ipucu(raw: string): string {
  const p = parseBoyGirdi(raw)
  return p.ok ? formatBoyCm(p.cm) : ''
}

export default function HedefBoyAracPage() {
  return (
    <Suspense fallback={<div style={{ ...toolsShell, padding: 40, color: '#8FA0B5' }}>Yükleniyor…</div>}>
      <HedefBoyAracIcerik />
    </Suspense>
  )
}

function HedefBoyAracIcerik() {
  const search = useSearchParams()
  const sahneRef = useRef<HTMLDivElement>(null)
  const [hastaId, setHastaId] = useState(search?.get('patientId') || '')
  const [hastaAd, setHastaAd] = useState('')
  const [cinsiyet, setCinsiyet] = useState('')
  const [anne, setAnne] = useState('')
  const [baba, setBaba] = useState('')
  const [sonuc, setSonuc] = useState<HedefBoySonuc | null>(null)
  const [kayitli, setKayitli] = useState(false)
  const [hata, setHata] = useState('')
  const [mesaj, setMesaj] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [aileGoster, setAileGoster] = useState(false)

  const canli = useMemo(
    () => hesaplaHedefBoy({ anneBoy: anne, babaBoy: baba, cinsiyet }),
    [anne, baba, cinsiyet],
  )

  useEffect(() => {
    if (canli.ok) setSonuc(canli.sonuc)
  }, [canli])

  useEffect(() => {
    if (!aileGoster) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') kapatAile() }
    window.addEventListener('keydown', onKey)
    const onFs = () => { if (!document.fullscreenElement) setAileGoster(false) }
    document.addEventListener('fullscreenchange', onFs)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFs)
    }
  }, [aileGoster])

  async function hastaYukle(id: string) {
    setHata('')
    setMesaj('')
    setKayitli(false)
    if (!id) return
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch(`/api/doktor/hastalar/${id}/hedef-boy`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Hasta yüklenemedi')
      setHastaAd(d.ad || '')
      setCinsiyet(d.cinsiyet || '')
      setAnne(d.anneBoyCm != null ? String(d.anneBoyCm) : '')
      setBaba(d.babaBoyCm != null ? String(d.babaBoyCm) : '')
      setSonuc(d.sonuc || null)
      setKayitli(Boolean(d.sonuc))
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Yüklenemedi')
    }
  }

  useEffect(() => {
    if (hastaId) void hastaYukle(hastaId)
  }, [hastaId])

  async function kaydet() {
    setHata('')
    setMesaj('')
    if (!hastaId) {
      setHata('Hastaya yazmak için önce çocuk seçin. Stüdyo boylar girilince zaten açılır.')
      return
    }
    const hesap = hesaplaHedefBoy({ anneBoy: anne, babaBoy: baba, cinsiyet })
    if (!hesap.ok) {
      setHata(hesap.hata)
      return
    }
    setYukleniyor(true)
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch(`/api/doktor/hastalar/${hastaId}/hedef-boy`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ anneBoy: anne, babaBoy: baba, cinsiyet }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Kaydedilemedi')
      setSonuc(d.sonuc)
      setKayitli(true)
      setMesaj('Dosyaya yazıldı. Aileye gösterin — portalda da görünür.')
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Kaydedilemedi')
    } finally {
      setYukleniyor(false)
    }
  }

  async function aileyeGoster() {
    if (!sonuc) return
    setAileGoster(true)
    try {
      await sahneRef.current?.requestFullscreen()
    } catch {
      /* iOS / kısıtlı tarayıcı: sabit katman yeter */
    }
  }

  function kapatAile() {
    setAileGoster(false)
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined)
    }
  }

  const gorsel = sonuc && canli.ok ? canli.sonuc : sonuc

  return (
    <div style={toolsShell}>
      {!aileGoster && <DoktorNav />}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: aileGoster ? 0 : '24px 16px 48px' }}>
        {!aileGoster && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E8C547', letterSpacing: '1.4px' }}>PEDİATRİ · ARAÇLAR</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: '6px 0 8px', letterSpacing: '-0.4px' }}>
              Anne-Baba Boylarına Göre Hedef Boy
            </h1>
            <p style={{ color: '#9CA3AF', fontSize: 14, maxWidth: 720, lineHeight: 1.5, margin: 0 }}>
              Baba ve anne boyunu girin — stüdyo burada açılır. Laptop veya telefonu aileye çevirin.
              Tanner tahmini; tanı değildir.
            </p>
          </>
        )}

        <div className="hedef-boy-grid" style={{ display: aileGoster ? 'block' : 'grid', gridTemplateColumns: 'minmax(0, 300px) minmax(0, 1fr)', gap: 18, marginTop: aileGoster ? 0 : 22, alignItems: 'start' }}>
          {!aileGoster && (
            <div style={toolsCard}>
              <label style={toolsLabel}>Baba boyu</label>
              <input
                style={{ ...toolsInput, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}
                value={baba}
                onChange={(e) => setBaba(e.target.value)}
                placeholder="182 veya 1.82"
                inputMode="decimal"
                autoComplete="off"
              />
              {ipucu(baba) && <div style={{ fontSize: 12, color: '#5BA8D9', marginTop: 4 }}>{ipucu(baba)}</div>}

              <label style={{ ...toolsLabel, marginTop: 14 }}>Anne boyu</label>
              <input
                style={{ ...toolsInput, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}
                value={anne}
                onChange={(e) => setAnne(e.target.value)}
                placeholder="165 veya 1.65"
                inputMode="decimal"
                autoComplete="off"
              />
              {ipucu(anne) && <div style={{ fontSize: 12, color: '#E07A8D', marginTop: 4 }}>{ipucu(anne)}</div>}

              <label style={{ ...toolsLabel, marginTop: 16 }}>Çocuk</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['Erkek', 'Erkek'], ['Kadın', 'Kız']].map(([val, etiket]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCinsiyet(val)}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: cinsiyet === val ? '1px solid #E8C547' : '1px solid rgba(255,255,255,0.14)',
                      background: cinsiyet === val ? 'rgba(232,197,71,0.18)' : '#0A1628',
                      color: '#fff',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {etiket}
                  </button>
                ))}
              </div>

              <label style={{ ...toolsLabel, marginTop: 16 }}>Hastaya kaydet (isteğe bağlı)</label>
              <HastaTypeahead
                value={hastaId}
                onChange={(id, h) => {
                  setHastaId(id)
                  setHastaAd(h?.label || '')
                }}
                placeholder="Çocuk adı yazın…"
              />
              {hastaAd && (
                <div style={{ marginTop: 8, fontSize: 13, color: '#CBD5E1' }}>
                  {hastaAd}
                  {cinsiyet ? ` · ${cinsiyet === 'Kadın' ? 'Kız' : cinsiyet}` : ''}
                </div>
              )}

              <button type="button" onClick={kaydet} disabled={yukleniyor || !hastaId || !gorsel} style={{ ...toolsPrimaryBtn(yukleniyor || !hastaId || !gorsel), marginTop: 16 }}>
                {yukleniyor ? 'Kaydediliyor…' : kayitli ? 'Güncelle ve dosyaya yaz' : 'Dosyaya yaz'}
              </button>
              {gorsel && (
                <button
                  type="button"
                  onClick={() => void aileyeGoster()}
                  style={{
                    ...toolsPrimaryBtn(false),
                    marginTop: 10,
                    background: '#E8C547',
                    color: '#1A1404',
                  }}
                >
                  Aileye göster
                </button>
              )}
              {hata && <div style={toolsErrorBox}>{hata}</div>}
              {mesaj && (
                <div style={{ ...toolsErrorBox, background: '#064E3B', borderColor: '#34D399', color: '#D1FAE5', marginTop: 12 }}>{mesaj}</div>
              )}
            </div>
          )}

          <div ref={sahneRef} style={aileGoster ? { minHeight: '100dvh', background: '#050910', display: 'flex', flexDirection: 'column', padding: '12px 12px 20px' } : undefined}>
            {aileGoster && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px 10px' }}>
                <div style={{ fontSize: 13, color: '#E8C547', fontWeight: 800, letterSpacing: '0.08em' }}>
                  {hastaAd || 'Hedef boy'}
                </div>
                <button
                  type="button"
                  onClick={kapatAile}
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: '#EDF1F7', borderRadius: 999, padding: '8px 14px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Kapat
                </button>
              </div>
            )}
            {gorsel ? (
              <HedefBoyManken
                sonuc={gorsel}
                tema="doktor"
                style={aileGoster ? { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' } : undefined}
              />
            ) : (
              <HedefBoySahneBos tema="doktor" />
            )}
            {aileGoster && (
              <p style={{ textAlign: 'center', color: '#8FA0B5', fontSize: 13, margin: '8px 12px 0', lineHeight: 1.5 }}>
                Tanner tahmini — tanı değildir. Beslenme ve ergenlik boyu değiştirir.
              </p>
            )}
            {!aileGoster && gorsel && (
              <p style={{ fontSize: 12.5, color: '#8FA0B5', lineHeight: 1.55, margin: '10px 4px 0' }}>
                Formül {gorsel.formul}. Aralık ±8,5 cm. Laptop veya telefonu çevirip «Aileye göster» deyin.
              </p>
            )}
          </div>
        </div>
        <style>{`
          @media (max-width: 860px) {
            .hedef-boy-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </div>
  )
}
