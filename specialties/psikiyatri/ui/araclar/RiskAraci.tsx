'use client';
/**
 * PSIK-EXCEPTIONAL-01 — Araçlar › Güvenlik & acil triyaj. Psikiyatri-only.
 * Hekimin işaretlediği bayraklar + serbest metin taraması (acilTara) → eylem yönlendirmesi ve kontrol listesi.
 * "Hemen" bandı bayrak varken hekim onayı olmadan kayıt yapılmaz (API 409). Notya karar vermez, kaydı hekim kilitler.
 */
import React, { useMemo, useState } from 'react';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { psikStil, PsikHastaSecici, PsikOnay, PsikKopyala, Istatistik, TaslakNotu } from './PsikAracKabugu';
import { acilTara, hekimOnayiGerekliMi, ACIL_KODLARI, GUVENLIK_KONTROL_LISTESI, HASTA_ACIL_METNI, type AcilKod } from '../../engines/acil';
import { ACIL_YONLENDIRME_METNI } from '../../engines/psikiyatri';

export default function RiskAraci() {
  const [isaretli, setIsaretli] = useState<AcilKod[]>([]);
  const [metin, setMetin] = useState('');
  const [liste, setListe] = useState<number[]>([]);
  const [eylem, setEylem] = useState('');
  const [onay, setOnay] = useState(false);
  const [hastaId, setHastaId] = useState('');
  const [durum, setDurum] = useState('');
  const [hata, setHata] = useState('');

  const bayraklar = useMemo(() => acilTara([metin], isaretli), [metin, isaretli]);
  const onayGerek = hekimOnayiGerekliMi(bayraklar);

  const ozet = [
    bayraklar.length ? `Güvenlik bayrakları: ${bayraklar.map((b) => b.ad).join('; ')}` : 'Güvenlik bayrağı saptanmadı (hekim değerlendirmesi esas)',
    ...liste.map((i) => `✓ ${GUVENLIK_KONTROL_LISTESI[i]}`),
    eylem ? `Hekim eylemi: ${eylem}` : '',
  ].filter(Boolean).join('\n');

  const kaydet = async () => {
    setDurum(''); setHata('');
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return; }
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/psikiyatri', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: hastaId, adim: 'risk', bayraklar: isaretli, metin,
          eylem: [eylem, ...liste.map((i) => GUVENLIK_KONTROL_LISTESI[i])].filter(Boolean).join(' | '),
          hekimOnay: onay,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return; }
      setDurum('Güvenlik değerlendirmesi hasta dosyasına kaydedildi.');
    } catch { setHata('Kaydedilemedi'); }
  };

  return (
    <>
      <div style={{ ...psikStil.kutu, ...psikStil.kirmizi }}>{ACIL_YONLENDIRME_METNI}</div>

      <div style={psikStil.kutu}>
        <div style={psikStil.etiket}>Hekim işareti</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {ACIL_KODLARI.map((k) => (
            <PsikOnay
              key={k.kod}
              ad={k.ad}
              deger={isaretli.includes(k.kod)}
              set={(b) => setIsaretli((p) => (b ? [...p, k.kod] : p.filter((x) => x !== k.kod)))}
            />
          ))}
        </div>
        <div style={{ ...psikStil.etiket, marginTop: 12 }}>Hastanın kendi ifadesi (isteğe bağlı)</div>
        <div style={psikStil.kucuk}>Metin yalnız anahtar ifade taraması içindir; hiçbir tanı üretmez.</div>
        <textarea
          value={metin}
          onChange={(e) => setMetin(e.target.value)}
          rows={3}
          aria-label="Hastanın ifadesi"
          style={{ ...psikStil.input, width: '100%', marginTop: 8, resize: 'vertical' }}
        />
      </div>

      <div style={psikStil.kutu}>
        <div style={psikStil.etiket}>Triyaj sonucu</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={bayraklar.length} etiket="Güvenlik bayrağı" ton={bayraklar.length ? 'kirmizi' : 'iyi'} />
          <Istatistik deger={onayGerek ? 'Gerekli' : 'Gerekmiyor'} etiket="Hekim onayı" ton={onayGerek ? 'uyari' : 'notr'} />
          <Istatistik deger={`${liste.length} / ${GUVENLIK_KONTROL_LISTESI.length}`} etiket="Kontrol listesi" ton={liste.length ? 'notr' : 'uyari'} />
        </div>
        {!bayraklar.length && <div style={psikStil.metin}>Bayrak yok. Klinik kanı bayraktan önce gelir — riski siz görüyorsanız işaretleyin.</div>}
        {bayraklar.map((b) => (
          <div key={b.kod} style={{ ...(b.oncelik === 'hemen' ? psikStil.kirmizi : psikStil.kutu), marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: b.oncelik === 'hemen' ? '#FCA5A5' : '#EDF1F7' }}>
              {b.oncelik === 'hemen' ? '⚑ HEMEN' : '• AYNI GÜN'} — {b.ad}
            </div>
            <div style={{ ...psikStil.metin, marginTop: 4 }}>{b.eylem}</div>
            <div style={{ ...psikStil.kucuk, marginTop: 4 }}>{b.dipnot.not}</div>
          </div>
        ))}
        {bayraklar.length > 0 && <div style={psikStil.kucuk}>{HASTA_ACIL_METNI}</div>}
        <TaslakNotu>Bayraklar tarama çıktısıdır; risk kararı, eylem ve kayıt kilidi hekimindir.</TaslakNotu>
      </div>

      <div style={psikStil.kutu}>
        <div style={psikStil.etiket}>Güvenlik kontrol listesi</div>
        <div style={psikStil.kucuk}>Notya hiçbir maddeyi kendiliğinden “kapandı” saymaz.</div>
        {GUVENLIK_KONTROL_LISTESI.map((m, i) => (
          <PsikOnay key={m} ad={m} deger={liste.includes(i)} set={(b) => setListe((p) => (b ? [...p, i] : p.filter((x) => x !== i)))} />
        ))}
        <div style={{ ...psikStil.etiket, marginTop: 12 }}>Hekim eylemi</div>
        <input
          value={eylem}
          onChange={(e) => setEylem(e.target.value)}
          placeholder="Kriz planı, sevk, randevu aralığı, yanında kalacak kişi…"
          aria-label="Hekim eylemi"
          style={{ ...psikStil.input, width: '100%' }}
        />
        <PsikOnay
          ad="Gördüm ve eylemi yazdım (hekim onayı)"
          aciklama={onayGerek ? 'Bu bayraklarla onay olmadan kayıt yazılmaz.' : undefined}
          deger={onay}
          set={setOnay}
        />
        <PsikKopyala metin={ozet} etiket="Değerlendirmeyi kopyala" />
      </div>

      <div style={psikStil.kutu}>
        <div style={psikStil.etiket}>Hasta dosyasına kaydet</div>
        <PsikHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={psikStil.satir}>
          <button type="button" style={psikStil.btn} onClick={kaydet}>Güvenlik kaydını yaz</button>
        </div>
        {durum && <div style={{ ...psikStil.iyi, marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...psikStil.hata, marginTop: 8 }}>{hata}</div>}
      </div>
    </>
  );
}
