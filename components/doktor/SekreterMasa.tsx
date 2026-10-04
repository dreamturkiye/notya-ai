'use client'
/**
 * NOTYA-SEKRETER-01 — Ön büro (sekreter / asistan) ana sayfası.
 *
 * Küçük muayenehane ön büro sistemlerinden (Hipokrat, E-Klinik, Vozo front-desk, NexOPD):
 * bugünün randevuları birincil yüzey; mesaj, gelen belge, hızlı randevu/hasta —
 * klinik KPI / e-reçete / ICD yok. Selam sekreterin kendi adıyla (Dr. yok).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CHROME_FONT, CHROME_RENK, gunKickerTRT } from '@/lib/doktor/chromeTheme'
import { ensureDoctorAccessToken, DOKTOR_GIRIS } from '@/lib/doktor/clientAuth'
import { tarayiciSaatDilimi } from '@/lib/doktor/selam'
import { hekimUnvanli } from '@/lib/doktor/hekimAdi'
import HazirMesajlar from '@/components/doktor/iletisim/HazirMesajlar'
import RandevuTalepleri from '@/components/doktor/randevu/RandevuTalepleri'
import GelenBelgelerKarti from '@/components/doktor/gelenBelgeler/GelenBelgelerKarti'
import OnBuroFisildiyor from '@/components/doktor/OnBuroFisildiyor'
import TakipPaneli from '@/components/doktor/TakipPaneli'

type RandevuSatir = {
  id: string
  baslangic: string
  hastaAdi: string
  tur: string
  durum: string
  patientId?: string | null
}

type MesajOzet = {
  id: string
  hastaAdi: string
  ozet: string
}

const TUR_ETIKET: Record<string, string> = {
  ilk_muayene: 'İlk muayene',
  muayene: 'Muayene',
  kontrol: 'Kontrol',
  diger: 'Diğer',
}

const DURUM: Record<string, { label: string; color: string; bg: string }> = {
  planlandi: { label: 'Bekliyor', color: CHROME_RENK.pine, bg: 'rgba(47,67,52,0.1)' },
  onaylandi: { label: 'Onaylı', color: '#3F7D4A', bg: 'rgba(63,125,74,0.12)' },
  tamamlandi: { label: 'Bitti', color: CHROME_RENK.muted, bg: 'rgba(139,125,112,0.14)' },
  iptal: { label: 'İptal', color: CHROME_RENK.warn, bg: 'rgba(164,91,62,0.12)' },
  gelmedi: { label: 'Gelmedi', color: '#B4832F', bg: 'rgba(180,131,47,0.12)' },
}

function trtGun(iso: string | Date): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
}
function trtSaat(iso: string): string {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })
}

function Ikon({ ad }: { ad: 'takvim' | 'hasta' | 'mesaj' | 'belge' | 'saat' }) {
  const o = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (ad === 'takvim') return <svg {...o}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></svg>
  if (ad === 'hasta') return <svg {...o}><circle cx="12" cy="8" r="3" /><path d="M5 20c1.2-3.5 3.5-5 7-5s5.8 1.5 7 5" /></svg>
  if (ad === 'mesaj') return <svg {...o}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 7 9-7" /></svg>
  if (ad === 'belge') return <svg {...o}><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></svg>
  return <svg {...o}><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></svg>
}

export default function SekreterMasa() {
  const router = useRouter()
  const [kisaAd, setKisaAd] = useState('')
  const [tamAd, setTamAd] = useState('')
  const [doktorAdi, setDoktorAdi] = useState('')
  const [randevular, setRandevular] = useState<RandevuSatir[]>([])
  const [mesajlar, setMesajlar] = useState<MesajOzet[]>([])
  const [gelenSayi, setGelenSayi] = useState(0)
  const [yukleniyor, setYukleniyor] = useState(true)

  const yukle = useCallback(async () => {
    const token = await ensureDoctorAccessToken()
    if (!token) { router.push(DOKTOR_GIRIS); return }
    const hdr = { Authorization: `Bearer ${token}` }

    try {
      const me = await fetch('/api/personel/me', { headers: hdr, cache: 'no-store' }).then((r) => (r.ok ? r.json() : null))
      if (me?.rol !== 'sekreter') {
        // Doktor yanlışlıkla buraya düşerse kendi ana sayfasına dönmesin — parent zaten dallanır.
        setKisaAd('')
      } else {
        setKisaAd(String(me.personelKisaAdi || me.personelAdi || '').trim())
        setTamAd(String(me.personelAdi || '').trim())
        setDoktorAdi(String(me.doktorAdi || '').trim())
      }
    } catch { /* selam boş kalır */ }

    const bugun = trtGun(new Date())
    const bas = new Date(`${bugun}T00:00:00+03:00`).toISOString()
    const bit = new Date(`${bugun}T23:59:59+03:00`).toISOString()

    await Promise.all([
      fetch(`/api/doktor/randevular?baslangic=${encodeURIComponent(bas)}&bitis=${encodeURIComponent(bit)}`, { headers: hdr })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          const liste = ((j?.randevular || []) as RandevuSatir[])
            .filter((r) => r.durum !== 'iptal')
            .sort((a, b) => new Date(a.baslangic).getTime() - new Date(b.baslangic).getTime())
          setRandevular(liste)
        })
        .catch(() => setRandevular([])),
      fetch('/api/doktor/mesajlar?unread=1', { headers: hdr })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => setMesajlar(Array.isArray(j?.threads) ? j.threads.slice(0, 4) : []))
        .catch(() => setMesajlar([])),
      fetch('/api/doktor/gelen-belgeler?sayi=1', { headers: hdr, cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => setGelenSayi(j?.erisim === true ? Number(j.sayi) || 0 : 0))
        .catch(() => setGelenSayi(0)),
    ])
    setYukleniyor(false)
  }, [router])

  useEffect(() => { void yukle() }, [yukle])

  const simdi = Date.now()
  const siradaki = useMemo(
    () => randevular.find((r) => new Date(r.baslangic).getTime() >= simdi - 20 * 60_000) || randevular[0] || null,
    [randevular, simdi],
  )
  // Ön büro nabzı — klinik KPI değil: bugünün randevu akışı + bekleyen iletişim.
  const nabiz = useMemo(() => {
    const bekleyen = randevular.filter((r) => r.durum === 'planlandi' || r.durum === 'onaylandi').length
    const bitti = randevular.filter((r) => r.durum === 'tamamlandi').length
    return { toplam: randevular.length, bekleyen, bitti, mesaj: mesajlar.length, belge: gelenSayi }
  }, [randevular, mesajlar.length, gelenSayi])

  const todayFull = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Istanbul',
  })
  const hekim = doktorAdi ? hekimUnvanli(doktorAdi) : ''
  const S = (s: Record<string, unknown>) => s as React.CSSProperties
  const kart: React.CSSProperties = {
    background: CHROME_RENK.paper,
    border: `1px solid ${CHROME_RENK.border}`,
    borderRadius: 20,
    boxShadow: '0 14px 28px rgba(58,44,34,0.05)',
  }

  const hizli = [
    { etiket: 'Randevu ekle', yol: '/dashboard/doktor/randevular?yeni=1', ikon: 'takvim' as const, vurgu: true },
    { etiket: 'Hasta bul', yol: '/dashboard/doktor/hastalar', ikon: 'hasta' as const, vurgu: false },
    { etiket: mesajlar.length ? `Mesajlar (${mesajlar.length})` : 'Mesajlar', yol: '/dashboard/doktor/mesajlar', ikon: 'mesaj' as const, vurgu: false },
    ...(gelenSayi > 0
      ? [{ etiket: `Gelen belgeler (${gelenSayi})`, yol: '/dashboard/doktor/gelen-belgeler', ikon: 'belge' as const, vurgu: false }]
      : [{ etiket: 'Takvim', yol: '/dashboard/doktor/randevular', ikon: 'saat' as const, vurgu: false }]),
  ]

  return (
    <div style={S({ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 920 })}>
      <style>{`
        @keyframes sekreterGir { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .sek-gir { animation: sekreterGir .45s ease both; }
        .sek-gir-2 { animation: sekreterGir .5s ease .06s both; }
        .sek-gir-3 { animation: sekreterGir .55s ease .12s both; }
        .sek-rv:hover { background: rgba(47,67,52,0.05) !important; }
        .sek-hizli:hover { border-color: rgba(47,67,52,0.28) !important; transform: translateY(-1px); }
      `}</style>

      {/* Hero — tek kompozisyon: selam + muayenehane, klinik KPI yok */}
      <header className="sek-gir">
        <div style={S({ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 17, color: '#6d6055', marginBottom: 4 })}>
          {gunKickerTRT(new Date(), tarayiciSaatDilimi())}, {todayFull}
        </div>
        <h1 style={S({
          fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 'clamp(30px, 7vw, 46px)',
          letterSpacing: '-0.03em', lineHeight: 1.08, color: '#2e251d', margin: 0,
        })}>
          {kisaAd ? `Hoş geldiniz, ${kisaAd}.` : 'Ön büro'}
        </h1>
        <p style={S({ margin: '10px 0 0', fontSize: 15, color: CHROME_RENK.muted, maxWidth: 520, lineHeight: 1.45 })}>
          {hekim
            ? `${hekim} muayenehanesinin ön bürosu — bugünün randevuları, mesajlar ve belgeler burada.`
            : 'Bugünün randevuları, mesajlar ve belgeler — ön büro masanız.'}
        </p>
        {tamAd && (
          <div style={S({
            marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
            color: CHROME_RENK.pine, background: 'rgba(47,67,52,0.08)', borderRadius: 999,
            padding: '6px 12px', border: '1px solid rgba(47,67,52,0.12)',
          })}>
            Sekreter · {tamAd}
          </div>
        )}
      </header>

      {/* Ön büro fısıltısı — mesaj, talep, belge, telefon, gelmedi, form (klinik kohort yok) */}
      <section className="sek-gir-2" aria-label="Ön büro fısıltısı">
        <OnBuroFisildiyor />
      </section>

      {/* Hemen yap */}
      <section className="sek-gir-2" aria-label="Hızlı işlemler">
        <div style={S({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 })}>
          {hizli.map((h) => (
            <button
              key={h.etiket}
              type="button"
              className="sek-hizli"
              onClick={() => router.push(h.yol)}
              style={S({
                display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                padding: '14px 16px', borderRadius: 16, cursor: 'pointer',
                border: `1px solid ${h.vurgu ? 'rgba(47,67,52,0.35)' : CHROME_RENK.border}`,
                background: h.vurgu ? CHROME_RENK.pine : CHROME_RENK.paper,
                color: h.vurgu ? CHROME_RENK.paper : CHROME_RENK.ink,
                boxShadow: '0 8px 18px rgba(58,44,34,0.04)', transition: 'transform .15s ease, border-color .15s ease',
                fontFamily: CHROME_FONT.sans, fontSize: 14, fontWeight: 700,
              })}
            >
              <span style={S({ opacity: 0.9, display: 'flex' })}><Ikon ad={h.ikon} /></span>
              {h.etiket}
            </button>
          ))}
        </div>
      </section>

      {/* Masanın nabzı — tek bakışta ön büro yükü */}
      <section className="sek-gir-2" aria-label="Bugünün özeti" style={S({
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10,
      })}>
        {[
          { etiket: 'Bugün', deger: yukleniyor ? '—' : String(nabiz.toplam) },
          { etiket: 'Bekleyen', deger: yukleniyor ? '—' : String(nabiz.bekleyen) },
          { etiket: 'Bitti', deger: yukleniyor ? '—' : String(nabiz.bitti) },
          { etiket: 'Mesaj', deger: yukleniyor ? '—' : String(nabiz.mesaj) },
          ...(nabiz.belge > 0 || !yukleniyor ? [{ etiket: 'Belge', deger: yukleniyor ? '—' : String(nabiz.belge) }] : []),
        ].map((n) => (
          <div key={n.etiket} style={S({
            ...kart, padding: '14px 16px', borderRadius: 16, boxShadow: '0 8px 18px rgba(58,44,34,0.04)',
          })}>
            <div style={S({ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: CHROME_RENK.muted })}>
              {n.etiket}
            </div>
            <div style={S({
              marginTop: 6, fontFamily: CHROME_FONT.serif, fontSize: 28, fontWeight: 500,
              color: '#2e251d', letterSpacing: '-0.03em', lineHeight: 1,
            })}>
              {n.deger}
            </div>
          </div>
        ))}
      </section>

      {/* Bugünün masası */}
      <section className="sek-gir-3" style={kart}>
        <div style={S({ padding: '18px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' })}>
          <div>
            <h2 style={S({ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 24, margin: 0, color: '#2e251d', letterSpacing: '-0.02em' })}>
              Bugünün masası
            </h2>
            <p style={S({ margin: '4px 0 0', fontSize: 13, color: CHROME_RENK.muted })}>
              {yukleniyor ? 'Yükleniyor…' : randevular.length === 0 ? 'Bugün için randevu yok.' : `${randevular.length} randevu`}
              {siradaki ? ` · sıradaki ${trtSaat(siradaki.baslangic)}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/dashboard/doktor/randevular')}
            style={S({
              background: 'transparent', border: 'none', color: CHROME_RENK.pine,
              fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: 0,
            })}
          >
            Takvimi aç ›
          </button>
        </div>

        {!yukleniyor && randevular.length === 0 && (
          <div style={S({ padding: '8px 20px 22px' })}>
            <p style={S({ margin: '0 0 12px', fontSize: 14, color: CHROME_RENK.ink, lineHeight: 1.45 })}>
              Boş bir gün — yeni randevu ekleyebilir veya bekleyen talepleri kontrol edebilirsiniz.
            </p>
            <button
              type="button"
              onClick={() => router.push('/dashboard/doktor/randevular?yeni=1')}
              style={S({
                background: CHROME_RENK.pine, color: CHROME_RENK.paper, border: 'none',
                borderRadius: 12, padding: '10px 16px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              })}
            >
              + Randevu ekle
            </button>
          </div>
        )}

        {randevular.length > 0 && (
          <ul style={S({ listStyle: 'none', margin: 0, padding: '0 8px 12px' })}>
            {randevular.map((r, i) => {
              const d = DURUM[r.durum] || DURUM.planlandi
              const yaklasan = siradaki?.id === r.id
              return (
                <li
                  key={r.id}
                  className="sek-rv"
                  onClick={() => router.push('/dashboard/doktor/randevular')}
                  style={S({
                    display: 'grid',
                    gridTemplateColumns: '64px 1fr auto',
                    gap: 12,
                    alignItems: 'center',
                    padding: '12px 12px',
                    borderRadius: 14,
                    cursor: 'pointer',
                    border: yaklasan ? '1px solid rgba(47,67,52,0.22)' : '1px solid transparent',
                    background: yaklasan ? 'rgba(47,67,52,0.04)' : 'transparent',
                    animation: `sekreterGir .4s ease ${0.04 * i}s both`,
                  })}
                >
                  <div style={S({
                    fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: 16,
                    color: CHROME_RENK.ink, fontFamily: CHROME_FONT.sans,
                  })}>
                    {trtSaat(r.baslangic)}
                  </div>
                  <div style={S({ minWidth: 0 })}>
                    <div style={S({ fontWeight: 700, fontSize: 15, color: CHROME_RENK.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' })}>
                      {r.hastaAdi || 'Hasta'}
                    </div>
                    <div style={S({ fontSize: 12, color: CHROME_RENK.muted, marginTop: 2 })}>
                      {TUR_ETIKET[r.tur] || r.tur || 'Randevu'}
                      {yaklasan ? ' · sıradaki' : ''}
                    </div>
                  </div>
                  <span style={S({
                    fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 999,
                    color: d.color, background: d.bg, whiteSpace: 'nowrap',
                  })}>
                    {d.label}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Bekleyen işler */}
      <section style={S({ display: 'flex', flexDirection: 'column', gap: 12 })}>
        <h2 style={S({
          fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 22, margin: 0,
          color: '#2e251d', letterSpacing: '-0.02em',
        })}>
          Bekleyenler
        </h2>
        <TakipPaneli kartStili={kart} />
        <RandevuTalepleri kartStili={kart} />
        <GelenBelgelerKarti kartStili={kart} />
        {mesajlar.length > 0 && (
          <div style={{ ...kart, padding: '16px 18px' }}>
            <div style={S({ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 })}>
              <div style={S({ fontWeight: 700, fontSize: 15 })}>Okunmamış mesajlar</div>
              <button type="button" onClick={() => router.push('/dashboard/doktor/mesajlar')} style={S({
                background: 'none', border: 'none', color: CHROME_RENK.pine, fontWeight: 700, fontSize: 13, cursor: 'pointer',
              })}>Tümü ›</button>
            </div>
            <ul style={S({ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 })}>
              {mesajlar.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/doktor/mesajlar?konu=${m.id}`)}
                    style={S({
                      width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
                      padding: '8px 0', cursor: 'pointer', borderTop: `1px solid ${CHROME_RENK.border}`,
                    })}
                  >
                    <div style={S({ fontWeight: 700, fontSize: 14, color: CHROME_RENK.ink })}>{m.hastaAdi}</div>
                    <div style={S({ fontSize: 13, color: CHROME_RENK.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' })}>{m.ozet}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section>
        <h2 style={S({
          fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 22, margin: '0 0 10px',
          color: '#2e251d', letterSpacing: '-0.02em',
        })}>
          Hazır mesajlar
        </h2>
        <p style={S({ margin: '0 0 12px', fontSize: 13, color: CHROME_RENK.muted, maxWidth: 520 })}>
          Randevu hatırlatması, değişiklik ve bilgi formu — tek dokunuşla WhatsApp / e-posta.
        </p>
        <HazirMesajlar kartStili={kart} />
      </section>
    </div>
  )
}
