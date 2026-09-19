'use client'
/** PSIK-EXCEPTIONAL-01 — Araçlar › Güvenlik & acil triyaj. Psikiyatri-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde PsikAracKabugu. */
import PsikAracKabugu from '@/specialties/psikiyatri/ui/araclar/PsikAracKabugu'
import RiskAraci from '@/specialties/psikiyatri/ui/araclar/RiskAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <PsikAracKabugu route="/doktor-tools/psik-risk" baslik="Güvenlik & acil triyaj" aciklama="Özkıyım düşüncesi, kendine zarar, başkasına yönelik risk ve akut psikoz bayrakları → eylem yönlendirmesi, güvenlik kontrol listesi ve hekim onaylı kayıt. Bu akış portal mesajıyla yönetilmez; acil durumda 112.">
      <RiskAraci />
    </PsikAracKabugu>
  )
}
