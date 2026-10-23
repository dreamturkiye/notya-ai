'use client'

/**
 * AU-CANLI-02 — the ASSISTANT PAGE (/asistan): the country kit's counterpart of Türkiye's app/asistan/page.tsx, with the
 * same layout and behaviour: persona column (desktop) and header, a conversation of bubbles (the assistant's on the left
 * with its initial, the doctor's on the right), the assistant's full answer written out as a bubble with its lists and
 * tables, a big microphone control with its status line, and a typed-question row under it. The history of the last 50
 * bubbles stays in this browser. The session lives in ./canliOturum.ts; the bubble order is Türkiye's own engine.
 *
 * FAIL CLOSED: until the server says yes (`hazir: true`) the page shows only the "not available" line — no microphone.
 * The pure view `AsistanGorunumu` renders in a plain test.
 */
import React, { useEffect, useRef, useState } from 'react'
import HafifMarkdown from '@/components/asistan/HafifMarkdown'
import { rolAdi } from '@/lib/ulke/arayuz'
import type { SohbetBalon } from '@/lib/ulke/asistan/balonlar'
import { Cerceve, Yukleniyor, useUygulama, YOL } from './Kabuk'
import { useCanliOturum, type CanliDurumu, type Hazir, type Metin } from './canliOturum'

const ETIKET: Record<CanliDurumu, 'baslat' | 'baglaniyor' | 'dinliyor' | 'konusuyor'> = { bosta: 'baslat', hata: 'baslat', baglaniyor: 'baglaniyor', dinliyor: 'dinliyor', konusuyor: 'konusuyor' }

function Mikrofon({ konusuyor, baglaniyor }: { konusuyor: boolean; baglaniyor: boolean }) {
  if (baglaniyor) return <span className="uza-as-donen" aria-hidden="true" />
  if (konusuyor) {
    return (
      <svg width="28" height="28" viewBox="0 0 30 24" aria-hidden="true">
        {[1, 8, 15, 22].map((x, i) => <rect key={x} className="uza-as-dalga" style={{ animationDelay: `${i * 0.1}s` }} x={x} y={i % 2 ? 5 : 3} width="4" height={i % 2 ? 14 : 18} rx="2" fill="currentColor" />)}
      </svg>
    )
  }
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2" width="6" height="11" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><line x1="12" y1="21" x2="12" y2="17" /><line x1="8" y1="21" x2="16" y2="21" />
    </svg>
  )
}

/** Pure view. */
export function AsistanGorunumu({ t, hazir, unvan, durum, balonlar, hata, bekliyor, girdi, onGirdi, onGonder, onBaslat, onBitir, onTemizle, geriHref }: {
  t: Metin; hazir: Hazir | null | undefined; unvan: string; durum: CanliDurumu; balonlar: readonly SohbetBalon[]
  hata: string | null; bekliyor: boolean; girdi: string; onGirdi: (g: string) => void; onGonder: () => void
  onBaslat: () => void; onBitir: () => void; onTemizle: () => void; geriHref: string
}) {
  const s = t.sayfa
  const sonRef = useRef<HTMLDivElement>(null)
  const kayanRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // Same as Türkiye: the empty idle screen stays at the top, a conversation follows its last bubble.
    if (balonlar.length === 0) { if (kayanRef.current) kayanRef.current.scrollTop = 0; return }
    sonRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [balonlar, bekliyor])

  if (hazir === undefined) return <p className="uza-bos" role="status">{t.baglaniyor}</p>
  if (hazir === null) return <p className="uza-bos" role="status" data-alan="asistan-yok">{s.yok}</p>

  const aktif = durum === 'baglaniyor' || durum === 'dinliyor' || durum === 'konusuyor'
  const durumYazisi = aktif ? t[ETIKET[durum]] : s.baslatIpucu
  const bas = hazir.kisaAd.slice(0, 1).toUpperCase()
  const Avatar = ({ boy }: { boy: number }) => <span className="uza-as-avatar" style={{ width: boy, height: boy, fontSize: Math.round(boy / 2.4) }} aria-hidden="true">{bas}</span>
  return (
    <section className="uza-as" data-alan="asistan-sayfa" data-durum={durum}>
      <aside className="uza-as-yan">
        <Avatar boy={150} />
        <p className="uza-as-ad">{hazir.ad}</p>
        <p className="uza-as-unvan">{unvan}</p>
        <p className="uza-as-durum"><span className="uza-as-nokta" data-durum={durum} />{durumYazisi}</p>
      </aside>
      <div className="uza-as-sohbet">
        <header className="uza-as-ust">
          <a href={geriHref} className="uza-as-geri" aria-label={s.geri}>‹</a>
          <div className="uza-as-baslik">
            <p className="uza-as-ad">{hazir.ad}</p>
            <p className="uza-as-unvan">{unvan}</p>
          </div>
          {balonlar.length > 0 ? <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" data-eylem="temizle" onClick={onTemizle}>{s.temizle}</button> : null}
        </header>
        <div className="uza-as-liste" ref={kayanRef} data-alan="asistan-canli-yazi">
          {balonlar.length === 0 && durum === 'bosta' && !bekliyor ? (
            <div className="uza-as-bos" data-alan="asistan-bos">
              <Avatar boy={112} />
              <p className="uza-as-ad">{hazir.ad}</p>
              <p className="uza-as-unvan">{unvan}</p>
              <p className="uza-as-ipucu">{s.bos}</p>
            </div>
          ) : null}
          {balonlar.map((b) => (
            <div key={b.id} className="uza-as-satir" data-rol={b.role === 'user' ? 'siz' : 'asistan'} data-gecici={b.gecici ? 'evet' : undefined}>
              {b.role === 'ai' ? <Avatar boy={28} /> : null}
              <div className="uza-as-balon">{b.role === 'ai' ? <HafifMarkdown metin={b.text} /> : b.text}</div>
            </div>
          ))}
          {durum === 'baglaniyor' || bekliyor ? (
            <div className="uza-as-satir" data-rol="asistan" data-alan="asistan-bekle" role="status" aria-label={s.dusunuyor}>
              <Avatar boy={28} />
              <div className="uza-as-balon uza-as-noktalar"><i /><i /><i /></div>
            </div>
          ) : null}
          <div ref={sonRef} />
        </div>
        <div className="uza-as-kontrol" role="group" aria-label={s.kontrol}>
          {hata ? <p role="alert" className="uza-as-hata" data-alan="asistan-canli-hata">{hata}</p> : null}
          <p className="uza-as-durum" aria-live="polite" data-alan="asistan-canli-durum">{aktif ? durumYazisi : ''}</p>
          <button type="button" className="uza-as-mik" data-eylem={aktif ? 'bitir' : 'baslat'} data-aktif={aktif ? 'evet' : undefined} aria-pressed={aktif}
            aria-label={aktif ? t.bitir : t.baslat} disabled={durum === 'baglaniyor'} onClick={aktif ? onBitir : onBaslat}>
            <Mikrofon konusuyor={durum === 'konusuyor'} baglaniyor={durum === 'baglaniyor'} />
          </button>
          <p className="uza-as-ipucu">{aktif ? s.bitirIpucu : s.baslatIpucu}</p>
        </div>
        <form className="uza-as-yazi" data-alan="asistan-yazili" onSubmit={(e) => { e.preventDefault(); onGonder() }}>
          <label className="uza-ekran-disi" htmlFor="uza-as-girdi">{s.yaziEtiketi}</label>
          <textarea id="uza-as-girdi" className="uza-as-girdi" rows={1} value={girdi} maxLength={4000} placeholder={s.yaziIpucu} disabled={bekliyor}
            onChange={(e) => onGirdi(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onGonder() } }} />
          <button type="submit" className="uza-dugme" disabled={bekliyor || !girdi.trim()}>{s.gonder}</button>
        </form>
        <p className="uza-ipucu uza-as-not" data-alan="asistan-canli-not">{t.not} {s.gecmisNotu}</p>
      </div>
    </section>
  )
}

export default function AsistanEkrani() {
  const u = useUygulama('asistan')
  const t = u.m.asistanCanli
  const o = useCanliOturum({ t, api: u.hesap ? u.api : undefined })
  const [girdi, setGirdi] = useState('')
  if (!u.hesap) return <Yukleniyor m={u.m} dil={u.dil} />
  return (
    <Cerceve dil={u.dil} m={u.m} ad={u.hesap.ad} unvan={rolAdi(u.hesap.rol, u.dil) ?? undefined} aktif="asistan" cikis={u.cikis}>
      {t ? (
        <AsistanGorunumu t={t} hazir={o.hazir} unvan={rolAdi(u.hesap.rol, u.dil) ?? ''} durum={o.durum} balonlar={o.balonlar} hata={o.hata} bekliyor={o.bekliyor}
          girdi={girdi} onGirdi={setGirdi} onGonder={() => { const q = girdi; setGirdi(''); void o.gonder(q) }}
          onBaslat={() => { void o.baslat() }} onBitir={() => { void o.bitir() }} onTemizle={o.temizle} geriHref={YOL.bugun} />
      ) : <p className="uza-bos" role="status">{u.m.kabuk.yukleniyor}</p>}
    </Cerceve>
  )
}
