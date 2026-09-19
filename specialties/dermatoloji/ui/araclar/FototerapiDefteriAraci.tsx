'use client';
/**
 * ARACLAR-CILA-01: ortak araç kütüphanesiyle yenilendi — manşet sayı kartları, katlanır MED / yanık bölümü,
 * kayan defter tablosu ve taslak rozeti.
 * DERM-EXCEPTIONAL-01 — Araçlar › Fototerapi defteri. Dermatoloji-only (BRANS_DOKTOR_ARACLARI).
 * Bağımsız hesap defteri: seanslar yerel durumda tutulur, kaydedilmez; kümülatif J/cm², MED notu,
 * yanık bayrağı ve yanık kontrol listesi. Solaryum cihaz listesinde yoktur (2018 yasağı).
 */
import React, { useMemo, useState } from 'react';
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';
import { PHOTO_DEVICES, BURN_CHECKLIST, cumulativeJ, fototerapiOzeti, SOLARIUM_FORBIDDEN, type PhotoDevice, type PhotoSession } from '../../engines/phototherapy-log';
import { DERM_PHOTO_DEVICE, dermLabel } from '../labels';
import { dermStil, Secim, Kutu, Istatistik, Katlanir, MuayeneFormunaEkle, Rozet, TaslakNotu, DermHastaSecici, KopyalaButonu } from './DermAracKabugu';

const { kutu, etiket, kucuk, metin, satir, btn, ghost, kaydir } = dermStil;
const bugun = () => new Date().toISOString().slice(0, 10);
const CIHAZLAR: Array<[string, string]> = PHOTO_DEVICES.map((d) => [d, dermLabel(DERM_PHOTO_DEVICE, d)]);

export default function FototerapiDefteriAraci() {
  const [cihaz, setCihaz] = useState<PhotoDevice>('nb-uvb-311');
  const [seanslar, setSeanslar] = useState<PhotoSession[]>([]);
  const [f, setF] = useState({ tarih: bugun(), j: '', adim: '', medJ: '', med: false, yanik: false });
  const [yanikMaddeleri, setYanikMaddeleri] = useState<string[]>([]);
  const [hasta, setHasta] = useState<{ id: string; ad: string }>({ id: '', ad: '' });

  const cihazSeanslari = useMemo(() => seanslar.filter((s) => s.device === cihaz), [seanslar, cihaz]);
  const ozet = useMemo(() => fototerapiOzeti(seanslar, cihaz), [seanslar, cihaz]);
  const tumKumulatif = cumulativeJ(seanslar);

  const ekle = () => {
    const j = Number(f.j);
    if (!f.tarih || !Number.isFinite(j) || j < 0) return;
    const s: PhotoSession = {
      date: f.tarih,
      device: cihaz,
      j_cm2: Math.round(j * 100) / 100,
      med_test: f.med || undefined,
      burn: f.yanik || undefined,
      med_j_cm2: f.medJ === '' ? undefined : Number(f.medJ),
      dose_step: f.adim === '' ? undefined : Number(f.adim),
      burn_checklist: f.yanik && yanikMaddeleri.length ? [...yanikMaddeleri] : undefined,
    };
    setSeanslar((p) => [...p, s].sort((a, b) => a.date.localeCompare(b.date)));
    setF((p) => ({ ...p, j: '', med: false, yanik: false, medJ: '' }));
    setYanikMaddeleri([]);
  };

  const kopyaMetni = [
    `Fototerapi defteri — ${dermLabel(DERM_PHOTO_DEVICE, cihaz)} (${bugun()})`,
    `Seans ${ozet.seans} · kümülatif ${ozet.kumulatif} J/cm²${ozet.medJ != null ? ` · MED ${ozet.medJ} J/cm²` : ''}${ozet.yanik ? ` · yanık ${ozet.yanik} seans` : ''}`,
    ...cihazSeanslari.map((s) => `${s.date} · ${s.j_cm2} J/cm²${s.dose_step != null ? ` (adım +${s.dose_step})` : ''}${s.med_test ? ' · MED testi' : ''}${s.burn ? ' · YANIK' : ''}`),
    'Solaryum kullanılmaz (2018 yasağı). Doz artışı ve protokol hekimin kararıdır.',
  ].join('\n');

  const notSatirlari = ozet.seans ? [
    `Fototerapi defteri — ${dermLabel(DERM_PHOTO_DEVICE, cihaz)}`,
    `Seans ${ozet.seans} · kümülatif ${ozet.kumulatif} J/cm²${ozet.sonDoz != null ? ` · son doz ${ozet.sonDoz} J/cm²` : ''}`,
    ozet.medJ != null ? `MED eşiği ${ozet.medJ} J/cm²` : 'MED eşiği girilmedi',
    ozet.yanik ? `Yanık işaretli seans: ${ozet.yanik}` : '',
  ].filter(Boolean) : [];

  return (
    <>
      {SOLARIUM_FORBIDDEN && (
        <div style={{ ...kutu, background: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.4)' }}>
          <div style={{ ...metin, fontWeight: 700, color: '#FCA5A5' }}>Solaryum tedavi cihazı değildir</div>
          <div style={kucuk}>Türkiye&apos;de solaryum kullanımı 2018&apos;den beri yasaktır; cihaz listesinde yer almaz ve fototerapi yerine geçmez.</div>
        </div>
      )}

      <div style={kutu}>
        <div style={etiket}>Cihaz</div>
        <div style={satir}>
          <Secim etiket="Cihaz" deger={cihaz} set={(x) => setCihaz(x as PhotoDevice)} secenekler={CIHAZLAR} />
          <span style={kucuk}>Kümülatif doz cihaz bazında izlenir; cihaz değiştirdiğinizde defter ayrı toplanır.</span>
        </div>
      </div>

      <div style={kutu}>
        <div style={etiket}>Seans ekle</div>
        <div style={satir}>
          <label style={{ ...metin, display: 'flex', gap: 6, alignItems: 'center' }}>Tarih
            <input type="date" aria-label="Seans tarihi" value={f.tarih} onChange={(e) => setF((p) => ({ ...p, tarih: e.target.value }))} style={{ ...dermStil.input, width: 175 }} />
          </label>
          <label style={{ ...metin, display: 'flex', gap: 6, alignItems: 'center' }}>J/cm²
            <input type="number" min={0} step="0.01" inputMode="decimal" aria-label="Seans dozu J/cm²" value={f.j} onChange={(e) => setF((p) => ({ ...p, j: e.target.value }))} style={{ ...dermStil.input, width: 110 }} />
          </label>
          <label style={{ ...metin, display: 'flex', gap: 6, alignItems: 'center' }}>Artış adımı
            <input type="number" min={0} step="0.01" inputMode="decimal" aria-label="Doz artış adımı" value={f.adim} onChange={(e) => setF((p) => ({ ...p, adim: e.target.value }))} style={{ ...dermStil.input, width: 110 }} />
          </label>
        </div>
        <Katlanir baslik="MED testi · yanık" acik={f.med || f.yanik} rozet={f.yanik ? 'yanık işaretli' : f.med ? 'MED testi' : undefined}>
          <div style={satir}>
            <Kutu on={f.med} set={(b) => setF((p) => ({ ...p, med: b }))}>MED testi</Kutu>
            <label style={{ ...metin, display: 'flex', gap: 6, alignItems: 'center' }}>MED eşiği (J/cm²)
              <input type="number" min={0} step="0.01" inputMode="decimal" aria-label="MED eşiği" value={f.medJ} onChange={(e) => setF((p) => ({ ...p, medJ: e.target.value }))} style={{ ...dermStil.input, width: 110 }} />
            </label>
            <Kutu on={f.yanik} set={(b) => setF((p) => ({ ...p, yanik: b }))}>Yanık</Kutu>
          </div>
        {f.yanik && (
          <div style={{ marginTop: 8, borderLeft: '2px solid rgba(248,113,113,0.5)', paddingLeft: 10 }}>
            <div style={{ ...kucuk, color: '#FCA5A5', marginBottom: 4 }}>Yanık kontrol listesi — işaretlenenler seans satırına yazılır.</div>
            {BURN_CHECKLIST.map((m) => (
              <label key={m.kod} style={{ display: 'flex', gap: 8, alignItems: 'center', minHeight: 40, ...metin }}>
                <input
                  type="checkbox"
                  checked={yanikMaddeleri.includes(m.kod)}
                  onChange={(e) => setYanikMaddeleri((p) => (e.target.checked ? [...p, m.kod] : p.filter((x) => x !== m.kod)))}
                  style={{ width: 20, height: 20 }}
                />{m.ad}
              </label>
            ))}
          </div>
        )}
        </Katlanir>
        <div style={satir}>
          <button type="button" onClick={ekle} style={btn}>Seansı deftere ekle</button>
          {seanslar.length > 0 && <button type="button" onClick={() => setSeanslar([])} style={ghost}>Defteri temizle</button>}
        </div>
      </div>

      <div style={kutu} aria-live="polite">
        <div style={etiket}>Defter — {dermLabel(DERM_PHOTO_DEVICE, cihaz)}</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '6px 0 12px' }}>
          <Istatistik deger={ozet.seans} etiket="seans" />
          <Istatistik deger={`${ozet.kumulatif} J/cm²`} etiket="kümülatif doz" ton="iyi" />
          <Istatistik deger={ozet.sonDoz != null ? `${ozet.sonDoz} J/cm²` : '—'} etiket="son doz" />
          <Istatistik deger={ozet.medJ != null ? `${ozet.medJ} J/cm²` : '—'} etiket="MED eşiği" ton={ozet.medJ == null && ozet.seans > 0 ? 'uyari' : 'notr'} />
          <Istatistik deger={ozet.yanik} etiket="yanık seansı" ton={ozet.yanik ? 'kirmizi' : 'notr'} />
        </div>
        {ozet.sonrakiDozTaslagi != null && (
          <div style={metin}>Girdiğiniz artış adımıyla sonraki doz taslağı: <b>{ozet.sonrakiDozTaslagi} J/cm²</b> <span style={kucuk}>— aritmetiktir, doz kararı hekimindir.</span></div>
        )}
        {ozet.yanik > 0 && <div style={{ ...metin, color: '#FCA5A5' }}>Son seansta yanık işaretliyse doz taslağı verilmez.</div>}
        {!ozet.medJ && ozet.seans > 0 && <div style={satir}><Rozet ton="uyari">MED eşiği girilmedi — SUT defterinde MED kaydı aranır</Rozet></div>}
        <div style={{ ...kaydir, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', marginTop: 10 }}>
          {cihazSeanslari.map((s, i) => (
            <div key={`${s.date}-${i}`} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', padding: '10px 12px', fontSize: 14, color: '#EDF1F7', background: i % 2 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.15)' }}>
              <span style={{ minWidth: 100, fontWeight: 700 }}>{s.date}</span>
              <span style={{ minWidth: 90 }}>{s.j_cm2} J/cm²</span>
              {s.dose_step != null && <span style={kucuk}>adım +{s.dose_step}</span>}
              {s.med_test && <span style={kucuk}>MED testi{s.med_j_cm2 != null ? ` ${s.med_j_cm2} J/cm²` : ''}</span>}
              {s.burn && <span style={{ fontSize: 13, color: '#FCA5A5', fontWeight: 700 }}>YANIK{s.burn_checklist?.length ? ` · ${s.burn_checklist.length} madde` : ''}</span>}
              <button type="button" onClick={() => setSeanslar((p) => p.filter((x) => x !== s))} style={{ ...ghost, marginLeft: 'auto', minHeight: 40 }}>Sil</button>
            </div>
          ))}
          {!cihazSeanslari.length && <div style={{ padding: '24px 14px', textAlign: 'center', ...kucuk }}>Bu cihazda seans yok. Yukarıdan ekleyin.</div>}
        </div>
        {seanslar.length > cihazSeanslari.length && <div style={{ ...kucuk, marginTop: 8 }}>Tüm cihazlar toplamı: {tumKumulatif} J/cm² ({seanslar.length} seans).</div>}
        <div style={satir}><KopyalaButonu metin={kopyaMetni} etiket="Defteri kopyala" /></div>
        <MuayeneFormunaEkle hastaId={hasta.id} arac="Fototerapi defteri" satirlar={notSatirlari} />
        <TaslakNotu>Bu defter kaydedilmez — kalıcı seans kaydı hasta dosyasının Deri sekmesinde tutulur. Doz artışı ve protokol hekimin kararıdır; nota otomatik yazılmaz.</TaslakNotu>
      </div>

      <div style={kutu}>
        <div style={etiket}>Hastada kaydet (isteğe bağlı)</div>
        <DermHastaSecici secili={hasta.id} sec={(id, ad) => setHasta({ id, ad })} />
        {hasta.id && <div style={satir}><a href={hastaDosyaHref(hasta.id, 'deri')} style={{ ...btn, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Hastada aç (Deri) →</a></div>}
      </div>
    </>
  );
}
