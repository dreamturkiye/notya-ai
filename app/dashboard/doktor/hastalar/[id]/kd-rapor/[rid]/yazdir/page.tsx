'use client';
/**
 * KD-RAPOR-01 — obstetric USG / gynaecological USG / NST report on the doctor's letterhead (A4), with the doctor's STORED
 * title (OP-DR-01). KD only (the reports exist only for a KD doctor). Computations: the same pure engines as the form.
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { AntetliKagit, KAGIT, type Antet } from '@/components/doktor/yazdir/AntetliKagit';
import { ANATOMI_ALANLARI, BOS_JINEKOLOJIK_USG, BOS_OBSTETRIK_USG, USG_ETIKET, type JinekolojikUsg, type ObstetrikUsg } from '@/specialties/kadin-dogum/engines/usgRaporu';
import { BOS_NST, type NstGirdi } from '@/specialties/kadin-dogum/engines/nstKtg';
import { JinekolojikUsgSonucu, NstSonucu, ObstetrikUsgSonucu } from '@/specialties/kadin-dogum/ui/KdRaporlar';

type Veri = { rapor: { id: string; tur: 'usg_obstetrik' | 'usg_jinekolojik' | 'nst'; rapor_tarihi: string; veri: Record<string, unknown> }; baslik: Antet };
const BASLIK = { usg_obstetrik: 'OBSTETRİK ULTRASONOGRAFİ RAPORU', usg_jinekolojik: 'JİNEKOLOJİK ULTRASONOGRAFİ RAPORU', nst: 'NST / KARDİYOTOKOGRAFİ RAPORU' } as const;
const d = (x: unknown, b = '') => (x === null || x === undefined || x === '' ? '—' : `${x}${b}`);

function Tablo({ satirlar }: { satirlar: Array<[string, string]> }) {
  return <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>{satirlar.map(([a, b]) => <tr key={a}><td style={{ ...KAGIT.TD, width: '40%' }}><b>{a}</b></td><td style={KAGIT.TD}>{b}</td></tr>)}</tbody></table>;
}

export default function KdRaporYazdir() {
  const p = useParams<{ id: string; rid: string }>();
  const [v, setV] = useState<Veri | null>(null);
  const [hata, setHata] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const t = await ensureDoctorAccessToken();
        const r = await fetch(`/api/doktor/kd-raporlari?patientId=${encodeURIComponent(p.id)}&id=${encodeURIComponent(p.rid)}`, { headers: { Authorization: `Bearer ${t}` } });
        const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Yüklenemedi'); setV(j);
      } catch (e) { setHata(e instanceof Error ? e.message : 'Yüklenemedi'); }
    })();
  }, [p.id, p.rid]);
  if (hata) return <div style={{ padding: 24, fontFamily: 'system-ui' }}>{hata}</div>;
  if (!v) return <div style={{ padding: 24, fontFamily: 'system-ui', color: '#666' }}>Yükleniyor…</div>;
  const r = v.rapor;
  let icerik: React.ReactNode = null;
  if (r.tur === 'usg_obstetrik') {
    const o = { ...BOS_OBSTETRIK_USG, ...(r.veri as ObstetrikUsg) };
    icerik = (<>
      <div style={KAGIT.H}>Genel</div>
      <Tablo satirlar={[['Gebelik haftası', o.haftaGun.hafta != null ? `${o.haftaGun.hafta} hf ${o.haftaGun.gun ?? 0} g` : '—'], ['Fetüs sayısı', d(o.fetusSayisi)], ['FKH', d(o.fkh, '/dk')], ['Prezentasyon', o.prezentasyon ? USG_ETIKET.prezentasyon[o.prezentasyon] : '—'], ['Plasenta', `${o.plasentaYeri ? USG_ETIKET.plasenta[o.plasentaYeri] : '—'}${o.plasentaNot ? ` — ${o.plasentaNot}` : ''}`], ['AFI / en derin cep', `${d(o.afiCm, ' cm')} / ${d(o.dvpCm, ' cm')}`]]} />
      <div style={KAGIT.H}>Biyometri</div>
      <Tablo satirlar={[['CRL', d(o.crlMm, ' mm')], ['BPD', d(o.bpdMm, ' mm')], ['HC', d(o.hcMm, ' mm')], ['AC', d(o.acMm, ' mm')], ['FL', d(o.flMm, ' mm')]]} />
      <div style={KAGIT.H}>Doppler</div>
      <Tablo satirlar={[['UA PI / RI', `${d(o.uaPi)} / ${d(o.uaRi)}`], ['UA diyastol sonu akım', o.uaEdf ? USG_ETIKET.uaEdf[o.uaEdf] : '—'], ['MCA PI / PSV', `${d(o.mcaPi)} / ${d(o.mcaPsv, ' cm/sn')}`], ['Uterin arter PI (sağ / sol)', `${d(o.uterinPiSag)} / ${d(o.uterinPiSol)}`]]} />
      {(o.ntMm != null || o.nazalKemik) && (<><div style={KAGIT.H}>NT</div><Tablo satirlar={[['NT', d(o.ntMm, ' mm')], ['Nazal kemik', o.nazalKemik || '—']]} /></>)}
      {Object.keys(o.anatomi || {}).length > 0 && (<><div style={KAGIT.H}>Anatomi</div><Tablo satirlar={ANATOMI_ALANLARI.filter((a) => o.anatomi[a]).map((a) => [USG_ETIKET.anatomi[a], USG_ETIKET.anatomiDurum[o.anatomi[a]!]])} /></>)}
      <div style={KAGIT.H}>Hesaplanan değerler</div><ObstetrikUsgSonucu v={o} />
      {o.sonuc && (<><div style={KAGIT.H}>Sonuç</div><p style={KAGIT.P}>{o.sonuc}</p></>)}
    </>);
  } else if (r.tur === 'usg_jinekolojik') {
    const j = { ...BOS_JINEKOLOJIK_USG, ...(r.veri as JinekolojikUsg) };
    const uc = (x: (number | null)[]) => (x.some((n) => n != null) ? `${x.map((n) => n ?? '—').join(' × ')} mm` : '—');
    icerik = (<>
      <Tablo satirlar={[['Yol', j.yol || '—'], ['Menopoz', j.menopoz ? 'Postmenopozal' : '—'], ['Uterus', `${uc([j.uterusUzunlukMm, j.uterusApMm, j.uterusGenislikMm])}${j.uterusPozisyon ? ` · ${j.uterusPozisyon}` : ''}`], ['Endometrium', `${d(j.endometriumMm, ' mm')}${j.endometriumNot ? ` — ${j.endometriumNot}` : ''}`], ['Sağ over', `${uc(j.overSag)}${j.overSagNot ? ` — ${j.overSagNot}` : ''}`], ['Sol over', `${uc(j.overSol)}${j.overSolNot ? ` — ${j.overSolNot}` : ''}`], ['Serbest sıvı', j.serbestSivi || '—']]} />
      {j.lezyonlar.length > 0 && (<><div style={KAGIT.H}>Lezyonlar</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>{['Yer', 'Tür', 'Boyut', 'FIGO', 'O-RADS', 'Açıklama'].map((h) => <th key={h} style={KAGIT.TH}>{h}</th>)}</tr></thead>
          <tbody>{j.lezyonlar.map((l, i) => <tr key={i}><td style={KAGIT.TD}>{USG_ETIKET.lezyonYer[l.yer] || '—'}</td><td style={KAGIT.TD}>{USG_ETIKET.lezyonTur[l.tur] || '—'}</td><td style={KAGIT.TD}>{uc(l.boyutMm)}</td><td style={KAGIT.TD}>{l.figo || '—'}</td><td style={KAGIT.TD}>{l.orads || '—'}</td><td style={KAGIT.TD}>{l.aciklama || '—'}</td></tr>)}</tbody></table></>)}
      <div style={KAGIT.H}>Hesaplanan değerler</div><JinekolojikUsgSonucu v={j} />
      {j.sonuc && (<><div style={KAGIT.H}>Sonuç</div><p style={KAGIT.P}>{j.sonuc}</p></>)}
    </>);
  } else {
    const n = { ...BOS_NST, ...(r.veri as NstGirdi) };
    icerik = (<>
      <Tablo satirlar={[['Tarih / saat', `${n.tarih} ${n.saat}`], ['Gebelik haftası', d(n.haftaGun.hafta, ' hf')], ['Süre', d(n.sureDk, ' dk')], ['Bazal FKH', d(n.bazalFkh, '/dk')], ['Varyabilite', d(n.varyabiliteBpm, ' vuru/dk')], ['Akselerasyon (20 dk)', d(n.akselerasyon20dk)], ['Deselerasyon (erken / geç / değişken / uzamış)', `${n.erkenDes ?? 0} / ${n.gecDes ?? 0} / ${n.degiskenDes ?? 0} / ${n.uzamisDes ?? 0}${n.tekrarlayan ? ' — tekrarlayan' : ''}`], ['Kontraksiyon', d(n.kontraksiyon10dk, ' / 10 dk')]]} />
      <div style={KAGIT.H}>Sınıflama</div><NstSonucu v={n} />
      {n.sonuc && (<><div style={KAGIT.H}>Yorum / plan</div><p style={KAGIT.P}>{n.sonuc}</p></>)}
    </>);
  }
  return (
    <AntetliKagit baslik={BASLIK[r.tur]} antet={v.baslik} geriHref={`/dashboard/doktor/hastalar/${p.id}?tab=gebelik`} geriEtiket="Kadın Sağlığı & Gebelik" tarih={r.rapor_tarihi}
      belge={{ tur: r.tur === 'nst' ? 'nst' : r.tur === 'usg_obstetrik' ? 'usg_obstetrik' : 'usg_jinekolojik', kaynakId: p.rid, hastaId: p.id, icerik: { veri: r.veri, tarih: r.rapor_tarihi } }}
      altBilgi="Hesaplanan değerler yayımlanmış referanslara dayanır (INTERGROWTH-21st, Hadlock, Mari 2000, Gramellini 1992, SMFM/ACOG, FIGO 2015, ACOG PB 229); klinik yorum ve karar hekimindir.">
      {icerik}
    </AntetliKagit>
  );
}
