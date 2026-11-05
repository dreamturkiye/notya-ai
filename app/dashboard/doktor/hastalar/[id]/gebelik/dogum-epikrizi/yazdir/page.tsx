'use client';
/**
 * KD-RAPOR-01 — DOĞUM EPİKRİZİ (delivery discharge summary) on the doctor's letterhead, with the STORED title (OP-DR-01).
 * Built only from data already recorded: the pregnancy + delivery spine, the caesarean's operation note (when linked),
 * the patient's active medicines (specialties/kadin-dogum/engines/dogumEpikrizi.ts). KD only: reachable from the KD
 * reports panel, and every read is the doctor's own (each API checks the patient first).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { AntetliKagit, KAGIT, type Antet } from '@/components/doktor/yazdir/AntetliKagit';
import { dogumEpikriziKur, type EpikrizGirdi } from '@/specialties/kadin-dogum/engines/dogumEpikrizi';
import type { AmeliyatNotuVeri } from '@/lib/doktor/ameliyatNotu';

type Ham = { gebelik: EpikrizGirdi['gebelik'] & { id: string }; baslik: Antet; dogum: (EpikrizGirdi['dogum'] & { id: string }) | null; bebekler: EpikrizGirdi['bebekler']; komplikasyonlar: EpikrizGirdi['komplikasyonlar']; ilaclar: EpikrizGirdi['ilaclar']; not: AmeliyatNotuVeri | null };

export default function DogumEpikriziYazdir() {
  const p = useParams<{ id: string }>();
  const [ham, setHam] = useState<Ham | null>(null);
  const [hata, setHata] = useState('');
  const [emziriyor, setEmziriyor] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const t = await ensureDoctorAccessToken();
        const h = { headers: { Authorization: `Bearer ${t}` } };
        const g = await fetch(`/api/doktor/gebelik?patientId=${encodeURIComponent(p.id)}`, h).then((r) => r.json());
        if (!g?.gebelik) throw new Error('Bu hastada doğum kaydı olan bir gebelik yok.');
        const [dg, an, il] = await Promise.all([
          fetch(`/api/doktor/gebelik/dogum?gebelikId=${encodeURIComponent(g.gebelik.id)}`, h).then((r) => r.json()),
          fetch(`/api/doktor/ameliyat-notlari?patientId=${encodeURIComponent(p.id)}`, h).then((r) => (r.ok ? r.json() : { notlar: [] })),
          fetch(`/api/doktor/ilaclar?hastaId=${encodeURIComponent(p.id)}`, h).then((r) => (r.ok ? r.json() : {})) as Promise<unknown[] | { ilaclar?: unknown[]; data?: unknown[] }>,
        ]);
        if (!dg?.dogum?.dogum_zamani) throw new Error('Doğum henüz kaydedilmedi (Doğum sekmesi → Doğumu kaydet).');
        const not = ((an?.notlar || []) as Array<{ dogum_id: string | null; veri: AmeliyatNotuVeri }>).find((n) => n.dogum_id === dg.dogum.id)?.veri || null;
        const ilacListesi = (Array.isArray(il) ? il : il?.ilaclar || il?.data || []) as Array<{ ilac_adi: string; doz?: string; kullanim_sikli?: string; aktif?: boolean; onay_durumu?: string }>;
        setHam({ gebelik: g.gebelik, baslik: g.baslik, dogum: dg.dogum, bebekler: dg.bebekler || [], komplikasyonlar: dg.komplikasyonlar || [], ilaclar: ilacListesi.filter((x) => x.aktif !== false && x.onay_durumu !== 'reddedildi'), not });
      } catch (e) { setHata(e instanceof Error ? e.message : 'Yüklenemedi'); }
    })();
  }, [p.id]);
  const e = useMemo(() => (ham ? dogumEpikriziKur({ gebelik: ham.gebelik, dogum: ham.dogum, bebekler: ham.bebekler, komplikasyonlar: ham.komplikasyonlar, ilaclar: ham.ilaclar, emziriyor, ameliyatNotu: ham.not ? { kanKaybiMl: ham.not.kanKaybiMl, komplikasyon: ham.not.komplikasyon, postopOrderlar: ham.not.postopOrderlar, islem: ham.not.islem } : null }) : null), [ham, emziriyor]);
  if (hata) return <div style={{ padding: 24, fontFamily: 'system-ui' }}>{hata} <a href={`/dashboard/doktor/hastalar/${p.id}?tab=gebelik`}>← Gebelik</a></div>;
  if (!ham || !e) return <div style={{ padding: 24, fontFamily: 'system-ui', color: '#666' }}>Yükleniyor…</div>;
  const KAN_KAYNAK = { ameliyat_notu: 'ameliyat notu', pph_kaydi: 'PPH kaydı', intraop_kaydi: 'intraoperatif kayıt' } as const;
  return (
    <AntetliKagit baslik="DOĞUM EPİKRİZİ" antet={ham.baslik} geriHref={`/dashboard/doktor/hastalar/${p.id}?tab=gebelik`} geriEtiket="Kadın Sağlığı & Gebelik"
      altBilgi="Kaynak: T.C. Sağlık Bakanlığı Doğum Sonu Bakım Yönetim Rehberi (lohusa izlemleri); WHO postnatal care recommendations (2022); WHO MEC (kontrasepsiyon). Klinik veriler hekimin kaydından alınmıştır.">
      <div className="yazdirma-gizle" style={{ fontFamily: 'system-ui', fontSize: 13, margin: '6px 0 10px' }}>
        <label><input type="checkbox" checked={emziriyor} onChange={(x) => setEmziriyor(x.target.checked)} /> Emziriyor (kontrasepsiyon önerisi buna göre)</label>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>
        <tr><td style={KAGIT.TD}><b>Doğum şekli</b></td><td style={KAGIT.TD}>{e.sekil}</td><td style={KAGIT.TD}><b>Doğum tarihi</b></td><td style={KAGIT.TD}>{e.dogumZamani ? new Date(e.dogumZamani).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }) : '—'}</td></tr>
        <tr><td style={KAGIT.TD}><b>Gebelik haftası</b></td><td style={KAGIT.TD}>{e.hafta}</td><td style={KAGIT.TD}><b>Tahmini kan kaybı</b></td><td style={KAGIT.TD}>{e.kanKaybi.ml != null ? `${e.kanKaybi.ml} mL (${KAN_KAYNAK[e.kanKaybi.kaynak!]})` : '—'}</td></tr>
        {e.sezaryenMi && <tr><td style={KAGIT.TD}><b>Sezaryen endikasyonu</b></td><td style={KAGIT.TD} colSpan={3}>{e.endikasyon}</td></tr>}
        {ham.gebelik?.kan_grubu ? <tr><td style={KAGIT.TD}><b>Kan grubu</b></td><td style={KAGIT.TD} colSpan={3}>{ham.gebelik.kan_grubu}</td></tr> : null}
      </tbody></table>
      <div style={KAGIT.H}>Yenidoğan</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>{['Bebek', 'Cinsiyet', 'Ağırlık', 'Apgar 1 / 5', 'Durum'].map((h) => <th key={h} style={KAGIT.TH}>{h}</th>)}</tr></thead>
        <tbody>{e.bebekler.length ? e.bebekler.map((b) => <tr key={b.sira}><td style={KAGIT.TD}>{b.sira}</td><td style={KAGIT.TD}>{b.cinsiyet}</td><td style={KAGIT.TD}>{b.kilo}</td><td style={KAGIT.TD}>{b.apgar}</td><td style={KAGIT.TD}>{b.durum}</td></tr>) : <tr><td style={KAGIT.TD} colSpan={5}>—</td></tr>}</tbody></table>
      <div style={KAGIT.H}>Komplikasyonlar</div>
      <p style={KAGIT.P}>{e.anneKomplikasyonlari.length ? e.anneKomplikasyonlari.join('\n') : 'Kayıtlı komplikasyon yok.'}</p>
      <div style={KAGIT.H}>Kullanılan / önerilen ilaçlar</div>
      <p style={KAGIT.P}>{e.ilaclar.length ? e.ilaclar.join('\n') : '—'}</p>
      <div style={KAGIT.H}>Taburculuk önerileri</div>
      <ul style={{ fontSize: 12, margin: 0, paddingLeft: 18 }}>{e.talimatlar.map((t) => <li key={t}>{t}</li>)}</ul>
      <div style={KAGIT.H}>Kontrol (lohusa izlemleri)</div>
      <ul style={{ fontSize: 12, margin: 0, paddingLeft: 18 }}>{e.kontroller.map((k) => <li key={k.ad}>{k.ad}: {k.tarihAraligi}</li>)}</ul>
      <div style={KAGIT.H}>Kontrasepsiyon önerisi</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>{e.kontrasepsiyon.map((k) => <tr key={k.yontem}><td style={KAGIT.TD}>{k.yontem}</td><td style={KAGIT.TD}>{k.baslangic}</td><td style={KAGIT.TD}>{k.not}</td></tr>)}</tbody></table>
      <div style={KAGIT.H}>Hemen başvurmanız gereken durumlar</div>
      <ul style={{ fontSize: 12, margin: 0, paddingLeft: 18 }}>{e.tehlikeIsaretleri.map((t) => <li key={t}>{t}</li>)}</ul>
      <p style={{ ...KAGIT.P, marginTop: 8 }}><b>Acil durumda 112&apos;yi arayın.</b></p>
    </AntetliKagit>
  );
}
