'use client'
/**
 * HASTA-PORTALI-GUNLUK — Günlük Kayıt entry sheet: one reading in ~10 seconds. The last value is prefilled, big −/+
 * steppers (hold to repeat), the glucose context chip is pre-selected from the patient's habit / time of day, the time is
 * "Şimdi" unless changed. "Fotoğrafla gir" reads the device screen and shows the values for confirmation — nothing is
 * saved until the patient taps Kaydet. After saving, the rule engine's friendly note (if any) appears in place.
 */
import { useEffect, useRef, useState } from 'react'
import type { OlcumKarti } from '@/lib/saglikEvi/ozet'
import type { GlukozBaglami, UyariDuzeyi } from '@/lib/saglikEvi/tipler'
import { OLCUM_TANIMLARI } from '@/lib/saglikEvi/olcumler'
import type { SaglikEviSozleri } from '@/lib/saglikEvi/sozler'
import type { GunlukEylemleri } from './eylemler'
import { UyariKarti } from './UyariKarti'

function Sayac({ deger, ayarla, adim, ondalik, min, max, etiket, s }: { deger: string; ayarla: (v: string) => void; adim: number; ondalik: number; min: number; max: number; etiket: string; s: SaglikEviSozleri }) {
  const zaman = useRef<ReturnType<typeof setInterval> | null>(null)
  const degisim = (yon: number) => {
    const n = Number(String(deger).replace(',', '.'))
    const yeni = Math.min(max, Math.max(min, (Number.isFinite(n) ? n : min) + yon * adim))
    ayarla(yeni.toFixed(ondalik))
  }
  const bas = (yon: number) => { degisim(yon); zaman.current = setInterval(() => degisim(yon), 120) }
  const birak = () => { if (zaman.current) clearInterval(zaman.current); zaman.current = null }
  useEffect(() => birak, [])
  return (
    <div>
      <div className="sge-sayac">
        <button type="button" className="sge-sayac-btn" aria-label={`${etiket}: ${s.azalt}`} onPointerDown={() => bas(-1)} onPointerUp={birak} onPointerLeave={birak} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); degisim(-1) } }}>−</button>
        <input aria-label={etiket} inputMode={ondalik ? 'decimal' : 'numeric'} value={deger} onChange={(e) => ayarla(e.target.value.replace(/[^0-9.,]/g, ''))} onFocus={(e) => e.currentTarget.select()} />
        <button type="button" className="sge-sayac-btn" aria-label={`${etiket}: ${s.artir}`} onPointerDown={() => bas(1)} onPointerUp={birak} onPointerLeave={birak} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); degisim(1) } }}>+</button>
      </div>
      <div className="sge-sayac-etiket">{etiket}</div>
    </div>
  )
}

export function OlcumGirisi({ kart, s, eylemler, kapat }: { kart: OlcumKarti; s: SaglikEviSozleri; eylemler: GunlukEylemleri; kapat: () => void }) {
  const t = OLCUM_TANIMLARI[kart.tip]
  const [deger, setDeger] = useState(kart.onDeger.toFixed(t.ondalik))
  const [deger2, setDeger2] = useState(kart.onDeger2 != null ? String(Math.round(kart.onDeger2)) : '')
  const [baglam, setBaglam] = useState<GlukozBaglami | null>(kart.onBaglam)
  const [geri, setGeri] = useState<0 | 30 | 60 | 120>(0)
  const [durum, setDurum] = useState<'giris' | 'kaydediliyor' | 'tamam' | 'foto'>('giris')
  const [hata, setHata] = useState<string | null>(null)
  const [foto, setFoto] = useState(false)
  /** A blood-pressure photo also shows the pulse: saved together when the patient confirms. */
  const [ekNabiz, setEkNabiz] = useState<number | null>(null)
  const [notlar, setNotlar] = useState<Array<{ duzey: UyariDuzeyi; hastaMetni: string }>>([])
  const dosyaRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') kapat() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [kapat])

  const kaydet = async (ozel?: { deger: number; deger2: number | null }) => {
    setHata(null); setDurum('kaydediliyor')
    const r = await eylemler.olcumEkle({
      tip: kart.tip, deger: ozel ? ozel.deger : Number(String(deger).replace(',', '.')), deger2: ozel ? ozel.deger2 : kart.tip === 'kb' ? Number(deger2) : null,
      baglam, olcumAt: geri ? new Date(Date.now() - geri * 60_000).toISOString() : undefined, foto,
    })
    if (!r.ok) { setHata(r.hata); setDurum('giris'); return }
    let tum = r.uyarilar || []
    if (foto && ekNabiz != null) { const n = await eylemler.olcumEkle({ tip: 'nabiz', deger: ekNabiz, olcumAt: geri ? new Date(Date.now() - geri * 60_000).toISOString() : undefined, foto: true }); if (n.ok) tum = [...tum, ...(n.uyarilar || [])] }
    setNotlar(tum)
    setDurum('tamam')
    if (!tum.length) setTimeout(kapat, 1100)
  }

  const fotoSec = async (f: File | undefined) => {
    if (!f) { setDurum('giris'); return }
    setDurum('foto'); setHata(null)
    const r = await eylemler.fotoOku(f)
    if (!r.ok) { setHata(r.hata); setDurum('giris'); return }
    const o = r.oneriler.find((x) => x.tip === kart.tip) || r.oneriler[0]
    if (!o || r.okunamadi) { setHata(s.fotoOkunamadi); setDurum('giris'); return }
    if (o.tip !== kart.tip) { setHata(s.fotoOkunamadi); setDurum('giris'); return }
    setDeger(o.deger.toFixed(t.ondalik)); if (o.deger2 != null) setDeger2(String(o.deger2))
    setEkNabiz(kart.tip === 'kb' ? r.oneriler.find((x) => x.tip === 'nabiz')?.deger ?? null : null)
    setFoto(true); setDurum('giris')
  }

  const su = kart.tip === 'su'
  return (
    <div className="sge-perde" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) kapat() }}>
      <div className="sge-sayfa" role="dialog" aria-modal="true" aria-labelledby="sge-giris-baslik">
        <div className="sge-tutamak" aria-hidden />
        <div className="sge-sayfa-bas">
          <h2 id="sge-giris-baslik" className="sge-sayfa-baslik">{t.ad}</h2>
          <button type="button" className="sge-kapat" onClick={kapat} aria-label={s.kapat}>×</button>
        </div>

        {durum === 'tamam' ? (
          <div className="sge-kayit-tamam" role="status">
            <svg viewBox="0 0 84 84" aria-hidden><circle cx="42" cy="42" r="38" fill="#e2f2ef" /><path className="yol" d="M26 43l11 11 21-24" fill="none" stroke="#0f9b8e" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <p style={{ fontSize: 18, fontWeight: 600, margin: '6px 0 14px' }}>{s.kaydedildi}</p>
            {notlar.map((n, i) => <UyariKarti key={i} s={s} duzey={n.duzey} metin={n.hastaMetni} />)}
            {notlar.length ? <button type="button" className="sge-kaydet" onClick={kapat}>{s.kapat}</button> : null}
          </div>
        ) : durum === 'foto' ? (
          <div className="sge-kayit-tamam" role="status" aria-live="polite">
            <p style={{ fontSize: 17 }}>{s.fotoOkunuyor}</p>
          </div>
        ) : (
          <>
            {kart.tip === 'glukoz' ? (
              <div className="sge-cipler" role="group" aria-label={t.ad}>
                {(['aclik', 'tokluk2', 'yatmadan', 'rastgele'] as const).map((b) => (
                  <button key={b} type="button" className="sge-cip" aria-pressed={baglam === b} onClick={() => setBaglam(b)}>{s.baglam[b]}</button>
                ))}
              </div>
            ) : null}
            {su ? (
              <Sayac deger={deger} ayarla={setDeger} adim={1} ondalik={0} min={1} max={6} etiket={t.birim} s={s} />
            ) : kart.tip === 'kb' ? (
              <>
                <Sayac deger={deger} ayarla={setDeger} adim={1} ondalik={0} min={t.min} max={t.max} etiket={`${s.buyukTansiyon} · mmHg`} s={s} />
                <Sayac deger={deger2} ayarla={setDeger2} adim={1} ondalik={0} min={t.ikinci!.min} max={t.ikinci!.max} etiket={`${s.kucukTansiyon} · mmHg`} s={s} />
              </>
            ) : (
              <Sayac deger={deger} ayarla={setDeger} adim={t.adim} ondalik={t.ondalik} min={t.min} max={t.max} etiket={t.birim} s={s} />
            )}
            {foto ? <p className="sge-not" style={{ textAlign: 'center' }}>{s.fotoOneri}{ekNabiz != null ? ` · ${OLCUM_TANIMLARI.nabiz.ad} ${ekNabiz} ${OLCUM_TANIMLARI.nabiz.birim}` : ''}</p> : null}
            <div className="sge-cipler" role="group" aria-label="Zaman">
              {([0, 30, 60, 120] as const).map((dk) => (
                <button key={dk} type="button" className="sge-cip" aria-pressed={geri === dk} onClick={() => setGeri(dk)}>{dk === 0 ? s.zaman.simdi : dk === 30 ? s.zaman.y30 : dk === 60 ? s.zaman.y60 : s.zaman.y120}</button>
              ))}
            </div>
            {hata ? <p className="sge-hata" role="alert">{hata}</p> : null}
            <button type="button" className="sge-kaydet" onClick={() => kaydet()} disabled={durum === 'kaydediliyor'}>{durum === 'kaydediliyor' ? s.kaydediliyor : su ? s.bardakEkle : s.kaydet}</button>
            {!su ? (
              <>
                <button type="button" className="sge-btn sge-foto-btn" onClick={() => dosyaRef.current?.click()}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 8h3l1.6-2.5h6.8L17 8h3v11H4z" /><circle cx="12" cy="13.3" r="3.3" /></svg>
                  {s.fotoIleGir}
                </button>
                <input ref={dosyaRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => fotoSec(e.target.files?.[0])} />
              </>
            ) : null}
            <p className="sge-not" style={{ textAlign: 'center', marginTop: 12 }}>{s.acilDegil}</p>
          </>
        )}
      </div>
    </div>
  )
}
