/**
 * The live assistant's brain (AU-CANLI-01): the agent's Custom LLM endpoint, OpenAI chat-completions compatible, SSE.
 * The agent is configured with the server URL <site>/api/ulke/asistan-canli/ses-llm/v1; the provider adds /chat/completions.
 * Guarded twice: the server secret (header) and the signed call token (extra body). Logic: lib/ulke/asistan/sunucu.ts.
 */
import type { NextRequest } from 'next/server'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { canliLlmPost } from '@/lib/ulke/asistan/sunucu'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60
// SES-OMURGA-V2 (E): next to this country's database.
export const preferredRegion = 'lhr1'

export const POST = sinirda('asistan-canli ses-llm POST', async (req: NextRequest) => canliLlmPost(req))
