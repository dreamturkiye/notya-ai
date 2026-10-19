import { lazerAralik } from './girdi'

export function seansAraligi(gun: number): { gun: number } | { hata: string } {
  return lazerAralik(gun)
}
