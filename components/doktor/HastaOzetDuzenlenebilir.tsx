'use client'

/**
 * Özet › Demografik bilgiler + Sağlık geçmişi — tıklayınca düzenle, PUT ile hasta kaydına yaz.
 * Hedef Boy burada değil (Araçlar › Hedef Boy).
 */

import React, { useState } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import {
  demografiEksikMi,
  saglikGecmisiEksikMi,
  type HastaOzetKayit,
} from '@/lib/doktor/hastaOzetKayit'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const panel: React.CSSProperties = {
  background: '#0D1C33',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
}

const inp: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 10,
  padding: '8px 10px',
  color: '#F4F7FB',
  fontSize: 14,
  fontWeight: 600,
}

type Props = {
  patientId: string
  patient: HastaOzetKayit & { id: string }
  dogumGoster: string | null
  onKaydedildi: (p: HastaOzetKayit) => void
}

function bilgiSatiri(etiket: string, deger: React.ReactNode) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#14B8A6', letterSpacing: '0.03em', minWidth: 132, flexShrink: 0 }}>{etiket}</span>
      <span style={{ fontSize: 15, fontWeight: 600, color: '#F4F7FB', lineHeight: 1.45, minWidth: 0 }}>{deger || '—'}</span>
    </div>
  )
}

function cipListesi(degerler: string[], renk: string, kenar: string) {
  return (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {degerler.map((k, i) => (
        <span key={i} style={{ fontSize: 12.5, fontWeight: 600, color: renk, background: `${kenar}1A`, border: `1px solid ${kenar}55`, borderRadius: 999, padding: '3px 11px' }}>{k}</span>
      ))}
    </span>
  )
}

function alan(etiket: string, children: React.ReactNode) {
  return (
    <label style={{ display: 'block', marginBottom: 10 }}>
      <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#14B8A6', marginBottom: 4 }}>{etiket}</span>
      {children}
    </label>
  )
}

export default function HastaOzetDuzenlenebilir({ patientId, patient, dogumGoster, onKaydedildi }: Props) {
  const [demografiAcik, setDemografiAcik] = useState(false)
  const [saglikAcik, setSaglikAcik] = useState(false)
  const [kaydediyor, setKaydediyor] = useState(false)
  const [hata, setHata] = useState('')

  const [adSoyad, setAdSoyad] = useState(patient.ad_soyad || '')
  const [dogum, setDogum] = useState(patient.dogum_tarihi || '')
  const [cinsiyet, setCinsiyet] = useState(patient.cinsiyet || '')
  const [telefon, setTelefon] = useState(patient.telefon || '')
  const [eposta, setEposta] = useState(patient.eposta || '')
  const [sehir, setSehir] = useState(patient.sehir || '')
  const [kan, setKan] = useState(patient.kan_grubu || '')
  const [anne, setAnne] = useState(patient.anne_adi || '')
  const [baba, setBaba] = useState(patient.baba_adi || '')
  const [kronik, setKronik] = useState((patient.kronik_hastaliklar || []).join(', '))
  const [alerji, setAlerji] = useState(patient.alerjiler || '')
  const [ilac, setIlac] = useState(patient.surekli_ilaclar || '')
  const [sigara, setSigara] = useState(patient.sigara_alkol || '')

  const syncForm = (p: HastaOzetKayit) => {
    setAdSoyad(p.ad_soyad || '')
    setDogum(p.dogum_tarihi || '')
    setCinsiyet(p.cinsiyet || '')
    setTelefon(p.telefon || '')
    setEposta(p.eposta || '')
    setSehir(p.sehir || '')
    setKan(p.kan_grubu || '')
    setAnne(p.anne_adi || '')
    setBaba(p.baba_adi || '')
    setKronik((p.kronik_hastaliklar || []).join(', '))
    setAlerji(p.alerjiler || '')
    setIlac(p.surekli_ilaclar || '')
    setSigara(p.sigara_alkol || '')
  }

  const kaydet = async (tur: 'demografi' | 'saglik') => {
    setKaydediyor(true)
    setHata('')
    try {
      const token = await ensureDoctorAccessToken()
      if (!token) throw new Error('Oturum bulunamadı.')
      const govde =
        tur === 'demografi'
          ? {
              ad_soyad: adSoyad,
              dogum_tarihi: dogum,
              cinsiyet,
              telefon,
              eposta,
              sehir,
              kan_grubu: kan,
              anne_adi: anne,
              baba_adi: baba,
            }
          : {
              kronik_hastaliklar: kronik,
              alerjiler: alerji,
              surekli_ilaclar: ilac,
              sigara_alkol: sigara,
            }
      const res = await fetch(`/api/doktor/hastalar/${patientId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(govde),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as { error?: string }).error || 'Kayıt başarısız')
      }
      const get = await fetch(`/api/doktor/hastalar/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await get.json()
      if (!get.ok) throw new Error(data.error || 'Güncel kayıt okunamadı')
      const p = data.patient as HastaOzetKayit
      onKaydedildi(p)
      syncForm(p)
      if (tur === 'demografi') setDemografiAcik(false)
      else setSaglikAcik(false)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Kayıt başarısız')
    } finally {
      setKaydediyor(false)
    }
  }

  const demografiEksik = demografiEksikMi(patient)
  const saglikEksik = saglikGecmisiEksikMi(patient)

  return (
    <>
      {hata && (
        <div style={{ ...panel, padding: 12, marginBottom: 12, color: CHROME_RENK.warn, fontSize: 13, borderColor: 'rgba(239,68,68,0.4)', gridColumn: '1 / -1' }}>
          {hata}
        </div>
      )}

      <div
        style={{
          ...panel,
          padding: '18px 20px',
          position: 'relative',
          overflow: 'hidden',
          cursor: !demografiAcik && demografiEksik ? 'pointer' : 'default',
        }}
        onClick={() => {
          if (!demografiAcik && demografiEksik) {
            syncForm(patient)
            setDemografiAcik(true)
          }
        }}
        role={!demografiAcik && demografiEksik ? 'button' : undefined}
        tabIndex={!demografiAcik && demografiEksik ? 0 : undefined}
        onKeyDown={(e) => {
          if (!demografiAcik && demografiEksik && e.key === 'Enter') {
            syncForm(patient)
            setDemografiAcik(true)
          }
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 20, right: 20, height: 2, borderRadius: 2, background: 'linear-gradient(90deg, #0F9B8E, transparent)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Demografik bilgiler</div>
          {!demografiAcik ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                syncForm(patient)
                setDemografiAcik(true)
              }}
              style={{ background: 'transparent', border: '1px solid rgba(45,212,191,0.35)', color: '#2DD4BF', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              Düzenle
            </button>
          ) : null}
        </div>
        {demografiEksik && !demografiAcik && (
          <div style={{ fontSize: 12, color: '#FBBF24', marginBottom: 6 }}>Eksik alan var — tıklayarak doldurun; kayıt tüm sisteme yazılır.</div>
        )}
        {!demografiAcik ? (
          <>
            {bilgiSatiri('Ad Soyad', patient.ad_soyad)}
            {bilgiSatiri('Doğum tarihi', dogumGoster)}
            {bilgiSatiri('Cinsiyet', patient.cinsiyet)}
            {bilgiSatiri('Anne adı', patient.anne_adi)}
            {bilgiSatiri('Baba adı', patient.baba_adi)}
            {bilgiSatiri('Telefon', patient.telefon)}
            {bilgiSatiri('E-posta', patient.eposta)}
            {bilgiSatiri('Şehir', patient.sehir)}
            {bilgiSatiri('Kan grubu', patient.kan_grubu ? cipListesi([patient.kan_grubu], CHROME_RENK.warn, '#EF4444') : null)}
          </>
        ) : (
          <div onClick={(e) => e.stopPropagation()}>
            {alan('Ad Soyad', <input style={inp} value={adSoyad} onChange={(e) => setAdSoyad(e.target.value)} />)}
            {alan('Doğum tarihi', <input style={inp} type="date" value={dogum} onChange={(e) => setDogum(e.target.value)} />)}
            {alan(
              'Cinsiyet',
              <select style={inp} value={cinsiyet} onChange={(e) => setCinsiyet(e.target.value)}>
                <option value="">—</option>
                <option value="Kadın">Kadın</option>
                <option value="Erkek">Erkek</option>
              </select>,
            )}
            {alan('Anne adı', <input style={inp} value={anne} onChange={(e) => setAnne(e.target.value)} placeholder="Ana adı" />)}
            {alan('Baba adı', <input style={inp} value={baba} onChange={(e) => setBaba(e.target.value)} />)}
            {alan('Telefon', <input style={inp} value={telefon} onChange={(e) => setTelefon(e.target.value)} placeholder="05xx xxx xx xx" />)}
            {alan('E-posta', <input style={inp} type="email" value={eposta} onChange={(e) => setEposta(e.target.value)} />)}
            {alan('Şehir', <input style={inp} value={sehir} onChange={(e) => setSehir(e.target.value)} />)}
            {alan('Kan grubu', <input style={inp} value={kan} onChange={(e) => setKan(e.target.value)} placeholder="Örn. B Rh+" />)}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                type="button"
                disabled={kaydediyor}
                onClick={() => void kaydet('demografi')}
                style={{ background: '#0F9B8E', border: 'none', color: '#fff', borderRadius: 999, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: kaydediyor ? 0.6 : 1 }}
              >
                {kaydediyor ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
              <button
                type="button"
                disabled={kaydediyor}
                onClick={() => {
                  syncForm(patient)
                  setDemografiAcik(false)
                }}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: CHROME_RENK.muted, borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Vazgeç
              </button>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          ...panel,
          padding: '18px 20px',
          position: 'relative',
          overflow: 'hidden',
          cursor: !saglikAcik && saglikEksik ? 'pointer' : 'default',
        }}
        onClick={() => {
          if (!saglikAcik && saglikEksik) {
            syncForm(patient)
            setSaglikAcik(true)
          }
        }}
        role={!saglikAcik && saglikEksik ? 'button' : undefined}
        tabIndex={!saglikAcik && saglikEksik ? 0 : undefined}
        onKeyDown={(e) => {
          if (!saglikAcik && saglikEksik && e.key === 'Enter') {
            syncForm(patient)
            setSaglikAcik(true)
          }
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 20, right: 20, height: 2, borderRadius: 2, background: 'linear-gradient(90deg, #F59E0B, transparent)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Sağlık geçmişi</div>
          {!saglikAcik ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                syncForm(patient)
                setSaglikAcik(true)
              }}
              style={{ background: 'transparent', border: '1px solid rgba(251,191,36,0.4)', color: '#FDE68A', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              Düzenle
            </button>
          ) : null}
        </div>
        {saglikEksik && !saglikAcik && (
          <div style={{ fontSize: 12, color: '#FBBF24', marginBottom: 6 }}>Boş — tıklayarak yazın; kayıt hasta dosyasına işlenir.</div>
        )}
        {!saglikAcik ? (
          <>
            {bilgiSatiri('Kronik hastalıklar', patient.kronik_hastaliklar?.length ? cipListesi(patient.kronik_hastaliklar, '#FDBA74', '#F59E0B') : null)}
            {bilgiSatiri('Alerjiler', patient.alerjiler ? cipListesi(patient.alerjiler.split(',').map((a) => a.trim()).filter(Boolean), CHROME_RENK.warn, '#EF4444') : null)}
            {bilgiSatiri('Sürekli ilaçlar', patient.surekli_ilaclar)}
            {bilgiSatiri('Sigara / Alkol', patient.sigara_alkol)}
          </>
        ) : (
          <div onClick={(e) => e.stopPropagation()}>
            {alan('Kronik hastalıklar', <input style={inp} value={kronik} onChange={(e) => setKronik(e.target.value)} placeholder="Virgülle ayırın; yoksa boş bırakın" />)}
            {alan('Alerjiler', <input style={inp} value={alerji} onChange={(e) => setAlerji(e.target.value)} placeholder="Örn. Bilinen alerjisi yok" />)}
            {alan('Sürekli ilaçlar', <textarea style={{ ...inp, minHeight: 64, resize: 'vertical' }} value={ilac} onChange={(e) => setIlac(e.target.value)} />)}
            {alan('Sigara / Alkol', <input style={inp} value={sigara} onChange={(e) => setSigara(e.target.value)} placeholder="Örn. Ailede sigara: Hayır" />)}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                type="button"
                disabled={kaydediyor}
                onClick={() => void kaydet('saglik')}
                style={{ background: '#0F9B8E', border: 'none', color: '#fff', borderRadius: 999, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: kaydediyor ? 0.6 : 1 }}
              >
                {kaydediyor ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
              <button
                type="button"
                disabled={kaydediyor}
                onClick={() => {
                  syncForm(patient)
                  setSaglikAcik(false)
                }}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: CHROME_RENK.muted, borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Vazgeç
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
