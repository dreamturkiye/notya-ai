'use client';
/**
 * KD-OPERATOR-01 (Kaan, 2026-11-05) — WHO Surgical Safety Checklist · Caprini VTE score and prophylaxis plan · ASA
 * physical status. CORE for every surgical branch (the 11 surgical medical branches and the two surgical Özel Branşlar,
 * exactly the operation-note shell's list: lib/doktor/ameliyatNotu.ts → ameliyatNotuBransi). The same screen for each.
 * Arithmetic: lib/clinical/cerrahiGuvenlik.ts. No dose, no agent: the plan names the kind of prophylaxis only.
 */
import React, { useMemo, useState } from 'react';
import { ASA_SINIFLARI, asaEtiketi, CAPRINI_MADDELERI, capriniHesapla, SSC_ASAMALARI, SSC_MADDELERI, sscDurumu, type SscCevap } from '@/lib/clinical/cerrahiGuvenlik';
import { ASA_SINIF_ADI, CAPRINI_BANT_ADI, CAPRINI_MADDE_ADI, CAPRINI_PLAN_ADI, CERRAHI_KAYNAKLARI, SSC_ASAMA_ADI, SSC_MADDE_ADI, ULUSLARARASI_NOTU } from '@/lib/doktor/cerrahiGuvenlikMetinleri';
import { Istatistik, KopyalaButonu, Onay, Rozet, Sayi, useAracStil } from '@/lib/doktor/aracUi';
import KaynakKutusu from './KaynakKutusu';

const CEVAPLAR: Array<[NonNullable<SscCevap>, string]> = [['evet', 'Evet'], ['hayir', 'Hayır'], ['na', 'Uygulanmaz']];

export default function CerrahiGuvenlikAraci() {
  const st = useAracStil();
  const [ssc, setSsc] = useState<Record<string, SscCevap>>({});
  const [yas, setYas] = useState('');
  const [secili, setSecili] = useState<string[]>([]);
  const [kanama, setKanama] = useState(false);
  const [kanser, setKanser] = useState(false);
  const [asa, setAsa] = useState('');
  const [acil, setAcil] = useState(false);

  const durum = useMemo(() => sscDurumu(ssc), [ssc]);
  const yasSayi = Number(yas.replace(',', '.'));
  const caprini = useMemo(() => (yas ? capriniHesapla({ yas: yasSayi, secili, kanamaRiskiYuksek: kanama, kanserCerrahisi: kanser }) : null), [yas, yasSayi, secili, kanama, kanser]);
  const asaYazi = asaEtiketi(asa, acil);

  const ozet = [
    `WHO Cerrahi Güvenlik Kontrol Listesi: ${SSC_ASAMALARI.map((a) => `${SSC_ASAMA_ADI[a].split(' — ')[0]} ${durum.asamalar[a].tamam ? 'tamam' : 'eksik'}`).join(', ')}`,
    ...SSC_ASAMALARI.flatMap((a) => durum.asamalar[a].hayir.map((k) => `  Hayır: ${SSC_MADDE_ADI[k]}`)),
    caprini ? `Caprini skoru: ${caprini.toplam} — ${CAPRINI_BANT_ADI[caprini.bant]}. Plan: ${caprini.plan.map((p) => CAPRINI_PLAN_ADI[p]).join('; ')}` : 'Caprini: yaş girilmedi',
    asaYazi ? `${asaYazi}` : 'ASA: seçilmedi',
  ].join('\n');

  return (
    <div>
      <div style={st.kutu}>
        <div style={st.etiket}>WHO Cerrahi Güvenlik Kontrol Listesi</div>
        {SSC_ASAMALARI.map((a) => (
          <div key={a} style={{ marginBottom: 14 }}>
            <div style={{ ...st.metin, fontWeight: 700, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {SSC_ASAMA_ADI[a]} {durum.asamalar[a].tamam ? <Rozet ton="iyi">tamam</Rozet> : durum.asamalar[a].hayir.length ? <Rozet ton="kirmizi">hayır yanıtı var</Rozet> : <Rozet ton="uyari">{durum.asamalar[a].eksik.length} madde bekliyor</Rozet>}
            </div>
            {SSC_MADDELERI[a].map((m) => (
              <div key={m.anahtar} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid rgba(58,44,34,0.08)', padding: '6px 0' }}>
                <div style={{ ...st.metin, flex: '1 1 260px' }}>{SSC_MADDE_ADI[m.anahtar]}</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {CEVAPLAR.filter(([c]) => c !== 'na' || m.na).map(([c, ad]) => (
                    <button key={c} type="button" onClick={() => setSsc((x) => ({ ...x, [m.anahtar]: x[m.anahtar] === c ? null : c }))}
                      style={{ ...st.ghost, minHeight: 36, padding: '6px 10px', background: ssc[m.anahtar] === c ? (c === 'hayir' ? '#FBEAE3' : '#E4F3F1') : 'transparent' }}>{ad}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={st.kutu}>
        <div style={st.etiket}>Caprini VTE risk skoru ve profilaksi planı</div>
        <Sayi ad="Yaş" deger={yas} set={setYas} birim="yıl" />
        {[1, 2, 3, 5].map((p) => (
          <div key={p} style={{ marginTop: 10 }}>
            <div style={st.kucuk}>{p} puan</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {CAPRINI_MADDELERI.filter((m) => m.puan === p).map((m) => (
                <Onay key={m.anahtar} ad={CAPRINI_MADDE_ADI[m.anahtar]} deger={secili.includes(m.anahtar)} set={(b) => setSecili((x) => (b ? [...x, m.anahtar] : x.filter((y) => y !== m.anahtar)))} />
              ))}
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          <Onay ad="Kanama riski yüksek" deger={kanama} set={setKanama} />
          <Onay ad="Abdominal / pelvik kanser cerrahisi" deger={kanser} set={setKanser} />
        </div>
        {caprini && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Istatistik deger={caprini.toplam} etiket={`Toplam (yaş ${caprini.yasPuani} puan dahil)`} ton={caprini.bant === 'yuksek' ? 'kirmizi' : caprini.bant === 'orta' ? 'uyari' : 'iyi'} />
            </div>
            <div style={{ ...st.metin, marginTop: 8 }}><b>{CAPRINI_BANT_ADI[caprini.bant]}</b></div>
            <ul style={{ ...st.metin, margin: '6px 0 0', paddingLeft: 18 }}>{caprini.plan.map((p) => <li key={p}>{CAPRINI_PLAN_ADI[p]}</li>)}</ul>
          </div>
        )}
      </div>

      <div style={st.kutu}>
        <div style={st.etiket}>ASA fiziksel durum sınıfı</div>
        <div style={{ display: 'grid', gap: 6 }}>
          {ASA_SINIFLARI.map((s) => (
            <label key={s} style={{ ...st.metin, display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
              <input type="radio" name="asa" checked={asa === s} onChange={() => setAsa(s)} style={{ marginTop: 4 }} /> {ASA_SINIF_ADI[s]}
            </label>
          ))}
        </div>
        <div style={{ marginTop: 8 }}><Onay ad="Acil (E)" deger={acil} set={setAcil} aciklama="Tedavinin gecikmesi yaşam veya organ için tehdidi belirgin artırıyorsa" /></div>
        {asaYazi && <div style={{ ...st.iyi, marginTop: 8 }}>{asaYazi}</div>}
      </div>

      <div style={st.kutu}>
        <KopyalaButonu metin={ozet} etiket="Özeti kopyala (ameliyat notuna)" />
      </div>
      <KaynakKutusu kaynaklar={CERRAHI_KAYNAKLARI} not={ULUSLARARASI_NOTU} />
    </div>
  );
}
