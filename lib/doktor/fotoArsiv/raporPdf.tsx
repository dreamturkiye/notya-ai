/**
 * FOTO-ARSIV-01 (g) — "Fotoğraf raporu": a clean PDF of selected clinical photos for a referral letter or a file copy.
 * Pattern and font as lib/asi/karnePdf.tsx (@react-pdf/renderer, embedded Liberation Sans for Turkish glyphs) — no new dependency.
 *
 * The images are rendered ON THE DEVICE (with the doctor's adjustments and annotations drawn in, EXIF-free, ~900 px JPEG), so
 * the server needs no image library and the request stays under the 4.5 MB serverless body limit. Dates, region, tags, notes
 * come from the server's own metadata rows, never from the client, and the interval text is computed here.
 * The report carries no AI text: it is the doctor's own record.
 */
import path from 'node:path'
import React from 'react'
import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer'

export const RAPOR_FONT = 'NotyaFotoRapor'
let fontKayitli = false
function fontKaydet() {
  if (fontKayitli) return
  Font.register({
    family: RAPOR_FONT,
    fonts: [
      { src: path.join(process.cwd(), 'node_modules/pdfjs-dist/standard_fonts/LiberationSans-Regular.ttf'), fontWeight: 400 },
      { src: path.join(process.cwd(), 'node_modules/pdfjs-dist/standard_fonts/LiberationSans-Bold.ttf'), fontWeight: 700 },
    ],
  })
  Font.registerHyphenationCallback((k) => [k])
  fontKayitli = true
}

export type RaporDuzeni = 'kolaj' | 'tek' | 'karsilastirma'
export const RAPOR_OGE_AZAMI = 16

export interface RaporOgesi {
  bolge: string | null
  tarih: string
  etiketler: string[]
  not: string
  yildiz: number
  anahtar: boolean
  /** data URL (jpeg/png) of the rendered, annotated photo */
  gorsel: string
}

export interface RaporGirdisi {
  baslik: string
  hastaAdi: string
  hekimAdi: string
  uretildi: string
  duzen: RaporDuzeni
  ogeler: RaporOgesi[]
  /** "47 gün arayla" — only for the comparison layout */
  aralik: string | null
}

const PINE = '#2f4334', INK = '#3b2e24', MUTED = '#8b7d70', LINE = '#ded2c3'

const s = StyleSheet.create({
  sayfa: { padding: 32, paddingBottom: 48, backgroundColor: '#FFFFFF', fontFamily: RAPOR_FONT, fontSize: 9.5, color: INK },
  ust: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: PINE, paddingBottom: 8, marginBottom: 12 },
  baslik: { fontSize: 17, fontWeight: 700 },
  alt: { fontSize: 9, color: MUTED, marginTop: 3 },
  sag: { alignItems: 'flex-end', fontSize: 9, color: MUTED },
  izgara: { flexDirection: 'row', flexWrap: 'wrap' },
  kart: { width: '48.5%', marginRight: '3%', marginBottom: 12, borderWidth: 1, borderColor: LINE, padding: 6 },
  kartTek: { width: '100%', marginBottom: 10, borderWidth: 1, borderColor: LINE, padding: 8 },
  resim: { width: '100%', maxHeight: 250, objectFit: 'contain' },
  resimTek: { width: '100%', maxHeight: 520, objectFit: 'contain' },
  bolge: { fontSize: 10, fontWeight: 700, marginTop: 5 },
  tarih: { fontSize: 8.5, color: MUTED, marginTop: 1 },
  etiket: { fontSize: 8.5, color: PINE, marginTop: 3 },
  not: { fontSize: 9, marginTop: 4, lineHeight: 1.35 },
  karsi: { flexDirection: 'row' },
  karsiKart: { width: '49%', borderWidth: 1, borderColor: LINE, padding: 6 },
  aralik: { textAlign: 'center', fontSize: 12, fontWeight: 700, color: PINE, marginVertical: 8 },
  dip: { position: 'absolute', bottom: 18, left: 32, right: 32, fontSize: 7.5, color: MUTED, flexDirection: 'row', justifyContent: 'space-between' },
})

function Oge({ o, tek }: { o: RaporOgesi; tek?: boolean }) {
  const ek = [o.anahtar ? 'Anahtar fotoğraf' : '', o.yildiz ? `${o.yildiz}/5` : ''].filter(Boolean).join(' · ')
  return (
    <View style={tek ? s.kartTek : s.kart} wrap={false}>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src={o.gorsel} style={tek ? s.resimTek : s.resim} />
      <Text style={s.bolge}>{o.bolge || 'Bölge belirtilmedi'}</Text>
      <Text style={s.tarih}>{o.tarih}{ek ? `  ·  ${ek}` : ''}</Text>
      {o.etiketler.length ? <Text style={s.etiket}>{o.etiketler.map((e) => `#${e}`).join('  ')}</Text> : null}
      {o.not ? <Text style={s.not}>{o.not}</Text> : null}
    </View>
  )
}

export function FotoRaporu({ g }: { g: RaporGirdisi }) {
  const ust = (
    <View style={s.ust} fixed>
      <View>
        <Text style={s.baslik}>{g.baslik}</Text>
        <Text style={s.alt}>{g.hastaAdi}</Text>
      </View>
      <View style={s.sag}>
        <Text>{g.hekimAdi}</Text>
        <Text>{g.uretildi}</Text>
      </View>
    </View>
  )
  const dip = (
    <View style={s.dip} fixed>
      <Text>Notya · Klinik fotoğraf raporu · Görüntüler hekimin kendi kaydıdır; yapay zekâ metni içermez.</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  )
  return (
    <Document title={g.baslik} author="Notya" subject={g.baslik} language="tr">
      <Page size="A4" style={s.sayfa}>
        {ust}
        {g.duzen === 'karsilastirma' && g.ogeler.length === 2 ? (
          <View>
            {g.aralik ? <Text style={s.aralik}>{g.aralik}</Text> : null}
            <View style={s.karsi}>
              <View style={[s.karsiKart, { marginRight: '2%' }]}><Oge o={g.ogeler[0]} tek /></View>
              <View style={s.karsiKart}><Oge o={g.ogeler[1]} tek /></View>
            </View>
          </View>
        ) : g.duzen === 'tek' ? (
          g.ogeler.map((o, i) => <Oge key={i} o={o} tek />)
        ) : (
          <View style={s.izgara}>{g.ogeler.map((o, i) => <Oge key={i} o={o} />)}</View>
        )}
        {dip}
      </Page>
    </Document>
  )
}

export async function fotoRaporuUret(g: RaporGirdisi): Promise<Buffer> {
  fontKaydet()
  return renderToBuffer(<FotoRaporu g={g} />)
}
