'use client'
/** KLINIK-AYNA-01 — Klinik chapter araç kabuğu. Gate: doktorAraciBransaUygun. */
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DoktorNav from '@/components/doktor/DoktorNav'
import { toolsShell } from '@/lib/doktor/toolsUi'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { doktorAraciBransaUygun } from '@/lib/doktor/doktorAraclari'
import { AracVurguSaglayici, aracStil, HastaSecici, type AracVurgu } from '@/lib/doktor/aracUi'

export function KlinikHastaSecici({ secili, sec }: { secili: string; sec: (id: string, ad: string) => void }) {
  return <HastaSecici secili={secili} sec={sec} />
}

export default function KlinikAracKabugu({
  route, baslik, aciklama, etiket, vurgu, children,
}: {
  route: string
  baslik: string
  aciklama: string
  etiket: string
  vurgu: AracVurgu
  children: React.ReactNode
}) {
  const router = useRouter()
  const [izin, setIzin] = useState<boolean | null>(null)
  const S = aracStil(vurgu)
  useEffect(() => {
    let iptal = false
    ;(async () => {
      try {
        const t = await ensureDoctorAccessToken()
        if (!t) { if (!iptal) { setIzin(false); router.replace('/doktor-tools') } return }
        const r = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${t}` } })
        const j = r.ok ? await r.json() : null
        const ok = doktorAraciBransaUygun(route, j?.data?.specialty)
        if (!iptal) { setIzin(ok); if (!ok) router.replace('/doktor-tools') }
      } catch { if (!iptal) { setIzin(false); router.replace('/doktor-tools') } }
    })()
    return () => { iptal = true }
  }, [router, route])

  return (
    <AracVurguSaglayici vurgu={vurgu}>
      <div style={{ ...toolsShell, overflowX: 'hidden' }}>
        <DoktorNav />
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px 56px', boxSizing: 'border-box' }}>
          {!izin ? (
            <div style={{ color: '#9BB0C7', fontSize: 15, padding: '12px 0' }}>{izin === null ? 'Yükleniyor…' : `Bu araç yalnızca ${etiket} için.`}</div>
          ) : (
            <>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: vurgu.baslik, letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: 8 }}>Araçlar · {etiket}</div>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#EDF1F7', margin: 0, letterSpacing: '-0.4px', lineHeight: 1.2 }}>{baslik}</h1>
                <p style={{ margin: '8px 0 0', fontSize: 15, color: '#9BB0C7', lineHeight: 1.5, maxWidth: 680 }}>{aciklama}</p>
              </div>
              {children}
            </>
          )}
        </div>
      </div>
    </AracVurguSaglayici>
  )
}

export {
  Alan, Etiketli, Istatistik, TaslakNotu, KopyalaButonu, MuayeneFormunaEkle, useUrlHasta, aracStil,
} from '@/lib/doktor/aracUi'
