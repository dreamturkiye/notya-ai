'use client'

import { kutu } from './clinic-styles'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

export function InfertiliteStub() {
  return (
    <section style={kutu} data-kd="infertilite-stub">
      <h2 style={{ margin: 0, fontSize: 16 }}>İnfertilite</h2>
      <p style={{ fontSize: 13, color: CHROME_RENK.muted }}>
        Bu yüzey henüz klinik karar desteği içermez. AMH, HSG, semen analizi, IUI/IVF sevk paketi sonraki sürümde
        bağlanacak — yarım bırakılmaz.
      </p>
    </section>
  )
}

export default InfertiliteStub
