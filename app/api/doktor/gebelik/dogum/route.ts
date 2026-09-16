/**
 * NOTYA-KD-02 — Obstetrics spine API (kadın-doğum). One route, adim-based; every write is a doctor action.
 * adim:
 *  gorevleri_olustur {gebelikId, rhNegatif?, gbsToggle?, klinikHivVdrl?, papGerekli?}  → (re)generate tasks from SAT/TDT (idempotent per kod)
 *  gorev {gorevId, durum: tamam|atlandi|bekliyor, belgeId?, not?}
 *  onam {gebelikId?, sablonKodu, ekKutu?, hastaOnayladi, not?}           → onamlar (template snapshot) + Belgeler note
 *  dogum_baslat {gebelikId}                                               → dogum_olaylari (travay)
 *  partograf {dogumId, satir:{zaman, servikal_acilma, …}}
 *  fetal_distres {dogumId, ktg_patern, mekonyum, aksiyon}
 *  cs_karar {dogumId, endikasyon: string[], not?}                         → cs_karar_at + endikasyon (doctor-selected)
 *  preop|intraop|postop|ssvd|preterm|pph {dogumId, veri}                  → jsonb sections
 *  dogum_kaydet {dogumId, dogumSekli, dogumZamani, canli, bebekler:[{cinsiyet, kilo, apgar1, apgar5, hafta, komplikasyonlar}]}
 *      → live birth creates a bebek patient (this doctor's roster) + bebek_kartlari with tasks (pediatri owns after)
 *  komplikasyon {dogumId, kime, ad, ayrinti?, acil?}
 *  lohusa_ziyaret {dogumId, kod, not}
 *  taburcu {dogumId, bebekId?, maddeler, istisna?, kapat?}               → gate: NTP-1/HepB-1/VitK/işitme OR documented exception
 *  bebek_tarama {bebekId, alan, deger}                                    → yenidogan_tarama + gorevler
 * GET ?gebelikId= → tasks (status recomputed), onamlar, dogum event, partograf, komplikasyonlar, bebekler, taburcu
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { encrypt, decrypt } from '@/lib/security/encryption'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { gorevleriUret, gorevDurumu, ONAM_KUTUPHANESI, CS_ENDIKASYONLARI, taburcuKurali, bebekGorevleri, pphKarti, partografUyari, LOHUSA_ZIYARETLERI, type Gorev, type TaburcuChecklist, type TaburcuIstisna } from '@/specialties/kadin-dogum/engines/dogum-spine'
import { baglaLohusaVeTakvim } from '@/lib/doktor/yenidoganKayit'
import { pretermOrLbw } from '@/lib/clinical/yenidogan'

export const dynamic = 'force-dynamic'
const bugun = () => new Date().toISOString().slice(0, 10)

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!b?.adim) return NextResponse.json({ error: 'adim gerekli' }, { status: 400 })
  const adim = String(b.adim)

  const gebelikAl = async (id: unknown) => { const { data } = await sb.from('gebelikler').select('id, patient_id, sat, tdt, kan_grubu, durum').eq('id', String(id || '')).eq('doctor_id', user.id).maybeSingle(); return data }
  const dogumAl = async (id: unknown) => { const { data } = await sb.from('dogum_olaylari').select('*').eq('id', String(id || '')).eq('doctor_id', user.id).maybeSingle(); return data }

  if (adim === 'gorevleri_olustur') {
    const g = await gebelikAl(b.gebelikId); if (!g) return NextResponse.json({ error: 'Gebelik bulunamadı' }, { status: 404 })
    const rhNeg = typeof b.rhNegatif === 'boolean' ? b.rhNegatif : /-|neg/i.test(String(g.kan_grubu || ''))
    const gorevler = gorevleriUret({ sat: g.sat, tdt: g.tdt, rhNegatif: rhNeg, gbsToggle: b.gbsToggle !== false, klinikHivVdrl: b.klinikHivVdrl !== false, papGerekli: !!b.papGerekli })
    if (!gorevler.length) return NextResponse.json({ error: 'SAT veya TDT olmadan görev üretilemez' }, { status: 400 })
    const { error } = await sb.from('gebelik_gorevleri').upsert(gorevler.map((x: Gorev) => ({ gebelik_id: g.id, patient_id: g.patient_id, doctor_id: user.id, kod: x.kod, ad: x.ad, tur: x.tur, hedef_baslangic: x.hedefBaslangic, hedef_bitis: x.hedefBitis, sert: !!x.sert, kacirilinca: x.kacirilinca || null })), { onConflict: 'gebelik_id,kod', ignoreDuplicates: true })
    if (error) return NextResponse.json({ error: 'Görevler yazılamadı' }, { status: 500 })
    return NextResponse.json({ ok: true, adet: gorevler.length })
  }

  if (adim === 'gorev') {
    const durum = String(b.durum || '')
    if (!['tamam', 'atlandi', 'bekliyor'].includes(durum)) return NextResponse.json({ error: 'durum geçersiz' }, { status: 400 })
    const { error } = await sb.from('gebelik_gorevleri').update({ durum, tamam_at: durum === 'tamam' ? new Date().toISOString() : null, belge_id: b.belgeId ? String(b.belgeId) : null, not_metni: b.not ? String(b.not).slice(0, 500) : null }).eq('id', String(b.gorevId || '')).eq('doctor_id', user.id)
    if (error) return NextResponse.json({ error: 'Görev güncellenemedi' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (adim === 'onam') {
    const s = ONAM_KUTUPHANESI.find((o) => o.kod === String(b.sablonKodu || ''))
    if (!s) return NextResponse.json({ error: 'Onam şablonu bulunamadı' }, { status: 400 })
    let patientId = b.patientId ? String(b.patientId) : null
    if (b.gebelikId) { const g = await gebelikAl(b.gebelikId); if (!g) return NextResponse.json({ error: 'Gebelik bulunamadı' }, { status: 404 }); patientId = g.patient_id }
    if (!patientId) return NextResponse.json({ error: 'patientId veya gebelikId gerekli' }, { status: 400 })
    const { data: hasta } = await sb.from('patients').select('id').eq('id', patientId).eq('doctor_id', user.id).maybeSingle()
    if (!hasta) return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 })
    const onayli = b.hastaOnayladi === true
    const { data, error } = await sb.from('onamlar').insert({ patient_id: patientId, doctor_id: user.id, gebelik_id: b.gebelikId ? String(b.gebelikId) : null, sablon_kodu: s.kod, sablon_adi: s.ad, icerik: { maddeler: s.maddeler, riskler: s.riskler, ekKutu: s.ekKutu || null }, ek_kutu_isaretli: !!b.ekKutu, hasta_onayladi: onayli, onay_at: onayli ? new Date().toISOString() : null, not_metni: b.not ? String(b.not).slice(0, 500) : null }).select('id').single()
    if (error || !data) return NextResponse.json({ error: 'Onam kaydedilemedi' }, { status: 500 })
    if (onayli) { const ek = await gununNotunaEkle(sb, user.id, patientId, `Onam alındı: ${s.ad}${b.ekKutu ? ' (+ tüp ligasyonu kutusu işaretli)' : ''} — ${new Date().toLocaleDateString('tr-TR')}`); if (b.gebelikId && ek.eklendi) { /* task auto-complete for matching onam kod */ const kodMap: Record<string, string> = { gebelik_takibi: 'onam_takip', nt_11_14: 'onam_nt', ayrintili_usg: 'onam_ayrintili', vajinal_dogum: 'onam_dogum', sezaryen: 'onam_dogum', ssvd: 'onam_dogum' }; const gk = kodMap[s.kod]; if (gk) await sb.from('gebelik_gorevleri').update({ durum: 'tamam', tamam_at: new Date().toISOString() }).eq('gebelik_id', String(b.gebelikId)).eq('kod', gk) } }
    return NextResponse.json({ ok: true, onamId: data.id })
  }

  if (adim === 'dogum_baslat') {
    const g = await gebelikAl(b.gebelikId); if (!g) return NextResponse.json({ error: 'Gebelik bulunamadı' }, { status: 404 })
    const { data: mevcut } = await sb.from('dogum_olaylari').select('id').eq('gebelik_id', g.id).neq('durum', 'kapandi').maybeSingle()
    if (mevcut) return NextResponse.json({ ok: true, dogumId: mevcut.id, zaten: true })
    const { data, error } = await sb.from('dogum_olaylari').insert({ gebelik_id: g.id, patient_id: g.patient_id, doctor_id: user.id, durum: 'travay', travay_baslangic: new Date().toISOString() }).select('id').single()
    if (error || !data) return NextResponse.json({ error: 'Travay açılamadı' }, { status: 500 })
    return NextResponse.json({ ok: true, dogumId: data.id })
  }

  const d = adim !== 'bebek_tarama' ? await dogumAl(b.dogumId) : null
  if (adim !== 'bebek_tarama' && !d) return NextResponse.json({ error: 'Doğum kaydı bulunamadı' }, { status: 404 })
  const guncelle = async (alanlar: Record<string, unknown>) => { const { error } = await sb.from('dogum_olaylari').update({ ...alanlar, updated_at: new Date().toISOString() }).eq('id', d!.id); return error }

  if (adim === 'partograf') {
    const s = (b.satir || {}) as Record<string, unknown>
    const num = (v: unknown) => (v === '' || v == null ? null : Number.isFinite(Number(v)) ? Number(v) : null)
    const { error } = await sb.from('travay_partograf').insert({ dogum_id: d!.id, doctor_id: user.id, zaman: s.zaman ? new Date(String(s.zaman)).toISOString() : new Date().toISOString(), servikal_acilma: num(s.servikal_acilma), inis: s.inis ? String(s.inis) : null, kasilma_10dk: num(s.kasilma_10dk), kasilma_sure: num(s.kasilma_sure), fetal_kalp: num(s.fetal_kalp), anne_nabiz: num(s.anne_nabiz), ta_sistolik: num(s.ta_sistolik), ta_diastolik: num(s.ta_diastolik), ates: num(s.ates), idrar: s.idrar ? String(s.idrar) : null, amniyon: s.amniyon ? String(s.amniyon) : null, oksitosin: num(s.oksitosin), ilac: s.ilac ? String(s.ilac) : null, not_metni: s.not ? String(s.not).slice(0, 300) : null })
    if (error) return NextResponse.json({ error: 'Partograf satırı yazılamadı' }, { status: 500 })
    const { data: rows } = await sb.from('travay_partograf').select('zaman, servikal_acilma').eq('dogum_id', d!.id)
    return NextResponse.json({ ok: true, uyari: partografUyari((rows || []).map((r) => ({ zaman: r.zaman, servikal_acilma: r.servikal_acilma == null ? null : Number(r.servikal_acilma) }))) })
  }
  if (adim === 'fetal_distres') { const e = await guncelle({ fetal_distres: { ktg_patern: b.ktg_patern || null, mekonyum: !!b.mekonyum, aksiyon: b.aksiyon || null, zaman: new Date().toISOString() } }); return e ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true }) }
  if (adim === 'cs_karar') {
    const end = (Array.isArray(b.endikasyon) ? b.endikasyon : []).map(String).filter((x) => CS_ENDIKASYONLARI.includes(x))
    if (!end.length) return NextResponse.json({ error: 'En az bir endikasyon seçin (hekim seçer; asistan yazmaz).' }, { status: 400 })
    const e = await guncelle({ cs_karar_at: new Date().toISOString(), cs_endikasyon: end, cs_endikasyon_not: b.not ? String(b.not).slice(0, 500) : null, durum: 'dogum' })
    return e ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }
  if (['preop', 'intraop', 'postop', 'ssvd', 'preterm'].includes(adim)) {
    const veri = (b.veri || {}) as Record<string, unknown>
    const mevcut = (d as Record<string, unknown>)[adim] as Record<string, unknown> | null
    const e = await guncelle({ [adim]: adim === 'postop' ? { ...(mevcut || {}), ...veri } : veri })
    return e ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }
  if (adim === 'pph') {
    const ml = b.tahmin_ml == null || b.tahmin_ml === '' ? null : Number(b.tahmin_ml)
    const k = pphKarti(ml)
    const e = await guncelle({ pph: { tahmin_ml: ml, uterotonik: b.uterotonik ? String(b.uterotonik) : null, histerektomi: !!b.histerektomi, acil: k.acil, siniflama: k.siniflama } })
    if (!e && k.acil) await sb.from('komplikasyonlar').insert({ dogum_id: d!.id, patient_id: d!.patient_id, doctor_id: user.id, kime: 'anne', ad: 'Uterin atoni / PPH', ayrinti: `${k.siniflama}${b.uterotonik ? ` — uterotonik: ${b.uterotonik}` : ''}`, acil: true })
    return e ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true, acil: k.acil, siniflama: k.siniflama })
  }
  if (adim === 'komplikasyon') {
    const kime = b.kime === 'bebek' ? 'bebek' : 'anne'
    const { error } = await sb.from('komplikasyonlar').insert({ dogum_id: d!.id, patient_id: d!.patient_id, doctor_id: user.id, kime, ad: String(b.ad || '').slice(0, 120), ayrinti: b.ayrinti ? String(b.ayrinti).slice(0, 500) : null, acil: !!b.acil })
    if (error) return NextResponse.json({ error: 'Yazılamadı' }, { status: 500 })
    if (kime === 'bebek' && b.bebekId) { const { data: bk } = await sb.from('bebek_kartlari').select('komplikasyonlar').eq('id', String(b.bebekId)).maybeSingle(); if (bk) await sb.from('bebek_kartlari').update({ komplikasyonlar: [...(bk.komplikasyonlar || []), String(b.ad)] }).eq('id', String(b.bebekId)) }
    return NextResponse.json({ ok: true })
  }
  if (adim === 'dogum_kaydet') {
    const canli = b.canli !== false
    const sekil = String(b.dogumSekli || 'nsd')
    const dogumZamani = b.dogumZamani ? new Date(String(b.dogumZamani)).toISOString() : new Date().toISOString()
    const e = await guncelle({ dogum_sekli: sekil, dogum_zamani: dogumZamani, canli_dogum: canli, durum: 'lohusa' })
    if (e) return NextResponse.json({ error: 'Doğum kaydedilemedi' }, { status: 500 })
    await sb.from('gebelikler').update({ durum: canli ? 'dogum_yapti' : 'olu_dogum', dogum_tarihi: dogumZamani.slice(0, 10) }).eq('id', d!.gebelik_id)
    const bebekler = (Array.isArray(b.bebekler) ? b.bebekler : [{}]) as Record<string, unknown>[]
    const olusan: string[] = []
    for (let i = 0; i < bebekler.length; i++) {
      const bb = bebekler[i]
      const cins = bb.cinsiyet === 'E' ? 'E' : bb.cinsiyet === 'K' ? 'K' : null
      const hafta = Number(bb.hafta) || 40, kilo = bb.kilo == null || bb.kilo === '' ? null : Number(bb.kilo)
      const komp = Array.isArray(bb.komplikasyonlar) ? bb.komplikasyonlar.map(String) : []
      let bebekPatientId: string | null = null
      if (canli) {
        // Live birth → Bebek kartı + a patient record in this doctor's roster (pediatri owns the baby after)
        const { data: anne } = await sb.from('patients').select('name_encrypted').eq('id', d!.patient_id).maybeSingle()
        let anneAd = 'Anne'; try { anneAd = anne?.name_encrypted ? ((JSON.parse(decrypt(String(anne.name_encrypted))) as { ad?: string }).ad || 'Anne') : 'Anne' } catch { anneAd = 'Anne' }
        const bebekAd = `${anneAd.split(' ')[0]} Bebeği${bebekler.length > 1 ? ` ${i + 1}` : ''}`
        const { data: bp } = await sb.from('patients').insert({ doctor_id: user.id, name_encrypted: encrypt(JSON.stringify({ ad: bebekAd })), dob_encrypted: encrypt(dogumZamani.slice(0, 10)), gender_encrypted: cins ? encrypt(cins === 'E' ? 'Erkek' : 'Kız') : null, is_active: true }).select('id').single()
        bebekPatientId = bp?.id || null
      }
      const gorevler = bebekGorevleri({ hafta, kiloGram: kilo, cinsiyet: cins, komplikasyonlar: komp, canli }).map((g) => ({ ...g, tamam: false }))
      const { data: bk } = await sb.from('bebek_kartlari').insert({ dogum_id: d!.id, gebelik_id: d!.gebelik_id, anne_patient_id: d!.patient_id, bebek_patient_id: bebekPatientId, doctor_id: user.id, sira: i + 1, cinsiyet: cins, dogum_zamani: dogumZamani, gebelik_haftasi: hafta, kilo_gram: kilo, apgar1: bb.apgar1 == null || bb.apgar1 === '' ? null : Number(bb.apgar1), apgar5: bb.apgar5 == null || bb.apgar5 === '' ? null : Number(bb.apgar5), canli, gorevler, komplikasyonlar: komp, erkek_ek: cins === 'E' ? { sunnet_onam_id: null, uroloji_gorevi: komp.some((k) => /hipospadias|inmemiş/i.test(k)) } : null }).select('id').single()
      if (bk) { olusan.push(bk.id); if (canli) await sb.from('taburcu_checklist').insert({ dogum_id: d!.id, bebek_id: bk.id, doctor_id: user.id, maddeler: {} }) }
      if (canli && bebekPatientId && bk) {
        await sb.from('gebelikler').update({ yenidogan_patient_id: bebekPatientId }).eq('id', d!.gebelik_id)
        await baglaLohusaVeTakvim(sb, {
          doktorId: user.id,
          bebekId: bebekPatientId,
          anneId: d!.patient_id,
          dogumId: d!.id,
          dogumAt: dogumZamani,
          preterm: pretermOrLbw({ gestHafta: hafta, kiloGram: kilo }),
          gkdRisk: false,
        })
      }
      for (const k of komp) await sb.from('komplikasyonlar').insert({ dogum_id: d!.id, patient_id: d!.patient_id, doctor_id: user.id, kime: 'bebek', ad: k, acil: /asfiksi|distosi/i.test(k) })
    }
    await gununNotunaEkle(sb, user.id, d!.patient_id, `Doğum: ${sekil.toUpperCase()} — ${new Date(dogumZamani).toLocaleString('tr-TR')} — ${canli ? `${bebekler.length} canlı bebek` : 'ölü doğum'}${d!.cs_endikasyon?.length ? ` — C/S endikasyon (hekim): ${d!.cs_endikasyon.join(', ')}` : ''}`)
    return NextResponse.json({ ok: true, bebekIds: olusan })
  }
  if (adim === 'lohusa_ziyaret') {
    const z = LOHUSA_ZIYARETLERI.find((x) => x.kod === String(b.kod || ''))
    if (!z) return NextResponse.json({ error: 'Ziyaret kodu geçersiz' }, { status: 400 })
    const mevcut = ((d as Record<string, unknown>).lohusa as { ziyaretler?: unknown[] } | null)?.ziyaretler || []
    const e = await guncelle({ lohusa: { ziyaretler: [...mevcut.filter((v) => (v as { kod: string }).kod !== z.kod), { kod: z.kod, ad: z.ad, tarih: new Date().toISOString(), not: b.not ? String(b.not).slice(0, 500) : null }] } })
    return e ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }
  if (adim === 'taburcu') {
    const maddeler = (b.maddeler || {}) as Partial<TaburcuChecklist>
    const istisna = (b.istisna && typeof b.istisna === 'object' ? b.istisna : null) as TaburcuIstisna
    const kural = taburcuKurali(maddeler, istisna)
    const kapat = b.kapat === true
    if (kapat && !kural.kapatilabilir) return NextResponse.json({ error: `Taburcu kapatılamaz — eksik: ${kural.zorunluEksik.join(', ')}. Belgelenmiş istisna (red / erken taburcu / sevk, ≥10 karakter açıklama) gerekir.`, kural }, { status: 409 })
    const q = sb.from('taburcu_checklist').select('id').eq('dogum_id', d!.id)
    const { data: mevcut } = b.bebekId ? await q.eq('bebek_id', String(b.bebekId)).maybeSingle() : await q.is('bebek_id', null).maybeSingle()
    const alanlar = { maddeler, istisna, kapatildi: kapat, kapatildi_at: kapat ? new Date().toISOString() : null, updated_at: new Date().toISOString() }
    const { error } = mevcut ? await sb.from('taburcu_checklist').update(alanlar).eq('id', mevcut.id) : await sb.from('taburcu_checklist').insert({ dogum_id: d!.id, bebek_id: b.bebekId ? String(b.bebekId) : null, doctor_id: user.id, ...alanlar })
    if (error) return NextResponse.json({ error: 'Yazılamadı' }, { status: 500 })
    if (kapat) { await guncelle({ durum: 'taburcu' }); await gununNotunaEkle(sb, user.id, d!.patient_id, `Taburcu: kontrol listesi tamamlandı${istisna ? ` (istisna: ${istisna.tur} — ${istisna.aciklama})` : ''}${kural.onerilenEksik.length ? ` — önerilen eksikler: ${kural.onerilenEksik.join(', ')}` : ''}`) }
    return NextResponse.json({ ok: true, kural })
  }
  if (adim === 'bebek_tarama') {
    const { data: bk } = await sb.from('bebek_kartlari').select('id, yenidogan_tarama, gorevler').eq('id', String(b.bebekId || '')).eq('doctor_id', user.id).maybeSingle()
    if (!bk) return NextResponse.json({ error: 'Bebek kartı bulunamadı' }, { status: 404 })
    const alan = String(b.alan || ''); const deger = b.deger
    const tarama = { ...(bk.yenidogan_tarama || {}), [alan]: deger }
    const gorevler = (bk.gorevler || []).map((g: { kod: string; tamam?: boolean }) => (g.kod === alan ? { ...g, tamam: deger === true || (typeof deger === 'string' && deger !== '') } : g))
    const { error } = await sb.from('bebek_kartlari').update({ yenidogan_tarama: tarama, gorevler }).eq('id', bk.id)
    return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Geçersiz adim' }, { status: 400 })
}

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const gebelikId = req.nextUrl.searchParams.get('gebelikId')
  if (!gebelikId) return NextResponse.json({ error: 'gebelikId gerekli' }, { status: 400 })
  const { data: g } = await sb.from('gebelikler').select('id, patient_id, sat, tdt, kan_grubu, durum').eq('id', gebelikId).eq('doctor_id', user.id).maybeSingle()
  if (!g) return NextResponse.json({ error: 'Gebelik bulunamadı' }, { status: 404 })
  const [{ data: gorevler }, { data: onamlar }, { data: dogum }] = await Promise.all([
    sb.from('gebelik_gorevleri').select('*').eq('gebelik_id', g.id).order('hedef_baslangic'),
    sb.from('onamlar').select('id, sablon_kodu, sablon_adi, ek_kutu_isaretli, hasta_onayladi, onay_at, created_at').eq('patient_id', g.patient_id).eq('doctor_id', user.id).order('created_at', { ascending: false }),
    sb.from('dogum_olaylari').select('*').eq('gebelik_id', g.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])
  const t = bugun()
  const gorevlerDurumlu = (gorevler || []).map((x) => ({ ...x, durum: gorevDurumu({ ...x, hedefBaslangic: x.hedef_baslangic, hedefBitis: x.hedef_bitis } as unknown as Gorev, t, x.durum === 'tamam', x.durum === 'atlandi') }))
  let partograf: unknown[] = [], komplikasyonlar: unknown[] = [], bebekler: unknown[] = [], taburcu: unknown[] = [], partografUyarisi = null
  if (dogum) {
    const [p, k, bb, tc] = await Promise.all([
      sb.from('travay_partograf').select('*').eq('dogum_id', dogum.id).order('zaman'),
      sb.from('komplikasyonlar').select('*').eq('dogum_id', dogum.id).order('zaman'),
      sb.from('bebek_kartlari').select('*').eq('dogum_id', dogum.id).order('sira'),
      sb.from('taburcu_checklist').select('*').eq('dogum_id', dogum.id),
    ])
    partograf = p.data || []; komplikasyonlar = k.data || []; bebekler = bb.data || []; taburcu = tc.data || []
    partografUyarisi = partografUyari((p.data || []).map((r) => ({ zaman: r.zaman, servikal_acilma: r.servikal_acilma == null ? null : Number(r.servikal_acilma) })))
  }
  return NextResponse.json({ gebelik: g, gorevler: gorevlerDurumlu, onamlar: onamlar || [], dogum, partograf, partografUyarisi, komplikasyonlar, bebekler, taburcu, kutuphane: { onam: ONAM_KUTUPHANESI.map((o) => ({ kod: o.kod, ad: o.ad, olay: o.olay, ekKutu: o.ekKutu || null })), csEndikasyon: CS_ENDIKASYONLARI, lohusa: LOHUSA_ZIYARETLERI } })
}
