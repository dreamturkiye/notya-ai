/**
 * Özel Branş araçları — her dalın kendi motoru. Çekirdek (portal, KVKK, e-Nabız) burada yok.
 * TUS dermatoloji / FTR / psikiyatri / KBB / plastik Yaram bu listeye girmez.
 */
import type { KlinikYeniSlug } from '@/lib/specialties/klinikDikey'
import { greftBandi, yikamaTakvimi, fotoKvkkRiza, cizgiCercevesi, FOTO_SERI } from '@/specialties/sac-ekimi/engines/sac'
import { dokulmePenceresi, sonucIzlemi } from '@/specialties/sac-ekimi/engines/izlem'
import { fotoSaklama as sacFotoSaklama } from '@/specialties/sac-ekimi/engines/kayit'
import { gecDonem } from '@/specialties/estetik-cerrahi/engines/izlem'
import { bakimAylari } from '@/specialties/medikal-estetik/engines/izlem'
import { lazerSonrasi } from '@/specialties/klinik-dermatoloji/engines/izlem'
import { lazerAralik } from '@/specialties/klinik-dermatoloji/engines/girdi'
import { fotoSaklama as dermFotoSaklama } from '@/specialties/klinik-dermatoloji/engines/kayit'
import { beklemeBitisi, reaksiyonSonrasiAralik } from '@/specialties/longevity/engines/izlem'
import { hekimGirdi } from '@/specialties/fizyoterapi/engines/girdi'
import { evIzlem } from '@/specialties/fizyoterapi/engines/izlem'
import { cerceveGozden } from '@/specialties/klinik-psikolog/engines/izlem'
import { taniKacagi } from '@/specialties/klinik-psikolog/engines/girdi'
import { kiloGirdi } from '@/specialties/diyetisyen/engines/girdi'
import { gecKontrol } from '@/specialties/diyetisyen/engines/izlem'
import { neyziRed } from '@/specialties/ergoterapi/engines/girdi'
import { altiHafta, blokKontrol } from '@/specialties/ergoterapi/engines/izlem'
import { dbGirdi } from '@/specialties/odyoloji/engines/girdi'
import { altiAyCihaz, esikEgimi } from '@/specialties/odyoloji/engines/izlem'
import { cerrahiSoguma, postOpTakvim, rizaIkiNusha, emboliBandi, ACIL_METIN as CER_A, ISLEMLER } from '@/specialties/estetik-cerrahi/engines/cerrahi'
import { sogumaUygun, islemTakvimi, vaskulerAyrinti, lotKaydi, ACIL_METIN as EST_A, BOLGELER } from '@/specialties/medikal-estetik/engines/estetik'
import { lazerSeansVadesi, akneBakimTakvimi, fotoRizaKayit, gunesRitmi, lazerAcilBand, ACIL_METIN as DERM_A } from '@/specialties/klinik-dermatoloji/engines/derm'
import { sonrakiInfuzon, ivGuvenlik, reaksiyonBand, sinifUygun, GUVENLIK_MADDELERI, SINIFLAR, ACIL_METIN as LONG_A } from '@/specialties/longevity/engines/long'
import { icfOzet, seansVadesi as fizyoVade, evProgrami, kirmiziBayrak, ACIL_METIN as FIZ_A } from '@/specialties/fizyoterapi/engines/fizyo'
import { seansCercevesi, seansVadesi as psikVade, krizBand, siklikKaydi, ACIL_METIN as PSI_A } from '@/specialties/klinik-psikolog/engines/psikolog'
import { planKapisi, kontrolTakvimi, ogunIskeleti, ACIL_METIN as DIY_A } from '@/specialties/diyetisyen/engines/diyet'
import { gyaOzet, seansVadesi as ergoVade, gunlukBlok, dusmeBayrak, GYA, ACIL_METIN as ERG_A } from '@/specialties/ergoterapi/engines/ergo'
import { ptaKayit, sessizOdaKayit, aniIsitmeBand, cihazIzlem, ACIL_METIN as ODY_A } from '@/specialties/odyoloji/engines/odyo'

export type AracAlan = {
  id: string
  etiket: string
  tur: 'sayi' | 'tarih' | 'metin' | 'onay' | 'secim' | 'coklu'
  secenekler?: readonly string[]
}

export type AracVade = { iso: string; ad: string }

export type AracCikti = {
  ozet: string
  vadeler: AracVade[]
  acil: string | null
  riza: boolean
}

export type AracTanim = {
  route: string
  slug: KlinikYeniSlug
  baslik: string
  aciklama: string
  renk: string
  alanlar: AracAlan[]
  calistir: (g: Record<string, string>, bugun: string) => AracCikti | { hata: string }
}

const iso = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s)
export function isoEkle(gun0: string, gun: number): string {
  const d = new Date(gun0 + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + gun)
  return d.toISOString().slice(0, 10)
}
const onay = (g: Record<string, string>, id: string) => g[id] === '1'
const sayi = (g: Record<string, string>, id: string) => Number(g[id])

function hata(mesaj: string): { hata: string } {
  return { hata: mesaj }
}
function cikti(ozet: string, vadeler: AracVade[], acil: string | null, riza = true): AracCikti {
  return { ozet, vadeler, acil, riza }
}

export function portalSatirlari(vadeler: AracVade[], bugun: string): Array<{ ad: string; durum: 'gecikti' | 'bugun' | 'planli' }> {
  return vadeler
    .filter((v) => iso(v.iso) && v.ad.trim() && !/kcal|mL|ünite|doz|tanı|greft|dB/i.test(v.ad))
    .map((v) => {
      const fark = Math.round((Date.parse(v.iso + 'T12:00:00Z') - Date.parse(bugun + 'T12:00:00Z')) / 86400000)
      const durum = fark < 0 ? 'gecikti' as const : fark === 0 ? 'bugun' as const : 'planli' as const
      return { ad: `${v.ad} · ${v.iso}`, durum }
    })
}

const T = (
  route: string,
  slug: KlinikYeniSlug,
  baslik: string,
  aciklama: string,
  renk: string,
  alanlar: AracAlan[],
  calistir: AracTanim['calistir'],
): AracTanim => ({ route, slug, baslik, aciklama, renk, alanlar, calistir })

export const OZEL_ARACLAR: readonly AracTanim[] = [
  T('/ozel-branslar/sac-greft', 'sac-ekimi', 'Donör greft bandı', 'cm² × yoğunluk. Nihai greft hekimindir.', '#2563EB', [
    { id: 'cm2', etiket: 'Donör alan (cm²)', tur: 'sayi' },
    { id: 'yogunluk', etiket: 'Yoğunluk (1/cm²)', tur: 'sayi' },
  ], (g) => {
    const r = greftBandi(sayi(g, 'cm2'), sayi(g, 'yogunluk'))
    return 'hata' in r ? r : cikti(r.ozet, [], null)
  }),
  T('/ozel-branslar/sac-takvim', 'sac-ekimi', 'Yıkama takvimi', '1 / 3 / 10 / 14. gün, dökülme penceresi, 6 ve 12. ay. Greft sayısı yazılmaz.', '#1D4ED8', [
    { id: 'ameliyat', etiket: 'İşlem günü', tur: 'tarih' },
  ], (g, bugun) => {
    const t = yikamaTakvimi(g.ameliyat || '', bugun)
    if (!t.length) return hata('İşlem gününü girin.')
    const d = dokulmePenceresi(g.ameliyat || '')
    if ('hata' in d) return d
    const s = sonucIzlemi(g.ameliyat || '')
    if ('hata' in s) return s
    return cikti('Yıkama vadeleri hesaplandı.', [
      ...t.map((x) => ({ iso: isoEkle(g.ameliyat, x.gun), ad: x.ad })),
      ...d.map((x) => ({ iso: isoEkle(g.ameliyat, x.gun), ad: x.ad })),
      ...s.map((x) => ({ iso: isoEkle(g.ameliyat, x.gun), ad: x.ad })),
    ], null)
  }),
  T('/ozel-branslar/sac-cizgi', 'sac-ekimi', 'Çizgi çerçevesi', 'Ön, temporal, verteks. Norwood skoru kilitlenmez.', '#1E3A8A', [
    { id: 'on', etiket: 'Ön çizgi notu', tur: 'metin' },
    { id: 'temporal', etiket: 'Temporal sınır', tur: 'metin' },
    { id: 'verteks', etiket: 'Verteks notu', tur: 'metin' },
  ], (g) => {
    const r = cizgiCercevesi(g.on || '', g.temporal || '', g.verteks || '')
    return 'hata' in r ? r : cikti(r.ozet, [], null)
  }),
  T('/ozel-branslar/sac-foto', 'sac-ekimi', 'Foto seri günleri', '0 / 10 / 30 / 90. Ayrı KVKK rızası şart.', '#1E40AF', [
    { id: 'ameliyat', etiket: 'İşlem günü', tur: 'tarih' },
    { id: 'riza', etiket: 'Foto KVKK rızası var', tur: 'onay' },
    { id: 'ay', etiket: 'Saklama (ay: 6, 12 veya 24)', tur: 'sayi' },
  ], (g) => {
    const r = fotoKvkkRiza(onay(g, 'riza'), g.ameliyat || '')
    if ('hata' in r) return r
    const sak = sacFotoSaklama(true, g.ameliyat || '', g.ay || '')
    if ('hata' in sak) return sak
    const vadeler: Array<{ iso: string; ad: string }> = FOTO_SERI.map((x) => ({ iso: isoEkle(g.ameliyat, x.gun), ad: x.ad }))
    if (sak.bitis) vadeler.push({ iso: sak.bitis, ad: 'Foto saklama bitişi' })
    return cikti([r.ozet, sak.ozet].filter(Boolean).join(' '), vadeler, null, true)
  }),

  T('/ozel-branslar/cerrahi-onam', 'estetik-cerrahi', 'Elektif onam / soğuma', 'Onam ile ameliyat arası. Kesi yok.', '#E91E8C', [
    { id: 'onam', etiket: 'Onam günü', tur: 'tarih' },
    { id: 'ameliyat', etiket: 'Ameliyat günü', tur: 'tarih' },
  ], (g) => {
    const r = cerrahiSoguma(g.onam || '', g.ameliyat || '')
    return cikti(r.ozet, [], null, r.uygun)
  }),
  T('/ozel-branslar/cerrahi-takvim', 'estetik-cerrahi', 'Ameliyat sonrası takvim', '1 / 7 / 14 / 42. gün, sonra 3 / 6 / 12. ay.', '#DB2777', [
    { id: 'ameliyat', etiket: 'Ameliyat günü', tur: 'tarih' },
  ], (g, bugun) => {
    const t = postOpTakvim(g.ameliyat || '', bugun)
    if (!t.length) return hata('Ameliyat gününü girin.')
    const u = gecDonem(g.ameliyat || '')
    if ('hata' in u) return u
    return cikti('Ameliyat sonrası vadeler.', [
      ...t.map((x) => ({ iso: isoEkle(g.ameliyat, x.gun), ad: x.ad })),
      ...u.map((x) => ({ iso: isoEkle(g.ameliyat, x.gun), ad: x.ad })),
    ], null)
  }),
  T('/ozel-branslar/cerrahi-riza', 'estetik-cerrahi', 'İki nüsha rıza', 'Hasta Hakları m.26. Dosya + hasta nüshası.', '#BE185D', [
    { id: 'islem', etiket: 'İşlem sınıfı', tur: 'secim', secenekler: ISLEMLER },
    { id: 'onam', etiket: 'Dosya nüshası var', tur: 'onay' },
    { id: 'hasta', etiket: 'Hasta nüshası verildi', tur: 'onay' },
  ], (g) => {
    if (!g.islem) return hata('İşlem sınıfını seçin.')
    const r = rizaIkiNusha(onay(g, 'onam'), onay(g, 'hasta'))
    return 'hata' in r ? r : cikti(`${g.islem}. ${r.ozet}`, [], null, true)
  }),
  T('/ozel-branslar/cerrahi-emboli', 'estetik-cerrahi', 'Emboli / kanama bandı', 'Nefes, bacak, göğüs, kanama. Tanı yok.', '#9D174D', [
    { id: 'nefes', etiket: 'Ani nefes darlığı', tur: 'onay' },
    { id: 'bacak', etiket: 'Tek taraflı bacak şişliği', tur: 'onay' },
    { id: 'gogus', etiket: 'Göğüs ağrısı', tur: 'onay' },
    { id: 'kanama', etiket: 'Kontrolsüz kanama', tur: 'onay' },
  ], (g) => {
    const r = emboliBandi(onay(g, 'nefes'), onay(g, 'bacak'), onay(g, 'gogus'), onay(g, 'kanama'))
    return cikti(r.ozet, [], r.acil ? CER_A : null)
  }),

  T('/ozel-branslar/estetik-soguma', 'medikal-estetik', 'Onam / soğuma', 'Ayakta Teşhis soğuma. Doz yok.', '#9333EA', [
    { id: 'onam', etiket: 'Onam günü', tur: 'tarih' },
    { id: 'islem', etiket: 'İşlem günü', tur: 'tarih' },
  ], (g) => {
    const r = sogumaUygun(g.onam || '', g.islem || '')
    return cikti(r.ozet, [], null, r.uygun)
  }),
  T('/ozel-branslar/estetik-takvim', 'medikal-estetik', 'İşlem bakım takvimi', '1 / 14 / 28. gün, sonra 3 ve 4. ay. Ünite yok.', '#7E22CE', [
    { id: 'islem', etiket: 'İşlem günü', tur: 'tarih' },
  ], (g, bugun) => {
    const t = islemTakvimi(g.islem || '', bugun)
    if (!t.length) return hata('İşlem gününü girin.')
    const u = bakimAylari(g.islem || '')
    if ('hata' in u) return u
    return cikti('Bakım vadeleri.', [
      ...t.map((x) => ({ iso: isoEkle(g.islem, x.gun), ad: x.ad })),
      ...u.map((x) => ({ iso: isoEkle(g.islem, x.gun), ad: x.ad })),
    ], null)
  }),
  T('/ozel-branslar/estetik-vaskuler', 'medikal-estetik', 'Vasküler acil bandı', 'Görme, livedo, ağrı, nefes. Doz yok.', '#6B21A8', [
    { id: 'gorme', etiket: 'Görme kaybı', tur: 'onay' },
    { id: 'livedo', etiket: 'Livedo / solukluk', tur: 'onay' },
    { id: 'agri', etiket: 'Ani şiddetli ağrı', tur: 'onay' },
    { id: 'nefes', etiket: 'Nefes darlığı', tur: 'onay' },
  ], (g) => {
    const r = vaskulerAyrinti(onay(g, 'gorme'), onay(g, 'livedo'), onay(g, 'agri'), onay(g, 'nefes'))
    return cikti(r.ozet, [], r.acil ? EST_A : null)
  }),
  T('/ozel-branslar/estetik-lot', 'medikal-estetik', 'Lot kaydı', 'Lot ve bölge. Ünite ve mL yok.', '#581C87', [
    { id: 'lot', etiket: 'Lot', tur: 'metin' },
    { id: 'bolge', etiket: 'Bölge', tur: 'secim', secenekler: BOLGELER },
  ], (g) => {
    const r = lotKaydi(g.lot || '', g.bolge || '')
    return 'hata' in r ? r : cikti(r.ozet, [], null)
  }),

  T('/ozel-branslar/derm-lazer', 'klinik-dermatoloji', 'Lazer seans vadesi', '14–90 gün. Fluence yok.', '#F59E0B', [
    { id: 'son', etiket: 'Son seans', tur: 'tarih' },
    { id: 'aralik', etiket: 'Aralık (gün)', tur: 'sayi' },
  ], (g, bugun) => {
    const ar = lazerAralik(sayi(g, 'aralik'))
    if ('hata' in ar) return ar
    const r = lazerSeansVadesi(g.son || '', ar.gun, bugun)
    if ('hata' in r) return r
    const sonra = lazerSonrasi(g.son || '')
    if ('hata' in sonra) return sonra
    return cikti(r.ozet, [
      { iso: r.due, ad: 'Sonraki lazer seansı' },
      ...sonra.map((x) => ({ iso: isoEkle(g.son, x.gun), ad: x.ad })),
    ], null)
  }),
  T('/ozel-branslar/derm-takvim', 'klinik-dermatoloji', 'Akne bakım takvimi', '2 / 6 / 12. hafta. Skor yok.', '#D97706', [
    { id: 'bas', etiket: 'Başlangıç', tur: 'tarih' },
  ], (g, bugun) => {
    const t = akneBakimTakvimi(g.bas || '', bugun)
    if (!t.length) return hata('Başlangıç gününü girin.')
    return cikti('Akne bakım vadeleri.', t.map((x) => ({ iso: isoEkle(g.bas, x.hafta * 7), ad: x.ad })), null)
  }),
  T('/ozel-branslar/derm-gunes', 'klinik-dermatoloji', 'Güneş ve bakım ritmi', '1 / 4 / 8. hafta. PASI yok.', '#B45309', [
    { id: 'bas', etiket: 'Başlangıç', tur: 'tarih' },
    { id: 'foto', etiket: 'Foto KVKK rızası var', tur: 'onay' },
    { id: 'ay', etiket: 'Saklama (ay: 6, 12 veya 24)', tur: 'sayi' },
  ], (g, bugun) => {
    const f = fotoRizaKayit(onay(g, 'foto'))
    if ('hata' in f) return f
    const sak = dermFotoSaklama(true, g.bas || '', g.ay || '')
    if ('hata' in sak) return sak
    const t = gunesRitmi(g.bas || '', bugun)
    if (!t.length) return hata('Başlangıç gününü girin.')
    const vadeler = t.map((x) => ({ iso: isoEkle(g.bas, x.hafta * 7), ad: x.ad }))
    if (sak.bitis) vadeler.push({ iso: sak.bitis, ad: 'Foto saklama bitişi' })
    return cikti([f.ozet, sak.ozet].filter(Boolean).join(' '), vadeler, null)
  }),
  T('/ozel-branslar/derm-acil', 'klinik-dermatoloji', 'Lazer acil bandı', 'Kabarcık, görme, nefes. Fluence yok.', '#92400E', [
    { id: 'kabarcik', etiket: 'Yaygın kabarcık', tur: 'onay' },
    { id: 'gorme', etiket: 'Görme kaybı', tur: 'onay' },
    { id: 'nefes', etiket: 'Nefes darlığı', tur: 'onay' },
  ], (g) => {
    const r = lazerAcilBand(onay(g, 'kabarcik'), onay(g, 'gorme'), onay(g, 'nefes'))
    return cikti(r.ozet, [], r.acil ? DERM_A : null)
  }),

  T('/ozel-branslar/long-vade', 'longevity', 'Sonraki seans vadesi', 'Aralık. Karışım yok.', '#059669', [
    { id: 'son', etiket: 'Son seans', tur: 'tarih' },
    { id: 'aralik', etiket: 'Aralık (gün)', tur: 'sayi' },
    { id: 'reaksiyon', etiket: 'Son seansta reaksiyon oldu', tur: 'onay' },
  ], (g, bugun) => {
    const engel = reaksiyonSonrasiAralik(onay(g, 'reaksiyon'), sayi(g, 'aralik'))
    if (engel) return engel
    const r = sonrakiInfuzon(g.son || '', sayi(g, 'aralik'), bugun)
    if ('hata' in r) return r
    const bek = beklemeBitisi(onay(g, 'reaksiyon'), g.son || '')
    if (bek && 'hata' in bek) return bek
    const vadeler: Array<{ iso: string; ad: string }> = [{ iso: r.due, ad: 'Sonraki seans' }]
    if (bek && 'gun' in bek) vadeler.push({ iso: isoEkle(g.son, bek.gun), ad: bek.ad })
    return cikti(`Sonraki seans ${r.due} · ${r.durum}.`, vadeler, null)
  }),
  T('/ozel-branslar/long-guvenlik', 'longevity', 'IV güvenlik kaydı', 'En az 3 madde. Doz yok.', '#10B981', [
    { id: 'madde', etiket: 'Güvenlik maddeleri', tur: 'coklu', secenekler: GUVENLIK_MADDELERI },
  ], (g) => {
    const r = ivGuvenlik((g.madde || '').split('|').filter(Boolean))
    return 'hata' in r ? r : cikti(r.ozet, [], null)
  }),
  T('/ozel-branslar/long-sinif', 'longevity', 'İzlem sınıfı', 'Sınıf listesi. Karışım ve mL yok.', '#047857', [
    { id: 'sinif', etiket: 'Sınıf', tur: 'secim', secenekler: SINIFLAR },
  ], (g) => {
    const r = sinifUygun(g.sinif || '')
    return 'hata' in r ? r : cikti(r.ozet, [], null)
  }),
  T('/ozel-branslar/long-reaksiyon', 'longevity', 'IV reaksiyon bandı', 'Nefes, kaşıntı, tansiyon. Karışım yok.', '#065F46', [
    { id: 'nefes', etiket: 'Nefes darlığı', tur: 'onay' },
    { id: 'kasinti', etiket: 'Yaygın kaşıntı', tur: 'onay' },
    { id: 'tansiyon', etiket: 'Tansiyon düşmesi', tur: 'onay' },
  ], (g) => {
    const r = reaksiyonBand(onay(g, 'nefes'), onay(g, 'kasinti'), onay(g, 'tansiyon'))
    return cikti(r.ozet, [], r.acil ? LONG_A : null)
  }),

  T('/ozel-branslar/fizyo-icf', 'fizyoterapi', 'ICF seans özeti', 'Hekim tanısı zorunlu. FTR değil.', '#0EA5E9', [
    { id: 'tani', etiket: 'Hekim tanısı (referans)', tur: 'metin' },
    { id: 'aktivite', etiket: 'Aktivite', tur: 'metin' },
    { id: 'katilim', etiket: 'Katılım', tur: 'metin' },
  ], (g) => {
    const kap = hekimGirdi(g.tani || '')
    if ('hata' in kap) return kap
    const r = icfOzet(g.aktivite || '', g.katilim || '', kap.tani)
    return 'hata' in r ? r : cikti(r.ozet, [], null)
  }),
  T('/ozel-branslar/fizyo-seans', 'fizyoterapi', 'Seans vadesi', 'Aralık. SGK hak iddiası yok.', '#0284C7', [
    { id: 'son', etiket: 'Son seans', tur: 'tarih' },
    { id: 'aralik', etiket: 'Aralık (gün)', tur: 'sayi' },
  ], (g, bugun) => {
    const r = fizyoVade(g.son || '', sayi(g, 'aralik'), 0, 0, bugun)
    if ('hata' in r) return r
    const due = isoEkle(g.son, sayi(g, 'aralik'))
    return cikti(r.ozet, [{ iso: due, ad: 'Sonraki seans' }], null)
  }),
  T('/ozel-branslar/fizyo-ev', 'fizyoterapi', 'Ev programı', 'En fazla 4 satır. Enjeksiyon yok.', '#0369A1', [
    { id: 'satir', etiket: 'Satırlar (her satır bir iş)', tur: 'metin' },
    { id: 'bas', etiket: 'Başlangıç', tur: 'tarih' },
  ], (g) => {
    const r = evProgrami(g.satir || '')
    if ('hata' in r) return r
    const ev = evIzlem(g.bas || '')
    if ('hata' in ev) return ev
    return cikti(r.ozet, ev.map((x) => ({ iso: isoEkle(g.bas, x.gun), ad: x.ad })), null)
  }),
  T('/ozel-branslar/fizyo-bayrak', 'fizyoterapi', 'Kırmızı bayrak', 'Eyer, göğüs, güç kaybı. Tanı yok.', '#075985', [
    { id: 'eyer', etiket: 'Eyer uyuşukluğu', tur: 'onay' },
    { id: 'gogus', etiket: 'Göğüs ağrısı', tur: 'onay' },
    { id: 'guc', etiket: 'İlerleyici güç kaybı', tur: 'onay' },
  ], (g) => {
    const r = kirmiziBayrak(onay(g, 'eyer'), onay(g, 'gogus'), onay(g, 'guc'))
    return cikti(r.ozet, [], r.acil ? FIZ_A : null)
  }),

  T('/ozel-branslar/psikolog-seans', 'klinik-psikolog', 'Seans çerçevesi', 'Yaklaşım. Tanı ve ilaç yok.', '#6366F1', [
    { id: 'yaklasim', etiket: 'Yaklaşım', tur: 'metin' },
    { id: 'olcek', etiket: 'Ölçek adı (yorum yok)', tur: 'metin' },
    { id: 'kriz', etiket: 'Kriz var', tur: 'onay' },
  ], (g) => {
    const k = taniKacagi(`${g.yaklasim || ''} ${g.olcek || ''}`)
    if (k) return k
    const r = seansCercevesi(g.yaklasim || '', g.olcek || null, onay(g, 'kriz'))
    if ('hata' in r) return r
    return cikti(r.ozet, [], onay(g, 'kriz') ? PSI_A : null)
  }),
  T('/ozel-branslar/psikolog-vade', 'klinik-psikolog', 'Seans vadesi', '3–60 gün. Skor yok.', '#818CF8', [
    { id: 'son', etiket: 'Son görüşme', tur: 'tarih' },
    { id: 'aralik', etiket: 'Aralık (gün)', tur: 'sayi' },
  ], (g, bugun) => {
    const r = psikVade(g.son || '', sayi(g, 'aralik'), bugun)
    if ('hata' in r) return r
    const c = cerceveGozden(g.son || '')
    if ('hata' in c) return c
    return cikti(r.ozet, [
      { iso: r.due, ad: 'Sonraki görüşme' },
      { iso: isoEkle(g.son, c.gun), ad: c.ad },
    ], null)
  }),
  T('/ozel-branslar/psikolog-siklik', 'klinik-psikolog', 'Çerçeve sıklığı', 'Haftalık / iki hafta / aylık.', '#4F46E5', [
    { id: 'siklik', etiket: 'Sıklık', tur: 'secim', secenekler: ['haftalık', 'iki haftada bir', 'aylık'] },
    { id: 'yaklasim', etiket: 'Yaklaşım', tur: 'metin' },
  ], (g) => {
    const k = taniKacagi(g.yaklasim || '')
    if (k) return k
    const r = siklikKaydi(g.siklik || '', g.yaklasim || '')
    return 'hata' in r ? r : cikti(r.ozet, [], null)
  }),
  T('/ozel-branslar/psikolog-kriz', 'klinik-psikolog', 'Kriz bandı', 'Kendine, başkasına, gerçeklik. Tanı yok.', '#3730A3', [
    { id: 'kendine', etiket: 'Kendine zarar', tur: 'onay' },
    { id: 'baskasina', etiket: 'Başkasına zarar', tur: 'onay' },
    { id: 'gercek', etiket: 'Gerçeği değerlendirme bozulması', tur: 'onay' },
  ], (g) => {
    const r = krizBand(onay(g, 'kendine'), onay(g, 'baskasina'), onay(g, 'gercek'))
    return cikti(r.ozet, [], r.acil ? PSI_A : null)
  }),

  T('/ozel-branslar/diyet-makro', 'diyetisyen', 'Makro bandı', 'Hekim tanısı olmadan açılmaz.', '#10B981', [
    { id: 'tani', etiket: 'Hekim tanısı (referans)', tur: 'metin' },
    { id: 'kilo', etiket: 'Kilo (kg)', tur: 'sayi' },
    { id: 'hedef', etiket: 'Hedef', tur: 'secim', secenekler: ['kilo', 'koruma', 'spor'] },
  ], (g) => {
    const kilo = kiloGirdi(sayi(g, 'kilo'))
    if ('hata' in kilo) return kilo
    const hedef = g.hedef === 'kilo' || g.hedef === 'spor' ? g.hedef : 'koruma'
    const r = planKapisi(g.tani || '', kilo.kiloKg, hedef)
    return 'hata' in r ? r : cikti(r.ozet, [], null)
  }),
  T('/ozel-branslar/diyet-takvim', 'diyetisyen', 'Kontrol takvimi', '2 / 4 / 8. hafta.', '#34D399', [
    { id: 'bas', etiket: 'Başlangıç', tur: 'tarih' },
  ], (g, bugun) => {
    const t = kontrolTakvimi(g.bas || '', bugun)
    if (!t.length) return hata('Başlangıç gününü girin.')
    const gec = gecKontrol(g.bas || '')
    if ('hata' in gec) return gec
    return cikti('Kontrol vadeleri.', [
      ...t.map((x) => ({ iso: isoEkle(g.bas, x.hafta * 7), ad: x.ad })),
      { iso: isoEkle(g.bas, gec.hafta * 7), ad: gec.ad },
    ], null)
  }),
  T('/ozel-branslar/diyet-ogun', 'diyetisyen', 'Öğün iskeleti', 'Üç etiket. kcal yazılmaz.', '#047857', [
    { id: 'kahvalti', etiket: 'Kahvaltı', tur: 'metin' },
    { id: 'ogle', etiket: 'Öğle', tur: 'metin' },
    { id: 'aksam', etiket: 'Akşam', tur: 'metin' },
  ], (g) => {
    const r = ogunIskeleti(g.kahvalti || '', g.ogle || '', g.aksam || '')
    return 'hata' in r ? r : cikti(r.ozet, [], null)
  }),
  T('/ozel-branslar/diyet-acil', 'diyetisyen', 'Beslenme acil bandı', 'Kusma veya ağır alerji. Tanı yok.', '#065F46', [
    { id: 'kusma', etiket: 'Kontrolsüz kusma veya bilinç değişikliği', tur: 'onay' },
    { id: 'alerji', etiket: 'Ağır alerji', tur: 'onay' },
  ], (g) => {
    const acil = onay(g, 'kusma') || onay(g, 'alerji')
    return cikti(acil ? DIY_A : 'Beslenme acil bandı boş.', [], acil ? DIY_A : null)
  }),

  T('/ozel-branslar/ergo-gya', 'ergoterapi', 'GYA özeti', 'Hekim tanısı + GYA. Neyzi yok.', '#8B5CF6', [
    { id: 'tani', etiket: 'Hekim tanısı (referans)', tur: 'metin' },
    { id: 'gya', etiket: 'GYA alanları', tur: 'coklu', secenekler: GYA },
  ], (g) => {
    const red = neyziRed(`${g.tani || ''} ${(g.gya || '')}`)
    if (red) return red
    const r = gyaOzet(g.tani || '', (g.gya || '').split('|'))
    return 'hata' in r ? r : cikti(r.ozet, [], null)
  }),
  T('/ozel-branslar/ergo-seans', 'ergoterapi', 'GYA seans vadesi', '3–42 gün. Motor skor yok.', '#A78BFA', [
    { id: 'son', etiket: 'Son seans', tur: 'tarih' },
    { id: 'aralik', etiket: 'Aralık (gün)', tur: 'sayi' },
  ], (g, bugun) => {
    const r = ergoVade(g.son || '', sayi(g, 'aralik'), bugun)
    if ('hata' in r) return r
    const a = altiHafta(g.son || '')
    if ('hata' in a) return a
    return cikti(r.ozet, [
      { iso: r.due, ad: 'Sonraki GYA seansı' },
      { iso: isoEkle(g.son, a.gun), ad: a.ad },
    ], null)
  }),
  T('/ozel-branslar/ergo-blok', 'ergoterapi', 'Günlük program', 'Sabah, öğlen, akşam blokları.', '#7C3AED', [
    { id: 'sabah', etiket: 'Sabah', tur: 'metin' },
    { id: 'oglen', etiket: 'Öğlen', tur: 'metin' },
    { id: 'aksam', etiket: 'Akşam', tur: 'metin' },
    { id: 'bas', etiket: 'Başlangıç', tur: 'tarih' },
  ], (g) => {
    const red = neyziRed(`${g.sabah || ''} ${g.oglen || ''} ${g.aksam || ''}`)
    if (red) return red
    const r = gunlukBlok(g.sabah || '', g.oglen || '', g.aksam || '')
    if ('hata' in r) return r
    const blok = blokKontrol(g.bas || '')
    if ('hata' in blok) return blok
    return cikti(r.ozet, [
      { iso: isoEkle(g.bas, 7), ad: 'Günlük program kontrolü' },
      { iso: isoEkle(g.bas, blok.gun), ad: blok.ad },
    ], null)
  }),
  T('/ozel-branslar/ergo-dusme', 'ergoterapi', 'Düşme bandı', 'Düşme veya ani güç kaybı. Tanı yok.', '#5B21B6', [
    { id: 'dusme', etiket: 'Yeni düşme', tur: 'onay' },
    { id: 'guc', etiket: 'Ani güç kaybı', tur: 'onay' },
  ], (g) => {
    const r = dusmeBayrak(onay(g, 'dusme'), onay(g, 'guc'))
    return cikti(r.ozet, [], r.acil ? ERG_A : null)
  }),

  T('/ozel-branslar/odyo-esik', 'odyoloji', 'Eşik kaydı', 'dB bandı. İşitme kaybı tanısı değil.', '#F97316', [
    { id: 'db', etiket: 'Saf ses ortalaması (dB)', tur: 'sayi' },
    { id: 'onceki', etiket: 'Önceki kayıt (dB, boş kalabilir)', tur: 'sayi' },
  ], (g) => {
    const db = dbGirdi(sayi(g, 'db'))
    if ('hata' in db) return db
    if ((g.onceki || '').trim()) {
      const e = esikEgimi(sayi(g, 'onceki'), db.db)
      return 'hata' in e ? e : cikti(e.ozet, [], null)
    }
    const r = ptaKayit(db.db)
    return 'hata' in r ? r : cikti(r.ozet, [], null)
  }),
  T('/ozel-branslar/odyo-oda', 'odyoloji', 'Sessiz oda kaydı', 'md.11 ≥3 m².', '#FB923C', [
    { id: 'm2', etiket: 'Oda (m²)', tur: 'sayi' },
    { id: 'tarama', etiket: 'Tarama kaydı', tur: 'onay' },
  ], (g) => {
    const r = sessizOdaKayit(sayi(g, 'm2'), onay(g, 'tarama'))
    return 'hata' in r ? r : cikti(r.ozet, [], null)
  }),
  T('/ozel-branslar/odyo-cihaz', 'odyoloji', 'Cihaz izlemi', 'Hekim raporu şart. Marka ve bedel yok.', '#EA580C', [
    { id: 'rapor', etiket: 'Uzman hekim raporu var', tur: 'onay' },
    { id: 'kontrol', etiket: 'Kontrol günü', tur: 'tarih' },
  ], (g, bugun) => {
    const r = cihazIzlem(onay(g, 'rapor'), g.kontrol || '', bugun)
    if ('hata' in r) return r
    const ay = altiAyCihaz(onay(g, 'rapor'), g.kontrol || '')
    if (ay && 'hata' in ay) return ay
    const vadeler: Array<{ iso: string; ad: string }> = r.due ? [{ iso: r.due, ad: 'Cihaz kontrolü' }] : []
    if (ay && 'gun' in ay && r.due) vadeler.push({ iso: isoEkle(g.kontrol, ay.gun), ad: ay.ad })
    return cikti(r.ozet, vadeler, null)
  }),
  T('/ozel-branslar/odyo-ani', 'odyoloji', 'Ani işitme bandı', 'Saatler içinde kayıp veya yüz felci. Tanı yok.', '#C2410C', [
    { id: 'saatler', etiket: 'Saatler / günler içinde kayıp', tur: 'onay' },
    { id: 'yuz', etiket: 'Yüz felci eşliği', tur: 'onay' },
  ], (g) => {
    const r = aniIsitmeBand(onay(g, 'saatler'), onay(g, 'yuz'))
    return cikti(r.ozet, [], r.acil ? ODY_A : null)
  }),
]

export function ozelAracBul(route: string): AracTanim | null {
  return OZEL_ARACLAR.find((a) => a.route === route) || null
}

export function ozelAracCalistir(route: string, girdi: Record<string, string>, bugun: string): AracCikti | { hata: string } {
  const a = ozelAracBul(route)
  if (!a) return hata('Araç yok.')
  if (!iso(bugun)) return hata('Bugün YYYY-MM-DD olmalı.')
  return a.calistir(girdi, bugun)
}
