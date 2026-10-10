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
import { acikIsleriBul, kontrolVadesi } from '@/lib/doktor/acikIsler'
import { SORU_SABLONLARI } from './kurallar'
import { dozBayraklari, dozGuvenligi } from '@/lib/doktor/dozGuvenligi'
import { enIyiIlacAnahtari } from '@/lib/asistan/turkishDrugs'
import { buyumeHizlari, olcumSatirlari } from '@/specialties/pediatri/engines/buyume'
import { buyumeHiziSatiri, buyumeOlcumleri, persentilZMetni } from '@/specialties/pediatri/sorgu'

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

  it('tutarsız serinin satırları kayıttaki doz numarasıyla gösterilir, yeniden numaralanmaz', () => {
    const s4 = dosya(FIKSTUR_E).kanit('asi')
    assert.ok(s4.includes('Hepatit B — aşı tablosundaki satırlar: 1. doz 10.09.2024; 2. doz 10.09.2024; 3. doz'), s4)
    assert.ok(!/Hepatit B \d\. doz — uygulandı/.test(s4), s4)
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

describe('NOTYA-ILK10-YAPI-01 — cevap yapıları ve kanıt sırası', () => {
  const sira = (blok: string, basliklar: string[]) => basliklar.map((b) => blok.indexOf(b))
  const artan = (d: number[]) => d.every((x, i) => x >= 0 && (i === 0 || x > d[i - 1]))

  it('Soru 1 — kanıt standarttaki sırayla ve büyüme, gelişim, aşı durumu İÇİNDE', () => {
    const blok = dosya(FIKSTUR_E).kanit('ozet')
    const d = sira(blok, ['Prenatal / natal', 'TANILAR', 'KRONİK / ÖZGEÇMİŞ', 'ALERJİ:', 'AKTİF İLAÇ:', 'BÜYÜME:', 'GELİŞİM:', 'AŞI:', 'ÖNEMLİ LAB:', 'TAKİP GEREKTİRENLER:'])
    assert.ok(artan(d), `${d}\n${blok}`)
    assert.ok(/BÜYÜME:\n- 19\.09\.2026 \(2 yaş\): Kilo 13,6 kg \(p\d+, z /.test(blok), blok)
    assert.ok(blok.includes('Gelişimsel tarama planlanmış (10.03.2026: "M-CHAT planlandı"); tamamlanmış sonuç dosyada görünmüyor'), blok)
    assert.ok(blok.includes('eksik / zamanı gelmiş: Hepatit A 2. doz'), blok)
    assert.match(SORU_SABLONLARI.ozet.sablon, /BÜYÜME, GELİŞİM ve AŞI satırlarını ATLAMA/)
  })

  it('Soru 3 — persentil, z-skoru ve büyüme hızı MOTORUN verdiği değerdir (engines/buyume.ts)', () => {
    const d = dosya(FIKSTUR_E)
    const blok = d.kanit('buyume')
    // Motor, çelişen 10.06.2026 kilosu olmadan (aşağıdaki test) aynı ölçümlerle doğrudan çağrılır.
    const satirlar = olcumSatirlari('neyzi', 'male', FIKSTUR_E.hasta.dogumIso!, [
      { tarih: '2026-03-10', kilo: 11.2, boy: 82, basCevresi: 47.5 }, { tarih: '2026-06-10', boy: 85.5 }, { tarih: '2026-09-19', kilo: 13.6, boy: 88 },
    ])
    const son = satirlar[2]
    assert.ok(blok.includes(`- 19.09.2026 (2 yaş): Kilo 13,6 kg (${persentilZMetni(son.sonuc.kilo!)}); Boy 88 cm (${persentilZMetni(son.sonuc.boy!)})`), blok)
    assert.ok(blok.includes(`Baş çevresi 47,5 cm (${persentilZMetni(satirlar[0].sonuc.basCevresi!)})`), blok)
    const hizlar = buyumeHizlari(satirlar)
    assert.deepEqual(hizlar.map((h) => h.param), ['boy', 'kilo'])
    for (const h of hizlar) assert.ok(blok.includes(`- ${buyumeHiziSatiri(h)}`), `${buyumeHiziSatiri(h)}\n${blok}`)
    // Hangi tarihler arasında + yıllık hız.
    assert.ok(/Kilo artışı: \+2,4 kg \(10\.03\.2026 → 19\.09\.2026, 6,3 ay\); büyüme hızı ≈ [\d,]+ kg\/yıl\./.test(blok), blok)
    assert.ok(blok.includes('Referans: Neyzi'), blok)
  })

  it('Soru 3 — çelişen ölçüm işaretlenir ve eğilime alınmaz', () => {
    const d = dosya(FIKSTUR_E)
    const { olcumler, celiskiler } = buyumeOlcumleri(d.olaylar)
    assert.deepEqual(celiskiler.map((c) => [c.tarih, c.param, c.degerler.map((x) => x.deger).sort()]), [['2026-06-10', 'kilo', [10.4, 12.4]]])
    assert.equal(olcumler.find((o) => o.tarih === '2026-06-10')?.kilo, undefined)
    assert.equal(olcumler.find((o) => o.tarih === '2026-06-10')?.boy, 85.5)
    const blok = d.kanit('buyume')
    assert.ok(blok.includes('ÇELİŞEN ÖLÇÜM — 10.06.2026 kilo: 12,4 kg (muayene alanı) / 10,4 kg (cihaz ölçümü)'), blok)
    assert.ok(blok.includes('- 10.06.2026 (21 aylık): Boy 85,5 cm'), blok)
    assert.ok(!/10\.06\.2026 \(21 aylık\): Kilo/.test(blok), blok)
    assert.ok(!blok.split('\n').some((s) => s.includes('Kilo artışı') && s.includes('10.06.2026')), blok)
    assert.ok(hepsi(d.isler()).some((i) => i.tur === 'celiski' && /Çelişen ölçüm: 10\.06\.2026/.test(i.metin)))
  })

  it('Soru 3 — ölçüm yoksa ya da cinsiyet yoksa bunu söyler; persentil uydurmaz', () => {
    const olcumsuz: HamDosya = { ...FIKSTUR_E, cihaz: [], vizitler: FIKSTUR_E.vizitler.map((v) => ({ ...v, vitaller: null })) }
    const b1 = dosya(olcumsuz).kanit('buyume')
    assert.ok(b1.includes('ölçümü bulamadım; persentil, eğilim ve hız hesaplanmadı (tahmin verilmez)'), b1)
    assert.ok(!/\(p\d+, z /.test(b1), b1)
    const cinsiyetsiz: HamDosya = { ...FIKSTUR_E, hasta: { ...FIKSTUR_E.hasta, cinsiyet: null } }
    const b2 = dosya(cinsiyetsiz).kanit('buyume')
    assert.ok(b2.includes('persentil hesaplanamadı'), b2)
    assert.ok(!/\(p\d+, z /.test(b2), b2)
    // Tek ölçüm: eğilim ve hız yok.
    const tek = dosya({ ...FIKSTUR_C, vizitler: FIKSTUR_C.vizitler.slice(0, 1) }).kanit('buyume')
    assert.ok(tek.includes('Tek ölçüm var') && !tek.includes('artışı'), tek)
    assert.match(SORU_SABLONLARI.buyume.sablon, /ASLA tahmin etme/)
  })

  it('Soru 8 — kanıt altı başlığın sırasıyla; risk ve koruyucu etmenler yalnız dosyadan', () => {
    const blok = dosya(FIKSTUR_E).kanit('gelisim')
    const d = sira(blok, ['Kronolojik yaş:', 'NOTLARDAKİ GELİŞİM GÖZLEMLERİ', 'GELİŞİMSEL RİSK ETMENLERİ', 'KORUYUCU ETMENLER', 'TARAMA DURUMU', 'ÖNERİLEN SONRAKİ ADIM'])
    assert.ok(artan(d), `${d}\n${blok}`)
    for (const s of ['düzeltilmiş yaş', 'Prematürite — gebelik haftası 35', 'Yenidoğan yoğun bakım öyküsü', 'Demir eksikliği —', 'Ebeveyn kaygısı — 10.03.2026 notu', 'Ekran süresi — 10.03.2026 notu: "Günde 2 saat ekran izliyor."',
      '- 10.03.2026: "Yürüyor, 8-10 kelimesi var, istediğini işaret ederek gösteriyor, ismine bakıyor."',
      '18–24 ay: sosyal iletişim, ortak dikkat, işaret etme, isme yanıt, göz teması, dil ve tekrarlayıcı davranış',
      'Dosyada kaydı olmayan etmenler (kayıt yok — "yok" anlamına gelmez, sorulmalı):', 'psikososyal stres',
      'Gelişimsel tarama planlanmış (10.03.2026: "M-CHAT planlandı"); tamamlanmış sonuç dosyada görünmüyor',
      'tarihinde planlanan taramanın ("M-CHAT planlandı") tamamlanması — sonuç kaydı yok']) assert.ok(blok.includes(s), `içermeli: ${s}\n${blok}`)
    // Planlanmış tarama yapılmış sayılmaz; gözlemden tarama sonucu üretilmez.
    assert.ok(blok.includes('Kayıtlı tarama sonucu (GİDR / M-CHAT-R/F / diğer) yok.'), blok)
    assert.ok(!/M-CHAT-R\/F: (düşük|dusuk)/.test(blok), blok)
    const sablon = SORU_SABLONLARI.gelisim.sablon
    const basliklar = ['**Genel değerlendirme:**', '**Güçlü alanlar:**', '**İzlenmesi gereken alanlar:**', '**Gelişimsel risk ve koruyucu etmenler:**', '**Tarama durumu:**', '**Önerilen sonraki adım:**']
    assert.ok(artan(basliklar.map((b) => sablon.indexOf(b))), sablon)
    assert.match(sablon, /klinik gözlemden tarama sonucu ÜRETME/)
  })

  it('Soru 8 — kayıtlı tarama sonucu varsa söylenir ve koruyucu etmendir; kaygı yoksa kaygı yazılmaz', () => {
    const blok = dosya(FIKSTUR_B).kanit('gelisim')
    assert.ok(blok.includes('GİDR (6-8 ay): sevk önerilmedi'), blok)
    assert.ok(/KORUYUCU ETMENLER \(dosyada kayıtlı\):\n- GİDR \(6-8 ay\): sevk önerilmedi/.test(blok), blok)
    assert.ok(blok.includes('Düzenli sağlam çocuk izlemi: 3 vizit'), blok)
    assert.ok(!blok.includes('Ebeveyn kaygısı —'), blok)
    assert.ok(!blok.includes('Prematürite —'), blok)
  })

  it('Soru 8 — beceri kaybı (regresyon) yüksek öncelikli uyarıdır', () => {
    const reg: HamDosya = { ...FIKSTUR_B, vizitler: [...FIKSTUR_B.vizitler, { id: 'b-v4', tarih: '2026-09-20T09:00:00Z', subjektif: 'Önce heceliyordu, artık konuşmuyor.', objektif: 'Doğal.', tani: 'Gelişim izlemi', plan: 'Kontrol.' }] }
    const d = dosya(reg)
    const blok = d.kanit('gelisim')
    assert.ok(blok.includes('⚠ Regresyon ifadesi (20.09.2026) — yüksek öncelik.'), blok)
    assert.ok(blok.includes('- Beceri kaybı (regresyon) ifadesi — yüksek öncelikli uyarı'), blok)
    assert.ok(d.isler().bugun.some((i) => i.tur === 'gelisim' && /regresyon/.test(i.metin)))
  })

  it('Soru 9 — üç sepet; aşı sepette; geçmiş takip penceresi bugünün tarihiyle söylenir', () => {
    const d = dosya(FIKSTUR_E)
    const blok = d.kanit('takip')
    assert.ok(artan(sira(blok, ['Bugünün tarihi 26.09.2026', '1) BUGÜN:', '2) YAKIN ZAMANDA:', '3) RUTİN:'])), blok)
    const bugun = blok.split('1) BUGÜN:')[1].split('2) YAKIN ZAMANDA:')[0]
    const yakinda = blok.split('2) YAKIN ZAMANDA:')[1].split('3) RUTİN:')[0]
    assert.ok(bugun.includes('Hepatit A 2. doz — planlandı') && bugun.includes('uygulandığına dair kayıt bulamadım'), bugun)
    assert.ok(bugun.includes('Aşı kaydı tutarsız — Hepatit B 2. doz'), bugun)
    assert.ok(bugun.includes('Koşullu kontrol 22.09.2026 için yazılmıştı (19.09.2026 notu: "48-72 saat içinde düzelmezse kontrol"); sonraki vizit kaydı yok, düzelme durumu kayıtlı değil — pencere 4 gün önce doldu.'), bugun)
    assert.ok(yakinda.includes('Gelişimsel tarama (M-CHAT-R/F) planlandı') && yakinda.includes('Ferritin: 9 ng/mL'), yakinda)
    const sablon = SORU_SABLONLARI.takip.sablon
    assert.ok(artan(['**1) Bugün yapılacaklar**', '**2) Yakın zamanda**', '**3) Daha sonra / rutin**'].map((b) => sablon.indexOf(b))), sablon)
    assert.match(sablon, /süresi geçmiş bir kontrolü hâlâ önündeymiş gibi anlatma/)
  })

  it('Soru 9 — pencere henüz dolmadıysa "doldu" denmez; dolduğu gün ve sonrası gün sayısıyla', () => {
    const takip = (bugun: string) => dosya(FIKSTUR_E, bugun).kanit('takip')
    assert.ok(/Koşullu kontrol 22\.09\.2026 için yazıldı[^\n]*randevu kaydı yok\./.test(takip('2026-09-20')) && !takip('2026-09-20').includes('doldu.'), takip('2026-09-20'))
    assert.ok(takip('2026-09-22').includes('— pencere bugün doluyor.'))
    assert.ok(takip('2026-09-29').includes('— pencere 7 gün önce doldu.'))
    assert.equal(kontrolVadesi({ metin: '48-72 saat içinde düzelmezse kontrol', tarih: '2026-09-19' }), '2026-09-22')
    assert.equal(kontrolVadesi({ metin: '3 gün içinde düzelmezse kontrol', tarih: '2026-09-19' }), '2026-09-22')
    assert.equal(kontrolVadesi({ metin: '2 hafta sonra kontrol', tarih: '2026-09-10' }), '2026-09-24')
    assert.equal(kontrolVadesi({ metin: 'Gerekirse kontrol', tarih: '2026-09-10' }), null)
  })

  it('Soru 9 — ilaç sonrası kontrol rutin sepetinde: kür doldu, sonrasında vizit yok', () => {
    const d = dosya(FIKSTUR_E, '2026-10-05')
    const rutin = d.isler().rutin.map((i) => i.metin).join('\n')
    assert.ok(rutin.includes('İlaç sonrası kontrol: Augmentin BID 400 mg/5 ml süspansiyon kürü 28.09.2026 tarihinde doldu (başlangıç 19.09.2026, 10 gün); sonrasında vizit / değerlendirme kaydı yok.'), rutin)
    // Kür sürerken yazılmaz.
    assert.ok(!hepsi(dosya(FIKSTUR_E).isler()).some((i) => /İlaç sonrası kontrol/.test(i.metin)))
  })
})

describe('NOTYA-ILK10-DOZ-01 — doz güvenliği (mg/kg/gün, reçete tarihindeki kiloyla)', () => {
  /** (c) dosyasının aktif amoksisilin satırı ve reçetesi başka bir yazımla. */
  const amoksisilinle = (ilac_adi: string, doz: string, kullanim: string, ek: Partial<HamDosya> = {}): HamDosya => ({
    ...FIKSTUR_C, intake: { alerjiVarMi: 'Hayır' }, ...ek,
    vizitler: (ek.vizitler || FIKSTUR_C.vizitler).map((v) => (v.id === 'c-v3' ? { ...v, ilaclar: [{ ad: ilac_adi, doz, kullanim }] } : v)),
    ilaclar: [{ id: 'c-i2', ilac_adi, etken_madde: 'amoksisilin', doz, kullanim_sikli: kullanim, baslangic_tarihi: '2026-09-20', aktif: true }],
  })
  const doz = (ham: HamDosya, bugun = DENETIM_BUGUN) => { const d = dosya(ham, bugun); return dozGuvenligi(d.olaylar, d.hasta) }

  it('aralıktaki süspansiyon dozu: mg/kg/gün hesaplanır, bayrak YOK', () => {
    const g = doz(FIKSTUR_C)
    const a = g.ilaclar.find((i) => i.kaynak === 'liste' && /Amoksisilin/.test(i.ad))!
    // 7,5 mL × 250 mg/5 mL × 2 = 750 mg/gün; 16,5 kg → 45,5 mg/kg/gün; tablo 20–90.
    assert.deepEqual([a.durum, a.bayrak, a.gunlukMg, a.mgKgGun, a.kilo, a.kiloTarihi], ['aralikta', false, 750, 45.5, 16.5, '2026-09-20'])
    assert.equal(dozBayraklari(g).length, 0)
    const blok = dosya(FIKSTUR_C).kanit('ilac')
    assert.ok(blok.includes('7,5 mL × 250 mg/5 mL = 375 mg/doz × günde 2 = 750 mg/gün; başlangıç tarihindeki kilo 16,5 kg (20.09.2026) → 45,5 mg/kg/gün — tablodaki aralıkta (20–90 mg/kg/gün; Amoksisilin; kaynak: TİTCK KÜB'), blok)
    assert.ok(!hepsi(dosya(FIKSTUR_C).isler()).some((i) => i.tur === 'guvenlik-doz'))
  })

  it('üst sınırın üzerindeki süspansiyon dozu bayraklanır: Soru 6, 9 ve 10 — hasta güvenliği maddesi', () => {
    const ham = amoksisilinle('Amoksisilin 400 mg/5 ml süspansiyon', '12 ml', '2x1, 10 gün')
    const g = doz(ham)
    const a = g.ilaclar.find((i) => i.kaynak === 'liste')!
    // 12 mL × 400 mg/5 mL × 2 = 1920 mg/gün; 16,5 kg → 116,4 mg/kg/gün; tablonun üst sınırı 90.
    assert.deepEqual([a.durum, a.bayrak, a.kesin, a.gunlukMg, a.mgKgGun], ['ust-sinir-ustu', true, true, 1920, 116.4])
    assert.equal(dozBayraklari(g).length, 1, 'liste satırı ve reçetesi aynı kür: tek bayrak')
    const d = dosya(ham)
    assert.ok(d.kanit('ilac').includes('- ⚠ Amoksisilin 400 mg/5 ml süspansiyon: 12 mL × 400 mg/5 mL = 960 mg/doz × günde 2 = 1.920 mg/gün; başlangıç tarihindeki kilo 16,5 kg (20.09.2026) → 116,4 mg/kg/gün — tablodaki olağan üst sınırın (90 mg/kg/gün) ÜZERİNDE'), d.kanit('ilac'))
    const is = d.isler().bugun.find((i) => i.tur === 'guvenlik-doz')
    assert.ok(is && is.guvenlik && /^Doz güvenliği — Amoksisilin 400 mg\/5 ml/.test(is.metin), JSON.stringify(d.isler().bugun))
    assert.ok(d.kanit('takip').split('2) YAKIN ZAMANDA:')[0].includes('⚠ Doz güvenliği — Amoksisilin 400 mg/5 ml'))
    assert.ok(/HASTA GÜVENLİĞİ:\n- ⚠ Doz güvenliği — Amoksisilin 400 mg\/5 ml/.test(d.kanit('gozden-kacan')), d.kanit('gozden-kacan'))
  })

  it('etkin aralığın altındaki doz bayraklanır (hasta güvenliği alarmı değil, doğrulanacak)', () => {
    const d = dosya(amoksisilinle('Amoksisilin 125 mg/5 ml süspansiyon', '2,5 ml', '2x1, 10 gün'))
    const g = dozGuvenligi(d.olaylar, d.hasta)
    // 2,5 mL × 125 mg/5 mL × 2 = 125 mg/gün; 16,5 kg → 7,6 mg/kg/gün; tablonun alt sınırı 20.
    assert.deepEqual([g.ilaclar[0].durum, g.ilaclar[0].bayrak, g.ilaclar[0].mgKgGun], ['etkin-aralik-alti', true, 7.6])
    const is = d.isler().bugun.find((i) => i.tur === 'guvenlik-doz')
    assert.ok(is && !is.guvenlik && /ALTINDA/.test(is.metin))
    assert.ok(d.kanit('gozden-kacan').includes('DOZ GÜVENLİĞİ (doğrulanacak):'))
  })

  it('tabloda olmayan ilaç: "referans yok" — bayrak yok, referans uydurulmaz', () => {
    const g = doz(FIKSTUR_E)
    const b = g.ilaclar.find((i) => i.ad === 'QA Bitkisel Şurup')!
    assert.deepEqual([b.durum, b.bayrak, b.mgKgGun], ['referans-yok', false, undefined])
    assert.match(b.metin, /Notya ilaç tablosunda yok — referans yok; doz denetlenmedi\./)
    assert.ok(!/\d+ mg\/kg/.test(b.metin), b.metin)
    assert.ok(!dozBayraklari(g).some((i) => i.ad === 'QA Bitkisel Şurup'))
    // Kiloya göre dozlanmayan ilaç (IU/gün) için mg/kg hesabı uygulanmaz.
    assert.equal(g.ilaclar.find((i) => i.ad === 'D vitamini damla')!.durum, 'kilo-bagimsiz')
  })

  it('kilo REÇETE TARİHİNDEKİ kilodur: vizit ölçümü, yoksa öncesindeki en yakın ölçüm, yoksa "kilo bilinmiyor"', () => {
    // Vizitte ölçüm yok → önceki vizitin kilosu (16,3 kg, 05.06.2026) ve bunun söylenmesi.
    const onceki = amoksisilinle('Amoksisilin 250 mg/5 ml süspansiyon', '7,5 ml', '2x1, 10 gün', { vizitler: FIKSTUR_C.vizitler.map((v) => (v.id === 'c-v3' ? { ...v, vitaller: null } : v)) })
    const a = doz(onceki).ilaclar[0]
    assert.deepEqual([a.kilo, a.kiloTarihi, a.mgKgGun], [16.3, '2026-06-05', 46])
    assert.match(a.metin, /başlangıç tarihindeki kilo 16,3 kg \(05\.06\.2026 — o tarihten önceki en yakın ölçüm\)/)
    // Sonradan girilen (güncel) kilo hesabı değiştirmez.
    const sonra: HamDosya = { ...FIKSTUR_C, intake: { alerjiVarMi: 'Hayır' }, vizitler: [...FIKSTUR_C.vizitler, { id: 'c-v4', tarih: '2026-09-25T11:00:00Z', subjektif: 'Kontrol.', objektif: 'Doğal.', tani: 'Kontrol', plan: 'Devam.', vitaller: { kilo: '30' } }] }
    assert.equal(doz(sonra).ilaclar.find((i) => i.kaynak === 'liste' && /Amoksisilin/.test(i.ad))!.kilo, 16.5)
    // Hiç kilo yok.
    const kilosuz = amoksisilinle('Amoksisilin 250 mg/5 ml süspansiyon', '7,5 ml', '2x1, 10 gün', { vizitler: FIKSTUR_C.vizitler.map((v) => ({ ...v, vitaller: null })) })
    const k = doz(kilosuz).ilaclar[0]
    assert.deepEqual([k.durum, k.bayrak], ['hesaplanamadi', false])
    assert.match(k.metin, /kilo kaydı yok; kilo bilinmiyor \(güncel kilo kullanılmaz\)/)
  })

  it('hesaplanamayan yazımlar nedenini söyler; konsantrasyon ve sıklık varsayılmaz', () => {
    const neden = (ad: string, d: string, s: string) => doz(amoksisilinle(ad, d, s)).ilaclar[0]
    assert.match(neden('Amoksisilin süspansiyon', '7,5 ml', '2x1').metin, /konsantrasyonu \(mg\/mL\) kayıtta yok; konsantrasyon varsayılmadı/)
    assert.match(neden('Amoksisilin 250 mg/5 ml süspansiyon', '7,5 ml', '').metin, /günlük sıklık yazılmamış/)
    for (const i of [neden('Amoksisilin süspansiyon', '7,5 ml', '2x1'), neden('Amoksisilin 250 mg/5 ml süspansiyon', '7,5 ml', '')]) assert.deepEqual([i.durum, i.bayrak], ['hesaplanamadi', false])
    // Aynı gün çelişen kilo kayıtlarıyla hesap yapılmaz.
    const celiskili: HamDosya = { ...amoksisilinle('Amoksisilin 250 mg/5 ml süspansiyon', '7,5 ml', '2x1, 10 gün'), cihaz: [{ id: 'c-c1', tur: 'kilo', deger: '12,0', birim: 'kg', alindi: '2026-09-20T11:30:00Z' }] }
    assert.match(doz(celiskili).ilaclar[0].metin, /20\.09\.2026 tarihinde çelişen kilo kayıtları var \(12 kg \/ 16,5 kg\)/)
    // mg ve mg/kg yazımı.
    assert.equal(neden('Amoksisilin 500 mg tablet', '500 mg', '3x1').mgKgGun, 90.9)
    assert.equal(neden('Amoksisilin süspansiyon', '50 mg/kg/gün', '2x1').mgKgGun, 50)
  })

  it('formülasyona özgü referans: ürün o formülasyon değilse bayrak "doğrulanacak"tır, alarm değildir; uyuşmazlık ayrıca yazılır', () => {
    const d = dosya(FIKSTUR_E)
    const g = dozGuvenligi(d.olaylar, d.hasta)
    const liste = g.ilaclar.find((i) => i.kaynak === 'liste' && /Augmentin/.test(i.ad))!
    const recete = g.ilaclar.find((i) => i.kaynak === 'recete')!
    // 8 mL × 400 mg/5 mL × 2 = 1280 mg/gün ve 8 mL × 600 mg/5 mL × 2 = 1920 mg/gün; 13,6 kg.
    assert.deepEqual([liste.mgKgGun, recete.mgKgGun, liste.bayrak, recete.bayrak, liste.kesin, recete.kesin], [94.1, 141.2, true, true, false, false])
    assert.match(recete.metin, /Tablodaki referans 4:1 pediatrik süspansiyon içindir; bu ürünün formülasyonu kayıttan doğrulanamadı — bu formülasyon için tabloda referans yok, ürünün kendi KÜB'ünden teyit edin\./)
    assert.equal(g.uyumsuzluklar.length, 1)
    assert.match(g.uyumsuzluklar[0].metin, /vizit reçetesinde "Augmentin ES 600 mg\/5 ml süspansiyon", ilaç listesinde "Augmentin BID 400 mg\/5 ml süspansiyon" — aynı etken madde, ürün adı ve konsantrasyon farklı/)
    const isler = d.isler().bugun
    assert.equal(isler.filter((i) => i.tur === 'guvenlik-doz').length, 2)
    assert.ok(isler.filter((i) => i.tur === 'guvenlik-doz').every((i) => !i.guvenlik))
    assert.ok(isler.some((i) => i.tur === 'celiski' && /Ürün \/ konsantrasyon uyuşmazlığı/.test(i.metin)))
    // 4:1 olduğu adından belli ürün: referans uyar, bayrak kesindir.
    const dortBir = doz({ ...FIKSTUR_E, ilaclar: [{ id: 'e-i1', ilac_adi: 'Klavunat 125 mg/31,25 mg/5 ml süspansiyon', etken_madde: 'amoksisilin-klavulanat', doz: '20 ml', kullanim_sikli: '3x1, 10 gün', baslangic_tarihi: '2026-09-19', aktif: true }] }).ilaclar[0]
    assert.deepEqual([dortBir.durum, dortBir.kesin, dortBir.mgKgGun], ['ust-sinir-ustu', true, 110.3])
  })

  it('süresi dolmuş reçete alarm üretmez (akut antibiyotik aylar sonra aktif değildir); erişkinde denetim yok', () => {
    const d = dosya(FIKSTUR_E, '2026-10-20')
    assert.ok(!hepsi(d.isler()).some((i) => i.tur === 'guvenlik-doz'), JSON.stringify(hepsi(d.isler()).map((i) => i.metin)))
    const eriskin: HamDosya = { ...FIKSTUR_C, brans: 'Dahiliye', hasta: { ...FIKSTUR_C.hasta, dogumIso: '1980-01-01' } }
    const e = dosya(eriskin)
    assert.deepEqual(dozGuvenligi(e.olaylar, e.hasta), { ilaclar: [], uyumsuzluklar: [] })
    assert.ok(!e.kanit('ilac').includes('DOZ GÜVENLİĞİ'))
  })

  it('molekül çözümü: "amoksisilin-klavulanat" düz amoksisilinin aralığıyla ölçülmez', () => {
    assert.equal(enIyiIlacAnahtari('Augmentin ES 600 mg/5 ml süspansiyon amoksisilin-klavulanat'), 'amoksisilinKlavulanat')
    assert.equal(enIyiIlacAnahtari('amoksisilin-klavulanat'), 'amoksisilinKlavulanat')
    assert.equal(enIyiIlacAnahtari('Amoksisilin 250 mg/5 ml süspansiyon amoksisilin'), 'amoksisilin')
    assert.equal(enIyiIlacAnahtari('QA Bitkisel Şurup'), null)
  })

  it('doz bloğu hasta adını taşımaz ve "KÜB\'den teyit edin" der', () => {
    const blok = dosya(FIKSTUR_E).kanit('ilac')
    assert.ok(!blok.includes(FIKSTUR_E.hasta.ad))
    assert.ok(blok.includes("KÜB'den teyit edin."))
    assert.match(SORU_SABLONLARI.ilac.sablon, /mg\/kg\/gün değerini kendin hesaplama, referans sayısı ekleme/)
  })
})
