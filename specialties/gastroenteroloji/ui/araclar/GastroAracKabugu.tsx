'use client'
/**
 * GASTROENTEROLOJI-EXCEPTIONAL-01 — Araçlar › Gastroenteroloji stüdyoları ortak kabuğu.
 * Yalnız gastroenteroloji hekimi açar; başka branş (dahiliye dahil) /doktor-tools'a döner.
 */
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CHROME_FONT } from '@/lib/doktor/chromeTheme';
import { toolsShell } from '@/lib/doktor/toolsUi'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { doktorAraciBransaUygun } from '@/lib/doktor/doktorAraclari'
import { AracVurguSaglayici, aracStil, HastaSecici, type AracVurgu } from '@/lib/doktor/aracUi'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme'

export const GASTRO_VURGU: AracVurgu = { ana: '#F43F5E', anaMetin: '#FFF1F2', yumusak: '#FDA4AF', baslik: '#FB7185' }
export const gastroStil = aracStil(GASTRO_VURGU)

export {
  Alan, Etiketli, Secim, Segment, Onay, Kutu, Sayi, Katlanir, TaslakNotu, Rozet, OneriRozet,
  Istatistik, KopyalaButonu, MuayeneFormunaEkle, panoyaKopyala, useUrlHasta, useHastaVerisi,
} from '@/lib/doktor/aracUi'

export function GastroHastaSecici({ secili, sec }: { secili: string; sec: (id: string, ad: string) => void }) {
  return <HastaSecici secili={secili} sec={sec} />
}

export default function GastroAracKabugu({ route, baslik, aciklama, children }: { route: string; baslik: string; aciklama: string; children: React.ReactNode }) {
  const router = useRouter()
  const [izin, setIzin] = useState<boolean | null>(null)
  useEffect(() => {
    let iptal = false
    ;(async () => {
      try {
        const t = await ensureDoctorAccessToken()
        if (!t) { if (!iptal) { setIzin(false); router.replace('/doktor-tools') } return }
        const r = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${t}` } })
        const j = r.ok ? await r.json() : null
        const ok = doktorAraciBransaUygun(route, j?.data?.specialty)
        if (!iptal) { setIzin(ok); if (!ok) router.replace('/doktor-tools') }
      } catch { if (!iptal) { setIzin(false); router.replace('/doktor-tools') } }
    })()
    return () => { iptal = true }
  }, [router, route])

  return (
    <AracVurguSaglayici vurgu={GASTRO_VURGU}>
      <div style={{ ...toolsShell, overflowX: 'hidden' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px 56px', boxSizing: 'border-box' }}>
          {!izin ? (
            <div style={{ color: CHROME_RENK.muted, fontSize: 15, padding: '12px 0' }}>{izin === null ? 'Yükleniyor…' : 'Bu araç yalnızca gastroenteroloji için.'}</div>
          ) : (
            <>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4 }}>Araçlar · Gastroenteroloji</div>
                <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 30, color: '#2e251d', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{baslik}</h1>
                <p style={{ margin: '8px 0 0', fontSize: 15, color: CHROME_RENK.muted, lineHeight: 1.5, maxWidth: 680 }}>{aciklama}</p>
              </div>
              {children}
            </>
          )}
        </div>
      </div>
    </AracVurguSaglayici>
  )
}
