'use client'

/**
 * NOTYA-AVATAR-01 — hekimin yuvarlak avatarı (karşılama ekranı + Ayarlar önizlemesi).
 *
 * Fotoğraf yoksa baş harf gösterilir: kırık görsel ya da boşluk değil, hasta dosyasındaki
 * kimlik başlığıyla aynı teal halka. Fotoğraf varsa GERÇEK fotoğraf gösterilir — bu depoda
 * görsel üreten sağlayıcı bağlı olmadığı için "karikatür" taklidi yapan bir filtre uygulanmaz
 * (bkz. docs/OPEN-COMMITMENTS.md).
 *
 * MOBİL DÜZELTMESİ (Kaan, 2026-09-19): telefonda avatar ELİPS görünüyordu. Neden: avatar dar
 * bir flex satırında duruyor (karşılama kartı) ve yalnız width/height verilmişti; alan daralınca
 * <img> yatayda eziliyordu. flexShrink tek başına yetmiyor çünkü esas sıkışma min-width: auto
 * davranışından geliyor. Çözüm: minWidth/maxWidth/minHeight/maxHeight ile kesin ölçü + aspectRatio
 * yedeği. Bundan sonra hangi kapta olursa olsun daire kalır.
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
    minWidth: boyut,
    maxWidth: boyut,
    minHeight: boyut,
    maxHeight: boyut,
    aspectRatio: '1 / 1',
    borderRadius: '50%',
    flexShrink: 0,
    flexGrow: 0,
    border: '1px solid rgba(15,155,142,0.45)',
    boxSizing: 'border-box',
    overflow: 'hidden',
  }

  if (fotoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- data URL; next/image optimizasyonu geçersiz
      <img
        src={fotoUrl}
        alt={`Dr. ${ad} profil fotoğrafı`}
        width={boyut}
        height={boyut}
        style={{ ...ortak, objectFit: 'cover', objectPosition: 'center', display: 'block', background: '#0D1C33' }}
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
        lineHeight: 1,
      }}
    >
      {doktorBasHarfleri(ad)}
    </div>
  )
}
