'use client'
/**
 * NOTYA-BLE-SANDBOX-01 — Ayarlar › Cihazlar.
 * Bluetooth tıbbi cihaz kurulumu (ateş, tansiyon, SpO₂, tartı, nabız, glukoz — standart GATT).
 * Yalnız Kaan + Dr. Gökhan sandbox’ında görünür; herkese açılana kadar kapalı.
 */
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { bleYetenek, bluetoothCihazTani, GATT_PROFILLER } from '@/core/bluetooth/webBluetooth'

type KayitliCihaz = {
  id: string
  cihaz_adi: string | null
  uretici: string | null
  model: string | null
  seri_no: string | null
  profil: string | null
  son_kullanim: string
}

const kart: React.CSSProperties = {
  background: '#FFFFFF',
  border: `1px solid ${CHROME_RENK.border}`,
  borderRadius: 16,
  padding: '16px 18px',
  boxShadow: '0 8px 18px rgba(58,44,34,0.045)',
}

export default function CihazlarAyarPage() {
  const router = useRouter()
  const [yetkili, setYetkili] = useState<boolean | null>(null)
  const [cihazlar, setCihazlar] = useState<KayitliCihaz[]>([])
  const [yetenek, setYetenek] = useState(() => (typeof window === 'undefined' ? null : bleYetenek()))
  const [durum, setDurum] = useState<'bos' | 'bekliyor' | 'hata'>('bos')
  const [mesaj, setMesaj] = useState('')
  const [takmaAd, setTakmaAd] = useState('')

  const yukle = useCallback(async () => {
    const token = await ensureDoctorAccessToken()
    if (!token) {
      setYetkili(false)
      return
    }
    const r = await fetch('/api/doktor/cihazlar', { headers: { Authorization: `Bearer ${token}` } })
    const d = (await r.json().catch(() => ({}))) as { yetkili?: boolean; cihazlar?: KayitliCihaz[]; error?: string }
    if (!r.ok || d.yetkili === false) {
      setYetkili(false)
      return
    }
    setYetkili(true)
    setCihazlar(d.cihazlar || [])
  }, [])

  useEffect(() => {
    setYetenek(bleYetenek())
    void yukle()
  }, [yukle])

  useEffect(() => {
    if (yetkili === false) router.replace('/dashboard/doktor/ayarlar')
  }, [yetkili, router])

  const eslestir = async () => {
    const y = bleYetenek()
    setYetenek(y)
    if (!y.destekli) {
      setMesaj(y.mesaj)
      setDurum('hata')
      return
    }
    setDurum('bekliyor')
    setMesaj('')
    try {
      const { cihaz, profil } = await bluetoothCihazTani()
      const token = await ensureDoctorAccessToken()
      if (!token) throw new Error('Oturum gerekli')
      const ad = takmaAd.trim() || [cihaz.uretici, cihaz.model].filter(Boolean).join(' ') || cihaz.ad || profil.ad
      const r = await fetch('/api/doktor/cihazlar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cihazAdi: ad,
          uretici: cihaz.uretici,
          model: cihaz.model,
          seriNo: cihaz.seriNo,
          profil: profil.ad,
        }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error((d as { error?: string }).error || 'Kaydedilemedi')
      setTakmaAd('')
      setDurum('bos')
      await yukle()
    } catch (e) {
      const m = e instanceof Error ? e.message : 'Cihaza bağlanılamadı'
      if (/cancel|User cancelled|chooser/i.test(m)) {
        setDurum('bos')
        return
      }
      setMesaj(m)
      setDurum('hata')
    }
  }

  const sil = async (id: string) => {
    const token = await ensureDoctorAccessToken()
    if (!token) return
    await fetch(`/api/doktor/cihazlar?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    await yukle()
  }

  if (yetkili === null) {
    return <p style={{ color: CHROME_RENK.muted, fontSize: 14 }}>Yükleniyor…</p>
  }
  if (!yetkili) return null

  return (
    <div>
      <a
        href="/dashboard/doktor/ayarlar"
        style={{
          fontFamily: CHROME_FONT.serif,
          fontStyle: 'italic',
          fontSize: 15,
          color: '#6d6055',
          marginBottom: 4,
          display: 'inline-block',
          textDecoration: 'none',
        }}
      >
        ‹ Ayarlar
      </a>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <h1
          style={{
            fontFamily: CHROME_FONT.serif,
            fontWeight: 500,
            fontSize: 32,
            margin: 0,
            color: '#2e251d',
            letterSpacing: '-0.02em',
          }}
        >
          Cihazlar
        </h1>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#0a7a8a',
            background: 'rgba(10,122,138,0.1)',
            border: '1px solid rgba(10,122,138,0.28)',
            borderRadius: 999,
            padding: '4px 10px',
          }}
        >
          Sandbox · yalnız siz
        </span>
      </div>
      <p style={{ fontSize: 14, color: CHROME_RENK.muted, marginBottom: 22, maxWidth: 640 }}>
        Klinik Bluetooth ölçüm cihazlarınızı buradan eşleştirin. Günlük kullanımda İnceleme → Yaşamsal Bulgular →{' '}
        <strong>Cihazdan al</strong> ile ölçüm alınır.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 640 }}>
        {/* Platform */}
        <section style={kart}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Bu cihazda Bluetooth</div>
          {yetenek?.destekli ? (
            <p style={{ margin: 0, fontSize: 14, color: '#1a8a63' }}>Hazır — Chrome / Edge ile standart tıbbi cihazlar seçilebilir.</p>
          ) : (
            <div>
              <p style={{ margin: '0 0 10px', fontSize: 14, color: CHROME_RENK.ink, lineHeight: 1.45 }}>{yetenek?.mesaj}</p>
              {yetenek?.sebep === 'ios-safari' && (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: CHROME_RENK.muted, lineHeight: 1.55 }}>
                  <li>
                    <a href="https://beacio.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#0a7a8a' }}>
                      beacio
                    </a>{' '}
                    (Safari eklentisi) — önerilen
                  </li>
                  <li>veya App Store’da iOSWebBLE / Bluefy</li>
                </ul>
              )}
            </div>
          )}
        </section>

        {/* Eşleştir */}
        <section style={kart}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Cihaz ekle</div>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: CHROME_RENK.muted, lineHeight: 1.45 }}>
            Desteklenen: ateş ölçer, tansiyon, pulse oksimetre, tartı, nabız, glukoz — Bluetooth SIG standart profili olanlar.
            OneTouch (LifeScan) özel protokol kullanır; bu yolla bağlanmaz.
          </p>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 650, color: CHROME_RENK.muted, marginBottom: 6 }}>
            Takma ad (isteğe bağlı)
          </label>
          <input
            value={takmaAd}
            onChange={(e) => setTakmaAd(e.target.value)}
            placeholder="Örn. Klinik ateş ölçer"
            style={{
              width: '100%',
              maxWidth: 360,
              marginBottom: 12,
              padding: '10px 12px',
              borderRadius: 10,
              border: `1px solid ${CHROME_RENK.border}`,
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
          <div>
            <button
              type="button"
              onClick={eslestir}
              disabled={durum === 'bekliyor'}
              style={{
                background: '#0F9B8E',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 700,
                cursor: durum === 'bekliyor' ? 'wait' : 'pointer',
                opacity: durum === 'bekliyor' ? 0.65 : 1,
              }}
            >
              {durum === 'bekliyor' ? 'Cihaz seçiliyor…' : 'Bluetooth ile eşleştir'}
            </button>
          </div>
          {durum === 'bekliyor' && (
            <p style={{ margin: '10px 0 0', fontSize: 12, color: CHROME_RENK.muted }}>
              Tarayıcı listesinden cihazı seçin. Ölçüm gerekmez — yalnız tanı.
            </p>
          )}
          {durum === 'hata' && (
            <div
              style={{
                marginTop: 12,
                padding: '10px 12px',
                borderRadius: 10,
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.35)',
                fontSize: 13,
                color: CHROME_RENK.ink,
              }}
            >
              {mesaj}
            </div>
          )}
        </section>

        {/* Liste */}
        <section style={kart}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Kayıtlı cihazlar</div>
          {cihazlar.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: CHROME_RENK.muted }}>Henüz eşleştirilmiş cihaz yok.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
              {cihazlar.map((c) => {
                const baslik = c.cihaz_adi || [c.uretici, c.model].filter(Boolean).join(' ') || 'Bluetooth cihaz'
                return (
                  <li
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '12px 0',
                      borderTop: `1px solid ${CHROME_RENK.border}`,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{baslik}</div>
                      <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 3 }}>
                        {[c.profil, c.seri_no ? `Seri ${c.seri_no}` : null].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void sil(c.id)}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${CHROME_RENK.border}`,
                        borderRadius: 8,
                        padding: '6px 10px',
                        fontSize: 12,
                        color: CHROME_RENK.muted,
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      Kaldır
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Desteklenen profiller */}
        <section style={kart}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Desteklenen standart profiller</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: CHROME_RENK.muted, lineHeight: 1.55 }}>
            {GATT_PROFILLER.map((p) => (
              <li key={p.id}>{p.ad}</li>
            ))}
          </ul>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: CHROME_RENK.muted, lineHeight: 1.45 }}>
            Uyumsuz örnekler: OneTouch (LifeScan — özel BLE), Eko / Littmann steteskop, KardiaMobile — bunlar için muayenede{' '}
            <strong>Cihazdan gelen dosya</strong> yolunu kullanın.
          </p>
        </section>
      </div>
    </div>
  )
}
