'use client'
/** UROLOJI-EXCEPTIONAL-01 — Araçlar › Hematuri/taş acil. */
import UroAracKabugu from '@/specialties/uroloji/ui/araclar/UroAracKabugu'
import UroAcilAraci from '@/specialties/uroloji/ui/araclar/UroAcilAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <UroAracKabugu route="/doktor-tools/uro-acil" baslik="Hematuri / taş acil triyaj" aciklama="Makroskopik hematüri, retansiyon, flank+ateş, torsiyon, priapizm ve üretra travması için kırmızı bayrak kapısı. Tanı koymaz; 112 yönlendirir.">
      <UroAcilAraci />
    </UroAracKabugu>
  )
}
