'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Patient {
  id: string;
  name: string;
  masked_name: string;
  tc_kimlik_hash: string;
  last_visit: string;
  is_active: boolean;
}

function normalizeTr(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function HastalarPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [tcHashQuery, setTcHashQuery] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const token = await ensureDoctorAccessToken();
        if (!token) {
          if (!cancelled) {
            setPatients([]);
            setLoadError('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
            setLoading(false);
          }
          return;
        }
        const res = await fetch('/api/doktor/hastalar', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.status === 401) {
          setPatients([]);
          setLoadError('Oturum geçersiz. Lütfen tekrar giriş yapın.');
          return;
        }
        if (!res.ok) {
          setPatients([]);
          setLoadError(String((d as { error?: string }).error || 'Hastalar alınamadı'));
          return;
        }
        const list = Array.isArray(d?.patients) ? d.patients : [];
        setPatients(
          list.map((p: Record<string, unknown>) => ({
            id: String(p.id || ''),
            name: String(p.name || p.masked_name || 'Bilinmiyor'),
            masked_name: String(p.masked_name || p.name || 'Bilinmiyor'),
            tc_kimlik_hash: String(p.tc_kimlik_hash || ''),
            last_visit: String(p.last_visit || ''),
            is_active: p.is_active !== false,
          }))
        );
      } catch {
        if (!cancelled) {
          setPatients([]);
          setLoadError('Hastalar yüklenirken bir hata oluştu.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // When the query looks like a TC, hash it and match against stored tc_kimlik_hash.
  useEffect(() => {
    const digits = search.replace(/\D/g, '');
    let cancelled = false;
    if (digits.length === 11) {
      void sha256Hex(digits).then((hash) => {
        if (!cancelled) setTcHashQuery(hash);
      });
    } else {
      setTcHashQuery(null);
    }
    return () => {
      cancelled = true;
    };
  }, [search]);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return patients;
    const qNorm = normalizeTr(q);
    return patients.filter((p) => {
      const nameHit = normalizeTr(p.name).includes(qNorm);
      const tcHit = Boolean(tcHashQuery && p.tc_kimlik_hash && p.tc_kimlik_hash === tcHashQuery);
      return nameHit || tcHit;
    });
  }, [patients, search, tcHashQuery]);

  return (
    <div style={{ backgroundColor: '#0A1628', minHeight: '100vh', color: 'white' }}>
      <DoktorNav />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>Hastalar</h1>
          {/* NOTYA-SADE-01 (Ö2): üst menüden kalkan "Hasta Ekle" buraya buton olarak geldi */}
          <button type="button" onClick={() => router.push('/dashboard/doktor/hasta-ekle')} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>+ Hasta Ekle</button>
        </div>
        <input
          placeholder="Ad, soyad veya TC Kimlik No ile ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoComplete="off"
          inputMode="search"
          style={{
            padding: 12,
            background: '#1E2937',
            border: '1px solid #334155',
            borderRadius: 8,
            width: '100%',
            marginBottom: 24,
            color: 'white',
            boxSizing: 'border-box',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading && (
            <div style={{ color: '#94A3B8', padding: '24px 4px' }}>Hastalar yükleniyor...</div>
          )}
          {!loading && loadError && (
            <div style={{ color: '#FCA5A5', padding: '24px 4px' }}>{loadError}</div>
          )}
          {!loading && !loadError && filtered.length === 0 && (
            <div style={{ color: '#94A3B8', padding: '24px 4px' }}>
              {search.trim() ? 'Aramanızla eşleşen hasta bulunamadı.' : 'Henüz hasta kaydı yok.'}
            </div>
          )}
          {filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => router.push(`/dashboard/doktor/hastalar/${p.id}`)}
              style={{
                background: '#1E2937',
                padding: 16,
                borderRadius: 12,
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                cursor: 'pointer',
                alignItems: 'center',
              }}
            >
              <div style={{ fontWeight: 600, flex: 1, minWidth: 0 }}>{p.name}</div>
              <div style={{ color: '#94A3B8', flexShrink: 0 }}>
                {p.last_visit ? new Date(p.last_visit).toLocaleDateString('tr-TR') : '—'}
              </div>
              <div style={{ color: p.is_active ? '#10B981' : '#EF4444', flexShrink: 0 }}>
                {p.is_active ? 'Aktif' : 'Pasif'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
