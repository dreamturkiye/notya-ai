'use client'

/**
 * KURUCU-KONSOL-01 (Kaan, 2026-11-07) — the founder console screen. English text (Kaan's rule: everything outside the
 * Notya product copy is English). The doctor application's look: the shared cream/pine tokens and fonts
 * (lib/doktor/chromeTheme.ts). Read-only: one GET, no write, no patient data in anything it receives.
 */
import React, { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { kurucuVerisiniAl } from '@/lib/kurucu/oturumBekle'
import { CHROME_FONT, CHROME_FONT_HREF, CHROME_RENK as R } from '@/lib/doktor/chromeTheme'
import type { KurucuKonsolVerisi, KonsolUlkesi } from '@/lib/kurucu/konsol'
import type { KurucuHesap, KurucuOzet } from '@/lib/kurucu/tipler'

type Durum = { tur: 'yukleniyor' } | { tur: 'yok' } | { tur: 'hata' } | { tur: 'tamam'; veri: KurucuKonsolVerisi }

const tarih = (iso: string | null) => (iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')
const evetHayir = (b: boolean) => (b ? 'Yes' : 'No')

export function OzetKutulari({ o }: { o: KurucuOzet }) {
  const kutular: [string, number][] = [['Signups today', o.bugun], ['Last 7 days', o.yedi], ['Last 30 days', o.otuz], ['Active trials', o.aktifDeneme], ['Trials ending in 3 days', o.ucGundeBitecek], ['Paid', o.ucretli]]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
      {kutular.map(([etiket, deger]) => (
        <div key={etiket} style={{ background: R.paper, border: `1px solid ${R.border}`, borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: 12, color: R.muted }}>{etiket}</div>
          <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 28, color: R.pine, marginTop: 4 }}>{deger}</div>
        </div>
      ))}
    </div>
  )
}

const hucre: React.CSSProperties = { padding: '8px 10px', borderBottom: `1px solid ${R.borderSoft}`, whiteSpace: 'nowrap', textAlign: 'left', fontSize: 13 }

export function HesapTablosu({ hesaplar }: { hesaplar: readonly KurucuHesap[] }) {
  if (!hesaplar.length) return <p style={{ color: R.muted, fontSize: 14 }}>No signups yet.</p>
  const basliklar = ['Signed up', 'Name', 'Email', 'Specialty', 'Specialty chosen', 'Plan', 'Onboarding complete', 'Trial days left', 'Last login', 'Notes 7d / 30d', 'Visits 7d / 30d']
  return (
    <div style={{ overflowX: 'auto', background: R.paper, border: `1px solid ${R.border}`, borderRadius: 14 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead><tr>{basliklar.map((b) => <th key={b} style={{ ...hucre, color: R.muted, fontWeight: 600 }}>{b}</th>)}</tr></thead>
        <tbody>
          {hesaplar.map((h, i) => (
            <tr key={`${h.eposta}-${i}`}>
              <td style={hucre}>{tarih(h.kayit)}</td>
              <td style={hucre}>{h.ad || '—'}</td>
              <td style={hucre}>{h.eposta}</td>
              <td style={hucre}>{h.bransEtiketi || '—'}</td>
              <td style={hucre}>{evetHayir(h.bransSecildi)}</td>
              <td style={hucre}>{h.plan === 'paid' ? 'Paid' : 'Trial'}</td>
              <td style={hucre}>{evetHayir(h.onboardingTamam)}</td>
              <td style={hucre}>{h.denemeKalanGun == null ? '—' : h.denemeKalanGun}</td>
              <td style={hucre}>{tarih(h.sonGiris)}</td>
              <td style={hucre}>{h.not7} / {h.not30}</td>
              <td style={hucre}>{h.muayene7} / {h.muayene30}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UlkeBolumu({ u }: { u: KonsolUlkesi }) {
  return (
    <section style={{ marginTop: 28 }}>
      <h2 style={{ fontFamily: CHROME_FONT.serif, fontSize: 22, color: R.ink, margin: '0 0 10px' }}>{u.ad}</h2>
      {u.durum === 'erisilemez' ? (
        <p style={{ color: R.warn, fontSize: 14 }} data-durum="erisilemez">Unavailable ({u.neden}).</p>
      ) : (
        <>
          <OzetKutulari o={u.ozet} />
          <div style={{ height: 12 }} />
          <HesapTablosu hesaplar={u.veri.hesaplar} />
        </>
      )}
    </section>
  )
}

export function KonsolGorunumu({ veri }: { veri: KurucuKonsolVerisi }) {
  const s = veri.stripe
  return (
    <div>
      <section>
        <h2 style={{ fontFamily: CHROME_FONT.serif, fontSize: 22, color: R.ink, margin: '0 0 10px' }}>All countries</h2>
        <OzetKutulari o={veri.toplam} />
      </section>
      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontFamily: CHROME_FONT.serif, fontSize: 22, color: R.ink, margin: '0 0 10px' }}>Conversions (Stripe)</h2>
        {s.durum === 'bagli-degil' ? <p style={{ color: R.muted, fontSize: 14 }}>Not connected.</p>
          : s.durum === 'hata' ? <p style={{ color: R.warn, fontSize: 14 }}>Unavailable ({s.ayrinti}).</p>
          : (
            <div style={{ overflowX: 'auto', background: R.paper, border: `1px solid ${R.border}`, borderRadius: 14 }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead><tr>{['Country', 'In trial (card on file)', 'Active paid', 'Trial → paid', 'Cancelled'].map((b) => <th key={b} style={{ ...hucre, color: R.muted }}>{b}</th>)}</tr></thead>
                <tbody>
                  {[...Object.entries(s.ulkeler), ['total', s.toplam] as const].map(([k, v]) => (
                    <tr key={k}><td style={hucre}>{k.toUpperCase()}</td><td style={hucre}>{v.deneme}</td><td style={hucre}>{v.aktif}</td><td style={hucre}>{v.denemedenUcretliye}</td><td style={hucre}>{v.iptal}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>
      {veri.ulkeler.map((u) => <UlkeBolumu key={u.ulke} u={u} />)}
      <p style={{ marginTop: 28, fontSize: 12, color: R.muted }}>
        Test accounts (not counted): {veri.testHesaplari.length ? veri.testHesaplari.join(', ') : 'none'}. Counts only; no patient data is shown. Generated {tarih(veri.uretildi)}.
      </p>
    </div>
  )
}

export default function KurucuKonsolu() {
  const [d, setD] = useState<Durum>({ tur: 'yukleniyor' })
  useEffect(() => {
    let iptal = false
    ;(async () => {
      // KURUCU-KONSOL-02: wait for the stored session to hydrate, retry once with a forced refresh on 404 (lib/kurucu/oturumBekle.ts).
      const sonuc = await kurucuVerisiniAl<KurucuKonsolVerisi>({
        tokenAl: (o) => ensureDoctorAccessToken(o),
        getir: (token) => fetch('/api/kurucu/ozet', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
        iptalMi: () => iptal,
      })
      if (!iptal) setD(sonuc)
    })()
    return () => { iptal = true }
  }, [])

  if (d.tur === 'yok') notFound()
  return (
    <div style={{ minHeight: '100dvh', background: R.cream, color: R.ink, fontFamily: CHROME_FONT.sans, padding: 'calc(24px + env(safe-area-inset-top, 0px)) 16px 40px', boxSizing: 'border-box' }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 30, color: R.pine, marginBottom: 18 }}>Notya · Founder console</div>
        {d.tur === 'yukleniyor' ? <p style={{ color: R.muted }}>Loading…</p>
          : d.tur === 'hata' ? <p style={{ color: R.warn }}>Could not load. Try again in a moment.</p>
          : <KonsolGorunumu veri={d.veri} />}
      </div>
    </div>
  )
}
