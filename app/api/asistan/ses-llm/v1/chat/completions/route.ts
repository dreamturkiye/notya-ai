/**
 * NOTYA-TEK-BEYIN — ElevenLabs Custom LLM ucu (Chat Completions, SSE). Ajanın "Server URL"i
 * https://<alan>/api/asistan/ses-llm/v1 ; ElevenLabs /chat/completions ekler. Mantık: lib/asistan/sesLlm.ts.
 * SES-OMURGA-V2 (E): pinned next to the database (Supabase us-east-1 → iad1). GET is the no-patient health check.
 */
import type { NextRequest } from 'next/server'
import { sesLlmPost } from '@/lib/asistan/sesLlm'
import { sesSaglikGet } from '@/lib/asistan/sesSaglik'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60
export const preferredRegion = 'iad1'

export async function POST(req: NextRequest) {
  return sesLlmPost(req)
}

export async function GET(req: NextRequest) {
  return sesSaglikGet(req)
}
