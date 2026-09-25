'use client';

/**
 * NOTYA-INTAKE-01 / NOTYA-INTAKE-03 — hasta bilgi formu, hastanın kendisinin dolduracağı public
 * sayfa. Oturum gerektirmez, token kimlik doğrulamadır (/davet/personel/[token] ile aynı desen).
 *
 * Alanlar CORE_BOLUMLER + bransBolumu şemasından dinamik render edilir — 30 branş için 30 ayrı
 * sayfa yazmak yerine tek render motoru, tek bakım noktası; PDF baskı sürümüyle (lib/intake
 * içeriğinden Python'a elle taşınan) aynı kaynak şemayı paylaşır.
 *
 * Tasarım prensipleri (Acıbadem/Medicana/Amerikan Hastanesi karşılaştırması + Apple HIG sadelik
 * ilkesi): checkbox ve radio gruplar organik flex-wrap yerine EXPLICIT 2-3 sütunlu grid'de —
 * "15-20 seçenek tek sütunda" anti-pattern'inden kaçınmak için. Bölüm başlıkları numaralı,
 * yuvarlak rozetli — doktorun/hastanın gözü 30 saniyede tarayabilsin diye.
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { intakeFormBolumleri, type IntakeBolum } from '@/lib/intake/coreAlanlar';
import { intakeAlanHatalari, intakeGorunmeyenYanitlariAyikla } from '@/lib/intake/dogrula';
import IntakeBolumleri from '@/components/intake/IntakeBolumleri';

export const dynamic = 'force-dynamic';

interface FormSemasi {
  hastaAdi: string;
  doktorAdi: string;
  coreBolumler: IntakeBolum[];
  bransBolumu: IntakeBolum | null;
  bransEtiket: string | null;
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
  const [alanHatalari, setAlanHatalari] = useState<Record<string, string>>({});

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
    const bolumler = intakeFormBolumleri(sema?.coreBolumler || [], sema?.bransBolumu || null)
    // Gizlenen alanın yanıtı atılır: gosterEger koşulu bozulan alan (gebelik haftası) ve VELI-YASAL-ONAM — doğum
    // tarihi erişkine düzeltilince Veli / Yasal Temsilci bölümü (sunucu da aynı süzgeci uygular).
    const yeni = intakeGorunmeyenYanitlariAyikla(bolumler, { ...yanitlar, [id]: deger })
    setYanitlar(yeni)
    // Gönderimden sonra işaretlenen alanlar yazdıkça yeniden denetlenir; düzelen alanın satırı kalkar.
    if (Object.keys(alanHatalari).length) {
      const guncel = intakeAlanHatalari(bolumler, yeni)
      setAlanHatalari(Object.fromEntries(Object.entries(guncel).filter(([k]) => k in alanHatalari)))
    }
  }

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    setFormHata('');

    // NOTYA-INTAKE-08: zorunluluk/desen kurallari sunucuyla TEK govdeden (lib/intake/dogrula.ts)
    // okunur — istemcinin "zorunlu" tanimi sunucununkinden ayrisamasin diye.
    // NOTYA-BETA-0925: form noValidate — tarayıcının İngilizce baloncukları yerine her alanın altında Türkçe satır.
    const tumBolumler = intakeFormBolumleri(sema?.coreBolumler || [], sema?.bransBolumu || null);
    const hatalar = intakeAlanHatalari(tumBolumler, yanitlar);
    const hataliAlanlar = Object.keys(hatalar);
    setAlanHatalari(hatalar);
    if (hataliAlanlar.length) {
      setFormHata(hataliAlanlar.length === 1 ? 'Lütfen işaretli alanı düzeltin.' : `Lütfen işaretli ${hataliAlanlar.length} alanı düzeltin.`);
      const ilk = document.getElementById(`alan-${hataliAlanlar[0]}`);
      ilk?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      ilk?.querySelector<HTMLElement>('input, textarea, select')?.focus({ preventScroll: true });
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

  const kutu: React.CSSProperties = { background: 'white', borderRadius: 16, padding: 24, maxWidth: 600, width: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };

  const tumBolumler = sema ? intakeFormBolumleri(sema.coreBolumler, sema.bransBolumu) : [];

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
        <form onSubmit={gonder} noValidate style={kutu}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
            <h2 style={{ fontSize: 22, margin: 0, color: '#0A1628' }}>Hasta Bilgi Formu</h2>
            <span style={{ fontSize: 11, color: '#0F9B8E', background: 'rgba(15,155,142,0.1)', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap', fontWeight: 600 }}>
              ~3-5 dakika
            </span>
          </div>
          <p style={{ color: 'rgba(10,22,40,0.6)', fontSize: 14, marginBottom: 24 }}>
            {sema.hastaAdi ? `Merhaba ${sema.hastaAdi}, ` : ''}
            {sema.doktorAdi ? `${sema.doktorAdi} ile ` : ''}
            randevunuz öncesinde bu kısa formu doldurmanız muayene sürenizi daha verimli kılar.
          </p>

          <IntakeBolumleri bolumler={tumBolumler} yanitlar={yanitlar} onDegis={alanDegistir} hatalar={alanHatalari} />

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
            Formunuz başarıyla iletildi. {sema?.doktorAdi ? `${sema.doktorAdi} randevunuzdan önce inceleyecek` : 'Doktorunuz randevunuzdan önce inceleyecek'}. Yakında görüşmek üzere.
          </p>
        </div>
      )}
    </div>
  );
}
