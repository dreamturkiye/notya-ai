/**
 * NOTYA-ASISTAN-PERSONA-BRANS (bu panel) + NOTYA-SES-DANIS-HATA-01 — regresyon kilidi.
 *
 * BUG A (kimlik — CEO düzeltmesi: "by design" DEĞİL, gerçek bir leak): "Ayşe'ye Danış" paneli artık
 * hekimin KENDİ branşının uzmanını okur; hardcoded "Ayşe" DEĞİL. dermatoloji hekimi "Selin'e Danış"
 * görür, kardiyoloji hekimi "Mehmet'e Danış" görür, bir Klinik dalı (sac-ekimi) "Emre Kaya'ya
 * Danış" görür (Klinik'in KENDİ 10 dallık rosteri — doktor rosteriyle karışmaz). Bilinmeyen bir
 * branş/dal yoksa baseline'a (Ayşe) düşer — hiçbir yeni branş kapısı EKLENMEDİ; var olan İKİ roster
 * (`specialistsCatalog.ts`, `klinik_uzmanlar.ts`) tek paylaşılan `bransAsistanPersonasiBul` ile
 * okunuyor — ayrıntılı branş-bazlı kanıt: `lib/asistan/bransAsistanPersonasi.test.ts`.
 *
 * NOTYA-UZ-ASISTAN-PERSONA-DOKTOR-01 (release/uz ONLY): bu dalda Doktor'un 30 branşı artık TR
 * roster'ından ÖNCE Kaan'ın 2026-10-08/09 UZ adlarıyla çözülüyor (countries/uz/klinik/asistanAdlari.ts
 * + lib/asistan/uzDoktorPersonaSesi.ts) — bu yüzden aşağıdaki beklenen isimler TR (Selin/Mehmet/Deniz)
 * DEĞİL, UZ (Sevara/Kamola/Zulfiya) karşılıkları. Klinik rosteri (sac-ekimi → Emre Kaya) ve bilinmeyen
 * branş fallback'i (Ayşe) release/uz'da da DEĞİŞMEDİ — ayrıntılı kanıt: `lib/asistan/bransAsistanPersonasi.test.ts`.
 *
 * BUG B (ses): "Konuş" düğmesi her üç bağlamda da (dermatoloji, kardiyoloji, Klinik dalı) AYNI
 * şekilde render edilir — devre dışı değil, branşa göre kaldırılmıyor. Gerçek kök-neden fix'i
 * (unsupported durumda panelin açılması + onerror'un artık sessiz kalmaması) saf fonksiyon
 * seviyesinde `lib/asistan/sesliGirisYardimci.test.ts`'te kanıtlanmıştır; burası o paylaşılan
 * mekanizmanın panelden GERÇEKTEN çağrıldığını (kaynak metninde) ve düğmenin her bağlamda var
 * olduğunu doğrular.
 *
 * NOTYA-ASISTAN-PERSONA-SES-01 (2026-10-18): aynı sebep ve çözüm — lib/asistan/bransAsistanPersonasi.test.ts'in
 * başındaki not. ES modülleri `import` satırlarını dosyadaki konumdan bağımsız en üste taşıdığı (hoisting) için
 * düz bir `process.env.NOTYA_COUNTRY = 'uz'` satırı importlardan "önce" yazılsa da GERÇEKTE onlardan sonra
 * çalışır ve işe yaramaz; bu yüzden HastaKonsult (ve ona bağlı turkceYonelmeHali) STATİK değil, ortam
 * değişkeni sabitlendikten SONRA ÇALIŞAN bir `before()` içinde dinamik `import()` ile yüklenir
 * (lib/ulke/ulke.uz.test.ts'teki desenin aynısı).
 */
import { before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

let HastaKonsult: (typeof import('../../components/doktor/HastaKonsult'))['default']
let turkceYonelmeHali: typeof import('../colleagueAddress').turkceYonelmeHali

before(async () => {
  process.env.NOTYA_COUNTRY = 'uz'
  ;({ default: HastaKonsult } = await import('../../components/doktor/HastaKonsult'))
  ;({ turkceYonelmeHali } = await import('../colleagueAddress'))
})

const sar = (branş: string | null) =>
  renderToStaticMarkup(
    createElement(HastaKonsult, { patientId: 'p1', doktorBransi: branş, hastaDogumIso: null }),
  )

describe('HastaKonsult — "Ayşe\'ye Danış" paneli: kimlik branşa göre, ses her yerde aynı', () => {
  it('dermatoloji hekimi (release/uz) kendi UZ uzmanını görür — "Sevara\'ya Danış" (hardcoded "Ayşe" DEĞİL, TR "Selin" de DEĞİL)', () => {
    const html = sar('dermatoloji')
    assert.match(html, /Sevara&#x27;ya Danış|Sevara'ya Danış/)
    assert.doesNotMatch(html, /Ayşe&#x27;ye Danış|Ayşe'ye Danış/)
    assert.doesNotMatch(html, /Selin&#x27;e Danış|Selin'e Danış/)
  })

  it('kardiyoloji hekimi (release/uz) "Kamola\'ya Danış" görür', () => {
    const html = sar('kardiyoloji')
    assert.match(html, /Kamola&#x27;ya Danış|Kamola'ya Danış/)
  })

  it('Klinik dalı (sac-ekimi) KENDİ uzmanını görür — "Emre Kaya\'ya Danış" (Doktor rosterinde yok; Klinik\'in kendi rosterinden — klinik_uzmanlar.ts)', () => {
    const html = sar('sac-ekimi')
    assert.match(html, /Emre Kaya&#x27;ya Danış|Emre Kaya'ya Danış/)
    assert.doesNotMatch(html, /Ayşe&#x27;ye Danış|Ayşe'ye Danış/)
  })

  it('branş bilinmiyorsa (null) de baseline "Ayşe\'ye Danış" — pediatri varsayılanı, yeni bir "pediatri" kapısı değil', () => {
    const html = sar(null)
    assert.match(html, /Ayşe&#x27;ye Danış|Ayşe'ye Danış/)
  })

  it('"Konuş" düğmesi dermatoloji, kardiyoloji ve Klinik dalında (sac-ekimi) AYNI şekilde var — branşa göre kaldırılmıyor', () => {
    for (const branş of ['dermatoloji', 'kardiyoloji', 'sac-ekimi', null]) {
      const html = sar(branş)
      assert.match(html, />Konuş</, `branş=${branş} için Konuş düğmesi bulunamadı`)
    }
  })

  it('başlık metni her branşta (release/uz: UZ adıyla) turkceYonelmeHali(personaAdi) + " Danış" kalıbını izler', () => {
    const beklenenler: Array<[string, string]> = [
      ['dermatoloji', 'Sevara'],
      ['kardiyoloji', 'Kamola'],
      ['psikiyatri', 'Zulfiya'],
    ]
    for (const [branş, isim] of beklenenler) {
      const html = sar(branş)
      const beklenenBaslik = `${turkceYonelmeHali(isim)} Danış`
      assert.ok(
        html.includes(beklenenBaslik) || html.includes(beklenenBaslik.replace("'", '&#x27;')),
        `branş=${branş}: "${beklenenBaslik}" bulunamadı`,
      )
    }
  })
})

describe('HastaKonsult kaynağı — paylaşılan ses mekanizması gerçekten çağrılıyor (branş kapısı yok)', () => {
  const kaynak = readFileSync(join(__dirname, '../../components/doktor/HastaKonsult.tsx'), 'utf8')

  it('sesliGirisDesteklenmiyorMu / sesliGirisHataMetni paylaşılan yardımcıları import edilmiş ve kullanılmış', () => {
    assert.match(kaynak, /from '@\/lib\/asistan\/sesliGirisYardimci'/)
    assert.match(kaynak, /sesliGirisDesteklenmiyorMu\(/)
    assert.match(kaynak, /sesliGirisHataMetni\(/)
  })

  it('mikrofon() artık desteklenmeyen tarayıcı durumunda da paneli açıyor (eski kök neden: panel kapalı kalırdı)', () => {
    const mikrofonGovdesi = kaynak.slice(kaynak.indexOf('function mikrofon('), kaynak.indexOf('function mikrofon(') + 900)
    assert.match(mikrofonGovdesi, /sesliGirisDesteklenmiyorMu\(w\)/)
    assert.match(mikrofonGovdesi, /setAcik\(true\)/)
  })

  it('onerror artık dinliyor\'u kapatmakla kalmıyor — hata mesajı da yazıyor (eski kök neden: sessiz kalırdı)', () => {
    const onerrorIdx = kaynak.indexOf('t.onerror = (e)')
    assert.ok(onerrorIdx > -1, 't.onerror handler bulunamadı')
    const govde = kaynak.slice(onerrorIdx, onerrorIdx + 200)
    assert.match(govde, /sesliGirisHataMetni\(e\?\.error\)/)
    assert.match(govde, /setHata\(mesaj\)/)
  })

  it('kimlik başlığı artık hardcoded "Ayşe\'ye Danış" literal\'i DEĞİL — iki rosteri birleştiren paylaşılan lookup\'tan okunuyor', () => {
    assert.doesNotMatch(kaynak, />Ayşe&apos;ye Danış</)
    assert.match(kaynak, /turkceYonelmeHali\(personaAdi\)/)
    assert.match(kaynak, /from '@\/lib\/asistan\/bransAsistanPersonasi'/)
    assert.match(kaynak, /bransAsistanPersonasiBul\(/)
  })

  it('branşa göre çatallanan bir "if (brans === …)" sesli giriş kapısı YOK — tek paylaşılan mekanizma', () => {
    const mikrofonGovdesi = kaynak.slice(kaynak.indexOf('function mikrofon('), kaynak.indexOf('function gonder('))
    assert.doesNotMatch(mikrofonGovdesi, /brans(i)?\s*===|doktorBransi\s*===/i)
  })
})
