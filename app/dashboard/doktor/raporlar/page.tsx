'use client';

import React, { useState, useEffect } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav';

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
  const [currentMonth, setCurrentMonth] = useState('2025-12');
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
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch(`/api/doktor/raporlar?month=${monthStr}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json: RaporData = await res.json();
        setData({
          muayene: json.muayene || 0,
          bekleyen: json.bekleyen || 0,
          aktifHasta: json.aktifHasta || 0,
          tamamlananNot: json.tamamlananNot || 0,
          tanilar: json.tanilar || [],
          activity: json.activity?.length === 35 ? json.activity : Array(35).fill(0),
          uzmanlik: json.uzmanlik || [],
          hafta: json.hafta || { seans: 0, onaylanan: 0, bekleyen: 0 },
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

  const changeMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
  };

  const maxTanilar = Math.max(...(data.tanilar.length ? data.tanilar.map(t => t.count) : [1]), 1);
  const maxUzmanlik = Math.max(...(data.uzmanlik.length ? data.uzmanlik.map(u => u.count) : [1]), 1);

  const getActivityColor = (val: number) => {
    if (val === 0) return 'rgba(255,255,255,0.05)';
    if (val <= 2) return 'rgba(15,155,142,0.6)';
    return '#0F9B8E';
  };

  const printPDF = () => () => { if (typeof window !== 'undefined') window.print() };

  const kpiCards = [
    { label: 'Bu Ay Muayene', value: data.muayene, color: '#0F9B8E' },
    { label: 'Bekleyen Onay', value: data.bekleyen, color: '#F59E0B' },
    { label: 'Aktif Hasta', value: data.aktifHasta, color: '#3B82F6' },
    { label: 'Tamamlanan Not', value: data.tamamlananNot, color: '#10B981' },
  ];

  return (
    <div style={{ backgroundColor: '#0A1628', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', color: 'white' }}>
      <style>{`@media print { nav, button { display: none !important; } }`}</style>

      <DoktorNav />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 60px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '32px', marginBottom: '32px' }}>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>Aylık Klinik Raporu</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => changeMonth(-1)} style={{ fontSize: '24px', background: 'none', border: 'none', color: '#0F9B8E', cursor: 'pointer' }}>←</button>
            <div style={{ fontSize: '16px', fontWeight: 500 }}>{monthLabel}</div>
            <button onClick={() => changeMonth(1)} style={{ fontSize: '24px', background: 'none', border: 'none', color: '#0F9B8E', cursor: 'pointer' }}>→</button>
            <button onClick={printPDF} style={{ marginLeft: '24px', background: '#0F9B8E', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>PDF İndir</button>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', margin: '24px 0' }}>
          {kpiCards.map((card, idx) => (
            <div key={idx} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: `4px solid ${card.color}`, borderRadius: '16px', padding: '20px' }}>
              {loading ? (
                <div style={{ height: '60px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px' }} />
              ) : (
                <>
                  <div style={{ fontSize: '32px', fontWeight: 700 }}>{card.value}</div>
                  <div style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '4px' }}>{card.label}</div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div style={{ display: 'flex', gap: '20px', flexDirection: (typeof window !== 'undefined' ? window.innerWidth : 1024) < 900 ? 'column' : 'row' }}>
          {/* LEFT 60% */}
          <div style={{ flex: '0 0 60%' }}>
            {/* Son Tanılar */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '1px', color: '#9CA3AF', marginBottom: '16px' }}>EN ÇOK KONULAN TANILAR</div>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ height: '42px', background: 'rgba(255,255,255,0.06)', marginBottom: '8px', borderRadius: '6px' }} />)
              ) : data.tanilar.length === 0 ? (
                <div style={{ color: '#9CA3AF', fontSize: '14px' }}>Henüz tanı kaydedilmedi</div>
              ) : (
                data.tanilar.slice(0, 5).map((t, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ width: '70px', fontSize: '13px', fontWeight: 700, color: '#0F9B8E' }}>{t.code}</div>
                    <div style={{ flex: 1, fontSize: '14px' }}>{t.name}</div>
                    <div style={{ width: '40px', textAlign: 'right', fontSize: '13px', color: '#9CA3AF' }}>{t.count}</div>
                    <div style={{ width: '120px', marginLeft: '12px', background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px' }}>
                      <div style={{ width: `${(t.count / maxTanilar) * 100}%`, height: '100%', background: '#0F9B8E', borderRadius: '3px' }} />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Aktivite Takvimi */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '1px', color: '#9CA3AF', marginBottom: '16px' }}>AKTİVİTE TAKVİMİ</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 20px)', gap: '4px' }}>
                {data.activity.map((val, i) => (
                  <div key={i} style={{ width: '20px', height: '20px', background: getActivityColor(val), borderRadius: '3px' }} />
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 20px)', gap: '4px', marginTop: '4px' }}>
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} style={{ fontSize: '9px', color: '#6B7280', textAlign: 'center' }}>{((i % 7) + 1)}</div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT 40% */}
          <div style={{ flex: '0 0 40%' }}>
            {/* Uzmanlık Dağılımı */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '1px', color: '#9CA3AF', marginBottom: '16px' }}>UZMANLIK DAĞILIMI</div>
              {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ height: '32px', background: 'rgba(255,255,255,0.06)', marginBottom: '10px', borderRadius: '4px' }} />) : data.uzmanlik.map((u, idx) => (
                <div key={idx} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span>{u.name}</span><span>{u.count}</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                    <div style={{ width: `${(u.count / maxUzmanlik) * 100}%`, height: '100%', background: '#0F9B8E', borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Bu Hafta */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '1px', color: '#9CA3AF', marginBottom: '16px' }}>BU HAFTA</div>
              {[
                { label: 'Seans', val: data.hafta.seans, color: '#0F9B8E' },
                { label: 'Onaylanan', val: data.hafta.onaylanan, color: '#3B82F6' },
                { label: 'Bekleyen', val: data.hafta.bekleyen, color: '#F59E0B' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ width: '8px', height: '8px', background: s.color, borderRadius: '50%', marginRight: '10px' }} />
                  <div style={{ flex: 1, fontSize: '14px' }}>{s.label}</div>
                  <div style={{ fontWeight: 600 }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Hızlı Erişim */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '1px', color: '#9CA3AF', marginBottom: '16px' }}>HIZLI ERİŞİM</div>
              <a href="/doktor-tools/epikriz" style={{ display: 'flex', justifyContent: 'space-between', color: '#0F9B8E', fontSize: '14px', marginBottom: '12px', textDecoration: 'none' }}>
                Epikriz Üret <span>→</span>
              </a>
              <a href="/doktor-tools/icd10" style={{ display: 'flex', justifyContent: 'space-between', color: '#0F9B8E', fontSize: '14px', textDecoration: 'none' }}>
                ICD-10 Kodla <span>→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
