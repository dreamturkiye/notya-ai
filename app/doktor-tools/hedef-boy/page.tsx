'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import DoktorNav from '@/components/doktor/DoktorNav'
import HastaTypeahead from '@/components/doktor/HastaTypeahead'
import HedefBoyManken from '@/components/hedefBoy/HedefBoyManken'
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

  const canli = useMemo(
    () => hesaplaHedefBoy({ anneBoy: anne, babaBoy: baba, cinsiyet }),
    [anne, baba, cinsiyet],
  )

  useEffect(() => {
    if (canli.ok) setSonuc(canli.sonuc)
  }, [canli])

  async function hastaYukle(id: string) {
    setHata('')
    setMesaj('')
    setSonuc(null)
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
      setHata('Önce hasta seçin.')
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
      setMesaj('Hasta dosyasına yazıldı. Portalda da görünür.')
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Kaydedilemedi')
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div style={toolsShell}>
      <DoktorNav />
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '28px 20px 48px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#14B8A6', letterSpacing: '1.4px' }}>PEDİATRİ · ARAÇLAR</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '6px 0 8px', letterSpacing: '-0.4px' }}>
          Anne-Baba Boylarına Göre Hedef Boy
        </h1>
        <p style={{ color: '#9CA3AF', fontSize: 14, maxWidth: 640, lineHeight: 1.5, margin: 0 }}>
          Tanner mid-parental height — aileye gösterilen cici bir tahmindir, tanı değildir.
          Boyları cm veya metre yazın (182 veya 1.82). Kayıt hasta dosyasının çekirdek verisine gider; intake zorunlu değildir.
        </p>

        <div className="hedef-boy-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 340px) minmax(0, 1fr)', gap: 16, marginTop: 22 }}>
          <div style={toolsCard}>
            <label style={toolsLabel}>Hasta</label>
            <HastaTypeahead
              value={hastaId}
              onChange={(id, h) => {
                setHastaId(id)
                setHastaAd(h?.label || '')
              }}
              placeholder="Çocuk adı yazın…"
            />
            {hastaAd && (
              <div style={{ marginTop: 10, fontSize: 13, color: '#CBD5E1' }}>
                {hastaAd}
                {cinsiyet ? ` · ${cinsiyet === 'Kadın' ? 'Kız' : cinsiyet}` : ''}
              </div>
            )}

            <label style={{ ...toolsLabel, marginTop: 16 }}>Çocuk cinsiyeti</label>
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
                    border: cinsiyet === val ? '1px solid #0F9B8E' : '1px solid rgba(255,255,255,0.14)',
                    background: cinsiyet === val ? 'rgba(15,155,142,0.2)' : '#0A1628',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {etiket}
                </button>
              ))}
            </div>

            <label style={{ ...toolsLabel, marginTop: 16 }}>Baba boyu</label>
            <input
              style={toolsInput}
              value={baba}
              onChange={(e) => setBaba(e.target.value)}
              placeholder="182 veya 1.82"
              inputMode="decimal"
            />
            {ipucu(baba) && <div style={{ fontSize: 12, color: '#38BDF8', marginTop: 4 }}>{ipucu(baba)}</div>}

            <label style={{ ...toolsLabel, marginTop: 14 }}>Anne boyu</label>
            <input
              style={toolsInput}
              value={anne}
              onChange={(e) => setAnne(e.target.value)}
              placeholder="165 veya 1.65"
              inputMode="decimal"
            />
            {ipucu(anne) && <div style={{ fontSize: 12, color: '#F472B6', marginTop: 4 }}>{ipucu(anne)}</div>}

            <button type="button" onClick={kaydet} disabled={yukleniyor || !hastaId} style={{ ...toolsPrimaryBtn(yukleniyor || !hastaId), marginTop: 18 }}>
              {yukleniyor ? 'Kaydediliyor…' : kayitli ? 'Güncelle ve dosyaya yaz' : 'Hesapla ve dosyaya yaz'}
            </button>
            {hata && <div style={toolsErrorBox}>{hata}</div>}
            {mesaj && (
              <div style={{ ...toolsErrorBox, background: '#064E3B', borderColor: '#34D399', color: '#D1FAE5', marginTop: 12 }}>{mesaj}</div>
            )}
          </div>

          <div style={toolsCard}>
            {!sonuc && (
              <p style={{ color: '#8FA0B5', fontSize: 14, lineHeight: 1.55 }}>
                Hasta seçip anne ve baba boyunu girin. Ortadaki manken, çocuğun tahmini erişkin boyudur —
                solda baba, sağda anne.
              </p>
            )}
            {sonuc && (
              <>
                <HedefBoyManken sonuc={sonuc} tema="doktor" />
                <p style={{ fontSize: 12, color: '#8FA0B5', lineHeight: 1.55, margin: '8px 4px 0' }}>
                  Formül {sonuc.formul}. Aralık ±8,5 cm (Tanner %95 bant). Beslenme, hastalık ve ergenlik
                  zamanlaması boyu değiştirir — aileye “göz boyama” amaçlı, hoş bir bakıştır; büyüme eğrisi
                  ve hekim kararı asıl izlemdir.
                </p>
              </>
            )}
          </div>
        </div>
        <style>{`@media (max-width: 780px) { .hedef-boy-grid { grid-template-columns: 1fr !important; } }`}</style>
      </div>
    </div>
  )
}
