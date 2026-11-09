/**
 * TR-PARITE-01 (Kaan, 2026-11-09, "item 3") — HEKİMİN KENDİ BRANŞI İÇİN HASTA PORTALI ÖNİZLEMESİ, ÖRNEK VERİYLE.
 *
 * Ülke yapılarında her rolün "hasta sayfasını önizle" görünümü var (release/* lib/ulke/portal/demo.ts). Türkiye'de
 * yalnız Pediatri (/portal/demo), Göz (/portal/demo-goz) ve KBB (/portal/demo-kbb) vardı. Bu modül 40 branşın her biri
 * için o branşın hastasının göreceği Sağlığım paketini ÖRNEK VERİYLE kurar; sayfa (/portal/onizleme) canlı portalın
 * AYNI görünümlerini çizer (tek görünüm).
 *
 * KURALLAR
 *  - Branş YALNIZ hekimin kendi `users.specialty` değerinden çözülür; URL'den branş alınmaz — bir hekim başka branşın
 *    önizlemesini açamaz (brans-alan-sizmasi). Bilinmeyen / boş branş → önizleme yok (pediatri değil).
 *  - Modüller canlı portalla aynı çözücüden gelir (lib/portal/moduller.ts portalModulleri); başka branşın modülü eklenmez.
 *  - Görev kodlu 25 branşın dilimleri canlı API'nin kendi bloklarından üretilmiştir (./onizlemeDilimleri.ts): aynı
 *    motor, aynı hasta-güvenli başlıklar. Göz, mevcut Göz demosunun (./demoData.ts) dilimini; Pediatri canlı rotanın
 *    büyüme hesabını (Neyzi persentil eğrileri) örnek ölçümlerle kullanır. Mevcut /portal/demo* sayfaları değişmedi.
 *  - Hasta yok, istek yok, yazma yok: ad "Örnek Hasta", tarihler bugüne göre örnektir. Tanı, doz, skor yoktur.
 *  - Çocuk hastası yalnız çocuk branşlarında (pediatri, çocuk cerrahisi); diğer 38 branşın örnek hastası yetişkindir
 *    (veli dili yalnız 18 yaş altında — VELI-YASAL-ONAM).
 */
import type { PortalBundle } from './types'
import type { PortalModulId } from '@/lib/specialties/profile'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import { emptyPortalBundle } from './emptyBundle'
import { portalBransAnahtari, portalModulleri } from './moduller'
import { SAGLIGIM_DEMO_GOZ } from './demoData'
import { persentilEgrileri } from '@/lib/clinical/buyumeEgrisi'
import { onizlemeGorevDilimleri, type OrnekGorev } from './onizlemeDilimleri'
import { SPECIALTY_MAP } from '@/lib/doktor/specialties'
import { KLINIK_ETIKET, klinikSlugCoz, type KlinikYeniSlug } from '@/lib/specialties/klinikDikey'
import { KLINIK_PORTAL_IPUCU, KLINIK_PORTAL_MODUL } from '@/lib/klinik/klinikPortal'
import { derimHatirlatmalari, sonrakiKontrol as derimSonrakiKontrol } from '@/specialties/dermatoloji/engines/portal-derim'
import { hedefOzetleri, sonrakiKontrol as dahiliyeSonrakiKontrol, takibimHatirlatmalari } from '@/specialties/dahiliye/engines/portal-takibim'
import { gebelikYasi, izlemDurumlari } from '@/lib/clinical/gebelik'
import { dueHesapla } from '@/specialties/kadin-dogum/engines/jinekoloji-spine'

export type OnizlemeBransi = { tur: 'tus'; anahtar: SpecialtyKey; etiket: string } | { tur: 'klinik'; anahtar: KlinikYeniSlug; etiket: string }

const COCUK_BRANSLARI: ReadonlySet<string> = new Set(['pediatri', 'cocuk-cerrahisi'])

/** Hekimin uzmanlık değeri → önizleme branşı, ya da null. */
export function onizlemeBransi(ham: string | null | undefined): OnizlemeBransi | null {
  const klinik = klinikSlugCoz(ham)
  if (klinik) return { tur: 'klinik', anahtar: klinik, etiket: KLINIK_ETIKET[klinik] }
  const k = portalBransAnahtari(ham)
  if (k && SPECIALTY_MAP[k]) return { tur: 'tus', anahtar: k, etiket: SPECIALTY_MAP[k].label }
  return null
}

const gunEkle = (iso: string, gun: number): string => new Date(Date.parse(iso + 'T12:00:00Z') + gun * 86400000).toISOString().slice(0, 10)
const tarihYaz = (iso: string): string => new Date(iso + 'T12:00:00Z').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' })

/**
 * Görev kodlu modüllerin örnek görevleri — her biri o branşın motorunda AYRI, hasta-güvenli bir başlığa düşer
 * (lib/portal/onizleme.test.ts doğrular). Kod yalnız motorun başlık tablosuna anahtardır; ekranda kod görünmez.
 */
export const ORNEK_GOREV_KODLARI: Readonly<Record<string, readonly string[]>> = {
  'psikiyatri': ['seans', 'olcek'],
  'kulaklarim': ['rapor', 'pansuman', 'isitme'],
  'kalbim': ['lab_izlem', 'ekg', 'tansiyon'],
  'norolojim': ['lab', 'goruntu', 'rapor'],
  'hormonlarim': ['lab', 'rapor', 'dxa'],
  'romatizmam': ['lab', 'rapor', 'das28'],
  'enfeksiyon-takibim': ['lab', 'rapor', 'asi'],
  'sindirimim': ['lab', 'rapor', 'biyolojik'],
  'bobreklerim': ['lab', 'rapor', 'seans'],
  'tedavim': ['lab', 'goruntu', 'sgk'],
  'gogus-cerrahisi-takibim': ['goruntu', 'yara', 'preop'],
  'damar-cerrahisi-takibi': ['goruntu', 'yara', 'preop'],
  'ameliyatim': ['goruntu', 'rapor', 'dikis'],
  'yaram': ['belge', 'pansuman', 'dikis'],
  'beyin-takibi': ['goruntu', 'pansuman', 'bilinc'],
  'tetkiklerim': ['tetkik', 'goruntu', 'rapor'],
  'anestezi-oncesi': ['ilac_izlem', 'preop', 'hava_yolu'],
  'cocugumun-cerrahisi': ['goruntu', 'rapor', 'pansuman'],
  'acil-sonrasi': ['kontrol', 'sevk'],
  'akcigerlerim': ['rapor', 'sft', 'inhaler'],
  'urolojim': ['lab', 'rapor', 'ipss'],
  'sporum': ['rapor', 'rtp', 'sakatlik'],
  'eklemlerim': ['goruntu', 'rapor', 'dikis'],
  'ftrm': ['rapor', 'seans', 'egzersiz'],
  'saglik-paketim': ['rapor', 'asi', 'kronik'],
}

function ornekGorevler(bugun: string): Partial<Record<string, readonly OrnekGorev[]>> {
  const out: Record<string, OrnekGorev[]> = {}
  for (const [modul, kodlar] of Object.entries(ORNEK_GOREV_KODLARI)) out[modul] = kodlar.map((kod, i) => ({ kod, due: gunEkle(bugun, [-3, 6, 14, 35][i] ?? 45) }))
  return out
}

/** Her branşta aynı, branş içeriği taşımayan örnek çekirdek (ziyaret, mesaj, özet). */
function ornekCekirdek(b: OnizlemeBransi, bugun: string): PortalBundle {
  const paket = emptyPortalBundle()
  const ziyaret = `${gunEkle(bugun, -14)}T09:30:00.000Z`
  const kontrol = gunEkle(bugun, 21)
  const hekim = 'Dr. Örnek Hekim'
  paket.hasta = { adSoyad: 'Örnek Hasta' }
  paket.hekim = { ...paket.hekim, ad: hekim, brans: b.etiket, klinik: 'Örnek Muayenehane' }
  paket.summary = { ...paket.summary, bekleyenMesaj: 1, yaklasanKontrol: tarihYaz(kontrol), sonAktivite: [
    { id: 'o1', tur: 'mesaj', baslik: 'Yeni mesaj: Kontrol randevunuz', tarih: `${gunEkle(bugun, -2)}T08:00:00.000Z`, href: 'mesajlar' },
    { id: 'o2', tur: 'ziyaret', baslik: `${b.etiket} ziyareti`, tarih: ziyaret, href: 'ziyaretler' },
  ] }
  paket.visits = [{
    id: 'ov1', tarih: ziyaret, brans: b.etiket, basvuruNedeni: 'Kontrol muayenesi', hekim,
    ozetKisa: 'Muayene yapıldı; plan doktorunuzla konuşuldu.', objektif: 'Muayene bulguları dosyanızdadır.',
    plan: `Planlanan tarihte kontrol (${tarihYaz(kontrol)}).`, takip: tarihYaz(kontrol),
  }] as PortalBundle['visits']
  paket.messages = [{
    id: 'om1', klasor: 'gelen', konu: 'Kontrol randevunuz', gonderen: 'Notya Klinik Asistanı',
    ozet: `Kontrol randevunuz ${tarihYaz(kontrol)} tarihinde.`, tarih: `${gunEkle(bugun, -2)}T08:00:00.000Z`, okundu: false,
    mesajlar: [{ id: 'om1a', kimden: 'Notya Klinik Asistanı', taraf: 'klinik', tarih: `${gunEkle(bugun, -2)}T08:00:00.000Z`, metin: `Kontrol randevunuz ${tarihYaz(kontrol)} tarihindedir. Değiştirmek isterseniz bize yazabilirsiniz.` }],
  }] as PortalBundle['messages']
  return paket
}

/** Görev kodu olmayan, motorla kurulan tıp branşı dilimleri (KD, dermatoloji, dahiliye). */
function elleKurulanDilimler(paket: PortalBundle, aktif: ReadonlySet<PortalModulId>, bugun: string): void {
  if (aktif.has('gebelik')) {
    const sat = gunEkle(bugun, -22 * 7)
    const y = gebelikYasi(sat, null, new Date(bugun + 'T12:00:00Z'))
    if (y) {
      const takvim = izlemDurumlari(y.hafta, [8, 12, 18])
      const z = takvim.find((t) => t.durum === 'zamani' || t.durum === 'gecikmis')
      paket.gebelik = { hafta: y.hafta, gun: y.gun, trimester: y.trimester, metin: y.metin, toplamGun: y.toplamGun, tdt: gunEkle(sat, 280),
        takvim: takvim.map((t) => ({ no: t.no, etiket: t.etiket, haftaBas: t.haftaBas, haftaSon: t.haftaSon, durum: t.durum, maddeler: t.maddeler })),
        sonIzlem: { tarih: gunEkle(bugun, -28), hafta: y.hafta - 4, kilo: null, fetalKalpAtimi: null },
        buHafta: ['18-22. hafta: ayrıntılı ultrason dönemi.', ...(z ? [`${z.etiket} (${z.haftaBas}-${z.haftaSon}. hafta) için randevunuzu planlayın.`] : [])] }
    }
  }
  if (aktif.has('jinekoloji')) {
    const due = dueHesapla({ dob: gunEkle(bugun, -34 * 365), bugun, sonPap: null, sonHpv: gunEkle(bugun, -58 * 30), sonMamografi: null, sonDxa: null, sonGgk: null, hrt: false, hrtBaslangic: null, riaTakildi: null, riaTipi: null, histerektomi: false, gebe: !!paket.gebelik })
    const hat = due.filter((d) => d.kod === 'pap' || d.kod === 'hpv' || d.kod === 'ria' || d.kod === 'mamografi').map((d) => ({ ad: d.ad, due: d.due, durum: d.durum === 'gecikti' || d.durum === 'yaklasiyor' ? d.durum : 'planli' as const }))
    paket.jinekoloji = { hatirlatmalar: hat, riaIpKontrol: null, not: 'Bu hatırlatmalar bilgilendirme amaçlıdır; sonuç ve plan doktorunuzdadır.' }
  }
  if (aktif.has('dermatoloji')) {
    const h = derimHatirlatmalari({ bugun, gorevler: [{ kod: 'kontrol', due: gunEkle(bugun, 21) }], ilacGuvenlik: [], yamaKurslari: [], sonFototerapiSeansi: null, fototerapiAralikGun: null, sonTbse: gunEkle(bugun, -150), sonrakiFoto: gunEkle(bugun, 30) })
    paket.deri = { sonrakiKontrol: derimSonrakiKontrol(h), hatirlatmalar: h.map((x) => ({ ad: x.ad, due: x.due, durum: x.durum })), fotograflar: [{ id: 'of1', tarih: `${gunEkle(bugun, -14)}T09:40:00.000Z`, tur: 'Dermoskopi fotoğrafı' }], islemler: [], fototerapi: [], labHatirlatma: [], not: 'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Tanı dili kullanılmaz.' }
  }
  if (aktif.has('dahiliye')) {
    const h = takibimHatirlatmalari({ bugun, gorevler: [{ kod: 'lab_hba1c', due: gunEkle(bugun, 10) }, { kod: 'kb_ev_olcum', due: gunEkle(bugun, 3) }], hedefler: [], evKbOzet: null, evGlukozOzet: null, sonrakiKontrolIso: gunEkle(bugun, 21) })
    paket.kronik = { sonrakiKontrol: dahiliyeSonrakiKontrol(h), hatirlatmalar: h.map((x) => ({ ad: x.ad, due: x.due, durum: x.durum })), hedefler: hedefOzetleri([{ kod: 'kilo', metin: 'Yaşam tarzı hedefi' }]), evKbOzet: null, evGlukozOzet: null, not: 'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Acil durumda 112.' }
  }
}

/** Pediatri: canlı rotanın büyüme hesabı (Neyzi eğrileri) — 6 yaşında örnek kız çocuğu, üç örnek ölçüm. */
function buyumeOrnegi(bugun: string): PortalBundle['buyume'] {
  const mevcutYasAy = 72
  const noktalar = [[48, 102, 16.2], [60, 108.5, 18.1], [72, 114.8, 20.3]].map(([ay, boy, kilo]) => ({ ay, boy, kilo, tarih: gunEkle(bugun, -(mevcutYasAy - ay) * 30) }))
  const ust = mevcutYasAy + 6
  return {
    dogumBilinmiyor: false, mevcutYasAy, cinsiyet: 'female',
    parametreler: {
      kilo: { birim: 'kg', egriler: persentilEgrileri('kilo', 'female', ust), noktalar: noktalar.map((n) => ({ ay: n.ay, deger: n.kilo, tarih: n.tarih })) },
      boy: { birim: 'cm', egriler: persentilEgrileri('boy', 'female', ust), noktalar: noktalar.map((n) => ({ ay: n.ay, deger: n.boy, tarih: n.tarih })) },
      basCevresi: { birim: 'cm', egriler: persentilEgrileri('basCevresi', 'female', ust), noktalar: [] },
      vki: { birim: 'kg/m²', egriler: persentilEgrileri('vki', 'female', ust).map((x) => ({ ...x, noktalar: x.noktalar.filter((n) => n.ay >= 24) })), noktalar: noktalar.map((n) => ({ ay: n.ay, deger: Math.round((n.kilo / Math.pow(n.boy / 100, 2)) * 100) / 100, tarih: n.tarih })) },
    },
  }
}

/** Özel Branş planı: dalın tek ek modülünün örnek tarih satırları (canlıda ozel_brans_plan.portal_satir). */
function ozelPlanOrnegi(slug: KlinikYeniSlug): PortalBundle['ozelPlan'] {
  const ipucu = KLINIK_PORTAL_IPUCU[KLINIK_PORTAL_MODUL[slug]]
  return { satirlar: [{ ad: `${ipucu} — örnek`, durum: 'yaklasiyor' }, { ad: 'Kontrol randevusu', durum: 'planli' }], acil: null }
}

/**
 * Hekimin kendi branşı için örnek Sağlığım paketi, ya da null (branş çözülemedi). Saf (bugün dışarıdan, YYYY-AA-GG).
 * `ornek: true` işareti sayfada "Örnek veri" şeridini zorunlu kılar.
 */
export function onizlemePaketi(hamUzmanlik: string | null | undefined, bugun: string): (PortalBundle & { ornek: true; brans: OnizlemeBransi }) | null {
  const b = onizlemeBransi(hamUzmanlik)
  if (!b) return null
  const cocuk = COCUK_BRANSLARI.has(b.anahtar)
  const sonuc = portalModulleri({ doktorBransi: b.anahtar, hastaYasYil: cocuk ? 6 : 46, gebelikAktif: b.anahtar === 'kadin-hastaliklari-dogum', kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false })
  const aktif = new Set(sonuc.moduller)
  const paket = ornekCekirdek(b, bugun)
  paket.portal = sonuc
  if (b.tur === 'klinik') paket.ozelPlan = ozelPlanOrnegi(b.anahtar)
  else {
    if (aktif.has('buyume')) paket.buyume = buyumeOrnegi(bugun)
    if (aktif.has('gozlerim')) paket.goz = SAGLIGIM_DEMO_GOZ.goz
    elleKurulanDilimler(paket, aktif, bugun)
    onizlemeGorevDilimleri(paket, aktif, bugun, ornekGorevler(bugun))
  }
  return { ...paket, ornek: true, brans: b }
}
