/**
 * NOTYA-HASTA-RAPORLARI-UNIFIED-01 — the ONE data model every Hasta Raporları PDF renders
 * from (lib/doktor/raporPdfSablonu.tsx). Pure/no React, so it is unit-testable the way
 * `lib/asi/karneBelgesi.ts` is tested separately from its JSX renderer (`karnePdf.tsx`).
 *
 * Unified standard (spec): clinic header, patient block (Ad Soyad / T.C. / Doğum Tarihi /
 * Cinsiyet / Yaş [+ay for pediatric] / Anne-Baba Adı when relevant), clinical/decision
 * block, doctor/clinic block, report date + number — same shape for every report, old
 * (6 SGK/Medula + özel muayenehane types) and new (4 Çocuk Hasta Raporları).
 */
import { cinsiyetTr } from '@/lib/utils/cinsiyet'
import { yasYilAy } from '@/lib/doktor/yas'
import { raporDoktorAlani, type RaporDoktorBlogu } from '@/lib/doktor/raporDoktorBlogu'
import { belgeTarihGorunum } from '@/lib/doktor/raporBelgeNo'
import { TC_KIMLIK_NOTU } from '@/lib/doktor/raporMetinleri'

export type RaporHastaModeli = {
  adSoyad: string
  dogumTarihiIso: string | null
  cinsiyetHam: string | null
  anneAdi?: string | null
  babaAdi?: string | null
}

export type RaporBelgesiModeli = {
  ustBaslik: string
  altBaslik?: string
  belgeNo: string
  /** Her zaman görünüm biçimi (tr-TR) — ISO burada tutulmaz. */
  tarihGorunum: string
  hasta: {
    adSoyad: string
    tcKimlikSatiri: string
    dogumTarihi: string | null
    cinsiyet: string | null
    /** Pediatrik raporlarda yıl+ay; diğerlerinde null (spec: yalnız pediatrik raporlarda). */
    yasYilAy: string | null
    anneAdi: string | null
    babaAdi: string | null
    veliGorunsun: boolean
  }
  klinikBaslik: string
  klinikMetin: string
  doktor: {
    unvanliAdSoyad: string
    uzmanlik: string
    diplomaTescilNo: string
    klinikAdi: string
    adres: string
    telefon: string
    eposta: string
  }
  uyari?: string
}

export type RaporBelgesiGirdi = {
  ustBaslik: string
  altBaslik?: string
  belgeNo: string
  tarihIso?: string | null
  hasta: RaporHastaModeli
  /** true → yaş alanı "X yaş Y ay" (Çocuk Hasta Raporları); false → yasHesapla tarzı ya da boş. */
  pediatrikYasBicimi: boolean
  klinikBaslik: string
  klinikMetin: string
  doktor: RaporDoktorBlogu
  uyari?: string
  /** Anne/Baba Adı blok başlığı — VELI-YASAL-ONAM: yaş < 18 (branş değil). */
  veliGorunsun: boolean
}

export function raporBelgesiModeliKur(g: RaporBelgesiGirdi): RaporBelgesiModeli {
  return {
    ustBaslik: g.ustBaslik,
    altBaslik: g.altBaslik,
    belgeNo: g.belgeNo,
    tarihGorunum: belgeTarihGorunum(g.tarihIso),
    hasta: {
      adSoyad: g.hasta.adSoyad || 'Hasta',
      tcKimlikSatiri: TC_KIMLIK_NOTU,
      dogumTarihi: g.hasta.dogumTarihiIso ? new Date(`${g.hasta.dogumTarihiIso}T00:00:00`).toLocaleDateString('tr-TR') : null,
      cinsiyet: cinsiyetTr(g.hasta.cinsiyetHam) || null,
      yasYilAy: g.pediatrikYasBicimi && g.hasta.dogumTarihiIso ? yasYilAy(g.hasta.dogumTarihiIso) || null : null,
      anneAdi: g.hasta.anneAdi || null,
      babaAdi: g.hasta.babaAdi || null,
      veliGorunsun: g.veliGorunsun,
    },
    klinikBaslik: g.klinikBaslik,
    klinikMetin: g.klinikMetin,
    doktor: {
      unvanliAdSoyad: g.doktor.unvanliAdSoyad,
      uzmanlik: raporDoktorAlani(g.doktor.uzmanlik),
      diplomaTescilNo: raporDoktorAlani(g.doktor.diplomaTescilNo),
      klinikAdi: raporDoktorAlani(g.doktor.klinikAdi),
      adres: raporDoktorAlani(g.doktor.adres),
      telefon: raporDoktorAlani(g.doktor.telefon),
      eposta: raporDoktorAlani(g.doktor.eposta),
    },
    uyari: g.uyari,
  }
}

/** Güvenli dosya adı — Türkçe karakter ve boşluk arındırılmış, .pdf ile. */
export function raporDosyaAdi(baslik: string, belgeNo: string): string {
  const temiz = String(baslik || 'rapor')
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/[şŞ]/g, 's')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u')
    .replace(/[öÖ]/g, 'o')
    .replace(/[çÇ]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${temiz || 'rapor'}-${belgeNo}.pdf`
}
