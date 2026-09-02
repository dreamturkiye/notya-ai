'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav';
import {
  getAccessToken, getAccessTokenAsync,
  toolsShell,
  toolsCard,
  toolsErrorBox,
} from '@/lib/doktor/toolsUi';

interface IlacOner { ad?: string; doz?: string; kullanim?: string; sure?: string }
interface IcdOner { code?: string; description_tr?: string; description?: string; is_primary?: boolean }

interface PendingNote {
  id: string;
  maskedPatient: string;
  specialty: string;
  date: string;
  subjektif: string;
  objektif: string;
  degerlendirme: string;
  plan: string;
  tani: string;
  ilaclar: IlacOner[];
  icdKodlari: IcdOner[];
  kritikBulgular: string[];
  hastaOzeti: string;
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
      objektif: String(n.objektif ?? ''),
      degerlendirme: String(n.degerlendirme ?? ''),
      plan: String(n.plan ?? ''),
      tani: String(n.tani ?? ''),
      ilaclar: Array.isArray(n.ilaclar) ? (n.ilaclar as IlacOner[]) : [],
      icdKodlari: Array.isArray(n.icdKodlari) ? (n.icdKodlari as IcdOner[]) : [],
      kritikBulgular: Array.isArray(n.kritikBulgular) ? (n.kritikBulgular as string[]).map(String) : [],
      hastaOzeti: String(n.hastaOzeti ?? ''),
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
  const [acikId, setAcikId] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const token = await getAccessTokenAsync();
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
      const token = await getAccessTokenAsync();
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

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setAcikId(acikId === note.id ? '' : note.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setAcikId(acikId === note.id ? '' : note.id); }}
                  style={{ marginTop: 12, color: '#94A3B8', fontSize: 13, lineHeight: 1.55, cursor: 'pointer' }}
                >
                  {acikId === note.id ? (
                    <div onClick={(e) => e.stopPropagation()} style={{ cursor: 'default' }}>
                      {/* NOTYA-SOAP-01: tam not incelemesi — doktor neyi onayladığını görerek onaylar */}
                      {[['S — Subjektif', note.subjektif], ['O — Objektif', note.objektif], ['A — Değerlendirme', note.degerlendirme], ['P — Plan', note.plan]].map(([baslik, icerik]) => (
                        icerik ? (
                          <div key={baslik} style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 3 }}>{baslik}</div>
                            <div style={{ fontSize: 13, color: '#CBD5E1', whiteSpace: 'pre-wrap' }}>{icerik}</div>
                          </div>
                        ) : null
                      ))}
                      {note.icdKodlari.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 5 }}>Tanı / ICD-10 önerileri <span style={{ fontWeight: 400, color: '#64748B' }}>(onayınıza tabi — otomatik yazılmaz)</span></div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {note.icdKodlari.map((k, i2) => (
                              <span key={i2} style={{ fontSize: 12, fontWeight: k.is_primary ? 700 : 500, padding: '4px 10px', borderRadius: 999, background: 'rgba(15,155,142,0.15)', color: '#2DD4BF', border: k.is_primary ? '1px solid #0F9B8E' : '1px solid transparent' }}>
                                {k.code} · {k.description_tr || k.description || ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {note.ilaclar.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 5 }}>İlaçlar</div>
                          {note.ilaclar.map((il, i2) => (
                            <div key={i2} style={{ fontSize: 13, color: '#CBD5E1' }}>• {[il.ad, il.doz, il.kullanim, il.sure].filter(Boolean).join(' — ')}</div>
                          ))}
                        </div>
                      )}
                      {note.kritikBulgular.length > 0 && (
                        <div style={{ marginBottom: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 8, padding: '8px 10px' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', marginBottom: 3 }}>Kritik bulgular</div>
                          {note.kritikBulgular.map((kb, i2) => <div key={i2} style={{ fontSize: 13, color: '#FDBA74' }}>• {kb}</div>)}
                        </div>
                      )}
                      {note.hastaOzeti && (
                        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 10px' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#8FA0B5', marginBottom: 3 }}>Hasta/veli özeti (sade dil)</div>
                          <div style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.55 }}>{note.hastaOzeti}</div>
                        </div>
                      )}
                      <div role="button" tabIndex={0} onClick={() => setAcikId('')} onKeyDown={(e) => { if (e.key === 'Enter') setAcikId(''); }} style={{ marginTop: 10, fontSize: 12, color: '#14B8A6', cursor: 'pointer' }}>Daralt ▴</div>
                    </div>
                  ) : (
                    <>
                      {snippet(note.subjektif)}
                      <span style={{ color: '#14B8A6', marginLeft: 8 }}>Notu incele ▾</span>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
