/**
 * NOTYA-TEK-BEYIN — ElevenLabs Custom LLM ucu (Chat Completions, SSE). Ajanın "Server URL"i
 * https://<alan>/api/asistan/ses-llm/v1 ; ElevenLabs /chat/completions ekler. Mantık: lib/asistan/sesLlm.ts.
 */
import type { NextRequest } from 'next/server'
import { sesLlmPost } from '@/lib/asistan/sesLlm'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  return sesLlmPost(req)
}
