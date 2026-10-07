'use client'

/**
 * NOTYA-SES-PROFILI-01 — optional doctor voice-profile enrolment (onboarding step and Ayarlar).
 *
 * - Explicit consent first: an unticked checkbox (text in lib/asistan/sesProfili/rizaMetni.ts — PENDING LAWYER
 *   REVIEW); recording stays disabled until it is ticked. The full text opens in a new tab (/kvkk#ses-profili).
 * - The doctor reads four short sentences. Each is checked (too short / too quiet / too noisy); only a failed
 *   sentence is repeated.
 * - Audio never leaves the browser: PCM is turned into a 256-number embedding in a Web Worker and dropped.
 *   Only the averaged embedding is sent to /api/doktor/ses-profili (encrypted at rest).
 * - "Şimdi değil" is as prominent as the record button. This is NOT a security lock and is never described as one.
 */
import { useEffect, useRef, useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { KAYIT_CUMLELERI, KAYIT_KALITE, KAYIT_SORUN_METNI } from '@/lib/asistan/sesProfili/ayar'
import { kayitKalitesi } from '@/lib/asistan/sesProfili/kalite'
import { GE2E_HZ, profilOrtalama, yenidenOrnekle } from '@/lib/asistan/sesProfili/ge2e'
import { sesProfiliKaydet, sesProfiliMotoru } from '@/lib/asistan/sesProfili/istemci'
import { RIZA_BAGLANTI_METNI, RIZA_KUTUSU_METNI, RIZA_METNI_YOLU } from '@/lib/asistan/sesProfili/rizaMetni'

type Durum = 'hazir' | 'kaydediyor' | 'isleniyor' | 'kaydediliyor' | 'bitti'

const DUGME = {
  flex: 1, padding: '14px', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 600,
  backgroundColor: CHROME_RENK.pine, color: '#fff', cursor: 'pointer',
} as const

export default function SesProfiliKayit({ onBitti, onSimdiDegil, simdiDegilMetni = 'Şimdi değil', baslik = true }: {
  /** Profile saved (true) — or the engine could not run here and the doctor closed the step (false). */
  onBitti: (kaydedildi: boolean) => void
  onSimdiDegil: () => void
  simdiDegilMetni?: string
  baslik?: boolean
}) {
  const [riza, setRiza] = useState(false)
  const [sira, setSira] = useState(0)
  const [durum, setDurum] = useState<Durum>('hazir')
  const [sorun, setSorun] = useState<string | null>(null)
  const [hata, setHata] = useState<string | null>(null)
  const gommeler = useRef<Float32Array[]>([])
  const kayit = useRef<{ akis: MediaStream; baglam: AudioContext; parcalar: Float32Array[]; dugumler: AudioNode[]; zaman: ReturnType<typeof setTimeout> | null } | null>(null)
  const akisRef = useRef<MediaStream | null>(null)

  const birak = () => {
    const k = kayit.current
    kayit.current = null
    if (k) {
      if (k.zaman) clearTimeout(k.zaman)
      for (const d of k.dugumler) { try { d.disconnect() } catch { /* */ } }
      if (k.baglam.state !== 'closed') void k.baglam.close().catch(() => undefined)
      k.parcalar.length = 0
    }
  }
  const mikrofonuKapat = () => {
    for (const t of akisRef.current?.getTracks() || []) { try { t.stop() } catch { /* */ } }
    akisRef.current = null
  }
  useEffect(() => () => { birak(); mikrofonuKapat() }, [])

  // The model is fetched only after consent (nobody else pays the download).
  useEffect(() => {
    if (!riza) return
    sesProfiliMotoru().hazir().catch(() => setHata('Ses profili şu an bu cihazda oluşturulamıyor. Daha sonra Ayarlar bölümünden deneyebilirsiniz.'))
  }, [riza])

  async function baslat() {
    if (!riza || durum !== 'hazir') return
    setSorun(null)
    try {
      if (!akisRef.current) {
        akisRef.current = await navigator.mediaDevices.getUserMedia({
          // Same processing the voice session uses, so the profile matches what Ayşe hears.
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1, voiceIsolation: true } as MediaTrackConstraints,
        })
      }
      const Pencere = window as Window & { webkitAudioContext?: typeof AudioContext }
      const Kur = window.AudioContext || Pencere.webkitAudioContext
      const baglam = new Kur()
      if (baglam.state === 'suspended') await baglam.resume().catch(() => undefined)
      const kaynak = baglam.createMediaStreamSource(akisRef.current)
      const islem = baglam.createScriptProcessor(4096, 1, 1)
      const sessiz = baglam.createGain()
      sessiz.gain.value = 0
      const parcalar: Float32Array[] = []
      islem.onaudioprocess = (e) => { parcalar.push(new Float32Array(e.inputBuffer.getChannelData(0))) }
      kaynak.connect(islem)
      islem.connect(sessiz)
      sessiz.connect(baglam.destination)
      const zaman = setTimeout(() => { void bitir() }, KAYIT_KALITE.azamiMs)
      kayit.current = { akis: akisRef.current, baglam, parcalar, dugumler: [kaynak, islem, sessiz], zaman }
      setDurum('kaydediyor')
    } catch {
      setSorun('Mikrofona erişilemedi. Tarayıcı izinlerini kontrol edip tekrar deneyin.')
      setDurum('hazir')
    }
  }

  async function bitir() {
    const k = kayit.current
    if (!k) return
    const hz = k.baglam.sampleRate
    let n = 0
    for (const p of k.parcalar) n += p.length
    const pcm = new Float32Array(n)
    let o = 0
    for (const p of k.parcalar) { pcm.set(p, o); o += p.length }
    birak()
    setDurum('isleniyor')
    const pcm16 = yenidenOrnekle(pcm, hz)
    const kalite = kayitKalitesi(pcm16)
    if (!kalite.tamam) {
      setSorun(KAYIT_SORUN_METNI[kalite.sorun ?? 'kisa'])
      setDurum('hazir')
      return
    }
    try {
      const g = await sesProfiliMotoru().gomme(pcm16, GE2E_HZ)
      gommeler.current[sira] = g
    } catch {
      setHata('Ses profili şu an bu cihazda oluşturulamıyor. Daha sonra Ayarlar bölümünden deneyebilirsiniz.')
      setDurum('hazir')
      return
    }
    if (sira + 1 < KAYIT_CUMLELERI.length) {
      setSira(sira + 1)
      setDurum('hazir')
      return
    }
    mikrofonuKapat()
    setDurum('kaydediliyor')
    const jeton = await ensureDoctorAccessToken()
    const ok = jeton ? await sesProfiliKaydet(jeton, profilOrtalama(gommeler.current)) : false
    gommeler.current = []
    if (!ok) {
      setHata('Ses profili kaydedilemedi. Daha sonra Ayarlar bölümünden tekrar deneyebilirsiniz.')
      setDurum('hazir')
      return
    }
    setDurum('bitti')
    onBitti(true)
  }

  const kayitAcik = riza && !hata && (durum === 'hazir' || durum === 'kaydediyor')
  const ilerleme = `${Math.min(sira + 1, KAYIT_CUMLELERI.length)} / ${KAYIT_CUMLELERI.length}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontFamily: CHROME_FONT.sans, color: CHROME_RENK.ink }}>
      {baslik && <div style={{ fontSize: '24px', fontWeight: 600 }}>Ayşe sesinizi tanısın</div>}
      <div style={{ fontSize: '15px', lineHeight: 1.6 }}>
        <div>Ayşe konuşurken odadaki diğer sesleri (ağlayan bir çocuk, refakatçi, televizyon) sizin sesinizden ayırt eder.</div>
        <div>Böylece başka seslerin onu yarıda kesmesi azalır, sizin sesinizle durur. Dört kısa cümle okumanız yeterli (yaklaşık 30 saniye).</div>
        <div style={{ marginTop: '8px', color: CHROME_RENK.muted }}>Bu bir güvenlik kilidi değildir.</div>
      </div>

      <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '14px', lineHeight: 1.5, background: CHROME_RENK.paper, border: `1px solid ${CHROME_RENK.border}`, borderRadius: '10px', padding: '12px 14px' }}>
        <input type="checkbox" checked={riza} disabled={durum !== 'hazir' || sira > 0} onChange={(e) => setRiza(e.target.checked)} style={{ marginTop: '3px', width: '18px', height: '18px', flexShrink: 0 }} />
        <span>
          {RIZA_KUTUSU_METNI}{' '}
          <a href={RIZA_METNI_YOLU} target="_blank" rel="noopener noreferrer" style={{ color: CHROME_RENK.pine, textDecoration: 'underline' }}>{RIZA_BAGLANTI_METNI}</a>
        </span>
      </label>

      <div style={{ background: '#fff', border: `1px solid ${CHROME_RENK.border}`, borderRadius: '12px', padding: '18px', opacity: riza ? 1 : 0.55 }}>
        <div style={{ fontSize: '12px', color: CHROME_RENK.muted, marginBottom: '8px' }}>Cümle {ilerleme} — sesli okuyun</div>
        <div style={{ fontFamily: CHROME_FONT.serif, fontSize: '19px', lineHeight: 1.5 }}>{KAYIT_CUMLELERI[Math.min(sira, KAYIT_CUMLELERI.length - 1)]}</div>
        {durum === 'kaydediyor' && <div style={{ marginTop: '10px', fontSize: '13px', color: CHROME_RENK.warn }}>● Kaydediliyor — bitince “Bitirdim”e dokunun.</div>}
        {durum === 'isleniyor' && <div style={{ marginTop: '10px', fontSize: '13px', color: CHROME_RENK.muted }}>Kontrol ediliyor…</div>}
        {durum === 'kaydediliyor' && <div style={{ marginTop: '10px', fontSize: '13px', color: CHROME_RENK.muted }}>Ses profiliniz kaydediliyor…</div>}
        {sorun && <div style={{ marginTop: '10px', fontSize: '13px', color: CHROME_RENK.warn }}>{sorun}</div>}
      </div>
      {hata && <div style={{ fontSize: '14px', color: CHROME_RENK.warn }}>{hata}</div>}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="button" onClick={() => { birak(); mikrofonuKapat(); gommeler.current = []; onSimdiDegil() }} style={DUGME}>
          {simdiDegilMetni}
        </button>
        {hata ? (
          <button type="button" onClick={() => { birak(); mikrofonuKapat(); onBitti(false) }} style={DUGME}>Devam et</button>
        ) : (
          <button
            type="button"
            disabled={!kayitAcik}
            onClick={() => { if (durum === 'kaydediyor') void bitir(); else void baslat() }}
            style={{ ...DUGME, backgroundColor: kayitAcik ? CHROME_RENK.pine : 'rgba(47,67,52,0.35)', cursor: kayitAcik ? 'pointer' : 'not-allowed' }}
          >
            {durum === 'kaydediyor' ? 'Bitirdim' : sorun ? 'Tekrar kaydet' : 'Kaydı başlat'}
          </button>
        )}
      </div>
    </div>
  )
}
