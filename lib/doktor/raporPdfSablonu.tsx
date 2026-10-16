/**
 * NOTYA-HASTA-RAPORLARI-UNIFIED-01 — ONE printable PDF layout for every Hasta Raporları
 * report (the 6 existing SGK/Medula + özel muayenehane types, and the 4 new Çocuk Hasta
 * Raporları). Same pattern as `lib/asi/karnePdf.tsx` / `app/api/doktor/raporlar/pdf/
 * route.tsx`: @react-pdf/renderer, `renderToBuffer`, white page, Liberation Sans
 * registered for Turkish glyphs (Helvetica/WinAnsi has no ı/İ/ş/Ş/ğ/Ğ).
 *
 * Renders `RaporBelgesiModeli` (lib/doktor/raporBelgesi.ts) — the model, not raw request
 * data — so every report (old and new) goes through the same header, patient block,
 * clinical/decision block, doctor/clinic block, date+belgeNo and kaşe/imza area.
 */
import path from 'node:path'
import React from 'react'
import { Document, Font, Page, Path, StyleSheet, Svg, Text, View, renderToBuffer } from '@react-pdf/renderer'
import type { RaporBelgesiModeli } from './raporBelgesi'
import { RAPOR_BASLIK_BOLUM, RAPOR_ETIKET, belgeNoEtiketi, raporTarihiEtiketi } from './raporMetinleri'

export const RAPOR_FONT = 'NotyaRaporBelgeSans'
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
  Font.registerHyphenationCallback((kelime) => [kelime])
  fontKayitli = true
}

const B = (metin: string) => metin.toLocaleUpperCase('tr-TR')

const PINE = '#2f4334'
const INK = '#3b2e24'
const MUTED = '#8b7d70'
const LINE = '#ded2c3'

const s = StyleSheet.create({
  sayfa: { padding: 36, paddingBottom: 56, backgroundColor: '#FFFFFF', fontFamily: RAPOR_FONT, fontSize: 10.5, color: INK },
  ustSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  markaSatir: { flexDirection: 'row', alignItems: 'center' },
  marka: { fontSize: 9, color: MUTED, marginLeft: 4 },
  ustBaslik: { fontSize: 15, fontWeight: 700, letterSpacing: 0.6, marginTop: 4 },
  altBaslik: { fontSize: 10, color: MUTED, marginTop: 2 },
  sag: { alignItems: 'flex-end' },
  meta: { fontSize: 9, color: MUTED },
  cizgi: { borderBottomWidth: 2, borderBottomColor: PINE, marginVertical: 10 },
  bolum: { marginBottom: 14 },
  bolumBaslik: { fontSize: 9, fontWeight: 700, color: PINE, letterSpacing: 0.7, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: LINE, paddingBottom: 3 },
  satir: { flexDirection: 'row', marginBottom: 3 },
  etiket: { width: 150, fontSize: 9.5, color: MUTED },
  deger: { flex: 1, fontSize: 10.5, fontWeight: 700, color: INK },
  metinBlok: { fontSize: 11, lineHeight: 1.6 },
  ikiKolon: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  kolon: { width: '47%' },
  imzaKutu: { height: 64, borderWidth: 1, borderStyle: 'dashed', borderColor: '#CBD5E1', borderRadius: 4, marginTop: 4 },
  imzaNot: { fontSize: 8.5, color: MUTED, marginTop: 4 },
  uyariKutu: { marginTop: 10, padding: 10, backgroundColor: '#F6F0E4', borderWidth: 1, borderColor: LINE, borderRadius: 6, fontSize: 9, lineHeight: 1.5, color: '#5a4e42' },
  dip: { position: 'absolute', bottom: 20, left: 36, right: 36, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: MUTED },
})

function Satir({ etiket, deger }: { etiket: string; deger: string | null | undefined }) {
  return (
    <View style={s.satir}>
      <Text style={s.etiket}>{B(etiket)}</Text>
      <Text style={s.deger}>{deger || '—'}</Text>
    </View>
  )
}

export function RaporBelgesiPdf({ belge }: { belge: RaporBelgesiModeli }) {
  const h = belge.hasta
  return (
    <Document title={belge.ustBaslik} author="Notya" subject={belge.ustBaslik} language="tr">
      <Page size="A4" style={s.sayfa}>
        <View style={s.ustSatir}>
          <View>
            <View style={s.markaSatir}>
              <Svg width={10} height={10} viewBox="0 0 24 24">
                <Path d="M8 19c1.6-5.8 3.4-9.6 7.2-14.2.8 3.4.8 6.4-.2 9.2-1.5 2.4-4 4-7 5z" stroke="#6a7563" strokeWidth={1.6} fill="none" />
              </Svg>
              <Text style={s.marka}>Notya</Text>
            </View>
            <Text style={s.ustBaslik}>{B(belge.ustBaslik)}</Text>
            {belge.altBaslik ? <Text style={s.altBaslik}>{belge.altBaslik}</Text> : null}
          </View>
          <View style={s.sag}>
            <Text style={s.meta}>{raporTarihiEtiketi(belge.tarihGorunum)}</Text>
            <Text style={s.meta}>{belgeNoEtiketi(belge.belgeNo)}</Text>
          </View>
        </View>
        <View style={s.cizgi} />

        <View style={s.bolum} wrap={false}>
          <Text style={s.bolumBaslik}>{RAPOR_BASLIK_BOLUM.hastaBilgileri}</Text>
          <Satir etiket={RAPOR_ETIKET.adSoyad} deger={h.adSoyad} />
          <Satir etiket={RAPOR_ETIKET.tcKimlik} deger={h.tcKimlikSatiri} />
          <Satir etiket={RAPOR_ETIKET.dogumTarihi} deger={h.dogumTarihi} />
          <Satir etiket={RAPOR_ETIKET.cinsiyet} deger={h.cinsiyet} />
          {h.yasYilAy ? <Satir etiket={RAPOR_ETIKET.yas} deger={h.yasYilAy} /> : null}
          {h.veliGorunsun ? (
            <>
              <Satir etiket={RAPOR_ETIKET.anneAdi} deger={h.anneAdi} />
              <Satir etiket={RAPOR_ETIKET.babaAdi} deger={h.babaAdi} />
            </>
          ) : null}
        </View>

        <View style={s.bolum} wrap={false}>
          <Text style={s.bolumBaslik}>{B(belge.klinikBaslik)}</Text>
          <Text style={s.metinBlok}>{belge.klinikMetin}</Text>
        </View>

        {belge.uyari ? (
          <View style={s.uyariKutu} wrap={false}>
            <Text>{belge.uyari}</Text>
          </View>
        ) : null}

        <View style={[s.bolum, { marginTop: 16 }]} wrap={false}>
          <Text style={s.bolumBaslik}>{RAPOR_BASLIK_BOLUM.duzenleyenHekim}</Text>
          <View style={s.ikiKolon}>
            <View style={s.kolon}>
              <Satir etiket={RAPOR_ETIKET.unvanAdSoyad} deger={belge.doktor.unvanliAdSoyad} />
              <Satir etiket={RAPOR_ETIKET.uzmanlikAlani} deger={belge.doktor.uzmanlik} />
              <Satir etiket={RAPOR_ETIKET.diplomaTescilNo} deger={belge.doktor.diplomaTescilNo} />
              <Satir etiket={RAPOR_ETIKET.klinikAdresi} deger={belge.doktor.klinikAdi} />
              <Satir etiket={RAPOR_ETIKET.telefon} deger={belge.doktor.telefon} />
              <Satir etiket={RAPOR_ETIKET.eposta} deger={belge.doktor.eposta} />
            </View>
            <View style={s.kolon}>
              <Text style={[s.etiket, { marginBottom: 4 }]}>{B(RAPOR_BASLIK_BOLUM.imzaKase)}</Text>
              <View style={s.imzaKutu} />
              <Text style={s.imzaNot}>Islak imza ve kaşe — bu kopya elektronik üretilmiştir.</Text>
            </View>
          </View>
        </View>

        <View style={s.dip} fixed>
          <Text>Notya · {belge.ustBaslik}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

export async function raporBelgesiPdf(belge: RaporBelgesiModeli): Promise<Buffer> {
  fontKaydet()
  return renderToBuffer(<RaporBelgesiPdf belge={belge} />)
}
