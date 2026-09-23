/**
 * PEDI-ARACLAR-02 — Araçlar › Gelişim taraması paneli API.
 * GET ?patientId= → hastanın panel kayıtları (pedi_taramalar), M-CHAT-R/F ve GİDR geçmişi, muayene tarihleri, KD taburcu
 *   bebek kartından işitme / kırmızı refleks ve doğum bilgisi. Hepsi doctor_id kapsamlı; hasta önce pediHasta ile doğrulanır.
 * POST { patientId, tur, sonuc, tarih?, not?, muayeneFormunaEkle? } → pedi_taramalar satırı; muayeneFormunaEkle yalnız hekim
 *   açıkça isterse ve M-CHAT / GİDR ile AYNI yoldan (lib/doktor/gununNotunaEkle) bugünkü nota tek satır ekler.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pediOturum, pediHasta, bulunamadi, bugunTr } from '../_ortak'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { arsivsizSeanslar } from '@/lib/doktor/arsiv'
import { TARAMA_TURLERI, taramaNotSatiri, type TaramaSonuc, type TaramaTur, type TaramaKaydi } from '@/specialties/pediatri/engines/gelisimPlan'

export const dynamic = 'force-dynamic'

const SONUCLAR: TaramaSonuc[] = ['yapildi', 'normal', 'ileri_degerlendirme', 'sevk']
const gun = (v: unknown) => String(v || '').slice(0, 10)

/** KD taburcu paketi bebek kartı: yenidogan_tarama.isitme / kirmizi_refleks (boolean ya da 'gec' | 'kaldi' | {sonuc}). */
function kartTaramasi(deger: unknown): TaramaSonuc | null {
  const v = deger && typeof deger === 'object' ? (deger as Record<string, unknown>).sonuc ?? (deger as Record<string, unknown>).durum : deger
  if (v === true || v === 'gec' || v === 'normal' || v === 'yapildi') return 'normal'
  if (v === 'kaldi' || v === 'sevk' || v === 'pozitif') return 'ileri_degerlendirme'
  return null
}

export async function GET(req: NextRequest) {
  const o = await pediOturum(req)
  if ('hata' in o) return o.hata
  const h = await pediHasta(o.sb, o.doktorId, req.nextUrl.searchParams.get('patientId'))
  if (!h) return bulunamadi()
  const [tQ, mQ, gQ, sQ, kQ] = await Promise.all([
    o.sb.from('pedi_taramalar').select('tur, tarih, sonuc, not_metni, created_at').eq('doctor_id', o.doktorId).eq('patient_id', h.id).order('tarih', { ascending: false }).limit(200),
    o.sb.from('mchat_testleri').select('toplam_puan, risk_seviyesi, created_at').eq('doctor_id', o.doktorId).eq('patient_id', h.id).order('created_at', { ascending: false }).limit(20),
    o.sb.from('gelisim_taramalari').select('sevk_onerisi, created_at').eq('doctor_id', o.doktorId).eq('patient_id', h.id).order('created_at', { ascending: false }).limit(20),
    arsivsizSeanslar(o.sb, 'created_at').eq('doctor_id', o.doktorId).eq('patient_id', h.id).order('created_at', { ascending: false }).limit(300),
    o.sb.from('bebek_kartlari').select('yenidogan_tarama, gebelik_haftasi, kilo_gram, dogum_zamani, created_at').eq('doctor_id', o.doktorId).eq('bebek_patient_id', h.id).order('created_at', { ascending: false }).limit(1),
  ])
  const taramalar: TaramaKaydi[] = (tQ.data || []).map((r) => ({ tur: r.tur as TaramaTur, tarih: gun(r.tarih), sonuc: r.sonuc as TaramaSonuc, kaynak: 'panel' as const }))
  const kart = kQ.data?.[0] as { yenidogan_tarama?: Record<string, unknown>; gebelik_haftasi?: number | null; kilo_gram?: number | null; dogum_zamani?: string | null; created_at?: string } | undefined
  if (kart?.yenidogan_tarama) {
    const tarih = gun(kart.dogum_zamani || kart.created_at) || h.dogumIso || bugunTr()
    for (const [anahtar, tur] of [['isitme', 'isitme'], ['kirmizi_refleks', 'kirmizi_refle']] as const) {
      const s = kartTaramasi(kart.yenidogan_tarama[anahtar])
      if (s) taramalar.push({ tur, tarih, sonuc: s, kaynak: 'bebek_karti' })
    }
  }
  return NextResponse.json({
    dogumIso: h.dogumIso,
    taramalar,
    // Tablo henüz yoksa (migration 055 uygulanmadıysa) panel yine çalışır — işaretleme sunucuda hata döner, sessiz kalmaz.
    taramaTablosu: !tQ.error,
    mchat: (mQ.data || []).map((r) => ({ tarih: gun(r.created_at), risk: r.risk_seviyesi, puan: r.toplam_puan })),
    gidr: (gQ.data || []).map((r) => ({ tarih: gun(r.created_at), sevk: !!r.sevk_onerisi })),
    seanslar: (sQ.data || []).map((r) => gun(r.created_at)),
    dogumBilgisi: kart && (kart.gebelik_haftasi != null || kart.kilo_gram != null) ? { gebelikHaftasi: kart.gebelik_haftasi ?? null, kiloGram: kart.kilo_gram ?? null } : null,
  })
}

export async function POST(req: NextRequest) {
  const o = await pediOturum(req)
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as { patientId?: string; tur?: string; sonuc?: string; tarih?: string; not?: string; muayeneFormunaEkle?: boolean } | null
  // HASTA-IZOLASYON: kimlik önce hekimin kendi hastası olarak doğrulanır — yabancı kimlik = yok (404), hiçbir şey yazılmaz.
  const h = await pediHasta(o.sb, o.doktorId, b?.patientId)
  if (!h) return bulunamadi()
  const tur = String(b?.tur || '') as TaramaTur
  const sonuc = String(b?.sonuc || 'yapildi') as TaramaSonuc
  if (!TARAMA_TURLERI.includes(tur)) return NextResponse.json({ error: 'Geçersiz tarama türü.' }, { status: 400 })
  if (!SONUCLAR.includes(sonuc)) return NextResponse.json({ error: 'Geçersiz sonuç.' }, { status: 400 })
  const bugun = bugunTr()
  const tarih = /^\d{4}-\d{2}-\d{2}$/.test(String(b?.tarih || '')) ? String(b!.tarih) : bugun
  if (tarih > bugun || (h.dogumIso && tarih < h.dogumIso)) return NextResponse.json({ error: 'Tarih doğumla bugün arasında olmalı.' }, { status: 400 })
  const notMetni = String(b?.not || '').trim().slice(0, 500) || null

  const { data: kayit, error } = await o.sb.from('pedi_taramalar')
    .insert({ doctor_id: o.doktorId, patient_id: h.id, tur, sonuc, tarih, not_metni: notMetni }).select('id').single()
  if (error || !kayit) return NextResponse.json({ error: 'Tarama kaydedilemedi — tekrar deneyin.' }, { status: 500 })

  let notEkleme = null
  if (b?.muayeneFormunaEkle === true) {
    notEkleme = await gununNotunaEkle(o.sb, o.doktorId, h.id, taramaNotSatiri(tur, sonuc, tarih, notMetni || undefined))
    if (notEkleme.notId) await o.sb.from('pedi_taramalar').update({ not_id: notEkleme.notId }).eq('id', kayit.id).eq('doctor_id', o.doktorId).then(() => {}, () => {})
  }
  return NextResponse.json({ ok: true, id: kayit.id, notEkleme })
}
