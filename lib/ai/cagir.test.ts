/**
 * NOTYA-MALIYET-01 + NOTYA-MODEL-LUNA-02 — çağrı kapısı: birincil Luna (görsel dahil), güvenlik yükseltmesi, prompt
 * caching biçimi, ölçüm satırının içeriksizliği.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { aiCagir, etkinSecim, gorselIcerirMi, istekGovdesi, lunaZamanAsimiMs, sistemGovdesi, type AiMesaj } from './cagir'
import { kullanimSatiri } from './kullanim'
import { gucluModel, hizliModel, type Gorev } from './modeller'
import { dogrudanModelAdi } from './saglayici'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const GORSEL: AiMesaj[] = [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'AAAA' } }, { type: 'text', text: 'Bu nedir?' }] }]
const PDF: AiMesaj[] = [{ role: 'user', content: [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: 'AAAA' } }, { type: 'text', text: 'Çıkar' }] }]
const METIN: AiMesaj[] = [{ role: 'user', content: 'merhaba' }]
const TUM_GOREVLER: Gorev[] = ['soap', 'not-uretimi', 'klinik-analiz', 'goruntu-inceleme', 'uzman-analiz', 'sohbet-uzman', 'sohbet', 'siniflandirma', 'ozet', 'bicimlendirme', 'cikarim', 'kisa-yanit']

describe('LUNA-02 — birincil Luna her görevde, görsel/PDF dahil (GÖRSEL = GÜÇLÜ emekli, Kaan 2026-09-26)', () => {
  it('görsel/PDF bloğu algılanır; düz metin algılanmaz', () => {
    assert.equal(gorselIcerirMi(GORSEL), true)
    assert.equal(gorselIcerirMi(PDF), true)
    assert.equal(gorselIcerirMi(METIN), false)
    assert.equal(gorselIcerirMi([{ role: 'user', content: [{ type: 'tool_result', content: [{ type: 'image', source: {} }] }] }]), true)
  })

  it('görsel/PDF artık HIZLI gider — görüntü-inceleme dahil, yükseltme yok', () => {
    for (const gorev of TUM_GOREVLER) {
      const s = etkinSecim({ gorev, messages: GORSEL })
      assert.equal(s.kademe, 'hizli', gorev)
      assert.equal(s.model, hizliModel(), gorev)
      assert.equal(s.yukseltildi, false, gorev)
      assert.equal(s.neden, null, gorev)
      assert.equal(istekGovdesi({ gorev, messages: PDF }).model, hizliModel(), gorev)
    }
  })

  it('klinik görev (soap, sohbet-uzman, klinik-analiz…) sinyalsiz metinde birincil HIZLI', () => {
    for (const gorev of ['soap', 'not-uretimi', 'klinik-analiz', 'uzman-analiz', 'sohbet-uzman'] as Gorev[]) {
      const s = etkinSecim({ gorev, messages: [{ role: 'user', content: 'üç gündür öksürük ve ateş' }] })
      assert.deepEqual([s.kademe, s.model, s.neden], ['hizli', hizliModel(), null], gorev)
    }
  })

  it('LUNAPRO-02: güvenlik sinyali yönlendirmeyi değiştirmez — her görevde birincil, neden null; sinyal yalnız işaretlenir', () => {
    for (const gorev of TUM_GOREVLER) {
      const s = etkinSecim({ gorev, messages: [{ role: 'user', content: 'hasta 12 haftalık gebe, ne yazalım' }] })
      assert.deepEqual([s.kademe, s.model, s.yukseltildi, s.neden, s.guvenlikSinyali], ['hizli', hizliModel(), false, null, true], gorev)
    }
    const g = etkinSecim({ gorev: 'goruntu-inceleme', messages: [{ role: 'user', content: [{ type: 'image', source: {} }, { type: 'text', text: 'isotretinoin öncesi lezyon' }] }] })
    assert.equal(g.neden, null); assert.equal(g.guvenlikSinyali, true)
  })
  it('LUNAPRO-02: dosya bağlamındaki sinyal de yönlendirmez; sabit system metni taranmaz', () => {
    const mesaj: AiMesaj[] = [{ role: 'user', content: 'kontrol ne zaman olsun' }]
    const w = etkinSecim({ gorev: 'sohbet-uzman', messages: mesaj, guvenlikBaglami: 'Sürekli ilaç: Warfarin 5 mg' })
    assert.equal(w.neden, null); assert.equal(w.guvenlikSinyali, true); assert.equal(w.model, hizliModel())
    assert.equal(etkinSecim({ gorev: 'sohbet-uzman', messages: mesaj, guvenlikBaglami: 'Alerji: yok' }).guvenlikSinyali, false)
    assert.equal(istekGovdesi({ gorev: 'soap', system: 'Gebelikte kontrendike ilaçları yazma.', messages: mesaj }).model, hizliModel())
  })
  it('OpenRouter yok → Luna gidemez; görsel istek GÜÇLÜ doğrudan kimliğine düşer (transport), tavan korunur', async () => {
    const eski = process.env.OPENROUTER_API_KEY
    delete process.env.OPENROUTER_API_KEY
    try {
      let giden: Record<string, unknown> | null = null
      const istemci = { messages: { create: async (g: never) => { giden = g as Record<string, unknown>; return { content: [{ type: 'text', text: 'ok' }], usage: {} } } } }
      await aiCagir({ istemci, gorev: 'siniflandirma', maxTokens: 20, messages: GORSEL })
      assert.equal(giden!.model, dogrudanModelAdi(gucluModel()))
      assert.equal(giden!.max_tokens, 20)
    } finally {
      if (eski !== undefined) process.env.OPENROUTER_API_KEY = eski
    }
  })

  it('Luna zaman aşımı max_tokens ile büyür: kısa iş 25 sn, SOAP/görüntü 60 sn tavan', () => {
    assert.equal(lunaZamanAsimiMs(20), 25_000)
    assert.equal(lunaZamanAsimiMs(1600), 25_000)
    assert.equal(lunaZamanAsimiMs(4000), 32_000)
    assert.equal(lunaZamanAsimiMs(8000), 60_000)
    assert.equal(lunaZamanAsimiMs(12000), 60_000)
    assert.equal(lunaZamanAsimiMs(undefined), 25_000)
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

describe('NOTYA-AYSE-100 D1 — direct Anthropic path drops leading thinking blocks', () => {
  it('content[0] is the text block again, tool_use kept', async () => {
    const { dusunmeBloklariniAt } = await import('./cagir')
    const y = dusunmeBloklariniAt({ content: [{ type: 'thinking', thinking: '', signature: 'x' }, { type: 'text', text: '{"speech":"Merhaba"}' }, { type: 'tool_use', id: 't', name: 'a', input: {} }] })
    assert.equal((y.content as { type: string }[])[0].type, 'text')
    assert.equal((y.content as unknown[]).length, 2)
  })
  it('aiCagir on the direct path returns text at content[0] when the SDK answers with thinking first', async () => {
    const eski = process.env.OPENROUTER_API_KEY
    delete process.env.OPENROUTER_API_KEY
    try {
      const istemci = { messages: { create: async () => ({ model: 'claude-sonnet-5', content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: 'ok' }], stop_reason: 'end_turn', usage: {} }) } }
      const y = await aiCagir({ gorev: 'sohbet-uzman', doctorId: 'd', system: 's', messages: [{ role: 'user', content: 'x' }], istemci: istemci as never })
      assert.equal(y.content[0]?.type, 'text')
    } finally { if (eski !== undefined) process.env.OPENROUTER_API_KEY = eski }
  })
})
