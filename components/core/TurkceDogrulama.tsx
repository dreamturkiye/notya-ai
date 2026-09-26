'use client'

import { useEffect } from 'react'
import { dogrulamaMesaji } from '@/lib/turkce/dogrulamaMesaji'

/**
 * KURAL — TÜRKÇE: tarayıcının HTML5 doğrulama balonları ("Please fill out this field", "Please include an '@'")
 * her formda Türkçe olsun. Kök düzende bir kez bağlanır; `invalid` olayında Türkçe mesaj yazar, alan
 * değişince temizler. Bileşenin kendi setCustomValidity mesajına dokunmaz. Mesajlar: lib/turkce/dogrulamaMesaji.ts
 */
export default function TurkceDogrulama() {
  useEffect(() => {
    const bizim = new WeakSet<Element>()
    const gecersiz = (e: Event) => {
      const el = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      if (!el || typeof el.setCustomValidity !== 'function') return
      if (el.validity.customError && !bizim.has(el)) return
      const mesaj = dogrulamaMesaji(el)
      if (!mesaj) return
      el.setCustomValidity(mesaj)
      bizim.add(el)
    }
    const degisti = (e: Event) => {
      const el = e.target as HTMLInputElement
      if (!el || !bizim.has(el)) return
      el.setCustomValidity('')
      bizim.delete(el)
    }
    document.addEventListener('invalid', gecersiz, true)
    document.addEventListener('input', degisti, true)
    document.addEventListener('change', degisti, true)
    return () => {
      document.removeEventListener('invalid', gecersiz, true)
      document.removeEventListener('input', degisti, true)
      document.removeEventListener('change', degisti, true)
    }
  }, [])
  return null
}
