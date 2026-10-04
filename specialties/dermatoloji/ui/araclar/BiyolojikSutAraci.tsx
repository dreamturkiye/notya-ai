'use client';
/**
 * DERM-EXCEPTIONAL-01 — Araçlar › Biyolojik / sistemik SUT taslağı. Dermatoloji-only
 * (BRANS_DOKTOR_ARACLARI). Göz `goz-sgk-rapor` paritesi: taslak + eksikler + kopyala;
 * T.C. ve doz yazılmaz; Medula girişi hekimindir.
 */
import React, { useMemo, useState } from 'react';
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import {
  biyolojikSutTaslak, biyolojikSutMetni, BIYOLOJIK_SABLONLARI, BIYOLOJIK_ENDIKASYON_ADI,
  ONCEKI_BASAMAK_ADI, type BiyolojikSablon, type BiyolojikEndikasyon, type OncekiBasamak,
} from '../../engines/biyolojikSutRapor';
import { dermStil, Secim, Onay, Istatistik, KayitButonu, KopyalaButonu, Rozet, TaslakNotu, DermHastaSecici } from './DermAracKabugu';
const { kutu, etiket, kucuk, metin, satir, btn } = dermStil;
const bugun = () => new Date().toISOString().slice(0, 10);
const ENDIKASYONLAR = Object.entries(BIYOLOJIK_ENDIKASYON_ADI) as Array<[BiyolojikEndikasyon, string]>;
const BASAMAKLAR = Object.keys(ONCEKI_BASAMAK_ADI) as OncekiBasamak[];

export default function BiyolojikSutAraci() {
  const [sablon, setSablon] = useState<BiyolojikSablon>('baslangic');
  const [endikasyon, setEndikasyon] = useState<BiyolojikEndikasyon>('psoriasis');
  const [etken, setEtken] = useState('');
  const [anamnez, setAnamnez] = useState('');
  const [pasi, setPasi] = useState('16');
  const [dlqi, setDlqi] = useState('12');
  const [bsa, setBsa] = useState('20');
  const [tb, setTb] = useState(false);
  const [hbv, setHbv] = useState(false);
  const [basamak, setBasamak] = useState<Record<OncekiBasamak, boolean>>({
    topikal: false, fototerapi: false, konvansiyonel_sistemik: false, biyolojik: false,
  });
  const [hasta, setHasta] = useState<{ id: string; ad: string }>({ id: '', ad: '' });

  const sonuc = useMemo(() => biyolojikSutTaslak({
    sablon, hasta: { adSoyad: '' }, endikasyon, etkenMadde: etken || null, anamnez: anamnez || null,
    pasiBaslangic: pasi === '' ? null : Number(pasi), pasiSimdi: pasi === '' ? null : Number(pasi),
    dlqiBaslangic: dlqi === '' ? null : Number(dlqi), dlqiSimdi: dlqi === '' ? null : Number(dlqi),
    bsaPct: bsa === '' ? null : Number(bsa),
    tbTarama: tb, hbvTarama: hbv,
    basamaklar: BASAMAKLAR.filter((k) => basamak[k]).map((k) => ({ basamak: k, sonuc: 'yanitsiz' as const })),
    bugun: bugun(),
  }), [sablon, endikasyon, etken, anamnez, pasi, dlqi, bsa, tb, hbv, basamak]);

  const metinTaslak = biyolojikSutMetni(sonuc);

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Rapor</div>
        <div style={satir}>
          <Secim etiket="Şablon" deger={sablon} set={(x) => setSablon(x as BiyolojikSablon)} secenekler={BIYOLOJIK_SABLONLARI.map((s) => [s.id, s.ad] as [string, string])} />
          <Secim etiket="Endikasyon" deger={endikasyon} set={(x) => setEndikasyon(x as BiyolojikEndikasyon)} secenekler={ENDIKASYONLAR} />
        </div>
        <label style={{ ...metin, display: 'block', marginTop: 8 }}>Anamnez
          <textarea value={anamnez} onChange={(e) => setAnamnez(e.target.value)} rows={3} style={{ ...dermStil.input, width: '100%', marginTop: 4 }} />
        </label>
        <label style={{ ...metin, display: 'block', marginTop: 8 }}>Etken madde / sınıf (doz yazılmaz)
          <input value={etken} onChange={(e) => setEtken(e.target.value)} style={{ ...dermStil.input, width: '100%', marginTop: 4 }} />
        </label>
      </div>

      <div style={kutu}>
        <div style={etiket}>Skor ve tarama</div>
        <div style={satir}>
          <label style={metin}>PASI <input type="number" value={pasi} onChange={(e) => setPasi(e.target.value)} style={{ ...dermStil.input, width: 80 }} /></label>
          <label style={metin}>DLQI <input type="number" value={dlqi} onChange={(e) => setDlqi(e.target.value)} style={{ ...dermStil.input, width: 80 }} /></label>
          <label style={metin}>BSA % <input type="number" value={bsa} onChange={(e) => setBsa(e.target.value)} style={{ ...dermStil.input, width: 80 }} /></label>
        </div>
        <Onay ad="TB taraması yapıldı" deger={tb} set={setTb} />
        <Onay ad="HBV taraması yapıldı" deger={hbv} set={setHbv} />
        <div style={{ ...etiket, marginTop: 10 }}>Önceki basamak (hekim beyanı: yanıtsız)</div>
        {BASAMAKLAR.map((k) => (
          <Onay key={k} ad={ONCEKI_BASAMAK_ADI[k]} deger={basamak[k]} set={(v) => setBasamak((p) => ({ ...p, [k]: v }))} />
        ))}
      </div>

      <div style={{ ...kutu, borderColor: sonuc.eksikler.length ? 'rgba(251,191,36,0.45)' : 'rgba(45,212,191,0.4)' }}>
        <div style={etiket}>Taslak</div>
        <div style={satir}>
          <Istatistik deger={sonuc.eksikler.length} etiket="eksik madde" ton={sonuc.eksikler.length ? 'uyari' : 'iyi'} />
          <Rozet ton="notr">doz yazılmaz</Rozet>
        </div>
        {sonuc.eksikler.map((e) => <div key={e} style={{ ...kucuk, color: '#B45309' }}>• {e}</div>)}
        <pre style={{ ...kucuk, whiteSpace: 'pre-wrap', marginTop: 8 }}>{metinTaslak}</pre>
        <div style={satir}><KopyalaButonu metin={metinTaslak} etiket="Taslağı kopyala" /></div>
        <TaslakNotu>{sonuc.dozKilidi} Medula girişi ve e-imza hekimindir; Notya canlı gönderim yapmaz.</TaslakNotu>
      </div>

      <div style={kutu}>
        <div style={etiket}>Hastada kaydet (isteğe bağlı)</div>
        <DermHastaSecici secili={hasta.id} sec={(id, ad) => setHasta({ id, ad })} />
        <KayitButonu
          etiket="Taslağı hastaya kaydet"
          hastaId={hasta.id}
          ipucu="Deri sekmesindeki biyolojik rapor kaydıyla aynı API."
          kaydet={async () => {
            const t = await getAccessTokenAsync();
            const r = await fetch('/api/doktor/dermatoloji', {
              method: 'POST',
              headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                patientId: hasta.id, action: 'biyolojik-rapor',
                sablon, endikasyon, etkenMadde: etken || null,
                taslakMetni: metinTaslak, eksikler: sonuc.eksikler, kilitle: false,
              }),
            });
            const j = await r.json().catch(() => ({}));
            return r.ok ? null : (j.error || 'Kaydedilemedi.');
          }}
        />
        {hasta.id && <div style={satir}><a href={hastaDosyaHref(hasta.id, 'deri')} style={{ ...btn, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Hastada aç (Deri) →</a></div>}
      </div>
    </>
  );
}
