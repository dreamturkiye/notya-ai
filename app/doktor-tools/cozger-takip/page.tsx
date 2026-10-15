'use client'
/**
 * NOTYA-OKUL-RAPOR-01 — ÇÖZGER takip ve katkı modülü.
 * Notya resmi ÇÖZGER raporu ÜRETMEZ — bkz. COZGER_UYARI_METNI, ekranda sabit. Base/ORTAK tool: her branş
 * açar; relevans PATIENT yaşı/öğrenci bayrağına bağlıdır (lib/doktor/okulAraclariKapisi.ts), branşa değil.
 *
 * Kurul üyeleri arasında başvuru paylaşımı: bu sürümde paylaşılan başvuru kimliği (UUID) kurul üyeleri
 * arasında kurum içi/elden paylaşılır (davet akışı henüz yok — docs/OPEN-COMMITMENTS.md § NOTYA-OKUL-RAPOR-01).
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
import { COZGER_DURUMLARI, COZGER_UYARI_METNI, OKGV_BENZERI_DUZEYLER, type CozgerDurum } from '@/lib/doktor/cozgerTakip'

type Basvuru = {
  id: string
  durum: CozgerDurum
  heyet_tarihi: string | null
  okgv_duzeyi: string | null
  okgv_sonuc_metni: string | null
  not_metni: string | null
}
type Katki = { id: string; brans: string; bulgu: string; created_at: string }

export default function CozgerTakipPage() {
  const [hastalar, setHastalar] = useState<HastaOption[]>([])
  const [selectedHastaId, setSelectedHastaId] = useState('')
  const [hastaBilgi, setHastaBilgi] = useState<{ dogumTarihi: string | null; ogrenciMi: boolean | null } | null>(null)
  const [basvuru, setBasvuru] = useState<Basvuru | null>(null)
  const [katkilar, setKatkilar] = useState<Katki[]>([])
  const [brans, setBrans] = useState('')
  const [bulgu, setBulgu] = useState('')
  const [paylasilanBasvuruId, setPaylasilanBasvuruId] = useState('')
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

  const yukle = async (hastaId: string) => {
    const token = await getAccessTokenAsync()
    if (!token) return
    const [hastaR, takipR] = await Promise.all([
      fetch(`/api/doktor/hastalar/${encodeURIComponent(hastaId)}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`/api/doktor/araclar/cozger-takip?hastaId=${encodeURIComponent(hastaId)}`, { headers: { Authorization: `Bearer ${token}` } }),
    ])
    if (hastaR.ok) {
      const j = await hastaR.json() as { patient?: { dogum_tarihi?: string | null; ogrenci_mi?: boolean | null } }
      setHastaBilgi({ dogumTarihi: j.patient?.dogum_tarihi || null, ogrenciMi: j.patient?.ogrenci_mi ?? null })
    }
    if (takipR.ok) {
      const j = await takipR.json() as { basvuru?: Basvuru | null; katkilar?: Katki[] }
      setBasvuru(j.basvuru || null)
      setKatkilar(j.katkilar || [])
    }
  }

  useEffect(() => {
    setHastaBilgi(null)
    setBasvuru(null)
    setKatkilar([])
    if (selectedHastaId) void yukle(selectedHastaId)
  }, [selectedHastaId])

  const gorunurMu = useMemo(
    () => (hastaBilgi ? okulAraclariGorunurMu({ hastaDogumIso: hastaBilgi.dogumTarihi, ogrenciMi: hastaBilgi.ogrenciMi }) : null),
    [hastaBilgi],
  )

  const basvuruOlustur = async () => {
    if (!selectedHastaId) { setError('Lütfen hasta seçin.'); return }
    setBusy(true)
    setError('')
    try {
      const token = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/araclar/cozger-takip', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ hastaId: selectedHastaId }),
      })
      const j = await r.json()
      if (!r.ok) { setError(j.error || 'Başvuru oluşturulamadı.'); return }
      setBasvuru(j.basvuru)
    } finally {
      setBusy(false)
    }
  }

  const durumGuncelle = async (durum: CozgerDurum) => {
    if (!basvuru) return
    const token = await getAccessTokenAsync()
    const r = await fetch('/api/doktor/araclar/cozger-takip', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ basvuruId: basvuru.id, durum }),
    })
    const j = await r.json()
    if (r.ok) setBasvuru(j.basvuru)
  }

  const katkiEkle = async () => {
    const basvuruId = basvuru?.id || paylasilanBasvuruId.trim()
    if (!basvuruId || !selectedHastaId || !brans.trim() || !bulgu.trim()) {
      setError('Başvuru, branş ve bulgu alanları zorunludur.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const token = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/araclar/cozger-takip/katki', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ basvuruId, hastaId: selectedHastaId, brans, bulgu }),
      })
      const j = await r.json()
      if (!r.ok) { setError(j.error || 'Katkı eklenemedi.'); return }
      setKatkilar((prev) => [j.katki, ...prev])
      setBulgu('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ ...toolsShell, padding: 20, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontFamily: CHROME_FONT.serif, fontSize: 24, color: CHROME_RENK.ink, marginBottom: 4 }}>
        ÇÖZGER takip ve katkı
      </h1>
      <div style={{ ...toolsErrorBox, background: '#FFF7E6', borderColor: CHROME_RENK.gold, color: CHROME_RENK.ink, marginBottom: 16 }}>
        {COZGER_UYARI_METNI}
      </div>

      <div style={{ ...toolsCard, marginBottom: 16 }}>
        <label style={toolsLabel}>Hasta</label>
        <select style={toolsInput} value={selectedHastaId} onChange={(e) => setSelectedHastaId(e.target.value)}>
          <option value="">Hasta seçin…</option>
          {hastalar.map((h) => (<option key={h.id} value={h.id}>{h.label}</option>))}
        </select>
        {selectedHastaId && gorunurMu === false && (
          <div style={{ ...toolsErrorBox, marginTop: 12, background: '#FFF7E6', borderColor: CHROME_RENK.gold, color: CHROME_RENK.ink }}>
            Bu hasta reşit görünüyor ve öğrenci olarak işaretli değil. ÇÖZGER başvurusu yalnız çocuk/öğrenci hastalar içindir.
          </div>
        )}
      </div>

      {selectedHastaId && (
        <div style={toolsCard}>
          {!basvuru ? (
            <>
              <p style={{ fontSize: 13, color: CHROME_RENK.muted, marginBottom: 10 }}>
                Bu hasta için henüz bir başvuru takibi yok.
              </p>
              <button style={toolsPrimaryBtn(busy)} disabled={busy} onClick={basvuruOlustur}>Başvuru takibi başlat</button>
            </>
          ) : (
            <>
              <label style={toolsLabel}>Durum</label>
              <select style={toolsInput} value={basvuru.durum} onChange={(e) => void durumGuncelle(e.target.value as CozgerDurum)}>
                {COZGER_DURUMLARI.map((d) => (<option key={d.id} value={d.id}>{d.etiket}</option>))}
              </select>
              <p style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 8 }}>
                Başvuru kodu (kurul üyeleriyle paylaşın): <code>{basvuru.id}</code>
              </p>

              <h3 style={{ fontSize: 14, marginTop: 16, marginBottom: 8 }}>Kurul katkıları (bu hekimin eklediği)</h3>
              {katkilar.length === 0 && <p style={{ fontSize: 13, color: CHROME_RENK.muted }}>Henüz katkı yok.</p>}
              {katkilar.map((k) => (
                <div key={k.id} style={{ padding: '8px 0', borderBottom: `1px solid ${CHROME_RENK.borderSoft}`, fontSize: 13 }}>
                  <strong>{k.brans}</strong>: {k.bulgu}
                </div>
              ))}

              <label style={{ ...toolsLabel, marginTop: 14 }}>Branş</label>
              <input style={toolsInput} value={brans} onChange={(e) => setBrans(e.target.value)} placeholder="Örn. Çocuk Psikiyatrisi" />
              <label style={{ ...toolsLabel, marginTop: 10 }}>Muayene bulgunuz</label>
              <textarea style={{ ...toolsInput, minHeight: 80 }} value={bulgu} onChange={(e) => setBulgu(e.target.value)} />
              <datalist id="okgv-duzeyleri">
                {OKGV_BENZERI_DUZEYLER.map((d) => (<option key={d} value={d} />))}
              </datalist>
              <button style={{ ...toolsPrimaryBtn(busy), marginTop: 12 }} disabled={busy} onClick={katkiEkle}>Katkı ekle</button>
            </>
          )}
        </div>
      )}

      {selectedHastaId && !basvuru && (
        <div style={{ ...toolsCard, marginTop: 16 }}>
          <label style={toolsLabel}>Veya paylaşılan bir başvuru koduna kendi bulgunuzu ekleyin</label>
          <input style={toolsInput} value={paylasilanBasvuruId} onChange={(e) => setPaylasilanBasvuruId(e.target.value)} placeholder="Kurul üyesinin paylaştığı başvuru kodu" />
          <label style={{ ...toolsLabel, marginTop: 10 }}>Branş</label>
          <input style={toolsInput} value={brans} onChange={(e) => setBrans(e.target.value)} />
          <label style={{ ...toolsLabel, marginTop: 10 }}>Muayene bulgunuz</label>
          <textarea style={{ ...toolsInput, minHeight: 80 }} value={bulgu} onChange={(e) => setBulgu(e.target.value)} />
          <button style={{ ...toolsPrimaryBtn(busy), marginTop: 12 }} disabled={busy} onClick={katkiEkle}>Katkı ekle</button>
        </div>
      )}

      {error && <div style={toolsErrorBox}>{error}</div>}
    </div>
  )
}
