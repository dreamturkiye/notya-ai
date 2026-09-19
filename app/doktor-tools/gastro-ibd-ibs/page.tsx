'use client'
/** GASTROENTEROLOJI-EXCEPTIONAL-01 — Araçlar › IBD / IBS skor. Gastroenteroloji-only. */
import GastroAracKabugu from '@/specialties/gastroenteroloji/ui/araclar/GastroAracKabugu'
import GastroIbdIbsAraci from '@/specialties/gastroenteroloji/ui/araclar/GastroIbdIbsAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <GastroAracKabugu route="/doktor-tools/gastro-ibd-ibs" baslik="IBD / IBS skor takip" aciklama="Mayo kısmi, Harvey-Bradshaw veya IBS-SSS skorunu girin; aktivite bandı karar desteğidir. Tanı yazılmaz, doz yazılmaz.">
      <GastroIbdIbsAraci />
    </GastroAracKabugu>
  )
}
