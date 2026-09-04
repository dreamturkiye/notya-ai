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
          <h2 className="sg-display" style={{ fontSize: 20, margin: '8px 0 10px' }}>
            Aktif
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {aktif.map((m) => (
              <SoftPanel key={m.id}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{m.ad}</div>
                <div style={{ marginTop: 6, color: 'var(--sg-muted)', fontSize: 14 }}>
                  {m.doz} · {m.siklik}
                </div>
                <div style={{ marginTop: 8, fontSize: 13 }}>
                  Başlangıç: {formatTrDate(m.baslangic)}
                  {m.yazan ? ` · ${m.yazan}` : ''}
                </div>
                {m.not ? (
                  <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.45, color: 'var(--sg-ink)' }}>{m.not}</p>
                ) : null}
              </SoftPanel>
            ))}
          </div>

          {pasif.length > 0 ? (
            <>
              <h2 className="sg-display" style={{ fontSize: 20, margin: '28px 0 10px' }}>
                Sonlandırılan
              </h2>
              {pasif.map((m) => (
                <SoftPanel key={m.id} style={{ marginBottom: 10, opacity: 0.85 }}>
                  <div style={{ fontWeight: 700 }}>{m.ad}</div>
                  <div style={{ fontSize: 13, color: 'var(--sg-muted)', marginTop: 4 }}>
                    {m.baslangic}
                    {m.bitis ? ` → ${m.bitis}` : ''}
                  </div>
                </SoftPanel>
              ))}
            </>
          ) : null}
        </>
      )}

      <h2 className="sg-display" style={{ fontSize: 20, margin: '28px 0 10px' }}>
        Değişiklik geçmişi
      </h2>
      {!data.medicationHistory.length ? (
        <EmptyState title="Geçmiş boş" body="Doz değişiklikleri ve başlangıç/bitiş olayları burada listelenir." />
      ) : (
        <SoftPanel>
          {data.medicationHistory.map((h, i) => (
            <div
              key={h.id}
              style={{
                padding: '12px 0',
                borderTop: i === 0 ? 'none' : '1px solid var(--sg-line)',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--sg-accent)' }}>
                {formatTrDate(h.tarih)} · {h.tip.replace('_', ' ')}
              </div>
              <div style={{ fontWeight: 700, marginTop: 4 }}>{h.ilacAdi}</div>
              <div style={{ color: 'var(--sg-muted)', fontSize: 14, marginTop: 2 }}>{h.aciklama}</div>
            </div>
          ))}
        </SoftPanel>
      )}
    </div>
  )
}
