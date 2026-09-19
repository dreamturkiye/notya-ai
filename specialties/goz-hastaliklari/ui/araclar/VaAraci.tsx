'use client';
/**
 * GOZ-EXCEPTIONAL-01 — Araçlar › VA / logMAR. engines/va üzerinden; tanı yok, değer hekimin yazdığı gibi okunur.
 * ARACLAR-CILA-01: ortak araç kütüphanesiyle yenilendi — manşet ETDRS farkı, durum rozeti, katlanır yöntem notu, taslak rozeti.
 * Faz 3 (kalıcılık): hasta seçiliyse önceki vizit VA / GİB göz chapter'ın KENDİ tablosundan (goz_muayeneler,
 * /api/doktor/goz GET) ön doldurulur; "Bu vizitin ölçümünü kaydet" aynı tabloya mevcut `adim: 'olcum'` yoluyla
 * yazar. Yeni tablo açılmadı; kayıt hekimin açık eylemidir.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { vaKarsilastir, type VaSatir } from '../../engines/araclar';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { gozStil, Alan, GozHastaSecici, Istatistik, Katlanir, KayitButonu, KopyalaButonu, MuayeneFormunaEkle, OncekiVizit, Rozet, Segment, TaslakNotu } from './GozAracKabugu';

const { kutu, etiket, kucuk, metin, satir, input, ghost, hata, kaydir } = gozStil;
const ORNEKLER = ['1,0', '0,8', '0,5', '6/12', '20/40', 'PS 1m', 'EH', 'IH', 'IHY'];
const bugunIso = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);
/** goz_muayeneler.va alanları — hekim hangi ölçümü kaydettiğini kendisi seçer (GozHome ile aynı adlar). */
const VA_ALANLARI: Array<[string, string]> = [['uzak_sc', 'Uzak sc (düzeltmesiz)'], ['uzak_cc', 'Uzak cc (düzeltmeli)']];
type Muayene = { tarih: string; gib_sag: number | string | null; gib_sol: number | string | null; gosterim?: { sag: string | null; sol: string | null } };

function Hucre({ s }: { s: VaSatir }) {
  if (!s.ham) return <span style={kucuk}>—</span>;
  if (s.hata) return <span style={hata}>{s.hata}</span>;
  return (
    <span>
      <b>{s.gosterim}</b>
      {s.kategori === 'sayisal' ? <span style={kucuk}> · ondalık {s.ondalik} · logMAR {s.logmar}</span> : <span style={kucuk}> · sayısal değil (logMAR yok)</span>}
    </span>
  );
}

export default function VaAraci() {
  const [d, setD] = useState<Record<string, string>>({ odOnce: '', odSimdi: '', osOnce: '', osSimdi: '' });
  const [aktif, setAktif] = useState('odSimdi');
  const [hastaId, setHastaId] = useState('');
  const [gib, setGib] = useState({ sag: '', sol: '' });
  const [vaAlani, setVaAlani] = useState('uzak_sc');
  const [onceki, setOnceki] = useState<Muayene | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [kayitHata, setKayitHata] = useState('');
  const set = (k: string, v: string) => setD((p) => ({ ...p, [k]: v }));

  /** Son kayıtlı ölçüm — hastanın kendi göz kaydından (doctor_id kapsamlı; sahiplik sunucuda). */
  const yukle = useCallback(async (id: string) => {
    setKayitHata(''); setOnceki(null);
    if (!id) return;
    setYukleniyor(true);
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch(`/api/doktor/goz?patientId=${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setKayitHata(j.error || 'Hasta kaydı okunamadı.'); return; }
      const liste = (j.muayeneler || []) as Muayene[];
      const son = liste.find((m) => m.gosterim?.sag || m.gosterim?.sol || m.gib_sag != null || m.gib_sol != null) || null;
      setOnceki(son);
      // ÖN DOLDUR: hekim üzerine yazabilir — bugünkü alanlar boş kalır.
      if (son) setD((p) => ({ ...p, odOnce: p.odOnce || son.gosterim?.sag || '', osOnce: p.osOnce || son.gosterim?.sol || '' }));
    } catch { setKayitHata('Hasta kaydı okunamadı — bağlantıyı kontrol edin.'); }
    finally { setYukleniyor(false); }
  }, []);
  useEffect(() => { yukle(hastaId); }, [hastaId, yukle]);

  const sayiVeya = (x: string) => { const n = Number(x.trim().replace(',', '.')); return x.trim() && Number.isFinite(n) ? n : null; };
  const kaydedilecekVar = !!(d.odSimdi.trim() || d.osSimdi.trim() || gib.sag.trim() || gib.sol.trim());

  const kaydet = async (): Promise<string | null> => {
    const t = await getAccessTokenAsync();
    const va: Record<string, Record<string, string>> = {};
    if (d.odSimdi.trim()) va.sag = { [vaAlani]: d.odSimdi.trim() };
    if (d.osSimdi.trim()) va.sol = { [vaAlani]: d.osSimdi.trim() };
    const r = await fetch('/api/doktor/goz', {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ adim: 'olcum', patientId: hastaId, olcum: { tarih: bugunIso(), va, gibSag: sayiVeya(gib.sag), gibSol: sayiVeya(gib.sol) } }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return j.error || 'Kaydedilemedi.';
    await yukle(hastaId);
    return null;
  };
  const od = vaKarsilastir(d.odOnce, d.odSimdi), os = vaKarsilastir(d.osOnce, d.osSimdi);
  const harf = (x: number | null) => (x == null ? '—' : `${x > 0 ? '+' : ''}${x} harf`);
  const ton = (x: number | null): 'iyi' | 'uyari' | 'notr' => (x == null ? 'notr' : x <= -5 ? 'uyari' : x >= 5 ? 'iyi' : 'notr');
  const yon = (x: number | null) => (x == null ? 'karşılaştırma için iki vizit gerekir' : x <= -5 ? 'anlamlı düşüş (≥1 sıra)' : x >= 5 ? 'anlamlı artış (≥1 sıra)' : 'değişim eşik altında');
  const alan = (k: string, ph: string, ad: string) => (
    <input value={d[k]} onFocus={() => setAktif(k)} onChange={(e) => set(k, e.target.value)} placeholder={ph} aria-label={ad} style={{ ...input, minWidth: 0 }} />
  );
  const girildi = Object.values(d).some((x) => x.trim());
  const notSatirlari = [
    (d.odOnce.trim() || d.odSimdi.trim()) ? `OD (sağ): önceki ${od.onceki.gosterim || '—'} · bugün ${od.simdi.gosterim || '—'} · ETDRS harf farkı ${harf(od.harf)}` : '',
    (d.osOnce.trim() || d.osSimdi.trim()) ? `OS (sol): önceki ${os.onceki.gosterim || '—'} · bugün ${os.simdi.gosterim || '—'} · ETDRS harf farkı ${harf(os.harf)}` : '',
  ].filter(Boolean);
  const ozetMetni = [
    `Görme keskinliği (hekim girdisi) — ${new Date().toISOString().slice(0, 10)}`,
    ...notSatirlari,
    'logMAR = −log10(ondalık); 0,1 logMAR = 5 ETDRS harfi. Karar desteğidir; klinik yorum hekimindir.',
  ].join('\n');

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Görme keskinliği — yazıldığı gibi</div>
        <div style={kaydir}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr) minmax(0,1fr)', gap: 8, alignItems: 'center', minWidth: 280 }}>
            <span />
            <b style={{ color: '#2DD4BF', fontSize: 13 }}>OD (sağ)</b>
            <b style={{ color: '#60A5FA', fontSize: 13 }}>OS (sol)</b>
            <span style={kucuk}>Önceki vizit</span>{alan('odOnce', '0,5', 'Sağ önceki VA')}{alan('osOnce', '0,6', 'Sol önceki VA')}
            <span style={kucuk}>Bugün</span>{alan('odSimdi', '0,8', 'Sağ bugünkü VA')}{alan('osSimdi', '6/12', 'Sol bugünkü VA')}
          </div>
        </div>
        <div style={{ ...satir, marginTop: 10 }}>
          <span style={kucuk}>Hızlı giriş →</span>
          {ORNEKLER.map((x) => <button key={x} type="button" onClick={() => set(aktif, x)} style={{ ...ghost, minHeight: 36, padding: '6px 10px' }}>{x}</button>)}
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ ...kucuk, marginBottom: 6 }}>Hasta (isteğe bağlı — önceki vizit değerleri okunur, bugünkü ölçüm kaydedilir)</div>
          <GozHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
          {yukleniyor && <div style={{ ...kucuk, marginTop: 6 }}>Kayıtlı ölçüm okunuyor…</div>}
          {kayitHata && <div style={{ ...hata, marginTop: 6 }}>{kayitHata}</div>}
          <OncekiVizit tarih={onceki?.tarih || null}>
            OD {onceki?.gosterim?.sag || '—'} · OS {onceki?.gosterim?.sol || '—'}
            {onceki?.gib_sag != null || onceki?.gib_sol != null ? ` · GİB ${onceki?.gib_sag ?? '—'} / ${onceki?.gib_sol ?? '—'} mmHg` : ''} — üzerine yazabilirsiniz.
          </OncekiVizit>
        </div>
      </div>

      <div style={kutu}>
        <div style={etiket}>Bu vizitin ölçümü — hasta dosyasına kaydet</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
          <Alan etiket="GİB OD (sağ)" ipucu="mmHg — isteğe bağlı">
            <input value={gib.sag} onChange={(e) => setGib((p) => ({ ...p, sag: e.target.value }))} inputMode="decimal" placeholder="16" aria-label="GİB sağ" style={input} />
          </Alan>
          <Alan etiket="GİB OS (sol)" ipucu="mmHg — isteğe bağlı">
            <input value={gib.sol} onChange={(e) => setGib((p) => ({ ...p, sol: e.target.value }))} inputMode="decimal" placeholder="15" aria-label="GİB sol" style={input} />
          </Alan>
        </div>
        <div style={{ marginTop: 12, maxWidth: 420 }}>
          <Alan etiket="Bugünkü VA hangi alana yazılsın" ipucu="Göz kaydındaki alan adı — hekim seçer.">
            <Segment etiket="VA alanı" deger={vaAlani} set={setVaAlani} secenekler={VA_ALANLARI} />
          </Alan>
        </div>
        <KayitButonu
          etiket="Bu vizitin ölçümünü kaydet"
          hastaId={hastaId}
          kapali={!kaydedilecekVar}
          kapaliNedeni="Bugünkü VA ya da GİB girin — kaydedilecek değer yok."
          ipucu="Değerler hastanın göz kaydına (muayene ölçümleri) yazılır; sonraki vizitte önceki vizit olarak görünür."
          kaydet={kaydet}
        />
      </div>

      <div style={kutu} aria-live="polite">
        <div style={etiket}>Sonuç</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
          <Istatistik deger={harf(od.harf)} etiket="OD (sağ) ETDRS farkı" ton={ton(od.harf)} />
          <Istatistik deger={harf(os.harf)} etiket="OS (sol) ETDRS farkı" ton={ton(os.harf)} />
        </div>
        {([['OD (sağ)', od], ['OS (sol)', os]] as const).map(([ad, k]) => (
          <div key={ad} style={{ ...metin, padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontWeight: 700 }}>{ad}</span>
              <Rozet ton={ton(k.harf)}>{yon(k.harf)}</Rozet>
            </div>
            <div>Önceki: <Hucre s={k.onceki} /></div>
            <div>Bugün: <Hucre s={k.simdi} /></div>
            {k.not && <div style={kucuk}>{k.not}</div>}
          </div>
        ))}
        {girildi && <div style={{ ...satir }}><KopyalaButonu metin={ozetMetni} etiket="VA özetini kopyala" /></div>}
        <MuayeneFormunaEkle hastaId={hastaId} arac="VA / logMAR" satirlar={notSatirlari} />
        <Katlanir baslik="Yöntem ve ölçek">
          <div style={kucuk}>logMAR = −log10(ondalık); 0,1 logMAR = 5 ETDRS harfi. PS / EH / IH / IHY sayısal değildir, ikame değer kullanılmaz.</div>
        </Katlanir>
        <TaslakNotu>Sonuç karar desteğidir; klinik yorum hekimindir. Nota otomatik yazılmaz.</TaslakNotu>
      </div>
    </>
  );
}
