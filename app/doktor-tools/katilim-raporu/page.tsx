'use client'
/**
 * NOTYA-OKUL-RAPOR-01 — Durum Bildirir Sağlık Raporları / Katılım Belgeleri (spor / kreş / erteleme).
 * Base/ORTAK tool: her branş açar; relevans PATIENT yaşı/öğrenci bayrağına bağlıdır
 * (lib/doktor/okulAraclariKapisi.ts), branşa değil.
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
import { KATILIM_RAPORU_TURLERI, type KatilimRaporuTuru } from '@/lib/doktor/katilimRaporu'

export default function KatilimRaporuPage() {
  const [hastalar, setHastalar] = useState<HastaOption[]>([])
  const [selectedHastaId, setSelectedHastaId] = useState('')
  const [hastaBilgi, setHastaBilgi] = useState<{ dogumTarihi: string | null; ogrenciMi: boolean | null } | null>(null)
  const [tur, setTur] = useState<KatilimRaporuTuru>('spor')
  const [sakinca, setSakinca] = useState<'yok' | 'var'>('yok')
  const [sporNot, setSporNot] = useState('')
  const [bulasiciBulgu, setBulasiciBulgu] = useState('Normal')
  const [ertelemeGerekce, setErtelemeGerekce] = useState('')
  const [ertelemeOner, setErtelemeOner] = useState(false)
  const [sonuc, setSonuc] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void (async () => {
      const token = await getAccessTokenAsync()
      if (!token) return
      try {
        const r = await fetch('/api/doktor/hastalar', { headers: { Authorization: `Bearer ${token}` } })
        if (r.ok) setHastalar(normalizeHastalar(await r.json()))
      } catch { setError('Hasta listesi alınamadı.') }
    })()
  }, [])

  useEffect(() => {
    setHastaBilgi(null)
    setSonuc(null)
    if (!selectedHastaId) return
    let iptal = false
    void (async () => {
      const token = await getAccessTokenAsync()
      if (!token) return
      try {
        const r = await fetch(`/api/doktor/hastalar/${encodeURIComponent(selectedHastaId)}`, { headers: { Authorization: `Bearer ${token}` } })
        if (!r.ok || iptal) return
        const j = await r.json() as { patient?: { dogum_tarihi?: string | null; ogrenci_mi?: boolean | null } }
        setHastaBilgi({ dogumTarihi: j.patient?.dogum_tarihi || null, ogrenciMi: j.patient?.ogrenci_mi ?? null })
      } catch { /* boş kalır */ }
    })()
    return () => { iptal = true }
  }, [selectedHastaId])

  const gorunurMu = useMemo(
    () => (hastaBilgi ? okulAraclariGorunurMu({ hastaDogumIso: hastaBilgi.dogumTarihi, ogrenciMi: hastaBilgi.ogrenciMi }) : null),
    [hastaBilgi],
  )

  const handleOlustur = async () => {
    setError('')
    if (!selectedHastaId) { setError('Lütfen hasta seçin.'); return }
    const gövde: Record<string, unknown> =
      tur === 'spor' ? { sakinca, not: sporNot } :
      tur === 'kres' ? { bulasiciTaramaBulgusu: bulasiciBulgu } :
      { gerekce: ertelemeGerekce, onerilenErteleme: ertelemeOner }

    setBusy(true)
    try {
      const token = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/araclar/katilim-raporu', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ hastaId: selectedHastaId, tur, sonuc: gövde }),
      })
      const j = await r.json()
      if (!r.ok) { setError(j.error || 'Rapor oluşturulamadı.'); return }
      setSonuc(j.rapor?.sonuc || null)
    } catch {
      setError('Rapor oluşturulamadı.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ ...toolsShell, padding: 20, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontFamily: CHROME_FONT.serif, fontSize: 24, color: CHROME_RENK.ink, marginBottom: 4 }}>
        Durum Bildirir Sağlık Raporları
      </h1>
      <p style={{ color: CHROME_RENK.muted, fontSize: 13, marginBottom: 16 }}>
        Spor katılım · kreş/okul öncesi sağlık · okula başlama erteleme raporu.
      </p>

      <div style={{ ...toolsCard, marginBottom: 16 }}>
        <label style={toolsLabel}>Hasta</label>
        <select style={toolsInput} value={selectedHastaId} onChange={(e) => setSelectedHastaId(e.target.value)}>
          <option value="">Hasta seçin…</option>
          {hastalar.map((h) => (<option key={h.id} value={h.id}>{h.label}</option>))}
        </select>
        {selectedHastaId && gorunurMu === false && (
          <div style={{ ...toolsErrorBox, marginTop: 12, background: '#FFF7E6', borderColor: `${CHROME_RENK.gold}`, color: CHROME_RENK.ink }}>
            Bu hasta reşit görünüyor ve öğrenci olarak işaretli değil. Bu araç minör hastalar ve öğrenciler içindir; yine de devam edebilirsiniz.
          </div>
        )}
      </div>

      <div style={toolsCard}>
        <label style={toolsLabel}>Rapor türü</label>
        {KATILIM_RAPORU_TURLERI.map((t) => (
          <label key={t.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', cursor: 'pointer' }}>
            <input type="radio" name="tur" checked={tur === t.id} onChange={() => setTur(t.id)} style={{ marginTop: 3 }} />
            <span>
              <strong>{t.etiket}</strong>
              <div style={{ color: CHROME_RENK.muted, fontSize: 12 }}>{t.aciklama}</div>
            </span>
          </label>
        ))}

        {tur === 'spor' && (
          <div style={{ marginTop: 12 }}>
            <label style={toolsLabel}>Spor yapmasında sakınca</label>
            <select style={toolsInput} value={sakinca} onChange={(e) => setSakinca(e.target.value as 'yok' | 'var')}>
              <option value="yok">Yoktur</option>
              <option value="var">Vardır</option>
            </select>
            <label style={{ ...toolsLabel, marginTop: 10 }}>Not (opsiyonel)</label>
            <input style={toolsInput} value={sporNot} onChange={(e) => setSporNot(e.target.value)} />
          </div>
        )}

        {tur === 'kres' && (
          <div style={{ marginTop: 12 }}>
            <label style={toolsLabel}>Bulaşıcı hastalık tarama bulgusu</label>
            <input style={toolsInput} value={bulasiciBulgu} onChange={(e) => setBulasiciBulgu(e.target.value)} />
            <p style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 6 }}>
              Aşı takviminin tam olup olmadığı aşı modülünden otomatik okunur — elle tekrar girmenize gerek yok.
            </p>
          </div>
        )}

        {tur === 'erteleme' && (
          <div style={{ marginTop: 12 }}>
            <label style={toolsLabel}>Gerekçe (gelişimsel/bedensel)</label>
            <textarea style={{ ...toolsInput, minHeight: 80 }} value={ertelemeGerekce} onChange={(e) => setErtelemeGerekce(e.target.value)} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 13 }}>
              <input type="checkbox" checked={ertelemeOner} onChange={(e) => setErtelemeOner(e.target.checked)} />
              Erteleme öneriyorum
            </label>
            <p style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 6 }}>
              Nihai karar okul idaresi/RAM'dadır; bu rapor yalnız hekim görüşüdür.
            </p>
          </div>
        )}

        {error && <div style={toolsErrorBox}>{error}</div>}

        <button style={{ ...toolsPrimaryBtn(busy), marginTop: 16 }} disabled={busy} onClick={handleOlustur}>
          {busy ? 'Oluşturuluyor…' : 'Rapor Oluştur'}
        </button>
      </div>

      {sonuc && (
        <div className="yazdir-alani" style={{ ...toolsCard, marginTop: 16 }}>
          <h2 style={{ fontFamily: CHROME_FONT.serif, fontSize: 18, marginBottom: 8 }}>
            {KATILIM_RAPORU_TURLERI.find((t) => t.id === tur)?.etiket}
          </h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, fontFamily: CHROME_FONT.sans }}>{JSON.stringify(sonuc, null, 2)}</pre>
          <button style={{ marginTop: 12 }} onClick={() => window.print()}>Yazdır</button>
        </div>
      )}
    </div>
  )
}
