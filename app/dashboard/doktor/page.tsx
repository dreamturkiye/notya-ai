'use client';

import React, { useEffect, useState } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav';

export const dynamic = 'force-dynamic';

interface KPIData {
  bugunMuayene: number;
  bekleyenOnay: number;
  buAyToplam: number;
  aktifHasta: number;
}

export default function DoktorDashboard() {
  const [kpi, setKpi] = useState<KPIData>({ bugunMuayene: 0, bekleyenOnay: 0, buAyToplam: 0, aktifHasta: 0 });
  const [recentNotes, setRecentNotes] = useState<any[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(Object.keys(localStorage).find(k => k.includes('auth-token')) || '');
    if (!raw) {
      window.location.href = '/giris/doktor';
      return;
    }
    const session = JSON.parse(raw);
    if (session.profession_type !== 'doktor') {
      window.location.href = '/giris/doktor';
      return;
    }
    // Fetch data placeholder - real impl uses Supabase inside effect
    setKpi({ bugunMuayene: 4, bekleyenOnay: 7, buAyToplam: 42, aktifHasta: 128 });
    setRecentNotes([
      { id: 1, specialty: "Kardiyoloji", date: "2025-04-01", status: "Bekliyor", content: "Hasta göğüs ağrısı şikayetiyle başvurdu..." }
    ]);
  }, []);

  const handleQuickAction = (action: string) => {
    const routes: any = {
      asistan: '/asistan',
      hastaEkle: '/dashboard/doktor/hasta-ekle',
      belge: '/dashboard/doktor/belgeler',
      inceleme: '/dashboard/doktor/inceleme'
    };
    window.location.href = routes[action];
  };

  return (
    <div style={{ backgroundColor: '#0A1628', minHeight: '100vh', color: 'white' }}>
      <DoktorNav />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '24px' }}>Ana Sayfa</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: "Bugünkü Muayene", value: kpi.bugunMuayene, color: '#0F9B8E' },
            { label: "Bekleyen Onay", value: kpi.bekleyenOnay, color: '#F59E0B' },
            { label: "Bu Ay Toplam", value: kpi.buAyToplam, color: '#3B82F6' },
            { label: "Aktif Hasta", value: kpi.aktifHasta, color: '#10B981' }
          ].map((card, idx) => (
            <div key={idx} style={{ backgroundColor: '#0F172A', padding: '20px', borderRadius: '12px', border: `1px solid ${card.color}40` }}>
              <div style={{ fontSize: '13px', color: '#94A3B8' }}>{card.label}</div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: card.color, marginTop: '8px' }}>{card.value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Hızlı İşlemler</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { label: "Asistanı Aç", action: "asistan" },
              { label: "Hasta Ekle", action: "hastaEkle" },
              { label: "Belge Yükle", action: "belge" },
              { label: "İnceleme Kuyruğu", action: "inceleme" }
            ].map((btn, idx) => (
              <button key={idx} onClick={() => handleQuickAction(btn.action)} style={{ padding: '10px 18px', backgroundColor: '#0F9B8E', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Son Notlar</h2>
          {recentNotes.length === 0 ? <p>Henüz not yok.</p> : recentNotes.map((note, idx) => (
            <div key={idx} style={{ backgroundColor: '#0F172A', padding: '16px', borderRadius: '8px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{note.specialty} • {note.date}</span>
                <span style={{ color: note.status === 'Bekliyor' ? '#F59E0B' : '#10B981' }}>{note.status}</span>
              </div>
              <p style={{ marginTop: '8px', color: '#94A3B8' }}>{note.content.substring(0, 80)}...</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
