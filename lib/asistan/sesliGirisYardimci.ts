/**
 * NOTYA-SES-DANIS-HATA-01 (Kaan, canlı bulgu — dermatoloji hasta dosyası, "Ayşe'ye Danış" paneli).
 *
 * "Ayşe'ye Danış" panelindeki (components/doktor/HastaKonsult.tsx) "Konuş" düğmesi tarayıcının
 * yerleşik, ÜCRETSİZ Web Speech API'sini kullanır — YaziliSohbet / AsistanOturumContext'teki
 * `yaziliMikrofon` ile AYNI desen (ElevenLabs/Fish jetonu burada hiç yanmaz; bkz. YaziliSohbet.tsx
 * başlığı). Bu panelde branşa göre dallanan HİÇBİR ses mantığı yok — bu dosyadaki iki saf fonksiyon
 * o yüzden tüm branşlar + Klinik için TEK ve PAYLAŞILAN mekanizmadır.
 *
 * KÖK NEDEN ("Konuş'a bastım, konuştum — hiçbir şey olmadı"): iki ayrı sessiz-hata yolu, ikisi de
 * panel geneli (branşa özel değil):
 *   a) Tarayıcı SpeechRecognition'ı hiç sunmuyorsa (`!Ctor`) eski kod paneli AÇMADAN `hata`yı
 *      yazıyordu — panel kapalıyken hata metni DOM'a hiç girmiyordu, hekim mesajı asla görmüyordu.
 *   b) Tanıma `onerror` ile düşünce (mikrofon izni reddedildi / mikrofon yok / ağ hatası / konuşma
 *      algılanmadı) kod yalnız `dinliyor`u kapatıyordu — hiçbir mesaj göstermiyordu; "Konuş" düğmesi
 *      sessizce eski haline dönüyordu.
 * İkisi de hekime "nothing happens" olarak görünür. Fix: panel HER durumda açılır + hata kodu
 * okunabilir bir cümleye çevrilir (bkz. HastaKonsult.tsx `mikrofon()`).
 */

export interface SesliGirisKokusu {
  SpeechRecognition?: unknown
  webkitSpeechRecognition?: unknown
}

export const SESLI_GIRIS_DESTEKLENMIYOR_METNI = 'Bu tarayıcı sesli girişi desteklemiyor — yazarak sorun.'

/** Tarayıcı Web Speech API'sini (hiçbir önekle) hiç sunmuyorsa true. */
export function sesliGirisDesteklenmiyorMu(w: SesliGirisKokusu): boolean {
  return !(w.SpeechRecognition || w.webkitSpeechRecognition)
}

/**
 * `SpeechRecognitionErrorEvent.error` kodu → hekimin GÖRECEĞİ cümle. Bilinmeyen/boş kod da sessiz
 * kalmaz (varsayılan cümle döner). `aborted` kullanıcının kendi durdurmasıdır — hata değildir, boş
 * döner (çağıran taraf boş dizeyi `hata`ya yazmaz).
 */
export function sesliGirisHataMetni(kod: string | undefined | null): string {
  switch (kod) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Mikrofon izni verilmedi — tarayıcı adres çubuğundaki kilit/simgeden izin verip yeniden deneyin.'
    case 'audio-capture':
      return 'Mikrofon bulunamadı — cihazınızı kontrol edip tekrar deneyin.'
    case 'no-speech':
      return 'Ses alınamadı — tekrar deneyin veya yazarak sorun.'
    case 'network':
      return 'Ses tanıma servisine ulaşılamadı — bağlantınızı kontrol edin veya yazarak sorun.'
    case 'aborted':
      return ''
    default:
      return 'Sesli giriş durdu — tekrar deneyin veya yazarak sorun.'
  }
}
