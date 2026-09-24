/**
 * NOTYA-KONSULT-01 — hasta dosyasında Ayşe şeridi (Gökhan/Boss 2026-09-20):
 * sekmeler ile içerik kartlarının arasında; sözel (tarayıcı STT) + yazılı sohbet.
 * Üst sağ buton / ayrı sekme yerine her sekmede görünür.
 */
'use client'

import HafifMarkdown from '@/components/asistan/HafifMarkdown'
import MuayeneCekListesi from '@/components/doktor/MuayeneCekListesi'
import { useEffect, useRef, useState } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { EylemKarti, EylemToplu, type EylemHasta, type EylemOneriGorunumu } from '@/components/core/EylemKarti'
import {
  CEK_LISTE_SORU,
  cekListeAsistanCevabi,
  cekListeOku,
  cekListeSorulduMu,
  cekListeYaz,
  muayeneCekListesi,
} from '@/lib/doktor/muayeneCekListesi'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

// NOTYA-EYLEM: an assistant turn may carry confirm cards. They live ON the message so they stay in
// place as the conversation grows — a card that jumps to the bottom is a card tapped for the wrong turn.
interface Mesaj { rol: 'doktor' | 'asistan'; icerik: string; oneriler?: EylemOneriGorunumu[]; hasta?: EylemHasta }

interface TanimaSonucu { isFinal: boolean; 0: { transcript: string } }
interface TanimaOlayi { resultIndex: number; results: { length: number; [i: number]: TanimaSonucu } }
interface Tanima {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: TanimaOlayi) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

const HAZIR_SORULAR = [
  CEK_LISTE_SORU,
  'Bu hastanın bize bu kaçıncı ziyareti?',
  'Son vizitlerini yoğun şekilde özetle.',
  'Son 6 aydaki geliş nedenleri, verilen ilaçlar ve sonuçları neler?',
  'Sürekli kullandığı ilaçları söyle.',
  'Özgeçmişini özetle.',
  'Son görüntüleme kayıtları neler?',
  'Belgedeki aşı / ilaç / alerji kayıtlarını hazırla.',
]

export default function HastaKonsult({
  patientId,
  baslangicAcik = false,
  doktorBransi = null,
  hastaDogumIso = null,
}: {
  patientId: string
  /** ?tab=ayse derin bağlantısı şeridi açık getirir. */
  baslangicAcik?: boolean
  doktorBransi?: string | null
  hastaDogumIso?: string | null
}) {
  const [acik, setAcik] = useState(baslangicAcik)
  const [mod, setMod] = useState<'yaz' | 'konus'>('yaz')
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([])
  const [girdi, setGirdi] = useState('')
  const [bekliyor, setBekliyor] = useState(false)
  const [dinliyor, setDinliyor] = useState(false)
  const [hata, setHata] = useState('')
  const [bekleyen, setBekleyen] = useState<EylemOneriGorunumu[]>([])
  const [kartHastasi, setKartHastasi] = useState<EylemHasta | null>(null)
  // NOTYA-AYSE-DANIS-DUZENLE (Kaan/Dr. Gökhan, 2026-09-23): asistan cevabı (ör. uzun bir çek
  // listesi + Öneri raporu) hekimin düzeltebileceği bir metin olsun -- yalnız bu sohbetin
  // görünümünde, salt-okunur balona kilitli kalmasın.
  const [duzenlenenIndex, setDuzenlenenIndex] = useState<number | null>(null)
  const [duzenlemeMetni, setDuzenlemeMetni] = useState('')
  const [cekIsaret, setCekIsaret] = useState<Record<string, boolean>>(() => cekListeOku(patientId))
  const [cekAcik, setCekAcik] = useState(false)
  const [bransOnbel, setBransOnbel] = useState<string | null>(doktorBransi)
  useEffect(() => {
    if (doktorBransi) return
    try { setBransOnbel(localStorage.getItem('notya_doktor_specialty')) } catch { /* yok */ }
  }, [doktorBransi])
  const cekMaddeler = muayeneCekListesi({ doktorBransi: bransOnbel, hastaDogumIso })
  const altRef = useRef<HTMLDivElement>(null)
  const tanimaRef = useRef<Tanima | null>(null)

  useEffect(() => {
    if (baslangicAcik) setAcik(true)
  }, [baslangicAcik])

  // NOTYA-EYLEM — BEKLEYEN TEPSİSİ. Every surface writes its taslaklar to the same table, so a card
  // prepared in the yazılı sohbet (or, once the voice tool loop lands, in a sesli seans) is waiting
  // here in the patient's own file instead of being lost with the conversation that produced it.
  // Loaded once on mount; committed/dismissed cards drop out via onSonuc.
  useEffect(() => {
    let iptal = false
    ;(async () => {
      try {
        const t = await ensureDoctorAccessToken()
        if (!t) return
        const r = await fetch(`/api/doktor/eylem?hastaId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${t}` } })
        if (!r.ok) return
        const d = await r.json()
        if (iptal) return
        if (d.hasta) setKartHastasi(d.hasta as EylemHasta)
        if (Array.isArray(d.oneriler) && d.oneriler.length) setBekleyen(d.oneriler as EylemOneriGorunumu[])
      } catch { /* bekleyen tepsi kritik değil — sohbet her hâlükârda çalışır */ }
    })()
    return () => { iptal = true }
  }, [patientId])

  useEffect(() => () => {
    try { tanimaRef.current?.stop() } catch { /* sessiz */ }
  }, [])

  function mikrofonDurdur() {
    try { tanimaRef.current?.stop() } catch { /* sessiz */ }
    setDinliyor(false)
  }

  function mikrofon() {
    if (dinliyor) { mikrofonDurdur(); return }
    const w = window as unknown as { webkitSpeechRecognition?: new () => Tanima; SpeechRecognition?: new () => Tanima }
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!Ctor) {
      setHata('Bu tarayıcı sesli girişi desteklemiyor — yazarak sorun.')
      setMod('yaz')
      return
    }
    setHata('')
    setMod('konus')
    setAcik(true)
    const t = new Ctor()
    t.lang = 'tr-TR'
    t.continuous = true
    t.interimResults = true
    t.onresult = (e) => {
      let son = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) son += e.results[i][0].transcript
      }
      if (son) setGirdi((g) => (g ? `${g} ` : '') + son.trim())
    }
    t.onend = () => setDinliyor(false)
    t.onerror = () => setDinliyor(false)
    tanimaRef.current = t
    t.start()
    setDinliyor(true)
  }

  async function gonder(metin: string) {
    const soru = metin.trim()
    if (!soru || bekliyor) return
    mikrofonDurdur()
    setHata('')
    setGirdi('')
    setAcik(true)
    const yeniGecmis: Mesaj[] = [...mesajlar, { rol: 'doktor', icerik: soru }]
    setMesajlar(yeniGecmis)
    if (cekListeSorulduMu(soru)) {
      setCekAcik(true)
      setMesajlar([...yeniGecmis, { rol: 'asistan', icerik: cekListeAsistanCevabi(cekMaddeler) }])
      return
    }
    setBekliyor(true)
    try {
      const t = await ensureDoctorAccessToken()
      const r = await fetch('/api/doktor/konsult', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, mesajlar: yeniGecmis }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Asistan yanıt veremedi.')
      if (d.hasta) setKartHastasi(d.hasta as EylemHasta)
      setMesajlar([...yeniGecmis, { rol: 'asistan', icerik: d.cevap || '', oneriler: d.oneriler || [], hasta: d.hasta || undefined }])
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Asistan yanıt veremedi.')
    } finally {
      setBekliyor(false)
      setTimeout(() => altRef.current?.scrollIntoView({ behavior: 'smooth' }), 60)
    }
  }

  // NOTYA-YENI-GORUNUM-03 (Kaan, 2026-09-24): this whole panel was still dark-navy (#0D1C33 +
  // white-based translucent fills) -- the redesign never reached it. Recolored to the cream/pine
  // language: a light, teal-tinted card (matching the "profilinizden" badge treatment used
  // elsewhere for Ayşe-branded surfaces) rather than plain white, so it keeps its own identity
  // without the dark theme's near-invisible borders and white-on-white inputs.
  const panel: React.CSSProperties = {
    background: '#F0FDFA',
    border: '1px solid #99F6E4',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  }

  return (
    <div style={panel} data-ayse-serit="1">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', flexWrap: 'wrap' }}>
        <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(15,155,142,0.14)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>🩺</span>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: CHROME_RENK.ink }}>Ayşe&apos;ye Danış</div>
          <div style={{ fontSize: 11, color: CHROME_RENK.muted, marginTop: 1 }}>Dosyayı bilir, kayıt da hazırlar · onaylamadan hiçbir şey yazılmaz</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={mikrofon}
            style={{
              padding: '8px 14px',
              background: dinliyor ? '#FBEAE3' : 'rgba(15,155,142,0.12)',
              border: `1px solid ${dinliyor ? `${CHROME_RENK.warn}70` : 'rgba(15,155,142,0.35)'}`,
              color: dinliyor ? CHROME_RENK.warn : '#0F9B8E',
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {dinliyor ? 'Dinleniyor… durdur' : 'Konuş'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMod('yaz')
              setAcik(true)
            }}
            style={{
              padding: '8px 14px',
              background: acik && mod === 'yaz' ? 'rgba(15,155,142,0.15)' : '#FFFFFF',
              border: `1px solid ${CHROME_RENK.border}`,
              color: CHROME_RENK.ink,
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Yaz
          </button>
          <button
            type="button"
            onClick={() => {
              if (acik) mikrofonDurdur()
              setAcik((v) => !v)
            }}
            style={{
              padding: '8px 12px',
              background: 'transparent',
              border: `1px solid ${CHROME_RENK.border}`,
              color: CHROME_RENK.muted,
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {acik ? 'Daralt' : 'Aç'}
          </button>
        </div>
      </div>

      {acik && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid #99F6E4' }}>
          {mesajlar.length === 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '12px 0 10px' }}>
              {HAZIR_SORULAR.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void gonder(s)}
                  style={{ background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, color: CHROME_RENK.muted, borderRadius: 999, padding: '6px 11px', fontSize: 11.5, cursor: 'pointer' }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {cekAcik && (
            <div style={{ margin: '8px 0 12px' }}>
              <MuayeneCekListesi
                maddeler={cekMaddeler}
                isaretler={cekIsaret}
                onToggle={(id) => {
                  const sonraki = { ...cekIsaret, [id]: !cekIsaret[id] }
                  setCekIsaret(sonraki)
                  cekListeYaz(patientId, sonraki)
                }}
              />
              <a
                href={`/session/new?patientId=${encodeURIComponent(patientId)}`}
                style={{ display: 'inline-block', marginTop: 8, fontSize: 12, fontWeight: 700, color: '#0F9B8E' }}
              >
                Muayeneye geç — liste seansa gelir →
              </a>
            </div>
          )}

          {bekleyen.length > 0 && kartHastasi ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: CHROME_RENK.muted, marginBottom: 4 }}>Onayınızı bekleyen kayıtlar</div>
              {bekleyen.map((o) => (
                <EylemKarti key={o.id} oneri={o} hasta={kartHastasi} onSonuc={({ oneriId }) => setBekleyen((b) => b.filter((x) => x.id !== oneriId))} />
              ))}
            </div>
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10, maxHeight: 560, overflowY: 'auto', paddingTop: mesajlar.length ? 12 : 0 }}>
            {mesajlar.map((m, i) => (
              <div key={i} style={{ alignSelf: m.rol === 'doktor' ? 'flex-end' : 'stretch', maxWidth: m.rol === 'doktor' ? '88%' : '100%' }}>
                {duzenlenenIndex === i ? (
                  <div style={{ background: '#FFFFFF', border: '1px solid rgba(15,155,142,0.4)', borderRadius: 14, padding: '9px 12px' }}>
                    <textarea
                      value={duzenlemeMetni}
                      onChange={(e) => setDuzenlemeMetni(e.target.value)}
                      rows={Math.min(20, Math.max(4, duzenlemeMetni.split('\n').length))}
                      style={{ width: '100%', boxSizing: 'border-box', background: '#F6F0E4', border: `1px solid ${CHROME_RENK.border}`, color: CHROME_RENK.ink, borderRadius: 8, padding: '8px 10px', fontSize: 13.5, lineHeight: 1.55, fontFamily: 'inherit', resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setMesajlar((prev) => prev.map((x, xi) => (xi === i ? { ...x, icerik: duzenlemeMetni } : x)))
                          setDuzenlenenIndex(null)
                        }}
                        style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 8, padding: '6px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Kaydet
                      </button>
                      <button
                        type="button"
                        onClick={() => setDuzenlenenIndex(null)}
                        style={{ background: 'transparent', border: `1px solid ${CHROME_RENK.border}`, color: CHROME_RENK.muted, borderRadius: 8, padding: '6px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Vazgeç
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'inline-block',
                      maxWidth: '100%',
                      background: m.rol === 'doktor' ? '#0F9B8E' : '#FFFFFF',
                      border: m.rol === 'doktor' ? 'none' : `1px solid ${CHROME_RENK.border}`,
                      color: m.rol === 'doktor' ? 'white' : CHROME_RENK.ink,
                      borderRadius: 14,
                      padding: '9px 12px',
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      whiteSpace: m.rol === 'doktor' ? 'pre-wrap' : 'normal',
                      position: 'relative',
                    }}
                  >
                    {m.rol === 'asistan' ? <HafifMarkdown metin={m.icerik} /> : m.icerik}
                    {m.rol === 'asistan' && (
                      <button
                        type="button"
                        onClick={() => { setDuzenlemeMetni(m.icerik); setDuzenlenenIndex(i) }}
                        title="Bu cevabı düzenle"
                        style={{ display: 'block', marginTop: 6, background: 'none', border: 'none', color: '#0F9B8E', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                      >
                        ✏️ Düzenle
                      </button>
                    )}
                  </div>
                )}
                {m.oneriler?.length && m.hasta ? (
                  m.oneriler.length > 1
                    ? <EylemToplu oneriler={m.oneriler} hasta={m.hasta} />
                    : <EylemKarti oneri={m.oneriler[0]} hasta={m.hasta} />
                ) : null}
              </div>
            ))}
            {bekliyor && <div style={{ alignSelf: 'flex-start', color: CHROME_RENK.muted, fontSize: 12.5 }}>Ayşe dosyayı inceliyor…</div>}
            <div ref={altRef} />
          </div>

          {hata && (
            <div style={{ background: '#FBEAE3', border: `1px solid ${CHROME_RENK.warn}70`, color: CHROME_RENK.warn, borderRadius: 8, padding: '8px 11px', fontSize: 12.5, marginBottom: 8 }}>{hata}</div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void gonder(girdi)
            }}
            style={{ display: 'flex', gap: 8, alignItems: 'center' }}
          >
            <input
              value={girdi}
              onChange={(e) => setGirdi(e.target.value)}
              placeholder={dinliyor ? 'Konuşun — metin buraya düşer…' : 'Hasta hakkında sorun… veya Konuş’a basın'}
              style={{ flex: 1, background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, color: CHROME_RENK.ink, borderRadius: 10, padding: '10px 12px', fontSize: 13.5 }}
            />
            <button
              type="submit"
              disabled={bekliyor || !girdi.trim()}
              style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 10, padding: '0 16px', height: 40, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: bekliyor || !girdi.trim() ? 0.5 : 1 }}
            >
              Sor
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
