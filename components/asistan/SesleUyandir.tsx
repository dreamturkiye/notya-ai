'use client'

import { useEffect, useRef, useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { asistaniAcMi } from '@/lib/asistan/uyandirSoz'
import { useAsistanOturum } from '@/components/asistan/AsistanOturumContext'

const ANAHTAR = 'notya_sesle_uyandir'

type Kulak = 'kapali' | 'davet' | 'dinliyor'

type Tanima = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((ev: Event) => void) | null
  onend: (() => void) | null
  onerror: ((ev: Event) => void) | null
  start: () => void
  abort: () => void
}

function tanimaKur(): Tanima | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: new () => Tanima
    webkitSpeechRecognition?: new () => Tanima
  }
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
  if (!Ctor) return null
  const t = new Ctor()
  t.lang = 'tr-TR'
  t.continuous = true
  t.interimResults = true
  try { (t as Tanima & { processLocally?: boolean }).processLocally = true } catch { /* tarayıcı yok sayar */ }
  return t
}

function pencereOnde(): boolean {
  return document.visibilityState === 'visible' && document.hasFocus()
}

function tercihAcik(): boolean {
  try { return localStorage.getItem(ANAHTAR) === 'acik' } catch { return false }
}

/**
 * Doktor sayfalarında ince kulak. Pencere öndeyken "Asistanı aç" der ve bugünkü
 * sesli görüşmeyi başlatır (oturum sayfalar arasında yaşar). Görüşme sürerken
 * mikrofon ondadır; "Asistanı kapat" sözünü görüşme duyar. Sekreterde ve
 * pencere arkadayken susar.
 */
export default function SesleUyandir({ doktor, gizli }: { doktor: boolean; gizli?: boolean }) {
  const { startConversation, isActive } = useAsistanOturum()
  const startRef = useRef(startConversation)
  startRef.current = startConversation
  const [kulak, setKulak] = useState<Kulak>('davet')
  const [motorYok, setMotorYok] = useState(false)
  const tanimaRef = useRef<Tanima | null>(null)
  const istenenRef = useRef<'dinle' | 'sus'>('sus')
  const calisiyorRef = useRef(false)
  const aktifRef = useRef(isActive)
  aktifRef.current = isActive

  function birak() {
    istenenRef.current = 'sus'
    calisiyorRef.current = false
    try { tanimaRef.current?.abort() } catch { /* susmuş olabilir */ }
  }

  function kulagiAc() {
    if (!doktor || motorYok || aktifRef.current || !pencereOnde()) {
      if (!aktifRef.current) setKulak('davet')
      return
    }
    const t = tanimaRef.current
    if (!t) {
      setMotorYok(true)
      setKulak('davet')
      return
    }
    istenenRef.current = 'dinle'
    if (calisiyorRef.current) {
      setKulak('dinliyor')
      return
    }
    try {
      t.start()
      calisiyorRef.current = true
      setKulak('dinliyor')
      try { localStorage.setItem(ANAHTAR, 'acik') } catch { /* yine dinler */ }
    } catch {
      calisiyorRef.current = false
      setKulak('davet')
    }
  }

  useEffect(() => {
    try {
      if (localStorage.getItem(ANAHTAR) === 'kapali') setKulak('kapali')
    } catch { /* davet kalır */ }
  }, [])

  useEffect(() => {
    if (isActive) birak()
  }, [isActive])

  useEffect(() => {
    if (!doktor) return
    const t = tanimaKur()
    if (!t) {
      setMotorYok(true)
      return
    }
    tanimaRef.current = t

    t.onresult = (ev) => {
      const sonuc = ev as Event & { results: ArrayLike<ArrayLike<{ transcript: string }>> }
      const parca: string[] = []
      for (let i = 0; i < sonuc.results.length; i++) parca.push(sonuc.results[i][0]?.transcript || '')
      if (!asistaniAcMi(parca.join(' ')) || aktifRef.current) return
      birak()
      window.setTimeout(() => { void startRef.current() }, 300)
    }
    t.onerror = (ev) => {
      const kod = String((ev as Event & { error?: string }).error || '')
      calisiyorRef.current = false
      if (kod === 'aborted' || kod === 'no-speech') return
      istenenRef.current = 'sus'
      setKulak('davet')
    }
    t.onend = () => {
      calisiyorRef.current = false
      if (istenenRef.current !== 'dinle' || aktifRef.current || !pencereOnde()) return
      window.setTimeout(() => {
        if (istenenRef.current !== 'dinle' || aktifRef.current || !pencereOnde() || calisiyorRef.current) return
        try {
          t.start()
          calisiyorRef.current = true
          setKulak('dinliyor')
        } catch {
          setKulak('davet')
        }
      }, 250)
    }

    if (tercihAcik() && pencereOnde() && !aktifRef.current) {
      istenenRef.current = 'dinle'
      try {
        t.start()
        calisiyorRef.current = true
        setKulak('dinliyor')
      } catch { /* dokunuş bekler */ }
    }

    const odak = () => {
      if (!tercihAcik() || aktifRef.current || !pencereOnde() || calisiyorRef.current) return
      istenenRef.current = 'dinle'
      try {
        t.start()
        calisiyorRef.current = true
        setKulak('dinliyor')
      } catch {
        setKulak('davet')
      }
    }
    const kac = () => birak()
    const gorunur = () => {
      if (document.visibilityState === 'visible') odak()
      else kac()
    }
    window.addEventListener('focus', odak)
    window.addEventListener('blur', kac)
    document.addEventListener('visibilitychange', gorunur)

    return () => {
      birak()
      window.removeEventListener('focus', odak)
      window.removeEventListener('blur', kac)
      document.removeEventListener('visibilitychange', gorunur)
      tanimaRef.current = null
    }
  }, [doktor])

  useEffect(() => {
    if (isActive || !tercihAcik() || !pencereOnde() || calisiyorRef.current) return
    const t = tanimaRef.current
    if (!t) return
    istenenRef.current = 'dinle'
    try {
      t.start()
      calisiyorRef.current = true
      setKulak('dinliyor')
    } catch { /* davet kalır */ }
  }, [isActive])

  if (!doktor) return null

  function kapat() {
    birak()
    setKulak('kapali')
    try { localStorage.setItem(ANAHTAR, 'kapali') } catch { /* bu oturum susar */ }
  }

  const yazi = isActive
    ? 'Asistanı kapat deyin'
    : kulak === 'dinliyor'
      ? 'Asistanı aç deyin'
      : kulak === 'kapali'
        ? 'Sesle uyandır'
        : motorYok
          ? 'Bu tarayıcı sesle uyandıramıyor'
          : 'Asistanı aç için dokunun'

  return (
    <>
      <style>{`
        .notya-uyandir {
          position: fixed;
          left: 264px;
          bottom: 16px;
          z-index: 30;
          display: flex;
          align-items: center;
          gap: 8px;
          max-width: calc(100vw - 288px);
        }
        @media (max-width: 899px) {
          .notya-uyandir {
            left: 12px;
            bottom: calc(72px + env(safe-area-inset-bottom, 0px));
            max-width: calc(100vw - 24px);
          }
          .notya-uyandir.gizli { bottom: calc(16px + env(safe-area-inset-bottom, 0px)); }
        }
        @media print { .notya-uyandir { display: none !important; } }
      `}</style>
      <div className={gizli ? 'notya-uyandir gizli' : 'notya-uyandir'}>
        <button
          type="button"
          onClick={() => { if (!isActive && kulak !== 'dinliyor') kulagiAc() }}
          style={{
            border: `1px solid ${CHROME_RENK.border}`,
            background: CHROME_RENK.paper,
            color: CHROME_RENK.ink,
            borderRadius: 999,
            padding: '8px 14px',
            minHeight: 40,
            fontFamily: CHROME_FONT.sans,
            fontSize: 13,
            fontWeight: 700,
            cursor: kulak === 'dinliyor' || isActive ? 'default' : 'pointer',
          }}
        >
          {yazi}
        </button>
        {kulak !== 'kapali' && !motorYok && !isActive && (
          <button
            type="button"
            onClick={kapat}
            aria-label="Sesle uyandırmayı kapat"
            style={{
              border: 'none',
              background: 'transparent',
              color: CHROME_RENK.muted,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              minHeight: 40,
              fontFamily: CHROME_FONT.sans,
            }}
          >
            Kapat
          </button>
        )}
      </div>
    </>
  )
}
