/**
 * KONSULTASYON-01 — KONSÜLTASYON İSTEM FORMU'nun kağıdı (sunumsal; veri sayfadan gelir). Yazdırma sayfası:
 * app/dashboard/doktor/hastalar/[id]/konsultasyon/[kid]/yazdir. SSR testi: lib/doktor/konsultasyonUi.test.ts.
 *
 * TTB istem içeriği: hasta tanımlayıcıları, muhtemel/kesin tanılar, mevcut hal, konsültasyon NEDENİ (klinik soru),
 * istem TARİHİ, aciliyet; istem yapan hekim kaşe/imza; konsültan hekim yanıt alanı. SGK sevk belgesine BENZEMEZ.
 */
import React from 'react';
import { ACILIYET_ETIKETI, trGun, type Aciliyet } from '@/lib/doktor/konsultasyon';
import { yasHesapla } from '@/lib/doktor/yas';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme'

export type IstemFormuVerisi = {
  konsultasyon: {
    id: string; hedefEtiketi: string; hedef_hekim: string | null; klinik_soru: string | null; not_metni: string | null;
    aciliyet: string | null; tanilar: string | null; mevcut_durum: string | null; istem_tarihi: string | null; created_at: string;
  };
  hasta: { adSoyad: string; dogumTarihi: string | null; cinsiyet: string; veliSatiri: boolean };
  baslik: { hekim: string; brans: string; satirlar: string[]; logoDataUrl: string; diplomaNo: string };
};

const H: React.CSSProperties = { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #ccc', paddingBottom: 4, margin: '18px 0 8px' };
const KUTU: React.CSSProperties = { fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', minHeight: 22 };
const BOS_SATIR: React.CSSProperties = { borderBottom: '1px dotted #999', height: 26 };

export const SGK_DEGILDIR_NOTU = 'Bu belge SGK sevk belgesi (SUT EK-2/F Hasta Sevk Formu / e-sevk) değildir; hekimden hekime konsültasyon (görüş) istemidir. Kurumlar arası SGK sevki gerekiyorsa MEDULA üzerinden düzenlenir. Konsültan hekim yanıtı hastanın dosyasına işlenir.';

export default function KonsultasyonIstemFormuKagidi({ v }: { v: IstemFormuVerisi }) {
  const k = v.konsultasyon, h = v.hasta, b = v.baslik;
  const aciliyet = (k.aciliyet && k.aciliyet in ACILIYET_ETIKETI ? k.aciliyet : 'rutin') as Aciliyet;
  const yas = h.dogumTarihi ? yasHesapla(h.dogumTarihi) : '';
  const bos = (n: number) => Array.from({ length: n }, (_, i) => <div key={i} style={BOS_SATIR} />);
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px clamp(16px, 5vw, 40px)', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', borderBottom: '2px solid #111', paddingBottom: 12, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M8 19c1.6-5.8 3.4-9.6 7.2-14.2.8 3.4.8 6.4-.2 9.2-1.5 2.4-4 4-7 5z" stroke="#6a7563" strokeWidth="1.3"/></svg>
            <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, color: '#6d6055' }}>Notya</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 500 }}>Konsültasyon İstem Formu</div>
          <div style={{ fontSize: 11.5, color: CHROME_RENK.muted }}>Meslektaş görüşü istemi</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {b.logoDataUrl && <img src={b.logoDataUrl} alt="" style={{ height: 38, marginBottom: 4 }} />}
          {b.satirlar.map((s, i) => <div key={i} style={{ fontSize: i === 0 ? 14 : 11.5, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? '#111' : '#555' }}>{s}</div>)}
          {!b.satirlar.length && b.hekim && <div style={{ fontSize: 14, fontWeight: 700 }}>{b.hekim}</div>}
          {b.diplomaNo && <div style={{ fontSize: 10.5, color: '#777' }}>Diploma No: {b.diplomaNo}</div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '4px 24px', fontSize: 12.5, lineHeight: 1.7 }}>
        <div><b>Hasta:</b> {h.adSoyad || '—'}</div>
        <div><b>Doğum tarihi:</b> {h.dogumTarihi ? `${trGun(h.dogumTarihi.slice(0, 10))}${yas ? ` (${yas})` : ''}` : '—'}</div>
        <div><b>Cinsiyet:</b> {h.cinsiyet || '—'}</div>
        <div><b>İstem tarihi:</b> {trGun(k.istem_tarihi || k.created_at)}</div>
        <div><b>Konsültasyon istenen branş:</b> {k.hedefEtiketi}</div>
        <div><b>Aciliyet:</b> {(['rutin', 'oncelikli', 'acil'] as const).map((a) => `${a === aciliyet ? '☒' : '☐'} ${ACILIYET_ETIKETI[a]}`).join('   ')}</div>
        {k.hedef_hekim && <div><b>Konsültan hekim:</b> {k.hedef_hekim}</div>}
        {h.veliSatiri && <div style={{ gridColumn: '1 / -1' }}><b>Veli / yasal temsilci:</b> ........................................................</div>}
      </div>

      <div style={H}>Konsültasyon nedeni (klinik soru)</div>
      <div style={KUTU}>{k.klinik_soru || k.not_metni || ''}</div>

      <div style={H}>Muhtemel / kesin tanılar</div>
      {k.tanilar ? <div style={KUTU}>{k.tanilar}</div> : bos(2)}

      <div style={H}>Hastanın mevcut durumu</div>
      {k.mevcut_durum ? <div style={KUTU}>{k.mevcut_durum}</div> : bos(3)}

      {k.klinik_soru && k.not_metni && (
        <>
          <div style={H}>Ek not</div>
          <div style={KUTU}>{k.not_metni}</div>
        </>
      )}

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ textAlign: 'center', fontSize: 12, minWidth: 220 }}>
          <div style={{ height: 48 }} />
          <div style={{ borderTop: '1px solid #333', paddingTop: 4 }}>{b.hekim || 'Dr.'}</div>
          <div style={{ color: '#555' }}>{b.brans}</div>
          <div style={{ color: '#555' }}>İstem yapan hekim · kaşe / imza</div>
        </div>
      </div>

      <div style={{ marginTop: 28, border: '1.5px solid #111', borderRadius: 4, padding: '10px 14px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Konsültan hekim yanıtı</div>
        <div style={{ fontSize: 11.5, color: '#444', marginBottom: 6 }}>Değerlendirme, bulgular ve öneriler:</div>
        {bos(7)}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 14, fontSize: 12 }}>
          <div>Yanıt tarihi: ....... / ....... / ...........</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ height: 40 }} />
            <div style={{ borderTop: '1px solid #333', paddingTop: 4 }}>Konsültan hekim · ad soyad, kaşe / imza</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 22, fontSize: 10.5, color: '#666', lineHeight: 1.5, borderTop: '1px solid #ddd', paddingTop: 8 }}>
        {SGK_DEGILDIR_NOTU}
      </div>
    </div>
  );
}
