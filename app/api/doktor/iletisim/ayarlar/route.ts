/**
 * NOTYA-ILETISIM-01 / 02 — Ayarlar › İletişim: the doctor's OWN WhatsApp number and email, and where emails open.
 *
 * GET → { whatsapp, eposta, epostaAcilis, kaydedilebilir, muayenehane, muayenehaneTelefon, varsayilanTelefon, gorunenTelefon }
 *       pre-filled from the profile until the doctor saves their own values.
 * PUT { whatsapp?, eposta?, epostaAcilis?, muayenehane?, muayenehaneTelefon?, varsayilanTelefon? }
 *
 * Ofis telefonu yazılınca görünen varsayılan onu izler (varsayilanTelefon null).
 * Hekim varsayılanı ofisten farklı bir numaraya çekerse o numara saklanır.
 *
 * Doctor only (a secretary never edits the practice's accounts). No patient data.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { doktorIletisimAyari, muayenehaneHatti, muayenehaneTelefonAyari, tabloYokMu } from '@/lib/iletisim/sunucu'
import { epostaAdresi, whatsappNumarasi } from '@/lib/iletisim/baglantilar'
import { ofisTelefonAlani } from '@/lib/iletisim/cepTelefonu'
import { epostaAcilisMi } from '@/lib/iletisim/tipler'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const yasak = sadeceDoktor(oturum)
  if (yasak) return yasak
  const a = await doktorIletisimAyari(oturum.supabase, oturum.doktorId)
  const hat = await muayenehaneHatti(oturum.supabase, oturum.doktorId)
  const tel = await muayenehaneTelefonAyari(oturum.supabase, oturum.doktorId)
  return NextResponse.json({
    whatsapp: a.whatsapp,
    eposta: a.eposta,
    epostaAcilis: a.epostaAcilis,
    kaydedilebilir: a.kaydedilebilir,
    muayenehane: hat.numara,
    muayenehaneBagli: hat.bagli,
    muayenehaneKaydedilebilir: hat.kaydedilebilir,
    muayenehaneTelefon: tel.muayenehaneTelefon,
    varsayilanTelefon: tel.varsayilanTelefon,
    gorunenTelefon: tel.gorunenTelefon,
    telefonKaydedilebilir: tel.kaydedilebilir,
  })
}

export async function PUT(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const yasak = sadeceDoktor(oturum)
  if (yasak) return yasak
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!b) return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })

  const g: Record<string, string | null> = {}
  if ('whatsapp' in b) {
    const ham = String(b.whatsapp || '').trim()
    if (ham && !whatsappNumarasi(ham)) return NextResponse.json({ error: 'WhatsApp numarası anlaşılamadı. Örnek: 0532 123 45 67' }, { status: 400 })
    g.iletisim_whatsapp = ham || null
  }
  if ('eposta' in b) {
    const ham = String(b.eposta || '').trim()
    if (ham && !epostaAdresi(ham)) return NextResponse.json({ error: 'E-posta adresi anlaşılamadı.' }, { status: 400 })
    g.iletisim_eposta = ham || null
  }
  if ('epostaAcilis' in b) {
    if (!epostaAcilisMi(b.epostaAcilis)) return NextResponse.json({ error: 'Geçersiz seçim.' }, { status: 400 })
    g.iletisim_eposta_acilis = b.epostaAcilis
  }
  let muayenehane: string | null = null
  if ('muayenehane' in b) {
    const ham = String(b.muayenehane || '').trim()
    if (ham && !whatsappNumarasi(ham)) return NextResponse.json({ error: 'WhatsApp numarası anlaşılamadı. Örnek: 0532 123 45 67' }, { status: 400 })
    muayenehane = ham || null
  }

  let ofisYaz: string | null | undefined
  let varsayilanYaz: string | null | undefined
  if ('muayenehaneTelefon' in b) {
    const ofis = ofisTelefonAlani(b.muayenehaneTelefon)
    if ('hata' in ofis) return NextResponse.json({ error: ofis.hata }, { status: 400 })
    ofisYaz = ofis.deger
  }
  if ('varsayilanTelefon' in b || 'muayenehaneTelefon' in b) {
    // Görünen varsayılan: ofisle aynı veya boş → NULL (ofisi izle); farklıysa sakla.
    const ofisHam = 'muayenehaneTelefon' in b
      ? String((ofisYaz ?? '') || '')
      : String((await muayenehaneTelefonAyari(oturum.supabase, oturum.doktorId)).muayenehaneTelefon || '')
    if ('varsayilanTelefon' in b) {
      const v = ofisTelefonAlani(b.varsayilanTelefon)
      if ('hata' in v) return NextResponse.json({ error: v.hata }, { status: 400 })
      const aday = v.deger || ''
      varsayilanYaz = !aday || aday === ofisHam ? null : aday
    } else if ('muayenehaneTelefon' in b) {
      // Ofis güncellenirken özel varsayılan yoksa dokunma (NULL kalır → ofisi izler).
      // Özel varsayılan ofisin eski değerine eşitse temizle — yeni ofisi izlesin.
      const mevcut = await muayenehaneTelefonAyari(oturum.supabase, oturum.doktorId)
      if (mevcut.varsayilanTelefon && mevcut.varsayilanTelefon === mevcut.muayenehaneTelefon) {
        varsayilanYaz = null
      }
    }
  }

  if (!Object.keys(g).length && !('muayenehane' in b) && ofisYaz === undefined && varsayilanYaz === undefined) {
    return NextResponse.json({ ok: true })
  }

  if (Object.keys(g).length) {
    const { error } = await oturum.supabase.from('users').update(g).eq('id', oturum.doktorId)
    if (error) return NextResponse.json({ error: 'Ayarlar şu an kaydedilemiyor. Lütfen biraz sonra yeniden deneyin.' }, { status: 503 })
  }
  if ('muayenehane' in b) {
    const { error } = await oturum.supabase.from('users').update({ iletisim_whatsapp_muayenehane: muayenehane }).eq('id', oturum.doktorId)
    if (error) {
      if (tabloYokMu(error)) return NextResponse.json({ ok: true, muayenehaneKaydedilebilir: false })
      return NextResponse.json({ error: 'Ayarlar şu an kaydedilemiyor. Lütfen biraz sonra yeniden deneyin.' }, { status: 503 })
    }
  }
  if (ofisYaz !== undefined || varsayilanYaz !== undefined) {
    const telG: Record<string, string | null> = {}
    if (ofisYaz !== undefined) telG.iletisim_telefon_muayenehane = ofisYaz
    if (varsayilanYaz !== undefined) telG.iletisim_telefon_varsayilan = varsayilanYaz
    const { error } = await oturum.supabase.from('users').update(telG).eq('id', oturum.doktorId)
    if (error) {
      if (tabloYokMu(error)) return NextResponse.json({ ok: true, telefonKaydedilebilir: false })
      return NextResponse.json({ error: 'Ayarlar şu an kaydedilemiyor. Lütfen biraz sonra yeniden deneyin.' }, { status: 503 })
    }
  }
  return NextResponse.json({ ok: true })
}
