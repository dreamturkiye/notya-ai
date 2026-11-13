import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { SupabaseClient } from '@supabase/supabase-js'
import { uslupPaylasilabilirMi, havuzKurallariniSec, kapaliAnahtar, klinikUslupAc, klinikUslupKapat, klinikKurallariYukle, klinikHavuzuSenkronla, type PaylasilacakKural } from './klinikUslup'

type Row = Record<string, unknown>
function fakeSb(db: Record<string, Row[]>): SupabaseClient {
  const from = (tablo: string) => {
    db[tablo] ||= []
    let rows = db[tablo]
    let mod: 'select' | 'delete' | 'update' = 'select'
    let patch: Row = {}
    const filtre: ((r: Row) => boolean)[] = []
    const q: Record<string, unknown> = {}
    const uygula = () => rows.filter((r) => filtre.every((f) => f(r)))
    const bitir = () => {
      if (mod === 'delete') { db[tablo] = rows.filter((r) => !uygula().includes(r)); rows = db[tablo]; return { data: null, error: null } }
      if (mod === 'update') { uygula().forEach((r) => Object.assign(r, patch)); return { data: null, error: null } }
      return { data: uygula(), error: null }
    }
    for (const op of ['select', 'order', 'limit']) q[op] = () => q
    q.eq = (k: string, v: unknown) => { filtre.push((r) => r[k] === v); return q }
    q.neq = (k: string, v: unknown) => { filtre.push((r) => r[k] !== v); return q }
    q.in = (k: string, v: unknown[]) => { filtre.push((r) => v.includes(r[k])); return q }
    q.like = (k: string, p: string) => { const re = new RegExp('^' + p.replace(/%/g, '.*') + '$'); filtre.push((r) => re.test(String(r[k]))); return q }
    q.maybeSingle = () => ({ data: uygula()[0] ?? null, error: null })
    q.delete = () => { mod = 'delete'; return q }
    q.update = (p: Row) => { mod = 'update'; patch = p; return q }
    q.insert = (x: Row | Row[]) => { rows.push(...(Array.isArray(x) ? x : [x]).map((r) => ({ ...r }))); return { data: null, error: null } }
    q.upsert = (x: Row, o: { onConflict: string }) => {
      const keys = o.onConflict.split(',')
      const var_ = rows.find((r) => keys.every((k) => r[k] === x[k]))
      if (var_) Object.assign(var_, x); else rows.push({ ...x })
      return { data: null, error: null }
    }
    q.then = (res: (v: unknown) => unknown) => res(bitir())
    return q
  }
  return { from } as unknown as SupabaseClient
}

const kural = (o: Partial<PaylasilacakKural>): PaylasilacakKural => ({ anahtar: 'terim-gerektiginde-luzumlu-halde', kategori: 'uslup', deger: '"gerektiğinde" yerine "lüzumlu halde" yaz', kaynak: 'duzeltme', kanit_sayisi: 3, durum: 'uygulanir', aktif: true, ...o })

test('paylaşım süzgeci: yalnız terim/uzunluk/sıra; ilaç, doz, silme/ekleme/yeniden asla', () => {
  assert.equal(uslupPaylasilabilirMi(kural({})), true)
  assert.equal(uslupPaylasilabilirMi(kural({ anahtar: 'uzunluk-plan', deger: 'Bu bölümü daha kısa tut', kanit_sayisi: 2 })), true)
  assert.equal(uslupPaylasilabilirMi(kural({ anahtar: 'sira-plan', deger: 'Bölüm sırası: tedavi → takip', kanit_sayisi: 2 })), true)
  for (const anahtar of ['ilac-amoksisilin-augmentin', 'doz-bicimi-gunluk-toplam', 'silme-plan-bol-sivi', 'ekleme-plan-x', 'yeniden-plan']) {
    assert.equal(uslupPaylasilabilirMi(kural({ anahtar, kategori: 'uslup' })), false, anahtar)
  }
  assert.equal(uslupPaylasilabilirMi(kural({ kategori: 'klinik' })), false)
  assert.equal(uslupPaylasilabilirMi(kural({ kaynak: 'doktor_soyledi' })), false)
  assert.equal(uslupPaylasilabilirMi(kural({ durum: 'kapali' })), false)
  assert.equal(uslupPaylasilabilirMi(kural({ aktif: false })), false)
  assert.equal(uslupPaylasilabilirMi(kural({ kanit_sayisi: 2 })), false, 'terim 3 kanıt ister')
})

test('paylaşım süzgeci: ilaç adı, doz ve sayı içeren terim paylaşılmaz', () => {
  assert.equal(uslupPaylasilabilirMi(kural({ deger: '"amoksisilin" yerine "augmentin" yaz' })), false)
  assert.equal(uslupPaylasilabilirMi(kural({ deger: '"parasetamol" yerine "ibuprofen" yaz' })), false)
  assert.equal(uslupPaylasilabilirMi(kural({ deger: '"500 mg" yerine "250 mg" yaz' })), false)
  assert.equal(uslupPaylasilabilirMi(kural({ deger: '"dose" yerine "doz2" yaz' })), false)
  assert.equal(uslupPaylasilabilirMi(kural({ deger: '"a" yerine "b" yaz ve 5 mg ekle' })), false)
  assert.equal(uslupPaylasilabilirMi(kural({ deger: '"gerektiğinde" yerine "Ahmet" yaz' })), false, 'izin listesinde olmayan sözcük (ad olabilir)')
  assert.equal(uslupPaylasilabilirMi(kural({ deger: '"kontrol" yerine "denetim" yaz' })), true)
  assert.equal(uslupPaylasilabilirMi(kural({ deger: '"review" yerine "check" yaz' })), true)
})

test('havuz seçimi: kendi kuralı ve kapattığı çıkar, tekilleşir, sınır uygulanır', () => {
  const havuz = [{ anahtar: 'a', deger: 'A' }, { anahtar: 'a', deger: 'A2' }, { anahtar: 'b', deger: 'B' }, { anahtar: 'c', deger: 'C' }, { anahtar: 'd', deger: 'D' }]
  const s = havuzKurallariniSec(havuz, new Set(['b']), new Set([kapaliAnahtar('klinik:c')]), 5)
  assert.deepEqual(s, [{ slug: 'klinik:a', satir: 'A' }, { slug: 'klinik:d', satir: 'D' }])
  assert.equal(havuzKurallariniSec(havuz, new Set(), new Set(), 1).length, 1)
})

async function oku(sb: SupabaseClient, t: string): Promise<Row[]> {
  const r = (await (sb.from(t) as unknown as PromiseLike<{ data: Row[] }>)) as { data: Row[] }
  return r.data
}

function kurulum() {
  return fakeSb({
    clinic_members: [
      { clinic_id: 'K1', user_id: 'A', is_active: true }, { clinic_id: 'K1', user_id: 'B', is_active: true },
      { clinic_id: 'K1', user_id: 'C', is_active: true }, { clinic_id: 'K2', user_id: 'D', is_active: true },
    ],
    users: [{ id: 'A', specialty: 'pediatri' }, { id: 'B', specialty: 'pediatri' }, { id: 'C', specialty: 'kardiyoloji' }, { id: 'D', specialty: 'pediatri' }, { id: 'X', specialty: 'pediatri' }],
    doktor_hafiza: [
      { doctor_id: 'A', anahtar: 'terim-gerektiginde-luzumlu-halde', kategori: 'uslup', deger: '"gerektiğinde" yerine "lüzumlu halde" yaz', kaynak: 'duzeltme', kanit_sayisi: 3, durum: 'uygulanir', aktif: true },
      { doctor_id: 'A', anahtar: 'ilac-x-y', kategori: 'klinik', deger: 'X yerine Y yaz', kaynak: 'duzeltme', kanit_sayisi: 3, durum: 'uygulanir', aktif: true },
      { doctor_id: 'A', anahtar: 'silme-plan-bir-cumle', kategori: 'uslup', deger: 'Şu kalıbı nottan çıkar: Ahmet Bey 5 mg', kaynak: 'duzeltme', kanit_sayisi: 3, durum: 'uygulanir', aktif: true },
    ],
  })
}

test('varsayılan KAPALI: rıza yokken ne paylaşılır ne alınır; senkron havuza yazmaz', async () => {
  const sb = kurulum()
  await klinikHavuzuSenkronla(sb, 'A')
  assert.deepEqual(await klinikKurallariYukle(sb, 'B', 12), [])
  await klinikUslupAc(sb, 'B')
  assert.deepEqual(await klinikKurallariYukle(sb, 'B', 12), [], 'A rıza vermedi → B hiçbir şey almaz')
})

test('rıza: yalnız üslup kuralı havuza girer; aynı kliniğin + aynı branşın rızalı üyesi alır, yazar görünmez', async () => {
  const sb = kurulum()
  assert.deepEqual(await klinikUslupAc(sb, 'A'), { ok: true })
  await klinikUslupAc(sb, 'B')
  await klinikUslupAc(sb, 'C')
  const alinan = await klinikKurallariYukle(sb, 'B', 12)
  assert.deepEqual(alinan, [{ slug: 'klinik:terim-gerektiginde-luzumlu-halde', satir: '"gerektiğinde" yerine "lüzumlu halde" yaz' }])
  assert.ok(!JSON.stringify(alinan).includes('"A"'))
  assert.deepEqual(await klinikKurallariYukle(sb, 'C', 12), [], 'başka branş (kardiyoloji) pediatri üslubunu almaz')
  assert.deepEqual(await klinikKurallariYukle(sb, 'A', 12), [], 'kendi kuralı kendine klinik kuralı olarak dönmez')
})

test('klinik üyesi olmayan açamaz; başka klinik görmez', async () => {
  const sb = kurulum()
  assert.deepEqual(await klinikUslupAc(sb, 'X'), { ok: false, neden: 'uye_degil' })
  await klinikUslupAc(sb, 'A'); await klinikUslupAc(sb, 'D')
  assert.deepEqual(await klinikKurallariYukle(sb, 'D', 12), [], 'K2 üyesi K1 havuzunu görmez')
})

test('ayrılma: rıza kapanır, havuzdaki kuralları silinir, B artık almaz; doktor kendi kuralını korur', async () => {
  const sb = kurulum()
  await klinikUslupAc(sb, 'A'); await klinikUslupAc(sb, 'B')
  assert.equal((await klinikKurallariYukle(sb, 'B', 12)).length, 1)
  await klinikUslupKapat(sb, 'A')
  assert.deepEqual(await klinikKurallariYukle(sb, 'B', 12), [])
  assert.equal((await oku(sb, 'klinik_ortak_uslup')).filter((r) => r.kaynak_doctor_id === 'A').length, 0)
  assert.equal((await oku(sb, 'doktor_hafiza')).filter((r) => r.doctor_id === 'A').length, 3, 'A kendi hafıza kuralları dokunulmadı')
  assert.equal((await oku(sb, 'klinik_uslup_katilim')).find((r) => r.doctor_id === 'A')?.aktif, false)
})

test('üyelikten çıkan kaynağın kuralı, satırı silinmemiş olsa bile okunmaz', async () => {
  const sb = kurulum()
  await klinikUslupAc(sb, 'A'); await klinikUslupAc(sb, 'B')
  ;(await oku(sb, 'clinic_members')).find((r) => r.user_id === 'A')!.is_active = false
  assert.deepEqual(await klinikKurallariYukle(sb, 'B', 12), [])
})

test('B klinik kuralını kapatınca bir daha gelmez (kendi tarafında)', async () => {
  const sb = kurulum()
  await klinikUslupAc(sb, 'A'); await klinikUslupAc(sb, 'B')
  const db = sb as unknown as { from: (t: string) => { insert: (r: Row) => void } }
  db.from('doktor_hafiza').insert({ doctor_id: 'B', anahtar: kapaliAnahtar('klinik:terim-gerektiginde-luzumlu-halde'), kaynak: 'doktor_soyledi' })
  assert.deepEqual(await klinikKurallariYukle(sb, 'B', 12), [])
})
