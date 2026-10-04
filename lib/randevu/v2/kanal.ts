/**
 * NOTYA-RANDEVU-V2 — notification channels behind one interface, so automatic WhatsApp can be added later
 * by registering one more adapter (no change to the job runner, the routes or the UI).
 *
 * Today:
 *   • e-posta, AUTOMATIC — through the existing path (lib/iletisim/otomatik.ts → the doctor's own connected
 *     Gmail/Outlook, NOTYA-ILETISIM-02). Consent-gated (patients.iletisim_izni_eposta === true). The .ics rides
 *     along as an attachment on the confirmation.
 *   • WhatsApp, ONE-TAP — feeds the existing Hazır mesajlar queue (iletisim_kuyrugu, "Yarın N randevu") with the
 *     same de-duplication key the daily reminder cron uses, so the doctor or secretary sends it from their own
 *     number with one tap. Nothing is sent by Notya on WhatsApp. No Twilio, no Meta API, no automation.
 *
 * Later (docs/OPEN-COMMITMENTS.md, NOTYA-RANDEVU-V2-A): an automatic WhatsApp adapter (Meta coexistence, approved
 * template only) is one more RandevuKanali with `otomatik: true`, listed before the one-tap adapter.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { HastaIletisimi } from '@/lib/iletisim/sunucu'
import { kuyrugaEkle } from '@/lib/iletisim/sunucu'
import { gonderilebilirMi } from '@/lib/iletisim/izin'
import { epostaAdresi } from '@/lib/iletisim/baglantilar'
import { hazirOtomatikGonderici, type OtomatikGonderici } from '@/lib/iletisim/otomatik'
import { tekilAnahtar } from '@/lib/iletisim/kuyruk'
import { bugunTrIso } from '@/lib/iletisim/sablonlar'
import type { MesajTuru, IletisimKanali } from '@/lib/iletisim/tipler'
import type { EpostaEki } from '@/lib/iletisim/otomatik/eposta/mime'
import type { RandevuEpostaTuru } from './eposta'

export type RandevuIletisi = {
  doktorId: string
  randevuId: string
  baslangicIso: string
  tur: RandevuEpostaTuru
  hasta: HastaIletisimi
  konu: string
  metin: string
  ekler?: EpostaEki[]
}

export type KanalSonucu =
  | { durum: 'gonderildi'; saglayici?: string; mesajId?: string }
  | { durum: 'kuyrukta' }
  | { durum: 'atlandi'; neden: string }
  | { durum: 'hata'; neden: string }

export interface RandevuKanali {
  kanal: IletisimKanali
  /** true → leaves without a human tap. */
  otomatik: boolean
  /** Which notifications this channel carries. */
  tasirMi(tur: RandevuEpostaTuru): boolean
  /** Must never throw. */
  gonder(sb: SupabaseClient, ileti: RandevuIletisi): Promise<KanalSonucu>
}

/** The existing message type an outgoing V2 notification is logged as (iletisim_kayitlari.tur). */
export function kayitTuru(tur: RandevuEpostaTuru): MesajTuru {
  if (tur === 'gun_once' || tur === 'sabah') return 'randevu_hatirlatma'
  if (tur === 'red_eposta' || tur === 'iptal_eposta') return 'randevu_iptali'
  return 'randevu_degisikligi'
}

type GondericiBul = (doktorId: string, kanal: IletisimKanali) => Promise<OtomatikGonderici | null>

export function epostaKanali(bul: GondericiBul = hazirOtomatikGonderici): RandevuKanali {
  return {
    kanal: 'eposta',
    otomatik: true,
    tasirMi: () => true,
    async gonder(sb, i) {
      try {
        if (!gonderilebilirMi(i.hasta, 'eposta')) return { durum: 'atlandi', neden: 'eposta_izni_veya_adresi_yok' }
        const alici = epostaAdresi(i.hasta.eposta)
        if (!alici) return { durum: 'atlandi', neden: 'eposta_adresi_yok' }
        const g = await bul(i.doktorId, 'eposta')
        if (!g) return { durum: 'atlandi', neden: 'eposta_hesabi_bagli_degil' }
        const s = await g.gonder({
          doktorId: i.doktorId,
          patientId: i.hasta.id,
          tur: kayitTuru(i.tur),
          alici,
          konu: i.konu,
          metin: i.metin,
          ...(i.ekler?.length ? { ekler: i.ekler } : {}),
        })
        if (!s.ok) return { durum: 'hata', neden: s.hata }
        // Same log row the NOTYA-ILETISIM-04 dispatcher writes for an automatic message.
        await sb.from('iletisim_kayitlari').insert({
          doctor_id: i.doktorId,
          patient_id: i.hasta.id,
          kanal: 'eposta',
          tur: kayitTuru(i.tur),
          durum: 'gonderildi',
          gonderen_user_id: null,
          gonderen_personel_id: null,
          randevu_id: i.randevuId,
          otomatik: true,
          saglayici: s.saglayici || g.saglayici,
          saglayici_mesaj_id: s.saglayiciMesajId ?? null,
        }).then(() => undefined, () => undefined)
        return { durum: 'gonderildi', saglayici: s.saglayici || g.saglayici, mesajId: s.saglayiciMesajId }
      } catch {
        return { durum: 'hata', neden: 'E-posta şu an gönderilemedi.' }
      }
    },
  }
}

/** WhatsApp one-tap: the day-before reminder goes into the existing Hazır mesajlar queue. Never sends. */
export function whatsappTekDokunusKanali(): RandevuKanali {
  return {
    kanal: 'whatsapp',
    otomatik: false,
    tasirMi: (tur) => tur === 'gun_once',
    async gonder(sb, i) {
      try {
        const eklenen = await kuyrugaEkle(sb, [{
          doctor_id: i.doktorId,
          patient_id: i.hasta.id,
          tur: 'randevu_hatirlatma',
          randevu_id: i.randevuId,
          planlanan_gun: bugunTrIso(),
          tekil_anahtar: tekilAnahtar.randevu(i.randevuId, new Date(i.baslangicIso).toISOString()),
        }])
        return eklenen > 0 ? { durum: 'kuyrukta' } : { durum: 'atlandi', neden: 'zaten_kuyrukta' }
      } catch {
        return { durum: 'hata', neden: 'kuyruk_hatasi' }
      }
    },
  }
}

/** Registered channels, automatic first. */
export function randevuKanallari(): RandevuKanali[] {
  return [epostaKanali(), whatsappTekDokunusKanali()]
}
