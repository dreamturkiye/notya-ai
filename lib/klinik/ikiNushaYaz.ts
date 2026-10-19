import type { SupabaseClient } from '@supabase/supabase-js'
import { IKI_NUSHA_KATEGORI } from '@/lib/doktor/belgeTurleri'
import { uploadDocument } from '@/lib/vault/service'
import { nushaPdf, nushaNotu, type NushaRol } from '@/lib/klinik/ikiNusha'

export async function ikiNushaYaz(
  supabase: SupabaseClient,
  doctorId: string,
  patientId: string,
  iso: string,
  seansId: string,
): Promise<{ dosyaId: string; hastaId: string }> {
  async function yaz(rol: NushaRol): Promise<string> {
    const belge = await uploadDocument({ supabase }, {
      doctorId,
      patientId,
      visitId: null,
      fileName: rol === 'dosya' ? 'Dosya nüshası.pdf' : 'Hasta nüshası.pdf',
      fileType: 'application/pdf',
      bytes: nushaPdf(rol, iso),
      notes: nushaNotu(rol, iso, seansId),
      category: IKI_NUSHA_KATEGORI,
      uploadedBy: doctorId,
    })
    return belge.id
  }
  const dosyaId = await yaz('dosya')
  const hastaId = await yaz('hasta')
  return { dosyaId, hastaId }
}
