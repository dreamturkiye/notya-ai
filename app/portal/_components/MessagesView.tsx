'use client'

import { useMemo, useState } from 'react'
import type { MessageFolder, PortalBundle, PortalMessage } from '@/lib/portal/types'
import { EmptyState, SectionHeader, SoftPanel, formatTrDate } from './ui'

export function MessagesView({ data }: { data: PortalBundle }) {
  const [folder, setFolder] = useState<MessageFolder>('gelen')
  const [activeId, setActiveId] = useState<string | null>(null)

  const list = useMemo(
    () => data.messages.filter((m) => m.klasor === folder),
    [data.messages, folder]
  )
  const active: PortalMessage | null = useMemo(
    () => data.messages.find((m) => m.id === activeId) || list[0] || null,
    [data.messages, activeId, list]
  )

  if (!data.messages.length) {
    return (
      <>
        <SectionHeader title="Mesajlar" subtitle="Doktorunuz ve klinik ekibinizle güvenli yazışmalar." />
        <EmptyState
          title="Henüz mesaj yok"
          body="Doktorunuz bir not paylaştığında veya size yazdığında burada görünecek."
        />
      </>
    )
  }

  const folders: Array<{ key: MessageFolder; label: string }> = [
    { key: 'gelen', label: 'Gelen' },
    { key: 'gonderilen', label: 'Gönderilen' },
    { key: 'arsiv', label: 'Arşiv' },
  ]

  return (
    <div className="sg-fade">
      <SectionHeader title="Mesajlar" subtitle="Doktorunuz ve klinik ekibinizle güvenli yazışmalar." />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {folders.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => {
              setFolder(f.key)
              setActiveId(null)
            }}
            style={{
              border: 'none',
              cursor: 'pointer',
              padding: '8px 14px',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 13,
              background: folder === f.key ? 'var(--sg-accent)' : 'var(--sg-surface)',
              color: folder === f.key ? '#fff' : 'var(--sg-muted)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="sg-msg-grid">
        <SoftPanel style={{ padding: 0, overflow: 'hidden' }}>
          {list.length === 0 ? (
            <p style={{ margin: 0, padding: 18, color: 'var(--sg-muted)' }}>Bu klasör boş.</p>
          ) : (
            list.map((m) => {
              const selected = active?.id === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveId(m.id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    borderBottom: '1px solid var(--sg-line)',
                    background: selected ? 'var(--sg-accent-soft)' : 'transparent',
                    padding: '14px 16px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong style={{ fontSize: 14 }}>{m.konu}</strong>
                    {!m.okundu ? (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 99,
                          background: 'var(--sg-accent)',
                          marginTop: 5,
                          flex: '0 0 auto',
                        }}
                      />
                    ) : null}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--sg-muted)', marginTop: 4 }}>{m.gonderen}</div>
                  <div style={{ fontSize: 13, color: 'var(--sg-muted)', marginTop: 4 }}>{m.ozet}</div>
                </button>
              )
            })
          )}
        </SoftPanel>

        <SoftPanel>
          {active ? (
            <>
              <h2 className="sg-display" style={{ margin: '0 0 4px', fontSize: 22 }}>
                {active.konu}
              </h2>
              <p style={{ margin: 0, color: 'var(--sg-muted)', fontSize: 13 }}>
                {active.gonderen} · {formatTrDate(active.tarih, true)}
              </p>
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {active.mesajlar.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: msg.taraf === 'hasta' ? 'flex-end' : 'flex-start',
                      maxWidth: '92%',
                      padding: '12px 14px',
                      borderRadius: 14,
                      background: msg.taraf === 'hasta' ? 'var(--sg-accent-soft)' : 'rgba(28,43,36,0.04)',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sg-accent)', marginBottom: 4 }}>
                      {msg.kimden}
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.5 }}>{msg.metin}</div>
                    <div style={{ fontSize: 11, color: 'var(--sg-muted)', marginTop: 6 }}>
                      {formatTrDate(msg.tarih, true)}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: 18,
                  paddingTop: 14,
                  borderTop: '1px solid var(--sg-line)',
                  color: 'var(--sg-muted)',
                  fontSize: 13,
                }}
              >
                Yanıt yazma (demo): mesajlaşma API’si sonraki sürümde bağlanacak.
              </div>
            </>
          ) : (
            <p style={{ margin: 0, color: 'var(--sg-muted)' }}>Bir konuşma seçin.</p>
          )}
        </SoftPanel>
      </div>
    </div>
  )
}
