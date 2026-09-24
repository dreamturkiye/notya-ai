'use client';
/**
 * PEDI-ARACLAR-02 — Araçlar › Aşı takvimi & telafi planlayıcı (engines/asiPlan.ts → lib/asi/ulusalAsiTakvimi).
 * En kısa yol: doğum tarihi (ya da "14 aylık") → SB takvimi, her dozda yapıldı / zamanı geldi / gecikti ve "bugün
 * yapılabilir" listesi. Hasta seçiliyse /api/doktor/asilar kayıtları okunur; hekim işaretlediği dozları tek dokunuşla
 * kayda ekler. Hiçbir doz otomatik "yapıldı" sayılmaz. Özel (ücretli) aşılar ayrı grupta.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import {
  asiPlani, asiOzetMetni, onerilenDonem, takvimDozlari, dozKisa, gunMetni,
  VARSAYILAN_KURALLAR, SERI_AD, SERI_SIRA, DONEM_AD, DURUM_AD, GECIKME_ESIGI_GUN,
  type AsiKaydi, type PlanDozu, type SeriKod, type SeriKurali, type TakvimDonemi, type DozDurum, type OzelPlan,
} from '../../engines/asiPlan';
import { dogumVeyaYasCoz, gebelikHaftasiCoz, gramCoz, tarihCoz, tarihGoster, yasMetni, gunFarki } from '../../engines/girdi';
import {
  pediStil, Alan, Segment, Katlanir, TaslakNotu, KopyalaButonu, MuayeneFormunaEkle, PediHastaSecici, usePediHasta, useUrlHasta, Rozet, OneriRozet, Istatistik,
} from './PediAracKabugu';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const { kutu, etiket, kucuk, input, ghost, btn, uyari, kirmizi } = pediStil;
const bugunTr = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);
const ON_AYAR_ANAHTAR = 'notya.pedi.asi.onAyar.v1';

type Isaret = { tarih: string; kaynak: 'kayit' | 'beyan' };
const dozAnahtar = (d: Pick<PlanDozu, 'seri' | 'no'>) => `${d.seri}:${d.no}`;

const DURUM_TON: Record<DozDurum, 'iyi' | 'uyari' | 'kirmizi' | 'notr' | 'bilgi'> = {
  yapildi: 'iyi', bugun: 'bilgi', zamani_geldi: 'uyari', gecikti: 'kirmizi', yaklasiyor: 'uyari', bekliyor: 'notr', yas_disi: 'uyari',
};

interface SunucuAsi { id: string; asi_adi: string; doz_no: number | null; uygulama_tarihi: string | null; kaynak: 'kayit' | 'beyan'; kategori: string }

export default function AsiPlanlayici() {
  const [hastaId, setHastaId] = useState('');
  useUrlHasta(setHastaId);
  const { ozet, hata: hastaHata } = usePediHasta(hastaId);
  const [dogumHam, setDogumHam] = useState('');
  const [donemSecim, setDonemSecim] = useState<TakvimDonemi | 'oto'>('oto');
  const [gebelikHam, setGebelikHam] = useState('');
  const [kiloHam, setKiloHam] = useState('');
  const [hbsag, setHbsag] = useState<'' | 'negatif' | 'pozitif' | 'bilinmiyor'>('');
  const [sunucu, setSunucu] = useState<SunucuAsi[]>([]);
  const [kayitHata, setKayitHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [isaretler, setIsaretler] = useState<Record<string, Isaret>>({});
  const [onAyar, setOnAyar] = useState<Partial<Record<SeriKod, SeriKurali>>>({});
  const [hatirlatmaYaz, setHatirlatmaYaz] = useState(true);
  const [kaydediyor, setKaydediyor] = useState(false);
  const [kayitMesaj, setKayitMesaj] = useState('');
  const [gorunum, setGorunum] = useState<'yas' | 'asi'>('yas');
  const [gecersizSay, setGecersizSay] = useState(true);
  const bugun = bugunTr();

  // Hekimin ön ayarları bu tarayıcıda saklanır (öneri — hekim kilitler).
  useEffect(() => {
    try { const j = JSON.parse(localStorage.getItem(ON_AYAR_ANAHTAR) || '{}'); if (j && typeof j === 'object') setOnAyar(j); } catch { /* yok */ }
  }, []);
  const onAyarKaydet = (y: Partial<Record<SeriKod, SeriKurali>>) => { setOnAyar(y); try { localStorage.setItem(ON_AYAR_ANAHTAR, JSON.stringify(y)); } catch { /* izin yok */ } };

  useEffect(() => {
    if (!ozet) return;
    if (ozet.dogumIso) setDogumHam(tarihGoster(ozet.dogumIso));
    if (ozet.dogumBilgisi?.gebelikHaftasi != null) setGebelikHam(String(ozet.dogumBilgisi.gebelikHaftasi).replace('.', ','));
    if (ozet.dogumBilgisi?.kiloGram != null) setKiloHam(`${ozet.dogumBilgisi.kiloGram} g`);
  }, [ozet]);

  const kayitlariYukle = async (id: string, iptal?: { v: boolean }) => {
    setKayitHata('');
    if (!id) { setSunucu([]); return; }
    setYukleniyor(true);
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch(`/api/doktor/asilar?patientId=${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (iptal?.v) return;
      if (r.ok) setSunucu(Array.isArray(j.asilar) ? j.asilar : []); else setKayitHata(j.error || 'Aşı kayıtları alınamadı.');
    } catch { if (!iptal?.v) setKayitHata('Aşı kayıtları alınamadı — bağlantıyı kontrol edin.'); }
    finally { if (!iptal?.v) setYukleniyor(false); }
  };
  useEffect(() => {
    const iptal = { v: false };
    setIsaretler({}); setKayitMesaj('');
    kayitlariYukle(hastaId, iptal);
    return () => { iptal.v = true; };
  }, [hastaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const dogum = dogumVeyaYasCoz(dogumHam, bugun);
  const dogumIso = dogum && dogum.iso <= bugun ? dogum.iso : null;
  const gebelikHaftasi = gebelikHaftasiCoz(gebelikHam);
  const dogumKiloGr = gramCoz(kiloHam);

  const sunucuKayitlari: AsiKaydi[] = useMemo(() => sunucu.filter((a) => a.kategori !== 'yetiskin').map((a) => ({
    id: a.id, ad: a.asi_adi, dozNo: a.doz_no, tarih: a.uygulama_tarihi ? String(a.uygulama_tarihi).slice(0, 10) : null, kaynak: a.kaynak === 'beyan' ? 'beyan' : 'kayit',
  })), [sunucu]);

  const donem: TakvimDonemi = donemSecim === 'oto' ? (dogumIso ? onerilenDonem(dogumIso, sunucuKayitlari) : 'altili') : donemSecim;

  const tanimlar = useMemo(() => takvimDozlari({ donem, dogumKiloGr, anneHbsag: hbsag || undefined }), [donem, dogumKiloGr, hbsag]);
  const yerelKayitlar: AsiKaydi[] = useMemo(() => Object.entries(isaretler).map(([k, v]) => {
    const [seri, no] = k.split(':');
    const t = tanimlar.find((d) => d.seri === seri && d.no === Number(no));
    return { id: `yerel-${k}`, ad: t?.urun || String(seri), dozNo: Number(no), tarih: v.tarih, kaynak: 'ekran' as const };
  }), [isaretler, tanimlar]);

  const plan = useMemo(() => (dogumIso ? asiPlani({
    dogumIso, bugunIso: bugun, donem, dogumKiloGr, gebelikHaftasi, anneHbsag: hbsag || undefined, kurallar: onAyar, kisaAralikGecersiz: gecersizSay,
    kayitlar: [...sunucuKayitlari, ...yerelKayitlar],
  }) : null), [dogumIso, bugun, donem, dogumKiloGr, gebelikHaftasi, hbsag, onAyar, sunucuKayitlari, yerelKayitlar]);

  const isaretle = (d: PlanDozu, tarih = bugun, kaynak: Isaret['kaynak'] = 'kayit') => setIsaretler((x) => ({ ...x, [dozAnahtar(d)]: { tarih, kaynak } }));
  const geriAl = (anahtar: string) => setIsaretler((x) => { const y = { ...x }; delete y[anahtar]; return y; });

  /** Aşı kartından hızlı giriş: seçilen yaşa kadarki tüm takvim dozları önerilen tarihleriyle, beyan olarak. */
  const kartTam = (ay: number) => {
    if (!plan || !dogumIso) return;
    const y: Record<string, Isaret> = { ...isaretler };
    for (const s of plan.seriler) for (const d of s.dozlar) {
      if (d.durum === 'yapildi') continue;
      if (gunFarki(dogumIso, d.onerilen) <= ay * 30.4375 + 3 && d.onerilen <= bugun) y[dozAnahtar(d)] = { tarih: d.onerilen, kaynak: 'beyan' };
    }
    setIsaretler(y);
  };

  const yerelSayisi = Object.keys(isaretler).length;
  const kaydet = async () => {
    if (!hastaId || !plan || kaydediyor) return;
    setKaydediyor(true); setKayitMesaj('');
    let tamam = 0, hata = 0;
    try {
      const t = await getAccessTokenAsync();
      for (const [anahtar, v] of Object.entries(isaretler)) {
        const [seri, no] = anahtar.split(':');
        const s = plan.seriler.find((x) => x.seri === seri);
        const d = s?.dozlar.find((x) => x.no === Number(no));
        if (!s || !d) continue;
        const sonraki = s.dozlar.find((x) => x.no > d.no && x.durum !== 'yapildi' && x.plan);
        const r = await fetch('/api/doktor/asilar', {
          method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientId: hastaId, asiAdi: d.urun, dozNo: d.no, kategori: 'pediatrik', uygulamaTarihi: v.tarih, kaynak: v.kaynak, sonrakiDozTarihi: hatirlatmaYaz && sonraki?.plan ? sonraki.plan : undefined, notlar: 'Aşı planlayıcıdan (hekim işaretledi)' }),
        });
        if (r.ok) tamam++; else hata++;
      }
    } catch { hata++; }
    setKayitMesaj(hata ? `${tamam} doz kaydedildi, ${hata} doz kaydedilemedi — tekrar deneyin.` : `${tamam} doz hasta kaydına eklendi (Aşılar sekmesinde görünür).`);
    if (tamam) { setIsaretler({}); await kayitlariYukle(hastaId); }
    setKaydediyor(false);
  };

  const dogumIpucu = dogumHam && !dogum ? 'Okunamadı — ör. 12.03.2025 veya "14 aylık"'
    : dogum && dogum.iso > bugun ? 'Doğum tarihi bugünden sonra olamaz'
      : dogumIso ? `${yasMetni(dogumIso, bugun)}${dogum?.yaklasik ? ` · doğum ≈ ${tarihGoster(dogumIso)} (yaştan hesaplandı — kesin tarih için gg.aa.yyyy)` : ''}`
        : 'gg.aa.yyyy — ya da yaş: "14 aylık", "2 yaş 3 ay"';
  const prematureRozet = gebelikHaftasi != null || dogumKiloGr != null || hbsag ? 'girildi' : undefined;

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Hasta (isteğe bağlı — doğum tarihi ve aşı kayıtları gelir)</div>
        <PediHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        {(hastaHata || kayitHata) && <div style={{ ...pediStil.hata, marginTop: 6 }}>{hastaHata || kayitHata}</div>}
        {hastaId && yukleniyor && <div style={{ ...kucuk, marginTop: 6 }}>Aşı kayıtları yükleniyor…</div>}
        {hastaId && !yukleniyor && !kayitHata && ozet && <div style={{ ...kucuk, marginTop: 6 }}>{sunucuKayitlari.length ? `${sunucuKayitlari.length} aşı kaydı okundu.` : 'Bu hastada aşı kaydı yok — ASM\'de yapılanları aşı kartından "hızlı giriş" ile ekleyebilirsiniz.'}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 14 }}>
          <Alan etiket="Doğum tarihi veya yaş" ipucu={dogumIpucu}>
            <input value={dogumHam} onChange={(e) => setDogumHam(e.target.value)} placeholder="12.03.2025" aria-label="Doğum tarihi veya yaş" style={input} />
          </Alan>
          <Alan etiket="Takvim" ipucu={donemSecim === 'oto' ? `Otomatik: ${DONEM_AD[donem]}` : 'Elle seçildi'}>
            <Segment etiket="Takvim dönemi" deger={donemSecim} set={setDonemSecim} secenekler={[['oto', 'Otomatik'], ['altili', "6'lı"], ['besli', "5'li + Hep B"]]} />
          </Alan>
        </div>
        <Katlanir baslik="Prematüre · doğum ağırlığı · anne HBsAg" rozet={prematureRozet} acik={!!ozet?.dogumBilgisi}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
            <Alan etiket="Gebelik haftası" ipucu={gebelikHam && gebelikHaftasi == null ? 'Okunamadı — ör. 32+4' : '32 · 32+4'}>
              <input value={gebelikHam} onChange={(e) => setGebelikHam(e.target.value)} placeholder="hafta" aria-label="Gebelik haftası" inputMode="decimal" style={input} />
            </Alan>
            <Alan etiket="Doğum ağırlığı" ipucu={kiloHam && dogumKiloGr == null ? 'Okunamadı — ör. 1850 veya 1,85 kg' : dogumKiloGr != null ? `= ${dogumKiloGr} g` : '1850 · 1,85 kg'}>
              <input value={kiloHam} onChange={(e) => setKiloHam(e.target.value)} placeholder="gram" aria-label="Doğum ağırlığı" inputMode="decimal" style={input} />
            </Alan>
            <Alan etiket="Anne HBsAg" ipucu={dogumKiloGr != null && dogumKiloGr < 2000 && !hbsag ? '< 2000 g: girilmezse "bilinmiyor" gibi ele alınır' : undefined}>
              <Segment etiket="Anne HBsAg" deger={hbsag || 'negatif'} set={(x) => setHbsag(x)} secenekler={[['negatif', 'Negatif'], ['pozitif', 'Pozitif'], ['bilinmiyor', 'Bilinmiyor']]} />
            </Alan>
          </div>
          <div style={{ ...kucuk, marginTop: 8 }}>Aşılar takvim (kronolojik) yaşa göre ve tam dozda uygulanır; düzeltilmiş yaş kullanılmaz. İstisnalar: Hep B (&lt; 2000 g — doğum dozu sayılmaz, 1. ayda tekli doz) ve BCG (&lt; 34 hafta — postkonsepsiyonel ≥ 34 hafta, ≥ 2 ay, ≥ 2000 g). Kaynak: TND 2026.</div>
        </Katlanir>
      </div>

      <div style={{ ...kutu, borderColor: plan ? 'rgba(45,212,191,0.3)' : 'rgba(255,255,255,0.1)' }} aria-live="polite">
        {!plan ? (
          <div style={{ ...kucuk, fontSize: 14 }}>Doğum tarihini (ya da yaşı) yazın — takvim, geciken dozlar ve telafi planı yazdıkça hesaplanır.</div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Istatistik deger={plan.bugunYapilabilir.length} etiket="bugün yapılabilir" ton={plan.bugunYapilabilir.length ? 'iyi' : 'notr'} />
              <Istatistik deger={plan.gecikmis.length} etiket={`gecikmiş doz (> ${GECIKME_ESIGI_GUN} gün)`} ton={plan.gecikmis.length ? 'kirmizi' : 'notr'} />
              <Istatistik deger={plan.sonrakiZiyaret ? tarihGoster(plan.sonrakiZiyaret.tarih) : '—'} etiket="sonraki aşı ziyareti" />
            </div>
            {plan.bugunYapilabilir.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={etiket}>Bugün yapılabilir</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {plan.bugunYapilabilir.map((d) => <DozSatiri key={dozAnahtar(d)} d={d} isaret={isaretler[dozAnahtar(d)]} isaretle={isaretle} geriAl={geriAl} ilkBekleyen bugun={bugun} vurgu />)}
                </div>
              </div>
            )}
            {plan.bugunYapilabilir.length === 0 && plan.sonrakiZiyaret && (
              <div style={{ ...pediStil.metin, marginTop: 12 }}>Bugün yapılacak doz yok. Sonraki: <b>{tarihGoster(plan.sonrakiZiyaret.tarih)}</b> — {plan.sonrakiZiyaret.dozlar.map(dozKisa).join(', ')}.</div>
            )}
            {!plan.sonrakiZiyaret && !plan.bugunYapilabilir.length && <div style={{ ...pediStil.metin, marginTop: 12 }}>Ulusal takvimdeki tüm dozlar yapılmış görünüyor.</div>}
            {plan.notlar.length > 1 && <div style={{ ...uyari, marginTop: 12 }}>{plan.notlar.slice(1).map((n) => <div key={n}>{n}</div>)}</div>}
          </>
        )}
      </div>

      {plan && (
        <>
          <div style={kutu}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
              <div>
                <div style={{ ...etiket, marginBottom: 2 }}>Ulusal aşı takvimi · ücretsiz (SB, aile hekimliği)</div>
                <div style={kucuk}>{plan.surum}</div>
              </div>
              <Segment etiket="Görünüm" deger={gorunum} set={setGorunum} secenekler={[['yas', 'Yaşa göre'], ['asi', 'Aşıya göre']]} />
            </div>
            <TakvimListesi plan={plan} gorunum={gorunum} isaretler={isaretler} isaretle={isaretle} geriAl={geriAl} bugun={bugun} />
            {plan.seriler.some((s) => s.oneriler.length) && (
              <div style={{ ...uyari, marginTop: 14 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Hekim kararı gerektirenler</div>
                {plan.seriler.flatMap((s) => s.oneriler.map((o) => <div key={s.seri + o} style={{ marginTop: 2 }}>• <b>{SERI_AD[s.seri]}:</b> {o}</div>))}
              </div>
            )}
            {plan.hicAsisiz && (
              <div style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 12, padding: 12, marginTop: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#BFDBFE', marginBottom: 6 }}>{plan.hicAsisiz.baslik}</div>
                <div style={{ display: 'grid', gap: 4 }}>
                  {plan.hicAsisiz.adimlar.map((a) => <div key={a.zaman} style={{ ...pediStil.metin, display: 'flex', gap: 10, flexWrap: 'wrap' }}><span style={{ minWidth: 92, color: CHROME_RENK.muted }}>{a.zaman}</span><span>{a.asilar}</span></div>)}
                </div>
                <div style={{ ...kucuk, marginTop: 6 }}>{plan.hicAsisiz.not}</div>
              </div>
            )}
            {(plan.eslesmeyen.length > 0 || plan.fazla.length > 0) && (
              <div style={{ ...kucuk, marginTop: 12 }}>
                {plan.eslesmeyen.length > 0 && <div>Takvimle eşleşmeyen kayıt: {plan.eslesmeyen.map((k) => `${k.ad}${k.tarih ? ` (${tarihGoster(k.tarih)})` : ''}`).join(', ')} — hesaba katılmadı.</div>}
                {plan.fazla.length > 0 && <div>Serinin doz sayısını aşan kayıt: {plan.fazla.map((k) => `${k.ad}${k.tarih ? ` (${tarihGoster(k.tarih)})` : ''}`).join(', ')}.</div>}
              </div>
            )}
            <Katlanir baslik="Aşı kartından hızlı giriş">
              <div style={kucuk}>Aile aşı kartını gösterdiyse: seçtiğiniz döneme kadarki tüm takvim dozları önerilen tarihleriyle <b>beyan</b> olarak işaretlenir. Kaydetmeden önce tek tek düzeltebilirsiniz.</div>
              <div style={{ ...pediStil.satir }}>
                {[2, 4, 6, 12, 18, 24, 48].filter((ay) => dogumIso && gunFarki(dogumIso, bugun) >= ay * 30).map((ay) => (
                  <button key={ay} type="button" onClick={() => kartTam(ay)} style={ghost}>{ay < 24 ? `${ay}. ay` : `${ay / 12} yaş`}a kadar tam</button>
                ))}
                {yerelSayisi > 0 && <button type="button" onClick={() => setIsaretler({})} style={{ ...ghost, color: CHROME_RENK.warn }}>İşaretleri temizle</button>}
              </div>
            </Katlanir>
          </div>

          <OzelAsilar ozel={plan.ozel} />

          {yerelSayisi > 0 && (
            // Kabuk overflow-x: hidden taşır (sticky orada çalışmaz) → ekranın altına sabit çubuk + altta boşluk.
            <div role="status" style={{ position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 20, maxWidth: 968, margin: '0 auto', boxSizing: 'border-box', background: '#0C1830', border: '1px solid rgba(45,212,191,0.45)', borderRadius: 16, padding: 14, boxShadow: '0 8px 30px rgba(0,0,0,0.55)' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 220px', ...pediStil.metin }}><b>{yerelSayisi} doz işaretlendi</b> {hastaId ? '— henüz kayda yazılmadı.' : '— hasta seçilmedi, yalnız bu ekranda.'}</div>
                {hastaId ? (
                  <>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: CHROME_RENK.muted, minHeight: 44, cursor: 'pointer' }}>
                      <input type="checkbox" checked={hatirlatmaYaz} onChange={(e) => setHatirlatmaYaz(e.target.checked)} style={{ width: 20, height: 20 }} />
                      Sonraki doz tarihini de yaz (hatırlatma listenize düşer — onayınızla gönderilir)
                    </label>
                    <button type="button" onClick={kaydet} disabled={kaydediyor} style={{ ...btn, opacity: kaydediyor ? 0.6 : 1 }}>{kaydediyor ? 'Kaydediliyor…' : `${yerelSayisi} dozu hasta kaydına ekle`}</button>
                  </>
                ) : <span style={kucuk}>Kayda eklemek için yukarıdan hasta seçin.</span>}
              </div>
            </div>
          )}
          {yerelSayisi > 0 && <div aria-hidden style={{ height: 150 }} />}
          {kayitMesaj && <div style={{ ...(kayitMesaj.includes('kaydedilemedi') ? kirmizi : { ...uyari, color: '#0F9B8E', borderColor: 'rgba(45,212,191,0.4)', background: 'rgba(45,212,191,0.08)' }), marginBottom: 14 }}>{kayitMesaj}</div>}

          <div style={kutu}>
            <Katlanir baslik="Minimum yaş ve aralık ön ayarları" rozet={Object.keys(onAyar).length ? 'hekim değiştirdi' : undefined}>
              <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, color: CHROME_RENK.muted, minHeight: 44, cursor: 'pointer', marginBottom: 8 }}>
                <input type="checkbox" checked={gecersizSay} onChange={(e) => setGecersizSay(e.target.checked)} style={{ width: 20, height: 20 }} />
                Minimum yaş / aralıktan önce yapılan dozu geçersiz say ve tekrarla (GBP Genelgesi)
              </label>
              <OnAyarlar onAyar={onAyar} kaydet={onAyarKaydet} />
            </Katlanir>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ ...pediStil.satir }}>
              <KopyalaButonu metin={asiOzetMetni(plan, bugun)} etiket="Aşı özetini kopyala" />
            </div>
            <MuayeneFormunaEkle hastaId={hastaId} arac="Aşı takvimi & telafi planı" satirlar={asiOzetMetni(plan, bugun).split('\n')} />
          </div>
        </>
      )}
      <TaslakNotu>Plan karar desteğidir: hangi aşının bugün yapılacağına, ürüne ve doz sayısına hekim karar verir. Telafide seri baştan başlatılmaz; kalan dozlar minimum aralıklarla yeniden hesaplanır. Doz yalnız kayıt ya da sizin işaretinizle "yapıldı" sayılır. Kaynak: T.C. Sağlık Bakanlığı Genişletilmiş Bağışıklama Programı (Ulusal Aşı Takvimi). "Öneri — hekim kilitler" rozetli kurallar Türkçe resmi metinde birebir doğrulanamamıştır.</TaslakNotu>
    </>
  );
}

function DozSatiri({ d, isaret, isaretle, geriAl, ilkBekleyen, bugun, vurgu }: {
  d: PlanDozu; isaret?: Isaret; isaretle: (d: PlanDozu, tarih?: string, kaynak?: Isaret['kaynak']) => void; geriAl: (k: string) => void; ilkBekleyen: boolean; bugun: string; vurgu?: boolean;
}) {
  const [tarihHam, setTarihHam] = useState('');
  const yerel = d.kayit?.kaynak === 'ekran';
  const durumMetni = d.durum === 'yapildi'
    ? `${yerel ? 'İşaretlendi' : d.kayit?.kaynak === 'beyan' ? 'Beyan' : 'Kayıtlı'} · ${d.kayit?.tarih ? tarihGoster(d.kayit.tarih) : 'tarih yok'}`
    : DURUM_AD[d.durum];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', padding: '10px 12px', borderRadius: 12, background: vurgu ? 'rgba(96,165,250,0.06)' : 'rgba(0,0,0,0.16)', border: `1px solid ${vurgu ? 'rgba(96,165,250,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: CHROME_RENK.ink }}>{dozKisa(d)}</div>
        <div style={kucuk}>
          {d.urun} · önerilen {tarihGoster(d.onerilen)}
          {d.durum !== 'yapildi' && d.plan && d.plan !== d.onerilen ? <> · <span style={{ color: '#7A5B1E' }}>{d.plan <= bugun ? 'telafi: bugün' : `telafi: ${tarihGoster(d.plan)}`}</span></> : null}
          {d.durum !== 'yapildi' && d.gecikmeGun > GECIKME_ESIGI_GUN ? <> · <span style={{ color: CHROME_RENK.warn }}>{d.gecikmeGun} gün gecikti</span></> : null}
        </div>
        {d.uyarilar.map((u) => <div key={u} style={{ ...kucuk, color: '#7A5B1E', marginTop: 2 }}>⚠ {u}</div>)}
        {d.not && <div style={{ ...kucuk, marginTop: 2 }}>{d.not}</div>}
      </div>
      <Rozet ton={d.durum !== 'yapildi' && d.gecikmeGun > GECIKME_ESIGI_GUN && d.durum === 'bugun' ? 'kirmizi' : DURUM_TON[d.durum]}>{durumMetni}</Rozet>
      {d.durum === 'yapildi' && yerel && isaret && (
        <span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={tarihHam} onChange={(e) => { setTarihHam(e.target.value); const t = tarihCoz(e.target.value); if (t && t <= bugun) isaretle(d, t, isaret.kaynak); }} placeholder={tarihGoster(isaret.tarih)} aria-label={`${dozKisa(d)} uygulama tarihi`} style={{ ...input, width: 130, minWidth: 0 }} />
          <Segment etiket="Kaynak" deger={isaret.kaynak} set={(k) => isaretle(d, isaret.tarih, k)} secenekler={[['kayit', 'Burada'], ['beyan', 'Beyan']]} />
          <button type="button" onClick={() => geriAl(dozAnahtar(d))} style={ghost} aria-label={`${dozKisa(d)} işaretini geri al`}>Geri al</button>
        </span>
      )}
      {d.durum !== 'yapildi' && d.durum !== 'yas_disi' && ilkBekleyen && (d.plan ? d.plan <= bugun : false) && (
        <button type="button" onClick={() => isaretle(d)} style={{ ...ghost, borderColor: 'rgba(45,212,191,0.45)', color: '#0F9B8E' }}>Yapıldı ✓</button>
      )}
      {d.durum !== 'yapildi' && d.durum !== 'yas_disi' && ilkBekleyen && !(d.plan ? d.plan <= bugun : false) && d.onerilen <= bugun && (
        <button type="button" onClick={() => isaretle(d, d.onerilen <= bugun ? d.onerilen : bugun, 'beyan')} style={ghost} title="Başka yerde yapılmışsa (aşı kartı) beyan olarak işaretleyin; tarihi sonra düzeltebilirsiniz">Yapılmış (beyan)</button>
      )}
    </div>
  );
}

function TakvimListesi({ plan, gorunum, isaretler, isaretle, geriAl, bugun }: {
  plan: NonNullable<ReturnType<typeof asiPlani>>; gorunum: 'yas' | 'asi'; isaretler: Record<string, Isaret>;
  isaretle: (d: PlanDozu, tarih?: string, kaynak?: Isaret['kaynak']) => void; geriAl: (k: string) => void; bugun: string;
}) {
  // Her seride yalnız ilk yapılmamış doz işaretlenebilir (doz sırası korunur; seri baştan başlamaz).
  const ilk = new Set(plan.seriler.map((s) => s.dozlar.find((d) => d.durum !== 'yapildi')).filter(Boolean).map((d) => dozAnahtar(d!)));
  const tum = plan.seriler.flatMap((s) => s.dozlar);
  const gruplar: Array<{ baslik: string; alt?: string; dozlar: PlanDozu[] }> = gorunum === 'asi'
    ? SERI_SIRA.map((s) => plan.seriler.find((x) => x.seri === s)).filter(Boolean).map((s) => ({ baslik: SERI_AD[s!.seri], alt: s!.tamam ? 'tamamlandı' : undefined, dozlar: s!.dozlar }))
    : [...new Set(tum.map((d) => d.donemEtiket))]
      .map((etk) => ({ etk, dozlar: tum.filter((d) => d.donemEtiket === etk) }))
      .sort((a, b) => a.dozlar[0].onerilen.localeCompare(b.dozlar[0].onerilen))
      .map(({ etk, dozlar }) => ({ baslik: etk, alt: tarihGoster(dozlar[0].onerilen), dozlar }));
  return (
    <div style={{ display: 'grid', gap: 14, marginTop: 10 }}>
      {gruplar.map((g) => {
        const hepsi = g.dozlar.every((d) => d.durum === 'yapildi');
        return (
          <div key={g.baslik}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: hepsi ? '#0F9B8E' : CHROME_RENK.muted }}>{hepsi ? '✓ ' : ''}{g.baslik}</span>
              {g.alt && <span style={kucuk}>{g.alt}</span>}
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {g.dozlar.map((d) => <DozSatiri key={dozAnahtar(d)} d={d} isaret={isaretler[dozAnahtar(d)]} isaretle={isaretle} geriAl={geriAl} ilkBekleyen={ilk.has(dozAnahtar(d))} bugun={bugun} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OzelAsilar({ ozel }: { ozel: OzelPlan[] }) {
  const ton = { uygun: 'iyi', erken: 'notr', gecti: 'uyari', bilgi: 'notr' } as const;
  const metin = { uygun: 'yaşı uygun', erken: 'henüz erken', gecti: 'yaş penceresi geçmiş olabilir', bilgi: 'bilgi' };
  return (
    <div style={kutu}>
      <div style={{ ...etiket, marginBottom: 2 }}>Özel aşılar · ücretli (takvim dışı)</div>
      <div style={{ ...kucuk, marginBottom: 10 }}>SB ücretsiz takviminde yok — aileyle ücret ve tercih konuşması için ayrı tutuldu. Doz sayısı ve şema ürüne göre değişir; hekim belirler.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10 }}>
        {ozel.map((o) => (
          <div key={o.kod} style={{ background: 'rgba(0,0,0,0.16)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: CHROME_RENK.ink }}>{o.ad}</span>
              {o.kayitlar.length ? <Rozet ton="iyi">{o.kayitlar.length} doz kayıtlı</Rozet> : <Rozet ton={ton[o.uygunluk]}>{metin[o.uygunluk]}</Rozet>}
            </div>
            <div style={{ ...kucuk, marginTop: 4 }}>{o.onerilenDonem}</div>
            <div style={{ ...kucuk, marginTop: 2 }}>{o.not}</div>
            {o.kayitlar.length > 0 && <div style={{ ...kucuk, marginTop: 4, color: '#0F9B8E' }}>{o.kayitlar.map((k) => (k.tarih ? tarihGoster(k.tarih) : 'tarih yok')).join(' · ')}</div>}
          </div>
        ))}
      </div>
      <div style={{ ...kucuk, marginTop: 8 }}>Özel aşı dozunu hasta dosyası › Aşılar sekmesinden ekleyebilirsiniz.</div>
    </div>
  );
}

function OnAyarlar({ onAyar, kaydet }: { onAyar: Partial<Record<SeriKod, SeriKurali>>; kaydet: (y: Partial<Record<SeriKod, SeriKurali>>) => void }) {
  const kural = (s: SeriKod) => onAyar[s] || VARSAYILAN_KURALLAR[s];
  const degistir = (s: SeriKod, tur: 'minYasGun' | 'minAralikGun', no: number, ham: string) => {
    const n = Math.round(Number(ham.replace(',', '.')));
    if (!Number.isFinite(n) || n < 0 || n > 7000) return;
    const k = kural(s);
    kaydet({ ...onAyar, [s]: { ...k, [tur]: { ...k[tur], [no]: n }, kaynak: 'Hekim ön ayarı', dogrulandi: true } });
  };
  return (
    <div>
      <div style={{ ...kucuk, marginBottom: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        Aralıklar GBP Genelgesi 2009/17'den; genelgede bulunmayan değerler <OneriRozet /> ile işaretli. Değiştirirseniz bu tarayıcıda saklanır ve plan anında yeniden hesaplanır.
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {SERI_SIRA.map((s) => {
          const k = kural(s);
          const dozlar = [...new Set([...Object.keys(k.minYasGun), ...Object.keys(k.minAralikGun)].map(Number))].sort((a, b) => a - b);
          return (
            <div key={s} style={{ background: 'rgba(0,0,0,0.14)', borderRadius: 12, padding: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: CHROME_RENK.ink }}>{SERI_AD[s]}</span>
                {onAyar[s] ? <Rozet ton="bilgi">hekim ön ayarı</Rozet> : VARSAYILAN_KURALLAR[s].dogrulandi ? <Rozet ton="iyi">GBP Genelgesi</Rozet> : <OneriRozet />}
              </div>
              <div style={{ ...kucuk, margin: '4px 0 6px' }}>{VARSAYILAN_KURALLAR[s].kaynak}{VARSAYILAN_KURALLAR[s].dogrulanmayan ? <> · <span style={{ color: '#7A5B1E' }}>öneri — hekim kilitler: {VARSAYILAN_KURALLAR[s].dogrulanmayan}</span></> : null}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {dozlar.map((no) => (
                  <React.Fragment key={no}>
                    {k.minYasGun[no] != null && (
                      <label style={{ ...kucuk, display: 'grid', gap: 2 }}>{no}. doz min. yaş (gün · {gunMetni(k.minYasGun[no])})
                        <input defaultValue={k.minYasGun[no]} onBlur={(e) => degistir(s, 'minYasGun', no, e.target.value)} inputMode="numeric" aria-label={`${SERI_AD[s]} ${no}. doz minimum yaş`} style={{ ...input, width: 110 }} />
                      </label>
                    )}
                    {k.minAralikGun[no] != null && (
                      <label style={{ ...kucuk, display: 'grid', gap: 2 }}>{no - 1}→{no}. doz min. aralık (gün)
                        <input defaultValue={k.minAralikGun[no]} onBlur={(e) => degistir(s, 'minAralikGun', no, e.target.value)} inputMode="numeric" aria-label={`${SERI_AD[s]} ${no}. doz minimum aralık`} style={{ ...input, width: 110 }} />
                      </label>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {Object.keys(onAyar).length > 0 && <button type="button" onClick={() => kaydet({})} style={{ ...ghost, marginTop: 10 }}>Varsayılana dön</button>}
    </div>
  );
}
