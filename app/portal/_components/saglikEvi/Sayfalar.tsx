'use client'
/**
 * HASTA-PORTALI-GUNLUK — Türkiye containers of the daily health home pages: they read the portal bundle (doctor,
 * messages, visits, results) and the daily state, and hand Turkish words + actions to the shared views. The same
 * containers serve the live portal, the doctor's preview and the internal demo (GunlukKapsayici picks the mode).
 */
import type { ReactNode } from 'react'
import { usePortalLive } from '../PortalLiveProvider'
import { GunlukKapsayici, useGunluk } from './GunlukProvider'
import { SAGLIK_EVI_SOZLERI as S } from '@/lib/saglikEvi/sozler'
import { formatTrDate } from '@/components/doktor/portal/ui'
import { BugunGorunumu, type BugunKoprusu } from '@/components/doktor/portal/saglikEvi/BugunGorunumu'
import { GunlukKayitGorunumu } from '@/components/doktor/portal/saglikEvi/GunlukKayitGorunumu'
import { DozTakvimiGorunumu } from '@/components/doktor/portal/saglikEvi/DozTakvimiGorunumu'
import { KarneGorunumu } from '@/components/doktor/portal/saglikEvi/KarneGorunumu'
import { TercihlerGorunumu } from '@/components/doktor/portal/saglikEvi/TercihlerGorunumu'

function Durumlu({ children }: { children: (d: NonNullable<ReturnType<typeof useGunluk>['durum']>) => ReactNode }) {
  const g = useGunluk()
  if (g.hata && !g.durum) return <div className="sge"><p className="sge-not" style={{ padding: '40px 0', textAlign: 'center' }} role="alert">{g.hata}</p></div>
  if (!g.durum) return <div className="sge" aria-busy="true"><p className="sge-not" style={{ padding: '40px 0', textAlign: 'center' }}>Bugününüz hazırlanıyor…</p></div>
  return <>{children(g.durum)}</>
}

function useKopru(): BugunKoprusu {
  const { data, basePath } = usePortalLive()
  const v = data.visits?.[0]
  return {
    randevu: data.summary.muayeneUyari48s || data.summary.yaklasanKontrol || null,
    randevuHref: `${basePath}/ziyaretler`,
    mesajSayisi: data.summary.bekleyenMesaj || 0,
    mesajHref: `${basePath}/mesajlar`,
    sonZiyaret: v ? { baslik: v.basvuruNedeni || v.ozetKisa || v.brans, tarih: formatTrDate(v.tarih), href: `${basePath}/ziyaretler/${v.id}` } : null,
    sonucSayisi: data.summary.tetkikSayisi ?? data.results?.length ?? 0,
    sonucHref: `${basePath}/sonuclar`,
    karneHref: `${basePath}/karne`,
    gunlukHref: `${basePath}/gunluk`,
    dozHref: `${basePath}/doz-takvimi`,
    tercihHref: `${basePath}/tercihler`,
    kvkkHref: '/kvkk',
  }
}

function Bugun() {
  const { data } = usePortalLive()
  const g = useGunluk()
  const kopru = useKopru()
  return <Durumlu>{(d) => <BugunGorunumu s={S} durum={d} eylemler={g.eylemler} kopru={kopru} hastaAdi={data.hasta?.adSoyad || null} />}</Durumlu>
}
function Gunluk() { const g = useGunluk(); return <Durumlu>{(d) => <GunlukKayitGorunumu s={S} durum={d} eylemler={g.eylemler} />}</Durumlu> }
function Doz() { const g = useGunluk(); return <Durumlu>{(d) => <DozTakvimiGorunumu s={S} durum={d} eylemler={g.eylemler} />}</Durumlu> }
function Karne() { const { data } = usePortalLive(); const g = useGunluk(); return <Durumlu>{(d) => <KarneGorunumu s={S} durum={d} eylemler={g.eylemler} hastaAdi={data.hasta?.adSoyad || null} />}</Durumlu> }
function Tercihler() { const g = useGunluk(); return <Durumlu>{(d) => <TercihlerGorunumu s={S} durum={d} eylemler={g.eylemler} gorunum={g.gorunum} gorunumAyarla={g.gorunumAyarla} />}</Durumlu> }

export const BugunSayfasi = () => <GunlukKapsayici><Bugun /></GunlukKapsayici>
export const GunlukSayfasi = () => <GunlukKapsayici><Gunluk /></GunlukKapsayici>
export const DozTakvimiSayfasi = () => <GunlukKapsayici><Doz /></GunlukKapsayici>
export const KarneSayfasi = () => <GunlukKapsayici><Karne /></GunlukKapsayici>
export const TercihlerSayfasi = () => <GunlukKapsayici><Tercihler /></GunlukKapsayici>
