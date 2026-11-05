'use client';
/**
 * AMELIYAT-NOTU-01 — the operation note on the doctor's letterhead (A4). CORE: the same paper for every surgical branch.
 * Header: the doctor's name with the STORED title (OP-DR-01). Content: lib/doktor/ameliyatNotu.ts → ameliyatNotuBolumleri.
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { AntetliKagit, KAGIT, yazdirTarih, type Antet } from '@/components/doktor/yazdir/AntetliKagit';
import { ACILIYET_ETIKETLERI, ANESTEZI_ETIKETLERI, ameliyatNotuBolumleri, type AmeliyatNotuVeri } from '@/lib/doktor/ameliyatNotu';

type Veri = { not: { id: string; ameliyat_tarihi: string; imzalandi_at: string | null; veri: AmeliyatNotuVeri }; baslik: Antet };

export default function AmeliyatNotuYazdir() {
  const p = useParams<{ id: string; nid: string }>();
  const [v, setV] = useState<Veri | null>(null);
  const [hata, setHata] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const t = await ensureDoctorAccessToken();
        const r = await fetch(`/api/doktor/ameliyat-notlari?patientId=${encodeURIComponent(p.id)}&id=${encodeURIComponent(p.nid)}`, { headers: { Authorization: `Bearer ${t}` } });
        const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Yüklenemedi'); setV(d);
      } catch (e) { setHata(e instanceof Error ? e.message : 'Yüklenemedi'); }
    })();
  }, [p.id, p.nid]);
  if (hata) return <div style={{ padding: 24, fontFamily: 'system-ui' }}>{hata}</div>;
  if (!v) return <div style={{ padding: 24, fontFamily: 'system-ui', color: '#666' }}>Yükleniyor…</div>;
  const n = v.not.veri;
  const saat = n.baslangic ? n.baslangic.slice(11, 16) : '';
  return (
    <AntetliKagit baslik="AMELİYAT NOTU" antet={v.baslik} geriHref={`/dashboard/doktor/hastalar/${p.id}?tab=ameliyat`} geriEtiket="Ameliyat Notları" tarih={v.not.ameliyat_tarihi}
      altBilgi={v.not.imzalandi_at ? `Elektronik olarak imzalandı: ${new Date(v.not.imzalandi_at).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}` : 'TASLAK — imzalanmamış ameliyat notu.'}>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 6 }}>
        <tbody>
          <tr><td style={KAGIT.TD}><b>Tarih / saat</b></td><td style={KAGIT.TD}>{yazdirTarih(v.not.ameliyat_tarihi)} {saat}{n.bitis ? ` – ${n.bitis}` : ''}</td><td style={KAGIT.TD}><b>Aciliyet</b></td><td style={KAGIT.TD}>{n.aciliyet ? ACILIYET_ETIKETLERI[n.aciliyet] : '—'}</td></tr>
          <tr><td style={KAGIT.TD}><b>Operatör</b></td><td style={KAGIT.TD}>{n.cerrah || '—'}</td><td style={KAGIT.TD}><b>Asistan(lar)</b></td><td style={KAGIT.TD}>{n.asistanlar || '—'}</td></tr>
          <tr><td style={KAGIT.TD}><b>Anestezi</b></td><td style={KAGIT.TD}>{n.anesteziTuru ? ANESTEZI_ETIKETLERI[n.anesteziTuru] : '—'}</td><td style={KAGIT.TD}><b>Anestezi uzmanı</b></td><td style={KAGIT.TD}>{n.anestezist || '—'}</td></tr>
        </tbody>
      </table>
      {ameliyatNotuBolumleri(n).map((b) => (
        <div key={b.anahtar}>
          <div style={KAGIT.H}>{b.etiket}</div>
          <p style={KAGIT.P}>{b.deger}</p>
        </div>
      ))}
    </AntetliKagit>
  );
}
