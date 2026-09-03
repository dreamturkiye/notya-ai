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
interface ReceteOner { etkenMadde?: string; ticariOrnek?: string; doz?: string; kullanim?: string; sure?: string; not?: string; sgkListesinde?: boolean }
interface Vitaller { kilo?: number | null; boy?: number | null; ates?: number | null; nabiz?: number | null; spo2?: number | null; tansiyon?: string | null }
interface Taslak { subjektif: string; objektif: string; degerlendirme: string; plan: string }
interface Eylem { tur?: string; tarih?: string; saat?: string; kim?: string; aciklama?: string; durum?: 'oneri' | 'eklendi' | 'hata' }
interface KMesaj { rol: 'doktor' | 'asistan'; icerik: string }

interface PendingNote {
  id: string;
  maskedPatient: string;
  patientId: string | null;
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
  basvuruYakinmasi: string;
  vitaller: Vitaller | null;
  receteOnerisi: ReceteOner[];
  alarmBulgulari: string[];
}

function normalizeNotes(payload: unknown): PendingNote[] {
  if (!Array.isArray(payload)) return [];

  return payload.map((item, idx) => {
    const n = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    return {
      id: String(n.id ?? idx),
      maskedPatient: String(n.maskedPatient ?? 'Hasta'),
      patientId: n.patientId ? String(n.patientId) : null,
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
      basvuruYakinmasi: String(n.basvuruYakinmasi ?? ''),
      vitaller: (n.vitaller && typeof n.vitaller === 'object') ? (n.vitaller as Vitaller) : null,
      receteOnerisi: Array.isArray(n.receteOnerisi) ? (n.receteOnerisi as ReceteOner[]) : [],
      alarmBulgulari: Array.isArray(n.alarmBulgulari) ? (n.alarmBulgulari as string[]).map(String) : [],
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
  const [taslak, setTaslak] = useState<Taslak>({ subjektif: '', objektif: '', degerlendirme: '', plan: '' });
  const [kMesajlar, setKMesajlar] = useState<KMesaj[]>([]);
  const [kGirdi, setKGirdi] = useState('');
  const [kBekliyor, setKBekliyor] = useState(false);
  const [eylemler, setEylemler] = useState<Eylem[]>([]);

  const notuAc = (note: PendingNote) => {
    setAcikId(note.id);
    setTaslak({ subjektif: note.subjektif, objektif: note.objektif, degerlendirme: note.degerlendirme, plan: note.plan });
    setKMesajlar([]);
    setKGirdi('');
    setEylemler([]);
  };

  // NOTYA-KONSULT-03: not üzerinde Ayşe ile konsult + sözle düzenleme. Ayşe'nin döndürdüğü
  // düzenlemeler ekrandaki taslağa işlenir — kalıcı kayıt ve öğrenme logu doktor Onayla
  // dediğinde olur. Eylem önerileri (kontrol randevusu / takip araması) tek dokunuşla
  // ortak takvime yazılır; sekreter aramaları 📞 önekiyle takvimde görür, arama notunu
  // randevunun not alanına yazar.
  const konsultGonder = async (note: PendingNote) => {
    const soru = kGirdi.trim();
    if (!soru || kBekliyor) return;
    const yeni: KMesaj[] = [...kMesajlar, { rol: 'doktor', icerik: soru }];
    setKMesajlar(yeni);
    setKGirdi('');
    setKBekliyor(true);
    try {
      const token = await getAccessTokenAsync();
      const res = await fetch('/api/doktor/not-konsult', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: note.id, taslak, mesajlar: yeni }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Ayşe yanıt veremedi.');
      setKMesajlar([...yeni, { rol: 'asistan', icerik: String(d.cevap || '') }]);
      const dz = (d.duzenlemeler || {}) as Record<string, string>;
      const g: Taslak = { ...taslak };
      (['subjektif', 'objektif', 'degerlendirme', 'plan'] as const).forEach((a) => {
        if (typeof dz[a] === 'string' && dz[a].trim()) g[a] = dz[a];
      });
      setTaslak(g);
      if (Array.isArray(d.eylemler) && d.eylemler.length) {
        setEylemler((prev) => [...prev, ...(d.eylemler as Eylem[]).map((e) => ({ ...e, durum: 'oneri' as const }))]);
      }
    } catch (e) {
      setKMesajlar([...yeni, { rol: 'asistan', icerik: e instanceof Error ? e.message : 'Ayşe yanıt veremedi.' }]);
    } finally {
      setKBekliyor(false);
    }
  };

  const eylemOnayla = async (note: PendingNote, idx: number) => {
    const e = eylemler[idx];
    if (!e || e.durum !== 'oneri') return;
    if (!note.patientId) {
      setEylemler((prev) => prev.map((x, i) => (i === idx ? { ...x, durum: 'hata' } : x)));
      return;
    }
    try {
      const token = await getAccessTokenAsync();
      const saat = e.saat || '10:00';
      const baslangic = new Date(`${e.tarih}T${saat}:00+03:00`);
      const sureDk = e.tur === 'takip_aramasi' ? 15 : 20;
      const bitis = new Date(baslangic.getTime() + sureDk * 60000);
      const tur = e.tur === 'takip_aramasi' ? 'diger' : 'kontrol';
      const notlar = e.tur === 'takip_aramasi'
        ? `📞 Takip araması (${e.kim === 'sekreter' ? 'sekreter/hemşire arayacak' : 'doktor arayacak'})${e.aciklama ? `: ${e.aciklama}` : ''} — arama notunu buraya yazın.`
        : `Kontrol muayenesi${e.aciklama ? `: ${e.aciklama}` : ''}`;
      const res = await fetch('/api/doktor/randevular', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: note.patientId, baslangic: baslangic.toISOString(), bitis: bitis.toISOString(), tur, notlar }),
      });
      if (!res.ok) throw new Error();
      setEylemler((prev) => prev.map((x, i) => (i === idx ? { ...x, durum: 'eklendi' } : x)));
    } catch {
      setEylemler((prev) => prev.map((x, i) => (i === idx ? { ...x, durum: 'hata' } : x)));
    }
  };

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
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(acikId === id ? { duzenlemeler: taslak } : {}),
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
                  onClick={() => (acikId === note.id ? setAcikId('') : notuAc(note))}
                  onKeyDown={(e) => { if (e.key === 'Enter') (acikId === note.id ? setAcikId('') : notuAc(note)); }}
                  style={{ marginTop: 12, color: '#94A3B8', fontSize: 13, lineHeight: 1.55, cursor: 'pointer' }}
                >
                  {acikId === note.id ? (
                    <div onClick={(e) => e.stopPropagation()} style={{ cursor: 'default' }}>
                      {/* NOTYA-SOAP-02: tam not incelemesi — doktor DÜZENLEYEREK onaylar; düzenlemeler Ayşe'nin öğrenme verisidir */}
                      {note.basvuruYakinmasi && (
                        <div style={{ marginBottom: 10, fontSize: 13, color: '#EDF1F7', fontStyle: 'italic' }}>Başvuru yakınması: “{note.basvuruYakinmasi}”</div>
                      )}
                      {note.vitaller && Object.values(note.vitaller).some((v) => v != null && v !== '') && (
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10, fontSize: 12, color: '#8FA0B5' }}>
                          {note.vitaller.kilo != null && <span>Kilo: <strong style={{ color: '#EDF1F7' }}>{note.vitaller.kilo} kg</strong></span>}
                          {note.vitaller.boy != null && <span>Boy: <strong style={{ color: '#EDF1F7' }}>{note.vitaller.boy} cm</strong></span>}
                          {note.vitaller.ates != null && <span>Ateş: <strong style={{ color: '#EDF1F7' }}>{note.vitaller.ates} °C</strong></span>}
                          {note.vitaller.nabiz != null && <span>Nabız: <strong style={{ color: '#EDF1F7' }}>{note.vitaller.nabiz}</strong></span>}
                          {note.vitaller.spo2 != null && <span>SpO2: <strong style={{ color: '#EDF1F7' }}>%{note.vitaller.spo2}</strong></span>}
                          {note.vitaller.tansiyon && <span>TA: <strong style={{ color: '#EDF1F7' }}>{note.vitaller.tansiyon}</strong></span>}
                        </div>
                      )}
                      {(['subjektif', 'objektif', 'degerlendirme', 'plan'] as const).map((alan) => (
                        <div key={alan} style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 3 }}>
                            {alan === 'subjektif' ? 'Anamnez — Şikayet · Şikayetin Hikayesi · Özgeçmiş · Soygeçmiş' : alan === 'objektif' ? 'Fizik Muayene (+ Laboratuvar / Görüntüleme)' : alan === 'degerlendirme' ? 'Tanı' : 'Tedavi'}
                            <span style={{ fontWeight: 400, color: '#64748B' }}> · düzenlenebilir</span>
                          </div>
                          <textarea
                            value={taslak[alan]}
                            onChange={(e) => setTaslak({ ...taslak, [alan]: e.target.value })}
                            rows={Math.min(8, Math.max(2, Math.ceil(taslak[alan].length / 90)))}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#CBD5E1', fontSize: 13, lineHeight: 1.5, padding: '8px 10px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                          />
                        </div>
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
                      {note.receteOnerisi.length > 0 && (
                        <div style={{ marginBottom: 10, background: 'rgba(15,155,142,0.07)', border: '1px solid rgba(15,155,142,0.3)', borderRadius: 8, padding: '8px 10px' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#2DD4BF', marginBottom: 5 }}>Ayşe'nin reçete önerisi <span style={{ fontWeight: 400, color: '#64748B' }}>(öneridir — reçeteyi doktor yazar)</span></div>
                          {note.receteOnerisi.map((r, i2) => (
                            <div key={i2} style={{ fontSize: 13, color: '#CBD5E1', marginBottom: 3 }}>
                              • {[r.ticariOrnek, r.etkenMadde ? `(${r.etkenMadde})` : '', r.doz, r.kullanim, r.sure].filter(Boolean).join(' — ')}
                              {r.sgkListesinde && <span style={{ marginLeft: 6, fontSize: 11, color: '#22C55E' }}>SGK ✓</span>}
                              {r.not && <div style={{ fontSize: 12, color: '#F59E0B', marginLeft: 12 }}>⚠ {r.not}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                      {note.alarmBulgulari.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 3 }}>Alarm bulguları (veliye/hastaya anlatılacak)</div>
                          {note.alarmBulgulari.map((a, i2) => <div key={i2} style={{ fontSize: 13, color: '#CBD5E1' }}>• {a}</div>)}
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
                      {/* NOTYA-KONSULT-03: Ayşe ile not üzerinde konsult, sözle düzenleme, tek-dokunuş takip eylemleri */}
                      <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#2DD4BF', marginBottom: 6 }}>🩺 Ayşe ile bu notu konuşun <span style={{ fontWeight: 400, color: '#64748B' }}>— soru sorun ya da “planı kısalt” gibi düzenleme isteyin</span></div>
                        {kMesajlar.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto', marginBottom: 8 }}>
                            {kMesajlar.map((m, i2) => (
                              <div key={i2} style={{ alignSelf: m.rol === 'doktor' ? 'flex-end' : 'flex-start', maxWidth: '92%', background: m.rol === 'doktor' ? '#0F9B8E' : 'rgba(255,255,255,0.06)', color: '#EDF1F7', borderRadius: 10, padding: '7px 10px', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.icerik}</div>
                            ))}
                            {kBekliyor && <div style={{ fontSize: 12, color: '#64748B' }}>Ayşe düşünüyor…</div>}
                          </div>
                        )}
                        {eylemler.map((e, i2) => (
                          <div key={i2} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: e.durum === 'eklendi' ? 'rgba(34,197,94,0.1)' : 'rgba(15,155,142,0.08)', border: `1px solid ${e.durum === 'eklendi' ? 'rgba(34,197,94,0.4)' : 'rgba(15,155,142,0.35)'}`, borderRadius: 9, padding: '7px 10px', marginBottom: 6, fontSize: 12, color: '#CBD5E1' }}>
                            <span>{e.tur === 'takip_aramasi' ? '📞' : '📅'} {e.tur === 'takip_aramasi' ? `Takip araması (${e.kim === 'sekreter' ? 'sekreter/hemşire' : 'doktor'})` : 'Kontrol randevusu'} — {e.tarih} {e.saat || '10:00'}</span>
                            {e.durum === 'oneri' && <button type="button" onClick={() => eylemOnayla(note, i2)} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Takvime ekle</button>}
                            {e.durum === 'eklendi' && <span style={{ color: '#22C55E', fontWeight: 700 }}>✓ Takvime eklendi</span>}
                            {e.durum === 'hata' && <span style={{ color: '#FCA5A5' }}>Eklenemedi — takvimden elle ekleyin</span>}
                          </div>
                        ))}
                        <form onSubmit={(ev) => { ev.preventDefault(); konsultGonder(note); }} style={{ display: 'flex', gap: 6 }}>
                          <input value={kGirdi} onChange={(ev) => setKGirdi(ev.target.value)} placeholder="Örn. prognoz? / kontrolü 5 gün sonraya planla / planı kısalt" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#EDF1F7', borderRadius: 9, padding: '8px 10px', fontSize: 13, minWidth: 0 }} />
                          <button type="submit" disabled={kBekliyor || !kGirdi.trim()} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 9, padding: '0 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: kBekliyor || !kGirdi.trim() ? 0.5 : 1 }}>Sor</button>
                        </form>
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', gap: 16, alignItems: 'center' }}>
                        <span role="button" tabIndex={0} onClick={() => setAcikId('')} onKeyDown={(e) => { if (e.key === 'Enter') setAcikId(''); }} style={{ fontSize: 12, color: '#14B8A6', cursor: 'pointer' }}>Daralt ▴</span>
                        <span role="button" tabIndex={0} onClick={() => window.open(`/dashboard/doktor/notlar/${note.id}/yazdir`, '_blank')} onKeyDown={(e) => { if (e.key === 'Enter') window.open(`/dashboard/doktor/notlar/${note.id}/yazdir`, '_blank'); }} style={{ fontSize: 12, color: '#8FA0B5', cursor: 'pointer' }}>🖨️ Yazdır / PDF</span>
                      </div>
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
