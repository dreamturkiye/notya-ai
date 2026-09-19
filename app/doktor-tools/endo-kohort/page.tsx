'use client'
/** ENDOKRINOLOJI-EXCEPTIONAL-01 — Araçlar › Kohort. Endokrinoloji-only. */
import EndoAracKabugu from '@/specialties/endokrinoloji/ui/araclar/EndoAracKabugu'
import EndoKohortAraci from '@/specialties/endokrinoloji/ui/araclar/EndoKohortAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <EndoAracKabugu route="/doktor-tools/endo-kohort" baslik="Endokrinoloji kohort paneli" aciklama="Geciken kontrol · lab/DXA izlem · açık acil bayrak · yüksek HbA1c bandı · 1-tap hasta-güvenli hatırlatma.">
      <EndoKohortAraci />
    </EndoAracKabugu>
  )
}
