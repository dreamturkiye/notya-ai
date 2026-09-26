import path from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import { Document, Font, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { raporDerle } from '@/lib/doktor/raporDerle'
import { gecerliAralik, sureYazi, type Adet, type GunOlcu, type TaniSatiri } from '@/lib/doktor/raporHesap'
import { contentDispositionAd } from '@/lib/vault/validation'

export const dynamic = 'force-dynamic'

const FONT = 'NotyaRaporSans'
const PINE = '#2f4334'
const INK = '#3b2e24'
const MUTED = '#8b7d70'
const LINE = '#e6dfd2'
const PAPER = '#faf6ee'

let fontKayitli = false
function fontKaydet() {
  if (fontKayitli) return
  Font.register({
    family: FONT,
    fonts: [
      { src: path.join(process.cwd(), 'node_modules/pdfjs-dist/standard_fonts/LiberationSans-Regular.ttf'), fontWeight: 400 },
      { src: path.join(process.cwd(), 'node_modules/pdfjs-dist/standard_fonts/LiberationSans-Bold.ttf'), fontWeight: 700 },
    ],
  })
  Font.registerHyphenationCallback((kelime) => [kelime])
  fontKayitli = true
}

const s = StyleSheet.create({
  page: { padding: 36, paddingBottom: 52, backgroundColor: '#ffffff', fontFamily: FONT, fontSize: 10, color: INK },
  marka: { fontSize: 12, fontWeight: 700, color: PINE },
  baslik: { fontSize: 18, fontWeight: 700, marginTop: 4 },
  sag: { alignItems: 'flex-end' },
  ust: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cizgi: { borderBottomWidth: 2, borderBottomColor: PINE, marginBottom: 14 },
  bolum: { fontSize: 9, fontWeight: 700, color: PINE, marginTop: 12, marginBottom: 6 },
  kartlar: { flexDirection: 'row', flexWrap: 'wrap' },
  kart: { width: '31%', backgroundColor: PAPER, padding: 8, marginRight: 8, marginBottom: 8 },
  sayi: { fontSize: 16, fontWeight: 700, color: PINE },
  etiket: { fontSize: 8, color: MUTED, marginTop: 2 },
  satir: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: LINE, paddingVertical: 4 },
  hucre: { fontSize: 9 },
  okuma: { fontSize: 10, marginBottom: 6 },
  dip: { position: 'absolute', bottom: 20, left: 36, right: 36, fontSize: 8, color: MUTED },
})

function Kart({ deger, ad, alt }: { deger: number; ad: string; alt: string }) {
  return (
    <View style={s.kart}>
      <Text style={s.sayi}>{deger.toLocaleString('tr-TR')}</Text>
      <Text style={s.etiket}>{ad}</Text>
      <Text style={s.etiket}>{alt}</Text>
    </View>
  )
}

function AdetSatir({ oge }: { oge: Adet }) {
  return (
    <View style={s.satir}>
      <Text style={[s.hucre, { width: '78%' }]}>{oge.ad}</Text>
      <Text style={[s.hucre, { width: '22%', textAlign: 'right' }]}>{oge.sayi}</Text>
    </View>
  )
}

function RaporPdf({
  doktor, veri,
}: {
  doktor: string
  veri: Awaited<ReturnType<typeof raporDerle>>
}) {
  const h = veri.hacim
  return (
    <Document title={`Rapor — ${veri.aralikEtiket}`}>
      <Page size="A4" style={s.page}>
        <View style={s.ust}>
          <View>
            <Text style={s.marka}>Notya</Text>
            <Text style={s.baslik}>Raporlar</Text>
          </View>
          <View style={s.sag}>
            <Text style={{ fontSize: 11, fontWeight: 700 }}>{doktor}</Text>
            <Text style={s.etiket}>{veri.aralikEtiket}</Text>
          </View>
        </View>
        <View style={s.cizgi} />

        <Text style={s.bolum}>Hacim</Text>
        <View style={s.kartlar}>
          <Kart deger={h.yeniBuAy} ad="Yeni hasta, bu ay" alt={`geçen ay ${h.yeniGecenAy}`} />
          <Kart deger={h.yeniSon3Ay} ad="Yeni hasta, son 3 ay" alt={`önceki 3 ay ${h.yeniOnceki3Ay}`} />
          <Kart deger={h.aktifHasta} ad="Aktif hasta" alt="toplam" />
          <Kart deger={h.muayeneBuHafta} ad="Muayene, bu hafta" alt={`geçen hafta ${h.muayeneGecenHafta}`} />
          <Kart deger={h.muayeneBuAy} ad="Muayene, bu ay" alt={`geçen ay ${h.muayeneGecenAy}`} />
          <Kart deger={h.muayeneToplam} ad="Muayene, toplam" alt="tüm kayıtlar" />
        </View>

        <Text style={s.bolum}>Gün gün — {veri.aralikEtiket}</Text>
        <Text style={s.okuma}>{veri.okuma}</Text>
        <View style={s.satir}>
          <Text style={[s.hucre, { width: '40%', fontWeight: 700 }]}>Gün</Text>
          <Text style={[s.hucre, { width: '20%', fontWeight: 700, textAlign: 'right' }]}>Muayene</Text>
          <Text style={[s.hucre, { width: '20%', fontWeight: 700, textAlign: 'right' }]}>Ortalama</Text>
          <Text style={[s.hucre, { width: '20%', fontWeight: 700, textAlign: 'right' }]}>Koltuk</Text>
        </View>
        {veri.gunler.map((g: GunOlcu) => (
          <View key={g.ad} style={s.satir}>
            <Text style={[s.hucre, { width: '40%' }]}>{g.ad}</Text>
            <Text style={[s.hucre, { width: '20%', textAlign: 'right' }]}>{g.sayi}</Text>
            <Text style={[s.hucre, { width: '20%', textAlign: 'right' }]}>{g.ortalamaDk == null ? '—' : `${g.ortalamaDk} dk`}</Text>
            <Text style={[s.hucre, { width: '20%', textAlign: 'right' }]}>{g.koltukDk == null ? '—' : sureYazi(g.koltukDk)}</Text>
          </View>
        ))}

        <Text style={s.bolum}>Muayene tipi</Text>
        {veri.tipler.map((t) => <AdetSatir key={t.ad} oge={t} />)}

        <Text style={s.bolum}>En sık yakınma</Text>
        {veri.yakinmalar.length === 0 ? <Text style={s.etiket}>Bu aralıkta yakınma yok.</Text> : veri.yakinmalar.map((t) => <AdetSatir key={t.ad} oge={t} />)}

        <Text style={s.bolum}>En sık tanı</Text>
        {veri.tanilar.length === 0 ? <Text style={s.etiket}>Bu aralıkta tanı yok.</Text> : veri.tanilar.map((t: TaniSatiri) => (
          <View key={t.kod} style={s.satir}>
            <Text style={[s.hucre, { width: '18%' }]}>{t.kod}</Text>
            <Text style={[s.hucre, { width: '64%' }]}>{t.ad}</Text>
            <Text style={[s.hucre, { width: '18%', textAlign: 'right' }]}>{t.sayi}</Text>
          </View>
        ))}

        <Text style={s.bolum}>İşin dökümü</Text>
        <AdetSatir oge={{ ad: 'Onaylanan not', sayi: veri.onaylanan }} />
        <AdetSatir oge={{ ad: 'Onay bekleyen', sayi: veri.bekleyen }} />
        <View style={s.satir}>
          <Text style={[s.hucre, { width: '78%' }]}>Tartılı ortalama süre</Text>
          <Text style={[s.hucre, { width: '22%', textAlign: 'right' }]}>{veri.tartiliOrtalamaDk == null ? '—' : `${veri.tartiliOrtalamaDk} dk`}</Text>
        </View>
        {veri.notTurleri.map((t) => <AdetSatir key={t.ad} oge={{ ad: `Not türü — ${t.ad}`, sayi: t.sayi }} />)}
        {veri.ilaclar.map((t) => <AdetSatir key={t.ad} oge={{ ad: t.ad, sayi: t.sayi }} />)}

        <Text style={s.dip} fixed>Notya. Hasta adı ve kimlik bu raporda yok.</Text>
      </Page>
    </Document>
  )
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  try {
    const body = await req.json().catch(() => ({})) as { aralik?: string }
    const aralik = gecerliAralik(body?.aralik)
    const veri = await raporDerle(oturum.supabase, oturum.user.id, aralik)
    const { data: doktor } = await oturum.supabase.from('users').select('full_name').eq('id', oturum.user.id).maybeSingle()
    fontKaydet()
    const buffer = await renderToBuffer(<RaporPdf doktor={String(doktor?.full_name || 'Doktor')} veri={veri} />)
    const dosya = `rapor-${aralik}.pdf`
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; ' + contentDispositionAd(dosya),
      },
    })
  } catch (error) {
    console.error('PDF rapor hatası:', error)
    return NextResponse.json({ error: 'PDF indirilemedi' }, { status: 500 })
  }
}
