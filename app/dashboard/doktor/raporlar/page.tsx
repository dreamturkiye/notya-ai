'use client';

import React, { useState, useEffect } from 'react';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme';

export const dynamic = 'force-dynamic';

interface TanilarItem {
  code: string;
  name: string;
  count: number;
}

interface UzmanlikItem {
  name: string;
  count: number;
}

interface HaftaItem {
  seans: number;
  onaylanan: number;
  bekleyen: number;
}

interface RaporData {
  muayene: number;
  bekleyen: number;
  aktifHasta: number;
  tamamlananNot: number;
  tanilar: TanilarItem[];
  activity: number[];
  uzmanlik: UzmanlikItem[];
  hafta: HaftaItem;
}

const Page: React.FC = () => {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [isNarrow, setIsNarrow] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [data, setData] = useState<RaporData>({
    muayene: 0,
    bekleyen: 0,
    aktifHasta: 0,
    tamamlananNot: 0,
    tanilar: [],
    activity: Array(35).fill(0),
    uzmanlik: [],
    hafta: { seans: 0, onaylanan: 0, bekleyen: 0 },
  });
  const [loading, setLoading] = useState(true);

  const monthNames = ['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'];
  const [year, month] = currentMonth.split('-').map(Number);
  const monthLabel = `${monthNames[month - 1]} ${year}`;

  const fetchData = async (monthStr: string) => {
    setLoading(true);
    try {
      // NOTYA-AUTH-01: was a literal 'auth-token' read — the ILAC-04 bug class — with no refresh.
      const token = (await ensureDoctorAccessToken()) || '';
      const res = await fetch(`/api/doktor/raporlar?month=${monthStr}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const tanilarRaw = Array.isArray(json.tanilar)
          ? json.tanilar
          : Array.isArray(json.topTanilar)
            ? json.topTanilar
            : [];
        const uzmanlikRaw = Array.isArray(json.uzmanlik)
          ? json.uzmanlik
          : Array.isArray(json.uzmanlikDagilimi)
            ? json.uzmanlikDagilimi
            : [];
        const activityRaw = Array.isArray(json.activity)
          ? json.activity
          : Array.isArray(json.gunlukAktivite)
            ? json.gunlukAktivite.map((d: { sayi?: number }) => Number(d?.sayi || 0))
            : [];
        const padded = [...activityRaw];
        while (padded.length < 35) padded.push(0);
        setData({
          muayene: Number(json.muayene ?? json.buAyMuayene ?? 0) || 0,
          bekleyen: Number(json.bekleyen ?? json.bekleyenOnay ?? 0) || 0,
          aktifHasta: Number(json.aktifHasta ?? 0) || 0,
          tamamlananNot: Number(json.tamamlananNot ?? 0) || 0,
          tanilar: tanilarRaw.map((t: Record<string, unknown>) => ({
            code: String(t.code || t.kod || ''),
            name: String(t.name || t.aciklama || t.code || t.kod || ''),
            count: Number(t.count || t.sayi || 0) || 0,
          })),
          activity: padded.slice(0, 35),
          uzmanlik: uzmanlikRaw.map((u: Record<string, unknown>) => ({
            name: String(u.name || u.specialty || ''),
            count: Number(u.count || u.sayi || 0) || 0,
          })),
          hafta: json.hafta || {
            seans: Number(json.buAyMuayene ?? json.muayene ?? 0) || 0,
            onaylanan: Number(json.tamamlananNot ?? 0) || 0,
            bekleyen: Number(json.bekleyenOnay ?? json.bekleyen ?? 0) || 0,
          },
        });
      }
    } catch {
      // silent fail
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData(currentMonth);
  }, [currentMonth]);

  useEffect(() => {
    const check = () => setIsNarrow(window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const changeMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
  };

  const maxTanilar = Math.max(...(data.tanilar.length ? data.tanilar.map(t => t.count) : [1]), 1);
  const maxUzmanlik = Math.max(...(data.uzmanlik.length ? data.uzmanlik.map(u => u.count) : [1]), 1);

  const getActivityColor = (val: number) => {
    if (val === 0) return '#EFE9DC';
    if (val <= 2) return `${CHROME_RENK.pine}99`;
    return CHROME_RENK.pine;
  };

  const printPDF = async () => {
    setPdfLoading(true);
    try {
      const token = (await ensureDoctorAccessToken()) || '';
      const res = await fetch('/api/doktor/raporlar/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          monthLabel,
          doctorName: localStorage.getItem('notya_doktor_name') || 'Doktor',
          muayene: data.muayene,
          bekleyen: data.bekleyen,
          aktifHasta: data.aktifHasta,
          tamamlananNot: data.tamamlananNot,
          tanilar: data.tanilar,
          uzmanlik: data.uzmanlik,
          hafta: data.hafta,
        }),
      });
      if (!res.ok) throw new Error('PDF oluşturulamadı');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aylık-rapor-${monthLabel.toLocaleLowerCase('tr-TR').replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('PDF indirilemedi, lütfen tekrar deneyin');
    } finally {
      setPdfLoading(false);
    }
  };

  const kpiCards = [
    { label: 'Bu Ay Muayene', value: data.muayene, color: CHROME_RENK.pine },
    { label: 'Bekleyen Onay', value: data.bekleyen, color: '#B4832F' },
    { label: 'Aktif Hasta', value: data.aktifHasta, color: '#4A5C8A' },
    { label: 'Tamamlanan Not', value: data.tamamlananNot, color: CHROME_RENK.pine },
  ];

  return (
    <div>
      <style>{`@media print { nav, button { display: none !important; } }`}</style>

      {/* NOTYA-SADE-01 (Ö5): İnceleme üst menüden kalktı — onay kuyruğuna buradan tek tık */}
      <a href="/dashboard/doktor/inceleme" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FBF3DE', border: '1px solid #E4C989', color: '#7A5B1E', borderRadius: 14, padding: '12px 16px', marginBottom: 20, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
        🟠 Onay Bekleyen Notlar (İnceleme) <span style={{ marginLeft: 'auto', fontSize: 16 }}>›</span>
      </a>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
        <div style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 28, color: '#2e251d', letterSpacing: '-0.02em' }}>Aylık Klinik Raporu</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => changeMonth(-1)} style={{ fontSize: '20px', background: 'none', border: 'none', color: CHROME_RENK.pine, cursor: 'pointer', flexShrink: 0 }}>←</button>
          <div style={{ fontSize: '15px', fontWeight: 600, whiteSpace: 'nowrap', color: CHROME_RENK.ink }}>{monthLabel}</div>
          <button onClick={() => changeMonth(1)} style={{ fontSize: '20px', background: 'none', border: 'none', color: CHROME_RENK.pine, cursor: 'pointer', flexShrink: 0 }}>→</button>
          <button onClick={printPDF} disabled={pdfLoading} style={{ background: CHROME_RENK.pine, color: '#FAF8F4', border: 'none', padding: '9px 16px', borderRadius: '999px', fontSize: '13.5px', fontWeight: 700, cursor: pdfLoading ? 'not-allowed' : 'pointer', opacity: pdfLoading ? 0.6 : 1, flexShrink: 0, whiteSpace: 'nowrap' }}>{pdfLoading ? 'Hazırlanıyor...' : 'PDF İndir'}</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', margin: '0 0 24px' }}>
        {kpiCards.map((card, idx) => (
          <div key={idx} style={{ background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: '16px', padding: '20px', boxShadow: '0 8px 18px rgba(58,44,34,0.045)' }}>
            {loading ? (
              <div style={{ height: '48px', background: '#EFE9DC', borderRadius: '8px' }} />
            ) : (
              <>
                <div style={{ fontFamily: CHROME_FONT.serif, fontSize: '32px', fontWeight: 600, color: card.color }}>{card.value}</div>
                <div style={{ fontSize: '13px', color: CHROME_RENK.muted, marginTop: '4px' }}>{card.label}</div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'flex', gap: '16px', flexDirection: isNarrow ? 'column' : 'row' }}>
        {/* LEFT 60% */}
        <div style={{ flex: '0 0 60%' }}>
          {/* Son Tanılar */}
          <div style={{ background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: '16px', padding: '22px', marginBottom: '18px', boxShadow: '0 8px 18px rgba(58,44,34,0.045)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', color: CHROME_RENK.pine, textTransform: 'uppercase', marginBottom: '16px' }}>En Çok Konulan Tanılar</div>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ height: '42px', background: '#F6F0E4', marginBottom: '8px', borderRadius: '6px' }} />)
            ) : data.tanilar.length === 0 ? (
              <div style={{ color: CHROME_RENK.muted, fontSize: '14px' }}>Henüz tanı kaydedilmedi</div>
            ) : (
              data.tanilar.slice(0, 5).map((t, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ width: '70px', fontSize: '13px', fontWeight: 700, color: CHROME_RENK.pine }}>{t.code}</div>
                  <div style={{ flex: 1, fontSize: '14px', color: CHROME_RENK.ink }}>{t.name}</div>
                  <div style={{ width: '40px', textAlign: 'right', fontSize: '13px', color: CHROME_RENK.muted }}>{t.count}</div>
                  <div style={{ width: '120px', marginLeft: '12px', background: '#EFE9DC', height: '6px', borderRadius: '3px' }}>
                    <div style={{ width: `${(t.count / maxTanilar) * 100}%`, height: '100%', background: CHROME_RENK.pine, borderRadius: '3px' }} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Aktivite Takvimi */}
          <div style={{ background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: '16px', padding: '22px', boxShadow: '0 8px 18px rgba(58,44,34,0.045)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', color: CHROME_RENK.pine, textTransform: 'uppercase', marginBottom: '16px' }}>Aktivite Takvimi</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 20px)', gap: '4px' }}>
              {data.activity.map((val, i) => (
                <div key={i} style={{ width: '20px', height: '20px', background: getActivityColor(val), borderRadius: '3px' }} />
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 20px)', gap: '4px', marginTop: '4px' }}>
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} style={{ fontSize: '9px', color: CHROME_RENK.muted, textAlign: 'center' }}>{((i % 7) + 1)}</div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT 40% */}
        <div style={{ flex: '0 0 40%' }}>
          {/* Uzmanlık Dağılımı */}
          <div style={{ background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: '16px', padding: '22px', marginBottom: '18px', boxShadow: '0 8px 18px rgba(58,44,34,0.045)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', color: CHROME_RENK.pine, textTransform: 'uppercase', marginBottom: '16px' }}>Uzmanlık Dağılımı</div>
            {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ height: '32px', background: '#F6F0E4', marginBottom: '10px', borderRadius: '4px' }} />) : data.uzmanlik.map((u, idx) => (
              <div key={idx} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: CHROME_RENK.ink }}>
                  <span>{u.name}</span><span>{u.count}</span>
                </div>
                <div style={{ height: '6px', background: '#EFE9DC', borderRadius: '3px' }}>
                  <div style={{ width: `${(u.count / maxUzmanlik) * 100}%`, height: '100%', background: CHROME_RENK.pine, borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Bu Hafta */}
          <div style={{ background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: '16px', padding: '22px', marginBottom: '18px', boxShadow: '0 8px 18px rgba(58,44,34,0.045)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', color: CHROME_RENK.pine, textTransform: 'uppercase', marginBottom: '16px' }}>Bu Hafta</div>
            {[
              { label: 'Seans', val: data.hafta.seans, color: CHROME_RENK.pine },
              { label: 'Onaylanan', val: data.hafta.onaylanan, color: '#4A5C8A' },
              { label: 'Bekleyen', val: data.hafta.bekleyen, color: '#B4832F' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ width: '8px', height: '8px', background: s.color, borderRadius: '50%', marginRight: '10px' }} />
                <div style={{ flex: 1, fontSize: '14px', color: CHROME_RENK.ink }}>{s.label}</div>
                <div style={{ fontWeight: 700, color: CHROME_RENK.ink }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Hızlı Erişim */}
          <div style={{ background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: '16px', padding: '22px', boxShadow: '0 8px 18px rgba(58,44,34,0.045)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', color: CHROME_RENK.pine, textTransform: 'uppercase', marginBottom: '16px' }}>Hızlı Erişim</div>
            <a href="/doktor-tools/epikriz" style={{ display: 'flex', justifyContent: 'space-between', color: CHROME_RENK.pine, fontSize: '14px', fontWeight: 600, marginBottom: '12px', textDecoration: 'none' }}>
              Epikriz Üret <span>→</span>
            </a>
            <a href="/doktor-tools/icd10" style={{ display: 'flex', justifyContent: 'space-between', color: CHROME_RENK.pine, fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
              ICD-10 Kodla <span>→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
