'use client'
/** NEFROLOJI-EXCEPTIONAL-01 — Araçlar › Nefroloji kohort. Nefroloji-only. */
import NefAracKabugu from '@/specialties/nefroloji/ui/araclar/NefAracKabugu'
import NefKohortAraci from '@/specialties/nefroloji/ui/araclar/NefKohortAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <NefAracKabugu route="/doktor-tools/nef-kohort" baslik="Nefroloji kohort paneli" aciklama="Geciken kontrol · eGFR/anemi/diyaliz · açık acil · KDIGO kırmızı · tek dokunuşla hatırlatma. İlaç doz uyarısı yalnız hekim kontrol listesidir (mg yok).">
      <NefKohortAraci />
    </NefAracKabugu>
  )
}
