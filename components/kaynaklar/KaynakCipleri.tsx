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

/** `belgeIdleri`: the documents Ayşe reported using (hidden "k" field, mapped on the server) — chipped even when the text names none. */
export default function KaynakCipleri({ metin, belgeIdleri }: { metin: string | null | undefined; belgeIdleri?: string[] }) {
  const [cipler, setCipler] = useState<KaynakCipi[]>([])
  const idAnahtari = (belgeIdleri || []).join(',')
  useEffect(() => {
    let iptal = false
    const t = String(metin || '')
    if (idAnahtari) {
      void yukle().then((m) => {
        if (iptal) return
        const adlanan = m.kaynakCipleri(t)
        const bildirilen = m.idCipleri(idAnahtari.split(','), t)
        setCipler([...bildirilen, ...adlanan.filter((c) => !bildirilen.some((b) => b.belgeId === c.belgeId))].slice(0, m.CIP_SINIRI))
      }).catch(() => {})
      return () => { iptal = true }
    }
    // Cheap pre-check: every citation name contains one of these words; most answers never load the chunk.
    if (!/protokol|rehber|kılavuz|kilavuz|uzlaşı|program|tebliğ|tüber|sut\b|yönetmelik|psoriasis/i.test(t)) { setCipler([]); return }
    void yukle().then((m) => { if (!iptal) setCipler(m.kaynakCipleri(t)) }).catch(() => {})
    return () => { iptal = true }
  }, [metin, idAnahtari])
  return <KaynakCipListesi cipler={cipler} />
}
