'use client';
/**
 * PEDI-ARACLAR-02 — Araçlar › Gelişim taraması paneli: "bu vizitte hangi tarama gerekli?" (engines/gelisimPlan.ts).
 * Doğum tarihi (ya da "14 aylık") yeter; liste yazdıkça güncellenir. Hasta seçiliyse kayıtlar okunur ve hekim taramayı
 * işaretler. M-CHAT-R/F ve GİDR için hasta dosyasındaki bileşenler OLDUĞU GİBİ takılır (HastaMchat, HastaGelisimTaramasi) —
 * "Bugünkü Muayene Formuna Ekle" aynı yol (gununNotunaEkle). Diğer taramalar /api/doktor/pediatri/tarama ile aynı yoldan
 * nota eklenir; hiçbir şey hekim basmadan nota yazılmaz.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import HastaMchat from '@/components/doktor/HastaMchat';
import HastaGelisimTaramasi from '@/components/doktor/HastaGelisimTaramasi';
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon';
import { GELISIM_ALAN_BASLIK } from '@/lib/clinical/gelisimTaramasi';
import {
  vizitPlani, vizitOzetMetni, KALEM_DURUM_AD, SONUC_AD,
  type TaramaKalemi, type TaramaKaydi, type MchatKaydi, type GidrKaydi, type TaramaSonuc, type TaramaTur, type KalemDurum, type IzlemDurumu,
} from '../../engines/gelisimPlan';
import { dogumVeyaYasCoz, gebelikHaftasiCoz, gramCoz, tarihCoz, tarihGoster, yasMetni } from '../../engines/girdi';
import {
  pediStil, Alan, Katlanir, TaslakNotu, KopyalaButonu, PediHastaSecici, usePediHasta, useUrlHasta, Rozet, OneriRozet, Istatistik,
} from './PediAracKabugu';

const { kutu, etiket, kucuk, input, ghost, btn, uyari } = pediStil;
const bugunTr = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);

const TON: Record<KalemDurum, 'iyi' | 'uyari' | 'kirmizi' | 'notr' | 'bilgi'> = { simdi: 'bilgi', gecikti: 'kirmizi', dikkat: 'kirmizi', tamam: 'iyi', yaklasiyor: 'uyari', surekli: 'notr' };
const IZLEM_TON: Record<IzlemDurumu['durum'], 'iyi' | 'uyari' | 'kirmizi' | 'notr' | 'bilgi'> = { yapildi: 'iyi', kacirildi: 'kirmizi', simdi: 'bilgi', gelecek: 'notr', bilinmiyor: 'notr' };
const IZLEM_AD: Record<IzlemDurumu['durum'], string> = { yapildi: 'muayene var', kacirildi: 'kaçırıldı', simdi: 'şimdi', gelecek: 'planlı', bilinmiyor: 'geçti' };

/** Tür başına hekimin seçebileceği sonuçlar. */
const SONUC_SECENEK: Record<TaramaTur, Array<[TaramaSonuc, string]>> = {
  isitme: [['normal', 'Geçti'], ['ileri_degerlendirme', 'Geçemedi — ileri değerlendirme']],
  kirmizi_refle: [['normal', 'Normal'], ['sevk', 'Anormal — sevk']],
  gorme: [['normal', 'Normal'], ['sevk', 'Sevk']],
  rop: [['sevk', 'Yönlendirildi'], ['normal', 'Muayene normal']],
  otizm: [['normal', 'Risk yok'], ['sevk', 'Risk — sevk']],
  dvit: [['yapildi', 'Başlandı / sürüyor']],
  demir: [['yapildi', 'Başlandı / sürüyor']],
  hb: [['normal', 'Normal'], ['ileri_degerlendirme', 'Anemi — hekim planı']],
};

interface SunucuVeri { taramalar: TaramaKaydi[]; mchat: MchatKaydi[]; gidr: GidrKaydi[]; seanslar: string[]; taramaTablosu: boolean; dogumBilgisi: { gebelikHaftasi: number | null; kiloGram: number | null } | null }

export default function GelisimPaneli() {
  const [hastaId, setHastaId] = useState('');
  useUrlHasta(setHastaId);
  const { ozet, hata: hastaHata } = usePediHasta(hastaId);
  const [dogumHam, setDogumHam] = useState('');
  const [gebelikHam, setGebelikHam] = useState('');
  const [kiloHam, setKiloHam] = useState('');
  const [veri, setVeri] = useState<SunucuVeri | null>(null);
  const [veriHata, setVeriHata] = useState('');
  const [yerel, setYerel] = useState<TaramaKaydi[]>([]);
  const [acikArac, setAcikArac] = useState<'mchat' | 'gidr' | null>(null);
  const bugun = bugunTr();

  const yukle = useCallback(async (id: string) => {
    setVeriHata('');
    if (!id) { setVeri(null); return; }
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch(`/api/doktor/pediatri/tarama?patientId=${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (r.ok) setVeri(j); else setVeriHata(j.error || 'Tarama kayıtları alınamadı.');
    } catch { setVeriHata('Tarama kayıtları alınamadı — bağlantıyı kontrol edin.'); }
  }, []);
  useEffect(() => { setYerel([]); setAcikArac(null); yukle(hastaId); }, [hastaId, yukle]);
  useEffect(() => {
    if (ozet?.dogumIso) setDogumHam(tarihGoster(ozet.dogumIso));
    const d = ozet?.dogumBilgisi || veri?.dogumBilgisi;
    if (d?.gebelikHaftasi != null) setGebelikHam(String(d.gebelikHaftasi).replace('.', ','));
    if (d?.kiloGram != null) setKiloHam(`${d.kiloGram} g`);
  }, [ozet, veri?.dogumBilgisi]);

  const dogum = dogumVeyaYasCoz(dogumHam, bugun);
  const dogumIso = dogum && dogum.iso <= bugun ? dogum.iso : null;
  const gebelikHaftasi = gebelikHaftasiCoz(gebelikHam);
  const dogumKiloGr = gramCoz(kiloHam);

  const plan = useMemo(() => (dogumIso ? vizitPlani({
    dogumIso, bugunIso: bugun, gebelikHaftasi, dogumKiloGr,
    taramalar: [...(veri?.taramalar || []), ...yerel], mchat: veri?.mchat, gidr: veri?.gidr, seanslar: hastaId && veri ? veri.seanslar : undefined,
  }) : null), [dogumIso, bugun, gebelikHaftasi, dogumKiloGr, veri, yerel, hastaId]);

  const sayi = (d: KalemDurum) => plan?.kalemler.filter((k) => k.durum === d).length || 0;
  const dogumIpucu = dogumHam && !dogum ? 'Okunamadı — ör. 12.03.2025 veya "14 aylık"'
    : dogum && dogum.iso > bugun ? 'Doğum tarihi bugünden sonra olamaz'
      : dogumIso ? `${yasMetni(dogumIso, bugun)}${dogum?.yaklasik ? ' · yaştan hesaplandı (yaklaşık)' : ''}` : 'gg.aa.yyyy — ya da yaş: "14 aylık", "3 haftalık"';

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Hasta (isteğe bağlı — kayıtlar okunur, tarama işaretlenir ve nota eklenebilir)</div>
        <PediHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        {(hastaHata || veriHata) && <div style={{ ...pediStil.hata, marginTop: 6 }}>{hastaHata || veriHata}</div>}
        {veri && !veri.taramaTablosu && <div style={{ ...uyari, marginTop: 8 }}>Tarama kayıt tablosu henüz hazır değil — liste çalışır, işaretleme kaydedilemeyebilir.</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 14 }}>
          <Alan etiket="Doğum tarihi veya yaş" ipucu={dogumIpucu}>
            <input value={dogumHam} onChange={(e) => setDogumHam(e.target.value)} placeholder="12.03.2025" aria-label="Doğum tarihi veya yaş" style={input} />
          </Alan>
        </div>
        <Katlanir baslik="Prematüre · doğum ağırlığı" rozet={gebelikHaftasi != null || dogumKiloGr != null ? 'girildi' : undefined} acik={!!(ozet?.dogumBilgisi || veri?.dogumBilgisi)}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
            <Alan etiket="Gebelik haftası" ipucu={gebelikHam && gebelikHaftasi == null ? 'Okunamadı — ör. 32+4' : '32 · 32+4'}>
              <input value={gebelikHam} onChange={(e) => setGebelikHam(e.target.value)} placeholder="hafta" aria-label="Gebelik haftası" inputMode="decimal" style={input} />
            </Alan>
            <Alan etiket="Doğum ağırlığı" ipucu={kiloHam && dogumKiloGr == null ? 'Okunamadı — ör. 1850 veya 1,85 kg' : dogumKiloGr != null ? `= ${dogumKiloGr} g` : '1850 · 1,85 kg'}>
              <input value={kiloHam} onChange={(e) => setKiloHam(e.target.value)} placeholder="gram" aria-label="Doğum ağırlığı" inputMode="decimal" style={input} />
            </Alan>
          </div>
          <div style={{ ...kucuk, marginTop: 8 }}>≤ 37 haftada doğanlarda gelişim (GİDR) düzeltilmiş yaşla değerlendirilir; aşılar takvim yaşıyla. ≤ 32 hafta ya da ≤ 1500 g: ROP yönlendirmesi, &lt; 2500 g: demir 2. aydan.</div>
        </Katlanir>
      </div>

      <div style={{ ...kutu, borderColor: plan ? 'rgba(45,212,191,0.3)' : 'rgba(255,255,255,0.1)' }} aria-live="polite">
        {!plan ? (
          <div style={{ ...kucuk, fontSize: 14 }}>Doğum tarihini (ya da yaşı) yazın — bu vizitte gereken taramalar yazdıkça listelenir.</div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: '#9BB0C7', marginBottom: 4 }}>{yasMetni(dogumIso!, bugun)}{plan.duzeltilmisGun != null ? ` · düzeltilmiş ${plan.duzeltilmisGun < 31 ? `${plan.duzeltilmisGun} gün` : `${Math.floor(plan.duzeltilmisGun / 30.4375)} ay`} (gelişim için)` : ''}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#EDF1F7', letterSpacing: '-0.3px' }}>
              {plan.simdikiVizit ? `${plan.simdikiVizit.etiket} izlemi` : 'İzlem penceresi dışında'}
            </div>
            <div style={{ ...kucuk, marginTop: 2 }}>
              {plan.simdikiVizit ? `Pencere ${tarihGoster(plan.simdikiVizit.bas)} – ${tarihGoster(plan.simdikiVizit.son)}` : 'Taramalar yine de aşağıda.'}
              {plan.sonrakiVizit ? ` · Sonraki: ${plan.sonrakiVizit.etiket} (${tarihGoster(plan.sonrakiVizit.bas)})` : ''}
              {(plan.simdikiVizit && !plan.simdikiVizit.dogrulandi) ? ' · ' : ''}
            </div>
            {plan.simdikiVizit && !plan.simdikiVizit.dogrulandi && <div style={{ marginTop: 6 }}><OneriRozet /> <span style={kucuk}>Bu yaşın gün penceresi protokolde yazılı değil.</span></div>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
              <Istatistik deger={sayi('simdi')} etiket="bu vizitte" ton={sayi('simdi') ? 'iyi' : 'notr'} />
              <Istatistik deger={sayi('gecikti') + sayi('dikkat')} etiket="gecikmiş / dikkat" ton={sayi('gecikti') + sayi('dikkat') ? 'kirmizi' : 'notr'} />
              <Istatistik deger={sayi('tamam')} etiket="tamamlanan" />
            </div>
          </>
        )}
      </div>

      {plan && (
        <>
          <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
            {plan.kalemler.map((k) => (
              <KalemKarti key={k.kod + k.ad} k={k} hastaId={hastaId} bugun={bugun} dogumIso={dogumIso!}
                acikArac={acikArac} setAcikArac={setAcikArac}
                yerelIsaretle={(x) => setYerel((y) => [...y, x])}
                kaydedildi={() => yukle(hastaId)}
                gidrMaddeleri={k.kod === 'gidr' && plan.gidrBasamak ? plan.gidrBasamak : null} />
            ))}
          </div>

          <div style={kutu}>
            <Katlanir baslik="İzlem takvimi (SB İzlem Protokolü)" rozet={hastaId && veri ? `${plan.izlem.filter((v) => v.durum === 'kacirildi').length} kaçırılan` : undefined}>
              <div style={{ ...kucuk, marginBottom: 8 }}>{hastaId && veri ? 'Pencere içinde muayene kaydı varsa "muayene var".' : 'Hasta seçerseniz muayene kayıtlarıyla eşleştirilir.'}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {plan.izlem.map((v) => (
                  <span key={v.id} title={`${tarihGoster(v.bas)} – ${tarihGoster(v.son)}`} style={{ display: 'inline-flex', gap: 6, alignItems: 'center', padding: '6px 10px', borderRadius: 10, background: 'rgba(0,0,0,0.16)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 13, color: '#EDF1F7' }}>
                    {v.etiket} <Rozet ton={IZLEM_TON[v.durum]}>{IZLEM_AD[v.durum]}</Rozet>
                  </span>
                ))}
              </div>
            </Katlanir>
          </div>

          <div style={{ ...pediStil.satir, marginBottom: 14 }}>
            <KopyalaButonu metin={vizitOzetMetni(plan)} etiket="Vizit özetini kopyala" />
            {hastaId && <a href={`/doktor-tools/pedi-asi?hasta=${encodeURIComponent(hastaId)}`} style={ghost}>Aşı planını aç</a>}
            <a href="/doktor-tools/pedi-buyume" style={ghost}>Büyüme & persentil</a>
          </div>
        </>
      )}
      <TaslakNotu>Liste karar desteğidir; hangi taramanın yapılacağına ve sonucuna hekim karar verir. Nota yalnız "Bugünkü Muayene Formuna Ekle"ye bastığınızda tek satır eklenir. Kaynak: T.C. SB Bebek, Çocuk, Ergen İzlem Protokolleri 2018 · HSGM Yenidoğan İşitme Taraması protokolü · GİDR · M-CHAT-R/F resmi Türkçe çeviri. &quot;Öneri — hekim kilitler&quot; rozetli pencereler protokolde sayısal olarak yazılı değildir.</TaslakNotu>
    </>
  );
}

function KalemKarti({ k, hastaId, bugun, dogumIso, acikArac, setAcikArac, yerelIsaretle, kaydedildi, gidrMaddeleri }: {
  k: TaramaKalemi; hastaId: string; bugun: string; dogumIso: string;
  acikArac: 'mchat' | 'gidr' | null; setAcikArac: (x: 'mchat' | 'gidr' | null) => void;
  yerelIsaretle: (x: TaramaKaydi) => void; kaydedildi: () => void;
  gidrMaddeleri: import('@/lib/clinical/gelisimTaramasi').GelisimYasBasamagi | null;
}) {
  const [secim, setSecim] = useState<TaramaSonuc | null>(null);
  const [tarihHam, setTarihHam] = useState('');
  const [notHam, setNotHam] = useState('');
  const [gonderiyor, setGonderiyor] = useState(false);
  const [mesaj, setMesaj] = useState('');
  const [notId, setNotId] = useState<string | null>(null);
  const tur = k.kod as TaramaTur;
  const isaretlenebilir = k.arac === 'isaret' && tur in SONUC_SECENEK;
  const tarihIso = tarihHam ? tarihCoz(tarihHam) : bugun;
  const tarihGecerli = !!tarihIso && tarihIso <= bugun && tarihIso >= dogumIso;

  const kaydet = async (notaEkle: boolean) => {
    if (!secim || !tarihGecerli) return;
    if (!hastaId) { yerelIsaretle({ tur, tarih: tarihIso!, sonuc: secim }); setSecim(null); setMesaj('Bu ekranda işaretlendi (hasta seçilmedi — kayda yazılmadı).'); return; }
    setGonderiyor(true); setMesaj(''); setNotId(null);
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/pediatri/tarama', { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: hastaId, tur, sonuc: secim, tarih: tarihIso, not: notHam, muayeneFormunaEkle: notaEkle }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setMesaj(j.error || 'Kaydedilemedi — tekrar deneyin.'); return; }
      setMesaj(notaEkle ? (j.notEkleme?.eklendi ? 'Kaydedildi ve bugünkü muayene formuna eklendi.' : `Kaydedildi; nota eklenemedi: ${j.notEkleme?.sebep || 'bugünkü muayene bulunamadı'}`) : 'Kaydedildi.');
      if (j.notEkleme?.notId) setNotId(j.notEkleme.notId);
      setSecim(null); setNotHam(''); setTarihHam('');
      kaydedildi();
    } catch { setMesaj('Kaydedilemedi — bağlantıyı kontrol edin.'); }
    finally { setGonderiyor(false); }
  };

  const vurgu = k.durum === 'gecikti' || k.durum === 'dikkat';
  return (
    <div style={{ ...kutu, marginBottom: 0, borderColor: vurgu ? 'rgba(248,113,113,0.35)' : k.durum === 'simdi' ? 'rgba(96,165,250,0.3)' : 'rgba(255,255,255,0.1)' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, flex: '1 1 220px' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#EDF1F7' }}>{k.ad}</div>
          <div style={{ ...kucuk, marginTop: 2 }}>{k.pencere}{k.son ? ` · son: ${k.son.sonuc}, ${tarihGoster(k.son.tarih)}` : ''}</div>
        </div>
        <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {!k.dogrulandi && <OneriRozet />}
          <Rozet ton={TON[k.durum]}>{KALEM_DURUM_AD[k.durum]}</Rozet>
        </span>
      </div>
      <div style={{ ...pediStil.metin, marginTop: 8 }}>{k.ne}</div>
      <div style={{ ...kucuk, marginTop: 4 }}>{k.kaynak}</div>

      {isaretlenebilir && !(k.durum === 'surekli' && (tur === 'dvit' || tur === 'demir')) && (
        <div style={{ marginTop: 10 }}>
          <div style={{ ...pediStil.satir, marginTop: 0 }}>
            {SONUC_SECENEK[tur].map(([s, ad]) => (
              <button key={s} type="button" aria-pressed={secim === s} onClick={() => setSecim(secim === s ? null : s)} style={{ ...ghost, ...(secim === s ? { background: 'rgba(15,155,142,0.22)', color: '#5EEAD4', borderColor: 'rgba(45,212,191,0.5)' } : {}) }}>{ad}</button>
            ))}
          </div>
          {secim && (
            <div style={{ background: 'rgba(0,0,0,0.18)', borderRadius: 12, padding: 10, marginTop: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                <Alan etiket="Tarih" ipucu={tarihHam && !tarihGecerli ? 'Doğumla bugün arasında bir tarih — ör. 18.09.2026' : undefined}>
                  <input value={tarihHam} onChange={(e) => setTarihHam(e.target.value)} placeholder={`bugün (${tarihGoster(bugun)})`} aria-label={`${k.ad} tarihi`} inputMode="decimal" style={input} />
                </Alan>
                <Alan etiket="Not (isteğe bağlı)">
                  <input value={notHam} onChange={(e) => setNotHam(e.target.value)} placeholder="kısa ayrıntı (nota eklenir)" aria-label={`${k.ad} notu`} maxLength={200} style={input} />
                </Alan>
              </div>
              <div style={{ ...pediStil.satir }}>
                <button type="button" disabled={gonderiyor || !tarihGecerli} onClick={() => kaydet(false)} style={{ ...ghost, opacity: tarihGecerli ? 1 : 0.5 }}>{hastaId ? 'Sadece kaydet' : 'Bu ekranda işaretle'}</button>
                {hastaId && <button type="button" disabled={gonderiyor || !tarihGecerli} onClick={() => kaydet(true)} style={{ ...btn, opacity: gonderiyor || !tarihGecerli ? 0.6 : 1 }}>{gonderiyor ? 'Kaydediliyor…' : 'Bugünkü Muayene Formuna Ekle'}</button>}
              </div>
              <div style={{ ...kucuk, marginTop: 6 }}>Nota eklenecek satır: “{`${k.ad.replace(/\s*\(.*\)$/, '')}: ${SONUC_AD[secim]}`}…” — siz basmadan yazılmaz.</div>
            </div>
          )}
          {mesaj && <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}><span style={{ fontSize: 13, color: /eklenemedi|edilemedi|kontrol/.test(mesaj) ? '#FDE68A' : '#5EEAD4' }}>{mesaj}</span><MuayeneFormunaDon notId={notId} /></div>}
        </div>
      )}

      {k.arac === 'mchat' && (
        hastaId ? (
          <div style={{ marginTop: 10 }}>
            <button type="button" onClick={() => setAcikArac(acikArac === 'mchat' ? null : 'mchat')} aria-expanded={acikArac === 'mchat'} style={{ ...btn }}>{acikArac === 'mchat' ? 'M-CHAT-R/F formunu kapat' : 'M-CHAT-R/F uygula'}</button>
            {acikArac === 'mchat' && <div style={{ marginTop: 12, ...pediStil.kaydir }}><HastaMchat patientId={hastaId} /></div>}
          </div>
        ) : <div style={{ ...kucuk, marginTop: 8 }}>M-CHAT-R/F'yi uygulamak ve sonucu kayda / bugünkü muayene formuna eklemek için yukarıdan hasta seçin.</div>
      )}

      {k.arac === 'gidr' && (
        hastaId ? (
          <div style={{ marginTop: 10 }}>
            <button type="button" onClick={() => setAcikArac(acikArac === 'gidr' ? null : 'gidr')} aria-expanded={acikArac === 'gidr'} style={{ ...btn }}>{acikArac === 'gidr' ? 'GİDR formunu kapat' : 'GİDR ile değerlendir'}</button>
            {acikArac === 'gidr' && <div style={{ marginTop: 12, ...pediStil.kaydir }}><HastaGelisimTaramasi patientId={hastaId} /></div>}
            <div style={{ ...kucuk, marginTop: 6 }}>Kayıt ekranı yaş basamağını takvim yaşından seçer; prematürede düzeltilmiş yaşı göz önünde tutun.</div>
          </div>
        ) : gidrMaddeleri ? (
          <Katlanir baslik={`GİDR ${gidrMaddeleri.etiket} — beklenen işlevler`}>
            <div style={{ display: 'grid', gap: 6 }}>
              {gidrMaddeleri.maddeler.map((m) => <div key={m.madde} style={kucuk}><b style={{ color: '#C9D4E3' }}>{GELISIM_ALAN_BASLIK[m.alan]}:</b> {m.madde}</div>)}
            </div>
            <div style={{ ...kucuk, marginTop: 8 }}>Kaydetmek ve nota eklemek için hasta seçin.</div>
          </Katlanir>
        ) : null
      )}
    </div>
  );
}
