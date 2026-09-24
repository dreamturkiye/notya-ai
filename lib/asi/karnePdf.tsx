/**
 * ASI-KARNESI-01 (C5/C7) — aşı karnesi PDF'i. TEK üretici: Sağlığım (portal token) ve hekim (Aşılar sekmesi) aynı
 * fonksiyonu çağırır; içerik lib/asi/karneBelgesi.ts modelinden gelir (ekranla aynı metinler, aynı sıra).
 *
 * Desen: app/api/doktor/raporlar/pdf/route.tsx (@react-pdf/renderer, renderToBuffer, beyaz zemin). Fark — FONT:
 * rapor PDF'i yerleşik Helvetica kullanır; Helvetica'nın (WinAnsi) Türkçe ı/İ/ş/Ş/ğ/Ğ glifi YOKTUR, bu harfler bozulur.
 * Karne adı, aşı adları ve e-Nabız uyarısı Türkçe olduğundan burada gömülü bir TrueType yazı tipi kaydedilir:
 * Liberation Sans (pdfjs-dist'in standard_fonts klasöründe zaten kurulu — yeni bağımlılık yok; lisans gömmeye izin verir).
 * Vercel paketine next.config.js outputFileTracingIncludes ile girer. Testte üretilen PDF'in metni çıkarılıp Türkçe
 * karakterler bayt bayt kontrol edilir (lib/asi/asiKarnesiPdf.test.ts).
 */
import path from 'node:path'
import React from 'react'
import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer'
import { ASI_KARNESI_BASLIK, dozMetni, HASTA_KAYNAK_ETIKETI, KAYNAK_ACIKLAMASI, KAYNAK_SIRASI, LOT_YER_BASLIK, tarihMetni, type AsiKarnesi } from './karneBelgesi'
import { lotYerHucresi } from './asiLotYeri'
import { trTarih } from './karneOkuma'

export const KARNE_FONT = 'NotyaKarneSans'
export const KARNE_FONT_DOSYALARI = {
  normal: 'node_modules/pdfjs-dist/standard_fonts/LiberationSans-Regular.ttf',
  kalin: 'node_modules/pdfjs-dist/standard_fonts/LiberationSans-Bold.ttf',
} as const

let fontKayitli = false
function fontKaydet() {
  if (fontKayitli) return
  Font.register({
    family: KARNE_FONT,
    fonts: [
      { src: path.join(process.cwd(), KARNE_FONT_DOSYALARI.normal), fontWeight: 400 },
      { src: path.join(process.cwd(), KARNE_FONT_DOSYALARI.kalin), fontWeight: 700 },
    ],
  })
  // Türkçe kelimeler yanlış yerden tirelenmesin (aşı adları, e-Nabız).
  Font.registerHyphenationCallback((kelime) => [kelime])
  fontKayitli = true
}

/** Büyük harf Türkçe kuralıyla (i → İ). react-pdf'in textTransform'u yerel ayar bilmez: "Tarih" → "TARIH" yazardı. */
const B = (metin: string) => metin.toLocaleUpperCase('tr-TR')

const MURKEKKEP = '#111827'
const GRI = '#4B5563'
const CIZGI = '#D1D5DB'

const s = StyleSheet.create({
  sayfa: { padding: 36, paddingBottom: 48, backgroundColor: '#FFFFFF', fontFamily: KARNE_FONT, fontSize: 10, color: MURKEKKEP },
  ustSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  marka: { fontSize: 9, color: GRI },
  baslik: { fontSize: 20, fontWeight: 700, marginTop: 2 },
  uretim: { fontSize: 9, color: GRI, textAlign: 'right' },
  uyari: { borderWidth: 1.5, borderColor: MURKEKKEP, padding: 10, marginBottom: 14 },
  uyariBaslik: { fontSize: 11, fontWeight: 700, marginBottom: 3 },
  uyariMetin: { fontSize: 10, lineHeight: 1.4 },
  kimlik: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderBottomWidth: 1, borderColor: CIZGI, paddingVertical: 8, marginBottom: 14 },
  kimlikHucre: { width: '50%', paddingVertical: 3, paddingRight: 8 },
  etiket: { fontSize: 8, color: GRI, letterSpacing: 0.5 },
  deger: { fontSize: 11, fontWeight: 700, marginTop: 1 },
  bolum: { fontSize: 9, fontWeight: 700, color: GRI, letterSpacing: 0.8, marginBottom: 6, marginTop: 4 },
  siradaki: { borderWidth: 1, borderColor: CIZGI, padding: 8, marginBottom: 14 },
  siradakiAna: { fontSize: 12, fontWeight: 700 },
  siradakiDiger: { fontSize: 9.5, color: GRI, marginTop: 3 },
  tablo: { borderWidth: 1, borderColor: CIZGI },
  tabloBaslik: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: MURKEKKEP, paddingVertical: 5, paddingHorizontal: 6 },
  satir: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: CIZGI, paddingVertical: 5, paddingHorizontal: 6 },
  hucreBaslik: { fontSize: 8, fontWeight: 700, color: GRI },
  colAd: { width: '30%', paddingRight: 6 },
  colDoz: { width: '10%' },
  colTarih: { width: '16%' },
  colLotYer: { width: '20%', paddingRight: 6 },
  colKaynak: { width: '24%' },
  rozet: { alignSelf: 'flex-start', borderWidth: 0.75, borderColor: MURKEKKEP, borderRadius: 6, paddingVertical: 1, paddingHorizontal: 4, fontSize: 8 },
  bos: { fontSize: 10, color: GRI, padding: 10 },
  aciklama: { fontSize: 8.5, color: GRI, marginTop: 10, lineHeight: 1.4 },
  altBilgi: { position: 'absolute', bottom: 20, left: 36, right: 36, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: GRI },
})

export function AsiKarnesiPdfBelgesi({ karne }: { karne: AsiKarnesi }) {
  const [ilk, ...diger] = karne.siradakiler
  return (
    <Document title={ASI_KARNESI_BASLIK} author="Notya · Sağlığım" subject={ASI_KARNESI_BASLIK} language="tr">
      <Page size="A4" style={s.sayfa}>
        <View style={s.ustSatir}>
          <View>
            <Text style={s.marka}>Notya · Sağlığım</Text>
            <Text style={s.baslik}>{ASI_KARNESI_BASLIK}</Text>
          </View>
          <Text style={s.uretim}>Oluşturulma: {trTarih(karne.uretimTarihi)}</Text>
        </View>

        <View style={s.uyari} wrap={false}>
          <Text style={s.uyariBaslik}>{karne.uyari.baslik}</Text>
          <Text style={s.uyariMetin}>{karne.uyari.metin}</Text>
        </View>

        <View style={s.kimlik} wrap={false}>
          <View style={s.kimlikHucre}><Text style={s.etiket}>{B('Ad Soyad')}</Text><Text style={s.deger}>{karne.hasta.adSoyad || '—'}</Text></View>
          <View style={s.kimlikHucre}><Text style={s.etiket}>{B('Doğum tarihi')}</Text><Text style={s.deger}>{karne.hasta.dogumTarihi ? trTarih(karne.hasta.dogumTarihi) : '—'}</Text></View>
          <View style={s.kimlikHucre}><Text style={s.etiket}>{B('Hekim')}</Text><Text style={s.deger}>{karne.hekim.ad || '—'}</Text></View>
          <View style={s.kimlikHucre}><Text style={s.etiket}>{B('Klinik')}</Text><Text style={s.deger}>{karne.hekim.klinik || '—'}</Text></View>
        </View>

        <Text style={s.bolum}>{B('Sıradaki aşı')}</Text>
        <View style={s.siradaki} wrap={false}>
          {ilk ? (
            <>
              <Text style={s.siradakiAna}>{ilk.ad} · {trTarih(ilk.tarih)}</Text>
              {diger.length > 0 && <Text style={s.siradakiDiger}>Sonra: {diger.map((d) => `${d.ad} · ${trTarih(d.tarih)}`).join('; ')}</Text>}
            </>
          ) : (
            <Text style={s.siradakiDiger}>Doktorunuzun kaydettiği bir sonraki aşı tarihi yok.</Text>
          )}
        </View>

        <Text style={s.bolum}>{B(`Yapılan aşılar (${karne.yapilanlar.length})`)}</Text>
        <View style={s.tablo}>
          <View style={s.tabloBaslik} fixed>
            <Text style={[s.hucreBaslik, s.colAd]}>{B('Aşı')}</Text>
            <Text style={[s.hucreBaslik, s.colDoz]}>{B('Doz')}</Text>
            <Text style={[s.hucreBaslik, s.colTarih]}>{B('Tarih')}</Text>
            <Text style={[s.hucreBaslik, s.colLotYer]}>{B(LOT_YER_BASLIK)}</Text>
            <Text style={[s.hucreBaslik, s.colKaynak]}>{B('Kaynak')}</Text>
          </View>
          {karne.yapilanlar.length === 0 && <Text style={s.bos}>Kayıtlı aşı yok.</Text>}
          {karne.yapilanlar.map((a, i) => (
            <View key={i} style={s.satir} wrap={false}>
              <Text style={s.colAd}>{a.ad}</Text>
              <Text style={s.colDoz}>{dozMetni(a.doz)}</Text>
              <Text style={s.colTarih}>{tarihMetni(a.tarih)}</Text>
              <Text style={s.colLotYer}>{lotYerHucresi(a)}</Text>
              <View style={s.colKaynak}><Text style={s.rozet}>{a.kaynakEtiketi}</Text></View>
            </View>
          ))}
        </View>

        <Text style={s.aciklama}>
          {KAYNAK_SIRASI.map((k) => `“${HASTA_KAYNAK_ETIKETI[k]}”: ${KAYNAK_ACIKLAMASI[k]}`).join(' ')}
        </Text>

        <View style={s.altBilgi} fixed>
          <Text>{karne.uyari.baslik} — resmî kaynak e-Nabız.</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

export async function asiKarnesiPdf(karne: AsiKarnesi): Promise<Buffer> {
  fontKaydet()
  return renderToBuffer(<AsiKarnesiPdfBelgesi karne={karne} />)
}
