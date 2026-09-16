'use client';
/**
 * NOTYA-KHD-04 — Gebe İzlem Kartı (yazdır/PDF). SB DÖB Rehberi'nin "izlem fişinin bir örneğini
 * gebeye veriniz" ilkesi: gebelik özeti, izlem tablosu (USG persentilleriyle), SB takvim durumu,
 * doğum/lohusa bilgisi. Reçete/epikriz ile aynı letterhead ve kağıt dili. A4.
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';

type Bio = { deger: number; persentil: number };
type Veri = {
  gebelik: { sat: string | null; tdt: string; tdt_kaynak: string; gravida: number | null; para: number | null; abortus: number | null; yasayan: number | null; olu_dogum?: number | null; ektopik?: number | null; risk_sinifi?: string | null; kan_grubu: string | null; rh_negatif: boolean; durum: string; dogum_tarihi: string | null; dogum_sekli: string | null; dogum_notu: string | null; gebelik_oncesi_kilo: number | null; boy: number | null; lab_panel?: Record<string, { tarih?: string; sonuc?: string; deger?: string }> | null } | null;
  izlemler: Array<{ id: string; tarih: string; hafta: number; kilo: number | null; tansiyon_sistolik: number | null; tansiyon_diastolik: number | null; fundus_yuksekligi: number | null; fetal_kalp_atimi: number | null; proteinuri: string | null; usg: Record<string, string | number> | null; not_metni: string | null; checklist?: Record<string, { durum?: string; neden?: string }> | null }>;
  biyometri?: Array<{ izlemId: string; hafta: number; hc: Bio | null; bpd: Bio | null; ac: Bio | null; fl: Bio | null; efw: number | null }>;
  yas: { metin: string; trimester: number } | null;
  takvim: Array<{ no: number; etiket: string; haftaBas: number; haftaSon: number; durum: string }>;
  lohusa?: { dogumSonrasiGun: number; izlemler: Array<{ tarih: string; dogum_sonrasi_gun: number; tansiyon_sistolik: number | null; tansiyon_diastolik: number | null; kanama: string | null; emzirme: string | null; duygu_durumu: string | null }> } | null;
  baslik: { hastaAd: string; dogumTarihi: string | null; hekim: string; satirlar: string[]; logoDataUrl: string; diplomaNo: string };
  gebelikOncesiVki: number | null; kiloHedefi: { alt: number; ust: number; etiket: string } | null;
  genetikTaramalar?: Array<{ tur: string; tarih: string; hafta: number | null; veri: Record<string, string | number | null> }>;
};

const tr = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' }) : '—');
const DURUM: Record<string, string> = { tamamlandi: 'Yapıldı', zamani: 'Zamanı', gecikmis: 'Gecikmiş', ileride: '—' };
const H: React.CSSProperties = { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #ccc', paddingBottom: 4, margin: '18px 0 8px' };
const TH: React.CSSProperties = { textAlign: 'left', fontSize: 11, color: '#555', padding: '4px 6px', borderBottom: '1px solid #999' };
const TD: React.CSSProperties = { fontSize: 11.5, padding: '4px 6px', borderBottom: '1px solid #e5e5e5', verticalAlign: 'top' };

export default function GebeIzlemKartiYazdir() {
  const params = useParams<{ id: string }>();
  const [v, setV] = useState<Veri | null>(null);
  const [hata, setHata] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const t = await ensureDoctorAccessToken();
        const r = await fetch(`/api/doktor/gebelik?patientId=${params.id}`, { headers: { Authorization: `Bearer ${t}` } });
        const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Yüklenemedi'); setV(d);
      } catch (e) { setHata(e instanceof Error ? e.message : 'Yüklenemedi'); }
    })();
  }, [params.id]);

  if (hata) return <div style={{ padding: 24, fontFamily: 'system-ui' }}>{hata}</div>;
  if (!v) return <div style={{ padding: 24, fontFamily: 'system-ui', color: '#666' }}>Yükleniyor…</div>;
  if (!v.gebelik) return <div style={{ padding: 24, fontFamily: 'system-ui' }}>Bu hastada gebelik kaydı yok. <a href={`/dashboard/doktor/hastalar/${params.id}`}>← Hasta dosyası</a></div>;
  const g = v.gebelik, b = v.baslik;

  return (
    <div style={{ background: 'white', color: '#111', minHeight: '100vh', fontFamily: 'Georgia, "Times New Roman", serif' }}>
      <style>{`@media print { .yazdirma-gizle { display: none !important; } body { -webkit-print-color-adjust: exact; } @page { size: A4; margin: 14mm; } }`}</style>
      <div className="yazdirma-gizle" style={{ background: '#0B1628', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href={`/dashboard/doktor/hastalar/${params.id}`} style={{ color: '#9FB3C8', fontFamily: 'system-ui', fontSize: 13, textDecoration: 'none' }}>← Hasta Dosyası</a>
          <span style={{ color: 'white', fontFamily: 'system-ui', fontSize: 14, fontWeight: 700 }}>Gebe İzlem Kartı · {b.hastaAd || 'Hasta'}</span>
        </span>
        <button type="button" onClick={() => window.print()} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 8, padding: '10px 18px', fontFamily: 'system-ui', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>🖨️ Yazdır / PDF (A4)</button>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #111', paddingBottom: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>GEBE İZLEM KARTI</div>
            <div style={{ fontSize: 11.5, color: '#555' }}>T.C. Sağlık Bakanlığı Doğum Öncesi Bakım Yönetim Rehberi esaslı</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {b.logoDataUrl && <img src={b.logoDataUrl} alt="" style={{ height: 38, marginBottom: 4 }} />}
            {b.satirlar.map((s, i) => <div key={i} style={{ fontSize: i === 0 ? 14 : 11.5, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? '#111' : '#555' }}>{s}</div>)}
            {!b.satirlar.length && b.hekim && <div style={{ fontSize: 14, fontWeight: 700 }}>{b.hekim}</div>}
            {b.diplomaNo && <div style={{ fontSize: 10.5, color: '#777' }}>Diploma No: {b.diplomaNo}</div>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', fontSize: 12.5, lineHeight: 1.7 }}>
          <div><b>Ad Soyad:</b> {b.hastaAd || '—'}</div><div><b>Doğum Tarihi:</b> {tr(b.dogumTarihi)}</div>
          <div><b>SAT:</b> {tr(g.sat)}</div><div><b>Tahmini Doğum Tarihi:</b> {tr(g.tdt)} ({g.tdt_kaynak === 'usg' ? 'USG' : 'Naegele'})</div>
          <div><b>Gebelik yaşı (bugün):</b> {v.yas ? `${v.yas.metin}, ${v.yas.trimester}. trimester` : '—'}</div>
          <div><b>Obstetrik öykü:</b> G{g.gravida ?? '—'} P{g.para ?? '—'} A{g.abortus ?? '—'} Y{g.yasayan ?? '—'} D{g.olu_dogum ?? '—'} E{g.ektopik ?? '—'}</div>
          <div><b>Risk sınıfı:</b> {g.risk_sinifi === 'yuksek' ? 'Yüksek' : g.risk_sinifi === 'orta' ? 'Orta' : 'Düşük'}</div>
          <div><b>Kan grubu / Rh:</b> {g.kan_grubu ? `${g.kan_grubu} Rh(${g.rh_negatif ? '−' : '+'})` : '—'}</div>
          <div><b>Gebelik öncesi kilo / boy / VKİ:</b> {g.gebelik_oncesi_kilo ?? '—'} kg / {g.boy ?? '—'} cm / {v.gebelikOncesiVki ?? '—'}{v.kiloHedefi ? ` (hedef +${v.kiloHedefi.alt}-${v.kiloHedefi.ust} kg)` : ''}</div>
          <div style={{ gridColumn: '1 / -1' }}><b>Hekim:</b> {b.hekim || '—'}</div>
        </div>

        <div style={H}>SB İzlem Takvimi</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['İzlem', 'Hafta', 'Durum'].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>{v.takvim.map((p) => <tr key={p.no}><td style={TD}>{p.etiket}</td><td style={TD}>{p.haftaBas}-{p.haftaSon}</td><td style={TD}>{DURUM[p.durum]}</td></tr>)}</tbody>
        </table>

        {g.lab_panel && Object.keys(g.lab_panel).length > 0 && (
          <>
            <div style={H}>Laboratuvar</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Test', 'Tarih', 'Sonuç'].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {Object.entries(g.lab_panel).filter(([, row]) => row && (row.sonuc || row.deger || row.tarih)).map(([k, row]) => (
                  <tr key={k}><td style={TD}>{k}</td><td style={TD}>{tr(row.tarih)}</td><td style={TD}>{row.sonuc || row.deger || '—'}</td></tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {v.izlemler.some((i) => i.checklist && Object.keys(i.checklist).length > 0) && (
          <>
            <div style={H}>DÖBYR İzlem Kontrol Listesi</div>
            {v.izlemler.map((i) => i.checklist && Object.keys(i.checklist).length > 0 ? (
              <div key={i.id} style={{ fontSize: 11.5, marginBottom: 8 }}>
                <b>{tr(i.tarih)} · {i.hafta}. hafta:</b>{' '}
                {Object.entries(i.checklist).map(([madde, st]) => `${madde}: ${st.durum === 'yapildi' ? 'yapıldı' : st.durum === 'reddedildi' ? `reddedildi${st.neden ? ` (${st.neden})` : ''}` : 'bekliyor'}`).join('; ')}
              </div>
            ) : null)}
          </>
        )}

        <div style={H}>İzlemler</div>
        {v.izlemler.length === 0 ? <div style={{ fontSize: 12, color: '#666' }}>Henüz izlem kaydı yok.</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Tarih', 'Hafta', 'Kilo', 'TA', 'Fundus', 'FKA', 'Prot.', 'Not'].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>{v.izlemler.map((i) => (
              <tr key={i.id}><td style={TD}>{tr(i.tarih)}</td><td style={TD}>{i.hafta}</td><td style={TD}>{i.kilo ?? '—'}</td><td style={TD}>{i.tansiyon_sistolik && i.tansiyon_diastolik ? `${i.tansiyon_sistolik}/${i.tansiyon_diastolik}` : '—'}</td><td style={TD}>{i.fundus_yuksekligi ?? '—'}</td><td style={TD}>{i.fetal_kalp_atimi ?? '—'}</td><td style={TD}>{i.proteinuri ?? '—'}</td><td style={{ ...TD, color: '#444' }}>{i.not_metni || ''}</td></tr>
            ))}</tbody>
          </table>
        )}

        {v.biyometri && v.biyometri.length > 0 && (
          <>
            <div style={H}>Obstetrik USG — Fetal Biyometri</div>
            <div style={{ fontSize: 10.5, color: '#666', marginBottom: 6 }}>Persentiller: INTERGROWTH-21st Fetal Growth Standards (Papageorghiou ve ark., Lancet 2014). EFW: Hadlock (HC-AC-FL).</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Hafta', 'BPD', 'HC', 'AC', 'FL', 'EFW'].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>{v.biyometri.map((x) => {
                const c = (p: Bio | null) => p ? `${p.deger} mm (p${p.persentil})` : '—';
                return <tr key={x.izlemId}><td style={TD}>{x.hafta}</td><td style={TD}>{c(x.bpd)}</td><td style={TD}>{c(x.hc)}</td><td style={TD}>{c(x.ac)}</td><td style={TD}>{c(x.fl)}</td><td style={TD}>{x.efw ? `${x.efw} g` : '—'}</td></tr>;
              })}</tbody>
            </table>
          </>
        )}

        {v.genetikTaramalar && v.genetikTaramalar.length > 0 && (
          <>
            <div style={H}>Genetik / Kromozomal Tarama</div>
            <div style={{ fontSize: 10.5, color: '#666', marginBottom: 6 }}>Sonuçlar laboratuvar/sertifikalı yazılım tarafından bildirilmiştir; risk oranı bu belgede hesaplanmamıştır.</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Test', 'Tarih', 'Hafta', 'Sonuç'].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>{v.genetikTaramalar.map((g, i) => (
                <tr key={i}><td style={TD}>{{ ikili: 'İkili Test', 'uclu-dortlu': 'Üçlü/Dörtlü Test', nipt: 'NIPT', invazif: 'İnvaziv Test' }[g.tur] || g.tur}</td><td style={TD}>{tr(g.tarih)}</td><td style={TD}>{g.hafta ?? '—'}</td><td style={TD}>{Object.entries(g.veri).filter(([, val]) => val).map(([k, val]) => `${k}: ${val}`).join(', ')}</td></tr>
              ))}</tbody>
            </table>
          </>
        )}

        {g.durum === 'tamamlandi' && (
          <>
            <div style={H}>Doğum</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.7 }}><b>Doğum tarihi:</b> {tr(g.dogum_tarihi)} · <b>Şekli:</b> {g.dogum_sekli || '—'}{g.dogum_notu ? ` · ${g.dogum_notu}` : ''}</div>
            {v.lohusa && v.lohusa.izlemler.length > 0 && (
              <>
                <div style={H}>Lohusa İzlemleri (SB Doğum Sonu Bakım Yönetim Rehberi)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Tarih', 'Gün', 'TA', 'Loşi', 'Emzirme', 'Duygu durumu'].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                  <tbody>{v.lohusa.izlemler.map((x, i) => <tr key={i}><td style={TD}>{tr(x.tarih)}</td><td style={TD}>{x.dogum_sonrasi_gun}</td><td style={TD}>{x.tansiyon_sistolik && x.tansiyon_diastolik ? `${x.tansiyon_sistolik}/${x.tansiyon_diastolik}` : '—'}</td><td style={TD}>{x.kanama ?? '—'}</td><td style={TD}>{x.emzirme ?? '—'}</td><td style={TD}>{x.duygu_durumu ?? '—'}</td></tr>)}</tbody>
                </table>
              </>
            )}
          </>
        )}

        <div style={{ marginTop: 36, borderTop: '1px solid #333', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <div style={{ color: '#666' }}>Tehlike işaretlerinde (kanama, şiddetli baş ağrısı, görme bozukluğu, ödem, fetal hareket azalması) hemen başvurunuz.</div>
          <div style={{ textAlign: 'right' }}><div>{b.hekim || 'Uzm. Dr.'}</div><div>Kadın Hastalıkları ve Doğum</div><div>Tarih: {tr(new Date().toISOString())}</div></div>
        </div>
      </div>
    </div>
  );
}
