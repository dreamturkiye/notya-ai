'use client';
/**
 * KBB-EXCEPTIONAL-01 — Araçlar › SGK işitme raporu taslağı (KBB'ye özel).
 * İşitme cihazı / odyolojik tetkik / iş gücü / öğrenci / OSAS sevk şablonları için SUT kontrol
 * listesi ve taslak metin.
 *
 * Kilitler: T.C. kimlik numarası YAZILMAZ, cihaz markası ve bedeli yoktur, ilaç/doz yoktur.
 * Tanı ve ICD-10 hekimindir. Eksik madde varken taslak "hazır" sayılmaz. Medula gönderimi ve
 * e-imza hekimin kendi sisteminde kalır — Notya canlı gönderim yapmaz.
 */
import React, { useMemo, useState } from 'react';
import {
  KbbHastaSecici, kbbStil, Alan, Etiketli, Secim, Kutu, Rozet, TaslakNotu, KopyalaButonu, useUrlHasta,
} from './KbbAracKabugu';
import {
  kbbRaporTaslagi, KBB_RAPOR_SABLONLARI, type KbbRaporSablon, type KbbRaporOdyo,
} from '../../engines/sgkRapor';
import { KAYIP_TIPI_AD, KAYIP_TIPLERI } from '../../engines/odyometri';
import { YAN_AD, REF_ACIKLAMA } from '../../engines/kbb';

const S = kbbStil;
const BUGUN = () => new Date().toISOString().slice(0, 10);

export default function KbbSgkAraci() {
  const [hasta, setHasta] = useState('');
  useUrlHasta(setHasta);
  const [sablon, setSablon] = useState<KbbRaporSablon>('isitme_cihazi');
  const [icd, setIcd] = useState('');
  const [icdAd, setIcdAd] = useState('');
  const [sureAy, setSureAy] = useState('12');
  const [degerlendirme, setDegerlendirme] = useState('');
  const [isaretli, setIsaretli] = useState<Record<number, boolean>>({});

  // Odyolojik satırlar — hekim elle girer; araç eşik uydurmaz.
  const [odyoTarih, setOdyoTarih] = useState(BUGUN());
  const [odyoYan, setOdyoYan] = useState<'sag' | 'sol' | 'iki'>('sag');
  const [odyoPta, setOdyoPta] = useState('');
  const [odyoTip, setOdyoTip] = useState('');
  const [odyolar, setOdyolar] = useState<KbbRaporOdyo[]>([]);

  const sonuc = useMemo(() => kbbRaporTaslagi({
    sablon,
    hastaAdi: '',
    odyometriler: odyolar,
    tani: icd.trim() ? { icd10: icd.trim().toUpperCase(), aciklama: icdAd.trim() } : null,
    sureAy: Number(sureAy) || 12,
    hekimDegerlendirmesi: degerlendirme,
    isaretli,
    bugun: BUGUN(),
  }), [sablon, odyolar, icd, icdAd, sureAy, degerlendirme, isaretli]);

  const metin = [
    `${sonuc.draft.sablonAd} — taslak (${sonuc.draft.duzenlemeTarihi})`,
    sonuc.draft.tani ? `Tanı (hekim): ${sonuc.draft.tani.icd10}${sonuc.draft.tani.aciklama ? ` — ${sonuc.draft.tani.aciklama}` : ''}` : 'Tanı: hekim seçmedi',
    ...sonuc.draft.odyolojikOzet.map((o) => `${o.tarih} · ${o.yan} · ${o.pta ?? '—'} dB — ${o.bant} · ${o.tip}`),
    `Rapor süresi: ${sonuc.draft.sureAy} ay`,
    sonuc.draft.hekimDegerlendirmesi ? `Hekim değerlendirmesi: ${sonuc.draft.hekimDegerlendirmesi}` : '',
    'T.C. kimlik numarası bu çıktıda yer almaz; Medula girişi ve e-imza hekimindedir.',
  ].filter(Boolean).join('\n');

  return (
    <>
      <div style={S.kutu}>
        <Alan etiket="Hasta (isteğe bağlı)">
          <KbbHastaSecici secili={hasta} sec={(id) => setHasta(id)} />
        </Alan>
        <div style={{ ...S.satir, marginTop: 10 }}>
          <Etiketli ad="Şablon">
            <Secim etiket="Şablon" deger={sablon} set={(v) => { setSablon(v as KbbRaporSablon); setIsaretli({}); }} secenekler={KBB_RAPOR_SABLONLARI.map((s) => [s.id, s.ad] as [string, string])} />
          </Etiketli>
          <Etiketli ad="ICD-10 (hekim seçer)">
            <input value={icd} onChange={(e) => setIcd(e.target.value)} placeholder="H90.3" style={{ ...S.input, width: 120 }} />
          </Etiketli>
          <Etiketli ad="Tanı açıklaması">
            <input value={icdAd} onChange={(e) => setIcdAd(e.target.value)} style={{ ...S.input, minWidth: 200 }} />
          </Etiketli>
          <Etiketli ad="Süre (ay)">
            <input type="number" inputMode="numeric" aria-label="Rapor süresi (ay)" value={sureAy} onChange={(e) => setSureAy(e.target.value)} style={{ ...S.input, width: 90 }} />
          </Etiketli>
        </div>
      </div>

      <div style={S.kutu}>
        <div style={S.etiket}>Odyolojik değerlendirme</div>
        <div style={S.satir}>
          <Etiketli ad="Tarih"><input type="date" aria-label="Odyometri tarihi" value={odyoTarih} onChange={(e) => setOdyoTarih(e.target.value)} style={{ ...S.input, width: 160 }} /></Etiketli>
          <Etiketli ad="Kulak">
            <Secim etiket="Kulak" deger={odyoYan} set={(v) => setOdyoYan(v as 'sag')} secenekler={[['sag', YAN_AD.sag], ['sol', YAN_AD.sol], ['iki', YAN_AD.iki]]} />
          </Etiketli>
          <Etiketli ad="PTA (dB)"><input type="number" inputMode="numeric" aria-label="PTA dB" value={odyoPta} onChange={(e) => setOdyoPta(e.target.value)} style={{ ...S.input, width: 100 }} /></Etiketli>
          <Etiketli ad="Kayıp tipi (hekim)">
            <Secim etiket="Kayıp tipi" deger={odyoTip} set={setOdyoTip} bos="Seçilmedi" secenekler={KAYIP_TIPLERI.map((k) => [k, KAYIP_TIPI_AD[k]] as [string, string])} />
          </Etiketli>
          <button
            type="button"
            style={S.btn}
            onClick={() => {
              if (!odyoTarih) return;
              setOdyolar([{ tarih: odyoTarih, yan: odyoYan, pta: odyoPta === '' ? null : Number(odyoPta), tip: odyoTip ? KAYIP_TIPI_AD[odyoTip as keyof typeof KAYIP_TIPI_AD] : null }, ...odyolar].slice(0, 6));
              setOdyoPta(''); setOdyoTip('');
            }}
          >Satır ekle</button>
        </div>
        {sonuc.draft.odyolojikOzet.length
          ? sonuc.draft.odyolojikOzet.map((o, i) => (
            <div key={`${o.tarih}-${i}`} style={{ ...S.metin, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ flex: 1 }}>{o.tarih} · {o.yan} · {o.pta ?? '—'} dB — {o.bant} · {o.tip}</span>
              <button type="button" style={S.ghost} onClick={() => setOdyolar(odyolar.filter((_, j) => j !== i))}>Sil</button>
            </div>
          ))
          : <div style={S.kucuk}>Kayıtlı odyolojik satır yok — Notya eşik uydurmaz.</div>}
      </div>

      <div style={S.kutu}>
        <div style={S.etiket}>SUT kontrol listesi</div>
        {sonuc.kontrolListesi.map((k, i) => (
          <Kutu key={k.madde} on={isaretli[i] === true} set={(v) => setIsaretli({ ...isaretli, [i]: v })}>{k.madde}</Kutu>
        ))}
        <div style={{ marginTop: 10 }}>
          <Alan etiket="Hekim değerlendirmesi">
            <textarea value={degerlendirme} onChange={(e) => setDegerlendirme(e.target.value)} rows={3} style={{ ...S.input, width: '100%', resize: 'vertical' }} />
          </Alan>
        </div>
      </div>

      <div style={S.kutu}>
        <div style={S.etiket}>Taslak</div>
        <pre style={{ ...S.metin, whiteSpace: 'pre-wrap', margin: 0 }}>{metin}</pre>
        <div style={{ marginTop: 10 }}>
          {sonuc.eksikler.length
            ? <Rozet ton="uyari">{sonuc.eksikler.length} eksik — rapor hazır sayılmaz</Rozet>
            : <Rozet ton="iyi">Kontrol listesi tamam — hekim onayıyla kullanılabilir</Rozet>}
        </div>
        {sonuc.eksikler.length > 0 && (
          <div style={{ ...S.kucuk, marginTop: 8, color: '#7A5B1E' }}>{sonuc.eksikler.map((e) => <div key={e}>• {e}</div>)}</div>
        )}
        <TaslakNotu>Rapor metni taslaktır; SUT koşullarının güncelliğini ve tanıyı hekim doğrular. Medula girişi ve e-imza hekimin kendi sistemindedir.</TaslakNotu>
        <div style={{ ...S.satir, marginTop: 10 }}>
          <KopyalaButonu metin={metin} etiket="Taslağı kopyala" />
        </div>
        <div style={{ ...S.kucuk, marginTop: 10 }}>{REF_ACIKLAMA.SGK_SUT}</div>
        <div style={S.kucuk}>{REF_ACIKLAMA.ISITME_CIHAZI_MEVZUAT}</div>
      </div>
    </>
  );
}
