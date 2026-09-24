'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { trIcerir } from '@/lib/utils/turkceArama';
import { klinikAramaMi } from '@/lib/doktor/hastaAramaFiltre';
import { useRouter } from 'next/navigation';
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme';

export const dynamic = 'force-dynamic';

interface Patient {
  id: string;
  name: string;
  masked_name: string;
  tc_kimlik_hash: string;
  last_visit: string;
  is_active: boolean;
  ozet?: string;
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
  const [klinikSonuc, setKlinikSonuc] = useState<Patient[] | null>(null);
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

  useEffect(() => {
    const q = search.trim();
    if (!q || !klinikAramaMi(q)) { setKlinikSonuc(null); return; }
    let iptal = false;
    const t = window.setTimeout(async () => {
      const token = await ensureDoctorAccessToken();
      if (!token || iptal) return;
      const res = await fetch(`/api/doktor/hastalar?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json().catch(() => ({}));
      if (iptal || !res.ok) return;
      const list = Array.isArray(d?.patients) ? d.patients : [];
      setKlinikSonuc(list.map((p: Record<string, unknown>) => ({
        id: String(p.id || ''),
        name: String(p.name || ''),
        masked_name: String(p.masked_name || p.name || ''),
        tc_kimlik_hash: '',
        last_visit: String(p.last_visit || ''),
        is_active: true,
        ozet: String(p.ozet || ''),
      })));
    }, 350);
    return () => { iptal = true; window.clearTimeout(t); };
  }, [search]);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (klinikSonuc) return klinikSonuc;
    if (!q) return patients;
    // NOTYA-ARAMA-TR-01: ortak Türkçe katlama — "isik" da "IŞIK" da "Işık"ı bulur.
    return patients.filter((p) => {
      const nameHit = trIcerir(p.name, q);
      const tcHit = Boolean(tcHashQuery && p.tc_kimlik_hash && p.tc_kimlik_hash === tcHashQuery);
      return nameHit || tcHit;
    });
  }, [patients, search, tcHashQuery, klinikSonuc]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 32, margin: 0, color: '#2e251d', letterSpacing: '-0.02em' }}>Hastalar</h1>
        {/* NOTYA-SADE-01 (Ö2): üst menüden kalkan "Hasta Ekle" buraya buton olarak geldi */}
        <button type="button" onClick={() => router.push('/dashboard/doktor/hasta-ekle')} style={{ background: CHROME_RENK.pine, border: 'none', color: '#FAF8F4', borderRadius: 999, padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>+ Hasta Ekle</button>
      </div>
      <input
        placeholder="Ad, TC, yaş, şikayet, tanı, aşı, bu hafta, 1-5 yaş, veya, hariç…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoComplete="off"
        inputMode="search"
        style={{
          padding: 12,
          background: '#FFFFFF',
          border: `1.5px solid ${CHROME_RENK.border}`,
          borderRadius: 10,
          width: '100%',
          maxWidth: 640,
          marginBottom: 12,
          color: CHROME_RENK.ink,
          boxSizing: 'border-box',
          fontSize: 15,
        }}
      />
      {klinikSonuc && search.trim() && (
        <div style={{ color: CHROME_RENK.muted, fontSize: 13, marginBottom: 16 }}>
          {klinikSonuc.length} hasta eşleşti — dosya, not, aşı, ilaç, randevu ve belgeler AND ile tarandı.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && (
          <div style={{ color: CHROME_RENK.muted, padding: '24px 4px' }}>Hastalar yükleniyor...</div>
        )}
        {!loading && loadError && (
          <div style={{ color: CHROME_RENK.warn, padding: '24px 4px' }}>{loadError}</div>
        )}
        {!loading && !loadError && filtered.length === 0 && (
          <div style={{ color: CHROME_RENK.muted, padding: '24px 4px' }}>
            {search.trim() ? 'Aramanızla eşleşen hasta bulunamadı.' : 'Henüz hasta kaydı yok.'}
          </div>
        )}
        {filtered.map((p) => (
          <div
            key={p.id}
            onClick={() => router.push(`/dashboard/doktor/hastalar/${p.id}`)}
            style={{
              background: '#FFFFFF',
              border: `1px solid ${CHROME_RENK.border}`,
              padding: 16,
              borderRadius: 16,
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              cursor: 'pointer',
              alignItems: 'center',
              boxShadow: '0 8px 18px rgba(58,44,34,0.045)',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: CHROME_RENK.ink }}>{p.name}</div>
              {p.ozet ? (
                <div style={{ color: CHROME_RENK.muted, fontSize: 13, marginTop: 4, overflowWrap: 'anywhere' }}>{p.ozet}</div>
              ) : null}
            </div>
            {!p.ozet && (
              <div style={{ color: CHROME_RENK.muted, flexShrink: 0 }}>
                {p.last_visit ? new Date(p.last_visit).toLocaleDateString('tr-TR') : '—'}
              </div>
            )}
            <div style={{ color: p.is_active ? '#3F7D4A' : CHROME_RENK.warn, flexShrink: 0, fontSize: 13, fontWeight: 600 }}>
              {p.is_active ? 'Aktif' : 'Pasif'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
