'use client'
/**
 * NOTYA-ASI-ONAM-01 — Sağlığım › Aşı Onamı. Remote half of the three consent flows: the parent
 * reads the SAME static per-vaccine content the doctor would show in clinic (lib/asi/onam —
 * no AI text here either), and confirms or declines once. The confirmation is final: there is no
 * "undo" button because the record it creates is immutable by design (migration 161).
 */
import { useEffect, useState } from 'react'
import { EmptyState, formatTrDate, SectionHeader, SoftPanel } from './ui'

interface IcerikGosterim { ad: string; korur: string; yanEtkiler: string[]; onamCumlesi: string; kaynak: string }
interface Talep { id: string; asilar: string[]; bildirim_kanali: string }
interface Kayit { id: string; asilar: string[]; yontem: string; durum: 'alindi' | 'reddedildi'; created_at: string }

const YONTEM_ETIKETI: Record<string, string> = {
  klinik: 'Klinikte',
  'uzaktan-eposta': 'Uzaktan (e-posta)',
  'uzaktan-whatsapp': 'Uzaktan (WhatsApp)',
  'uzaktan-portal': 'Uzaktan (Sağlığım)',
  kagit: 'Kağıt form',
}

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
  const [tamamlandi, setTamamlandi] = useState<'alindi' | 'reddedildi' | null>(null)

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

  async function yanitla(durum: 'alindi' | 'reddedildi') {
    if (!talep) return
    if (!ad.trim()) { setHata('Adınızı ve soyadınızı yazın.'); return }
    setGonderiliyor(true)
    setHata('')
    try {
      const r = await fetch(api, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ talepId: talep.id, durum, onayEden: { ad: ad.trim(), yakinlik, telefon: telefon.trim() || null } }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Gönderilemedi.'); return }
      setTamamlandi(durum)
    } catch { setHata('Gönderilemedi.') }
    finally { setGonderiliyor(false) }
  }

  if (yukleniyor) return <div className="sg-fade" style={{ padding: 20 }}>Yükleniyor…</div>

  return (
    <div className="sg-fade">
      <SectionHeader title="Aşı Onamı" subtitle="Çocuğunuz için planlanan aşıların bilgilendirme ve onay formu." />
      {hata && <div role="alert" style={{ margin: '0 20px 12px', color: 'var(--sg-warn, #B4302F)', fontSize: 13.5 }}>{hata}</div>}

      {tamamlandi ? (
        <SoftPanel style={{ margin: '0 20px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
            {tamamlandi === 'alindi' ? 'Onayınız kaydedildi.' : 'Yanıtınız kaydedildi.'}
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--sg-muted)' }}>
            {tamamlandi === 'alindi'
              ? 'Teşekkürler — doktorunuz muayenede bu onayı görecek.'
              : 'Doktorunuz bunu görecek ve sizinle konuşacaktır; dilerseniz muayenede tekrar değerlendirilebilir.'}
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
            <div style={{ fontSize: 13.5, marginBottom: 10 }}>{icerik[0]?.onamCumlesi}</div>
            <div style={{ display: 'grid', gap: 8, marginBottom: 10 }}>
              <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Veli / yasal temsilcinin adı soyadı"
                style={{ width: '100%', padding: '9px 11px', fontSize: 15, borderRadius: 8, border: '1px solid var(--sg-line)', boxSizing: 'border-box' }} />
              <select value={yakinlik} onChange={(e) => setYakinlik(e.target.value)}
                style={{ width: '100%', padding: '9px 11px', fontSize: 15, borderRadius: 8, border: '1px solid var(--sg-line)', boxSizing: 'border-box' }}>
                {['Anne', 'Baba', 'Vasi', 'Kendisi', 'Diğer'].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <input value={telefon} onChange={(e) => setTelefon(e.target.value)} placeholder="Telefon (isteğe bağlı)"
                style={{ width: '100%', padding: '9px 11px', fontSize: 15, borderRadius: 8, border: '1px solid var(--sg-line)', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" disabled={gonderiliyor} onClick={() => void yanitla('alindi')}
                style={{ flex: '1 1 180px', padding: '11px 14px', fontSize: 14.5, fontWeight: 700, borderRadius: 10, border: 'none', background: 'var(--sg-accent, #0F9B8E)', color: '#fff', cursor: gonderiliyor ? 'default' : 'pointer' }}>
                Okudum, kabul ediyorum
              </button>
              <button type="button" disabled={gonderiliyor} onClick={() => void yanitla('reddedildi')}
                style={{ padding: '11px 14px', fontSize: 14, borderRadius: 10, border: '1px solid var(--sg-line)', background: 'transparent', cursor: gonderiliyor ? 'default' : 'pointer' }}>
                Kabul etmiyorum
              </button>
            </div>
          </SoftPanel>
        </div>
      ) : (
        <EmptyState art={false} title="Bekleyen bir aşı onam talebi yok" body="Doktorunuz bir onam talebi gönderdiğinde burada görünecek." />
      )}

      {kayitlar.length > 0 && (
        <div style={{ margin: '20px 20px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sg-muted)', marginBottom: 8 }}>Geçmiş onam kayıtları</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {kayitlar.map((k) => (
              <SoftPanel key={k.id} style={{ padding: '10px 14px' }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{k.asilar.join(', ')}</div>
                <div style={{ fontSize: 12, color: 'var(--sg-muted)' }}>
                  {k.durum === 'alindi' ? 'Onaylandı' : 'Kabul edilmedi'} · {YONTEM_ETIKETI[k.yontem] || k.yontem} · {formatTrDate(k.created_at)}
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
