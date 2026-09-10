'use client'
/**
 * Sağlığım › Takip — yaşamsal bulgu trendleri (hasta yüzü).
 * Kaan (2026-09-10): "çok plain, grafikler daha detaylı olabilir." Bağımlılıksız SVG:
 * özet kartları (son değer, öncekine göre değişim, normal aralık durumu), gerçek eksenli
 * alan grafikleri (normal aralık bandı, ızgara, tarih etiketleri, nokta ipuçları),
 * tansiyonda sistolik+diyastolik birlikte, altta ölçüm geçmişi tablosu ve sade dilde yorum.
 * Klinik yorum yok — yalnız "normal aralık" bilgisi ve doktora yönlendirme.
 */
import type { PortalBundle } from '@/lib/portal/types'
import { EmptyState, SectionHeader, SoftPanel } from './ui'

type Nokta = { tarih: string; deger: number }
type Seri = { ad: string; renk: string; noktalar: Nokta[] }
type Aralik = { min?: number; max?: number; etiket: string }

const ARALIK = {
  sistolik: { min: 90, max: 130, etiket: '90–130 mmHg' },
  diastolik: { min: 60, max: 85, etiket: '60–85 mmHg' },
  nabiz: { min: 60, max: 100, etiket: '60–100 /dk' },
  spo2: { min: 95, etiket: '≥ %95' },
} as const

function trDeger(n: number, maxFrac = 1): string {
  return n.toLocaleString('tr-TR', { maximumFractionDigits: maxFrac, minimumFractionDigits: Number.isInteger(n) ? 0 : Math.min(1, maxFrac) })
}
function kisaTarih(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}
function uzunTarih(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}
function durum(v: number | null, a: Aralik | null): { metin: string; renk: string; zemin: string } {
  if (v == null || !a) return { metin: '—', renk: 'var(--sg-muted)', zemin: 'transparent' }
  if (a.min != null && v < a.min) return { metin: 'Düşük', renk: 'var(--sg-coral-ink)', zemin: 'var(--sg-coral-soft)' }
  if (a.max != null && v > a.max) return { metin: 'Yüksek', renk: 'var(--sg-coral-ink)', zemin: 'var(--sg-coral-soft)' }
  return { metin: 'Normal aralıkta', renk: 'var(--sg-accent-ink)', zemin: 'var(--sg-accent-soft)' }
}
function fark(noktalar: Nokta[]): number | null {
  if (noktalar.length < 2) return null
  return noktalar[noktalar.length - 1].deger - noktalar[noktalar.length - 2].deger
}

/** Gerçek eksenli alan grafiği — normal aralık bandı, ızgara, tarih etiketleri, noktalar. */
function Grafik({ seriler, aralik, birim, ondalik = 0 }: { seriler: Seri[]; aralik?: Aralik | null; birim: string; ondalik?: number }) {
  const hepsi = seriler.flatMap((s) => s.noktalar.map((n) => n.deger))
  if (!hepsi.length || Math.max(...seriler.map((s) => s.noktalar.length)) < 2) {
    return <div style={{ height: 150, display: 'grid', placeItems: 'center', color: 'var(--sg-muted)', fontSize: 13 }}>Trend için en az iki ölçüm gerekir</div>
  }
  const W = 360, H = 170, L = 40, R = 12, T = 12, B = 28
  const ham = [...hepsi, ...(aralik?.min != null ? [aralik.min] : []), ...(aralik?.max != null ? [aralik.max] : [])]
  let min = Math.min(...ham), max = Math.max(...ham)
  const pad = (max - min || 1) * 0.15
  min = Math.floor(min - pad); max = Math.ceil(max + pad)
  const n = Math.max(...seriler.map((s) => s.noktalar.length))
  const x = (i: number) => L + (i / Math.max(1, n - 1)) * (W - L - R)
  const y = (v: number) => T + (1 - (v - min) / (max - min || 1)) * (H - T - B)
  const ticks = 4
  const tarihler = seriler[0].noktalar.map((p) => p.tarih)
  const uid = Math.random().toString(36).slice(2, 7)
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={seriler.map((s) => s.ad).join(', ')} style={{ display: 'block' }}>
      <defs>
        {seriler.map((s, i) => (
          <linearGradient key={i} id={`g${uid}${i}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={s.renk} stopOpacity="0.28" />
            <stop offset="100%" stopColor={s.renk} stopOpacity="0.02" />
          </linearGradient>
        ))}
      </defs>
      {aralik && (aralik.min != null || aralik.max != null) && (
        <rect x={L} y={y(aralik.max ?? max)} width={W - L - R} height={Math.max(0, y(aralik.min ?? min) - y(aralik.max ?? max))} fill="var(--sg-accent)" opacity="0.07" />
      )}
      {Array.from({ length: ticks + 1 }, (_, k) => {
        const v = min + ((max - min) * k) / ticks
        return (
          <g key={k}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--sg-line)" strokeWidth="1" />
            <text x={L - 6} y={y(v) + 3.5} textAnchor="end" fontSize="9.5" fill="var(--sg-muted)">{trDeger(v, ondalik)}</text>
          </g>
        )
      })}
      {tarihler.map((t, i) => (
        <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === tarihler.length - 1 ? 'end' : 'middle'} fontSize="9.5" fill="var(--sg-muted)">{kisaTarih(t)}</text>
      ))}
      {seriler.map((s, si) => {
        const pts = s.noktalar.map((p, i) => `${x(i)},${y(p.deger)}`)
        const alan = `${L},${y(min)} ${pts.join(' ')} ${x(s.noktalar.length - 1)},${y(min)}`
        return (
          <g key={si}>
            {si === 0 && <polygon points={alan} fill={`url(#g${uid}${si})`} />}
            <polyline fill="none" stroke={s.renk} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={pts.join(' ')} strokeDasharray={si === 0 ? undefined : '5 4'} />
            {s.noktalar.map((p, i) => (
              <g key={i}>
                <circle cx={x(i)} cy={y(p.deger)} r="4.5" fill="var(--sg-surface)" stroke={s.renk} strokeWidth="2.2">
                  <title>{`${uzunTarih(p.tarih)} · ${s.ad}: ${trDeger(p.deger, ondalik)} ${birim}`}</title>
                </circle>
                {i === s.noktalar.length - 1 && (
                  <text x={x(i) - 6} y={y(p.deger) - 9} textAnchor="end" fontSize="10.5" fontWeight="700" fill={s.renk}>{trDeger(p.deger, ondalik)}</text>
                )}
              </g>
            ))}
          </g>
        )
      })}
    </svg>
  )
}

function OzetKart({ baslik, deger, birim, degisim, ondalik, aralik, ters }: { baslik: string; deger: number | null; birim: string; degisim: number | null; ondalik: number; aralik: Aralik | null; ters?: boolean }) {
  const d = durum(deger, aralik)
  const ok = degisim == null ? '' : degisim > 0 ? '▲' : degisim < 0 ? '▼' : '■'
  const iyi = degisim == null ? null : ters ? degisim >= 0 : degisim <= 0
  return (
    <SoftPanel>
      <div style={{ fontSize: 12, color: 'var(--sg-muted)', fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase' }}>{baslik}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
        <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.5, color: 'var(--sg-ink)' }}>{deger == null ? '—' : trDeger(deger, ondalik)}</span>
        <span style={{ fontSize: 13, color: 'var(--sg-muted)' }}>{birim}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999, color: d.renk, background: d.zemin }}>{d.metin}</span>
        {degisim != null && (
          <span style={{ fontSize: 12, color: iyi ? 'var(--sg-accent-ink)' : 'var(--sg-muted)' }}>{ok} {trDeger(Math.abs(degisim), ondalik)} <span style={{ color: 'var(--sg-muted)' }}>öncekine göre</span></span>
        )}
      </div>
    </SoftPanel>
  )
}

export function TrackingView({ data }: { data: PortalBundle }) {
  const t = data.tracking
  const empty = !t.tansiyon.length && !t.kilo.length && !t.nabiz.length && !t.spo2.length
  const son = <T,>(a: T[]): T | null => (a.length ? a[a.length - 1] : null)
  const lastBp = son(t.tansiyon)
  const sistolik: Nokta[] = t.tansiyon.map((p) => ({ tarih: p.tarih, deger: p.sistolik }))
  const diastolik: Nokta[] = t.tansiyon.map((p) => ({ tarih: p.tarih, deger: p.diastolik }))

  // Sade dilde yorum — klinik karar değil, gözlem; her zaman doktora yönlendirir
  const yorumlar: string[] = []
  if (sistolik.length >= 2) {
    const ilk = sistolik[0].deger, sn = sistolik[sistolik.length - 1].deger
    yorumlar.push(`Tansiyonunuzun büyük değeri ${sistolik.length} ölçümde ${trDeger(ilk, 0)}'den ${trDeger(sn, 0)}'e ${sn < ilk ? 'indi' : sn > ilk ? 'çıktı' : 'aynı kaldı'}.`)
  }
  if (t.kilo.length >= 2) {
    const f = t.kilo[t.kilo.length - 1].deger - t.kilo[0].deger
    yorumlar.push(`Kilonuz ilk ölçümden bu yana ${trDeger(Math.abs(f), 1)} kg ${f < 0 ? 'azaldı' : f > 0 ? 'arttı' : 'değişmedi'}.`)
  }
  const spo2Son = son(t.spo2)
  if (spo2Son && spo2Son.deger < 95) yorumlar.push('Son oksijen değeriniz %95’in altında görünüyor; bir sonraki ziyarette doktorunuzla konuşun.')

  // Ölçüm geçmişi tablosu — tarih birleşik
  const tarihler = [...new Set([...t.tansiyon, ...t.kilo, ...t.nabiz, ...t.spo2].map((p) => p.tarih))].sort()
  const bul = <T extends { tarih: string }>(a: T[], d: string) => a.find((p) => p.tarih === d) || null

  return (
    <div className="sg-fade">
      <SectionHeader title="Sağlığımı takip et" subtitle="Muayenelerde ölçülen değerlerinizin zaman içindeki seyri. Yeşil bant genel normal aralığı gösterir; sizin için hedefi doktorunuz belirler." />

      {empty ? (
        <EmptyState art="takip" title="Henüz takip verisi yok" body="Son muayenede yaşamsal bulgular paylaşıldığında trendler burada oluşur." />
      ) : (
        <>
          <div className="sg-track-grid" style={{ marginBottom: 14 }}>
            <OzetKart baslik="Tansiyon" deger={lastBp ? lastBp.sistolik : null} birim={lastBp ? `/ ${lastBp.diastolik} mmHg` : 'mmHg'} degisim={fark(sistolik)} ondalik={0} aralik={ARALIK.sistolik} />
            <OzetKart baslik="Nabız" deger={son(t.nabiz)?.deger ?? null} birim="/dk" degisim={fark(t.nabiz)} ondalik={0} aralik={ARALIK.nabiz} />
            <OzetKart baslik="SpO₂" deger={spo2Son?.deger ?? null} birim="%" degisim={fark(t.spo2)} ondalik={0} aralik={ARALIK.spo2} ters />
            <OzetKart baslik="Kilo" deger={son(t.kilo)?.deger ?? null} birim="kg" degisim={fark(t.kilo)} ondalik={1} aralik={null} />
          </div>

          {yorumlar.length > 0 && (
            <SoftPanel>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Kısaca</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--sg-ink)', fontSize: 14, lineHeight: 1.6 }}>
                {yorumlar.map((y, i) => <li key={i}>{y}</li>)}
              </ul>
              <div style={{ fontSize: 12, color: 'var(--sg-muted)', marginTop: 6 }}>Bu yorumlar ölçümlerin özetidir, tıbbi değerlendirme değildir.</div>
            </SoftPanel>
          )}

          <div className="sg-track-grid sg-track-grid--genis" style={{ marginTop: 14 }}>
            <SoftPanel>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <div style={{ fontWeight: 800 }}>Tansiyon</div>
                <div style={{ fontSize: 11.5, color: 'var(--sg-muted)', whiteSpace: 'nowrap' }}><span style={{ color: 'var(--sg-accent)' }}>━</span> büyük <span style={{ color: '#9a5b3a' }}>┄</span> küçük · normal {ARALIK.sistolik.etiket}</div>
              </div>
              <Grafik seriler={[{ ad: 'Büyük (sistolik)', renk: 'var(--sg-accent)', noktalar: sistolik }, { ad: 'Küçük (diyastolik)', renk: '#9a5b3a', noktalar: diastolik }]} aralik={ARALIK.sistolik} birim="mmHg" />
            </SoftPanel>
            <SoftPanel>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <div style={{ fontWeight: 800 }}>Nabız</div>
                <div style={{ fontSize: 11.5, color: 'var(--sg-muted)' }}>normal {ARALIK.nabiz.etiket}</div>
              </div>
              <Grafik seriler={[{ ad: 'Nabız', renk: '#2f6b5d', noktalar: t.nabiz }]} aralik={ARALIK.nabiz} birim="/dk" />
            </SoftPanel>
            <SoftPanel>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <div style={{ fontWeight: 800 }}>SpO₂ (oksijen)</div>
                <div style={{ fontSize: 11.5, color: 'var(--sg-muted)' }}>normal {ARALIK.spo2.etiket}</div>
              </div>
              <Grafik seriler={[{ ad: 'SpO₂', renk: '#1a5c4e', noktalar: t.spo2 }]} aralik={ARALIK.spo2} birim="%" />
            </SoftPanel>
            <SoftPanel>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <div style={{ fontWeight: 800 }}>Kilo</div>
                <div style={{ fontSize: 11.5, color: 'var(--sg-muted)' }}>hedefi doktorunuz belirler</div>
              </div>
              <Grafik seriler={[{ ad: 'Kilo', renk: '#3d7a6a', noktalar: t.kilo }]} aralik={null} birim="kg" ondalik={1} />
            </SoftPanel>
          </div>

          <SoftPanel>
            <div style={{ fontWeight: 800, marginBottom: 8, marginTop: 4 }}>Ölçüm geçmişi</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ color: 'var(--sg-muted)', fontSize: 12, textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px', fontWeight: 700 }}>Tarih</th>
                    <th style={{ padding: '6px 8px', fontWeight: 700 }}>Tansiyon</th>
                    <th style={{ padding: '6px 8px', fontWeight: 700 }}>Nabız</th>
                    <th style={{ padding: '6px 8px', fontWeight: 700 }}>SpO₂</th>
                    <th style={{ padding: '6px 8px', fontWeight: 700 }}>Kilo</th>
                  </tr>
                </thead>
                <tbody>
                  {tarihler.slice().reverse().map((d) => {
                    const bp = bul(t.tansiyon, d); const nb = bul(t.nabiz, d); const sp = bul(t.spo2, d); const kl = bul(t.kilo, d)
                    return (
                      <tr key={d} style={{ borderTop: '1px solid var(--sg-line)' }}>
                        <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>{uzunTarih(d)}</td>
                        <td style={{ padding: '8px' }}>{bp ? `${bp.sistolik}/${bp.diastolik}` : '—'}</td>
                        <td style={{ padding: '8px' }}>{nb ? trDeger(nb.deger, 0) : '—'}</td>
                        <td style={{ padding: '8px' }}>{sp ? `%${trDeger(sp.deger, 0)}` : '—'}</td>
                        <td style={{ padding: '8px' }}>{kl ? `${trDeger(kl.deger, 1)} kg` : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </SoftPanel>
        </>
      )}
    </div>
  )
}
