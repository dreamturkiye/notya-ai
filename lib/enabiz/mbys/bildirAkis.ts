/**
 * MBYS-BILDIR-01 — the confirm → audit → hand-over flow, behind a small store interface so the order of events can be
 * tested without a database. The route supplies the Supabase-backed store (doctor-scoped reads, see sunucu.ts).
 *
 * Fail closed: the record is released to the browser only AFTER the 'onaylandi' audit row is written. If the audit
 * write fails, nothing is released.
 */
import type { PratikRol } from '@/lib/doktor/personelYetki'
import { mbysDuzMetin, type MbysEksik, type MbysKayit } from './kontrol'
import {
  adaptorSec,
  bildirimKapisi,
  devirOlayi,
  gunlukSatiri,
  kayitOzeti,
  type AdaptorSonucu,
  type DevirSonucu,
  type GunlukSatiri,
} from './bildir'

export type BildirimNotu = {
  hastaId: string
  hastaAd: string
  onayli: boolean
  kilit: boolean
  eksikler: MbysEksik[]
  kayit: MbysKayit | null
}

export type OnayKaydi = { id: string; note_id: string; patient_id: string; payload_hash: string }

export interface BildirimDeposu {
  /** The visit under THIS doctor, or null (foreign / missing). */
  notKaydi(doktorId: string, notId: string): Promise<BildirimNotu | null>
  /** Append one audit row. null = the write failed. */
  gunlukEkle(satir: GunlukSatiri): Promise<{ id: string } | null>
  /** An 'onaylandi' row of THIS doctor, or null. */
  onayBul(doktorId: string, onayId: string): Promise<OnayKaydi | null>
  /** Mark the visit "Aktarıldı" (never downgrades "Kaydedildi"). */
  aktarildiIsaretle(doktorId: string, hastaId: string, notId: string): Promise<void>
}

export type AkisHatasi = { ok: false; durum: number; kod: string; mesaj: string }

export type OnayYaniti = {
  ok: true
  onayId: string
  hastaAd: string
  kayit: MbysKayit
  metin: string
  /** What the server-side adapter did. Today always the stub: nothing was sent to MBYS. */
  adaptor: AdaptorSonucu & { ad: string }
}

const bulunamadi: AkisHatasi = { ok: false, durum: 404, kod: 'bulunamadi', mesaj: 'Hasta bulunamadı.' }

export async function bildirimOnizle(depo: BildirimDeposu, a: { doktorId: string; notId: string }) {
  const n = await depo.notKaydi(a.doktorId, a.notId)
  if (!n) return bulunamadi
  return { ok: true as const, ...n, ozet: n.kayit ? kayitOzeti(n.kayit) : '', metin: n.kayit ? mbysDuzMetin(n.kayit) : '' }
}

export async function bildirimOnayla(
  depo: BildirimDeposu,
  a: { doktorId: string; rol: PratikRol; notId: string; onay: boolean; gonderilenOzet: string },
): Promise<OnayYaniti | AkisHatasi> {
  // Ownership first: a foreign or missing note is a 404 whatever else is wrong with the request.
  const n = await depo.notKaydi(a.doktorId, a.notId)
  if (!n) return bulunamadi
  const ozet = n.kayit ? kayitOzeti(n.kayit) : ''
  const kapi = bildirimKapisi({
    rol: a.rol,
    notOnayli: n.onayli,
    kilit: n.kilit,
    eksikler: n.eksikler,
    onayVerildi: a.onay === true,
    gonderilenOzet: a.gonderilenOzet,
    guncelOzet: ozet,
  })
  if (!kapi.izin || !n.kayit) {
    return { ok: false, durum: kapi.izin ? 409 : kapi.durum, kod: kapi.izin ? 'kayit_yok' : kapi.kod, mesaj: kapi.izin ? 'Kayıt hazırlanamadı.' : kapi.mesaj }
  }
  const yaz = await depo.gunlukEkle(
    gunlukSatiri({ doctor_id: a.doktorId, patient_id: n.hastaId, note_id: a.notId, olay: 'onaylandi', kanal: null, payload_hash: ozet, onay_id: null }),
  )
  if (!yaz) return { ok: false, durum: 500, kod: 'gunluk', mesaj: 'Denetim kaydı yazılamadı; bildirim yapılmadı.' }
  const ad = adaptorSec()
  const adaptor = await ad.gonder(n.kayit)
  return { ok: true, onayId: yaz.id, hastaAd: n.hastaAd, kayit: n.kayit, metin: mbysDuzMetin(n.kayit), adaptor: { ...adaptor, ad: ad.ad } }
}

export async function devirKaydet(
  depo: BildirimDeposu,
  a: { doktorId: string; rol: PratikRol; onayId: string; sonuc: DevirSonucu },
): Promise<{ ok: true; durum: 'aktarildi' | 'basarisiz' } | AkisHatasi> {
  if (a.rol !== 'doktor') return { ok: false, durum: 403, kod: 'rol', mesaj: 'Muayeneyi yalnız hekim bildirebilir.' }
  const onay = await depo.onayBul(a.doktorId, a.onayId)
  if (!onay) return bulunamadi
  const { olay, kanal } = devirOlayi(a.sonuc)
  const yaz = await depo.gunlukEkle(
    gunlukSatiri({ doctor_id: a.doktorId, patient_id: onay.patient_id, note_id: onay.note_id, olay, kanal, payload_hash: onay.payload_hash, onay_id: onay.id }),
  )
  if (!yaz) return { ok: false, durum: 500, kod: 'gunluk', mesaj: 'Denetim kaydı yazılamadı.' }
  if (olay === 'devir_basarisiz') return { ok: true, durum: 'basarisiz' }
  await depo.aktarildiIsaretle(a.doktorId, onay.patient_id, onay.note_id)
  return { ok: true, durum: 'aktarildi' }
}
