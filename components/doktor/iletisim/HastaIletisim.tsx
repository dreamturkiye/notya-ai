'use client'
/**
 * NOTYA-ILETISIM-01 — hasta profili › İletişim: the patient's WhatsApp / e-posta consent (editable; every
 * change is recorded with who and when) and the last few contacts from the log.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { iletisimIstek } from '@/lib/iletisim/istemci'
import { KANAL_ETIKETI, TUR_ETIKETI, type IletisimKanali, type MesajTuru } from '@/lib/iletisim/tipler'

type Izin = { whatsapp: boolean | null; eposta: boolean | null; guncelleme: string | null; kaydedilebilir: boolean }
type Kayit = { id: string; kanal: IletisimKanali; tur: MesajTuru; durum: 'acildi' | 'gonderildi'; gonderen: string; tarih: string }

const R = CHROME_RENK
const tarihSaat = (iso: string) => new Date(iso).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

export default function HastaIletisim({ patientId }: { patientId: string }) {
  const [izin, setIzin] = useState<Izin | null>(null)
  const [kayitlar, setKayitlar] = useState<Kayit[]>([])
  const [kaydediliyor, setKaydediliyor] = useState<IletisimKanali | null>(null)
  const [hata, setHata] = useState('')

  const yukle = useCallback(async () => {
    try {
      const [i, k] = await Promise.all([
        iletisimIstek<Izin>(`/api/doktor/iletisim/izin?patientId=${encodeURIComponent(patientId)}`),
        iletisimIstek<{ kayitlar: Kayit[] }>(`/api/doktor/iletisim/kayit?patientId=${encodeURIComponent(patientId)}`),
      ])
      setIzin(i)
      setKayitlar((k.kayitlar || []).slice(0, 5))
    } catch { /* the profile works without this card */ }
  }, [patientId])
  useEffect(() => { void yukle() }, [yukle])

  const degistir = async (kanal: IletisimKanali, deger: boolean) => {
    setKaydediliyor(kanal); setHata('')
    try {
      const j = await iletisimIstek<{ guncelleme: string }>('/api/doktor/iletisim/izin', { method: 'POST', govde: { patientId, kanal, izin: deger, kaynak: 'hasta_profili' } })
      setIzin((o) => (o ? { ...o, [kanal]: deger, guncelleme: j.guncelleme } : o))
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Kaydedilemedi.')
    } finally {
      setKaydediliyor(null)
    }
  }

  if (!izin) return null

  const satir = (kanal: IletisimKanali, etiket: string) => {
    const deger = izin[kanal]
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 44, cursor: izin.kaydedilebilir ? 'pointer' : 'default' }}>
        <input
          type="checkbox"
          checked={deger === true}
          disabled={!izin.kaydedilebilir || kaydediliyor === kanal}
          onChange={(e) => void degistir(kanal, e.target.checked)}
          style={{ width: 20, height: 20, accentColor: R.pine }}
        />
        <span style={{ fontSize: 14, color: R.ink }}>
          {etiket}
          {deger === null && <span style={{ color: R.muted }}> · henüz sorulmadı</span>}
        </span>
      </label>
    )
  }

  return (
    <div style={{ background: R.paper, border: `1px solid ${R.border}`, borderRadius: 16, padding: '14px 16px', fontFamily: CHROME_FONT.sans }}>
      <div style={{ fontSize: 13, color: R.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>İletişim izni</div>
      {satir('whatsapp', 'Randevu ve bilgilendirme mesajları WhatsApp ile gönderilebilir')}
      {satir('eposta', 'Randevu ve bilgilendirme mesajları e-posta ile gönderilebilir')}
      {izin.guncelleme && <div style={{ fontSize: 12, color: R.muted, marginTop: 2 }}>Son güncelleme: {tarihSaat(izin.guncelleme)}</div>}
      {!izin.kaydedilebilir && <div style={{ fontSize: 12, color: R.muted, marginTop: 4 }}>İletişim izni kısa süre içinde buradan düzenlenebilecek.</div>}
      {hata && <div style={{ fontSize: 13, color: R.warn, marginTop: 6 }}>{hata}</div>}

      {kayitlar.length > 0 && (
        <>
          <div style={{ fontSize: 13, color: R.muted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 6px' }}>Son iletişimler</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {kayitlar.map((k) => (
              <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderTop: `1px solid ${R.borderSoft}`, fontSize: 13 }}>
                <span style={{ color: R.ink, minWidth: 0 }}>
                  {TUR_ETIKETI[k.tur] || 'Mesaj'} · {KANAL_ETIKETI[k.kanal] || k.kanal}
                  <span style={{ color: R.muted }}> · {k.gonderen}</span>
                </span>
                <span style={{ color: R.muted, flexShrink: 0 }}>
                  {tarihSaat(k.tarih)}{k.durum === 'acildi' ? ' · açıldı' : ''}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
