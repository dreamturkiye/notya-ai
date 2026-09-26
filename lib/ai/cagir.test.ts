/**
 * NOTYA-MALIYET-01 — çağrı kapısı: GÖRSEL = GÜÇLÜ güvencesi, prompt caching biçimi, ölçüm satırının içeriksizliği.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { aiCagir, etkinSecim, gorselIcerirMi, istekGovdesi, sistemGovdesi, type AiMesaj } from './cagir'
import { kullanimSatiri } from './kullanim'
import { gucluModel, hizliModel } from './modeller'
import { dogrudanModelAdi } from './saglayici'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const GORSEL: AiMesaj[] = [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'AAAA' } }, { type: 'text', text: 'Bu nedir?' }] }]
const PDF: AiMesaj[] = [{ role: 'user', content: [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: 'AAAA' } }, { type: 'text', text: 'Çıkar' }] }]
const METIN: AiMesaj[] = [{ role: 'user', content: 'merhaba' }]

describe('GÖRSEL = GÜÇLÜ (Kaan, 2026-09-19 — istisnasız)', () => {
  it('görsel/PDF bloğu algılanır; düz metin algılanmaz', () => {
    assert.equal(gorselIcerirMi(GORSEL), true)
    assert.equal(gorselIcerirMi(PDF), true)
    assert.equal(gorselIcerirMi(METIN), false)
    assert.equal(gorselIcerirMi([{ role: 'user', content: [{ type: 'tool_result', content: [{ type: 'image', source: {} }] }] }]), true)
  })

  it('çağıran HIZLI bir görev verse bile görselde GÜÇLÜ model gider', () => {
    for (const gorev of ['siniflandirma', 'sohbet', 'kisa-yanit', 'ozet', 'bicimlendirme', 'cikarim'] as const) {
      const s = etkinSecim({ gorev, messages: GORSEL })
      assert.equal(s.kademe, 'guclu', gorev)
      assert.equal(s.model, gucluModel(), gorev)
      assert.equal(s.yukseltildi, true)
      assert.equal(istekGovdesi({ gorev, messages: PDF }).model, gucluModel(), gorev)
    }
  })

  it('görselsiz HIZLI görev HIZLI kalır; GÜÇLÜ görev yükseltme işareti taşımaz', () => {
    assert.equal(istekGovdesi({ gorev: 'siniflandirma', messages: METIN }).model, hizliModel())
    assert.equal(etkinSecim({ gorev: 'goruntu-inceleme', messages: GORSEL }).yukseltildi, false)
  })

  it('SDK istemcisine giden gerçek istek de GÜÇLÜ modeli taşır (OpenRouter yok → doğrudan Anthropic kimliği)', async () => {
    delete process.env.OPENROUTER_API_KEY
    let giden: Record<string, unknown> | null = null
    const istemci = { messages: { create: async (g: never) => { giden = g as Record<string, unknown>; return { content: [{ type: 'text', text: 'ok' }], usage: {} } } } }
    await aiCagir({ istemci, gorev: 'siniflandirma', maxTokens: 20, messages: GORSEL })
    assert.equal(giden!.model, dogrudanModelAdi(gucluModel()))
    assert.equal(giden!.max_tokens, 20)
  })
})

describe('prompt caching — system blok dizisi', () => {
  it('düz metin system aynen gider (önbelleksiz eski davranış)', () => {
    assert.equal(sistemGovdesi('SİSTEM'), 'SİSTEM')
    assert.equal(sistemGovdesi(''), undefined)
  })

  it('sabit blok cache_control alır, değişken blok almaz; sıra korunur', () => {
    assert.deepEqual(sistemGovdesi([{ metin: 'SABİT', onbellek: true }, { metin: '\nDEĞİŞKEN' }]), [
      { type: 'text', text: 'SABİT', cache_control: { type: 'ephemeral' } },
      { type: 'text', text: '\nDEĞİŞKEN' },
    ])
  })

  it('boş / yalnız boşluk bloklar atılır (API boş text bloğunu reddeder)', () => {
    assert.deepEqual(sistemGovdesi([{ metin: 'SABİT', onbellek: true }, { metin: '\n\n' }, { metin: '' }]), [
      { type: 'text', text: 'SABİT', cache_control: { type: 'ephemeral' } },
    ])
    assert.equal(sistemGovdesi([{ metin: '  ' }]), undefined)
  })

  it('en fazla 4 kırılma noktası (API sınırı)', () => {
    const b = sistemGovdesi(Array.from({ length: 6 }, (_, i) => ({ metin: `B${i}`, onbellek: true }))) as Record<string, unknown>[]
    assert.equal(b.filter((x) => x.cache_control).length, 4)
  })
})

describe('ölçüm satırı — yalnız sayaç', () => {
  it('usage sayaçları + görev + model + hekim + kademe + neden; içerik alanı yok', () => {
    const satir = kullanimSatiri({
      doctorId: '11111111-2222-3333-4444-555555555555', gorev: 'sohbet-uzman', model: 'm',
      usage: { input_tokens: 120, output_tokens: 40, cache_read_input_tokens: 3000, cache_creation_input_tokens: 0 }, stopReason: 'max_tokens',
    })
    assert.deepEqual(satir, {
      doctor_id: '11111111-2222-3333-4444-555555555555', gorev: 'sohbet-uzman', model: 'm',
      input_tokens: 120, output_tokens: 40, cache_read: 3000, cache_creation: 0, kesildi: true, kademe: null, neden: null,
    })
    assert.deepEqual(Object.keys(satir).sort(), ['cache_creation', 'cache_read', 'doctor_id', 'gorev', 'input_tokens', 'kademe', 'kesildi', 'model', 'neden', 'output_tokens'])
    const yukseltilmis = kullanimSatiri({ gorev: 'sohbet', model: 'm', kademe: 'guclu', neden: 'transport' })
    assert.equal(yukseltilmis.kademe, 'guclu')
    assert.equal(yukseltilmis.neden, 'transport')
  })

  it('UUID olmayan kimlik null yazılır; eksik/bozuk sayaç 0', () => {
    const satir = kullanimSatiri({ doctorId: 'hasta-adi', gorev: 'soap', model: 'm', usage: { input_tokens: -5, output_tokens: null } })
    assert.equal(satir.doctor_id, null)
    assert.equal(satir.input_tokens, 0)
    assert.equal(satir.output_tokens, 0)
    assert.equal(satir.kesildi, false)
  })

  it("tablo ai_token_kullanim — ai_kullanim NOTYA-KOTA-01'in günlük kota tablosudur, ona yazılmaz", () => {
    const kaynak = readFileSync(join(__dirname, 'kullanim.ts'), 'utf8')
    assert.match(kaynak, /from\('ai_token_kullanim'\)/)
    assert.doesNotMatch(kaynak, /from\('ai_kullanim'\)/)
  })

  it('ölçüm hatası çağrıyı düşürmez (yanıt null olsa bile)', async () => {
    const istemci = { messages: { create: async () => null } }
    assert.equal(await aiCagir({ istemci, gorev: 'sohbet', messages: METIN }), null)
  })
})
