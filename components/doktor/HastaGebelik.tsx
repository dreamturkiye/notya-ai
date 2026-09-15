'use client';
/**
 * NOTYA-KHD-01 (Kaan 2026-09-14) — Gebelik Takibi sekmesi. SB Doğum Öncesi Bakım Yönetim
 * Rehberi'nin 4 izlem takvimi üzerine; hesaplar sunucuda deterministik. Aşılar/M-CHAT ile aynı desen.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import HastaKdChapter from '@/components/doktor/HastaKdChapter';
import { oncekiGebelikDurumMetni, oncekiGebelikEtiketTuru, oncekiGebelikleriFiltrele } from '@/lib/clinical/gebelikDurum';

type Uyari = { seviye: 'kritik' | 'dikkat' | 'bilgi'; metin: string };
type Pencere = { no: number; etiket: string; haftaBas: number; haftaSon: number; maddeler: string[]; durum: 'tamamlandi' | 'zamani' | 'gecikmis' | 'ileride' };
type Izlem = { id: string; tarih: string; hafta: number; kilo: number | null; tansiyon_sistolik: number | null; tansiyon_diastolik: number | null; fundus_yuksekligi: number | null; fetal_kalp_atimi: number | null; proteinuri: string | null; usg: Record<string, string | number> | null; not_metni: string | null };
type Veri = {
  gebelik: { id: string; sat: string | null; tdt: string; tdt_kaynak: string; gravida: number | null; para: number | null; abortus: number | null; yasayan: number | null; kan_grubu: string | null; rh_negatif: boolean; durum: string; dogum_tarihi: string | null; dogum_sekli: string | null } | null;
  izlemler: Izlem[]; gecmis: Array<{ id: string; tdt: string; durum: string; dogum_tarihi: string | null; dogum_sekli: string | null }>;
  yas: { hafta: number; gun: number; trimester: number; metin: string; toplamGun: number } | null;
  takvim: Pencere[]; uyarilar: Uyari[]; kiloHedefi: { alt: number; ust: number; etiket: string } | null; gebelikOncesiVki: number | null;
  biyometri?: Array<{ izlemId: string; hafta: number; hc: Bio | null; bpd: Bio | null; ac: Bio | null; fl: Bio | null; efw: number | null; efwGirilen?: number | null; efwKaynak?: 'hadlock' | 'girilen' | null }>;
  lohusa?: { dogumSonrasiGun: number; izlemler: LohusaIzlem[]; takvim: Array<{ no: number; etiket: string; gunBas: number; gunSon: number; maddeler: string[]; durum: 'tamamlandi' | 'zamani' | 'gecikmis' | 'ileride' }> } | null;
  genetikTaramalar?: Array<{ id: string; tur: string; tarih: string; hafta: number | null; veri: Record<string, string | number | null>; ntDegerlendirme?: { bayrak: boolean; not: string } | null }>;
  ileriAnneYasi?: boolean | null;
};
type Bio = { deger: number; p50: number; persentil: number; z: number; durum: 'dusuk' | 'normal' | 'yuksek' };
type LohusaIzlem = { id: string; tarih: string; dogum_sonrasi_gun: number; tansiyon_sistolik: number | null; tansiyon_diastolik: number | null; kanama: string | null; emzirme: string | null; duygu_durumu: string | null; epds_puan: number | null };

const RENK = { kritik: '#EF4444', dikkat: '#F59E0B', bilgi: '#38BDF8' } as const;
const DURUM_RENK = { tamamlandi: '#22C55E', zamani: '#F59E0B', gecikmis: '#EF4444', ileride: '#475569' } as const;
const DURUM_ETIKET = { tamamlandi: 'Yapıldı', zamani: 'Zamanı', gecikmis: 'Gecikmiş', ileride: 'İleride' } as const;

const kutu: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: 16 };
const giris: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#EDF1F7', borderRadius: 8, padding: '8px 10px', fontSize: 13, width: '100%' };
const etiketS: React.CSSProperties = { fontSize: 11.5, color: '#8FA0B5', marginBottom: 4, display: 'block' };
const btn = (birincil = false): React.CSSProperties => ({ background: birincil ? '#0F9B8E' : 'rgba(255,255,255,0.08)', border: 'none', color: birincil ? 'white' : '#EDF1F7', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' });

function trTarih(iso: string | null) { return iso ? new Date(iso).toLocaleDateString('tr-TR') : '—'; }

function yerelIsoTarih() {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, '0');
  const d = String(n.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function HastaGebelik({ patientId }: { patientId: string }) {
  const [veri, setVeri] = useState<Veri | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [mesaj, setMesaj] = useState('');
  const [baslatAcik, setBaslatAcik] = useState(false);
  const [izlemAcik, setIzlemAcik] = useState(false);
  const [f, setF] = useState<Record<string, string>>({});
  const [g, setG] = useState<Record<string, string>>({});
  const [l, setL] = useState<Record<string, string>>({});
  const [lohusaAcik, setLohusaAcik] = useState(false);
  const [n, setN] = useState<Record<string, string>>({});
  const [genetikTurAcik, setGenetikTurAcik] = useState<'' | 'ikili' | 'uclu-dortlu' | 'nipt' | 'invazif'>('');

  const yukle = useCallback(async () => {
    setYukleniyor(true); setHata('');
    try {
      const t = await ensureDoctorAccessToken();
      const r = await fetch(`/api/doktor/gebelik?patientId=${patientId}`, { headers: { Authorization: `Bearer ${t}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Yüklenemedi');
      setVeri(d);
    } catch (e) { setHata(e instanceof Error ? e.message : 'Yüklenemedi'); } finally { setYukleniyor(false); }
  }, [patientId]);
  useEffect(() => { yukle(); }, [yukle]);

  const post = async (body: Record<string, unknown>) => {
    const t = await ensureDoctorAccessToken();
    const r = await fetch('/api/doktor/gebelik', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify({ patientId, ...body }) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'İşlem başarısız');
    return d;
  };
  const sayi = (v?: string) => (v && v.trim() !== '' ? Number(v.replace(',', '.')) : null);

  const baslat = async () => {
    setMesaj(''); setHata('');
    try {
      await post({ action: 'baslat', sat: f.sat || null, tdt: f.tdt || null, gravida: sayi(f.gravida), para: sayi(f.para), abortus: sayi(f.abortus), yasayan: sayi(f.yasayan), gebelikOncesiKilo: sayi(f.gebelikOncesiKilo), boy: sayi(f.boy), kanGrubu: f.kanGrubu || null, rhNegatif: f.rh === 'negatif' });
      setBaslatAcik(false); setF({}); yukle();
    } catch (e) { setHata(e instanceof Error ? e.message : 'Kaydedilemedi'); }
  };

  const izlemKaydet = async (muayeneFormunaEkle: boolean) => {
    if (!veri?.gebelik) return;
    setMesaj(''); setHata('');
    try {
      const usg: Record<string, string | number> = {};
      for (const k of ['crl', 'bpd', 'hc', 'ac', 'fl', 'efw', 'amnion', 'plasenta', 'prezentasyon']) if (g[k]) usg[k] = g[k];
      const d = await post({ action: 'izlem', gebelikId: veri.gebelik.id, tarih: g.tarih || undefined, kilo: sayi(g.kilo), tansiyonSistolik: sayi(g.ts), tansiyonDiastolik: sayi(g.td), fundusYuksekligi: sayi(g.fundus), fetalKalpAtimi: sayi(g.fka), proteinuri: g.proteinuri || null, usg: Object.keys(usg).length ? usg : null, notMetni: g.not || null, muayeneFormunaEkle });
      if (muayeneFormunaEkle) setMesaj(d.notEkleme?.eklendi ? 'İzlem kaydedildi ve bugünkü muayene formuna eklendi.' : `İzlem kaydedildi. ${d.notEkleme?.sebep || ''}`);
      else setMesaj('İzlem kaydedildi.');
      setIzlemAcik(false); setG({}); yukle();
    } catch (e) { setHata(e instanceof Error ? e.message : 'Kaydedilemedi'); }
  };

  const lohusaKaydet = async (muayeneFormunaEkle: boolean) => {
    if (!veri?.gebelik) return;
    setMesaj(''); setHata('');
    try {
      const d = await post({ action: 'lohusa-izlem', gebelikId: veri.gebelik.id, tarih: l.tarih || undefined, tansiyonSistolik: sayi(l.ts), tansiyonDiastolik: sayi(l.td), ates: sayi(l.ates), kanama: l.kanama || null, uterusInvolusyon: l.uterus || null, perineInsizyon: l.perine || null, emzirme: l.emzirme || null, duyguDurumu: l.duygu || null, epdsPuan: sayi(l.epds), notMetni: l.not || null, muayeneFormunaEkle });
      setMesaj(muayeneFormunaEkle ? (d.notEkleme?.eklendi ? 'Lohusa izlemi kaydedildi ve bugünkü muayene formuna eklendi.' : `Lohusa izlemi kaydedildi. ${d.notEkleme?.sebep || ''}`) : 'Lohusa izlemi kaydedildi.');
      setLohusaAcik(false); setL({}); yukle();
    } catch (e) { setHata(e instanceof Error ? e.message : 'Kaydedilemedi'); }
  };

  const genetikKaydet = async (tur: 'ikili' | 'uclu-dortlu' | 'nipt' | 'invazif', muayeneFormunaEkle: boolean) => {
    if (!veri?.gebelik) return;
    setMesaj(''); setHata('');
    try {
      let veriObj: Record<string, string | number | null> = {};
      if (tur === 'ikili') veriObj = { ntMm: n.ntMm ? Number(n.ntMm) : null, papA: n.papA || null, freeBhcg: n.freeBhcg || null, kombineRisk: n.kombineRisk || null, riskKategorisi: n.riskKategorisi || null };
      if (tur === 'uclu-dortlu') veriObj = { afp: n.afp || null, hcg: n.hcg2 || null, estriol: n.estriol || null, inhibinA: n.inhibinA || null, kombineRisk: n.kombineRisk2 || null, riskKategorisi: n.riskKategorisi2 || null };
      if (tur === 'nipt') veriObj = { durum: n.niptDurum || 'istendi', t21: n.t21 || null, t18: n.t18 || null, t13: n.t13 || null, cinsiyetKromozomu: n.cinsiyetK || null, fetalFraksiyon: n.fetalFraksiyon || null };
      if (tur === 'invazif') veriObj = { tur: n.invazifTur || 'amniyosentez', endikasyon: n.endikasyon || '', sonuc: n.invazifSonuc || null, karyotip: n.karyotip || null };
      const d = await post({ action: 'genetik-tarama', gebelikId: veri.gebelik.id, tur, hafta: n.hafta2 ? Number(n.hafta2) : (veri.yas?.hafta ?? null), veri: veriObj, muayeneFormunaEkle });
      setMesaj(muayeneFormunaEkle ? (d.notEkleme?.eklendi ? 'Kaydedildi ve bugünkü muayene formuna eklendi.' : `Kaydedildi. ${d.notEkleme?.sebep || ''}`) : 'Kaydedildi.');
      setGenetikTurAcik(''); setN({}); yukle();
    } catch (e) { setHata(e instanceof Error ? e.message : 'Kaydedilemedi'); }
  };

  const [dogumAcik, setDogumAcik] = useState(false);
  const [d, setD] = useState<Record<string, string>>({ dogumTarihi: new Date().toISOString().slice(0, 10), dogumSekli: 'NSD', yenidoganOlustur: 'evet' });

  const dogumKaydet = async () => {
    if (!veri?.gebelik) return;
    setMesaj(''); setHata('');
    try {
      const r = await post({
        action: 'sonlandir', gebelikId: veri.gebelik.id, durum: 'tamamlandi',
        dogumTarihi: d.dogumTarihi, dogumSekli: d.dogumSekli, dogumNotu: d.dogumNotu || null,
        yenidoganOlustur: d.yenidoganOlustur === 'evet',
        yenidoganAdi: d.yenidoganAdi || null, yenidoganCinsiyet: d.yenidoganCinsiyet || null,
        apgar1: sayi(d.apgar1), apgar5: sayi(d.apgar5),
        yenidoganKiloGram: sayi(d.yenidoganKilo), yenidoganBoyCm: sayi(d.yenidoganBoy), yenidoganBasCevresiCm: sayi(d.yenidoganBasCevresi),
      });
      setMesaj(r.yenidoganPatientId ? 'Doğum kaydedildi — bebek için pediatri kaydı açıldı.' : 'Doğum kaydedildi.');
      setDogumAcik(false); yukle();
    } catch (e) { setHata(e instanceof Error ? e.message : 'Kaydedilemedi'); }
  };
  const sonlandir = async (durum: 'tamamlandi' | 'sonlandi') => {
    if (!veri?.gebelik) return;
    if (durum === 'tamamlandi') { setDogumAcik(true); return; }
    try { await post({ action: 'sonlandir', gebelikId: veri.gebelik.id, durum }); yukle(); } catch (e) { setHata(e instanceof Error ? e.message : 'Kaydedilemedi'); }
  };

  if (yukleniyor) return <div style={{ padding: 20, color: '#8FA0B5', fontSize: 13 }}>Yükleniyor…</div>;

  const onceki = veri ? oncekiGebelikleriFiltrele(veri.gecmis, veri.gebelik?.id) : [];

  const alan = (key: string, label: string, state: Record<string, string>, set: React.Dispatch<React.SetStateAction<Record<string, string>>>, tip = 'text', ph = '') => (
    <label style={{ display: 'block' }}>
      <span style={etiketS}>{label}</span>
      <input type={tip} name={key} value={state[key] || ''} placeholder={ph} onChange={(e) => { const v = e.target.value; set((prev) => ({ ...prev, [key]: v })); }} style={giris} />
    </label>
  );

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontSize: 13, color: '#8FA0B5' }}>
        Gebelik Takibi — ACOG pratik gold + DÖBYR 2026 yasal asgari (4 izlem). Hafta/tarih/uyarı hesapları deterministik; nihai karar hekimindir. ACOG ile DÖBYR çelişirse iki sütun gösterilir.
      </div>
      {hata && <div style={{ color: '#F87171', fontSize: 13 }}>{hata}</div>}
      {mesaj && <div style={{ color: '#22C55E', fontSize: 13 }}>{mesaj}</div>}

      {!veri?.gebelik && (
        <div style={kutu}>
          <div style={{ fontWeight: 700, color: '#EDF1F7', marginBottom: 6 }}>Aktif gebelik kaydı yok</div>
          {!baslatAcik ? <button type="button" style={btn(true)} onClick={() => setBaslatAcik(true)}>+ Gebelik Takibi Başlat</button> : (
            <form onSubmit={(e) => { e.preventDefault(); baslat(); }} style={{ display: 'grid', gap: 10, marginTop: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                {alan('sat', 'Son adet tarihi (SAT)', f, setF, 'date')}
                {alan('tdt', 'Tahmini doğum tarihi (USG ile — isteğe bağlı)', f, setF, 'date')}
                {alan('gravida', 'Gravida', f, setF, 'number')}{alan('para', 'Para', f, setF, 'number')}
                {alan('abortus', 'Abortus', f, setF, 'number')}{alan('yasayan', 'Yaşayan', f, setF, 'number')}
                {alan('gebelikOncesiKilo', 'Gebelik öncesi kilo (kg)', f, setF, 'number')}{alan('boy', 'Boy (cm)', f, setF, 'number')}
                {alan('kanGrubu', 'Kan grubu', f, setF, 'text', 'A, B, AB, 0')}
                <label style={{ display: 'block' }}><span style={etiketS}>Rh</span>
                  <select value={f.rh || ''} onChange={(e) => { const v = e.target.value; setF((prev) => ({ ...prev, rh: v })); }} style={giris}><option value="">—</option><option value="pozitif">Rh (+)</option><option value="negatif">Rh (−)</option></select></label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}><button type="submit" style={btn(true)}>Kaydet</button><button type="button" style={btn()} onClick={() => setBaslatAcik(false)}>Vazgeç</button></div>
            </form>
          )}
        </div>
      )}

      {veri?.gebelik && (
        <>
          <HastaKdChapter patientId={patientId} veri={veri} />
          <div style={{ ...kutu, background: 'linear-gradient(135deg, rgba(15,155,142,0.18), rgba(15,155,142,0.04))', borderColor: 'rgba(15,155,142,0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 30, fontWeight: 800, color: '#EDF1F7' }}>{veri.lohusa ? `Lohusa · doğum sonrası ${veri.lohusa.dogumSonrasiGun}. gün` : veri.yas ? veri.yas.metin : 'Hafta hesaplanamadı'}</div>
                <div style={{ fontSize: 13, color: '#9FB3C8' }}>{veri.yas ? `${veri.yas.trimester}. trimester` : ''} · Tahmini doğum: <b style={{ color: '#EDF1F7' }}>{trTarih(veri.gebelik.tdt)}</b> ({veri.gebelik.tdt_kaynak === 'usg' ? 'USG' : 'SAT/Naegele'})</div>
                <div style={{ fontSize: 12.5, color: '#8FA0B5', marginTop: 4 }}>
                  SAT {trTarih(veri.gebelik.sat)} · G{veri.gebelik.gravida ?? '—'} P{veri.gebelik.para ?? '—'} A{veri.gebelik.abortus ?? '—'} Y{veri.gebelik.yasayan ?? '—'}
                  {veri.gebelik.kan_grubu ? ` · ${veri.gebelik.kan_grubu} Rh(${veri.gebelik.rh_negatif ? '−' : '+'})` : ''}
                  {veri.gebelikOncesiVki ? ` · Gebelik öncesi VKİ ${veri.gebelikOncesiVki}` : ''}
                  {veri.kiloHedefi ? ` · Hedef kilo alımı ${veri.kiloHedefi.alt}-${veri.kiloHedefi.ust} kg (${veri.kiloHedefi.etiket})` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {veri.lohusa ? (
                  <button type="button" style={btn(true)} onClick={() => {
                    setL((prev) => ({ ...prev, tarih: prev.tarih || yerelIsoTarih() }));
                    setLohusaAcik((v) => !v);
                  }}>+ Lohusa İzlemi Ekle</button>
                ) : (
                  <>
                    <button type="button" style={btn(true)} onClick={() => {
                      setG((prev) => ({ ...prev, tarih: prev.tarih || yerelIsoTarih() }));
                      setIzlemAcik((v) => !v);
                    }}>+ İzlem Ekle</button>
                    <button type="button" style={btn()} onClick={() => sonlandir('tamamlandi')}>Doğum Gerçekleşti</button>
                  </>
                )}
                <a href={`/dashboard/doktor/hastalar/${patientId}/gebelik/yazdir`} style={{ ...btn(), textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>🖨️ Gebe İzlem Kartı</a>
              </div>
            </div>
            {veri.yas && <div style={{ marginTop: 12, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}><div style={{ width: `${Math.min(100, (veri.yas.toplamGun / 280) * 100)}%`, height: '100%', background: '#0F9B8E', borderRadius: 3 }} /></div>}
          </div>

          {dogumAcik && (
            <div style={kutu}>
              <div style={{ fontWeight: 700, color: '#EDF1F7', marginBottom: 4 }}>Doğum Kaydı</div>
              <div style={{ fontSize: 11.5, color: '#64748B', marginBottom: 10 }}>Canlı doğum bilgisi + isterseniz bebek için pediatri kaydı otomatik açılır (aşı/büyüme takibi hazır bekler).</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                {alan('dogumTarihi', 'Doğum tarihi', d, setD, 'date')}
                <label style={{ display: 'block' }}><span style={etiketS}>Doğum şekli</span><select value={d.dogumSekli || 'NSD'} onChange={(e) => setD({ ...d, dogumSekli: e.target.value })} style={giris}><option value="NSD">NSD (normal)</option><option value="Sezaryen">Sezaryen</option></select></label>
                {alan('apgar1', 'APGAR (1 dk)', d, setD, 'number')}{alan('apgar5', 'APGAR (5 dk)', d, setD, 'number')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 6px' }}>
                <input type="checkbox" id="yenidoganOlustur" checked={d.yenidoganOlustur === 'evet'} onChange={(e) => setD({ ...d, yenidoganOlustur: e.target.checked ? 'evet' : 'hayir' })} />
                <label htmlFor="yenidoganOlustur" style={{ fontSize: 13, color: '#EDF1F7' }}>Bebek için pediatri kaydı oluştur</label>
              </div>
              {d.yenidoganOlustur === 'evet' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                  {alan('yenidoganAdi', 'Bebeğin adı (isterseniz sonra girin)', d, setD)}
                  <label style={{ display: 'block' }}><span style={etiketS}>Cinsiyet</span><select value={d.yenidoganCinsiyet || ''} onChange={(e) => setD({ ...d, yenidoganCinsiyet: e.target.value })} style={giris}><option value="">—</option><option value="male">Erkek</option><option value="female">Kız</option></select></label>
                  {alan('yenidoganKilo', 'Doğum kilosu (g)', d, setD, 'number')}{alan('yenidoganBoy', 'Doğum boyu (cm)', d, setD, 'number')}{alan('yenidoganBasCevresi', 'Baş çevresi (cm)', d, setD, 'number')}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button type="button" style={btn(true)} onClick={dogumKaydet}>Kaydet</button>
                <button type="button" style={btn()} onClick={() => setDogumAcik(false)}>Vazgeç</button>
              </div>
            </div>
          )}

          {veri.uyarilar.length > 0 && (
            <div style={{ display: 'grid', gap: 6 }}>
              {veri.uyarilar.map((u, i) => (
                <div key={i} style={{ borderLeft: `3px solid ${RENK[u.seviye]}`, background: RENK[u.seviye] + '12', padding: '8px 12px', borderRadius: 8, fontSize: 13, color: '#EDF1F7' }}>{u.metin}</div>
              ))}
            </div>
          )}

          {izlemAcik && (
            <div style={kutu}>
              <div style={{ fontWeight: 700, color: '#EDF1F7', marginBottom: 10 }}>Yeni İzlem</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                {alan('tarih', 'Tarih', g, setG, 'date')}{alan('kilo', 'Kilo (kg)', g, setG, 'number')}
                {alan('ts', 'TA sistolik', g, setG, 'number')}{alan('td', 'TA diastolik', g, setG, 'number')}
                {alan('fundus', 'Fundus yüksekliği (cm)', g, setG, 'number')}{alan('fka', 'Fetal kalp atımı (/dk)', g, setG, 'number')}
                <label style={{ display: 'block' }}><span style={etiketS}>İdrar proteinüri</span>
                  <select value={g.proteinuri || ''} onChange={(e) => { const v = e.target.value; setG((prev) => ({ ...prev, proteinuri: v })); }} style={giris}><option value="">—</option><option>Negatif</option><option>Eser</option><option>+</option><option>++</option><option>+++</option></select></label>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#8FA0B5', margin: '14px 0 6px' }}>USG (isteğe bağlı — ölçümler kaydedilir; persentil yorumu hekimindir)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                {alan('crl', 'CRL (mm)', g, setG)}{alan('bpd', 'BPD (mm)', g, setG)}{alan('hc', 'HC (mm)', g, setG)}{alan('ac', 'AC (mm)', g, setG)}{alan('fl', 'FL (mm)', g, setG)}{alan('efw', 'EFW (g)', g, setG)}
                {alan('amnion', 'Amnion (AFI/normal)', g, setG)}{alan('plasenta', 'Plasenta', g, setG)}{alan('prezentasyon', 'Prezentasyon', g, setG, 'text', 'Sefalik / Makat')}
              </div>
              <label style={{ display: 'block', marginTop: 10 }}><span style={etiketS}>Not</span><textarea value={g.not || ''} onChange={(e) => { const v = e.target.value; setG((prev) => ({ ...prev, not: v })); }} style={{ ...giris, minHeight: 60 }} /></label>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button type="button" style={btn()} onClick={() => izlemKaydet(false)}>Sadece Kaydet</button>
                <button type="button" style={btn(true)} onClick={() => izlemKaydet(true)}>Kaydet ve Bugünkü Muayene Formuna Ekle</button>
                <button type="button" style={btn()} onClick={() => setIzlemAcik(false)}>Vazgeç</button>
              </div>
            </div>
          )}

          <div style={kutu}>
            <div style={{ fontWeight: 700, color: '#EDF1F7', marginBottom: 10 }}>SB İzlem Takvimi</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {veri.takvim.map((p) => (
                <details key={p.no} style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '8px 12px' }}>
                  <summary style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13.5, color: '#EDF1F7' }}>
                    <span><b>{p.etiket}</b> · {p.haftaBas}-{p.haftaSon}. hafta</span>
                    <span style={{ color: DURUM_RENK[p.durum], fontWeight: 700, fontSize: 12 }}>{DURUM_ETIKET[p.durum]}</span>
                  </summary>
                  <ul style={{ margin: '8px 0 4px', paddingLeft: 18, color: '#C9D4E3', fontSize: 12.5, lineHeight: 1.6 }}>
                    {p.maddeler.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </details>
              ))}
            </div>
          </div>

          {veri.izlemler.length > 0 && (
            <div style={kutu}>
              <div style={{ fontWeight: 700, color: '#EDF1F7', marginBottom: 8 }}>İzlem Geçmişi</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, color: '#C9D4E3' }}>
                  <thead><tr style={{ color: '#8FA0B5', textAlign: 'left' }}><th style={{ padding: 6 }}>Tarih</th><th>Hafta</th><th>Kilo</th><th>TA</th><th>Fundus</th><th>FKA</th><th>Prot.</th><th>USG</th></tr></thead>
                  <tbody>
                    {[...veri.izlemler].reverse().map((i) => (
                      <tr key={i.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: 6 }}>{trTarih(i.tarih)}</td><td>{i.hafta}</td><td>{i.kilo ?? '—'}</td>
                        <td>{i.tansiyon_sistolik && i.tansiyon_diastolik ? `${i.tansiyon_sistolik}/${i.tansiyon_diastolik}` : '—'}</td>
                        <td>{i.fundus_yuksekligi ?? '—'}</td><td>{i.fetal_kalp_atimi ?? '—'}</td><td>{i.proteinuri ?? '—'}</td>
                        <td style={{ color: '#8FA0B5' }}>{(() => {
                          const b = veri.biyometri?.find((x) => x.izlemId === i.id);
                          if (!b) return i.usg ? Object.entries(i.usg).map(([k, v]) => `${k.toUpperCase()} ${v}`).join(' · ') : '—';
                          const r = (ad: string, x: Bio | null) => x ? <span key={ad} style={{ color: x.durum === 'normal' ? '#C9D4E3' : '#F59E0B', marginRight: 8 }}>{ad} {x.deger} <b>p{x.persentil}</b></span> : null;
                          return <>{r('HC', b.hc)}{r('BPD', b.bpd)}{r('AC', b.ac)}{r('FL', b.fl)}{b.efw ? (
                            <span style={{ color: '#2DD4BF' }} title={b.efwKaynak === 'hadlock' ? 'Hadlock 1985 (HC-AC-FL)' : undefined}>
                              EFW {b.efw} g{b.efwKaynak === 'hadlock' ? ` (Hadlock${b.efwGirilen && b.efwGirilen !== b.efw ? `; girilen ${b.efwGirilen} g` : ''})` : ''}
                            </span>
                          ) : null}</>;
                        })()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {veri?.gebelik && !veri.lohusa && (
        <div style={kutu}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ fontWeight: 700, color: '#EDF1F7' }}>Genetik / Kromozomal Tarama</div>
            {veri.ileriAnneYasi && <span style={{ fontSize: 11.5, color: '#F59E0B', fontWeight: 700 }}>İleri anne yaşı (≥35)</span>}
          </div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginBottom: 10 }}>
            Bu bölüm yalnız laboratuvarın/sertifikalı yazılımın (FMF/Astraia vb.) bildirdiği sonucu kaydeder — <b>risk oranını burada hesaplamıyoruz</b>. NT için yalnız mutlak bir eşik (≥3.5mm) bayrak kaldırır; kombine risk her zaman sertifikalı yazılımınızdan gelir.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {(['ikili', 'uclu-dortlu', 'nipt', 'invazif'] as const).map((t) => (
              <button key={t} type="button" style={btn(genetikTurAcik === t)} onClick={() => setGenetikTurAcik(genetikTurAcik === t ? '' : t)}>
                {{ ikili: '+ İkili Test', 'uclu-dortlu': '+ Üçlü/Dörtlü Test', nipt: '+ NIPT', invazif: '+ İnvaziv Test' }[t]}
              </button>
            ))}
          </div>

          {genetikTurAcik === 'ikili' && (
            <div style={{ display: 'grid', gap: 10, marginBottom: 10, padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                {alan('ntMm', 'NT (mm)', n, setN, 'number')}{alan('papA', 'PAPP-A (MoM)', n, setN)}{alan('freeBhcg', 'Serbest β-hCG (MoM)', n, setN)}
                {alan('kombineRisk', 'Kombine risk (laboratuvar sonucu, ör. 1/1250)', n, setN)}
                <label style={{ display: 'block' }}><span style={etiketS}>Risk kategorisi (laboratuvarın bildirdiği)</span><select value={n.riskKategorisi || ''} onChange={(e) => setN({ ...n, riskKategorisi: e.target.value })} style={giris}><option value="">—</option><option value="dusuk">Düşük</option><option value="orta">Orta</option><option value="yuksek">Yüksek</option></select></label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}><button type="button" style={btn()} onClick={() => genetikKaydet('ikili', false)}>Kaydet</button><button type="button" style={btn(true)} onClick={() => genetikKaydet('ikili', true)}>Kaydet ve Forma Ekle</button></div>
            </div>
          )}
          {genetikTurAcik === 'uclu-dortlu' && (
            <div style={{ display: 'grid', gap: 10, marginBottom: 10, padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                {alan('afp', 'AFP (MoM)', n, setN)}{alan('hcg2', 'hCG (MoM)', n, setN)}{alan('estriol', 'Estriol (MoM)', n, setN)}{alan('inhibinA', 'İnhibin A (MoM, dörtlü)', n, setN)}
                {alan('kombineRisk2', 'Kombine risk (laboratuvar sonucu)', n, setN)}
              </div>
              <div style={{ display: 'flex', gap: 8 }}><button type="button" style={btn()} onClick={() => genetikKaydet('uclu-dortlu', false)}>Kaydet</button><button type="button" style={btn(true)} onClick={() => genetikKaydet('uclu-dortlu', true)}>Kaydet ve Forma Ekle</button></div>
            </div>
          )}
          {genetikTurAcik === 'nipt' && (
            <div style={{ display: 'grid', gap: 10, marginBottom: 10, padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                <label style={{ display: 'block' }}><span style={etiketS}>Durum</span><select value={n.niptDurum || ''} onChange={(e) => setN({ ...n, niptDurum: e.target.value })} style={giris}><option value="istendi">İstendi</option><option value="sonuclandi">Sonuçlandı</option><option value="basarisiz-tekrar">Başarısız / tekrar gerekti</option></select></label>
                {(['t21', 't18', 't13'] as const).map((k) => (
                  <label key={k} style={{ display: 'block' }}><span style={etiketS}>{k.toUpperCase()}</span><select value={n[k] || ''} onChange={(e) => setN({ ...n, [k]: e.target.value })} style={giris}><option value="">—</option><option value="dusuk-risk">Düşük risk</option><option value="yuksek-risk">Yüksek risk</option></select></label>
                ))}
                {alan('cinsiyetK', 'Cinsiyet kromozomu (istenirse)', n, setN)}{alan('fetalFraksiyon', 'Fetal fraksiyon (%)', n, setN)}
              </div>
              <div style={{ display: 'flex', gap: 8 }}><button type="button" style={btn()} onClick={() => genetikKaydet('nipt', false)}>Kaydet</button><button type="button" style={btn(true)} onClick={() => genetikKaydet('nipt', true)}>Kaydet ve Forma Ekle</button></div>
            </div>
          )}
          {genetikTurAcik === 'invazif' && (
            <div style={{ display: 'grid', gap: 10, marginBottom: 10, padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                <label style={{ display: 'block' }}><span style={etiketS}>Tür</span><select value={n.invazifTur || 'amniyosentez'} onChange={(e) => setN({ ...n, invazifTur: e.target.value })} style={giris}><option value="cvs">CVS (koryon villus örneklemesi)</option><option value="amniyosentez">Amniyosentez</option></select></label>
                {alan('endikasyon', 'Endikasyon', n, setN)}{alan('invazifSonuc', 'Sonuç', n, setN)}{alan('karyotip', 'Karyotip', n, setN)}
              </div>
              <div style={{ display: 'flex', gap: 8 }}><button type="button" style={btn()} onClick={() => genetikKaydet('invazif', false)}>Kaydet</button><button type="button" style={btn(true)} onClick={() => genetikKaydet('invazif', true)}>Kaydet ve Forma Ekle</button></div>
            </div>
          )}

          {veri.genetikTaramalar && veri.genetikTaramalar.length > 0 && (
            <div style={{ display: 'grid', gap: 6 }}>
              {[...veri.genetikTaramalar].reverse().map((g) => (
                <div key={g.id} style={{ fontSize: 12.5, color: '#C9D4E3', borderLeft: g.ntDegerlendirme?.bayrak ? '3px solid #F59E0B' : '3px solid rgba(255,255,255,0.1)', padding: '6px 10px', background: g.ntDegerlendirme?.bayrak ? '#F59E0B10' : 'transparent', borderRadius: 6 }}>
                  <b style={{ color: '#EDF1F7' }}>{{ ikili: 'İkili Test', 'uclu-dortlu': 'Üçlü/Dörtlü Test', nipt: 'NIPT', invazif: 'İnvaziv Test', 'risk-sorgu': 'Risk Sorgusu' }[g.tur] || g.tur}</b>
                  {' · '}{trTarih(g.tarih)}{g.hafta ? ` · ${g.hafta}. hafta` : ''}
                  {' — '}{Object.entries(g.veri).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')}
                  {g.ntDegerlendirme && <div style={{ color: g.ntDegerlendirme.bayrak ? '#F59E0B' : '#64748B', marginTop: 2 }}>{g.ntDegerlendirme.not}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {veri?.gebelik && veri.lohusa && (
        <>
          {lohusaAcik && (
            <div style={kutu}>
              <div style={{ fontWeight: 700, color: '#EDF1F7', marginBottom: 10 }}>Yeni Lohusa İzlemi</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                {alan('tarih', 'Tarih', l, setL, 'date')}{alan('ts', 'TA sistolik', l, setL, 'number')}{alan('td', 'TA diastolik', l, setL, 'number')}{alan('ates', 'Ateş (°C)', l, setL, 'number')}
                <label style={{ display: 'block' }}><span style={etiketS}>Kanama (loşi)</span><select value={l.kanama || ''} onChange={(e) => setL({ ...l, kanama: e.target.value })} style={giris}><option value="">—</option><option>Normal</option><option>Fazla</option><option>Kötü kokulu</option><option>Kesildi</option></select></label>
                <label style={{ display: 'block' }}><span style={etiketS}>Uterus involüsyonu</span><select value={l.uterus || ''} onChange={(e) => setL({ ...l, uterus: e.target.value })} style={giris}><option value="">—</option><option>Uygun</option><option>Gecikmiş</option><option>Hassas</option></select></label>
                <label style={{ display: 'block' }}><span style={etiketS}>Perine / insizyon</span><select value={l.perine || ''} onChange={(e) => setL({ ...l, perine: e.target.value })} style={giris}><option value="">—</option><option>İyileşiyor</option><option>Enfeksiyon şüphesi</option><option>Ayrışma</option></select></label>
                <label style={{ display: 'block' }}><span style={etiketS}>Emzirme</span><select value={l.emzirme || ''} onChange={(e) => setL({ ...l, emzirme: e.target.value })} style={giris}><option value="">—</option><option>Tam emziriyor</option><option>Kısmen</option><option>Emzirmiyor</option><option>Meme sorunu var</option></select></label>
                <label style={{ display: 'block' }}><span style={etiketS}>Duygu durumu</span><select value={l.duygu || ''} onChange={(e) => setL({ ...l, duygu: e.target.value })} style={giris}><option value="">—</option><option>İyi</option><option>Hüzünlü (baby blues)</option><option>Depresif belirtiler</option></select></label>
                {alan('epds', 'EPDS puanı (isteğe bağlı)', l, setL, 'number')}
              </div>
              <label style={{ display: 'block', marginTop: 10 }}><span style={etiketS}>Not</span><textarea value={l.not || ''} onChange={(e) => setL({ ...l, not: e.target.value })} style={{ ...giris, minHeight: 60 }} /></label>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button type="button" style={btn()} onClick={() => lohusaKaydet(false)}>Sadece Kaydet</button>
                <button type="button" style={btn(true)} onClick={() => lohusaKaydet(true)}>Kaydet ve Bugünkü Muayene Formuna Ekle</button>
                <button type="button" style={btn()} onClick={() => setLohusaAcik(false)}>Vazgeç</button>
              </div>
            </div>
          )}
          <div style={kutu}>
            <div style={{ fontWeight: 700, color: '#EDF1F7', marginBottom: 4 }}>SB Lohusa İzlem Takvimi</div>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>Doğum Sonu Bakım Yönetim Rehberi — ilk 24 saat hastane, sonrası 42. güne kadar.</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {veri.lohusa.takvim.map((p) => (
                <details key={p.no} style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '8px 12px' }}>
                  <summary style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13.5, color: '#EDF1F7' }}>
                    <span><b>{p.etiket}</b></span>
                    <span style={{ color: DURUM_RENK[p.durum], fontWeight: 700, fontSize: 12 }}>{DURUM_ETIKET[p.durum]}</span>
                  </summary>
                  <ul style={{ margin: '8px 0 4px', paddingLeft: 18, color: '#C9D4E3', fontSize: 12.5, lineHeight: 1.6 }}>{p.maddeler.map((m, i) => <li key={i}>{m}</li>)}</ul>
                </details>
              ))}
            </div>
            {veri.lohusa.izlemler.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, color: '#C9D4E3', marginTop: 12 }}>
                <thead><tr style={{ color: '#8FA0B5', textAlign: 'left' }}><th style={{ padding: 6 }}>Tarih</th><th>Gün</th><th>TA</th><th>Loşi</th><th>Emzirme</th><th>Duygu</th><th>EPDS</th></tr></thead>
                <tbody>{[...veri.lohusa.izlemler].reverse().map((x) => (
                  <tr key={x.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}><td style={{ padding: 6 }}>{trTarih(x.tarih)}</td><td>{x.dogum_sonrasi_gun}</td><td>{x.tansiyon_sistolik && x.tansiyon_diastolik ? `${x.tansiyon_sistolik}/${x.tansiyon_diastolik}` : '—'}</td><td>{x.kanama ?? '—'}</td><td>{x.emzirme ?? '—'}</td><td>{x.duygu_durumu ?? '—'}</td><td>{x.epds_puan ?? '—'}</td></tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </>
      )}

      <KadinSagligiPaneli patientId={patientId} />

      {onceki.length > 0 && (
        <div style={kutu}>
          <div style={{ fontWeight: 700, color: '#EDF1F7', marginBottom: 8 }}>Önceki Gebelikler</div>
          {onceki.map((p) => {
            const tur = oncekiGebelikEtiketTuru(p.durum);
            const durumYazi = tur === 'dogum'
              ? `Doğum ${trTarih(p.dogum_tarihi)}${p.dogum_sekli ? ` (${p.dogum_sekli})` : ''}`
              : oncekiGebelikDurumMetni(p.durum);
            return (
              <div key={p.id} style={{ fontSize: 13, color: '#C9D4E3', padding: '4px 0' }}>TDT {trTarih(p.tdt)} · {durumYazi}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** NOTYA-KHD-03 — KETEM tarama durumu, kontrasepsiyon, menstrüel/menopoz. */
function KadinSagligiPaneli({ patientId }: { patientId: string }) {
  const [d, setD] = useState<{ kayit: Record<string, string | number | null> | null; yas: number | null; taramalar: Array<{ id: string; ad: string; yasBas: number; yasSon: number; aralikYil: number; durum: string; sonTarih: string | null; sonrakiTarih: string | null }>; yontemler: Array<{ id: string; ad: string; emzirmeUyumlu: boolean; not: string }>; menopozBasliklari: string[] } | null>(null);
  const [f, setF] = useState<Record<string, string>>({});
  const [acik, setAcik] = useState(false);
  const [mesaj, setMesaj] = useState('');
  const yukle = useCallback(async () => {
    try {
      const t = await ensureDoctorAccessToken();
      const r = await fetch(`/api/doktor/kadin-sagligi?patientId=${patientId}`, { headers: { Authorization: `Bearer ${t}` } });
      const j = await r.json(); if (r.ok) { setD(j); const k = j.kayit || {}; setF(Object.fromEntries(Object.entries(k).map(([a, b]) => [a, b == null ? '' : String(b)]))); }
    } catch { /* panel kritik değil */ }
  }, [patientId]);
  useEffect(() => { yukle(); }, [yukle]);
  const kaydet = async () => {
    try {
      const t = await ensureDoctorAccessToken();
      const r = await fetch('/api/doktor/kadin-sagligi', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify({ patientId, sonServiksTarama: f.son_serviks_tarama, sonServiksSonuc: f.son_serviks_sonuc, sonMamografi: f.son_mamografi, sonMamografiSonuc: f.son_mamografi_sonuc, sonKolorektal: f.son_kolorektal, kontrasepsiyonYontemi: f.kontrasepsiyon_yontemi, kontrasepsiyonBaslangic: f.kontrasepsiyon_baslangic, menarsYasi: f.menarş_yasi ? Number(f.menarş_yasi) : null, adetDuzeni: f.adet_duzeni, sonAdetTarihi: f.son_adet_tarihi, menopozDurumu: f.menopoz_durumu, menopozYasi: f.menopoz_yasi ? Number(f.menopoz_yasi) : null, notlar: f.notlar }) });
      setMesaj(r.ok ? 'Kaydedildi.' : 'Kaydedilemedi.'); setAcik(false); yukle();
    } catch { setMesaj('Kaydedilemedi.'); }
  };
  if (!d) return null;
  const TR: Record<string, string> = { gerekli: 'Gerekli', guncel: 'Güncel', yakinda: 'Yakında', 'kapsam-disi': 'Yaş dışı' };
  const RK: Record<string, string> = { gerekli: '#EF4444', guncel: '#22C55E', yakinda: '#F59E0B', 'kapsam-disi': '#475569' };
  const inp = (k: string, label: string, tip = 'text') => <label style={{ display: 'block' }}><span style={etiketS}>{label}</span><input type={tip} name={k} value={f[k] || ''} onChange={(e) => { const v = e.target.value; setF((prev) => ({ ...prev, [k]: v })); }} style={giris} /></label>;
  return (
    <div style={kutu}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div><div style={{ fontWeight: 700, color: '#EDF1F7' }}>Kadın Sağlığı</div><div style={{ fontSize: 12, color: '#64748B' }}>SB Kanser Tarama Standartları (KETEM) · Aile planlaması · Menopoz{d.yas !== null ? ` · ${d.yas} yaş` : ''}</div></div>
        <button type="button" style={btn()} onClick={() => setAcik((v) => !v)}>{acik ? 'Kapat' : 'Düzenle'}</button>
      </div>
      {mesaj && <div style={{ fontSize: 12, color: '#22C55E', marginBottom: 6 }}>{mesaj}</div>}
      <div style={{ display: 'grid', gap: 6, marginBottom: 10 }}>
        {d.taramalar.map((t) => (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, borderLeft: `3px solid ${RK[t.durum]}`, padding: '6px 10px', background: RK[t.durum] + '10', borderRadius: 6 }}>
            <span style={{ color: '#EDF1F7' }}>{t.ad} <span style={{ color: '#64748B', fontSize: 11.5 }}>({t.yasBas}-{t.yasSon} yaş, {t.aralikYil} yılda bir)</span></span>
            <span style={{ color: RK[t.durum], fontWeight: 700, whiteSpace: 'nowrap' }}>{TR[t.durum]}{t.sonrakiTarih ? ` · ${new Date(t.sonrakiTarih).toLocaleDateString('tr-TR')}` : ''}</span>
          </div>
        ))}
      </div>
      {!acik && d.kayit && (
        <div style={{ fontSize: 12.5, color: '#9FB3C8' }}>
          {d.kayit.kontrasepsiyon_yontemi ? `Kontrasepsiyon: ${d.kayit.kontrasepsiyon_yontemi}` : 'Kontrasepsiyon: kayıt yok'}{d.kayit.adet_duzeni ? ` · Adet: ${d.kayit.adet_duzeni}` : ''}{d.kayit.menopoz_durumu ? ` · ${d.kayit.menopoz_durumu}` : ''}
        </div>
      )}
      {acik && (
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            {inp('son_serviks_tarama', 'Son HPV/smear', 'date')}{inp('son_serviks_sonuc', 'Sonuç')}
            {inp('son_mamografi', 'Son mamografi', 'date')}{inp('son_mamografi_sonuc', 'Sonuç (BI-RADS)')}
            {inp('son_kolorektal', 'Son GGK', 'date')}
            <label style={{ display: 'block' }}><span style={etiketS}>Kontrasepsiyon yöntemi</span><select value={f.kontrasepsiyon_yontemi || ''} onChange={(e) => setF({ ...f, kontrasepsiyon_yontemi: e.target.value })} style={giris}><option value="">—</option>{d.yontemler.map((y) => <option key={y.id} value={y.ad}>{y.ad}{y.emzirmeUyumlu ? '' : ' (emzirmede ilk 6 ay önerilmez)'}</option>)}</select></label>
            {inp('kontrasepsiyon_baslangic', 'Başlangıç', 'date')}
            {inp('menarş_yasi', 'Menarş yaşı', 'number')}{inp('adet_duzeni', 'Adet düzeni (ör. 28/5, düzensiz)')}{inp('son_adet_tarihi', 'Son adet tarihi', 'date')}
            <label style={{ display: 'block' }}><span style={etiketS}>Menopoz durumu</span><select value={f.menopoz_durumu || ''} onChange={(e) => setF({ ...f, menopoz_durumu: e.target.value })} style={giris}><option value="">—</option><option value="premenopoz">Premenopoz</option><option value="perimenopoz">Perimenopoz</option><option value="postmenopoz">Postmenopoz</option></select></label>
            {inp('menopoz_yasi', 'Menopoz yaşı', 'number')}
          </div>
          <label style={{ display: 'block' }}><span style={etiketS}>Notlar</span><textarea value={f.notlar || ''} onChange={(e) => setF({ ...f, notlar: e.target.value })} style={{ ...giris, minHeight: 56 }} /></label>
          {(f.menopoz_durumu === 'perimenopoz' || f.menopoz_durumu === 'postmenopoz') && (
            <div style={{ fontSize: 12, color: '#8FA0B5' }}><b style={{ color: '#EDF1F7' }}>Menopoz değerlendirme başlıkları:</b><ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{d.menopozBasliklari.map((m, i) => <li key={i}>{m}</li>)}</ul></div>
          )}
          <div><button type="button" style={btn(true)} onClick={kaydet}>Kaydet</button></div>
        </div>
      )}
    </div>
  );
}
