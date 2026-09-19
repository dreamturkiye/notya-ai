'use client'
/** DERM-EXCEPTIONAL-01 — Araçlar › Derm kohort paneli. Dermatoloji-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde DermAracKabugu. */
import DermAracKabugu from '@/specialties/dermatoloji/ui/araclar/DermAracKabugu'
import DermKohortPaneli from '@/specialties/dermatoloji/ui/araclar/DermKohortPaneli'
import KonsultasyonKohortSatiri from '@/components/doktor/KonsultasyonKohortSatiri'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <DermAracKabugu route="/doktor-tools/derm-kohort" baslik="Derm kohort paneli" aciklama="Kendi hastalarınızda geciken TBSE, bekleyen yama okuması, açılan fototerapi arası, β-hCG ve lab takibi ile açık lezyon görevlerini tek listede görün; tek dokunuşla hasta-güvenli hatırlatma gönderin.">
      <DermKohortPaneli />
      {/* KONSULTASYON-01: evrensel satır — yanıt bekleyen konsültasyonlar (yeni araç değil) */}
      <KonsultasyonKohortSatiri />
    </DermAracKabugu>
  )
}
