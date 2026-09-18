'use client'
/** DAH-EXCEPTIONAL-01 — Araçlar › SCORE2 / KVR. Dahiliye-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde DahiliyeAracKabugu. */
import DahiliyeAracKabugu from '@/specialties/dahiliye/ui/araclar/DahiliyeAracKabugu'
import Score2Araci from '@/specialties/dahiliye/ui/araclar/Score2Araci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <DahiliyeAracKabugu route="/doktor-tools/dahiliye-score2" baslik="SCORE2 / KVR" aciklama="Yaş, cinsiyet, sigara, kan basıncı ve lipidlerle 10 yıllık kardiyovasküler risk; diyabet ve ≥70 yaşta SCORE2-Diabetes / SCORE2-OP'ye geçer. Kova ve LDL hedefi taslaktır, hekim kilidiyle kesinleşir.">
      <Score2Araci />
    </DahiliyeAracKabugu>
  )
}
