'use client'

import { useEffect, useMemo, useState } from 'react'
import type { MessageFolder, PortalBundle, PortalMessage } from '@/lib/portal/types'
import { COMPOSE_DISCLAIMER } from '@/lib/portal/messageCopy'
import { EmptyState, SectionHeader, SoftPanel, formatTrDate } from './ui'

type Props = {
  data: PortalBundle
  /** Live portal token — enables real compose/send. Demo omits this. */
  token?: string
  onMessagesUpdated?: (messages: PortalMessage[]) => void
}

export function MessagesView({ data, token, onMessagesUpdated }: Props) {
  const [folder, setFolder] = useState<MessageFolder>('gelen')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [threadOpen, setThreadOpen] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [draftKonu, setDraftKonu] = useState('')
  const [draftMetin, setDraftMetin] = useState('')
  const [replyMetin, setReplyMetin] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [localMessages, setLocalMessages] = useState<PortalMessage[] | null>(null)

  const messages = localMessages || data.messages
  const canSend = Boolean(token)

  const list = useMemo(
    () => messages.filter((m) => m.klasor === folder),
    [messages, folder]
  )
  const active: PortalMessage | null = useMemo(
    () => messages.find((m) => m.id === activeId) || (!threadOpen ? null : list[0]) || null,
    [messages, activeId, list, threadOpen]
  )

  const folders: Array<{ key: MessageFolder; label: string }> = [
    { key: 'gelen', label: 'Gelen' },
    { key: 'gonderilen', label: 'Gönderilen' },
    { key: 'arsiv', label: 'Arşiv' },
  ]

  const desktopActive = active || list[0] || null
  const shown = threadOpen ? active || list[0] : desktopActive

  function applyMessages(next: PortalMessage[]) {
    setLocalMessages(next)
    onMessagesUpdated?.(next)
  }

  async function markRead(konuId: string) {
    const current = (localMessages || data.messages).find((m) => m.id === konuId)
    if (!current || current.okundu) return

    const optimistic = (localMessages || data.messages).map((m) =>
      m.id === konuId ? { ...m, okundu: true } : m
    )
    applyMessages(optimistic)

    if (!token) return
    try {
      const res = await fetch(`/api/portal/hasta/${encodeURIComponent(token)}/mesajlar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ konuId, action: 'read' }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && Array.isArray((json as { messages?: unknown }).messages)) {
        applyMessages((json as { messages: PortalMessage[] }).messages)
      }
    } catch {
      /* keep optimistic */
    }
  }

  useEffect(() => {
    if (!shown?.id || shown.okundu) return
    const mobileListOnly =
      typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches && !threadOpen
    if (mobileListOnly) return
    void markRead(shown.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown?.id, shown?.okundu, threadOpen])

  async function postMessage(payload: { konuId?: string; konu?: string; metin: string }) {
    if (!token) return
    setSending(true)
    setSendError(null)
    try {
      const res = await fetch(`/api/portal/hasta/${encodeURIComponent(token)}/mesajlar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Gönderilemedi')
      const next = (json.messages || []) as PortalMessage[]
      applyMessages(next)
      if (json.konuId) {
        setActiveId(json.konuId)
        setThreadOpen(true)
        setFolder('gonderilen')
      }
      setDraftKonu('')
      setDraftMetin('')
      setReplyMetin('')
      setComposeOpen(false)
    } catch (e) {
      setSendError(e instanceof Error ? e.message : 'Gönderilemedi')
    } finally {
      setSending(false)
    }
  }

  const empty = !messages.length

  return (
    <div className="sg-fade">
      <SectionHeader
        title="Mesajlar"
        subtitle="Doktorunuz ve klinik ekibinizle güvenli yazışmalar."
        action={
          canSend ? (
            <button
              type="button"
              className="sg-chip-btn is-active"
              onClick={() => {
                setComposeOpen(true)
                setThreadOpen(false)
              }}
            >
              Yeni mesaj
            </button>
          ) : null
        }
      />

      {composeOpen && canSend ? (
        <SoftPanel className="sg-compose-panel" style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 650, marginBottom: 10 }}>Yeni mesaj</div>
          <input
            value={draftKonu}
            onChange={(e) => setDraftKonu(e.target.value)}
            placeholder="Konu"
            className="sg-field"
          />
          <textarea
            value={draftMetin}
            onChange={(e) => setDraftMetin(e.target.value)}
            placeholder="Mesajınız…"
            rows={4}
            className="sg-field"
            style={{ marginTop: 8, resize: 'vertical', minHeight: 96 }}
          />
          <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--sg-muted)', lineHeight: 1.45 }}>
            {COMPOSE_DISCLAIMER}
          </p>
          {sendError ? (
            <p style={{ margin: '8px 0 0', color: 'var(--sg-warn)', fontSize: 13 }}>{sendError}</p>
          ) : null}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="sg-chip-btn is-active"
              disabled={sending || !draftMetin.trim()}
              onClick={() => postMessage({ konu: draftKonu.trim() || undefined, metin: draftMetin.trim() })}
            >
              {sending ? 'Gönderiliyor…' : 'Gönder'}
            </button>
            <button type="button" className="sg-chip-btn" onClick={() => setComposeOpen(false)}>
              Vazgeç
            </button>
          </div>
        </SoftPanel>
      ) : null}

      {empty && !composeOpen ? (
        <EmptyState
          title="Henüz mesaj yok"
          body={
            canSend
              ? 'Doktorunuza güvenli bir mesaj göndererek başlayabilirsiniz.'
              : 'Doktorunuz bir not paylaştığında veya size yazdığında burada görünecek.'
          }
        />
      ) : null}

      {!empty ? (
        <>
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
                        void markRead(m.id)
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                        <strong style={{ fontSize: 15, lineHeight: 1.35, overflowWrap: 'anywhere' }}>{m.konu}</strong>
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
                        className={`sg-bubble ${msg.taraf === 'hasta' ? 'sg-bubble-hasta' : 'sg-bubble-klinik'}`}
                      >
                        <div style={{ fontSize: 12, fontWeight: 650, color: 'var(--sg-accent)', marginBottom: 4 }}>
                          {msg.kimden}
                        </div>
                        <div>{msg.metin}</div>
                        <div style={{ fontSize: 11, color: 'var(--sg-muted)', marginTop: 6 }}>
                          {formatTrDate(msg.tarih, true)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {canSend ? (
                    <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--sg-line)' }}>
                      <textarea
                        value={replyMetin}
                        onChange={(e) => setReplyMetin(e.target.value)}
                        placeholder="Yanıt yazın…"
                        rows={3}
                        className="sg-field"
                        style={{ resize: 'vertical' }}
                      />
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--sg-muted)' }}>{COMPOSE_DISCLAIMER}</p>
                      {sendError ? (
                        <p style={{ margin: '8px 0 0', color: 'var(--sg-warn)', fontSize: 13 }}>{sendError}</p>
                      ) : null}
                      <button
                        type="button"
                        className="sg-chip-btn is-active"
                        style={{ marginTop: 10 }}
                        disabled={sending || !replyMetin.trim()}
                        onClick={() => postMessage({ konuId: shown.id, metin: replyMetin.trim() })}
                      >
                        {sending ? 'Gönderiliyor…' : 'Yanıtla'}
                      </button>
                    </div>
                  ) : (
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
                      Demo önizleme — gerçek gönderim için hasta portal linkinizi kullanın.
                    </div>
                  )}
                </>
              ) : (
                <p style={{ margin: 0, color: 'var(--sg-muted)' }}>Bir konuşma seçin.</p>
              )}
            </SoftPanel>
          </div>
        </>
      ) : null}
    </div>
  )
}
