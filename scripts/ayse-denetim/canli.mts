#!/usr/bin/env npx tsx
/**
 * NOTYA-AYSE-STANDART-01 — Ayşe dosya sorgulama standardının CANLI denetimi.
 *
 * Bir doktor oturum jetonuyla standarttaki 10 soruyu /api/asistan/chat'e (aynı asistan oturumu, aynı hasta) sırayla
 * sorar, her cevabı kural kontrolünden geçirir (lib/asistan/dosyaSorgu/denetim/puanla.ts) ve
 * docs/denetim/YYYY-MM-DD-<etiket>.md yazar. Deterministik katmanın altın testleri ayrıdır (denetim.test.ts, npm test).
 *
 * YALNIZ QA / sentetik hasta ve QA doktor hesabı. Dr. Gökhan'ın hesabına ve gerçek hastaya KOŞMA — rapor cevap
 * metnini (klinik veri) repoya yazar. Jeton sahibinin e-postası YASAK_DESENİ ile eşleşirse betik durur.
 *
 *   AYSE_DENETIM_TOKEN=<QA doktor JWT> npx tsx scripts/ayse-denetim/canli.mts --hasta <patientId> --etiket qa-cocuk-a \
 *     [--url http://localhost:3199] [--ad "QA Çocuk A"] [--specialty pediatri] [--sorular 1,4,9]
 */
import fs from 'node:fs'
import path from 'node:path'
import { DENETIM_SORULARI, cevabiPuanla, denetimRaporu, type CevapPuani } from '../../lib/asistan/dosyaSorgu/denetim/puanla'

const arg = (ad: string) => { const i = process.argv.indexOf(`--${ad}`); return i > 0 ? process.argv[i + 1] : undefined }
const URL_KOK = (arg('url') || process.env.AYSE_DENETIM_URL || 'http://localhost:3199').replace(/\/$/, '')
const TOKEN = process.env.AYSE_DENETIM_TOKEN || arg('token') || ''
const HASTA = arg('hasta') || ''
const ETIKET = (arg('etiket') || 'qa').replace(/[^a-z0-9-]/gi, '-').toLowerCase()
const AD = arg('ad')
const BRANS = arg('specialty') || 'pediatri'
const SECIM = arg('sorular')?.split(',').map(Number)

/** Gerçek hekim hesapları — canlı denetim bunlara koşmaz (brief: Dr. Gökhan'ın hesabı değil). */
const YASAK_DESENI = /mamur|gokhan|gökhan/i

function jwtEposta(t: string): string {
  try { return String(JSON.parse(Buffer.from(t.split('.')[1], 'base64url').toString('utf8')).email || '') } catch { return '' }
}

async function main() {
  if (!TOKEN || !HASTA) {
    console.error('Kullanım: AYSE_DENETIM_TOKEN=<jwt> npx tsx scripts/ayse-denetim/canli.mts --hasta <patientId> --etiket <ad>')
    process.exit(2)
  }
  const eposta = jwtEposta(TOKEN)
  if (YASAK_DESENI.test(eposta) || YASAK_DESENI.test(process.env.AYSE_DENETIM_YASAK || '')) {
    console.error(`Durdu: ${eposta || 'bu hesap'} gerçek bir hekim hesabı görünüyor — canlı denetim yalnız QA hesabıyla koşar.`)
    process.exit(3)
  }
  const sorular = DENETIM_SORULARI.filter((_, i) => !SECIM || SECIM.includes(i + 1))
  let oturum: string | null = null
  const sonuclar: { puan: CevapPuani; cevap: string; ms: number }[] = []
  for (const s of sorular) {
    const t0 = Date.now()
    const r = await fetch(`${URL_KOK}/api/asistan/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ message: s.soru, patientId: HASTA, asistanSessionId: oturum, specialty: BRANS }),
    })
    const j = await r.json().catch(() => ({})) as { success?: boolean; error?: string; data?: { speech?: string; asistanSessionId?: string } }
    const ms = Date.now() - t0
    const cevap = j.data?.speech || (j.error ? `HATA ${r.status}: ${j.error}` : `HATA ${r.status}`)
    oturum = j.data?.asistanSessionId || oturum
    const puan = cevabiPuanla(s.tur, cevap, { hastaAdi: AD })
    sonuclar.push({ puan, cevap, ms })
    console.log(`${puan.no}. ${s.tur.padEnd(13)} ${puan.puan}/${puan.azami}  ${(ms / 1000).toFixed(1)} sn`)
  }
  const tarih = new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10)
  const dosya = path.join(process.cwd(), 'docs', 'denetim', `${tarih}-${ETIKET}.md`)
  fs.mkdirSync(path.dirname(dosya), { recursive: true })
  fs.writeFileSync(dosya, denetimRaporu({ tarih, etiket: ETIKET, ortam: URL_KOK, sonuclar }))
  console.log(`Rapor: ${path.relative(process.cwd(), dosya)}`)
}

await main()
