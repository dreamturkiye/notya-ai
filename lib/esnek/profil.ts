/**
 * ESNEK-MUAYENE-B6 — "Notya sizi böyle tanıyor": the doctor's learned profile in one place, each line correctable or
 * reversible with one tap; plus what the home screen does with it. Derived only from his own rows (doctor_id).
 * HASTA-IZOLASYON: no patient id in or out; every read / write by doctor_id (a lexicon / rule row by id AND doctor_id).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { arsivsizNotlar, arsivsizSeanslar } from '@/lib/doktor/arsiv'
import { calismaSekli, onayAliskanligi, anaSayfaKarari, type CalismaSekli, type OnayAliskanligi, type AnaSayfaKarari, type OnayAni } from '@/core/esnek/tanima'
import { gunAnahtari, gunDakikasi } from '@/core/esnek/metinAraclari'
import { esnekAyarYaz, esnekAyarYukle, type EsnekAyari } from './sunucu'
import { golgeDurumu, type GolgeDurumu } from './golge'
import { oneriProfiliYukle, oneriKarariYaz, type OneriProfilOzeti } from './oneriServisi'
import { ozerklikOzeti, ozerklikIslem } from './ozerklikServisi'
import { haftalikOgrenilenler } from './gece'

export async function calismaVerisi(sb: SupabaseClient, doktorId: string, a: EsnekAyari): Promise<{ sekil: CalismaSekli | null; ogrenilen: CalismaSekli | null; onay: OnayAliskanligi | null; ogrenilenOnay: OnayAliskanligi | null }> {
  const kesim = new Date(Date.now() - 30 * 86400000).toISOString()
  const [{ data: seanslar }, { data: kaynaklar }, { data: onaylar }] = await Promise.all([
    arsivsizSeanslar(sb, 'id, duration_seconds, audio_url').eq('doctor_id', doktorId).gte('created_at', kesim).limit(800),
    sb.from('muayene_kaynaklari').select('session_id').eq('doctor_id', doktorId).in('tur', ['el_notu', 'sekreter_yukleme']).gte('created_at', kesim).not('session_id', 'is', null).limit(2000),
    arsivsizNotlar(sb, 'created_at, approved_at').eq('doctor_id', doktorId).eq('approved_by', doktorId).gte('approved_at', kesim).limit(800),
  ])
  const elNotlu = new Set((kaynaklar || []).map((k) => String(k.session_id)))
  const ziyaret = ((seanslar || []) as { id: string; duration_seconds: number | null; audio_url: string | null }[]).map((s) => ({ elNotu: elNotlu.has(String(s.id)), transkript: Boolean((s.duration_seconds || 0) > 0 || s.audio_url) })).filter((z) => z.elNotu || z.transkript)
  const anlar: OnayAni[] = ((onaylar || []) as { created_at: string; approved_at: string }[]).map((n) => {
    const t = new Date(n.approved_at)
    return { gun: gunAnahtari(t), dakika: gunDakikasi(t), gecikmeDk: Math.max(0, (t.getTime() - new Date(n.created_at).getTime()) / 60000) }
  })
  const ogrenilen = calismaSekli(ziyaret)
  const ogrenilenOnay = onayAliskanligi(anlar)
  const d = a.hekimDuzeltmeleri || {}
  const sekil = d.calismaSekli !== undefined ? d.calismaSekli ?? null : ogrenilen
  const onay = d.onayTuru !== undefined && d.onayTuru !== null ? { tur: d.onayTuru, saatDk: d.onayTuru === 'gun_sonu' ? (d.onaySaatDk ?? ogrenilenOnay?.saatDk ?? 18 * 60) : null } : d.onayTuru === null ? null : ogrenilenOnay
  return { sekil, ogrenilen, onay, ogrenilenOnay }
}

export type Profil = {
  calisma: Awaited<ReturnType<typeof calismaVerisi>>
  kisaltmalar: { id: string; kisaltma: string; anlam: string; kaynak: string }[]
  uslup: { anahtar: string; deger: string }[]
  oneri: OneriProfilOzeti['turler']
  ozerklik: Awaited<ReturnType<typeof ozerklikOzeti>>
  golge: GolgeDurumu
}

export async function profilYukle(sb: SupabaseClient, doktorId: string): Promise<Profil> {
  const a = await esnekAyarYukle(sb, doktorId)
  const [calisma, { data: soz }, { data: kural }, oneri, ozerklik, golge] = await Promise.all([
    calismaVerisi(sb, doktorId, a),
    sb.from('hekim_el_sozlugu').select('id, kisaltma, anlam, kaynak').eq('doctor_id', doktorId).order('sayac', { ascending: false }).limit(20),
    sb.from('doktor_hafiza').select('anahtar, deger').eq('doctor_id', doktorId).eq('kaynak', 'duzeltme').eq('durum', 'uygulanir').eq('aktif', true).order('kanit_sayisi', { ascending: false }).limit(15),
    oneriProfiliYukle(sb, doktorId),
    ozerklikOzeti(sb, doktorId),
    golgeDurumu(sb, doktorId, a),
  ])
  const { uslupKuraliGuvenliMi } = await import('@/lib/doktor/ogrenme/hastaOlguKapisi')
  return {
    calisma,
    kisaltmalar: ((soz || []) as Profil['kisaltmalar']).map((r) => ({ id: String(r.id), kisaltma: String(r.kisaltma), anlam: String(r.anlam), kaynak: String(r.kaynak) })),
    uslup: ((kural || []) as Profil['uslup']).filter((k) => uslupKuraliGuvenliMi({ anahtar: k.anahtar, deger: k.deger })).map((k) => ({ anahtar: String(k.anahtar), deger: String(k.deger) })),
    oneri: oneri.turler, ozerklik, golge,
  }
}

/** One-tap corrections from the card. */
export async function profilIslem(sb: SupabaseClient, doktorId: string, userId: string, b: Record<string, unknown>): Promise<boolean> {
  const id = typeof b.id === 'string' && /^[0-9a-f-]{36}$/i.test(b.id) ? b.id : null
  switch (b.islem) {
    case 'sozluk_duzelt': {
      const anlam = typeof b.anlam === 'string' ? b.anlam.trim().replace(/\s+/g, ' ').slice(0, 80) : ''
      if (!id || !anlam) return false
      const { error } = await sb.from('hekim_el_sozlugu').update({ anlam, kaynak: 'elle', updated_at: new Date().toISOString() }).eq('id', id).eq('doctor_id', doktorId)
      return !error
    }
    case 'sozluk_sil': {
      if (!id) return false
      const { error } = await sb.from('hekim_el_sozlugu').delete().eq('id', id).eq('doctor_id', doktorId)
      if (!error) await sb.from('esnek_ogrenme_adaylari').update({ durum: 'geri_alindi', geri_alindi_at: new Date().toISOString() }).eq('doctor_id', doktorId).eq('tur', 'sozluk').contains('uygulama', { id })
      return !error
    }
    case 'uslup_unut': {
      const anahtar = typeof b.anahtar === 'string' ? b.anahtar.slice(0, 80) : ''
      if (!anahtar) return false
      const simdi = new Date().toISOString()
      if (anahtar.startsWith('gece-')) await sb.from('doktor_hafiza').update({ durum: 'kapali', aktif: false, kesin: false, updated_at: simdi }).eq('doctor_id', doktorId).eq('anahtar', anahtar)
      else { const { kuralKapat } = await import('@/lib/doktor/ogrenme/kuralKaydet'); await kuralKapat(sb, doktorId, anahtar) }
      await sb.from('esnek_ogrenme_adaylari').update({ durum: 'geri_alindi', geri_alindi_at: simdi }).eq('doctor_id', doktorId).contains('uygulama', { anahtar })
      return true
    }
    case 'oneri':
      return oneriKarariYaz(sb, doktorId, b.tur, b.karar ?? null)
    case 'ozerklik':
      return ozerklikIslem(sb, doktorId, userId, { islem: b.alt, alan: b.alan })
    case 'calisma': {
      const a = await esnekAyarYukle(sb, doktorId)
      const sekil = b.sekil === 'kagit' || b.sekil === 'ses' || b.sekil === 'karma' ? b.sekil : b.sekil === null ? null : undefined
      const d = { ...a.hekimDuzeltmeleri } as Record<string, unknown>
      if (sekil === undefined) delete d.calismaSekli; else d.calismaSekli = sekil
      return esnekAyarYaz(sb, doktorId, userId, { hekim_duzeltmeleri: d })
    }
    case 'onay': {
      const a = await esnekAyarYukle(sb, doktorId)
      const d = { ...a.hekimDuzeltmeleri } as Record<string, unknown>
      if (b.tur === 'gun_sonu' || b.tur === 'anlik') {
        d.onayTuru = b.tur
        const s = Number(b.saatDk)
        d.onaySaatDk = b.tur === 'gun_sonu' && Number.isFinite(s) && s >= 0 && s < 1440 ? Math.round(s / 15) * 15 : null
      } else { delete d.onayTuru; delete d.onaySaatDk }
      return esnekAyarYaz(sb, doktorId, userId, { hekim_duzeltmeleri: d })
    }
  }
  return false
}

export type AnaSayfa = {
  karar: AnaSayfaKarari
  golge: GolgeDurumu | null
  haftalik: Awaited<ReturnType<typeof haftalikOgrenilenler>>
  b3Teklif: boolean
  topluOnayIzni: boolean
}

/** The home screen's adaptive part in ONE request (no polling): working style, the daily notification, shadow line, learned. */
export async function anaSayfaYukle(sb: SupabaseClient, doktorId: string, simdi = new Date()): Promise<AnaSayfa> {
  const a = await esnekAyarYukle(sb, doktorId)
  const [calisma, bekleyen, golge, haftalik, ozerklik] = await Promise.all([
    calismaVerisi(sb, doktorId, a),
    arsivsizNotlar(sb, 'id', { count: 'exact', head: true }).eq('doctor_id', doktorId).is('approved_at', null),
    golgeDurumu(sb, doktorId, a),
    haftalikOgrenilenler(sb, doktorId),
    ozerklikOzeti(sb, doktorId),
  ])
  const karar = anaSayfaKarari({ sekil: calisma.sekil, onay: calisma.onay, simdiDk: gunDakikasi(simdi), bekleyen: bekleyen.count || 0, bugunGosterildi: false })
  const golgeGoster = golge.acik || golge.teklif || golge.sekreterYazmasin
  return { karar, golge: golgeGoster ? golge : null, haftalik, b3Teklif: ozerklik.b3Teklif, topluOnayIzni: ozerklik.topluOnayIzni }
}
