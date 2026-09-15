/**
 * Perinatology referral suggestion — not an order.
 * Cite Riskli Gebelikler / Williams by role.
 */
import type { KadinDogumPayload } from '../schema'

export type SevkResult = { sevk: boolean; reason: string[]; citations: string[] }

const CITE = ['riskli-gebelikler', 'williams-26']

export function suggestPerinatology(input: {
  chorionicity?: KadinDogumPayload['chorionicity']
  ttts?: boolean
  efw_below_10th?: boolean
  doppler_abnormal?: boolean
  pe_severe?: boolean
  previa?: boolean
  accreta?: boolean
  insulin_gdm_poor_control?: boolean
  cervix_short?: boolean
  anomaly_18_22?: boolean
  stillbirth_history?: boolean
  risk_class?: KadinDogumPayload['risk_class']
}): SevkResult {
  const reason: string[] = []
  const mono = input.chorionicity === 'mo/di' || input.chorionicity === 'mo/mo'
  if (mono) reason.push('monochorionic twins')
  if (input.ttts) reason.push('TTTS concern')
  if (input.efw_below_10th && input.doppler_abnormal) reason.push('EFW <10th + abnormal Doppler')
  if (input.pe_severe) reason.push('PE with severe features')
  if (input.previa || input.accreta) reason.push('placenta previa/accreta')
  if (input.insulin_gdm_poor_control) reason.push('insulin GDM poor control')
  if (input.cervix_short) reason.push('cervical length short')
  if (input.anomaly_18_22) reason.push('fetal anomaly on 18–22w scan')
  if (input.stillbirth_history) reason.push('stillbirth history')
  if (input.risk_class === 'yuksek' && reason.length === 0) reason.push('risk_class yuksek')
  return { sevk: reason.length > 0, reason, citations: CITE }
}
