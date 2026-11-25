'use client'
/**
 * HEKIM-PUSH (Kaan, 2026-11-25) — the one-time prompt on the Ev verisi card: "get acil home readings on your phone".
 * Shown only when push is configured, this browser is not subscribed yet, the doctor has not dismissed it and the browser
 * has not blocked notifications. One request (GET /api/doktor/bildirimler), cached for the browser session so opening the
 * next patient file adds nothing (performans-butcesi-koruma). Doctor only: a secretary's session gets 403 and sees nothing.
 */
import { useEffect, useState } from 'react'
import { CHROME_RENK as R, CHROME_FONT as F } from '@/lib/doktor/chromeRenk'
import { doktorFetch } from '@/lib/doktor/oturumFetch'
import { BILDIRIM_API, buTarayiciAboneligi, hekimPushAc, hekimPushDurumu, type HekimPushDurumu } from '@/lib/doktor/hekimPushIstemci'
import { UYARI_RENK } from '@/lib/saglikEvi/uyariRenkleri'
import { TonIkonu } from './UyariIsareti'

const ONBELLEK = 'notya-hekim-push-istem'

export function HekimPushIstemi() {
  const [goster, setGoster] = useState(false)
  const [vapid, setVapid] = useState<string | null>(null)
  const [durum, setDurum] = useState<HekimPushDurumu>('yukleniyor')
  const [mesgul, setMesgul] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  useEffect(() => {
    let iptal = false
    ;(async () => {
      try {
        if (sessionStorage.getItem(ONBELLEK) === 'gizle') return
        const sub = await buTarayiciAboneligi()
        const r = await doktorFetch(`${BILDIRIM_API}${sub ? `?endpoint=${encodeURIComponent(sub.endpoint)}` : ''}`, {})
        if (!r.ok) { sessionStorage.setItem(ONBELLEK, 'gizle'); return }
        const j = await r.json() as { vapidAcik: string | null; istemKapatildi: boolean; buCihaz: boolean | null }
        const d = await hekimPushDurumu(j.vapidAcik)
        if (iptal) return
        const uygun = !!j.vapidAcik && !j.istemKapatildi && !j.buCihaz && (d === 'kapali' || d === 'ios-ana-ekran')
        if (!uygun) sessionStorage.setItem(ONBELLEK, 'gizle')
        setVapid(j.vapidAcik); setDurum(d); setGoster(uygun)
      } catch { /* prompt is optional */ }
    })()
    return () => { iptal = true }
  }, [])
  if (!goster) return null
  const kapat = async () => {
    setGoster(false)
    try { sessionStorage.setItem(ONBELLEK, 'gizle') } catch { /* yok */ }
    await doktorFetch(BILDIRIM_API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ islem: 'istem-kapat' }) }).catch(() => null)
  }
  const ac = async () => {
    if (!vapid) return
    setMesgul(true); setHata(null)
    const r = await hekimPushAc(vapid)
    setMesgul(false)
    if (r.ok) { setGoster(false); try { sessionStorage.setItem(ONBELLEK, 'gizle') } catch { /* yok */ } } else setHata(r.hata)
  }
  return (
    <div role="region" aria-label="Ev verisi bildirimleri" data-testid="hekim-push-istemi" style={{ position: 'relative', display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap', background: '#f8f3ea', borderRadius: 16, padding: '14px 16px', margin: '-4px 0 18px', fontFamily: F.sans }}>
      <span style={{ flex: 'none', width: 34, height: 34, borderRadius: 12, display: 'grid', placeItems: 'center', background: UYARI_RENK.acil.zemin }}><TonIkonu ton="acil" boyut={18} /></span>
      <span style={{ flex: '1 1 260px', minWidth: 0 }}>
        <b style={{ display: 'block', fontSize: 14.5, color: R.ink }}>Acil ev ölçümlerini telefonunuza bildirelim mi?</b>
        <span style={{ display: 'block', fontSize: 13, color: R.muted, marginTop: 3, lineHeight: 1.45 }}>
          Acil eşik her saatte, “hekime bildir” uyarıları çalışma saatlerinizde gelir; gece biriken uyarılar sabah tek bildirimde toplanır. Kilit ekranında hasta adı, değer, tanı ya da ilaç görünmez.
          {durum === 'ios-ana-ekran' ? ' iPhone / iPad: önce Safari’de Paylaş › “Ana Ekrana Ekle” ile Notya’yı ana ekrana ekleyin, sonra oradan açın.' : ''}
        </span>
        {hata ? <span role="alert" style={{ display: 'block', fontSize: 13, color: UYARI_RENK.acil.ana, marginTop: 6 }}>{hata}</span> : null}
      </span>
      <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {durum === 'kapali' ? <button type="button" className="evv-btn evv-btn-ana" disabled={mesgul} onClick={ac}>Bildirimleri aç</button> : null}
        <a className="evv-btn" href="/dashboard/doktor/ayarlar/bildirimler" style={{ textDecoration: 'none' }}>Ayarlar</a>
        <button type="button" className="evv-bag" onClick={kapat}>Şimdi değil</button>
      </span>
    </div>
  )
}
