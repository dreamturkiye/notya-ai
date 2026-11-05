'use client'
/** Araçlar › Antibiyotik profilaksisi (KD-OPERATOR-01). Kadın hastalıkları ve doğum only (BRANS_DOKTOR_ARACLARI); gate in KdAracKabugu. */
import KdAracKabugu from '@/specialties/kadin-dogum/ui/araclar/KdAracKabugu'
import { AntibiyotikAraci } from '@/specialties/kadin-dogum/ui/araclar/OperatorAraclari'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <KdAracKabugu route="/doktor-tools/kd-antibiyotik" baslik="Antibiyotik profilaksisi" aciklama="Sezaryen, histerektomi ve büyük jinekolojik cerrahi için kiloya göre profilaksi: kilo eşiği, ağır alerji rejimi, tekrar doz uyarısı. Kaynağı ekranda; ajan ve doz kararı hekimindir.">
      <AntibiyotikAraci />
    </KdAracKabugu>
  )
}
