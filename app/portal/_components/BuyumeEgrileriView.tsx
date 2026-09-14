'use client'
/**
 * NOTYA-BUYUME-EGRISI-02/03 (portal) — Kaan (2026-09-14): "Dr. Gökhan hasta portalında da
 * olması gerektiğini düşünüyor, aile için etkileyici olur." Doktor tarafındaki Büyüme
 * Eğrileri ile AYNI veri ve mantık (lib/clinical/buyumeEgrisi.ts, Neyzi standartları),
 * yalnız Sağlığım'ın açık/kağıt temasına uyarlanmış renkler. Karta tıklayınca tam sayfa
 * büyük görünüm + Geri + Önceki/Sonraki gezinme (aile ile birlikte bakmak için).
 */
import { useState } from 'react'
import type { PortalBuyume, PortalBuyumeParametre, PortalBuyumeSerisi } from '@/lib/portal/types'
import { SoftPanel } from './ui'

function yasEtiketi(ay: number): string {
  if (ay <= 0) return 'Doğum'
  if (ay < 24) return `${Math.round(ay)}a`
  return `${Math.round(ay / 12)}y`
}
function yasMetniUzun(ay: number): string {
  if (ay <= 0) return 'doğumda'
  if (ay < 24) return `${Math.round(ay)} aylıkken`
  const yil = Math.floor(ay / 12); const kalanAy = Math.round(ay % 12)
  return kalanAy > 0 ? `${yil} yaş ${kalanAy} aylıkken` : `${yil} yaşındayken`
}

const RENK_50 = 'var(--sg-accent)'
const RENK_BAND_DIS = 'rgba(10,22,40,0.22)'
const RENK_BAND_ORTA = 'rgba(10,122,138,0.35)'
const RENK_BAND_IC = 'rgba(10,122,138,0.55)'
const RENK_NOKTA = 'var(--sg-coral)'

function bandRenk(p: number): string {
  if (p === 50) return RENK_50
  if (p === 25 || p === 75) return RENK_BAND_IC
  if (p === 10 || p === 90) return RENK_BAND_ORTA
  return RENK_BAND_DIS
}

function Grafik({ veri, birim, buyuk }: { veri: PortalBuyumeParametre; birim: string; buyuk?: boolean }) {
  const W = buyuk ? 1000 : 320, H = buyuk ? 480 : 190
  const L = buyuk ? 60 : 34, R = buyuk ? 24 : 10, T = buyuk ? 20 : 10, B = buyuk ? 48 : 22
  const maxAy = Math.max(...veri.egriler.flatMap((s) => s.noktalar.map((n) => n.ay)), ...veri.noktalar.map((n) => n.ay), 6)
  const tumDegerler = [...veri.egriler.flatMap((s) => s.noktalar.map((n) => n.deger)), ...veri.noktalar.map((n) => n.deger)]
  let min = Math.min(...tumDegerler), max = Math.max(...tumDegerler)
  const pad = (max - min || 1) * 0.08
  min = Math.max(0, min - pad); max = max + pad
  const x = (ay: number) => L + (ay / maxAy) * (W - L - R)
  const y = (v: number) => T + (1 - (v - min) / (max - min || 1)) * (H - T - B)

  const etiketler: number[] = []
  for (let a = 0; a <= Math.min(24, maxAy); a += (buyuk ? 3 : 6)) etiketler.push(a)
  for (let yil = 3; yil * 12 <= maxAy; yil++) etiketler.push(yil * 12)
  if (etiketler[etiketler.length - 1] < maxAy - 3) etiketler.push(Math.round(maxAy))

  const path = (n: { ay: number; deger: number }[]) => n.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.ay).toFixed(1)},${y(p.deger).toFixed(1)}`).join(' ')
  const p50 = veri.egriler.find((s: PortalBuyumeSerisi) => s.persentil === 50)
  const alanYolu = p50 && p50.noktalar.length ? `${path(p50.noktalar)} L${x(p50.noktalar[p50.noktalar.length - 1].ay).toFixed(1)},${y(min).toFixed(1)} L${x(0).toFixed(1)},${y(min).toFixed(1)} Z` : ''
  const uid = birim.replace(/[^a-z]/gi, '') + (buyuk ? 'b' : 's')

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`pfill-${uid}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--sg-accent)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--sg-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
        const v = min + (max - min) * (1 - f)
        return (
          <g key={i}>
            <line x1={L} x2={W - R} y1={T + f * (H - T - B)} y2={T + f * (H - T - B)} stroke="var(--sg-line)" strokeWidth="1" />
            <text x={L - (buyuk ? 10 : 6)} y={T + f * (H - T - B) + 3.5} textAnchor="end" fontSize={buyuk ? 13 : 9.5} fill="var(--sg-muted)">{Math.round(v * 10) / 10}</text>
          </g>
        )
      })}
      {etiketler.map((ay, i) => (
        <text key={i} x={x(ay)} y={H - B + (buyuk ? 20 : 12)} textAnchor="middle" fontSize={buyuk ? 12.5 : 9} fill="var(--sg-muted)">{yasEtiketi(ay)}</text>
      ))}
      {alanYolu && <path d={alanYolu} fill={`url(#pfill-${uid})`} />}
      {veri.egriler.map((s) => (
        <g key={s.persentil}>
          <path d={path(s.noktalar)} fill="none" stroke={bandRenk(s.persentil)} strokeWidth={s.persentil === 50 ? (buyuk ? 3.2 : 2.1) : (buyuk ? 1.6 : 1)} strokeDasharray={s.persentil === 50 ? undefined : (buyuk ? '5 4' : '3 3')} strokeLinecap="round" />
        </g>
      ))}
      {veri.noktalar.map((n, i) => (
        <g key={i}>
          <circle cx={x(n.ay)} cy={y(n.deger)} r={buyuk ? 7 : 4} fill={RENK_NOKTA} stroke="var(--sg-surface)" strokeWidth={buyuk ? 2.5 : 1.5}>
            <title>{`${yasEtiketi(n.ay)} — ${n.deger} ${birim}`}</title>
          </circle>
          {buyuk && <text x={x(n.ay)} y={y(n.deger) - 14} textAnchor="middle" fontSize={12} fontWeight={700} fill={RENK_NOKTA}>{n.deger}</text>}
        </g>
      ))}
    </svg>
  )
}

const BASLIK: Record<string, string> = { kilo: 'Kilo', boy: 'Boy', basCevresi: 'Baş Çevresi', vki: 'Vücut Kitle İndeksi' }

export function BuyumeEgrileriView({ buyume }: { buyume: PortalBuyume }) {
  const [buyukIndex, setBuyukIndex] = useState<number | null>(null)
  const { kilo, boy, basCevresi, vki } = buyume.parametreler
  const paramlar = ([['kilo', kilo], ['boy', boy], ['basCevresi', basCevresi], ['vki', vki]] as const).filter(([, v]) => !!v) as [string, PortalBuyumeParametre][]
  if (!paramlar.length) return null
  const yasMetni = buyume.mevcutYasAy != null ? (buyume.mevcutYasAy < 24 ? `${Math.round(buyume.mevcutYasAy)} aylık` : `${Math.floor(buyume.mevcutYasAy / 12)} yaşında`) : ''

  if (buyukIndex !== null && paramlar[buyukIndex]) {
    const [anahtar, pVeri] = paramlar[buyukIndex]
    const sonOlcum = pVeri.noktalar[pVeri.noktalar.length - 1]
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--sg-surface)', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
        <div className="sg-buyume-bas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--sg-line)', flexWrap: 'wrap', gap: 10 }}>
          <button type="button" onClick={() => setBuyukIndex(null)} style={{ background: 'transparent', border: 'none', color: 'var(--sg-muted)', fontSize: 15, cursor: 'pointer' }}>← Geri</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--sg-ink)' }}>{BASLIK[anahtar]} Büyüme Eğrisi <span style={{ fontWeight: 400, color: 'var(--sg-muted)', fontSize: 14 }}>({pVeri.birim})</span></div>
            <div style={{ fontSize: 13, color: 'var(--sg-muted)', marginTop: 2 }}>{buyume.cinsiyet === 'female' ? 'Kız' : 'Erkek'} · {yasMetni} · Neyzi Türk çocukları standartları</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setBuyukIndex((i) => (i! - 1 + paramlar.length) % paramlar.length)} style={{ background: 'var(--sg-accent-soft)', border: 'none', color: 'var(--sg-accent-ink)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 14 }}>‹ Önceki</button>
            <button type="button" onClick={() => setBuyukIndex((i) => (i! + 1) % paramlar.length)} style={{ background: 'var(--sg-accent)', border: 'none', color: 'white', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Sonraki ›</button>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, minHeight: 0 }}>
          <div style={{ width: '100%', maxWidth: 1000 }}><Grafik veri={pVeri} birim={pVeri.birim} buyuk /></div>
        </div>
        <div style={{ padding: '10px 24px 20px', textAlign: 'center', fontSize: 13, color: 'var(--sg-muted)' }}>
          <span style={{ color: RENK_NOKTA, fontWeight: 700 }}>●</span> Çocuğunuzun ölçümleri
          <span style={{ margin: '0 10px' }}>·</span>
          <span style={{ color: RENK_50, fontWeight: 700 }}>—</span> 50. persentil
          {sonOlcum && <div style={{ marginTop: 6 }}>Son ölçüm: {sonOlcum.deger} {pVeri.birim}, {yasMetniUzun(sonOlcum.ay)}</div>}
        </div>
        <style>{`@media (max-width: 640px) { .sg-buyume-bas { justify-content: center !important; text-align: center; padding: 12px 14px !important; } }`}</style>
      </div>
    )
  }

  return (
    <SoftPanel>
      <div style={{ fontWeight: 800, marginBottom: 4 }}>Büyüme Eğrileri</div>
      <div style={{ fontSize: 13, color: 'var(--sg-muted)', marginBottom: 14 }}>
        Neyzi Türk çocukları büyüme standartları · {buyume.cinsiyet === 'female' ? 'Kız' : 'Erkek'} · {yasMetni} — bir grafiğe dokunarak büyütebilirsiniz.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        {paramlar.map(([anahtar, pVeri], i) => (
          <button key={anahtar} type="button" onClick={() => setBuyukIndex(i)} className="sg-buyume-karti"
            style={{ background: 'var(--sg-surface)', border: '1px solid var(--sg-line)', borderRadius: 12, padding: 14, textAlign: 'left', cursor: 'pointer', transition: 'transform .15s, border-color .15s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: 'var(--sg-ink)', fontSize: 13.5 }}>{BASLIK[anahtar]} <span style={{ fontWeight: 400, color: 'var(--sg-muted)', fontSize: 12 }}>({pVeri.birim})</span></span>
              <span style={{ fontSize: 11, color: 'var(--sg-accent)' }}>Büyüt ⤢</span>
            </div>
            <Grafik veri={pVeri} birim={pVeri.birim} />
          </button>
        ))}
      </div>
      <style>{`.sg-buyume-karti:hover { border-color: var(--sg-accent) !important; transform: translateY(-2px); }`}</style>
    </SoftPanel>
  )
}
