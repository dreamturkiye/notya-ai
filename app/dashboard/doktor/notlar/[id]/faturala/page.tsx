'use client'

/**
 * NOTYA-ACCOUNTING-ENCOUNTER-01 — "Faturala" review screen, the natural last step after a doctor
 * approves a muayene note (see the button in ../page.tsx). Base/universal — reached from the one
 * shared notlar page every ~30 specialties use, never a chapter fork.
 *
 * No invoice-line-editing API exists yet in this module (only create-draft / issue / cancel /
 * credit — see lib/accounting/invoices/engine.ts) — "adjust before issuing" therefore happens HERE,
 * before the draft is created, rather than on an already-created draft. Once the doctor confirms,
 * this hands off into the existing Faturalama & Tahsilat panel (Faturalar tab), pre-populated and
 * highlighted, where "Kes" (issue) / "Ödeme bağlantısı" already work unchanged — least duplication,
 * per the brief.
 */
import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme'
import { formatTRY } from '@/lib/accounting/ledger/money'

const INK = CHROME_RENK.ink
const MUTED = CHROME_RENK.muted
const BORDER = CHROME_RENK.border
const TEAL = CHROME_RENK.pine

interface EditableLine {
  key: string
  serviceId: string | null
  description: string
  quantity: number
  unitPriceTRY: string // text input, parsed to kuruş on submit
  kdvRateBp: number
}

async function api(path: string, opts: RequestInit = {}) {
  const token = await ensureDoctorAccessToken()
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.success === false) throw new Error(json.error || 'İşlem başarısız.')
  return json
}

export default function FaturalaPage() {
  const router = useRouter()
  const search = useSearchParams()
  const encounterId = search.get('session') || ''
  const asiNames = (search.get('asi') || '').split('|').map((s) => s.trim()).filter(Boolean)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [moduleEnabled, setModuleEnabled] = useState(true)
  const [patientId, setPatientId] = useState<string | null>(null)
  const [lines, setLines] = useState<EditableLine[]>([])
  const [unmatchedAsiNames, setUnmatchedAsiNames] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!encounterId) {
      setError('Bu not bir muayeneye bağlı değil — fatura bu ekrandan oluşturulamıyor. Faturalar sekmesinden elle oluşturabilirsiniz.')
      setLoading(false)
      return
    }
    (async () => {
      try {
        const res = await api('/api/accounting/invoices/suggest-from-encounter', {
          method: 'POST',
          body: JSON.stringify({ encounterId, asiNames }),
        })
        const data = res.data || {}
        setModuleEnabled(!!data.moduleEnabled)
        setPatientId(data.patientId ?? null)
        setUnmatchedAsiNames(data.unmatchedAsiNames || [])
        setLines(
          (data.lines || []).map((l: any, i: number) => ({
            key: `${l.serviceId || 'free'}-${i}`,
            serviceId: l.serviceId ?? null,
            description: l.description,
            quantity: l.quantity,
            unitPriceTRY: (l.unitPriceKurus / 100).toFixed(2),
            kdvRateBp: l.kdvRateBp,
          }))
        )
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Öneri hazırlanamadı.')
      } finally {
        setLoading(false)
      }
    })()
  }, [encounterId])

  const updateLine = (key: string, patch: Partial<EditableLine>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  const removeLine = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key))
  const addFreeLine = () =>
    setLines((prev) => [...prev, { key: `free-${Date.now()}`, serviceId: null, description: '', quantity: 1, unitPriceTRY: '0', kdvRateBp: 1000 }])

  const createDraft = async () => {
    if (!lines.length) { setError('En az bir satır gerekli.'); return }
    setCreating(true)
    setError('')
    try {
      const res = await api('/api/accounting/invoices', {
        method: 'POST',
        body: JSON.stringify({
          patientId,
          encounterId,
          lines: lines.map((l) => ({
            serviceId: l.serviceId,
            description: l.description,
            quantity: l.quantity,
            unitPriceKurus: Math.round(parseFloat(l.unitPriceTRY || '0') * 100),
            kdvRateBp: l.kdvRateBp,
          })),
        }),
      })
      router.push(`/dashboard/doktor/entegrasyonlar/faturalama?tab=faturalar&invoiceId=${res.data.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Taslak oluşturulamadı.')
      setCreating(false)
    }
  }

  const inputStyle: React.CSSProperties = { padding: '7px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13.5, fontFamily: CHROME_FONT.sans, color: INK }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px', fontFamily: CHROME_FONT.sans, color: INK }}>
      <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 22, marginBottom: 4 }}>Faturala</div>
      <div style={{ fontSize: 13, color: MUTED, marginBottom: 18 }}>
        Bu muayeneden taslak fatura oluşturun. Hasta ve önerilen kalemler bu muayeneden geldi — kesmeden önce düzenleyebilirsiniz.
      </div>

      {loading && <div style={{ color: MUTED, fontSize: 13 }}>Yükleniyor…</div>}
      {error && <div style={{ color: CHROME_RENK.warn, fontSize: 13, marginBottom: 14 }}>{error}</div>}

      {!loading && !moduleEnabled && (
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 14, marginBottom: 10 }}>Faturalama &amp; Tahsilat modülü henüz açık değil.</div>
          <a href="/dashboard/doktor/entegrasyonlar/faturalama" style={{ color: TEAL, fontSize: 13.5, fontWeight: 700 }}>Entegrasyonlar → Faturalama &amp; Tahsilat'a git</a>
        </div>
      )}

      {!loading && moduleEnabled && !error && (
        <>
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 10 }}>
              {patientId ? 'Hasta bu muayeneden otomatik eşlendi.' : 'Bu muayenede kayıtlı bir hasta yok — fatura hastasız (serbest) oluşturulacak.'}
            </div>
            {lines.map((l) => (
              <div key={l.key} style={{ display: 'grid', gridTemplateColumns: '2fr 70px 100px auto', gap: 8, alignItems: 'center', padding: '8px 0', borderTop: `1px solid ${BORDER}` }}>
                <input style={inputStyle} value={l.description} onChange={(e) => updateLine(l.key, { description: e.target.value })} />
                <input style={inputStyle} value={l.quantity} onChange={(e) => updateLine(l.key, { quantity: Number(e.target.value) || 1 })} />
                <input style={inputStyle} value={l.unitPriceTRY} onChange={(e) => updateLine(l.key, { unitPriceTRY: e.target.value })} />
                <button type="button" onClick={() => removeLine(l.key)} style={{ border: 'none', background: 'transparent', color: CHROME_RENK.warn, cursor: 'pointer', fontSize: 12.5 }}>Kaldır</button>
              </div>
            ))}
            {!lines.length && <div style={{ color: MUTED, fontSize: 13, padding: '8px 0' }}>Önerilen kalem yok — katalogda aktif bir "muayene" kalemi tanımlı değil. Elle satır ekleyin.</div>}
            <button type="button" onClick={addFreeLine} style={{ marginTop: 10, border: `1px solid ${TEAL}`, background: 'transparent', color: TEAL, borderRadius: 8, padding: '6px 12px', fontSize: 12.5, cursor: 'pointer' }}>
              + Satır ekle
            </button>
          </div>

          {unmatchedAsiNames.length > 0 && (
            <div style={{ fontSize: 12.5, color: CHROME_RENK.warn, marginBottom: 14 }}>
              Bu muayenede uygulanan şu aşılar katalogda fiyatlı bir kalemle eşleşmedi, faturaya eklenmedi: {unmatchedAsiNames.join(', ')}.
              Katalog sekmesinden fiyat tanımlayıp elle satır ekleyebilirsiniz.
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" disabled={creating} onClick={() => void createDraft()} style={{ background: TEAL, border: 'none', color: '#fff', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {creating ? 'Oluşturuluyor…' : 'Taslak oluştur'}
            </button>
            <button type="button" onClick={() => router.back()} style={{ background: 'transparent', border: `1px solid ${BORDER}`, color: INK, borderRadius: 10, padding: '10px 18px', fontSize: 14, cursor: 'pointer' }}>
              Vazgeç
            </button>
          </div>
        </>
      )}
    </div>
  )
}
