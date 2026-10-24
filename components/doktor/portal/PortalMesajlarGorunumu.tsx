'use client'

/**
 * The patient portal's messages (Türkiye: "Sağlığım" › Mesajlar) as a presentational view: the folders, the list of
 * conversations, the open conversation with its bubbles, the new-message box and the reply box. Türkiye's MessagesView
 * and every country's patient page draw THROUGH this. It holds only what the eye needs (which folder, which
 * conversation, the text being typed); sending, reading and the words are the container's. Needs `sagligim.css`.
 */
import React, { useEffect, useMemo, useState } from 'react'
import { DosyaSecDugmesi } from '@/components/core/DosyaSecDugmesi'
import { EmptyState, SectionHeader, SoftPanel } from './ui'

export type PortalMesajKlasoru = 'gelen' | 'gonderilen' | 'arsiv'

export type PortalMesajEkiG = { id: string; ad: string; boyut: string; href: string | null }
export type PortalMesajBalonu = { id: string; kimden: string; metin: string; tarih: string; taraf: 'doktor' | 'hasta' | 'klinik'; ekler?: PortalMesajEkiG[] }
export type PortalMesajKonusuG = {
  id: string
  klasor: PortalMesajKlasoru
  konu: string
  gonderen: string
  ozet: string
  tarih: string
  okundu: boolean
  mesajlar: PortalMesajBalonu[]
  /** Overrides `yanitlayabilir` for this conversation (a closed one cannot be answered). */
  yanitlayabilir?: boolean
  /** Said instead of the reply box where this conversation cannot be answered. */
  yanitYokNotu?: string
}

export type PortalMesajSozleri = {
  baslik: string
  altBaslik: string
  yeniMesaj: string
  konuYer: string
  mesajYer: string
  dosyaEkle: string
  ekBilgi: string
  kaldir: string
  uyari: string
  gonder: string
  gonderiliyor: string
  vazgec: string
  bosBaslik: string
  bosGovdeYazilabilir: string
  bosGovdeSalt: string
  klasorler: Array<{ key: PortalMesajKlasoru; label: string }>
  klasorBos: string
  geri: string
  yanitYer: string
  yanitla: string
  sec: string
  yanitYokNotu: string
  ac: string
}

export type PortalMesajGonderimi = { konuId?: string; konu?: string; metin: string; ekler: File[] }
/** null = sent; text = the error to show; { konuId } = sent, and this conversation is to be opened. */
export type PortalMesajSonucu = null | string | { konuId: string }

export function PortalMesajlarGorunumu({ s, mesajlar, yanitlayabilir, yeniMesajAcik = yanitlayabilir, ekler = true, ekAzami = 0, ekAccept = '', ust, onOku, onGonder, onEkHata }: {
  s: PortalMesajSozleri
  mesajlar: PortalMesajKonusuG[]
  /** Replies (and, with `yeniMesajAcik`, new messages) can be sent. */
  yanitlayabilir: boolean
  yeniMesajAcik?: boolean
  /** Files can be attached. */
  ekler?: boolean
  ekAzami?: number
  ekAccept?: string
  /** Drawn under the heading, before anything else (a country's "not for emergencies" notice). */
  ust?: React.ReactNode
  /** The patient looked at a conversation that has an unread message. */
  onOku: (id: string) => void
  onGonder: (g: PortalMesajGonderimi) => Promise<PortalMesajSonucu>
  /** The attachment limit was reached: the container words the error. */
  onEkHata?: (azami: number) => string
}) {
  const [folder, setFolder] = useState<PortalMesajKlasoru>(s.klasorler[0]?.key ?? 'gelen')
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

  const canSend = yanitlayabilir
  const messages = mesajlar

  const list = useMemo(() => messages.filter((m) => m.klasor === folder), [messages, folder])
  const active: PortalMesajKonusuG | null = useMemo(
    () => messages.find((m) => m.id === activeId) || (!threadOpen ? null : list[0]) || null,
    [messages, activeId, list, threadOpen]
  )

  const desktopActive = active || list[0] || null
  const shown = threadOpen ? active || list[0] : desktopActive

  function ekEkle(mevcut: File[], dosya: File | null, set: (f: File[]) => void) {
    if (!dosya) return
    if (mevcut.length >= ekAzami) {
      setSendError(onEkHata ? onEkHata(ekAzami) : null)
      return
    }
    set([...mevcut, dosya])
  }

  useEffect(() => {
    if (!shown?.id || shown.okundu) return
    const mobileListOnly = typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches && !threadOpen
    if (mobileListOnly) return
    onOku(shown.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown?.id, shown?.okundu, threadOpen])

  async function postMessage(payload: PortalMesajGonderimi) {
    setSending(true)
    setSendError(null)
    try {
      const sonuc = await onGonder(payload)
      if (typeof sonuc === 'string') { setSendError(sonuc); return }
      if (sonuc && 'konuId' in sonuc) {
        setActiveId(sonuc.konuId)
        setThreadOpen(true)
        setFolder('gonderilen')
      }
      setDraftKonu('')
      setDraftMetin('')
      setDraftEkler([])
      setReplyMetin('')
      setReplyEkler([])
      setComposeOpen(false)
    } finally {
      setSending(false)
    }
  }

  const empty = !messages.length
  const yanitAcik = shown ? (shown.yanitlayabilir ?? canSend) : false

  return (
    <div className="sg-fade">
      <SectionHeader
        title={s.baslik}
        subtitle={s.altBaslik}
        action={
          yeniMesajAcik ? (
            <button
              type="button"
              className="sg-chip-btn is-active"
              onClick={() => {
                setComposeOpen(true)
                setThreadOpen(false)
              }}
            >
              {s.yeniMesaj}
            </button>
          ) : null
        }
      />

      {ust}

      {composeOpen && yeniMesajAcik ? (
        <SoftPanel className="sg-compose-panel" style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 650, marginBottom: 10 }}>{s.yeniMesaj}</div>
          <input value={draftKonu} onChange={(e) => setDraftKonu(e.target.value)} placeholder={s.konuYer} className="sg-field" />
          <textarea
            value={draftMetin}
            onChange={(e) => setDraftMetin(e.target.value)}
            placeholder={s.mesajYer}
            rows={4}
            className="sg-field"
            style={{ marginTop: 8, resize: 'vertical', minHeight: 96 }}
          />
          {ekler ? (
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <DosyaSecDugmesi
                dosya={null}
                onSec={(f) => ekEkle(draftEkler, f, setDraftEkler)}
                accept={ekAccept}
                etiket={s.dosyaEkle}
                disabled={draftEkler.length >= ekAzami}
              />
              <span style={{ fontSize: 12, color: 'var(--sg-muted)' }}>{s.ekBilgi}</span>
            </div>
          ) : null}
          {draftEkler.length ? (
            <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13 }}>
              {draftEkler.map((f, i) => (
                <li key={`${f.name}-${i}`}>
                  {f.name}{' '}
                  <button type="button" className="sg-chip-btn" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => setDraftEkler((arr) => arr.filter((_, j) => j !== i))}>
                    {s.kaldir}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--sg-muted)', lineHeight: 1.45 }}>{s.uyari}</p>
          {sendError ? <p style={{ margin: '8px 0 0', color: 'var(--sg-warn)', fontSize: 13 }}>{sendError}</p> : null}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="sg-chip-btn is-active"
              disabled={sending || (!draftMetin.trim() && !draftEkler.length)}
              onClick={() => postMessage({ konu: draftKonu.trim() || undefined, metin: draftMetin.trim(), ekler: draftEkler })}
            >
              {sending ? s.gonderiliyor : s.gonder}
            </button>
            <button type="button" className="sg-chip-btn" onClick={() => setComposeOpen(false)}>
              {s.vazgec}
            </button>
          </div>
        </SoftPanel>
      ) : null}

      {empty && !composeOpen ? (
        <EmptyState art="mesajlar" title={s.bosBaslik} body={yeniMesajAcik ? s.bosGovdeYazilabilir : s.bosGovdeSalt} />
      ) : null}

      {!empty ? (
        <>
          <div className="sg-filter-row">
            {s.klasorler.map((f) => (
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
                <p style={{ margin: 0, padding: 18, color: 'var(--sg-muted)' }}>{s.klasorBos}</p>
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
                        if (!m.okundu) onOku(m.id)
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
                          <span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--sg-accent)', marginTop: 6, flex: '0 0 auto' }} />
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
                    style={{ border: 'none', background: 'transparent', padding: 0, marginBottom: 8, cursor: 'pointer' }}
                  >
                    {s.geri}
                  </button>
                  <h2 className="sg-display" style={{ margin: '0 0 4px', fontSize: 'clamp(1.2rem, 4vw, 1.4rem)' }}>
                    {shown.konu}
                  </h2>
                  <p style={{ margin: 0, color: 'var(--sg-muted)', fontSize: 13 }}>
                    {shown.gonderen} · {shown.tarih}
                  </p>
                  <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {shown.mesajlar.map((msg) => (
                      <div key={msg.id} className={`sg-bubble ${msg.taraf === 'hasta' ? 'sg-bubble-hasta' : 'sg-bubble-klinik'}`}>
                        <div style={{ fontSize: 12, fontWeight: 650, color: 'var(--sg-accent)', marginBottom: 4 }}>{msg.kimden}</div>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.metin}</div>
                        {msg.ekler?.length ? (
                          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {msg.ekler.map((ek) => (
                              <div
                                key={ek.id}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, background: 'rgba(10,122,138,0.08)', border: '1px solid rgba(10,122,138,0.2)', fontSize: 13 }}
                              >
                                <span aria-hidden>📎</span>
                                <span style={{ flex: 1, overflowWrap: 'anywhere' }}>
                                  {ek.ad}{' '}
                                  <span style={{ color: 'var(--sg-muted)', fontSize: 12 }}>({ek.boyut})</span>
                                </span>
                                {ek.href ? (
                                  <a href={ek.href} target="_blank" rel="noreferrer" className="sg-chip-btn" style={{ padding: '4px 10px', fontSize: 12 }}>
                                    {s.ac}
                                  </a>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <div style={{ fontSize: 11, color: 'var(--sg-muted)', marginTop: 6 }}>{msg.tarih}</div>
                      </div>
                    ))}
                  </div>

                  {yanitAcik ? (
                    <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--sg-line)' }}>
                      <textarea value={replyMetin} onChange={(e) => setReplyMetin(e.target.value)} placeholder={s.yanitYer} rows={3} className="sg-field" style={{ resize: 'vertical' }} />
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        {ekler ? (
                          <DosyaSecDugmesi
                            dosya={null}
                            onSec={(f) => ekEkle(replyEkler, f, setReplyEkler)}
                            accept={ekAccept}
                            etiket={s.dosyaEkle}
                            disabled={replyEkler.length >= ekAzami}
                          />
                        ) : null}
                        {replyEkler.map((f, i) => (
                          <span key={`${f.name}-${i}`} style={{ fontSize: 12 }}>
                            {f.name}{' '}
                            <button type="button" className="sg-chip-btn" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => setReplyEkler((arr) => arr.filter((_, j) => j !== i))}>
                              {s.kaldir}
                            </button>
                          </span>
                        ))}
                      </div>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--sg-muted)' }}>{s.uyari}</p>
                      {sendError ? <p style={{ margin: '8px 0 0', color: 'var(--sg-warn)', fontSize: 13 }}>{sendError}</p> : null}
                      <button
                        type="button"
                        className="sg-chip-btn is-active"
                        style={{ marginTop: 10 }}
                        disabled={sending || (!replyMetin.trim() && !replyEkler.length)}
                        onClick={() => postMessage({ konuId: shown.id, metin: replyMetin.trim(), ekler: replyEkler })}
                      >
                        {sending ? s.gonderiliyor : s.yanitla}
                      </button>
                    </div>
                  ) : (
                    <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--sg-line)', color: 'var(--sg-muted)', fontSize: 13, lineHeight: 1.45 }}>
                      {shown.yanitYokNotu ?? s.yanitYokNotu}
                    </div>
                  )}
                </>
              ) : (
                <p style={{ margin: 0, color: 'var(--sg-muted)' }}>{s.sec}</p>
              )}
            </SoftPanel>
          </div>
        </>
      ) : null}
    </div>
  )
}
