'use client'
/** NEFROLOJI-EXCEPTIONAL-01 — Araçlar › Diyaliz seans. Nefroloji-only. */
import NefAracKabugu from '@/specialties/nefroloji/ui/araclar/NefAracKabugu'
import NefDiyalizAraci from '@/specialties/nefroloji/ui/araclar/NefDiyalizAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <NefAracKabugu route="/doktor-tools/nef-diyaliz" baslik="Diyaliz seans / takip" aciklama="Modalite ve seans tarihleri. Diyaliz makinesi / HBYS bağlantısı, UF, Kt/V ve reçete bu ürünün kapsamı dışındadır.">
      <NefDiyalizAraci />
    </NefAracKabugu>
  )
}
