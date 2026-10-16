/**
 * NOTYA-ASI-ONAM-01 — the single branş gate for the vaccine consent system.
 *
 * BRANS-ALAN-SIZMASI decision (stated explicitly, per .cursor/skills/brans-alan-sizmasi/SKILL.md
 * §"PR description requirement"):
 *   - Eklenen/değişen içerik: Dijital Aşı Onam Sistemi (muayene-embedded panel, Sağlığım modülü,
 *     uzaktan onam talebi, kağıt onam yükleme).
 *   - Sınıf: branşa özgü — SADECE Pediatri.
 *   - Kapı: asiOnamBransUygunMu() aşağıda — tek karar noktası; her katman (muayene paneli mount'u,
 *     Sağlığım modül kaydı lib/portal/moduller.ts, API route'ların 403'ü) buraya delege eder.
 *   - Varsayılan (branş bilinmiyorsa): kapalı — asla "bilinmiyorsa pediatri" değil.
 *   - Not: bu kapı BİLEREK PEDIATRIK_BAGLAM'dan (lib/specialties/profile.ts) DAHA DAR. O tablo
 *     "çocuk hastaya KLİNİK içerik" sorusuna cevap verir ve çocuk-cerrahisi'ni de 'her-zaman' sayar;
 *     brief burada açıkça "Pediatri only" dediği için çocuk-cerrahisi (ameliyat onamı kendi
 *     specialties/cocuk-cerrahisi/engines/onam.ts akışında yaşıyor, ayrı bir onay süreci) ve
 *     aile-hekimliği (karma yaş pratiği) bilerek dışarıda tutulur. Bu, görevin kendi talimatından
 *     bir sapma değildir — PEDIATRIK_BAGLAM'ı aynen devralmak yerine görevin "Pediatri only" sözünü
 *     birebir uygulamaktır; farkı burada ve final raporda açıkça not ediyoruz.
 */
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'

/** Dijital Aşı Onam Sistemi'nin görünür/erişilebilir olduğu TEK branş. */
export const ASI_ONAM_BRANSI: SpecialtyKey = 'pediatri'

/** Unknown/null branş → false. Never "unknown counts as pediatri". */
export function asiOnamBransUygunMu(brans: SpecialtyKey | null | undefined): boolean {
  return brans === ASI_ONAM_BRANSI
}
