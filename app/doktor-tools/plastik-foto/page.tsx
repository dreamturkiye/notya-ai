'use client'
/** PLASTIK-CERRAHI-EXCEPTIONAL-01 — Araçlar › Foto zaman çizgisi köprü. Plastik-only. */
import PlastikAracKabugu from '@/specialties/plastik-cerrahi/ui/araclar/PlastikAracKabugu'
import PlastikFotoAraci from '@/specialties/plastik-cerrahi/ui/araclar/PlastikFotoAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <PlastikAracKabugu route="/doktor-tools/plastik-foto" baslik="Foto zaman çizgisi köprü" aciklama="Klinik foto tarih ve etiketi. AI tanı, PASI/Fitzpatrick ve doz yazılmaz.">
      <PlastikFotoAraci />
    </PlastikAracKabugu>
  )
}
