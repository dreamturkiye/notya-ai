'use client';
/**
 * PSIK-EXCEPTIONAL-01 — Psikiyatri bölüm ana ekranı (hasta dosyası › Psikiyatri).
 * Sticky şerit + sekmeler: Özet | Ölçekler | Risk | İlaç izlem | Görevler | SGK.
 * Bilinçli olarak KOMPAKT: ayaktan muayenehanede iki dokunuşta iş bitmeli.
 *
 * Kilitler: doz yazılmaz, tanı kilitlenmez, ölçek şiddet bandı "karar desteği" etiketiyle gösterilir.
 * Açık güvenlik bayrağı varken hekim onayı olmadan risk kaydı yazılmaz (API 409).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi';
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon';
import { eklenenNotId } from '@/lib/doktor/muayeneFormuYolu';
import { PHQ9_BANT_AD, PHQ9_ISLEVSELLIK_SORUSU, PHQ9_ISLEVSELLIK_SECENEKLERI, skorla as phq9Skorla } from '../engines/phq9';
import { GAD7_BANT_AD, skorla as gad7Skorla } from '../engines/gad7';
import { psikRaporTaslagi, PSIK_RAPOR_SABLONLARI, type PsikRaporSablon } from '../engines/sgkRapor';
import type { PsikSerit } from '../engines/serit';

type Siklik = { deger: 0 | 1 | 2 | 3; etiket: string };
type Olcek = { id: string; tip: string; skor: number; maddeler: Record<string, unknown> | null; tarih: string; hekim_kilit: boolean; not_hekim: string | null };
type Veri = {
  serit: PsikSerit;
  bolum: { nextKontrol: string | null; notes: unknown };
  olcekler: Olcek[];
  sonPhq9: (Olcek & { degisim: { not: string } }) | null;
  sonGad7: (Olcek & { degisim: { not: string } }) | null;
  risk: { son: { tarih: string; bayraklar: string[]; eylem: string | null; hekim_onay: boolean } | null; acik: Array<{ tarih: string; bayraklar: string[] }>; gecmis: Array<{ id: string; tarih: string; bayraklar: string[]; eylem: string | null; hekim_onay: boolean }> };
  gorevler: Array<{ id: string; kod: string; ad: string; due: string | null; kaynak: string | null }>;
  ilaclar: Array<{ id: string; ilac_adi: string; etken_madde: string | null; baslangic_tarihi: string | null }>;
  izlem: Array<{ kod: string; ad: string; due: string; labs: string[]; ilac: string; kaynak: string }>;
  kutuphane: {
    phq9: { yonerge: string; maddeler: string[]; siklik: Siklik[] };
    gad7: { yonerge: string; maddeler: string[]; siklik: Siklik[] };
    cgi: { s: Record<string, string>; i: Record<string, string> };
    acilKodlari: Array<{ kod: string; ad: string }>;
    guvenlikListesi: string[];
    raporSablonlari: Array<{ id: PsikRaporSablon; ad: string }>;
    refler: Record<string, string>;
    hekimKilidi: string;
    acilYonlendirme: string;
  };
};


const ACCENT = '#6366F1';
const btn: React.CSSProperties = { background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 32 };
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: '#8FA0B5', border: '1px solid rgba(255,255,255,0.15)' };
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#A5B4FC', marginBottom: 6 };
const kucuk: React.CSSProperties = { fontSize: 11, color: '#8FA0B5', lineHeight: 1.45 };
const metin: React.CSSProperties = { fontSize: 12, color: '#EDF1F7', lineHeight: 1.5 };
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 };

const SEKMELER = ['Özet', 'Ölçekler', 'Risk', 'İlaç izlem', 'Görevler', 'SGK'] as const;
type Sekme = (typeof SEKMELER)[number];

const RENK: Record<string, string> = { iyi: '#34D399', dikkat: '#FBBF24', kotu: '#F87171', yok: '#64748B' };

function Cip({ ad, deger, durum, alt }: { ad: string; deger: string; durum: string; alt?: string }) {
  return (
    <span style={{ border: `1px solid ${durum === 'kotu' ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 999, padding: '3px 10px', fontSize: 11, color: RENK[durum] || '#EDF1F7', whiteSpace: 'nowrap' }}>
      <span style={{ color: '#8FA0B5' }}>{ad} </span>{deger}
      {alt && <span style={{ color: '#64748B' }}> · {alt}</span>}
    </span>
  );
}

/** Ölçek çalışma sayfası: 0–3 madde girişi; toplam istemcide de motorla hesaplanır (aynı fonksiyon). */
function OlcekFormu({
  baslik, yonerge, maddeler, siklik, degerler, set, sonuc, ek,
}: {
  baslik: string; yonerge: string; maddeler: string[]; siklik: Siklik[];
  degerler: Array<number | null>; set: (i: number, v: number | null) => void;
  sonuc: { toplam: number; bantAd: string; tamamMi: boolean; eksikMadde: number }; ek?: React.ReactNode;
}) {
  return (
    <div>
      <div style={etiket}>{baslik}</div>
      <div style={{ ...kucuk, marginBottom: 8 }}>{yonerge}</div>
      {maddeler.map((m, i) => (
        <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={metin}>{i + 1}. {m}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            {siklik.map((s) => (
              <button
                key={s.deger}
                type="button"
                onClick={() => set(i, degerler[i] === s.deger ? null : s.deger)}
                aria-pressed={degerler[i] === s.deger}
                style={{ ...ghost, padding: '4px 10px', minHeight: 30, background: degerler[i] === s.deger ? 'rgba(99,102,241,0.25)' : 'transparent', color: degerler[i] === s.deger ? '#C7D2FE' : '#8FA0B5' }}
              >{s.deger} · {s.etiket}</button>
            ))}
          </div>
        </div>
      ))}
      {ek}
      <div style={{ ...satir, marginTop: 10 }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: sonuc.tamamMi ? '#C7D2FE' : '#64748B' }}>{sonuc.toplam}</span>
        <span style={metin}>{sonuc.tamamMi ? sonuc.bantAd : `${sonuc.eksikMadde} madde boş — toplam yorumlanmaz`}</span>
        <span style={{ ...kucuk, color: '#FBBF24', fontWeight: 700 }}>KARAR DESTEĞİ</span>
      </div>
    </div>
  );
}

export default function PsikiyatriHome({ patientId }: { patientId: string }) {
  const [v, setV] = useState<Veri | null>(null);
  const [sekme, setSekme] = useState<Sekme>('Özet');
  const [mesaj, setMesaj] = useState('');
  const [eklenenNot, setEklenenNot] = useState<string | null>(null);
  const [phq, setPhq] = useState<Array<number | null>>(Array(9).fill(null));
  const [gad, setGad] = useState<Array<number | null>>(Array(7).fill(null));
  const [islevsellik, setIslevsellik] = useState('');
  const [cgiSDeger, setCgiSDeger] = useState('');
  const [cgiIDeger, setCgiIDeger] = useState('');
  const [riskKodlari, setRiskKodlari] = useState<string[]>([]);
  const [riskEylem, setRiskEylem] = useState('');
  const [riskOnay, setRiskOnay] = useState(false);
  const [guvenlikIsaretli, setGuvenlikIsaretli] = useState<number[]>([]);
  const [kontrolTarih, setKontrolTarih] = useState('');
  const [raporSablon, setRaporSablon] = useState<PsikRaporSablon>('antidepresan');
  const [raporIcd, setRaporIcd] = useState('');
  const [raporIcdAd, setRaporIcdAd] = useState('');
  const [raporNot, setRaporNot] = useState('');

  const api = useCallback(async (body: Record<string, unknown>) => {
    const token = await getAccessTokenAsync();
    const r = await fetch('/api/doktor/psikiyatri', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, ...body }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Hata');
    return j as Record<string, unknown>;
  }, [patientId]);

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync();
    const r = await fetch(`/api/doktor/psikiyatri?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (r.ok) setV(await r.json());
  }, [patientId]);

  useEffect(() => { yukle(); }, [yukle]);

  const calistir = async (body: Record<string, unknown>, ok?: string) => {
    setMesaj(''); setEklenenNot(null);
    try { const j = await api(body); setMesaj(ok || 'Kaydedildi.'); setEklenenNot(eklenenNotId(j)); await yukle(); return j; }
    catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); return null; }
  };

  const phqSonuc = useMemo(() => phq9Skorla(phq), [phq]);
  const gadSonuc = useMemo(() => gad7Skorla(gad), [gad]);
  const raporSonuc = useMemo(() => v ? psikRaporTaslagi({
    sablon: raporSablon, hastaAdi: '',
    ilaclar: v.ilaclar.map((i) => ({ ad: i.ilac_adi, etken: i.etken_madde, aktif: true })),
    tani: raporIcd.trim() ? { icd10: raporIcd.trim().toUpperCase(), aciklama: raporIcdAd.trim() } : null,
    hekimDegerlendirmesi: raporNot,
    bugun: new Date().toISOString().slice(0, 10),
  }) : null, [v, raporSablon, raporIcd, raporIcdAd, raporNot]);

  if (!v) return <div style={{ ...toolsCard, color: '#8FA0B5', fontSize: 12 }}>Psikiyatri yükleniyor…</div>;

  const bugun = new Date().toISOString().slice(0, 10);

  return (
    <div style={toolsCard} data-chapter="psikiyatri">
      {/* Sticky şerit */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        {v.serit.chips.map((c) => <Cip key={c.ad} {...c} />)}
      </div>
      {v.serit.kirmizi.length > 0 && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.4)', color: '#FCA5A5', borderRadius: 8, padding: '8px 10px', fontSize: 12, marginBottom: 8 }}>
          {v.serit.kirmizi.map((k) => <div key={k}>⚑ {k}</div>)}
          <div style={{ ...kucuk, color: '#FCA5A5', marginTop: 4 }}>{v.kutuphane.acilYonlendirme}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {SEKMELER.map((x) => (
          <button key={x} type="button" onClick={() => setSekme(x)} style={{ ...ghost, borderRadius: 999, background: sekme === x ? 'rgba(99,102,241,0.2)' : 'transparent', color: sekme === x ? '#C7D2FE' : '#8FA0B5' }}>{x}</button>
        ))}
      </div>

      {mesaj && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: /amadı|zorunlu|eksik|Geçersiz|geçersiz|bayrağı|Hata/.test(mesaj) ? '#F87171' : '#34D399' }}>{mesaj}</span>
          <MuayeneFormunaDon notId={eklenenNot} />
        </div>
      )}

      {sekme === 'Özet' && (
        <div>
          <div style={etiket}>Bu vizit</div>
          <div style={metin}>
            {v.sonPhq9 ? <>PHQ-9 <b>{v.sonPhq9.skor}</b> ({v.sonPhq9.tarih}) — {v.sonPhq9.degisim.not}</> : 'PHQ-9 kaydı yok — Ölçekler sekmesinden doldurun.'}
          </div>
          <div style={metin}>
            {v.sonGad7 ? <>GAD-7 <b>{v.sonGad7.skor}</b> ({v.sonGad7.tarih}) — {v.sonGad7.degisim.not}</> : 'GAD-7 kaydı yok.'}
          </div>
          <div style={{ ...etiket, marginTop: 12 }}>Kontrol tarihi <span style={kucuk}>· hasta portalında "Kontrol randevusu" olarak görünür</span></div>
          <div style={satir}>
            <input type="date" value={kontrolTarih || v.bolum.nextKontrol || ''} onChange={(e) => setKontrolTarih(e.target.value)} style={{ ...toolsInput, width: 160 }} />
            <button type="button" style={btn} onClick={() => calistir({ adim: 'kontrol', tarih: kontrolTarih || v.bolum.nextKontrol }, 'Kontrol tarihi kaydedildi.')}>Kaydet</button>
          </div>
          {v.serit.planTaslagi.length > 0 && (
            <>
              <div style={{ ...etiket, marginTop: 12 }}>Plan taslağı <span style={kucuk}>· hekim onayıyla SOAP'a kopyalanır</span></div>
              {v.serit.planTaslagi.map((p) => <div key={p} style={metin}>• {p}</div>)}
            </>
          )}
          <div style={{ ...kucuk, marginTop: 10 }}>{v.kutuphane.hekimKilidi}</div>
        </div>
      )}

      {sekme === 'Ölçekler' && (
        <div>
          <OlcekFormu
            baslik="PHQ-9 çalışma sayfası"
            yonerge={v.kutuphane.phq9.yonerge}
            maddeler={v.kutuphane.phq9.maddeler}
            siklik={v.kutuphane.phq9.siklik}
            degerler={phq}
            set={(i, val) => setPhq((p) => p.map((x, j) => (j === i ? val : x)))}
            sonuc={phqSonuc}
            ek={
              <div style={{ marginTop: 8 }}>
                <div style={kucuk}>{PHQ9_ISLEVSELLIK_SORUSU} <span style={{ opacity: 0.8 }}>(toplama girmez)</span></div>
                <div style={satir}>
                  {PHQ9_ISLEVSELLIK_SECENEKLERI.map((s) => (
                    <button key={s} type="button" onClick={() => setIslevsellik(islevsellik === s ? '' : s)} style={{ ...ghost, padding: '4px 10px', minHeight: 30, background: islevsellik === s ? 'rgba(99,102,241,0.25)' : 'transparent', color: islevsellik === s ? '#C7D2FE' : '#8FA0B5' }}>{s}</button>
                  ))}
                </div>
              </div>
            }
          />
          {phqSonuc.ozkıyımMadde9 && (
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.4)', color: '#FCA5A5', borderRadius: 8, padding: '8px 10px', fontSize: 12, marginTop: 8 }}>
              9. madde pozitif — güvenlik değerlendirmesi zorunlu. Risk sekmesinden kaydedin.
            </div>
          )}
          <div style={satir}>
            <button type="button" style={btn} disabled={!phqSonuc.tamamMi} onClick={() => calistir({ adim: 'olcek', tip: 'phq9', maddeler: phq, islevsellik: islevsellik || null, hekimKilit: true }, 'PHQ-9 kaydedildi.')}>PHQ-9 kaydet</button>
            <button type="button" style={ghost} onClick={() => { setPhq(Array(9).fill(null)); setIslevsellik(''); }}>Temizle</button>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '16px 0' }} />

          <OlcekFormu
            baslik="GAD-7 çalışma sayfası"
            yonerge={v.kutuphane.gad7.yonerge}
            maddeler={v.kutuphane.gad7.maddeler}
            siklik={v.kutuphane.gad7.siklik}
            degerler={gad}
            set={(i, val) => setGad((p) => p.map((x, j) => (j === i ? val : x)))}
            sonuc={gadSonuc}
          />
          <div style={satir}>
            <button type="button" style={btn} disabled={!gadSonuc.tamamMi} onClick={() => calistir({ adim: 'olcek', tip: 'gad7', maddeler: gad, hekimKilit: true }, 'GAD-7 kaydedildi.')}>GAD-7 kaydet</button>
            <button type="button" style={ghost} onClick={() => setGad(Array(7).fill(null))}>Temizle</button>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '16px 0' }} />

          <div style={etiket}>CGI <span style={kucuk}>· klinisyen değerlendirmesi; hasta doldurmaz, hasta yüzünde görünmez</span></div>
          <div style={satir}>
            <select aria-label="CGI-S" value={cgiSDeger} onChange={(e) => setCgiSDeger(e.target.value)} style={{ ...toolsInput, width: 'auto' }}>
              <option value="">CGI-S seç</option>
              {Object.entries(v.kutuphane.cgi.s).map(([k, ad]) => <option key={k} value={k} style={{ color: '#000' }}>{k} — {ad}</option>)}
            </select>
            <button type="button" style={ghost} disabled={!cgiSDeger} onClick={() => calistir({ adim: 'olcek', tip: 'cgi_s', deger: Number(cgiSDeger), hekimKilit: true }, 'CGI-S kaydedildi.')}>CGI-S kaydet</button>
            <select aria-label="CGI-I" value={cgiIDeger} onChange={(e) => setCgiIDeger(e.target.value)} style={{ ...toolsInput, width: 'auto' }}>
              <option value="">CGI-I seç</option>
              {Object.entries(v.kutuphane.cgi.i).map(([k, ad]) => <option key={k} value={k} style={{ color: '#000' }}>{k} — {ad}</option>)}
            </select>
            <button type="button" style={ghost} disabled={!cgiIDeger} onClick={() => calistir({ adim: 'olcek', tip: 'cgi_i', deger: Number(cgiIDeger), hekimKilit: true }, 'CGI-I kaydedildi.')}>CGI-I kaydet</button>
          </div>

          {v.olcekler.length > 0 && (
            <>
              <div style={{ ...etiket, marginTop: 12 }}>Geçmiş ölçümler</div>
              {v.olcekler.slice(0, 12).map((o) => (
                <div key={o.id} style={kucuk}>
                  {o.tarih} · {o.tip.toUpperCase().replace('_', '-')} {o.skor}
                  {o.tip === 'phq9' && (o.maddeler as { bant?: keyof typeof PHQ9_BANT_AD } | null)?.bant ? ` — ${PHQ9_BANT_AD[(o.maddeler as { bant: keyof typeof PHQ9_BANT_AD }).bant]}` : ''}
                  {o.tip === 'gad7' && (o.maddeler as { bant?: keyof typeof GAD7_BANT_AD } | null)?.bant ? ` — ${GAD7_BANT_AD[(o.maddeler as { bant: keyof typeof GAD7_BANT_AD }).bant]}` : ''}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {sekme === 'Risk' && (
        <div>
          <div style={etiket}>Güvenlik değerlendirmesi <span style={kucuk}>· ayaktan izlem yeterliliği hekim kararıdır</span></div>
          <div style={{ ...kucuk, marginBottom: 8 }}>{v.kutuphane.acilYonlendirme}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {v.kutuphane.acilKodlari.map((k) => (
              <label key={k.kod} style={{ ...metin, display: 'flex', gap: 8, alignItems: 'center', minHeight: 32 }}>
                <input type="checkbox" checked={riskKodlari.includes(k.kod)} onChange={(e) => setRiskKodlari((p) => (e.target.checked ? [...p, k.kod] : p.filter((x) => x !== k.kod)))} />
                {k.ad}
              </label>
            ))}
          </div>

          <div style={{ ...etiket, marginTop: 12 }}>Kontrol listesi</div>
          {v.kutuphane.guvenlikListesi.map((m, i) => (
            <label key={m} style={{ ...metin, display: 'flex', gap: 8, alignItems: 'flex-start', padding: '3px 0' }}>
              <input type="checkbox" checked={guvenlikIsaretli.includes(i)} onChange={(e) => setGuvenlikIsaretli((p) => (e.target.checked ? [...p, i] : p.filter((x) => x !== i)))} style={{ marginTop: 3 }} />
              <span>{m}</span>
            </label>
          ))}

          <div style={satir}>
            <input value={riskEylem} onChange={(e) => setRiskEylem(e.target.value)} placeholder="Hekim eylemi (kriz planı, sevk, randevu aralığı…)" style={{ ...toolsInput, minWidth: 260, flex: '1 1 260px' }} />
          </div>
          <label style={{ ...metin, display: 'flex', gap: 8, alignItems: 'center', minHeight: 36 }}>
            <input type="checkbox" checked={riskOnay} onChange={(e) => setRiskOnay(e.target.checked)} />
            Gördüm ve eylemi yazdım (hekim onayı)
          </label>
          <div style={satir}>
            <button type="button" style={btn} onClick={() => calistir({ adim: 'risk', bayraklar: riskKodlari, eylem: [riskEylem, ...guvenlikIsaretli.map((i) => v.kutuphane.guvenlikListesi[i])].filter(Boolean).join(' | '), hekimOnay: riskOnay }, 'Güvenlik değerlendirmesi kaydedildi.')}>Kaydet</button>
          </div>

          {v.risk.gecmis.length > 0 && (
            <>
              <div style={{ ...etiket, marginTop: 12 }}>Güvenlik kayıtları</div>
              {v.risk.gecmis.map((r) => (
                <div key={r.id} style={{ ...kucuk, color: r.hekim_onay ? '#8FA0B5' : '#FCA5A5' }}>
                  {r.tarih} · {r.bayraklar.length ? r.bayraklar.join(', ') : 'bayrak yok'} · {r.hekim_onay ? 'hekim onaylı' : 'ONAY BEKLİYOR'}{r.eylem ? ` — ${r.eylem}` : ''}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {sekme === 'İlaç izlem' && (
        <div>
          <div style={etiket}>Psikotrop izlem takvimi <span style={kucuk}>· sınıf düzeyi; doz ve titrasyon hekimin</span></div>
          {!v.ilaclar.length && <div style={kucuk}>Aktif ilaç yok. İzlem görevleri hasta ilaç listesinden üretilir; Notya ilaç eklemez.</div>}
          {v.izlem.map((g) => (
            <div key={g.kod} style={{ ...metin, color: g.due < bugun ? '#FCA5A5' : '#EDF1F7', padding: '3px 0' }}>
              • {g.ad} <span style={kucuk}>· {g.ilac} · {g.due}{g.labs.length ? ` · ${g.labs.join(', ')}` : ''}</span>
            </div>
          ))}
          {!v.izlem.length && !!v.ilaclar.length && <div style={kucuk}>Bu ilaçlar için izlem görevi gerekmiyor veya tüm tetkikler güncel.</div>}
          <div style={satir}>
            <button type="button" style={btn} onClick={() => calistir({ adim: 'ilac_izlem' }, 'İzlem görevleri açıldı.')}>Görevleri aç</button>
          </div>
          <div style={{ ...etiket, marginTop: 12 }}>Aktif ilaçlar</div>
          {v.ilaclar.map((i) => <div key={i.id} style={kucuk}>● {i.ilac_adi}{i.etken_madde ? ` (${i.etken_madde})` : ''}{i.baslangic_tarihi ? ` · ${String(i.baslangic_tarihi).slice(0, 10)}` : ''}</div>)}
        </div>
      )}

      {sekme === 'Görevler' && (
        <div>
          <div style={etiket}>Açık görevler ({v.gorevler.length})</div>
          {!v.gorevler.length && <div style={kucuk}>Açık görev yok.</div>}
          {v.gorevler.map((g) => (
            <div key={g.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: g.due && g.due < bugun ? '#F87171' : '#EDF1F7', padding: '2px 0' }}>
              <span style={{ flex: 1 }}>{g.ad} <span style={kucuk}>{g.due || ''}{g.kaynak ? ` · ${g.kaynak}` : ''}</span></span>
              <button type="button" style={{ ...ghost, padding: '4px 10px', minWidth: 36, minHeight: 28, flexShrink: 0 }} onClick={() => calistir({ adim: 'gorev', gorevId: g.id, durum: 'tamam' })}>✓</button>
            </div>
          ))}
        </div>
      )}

      {sekme === 'SGK' && raporSonuc && (
        <div>
          <div style={etiket}>Psikotrop ilaç raporu taslağı <span style={kucuk}>· T.C. kimlik no yazılmaz · doz alanı yoktur</span></div>
          <div style={satir}>
            <select aria-label="Şablon" value={raporSablon} onChange={(e) => setRaporSablon(e.target.value as PsikRaporSablon)} style={{ ...toolsInput, width: 'auto' }}>
              {PSIK_RAPOR_SABLONLARI.map((s) => <option key={s.id} value={s.id} style={{ color: '#000' }}>{s.ad}</option>)}
            </select>
            <input value={raporIcd} onChange={(e) => setRaporIcd(e.target.value)} placeholder="ICD-10 (hekim seçer)" style={{ ...toolsInput, width: 150 }} />
            <input value={raporIcdAd} onChange={(e) => setRaporIcdAd(e.target.value)} placeholder="Tanı açıklaması" style={{ ...toolsInput, minWidth: 180 }} />
          </div>
          <div style={satir}>
            <input value={raporNot} onChange={(e) => setRaporNot(e.target.value)} placeholder="Hekim değerlendirmesi" style={{ ...toolsInput, minWidth: 280, flex: '1 1 280px' }} />
          </div>
          <div style={{ ...etiket, marginTop: 10 }}>Eşleşen etken maddeler</div>
          <div style={kucuk}>{raporSonuc.draft.etkenMaddeler.join(' · ') || 'Bu şablonla eşleşen aktif ilaç yok'}</div>
          {raporSonuc.receteNotlari.length > 0 && (
            <>
              <div style={{ ...etiket, marginTop: 10 }}>Reçete türü</div>
              {raporSonuc.receteNotlari.map((r) => (
                <div key={r.ilac} style={{ ...kucuk, color: r.renk === 'normal' ? '#8FA0B5' : '#FBBF24' }}>
                  {r.ilac} — {r.etiket}{r.dogrulanmali ? ` · ${r.dogrulanmali}` : ''}
                </div>
              ))}
            </>
          )}
          <div style={{ ...etiket, marginTop: 10 }}>Kontrol listesi</div>
          {raporSonuc.kontrolListesi.map((k) => <div key={k.madde} style={kucuk}>☐ {k.madde}</div>)}
          {raporSonuc.eksikler.length > 0 && (
            <>
              <div style={{ ...etiket, marginTop: 10, color: '#FBBF24' }}>Eksikler <span style={kucuk}>· hepsi kapanmadan rapor kilitlenmez</span></div>
              {raporSonuc.eksikler.map((e) => <div key={e} style={{ ...kucuk, color: '#FBBF24' }}>• {e}</div>)}
            </>
          )}
          <div style={{ ...kucuk, marginTop: 10 }}>Çıktı taslaktır. Medula girişi ve e-imza hekimindedir; Notya canlı gönderim yapmaz.</div>
        </div>
      )}
    </div>
  );
}
