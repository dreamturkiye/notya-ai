'use client'

import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import type { NstStudyPayload, UsgStudyPayload, VisionRead } from '../schema'
import { analyzeNst, analyzeUsg, uzmanOnay, VISION_DISCLAIMER, type Actor } from '../imaging/vision-tools'
import { NstStrip } from './NstStrip'
import { KD_ACTOR, KD_VISION_STATUS, KD_VISION_TASK, kdLabel } from './labels'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

const btn: CSSProperties = {
  background: '#0F9B8E',
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
  studies = [],
  nst,
  actor = 'asistan',
}: {
  reads: VisionRead[]
  studies?: UsgStudyPayload[]
  nst?: NstStudyPayload | null
  actor?: Actor
}) {
  const [local, setLocal] = useState<VisionRead[]>(reads)

  const rows = useMemo(() => {
    const byId = new Map(local.map((r) => [r.id, r]))
    for (const r of reads) if (!byId.has(r.id)) byId.set(r.id, r)
    return [...byId.values()]
  }, [local, reads])

  function draftUsg() {
    const ids = studies.map((s) => s.coreImageId).filter(Boolean)
    if (!ids.length) return
    const drafted = analyzeUsg({
      studyIds: ids.slice(0, 3),
      task: 'anomali_checklist',
      actor,
      findings: '',
    })
    setLocal((prev) => [...prev, drafted])
  }

  function draftNst() {
    if (!nst) return
    setLocal((prev) => [...prev, analyzeNst({ nst, actor, findings: '' })])
  }

  function approve(read: VisionRead) {
    const result = uzmanOnay(read, actor)
    if (!result.ok) return
    setLocal((prev) => prev.map((r) => r.id === read.id ? result.read : r))
  }

  return (
    <section style={box} data-tab="AsistanGorselPanel" data-specialty="kadin-dogum" data-disclaimer={VISION_DISCLAIMER}>
      <h2 style={{ margin: 0, fontSize: 16 }}>Asistan USG / NST taslağı</h2>
      <p style={{ fontSize: 12, color: '#FBBF24', margin: '8px 0' }}>
        Ölçüm ve tarama desteği, tanı değildir. Uzman onayı gerekir.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button type="button" style={btn} onClick={draftUsg} disabled={!studies.length}>
          USG taslağı oluştur
        </button>
        <button type="button" style={{ ...btn, background: '#1E3A5F' }} onClick={draftNst} disabled={!nst}>
          NST taslağı oluştur
        </button>
      </div>
      <ul style={{ fontSize: 13, paddingLeft: 18 }}>
        {rows.map((r) => (
          <li key={r.id} style={{ marginBottom: 8 }}>
            {kdLabel(KD_VISION_TASK, r.task)} · {kdLabel(KD_VISION_STATUS, r.status)} · {kdLabel(KD_ACTOR, r.drafted_by)}
            <div style={{ color: '#8FA0B5', fontSize: 12 }}>{r.findings}</div>
            {r.status === 'draft' && (
              <button
                type="button"
                style={{ ...btn, marginTop: 6, opacity: actor === 'uzman' ? 1 : 0.45 }}
                disabled={actor !== 'uzman'}
                onClick={() => approve(r)}
              >
                Uzman onay
              </button>
            )}
          </li>
        ))}
        {rows.length === 0 && <li style={{ color: '#8FA0B5' }}>Taslak yok — Asistan finalize edemez.</li>}
      </ul>
      {nst && <NstStrip nst={nst} />}
    </section>
  )
}

export default AsistanGorselPanel
