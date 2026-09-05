export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * NOTYA-HL7-02 — Inbound ADT receiver (hastane → Notya hasta beslemesi).
 * Kurumun entegrasyon motoru (Mirth sınıfı) ADT^A04/A05/A08/A28/A31 mesajını HTTPS ile
 * buraya POST'lar; hasta Notya'da hazır olur — hekim muayeneye oturduğunda hasta zaten kayıtlı.
 *
 * Güvenlik: kurum başına inbound_anahtar (x-notya-anahtar başlığı) + kurum aktif olmalı.
 * Hekim eşleme: PV1-7'deki doktor kodu → kurum_doktorlar.kurum_doktor_kodu; eşleşme yoksa
 * mesaj kabul edilmez — hasta sahipsiz yaratılamaz (KVKK: veri sorumlusu hekimdir).
 * KVKK: gelen ad/doğum/cinsiyet alanları encryptPII ile şifrelenerek yazılır; MRN eşlemesi
 * ayrı tabloda (kurum_hasta_eslesme) tutulur — çekirdek patients şemasına dokunulmaz.
 * Yanıt: standart HL7 ACK (MSA|AA/AE/AR) — entegrasyon motorları bunu bekler.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { encryptPII } from '@/lib/security/encryption'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** HL7 v2 kaçışlarını çöz (gelen yönde). */
function coz(s: string): string {
  return s
    .replace(/\\F\\/g, '|').replace(/\\S\\/g, '^').replace(/\\R\\/g, '~')
    .replace(/\\T\\/g, '&').replace(/\\.br\\/g, '\n').replace(/\\E\\/g, '\\')
}

function ack(kod: 'AA' | 'AE' | 'AR', ctrlId: string, mesaj?: string): NextResponse {
  const ts = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
  const govde = [
    `MSH|^~\\&|NOTYA|DREAMTURKIYE|||${ts}||ACK|NOTYAACK${Date.now()}|P|2.5|||||TUR|UNICODE UTF-8`,
    `MSA|${kod}|${ctrlId}${mesaj ? `|${mesaj}` : ''}`,
  ].join('\r') + '\r'
  return new NextResponse(govde, {
    status: kod === 'AA' ? 200 : kod === 'AE' ? 400 : 403,
    headers: { 'Content-Type': 'x-application/hl7-v2+er7; charset=utf-8' },
  })
}

export async function POST(req: NextRequest) {
  const ham = await req.text()
  const segmentler = ham.split(/\r\n|\r|\n/).filter(Boolean)
  const msh = segmentler.find((s) => s.startsWith('MSH'))
  if (!msh) return ack('AR', 'BILINMIYOR', 'MSH yok')
  const mshAlan = msh.split('|')
  const ctrlId = mshAlan[9] || 'BILINMIYOR'
  const mesajTipi = (mshAlan[8] || '').split('^')

  const sb = getSupabase()
  const anahtar = req.headers.get('x-notya-anahtar') || ''
  const { data: kurum } = anahtar
    ? await sb.from('kurum_entegrasyonlari').select('id, ad, aktif').eq('inbound_anahtar', anahtar).maybeSingle()
    : { data: null }
  if (!kurum || !kurum.aktif) return ack('AR', ctrlId, 'Yetkisiz ya da pasif kurum')

  if (mesajTipi[0] !== 'ADT') {
    await sb.from('fhir_audit').insert({ kurum_id: kurum.id, islem: 'inbound', sonuc: 'AE', detay: `desteklenmeyen tip ${mesajTipi.join('^')}` })
    return ack('AE', ctrlId, 'Yalnız ADT desteklenir')
  }

  const pid = segmentler.find((s) => s.startsWith('PID'))
  const pv1 = segmentler.find((s) => s.startsWith('PV1'))
  if (!pid) return ack('AE', ctrlId, 'PID yok')
  const p = pid.split('|')
  const mrn = coz((p[3] || '').split('^')[0] || '')
  const adBilesen = (p[5] || '').split('^')
  const adSoyad = coz([adBilesen[1], adBilesen[0]].filter(Boolean).join(' ').trim())
  const dob = (p[7] || '').slice(0, 8) // YYYYMMDD
  const cinsiyetKod = (p[8] || '').trim().toUpperCase()
  const cinsiyet = cinsiyetKod === 'M' ? 'erkek' : cinsiyetKod === 'F' ? 'kadın' : ''
  if (!mrn || !adSoyad) return ack('AE', ctrlId, 'PID-3 (MRN) ve PID-5 (ad) zorunlu')

  // Hekim eşleme: PV1-7 ilk bileşen = kurumun doktor kodu
  const doktorKodu = pv1 ? coz((pv1.split('|')[7] || '').split('^')[0] || '') : ''
  const { data: uye } = doktorKodu
    ? await sb.from('kurum_doktorlar').select('doctor_id').eq('kurum_id', kurum.id).eq('kurum_doktor_kodu', doktorKodu).maybeSingle()
    : { data: null }
  if (!uye) {
    await sb.from('fhir_audit').insert({ kurum_id: kurum.id, islem: 'inbound', sonuc: 'AE', detay: `hekim eşleşmedi (PV1-7=${doktorKodu || 'boş'})` })
    return ack('AE', ctrlId, 'Hekim kodu eşleşmedi (PV1-7)')
  }

  // MRN eşlemesi: varsa güncelle, yoksa hasta yarat + eşle
  const { data: mevcut } = await sb.from('kurum_hasta_eslesme').select('patient_id').eq('kurum_id', kurum.id).eq('mrn', mrn).maybeSingle()
  const dogumIso = dob.length === 8 ? `${dob.slice(0, 4)}-${dob.slice(4, 6)}-${dob.slice(6, 8)}` : null
  if (mevcut) {
    await sb.from('patients').update({
      name_encrypted: encryptPII(adSoyad),
      ...(dogumIso ? { dob_encrypted: encryptPII(dogumIso) } : {}),
      ...(cinsiyet ? { gender_encrypted: encryptPII(cinsiyet) } : {}),
      updated_at: new Date().toISOString(),
    }).eq('id', mevcut.patient_id)
    await sb.from('fhir_audit').insert({ kurum_id: kurum.id, islem: 'inbound', sonuc: 'OK guncelleme', detay: `MRN ${mrn.slice(0, 12)}` })
  } else {
    const { data: yeni, error } = await sb.from('patients').insert({
      doctor_id: uye.doctor_id,
      name_encrypted: encryptPII(adSoyad),
      dob_encrypted: dogumIso ? encryptPII(dogumIso) : null,
      gender_encrypted: cinsiyet ? encryptPII(cinsiyet) : null,
      is_active: true,
    }).select('id').single()
    if (error || !yeni) {
      await sb.from('fhir_audit').insert({ kurum_id: kurum.id, islem: 'inbound', sonuc: 'HATA', detay: error?.message?.slice(0, 200) || 'insert' })
      return ack('AE', ctrlId, 'Hasta yaratılamadı')
    }
    await sb.from('kurum_hasta_eslesme').insert({ kurum_id: kurum.id, mrn, patient_id: yeni.id })
    await sb.from('fhir_audit').insert({ kurum_id: kurum.id, islem: 'inbound', sonuc: 'OK yeni', detay: `MRN ${mrn.slice(0, 12)} → dr ${doktorKodu}` })
  }

  return ack('AA', ctrlId)
}
