'use client';
/**
 * GENITAL-ESTETIK-01 (Kaan, 2026-11-06) — "Genital Estetik" of the patient file. KD ONLY: the tab button and this mount read
 * the same boolean (lib/doktor/genitalEstetikSunucu.ts → genitalEstetikBransi), and every route checks the branch again.
 *
 * Energy-based sessions, the injection log (lot numbers, recall search), whitening sessions, outcome-measure totals with
 * before / after trend, and intimate photo documentation. Every record carries its indication (cosmetic / medically
 * indicated); a cosmetic one cannot be chosen — and the server refuses it — for a patient under 18 or without a recorded
 * birth date. Photos: no thumbnail, a blurred placeholder until the doctor clicks, every view audited by the server, never
 * sent to any model. Words: specialties/kadin-dogum/engines/genitalEstetikMetinleri.ts. Same look as every other tab.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';
import KaynakKutusu from '@/components/doktor/araclar/KaynakKutusu';
import {
  GE_ADVERS, GE_BEYAZLATMA_BOLGE, GE_BEYAZLATMA_YONTEM, GE_ENERJI_AMAC, GE_ENERJI_BOLGE, GE_ENERJI_MODALITE, GE_ENJEKSIYON_BOLGE, GE_ENJEKSIYON_TEKNIK,
  GE_ENJEKSIYON_URUN, GE_FOTO_GORUNUMLERI, GE_MEDIKAL_GEREKCE, GE_OLCEKLER, GE_OLCEK_ARALIK, GE_OLCEK_LISANSLARI, GE_REAKSIYON, GE_YAS_SINIRI,
  geMedikalOlabilir, olcekToplamDegerlendir, olcekTrendi, type GeIslemTuru, type GeOlcek,
} from '@/lib/clinical/genitalEstetik';
import { GE_BOLUM_ADLARI, GE_COPS_YONLENDIRME, GE_ETIKET as L, GE_HATA, GE_KANIT, GE_KART, GE_KAYNAKLAR, GE_OLCEK_NOTU } from '@/specialties/kadin-dogum/engines/genitalEstetikMetinleri';

type Kayit = { id: string; tur: string; tarih: string; endikasyon: string | null; urunAdi: string | null; lot: string | null; sonrakiTarih: string | null; veri: Record<string, any> };
type FotoMeta = { id: string; gorunum: string; cekimTarihi: string; boyut: number };
type Veri = { kayitlar: Kayit[]; fotolar: FotoMeta[]; fotoOnamGecerli: boolean; yas: number | null; dogumTarihiVar: boolean };
type Sekme = 'enerji' | 'enjeksiyon' | 'beyazlatma' | 'olcek' | 'foto' | 'lot';

const btn: React.CSSProperties = { background: CHROME_RENK.pine, color: '#FAF8F4', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' };
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: CHROME_RENK.ink, border: `1px solid ${CHROME_RENK.border}` };
const et: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: CHROME_RENK.muted, marginBottom: 4 };
const izgara: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 };
const ince: React.CSSProperties = { fontSize: 12, color: CHROME_RENK.muted };
const bugun = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const trTarih = (g: string | null | undefined) => (g ? new Date(`${g}T12:00:00Z`).toLocaleDateString('tr-TR') : '—');

async function istek(yol: string, govde?: unknown): Promise<{ ok: boolean; j: any }> {
  const t = await getAccessTokenAsync();
  const r = await fetch(yol, govde === undefined ? { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' } : { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify(govde) });
  return { ok: r.ok, j: await r.json().catch(() => ({})) };
}

function Secim({ ad, deger, setDeger, anahtarlar, etiket }: { ad: string; deger: string; setDeger: (v: string) => void; anahtarlar: readonly string[]; etiket: Record<string, string> }) {
  return (<label><span style={et}>{ad}</span><select value={deger} onChange={(e) => setDeger(e.target.value)} style={{ ...toolsInput, width: '100%' }}><option value="">—</option>{anahtarlar.map((k) => <option key={k} value={k}>{etiket[k] || k}</option>)}</select></label>);
}
function Coklu({ ad, deger, setDeger, anahtarlar, etiket }: { ad: string; deger: string[]; setDeger: (v: string[]) => void; anahtarlar: readonly string[]; etiket: Record<string, string> }) {
  return (
    <fieldset style={{ border: 'none', padding: 0, margin: 0, gridColumn: '1 / -1' }}><span style={et}>{ad}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{anahtarlar.map((k) => (
        <label key={k} style={{ fontSize: 12.5, display: 'flex', gap: 4, alignItems: 'center' }}>
          <input type="checkbox" checked={deger.includes(k)} onChange={(e) => setDeger(e.target.checked ? [...deger, k] : deger.filter((x) => x !== k))} />{etiket[k] || k}
        </label>))}</div>
    </fieldset>
  );
}
function Alan({ ad, deger, setDeger, tip = 'text', uzun = false }: { ad: string; deger: string; setDeger: (v: string) => void; tip?: string; uzun?: boolean }) {
  return (<label style={{ gridColumn: uzun ? '1 / -1' : undefined }}><span style={et}>{ad}</span>{uzun
    ? <textarea value={deger} onChange={(e) => setDeger(e.target.value)} rows={2} style={{ ...toolsInput, width: '100%', fontFamily: 'inherit' }} />
    : <input type={tip} value={deger} onChange={(e) => setDeger(e.target.value)} style={{ ...toolsInput, width: '100%' }} />}</label>);
}

/** The indication block every procedure record carries. Cosmetic is not offered under 18 or without a birth date. */
function Endikasyon({ v, set, tur, alt, yas }: { v: Record<string, any>; set: (k: string, x: unknown) => void; tur: GeIslemTuru; alt?: { urun?: string; bolge?: string }; yas: number | null }) {
  const kozmetikKilitli = yas === null || yas < GE_YAS_SINIRI;
  const medikalOlur = geMedikalOlabilir(tur, alt);
  const secenek = (['kozmetik', 'medikal'] as const).filter((k) => (k === 'kozmetik' ? !kozmetikKilitli : medikalOlur));
  return (
    <div style={{ gridColumn: '1 / -1', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 10, padding: 10, background: '#FBF7EF' }} data-ge="endikasyon">
      <div style={izgara}>
        <Secim ad="Endikasyon" deger={v.endikasyon || ''} setDeger={(x) => set('endikasyon', x)} anahtarlar={secenek} etiket={L.endikasyon} />
        {v.endikasyon === 'medikal' && <Secim ad="Tıbbi gerekçe" deger={v.medikalGerekce || ''} setDeger={(x) => set('medikalGerekce', x)} anahtarlar={GE_MEDIKAL_GEREKCE} etiket={L.medikalGerekce} />}
        {v.endikasyon === 'medikal' && <Alan ad="Gerekçe (kendi cümlenizle)" deger={v.medikalAciklama || ''} setDeger={(x) => set('medikalAciklama', x)} uzun />}
      </div>
      {kozmetikKilitli && <div style={{ fontSize: 12, color: CHROME_RENK.warn, marginTop: 6 }} data-ge="yas-kilidi">{yas === null ? GE_HATA.dogum_tarihi_yok : GE_KART.yasKilidi}</div>}
      {!medikalOlur && <div style={{ ...ince, marginTop: 4 }}>{GE_HATA.medikal_bu_islemde_yok}</div>}
    </div>
  );
}

function Kanit({ tur }: { tur: GeIslemTuru }) {
  return (<div style={{ fontSize: 12.5, background: '#FFF8E6', border: '1px solid #E8D9A8', borderRadius: 8, padding: 8, margin: '8px 0', color: CHROME_RENK.ink }} data-ge="kanit">{GE_KANIT[tur]}</div>);
}

function useForm(ilk: Record<string, any>) {
  const [v, setV] = useState<Record<string, any>>(ilk);
  const set = (k: string, x: unknown) => setV((o) => ({ ...o, [k]: x }));
  return { v, set, sifirla: () => setV(ilk) };
}

function KayitFormu({ tur, yas, gonder }: { tur: 'enerji' | 'enjeksiyon' | 'beyazlatma'; yas: number | null; gonder: (tur: string, veri: unknown) => Promise<string | null> }) {
  const ilk = tur === 'enerji' ? { tarih: bugun(), bolgeler: [], advers: [], gecis: '1', seansNo: '1', seriToplam: '3', ayarlar: {} } : tur === 'enjeksiyon' ? { tarih: bugun(), advers: [], kontrolGun: '14' } : { tarih: bugun(), endikasyon: 'kozmetik', bolgeler: [], reaksiyon: [] };
  const { v, set, sifirla } = useForm(ilk);
  const [mesaj, setMesaj] = useState('');
  const ayar = (k: string, x: string) => set('ayarlar', { ...(v.ayarlar || {}), [k]: x });
  const kaydet = async () => { setMesaj(''); const h = await gonder(tur, v); if (h) setMesaj(h); else { setMesaj('Kaydedildi.'); sifirla(); } };
  return (
    <div style={{ ...toolsCard, marginBottom: 12 }} data-ge-form={tur}>
      <div style={{ fontWeight: 700, color: CHROME_RENK.ink }}>{GE_BOLUM_ADLARI[tur]}</div>
      <Kanit tur={tur} />
      <div style={izgara}>
        <Alan ad="Tarih" tip="date" deger={v.tarih} setDeger={(x) => set('tarih', x)} />
        {tur !== 'beyazlatma' && <Endikasyon v={v} set={set} tur={tur} alt={{ urun: v.urun, bolge: v.bolge }} yas={yas} />}
        {tur === 'beyazlatma' && (yas === null || yas < GE_YAS_SINIRI) && <div style={{ gridColumn: '1 / -1', color: CHROME_RENK.warn, fontSize: 12.5 }} data-ge="yas-kilidi">{yas === null ? GE_HATA.dogum_tarihi_yok : GE_HATA.yas_18_alti}</div>}
        {tur === 'enerji' && (<>
          <Secim ad="Cihaz türü" deger={v.modalite || ''} setDeger={(x) => set('modalite', x)} anahtarlar={GE_ENERJI_MODALITE} etiket={L.modalite} />
          <Alan ad="Cihaz (marka / model)" deger={v.cihaz || ''} setDeger={(x) => set('cihaz', x)} />
          {v.modalite === 'diger' && <Alan ad="Dalga boyu (nm)" tip="number" deger={v.dalgaBoyuNm || ''} setDeger={(x) => set('dalgaBoyuNm', x)} />}
          <Secim ad="Amaç" deger={v.amac || ''} setDeger={(x) => set('amac', x)} anahtarlar={GE_ENERJI_AMAC} etiket={L.amac} />
          <Alan ad="Güç (W)" tip="number" deger={v.ayarlar?.gucW || ''} setDeger={(x) => ayar('gucW', x)} />
          <Alan ad="Enerji (mJ)" tip="number" deger={v.ayarlar?.enerjiMj || ''} setDeger={(x) => ayar('enerjiMj', x)} />
          <Alan ad="Yoğunluk (%)" tip="number" deger={v.ayarlar?.yogunlukYuzde || ''} setDeger={(x) => ayar('yogunlukYuzde', x)} />
          <Alan ad="Nokta aralığı (µm)" tip="number" deger={v.ayarlar?.aralikMikron || ''} setDeger={(x) => ayar('aralikMikron', x)} />
          <Alan ad="Darbe süresi (ms)" tip="number" deger={v.ayarlar?.darbeSuresiMs || ''} setDeger={(x) => ayar('darbeSuresiMs', x)} />
          <Alan ad="RF hedef sıcaklık (°C)" tip="number" deger={v.ayarlar?.hedefSicaklikC || ''} setDeger={(x) => ayar('hedefSicaklikC', x)} />
          <Alan ad="Stack" tip="number" deger={v.ayarlar?.yigma || ''} setDeger={(x) => ayar('yigma', x)} />
          <Alan ad="Geçiş sayısı" tip="number" deger={v.gecis} setDeger={(x) => set('gecis', x)} />
          <Alan ad="Seans no" tip="number" deger={v.seansNo} setDeger={(x) => set('seansNo', x)} />
          <Alan ad="Serideki toplam seans" tip="number" deger={v.seriToplam} setDeger={(x) => set('seriToplam', x)} />
          <Alan ad="Sonraki seansa gün (14–90)" tip="number" deger={v.aralikGun || ''} setDeger={(x) => set('aralikGun', x)} />
          <Coklu ad="Bölge" deger={v.bolgeler} setDeger={(x) => set('bolgeler', x)} anahtarlar={GE_ENERJI_BOLGE} etiket={L.enerjiBolge} />
          <Coklu ad="Yan etki" deger={v.advers} setDeger={(x) => set('advers', x)} anahtarlar={GE_ADVERS} etiket={L.advers} />
          <Alan ad="Yan etki açıklaması" deger={v.adversAciklama || ''} setDeger={(x) => set('adversAciklama', x)} uzun />
        </>)}
        {tur === 'enjeksiyon' && (<>
          <Secim ad="Ürün türü" deger={v.urun || ''} setDeger={(x) => set('urun', x)} anahtarlar={GE_ENJEKSIYON_URUN} etiket={L.urun} />
          <Alan ad="Ürün adı" deger={v.urunAdi || ''} setDeger={(x) => set('urunAdi', x)} />
          <Alan ad="Lot numarası" deger={v.lot || ''} setDeger={(x) => set('lot', x)} />
          <Alan ad="Son kullanma (YYYY-AA)" deger={v.sonKullanma || ''} setDeger={(x) => set('sonKullanma', x)} />
          <Alan ad="Hacim (mL)" tip="number" deger={v.hacimMl || ''} setDeger={(x) => set('hacimMl', x)} />
          <Secim ad="Bölge" deger={v.bolge || ''} setDeger={(x) => set('bolge', x)} anahtarlar={GE_ENJEKSIYON_BOLGE} etiket={L.enjBolge} />
          <Secim ad="Teknik" deger={v.teknik || ''} setDeger={(x) => set('teknik', x)} anahtarlar={GE_ENJEKSIYON_TEKNIK} etiket={L.teknik} />
          <Alan ad="İğne / kanül" deger={v.igneKanul || ''} setDeger={(x) => set('igneKanul', x)} />
          <Alan ad="Kontrol (gün sonra)" tip="number" deger={v.kontrolGun} setDeger={(x) => set('kontrolGun', x)} />
          <Coklu ad="Yan etki" deger={v.advers} setDeger={(x) => set('advers', x)} anahtarlar={GE_ADVERS} etiket={L.advers} />
          <Alan ad="Yan etki açıklaması" deger={v.adversAciklama || ''} setDeger={(x) => set('adversAciklama', x)} uzun />
        </>)}
        {tur === 'beyazlatma' && (<>
          <Secim ad="Yöntem" deger={v.yontem || ''} setDeger={(x) => set('yontem', x)} anahtarlar={GE_BEYAZLATMA_YONTEM} etiket={L.yontem} />
          {v.yontem !== 'lazer' ? (<>
            <Alan ad="Ajan" deger={v.ajan || ''} setDeger={(x) => set('ajan', x)} />
            <Alan ad="Konsantrasyon (%)" tip="number" deger={v.konsantrasyonYuzde || ''} setDeger={(x) => set('konsantrasyonYuzde', x)} />
            <Alan ad="Temas süresi (dk)" tip="number" deger={v.temasSuresiDk || ''} setDeger={(x) => set('temasSuresiDk', x)} />
            <Alan ad="Kat sayısı" tip="number" deger={v.katSayisi || ''} setDeger={(x) => set('katSayisi', x)} />
          </>) : <Alan ad="Cihaz (marka / model)" deger={v.cihaz || ''} setDeger={(x) => set('cihaz', x)} />}
          <Alan ad="Kontrol (gün sonra)" tip="number" deger={v.kontrolGun || ''} setDeger={(x) => set('kontrolGun', x)} />
          <Coklu ad="Bölge" deger={v.bolgeler} setDeger={(x) => set('bolgeler', x)} anahtarlar={GE_BEYAZLATMA_BOLGE} etiket={L.beyBolge} />
          <Coklu ad="Reaksiyon" deger={v.reaksiyon} setDeger={(x) => set('reaksiyon', x)} anahtarlar={GE_REAKSIYON} etiket={L.reaksiyon} />
          <Alan ad="Reaksiyon açıklaması" deger={v.reaksiyonAciklama || ''} setDeger={(x) => set('reaksiyonAciklama', x)} uzun />
        </>)}
      </div>
      {mesaj && <div style={{ fontSize: 12.5, marginTop: 8, color: mesaj === 'Kaydedildi.' ? '#2E6E4E' : CHROME_RENK.warn }}>{mesaj}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}><button type="button" style={btn} onClick={kaydet}>Kaydet</button></div>
    </div>
  );
}

function KayitListesi({ kayitlar, tur, patientId }: { kayitlar: Kayit[]; tur: string; patientId: string }) {
  const l = kayitlar.filter((k) => k.tur === tur);
  return (
    <div style={{ ...toolsCard, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 700, color: CHROME_RENK.ink }}>Kayıtlar</div>
        <a href={`/dashboard/doktor/hastalar/${patientId}/genital-estetik/yazdir?talimat=${tur}`} target="_blank" rel="noreferrer" style={{ ...ghost, textDecoration: 'none', padding: '4px 10px' }}>Hasta talimat sayfası</a>
      </div>
      {!l.length && <div style={{ ...ince, marginTop: 6 }}>Kayıt yok.</div>}
      {l.map((k) => (
        <div key={k.id} style={{ borderTop: `1px solid ${CHROME_RENK.border}`, padding: '8px 0', fontSize: 13 }} data-ge-kayit={tur}>
          <b>{trTarih(k.tarih)}</b> · {L.endikasyon[k.endikasyon || ''] || ''}
          {tur === 'enerji' && <> · {L.modalite[k.veri.modalite] || ''} · {k.veri.cihaz} · seans {k.veri.seansNo}/{k.veri.seriToplam} · {k.veri.gecis} geçiş{k.sonrakiTarih ? ` · sonraki: ${trTarih(k.sonrakiTarih)}` : ''}</>}
          {tur === 'enjeksiyon' && <> · {L.urun[k.veri.urun] || ''} {k.urunAdi} · <b>lot {k.lot}</b> · SKT {trTarih(k.veri.sonKullanma)} · {k.veri.hacimMl} mL · {L.enjBolge[k.veri.bolge] || ''} · kontrol {trTarih(k.sonrakiTarih)}</>}
          {tur === 'beyazlatma' && <> · {L.yontem[k.veri.yontem] || ''} · {k.veri.ajan || k.veri.cihaz}{k.veri.konsantrasyonYuzde ? ` %${k.veri.konsantrasyonYuzde}` : ''} · {(k.veri.bolgeler || []).map((b: string) => L.beyBolge[b]).join(', ')}</>}
          {(k.veri.advers || k.veri.reaksiyon || []).filter((a: string) => a !== 'yok').length > 0 && <div style={{ color: CHROME_RENK.warn, fontSize: 12 }}>Yan etki / reaksiyon: {(k.veri.advers || k.veri.reaksiyon).map((a: string) => L.advers[a] || L.reaksiyon[a] || a).join(', ')} — {k.veri.adversAciklama || k.veri.reaksiyonAciklama}</div>}
        </div>
      ))}
    </div>
  );
}

function Olcekler({ kayitlar, gonder }: { kayitlar: Kayit[]; gonder: (tur: string, veri: unknown) => Promise<string | null> }) {
  const [form, setForm] = useState<{ olcek: GeOlcek | ''; tarih: string; asama: string; toplam: string }>({ olcek: '', tarih: bugun(), asama: 'oncesi', toplam: '' });
  const [mesaj, setMesaj] = useState('');
  const onizleme = form.olcek ? olcekToplamDegerlendir(form.olcek, form.toplam) : null;
  const kaydet = async () => { setMesaj(''); const h = await gonder('olcek', form); if (h) setMesaj(h); else { setMesaj('Kaydedildi.'); setForm((f) => ({ ...f, toplam: '' })); } };
  return (
    <div>
      <div style={{ ...toolsCard, marginBottom: 12 }} data-ge-form="olcek">
        <div style={{ fontWeight: 700, color: CHROME_RENK.ink }}>{GE_BOLUM_ADLARI.olcek}</div>
        <div style={{ ...ince, margin: '6px 0' }}>{GE_OLCEK_NOTU}</div>
        <div style={izgara}>
          <Secim ad="Ölçek" deger={form.olcek} setDeger={(x) => setForm((f) => ({ ...f, olcek: x as GeOlcek }))} anahtarlar={GE_OLCEKLER} etiket={L.olcek} />
          <Alan ad="Tarih" tip="date" deger={form.tarih} setDeger={(x) => setForm((f) => ({ ...f, tarih: x }))} />
          <Secim ad="Aşama" deger={form.asama} setDeger={(x) => setForm((f) => ({ ...f, asama: x }))} anahtarlar={['oncesi', 'sonrasi', 'izlem']} etiket={L.asama} />
          <Alan ad={form.olcek ? `Toplam (${GE_OLCEK_ARALIK[form.olcek].enAz}–${GE_OLCEK_ARALIK[form.olcek].enCok})` : 'Toplam'} tip="number" deger={form.toplam} setDeger={(x) => setForm((f) => ({ ...f, toplam: x }))} />
        </div>
        {onizleme?.gecerli && onizleme.bant && <div style={{ ...ince, marginTop: 6 }}>{L.bant[onizleme.bant]}</div>}
        {onizleme?.gecerli && onizleme.yonlendirmeOner && <div style={{ marginTop: 8, padding: 10, borderRadius: 8, background: '#FDECEC', border: '1px solid #E7B7B7', fontSize: 13 }} data-ge="cops-yonlendirme">{GE_COPS_YONLENDIRME}</div>}
        {mesaj && <div style={{ fontSize: 12.5, marginTop: 8, color: mesaj === 'Kaydedildi.' ? '#2E6E4E' : CHROME_RENK.warn }}>{mesaj}</div>}
        <div style={{ marginTop: 10 }}><button type="button" style={btn} onClick={kaydet}>Toplamı kaydet</button></div>
      </div>
      {GE_OLCEKLER.map((o) => {
        const noktalar = kayitlar.filter((k) => k.tur === 'olcek' && k.veri.olcek === o).map((k) => ({ tarih: k.tarih, toplam: Number(k.veri.toplam), asama: String(k.veri.asama), yonlendirme: !!k.veri.yonlendirmeOner }));
        const tr = olcekTrendi(noktalar);
        const lis = GE_OLCEK_LISANSLARI[o];
        return (
          <div key={o} style={{ ...toolsCard, marginBottom: 10 }} data-ge-olcek={o}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 700, color: CHROME_RENK.ink, fontSize: 14 }}>{L.olcek[o]}</div>
              <span style={{ fontSize: 11.5, padding: '2px 8px', borderRadius: 999, background: '#F3EAD8', color: CHROME_RENK.ink }} data-ge-lisans={lis.durum}>Maddeler: {L.lisans[lis.durum]}{lis.dogrulanmis ? '' : ' · biçimsel geçerlik yok'}</span>
            </div>
            {!noktalar.length ? <div style={ince}>Kayıtlı toplam yok.</div> : (
              <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse', marginTop: 6 }}><tbody>
                {tr.noktalar.map((n, i) => { const a = noktalar.find((x) => x.tarih === n.tarih && x.toplam === n.toplam); return <tr key={i}><td style={{ padding: '2px 4px' }}>{trTarih(n.tarih)}</td><td>{L.asama[a?.asama || ''] || ''}</td><td><b>{n.toplam}</b></td><td style={{ color: a?.yonlendirme ? CHROME_RENK.warn : undefined }}>{a?.yonlendirme ? 'Yönlendirme önerisi gösterildi' : ''}</td></tr>; })}
              </tbody></table>
            )}
            {tr.degisim !== null && tr.noktalar.length > 1 && <div style={{ ...ince, marginTop: 4 }}>İlk → son: {tr.ilk} → {tr.son} ({tr.degisim > 0 ? '+' : ''}{tr.degisim})</div>}
          </div>
        );
      })}
      <KaynakKutusu kaynaklar={GE_KAYNAKLAR.olcek} />
    </div>
  );
}

/** One intimate photo: a blurred placeholder (no image data at all) until the doctor clicks; the click is the audited view. */
function MahremFoto({ f, patientId }: { f: FotoMeta; patientId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [hata, setHata] = useState('');
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  const goster = async () => {
    setHata('');
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch(`/api/doktor/genital-estetik/foto/${f.id}?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
      if (!r.ok) { setHata('Gösterilemedi.'); return; }
      setUrl(URL.createObjectURL(await r.blob()));
    } catch { setHata('Gösterilemedi.'); }
  };
  return (
    <div style={{ border: `1px solid ${CHROME_RENK.border}`, borderRadius: 10, padding: 8, width: 240 }} data-ge-foto={f.id}>
      <div style={{ fontSize: 12, fontWeight: 600 }}>{L.gorunum[f.gorunum] || f.gorunum} · {trTarih(f.cekimTarihi)}</div>
      {url ? (
        <div><img src={url} alt="" style={{ width: '100%', borderRadius: 6, marginTop: 6 }} /><button type="button" style={{ ...ghost, marginTop: 6, padding: '4px 10px' }} onClick={() => { URL.revokeObjectURL(url); setUrl(null); }}>Gizle</button></div>
      ) : (
        <button type="button" onClick={goster} data-ge="bulanik" style={{ width: '100%', height: 140, marginTop: 6, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'repeating-linear-gradient(45deg,#d9d2c6,#d9d2c6 8px,#cfc7ba 8px,#cfc7ba 16px)', filter: 'blur(1.5px)', color: CHROME_RENK.ink, fontWeight: 700 }}>Göstermek için tıklayın (kayda yazılır)</button>
      )}
      {hata && <div style={{ fontSize: 12, color: CHROME_RENK.warn }}>{hata}</div>}
    </div>
  );
}

function Fotograflar({ veri, patientId, gonder, yenile }: { veri: Veri; patientId: string; gonder: (tur: string, veri: unknown) => Promise<string | null>; yenile: () => void }) {
  const [onam, setOnam] = useState({ tarih: bugun(), belgeleme: false, egitimYayin: false });
  const [gorunum, setGorunum] = useState('');
  const [tarih, setTarih] = useState(bugun());
  const [mesaj, setMesaj] = useState('');
  const [filtre, setFiltre] = useState('');
  const onamKaydet = async () => { setMesaj(''); const h = await gonder('foto_onam', onam); setMesaj(h || 'Fotoğraf onamı kaydedildi.'); };
  const yukle = async (dosya: File | undefined) => {
    setMesaj('');
    if (!dosya || !gorunum) { setMesaj(GE_HATA.gorunum_yok); return; }
    // Re-encode through a canvas (drops EXIF/GPS in the browser too) and cap the long side at 2000 px.
    const img = await createImageBitmap(dosya).catch(() => null);
    if (!img) { setMesaj(GE_HATA.foto_gecersiz); return; }
    const olcek = Math.min(1, 2000 / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width * olcek); c.height = Math.round(img.height * olcek);
    c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
    const gorsel = c.toDataURL('image/jpeg', 0.9);
    const { ok, j } = await istek('/api/doktor/genital-estetik/foto', { patientId, gorunum, cekimTarihi: tarih, gorsel });
    if (!ok) { setMesaj(j.error || 'Yüklenemedi.'); return; }
    setMesaj('Fotoğraf şifreli olarak kaydedildi.'); yenile();
  };
  const liste = veri.fotolar.filter((f) => !filtre || f.gorunum === filtre);
  return (
    <div>
      <div style={{ ...toolsCard, marginBottom: 12 }} data-ge-form="foto">
        <div style={{ fontWeight: 700, color: CHROME_RENK.ink }}>{GE_BOLUM_ADLARI.foto}</div>
        <div style={{ ...ince, margin: '6px 0' }}>{GE_KART.fotoUyari}</div>
        <div style={{ fontSize: 12.5, marginBottom: 6 }}>Fotoğraf onamı: <b style={{ color: veri.fotoOnamGecerli ? '#2E6E4E' : CHROME_RENK.warn }}>{veri.fotoOnamGecerli ? 'geçerli' : 'yok'}</b></div>
        {!veri.fotoOnamGecerli && (
          <div style={{ border: `1px solid ${CHROME_RENK.border}`, borderRadius: 10, padding: 10, marginBottom: 10 }} data-ge="foto-onam">
            <div style={{ fontSize: 12.5, marginBottom: 6 }}>{GE_KART.fotoOnamMetni}</div>
            <div style={izgara}>
              <Alan ad="Onam tarihi" tip="date" deger={onam.tarih} setDeger={(x) => setOnam((o) => ({ ...o, tarih: x }))} />
              <label style={{ fontSize: 12.5 }}><input type="checkbox" checked={onam.belgeleme} onChange={(e) => setOnam((o) => ({ ...o, belgeleme: e.target.checked }))} /> Tıbbi kayıt ve takip için fotoğraf onamı alındı</label>
              <label style={{ fontSize: 12.5 }}><input type="checkbox" checked={onam.egitimYayin} onChange={(e) => setOnam((o) => ({ ...o, egitimYayin: e.target.checked }))} /> Kimliksizleştirilmiş eğitim / yayın kullanımına ayrıca onay verdi</label>
            </div>
            <button type="button" style={{ ...btn, marginTop: 8 }} onClick={onamKaydet}>Onamı kaydet</button>
          </div>
        )}
        {veri.fotoOnamGecerli && (
          <div style={izgara}>
            <Secim ad="Standart görünüm" deger={gorunum} setDeger={setGorunum} anahtarlar={GE_FOTO_GORUNUMLERI} etiket={L.gorunum} />
            <Alan ad="Çekim tarihi" tip="date" deger={tarih} setDeger={setTarih} />
            <label><span style={et}>Fotoğraf (JPEG / PNG)</span><input type="file" accept="image/jpeg,image/png" onChange={(e) => yukle(e.target.files?.[0])} /></label>
          </div>
        )}
        {mesaj && <div style={{ fontSize: 12.5, marginTop: 8 }}>{mesaj}</div>}
      </div>
      <div style={{ ...toolsCard, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, color: CHROME_RENK.ink }}>Öncesi / sonrası (aynı görünüm)</div>
          <select value={filtre} onChange={(e) => setFiltre(e.target.value)} style={toolsInput}><option value="">Tüm görünümler</option>{GE_FOTO_GORUNUMLERI.map((g) => <option key={g} value={g}>{L.gorunum[g]}</option>)}</select>
        </div>
        {!liste.length && <div style={{ ...ince, marginTop: 6 }}>Fotoğraf yok.</div>}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>{liste.slice().reverse().map((f) => <MahremFoto key={f.id} f={f} patientId={patientId} />)}</div>
      </div>
      <KaynakKutusu kaynaklar={GE_KAYNAKLAR.foto} />
    </div>
  );
}

function LotGeriCagirma() {
  const [lot, setLot] = useState('');
  const [sonuc, setSonuc] = useState<{ patientId: string; hastaAd: string; tarih: string; urunAdi: string | null; lot: string }[] | null>(null);
  const ara = async () => { const { j } = await istek(`/api/doktor/genital-estetik?lot=${encodeURIComponent(lot)}`); setSonuc(j.sonuc || []); };
  return (
    <div style={{ ...toolsCard, marginBottom: 12 }} data-ge-form="lot">
      <div style={{ fontWeight: 700, color: CHROME_RENK.ink }}>Lot geri çağırma araması</div>
      <div style={{ ...ince, margin: '6px 0' }}>Üretici veya yetkili kurum bir lotu geri çağırdığında, bu lotun uygulandığı kendi hastalarınızı listeler.</div>
      <div style={{ display: 'flex', gap: 8 }}><input value={lot} onChange={(e) => setLot(e.target.value)} placeholder="Lot numarası" style={{ ...toolsInput, flex: 1 }} /><button type="button" style={btn} onClick={ara}>Ara</button></div>
      {sonuc && (sonuc.length ? sonuc.map((s, i) => <div key={i} style={{ fontSize: 13, borderTop: `1px solid ${CHROME_RENK.border}`, padding: '6px 0' }}><a href={`/dashboard/doktor/hastalar/${s.patientId}?tab=genital-estetik`}>{s.hastaAd}</a> · {trTarih(s.tarih)} · {s.urunAdi} · lot {s.lot}</div>) : <div style={{ ...ince, marginTop: 6 }}>Bu lotla kayıt yok.</div>)}
    </div>
  );
}

export default function HastaGenitalEstetik({ patientId }: { patientId: string }) {
  const [veri, setVeri] = useState<Veri | null>(null);
  const [hata, setHata] = useState('');
  const [sekme, setSekme] = useState<Sekme>('enerji');
  const yukle = useCallback(async () => {
    try { const { ok, j } = await istek(`/api/doktor/genital-estetik?patientId=${encodeURIComponent(patientId)}`); if (!ok) { setHata(j.error || 'Yüklenemedi.'); return; } setVeri(j); } catch { setHata('Yüklenemedi.'); }
  }, [patientId]);
  useEffect(() => { yukle(); }, [yukle]);
  const gonder = useCallback(async (tur: string, v: unknown): Promise<string | null> => {
    const { ok, j } = await istek('/api/doktor/genital-estetik', { patientId, tur, veri: v });
    if (!ok) return j.error || 'Kaydedilemedi.';
    await yukle(); return null;
  }, [patientId, yukle]);
  const sekmeler = useMemo(() => ([['enerji', 'Lazer / RF'], ['enjeksiyon', 'Enjeksiyon'], ['beyazlatma', 'Beyazlatma'], ['olcek', 'Ölçekler'], ['foto', 'Fotoğraflar'], ['lot', 'Lot geri çağırma']] as [Sekme, string][]), []);
  if (hata) return <div style={{ ...toolsCard, color: CHROME_RENK.warn, fontSize: 13 }}>{hata}</div>;
  if (!veri) return <div style={{ ...toolsCard, color: CHROME_RENK.muted, fontSize: 13 }}>Yükleniyor…</div>;
  const kilit = veri.yas === null || veri.yas < GE_YAS_SINIRI;
  return (
    <div data-sekme="genital-estetik">
      <div style={{ ...toolsCard, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, color: CHROME_RENK.ink, fontSize: 16 }}>{GE_KART.baslik}</div>
        <div style={{ fontSize: 12.5, color: CHROME_RENK.muted }}>{GE_KART.alt}</div>
        {kilit && <div style={{ marginTop: 8, fontSize: 12.5, color: CHROME_RENK.warn, fontWeight: 600 }} data-ge="yas-kilidi-ust">{veri.dogumTarihiVar ? GE_KART.yasKilidi : GE_HATA.dogum_tarihi_yok}</div>}
        <div style={{ ...ince, marginTop: 6 }}>{GE_KART.himen} {GE_KART.ulusalNot} Cerrahi işlemler "Ameliyat Notları" sekmesindeki genital estetik şablonlarıyla yazılır.</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>{sekmeler.map(([id, ad]) => <button key={id} type="button" onClick={() => setSekme(id)} style={sekme === id ? btn : ghost}>{ad}</button>)}</div>
      </div>
      {(sekme === 'enerji' || sekme === 'enjeksiyon' || sekme === 'beyazlatma') && (<>
        <KayitFormu key={sekme} tur={sekme} yas={veri.yas} gonder={gonder} />
        <KayitListesi kayitlar={veri.kayitlar} tur={sekme} patientId={patientId} />
        <KaynakKutusu kaynaklar={[...GE_KAYNAKLAR[sekme], ...GE_KAYNAKLAR.genel]} not={GE_KART.ulusalNot} />
      </>)}
      {sekme === 'olcek' && <Olcekler kayitlar={veri.kayitlar} gonder={gonder} />}
      {sekme === 'foto' && <Fotograflar veri={veri} patientId={patientId} gonder={gonder} yenile={yukle} />}
      {sekme === 'lot' && <LotGeriCagirma />}
    </div>
  );
}
