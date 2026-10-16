/**
 * NOTYA-HASTA-RAPORLARI-UNIFIED-01 — Araçlar → Hasta Raporları → Çocuk Hasta Raporları
 * (Pediatri + Çocuk Cerrahisi only). Generates ONE of the 4 report types as a real PDF
 * (lib/doktor/raporPdfSablonu.tsx, unified visual standard) from real patient + encounter
 * data, and stores it in the Belge Kasası (lib/vault/service.uploadDocument) linked to
 * the specific muayene it came from — verification item (c) in the brief.
 *
 * HASTA-IZOLASYON-01: hastaId is attacker-controlled request input → hastaSahibiMi before
 * any read. visitId (when the doctor names one) is re-verified with seansSahibi AND its
 * patient_id must equal the already-owned hastaId (defense in depth — the same two-check
 * pattern app/api/doktor/goruntuleme/yukle/route.ts and dermatoloji/spine/route.ts use).
 * uploadDocument() re-runs its own assertPatientOwned/assertVisitOwned a second time
 * (lib/vault/service.ts) — this route never relies on its own check alone.
 *
 * Doctor-only (sadeceDoktor pattern): this is a clinical decision document, same class as
 * aşı karnesi onayı — a secretary can read/print it afterwards from the Kasa, not author it.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi, seansSahibi } from '@/lib/doktor/hastaSahipligi'
import { arsivsizSeanslar } from '@/lib/doktor/arsiv'
import { hekimBransi } from '@/lib/doktor/hekimAdi'
import { decrypt } from '@/lib/security/encryption'
import {
  cocukHastaRaporuBransiMi,
} from '@/lib/doktor/belgeTurleri'
import {
  cocukRaporTipiById,
  cocukRaporuMetniUret,
  istirahatBitisTarihi,
  istirahatGunSinirla,
  veliGerekliMi,
  type CocukRaporHasta,
  type IstirahatDegiskenler,
  type KararTarihDegiskenler,
} from '@/lib/doktor/cocukHastaRaporlari'
import { raporDoktorBlogu } from '@/lib/doktor/raporDoktorBlogu'
import { raporBelgesiModeliKur, raporDosyaAdi } from '@/lib/doktor/raporBelgesi'
import { raporBelgesiPdf } from '@/lib/doktor/raporPdfSablonu'
import { raporBelgeNoUret } from '@/lib/doktor/raporBelgeNo'
import { uploadDocument, VaultAccessError, VaultValidationError } from '@/lib/vault/service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

const UYARI =
  'Bu belge Notya üzerinden hekim tarafından elektronik olarak düzenlenmiştir. Resmî kullanım için hekimin ıslak imzası ve kaşesi tamamlanmalıdır.'

type Govde = {
  hastaId?: string
  raporTipiId?: string
  visitId?: string
  baslangicTarihi?: string
  gunSayisi?: number
  tarih?: string
  hekimGerekcesi?: string
}

function bugunIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const doktorId = user.id

  const body = (await req.json().catch(() => ({}))) as Govde
  const hastaId = String(body.hastaId || '')
  const tip = cocukRaporTipiById(String(body.raporTipiId || ''))
  if (!hastaId || !tip) {
    return NextResponse.json({ error: 'hastaId ve raporTipiId zorunludur.' }, { status: 400 })
  }

  // 1) Branş kapısı — doktorun KENDİ branşı, hastanın değil (specialty-doktor-araclari: classify before add).
  const brans = await hekimBransi(supabase, doktorId)
  if (!cocukHastaRaporuBransiMi(brans)) {
    return NextResponse.json({ error: 'Bu rapor branşınızda kullanılamaz.' }, { status: 403 })
  }

  // 2) Hasta sahipliği — HASTA-IZOLASYON-01, 404 (yabancı id = yok).
  if (!(await hastaSahibiMi(supabase, doktorId, hastaId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }

  // 3) Muayene (seans) — adlandırılmışsa sahipliği YENİDEN doğrula; verilmemişse hastanın en son
  //    (bu doktora ait) seansı otomatik seçilir. Her iki yol da doctor_id ile daralır.
  let seansId: string | null = null
  if (body.visitId) {
    const seans = await seansSahibi(supabase, doktorId, String(body.visitId))
    if (!seans || seans.patient_id !== hastaId) {
      return NextResponse.json({ error: 'Muayene bulunamadı.' }, { status: 404 })
    }
    seansId = seans.id
  } else {
    // NOTYA-ARSIV-01: an archived muayene must not be auto-selected as the encounter a new
    // report attaches to — go through arsivsizSeanslar (lib/doktor/arsiv), never a raw read.
    const { data: sonSeans } = await arsivsizSeanslar(supabase, 'id')
      .eq('doctor_id', doktorId)
      .eq('patient_id', hastaId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    seansId = sonSeans?.id ? String(sonSeans.id) : null
  }
  if (!seansId) {
    return NextResponse.json({ error: 'Bu hasta için kayıtlı bir muayene bulunamadı. Önce bir muayene başlatın.' }, { status: 400 })
  }

  // 4) Hasta temel bilgisi — doğrudan şifreli alanlardan, istemciden GELEN ad/doğum tarihi değil.
  const { data: hastaRow } = await supabase
    .from('patients')
    .select('name_encrypted, dob_encrypted, gender_encrypted, notes_encrypted')
    .eq('id', hastaId)
    .eq('doctor_id', doktorId)
    .maybeSingle()

  let adSoyad = 'Hasta'
  try {
    if (hastaRow?.name_encrypted) {
      const p = JSON.parse(decrypt(hastaRow.name_encrypted))
      adSoyad = `${p.ad || ''} ${p.soyad || ''}`.trim() || 'Hasta'
    }
  } catch { /* varsayılan kalır */ }
  let dogumTarihiIso: string | null = null
  try {
    if (hastaRow?.dob_encrypted) dogumTarihiIso = decrypt(hastaRow.dob_encrypted).slice(0, 10)
  } catch { dogumTarihiIso = null }
  let cinsiyetHam: string | null = null
  try {
    if (hastaRow?.gender_encrypted) cinsiyetHam = decrypt(hastaRow.gender_encrypted)
  } catch { cinsiyetHam = null }
  let anneAdi: string | null = null
  let babaAdi: string | null = null
  try {
    if (hastaRow?.notes_encrypted) {
      const notes = JSON.parse(decrypt(hastaRow.notes_encrypted)) as { anneAdi?: unknown; babaAdi?: unknown }
      anneAdi = notes.anneAdi ? String(notes.anneAdi).trim() || null : null
      babaAdi = notes.babaAdi ? String(notes.babaAdi).trim() || null : null
    }
  } catch { /* yok */ }

  const hasta: CocukRaporHasta = { adSoyad, dogumTarihiIso, anneAdi, babaAdi }

  // 5) Değişken alanlar — hekim ayarlar (spec: "Allow doctor to adjust variable fields").
  let degiskenler: IstirahatDegiskenler | KararTarihDegiskenler
  let gunSayisi: number | undefined
  if (tip.id === 'istirahat') {
    const baslangic = /^\d{4}-\d{2}-\d{2}$/.test(String(body.baslangicTarihi || '')) ? String(body.baslangicTarihi) : bugunIso()
    gunSayisi = istirahatGunSinirla(tip, Number(body.gunSayisi))
    degiskenler = { baslangicTarihi: baslangic, gunSayisi }
  } else {
    const tarih = /^\d{4}-\d{2}-\d{2}$/.test(String(body.tarih || '')) ? String(body.tarih) : bugunIso()
    degiskenler = { tarih }
  }

  const gerekce = String(body.hekimGerekcesi || '').trim().slice(0, 1000)
  const kararMetni = cocukRaporuMetniUret(tip, hasta, degiskenler)
  const klinikMetin = gerekce ? `${kararMetni}\n\n${gerekce}` : kararMetni

  // 6) Hekim/klinik bloğu — doktorun kendi profilinden (asla yer tutucu).
  const doktor = await raporDoktorBlogu(supabase, doktorId)
  const tarihIso = tip.id === 'istirahat' ? (degiskenler as IstirahatDegiskenler).baslangicTarihi : (degiskenler as KararTarihDegiskenler).tarih
  const belgeNo = raporBelgeNoUret(tip.id, tarihIso)

  const model = raporBelgesiModeliKur({
    ustBaslik: tip.label,
    altBaslik: 'Çocuk Hasta Raporları',
    belgeNo,
    tarihIso,
    hasta: { ...hasta, cinsiyetHam },
    pediatrikYasBicimi: true,
    klinikBaslik: 'KARAR',
    klinikMetin,
    doktor,
    uyari: UYARI,
    veliGorunsun: veliGerekliMi(hasta),
  })

  let pdf: Buffer
  try {
    pdf = await raporBelgesiPdf(model)
  } catch (e) {
    console.error('[cocuk-rapor] pdf', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'PDF oluşturulamadı.' }, { status: 500 })
  }

  const dosyaAdi = raporDosyaAdi(tip.label, belgeNo)
  try {
    const belge = await uploadDocument(
      { supabase },
      {
        doctorId: doktorId,
        patientId: hastaId,
        visitId: seansId,
        fileName: dosyaAdi,
        fileType: 'application/pdf',
        bytes: pdf,
        notes: gerekce || null,
        category: tip.belgeTuru,
        uploadedBy: doktorId,
      }
    )
    return NextResponse.json({
      ok: true,
      documentId: belge.id,
      dosyaAdi,
      belgeNo,
      tarih: model.tarihGorunum,
      seansId,
      klinikMetin,
      gunSayisi: gunSayisi ?? null,
      bitisTarihi: tip.id === 'istirahat' ? istirahatBitisTarihi((degiskenler as IstirahatDegiskenler).baslangicTarihi, gunSayisi as number) : null,
    })
  } catch (e) {
    if (e instanceof VaultValidationError) return NextResponse.json({ error: e.message }, { status: 400 })
    if (e instanceof VaultAccessError) return NextResponse.json({ error: 'Hasta veya muayene bulunamadı.' }, { status: 404 })
    console.error('[cocuk-rapor] kasa', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Rapor kaydedilemedi.' }, { status: 500 })
  }
}
