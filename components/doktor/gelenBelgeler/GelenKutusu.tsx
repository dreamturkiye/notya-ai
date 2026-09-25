'use client'
/**
 * NOTYA-GELEN-BELGELER — the Gelen Belgeler inbox. One calm list: each item shows the file (photo, sound player or a
 * document tile), Notya's one-line summary, the suggested type and patient with a plain certainty ("Eminim" /
 * "Kontrol edin"), ONE primary button "Dosyaya ekle", and two quiet ones: "Başka hasta seç", "Sil".
 *
 * Ways in on this page (besides drag & drop / paste anywhere — GelenBelgeBirak): "Dosya seç", "Fotoğraf çek" on
 * phones, "Sesli not" (MediaRecorder, recorded right here).
 *
 * After filing (doctor): a lab result starts the existing lab reader (belgeler/lab 'cikar') so the table is ready in
 * the patient file; when the patient has an open consultation request, "yanıt olarak bağla" links the report to it via
 * the existing konsültasyon route ('belge_bagla') — the doctor still writes the reply sentence (hekim kilidi).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { dosyaGonder, gelenIstek, gelenDegisti, GELEN_OLAY, GELEN_BEKLEYEN_OLAY, bekleyenSayisi, GelenHatasi } from '@/lib/gelenBelgeler/istemci'
import { KABUL_EDILEN } from '@/lib/gelenBelgeler/bicim'
import { KAYNAK_ETIKETI, KESINLIK_ETIKETI, type GelenKaynak, type GelenOge, type Kesinlik } from '@/lib/gelenBelgeler/tipler'
import { durumGrubu } from '@/lib/doktor/konsultasyon'

const R = CHROME_RENK
const kart: React.CSSProperties = { background: R.paper, border: `1px solid ${R.border}`, borderRadius: 20, boxShadow: '0 16px 34px rgba(58,44,34,0.06)' }
const sessizDugme: React.CSSProperties = { background: 'transparent', border: 'none', color: R.pine, fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '10px 6px', minHeight: 44 }
const cipDugme: React.CSSProperties = { background: '#FFFFFF', border: `1px solid ${R.border}`, borderRadius: 999, color: R.ink, fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '10px 16px', minHeight: 44, display: 'inline-flex', alignItems: 'center', gap: 8 }

type Liste = { ogeler: GelenOge[]; hazir: boolean; rol?: 'doktor' | 'sekreter'; turler?: string[] }
type Hasta = { id: string; ad: string; dogum: string | null }
type AcikKonsultasyon = { id: string; etiket: string }

export const kesinlikRengi = (k: Kesinlik) => (k === 'eminim' ? { renk: R.pine, zemin: '#E4F0E6' } : { renk: '#8A6420', zemin: '#F6ECD6' })

export function zamanMetni(iso: string, simdi: Date = new Date()): string {
  const d = new Date(iso)
  const dk = Math.round((simdi.getTime() - d.getTime()) / 60000)
  if (dk < 1) return 'şimdi'
  if (dk < 60) return `${dk} dk önce`
  const bugun = simdi.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' }) === d.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' })
  const saat = d.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' })
  return bugun ? `bugün ${saat}` : d.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', day: 'numeric', month: 'long' }) + ` ${saat}`
}

const dogumMetni = (iso: string | null) => (iso ? iso.split('-').reverse().join('.') : '')

function DosyaGorunumu({ o }: { o: GelenOge }) {
  const kutu: React.CSSProperties = { width: 88, height: 88, borderRadius: 14, flexShrink: 0, overflow: 'hidden', background: '#EFE9DC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: R.pine, fontWeight: 700, fontSize: 13 }
  if (o.bicim === 'gorsel' && o.url) {
    return <a href={o.url} target="_blank" rel="noreferrer" style={kutu}><img src={o.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></a>
  }
  if (o.bicim === 'ses') return <div style={{ ...kutu, fontSize: 28 }} aria-hidden>🎙️</div>
  const etiket = o.bicim === 'pdf' ? 'PDF' : o.bicim === 'word' ? 'Word' : o.bicim === 'excel' ? 'Tablo' : 'Metin'
  return o.url
    ? <a href={o.url} target="_blank" rel="noreferrer" style={{ ...kutu, textDecoration: 'none' }}>{etiket}</a>
    : <div style={kutu}>{etiket}</div>
}

function OgeKarti({ o, rol, turler, bitti }: { o: GelenOge; rol: 'doktor' | 'sekreter'; turler: string[]; bitti: (id: string) => void }) {
  const [hasta, setHasta] = useState<Hasta | null>(o.oneriler[0] ? { id: o.oneriler[0].patientId, ad: o.oneriler[0].ad, dogum: o.oneriler[0].dogum } : null)
  const [kesinlik, setKesinlik] = useState<Kesinlik | null>(o.oneriler[0]?.kesinlik ?? null)
  const [tur, setTur] = useState(o.belgeTuru)
  const [seciyor, setSeciyor] = useState(false)
  const [arama, setArama] = useState('')
  const [sonuclar, setSonuclar] = useState<Hasta[]>([])
  const [siliniyor, setSiliniyor] = useState(false)
  const [isleniyor, setIsleniyor] = useState(false)
  const [hata, setHata] = useState('')
  const [metinAcik, setMetinAcik] = useState(false)
  const [konsultasyonlar, setKonsultasyonlar] = useState<AcikKonsultasyon[]>([])
  const [bagla, setBagla] = useState<string | null>(null)
  const [sonuc, setSonuc] = useState<{ yol: string; metin: string } | null>(null)

  // Open consultation requests of the chosen patient (doctor only — the existing konsültasyon route).
  useEffect(() => {
    setKonsultasyonlar([]); setBagla(null)
    if (!hasta || rol !== 'doktor') return
    let iptal = false
    gelenIstek<{ konsultasyonlar?: { id: string; durum: string; hedefEtiketi?: string; istem_tarihi?: string | null }[] }>(`/api/doktor/konsultasyon?patientId=${encodeURIComponent(hasta.id)}`)
      .then((j) => {
        if (iptal) return
        const acik = (j.konsultasyonlar || []).filter((k) => durumGrubu(k.durum) === 'bekliyor').map((k) => ({ id: k.id, etiket: `${k.hedefEtiketi || 'Konsültasyon'}${k.istem_tarihi ? ` · ${dogumMetni(k.istem_tarihi)}` : ''}` }))
        setKonsultasyonlar(acik)
        if (acik.length === 1 && (tur === 'Konsültasyon raporu')) setBagla(acik[0].id)
      })
      .catch(() => { /* the card works without it */ })
    return () => { iptal = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasta?.id, rol])

  useEffect(() => {
    if (!seciyor || arama.trim().length < 2) { setSonuclar([]); return }
    const t = setTimeout(() => {
      gelenIstek<{ hastalar: Hasta[] }>(`/api/doktor/gelen-belgeler?hastaAra=${encodeURIComponent(arama.trim())}`)
        .then((j) => setSonuclar(j.hastalar || []))
        .catch(() => setSonuclar([]))
    }, 220)
    return () => clearTimeout(t)
  }, [arama, seciyor])

  const sec = (h: Hasta, k: Kesinlik | null = null) => { setHasta(h); setKesinlik(k); setSeciyor(false); setArama(''); setHata('') }

  const dosyalaTikla = async () => {
    if (!hasta) { setSeciyor(true); return }
    setIsleniyor(true); setHata('')
    try {
      const j = await gelenIstek<{ belgeId: string; patientId: string; belgeTuru: string }>(`/api/doktor/gelen-belgeler/${o.id}`, { method: 'PATCH', govde: { islem: 'dosyala', patientId: hasta.id, belgeTuru: tur } })
      let ek = ''
      if (rol === 'doktor' && bagla) {
        try {
          await gelenIstek('/api/doktor/konsultasyon', { method: 'PATCH', govde: { id: bagla, islem: 'belge_bagla', belgeId: j.belgeId } })
          ek = ' Konsültasyona bağlandı; yanıtınızı hasta dosyasında yazabilirsiniz.'
        } catch { ek = ' Konsültasyona bağlanamadı; hasta dosyasından bağlayabilirsiniz.' }
      }
      const lab = rol === 'doktor' && j.belgeTuru === 'Lab Sonucu' && ['pdf', 'gorsel', 'excel'].includes(o.bicim)
      if (lab) {
        // Existing lab pipeline — reads the table so it is ready when the doctor opens the file.
        void gelenIstek('/api/doktor/belgeler/lab', { method: 'POST', govde: { adim: 'cikar', documentId: j.belgeId } }).catch(() => {})
        ek = ek || ' Tahlil tablosu hazırlanıyor.'
      }
      const yol = `/dashboard/doktor/hastalar/${j.patientId}/belgeler/${j.belgeId}${lab ? '/lab' : ''}`
      setSonuc({ yol, metin: `${hasta.ad} dosyasına eklendi.${ek}` })
      // Refresh counts only after the confirmation has been seen — a reload now would drop this card at once.
      setTimeout(() => { bitti(o.id); gelenDegisti() }, 7000)
    } catch (e) {
      setHata(e instanceof GelenHatasi ? e.message : 'Dosyaya eklenemedi. Lütfen yeniden deneyin.')
    } finally {
      setIsleniyor(false)
    }
  }

  const silTikla = async () => {
    setIsleniyor(true); setHata('')
    try {
      await gelenIstek(`/api/doktor/gelen-belgeler/${o.id}`, { method: 'PATCH', govde: { islem: 'sil' } })
      gelenDegisti()
      bitti(o.id)
    } catch (e) {
      setHata(e instanceof GelenHatasi ? e.message : 'Silinemedi.')
      setIsleniyor(false)
    }
  }

  if (sonuc) {
    return (
      <div style={{ ...kart, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ width: 28, height: 28, borderRadius: '50%', background: R.pine, color: '#FAF8F4', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>✓</span>
        <span style={{ flex: 1, minWidth: 200, fontSize: 15, color: R.ink }}>{sonuc.metin}</span>
        <a href={sonuc.yol} style={{ ...sessizDugme, textDecoration: 'none' }}>Dosyayı aç ›</a>
      </div>
    )
  }

  const digerOneriler = o.oneriler.filter((x) => x.patientId !== hasta?.id)
  const renk = kesinlik ? kesinlikRengi(kesinlik) : null

  return (
    <div style={{ ...kart, padding: 18 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <DosyaGorunumu o={o} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: R.ink, lineHeight: 1.3 }}>{o.ozet}</div>
          <div style={{ fontSize: 13, color: R.muted, marginTop: 4 }}>
            {zamanMetni(o.tarih)} · {o.gonderen || KAYNAK_ETIKETI[o.kaynak as GelenKaynak] || ''}
          </div>
          {o.bicim === 'ses' && o.url && <audio controls preload="none" src={o.url} style={{ width: '100%', maxWidth: 420, marginTop: 10, height: 40 }} />}
          {o.metin && (
            <div style={{ marginTop: 8 }}>
              <button type="button" onClick={() => setMetinAcik((v) => !v)} style={{ ...sessizDugme, padding: '6px 0', minHeight: 32, fontSize: 13 }}>
                {metinAcik ? 'Metni gizle' : o.bicim === 'ses' ? 'Söylenenleri göster' : 'Metni göster'}
              </button>
              {metinAcik && <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, color: R.ink, background: '#FFFFFF', border: `1px solid ${R.borderSoft}`, borderRadius: 12, padding: '10px 12px', maxHeight: 220, overflowY: 'auto' }}>{o.metin}</div>}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {hasta ? (
            <>
              <span style={{ fontSize: 15, color: R.ink, fontWeight: 600 }}>{hasta.ad}{hasta.dogum ? <span style={{ color: R.muted, fontWeight: 400 }}> · {dogumMetni(hasta.dogum)}</span> : null}</span>
              {renk && kesinlik && <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999, color: renk.renk, background: renk.zemin }}>{KESINLIK_ETIKETI[kesinlik]}</span>}
            </>
          ) : (
            <span style={{ fontSize: 15, color: R.muted }}>Hasta bulunamadı — lütfen seçin</span>
          )}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: R.muted, marginLeft: 'auto' }}>
            Tür
            <select value={tur} onChange={(e) => setTur(e.target.value)} style={{ fontSize: 14, padding: '8px 10px', borderRadius: 10, border: `1px solid ${R.border}`, background: '#FFFFFF', color: R.ink, minHeight: 40 }}>
              {(turler.includes(tur) ? turler : [tur, ...turler]).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>

        {seciyor && (
          <div style={{ background: '#FFFFFF', border: `1px solid ${R.border}`, borderRadius: 14, padding: 10 }}>
            {digerOneriler.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {digerOneriler.map((x) => (
                  <button key={x.patientId} type="button" onClick={() => sec({ id: x.patientId, ad: x.ad, dogum: x.dogum }, x.kesinlik)} style={cipDugme}>
                    {x.ad}{x.dogum ? <span style={{ color: R.muted, fontWeight: 400 }}>{dogumMetni(x.dogum)}</span> : null}
                  </button>
                ))}
              </div>
            )}
            <input
              autoFocus
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Hasta adı yazın"
              style={{ width: '100%', boxSizing: 'border-box', fontSize: 16, padding: '12px 14px', borderRadius: 12, border: `1px solid ${R.border}`, background: R.paper, color: R.ink }}
            />
            {sonuclar.map((h) => (
              <button key={h.id} type="button" onClick={() => sec(h)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: `1px solid ${R.borderSoft}`, padding: '12px 6px', fontSize: 15, color: R.ink, cursor: 'pointer' }}>
                {h.ad}{h.dogum ? <span style={{ color: R.muted }}> · {dogumMetni(h.dogum)}</span> : null}
              </button>
            ))}
            {arama.trim().length >= 2 && sonuclar.length === 0 && <div style={{ fontSize: 13, color: R.muted, padding: '10px 6px' }}>Bu adla hasta bulunamadı.</div>}
          </div>
        )}

        {konsultasyonlar.length > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: R.ink, minHeight: 40 }}>
            <input type="checkbox" checked={!!bagla} onChange={(e) => setBagla(e.target.checked ? konsultasyonlar[0].id : null)} style={{ width: 20, height: 20, accentColor: R.pine }} />
            Açık konsültasyona yanıt olarak bağla ({konsultasyonlar[0].etiket})
          </label>
        )}

        {hata && <div style={{ fontSize: 14, color: R.warn }}>{hata}</div>}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => void dosyalaTikla()}
            disabled={isleniyor}
            style={{ background: R.pine, color: '#FAF8F4', border: 'none', borderRadius: 999, padding: '12px 22px', fontSize: 15, fontWeight: 700, cursor: isleniyor ? 'default' : 'pointer', minHeight: 46, opacity: isleniyor ? 0.7 : 1 }}
          >
            {isleniyor ? 'Ekleniyor…' : 'Dosyaya ekle'}
          </button>
          <button type="button" onClick={() => setSeciyor((v) => !v)} style={sessizDugme}>{seciyor ? 'Vazgeç' : 'Başka hasta seç'}</button>
          <span style={{ flex: 1 }} />
          {siliniyor ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, color: R.muted }}>
              Silinsin mi?
              <button type="button" onClick={() => void silTikla()} disabled={isleniyor} style={{ ...sessizDugme, color: R.warn }}>Sil</button>
              <button type="button" onClick={() => setSiliniyor(false)} style={{ ...sessizDugme, color: R.muted }}>Vazgeç</button>
            </span>
          ) : (
            <button type="button" onClick={() => setSiliniyor(true)} style={{ ...sessizDugme, color: R.muted }}>Sil</button>
          )}
        </div>
      </div>
    </div>
  )
}

/** "Sesli not": record in the browser (MediaRecorder), send as a voice note. */
function SesliNot({ gonder }: { gonder: (f: File) => void }) {
  const [durum, setDurum] = useState<'bos' | 'kayit'>('bos')
  const [sure, setSure] = useState(0)
  const [hata, setHata] = useState('')
  const kaydedici = useRef<MediaRecorder | null>(null)
  const parcalar = useRef<Blob[]>([])
  const iptal = useRef(false)
  const saat = useRef<ReturnType<typeof setInterval> | null>(null)

  const bitir = (gonderilsin: boolean) => {
    iptal.current = !gonderilsin
    kaydedici.current?.stop()
  }

  const basla = async () => {
    setHata('')
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) { setHata('Bu tarayıcı ses kaydını desteklemiyor.'); return }
    try {
      const akis = await navigator.mediaDevices.getUserMedia({ audio: true })
      const tur = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((t) => MediaRecorder.isTypeSupported?.(t)) || ''
      const r = new MediaRecorder(akis, tur ? { mimeType: tur } : undefined)
      parcalar.current = []; iptal.current = false
      r.ondataavailable = (e) => { if (e.data.size) parcalar.current.push(e.data) }
      r.onstop = () => {
        akis.getTracks().forEach((t) => t.stop())
        if (saat.current) clearInterval(saat.current)
        setDurum('bos'); setSure(0)
        if (iptal.current || !parcalar.current.length) return
        const mime = (r.mimeType || tur || 'audio/webm').split(';')[0]
        const uz = mime.includes('mp4') ? 'm4a' : 'webm'
        const tarih = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }).replace(/[^\d]+/g, '-')
        gonder(new File(parcalar.current, `sesli-not-${tarih}.${uz}`, { type: mime.includes('mp4') ? 'audio/mp4' : 'audio/webm' }))
      }
      kaydedici.current = r
      r.start()
      setDurum('kayit')
      const bas = Date.now()
      saat.current = setInterval(() => {
        const s = Math.round((Date.now() - bas) / 1000)
        setSure(s)
        if (s >= 300) bitir(true) // 5 minutes is plenty for a voice note
      }, 500)
    } catch {
      setHata('Mikrofona erişilemedi. Tarayıcı izinlerini kontrol edin.')
    }
  }

  useEffect(() => () => { if (saat.current) clearInterval(saat.current); iptal.current = true; kaydedici.current?.state === 'recording' && kaydedici.current.stop() }, [])

  if (durum === 'kayit') {
    return (
      <span style={{ ...cipDugme, cursor: 'default', borderColor: `${R.warn}55` }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: R.warn }} />
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.floor(sure / 60)}:{String(sure % 60).padStart(2, '0')}</span>
        <button type="button" onClick={() => bitir(true)} style={{ ...sessizDugme, padding: '0 4px', minHeight: 0 }}>Bitir</button>
        <button type="button" onClick={() => bitir(false)} style={{ ...sessizDugme, padding: '0 4px', minHeight: 0, color: R.muted }}>Vazgeç</button>
      </span>
    )
  }
  return (
    <>
      <button type="button" onClick={() => void basla()} style={cipDugme}>🎙️ Sesli not</button>
      {hata && <span style={{ fontSize: 13, color: R.warn }}>{hata}</span>}
    </>
  )
}

export default function GelenKutusu() {
  const [liste, setListe] = useState<Liste | null>(null)
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(0)
  const [bilgi, setBilgi] = useState('')
  const [telefon, setTelefon] = useState(false)
  const dosyaGirdi = useRef<HTMLInputElement>(null)
  const kameraGirdi = useRef<HTMLInputElement>(null)

  const yukle = useCallback(async () => {
    try {
      setListe(await gelenIstek<Liste>('/api/doktor/gelen-belgeler'))
      setHata('')
    } catch (e) {
      setHata(e instanceof GelenHatasi ? e.message : 'Gelen belgeler alınamadı.')
      setListe({ ogeler: [], hazir: true })
    }
  }, [])

  useEffect(() => {
    void yukle()
    setTelefon(typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches)
    const yenile = () => void yukle()
    const bekleyen = () => setYukleniyor(bekleyenSayisi())
    window.addEventListener(GELEN_OLAY, yenile)
    window.addEventListener(GELEN_BEKLEYEN_OLAY, bekleyen)
    return () => { window.removeEventListener(GELEN_OLAY, yenile); window.removeEventListener(GELEN_BEKLEYEN_OLAY, bekleyen) }
  }, [yukle])

  const gonder = async (dosyalar: File[], kaynak: GelenKaynak) => {
    setBilgi('')
    const sonuclar = await Promise.allSettled(dosyalar.slice(0, 10).map((f) => dosyaGonder(f, kaynak)))
    const red = sonuclar.find((s) => s.status === 'rejected') as PromiseRejectedResult | undefined
    if (red) setBilgi(red.reason instanceof GelenHatasi ? red.reason.message : 'Belge eklenemedi.')
    else if (sonuclar.some((s) => s.status === 'fulfilled' && s.value.durum === 'zaten_var')) setBilgi('Bu belge zaten burada ya da dosyalanmış.')
  }

  const secildi = (e: React.ChangeEvent<HTMLInputElement>, kaynak: GelenKaynak) => {
    const f = Array.from(e.target.files || [])
    e.target.value = ''
    if (f.length) void gonder(f, kaynak)
  }

  const cikar = (id: string) => setListe((l) => (l ? { ...l, ogeler: l.ogeler.filter((x) => x.id !== id) } : l))

  return (
    <div style={{ fontFamily: CHROME_FONT.sans, maxWidth: 820 }}>
      <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4 }}>Doktor</div>
      <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 32, margin: '0 0 6px', color: '#2e251d', letterSpacing: '-0.02em' }}>Gelen Belgeler</h1>
      <p style={{ fontSize: 15, color: R.muted, margin: '0 0 18px', lineHeight: 1.5 }}>
        Tahlil sonuçları, röntgen ve EKG fotoğrafları, konsültasyon yanıtları, sesli mesajlar — hepsi burada.
        Notya okur ve hastayı önerir; siz tek dokunuşla dosyaya eklersiniz.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
        <button type="button" onClick={() => dosyaGirdi.current?.click()} style={cipDugme}>＋ Dosya seç</button>
        {telefon && <button type="button" onClick={() => kameraGirdi.current?.click()} style={cipDugme}>📷 Fotoğraf çek</button>}
        <SesliNot gonder={(f) => void gonder([f], 'ses_kaydi')} />
        <input ref={dosyaGirdi} type="file" multiple accept={KABUL_EDILEN} onChange={(e) => secildi(e, 'yukleme')} style={{ display: 'none' }} />
        <input ref={kameraGirdi} type="file" accept="image/*" capture="environment" onChange={(e) => secildi(e, 'kamera')} style={{ display: 'none' }} />
      </div>
      <div style={{ fontSize: 13, color: R.muted, marginBottom: 20 }}>
        {telefon ? 'PDF, Word, Excel, fotoğraf ve ses dosyaları.' : 'Ya da dosyayı sayfanın herhangi bir yerine sürükleyip bırakın; kopyaladığınız bir tabloyu ⌘V / Ctrl+V ile yapıştırın.'}
      </div>

      {bilgi && <div style={{ fontSize: 14, color: R.warn, marginBottom: 12 }}>{bilgi}</div>}
      {yukleniyor > 0 && (
        <div style={{ ...kart, padding: '16px 20px', marginBottom: 12, fontSize: 15, color: R.muted }}>
          {yukleniyor > 1 ? `Notya ${yukleniyor} belgeyi okuyor…` : 'Notya okuyor…'}
        </div>
      )}

      {!liste ? (
        <div style={{ ...kart, height: 120, opacity: 0.6 }} />
      ) : !liste.hazir ? (
        <div style={{ ...kart, padding: '22px 20px', fontSize: 15, color: R.muted }}>Gelen Belgeler kısa süre içinde açılacak.</div>
      ) : hata ? (
        <div style={{ ...kart, padding: '22px 20px', fontSize: 15, color: R.warn }}>{hata}</div>
      ) : liste.ogeler.length === 0 && yukleniyor === 0 ? (
        <div style={{ ...kart, padding: '28px 22px', textAlign: 'center' }}>
          <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 22, color: R.ink }}>Yeni belge yok</div>
          <div style={{ fontSize: 14, color: R.muted, marginTop: 6 }}>Bir tahlil sonucu ya da fotoğraf geldiğinde buraya bırakın — Notya dosyalasın.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {liste.ogeler.map((o) => <OgeKarti key={o.id} o={o} rol={liste.rol || 'doktor'} turler={liste.turler || []} bitti={cikar} />)}
        </div>
      )}
    </div>
  )
}
