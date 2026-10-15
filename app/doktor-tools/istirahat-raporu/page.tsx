'use client'
/**
 * NOTYA-OKUL-RAPOR-01 — İstirahat ve Geçici Hastalık Raporu (okul/kreş izin raporu).
 * Base/ORTAK tool (lib/doktor/doktorAraclari.ts): her branş açar; relevans PATIENT yaşı/öğrenci bayrağına
 * bağlıdır (lib/doktor/okulAraclariKapisi.ts), branşa değil.
 *
 * e-Okul'a otomatik aktarım YOKTUR — "e-Okul'a iletildi" yalnız hekimin kendi iletişimini işaretlediği bir
 * kutudur (gerçek MEB/Sağlık Bakanlığı entegrasyonu değil). docs/OPEN-COMMITMENTS.md § NOTYA-OKUL-RAPOR-01.
 */
import { useEffect, useMemo, useState } from 'react'
import {
  getAccessTokenAsync,
  normalizeHastalar,
  toolsCard,
  toolsErrorBox,
  toolsInput,
  toolsLabel,
  toolsPrimaryBtn,
  toolsShell,
  type HastaOption,
} from '@/lib/doktor/toolsUi'
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme'
import { okulAraclariGorunurMu } from '@/lib/doktor/okulAraclariKapisi'
import { ISTIRAHAT_TEK_RAPOR_MAX_GUN, ISTIRAHAT_YILLIK_LIMIT_GUN } from '@/lib/doktor/istirahatRaporu'

type Rapor = {
  id: string
  tani: string
  gun_sayisi: number
  baslangic_tarihi: string
  bitis_tarihi: string
  egitim_yili: string
  e_okula_iletildi: boolean
}

export default function IstirahatRaporuPage() {
  const [hastalar, setHastalar] = useState<HastaOption[]>([])
  const [selectedHastaId, setSelectedHastaId] = useState('')
  const [hastaBilgi, setHastaBilgi] = useState<{ dogumTarihi: string | null; ogrenciMi: boolean | null } | null>(null)
  const [tani, setTani] = useState('')
  const [gunSayisi, setGunSayisi] = useState(3)
  const [baslangicTarihi, setBaslangicTarihi] = useState(() => new Date().toISOString().slice(0, 10))
  const [eOkulaIletildi, setEOkulaIletildi] = useState(false)
  const [raporlar, setRaporlar] = useState<Rapor[]>([])
  const [ozet, setOzet] = useState<{ egitimYili: string; toplamGun: number; limitAsildi: boolean } | null>(null)
  const [sonRapor, setSonRapor] = useState<Rapor | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void (async () => {
      const token = await getAccessTokenAsync()
      if (!token) return
      try {
        const r = await fetch('/api/doktor/hastalar', { headers: { Authorization: `Bearer ${token}` } })
        if (r.ok) setHastalar(normalizeHastalar(await r.json()))
      } catch {
        setError('Hasta listesi alınamadı.')
      }
    })()
  }, [])

  useEffect(() => {
    setHastaBilgi(null)
    setRaporlar([])
    setOzet(null)
    setSonRapor(null)
    if (!selectedHastaId) return
    let iptal = false
    void (async () => {
      const token = await getAccessTokenAsync()
      if (!token) return
      try {
        const [hastaR, raporR] = await Promise.all([
          fetch(`/api/doktor/hastalar/${encodeURIComponent(selectedHastaId)}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/doktor/araclar/istirahat-raporu?hastaId=${encodeURIComponent(selectedHastaId)}`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (!iptal && hastaR.ok) {
          const j = await hastaR.json() as { patient?: { dogum_tarihi?: string | null; ogrenci_mi?: boolean | null } }
          setHastaBilgi({ dogumTarihi: j.patient?.dogum_tarihi || null, ogrenciMi: j.patient?.ogrenci_mi ?? null })
        }
        if (!iptal && raporR.ok) {
          const j = await raporR.json() as { raporlar?: Rapor[]; egitimYili?: string; toplamGun?: number; limitAsildi?: boolean }
          setRaporlar(j.raporlar || [])
          if (j.egitimYili) setOzet({ egitimYili: j.egitimYili, toplamGun: j.toplamGun || 0, limitAsildi: !!j.limitAsildi })
        }
      } catch { /* sayfa boş kalır */ }
    })()
    return () => { iptal = true }
  }, [selectedHastaId])

  const gorunurMu = useMemo(
    () => (hastaBilgi ? okulAraclariGorunurMu({ hastaDogumIso: hastaBilgi.dogumTarihi, ogrenciMi: hastaBilgi.ogrenciMi }) : null),
    [hastaBilgi],
  )

  const oncekiToplam = raporlar.reduce((t, r) => t + r.gun_sayisi, 0)
  const oncekiToplamBuRapor = oncekiToplam + gunSayisi

  const isaretleOgrenci = async () => {
    if (!selectedHastaId) return
    const token = await getAccessTokenAsync()
    if (!token) return
    await fetch(`/api/doktor/hastalar/${encodeURIComponent(selectedHastaId)}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ogrenci_mi: true }),
    })
    setHastaBilgi((h) => (h ? { ...h, ogrenciMi: true } : h))
  }

  const handleOlustur = async () => {
    setError('')
    if (!selectedHastaId) { setError('Lütfen hasta seçin.'); return }
    if (!tani.trim()) { setError('Tanı zorunludur.'); return }
    setBusy(true)
    try {
      const token = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/araclar/istirahat-raporu', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ hastaId: selectedHastaId, tani, gunSayisi, baslangicTarihi, eOkulaIletildi }),
      })
      const j = await r.json()
      if (!r.ok) { setError(j.error || 'Rapor oluşturulamadı.'); return }
      setSonRapor(j.rapor)
      setRaporlar((prev) => [j.rapor, ...prev])
      setOzet({ egitimYili: j.egitimYili, toplamGun: j.toplamGun, limitAsildi: j.limitAsildi })
    } catch {
      setError('Rapor oluşturulamadı.')
    } finally {
      setBusy(false)
    }
  }

  const toggleEOkul = async (rapor: Rapor, deger: boolean) => {
    const token = await getAccessTokenAsync()
    await fetch(`/api/doktor/araclar/istirahat-raporu/${encodeURIComponent(rapor.id)}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ eOkulaIletildi: deger }),
    })
    setRaporlar((prev) => prev.map((r) => (r.id === rapor.id ? { ...r, e_okula_iletildi: deger } : r)))
  }

  return (
    <div style={{ ...toolsShell, padding: 20, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontFamily: CHROME_FONT.serif, fontSize: 24, color: CHROME_RENK.ink, marginBottom: 4 }}>
        İstirahat ve Geçici Hastalık Raporu
      </h1>
      <p style={{ color: CHROME_RENK.muted, fontSize: 13, marginBottom: 16 }}>
        Okul/kreş izin raporu — tek seferde en çok {ISTIRAHAT_TEK_RAPOR_MAX_GUN} gün. Eğitim yılı toplamı{' '}
        {ISTIRAHAT_YILLIK_LIMIT_GUN} günü aşarsa bilgi amaçlı uyarı gösterilir; karar hekimdedir.
      </p>

      <div style={{ ...toolsCard, marginBottom: 16 }}>
        <label style={toolsLabel}>Hasta</label>
        <select style={toolsInput} value={selectedHastaId} onChange={(e) => setSelectedHastaId(e.target.value)}>
          <option value="">Hasta seçin…</option>
          {hastalar.map((h) => (
            <option key={h.id} value={h.id}>{h.label}</option>
          ))}
        </select>

        {selectedHastaId && gorunurMu === false && (
          <div style={{ ...toolsErrorBox, marginTop: 12, background: '#FFF7E6', borderColor: `${CHROME_RENK.gold}`, color: CHROME_RENK.ink }}>
            Bu hasta reşit görünüyor ve öğrenci olarak işaretli değil. Bu araç minör hastalar ve öğrenciler için
            tasarlandı.{' '}
            <button type="button" onClick={isaretleOgrenci} style={{ color: CHROME_RENK.pine, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
              Öğrenci olarak işaretle
            </button>{' '}
            ve devam edin, ya da yine de rapor oluşturun — karar hekimdedir.
          </div>
        )}

        {ozet && (
          <div style={{ marginTop: 12, fontSize: 13, color: CHROME_RENK.ink }}>
            {ozet.egitimYili} eğitim yılı toplamı: <strong>{ozet.toplamGun} gün</strong> / {ISTIRAHAT_YILLIK_LIMIT_GUN} gün
            {ozet.limitAsildi && (
              <div style={{ ...toolsErrorBox, marginTop: 8 }}>
                20 günlük yıllık hak aşılmış — bilgi amaçlı uyarı, engelleme yok. Karar hekimdedir.
              </div>
            )}
          </div>
        )}
      </div>

      <div style={toolsCard}>
        <label style={toolsLabel}>Tanı</label>
        <input style={toolsInput} value={tani} onChange={(e) => setTani(e.target.value)} placeholder="Örn. Akut üst solunum yolu enfeksiyonu" />

        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={toolsLabel}>Başlangıç tarihi</label>
            <input style={toolsInput} type="date" value={baslangicTarihi} onChange={(e) => setBaslangicTarihi(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={toolsLabel}>Gün sayısı (1–{ISTIRAHAT_TEK_RAPOR_MAX_GUN})</label>
            <input
              style={toolsInput}
              type="number"
              min={1}
              max={ISTIRAHAT_TEK_RAPOR_MAX_GUN}
              value={gunSayisi}
              onChange={(e) => setGunSayisi(Math.min(ISTIRAHAT_TEK_RAPOR_MAX_GUN, Math.max(1, Number(e.target.value) || 1)))}
            />
          </div>
        </div>

        {oncekiToplamBuRapor > ISTIRAHAT_YILLIK_LIMIT_GUN && (
          <div style={{ ...toolsErrorBox, marginTop: 12 }}>
            Bu rapor eklendiğinde eğitim yılı toplamı {oncekiToplamBuRapor} güne çıkar — {ISTIRAHAT_YILLIK_LIMIT_GUN} günlük
            hakkı aşar. Bilgi amaçlı; karar hekimdedir.
          </div>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 13, color: CHROME_RENK.ink }}>
          <input type="checkbox" checked={eOkulaIletildi} onChange={(e) => setEOkulaIletildi(e.target.checked)} />
          e-Okul'a iletildi (kendi okul/veli iletişimimi kaydediyorum — canlı MEB entegrasyonu değildir)
        </label>

        {error && <div style={toolsErrorBox}>{error}</div>}

        <button style={{ ...toolsPrimaryBtn(busy), marginTop: 16 }} disabled={busy} onClick={handleOlustur}>
          {busy ? 'Oluşturuluyor…' : 'Rapor Oluştur'}
        </button>
      </div>

      {sonRapor && (
        <div className="yazdir-alani" style={{ ...toolsCard, marginTop: 16 }}>
          <h2 style={{ fontFamily: CHROME_FONT.serif, fontSize: 18, marginBottom: 8 }}>İstirahat ve Geçici Hastalık Raporu</h2>
          <p>Tanı: {sonRapor.tani}</p>
          <p>İstirahat süresi: {sonRapor.gun_sayisi} gün ({sonRapor.baslangic_tarihi} – {sonRapor.bitis_tarihi})</p>
          <button style={{ marginTop: 12 }} onClick={() => window.print()}>Yazdır</button>
        </div>
      )}

      {raporlar.length > 0 && (
        <div style={{ ...toolsCard, marginTop: 16 }}>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Önceki raporlar</h3>
          {raporlar.map((r) => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${CHROME_RENK.borderSoft}`, fontSize: 13 }}>
              <span>{r.baslangic_tarihi} – {r.bitis_tarihi} · {r.gun_sayisi} gün · {r.tani}</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={r.e_okula_iletildi} onChange={(e) => toggleEOkul(r, e.target.checked)} />
                e-Okul'a iletildi
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
