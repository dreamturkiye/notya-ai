import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import React from 'react';

export const dynamic = 'force-dynamic';

interface TanilarItem { code: string; name: string; count: number }
interface UzmanlikItem { name: string; count: number }
interface HaftaItem { seans: number; onaylanan: number; bekleyen: number }
interface ReportBody {
  monthLabel: string;
  doctorName: string;
  muayene: number;
  bekleyen: number;
  aktifHasta: number;
  tamamlananNot: number;
  tanilar: TanilarItem[];
  uzmanlik: UzmanlikItem[];
  hafta: HaftaItem;
}

const NAVY = '#0A1628';
const TEAL = '#0F9B8E';
const AMBER = '#F59E0B';
const BLUE = '#3B82F6';
const GREEN = '#10B981';
const GRAY = '#64748B';
const LIGHT_GRAY = '#E2E8F0';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: NAVY,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  brand: {
    fontSize: 14,
    fontWeight: 700,
    color: NAVY,
  },
  brandAccent: {
    color: TEAL,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginTop: 4,
    color: NAVY,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  doctorName: {
    fontSize: 11,
    fontWeight: 700,
    color: NAVY,
  },
  monthLabel: {
    fontSize: 10,
    color: GRAY,
    marginTop: 2,
  },
  divider: {
    borderBottomWidth: 2,
    borderBottomColor: TEAL,
    marginBottom: 20,
  },
  kpiRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  kpiBox: {
    flex: 1,
    borderLeftWidth: 3,
    backgroundColor: '#F8FAFC',
    padding: 10,
    marginRight: 10,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: 700,
    color: NAVY,
  },
  kpiLabel: {
    fontSize: 8,
    color: GRAY,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: GRAY,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 8,
  },
  table: {
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    marginBottom: 24,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRowLast: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  colCode: { width: '18%', fontWeight: 700, color: TEAL, fontSize: 9 },
  colName: { width: '62%', fontSize: 9 },
  colCount: { width: '20%', fontSize: 9, textAlign: 'right' },
  headerCell: { fontSize: 8, fontWeight: 700, color: GRAY, textTransform: 'uppercase' },
  emptyState: {
    fontSize: 9,
    color: GRAY,
    padding: 12,
    textAlign: 'center',
  },
  uzmanlikRow: {
    marginBottom: 10,
  },
  uzmanlikLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  uzmanlikName: { fontSize: 9 },
  uzmanlikCount: { fontSize: 9, fontWeight: 700 },
  barTrack: {
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
  },
  barFill: {
    height: 5,
    backgroundColor: TEAL,
    borderRadius: 2,
  },
  haftaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  haftaRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  haftaLabel: { fontSize: 9, color: NAVY },
  haftaValue: { fontSize: 9, fontWeight: 700 },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: GRAY,
  },
});

function ReportDocument({ data }: { data: ReportBody }) {
  const maxUzmanlik = Math.max(...(data.uzmanlik.length ? data.uzmanlik.map(u => u.count) : [1]), 1);

  const kpis = [
    { label: 'Bu Ay Muayene', value: data.muayene, color: TEAL },
    { label: 'Bekleyen Onay', value: data.bekleyen, color: AMBER },
    { label: 'Aktif Hasta', value: data.aktifHasta, color: BLUE },
    { label: 'Tamamlanan Not', value: data.tamamlananNot, color: GREEN },
  ];

  return (
    <Document title={'Aylik Klinik Raporu - ' + data.monthLabel}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>Notya<Text style={styles.brandAccent}> AI</Text></Text>
            <Text style={styles.pageTitle}>Ayl\u0131k Klinik Raporu</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.doctorName}>{data.doctorName}</Text>
            <Text style={styles.monthLabel}>{data.monthLabel}</Text>
          </View>
        </View>
        <View style={styles.divider} />

        <View style={styles.kpiRow}>
          {kpis.map((k, i) => (
            <View key={i} style={[styles.kpiBox, { borderLeftColor: k.color, marginRight: i === kpis.length - 1 ? 0 : 10 }]}>
              <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
              <Text style={styles.kpiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>En \u00c7ok Konulan Tan\u0131lar</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.headerCell, { width: '18%' }]}>Kod</Text>
            <Text style={[styles.headerCell, { width: '62%' }]}>Tan\u0131</Text>
            <Text style={[styles.headerCell, { width: '20%', textAlign: 'right' }]}>Say\u0131</Text>
          </View>
          {data.tanilar.length === 0 ? (
            <Text style={styles.emptyState}>Bu ay i\u00e7in hen\u00fcz tan\u0131 kaydedilmedi.</Text>
          ) : (
            data.tanilar.slice(0, 8).map((t, idx) => (
              <View key={idx} style={idx === data.tanilar.length - 1 ? styles.tableRowLast : styles.tableRow}>
                <Text style={styles.colCode}>{t.code}</Text>
                <Text style={styles.colName}>{t.name}</Text>
                <Text style={styles.colCount}>{t.count}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Uzmanl\u0131k Da\u011f\u0131l\u0131m\u0131</Text>
        <View style={{ marginBottom: 24 }}>
          {data.uzmanlik.length === 0 ? (
            <Text style={styles.emptyState}>Uzmanl\u0131k da\u011f\u0131l\u0131m\u0131 verisi bulunamad\u0131.</Text>
          ) : (
            data.uzmanlik.map((u, idx) => (
              <View key={idx} style={styles.uzmanlikRow}>
                <View style={styles.uzmanlikLabelRow}>
                  <Text style={styles.uzmanlikName}>{u.name}</Text>
                  <Text style={styles.uzmanlikCount}>{u.count}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: Math.max(4, (u.count / maxUzmanlik) * 100) + '%' }]} />
                </View>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Bu Hafta \u00d6zeti</Text>
        <View style={{ marginBottom: 12 }}>
          <View style={styles.haftaRow}>
            <Text style={styles.haftaLabel}>Seans</Text>
            <Text style={styles.haftaValue}>{data.hafta.seans}</Text>
          </View>
          <View style={styles.haftaRow}>
            <Text style={styles.haftaLabel}>Onaylanan</Text>
            <Text style={styles.haftaValue}>{data.hafta.onaylanan}</Text>
          </View>
          <View style={styles.haftaRowLast}>
            <Text style={styles.haftaLabel}>Bekleyen</Text>
            <Text style={styles.haftaValue}>{data.hafta.bekleyen}</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Notya AI - 2026 - KVKK Uyumlu</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => pageNumber + ' / ' + totalPages} />
        </View>
      </Page>
    </Document>
  );
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 });
    }

    const body: ReportBody = await req.json();
    if (!body || !body.monthLabel) {
      return NextResponse.json({ error: 'Rapor verisi eksik' }, { status: 400 });
    }

    const buffer = await renderToBuffer(<ReportDocument data={body} />);

    const safeMonth = body.monthLabel.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\u0131\u015f\u00e7\u011f\u00fc\u00f6-]/g, '');
    const filename = 'aylik-rapor-' + (safeMonth || 'rapor') + '.pdf';

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="' + filename + '"',
      },
    });
  } catch (error: unknown) {
    console.error('PDF rapor olusturma hatasi:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}
