'use client'

/**
 * NOTYA-YENI-GORUNUM-01 — "Notya fısıldıyor": the doctor's single most overdue item, surfaced
 * on Ana Sayfa. Real data, not a notification table — it reads the SAME pediatri kohort flag
 * engine that already powers Araçlar › Pediatri kohort (aşı gecikmesi, kaçan izlem, persentil
 * kayması, D vit/demir, tarama gecikmesi), already sorted oldest-overdue-first.
 *
 * "Clear by resolving, not dismissing" comes for free from that engine: a flag is computed
 * fresh from the patient's actual record every time this loads. Once the doctor updates the
 * thing itself (logs the vaccine, adds the missing visit, etc.), the flag simply stops being
 * true next render — there is no separate dismiss state to get out of sync.
 *
 * Pediatri-only for now, same incremental pattern as YeniBebekIsleri / BekleyenKonsultasyonOzeti:
 * narrow, correct, and the obvious shape to extend per-specialty later (every specialty built
 * tonight has its own <brans>_gorevleri table with the same due/status shape).
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { PEDI_BAYRAK_AD, type PediKohortSatir } from '@/specialties/pediatri/engines/kohort'
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme'

const LEAF = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M8 19c1.6-5.8 3.4-9.6 7.2-14.2.8 3.4.8 6.4-.2 9.2-1.5 2.4-4 4-7 5z" stroke="currentColor" strokeWidth="1.3" />
  </svg>
)

export default function NotyaFisildiyor({ specialty }: { specialty: string }) {
  const router = useRouter()
  const [satir, setSatir] = useState<PediKohortSatir | null>(null)
  const [toplam, setToplam] = useState(0)
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    if (specialty !== 'pediatri') { setYukleniyor(false); return } // other branş: not built yet -- different from "checked, nothing found"
    let iptal = false
    ;(async () => {
      try {
        const t = await ensureDoctorAccessToken()
        if (!t) { if (!iptal) setYukleniyor(false); return }
        const r = await fetch('/api/doktor/pediatri/kohort', { headers: { Authorization: `Bearer ${t}` } })
        if (!r.ok) { if (!iptal) setYukleniyor(false); return }
        const j = await r.json()
        const satirlar = (j.satirlar || []) as PediKohortSatir[]
        if (!iptal) {
          if (satirlar.length) { setSatir(satirlar[0]); setToplam(satirlar.length) }
          setYukleniyor(false)
        }
      } catch { if (!iptal) setYukleniyor(false) /* fısıltı kritik değil — sessizce boş kalır */ }
    })()
    return () => { iptal = true }
  }, [specialty])

  // Pediatri dışı branşlarda motor henüz yok -- kart hiç görünmez (bu, "kontrol edildi, boşçıktı"dan farklı).
  if (specialty !== 'pediatri') return null
  // Bir anı kontrol sürerken boş durumun yanıp sönmesini önler.
  if (yukleniyor) return null

  const S = (s: Record<string, unknown>) => s as React.CSSProperties

  if (!satir) {
    // Gerçekten kontrol edildi, bekleyen yok -- kart kaybolmaz, durumu dürüstçe söyler.
    return (
      <div
        style={S({
          background: CHROME_RENK.paper, border: `1px solid ${CHROME_RENK.border}`, borderRadius: 20,
          padding: '20px 22px 18px', boxShadow: '0 16px 34px rgba(58,44,34,0.06)',
        })}
      >
        <div style={S({ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', color: CHROME_RENK.pine, fontSize: 16, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 })}>
          {LEAF} Notya fısıldıyor
        </div>
        <div style={S({ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 18, lineHeight: 1.3, color: CHROME_RENK.ink })}>
          Şu an bekleyen bir şey yok — her şey güncel.
        </div>
      </div>
    )
  }

  const baslikBayrak = PEDI_BAYRAK_AD[satir.bayraklar[0]]
  const detaySatiri = satir.detay[0] || ''

  return (
    <button
      type="button"
      onClick={() => router.push(`/dashboard/doktor/hastalar/${satir.patientId}?tab=${satir.sekme}`)}
      style={S({
        display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer', border: 'none',
        background: `linear-gradient(165deg, ${CHROME_RENK.pine}, ${CHROME_RENK.nav})`,
        color: '#f4ead7', borderRadius: 20, padding: '20px 22px 18px', position: 'relative', overflow: 'hidden',
        boxShadow: '0 16px 36px rgba(42,59,46,0.2)',
      })}
    >
      <div style={S({ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', color: CHROME_RENK.gold, fontSize: 16, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 })}>
        {LEAF} Notya fısıldıyor
      </div>
      <div style={S({ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 21, lineHeight: 1.3, fontWeight: 500 })}>
        {satir.ad} — {baslikBayrak.toLowerCase()}
      </div>
      {detaySatiri && (
        <div style={S({ marginTop: 8, fontSize: 13, opacity: 0.85, lineHeight: 1.5 })}>{detaySatiri}</div>
      )}
      {toplam > 1 && (
        <div style={S({ marginTop: 10, fontSize: 12, opacity: 0.65 })}>+{toplam - 1} çocukta daha bekleyen kontrol var</div>
      )}
    </button>
  )
}
