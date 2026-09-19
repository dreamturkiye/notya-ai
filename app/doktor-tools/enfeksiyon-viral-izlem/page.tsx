'use client'
/** ENFEKSIYON-EXCEPTIONAL-01 — Araçlar › HIV/viral izlem. Enfeksiyon-only. */
import EnfAracKabugu from '@/specialties/enfeksiyon-hastaliklari/ui/araclar/EnfAracKabugu'
import EnfViralIzlemAraci from '@/specialties/enfeksiyon-hastaliklari/ui/araclar/EnfViralIzlemAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <EnfAracKabugu route="/doktor-tools/enfeksiyon-viral-izlem" baslik="HIV / viral izlem vadeleri" aciklama="Son izlem tarihi ve türe göre önerilen sonraki vade. CD4/viral yük yorumu ve tanı hekimdedir; doz yazılmaz.">
      <EnfViralIzlemAraci />
    </EnfAracKabugu>
  )
}
