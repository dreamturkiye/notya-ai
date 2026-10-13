/**
 * KURAL — TÜRKÇE: Supabase Auth hata metinleri İngilizcedir ("Invalid login credentials", "Email not confirmed").
 * Kullanıcıya gösterilmeden önce burada Türkçeye çevrilir; karşılaştırma mantığı değişmez, yalnız gösterilen metin.
 */
export function authHataMesaji(ham: string | undefined | null, yedek = 'Giriş yapılamadı. Lütfen tekrar deneyin.'): string {
  const m = (ham || '').toLowerCase()
  if (!m) return yedek
  if (m.includes('invalid login credentials') || m.includes('invalid_grant')) return 'E-posta veya şifre hatalı.'
  if (m.includes('email not confirmed')) return 'E-posta adresiniz henüz onaylanmamış. Gelen kutunuzdaki onay bağlantısına tıklayın.'
  if (m.includes('already registered')) return 'Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.'
  if (m.includes('password')) return 'Şifre geçersiz. En az 8 karakter kullanın.'
  if (m.includes('email') && m.includes('invalid')) return 'E-posta adresi geçersiz görünüyor. Lütfen kontrol edin.'
  if (m.includes('fetch') || m.includes('network')) return 'Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.'
  // Uygulamanın kendi Türkçe mesajı ise olduğu gibi göster; tanınmayan İngilizce metin gösterilmez.
  return /[çğıİöşüÇĞÖŞÜ]/.test(ham || '') ? String(ham) : yedek
}
