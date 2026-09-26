'use client'
/**
 * NOTYA-GELEN-BELGELER — drop a file anywhere on the doctor dashboard, or paste one (Cmd/Ctrl+V): a calm full-screen
 * "Bırakın, Notya dosyalasın" while dragging, then a small note at the bottom while Notya reads it.
 *
 * Mounted once by DoktorChrome, only for someone who may use the inbox (doctor; secretary with the switch on).
 * Existing drop zones and paste targets keep working: the overlay does not take pointer events, and a drop / paste
 * that a page already handled (event.defaultPrevented) is left alone. Pasting while typing in a field is never
 * captured. Pasted plain text (e.g. a lab table copied from an email body) becomes a text document.
 */
import React, { useEffect, useRef, useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { dosyaGonder, metinGonder, GelenHatasi } from '@/lib/gelenBelgeler/istemci'
import { yapistirmaMetniUygunMu } from '@/lib/gelenBelgeler/bicim'
import type { GelenKaynak } from '@/lib/gelenBelgeler/tipler'

const R = CHROME_RENK
const GELEN_YOL = '/dashboard/doktor/gelen-belgeler'

type Not = { tur: 'okuyor' | 'tamam' | 'hata'; metin: string }

function yaziyorMu(): boolean {
  const el = document.activeElement as HTMLElement | null
  if (!el) return false
  const t = el.tagName
  return t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || el.isContentEditable
}

export default function GelenBelgeBirak() {
  const [surukleniyor, setSurukleniyor] = useState(false)
  const [not, setNot] = useState<Not | null>(null)
  const derinlik = useRef(0)
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null)

  const goster = (n: Not, sure?: number) => {
    setNot(n)
    if (zamanlayici.current) clearTimeout(zamanlayici.current)
    if (sure) zamanlayici.current = setTimeout(() => setNot(null), sure)
  }

  useEffect(() => {
    const dosyaMi = (e: DragEvent) => Array.from(e.dataTransfer?.types || []).includes('Files')

    const gonder = async (is: () => Promise<{ durum: string; dosyalandi?: boolean }>[], adet: number) => {
      goster({ tur: 'okuyor', metin: adet > 1 ? `Notya ${adet} belgeyi okuyor…` : 'Notya okuyor…' })
      const sonuclar = await Promise.allSettled(is())
      const hata = sonuclar.find((s) => s.status === 'rejected') as PromiseRejectedResult | undefined
      const eklenen = sonuclar.filter((s) => s.status === 'fulfilled' && s.value.durum === 'eklendi').length
      const onceden = sonuclar.filter((s) => s.status === 'fulfilled' && s.value.durum === 'zaten_var').length
      if (hata && !eklenen) {
        goster({ tur: 'hata', metin: hata.reason instanceof GelenHatasi ? hata.reason.message : 'Belge eklenemedi. Lütfen yeniden deneyin.' }, 6000)
        return
      }
      if (!eklenen && onceden) { goster({ tur: 'tamam', metin: 'Bu belge zaten Gelen Belgeler’de.' }, 5000); return }
      goster({ tur: 'tamam', metin: eklenen > 1 ? `${eklenen} belge Gelen Belgeler’e eklendi` : 'Gelen Belgeler’e eklendi' }, 6000)
    }

    const dosyalar = (liste: FileList | File[], kaynak: GelenKaynak) => {
      const d = Array.from(liste).slice(0, 10)
      if (d.length) void gonder(() => d.map((f) => dosyaGonder(f, kaynak)), d.length)
    }

    const girdi = (e: DragEvent) => {
      if (!dosyaMi(e)) return
      derinlik.current++
      setSurukleniyor(true)
    }
    const uzerinde = (e: DragEvent) => {
      if (!dosyaMi(e)) return
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    }
    const cikti = (e: DragEvent) => {
      if (!dosyaMi(e)) return
      derinlik.current = Math.max(0, derinlik.current - 1)
      if (derinlik.current === 0) setSurukleniyor(false)
    }
    const birakildi = (e: DragEvent) => {
      derinlik.current = 0
      setSurukleniyor(false)
      if (!dosyaMi(e)) return
      if (e.defaultPrevented) return // a page's own drop zone took it
      e.preventDefault()
      if (e.dataTransfer?.files?.length) dosyalar(e.dataTransfer.files, 'surukle')
    }
    const yapistirildi = (e: ClipboardEvent) => {
      if (e.defaultPrevented || yaziyorMu()) return
      const cb = e.clipboardData
      if (!cb) return
      const f = Array.from(cb.files || [])
      if (f.length) { e.preventDefault(); dosyalar(f, 'yapistir'); return }
      const metin = cb.getData('text/plain')
      if (yapistirmaMetniUygunMu(metin)) {
        e.preventDefault()
        void gonder(() => [metinGonder(metin)], 1)
      }
    }

    window.addEventListener('dragenter', girdi)
    window.addEventListener('dragover', uzerinde)
    window.addEventListener('dragleave', cikti)
    window.addEventListener('drop', birakildi)
    window.addEventListener('paste', yapistirildi)
    return () => {
      window.removeEventListener('dragenter', girdi)
      window.removeEventListener('dragover', uzerinde)
      window.removeEventListener('dragleave', cikti)
      window.removeEventListener('drop', birakildi)
      window.removeEventListener('paste', yapistirildi)
      if (zamanlayici.current) clearTimeout(zamanlayici.current)
    }
  }, [])

  const buSayfa = typeof window !== 'undefined' && window.location.pathname.startsWith(GELEN_YOL)

  return (
    <>
      {surukleniyor && (
        <div
          aria-hidden
          style={{
            position: 'fixed', inset: 0, zIndex: 9000, pointerEvents: 'none',
            background: 'rgba(244,238,227,0.9)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: CHROME_FONT.sans,
          }}
        >
          <div style={{ border: `2px dashed ${R.pine}55`, borderRadius: 28, padding: '48px 56px', textAlign: 'center', background: R.paper, maxWidth: 'calc(100% - 48px)' }}>
            <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 30, color: R.ink, letterSpacing: '-0.02em' }}>Bırakın, Notya dosyalasın</div>
            <div style={{ fontSize: 14, color: R.muted, marginTop: 8 }}>Tahlil, fotoğraf, rapor ya da ses kaydı</div>
          </div>
        </div>
      )}
      {not && (
        <div
          role="status"
          className="notya-alt-yuzer"
          style={{
            position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 9001,
            background: not.tur === 'hata' ? R.warn : R.pine, color: '#FAF8F4', borderRadius: 999,
            padding: '12px 20px', fontFamily: CHROME_FONT.sans, fontSize: 14, fontWeight: 600,
            boxShadow: '0 12px 28px rgba(58,44,34,0.18)', display: 'flex', alignItems: 'center', gap: 14, maxWidth: 'calc(100% - 32px)',
          }}
        >
          <span>{not.metin}</span>
          {not.tur === 'tamam' && !buSayfa && (
            <a href={GELEN_YOL} style={{ color: R.gold, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>Aç ›</a>
          )}
        </div>
      )}
    </>
  )
}
