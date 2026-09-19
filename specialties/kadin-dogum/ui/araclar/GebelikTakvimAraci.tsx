'use client';
/**
 * Araçlar › Gebelik Takvimi & Tarama Pencereleri. SAT / USG / CRL / TDT → EDD (sat-edd) → DÖBYR 4 izlem (izlem-calendar) +
 * tarama pencereleri (test-windows). Pencere kaçırmak geri alınamaz: "kapanmak üzere" bandı sayfanın en üstünde, baskın.
 * Hesap tarayıcıda, anında; hasta seçilirse mevcut gebelik kaydından dolar (/api/doktor/gebelik — hekime kapsanmış). Nota yazmaz.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { eddHesapla, gebelikTakvimi, takvimHastaMetni, tarihOku, haftaOku, sayiOku, trTarih, PENCERE_DURUM_AD, type TarihlemeYontemi, type TakvimTarama, type TakvimIzlem, type WindowId } from '../../engines/araclar';
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';
import { kdStil, DURUM_RENK, Segment, Kutu, Etiketli, CiftSutun, KdHastaSecici, MuayeneFormunaEkle, kdHastaOzeti, panoya } from './KdAracKabugu';

const { kutu, etiket, kucuk, metin, satir, input, btn, ghost, hata } = kdStil;
const bugunIso = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);

function Durum({ d, kalan }: { d: TakvimTarama['durum']; kalan: number | null }) {
  const r = DURUM_RENK[d];
  const ek = d === 'kapaniyor' || d === 'acik' ? ` · ${kalan} gün` : d === 'yaklasiyor' ? ` · ${kalan} gün sonra` : '';
  return <span style={{ display: 'inline-block', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 700, color: r.fg, background: r.bg, border: `1px solid ${r.kenar}`, whiteSpace: 'nowrap' }}>{PENCERE_DURUM_AD[d]}{ek}</span>;
}

type Satir = { tur: 'izlem'; x: TakvimIzlem } | { tur: 'tarama'; x: TakvimTarama };

export default function GebelikTakvimAraci() {
  const [yontem, setYontem] = useState<TarihlemeYontemi>('sat');
  const [f, setF] = useState({ sat: '', usgTarih: '', usgHafta: '', crl: '', edd: '', bugun: bugunIso() });
  const [rh, setRh] = useState<'bilinmiyor' | 'neg' | 'poz'>('bilinmiyor');
  const [idc, setIdc] = useState<'bilinmiyor' | 'neg' | 'poz'>('bilinmiyor');
  const [cogul, setCogul] = useState(false);
  const [risk, setRisk] = useState<'dusuk' | 'orta' | 'yuksek'>('dusuk');
  const [yapilan, setYapilan] = useState<WindowId[]>([]);
  const [izlemHaftalari, setIzlemHaftalari] = useState<number[]>([]);
  const [ayrinti, setAyrinti] = useState(false);
  const [hasta, setHasta] = useState({ id: '', ad: '' });
  const [mesaj, setMesaj] = useState('');
  const [kopya, setKopya] = useState('');
  const set = (k: keyof typeof f, v: string) => { setF((p) => ({ ...p, [k]: v })); setKopya(''); };

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const tdt = tarihOku(q.get('tdt'));
    if (tdt) { setYontem('edd'); setF((p) => ({ ...p, edd: trTarih(tdt) })); }
  }, []);

  const hastadanDoldur = async (id: string, ad: string) => {
    setHasta({ id, ad }); setMesaj('');
    if (!id) return;
    try {
      const o = await kdHastaOzeti(id);
      if (!o.gebelikVar || (!o.sat && !o.tdt)) { setMesaj('Bu hastada aktif gebelik kaydı yok — tarihleri elle girin.'); return; }
      if (o.tdt && o.tdtKaynak === 'usg') { setYontem('edd'); setF((p) => ({ ...p, edd: trTarih(o.tdt) })); }
      else if (o.sat) { setYontem('sat'); setF((p) => ({ ...p, sat: trTarih(o.sat) })); }
      else { setYontem('edd'); setF((p) => ({ ...p, edd: trTarih(o.tdt) })); }
      setRh(o.rhNegatif == null ? 'bilinmiyor' : o.rhNegatif ? 'neg' : 'poz');
      setCogul(o.cogul); setRisk(o.riskSinifi); setYapilan(o.yapilanlar); setIzlemHaftalari(o.izlemHaftalari);
      setMesaj(`Gebelik kaydından dolduruldu — ${o.izlemHaftalari.length} izlem, ${o.yapilanlar.length} tamamlanmış tarama/tetkik. Kontrol edin.`);
    } catch (e) { setMesaj(e instanceof Error ? e.message : 'Hasta verisi yüklenemedi'); }
  };

  const okunan = {
    sat: tarihOku(f.sat), usgTarih: tarihOku(f.usgTarih), usgHafta: haftaOku(f.usgHafta), crl: sayiOku(f.crl), edd: tarihOku(f.edd), bugun: tarihOku(f.bugun) || bugunIso(),
  };
  const eddS = eddHesapla({ yontem, sat: okunan.sat, usgTarih: okunan.usgTarih, usgHafta: okunan.usgHafta, crlMm: okunan.crl, edd: okunan.edd });
  // USG ile tarihlenirken SAT da biliniyorsa farkı göster — hangisinin kilitleneceği hekimin kararı.
  const satEdd = yontem !== 'sat' && okunan.sat ? eddHesapla({ yontem: 'sat', sat: okunan.sat }) : null;
  const t = useMemo(() => (eddS.ok ? gebelikTakvimi({
    edd: eddS.edd, yontemAd: eddS.yontemAd, bugun: okunan.bugun,
    rhNegatif: rh === 'bilinmiyor' ? null : rh === 'neg', idcNegatif: idc === 'bilinmiyor' ? null : idc === 'neg',
    cogul, risk, yapilanlar: yapilan, izlemHaftalari,
  }) : null), [eddS.ok, eddS.ok ? eddS.edd : '', eddS.ok ? eddS.yontemAd : '', okunan.bugun, rh, idc, cogul, risk, yapilan, izlemHaftalari]); // eslint-disable-line react-hooks/exhaustive-deps

  const zaman: Satir[] = t ? [...t.izlemler.map((x) => ({ tur: 'izlem' as const, x })), ...t.taramalar.map((x) => ({ tur: 'tarama' as const, x }))]
    .sort((a, b) => a.x.acilis.localeCompare(b.x.acilis) || (a.tur === 'izlem' ? -1 : 1)) : [];
  const yorum = (ham: string, deger: string | null, bicim: (x: string) => string = trTarih) => (ham.trim() ? (deger ? <span style={{ ...kucuk, color: '#6EE7B7' }}>→ {bicim(deger)}</span> : <span style={hata}>Okunamadı</span>) : null);
  const alan = (k: keyof typeof f, ph: string, ad: string, w: number | string = 170) => <Etiketli ad={ad}><input inputMode="numeric" value={f[k]} onChange={(e) => set(k, e.target.value)} placeholder={ph} aria-label={ad} style={{ ...input, width: w, maxWidth: '100%' }} /></Etiketli>;

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Tarihleme</div>
        <Segment etiket="Tarihleme yöntemi" deger={yontem} set={(x) => { setYontem(x); setKopya(''); }} secenekler={[['sat', 'SAT'], ['usg_hafta', 'USG haftası'], ['usg_crl', 'CRL'], ['edd', 'TDT biliniyor']]} />
        {yontem === 'sat' && <div style={satir}>{alan('sat', 'Son adet tarihi — 12.03.2026', 'Son adet tarihi', 240)}{yorum(f.sat, okunan.sat)}</div>}
        {yontem === 'edd' && <div style={satir}>{alan('edd', 'Tahmini doğum tarihi', 'Tahmini doğum tarihi', 240)}{yorum(f.edd, okunan.edd)}</div>}
        {(yontem === 'usg_hafta' || yontem === 'usg_crl') && (
          <>
            <div style={satir}>{alan('usgTarih', 'USG tarihi — 02.04.2026', 'Ultrason tarihi', 220)}{yorum(f.usgTarih, okunan.usgTarih)}</div>
            {yontem === 'usg_hafta'
              ? <div style={satir}>{alan('usgHafta', 'O günkü hafta — 8+3', 'Ultrasondaki gebelik haftası', 220)}{yorum(f.usgHafta, okunan.usgHafta ? `${okunan.usgHafta.weeks} hafta ${okunan.usgHafta.days} gün` : null, (x) => x)}</div>
              : <div style={satir}>{alan('crl', 'CRL (mm) — 45,2', 'CRL milimetre', 180)}{yorum(f.crl, okunan.crl != null ? `${String(okunan.crl).replace('.', ',')} mm` : null, (x) => x)}</div>}
            <div style={satir}>{alan('sat', 'SAT (isteğe bağlı, karşılaştırma)', 'Karşılaştırma için son adet tarihi', 260)}{yorum(f.sat, okunan.sat)}</div>
          </>
        )}
        <div style={{ ...kucuk, marginTop: 8 }}>Tarih: 12.03.2026 · 12/3/26 · 12 mart 2026. Hafta: 8+3 · &quot;8 hafta 3 gün&quot; · 8h3g. Ondalıkta virgül kullanabilirsiniz.</div>
      </div>

      <div style={kutu}>
        <div style={etiket}>Hasta (isteğe bağlı)</div>
        <KdHastaSecici secili={hasta.id} sec={hastadanDoldur} />
        {mesaj && <div style={{ ...kucuk, marginTop: 6, color: '#F9A8D4' }}>{mesaj}</div>}
        <div style={satir}>
          <button type="button" onClick={() => setAyrinti(!ayrinti)} style={ghost} aria-expanded={ayrinti}>{ayrinti ? 'Ayrıntıları gizle' : 'Ayrıntılar: Rh, çoğul, risk, yapılanlar'}</button>
        </div>
        {ayrinti && (
          <div style={{ marginTop: 6 }}>
            <div style={satir}><span style={{ ...kucuk, minWidth: 70 }}>Rh</span><Segment etiket="Rh" deger={rh} set={setRh} secenekler={[['bilinmiyor', 'Bilinmiyor'], ['neg', 'Rh(−)'], ['poz', 'Rh(+)']]} /></div>
            {rh === 'neg' && <div style={satir}><span style={{ ...kucuk, minWidth: 70 }}>İnd. Coombs</span><Segment etiket="İndirekt Coombs" deger={idc} set={setIdc} secenekler={[['bilinmiyor', 'Bilinmiyor'], ['neg', 'Negatif'], ['poz', 'Pozitif']]} /></div>}
            <div style={satir}><span style={{ ...kucuk, minWidth: 70 }}>Risk</span><Segment etiket="Risk sınıfı" deger={risk} set={setRisk} secenekler={[['dusuk', 'Düşük'], ['orta', 'Orta'], ['yuksek', 'Yüksek']]} /></div>
            <Kutu on={cogul} set={setCogul}>Çoğul gebelik</Kutu>
            <div style={satir}><span style={kucuk}>Hesap tarihi</span>{alan('bugun', 'bugün', 'Hesap tarihi', 150)}{yorum(f.bugun, okunan.bugun)}</div>
            {t && <div style={{ marginTop: 8 }}>
              <div style={kucuk}>Yapılanları işaretleyin (hasta seçiliyse kayıttan gelir):</div>
              <div style={satir}>{t.taramalar.map((x) => { const on = yapilan.includes(x.id); return <button key={x.id} type="button" aria-pressed={on} onClick={() => setYapilan(on ? yapilan.filter((y) => y !== x.id) : [...yapilan, x.id])} style={{ ...ghost, minHeight: 40, padding: '8px 12px', background: on ? 'rgba(16,185,129,0.14)' : 'transparent', color: on ? '#6EE7B7' : '#C9D4E3' }}>{on ? '✓ ' : ''}{x.ad}</button>; })}</div>
            </div>}
          </div>
        )}
      </div>

      {!eddS.ok ? (
        <div style={{ ...kutu, textAlign: 'center', padding: '28px 18px' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#C9D4E3', marginBottom: 6 }}>Takvim için bir tarih yeterli</div>
          <div style={{ ...kucuk, fontSize: 14 }}>{eddS.hata}</div>
        </div>
      ) : t && (
        <div aria-live="polite">
          <div style={{ ...kutu, display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px' }}>
              <div style={kucuk}>Bugün ({trTarih(okunan.bugun)})</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: '#EDF1F7', letterSpacing: '-0.6px', lineHeight: 1.1 }}>{t.ga.weeks}<span style={{ fontSize: 18, color: '#9BB0C7' }}> hf </span>{t.ga.days}<span style={{ fontSize: 18, color: '#9BB0C7' }}> gün</span></div>
              <div style={kucuk}>{t.trimester}. trimester · {t.yontemAd}</div>
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <div style={kucuk}>Tahmini doğum</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#F9A8D4' }}>{trTarih(t.edd)}</div>
              <div style={kucuk}>{t.dogumaKalanGun >= 0 ? `${t.dogumaKalanGun} gün kaldı` : `${-t.dogumaKalanGun} gün geçti`}</div>
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <div style={kucuk}>DÖBYR asgari izlem</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: t.izlemler.some((x) => x.durum === 'kacirildi') ? '#FCA5A5' : '#EDF1F7' }}>{t.izlemYapilan} / 4</div>
              <div style={kucuk}>{izlemHaftalari.length ? 'kayıtlı izlemlere göre' : 'izlem kaydı girilmedi'}</div>
            </div>
          </div>
          {satEdd?.ok && eddS.edd !== satEdd.edd && (
            <div style={{ ...kutu, borderColor: 'rgba(59,130,246,0.35)' }}>
              <div style={metin}>SAT'a göre TDT {trTarih(satEdd.edd)} · {t.yontemAd} ile {trTarih(t.edd)} — fark <b>{Math.abs(Math.round((Date.parse(t.edd) - Date.parse(satEdd.edd)) / 86400000))} gün</b>.</div>
              <div style={kucuk}>Hangi tarihin kilitleneceği hekimin kararıdır; takvim şu an {t.yontemAd} ile hesaplanıyor.</div>
            </div>
          )}
          {t.uyari.map((u) => <div key={u} style={{ ...kutu, borderColor: 'rgba(251,191,36,0.4)', color: '#FDE68A', fontSize: 14 }}>{u}</div>)}

          {t.kapaniyor.length > 0 && (
            <div role="alert" style={{ background: 'linear-gradient(135deg, #9A3412, #C2410C)', border: '2px solid #FB923C', borderRadius: 16, padding: 18, marginBottom: 14, boxShadow: '0 8px 28px rgba(194,65,12,0.35)' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#FFEDD5', letterSpacing: '1px', textTransform: 'uppercase' }}>Kapanmak üzere — geri alınamaz</div>
              {t.kapaniyor.map((x) => (
                <div key={x.id} style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF' }}>{x.ad}: {x.kalanGun === 0 ? 'bugün son gün' : `${x.kalanGun} gün kaldı`}</div>
                  <div style={{ fontSize: 14, color: '#FFEDD5' }}>Son gün {trTarih(x.kapanis)} ({x.pencereHafta.split('–')[1]}). Bu tarihten sonra bu test bu pencerede yapılamaz.{x.sut ? ` SUT ${x.sut}.` : ''}</div>
                </div>
              ))}
            </div>
          )}
          {t.kapaniyorDiger.length > 0 && (
            <div style={{ ...kutu, background: 'rgba(245,158,11,0.10)', borderColor: 'rgba(251,191,36,0.5)' }}>
              <div style={{ ...etiket, color: '#FCD34D' }}>Bu hafta kapanıyor</div>
              {t.kapaniyorDiger.map((x) => <div key={x.id} style={{ ...metin, marginTop: 4 }}><b>{x.ad}</b>: {x.kalanGun === 0 ? 'bugün son gün' : `${x.kalanGun} gün kaldı`} ({trTarih(x.kapanis)})</div>)}
            </div>
          )}
          {t.kacirilan.length > 0 && (
            <div style={{ ...kutu, background: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.45)' }}>
              <div style={{ ...etiket, color: '#FCA5A5' }}>Kaçırılan pencereler</div>
              {t.kacirilan.map((x) => <div key={x.id} style={{ ...metin, marginTop: 4 }}><b>{x.ad}</b> ({x.pencereHafta}, son gün {trTarih(x.kapanis)}){x.kacirilinca ? <div style={kucuk}>{x.kacirilinca}</div> : null}</div>)}
            </div>
          )}

          <div style={kutu}>
            <div style={etiket}>İzlem ve tarama çizelgesi</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {zaman.map((s) => {
                const r = DURUM_RENK[s.x.durum];
                const baskin = s.x.durum === 'kapaniyor' && (s.tur === 'izlem' || s.x.geriAlinamaz);
                return (
                  <div key={`${s.tur}-${s.tur === 'izlem' ? s.x.no : s.x.id}`} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', padding: '10px 12px', borderRadius: 12, border: `1px solid ${baskin ? '#FB923C' : r.kenar}`, background: baskin ? 'rgba(194,65,12,0.18)' : 'rgba(0,0,0,0.12)', opacity: s.x.durum === 'yapildi' ? 0.7 : 1 }}>
                    <div style={{ flex: '1 1 210px', minWidth: 0 }}>
                      <div style={{ ...metin, fontWeight: 700 }}>{s.tur === 'izlem' ? `DÖBYR ${s.x.no}. izlem` : s.x.ad}{s.tur === 'tarama' && s.x.sut ? <span style={kucuk}> · SUT {s.x.sut}</span> : null}{s.tur === 'tarama' && s.x.cepten ? <span style={kucuk}> · genellikle cepten</span> : null}</div>
                      <div style={kucuk}>{s.x.pencereHafta} · {trTarih(s.x.acilis)} – {trTarih(s.x.kapanis)}</div>
                      {s.tur === 'tarama' && s.x.not && <div style={kucuk}>{s.x.not}</div>}
                      {s.tur === 'izlem' && (s.x.durum === 'acik' || s.x.durum === 'kapaniyor') && <div style={kucuk}>Kontrol listesi: {s.x.kontrol.join(' · ')}</div>}
                    </div>
                    <Durum d={s.x.durum} kalan={s.x.kalanGun} />
                  </div>
                );
              })}
            </div>
            <div style={{ ...kucuk, marginTop: 10 }}>Tekil gebelikte doğum öncesi analık istirahati {trTarih(t.analikRaporuBaslangic.tekil)} (32+0){cogul ? `, çoğulda ${trTarih(t.analikRaporuBaslangic.cogul)} (30+0)` : ''} tarihinde başlar. <a href={`/doktor-tools/kd-dogum-rapor?tdt=${t.edd}${cogul ? '&cogul=1' : ''}`} style={{ color: '#F9A8D4', fontWeight: 700 }}>Doğum & Analık Rapor Asistanı →</a></div>
          </div>

          <div style={kutu}>
            <div style={etiket}>Yasal asgari ve klinik öneri — çakışınca iki sütun</div>
            <div style={{ ...metin, marginBottom: 4 }}>Bugün ({t.gaMetin}): DÖBYR {t.kadans.sb_required.due ? 'izlem penceresi açık' : 'açık izlem penceresi yok'} · ACOG kadansı {t.kadans.acog_recommended.due ? 'vizit öneriyor' : 'bu hafta vizit öngörmüyor'}{t.kadans.conflict ? ' — farklılar, ikisi de gösterildi.' : '.'}</div>
            {t.cift.map((c) => <CiftSutun key={c.baslik} baslik={c.baslik} sb={c.sb} klinik={c.klinik} />)}
            <div style={{ ...kucuk, marginTop: 6 }}>Kaynak sırası: SB DÖBYR 2026 (HSGM Yayın No. 1402) → Temel KD → ACOG → Williams. Tarama tanı değildir; karar hekimindir.</div>
          </div>

          <div style={kutu}>
            <div style={etiket}>Hasta için takvim (taslak)</div>
            <pre style={{ ...metin, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{takvimHastaMetni(t)}</pre>
            <div style={satir}>
              <button type="button" style={btn} onClick={async () => setKopya((await panoya(takvimHastaMetni(t))) ? 'Kopyalandı — göndermeden önce kontrol edin.' : 'Pano erişimi yok — metni elle seçin.')}>Takvimi kopyala</button>
              {hasta.id && <a href={hastaDosyaHref(hasta.id, 'gebelik')} style={{ ...ghost, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Hastada aç (Gebelik) →</a>}
              {kopya && <span style={{ ...kucuk, color: '#F9A8D4' }}>{kopya}</span>}
            </div>
            <MuayeneFormunaEkle
              hastaId={hasta.id}
              arac="Gebelik takvimi"
              satirlar={[
                `Gebelik haftası: ${t.gaMetin} · TDT ${trTarih(t.edd)}`,
                t.kapaniyor.length ? `Kapanmak üzere: ${t.kapaniyor.map((x) => `${x.ad} (son gün ${trTarih(x.kapanis)})`).join('; ')}` : '',
                t.kapaniyorDiger.length ? `Bu hafta kapanıyor: ${t.kapaniyorDiger.map((x) => `${x.ad} (${trTarih(x.kapanis)})`).join('; ')}` : '',
                t.kacirilan.length ? `Kaçırılan pencere: ${t.kacirilan.map((x) => `${x.ad} (${x.pencereHafta})`).join('; ')}` : '',
                `Doğum öncesi analık istirahati başlangıcı: ${trTarih(t.analikRaporuBaslangic.tekil)}${cogul ? ` (çoğul ${trTarih(t.analikRaporuBaslangic.cogul)})` : ''}`,
              ]}
            />
            <div style={{ ...kucuk, marginTop: 8 }}>Hiçbir şey nota otomatik yazılmaz — yalnız yukarıdaki düğmeye bastığınızda eklenir.</div>
          </div>
        </div>
      )}
    </>
  );
}
