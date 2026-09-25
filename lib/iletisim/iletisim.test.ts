/**
 * NOTYA-ILETISIM-01 — pure layer: link builders (encoding, Turkish characters, E.164, length cap), templates
 * (no clinical content, age-based guardian wording, 112 line), consent gating, queue building + de-duplication,
 * staff permissions, and the empty automatic-sender slot.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { epostaAdresi, epostaLinki, LINK_UST_SINIRI, sigacakKadarKisalt, whatsappLinki, whatsappNumarasi } from './baglantilar'
import { ACIL_SATIRI, gunIfadesi, mesajHazirla } from './sablonlar'
import { gonderilebilirMi, kanalDurumu, onerilenKanal } from './izin'
import { IZIN_ALANI, IZIN_EVET, intakeIzinleri } from './izinMetni'
import {
  PERSONEL_TURLERI, bugunGosterilecekler, kuyrukGuncellemesi, randevuAdaylari, tekilAnahtar, trGunAraligi, turIzinliMi, yeniAdaylar,
  type KuyrukAdayi,
} from './kuyruk'
import { hazirOtomatikGonderici, otomatikGondericiler } from './otomatik'
import { tabloYokMu, kuyrugaEkle } from './sunucu'
import { MESAJ_TURLERI } from './tipler'
import { coreBolumlerIcin } from '../intake/coreAlanlar'

process.env.ENCRYPTION_MASTER_KEY ||= 'qa-sentetik-iletisim-anahtari'

const KOK = resolve(__dirname, '../..')
const TR = 'ğüşıöçĞÜŞİÖÇ'

describe('whatsappLinki', () => {
  it('her yaygın TR yazımı aynı E.164 rakamlarına iner', () => {
    for (const t of ['0532 123 45 67', '5321234567', '+90 532 123 45 67', '0090 532 123 4567', '(0532) 123-45-67', '905321234567']) {
      assert.equal(whatsappNumarasi(t), '905321234567', t)
    }
  })
  it('kullanılamayan numara → null (link yok)', () => {
    for (const t of ['', '123', 'abc', '0212', null, undefined]) assert.equal(whatsappLinki(t as string, 'x'), null, String(t))
  })
  it('yurt dışı numarası yalnız açık uluslararası önekle kabul edilir', () => {
    assert.equal(whatsappNumarasi('+49 151 2345 6789'), '4915123456789')
    assert.equal(whatsappNumarasi('0049 151 2345 6789'), '4915123456789')
    assert.equal(whatsappNumarasi('151 2345 6789'), null)
  })
  it('Türkçe karakterler ve satır sonları kodlanır, çözülünce birebir aynı', () => {
    const metin = `Merhaba ${TR}\nYarın saat 10:30 — & ? # % +`
    const link = whatsappLinki('05321234567', metin)!
    assert.ok(link.startsWith('https://wa.me/905321234567?text='))
    const kodlu = link.split('?text=')[1]
    assert.doesNotMatch(kodlu, /[ğüşıöçĞÜŞİÖÇ\s&#?+]/, 'ham karakter kalmamalı')
    assert.equal(decodeURIComponent(kodlu), metin)
  })
  it(`uzun metin ${LINK_UST_SINIRI} karakter sınırına sığdırılır`, () => {
    const link = whatsappLinki('05321234567', 'ş'.repeat(3000))!
    assert.ok(link.length <= LINK_UST_SINIRI, String(link.length))
    assert.ok(decodeURIComponent(link.split('?text=')[1]).endsWith('…'))
  })
})

describe('epostaLinki', () => {
  const konu = `Randevu hatırlatması · Dr. Işıl Öztürk`
  const govde = `Merhaba Ayşe,\nYarın saat 10:30 için randevunuz var.\n${TR}`
  it('mailto: adres okunur, konu ve gövde kodlu, satır sonu CRLF', () => {
    const l = epostaLinki('hasta@ornek.com', konu, govde, 'uygulama')!
    assert.ok(l.startsWith('mailto:hasta@ornek.com?subject='))
    const q = new URLSearchParams(l.split('?')[1])
    assert.equal(q.get('subject'), konu)
    assert.equal(q.get('body'), govde.replace(/\n/g, '\r\n'))
  })
  it('Gmail web: view=cm&fs=1&to&su&body', () => {
    const l = epostaLinki('hasta@ornek.com', konu, govde, 'gmail')!
    const u = new URL(l)
    assert.equal(u.origin + u.pathname, 'https://mail.google.com/mail/')
    assert.equal(u.searchParams.get('view'), 'cm')
    assert.equal(u.searchParams.get('fs'), '1')
    assert.equal(u.searchParams.get('to'), 'hasta@ornek.com')
    assert.equal(u.searchParams.get('su'), konu)
    assert.equal(u.searchParams.get('body'), govde)
  })
  it('Outlook web: deeplink/compose?to&subject&body', () => {
    const u = new URL(epostaLinki('hasta@ornek.com', konu, govde, 'outlook')!)
    assert.equal(u.origin + u.pathname, 'https://outlook.office.com/mail/deeplink/compose')
    assert.equal(u.searchParams.get('to'), 'hasta@ornek.com')
    assert.equal(u.searchParams.get('subject'), konu)
    assert.equal(u.searchParams.get('body'), govde)
  })
  it('geçersiz adres → null', () => {
    for (const a of ['', 'hasta', 'hasta@', '@ornek.com', 'a b@c.com', 'x@y']) assert.equal(epostaLinki(a, 'k', 'g'), null, a)
    assert.equal(epostaAdresi(' hasta@ornek.com '), 'hasta@ornek.com')
  })
  it('uzun gövde sınıra sığar; Sağlığım bağlantısı olan satır korunur', () => {
    const link = 'https://www.notya.io/portal/hasta/abc123/mesajlar'
    const uzun = ['Merhaba,', 'ş'.repeat(400), link, ...Array.from({ length: 30 }, (_, i) => `Açıklama satırı ${i} ${TR}`)].join('\n')
    for (const a of ['uygulama', 'gmail', 'outlook'] as const) {
      const l = epostaLinki('hasta@ornek.com', 'Konu', uzun, a)!
      assert.ok(l.length <= LINK_UST_SINIRI, `${a}: ${l.length}`)
      assert.ok(decodeURIComponent(l).includes(link), `${a}: bağlantı düştü`)
    }
  })
  it('sigacakKadarKisalt: sığan metne dokunmaz', () => {
    assert.equal(sigacakKadarKisalt('kısa', 100, (m) => m.length), 'kısa')
  })
})

describe('şablonlar', () => {
  const BUGUN = '2026-09-25'
  const yarin1030 = '2026-09-26T07:30:00.000Z' // 10:30 TRT
  const temel = { hastaAdi: 'Ayşe Yılmaz', doktorAdi: 'Dr. Gökhan Mamur', randevuIso: yarin1030, bugunIso: BUGUN, link: 'https://www.notya.io/intake/abc', tarihIso: '2026-10-01', metin: 'Serbest metin' }

  it('gün ifadesi TRT gününe göre: bugün / yarın / tarih', () => {
    assert.equal(gunIfadesi('2026-09-25T20:00:00.000Z', BUGUN), 'bugün') // 23:00 TRT, still 25 Eylül
    assert.equal(gunIfadesi('2026-09-25T06:00:00.000Z', BUGUN), 'bugün')
    assert.equal(gunIfadesi('2026-09-25T22:30:00.000Z', BUGUN), 'yarın') // 01:30 TRT 26 Eylül
    assert.equal(gunIfadesi(yarin1030, BUGUN), 'yarın')
    assert.match(gunIfadesi('2026-09-29T07:30:00.000Z', BUGUN), /29 Eylül Salı/)
  })

  it('randevu hatırlatma: ad, gün, saat, doktor; doğru Türkçe', () => {
    const m = mesajHazirla('randevu_hatirlatma', temel)!
    assert.equal(m.metin.split('\n')[0], 'Merhaba Ayşe Yılmaz, yarın saat 10:30 için Dr. Gökhan Mamur ile randevunuz var. Gelemeyecekseniz lütfen bize haber verin, size yeni bir saat ayarlayalım.')
    assert.match(m.konu, /^Randevu hatırlatması · Dr\. Gökhan Mamur$/)
    assert.ok(m.metin.trimEnd().endsWith('Dr. Gökhan Mamur'), 'imza')
  })

  it('her tür üretilir; gerekli parça yoksa null (uydurma yok)', () => {
    for (const tur of MESAJ_TURLERI) assert.ok(mesajHazirla(tur, temel), tur)
    assert.equal(mesajHazirla('randevu_hatirlatma', { ...temel, randevuIso: null }), null)
    assert.equal(mesajHazirla('randevu_degisikligi', { ...temel, randevuIso: 'bozuk' }), null)
    assert.equal(mesajHazirla('bilgi_formu', { ...temel, link: null }), null)
    assert.equal(mesajHazirla('saglikim_baglanti', { ...temel, link: '' }), null)
    assert.equal(mesajHazirla('asi_hatirlatma', { ...temel, tarihIso: null }), null)
    assert.equal(mesajHazirla('serbest', { ...temel, metin: '  ' }), null)
    assert.ok(mesajHazirla('randevu_iptali', { ...temel, randevuIso: null }), 'iptal saatsiz de söylenebilir')
  })

  it('klinik bilgi yok: hiçbir şablon tanı / ilaç / tahlil / aşı adı taşımaz', () => {
    for (const tur of MESAJ_TURLERI.filter((t) => t !== 'serbest')) {
      for (const veliDili of [false, true]) {
        const m = mesajHazirla(tur, { ...temel, veliDili })!
        assert.doesNotMatch(`${m.konu}\n${m.metin}`, /tanı|teşhis|ilaç|reçete|tahlil sonucu|mg\b|doz\b|KKK|BCG|hepatit/i, `${tur}/${veliDili}`)
      }
    }
  })

  it('veli dili yaşa göre: erişkin "veli/çocuğunuz" görmez; reşit olmayan için ad + "adına"', () => {
    for (const tur of MESAJ_TURLERI.filter((t) => t !== 'serbest')) {
      assert.doesNotMatch(mesajHazirla(tur, { ...temel, veliDili: false })!.metin, /veli|çocuğunuz/i, tur)
    }
    const c = mesajHazirla('randevu_hatirlatma', { ...temel, hastaAdi: 'Ali', veliDili: true })!
    assert.match(c.metin, /^Merhaba, yarın saat 10:30 için Ali adına randevunuz var\./)
    assert.match(mesajHazirla('asi_hatirlatma', { ...temel, veliDili: true })!.metin, /Çocuğunuzun kayıtlı bir sonraki aşı tarihi/)
    assert.match(mesajHazirla('randevu_hatirlatma', { ...temel, hastaAdi: '', veliDili: true })!.metin, /çocuğunuz adına randevunuz/)
  })

  it('Sağlığım ve aşı mesajları portalın 112 satırını taşır; randevu mesajları taşımaz', () => {
    for (const tur of ['saglikim_yeni_mesaj', 'saglikim_baglanti'] as const) assert.ok(mesajHazirla(tur, temel)!.metin.includes(ACIL_SATIRI), tur)
    assert.match(mesajHazirla('asi_hatirlatma', temel)!.metin, /112/)
    assert.doesNotMatch(mesajHazirla('randevu_hatirlatma', temel)!.metin, /112/)
  })

  it('Sağlığım yeni mesaj: bağlantı varsa metinde; yoksa uydurulmaz', () => {
    assert.ok(mesajHazirla('saglikim_yeni_mesaj', { ...temel, link: 'https://www.notya.io/portal/hasta/x/mesajlar' })!.metin.includes('https://www.notya.io/portal/hasta/x/mesajlar'))
    assert.doesNotMatch(mesajHazirla('saglikim_yeni_mesaj', { ...temel, link: null })!.metin, /https?:/)
  })

  it('bilgi formu metni eski Twilio metnini korur', () => {
    const m = mesajHazirla('bilgi_formu', temel)!.metin
    assert.match(m, /randevunuzdan önce doldurmanızı rica ettiğimiz Hasta Bilgi Formu hazır:/)
    assert.match(m, /Bu kısa formu doldurmanız muayene süresini sizin için daha verimli kılacak\. Teşekkürler\./)
  })
})

describe('iletişim izni', () => {
  const h = { telefon: '05321234567', eposta: 'a@b.com' }
  it('yalnız açık "true" kanalı açar; bilinmiyor (null) = izin yok', () => {
    assert.equal(kanalDurumu({ ...h, izinWhatsapp: true }, 'whatsapp'), 'hazir')
    assert.equal(kanalDurumu({ ...h, izinWhatsapp: null }, 'whatsapp'), 'izin_yok')
    assert.equal(kanalDurumu({ ...h, izinWhatsapp: false }, 'whatsapp'), 'izin_yok')
    assert.equal(kanalDurumu({ ...h }, 'eposta'), 'izin_yok')
    assert.equal(kanalDurumu({ telefon: '', izinWhatsapp: true }, 'whatsapp'), 'adres_yok')
    assert.equal(kanalDurumu({ eposta: 'bozuk', izinEposta: true }, 'eposta'), 'adres_yok')
    assert.equal(gonderilebilirMi({ ...h, izinEposta: true }, 'eposta'), true)
  })
  it('önerilen kanal: son kullanılan hâlâ hazırsa o; yoksa WhatsApp, sonra e-posta; hiçbiri yoksa null', () => {
    const ikisi = { ...h, izinWhatsapp: true, izinEposta: true }
    assert.equal(onerilenKanal(ikisi, 'eposta'), 'eposta')
    assert.equal(onerilenKanal(ikisi, null), 'whatsapp')
    assert.equal(onerilenKanal({ ...h, izinWhatsapp: false, izinEposta: true }, 'whatsapp'), 'eposta')
    assert.equal(onerilenKanal({ ...h }, 'whatsapp'), null)
  })
  it('bilgi formu: kanal başına tek satır, isteğe bağlı; işaretsiz = izin yok', () => {
    const onay = coreBolumlerIcin('kardiyoloji').find((b) => b.baslik === 'Onay')!
    for (const id of [IZIN_ALANI.whatsapp, IZIN_ALANI.eposta]) {
      const a = onay.alanlar.find((x) => x.id === id)
      assert.ok(a, id)
      assert.ok(!a!.zorunlu, `${id} zorunlu olmamalı`)
      assert.deepEqual(a!.secenekler, [IZIN_EVET])
    }
    assert.deepEqual(intakeIzinleri({ [IZIN_ALANI.whatsapp]: IZIN_EVET }), { whatsapp: true, eposta: false })
    assert.deepEqual(intakeIzinleri({}), { whatsapp: false, eposta: false })
  })
})

describe('Hazır mesajlar kuyruğu', () => {
  const aday = (k: string, d = 'D1'): KuyrukAdayi => ({ doctor_id: d, patient_id: 'P', tur: 'randevu_hatirlatma', planlanan_gun: '2026-09-25', tekil_anahtar: k })
  it('mükerrer yok: DB\'de olan ve aynı partide tekrar eden anahtar düşer', () => {
    const y = yeniAdaylar([aday('a'), aday('b'), aday('a'), aday('c')], ['b'])
    assert.deepEqual(y.map((x) => x.tekil_anahtar), ['a', 'c'])
    // same key under another doctor is a different item
    assert.equal(yeniAdaylar([aday('a', 'D1'), aday('a', 'D2')], []).length, 2)
  })
  it('randevu adayları: yalnız YARIN (TRT), aktif ve hasta kayıtlı; anahtar randevu + saat', () => {
    const r = (id: string, baslangic: string, durum = 'planlandi', patient_id: string | null = 'P1') => ({ id, doktor_id: 'D1', patient_id, baslangic, durum })
    const a = randevuAdaylari([
      r('yarin-sabah', '2026-09-25T21:30:00.000Z'), // 00:30 TRT 26 Eylül → yarın
      r('yarin-aksam', '2026-09-26T20:59:00.000Z'), // 23:59 TRT 26 Eylül → yarın
      r('bugun-gece', '2026-09-25T20:59:00.000Z'), // 23:59 TRT 25 Eylül → bugün
      r('ertesi', '2026-09-26T21:00:00.000Z'), // 00:00 TRT 27 Eylül
      r('iptal', '2026-09-26T07:00:00.000Z', 'iptal'),
      r('onayli', '2026-09-26T08:00:00.000Z', 'onaylandi'),
      r('serbest', '2026-09-26T09:00:00.000Z', 'planlandi', null),
    ], '2026-09-25')
    assert.deepEqual(a.map((x) => x.randevu_id).sort(), ['onayli', 'yarin-aksam', 'yarin-sabah'])
    assert.equal(a.find((x) => x.randevu_id === 'yarin-sabah')!.tekil_anahtar, tekilAnahtar.randevu('yarin-sabah', '2026-09-25T21:30:00.000Z'))
    assert.deepEqual(trGunAraligi('2026-09-26'), { bas: '2026-09-25T21:00:00.000Z', son: '2026-09-26T21:00:00.000Z' })
  })
  it('bugün gösterilecekler: bekleyen + bugüne kadar; "Sonra" en sona; sekreter yalnız randevu türleri', () => {
    const s = [
      { id: '1', tur: 'saglikim_yeni_mesaj' as const, durum: 'bekliyor' as const, planlanan_gun: '2026-09-25', created_at: '1' },
      { id: '2', tur: 'randevu_hatirlatma' as const, durum: 'bekliyor' as const, planlanan_gun: '2026-09-25', created_at: '2', ertelendi_at: '2026-09-25T08:00:00Z' },
      { id: '3', tur: 'randevu_hatirlatma' as const, durum: 'bekliyor' as const, planlanan_gun: '2026-09-24', created_at: '3' },
      { id: '4', tur: 'asi_hatirlatma' as const, durum: 'bekliyor' as const, planlanan_gun: '2026-09-26', created_at: '4' },
      { id: '5', tur: 'randevu_hatirlatma' as const, durum: 'gonderildi' as const, planlanan_gun: '2026-09-25', created_at: '5' },
      { id: '6', tur: 'asi_hatirlatma' as const, durum: 'bekliyor' as const, planlanan_gun: '2026-09-25', created_at: '6' },
    ]
    assert.deepEqual(bugunGosterilecekler(s, 'doktor', '2026-09-25').map((x) => x.id), ['1', '3', '6', '2'])
    assert.deepEqual(bugunGosterilecekler(s, 'sekreter', '2026-09-25').map((x) => x.id), ['3', '2'])
  })
  it('işlem güncellemesi: gönderildi / atlandı / sonra (bekler, ertelenir) + işleyen kişi', () => {
    const kim = { userId: 'U', personelId: 'P' }
    assert.equal(kuyrukGuncellemesi('gonderildi', 'T', kim).durum, 'gonderildi')
    assert.equal(kuyrukGuncellemesi('atla', 'T', kim).durum, 'atlandi')
    const sonra = kuyrukGuncellemesi('sonra', 'T', kim)
    assert.equal(sonra.durum, undefined)
    assert.equal(sonra.ertelendi_at, 'T')
    assert.equal(sonra.isleyen_personel_id, 'P')
  })
})

describe('personel (sekreter) yetkisi', () => {
  it('doktor her türü; sekreter yalnız randevu ve randevu hazırlığı türlerini', () => {
    for (const t of MESAJ_TURLERI) assert.equal(turIzinliMi('doktor', t), true, t)
    const sekreter = MESAJ_TURLERI.filter((t) => turIzinliMi('sekreter', t))
    assert.deepEqual(sekreter.sort(), [...PERSONEL_TURLERI].sort())
    for (const t of ['saglikim_yeni_mesaj', 'saglikim_baglanti', 'asi_hatirlatma', 'kontrol_hatirlatma', 'serbest'] as const) {
      assert.equal(turIzinliMi('sekreter', t), false, t)
    }
  })
  it('migration 095 personel politikası aynı tür listesini kullanır', () => {
    const sql = readFileSync(join(KOK, 'lib/db/migrations/095_iletisim.sql'), 'utf8')
    const liste = PERSONEL_TURLERI.map((t) => `'${t}'`).join(', ')
    assert.ok(sql.includes(`tur in (${liste})`), 'personel politikasındaki tür listesi PERSONEL_TURLERI ile aynı olmalı')
  })
})

describe('otomatik gönderim yuvası (iş B ve C, NOTYA-ILETISIM-04)', () => {
  it('WhatsApp ve e-posta kayıtlı (WhatsApp önce); ortam yokken hazır gönderici null → tek dokunuş', async () => {
    for (const k of ['META_APP_ID', 'META_APP_SECRET', 'META_ES_CONFIG_ID', 'GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_OAUTH_CLIENT_SECRET', 'MS_OAUTH_CLIENT_ID', 'MS_OAUTH_CLIENT_SECRET']) delete process.env[k]
    assert.deepEqual(otomatikGondericiler().map((g) => [g.kanal, g.saglayici]), [['whatsapp', 'whatsapp_business'], ['eposta', 'eposta']])
    assert.equal(await hazirOtomatikGonderici('D1', 'whatsapp'), null)
    assert.equal(await hazirOtomatikGonderici('D1', 'eposta'), null)
  })
})

describe('tablo yokken yumuşak düşüş (migration 095 uygulanmadan)', () => {
  it('tabloYokMu Postgres / PostgREST kodlarını tanır', () => {
    for (const e of [{ code: '42P01' }, { code: 'PGRST205' }, { code: '42703' }, { code: 'PGRST204' }, { message: 'relation "iletisim_kuyrugu" does not exist' }]) assert.equal(tabloYokMu(e), true, JSON.stringify(e))
    assert.equal(tabloYokMu({ code: '23505' }), false)
    assert.equal(tabloYokMu(null), false)
  })
  it('kuyrugaEkle tablo yokken 0 döner, fırlatmaz', async () => {
    const hata = { data: null, error: { code: '42P01', message: 'relation does not exist' } }
    const zincir: any = new Proxy({}, { get: (_t, k) => (k === 'then' ? (r: (v: unknown) => void) => r(hata) : () => zincir) })
    const sb = { from: () => zincir } as never
    assert.equal(await kuyrugaEkle(sb, [{ doctor_id: 'D', patient_id: 'P', tur: 'randevu_hatirlatma', planlanan_gun: '2026-09-25', tekil_anahtar: 'k' }]), 0)
  })
})

describe('kaynak kilitleri', () => {
  const oku = (p: string) => readFileSync(join(KOK, p), 'utf8')
  it('hastaya Twilio / Resend / Meta gönderimi kalmadı; iç alarm Twilio\'su duruyor', () => {
    for (const f of ['app/api/cron/randevu-hatirlatma/route.ts', 'app/api/doktor/intake-formlari/route.ts', 'lib/portal/notifyPatientEmail.ts']) {
      assert.doesNotMatch(oku(f), /sendTwilioMessage|sendResendEmail|graph\.facebook\.com/, f)
    }
    assert.match(oku('lib/alarm.ts'), /sendTwilioMessage/)
    assert.match(oku('lib/portal/notifyPractice.ts'), /sendTwilioMessage/)
  })
  it('randevu cron\'u günlük çalışır ve asilar tablosuna dokunmaz', () => {
    const v = JSON.parse(oku('vercel.json')) as { crons: Array<{ path: string; schedule: string }> }
    const c = v.crons.find((x) => x.path === '/api/cron/randevu-hatirlatma')!
    assert.equal(c.schedule, '0 4,14 * * *')
    assert.doesNotMatch(oku('app/api/cron/randevu-hatirlatma/route.ts'), /asilar/)
  })
  it('otomatik gönderim satırları yalnız OtomatikSlotlari\'ndan; UI\'da jargon yok', () => {
    assert.match(oku('components/doktor/iletisim/IletisimAyarKarti.tsx'), /<OtomatikSlotlari \/>/)
    for (const f of ['GonderDugmesi', 'HazirMesajlar', 'IletisimAyarKarti', 'OtomatikSlotlari', 'EpostaBaglan', 'WhatsAppBaglan', 'RandevuMesaji', 'HastaIletisim']) {
      const kod = oku(`components/doktor/iletisim/${f}.tsx`).split('\n').filter((l) => !/^\s*(\*|\/\/|\/\*\*|\{\/\*|import\s)/.test(l)).join('\n')
      const metinler = [...kod.matchAll(/>([^<>{}]*[A-Za-zÇĞİÖŞÜçğıöşü][^<>{}]*)</g), ...kod.matchAll(/'([^'\n]*\s[^'\n]*)'/g)].map((m) => m[1])
      for (const m of metinler) assert.doesNotMatch(m, /deep ?link|\bAPI\b|OAuth|token/i, `${f}: "${m}"`)
    }
  })
})
