'use client';

import React, { useState } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav';

export const dynamic = 'force-dynamic';

export default function HastaProfilPage() {
  const [activeTab, setActiveTab] = useState(1);

  const tabs = ['Özet', 'Muayene Geçmişi', 'Belgeler', 'Görüntüleme', 'İlaçlar'];

  return (
    <div style={{ backgroundColor: '#0A1628', minHeight: '100vh', color: 'white' }}>
      <DoktorNav />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
        <h1 style={{ fontSize: 26, marginBottom: 20 }}>Hasta Profili</h1>
        
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #334155', marginBottom: 24 }}>
          {tabs.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i + 1)} style={{ padding: '12px 20px', background: activeTab === i + 1 ? '#0F9B8E' : 'transparent', border: 'none', color: 'white', borderRadius: 8 }}>{tab}</button>
          ))}
        </div>

        {activeTab === 1 && <div>Demografik bilgiler, kronik hastalıklar, alerjiler ve kan grubu burada gösterilir.</div>}
        {activeTab === 2 && <div>Muayene ve SOAP notları timeline olarak listelenir.</div>}
        {activeTab === 3 && <div>Belge listesi ve yükleme butonu.</div>}
        {activeTab === 4 && <div>Görüntüleme kayıtları ve thumbnail'lar.</div>}
        {activeTab === 5 && <div>İlaç listesi ve yeni ilaç ekleme.</div>}
      </div>
    </div>
  );
}
