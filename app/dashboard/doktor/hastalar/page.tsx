'use client';

import React, { useEffect, useState } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Patient {
  id: string;
  maskedName: string;
  lastVisit: string;
  specialty: string;
  isActive: boolean;
}

export default function HastalarPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem(Object.keys(localStorage).find(k => k.includes('auth-token')) || '');
    fetch('/api/doktor/hastalar', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(setPatients);
  }, []);

  const filtered = patients.filter(p => p.maskedName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ backgroundColor: '#0A1628', minHeight: '100vh', color: 'white' }}>
      <DoktorNav />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
        <h1 style={{ fontSize: 28, marginBottom: 24 }}>Hastalar</h1>
        <input placeholder="TC hash ile ara..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: 12, background: '#1E2937', border: '1px solid #334155', borderRadius: 8, width: '100%', marginBottom: 24, color: 'white' }} />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(p => (
            <div key={p.id} onClick={() => router.push(`/dashboard/doktor/hastalar/${p.id}`)} style={{ background: '#1E2937', padding: 16, borderRadius: 12, display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>{p.maskedName}</div>
              <div style={{ color: '#94A3B8' }}>{p.lastVisit} • {p.specialty}</div>
              <div style={{ color: p.isActive ? '#10B981' : '#EF4444' }}>{p.isActive ? 'Aktif' : 'Pasif'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
