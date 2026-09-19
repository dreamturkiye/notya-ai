'use client'
/** NOROLOJI-EXCEPTIONAL-01 — Araçlar › İnme / TIA kırmızı bayrak triyaj. Nöroloji-only (BRANS_DOKTOR_ARACLARI). */
import NoroAracKabugu from '@/specialties/noroloji/ui/araclar/NoroAracKabugu'
import NoroInmeAraci from '@/specialties/noroloji/ui/araclar/NoroInmeAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <NoroAracKabugu route="/doktor-tools/noro-inme" baslik="İnme / TIA kırmızı bayrak triyaj" aciklama="Ani yüz kayması, konuşma bozukluğu, güç kaybı ve diğer BE-FAST belirtilerini işaretleyin. “Hemen” bandında hekim onayı olmadan kayıt yok; tanı yazılmaz.">
      <NoroInmeAraci />
    </NoroAracKabugu>
  )
}
