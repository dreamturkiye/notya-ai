/**
 * MBYS-YARDIMCI-02 — GET: the MBYS Yardımcısı Chrome extension as a zip, for signed-in doctors only.
 *
 * Serves the file the build step wrote (scripts/mbys-yardimci-paketle.mjs → .mbys-paket/mbys-yardimci.zip). When it is
 * missing (local dev without a build), the same packer builds it from extensions/mbys-yardimci on the fly.
 * A secretary (ön büro) gets 403: the helper fills the physician's Muayene screen. Reads no patient data.
 */
import { NextRequest, NextResponse } from 'next/server'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { PAKET_YOLU, UZANTI_DIZINI, klasoruPaketle } from '@/lib/enabiz/mbys/zipPaket.mjs'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function surum(): string {
  try {
    const m = JSON.parse(readFileSync(join(process.cwd(), UZANTI_DIZINI, 'manifest.json'), 'utf8')) as { version?: string }
    return /^[0-9.]{1,20}$/.test(String(m.version || '')) ? String(m.version) : ''
  } catch {
    return ''
  }
}

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  if (oturum.rol !== 'doktor') return NextResponse.json({ error: 'Yardımcıyı yalnızca hekim indirebilir.' }, { status: 403 })

  let zip: Buffer
  try {
    const hazir = join(process.cwd(), PAKET_YOLU)
    zip = existsSync(hazir) ? readFileSync(hazir) : klasoruPaketle(join(process.cwd(), UZANTI_DIZINI))
  } catch {
    return NextResponse.json({ error: 'Yardımcı paketi şu an hazırlanamadı.' }, { status: 503 })
  }
  const s = surum()
  return new NextResponse(new Uint8Array(zip), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="notya-mbys-yardimci${s ? `-${s}` : ''}.zip"`,
      'Content-Length': String(zip.length),
      'Cache-Control': 'private, no-store',
    },
  })
}
