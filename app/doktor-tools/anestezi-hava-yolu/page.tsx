'use client'
/** ANESTEZI-EXCEPTIONAL-01 — Araçlar › Hava yolu notu. Anestezi-only. */
import AnesteziAracKabugu from '@/specialties/anestezi/ui/araclar/AnesteziAracKabugu'
import AnesteziHavaYoluAraci from '@/specialties/anestezi/ui/araclar/AnesteziHavaYoluAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <AnesteziAracKabugu route="/doktor-tools/anestezi-hava-yolu" baslik="Hava yolu notu" aciklama="Hava yolu bayrakları ve tarihler. Tanı, entübasyon tekniği detayı ve mg doz yazılmaz.">
      <AnesteziHavaYoluAraci />
    </AnesteziAracKabugu>
  )
}
