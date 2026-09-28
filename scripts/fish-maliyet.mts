#!/usr/bin/env npx tsx
/**
 * NOTYA-SES-FISH-UCTAN-UCA-01 — bir Ayşe Kaya (Fish yolu) görüşmesinin dakika başı gerçek maliyeti.
 *
 *   npx --yes tsx scripts/fish-maliyet.mts <asistan_session_id>            # stdout
 *   npx --yes tsx scripts/fish-maliyet.mts <asistan_session_id> --yaz      # + docs/denetim/<tarih>-fish-maliyet-<id8>.md
 *
 * Okur (salt okuma, .env.local'daki SUPABASE_SERVICE_ROLE_KEY): ses_kullanim (Deepgram sn, Fish bayt — migration 110),
 * asistan_sessions (doktor), ai_token_kullanim (o doktorun bu görüşme penceresindeki model çağrıları).
 * SINIR: ai_token_kullanim'da oturum kimliği yok — pencere [ilk sayaç − 1 dk, son sayaç + 2 dk] içindeki aynı doktorun
 * TÜM çağrıları sayılır (aynı anda yazılı sohbet / not üretimi varsa model kalemi şişer). Test görüşmesinde doktor
 * başka iş yapmamalı. Hesap: lib/asistan/fishMaliyet.ts (oranı doğrulanmayan kalem TODO kalır).
 */
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { DEEPGRAM_NORMAL_DAKIKA, DOGRULANMIS_ORANLAR, FISH_UCRETLI_MODEL, maliyetHesapla, maliyetRaporuMetni, type OturumKullanimi } from '../lib/asistan/fishMaliyet'

for (const f of ['.env.local', '.env']) {
  const p = path.join(process.cwd(), f)
  if (!fs.existsSync(p)) continue
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!m || process.env[m[1]]) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    process.env[m[1]] = v
  }
}

const oturumId = process.argv[2]
if (!oturumId || !/^[0-9a-f-]{36}$/i.test(oturumId)) {
  console.error('Kullanım: npx --yes tsx scripts/fish-maliyet.mts <asistan_session_id> [--yaz]')
  process.exit(2)
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const { data: oturum, error: oHata } = await sb.from('asistan_sessions').select('id, doctor_id').eq('id', oturumId).maybeSingle()
if (oHata || !oturum) { console.error('Oturum bulunamadı'); process.exit(1) }
const { data: sayaclar, error: sHata } = await sb.from('ses_kullanim')
  .select('created_at, kaynak, olcu, miktar, model').eq('asistan_session_id', oturumId).order('created_at')
if (sHata) { console.error('ses_kullanim okunamadı (migration 110 uygulandı mı?)', sHata.message); process.exit(1) }
const satirlar = (sayaclar || []) as { created_at: string; kaynak: string; olcu: string; miktar: number; model: string | null }[]
if (!satirlar.length) { console.error('Bu oturumda sayaç yok — Fish yolunda bir görüşme değil ya da sayaç yazılmadı'); process.exit(1) }

const topla = (kaynak: string, olcu: string) => satirlar.filter((s) => s.kaynak === kaynak && s.olcu === olcu).reduce((a, s) => a + Number(s.miktar || 0), 0)
const fishModelleri = [...new Set(satirlar.filter((s) => s.kaynak === 'fish').map((s) => s.model).filter(Boolean))] as string[]
const bas = new Date(new Date(satirlar[0].created_at).getTime() - 60_000).toISOString()
const son = new Date(new Date(satirlar[satirlar.length - 1].created_at).getTime() + 120_000).toISOString()
const { data: tokenlar } = await sb.from('ai_token_kullanim')
  .select('input_tokens, output_tokens, cache_read, cache_creation')
  .eq('doctor_id', (oturum as { doctor_id: string }).doctor_id).gte('created_at', bas).lte('created_at', son)
const t = (tokenlar || []) as { input_tokens: number; output_tokens: number; cache_read: number; cache_creation: number }[]

const k: OturumKullanimi = {
  oturumSaniye: topla('deepgram', 'oturum_saniye'),
  deepgramSesSaniye: topla('deepgram', 'ses_saniye'),
  deepgramBaglantiSaniye: topla('deepgram', 'baglanti_saniye'),
  fishBayt: topla('fish', 'utf8_bayt'),
  fishModel: fishModelleri.length === 1 ? fishModelleri[0] : (fishModelleri.length ? fishModelleri.join('+') : null),
  model: {
    cagri: t.length,
    input: t.reduce((a, x) => a + (x.input_tokens || 0), 0),
    output: t.reduce((a, x) => a + (x.output_tokens || 0), 0),
    cacheRead: t.reduce((a, x) => a + (x.cache_read || 0), 0),
    cacheCreation: t.reduce((a, x) => a + (x.cache_creation || 0), 0),
  },
}
const rapor = maliyetHesapla(k)
const metin = maliyetRaporuMetni(oturumId, k, rapor, {
  ucretliFish: maliyetHesapla({ ...k, fishModel: FISH_UCRETLI_MODEL }),
  normalDeepgram: maliyetHesapla(k, { ...DOGRULANMIS_ORANLAR, deepgramDakika: DEEPGRAM_NORMAL_DAKIKA }),
})
process.stdout.write(metin)
if (process.argv.includes('--yaz')) {
  const dosya = path.join('docs', 'denetim', `${new Date().toISOString().slice(0, 10)}-fish-maliyet-${oturumId.slice(0, 8)}.md`)
  fs.writeFileSync(dosya, metin)
  console.error(`yazıldı: ${dosya}`)
}
