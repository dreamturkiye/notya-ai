'use client'

import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import type { PhotoAsset, VisionRead } from '../schema'
import { analyzeImage, uzmanOnay, VISION_DISCLAIMER, type Actor } from '../imaging/vision-tools'
import { DERM_ACTOR, DERM_VISION_STATUS, DERM_VISION_TASK, dermLabel } from './labels'
import type { DermBelgeOzet } from '../engines/clinic-fit'
import { belgeDurumEtiket, belgeHekimOnayli } from '../engines/clinic-fit'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  padding: 16,
}

const btn: CSSProperties = {
  background: '#7C3AED',
  border: 'none',
  color: 'white',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
}

export function AsistanGorselPanel({
  reads,
  photos = [],
  actor = 'asistan',
  belgeOzet = [],
  onDraft,
  onOnay,
}: {
  reads: VisionRead[]
  photos?: PhotoAsset[]
  actor?: Actor
  belgeOzet?: DermBelgeOzet[]
  onDraft?: (r: VisionRead) => void
  onOnay?: (r: VisionRead) => void
}) {
  const [local, setLocal] = useState<VisionRead[]>(reads)

  const rows = useMemo(() => {
    const byId = new Map(local.map((r) => [r.id, r]))
    for (const r of reads) if (!byId.has(r.id)) byId.set(r.id, r)
    return [...byId.values()]
  }, [local, reads])

  function draftPhoto() {
    const ids = photos.map((p) => p.coreImageId)
    if (!ids.length) return
    const kind = photos.some((p) => p.kind.startsWith('dermoskopi')) ? 'dermoskopi_ipucu' : 'morfoloji'
    const drafted = analyzeImage({
      assetIds: ids.slice(0, 3),
      task: kind,
      actor,
      observations: '',
    })
    setLocal((prev) => [...prev, drafted])
    onDraft?.(drafted)
  }

  function approve(read: VisionRead) {
    const result = uzmanOnay(read, actor)
    if (!result.ok) return
    setLocal((prev) => prev.map((r) => r.id === read.id ? result.read : r))
    onOnay?.(result.read)
  }

  return (
    <section style={box} data-tab="AsistanGorselPanel" data-specialty="dermatoloji" data-disclaimer={VISION_DISCLAIMER}>
      <h2 style={{ margin: 0, fontSize: 16 }}>Asistan foto / dermoskopi taslağı</h2>
      <p style={{ fontSize: 12, color: '#C4B5FD', margin: '8px 0' }}>
        Tarama desteği, tanı değildir. Doktor onayı gerekir.
      </p>
      <button type="button" style={btn} onClick={draftPhoto} disabled={!photos.length}>
        Görüntü taslağı oluştur
      </button>
      {belgeOzet.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 12.5 }}>
          <div style={{ color: '#8FA0B5', marginBottom: 4 }}>Belgeler AI özeti (tanı değildir)</div>
          {belgeOzet.slice(0, 3).map((a) => (
            <div key={a.id} style={{ marginBottom: 4 }}>
              {belgeDurumEtiket(a.durum)}
              {belgeHekimOnayli(a.durum) ? ' · hekim onaylı' : ' · taslak'}
              {' — '}{a.ozet || 'Özet yok'}
            </div>
          ))}
        </div>
      )}
      <ul style={{ fontSize: 13, paddingLeft: 18 }}>
        {rows.map((r) => (
          <li key={r.id} style={{ marginBottom: 8 }}>
            {dermLabel(DERM_VISION_TASK, r.task)} · {dermLabel(DERM_VISION_STATUS, r.status)} · {dermLabel(DERM_ACTOR, r.drafted_by)}
            <div style={{ color: '#8FA0B5', fontSize: 12 }}>{r.observations}</div>
            {r.status === 'draft' && (
              <button
                type="button"
                style={{ ...btn, marginTop: 6, background: '#0F9B8E', opacity: actor === 'uzman' ? 1 : 0.45 }}
                disabled={actor !== 'uzman'}
                onClick={() => approve(r)}
              >
                Doktor onay
              </button>
            )}
          </li>
        ))}
        {rows.length === 0 && <li style={{ color: '#8FA0B5' }}>Taslak yok — Asistan kendi kaydını onaylayamaz.</li>}
      </ul>
    </section>
  )
}

export default AsistanGorselPanel
