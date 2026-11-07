'use client'

/**
 * NOTYA-ULKE-01 — sign-up with an invitation code (/signup). Every sentence comes from the country's pack
 * (surface `davetliKayit`). The account is created by the server (app/api/ulke/kayit), which checks the code and
 * stamps the deployment's country and the chosen language on the account; the browser never talks to the auth
 * service's public sign-up.
 */
import React from 'react'
import { useState, type FormEvent } from 'react'
import type { DilKodu, YuzeyMetinleri } from '@/lib/ulke/tipler'
import { ulkeYolu } from '@/lib/ulke/yol'
import { CHROME_RENK as R } from '@/lib/doktor/chromeRenk'
import { ULKE_STIL as S, UlkeKart, type DilSecenegi } from './UlkeKart'

export type DavetliKayitFormuProps = {
  dil: DilKodu
  metin: YuzeyMetinleri<'davetliKayit'>
  anaSayfaAdi: string
  /** Languages the account may choose for its interface: the country's switched-on languages. */
  diller: readonly DilSecenegi[]
  anaSayfa: string
  giris: string
  fiyat: string
  /** false = the country's sign-up is open (pack setting `uygulama.kayitAcik`): no code is asked. Default: a code is required. */
  kodGerekli?: boolean
  /**
   * KAYIT-BRANS-01 (Kaan, 2026-11-07): the REQUIRED specialty choice — this country's own roles (the pack's list, which
   * already carries its regulatory gate), grouped and named in the visitor's language by the signed-in catalogue
   * (`rol`). Absent only where the country has no roles. No preselected default; the button stays disabled until one
   * is chosen, and the server (app/api/ulke/kayit) refuses a missing or unknown one.
   */
  brans?: { etiket: string; sec: string; gerekli: string; gruplar: readonly { ad: string; secenekler: readonly { anahtar: string; ad: string }[] }[] }
  /** Optional professional registration. From the signed-in catalogue, not a new key of the public sign-up surface. */
  meslek?: { etiket: string; izoh: string; gecersiz: string }
}

const EPOSTA = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default function DavetliKayitFormu({ dil, metin, anaSayfaAdi, diller, anaSayfa, giris, fiyat, kodGerekli = true, meslek, brans }: DavetliKayitFormuProps) {
  const [alan, setAlan] = useState({ adSoyad: '', eposta: '', sifre: '', sifreTekrar: '', davetKodu: '', dil: dil as string, meslekKaydi: '', rol: '' })
  const [bekliyor, setBekliyor] = useState(false)
  const [hata, setHata] = useState('')
  const [tamam, setTamam] = useState(false)
  const yaz = (ad: keyof typeof alan) => (e: { target: { value: string } }) => setAlan((a) => ({ ...a, [ad]: e.target.value }))

  // REFERANS-01: a colleague's referral code from the sign-up link (`?ref=NTY-XXXX`). Optional; it never gates sign-up.
  const refKodu = (): string | null => (typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('ref'))
  async function gonder(e: FormEvent) {
    e.preventDefault()
    const adSoyad = alan.adSoyad.trim(), eposta = alan.eposta.toLowerCase().trim(), davetKodu = alan.davetKodu.trim()
    if (!adSoyad || !eposta || !alan.sifre || !alan.sifreTekrar || (kodGerekli && !davetKodu)) { setHata(metin.eksikAlan); return }
    if (brans && !brans.gruplar.some((g) => g.secenekler.some((s) => s.anahtar === alan.rol))) { setHata(brans.gerekli); return }
    if (!EPOSTA.test(eposta)) { setHata(metin.epostaGecersiz); return }
    if (alan.sifre.length < 8) { setHata(metin.sifreKisa); return }
    if (alan.sifre !== alan.sifreTekrar) { setHata(metin.sifreUyusmuyor); return }
    setBekliyor(true); setHata('')
    try {
      const r = await fetch(ulkeYolu('/api/ulke/kayit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ adSoyad, eposta, sifre: alan.sifre, ...(kodGerekli ? { davetKodu } : {}), ...(refKodu() ? { ref: refKodu() } : {}), dil: alan.dil, ...(alan.meslekKaydi.trim() ? { meslekKaydi: alan.meslekKaydi.trim() } : {}), ...(brans ? { rol: alan.rol } : {}) }),
      })
      if (r.ok) { setTamam(true); return }
      const j = (await r.json().catch(() => ({}))) as { code?: string }
      const kod: Record<string, string> = { EKSIK_ALAN: metin.eksikAlan, EPOSTA_GECERSIZ: metin.epostaGecersiz, SIFRE_KISA: metin.sifreKisa, KOD_GECERSIZ: metin.kodGecersiz, GECERSIZ: meslek?.gecersiz ?? metin.olusturulamadi, ROL_GEREKLI: brans?.gerekli ?? metin.eksikAlan }
      setHata(kod[String(j.code)] ?? metin.olusturulamadi)
    } catch {
      setHata(metin.baglantiHatasi)
    } finally {
      setBekliyor(false)
    }
  }

  if (tamam) {
    return (
      <UlkeKart dil={dil} altBaslik={metin.baslik} anaSayfa={{ href: anaSayfa, ad: anaSayfaAdi }} genislik={440}>
        <div role="status" style={S.bilgi}>{metin.basarili}</div>
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href={giris} style={S.cizgiDugme}>{metin.girisBaglantisi}</a>
        </div>
      </UlkeKart>
    )
  }

  return (
    <UlkeKart dil={dil} altBaslik={metin.baslik} anaSayfa={{ href: anaSayfa, ad: anaSayfaAdi }} genislik={440}>
      <p style={{ margin: '0 0 18px', fontSize: 14, color: R.muted, textAlign: 'center', lineHeight: 1.5 }}>{metin.aciklama}</p>
      <form onSubmit={gonder} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {kodGerekli ? (
          <div>
            <label style={S.etiket} htmlFor="ulke-kayit-kod">{metin.davetKodu}</label>
            <input id="ulke-kayit-kod" value={alan.davetKodu} onChange={yaz('davetKodu')} autoCapitalize="characters" autoCorrect="off" autoComplete="off" spellCheck={false} maxLength={40} style={{ ...S.girdi, letterSpacing: 1.5, textTransform: 'uppercase' }} />
          </div>
        ) : null}
        <div>
          <label style={S.etiket} htmlFor="ulke-kayit-ad">{metin.adSoyad}</label>
          <input id="ulke-kayit-ad" value={alan.adSoyad} onChange={yaz('adSoyad')} autoComplete="name" maxLength={120} style={S.girdi} />
        </div>
        <div>
          <label style={S.etiket} htmlFor="ulke-kayit-eposta">{metin.eposta}</label>
          <input id="ulke-kayit-eposta" type="email" value={alan.eposta} onChange={yaz('eposta')} autoCapitalize="none" autoCorrect="off" autoComplete="email" inputMode="email" spellCheck={false} maxLength={200} style={S.girdi} />
        </div>
        <div>
          <label style={S.etiket} htmlFor="ulke-kayit-sifre">{metin.sifre}</label>
          <input id="ulke-kayit-sifre" type="password" value={alan.sifre} onChange={yaz('sifre')} autoComplete="new-password" maxLength={200} style={S.girdi} />
        </div>
        <div>
          <label style={S.etiket} htmlFor="ulke-kayit-sifre2">{metin.sifreTekrar}</label>
          <input id="ulke-kayit-sifre2" type="password" value={alan.sifreTekrar} onChange={yaz('sifreTekrar')} autoComplete="new-password" maxLength={200} style={S.girdi} />
        </div>
        {brans ? (
          <div data-alan="brans-secimi">
            <label style={S.etiket} htmlFor="ulke-kayit-rol">{brans.etiket}</label>
            <select id="ulke-kayit-rol" name="rol" required aria-required="true" value={alan.rol} onChange={yaz('rol')} style={{ ...S.girdi, appearance: 'auto', color: alan.rol ? R.ink : R.muted }}>
              <option value="" disabled>{brans.sec}</option>
              {brans.gruplar.map((g) => (
                <optgroup key={g.ad} label={g.ad}>
                  {g.secenekler.map((s) => <option key={s.anahtar} value={s.anahtar} style={{ color: R.ink }}>{s.ad}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
        ) : null}
        {meslek ? (
          <div>
            <label style={S.etiket} htmlFor="ulke-kayit-meslek">{meslek.etiket}</label>
            <input id="ulke-kayit-meslek" value={alan.meslekKaydi} onChange={yaz('meslekKaydi')} autoComplete="off" maxLength={40} style={S.girdi} data-alan="meslek-kaydi" />
            <p style={{ margin: '6px 0 0', fontSize: 13, color: R.muted, lineHeight: 1.45 }}>{meslek.izoh}</p>
          </div>
        ) : null}
        {diller.length > 1 ? (
          <div>
            <label style={S.etiket} htmlFor="ulke-kayit-dil">{metin.dil}</label>
            <select id="ulke-kayit-dil" value={alan.dil} onChange={yaz('dil')} style={{ ...S.girdi, appearance: 'auto' }}>
              {diller.map((d) => (
                <option key={d.kod} value={d.kod} lang={d.kod}>{d.ad}</option>
              ))}
            </select>
          </div>
        ) : null}
        {hata ? <div role="alert" style={S.hata}>{hata}</div> : null}
        <button type="submit" disabled={bekliyor || (brans ? !alan.rol : false)} style={{ ...S.dugme, opacity: bekliyor || (brans ? !alan.rol : false) ? 0.6 : 1 }}>
          {bekliyor ? metin.gonderiliyor : metin.gonder}
        </button>
      </form>
      <div style={S.alt}>
        {metin.girisSorusu} <a href={giris} style={S.baglanti}>{metin.girisBaglantisi}</a>
        <br />
        {metin.kodYokSorusu} <a href={fiyat} style={S.baglanti}>{metin.fiyatBaglantisi}</a>
      </div>
    </UlkeKart>
  )
}
