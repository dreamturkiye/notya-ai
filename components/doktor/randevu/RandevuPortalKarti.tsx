'use client'
/**
 * NOTYA-RANDEVU-V2 — Entegrasyonlar › 'Hasta Portalı Randevu'. One switch (default OFF); when ON, one card with
 * the booking policy, the week's working hours (the existing doktor_calisma_saatleri, same API as Randevular)
 * and the doctor's izin days. One Kaydet.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { PORTAL_TURLERI, TUR_ADI, VARSAYILAN_AYAR, type PortalRandevuAyari } from '@/lib/randevu/v2/ayar'

const R = CHROME_RENK
type GunSaati = { acik: boolean; baslangic: string; bitis: string }
type Istisna = { id: string; baslangic: string; bitis: string }

/** Monday first, the way a Turkish week reads; keys are the existing Sunday=0 convention. */
const HAFTA: { k: string; ad: string }[] = [
  { k: '1', ad: 'Pazartesi' }, { k: '2', ad: 'Salı' }, { k: '3', ad: 'Çarşamba' }, { k: '4', ad: 'Perşembe' },
  { k: '5', ad: 'Cuma' }, { k: '6', ad: 'Cumartesi' }, { k: '0', ad: 'Pazar' },
]

async function istek<T>(yol: string, init?: RequestInit): Promise<T> {
  const t = await ensureDoctorAccessToken()
  const r = await fetch(yol, { ...init, headers: { ...(init?.headers || {}), Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error((j as { error?: string }).error || 'İşlem yapılamadı.')
  return j as T
}

const girdi: React.CSSProperties = { border: `1px solid ${R.border}`, borderRadius: 8, padding: '6px 8px', fontSize: 14, color: R.ink, background: '#fff' }
const etiket: React.CSSProperties = { fontSize: 13, color: R.muted }
const satir: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '6px 0' }
const bolum: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#4A4030', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '16px 0 4px' }
const trTarih = (iso: string) => new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', day: 'numeric', month: 'long' }).format(new Date(iso))

function Sayi({ deger, onChange, min, max, son }: { deger: number; onChange: (n: number) => void; min: number; max: number; son: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <input type="number" inputMode="numeric" min={min} max={max} value={deger} onChange={(e) => onChange(Number(e.target.value))} style={{ ...girdi, width: 72 }} />
      <span style={etiket}>{son}</span>
    </span>
  )
}

export default function RandevuPortalKarti() {
  const [yuk, setYuk] = useState(true)
  const [tabloVar, setTabloVar] = useState(true)
  const [ayar, setAyar] = useState<PortalRandevuAyari>(VARSAYILAN_AYAR)
  const [gunler, setGunler] = useState<Record<string, GunSaati> | null>(null)
  const [slotDakika, setSlotDakika] = useState(20)
  const [istisnalar, setIstisnalar] = useState<Istisna[]>([])
  const [izin, setIzin] = useState({ bas: '', son: '' })
  const [mesgul, setMesgul] = useState(false)
  const [durum, setDurum] = useState('')

  const yukle = useCallback(async () => {
    try {
      const a = await istek<{ ayar: PortalRandevuAyari; istisnalar: Istisna[]; tabloVar: boolean }>('/api/doktor/randevu-portal/ayar')
      setAyar(a.ayar); setIstisnalar(a.istisnalar || []); setTabloVar(a.tabloVar)
    } catch (e) {
      setDurum((e as Error).message)
    } finally {
      setYuk(false)
    }
  }, [])
  useEffect(() => { void yukle() }, [yukle])

  // Working hours are read only once the switch is ON (the existing endpoint creates the default row on first read).
  useEffect(() => {
    if (!ayar.acik || gunler) return
    istek<{ calismaSaatleri: { gunler: Record<string, GunSaati>; slot_dakika: number } }>('/api/doktor/calisma-saatleri')
      .then((c) => { setGunler(c.calismaSaatleri?.gunler || null); setSlotDakika(c.calismaSaatleri?.slot_dakika || 20) })
      .catch((e) => setDurum((e as Error).message))
  }, [ayar.acik, gunler])

  const ayarKaydet = async (yeni: PortalRandevuAyari, saatlerle: boolean) => {
    setMesgul(true); setDurum('')
    try {
      const j = await istek<{ ayar: PortalRandevuAyari }>('/api/doktor/randevu-portal/ayar', { method: 'PUT', body: JSON.stringify({ ayar: yeni }) })
      setAyar(j.ayar)
      if (saatlerle && gunler) {
        await istek('/api/doktor/calisma-saatleri', { method: 'PATCH', body: JSON.stringify({ gunler, slotDakika }) })
      }
      setDurum('Kaydedildi.')
    } catch (e) {
      setDurum((e as Error).message)
    } finally {
      setMesgul(false)
    }
  }

  const izinEkle = async () => {
    if (!izin.bas) return
    setMesgul(true); setDurum('')
    try {
      const j = await istek<{ istisna: Istisna }>('/api/doktor/randevu-portal/ayar', { method: 'POST', body: JSON.stringify({ baslangicGun: izin.bas, bitisGun: izin.son || izin.bas }) })
      setIstisnalar((l) => [...l, j.istisna].sort((a, b) => a.baslangic.localeCompare(b.baslangic)))
      setIzin({ bas: '', son: '' })
    } catch (e) {
      setDurum((e as Error).message)
    } finally {
      setMesgul(false)
    }
  }

  const izinSil = async (id: string) => {
    setMesgul(true)
    try {
      await istek(`/api/doktor/randevu-portal/ayar?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      setIstisnalar((l) => l.filter((x) => x.id !== id))
    } catch (e) {
      setDurum((e as Error).message)
    } finally {
      setMesgul(false)
    }
  }

  if (yuk || !tabloVar) return null
  const kart: React.CSSProperties = { background: '#fff', border: `1px solid ${R.border}`, borderRadius: 16, padding: '18px 20px', boxShadow: '0 8px 18px rgba(58,44,34,0.045)', color: R.ink, fontFamily: CHROME_FONT.sans }
  return (
    <div style={{ ...kart, marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>Hasta Portalı Randevu</div>
          <div style={{ fontSize: 13, color: R.muted, marginTop: 4 }}>Hastalarınız Sağlığım’dan boş saatlerinize randevu talep eder.</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={ayar.acik}
          aria-label="Hasta Portalı Randevu"
          disabled={mesgul}
          onClick={() => void ayarKaydet({ ...ayar, acik: !ayar.acik }, false)}
          style={{ width: 52, height: 30, borderRadius: 999, border: 'none', cursor: 'pointer', background: ayar.acik ? R.pine : '#d9d2c6', position: 'relative', flexShrink: 0 }}
        >
          <span style={{ position: 'absolute', top: 3, left: ayar.acik ? 25 : 3, width: 24, height: 24, borderRadius: '50%', background: '#fff', transition: 'left .15s ease' }} />
        </button>
      </div>

      {ayar.acik && (
        <>
          <div style={bolum}>Çalışma saatleri</div>
          {gunler && HAFTA.map(({ k, ad }) => {
            const g = gunler[k] || { acik: false, baslangic: '09:00', bitis: '18:00' }
            const yaz = (p: Partial<GunSaati>) => setGunler({ ...gunler, [k]: { ...g, ...p } })
            return (
              <div key={k} style={satir}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <input type="checkbox" checked={g.acik} onChange={(e) => yaz({ acik: e.target.checked })} /> {ad}
                </label>
                {g.acik
                  ? <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                      <input type="time" value={g.baslangic} onChange={(e) => yaz({ baslangic: e.target.value })} style={girdi} />
                      <span style={etiket}>–</span>
                      <input type="time" value={g.bitis} onChange={(e) => yaz({ bitis: e.target.value })} style={girdi} />
                    </span>
                  : <span style={etiket}>Kapalı</span>}
              </div>
            )
          })}

          <div style={bolum}>Randevu türleri</div>
          {PORTAL_TURLERI.map((t) => (
            <div key={t} style={satir}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <input type="checkbox" checked={ayar.turler[t].acik} onChange={(e) => setAyar({ ...ayar, turler: { ...ayar.turler, [t]: { ...ayar.turler[t], acik: e.target.checked } } })} /> {TUR_ADI[t]}
              </label>
              <Sayi deger={ayar.turler[t].sure} min={5} max={240} son="dk" onChange={(n) => setAyar({ ...ayar, turler: { ...ayar.turler, [t]: { ...ayar.turler[t], sure: n } } })} />
            </div>
          ))}

          <div style={bolum}>Kurallar</div>
          <div style={satir}><span style={{ fontSize: 14 }}>Randevular arası boşluk</span><Sayi deger={ayar.tamponDk} min={0} max={120} son="dk" onChange={(n) => setAyar({ ...ayar, tamponDk: n })} /></div>
          <div style={satir}><span style={{ fontSize: 14 }}>En erken</span><Sayi deger={ayar.minBildirimSaat} min={0} max={720} son="saat sonrası" onChange={(n) => setAyar({ ...ayar, minBildirimSaat: n })} /></div>
          <div style={satir}><span style={{ fontSize: 14 }}>En geç</span><Sayi deger={ayar.maxIleriGun} min={1} max={365} son="gün ilerisi" onChange={(n) => setAyar({ ...ayar, maxIleriGun: n })} /></div>
          <div style={satir}><span style={{ fontSize: 14 }}>Hasta iptal / erteleme</span><Sayi deger={ayar.iptalSinirSaat} min={0} max={720} son="saat öncesine kadar" onChange={(n) => setAyar({ ...ayar, iptalSinirSaat: n })} /></div>
          <div style={satir}><span style={{ fontSize: 14 }}>Yanıtsız talep uyarısı</span><Sayi deger={ayar.eskalasyonSaat} min={1} max={168} son="saat sonra" onChange={(n) => setAyar({ ...ayar, eskalasyonSaat: n })} /></div>
          <div style={{ ...satir, alignItems: 'flex-start', flexDirection: 'column', gap: 6 }}>
            <label style={{ display: 'flex', gap: 8, fontSize: 14 }}>
              <input type="radio" name="onayModu" checked={ayar.onayModu === 'hepsi_onay'} onChange={() => setAyar({ ...ayar, onayModu: 'hepsi_onay' })} /> Her talep onayımı beklesin
            </label>
            <label style={{ display: 'flex', gap: 8, fontSize: 14 }}>
              <input type="radio" name="onayModu" checked={ayar.onayModu === 'mevcut_hasta_otomatik'} onChange={() => setAyar({ ...ayar, onayModu: 'mevcut_hasta_otomatik' })} /> Daha önce gelmiş hastalar otomatik onaylansın
            </label>
          </div>

          <div style={bolum}>İzin günleri</div>
          {istisnalar.map((x) => (
            <div key={x.id} style={satir}>
              <span style={{ fontSize: 14 }}>{trTarih(x.baslangic)}{trTarih(new Date(Date.parse(x.bitis) - 1).toISOString()) !== trTarih(x.baslangic) ? ` – ${trTarih(new Date(Date.parse(x.bitis) - 1).toISOString())}` : ''}</span>
              <button type="button" disabled={mesgul} onClick={() => void izinSil(x.id)} style={{ border: 'none', background: 'transparent', color: R.warn, cursor: 'pointer', fontSize: 13 }}>Kaldır</button>
            </div>
          ))}
          <div style={{ ...satir, justifyContent: 'flex-start', flexWrap: 'wrap' }}>
            <input type="date" value={izin.bas} onChange={(e) => setIzin({ ...izin, bas: e.target.value })} style={girdi} aria-label="İzin başlangıcı" />
            <span style={etiket}>–</span>
            <input type="date" value={izin.son} min={izin.bas} onChange={(e) => setIzin({ ...izin, son: e.target.value })} style={girdi} aria-label="İzin bitişi" />
            <button type="button" disabled={mesgul || !izin.bas} onClick={() => void izinEkle()} style={{ ...girdi, cursor: 'pointer', fontWeight: 600 }}>Ekle</button>
          </div>

          <button
            type="button"
            disabled={mesgul}
            onClick={() => void ayarKaydet(ayar, true)}
            style={{ width: '100%', marginTop: 16, height: 46, border: 'none', borderRadius: 12, background: R.pine, color: '#FAF8F4', fontWeight: 650, fontSize: 16, cursor: mesgul ? 'wait' : 'pointer' }}
          >
            {mesgul ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </>
      )}
      {durum && <div style={{ fontSize: 13, color: durum === 'Kaydedildi.' ? '#3F7D4A' : R.warn, marginTop: 10 }}>{durum}</div>}
    </div>
  )
}
