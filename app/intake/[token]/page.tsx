'use client';

/**
 * NOTYA-INTAKE-01 — hasta bilgi formu, hastanın kendisinin dolduracağı public sayfa. Oturum
 * gerektirmez, token kimlik doğrulamadır (/davet/personel/[token] ile aynı desen).
 *
 * Alanlar CORE_BOLUMLER + bransBolumu şemasından dinamik render edilir — 30 branş için 30 ayrı
 * sayfa yazmak yerine tek render motoru, tek bakım noktası.
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { IntakeAlan, IntakeBolum } from '@/lib/intake/coreAlanlar';

export const dynamic = 'force-dynamic';

interface FormSemasi {
  hastaAdi: string;
  doktorAdi: string;
  coreBolumler: IntakeBolum[];
  bransBolumu: IntakeBolum | null;
  bransEtiket: string | null;
}

function AlanGirdisi({ alan, deger, onChange }: { alan: IntakeAlan; deger: unknown; onChange: (v: unknown) => void }) {
  const ortakStil: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(10,22,40,0.15)',
    fontSize: 14, background: 'white', color: '#0A1628',
  };

  if (alan.tur === 'textarea') {
    return <textarea style={{ ...ortakStil, minHeight: 70, resize: 'vertical' }} value={(deger as string) || ''} onChange={(e) => onChange(e.target.value)} placeholder={alan.placeholder} />;
  }
  if (alan.tur === 'select') {
    return (
      <select style={ortakStil} value={(deger as string) || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Seçiniz…</option>
        {alan.secenekler?.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    );
  }
  if (alan.tur === 'radio') {
    return (
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {alan.secenekler?.map((s) => (
          <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
            <input type="radio" name={alan.id} checked={deger === s} onChange={() => onChange(s)} />
            {s}
          </label>
        ))}
      </div>
    );
  }
  if (alan.tur === 'checkbox-grup') {
    const secililer = (deger as string[]) || [];
    return (
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {alan.secenekler?.map((s) => (
          <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={secililer.includes(s)}
              onChange={(e) => {
                if (e.target.checked) onChange([...secililer, s]);
                else onChange(secililer.filter((x) => x !== s));
              }}
            />
            {s}
          </label>
        ))}
      </div>
    );
  }
  const inputTur = alan.tur === 'tel' ? 'tel' : alan.tur === 'email' ? 'email' : alan.tur === 'date' ? 'date' : 'text';
  return <input style={ortakStil} type={inputTur} value={(deger as string) || ''} onChange={(e) => onChange(e.target.value)} placeholder={alan.placeholder} />;
}

export default function IntakeFormPage() {
  const params = useParams();
  const token = String(params?.token || '');

  const [durum, setDurum] = useState<'yukleniyor' | 'gecerli' | 'gecersiz' | 'tamamlandi'>('yukleniyor');
  const [hataMesaji, setHataMesaji] = useState('');
  const [sema, setSema] = useState<FormSemasi | null>(null);
  const [yanitlar, setYanitlar] = useState<Record<string, unknown>>({});
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [formHata, setFormHata] = useState('');

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const r = await fetch(`/api/intake/${encodeURIComponent(token)}`);
        const d = await r.json();
        if (!r.ok) { setHataMesaji(d.error || 'Form bulunamadı.'); setDurum('gecersiz'); return; }
        setSema(d);
        setDurum('gecerli');
      } catch {
        setHataMesaji('Form doğrulanamadı. Bağlantınızı kontrol edin.');
        setDurum('gecersiz');
      }
    })();
  }, [token]);

  function alanDegistir(id: string, deger: unknown) {
    setYanitlar((y) => ({ ...y, [id]: deger }));
  }

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    setFormHata('');

    const tumBolumler = [...(sema?.coreBolumler || []), ...(sema?.bransBolumu ? [sema.bransBolumu] : [])];
    for (const bolum of tumBolumler) {
      for (const alan of bolum.alanlar) {
        if (alan.zorunlu && !yanitlar[alan.id]) {
          setFormHata(`Lütfen "${alan.etiket}" alanını doldurun.`);
          return;
        }
      }
    }
    if (yanitlar.tcKimlik && !/^\d{11}$/.test(String(yanitlar.tcKimlik))) {
      setFormHata('T.C. Kimlik Numarası 11 haneli olmalıdır.');
      return;
    }

    setGonderiliyor(true);
    try {
      const r = await fetch(`/api/intake/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yanitlar }),
      });
      const d = await r.json();
      if (!r.ok) { setFormHata(d.error || 'Form gönderilemedi.'); return; }
      setDurum('tamamlandi');
    } catch {
      setFormHata('Form gönderilemedi. Bağlantınızı kontrol edin.');
    } finally {
      setGonderiliyor(false);
    }
  }

  const kutu: React.CSSProperties = { background: 'white', borderRadius: 16, padding: 24, maxWidth: 560, width: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9', display: 'flex', alignItems: durum === 'gecerli' ? 'flex-start' : 'center', justifyContent: 'center', padding: '32px 16px' }}>
      {durum === 'yukleniyor' && <div style={{ color: '#64748B' }}>Yükleniyor…</div>}

      {durum === 'gecersiz' && (
        <div style={kutu}>
          <h2 style={{ fontSize: 20, marginBottom: 8, color: '#0A1628' }}>Form Kullanılamıyor</h2>
          <p style={{ color: '#EF4444', fontSize: 14 }}>{hataMesaji}</p>
        </div>
      )}

      {durum === 'gecerli' && sema && (
        <form onSubmit={gonder} style={kutu}>
          <h2 style={{ fontSize: 22, marginBottom: 4, color: '#0A1628' }}>Hasta Bilgi Formu</h2>
          <p style={{ color: 'rgba(10,22,40,0.6)', fontSize: 14, marginBottom: 20 }}>
            {sema.hastaAdi ? `Merhaba ${sema.hastaAdi}, ` : ''}
            {sema.doktorAdi ? `${sema.doktorAdi} ile ` : ''}
            randevunuz öncesinde bu kısa formu doldurmanız muayene sürenizi daha verimli kılar.
          </p>

          {[...sema.coreBolumler, ...(sema.bransBolumu ? [sema.bransBolumu] : [])].map((bolum) => (
            <div key={bolum.baslik} style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F9B8E', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 12 }}>
                {bolum.baslik}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {bolum.alanlar.map((alan) => (
                  <div key={alan.id}>
                    <label style={{ display: 'block', fontSize: 13, color: '#0A1628', marginBottom: 6, fontWeight: 500 }}>
                      {alan.etiket}{alan.zorunlu && <span style={{ color: '#EF4444' }}> *</span>}
                    </label>
                    <AlanGirdisi alan={alan} deger={yanitlar[alan.id]} onChange={(v) => alanDegistir(alan.id, v)} />
                    {alan.yardim && <p style={{ fontSize: 12, color: 'rgba(10,22,40,0.5)', marginTop: 4 }}>{alan.yardim}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {formHata && (
            <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', color: '#991B1B', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>
              {formHata}
            </div>
          )}

          <button
            type="submit"
            disabled={gonderiliyor}
            style={{ width: '100%', padding: '14px', background: '#0F9B8E', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
          >
            {gonderiliyor ? 'Gönderiliyor…' : 'Formu Gönder'}
          </button>
        </form>
      )}

      {durum === 'tamamlandi' && (
        <div style={kutu}>
          <h2 style={{ fontSize: 20, marginBottom: 8, color: '#0A1628' }}>Teşekkürler ✓</h2>
          <p style={{ color: 'rgba(10,22,40,0.6)', fontSize: 14 }}>
            Formunuz başarıyla iletildi. Doktorunuz randevunuzdan önce inceleyecek. Sizi görmek için sabırsızlanıyoruz.
          </p>
        </div>
      )}
    </div>
  );
}
