/**
 * ASI-KARNESI-01 (C) — dijital aşı karnesinin TEK içerik modeli. Saf + istemci-güvenli.
 *
 * Dr. Gökhan Mamur: "dijital aşı karnesi olmalı ebeveynin cep telefonundan ulaşabileceği … kağıda yazılmış aşı
 * kayıtları param parça oluyor." Kaan: karne PDF indirilebilir, cihazdan paylaşılabilir, yazdırılabilir.
 *
 * Tek şablon ilkesi (Kaan): Sağlığım ekranı, yazdırma çıktısı (aynı ekran, @media print) ve PDF (lib/asi/karnePdf.tsx —
 * portal ve hekim aynı üretici) HEPSİ `asiKarnesiOlustur()` çıktısından ve buradaki sabitlerden çizilir. Metin, sıra,
 * kaynak etiketi ve e-Nabız uyarısı yalnız burada yazılır; iki görünüm ayrı ayrı bakım istemez.
 *
 * Portal dili: KLİNİK YORUM YOK — yalnız kayıtlı aşı, doz, tarih, kaynak ve hekimin girdiği sonraki doz tarihi.
 * "Eksik", "gecikmiş", risk, öneri gibi çıkarım yapılmaz (takvim motoru burada ÇALIŞMAZ).
 */
import { asiKaynakTuru, KARNE_ROZETI, trTarih, type AsiKaynakTuru } from './karneOkuma'
import { sonrakiDozKarsilandiMi } from './hatirlatma'

/** e-Nabız uyarısı — ZORUNLU, ekranda / çıktıda / PDF'te görünür ve küçültülmez (Kaan). */
export const E_NABIZ_BASLIK = 'Bu karne bilgi amaçlıdır'
export const E_NABIZ_UYARISI =
  "Okul kaydı, yurt dışı seyahati gibi resmî işlemlerde geçerli kaynak T.C. Sağlık Bakanlığı e-Nabız kayıtlarıdır. Bu karne, doktorunuzun muayenehanesinde tutulan aşı kayıtlarının bir özetidir; e-Nabız'ın yerine geçmez."

/** Hasta yüzü kaynak etiketi — hekim listesindeki ayrımın aynısı (karne rozeti metni ortak). */
export const HASTA_KAYNAK_ETIKETI: Record<AsiKaynakTuru, string> = {
  karne: KARNE_ROZETI,
  klinik: 'Klinikte uygulandı',
  beyan: 'Beyana göre kaydedildi',
}

/** Kaynak etiketlerinin açıklaması — ekranın ve PDF'in altında aynı metin. */
export const KAYNAK_ACIKLAMASI: Record<AsiKaynakTuru, string> = {
  karne: 'dış kurumda yapılmış, kağıt aşı karnesinden aktarılmış ve hekiminiz tarafından onaylanmış kayıt.',
  klinik: 'bu muayenehanede uygulanan doz.',
  beyan: 'size ya da yakınınıza sorularak kaydedilen bilgi.',
}
export const KAYNAK_SIRASI: AsiKaynakTuru[] = ['karne', 'klinik', 'beyan']

export const ASI_KARNESI_BASLIK = 'Aşı Karnesi'
export const PAYLAS_IPUCU = "PDF'i indirip kendi e-postanızdan ya da mesaj uygulamanızdan gönderebilirsiniz."

/** asilar satırının karnenin ihtiyaç duyduğu kısmı (select('*') satırı da uyar). */
export interface AsiKaydiSatiri {
  asi_adi: string | null
  doz_no: number | null
  kategori?: string | null
  uygulama_tarihi: string | null
  sonraki_doz_tarihi?: string | null
  kaynak?: string | null
  notlar?: string | null
  belge_id?: string | null
}

export interface AsiKarnesiSatiri {
  ad: string
  doz: number | null
  /** YYYY-MM-DD ya da null (tarih kayıtlı değil) */
  tarih: string | null
  kaynak: AsiKaynakTuru
  kaynakEtiketi: string
}

export interface AsiKarnesiSiradaki {
  ad: string
  /** Hekimin girdiği sonraki doz tarihi (YYYY-MM-DD) — hesaplanmaz */
  tarih: string
}

export interface AsiKarnesi {
  hasta: { adSoyad: string | null; dogumTarihi: string | null }
  hekim: { ad: string | null; klinik: string | null }
  /** YYYY-MM-DD */
  uretimTarihi: string
  yapilanlar: AsiKarnesiSatiri[]
  /** Yalnız bugün ve sonrası; en yakın ilk — "Sıradaki aşı" ilk eleman */
  siradakiler: AsiKarnesiSiradaki[]
  uyari: { baslik: string; metin: string }
}

const ISO = /^\d{4}-\d{2}-\d{2}$/
const gun = (v: unknown): string | null => {
  const s = String(v ?? '').slice(0, 10)
  return ISO.test(s) ? s : null
}
const temiz = (v: unknown): string => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, 120)

export function asiKarnesiOlustur(g: {
  asilar: AsiKaydiSatiri[]
  hasta: { adSoyad: string | null; dogumTarihi: string | null }
  hekim: { ad: string | null; klinik: string | null }
  bugunIso: string
}): AsiKarnesi {
  const yapilanlar: AsiKarnesiSatiri[] = []
  const siradaki = new Map<string, AsiKarnesiSiradaki>()
  // Sonraki dozu aynı hastada daha sonra kaydedilmiş satır "sıradaki" olarak gösterilmez (hekim listesiyle aynı kural).
  const karsilama = (g.asilar || []).map((a, i) => ({ id: String(i), patient_id: 'hasta', asi_adi: a.asi_adi, uygulama_tarihi: a.uygulama_tarihi }))
  for (const [i, a] of (g.asilar || []).entries()) {
    const ad = temiz(a.asi_adi)
    if (!ad) continue
    const kaynak = asiKaynakTuru(a)
    const doz = Number.isInteger(a.doz_no) && (a.doz_no as number) > 0 ? (a.doz_no as number) : null
    yapilanlar.push({ ad, doz, tarih: gun(a.uygulama_tarihi), kaynak, kaynakEtiketi: HASTA_KAYNAK_ETIKETI[kaynak] })
    const sonraki = gun(a.sonraki_doz_tarihi)
    if (sonraki && sonraki >= g.bugunIso && !sonrakiDozKarsilandiMi(karsilama[i], karsilama)) siradaki.set(`${ad}|${sonraki}`, { ad, tarih: sonraki })
  }
  // Eskiden yeniye; tarihsiz kayıtlar sonda, kendi içinde ada göre.
  yapilanlar.sort((a, b) => (a.tarih && b.tarih ? a.tarih.localeCompare(b.tarih) : a.tarih ? -1 : b.tarih ? 1 : 0) || a.ad.localeCompare(b.ad, 'tr') || (a.doz ?? 0) - (b.doz ?? 0))
  const siradakiler = [...siradaki.values()].sort((a, b) => a.tarih.localeCompare(b.tarih) || a.ad.localeCompare(b.ad, 'tr'))
  return {
    hasta: { adSoyad: g.hasta.adSoyad ? temiz(g.hasta.adSoyad) : null, dogumTarihi: gun(g.hasta.dogumTarihi) },
    hekim: { ad: g.hekim.ad ? temiz(g.hekim.ad) : null, klinik: g.hekim.klinik ? temiz(g.hekim.klinik) : null },
    uretimTarihi: g.bugunIso,
    yapilanlar,
    siradakiler,
    uyari: { baslik: E_NABIZ_BASLIK, metin: E_NABIZ_UYARISI },
  }
}

/** Karnede en az bir kayıt var mı — portal modülünün uygunluğu buradan (branş kapısı yok). */
export const asiKarnesiDoluMu = (k: Pick<AsiKarnesi, 'yapilanlar' | 'siradakiler'> | null | undefined): boolean =>
  !!k && (k.yapilanlar.length > 0 || k.siradakiler.length > 0)

export const dozMetni = (doz: number | null): string => (doz ? `${doz}. doz` : '—')
export const tarihMetni = (iso: string | null): string => (iso ? trTarih(iso) : 'Tarih kayıtlı değil')

/** İndirilen dosyanın adı — hasta adı dosya adına yazılmaz (paylaşımda / indirilenler klasöründe PHI yok). */
export function asiKarnesiDosyaAdi(k: Pick<AsiKarnesi, 'uretimTarihi'>): string {
  return `asi-karnesi-${k.uretimTarihi}.pdf`
}

/**
 * Yazdırma stili (@media print) — Sağlığım ekranını kağıda sade karne olarak basar. Yalnız karne sayfasında yüklenir.
 *  - portal kabuğu (üst bar, gezinme, alt bilgi), eylem düğmeleri ve geri bağlantısı basılmaz
 *  - beyaz zemin, siyah metin: koyu/renkli zemin basılmaz (mürekkep, okunaklılık)
 *  - aşı satırları ve tablo sayfa sonunda ortadan bölünmez
 *  - e-Nabız uyarısı ve kaynak etiketleri görünür kalır (gizlenmez, küçültülmez)
 */
export const ASI_KARNESI_YAZDIRMA_CSS = `
@media print {
  @page { size: A4; margin: 14mm; }
  html, body, .sagligim-root, .sg-shell, .sg-main, .sg-fade, .sg-panel, .asi-karnesi, .asi-karnesi * {
    background: #fff !important;
    color: #000 !important;
    box-shadow: none !important;
    text-shadow: none !important;
    backdrop-filter: none !important;
    -webkit-print-color-adjust: economy;
    print-color-adjust: economy;
  }
  .sg-header, .sg-nav, .sg-footer, .sg-back-link, .asi-karnesi .sg-section-sub, [data-yazdirma-gizle] { display: none !important; }
  .sg-main { padding: 0 !important; margin: 0 !important; max-width: none !important; }
  .asi-karnesi-satir, .asi-karnesi-siradaki, .asi-karnesi-uyari, .asi-karnesi-kimlik { break-inside: avoid; page-break-inside: avoid; }
  .asi-karnesi-liste { break-inside: auto; }
  .asi-karnesi-uyari { border: 1.5pt solid #000 !important; font-size: 11pt !important; }
  .asi-karnesi-rozet { border: 0.75pt solid #000 !important; }
  a { color: #000 !important; text-decoration: none !important; }
}
`
