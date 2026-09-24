'use client';
/**
 * KARDIO-EXCEPTIONAL-01 — Araçlar › SCORE2 / KV risk. Kardiyoloji-only.
 * Bant karar desteğidir; tanı ve doz hekimde. ESC motoru dahiliye score2.ts (ONAYLI).
 */
import React, { useMemo, useState } from 'react';
import {
  KardioHastaSecici, kardioStil, Alan, Etiketli, Secim, Segment, Istatistik, TaslakNotu, KopyalaButonu,
  MuayeneFormunaEkle, useUrlHasta,
} from './KardioAracKabugu';
import { kardioScore2Hesapla, type Cinsiyet } from '../../engines/score2';
import { HEKIM_KILIT_METNI } from '../../engines/kardiyoloji';

const S = kardioStil;

export default function KardioScore2Araci() {
  const [hasta, setHasta] = useState('');
  useUrlHasta(setHasta);
  const [yas, setYas] = useState('55');
  const [cinsiyet, setCinsiyet] = useState<Cinsiyet | ''>('erkek');
  const [sigara, setSigara] = useState<'evet' | 'hayir' | ''>('hayir');
  const [sbp, setSbp] = useState('140');
  const [tchol, setTchol] = useState('220');
  const [hdl, setHdl] = useState('45');

  const sonuc = useMemo(() => kardioScore2Hesapla({
    yas: yas === '' ? undefined : Number(yas),
    cinsiyet: cinsiyet || undefined,
    sigara: sigara === '' ? undefined : sigara === 'evet',
    sbp: sbp === '' ? undefined : Number(sbp),
    tcholMgdl: tchol === '' ? undefined : Number(tchol),
    hdlMgdl: hdl === '' ? undefined : Number(hdl),
    bolge: 'high',
  }), [yas, cinsiyet, sigara, sbp, tchol, hdl]);

  return (
    <>
      <div style={S.kutu}>
        <Alan etiket="Hasta (isteğe bağlı)" ipucu="Hasta seçerseniz özeti bugünkü muayene formuna ekleyebilirsiniz.">
          <KardioHastaSecici secili={hasta} sec={(id) => setHasta(id)} />
        </Alan>
      </div>

      <div style={S.kutu}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Etiketli ad="Yaş (40–69)">
            <input type="number" value={yas} onChange={(e) => setYas(e.target.value)} style={{ ...S.input, width: 90 }} />
          </Etiketli>
          <Segment etiket="Cinsiyet" deger={cinsiyet} set={setCinsiyet} secenekler={[['erkek', 'Erkek'], ['kadin', 'Kadın']] as Array<[Cinsiyet, string]>} />
          <Segment etiket="Sigara" deger={sigara} set={setSigara} secenekler={[['hayir', 'Hayır'], ['evet', 'Evet']] as Array<['evet' | 'hayir', string]>} />
          <Etiketli ad="SBP mmHg">
            <input type="number" value={sbp} onChange={(e) => setSbp(e.target.value)} style={{ ...S.input, width: 90 }} />
          </Etiketli>
          <Etiketli ad="TChol mg/dL">
            <input type="number" value={tchol} onChange={(e) => setTchol(e.target.value)} style={{ ...S.input, width: 100 }} />
          </Etiketli>
          <Etiketli ad="HDL mg/dL">
            <input type="number" value={hdl} onChange={(e) => setHdl(e.target.value)} style={{ ...S.input, width: 100 }} />
          </Etiketli>
        </div>
        <div style={{ ...S.kucuk, marginTop: 8 }}>Türkiye ESC haritasında yüksek risk bölgesi — varsayılan kalibrasyon. Notya lipid veya KB uydurmaz.</div>
      </div>

      <div style={S.kutu}>
        <div style={S.etiket}>Sonuç</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Istatistik deger={sonuc.tamamMi ? `${sonuc.riskPct}%` : '—'} etiket="SCORE2 10 yıl" ton={sonuc.tamamMi ? 'notr' : 'uyari'} />
          <Istatistik deger={sonuc.kovaAd} etiket="Risk bandı · karar desteği" />
        </div>
        {!sonuc.tamamMi && (
          <div style={{ ...S.kucuk, color: '#7A5B1E', marginTop: 8 }}>
            {sonuc.eksikler.length ? sonuc.eksikler.join(' · ') : 'Girdileri tamamlayın — ortalama yorumlanmaz.'}
          </div>
        )}
        <div style={{ ...S.metin, marginTop: 8 }}>{sonuc.ozet}</div>
        <div style={{ ...S.kucuk, marginTop: 8 }}>{HEKIM_KILIT_METNI}</div>
        <TaslakNotu />
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <KopyalaButonu metin={sonuc.ozet} />
          {hasta && sonuc.tamamMi && <MuayeneFormunaEkle hastaId={hasta} arac="SCORE2" satirlar={[sonuc.ozet]} alan="content_objektif" />}
        </div>
      </div>
    </>
  );
}
