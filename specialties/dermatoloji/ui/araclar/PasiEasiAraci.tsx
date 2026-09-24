'use client';
/**
 * ARACLAR-CILA-01: ortak araç kütüphanesiyle yenilendi — skor segmenti, manşet sayılar, katlanır SCORAD, taslak rozeti.
 * Faz 3 (kalıcılık): hasta seçiliyse son kayıtlı skor derm chapter'ın KENDİ tablosundan
 * (derm_skor_anlari, /api/doktor/dermatoloji) okunur; bölge dökümü `ek` alanında saklandığı için
 * girdiler ön doldurulur. "Skoru hastaya kaydet" aynı tabloya mevcut `action: 'skor'` yoluyla yazar.
 * DERM-EXCEPTIONAL-01 — Araçlar › PASI / EASI hesap. Dermatoloji-only (BRANS_DOKTOR_ARACLARI).
 * Bölge skoru (baş-boyun / üst ekstremite / gövde / alt ekstremite) → engines/score-calculator pasi + easi;
 * ayrıca SCORAD alanları. Şiddet bandı karar desteğidir; endikasyon, SUT kriteri ve tedavi kararı hekimindir.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { pasi, easi, scorad, pasiBandi, easiBandi, scoradBandi, type PasiRegion } from '../../engines/score-calculator';
import { dermStil, Alan, Segment, Istatistik, Katlanir, KayitButonu, MuayeneFormunaEkle, OncekiVizit, Rozet, TaslakNotu, DermHastaSecici, KopyalaButonu } from './DermAracKabugu';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const { kutu, etiket, kucuk, metin, satir, btn, ghost } = dermStil;

type BolgeAnahtar = 'head' | 'upper' | 'trunk' | 'lower';
type Mod = 'pasi' | 'easi';

const BOLGELER: Array<{ k: BolgeAnahtar; ad: string; agirlik: string }> = [
  { k: 'head', ad: 'Baş / boyun', agirlik: '×0,1' },
  { k: 'upper', ad: 'Üst ekstremite', agirlik: '×0,2' },
  { k: 'trunk', ad: 'Gövde', agirlik: '×0,3' },
  { k: 'lower', ad: 'Alt ekstremite', agirlik: '×0,4' },
];

const PASI_OGE: Array<{ k: keyof PasiRegion; ad: string; kisa: string }> = [
  { k: 'e', ad: 'Eritem', kisa: 'E' },
  { k: 'i', ad: 'İnfiltrasyon (kalınlık)', kisa: 'İ' },
  { k: 'd', ad: 'Deskuamasyon', kisa: 'D' },
];

const EASI_OGE: Array<{ k: keyof PasiRegion; ad: string; kisa: string }> = [
  { k: 'e', ad: 'Eritem', kisa: 'E' },
  { k: 'i', ad: 'Ödem / papülasyon', kisa: 'Ö' },
  { k: 'd', ad: 'Ekskoriasyon', kisa: 'Eks' },
  { k: 'l', ad: 'Likenifikasyon', kisa: 'Lik' },
];

/** Alan derecesi (A) — PASI ve EASI ortak ölçeği. */
const ALAN_ACIKLAMA = ['%0', '<%10', '%10–29', '%30–49', '%50–69', '%70–89', '%90–100'];

const BOS: Record<BolgeAnahtar, PasiRegion> = {
  head: { e: 0, i: 0, d: 0, a: 0, l: 0 },
  upper: { e: 0, i: 0, d: 0, a: 0, l: 0 },
  trunk: { e: 0, i: 0, d: 0, a: 0, l: 0 },
  lower: { e: 0, i: 0, d: 0, a: 0, l: 0 },
};

function Derece({ etiketAd, deger, enCok, set }: { etiketAd: string; deger: number; enCok: number; set: (n: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
      <span style={{ ...kucuk, flex: '1 1 150px', color: CHROME_RENK.muted }}>{etiketAd}</span>
      <div role="group" aria-label={etiketAd} style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {Array.from({ length: enCok + 1 }, (_, n) => (
          <button
            key={n}
            type="button"
            aria-pressed={deger === n}
            onClick={() => set(n)}
            style={{
              minWidth: 44, minHeight: 44, borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
              background: deger === n ? '#DB2777' : 'rgba(255,255,255,0.05)',
              color: deger === n ? '#FFF1F7' : CHROME_RENK.muted,
              border: `1px solid ${deger === n ? 'rgba(244,114,182,0.6)' : 'rgba(255,255,255,0.14)'}`,
            }}
          >{n}</button>
        ))}
      </div>
    </div>
  );
}

export default function PasiEasiAraci() {
  const [mod, setMod] = useState<Mod>('pasi');
  const [bolge, setBolge] = useState<Record<BolgeAnahtar, PasiRegion>>(BOS);
  const [sc, setSc] = useState({ yayginlik: '', siddet: '', oznel: '' });
  const [hasta, setHasta] = useState<{ id: string; ad: string }>({ id: '', ad: '' });
  const [sonSkor, setSonSkor] = useState<{ recorded_at: string; pasi?: number; easi?: number; scorad?: number; ek?: { arac?: string; mod?: Mod; bolge?: Record<BolgeAnahtar, PasiRegion> } } | null>(null);
  const [kayitHata, setKayitHata] = useState('');

  /** Son kayıtlı skor — hastanın kendi derm epizodundan (sahiplik sunucuda doğrulanır). */
  const yukle = useCallback(async (id: string) => {
    setKayitHata(''); setSonSkor(null);
    if (!id) return;
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch(`/api/doktor/dermatoloji?patientId=${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setKayitHata(j.error || 'Hasta kaydı okunamadı.'); return; }
      const son = ((j.skorlar || []) as Array<{ recorded_at: string; pasi?: number; easi?: number; scorad?: number; ek?: Record<string, unknown> }>)
        .find((x) => x.pasi != null || x.easi != null || x.scorad != null) || null;
      setSonSkor(son as typeof sonSkor);
      // ÖN DOLDUR: bölge dökümü bu araçtan kaydedildiyse girdiler geri yüklenir; hekim değiştirebilir.
      const ek = son?.ek as { arac?: string; mod?: Mod; bolge?: Record<BolgeAnahtar, PasiRegion> } | undefined;
      if (ek?.arac === 'pasi-easi' && ek.bolge) {
        setBolge({ head: { ...BOS.head, ...ek.bolge.head }, upper: { ...BOS.upper, ...ek.bolge.upper }, trunk: { ...BOS.trunk, ...ek.bolge.trunk }, lower: { ...BOS.lower, ...ek.bolge.lower } });
        if (ek.mod === 'pasi' || ek.mod === 'easi') setMod(ek.mod);
      }
    } catch { setKayitHata('Hasta kaydı okunamadı — bağlantıyı kontrol edin.'); }
  }, []);
  useEffect(() => { yukle(hasta.id); }, [hasta.id, yukle]);

  const oge = mod === 'pasi' ? PASI_OGE : EASI_OGE;
  const enCokSiddet = mod === 'pasi' ? 4 : 3;
  const guncelle = (b: BolgeAnahtar, alan: keyof PasiRegion, n: number) =>
    setBolge((p) => ({ ...p, [b]: { ...p[b], [alan]: n } }));

  const pasiDeger = useMemo(() => pasi(bolge), [bolge]);
  const easiDeger = useMemo(() => easi(bolge), [bolge]);
  const toplam = mod === 'pasi' ? pasiDeger : easiDeger;
  const bant = mod === 'pasi' ? pasiBandi(pasiDeger) : easiBandi(easiDeger);

  const scGirildi = sc.yayginlik !== '' || sc.siddet !== '' || sc.oznel !== '';
  const scoradDeger = scorad(Number(sc.yayginlik) || 0, Number(sc.siddet) || 0, Number(sc.oznel) || 0);
  const scoradBant = scoradBandi(scoradDeger);

  const dolu = BOLGELER.some(({ k }) => bolge[k].a > 0);
  const modAd = mod === 'pasi' ? 'PASI' : 'EASI';
  const kopyaMetni = [
    `${modAd} ${toplam} (${bant.ad.toLocaleLowerCase('tr-TR')})`,
    ...BOLGELER.map(({ k, ad }) => `${ad}: ${oge.map((o) => `${o.kisa} ${bolge[k][o.k] ?? 0}`).join(' · ')} · A ${bolge[k].a} (${ALAN_ACIKLAMA[bolge[k].a]})`),
    scGirildi ? `SCORAD ${scoradDeger} (${scoradBant.ad.toLocaleLowerCase('tr-TR')}) — yaygınlık ${Number(sc.yayginlik) || 0}, şiddet ${Number(sc.siddet) || 0}, öznel ${Number(sc.oznel) || 0}` : null,
    `Şiddet bandı karar desteğidir; tedavi kararı hekimindir. ${new Date().toISOString().slice(0, 10)}`,
  ].filter(Boolean).join('\n');

  const notSatirlari = [
    `${modAd} ${toplam} — şiddet bandı: ${bant.ad}`,
    ...BOLGELER.map(({ k, ad }) => `${ad}: ${oge.map((o) => `${o.kisa} ${bolge[k][o.k] ?? 0}`).join(' · ')} · A ${bolge[k].a} (${ALAN_ACIKLAMA[bolge[k].a]})`),
    scGirildi ? `SCORAD ${scoradDeger} — ${scoradBant.ad}` : '',
  ].filter(Boolean);

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Skor</div>
        <Alan etiket="Hangi skor">
          <Segment etiket="Skor" deger={mod} set={(m) => setMod(m)} secenekler={[['pasi', 'PASI (psoriasis)'], ['easi', 'EASI (atopik dermatit)']] as Array<[Mod, string]>} />
        </Alan>
        <div style={satir}>
          <button type="button" onClick={() => setBolge(BOS)} style={ghost}>Bölge skorlarını temizle</button>
        </div>
        <div style={{ ...kucuk, marginTop: 8 }}>
          {mod === 'pasi'
            ? 'PASI = 0,1×(E+İ+D)×A (baş/boyun) + 0,2 üst ekstremite + 0,3 gövde + 0,4 alt ekstremite. Şiddet 0–4, alan derecesi 0–6. Bölge ağırlıkları erişkin içindir.'
            : 'EASI = 0,1×(E+Ö+Eks+Lik)×A (baş/boyun) + 0,2 üst ekstremite + 0,3 gövde + 0,4 alt ekstremite. Şiddet 0–3, alan derecesi 0–6. Bölge ağırlıkları erişkin içindir.'}
        </div>
      </div>

      {BOLGELER.map(({ k, ad, agirlik }) => (
        <div key={k} style={kutu}>
          <div style={{ ...etiket, display: 'flex', justifyContent: 'space-between' }}>
            <span>{ad}</span>
            <span style={{ ...kucuk, color: CHROME_RENK.muted }}>{agirlik}</span>
          </div>
          {oge.map((o) => (
            <Derece key={String(o.k)} etiketAd={`${ad} — ${o.ad}`} deger={Number(bolge[k][o.k] ?? 0)} enCok={enCokSiddet} set={(n) => guncelle(k, o.k, n)} />
          ))}
          <Derece etiketAd={`${ad} — Alan derecesi (${ALAN_ACIKLAMA[bolge[k].a]})`} deger={bolge[k].a} enCok={6} set={(n) => guncelle(k, 'a', n)} />
        </div>
      ))}

      <div style={kutu}>
        <Katlanir baslik="SCORAD (isteğe bağlı)" acik={scGirildi} rozet={scGirildi ? `SCORAD ${scoradDeger}` : undefined}>
        <div style={kucuk}>SCORAD = yaygınlık/5 + 3,5×şiddet + öznel (kaşıntı + uykusuzluk). Yaygınlık 0–100, şiddet 0–18, öznel 0–20.</div>
        <div style={satir}>
          <label style={{ ...metin, display: 'flex', gap: 6, alignItems: 'center' }}>Yaygınlık
            <input type="number" min={0} max={100} inputMode="numeric" aria-label="SCORAD yaygınlık" value={sc.yayginlik} onChange={(e) => setSc((p) => ({ ...p, yayginlik: e.target.value }))} style={{ ...dermStil.input, width: 90 }} />
          </label>
          <label style={{ ...metin, display: 'flex', gap: 6, alignItems: 'center' }}>Şiddet
            <input type="number" min={0} max={18} inputMode="numeric" aria-label="SCORAD şiddet" value={sc.siddet} onChange={(e) => setSc((p) => ({ ...p, siddet: e.target.value }))} style={{ ...dermStil.input, width: 90 }} />
          </label>
          <label style={{ ...metin, display: 'flex', gap: 6, alignItems: 'center' }}>Öznel
            <input type="number" min={0} max={20} inputMode="numeric" aria-label="SCORAD öznel" value={sc.oznel} onChange={(e) => setSc((p) => ({ ...p, oznel: e.target.value }))} style={{ ...dermStil.input, width: 90 }} />
          </label>
        </div>
        {scGirildi && <div style={{ ...satir }}><Rozet ton="bilgi">SCORAD {scoradDeger}</Rozet><span style={metin}>{scoradBant.ad}</span></div>}
        </Katlanir>
      </div>

      <div style={{ ...kutu, borderColor: 'rgba(244,114,182,0.35)' }} aria-live="polite">
        <div style={etiket}>Sonuç</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '4px 0 8px' }}>
          <Istatistik deger={`${modAd} ${toplam}`} etiket={`şiddet bandı: ${bant.ad}`} ton={dolu ? 'iyi' : 'notr'} />
          <Istatistik deger={mod === 'pasi' ? `EASI ${easiDeger}` : `PASI ${pasiDeger}`} etiket="diğer skor (aynı girdilerle)" />
          {scGirildi && <Istatistik deger={`SCORAD ${scoradDeger}`} etiket={scoradBant.ad} />}
        </div>
        <div style={{ ...kucuk }}>EASI şiddeti 0–3, PASI 0–4 ölçeğindedir — ölçeği değiştirmeden okumayın.</div>
        {!dolu && <div style={{ ...satir }}><Rozet ton="uyari">Alan derecesi (A) girilmeden skor 0 kalır</Rozet></div>}
        <div style={satir}><KopyalaButonu metin={kopyaMetni} /></div>
        <MuayeneFormunaEkle hastaId={hasta.id} arac={`${modAd} skoru`} satirlar={dolu ? notSatirlari : []} />
        <TaslakNotu>Şiddet bandı karar desteğidir (PASI 10/20 · EASI 7/21 · SCORAD 25/50); endikasyon, SUT kriteri ve tedavi basamağı hekimin kararıdır. Hesap kaydedilmez, nota otomatik yazılmaz.</TaslakNotu>
      </div>

      <div style={kutu}>
        <div style={etiket}>Hastada kaydet (isteğe bağlı)</div>
        <div style={kucuk}>Hesap için hasta seçmek gerekmez. Hasta seçerseniz son kayıtlı skor okunur ve bu vizitin skoru dosyaya kaydedilebilir.</div>
        <DermHastaSecici secili={hasta.id} sec={(id, ad) => setHasta({ id, ad })} />
        {kayitHata && <div style={{ ...dermStil.hata, marginTop: 6 }}>{kayitHata}</div>}
        <OncekiVizit tarih={sonSkor?.recorded_at || null}>
          {[sonSkor?.pasi != null ? `PASI ${sonSkor.pasi}` : '', sonSkor?.easi != null ? `EASI ${sonSkor.easi}` : '', sonSkor?.scorad != null ? `SCORAD ${sonSkor.scorad}` : ''].filter(Boolean).join(' · ') || 'skor yok'} — bölge girdileri bu araçtan kaydedildiyse geri yüklendi.
        </OncekiVizit>
        <KayitButonu
          etiket="Bu vizitin skorunu hastaya kaydet"
          hastaId={hasta.id}
          kapali={!dolu}
          kapaliNedeni="Alan derecesi (A) girilmeden skor 0 kalır — kaydedilecek değer yok."
          ipucu="Skor hastanın deri kaydına (skor anları) yazılır; bölge dökümü de saklanır, sonraki vizitte geri yüklenir."
          kaydet={async () => {
            const t = await getAccessTokenAsync();
            const r = await fetch('/api/doktor/dermatoloji', {
              method: 'POST',
              headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                patientId: hasta.id, action: 'skor',
                recorded_at: new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10),
                pasi: pasiDeger, easi: easiDeger,
                ...(scGirildi ? { scorad: scoradDeger } : {}),
                ek: { arac: 'pasi-easi', mod, bolge },
              }),
            });
            const j = await r.json().catch(() => ({}));
            if (!r.ok) return j.error || 'Kaydedilemedi.';
            await yukle(hasta.id);
            return null;
          }}
        />
        {hasta.id && <div style={satir}><a href={hastaDosyaHref(hasta.id, 'deri')} style={{ ...btn, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Hastada aç (Deri) →</a></div>}
      </div>
    </>
  );
}
