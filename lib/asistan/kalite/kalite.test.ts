/**
 * NOTYA-KALITE-STANDART-01 — the quality rubric: every check with an answer that passes and one that fails, the
 * dispatch per surface, what the doctor's sentence tells the rubric, the score and the baseline gate.
 *
 * The answers below are written for the tests on synthetic charts; none is a production answer.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  bolumler, bosSavusturma, cevapOnce, cumleler, dayanakYorum, dikkatSonda, hamArtik, hastaAdi, kelimeSayisi, mgkgKilo, persentilTarih,
  planUygulandi, seriTablo, sesAnlati, sesBicim, sesBirim, sesKimlik, sesTarih, sesUzunluk, sessizDegil, sozIcerigi, takipBugun, takipGecti,
  tamTarih, tekOlcum, turkce, uzunluk, yabanciHasta, yapilmadi, yasakIfade, YAPI_BOLUMLERI,
  type KaliteGirdisi, type KaliteKarari,
} from './denetimler'
import { DENETIM_KURALI, GECIKME_BUTCESI, KALITE_KURALLARI, type DenetimAdi } from './kurallar'
import { cevabiDenetle } from './rubrik'
import { istenenOlcumBul, okuIstegiMi, vizitOzetiSorusuMu, yapiBul } from './cikarim'
import { gecikmeOzeti, kaliteIhlalleri, kaliteOzetle, tabanKesitiKur, tabanlaKarsilastir, yuzdelik, type KaliteSatiri } from './ozet'
import { fishMetni } from '../fishSes'

const gecer = (s: { gecti: boolean; neden: string } | null, m = '') => { assert.ok(s, `denetim uygulanmadı ${m}`); assert.equal(s!.gecti, true, `${m} ${s!.neden}`) }
const kalir = (s: { gecti: boolean; neden: string } | null, neden: RegExp) => { assert.ok(s, 'denetim uygulanmadı'); assert.equal(s!.gecti, false, s!.neden); assert.match(s!.neden, neden) }

describe('kalite — kural kataloğu', () => {
  const standart = fs.readFileSync(path.join(process.cwd(), 'docs/AYSE-KALITE-STANDARDI.md'), 'utf8')
  const ozetTr = fs.readFileSync(path.join(process.cwd(), 'docs/AYSE-KALITE-OZET-TR.md'), 'utf8')

  it('standarttaki her Q-xx katalogda, katalogdaki her kural standartta ve Türkçe özette', () => {
    const belgede = [...new Set([...standart.matchAll(/\*\*(Q-\d{2}) /g)].map((m) => m[1]))].sort()
    assert.deepEqual(belgede, KALITE_KURALLARI.map((k) => k.id).sort())
    for (const k of KALITE_KURALLARI) assert.ok(ozetTr.includes(`| ${k.id} |`), `Türkçe özette ${k.id} yok`)
  })

  it('her denetim tek bir kurala bağlı; standardın tablosu her denetimi kendi kuralının satırında anar', () => {
    const adlar = KALITE_KURALLARI.flatMap((k) => k.denetimler)
    assert.equal(new Set(adlar).size, adlar.length, 'bir denetim iki kuralda')
    for (const k of KALITE_KURALLARI) {
      const satir = standart.split('\n').find((s) => s.startsWith(`| ${k.id} |`))
      assert.ok(satir, `mekanik tabloda ${k.id} satırı yok`)
      for (const d of k.denetimler) assert.ok(satir!.includes(`\`${d}\``), `${k.id} satırında ${d} yok`)
      assert.ok(k.olculemez.length > 10, k.id)
    }
    assert.equal(DENETIM_KURALI['ses-tarih'], 'Q-31')
    assert.deepEqual(GECIKME_BUTCESI, { hizliP50: 2000, modelP50: 8000, modelP95: 15000 })
  })
})

describe('kalite — yardımcılar', () => {
  it('cümlelere bölme: satır, cümle sonu, madde; tablo satırı cümle değildir; "2. doz" bölünmez', () => {
    assert.deepEqual(cumleler('Emircan 25 aylık. Kilosu 12,8 kg.\n- Hepatit A 2. doz planlandı\n| a | b |\n| --- | --- |'), ['Emircan 25 aylık.', 'Kilosu 12,8 kg.', 'Hepatit A 2. doz planlandı'])
    assert.equal(kelimeSayisi('**Dayanak:** kilo 12,8 kg | 30.09.2026'), 5)
  })
})

describe('Q-01 cevap-once', () => {
  it('geçer: ilk cümle cevaptır', () => {
    gecer(cevapOnce('Emircan Karaoğlu 25 aylık; büyümesi yaşına uygun seyrediyor.\n**Dayanak:**\n- kilo 12,8 kg'))
    gecer(cevapOnce('Hocam, Emircan\'ın aşıları tam değil: Hepatit A 2. doz için kayıt bulamadım.'))
  })
  it('kalır: ön söz, duyuru ya da çıplak başlık ile açılır', () => {
    kalir(cevapOnce('Elbette Hocam. Emircan 25 aylık.'), /ön söz/)
    kalir(cevapOnce('Tabii ki, hemen özetliyorum.'), /ön söz/)
    kalir(cevapOnce('Bakıyorum Hocam... Emircan 25 aylık.'), /ön söz/)
    kalir(cevapOnce('**Dayanak:**\n- kilo 12,8 kg'), /başlıkla/)
    kalir(cevapOnce('Emircan için özet aşağıda:\n- 25 aylık'), /duyuru/)
    assert.equal(cevapOnce('   '), null)
  })
})

describe('Q-02 tek-olcum', () => {
  it('geçer: sorulan ölçüm ve tarihi; kayıt yoksa bunu söyleyen cevap; kapanıştaki güvenlik notu sayılmaz', () => {
    gecer(tekOlcum('Emircan Karaoğlu — 12 aylık muayene (30.08.2025): kilo 9,8 kg. Kaynak: muayene notunun yaşamsal bulgu alanı.', 'kilo'))
    gecer(tekOlcum('Emircan Karaoğlu için kayıtlı boy ölçümü yok Hocam.', 'boy'))
    gecer(tekOlcum('Tarık Özdemir — son muayene (1 Ekim 2026): ateş 38,7 °C.', 'ates'))
    gecer(tekOlcum('Ayşe Bozkurt — 24 Eylül 2026: kilo 19,4 kg.\n⚠ Dikkat: aynı vizitte ateş 38,9 °C.', 'kilo'))
  })
  it('kalır: vital satırının tamamı, sorulmayan ölçüm, tarihsiz değer, sorulan ölçümün yokluğu', () => {
    kalir(tekOlcum('Ayşe Bozkurt — son ölçüm (24.09.2026): Kilo: 19,4 kg · Boy: 110 cm · Ateş: 38,9 °C · Tansiyon: 95/60', 'kilo'), /sorulmayan ölçüm.*boy.*ateş.*tansiyon/)
    kalir(tekOlcum('Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg.', 'kilo'), /tarihi yok/)
    kalir(tekOlcum('Emircan Karaoğlu — son muayene (30.09.2026): baş çevresi 48,9 cm.', 'boy'), /boy\) cevapta yok/)
    assert.equal(tekOlcum('Kilo 12,8 kg.', null), null)
  })
})

describe('Q-03 dayanak-yorum', () => {
  it('geçer: yorumdan önce dayanak; yorum başlığı yoksa uygulanmaz', () => {
    gecer(dayanakYorum('Emircan\'ın hemoglobini düzelmiş.\n**Dayanak:** Hb 10,4 → 11,8 g/dL\n**Yorum:** demir tedavisine yanıt var.'))
    assert.equal(dayanakYorum('Emircan\'ın hemoglobini düzelmiş.'), null)
  })
  it('kalır: dayanaksız yorum', () => {
    kalir(dayanakYorum('Emircan iyi.\nYorum: demir tedavisine yanıt var.'), /Dayanak/)
    kalir(dayanakYorum('Yorum: iyi.\nDayanak: Hb 11,8'), /Dayanak/)
  })
})

describe('Q-04 yapilmadi', () => {
  it('geçer: "kayıt bulamadım" dili; kaydın kendi sözü kaynağıyla; tırnak içinde alıntı', () => {
    gecer(yapilmadi('Hepatit A 2. dozun uygulandığına dair kayıt bulamadım.'))
    gecer(yapilmadi('18 aylık muayene notunda "M-CHAT yapılmadı" yazıyor.'))
    gecer(yapilmadi('Epikrizde işitme taraması yapılmamış olarak belirtilmiş.'))
  })
  it('kalır: kayıt anılmadan "yapılmadı / uygulanmadı / verilmedi"; kayıt yokluğu "yapılmadı" değildir', () => {
    kalir(yapilmadi('Hepatit A 2. doz yapılmadı.'), /yapılmadı/)
    kalir(yapilmadi('Aşı kaydı yok, KKK uygulanmamış.'), /uygulanmamış/)
    kalir(yapilmadi('| Hepatit A | 2 | verilmedi |'), /verilmedi/)
  })
})

describe('Q-04 plan-uygulandi', () => {
  const kanit = { planli: ['Hepatit A 2\\. doz', 'M-CHAT'], uygulanan: ['KKK'] }
  it('geçer: planlanan planlanmış, uygulanan uygulanmış anlatılır; hiçbiri anılmıyorsa uygulanmaz', () => {
    gecer(planUygulandi('Hepatit A 2. doz planlanmış; uygulandığına dair kayıt göremiyorum.\nKKK 1. doz 30.08.2025 tarihinde uygulandı.', kanit))
    gecer(planUygulandi('M-CHAT-R/F planlanmış; tamamlanmış sonuç dosyada görünmüyor.', kanit))
    gecer(planUygulandi('Eksik aşı yok; KKK uygulandı.', kanit))
    assert.equal(planUygulandi('Emircan 25 aylık.', kanit), null)
    assert.equal(planUygulandi('Hepatit A 2. doz uygulandı.', undefined), null)
  })
  it('kalır: planlanan yapılmış gibi; uygulandığı belgelenen eksik gibi', () => {
    kalir(planUygulandi('Hepatit A 2. doz uygulandı.', kanit), /planlanan.*yapılmış gibi/)
    kalir(planUygulandi('M-CHAT taraması normal.', kanit), /M-CHAT/)
    kalir(planUygulandi('KKK aşısı eksik görünüyor.', kanit), /eksik gibi/)
  })
})

describe('Q-06 tam-tarih, takip-bugun, takip-gecti', () => {
  it('tam-tarih geçer: yıllı tarih, yılı aralığın sonunda taşıyan aralık', () => {
    gecer(tamTarih('Son vizit 30 Eylül 2026; 12 aylık muayene 30.08.2025.'))
    gecer(tamTarih('Haftaya (5 Ekim – 11 Ekim 2026) iki randevu var.'))
  })
  it('tam-tarih kalır: yılsız gün-ay', () => {
    kalir(tamTarih('Son vizit 30 Eylül\'de; öncesi 15 Mayıs.'), /yılsız tarih: "30 eylül"/)
  })
  it('takip-bugun geçer: süre bugünle karşılaştırılır ya da tarihiyle verilir; süre anılmıyorsa uygulanmaz', () => {
    gecer(takipBugun('Planda 1 ay sonra kontrol vardı; süre henüz dolmadı (30 Ekim 2026).'))
    gecer(takipBugun('3 gün sonra kontrol önerilmişti; bu süre 5 gün önce geçti.'))
    gecer(takipBugun('1 ay sonra kontrol: 30.10.2026.'))
    assert.equal(takipBugun('Emircan 25 aylık.'), null)
  })
  it('takip-bugun kalır: plan olduğu gibi aktarılır', () => {
    kalir(takipBugun('Dosyada plan ve takip: Tedavi tamamlandı. 1 ay sonra kontrol.'), /bugünle karşılaştırılmamış: "1 ay sonra kontrol"/)
    kalir(takipBugun('48-72 saat içinde düzelmezse kontrol.'), /48-72 saat içinde/)
  })
  it('takip-gecti: süresi geçen kontrol için geçtiği söylenir', () => {
    const kanit = { gecenTakip: ['3 gün sonra kontrol|kontrol'] }
    gecer(takipGecti('3 gün sonra kontrol planlanmıştı; süre 5 gün önce geçti.', kanit))
    kalir(takipGecti('Plan: 3 gün sonra kontrol.', kanit), /geçtiği söylenmemiş/)
    assert.equal(takipGecti('Akciğer grafisi istendi.', kanit), null)
    assert.equal(takipGecti('3 gün sonra kontrol.', {}), null)
  })
})

describe('Q-07 hasta-adi, yabanci-hasta', () => {
  it('hasta-adi: ilk cümle hastanın adını taşır (ekli de olsa)', () => {
    gecer(hastaAdi('Emircan Karaoğlu\'nun kilosu 12,8 kg.', 'Emircan Karaoğlu'))
    gecer(hastaAdi('Hocam, Emircan 25 aylık.', 'Emircan Karaoğlu'))
    kalir(hastaAdi('Kilosu 12,8 kg. Emircan 25 aylık.', 'Emircan Karaoğlu'), /hasta adı \(Emircan\) yok/)
    assert.equal(hastaAdi('Kilosu 12,8 kg.', null), null)
  })
  it('yabanci-hasta: başka hekimin hastasının adı geçmez; hekim adı kendisi söylediyse uygulanmaz', () => {
    const adlar = ['QA Test Hasta 2', 'Selim Erkoç']
    gecer(yabanciHasta('Bu hafta ateşli hastanız Tarık Özdemir.', 'bu hafta ateşli hastalarım kimler', adlar))
    kalir(yabanciHasta('Ateşli hastalar: Tarık Özdemir, Selim Erkoç.', 'bu hafta ateşli hastalarım kimler', adlar), /Selim Erkoç/)
    assert.equal(yabanciHasta('Selim Erkoç adında bir hasta bulamadım.', 'Selim Erkoç en son ne zaman geldi', ['Selim Erkoç']), null)
    assert.equal(yabanciHasta('x', 'y', []), null)
  })
})

describe('Q-08 persentil-tarih, mgkg-kilo', () => {
  it('persentil-tarih: persentil ya da z-skoru ölçüm tarihiyle', () => {
    gecer(persentilTarih('Kilo 12,8 kg (30.09.2026), p45.'))
    gecer(persentilTarih('| 30.08.2025 | 9,8 | p48 |'))
    gecer(persentilTarih('Boy z-skoru -0,4 (24 aylık muayene, 30 Ağustos 2026).'))
    kalir(persentilTarih('Kilosu 50. persentilde.'), /tarihsiz/)
    kalir(persentilTarih('Kilo p53 → p10.'), /tarihsiz/)
    assert.equal(persentilTarih('Kilo 12,8 kg.'), null)
  })
  it('mgkg-kilo: mg/kg anılınca kilo ve tarihi', () => {
    gecer(mgkgKilo('Ferro Sanol 3 mg/kg/gün; reçete tarihindeki kilo 11,6 kg (30.04.2026).'))
    kalir(mgkgKilo('Ferro Sanol 3 mg/kg/gün kullanıyor.'), /kilo değeri yok/)
    kalir(mgkgKilo('Ferro Sanol 3 mg/kg/gün; kilo 11,6 kg.'), /tarihi yok/)
    assert.equal(mgkgKilo('D vitamini 400 IU.'), null)
  })
})

describe('Q-09 dikkat-sonda', () => {
  it('geçer: güvenlik başlığı son bloktur; başlık yoksa uygulanmaz', () => {
    gecer(dikkatSonda('Emircan iyi.\n**Dayanak:**\n- Hb 11,8\n⚠ Dikkat: Hepatit A 2. doz için kayıt yok.'))
    gecer(dikkatSonda('Dikkat Hocam: penisilin alerjisi kayıtlı. Kartı hazırladım.'))
    assert.equal(dikkatSonda('Emircan iyi.'), null)
  })
  it('kalır: güvenlik başlığından sonra dayanak gelir', () => {
    kalir(dikkatSonda('Emircan iyi.\n⚠ Dikkat: doz aralık dışında.\n**Dayanak:**\n- Hb 11,8'), /sonra "Dayanak/)
  })
})

describe('Q-11 yasak-ifade, bos-savusturma, ham-artik, turkce', () => {
  it('yasak-ifade: dolgu, bekletme, yanlış hitap, model kimliği', () => {
    gecer(yasakIfade('Emircan 25 aylık Hocam.'))
    kalir(yasakIfade('Emircan 25 aylık. Elbette başka sorunuz olursa söyleyin.'), /dolgu.*elbette/)
    kalir(yasakIfade('Tabii ki Hocam, Emircan 25 aylık.'), /dolgu/)
    kalir(yasakIfade('Bakıyorum Hocam.'), /bekletme/)
    kalir(yasakIfade('Doktor Bey, Emircan 25 aylık.'), /hitap/)
    kalir(yasakIfade('Bir yapay zeka olarak tanı koyamam.'), /model kimliği/)
  })
  it('bos-savusturma: "bilemedim" yalnız sonraki adımla; "kayıt bulamadım" savuşturma değildir', () => {
    gecer(bosSavusturma('Ferritin sonucunun kaydını bulamadım Hocam.'))
    gecer(bosSavusturma('Sizi tam anlayamadım, tekrar eder misiniz?'))
    gecer(bosSavusturma('Bunu bilemiyorum Hocam; tahlil sonucu girilirse söyleyebilirim.'))
    kalir(bosSavusturma('Bunu bilemedim Hocam.'), /sonraki adım söylenmeden "bilemedim"/)
    kalir(bosSavusturma('Emin değilim.'), /emin değilim/)
  })
  it('ham-artik: kimlik numarası, alan adı, JSON, şablon sızıntısı, kod bloğu, kapanmamış işaret', () => {
    gecer(hamArtik('**Emircan Karaoğlu** 25 aylık.\n| Tarih | Kilo |\n| --- | --- |'))
    kalir(hamArtik('Hasta 3f2b8c1a-9d4e-4f6a-8b2c-1a2b3c4d5e6f bulundu.'), /uuid/)
    kalir(hamArtik('hasta_bul aracını çağırdım.'), /alan \/ araç adı/)
    kalir(hamArtik('{"speech":"Emircan 25 aylık."}'), /JSON/)
    kalir(hamArtik('"undefined" dosyada alerji olarak kayıtlı değil.'), /şablon sızıntısı/)
    kalir(hamArtik('Anne adı: {{ANNE_ADI}}'), /şablon sızıntısı/)
    kalir(hamArtik('Emircan <br> 25 aylık'), /HTML/)
    kalir(hamArtik('**Emircan 25 aylık.'), /kapanmamış/)
  })
  it('turkce: İngilizce cümle parçası', () => {
    gecer(turkce('Emircan 25 aylık; M-CHAT-R/F planlanmış.'))
    kalir(turkce('Sorry, I cannot find the patient.'), /İngilizce/)
  })
})

describe('Q-20 uzunluk, seri-tablo', () => {
  it('uzunluk: özet en fazla 275 kelime; tek bilgilik cevap destek satırlarından önce en fazla iki cümle', () => {
    gecer(uzunluk(Array.from({ length: 200 }, () => 'kelime').join(' '), { yapi: 'ozet' }))
    kalir(uzunluk(Array.from({ length: 300 }, () => 'kelime').join(' '), { yapi: 'ozet' }), /300 kelime/)
    gecer(uzunluk('Emircan\'ın kan grubu 0 Rh+. Kaynak: hasta bilgi formu.\n\n- form tarihi 04.09.2024', { olgu: true }))
    kalir(uzunluk('Emircan son olarak 30 Eylül 2026 tarihinde geldi. Otit kontrolüydü. Tedavi tamamlandı. Kontrol önerildi.', { olgu: true }), /4 cümle/)
    assert.equal(uzunluk('Uzun bir sohbet cevabı.', {}), null)
  })
  it('seri-tablo: dört ve üzeri tarihli değer tablodur', () => {
    const tablo = '| Tarih | Kilo (kg) |\n| --- | --- |\n| 30.08.2025 | 9,8 |\n| 28.02.2026 | 11,3 |\n| 30.08.2026 | 12,6 |\n| 30.09.2026 | 12,8 |'
    gecer(seriTablo(tablo))
    kalir(seriTablo('- 30.08.2025: 9,8 kg\n- 28.02.2026: 11,3 kg\n- 30.08.2026: 12,6 kg\n- 30.09.2026: 12,8 kg'), /4 tarihli değer/)
    kalir(seriTablo('Kilo 30.08.2025 9,8 kg, 28.02.2026 11,3 kg, 30.08.2026 12,6 kg, 30.09.2026 12,8 kg oldu.'), /tek cümlede/)
    assert.equal(seriTablo('Kilo 12,8 kg (30.09.2026).'), null)
  })
})

describe('Q-21 bolumler', () => {
  it('gelişim: altı başlık', () => {
    const tam = ['**Genel değerlendirme:** yaşına uygun.', '**Güçlü alanlar:** kaba motor.', '**İzlenmesi gereken alanlar:** dil.', '**Gelişimsel risk ve koruyucu etmenler:** yok.', '**Tarama durumu:** M-CHAT planlanmış; sonuç yok.', '**Önerilen sonraki adım:** GİDR.'].join('\n')
    gecer(bolumler(tam, 'gelisim'))
    kalir(bolumler('**Genel değerlendirme:** yaşına uygun.\n**Tarama durumu:** yok.', 'gelisim'), /Güçlü alanlar; İzlenmesi gereken alanlar; Gelişimsel risk ve koruyucu etmenler; Önerilen sonraki adım/)
  })
  it('açık işler: üç başlık ya da "saptamadım" cümlesi', () => {
    gecer(bolumler('**Bugün:** Hepatit A 2. doz.\n**Yakın zamanda:** ferritin tekrarı.\n**Daha sonra, rutin:** 30 aylık izlem.', 'takip'))
    gecer(bolumler('Dosyada şu anda belirgin bir açık güvenlik problemi veya takip edilmemiş önemli bulgu saptamadım.', 'takip'))
    kalir(bolumler('**Bugün:** Hepatit A 2. doz.', 'takip'), /Yakın zamanda; Daha sonra \/ rutin/)
  })
  it('özet: tek bakış alanları; her vizit tek tek anlatılmaz', () => {
    const iyi = 'Emircan Karaoğlu 25 aylık erkek. Alerji kaydı yok. Aktif ilaç: D vitamini. Aşılar: Hepatit A 2. doz için kayıt yok. Büyüme yaşına uygun. Takip: 1 ay sonra kontrol.'
    gecer(bolumler(iyi, 'ozet'))
    kalir(bolumler('Emircan 25 aylık. Otit geçirdi.', 'ozet'), /alerji; aktif ilaç \/ süren tedavi; aşı durumu; büyüme ve gelişim; takip/)
    const vizitVizit = `${iyi}\n${Array.from({ length: 11 }, (_, n) => `- ${String(n + 1).padStart(2, '0')}.03.2026: vizit`).join('\n')}`
    kalir(bolumler(vizitVizit, 'ozet'), /her vizit anlatılmış \(11 ayrı tarih\)/)
  })
  it('büyüme, aşı ve muayene özeti: gereken parçalar', () => {
    gecer(bolumler('Emircan\'ın kilosu 12,8 kg (30.09.2026), p45; eğilim paralel.', 'buyume'))
    kalir(bolumler('Emircan iyi büyüyor.', 'buyume'), /birimli ölçüm değeri; ölçüm tarihi; persentil/)
    gecer(bolumler('Emircan 25 aylık. 16 aşı uygulandığı kayıtlı. Eksik: yok. Planlanan: Hepatit A 2. doz.', 'asi'))
    kalir(bolumler('Aşıları tam.', 'asi'), /kesin yaş; uygulandığı belgelenenler; yaklaşan \/ planlanan/)
    const vizit = '30.08.2025, 12 aylık. Şikayet: yok. Bulgular: doğal. Tahlil: hemogram istendi. Aşı: KKK. Kilo 9,8 kg, boy 75 cm. Tedavi: D vitamini. Plan: 15. ayda kontrol.'
    gecer(bolumler(vizit, 'vizit-ozeti'))
    kalir(bolumler('30.08.2025, 12 aylık. Şikayet yok. Plan: kontrol.', 'vizit-ozeti'), /bulgular; tahlil; aşı; kilo \/ boy \/ baş çevresi; tedavi/)
    assert.equal(bolumler('herhangi', 'lab'), null)
    assert.equal(bolumler('herhangi', null), null)
    assert.deepEqual(Object.keys(YAPI_BOLUMLERI).sort(), ['asi', 'buyume', 'gelisim', 'ozet', 'takip', 'vizit-ozeti'])
  })
})

describe('Q-30 ses-uzunluk, ses-anlati', () => {
  const yedi = Array.from({ length: 7 }, (_, n) => `Cümle ${n + 1} burada.`).join(' ')
  it('ses-uzunluk: en fazla 7 cümle ve 65 kelime; okuma isteğinde sınır yok', () => {
    gecer(sesUzunluk(yedi, false))
    kalir(sesUzunluk(`${yedi} Sekizinci cümle.`, false), /8 cümle/)
    kalir(sesUzunluk(Array.from({ length: 5 }, () => Array.from({ length: 16 }, () => 'kelime').join(' ') + '.').join(' Yeni '), false), /kelime söylendi/)
    assert.equal(sesUzunluk(`${yedi} Sekizinci cümle.`, true), null)
  })
  it('ses-anlati: yalnız ekrana işaret eden söz cevap değildir; anlatı sorusunda beş cümle ya da ekrandaki kadar', () => {
    assert.deepEqual(sozIcerigi('Emircan 25 aylık. Dayanak. 5 madde, ekranınızda. Devamı ekranınızda Hocam.'), ['Emircan 25 aylık.'])
    kalir(sesAnlati('Dayanak. 5 madde, ekranınızda.', 'x', 'ozet'), /yalnız ekrana işaret/)
    const ekran = 'Emircan 25 aylık.\n**Dayanak:**\n- kilo 12,8 kg\n- 16 aşı\n- D vitamini\n- Hb 11,8\n- otit'
    kalir(sesAnlati('Emircan 25 aylık. Dayanak. 5 madde, ekranınızda.', ekran, 'ozet'), /anlatı 1 cümle \(en az 5\)/)
    gecer(sesAnlati('Emircan 25 aylık. Kilosu 12,8 kilogram. On altı aşısı kayıtlı. D vitamini kullanıyor. Hemoglobini düzeldi.', ekran, 'ozet'))
    // A short screen answer makes a short spoken answer.
    gecer(sesAnlati('Ayşe için gelişim kaydı bulamadım.', 'Ayşe için gelişim kaydı bulamadım.', 'gelisim'))
    // A single-fact answer needs content, not a count.
    gecer(sesAnlati('Emircan Karaoğlu için istediğiniz bilgiyi ekranınıza yazdım Hocam.', '', null))
    assert.equal(sesAnlati('', 'x', 'ozet'), null)
  })
})

describe('Q-31 ses-tarih, ses-bicim, ses-birim, ses-kimlik', () => {
  it('ses-tarih: rakamla tarih söylenmez', () => {
    gecer(sesTarih('Emircan son olarak 30 Eylül 2026 tarihinde geldi.'))
    kalir(sesTarih('Emircan Karaoğlu, son muayene (30.09.2026): kilo 12,8 kg.'), /30\.09\.2026/)
  })
  it('ses-bicim: tablo, çizgi, vurgu işareti, madde imi, kimlik numarası', () => {
    gecer(sesBicim('Aşı karnesini ekrana getirdim Hocam; 16 kayıt var.'))
    kalir(sesBicim('| Hepatit B | 30.08.2024 |'), /biçim işareti/)
    kalir(sesBicim('**Dayanak:** kilo 12,8'), /biçim işareti/)
    kalir(sesBicim('Şunlar var:\n- kilo\n- boy'), /biçim işareti/)
  })
  it('ses-birim: seslendirme metninde okunmayan birim kalmaz', () => {
    gecer(sesBirim(fishMetni('Kilosu 12,8 kg, boyu 87,5 cm, ateşi 38,7 °C.')))
    kalir(sesBirim(fishMetni('Hemoglobin 11,8 g/dL.')), /okunmayan birim/)
    kalir(sesBirim(fishMetni('Tansiyon 95/60 mmHg.')), /okunmayan birim/)
    kalir(sesBirim(fishMetni('D vitamini 400 IU.')), /okunmayan birim/)
    assert.equal(sesBirim(undefined), null)
  })
  it('ses-kimlik: telefon, e-posta, kimlik numarası, doğum tarihi ve fikstürün kimlik değerleri seslendirilmez', () => {
    gecer(sesKimlik('Emircan Karaoğlu için istediğiniz bilgiyi ekranınıza yazdım Hocam.', ['Elif', '0532 000 11 22']))
    kalir(sesKimlik('Annesinin adı Elif.', ['Elif']), /kimlik değeri seslendirildi/)
    kalir(sesKimlik('Telefonu 0532 000 11 22.', []), /telefon/)
    kalir(sesKimlik('E-postası qa-veli@example.test.', []), /e-posta/)
    kalir(sesKimlik('Kimlik numarası 12345678901.', []), /kimlik numarası/)
    kalir(sesKimlik('Emircan (d.t. 30 Ağustos 2024) 25 aylık.', []), /doğum tarihi/)
  })
})

describe('Q-32 sessiz-degil', () => {
  it('her tur bir cevapla biter; düşürülen gürültüde cevap beklenmez', () => {
    gecer(sessizDegil({ yuzey: 'yazi', ekran: 'Emircan 25 aylık.' }))
    gecer(sessizDegil({ yuzey: 'ses', ekran: '', soz: 'Sizi tam anlayamadım, tekrar eder misiniz?' }))
    kalir(sessizDegil({ yuzey: 'ses', ekran: 'ekranda bir şey var', soz: ' ' }), /sesli tur cevapsız/)
    kalir(sessizDegil({ yuzey: 'panel', ekran: '' }), /cevap boş/)
    assert.equal(sessizDegil({ yuzey: 'ses', ekran: '', soz: '', gurultu: true }), null)
  })
})

describe('kalite — rubrik (hangi denetim hangi metne)', () => {
  const adlar = (k: KaliteKarari[]) => k.map((x) => `${x.denetim}@${x.hedef}`).sort()
  const g = (ek: Partial<KaliteGirdisi>): KaliteGirdisi => ({ soru: 'Kilosu kaç?', yuzey: 'yazi', ekran: '', ...ek })

  it('yazı: söz ve yapı denetimleri ekran metninde; ses denetimi yok; her karar kural numarası taşır', () => {
    const k = cevabiDenetle(g({ ekran: 'Emircan Karaoğlu — son ölçüm (30.09.2026): kilo 12,8 kg.', hastaAdi: 'Emircan Karaoğlu', olcum: 'kilo', olgu: true }))
    assert.deepEqual(adlar(k), ['bos-savusturma@ekran', 'cevap-once@ekran', 'ham-artik@ekran', 'hasta-adi@ekran', 'sessiz-degil@ekran', 'tam-tarih@ekran', 'tek-olcum@ekran', 'turkce@ekran', 'uzunluk@ekran', 'yapilmadi@ekran', 'yasak-ifade@ekran'])
    assert.ok(k.every((x) => x.gecti), JSON.stringify(k.filter((x) => !x.gecti)))
    for (const x of k) assert.equal(x.kural, DENETIM_KURALI[x.denetim as DenetimAdi])
  })

  it('ses: söz denetimleri SÖYLENEN metinde, yapı denetimleri ekran metninde, ses denetimleri sözde — ayrı ayrı', () => {
    const ekran = '**Emircan Karaoğlu — kilo** (son muayene)\n\n| Tarih | Kilo (kg) |\n| --- | --- |\n| 30.09.2026 | 12,8 |'
    const soz = 'Emircan Karaoğlu, son muayene (30.09.2026): kilo 12,8 kg.'
    const k = cevabiDenetle(g({ yuzey: 'ses', ekran, soz, okunus: fishMetni(soz), hastaAdi: 'Emircan Karaoğlu', olcum: 'kilo', olgu: true }))
    const kalan = k.filter((x) => !x.gecti).map((x) => `${x.kural} ${x.denetim}@${x.hedef}`)
    // The table on screen is fine; the spoken date is not speakable.
    assert.deepEqual(kalan, ['Q-31 ses-tarih@soz'])
    assert.ok(adlar(k).includes('uzunluk@ekran') && adlar(k).includes('tek-olcum@soz') && adlar(k).includes('ses-birim@soz') && !adlar(k).includes('tek-olcum@ekran'))
  })

  it('panel: hasta adı aranmaz (sayfa zaten o hastanın); beklenen kapsam reddinde yalnız Q-32', () => {
    const p = cevabiDenetle(g({ yuzey: 'panel', ekran: 'Kayıt — 12 aylık muayene (30.08.2025): kilo 9,8 kg.', hastaAdi: 'Emircan Karaoğlu', olcum: 'kilo' }))
    assert.ok(!p.some((x) => x.denetim === 'hasta-adi') && p.every((x) => x.gecti), JSON.stringify(p.filter((x) => !x.gecti)))
    const r = cevabiDenetle(g({ ekran: 'Hocam, ben yalnızca Notya\'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum.', ret: true }))
    assert.deepEqual(adlar(r), ['sessiz-degil@ekran'])
  })

  it('cevapsız tur: yalnız Q-32 kalır; gürültüde hiç karar yok', () => {
    const k = cevabiDenetle(g({ yuzey: 'ses', ekran: '', soz: '' }))
    assert.deepEqual(k.map((x) => [x.kural, x.gecti]), [['Q-32', false]])
    assert.deepEqual(cevabiDenetle(g({ yuzey: 'ses', ekran: '', soz: '', gurultu: true })), [])
  })

  it('2026-10-02 gerçek hasta koşumunun üç bulgusu yakalanır: vital satırı, "Dayanak. N madde", rakamla tarih', () => {
    const vital = cevabiDenetle(g({ soru: 'Kilosu kaç?', ekran: 'Ayşe Bozkurt — dosyada son ölçüm: Kilo: 19,4 kg · Boy: 110 cm · Ateş: 38,9 °C · Tansiyon: 95/60', hastaAdi: 'Ayşe Bozkurt', olcum: 'kilo', olgu: true }))
    assert.deepEqual(vital.filter((x) => !x.gecti).map((x) => x.kural), ['Q-02'])
    const ekran = 'Emircan Karaoğlu 25 aylık.\n**Dayanak:**\n- kilo 12,8 kg (30.09.2026)\n- 16 aşı\n- D vitamini\n- Hb 11,8 g/dL (20.09.2026)\n- otit, 30.09.2026'
    const ses = cevabiDenetle(g({ soru: 'Bu hastayı bana kısaca özetler misin?', yuzey: 'ses', ekran, soz: 'Emircan Karaoğlu 25 aylık. Dayanak. 5 madde, ekranınızda.', okunus: '', hastaAdi: 'Emircan Karaoğlu', yapi: 'ozet' }))
    assert.ok(ses.some((x) => x.kural === 'Q-30' && x.denetim === 'ses-anlati' && !x.gecti))
  })
})

describe('kalite — sorudan çıkarım', () => {
  it('yapı: on dosya sorusu ürünün kendi sınıflandırıcısından; tek muayene özeti sekiz bölümlü yapıdır', () => {
    assert.equal(yapiBul('Bu hastayı bana kısaca özetler misin?'), 'ozet')
    assert.equal(yapiBul('Büyümesi nasıl gidiyor?'), 'buyume')
    assert.equal(yapiBul('Aşıları yaşına göre tam mı? Eksik aşısı var mı?'), 'asi')
    assert.equal(yapiBul('Gelişimi yaşına uygun mu?'), 'gelisim')
    assert.equal(yapiBul('Bugün yapmam veya takip etmem gereken bir şey var mı?'), 'takip')
    assert.equal(yapiBul('Emircan Karaoğlu\'nun 6 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın?'), 'vizit-ozeti')
    assert.equal(yapiBul('Ayşe Bozkurt\'un son muayenesinin özetini verir misin?'), 'vizit-ozeti')
    assert.ok(!vizitOzetiSorusuMu('Son üç muayenesini özetle') && !vizitOzetiSorusuMu('Bütün muayenelerini tek tek özetle'))
    assert.equal(yapiBul('Yarın kimler geliyor?'), null)
  })
  it('tek ölçüm: sorulan ölçüm; seri, büyüme sorusu, başkasının değeri ve kayıt komutu değildir', () => {
    assert.equal(istenenOlcumBul('Kilosu kaç?'), 'kilo')
    assert.equal(istenenOlcumBul('bu hasta 12 aylık muayenesine geldiğinde kaç kiloydu'), 'kilo')
    assert.equal(istenenOlcumBul('Son muayenede ateşi kaçtı?'), 'ates')
    assert.equal(istenenOlcumBul('boyu?'), 'boy')
    assert.equal(istenenOlcumBul('baş çevresi?'), 'bas')
    for (const s of ['Son muayenedeki boy ve kilo ölçümlerini göster', 'Bütün muayenelerdeki kilo ölçümlerini sırayla göster', 'Büyümesi nasıl gidiyor?', 'bu hastanın annesinin boyu kaç', 'Kilosunu 24,8 kilo olarak ekle', 'Ateşi 38,2, kaydet', 'Tansiyon takibini nasıl planlarsın?', 'Aşıları tam mı?']) {
      assert.equal(istenenOlcumBul(s), null, s)
    }
  })
  it('okuma isteği: "oku", "bana anlat", "devam et"', () => {
    assert.ok(okuIstegiMi('Hastanın özetini oku') && okuIstegiMi('devam et') && okuIstegiMi('Devamını ekranda görüyorum ama sen bana anlat'))
    assert.ok(!okuIstegiMi('Bu hastayı bana kısaca özetler misin?'))
  })
})

describe('kalite — puan, taban ve kapı (Q-40, Q-41)', () => {
  const k = (denetim: DenetimAdi, gecti: boolean, hedef: 'ekran' | 'soz' = 'ekran'): KaliteKarari => ({ kural: DENETIM_KURALI[denetim], denetim, hedef, gecti, neden: gecti ? '' : 'neden' })
  const satir = (id: string, ek: Partial<KaliteSatiri> = {}): KaliteSatiri => ({ id, yuzey: 'yazi', kat: 'olcum', karar: 'PASS', kalite: [k('cevap-once', true), k('yasak-ifade', true)], ...ek })
  const TABAN_SATIRLARI: KaliteSatiri[] = [
    satir('A-1'),
    satir('A-2', { kalite: [k('cevap-once', true), k('tek-olcum', false)] }),
    satir('A-3', { karar: 'FAIL', kat: 'takvim' }),
    satir('A-4', { karar: 'VEKIL', kalite: null, kat: 'ilk10' }),
    satir('A-1', { yuzey: 'ses', kalite: [k('cevap-once', true, 'soz'), k('ses-tarih', false, 'soz')], modeleGitti: false, ms: 900 }),
  ]
  const taban = tabanKesitiKur(TABAN_SATIRLARI, { tarih: '2026-10-02', sha: 'abc1234', model: 'vekil' })

  it('özet: kural, denetim, kategori ve yüzey başına geçen / toplam; yargılanmayan tur sayılmaz', () => {
    const o = kaliteOzetle(TABAN_SATIRLARI)
    assert.deepEqual([o.yargilanan, o.yargilanmayan, o.toplam], [4, 1, { gecen: 6, toplam: 8 }])
    assert.equal(o.puan, 75)
    assert.deepEqual(o.kural['Q-01'], { gecen: 4, toplam: 4 })
    assert.deepEqual(o.kural['Q-02'], { gecen: 0, toplam: 1 })
    assert.deepEqual(o.denetim['ses-tarih'], { gecen: 0, toplam: 1 })
    assert.deepEqual([o.kategori.olcum, o.yuzey.ses], [{ gecen: 4, toplam: 6 }, { gecen: 1, toplam: 2 }])
    assert.deepEqual(kaliteIhlalleri(TABAN_SATIRLARI).map((x) => `${x.id}/${x.yuzey} ${x.kural}`), ['A-2/yazi Q-02', 'A-1/ses Q-31'])
  })

  it('taban kesiti: tur, FAIL listesi, puan ve tur başına kalan denetimler', () => {
    assert.deepEqual([taban.tur, taban.yargilanan, taban.fail, taban.failIdler, taban.puan], [5, 4, 1, ['A-3/yazi'], 75])
    assert.deepEqual(taban.ihlal, { 'A-1/ses': ['ses-tarih@soz'], 'A-2/yazi': ['tek-olcum@ekran'] })
    assert.equal(taban.idler.length, 5)
  })

  it('aynı koşum kapıdan geçer', () => {
    assert.deepEqual(tabanlaKarsilastir(taban, TABAN_SATIRLARI, { mod: 'kuru' }), { gecti: true, sorunlar: [], notlar: [] })
  })

  it('bir kuralın geçme oranı düşerse kapı kapanır; hangi tur ve hangi denetim olduğu yazılır', () => {
    const kotu = TABAN_SATIRLARI.map((s) => (s.id === 'A-1' && s.yuzey === 'yazi' ? { ...s, kalite: [k('cevap-once', false), k('yasak-ifade', true)] } : s))
    const r = tabanlaKarsilastir(taban, kotu, { mod: 'kuru' })
    assert.equal(r.gecti, false)
    assert.ok(r.sorunlar.some((x) => /rule Q-01: pass rate 100\.0% \(4\/4\) → 75\.0% \(3\/4\)/.test(x)), r.sorunlar.join('\n'))
    assert.ok(r.sorunlar.some((x) => /new failed verdicts: A-1\/yazi Q-01 cevap-once/.test(x)))
    assert.ok(r.sorunlar.some((x) => /quality score 75\.0% \(6\/8\) → 62\.5% \(5\/8\)/.test(x)))
    // Within a tolerance the rate is not a failure, but in a stand-in run the new failed verdict still is.
    const t = tabanlaKarsilastir(taban, kotu, { mod: 'kuru', tolerans: 30 })
    assert.ok(!t.sorunlar.some((x) => /pass rate/.test(x)) && t.sorunlar.some((x) => /new failed verdicts/.test(x)))
    // Live mode: the same single verdict is a note; the rate still gates.
    const c = tabanlaKarsilastir(taban, kotu, { mod: 'canli', tolerans: 30 })
    assert.deepEqual([c.gecti, c.notlar.some((x) => /new failed verdicts/.test(x))], [true, true])
  })

  it('korpus FAIL sayısı tabanı aşarsa kapı kapanır; düzelen tur not edilir', () => {
    const kotu = TABAN_SATIRLARI.map((s) => (s.id === 'A-2' ? { ...s, karar: 'FAIL' } : s))
    const r = tabanlaKarsilastir(taban, kotu, { mod: 'canli' })
    assert.ok(r.sorunlar.some((x) => /corpus FAIL 2 > baseline 1/.test(x)), r.sorunlar.join('\n'))
    assert.ok(r.notlar.some((x) => /newly failing turns: A-2\/yazi/.test(x)))
    const iyi = TABAN_SATIRLARI.map((s) => (s.id === 'A-3' ? { ...s, karar: 'PASS' } : s))
    const d = tabanlaKarsilastir(taban, iyi, { mod: 'kuru' })
    assert.deepEqual([d.gecti, d.notlar.some((x) => /no longer failing: A-3\/yazi/.test(x))], [true, true])
  })

  it('Q-40: korpus yalnız büyür — eksik tur kapıyı kapatır; kısmi koşumda yalnız tur tur karşılaştırılır', () => {
    const eksik = TABAN_SATIRLARI.slice(0, 3)
    const r = tabanlaKarsilastir(taban, eksik, { mod: 'kuru' })
    assert.ok(r.sorunlar.some((x) => /^Q-40 2 graded turn\(s\) of the baseline are missing/.test(x)), r.sorunlar.join('\n'))
    const kismi = tabanlaKarsilastir(taban, eksik, { mod: 'kuru', kismi: true })
    assert.deepEqual([kismi.gecti, kismi.sorunlar], [true, []])
    const kismiKotu = tabanlaKarsilastir(taban, [satir('A-1', { kalite: [k('cevap-once', false)] })], { mod: 'kuru', kismi: true })
    assert.ok(kismiKotu.sorunlar.some((x) => /new failed verdicts: A-1\/yazi Q-01/.test(x)))
  })

  it('yeni girdi oranları düşürmez; açık kusuru adıyla söyleyen yeni girdi FAIL olabilir, söylemeyen olamaz', () => {
    const yeniKusurlu = satir('B-1', { karar: 'FAIL', acikKusur: 'NOTYA-VIZIT-TARIH-01', kalite: [k('cevap-once', false), k('tam-tarih', false)] })
    const r = tabanlaKarsilastir(taban, [...TABAN_SATIRLARI, yeniKusurlu], { mod: 'kuru' })
    assert.equal(r.gecti, true, r.sorunlar.join('\n'))
    assert.ok(r.notlar.some((x) => /1 turn\(s\) not in the baseline/.test(x)) && r.notlar.some((x) => /B-1\/yazi \[NOTYA-VIZIT-TARIH-01\]/.test(x)))
    const yeniKusursuz = tabanlaKarsilastir(taban, [...TABAN_SATIRLARI, satir('B-2', { karar: 'FAIL' })], { mod: 'kuru' })
    assert.ok(yeniKusursuz.sorunlar.some((x) => /new entries fail without naming an open defect \(acikKusur\): B-2\/yazi/.test(x)))
  })

  it('tabanda ölçülen bir kural artık ölçülmüyorsa kapı kapanır', () => {
    const r = tabanlaKarsilastir(taban, TABAN_SATIRLARI.filter((s) => s.yuzey !== 'ses').concat(satir('A-1', { yuzey: 'ses', kalite: [k('cevap-once', true, 'soz')] })), { mod: 'kuru' })
    assert.ok(r.sorunlar.some((x) => /rule Q-31: measured in the baseline .* not measured now/.test(x)), r.sorunlar.join('\n'))
  })

  it('gecikme (Q-33, gösterge): sesli turların ortanca ve 95. yüzdeliği bütçeyle karşılaştırılır', () => {
    assert.equal(yuzdelik([], 50), null)
    assert.deepEqual([yuzdelik([5, 1, 3], 50), yuzdelik([5, 1, 3], 95)], [3, 5])
    const ses = (ms: number, modeleGitti: boolean): KaliteSatiri => satir('S', { yuzey: 'ses', ms, modeleGitti })
    const [hizli, model] = gecikmeOzeti([ses(900, false), ses(2500, false), ses(1200, false), ses(7000, true), ses(16000, true), satir('Y', { ms: 99999 })])
    assert.deepEqual([hizli.adet, hizli.p50, hizli.butceIcinde], [3, 1200, true])
    assert.deepEqual([model.adet, model.p50, model.p95, model.butceIcinde], [2, 7000, 16000, false])
  })
})
