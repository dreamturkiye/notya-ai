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
  type EkDemografiAlani,
  type HastaOzetKayit,
} from '@/lib/doktor/hastaOzetKayit'
import type { FormAktarimSatiri } from '@/lib/intake/formdanDosyaya'
import { veliDiliMi } from '@/lib/specialties/kapsam'

/** FORM-DOSYA-AKTAR-01: the card's extra demographic fields, in display order. */
const EK_ALANLAR: [EkDemografiAlani, string][] = [
  ['adres', 'Adres'], ['dogum_yeri', 'Doğum yeri'],
  ['veli_adi', 'Veli / yasal temsilci'], ['veli_yakinlik', 'Velinin yakınlığı'], ['veli_telefon', 'Veli telefonu'],
  ['acil_kisi_adi', 'Acil durum kişisi'], ['acil_kisi_yakinlik', 'Acil kişinin yakınlığı'], ['acil_kisi_telefon', 'Acil kişi telefonu'],
  ['sigorta', 'Sağlık güvencesi'],
]
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';
import { doktorFetch } from '@/lib/doktor/oturumFetch'
import KanGrubuSecici from '@/components/doktor/KanGrubuSecici'
import dinamik from 'next/dynamic'
import { hekimProfilOturumOku } from '@/lib/doktor/hekimProfilIstemci'

// KRONIK-SECIM-01: the picker (and its condition list) loads only when the card is edited — the patient-file bundle
// stays within the performance budget.
const KronikHastalikSecici = dinamik(() => import('@/components/doktor/KronikHastalikSecici'), { ssr: false })

// NOTYA-YENI-GORUNUM-03 (Kaan, 2026-09-24): this whole card (both demographic and health-history
// panels) was still dark-navy with white-based translucent fills -- recolored to the cream/pine
// language, same white-card convention used elsewhere in the redesign.
const panel: React.CSSProperties = {
  background: '#FFFFFF',
  border: `1px solid ${CHROME_RENK.border}`,
  borderRadius: 16,
}

const inp: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#F6F0E4',
  border: `1px solid ${CHROME_RENK.border}`,
  borderRadius: 10,
  padding: '8px 10px',
  color: CHROME_RENK.ink,
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
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '11px 0', borderBottom: `1px solid ${CHROME_RENK.border}` }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#0F766E', letterSpacing: '0.03em', minWidth: 132, flexShrink: 0 }}>{etiket}</span>
      <span style={{ fontSize: 15, fontWeight: 600, color: CHROME_RENK.ink, lineHeight: 1.45, minWidth: 0 }}>{deger || '—'}</span>
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
      <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#0F766E', marginBottom: 4 }}>{etiket}</span>
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
  const [kronik, setKronik] = useState<string[]>(patient.kronik_hastaliklar || [])
  const [alerji, setAlerji] = useState(patient.alerjiler || '')
  const [ilac, setIlac] = useState(patient.surekli_ilaclar || '')
  const [sigara, setSigara] = useState(patient.sigara_alkol || '')
  const [brans, setBrans] = useState<string | null>(null)
  // FORM-DOSYA-AKTAR-01: the form's other demographic answers have a place on the card.
  const ekBos = (p: HastaOzetKayit) => Object.fromEntries(EK_ALANLAR.map(([k]) => [k, String(p[k] ?? '')])) as Record<EkDemografiAlani, string>
  const [ek, setEk] = useState<Record<EkDemografiAlani, string>>(() => ekBos(patient))
  const [aktarim, setAktarim] = useState<null | { yukleniyor: boolean; mesaj?: string; satirlar: FormAktarimSatiri[]; secili: string[]; formTarihi?: string | null }>(null)
  React.useEffect(() => { setBrans(hekimProfilOturumOku()?.specialty ?? null) }, [])

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
    setKronik(p.kronik_hastaliklar || [])
    setAlerji(p.alerjiler || '')
    setIlac(p.surekli_ilaclar || '')
    setSigara(p.sigara_alkol || '')
    setEk(ekBos(p))
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
              ...ek,
            }
          : {
              kronik_hastaliklar: kronik,
              alerjiler: alerji,
              surekli_ilaclar: ilac,
              sigara_alkol: sigara,
            }
      const res = await doktorFetch(`/api/doktor/hastalar/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(govde),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as { error?: string }).error || 'Kayıt başarısız')
      }
      const get = await doktorFetch(`/api/doktor/hastalar/${patientId}`, {})
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

  // FORM-DOSYA-AKTAR-01: the latest submitted Hasta Bilgi Formu, as a diff against this card. Empty card fields are
  // pre-ticked; a field the card already holds differently is shown with both values and left unticked.
  const formuGetir = async () => {
    setAktarim({ yukleniyor: true, satirlar: [], secili: [] })
    try {
      const r = await doktorFetch(`/api/doktor/hastalar/${patientId}?formAktarim=1`, {})
      const d = await r.json().catch(() => ({}))
      const fa = (d as { formAktarim?: { formVar?: boolean; satirlar?: FormAktarimSatiri[]; formTarihi?: string | null } | null }).formAktarim
      if (!r.ok || !fa) { setAktarim({ yukleniyor: false, satirlar: [], secili: [], mesaj: 'Form okunamadı.' }); return }
      if (!fa.formVar) { setAktarim({ yukleniyor: false, satirlar: [], secili: [], mesaj: 'Bu hastanın doldurulmuş bir Hasta Bilgi Formu yok.' }); return }
      const satirlar = fa.satirlar || []
      if (!satirlar.length) { setAktarim({ yukleniyor: false, satirlar: [], secili: [], mesaj: 'Formdaki bilgiler dosyada zaten var — aktarılacak yeni bilgi yok.' }); return }
      setAktarim({ yukleniyor: false, satirlar, secili: satirlar.filter((s) => s.durum === 'bos').map((s) => s.alan), formTarihi: fa.formTarihi })
    } catch {
      setAktarim({ yukleniyor: false, satirlar: [], secili: [], mesaj: 'Form okunamadı.' })
    }
  }
  const formuAktar = async () => {
    if (!aktarim) return
    const govde = Object.fromEntries(aktarim.satirlar.filter((s) => aktarim.secili.includes(s.alan)).map((s) => [s.alan, s.formda]))
    if (!Object.keys(govde).length) return
    setKaydediyor(true)
    setHata('')
    try {
      const res = await doktorFetch(`/api/doktor/hastalar/${patientId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(govde) })
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error || 'Aktarım başarısız')
      const get = await doktorFetch(`/api/doktor/hastalar/${patientId}`, {})
      const data = await get.json()
      if (!get.ok) throw new Error(data.error || 'Güncel kayıt okunamadı')
      onKaydedildi(data.patient as HastaOzetKayit)
      syncForm(data.patient as HastaOzetKayit)
      setAktarim(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Aktarım başarısız')
    } finally {
      setKaydediyor(false)
    }
  }
  // "Veli" follows the patient's AGE (brans-alan-sizmasi): the guardian fields exist only for a patient under 18.
  const veliGoster = veliDiliMi({ doktorBransi: brans, hastaDogumIso: dogum || patient.dogum_tarihi })
  const ekAlanlar = EK_ALANLAR.filter(([k]) => veliGoster || !k.startsWith('veli_'))
  const degerYaz = (v: string | string[] | null) => (Array.isArray(v) ? v.join(', ') : v || '—')

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
          <div style={{ fontSize: 14, fontWeight: 700, color: CHROME_RENK.ink }}>Demografik bilgiler</div>
          {!demografiAcik ? (
            <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              data-testid="formdan-dosyaya-aktar"
              disabled={aktarim?.yukleniyor}
              onClick={(e) => { e.stopPropagation(); void formuGetir() }}
              style={{ background: 'transparent', border: '1px solid rgba(47,67,52,0.35)', color: CHROME_RENK.pine, borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              {aktarim?.yukleniyor ? 'Form okunuyor…' : 'Formdan dosyaya aktar'}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                syncForm(patient)
                setDemografiAcik(true)
              }}
              style={{ background: 'transparent', border: '1px solid rgba(15,155,142,0.4)', color: '#0F9B8E', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              Düzenle
            </button>
            </span>
          ) : null}
        </div>
        {aktarim && !aktarim.yukleniyor && (
          <div data-testid="form-aktarim-paneli" onClick={(e) => e.stopPropagation()} style={{ border: `1px solid ${CHROME_RENK.border}`, background: '#F6F0E4', borderRadius: 12, padding: 12, margin: '6px 0 10px' }}>
            {aktarim.mesaj ? (
              <div style={{ fontSize: 13, color: CHROME_RENK.ink }}>{aktarim.mesaj}</div>
            ) : (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: CHROME_RENK.ink, marginBottom: 4 }}>Hasta Bilgi Formu’ndan dosyaya aktarılacaklar</div>
                <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginBottom: 8 }}>
                  Dosyada boş olanlar işaretli. Dosyada farklı yazan bir bilgi yalnız siz işaretlerseniz değişir.
                </div>
                {aktarim.satirlar.map((s) => (
                  <label key={s.alan} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderTop: `1px solid ${CHROME_RENK.border}`, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={aktarim.secili.includes(s.alan)}
                      onChange={(e) => setAktarim({ ...aktarim, secili: e.target.checked ? [...aktarim.secili, s.alan] : aktarim.secili.filter((x) => x !== s.alan) })}
                      style={{ width: 20, height: 20, marginTop: 2, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 13.5, lineHeight: 1.4, color: CHROME_RENK.ink, minWidth: 0 }}>
                      <strong>{s.etiket}</strong>
                      <span style={{ display: 'block' }}>Formda: {degerYaz(s.formda)}</span>
                      {s.durum === 'farkli' && <span style={{ display: 'block', color: '#B45309' }}>Dosyada şu an: {degerYaz(s.dosyada)}</span>}
                    </span>
                  </label>
                ))}
              </>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {!aktarim.mesaj && (
                <button type="button" data-testid="form-aktarim-onayla" disabled={kaydediyor || aktarim.secili.length === 0} onClick={() => void formuAktar()}
                  style={{ background: CHROME_RENK.pine, border: 'none', color: '#fff', borderRadius: 999, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: kaydediyor || aktarim.secili.length === 0 ? 0.6 : 1 }}>
                  {kaydediyor ? 'Aktarılıyor…' : `Seçilenleri dosyaya aktar (${aktarim.secili.length})`}
                </button>
              )}
              <button type="button" onClick={() => setAktarim(null)}
                style={{ background: 'transparent', border: `1px solid ${CHROME_RENK.border}`, color: CHROME_RENK.muted, borderRadius: 999, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {aktarim.mesaj ? 'Kapat' : 'Vazgeç'}
              </button>
            </div>
          </div>
        )}
        {demografiEksik && !demografiAcik && (
          <div style={{ fontSize: 12, color: '#B45309', marginBottom: 6 }}>Eksik alan var — tıklayarak doldurun; kayıt tüm sisteme yazılır.</div>
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
            {ekAlanlar.filter(([k]) => String(patient[k] ?? '').trim()).map(([k, etiket]) => <React.Fragment key={k}>{bilgiSatiri(etiket, patient[k])}</React.Fragment>)}
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
            {alan('Kan grubu', <KanGrubuSecici style={inp} deger={kan} degistir={setKan} bosEtiket="—" />)}
            {ekAlanlar.map(([k, etiket]) => (
              <React.Fragment key={k}>
                {alan(etiket, k === 'adres'
                  ? <textarea style={{ ...inp, minHeight: 56, resize: 'vertical' }} value={ek[k]} onChange={(e) => setEk({ ...ek, [k]: e.target.value })} />
                  : <input style={inp} value={ek[k]} inputMode={k.endsWith('telefon') ? 'tel' : undefined} onChange={(e) => setEk({ ...ek, [k]: e.target.value })} />)}
              </React.Fragment>
            ))}
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
                style={{ background: 'transparent', border: `1px solid ${CHROME_RENK.border}`, color: CHROME_RENK.muted, borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
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
          <div style={{ fontSize: 14, fontWeight: 700, color: CHROME_RENK.ink }}>Sağlık geçmişi</div>
          {!saglikAcik ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                syncForm(patient)
                setSaglikAcik(true)
              }}
              style={{ background: 'transparent', border: '1px solid rgba(251,191,36,0.4)', color: '#7A5B1E', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              Düzenle
            </button>
          ) : null}
        </div>
        {saglikEksik && !saglikAcik && (
          <div style={{ fontSize: 12, color: '#B45309', marginBottom: 6 }}>Boş — tıklayarak yazın; kayıt hasta dosyasına işlenir.</div>
        )}
        {!saglikAcik ? (
          <>
            {bilgiSatiri('Kronik hastalıklar', patient.kronik_hastaliklar?.length ? cipListesi(patient.kronik_hastaliklar, '#B45309', '#F59E0B') : null)}
            {bilgiSatiri('Alerjiler', patient.alerjiler ? cipListesi(patient.alerjiler.split(',').map((a) => a.trim()).filter(Boolean), CHROME_RENK.warn, '#EF4444') : null)}
            {bilgiSatiri('Sürekli ilaçlar', patient.surekli_ilaclar)}
            {bilgiSatiri('Sigara / Alkol', patient.sigara_alkol)}
          </>
        ) : (
          <div onClick={(e) => e.stopPropagation()}>
            {/* KRONIK-SECIM-01: aranabilir liste + serbest ekleme, çoklu seçim, kaldırılabilir çipler. */}
            <div style={{ marginBottom: 10 }}>
              <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#0F766E', marginBottom: 4 }}>Kronik hastalıklar</span>
              <KronikHastalikSecici secili={kronik} degistir={setKronik} brans={brans} />
            </div>
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
                style={{ background: 'transparent', border: `1px solid ${CHROME_RENK.border}`, color: CHROME_RENK.muted, borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
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
