'use client';
/**
 * Araçlar › Doğum & Analık Rapor Asistanı. TDT → SGK analık istirahati (7578 s.K., RG 01.05.2026: tekil 8 + 16 hafta,
 * çoğul 10 + 16 hafta); erken / geç doğumda yeniden hesap; istirahat raporu TASLAĞI (hekim kilitler) + emzirme ödeneği notu.
 * Canlı Medula / e-imza gönderimi YOK — göz SGK rapor aracındaki gibi "Medula'da hekim e-imza ile girilir".
 */
import React, { useEffect, useMemo, useState } from 'react';
import { analikIzni, istirahatRaporuTaslagi, eddHesapla, tarihOku, trTarih, RAPORSUZ_ISTIRAHAT_UYARISI, EMZIRME_ODENEGI_NOTU, ANALIK } from '../../engines/araclar';
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';
import { kdStil, Segment, Kutu, Etiketli, KdHastaSecici, MuayeneFormunaEkle, kdHastaOzeti, panoya } from './KdAracKabugu';

const { kutu, etiket, kucuk, metin, satir, input, btn, ghost, hata } = kdStil;
const bugunIso = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);

function Tarih({ ad, t, alt, vurgu }: { ad: string; t: string; alt?: string; vurgu?: boolean }) {
  return (
    <div style={{ flex: '1 1 150px', background: vurgu ? 'rgba(219,39,119,0.12)' : 'rgba(0,0,0,0.15)', border: `1px solid ${vurgu ? 'rgba(244,114,182,0.45)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: '10px 12px' }}>
      <div style={kucuk}>{ad}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: vurgu ? '#F9A8D4' : '#EDF1F7' }}>{trTarih(t)}</div>
      {alt && <div style={kucuk}>{alt}</div>}
    </div>
  );
}

export default function DogumRaporAraci() {
  const [kaynak, setKaynak] = useState<'tdt' | 'sat'>('tdt');
  const [ham, setHam] = useState({ tdt: '', sat: '', dogum: '', bugun: bugunIso() });
  const [cogul, setCogul] = useState(false);
  const [dogdu, setDogdu] = useState(false);
  const [ayrinti, setAyrinti] = useState(false);
  const [calisma, setCalisma] = useState(0);
  const [hekimNotu, setHekimNotu] = useState('');
  const [kilitli, setKilitli] = useState(false);
  const [hasta, setHasta] = useState({ id: '', ad: '' });
  const [mesaj, setMesaj] = useState('');
  const [kopya, setKopya] = useState('');
  const set = (k: keyof typeof ham, v: string) => { setHam((p) => ({ ...p, [k]: v })); setKilitli(false); setKopya(''); };

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const tdt = tarihOku(q.get('tdt'));
    if (tdt) setHam((p) => ({ ...p, tdt: trTarih(tdt) }));
    if (q.get('cogul') === '1') setCogul(true);
  }, []);

  const hastadanDoldur = async (id: string, ad: string) => {
    setHasta({ id, ad }); setMesaj(''); setKilitli(false);
    if (!id) return;
    try {
      const o = await kdHastaOzeti(id);
      if (!o.gebelikVar || (!o.tdt && !o.sat)) { setMesaj('Bu hastada gebelik kaydı yok — TDT\'yi elle girin.'); return; }
      if (o.tdt) { setKaynak('tdt'); setHam((p) => ({ ...p, tdt: trTarih(o.tdt) })); } else { setKaynak('sat'); setHam((p) => ({ ...p, sat: trTarih(o.sat) })); }
      setCogul(o.cogul);
      if (o.dogumTarihi) { setDogdu(true); setHam((p) => ({ ...p, dogum: trTarih(o.dogumTarihi) })); }
      setMesaj('Gebelik kaydından dolduruldu — kontrol edin.');
    } catch (e) { setMesaj(e instanceof Error ? e.message : 'Hasta verisi yüklenemedi'); }
  };

  const tdt = kaynak === 'tdt' ? tarihOku(ham.tdt) : (() => { const e = eddHesapla({ yontem: 'sat', sat: tarihOku(ham.sat) }); return e.ok ? e.edd : null })();
  const dogum = dogdu ? tarihOku(ham.dogum) : null;
  const bugun = tarihOku(ham.bugun) || bugunIso();
  const a = useMemo(() => (tdt ? analikIzni({ edd: tdt, cogul, dogumTarihi: dogum, calismaGun: calisma, bugun }) : null), [tdt, cogul, dogum, calisma, bugun]);
  const taslak = a ? istirahatRaporuTaslagi(a, { cogul, eddYontemi: kaynak === 'tdt' ? 'TDT' : 'SAT (Naegele)', hekimNotu }) : '';
  const girisHam = kaynak === 'tdt' ? ham.tdt : ham.sat;
  const kopyala = async (m: string, ok: string) => setKopya((await panoya(m)) ? ok : 'Pano erişimi yok — metni elle seçin.');

  // Görsel şerit: doğum öncesi | doğum sonrası (eklenen günler ayrı tonda)
  const serit = a ? [
    { ad: 'Doğum öncesi', gun: a.kullanilanOncesiGun || (a.dogumGercek ? 0 : a.oncesiPlanGun - a.calismaGun), renk: '#DB2777' },
    { ad: 'Doğum sonrası', gun: a.sonrasiTemelGun, renk: '#7C3AED' },
    { ad: 'Eklenen', gun: a.sonrasiEklenenGun, renk: '#A78BFA' },
  ].filter((x) => x.gun > 0) : [];
  const seritToplam = serit.reduce((s, x) => s + x.gun, 0) || 1;

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Gebelik</div>
        <div style={satir}>
          <Segment etiket="Tarih kaynağı" deger={kaynak} set={(x) => { setKaynak(x); setKilitli(false); }} secenekler={[['tdt', 'TDT'], ['sat', 'SAT']]} />
          <Segment etiket="Tekil veya çoğul" deger={cogul ? 'cogul' : 'tekil'} set={(x) => { setCogul(x === 'cogul'); setKilitli(false); }} secenekler={[['tekil', 'Tekil'], ['cogul', 'Çoğul']]} />
        </div>
        <div style={satir}>
          <Etiketli ad={kaynak === 'tdt' ? 'Tahmini doğum tarihi' : 'Son adet tarihi'}><input inputMode="numeric" value={girisHam} onChange={(e) => set(kaynak, e.target.value)} placeholder={kaynak === 'tdt' ? 'Tahmini doğum tarihi — 20.11.2026' : 'Son adet tarihi — 13.02.2026'} aria-label={kaynak === 'tdt' ? 'Tahmini doğum tarihi' : 'Son adet tarihi'} style={{ ...input, width: 280, maxWidth: '100%' }} /></Etiketli>
          {girisHam.trim() && (tdt ? <span style={{ ...kucuk, color: '#6EE7B7' }}>→ TDT {trTarih(tdt)}</span> : <span style={hata}>Okunamadı</span>)}
        </div>
        <Kutu on={dogdu} set={(x) => { setDogdu(x); setKilitli(false); }}>Doğum gerçekleşti — gerçek doğum tarihiyle yeniden hesapla</Kutu>
        {dogdu && (
          <div style={satir}>
            <Etiketli ad="Doğum tarihi"><input inputMode="numeric" value={ham.dogum} onChange={(e) => set('dogum', e.target.value)} placeholder="Doğum tarihi — 05.11.2026" aria-label="Doğum tarihi" style={{ ...input, width: 240, maxWidth: '100%' }} /></Etiketli>
            {ham.dogum.trim() && (dogum ? <span style={{ ...kucuk, color: '#6EE7B7' }}>→ {trTarih(dogum)}</span> : <span style={hata}>Okunamadı</span>)}
          </div>
        )}
        <div style={satir}><button type="button" onClick={() => setAyrinti(!ayrinti)} style={ghost} aria-expanded={ayrinti}>{ayrinti ? 'Ayrıntıları gizle' : 'Ayrıntılar: çalışma izni, hesap tarihi, hasta, not'}</button></div>
        {ayrinti && (
          <div style={{ marginTop: 6 }}>
            <div style={{ ...metin, marginTop: 6 }}>Hekim onayıyla doğum öncesi çalışılan gün</div>
            <div style={satir}>
              <input type="range" min={0} max={a?.calismaUstSinir ?? 42} step={1} value={calisma} onChange={(e) => { setCalisma(Number(e.target.value)); setKilitli(false); }} aria-label="Doğum öncesi çalışılan gün" style={{ flex: '1 1 220px', minHeight: 44 }} />
              <b style={{ ...metin, minWidth: 70 }}>{calisma} gün</b>
            </div>
            <div style={kucuk}>İş K. md. 74 (7578 s.K. ile değişik): sağlık durumu uygunsa ve hekim onaylarsa doğuma 2 hafta kalana kadar çalışılabilir; çalışılan süre doğum sonrasına eklenir.</div>
            <div style={satir}><span style={kucuk}>Hesap tarihi</span><input inputMode="numeric" value={ham.bugun} onChange={(e) => set('bugun', e.target.value)} aria-label="Hesap tarihi" style={{ ...input, width: 150 }} /></div>
            <div style={{ marginTop: 8 }}><div style={kucuk}>Hasta (isteğe bağlı)</div><KdHastaSecici secili={hasta.id} sec={hastadanDoldur} /></div>
            <div style={satir}><textarea value={hekimNotu} onChange={(e) => { setHekimNotu(e.target.value); setKilitli(false); }} placeholder="Taslağa eklenecek hekim notu (isteğe bağlı)" aria-label="Hekim notu" rows={2} style={{ ...input, width: '100%', fontFamily: 'inherit' }} /></div>
          </div>
        )}
        {mesaj && <div style={{ ...kucuk, marginTop: 6, color: '#F9A8D4' }}>{mesaj}</div>}
      </div>

      {!a ? (
        <div style={{ ...kutu, textAlign: 'center', padding: '28px 18px' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#C9D4E3', marginBottom: 6 }}>Analık tarihleri için TDT yeterli</div>
          <div style={{ ...kucuk, fontSize: 14 }}>Tahmini doğum tarihini (veya SAT) girin; tarihler anında hesaplanır.</div>
        </div>
      ) : (
        <div aria-live="polite">
          <div style={kutu}>
            <div style={etiket}>Analık istirahati — {cogul ? 'çoğul' : 'tekil'} gebelik</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Tarih ad="Doğum öncesi rapor başlangıcı" t={a.raporBaslangic} alt={`${a.raporBaslangicHafta} hafta`} vurgu />
              <Tarih ad={a.dogumGercek ? 'Doğum' : 'Tahmini doğum'} t={a.dogum} alt={a.sapma === 'erken' ? `${-a.sapmaGun} gün erken` : a.sapma === 'gec' ? `${a.sapmaGun} gün geç` : undefined} />
              <Tarih ad="Doğum sonrası bitiş" t={a.sonrasiBitis} alt={`${a.sonrasiGun} gün`} />
              <Tarih ad="İşbaşı" t={a.isBasi} />
            </div>
            <div style={{ display: 'flex', height: 14, borderRadius: 999, overflow: 'hidden', marginTop: 14, background: 'rgba(255,255,255,0.06)' }} aria-hidden>
              {serit.map((s) => <div key={s.ad} style={{ width: `${(s.gun / seritToplam) * 100}%`, background: s.renk }} />)}
            </div>
            <div style={{ ...satir, marginTop: 6 }}>{serit.map((s) => <span key={s.ad} style={{ ...kucuk, display: 'inline-flex', gap: 6, alignItems: 'center' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: s.renk, display: 'inline-block' }} />{s.ad} {s.gun} gün</span>)}</div>
            <div style={{ ...metin, marginTop: 10, fontWeight: 700 }}>Toplam {a.dogumGercek ? a.toplamGun : a.oncesiPlanGun - a.calismaGun + a.sonrasiGun} gün · {a.bugunDurum}</div>
            <ul style={{ ...metin, margin: '8px 0 0', paddingLeft: 18 }}>{a.aciklama.map((x) => <li key={x}>{x}</li>)}</ul>
            <div style={{ ...kucuk, marginTop: 8 }}>1 Mayıs 2026'dan itibaren doğum sonrası süre {ANALIK.dogumSonrasiHafta} haftadır (önce 8 hafta). Toplam tekilde 24, çoğulda 26 hafta.</div>
          </div>

          <div role="note" style={{ background: 'rgba(220,38,38,0.12)', border: '2px solid rgba(248,113,113,0.6)', borderRadius: 16, padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#FCA5A5', letterSpacing: '1px', textTransform: 'uppercase' }}>Hastaya söyleyin — ödenek kaybı</div>
            <div style={{ fontSize: 16, color: '#FEE2E2', lineHeight: 1.55, marginTop: 6 }}>{RAPORSUZ_ISTIRAHAT_UYARISI}</div>
            <div style={satir}><button type="button" style={ghost} onClick={() => kopyala(RAPORSUZ_ISTIRAHAT_UYARISI, 'Uyarı metni kopyalandı.')}>Uyarıyı kopyala</button></div>
            <div style={{ ...kucuk, marginTop: 4 }}>Kaynak: SGK — Analık Halinde Geçici İş Göremezlik Ödeneği Ödenmesi.</div>
          </div>

          <div style={kutu}>
            <div style={etiket}>İstirahat raporu taslağı</div>
            <pre style={{ ...metin, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, opacity: kilitli ? 1 : 0.9 }}>{taslak}</pre>
            <div style={satir}>
              {!kilitli
                ? <button type="button" style={btn} onClick={() => { setKilitli(true); setKopya(''); }}>Kontrol ettim — taslağı kilitle</button>
                : <>
                  <button type="button" style={btn} onClick={() => kopyala(taslak, 'Taslak kopyalandı.')}>Taslağı kopyala</button>
                  <button type="button" style={ghost} onClick={() => setKilitli(false)}>Kilidi aç</button>
                </>}
              <span style={{ ...ghost, display: 'inline-flex', alignItems: 'center', cursor: 'default' }} title="Notya Medula'ya canlı gönderim yapmaz">Medula'da hekim e-imza ile girilir</span>
              {hasta.id && <a href={hastaDosyaHref(hasta.id, 'gebelik')} style={{ ...ghost, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Hastada aç (Gebelik) →</a>}
            </div>
            {kopya && <div style={{ ...kucuk, color: '#F9A8D4', marginTop: 6 }}>{kopya}</div>}
            <MuayeneFormunaEkle
              hastaId={hasta.id}
              arac="Analık istirahati tarihleri"
              satirlar={[
                `${cogul ? 'Çoğul' : 'Tekil'} gebelik · doğum öncesi rapor başlangıcı ${a.raporBaslangic} (${a.raporBaslangicHafta} hafta)`,
                `${a.dogumGercek ? 'Doğum' : 'Tahmini doğum'}: ${a.dogum} · doğum sonrası bitiş ${a.sonrasiBitis} (${a.sonrasiGun} gün) · işbaşı ${a.isBasi}`,
                a.bugunDurum,
                ...a.aciklama,
              ]}
            />
            <div style={{ ...kucuk, marginTop: 8 }}>Taslak Medula'ya gönderilmez; nota yalnız yukarıdaki düğmeyle eklenir. T.C. kimlik no ve hasta adı Medula'da doldurulur.</div>
          </div>

          <div style={kutu}>
            <div style={etiket}>Emzirme ödeneği ve prim şartları — bilgi notu</div>
            <div style={metin}>{EMZIRME_ODENEGI_NOTU}</div>
            <div style={satir}><button type="button" style={ghost} onClick={() => kopyala(EMZIRME_ODENEGI_NOTU, 'Bilgi notu kopyalandı.')}>Notu kopyala</button></div>
            <div style={{ ...kucuk, marginTop: 8, borderLeft: '2px solid rgba(244,114,182,0.5)', paddingLeft: 8 }}>
              Dayanak: 5510 s.K. md. 16 ve 18, 4857 s.K. md. 74 — 7578 s.K. (RG 01.05.2026, sayı 33240) ile değişik; SGK Genelgesi 2026/13; SGK Analık Hali bilgi sayfası. Ödenek hesabı ve ödeme SGK'nındır; araç tutar hesaplamaz.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
