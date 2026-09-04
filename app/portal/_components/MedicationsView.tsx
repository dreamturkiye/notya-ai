'use client'

import type { PortalBundle } from '@/lib/portal/types'
import { EmptyState, SectionHeader, SoftPanel, formatTrDate } from './ui'

export function MedicationsView({ data }: { data: PortalBundle }) {
  const aktif = data.medications.filter((m) => m.aktif)
  const pasif = data.medications.filter((m) => !m.aktif)

  return (
    <div className="sg-fade">
      <SectionHeader title="İlaçlarım" subtitle="Aktif reçeteler ve değişiklik geçmişi." />
      {!data.medications.length ? (
        <EmptyState title="İlaç kaydı yok" body="Doktorunuz paylaştığında aktif ilaçlarınız burada görünür." />
      ) : (
        <>
          <h2 className="sg-subhead">Aktif</h2>
          <div className="sg-stack">
            {aktif.map((m) => (
              <SoftPanel key={m.id}>
                <div className="sg-med-name">{m.ad}</div>
                <div style={{ marginTop: 6, color: 'var(--sg-muted)', fontSize: 14, lineHeight: 1.4 }}>
                  {m.doz} · {m.siklik}
                </div>
                <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.4, overflowWrap: 'anywhere' }}>
                  Başlangıç: {formatTrDate(m.baslangic)}
                  {m.yazan ? ` · ${m.yazan}` : ''}
                </div>
                {m.not ? <p className="sg-prose" style={{ marginTop: 10 }}>{m.not}</p> : null}
              </SoftPanel>
            ))}
          </div>

          {pasif.length > 0 ? (
            <>
              <h2 className="sg-subhead">Sonlandırılan</h2>
              <div className="sg-stack">
                {pasif.map((m) => (
                  <SoftPanel key={m.id} style={{ opacity: 0.88 }}>
                    <div className="sg-med-name" style={{ fontWeight: 700 }}>
                      {m.ad}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--sg-muted)', marginTop: 4 }}>
                      {m.baslangic}
                      {m.bitis ? ` → ${m.bitis}` : ''}
                    </div>
                  </SoftPanel>
                ))}
              </div>
            </>
          ) : null}
        </>
      )}

      <h2 className="sg-subhead">Değişiklik geçmişi</h2>
      {!data.medicationHistory.length ? (
        <EmptyState title="Geçmiş boş" body="Doz değişiklikleri ve başlangıç/bitiş olayları burada listelenir." />
      ) : (
        <SoftPanel>
          {data.medicationHistory.map((h, i) => (
            <div
              key={h.id}
              style={{
                padding: '14px 0',
                borderTop: i === 0 ? 'none' : '1px solid var(--sg-line)',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--sg-accent)', lineHeight: 1.35 }}>
                {formatTrDate(h.tarih)} · {h.tip.replace('_', ' ')}
              </div>
              <div className="sg-med-name" style={{ fontSize: 15, marginTop: 4 }}>
                {h.ilacAdi}
              </div>
              <div style={{ color: 'var(--sg-muted)', fontSize: 14, marginTop: 2, lineHeight: 1.45, overflowWrap: 'anywhere' }}>
                {h.aciklama}
              </div>
            </div>
          ))}
        </SoftPanel>
      )}
    </div>
  )
}
