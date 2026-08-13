'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav';
import {
  getAccessToken,
  toolsShell,
  toolsCard,
  toolsErrorBox,
} from '@/lib/doktor/toolsUi';

interface PendingNote {
  id: string;
  maskedPatient: string;
  specialty: string;
  date: string;
  subjektif: string;
}

function normalizeNotes(payload: unknown): PendingNote[] {
  if (!Array.isArray(payload)) return [];

  return payload.map((item, idx) => {
    const n = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    return {
      id: String(n.id ?? idx),
      maskedPatient: String(n.maskedPatient ?? 'Hasta'),
      specialty: String(n.specialty ?? 'Genel'),
      date: String(n.date ?? ''),
      subjektif: String(n.subjektif ?? ''),
    };
  });
}

function snippet(text: unknown, max = 120): string {
  const value = String(text ?? '').trim();
  if (!value) return 'Not içeriği boş';
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

export default function IncelemePage() {
  const [notes, setNotes] = useState<PendingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          if (!cancelled) {
            setError('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
            setNotes([]);
          }
          return;
        }

        const res = await fetch('/api/notes?pending=true', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json().catch(() => null);

        if (cancelled) return;

        if (!res.ok) {
          const message =
            data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string'
              ? (data as { error: string }).error
              : 'Bekleyen notlar alınamadı.';
          setError(message);
          setNotes([]);
          return;
        }

        setNotes(normalizeNotes(data));
      } catch {
        if (!cancelled) {
          setError('Bekleyen notlar alınamadı. Bağlantınızı kontrol edin.');
          setNotes([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const approve = async (id: string) => {
    setError('');
    setBusyId(id);
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/notes/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setError('Not onaylanamadı. Lütfen tekrar deneyin.');
        return;
      }

      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      setError('Not onaylanamadı. Bağlantınızı kontrol edin.');
    } finally {
      setBusyId('');
    }
  };

  const reject = (id: string) => {
    setError('');
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const btnStyle = (bg: string, disabled: boolean): React.CSSProperties => ({
    background: disabled ? '#334155' : bg,
    color: disabled ? '#94A3B8' : '#fff',
    padding: '8px 14px',
    borderRadius: 9,
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
  });

  return (
    <div style={toolsShell}>
      <DoktorNav />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px 56px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>İnceleme Kuyruğu</h1>
        <p style={{ color: '#94A3B8', fontSize: 14, margin: '6px 0 20px' }}>
          Onay bekleyen klinik notları inceleyin
        </p>

        {error && <div style={{ ...toolsErrorBox, marginTop: 0, marginBottom: 16 }}>{error}</div>}

        {loading ? (
          <div style={{ ...toolsCard, textAlign: 'center', color: '#94A3B8' }}>Yükleniyor...</div>
        ) : notes.length === 0 ? (
          <div style={{ ...toolsCard, textAlign: 'center', color: '#94A3B8' }}>Bekleyen not yok</div>
        ) : (
          notes.map((note) => {
            const busy = busyId === note.id;
            return (
              <div key={note.id} style={{ ...toolsCard, marginBottom: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 12,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0', minWidth: 0 }}>
                    {[note.maskedPatient, note.specialty, note.date].filter(Boolean).join(' • ')}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => approve(note.id)} disabled={busy} style={btnStyle('#10B981', busy)}>
                      {busy ? 'Onaylanıyor...' : 'Onayla'}
                    </button>
                    <button onClick={() => reject(note.id)} disabled={busy} style={btnStyle('#EF4444', busy)}>
                      Reddet
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 12, color: '#94A3B8', fontSize: 13, lineHeight: 1.55 }}>
                  {snippet(note.subjektif)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
