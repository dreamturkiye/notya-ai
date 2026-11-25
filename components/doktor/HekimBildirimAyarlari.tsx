'use client'
/**
 * HEKIM-PUSH (Kaan, 2026-11-25) — Ayarlar › Bildirimler: the doctor's own Sağlığım home-data notifications.
 *  - this browser on / off (+ the iOS "add to Home Screen" hint — Safari delivers web push only to a Home Screen web app)
 *  - per level: acil (default on, any hour; muting needs an explicit confirmation), hekime bildir (working hours),
 *    morning summary (held alerts, at the start of working hours)
 *  - working hours (default 08:00–20:00), optional quiet hours, the doctor's time zone
 *  - a test notification and a preview of what the lock screen shows (never a patient name, value, diagnosis or drug)
 * Core for every branş (one doctor app). `ornek` renders the page with example settings and no requests (internal demo /
 * screenshots).
 */
import { useEffect, useState, type CSSProperties } from 'react'
import { CHROME_RENK as R, CHROME_FONT as F } from '@/lib/doktor/chromeRenk'
import { doktorFetch } from '@/lib/doktor/oturumFetch'
import { BILDIRIM_API, buTarayiciAboneligi, hekimPushAc, hekimPushDurumu, hekimPushKapat, type HekimPushDurumu } from '@/lib/doktor/hekimPushIstemci'
import { VARSAYILAN_HEKIM_AYARI, hekimPushIcerigi, type HekimBildirimAyari } from '@/lib/saglikEvi/hekimBildirimKurallari'
import { UYARI_RENK } from '@/lib/saglikEvi/uyariRenkleri'
import { TonIkonu } from '@/components/doktor/saglikEvi/UyariIsareti'
import { saatSecenekleri } from '@/components/doktor/portal/saglikEvi/SaatSecici'

const kart: CSSProperties = { background: '#fff', border: `1px solid ${R.border}`, borderRadius: 18, padding: '18px 20px', boxShadow: '0 8px 18px rgba(58,44,34,0.045)', marginBottom: 14 }
const baslik: CSSProperties = { fontSize: 15, fontWeight: 700, margin: '0 0 4px', color: R.ink }
const kucuk: CSSProperties = { fontSize: 13, color: R.muted, lineHeight: 1.5, margin: 0 }
const girdi: CSSProperties = { minHeight: 40, borderRadius: 10, border: `1px solid rgba(58,44,34,0.18)`, padding: '0 10px', fontSize: 15, color: R.ink, background: '#fff', fontFamily: 'inherit' }
const btn: CSSProperties = { minHeight: 40, padding: '0 16px', borderRadius: 999, border: `1px solid ${R.border}`, background: '#f6f0e6', color: R.ink, font: `600 14px ${F.sans}`, cursor: 'pointer' }
const btnAna: CSSProperties = { ...btn, background: R.pine, borderColor: R.pine, color: '#faf6ee' }

const DURUM_METNI: Record<HekimPushDurumu, string> = {
  yukleniyor: 'Kontrol ediliyor…',
  acik: 'Bu cihazda bildirimler açık.',
  kapali: 'Bu cihazda bildirimler kapalı.',
  reddedildi: 'Bu tarayıcı bildirimleri engelliyor. Tarayıcının site ayarlarından izin verin, sonra yeniden deneyin.',
  desteklenmiyor: 'Bu tarayıcı web bildirimini desteklemiyor. Chrome, Edge, Firefox ya da ana ekrana eklenmiş Safari kullanın.',
  'ios-ana-ekran': 'iPhone ve iPad’de bildirim yalnız ana ekrana eklenmiş uygulamaya gelir.',
  yapilandirilmamis: 'Bildirim servisi bu sunucuda yapılandırılmamış.',
}

const SAAT_DILIMLERI = ['Europe/Istanbul', 'Europe/London', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Toronto', 'America/Vancouver', 'Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Perth', 'Pacific/Auckland', 'Asia/Tashkent', 'Asia/Baku', 'Asia/Dubai']

/** 24-hour picker (a native time input draws 08:00 AM on an English-set phone — PORTAL-REGRESYON lesson). */
function Saat({ deger, degistir, etiket, bos }: { deger: string | null; degistir: (v: string | null) => void; etiket: string; bos?: boolean }) {
  return (
    <select aria-label={etiket} style={{ ...girdi, minWidth: 96 }} value={deger ?? ''} onChange={(e) => degistir(e.target.value || null)}>
      {bos ? <option value="">—</option> : null}
      {saatSecenekleri(deger).map((x) => <option key={x} value={x}>{x}</option>)}
    </select>
  )
}

function Anahtar({ acik, degistir, etiket, ton }: { acik: boolean; degistir: (v: boolean) => void; etiket: string; ton?: string }) {
  return (
    <button type="button" role="switch" aria-checked={acik} aria-label={etiket} onClick={() => degistir(!acik)}
      style={{ all: 'unset', position: 'relative', width: 44, height: 26, borderRadius: 999, background: acik ? (ton || R.pine) : '#e4ddd1', cursor: 'pointer', flex: 'none', transition: 'background .2s ease' }}>
      <span style={{ position: 'absolute', top: 3, left: acik ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.2)', transition: 'left .2s ease' }} />
    </button>
  )
}

/** What the lock screen shows: generic words only. */
export function PushOnizleme({ icerik, saat = '08:42' }: { icerik: { baslik: string; govde: string }; saat?: string }) {
  return (
    <div data-testid="push-onizleme" style={{ display: 'grid', gridTemplateColumns: '38px 1fr auto', gap: 12, alignItems: 'start', background: 'rgba(250,246,238,0.92)', backdropFilter: 'blur(14px)', borderRadius: 20, padding: '12px 14px', boxShadow: '0 10px 30px -14px rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.6)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon-192.png" alt="" width={38} height={38} style={{ borderRadius: 9 }} />
      <span style={{ minWidth: 0 }}>
        <b style={{ display: 'block', fontSize: 14, color: '#1d1611' }}>{icerik.baslik}</b>
        <span style={{ display: 'block', fontSize: 14, color: '#2e251d', marginTop: 1 }}>{icerik.govde}</span>
      </span>
      <span style={{ fontSize: 12, color: '#6d6055' }}>{saat}</span>
    </div>
  )
}

export default function HekimBildirimAyarlari({ ornek }: { ornek?: boolean }) {
  const [ayar, setAyar] = useState<HekimBildirimAyari>({ ...VARSAYILAN_HEKIM_AYARI })
  const [vapid, setVapid] = useState<string | null>(ornek ? 'ornek' : null)
  const [durum, setDurum] = useState<HekimPushDurumu>(ornek ? 'acik' : 'yukleniyor')
  const [cihazSayisi, setCihazSayisi] = useState(ornek ? 2 : 0)
  const [mesaj, setMesaj] = useState<{ tur: 'ok' | 'hata'; metin: string } | null>(null)
  const [mesgul, setMesgul] = useState(false)
  const [acilOnay, setAcilOnay] = useState(false)
  const [yuklendi, setYuklendi] = useState(!!ornek)

  const yukle = async () => {
    if (ornek) return
    const sub = await buTarayiciAboneligi()
    const r = await doktorFetch(`${BILDIRIM_API}${sub ? `?endpoint=${encodeURIComponent(sub.endpoint)}` : ''}`, {})
    const j = await r.json().catch(() => ({})) as { ayar?: HekimBildirimAyari; vapidAcik?: string | null; abonelikSayisi?: number; error?: string }
    if (!r.ok) { setMesaj({ tur: 'hata', metin: j.error || 'Bildirim ayarları yüklenemedi.' }); return }
    setAyar(j.ayar || { ...VARSAYILAN_HEKIM_AYARI })
    setVapid(j.vapidAcik ?? null); setCihazSayisi(j.abonelikSayisi || 0)
    setDurum(await hekimPushDurumu(j.vapidAcik ?? null)); setYuklendi(true)
  }
  useEffect(() => { void yukle() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const kaydet = async (yeni: Partial<HekimBildirimAyari>) => {
    const birlesik = { ...ayar, ...yeni }
    setAyar(birlesik); setMesaj(null)
    if (ornek) return
    const r = await doktorFetch(BILDIRIM_API, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ayar: yeni }) })
    const j = await r.json().catch(() => ({})) as { error?: string }
    setMesaj(r.ok ? { tur: 'ok', metin: 'Kaydedildi.' } : { tur: 'hata', metin: j.error || 'Kaydedilemedi.' })
  }
  const cihazAc = async () => {
    if (!vapid || ornek) return
    setMesgul(true); setMesaj(null)
    const r = await hekimPushAc(vapid)
    setMesgul(false)
    if (!r.ok) setMesaj({ tur: 'hata', metin: r.hata })
    await yukle()
  }
  const cihazKapat = async () => { setMesgul(true); await hekimPushKapat(); setMesgul(false); await yukle() }
  const deneme = async () => {
    if (ornek) { setMesaj({ tur: 'ok', metin: 'Deneme bildirimi gönderildi.' }); return }
    const r = await doktorFetch(BILDIRIM_API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ islem: 'deneme' }) })
    const j = await r.json().catch(() => ({})) as { error?: string; gonderilen?: number }
    setMesaj(r.ok ? { tur: 'ok', metin: `Deneme bildirimi gönderildi (${j.gonderilen ?? 0} cihaz).` } : { tur: 'hata', metin: j.error || 'Gönderilemedi.' })
  }
  const tzListesi = [...new Set([ayar.saatDilimi, ...SAAT_DILIMLERI])]

  return (
    <div style={{ maxWidth: 720, fontFamily: F.sans, color: R.ink }} data-testid="hekim-bildirim-ayarlari">
      <section style={kart} aria-labelledby="hb-cihaz">
        <h2 id="hb-cihaz" style={baslik}>Bu cihaz</h2>
        <p style={kucuk}>{DURUM_METNI[durum]}{cihazSayisi ? ` Hesabınızda ${cihazSayisi} cihazda açık.` : ''}</p>
        {durum === 'ios-ana-ekran' || ornek ? (
          <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 14, background: '#f8f3ea', fontSize: 13.5, lineHeight: 1.55 }}>
            <b style={{ display: 'block', marginBottom: 2 }}>iPhone / iPad</b>
            Bildirimler yalnız ana ekrana eklenmiş Notya’ya gelir: Safari’de <b>Paylaş</b> › <b>Ana Ekrana Ekle</b>, sonra Notya’yı ana ekrandaki simgeden açıp bu sayfada “Bu cihazda aç”a dokunun (iOS 16.4 ve üstü).
          </div>
        ) : null}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
          {durum === 'kapali' ? <button type="button" style={btnAna} disabled={mesgul} onClick={cihazAc}>Bu cihazda aç</button> : null}
          {durum === 'acik' ? <button type="button" style={btn} disabled={mesgul} onClick={cihazKapat}>Bu cihazda kapat</button> : null}
          {cihazSayisi > 0 ? <button type="button" style={btn} onClick={deneme}>Deneme bildirimi gönder</button> : null}
        </div>
      </section>

      <section style={kart} aria-labelledby="hb-duzey">
        <h2 id="hb-duzey" style={baslik}>Ne zaman bildirilsin?</h2>
        <p style={{ ...kucuk, marginBottom: 6 }}>Sağlığım’dan gelen ev ölçümü ve ilaç uyarıları. Fısıltı ve Ev verisi kartı her durumda gösterir.</p>
        {([
          { k: 'acilAcik' as const, ton: 'acil' as const, ad: 'Acil ev ölçümü', alt: 'Hemen, günün her saatinde (sessiz saatler uygulanmaz). Hastaya 112 söylenmiştir.' },
          { k: 'bildirAcik' as const, ton: 'hekime_bildir' as const, ad: 'Hekime bildir uyarıları', alt: 'Çalışma saatlerinizde hemen; dışında sabah özetine bekletilir.' },
          { k: 'ozetAcik' as const, ton: null, ad: 'Sabah özeti', alt: 'Çalışma saatiniz başlarken tek bildirim: “3 hastadan 5 yeni ev uyarısı”.' },
        ]).map((x) => (
          <div key={x.k} style={{ display: 'grid', gridTemplateColumns: '22px 1fr auto', gap: 12, alignItems: 'center', padding: '12px 0', borderTop: `1px solid ${R.borderSoft}` }}>
            <span aria-hidden>{x.ton ? <TonIkonu ton={x.ton} boyut={18} /> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={R.pine} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="4.5" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" /></svg>}</span>
            <span><b style={{ display: 'block', fontSize: 14.5 }}>{x.ad}</b><span style={{ ...kucuk, display: 'block' }}>{x.alt}</span></span>
            <Anahtar acik={ayar[x.k]} etiket={x.ad} ton={x.ton === 'acil' ? UYARI_RENK.acil.vurgu : undefined} degistir={(v) => {
              if (x.k === 'acilAcik' && !v) { setAcilOnay(true); return }
              void kaydet({ [x.k]: v })
            }} />
          </div>
        ))}
        {acilOnay ? (
          <div role="alertdialog" aria-label="Acil bildirimleri kapat" style={{ marginTop: 8, padding: '12px 14px', borderRadius: 14, background: UYARI_RENK.acil.zemin, color: UYARI_RENK.acil.ana, fontSize: 13.5, lineHeight: 1.5 }}>
            Acil ev ölçümü bildirimlerini kapatırsanız bu uyarıları yalnız Fısıltı’da ve Ev verisi kartında görürsünüz. Emin misiniz?
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button type="button" style={{ ...btn, background: '#fff' }} onClick={() => setAcilOnay(false)}>Açık kalsın</button>
              <button type="button" style={{ ...btn, background: UYARI_RENK.acil.vurgu, color: '#fff', borderColor: UYARI_RENK.acil.vurgu }} onClick={() => { setAcilOnay(false); void kaydet({ acilAcik: false }) }}>Kapat</button>
            </div>
          </div>
        ) : null}
      </section>

      <section style={kart} aria-labelledby="hb-saat">
        <h2 id="hb-saat" style={baslik}>Çalışma saatleri</h2>
        <p style={{ ...kucuk, marginBottom: 10 }}>Kendi saat diliminizde. “Hekime bildir” uyarıları bu saatlerde gelir; sabah özeti başlangıçta gelir.</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
          <label style={{ display: 'grid', gap: 4, fontSize: 12.5, color: R.muted }}>Başlangıç<Saat etiket="Çalışma başlangıcı" deger={ayar.calismaBas} degistir={(v) => v && void kaydet({ calismaBas: v })} /></label>
          <label style={{ display: 'grid', gap: 4, fontSize: 12.5, color: R.muted }}>Bitiş<Saat etiket="Çalışma bitişi" deger={ayar.calismaBit} degistir={(v) => v && void kaydet({ calismaBit: v })} /></label>
          <label style={{ display: 'grid', gap: 4, fontSize: 12.5, color: R.muted }}>Saat dilimi
            <select style={girdi} value={ayar.saatDilimi} onChange={(e) => void kaydet({ saatDilimi: e.target.value })}>{tzListesi.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}</select>
          </label>
        </div>
        <h3 style={{ ...baslik, fontSize: 14, marginTop: 18 }}>Sessiz saatler <span style={{ fontWeight: 500, color: R.muted }}>(isteğe bağlı)</span></h3>
        <p style={{ ...kucuk, marginBottom: 10 }}>Çalışma saati içinde bile “hekime bildir” göndermeyin (ör. öğle arası). Acil bildirimler etkilenmez.</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
          <label style={{ display: 'grid', gap: 4, fontSize: 12.5, color: R.muted }}>Başlangıç<Saat bos etiket="Sessiz saat başlangıcı" deger={ayar.sessizBas} degistir={(v) => void kaydet({ sessizBas: v })} /></label>
          <label style={{ display: 'grid', gap: 4, fontSize: 12.5, color: R.muted }}>Bitiş<Saat bos etiket="Sessiz saat bitişi" deger={ayar.sessizBit} degistir={(v) => void kaydet({ sessizBit: v })} /></label>
          {ayar.sessizBas || ayar.sessizBit ? <button type="button" style={btn} onClick={() => void kaydet({ sessizBas: null, sessizBit: null })}>Kaldır</button> : null}
        </div>
      </section>

      <section style={kart} aria-labelledby="hb-gizlilik">
        <h2 id="hb-gizlilik" style={baslik}>Kilit ekranında ne görünür?</h2>
        <p style={{ ...kucuk, marginBottom: 12 }}>KVKK gereği bildirimde hasta adı, ölçüm değeri, tanı ya da ilaç yazmaz. Dokununca ilgili hastanın dosyası, Ev verisi › Uyarılar sekmesinde açılır (oturum açmanız gerekir).</p>
        <div style={{ display: 'grid', gap: 10, padding: 16, borderRadius: 18, background: 'linear-gradient(160deg, #2f4334, #4b5d4f)' }}>
          <PushOnizleme icerik={hekimPushIcerigi({ tur: 'acil', patientId: 'ornek', anahtar: 'ornek' })} saat="şimdi" />
          <PushOnizleme icerik={hekimPushIcerigi({ tur: 'ozet', hastaSayisi: 3, uyariSayisi: 5, gun: '2026-11-25' })} saat="08:00" />
        </div>
      </section>

      {mesaj ? <p role={mesaj.tur === 'hata' ? 'alert' : 'status'} style={{ fontSize: 13.5, color: mesaj.tur === 'hata' ? UYARI_RENK.acil.ana : '#2f6b4f', margin: '4px 2px' }}>{mesaj.metin}</p> : null}
      {!yuklendi && !mesaj ? <p style={kucuk}>Yükleniyor…</p> : null}
      <p style={{ ...kucuk, marginTop: 8 }}>WhatsApp / SMS ile hekim bildirimi henüz yok (onaylı şablon gerekiyor).</p>
    </div>
  )
}
