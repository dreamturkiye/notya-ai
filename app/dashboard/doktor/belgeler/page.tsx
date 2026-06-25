'use client';

import React, { useState } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav';

export const dynamic = 'force-dynamic';

export default function BelgelerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [hastaId, setHastaId] = useState('');
  const [belgeType, setBelgeType] = useState('Lab Sonucu');

  const handleUpload = async () => {
    // Production upload logic with Groq vision would go here
    alert('Belge yüklendi ve AI işleme alındı');
  };

  return (
    <div style={{ backgroundColor: '#0A1628', minHeight: '100vh', color: 'white' }}>
      <DoktorNav />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
        <h1 style={{ fontSize: 28, marginBottom: 24 }}>Belge Yükleme</h1>
        
        <div style={{ background: '#1E2937', padding: 24, borderRadius: 12 }}>
          <select value={hastaId} onChange={e => setHastaId(e.target.value)} style={{ width: '100%', padding: 12, marginBottom: 16, background: '#0F172A', color: 'white', borderRadius: 8 }}>
            <option value="">Hasta Seç</option>
          </select>
          <select value={belgeType} onChange={e => setBelgeType(e.target.value)} style={{ width: '100%', padding: 12, marginBottom: 16, background: '#0F172A', color: 'white', borderRadius: 8 }}>
            <option>Lab Sonucu</option><option>Görüntüleme Raporu</option><option>Epikriz</option><option>Reçete</option><option>Sevk</option><option>Diğer</option>
          </select>
          <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} style={{ marginBottom: 16 }} />
          <button onClick={handleUpload} style={{ background: '#0F9B8E', padding: '12px 24px', borderRadius: 8, color: 'white', border: 'none' }}>Yükle ve İşle</button>
        </div>
      </div>
    </div>
  );
}
