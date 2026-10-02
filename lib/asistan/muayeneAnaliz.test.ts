/**
 * NOTYA-AYSE-ANALIZ-01 — the three analysis texts (pure): which visits a term is in, the bounded digest of several
 * visits, the gaps. Built from the event index of a synthetic chart; no database, no model.
 * The route-level acceptance is lib/asistan/analizKabul.test.ts.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { hastaKur, olaylariKur, VIZIT_BOLUM_SINIRI, type HamDosya, type HamVizit } from '../doktor/dosyaOlaylari'
import { acikIsleriBul } from '../doktor/acikIsler'
import type { HastaFisiltisi } from '../doktor/fisiltiHasta'
import type { FisiltiItem } from '../doktor/fisiltiOrtak'
import { ANALIZ_ARACLARI, ANALIZ_KURALI, ARAMA_SATIR_TAVANI, MUAYENE_ADET_TAVANI, MUAYENE_OZET_TAVANI, eksiklerMetni, fisiltiSatirlari, muayeneAra, muayeneOzeti } from './muayeneAnaliz'

const BUGUN = '2026-10-02'
const AD = 'Nehir Karadağ'

const VIZITLER: HamVizit[] = [
  { id: 'v1', tarih: '2025-09-27T09:00:00Z', subjektif: '2 aylık sağlam çocuk izlemi. Yalnız anne sütü alıyor.', objektif: 'Sistem muayeneleri doğal.', degerlendirme: 'Sağlıklı bebek.', plan: 'Hemogram ve ferritin istendi.', tani: 'Sağlam çocuk izlemi', vitaller: { kilo: 5.4, boy: 58, basCevresi: 39 } },
  { id: 'v2', tarih: '2025-11-26T09:00:00Z', subjektif: 'İki gündür ateş, sağ kulağını çekiştiriyor.', objektif: 'Sağ timpan zar hiperemik.', degerlendirme: 'Sağ akut otitis media.', plan: 'Augmentin başlandı. Hepatit B 3. doz bir sonraki vizitte yapılacak.', tani: 'Akut otitis media', ilaclar: [{ ad: 'Augmentin', doz: '', kullanim: 'günde 2 kez 7 gün' }], vitaller: { kilo: 6.8, boy: 63 } },
  { id: 'v3', tarih: '2026-01-25T09:00:00Z', subjektif: '6 aylık sağlam çocuk izlemi. Ek gıdaya başlanmış.', objektif: 'Sistem muayeneleri doğal.', degerlendirme: 'Gelişimi yaşına uygun.', plan: 'Ek gıda önerileri anlatıldı.', tani: 'Sağlam çocuk izlemi', vitaller: null },
  { id: 'v4', tarih: '2026-05-05T09:00:00Z', subjektif: 'Genel değerlendirme için getirildi.', objektif: 'Sistem muayeneleri doğal.', degerlendirme: 'Sağlıklı çocuk.', plan: '1 ay sonra kontrol.', tani: 'Sağlam çocuk izlemi', vitaller: { kilo: 8.6, boy: 71 } },
]

function dosya(vizitler: HamVizit[] = VIZITLER, brans: string | null = 'pediatri'): { olaylar: ReturnType<typeof olaylariKur>; hasta: ReturnType<typeof hastaKur> } {
  const ham: HamDosya = {
    hasta: { ad: AD, dogumIso: '2025-07-29', cinsiyet: 'female' }, brans, vizitler,
    asilar: [
      { id: 'a1', asi_adi: 'Hepatit B', doz_no: 1, uygulama_tarihi: '2025-07-30', kaynak: 'klinik' },
      { id: 'a2', asi_adi: 'Hepatit B', doz_no: 2, uygulama_tarihi: '2025-08-30', kaynak: 'klinik' },
    ],
    ilaclar: [{ id: 'i1', ilac_adi: 'Augmentin', kullanim_sikli: 'günde 2 kez 7 gün', baslangic_tarihi: '2025-11-26', aktif: true }],
  }
  return { olaylar: olaylariKur(ham, BUGUN), hasta: hastaKur(ham, BUGUN) }
}

describe('araç tanımları ve kural', () => {
  it('üç araç; her birinde isteğe bağlı hasta adı; kural üçünü de adıyla söyler', () => {
    assert.deepEqual(ANALIZ_ARACLARI.map((a) => a.name), ['muayene_ara', 'muayeneleri_oku', 'eksikler'])
    for (const a of ANALIZ_ARACLARI) {
      const s = a.input_schema as { properties: Record<string, unknown>; required?: string[] }
      assert.ok('hasta_adi' in s.properties && !(s.required || []).includes('hasta_adi'), a.name)
      assert.ok(ANALIZ_KURALI.includes(a.name), a.name)
    }
    assert.deepEqual((ANALIZ_ARACLARI[0].input_schema as { required: string[] }).required, ['terim'])
  })
})

describe('muayene_ara — terim hangi muayenede geçiyor', () => {
  const { olaylar } = dosya()

  it('ilaç: yazıldığı tek muayene, tarihi ve durumu (reçete edildi)', () => {
    const m = muayeneAra('Augmentin', olaylar, AD)
    assert.match(m, /"Augmentin": 4 onaylı muayenenin 1 tanesinde geçiyor/)
    assert.match(m, /- 26\.11\.2025 — 2\. muayene \(muayene\): .*reçete edildi — Augmentin — günde 2 kez 7 gün/)
    for (const baska of ['27.09.2025', '25.01.2026', '05.05.2026']) assert.ok(!m.includes(`- ${baska}`), baska)
  })

  it('tetkik: istendiği muayene — durum "istendi", bir cümle bir kez yazılır', () => {
    const m = muayeneAra('hemogram', olaylar, AD)
    assert.match(m, /- 27\.09\.2025 — 1\. muayene \(Sağlam çocuk muayenesi \/ rutin kontrol\): not metni — istendi: "Hemogram ve ferritin istendi"/)
    assert.equal(m.split('Hemogram ve ferritin istendi').length - 1, 1)
  })

  it('aşı: seri eşleşir; uygulanan dozlar "uygulandı", notta planlanan doz "planlandı" — durumlar karışmaz', () => {
    const m = muayeneAra('Hepatit B aşısı', olaylar, AD)
    assert.match(m, /26\.11\.2025 — 2\. muayene .*not metni — planlandı: "Hepatit B 3\. doz bir sonraki vizitte yapılacak"/)
    assert.match(m, /MUAYENE GÜNÜ DIŞINDAKİ KAYITLAR:\n- 30\.07\.2025 — aşı kaydı — Hepatit B 1\. doz — uygulandı\n- 30\.08\.2025 — aşı kaydı — Hepatit B 2\. doz — uygulandı/)
    assert.ok(!/3\. doz[^\n]*uygulandı/.test(m), 'planlanan doz uygulanmış gibi yazılmadı')
  })

  it('tanı / şikayet: eşdeğer terimlerle aranır ve notun hangi bölümünde geçtiği yazılır', () => {
    const m = muayeneAra('kulak ağrısı', olaylar, AD)
    assert.match(m, /- 26\.11\.2025 — 2\. muayene/)
    assert.match(m, /notun tanı bölümü: "Akut otitis media"/)
    assert.match(m, /eşdeğer terimlerle \(/)
  })

  it('geçmeyen terim: açık "geçmiyor" cümlesi — başka muayeneye düşülmez; anlamsız terim reddedilir', () => {
    const m = muayeneAra('EEG', olaylar, AD)
    assert.match(m, /"EEG" dosyadaki 4 onaylı muayenenin hiçbirinde ve diğer kayıtlarda geçmiyor/)
    assert.match(m, /Kayıt yok demek yapılmadı demek değildir/)
    assert.match(muayeneAra(' ', olaylar, AD), /Aranacak terimi anlayamadım/)
  })

  it('çok eşleşme: satır tavanı ve "KESİLDİ" bildirimi', () => {
    const cok: HamVizit[] = Array.from({ length: ARAMA_SATIR_TAVANI + 6 }, (_, i) => ({ id: `c${i}`, tarih: `2025-${String(1 + Math.floor(i / 28)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}T09:00:00Z`, subjektif: 'Öksürük.', plan: 'Ventolin başlandı.', ilaclar: [{ ad: 'Ventolin', kullanim: '4x1' }] }))
    const m = muayeneAra('Ventolin', dosya(cok).olaylar, AD)
    assert.match(m, new RegExp(`KESİLDİ: ${ARAMA_SATIR_TAVANI + 6} satırın ilk ${ARAMA_SATIR_TAVANI} tanesi gösterildi`))
    assert.equal(m.split('\n').filter((s) => s.startsWith('- ')).length, ARAMA_SATIR_TAVANI)
  })
})

describe('muayeneleri_oku — birkaç muayenenin sınırlı dökümü', () => {
  const { olaylar, hasta } = dosya()

  it('seçim verilmezse son 4 muayene; her muayenede bölümler, ölçümler, reçete ve planın karşılığı', () => {
    const m = muayeneOzeti({}, olaylar, hasta, AD)
    assert.match(m, /^Nehir Karadağ — son 4 muayene: 4 muayene \(dosyada toplam 4 onaylı muayene; bugün 02\.10\.2026\)\./)
    assert.match(m, /### 1\. muayene — 27\.09\.2025 \(Sağlam çocuk muayenesi \/ rutin kontrol\)/)
    assert.match(m, /Ölçümler: kilo 5,4 kg; boy 58 cm; baş çevresi 39 cm/)
    assert.match(m, /Reçete: Augmentin — günde 2 kez 7 gün/)
    assert.match(m, /- Ferritin — istendi \("Hemogram ve ferritin istendi"\) → sonraki kayıtta karşılığı yok/)
    assert.match(m, /- Hepatit B 3\. doz — planlandı .* → sonraki kayıtta karşılığı yok/)
    assert.match(m, /- kontrol — randevu \/ kontrol verildi \("1 ay sonra kontrol"\) → sonraki kayıtta karşılığı yok/)
    assert.ok(!m.includes('KESİLDİ'))
  })

  it('ölçümsüz muayene: her ölçüm "kayıt yok" yazar ve kapanış satırı o muayeneyi tarihle sayar', () => {
    const m = muayeneOzeti({ adet: 4 }, olaylar, hasta, AD)
    assert.match(m, /### 3\. muayene — 25\.01\.2026[\s\S]*?Ölçümler: kilo: kayıt yok; boy: kayıt yok; baş çevresi: kayıt yok/)
    assert.match(m, /Ölçüm kaydı olmayan muayeneler: kilo — 25\.01\.2026; boy — 25\.01\.2026; baş çevresi — 26\.11\.2025, 25\.01\.2026, 05\.05\.2026\./)
  })

  it('adet, tarihler (iki biçim), tür / yaş dönümü, "ilk"', () => {
    assert.match(muayeneOzeti({ adet: 2 }, olaylar, hasta, AD), /son 2 muayene: 2 muayene[\s\S]*### 3\. muayene[\s\S]*### 4\. muayene/)
    assert.ok(!muayeneOzeti({ adet: '2' }, olaylar, hasta, AD).includes('### 2. muayene'))
    const t = muayeneOzeti({ tarihler: ['2025-11-26', '05.05.2026', '2024-01-01'] }, olaylar, hasta, AD)
    assert.match(t, /tarihler: 26\.11\.2025, 05\.05\.2026, 01\.01\.2024: 2 muayene/)
    assert.match(t, /Bu tarihlerde onaylı muayene yok: 01\.01\.2024\./)
    assert.match(muayeneOzeti({ tur: '6 aylık' }, olaylar, hasta, AD), /tür: 6 aylık: 1 muayene[\s\S]*### 3\. muayene — 25\.01\.2026/)
    assert.match(muayeneOzeti({ tur: 'sağlam çocuk' }, olaylar, hasta, AD), /tür: sağlam çocuk: 3 muayene/)
    assert.match(muayeneOzeti({ tur: 'ilk' }, olaylar, hasta, AD), /ilk muayene: 1 muayene[\s\S]*### 1\. muayene/)
  })

  it('eşleşme yoksa başka muayeneye düşmez; dosyada kaç muayene olduğunu söyler', () => {
    const m = muayeneOzeti({ tur: '24 aylık' }, olaylar, hasta, AD)
    assert.match(m, /tür: 24 aylık: eşleşen onaylı muayene yok\./)
    assert.match(m, /Dosyada 4 onaylı muayene var \(27\.09\.2025 – 05\.05\.2026\)\./)
    assert.ok(!m.includes('###'))
    assert.match(muayeneOzeti({}, [], hasta, AD), /onaylı muayene notu yok/)
  })

  it('adet tavanı: istenen 12, gösterilen en yeni 8 — kesildiği ve hangilerinin gösterilmediği yazar', () => {
    const cok: HamVizit[] = Array.from({ length: 12 }, (_, i) => ({ id: `c${i}`, tarih: `2026-${String(i + 1).padStart(2, '0')}-10T09:00:00Z`, subjektif: `Muayene ${i + 1}.`, plan: 'Öneriler anlatıldı.', vitaller: { kilo: 10 + i, boy: 80 + i, basCevresi: 45 } }))
    const d = dosya(cok)
    const m = muayeneOzeti({ adet: 12 }, d.olaylar, { ...d.hasta, bugunIso: '2026-12-31' }, AD)
    assert.match(m, new RegExp(`KESİLDİ: 12 muayeneden ${MUAYENE_ADET_TAVANI} tanesi gösterildi \\(bir çağrıda en çok ${MUAYENE_ADET_TAVANI} muayene\\)\\. Gösterilmeyenler: 10\\.01\\.2026, 10\\.02\\.2026, 10\\.03\\.2026, 10\\.04\\.2026`))
    assert.ok(m.includes('### 12. muayene') && m.includes('### 5. muayene') && !m.includes('### 4. muayene'))
  })

  it('boyut tavanı: uzun notlarda eski muayeneler kesilir, en yenisi kalır; toplam boyut sınırlıdır', () => {
    const uzun = 'Ayrıntılı öykü cümlesi burada yer alıyor. '.repeat(20)
    const cok: HamVizit[] = Array.from({ length: 8 }, (_, i) => ({ id: `u${i}`, tarih: `2026-0${i + 1}-10T09:00:00Z`, subjektif: uzun, objektif: uzun, degerlendirme: uzun, plan: uzun, tani: uzun, vitaller: { kilo: 10 + i, boy: 80 + i, basCevresi: 45 } }))
    const d = dosya(cok)
    const m = muayeneOzeti({ adet: 8 }, d.olaylar, { ...d.hasta, bugunIso: '2026-12-31' }, AD)
    assert.match(m, /KESİLDİ: 8 muayeneden \d tanesi gösterildi \(boyut sınırı\)\. Gösterilmeyenler: 10\.01\.2026/)
    assert.ok(m.includes('### 8. muayene') && !m.includes('### 1. muayene'))
    assert.ok(m.length <= MUAYENE_OZET_TAVANI + 900, `boyut ${m.length}`)
    // A section that reached the index's cap says it was shortened.
    assert.equal(VIZIT_BOLUM_SINIRI['Şikayet'], 300)
    assert.match(m, /Şikayet \/ öykü: .{300} … \[bu bölüm kayıtta daha uzun; burada kısaltıldı\]/)
  })
})

describe('eksikler — Fısıltı bölümü ve dosya sorgu standardının açık işleri', () => {
  const { olaylar, hasta } = dosya()
  const oge: FisiltiItem = { id: 'pediatri:h1', brans: 'pediatri', patientId: 'h1', ad: AD, baslik: 'aşı gecikti', detay: ['Aşı: Hep B 3. doz (25.01.2026)', 'İzlem: 12. ay (29.07.2026–27.08.2026) muayene yok'], enErkenTarih: '2026-01-25', hedefYol: '/x', toplamBekleyen: 0, kaynak: 'klinik' }
  const f = (ek: Partial<HastaFisiltisi> = {}): HastaFisiltisi => ({ destekli: true, bagli: true, brans: 'pediatri', oge, gizli: false, sessiz: false, hata: false, ...ek })

  it('A bölümü Fısıltı kartının satırlarıdır — aynen, sırasıyla', () => {
    const m = eksiklerMetni({ hastaAdi: AD, hasta, olaylar, fisilti: f() })
    assert.deepEqual(fisiltiSatirlari(f()), oge.detay)
    assert.match(m, /A\) FISILTI[^\n]*\n- Aşı: Hep B 3\. doz \(25\.01\.2026\)\n- İzlem: 12\. ay \(29\.07\.2026–27\.08\.2026\) muayene yok\n {2}\(en eski gecikme: 25\.01\.2026\)\nB\)/)
  })

  it('B bölümü: istenip sonucu olmayan tetkik, planlanıp kaydı olmayan aşı, planlanıp randevusu olmayan kontrol', () => {
    const m = eksiklerMetni({ hastaAdi: AD, hasta, olaylar, fisilti: f() })
    assert.match(m, /- Ferritin — istendi, sonuç yok \(istem: 27\.09\.2025, not: "Hemogram ve ferritin istendi"\)\./)
    assert.match(m, /- Hepatit B 3\. doz — planlandı \(26\.11\.2025, not: "[^"]+"\); uygulandığına dair kayıt bulamadım\./)
    assert.match(m, /- Kontrol 04\.06\.2026 için planlanmıştı \(05\.05\.2026 notu: "1 ay sonra kontrol"\); sonraki vizit kaydı yok\./)
  })

  it('Fısıltı olan branşta takvimden hesaplanan kalemler (aşı takvimi, büyüme, tarama penceresi) B bölümüne girmez', () => {
    const isler = acikIsleriBul(olaylar, 14, hasta.brans, hasta)
    const takvim = [...isler.bugun, ...isler.yakinda, ...isler.rutin].filter((i) => i.tur === 'asi-eksik' || i.tur === 'buyume' || i.tur === 'tarama-zamani')
    assert.ok(takvim.length > 0, 'standart bu hasta için takvim kalemi üretiyor — süzgeç boşa sınanmıyor')
    const fisiltili = eksiklerMetni({ hastaAdi: AD, hasta, olaylar, fisilti: f() })
    const fisiltisiz = eksiklerMetni({ hastaAdi: AD, hasta, olaylar, fisilti: f({ destekli: false, bagli: false, oge: null }) })
    // A branch whose Fısıltı engine exists but cannot be read from the model turn (its engine file also writes).
    const bagsiz = eksiklerMetni({ hastaAdi: AD, hasta, olaylar, fisilti: f({ bagli: false, oge: null }) })
    for (const i of takvim) {
      assert.ok(!fisiltili.includes(i.metin), `Fısıltı varken B bölümünde takvim kalemi: ${i.metin}`)
      assert.ok(fisiltisiz.includes(i.metin), `Fısıltı yokken takvim kalemi standarttan gelir: ${i.metin}`)
      assert.ok(bagsiz.includes(i.metin), `Fısıltı okunamıyorken takvim kalemi standarttan gelir: ${i.metin}`)
    }
    assert.match(fisiltisiz, /Bu branş için Fısıltı kuralı tanımlı değil/)
    assert.match(bagsiz, /Bu branşın Fısıltı kuralları buradan okunamıyor; bu bölüm BİLİNMİYOR \("eksik yok" anlamına gelmez\)/)
    assert.ok(!bagsiz.includes('uyarı üretmiyor'), 'okunamayan motor için "uyarı yok" denmez')
  })

  it('motor uyarı üretmiyorsa bunu söyler; motora ulaşılamadıysa "eksik yok" DEMEZ', () => {
    assert.match(eksiklerMetni({ hastaAdi: AD, hasta, olaylar, fisilti: f({ oge: null }) }), /- Fısıltı bu hasta için bir uyarı üretmiyor\./)
    const hata = eksiklerMetni({ hastaAdi: AD, hasta, olaylar, fisilti: f({ oge: null, hata: true }) })
    assert.match(hata, /Fısıltı motoruna şu an ulaşılamadı; bu bölüm BİLİNMİYOR/)
    assert.ok(!hata.includes('uyarı üretmiyor'))
  })

  it('hekim uyarıyı gizlemiş ya da hastayı sessize almışsa eksik yine yazılır, kartta görünmediği not edilir', () => {
    assert.match(eksiklerMetni({ hastaAdi: AD, hasta, olaylar, fisilti: f({ gizli: true }) }), /- Aşı: Hep B 3\. doz[\s\S]*Not: bu uyarı Fısıltı kartında gizlenmiş; kartta görünmez/)
    assert.match(eksiklerMetni({ hastaAdi: AD, hasta, olaylar, fisilti: f({ sessiz: true }) }), /Not: bu hastanın Fısıltı hatırlatmaları sessize alınmış/)
  })

  it('açık iş yoksa söyler', () => {
    const bos = dosya([{ id: 'b1', tarih: '2026-09-20T09:00:00Z', subjektif: 'Yakınması yok.', plan: 'Öneriler anlatıldı.', vitaller: { kilo: 9, boy: 74, basCevresi: 45 } }])
    assert.match(eksiklerMetni({ hastaAdi: AD, hasta: bos.hasta, olaylar: bos.olaylar, fisilti: f({ oge: null }) }), /B\)[^\n]*\n- Açık iş saptanmadı\./)
  })
})
