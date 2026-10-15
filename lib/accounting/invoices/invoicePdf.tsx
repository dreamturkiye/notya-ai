/**
 * NOTYA-ACCOUNTING-ENCOUNTER-01 — real-looking invoice/makbuz PDF, independent of a live e-belge
 * integrator connection (ARCH doc §4.9.9 "PDF output now"). A doctor can download/print this today
 * even before they've connected NES/Paraşüt/etc. — this is the document they actually hand a
 * patient or file with their müşavir right now, same intent as lib/asi/karnePdf.tsx for aşı karnesi.
 *
 * Layout researched from a real GİB/TÜRMOB e-SMM reference (turmob.org.tr's own published e-SMM
 * guide PDF, "ELEKTRONIK SERBEST MESLEK MAKBUZU") and general e-Arşiv fatura convention: header
 * (unvan/logo), belge no + tarih, alıcı, hizmet satırları, Brüt Ücret -> GV stopajı -> KDV -> KDV
 * tevkifatı -> Net Tahsilat progression, imza alanı. Stopaj/tevkifat is shown as "uygulanmadı" by
 * default because every invoice this module issues today is hekim -> hasta (gerçek kişi) — stopaj
 * only applies when the PAYER is a kurumsal/tüzel kişi (GVK md. 94), same note already carried in
 * lib/accounting/reports/monthly.ts's STOPAJ_NOTU; this file imports that exact constant so the PDF
 * and the mali müşavir report never say two different things.
 *
 * Font: same Liberation Sans embedding as lib/asi/karnePdf.tsx, for the same reason — Helvetica
 * (react-pdf's built-in, WinAnsi) has no Turkish ı/İ/ş/Ş/ğ/Ğ glyphs.
 */
import path from 'node:path'
import React from 'react'
import { Document, Font, Page, StyleSheet, Text, View, Image, renderToBuffer } from '@react-pdf/renderer'
import type { EbelgeDocType, Money } from '../types'
import { STOPAJ_NOTU } from '../reports/monthly'

export const FATURA_PDF_FONT = 'NotyaFaturaSans'
const FONT_FILES = {
  normal: 'node_modules/pdfjs-dist/standard_fonts/LiberationSans-Regular.ttf',
  bold: 'node_modules/pdfjs-dist/standard_fonts/LiberationSans-Bold.ttf',
} as const

let fontKayitli = false
function fontKaydet() {
  if (fontKayitli) return
  Font.register({
    family: FATURA_PDF_FONT,
    fonts: [
      { src: path.join(process.cwd(), FONT_FILES.normal), fontWeight: 400 },
      { src: path.join(process.cwd(), FONT_FILES.bold), fontWeight: 700 },
    ],
  })
  Font.registerHyphenationCallback((word) => [word])
  fontKayitli = true
}

const B = (s: string) => s.toLocaleUpperCase('tr-TR')

const INK = '#3b2e24'
const MUTED = '#8b7d70'
const LINE = '#ded2c3'
const PINE = '#2f4334'

const DOC_TYPE_LABELS: Record<EbelgeDocType, string> = { esmm: 'SERBEST MESLEK MAKBUZU', efatura: 'E-FATURA', earsiv: 'E-ARŞİV FATURA' }

const s = StyleSheet.create({
  page: { padding: 36, paddingBottom: 56, backgroundColor: '#FFFFFF', fontFamily: FATURA_PDF_FONT, fontSize: 10, color: INK },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  logo: { width: 80, height: 40, objectFit: 'contain', marginBottom: 6 },
  unvan: { fontSize: 13, fontWeight: 700 },
  sellerLine: { fontSize: 9, color: MUTED, marginTop: 2, maxWidth: 260 },
  docBox: { alignItems: 'flex-end' },
  docTitle: { fontSize: 14, fontWeight: 700, color: PINE },
  docMeta: { fontSize: 9, color: MUTED, marginTop: 2 },
  draftBadge: { marginTop: 6, borderWidth: 1, borderColor: '#B4832F', color: '#B4832F', fontSize: 8, fontWeight: 700, padding: '2 6', alignSelf: 'flex-end' },
  buyerBox: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: LINE, paddingVertical: 8, marginBottom: 14 },
  label: { fontSize: 8, color: MUTED, letterSpacing: 0.5 },
  value: { fontSize: 11, fontWeight: 700, marginTop: 1 },
  table: { borderWidth: 1, borderColor: LINE, marginBottom: 14 },
  thead: { flexDirection: 'row', backgroundColor: '#F6F0E4', borderBottomWidth: 1, borderBottomColor: PINE, paddingVertical: 5, paddingHorizontal: 6 },
  trow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: LINE, paddingVertical: 5, paddingHorizontal: 6 },
  th: { fontSize: 8, fontWeight: 700, color: MUTED },
  colDesc: { width: '40%' },
  colQty: { width: '10%', textAlign: 'right' },
  colPrice: { width: '16%', textAlign: 'right' },
  colKdv: { width: '12%', textAlign: 'right' },
  colTotal: { width: '22%', textAlign: 'right' },
  totalsBox: { alignSelf: 'flex-end', width: 260, marginBottom: 20 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalsLabel: { fontSize: 10, color: MUTED },
  totalsValue: { fontSize: 10 },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: PINE, marginTop: 4 },
  grandLabel: { fontSize: 12, fontWeight: 700 },
  grandValue: { fontSize: 12, fontWeight: 700 },
  stopajNote: { fontSize: 8.5, color: MUTED, lineHeight: 1.4, marginBottom: 30 },
  signRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  signBox: { width: 180, borderTopWidth: 1, borderTopColor: INK, paddingTop: 4, textAlign: 'center', fontSize: 9, color: MUTED },
  footer: { position: 'absolute', bottom: 20, left: 36, right: 36, fontSize: 7.5, color: MUTED, textAlign: 'center' },
})

function tl(kurus: Money): string {
  return `${(Math.round(kurus) / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`
}

export interface InvoicePdfLine {
  description: string
  quantity: number
  unitPriceKurus: Money
  kdvRateBp: number
  kdvKurus: Money
  lineTotalKurus: Money
}

export interface InvoicePdfInput {
  isDraft: boolean
  docType: EbelgeDocType
  docNumber: string | null
  ettn: string | null
  issueDateIso: string | null
  createdAtIso: string
  /** Real values, not masked — this is the actual legal document the doctor's own TCKN/VKN/IBAN
   *  belongs on, same as any paper serbest meslek makbuzu/fatura. Masking is only for the setup
   *  UI's "is something on file" display (lib/accounting/vault.ts maskSecrets and the tax-profile
   *  route's own ibanMasked), never for the document content itself. */
  seller: { unvan: string; idTypeLabel: string; idValue: string; address: string; vergiDairesi?: string | null; iban?: string | null }
  logoDataUrl?: string | null
  buyerName: string
  lines: InvoicePdfLine[]
  subtotalKurus: Money
  discountKurus: Money
  kdvKurus: Money
  totalKurus: Money
  paidKurus: Money
}

export function InvoicePdfBelgesi({ input }: { input: InvoicePdfInput }) {
  const docTarih = input.issueDateIso || input.createdAtIso
  return (
    <Document title={`${DOC_TYPE_LABELS[input.docType]} ${input.docNumber || ''}`} author="Notya" language="tr">
      <Page size="A4" style={s.page}>
        <View style={s.top}>
          <View>
            {input.logoDataUrl ? <Image src={input.logoDataUrl} style={s.logo} /> : null}
            <Text style={s.unvan}>{input.seller.unvan}</Text>
            <Text style={s.sellerLine}>{input.seller.idTypeLabel}: {input.seller.idValue}{input.seller.vergiDairesi ? ` · ${input.seller.vergiDairesi} V.D.` : ''}</Text>
            <Text style={s.sellerLine}>{input.seller.address}</Text>
            {input.seller.iban ? <Text style={s.sellerLine}>IBAN: {input.seller.iban}</Text> : null}
          </View>
          <View style={s.docBox}>
            <Text style={s.docTitle}>{DOC_TYPE_LABELS[input.docType]}</Text>
            <Text style={s.docMeta}>Belge No: {input.docNumber || '—'}</Text>
            {input.ettn ? <Text style={s.docMeta}>ETTN: {input.ettn}</Text> : null}
            <Text style={s.docMeta}>Tarih: {docTarih.slice(0, 10)}</Text>
            {input.isDraft ? <Text style={s.draftBadge}>{B('Taslak — resmî belge değil')}</Text> : null}
          </View>
        </View>

        <View style={s.buyerBox}>
          <Text style={s.label}>{B('Alıcı')}</Text>
          <Text style={s.value}>{input.buyerName}</Text>
        </View>

        <View style={s.table}>
          <View style={s.thead}>
            <Text style={[s.th, s.colDesc]}>{B('Hizmet / Kalem')}</Text>
            <Text style={[s.th, s.colQty]}>{B('Adet')}</Text>
            <Text style={[s.th, s.colPrice]}>{B('Birim Fiyat')}</Text>
            <Text style={[s.th, s.colKdv]}>{B('KDV')}</Text>
            <Text style={[s.th, s.colTotal]}>{B('Toplam')}</Text>
          </View>
          {input.lines.map((l, i) => (
            <View key={i} style={s.trow}>
              <Text style={s.colDesc}>{l.description}</Text>
              <Text style={s.colQty}>{l.quantity}</Text>
              <Text style={s.colPrice}>{tl(l.unitPriceKurus)}</Text>
              <Text style={s.colKdv}>%{(l.kdvRateBp / 100).toFixed(0)}</Text>
              <Text style={s.colTotal}>{tl(l.lineTotalKurus)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totalsBox}>
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>Brüt Ücret (Matrah)</Text>
            <Text style={s.totalsValue}>{tl(input.subtotalKurus)}</Text>
          </View>
          {input.discountKurus > 0 && (
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>İndirim</Text>
              <Text style={s.totalsValue}>-{tl(input.discountKurus)}</Text>
            </View>
          )}
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>KDV</Text>
            <Text style={s.totalsValue}>{tl(input.kdvKurus)}</Text>
          </View>
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>Gelir Vergisi Stopajı</Text>
            <Text style={s.totalsValue}>Uygulanmadı</Text>
          </View>
          <View style={s.grandRow}>
            <Text style={s.grandLabel}>Net Tahsilat</Text>
            <Text style={s.grandValue}>{tl(input.totalKurus)}</Text>
          </View>
          {input.paidKurus > 0 && input.paidKurus < input.totalKurus && (
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Tahsil edilen</Text>
              <Text style={s.totalsValue}>{tl(input.paidKurus)}</Text>
            </View>
          )}
        </View>

        <Text style={s.stopajNote}>{STOPAJ_NOTU}</Text>

        <View style={s.signRow}>
          <View style={s.signBox}><Text>Düzenleyen İmza</Text></View>
          <View style={s.signBox}><Text>Alıcı (opsiyonel)</Text></View>
        </View>

        <Text style={s.footer}>
          Bu belge Notya üzerinden {input.seller.unvan} tarafından oluşturulmuştur. Notya belgeyi düzenleyen taraf değildir — GİB'e bağlı resmî
          belge, bağlı e-belge entegratörü üzerinden ayrıca kesilir (Entegrasyonlar → Faturalama &amp; Tahsilat).
        </Text>
      </Page>
    </Document>
  )
}

export async function invoicePdf(input: InvoicePdfInput): Promise<Buffer> {
  fontKaydet()
  return renderToBuffer(<InvoicePdfBelgesi input={input} />)
}
