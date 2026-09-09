'use client';
/**
 * NOTYA-MEDULA P1b — Kâğıt reçete (yazdır).
 *
 * Kaan direktifi (2026-09-09): Gökhan ne kullanırsa kullansın, tüm doktorlara en iyi işlev —
 * kimi kâğıt yazar, kimi MBYS kullanır; ikisi de bugün çalışmalı. Bu sayfa kâğıt yolunu kapatır:
 * Türk reçete geleneğinde A5/A4 çıktı — hekim başlığı, hasta, tarih, Rp: satırları, S: kullanım
 * talimatı, kutu adedi, tanı (ICD-10), kaşe/imza alanı. Ayşe'nin SUT/güvenlik uyarıları ekranda
 * görünür, kâğıda basılmaz. Aynı veri MBYS yolunda "Medula için kopyala" ve e-Reçete XML'e gider.
 */
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';

interface Satir { ilacAdi: string; etkenMadde: string; dozMetni: string; kullanimOzeti: string; gunSayisi: number | null; kutu: number }
interface Veri {
  satirlar: Satir[]
  tanilar: { taniKodu: string; taniAdi?: string }[]
  uyarilar: string[]
  baslik: { doktor: { unvan: string; ad: string; brans: string; klinik: string }; hasta: { ad: string; dogum: string | null; cinsiyet: string | null }; tarih: string }
  xml: string
}

const BRANS_AD: Record<string, string> = { pediatri: 'Çocuk Sağlığı ve Hastalıkları', 'dahiliye': 'İç Hastalıkları', 'kbb': 'Kulak Burun Boğaz', 'dermatoloji': 'Deri ve Zührevi Hastalıkları', 'kadin-dogum': 'Kadın Hastalıkları ve Doğum', 'aile-hekimligi': 'Aile Hekimliği' };

function yas(dogum: string | null): string {
  if (!dogum) return '';
  const d = new Date(dogum); if (isNaN(d.getTime())) return '';
  const ay = Math.floor((Date.now() - d.getTime()) / (30.44 * 86400000));
  return ay < 24 ? `${ay} aylık` : `${Math.floor(ay / 12)} yaş`;
}
function trTarih(iso: string): string { return new Date(iso).toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric' }); }

export default function ReceteYazdirPage() {
  const params = useParams<{ id: string }>();
  const [veri, setVeri] = useState<Veri | null>(null);
  const [hata, setHata] = useState('');
  const [kopya, setKopya] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const t = await ensureDoctorAccessToken();
        const r = await fetch(`/api/doktor/medula/recete?noteId=${params.id}`, { headers: { Authorization: `Bearer ${t}` } });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Reçete alınamadı');
        setVeri(j);
      } catch (e) { setHata(e instanceof Error ? e.message : 'Hata'); }
    })();
  }, [params.id]);

  const xmlIndir = () => {
    if (!veri) return;
    const blob = new Blob([veri.xml], { type: 'application/xml' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `erecete-${params.id.slice(0, 8)}.xml`; a.click();
  };
  const medulaKopyala = async () => {
    if (!veri) return;
    const t = await ensureDoctorAccessToken();
    const r = await fetch(`/api/doktor/medula/recete?noteId=${params.id}`, { headers: { Authorization: `Bearer ${t}` } });
    const j = await r.json();
    await navigator.clipboard.writeText(j.metin || '');
    setKopya(true); setTimeout(() => setKopya(false), 3000);
  };

  if (hata) return <div style={{ padding: 40, fontFamily: 'system-ui' }}>{hata}</div>;
  if (!veri) return <div style={{ padding: 40, fontFamily: 'system-ui', color: '#666' }}>Reçete hazırlanıyor…</div>;
  const { baslik, satirlar, tanilar, uyarilar } = veri;
  const bransAd = BRANS_AD[baslik.doktor.brans] || baslik.doktor.brans;

  return (
    <div style={{ background: '#E5E7EB', minHeight: '100vh' }}>
      <style>{`
        @media print { .yazdirma-gizle { display: none !important; } body, .sayfa-zemin { background: white !important; } .recete-kagit { box-shadow: none !important; margin: 0 !important; width: auto !important; min-height: auto !important; } @page { size: A5 portrait; margin: 12mm; } }
      `}</style>
      <div className="yazdirma-gizle" style={{ background: '#0B1628', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ color: 'white', fontFamily: 'system-ui', fontSize: 14, fontWeight: 700 }}>Reçete — Kâğıt / MBYS</span>
        <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={medulaKopyala} style={{ background: 'rgba(45,212,191,0.18)', border: '1px solid rgba(45,212,191,0.45)', color: 'white', borderRadius: 8, padding: '8px 14px', fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{kopya ? '✓ Kopyalandı' : '📋 MBYS / Medula için kopyala'}</button>
          <button type="button" onClick={xmlIndir} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: 8, padding: '8px 14px', fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>⬇ e-Reçete XML</button>
          <button type="button" onClick={() => window.print()} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 8, padding: '8px 18px', fontFamily: 'system-ui', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>🖨️ Kâğıt reçete yazdır</button>
        </span>
      </div>

      {uyarilar.length > 0 && (
        <div className="yazdirma-gizle" style={{ maxWidth: 620, margin: '12px auto 0', padding: '10px 14px', background: '#FFF7E6', border: '1px solid #F5C36A', borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: '#5C3D00' }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Ayşe — reçeteyi imzalamadan önce:</div>
          {uyarilar.map((u, i) => <div key={i}>• {u}</div>)}
        </div>
      )}

      {/* A5 kâğıt */}
      <div className="recete-kagit" style={{ width: 148 * 3.78, minHeight: 210 * 3.78, background: 'white', margin: '16px auto 32px', padding: '28px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.15)', fontFamily: 'Georgia, "Times New Roman", serif', color: '#111', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', borderBottom: '1.5px solid #111', paddingBottom: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 0.3 }}>{baslik.doktor.unvan} {baslik.doktor.ad}</div>
          {bransAd && <div style={{ fontSize: 12 }}>{bransAd} Uzmanı</div>}
          {baslik.doktor.klinik && <div style={{ fontSize: 11, color: '#333' }}>{baslik.doktor.klinik}</div>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 14, gap: 12 }}>
          <div>
            <div><b>Hasta:</b> {baslik.hasta.ad || '________________'}</div>
            <div><b>Yaş:</b> {yas(baslik.hasta.dogum) || '____'}{baslik.hasta.cinsiyet ? ` · ${baslik.hasta.cinsiyet === 'male' ? 'E' : 'K'}` : ''}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div><b>Tarih:</b> {trTarih(baslik.tarih)}</div>
            {tanilar.length > 0 && <div><b>Tanı:</b> {tanilar.map((t) => t.taniKodu).join(', ')}</div>}
          </div>
        </div>

        <div style={{ fontSize: 20, fontWeight: 700, fontStyle: 'italic', marginBottom: 8 }}>Rp.</div>
        {satirlar.length === 0 && <div style={{ fontSize: 12, color: '#666' }}>Bu nota bağlı onaylı ilaç yok.</div>}
        <ol style={{ margin: 0, paddingLeft: 22, fontSize: 13, lineHeight: 1.55 }}>
          {satirlar.map((s, i) => (
            <li key={i} style={{ marginBottom: 10 }}>
              <div><b>{s.ilacAdi}</b>{s.dozMetni ? ` ${s.dozMetni}` : ''} <span style={{ float: 'right' }}>{s.kutu} kutu</span></div>
              <div style={{ paddingLeft: 10, fontStyle: 'italic' }}>S: {s.kullanimOzeti}{s.gunSayisi ? '' : ''}</div>
            </li>
          ))}
        </ol>

        <div style={{ marginTop: 'auto', paddingTop: 48, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'center', fontSize: 11, color: '#333', borderTop: '1px solid #111', paddingTop: 6, minWidth: 180 }}>
            Kaşe / İmza<br />
            <span style={{ color: '#666' }}>Diploma No: ____________</span>
          </div>
        </div>
        <div style={{ marginTop: 18, fontSize: 9, color: '#777', textAlign: 'center' }}>Notya AI ile hazırlandı · Hekim onayı ile geçerlidir</div>
      </div>
    </div>
  );
}
