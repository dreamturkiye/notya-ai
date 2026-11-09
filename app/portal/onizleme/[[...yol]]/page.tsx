'use client'
/**
 * TR-PARITE-01 — /portal/onizleme: the doctor's preview of what a patient of HIS OWN branch sees in Sağlığım, with example
 * data only (lib/portal/onizleme.ts). The live portal's own pages are drawn inside the same shell and the same context
 * (PortalOnizlemeProvider), so the look is identical. The branch comes from the signed-in doctor's profile, never from the
 * URL. Pages that send or fetch (messages, appointment, home measurements, pre-visit form, vaccine card / consent) are
 * closed here. Each page is loaded on demand (next/dynamic).
 */
import React, { useEffect, useState, type ComponentType } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { onizlemePaketi } from '@/lib/portal/onizleme'
import { PortalShell } from '../../_components/PortalShell'
import { PortalOnizlemeProvider } from '../../_components/PortalLiveProvider'
import { SectionHeader } from '../../_components/ui'

const TABAN = '/portal/onizleme'

/** Read-only live pages, by their path segment. Anything else is closed in the preview. */
const SAYFALAR: Record<string, ComponentType> = {
  '': dynamic(() => import('@/app/portal/hasta/[token]/page')),
  'acil-sonrasi': dynamic(() => import('@/app/portal/hasta/[token]/acil-sonrasi/page')),
  'akcigerlerim': dynamic(() => import('@/app/portal/hasta/[token]/akcigerlerim/page')),
  'ameliyatim': dynamic(() => import('@/app/portal/hasta/[token]/ameliyatim/page')),
  'anestezi-oncesi': dynamic(() => import('@/app/portal/hasta/[token]/anestezi-oncesi/page')),
  'beslenmem': dynamic(() => import('@/app/portal/hasta/[token]/beslenmem/page')),
  'beyin-takibi': dynamic(() => import('@/app/portal/hasta/[token]/beyin-takibi/page')),
  'bobreklerim': dynamic(() => import('@/app/portal/hasta/[token]/bobreklerim/page')),
  'cocugumun-cerrahisi': dynamic(() => import('@/app/portal/hasta/[token]/cocugumun-cerrahisi/page')),
  'damar-cerrahisi-takibi': dynamic(() => import('@/app/portal/hasta/[token]/damar-cerrahisi-takibi/page')),
  'derim': dynamic(() => import('@/app/portal/hasta/[token]/derim/page')),
  'eklemlerim': dynamic(() => import('@/app/portal/hasta/[token]/eklemlerim/page')),
  'enfeksiyon-takibim': dynamic(() => import('@/app/portal/hasta/[token]/enfeksiyon-takibim/page')),
  'ergom': dynamic(() => import('@/app/portal/hasta/[token]/ergom/page')),
  'estetik-ameliyatim': dynamic(() => import('@/app/portal/hasta/[token]/estetik-ameliyatim/page')),
  'estetik-bakimim': dynamic(() => import('@/app/portal/hasta/[token]/estetik-bakimim/page')),
  'fizyom': dynamic(() => import('@/app/portal/hasta/[token]/fizyom/page')),
  'ftrm': dynamic(() => import('@/app/portal/hasta/[token]/ftrm/page')),
  'gecmis': dynamic(() => import('@/app/portal/hasta/[token]/gecmis/page')),
  'gogus-cerrahisi-takibim': dynamic(() => import('@/app/portal/hasta/[token]/gogus-cerrahisi-takibim/page')),
  'gozlerim': dynamic(() => import('@/app/portal/hasta/[token]/gozlerim/page')),
  'hormonlarim': dynamic(() => import('@/app/portal/hasta/[token]/hormonlarim/page')),
  'ilaclar': dynamic(() => import('@/app/portal/hasta/[token]/ilaclar/page')),
  'isitmem-odyoloji': dynamic(() => import('@/app/portal/hasta/[token]/isitmem-odyoloji/page')),
  'kalbim': dynamic(() => import('@/app/portal/hasta/[token]/kalbim/page')),
  'klinik-derim': dynamic(() => import('@/app/portal/hasta/[token]/klinik-derim/page')),
  'kulaklarim': dynamic(() => import('@/app/portal/hasta/[token]/kulaklarim/page')),
  'longevitim': dynamic(() => import('@/app/portal/hasta/[token]/longevitim/page')),
  'norolojim': dynamic(() => import('@/app/portal/hasta/[token]/norolojim/page')),
  'romatizmam': dynamic(() => import('@/app/portal/hasta/[token]/romatizmam/page')),
  'ruhsagligim': dynamic(() => import('@/app/portal/hasta/[token]/ruhsagligim/page')),
  'sacim': dynamic(() => import('@/app/portal/hasta/[token]/sacim/page')),
  'saglik-paketim': dynamic(() => import('@/app/portal/hasta/[token]/saglik-paketim/page')),
  'seanslarim': dynamic(() => import('@/app/portal/hasta/[token]/seanslarim/page')),
  'sindirimim': dynamic(() => import('@/app/portal/hasta/[token]/sindirimim/page')),
  'sonuclar': dynamic(() => import('@/app/portal/hasta/[token]/sonuclar/page')),
  'sporum': dynamic(() => import('@/app/portal/hasta/[token]/sporum/page')),
  'takibim': dynamic(() => import('@/app/portal/hasta/[token]/takibim/page')),
  'tedavim': dynamic(() => import('@/app/portal/hasta/[token]/tedavim/page')),
  'tetkiklerim': dynamic(() => import('@/app/portal/hasta/[token]/tetkiklerim/page')),
  'urolojim': dynamic(() => import('@/app/portal/hasta/[token]/urolojim/page')),
  'yaram': dynamic(() => import('@/app/portal/hasta/[token]/yaram/page')),
  'ziyaretler': dynamic(() => import('@/app/portal/hasta/[token]/ziyaretler/page')),
}

type Durum = { tur: 'bekliyor' } | { tur: 'yok' } | { tur: 'hazir'; paket: NonNullable<ReturnType<typeof onizlemePaketi>> }

export default function PortalOnizlemePage({ params }: { params: { yol?: string[] } }) {
  const router = useRouter()
  const [durum, setDurum] = useState<Durum>({ tur: 'bekliyor' })
  useEffect(() => {
    let iptal = false
    ;(async () => {
      const t = await ensureDoctorAccessToken()
      if (!t) { router.replace('/giris'); return }
      try {
        const r = await fetch('/api/users/me', { headers: { Authorization: 'Bearer ' + t } })
        if (!r.ok) { router.replace('/giris'); return }
        const j = await r.json()
        const paket = onizlemePaketi(j?.data?.specialty, new Date().toISOString().slice(0, 10))
        if (!iptal) setDurum(paket ? { tur: 'hazir', paket } : { tur: 'yok' })
      } catch { if (!iptal) router.replace('/giris') }
    })()
    return () => { iptal = true }
  }, [router])

  if (durum.tur === 'bekliyor') return null
  if (durum.tur === 'yok') return <div style={{ padding: 32, fontFamily: 'system-ui, sans-serif', color: '#5b4f45' }}>Branşınız profilinizde kayıtlı değil; önizleme gösterilemiyor.</div>
  const { paket } = durum
  const yol = (params.yol || [])[0] || ''
  const Sayfa = SAYFALAR[yol]
  return (
    <PortalOnizlemeProvider data={paket} basePath={TABAN}>
      <PortalShell basePath={TABAN} ekNav={paket.portal.nav} hastaAdi={paket.hasta.adSoyad}>
        <div data-alan="portal-onizleme" data-ornek="evet" data-brans={paket.brans.anahtar} role="note" style={{ margin: '0 16px 12px', padding: '10px 12px', borderRadius: 10, background: '#FFF7E6', border: '1px solid #E8C98A', color: '#5b4300', fontSize: 13, lineHeight: 1.45 }}>
          <b>Örnek veri — önizleme.</b> {paket.brans.etiket} hastanızın Sağlığım sayfası böyle görünür. Gerçek hasta bilgisi yoktur; mesaj, randevu ve formlar burada çalışmaz.
        </div>
        {Sayfa ? <Sayfa /> : (
          <div className="sg-fade">
            <SectionHeader title="Önizlemede kapalı" subtitle="Bu bölüm hastanın kendi bağlantısında çalışır; örnek veriyle gösterilmez." />
            <Link href={TABAN} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
          </div>
        )}
      </PortalShell>
    </PortalOnizlemeProvider>
  )
}
