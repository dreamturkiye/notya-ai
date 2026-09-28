import { redirect } from "next/navigation"

/**
 * NOTYA-KOK-DOKTOR-01 (Kaan, 2026-09-27): Notya'nın ilk öne çıkan dikeyi hekim uygulaması — alan adının kökü
 * (notya.io ve www.notya.io) doğrudan /doktor açılış sayfasına gider. Geçici (307) yönlendirme: dikeyler yeniden
 * öne çıkarılırsa tek satırla geri alınır. /home (çok dikeyli sayfa) yerinde kalır, doğrudan adresle açılır.
 *
 * Not: eski sürümde oturum çerezi varsa /dashboard'a yönlendiren bir dal vardı; redirect() bir istisna fırlattığı için
 * try/catch içinde yutuluyor ve hiç çalışmıyordu (herkes /home'a gidiyordu). Davranış aynı kalsın diye dal kaldırıldı;
 * oturum açık hekimin doğrudan panele gitmesi ayrı bir iş olarak değerlendirilebilir.
 */
export default function Root() {
  redirect("/doktor")
}
