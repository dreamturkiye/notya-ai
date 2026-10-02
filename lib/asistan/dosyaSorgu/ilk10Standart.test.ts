/**
 * NOTYA-ILK10-* — Dr. Gökhan'ın "İlk 10" standardının deterministik katmanı, sentetik dosyalarda (model yok,
 * veritabanı yok). Fikstürler: ./denetim/fikstur.ts (a–e). Her test standarttaki bir cümleyi kilitler.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { kanitBlogu } from './kanit'
import { asiKaniti, asiKanitSatirlari, asiOzetSatirlari, asiSonucu, kesinYas } from './asiKaniti'
import { parametreSec } from './parametreler'
import type { SoruTuru } from './soruTuru'
import { DENETIM_BUGUN, FIKSTUR_A, FIKSTUR_B, FIKSTUR_C, FIKSTUR_D, FIKSTUR_E } from './denetim/fikstur'
import { olaylariKur, hastaKur, type HamDosya } from '@/lib/doktor/dosyaOlaylari'
import { acikIsleriBul } from '@/lib/doktor/acikIsler'

function dosya(ham: HamDosya, bugun = DENETIM_BUGUN) {
  const olaylar = olaylariKur(ham, bugun)
  const hasta = hastaKur(ham, bugun)
  const p = parametreSec(hasta.brans, hasta.dogumIso, hasta.bugunIso)
  return {
    olaylar, hasta, p,
    kanit: (t: SoruTuru, mesaj?: string) => kanitBlogu(t, olaylar, hasta, { mesaj }).split('[CEVAP ŞABLONU')[0],
    isler: () => acikIsleriBul(olaylar, null, hasta.brans, hasta),
    asi: () => asiKaniti(olaylar, hasta, p),
  }
}
const hepsi = (i: ReturnType<typeof acikIsleriBul>) => [...i.bugun, ...i.yakinda, ...i.rutin]

describe('NOTYA-ILK10-ASI-01 — aşı durumu kanıtı', () => {
  it('kesin yaş doğum tarihinden: yıl, ay, gün', () => {
    assert.equal(kesinYas('2024-09-10', '2026-09-26'), '2 yaş 16 gün (24 ay)')
    assert.equal(kesinYas('2024-07-20', '2026-09-26'), '2 yaş 2 ay 6 gün (26 ay)')
    assert.equal(kesinYas('2026-01-26', '2026-09-26'), '8 ay')
    assert.equal(kesinYas('2026-09-20', '2026-09-26'), '6 gün')
    // Ay sonu ödünç: 31 Ocak → 1 Mart = 1 ay 1 gün (Şubat 28 gün).
    assert.equal(kesinYas('2026-01-31', '2026-03-01'), '1 ay 1 gün')
  })

  it('planlanmış ama uygulanmamış doz: "planlandı", uygulandı DEĞİL — Soru 4, 1, 9 ve 10 aynı şeyi söyler', () => {
    const d = dosya(FIKSTUR_A)
    const k = d.asi()!
    const plan = k.planlar.find((p) => p.seri === 'hepb' && p.doz === 2)
    assert.ok(plan && plan.karsilik === null, JSON.stringify(k.planlar))
    assert.ok(!k.belgeli.some((x) => x.ad === 'Hepatit B 2. doz'))
    const s4 = d.kanit('asi')
    assert.ok(s4.includes('Hepatit B 2. doz — planlandı') && s4.includes('uygulandığına dair kayıt bulamadım'), s4)
    assert.ok(!s4.includes('Hepatit B 2. doz — uygulandı'), s4)
    assert.ok(d.kanit('ozet').includes('AŞI (planlanmış, uygulama kaydı yok): Hepatit B 2. doz — planlandı'))
    assert.ok(d.kanit('takip').includes('Hepatit B 2. doz — planlandı'))
    assert.ok(d.kanit('gozden-kacan').includes('Hepatit B 2. doz — planlandı'))
  })

  it('aynı gün iki doz: "kayıt tutarsız", "gecikti" DEĞİL — ve o seride eksik doz yazılmaz', () => {
    const d = dosya(FIKSTUR_E)
    const k = d.asi()!
    assert.equal(k.tutarsiz.length, 1, JSON.stringify(k.tutarsiz))
    assert.equal(k.tutarsiz[0].seri, 'hepb')
    assert.match(k.tutarsiz[0].neden, /aynı tarihte kayıtlı/)
    assert.ok(!k.eksik.some((x) => x.seri === 'hepb'), 'tutarsız seride eksik doz sayılmamalı')
    assert.ok(k.bilinmeyen.some((x) => x.seri === 'hepb'))
    assert.match(asiSonucu(k), /^Kesin söylenemez/)
    const s4 = d.kanit('asi')
    assert.ok(s4.includes('KAYIT TUTARSIZ ("gecikti" DEĞİL'), s4)
    assert.ok(s4.includes('10.09.2024 tarihli kayıt aynı seriden başka bir dozla (1. doz) aynı tarihte kayıtlı'), s4)
    assert.ok(!/Hepatit B \d\. doz — zamanı (geçmiş|gelmiş)/.test(s4), s4)
    // Soru 1, 9, 10
    assert.ok(d.kanit('ozet').includes('AŞI (kayıt tutarsız — "gecikti" değil)'))
    const isler = hepsi(d.isler())
    assert.ok(isler.some((i) => i.tur === 'celiski' && /Aşı kaydı tutarsız/.test(i.metin)), JSON.stringify(isler.map((i) => i.metin)))
    assert.ok(!isler.some((i) => i.tur === 'asi-eksik' && /Hepatit B/.test(i.metin)))
    assert.ok(d.kanit('takip').includes('Aşı kaydı tutarsız'))
    assert.ok(d.kanit('gozden-kacan').includes('ÇELİŞEN KAYIT:') && d.kanit('gozden-kacan').includes('Aşı kaydı tutarsız'))
  })

  it('zamanı gelmiş / geçmiş doz: adıyla, önerilen tarihiyle ve telafi notuyla', () => {
    const a = dosya(FIKSTUR_A)
    assert.ok(a.asi()!.eksik.some((x) => x.ad === 'Hepatit B 3. doz'))
    assert.ok(a.kanit('asi').includes('Hepatit B 3. doz — zamanı geçmiş'))
    const dd = dosya(FIKSTUR_D)
    assert.ok(dd.kanit('asi').includes('KKK (kızamık-kızamıkçık-kabakulak) 1. doz — zamanı geçmiş'))
    assert.ok(dd.kanit('asi').includes('TELAFİ (catch-up) GEREKSİNİMİ:'))
    assert.ok(hepsi(dd.isler()).some((i) => i.tur === 'asi-eksik' && /KKK/.test(i.metin) && /uygulandığına dair kayıt bulamadım/.test(i.metin)))
    // Planlanmış ve zamanı gelmiş doz (e): Hepatit A 2. doz 24. ayda — planlandı, satırı yok.
    const e = dosya(FIKSTUR_E)
    assert.ok(e.asi()!.eksik.some((x) => x.ad === 'Hepatit A 2. doz'), JSON.stringify(e.asi()!.eksik))
    assert.ok(e.kanit('asi').includes('Hepatit A 2. doz — zamanı gelmiş'))
  })

  it('aşıları tam hasta: eksik yok, telafi yok — ve bunu açıkça söyler', () => {
    const d = dosya(FIKSTUR_B)
    const k = d.asi()!
    assert.deepEqual([k.eksik.length, k.tutarsiz.length, k.telafi.length, k.planlar.filter((p) => !p.karsilik).length], [0, 0, 0, 0])
    assert.match(asiSonucu(k), /hepsi belgelenmiş; eksik ya da zamanı gelmiş doz saptanmadı/)
    const s4 = d.kanit('asi')
    assert.ok(s4.includes('EKSİK / ZAMANI GELMİŞ (takvime göre, aşı tablosunda kayıt yok):\n- (yok)'), s4)
    assert.ok(s4.includes('TELAFİ (catch-up) GEREKSİNİMİ: yok.'), s4)
    assert.ok(!hepsi(d.isler()).some((i) => i.tur === 'asi-eksik' || i.tur === 'celiski'))
  })

  it('rutin ile risk bazlı ayrı: mevsimsel influenza rutin eksik sayılmaz', () => {
    const d = dosya(FIKSTUR_C)
    const k = d.asi()!
    assert.ok(k.riskBazli.some((r) => /nfluenza|grip/i.test(r)), JSON.stringify(k.riskBazli))
    assert.ok(!k.eksik.some((x) => /nfluenza|grip/i.test(x.ad)))
    const s4 = d.kanit('asi')
    assert.ok(s4.includes('RİSK BAZLI / TAKVİM DIŞI (rutinden ayrı):') && s4.includes('"eksik aşı" sayılmaz'), s4)
  })

  it('aşı tablosu boşsa takvimin bütün dozları "eksik" diye sayılmaz', () => {
    const bos: HamDosya = { ...FIKSTUR_C, asilar: [] }
    const d = dosya(bos)
    assert.match(asiSonucu(d.asi()!), /hiç uygulama kaydı yok/)
    assert.equal(hepsi(d.isler()).filter((i) => i.tur === 'asi-eksik').length, 1)
    assert.ok(asiOzetSatirlari(d.asi()!)[0].includes('"tam" ya da "eksik" denmez'))
  })

  it('blok "yapılmadı / uygulanmadı" demez, hasta adını taşımaz; kategoriler ayrı yazılır', () => {
    for (const f of [FIKSTUR_A, FIKSTUR_B, FIKSTUR_C, FIKSTUR_D, FIKSTUR_E]) {
      const d = dosya(f)
      const satirlar = asiKanitSatirlari(d.asi()!).join('\n')
      assert.ok(!/yapılmadı|uygulanmadı/i.test(satirlar), satirlar)
      assert.ok(!satirlar.includes(f.hasta.ad))
      assert.ok(satirlar.includes('planlandı / önerildi / reçete edildi / randevu verildi / uygulandığı söylendi / uygulandığı belgelenmiş / durumu belirsiz'))
      assert.ok(satirlar.includes('kesin yaş:'))
    }
  })

  it('pediatri dışı branş: aşı takvimi hesabı yok, kanıt eski yoldan (dokunulmadı)', () => {
    const eriskin: HamDosya = { ...FIKSTUR_C, brans: 'Kardiyoloji', hasta: { ...FIKSTUR_C.hasta, dogumIso: '1970-01-01' } }
    const d = dosya(eriskin)
    assert.equal(d.asi(), null)
    const s4 = d.kanit('asi')
    assert.ok(s4.includes('erişkin aşı takvimi parametreleri henüz tanımlı değil'), s4)
    assert.ok(!s4.includes('kesin yaş') && !s4.includes('TELAFİ'), s4)
  })
})
