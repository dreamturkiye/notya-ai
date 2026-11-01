'use client'
/**
 * NOTYA-ASI-ONAM-01 — Sağlığım › Aşı Bilgilendirme. The parent reads the SAME static per-vaccine
 * content the doctor would show in clinic (lib/asi/onam — no AI text here either).
 *
 * NOTYA-ASI-ONAM-02 (2026-11-01): this is a pre-visit information acknowledgement, never a consent
 * (Resmî Gazete 27.10.2026/33413 requires verified identity + SMS OTP via e-Nabız or the facility's
 * SBYS; see lib/asi/onam/asiOnamDurum.ts). The parent marks it read or reports a concern; the
 * doctor takes the consent at the visit. Labels come from asiOnamDurum.ts, never from raw durum.
 */
import { useEffect, useState } from 'react'
import { EmptyState, formatTrDate, SectionHeader, SoftPanel } from './ui'
import { ASI_ONAM_GORUNEN_ETIKET, ASI_ONAM_YONTEM_KISA, asiOnamGorunenDurumu, type AsiOnamGorunenDurum } from '@/lib/asi/onam/asiOnamDurum'

interface IcerikGosterim { ad: string; korur: string; yanEtkiler: string[]; onamCumlesi: string; kaynak: string }
interface Talep { id: string; asilar: string[]; bildirim_kanali: string }
interface Kayit { id: string; asilar: string[]; yontem: string; durum: string; gorunenDurum?: AsiOnamGorunenDurum; created_at: string }

const YONTEM_ETIKETI: Record<string, string> = ASI_ONAM_YONTEM_KISA

export function AsiOnamView({ token, basePath }: { token: string; basePath: string }) {
  const api = `/api/portal/hasta/${encodeURIComponent(token)}/asi-onam`
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')
  const [talep, setTalep] = useState<Talep | null>(null)
  const [icerik, setIcerik] = useState<IcerikGosterim[] | null>(null)
  const [kayitlar, setKayitlar] = useState<Kayit[]>([])
  const [ad, setAd] = useState('')
  const [yakinlik, setYakinlik] = useState('Anne')
  const [telefon, setTelefon] = useState('')
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [tamamlandi, setTamamlandi] = useState<'okundu' | 'cekince' | null>(null)

  useEffect(() => {
    let aktif = true
    void (async () => {
      try {
        const r = await fetch(api, { credentials: 'include' })
        const j = await r.json().catch(() => ({}))
        if (!aktif) return
        if (!r.ok) { setHata(j.error || 'Yüklenemedi.'); return }
        setTalep(j.talep || null)
        setIcerik(j.icerikOnizleme || null)
        setKayitlar(Array.isArray(j.kayitlar) ? j.kayitlar : [])
      } catch { if (aktif) setHata('Yüklenemedi.') }
      finally { if (aktif) setYukleniyor(false) }
    })()
    return () => { aktif = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function yanitla(okundu: boolean) {
    if (!talep) return
    if (!ad.trim()) { setHata('Adınızı ve soyadınızı yazın.'); return }
    setGonderiliyor(true)
    setHata('')
    try {
      const r = await fetch(api, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ talepId: talep.id, okundu, onayEden: { ad: ad.trim(), yakinlik, telefon: telefon.trim() || null } }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Gönderilemedi.'); return }
      setTamamlandi(okundu ? 'okundu' : 'cekince')
    } catch { setHata('Gönderilemedi.') }
    finally { setGonderiliyor(false) }
  }

  if (yukleniyor) return <div className="sg-fade" style={{ padding: 20 }}>Yükleniyor…</div>

  return (
    <div className="sg-fade">
      <SectionHeader title="Aşı Bilgilendirme" subtitle="Çocuğunuz için planlanan aşılar hakkında muayene öncesi bilgilendirme. Aşı onamı muayenede alınır." />
      {hata && <div role="alert" style={{ margin: '0 20px 12px', color: 'var(--sg-warn, #B4302F)', fontSize: 13.5 }}>{hata}</div>}

      {tamamlandi ? (
        <SoftPanel style={{ margin: '0 20px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
            {tamamlandi === 'okundu' ? 'Bilgilendirmeyi okuduğunuz kaydedildi.' : 'Çekinceniz kaydedildi.'}
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--sg-muted)' }}>
            {tamamlandi === 'okundu'
              ? 'Teşekkürler. Bu bir onam değildir — aşı onamı muayenede, kimliğiniz doğrulanarak hekiminiz tarafından alınacaktır.'
              : 'Doktorunuz bunu görecek ve muayenede sizinle konuşacaktır. Aşı onamı muayenede alınır.'}
          </div>
        </SoftPanel>
      ) : talep && icerik ? (
        <div style={{ margin: '0 20px', display: 'grid', gap: 12 }}>
          {icerik.map((i) => (
            <SoftPanel key={i.ad}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{i.ad}</div>
              <div style={{ fontSize: 13.5, marginBottom: 8 }}>{i.korur}</div>
              <div style={{ fontSize: 12.5, color: 'var(--sg-muted)', marginBottom: 4 }}>Sık görülen yan etkiler:</div>
              <ul style={{ margin: '0 0 0 18px', padding: 0, fontSize: 13, color: 'var(--sg-muted)' }}>
                {i.yanEtkiler.map((y, idx) => <li key={idx}>{y}</li>)}
              </ul>
            </SoftPanel>
          ))}

          <SoftPanel>
            <div style={{ fontSize: 13.5, marginBottom: 10 }}>
              Bu bilgileri muayeneden önce okumanız içindir; bu ekran bir onam değildir. Aşı onamı muayenede,
              veli / yasal temsilcinin kimliği doğrulanarak hekim tarafından alınır.
            </div>
            <div style={{ display: 'grid', gap: 8, marginBottom: 10 }}>
              <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Okuyan veli / yasal temsilcinin adı soyadı"
                style={{ width: '100%', padding: '9px 11px', fontSize: 15, borderRadius: 8, border: '1px solid var(--sg-line)', boxSizing: 'border-box' }} />
              <select value={yakinlik} onChange={(e) => setYakinlik(e.target.value)}
                style={{ width: '100%', padding: '9px 11px', fontSize: 15, borderRadius: 8, border: '1px solid var(--sg-line)', boxSizing: 'border-box' }}>
                {['Anne', 'Baba', 'Vasi', 'Kendisi', 'Diğer'].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <input value={telefon} onChange={(e) => setTelefon(e.target.value)} placeholder="Telefon (isteğe bağlı)"
                style={{ width: '100%', padding: '9px 11px', fontSize: 15, borderRadius: 8, border: '1px solid var(--sg-line)', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" disabled={gonderiliyor} onClick={() => void yanitla(true)}
                style={{ flex: '1 1 180px', padding: '11px 14px', fontSize: 14.5, fontWeight: 700, borderRadius: 10, border: 'none', background: 'var(--sg-accent, #0F9B8E)', color: '#fff', cursor: gonderiliyor ? 'default' : 'pointer' }}>
                Okudum
              </button>
              <button type="button" disabled={gonderiliyor} onClick={() => void yanitla(false)}
                style={{ padding: '11px 14px', fontSize: 14, borderRadius: 10, border: '1px solid var(--sg-line)', background: 'transparent', cursor: gonderiliyor ? 'default' : 'pointer' }}>
                Sorum / çekincem var
              </button>
            </div>
          </SoftPanel>
        </div>
      ) : (
        <EmptyState art={false} title="Bekleyen bir aşı bilgilendirmesi yok" body="Doktorunuz bir aşı bilgilendirmesi gönderdiğinde burada görünecek." />
      )}

      {kayitlar.length > 0 && (
        <div style={{ margin: '20px 20px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sg-muted)', marginBottom: 8 }}>Geçmiş bilgilendirme ve onam kayıtları</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {kayitlar.map((k) => (
              <SoftPanel key={k.id} style={{ padding: '10px 14px' }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{k.asilar.join(', ')}</div>
                <div style={{ fontSize: 12, color: 'var(--sg-muted)' }}>
                  {ASI_ONAM_GORUNEN_ETIKET[k.gorunenDurum ?? asiOnamGorunenDurumu(k)]} · {YONTEM_ETIKETI[k.yontem] || k.yontem} · {formatTrDate(k.created_at)}
                </div>
              </SoftPanel>
            ))}
          </div>
        </div>
      )}
      <a href={basePath} className="sg-back-link" style={{ margin: '16px 20px', display: 'inline-block' }}>← Özet</a>
    </div>
  )
}
