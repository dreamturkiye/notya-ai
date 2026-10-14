/**
 * A local FHIR R4 collection with one draft MedicationRequest.
 * Nothing is sent. There is no patient identifier and no pharmacy.
 */
export function nzFhirTaslak(g: { ad: string; miktar?: number | null; yon?: string | null }): Record<string, unknown> | null {
  const ad = g.ad.trim()
  if (!ad) return null
  const notlar = ['Local draft only. Not submitted to the New Zealand ePrescription Service or to any other service.']
  const yon = g.yon?.trim()
  if (yon) notlar.push(yon)
  const kaynak: Record<string, unknown> = {
    resourceType: 'MedicationRequest',
    status: 'draft',
    intent: 'order',
    medicationCodeableConcept: { text: ad },
    note: notlar.map((text) => ({ text })),
  }
  if (typeof g.miktar === 'number' && Number.isFinite(g.miktar)) kaynak.dispenseRequest = { quantity: { value: g.miktar } }
  return { resourceType: 'Bundle', type: 'collection', entry: [{ resource: kaynak }] }
}
