'use client'
/** ENDOKRINOLOJI-EXCEPTIONAL-01 — Araçlar › İnsülin/tiroid rejim (dates-only). Endokrinoloji-only. */
import EndoAracKabugu from '@/specialties/endokrinoloji/ui/araclar/EndoAracKabugu'
import EndoRejimAraci from '@/specialties/endokrinoloji/ui/araclar/EndoRejimAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <EndoAracKabugu route="/doktor-tools/endo-rejim" baslik="İnsülin / tiroid rejim kartı" aciklama="Yalnız başlangıç ve kontrol tarihleri. Ünite, mcg, mg ve kayan ölçek (sliding-scale) şeması yazılmaz — doz hekimin.">
      <EndoRejimAraci />
    </EndoAracKabugu>
  )
}
