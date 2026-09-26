'use client'
/** SPOR-HEKIMLIGI-EXCEPTIONAL-01 — Araçlar › RTP basamak. */
import SporAracKabugu from '@/specialties/spor-hekimligi/ui/araclar/SporAracKabugu'
import SporRtpAraci from '@/specialties/spor-hekimligi/ui/araclar/SporRtpAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <SporAracKabugu route="/doktor-tools/spor-rtp" baslik="RTP (spora dönüş) basamakları" aciklama="0–5 basamak karar desteği. Spora dönüş ve tanı hekimindir; doz yazılmaz.">
      <SporRtpAraci />
    </SporAracKabugu>
  )
}
