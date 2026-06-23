export interface BordroInput {
  brutMaas: number
  calisanSayisi?: number
  engellilikDerecesi?: 1 | 2 | 3 | null
  cocukSayisi?: number
  evliMi?: boolean
  kidemYili?: number
}

export interface BordroResult {
  brutMaas: number
  sgkIsciBrut: number
  sgkIsveren: number
  issizlikIsci: number
  issizlikIsveren: number
  gelirVergisi: number
  damgaVergisi: number
  netMaas: number
  isverenToplamMaliyet: number
  kidemTazminatiTavan: number
  yıllıkKidemHakki: number
  aciklama: string[]
}

const ASGARI_UCRET = 33030
const SGK_ISCI_ORAN = 0.14
const SGK_ISVEREN_ORAN = 0.175
const ISSIZLIK_ISCI_ORAN = 0.01
const ISSIZLIK_ISVEREN_ORAN = 0.02
const SGK_TAVAN = 247725
const SGK_TABAN = 33030
const KIDEM_TAZMINATI_TAVAN = 64948.77
const DAMGA_VERGISI_ORAN = 0.00759

const GELIR_VERGISI_DILIMLERI = [
  { ust: 70000, oran: 0.15 },
  { ust: 150000, oran: 0.20 },
  { ust: 370000, oran: 0.27 },
  { ust: 1900000, oran: 0.35 },
  { ust: Infinity, oran: 0.40 },
]

const ENGELLILIK_INDIRIMLERI: Record<1 | 2 | 3, number> = {
  1: 6900,
  2: 4000,
  3: 3000,
}

function hesaplaGelirVergisi(matrah: number): number {
  let vergi = 0
  let oncekiUst = 0
  for (const dilim of GELIR_VERGISI_DILIMLERI) {
    const dilimMatrah = Math.min(matrah, dilim.ust) - oncekiUst
    if (dilimMatrah > 0) {
      vergi += dilimMatrah * dilim.oran
    }
    oncekiUst = dilim.ust
    if (matrah <= dilim.ust) break
  }
  return vergi
}

export function hesaplaBordro(input: BordroInput): BordroResult {
  const brut = Math.max(input.brutMaas, SGK_TABAN)
  const sgkTabanBrut = Math.min(brut, SGK_TAVAN)

  const sgkIsci = sgkTabanBrut * SGK_ISCI_ORAN
  const sgkIsveren = sgkTabanBrut * SGK_ISVEREN_ORAN
  const issizlikIsci = sgkTabanBrut * ISSIZLIK_ISCI_ORAN
  const issizlikIsveren = sgkTabanBrut * ISSIZLIK_ISVEREN_ORAN

  let engellilikIndirimi = 0
  if (input.engellilikDerecesi && ENGELLILIK_INDIRIMLERI[input.engellilikDerecesi]) {
    engellilikIndirimi = ENGELLILIK_INDIRIMLERI[input.engellilikDerecesi]
  }

  const gvMatrah = Math.max(0, brut - sgkIsci - issizlikIsci - engellilikIndirimi)
  const gelirVergisi = hesaplaGelirVergisi(gvMatrah)

  const damgaVergisi = brut * DAMGA_VERGISI_ORAN
  const netMaas = brut - sgkIsci - issizlikIsci - gelirVergisi - damgaVergisi
  const isverenToplamMaliyet = brut + sgkIsveren + issizlikIsveren

  const kidemYili = input.kidemYili ?? 0
  const yıllıkKidemHakki = kidemYili * Math.min(brut, KIDEM_TAZMINATI_TAVAN)

  const aciklama: string[] = [
    `Brüt maaş: ${brut.toLocaleString('tr-TR')} TL`,
    `SGK işçi payı (%14): ${sgkIsci.toLocaleString('tr-TR')} TL`,
    `SGK işveren payı (%17.5): ${sgkIsveren.toLocaleString('tr-TR')} TL`,
    `İşsizlik işçi payı (%1): ${issizlikIsci.toLocaleString('tr-TR')} TL`,
    `İşsizlik işveren payı (%2): ${issizlikIsveren.toLocaleString('tr-TR')} TL`,
    `Gelir vergisi: ${gelirVergisi.toLocaleString('tr-TR')} TL`,
    `Damga vergisi (%0.759): ${damgaVergisi.toLocaleString('tr-TR')} TL`,
    `Net maaş: ${netMaas.toLocaleString('tr-TR')} TL`,
  ]

  if (engellilikIndirimi > 0) {
    aciklama.push(`Engellilik indirimi: ${engellilikIndirimi.toLocaleString('tr-TR')} TL`)
  }

  return {
    brutMaas: brut,
    sgkIsciBrut: sgkIsci,
    sgkIsveren,
    issizlikIsci,
    issizlikIsveren,
    gelirVergisi,
    damgaVergisi,
    netMaas,
    isverenToplamMaliyet,
    kidemTazminatiTavan: KIDEM_TAZMINATI_TAVAN,
    yıllıkKidemHakki,
    aciklama,
  }
}

export function formatBordroText(result: BordroResult): string {
  const b = result.brutMaas.toLocaleString('tr-TR')
  const n = result.netMaas.toLocaleString('tr-TR')
  const s = result.sgkIsciBrut.toLocaleString('tr-TR')
  const m = result.isverenToplamMaliyet.toLocaleString('tr-TR')
  return `Brüt: ${b} TL | Net: ${n} TL | SGK İşçi: ${s} TL | İşveren Maliyeti: ${m} TL`
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hesaplaBordro, formatBordroText } from '@/lib/mali/bordroEngine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)