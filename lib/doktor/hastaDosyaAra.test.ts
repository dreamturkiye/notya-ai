import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ARAMA_ALANLARI, adaylariTopla, hastaSayimiSeansIster, istatistikKur, klinikAramaMi, listeSorgusuMu, metinEslesir, sorguyuAyikla, tumTerimlerEslesir, yasAyHesapla, yasFiltreEslesir } from './hastaDosyaAra'
import { sayimCumlesi } from './hastaCozumleyici'
import { olumsuzBulgulariAyikla } from './hastaAramaFiltre'
import { cevapTuru } from './aramaBolum'
import { listeIstenmisMi } from './hastaCozumleyici'
import { antibiyotikMi, haricEslesir, ilacAdiKir, sayisalEslesir, veyaEslesir } from './hastaAramaFiltre'

const PAZAR = new Date('2026-09-20T15:00:00+03:00')

describe('hastaDosyaAra — sorgu (ad/doğum tarihi yok)', () => {
  it('geçen hafta + aşı → pencere ve asi bayrağı', () => {
    const q = sorguyuAyikla('Gecen haftaki asi yaptigim hastalar hangileriyedi?', PAZAR)
    assert.equal(q.asi, true)
    assert.equal(q.cogul, true)
    assert.equal(q.pencere?.basGun, '2026-09-07')
    assert.equal(q.pencere?.bitGun, '2026-09-13')
  })

  it('bu hafta kulak iltihabı → otit eşanlamı', () => {
    const q = sorguyuAyikla('Hangi hasta bana bu hafta kulak iltehabi ile geldi?', PAZAR)
    assert.equal(q.cogul, false)
    assert.ok(q.terimler.includes('kulak') || q.terimler.includes('otit'))
    assert.ok(q.terimler.includes('iltihap') || q.terimler.some((t) => t.includes('iltihap') || t.includes('otit') || t.includes('kulak')))
    assert.equal(q.pencere?.basGun, '2026-09-14')
    assert.equal(q.pencere?.bitGun, '2026-09-20')
  })

  it('otitis media notu kulak sorgusuna uyar', () => {
    assert.equal(metinEslesir('Akut otitis media, sağ kulak zarı bombeli', ['kulak', 'otit', 'h66']), true)
    assert.equal(metinEslesir('Sağlam çocuk kontrolü, aşı yok', ['kulak', 'otit']), false)
  })

  it('selamlaşma klinik arama açmaz', () => {
    assert.equal(klinikAramaMi('Merhaba hocam nasılsınız'), false)
  })

  it('alan kataloğu birleşik filtre için yeterli (takma adlar dahil)', () => {
    const takma = ARAMA_ALANLARI.flatMap((a) => [a.anahtar, ...a.takma])
    assert.ok(ARAMA_ALANLARI.length >= 30, 'alan sayısı')
    assert.ok(takma.length >= 80, `takma ${takma.length}`)
  })

  it('aynı hastanın iki kaynağı birleşir; yabancı id karışmaz', () => {
    const g = adaylariTopla([
      { patientId: 'A', kaynak: 'asi', neden: 'Hepatit B', skor: 12 },
      { patientId: 'A', kaynak: 'not', neden: 'otit', skor: 8 },
      { patientId: 'B', kaynak: 'asi', neden: 'KPA', skor: 12 },
    ])
    assert.equal(g.get('A')?.skor, 20)
    assert.equal(g.size, 2)
  })

  it('NOTYA-KORPUS-KALAN-01 (G-21): kaynaklar gösterim listesinden ayrı tutulur — dört muayenenin ardındaki aşı kaydı kaybolmaz', () => {
    const muayene = [1, 2, 3, 4, 5].map((n) => ({ patientId: 'A', kaynak: 'seans', neden: `0${n}.09.2026 muayene`, skor: 4, metin: 'muayene seans' }))
    const asi = { patientId: 'A', kaynak: 'asi', neden: '15.05.2024 aşı: KKK', skor: 12, metin: 'aşı KKK' }
    const g = adaylariTopla([...muayene, asi]).get('A')!
    assert.equal(g.nedenler.length, 4)
    assert.ok(!g.nedenler.some((n) => /aşı/.test(n)), 'gösterim listesi ilk dört satırdır')
    assert.ok(g.kaynaklar.has('asi') && g.kaynaklar.has('seans'))
    // The table the question is about is shown first.
    assert.equal(adaylariTopla([...muayene, asi], 'asi').get('A')!.nedenler[0], '15.05.2024 aşı: KKK')
  })

  it('NOTYA-KORPUS-KALAN-01 (G-22): ilaç satırı adı ne olursa olsun "ilaç" eşleşmesidir; etken madde de aranır', () => {
    const g = adaylariTopla([{ patientId: 'A', kaynak: 'ilac', neden: 'ilaç: Klacid', skor: 7, metin: 'Klacid 250 mg/5 ml', ek: 'ilaç klaritromisin' }]).get('A')!
    const q = sorguyuAyikla('ilaç kullanan hastam var mı', PAZAR)
    assert.ok(!q.terimler.includes('kullanan'), JSON.stringify(q.terimler))
    assert.equal(tumTerimlerEslesir(g.metin, q.terimler), true)
    assert.equal(metinEslesir(g.metin, ['klaritromisin']), true)
    for (const m of ['ilaç alan hastalarım kimler', 'demir kullanmakta olan hastalar', 'antibiyotik içen hastalarım']) {
      const t = sorguyuAyikla(m, PAZAR).terimler
      assert.ok(!t.some((x) => ['alan', 'kullanmakta', 'icen'].includes(x)), `${m} → ${JSON.stringify(t)}`)
    }
  })

  it('NOTYA-ARAMA-DOGUM-NEGASYON-01 (G-24): "doğum tarihi kayıtlı olmayan" bir olumsuzlamadır, alan filtresi değil', () => {
    for (const m of ['doğum tarihi kayıtlı olmayan hastam var mı', 'Doğum tarihi girilmemiş hastalarım kimler', 'doğum tarihi eksik hastalar', 'doğum tarihi olmayanları listele']) {
      const q = sorguyuAyikla(m, PAZAR)
      assert.equal(q.dogumYok, true, m)
      assert.equal(q.klinik, true, m)
      assert.ok(!q.alanlar.some((a) => a.anahtar === 'dogum'), m)
      assert.deepEqual(q.terimler, [], m)
      assert.match(q.ozet, /doğum tarihi yok/, m)
    }
    assert.equal(sorguyuAyikla('doğum tarihi 2021 olan hastalar', PAZAR).dogumYok, false)
    assert.equal(sorguyuAyikla('kaç hastam var', PAZAR).dogumYok, false)
  })

  it('bu hafta 2 yaşındaki gördüklerim → yaş + pencere + boş artık terim', () => {
    const q = sorguyuAyikla('Bu hafta gördüğüm 2 yaşındaki hastalar hangileriydi?', PAZAR)
    assert.equal(q.yas?.minAy, 24)
    assert.equal(q.yas?.maxAy, 35)
    assert.equal(q.pencere?.basGun, '2026-09-14')
    assert.equal(q.ziyaret, true)
    assert.equal(q.klinik, true)
    assert.ok(!q.terimler.includes('yasindaki') && !q.terimler.includes('yasinda'))
    assert.equal(listeSorgusuMu('Bu hafta gördüğüm 2 yaşındaki hastalar hangileriydi?', q), true)
  })

  it('iki yaşında / 18 aylık / 2-4 yaş aralığı', () => {
    assert.deepEqual(sorguyuAyikla('iki yaşındaki kızlar', PAZAR).yas, { minAy: 24, maxAy: 35, etiket: '2 yaş' })
    assert.equal(sorguyuAyikla('18 aylık bebekler', PAZAR).yas?.minAy, 18)
    const a = sorguyuAyikla('2-4 yaş arası otit', PAZAR)
    assert.equal(a.yas?.minAy, 24)
    assert.equal(a.yas?.maxAy, 59)
  })

  it('BETWEEN 1–5 yaş + bu hafta + kaç tane (TR ve EN)', () => {
    for (const cumle of [
      'Bu hafta 1-5 yaş arası kaç hasta gördüm?',
      'Bu hafta 1 ile 5 yaş arasında kaç hastam vardı?',
      "Tell me the number of hastas I had this week between then ages of 1-5",
    ]) {
      const q = sorguyuAyikla(cumle, PAZAR)
      assert.equal(q.yas?.minAy, 12, cumle)
      assert.equal(q.yas?.maxAy, 71, cumle)
      assert.equal(q.pencere?.etiket, 'bu hafta', cumle)
      assert.equal(q.sayim, true, cumle)
      assert.equal(q.ziyaret, true, cumle)
    }
  })

  it('kaç tane → sayım + liste', () => {
    const q = sorguyuAyikla('Bu hafta 2 yaşında kaç hasta gördüm?', PAZAR)
    assert.equal(q.sayim, true)
    assert.equal(q.cogul, true)
    assert.ok(q.yas)
  })

  it('yaş hesabı 2.0–2.99 yılı 24–35 ay', () => {
    const ay = yasAyHesapla('2024-03-20', PAZAR)
    assert.ok(ay != null && ay >= 24 && ay <= 35)
    assert.equal(yasFiltreEslesir(ay, { minAy: 24, maxAy: 35, etiket: '2 yaş' }), true)
    assert.equal(yasFiltreEslesir(12, { minAy: 24, maxAy: 35, etiket: '2 yaş' }), false)
  })

  it('VEYA / HARİÇ / son N gün / ateş / kan grubu', () => {
    const veya = sorguyuAyikla('Bu hafta otit veya farenjit', PAZAR)
    assert.equal(veya.veya.length, 2)
    assert.ok(veya.veya[0].some((t) => t === 'otit' || t === 'kulak'))
    assert.ok(veya.veya[1].some((t) => t === 'farenjit' || t === 'bogaz'))
    assert.equal(veya.pencere?.etiket, 'bu hafta')

    const haric = sorguyuAyikla('2 yaşında aşı olmayanlar', PAZAR)
    assert.ok(haric.haric.includes('asi'))
    assert.equal(haric.asi, false)
    assert.equal(haric.yas?.minAy, 24)

    const son = sorguyuAyikla('son 3 gün ateşi 38 üstü', PAZAR)
    assert.equal(son.pencere?.basGun, '2026-09-17')
    assert.equal(son.pencere?.bitGun, '2026-09-20')
    assert.ok(son.sayisal.some((s) => s.alan === 'ates' && s.min === 38))

    const kan = sorguyuAyikla('A rh+ hastalar', PAZAR)
    assert.equal(kan.kanGrubu, 'a rh+')
    assert.equal(kan.klinik, true)

    assert.equal(sorguyuAyikla('kızlar', PAZAR).cinsiyet, 'kadin')
    assert.equal(klinikAramaMi('kızlar'), true)

    assert.equal(veyaEslesir('akut otitis media', [['kulak', 'otit'], ['bogaz', 'farenjit']]), true)
    assert.equal(veyaEslesir('sağlam çocuk', [['kulak', 'otit'], ['bogaz', 'farenjit']]), false)
    assert.equal(haricEslesir('kontrol muayene', ['asi']), true)
    assert.equal(haricEslesir('KPA aşı kaydı', ['asi']), false)
    assert.equal(sayisalEslesir('ates 38.6 kilo 12', [{ alan: 'ates', min: 38, max: null, etiket: 'ates ≥38' }]), true)
    assert.equal(sayisalEslesir('ates 37.2', [{ alan: 'ates', min: 38, max: null, etiket: 'ates ≥38' }]), false)
  })

  it('Gökhan’ın altı cümlesi: aşı adedi, 1 ve 5 yaş, süre, toplam, Augmentin, ihtihabi', () => {
    const asi = sorguyuAyikla('Bu hafta kac asi yaptik?', PAZAR)
    assert.equal(asi.olcum, 'asi')
    assert.equal(asi.pencere?.etiket, 'bu hafta')
    assert.equal(asi.sayim, true)
    assert.ok(!asi.terimler.includes('yaptik'))

    const yas = sorguyuAyikla('Bu hafta 1 ve 5 yaslari arasinda kac hasta gordum', PAZAR)
    assert.equal(yas.yas?.minAy, 12)
    assert.equal(yas.yas?.maxAy, 71)
    assert.equal(yas.pencere?.etiket, 'bu hafta')
    assert.equal(yas.olcum, 'hasta')
    assert.equal(yas.ziyaret, true)

    const sure = sorguyuAyikla('Bu haftaki averaj hasta seansim kac dakikaydi', PAZAR)
    assert.equal(sure.olcum, 'sure')
    assert.equal(sure.pencere?.etiket, 'bu hafta')
    assert.ok(!sure.terimler.includes('averaj') && !sure.terimler.includes('dakika'))

    const toplam = sorguyuAyikla('Bu hafta toplam kac hasta gordum', PAZAR)
    assert.equal(toplam.olcum, 'hasta')
    assert.equal(toplam.pencere?.etiket, 'bu hafta')
    assert.ok(!toplam.terimler.includes('toplam'))

    const ilac = sorguyuAyikla('Bu ay kac hastaya Augmentin receteledim, bu hastalari listele', PAZAR)
    assert.equal(ilac.olcum, 'ilac')
    assert.equal(ilac.pencere?.etiket, 'bu ay')
    assert.ok(ilac.terimler.includes('augmentin') || ilac.terimler.includes('amoksisilin'))
    assert.equal(ilac.cogul, true)

    const kulak = sorguyuAyikla('Hangi hasta veya hastalar bana gecen hafta kulak ihtihabi ile geldi?', PAZAR)
    assert.equal(kulak.pencere?.etiket, 'geçen hafta')
    assert.equal(kulak.veya.length, 0, 'hasta veya hastalar OR açmamalı')
    assert.ok(kulak.terimler.includes('kulak') || kulak.terimler.includes('otit'))
    assert.ok(kulak.terimler.includes('iltihap'))

    const gokhanIlac = sorguyuAyikla('Son bir ay içinde hangi antibiyotiği en fazla yazdım?', PAZAR)
    assert.equal(gokhanIlac.olcum, 'ilac')
    assert.equal(gokhanIlac.kirilim, 'ilac_adi')
    assert.equal(gokhanIlac.ilacSinif, 'antibiyotik')
    assert.equal(gokhanIlac.pencere?.etiket, 'son 1 ay')
    assert.equal(gokhanIlac.klinik, true)
    assert.ok(!gokhanIlac.terimler.includes('hangi'))
    const kir = ilacAdiKir([
      { ad: 'Augmentin 400', patientId: 'a' },
      { ad: 'Augmentin 400', patientId: 'b' },
      { ad: 'Amoklavin BID', patientId: 'c' },
      { ad: 'Azitromisin 200', patientId: 'd' },
      { ad: 'Parasetamol', patientId: 'e' },
    ], 'antibiyotik', 'son 1 ay')
    assert.match(kir.cumle, /Augmentin|Amoklavin|augmentin/i)
    assert.match(kir.cumle, /3 reçete/)
    assert.equal(kir.sira.length, 2)
    assert.equal(antibiyotikMi('Parasetamol'), false)
    assert.equal(antibiyotikMi('Sefiksim 100'), true)

    const st = istatistikKur(asi, { hastaSayisi: 3, seansSayisi: 4, asiAdedi: 5, ilacAdedi: 0, ortalamaSeansDk: 18 })
    assert.equal(st.birim, 'asi')
    assert.match(st.cumle, /5 aşı/)
    const dk = istatistikKur(sure, { hastaSayisi: 4, seansSayisi: 4, asiAdedi: 0, ilacAdedi: 0, ortalamaSeansDk: 18 })
    assert.match(dk.cumle, /18 dakika/)
  })

  it('istemci sayfası şifre çözücüyü çekmez (klinikAramaMi filtrede)', () => {
    const sayfa = readFileSync(new URL('../../app/dashboard/doktor/hastalar/page.tsx', import.meta.url), 'utf8')
    const secici = readFileSync(new URL('./aracUi.tsx', import.meta.url), 'utf8')
    const rota = readFileSync(new URL('../../app/api/doktor/hastalar/route.ts', import.meta.url), 'utf8')
    assert.ok(sayfa.includes("from '@/lib/doktor/hastaAramaFiltre'"))
    assert.ok(!sayfa.includes('hastaDosyaAra'))
    assert.ok(secici.includes("from '@/lib/doktor/hastaAramaFiltre'"))
    assert.ok(rota.includes('hastaDosyaAra') && rota.includes('searchParams.get(\'q\')'))
  })

  it('Pediatri altın 10: parser sınıfları (gecikme, frekans, yokluk, pivot, kohort)', () => {
    const q1 = sorguyuAyikla('Bu ay 12–24 ay aralığındaki çocuklarda KPA serisi başlamış ama 2. veya 3. dozu gecikmiş kaç hasta var? Listele, en erken önerilen doza göre sırala.', PAZAR)
    assert.equal(q1.seri, 'kpa')
    assert.equal(q1.seriGecikme, true)
    assert.equal(q1.yas?.minAy, 12)
    assert.equal(q1.yas?.maxAy, 24)
    assert.equal(q1.pencere?.etiket, 'bu ay')
    assert.equal(q1.veya.length, 0, '2. veya 3. doz OR açmamalı')

    const q2 = sorguyuAyikla('Geçen hafta otit / orta kulak iltihabı ile gelen ve Augmentin veya amoksisilin-klavulanat reçetelediğim 1–5 yaş arası hastaları listele', PAZAR)
    assert.equal(q2.pencere?.etiket, 'geçen hafta')
    assert.equal(q2.yas?.minAy, 12)
    assert.equal(q2.yas?.maxAy, 71)
    assert.ok(q2.terimler.some((t) => t === 'otit' || t === 'kulak'))
    assert.ok(q2.veya.length >= 2)
    assert.ok(q2.veya.flat().some((t) => t.includes('augmentin') || t.includes('klavulan')))

    const q3 = sorguyuAyikla('Son 90 günde 3 veya daha fazla kez muayene ettiğim ve en az birinde ateş ≥38,5 kaydı olan hastalar kimler?', PAZAR)
    assert.equal(q3.minSeans, 3)
    assert.ok(q3.sayisal.some((s) => s.alan === 'ates' && s.min === 38.5))
    assert.match(q3.pencere?.etiket || '', /son 90/)

    const q4 = sorguyuAyikla('18–24 aylık olup M-CHAT’i hiç yapılmamış veya sonucu riskli olan ve son 6 ayda muayenesi olan çocukları bul.', PAZAR)
    assert.equal(q4.mchat, 'yok_veya_riskli')
    assert.equal(q4.yas?.minAy, 18)
    assert.equal(q4.yas?.maxAy, 24)
    assert.match(q4.pencere?.etiket || '', /son 6/)

    const q5 = sorguyuAyikla('Son 6 ayda kilo veya boy persentilinde 2 majör kanal kayması olan 0–36 aylık hastaları listele', PAZAR)
    assert.equal(q5.persentilEsik, 2)
    assert.equal(q5.yas?.minAy, 0)
    assert.equal(q5.yas?.maxAy, 36)

    const q6 = sorguyuAyikla('Bu hafta ortalama hasta seansım kaç dakikaydı? En uzun ve en kısa 3 seansı hasta adıyla söyle; 1–5 yaş ve 5+ yaş ayrı ortalamalar.', PAZAR)
    assert.equal(q6.olcum, 'sure')
    assert.equal(q6.ucDeger, true)
    assert.equal(q6.yasKirilim, true)
    assert.equal(q6.pencere?.etiket, 'bu hafta')

    const q7 = sorguyuAyikla('Bu hafta toplam kaç aşı uyguladık? Aşı adına göre kır (KPA, KKK, Hepatit B). Kaç tekil çocuk aşılandı?', PAZAR)
    assert.equal(q7.olcum, 'asi')
    assert.equal(q7.kirilim, 'asi_adi')
    assert.equal(q7.pencere?.etiket, 'bu hafta')

    const q8 = sorguyuAyikla('6–12 aylık, aktif D vitamini veya demir kaydı olmayan ve bebek görevi bekliyor/gecikmiş olan hastaları listele.', PAZAR)
    assert.ok(q8.bayrakVe.includes('profilaksi'))
    assert.equal(q8.yas?.minAy, 6)
    assert.equal(q8.yas?.maxAy, 12)

    const q9 = sorguyuAyikla('Bu ay hırıltı veya bronşiolit veya astım ile gelen, antibiyotik almayan, alerji kaydı olmayan 0–24 aylık hastalar kimler?', PAZAR)
    assert.ok(q9.veya.length >= 2)
    assert.ok(q9.veya.flat().includes('hirilti'))
    assert.ok(q9.veya.flat().includes('astim'))
    assert.ok(q9.haric.includes('antibiyotik'))
    assert.ok(q9.haric.includes('alerji'))
    assert.equal(q9.yas?.minAy, 0)
    assert.equal(q9.yas?.maxAy, 24)
    assert.equal(q9.pencere?.etiket, 'bu ay')

    const q10 = sorguyuAyikla('Sağlam çocuk izlemi kaçmış, aşı gecikmesi de olan ve hasta portalı açık olmayan aileleri listele; kaçına bu hafta hatırlatma gidebilirim?', PAZAR)
    assert.ok(q10.bayrakVe.includes('izlem_kacti'))
    assert.ok(q10.bayrakVe.includes('asi_gecikti'))
    assert.equal(q10.portalYok, true)
    assert.equal(q10.hatirlatmaSay, true)
  })

  it('her tablo sorgusu doktor kolonuna kilitli (izolasyon)', () => {
    const s = readFileSync(new URL('./hastaDosyaAra.ts', import.meta.url), 'utf8')
    assert.ok(s.includes('notes_encrypted'))
    assert.ok(s.includes('hasta_goruntulemeler'))
    assert.ok(s.includes('goruntu_calisma'))
    assert.ok(!s.includes('s?.ozet'), 'onaylı analiz aramada ham AI özeti yok')
    assert.ok(!/^import .*pediatri/m.test(s), 'pediatri motoru statik import edilmemeli')
    assert.ok(s.includes('async function pediBolumYurut'), 'kapalı dilim ayrı yolda')
    const fromlar = [...s.matchAll(/\.from\('([^']+)'\)/g)]
    assert.ok(fromlar.length >= 10, 'arama tabloları eksik')
    for (const m of fromlar) {
      const parca = s.slice(m.index ?? 0, (m.index ?? 0) + 280)
      if (m[1] === 'users') {
        assert.ok(/\.eq\('id',\s*doktorId\)/.test(parca), 'users kendi hekim id')
        continue
      }
      assert.ok(
        /doctor_id|doktor_id/.test(parca),
        `${m[1]} doktor filtresi yok`
      )
    }
  })
})

describe('NOTYA-SES-KAC-HASTA — sesli "kaç hasta" sayımı', () => {
  it('varyantlar saf sayım: filtre terimi yok, cevap türü sayim', () => {
    for (const s of ['kaç hasta', 'kaç hastam var', 'kac hasta', 'bugün kaç hasta', 'toplam kaç hastam var', 'Bugün kaç hasta baktım', 'bu hafta kaç hasta gördük']) {
      const q = sorguyuAyikla(s, PAZAR)
      assert.equal(q.sayim, true, s)
      assert.equal(q.olcum, 'hasta', s)
      assert.deepEqual(q.terimler, [], `${s} → terim ${q.terimler.join(',')}`)
      assert.equal(cevapTuru(q, null), 'sayim', s)
    }
    assert.equal(sorguyuAyikla('Bugün kaç hasta baktım', PAZAR).ziyaret, true)
    assert.equal(sorguyuAyikla('bugün kaç hasta', PAZAR).pencere?.etiket, 'bugün')
  })

  it('çıplak sayım tüm paneli sayar; pencere / ziyaret fiili seans ister', () => {
    assert.equal(hastaSayimiSeansIster(sorguyuAyikla('kaç hastam var', PAZAR)), false)
    assert.equal(hastaSayimiSeansIster(sorguyuAyikla('kaç hasta', PAZAR)), false)
    assert.equal(hastaSayimiSeansIster(sorguyuAyikla('bugün kaç hasta', PAZAR)), true)
    assert.equal(hastaSayimiSeansIster(sorguyuAyikla('kaç hasta gördüm', PAZAR)), true)
    assert.equal(hastaSayimiSeansIster(sorguyuAyikla('bu hafta 2 yaşında kaç hasta gördüm', PAZAR)), true)
  })

  it('sayım cümlesi verilen tam sayıyı söyler (40 satırlık liste tavanı değil)', () => {
    const q = sorguyuAyikla('kaç hastam var', PAZAR)
    const i = istatistikKur(q, { hastaSayisi: 137, seansSayisi: 0, asiAdedi: 0, ilacAdedi: 0, ortalamaSeansDk: null })
    assert.equal(i.cumle, 'Kayıtlarda 137 hasta.')
    const b = istatistikKur(sorguyuAyikla('bugün kaç hasta', PAZAR), { hastaSayisi: 3, seansSayisi: 3, asiAdedi: 0, ilacAdedi: 0, ortalamaSeansDk: null })
    assert.equal(b.cumle, 'Bugün 3 hasta. Filtre: bugün.')
  })

  it('liste yalnız istenince: "kaç hasta" sayı, "listele / kimler" ad listesi', () => {
    assert.equal(listeIstenmisMi('kaç hastam var'), false)
    assert.equal(listeIstenmisMi('Ayşe, bugün kaç hasta?'), false)
    assert.equal(listeIstenmisMi('bugün kaç hasta, listele'), true)
    assert.equal(listeIstenmisMi('ateşli hastalarım kimler'), true)
  })
})

describe('NOTYA-SES-KAC-HASTA-02 — "kaç <ölçü>" is not a count', () => {
  it('kaç yaşında / kilo / gün / ay / kez are value questions, not list/count queries', () => {
    for (const m of ['Ah hastamız kaç yaşında hocam?', 'Kaan Arıoğlu kaç yaşında?', 'Kaç kilo geldi?', 'Kaç gündür ateşi var?', 'Kaç aylık?', 'Kaç kez geldi?', 'Ateşi kaç derece?']) {
      const q = sorguyuAyikla(m, PAZAR)
      assert.equal(q.sayim, false, m)
      assert.equal(listeSorgusuMu(m, q), false, m)
    }
  })
  it('real counts still count', () => {
    for (const m of ['Kaç hastam var?', 'Bugün kaç hasta baktım?', 'Hasta sayısı?', 'kaç hasta', 'Bu ay kaç çocuk geldi?']) {
      const q = sorguyuAyikla(m, PAZAR)
      assert.equal(q.sayim, true, m)
      assert.equal(listeSorgusuMu(m, q), true, m)
    }
  })
})

describe('NOTYA-AYSE-100 S1 — doctor-speech function words are not search terms', () => {
  it('kaydım / ettim / kimdi / vakası / çocuk / reçetem drop out of terimler', () => {
    const now = new Date('2026-09-30T01:00:00Z')
    assert.deepEqual(sorguyuAyikla('kaç tane hasta kaydım var toplam', now).terimler, [])
    assert.deepEqual(sorguyuAyikla('bu hafta kaç hasta muayene ettim', now).terimler, [])
    assert.deepEqual(sorguyuAyikla('Son kaydettiğim hasta kim?', now).terimler, [])
    assert.deepEqual(sorguyuAyikla('Bu hafta tanı koyduğum pnömoni vakası kimdi?', now).terimler, ['pnomoni'])
    const kulak = sorguyuAyikla('kulak iltihabı olan çocuk kimdi', now)
    assert.ok(!kulak.terimler.includes('cocuk') && !kulak.terimler.includes('kimdi') && !kulak.terimler.includes('iltihap'), JSON.stringify(kulak.terimler))
    assert.ok(tumTerimlerEslesir('Sağ akut otitis media. Sağ kulak ağrısı', kulak.terimler))
    assert.equal(sorguyuAyikla('Hastalarımı listele', now).cogul, true)
  })
})

describe('NOTYA-AYSE-100-LUNA (a) — search windows in the doctor timezone', () => {
  // 2026-09-30T01:00Z: 30 Eylül 04:00 TRT, still 29 Eylül 21:00 in New York
  const AKSAM = new Date('2026-09-30T01:00:00Z')
  it('"bugün" for a US doctor is 29 Eylül; TRT default stays 30 Eylül', () => {
    const us = sorguyuAyikla('bugün kaç hasta muayene ettim', AKSAM, 'America/New_York')
    assert.equal(us.pencere?.basGun, '2026-09-29')
    assert.equal(us.pencere?.basIso, '2026-09-29T04:00:00.000Z')
    assert.equal(us.pencere?.bitIso, '2026-09-30T03:59:59.000Z')
    assert.equal(us.tz, 'America/New_York')
    const trt = sorguyuAyikla('bugün kaç hasta muayene ettim', AKSAM)
    assert.equal(trt.pencere?.basGun, '2026-09-30')
    assert.equal(trt.pencere?.basIso, '2026-09-29T21:00:00.000Z')
  })
  it('"bu hafta" and "son 7 gün" start from the doctor day, instants in the doctor zone', () => {
    const hafta = sorguyuAyikla('bu hafta kaç hasta muayene ettim', AKSAM, 'America/New_York')
    assert.equal(hafta.pencere?.basGun, '2026-09-28')
    assert.equal(hafta.pencere?.bitGun, '2026-09-29')
    assert.equal(hafta.pencere?.basIso, '2026-09-28T04:00:00.000Z')
    const son = sorguyuAyikla('son 7 gün kaç hasta geldi', AKSAM, 'America/New_York')
    assert.equal(son.pencere?.basGun, '2026-09-22')
    assert.equal(son.pencere?.bitGun, '2026-09-29')
  })
  it('unknown timezone falls back to TRT', () => {
    assert.equal(sorguyuAyikla('dün kaç hasta geldi', AKSAM, 'Mars/Olympus').pencere?.basGun, '2026-09-29')
  })
})

describe('NOTYA-AYSE-100-LUNA (b) — negated findings are not hits', () => {
  it('"Kulaklar: özellik yok" is dropped, "sağ kulak zarı hiperemik" stays', () => {
    const not = 'Boğaz hiperemik. Kulaklar: özellik yok. Kusma yok, ishal yok. Akciğerler doğal; kalp sesleri normal'
    const t = olumsuzBulgulariAyikla(not)
    assert.ok(!/kulak/i.test(t), t)
    assert.ok(!/kusma|ishal|akci|kalp/i.test(t), t)
    assert.ok(/Boğaz hiperemik/.test(t))
    const pozitif = olumsuzBulgulariAyikla('Sağ kulak zarı hiperemik ve bombe — sağ AOM')
    assert.match(pozitif, /kulak zarı hiperemik/)
    assert.equal(olumsuzBulgulariAyikla(''), '')
  })
  it('term match: a chart with only a negated kulak line does not match "kulak"', () => {
    assert.equal(metinEslesir(olumsuzBulgulariAyikla('Kulaklar — özellik yok'), ['kulak']), false)
    assert.equal(metinEslesir(olumsuzBulgulariAyikla('Sağ kulak zarı hiperemik'), ['kulak']), true)
  })
})

describe('NOTYA-SAYIM-ANDA-01 — "şu anda / toplam / benim" are never search terms (Kaan live, 2026-09-30)', () => {
  const NOW = new Date('2026-09-30T12:25:00Z')
  it('"Hocam benim şu anda toplam kaç hastam var?" is a bare panel count', () => {
    const q = sorguyuAyikla('Hocam benim şu anda toplam kaç hastam var?', NOW, 'America/New_York')
    assert.deepEqual(q.terimler, [])
    assert.equal(q.olcum, 'hasta')
    assert.equal(q.pencere, null)
    assert.equal(hastaSayimiSeansIster(q), false)
  })
  it('"şimdi kaç hastam var" / "şu an toplamda kaç hasta" likewise', () => {
    for (const s of ['şimdi kaç hastam var', 'şu an toplamda kaç hasta', 'acaba hâlâ kaç hastam var']) assert.deepEqual(sorguyuAyikla(s, NOW).terimler, [], s)
  })
  it('sayimCumlesi names a panel of ≤ 5, keeps the number alone above', () => {
    assert.equal(sayimCumlesi('Kayıtlarda 1 hasta.', 1, ['Kaan Arıoğlu']), 'Kayıtlarda 1 hasta: Kaan Arıoğlu.')
    assert.equal(sayimCumlesi('Kayıtlarda 2 hasta.', 2, ['A B', 'C D']), 'Kayıtlarda 2 hasta: A B, C D.')
    assert.equal(sayimCumlesi('Kayıtlarda 0 hasta.', 0, []), 'Kayıtlarda 0 hasta.')
    assert.equal(sayimCumlesi('Kayıtlarda 137 hasta.', 137, ['x']), 'Kayıtlarda 137 hasta.')
    assert.equal(sayimCumlesi('Bugün 2 hasta. Filtre: ateş.', 2, ['A', 'B']), 'Bugün 2 hasta: A, B. Filtre: ateş.')
  })
})


describe('NOTYA-FILTRE-TERIM-01 — "filtre:" label never becomes a mandatory search term (Dr. Gökhan screenshots, ~2026-09-30)', () => {
  const NOW = new Date('2026-09-30T12:00:00Z')
  it('"filtre: 5 yaş" parses the age filter and drops "filtre" from terimler', () => {
    const q = sorguyuAyikla('filtre: 5 yaş', NOW)
    assert.deepEqual(q.terimler, [])
    assert.ok(q.yas, 'yaş filtresi çözülmeli')
    assert.equal(q.yas?.etiket, '5 yaş')
    assert.equal(q.klinik, true)
  })
  it('"filtre: Burun" resolves the symptom field and drops "filtre" from terimler', () => {
    const q = sorguyuAyikla('filtre: Burun', NOW)
    assert.ok(!q.terimler.includes('filtre'), JSON.stringify(q.terimler))
    assert.ok(q.alanlar.some((a) => a.anahtar === 'burun'), JSON.stringify(q.alanlar))
    assert.equal(q.klinik, true)
  })
  it('a chart with no literal "filtre" anywhere still matches on its terimler (the actual bug: it never did before)', () => {
    const q = sorguyuAyikla('filtre: Burun', NOW)
    assert.equal(tumTerimlerEslesir('Burun akıntısı, nazal konjesyon mevcut.', q.terimler), true)
  })
})
