'use client'
/**
 * NOTYA-ILETISIM-01 — THE one send button for patient messages, everywhere (hasta dosyası, randevu,
 * Hatırlatma, aşı listesi, kohort panelleri, Hazır mesajlar).
 *
 * Given a patient and a message type it prepares the text on the server and offers the natural
 * channel: WhatsApp (phone + consent) and E-posta (email + consent). Tapping opens the SENDER'S OWN
 * WhatsApp / mail on this device with everything filled in; the human taps send there. Then it asks
 * "Gönderildi mi?" — Evet writes the log (and closes the queue item / marks the reminder).
 *
 * • Remembers the last channel per patient (server log + this device).
 * • iOS Safari popup-safe: the link is built before the tap; the tap opens it synchronously.
 * • No consent → "Hasta iletişim izni vermedi" + one-tap "İzin alındı olarak işaretle" (who + when recorded).
 * • Emails open where this device prefers (Ayarlar › İletişim); if nothing opened, Gmail / Outlook are one tap away.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { epostaLinki, whatsappLinki } from '@/lib/iletisim/baglantilar'
import { kanalAciklamasi, kanalDurumu, onerilenKanal, type IzinDegeri } from '@/lib/iletisim/izin'
import {
  IletisimHatasi, baglantiyiAc, cihazEpostaAcilisi, cihazEpostaAcilisiniKaydet, cihazSonKanal, cihazSonKanaliKaydet, iletisimIstek,
} from '@/lib/iletisim/istemci'
import { KANAL_ETIKETI, TUR_ETIKETI, type EpostaAcilis, type IletisimKanali, type MesajTuru } from '@/lib/iletisim/tipler'

export type GonderDugmesiProps = {
  tur: MesajTuru
  patientId?: string
  randevuId?: string
  asiId?: string
  kuyrukId?: string
  /** bilgi_formu / saglikim_baglanti: the link the page just created */
  link?: string
  /** serbest: the text the doctor wrote */
  metin?: string
  /** Button label when closed. */
  etiket?: string
  /** Full-size, already open (Hazır mesajlar flow). */
  tam?: boolean
  /** Start open (the page already chose the message, e.g. a randevu message type). */
  acikBaslat?: boolean
  /** Closed state as a quiet outline button (lists where every row has one). */
  sessiz?: boolean
  onGonderildi?: () => void
  /** Queue item that already left by itself from the doctor's own account (NOTYA-ILETISIM-04): nothing to send. */
  onKendiligindenGonderildi?: () => void
}

type Hazirlik = {
  tur: MesajTuru
  hasta: { id: string; ad: string; telefon: string; eposta: string; izinWhatsapp: IzinDegeri; izinEposta: IzinDegeri; izinKaydedilebilir: boolean }
  mesaj: { konu: string; metin: string } | null
  sonKanal: IletisimKanali | null
  randevuId: string | null
  asiId: string | null
  kuyrukId: string | null
  epostaAcilis: EpostaAcilis
}

const R = CHROME_RENK

/** Turkish suffixes are spelled out, not built: Gmail'de, Outlook'ta. */
const YENIDEN_AC: Record<EpostaAcilis, string> = {
  gmail: 'Gmail’de aç',
  outlook: 'Outlook’ta aç',
  uygulama: 'posta uygulamasında aç',
}

const anaDugme = (buyuk: boolean, pasif = false): React.CSSProperties => ({
  width: '100%', minHeight: buyuk ? 56 : 48, borderRadius: 14, border: 'none',
  background: pasif ? 'rgba(47,67,52,0.35)' : R.pine, color: R.paper,
  fontSize: buyuk ? 18 : 16, fontWeight: 700, fontFamily: CHROME_FONT.sans, cursor: pasif ? 'default' : 'pointer',
})
const sessizLink: React.CSSProperties = {
  background: 'none', border: 'none', padding: '6px 2px', color: R.pine, fontSize: 14, fontWeight: 600,
  cursor: 'pointer', fontFamily: CHROME_FONT.sans, textDecoration: 'underline', textUnderlineOffset: 3,
}
const ikincilDugme: React.CSSProperties = {
  flex: 1, minHeight: 48, borderRadius: 14, border: `1px solid ${R.border}`, background: R.paper, color: R.ink,
  fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: CHROME_FONT.sans,
}

export default function GonderDugmesi(p: GonderDugmesiProps) {
  const [acik, setAcik] = useState(!!p.tam || !!p.acikBaslat)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')
  const [v, setV] = useState<Hazirlik | null>(null)
  const [epostaAcilis, setEpostaAcilis] = useState<EpostaAcilis>('uygulama')
  const [acilan, setAcilan] = useState<IletisimKanali | null>(null)
  const [kayitId, setKayitId] = useState<string | null>(null)
  const [bitti, setBitti] = useState(false)
  const [izinIsaretleniyor, setIzinIsaretleniyor] = useState<IletisimKanali | null>(null)
  const [tamMetin, setTamMetin] = useState(false)

  const hazirla = useCallback(async () => {
    setYukleniyor(true); setHata(''); setAcilan(null); setKayitId(null); setBitti(false)
    try {
      const j = await iletisimIstek<Hazirlik>('/api/doktor/iletisim/hazirla', {
        method: 'POST',
        govde: { tur: p.tur, patientId: p.patientId, randevuId: p.randevuId, asiId: p.asiId, kuyrukId: p.kuyrukId, link: p.link, metin: p.metin },
      })
      setV(j)
      setEpostaAcilis(cihazEpostaAcilisi() || j.epostaAcilis || 'uygulama')
    } catch (e) {
      setV(null)
      if (e instanceof IletisimHatasi && e.durum === 410 && p.onKendiligindenGonderildi) { p.onKendiligindenGonderildi(); return }
      setHata(e instanceof Error ? e.message : 'Mesaj hazırlanamadı.')
    } finally {
      setYukleniyor(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.tur, p.patientId, p.randevuId, p.asiId, p.kuyrukId, p.link, p.metin])

  useEffect(() => { if (acik) void hazirla() }, [acik, hazirla])

  const hasta = v?.hasta
  const bilgi = hasta ? { telefon: hasta.telefon, eposta: hasta.eposta, izinWhatsapp: hasta.izinWhatsapp, izinEposta: hasta.izinEposta } : null
  const sonKanal = hasta ? cihazSonKanal(hasta.id) || v?.sonKanal || null : null
  const oneri = bilgi ? onerilenKanal(bilgi, sonKanal) : null
  const diger: IletisimKanali | null = oneri ? (oneri === 'whatsapp' ? 'eposta' : 'whatsapp') : null

  // Synchronous on purpose (iOS Safari): the link is already built, no await before opening it.
  const ac = (kanal: IletisimKanali, acilis?: EpostaAcilis) => {
    if (!v?.mesaj || !hasta) return
    const secilenAcilis = acilis || epostaAcilis
    const link = kanal === 'whatsapp'
      ? whatsappLinki(hasta.telefon, v.mesaj.metin)
      : epostaLinki(hasta.eposta, v.mesaj.konu, v.mesaj.metin, secilenAcilis)
    if (!link) { setHata(kanal === 'whatsapp' ? 'Telefon numarası anlaşılamadı.' : 'E-posta adresi anlaşılamadı.'); return }
    baglantiyiAc(link)
    cihazSonKanaliKaydet(hasta.id, kanal)
    if (acilis) { cihazEpostaAcilisiniKaydet(acilis); setEpostaAcilis(acilis) }
    setHata('')
    if (acilan === kanal && kayitId) return // re-opened the same message (e.g. in Gmail) — one log row
    setAcilan(kanal)
    setKayitId(null)
    void iletisimIstek<{ id: string | null }>('/api/doktor/iletisim/kayit', {
      method: 'POST',
      govde: { patientId: hasta.id, kanal, tur: v.tur, kuyrukId: v.kuyrukId, randevuId: v.randevuId },
    }).then((r) => setKayitId(r.id)).catch(() => { /* the message is already open; the log is best effort */ })
  }

  const gonderildi = async () => {
    if (!v || !hasta) return
    try {
      await iletisimIstek('/api/doktor/iletisim/kayit', {
        method: 'PATCH',
        govde: { id: kayitId, patientId: hasta.id, tur: v.tur, kuyrukId: v.kuyrukId, randevuId: v.randevuId, asiId: v.asiId },
      })
    } catch { /* still done for the human; the queue will re-check the source next time */ }
    setBitti(true)
    setAcilan(null)
    p.onGonderildi?.()
  }

  const izinIsaretle = async (kanal: IletisimKanali) => {
    if (!hasta) return
    setIzinIsaretleniyor(kanal); setHata('')
    try {
      await iletisimIstek('/api/doktor/iletisim/izin', { method: 'POST', govde: { patientId: hasta.id, kanal, izin: true, kaynak: 'gonder_dugmesi' } })
      setV((o) => (o ? { ...o, hasta: { ...o.hasta, [kanal === 'whatsapp' ? 'izinWhatsapp' : 'izinEposta']: true } } : o))
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'İzin kaydedilemedi.')
    } finally {
      setIzinIsaretleniyor(null)
    }
  }

  if (!acik) {
    return (
      <button
        type="button"
        onClick={() => setAcik(true)}
        style={p.sessiz
          ? { minHeight: 40, padding: '0 14px', borderRadius: 10, border: `1px solid ${R.border}`, background: R.paper, color: R.pine, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: CHROME_FONT.sans }
          : { ...anaDugme(false), width: 'auto', minHeight: 44, padding: '0 18px', fontSize: 15 }}
      >
        {p.etiket || 'Hastaya gönder'}
      </button>
    )
  }

  const buyuk = !!p.tam
  const kanalSatiri = (kanal: IletisimKanali) => {
    if (!bilgi || !hasta) return null
    const d = kanalDurumu(bilgi, kanal)
    if (d === 'hazir') return null
    return (
      <div key={kanal} style={{ fontSize: 14, color: R.muted, lineHeight: 1.5, padding: '6px 0' }}>
        <strong style={{ color: R.ink, fontWeight: 600 }}>{KANAL_ETIKETI[kanal]}:</strong> {kanalAciklamasi(d, kanal)}
        {d === 'izin_yok' && hasta.izinKaydedilebilir && (
          <>
            {' '}
            <button type="button" style={sessizLink} disabled={izinIsaretleniyor === kanal} onClick={() => void izinIsaretle(kanal)}>
              {izinIsaretleniyor === kanal ? 'Kaydediliyor…' : 'İzin alındı olarak işaretle'}
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div style={{
      background: R.paper, border: `1px solid ${R.border}`, borderRadius: 18, padding: buyuk ? 22 : 16,
      fontFamily: CHROME_FONT.sans, color: R.ink, maxWidth: buyuk ? 560 : 460, width: '100%', boxSizing: 'border-box',
    }}>
      {!buyuk && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            {hasta?.ad || 'Hasta'} <span style={{ color: R.muted, fontWeight: 500 }}>· {TUR_ETIKETI[p.tur]}</span>
          </div>
          <button type="button" style={{ ...sessizLink, textDecoration: 'none', color: R.muted }} onClick={() => setAcik(false)}>Kapat</button>
        </div>
      )}

      {yukleniyor && <div style={{ color: R.muted, fontSize: 15, padding: '8px 0' }}>Mesaj hazırlanıyor…</div>}
      {!yukleniyor && hata && <div style={{ color: R.warn, fontSize: 14, margin: '4px 0 10px' }}>{hata}</div>}
      {!yukleniyor && !v && hata && <button type="button" style={sessizLink} onClick={() => void hazirla()}>Yeniden dene</button>}

      {!yukleniyor && v && !v.mesaj && (
        <div style={{ color: R.muted, fontSize: 14 }}>Bu mesaj için gereken bilgi eksik (ör. randevu saati ya da bağlantı).</div>
      )}

      {!yukleniyor && v?.mesaj && !bitti && (
        <>
          <div
            onClick={() => setTamMetin(!tamMetin)}
            style={{
              whiteSpace: 'pre-wrap', fontSize: buyuk ? 16 : 14, lineHeight: 1.55, color: R.ink, background: R.cream,
              borderRadius: 12, padding: '12px 14px', marginBottom: 14, cursor: 'pointer',
              ...(tamMetin ? {} : { display: '-webkit-box', WebkitLineClamp: buyuk ? 5 : 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }),
            }}
            title={tamMetin ? 'Kısalt' : 'Tamamını gör'}
          >
            {v.mesaj.metin}
          </div>

          {acilan ? (
            <div>
              <div style={{ fontSize: buyuk ? 18 : 16, fontWeight: 700, marginBottom: 10 }}>Gönderildi mi?</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" style={{ ...anaDugme(buyuk), flex: 1 }} onClick={() => void gonderildi()}>Evet</button>
                <button type="button" style={ikincilDugme} onClick={() => setAcilan(null)}>Hayır</button>
              </div>
              {acilan === 'eposta' && (
                <div style={{ fontSize: 13, color: R.muted, marginTop: 10 }}>
                  E-posta açılmadıysa:{' '}
                  {(['gmail', 'outlook', 'uygulama'] as EpostaAcilis[]).filter((a) => a !== epostaAcilis).map((a, i) => (
                    <React.Fragment key={a}>
                      {i > 0 && ' · '}
                      <button type="button" style={{ ...sessizLink, fontSize: 13 }} onClick={() => ac('eposta', a)}>
                        {YENIDEN_AC[a]}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          ) : oneri ? (
            <div>
              <button type="button" style={anaDugme(buyuk)} onClick={() => ac(oneri)}>
                {oneri === 'whatsapp' ? 'WhatsApp ile gönder' : 'E-posta ile gönder'}
              </button>
              {diger && bilgi && kanalDurumu(bilgi, diger) === 'hazir' && (
                <div style={{ textAlign: 'center', marginTop: 6 }}>
                  <button type="button" style={sessizLink} onClick={() => ac(diger)}>
                    {diger === 'whatsapp' ? 'ya da WhatsApp ile gönder' : 'ya da e-posta ile gönder'}
                  </button>
                </div>
              )}
              {diger && kanalSatiri(diger)}
            </div>
          ) : (
            <div>
              {kanalSatiri('whatsapp')}
              {kanalSatiri('eposta')}
              {bilgi && kanalDurumu(bilgi, 'whatsapp') === 'adres_yok' && kanalDurumu(bilgi, 'eposta') === 'adres_yok' && (
                <div style={{ fontSize: 13, color: R.muted, marginTop: 4 }}>Telefon ya da e-posta hasta dosyasından eklenebilir.</div>
              )}
            </div>
          )}
        </>
      )}

      {bitti && (
        <div style={{ fontSize: buyuk ? 17 : 15, color: R.pine, fontWeight: 700, padding: '6px 0' }}>Gönderildi olarak kaydedildi.</div>
      )}
    </div>
  )
}
