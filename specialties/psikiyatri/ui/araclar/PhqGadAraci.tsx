'use client';
/**
 * PSIK-EXCEPTIONAL-01 — Araçlar › PHQ-9 / GAD-7. Psikiyatri-only.
 * Hesap tamamen istemcide, bölüm motorlarıyla (phq9.ts / gad7.ts) yapılır. Hasta seçilirse aynı skor
 * /api/doktor/psikiyatri POST adim=olcek ile kaydedilir; kısmi ölçek kaydedilmez.
 * Şiddet bandı KARAR DESTEĞİDİR — tanı ve tedavi kararı hekimde.
 */
import React, { useMemo, useState } from 'react';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { psikStil, PsikHastaSecici, PsikMadde, PsikKopyala } from './PsikAracKabugu';
import { PHQ9_MADDELER, PHQ9_SIKLIK, PHQ9_YONERGE, PHQ9_ISLEVSELLIK_SORUSU, PHQ9_ISLEVSELLIK_SECENEKLERI, skorla as phq9Skorla } from '../../engines/phq9';
import { GAD7_MADDELER, GAD7_YONERGE, GAD7_TARAMA_ESIGI, skorla as gad7Skorla } from '../../engines/gad7';
import { HASTA_ACIL_METNI } from '../../engines/acil';
import { HEKIM_KILIT_METNI } from '../../engines/psikiyatri';

type Tip = 'phq9' | 'gad7';

export default function PhqGadAraci() {
  const [tip, setTip] = useState<Tip>('phq9');
  const [phq, setPhq] = useState<Array<number | null>>(Array(9).fill(null));
  const [gad, setGad] = useState<Array<number | null>>(Array(7).fill(null));
  const [islevsellik, setIslevsellik] = useState('');
  const [hastaId, setHastaId] = useState('');
  const [durum, setDurum] = useState('');
  const [hata, setHata] = useState('');

  const phqSonuc = useMemo(() => phq9Skorla(phq), [phq]);
  const gadSonuc = useMemo(() => gad7Skorla(gad), [gad]);
  const aktif = tip === 'phq9' ? phqSonuc : gadSonuc;

  const ozet = tip === 'phq9'
    ? `${phqSonuc.ozet}${islevsellik ? ` · İşlevsellik: ${islevsellik}` : ''}${phqSonuc.ozkıyımMadde9 ? ' · 9. madde POZİTİF — güvenlik değerlendirmesi' : ''}`
    : gadSonuc.ozet;

  const kaydet = async () => {
    setDurum(''); setHata('');
    if (!hastaId) { setHata('Kaydetmek için hasta seçin (hesap için gerekmez).'); return; }
    if (!aktif.tamamMi) { setHata('Tüm maddeler doldurulmadan kaydedilmez.'); return; }
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/psikiyatri', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: hastaId, adim: 'olcek', tip,
          maddeler: tip === 'phq9' ? phq : gad,
          islevsellik: tip === 'phq9' ? (islevsellik || null) : null,
          hekimKilit: true,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return; }
      setDurum('Hasta dosyasına kaydedildi ve günün notuna eklendi.');
    } catch { setHata('Kaydedilemedi'); }
  };

  return (
    <>
      <div style={psikStil.kutu}>
        <div style={psikStil.satir}>
          {(['phq9', 'gad7'] as Tip[]).map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => setTip(x)}
              style={{ ...psikStil.ghost, background: tip === x ? 'rgba(99,102,241,0.25)' : 'transparent', color: tip === x ? '#C7D2FE' : '#C9D4E3' }}
            >{x === 'phq9' ? 'PHQ-9 (depresyon)' : 'GAD-7 (anksiyete)'}</button>
          ))}
        </div>
        <div style={{ ...psikStil.kucuk, marginTop: 10 }}>{tip === 'phq9' ? PHQ9_YONERGE : GAD7_YONERGE}</div>
      </div>

      <div style={psikStil.kutu}>
        {tip === 'phq9'
          ? PHQ9_MADDELER.map((m, i) => (
            <PsikMadde key={i} no={i + 1} metin={m} secenekler={PHQ9_SIKLIK} deger={phq[i]} set={(v) => setPhq((p) => p.map((x, j) => (j === i ? v : x)))} />
          ))
          : GAD7_MADDELER.map((m, i) => (
            <PsikMadde key={i} no={i + 1} metin={m} secenekler={PHQ9_SIKLIK} deger={gad[i]} set={(v) => setGad((p) => p.map((x, j) => (j === i ? v : x)))} />
          ))}

        {tip === 'phq9' && (
          <div style={{ marginTop: 12 }}>
            <div style={psikStil.etiket}>{PHQ9_ISLEVSELLIK_SORUSU}</div>
            <div style={psikStil.kucuk}>Toplam skora girmez; işlevsellik kaydı içindir.</div>
            <div style={psikStil.satir}>
              {PHQ9_ISLEVSELLIK_SECENEKLERI.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setIslevsellik(islevsellik === s ? '' : s)}
                  style={{ ...psikStil.ghost, background: islevsellik === s ? 'rgba(99,102,241,0.25)' : 'transparent', color: islevsellik === s ? '#C7D2FE' : '#C9D4E3' }}
                >{s}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={psikStil.kutu}>
        <div style={psikStil.etiket}>Sonuç</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 34, fontWeight: 800, color: aktif.tamamMi ? '#C7D2FE' : '#64748B', lineHeight: 1 }}>{aktif.toplam}</span>
          <span style={psikStil.kucuk}>/ {tip === 'phq9' ? 27 : 21}</span>
          <span style={psikStil.iyi}>{aktif.tamamMi ? aktif.bantAd : `${aktif.eksikMadde} madde boş`}</span>
        </div>
        <div style={{ ...psikStil.metin, marginTop: 8 }}>{aktif.ozet}</div>
        {tip === 'gad7' && gadSonuc.tamamMi && (
          <div style={psikStil.kucuk}>Tarama eşiği {GAD7_TARAMA_ESIGI}: {gadSonuc.esikUstu ? 'eşiğin üstünde — klinik değerlendirme' : 'eşiğin altında'}</div>
        )}
        <div style={{ ...psikStil.kucuk, marginTop: 6 }}>{aktif.dipnot.not}</div>

        {tip === 'phq9' && phqSonuc.ozkıyımMadde9 && (
          <div style={{ ...psikStil.uyari, marginTop: 10 }}>
            <b>9. madde pozitif.</b> Güvenlik değerlendirmesi yapılmadan vizit kapatılmaz — Araçlar › Güvenlik &amp; acil triyaj.
            <div style={{ marginTop: 6 }}>{HASTA_ACIL_METNI}</div>
          </div>
        )}

        <PsikKopyala metin={ozet} etiket="Skoru kopyala" />
        <div style={{ ...psikStil.kucuk, marginTop: 10 }}>{HEKIM_KILIT_METNI}</div>
      </div>

      <div style={psikStil.kutu}>
        <div style={psikStil.etiket}>Hasta dosyasına kaydet (isteğe bağlı)</div>
        <PsikHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={psikStil.satir}>
          <button type="button" style={psikStil.btn} onClick={kaydet} disabled={!aktif.tamamMi}>Ölçeği kaydet</button>
          <button type="button" style={psikStil.ghost} onClick={() => { setPhq(Array(9).fill(null)); setGad(Array(7).fill(null)); setIslevsellik(''); setDurum(''); setHata(''); }}>Temizle</button>
        </div>
        {durum && <div style={{ ...psikStil.iyi, marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...psikStil.hata, marginTop: 8 }}>{hata}</div>}
      </div>
    </>
  );
}