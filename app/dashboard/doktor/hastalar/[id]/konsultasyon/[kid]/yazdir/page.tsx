'use client';
/**
 * KONSULTASYON-01 (Kaan 2026-09-19) — KONSÜLTASYON İSTEM FORMU (yazdır / PDF, A4). Reçete / epikriz / gebe izlem kartı
 * ile aynı antet ve kağıt dili (users.recete_baslik).
 *
 * TTB konsültasyon ilkesine göre istem formunda: hastanın tanımlayıcı bilgileri, muhtemel/kesin tanılar, mevcut hali,
 * konsültasyon istenme NEDENİ (kısaltmasız klinik soru), istenme TARİHİ, aciliyet; müdavi hekim kaşe/imza alanı ve
 * konsültan hekim için yanıt alanı.
 *
 * SGK sevk belgesine BENZEMEZ: başlık "KONSÜLTASYON İSTEM FORMU"; altta bunun SUT EK-2/F / e-sevk olmadığı yazar.
 * Hasta adı yalnız bu hekimin kendi ekranında çizilir (GET ?form, doctor_id kapsamlı); herkese açık HTML yok.
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import KonsultasyonIstemFormuKagidi, { type IstemFormuVerisi } from '@/components/doktor/KonsultasyonIstemFormuKagidi';

type Veri = IstemFormuVerisi;

export default function KonsultasyonIstemFormu() {
  const params = useParams<{ id: string; kid: string }>();
  const [v, setV] = useState<Veri | null>(null);
  const [hata, setHata] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const t = await ensureDoctorAccessToken();
        const r = await fetch(`/api/doktor/konsultasyon?form=${encodeURIComponent(params.kid)}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
        const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Yüklenemedi'); setV(d);
      } catch (e) { setHata(e instanceof Error ? e.message : 'Yüklenemedi'); }
    })();
  }, [params.kid]);

  const geri = `/dashboard/doktor/hastalar/${params.id}?tab=konsultasyon`;
  if (hata) return <div style={{ padding: 24, fontFamily: 'system-ui' }}>{hata} <a href={geri}>← Konsültasyonlar</a></div>;
  if (!v) return <div style={{ padding: 24, fontFamily: 'system-ui', color: '#666' }}>Yükleniyor…</div>;
  const k = v.konsultasyon;

  return (
    <div style={{ background: 'white', color: '#111', minHeight: '100vh', fontFamily: 'Georgia, "Times New Roman", serif' }}>
      <style>{`@media print { .yazdirma-gizle { display: none !important; } body { -webkit-print-color-adjust: exact; } @page { size: A4; margin: 14mm; } }`}</style>
      <div className="yazdirma-gizle" style={{ background: '#F6F0E4', borderBottom: '1px solid rgba(58,44,34,0.1)', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', minWidth: 0 }}>
          <a href={geri} style={{ color: '#8b7d70', fontFamily: 'system-ui', fontSize: 13, textDecoration: 'none' }}>← Konsültasyonlar</a>
          <span style={{ color: '#2e251d', fontFamily: 'system-ui', fontSize: 14, fontWeight: 700 }}>Konsültasyon istem formu · {k.hedefEtiketi}</span>
        </span>
        <button type="button" onClick={() => window.print()} style={{ background: '#2f4334', border: 'none', color: '#FAF8F4', borderRadius: 8, padding: '10px 18px', fontFamily: 'system-ui', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44 }}>🖨️ Yazdır / PDF (A4)</button>
      </div>

      <KonsultasyonIstemFormuKagidi v={v} />
    </div>
  );
}
