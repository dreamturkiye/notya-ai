/**
 * HASTA-KARISMA-01 (2026-11-20) — repro: Note A (2-month infant, exclusively breastfed) edited "doğal" → "olağan",
 * re-approved, rule applied; Note B (2-year-old, different patient) generated next. Before the fix Note B's prompt held
 * Note A's raw S/P ("yalnız anne sütü alıyor, 2–3 saatte bir emiyor") as a "style example", and content rows from
 * Note A's diff ("Şu satırı ekle: Büyüme (Neyzi): kilo 49. persentil", "Bebeğiniz 3 aydan küçük…") could be
 * promoted into every note. Synthetic text only.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { soapSistemBloklari, stilOrnekleriDerle, doktorKurallariBlogu, uygulananKurallariSuz, guvenliKurallar } from '@/lib/doktor/soapUret'
import { duzeltmeAnaliz } from './duzeltmeAnaliz'
import { deltalardanAdaylar, kuraliBirlesitir } from './kuralTuret'
import { hafizaBloguNot, type HafizaOzeti, type HafizaKayit } from '@/lib/doktor/hafiza'
import { klinikOlguIcerirMi, uslupKuraliGuvenliMi, bolumIskeleti, iskeletSuz, doktorDuzeyiMetniSuz } from './hastaOlguKapisi'

// Note A (patient 1): AI draft and the doctor's approved final.
const A_TASLAK = {
  subjektif: 'Şikayet: İki aylık kontrol ve aşılar.\nŞikayetin Hikayesi: Veli beyanına göre yalnız anne sütü alıyor, 2–3 saatte bir emiyor; geceleri 1–2 kez uyanıyor.\nÖzgeçmiş: 39 haftalık, sorunsuz doğum.',
  objektif: 'Genel durum: İyi.\nKardiyovasküler: Kalp sesleri doğal.\nSolunum: Akciğer sesleri doğal.',
  plan: '1. 2. ay aşıları uygulandı.\n2. D vitamini 400 ünite günde 1 kez devam.\n3. Dört aylık kontrol.',
  aiDegerlendirme: 'Öykü rutin kontrolle uyumlu.',
  hastaOzeti: 'Bugün iki aylık kontrolü yapıldı.',
}
const A_SON = {
  ...A_TASLAK,
  objektif: 'Genel durum: İyi.\nKardiyovasküler: Kalp sesleri olağan.\nSolunum: Akciğer sesleri olağan.',
  aiDegerlendirme: 'Öykü rutin kontrolle uyumlu. Büyüme (Neyzi): kilo 49. persentil · boy 52. persentil · baş çevresi 39. persentil.',
  hastaOzeti: 'Bugün iki aylık kontrolü yapıldı. Bebeğiniz 3 aydan küçük olduğu için ateşi 38°C veya üzerine çıkarsa aynı gün hekiminizle görüşün.',
}
// Patient-1-only facts that must never appear in patient 2's prompt.
const A_OLGULARI = [/anne sütü/i, /emiyor/i, /2–3 saatte/, /kilo 49/, /persentil/i, /3 aydan/, /38°C/, /39 haftalık/, /400 ünite/, /uyanıyor/i, /İki aylık/i]

// Note B (patient 2): the 37 s transcript — no feeding information.
const B_TRANSKRIPT = 'Can bugün iki yaşında, rutin kontrol. On iki kilo, boyu seksen yedi santim. Kalp ve akciğer sesleri doğal. Karın rahat. Altı ay sonra kontrol.'

function notBPromptu(ekstra: { doktorKurallari?: { slug: string; satir: string }[]; stilProfili?: string; stilOrnekleri?: string } = {}) {
  // Exactly what ses-yukle / sessions/end pass: style examples from the doctor's last approved notes (= Note A),
  // memory block, applicable rules.
  const kurallar = deltalardanAdaylar(duzeltmeAnaliz(A_TASLAK, A_SON), 'note-a')
    .map((a) => kuraliBirlesitir(kuraliBirlesitir(null, a), { ...a, noteId: 'note-a2' })) // force-promote every candidate
    .filter((r): r is NonNullable<typeof r> => !!r && r.durum === 'uygulanir')
    .map((r) => ({ slug: r.anahtar, satir: r.deger }))
  const bloklar = soapSistemBloklari({
    transcript: B_TRANSKRIPT,
    specialty: 'pediatri',
    stilOrnekleri: ekstra.stilOrnekleri ?? stilOrnekleriDerle([{ content_subjektif: A_SON.subjektif, content_plan: A_SON.plan }]),
    stilProfili: ekstra.stilProfili ?? '',
    doktorKurallari: ekstra.doktorKurallari ?? kurallar,
  })
  // The cached block is persona + branch rules (patient-independent, identical with or without doctor-level data); the
  // doctor-level / patient-level text lives only in the second block — that is what is checked.
  const taban = soapSistemBloklari({ transcript: B_TRANSKRIPT, specialty: 'pediatri' })
  assert.equal(bloklar[0].metin, taban[0].metin)
  return bloklar.slice(1).map((b) => b.metin).join('\n')
}

test('repro: Note B prompt carries the "olağan" style rule and NO fact from Note A', () => {
  const prompt = notBPromptu()
  assert.match(prompt, /"doğal" yerine "olağan" yaz/)
  for (const r of A_OLGULARI) assert.doesNotMatch(prompt, r, `Note A fact leaked into Note B prompt: ${r}`)
})

test('rule creation: content rows from Note A\'s diff are never candidates', () => {
  const adaylar = deltalardanAdaylar(duzeltmeAnaliz(A_TASLAK, A_SON), 'note-a')
  assert.ok(adaylar.some((a) => a.anahtarSlug === 'terim-dogal-olagan'))
  for (const a of adaylar) {
    assert.ok(!['ekleme', 'yeniden_yazma'].includes(a.tur), `content rule created: ${a.anahtarSlug}`)
    for (const r of A_OLGULARI) assert.doesNotMatch(a.deger, r)
  }
})

test('hard guard: rules loaded around the loaders (pre-fix rows) never reach the prompt', () => {
  const eski = [
    { slug: 'terim-dogal-olagan', satir: '"doğal" yerine "olağan" yaz' },
    { slug: 'ekleme-aidegerlendirme-buyume-neyzi-kilo-49', satir: 'Şu satırı ekle: Büyüme (Neyzi): kilo 49.' },
    { slug: 'ekleme-hastaozeti-bebeginiz-3-aydan-kucuk', satir: 'Şu satırı ekle: Bebeğiniz 3 aydan küçük olduğu için ateşi 38°C veya üzerine çıkarsa' },
    { slug: 'yeniden-objektif', satir: 'Bu bölümü doktorun cümlesiyle yaz: Kardiyovasküler: Kalp sesleri olağan.' },
    { slug: 'yeniden-ilaclar', satir: 'Bu bölümü doktorun cümlesiyle yaz: [{"ad":"D vitamini damlası","doz":"400 ünite"}]' },
    { slug: 'terim-400-asilari', satir: '"400" yerine "aşıları" yaz' },
    { slug: 'silme-plan-dort-aylik', satir: 'Şu kalıbı nottan çıkar: Dört aylık kontrol ve planlanan aşılar izlemde tutulsun.' },
    { slug: 'klinik:ekleme-x', satir: 'Şu satırı ekle: yalnız anne sütü alıyor' },
  ]
  const prompt = notBPromptu({ doktorKurallari: eski })
  for (const r of A_OLGULARI) assert.doesNotMatch(prompt, r)
  assert.doesNotMatch(prompt, /Şu satırı ekle|doktorun cümlesiyle|D vitamini|"400"/)
  assert.deepEqual(guvenliKurallar(eski).map((k) => k.slug), ['terim-dogal-olagan'])
  // A content slug the model echoes back is not recorded as applied either.
  assert.deepEqual(uygulananKurallariSuz(['terim-dogal-olagan', 'yeniden-objektif'], guvenliKurallar(eski)), ['terim-dogal-olagan'])
  assert.equal(doktorKurallariBlogu(eski).includes('yeniden-objektif'), false)
})

test('hard guard: raw note text passed as style examples (old format) is dropped', () => {
  const eskiBicim = `--- Onaylı not örneği ---\nS: ${A_SON.subjektif.slice(0, 400)}\nP: ${A_SON.plan.slice(0, 400)}`
  const prompt = notBPromptu({ stilOrnekleri: eskiBicim })
  for (const r of A_OLGULARI) assert.doesNotMatch(prompt, r)
})

test('style examples are a skeleton: labels and plan numbering only', () => {
  const s = stilOrnekleriDerle([{ content_subjektif: A_SON.subjektif, content_plan: A_SON.plan }])
  assert.match(s, /Şikayet: …/)
  assert.match(s, /Şikayetin Hikayesi: …/)
  assert.match(s, /1\. …/)
  for (const r of A_OLGULARI) assert.doesNotMatch(s, r)
  assert.equal(iskeletSuz(s), s)
  // A label that is really a sentence is not kept.
  assert.equal(bolumIskeleti('Veli beyanına göre yalnız anne sütü alıyor ve: 2–3 saatte'), '')
})

test('memory / profile block: lines with another patient\'s clinical quantity are dropped', () => {
  const k = (p: Partial<HafizaKayit>): HafizaKayit => ({ kategori: 'uslup', anahtar: 'x', deger: '', kaynak: 'duzeltme', kanit_sayisi: 2, kesin: true, aktif: true, ...p } as HafizaKayit)
  const h = {
    stilProfili: '1. Vital bulgularda yalnız ölçülmüş değerleri göster.\n2. Yalnız anne sütü alıyor, 2–3 saatte bir emiyor.\n3. Hasta özetini sade yaz.',
    kesinKayitlar: [
      k({ anahtar: 'terim-dogal-olagan', deger: '"doğal" yerine "olağan" yaz' }),
      k({ anahtar: 'ekleme-hastaozeti-bebeginiz', deger: 'Şu satırı ekle: Bebeğiniz 3 aydan küçük olduğu için' }),
      k({ anahtar: 'yeniden-subjektif', deger: 'Bu bölümü doktorun cümlesiyle yaz: Veli beyanına göre yalnız anne sütü alıyor' }),
      k({ anahtar: 'recete-yolu', kategori: 'uygulama', kaynak: 'doktor_soyledi', deger: 'Reçeteyi MBYS programına girer' }),
    ],
    belirsizKayitlar: [],
  } as unknown as HafizaOzeti
  const blok = hafizaBloguNot(h)
  assert.match(blok, /Vital bulgularda/)
  assert.match(blok, /"doğal" yerine "olağan" yaz/)
  for (const r of A_OLGULARI) assert.doesNotMatch(blok, r)
  assert.doesNotMatch(blok, /Şu satırı ekle|doktorun cümlesiyle/)
  const prompt = notBPromptu({ stilProfili: h.stilProfili })
  for (const r of A_OLGULARI) assert.doesNotMatch(prompt, r)
})

test('guard vocabulary: patient facts flagged, pure phrasing rules pass', () => {
  for (const f of ['2–3 saatte bir emiyor', 'iki aylık kontrol', 'kilo 49. persentil', 'ateşi 38°C', 'Günde 6–7 bez', 'üç saatte bir']) assert.ok(klinikOlguIcerirMi(f), f)
  for (const ok of ['"doğal" yerine "olağan" yaz', '"gerektiğinde" yerine "Lüzumlu halde" yaz', 'Bu bölümü daha kısa tut', 'mg/kg/gün yazma, günlük toplam yaz', 'Şu kalıbı nottan çıkar: Öneri (doktor onayına tabi):']) {
    assert.ok(uslupKuraliGuvenliMi({ deger: ok }), ok)
  }
  assert.equal(uslupKuraliGuvenliMi({ deger: '"Veli beyanına göre yalnız anne sütü" yerine "anne sütü ile beslenen bebek" yaz' }), false)
  assert.equal(doktorDuzeyiMetniSuz('Kısa yaz.\nBoy: 87 cm'), 'Kısa yaz.')
})

test('routes: no memory learning from an undiarised consultation transcript', () => {
  const kok = process.cwd()
  const sesYukle = fs.readFileSync(path.join(kok, 'app/api/sessions/ses-yukle/route.ts'), 'utf8')
  assert.doesNotMatch(sesYukle, /sohbettenOgren\(/, 'ses-yukle must not learn doctor memory from the uploaded recording')
  const son = fs.readFileSync(path.join(kok, 'app/api/sessions/[id]/end/route.ts'), 'utf8')
  assert.doesNotMatch(son, /:\s*String\(transcript \|\| ''\)/, 'sessions/end must not fall back to the whole transcript for learning')
  assert.match(son, /Boolean\(s\?\.speaker\) && \/doktor\|hekim\/i/)
})
