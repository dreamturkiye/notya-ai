'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { PortalBundle, PortalHekim } from '@/lib/portal/types'
import { SoftPanel, formatTrDate } from './ui'
import { HedefBoyAileKart } from '@/components/hedefBoy/HedefBoyManken'
import { portalModulAktif } from '@/lib/portal/moduller'
import { KLINIK_PORTAL_IPUCU } from '@/lib/klinik/klinikPortal'
import { doktorBasHarfleri } from '@/lib/doktor/avatar'

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

function HekimAvatar({ hekim, boyut = 96 }: { hekim: PortalHekim; boyut?: number }) {
  const stil: CSSProperties = {
    width: boyut,
    height: boyut,
    minWidth: boyut,
    maxWidth: boyut,
    minHeight: boyut,
    maxHeight: boyut,
    aspectRatio: '1 / 1',
    borderRadius: '50%',
    flexShrink: 0,
    overflow: 'hidden',
    boxSizing: 'border-box',
  }
  if (hekim.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- data URL; next/image uygulanmaz
      <img
        src={hekim.avatarUrl}
        alt=""
        width={boyut}
        height={boyut}
        className="sg-hekim-avatar-img"
        style={{ ...stil, objectFit: 'cover', objectPosition: 'center', display: 'block' }}
      />
    )
  }
  return (
    <div className="sg-hekim-avatar-harf" style={stil} aria-hidden>
      {doktorBasHarfleri(hekim.ad)}
    </div>
  )
}

function HekimKarti({ hekim }: { hekim: PortalHekim }) {
  const altSatir = [hekim.brans, hekim.klinik].filter(Boolean).join(' · ')
  return (
    <article className="sg-hekim-kart" aria-label="Doktorunuz">
      <div className="sg-hekim-kart-glow" aria-hidden />
      <div className="sg-hekim-kart-icerik">
        <div className="sg-hekim-avatar-wrap">
          <HekimAvatar hekim={hekim} />
        </div>
        <div className="sg-hekim-metin">
          <p className="sg-hekim-etiket">Doktorunuz</p>
          <h1 className="sg-hekim-ad">{hekim.ad}</h1>
          {altSatir ? <p className="sg-hekim-brans">{altSatir}</p> : null}
          <ul className="sg-hekim-iletisim">
            {hekim.adres ? (
              <li className="sg-hekim-satir">
                <span className="sg-hekim-ikon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </span>
                <span>{hekim.adres}</span>
              </li>
            ) : null}
            {hekim.telefon ? (
              <li className="sg-hekim-satir">
                <span className="sg-hekim-ikon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.9v2a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h2a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L7.1 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.6 2.6.7A2 2 0 0 1 22 16.9z" />
                  </svg>
                </span>
                {hekim.telefonHref ? (
                  <a href={hekim.telefonHref} className="sg-hekim-tel">
                    {hekim.telefon}
                  </a>
                ) : (
                  <span>{hekim.telefon}</span>
                )}
              </li>
            ) : null}
          </ul>
          {!hekim.adres && !hekim.telefon ? (
            <p className="sg-hekim-bos">Muayenehane adresi ve telefonu hekim ayarlarından görünür.</p>
          ) : null}
        </div>
      </div>
    </article>
  )
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
    <div className="sg-home">
      <section className="sg-hero sg-hero--hekim" aria-label="Sağlığım karşılama">
        {/* PORTAL-HEKIM-01 — Notya sol/üst kompakt; hekim kartı ana panel. */}
        <div className="sg-hero-side sg-hero-side--brand" aria-label="Notya Sağlığım">
          <div className="sg-hero-main sg-hero-main--compact">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sagligim/hero-walk.jpg" alt="" className="sg-hero-media" />
            <div className="sg-hero-veil" aria-hidden />
            <div className="sg-hero-copy">
              <div className="sg-hero-brand">
                <p className="sg-hero-brand-name">Notya</p>
                <span className="sg-hero-brand-sub">Sağlığım</span>
              </div>
              <span className="sg-hero-rule" aria-hidden />
              <p className="sg-hero-lede">
                Kayıtlar, sonuçlar ve mesajlar tek yerde.
              </p>
              <Link href={`${basePath}/mesajlar`} className="sg-hero-cta">
                Mesajlara git <span className="sg-hero-cta-arrow" aria-hidden>
                  →
                </span>
              </Link>
            </div>
          </div>

          {portalModulAktif(data, 'asi-karnesi') ? (
            <Link href={`${basePath}/asi-karnesi`} className="sg-hero-tile" aria-label="Aşı Karnesi">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sagligim/preventive-care.jpg" alt="" />
              <span className="sg-hero-tile-caption">Aşı Karnesi</span>
            </Link>
          ) : (
            <figure className="sg-hero-tile">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sagligim/preventive-care.jpg" alt="" />
              <figcaption className="sg-hero-tile-caption">Koruyucu tıp</figcaption>
            </figure>
          )}
        </div>

        <HekimKarti hekim={hekim} />
      </section>

      <div className="sg-home-body">
        {data.summary.muayeneUyari48s ? (
          <div className="sg-muayene-uyari sg-fade" role="status" data-testid="muayene-uyari-48s">
            <span className="sg-muayene-uyari-ikon" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </span>
            <div>
              <div className="sg-muayene-uyari-baslik">Muayeneniz yaklaşıyor</div>
              <div className="sg-muayene-uyari-metin">
                {data.summary.muayeneUyari48s} için randevunuz var. Gelemeyecekseniz lütfen haber verin.
              </div>
            </div>
            <Link href={`${basePath}/ziyaretler`} className="sg-muayene-uyari-cta">Detay</Link>
          </div>
        ) : null}

        <div className="sg-chip-grid sg-fade sg-fade-delay-1">
          {chips.map((c) => (
            <Link
              key={c.key}
              href={c.href}
              className={`sg-chip${c.vurgu ? ' sg-chip--yeni-mesaj' : ''}`}
              data-testid={c.key === 'mesaj' ? 'chip-bekleyen-mesaj' : c.key === 'tetkik' ? 'chip-tetkik' : undefined}
            >
              <div className="sg-chip-label">{c.label}</div>
              {c.vurgu ? (
                <div className="sg-chip-yeni-mesaj">
                  <span className="sg-chip-yeni-mesaj-balon" aria-hidden>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </span>
                  <div className="sg-chip-yeni-mesaj-metin">
                    <span className="sg-chip-yeni-mesaj-baslik">{c.value}</span>
                    <span className="sg-chip-yeni-mesaj-sayi">{c.sayi} okunmamış</span>
                  </div>
                </div>
              ) : (
                <div className="sg-chip-value">{c.value}</div>
              )}
            </Link>
          ))}
        </div>

        {portalModulAktif(data, 'buyume') && data.hedefBoy && (
          <section className="sg-home-section sg-fade sg-fade-delay-2">
            <h2 className="sg-display sg-home-section-title">Hedef boy</h2>
            <SoftPanel>
              <HedefBoyAileKart sonuc={data.hedefBoy} tema="portal" />
              <Link href={`${basePath}/takip`} className="sg-hero-cta" style={{ marginTop: 12, display: 'inline-flex' }}>
                Takipte gör <span className="sg-hero-cta-arrow" aria-hidden>→</span>
              </Link>
            </SoftPanel>
          </section>
        )}

        <section className="sg-home-section sg-fade sg-fade-delay-2">
          <h2 className="sg-display sg-home-section-title">Kısayollar</h2>
          <div className="sg-shortcut-grid">
            {shortcuts.map((s) => (
              <Link key={s.label} href={s.href} className="sg-shortcut">
                <div className="sg-shortcut-label">{s.label}</div>
                <div className="sg-shortcut-hint">{s.hint}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="sg-home-section sg-fade sg-fade-delay-3">
          <h2 className="sg-display sg-home-section-title">Son aktivite</h2>
          <SoftPanel className="sg-activity-panel">
            {data.summary.sonAktivite.length === 0 ? (
              <p className="sg-activity-empty">Henüz paylaşılmış aktivite yok.</p>
            ) : (
              data.summary.sonAktivite.map((a) => {
                const body = (
                  <>
                    <div className="sg-activity-main">
                      <div className="sg-activity-title">{a.baslik}</div>
                      <div className="sg-activity-meta">{formatTrDate(a.tarih, true)}</div>
                    </div>
                    {a.href ? <span className="sg-activity-open">Aç</span> : null}
                  </>
                )
                if (a.href) {
                  return (
                    <Link key={a.id} href={`${basePath}/${a.href}`} className="sg-activity-row">
                      {body}
                    </Link>
                  )
                }
                return (
                  <div key={a.id} className="sg-activity-row">
                    {body}
                  </div>
                )
              })
            )}
          </SoftPanel>
        </section>
      </div>
    </div>
  )
}
