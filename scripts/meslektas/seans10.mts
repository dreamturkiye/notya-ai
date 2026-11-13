/**
 * NOTYA-MESLEKTAS-V2 — 10. seans simülasyonu.
 * Sentetik QA günleri: düzeltme → kural, selam, SonrakiAdim, önbellek.
 * Gerçek hasta / üretim yok.
 */
import assert from 'node:assert/strict'
import { duzeltmeAnaliz } from '../../lib/doktor/ogrenme/duzeltmeAnaliz.ts'
import { deltalardanAdaylar, kuraliBirlesitir, type HafizaKuralSatiri } from '../../lib/doktor/ogrenme/kuralTuret.ts'
import { meslektasSelamSatiri } from '../../lib/doktor/ogrenme/selam.ts'
import { rutinTuret, sonrakiAday, type HamOlay } from '../../lib/doktor/ogrenme/rutinTuret.ts'
import { surumHash, tazeMi, onbellekAnahtari } from '../../lib/doktor/ogrenme/dosyaOnbellek.ts'
import { ivmeHesapla } from '../../lib/doktor/ogrenme/ivme.ts'
import { kuralOnizlemesiKur } from '../../lib/doktor/ogrenme/onizleme.ts'
import { doktorKurallariBlogu, uygulananKurallariSuz } from '../../lib/doktor/soapUret.ts'

const ciftler: [Record<string, string>, Record<string, string>][] = [
  [{ plan: 'Ateş olursa gerektiğinde parasetamol.' }, { plan: 'Ateş olursa Lüzumlu halde parasetamol.' }],
  [{ plan: 'Ateş olursa gerektiğinde ibuprofen.' }, { plan: 'Ateş olursa Lüzumlu halde ibuprofen.' }],
  [{ alarmBulgulari: 'Bol sıvı.\nAcil bir durumda acil servise başvurun.' }, { alarmBulgulari: 'Bol sıvı.' }],
  [{ alarmBulgulari: 'Dinlenin.\nAcil bir durumda acil servise başvurun.' }, { alarmBulgulari: 'Dinlenin.' }],
  [{ objektif: 'Genel durum iyi.\nNörolojik sistem değerlendirilmedi.' }, { objektif: 'Genel durum iyi.' }],
  [{ objektif: 'Koopere.\nKardiyovasküler sistem değerlendirilmedi.' }, { objektif: 'Koopere.' }],
  [{ plan: '1 hafta sonra kontrol.' }, { plan: '1 hafta sonra denetim.' }],
  [{ plan: '3 gün sonra kontrol.' }, { plan: '3 gün sonra denetim.' }],
  [{ plan: 'Amoksisilin 10 mg/kg/gün 2 dozda.' }, { plan: 'Amoksisilin günlük toplam 200 mg, 2 dozda.' }],
  [{ plan: 'Sefuroksim 15 mg/kg/gün 2 dozda.' }, { plan: 'Sefuroksim günlük toplam 500 mg, 2 dozda.' }],
]

const hafiza = new Map<string, HafizaKuralSatiri>()
for (let i = 0; i < ciftler.length; i++) {
  const [taslak, son] = ciftler[i]
  const adaylar = deltalardanAdaylar(duzeltmeAnaliz(taslak, son), `n${i + 1}`)
  for (const a of adaylar) {
    const bir = kuraliBirlesitir(hafiza.get(a.anahtarSlug) || null, a)
    if (bir) hafiza.set(bir.anahtar, bir)
  }
}

const uygulanir = [...hafiza.values()].filter((k) => k.durum === 'uygulanir')
assert.ok(uygulanir.length >= 3, `UYGULANIR ${uygulanir.length} < 3`)

const kurallar = uygulanir.slice(0, 12).map((k) => ({ slug: k.anahtar, satir: k.deger }))
assert.match(doktorKurallariBlogu(kurallar), /DOKTORUN KURALLARI/)
const uygulananKurallar = uygulananKurallariSuz(kurallar.map((k) => k.slug), kurallar)
assert.ok(uygulananKurallar.length > 0, 'uygulananKurallar boş')

// AYSE-OGRENME-V3: ivme (gerçek düzeltme sayıları) + kural önizleme (kendi kanıt notlarından, LLM yok)
const metrikler = ciftler.map(([taslak, son], i) => ({ note_id: `n${i + 1}`, duzeltme_sayisi: duzeltmeAnaliz(taslak, son).length, onay_at: new Date(Date.UTC(2026, 10, 1 + i)).toISOString() }))
const ivme = ivmeHesapla(metrikler)
assert.ok(ivme.yeterli && ivme.n === ciftler.length, 'ivme: 10 onaylı not yeterli olmalı')
assert.ok(ivme.seri.every((x) => Number.isInteger(x.duzeltme) && x.duzeltme >= 0), 'ivme: yalnız gerçek sayılar')
const duzenlemeler = ciftler.flatMap(([taslak, son], i) => Object.keys(taslak).map((alan) => ({ note_id: `n${i + 1}`, alan, onceki: taslak[alan], sonraki: son[alan] })))
const onizlenen = uygulanir.filter((k) => kuralOnizlemesiKur({ anahtar: k.anahtar, kanit_not_idler: k.kanit_not_idler }, duzenlemeler).var)
assert.ok(onizlenen.length >= 1, 'önizleme: en az bir UYGULANIR kuralın kendi notundan örneği olmalı')

const selam = meslektasSelamSatiri({ seans: 10, dahaOnceGosterildi: false, kuralSayisi: uygulanir.length, rutinBaslangic: '09:00' })
assert.ok(selam && /10\. seansımız Hocam/.test(selam), `selam: ${selam}`)

const olaylar: HamOlay[] = []
for (let gun = 0; gun < 10; gun++) {
  olaylar.push(
    { sayfa_tipi: 'ana', eylem: 'sayfa_ac', onceki: null, sure_ms: 500 },
    { sayfa_tipi: 'hastalar', eylem: 'sayfa_ac', onceki: 'ana', sure_ms: 2000 },
    { sayfa_tipi: 'inceleme', eylem: 'not_onayla', onceki: 'not', sure_ms: 3000 },
    { sayfa_tipi: 'recete', eylem: 'recete_ac', onceki: 'not_onayla', sure_ms: 4000 },
  )
}
const rutin = rutinTuret(olaylar, { tipikBaslangicSaati: '09:00' })
const adim = sonrakiAday(rutin, 'not_onayla')
assert.ok(adim && adim.to === 'recete_ac', `SonrakiAdim: ${JSON.stringify(adim)}`)

const doktor = 'qa-doktor'
const hasta = 'qa-hasta-1'
const anahtar = onbellekAnahtari(doktor, hasta)
const metin = 'Vizit: 10 sentetik gün. Arşiv yok.'
const hash = surumHash(metin, [])
const satir = { kirli: false, paket_metin: metin, surum_hash: hash }
assert.equal(anahtar.doctor_id, doktor)
assert.equal(tazeMi(satir), true)
assert.equal(tazeMi({ ...satir, kirli: true }), false)
assert.doesNotMatch(metin, /arsiv/i)

console.log('SEANS10 OK')
console.log(`  UYGULANIR: ${uygulanir.length}`)
console.log(`  uygulananKurallar: ${uygulananKurallar.length}`)
console.log(`  selam: ${selam}`)
console.log(`  SonrakiAdim: ${adim.from} → ${adim.to} (n=${adim.n}, p=${adim.p.toFixed(2)})`)
console.log(`  onbellek anahtar: ${anahtar.doctor_id}+${anahtar.patient_id} taze=${tazeMi(satir)}`)
console.log(`  kurallar: ${uygulanir.map((k) => k.deger).slice(0, 5).join(' | ')}`)
