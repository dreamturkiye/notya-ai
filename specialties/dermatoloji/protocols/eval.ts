export type Triage = 'routine' | 'urgent' | 'emergency'
export type EvalResult = {
  triage: Triage
  next: string[]
  citations: string[]
  photoPlan: string[]
}
