'use client'

/**
 * Shared practice inbox — doktor + sekreter.
 * Hasta mesaj ekleri: gözlemle · Belgeler'e kaydet · mesajla birlikte sil.
 */
import React, { useCallback, useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme'
import IpucuBaloncugu from '@/components/doktor/IpucuBaloncugu'
import MesajEkViewer from '@/components/doktor/MesajEkViewer'
import { EKOKARDIYOGRAFI, ORTAK_BELGE_TURLERI } from '@/lib/doktor/belgeTurleri'
import { belgeEkoMi } from '@/lib/doktor/belgeTur'
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon'
import { MesajSayfaBasligi, MesajKartlari, MesajListeBos, MesajKonuListesi, MesajPanelBos, MesajPanelBasligi, MesajBalonlari, MesajBalonu, MesajBalonEylemi, MesajEkListesi, MesajEkKutusu, MesajYazmaKutusu, mesajEkDugmeStili } from '@/components/doktor/MesajlarGorunumu'

type Ek = {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  belgeId: string | null
}

type Thread = {
  id: string
  patientId: string
  hastaAdi: string
  konu: string
  sonMesajAt: string
  okundu: boolean
  ozet: string
  sonTaraf: string | null
}

type Msg = {
  id: string
  taraf: string
  metin: string
  tarih: string
  kimden: string
  ekler?: Ek[]
}

export default function DoktorMesajlarPage() {
  return (
    <Suspense fallback={null}>
      <DoktorMesajlarIcerik />
    </Suspense>
  )
}

function DoktorMesajlarIcerik() {
  const searchParams = useSearchParams()
  const [threads, setThreads] = useState<Thread[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [patientId, setPatientId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [threadMeta, setThreadMeta] = useState<{ konu: string; hastaAdi: string } | null>(null)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [viewer, setViewer] = useState<Ek | null>(null)
  const [kaydetEk, setKaydetEk] = useState<Ek | null>(null)
  const [kategori, setKategori] = useState<string>('Röntgen')
  const [busyEk, setBusyEk] = useState<string | null>(null)

  const authHeaders = useCallback(async () => {
    const t = await ensureDoctorAccessToken()
    if (!t) throw new Error('Oturum gerekli')
    return { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }
  }, [])

  const loadList = useCallback(async () => {
    const headers = await authHeaders()
    const res = await fetch('/api/doktor/mesajlar', { headers })
    const json = await res.json()
    if (!res.ok) throw new Error(json?.error || 'Yüklenemedi')
    setThreads(json.threads || [])
    setUnreadCount(json.unreadCount || 0)
  }, [authHeaders])

  const openThread = useCallback(
    async (id: string) => {
      setActiveId(id)
      setError(null)
      const headers = await authHeaders()
      const res = await fetch(`/api/doktor/mesajlar/${encodeURIComponent(id)}`, { headers })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Konu açılamadı')
      setThreadMeta({ konu: json.thread.konu, hastaAdi: json.thread.hastaAdi })
      setPatientId(json.thread.patientId || null)
      setMessages(json.messages || [])
      setThreads((prev) => {
        const wasUnread = prev.some((t) => t.id === id && !t.okundu)
        if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1))
        return prev.map((t) => (t.id === id ? { ...t, okundu: true } : t))
      })
    },
    [authHeaders]
  )

  useEffect(() => {
    ;(async () => {
      try {
        await loadList()
        const konuId = searchParams?.get('konu')
        if (konuId) await openThread(konuId)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Yüklenemedi')
      } finally {
        setLoading(false)
      }
    })()
  }, [loadList, openThread, searchParams])

  async function sendReply() {
    if (!activeId || !reply.trim()) return
    setSending(true)
    setError(null)
    try {
      const headers = await authHeaders()
      const res = await fetch(`/api/doktor/mesajlar/${encodeURIComponent(activeId)}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ metin: reply.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Yanıt gönderilemedi')
      setReply('')
      await openThread(activeId)
      await loadList()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yanıt gönderilemedi')
    } finally {
      setSending(false)
    }
  }

  async function mesajSil(mesajId: string) {
    if (!activeId) return
    if (!window.confirm('Bu mesaj ve ekleri silinsin mi?')) return
    setBusyEk(mesajId)
    setError(null)
    try {
      const headers = await authHeaders()
      const res = await fetch(`/api/doktor/mesajlar/${encodeURIComponent(activeId)}`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ mesajId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Silinemedi')
      if (json.konuSilindi) {
        setActiveId(null)
        setMessages([])
        setThreadMeta(null)
        await loadList()
      } else {
        await openThread(activeId)
        await loadList()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Silinemedi')
    } finally {
      setBusyEk(null)
    }
  }

  async function belgeyeKaydet() {
    if (!kaydetEk) return
    setBusyEk(kaydetEk.id)
    setError(null)
    try {
      const headers = await authHeaders()
      const res = await fetch(`/api/doktor/mesajlar/ek/${encodeURIComponent(kaydetEk.id)}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'belgeye-kaydet', category: kategori }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Kaydedilemedi')
      setKaydetEk(null)
      if (activeId) await openThread(activeId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydedilemedi')
    } finally {
      setBusyEk(null)
    }
  }

  return (
    <div>
      <MesajSayfaBasligi eyebrow="Doktor" baslik="Mesajlar" okunmamis={unreadCount} ipucu={<IpucuBaloncugu bolum="mesajlar" />}
        alt="Hasta portalı (Sağlığım) gelen kutusu — ekleri gözlemleyin, belgelere kaydedin veya mesajla silin." />

      {error ? <p style={{ color: CHROME_RENK.warn, fontSize: 14 }}>{error}</p> : null}
      {loading ? <p style={{ color: CHROME_RENK.muted }}>Yükleniyor…</p> : null}

      <MesajKartlari
        sol={!threads.length && !loading ? (
          /* YENI-DOKTOR-UX-2026-10: boş ekran bölümün ne olduğunu ve ilk adımı söyler. */
          <MesajListeBos baslik="Henüz mesaj yok">
            Hastalarınız Sağlığım portalından yazdığında mesajları burada görürsünüz. Bir hastaya portal erişimi vermek için{' '}
            <a href="/doktor-tools/hasta-portali" style={{ color: CHROME_RENK.pine, fontWeight: 700, textDecoration: 'none' }}>Araçlar › Hasta Portalı</a>'nı kullanın.
          </MesajListeBos>
        ) : (
          <MesajKonuListesi aktifId={activeId} onSec={(id) => { void openThread(id) }}
            konular={threads.map((t) => ({ id: t.id, baslik: t.konu, alt: t.hastaAdi, ozet: t.ozet, okunmamis: !t.okundu }))} />
        )}
        sag={!activeId ? (
          <MesajPanelBos>Bir konuşma seçin.</MesajPanelBos>
        ) : (
          <>
            <MesajPanelBasligi baslik={threadMeta?.konu}
              alt={<>
                {threadMeta?.hastaAdi}
                {patientId ? (
                  <>
                    {' · '}
                    <Link href={hastaDosyaHref(patientId, 'belgeler')} style={{ color: CHROME_RENK.pine, fontWeight: 700 }}>
                      Belgeler
                    </Link>
                  </>
                ) : null}
              </>} />
            <MesajBalonlari>
              {messages.map((m) => {
                const karsi = m.taraf === 'hasta'
                return (
                  <MesajBalonu key={m.id} karsi={karsi} kimden={m.kimden} metin={m.metin} zaman={new Date(m.tarih).toLocaleString('tr-TR')}
                    ekler={m.ekler?.length ? (
                      <MesajEkListesi>
                        {m.ekler.map((ek) => (
                          <MesajEkKutusu key={ek.id} karsi={karsi} ad={ek.fileName}>
                            <button type="button" style={mesajEkDugmeStili(karsi)} onClick={() => setViewer(ek)}>
                              Gözlemle
                            </button>
                            {ek.belgeId ? (
                              patientId ? (
                                <Link
                                  href={`/dashboard/doktor/hastalar/${encodeURIComponent(patientId)}/belgeler/${encodeURIComponent(ek.belgeId)}`}
                                  style={{ ...mesajEkDugmeStili(karsi), textDecoration: 'none' }}
                                >
                                  Belgelerde aç
                                </Link>
                              ) : (
                                <span style={{ fontSize: 12, opacity: 0.85 }}>Belgelere kaydedildi</span>
                              )
                            ) : (
                              <button type="button" style={mesajEkDugmeStili(karsi)} onClick={() => { setKaydetEk(ek); setKategori(tahminKategori(ek.fileName, ek.fileType)) }}>
                                Belgeler&apos;e kaydet
                              </button>
                            )}
                          </MesajEkKutusu>
                        ))}
                      </MesajEkListesi>
                    ) : null}
                    sag={<MesajBalonEylemi karsi={karsi} onClick={() => void mesajSil(m.id)} disabled={busyEk === m.id}>Sil</MesajBalonEylemi>} />
                )
              })}
            </MesajBalonlari>
            <MesajYazmaKutusu deger={reply} onDegis={setReply} yerTutucu="Yanıt yazın…" gonderMetni={sending ? 'Gönderiliyor…' : 'Yanıtla'}
              onGonder={sendReply} pasif={sending || !reply.trim()} soluk={sending || !reply.trim()} />
          </>
        )}
      />

      {viewer ? (
        <MesajEkViewer
          ekId={viewer.id}
          fileName={viewer.fileName}
          fileType={viewer.fileType}
          onClose={() => setViewer(null)}
        />
      ) : null}

      {kaydetEk ? (
        <div
          role="dialog"
          aria-label="Belgeler'e kaydet"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 70,
            background: 'rgba(20,16,12,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setKaydetEk(null)}
        >
          <div
            style={{ background: '#fff', borderRadius: 16, padding: 18, width: 'min(420px, 100%)', border: `1px solid ${CHROME_RENK.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Belgeler&apos;e kaydet</div>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: CHROME_RENK.muted }}>{kaydetEk.fileName}</p>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: CHROME_RENK.pine, marginBottom: 4 }}>Belge türü</label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 10, border: `1px solid ${CHROME_RENK.border}`, marginBottom: 14 }}
            >
              {ORTAK_BELGE_TURLERI.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => void belgeyeKaydet()}
                disabled={busyEk === kaydetEk.id}
                style={{ padding: '10px 16px', borderRadius: 999, border: 'none', background: CHROME_RENK.pine, color: '#FAF8F4', fontWeight: 700, cursor: 'pointer' }}
              >
                Kaydet
              </button>
              <button type="button" onClick={() => setKaydetEk(null)} style={{ padding: '10px 16px', borderRadius: 999, border: `1px solid ${CHROME_RENK.border}`, background: '#fff', cursor: 'pointer' }}>
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function tahminKategori(fileName: string, fileType: string): string {
  const n = `${fileName} ${fileType}`.toLocaleLowerCase('tr-TR')
  if (belgeEkoMi({ fileName, category: null })) return EKOKARDIYOGRAFI
  if (/ekg|ecg/.test(n)) return 'EKG'
  if (/rontgen|röntgen|x-?ray|xr|akci[gğ]er/.test(n)) return 'Röntgen'
  if (/lab|hemogram|kan|sonu[cç]/.test(n)) return 'Lab Sonucu'
  if (/usg|ultrason|ultrasound/.test(n)) return 'Görüntüleme Raporu'
  if (/epikriz/.test(n)) return 'Epikriz'
  if (/audio|ses|mp3|wav|m4a/.test(n)) return 'Muayene ses kaydı'
  if (/image|jpg|png|foto/.test(n)) return 'Muayene görüntüsü'
  return 'Diğer'
}
