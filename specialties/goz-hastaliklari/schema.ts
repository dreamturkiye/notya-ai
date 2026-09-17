/**
 * GOZ-CHAPTER — request payload validators for /api/doktor/goz (in-tree z, same API as zod).
 * Live clinical truth = goz_* tables (migration 048), not specialty_records.payload, not core patients/visits.
 */
import { z, type Infer } from './z'

export const TARAF = ['sag', 'sol'] as const
export const GIB_YONTEM = ['nct', 'applanasyon', 'tonopen', 'icare', 'diger'] as const
export const DR_EVRE = ['yok', 'hafif_npdr', 'orta_npdr', 'agir_npdr', 'pdr', 'degerlendirilemedi'] as const
export const DMO = ['yok', 'merkez_disi', 'merkez_tutan'] as const
export const AJAN = ['bevacizumab', 'ranibizumab', 'aflibersept_2mg', 'aflibersept_8mg', 'deksametazon_implant', 'faricimab', 'brolucizumab', 'diger'] as const
export const ENDIKASYON = ['ybmd', 'dmo', 'rvt', 'miyopik_knv', 'rop', 'diger'] as const
export const SGK_SABLON = ['anti_vegf_baslangic', 'anti_vegf_idame', 'deksametazon_implant', 'katarakt_gil'] as const

const vaSeti = z.object({ uzak_sc: z.string().optional(), uzak_cc: z.string().optional(), yakin: z.string().optional() })

export const olcumSchema = z.object({
  tarih: z.string().optional(),
  va: z.object({ sag: vaSeti.optional(), sol: vaSeti.optional() }),
  gibSag: z.number().min(0).max(90).optional(),
  gibSol: z.number().min(0).max(90).optional(),
  gibYontem: z.enum(GIB_YONTEM).optional(),
  rapd: z.enum(['yok', 'sag', 'sol'] as const).optional(),
  kopyaOnayli: z.boolean().optional(),
})
export type OlcumGirdi = Infer<typeof olcumSchema>

export const enjeksiyonSchema = z.object({
  goz: z.enum(TARAF), ajan: z.enum(AJAN), endikasyon: z.enum(ENDIKASYON),
  faz: z.enum(['yukleme', 'idame'] as const), dozNo: z.number().int().min(1).max(99).optional(),
  tarih: z.string().min(10), durum: z.enum(['planli', 'yapildi', 'iptal'] as const),
})

export const drSchema = z.object({
  dmTip: z.enum(['T1', 'T2', 'diger'] as const).optional(), dmTaniTarihi: z.string().optional(), gebe: z.boolean().optional(),
  evreSag: z.enum(DR_EVRE).optional(), evreSol: z.enum(DR_EVRE).optional(), dmoSag: z.enum(DMO).optional(), dmoSol: z.enum(DMO).optional(),
  sonFundus: z.string().optional(), sonrakiKontrol: z.string().optional(),
})

/** Göz chapter must never write pediatri / KD payload keys. */
export const YASAK_ALANLAR = ['sat', 'edd', 'persentil', 'neyzi', 'gebelikHaftasi', 'pasi', 'fitzpatrick'] as const
