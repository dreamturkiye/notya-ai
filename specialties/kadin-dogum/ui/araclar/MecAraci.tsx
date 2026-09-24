'use client';
/**
 * Araçlar › Kontrasepsiyon MEC Danışmanı. Motor: engines/kontrasepsiyon-mec (WHO MEC 1–4, acil kontrasepsiyon, doğum sonrası
 * başlama) — kopyalanmaz, yalnız hekime açılır. Araç ürün / doz önermez: yöntem başına kategori + gerekçe; reçeteyi hekim yazar.
 */
import React, { useMemo, useState } from 'react';
import { yontemMec, acilKontrasepsiyon, postpartumKontrasepsiyonBaslangic, YONTEM_KATALOG, type MecGirdi, type MecKat, type YontemKod } from '../../engines/kontrasepsiyon-mec';
import { sayiOku, tarihOku } from '../../engines/araclar';
import { diffDays } from '../../engines/dates';
import { kdStil, Segment, Kutu, Etiketli, KdHastaSecici, MuayeneFormunaEkle, kdHastaOzeti } from './KdAracKabugu';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const { kutu, etiket, kucuk, metin, satir, input, ghost, hata } = kdStil;
const bugunIso = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);

const KAT_RENK: Record<MecKat, { fg: string; bg: string; kenar: string; ad: string }> = {
  1: { fg: '#6EE7B7', bg: 'rgba(16,185,129,0.12)', kenar: 'rgba(16,185,129,0.4)', ad: 'MEC 1–2' },
  2: { fg: '#A7F3D0', bg: 'rgba(16,185,129,0.08)', kenar: 'rgba(16,185,129,0.3)', ad: 'MEC 2' },
  3: { fg: '#FCD34D', bg: 'rgba(245,158,11,0.12)', kenar: 'rgba(245,158,11,0.45)', ad: 'MEC 3' },
  4: { fg: CHROME_RENK.warn, bg: 'rgba(239,68,68,0.14)', kenar: 'rgba(239,68,68,0.5)', ad: 'MEC 4' },
};
const ANA_YONTEMLER: YontemKod[] = ['kok', 'pop', 'implant', 'enjeksiyon', 'ria_lng', 'ria_cu', 'kondom', 'lam', 'tup_ligasyonu'];
const yontemAd = (k: YontemKod) => YONTEM_KATALOG.find((y) => y.kod === k)?.ad || k;
const yontemSure = (k: YontemKod) => YONTEM_KATALOG.find((y) => y.kod === k)?.sure || '';

/** "140/90" · "140 90" · "14/9" (cmHg yazımı) → mmHg */
function taOku(ham: string): { s: number | null; d: number | null } {
  const m = /(\d{2,3})\s*[/\-\s]\s*(\d{1,3})/.exec(ham.trim())
  if (!m) return { s: null, d: null }
  let s = Number(m[1]), d = Number(m[2])
  if (s < 30 && d < 20) { s *= 10; d *= 10 }
  return { s, d }
}
/** "36" (saat) · "2 gün" · "1,5 gün" · "3 g" → saat */
function saatOku(ham: string): number | null {
  const s = ham.trim().toLocaleLowerCase('tr-TR')
  if (!s) return null
  const n = sayiOku(s)
  if (n == null) return null
  return /gün|gun|\bg\b|g$/.test(s) ? Math.round(n * 24) : n
}

function Rozet({ k }: { k: MecKat }) {
  const r = KAT_RENK[k];
  return <span style={{ borderRadius: 10, padding: '6px 10px', fontSize: 14, fontWeight: 800, color: r.fg, background: r.bg, border: `1px solid ${r.kenar}`, whiteSpace: 'nowrap' }}>{r.ad}</span>;
}

export default function MecAraci() {
  const [sekme, setSekme] = useState<'yontem' | 'acil' | 'pp'>('yontem');
  const [f, setF] = useState({ yas: '', sigara: '', ta: '', pp: '', vki: '', saat: '' });
  const [b, setB] = useState({ emziriyor: false, migrenAura: false, vte: false, memeCa: false, karaciger: false, pid: false, kanama: false, gebelik: false, kok: false });
  const [ayrinti, setAyrinti] = useState(false);
  const [hasta, setHasta] = useState({ id: '', ad: '' });
  const [mesaj, setMesaj] = useState('');
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const tik = (k: keyof typeof b) => (v: boolean) => setB((p) => ({ ...p, [k]: v }));

  // Doğum sonrası: gün sayısı veya doğum tarihi yazılabilir.
  const ppTarih = tarihOku(f.pp);
  const ppGun = ppTarih ? Math.max(0, diffDays(bugunIso(), ppTarih)) : sayiOku(f.pp);
  const ta = taOku(f.ta);
  const g: MecGirdi = {
    yas: sayiOku(f.yas), sigaraGunluk: sayiOku(f.sigara), vteOykusu: b.vte, migrenAura: b.migrenAura,
    taSistolik: ta.s, taDiastolik: ta.d, memeCa: b.memeCa, karacigerAgir: b.karaciger,
    postpartumGun: f.pp.trim() ? ppGun : null, emziriyor: b.emziriyor, pidAktif: b.pid, aciklanmamisKanama: b.kanama,
    bmi: sayiOku(f.vki), gebelikSupheli: b.gebelik,
  };
  const sonuc = useMemo(() => ANA_YONTEMLER.map((y) => yontemMec(y, g)).sort((a, c) => a.kategori - c.kategori), [JSON.stringify(g)]); // eslint-disable-line react-hooks/exhaustive-deps
  const saat = saatOku(f.saat);
  const acil = useMemo(() => acilKontrasepsiyon({ iliskiSaatOnce: saat, emziriyor: b.emziriyor, kokKullanıyor: b.kok }), [saat, b.emziriyor, b.kok]);
  const ppListe = ppGun != null && f.pp.trim() ? postpartumKontrasepsiyonBaslangic(ppGun, b.emziriyor) : null;

  const hastadanDoldur = async (id: string, ad: string) => {
    setHasta({ id, ad }); setMesaj('');
    if (!id) return;
    try {
      const o = await kdHastaOzeti(id);
      const bg = bugunIso();
      if (o.hastaDogum) set('yas', String(Math.floor(diffDays(bg, o.hastaDogum) / 365.25)));
      if (o.dogumTarihi) set('pp', String(diffDays(bg, o.dogumTarihi)));
      if (o.vki) set('vki', String(o.vki).replace('.', ','));
      setMesaj(o.hastaDogum || o.dogumTarihi ? 'Kayıttan yaş / doğum sonrası gün / VKİ dolduruldu — diğer faktörleri siz işaretleyin.' : 'Kayıtta kullanılabilir veri yok — faktörleri elle girin.');
    } catch (e) { setMesaj(e instanceof Error ? e.message : 'Hasta verisi yüklenemedi'); }
  };

  const alan = (k: keyof typeof f, ph: string, ad: string, w = 150) => <Etiketli ad={ad}><input inputMode="decimal" value={f[k]} onChange={(e) => set(k, e.target.value)} placeholder={ph} aria-label={ad} style={{ ...input, width: w, maxWidth: '100%' }} /></Etiketli>;

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Hasta faktörleri</div>
        <div style={satir}>{alan('yas', 'Yaş', 'Yaş', 90)}{alan('sigara', 'Sigara / gün', 'Günlük sigara', 130)}{alan('ta', 'TA — 140/90', 'Tansiyon', 140)}{alan('pp', 'ör. 35 veya 12.08.2026', 'Doğum sonrası gün veya doğum tarihi', 240)}</div>
        {f.ta.trim() && ta.s == null && <div style={{ ...hata, marginTop: 4 }}>Tansiyon okunamadı — 140/90 biçiminde yazın.</div>}
        {ppTarih && <div style={{ ...kucuk, marginTop: 4, color: '#6EE7B7' }}>→ doğum sonrası {ppGun}. gün</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', columnGap: 12, marginTop: 4 }}>
          <Kutu on={b.emziriyor} set={tik('emziriyor')}>Emziriyor</Kutu>
          <Kutu on={b.migrenAura} set={tik('migrenAura')}>Auralı migren</Kutu>
          <Kutu on={b.vte} set={tik('vte')}>VTE öyküsü</Kutu>
        </div>
        <div style={satir}><button type="button" onClick={() => setAyrinti(!ayrinti)} style={ghost} aria-expanded={ayrinti}>{ayrinti ? 'Ayrıntıları gizle' : 'Ayrıntılar: VKİ, meme Ca, karaciğer, PID, kanama, gebelik şüphesi, hasta'}</button></div>
        {ayrinti && (
          <div style={{ marginTop: 4 }}>
            <div style={satir}>{alan('vki', 'VKİ — 31,5', 'Vücut kitle indeksi', 130)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', columnGap: 12 }}>
              <Kutu on={b.memeCa} set={tik('memeCa')}>Meme kanseri (aktif / öykü)</Kutu>
              <Kutu on={b.karaciger} set={tik('karaciger')}>Ağır karaciğer hastalığı</Kutu>
              <Kutu on={b.pid} set={tik('pid')}>Aktif PID</Kutu>
              <Kutu on={b.kanama} set={tik('kanama')}>Açıklanmamış vajinal kanama</Kutu>
              <Kutu on={b.gebelik} set={tik('gebelik')}>Gebelik şüphesi</Kutu>
            </div>
            <div style={{ marginTop: 6 }}><div style={kucuk}>Hasta (isteğe bağlı)</div><KdHastaSecici secili={hasta.id} sec={hastadanDoldur} /></div>
          </div>
        )}
        {mesaj && <div style={{ ...kucuk, marginTop: 6, color: '#F9A8D4' }}>{mesaj}</div>}
      </div>

      <div style={{ marginBottom: 12 }}><Segment etiket="Görünüm" deger={sekme} set={setSekme} secenekler={[['yontem', 'Yöntemler'], ['acil', 'Acil kontrasepsiyon'], ['pp', 'Doğum sonrası başlama']]} /></div>

      {sekme === 'yontem' && (
        <div style={kutu} aria-live="polite">
          <div style={etiket}>Yöntem başına WHO MEC kategorisi</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            {sonuc.map((s) => {
              const r = KAT_RENK[s.kategori];
              return (
                <div key={s.yontem} style={{ border: `1px solid ${r.kenar}`, background: s.kategori >= 3 ? r.bg : 'rgba(0,0,0,0.15)', borderRadius: 14, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                    <div><div style={{ ...metin, fontWeight: 700 }}>{yontemAd(s.yontem)}</div><div style={kucuk}>{yontemSure(s.yontem)}</div></div>
                    <Rozet k={s.kategori} />
                  </div>
                  <div style={{ ...kucuk, marginTop: 6, color: r.fg }}>{s.not}</div>
                  {s.engeller.map((x) => <div key={x} style={{ ...metin, fontSize: 13, color: CHROME_RENK.warn }}>✕ {x}</div>)}
                  {s.dikkat.map((x) => <div key={x} style={{ ...metin, fontSize: 13, color: '#FCD34D' }}>⚠ {x}</div>)}
                </div>
              );
            })}
          </div>
          <MuayeneFormunaEkle
            hastaId={hasta.id}
            arac="Kontrasepsiyon WHO MEC değerlendirmesi"
            satirlar={[
              `Kabul edilemez risk (MEC 4): ${sonuc.filter((s) => s.kategori === 4).map((s) => yontemAd(s.yontem)).join(', ') || 'yok'}`,
              `Risk genellikle yarara üstün (MEC 3): ${sonuc.filter((s) => s.kategori === 3).map((s) => yontemAd(s.yontem)).join(', ') || 'yok'}`,
              `Kısıtlama görülmeyen yöntemler (MEC 1–2): ${sonuc.filter((s) => s.kategori <= 2).map((s) => yontemAd(s.yontem)).join(', ') || 'yok'}`,
              'Ürün ve reçete seçimi hekimindir; araç ürün ya da doz önermez.',
            ]}
          />
          <div style={{ ...kucuk, marginTop: 10 }}>MEC 1: kısıtlama yok · 2: yarar genellikle riske üstün · 3: risk genellikle yarara üstün, hekimle tartışılır · 4: kabul edilemez risk. Kısıtlayıcı faktör girilmeyen yöntemler &quot;MEC 1–2&quot; gösterilir. Sadeleştirilmiş ofis setidir; tam WHO MEC tablosunun yerini tutmaz. Ürün ve doz seçimi hekimindir.</div>
        </div>
      )}

      {sekme === 'acil' && (
        <div style={kutu} aria-live="polite">
          <div style={etiket}>Acil kontrasepsiyon zamanlaması</div>
          <div style={satir}>{alan('saat', 'Korunmasız ilişkiden bu yana — 36 veya 2 gün', 'İlişkiden bu yana geçen süre', 300)}{saat != null && <span style={{ ...kucuk, color: '#6EE7B7' }}>→ {saat} saat</span>}</div>
          <Kutu on={b.kok} set={tik('kok')}>Düzenli KOK kullanıyor (hap kaçırma)</Kutu>
          <div style={{ ...metin, fontWeight: 700, margin: '8px 0', color: saat != null && saat > 120 ? CHROME_RENK.warn : CHROME_RENK.ink }}>{saat == null ? 'Süreyi girin — pencereler buna göre daralır.' : acil.oneri}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
            {acil.secenekler.map((s) => (
              <div key={s.kod} style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: 12, background: 'rgba(0,0,0,0.15)' }}>
                <div style={{ ...metin, fontWeight: 700 }}>{yontemAd(s.kod)}</div>
                <div style={kucuk}>Pencere: {s.pencere}</div>
                <div style={kucuk}>Etkinlik: {s.etkinlik}</div>
                <div style={{ ...kucuk, marginTop: 4 }}>{s.not}</div>
              </div>
            ))}
          </div>
          {!acil.secenekler.length && <div style={{ ...metin, color: CHROME_RENK.warn }}>Hap seçeneklerinin penceresi geçti.</div>}
          <ul style={{ ...metin, fontSize: 13, margin: '10px 0 0', paddingLeft: 18 }}>{acil.sonrasi.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      )}

      {sekme === 'pp' && (
        <div style={kutu} aria-live="polite">
          <div style={etiket}>Doğum sonrası ve emzirmede başlama</div>
          {!ppListe ? (
            <div style={{ ...kucuk, fontSize: 14 }}>Yukarıya doğum sonrası gün sayısını veya doğum tarihini yazın; emzirme durumunu işaretleyin.</div>
          ) : (
            <>
              <div style={{ ...metin, marginBottom: 8 }}>Doğum sonrası {ppGun}. gün · {b.emziriyor ? 'emziriyor' : 'emzirmiyor'} — şu an başlanabilecekler:</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {ppListe.map((p) => { const k = yontemMec(p.yontem, g).kategori; return (
                  <div key={p.yontem} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 12px' }}>
                    <div style={{ flex: '1 1 220px' }}><div style={{ ...metin, fontWeight: 700 }}>{yontemAd(p.yontem)}</div><div style={kucuk}>Başlangıç: {p.baslangic} · {p.not}</div></div>
                    <Rozet k={k} />
                  </div>
                ); })}
              </div>
              <div style={{ ...kucuk, marginTop: 8 }}>Listede olmayan yöntemler bu gün sayısında henüz önerilmez; gün ilerledikçe liste güncellenir.</div>
            </>
          )}
        </div>
      )}
      <div style={{ ...kucuk, marginTop: 4 }}>Kaynak: WHO Tıbbi Uygunluk Kriterleri (MEC) kategorileri, TJOD önerileri, SB danışmanlık materyali. Reçeteyi hekim yazar; hiçbir şey nota yazılmaz.</div>
    </>
  );
}
