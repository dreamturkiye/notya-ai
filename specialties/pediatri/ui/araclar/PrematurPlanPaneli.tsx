'use client';
/**
 * PREMATURE-MODUL — Pediatri › Prematüre takip planı paneli (araç sayfası ve hasta dosyası sekmesi aynı bileşeni kullanır).
 * /api/doktor/pediatri/prematur — plan türetilir (lib/clinical/prematur), hekimin işareti pedi_prematur_kayit'ta saklanır.
 * Karar desteğidir: kalemler hekimin onayladığı bir kontrol listesidir; hiçbir tetkik / sevk / ilaç otomatik istenmez, doz yoktur.
 * Her kalem kaynağını ve kaynağın doğrulama düzeyini gösterir; birincil metni okunamayan kaynak bunu açıkça söyler.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { pediStil, Katlanir, Rozet, TaslakNotu, KopyalaButonu, Istatistik } from './PediAracKabugu';
import { tarihGoster } from '../../engines/girdi';
import { duzeltilmisYasMetni, postmenstrualMetni } from '@/lib/clinical/prematur/duzeltilmisYas';
import type { TakipPlani, TakipOgesi, OgeGorunum, HekimDurumu } from '@/lib/clinical/prematur/takipPlani';
import type { Kaynak, KaynakDurumu, PrematurProfil } from '@/lib/clinical/prematur/protokol';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const { kutu, etiket, kucuk, input, btn, ghost, uyari, kirmizi } = pediStil;

interface Cevap {
  hasta: { id: string; dogumIso: string | null };
  dogumBilinmiyor?: boolean;
  profil: PrematurProfil;
  kart: { gestasyonHafta: number | null; dogumKiloGr: number | null; ozet: { steroidKuru?: boolean | null; pprom?: boolean | null; magnezyum?: boolean | null } | null };
  etkin: { gestasyon: string; gestasyonKaynagi: 'elle' | 'kd-taburcu' | null; dogumKiloGr: number | null; profil: PrematurProfil };
  plan: TakipPlani;
  bugun: string;
  protokol: { ad: string; surum: string; kapsam: { kaynak: string } };
}

const KATEGORI: Record<string, string> = { goz: 'Göz', beyin: 'Beyin', isitme: 'İşitme', akciger: 'Akciğer', kan: 'Kan', kemik: 'Kemik', enfeksiyon: 'Enfeksiyon' };
const GORUNUM: Record<OgeGorunum, { ad: string; ton: 'iyi' | 'uyari' | 'kirmizi' | 'notr' | 'bilgi' }> = {
  gecikti: { ad: 'gecikti', ton: 'kirmizi' }, 'zamani-geldi': { ad: 'zamanı geldi', ton: 'uyari' }, yaklasiyor: { ad: 'yaklaşıyor', ton: 'bilgi' },
  planli: { ad: 'planlı', ton: 'notr' }, 'kayit-eksik': { ad: 'kayıt eksik', ton: 'uyari' }, yapildi: { ad: 'yapıldı', ton: 'iyi' },
  uygulanmaz: { ad: 'uygulanmaz', ton: 'notr' }, 'kriter-disi': { ad: 'kriter karşılanmadı', ton: 'notr' }, bilgi: { ad: 'kriter karşılandı', ton: 'bilgi' }, 'veri-eksik': { ad: 'veri eksik', ton: 'uyari' },
};
const KAYNAK_DURUM: Record<KaynakDurumu, string> = {
  'birincil-okundu': 'birincil metinden okundu',
  'ikincil-ozet': 'güvenilir bir özetten okundu — birincil metin okunamadı, hekim teyit eder',
  dogrulanmadi: 'yalnız künye — içeriği okunmadı, tarih üretilmez',
};
const TRI: Array<[keyof PrematurProfil, string]> = [
  ['oksijen28Gun', '28. günde hâlâ oksijen / solunum desteği'], ['oksijen36Hafta', 'Postmenstrüel 36. haftada oksijen / destek'],
  ['hsKkh', 'Hemodinamik anlamlı doğumsal kalp hastalığı'], ['ototoksik5Gun', 'Aminoglikozid / vankomisin ≥ 5 gün'],
  ['degisimTransfuzyonu', 'Değişim transfüzyonu'], ['ecmo', 'ECMO'], ['ropSecili', 'ROP: GA > 32 hf / DA > 1500 g ama klinisyen riskli buluyor'],
];
const triDeger = (v: boolean | null | undefined) => (v === true ? 'evet' : v === false ? 'hayir' : '');
const triCoz = (s: string): boolean | null => (s === 'evet' ? true : s === 'hayir' ? false : null);

function PlanMetni(c: Cevap): string {
  const s = [`Prematüre takip planı (${c.protokol.ad}, ${c.protokol.surum}) — karar desteği, hekim onayıyla`, `Gestasyon ${c.etkin.gestasyon} hf${c.etkin.dogumKiloGr ? ` · doğum ağırlığı ${c.etkin.dogumKiloGr} g` : ''}`];
  const y = c.plan.yas;
  if (y.prematur) s.push(`Kronolojik yaş ${y.kronolojikAy} ay${y.buyume.duzeltilmis ? ` · ${duzeltilmisYasMetni(y, c.bugun)} (düzeltilmiş)` : ''} · postmenstrüel ${postmenstrualMetni(y)}`);
  for (const o of c.plan.ogeler.filter((x) => x.kriter.durum === 'karsilandi')) s.push(`- ${o.baslik}: ${o.etiket}${o.hedef ? ` (hedef ${tarihGoster(o.hedef)})` : ''} — ${GORUNUM[o.durum].ad}`);
  return s.join('\n');
}

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

export default function PrematurPlanPaneli({ patientId }: { patientId: string }) {
  const [c, setC] = useState<Cevap | null>(null);
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [form, setForm] = useState<{ hf: string; kilo: string; nicu: string } & Record<string, string>>({ hf: '', kilo: '', nicu: '' });
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const uygula = useCallback((j: Cevap) => {
    setC(j);
    const p = j.profil || {};
    setForm({
      hf: p.gestasyonHafta != null ? String(p.gestasyonHafta).replace('.', ',') : '', kilo: p.dogumKiloGr != null ? String(p.dogumKiloGr) : '', nicu: p.nicuGun != null ? String(p.nicuGun) : '',
      ...Object.fromEntries(TRI.map(([k]) => [k, triDeger(p[k] as boolean | null | undefined)])),
      antenatalSteroid: triDeger(p.antenatalSteroid), pprom: triDeger(p.pprom), magnezyum: triDeger(p.magnezyum),
    });
  }, []);

  const cagir = useCallback(async (yontem: 'GET' | 'PUT' | 'POST', govde?: Record<string, unknown>) => {
    const t = await getAccessTokenAsync();
    const r = await fetch(yontem === 'GET' ? `/api/doktor/pediatri/prematur?patientId=${encodeURIComponent(patientId)}` : '/api/doktor/pediatri/prematur', {
      method: yontem, headers: { Authorization: `Bearer ${t}`, ...(govde ? { 'Content-Type': 'application/json' } : {}) }, body: govde ? JSON.stringify({ patientId, ...govde }) : undefined, cache: 'no-store',
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'İşlem yapılamadı');
    return j as Cevap;
  }, [patientId]);

  useEffect(() => {
    if (!patientId) { setC(null); return; }
    let iptal = false;
    setHata(''); setYukleniyor(true);
    cagir('GET').then((j) => { if (!iptal) uygula(j); }).catch((e) => { if (!iptal) setHata(e instanceof Error ? e.message : 'Plan alınamadı'); }).finally(() => { if (!iptal) setYukleniyor(false); });
    return () => { iptal = true; };
  }, [patientId, cagir, uygula]);

  if (!patientId) return <div style={{ ...kutu, ...kucuk, fontSize: 14 }}>Plan için bir hasta seçin — gestasyon haftası ve doğum ağırlığı bebek kartından ya da elle girişten gelir.</div>;
  if (yukleniyor && !c) return <div style={{ ...kutu, ...kucuk }}>Plan hazırlanıyor…</div>;
  if (hata && !c) return <div style={{ ...kutu, ...pediStil.hata }}>{hata}</div>;
  if (!c) return null;
  if (c.dogumBilinmiyor) return <div style={{ ...kutu, ...uyari }}>Hastanın doğum tarihi kayıtlı değil — plan doğum tarihi olmadan kurulamaz.</div>;

  const plan = c.plan;
  const kaydetProfil = async () => {
    setKaydediliyor(true); setHata('');
    try {
      const profil: Record<string, unknown> = { gestasyonHafta: form.hf, dogumKiloGr: form.kilo, nicuGun: form.nicu };
      for (const k of [...TRI.map(([x]) => x), 'antenatalSteroid', 'pprom', 'magnezyum']) profil[k] = triCoz(form[k] || '');
      uygula(await cagir('PUT', { profil }));
    } catch (e) { setHata(e instanceof Error ? e.message : 'Kaydedilemedi'); }
    finally { setKaydediliyor(false); }
  };
  const isaretle = async (o: TakipOgesi, durum: HekimDurumu | null) => {
    setHata('');
    try { uygula(await cagir('POST', { ogeId: o.id, durum, tarih: durum === 'yapildi' ? c.bugun : null })); }
    catch (e) { setHata(e instanceof Error ? e.message : 'Kaydedilemedi'); }
  };

  const gorunur = plan.ogeler.filter((o) => o.kriter.durum === 'karsilandi' || o.durum === 'veri-eksik');
  const disi = plan.ogeler.filter((o) => !gorunur.includes(o));
  const y = plan.yas;

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Bebek</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Istatistik deger={c.etkin.gestasyon === '—' ? '—' : `${c.etkin.gestasyon} hf`} etiket={`doğumda gestasyon${c.etkin.gestasyonKaynagi === 'kd-taburcu' ? ' (bebek kartı)' : c.etkin.gestasyonKaynagi === 'elle' ? ' (elle)' : ''}`} />
          <Istatistik deger={c.etkin.dogumKiloGr ? `${c.etkin.dogumKiloGr} g` : '—'} etiket="doğum ağırlığı" />
          <Istatistik deger={y.gecerli ? `${y.kronolojikAy} ay` : '—'} etiket="kronolojik yaş" />
          {y.prematur && y.gecerli && <Istatistik ton="uyari" deger={y.buyume.duzeltilmis ? duzeltilmisYasMetni(y, c.bugun) : 'uygulanmaz'} etiket="düzeltilmiş yaş" />}
          {y.postmenstrualGun != null && <Istatistik deger={postmenstrualMetni(y)} etiket="postmenstrüel (hf+gün)" />}
        </div>
        {y.terimTarihiIso && <div style={{ ...kucuk, marginTop: 8 }}>Tahmini term tarihi {tarihGoster(y.terimTarihiIso)}. Düzeltilmiş yaş büyüme ve gelişim değerlendirmesi içindir; aşılar kronolojik yaşa göre yapılır.</div>}
        {!plan.kapsamda && <div style={{ ...uyari, marginTop: 10 }}>{plan.kapsamNedeni}</div>}
        {plan.eksikVeri.length > 0 && <div style={{ ...uyari, marginTop: 10 }}>Eksik veri: {plan.eksikVeri.join(', ')}. Aşağıdan girin; girilmeyen veriyle tahmin yapılmaz.</div>}
      </div>

      <Katlanir baslik="Yenidoğan yoğun bakım öyküsü (hekim girişi)" acik={!plan.kapsamda || plan.eksikVeri.length > 0}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}><span style={kucuk}>Doğumdaki gestasyon (ör. 29+3)</span><input value={form.hf} onChange={(e) => setForm({ ...form, hf: e.target.value })} inputMode="decimal" style={input} aria-label="Doğumdaki gestasyon haftası" placeholder={c.kart.gestasyonHafta != null ? `kartta ${c.kart.gestasyonHafta}` : '29+3'} /></label>
          <label style={{ display: 'grid', gap: 6 }}><span style={kucuk}>Doğum ağırlığı (g)</span><input value={form.kilo} onChange={(e) => setForm({ ...form, kilo: e.target.value })} inputMode="numeric" style={input} aria-label="Doğum ağırlığı gram" placeholder={c.kart.dogumKiloGr != null ? `kartta ${c.kart.dogumKiloGr}` : '1250'} /></label>
          <label style={{ display: 'grid', gap: 6 }}><span style={kucuk}>Yoğun bakım yatış süresi (gün)</span><input value={form.nicu} onChange={(e) => setForm({ ...form, nicu: e.target.value })} inputMode="numeric" style={input} aria-label="Yoğun bakım gün sayısı" /></label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10, marginTop: 14 }}>
          {[...TRI, ['antenatalSteroid', 'Antenatal steroid kürü (anne)'], ['pprom', 'PPROM (anne)'], ['magnezyum', 'Antenatal magnezyum sülfat (anne)']].map(([k, ad]) => (
            <label key={k as string} style={{ display: 'grid', gap: 4 }}>
              <span style={kucuk}>{ad as string}</span>
              <select value={form[k as string] || ''} onChange={(e) => setForm({ ...form, [k as string]: e.target.value })} style={input} aria-label={ad as string}>
                <option value="">bilinmiyor</option><option value="evet">evet</option><option value="hayir">hayır</option>
              </select>
            </label>
          ))}
        </div>
        <div style={{ ...kucuk, marginTop: 8 }}>Anne tarafı alanları (steroid, PPROM, magnezyum) doğum öyküdür; kalem kriteri olarak kullanılmaz. Kadın doğum taburcu paketinden geldiyse önceden doludur.</div>
        <button type="button" onClick={kaydetProfil} disabled={kaydediliyor} style={{ ...btn, marginTop: 12, opacity: kaydediliyor ? 0.6 : 1 }}>{kaydediliyor ? 'Kaydediliyor…' : 'Öyküyü kaydet ve planı güncelle'}</button>
      </Katlanir>

      {hata && <div style={{ ...kirmizi, marginBottom: 12 }}>{hata}</div>}

      {plan.kapsamda && (
        <div style={kutu} aria-live="polite">
          <div style={{ ...etiket, display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}><span>Takip kalemleri</span><span style={{ ...kucuk, fontWeight: 500 }}>{c.protokol.ad} protokolü · {c.protokol.surum}</span></div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <Istatistik ton={plan.ozet.gecikti ? 'kirmizi' : 'notr'} deger={plan.ozet.gecikti} etiket="gecikti" />
            <Istatistik ton={plan.ozet.zamaniGeldi ? 'uyari' : 'notr'} deger={plan.ozet.zamaniGeldi} etiket="zamanı geldi" />
            <Istatistik deger={plan.ozet.yaklasiyor} etiket="yaklaşıyor" />
            <Istatistik ton="iyi" deger={plan.ozet.yapildi} etiket="yapıldı" />
            <Istatistik ton={plan.ozet.veriEksik ? 'uyari' : 'notr'} deger={plan.ozet.veriEksik} etiket="veri eksik" />
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {gorunur.map((o) => (
              <div key={o.id} style={{ border: `1px solid ${CHROME_RENK.border}`, borderRadius: 12, padding: '12px 14px', background: o.durum === 'gecikti' ? '#FBF3F0' : '#FFFFFF' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, color: CHROME_RENK.ink, fontSize: 15 }}>{o.baslik} <span style={{ ...kucuk, fontWeight: 500 }}>· {KATEGORI[o.kategori] || o.kategori}</span></div>
                  <Rozet ton={GORUNUM[o.durum].ton}>{GORUNUM[o.durum].ad}</Rozet>
                </div>
                <div style={{ fontSize: 14, color: CHROME_RENK.ink, marginTop: 4 }}>{o.etiket}</div>
                {(o.bas || o.son) && <div style={kucuk}>{o.bas && o.son && o.bas !== o.son ? `${tarihGoster(o.bas)} – ${tarihGoster(o.son)}` : tarihGoster(o.son || o.bas)}{o.otomatikKayit ? ` · kayıtlı muayene ${tarihGoster(o.otomatikKayit)}` : ''}{o.hekim?.tarih ? ` · yapıldı ${tarihGoster(o.hekim.tarih)}` : ''}</div>}
                {o.kriter.gerekce.length > 0 && <div style={kucuk}>Kriter: {o.kriter.gerekce.join(' · ')}</div>}
                {o.not && <div style={{ ...kucuk, marginTop: 2 }}>{o.not}</div>}
                {o.hekimNotu && <div style={{ ...uyari, marginTop: 6 }}>{o.hekimNotu}</div>}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {(['plana_alindi', 'yapildi', 'uygulanmaz'] as HekimDurumu[]).map((d) => (
                    <button key={d} type="button" aria-pressed={o.hekim?.durum === d} onClick={() => isaretle(o, o.hekim?.durum === d ? null : d)} style={{ ...ghost, background: o.hekim?.durum === d ? '#E4F3EA' : 'transparent' }}>{d === 'plana_alindi' ? 'Plana al' : d === 'yapildi' ? 'Yapıldı' : 'Uygulanmaz'}</button>
                  ))}
                </div>
                <Katlanir baslik="Kaynak">{<KaynakListesi kaynaklar={o.kaynaklar} />}</Katlanir>
              </div>
            ))}
            {!gorunur.length && <div style={kucuk}>Bu bebek için kriteri karşılanan takip kalemi yok.</div>}
          </div>
          {disi.length > 0 && (
            <Katlanir baslik="Kriteri karşılanmayan kalemler" rozet={`${disi.length}`}>
              <div style={{ display: 'grid', gap: 6 }}>{disi.map((o) => <div key={o.id} style={kucuk}><b>{o.baslik}</b> — {o.etiket}: {o.kriter.gerekce.join(' · ') || 'kriter karşılanmadı'}</div>)}</div>
            </Katlanir>
          )}
          <div style={{ marginTop: 12 }}><KopyalaButonu metin={PlanMetni(c)} etiket="Planı kopyala" /></div>
        </div>
      )}

      <TaslakNotu>
        Karar desteğidir: kalemler kaynaklı bir kontrol listesidir, hiçbir tetkik, sevk ya da ilaç otomatik istenmez; doz önerilmez, tanı konmaz. Ulusal ve kurumsal protokol farklarında hekimin kararı esastır.
        {' '}Kapsam: {c.protokol.kapsam.kaynak}
      </TaslakNotu>
    </>
  );
}
