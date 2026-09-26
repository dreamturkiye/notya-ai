'use client'
/** ACIL-TIP-EXCEPTIONAL-01 — Araçlar › Acil Tıp kohort. Acil-tip-only. */
import AtAracKabugu from '@/specialties/acil-tip/ui/araclar/AtAracKabugu'
import AtKohortAraci from '@/specialties/acil-tip/ui/araclar/AtKohortAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <AtAracKabugu route="/doktor-tools/acil-kohort" baslik="Acil Tıp kohort paneli" aciklama="Geciken kontrol · ESI 1–2 · kritik yol · sevk/taburcu · açık bayrak · tek dokunuşla hatırlatma. Acil yatak panosu / HBYS değildir.">
      <AtKohortAraci />
    </AtAracKabugu>
  )
}
