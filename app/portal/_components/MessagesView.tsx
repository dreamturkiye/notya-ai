'use client'

import { useEffect, useMemo, useState } from 'react'
import type { MessageFolder, PortalBundle, PortalMessage, PortalMesajEk } from '@/lib/portal/types'
import { COMPOSE_DISCLAIMER } from '@/lib/portal/messageCopy'
import { MESAJ_EK_ACCEPT, MESAJ_EK_AZAMI } from '@/lib/portal/mesajEk'
import { DosyaSecDugmesi } from '@/components/core/DosyaSecDugmesi'
import { EmptyState, SectionHeader, SoftPanel, formatTrDate } from './ui'
import { turkceHataMesaji } from '@/lib/turkce/dogrulamaMesaji'

type Props = {
  data: PortalBundle
  /** Live portal token — enables real compose/send. Demo omits this. */
  token?: string
  onMessagesUpdated?: (messages: PortalMessage[]) => void
}

function boyutuYaz(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function EkListesi({
  ekler,
  token,
}: {
  ekler?: PortalMesajEk[]
  token?: string
}) {
  if (!ekler?.length) return null
  return (
    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {ekler.map((ek) => {
        const href = token
          ? `/api/portal/hasta/${encodeURIComponent(token)}/mesajlar/ek/${encodeURIComponent(ek.id)}`
          : null
        return (
          <div
            key={ek.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 10,
              background: 'rgba(10,122,138,0.08)',
              border: '1px solid rgba(10,122,138,0.2)',
              fontSize: 13,
            }}
          >
            <span aria-hidden>📎</span>
            <span style={{ flex: 1, overflowWrap: 'anywhere' }}>
              {ek.fileName}{' '}
              <span style={{ color: 'var(--sg-muted)', fontSize: 12 }}>({boyutuYaz(ek.fileSize)})</span>
            </span>
            {href ? (
              <a href={href} target="_blank" rel="noreferrer" className="sg-chip-btn" style={{ padding: '4px 10px', fontSize: 12 }}>
                Aç
              </a>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export function MessagesView({ data, token, onMessagesUpdated }: Props) {
  const [folder, setFolder] = useState<MessageFolder>('gelen')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [threadOpen, setThreadOpen] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [draftKonu, setDraftKonu] = useState('')
  const [draftMetin, setDraftMetin] = useState('')
  const [draftEkler, setDraftEkler] = useState<File[]>([])
  const [replyMetin, setReplyMetin] = useState('')
  const [replyEkler, setReplyEkler] = useState<File[]>([])
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

  function ekEkle(mevcut: File[], dosya: File | null, set: (f: File[]) => void) {
    if (!dosya) return
    if (mevcut.length >= MESAJ_EK_AZAMI) {
      setSendError(`En fazla ${MESAJ_EK_AZAMI} dosya ekleyebilirsiniz.`)
      return
    }
    set([...mevcut, dosya])
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

  async function postMessage(payload: {
    konuId?: string
    konu?: string
    metin: string
    ekler: File[]
  }) {
    if (!token) return
    if (!payload.metin.trim() && !payload.ekler.length) {
      setSendError('Mesaj yazın veya dosya ekleyin.')
      return
    }
    setSending(true)
    setSendError(null)
    try {
      let res: Response
      if (payload.ekler.length) {
        const fd = new FormData()
        if (payload.konuId) fd.set('konuId', payload.konuId)
        if (payload.konu) fd.set('konu', payload.konu)
        fd.set('metin', payload.metin)
        for (const f of payload.ekler.slice(0, MESAJ_EK_AZAMI)) fd.append('ek', f)
        res = await fetch(`/api/portal/hasta/${encodeURIComponent(token)}/mesajlar`, {
          method: 'POST',
          credentials: 'include',
          body: fd,
        })
      } else {
        res = await fetch(`/api/portal/hasta/${encodeURIComponent(token)}/mesajlar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            konuId: payload.konuId,
            konu: payload.konu,
            metin: payload.metin,
          }),
        })
      }
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
      setDraftEkler([])
      setReplyMetin('')
      setReplyEkler([])
      setComposeOpen(false)
    } catch (e) {
      setSendError(turkceHataMesaji(e instanceof Error ? e.message : '') || 'Mesajınız gönderilemedi. Lütfen tekrar deneyin.')
    } finally {
      setSending(false)
    }
  }

  const empty = !messages.length

  return (
    <div className="sg-fade">
      <SectionHeader
        title="Mesajlar"
        subtitle="Doktorunuz ve klinik ekibinizle güvenli yazışmalar. Tetkik, görüntü ve raporları buradan ekleyebilirsiniz."
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
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <DosyaSecDugmesi
              dosya={null}
              onSec={(f) => ekEkle(draftEkler, f, setDraftEkler)}
              accept={MESAJ_EK_ACCEPT}
              etiket="Dosya ekle"
              disabled={draftEkler.length >= MESAJ_EK_AZAMI}
            />
            <span style={{ fontSize: 12, color: 'var(--sg-muted)' }}>
              PDF, Word, Excel, görüntü, ses, kısa video · en fazla {MESAJ_EK_AZAMI} · 4 MB
            </span>
          </div>
          {draftEkler.length ? (
            <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13 }}>
              {draftEkler.map((f, i) => (
                <li key={`${f.name}-${i}`}>
                  {f.name}{' '}
                  <button
                    type="button"
                    className="sg-chip-btn"
                    style={{ padding: '2px 8px', fontSize: 11 }}
                    onClick={() => setDraftEkler((arr) => arr.filter((_, j) => j !== i))}
                  >
                    Kaldır
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
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
              disabled={sending || (!draftMetin.trim() && !draftEkler.length)}
              onClick={() =>
                postMessage({
                  konu: draftKonu.trim() || undefined,
                  metin: draftMetin.trim(),
                  ekler: draftEkler,
                })
              }
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
          art="mesajlar"
          title="Henüz mesaj yok"
          body={
            canSend
              ? 'Doktorunuza güvenli bir mesaj göndererek başlayabilirsiniz. Tetkik ve görüntüleri de buradan ekleyin.'
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
                        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.metin}</div>
                        <EkListesi ekler={msg.ekler} token={token} />
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
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        <DosyaSecDugmesi
                          dosya={null}
                          onSec={(f) => ekEkle(replyEkler, f, setReplyEkler)}
                          accept={MESAJ_EK_ACCEPT}
                          etiket="Dosya ekle"
                          disabled={replyEkler.length >= MESAJ_EK_AZAMI}
                        />
                        {replyEkler.map((f, i) => (
                          <span key={`${f.name}-${i}`} style={{ fontSize: 12 }}>
                            {f.name}{' '}
                            <button
                              type="button"
                              className="sg-chip-btn"
                              style={{ padding: '2px 8px', fontSize: 11 }}
                              onClick={() => setReplyEkler((arr) => arr.filter((_, j) => j !== i))}
                            >
                              Kaldır
                            </button>
                          </span>
                        ))}
                      </div>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--sg-muted)' }}>{COMPOSE_DISCLAIMER}</p>
                      {sendError ? (
                        <p style={{ margin: '8px 0 0', color: 'var(--sg-warn)', fontSize: 13 }}>{sendError}</p>
                      ) : null}
                      <button
                        type="button"
                        className="sg-chip-btn is-active"
                        style={{ marginTop: 10 }}
                        disabled={sending || (!replyMetin.trim() && !replyEkler.length)}
                        onClick={() =>
                          postMessage({ konuId: shown.id, metin: replyMetin.trim(), ekler: replyEkler })
                        }
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
