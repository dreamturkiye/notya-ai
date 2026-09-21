import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { bosKart, dosyaSoruCevap, kartBosMu, kartMetin, kartSoyle, type HastaDosyaKart } from './hastaDosyaKart'

const KOK = new URL('.', import.meta.url)

function doluKart(): HastaDosyaKart {
  return {
    yas: '4 yaş 2 ay',
    cinsiyet: 'kız',
    alerji: 'penisilin',
    kronik: 'astım',
    kanGrubu: 'A Rh+',
    ilaclar: 'Flixotide 50',
    sonVizit: '12 Eylül 2026 — öksürük',
    sonSikayet: 'öksürük',
    sonTani: 'Akut bronşit',
    sonRecete: 'Augmentin 400 (12 Eylül 2026)',
    asilar: 'KPA 10 Eylül 2026',
    olcum: 'Ateş: 37.8 · Kilo: 16 kg',
    lab: 'HbA1c 6.2 (1 Eylül 2026)',
    randevu: '1 Ekim 2026 — kontrol',
    vizitSayisi: 3,
    vizitAralik: '1 Mart 2026 – 12 Eylül 2026',
  }
}

/** Basic per-patient questions — must answer from this dossier only, never invent. */
const TEMEL: { soru: string; icerir: string; icermez?: string }[] = [
  { soru: 'Alerjisi var mı?', icerir: 'penisilin' },
  { soru: 'Penisilin alerjisi var mı?', icerir: 'penisilin' },
  { soru: 'Kan grubu ne?', icerir: 'A Rh+' },
  { soru: 'Kronik hastalığı ne?', icerir: 'astım' },
  { soru: 'Özgeçmişi?', icerir: 'astım' },
  { soru: 'Kaç yaşında?', icerir: '4 yaş 2 ay' },
  { soru: 'Yaşı nedir?', icerir: '4 yaş 2 ay' },
  { soru: 'Cinsiyeti ne?', icerir: 'kız' },
  { soru: 'Kaç viziti var?', icerir: '3' },
  { soru: 'Kaçıncı ziyaret?', icerir: '3' },
  { soru: 'Kaç kez geldi?', icerir: '3' },
  { soru: 'Son vizit ne zaman?', icerir: '12 Eylül 2026' },
  { soru: 'En son ne zaman geldi?', icerir: '12 Eylül 2026' },
  { soru: 'Neden geldi?', icerir: 'öksürük' },
  { soru: 'Şikayeti neydi?', icerir: 'öksürük' },
  { soru: 'Son tanısı ne?', icerir: 'Akut bronşit' },
  { soru: 'Son reçetesi ne?', icerir: 'Augmentin' },
  { soru: 'Bu hastaya hangi antibiyotiği yazdım?', icerir: 'Augmentin' },
  { soru: 'Ne yazdık en son?', icerir: 'Augmentin' },
  { soru: 'Aşıları ne?', icerir: 'KPA' },
  { soru: 'Ne kullanıyor?', icerir: 'Flixotide' },
  { soru: 'Sürekli ilaçları?', icerir: 'Flixotide' },
  { soru: 'Randevusu ne zaman?', icerir: '1 Ekim 2026' },
  { soru: 'Sıradaki kontrol?', icerir: '1 Ekim 2026' },
  { soru: 'HbA1c kaç?', icerir: '6.2' },
  { soru: 'Son tahlili?', icerir: 'HbA1c' },
  { soru: 'Ateşi kaçtı?', icerir: '37.8' },
  { soru: 'Kilosu ne?', icerir: '16 kg' },
  { soru: 'Alerjisi ve son reçetesi ne?', icerir: 'penisilin' },
]

describe('hasta dosya kartı — temel hekim soruları (yalnız bu dosya)', () => {
  const k = doluKart()

  for (const s of TEMEL) {
    it(s.soru, () => {
      const c = dosyaSoruCevap(s.soru, k)
      assert.ok(c, `${s.soru} cevapsız`)
      assert.match(c!, new RegExp(s.icerir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
      if (s.icermez) assert.ok(!c!.includes(s.icermez))
    })
  }

  it('birleşik alerji + reçete ikisini de söyler', () => {
    const c = dosyaSoruCevap('alerjisi ve son reçetesi', k)
    assert.match(c || '', /penisilin/)
    assert.match(c || '', /Augmentin/)
  })

  it('pratik “en fazla yazdım” bu hastanın son reçetesine düşmez', () => {
    assert.equal(dosyaSoruCevap('Son bir ay içinde hangi antibiyotiği en fazla yazdım?', k), null)
    assert.equal(dosyaSoruCevap('Bu ay en sık tanı neydi?', k), null)
  })

  it('kayıt yoksa uydurmaz — “kayıt yok” der', () => {
    const bos = bosKart()
    const c = dosyaSoruCevap('Alerjisi ne?', bos)
    assert.equal(c, 'Dosyada alerji: kayıt yok.')
    assert.ok(!/penisilin|yok sanırım|bilmiyorum/i.test(c!))
  })

  it('HIZLI KART baş çevresi yazmaz (branş sızıntısı yok)', () => {
    const metin = kartMetin(k)
    assert.match(metin, /HIZLI KART/)
    assert.ok(!/baş çevresi|basCevresi|veli/i.test(metin))
    assert.ok(!/baş çevresi|basCevresi/i.test(readFileSync(new URL('./hastaDosyaKart.ts', KOK), 'utf8')))
  })

  it('kartSoyle boş alanları atar, alerjiyi her zaman söyler', () => {
    const bos = bosKart()
    bos.yas = '7 yaş'
    const s = kartSoyle(bos)
    assert.match(s, /7 yaş/)
    assert.match(s, /alerji kayıt yok/)
    assert.ok(!/kronik kayıt yok/.test(s))
  })

  it('kartBosMu yalnız boş etiketleri tanır', () => {
    assert.equal(kartBosMu('kayıt yok'), true)
    assert.equal(kartBosMu('penisilin'), false)
  })
})

describe('hasta dosya derleyici — kart başta kalır, izolasyon', () => {
  const derle = readFileSync(new URL('./hastaDosyaDerleyici.ts', KOK), 'utf8')
  const chat = readFileSync(new URL('../../app/api/asistan/chat/route.ts', KOK), 'utf8')
  const ses = readFileSync(new URL('../../app/api/asistan/hasta-bul/route.ts', KOK), 'utf8')

  it('uzun dosyada kart + kimlik başta, eski vizit ortadan kesilir', () => {
    assert.ok(derle.includes('function dosyaKirp'))
    assert.ok(derle.includes('govde.slice(0, govdeBas)'))
    assert.ok(!derle.includes('metin.slice(metin.length - 48000)'))
    assert.ok(derle.includes('hastaDosyaPaketiniDerle'))
    assert.ok(derle.includes("from('randevular')"))
    assert.ok(derle.includes("from('lab_satirlar')"))
  })

  it('her tablo sorgusu doktor kolonuna kilitli', () => {
    const fromlar = [...derle.matchAll(/\.from\('([^']+)'\)/g)]
    assert.ok(fromlar.length >= 10, 'derleme tabloları eksik')
    for (const m of fromlar) {
      const parca = derle.slice(m.index ?? 0, (m.index ?? 0) + 280)
      if (m[1] === 'users') {
        assert.ok(/\.eq\('id',\s*doktorId\)/.test(parca), 'users kendi hekim id')
        continue
      }
      assert.ok(/doctor_id|doktor_id/.test(parca), `${m[1]} doktor filtresi yok`)
    }
    assert.ok(derle.includes(".eq('onayli', true)"), 'lab yalnız onaylı')
  })

  it('KD/dahiliye ölçümünde baş çevresi pediatrik kapının arkasında', () => {
    assert.ok(derle.includes('pediatrikBaglamMi'))
    assert.ok(derle.includes('hastaDogumIso'))
    assert.ok(/if \(!g\.pediatrik\)/.test(derle))
    assert.ok(derle.includes('Baş Çevresi:'))
  })

  it('yazılı sohbet ve ses dosya gerçeğini karttan okur', () => {
    assert.ok(chat.includes('hastaDosyaPaketiniDerle'))
    assert.ok(chat.includes('dosyaSoruCevap'))
    assert.ok(chat.includes('KESİN DOSYA CEVABI'))
    assert.ok(ses.includes('hastaDosyaPaketiniDerle'))
    assert.ok(ses.includes('kartSoyle'))
    assert.ok(ses.includes('dosyaSoruCevap'))
  })
})
