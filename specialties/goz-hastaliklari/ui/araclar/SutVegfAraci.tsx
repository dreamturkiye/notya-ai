'use client';
/**
 * ARACLAR-CILA-01: ortak araç kütüphanesiyle yenilendi — göz/basamak segment, manşet engel sayısı, katlanır dipnotlar, taslak rozeti.
 * GOZ-EXCEPTIONAL-01 — Araçlar › SUT anti-VEGF kapı. Chapter motoru (engines/antiVegf.sgkKapilari) ile birebir aynı kural;
 * geçmiş elle (taslak satırlar) veya hekimin kendi hastasından (/api/doktor/goz — doctor_id kapsamlı) yüklenir. Doz yok.
 */
import React, { useState } from 'react';
import { sgkKapilari, yuklemeTakvimi, sonrakiDoz, AJAN_ADI, ENDIKASYON_ADI, type Ajan, type Endikasyon, type Enjeksiyon } from '../../engines/antiVegf';
import { GOZ_KAYNAKLAR } from '../../protocols/sources';
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { gozStil, Secim, Segment, Alan, Onay, Istatistik, Katlanir, Rozet, TaslakNotu, GozHastaSecici } from './GozAracKabugu';

const { kutu, etiket, kucuk, metin, satir, input, btn, ghost, kaydir } = gozStil;
const bugun = () => new Date().toISOString().slice(0, 10);
const GOZ: Array<[string, string]> = [['sag', 'OD (sağ)'], ['sol', 'OS (sol)']];

export default function SutVegfAraci() {
  const [ajan, setAjan] = useState<Ajan>('bevacizumab');
  const [end, setEnd] = useState<Endikasyon>('ybmd');
  const [goz, setGoz] = useState<'sag' | 'sol'>('sag');
  const [tarih, setTarih] = useState(bugun());
  const [basamak, setBasamak] = useState<'muayenehane' | '2' | '3'>('3');
  const [mi, setMi] = useState(false);
  const [gecmis, setGecmis] = useState<Enjeksiyon[]>([]);
  const [hasta, setHasta] = useState<{ id: string; ad: string }>({ id: '', ad: '' });
  const [mesaj, setMesaj] = useState('');

  const hastadanYukle = async (id: string, ad: string) => {
    setHasta({ id, ad }); setMesaj('');
    if (!id) { setGecmis([]); return; }
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch(`/api/doktor/goz?patientId=${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Hasta verisi yüklenemedi');
      const liste = (j.enjeksiyonlar || []) as Enjeksiyon[];
      setGecmis(liste);
      setMesaj(liste.length ? `${liste.length} enjeksiyon kaydı yüklendi.` : 'Bu hastada kayıtlı enjeksiyon yok.');
    } catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); }
  };

  const kapi = sgkKapilari({ ajan, goz, tarih, basamak, gecmis, son3AydaMiVeyaSvo: mi });
  const takvim = yuklemeTakvimi(tarih, ajan, end);
  const sira = sonrakiDoz(gecmis, goz, tarih);
  const satirGuncelle = (i: number, p: Partial<Enjeksiyon>) => setGecmis((g) => g.map((x, j) => (j === i ? { ...x, ...p } : x)));

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Planlanan uygulama</div>
        <div style={satir}>
          <Secim etiket="Ajan" deger={ajan} set={(x) => setAjan(x as Ajan)} secenekler={Object.entries(AJAN_ADI)} />
          <Secim etiket="Endikasyon" deger={end} set={(x) => setEnd(x as Endikasyon)} secenekler={Object.entries(ENDIKASYON_ADI)} />
          <input type="date" aria-label="Uygulama tarihi" value={tarih} onChange={(e) => setTarih(e.target.value || bugun())} style={{ ...input, width: 180 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
          <Alan etiket="Göz">
            <Segment etiket="Göz" deger={goz} set={(x) => setGoz(x as 'sag' | 'sol')} secenekler={GOZ as Array<[string, string]>} />
          </Alan>
          <Alan etiket="Basamak" ipucu="Muayenehane SGK basamağı değildir — ödeme kapısı uygulanmaz.">
            <Segment etiket="Basamak" deger={basamak} set={(x) => setBasamak(x as 'muayenehane' | '2' | '3')} secenekler={[['3', '3. basamak'], ['2', '2. basamak'], ['muayenehane', 'Muayenehane']]} />
          </Alan>
        </div>
        <div style={satir}>
          <Onay ad="Son 3 ayda MI / SVO" deger={mi} set={setMi} aciklama="SUT 4.2.33 uyarı maddesi — karar hekimindir." />
        </div>
      </div>

      <div style={kutu}>
        <div style={etiket}>Enjeksiyon geçmişi</div>
        <div style={kucuk}>Hastayı seçerseniz kayıtlı enjeksiyonlar yüklenir; seçmeden aşağıya elle satır ekleyebilirsiniz.</div>
        <GozHastaSecici secili={hasta.id} sec={hastadanYukle} />
        {mesaj && <div style={{ ...kucuk, marginTop: 6, color: '#2DD4BF' }}>{mesaj}</div>}
        {hasta.id && <div style={{ marginTop: 6 }}><a href={hastaDosyaHref(hasta.id, 'goz')} style={{ color: '#2DD4BF', fontSize: 13, fontWeight: 700 }}>Hastada aç (Göz) →</a></div>}
        <div style={kaydir}>
        {gecmis.map((e, i) => (
          <div key={e.id || i} style={{ ...satir, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
            <input type="date" aria-label="Geçmiş tarih" value={e.tarih} onChange={(x) => satirGuncelle(i, { tarih: x.target.value })} style={{ ...input, width: 170 }} />
            <Secim etiket="Geçmiş göz" deger={e.goz} set={(x) => satirGuncelle(i, { goz: x as 'sag' | 'sol' })} secenekler={GOZ} />
            <Secim etiket="Geçmiş ajan" deger={e.ajan} set={(x) => satirGuncelle(i, { ajan: x as Ajan })} secenekler={Object.entries(AJAN_ADI)} />
            <Secim etiket="Faz" deger={e.faz} set={(x) => satirGuncelle(i, { faz: x as 'yukleme' | 'idame' })} secenekler={[['yukleme', 'Yükleme'], ['idame', 'İdame']]} />
            <Secim etiket="Durum" deger={e.durum} set={(x) => satirGuncelle(i, { durum: x as Enjeksiyon['durum'] })} secenekler={[['yapildi', 'Yapıldı'], ['planli', 'Planlı'], ['iptal', 'İptal']]} />
            <button type="button" onClick={() => setGecmis((g) => g.filter((_, j) => j !== i))} style={ghost}>Sil</button>
          </div>
        ))}
        </div>
        <div style={satir}><button type="button" onClick={() => setGecmis((g) => [...g, { goz, ajan: 'bevacizumab', endikasyon: end, faz: 'yukleme', dozNo: null, tarih: bugun(), durum: 'yapildi' }])} style={ghost}>+ Geçmiş enjeksiyon</button></div>
      </div>

      <div style={kutu} aria-live="polite">
        <div style={etiket}>SUT 4.2.33 sonucu</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '4px 0 10px' }}>
          <Istatistik deger={kapi.engeller.length} etiket="ödeme engeli" ton={kapi.engeller.length ? 'kirmizi' : 'iyi'} />
          <Istatistik deger={kapi.uyarilar.length} etiket="uyarı" ton={kapi.uyarilar.length ? 'uyari' : 'notr'} />
          <Istatistik deger={gecmis.length} etiket="geçmiş enjeksiyon" />
        </div>
        <div style={{ ...metin, fontWeight: 700, color: kapi.engeller.length ? '#F87171' : kapi.odenebilir === null ? '#FBBF24' : '#2DD4BF' }}>
          {kapi.engeller.length ? 'SGK ödeme engeli var' : kapi.odenebilir === null ? 'Muayenehane — SGK basamağı değil (uyarıları okuyun)' : 'SUT kapılarında engel yok'}
        </div>
        {kapi.engeller.map((x) => <div key={x} style={{ ...metin, color: '#F87171' }}>✕ {x}</div>)}
        {kapi.uyarilar.map((x) => <div key={x} style={{ ...metin, color: '#FBBF24' }}>⚠ {x}</div>)}
        <div style={{ ...metin, marginTop: 8 }}>{goz === 'sag' ? 'OD' : 'OS'} sıradaki doz: {sira.not}{sira.enErken ? ` — pencere ${sira.enErken} → ${sira.enGec}` : ''}</div>
        {takvim.length > 0 && <div style={{ ...metin, marginTop: 4 }}>Yükleme takvimi taslağı: {takvim.map((t) => `${t.dozNo}. doz ${t.enErken === t.enGec ? t.enErken : `${t.enErken}–${t.enGec}`}`).join(' · ')}</div>}
        <Katlanir baslik={`SUT dayanakları (${kapi.dipnotlar.length})`}>
          <div style={{ ...kucuk, borderLeft: '2px solid rgba(15,155,142,0.5)', paddingLeft: 8 }}>
            {kapi.dipnotlar.map((d, i) => <div key={i}><b>{d.ref}</b> — {d.not} <span style={{ opacity: 0.7 }}>({GOZ_KAYNAKLAR[d.ref]?.ad})</span></div>)}
          </div>
        </Katlanir>
        {!gecmis.length && !hasta.id && <div style={{ ...satir }}><Rozet ton="uyari">geçmiş girilmedi — aralık / geçiş kuralları değerlendirilmez</Rozet></div>}
        {hasta.id && <div style={satir}><a href={hastaDosyaHref(hasta.id, 'goz')} style={{ ...btn, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Enjeksiyonu hastada kaydet →</a></div>}
        <TaslakNotu>Ödeme kuralı kontrolüdür; enjeksiyon kararı, idame aralığı ve doz hekimindir. Nota otomatik yazılmaz.</TaslakNotu>
      </div>
    </>
  );
}
