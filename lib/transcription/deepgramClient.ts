// ============================================================
// NOTYA AI - Deepgram Gerçek Zamanlı Transkripsiyon
// Türkçe için optimize edilmiş streaming istemci
// ============================================================

import { createClient, LiveTranscriptionEvents, type LiveSchema } from '@deepgram/sdk'
import type { TranscriptSegment } from '@/types/notya'

const deepgramApiKey = process.env.DEEPGRAM_API_KEY!

// ============================================================
// STREAMING TRANSKRİPSİYON KONFİGÜRASYONU
// ============================================================

export const DEEPGRAM_OPTIONS: LiveSchema = {
  language: 'tr',                    // Türkçe
  model: 'nova-2-medical',           // Tıbbi terminoloji için nova-2-medical
  smart_format: true,                // Otomatik noktalama ve büyük harf
  punctuate: true,                   // Noktalama işaretleri
  diarize: true,                     // Konuşmacı ayrıştırma (doktor/hasta)
  diarize_version: '3',
  utterances: true,                  // Cümle bazlı segment
  utterance_end_ms: 1500,            // Cümle sonu algılama
  interim_results: true,             // Anlık sonuçlar
  endpointing: 500,                  // Konuşma sonu algılama (ms)
  multichannel: false,
  encoding: 'linear16',
  sample_rate: 16000,
  channels: 1,
}

// ============================================================
// DEEPGRAM TOKEN ÜRETICI (kısa ömürlü)
// ============================================================

export async function createDeepgramToken(
  sessionId: string,
  ttlSeconds: number = 3600
): Promise<{ token: string; expires_at: string }> {
  const deepgram = createClient(deepgramApiKey)
  
  // Geçici API anahtarı oluştur
  const { result, error } = await deepgram.manage.createProjectKey(
    process.env.DEEPGRAM_PROJECT_ID!,
    {
      comment: `Notya Session: ${sessionId}`,
      scopes: ['usage:write'],
      time_to_live_in_seconds: ttlSeconds,
    }
  )
  
  if (error || !result) {
    throw new Error('Deepgram token oluşturulamadı: ' + error?.message)
  }
  
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString()
  
  return {
    token: result.key,
    expires_at: expiresAt,
  }
}

// ============================================================
// TRANSKRIPT SEGMENTI PARSE
// ============================================================

export function parseDeepgramResult(data: Record<string, unknown>): TranscriptSegment | null {
  const channel = data?.channel as Record<string, unknown>
  const alternatives = channel?.alternatives as Array<Record<string, unknown>>
  
  if (!alternatives?.[0]?.transcript) return null
  
  const transcript = alternatives[0].transcript as string
  if (!transcript.trim()) return null
  
  // Konuşmacı belirleme (diarization)
  const words = alternatives[0].words as Array<Record<string, unknown>>
  const speakerIds = words?.map(w => w.speaker as number) || []
  
  // Doktor genellikle speaker 0, hasta speaker 1 (ilk konuşan doktor)
  const dominantSpeaker = speakerIds.length > 0 
    ? (speakerIds.filter(s => s === 0).length > speakerIds.length / 2 ? 0 : 1)
    : 0
  
  const start = data.start as number || 0
  const duration = data.duration as number || 0
  
  return {
    speaker: dominantSpeaker === 0 ? 'doktor' : 'hasta',
    text: transcript,
    start_ms: Math.round(start * 1000),
    end_ms: Math.round((start + duration) * 1000),
    confidence: (alternatives[0].confidence as number) || 0,
  }
}

// ============================================================
// POST-SESSION TRANSCRIPT BIRLEŞTIRICI
// ============================================================

export function mergeTranscriptSegments(segments: TranscriptSegment[]): string {
  if (!segments.length) return ''
  
  let merged = ''
  let currentSpeaker = ''
  
  for (const seg of segments) {
    if (seg.speaker !== currentSpeaker) {
      if (merged) merged += '\n'
      const label = seg.speaker === 'doktor' ? '[DOKTOR]' : 
                    seg.speaker === 'hasta' ? '[HASTA]' : '[KONUŞMACI]'
      merged += `${label}: `
      currentSpeaker = seg.speaker
    }
    merged += seg.text + ' '
  }
  
  return merged.trim()
}
