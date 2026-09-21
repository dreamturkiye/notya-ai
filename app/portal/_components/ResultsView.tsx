'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { PortalBundle, PortalResult, ResultKind } from '@/lib/portal/types'
import { imagingDisplayLabel } from '@/lib/doktor/imagingModalities'
import { EmptyState, ListRow, SectionHeader, SoftPanel, formatTrDate } from './ui'

function modalityLabel(raw?: string | null) {
  if (!raw) return 'Görüntüleme'
  return imagingDisplayLabel(raw, 'patient')
}

/** Imaging-style results (anything that isn't a lab panel) may carry a file. */
function isImagingKind(tur: ResultKind) {
  return tur !== 'laboratuvar'
}

/**
 * `tur` is stored as an ASCII slug ('goruntuleme', 'diger'). Rendering it raw and
 * letting CSS uppercase it printed "GORUNTULEME" / "DIGER" to patients, i.e.
 * Turkish words with the diacritics filed off. Always label through this map.
 */
const KIND_LABEL: Record<ResultKind, string> = {
  laboratuvar: 'Laboratuvar',
  goruntuleme: 'Görüntüleme',
  ekg: 'EKG',
  diger: 'Diğer',
}

function kindLabel(tur: ResultKind) {
  return KIND_LABEL[tur] || 'Tetkik'
}

const FILTERS: Array<{ key: ResultKind | 'hepsi'; label: string }> = [
  { key: 'hepsi', label: 'Hepsi' },
  { key: 'laboratuvar', label: 'Laboratuvar' },
  { key: 'goruntuleme', label: 'Görüntüleme' },
  { key: 'ekg', label: 'EKG' },
  { key: 'diger', label: 'Diğer' },
]

function durumLabel(d: PortalResult['durum']) {
  switch (d) {
    case 'anormal':
      return { text: 'Dikkat', color: 'var(--sg-warn)' }
    case 'normal':
      return { text: 'Normal', color: 'var(--sg-ok)' }
    case 'beklemede':
      return { text: 'Beklemede', color: 'var(--sg-muted)' }
    default:
      return { text: 'Raporlandı', color: 'var(--sg-accent)' }
  }
}

export function ResultsListView({ basePath, data }: { basePath: string; data: PortalBundle }) {
  const [filter, setFilter] = useState<ResultKind | 'hepsi'>('hepsi')
  const list = useMemo(
    () => (filter === 'hepsi' ? data.results : data.results.filter((r) => r.tur === filter)),
    [data.results, filter]
  )

  return (
    <div className="sg-fade">
      <SectionHeader title="Test sonuçları" subtitle="Laboratuvar, görüntüleme ve diğer tetkikler." />
      <div className="sg-filter-row">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`sg-chip-btn${filter === f.key ? ' is-active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <HastaDisFilmYukle basePath={basePath} />
      {!list.length ? (
        <EmptyState art="sonuclar" title="Sonuç yok" body="Bu filtrede yayınlanmış sonuç bulunmuyor." />
      ) : (
        <SoftPanel className="sg-list-panel">
          {list.map((r) => {
            const d = durumLabel(r.durum)
            return (
              <ListRow
                key={r.id}
                href={`${basePath}/sonuclar/${r.id}`}
                meta={`${formatTrDate(r.tarih)} · ${kindLabel(r.tur)}`}
                title={r.baslik}
                detail={r.ozet}
                badge={<span style={{ color: d.color, fontWeight: 800 }}>{d.text}</span>}
              />
            )
          })}
        </SoftPanel>
      )}
    </div>
  )
}

function HastaDisFilmYukle({ basePath }: { basePath: string }) {
  const token = basePath.match(/\/portal\/hasta\/([^/]+)/)?.[1]
  const [tip, setTip] = useState('xr')
  const [dosya, setDosya] = useState<File | null>(null)
  const [mesaj, setMesaj] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  if (!token) return null

  const gonder = async () => {
    if (!dosya) { setMesaj('Dosya seçin.'); return }
    setYukleniyor(true)
    setMesaj('')
    const fd = new FormData()
    fd.set('file', dosya)
    fd.set('tip', tip)
    const r = await fetch(`/api/portal/hasta/${encodeURIComponent(token)}/goruntu`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    })
    const j = await r.json().catch(() => ({}))
    setYukleniyor(false)
    if (!r.ok) { setMesaj(j.error || 'Yüklenemedi'); return }
    setDosya(null)
    setMesaj('Dosya doktorunuza iletildi. Değerlendirme onaylanınca burada görünür.')
  }

  return (
    <SoftPanel style={{ marginBottom: 16, padding: 16 }}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>Dış film yükle</div>
      <p style={{ margin: '0 0 10px', color: 'var(--sg-muted)', fontSize: 14, lineHeight: 1.45 }}>
        Dışarıda çekilmiş bir filmi dosyanıza ekleyin. Doktorunuz görmeden sonuçlarda yayınlanmaz.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <select value={tip} onChange={(e) => setTip(e.target.value)} className="sg-chip-btn" style={{ padding: '8px 10px' }}>
          <option value="xr">Röntgen</option>
          <option value="ekg">EKG</option>
          <option value="goz">Göz</option>
          <option value="derm">Deri</option>
          <option value="mg">Mamografi</option>
          <option value="us">Ultrason</option>
        </select>
        <input type="file" accept={tip === 'us' ? 'image/*,.pdf,video/mp4,video/webm' : 'image/*,.pdf'} onChange={(e) => setDosya(e.target.files?.[0] || null)} />
        <button type="button" className="sg-chip-btn is-active" disabled={yukleniyor} onClick={() => void gonder()}>
          {yukleniyor ? 'Gönderiliyor…' : 'Gönder'}
        </button>
      </div>
      {mesaj && <p style={{ margin: '10px 0 0', fontSize: 13, color: /iletildi/.test(mesaj) ? 'var(--sg-ok)' : 'var(--sg-warn)' }}>{mesaj}</p>}
    </SoftPanel>
  )
}

export function ResultDetailView({
  basePath,
  result,
}: {
  basePath: string
  result: PortalResult | null
}) {
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    if (!fullscreen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [fullscreen])

  if (!result) {
    return (
      <>
        <SectionHeader title="Sonuç detayı" />
        <EmptyState art={false} title="Sonuç bulunamadı" body="Bu kayda erişilemiyor." />
        <Link href={`${basePath}/sonuclar`} className="sg-back-link" style={{ marginTop: 12 }}>
          ← Sonuçlara dön
        </Link>
      </>
    )
  }

  return (
    <div className="sg-fade">
      <Link href={`${basePath}/sonuclar`} className="sg-back-link">
        ← Sonuçlar
      </Link>
      <SectionHeader title={result.baslik} subtitle={`${formatTrDate(result.tarih)} · ${kindLabel(result.tur)}`} />

      {result.labSatirlari && result.labSatirlari.length > 0 ? (
        <SoftPanel>
          <div className="sg-lab-mobile">
            <div className="sg-lab-cards">
              {result.labSatirlari.map((row) => (
                <div key={row.test} className="sg-lab-card">
                  <div className="sg-lab-card-name">{row.test}</div>
                  <div className="sg-lab-card-row">
                    <span
                      className="sg-lab-value"
                      style={{
                        color: row.anormal ? 'var(--sg-warn)' : 'inherit',
                        fontWeight: row.anormal ? 800 : 700,
                      }}
                    >
                      {row.deger}
                      {row.birim ? <span className="sg-lab-unit">{row.birim}</span> : null}
                    </span>
                    <span style={{ color: 'var(--sg-muted)', textAlign: 'right' }}>Ref: {row.referans}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="sg-lab-desktop sg-lab-table-wrap">
            <table className="sg-lab-table">
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--sg-muted)', fontSize: 12 }}>
                  <th style={{ padding: '10px 8px' }}>Test</th>
                  <th style={{ padding: '10px 8px' }}>Değer</th>
                  <th style={{ padding: '10px 8px' }}>Referans</th>
                </tr>
              </thead>
              <tbody>
                {result.labSatirlari.map((row) => (
                  <tr key={row.test} style={{ borderTop: '1px solid var(--sg-line)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 700 }}>{row.test}</td>
                    <td
                      className="sg-lab-value"
                      style={{
                        padding: '12px 8px 12px 20px',
                        color: row.anormal ? 'var(--sg-warn)' : 'inherit',
                        fontWeight: row.anormal ? 800 : 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.deger}
                      {row.birim ? <span className="sg-lab-unit">{row.birim}</span> : null}
                    </td>
                    <td style={{ padding: '12px 8px', color: 'var(--sg-muted)', whiteSpace: 'nowrap' }}>
                      {row.referans}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SoftPanel>
      ) : null}

      {(result.gorselUrl || result.raporMetni || isImagingKind(result.tur)) && (
        <SoftPanel style={{ marginTop: 12, padding: 0, overflow: 'hidden' }}>
          {result.gorselUrl ? (
            <div className="sg-imaging-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.gorselUrl}
                alt={modalityLabel(result.modalite)}
                className="sg-imaging-img"
              />
              <div className="sg-imaging-actions">
                <a
                  href={result.gorselUrl}
                  download={`${(result.baslik || 'goruntuleme').replace(/\s+/g, '-').toLowerCase()}.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sg-chip-btn is-active"
                >
                  İndir
                </a>
                <button type="button" className="sg-chip-btn" onClick={() => setFullscreen(true)}>
                  Tam ekran
                </button>
              </div>
            </div>
          ) : null}
          {result.raporMetni ? (
            <div style={{ padding: '16px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--sg-muted)', marginBottom: 8 }}>
                {modalityLabel(result.modalite)}
              </div>
              <p className="sg-prose">{result.raporMetni}</p>
            </div>
          ) : null}
          {!result.gorselUrl && isImagingKind(result.tur) ? (
            <div style={{ padding: '16px', color: 'var(--sg-muted)', fontSize: 14, lineHeight: 1.5 }}>
              Görüntü dosyası paylaşılmadı. Görüntülerinizi istemek için doktorunuza yazabilirsiniz.
            </div>
          ) : null}
        </SoftPanel>
      )}

      {fullscreen && result.gorselUrl ? (
        <div
          className="sg-imaging-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${result.baslik} — tam ekran`}
          onClick={() => setFullscreen(false)}
        >
          <div className="sg-imaging-lightbox-bar" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="sg-chip-btn is-active" onClick={() => setFullscreen(false)}>
              ← Sonuca dön
            </button>
            <span className="sg-imaging-lightbox-title">{result.baslik}</span>
            <button
              type="button"
              className="sg-chip-btn sg-imaging-lightbox-close"
              aria-label="Kapat"
              onClick={() => setFullscreen(false)}
            >
              Kapat
            </button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.gorselUrl}
            alt={modalityLabel(result.modalite)}
            className="sg-imaging-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="sg-imaging-lightbox-hint">Çıkmak için «Sonuca dön», «Kapat» veya Esc</p>
        </div>
      ) : null}
    </div>
  )
}
