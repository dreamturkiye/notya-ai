/**
 * NOTYA-TEK-BEYIN — aynı Custom LLM ucu, Server URL'i yol eklenmeden çağıran istemciler için (…/ses-llm/v1).
 * Asıl yol: ./chat/completions. Mantık: lib/asistan/sesLlm.ts.
 */
import type { NextRequest } from 'next/server'
import { sesLlmPost } from '@/lib/asistan/sesLlm'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  return sesLlmPost(req)
}
