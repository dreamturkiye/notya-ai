/**
 * NOTYA-AYSE-ALAN-01 / NOTYA-AYSE-ANALIZ-01 — the corpus entries of the two goals, run as a plain test.
 *
 * Every entry of lib/asistan/tests/alanAnalizKorpusu.ts goes through the REAL routes (/api/asistan/chat,
 * /api/asistan/fish-tur, /api/asistan/ses-ekran) on each surface it lists, against the in-memory scene with the
 * synthetic patients — and with the read routers ON, the way production runs (the acceptance tests stub them).
 * Graded like the corpus: the route that answered, the tools the model called, what the answer contains and may
 * not contain, and — on voice — what was spoken. The model is a stand-in that makes the entry's scripted calls and
 * writes back what the tools returned (for hasta_alan: the placeholders), so a FAIL here is a server defect; whether
 * Luna makes those calls is what the live corpus run measures.
 */
import { ortam, sahneHazirla, sahneKur, oturumAc, yazi, fishTur, sonRota, aracSonuclari, encrypt, type Sahne, type SahteYanit } from './tests/ayseSahne'
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { ALAN_ANALIZ_KORPUSU, AA_ICERMEZ, type AaGirdisi, type AaYuzey } from './tests/alanAnalizKorpusu'
import { KIMLIK, kimlikHastasiEkle } from './tests/kimlikHastasi'
import { DORT_MUAYENE_ADI, dortMuayeneHastasiEkle } from './tests/dortMuayeneHastasi'

const TZ = 'Europe/Istanbul'
let sesEkran: { GET: (r: any) => Promise<Response> }
let Istek: typeof import('next/server').NextRequest

before(async () => {
  await sahneHazirla()
  Istek = (await import('next/server')).NextRequest
  sesEkran = await import('../../app/api/asistan/ses-ekran/route')
})

async function ekran(s: Sahne, oturum: string): Promise<string> {
  const y = await sesEkran.GET(new Istek(`http://localhost/api/asistan/ses-ekran?oturum=${oturum}`, { headers: { authorization: `Bearer ${s.doktor.token}` } } as ConstructorParameters<typeof Istek>[1]))
  return String(((await y.json()).turlar as { metin: string }[]).at(-1)?.metin || '')
}

const YER = /\{\{ALAN:[^}]+\}\}/g
/** The stand-in: the entry's calls, then the tool results back — for hasta_alan only the placeholders it was given. */
function vekil(g: AaGirdisi, ad: string): (istek: Record<string, any>) => SahteYanit {
  return (istek) => {
    const sonuclar = aracSonuclari({ stream: false, govde: istek })
    if (!g.vekil.length) return { metin: JSON.stringify({ speech: 'Bu cümle yönlendiricide cevaplanmalıydı.' }) }
    if (!sonuclar.length) return { metin: '', araclar: g.vekil.map((v) => ({ name: v.arac.name, input: { ...v.arac.input, ...(v.ad ? { hasta_adi: ad } : {}) } })) }
    const metin = sonuclar.map((r, i) => (g.vekil[i]?.arac.name === 'hasta_alan' ? (r.match(YER) || [r]).join(' ') : r)).join('\n\n')
    return { metin: JSON.stringify({ speech: `Hocam, ${metin}` }) }
  }
}

interface Gozlem { rota: string | null; araclar: string[]; cevap: string; sozlu: string }

async function kos(g: AaGirdisi, yuzey: AaYuzey): Promise<{ gozlem: Gozlem; doldur: (s: string) => string }> {
  const s = sahneKur()
  const kimlik = kimlikHastasiEkle(ortam.db, encrypt, s.doktor.id)
  const dort = dortMuayeneHastasiEkle(ortam.db, encrypt, s.doktor.id)
  const hasta = g.hasta === 'kimlik' ? { id: kimlik, ad: KIMLIK.ad } : { id: dort.id, ad: DORT_MUAYENE_ADI }
  const doldur = (m: string) => m.replace(/\{AD\}/g, hasta.ad).replace(/\{V([1-4])\}/g, (_t, n: string) => dort.tarih[Number(n) - 1].replace(/\./g, '\\.'))
  const oturum = g.acik ? oturumAc(s, hasta) : oturumAc(s)
  ortam.yanit = vekil(g, hasta.ad)
  const soz = g.soz.replace(/\{AD\}/g, hasta.ad)
  if (yuzey === 'yazi') {
    const y = await yazi(s, soz, { oturum, saatDilimi: TZ })
    return { gozlem: { rota: y.rota, araclar: ortam.okumaTurlari.flatMap((t) => t.araclar), cevap: y.speech, sozlu: '' }, doldur }
  }
  const v = await fishTur(s, soz, { oturum, saatDilimi: TZ })
  assert.equal(v.status, 200)
  assert.equal(v.hata, null)
  return { gozlem: { rota: sonRota(), araclar: ortam.okumaTurlari.flatMap((t) => t.araclar), cevap: await ekran(s, oturum), sozlu: v.soz }, doldur }
}

/** The corpus's grading: every reason an entry fails, not only the first. */
function degerlendir(g: AaGirdisi, o: Gozlem, yuzey: AaYuzey, doldur: (s: string) => string): string[] {
  const neden: string[] = []
  const b = g.beklenti
  if (b.rota && o.rota !== b.rota) neden.push(`rota ${o.rota}, beklenen ${b.rota}`)
  if (b.arac && JSON.stringify([...o.araclar].sort()) !== JSON.stringify([...b.arac].sort())) neden.push(`araç [${o.araclar.join(', ')}], beklenen [${b.arac.join(', ')}]`)
  for (const d of b.icerir || []) if (!new RegExp(doldur(d), 'iu').test(o.cevap)) neden.push(`cevapta yok: ${doldur(d)}`)
  for (const d of [...(b.icermez || []), ...AA_ICERMEZ]) if (new RegExp(doldur(d), 'iu').test(o.cevap)) neden.push(`cevapta olmamalı: ${doldur(d)}`)
  if (yuzey === 'ses') {
    if (!o.sozlu.trim()) neden.push('sesli tur sessiz kaldı')
    for (const d of g.sozlu?.icerir || []) if (!new RegExp(doldur(d), 'iu').test(o.sozlu)) neden.push(`sözde yok: ${doldur(d)}`)
    for (const d of [...(g.sozlu?.icermez || []), '\\{\\{', '\\}\\}']) if (new RegExp(doldur(d), 'iu').test(o.sozlu)) neden.push(`sözde olmamalı: ${doldur(d)}`)
  }
  return neden
}

describe('korpus girdileri — biçim ve kaynak', () => {
  it('kimlikler tekil; her girdinin kaynağı var ve dosya yerinde; türetilmiş girdi nasıl türetildiğini söyler', () => {
    assert.equal(new Set(ALAN_ANALIZ_KORPUSU.map((g) => g.id)).size, ALAN_ANALIZ_KORPUSU.length)
    for (const g of ALAN_ANALIZ_KORPUSU) {
      assert.ok(g.kaynak.length >= 1 && g.yuzeyler.length >= 1, g.id)
      for (const k of g.kaynak) assert.ok(existsSync(new URL(`../../${k.dosya}`, import.meta.url)), `${g.id}: kaynak yok — ${k.dosya}`)
      if (g.turetilmis) assert.ok((g.not || '').length >= 20, `${g.id}: türetilmiş girdi açıklamasız`)
    }
  })

  it('türetilmemiş girdinin cümlesi kaynağında geçer (hasta adı dışında)', () => {
    const duz = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').trim()
    for (const g of ALAN_ANALIZ_KORPUSU.filter((x) => !x.turetilmis)) {
      // The part of the sentence after the patient's name: what the source quotes.
      const cekirdek = duz(g.soz.replace(/^\{AD\}\S*\s+(için\s+)?/, '').replace(/^son\s+/i, ''))
      assert.ok(g.kaynak.some((k) => duz(readFileSync(new URL(`../../${k.dosya}`, import.meta.url), 'utf8')).includes(cekirdek)), `${g.id}: "${cekirdek}" kaynağında yok`)
    }
  })
})

describe('korpus koşusu — gerçek rotalar, yönlendiriciler açık (vekil model)', () => {
  const sonuclar: { id: string; yuzey: AaYuzey; neden: string[] }[] = []

  for (const g of ALAN_ANALIZ_KORPUSU) {
    for (const yuzey of g.yuzeyler) {
      it(`${g.id} [${yuzey}${g.acik ? ', dosya açık' : ''}] ${g.soz}`, async () => {
        const { gozlem, doldur } = await kos(g, yuzey)
        const neden = degerlendir(g, gozlem, yuzey, doldur)
        sonuclar.push({ id: g.id, yuzey, neden })
        assert.deepEqual(neden, [], `${g.id} [${yuzey}] FAIL\n  cevap: ${gozlem.cevap.slice(0, 400)}\n  söz: ${gozlem.sozlu.slice(0, 200)}`)
      })
    }
  }

  it('toplam: her girdi her yüzeyde koştu, FAIL yok', () => {
    const beklenen = ALAN_ANALIZ_KORPUSU.reduce((n, g) => n + g.yuzeyler.length, 0)
    assert.equal(sonuclar.length, beklenen)
    assert.deepEqual(sonuclar.filter((r) => r.neden.length).map((r) => `${r.id}[${r.yuzey}]`), [])
  })
})
