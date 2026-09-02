/**
 * NOTYA-KONSULT-01 — "Ayşe'ye Danış" sekmesi: doktorun hasta dosyası üzerinde asistanla
 * 1:1 klinik konsültasyonu. Hazır soru çipleri en sık kullanım senaryolarını tek tıka indirir.
 */
'use client';

import { useRef, useState } from 'react';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';

interface Mesaj { rol: 'doktor' | 'asistan'; icerik: string }

const HAZIR_SORULAR = [
  'Bu hastanın bize bu kaçıncı ziyareti?',
  'Son vizitlerini yoğun şekilde özetle.',
  'Son 6 aydaki geliş nedenleri, verilen ilaçlar ve sonuçları neler?',
  'Sürekli kullandığı ilaçları söyle.',
  'Özgeçmişini özetle.',
  'Son görüntüleme kayıtları neler?',
];

export default function HastaKonsult({ patientId }: { patientId: string }) {
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [girdi, setGirdi] = useState('');
  const [bekliyor, setBekliyor] = useState(false);
  const [hata, setHata] = useState('');
  const altRef = useRef<HTMLDivElement>(null);

  async function gonder(metin: string) {
    const soru = metin.trim();
    if (!soru || bekliyor) return;
    setHata('');
    setGirdi('');
    const yeniGecmis: Mesaj[] = [...mesajlar, { rol: 'doktor', icerik: soru }];
    setMesajlar(yeniGecmis);
    setBekliyor(true);
    try {
      const t = await ensureDoctorAccessToken();
      const r = await fetch('/api/doktor/konsult', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, mesajlar: yeniGecmis }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Asistan yanıt veremedi.');
      setMesajlar([...yeniGecmis, { rol: 'asistan', icerik: d.cevap || '' }]);
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Asistan yanıt veremedi.');
    } finally {
      setBekliyor(false);
      setTimeout(() => altRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(15,155,142,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🩺</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Ayşe'ye Danış</div>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>Hastanın tam dosyasını bilir: intake formu, tüm SOAP notları, ilaçlar, aşılar, görüntülemeler. Klinik karar ve sorumluluk doktordadır.</div>
        </div>
      </div>

      {mesajlar.length === 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {HAZIR_SORULAR.map((s) => (
            <button key={s} type="button" onClick={() => gonder(s)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#C9D4E3', borderRadius: 999, padding: '7px 12px', fontSize: 12, cursor: 'pointer' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12, maxHeight: 460, overflowY: 'auto' }}>
        {mesajlar.map((m, i) => (
          <div key={i} style={{ alignSelf: m.rol === 'doktor' ? 'flex-end' : 'flex-start', maxWidth: '85%', background: m.rol === 'doktor' ? '#0F9B8E' : 'rgba(255,255,255,0.06)', border: m.rol === 'doktor' ? 'none' : '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 14, padding: '10px 14px', fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
            {m.icerik}
          </div>
        ))}
        {bekliyor && <div style={{ alignSelf: 'flex-start', color: '#94A3B8', fontSize: 13 }}>Ayşe dosyayı inceliyor…</div>}
        <div ref={altRef} />
      </div>

      {hata && <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', color: '#FCA5A5', borderRadius: 8, padding: '9px 12px', fontSize: 13, marginBottom: 10 }}>{hata}</div>}

      <form onSubmit={(e) => { e.preventDefault(); gonder(girdi); }} style={{ display: 'flex', gap: 8 }}>
        <input
          value={girdi}
          onChange={(e) => setGirdi(e.target.value)}
          placeholder="Hasta hakkında soru sorun… (örn. yeni ilaç etkileşim kontrolü)"
          style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 10, padding: '10px 12px', fontSize: 14 }}
        />
        <button type="submit" disabled={bekliyor || !girdi.trim()} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 10, padding: '0 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: bekliyor || !girdi.trim() ? 0.5 : 1 }}>
          Sor
        </button>
      </form>
    </div>
  );
}
