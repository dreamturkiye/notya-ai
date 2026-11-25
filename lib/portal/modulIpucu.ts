/**
 * Sağlığım chapter-module hints (Türkiye words): the one-line caption under each attached module's shortcut. Shared by
 * the Bugün home (Bölümlerim) and the göz / KBB demo Özet hero (HomeHero). Was inline in HomeHero until
 * PORTAL-REGRESYON-2026-11-25, when Bugün replaced HomeHero as the live home and the shortcuts had to come back.
 */
import { KLINIK_PORTAL_IPUCU } from '@/lib/klinik/klinikPortal'

export const MODUL_IPUCU: Record<string, string> = {
  'asi-karnesi': 'Kayıtlı aşılar · PDF · yazdır',
  'asi-onam': 'Aşı öncesi bilgilendirme formlarınız',
  gozlerim: 'Kontrol, damla ve ölçümleriniz',
  derim: 'Kontrol, fotoğraf ve hatırlatmalarınız',
  ruhsagligim: 'Kontrol ve hatırlatmalarınız',
  kulaklarim: 'Kontrol, test ve işlem hatırlatmalarınız',
  kalbim: 'Kontrol ve kalp takibi hatırlatmalarınız',
  akcigerlerim: 'Kontrol, solunum testi ve inhaler hatırlatmalarınız',
  norolojim: 'Kontrol, form ve ilaç güvenlik hatırlatmalarınız',
  hormonlarim: 'Kontrol, kan tahlili ve hatırlatmalarınız',
  romatizmam: 'Kontrol, kan tahlili ve hatırlatmalarınız',
  tedavim: 'Kontrol, tedavi günü ve hatırlatmalarınız',
  'beyin-takibi': 'Kontrol, ameliyat sonrası ve görüntü hatırlatmalarınız',
  tetkiklerim: 'Tetkik durumu ve randevu tarihleriniz',
  'damar-cerrahisi-takibi': 'Kontrol, greft/yara ve ilaç izlem hatırlatmalarınız',
  'anestezi-oncesi': 'Anestezi öncesi kontrol ve hatırlatmalarınız',
  'acil-sonrasi': 'Acil sonrası kontrol ve kısa takip hatırlatmalarınız',
  ameliyatim: 'Kontrol, ameliyat ve yara hatırlatmalarınız',
  yaram: 'Kontrol, pansuman ve foto hatırlatmalarınız',
  sindirimim: 'Kontrol, endoskopi ve hatırlatmalarınız',
  'enfeksiyon-takibim': 'Kontrol, ilaç süre ve hatırlatmalarınız',
  urolojim: 'Kontrol ve hatırlatmalarınız',
  sporum: 'Kontrol ve antrenmana dönüş planınız',
  'on-anket': 'Muayene öncesi bilgileriniz',
}

/** Hint for one module key: chapter table, then the Özel Branşlar table, then a neutral caption. */
export function modulIpucu(anahtar: string): string {
  return MODUL_IPUCU[anahtar] || KLINIK_PORTAL_IPUCU[anahtar as keyof typeof KLINIK_PORTAL_IPUCU] || 'Uzmanınızın takibi'
}
