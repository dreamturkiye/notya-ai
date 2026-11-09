'use client'
/**
 * TR-PARITE-01 — Doz hesaplayıcı (lib/doktor/dozHesap.ts). YALNIZ HESAP MAKİNESİ: hekim kiloyu / boyu / VYA'yı, miktarı,
 * konsantrasyonu ve tavanı kendisi girer; araç ilaç listesi, varsayılan miktar veya öneri sunmaz. Sunulan temeller
 * hekimin branşından gelir (DOZ_TEMELI_BRANSA_GORE). Sonuç canlıdır; nota, reçeteye veya sunucuya yazılmaz — kopyalanır.
 */
import React, { useEffect, useMemo, useState } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { toolsCard, toolsInput, toolsLabel } from '@/lib/doktor/toolsUi'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { DOZ_UYARI_METNI, dozAraciTemelleri, dozHesapla, fmtDoz, type DozTemeli } from '@/lib/doktor/dozHesap'

const TEMEL_ADI: Record<DozTemeli, string> = { kg: 'mg/kg', m2: 'mg/m²', sabit: 'Sabit doz (mg)' }
const SIKLIK = [1, 2, 3, 4, 6]
const sayi = (h: string): number | null => { const n = Number(String(h).replace(',', '.').trim()); return h.trim() && Number.isFinite(n) ? n : null }

export default function DozHesapAraci() {
  const [temeller, setTemeller] = useState<readonly DozTemeli[] | null>(null)
  const [temel, setTemel] = useState<DozTemeli>('sabit')
  const [ilac, setIlac] = useState('')
  const [kilo, setKilo] = useState('')
  const [boy, setBoy] = useState('')
  const [bsa, setBsa] = useState('')
  const [miktar, setMiktar] = useState('')
  const [mod, setMod] = useState<'gun' | 'doz'>('doz')
  const [dozSayisi, setDozSayisi] = useState(1)
  const [konsMg, setKonsMg] = useState('')
  const [konsMl, setKonsMl] = useState('')
  const [tavanDoz, setTavanDoz] = useState('')
  const [tavanGun, setTavanGun] = useState('')
  const [kopyalandi, setKopyalandi] = useState(false)

  useEffect(() => {
    let iptal = false
    ;(async () => {
      try {
        const t = await ensureDoctorAccessToken()
        const r = t ? await fetch('/api/users/me', { headers: { Authorization: `Bearer ${t}` } }) : null
        const j = r?.ok ? await r.json() : null
        const l = dozAraciTemelleri(j?.data?.specialty)
        if (!iptal) { setTemeller(l); if (l?.length) setTemel(l[0]) }
      } catch { if (!iptal) setTemeller(null) }
    })()
    return () => { iptal = true }
  }, [])

  const sonuc = useMemo(() => dozHesapla({
    temel, kiloKg: sayi(kilo), boyCm: sayi(boy), bsa: sayi(bsa), miktar: sayi(miktar) ?? NaN, mod, dozSayisi,
    konsMg: sayi(konsMg), konsMl: sayi(konsMl), tavanDozMg: sayi(tavanDoz), tavanGunMg: sayi(tavanGun),
  }), [temel, kilo, boy, bsa, miktar, mod, dozSayisi, konsMg, konsMl, tavanDoz, tavanGun])

  if (!temeller) return <div style={{ color: CHROME_RENK.muted }}>Yükleniyor…</div>
  const satir = (etiket: string, deger: string) => <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderBottom: `1px solid ${CHROME_RENK.border}` }}><span style={{ color: CHROME_RENK.muted }}>{etiket}</span><b style={{ color: CHROME_RENK.ink }}>{deger}</b></div>
  const ozet = sonuc ? [
    ilac.trim() ? `İlaç (hekim yazdı): ${ilac.trim()}` : null,
    `Temel: ${TEMEL_ADI[temel]} · miktar ${miktar}${temel === 'sabit' ? ' mg/doz' : mod === 'gun' ? ' /gün' : ' /doz'} · günde ${dozSayisi} doz`,
    sonuc.bsa !== null ? `VYA: ${fmtDoz(sonuc.bsa)} m²` : null,
    `Doz başına: ${fmtDoz(sonuc.dozMg)} mg${sonuc.dozMl !== null ? ` (${fmtDoz(sonuc.dozMl)} mL)` : ''} · günlük ${fmtDoz(sonuc.gunlukMg)} mg · ${fmtDoz(sonuc.aralikSaat, 1)} saatte bir`,
    sonuc.tavanliDozMg !== null ? `Girilen tavanla sınırlanırsa: ${fmtDoz(sonuc.tavanliDozMg)} mg/doz${sonuc.tavanliDozMl !== null ? ` (${fmtDoz(sonuc.tavanliDozMl)} mL)` : ''}` : null,
    'Hesap hekimin girdiği değerlerle yapılmıştır; ilaç ve doz kararı hekimindir.',
  ].filter(Boolean).join('\n') : ''

  return (
    <div data-alan="doz-hesap" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
      <div style={toolsCard}>
        <label style={toolsLabel}>İlaç adı (isteğe bağlı, yalnız kayıt için)</label>
        <input value={ilac} onChange={(e) => setIlac(e.target.value)} maxLength={80} style={{ ...toolsInput, marginBottom: 12 }} />
        <label style={toolsLabel}>Hesap biçimi</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {temeller.map((t) => <button key={t} type="button" aria-pressed={temel === t} onClick={() => setTemel(t)} style={{ padding: '8px 12px', borderRadius: 999, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', background: temel === t ? CHROME_RENK.pine : '#EFE9DC', color: temel === t ? '#FAF8F4' : CHROME_RENK.muted }}>{TEMEL_ADI[t]}</button>)}
        </div>
        {temel !== 'sabit' && (<>
          <label style={toolsLabel}>Kilo (kg){temel === 'm2' ? ' — VYA girmezseniz' : ''}</label>
          <input inputMode="decimal" value={kilo} onChange={(e) => setKilo(e.target.value)} style={{ ...toolsInput, marginBottom: 12 }} />
        </>)}
        {temel === 'm2' && (<>
          <label style={toolsLabel}>Boy (cm) — VYA girmezseniz</label>
          <input inputMode="decimal" value={boy} onChange={(e) => setBoy(e.target.value)} style={{ ...toolsInput, marginBottom: 12 }} />
          <label style={toolsLabel}>Vücut yüzey alanı (m²) — biliyorsanız</label>
          <input inputMode="decimal" value={bsa} onChange={(e) => setBsa(e.target.value)} style={{ ...toolsInput, marginBottom: 12 }} />
        </>)}
        <label style={toolsLabel}>Miktar ({TEMEL_ADI[temel]}) — sizin değeriniz</label>
        <input inputMode="decimal" value={miktar} onChange={(e) => setMiktar(e.target.value)} style={{ ...toolsInput, marginBottom: 12 }} />
        {temel !== 'sabit' && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {(['doz', 'gun'] as const).map((m) => <button key={m} type="button" aria-pressed={mod === m} onClick={() => setMod(m)} style={{ padding: '8px 12px', borderRadius: 999, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: mod === m ? CHROME_RENK.pine : '#EFE9DC', color: mod === m ? '#FAF8F4' : CHROME_RENK.muted }}>{m === 'doz' ? 'Doz başına' : 'Günlük toplam'}</button>)}
          </div>
        )}
        <label style={toolsLabel}>Günde kaç doz</label>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {SIKLIK.map((n) => <button key={n} type="button" aria-pressed={dozSayisi === n} onClick={() => setDozSayisi(n)} style={{ padding: '8px 12px', borderRadius: 999, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: dozSayisi === n ? CHROME_RENK.pine : '#EFE9DC', color: dozSayisi === n ? '#FAF8F4' : CHROME_RENK.muted }}>{n}×</button>)}
        </div>
        <label style={toolsLabel}>Konsantrasyon (isteğe bağlı): mg / mL</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input inputMode="decimal" placeholder="mg" value={konsMg} onChange={(e) => setKonsMg(e.target.value)} style={toolsInput} />
          <input inputMode="decimal" placeholder="mL" value={konsMl} onChange={(e) => setKonsMl(e.target.value)} style={toolsInput} />
        </div>
        <label style={toolsLabel}>Tavan (isteğe bağlı, sizin değeriniz): mg/doz · mg/gün</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input inputMode="decimal" placeholder="mg/doz" value={tavanDoz} onChange={(e) => setTavanDoz(e.target.value)} style={toolsInput} />
          <input inputMode="decimal" placeholder="mg/gün" value={tavanGun} onChange={(e) => setTavanGun(e.target.value)} style={toolsInput} />
        </div>
      </div>
      <div style={toolsCard} aria-live="polite">
        <div style={{ fontWeight: 700, color: CHROME_RENK.ink, marginBottom: 8 }}>Sonuç</div>
        {!sonuc ? <div style={{ color: CHROME_RENK.muted, fontSize: 13 }}>Hesap biçiminin gerektirdiği değerleri girin.</div> : (
          <div style={{ fontSize: 14 }}>
            {sonuc.bsa !== null && satir('Vücut yüzey alanı', `${fmtDoz(sonuc.bsa)} m²`)}
            {satir('Doz başına', `${fmtDoz(sonuc.dozMg)} mg${sonuc.dozMl !== null ? ` · ${fmtDoz(sonuc.dozMl)} mL` : ''}`)}
            {satir('Günlük toplam', `${fmtDoz(sonuc.gunlukMg)} mg${sonuc.gunlukMl !== null ? ` · ${fmtDoz(sonuc.gunlukMl)} mL` : ''}`)}
            {satir('Aralık', `${fmtDoz(sonuc.aralikSaat, 1)} saatte bir`)}
            {sonuc.tavanliDozMg !== null && satir('Girdiğiniz tavanla', `${fmtDoz(sonuc.tavanliDozMg)} mg${sonuc.tavanliDozMl !== null ? ` · ${fmtDoz(sonuc.tavanliDozMl)} mL` : ''}`)}
            {sonuc.uyarilar.map((u) => <div key={u} style={{ marginTop: 8, color: CHROME_RENK.warn, fontSize: 13 }} data-uyari={u}>{DOZ_UYARI_METNI[u]}</div>)}
            <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(ozet); setKopyalandi(true) } catch { setKopyalandi(false) } }} style={{ marginTop: 14, padding: '8px 14px', borderRadius: 8, border: `1px solid ${CHROME_RENK.pine}`, background: '#E4F3F1', color: CHROME_RENK.pine, fontWeight: 600, cursor: 'pointer' }}>{kopyalandi ? 'Kopyalandı' : 'Hesabı kopyala'}</button>
          </div>
        )}
        <p style={{ marginTop: 14, fontSize: 12, color: CHROME_RENK.muted }}>Araç ilaç veya doz önermez; değerler ve karar hekimindir.</p>
      </div>
    </div>
  )
}
