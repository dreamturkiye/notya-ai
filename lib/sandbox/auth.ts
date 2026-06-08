import { NextRequest } from 'next/server'

export function getSandboxToken(req: NextRequest): string | null {
  const fromQuery = req.nextUrl.searchParams.get('token')
  if (fromQuery) return fromQuery

  const fromHeader = req.headers.get('x-sandbox-token')
  if (fromHeader) return fromHeader

  return null
}

export async function getSandboxTokenFromBody(req: NextRequest): Promise<string | null> {
  try {
    const body = await req.clone().json()
    if (body && typeof body.token === 'string') return body.token
  } catch {
    // body may be empty on GET
  }
  return null
}

export function validateSandboxToken(token: string | null): { valid: boolean; error?: string } {
  if (process.env.SANDBOX_ENABLED === 'false') {
    return { valid: false, error: 'Sandbox devre dışı' }
  }

  const expected = process.env.SANDBOX_ACCESS_TOKEN || 'dr-gokhan-beta-2026'
  if (!token || token !== expected) {
    return { valid: false, error: 'Geçersiz sandbox erişim tokeni' }
  }

  return { valid: true }
}

export async function requireSandboxAuth(req: NextRequest): Promise<{ valid: true } | { valid: false; error: string }> {
  let token = getSandboxToken(req)
  if (!token) {
    token = await getSandboxTokenFromBody(req)
  }
  const result = validateSandboxToken(token)
  if (!result.valid) {
    return { valid: false, error: result.error || 'Yetkisiz' }
  }
  return { valid: true }
}
