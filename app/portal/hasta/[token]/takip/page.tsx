'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrackingView } from '../../../_components/TrackingView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SoftPanel } from '../../../_components/ui'

export default function HastaTrackingPage() {
  const { data, token, basePath } = usePortalLive()
  // NOTYA-DAH-WOW W2.7: iç hastalıkları takibi olan hastaya muayene öncesi anket kısayolu (yalnız PIN sonrası API ile).
  const [anket, setAnket] = useState(false)
  useEffect(() => { fetch(`/api/portal/hasta/${encodeURIComponent(token)}/dahiliye-anket`, { credentials: 'include' }).then((r) => (r.ok ? r.json() : null)).then((j) => setAnket(!!j?.uygun)).catch(() => undefined) }, [token])
  return (
    <>
      {/* MOBILE-REVIEW: .sg-fade parent gives the panel the portal's side inset; sg-hero-cta is a white hero pill (invisible on a white panel) */}
      {anket && <div className="sg-fade"><SoftPanel style={{ marginBottom: 12 }}><b>Muayene öncesi anket</b> — ev tansiyonu, şeker, kilo ve şikâyetlerinizi randevudan önce doktorunuza iletin.<div style={{ marginTop: 10 }}><Link href={`${basePath}/on-anket`} className="sg-pin-btn" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#f4f8fa' }}>Anketi doldur</Link></div></SoftPanel></div>}
      <TrackingView data={data} />
    </>
  )
}
