'use client'
/**
 * Araçlar › Hasta Hatırlatma — NOTYA-ILETISIM-01 (Kaan, 2026-09-25): the message leaves from the doctor's
 * OWN WhatsApp or e-mail through the one send button (GonderDugmesi). The old Twilio SMS/WhatsApp path and
 * the "scheduled date" field (it only ever logged, nothing was scheduled) are gone. History = the contact log.
 */
import {
  normalizeHastalar,
  toolsCard,
  toolsErrorBox,
  toolsInput,
  toolsShell,
  type HastaOption,
} from '@/lib/doktor/toolsUi'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme'
import { iletisimIstek } from '@/lib/iletisim/istemci'
import { KANAL_ETIKETI, TUR_ETIKETI, type IletisimKanali, type MesajTuru } from '@/lib/iletisim/tipler'
import GonderDugmesi from '@/components/doktor/iletisim/GonderDugmesi'
import React, { useCallback, useEffect, useState } from 'react'

type Kayit = { id: string; hastaAdi: string; kanal: IletisimKanali; tur: MesajTuru; durum: 'acildi' | 'gonderildi'; gonderen: string; tarih: string }

/** Plain, non-clinical starting texts (no drug, test or result — details stay in Sağlığım). */
const SABLONLAR: Record<string, string> = {
  'Kontrol zamanı': 'Kontrol zamanınız geldi. Randevu için bizi arayabilir ya da bu mesaja yanıt yazabilirsiniz.',
  'Takip randevusu': 'Takip randevunuz yaklaşıyor. Uygun olduğunuz gün ve saati bize iletebilir misiniz?',
  'Tetkik ve raporlar': 'Bir sonraki randevunuza gelirken elinizdeki tetkik sonuçlarını ve raporları da getirmenizi rica ederiz.',
  'Sağlığım’a bakın': 'Sağlığım’da sizin için yeni bir bilgi var. Muayenehanemizin verdiği bağlantı ve PIN ile girebilirsiniz.',
}

export default function HatirlatmaPage() {
  const [hastalar, setHastalar] = useState<HastaOption[]>([])
  const [kayitlar, setKayitlar] = useState<Kayit[]>([])
  const [selectedHasta, setSelectedHasta] = useState('')
  const [mesaj, setMesaj] = useState('')
  const [error, setError] = useState('')

  const kayitlariYukle = useCallback(async () => {
    try {
      const j = await iletisimIstek<{ kayitlar: Kayit[] }>('/api/doktor/iletisim/kayit')
      setKayitlar(j.kayitlar || [])
    } catch { setKayitlar([]) }
  }, [])

  useEffect(() => {
    void (async () => {
      const token = await ensureDoctorAccessToken()
      if (!token) { setError('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.'); return }
      try {
        const hRes = await fetch('/api/doktor/hastalar', { headers: { Authorization: `Bearer ${token}` } })
        if (hRes.status === 401) { setError('Oturum geçersiz. Lütfen tekrar giriş yapın.'); return }
        setHastalar(hRes.ok ? normalizeHastalar(await hRes.json()) : [])
      } catch { setError('Hastalar alınamadı.') }
      await kayitlariYukle()
    })()
  }, [kayitlariYukle])

  return (
    <div style={toolsShell}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 48px' }}>
        <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4 }}>
          Araçlar
        </div>
        <h1 style={{ margin: 0, fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 32, color: '#2e251d', letterSpacing: '-0.02em' }}>Hasta Hatırlatma</h1>
        <p style={{ marginTop: 8, color: CHROME_RENK.muted, fontSize: 14 }}>Kendi WhatsApp’ınızdan ya da e-postanızdan, tek dokunuşla.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 20 }}>
          <div style={toolsCard}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Yeni hatırlatma</div>
            <select value={selectedHasta} onChange={(e) => setSelectedHasta(e.target.value)} style={{ ...toolsInput, marginBottom: 12 }}>
              <option value="">Hasta seçin</option>
              {hastalar.map((h) => (
                <option key={h.id} value={h.id} style={{ color: '#000' }}>
                  {h.label}
                </option>
              ))}
            </select>
            <textarea
              rows={4}
              value={mesaj}
              onChange={(e) => setMesaj(e.target.value)}
              placeholder="Mesajınızı yazın..."
              style={{ ...toolsInput, resize: 'vertical', marginBottom: 12 }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {Object.keys(SABLONLAR).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMesaj(SABLONLAR[key])}
                  style={{
                    padding: '6px 12px',
                    background: '#EFE9DC',
                    borderRadius: 999,
                    fontSize: 12,
                    cursor: 'pointer',
                    color: CHROME_RENK.muted,
                    border: `1px solid ${CHROME_RENK.border}`,
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
            {selectedHasta && mesaj.trim() ? (
              // Re-keyed on every change so the prepared text is always exactly what is in the box.
              <GonderDugmesi key={`${selectedHasta}|${mesaj}`} tur="serbest" patientId={selectedHasta} metin={mesaj} etiket="Gönder" onGonderildi={() => { setMesaj(''); void kayitlariYukle() }} />
            ) : (
              <div style={{ fontSize: 13, color: CHROME_RENK.muted }}>Hasta seçip mesajı yazın; sonra kendi WhatsApp’ınızdan ya da e-postanızdan gönderin.</div>
            )}
            {error && <div style={toolsErrorBox}>{error}</div>}
          </div>

          <div style={toolsCard}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Son gönderilenler</div>
            {kayitlar.length === 0 && (
              <div style={{ textAlign: 'center', color: CHROME_RENK.muted, padding: '40px 0' }}>Henüz mesaj yok</div>
            )}
            {kayitlar.map((item) => (
              <div
                key={item.id}
                style={{ padding: '14px 0', borderBottom: `1px solid ${CHROME_RENK.border}`, display: 'flex', alignItems: 'flex-start', gap: 12 }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{item.hastaAdi}</div>
                  <div style={{ color: CHROME_RENK.muted, fontSize: 14, margin: '2px 0' }}>{TUR_ETIKETI[item.tur] || 'Mesaj'} · {KANAL_ETIKETI[item.kanal] || item.kanal}</div>
                  <div style={{ fontSize: 12, color: CHROME_RENK.muted }}>
                    {item.tarih ? new Date(item.tarih).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }) : '—'} · {item.gonderen}
                  </div>
                </div>
                <div
                  style={{
                    padding: '2px 10px', borderRadius: 999, fontSize: 12, flexShrink: 0,
                    background: item.durum === 'gonderildi' ? '#E4F3EA' : '#FBF3DE',
                    color: item.durum === 'gonderildi' ? '#2E6E4E' : '#7A5B1E',
                  }}
                >
                  {item.durum === 'gonderildi' ? 'Gönderildi' : 'Açıldı'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
