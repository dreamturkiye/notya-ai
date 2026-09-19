'use client'
/** GASTROENTEROLOJI-EXCEPTIONAL-01 — Araçlar › Endoskopi belge köprüsü. Gastroenteroloji-only. */
import GastroAracKabugu from '@/specialties/gastroenteroloji/ui/araclar/GastroAracKabugu'
import GastroEndoskopiAraci from '@/specialties/gastroenteroloji/ui/araclar/GastroEndoskopiAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <GastroAracKabugu route="/doktor-tools/gastro-endoskopi" baslik="Endoskopi belge köprüsü" aciklama="İşlem türü ve tarihi kaydedin; sonraki kontrol önerisi karar desteğidir. Tam endoskopi suite / HIS / ameliyathane yoktur.">
      <GastroEndoskopiAraci />
    </GastroAracKabugu>
  )
}
