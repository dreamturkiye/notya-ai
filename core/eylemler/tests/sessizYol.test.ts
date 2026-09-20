/**
 * NOTYA-EYLEM-24 — THE TRIPWIRE: no chat/voice code path may reach a clinical write without going
 * through `core/eylemler/onayla.ts` (i.e. without a doctor's tap on a confirm card).
 *
 * Why a test and not a code review: the path that was closed here existed for months behind a
 * `switch` statement in a file called "actionExecutor". Nothing about it looked alarming in a diff.
 * What makes the closure durable is that re-opening it — a new `.insert()` inside the chat route's
 * import graph, a new legacy action type without a decision, an eylem registered under one of the
 * old names — turns this file red.
 *
 * Three layers:
 *   1. STATIC  — walk the local import graph from every chat/voice entry point and assert that no
 *                reachable module writes to a clinical table, except the eylem spine itself and the
 *                shared write helpers it (and only it) calls.
 *   2. GATE    — `lib/asistan/actionExecutor.ts` classifies every legacy type and writes nothing:
 *                the module contains no database client and no write call at all.
 *   3. YASAKLI — the old type names can never become eylem anahtarları (registry throws on load).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { eylemler } from '@/core/eylemler/kayit'
import { ESKI_SESSIZ_EYLEM_TIPLERI, eskiSessizTipMi } from '@/core/eylemler/yasakli'
import {
  ESKI_EYLEM_KARSILIKLARI,
  KLINIK_ESKI_EYLEM_TIPLERI,
  eskiEylemKarari,
  klinikEskiEylemMi,
} from '@/lib/asistan/actionExecutor'

const KOK = path.resolve(__dirname, '../../..')

/** Where a record becomes a clinical fact about a patient. A write here needs a tap. */
const KLINIK_TABLOLAR = [
  'patients',
  'notes',
  'sessions',
  'hasta_ilaclar',
  'asilar',
  'randevular',
  'belgeler',
  'sevkler',
  'hasta_mesajlari',
  'hasta_mesaj_konulari',
  'belge_analizleri',
  'recete',
  'receteler',
]

/** The ONLY modules allowed to write to a clinical table from inside the chat/voice graph. */
const YAZMAYA_IZINLI = [
  'core/eylemler/',                    // the spine — onayla.ts is the door, everything else is behind it
  'lib/doktor/hastaKayitAlanlari.ts',  // alerji / kronik, shared with the UI form; called from temelEylemler
  'lib/doktor/gununNotunaEkle.ts',     // vitaller / değerlendirme satırı, same
]

/** Chat and voice surfaces — every place a model turn can start. */
const GIRIS_NOKTALARI = [
  'app/api/asistan/chat/route.ts',
  'app/api/doktor/konsult/route.ts',
  'app/api/doktor/not-konsult/route.ts',
  'app/asistan/page.tsx', // sesli Ayşe (ElevenLabs client tools)
]

const UZANTILAR = ['.ts', '.tsx', '/index.ts', '/index.tsx']

function cozumle(kaynakDosya: string, belirtec: string): string | null {
  let ham: string
  if (belirtec.startsWith('@/')) ham = path.join(KOK, belirtec.slice(2))
  else if (belirtec.startsWith('.')) ham = path.resolve(path.dirname(path.join(KOK, kaynakDosya)), belirtec)
  else return null // node_modules — not ours
  for (const u of ['', ...UZANTILAR]) {
    const aday = `${ham}${u}`
    if (existsSync(aday) && !aday.endsWith(path.sep)) {
      try {
        if (readFileSync(aday, 'utf8') !== undefined) return path.relative(KOK, aday)
      } catch { /* dizin */ }
    }
  }
  return null
}

function ithaller(dosya: string, metin: string): string[] {
  const out: string[] = []
  const re = /(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(metin))) {
    const c = cozumle(dosya, m[1])
    if (c) out.push(c)
  }
  return out
}

function grafik(girisler: string[]): Map<string, string> {
  const gorulen = new Map<string, string>()
  const kuyruk = [...girisler]
  while (kuyruk.length) {
    const d = kuyruk.shift() as string
    if (gorulen.has(d)) continue
    const tam = path.join(KOK, d)
    if (!existsSync(tam)) continue
    const metin = readFileSync(tam, 'utf8')
    gorulen.set(d, metin)
    for (const i of ithaller(d, metin)) if (!gorulen.has(i)) kuyruk.push(i)
  }
  return gorulen
}

/** `.from('notes')` followed by `.insert(` / `.update(` / `.delete(` within the same chain. */
function klinikYazmalar(metin: string): string[] {
  const bulgular: string[] = []
  for (const tablo of KLINIK_TABLOLAR) {
    const re = new RegExp(`\\.from\\(\\s*['"\`]${tablo}['"\`]\\s*\\)([\\s\\S]{0,200}?)(\\.insert\\(|\\.update\\(|\\.delete\\(|\\.upsert\\()`, 'g')
    if (re.test(metin)) bulgular.push(tablo)
  }
  return bulgular
}

describe('NOTYA-EYLEM-24 — sohbet/ses yolundan sessiz klinik yazma YOK', () => {
  const g = grafik(GIRIS_NOKTALARI)

  it('giriş noktalarının hepsi bulundu (yol değişmişse test kör kalmasın)', () => {
    for (const d of GIRIS_NOKTALARI) assert.ok(g.has(d), `giriş noktası okunamadı: ${d} — yol değiştiyse bu listeyi güncelleyin`)
    assert.ok(g.size > 40, `içe aktarma grafiği beklenmedik biçimde küçük (${g.size}) — yürüteç kırılmış olabilir`)
  })

  it('grafikte klinik tabloya yazan tek yer eylem omurgası ve onun paylaştığı yazma yolları', () => {
    const ihlaller: string[] = []
    for (const [dosya, metin] of g) {
      if (YAZMAYA_IZINLI.some((izin) => dosya.startsWith(izin))) continue
      if (dosya.includes('/tests/') || dosya.endsWith('.test.ts')) continue
      const yazilan = klinikYazmalar(metin)
      if (yazilan.length) ihlaller.push(`${dosya} → ${yazilan.join(', ')}`)
    }
    assert.deepEqual(
      ihlaller,
      [],
      `Sohbet/ses yolundan klinik tabloya doğrudan yazma bulundu. Kayıt yazmanın tek yolu core/eylemler/onayla.ts'tir (hekimin dokunuşu):\n${ihlaller.join('\n')}`
    )
  })

  it('sohbet/ses grafiğinde onay yolu (calistir) hiç yok — kart yolu başka bir rotadır', () => {
    // A surface PREPARES. Committing lives on POST /api/doktor/eylem, behind doktorOturum and the
    // doctor's tap; it must not even be reachable from the code a model turn runs through.
    const cagiranlar = [...g.entries()].filter(([, m]) => /\.calistir\(/.test(m)).map(([d]) => d)
    assert.deepEqual(cagiranlar, [], `sohbet/ses grafiğinden calistir() çağrılıyor: ${cagiranlar.join(', ')}`)
    assert.ok(!g.has('core/eylemler/onayla.ts'), 'onayla.ts sohbet yolundan erişilebilir hâle gelmiş')
  })

  it('omurgada eylem.calistir()\'i yalnız onayla.ts çağırır', () => {
    const omurga = readdirSync(path.join(KOK, 'core/eylemler')).filter((f) => f.endsWith('.ts'))
    const cagiranlar = omurga.filter((f) => /\.calistir\(/.test(readFileSync(path.join(KOK, 'core/eylemler', f), 'utf8')))
    assert.deepEqual(cagiranlar.sort(), ['onayla.ts'], `calistir() beklenmedik yerden çağrılıyor: ${cagiranlar.join(', ')}`)
  })

  it('sesli yüzeyin araçları salt okunur', () => {
    const metin = g.get('app/asistan/page.tsx') as string
    const blok = /clientTools:\s*\{([\s\S]*?)\n\s{8}\},/.exec(metin)
    assert.ok(blok, 'clientTools bloğu bulunamadı — sesli yüzeyin araç listesi değişmiş olabilir')
    const araclar = [...blok[1].matchAll(/^\s{10}([a-z_][a-z0-9_]*)\s*:/gim)].map((m) => m[1])
    assert.deepEqual(araclar, ['hasta_bul'], `sesli ajana yeni bir araç eklenmiş: ${araclar.join(', ')} — yazan bir araç EylemKarti yolundan geçmelidir`)
  })
})

describe('NOTYA-EYLEM-24 — eski eylem tipleri (actionExecutor artık bir kapı)', () => {
  const kaynak = readFileSync(path.join(KOK, 'lib/asistan/actionExecutor.ts'), 'utf8')

  it('modülde veritabanı istemcisi ve yazma çağrısı yok', () => {
    for (const desen of ['createClient', '.insert(', '.update(', '.delete(', '.upsert(', 'supabase']) {
      assert.ok(!kaynak.includes(desen), `actionExecutor içinde "${desen}" var — sessiz yazma yolu geri açılmış`)
    }
  })

  it('her eski klinik tip reddedilir ve hekimi bir ekrana ya da karta yönlendirir', () => {
    for (const tip of ESKI_SESSIZ_EYLEM_TIPLERI) {
      assert.ok(klinikEskiEylemMi(tip), `${tip} klinik sayılmıyor`)
      const k = eskiEylemKarari(tip)
      assert.notEqual(k.sinif, 'klinik_disi')
      assert.ok(k.metin.length > 20, `${tip} için Türkçe açıklama yok`)
      assert.ok(k.eylemAnahtar || k.yol, `${tip} ne karta ne ekrana yönlendiriyor`)
    }
    assert.deepEqual([...KLINIK_ESKI_EYLEM_TIPLERI].sort(), [...ESKI_SESSIZ_EYLEM_TIPLERI].sort())
  })

  it('reçete ve tanı T3 — kart bile hazırlanmaz, ekrana yönlendirilir', () => {
    for (const tip of ['ADD_PRESCRIPTION', 'SET_DIAGNOSIS']) {
      const k = eskiEylemKarari(tip)
      assert.equal(k.sinif, 'klinik_t3')
      assert.equal(k.eylemAnahtar, undefined, `${tip} için eylem karşılığı tanımlanmış — T3 bu yoldan HAZIRLANMAZ`)
      assert.ok(k.yol?.startsWith('/'), `${tip} için ekran bağlantısı yok`)
    }
  })

  it('bilinmeyen / uydurma bir tip de klinik sayılır (şüphede klinik)', () => {
    const k = eskiEylemKarari('DELETE_EVERYTHING')
    assert.notEqual(k.sinif, 'klinik_disi')
    assert.ok(klinikEskiEylemMi('BILINMEYEN_TIP'))
  })

  it('eylem karşılığı olan tipler gerçek bir eylem anahtarına gösteriyor', () => {
    const anahtarlar = new Set(eylemler().map((e) => e.anahtar))
    for (const [tip, anahtar] of Object.entries(ESKI_EYLEM_KARSILIKLARI)) {
      assert.ok(anahtarlar.has(anahtar), `${tip} → "${anahtar}" diye bir eylem yok`)
    }
  })
})

describe('NOTYA-EYLEM-24 — yasaklı: eski tip adları eylem anahtarı olamaz', () => {
  it('kayıt defterinde eski tip adı yok (büyük/küçük harf fark etmez)', () => {
    const sizanlar = eylemler().map((e) => e.anahtar).filter((a) => eskiSessizTipMi(a))
    assert.deepEqual(sizanlar, [], `eski sessiz yolun adı eylem olarak kayıtlı: ${sizanlar.join(', ')}`)
  })

  it('eskiSessizTipMi her yazımı yakalar', () => {
    assert.ok(eskiSessizTipMi('ADD_PRESCRIPTION'))
    assert.ok(eskiSessizTipMi('add_prescription'))
    assert.ok(eskiSessizTipMi('Set_Diagnosis'))
    assert.ok(!eskiSessizTipMi('ilac_ekle'))
  })

  it('istem metni artık sessiz eylem reklamı yapmıyor', () => {
    const persona = readFileSync(path.join(KOK, 'lib/asistan/personaEngine.ts'), 'utf8')
    assert.ok(!persona.includes('ACTION_TYPE'), 'persona prompt\'u hâlâ "ACTION_TYPE" JSON eylemi öğretiyor')
    assert.ok(!/"action"\s*:\s*null\s*veya/.test(persona), 'persona prompt\'u hâlâ JSON action alanı öğretiyor')
    for (const tip of ESKI_SESSIZ_EYLEM_TIPLERI) {
      assert.ok(!persona.includes(tip), `persona prompt'u hâlâ ${tip} adını taşıyor`)
    }
  })
})
