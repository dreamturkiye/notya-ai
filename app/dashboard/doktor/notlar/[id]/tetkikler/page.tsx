'use client'
/**
 * NOTYA-TETKIK-NOT-01 — Tetkik istek formu (kâğıt), muayene notundan.
 * Reçete sayfasıyla aynı yer: not revizyonunun tepesindeki "Tetkikler" düğmesi.
 * Liste notes.content_tetkikler (yoksa plandan çıkarım); onayda elektronik kayda geçer.
 */
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { BRANS_ETIKETLERI } from '@/lib/intake/bransSorulari'
import { hekimUnvanli } from '@/lib/doktor/hekimAdi'
import {
  metindenTetkikleriCikar,
  notTetkikleriniTemizle,
  tetkikNumuneEtiketi,
  type NotTetkik,
} from '@/lib/doktor/notTetkikler'

type Baslik = {
  unvan: string
  ad: string
  brans: string
  klinik: string
  satirlar: string[]
  diplomaNo: string
  logoDataUrl: string
}

export default function TetkiklerYazdirPage() {
  const params = useParams<{ id: string }>()
  const [tetkikler, setTetkikler] = useState<NotTetkik[]>([])
  const [hasta, setHasta] = useState({ ad: '', yas: '', cinsiyet: '' })
  const [endikasyon, setEndikasyon] = useState('')
  const [onayli, setOnayli] = useState(false)
  const [baslik, setBaslik] = useState<Baslik>({
    unvan: 'Dr.', ad: '', brans: '', klinik: '', satirlar: [], diplomaNo: '', logoDataUrl: '',
  })
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const t = await ensureDoctorAccessToken()
        const [notR, baslikR] = await Promise.all([
          fetch(`/api/notes/${params.id}`, { headers: { Authorization: `Bearer ${t}` } }),
          fetch('/api/doktor/recete-baslik', { headers: { Authorization: `Bearer ${t}` } }),
        ])
        const j = await notR.json()
        if (!notR.ok) throw new Error(j.error || 'Not alınamadı')
        const kayitli = notTetkikleriniTemizle(j.not?.tetkikler)
        setTetkikler(kayitli.length ? kayitli : metindenTetkikleriCikar(j.not?.plan || ''))
        setHasta({
          ad: String(j.hasta?.ad || ''),
          yas: String(j.hasta?.yas || ''),
          cinsiyet: String(j.hasta?.cinsiyet || ''),
        })
        setEndikasyon(String(j.not?.basvuruYakinmasi || j.not?.degerlendirme || '').slice(0, 600))
        setOnayli(!!j.not?.approvedAt)
        if (baslikR.ok) {
          const p = await baslikR.json() as {
            hekim?: string; unvan?: string; brans?: string; klinik?: string
            satirlar?: string[]; diplomaNo?: string; logoDataUrl?: string
          }
          setBaslik({
            unvan: String(p.unvan || 'Dr.'),
            ad: String(p.hekim || ''),
            brans: String(p.brans || ''),
            klinik: String(p.klinik || ''),
            satirlar: Array.isArray(p.satirlar) ? p.satirlar.map(String).filter(Boolean) : [],
            diplomaNo: String(p.diplomaNo || ''),
            logoDataUrl: String(p.logoDataUrl || ''),
          })
        } else if (j.doktor?.ad) {
          setBaslik((b) => ({
            ...b,
            ad: String(j.doktor.ad),
            diplomaNo: String(j.doktor.diplomaNo || ''),
            satirlar: Array.isArray(j.doktor.ozelBaslikSatirlari) ? j.doktor.ozelBaslikSatirlari : [],
            logoDataUrl: String(j.doktor.ozelLogo || ''),
          }))
        }
      } catch (e) {
        setHata(e instanceof Error ? e.message : 'Hata')
      } finally {
        setYukleniyor(false)
      }
    })()
  }, [params.id])

  if (yukleniyor) {
    return <div style={{ padding: 40, fontFamily: 'system-ui', color: '#666' }}>Tetkik formu hazırlanıyor…</div>
  }
  if (hata) {
    return <div style={{ padding: 40, fontFamily: 'system-ui', color: '#B23A3A' }}>{hata}</div>
  }

  const bransAd = (BRANS_ETIKETLERI[baslik.brans as keyof typeof BRANS_ETIKETLERI] || baslik.brans || '').replace(/\s*\(.*\)\s*$/, '')
  const hekimSatir = hekimUnvanli(baslik.ad || `${baslik.unvan}`.trim()) || '________________'
  const tarih = new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric' })
  const yasCins = [hasta.yas, hasta.cinsiyet === 'Erkek' ? 'E' : hasta.cinsiyet === 'Kadın' || hasta.cinsiyet === 'Kız' ? 'K' : ''].filter(Boolean).join(' · ')

  return (
    <div style={{ minHeight: '100vh', background: '#E8E0D4', padding: '16px 12px 48px' }}>
      <style>{`
        @media print {
          .yazdirma-gizle { display: none !important; }
          body { background: white !important; }
          .tetkik-kagit { box-shadow: none !important; margin: 0 !important; width: auto !important; min-height: auto !important; }
          @page { size: A4 portrait; margin: 12mm; }
        }
      `}</style>

      <div className="yazdirma-gizle" style={{ maxWidth: 560, margin: '0 auto 12px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ color: '#2e251d', fontFamily: 'system-ui', fontSize: 14, fontWeight: 700 }}>
          Tetkikler · {hasta.ad || 'Hasta'}
        </span>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => window.print()}
          style={{
            background: CHROME_RENK.pine, border: 'none', color: '#FAF8F4', borderRadius: 10,
            padding: '12px 22px', fontFamily: 'system-ui', fontSize: 15, fontWeight: 800, cursor: 'pointer',
          }}
        >
          🖨️ Tetkikleri yazdır
        </button>
        <a
          href={`/doktor-tools/tetkik`}
          style={{ background: 'transparent', border: 'none', color: CHROME_RENK.ink, fontFamily: 'system-ui', fontSize: 12, textDecoration: 'underline', padding: '6px 4px' }}
        >
          Katalogdan ekle
        </a>
      </div>

      {!onayli && (
        <div className="yazdirma-gizle" style={{ maxWidth: 560, margin: '0 auto 10px', fontFamily: 'system-ui', fontSize: 12.5, color: '#6d6055', background: 'rgba(180,131,47,0.12)', border: '1px solid rgba(180,131,47,0.35)', borderRadius: 8, padding: '8px 12px' }}>
          Bu not henüz onaylanmadı — aşağıdaki tetkikler nottaki <b>istem</b>dir. Notu onayladığınızda elektronik kayda işlenir.
        </div>
      )}

      {tetkikler.length === 0 && (
        <div className="yazdirma-gizle" style={{ maxWidth: 560, margin: '0 auto 10px', fontFamily: 'system-ui', fontSize: 13, color: '#B23A3A' }}>
          Bu notta henüz tetkik yok. Plan metnine ekleyin veya not revizyonundaki Tetkikler alanını doldurun.
        </div>
      )}

      <div
        className="tetkik-kagit"
        style={{
          background: 'white', color: '#111', width: '100%', maxWidth: 560, minHeight: 740,
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)', margin: '0 auto', padding: '36px 40px',
          boxSizing: 'border-box', fontFamily: 'Georgia, "Times New Roman", serif',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ textAlign: 'center', borderBottom: '1.5px solid #111', paddingBottom: 8, marginBottom: 14 }}>
          {baslik.logoDataUrl ? <img src={baslik.logoDataUrl} alt="" style={{ height: 44, marginBottom: 4 }} /> : null}
          {baslik.satirlar.length > 0
            ? baslik.satirlar.map((s, i) => (
                <div key={i} style={i === 0 ? { fontSize: 16, fontWeight: 700, letterSpacing: 0.3 } : { fontSize: i === 1 ? 12 : 11, color: i === 1 ? '#111' : '#333' }}>{s}</div>
              ))
            : (
              <>
                <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 0.3 }}>{hekimSatir}</div>
                {bransAd ? <div style={{ fontSize: 12 }}>{bransAd} Uzmanı</div> : null}
                {baslik.klinik ? <div style={{ fontSize: 11, color: '#333' }}>{baslik.klinik}</div> : null}
              </>
            )}
          <div style={{ fontSize: 13, fontStyle: 'italic', marginTop: 8 }}>Tetkik İstek Formu</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 16, gap: 12 }}>
          <div>
            <div><b>Hasta:</b> {hasta.ad || '________________'}</div>
            <div><b>Yaş:</b> {yasCins || '____'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div><b>Tarih:</b> {tarih}</div>
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>İstenen tetkikler</div>
        {tetkikler.length === 0 ? (
          <div style={{ fontSize: 12, color: '#666' }}>Seçili tetkik yok.</div>
        ) : (
          <ol style={{ margin: 0, paddingLeft: 22, fontSize: 13, lineHeight: 1.55 }}>
            {tetkikler.map((t) => {
              const ekstra = tetkikNumuneEtiketi(t)
              return (
                <li key={t.ad} style={{ marginBottom: 8 }}>
                  <b>{t.ad}</b>
                  {ekstra ? <div style={{ paddingLeft: 2, fontStyle: 'italic', color: '#333' }}>{ekstra}</div> : null}
                </li>
              )
            })}
          </ol>
        )}

        <div style={{ marginTop: 18, fontSize: 13 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Klinik endikasyon</div>
          <div style={{ borderBottom: '1px solid #111', minHeight: 48, paddingBottom: 6, whiteSpace: 'pre-wrap' }}>
            {endikasyon || ' '}
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 48, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'center', fontSize: 11, color: '#333', borderTop: '1px solid #111', paddingTop: 6, minWidth: 180 }}>
            Kaşe / İmza<br />
            <span style={{ color: '#666' }}>Diploma No: {baslik.diplomaNo || '____________'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
