'use client'
/**
 * Özel Branşlar › İstem · yönlendirme listesi (TR-PARITE-01). Dalın kendi listesi bransIstemleri( ) ile çözülür ve
 * Doktor Araçları'ndaki aynı seçiciyle (<BransIstemSecici …/>, KlinikIstemPaneli içinde) çizilir. Müttefik meslekte
 * liste yalnız hekime yönlendirmedir (md.16).
 */
import { OrtakAracKabugu } from '@/lib/doktor/aracUi'
import { klinikSlugCoz } from '@/lib/specialties/klinikDikey'
import KlinikIstemPaneli from '@/components/klinik/KlinikIstemPaneli'

export const dynamic = 'force-dynamic'

const ozelBransMi = (s: string | null | undefined) => !!klinikSlugCoz(s)

export default function Page() {
  return (
    <OrtakAracKabugu route="/ozel-branslar/istem-listesi" ustEtiket="Özel Branşlar" izinVer={ozelBransMi} baslik="İstem · yönlendirme listesi" aciklama="Dalınızın sık istem ve yönlendirmeleri tek dokunuşla; künyeli tek sayfa olarak yazdırılır. Hiçbir şey kendiliğinden istenmez veya gönderilmez.">
      <KlinikIstemPaneli />
    </OrtakAracKabugu>
  )
}
