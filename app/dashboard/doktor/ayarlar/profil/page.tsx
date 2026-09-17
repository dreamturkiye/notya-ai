'use client'

/**
 * NOTYA-AVATAR-01 — Ayarlar › Profil fotoğrafı.
 * Kaan/Dr. Gökhan (2026-09-17): karşılama ekranında hekimin avatarı görünsün diye fotoğrafın
 * yükleneceği yer. Fotoğraf yüklenmezse karşılama ekranı baş harfli avatarla çalışmayı sürdürür.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import DoktorNav from '@/components/doktor/DoktorNav'
import DoktorAvatar from '@/components/doktor/DoktorAvatar'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { AVATAR_IZINLI_MIME, AVATAR_MAX_BYTES, avatarDogrula, AvatarGecersizError } from '@/lib/doktor/avatar'

const AVATAR_ONBELLEK = 'notya_doktor_avatar'

export default function ProfilFotografiPage() {
  const [ad, setAd] = useState('Doktor')
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [durum, setDurum] = useState<'yukleniyor' | 'bos' | 'kaydediyor' | 'kaydedildi'>('yukleniyor')
  const [hata, setHata] = useState('')
  const dosyaRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const t = await ensureDoctorAccessToken()
        const [me, av] = await Promise.all([
          fetch('/api/users/me', { headers: { Authorization: `Bearer ${t}` } }).then((r) => r.json()).catch(() => null),
          fetch('/api/doktor/profil/avatar', { headers: { Authorization: `Bearer ${t}` } }).then((r) => r.json()).catch(() => null),
        ])
        const isim = me?.data?.first_name || me?.data?.full_name || 'Doktor'
        setAd(isim)
        setFotoUrl(av?.avatar?.dataUrl || null)
      } catch {
        /* ad/fotoğraf okunamazsa baş harfli avatar gösterilir — sayfa yine çalışır */
      }
      setDurum('bos')
    })()
  }, [])

  /** Karşılama ekranı ilk boyamada bunu okur; sunucu yanıtı gelince tazelenir. */
  const onbellegeYaz = useCallback((deger: string | null) => {
    try {
      if (deger) localStorage.setItem(AVATAR_ONBELLEK, deger)
      else localStorage.removeItem(AVATAR_ONBELLEK)
    } catch {
      /* özel sekmede localStorage kapalı olabilir — avatar yine sunucudan gelir */
    }
  }, [])

  const secildi = async (dosya: File | undefined) => {
    if (!dosya) return
    setHata('')
    try {
      avatarDogrula(dosya.type || '', dosya.size)
    } catch (e) {
      setHata(e instanceof AvatarGecersizError ? e.message : 'Fotoğraf kabul edilmedi')
      return
    }

    setDurum('kaydediyor')
    try {
      const t = await ensureDoctorAccessToken()
      const form = new FormData()
      form.append('file', dosya)
      const r = await fetch('/api/doktor/profil/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
        body: form,
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || 'Fotoğraf yüklenemedi')
      setFotoUrl(j.avatar.dataUrl)
      onbellegeYaz(j.avatar.dataUrl)
      setDurum('kaydedildi')
      setTimeout(() => setDurum('bos'), 3000)
    } catch (e) {
      setDurum('bos')
      setHata(e instanceof Error ? e.message : 'Fotoğraf yüklenemedi')
    } finally {
      if (dosyaRef.current) dosyaRef.current.value = ''
    }
  }

  const kaldir = async () => {
    setHata('')
    setDurum('kaydediyor')
    try {
      const t = await ensureDoctorAccessToken()
      const r = await fetch('/api/doktor/profil/avatar', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${t}` },
      })
      if (!r.ok) throw new Error('Fotoğraf kaldırılamadı')
      setFotoUrl(null)
      onbellegeYaz(null)
      setDurum('bos')
    } catch (e) {
      setDurum('bos')
      setHata(e instanceof Error ? e.message : 'Fotoğraf kaldırılamadı')
    }
  }

  const dugme: React.CSSProperties = {
    background: '#0F9B8E',
    border: 'none',
    color: 'white',
    borderRadius: 999,
    padding: '9px 18px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  }

  return (
    <div style={{ backgroundColor: '#0A1628', minHeight: '100vh', color: 'white' }}>
      <DoktorNav />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
        <a href="/dashboard/doktor/ayarlar" style={{ color: '#8FA0B5', fontSize: 13, textDecoration: 'none' }}>← Ayarlar</a>
        <h1 style={{ fontSize: 22, margin: '10px 0 6px' }}>Profil fotoğrafı</h1>
        <p style={{ fontSize: 13, color: '#8FA0B5', marginBottom: 20 }}>
          Yüklediğiniz fotoğraf yalnız size görünür; karşılama ekranındaki adınızın yanında küçük bir
          yuvarlak avatar olarak çıkar. Fotoğraf yüklemezseniz baş harfleriniz gösterilir.
        </p>

        <div
          style={{
            background: 'linear-gradient(135deg, #10223D 0%, #0C1830 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: '20px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            flexWrap: 'wrap',
          }}
        >
          <DoktorAvatar ad={ad} fotoUrl={fotoUrl} boyut={72} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Hoş geldiniz, Dr. {ad}</div>
            <div style={{ fontSize: 12, color: '#8FA0B5', marginTop: 4 }}>
              {durum === 'yukleniyor'
                ? 'Yükleniyor…'
                : fotoUrl
                  ? 'Karşılama ekranında bu şekilde görünür.'
                  : 'Şu an baş harfli avatar kullanılıyor.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <button
            type="button"
            style={{ ...dugme, opacity: durum === 'kaydediyor' ? 0.6 : 1 }}
            disabled={durum === 'kaydediyor'}
            onClick={() => dosyaRef.current?.click()}
          >
            {durum === 'kaydediyor' ? 'Yükleniyor…' : fotoUrl ? 'Fotoğrafı değiştir' : 'Fotoğraf yükle'}
          </button>
          {fotoUrl && (
            <button
              type="button"
              onClick={kaldir}
              disabled={durum === 'kaydediyor'}
              style={{ ...dugme, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#C9D4E3' }}
            >
              Kaldır
            </button>
          )}
          <input
            ref={dosyaRef}
            type="file"
            accept={AVATAR_IZINLI_MIME.join(',')}
            style={{ display: 'none' }}
            onChange={(e) => secildi(e.target.files?.[0])}
          />
        </div>

        <p style={{ fontSize: 12, color: '#5F7189', marginTop: 12 }}>
          JPEG, PNG veya WebP · en fazla {Math.round(AVATAR_MAX_BYTES / (1024 * 1024))} MB
        </p>

        {durum === 'kaydedildi' && (
          <p style={{ fontSize: 13, color: '#22C55E', marginTop: 10 }}>Fotoğrafınız kaydedildi.</p>
        )}
        {hata && <p style={{ fontSize: 13, color: '#F87171', marginTop: 10 }}>{hata}</p>}
      </div>
    </div>
  )
}
