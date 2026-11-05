'use client';
/**
 * KD-OPERATOR-01 (Kaan, 2026-11-05) — the KD operator tools of the Türkiye build. Kadın hastalıkları ve doğum only
 * (BRANS_DOKTOR_ARACLARI, gate in KdAracKabugu). Every number comes from lib/clinical/* (shared with the six country
 * builds); every word and source from ../../engines/operatorMetinleri.ts. Tools compute and cite; the clinician decides.
 */
import React, { useMemo, useState } from 'react';
import { PROFILAKSI_ISLEMLERI, profilaksiHesapla, type ProfilaksiIslemi } from '@/lib/clinical/antibiyotikProfilaksi';
import { ADNEX_GIRDILERI, IOTA_B, IOTA_M, iotaBasitKurallar, ORADS_LEZYON, oradsKategori, RMI_USG_OZELLIKLERI, rmi1, type OradsLezyon } from '@/lib/clinical/adneksKitle';
import { ASRM_BOYUT, ASRM_DOUGLAS, ASRM_YAPISIKLIK, asrmEvre, COEIN, ENZIAN_DERECE, ENZIAN_F, enzianKodu, FIGO_MYOM_TIPLERI, myomOzeti, PALM, palmCoeinKodu, type AsrmGirdi, type Myom } from '@/lib/clinical/jinekolojikSiniflama';
import { ACILIYET_KATEGORILERI, BISHOP_BILESENLERI, bishopSkoru, kanamaEvresi, KANAMA_PAKETI, kanKaybi, MFMU_VBAC_HESAPLAYICI, robsonSiniflandir, sezaryenAciliyeti, sokIndeksi, VBAC_OBSTETRIK_OYKU, vki, type RobsonNotrGirdi } from '@/lib/clinical/dogumSalonu';
import { ERAS_LISTELERI, erasDurumu, siviAcigi, type ErasListesi, type SiviOlcumu, type SiviOrtami } from '@/lib/clinical/histeroskopiEras';
import { ONAM_PROSEDURLERI } from '@/lib/clinical/onamProsedurleri';
import * as M from '../../engines/operatorMetinleri';
import { Istatistik, KopyalaButonu, Onay, Rozet, Sayi, Secim, Segment, useAracStil } from '@/lib/doktor/aracUi';
import KaynakKutusu from '@/components/doktor/araclar/KaynakKutusu';

const sayi = (x: string): number | null => { const n = Number(String(x).replace(',', '.')); return x.trim() !== '' && Number.isFinite(n) ? n : null; };
const yaz = (n: number, b = 0) => n.toLocaleString('tr-TR', { minimumFractionDigits: b, maximumFractionDigits: b });

// ───────────────────────── 4. antibiotic prophylaxis ─────────────────────────

export function AntibiyotikAraci() {
  const st = useAracStil();
  const [islem, setIslem] = useState<ProfilaksiIslemi>('sezaryen');
  const [kilo, setKilo] = useState('');
  const [eylem, setEylem] = useState(false);
  const [alerji, setAlerji] = useState(false);
  const [saat, setSaat] = useState('');
  const [kan, setKan] = useState('');
  const k = sayi(kilo);
  const r = k != null ? profilaksiHesapla({ islem, kiloKg: k, eylemdeVeyaZarAcik: eylem, siddetliBetaLaktamAlerjisi: alerji, gecenSaat: sayi(saat), kanKaybiMl: sayi(kan) }, M.TR_PROFILAKSI) : null;
  const metin = r?.tamam ? [`Antibiyotik profilaksisi — ${M.PROFILAKSI_ISLEM_ADI[islem]}, ${k} kg`, ...r.dozlar.map((d) => `${M.ILAC_ADI[d.ilac]}: ${yaz(d.miktar)} ${d.birim}`), ...r.uyarilar.map((u) => M.PROFILAKSI_UYARI_ADI[u]), 'Kaynak: ACOG PB 199 ve 195 (2018), uluslararası referans rejim.'].join('\n') : '';
  return (
    <div>
      <div style={st.kutu}>
        <Segment etiket="İşlem" deger={islem} set={setIslem} secenekler={PROFILAKSI_ISLEMLERI.map((x) => [x, M.PROFILAKSI_ISLEM_ADI[x]])} />
        <div style={st.satir}><Sayi ad="Kilo" deger={kilo} set={setKilo} birim="kg" /><Sayi ad="İlk dozdan beri" deger={saat} set={setSaat} birim="saat" /><Sayi ad="Kan kaybı" deger={kan} set={setKan} birim="mL" /></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {islem === 'sezaryen' && <Onay ad="Eylemde veya membran rüptürü sonrası plansız sezaryen" deger={eylem} set={setEylem} />}
          <Onay ad="Ağır (anafilaktik) beta-laktam alerjisi" deger={alerji} set={setAlerji} />
        </div>
      </div>
      {r?.tamam && (
        <div style={st.kutu}>
          <div style={st.etiket}>Rejim (uluslararası referans)</div>
          {r.dozlar.map((d) => <div key={d.ilac} style={st.metin}><b>{M.ILAC_ADI[d.ilac]}:</b> {yaz(d.miktar)} {d.birim}</div>)}
          {r.uyarilar.map((u) => <div key={u} style={{ ...(u.startsWith('tekrar') ? st.kirmizi : st.uyari), marginTop: 6 }}>{M.PROFILAKSI_UYARI_ADI[u]}</div>)}
          <div style={{ ...st.kucuk, marginTop: 8 }}>İnsizyondan önce, ideal olarak 60 dakika içinde verilir. Ajan, doz ve uygulama kararı hekimindir.</div>
          <div style={{ marginTop: 10 }}><KopyalaButonu metin={metin} etiket="Rejimi kopyala" /></div>
        </div>
      )}
      <KaynakKutusu kaynaklar={M.PROFILAKSI_KAYNAKLARI} not={M.ULUSAL_YOK} />
    </div>
  );
}

// ───────────────────────── 5. adnexal mass ─────────────────────────

export function AdneksAraci() {
  const st = useAracStil();
  const [iota, setIota] = useState<string[]>([]);
  const [rmiOz, setRmiOz] = useState<string[]>([]);
  const [post, setPost] = useState(false);
  const [ca, setCa] = useState('');
  const [lez, setLez] = useState<OradsLezyon>('unilokuler');
  const [boyut, setBoyut] = useState('');
  const [basit, setBasit] = useState(false);
  const [duzensiz, setDuzensiz] = useState(false);
  const [solid, setSolid] = useState(false);
  const [papiller, setPapiller] = useState('');
  const [disDuz, setDisDuz] = useState(false);
  const [cs, setCs] = useState('');
  const [asit, setAsit] = useState(false);
  const [adnex, setAdnex] = useState<Record<string, string>>({});
  const io = iotaBasitKurallar(iota);
  const rmi = rmi1({ usg: rmiOz, postmenopozal: post, ca125: sayi(ca) }, M.TR_RMI_ESIK);
  const o = oradsKategori({ lezyon: lez, boyutCm: sayi(boyut), basitKist: basit, icDuvarDuzensiz: duzensiz, solidBilesen: solid, papillerSayisi: sayi(papiller), disKonturDuzensiz: disDuz, renkSkoru: (sayi(cs) as 1 | 2 | 3 | 4 | null), asitVeyaPeritonNodulu: asit, postmenopozal: post });
  const kopya = [`IOTA Basit Kurallar: ${M.IOTA_SONUC_ADI[io.sonuc]} (B ${io.b}, M ${io.m})`, rmi ? `RMI I: ${yaz(rmi.rmi, 1)} (U ${rmi.u} × M ${rmi.m} × CA-125); eşik ${M.TR_RMI_ESIK}: ${rmi.esikUstu ? 'eşik veya üzeri' : 'eşiğin altında'}` : 'RMI I: CA-125 girilmedi', o.kategori != null ? M.ORADS_ADI[o.kategori] : 'O-RADS: eksik tanımlayıcı', `ADNEX girdileri: ${ADNEX_GIRDILERI.map((k) => `${M.ADNEX_ADI[k]} ${adnex[k] || '—'}`).join('; ')}`].join('\n');
  return (
    <div>
      <div style={st.kutu}>
        <div style={st.etiket}>IOTA Basit Kurallar</div>
        <div style={{ display: 'grid', gap: 6 }}>{[...IOTA_B, ...IOTA_M].map((k) => <Onay key={k} ad={M.IOTA_ADI[k]} deger={iota.includes(k)} set={(b) => setIota((x) => (b ? [...x, k] : x.filter((y) => y !== k)))} />)}</div>
        <div style={{ marginTop: 10 }}><Rozet ton={io.sonuc === 'malign' ? 'kirmizi' : io.sonuc === 'benign' ? 'iyi' : 'uyari'}>{M.IOTA_SONUC_ADI[io.sonuc]}</Rozet></div>
      </div>
      <div style={st.kutu}>
        <div style={st.etiket}>O-RADS US v2022</div>
        <Secim etiket="Lezyon" deger={lez} set={(x) => setLez(x as OradsLezyon)} secenekler={ORADS_LEZYON.map((x) => [x, M.ORADS_LEZYON_ADI[x]])} />
        <div style={st.satir}><Sayi ad="En büyük çap" deger={boyut} set={setBoyut} birim="cm" /><Sayi ad="Renk skoru (1–4)" deger={cs} set={setCs} /><Sayi ad="Papiller yapı sayısı" deger={papiller} set={setPapiller} /></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          <Onay ad="Basit kist (düzgün, anekoik)" deger={basit} set={setBasit} /><Onay ad="İç duvar / septa düzensiz" deger={duzensiz} set={setDuzensiz} /><Onay ad="Solid bileşen var" deger={solid} set={setSolid} />
          <Onay ad="Solid lezyonun dış konturu düzensiz" deger={disDuz} set={setDisDuz} /><Onay ad="Asit ve / veya peritoneal nodül" deger={asit} set={setAsit} /><Onay ad="Postmenopozal" deger={post} set={setPost} />
        </div>
        <div style={{ marginTop: 10 }}>{o.kategori != null ? <Rozet ton={o.kategori >= 4 ? 'kirmizi' : o.kategori === 3 ? 'uyari' : 'iyi'}>{M.ORADS_ADI[o.kategori]}</Rozet> : <span style={st.kucuk}>Eksik: {o.eksik.join(', ')}</span>}</div>
      </div>
      <div style={st.kutu}>
        <div style={st.etiket}>RMI I</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{RMI_USG_OZELLIKLERI.map((k) => <Onay key={k} ad={M.RMI_ADI[k]} deger={rmiOz.includes(k)} set={(b) => setRmiOz((x) => (b ? [...x, k] : x.filter((y) => y !== k)))} />)}</div>
        <div style={st.satir}><Sayi ad="CA-125" deger={ca} set={setCa} birim="U/mL" /></div>
        {rmi && <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}><Istatistik deger={yaz(rmi.rmi, 1)} etiket={`RMI I (U ${rmi.u} × M ${rmi.m} × CA-125)`} ton={rmi.esikUstu ? 'kirmizi' : 'iyi'} /><span style={st.kucuk}>Eşik {M.TR_RMI_ESIK}: {rmi.esikUstu ? 'eşik veya üzeri — jinekolojik onkoloji değerlendirmesi düşünülür' : 'eşiğin altında'}</span></div>}
      </div>
      <div style={st.kutu}>
        <div style={st.etiket}>ADNEX girdileri (IOTA’nın kendi hesaplayıcısı için)</div>
        <div style={st.kucuk}>ADNEX riski bu üründe hesaplanmaz: modelin katsayıları birincil kaynaktan doğrulanamadı. Girdileri kaydedip IOTA’nın resmî ADNEX hesaplayıcısına girin.</div>
        <div style={st.satir}>{ADNEX_GIRDILERI.map((k) => <Sayi key={k} ad={M.ADNEX_ADI[k]} deger={adnex[k] || ''} set={(v) => setAdnex((x) => ({ ...x, [k]: v }))} genislik={150} />)}</div>
      </div>
      <div style={st.kutu}><KopyalaButonu metin={kopya} etiket="Özeti kopyala (USG raporuna)" /></div>
      <KaynakKutusu kaynaklar={M.ADNEKS_KAYNAKLARI} not={M.ULUSAL_YOK} />
    </div>
  );
}

// ───────────────────────── 6. classification ─────────────────────────

export function SiniflamaAraci() {
  const st = useAracStil();
  const [palm, setPalm] = useState<string[]>([]);
  const [coein, setCoein] = useState<string[]>([]);
  const [myomlar, setMyomlar] = useState<Array<{ tip: string; boyut: string; konum: string }>>([]);
  const [asrm, setAsrm] = useState<AsrmGirdi>({});
  const [enz, setEnz] = useState<Record<string, string>>({ yontem: 's' });
  const [enzF, setEnzF] = useState<string[]>([]);
  const myomListe: Myom[] = myomlar.map((m) => ({ tip: m.tip, boyutMm: sayi(m.boyut), konum: m.konum }));
  const oz = myomOzeti(myomListe);
  const kod = palmCoeinKodu({ palm, coein, myomTipleri: myomlar.map((m) => m.tip).filter(Boolean) });
  const ev = asrmEvre(asrm);
  const enzian = enzianKodu({ yontem: enz.yontem, P: enz.P, A: enz.A, C: enz.C, O_sol: enz.O_sol, O_sag: enz.O_sag, T_sol: enz.T_sol, T_sag: enz.T_sag, B_sol: enz.B_sol, B_sag: enz.B_sag, F: enzF });
  const boyutSec = (k: keyof AsrmGirdi, ad: string, liste: readonly string[], etiketler: Record<string, string>) => (
    <Secim key={k} etiket={ad} deger={String(asrm[k] ?? '0')} set={(x) => setAsrm((a) => ({ ...a, [k]: x }))} secenekler={liste.map((x) => [x, etiketler[x]])} />
  );
  const BOY = { 0: 'Yok', lt1: '<1 cm', '1_3': '1–3 cm', gt3: '>3 cm' } as Record<string, string>;
  const YAP = { 0: 'Yok', lt13: '<1/3 sarmış', '13_23': '1/3–2/3', gt23: '>2/3' } as Record<string, string>;
  const kopya = [`FIGO PALM-COEIN: ${kod}`, ...myomListe.map((m, i) => `Myom ${i + 1}: FIGO ${m.tip}${m.boyutMm ? `, ${m.boyutMm} mm` : ''}${m.konum ? `, ${m.konum}` : ''}`), ev.evre ? `rASRM: ${ev.puan} puan, evre ${ev.evre}` : 'rASRM: puan yok', enzian || ''].filter(Boolean).join('\n');
  return (
    <div>
      <div style={st.kutu}>
        <div style={st.etiket}>FIGO PALM-COEIN</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{PALM.map((k) => <Onay key={k} ad={`${k} — ${M.PALM_ADI[k]}`} deger={palm.includes(k)} set={(b) => setPalm((x) => (b ? [...x, k] : x.filter((y) => y !== k)))} />)}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>{COEIN.map((k) => <Onay key={k} ad={`${k} — ${M.COEIN_ADI[k]}`} deger={coein.includes(k)} set={(b) => setCoein((x) => (b ? [...x, k] : x.filter((y) => y !== k)))} />)}</div>
        <div style={{ ...st.iyi, marginTop: 10, fontFamily: 'ui-monospace, monospace' }}>{kod}</div>
      </div>
      <div style={st.kutu}>
        <div style={st.etiket}>Myomlar (FIGO 0–8) ve myomektomi planlama özeti</div>
        {myomlar.map((m, i) => (
          <div key={i} style={st.satir}>
            <Secim etiket={`Myom ${i + 1}`} deger={m.tip} set={(x) => setMyomlar((a) => a.map((y, j) => (j === i ? { ...y, tip: x } : y)))} bos="Tip seçin" secenekler={FIGO_MYOM_TIPLERI.map((t) => [t, M.MYOM_TIP_ADI[t]])} />
            <Sayi ad="Boyut" deger={m.boyut} set={(x) => setMyomlar((a) => a.map((y, j) => (j === i ? { ...y, boyut: x } : y)))} birim="mm" />
            <input aria-label="Konum" value={m.konum} placeholder="Konum (ör. fundus arka)" onChange={(e) => setMyomlar((a) => a.map((y, j) => (j === i ? { ...y, konum: e.target.value } : y)))} style={{ ...st.input, maxWidth: 220 }} />
            <button type="button" style={st.ghost} onClick={() => setMyomlar((a) => a.filter((_, j) => j !== i))}>Kaldır</button>
          </div>
        ))}
        <button type="button" style={{ ...st.ghost, marginTop: 8 }} onClick={() => setMyomlar((a) => [...a, { tip: '', boyut: '', konum: '' }])}>+ Myom ekle</button>
        {oz.sayi > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Istatistik deger={oz.sayi} etiket="Myom" /><Istatistik deger={oz.enBuyukMm ?? '—'} etiket="En büyük (mm)" /><Istatistik deger={oz.submukoz} etiket="Submüköz (0–2)" /><Istatistik deger={oz.intramural} etiket="İntramural (3–4)" /><Istatistik deger={oz.subseroz} etiket="Subseröz (5–7)" /><Istatistik deger={oz.hibrit} etiket="Hibrit" />
            </div>
            <ul style={{ ...st.metin, margin: '8px 0 0', paddingLeft: 18 }}>{oz.bayraklar.map((b) => <li key={b}>{M.MYOM_BAYRAK_ADI[b]}</li>)}</ul>
            <div style={{ ...st.kucuk, marginTop: 6 }}>Özet yalnızca kayıttaki bulguları gösterir; cerrahi yol ve plan kararı hekimindir.</div>
          </div>
        )}
      </div>
      <div style={st.kutu}>
        <div style={st.etiket}>Revize ASRM (1996) endometriozis evrelemesi</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
          {boyutSec('periton_yuzeyel', 'Periton, yüzeyel', ASRM_BOYUT, BOY)}{boyutSec('periton_derin', 'Periton, derin', ASRM_BOYUT, BOY)}
          {boyutSec('over_sag_yuzeyel', 'Sağ over, yüzeyel', ASRM_BOYUT, BOY)}{boyutSec('over_sag_derin', 'Sağ over, derin', ASRM_BOYUT, BOY)}
          {boyutSec('over_sol_yuzeyel', 'Sol over, yüzeyel', ASRM_BOYUT, BOY)}{boyutSec('over_sol_derin', 'Sol over, derin', ASRM_BOYUT, BOY)}
          {boyutSec('douglas', 'Posterior kuldesak obliterasyonu', ASRM_DOUGLAS, { yok: 'Yok', kismi: 'Kısmi', tam: 'Tam' })}
          {boyutSec('over_sag_film', 'Sağ over, ince yapışıklık', ASRM_YAPISIKLIK, YAP)}{boyutSec('over_sag_yogun', 'Sağ over, yoğun yapışıklık', ASRM_YAPISIKLIK, YAP)}
          {boyutSec('over_sol_film', 'Sol over, ince yapışıklık', ASRM_YAPISIKLIK, YAP)}{boyutSec('over_sol_yogun', 'Sol over, yoğun yapışıklık', ASRM_YAPISIKLIK, YAP)}
          {boyutSec('tup_sag_film', 'Sağ tüp, ince yapışıklık', ASRM_YAPISIKLIK, YAP)}{boyutSec('tup_sag_yogun', 'Sağ tüp, yoğun yapışıklık', ASRM_YAPISIKLIK, YAP)}
          {boyutSec('tup_sol_film', 'Sol tüp, ince yapışıklık', ASRM_YAPISIKLIK, YAP)}{boyutSec('tup_sol_yogun', 'Sol tüp, yoğun yapışıklık', ASRM_YAPISIKLIK, YAP)}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          <Onay ad="Sağ tüpün fimbriyal ucu tamamen kapalı" deger={!!asrm.fimbria_sag_kapali} set={(b) => setAsrm((a) => ({ ...a, fimbria_sag_kapali: b }))} />
          <Onay ad="Sol tüpün fimbriyal ucu tamamen kapalı" deger={!!asrm.fimbria_sol_kapali} set={(b) => setAsrm((a) => ({ ...a, fimbria_sol_kapali: b }))} />
        </div>
        <div style={{ ...st.iyi, marginTop: 10 }}>{ev.evre ? `${ev.puan} puan — Evre ${ev.evre}` : 'Puan yok'}</div>
      </div>
      <div style={st.kutu}>
        <div style={st.etiket}>#Enzian (2021)</div>
        <Segment etiket="Yöntem" deger={enz.yontem} set={(x) => setEnz((e) => ({ ...e, yontem: x }))} secenekler={[['s', 'Cerrahi (s)'], ['u', 'Ultrason (u)'], ['m', 'MR (m)']]} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 8 }}>
          {['P', 'O_sol', 'O_sag', 'T_sol', 'T_sag', 'A', 'B_sol', 'B_sag', 'C'].map((k) => <Secim key={k} etiket={k.replace('_sol', ' sol').replace('_sag', ' sağ')} deger={enz[k] || '0'} set={(x) => setEnz((e) => ({ ...e, [k]: x }))} secenekler={ENZIAN_DERECE.map((d) => [d, d])} />)}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>{ENZIAN_F.map((f) => <Onay key={f} ad={f} deger={enzF.includes(f)} set={(b) => setEnzF((x) => (b ? [...x, f] : x.filter((y) => y !== f)))} />)}</div>
        <div style={{ ...st.iyi, marginTop: 10, fontFamily: 'ui-monospace, monospace' }}>{enzian}</div>
      </div>
      <div style={st.kutu}><KopyalaButonu metin={kopya} etiket="Sınıflamaları kopyala" /></div>
      <KaynakKutusu kaynaklar={M.SINIFLAMA_KAYNAKLARI} not={M.ULUSAL_YOK} />
    </div>
  );
}

// ───────────────────────── 7. labour ward ─────────────────────────

export function DogumhaneAraci() {
  const st = useAracStil();
  const [b, setB] = useState<Record<string, string>>({});
  const [rb, setRb] = useState<RobsonNotrGirdi>({ parite: '', oncekiSezaryen: false, fetus: '', prezentasyon: '', hafta: null, eylem: '' });
  const [hafta, setHafta] = useState('');
  const [kat, setKat] = useState('');
  const [karar, setKarar] = useState('');
  const [dogum, setDogum] = useState('');
  const [q, setQ] = useState<Record<string, string>>({});
  const [nabiz, setNabiz] = useState('');
  const [ta, setTa] = useState('');
  const [paket, setPaket] = useState<string[]>([]);
  const [v, setV] = useState<Record<string, string>>({});
  const bs = bishopSkoru(b);
  const robson = robsonSiniflandir({ ...rb, hafta: sayi(hafta) });
  const ac = sezaryenAciliyeti({ kategori: kat, kararZamani: karar || null, dogumZamani: dogum || null }, M.TR_ACILIYET_HEDEF_DK[kat] ?? null);
  const kk = kanKaybi({ islakGram: sayi(q.islak || ''), kuruGram: sayi(q.kuru || ''), kanisterMl: sayi(q.kanister || ''), amniyonMl: sayi(q.amniyon || ''), tahminiMl: sayi(q.tahmini || '') });
  const ev = kanamaEvresi(kk.ml, M.TR_PPH_ESIKLERI);
  const si = sokIndeksi(sayi(nabiz), sayi(ta));
  const vk = vki(sayi(v.boy_cm || ''), sayi(v.gebelik_oncesi_kilo_kg || ''));
  const kopya = [
    bs.toplam != null ? `Bishop skoru: ${bs.toplam}/13` : '',
    robson.grup ? `Robson grubu: ${robson.grup}${robson.alt || ''} — ${M.ROBSON_ADI[robson.grup]}` : '',
    kat ? `${M.ACILIYET_ADI[kat]}${ac.hedef ? `; hedef ${ac.hedef.slice(11)}` : ''}${ac.gecenDk != null ? `; karar–doğum ${ac.gecenDk} dk` : ''}` : '',
    kk.ml != null ? `Kan kaybı: ${kk.ml} mL (${kk.olculdu ? 'ölçülen' : 'tahmini'})${ev != null ? ` — ${M.PPH_EVRE_ADI[ev]}` : ''}` : '',
    si ? `Şok indeksi: ${yaz(si.si, 2)} (${M.SOK_ADI[si.bant]})` : '',
    paket.length ? `PPH paketi: ${paket.map((p) => M.PAKET_ADI[p]).join(', ')}` : '',
  ].filter(Boolean).join('\n');
  return (
    <div>
      <div style={st.kutu}>
        <div style={st.etiket}>Bishop skoru</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
          {Object.entries(BISHOP_BILESENLERI).map(([k, liste]) => <Secim key={k} etiket={M.BISHOP_BILESEN_ADI[k]} deger={b[k] || ''} bos="Seçin" set={(x) => setB((o) => ({ ...o, [k]: x }))} secenekler={liste.map((x) => [x, M.BISHOP_ADI[k][x]])} />)}
        </div>
        {bs.toplam != null && <div style={{ marginTop: 10 }}><Istatistik deger={`${bs.toplam} / 13`} etiket="Bishop" /></div>}
        <div style={{ ...st.kucuk, marginTop: 6 }}>Uygunluk eşiği ülke kılavuzuna göre değişir (NICE NG207: 6’nın üzeri; ABD uygulaması: 8’in üzeri). Türkiye için ulusal eşik doğrulanamadı; skor gösterilir, karar hekimindir.</div>
      </div>
      <div style={st.kutu}>
        <div style={st.etiket}>Robson 10 grup</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
          <Secim etiket="Parite" deger={rb.parite || ''} bos="Seçin" set={(x) => setRb((r) => ({ ...r, parite: x as RobsonNotrGirdi['parite'] }))} secenekler={[['nullipar', 'Nullipar'], ['multipar', 'Multipar']]} />
          <Secim etiket="Fetüs" deger={rb.fetus || ''} bos="Seçin" set={(x) => setRb((r) => ({ ...r, fetus: x as RobsonNotrGirdi['fetus'] }))} secenekler={[['tekil', 'Tekil'], ['cogul', 'Çoğul']]} />
          <Secim etiket="Prezentasyon" deger={rb.prezentasyon || ''} bos="Seçin" set={(x) => setRb((r) => ({ ...r, prezentasyon: x as RobsonNotrGirdi['prezentasyon'] }))} secenekler={[['bas', 'Baş'], ['makat', 'Makat'], ['transvers', 'Transvers / oblik']]} />
          <Secim etiket="Eylem başlangıcı" deger={rb.eylem || ''} bos="Seçin" set={(x) => setRb((r) => ({ ...r, eylem: x as RobsonNotrGirdi['eylem'] }))} secenekler={[['spontan', 'Spontan'], ['induksiyon', 'İndüksiyon'], ['eylem_oncesi_sezaryen', 'Eylem öncesi sezaryen']]} />
          <Sayi ad="Gebelik haftası" deger={hafta} set={setHafta} birim="hf" />
        </div>
        <div style={{ marginTop: 6 }}><Onay ad="Önceki sezaryen" deger={rb.oncekiSezaryen} set={(x) => setRb((r) => ({ ...r, oncekiSezaryen: x }))} /></div>
        <div style={{ ...st.metin, marginTop: 8 }}>{robson.grup ? <>Robson <b>{robson.grup}{robson.alt || ''}</b> — {M.ROBSON_ADI[robson.grup]} <span style={st.kucuk}>(hekim doğrular)</span></> : <span style={st.kucuk}>Eksik: {robson.eksik.join(', ')}</span>}</div>
      </div>
      <div style={st.kutu}>
        <div style={st.etiket}>Sezaryen aciliyet kategorisi</div>
        <Secim etiket="Kategori" deger={kat} bos="Seçin" set={setKat} secenekler={ACILIYET_KATEGORILERI.map((k) => [k, M.ACILIYET_ADI[k]])} />
        <div style={st.satir}>
          <label style={st.kucuk}>Karar zamanı <input type="datetime-local" value={karar} onChange={(e) => setKarar(e.target.value)} style={st.input} /></label>
          <label style={st.kucuk}>Doğum zamanı <input type="datetime-local" value={dogum} onChange={(e) => setDogum(e.target.value)} style={st.input} /></label>
        </div>
        {ac.hedef && <div style={{ ...st.metin, marginTop: 8 }}>Hedef (NICE NG192, uluslararası referans): <b>{ac.hedef.replace('T', ' ')}</b></div>}
        {ac.gecenDk != null && <div style={{ ...(ac.asildi ? st.kirmizi : st.uyari), marginTop: 6 }}>Karar–doğum aralığı: {ac.gecenDk} dk{ac.asildi ? ' — hedef aşıldı' : ''}</div>}
      </div>
      <div style={st.kutu}>
        <div style={st.etiket}>Ölçülen kan kaybı · şok indeksi · doğum sonu kanama</div>
        <div style={st.satir}>
          <Sayi ad="Islak ped / kompres ağırlığı" deger={q.islak || ''} set={(x) => setQ((o) => ({ ...o, islak: x }))} birim="g" genislik={150} />
          <Sayi ad="Kuru ağırlık" deger={q.kuru || ''} set={(x) => setQ((o) => ({ ...o, kuru: x }))} birim="g" />
          <Sayi ad="Aspiratör / toplayıcı" deger={q.kanister || ''} set={(x) => setQ((o) => ({ ...o, kanister: x }))} birim="mL" />
          <Sayi ad="Plasenta öncesi amniyon / diğer sıvı" deger={q.amniyon || ''} set={(x) => setQ((o) => ({ ...o, amniyon: x }))} birim="mL" genislik={150} />
          <Sayi ad="Ölçülemiyorsa tahmini" deger={q.tahmini || ''} set={(x) => setQ((o) => ({ ...o, tahmini: x }))} birim="mL" />
        </div>
        <div style={st.satir}><Sayi ad="Nabız" deger={nabiz} set={setNabiz} birim="/dk" /><Sayi ad="Sistolik kan basıncı" deger={ta} set={setTa} birim="mmHg" /></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
          {kk.ml != null && <Istatistik deger={`${kk.ml} mL`} etiket={kk.olculdu ? 'Ölçülen kan kaybı' : 'Tahmini kan kaybı'} ton={ev && ev >= 2 ? 'kirmizi' : ev ? 'uyari' : 'iyi'} />}
          {si && <Istatistik deger={yaz(si.si, 2)} etiket="Şok indeksi" ton={si.bant === 'normal' ? 'iyi' : si.bant === 'esik_0_9' ? 'uyari' : 'kirmizi'} />}
        </div>
        {ev != null && <div style={{ ...st.metin, marginTop: 6 }}>{M.PPH_EVRE_ADI[ev]} (WHO tanımı)</div>}
        {si && <div style={{ ...st.metin, marginTop: 4 }}>{M.SOK_ADI[si.bant]}</div>}
        <div style={{ ...st.etiket, marginTop: 12 }}>PPH tedavi paketi (WHO 2023)</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{KANAMA_PAKETI.map((k) => <Onay key={k} ad={M.PAKET_ADI[k]} deger={paket.includes(k)} set={(x) => setPaket((a) => (x ? [...a, k] : a.filter((y) => y !== k)))} />)}</div>
        <div style={{ ...st.kucuk, marginTop: 6 }}>Ajan ve doz hekimin. Ölçüm ve paket kaydı karar desteğidir.</div>
      </div>
      <div style={st.kutu}>
        <div style={st.etiket}>Sezaryen sonrası vajinal doğum (MFMU 2021, ırk ve etnisite olmadan) — girdiler</div>
        <div style={st.kucuk}>Olasılık bu üründe hesaplanmaz: 2021 modelinin denklemi birincil kaynaktan doğrulanamadı. Girdileri kaydedip MFMU Network’ün resmî hesaplayıcısında hesaplayın.</div>
        <div style={st.satir}>
          <Sayi ad="Yaş" deger={v.yas || ''} set={(x) => setV((o) => ({ ...o, yas: x }))} birim="yıl" />
          <Sayi ad="Boy" deger={v.boy_cm || ''} set={(x) => setV((o) => ({ ...o, boy_cm: x }))} birim="cm" />
          <Sayi ad="Gebelik öncesi kilo" deger={v.gebelik_oncesi_kilo_kg || ''} set={(x) => setV((o) => ({ ...o, gebelik_oncesi_kilo_kg: x }))} birim="kg" />
        </div>
        <Secim etiket="Obstetrik öykü" deger={v.obstetrik_oyku || ''} bos="Seçin" set={(x) => setV((o) => ({ ...o, obstetrik_oyku: x }))} secenekler={VBAC_OBSTETRIK_OYKU.map((x) => [x, M.VBAC_OYKU_ADI[x]])} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          <Onay ad={M.VBAC_ADI.arrest_endikasyonu} deger={v.arrest === '1'} set={(x) => setV((o) => ({ ...o, arrest: x ? '1' : '' }))} />
          <Onay ad={M.VBAC_ADI.tedavili_kronik_hipertansiyon} deger={v.htn === '1'} set={(x) => setV((o) => ({ ...o, htn: x ? '1' : '' }))} />
        </div>
        {vk != null && <div style={{ ...st.metin, marginTop: 6 }}>Gebelik öncesi VKİ: <b>{yaz(vk, 1)}</b> kg/m²</div>}
        <div style={{ marginTop: 8 }}><a href={MFMU_VBAC_HESAPLAYICI} target="_blank" rel="noopener noreferrer" style={st.ghost}>MFMU resmî hesaplayıcısını aç</a></div>
      </div>
      <div style={st.kutu}><KopyalaButonu metin={kopya} etiket="Özeti kopyala" /></div>
      <KaynakKutusu kaynaklar={M.DOGUMHANE_KAYNAKLARI} not={M.ULUSAL_YOK} />
    </div>
  );
}

// ───────────────────────── 8. hysteroscopy fluid deficit + ERAS ─────────────────────────

export function HisteroskopiErasAraci() {
  const st = useAracStil();
  const [ortam, setOrtam] = useState<SiviOrtami>('izotonik');
  const [riskli, setRiskli] = useState(false);
  const [olcumler, setOlcumler] = useState<SiviOlcumu[]>([]);
  const [giren, setGiren] = useState('');
  const [cikan, setCikan] = useState('');
  const [liste, setListe] = useState<ErasListesi>('jinekolojik');
  const [tamam, setTamam] = useState<string[]>([]);
  const r = siviAcigi({ ortam, riskli, olcumler });
  const e = erasDurumu(liste, tamam);
  const ekle = () => {
    const g = sayi(giren), c = sayi(cikan);
    if (g == null || c == null) return;
    setOlcumler((o) => [...o, { zaman: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), girenMl: g, cikanMl: c }]);
    setGiren(''); setCikan('');
  };
  return (
    <div>
      <div style={st.kutu}>
        <div style={st.etiket}>Histeroskopi sıvı açığı</div>
        <Segment etiket="Distansiyon sıvısı" deger={ortam} set={setOrtam} secenekler={[['izotonik', 'İzotonik (salin)'], ['hipotonik', 'Hipotonik (glisin, sorbitol)']]} />
        <div style={{ marginTop: 6 }}><Onay ad={ortam === 'hipotonik' ? 'Yaşlı veya eşlik eden hastalık' : 'Kardiyovasküler hastalık'} deger={riskli} set={setRiskli} /></div>
        <div style={st.satir}><Sayi ad="Toplam giren" deger={giren} set={setGiren} birim="mL" /><Sayi ad="Toplam çıkan" deger={cikan} set={setCikan} birim="mL" /><button type="button" style={st.btn} onClick={ekle}>Ölçümü ekle</button></div>
        <div style={st.kucuk}>En az 15 dakikada bir toplam giren ve çıkan miktarı girin.</div>
        {r && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><Istatistik deger={`${r.acikMl} mL`} etiket={`Açık (sınır ${r.sinirMl} mL, %${r.yuzde})`} ton={r.bant === 'sinir_asildi' ? 'kirmizi' : r.bant === 'sinira_yakin' ? 'uyari' : 'iyi'} /></div>
            <div style={{ ...(r.bant === 'sinir_alti' ? st.metin : st.kirmizi), marginTop: 6 }}>{M.SIVI_BANT_ADI[r.bant]}</div>
            <div style={{ ...st.kucuk, marginTop: 6 }}>Seyir: {r.seyir.map((s) => `${s.zaman} ${s.acikMl} mL`).join(' · ')}</div>
            <button type="button" style={{ ...st.ghost, marginTop: 6 }} onClick={() => setOlcumler([])}>Sıfırla</button>
          </div>
        )}
      </div>
      <div style={st.kutu}>
        <div style={st.etiket}>ERAS kontrol listesi</div>
        <Segment etiket="Liste" deger={liste} set={(x) => { setListe(x); setTamam([]); }} secenekler={[['jinekolojik', 'Jinekolojik / jinekolojik onkoloji'], ['sezaryen', 'Sezaryen']]} />
        <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>{(ERAS_LISTELERI[liste] as readonly string[]).map((k) => <Onay key={k} ad={M.ERAS_ADI[k] || k} deger={tamam.includes(k)} set={(b) => setTamam((x) => (b ? [...x, k] : x.filter((y) => y !== k)))} />)}</div>
        <div style={{ marginTop: 10 }}><Istatistik deger={`${e.yapilan} / ${e.toplam}`} etiket={`Uyum %${e.yuzde}`} ton={e.yuzde >= 80 ? 'iyi' : 'uyari'} /></div>
        <div style={{ marginTop: 10 }}><KopyalaButonu metin={[`ERAS (${liste === 'sezaryen' ? 'sezaryen' : 'jinekolojik'}): ${e.yapilan}/${e.toplam}`, `Eksik: ${e.eksik.map((k) => M.ERAS_ADI[k] || k).join('; ') || '—'}`].join('\n')} etiket="Listeyi kopyala" /></div>
      </div>
      <KaynakKutusu kaynaklar={M.HISTEROSKOPI_KAYNAKLARI} not={M.ULUSAL_YOK} />
    </div>
  );
}

// ───────────────────────── 9. procedure consent forms ─────────────────────────

export function OnamListesi() {
  const st = useAracStil();
  const [hastaId] = useState<string>(() => (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('patientId') || '' : ''));
  const liste = useMemo(() => ONAM_PROSEDURLERI.map((k) => ({ k, ...M.ONAM_PROSEDUR[k] })), []);
  return (
    <div>
      <div style={st.kutu}>
        <div style={st.etiket}>İşleme özgü onam formları</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {liste.map((x) => (
            <a key={x.k} href={`/dashboard/doktor/onam/yazdir?islem=${x.k}${hastaId ? `&patientId=${encodeURIComponent(hastaId)}` : ''}`} style={{ ...st.ghost, justifyContent: 'space-between' }}>
              <span>{x.ad}</span><span style={st.kucuk}>Yazdır →</span>
            </a>
          ))}
        </div>
        <div style={{ ...st.kucuk, marginTop: 8 }}>Her form işlemi, yararları, alternatifleri ve ciddi / sık riskleri içerir; risklerin sıklığı hastayla konuşulan biçimde forma yazılır. Çıktı belge numarası ve doğrulama karekodu taşır.</div>
      </div>
      <KaynakKutusu kaynaklar={M.ONAM_KAYNAKLARI} />
    </div>
  );
}
