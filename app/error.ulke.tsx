'use client'

/** NOTYA-ULKE-01 — error page of a country that is not the pre-split application; text from its pack. */
import React from 'react'
import { UlkeHata } from '@/components/ulke/UlkeSistemSayfasi'

export default function UlkeHataSayfasi({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <UlkeHata tekrar={reset} />
}
