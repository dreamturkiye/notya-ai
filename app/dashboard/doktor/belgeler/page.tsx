'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useRef, useState } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav';
import {
  getAccessToken,
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

export default function BelgelerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [hastaId, setHastaId] = useState('');
  const [belgeType, setBelgeType] = useState(BELGE_TURLERI[0]);
  const [hastalar, setHastalar] = useState<HastaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    const loadHastalar = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          if (!cancelled) setError('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
          return;
        }

        const res = await fetch('/api/doktor/hastalar', {
          headers: { Authorization: `Bearer ${token}` },
        });

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
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpload = async () => {
    setError('');
    setInfo('');

    if (!hastaId) {
      setError('Lütfen bir hasta seçin.');
      return;
    }
    if (!file) {
      setError('Lütfen yüklenecek bir dosya seçin.');
      return;
    }

    setUploading(true);
    try {
      // Belge yükleme + AI işleme akışı henüz bağlanmadı.
      setInfo(
        `"${file.name}" (${belgeType}) alındı. Belge işleme altyapısı yakında devreye alınacak.`
      );
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
          <div style={{ marginBottom: 16 }}>
            <label style={toolsLabel} htmlFor="belge-hasta">
              Hasta
            </label>
            <select
              id="belge-hasta"
              value={hastaId}
              onChange={(e) => setHastaId(e.target.value)}
              disabled={loading || hastalar.length === 0}
              style={toolsInput}
            >
              {loading && <option value="">Yükleniyor...</option>}
              {!loading && hastalar.length === 0 && <option value="">Hasta bulunamadı</option>}
              {!loading && hastalar.length > 0 && <option value="">Hasta seçin</option>}
              {hastalar.map((h) => (
                <option key={h.id} value={h.id} style={{ background: '#0A1628', color: '#fff' }}>
                  {h.label}
                </option>
              ))}
            </select>
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
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                ...toolsInput,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '10px 12px',
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  color: '#F8FAFC',
                  fontWeight: 600,
                }}
              >
                Dosya Seç
              </span>
              <span
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: file ? '#E2E8F0' : '#94A3B8',
                }}
              >
                {file ? file.name : 'Dosya seçilmedi'}
              </span>
            </button>
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading || !hastaId || !file}
            style={toolsPrimaryBtn(uploading || !hastaId || !file)}
          >
            {uploading ? 'İşleniyor...' : 'Yükle ve İşle'}
          </button>

          {error && <div style={toolsErrorBox}>{error}</div>}
          {info && !error && (
            <div
              style={{
                marginTop: 12,
                padding: '12px 14px',
                borderRadius: 12,
                background: 'rgba(15,155,142,0.14)',
                border: '1px solid rgba(94,234,212,0.32)',
                color: '#99F6E4',
                fontSize: 13,
                lineHeight: 1.45,
              }}
            >
              {info}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
