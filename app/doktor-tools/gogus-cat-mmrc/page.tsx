'use client'
/** GOGUS-EXCEPTIONAL-01 — Araçlar › CAT / mMRC skorları. Göğüs-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde GogusAracKabugu. */
import GogusAracKabugu from '@/specialties/gogus-hastaliklari/ui/araclar/GogusAracKabugu'
import GogusCatMmrcAraci from '@/specialties/gogus-hastaliklari/ui/araclar/GogusCatMmrcAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <GogusAracKabugu route="/doktor-tools/gogus-cat-mmrc" baslik="CAT / mMRC skorları" aciklama="CAT 8 madde ve mMRC ile GOLD ABE grubunu hesaplar. Grup karar desteğidir; tanı ve doz sizdedir.">
      <GogusCatMmrcAraci />
    </GogusAracKabugu>
  )
}
