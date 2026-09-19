'use client'
/** KBB-EXCEPTIONAL-01 — Araçlar › KBB kohort paneli. KBB-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde KbbAracKabugu. */
import KbbAracKabugu from '@/specialties/kulak-burun-bogaz/ui/araclar/KbbAracKabugu'
import KbbKohortAraci from '@/specialties/kulak-burun-bogaz/ui/araclar/KbbKohortAraci'
import KonsultasyonKohortSatiri from '@/components/doktor/KonsultasyonKohortSatiri'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <KbbAracKabugu route="/doktor-tools/kbb-kohort" baslik="KBB kohort paneli" aciklama="Kontrolü geciken, işitme testi yenilenmesi gereken, açık kırmızı bayrağı olan ve uyku tetkiki sevki bekleyen hastalar tek listede; seçtiklerinize klinik bilgi taşımayan hatırlatma gönderin.">
      <KbbKohortAraci />
      {/* KONSULTASYON-01: evrensel satır — yanıt bekleyen konsültasyonlar (yeni araç değil) */}
      <KonsultasyonKohortSatiri />
    </KbbAracKabugu>
  )
}
