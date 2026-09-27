'use client'

import { useEffect, useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { ensureDoctorAccessToken, DOKTOR_GIRIS } from '@/lib/doktor/clientAuth'
import { hafizaGrupla } from '@/lib/doktor/ogrenme/gorunum'
import type { HafizaKayit } from '@/lib/doktor/hafiza'

const ETIKET: Record<string, string> = {
  uslup: 'Üslup',
  klinik: 'Klinik',
  uygulama: 'Uygulama',
  rutin: 'Ritim',
  iletisim: 'İletişim',
  kisisel: 'Kişisel',
}

export default function AyseHafizasiPage() {
  const [kayitlar, setKayitlar] = useState<HafizaKayit[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)

  const yukle = async () => {
    const t = await ensureDoctorAccessToken()
    if (!t) { window.location.href = DOKTOR_GIRIS; return }
    const r = await fetch('/api/doktor/hafiza?tum=1', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' })
    const j = await r.json()
    setKayitlar(Array.isArray(j.kayitlar) ? j.kayitlar : [])
    setYukleniyor(false)
  }

  useEffect(() => { void yukle() }, [])

  const post = async (body: Record<string, unknown>) => {
    const t = await ensureDoctorAccessToken()
    await fetch('/api/doktor/hafiza', {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    await yukle()
  }

  const gruplar = hafizaGrupla(kayitlar)

  return (
    <div style={{ maxWidth: 720, fontFamily: CHROME_FONT.sans }}>
      <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4 }}>Ayarlar</div>
      <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 32, margin: '0 0 6px', color: '#2e251d' }}>Ayşe’nin hafızası</h1>
      <p style={{ fontSize: 14, color: CHROME_RENK.muted, marginBottom: 22 }}>
        Öğrendiği her kural burada. Uygulanır olanlar bir sonraki nota girer. Unut bir kez dokunuş.
      </p>
      {yukleniyor && <div style={{ color: CHROME_RENK.muted }}>Yükleniyor…</div>}
      {!yukleniyor && !gruplar.length && <div style={{ color: CHROME_RENK.muted }}>Henüz öğrenilen bir kural yok.</div>}
      {gruplar.map((g) => (
        <section key={g.kategori} style={{ marginBottom: 22 }}>
          <h2 style={{ fontFamily: CHROME_FONT.serif, fontSize: 20, fontWeight: 500, margin: '0 0 10px', color: '#2e251d' }}>{ETIKET[g.kategori] || g.kategori}</h2>
          {g.kayitlar.map((k) => {
            const kapali = k.durum === 'kapali' || k.aktif === false
            return (
              <div key={`${k.kategori}-${k.anahtar}`} style={{ background: '#fff', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 14, padding: '14px 16px', marginBottom: 8, opacity: kapali ? 0.55 : 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: CHROME_RENK.ink }}>{k.deger}</div>
                <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 4 }}>
                  {k.kaynak} · {k.kanit_sayisi} kanıt · {k.durum || (k.kesin ? 'uygulanır' : 'aday')}
                  {k.ilk_gorulme ? ` · ilk ${String(k.ilk_gorulme).slice(0, 10)}` : ''}
                  {k.son_gorulme ? ` · son ${String(k.son_gorulme).slice(0, 10)}` : ''}
                </div>
                {Array.isArray(k.ornekler) && k.ornekler.length > 0 && (
                  <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 6 }}>{k.ornekler.map((o) => `“${o}”`).join(' · ')}</div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {!kapali && (
                    <button type="button" onClick={() => void post({ kapat: k.anahtar })} style={{ border: `1px solid ${CHROME_RENK.border}`, background: '#fff', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      Kapat
                    </button>
                  )}
                  {kapali && (
                    <button type="button" onClick={() => void post({ anahtar: k.anahtar, durum: 'uygulanir' })} style={{ border: `1px solid ${CHROME_RENK.border}`, background: '#fff', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      Uygula
                    </button>
                  )}
                  <button type="button" onClick={() => void post({ unut: k.anahtar })} style={{ border: 'none', background: 'transparent', color: '#8C2F2F', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Unut
                  </button>
                </div>
              </div>
            )
          })}
        </section>
      ))}
    </div>
  )
}
