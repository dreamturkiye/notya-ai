'use client'

import Link from 'next/link'
import type { PortalBundle, PortalHekim } from '@/lib/portal/types'
import { SoftPanel, formatTrDate } from './ui'
import { PortalOzetGorunumu, type PortalOzetSozleri } from '@/components/doktor/portal/PortalOzetGorunumu'
import { HedefBoyAileKart } from '@/components/hedefBoy/HedefBoyManken'
import { portalModulAktif } from '@/lib/portal/moduller'
import { KLINIK_PORTAL_IPUCU } from '@/lib/klinik/klinikPortal'
import { doktorBasHarfleri } from '@/lib/doktor/avatar'

const SOZLER: PortalOzetSozleri = {
  karsilamaAria: 'Sağlığım karşılama',
  markaAria: 'Notya Sağlığım',
  marka: 'Notya',
  urun: 'Sağlığım',
  hastaEtiketi: 'Hasta',
  lede: 'Kayıtlar, sonuçlar ve mesajlar tek yerde.',
  ctaEtiket: 'Mesajlara git',
  hekimEtiketi: 'Doktorunuz',
  hekimAria: 'Doktorunuz',
  hekimBos: 'Muayenehane adresi ve telefonu hekim ayarlarından görünür.',
  kisayolBaslik: 'Kısayollar',
  aktiviteBaslik: 'Son aktivite',
  aktiviteBos: 'Henüz paylaşılmış aktivite yok.',
  aktiviteAc: 'Aç',
}

const MODUL_IPUCU: Record<string, string> = {
  'asi-karnesi': 'Kayıtlı aşılar · PDF · yazdır',
  gozlerim: 'Kontrol, damla ve ölçümleriniz',
  derim: 'Kontrol, fotoğraf ve hatırlatmalarınız',
  ruhsagligim: 'Kontrol ve hatırlatmalarınız',
  kulaklarim: 'Kontrol, test ve işlem hatırlatmalarınız',
  kalbim: 'Kontrol ve kalp takibi hatırlatmalarınız',
  akcigerlerim: 'Kontrol, solunum testi ve inhaler hatırlatmalarınız',
  norolojim: 'Kontrol, form ve ilaç güvenlik hatırlatmalarınız',
  hormonlarim: 'Kontrol, kan tahlili ve hatırlatmalarınız',
  romatizmam: 'Kontrol, kan tahlili ve hatırlatmalarınız',
  tedavim: 'Kontrol, tedavi günü ve hatırlatmalarınız',
  'beyin-takibi': 'Kontrol, ameliyat sonrası ve görüntü hatırlatmalarınız',
  tetkiklerim: 'Tetkik durumu ve randevu tarihleriniz',
  'damar-cerrahisi-takibi': 'Kontrol, greft/yara ve ilaç izlem hatırlatmalarınız',
  'anestezi-oncesi': 'Anestezi öncesi kontrol ve hatırlatmalarınız',
  'acil-sonrasi': 'Acil sonrası kontrol ve kısa takip hatırlatmalarınız',
  ameliyatim: 'Kontrol, ameliyat ve yara hatırlatmalarınız',
  yaram: 'Kontrol, pansuman ve foto hatırlatmalarınız',
  sindirimim: 'Kontrol, endoskopi ve hatırlatmalarınız',
  'enfeksiyon-takibim': 'Kontrol, ilaç süre ve hatırlatmalarınız',
  urolojim: 'Kontrol ve hatırlatmalarınız',
  sporum: 'Kontrol ve antrenmana dönüş planınız',
  'on-anket': 'Muayene öncesi bilgileriniz',
}

export function HomeHero({ basePath, data }: { basePath: string; data: PortalBundle }) {
  const yeniMesaj = (data.summary.bekleyenMesaj || 0) > 0
  const tetkikSayisi = data.summary.tetkikSayisi ?? data.results?.length ?? 0
  const chips = [
    { key: 'ilac', label: 'Aktif ilaç', value: String(data.summary.aktifIlac), href: `${basePath}/ilaclar`, vurgu: false as const },
    {
      key: 'mesaj',
      label: yeniMesaj ? 'Yeni mesaj' : 'Bekleyen mesaj',
      value: yeniMesaj ? 'Yeni mesajınız var!' : String(data.summary.bekleyenMesaj),
      href: `${basePath}/mesajlar`,
      vurgu: yeniMesaj,
      sayi: data.summary.bekleyenMesaj,
    },
    {
      key: 'tetkik',
      label: 'Tetkik sonuçlarınız',
      value: tetkikSayisi > 0 ? String(tetkikSayisi) : (data.summary.sonLabOzet || 'Henüz tetkik sonucu yok'),
      href: `${basePath}/sonuclar`,
      vurgu: false as const,
    },
    {
      key: 'kontrol',
      label: 'Yaklaşan kontrol',
      value: data.summary.yaklasanKontrol || 'Planlanmadı',
      href: `${basePath}/ziyaretler`,
      vurgu: false as const,
    },
  ]

  const shortcuts = [
    { label: 'Mesajlar', href: `${basePath}/mesajlar`, hint: 'Doktorunuzla yazışın' },
    { label: 'Ziyaretler', href: `${basePath}/ziyaretler`, hint: 'Ziyaret özetleri' },
    { label: 'Sonuçlar', href: `${basePath}/sonuclar`, hint: 'Tetkik, rapor ve belgeler' },
    { label: 'İlaçlarım', href: `${basePath}/ilaclar`, hint: 'Aktif reçeteler' },
    { label: 'Öykü', href: `${basePath}/gecmis`, hint: 'Alerji ve geçmiş' },
    { label: 'Takip', href: `${basePath}/takip`, hint: 'Yaşamsal bulgular' },
    // SAGLIGIM-PORTAL-REGISTRY — attached chapter modules only (e.g. Gözlerim for a göz practice)
    ...(data.portal?.nav || []).map((n) => ({
      label: n.label,
      href: `${basePath}${n.path}`,
      hint: MODUL_IPUCU[n.key] || KLINIK_PORTAL_IPUCU[n.key as keyof typeof KLINIK_PORTAL_IPUCU] || 'Uzmanınızın takibi',
    })),
  ]

  const hastaAdi = data.hasta?.adSoyad || null

  const hekim = data.hekim || {
    ad: 'Doktorunuz',
    brans: null,
    klinik: null,
    adres: null,
    telefon: null,
    telefonHref: null,
    avatarUrl: null,
  }

  return (
    <PortalOzetGorunumu
      s={SOZLER}
      hastaAdi={hastaAdi}
      ctaHref={`${basePath}/mesajlar`}
      kutucuk={portalModulAktif(data, 'asi-karnesi') ? { baslik: 'Aşı Karnesi', href: `${basePath}/asi-karnesi` } : { baslik: 'Koruyucu tıp', href: null }}
      hekim={{
        ad: hekim.ad,
        altSatir: [hekim.brans, hekim.klinik].filter(Boolean).join(' · '),
        adres: hekim.adres,
        telefon: hekim.telefon,
        telefonHref: hekim.telefonHref,
        avatarUrl: hekim.avatarUrl,
        harfler: doktorBasHarfleri(hekim.ad),
      }}
      uyari={
        data.summary.muayeneUyari48s
          ? {
              baslik: 'Muayeneniz yaklaşıyor',
              metin: `${data.summary.muayeneUyari48s} için randevunuz var. Gelemeyecekseniz lütfen haber verin.`,
              href: `${basePath}/ziyaretler`,
              cta: 'Detay',
            }
          : null
      }
      cipler={chips.map((c) => ({
        key: c.key,
        label: c.label,
        value: c.value,
        href: c.href,
        vurgu: c.vurgu,
        yeniAlt: c.vurgu ? `${c.sayi} okunmamış` : undefined,
        testId: c.key === 'mesaj' ? 'chip-bekleyen-mesaj' : c.key === 'tetkik' ? 'chip-tetkik' : undefined,
      }))}
      ekBolum={
        portalModulAktif(data, 'buyume') && data.hedefBoy
          ? {
              baslik: 'Hedef boy',
              icerik: (
                <SoftPanel>
                  <HedefBoyAileKart sonuc={data.hedefBoy} tema="portal" />
                  <Link href={`${basePath}/takip`} className="sg-hero-cta" style={{ marginTop: 12, display: 'inline-flex' }}>
                    Takipte gör <span className="sg-hero-cta-arrow" aria-hidden>→</span>
                  </Link>
                </SoftPanel>
              ),
            }
          : null
      }
      kisayollar={shortcuts}
      aktiviteler={data.summary.sonAktivite.map((a) => ({
        id: a.id,
        baslik: a.baslik,
        tarih: formatTrDate(a.tarih, true),
        href: a.href ? `${basePath}/${a.href}` : undefined,
      }))}
    />
  )
}
