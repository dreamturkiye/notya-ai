/** 3-point, 7-point, CASH as support — never a diagnosis. Link clinical↔dermoscopy via lesionId. */
export type Point3 = { score: 0 | 1 | 2 | 3; notes: string }
export type Point7 = { score: number; notes: string }
export type Cash = { color: number; architecture: number; symmetry: number; homogeneity: number }

export function linkClinicalDermoscopy(clinicalPhotoId: string, dermoscopyPhotoId: string, lesionId: string) {
  return { lesionId, clinicalPhotoId, dermoscopyPhotoId, support_only: true as const }
}

export const DERMOSCOPY_DISCLAIMER = 'Tarama destegi, tani degildir. Doktor onayi gerekir.'
