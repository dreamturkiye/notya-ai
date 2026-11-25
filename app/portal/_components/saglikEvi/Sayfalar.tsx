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
import { BugunBasligi, BugunEylemleri, BugunGorunumu, BugunKopruYedek, type BugunBolumu, type BugunKoprusu } from '@/components/doktor/portal/saglikEvi/BugunGorunumu'
import { useRandevuAcik } from '../RandevuAcikBaglami'
import { doktorBasHarfleri } from '@/lib/doktor/avatar'
import { modulIpucu } from '@/lib/portal/modulIpucu'
import { GunlukKayitGorunumu } from '@/components/doktor/portal/saglikEvi/GunlukKayitGorunumu'
import { DozTakvimiGorunumu } from '@/components/doktor/portal/saglikEvi/DozTakvimiGorunumu'
import { KarneGorunumu } from '@/components/doktor/portal/saglikEvi/KarneGorunumu'
import { TercihlerGorunumu } from '@/components/doktor/portal/saglikEvi/TercihlerGorunumu'

function Durumlu({ children, yedek, bekliyor }: { children: (d: NonNullable<ReturnType<typeof useGunluk>['durum']>) => ReactNode; yedek?: (hata: string) => ReactNode; bekliyor?: ReactNode }) {
  const g = useGunluk()
  // Bugün: a failed daily-state load never leaves the home blank — the doctor bridge stays (PORTAL-REGRESYON-2026-11-25).
  if (g.hata && !g.durum && yedek) return <>{yedek(g.hata)}</>
  if (g.hata && !g.durum) return <div className="sge"><p className="sge-not" style={{ padding: '40px 0', textAlign: 'center' }} role="alert">{g.hata}</p></div>
  // PORTAL-TABAN-ONCE: the base actions (Randevu al / Doktoruma yaz) never wait for the daily state.
  if (!g.durum && bekliyor) return <>{bekliyor}</>
  if (!g.durum) return <div className="sge" aria-busy="true"><p className="sge-not" style={{ padding: '40px 0', textAlign: 'center' }}>{S.yukleniyor}</p></div>
  return <>{children(g.durum)}</>
}

function useKopru(): BugunKoprusu {
  const { data, basePath } = usePortalLive()
  // PORTAL-TABAN-ONCE: the doctor's online booking state, read once by HastaShell (no second request on the home).
  const randevuAcik = useRandevuAcik()
  const v = data.visits?.[0]
  return {
    randevu: data.summary.muayeneUyari48s || data.summary.yaklasanKontrol || null,
    // With booking ON, the upcoming appointment opens Randevu › Randevularım (Geliyorum / Başka saat seç / İptal et);
    // with booking OFF it opens Ziyaretler, as the earlier home's "Yaklaşan kontrol" chip did.
    randevuHref: randevuAcik ? `${basePath}/randevu` : `${basePath}/ziyaretler`,
    randevuAlHref: randevuAcik ? `${basePath}/randevu` : null,
    yazHref: `${basePath}/mesajlar?yaz=1`,
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
    // PORTAL-REGRESYON-2026-11-25 — the earlier Özet home's doctor card, 48 h alert, shortcuts and recent items.
    hekim: data.hekim ? {
      ad: data.hekim.ad,
      altSatir: [data.hekim.brans, data.hekim.klinik].filter(Boolean).join(' · '),
      adres: data.hekim.adres, telefon: data.hekim.telefon, telefonHref: data.hekim.telefonHref, avatarUrl: data.hekim.avatarUrl,
      harfler: doktorBasHarfleri(data.hekim.ad),
    } : null,
    muayeneUyari48s: data.summary.muayeneUyari48s || null,
    bolumler: bolumler(data, basePath),
    aktiviteler: (data.summary.sonAktivite || []).map((a) => ({ id: a.id, baslik: a.baslik, tarih: formatTrDate(a.tarih, true), href: a.href ? `${basePath}/${a.href}` : undefined })),
    veli: !!data.hasta?.onSekizAlti,
  }
}

/**
 * Bölümlerim: every attached chapter module (registry nav, never hardcoded per branş), then the core record sections.
 * Reads bundle.portal directly (same as portalModulAktif) so the registry never enters the patient's client bundle.
 */
function bolumler(data: ReturnType<typeof usePortalLive>['data'], basePath: string): BugunBolumu[] {
  const moduller = (data.portal?.nav || []).map((n) => ({ anahtar: n.key, ad: n.label, alt: modulIpucu(n.key), href: `${basePath}${n.path}`, modul: true }))
  return [
    ...moduller,
    { anahtar: 'ilaclar', ad: S.bolumIlaclar, alt: S.bolumIlaclarAlt(data.summary.aktifIlac || 0), href: `${basePath}/ilaclar` },
    { anahtar: 'gecmis', ad: S.bolumOyku, alt: S.bolumOykuAlt, href: `${basePath}/gecmis` },
    { anahtar: 'takip', ad: S.bolumTakip, alt: data.portal?.moduller.includes('buyume') && data.hedefBoy ? S.bolumTakipBuyumeAlt : S.bolumTakipAlt, href: `${basePath}/takip` },
  ]
}

function Bugun() {
  const { data } = usePortalLive()
  const g = useGunluk()
  const kopru = useKopru()
  return (
    <Durumlu
      yedek={() => <BugunKopruYedek s={S} kopru={kopru} durumMetni={S.gunlukYuklenemedi} hata hastaAdi={data.hasta?.adSoyad || null} />}
      bekliyor={<div className="sge sgb" aria-busy="true"><BugunBasligi s={S} hastaAdi={data.hasta?.adSoyad || null} veli={kopru.veli} /><BugunEylemleri s={S} kopru={kopru} /><p className="sge-not" style={{ padding: '32px 0', textAlign: 'center' }}>{S.yukleniyor}</p></div>}
    >
      {(d) => <BugunGorunumu s={S} durum={d} eylemler={g.eylemler} kopru={kopru} hastaAdi={data.hasta?.adSoyad || null} />}
    </Durumlu>
  )
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
