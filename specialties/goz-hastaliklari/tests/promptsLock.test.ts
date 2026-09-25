import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { GOZ_PROMPT_DOSYALARI, gozAracHaritasi, gozKilidi, gozMi, gozPromptlari, gozReceteDozsuz } from '../prompts'
import { GOZ_TOOLS } from '../prompts/tools'
import { KAYNAK_SIRASI } from '../protocols/sources'
import { dozKilitliBrans, pediatrikKapsam, soapPersonaAnahtari, soapSistemPromptu } from '../../../lib/doktor/soapUret'

// GOZ-PROMPTS-LOCK — same prompts rubric as dahiliye / dermatoloji: (a) complete, (b) goldens / no book text, (c) wired at runtime, (d) hekim lock.
const kok = path.join(import.meta.dirname, '..', '..', '..')
const kaynak = (p: string) => fs.readFileSync(path.join(kok, p), 'utf8')
const ADIMLAR = ['serit', 'olcum', 'olcum_nota', 'fundus', 'fundus_nota', 'kopya', 'glokom', 'dr', 'dr_sevk_kapat', 'enjeksiyon', 'sgk_kapi', 'sgkrapor', 'sgkrapor_kilit', 'katarakt', 'goruntu_okuma', 'kontrol', 'pediatrik', 'onsegment', 'kuru_goz', 'acil', 'intake_nota', 'gorev', 'serit_nota', 'fundus_dr', 'lazer', 'biyomikroskopi', 'keratokonus', 'on_segment_nota', 'katarakt_postop', 'katarakt_nota', 'rop', 'acil_kayit', 'acil_nota', 'oct_olcum', 'hatirlatma']
/** GET-computed steps (no POST adım): şerit, kopya taslağı, ön segment protokolleri — checked as GET response keys. */
const GET_ADIMLARI: Record<string, string> = { serit: 'serit,', kopya: 'kopya,', onsegment: 'protokoller: ON_SEGMENT_PROTOKOLLERI' }

describe('(a) göz prompts exist and are complete', () => {
  it('system.md, soap-goz.md, asistan-ogrenme.md load non-empty; SOAP has S/O/A/P; tools.ts has every step', () => {
    const p = gozPromptlari()
    for (const k of Object.keys(GOZ_PROMPT_DOSYALARI) as (keyof typeof GOZ_PROMPT_DOSYALARI)[]) assert.ok(p[k].length > 80, k)
    assert.ok(p.soap.includes('**S:**') && p.soap.includes('**O:**') && p.soap.includes('**A:**') && p.soap.includes('**P:**'))
    assert.deepEqual(GOZ_TOOLS.map((t) => t.name), ADIMLAR.map((a) => `goz.${a}`))
  })
  const apiYolu = path.join(kok, 'app/api/doktor/goz/route.ts')
  it('every tools.ts step exists in the göz API', { skip: !fs.existsSync(apiYolu) && 'app/api/doktor/goz/route.ts henüz yok' }, () => {
    const api = kaynak('app/api/doktor/goz/route.ts') + kaynak('app/api/doktor/goz/_ek.ts')
    for (const a of ADIMLAR) assert.ok(GET_ADIMLARI[a] ? api.includes(GET_ADIMLARI[a]) : new RegExp(`adim === ['"]${a}['"]`).test(api), `adım yok: ${a}`)
  })
})

describe('(b) goldens, no book text', () => {
  it('Kaynak hiyerarşisi line equals KAYNAK_SIRASI (TR first, same order); conflict rule present', () => {
    const s = gozPromptlari().system
    const satir = s.split('\n').find((l) => l.startsWith('SUT_4233'))!
    assert.deepEqual(satir.split('·').map((x) => x.trim()), KAYNAK_SIRASI)
    assert.ok(s.includes('Çakışmada TOD / SB / TEMD / SUT kazanır; iki kaynağı da göster'))
  })
  it('short files, no long quoted passages', () => {
    for (const m of Object.values(gozPromptlari())) { assert.ok(m.length < 3000); assert.ok(m.split('\n').every((l) => l.length < 400)); assert.ok(!/«|»|“[^”]{120,}”/.test(m)) }
  })
})

describe('(c) wired into the runtime call paths', () => {
  it('SOAP system prompt carries the göz lock (session key or users.specialty), not for other branches', () => {
    const d = soapSistemPromptu({ transcript: '', specialty: 'goz-hastaliklari' })
    assert.ok(d.includes('=== GÖZ HASTALIKLARI SİSTEM KİLİDİ')); assert.ok(d.includes('Kırılmaz kurallar')); assert.ok(d.includes('SOAP — göz muayenesi')); assert.ok(d.includes('- goruntu_okuma: '))
    assert.ok(soapSistemPromptu({ transcript: '', specialty: 'genel', doktorBransi: 'Göz Hastalıkları' }).includes('GÖZ HASTALIKLARI SİSTEM KİLİDİ'))
    assert.ok(!soapSistemPromptu({ transcript: '', specialty: 'pediatri', doktorBransi: 'pediatri' }).includes('GÖZ HASTALIKLARI'))
    assert.ok(!soapSistemPromptu({ transcript: '', specialty: 'dahiliye' }).includes('GÖZ HASTALIKLARI'))
    assert.ok(!soapSistemPromptu({ transcript: '', specialty: 'dermatoloji', doktorBransi: 'dermatoloji' }).includes('GÖZ HASTALIKLARI'))
  })
  it('no other specialty lock bleeds into a göz prompt; adult rules, persona from session key or users.specialty', () => {
    assert.equal(soapPersonaAnahtari({ specialty: 'genel', doktorBransi: 'Göz Hastalıkları' }), 'goz-hastaliklari')
    assert.ok(!pediatrikKapsam('goz-hastaliklari', 'Göz Hastalıkları'))
    for (const girdi of [{ specialty: 'goz-hastaliklari' }, { specialty: 'genel', doktorBransi: 'Göz Hastalıkları' }]) {
      const d = soapSistemPromptu({ transcript: '', ...girdi })
      assert.ok(d.startsWith('Sen Ayşe Kaya'))
      assert.ok(!d.includes('DAHİLİYE') && !d.includes('KADIN HASTALIKLARI VE DOĞUM') && !d.includes('DERMATOLOJİ'))
      assert.ok(!/pediatride|Büyüme persentil|BÜYÜME\/VKİ|Veli beyanı|veliye/.test(d))
    }
  })
  it('gozMi matches göz / oftalm only (no gözlem-style false positives)', () => {
    assert.ok(gozMi('Göz Hastalıkları')); assert.ok(gozMi(null, 'goz-hastaliklari')); assert.ok(gozMi('Oftalmoloji')); assert.ok(gozMi('GÖZ'))
    for (const b of ['pediatri', 'dahiliye', 'kadin-dogum', 'dermatoloji', 'gozlemci', 'gözlem', 'Gözetim']) assert.ok(!gozMi(b), b)
    assert.ok(!gozMi(null, undefined))
  })
  it('asistan / ses / ogrenme blocks', () => {
    const a = gozKilidi('asistan'); assert.ok(a.includes('ÖNCELİKLİDİR') && a.includes(gozAracHaritasi()) && !a.includes('SOAP — göz muayenesi'))
    const s = gozKilidi('ses'); assert.ok(s.length < 1600 && s.includes('Doz yazma') && s.includes('yalnız hekim kilitler') && s.includes('112') && !s.includes('KANSKI'))
    assert.ok(gozKilidi('ogrenme').includes('doz kalıpları öğrenilse bile taslağa yazılmaz'))
  })
  it('call sites use the loader (chat, hafıza/voice, SOAP, distiller, next.config tracing)', () => {
    assert.ok(kaynak('lib/asistan/ayseCevapla.ts').includes('gozKilidi("asistan")'))
    assert.ok(kaynak('app/api/doktor/hafiza/route.ts').includes("gozKilidi('ses')"))
    assert.ok(kaynak('lib/doktor/soapUret.ts').includes("gozKilidi('soap')"))
    assert.ok(kaynak('lib/doktor/soapUret.ts').includes("gozKilidi('ogrenme')"))
    assert.ok(kaynak('next.config.mjs').includes('./specialties/goz-hastaliklari/prompts/*.md'))
  })
})

describe('(d) hekim lock language + enforced in code', () => {
  it('system.md: dose, tanı/evre, imaging, VA/GİB, acil, SGK rules', () => {
    const s = gozPromptlari().system
    assert.ok(s.includes('Doz yazma (intravitreal dahil)')); assert.ok(s.includes('yalnız hekim kilitler')); assert.ok(s.includes('DR evresini sohbetten veya transkriptten çıkarma'))
    assert.ok(s.includes('karar desteğidir, tanı değildir') && s.includes('dual-sign'))
    assert.ok(s.includes('Sağ göz = OD, Sol göz = OS')); assert.ok(s.includes('112'))
    assert.ok(s.includes('Muayenehane SGK basamağı değildir') && s.includes('Faricimab / brolucizumab SUT\'ta yok'))
    assert.ok(!/Neyzi/.test(s.replace('Neyzi, aşı takvimi', '')))
    const soap = gozPromptlari().soap
    assert.ok(soap.includes('Doz yok')); assert.ok(soap.includes('Hekim kilitleri'))
    for (const y of ['soap', 'asistan'] as const) assert.ok(gozKilidi(y).includes('iç alan veya araç adı yazma'), y)
    assert.ok(gozKilidi('soap').includes('receteOnerisi: yalnız etken madde / sınıf — doz, kullanım sıklığı ve mg YAZMA'))
  })
  it('code-level dose lock applies to göz (SOAP + chat) and reçete önerisi is stripped', () => {
    assert.ok(dozKilitliBrans('goz-hastaliklari')); assert.ok(dozKilitliBrans(null, 'Göz Hastalıkları'))
    assert.ok(kaynak('lib/doktor/soapUret.ts').includes('dozKilitliBrans(girdi.specialty, girdi.doktorBransi) ? soapDozKilidi('))
    assert.ok(kaynak('lib/asistan/ayseCevapla.ts').includes('if (dozKilitliBrans(hekimBransi, specialty))'))
    const r = gozReceteDozsuz<{ etkenMadde?: string; ticariOrnek?: string; doz?: string; kullanim?: string; not?: string }>([{ etkenMadde: 'latanoprost', ticariOrnek: 'Xalatan %0,005', doz: '1 damla', kullanim: '1x1 akşam' }])
    assert.equal(r[0].doz, undefined); assert.equal(r[0].kullanim, undefined); assert.equal(r[0].etkenMadde, 'latanoprost'); assert.ok(r[0].not!.includes('Doz hekim yazar'))
  })
})
