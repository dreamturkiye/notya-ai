"use client"
export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AsistanSayfaTR } from "@/components/asistan/AsistanSayfaTR"
import { CHROME_RENK } from '@/lib/doktor/chromeTheme'
import DoktorChrome, { useChromeKompakt } from '@/components/doktor/DoktorChrome'
import { pwaIkonundanAsistanMi } from '@/lib/pwa/ikonAcilis'
import { useAsistanOturum } from '@/components/asistan/AsistanOturumContext'

// NOTYA-CHROME-KOMPAKT-01 (Kaan, 2026-09-24): useContext reads from the nearest ANCESTOR
// provider -- calling useChromeKompakt at the top of the same component that RETURNS
// <DoktorChrome> doesn't work, because at the point the hook runs, this component hasn't
// rendered its own JSX yet, so there is no provider above it yet (DoktorChrome is a CHILD in the
// tree this component produces, not an ancestor of it). Split into a thin outer wrapper that owns
// the <DoktorChrome> boundary, and an inner component -- a genuine descendant -- that calls the
// hook and holds every bit of this page's existing logic unchanged.
export default function AsistanPage() {
  return <AsistanAcilis />
}

/** Do not paint Asistan chrome until we know this is not an old PWA icon cold-open. */
function AsistanAcilis() {
  const router = useRouter()
  const [ac, setAc] = useState(false)
  useEffect(() => {
    if (pwaIkonundanAsistanMi()) {
      router.replace('/dashboard/doktor')
      return
    }
    setAc(true)
  }, [router])
  if (!ac) {
    return <div style={{ minHeight: '100dvh', background: CHROME_RENK.cream }} aria-hidden />
  }
  return (
    <DoktorChrome>
      <AsistanPageInner />
    </DoktorChrome>
  )
}

function AsistanPageInner() {
  // NOTYA-CHROME-KOMPAKT-01 (Kaan, 2026-09-24): "solda full menu ve logo olsun" — sidebar+logo
  // now come from DoktorChrome, wrapped around this component one level up (AsistanPage above).
  // This hook keeps the sidebar while telling DoktorChrome to skip its own header/footer/max-width
  // wrapper, so this page's own full-height persona/conversation/control-bar layout keeps working.
  useChromeKompakt(true)
  const router = useRouter()
  // NOTYA-ASISTAN-YUZEN-01 (Kaan, 2026-09-26): the session (voice, messages, persona, tek beyin poll, tools, written
  // chat) lives in AsistanOturumContext, which wraps every page in app/layout.tsx. This page is only a view: it opens
  // no session of its own and does not close it on leave. While the doctor is on another page AsistanYuzenPanel takes over.
  // AU-DEPTH-PARITY-03: the view itself (layout, bubbles, microphone, written chat) is the shared AsistanSayfaGorunumu,
  // wired to this session with Türkiye's words in AsistanSayfaTR — every country's /asistan page renders through the same view.
  const o = useAsistanOturum()
  const { hazirla } = o

  // Opening colleague: branch doctors (KD → Fatma) ignore stale localStorage Ayşe (AsistanOturumContext.hazirla).
  useEffect(() => {
    ;(async () => {
      const sonuc = await hazirla()
      if (sonuc === "giris") router.replace("/giris/doktor")
      else if (sonuc === "onboarding") router.replace("/onboarding?p=doktor")
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <AsistanSayfaTR o={o} />
}
