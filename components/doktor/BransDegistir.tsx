'use client'

/**
 * NOTYA-SUPERUSER-BRANS-01 — üst menüdeki küçük "Branş: [seçici]".
 *
 * YALNIZ lib/auth/superuserBranslar.ts'teki iki doğrulanmış hesap için çizilir. Karar
 * sunucuya sorulur (`GET /api/users/superuser-brans` → `{ yetkili }`); istemcide izin
 * listesi ne tutulur ne de sızar. Yetkisiz her hekim için bu bileşen `null` döner —
 * ekranda hiçbir şey değişmez.
 */
import React, { useEffect, useState } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'

type Secenek = { anahtar: string; etiket: string }

export default function BransDegistir({ mobil = false }: { mobil?: boolean }) {
  const [yetkili, setYetkili] = useState(false)
  const [brans, setBrans] = useState('')
  const [secenekler, setSecenekler] = useState<Secenek[]>([])
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [hata, setHata] = useState('')

  useEffect(() => {
    ;(async () => {
      const token = await ensureDoctorAccessToken()
      if (!token) return
      try {
        const r = await fetch('/api/users/superuser-brans', { headers: { Authorization: `Bearer ${token}` } })
        if (!r.ok) return
        const d = await r.json()
        if (!d?.yetkili) return
        setYetkili(true)
        setBrans(String(d.brans || ''))
        setSecenekler(Array.isArray(d.secenekler) ? d.secenekler : [])
      } catch {
        /* sessiz — yetkisiz oturumda zaten hiçbir şey çizilmiyor */
      }
    })()
  }, [])

  const degistir = async (yeni: string) => {
    if (!yeni || yeni === brans) return
    setKaydediliyor(true)
    setHata('')
    try {
      const token = await ensureDoctorAccessToken()
      if (!token) { setHata('Oturum bulunamadı.'); setKaydediliyor(false); return }
      const r = await fetch('/api/users/superuser-brans', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ brans: yeni }),
      })
      if (!r.ok) {
        const d = await r.json().catch(() => null)
        setHata(d?.error || 'Branş değiştirilemedi.')
        setKaydediliyor(false)
        return
      }
      setBrans(yeni)
      // Muayene sayfası branşı localStorage'dan önbellekli okuyor (NOTYA-BRANS-02) —
      // güncellemezsek yeni branşa geçtikten sonra eski branşa kilitlenirdi.
      try { localStorage.setItem('notya_doktor_specialty', yeni) } catch { /* önbellek yoksa sorun değil */ }
      // Branşa bağlı durum panodan portala kadar dağınık; tek temiz yeniden yükleme
      // sayfa sayfa elle yenilemekten hem basit hem güvenilir.
      window.location.reload()
    } catch {
      setHata('Branş değiştirilemedi.')
      setKaydediliyor(false)
    }
  }

  if (!yetkili) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, minWidth: 0 }}>
      <label
        htmlFor="superuser-brans"
        style={{ color: '#8FA0B5', fontSize: mobil ? 11 : 12, fontWeight: 500, whiteSpace: 'nowrap' }}
      >
        Branş:
      </label>
      <select
        id="superuser-brans"
        value={brans}
        disabled={kaydediliyor}
        onChange={(e) => degistir(e.target.value)}
        title={hata || 'Aktif branşınızı değiştirin'}
        style={{
          background: 'rgba(255,255,255,0.08)',
          color: hata ? '#F87171' : '#DCE4EE',
          border: `1px solid ${hata ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.14)'}`,
          borderRadius: 8,
          padding: mobil ? '5px 6px' : '6px 8px',
          fontSize: mobil ? 11 : 12,
          // Dar tutuluyor: üst menü 1280px'de zaten dolu, geniş bir seçici "Çıkış Yap"ı
          // alt satıra itiyordu. Uzun etiketler açılır listede tam görünüyor.
          width: mobil ? 124 : 148,
          maxWidth: mobil ? 124 : 148,
          minHeight: mobil ? 36 : 32, // mobil dokunma hedefi kuralı: en az 36px
          cursor: kaydediliyor ? 'wait' : 'pointer',
        }}
      >
        {!brans && <option value="">Seçiniz</option>}
        {secenekler.map((s) => (
          <option key={s.anahtar} value={s.anahtar} style={{ background: '#0A1628' }}>
            {s.etiket}
          </option>
        ))}
      </select>
    </div>
  )
}
