/**
 * NOTYA-AYSE-OZET-01 — the evidence of ONE visit's summary (pure layer, no model, no database).
 *
 * Dr. Gökhan, live, 2026-10-02: the summary of a named well-child visit had no vaccines and no weight / height / head
 * circumference. The summary has eight parts in a fixed order; a part the record does not hold is stated, not
 * skipped; no value is invented. Checked here on the synthetic corpus charts (fikstur.ts): the well-child visits at
 * 6, 12, 15, 18 and 24 months, and the adult chart for the generic sections.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { kanitBlogu } from './kanit'
import { ASI_YOK, LAB_YOK, PERSENTIL_YOK, LAB_PENCERE_GUN, vizitOzetEkrani, vizitOzetHedefiBul, vizitOzetiGuvenceyeAl, vizitOzetiSec, vizitOzetKanitSatirlari } from './vizitOzeti'
import { dosyaSorguKuralBlogu } from './kurallar'
import { DENETIM_BUGUN, KORPUS_BEBEK, korpusBebek, korpusEriskin } from './denetim/fikstur'
import { hastaKur, olaylariKur, trGun, type HamDosya } from '@/lib/doktor/dosyaOlaylari'
import { PEDIATRI_SORGU } from '@/specialties/pediatri/sorgu'

const ham = korpusBebek(DENETIM_BUGUN)
const olaylar = olaylariKur(ham, DENETIM_BUGUN)
const hasta = hastaKur(ham, DENETIM_BUGUN)
const tr = (n: number) => String(n).replace('.', ',')
const AYLAR = [6, 12, 15, 18, 24] as const
const soru = (ay: number) => `${KORPUS_BEBEK.ad}'nun ${ay} aylık sağlam çocuk muayenesinin özetini verir misin?`
const ozet = (ay: number) => { const s = vizitOzetiSec(soru(ay), olaylar, hasta); assert.ok(s?.ozet, `${ay} aylık muayene bulunamadı`); return s!.ozet! }
const bolum = (ay: number, anahtar: string) => { const b = ozet(ay).bolumler.find((x) => x.anahtar === anahtar); assert.ok(b, `${ay} ay: ${anahtar} bölümü yok`); return b! }
const kanit = (ay: number, anahtar: string) => bolum(ay, anahtar).kanit.join('\n')
/** Every number of a text, as numbers ("9,8" = 9.8, "08" = 8); a date counts as its day, month and year. */
const sayilar = (metin: string) => new Set([...metin.replace(/(\d{2})\.(\d{2})\.(\d{4})/g, '$1 $2 $3').matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => Number(m[0].replace(',', '.'))))

describe('NOTYA-AYSE-OZET-01 — muayene özeti kanıtı: sekiz bölüm, sırasıyla', () => {
  it('sağlam çocuk vizitleri (6, 12, 15, 18, 24 ay): sekiz bölüm aynı sırada, tarih ve muayene tarihindeki yaş başta', () => {
    for (const ay of AYLAR) {
      const o = ozet(ay)
      assert.deepEqual(o.bolumler.map((b) => b.anahtar), ['muayene', 'sikayet', 'bulgu', 'lab', 'asi', 'olcum', 'tedavi', 'plan'], `${ay} ay`)
      assert.deepEqual(o.bolumler.map((b) => b.baslik), ['Muayene', 'Şikayet', 'Muayene bulgusu', 'Laboratuvar', 'Aşı', 'Büyüme ve gelişme', 'Tedavi', 'Plan'])
      const blok = kanitBlogu('ozet', olaylar, hasta, { mesaj: soru(ay) })
      const konum = ['1) MUAYENE', '2) ŞİKAYET', '3) MUAYENE BULGUSU', '4) LABORATUVAR', '5) AŞI', '6) BÜYÜME VE GELİŞME', '7) TEDAVİ', '8) PLAN'].map((b) => blok.indexOf(b))
      assert.ok(konum.every((k, i) => k > 0 && (i === 0 || k > konum[i - 1])), `${ay} ay: bölüm sırası ${konum.join(',')}`)
      assert.ok(kanit(ay, 'muayene').includes(`Tarih ${trGun(o.tarih)}`) && kanit(ay, 'muayene').includes(ay < 24 ? `${ay} aylık` : '2 yaş'), kanit(ay, 'muayene'))
      assert.equal(o.pediatrik, true)
      // The other visits of the chart are not in the block.
      assert.doesNotMatch(blok, /otitis media|Augmentin|tonsillofarenjit/i, `${ay} ay`)
    }
  })

  it('kayıtlı ölçümler aynen: kilo, boy, baş çevresi — 15. ayda yalnız not metninde ve öyle işaretli', () => {
    for (const ay of AYLAR) {
      const v = KORPUS_BEBEK.saglamCocuk[ay]
      const k = kanit(ay, 'olcum')
      for (const d of [`kilo ${tr(v.kilo)} kg`, `boy ${tr(v.boy)} cm`, `baş çevresi ${tr(v.bas)} cm`]) assert.ok(k.includes(d), `${ay} ay: ${d}\n${k}`)
      assert.equal(k.includes('(not metninden)'), v.yer === 'metin', `${ay} ay`)
      for (const d of [v.kilo, v.boy, v.bas]) assert.ok(ozet(ay).degerler.includes(tr(d)), `${ay} ay: degerler ${tr(d)}`)
    }
  })

  it('büyüme cümlesi motorun satırıdır (persentil ve z aynen); motorun satırı yoksa "persentil hesaplanmadı" — tahmin yok', () => {
    for (const ay of AYLAR) {
      const o = ozet(ay)
      // The branch's own growth function, called with the measurements up to that visit.
      const motor = PEDIATRI_SORGU.buyume(olaylar.filter((x) => x.tarih <= o.tarih), { ...hasta, bugunIso: o.tarih })
      const satir = motor.satirlar.find((s) => s.startsWith(`- ${trGun(o.tarih)} (`))
      const k = kanit(ay, 'olcum')
      if (KORPUS_BEBEK.saglamCocuk[ay].yer === 'metin') {
        assert.equal(satir, undefined, 'motor not metnindeki ölçümü kullanmaz')
        assert.ok(k.includes(PERSENTIL_YOK) && !/\(p[<>]?\d/.test(k), k)
        continue
      }
      assert.ok(satir, `${ay} ay: motor satırı`)
      const beklenen = satir!.replace(/^- \d{2}\.\d{2}\.\d{4} \([^)]*\):\s*/, '')
      assert.match(beklenen, /Kilo .+ \(p\d+, z .+\); Boy .+ \(p\d+, z .+\); Baş çevresi .+ \(p\d+, z .+\)/)
      assert.ok(k.includes(`bu muayene: ${beklenen}.`), `${ay} ay\n${k}`)
      // Shift lines and flags are the engine's, and only those whose last measurement is THIS visit.
      const kaymalar = motor.satirlar.filter((s) => s.startsWith('- Kayma:') && s.includes(`→ ${trGun(o.tarih)}`))
      for (const s of kaymalar) assert.ok(k.includes(s.replace(/^- /, '')), s)
      if (!kaymalar.length) assert.ok(k.includes('motor bu muayenede kayma bildirmiyor'), k)
      assert.equal((k.match(/DİKKAT \(motor bayrağı\)/g) || []).length, motor.bayraklar.filter((b) => b.tarih === o.tarih).length)
    }
  })

  it('aşı: aynı günlü aşı kayıtları adıyla; kayıt yoksa "aşı yapılmamış"; planlanan doz uygulama sayılmaz', () => {
    for (const ay of AYLAR) {
      const o = ozet(ay)
      const satirlar = ham.asilar!.filter((a) => a.uygulama_tarihi === o.tarih)
      const k = kanit(ay, 'asi')
      if (satirlar.length) {
        for (const a of satirlar) assert.ok(k.includes(`${a.asi_adi} ${a.doz_no}. doz`), `${ay} ay: ${a.asi_adi}\n${k}`)
        assert.ok(k.includes('Uygulandığı belgelenmiş') && !k.includes('yapılmamış'), k)
      } else {
        assert.ok(k.includes(ASI_YOK), `${ay} ay\n${k}`)
        assert.equal(bolum(ay, 'asi').var, false)
      }
    }
    assert.deepEqual(AYLAR.filter((ay) => bolum(ay, 'asi').var), [6, 12, 18], 'fikstürde 6, 12 ve 18. ay vizitlerinde aşı satırı var')
    // 24 months: Hepatit A 2. doz is only PLANNED in the note.
    assert.match(kanit(24, 'asi'), /Planlanan \(uygulama DEĞİL\): Hepatit A 2\. doz — planlandı .+ → uygulandığına dair kayıt yok/)
    assert.ok(!kanit(24, 'asi').includes('Uygulandığı belgelenmiş'))
  })

  it('laboratuvar: yoksa "laboratuvar istenmemiş"; varsa sonuç, laboratuvarın referansına göre işaret ve aynı testin önceki sonucu', () => {
    for (const ay of [6, 12, 15, 18] as const) {
      assert.equal(kanit(ay, 'lab'), LAB_YOK, `${ay} ay`)
      assert.equal(bolum(ay, 'lab').var, false)
    }
    const k = kanit(24, 'lab')
    assert.match(k, new RegExp(`Hemoglobin: ${tr(KORPUS_BEBEK.hb[1])} g/dL .+ referans içinde \\(11–14\\); önceki ${tr(KORPUS_BEBEK.hb[0])} g/dL .+ laboratuvar referansının altında \\(11–14\\)\\) → yükselmiş; önceki referans dışıydı, şimdi referans içinde`))
    assert.match(k, new RegExp(`Ferritin: ${KORPUS_BEBEK.ferritin[1]} ng/mL .+ önceki ${KORPUS_BEBEK.ferritin[0]} ng/mL`))
    assert.match(k, /D vitamini: 34 ng\/mL .+ aynı testin önceki sonucu yok/)
    assert.ok(k.includes('Notta tetkik istemi yazmıyor'), k)
    // The 20-month sick visit asks for tests in the note; the results are dated two days later.
    const s20 = vizitOzetiSec('20 aylık muayenesini özetle', olaylar, hasta)
    assert.equal(s20?.secim, 'yas-tarih', 'notta yaş yazmıyor: muayene tarihindeki yaşa göre')
    const lab20 = s20!.ozet!.bolumler.find((b) => b.anahtar === 'lab')!.kanit.join('\n')
    assert.match(lab20, /İstem \(nottan\): .*Hemoglobin.* — istendi \("Hemogram ve ferritin istendi"\) → sonuç kaydı \d{2}\.\d{2}\.\d{4}/)
    assert.match(lab20, new RegExp(`Hemoglobin: ${tr(KORPUS_BEBEK.hb[0])} g/dL .+ laboratuvar referansının altında \\(11–14\\); aynı testin önceki sonucu yok`))
    assert.equal((lab20.match(/Hemogram ve ferritin istendi/g) || []).length, 1, 'aynı cümle tek satır')
    assert.ok(s20!.ozet!.bolumler.find((b) => b.anahtar === 'muayene')!.kanit.join(' ').includes('muayene tarihindeki yaşa göre seçildi'))
  })

  it('tedavi ve plan: reçete o muayenenin reçetesidir; yoksa söylenir; plan nottan aynen, kontrolün sonraki kayıttaki karşılığıyla', () => {
    for (const ay of AYLAR) {
      assert.equal(bolum(ay, 'tedavi').var, false, `${ay} ay: bu vizitlerde reçete yok`)
      assert.match(kanit(ay, 'tedavi'), /reçete yazılmamış/)
      const v = ham.vizitler.find((x) => String(x.subjektif).startsWith(`${ay} aylık`))!
      assert.ok(kanit(ay, 'plan').includes(`Plan (nottan): ${v.plan}`), kanit(ay, 'plan'))
      assert.match(kanit(ay, 'plan'), /sonra kontrol" \(randevu \/ kontrol verildi\) → sonraki kayıt \d{2}\.\d{2}\.\d{4}/)
    }
    const ilk = vizitOzetiSec('ilk muayenesini özetle', olaylar, hasta)!.ozet!
    assert.match(ilk.bolumler.find((b) => b.anahtar === 'tedavi')!.kanit.join('\n'), /Reçete \(bu muayenenin notu\): D vitamini damla — 400 IU — 1x1/)
  })

  it('kanıtta kayıtta olmayan değer yok: her sayı ham dosyada, muayene tarihlerinde ya da büyüme motorunun çıktısında geçer', () => {
    const kayit = sayilar(JSON.stringify(ham))
    for (const ay of AYLAR) {
      const o = ozet(ay)
      const motor = PEDIATRI_SORGU.buyume(olaylar.filter((x) => x.tarih <= o.tarih), { ...hasta, bugunIso: o.tarih })
      const izinli = new Set([...kayit, ...sayilar(motor.satirlar.join(' ')), ...sayilar(o.yas || ''), LAB_PENCERE_GUN, 1, 2, 3, 4, 5, 6, 7, 8])
      const yabanci = [...sayilar(vizitOzetKanitSatirlari(o).join('\n'))].filter((n) => !izinli.has(n))
      assert.deepEqual(yabanci, [], `${ay} ay: kayıtta olmayan sayı`)
    }
  })

  it('hedef: tür / yaş-dönümü, "ilk muayene", "son muayene"; muayene anmayan özet sorusu dosyanın genel özetidir', () => {
    assert.equal(vizitOzetHedefiBul('Bu hastayı bana kısaca özetler misin?'), null)
    assert.equal(vizitOzetHedefiBul('son muayenesinin özetini ver')?.tip, 'son')
    assert.equal(vizitOzetHedefiBul('İlk muayenesini özetle')?.tip, 'ilk')
    assert.equal(vizitOzetHedefiBul('son üç muayenesini özetle'), null, 'birden çok muayene: kayıt tablosunun işi')
    assert.match(kanitBlogu('ozet', olaylar, hasta, { mesaj: 'Bu hastayı bana kısaca özetler misin?' }), /VİZİTLER: 15 onaylı vizit/)
    const son = vizitOzetiSec('son muayenesini özetle', olaylar, hasta)!.ozet!
    assert.equal(son.tarih, olaylar.filter((x) => x.tur === 'vizit').pop()!.tarih)
    // Only the weight was recorded at the last visit: the other two are stated as missing, not left out.
    assert.match(son.bolumler.find((b) => b.anahtar === 'olcum')!.kanit[0], /kilo 12,8 kg; boy: kayıt yok; baş çevresi: kayıt yok/)
    // Several matches (every well-child visit) → the short list, no eight-part block for one of them.
    const cok = vizitOzetiSec('sağlam çocuk muayenesini özetle', olaylar, hasta)!
    assert.ok(cok.vizitler.length > 1 && cok.ozet === null)
    assert.match(kanitBlogu('ozet', olaylar, hasta, { mesaj: 'sağlam çocuk muayenesini özetle' }), /birden fazla eşleşme var/)
    // No match → said plainly, never another visit.
    assert.match(kanitBlogu('ozet', olaylar, hasta, { mesaj: '30 aylık sağlam çocuk muayenesini özetle' }), /bulamadım/)
  })
})

describe('NOTYA-AYSE-OZET-01 — cevap kuralı, ekran biçimi ve cevabın kayıtla denetimi', () => {
  const BASLIKLAR = ['Muayene', 'Şikayet', 'Muayene bulgusu', 'Laboratuvar', 'Aşı', 'Büyüme ve gelişme', 'Tedavi', 'Plan']

  it('şablon: tek muayenede dosyanın genel özeti şablonu yerine sekiz bölümün sırası; eksik bölüm söylenir, tanı konmaz, başka muayene katılmaz', () => {
    const blok = kanitBlogu('ozet', olaylar, hasta, { mesaj: soru(12) })
    const sablon = blok.split('[CEVAP ŞABLONU — Soru 1] ')[1]
    assert.ok(!sablon.includes('Longitudinal'), 'genel özet şablonu tek muayenede kullanılmaz')
    const konum = BASLIKLAR.map((b, i) => sablon.indexOf(`${i + 1}) ${b} —`))
    assert.ok(konum.every((k, i) => k >= 0 && (i === 0 || k > konum[i - 1])), konum.join(','))
    for (const d of ['Her bölüm bir KISA paragraf', 'Kayıtta olmayan bölümü ATLAMA', '"aşı yapılmamış"', '"laboratuvar istenmemiş"', 'kısaca tartış', 'TANI koyma', 'persentil hesaplanmadı', 'Yalnız BU muayeneyi anlat', 'olmayan sayı']) assert.ok(sablon.includes(d), d)
    assert.match(blok, /Soru 1 \(tek muayene\): "Bu muayeneyi özetler misin\?"/)
    // The whole-chart summary keeps its own template.
    assert.match(kanitBlogu('ozet', olaylar, hasta, { mesaj: 'Bu hastayı bana kısaca özetler misin?' }), /Longitudinal özet/)
  })

  it('biçim: başlıklar sırasıyla ve kalın; "Dayanak" maddeleri yok; genel dosya sorusunun biçimi değişmedi', () => {
    const kural = dosyaSorguKuralBlogu(KORPUS_BEBEK.ad, { vizitOzetiBasliklari: ozet(12).bolumler.map((b) => b.baslik) })
    assert.ok(kural.includes(BASLIKLAR.map((b) => `**${b}:**`).join(' ')), kural.slice(-900))
    assert.ok(kural.includes(`"${KORPUS_BEBEK.ad}" adıyla başlar`) && kural.includes('"Dayanak" başlığı KULLANMA') && !kural.includes('sonra **Dayanak:** maddeleri'))
    const genel = dosyaSorguKuralBlogu(KORPUS_BEBEK.ad)
    assert.ok(genel.includes('sonra **Dayanak:** maddeleri') && !genel.includes('muayene özeti'))
    assert.equal(dosyaSorguKuralBlogu(KORPUS_BEBEK.ad, { vizitOzetiBasliklari: null }), genel)
  })

  it('ekran biçimi (kayıttan): adla başlar, sekiz kalın başlık sırasıyla, kayıtlı değerler ve eksik bölümlerin kısa ifadesi', () => {
    const e = vizitOzetEkrani(ozet(15), KORPUS_BEBEK.ad)
    assert.ok(e.startsWith(`${KORPUS_BEBEK.ad} — ${trGun(ozet(15).tarih)} tarihli muayenenin özeti (muayene tarihinde 15 aylık)`), e.slice(0, 120))
    const konum = BASLIKLAR.map((b) => e.indexOf(`**${b}:**`))
    assert.ok(konum.every((k, i) => k > 0 && (i === 0 || k > konum[i - 1])), konum.join(','))
    for (const d of ['kilo 10,6 kg (not metninden)', 'Aşı yapılmamış', 'Laboratuvar istenmemiş', 'Reçete yazılmamış', 'persentil hesaplanmadı', '3 ay sonra kontrol']) assert.ok(e.includes(d), `${d}\n${e}`)
    const e12 = vizitOzetEkrani(ozet(12), KORPUS_BEBEK.ad)
    assert.match(e12, /\*\*Aşı:\*\* Yapılmış \(aşı kaydı, \d{2}\.\d{2}\.\d{4}\): KPA .+ 3\. doz; KKK .+ 1\. doz; Suçiçeği .+ 1\. doz\./)
    assert.match(e12, /Büyüme motoru: Kilo 9,8 kg \(p\d+, z .+\); Boy 76 cm/)
  })

  it('denetim: kayıttaki özetin kendisi ve kurala uyan bir cevap geçer; değişmez', () => {
    for (const ay of AYLAR) {
      const kendi = vizitOzetEkrani(ozet(ay), KORPUS_BEBEK.ad)
      assert.deepEqual(vizitOzetiGuvenceyeAl(kendi, ozet(ay), KORPUS_BEBEK.ad), { metin: kendi, degisti: false, neden: null }, `${ay} ay`)
    }
    const uygun = [
      `${KORPUS_BEBEK.ad} 12 aylık sağlam çocuk muayenesine ${trGun(ozet(12).tarih)} tarihinde gelmiş.`,
      '**Muayene:** 12 aylık, rutin sağlam çocuk kontrolü.', '**Şikayet:** Şikayet yok; birkaç adım atıyor.', '**Muayene bulgusu:** Özellikli bulgu yok, altı diş var.',
      '**Laboratuvar:** Laboratuvar istenmemiş.', '**Aşı:** KPA 3. doz, KKK 1. doz ve Suçiçeği 1. doz yapılmış.',
      '**Büyüme ve gelişme:** Kilo 9,8 kg (p38), boy 76 cm (p39), baş çevresi 46.4 cm (p32); kayma yok, gelişim yaşına uygun.',
      '**Tedavi:** Reçete yazılmamış; demir profilaksisi kesilmiş.', '**Plan:** 3 ay sonra kontrol.',
    ].join('\n\n')
    assert.equal(vizitOzetiGuvenceyeAl(uygun, ozet(12), KORPUS_BEBEK.ad).degisti, false, String(vizitOzetiGuvenceyeAl(uygun, ozet(12), KORPUS_BEBEK.ad).neden))
  })

  it('denetim: atlanan bölüm, eksik kayıtlı değer ya da kayıtta olmayan değer / tarih → cevap kayıttaki özetle değiştirilir', () => {
    const o = ozet(12)
    const kendi = vizitOzetEkrani(o, KORPUS_BEBEK.ad)
    const bozuk: [string, string, RegExp][] = [
      // What the doctor got on 2026-10-02: complaint, assessment and plan only.
      ['canlı vakadaki ince cevap', `${KORPUS_BEBEK.ad} — 12 aylık sağlam çocuk muayenesi.\n\n**Dayanak:**\n- Şikayet: rutin kontrol\n- Değerlendirme: sağlam çocuk\n- Plan: 3 ay sonra kontrol`, /başlık yok/],
      ['aşı bölümü atlanmış', kendi.replace(/\*\*Aşı:\*\*[^\n]*\n\n/, ''), /başlık yok ya da sırası farklı: Aşı/],
      ['bölüm sırası değişmiş', kendi.replace('**Tedavi:**', '**X:**').replace('**Plan:**', '**Tedavi:**').replace('**X:**', '**Plan:**'), /sırası farklı/],
      ['kilo yazılmamış', kendi.replace(/9,8/g, '—'), /kayıtlı değer cevapta yok: 9,8/],
      ['başka muayenenin kilosu', kendi.replace('**Plan:**', '**Plan:** Güncel kilosu 12,8 kg.'), /kanıtta olmayan değer: .*12,8/],
      ['uydurma persentil', kendi.replace('**Plan:**', '**Plan:** Kilo p75 düzeyinde.'), /kanıtta olmayan değer: .*75/],
      ['uydurma tarih', kendi.replace('**Plan:**', '**Plan:** 01.01.2020 tarihinde görülmüş.'), /kanıtta olmayan tarih: 01\.01\.2020/],
      ['uydurma lab değeri', kendi.replace('**Plan:**', '**Plan:** Hemoglobin 9.1 g/dL.'), /kanıtta olmayan değer/],
    ]
    for (const [ad, cevap, neden] of bozuk) {
      const g = vizitOzetiGuvenceyeAl(cevap, o, KORPUS_BEBEK.ad)
      assert.equal(g.degisti, true, ad)
      assert.match(String(g.neden), neden, ad)
      assert.equal(g.metin, kendi, ad)
    }
  })
})

describe('NOTYA-AYSE-OZET-01 — erişkin (pediatri dışı): aynı bölümler, aşı ve büyüme yok', () => {
  const e = korpusEriskin(DENETIM_BUGUN)
  const eo = olaylariKur(e, DENETIM_BUGUN), eh = hastaKur(e, DENETIM_BUGUN)

  it('bölümler: muayene, şikayet, bulgu, laboratuvar, ölçümler, tedavi, plan — branşın kendi ölçümleriyle', () => {
    const ilk = vizitOzetiSec('ilk muayenesini özetle', eo, eh)!.ozet!
    assert.deepEqual(ilk.bolumler.map((b) => b.baslik), ['Muayene', 'Şikayet', 'Muayene bulgusu', 'Laboratuvar', 'Ölçümler', 'Tedavi', 'Plan'])
    assert.equal(ilk.pediatrik, false)
    const olcum = ilk.bolumler.find((b) => b.anahtar === 'olcum')!.kanit.join('\n')
    assert.match(olcum, /kilo 78 kg; boy 162 cm; VKİ 29,7 kg\/m² \(kilo ve boydan hesaplandı\); tansiyon 150\/95 mmHg; nabız 82\/dk/)
    assert.match(ilk.bolumler.find((b) => b.anahtar === 'tedavi')!.kanit.join('\n'), /Ramipril 5 mg tablet/)
    const blok = kanitBlogu('ozet', eo, eh, { mesaj: 'ilk muayenesini özetle' })
    // Evidence AND template: the adult template names neither vaccines nor growth.
    assert.doesNotMatch(blok.split('[KANIT')[1], /baş çevresi|persentil|Büyüme motoru|\) AŞI|[Aa]şı (yapıl|tablo|kayd)|gelişim/, 'pediatriye özgü içerik erişkine sızmaz')
  })

  it('son muayene: yakın tarihli lab sonuçları önceki sonuçla; referans dışı değer işaretli; önceki ölçüm karşılaştırması', () => {
    const son = vizitOzetiSec('son muayenesinin özetini ver', eo, eh)!.ozet!
    const lab = son.bolumler.find((b) => b.anahtar === 'lab')!.kanit.join('\n')
    assert.match(lab, /HbA1c: 7,1 % .+ laboratuvar referansının üstünde \(4–6\); önceki 7,8 % .+ → düşmüş/)
    assert.match(lab, /LDL kolesterol: 104 mg\/dL .+ referans içinde .+ önceki 142 mg\/dL .+ önceki referans dışıydı, şimdi referans içinde/)
    const olcum = son.bolumler.find((b) => b.anahtar === 'olcum')!.kanit.join('\n')
    assert.match(olcum, /kilo 75,5 kg; tansiyon 132\/84 mmHg; nabız 76\/dk; boy: kayıt yok/)
    assert.match(olcum, /önceki muayenelerdeki son kaydı: kilo 77 kg \(\d{2}\.\d{2}\.\d{4}\); tansiyon 134\/84 mmHg/)
    assert.ok(!son.bolumler.some((b) => b.anahtar === 'asi'))
  })

  it('çocuk hasta, pediatrik bağlamı olmayan branş: büyüme motoru yok denir, persentil yazılmaz', () => {
    const cocuk: HamDosya = { ...korpusBebek(DENETIM_BUGUN), brans: 'goz-hastaliklari' }
    const co = olaylariKur(cocuk, DENETIM_BUGUN), ch = hastaKur(cocuk, DENETIM_BUGUN)
    const o = vizitOzetiSec('12 aylık muayenesini özetle', co, ch)!.ozet!
    assert.equal(o.pediatrik, false)
    const olcum = o.bolumler.find((b) => b.anahtar === 'olcum')!.kanit.join('\n')
    assert.match(olcum, /büyüme eğrisi motoru tanımlı değil; persentil hesaplanmadı/)
    assert.doesNotMatch(olcum, /\(p\d|baş çevresi/)
  })
})
