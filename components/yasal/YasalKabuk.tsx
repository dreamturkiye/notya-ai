import React from 'react'
import Link from 'next/link'
import { CHROME_RENK, CHROME_FONT, CHROME_FONT_HREF } from '@/lib/doktor/chromeTheme'

/**
 * HUKUK-01 (Kaan, 2026-10-17) — ortak kabuk ve tek kaynak sabitler: Türkiye yasal/politika sayfaları.
 * /kvkk sayfasının krem görünümü aynen korunur; her sayfa altta aynı güncelleme ve inceleme satırını taşır.
 *
 * DÜRÜSTLÜK KURALI: şirket henüz kurulmadı. Tüzel kişilik, MERSİS, adres gibi alanlar uydurulmaz;
 * köşeli parantezli yer tutucu aynen görünür ve şirket kuruluşunda doldurulur. Sertifika/denetim iddiası yazılmaz.
 */

export const YASAL_SON_GUNCELLEME = '17 Ekim 2026'
export const YASAL_INCELEME_NOTU = 'Bu metin hukuki incelemeden geçmektedir; avukat incelemesi tamamlandığında güncellenebilir.'
export const SIRKET_YER_TUTUCU = '[ŞİRKET UNVANI VE ADRESİ — şirket kuruluşunda doldurulacak]'
export const MERSIS_YER_TUTUCU = '[MERSİS NO — şirket kuruluşunda doldurulacak]'
export const MAHKEME_YER_TUTUCU = '[YETKİLİ MAHKEME VE İCRA DAİRELERİ — şirket kuruluşunda doldurulacak]'

/** Yasal sayfa dizini — alt gezinme ve /yasal merkez sayfası bundan okur. */
export const YASAL_SAYFALAR = [
  { yol: '/kullanim-kosullari', baslik: 'Kullanım Koşulları' },
  { yol: '/gizlilik', baslik: 'Gizlilik Politikası' },
  { yol: '/kvkk', baslik: 'KVKK Aydınlatma Metni' },
  { yol: '/veri-isleme', baslik: 'KVKK Veri İşleme Özeti' },
  { yol: '/cerez-politikasi', baslik: 'Çerez Politikası' },
  { yol: '/klinik-karar-destegi', baslik: 'Yapay Zekâ ve Klinik Karar Desteği' },
  { yol: '/iade-ve-iptal', baslik: 'İade ve İptal Politikası' },
  { yol: '/telif-hakki', baslik: 'Telif Hakkı ve Fikri Mülkiyet' },
] as const

export const YS = {
  wrap: { minHeight: '100dvh', background: CHROME_RENK.cream } as React.CSSProperties,
  page: { maxWidth: '820px', margin: '0 auto', padding: '64px 20px 96px', fontFamily: CHROME_FONT.sans, color: CHROME_RENK.ink, lineHeight: 1.7 } as React.CSSProperties,
  h1: { fontSize: '32px', fontWeight: 480, fontFamily: CHROME_FONT.serif, marginBottom: '8px' } as React.CSSProperties,
  meta: { fontSize: '13px', color: CHROME_RENK.muted, marginBottom: '40px' } as React.CSSProperties,
  h2: { fontSize: '19px', fontWeight: 500, marginTop: '40px', marginBottom: '12px' } as React.CSSProperties,
  p: { fontSize: '15px', marginBottom: '14px' } as React.CSSProperties,
  li: { fontSize: '15px', marginBottom: '8px' } as React.CSSProperties,
  box: { background: CHROME_RENK.paper, border: `1px solid ${CHROME_RENK.border}`, borderRadius: '8px', padding: '16px 18px', fontSize: '14px', marginBottom: '28px' } as React.CSSProperties,
  baglanti: { color: '#2f4334' } as React.CSSProperties,
}

export function YasalKabuk({
  baslik,
  altBaslik,
  aktifYol,
  children,
}: {
  baslik: string
  /** Başlığın altındaki tek satır (ör. dayanak mevzuat). Güncelleme tarihi kabuğun kendisinden gelir. */
  altBaslik?: string
  aktifYol: string
  children: React.ReactNode
}) {
  return (
    <div style={YS.wrap}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <div style={YS.page}>
        <Link href="/doktor" style={{ fontSize: '13px', color: '#2f4334', textDecoration: 'none' }}>← Notya</Link>
        <h1 style={YS.h1}>{baslik}</h1>
        <p style={YS.meta}>
          {altBaslik ? <>{altBaslik} · </> : null}
          Son güncelleme: 2026-10-17
        </p>
        {children}
        <p style={{ ...YS.meta, marginTop: '48px', marginBottom: '12px' }}>
          Son güncelleme: 2026-10-17 · {YASAL_INCELEME_NOTU}
        </p>
        <p style={{ ...YS.meta, marginBottom: '8px' }}>Bu metin bilgilendirme amaçlıdır ve hukuki danışmanlık yerine geçmez.</p>
        <nav aria-label="Yasal sayfalar" style={{ borderTop: `1px solid ${CHROME_RENK.border}`, paddingTop: '16px', fontSize: '13px' }}>
          {YASAL_SAYFALAR.filter((s) => s.yol !== aktifYol).map((s) => (
            <Link key={s.yol} href={s.yol} style={{ ...YS.baglanti, display: 'inline-block', marginRight: '14px', marginBottom: '6px' }}>
              {s.baslik}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
