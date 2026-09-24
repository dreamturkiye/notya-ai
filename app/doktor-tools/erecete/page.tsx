'use client';
import { dozCikar } from '@/components/doktor/IlacSecici'
import type { GruplanmisIlac } from '@/app/api/doktor/ilac-ara/route'
import React, { useState, useEffect } from 'react'
import { getDoctorAccessToken } from '@/lib/doktor/clientAuth';
import RrsBekleyenler from '@/components/doktor/RrsBekleyenler'
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme'

interface Hasta {
  id: string
  ad: string
  soyad: string
  label: string
}

interface Ilac {
  id: string
  ad: string
  doz: string
  kullanim: string
  sure: string
}

interface ReceteSonuc {
  icd10: { code: string; aciklama: string }
  ilaclar: Ilac[]
  interaksiyonlar: string[]
  uyarilar: string[]
  sgkUyum: boolean
}

function normalizeHastalar(payload: unknown): Hasta[] {
  const raw = Array.isArray(payload)
    ? payload
    : (payload && typeof payload === 'object' && Array.isArray((payload as { patients?: unknown }).patients)
        ? (payload as { patients: unknown[] }).patients
        : [])

  return raw.map((item, idx) => {
    const p = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    const id = String(p.id || idx)
    const masked = String(p.masked_name || '')
    const ad = String(p.ad || p.first_name || (masked ? masked.split(' ')[0] : '') || 'Hasta')
    const soyad = String(p.soyad || p.last_name || (masked.includes(' ') ? masked.split(' ').slice(1).join(' ') : '') || '')
    const label = masked || `${ad} ${soyad}`.trim() || `Hasta ${idx + 1}`
    return { id, ad, soyad, label }
  })
}

const ERecetePage: React.FC = () => {
  const [hastalar, setHastalar] = useState<Hasta[]>([])
  const [selectedHasta, setSelectedHasta] = useState('')
  const [tani, setTani] = useState('')
  const [notlar, setNotlar] = useState('')
  const [ilaclar, setIlaclar] = useState<Ilac[]>([
    { id: '1', ad: '', doz: '', kullanim: '', sure: '' },
  ])
  const [loading, setLoading] = useState(false)
  const [sonuc, setSonuc] = useState<ReceteSonuc | null>(null)
  const [error, setError] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  // NOTYA-ILAC-10: SGK brand dropdown on the prescription rows. A pick writes the pack name into
  // "İlaç adı" and parses the dose; the doctor never spells the box out on the one page where
  // a spelling mistake ends up on a prescription.
  const [oneriSatir, setOneriSatir] = useState<string | null>(null)
  const [oneriler, setOneriler] = useState<GruplanmisIlac[]>([])
  useEffect(() => {
    if (!oneriSatir) return
    const satir = ilaclar.find((i) => i.id === oneriSatir)
    const q = (satir?.ad || '').trim()
    if (q.length < 2) { setOneriler([]); return }
    let iptal = false
    const t = setTimeout(async () => {
      try {
        const token = getDoctorAccessToken()
        const r = await fetch(`/api/doktor/ilac-ara?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } })
        const d = await r.json()
        if (!iptal) setOneriler((d.sonuclar || []).slice(0, 8))
      } catch { if (!iptal) setOneriler([]) }
    }, 120)
    return () => { iptal = true; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oneriSatir, ilaclar.find((i) => i.id === oneriSatir)?.ad])
  const oneriSec = (rowId: string, g: GruplanmisIlac) => {
    const su = g.sunumlar.length === 1 ? g.sunumlar[0] : null
    setIlaclar(ilaclar.map((i) => i.id === rowId ? { ...i, ad: su ? su.ad : g.marka, doz: su ? (dozCikar(su.ad) || i.doz) : i.doz } : i))
    setOneriSatir(null); setOneriler([])
  }

  const teal = CHROME_RENK.pine
  const glassBg = '#FFFFFF'
  const glassBorder = CHROME_RENK.border
  const inkText = CHROME_RENK.ink
  const mutedText = CHROME_RENK.muted

  useEffect(() => {
    const chk = () => setIsMobile(window.innerWidth < 768)
    chk()
    window.addEventListener('resize', chk)
    return () => window.removeEventListener('resize', chk)
  }, [])

  useEffect(() => {
    const fetchHastalar = async () => {
      const tokenData = { access_token: getDoctorAccessToken() } // NOTYA-AUTH-01
      if (!tokenData.access_token) return
      try {
        const res = await fetch('/api/doktor/hastalar', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json',
          },
        })
        if (res.ok) {
          const data = await res.json()
          setHastalar(normalizeHastalar(data))
        }
      } catch {
        setError('Hasta listesi alınamadı. Sayfayı yenileyip tekrar deneyin.')
      }
    }
    void fetchHastalar()
  }, [])

  const addIlac = () => {
    setIlaclar([
      ...ilaclar,
      { id: Date.now().toString(), ad: '', doz: '', kullanim: '', sure: '' },
    ])
  }

  const removeIlac = (id: string) => {
    if (ilaclar.length > 1) {
      setIlaclar(ilaclar.filter((ilac) => ilac.id !== id))
    }
  }

  const updateIlac = (id: string, field: keyof Ilac, value: string) => {
    setIlaclar(ilaclar.map((ilac) => (ilac.id === id ? { ...ilac, [field]: value } : ilac)))
  }

  const handleSubmit = async () => {
    if (!selectedHasta || !tani) {
      setError('Hasta ve tanı alanları zorunludur.')
      return
    }

    setLoading(true)
    setError('')
    setSonuc(null)

    const tokenData = { access_token: getDoctorAccessToken() } // NOTYA-AUTH-01
    if (!tokenData.access_token) {
      setError('Oturum bulunamadı.')
      setLoading(false)
      return
    }

    const payload = {
      hastaId: selectedHasta,
      tani,
      notlar,
      ilaclar: ilaclar.filter((i) => i.ad.trim() !== ''),
    }

    try {
      const res = await fetch('/api/doktor/araclar/erecete', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data = await res.json()
        const draft = (data?.recete || data) as Record<string, unknown>
        const icdRaw = (draft?.icd10 || {}) as Record<string, unknown>
        const icd10 = {
          code: String(icdRaw.code || icdRaw.kod || ''),
          aciklama: String(icdRaw.aciklama || ''),
        }
        if (!icd10.code && !icd10.aciklama) {
          setError('Reçete yanıtı beklenen formatta değil.')
        } else {
          setSonuc({
            icd10,
            ilaclar: Array.isArray(draft.ilaclar) ? (draft.ilaclar as Ilac[]) : [],
            interaksiyonlar: Array.isArray(draft.interaksiyonlar)
              ? (draft.interaksiyonlar as unknown[]).map((x) =>
                  typeof x === 'string' ? x : JSON.stringify(x)
                )
              : [],
            uyarilar: Array.isArray(draft.uyarilar) ? (draft.uyarilar as string[]) : [],
            sgkUyum: draft.sgkUyum !== false,
          })
        }
      } else {
        const errBody = await res.json().catch(() => ({}))
        setError(String((errBody as { hata?: string }).hata || 'Reçete oluşturulamadı. Lütfen tekrar deneyin.'))
      }
    } catch {
      setError('Sunucu hatası oluştu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: 'transparent',
        fontFamily: CHROME_FONT.sans,
        color: inkText,
      }}
    >
      <div style={{ padding: '0 0 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <div
            style={{
              fontFamily: CHROME_FONT.serif,
              fontStyle: 'italic',
              color: '#6d6055',
              fontSize: '15px',
              marginBottom: '4px',
            }}
          >
            E-Reçete
          </div>
          <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: isMobile ? '26px' : '32px', margin: 0, marginBottom: '6px', color: '#2e251d', letterSpacing: '-0.02em' }}>
            Elektronik Reçete
          </h1>
          <p style={{ color: mutedText, fontSize: '15px', margin: 0 }}>
            Elektronik reçete oluşturma ve SGK entegrasyonu
          </p>
        </div>

        <RrsBekleyenler ilacAdlari={ilaclar.map((i) => String((i as unknown as { ad?: string }).ad || ''))} />

        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '20px',
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                backgroundColor: glassBg,
                border: `1px solid ${glassBorder}`,
                borderRadius: '18px',
                padding: isMobile ? '16px' : '24px',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>
                Reçete Oluştur
              </div>

              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '13px', marginBottom: '8px', color: mutedText }}>
                  Hasta
                </div>
                <select
                  value={selectedHasta}
                  onChange={(e) => setSelectedHasta(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: '#FFFFFF',
                    border: `1px solid ${glassBorder}`,
                    borderRadius: '14px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    color: inkText,
                    outline: 'none',
                  }}
                >
                  <option value="">Hasta seçin...</option>
                  {hastalar.map((h) => (
                    <option key={h.id} value={h.id} style={{ color: '#000' }}>
                      {h.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '13px', marginBottom: '8px', color: mutedText }}>
                  Tanı
                </div>
                <textarea
                  value={tani}
                  onChange={(e) => setTani(e.target.value)}
                  placeholder="Tanı bilgisini girin..."
                  rows={3}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: '#FFFFFF',
                    border: `1px solid ${glassBorder}`,
                    borderRadius: '14px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    color: inkText,
                    resize: 'vertical',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '13px', marginBottom: '8px', color: mutedText }}>
                  Ek Notlar
                </div>
                <textarea
                  value={notlar}
                  onChange={(e) => setNotlar(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: '#FFFFFF',
                    border: `1px solid ${glassBorder}`,
                    borderRadius: '14px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    color: inkText,
                    resize: 'vertical',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>İlaçlar</div>
                  <button
                    type="button"
                    onClick={addIlac}
                    style={{
                      backgroundColor: 'transparent',
                      border: `1px solid ${teal}`,
                      color: teal,
                      padding: '4px 12px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    + Ekle
                  </button>
                </div>

                {ilaclar.map((ilac) => (
                  <div
                    key={ilac.id}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginBottom: '8px',
                      alignItems: 'center',
                    }}
                  >
                    {([
                      ['ad', 'İlaç adı', 2],
                      ['doz', 'Doz', 1],
                      ['kullanim', 'Kullanım', 1.2],
                      ['sure', 'Süre', 1],
                    ] as const).map(([field, placeholder, flex]) => (
                      <div key={field} style={{ flex: field === 'ad' && isMobile ? '1 1 100%' : flex, minWidth: '90px', position: 'relative' }}>
                      <input
                        placeholder={field === 'ad' ? 'İlaç adı — yazmaya başlayın' : placeholder}
                        value={ilac[field]}
                        autoComplete="off"
                        onChange={(e) => { updateIlac(ilac.id, field, e.target.value); if (field === 'ad') setOneriSatir(ilac.id) }}
                        onFocus={() => { if (field === 'ad') setOneriSatir(ilac.id) }}
                        onBlur={() => setTimeout(() => setOneriSatir((cur) => (cur === ilac.id ? null : cur)), 150)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          backgroundColor: '#FFFFFF',
                          border: `1px solid ${glassBorder}`,
                          borderRadius: '14px',
                          padding: '10px 14px',
                          fontSize: '14px',
                          color: inkText,
                          outline: 'none',
                        }}
                      />
                      {field === 'ad' && oneriSatir === ilac.id && oneriler.length > 0 && (
                        <div style={{ position: 'absolute', zIndex: 30, left: 0, right: 0, top: '100%', marginTop: 4, background: '#FFFFFF', border: `1px solid ${glassBorder}`, borderRadius: 12, boxShadow: '0 12px 30px -10px rgba(58,44,34,.18)', maxHeight: 260, overflowY: 'auto' }}>
                          {oneriler.map((g, i) => (
                            <div key={g.marka} onMouseDown={() => oneriSec(ilac.id, g)} style={{ padding: '10px 14px', cursor: 'pointer', borderTop: i === 0 ? 'none' : `1px solid ${glassBorder}` }}>
                              <div style={{ fontWeight: 600, fontSize: 14, color: inkText }}>{g.marka} <span style={{ fontWeight: 400, fontSize: 11, color: mutedText }}>· {g.sunumlar.length} sunum</span></div>
                              {g.etkenMadde && <div style={{ fontSize: 12, color: mutedText }}>{g.etkenMadde}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => removeIlac(ilac.id)}
                      disabled={ilaclar.length === 1}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: mutedText,
                        cursor: 'pointer',
                        fontSize: '16px',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={loading}
                style={{
                  marginTop: '28px',
                  width: '100%',
                  height: '52px',
                  backgroundColor: teal,
                  color: '#FAF8F4',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: loading ? 'default' : 'pointer',
                }}
              >
                {loading ? 'Üretiliyor...' : 'Reçete Üret'}
              </button>

              {error && (
                <div
                  style={{
                    color: '#7A3D28',
                    background: '#FBEAE3',
                    border: `1px solid ${CHROME_RENK.warn}70`,
                    borderRadius: '12px',
                    padding: '12px 14px',
                    fontSize: '14px',
                    marginTop: '12px',
                    lineHeight: 1.45,
                  }}
                >
                  {error}
                </div>
              )}
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                backgroundColor: glassBg,
                border: `1px solid ${glassBorder}`,
                borderRadius: '18px',
                padding: isMobile ? '16px' : '24px',
                minHeight: '420px',
                backdropFilter: 'blur(20px)',
              }}
            >
              {!sonuc ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    padding: '60px 20px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.4 }}>📋</div>
                  <div style={{ color: mutedText, fontSize: '14px' }}>
                    Reçete önizlemesi burada görünecek
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '20px',
                    }}
                  >
                    <div style={{ fontSize: '16px', fontWeight: 600 }}>Reçete Taslağı</div>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      style={{
                        backgroundColor: '#EFE9DC',
                        border: `1px solid ${glassBorder}`,
                        color: inkText,
                        padding: '6px 14px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      Yazdır
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#E4F3F1',
                      color: teal,
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      marginBottom: '18px',
                    }}
                  >
                    {sonuc.icd10.code} — {sonuc.icd10.aciklama}
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '13px', marginBottom: '10px', color: mutedText }}>
                      İlaçlar
                    </div>
                    {sonuc.ilaclar.map((ilac, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: '#F6F0E4',
                          borderRadius: '12px',
                          padding: '10px 14px',
                          marginBottom: '6px',
                          fontSize: '13px',
                        }}
                      >
                        {ilac.ad} • {ilac.doz} • {ilac.kullanim} • {ilac.sure}
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      marginTop: '20px',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      backgroundColor: sonuc.sgkUyum
                        ? '#E4F3F1'
                        : '#FBEAE3',
                      color: sonuc.sgkUyum ? teal : CHROME_RENK.warn,
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    {sonuc.sgkUyum ? '✓ SGK Uyumlu' : '✕ SGK Uyumsuz'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ERecetePage
