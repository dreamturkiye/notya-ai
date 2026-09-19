'use client';
/**
 * PSIK-EXCEPTIONAL-01 — Araçlar › Psikotrop rapor & reçete kontrolü. Psikiyatri-only.
 * Şablon + hekimin seçtiği ICD-10 + hastanın aktif ilaçları → rapor taslağı, SUT kontrol listesi ve
 * Renkli Reçete Sistemi uyarısı. T.C. kimlik numarası ve DOZ yazılmaz; kilit hekimdedir, canlı Medula yok.
 */
import React, { useMemo, useState } from 'react';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { psikStil, PsikHastaSecici, PsikOnay, PsikSecim, PsikKopyala, Istatistik, TaslakNotu, Rozet, MuayeneFormunaEkle } from './PsikAracKabugu';
import { psikRaporTaslagi, PSIK_RAPOR_SABLONLARI, type PsikRaporSablon } from '../../engines/sgkRapor';

export default function PsikSgkAraci() {
  const [hastaId, setHastaId] = useState('');
  const [hastaAdi, setHastaAdi] = useState('');
  const [ilaclar, setIlaclar] = useState<Array<{ ad: string; etken?: string | null; aktif: boolean }>>([]);
  const [sablon, setSablon] = useState<PsikRaporSablon>('antidepresan');
  const [icd, setIcd] = useState('');
  const [icdAd, setIcdAd] = useState('');
  const [sureAy, setSureAy] = useState('12');
  const [degerlendirme, setDegerlendirme] = useState('');
  const [isaretli, setIsaretli] = useState<Record<number, boolean>>({});
  const [hata, setHata] = useState('');

  const yukle = async (id: string, ad: string) => {
    setHata(''); setIlaclar([]); setHastaAdi(ad);
    if (!id) return;
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch(`/api/doktor/psikiyatri?patientId=${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setHata(j.error || 'Yüklenemedi'); return; }
      setIlaclar((j.ilaclar || []).map((i: { ilac_adi: string; etken_madde: string | null }) => ({ ad: String(i.ilac_adi), etken: i.etken_madde, aktif: true })));
    } catch { setHata('Yüklenemedi'); }
  };

  const sonuc = useMemo(() => psikRaporTaslagi({
    sablon,
    hastaAdi,
    ilaclar,
    tani: icd.trim() ? { icd10: icd.trim().toUpperCase(), aciklama: icdAd.trim() } : null,
    sureAy: Number(sureAy) || 12,
    hekimDegerlendirmesi: degerlendirme,
    isaretli,
    bugun: new Date().toISOString().slice(0, 10),
  }), [sablon, hastaAdi, ilaclar, icd, icdAd, sureAy, degerlendirme, isaretli]);

  const metin = [
    sonuc.draft.sablonAd,
    `Düzenleme tarihi: ${sonuc.draft.duzenlemeTarihi}`,
    sonuc.draft.tani ? `Tanı: ${sonuc.draft.tani.icd10} ${sonuc.draft.tani.aciklama}` : 'Tanı: (hekim seçecek)',
    `Etken madde(ler): ${sonuc.draft.etkenMaddeler.join(', ') || '(eşleşen aktif ilaç yok)'}`,
    `Rapor süresi: ${sonuc.draft.sureAy} ay`,
    sonuc.draft.hekimDegerlendirmesi ? `Değerlendirme: ${sonuc.draft.hekimDegerlendirmesi}` : '',
    'Not: taslaktır — Medula girişi ve e-imza hekimindedir. Doz ve kimlik numarası bu çıktıda yer almaz.',
  ].filter(Boolean).join('\n');

  return (
    <>
      <div style={psikStil.kutu}>
        <div style={psikStil.etiket}>Hasta ve şablon</div>
        <PsikHastaSecici secili={hastaId} sec={(id, ad) => { setHastaId(id); yukle(id, ad); }} />
        <div style={psikStil.satir}>
          <PsikSecim etiket="Rapor şablonu" deger={sablon} set={(x) => { setSablon(x as PsikRaporSablon); setIsaretli({}); }} secenekler={PSIK_RAPOR_SABLONLARI.map((s) => [s.id, s.ad])} />
          <input value={icd} onChange={(e) => setIcd(e.target.value)} placeholder="ICD-10 (hekim seçer)" aria-label="ICD-10" style={{ ...psikStil.input, width: 160 }} />
          <input value={icdAd} onChange={(e) => setIcdAd(e.target.value)} placeholder="Tanı açıklaması" aria-label="Tanı açıklaması" style={{ ...psikStil.input, flex: '1 1 200px', width: 'auto' }} />
          <input type="number" value={sureAy} onChange={(e) => setSureAy(e.target.value)} placeholder="Süre (ay)" aria-label="Rapor süresi ay" style={{ ...psikStil.input, width: 110 }} />
        </div>
        <input
          value={degerlendirme}
          onChange={(e) => setDegerlendirme(e.target.value)}
          placeholder="Hekim değerlendirmesi ve izlem planı"
          aria-label="Hekim değerlendirmesi"
          style={{ ...psikStil.input, width: '100%', marginTop: 8 }}
        />
        {hata && <div style={{ ...psikStil.hata, marginTop: 8 }}>{hata}</div>}
      </div>

      <div style={psikStil.kutu}>
        <div style={psikStil.etiket}>Eşleşen etken maddeler</div>
        <div style={psikStil.metin}>{sonuc.draft.etkenMaddeler.join(' · ') || 'Bu şablonla eşleşen aktif ilaç yok'}</div>
        {sonuc.receteNotlari.length > 0 && (
          <>
            <div style={{ ...psikStil.etiket, marginTop: 12 }}>Reçete türü (RRS)</div>
            {sonuc.receteNotlari.map((r) => (
              <div key={r.ilac} style={{ ...psikStil.metin, marginTop: 6 }}>
                {r.ilac} — <Rozet ton={r.renk === 'normal' ? 'notr' : 'uyari'}>{r.etiket}</Rozet>
                {r.dogrulanmali && <div style={psikStil.kucuk}>{r.dogrulanmali}</div>}
              </div>
            ))}
          </>
        )}
      </div>

      <div style={psikStil.kutu}>
        <div style={psikStil.etiket}>SUT / mevzuat kontrol listesi</div>
        {sonuc.kontrolListesi.map((k, i) => (
          <PsikOnay key={k.madde} ad={k.madde} deger={isaretli[i] === true} set={(b) => setIsaretli((p) => ({ ...p, [i]: b }))} />
        ))}
      </div>

      <div style={psikStil.kutu}>
        <div style={psikStil.etiket}>{sonuc.eksikler.length ? 'Eksikler' : 'Eksik yok'}</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={sonuc.eksikler.length} etiket="Eksik alan" ton={sonuc.eksikler.length ? 'uyari' : 'iyi'} />
          <Istatistik deger={sonuc.draft.etkenMaddeler.length} etiket="Eşleşen etken madde" />
          <Istatistik deger={`${Object.values(isaretli).filter(Boolean).length} / ${sonuc.kontrolListesi.length}`} etiket="Kontrol listesi" />
        </div>
        {sonuc.eksikler.map((e) => <div key={e} style={{ ...psikStil.metin, color: '#FBBF24' }}>• {e}</div>)}
        {!sonuc.eksikler.length && <div style={psikStil.iyi}>Tüm alanlar dolu — rapor kilidi hekimin.</div>}
        <div style={{ ...psikStil.etiket, marginTop: 12 }}>Taslak çıktı</div>
        <pre style={{ ...psikStil.kucuk, whiteSpace: 'pre-wrap', margin: 0 }}>{metin}</pre>
        <PsikKopyala metin={metin} etiket="Taslağı kopyala" />
        <MuayeneFormunaEkle hastaId={hastaId} arac={sonuc.draft.sablonAd} satirlar={metin.split('\n')} />
        <TaslakNotu>Rapor taslaktır: Medula girişi, süre ve e-imza hekimindedir.</TaslakNotu>
        {sonuc.dipnotlar.map((d) => <div key={d.not} style={{ ...psikStil.kucuk, marginTop: 6 }}>{d.not}</div>)}
      </div>
    </>
  );
}
