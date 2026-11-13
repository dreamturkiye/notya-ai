'use client';
/**
 * PREMATURE-MODUL — Kadın Hastalıkları ve Doğum › Erken doğum risk paneli.
 * Serviks uzunluğu günlüğü ve trendi, önceki erken doğum öyküsü, PPROM, antenatal steroid kürleri, magnezyum, progesteron olgusu.
 * KARAR DESTEĞİ: panel yalnız yayımlanmış ölçütlerin "karşılandı / karşılanmadı / belirsiz" göstergesini ve hekimin kaydını gösterir;
 * doz, ilaç, serklaj ya da sevk ÖNERMEZ ve hastaya mesaj üretmez. Her gösterge kaynağını ve kaynağın doğrulama düzeyini taşır.
 * /api/doktor/gebelik/erken-dogum (yalnız KD hekimi; doctor_id kapsamlı).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { kdStil, KdHastaSecici, Rozet, TaslakNotu, Katlanir, KopyalaButonu, useUrlHasta } from './KdAracKabugu';
import { gestasyonCoz, gestasyonMetni } from '../../engines/erkenDogum';
import type { Bayrak, BayrakDurum, ErkenDogumKaydi, ErkenDogumSonuc, Kaynak, KaynakDurumu, Yontem } from '../../engines/erkenDogum';

const { kutu, etiket, kucuk, metin, input, btn, ghost, hata: hataStil, uyari } = kdStil;

interface Cevap {
  gebelikVar: boolean
  gebelikId?: string
  sat?: string | null
  tdt?: string | null
  cogulTipi?: string | null
  kayit: ErkenDogumKaydi
  sonuc?: ErkenDogumSonuc
  bugun: string
}

const DURUM: Record<BayrakDurum, { ad: string; ton: 'iyi' | 'uyari' | 'kirmizi' | 'notr' | 'bilgi' }> = {
  karsilandi: { ad: 'kriter karşılandı', ton: 'uyari' }, karsilanmadi: { ad: 'kriter karşılanmadı', ton: 'notr' }, belirsiz: { ad: 'veri eksik', ton: 'bilgi' },
};
const KAYNAK_DURUM: Record<KaynakDurumu, string> = {
  'birincil-okundu': 'birincil metinden okundu',
  'ikincil-ozet': 'güvenilir bir özetten okundu — birincil metin okunamadı, hekim teyit eder',
  dogrulanmadi: 'yalnız künye — içeriği okunmadı, eşik üretilmez',
};
const tarihTr = (iso: string) => iso.split('-').reverse().join('.');
const tri = (v: boolean | null) => (v === true ? 'evet' : v === false ? 'hayir' : '');
const triCoz = (s: string): boolean | null => (s === 'evet' ? true : s === 'hayir' ? false : null);

function KaynakListesi({ kaynaklar }: { kaynaklar: Kaynak[] }) {
  return (
    <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
      {kaynaklar.map((k) => (
        <div key={k.kisa} style={kucuk}>
          <b>{k.kisa}</b> — {k.tam}
          <div><Rozet ton={k.durum === 'birincil-okundu' ? 'iyi' : k.durum === 'ikincil-ozet' ? 'uyari' : 'notr'}>{KAYNAK_DURUM[k.durum]}</Rozet>{k.not ? ` ${k.not}` : ''}</div>
        </div>
      ))}
    </div>
  );
}

function Tri({ ad, deger, set }: { ad: string; deger: boolean | null; set: (v: boolean | null) => void }) {
  return (
    <label style={{ ...metin, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', minHeight: 44 }}>
      <span style={{ flex: '1 1 220px' }}>{ad}</span>
      <select aria-label={ad} value={tri(deger)} onChange={(e) => set(triCoz(e.target.value))} style={{ ...input, width: 'auto', minWidth: 120 }}>
        <option value="">girilmedi</option><option value="evet">evet</option><option value="hayir">hayır</option>
      </select>
    </label>
  );
}

function BayrakKarti({ b }: { b: Bayrak }) {
  const d = DURUM[b.durum];
  return (
    <div style={{ borderTop: '1px solid rgba(58,44,34,0.12)', padding: '10px 0' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ ...metin, fontWeight: 700 }}>{b.baslik}</span>
        <Rozet ton={d.ton}>{d.ad}</Rozet>
      </div>
      <ul style={{ ...kucuk, margin: '6px 0 0', paddingLeft: 18 }}>{b.gerekce.map((g) => <li key={g}>{g}</li>)}</ul>
      <Katlanir baslik="Kaynak ve doğrulama düzeyi"><KaynakListesi kaynaklar={b.kaynaklar} /></Katlanir>
    </div>
  );
}

export default function ErkenDogumPaneli() {
  const [hastaId, setHastaId] = useState('');
  useUrlHasta(setHastaId);
  const [c, setC] = useState<Cevap | null>(null);
  const [kayit, setKayit] = useState<ErkenDogumKaydi | null>(null);
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [kirli, setKirli] = useState(false);
  const [yeni, setYeni] = useState<{ tarih: string; hf: string; mm: string; yontem: Yontem }>({ tarih: '', hf: '', mm: '', yontem: 'transvajinal' });
  const [yeniKur, setYeniKur] = useState('');

  const uygula = useCallback((j: Cevap) => { setC(j); setKayit(j.kayit); setKirli(false); }, []);

  useEffect(() => {
    if (!hastaId) { setC(null); setKayit(null); return; }
    let iptal = false;
    setHata(''); setYukleniyor(true);
    (async () => {
      try {
        const t = await getAccessTokenAsync();
        const r = await fetch(`/api/doktor/gebelik/erken-dogum?patientId=${encodeURIComponent(hastaId)}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || 'Panel yüklenemedi');
        if (!iptal) uygula(j as Cevap);
      } catch (e) { if (!iptal) { setC(null); setHata(e instanceof Error ? e.message : 'Panel yüklenemedi'); } }
      finally { if (!iptal) setYukleniyor(false); }
    })();
    return () => { iptal = true; };
  }, [hastaId, uygula]);

  const degistir = (f: (k: ErkenDogumKaydi) => ErkenDogumKaydi) => { setKayit((k) => (k ? f(k) : k)); setKirli(true); };

  const kaydet = async () => {
    if (!kayit) return;
    setKaydediliyor(true); setHata('');
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/gebelik/erken-dogum', { method: 'PUT', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: hastaId, kayit }), cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Kaydedilemedi');
      uygula(j as Cevap);
    } catch (e) { setHata(e instanceof Error ? e.message : 'Kaydedilemedi'); }
    finally { setKaydediliyor(false); }
  };

  const olcumEkle = () => {
    const g = gestasyonCoz(yeni.hf);
    const mm = Number(yeni.mm.replace(',', '.'));
    if (!yeni.tarih || g == null || !Number.isFinite(mm) || mm <= 0) { setHata('Serviks ölçümü için tarih, gestasyon (örn. 22+3) ve uzunluk (mm) girin.'); return; }
    setHata('');
    degistir((k) => ({ ...k, serviks: [...k.serviks.filter((x) => !(x.tarih === yeni.tarih && x.yontem === yeni.yontem)), { id: `${yeni.tarih}-${yeni.yontem}`, tarih: yeni.tarih, gestasyonGun: g, mm, yontem: yeni.yontem }] }));
    setYeni({ tarih: '', hf: '', mm: '', yontem: yeni.yontem });
  };

  if (!hastaId) return (
    <>
      <div style={kutu}><div style={etiket}>Hasta</div><KdHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} /></div>
      <div style={{ ...kutu, ...kucuk, fontSize: 14 }}>Panel için aktif gebeliği olan bir hasta seçin — gestasyon, SAT / TDT kaydından hesaplanır.</div>
    </>
  );

  const sonuc = c?.sonuc;
  return (
    <>
      <div style={kutu}><div style={etiket}>Hasta</div><KdHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} /></div>
      {yukleniyor && !c && <div style={{ ...kutu, ...kucuk }}>Panel hazırlanıyor…</div>}
      {hata && <div style={{ ...kutu, ...hataStil }}>{hata}</div>}
      {c && !c.gebelikVar && <div style={{ ...kutu, ...uyari }}>Bu hastanın aktif gebelik kaydı yok — erken doğum paneli aktif gebelik üzerinde çalışır.</div>}
      {c && c.gebelikVar && kayit && sonuc && (
        <>
          <TaslakNotu>Karar desteğidir: panel yayımlanmış ölçütlerin karşılanıp karşılanmadığını gösterir; ilaç, doz, serklaj ya da sevk önermez ve hastaya mesaj göndermez. Karar hekimindir.</TaslakNotu>

          <div style={kutu}>
            <div style={etiket}>Gestasyon</div>
            <div style={{ ...metin, fontSize: 20, fontWeight: 700 }}>{gestasyonMetni(sonuc.gestasyonGun)} <span style={kucuk}>hf+gün · bugün</span></div>
            <div style={kucuk}>{c.sat ? `SAT ${tarihTr(c.sat)}` : 'SAT yok'}{c.tdt ? ` · TDT ${tarihTr(c.tdt)}` : ''}{c.cogulTipi && c.cogulTipi !== 'tekil' ? ' · çoğul gebelik' : ''}</div>
            {sonuc.eksikVeri.length > 0 && <div style={{ ...uyari, marginTop: 8 }}>Eksik veri: {sonuc.eksikVeri.join(' · ')}</div>}
          </div>

          <div style={kutu}>
            <div style={etiket}>Ölçüt göstergeleri</div>
            {sonuc.bayraklar.map((b) => <BayrakKarti key={b.kod} b={b} />)}
          </div>

          <div style={kutu}>
            <div style={etiket}>Serviks uzunluğu günlüğü</div>
            {sonuc.trend.length === 0 ? <div style={kucuk}>Henüz ölçüm yok.</div> : (
              <div style={kdStil.kaydir}>
                <table style={{ width: '100%', borderCollapse: 'collapse', ...metin }}>
                  <thead><tr style={{ textAlign: 'left' }}><th>Tarih</th><th>Gestasyon</th><th>mm</th><th>Yöntem</th><th>Önceki ölçüme göre</th><th /></tr></thead>
                  <tbody>
                    {sonuc.trend.map((t) => (
                      <tr key={t.id} style={{ borderTop: '1px solid rgba(58,44,34,0.12)' }}>
                        <td>{tarihTr(t.tarih)}</td><td>{t.gestasyon}{t.pencerede ? '' : ' *'}</td><td><b>{t.mm}</b></td>
                        <td>{t.yontem === 'transvajinal' ? 'transvajinal' : 'transabdominal'}</td>
                        <td>{t.fark == null ? '—' : `${t.fark > 0 ? '+' : ''}${String(t.fark).replace('.', ',')} mm / ${t.gunAralik} gün`}</td>
                        <td><button type="button" style={{ ...ghost, minHeight: 36 }} onClick={() => degistir((k) => ({ ...k, serviks: k.serviks.filter((x) => x.id !== t.id) }))} aria-label={`${tarihTr(t.tarih)} ölçümünü sil`}>Sil</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ ...kucuk, marginTop: 6 }}>* 16+0–24+0 haftalık tanım penceresi dışında. Kısalma hızı için yayımlanmış bir eşik olmadığından trend yalnız değerleri gösterir.</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, alignItems: 'flex-end' }}>
              <label style={kucuk}>Tarih<input type="date" aria-label="Ölçüm tarihi" max={c.bugun} value={yeni.tarih} onChange={(e) => setYeni({ ...yeni, tarih: e.target.value })} style={input} /></label>
              <label style={kucuk}>Gestasyon<input aria-label="Gestasyon (hf+gün)" placeholder="22+3" value={yeni.hf} onChange={(e) => setYeni({ ...yeni, hf: e.target.value })} style={{ ...input, width: 90 }} /></label>
              <label style={kucuk}>Uzunluk (mm)<input aria-label="Serviks uzunluğu (mm)" inputMode="decimal" value={yeni.mm} onChange={(e) => setYeni({ ...yeni, mm: e.target.value })} style={{ ...input, width: 90 }} /></label>
              <label style={kucuk}>Yöntem
                <select aria-label="Ölçüm yöntemi" value={yeni.yontem} onChange={(e) => setYeni({ ...yeni, yontem: e.target.value as Yontem })} style={{ ...input, width: 'auto' }}>
                  <option value="transvajinal">transvajinal</option><option value="transabdominal">transabdominal</option>
                </select>
              </label>
              <button type="button" style={ghost} onClick={olcumEkle}>Ölçümü ekle</button>
            </div>
          </div>

          <div style={kutu}>
            <div style={etiket}>Öykü ve uygulamalar (hekim kaydı)</div>
            <Tri ad="Önceki spontan erken doğum (< 37 hf)" deger={kayit.oncekiSpontanPreterm} set={(v) => degistir((k) => ({ ...k, oncekiSpontanPreterm: v }))} />
            <Tri ad="Preterm erken membran rüptürü (PPROM)" deger={kayit.pprom.var} set={(v) => degistir((k) => ({ ...k, pprom: { var: v, tarih: v ? k.pprom.tarih : null } }))} />
            {kayit.pprom.var && <label style={kucuk}>PPROM tarihi<input type="date" max={c.bugun} value={kayit.pprom.tarih || ''} onChange={(e) => degistir((k) => ({ ...k, pprom: { var: true, tarih: e.target.value || null } }))} style={input} /></label>}
            <Tri ad="Magnezyum sülfat (nöroproteksiyon) verildi" deger={kayit.magnezyum.verildi} set={(v) => degistir((k) => ({ ...k, magnezyum: { verildi: v, tarih: v ? k.magnezyum.tarih : null } }))} />
            {kayit.magnezyum.verildi && <label style={kucuk}>Magnezyum tarihi<input type="date" max={c.bugun} value={kayit.magnezyum.tarih || ''} onChange={(e) => degistir((k) => ({ ...k, magnezyum: { verildi: true, tarih: e.target.value || null } }))} style={input} /></label>}
            <Tri ad="Progesteron kullanıyor" deger={kayit.progesteron.kullaniyor} set={(v) => degistir((k) => ({ ...k, progesteron: { kullaniyor: v, baslangic: v ? k.progesteron.baslangic : null, yol: v ? k.progesteron.yol : null } }))} />
            {kayit.progesteron.kullaniyor && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <label style={kucuk}>Başlangıç<input type="date" max={c.bugun} value={kayit.progesteron.baslangic || ''} onChange={(e) => degistir((k) => ({ ...k, progesteron: { ...k.progesteron, baslangic: e.target.value || null } }))} style={input} /></label>
                <label style={kucuk}>Yol
                  <select aria-label="Progesteron yolu" value={kayit.progesteron.yol || ''} onChange={(e) => degistir((k) => ({ ...k, progesteron: { ...k.progesteron, yol: (e.target.value || null) as ErkenDogumKaydi['progesteron']['yol'] } }))} style={{ ...input, width: 'auto' }}>
                    <option value="">girilmedi</option><option value="vajinal">vajinal</option><option value="im">intramüsküler</option><option value="oral">oral</option>
                  </select>
                </label>
              </div>
            )}
            <div style={{ ...kucuk, marginTop: 4 }}>Doz kaydı tutulmaz; panel yalnız kullanımın olgusunu saklar.</div>
          </div>

          <div style={kutu}>
            <div style={etiket}>Antenatal kortikosteroid kürleri</div>
            <Tri ad="Antenatal steroid uygulandı" deger={kayit.steroid.yapildi} set={(v) => degistir((k) => ({ ...k, steroid: { ...k.steroid, yapildi: v } }))} />
            {sonuc.steroid.satirlar.map((s) => (
              <div key={s.tarih} style={{ ...metin, borderTop: '1px solid rgba(58,44,34,0.12)', padding: '8px 0', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <b>{tarihTr(s.tarih)}</b><span>{s.gestasyon} hf</span><span style={kucuk}>{s.aciklama}{s.oncekindenGun != null ? ` · önceki kürden ${s.oncekindenGun} gün sonra` : ''}</span>
                <button type="button" style={{ ...ghost, minHeight: 36 }} onClick={() => degistir((k) => ({ ...k, steroid: { ...k.steroid, kurlar: k.steroid.kurlar.filter((x) => x.tarih !== s.tarih) } }))} aria-label={`${tarihTr(s.tarih)} kürünü sil`}>Sil</button>
              </div>
            ))}
            {sonuc.steroid.guncel && <div style={{ ...kucuk, marginTop: 6 }}>Bugünkü gestasyon: {sonuc.steroid.guncel.aciklama}</div>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8, alignItems: 'flex-end' }}>
              <label style={kucuk}>Kür tarihi<input type="date" aria-label="Steroid kürü tarihi" max={c.bugun} value={yeniKur} onChange={(e) => setYeniKur(e.target.value)} style={input} /></label>
              <button type="button" style={ghost} onClick={() => { if (!yeniKur) return; degistir((k) => ({ ...k, steroid: { yapildi: true, kurlar: [...k.steroid.kurlar.filter((x) => x.tarih !== yeniKur), { id: yeniKur, tarih: yeniKur }] } })); setYeniKur(''); }}>Kür ekle</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <button type="button" style={btn} disabled={!kirli || kaydediliyor} onClick={kaydet}>{kaydediliyor ? 'Kaydediliyor…' : kirli ? 'Kaydet' : 'Kayıtlı'}</button>
            <KopyalaButonu metin={ozetMetni(sonuc)} etiket="Özeti kopyala" />
          </div>

          <Katlanir baslik="Tüm kaynaklar ve doğrulama düzeyleri"><KaynakListesi kaynaklar={sonuc.kaynaklar} /></Katlanir>
        </>
      )}
    </>
  );
}

function ozetMetni(s: ErkenDogumSonuc): string {
  const l = [`Erken doğum risk paneli — karar desteği, hekim onayıyla`, `Gestasyon ${gestasyonMetni(s.gestasyonGun)} hf+gün`];
  for (const b of s.bayraklar.filter((x) => x.durum === 'karsilandi')) l.push(`- ${b.baslik}: ${b.gerekce.join('; ')} (${b.kaynaklar.map((k) => k.kisa).join(', ')})`);
  for (const t of s.trend) l.push(`Serviks ${tarihTr(t.tarih)} ${t.gestasyon} hf: ${t.mm} mm (${t.yontem})`);
  return l.join('\n');
}
