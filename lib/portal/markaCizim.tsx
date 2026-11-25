/**
 * HASTA-ALANI-MARKA — server-drawn brand images (next/og): the PWA / home-screen icon, the link preview (Open Graph) and
 * the small photo tile. All three are drawn from the resolved PortalMarka and the doctor's own image bytes:
 *   logo  → read from the brand bucket by its stored path (service role; never a third-party URL)
 *   photo → doctor_avatars, decrypted on the server
 *   else  → monogram in the doctor's accent.
 * PNG / JPEG only go into the renderer (it cannot read WebP); a WebP logo / photo falls back to the monogram here, while
 * the page itself still shows it. Font: embedded Lora subset (markaFont.ts) — no run-time font download.
 */
import { ImageResponse } from 'next/og'
import type { SupabaseClient } from '@supabase/supabase-js'
import { decryptBytes } from '@/lib/vault/crypto'
import { markaFontu, MARKA_FONT_ADI } from './markaFont'
import { BOLUM_ADI, VURGU_SECENEKLERI, type PortalMarka } from './marka'
import { gorselTuruKoklayarak } from './markaGorsel'
import { MARKA_KOVASI, markaKovaTabani } from './markaSunucu'

export const KREM = '#f4eee3'
const MUREKKEP = '#3b2e24'
const SOLUK = '#8b7d70'

const fontlar = () => [{ name: MARKA_FONT_ADI, data: markaFontu(), weight: 500 as const, style: 'normal' as const }]

/** Bytes → data URL when the renderer can read them (PNG / JPEG by magic bytes), else null. */
export function cizilebilirDataUrl(b: Buffer | null | undefined): string | null {
  if (!b || !b.length) return null
  const t = gorselTuruKoklayarak(b)
  return t === 'image/png' || t === 'image/jpeg' ? `data:${t};base64,${b.toString('base64')}` : null
}

/** The mark's bytes for the renderer — logo from our bucket, or the decrypted photo. null → monogram. */
export async function markaGorselBaytlari(sb: SupabaseClient, doctorId: string, marka: PortalMarka): Promise<Buffer | null> {
  try {
    if (marka.gorsel?.tur === 'logo') {
      const taban = markaKovaTabani()
      const yol = marka.gorsel.url.startsWith(taban) ? marka.gorsel.url.slice(taban.length) : null
      if (!yol) return null
      const { data } = await sb.storage.from(MARKA_KOVASI).download(yol)
      if (!data) return null
      return typeof (data as Blob).arrayBuffer === 'function' ? Buffer.from(await (data as Blob).arrayBuffer()) : Buffer.from(data as unknown as Uint8Array)
    }
    if (marka.gorsel?.tur === 'foto') return await hekimFotoBaytlari(sb, doctorId)
  } catch (e) {
    console.error('[portal-marka] gorsel:', (e as Error).message)
  }
  return null
}

export async function hekimFotoBaytlari(sb: SupabaseClient, doctorId: string): Promise<Buffer | null> {
  const { data } = await sb.from('doctor_avatars').select('mime_type, image_encrypted').eq('doctor_id', doctorId).maybeSingle()
  if (!data?.image_encrypted) return null
  try { return decryptBytes(Buffer.from(String(data.image_encrypted), 'base64')) } catch { return null }
}

function Isaret({ marka, dataUrl, boyut, yuvarlak }: { marka: PortalMarka; dataUrl: string | null; boyut: number; yuvarlak: boolean }) {
  const v = VURGU_SECENEKLERI[marka.vurgu]
  if (dataUrl && marka.gorsel?.tur === 'logo') {
    return (
      <div style={{ width: boyut, height: boyut, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', borderRadius: yuvarlak ? boyut / 2 : boyut * 0.22 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} width={Math.round(boyut * 0.74)} height={Math.round(boyut * 0.74)} style={{ objectFit: 'contain' }} alt="" />
      </div>
    )
  }
  if (dataUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={dataUrl} width={boyut} height={boyut} style={{ objectFit: 'cover', borderRadius: yuvarlak ? boyut / 2 : boyut * 0.22 }} alt="" />
  }
  return (
    <div style={{ width: boyut, height: boyut, display: 'flex', alignItems: 'center', justifyContent: 'center', background: v.koyu, color: '#fbf8f2', borderRadius: yuvarlak ? boyut / 2 : boyut * 0.22, fontFamily: MARKA_FONT_ADI, fontSize: Math.round(boyut * (marka.monogram.length > 1 ? 0.4 : 0.5)), letterSpacing: '0.02em' }}>
      {marka.monogram}
    </div>
  )
}

/** Home-screen / PWA icon: full-bleed square (maskable — the mark sits inside the safe 80 % circle). */
export function markaIkonuCiz(marka: PortalMarka, dataUrl: string | null, boyut: number): ImageResponse {
  const v = VURGU_SECENEKLERI[marka.vurgu]
  const logo = dataUrl && marka.gorsel?.tur === 'logo'
  const foto = dataUrl && marka.gorsel?.tur === 'foto'
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: logo ? '#ffffff' : foto ? KREM : v.koyu }}>
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl!} width={Math.round(boyut * 0.62)} height={Math.round(boyut * 0.62)} style={{ objectFit: 'contain' }} alt="" />
        ) : foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl!} width={boyut} height={boyut} style={{ objectFit: 'cover' }} alt="" />
        ) : (
          <div style={{ display: 'flex', color: '#fbf8f2', fontFamily: MARKA_FONT_ADI, fontSize: Math.round(boyut * (marka.monogram.length > 1 ? 0.36 : 0.46)), letterSpacing: '0.02em' }}>{marka.monogram}</div>
        )}
      </div>
    ),
    { width: boyut, height: boyut, fonts: fontlar() },
  )
}

/** Link preview (WhatsApp, iMessage, mail): the doctor's mark, name, branş · clinic, then "Sağlığım". No patient data. */
export function markaOgCiz(marka: PortalMarka, dataUrl: string | null): ImageResponse {
  const v = VURGU_SECENEKLERI[marka.vurgu]
  const adBoyu = marka.ad.length > 34 ? 52 : marka.ad.length > 24 ? 62 : 72
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: KREM, fontFamily: MARKA_FONT_ADI, color: MUREKKEP }}>
        <div style={{ width: 18, height: '100%', background: v.koyu, display: 'flex' }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 88px', flex: 1 }}>
          <Isaret marka={marka} dataUrl={dataUrl} boyut={168} yuvarlak={marka.gorsel?.tur === 'foto'} />
          <div style={{ display: 'flex', fontSize: adBoyu, marginTop: 44, lineHeight: 1.08, letterSpacing: '-0.01em' }}>{marka.ad}</div>
          {marka.altSatir ? <div style={{ display: 'flex', fontSize: 30, color: SOLUK, marginTop: 16 }}>{marka.altSatir}</div> : null}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 40 }}>
            <div style={{ width: 44, height: 3, background: v.koyu, display: 'flex' }} />
            <div style={{ display: 'flex', fontSize: 30, color: v.koyu, marginLeft: 16 }}>{BOLUM_ADI}</div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: fontlar() },
  )
}

/** Small square photo tile for the header (downscaled once; the browser caches it for a year by its version URL). */
export function fotoKaresiCiz(dataUrl: string, boyut = 256): ImageResponse {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} width={boyut} height={boyut} style={{ objectFit: 'cover' }} alt="" />
      </div>
    ),
    { width: boyut, height: boyut },
  )
}

/** Re-wrap an ImageResponse with our own cache policy (versioned URL → immutable; private: it is a per-link URL). */
export async function onbellekliPng(r: ImageResponse, cacheControl: string): Promise<Response> {
  return new Response(await r.arrayBuffer(), { headers: { 'content-type': 'image/png', 'cache-control': cacheControl, 'x-robots-tag': 'noindex', 'referrer-policy': 'no-referrer' } })
}
