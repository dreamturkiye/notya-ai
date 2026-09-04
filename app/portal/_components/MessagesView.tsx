'use client'

import { useMemo, useState } from 'react'
import type { MessageFolder, PortalBundle, PortalMessage } from '@/lib/portal/types'
import { EmptyState, SectionHeader, SoftPanel, formatTrDate } from './ui'

export function MessagesView({ data }: { data: PortalBundle }) {
  const [folder, setFolder] = useState<MessageFolder>('gelen')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [threadOpen, setThreadOpen] = useState(false)

  const list = useMemo(
    () => data.messages.filter((m) => m.klasor === folder),
    [data.messages, folder]
  )
  const active: PortalMessage | null = useMemo(
    () => data.messages.find((m) => m.id === activeId) || (!threadOpen ? null : list[0]) || null,
    [data.messages, activeId, list, threadOpen]
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

  // Desktop: keep a selected thread; mobile list-first until tapped
  const desktopActive = active || list[0] || null
  const shown = threadOpen ? active || list[0] : desktopActive

  return (
    <div className="sg-fade">
      <SectionHeader title="Mesajlar" subtitle="Doktorunuz ve klinik ekibinizle güvenli yazışmalar." />
      <div className="sg-filter-row">
        {folders.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`sg-chip-btn${folder === f.key ? ' is-active' : ''}`}
            onClick={() => {
              setFolder(f.key)
              setActiveId(null)
              setThreadOpen(false)
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={`sg-msg-grid${threadOpen ? ' is-thread-open' : ''}`}>
        <SoftPanel className="sg-msg-list" style={{ padding: 0, overflow: 'hidden' }}>
          {list.length === 0 ? (
            <p style={{ margin: 0, padding: 18, color: 'var(--sg-muted)' }}>Bu klasör boş.</p>
          ) : (
            list.map((m) => {
              const selected = (activeId || (!threadOpen && desktopActive?.id)) === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setActiveId(m.id)
                    setThreadOpen(true)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    borderBottom: '1px solid var(--sg-line)',
                    background: selected ? 'var(--sg-accent-soft)' : 'transparent',
                    padding: '16px',
                    minHeight: 64,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong style={{ fontSize: 15, lineHeight: 1.35 }}>{m.konu}</strong>
                    {!m.okundu ? (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 99,
                          background: 'var(--sg-accent)',
                          marginTop: 6,
                          flex: '0 0 auto',
                        }}
                      />
                    ) : null}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--sg-muted)', marginTop: 4 }}>{m.gonderen}</div>
                  <div style={{ fontSize: 13, color: 'var(--sg-muted)', marginTop: 4, lineHeight: 1.4 }}>{m.ozet}</div>
                </button>
              )
            })
          )}
        </SoftPanel>

        <SoftPanel className="sg-msg-thread">
          {shown ? (
            <>
              <button
                type="button"
                className="sg-msg-mobile-back sg-back-link"
                onClick={() => setThreadOpen(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  marginBottom: 8,
                  cursor: 'pointer',
                }}
              >
                ← Gelen kutusu
              </button>
              <h2 className="sg-display" style={{ margin: '0 0 4px', fontSize: 'clamp(1.2rem, 4vw, 1.4rem)' }}>
                {shown.konu}
              </h2>
              <p style={{ margin: 0, color: 'var(--sg-muted)', fontSize: 13 }}>
                {shown.gonderen} · {formatTrDate(shown.tarih, true)}
              </p>
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {shown.mesajlar.map((msg) => (
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
                    <div style={{ fontSize: 15, lineHeight: 1.5 }}>{msg.metin}</div>
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
                  lineHeight: 1.45,
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
