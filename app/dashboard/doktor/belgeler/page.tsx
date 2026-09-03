'use client';

export const dynamic = 'force-dynamic';

/**
 * NOTYA-BELGE-01 (canlı defter):
 * 1. Hasta seçimi yazarak-ara kombobox — 300 hastalı doktor kaydırmaz, adın bir parçasını
 *    yazar, süzülen listeden seçer (tam liste de tıklamayla açılır; tek yöntem dayatılmaz).
 * 2. Seçilen dosya göndermeden önce ✕ ile kaldırılıp değiştirilebilir.
 * 3. "Yükle ve İşle" artık GERÇEK: dosya Storage'a gider, hasta_belgeler kaydı açılır
 *    (önceden buton yalnız bilgi mesajı basan bir yer tutucuydu).
 */

import React, { useEffect, useRef, useState } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav';
import {
  getAccessTokenAsync,
  normalizeHastalar,
  toolsShell,
  toolsCard,
  toolsInput,
  toolsLabel,
  toolsPrimaryBtn,
  toolsErrorBox,
  type HastaOption,
} from '@/lib/doktor/toolsUi';

const BELGE_TURLERI = [
  'Lab Sonucu',
  'Görüntüleme Raporu',
  'Epikriz',
  'Reçete',
  'Sevk',
  'Diğer',
];

const DOSYA_LIMIT = 3 * 1024 * 1024; // base64 şişmesiyle Vercel gövde sınırına güvenli mesafe

export default function BelgelerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [hastaId, setHastaId] = useState('');
  const [hastaAra, setHastaAra] = useState('');
  const [listeAcik, setListeAcik] = useState(false);
  const [belgeType, setBelgeType] = useState(BELGE_TURLERI[0]);
  const [hastalar, setHastalar] = useState<HastaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const kutuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const loadHastalar = async () => {
      try {
        const token = await getAccessTokenAsync();
        if (!token) {
          if (!cancelled) setError('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
          return;
        }
        const res = await fetch('/api/doktor/hastalar', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          if (!cancelled) setError('Hasta listesi alınamadı.');
          return;
        }
        const data = await res.json();
        if (!cancelled) setHastalar(normalizeHastalar(data));
      } catch {
        if (!cancelled) setError('Hasta listesi alınamadı. Bağlantınızı kontrol edin.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadHastalar();
    return () => { cancelled = true; };
  }, []);

  // Dış tıklamada listeyi kapat
  useEffect(() => {
    const kapat = (e: MouseEvent) => {
      if (kutuRef.current && !kutuRef.current.contains(e.target as Node)) setListeAcik(false);
    };
    document.addEventListener('mousedown', kapat);
    return () => document.removeEventListener('mousedown', kapat);
  }, []);

  const secili = hastalar.find((h) => h.id === hastaId) || null;
  const aramaMetni = hastaAra.trim().toLocaleLowerCase('tr');
  const suzulen = aramaMetni
    ? hastalar.filter((h) => h.label.toLocaleLowerCase('tr').includes(aramaMetni))
    : hastalar;

  const hastaSec = (h: HastaOption) => {
    setHastaId(h.id);
    setHastaAra(h.label);
    setListeAcik(false);
  };

  const dosyaSecildi = (f: File | null) => {
    setError('');
    if (f && f.size > DOSYA_LIMIT) {
      setError('Dosya 3 MB sınırını aşıyor. Lütfen daha küçük bir dosya (ör. sıkıştırılmış PDF/JPG) seçin.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setFile(f);
  };

  const dosyayiKaldir = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    setError('');
    setInfo('');
    if (!hastaId) { setError('Lütfen bir hasta seçin.'); return; }
    if (!file) { setError('Lütfen yüklenecek bir dosya seçin.'); return; }

    setUploading(true);
    try {
      const token = await getAccessTokenAsync();
      if (!token) throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
      const base64 = await new Promise<string>((coz, reddet) => {
        const r = new FileReader();
        r.onload = () => coz(String(r.result).split(',')[1] || '');
        r.onerror = () => reddet(new Error('Dosya okunamadı.'));
        r.readAsDataURL(file);
      });
      const res = await fetch('/api/doktor/belgeler/ingest', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mimeType: file.type || 'application/pdf', hastaId, belgeType }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Belge yüklenemedi. Lütfen tekrar deneyin.');
      setInfo(`"${file.name}" (${belgeType}) ${secili ? secili.label + ' dosyasına ' : ''}yüklendi ve arşivlendi.`);
      dosyayiKaldir();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Belge yüklenemedi.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={toolsShell}>
      <DoktorNav />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 56px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Belge Yükleme</h1>
        <p style={{ color: '#94A3B8', fontSize: 14, margin: '6px 0 20px' }}>
          Hasta belgelerini yükleyin ve arşivleyin
        </p>

        <div style={toolsCard}>
          <div style={{ marginBottom: 16, position: 'relative' }} ref={kutuRef}>
            <label style={toolsLabel} htmlFor="belge-hasta">
              Hasta
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="belge-hasta"
                value={hastaAra}
                disabled={loading}
                placeholder={loading ? 'Yükleniyor…' : 'Hasta adını yazın ya da listeden seçin'}
                onChange={(e) => {
                  setHastaAra(e.target.value);
                  setListeAcik(true);
                  if (hastaId && e.target.value !== (secili?.label || '')) setHastaId('');
                }}
                onFocus={() => setListeAcik(true)}
                autoComplete="off"
                style={{ ...toolsInput, width: '100%', boxSizing: 'border-box', paddingRight: 34 }}
              />
              {(hastaAra || hastaId) && (
                <button
                  type="button"
                  aria-label="Seçimi temizle"
                  onClick={() => { setHastaId(''); setHastaAra(''); setListeAcik(false); }}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', fontSize: 15, cursor: 'pointer', padding: 4 }}
                >
                  ✕
                </button>
              )}
            </div>
            {listeAcik && !loading && (
              <div style={{ position: 'absolute', zIndex: 30, left: 0, right: 0, marginTop: 4, background: '#0D1C33', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, maxHeight: 240, overflowY: 'auto', boxShadow: '0 12px 30px rgba(0,0,0,0.45)' }}>
                {suzulen.length === 0 && (
                  <div style={{ padding: '11px 14px', fontSize: 13, color: '#94A3B8' }}>Eşleşen hasta yok</div>
                )}
                {suzulen.map((h) => (
                  <div
                    key={h.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => hastaSec(h)}
                    onKeyDown={(e) => { if (e.key === 'Enter') hastaSec(h); }}
                    style={{ padding: '10px 14px', fontSize: 13.5, color: h.id === hastaId ? '#2DD4BF' : '#E2E8F0', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    {h.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={toolsLabel} htmlFor="belge-turu">
              Belge Türü
            </label>
            <select
              id="belge-turu"
              value={belgeType}
              onChange={(e) => setBelgeType(e.target.value)}
              style={toolsInput}
            >
              {BELGE_TURLERI.map((t) => (
                <option key={t} value={t} style={{ background: '#0A1628', color: '#fff' }}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={toolsLabel} htmlFor="belge-dosya">
              Dosya
            </label>
            <input
              id="belge-dosya"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => dosyaSecildi(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
            />
            {!file ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ ...toolsInput, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', fontSize: 13, cursor: 'pointer', textAlign: 'left', width: '100%', boxSizing: 'border-box' }}
              >
                <span style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', color: '#F8FAFC', fontWeight: 600 }}>
                  Dosya Seç
                </span>
                <span style={{ color: '#94A3B8' }}>PDF, JPG veya PNG (≤3 MB)</span>
              </button>
            ) : (
              <div style={{ ...toolsInput, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', width: '100%', boxSizing: 'border-box' }}>
                <span style={{ fontSize: 16 }}>📄</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#E2E8F0', fontSize: 13 }}>
                  {file.name} <span style={{ color: '#64748B' }}>({Math.max(1, Math.round(file.size / 1024))} KB)</span>
                </span>
                <button
                  type="button"
                  aria-label="Dosyayı kaldır"
                  onClick={dosyayiKaldir}
                  style={{ flexShrink: 0, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#FCA5A5', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  ✕ Kaldır
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ flexShrink: 0, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: '#E2E8F0', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Değiştir
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading || !hastaId || !file}
            style={toolsPrimaryBtn(uploading || !hastaId || !file)}
          >
            {uploading ? 'Yükleniyor…' : 'Yükle ve İşle'}
          </button>

          {error && <div style={toolsErrorBox}>{error}</div>}
          {info && !error && (
            <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 12, background: 'rgba(15,155,142,0.14)', border: '1px solid rgba(94,234,212,0.32)', color: '#99F6E4', fontSize: 13, lineHeight: 1.45 }}>
              {info}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
