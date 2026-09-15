'use client';
/**
 * NOTYA-KHD-01 (Kaan 2026-09-14) — Gebelik Takibi sekmesi. SB Doğum Öncesi Bakım Yönetim
 * Rehberi'nin 4 izlem takvimi üzerine; hesaplar sunucuda deterministik. Aşılar/M-CHAT ile aynı desen.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';

type Uyari = { seviye: 'kritik' | 'dikkat' | 'bilgi'; metin: string };
type Pencere = { no: number; etiket: string; haftaBas: number; haftaSon: number; maddeler: string[]; durum: 'tamamlandi' | 'zamani' | 'gecikmis' | 'ileride' };
type Izlem = { id: string; tarih: string; hafta: number; kilo: number | null; tansiyon_sistolik: number | null; tansiyon_diastolik: number | null; fundus_yuksekligi: number | null; fetal_kalp_atimi: number | null; proteinuri: string | null; usg: Record<string, string | number> | null; not_metni: string | null };
type Veri = {
  gebelik: { id: string; sat: string | null; tdt: string; tdt_kaynak: string; gravida: number | null; para: number | null; abortus: number | null; yasayan: number | null; kan_grubu: string | null; rh_negatif: boolean } | null;
  izlemler: Izlem[]; gecmis: Array<{ id: string; tdt: string; durum: string; dogum_tarihi: string | null; dogum_sekli: string | null }>;
  yas: { hafta: number; gun: number; trimester: number; metin: string; toplamGun: number } | null;
  takvim: Pencere[]; uyarilar: Uyari[]; kiloHedefi: { alt: number; ust: number; etiket: string } | null; gebelikOncesiVki: number | null;
};

const RENK = { kritik: '#EF4444', dikkat: '#F59E0B', bilgi: '#38BDF8' } as const;
const DURUM_RENK = { tamamlandi: '#22C55E', zamani: '#F59E0B', gecikmis: '#EF4444', ileride: '#475569' } as const;
const DURUM_ETIKET = { tamamlandi: 'Yapıldı', zamani: 'Zamanı', gecikmis: 'Gecikmiş', ileride: 'İleride' } as const;

const kutu: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: 16 };
const giris: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#EDF1F7', borderRadius: 8, padding: '8px 10px', fontSize: 13, width: '100%' };
const etiketS: React.CSSProperties = { fontSize: 11.5, color: '#8FA0B5', marginBottom: 4, display: 'block' };
const btn = (birincil = false): React.CSSProperties => ({ background: birincil ? '#0F9B8E' : 'rgba(255,255,255,0.08)', border: 'none', color: birincil ? 'white' : '#EDF1F7', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' });

function trTarih(iso: string | null) { return iso ? new Date(iso).toLocaleDateString('tr-TR') : '—'; }

export default function HastaGebelik({ patientId }: { patientId: string }) {
  const [veri, setVeri] = useState<Veri | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [mesaj, setMesaj] = useState('');
  const [baslatAcik, setBaslatAcik] = useState(false);
  const [izlemAcik, setIzlemAcik] = useState(false);
  const [f, setF] = useState<Record<string, string>>({});
  const [g, setG] = useState<Record<string, string>>({});

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

  const sonlandir = async (durum: 'tamamlandi' | 'sonlandi') => {
    if (!veri?.gebelik) return;
    const dogumTarihi = durum === 'tamamlandi' ? window.prompt('Doğum tarihi (YYYY-AA-GG):', new Date().toISOString().slice(0, 10)) : null;
    if (durum === 'tamamlandi' && !dogumTarihi) return;
    const dogumSekli = durum === 'tamamlandi' ? window.prompt('Doğum şekli (NSD / Sezaryen):', 'NSD') : null;
    try { await post({ action: 'sonlandir', gebelikId: veri.gebelik.id, durum, dogumTarihi, dogumSekli }); yukle(); } catch (e) { setHata(e instanceof Error ? e.message : 'Kaydedilemedi'); }
  };

  if (yukleniyor) return <div style={{ padding: 20, color: '#8FA0B5', fontSize: 13 }}>Yükleniyor…</div>;

  const alan = (key: string, label: string, state: Record<string, string>, set: (s: Record<string, string>) => void, tip = 'text', ph = '') => (
    <label style={{ display: 'block' }}>
      <span style={etiketS}>{label}</span>
      <input type={tip} value={state[key] || ''} placeholder={ph} onChange={(e) => set({ ...state, [key]: e.target.value })} style={giris} />
    </label>
  );

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontSize: 13, color: '#8FA0B5' }}>
        Gebelik Takibi — T.C. Sağlık Bakanlığı <i>Doğum Öncesi Bakım Yönetim Rehberi</i> (4 izlem) esaslı. Hafta/tarih/uyarı hesapları deterministik; nihai karar hekimindir.
      </div>
      {hata && <div style={{ color: '#F87171', fontSize: 13 }}>{hata}</div>}
      {mesaj && <div style={{ color: '#22C55E', fontSize: 13 }}>{mesaj}</div>}

      {!veri?.gebelik && (
        <div style={kutu}>
          <div style={{ fontWeight: 700, color: '#EDF1F7', marginBottom: 6 }}>Aktif gebelik kaydı yok</div>
          {!baslatAcik ? <button type="button" style={btn(true)} onClick={() => setBaslatAcik(true)}>+ Gebelik Takibi Başlat</button> : (
            <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                {alan('sat', 'Son adet tarihi (SAT)', f, setF, 'date')}
                {alan('tdt', 'Tahmini doğum tarihi (USG ile — isteğe bağlı)', f, setF, 'date')}
                {alan('gravida', 'Gravida', f, setF, 'number')}{alan('para', 'Para', f, setF, 'number')}
                {alan('abortus', 'Abortus', f, setF, 'number')}{alan('yasayan', 'Yaşayan', f, setF, 'number')}
                {alan('gebelikOncesiKilo', 'Gebelik öncesi kilo (kg)', f, setF, 'number')}{alan('boy', 'Boy (cm)', f, setF, 'number')}
                {alan('kanGrubu', 'Kan grubu', f, setF, 'text', 'A, B, AB, 0')}
                <label style={{ display: 'block' }}><span style={etiketS}>Rh</span>
                  <select value={f.rh || ''} onChange={(e) => setF({ ...f, rh: e.target.value })} style={giris}><option value="">—</option><option value="pozitif">Rh (+)</option><option value="negatif">Rh (−)</option></select></label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}><button type="button" style={btn(true)} onClick={baslat}>Kaydet</button><button type="button" style={btn()} onClick={() => setBaslatAcik(false)}>Vazgeç</button></div>
            </div>
          )}
        </div>
      )}

      {veri?.gebelik && (
        <>
          <div style={{ ...kutu, background: 'linear-gradient(135deg, rgba(15,155,142,0.18), rgba(15,155,142,0.04))', borderColor: 'rgba(15,155,142,0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 30, fontWeight: 800, color: '#EDF1F7' }}>{veri.yas ? veri.yas.metin : 'Hafta hesaplanamadı'}</div>
                <div style={{ fontSize: 13, color: '#9FB3C8' }}>{veri.yas ? `${veri.yas.trimester}. trimester` : ''} · Tahmini doğum: <b style={{ color: '#EDF1F7' }}>{trTarih(veri.gebelik.tdt)}</b> ({veri.gebelik.tdt_kaynak === 'usg' ? 'USG' : 'SAT/Naegele'})</div>
                <div style={{ fontSize: 12.5, color: '#8FA0B5', marginTop: 4 }}>
                  SAT {trTarih(veri.gebelik.sat)} · G{veri.gebelik.gravida ?? '—'} P{veri.gebelik.para ?? '—'} A{veri.gebelik.abortus ?? '—'} Y{veri.gebelik.yasayan ?? '—'}
                  {veri.gebelik.kan_grubu ? ` · ${veri.gebelik.kan_grubu} Rh(${veri.gebelik.rh_negatif ? '−' : '+'})` : ''}
                  {veri.gebelikOncesiVki ? ` · Gebelik öncesi VKİ ${veri.gebelikOncesiVki}` : ''}
                  {veri.kiloHedefi ? ` · Hedef kilo alımı ${veri.kiloHedefi.alt}-${veri.kiloHedefi.ust} kg (${veri.kiloHedefi.etiket})` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" style={btn(true)} onClick={() => setIzlemAcik((v) => !v)}>+ İzlem Ekle</button>
                <button type="button" style={btn()} onClick={() => sonlandir('tamamlandi')}>Doğum Gerçekleşti</button>
              </div>
            </div>
            {veri.yas && <div style={{ marginTop: 12, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}><div style={{ width: `${Math.min(100, (veri.yas.toplamGun / 280) * 100)}%`, height: '100%', background: '#0F9B8E', borderRadius: 3 }} /></div>}
          </div>

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
                  <select value={g.proteinuri || ''} onChange={(e) => setG({ ...g, proteinuri: e.target.value })} style={giris}><option value="">—</option><option>Negatif</option><option>Eser</option><option>+</option><option>++</option><option>+++</option></select></label>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#8FA0B5', margin: '14px 0 6px' }}>USG (isteğe bağlı — ölçümler kaydedilir; persentil yorumu hekimindir)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                {alan('crl', 'CRL (mm)', g, setG)}{alan('bpd', 'BPD (mm)', g, setG)}{alan('hc', 'HC (mm)', g, setG)}{alan('ac', 'AC (mm)', g, setG)}{alan('fl', 'FL (mm)', g, setG)}{alan('efw', 'EFW (g)', g, setG)}
                {alan('amnion', 'Amnion (AFI/normal)', g, setG)}{alan('plasenta', 'Plasenta', g, setG)}{alan('prezentasyon', 'Prezentasyon', g, setG, 'text', 'Sefalik / Makat')}
              </div>
              <label style={{ display: 'block', marginTop: 10 }}><span style={etiketS}>Not</span><textarea value={g.not || ''} onChange={(e) => setG({ ...g, not: e.target.value })} style={{ ...giris, minHeight: 60 }} /></label>
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
                        <td style={{ color: '#8FA0B5' }}>{i.usg ? Object.entries(i.usg).map(([k, v]) => `${k.toUpperCase()} ${v}`).join(' · ') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {veri && veri.gecmis.length > 0 && (
        <div style={kutu}>
          <div style={{ fontWeight: 700, color: '#EDF1F7', marginBottom: 8 }}>Önceki Gebelikler</div>
          {veri.gecmis.map((p) => (
            <div key={p.id} style={{ fontSize: 13, color: '#C9D4E3', padding: '4px 0' }}>TDT {trTarih(p.tdt)} · {p.durum === 'tamamlandi' ? `Doğum ${trTarih(p.dogum_tarihi)}${p.dogum_sekli ? ` (${p.dogum_sekli})` : ''}` : 'Sonlandı'}</div>
          ))}
        </div>
      )}
    </div>
  );
}
