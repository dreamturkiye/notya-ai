'use client'
/**
 * GOZ-PORTAL — Sağlığım › Gözlerim (hasta yüzü).
 * Yalnız doktorun girdiği tarih/rejim ve klinikte kaydedilen sayılar; hasta için yorum, tanı, referans bandı yok
 * (.cursor/skills/specialty-hasta-portali/SKILL.md — Göz). "Bugün damladım" işaretleri yalnız bu cihazda tutulur.
 */
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { PortalGoz } from '@/lib/portal/types'
import { HASTA_ACIL_METNI } from '@/specialties/goz-hastaliklari/engines/acil'
import { EmptyState, SectionHeader, SoftPanel } from './ui'

function uzunTarih(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}
function kisaTarih(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}
function gunAdi(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('tr-TR', { weekday: 'long' })
}
const sayiTr = (n: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: 1 })
/** Yerel gün (YYYY-MM-DD) — UTC değil; gece yarısından sonra işaret sıfırlanır. */
function yerelBugun(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const RENK_SAG = 'var(--sg-accent)'
const RENK_SOL = '#9a5b3a'

function Baslik({ children, ek }: { children: React.ReactNode; ek?: React.ReactNode }) {
  return (
    <div className="sg-goz-baslik">
      <h2>{children}</h2>
      {ek}
    </div>
  )
}

function Bos({ children }: { children: React.ReactNode }) {
  return <p className="sg-goz-bos">{children}</p>
}

/** Göz içi basınç (mmHg) — iki çizgi (sağ / sol), yalnız kaydedilen sayılar. Referans bandı ve etiket yok. */
function GibGrafik({ olcumler }: { olcumler: PortalGoz['olcumler'] }) {
  const noktalar = olcumler.filter((o) => o.gibSag != null || o.gibSol != null)
  if (noktalar.length < 2) return <Bos>Grafik için en az iki göz tansiyonu ölçümü gerekir.</Bos>
  const W = 360, H = 170, L = 34, R = 14, T = 16, B = 26
  const degerler = noktalar.flatMap((o) => [o.gibSag, o.gibSol]).filter((v): v is number => v != null)
  let min = Math.min(...degerler), max = Math.max(...degerler)
  const pay = Math.max(2, (max - min) * 0.2)
  min = Math.max(0, Math.floor(min - pay)); max = Math.ceil(max + pay)
  const x = (i: number) => L + (i / Math.max(1, noktalar.length - 1)) * (W - L - R)
  const y = (v: number) => T + (1 - (v - min) / (max - min || 1)) * (H - T - B)
  const seriler = [
    { ad: 'Sağ göz', renk: RENK_SAG, kesik: false, v: noktalar.map((o) => o.gibSag) },
    { ad: 'Sol göz', renk: RENK_SOL, kesik: true, v: noktalar.map((o) => o.gibSol) },
  ]
  const ticks = 4
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Göz tansiyonu ölçümleri, sağ ve sol göz" style={{ display: 'block' }}>
      {Array.from({ length: ticks + 1 }, (_, k) => {
        const v = min + ((max - min) * k) / ticks
        return (
          <g key={k}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--sg-line)" strokeWidth="1" />
            <text x={L - 6} y={y(v) + 3.5} textAnchor="end" fontSize="9.5" fill="var(--sg-muted)">{Math.round(v)}</text>
          </g>
        )
      })}
      {noktalar.map((o, i) => (
        <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === noktalar.length - 1 ? 'end' : 'middle'} fontSize="9.5" fill="var(--sg-muted)">{kisaTarih(o.tarih)}</text>
      ))}
      {seriler.map((s) => {
        const pts = s.v.map((v, i) => (v == null ? null : `${x(i)},${y(v)}`)).filter(Boolean) as string[]
        return (
          <g key={s.ad}>
            {pts.length > 1 && <polyline fill="none" stroke={s.renk} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.kesik ? '5 4' : undefined} points={pts.join(' ')} />}
            {s.v.map((v, i) => v == null ? null : (
              <circle key={i} cx={x(i)} cy={y(v)} r="4.5" fill="var(--sg-surface)" stroke={s.renk} strokeWidth="2.2">
                <title>{`${uzunTarih(noktalar[i].tarih)} · ${s.ad}: ${sayiTr(v)} mmHg`}</title>
              </circle>
            ))}
          </g>
        )
      })}
    </svg>
  )
}

function DamlaSatiri({ damla, anahtar }: { damla: PortalGoz['damlalar'][number]; anahtar: string }) {
  const [isaretli, setIsaretli] = useState(false)
  useEffect(() => {
    try { setIsaretli(window.localStorage.getItem(anahtar) === '1') } catch { /* private mode */ }
  }, [anahtar])
  const degistir = (v: boolean) => {
    setIsaretli(v)
    try { if (v) window.localStorage.setItem(anahtar, '1'); else window.localStorage.removeItem(anahtar) } catch { /* private mode */ }
  }
  return (
    <li className="sg-goz-damla">
      <div className="sg-goz-damla-ana">
        <div className="sg-goz-damla-ad">{damla.ad}</div>
        <div className="sg-goz-meta">{damla.goz} · {damla.siklik}{damla.baslangic ? ` · ${uzunTarih(damla.baslangic)} tarihinden beri` : ''}</div>
      </div>
      <label className={`sg-goz-check${isaretli ? ' is-on' : ''}`}>
        <input type="checkbox" checked={isaretli} onChange={(e) => degistir(e.target.checked)} />
        <span>Bugün damladım</span>
      </label>
    </li>
  )
}

export function GozlerimView({ goz, basePath, token }: { goz: PortalGoz | null; basePath: string; token: string }) {
  const [bugun, setBugun] = useState<string | null>(null)
  useEffect(() => { setBugun(yerelBugun()) }, [])

  const acil = (
    <div className="sg-goz-acil" role="note">
      <div className="sg-goz-acil-baslik">Acil durumda</div>
      <p>{HASTA_ACIL_METNI}</p>
    </div>
  )

  if (!goz) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Gözlerim" subtitle="Kontrol tarihleriniz, damlalarınız ve klinikte kaydedilen ölçümleriniz." />
        {acil}
        <EmptyState art="takip" title="Henüz paylaşılan göz takibi yok" body="Doktorunuz kontrol tarihi, damla veya ölçüm kaydettiğinde burada görünür." />
      </div>
    )
  }

  const planli = goz.islemler.filter((i) => i.durum === 'planli')
  const yapilan = goz.islemler.filter((i) => i.durum === 'yapildi').slice().reverse()
  const tabloSatirlari = goz.olcumler.slice().reverse()

  return (
    <div className="sg-fade">
      <SectionHeader title="Gözlerim" subtitle="Kontrol tarihleriniz, damlalarınız ve klinikte kaydedilen ölçümleriniz." />
      {acil}

      <SoftPanel className="sg-goz-panel">
        <Baslik>Sonraki kontrol</Baslik>
        {goz.sonrakiKontrol ? (
          <>
            <div className="sg-goz-tarih">{uzunTarih(goz.sonrakiKontrol.tarih)}</div>
            <div className="sg-goz-meta">{gunAdi(goz.sonrakiKontrol.tarih)} · {goz.sonrakiKontrol.neden}</div>
            {goz.sonrakiKontrol.dilatasyon && (
              <div className="sg-goz-ipucu">
                Göz bebeği büyütme damlası uygulanacak — muayeneden sonra birkaç saat araç kullanmamanız önerilir, yanınızda refakatçi olsun.
              </div>
            )}
          </>
        ) : (
          <Bos>Doktorunuzun planladığı bir kontrol tarihi henüz yok. Randevu için muayenehaneyi arayabilirsiniz.</Bos>
        )}
      </SoftPanel>

      <SoftPanel className="sg-goz-panel">
        <Baslik>Damlalarım</Baslik>
        {goz.damlalar.length ? (
          <>
            <ul className="sg-goz-liste">
              {goz.damlalar.map((d) => (
                <DamlaSatiri key={`${d.id}-${bugun}`} damla={d} anahtar={`sg-goz-damla:${token}:${bugun ?? ''}:${d.id}`} />
              ))}
            </ul>
            <p className="sg-goz-dipnot">
              Uyum hatırlatması: &quot;Bugün damladım&quot; işaretleri yalnız bu cihazda saklanır, doktorunuza gönderilmez ve her gün sıfırlanır.
              Damlanızı değiştirmeden veya bırakmadan önce doktorunuza danışın.
            </p>
          </>
        ) : (
          <Bos>Doktorunuzun kaydettiği bir damla rejimi yok.</Bos>
        )}
      </SoftPanel>

      <SoftPanel className="sg-goz-panel">
        <Baslik>Enjeksiyon / işlem tarihleri</Baslik>
        {goz.islemler.length ? (
          <>
            {planli.length > 0 && (
              <>
                <div className="sg-goz-alt">Planlanan</div>
                <ul className="sg-goz-liste">
                  {planli.map((i) => (
                    <li key={i.id} className="sg-goz-satir">
                      <div><div className="sg-goz-damla-ad">{uzunTarih(i.tarih)}</div><div className="sg-goz-meta">{i.ad} · {i.goz}</div></div>
                      <span className="sg-goz-rozet sg-goz-rozet--planli">Planlandı</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {yapilan.length > 0 && (
              <>
                <div className="sg-goz-alt">Yapılan (son 12 ay)</div>
                <ul className="sg-goz-liste">
                  {yapilan.map((i) => (
                    <li key={i.id} className="sg-goz-satir">
                      <div><div className="sg-goz-damla-ad">{uzunTarih(i.tarih)}</div><div className="sg-goz-meta">{i.ad} · {i.goz}</div></div>
                      <span className="sg-goz-rozet">Yapıldı</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        ) : (
          <Bos>Planlanmış ya da son 12 ayda yapılmış bir göz içi işlem kaydı yok.</Bos>
        )}
      </SoftPanel>

      <SoftPanel className="sg-goz-panel">
        <Baslik>Görme keskinliği ve göz tansiyonu</Baslik>
        {goz.olcumler.length ? (
          <>
            <div className="sg-goz-alt" style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <span>Göz tansiyonu (mmHg)</span>
              <span className="sg-goz-lejant"><span style={{ color: RENK_SAG }}>━</span> sağ <span style={{ color: RENK_SOL }}>┄</span> sol</span>
            </div>
            <GibGrafik olcumler={goz.olcumler} />
            <div className="sg-goz-tablo-wrap">
              <table className="sg-goz-tablo">
                <thead>
                  <tr>
                    <th rowSpan={2}>Tarih</th>
                    <th colSpan={2}>Görme keskinliği</th>
                    <th colSpan={2}>Göz tansiyonu</th>
                  </tr>
                  <tr>
                    <th>Sağ</th><th>Sol</th><th>Sağ</th><th>Sol</th>
                  </tr>
                </thead>
                <tbody>
                  {tabloSatirlari.map((o, i) => (
                    <tr key={`${o.tarih}-${i}`}>
                      <td style={{ whiteSpace: 'nowrap' }}>{uzunTarih(o.tarih)}</td>
                      <td>{o.vaSag ?? '—'}</td>
                      <td>{o.vaSol ?? '—'}</td>
                      <td>{o.gibSag != null ? sayiTr(o.gibSag) : '—'}</td>
                      <td>{o.gibSol != null ? sayiTr(o.gibSol) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="sg-goz-dipnot">Klinikte ölçüldüğü gibidir; değerlendirmeyi doktorunuz yapar.</p>
          </>
        ) : (
          <Bos>Klinikte kaydedilmiş bir görme keskinliği veya göz tansiyonu ölçümü henüz yok.</Bos>
        )}
      </SoftPanel>

      <SoftPanel className="sg-goz-panel">
        <Baslik ek={goz.goruntuler.length ? <Link href={`${basePath}/sonuclar`} className="sg-goz-link">Sonuçlar →</Link> : undefined}>Görüntülerim</Baslik>
        {goz.goruntuler.length ? (
          <ul className="sg-goz-liste">
            {goz.goruntuler.map((g) => (
              <li key={g.id} className="sg-goz-satir">
                <div>
                  <div className="sg-goz-damla-ad">Görüntünüz dosyanıza eklendi</div>
                  <div className="sg-goz-meta">{uzunTarih(g.tarih)} · {g.tur} · {g.goz}</div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Bos>Dosyanıza eklenmiş bir göz görüntüsü (OCT, göz dibi veya ön segment fotoğrafı) yok.</Bos>
        )}
        {goz.goruntuler.length > 0 && <p className="sg-goz-dipnot">Görüntülerinizi doktorunuz değerlendirir; sonucu muayenede sizinle konuşur.</p>}
      </SoftPanel>

      <p className="sg-goz-not">{goz.not}</p>
    </div>
  )
}
