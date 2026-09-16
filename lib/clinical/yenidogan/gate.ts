import type { RedKayit, TaburcuChecks, TaburcuIstisna, PlannedTask } from './types'
import { TABURCU_ETIKET, TABURCU_ZORUNLU } from './constants'
import { eksikKalemGorevleri } from './calendar'

export type GateSonuc = {
  ok: boolean
  eksik: Array<'ntp1' | 'hepb1' | 'vitk' | 'isitme'>
  neden: string
  gorevler: PlannedTask[]
}

function kalemTamam(
  kalem: keyof TaburcuChecks,
  checks: TaburcuChecks,
  redler: RedKayit[],
): boolean {
  if (checks[kalem]) return true
  return redler.some((r) => r.kalem === kalem && r.status === 'red')
}

/**
 * Kadın-doğum cannot finalize taburcu if NTP-1, HepB-1, VitK, işitme are unchecked
 * unless the doctor records a reason (erken taburcu / redd / sevk) and tasks are generated.
 * Parental refuse (status=red) documents the item — calendar rows are never dropped.
 */
export function taburcuGate(input: {
  checks: TaburcuChecks
  redler?: RedKayit[]
  istisna?: TaburcuIstisna | null
  dogumAt: string
}): GateSonuc {
  const redler = input.redler || []
  const eksik = TABURCU_ZORUNLU.filter((k) => !kalemTamam(k, input.checks, redler))

  if (eksik.length === 0) {
    return { ok: true, eksik: [], neden: '', gorevler: [] }
  }

  const ist = input.istisna
  const istisnaOk = Boolean(
    ist &&
      (ist.neden === 'erken_taburcu' || ist.neden === 'redd' || ist.neden === 'sevk') &&
      String(ist.aciklama || '').trim().length > 0 &&
      String(ist.kaydeden || '').trim().length > 0,
  )

  if (!istisnaOk) {
    return {
      ok: false,
      eksik,
      neden: `Taburcu tamamlanamaz. Eksik: ${eksik.map((k) => TABURCU_ETIKET[k]).join('; ')}. Erken taburcu / redd / sevk gerekçesi ve görev kaydı gerekir.`,
      gorevler: [],
    }
  }

  return {
    ok: true,
    eksik,
    neden: `İstisna (${ist!.neden}): ${ist!.aciklama}`,
    gorevler: eksikKalemGorevleri(eksik, input.dogumAt),
  }
}

export function redKaydi(input: {
  kalem: string
  neden: string
  imza?: string
  kaydeden: string
  at?: string
}): RedKayit {
  return {
    kalem: input.kalem,
    neden: input.neden,
    imza: input.imza,
    at: input.at || new Date().toISOString(),
    kaydeden: input.kaydeden,
    status: 'red',
  }
}

/** NTP lab rows belong on the bebek patient, never the mother. */
export function ntpBelgeSahibi(input: {
  belgePatientId: string
  bebekPatientId: string | null | undefined
  annePatientId: string
}): { ok: boolean; neden: string } {
  if (!input.belgePatientId) return { ok: false, neden: 'Belge hastası yok.' }
  if (input.belgePatientId === input.annePatientId) {
    return { ok: false, neden: 'Yenidoğan tarama belgesi bebek kartına kaydedilir, anne belgelerine değil.' }
  }
  if (input.bebekPatientId && input.belgePatientId !== input.bebekPatientId) {
    return { ok: false, neden: 'Yenidoğan tarama belgesi bu doğumun bebek kartında olmalıdır.' }
  }
  return { ok: true, neden: '' }
}
