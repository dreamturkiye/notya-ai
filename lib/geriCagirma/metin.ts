/**
 * GERI-CAGIRMA-01 — the words of the counter. Pure, client-safe, tested.
 *
 * HONEST COPY (Kaan: "We do not want to false advertise or overclaim"). The sentence says exactly what is stored:
 * how many patients booked AFTER a recall, how many of those attended, and the payments that were RECORDED. It never
 * says the recall caused the booking, never says "Notya kazandırdı", never shows an estimate as an amount, and shows
 * no amount at all when nothing was recorded.
 */
import { ATIF_PENCERESI_GUN, TAHSILAT_PENCERESI_GUN, type AylikSayac } from './tipler'

export function paraYaz(kurus: number, paraBirimi: string, yerel = 'tr-TR'): string {
  return new Intl.NumberFormat(yerel, { style: 'currency', currency: paraBirimi, maximumFractionDigits: 0 }).format(Math.round(kurus) / 100)
}

/** This month's line on the home card and on the recall screen. */
export function sayacCumlesi(s: AylikSayac, paraBirimi: string): string {
  if (s.randevuAlan <= 0) {
    return s.gonderilen > 0
      ? `Bu ay ${s.gonderilen} hasta geri çağrıldı · henüz randevu alan yok`
      : 'Bu ay henüz geri çağırma yapılmadı'
  }
  const parcalar = [`Bu ay geri çağırma sonrası ${s.randevuAlan} hasta randevu aldı`]
  if (s.gelen > 0) parcalar.push(`bunlardan ${s.gelen} hasta muayeneye geldi`)
  // An amount appears only when a payment was actually recorded for those visits.
  if (s.gelen > 0 && s.tahsilatKurus > 0) parcalar.push(`kaydedilen tahsilat ${paraYaz(s.tahsilatKurus, paraBirimi)}`)
  return parcalar.join(' · ')
}

export const cagrilabilirCumlesi = (n: number): string => `${n} hasta şu an geri çağrılabilir`

/** The info tooltip: the rule, in the doctor's language, with the same numbers the code uses. */
export const SAYIM_KURALI = [
  `Geri çağırma gittikten sonraki ${ATIF_PENCERESI_GUN} gün içinde aynı hasta için oluşturulan ve iptal edilmemiş randevular sayılır; mesajdaki kişiye özel bağlantıdan alınan randevu da buna dahildir.`,
  'Geri çağırmadan önce alınmış randevular ve bu süreden sonra alınanlar sayılmaz.',
  '“Muayeneye geldi” için randevunun tamamlandı olarak işaretlenmesi ya da randevu gününde muayene kaydı bulunması gerekir.',
  `Tutar yalnızca muhasebe bölümünde kaydedilmiş tahsilatlardan (muayene gününden sonraki ${TAHSILAT_PENCERESI_GUN} gün) gelir; tahmin içermez. Tahsilat kaydı yoksa tutar gösterilmez.`,
  'Bir hasta, kaç neden ya da mesaj olursa olsun, ayda bir kez sayılır.',
  'Bu sayılar sıralamayı gösterir: randevunun geri çağırma sayesinde alındığını kanıtlamaz.',
].join(' ')

export const KANAL_ADI: Record<'whatsapp' | 'sms' | 'eposta', string> = { whatsapp: 'WhatsApp', sms: 'SMS', eposta: 'E-posta' }
export const IZIN_YOK_ETIKETI = 'izin yok — arayın'
export const GONDERICI_YOK_ETIKETI = 'gönderim hesabı bağlı değil — arayın'
