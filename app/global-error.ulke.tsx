'use client'

/**
 * NOTYA-ULKE-01 — last-resort error page of a country that is not the pre-split application. It draws its own
 * document (the root layout itself failed), in the country's language, with text from its pack.
 */
import React from 'react'
import { UlkeHata } from '@/components/ulke/UlkeSistemSayfasi'
import { ulkePaketi } from '@/lib/ulke/ulke'

export default function UlkeGenelHata({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const p = ulkePaketi()
  return (
    <html lang={p.varsayilanDil}>
      <body style={{ margin: 0, background: p.kabuk.zemin }}>
        <UlkeHata tekrar={reset} />
      </body>
    </html>
  )
}
