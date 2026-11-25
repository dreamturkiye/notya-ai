'use client'

/**
 * TR-PROTOKOL-KUTUPHANESI — source chips next to an Ayşe answer / a note suggestion. The chips come from the TEXT the doctor
 * sees (lib/kaynaklar/protokolKutuphanesi/cip.ts): only documents the text names, only editions the registry confirms. The
 * registry is loaded with a dynamic import on first use — never part of a page's first-load JS (performans bütçesi).
 */
import React, { useEffect, useState } from 'react'
import type { KaynakCipi } from '@/lib/kaynaklar/protokolKutuphanesi/cip'
import { KaynakCipListesi } from './KaynakCipiGorunumu'

let modul: Promise<typeof import('@/lib/kaynaklar/protokolKutuphanesi/cip')> | null = null
const yukle = () => (modul ||= import('@/lib/kaynaklar/protokolKutuphanesi/cip'))

export default function KaynakCipleri({ metin }: { metin: string | null | undefined }) {
  const [cipler, setCipler] = useState<KaynakCipi[]>([])
  useEffect(() => {
    let iptal = false
    const t = String(metin || '')
    // Cheap pre-check: every citation name contains one of these words; most answers never load the chunk.
    if (!/protokol|rehber|kılavuz|kilavuz|uzlaşı|program|tebliğ|tüber|sut\b|yönetmelik|psoriasis/i.test(t)) { setCipler([]); return }
    void yukle().then((m) => { if (!iptal) setCipler(m.kaynakCipleri(t)) }).catch(() => {})
    return () => { iptal = true }
  }, [metin])
  return <KaynakCipListesi cipler={cipler} />
}
