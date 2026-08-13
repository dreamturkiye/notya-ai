'use client';

import React, { useState } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav'
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';


interface Tool {
  circleColor: string;
  icon: string;
  title: string;
  desc: string;
  route: string;
}

const tools: Tool[] = [
  { circleColor: '#0F9B8E', icon: 'Rx', title: 'e-Reçete Asistanı', desc: 'Elektronik reçete oluştur ve SGK entegrasyonunu tamamla', route: '/doktor-tools/erecete' },
  { circleColor: '#8B5CF6', icon: 'EP', title: 'Epikriz Üretici', desc: 'Hasta özetlerini otomatik oluştur ve profesyonel epikriz raporları hazırla', route: '/doktor-tools/epikriz' },
  { circleColor: '#F59E0B', icon: 'IK', title: 'ICD-10 Kodlayıcı', desc: 'Türkçe tanı girişiyle anlık ICD-10 kodlama', route: '/doktor-tools/icd10' },
  { circleColor: '#EF4444', icon: 'II', title: 'İlaç Etkileşimi', desc: 'Reçetedeki ilaç etkileşimlerini kontrol et ve uyarıları görüntüle', route: '/doktor-tools/ilac-interaksiyon' },
  { circleColor: '#166534', icon: 'SR', title: 'SGK Rapor', desc: 'SGK uyumlu raporları hızlıca oluştur', route: '/doktor-tools/sgk-rapor' },
  { circleColor: '#EA580C', icon: 'TX', title: 'Tetkik İstek', desc: 'Lab ve görüntüleme istek formu oluştur', route: '/doktor-tools/tetkik' },
  { circleColor: '#0284C7', icon: 'HP', title: 'Hasta Portalı', desc: 'Hastalara güvenli portal erişimi ver', route: '/doktor-tools/hasta-portali' },
  { circleColor: '#DC2626', icon: 'SG', title: 'SGK Medula', desc: 'E-reçete ve provizyon sorgulama entegrasyonu', route: '/doktor-tools/sgk-medula' },
  { circleColor: '#0F9B8E', icon: 'EN', title: 'e-Nabız Rehberi', desc: 'Hasta kaydı erişimi adım adım', route: '/doktor-tools/enabiz' },
  { circleColor: '#7C3AED', icon: 'HT', title: 'Hatırlatma', desc: 'WhatsApp/SMS hasta bildirimleri gönder', route: '/doktor-tools/hatirlatma' },
];

export default function DoktorToolsPage() {
  const router = useRouter();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#060C18', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#fff' }}>
      <DoktorNav />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 20px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#14B8A6', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>ARAÇLAR</div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, letterSpacing: '-0.6px' }}>Doktor Araçları</h1>
          <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '8px', marginBottom: 0 }}>Klinik iş akışınızı hızlandıracak araçlara erişin</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
          {tools.map((tool, index) => {
            const isHovered = hoveredIndex === index;
            return (
              <div
                key={index}
                onClick={() => router.push(tool.route)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isHovered ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '18px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '9999px', backgroundColor: tool.circleColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{tool.icon}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '17px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>{tool.title}</div>
                    <div style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: '1.45' }}>{tool.desc}</div>
                  </div>
                  <div style={{ color: '#6B7280', fontSize: '18px', marginTop: '2px' }}>→</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
