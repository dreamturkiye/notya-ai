/**
 * BELGE-NO-01 (Kaan, 2026-11-05) — PUBLIC DOCUMENT VERIFICATION (/dogrula?c=<code>). Anyone holding a printed Notya
 * document can check it: the page shows ONLY the document number, the revision and its date, the doctor's title and name,
 * whether this is the current revision or a superseded one, and the integrity hash. NO PATIENT DATA, ever: the database
 * function it calls (belge_dogrula) does not even select one. Rate-limited per IP (30 a minute); never cached.
 */
import React from 'react'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { belgeDogrula, type Islev } from '@/lib/belge/sunucu'
import { hizSiniri, istekIp } from '@/lib/belge/hizSiniri'
import { DOGRULAMA_KODU_RE } from '@/lib/belge/belge'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Belge doğrulama · Notya', robots: { index: false, follow: false } }

const SINIR = hizSiniri(30, 60_000)

export default async function DogrulaSayfasi({ searchParams }: { searchParams: { c?: string } }) {
  const c = searchParams?.c
  const kod = typeof c === 'string' ? c.trim().toUpperCase() : ''
  const h = headers()
  const izin = SINIR.izinli(istekIp(h))
  let sonuc: Awaited<ReturnType<typeof belgeDogrula>> = null
  if (izin && DOGRULAMA_KODU_RE.test(kod)) {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } })
    const islev: Islev = (ad, a) => sb.rpc(ad, { ...a, p_ulke: 'tr' })
    sonuc = await belgeDogrula(islev, kod)
  }
  const satir = (ad: string, deger: React.ReactNode) => (
    <div style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #eee' }}>
      <div style={{ width: 150, color: '#6d6055', fontSize: 14 }}>{ad}</div>
      <div style={{ flex: 1, fontSize: 15, wordBreak: 'break-all' }}>{deger}</div>
    </div>
  )
  return (
    <main style={{ minHeight: '100vh', background: '#FAF8F4', color: '#2e251d', fontFamily: 'system-ui, sans-serif', padding: '40px 16px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', background: '#fff', border: '1px solid rgba(58,44,34,0.12)', borderRadius: 16, padding: 24 }}>
        <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#6d6055', fontSize: 14 }}>Notya</div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 500, fontSize: 26, margin: '4px 0 16px' }}>Belge doğrulama</h1>
        <form method="get" style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <input name="c" defaultValue={kod} placeholder="Doğrulama kodu (12 karakter)" maxLength={12} style={{ flex: 1, minWidth: 200, padding: 10, fontSize: 15, borderRadius: 8, border: '1px solid #ccc', textTransform: 'uppercase' }} />
          <button type="submit" style={{ background: '#2f4a3a', color: '#FAF8F4', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700 }}>Doğrula</button>
        </form>
        {!izin ? (
          <p style={{ color: '#9a3412' }}>Çok fazla sorgu yapıldı. Lütfen bir dakika sonra tekrar deneyin.</p>
        ) : !kod ? (
          <p style={{ color: '#6d6055' }}>Belgedeki karekodu okutun veya altındaki doğrulama kodunu girin.</p>
        ) : !sonuc ? (
          <p style={{ color: '#9a3412' }}>Bu kodla kayıtlı bir belge bulunamadı.</p>
        ) : (
          <div>
            <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 999, fontSize: 13, fontWeight: 700, marginBottom: 10, background: sonuc.guncel ? 'rgba(16,185,129,0.12)' : 'rgba(234,88,12,0.12)', color: sonuc.guncel ? '#047857' : '#9a3412' }}>
              {sonuc.guncel ? 'Güncel sürüm' : `Yerini daha yeni bir sürüm aldı (güncel: Rev. ${sonuc.guncelRev})`}
            </div>
            {satir('Belge numarası', sonuc.belgeNo)}
            {satir('Revizyon', `Rev. ${sonuc.rev}`)}
            {satir('Tarih', new Date(sonuc.tarih).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }))}
            {satir('Hekim', sonuc.hekim)}
            {satir('Bütünlük özeti (SHA-256)', <code style={{ fontSize: 12 }}>{sonuc.ozet}</code>)}
            <p style={{ fontSize: 12, color: '#6d6055', marginTop: 14 }}>Bu sayfa belgenin içeriğini ve hasta bilgisini göstermez; yalnızca belgenin Notya'da bu numara ve revizyonla kaydedildiğini doğrular.</p>
          </div>
        )}
      </div>
    </main>
  )
}
