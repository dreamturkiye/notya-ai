/**
 * NOTYA-RANDEVU-01 — tekil randevu: güncelle (yeniden planla / durum değiştir), sil.
 *
 * PATCH covers three distinct actions through one endpoint, matched by which fields are sent:
 *   - reschedule: { baslangic, bitis } — re-checks the overlap window, excluding itself
 *   - status change: { durum, iptalNedeni? } — planlandi/onaylandi/tamamlandi/iptal/gelmedi
 *   - edit details: { tur, notlar }
 * Which columns each body touches is decided by randevuGuncellemePlani() (lib/randevu/randevuDurum.ts),
 * a pure function shared with the UI's action gating and covered by tests — a reschedule NEVER
 * touches `durum`, and re-activating a cancelled appointment is an explicit durum change that
 * has to pass the overlap check (the slot may have been re-booked while it was cancelled).
 * DELETE removes the row outright — for a genuine mis-entry, not a real cancellation. A real
 * cancellation is PATCH durum=iptal, which keeps the record (and the reason) instead of erasing
 * it; deleting it would throw away exactly the history a doctor's day-to-day defense depends on.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { otomatikHastaKaydiOlustur } from '@/lib/doktor/otomatikHastaKaydi'
import { randevuCakismasiVarMi, CAKISMA_MESAJI, CAKISMA_KONTROL_HATASI } from '@/lib/randevu/cakisma'
import { randevuGuncellemePlani } from '@/lib/randevu/randevuDurum'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { telefonAlani } from '@/lib/iletisim/cepTelefonu'
import { randevuIletisiminiKaydet } from '@/lib/randevu/hastaIletisimKaydet'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, user, rol, personelId } = oturum

  const { data: mevcut } = await supabase
    .from('randevular')
    .select('id, baslangic, bitis, durum, patient_id, hasta_adi_serbest, hasta_telefon_serbest, hasta_email_serbest')
    .eq('id', params.id)
    .eq('doktor_id', doktorId)
    .maybeSingle()
  if (!mevcut) return NextResponse.json({ error: 'Randevu bulunamadı.' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const { baslangic, bitis, durum, iptalNedeni, tur, notlar, patientId, hastaAdiSerbest, hastaEmailSerbest, hastaDurumu, hastaTelefon, whatsappIzni } = body as {
    baslangic?: string
    bitis?: string
    durum?: string
    iptalNedeni?: string
    tur?: string
    notlar?: string
    hastaDurumu?: string
    patientId?: string
    hastaAdiSerbest?: string
    hastaTelefonSerbest?: string
    hastaEmailSerbest?: string
    /** NOTYA-BETA-0925: kayıtlı hastanın cep telefonu — hasta kaydına yazılır. */
    hastaTelefon?: string
    whatsappIzni?: boolean
  }
  // NOTYA-BETA-0925: yazılan telefon geçerli bir cep numarası olmalı (kayıtsız randevununki de); biçimlenmiş hali saklanır.
  const telefon = telefonAlani(hastaTelefon)
  if ('hata' in telefon) return NextResponse.json({ error: telefon.hata }, { status: 400 })
  const serbestTelefon = telefonAlani(body.hastaTelefonSerbest)
  if ('hata' in serbestTelefon) return NextResponse.json({ error: serbestTelefon.hata }, { status: 400 })
  const hastaTelefonSerbest: string | undefined = body.hastaTelefonSerbest === undefined ? undefined : serbestTelefon.deger ?? ''

  const plan = randevuGuncellemePlani(
    { baslangic: mevcut.baslangic, bitis: mevcut.bitis, durum: mevcut.durum },
    { baslangic, bitis, durum, iptalNedeni, tur, notlar, hastaDurumu }
  )
  if (plan.hata) return NextResponse.json({ error: plan.hata }, { status: 400 })

  if (plan.cakismaKontrolu) {
    // Same predicate as the create route and the Ayşe action layer — lib/randevu/cakisma.ts.
    const cakisma = await randevuCakismasiVarMi(supabase, doktorId, plan.cakismaKontrolu.baslangic, plan.cakismaKontrolu.bitis, params.id)
    if (cakisma.hata) return NextResponse.json({ error: CAKISMA_KONTROL_HATASI }, { status: 500 })
    if (cakisma.cakisiyor) {
      return NextResponse.json(
        {
          error: plan.reaktivasyon
            ? 'Bu saat aralığı iptalden sonra başka bir randevuya verilmiş. Önce saati değiştirin, sonra aktif hale getirin.'
            : CAKISMA_MESAJI,
        },
        { status: 409 }
      )
    }
  }

  const guncelleme: Record<string, unknown> = { ...plan.alanlar }

  // NOTYA-RANDEVU-07: hasta bağlantısını güncelleme.
  //
  //   1. Bir kayıtlı hasta seçildi (patientId geldi) — bu her zaman izinli: var olan gerçek
  //      bir hastaya bağlamak, yoktan yeni bir dosya açmak değildir. Durumdan bağımsız.
  //   2. YENİ bir hasta kaydı (serbest isimden) yalnızca doktor randevuyu ONAYLADIğında /
  //      tamamladığında / gelmedi olarak işaretlediğinde açılır — bu, doktorun randevuyu
  //      GÖRÜP onayladığı an. Sadece yeniden planlama/not düzenleme (durum değişmeden) BiR
  //      hasta dosyası AÇMAZ — dosya sekreterin randevu almasıyla değil, doktorun onayıyla
  //      başlar. ÖNEMLİ: hızlı "Onayla" aksiyonu yalnızca { durum } gönderir — isim/telefon
  //      istekte yoksa VERİTABANINDAKI mevcut satırdan (mevcut.hasta_adi_serbest) alınır.
  //   3. Zaten kayıtlıysa (mevcut.patient_id var) ve patientId gönderilmediyse dokunma.
  //   4. Hiçbir yaratım koşulu oluşmadıysa (hala planlandi, serbest isim düzenleniyor) sadece
  //      serbest metni güncel tut — henüz dosya yok, olmamalı.
  const doktorGercektenIlgilendi = !!durum && ['onaylandi', 'tamamlandi', 'gelmedi'].includes(durum);
  const yeniKayitGerekli =
    !patientId && !mevcut.patient_id && doktorGercektenIlgilendi &&
    (hastaAdiSerbest?.trim() || mevcut.hasta_adi_serbest);

  let yeniHasta: { id: string; ad: string } | null = null

  if (patientId && patientId !== mevcut.patient_id) {
    // HASTA-IZOLASYON-01: "an existing real patient" means THIS practice's patient — never another doctor's.
    if (!(await hastaSahibiMi(supabase, doktorId, patientId))) {
      return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
    }
    guncelleme.patient_id = patientId
    guncelleme.hasta_adi_serbest = null
    guncelleme.hasta_telefon_serbest = null
  } else if (yeniKayitGerekli) {
    const ad = hastaAdiSerbest?.trim() || mevcut.hasta_adi_serbest
    const telefon = hastaTelefonSerbest !== undefined ? hastaTelefonSerbest?.trim() : mevcut.hasta_telefon_serbest
    const olusturulan = await otomatikHastaKaydiOlustur(supabase, doktorId, ad, telefon)
    if (olusturulan) {
      guncelleme.patient_id = olusturulan.id
      guncelleme.hasta_adi_serbest = null
      guncelleme.hasta_telefon_serbest = null
      yeniHasta = { id: olusturulan.id, ad }
    } else if (hastaAdiSerbest !== undefined) {
      // Hasta kaydı açılamadıysa serbest metni yine de güncel tut — randevu güncellemesini bu
      // yüzden engellemek yanlış taraf.
      guncelleme.hasta_adi_serbest = hastaAdiSerbest.trim()
      guncelleme.hasta_telefon_serbest = hastaTelefonSerbest?.trim() || null
      if (hastaEmailSerbest !== undefined) guncelleme.hasta_email_serbest = hastaEmailSerbest?.trim() || null
    }
  } else if (!patientId && !mevcut.patient_id && hastaAdiSerbest !== undefined) {
    guncelleme.hasta_adi_serbest = hastaAdiSerbest?.trim() || null
    guncelleme.hasta_telefon_serbest = hastaTelefonSerbest?.trim() || null
    // Kaan (2026-09-10): düzenlemede yazılan e-posta kaybolmasın — artık kaydediliyor (isteğe bağlı)
    if (hastaEmailSerbest !== undefined) guncelleme.hasta_email_serbest = hastaEmailSerbest?.trim() || null
  }

  const iletisimVar = !!telefon.deger || whatsappIzni === true
  if (Object.keys(guncelleme).length === 0 && !iletisimVar) {
    return NextResponse.json({ error: 'Güncellenecek alan yok.' }, { status: 400 })
  }

  let data: unknown = mevcut
  if (Object.keys(guncelleme).length > 0) {
    const sonuc = await supabase
      .from('randevular')
      .update(guncelleme)
      .eq('id', params.id)
      .eq('doktor_id', doktorId)
      .select()
      .single()
    if (sonuc.error) return NextResponse.json({ error: 'Randevu güncellenemedi.' }, { status: 500 })
    data = sonuc.data
  }

  // NOTYA-BETA-0925: telefon / WhatsApp izni randevunun bağlı olduğu hastaya — yeni bağlanan hasta yukarıda
  // hastaSahibiMi'den geçti; mevcut bağlantı bu doktorun kendi randevu satırından (yazmalar yine doctor_id'li).
  const bagliHasta = (guncelleme.patient_id as string | undefined) || (mevcut.patient_id as string | null)
  const iletisim = bagliHasta && iletisimVar
    ? await randevuIletisiminiKaydet(supabase, { doktorId, patientId: bagliHasta, userId: user.id, rol, personelId, telefon: telefon.deger, whatsappIzni: whatsappIzni === true })
    : null
  return NextResponse.json({ randevu: data, yeniHasta, reaktivasyon: plan.reaktivasyon, iletisim })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const { error } = await supabase
    .from('randevular')
    .delete()
    .eq('id', params.id)
    .eq('doktor_id', doktorId)

  if (error) return NextResponse.json({ error: 'Randevu silinemedi.' }, { status: 500 })
  return NextResponse.json({ silindi: true })
}
