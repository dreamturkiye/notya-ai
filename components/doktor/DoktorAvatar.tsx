'use client'

/**
 * NOTYA-AVATAR-01 — hekimin yuvarlak avatarı (karşılama ekranı + Ayarlar önizlemesi).
 *
 * Fotoğraf yoksa baş harf gösterilir: kırık görsel ya da boşluk değil, hasta dosyasındaki
 * kimlik başlığıyla aynı teal halka. Fotoğraf varsa GERÇEK fotoğraf gösterilir — bu depoda
 * görsel üreten sağlayıcı bağlı olmadığı için "karikatür" taklidi yapan bir filtre uygulanmaz
 * (bkz. docs/OPEN-COMMITMENTS.md).
 */
import { doktorBasHarfleri } from '@/lib/doktor/avatar'

export default function DoktorAvatar({
  ad,
  fotoUrl,
  boyut = 52,
}: {
  ad: string
  fotoUrl?: string | null
  boyut?: number
}) {
  const ortak: React.CSSProperties = {
    width: boyut,
    height: boyut,
    borderRadius: '50%',
    flexShrink: 0,
    border: '1px solid rgba(15,155,142,0.45)',
    boxSizing: 'border-box',
  }

  if (fotoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- data URL; next/image optimizasyonu geçersiz
      <img
        src={fotoUrl}
        alt={`Dr. ${ad} profil fotoğrafı`}
        style={{ ...ortak, objectFit: 'cover', background: '#0D1C33' }}
      />
    )
  }

  return (
    <div
      aria-label={`Dr. ${ad} baş harfleri`}
      style={{
        ...ortak,
        background: 'rgba(15,155,142,0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(boyut * 0.36),
        fontWeight: 800,
        color: '#2DD4BF',
        letterSpacing: 0.5,
      }}
    >
      {doktorBasHarfleri(ad)}
    </div>
  )
}
