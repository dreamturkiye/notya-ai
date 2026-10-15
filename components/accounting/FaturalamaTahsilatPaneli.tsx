'use client'

/**
 * NOTYA-ACCOUNTING-01 — Entegrasyonlar → Faturalama & Tahsilat.
 * Visual language matches the existing doktor chrome (CHROME_RENK/CHROME_FONT from
 * lib/doktor/chromeTheme.ts, the same cream/pine/warm-card look used throughout
 * app/dashboard/doktor/entegrasyonlar/page.tsx) rather than introducing a new design system.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { getDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme'
import { formatTRY } from '@/lib/accounting/ledger/money'

const TEAL = CHROME_RENK.pine
const CARD = '#FFFFFF'
const BORDER = CHROME_RENK.border
const INK = CHROME_RENK.ink
const MUTED = CHROME_RENK.muted
const WARN = CHROME_RENK.warn

type Tab = 'kurulum' | 'katalog' | 'faturalar' | 'tahsilat' | 'raporlar'

const NESTPAY_GROUP_KEYS = ['isbank', 'halkbank', 'teb', 'qnb', 'ziraat', 'akbank']

const ENVIRONMENT_LABELS: Record<string, string> = { test: 'Test', live: 'Canlı' }
const VERIFICATION_LABELS: Record<string, string> = { VERIFIED: 'Doğrulandı', BEST_EFFORT_UNVERIFIED: 'Doğrulanmamış (en iyi çaba)' }

const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak',
  pending_issue: 'Kesiliyor',
  issued: 'Kesildi',
  issue_failed: 'Kesim başarısız',
  partially_paid: 'Kısmi ödendi',
  paid: 'Ödendi',
  cancel_pending: 'İptal bekliyor',
  cancelled: 'İptal edildi',
  credit_pending: 'İade bekliyor',
  credited: 'İade edildi',
}

const DOC_TYPE_LABELS: Record<string, string> = { esmm: 'e-SMM', efatura: 'e-Fatura', earsiv: 'e-Arşiv' }

const EBELGE_VENDOR_LABELS: Record<string, string> = {
  generic_rest: 'Genel REST',
  nes: 'NES',
  qnb_esolutions: 'QNB eSolutions',
  logo: 'Logo',
  other: 'Diğer',
}

const CREDENTIAL_FIELD_LABELS: Record<string, string> = {
  baseUrl: 'Servis Adresi',
  apiKey: 'API Anahtarı',
  secretKey: 'Gizli Anahtar',
  merchantId: 'Üye İşyeri Numarası',
  storeKey: 'Mağaza Anahtarı',
  clientId: 'Üye İşyeri Numarası',
  gatewayUrl: 'Sanal POS Adresi',
  username: 'Kullanıcı Adı',
  password: 'Şifre',
}

function formatMaskedFields(fields: Record<string, string> | undefined | null): string {
  if (!fields) return ''
  return Object.entries(fields)
    .map(([k, v]) => `${CREDENTIAL_FIELD_LABELS[k] || k}: ${v}`)
    .join(', ')
}

const AY_ADLARI = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const METHOD_LABELS: Record<string, string> = { card_3ds: 'Kredi/Banka Kartı (3D)', nakit: 'Nakit', havale_eft: 'Havale/EFT' }

const BANK_LABELS: Record<string, string> = {
  generic_hosted: 'Genel sanal POS (gerçek, sandbox)',
  yapi_kredi: 'Yapı Kredi',
  isbank: 'Türkiye İş Bankası',
  garanti: 'Garanti BBVA',
  akbank: 'Akbank',
  qnb: 'QNB',
  ziraat: 'Ziraat Bankası',
  vakifbank: 'VakıfBank',
  halkbank: 'Halkbank',
  denizbank: 'Denizbank',
  teb: 'TEB',
  kuveyt_turk: 'Kuveyt Türk',
}

/** Some gateways (NestPay "3D Pay Hosting") deliver their session as form fields the BROWSER
 *  must POST, not a URL it can simply navigate to — see lib/accounting/types.ts HostedSession. */
function submitRedirectForm(url: string, fields: Record<string, string>) {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = url
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  }
  document.body.appendChild(form)
  form.submit()
}

async function api(path: string, opts: RequestInit = {}) {
  const token = getDoctorAccessToken()
  const res = await fetch(`/api/accounting${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.success === false) throw new Error(json.error || 'İşlem başarısız.')
  return json
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
      <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 18, color: INK, marginBottom: 2 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: MUTED, marginBottom: 14 }}>{subtitle}</div>}
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 5 }}>{label}</div>
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 10,
  border: `1px solid ${BORDER}`,
  fontSize: 14,
  color: INK,
  fontFamily: CHROME_FONT.sans,
  background: '#fff',
}

const buttonStyle: React.CSSProperties = {
  padding: '9px 16px',
  borderRadius: 10,
  border: 'none',
  background: TEAL,
  color: '#fff',
  fontSize: 13.5,
  fontWeight: 600,
  cursor: 'pointer',
}

export default function FaturalamaTahsilatPaneli() {
  const [tab, setTab] = useState<Tab>('kurulum')
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Tax profile
  const [tax, setTax] = useState({ idType: 'tckn', idValue: '', unvan: '', address: '', vergiDairesi: '' })

  // e-Belge
  const [ebelgeVendor, setEbelgeVendor] = useState<'generic_rest' | 'nes' | 'qnb_esolutions' | 'logo' | 'other'>('generic_rest')
  const [ebelgeEnv, setEbelgeEnv] = useState<'test' | 'live'>('test')
  const [ebelgeFields, setEbelgeFields] = useState<Record<string, string>>({ baseUrl: '', apiKey: '' })
  const [ebelgeStatus, setEbelgeStatus] = useState<any>(null)
  const [testResult, setTestResult] = useState('')

  // Payment provider — hybrid model (Kaan, 2026-10-15): facilitator (iyzico) is the default/
  // recommended path; direct bank adapters are a parallel, optional path for doctors who already
  // have their own merchant account. 'provider' picks which one "Ödeme bağlantısı" actually uses.
  const [provider, setProvider] = useState<'facilitator' | 'bank'>('facilitator')

  // Facilitator (iyzico) merchant
  const [facilitatorEnv, setFacilitatorEnv] = useState<'test' | 'live'>('test')
  const [facilitatorFields, setFacilitatorFields] = useState<Record<string, string>>({ apiKey: '', secretKey: '' })
  const [facilitators, setFacilitators] = useState<any>({ configured: [], catalog: [] })
  // Buyer identity for the one charge being attempted — iyzico's Checkout Form requires it and
  // Notya does not yet auto-resolve it from the patient record (docs/OPEN-COMMITMENTS.md
  // ACCOUNTING-11), so it is collected here, once, right before "Ödeme bağlantısı".
  const [buyer, setBuyer] = useState({ name: '', surname: '', identityNumber: '', registrationAddress: '', city: '' })

  // Bank merchants
  const [bankKey, setBankKey] = useState('generic_hosted')
  const [bankEnv, setBankEnv] = useState<'test' | 'live'>('test')
  const [bankFields, setBankFields] = useState<Record<string, string>>({ baseUrl: '', merchantId: '', storeKey: '' })
  const [banks, setBanks] = useState<any>({ configured: [], catalog: [] })

  // Catalog
  const [services, setServices] = useState<any[]>([])
  const [newService, setNewService] = useState({ kind: 'muayene', name: '', description: '', priceKurus: '' })

  // Invoices / AR / reports
  const [invoices, setInvoices] = useState<any[]>([])
  const [aging, setAging] = useState<any>(null)
  const [draft, setDraft] = useState<{ patientId: string; serviceId: string; quantity: string }>({ patientId: '', serviceId: '', quantity: '1' })
  const [busyInvoiceId, setBusyInvoiceId] = useState<string | null>(null)

  // Raporlar — mali müşavir aylık raporu. Strictly monthly (Kaan, 2026-10-15: "Bu raporlar
  // sadece aylık olabilir") — no custom range anywhere in this tab.
  const now = new Date()
  const [musavirYear, setMusavirYear] = useState(now.getFullYear())
  const [musavirMonth, setMusavirMonth] = useState(now.getMonth() + 1)
  const [musavirReport, setMusavirReport] = useState<any>(null)
  const [musavirLoading, setMusavirLoading] = useState(false)
  const [musavirExporting, setMusavirExporting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const mod = await api('/module')
      setEnabled(!!mod.data?.enabled)
      const svc = await api('/catalog?includeInactive=1')
      setServices(svc.data || [])
      const bk = await api('/bank-merchants')
      setBanks(bk.data || { configured: [], catalog: [] })
      const fc = await api('/facilitator-merchants')
      setFacilitators(fc.data || { configured: [], catalog: [] })
      const eb = await api('/ebelge-credentials')
      setEbelgeStatus(eb.data)
      const inv = await api('/invoices')
      setInvoices(inv.data || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const toggleModule = async (next: boolean) => {
    try {
      await api('/module', { method: 'PUT', body: JSON.stringify({ enabled: next }) })
      setEnabled(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Değiştirilemedi.')
    }
  }

  const saveTax = async () => {
    try {
      await api('/tax-profile', { method: 'PUT', body: JSON.stringify(tax) })
      setNotice('Vergi profili kaydedildi.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydedilemedi.')
    }
  }

  const saveEbelge = async () => {
    try {
      const res = await api('/ebelge-credentials', { method: 'POST', body: JSON.stringify({ vendor: ebelgeVendor, environment: ebelgeEnv, fields: ebelgeFields }) })
      setNotice(res.data?.isReal ? 'Entegratör kaydedildi (gerçek, çalışan bağlantı).' : 'Entegratör kaydedildi — ancak bu sağlayıcı henüz uygulanmadı (CHECKLIST.md).')
      const eb = await api('/ebelge-credentials')
      setEbelgeStatus(eb.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydedilemedi.')
    }
  }

  const testEbelge = async () => {
    setTestResult('Test ediliyor…')
    try {
      const res = await api('/ebelge-credentials/test', { method: 'POST' })
      setTestResult(res.data.ok ? 'Bağlantı başarılı.' : `Bağlantı başarısız: ${res.data.detail || ''}`)
    } catch (e) {
      setTestResult(e instanceof Error ? e.message : 'Test edilemedi.')
    }
  }

  const saveBank = async () => {
    try {
      const res = await api('/bank-merchants', { method: 'POST', body: JSON.stringify({ bankKey, environment: bankEnv, fields: bankFields }) })
      setNotice(res.warning || 'Banka hesabı kaydedildi.')
      const bk = await api('/bank-merchants')
      setBanks(bk.data || { configured: [], catalog: [] })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydedilemedi.')
    }
  }

  const saveFacilitator = async () => {
    try {
      const res = await api('/facilitator-merchants', {
        method: 'POST',
        body: JSON.stringify({ facilitatorKey: 'iyzico', environment: facilitatorEnv, fields: facilitatorFields }),
      })
      setNotice(res.warning || 'iyzico hesabı kaydedildi.')
      const fc = await api('/facilitator-merchants')
      setFacilitators(fc.data || { configured: [], catalog: [] })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydedilemedi.')
    }
  }

  const addService = async () => {
    try {
      await api('/catalog', {
        method: 'POST',
        body: JSON.stringify({ ...newService, priceKurus: Math.round(parseFloat(newService.priceKurus || '0') * 100) }),
      })
      setNewService({ kind: newService.kind, name: '', description: '', priceKurus: '' })
      const svc = await api('/catalog?includeInactive=1')
      setServices(svc.data || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eklenemedi.')
    }
  }

  const createDraftFromCatalog = async () => {
    const service = services.find((s) => s.id === draft.serviceId)
    if (!service) {
      setError('Bir katalog kalemi seçin.')
      return
    }
    try {
      await api('/invoices', {
        method: 'POST',
        body: JSON.stringify({
          patientId: draft.patientId || null,
          lines: [
            {
              serviceId: service.id,
              description: service.name,
              quantity: Number(draft.quantity) || 1,
              unitPriceKurus: service.priceKurus,
              kdvRateBp: service.kdvRateBp,
            },
          ],
        }),
      })
      setNotice('Taslak fatura oluşturuldu.')
      const inv = await api('/invoices')
      setInvoices(inv.data || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Taslak oluşturulamadı.')
    }
  }

  const issueOne = async (invoiceId: string) => {
    setBusyInvoiceId(invoiceId)
    try {
      await api(`/invoices/${invoiceId}/issue`, { method: 'POST' })
      setNotice('Fatura kesildi (veya entegratör hatası döndüyse durum güncellendi).')
      const inv = await api('/invoices')
      setInvoices(inv.data || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kesilemedi.')
    } finally {
      setBusyInvoiceId(null)
    }
  }

  const chargeOne = async (invoiceId: string) => {
    setBusyInvoiceId(invoiceId)
    try {
      if (provider === 'facilitator') {
        if (!buyer.surname || !buyer.identityNumber || !buyer.registrationAddress || !buyer.city) {
          throw new Error('iyzico ile tahsilat için önce alıcı bilgilerini (ad, soyad, TCKN, adres, şehir) girin.')
        }
        const res = await api('/payments/facilitator-sessions', {
          method: 'POST',
          body: JSON.stringify({
            invoiceId,
            facilitatorKey: 'iyzico',
            returnUrl: window.location.href,
            buyerName: buyer.name,
            buyer: {
              surname: buyer.surname,
              identityNumber: buyer.identityNumber,
              registrationAddress: buyer.registrationAddress,
              city: buyer.city,
            },
          }),
        })
        if (res.data?.redirectUrl) window.location.href = res.data.redirectUrl
      } else {
        const res = await api('/payments/sessions', {
          method: 'POST',
          body: JSON.stringify({ invoiceId, bankKey: bankKey || 'generic_hosted', returnUrl: window.location.href }),
        })
        if (res.data?.redirectMethod === 'POST' && res.data?.redirectFormFields) {
          submitRedirectForm(res.data.redirectUrl, res.data.redirectFormFields)
        } else if (res.data?.redirectUrl) {
          window.location.href = res.data.redirectUrl
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ödeme oturumu açılamadı — bu sağlayıcı henüz uygulanmamış olabilir (bkz. CHECKLIST.md).')
    } finally {
      setBusyInvoiceId(null)
    }
  }

  const loadAging = async () => {
    try {
      const res = await api('/ar/aging')
      setAging(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi.')
    }
  }

  const loadMusavirReport = useCallback(async (year: number, month: number) => {
    setMusavirLoading(true)
    try {
      const res = await api(`/reports?type=musavir&year=${year}&month=${month}`)
      setMusavirReport(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Rapor yüklenemedi.')
    } finally {
      setMusavirLoading(false)
    }
  }, [])

  const exportMusavir = async () => {
    setMusavirExporting(true)
    try {
      const token = getDoctorAccessToken()
      const res = await fetch(`/api/accounting/reports/musavir-export?year=${musavirYear}&month=${musavirMonth}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Rapor oluşturulamadı.')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `musavir-raporu-${musavirYear}-${String(musavirMonth).padStart(2, '0')}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setNotice('Mali müşavir raporu indirildi.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Rapor oluşturulamadı.')
    } finally {
      setMusavirExporting(false)
    }
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'kurulum', label: 'Kurulum' },
    { key: 'katalog', label: 'Katalog' },
    { key: 'faturalar', label: 'Faturalar' },
    { key: 'tahsilat', label: 'Tahsilat / Alacak' },
    { key: 'raporlar', label: 'Raporlar' },
  ]

  return (
    <div style={{ fontFamily: CHROME_FONT.sans, color: INK }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 22, color: INK }}>Faturalama &amp; Tahsilat</div>
          <div style={{ fontSize: 13, color: MUTED }}>Notya Accounting — isteğe bağlı modül. Banka sanal POS ve e-belge hesapları size aittir.</div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
          <input type="checkbox" checked={enabled} onChange={(e) => void toggleModule(e.target.checked)} />
          {enabled ? 'Açık' : 'Kapalı'}
        </label>
      </div>

      {error && <div style={{ color: WARN, fontSize: 13, marginBottom: 12 }}>{error}</div>}
      {notice && <div style={{ color: TEAL, fontSize: 13, marginBottom: 12 }}>{notice}</div>}

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key)
              if (t.key === 'tahsilat') void loadAging()
              if (t.key === 'raporlar' && !musavirReport) void loadMusavirReport(musavirYear, musavirMonth)
            }}
            style={{
              padding: '7px 14px',
              borderRadius: 999,
              border: `1px solid ${BORDER}`,
              background: tab === t.key ? TEAL : '#fff',
              color: tab === t.key ? '#fff' : INK,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!enabled && (
        <div style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>
          Modül kapalı: faturalama menüsü, ödeme bağlantıları ve e-belge işleri hastaya/sekretere görünmez. Kurulumu
          tamamlayıp açabilirsiniz.
        </div>
      )}

      {loading ? (
        <div style={{ color: MUTED, fontSize: 13 }}>Yükleniyor…</div>
      ) : (
        <>
          {tab === 'kurulum' && (
            <>
              <SectionCard title="Vergi profili" subtitle="Belgeler sizin TCKN/VKN kimliğiniz altında kesilir — Notya asla belge düzenleyici olmaz.">
                <Field label="Kimlik türü">
                  <select style={inputStyle} value={tax.idType} onChange={(e) => setTax({ ...tax, idType: e.target.value })}>
                    <option value="tckn">TCKN (bağımsız hekim)</option>
                    <option value="vkn">VKN (klinik/şirket)</option>
                  </select>
                </Field>
                <Field label={tax.idType === 'vkn' ? 'VKN' : 'TCKN'}>
                  <input style={inputStyle} value={tax.idValue} onChange={(e) => setTax({ ...tax, idValue: e.target.value })} />
                </Field>
                <Field label="Unvan">
                  <input style={inputStyle} value={tax.unvan} onChange={(e) => setTax({ ...tax, unvan: e.target.value })} />
                </Field>
                <Field label="Adres">
                  <input style={inputStyle} value={tax.address} onChange={(e) => setTax({ ...tax, address: e.target.value })} />
                </Field>
                <Field label="Vergi dairesi (opsiyonel)">
                  <input style={inputStyle} value={tax.vergiDairesi} onChange={(e) => setTax({ ...tax, vergiDairesi: e.target.value })} />
                </Field>
                <button style={buttonStyle} onClick={() => void saveTax()}>
                  Kaydet
                </button>
              </SectionCard>

              <SectionCard
                title="e-Belge entegratörü"
                subtitle="e-SMM / e-Fatura / e-Arşiv, sizin entegratörünüz üzerinden gönderilir. Şu an yalnız 'Genel REST' sağlayıcısı gerçek çalışır bağlantıdır; NES / QNB eSolutions / Logo için kontrol listesi: lib/accounting/ebelge/CHECKLIST.md."
              >
                <Field label="Entegratör">
                  <select style={inputStyle} value={ebelgeVendor} onChange={(e) => setEbelgeVendor(e.target.value as any)}>
                    <option value="generic_rest">Genel REST (gerçek, sandbox uyumlu)</option>
                    <option value="nes">NES (henüz uygulanmadı)</option>
                    <option value="qnb_esolutions">QNB eSolutions (henüz uygulanmadı)</option>
                    <option value="logo">Logo (henüz uygulanmadı)</option>
                    <option value="other">Diğer (henüz uygulanmadı)</option>
                  </select>
                </Field>
                <Field label="Ortam">
                  <select style={inputStyle} value={ebelgeEnv} onChange={(e) => setEbelgeEnv(e.target.value as any)}>
                    <option value="test">Test</option>
                    <option value="live">Canlı</option>
                  </select>
                </Field>
                <Field label="Servis Adresi (URL)">
                  <input style={inputStyle} value={ebelgeFields.baseUrl || ''} onChange={(e) => setEbelgeFields({ ...ebelgeFields, baseUrl: e.target.value })} />
                </Field>
                <Field label="API Anahtarı">
                  <input style={inputStyle} type="password" value={ebelgeFields.apiKey || ''} onChange={(e) => setEbelgeFields({ ...ebelgeFields, apiKey: e.target.value })} />
                </Field>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={buttonStyle} onClick={() => void saveEbelge()}>
                    Kaydet
                  </button>
                  <button style={{ ...buttonStyle, background: '#fff', color: TEAL, border: `1px solid ${TEAL}` }} onClick={() => void testEbelge()}>
                    Bağlantıyı test et
                  </button>
                </div>
                {testResult && <div style={{ fontSize: 13, marginTop: 8, color: MUTED }}>{testResult}</div>}
                {ebelgeStatus && (
                  <div style={{ fontSize: 12.5, marginTop: 10, color: MUTED }}>
                    Kayıtlı: {EBELGE_VENDOR_LABELS[ebelgeStatus.vendor] || ebelgeStatus.vendor} ({ENVIRONMENT_LABELS[ebelgeStatus.environment] || ebelgeStatus.environment}) —
                    alanlar: {formatMaskedFields(ebelgeStatus.maskedFields)}
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Ödeme kuruluşu — iyzico (önerilen)"
                subtitle="Varsayılan ve en hızlı yol: kendi iyzico hesabınızı bağlayın. Kart bilgisi hiçbir zaman Notya'ya ulaşmaz — ödeme iyzico'nun kendi ödeme sayfasında alınır (PCI SAQ-A). Doğrulama durumu: VERIFIED (docs.iyzico.com üzerinden, 2026-10-15)."
              >
                <Field label="Ortam">
                  <select style={inputStyle} value={facilitatorEnv} onChange={(e) => setFacilitatorEnv(e.target.value as any)}>
                    <option value="test">Test</option>
                    <option value="live">Canlı</option>
                  </select>
                </Field>
                <Field label="API Anahtarı">
                  <input style={inputStyle} value={facilitatorFields.apiKey || ''} onChange={(e) => setFacilitatorFields({ ...facilitatorFields, apiKey: e.target.value })} />
                </Field>
                <Field label="Gizli Anahtar">
                  <input style={inputStyle} type="password" value={facilitatorFields.secretKey || ''} onChange={(e) => setFacilitatorFields({ ...facilitatorFields, secretKey: e.target.value })} />
                </Field>
                <button style={buttonStyle} onClick={() => void saveFacilitator()}>
                  Kaydet
                </button>
                <div style={{ marginTop: 14 }}>
                  {(facilitators.configured || []).map((f: any) => (
                    <div key={f.id} style={{ fontSize: 12.5, color: MUTED, padding: '6px 0', borderTop: `1px solid ${BORDER}` }}>
                      iyzico — {ENVIRONMENT_LABELS[f.environment] || f.environment} — {VERIFICATION_LABELS[f.verificationStatus || 'VERIFIED'] || f.verificationStatus}
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                title="Ödeme kaynağı seçimi"
                subtitle="'Ödeme bağlantısı' hangi sağlayıcıyı kullansın? iyzico önerilir; kendi banka sanal POS hesabınız varsa doğrudan banka da seçebilirsiniz."
              >
                <Field label="Sağlayıcı">
                  <select style={inputStyle} value={provider} onChange={(e) => setProvider(e.target.value as any)}>
                    <option value="facilitator">iyzico (önerilen)</option>
                    <option value="bank">Doğrudan banka sanal POS</option>
                  </select>
                </Field>
                {provider === 'facilitator' && (
                  <>
                    <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 8 }}>
                      Alıcı bilgileri (iyzico'nun ödeme formu için zorunlu — bkz. ACCOUNTING-11):
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <Field label="Ad">
                        <input style={inputStyle} value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} />
                      </Field>
                      <Field label="Soyad">
                        <input style={inputStyle} value={buyer.surname} onChange={(e) => setBuyer({ ...buyer, surname: e.target.value })} />
                      </Field>
                    </div>
                    <Field label="TCKN">
                      <input style={inputStyle} value={buyer.identityNumber} onChange={(e) => setBuyer({ ...buyer, identityNumber: e.target.value })} />
                    </Field>
                    <Field label="Adres">
                      <input style={inputStyle} value={buyer.registrationAddress} onChange={(e) => setBuyer({ ...buyer, registrationAddress: e.target.value })} />
                    </Field>
                    <Field label="Şehir">
                      <input style={inputStyle} value={buyer.city} onChange={(e) => setBuyer({ ...buyer, city: e.target.value })} />
                    </Field>
                  </>
                )}
              </SectionCard>

              <SectionCard
                title="Banka sanal POS (doğrudan, aşamalı)"
                subtitle="İş Bankası / Halkbank / TEB / QNB / Ziraat / Akbank (NestPay 3D Pay Hosting, ortak tek adaptör), Garanti BBVA (Ortak Ödeme Sayfası) ve Yapı Kredi (POSNET OOS) artık gerçek çalışır. VakıfBank / Denizbank / Kuveyt Türk henüz stub. 'Genel sanal POS' de gerçek çalışır bağlantıdır. Kontrol listesi: lib/accounting/banks/CHECKLIST.md."
              >
                <Field label="Banka">
                  <select style={inputStyle} value={bankKey} onChange={(e) => setBankKey(e.target.value)}>
                    {(banks.catalog || []).map((b: any) => (
                      <option key={b.bankKey} value={b.bankKey}>
                        {BANK_LABELS[b.bankKey] || b.bankKey} {b.isReal ? '' : '— henüz uygulanmadı'}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Ortam">
                  <select style={inputStyle} value={bankEnv} onChange={(e) => setBankEnv(e.target.value as any)}>
                    <option value="test">Test</option>
                    <option value="live">Canlı</option>
                  </select>
                </Field>
                {NESTPAY_GROUP_KEYS.includes(bankKey) ? (
                  <>
                    <Field label="Sanal POS Adresi (bankanızdan aldığınız 3D Pay Hosting adresi)">
                      <input style={inputStyle} value={bankFields.gatewayUrl || ''} onChange={(e) => setBankFields({ ...bankFields, gatewayUrl: e.target.value })} />
                    </Field>
                    <Field label="Üye İşyeri Numarası">
                      <input style={inputStyle} value={bankFields.clientId || ''} onChange={(e) => setBankFields({ ...bankFields, clientId: e.target.value })} />
                    </Field>
                    <Field label="Mağaza Anahtarı">
                      <input style={inputStyle} type="password" value={bankFields.storeKey || ''} onChange={(e) => setBankFields({ ...bankFields, storeKey: e.target.value })} />
                    </Field>
                    <Field label="Kullanıcı adı (opsiyonel — durum sorgusu için)">
                      <input style={inputStyle} value={bankFields.username || ''} onChange={(e) => setBankFields({ ...bankFields, username: e.target.value })} />
                    </Field>
                    <Field label="Şifre (opsiyonel — durum sorgusu için)">
                      <input style={inputStyle} type="password" value={bankFields.password || ''} onChange={(e) => setBankFields({ ...bankFields, password: e.target.value })} />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="Sanal POS Adresi">
                      <input style={inputStyle} value={bankFields.baseUrl || ''} onChange={(e) => setBankFields({ ...bankFields, baseUrl: e.target.value })} />
                    </Field>
                    <Field label="Üye İşyeri Numarası">
                      <input style={inputStyle} value={bankFields.merchantId || ''} onChange={(e) => setBankFields({ ...bankFields, merchantId: e.target.value })} />
                    </Field>
                    <Field label="Mağaza Anahtarı">
                      <input style={inputStyle} type="password" value={bankFields.storeKey || ''} onChange={(e) => setBankFields({ ...bankFields, storeKey: e.target.value })} />
                    </Field>
                  </>
                )}
                <button style={buttonStyle} onClick={() => void saveBank()}>
                  Kaydet
                </button>
                <div style={{ marginTop: 14 }}>
                  {(banks.configured || []).map((b: any) => (
                    <div key={b.id} style={{ fontSize: 12.5, color: MUTED, padding: '6px 0', borderTop: `1px solid ${BORDER}` }}>
                      {BANK_LABELS[b.bank_key] || b.bank_key} — {ENVIRONMENT_LABELS[b.environment] || b.environment} — {b.isReal ? 'kullanılabilir' : 'henüz uygulanmadı'}
                    </div>
                  ))}
                </div>
              </SectionCard>
            </>
          )}

          {tab === 'katalog' && (
            <SectionCard title="Hizmet kataloğu" subtitle="Sınırsız sayıda muayene, aşı, hizmet ve paket tanımlayabilirsiniz — her biri kendi adı, açıklaması ve fiyatıyla.">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <Field label="Tür">
                  <select style={inputStyle} value={newService.kind} onChange={(e) => setNewService({ ...newService, kind: e.target.value })}>
                    <option value="muayene">Muayene</option>
                    <option value="asi">Aşı</option>
                    <option value="hizmet">Hizmet</option>
                    <option value="paket">Paket</option>
                  </select>
                </Field>
                <Field label="Fiyat (TRY)">
                  <input style={inputStyle} value={newService.priceKurus} onChange={(e) => setNewService({ ...newService, priceKurus: e.target.value })} />
                </Field>
              </div>
              <Field label="Ad">
                <input style={inputStyle} value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} />
              </Field>
              <Field label="Açıklama">
                <input style={inputStyle} value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} />
              </Field>
              <button style={buttonStyle} onClick={() => void addService()}>
                Ekle
              </button>

              <div style={{ marginTop: 18 }}>
                {services.map((s) => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: `1px solid ${BORDER}`, fontSize: 13.5 }}>
                    <div>
                      <strong>{s.name}</strong> <span style={{ color: MUTED }}>({s.kind})</span>
                      {s.description && <div style={{ color: MUTED, fontSize: 12 }}>{s.description}</div>}
                    </div>
                    <div>{formatTRY(s.priceKurus)}</div>
                  </div>
                ))}
                {!services.length && <div style={{ color: MUTED, fontSize: 13 }}>Henüz hizmet tanımlanmadı.</div>}
              </div>
            </SectionCard>
          )}

          {tab === 'faturalar' && (
            <>
              <SectionCard title="Yeni taslak fatura" subtitle="Katalogdan bir kalem seçip taslak oluşturun; ardından kesin (issue) veya ödeme bağlantısı açın.">
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                  <Field label="Katalog kalemi">
                    <select style={inputStyle} value={draft.serviceId} onChange={(e) => setDraft({ ...draft, serviceId: e.target.value })}>
                      <option value="">Seçin…</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} — {formatTRY(s.priceKurus)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Adet">
                    <input style={inputStyle} value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: e.target.value })} />
                  </Field>
                </div>
                <Field label="Hasta ID (opsiyonel — portal görünürlüğü için gerekir)">
                  <input style={inputStyle} value={draft.patientId} onChange={(e) => setDraft({ ...draft, patientId: e.target.value })} />
                </Field>
                <button style={buttonStyle} onClick={() => void createDraftFromCatalog()}>
                  Taslak oluştur
                </button>
              </SectionCard>

              <SectionCard title="Faturalar" subtitle="Son 100 fatura.">
                {invoices.map((inv) => (
                  <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: `1px solid ${BORDER}`, fontSize: 13.5, gap: 10 }}>
                    <div>
                      {DOC_TYPE_LABELS[inv.doc_type] || inv.doc_type.toUpperCase()} — {INVOICE_STATUS_LABELS[inv.status] || inv.status} {inv.ebelge_doc_number ? `(${inv.ebelge_doc_number})` : ''}
                      {inv.ebelge_last_error && <div style={{ color: WARN, fontSize: 11.5 }}>{inv.ebelge_last_error}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{formatTRY(inv.total_kurus)}</span>
                      {inv.status === 'draft' && (
                        <button style={{ ...buttonStyle, padding: '6px 10px', fontSize: 12 }} disabled={busyInvoiceId === inv.id} onClick={() => void issueOne(inv.id)}>
                          Kes
                        </button>
                      )}
                      {(inv.status === 'issued' || inv.status === 'partially_paid') && (
                        <button
                          style={{ ...buttonStyle, padding: '6px 10px', fontSize: 12, background: '#fff', color: TEAL, border: `1px solid ${TEAL}` }}
                          disabled={busyInvoiceId === inv.id}
                          onClick={() => void chargeOne(inv.id)}
                        >
                          Ödeme bağlantısı
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {!invoices.length && <div style={{ color: MUTED, fontSize: 13 }}>Henüz fatura yok.</div>}
              </SectionCard>
            </>
          )}

          {tab === 'tahsilat' && (
            <SectionCard title="Alacak yaşlandırması" subtitle="0-30 / 31-60 / 61-90 / 90+ gün.">
              {aging ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {(['0-30', '31-60', '61-90', '90+'] as const).map((b) => (
                    <div key={b} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 12, color: MUTED }}>{b} gün</div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{formatTRY(aging.buckets[b].totalKurus)}</div>
                      <div style={{ fontSize: 11, color: MUTED }}>{aging.buckets[b].invoiceIds.length} fatura</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: MUTED, fontSize: 13 }}>Yükleniyor…</div>
              )}
            </SectionCard>
          )}

          {tab === 'raporlar' && (
            <SectionCard
              title="Raporlar"
              subtitle="Aylık gelir-gider özeti, kesilen belgeler, tahsilat ve KDV — mali müşavirinize göndermek için. Bu raporlar sadece aylık görüntülenir."
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end', marginBottom: 18 }}>
                <Field label="Ay">
                  <select
                    style={inputStyle}
                    value={musavirMonth}
                    onChange={(e) => {
                      const m = Number(e.target.value)
                      setMusavirMonth(m)
                      void loadMusavirReport(musavirYear, m)
                    }}
                  >
                    {AY_ADLARI.map((ad, i) => (
                      <option key={ad} value={i + 1}>
                        {ad}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Yıl">
                  <select
                    style={inputStyle}
                    value={musavirYear}
                    onChange={(e) => {
                      const y = Number(e.target.value)
                      setMusavirYear(y)
                      void loadMusavirReport(y, musavirMonth)
                    }}
                  >
                    {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </Field>
                <button
                  style={{ ...buttonStyle, background: '#fff', color: TEAL, border: `1px solid ${TEAL}`, height: 38 }}
                  disabled={musavirExporting}
                  onClick={() => void exportMusavir()}
                >
                  {musavirExporting ? 'Hazırlanıyor…' : 'Mali Müşavire Gönder (Excel)'}
                </button>
              </div>

              {musavirLoading ? (
                <div style={{ color: MUTED, fontSize: 13 }}>Yükleniyor…</div>
              ) : !musavirReport ? (
                <div style={{ color: MUTED, fontSize: 13 }}>Seçilen ay için henüz veri yüklenmedi.</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
                    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 12, color: MUTED }}>Toplam Tahsilat</div>
                      <div style={{ fontSize: 17, fontWeight: 700 }}>{formatTRY(musavirReport.gelirGiderIcmali.toplamTahsilatKurus)}</div>
                    </div>
                    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 12, color: MUTED }}>Toplam Satış/Gelir</div>
                      <div style={{ fontSize: 17, fontWeight: 700 }}>{formatTRY(musavirReport.gelirGiderIcmali.toplamGelirKurus)}</div>
                    </div>
                    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 12, color: MUTED }}>Toplam KDV</div>
                      <div style={{ fontSize: 17, fontWeight: 700 }}>{formatTRY(musavirReport.kdvOzeti.kdvKurus)}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 13, color: MUTED, marginBottom: 6 }}>
                    KDV matrahı: {formatTRY(musavirReport.kdvOzeti.matrahKurus)} · Açık bakiye: {formatTRY(musavirReport.gelirGiderIcmali.acikBakiyeKurus)} ·{' '}
                    {musavirReport.gelirGiderIcmali.faturaSayisi} belge
                  </div>

                  <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 15, marginTop: 16, marginBottom: 6 }}>Tahsilat özeti (kanal/yöntem)</div>
                  {(musavirReport.tahsilatOzeti || []).length ? (
                    musavirReport.tahsilatOzeti.map((t: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: `1px solid ${BORDER}`, fontSize: 13 }}>
                        <span>
                          {t.channelKey === 'diger' ? 'Diğer' : BANK_LABELS[t.channelKey] || t.channelKey} — {METHOD_LABELS[t.method] || t.method}
                        </span>
                        <span>
                          {formatTRY(t.capturedKurus)} ({t.paymentCount} işlem)
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: MUTED, fontSize: 13 }}>Bu ay tahsilat yok.</div>
                  )}

                  <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 15, marginTop: 16, marginBottom: 6 }}>Kesilen belgeler</div>
                  {(musavirReport.kesilenBelgeler || []).length ? (
                    musavirReport.kesilenBelgeler.map((b: any) => (
                      <div key={b.invoiceId} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: `1px solid ${BORDER}`, fontSize: 13 }}>
                        <span>
                          {b.issuedAt.slice(0, 10)} — {DOC_TYPE_LABELS[b.docType] || b.docType} {b.docNumber ? `(${b.docNumber})` : ''}
                        </span>
                        <span>{formatTRY(b.totalKurus)}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: MUTED, fontSize: 13 }}>Bu ay kesilen belge yok.</div>
                  )}

                  <div style={{ fontSize: 11.5, color: MUTED, marginTop: 16 }}>{musavirReport.stopajNotu}</div>
                </>
              )}
            </SectionCard>
          )}
        </>
      )}
    </div>
  )
}
