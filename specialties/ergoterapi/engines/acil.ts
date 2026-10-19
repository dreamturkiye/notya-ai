import { ACIL_METIN, INTAKE_ACIL } from './ergo'

export function acilCumlesi(): string {
  return ACIL_METIN
}

export function intakeAcilMi(secim: string): boolean {
  return (INTAKE_ACIL as readonly string[]).includes(secim) && secim !== 'Yok'
}
