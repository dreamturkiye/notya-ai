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

const TEAL = CHROME_RENK.pine
const CARD = '#FFFFFF'
const BORDER = CHROME_RENK.border
const INK = CHROME_RENK.ink
const MUTED = CHROME_RENK.muted
const WARN = CHROME_RENK.warn

type Tab = 'kurulum' | 'katalog' | 'faturalar' | 'tahsilat' | 'raporlar'

const NESTPAY_GROUP_KEYS = ['isbank', 'halkbank', 'teb', 'qnb', 'ziraat', 'akbank']

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
                <Field label="Base URL">
                  <input style={inputStyle} value={ebelgeFields.baseUrl || ''} onChange={(e) => setEbelgeFields({ ...ebelgeFields, baseUrl: e.target.value })} />
                </Field>
                <Field label="API Key">
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
                    Kayıtlı: {ebelgeStatus.vendor} ({ebelgeStatus.environment}) — alanlar: {JSON.stringify(ebelgeStatus.maskedFields)}
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Ödeme kuruluşu — iyzico (önerilen)"
                subtitle="Varsayılan ve en hızlı yol: kendi iyzico hesabınızı bağlayın. Kart bilgisi hiçbir zaman Notya'ya ulaşmaz — ödeme iyzico'nun kendi ödeme sayfasında alınır (PCI SAQ-A). Doğrulama durumu: VERIFIED (docs.iyzico.com üzerinden, 2026-10-15)."
              >
                <Field label="Ortam">
                  <select style={inputStyle} value={facilitatorEnv} onChange={(e) => setFacilitatorEnv(e.target.value as any)}>
                    <option value="test">Sandbox</option>
                    <option value="live">Canlı</option>
                  </select>
                </Field>
                <Field label="API Key">
                  <input style={inputStyle} value={facilitatorFields.apiKey || ''} onChange={(e) => setFacilitatorFields({ ...facilitatorFields, apiKey: e.target.value })} />
                </Field>
                <Field label="Secret Key">
                  <input style={inputStyle} type="password" value={facilitatorFields.secretKey || ''} onChange={(e) => setFacilitatorFields({ ...facilitatorFields, secretKey: e.target.value })} />
                </Field>
                <button style={buttonStyle} onClick={() => void saveFacilitator()}>
                  Kaydet
                </button>
                <div style={{ marginTop: 14 }}>
                  {(facilitators.configured || []).map((f: any) => (
                    <div key={f.id} style={{ fontSize: 12.5, color: MUTED, padding: '6px 0', borderTop: `1px solid ${BORDER}` }}>
                      iyzico — {f.environment} — {f.verificationStatus || 'VERIFIED'}
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
                    <Field label="Gateway URL (bankanızdan aldığınız 3D Pay Hosting adresi)">
                      <input style={inputStyle} value={bankFields.gatewayUrl || ''} onChange={(e) => setBankFields({ ...bankFields, gatewayUrl: e.target.value })} />
                    </Field>
                    <Field label="Client ID">
                      <input style={inputStyle} value={bankFields.clientId || ''} onChange={(e) => setBankFields({ ...bankFields, clientId: e.target.value })} />
                    </Field>
                    <Field label="Store Key">
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
                    <Field label="Base URL">
                      <input style={inputStyle} value={bankFields.baseUrl || ''} onChange={(e) => setBankFields({ ...bankFields, baseUrl: e.target.value })} />
                    </Field>
                    <Field label="Merchant ID">
                      <input style={inputStyle} value={bankFields.merchantId || ''} onChange={(e) => setBankFields({ ...bankFields, merchantId: e.target.value })} />
                    </Field>
                    <Field label="Store Key">
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
                      {BANK_LABELS[b.bank_key] || b.bank_key} — {b.environment} — {b.isReal ? 'kullanılabilir' : 'henüz uygulanmadı'}
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
                    <div>{(s.priceKurus / 100).toFixed(2)} TRY</div>
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
                          {s.name} — {(s.priceKurus / 100).toFixed(2)} TRY
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
                      {inv.doc_type.toUpperCase()} — {inv.status} {inv.ebelge_doc_number ? `(${inv.ebelge_doc_number})` : ''}
                      {inv.ebelge_last_error && <div style={{ color: WARN, fontSize: 11.5 }}>{inv.ebelge_last_error}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{(inv.total_kurus / 100).toFixed(2)} TRY</span>
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
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{(aging.buckets[b].totalKurus / 100).toFixed(2)} TRY</div>
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
            <SectionCard title="Raporlar" subtitle="Banka bazında tahsilat, hizmet bazında satış ve KDV özeti — mali müşavire aktarım için.">
              <div style={{ color: MUTED, fontSize: 13 }}>
                Detaylı rapor ekranları için /api/accounting/reports?type=collections|sales|kdv uç noktalarını kullanın.
              </div>
            </SectionCard>
          )}
        </>
      )}
    </div>
  )
}
