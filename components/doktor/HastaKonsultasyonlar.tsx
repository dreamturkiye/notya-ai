'use client';
/**
 * KONSULTASYON-01 (Kaan 2026-09-19) — hasta dosyası › Konsültasyonlar. EVRENSEL (tüm branşlar); branş kapısı yok.
 *
 * Kaan'ın "show proof" görünümü: her satırda durum, hedef branş, klinik soru, istem tarihi; yanıtlandıysa hekimin
 * özet cümlesi + tarih + "📎 rapor" (Kasa'dan görüntüle) + muayene notuna eklendiyse bağlantısı; açıksa kaç gündür
 * beklediği ve "Yanıt ekle" / "Hatırlat" / "Yanıtsız kapat".
 *
 * Terim: "Konsültasyon" (eş anlamlı "yönlendirme"). "Sevk" yazılmaz — SGK sevki (SUT EK-2/F / e-sevk) ayrı belgedir.
 * Hekim kilidi: yanıt özeti hekimin cümlesidir; belgeden çıkarılmış Tier A özeti yalnız TASLAK öneri olarak görünür.
 * Nota yalnız "Bugünkü muayene formuna ekle" basılınca yazılır. Ortak UI: lib/doktor/aracUi.tsx.
 *
 * AYSE-KONSULTASYON-01 (Dr. Gökhan + Kaan): hedef branş seçilince Ayşe istem metnini hasta dosyasından (son muayene
 * ağırlıklı) TASLAK yazar — alan DOLU gelir, ayrı düğme yok; yanıt formunda bağlı rapordan özet taslağı dolu gelir.
 * Taslak hekimin yazdığının üstüne yazılmaz; üretilemezse form boş ama kullanılabilir ("elle yazabilirsiniz").
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import DocumentViewer from '@/components/doktor/DocumentViewer';
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';
import { konsultasyonApi, konsultasyonIslemi, istemTaslagiIste, yanitTaslagiIsteVeGerekirseKimliksizlestir, YANITSIZ_KAPAT_ONAYI, YANITSIZ_SIL_ONAYI, HATIRLATMA_GONDERILDI } from '@/lib/doktor/konsultasyonIstemci';
import { taslakUygulanir } from '@/lib/doktor/konsultasyonTaslagi';
import { muayeneFormuYolu } from '@/lib/doktor/muayeneFormuYolu';
import {
  AracVurguSaglayici, VURGU_TEAL, useAracStil, Alan, Segment, Katlanir, Rozet, TaslakNotu,
} from '@/lib/doktor/aracUi';
import {
  ACILIYET_ETIKETI, DURUM_ETIKETI, KLINIK_SORU_EN_AZ, KONSULTASYON_SINIRLARI, REVIZYON_ALAN_ETIKETI,
  bugunTrIso, durumGrubu, olasiKisaltmalar, trGun, type Aciliyet, type KonsultasyonRevizyonu, type KonsultasyonSatiri,
} from '@/lib/doktor/konsultasyon';

/** GET ?patientId= satırı (sunucu ekleri ile). */
export type KonsultasyonGorunumu = KonsultasyonSatiri & {
  hedefEtiketi: string
  eskiKayit: boolean
  gun: number
  belge: { id: string; ad: string; tur: string; tarih: string; silindi: boolean } | null
  belgeTaslagi: { durum: string; ozet: string } | null
  /** AYSE-KONSULTASYON-01: düzenleme izi (önceki metinler) — eskiden yeniye. */
  duzenlemeler?: KonsultasyonRevizyonu[]
}
type Hedefler = { onerilen: Array<[string, string]>; diger: Array<[string, string]> }
type KasaBelgesi = { id: string; fileName: string; fileType: string; category: string | null; createdAt: string }

const api = konsultasyonApi;

/* ───────────────────────── Ayşe taslak durumu (ortak gösterim) ───────────────────────── */

export type TaslakDurumu =
  | { durum: 'yok' }
  | { durum: 'yaziyor' }
  | { durum: 'hazir'; duzenlendi: boolean; bilgi?: string }
  | { durum: 'korundu'; bekleyen: string }
  | { durum: 'hata'; mesaj: string };

/**
 * Taslağın yanındaki durum satırı: TASLAK rozeti + hekim onayı dili (TaslakNotu). Hata halinde form boş ama kullanılabilir
 * ve "elle yazabilirsiniz" der — hekim asla kilitlenmez.
 */
export function AyseTaslakDurumu({ t, yon, taslagiKullan }: { t: TaslakDurumu; yon: 'istem' | 'yanit'; taslagiKullan?: () => void }) {
  const stil = useAracStil();
  if (t.durum === 'yok') return null;
  if (t.durum === 'yaziyor') {
    return <div style={{ ...stil.kucuk, display: 'flex', gap: 8, alignItems: 'center' }} aria-live="polite"><Rozet ton="bilgi">Ayşe</Rozet>{yon === 'istem' ? 'Ayşe hasta dosyasından istem taslağını yazıyor… Beklemeden kendiniz de yazabilirsiniz.' : 'Ayşe raporu okuyup özet taslağını çıkarıyor… Beklemeden kendiniz de yazabilirsiniz.'}</div>;
  }
  if (t.durum === 'hata') return <div style={stil.uyari} aria-live="polite">{t.mesaj}</div>;
  if (t.durum === 'korundu') {
    return (
      <div style={stil.uyari} aria-live="polite">
        Siz yazmaya başladığınız için Ayşe&apos;nin taslağı metninizin üstüne yazılmadı.
        {taslagiKullan && <button type="button" onClick={taslagiKullan} style={{ ...stil.ghost, marginLeft: 8, marginTop: 6 }}>Ayşe&apos;nin taslağını kullan</button>}
      </div>
    );
  }
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {t.duzenlendi ? <Rozet ton="bilgi">Ayşe taslağı · düzenlendi</Rozet> : <Rozet ton="uyari">TASLAK · Ayşe · hekim onayı bekliyor</Rozet>}
        {t.bilgi && <span style={stil.kucuk}>{t.bilgi}</span>}
      </div>
      <TaslakNotu>{yon === 'istem'
        ? 'Ayşe yalnız hasta dosyasındaki bilgiyle yazdı (tanı, evre, doz eklemez). Okuyun, düzenleyin; “Oluştur”a basmadan hiçbir şey kaydedilmez.'
        : 'Ayşe raporu okuyup özet taslağı çıkardı. Özet sizin cümlenizdir — Notya tanı iddia etmez. Onaylamadan konsültasyon “yanıtlandı” olmaz.'}</TaslakNotu>
    </div>
  );
}

/* ───────────────────────── Yeni istem formu ───────────────────────── */

export function YeniKonsultasyonFormu({ patientId, hedefler, olustu, vazgec }: {
  patientId: string
  hedefler: Hedefler
  olustu: (k: KonsultasyonGorunumu) => void
  vazgec?: () => void
}) {
  const stil = useAracStil();
  const [hedef, setHedef] = useState('');
  const [soru, setSoru] = useState('');
  const [aciliyet, setAciliyet] = useState<Aciliyet>('rutin');
  const [hekim, setHekim] = useState('');
  const [tanilar, setTanilar] = useState('');
  const [durum, setDurum] = useState('');
  const [not, setNot] = useState('');
  const [ayseNotu, setAyseNotu] = useState('');
  const [taslak, setTaslak] = useState<TaslakDurumu>({ durum: 'yok' });
  const [gonderiyor, setGonderiyor] = useState(false);
  const [hata, setHata] = useState('');
  const kisaltmalar = olasiKisaltmalar(soru);
  const hazir = !!hedef && soru.trim().length >= KLINIK_SORU_EN_AZ && !gonderiyor;

  // Ayşe'nin son taslağı + hekimin güncel metni (yanıt geldiğinde hekimin yazdığının üstüne yazmamak için).
  const soruRef = useRef(soru); soruRef.current = soru;
  const sonTaslak = useRef<string | null>(null);
  const istekNo = useRef(0);

  const taslakYaz = useCallback(async (h: string, hekimNotu: string, zorla = false) => {
    if (!h) return;
    if (!zorla && !taslakUygulanir(soruRef.current, sonTaslak.current)) return;
    const no = ++istekNo.current;
    setTaslak({ durum: 'yaziyor' });
    const y = await istemTaslagiIste(patientId, h, hekimNotu || undefined);
    if (no !== istekNo.current) return; // daha yeni bir istek (branş değişti) var
    if (!y.ok) { setTaslak({ durum: 'hata', mesaj: y.mesaj }); return; }
    const k = (y.kaynak || {}) as { sonMuayene?: string | null; vizitSayisi?: number };
    const bilgi = k.sonMuayene ? `Son muayene ${trGun(k.sonMuayene)} ağırlıklı · ${k.vizitSayisi || 1} vizit okundu` : undefined;
    if (zorla || taslakUygulanir(soruRef.current, sonTaslak.current)) {
      sonTaslak.current = y.taslak;
      setSoru(y.taslak);
      setTaslak({ durum: 'hazir', duzenlendi: false, bilgi });
    } else setTaslak({ durum: 'korundu', bekleyen: y.taslak });
  }, [patientId]);

  // Kaan: taslak DOLU gelir — hedef branş seçilir seçilmez, ayrı düğme yok.
  useEffect(() => { if (hedef) void taslakYaz(hedef, ''); }, [hedef, taslakYaz]);

  const soruDegisti = (v: string) => {
    setSoru(v);
    setTaslak((t) => (t.durum === 'hazir' ? { ...t, duzenlendi: v.trim() !== String(sonTaslak.current || '').trim() } : t));
  };
  const yenidenYaz = () => {
    if (!hedef) return;
    const elle = soru.trim() && soru.trim() !== String(sonTaslak.current || '').trim();
    if (elle && typeof window !== 'undefined' && !window.confirm('Metindeki değişiklikleriniz Ayşe’nin yeni taslağıyla değiştirilecek. Devam edilsin mi?')) return;
    void taslakYaz(hedef, ayseNotu, true);
  };
  const bekleyeniKullan = () => {
    if (taslak.durum !== 'korundu') return;
    if (typeof window !== 'undefined' && !window.confirm('Yazdığınız metin Ayşe’nin taslağıyla değiştirilecek. Devam edilsin mi?')) return;
    sonTaslak.current = taslak.bekleyen;
    setSoru(taslak.bekleyen);
    setTaslak({ durum: 'hazir', duzenlendi: false });
  };

  const gonder = async () => {
    if (!hazir) return;
    setGonderiyor(true); setHata('');
    try {
      const { ok, j } = await api('/api/doktor/konsultasyon', { method: 'POST', govde: { patientId, hedefBrans: hedef, klinikSoru: soru, aciliyet, hedefHekim: hekim, tanilar, mevcutDurum: durum, not } });
      if (ok && j.konsultasyon) olustu({ ...j.konsultasyon, eskiKayit: false, gun: 0, belge: null, belgeTaslagi: null });
      else setHata(j.error || 'Konsültasyon kaydedilemedi.');
    } catch { setHata('Kaydedilemedi — bağlantıyı kontrol edin.'); }
    finally { setGonderiyor(false); }
  };

  return (
    <div style={stil.kutu}>
      <div style={stil.etiket}>Yeni konsültasyon istemi</div>
      <div style={{ display: 'grid', gap: 12 }}>
        <Alan etiket="Hedef branş" ipucu="Branşı seçtiğinizde Ayşe hasta dosyasından (son muayene ağırlıklı) istem taslağını yazar; siz düzenler ve onaylarsınız.">
          <select aria-label="Hedef branş" value={hedef} onChange={(e) => setHedef(e.target.value)} style={stil.input}>
            <option value="" style={{ color: '#000' }}>Branş seçin</option>
            {hedefler.onerilen.length > 0 && (
              <optgroup label="Önerilen" style={{ color: '#000' }}>
                {hedefler.onerilen.map(([k, a]) => <option key={k} value={k} style={{ color: '#000' }}>{a}</option>)}
              </optgroup>
            )}
            <optgroup label="Tüm branşlar" style={{ color: '#000' }}>
              {hedefler.diger.map(([k, a]) => <option key={k} value={k} style={{ color: '#000' }}>{a}</option>)}
            </optgroup>
          </select>
        </Alan>
        <AyseTaslakDurumu t={taslak} yon="istem" taslagiKullan={bekleyeniKullan} />
        <Alan etiket="Klinik soru (konsültasyonun nedeni)" ipucu="Açık ve kısaltmasız yazın — ör. “İşitme kaybı var mı? Okul başarısında düşüş, televizyonu yüksek sesle izliyor.”">
          <textarea aria-label="Klinik soru" value={soru} onChange={(e) => soruDegisti(e.target.value)} maxLength={KONSULTASYON_SINIRLARI.klinikSoru} rows={soru.length > 200 ? 12 : 4} style={{ ...stil.input, resize: 'vertical', fontFamily: 'inherit' }} />
        </Alan>
        {kisaltmalar.length > 0 && (
          <div style={stil.uyari} aria-live="polite">Kısaltma olabilir: {kisaltmalar.join(', ')} — konsültasyon isteminde açık yazım önerilir (Türk Tabipleri Birliği konsültasyon ilkesi). Kaydetmenize engel değildir.</div>
        )}
        {hedef && (
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'minmax(0, 1fr)' }}>
            <Alan etiket="Ayşe'ye kısa not (isteğe bağlı)" ipucu="Ör. “işitme kaybı şüphesi, okulda duymakta zorlanıyor” — Ayşe notunuzu dosyayla birleştirip yeniden yazar.">
              <input aria-label="Ayşe'ye kısa not" value={ayseNotu} onChange={(e) => setAyseNotu(e.target.value)} maxLength={500} style={stil.input} />
            </Alan>
            <div><button type="button" onClick={yenidenYaz} disabled={taslak.durum === 'yaziyor'} style={{ ...stil.ghost, opacity: taslak.durum === 'yaziyor' ? 0.55 : 1 }}>{ayseNotu.trim() ? 'Bu notla yeniden yaz' : 'Ayşe yeniden yazsın'}</button></div>
          </div>
        )}
        <Alan etiket="Aciliyet">
          <Segment etiket="Aciliyet" deger={aciliyet} set={setAciliyet} secenekler={(['rutin', 'oncelikli', 'acil'] as const).map((k) => [k, ACILIYET_ETIKETI[k]])} />
        </Alan>
        <Alan etiket="Konsültan hekim (isteğe bağlı)">
          <input aria-label="Konsültan hekim" value={hekim} onChange={(e) => setHekim(e.target.value)} maxLength={KONSULTASYON_SINIRLARI.hedefHekim} placeholder="Ör. Dr. Ad Soyad" style={stil.input} />
        </Alan>
      </div>
      <Katlanir baslik="İstem formu ayrıntıları (isteğe bağlı)">
        <div style={{ display: 'grid', gap: 12 }}>
          <Alan etiket="Muhtemel / kesin tanılar">
            <textarea aria-label="Muhtemel / kesin tanılar" value={tanilar} onChange={(e) => setTanilar(e.target.value)} maxLength={KONSULTASYON_SINIRLARI.tanilar} rows={2} style={{ ...stil.input, resize: 'vertical', fontFamily: 'inherit' }} />
          </Alan>
          <Alan etiket="Hastanın mevcut durumu">
            <textarea aria-label="Hastanın mevcut durumu" value={durum} onChange={(e) => setDurum(e.target.value)} maxLength={KONSULTASYON_SINIRLARI.mevcutDurum} rows={2} style={{ ...stil.input, resize: 'vertical', fontFamily: 'inherit' }} />
          </Alan>
          <Alan etiket="Ek not">
            <textarea aria-label="Ek not" value={not} onChange={(e) => setNot(e.target.value)} maxLength={KONSULTASYON_SINIRLARI.not} rows={2} style={{ ...stil.input, resize: 'vertical', fontFamily: 'inherit' }} />
          </Alan>
        </div>
      </Katlanir>
      <div style={stil.satir}>
        <button type="button" onClick={gonder} disabled={!hazir} aria-disabled={!hazir} style={{ ...stil.btn, opacity: hazir ? 1 : 0.55, cursor: hazir ? 'pointer' : 'not-allowed' }}>{gonderiyor ? 'Kaydediliyor…' : 'Konsültasyon istemi oluştur'}</button>
        {vazgec && <button type="button" onClick={vazgec} style={stil.ghost}>Vazgeç</button>}
      </div>
      {!hedef || soru.trim().length < KLINIK_SORU_EN_AZ
        ? <div style={{ ...stil.kucuk, marginTop: 6 }}>Hedef branş ve en az {KLINIK_SORU_EN_AZ} karakterlik istem metni gerekli.</div>
        : null}
      {hata && <div style={{ ...stil.hata, marginTop: 8 }}>{hata}</div>}
      <div style={{ ...stil.kucuk, marginTop: 10 }}>Bu bir konsültasyon (meslektaş görüşü) istemidir; SGK sevk belgesi değildir. Kurumlar arası SGK sevki gerekiyorsa MEDULA üzerinden düzenlenir.</div>
    </div>
  );
}

/* ───────────────────────── Yanıt ekleme ───────────────────────── */

export function YanitFormu({ k, patientId, kaydedildi, vazgec }: {
  k: KonsultasyonGorunumu
  patientId: string
  kaydedildi: (y: Partial<KonsultasyonGorunumu>) => void
  vazgec: () => void
}) {
  const stil = useAracStil();
  const [belgeler, setBelgeler] = useState<KasaBelgesi[] | null>(null);
  const [belgeId, setBelgeId] = useState(k.belge_id || '');
  const [ozet, setOzet] = useState(k.yanit_ozeti || '');
  const [tarih, setTarih] = useState(k.yanit_tarihi || bugunTrIso());
  const [hekim, setHekim] = useState(k.hedef_hekim || '');
  const [taslak, setTaslak] = useState<TaslakDurumu>({ durum: 'yok' });
  const [gonderiyor, setGonderiyor] = useState(false);
  const [hata, setHata] = useState('');
  const ozetRef = useRef(ozet); ozetRef.current = ozet;
  const sonTaslak = useRef<string | null>(null);
  const istekNo = useRef(0);

  useEffect(() => {
    let iptal = false;
    api(`/api/doktor/documents?patientId=${encodeURIComponent(patientId)}`).then(({ j }) => { if (!iptal) setBelgeler(Array.isArray(j.documents) ? j.documents : []); }).catch(() => { if (!iptal) setBelgeler([]); });
    return () => { iptal = true; };
  }, [patientId]);

  // Kaan: dönüşte de taslak DOLU gelir. Rapor seçiliyse ve hekim özet yazmadıysa Ayşe bağlı raporu okur. Sunucu önce
  // mevcut belge değerlendirmesini (belge_analizleri) kullanır; yoksa raporu okur. Hekimin yazdığının üstüne yazılmaz.
  useEffect(() => {
    if (!belgeId) { setTaslak({ durum: 'yok' }); return; }
    if (!taslakUygulanir(ozetRef.current, sonTaslak.current)) return;
    const no = ++istekNo.current;
    setTaslak({ durum: 'yaziyor' });
    yanitTaslagiIsteVeGerekirseKimliksizlestir(k.id, belgeId).then((y) => {
      if (no !== istekNo.current) return;
      if (!y.ok) { setTaslak({ durum: 'hata', mesaj: y.mesaj }); return; }
      const bilgi = y.kaynak === 'belge_analizi'
        ? (y.belgeDurumu === 'onaylandi' || y.belgeDurumu === 'muayene_onaylandi' ? 'belge değerlendirmesinden (hekim onaylı)' : 'belge değerlendirmesinden')
        : 'konsültan raporundan';
      if (taslakUygulanir(ozetRef.current, sonTaslak.current)) {
        sonTaslak.current = y.taslak;
        setOzet(y.taslak);
        setTaslak({ durum: 'hazir', duzenlendi: false, bilgi });
      } else setTaslak({ durum: 'korundu', bekleyen: y.taslak });
    });
  }, [belgeId, k.id]);

  const ozetDegisti = (v: string) => {
    setOzet(v);
    setTaslak((t) => (t.durum === 'hazir' ? { ...t, duzenlendi: v.trim() !== String(sonTaslak.current || '').trim() } : t));
  };
  const bekleyeniKullan = () => {
    if (taslak.durum !== 'korundu') return;
    if (typeof window !== 'undefined' && !window.confirm('Yazdığınız özet Ayşe’nin taslağıyla değiştirilecek. Devam edilsin mi?')) return;
    sonTaslak.current = taslak.bekleyen;
    setOzet(taslak.bekleyen);
    setTaslak({ durum: 'hazir', duzenlendi: false });
  };

  const kaydet = async () => {
    if (ozet.trim().length < 3 || gonderiyor) return;
    setGonderiyor(true); setHata('');
    try {
      const { ok, j } = await api('/api/doktor/konsultasyon', { method: 'PATCH', govde: { id: k.id, islem: 'yanit', yanitOzeti: ozet, yanitTarihi: tarih, belgeId: belgeId || undefined, hedefHekim: hekim || undefined } });
      if (ok && j.konsultasyon) kaydedildi(j.konsultasyon);
      else setHata(j.error || 'Yanıt kaydedilemedi.');
    } catch { setHata('Kaydedilemedi — bağlantıyı kontrol edin.'); }
    finally { setGonderiyor(false); }
  };
  const kasaYukle = `/dashboard/doktor/belgeler?hastaId=${encodeURIComponent(patientId)}&konsultasyon=${encodeURIComponent(k.id)}`;
  const hazir = ozet.trim().length >= 3 && !gonderiyor;

  return (
    <div style={{ borderTop: '1px solid rgba(58,44,34,0.08)', marginTop: 12, paddingTop: 12, display: 'grid', gap: 12 }}>
      <Alan etiket="Konsültan raporu (Kasa)" ipucu={<>Rapor henüz kasada değilse <a href={kasaYukle} style={{ color: CHROME_RENK.pine }}>kasaya yükleyin ›</a> — yüklerken bu konsültasyonu seçebilirsiniz.</>}>
        <select aria-label="Konsültan raporu" value={belgeId} onChange={(e) => setBelgeId(e.target.value)} style={stil.input}>
          <option value="" style={{ color: '#000' }}>{belgeler == null ? 'Kasa yükleniyor…' : belgeler.length ? 'Rapor seçilmedi (isteğe bağlı)' : 'Kasada belge yok'}</option>
          {(belgeler || []).map((b) => <option key={b.id} value={b.id} style={{ color: '#000' }}>{b.fileName} · {trGun(b.createdAt)}</option>)}
        </select>
      </Alan>
      {belgeId && (
        <div style={{ ...stil.kucuk }}>
          <a href={`/dashboard/doktor/hastalar/${encodeURIComponent(patientId)}/belgeler/${encodeURIComponent(belgeId)}`} style={{ color: CHROME_RENK.pine }}>Belgeyi değerlendir (Asistana raporla) ›</a> — belgeden taslak özet çıkarır; onay yine sizindir.
        </div>
      )}
      <AyseTaslakDurumu t={taslak} yon="yanit" taslagiKullan={bekleyeniKullan} />
      <Alan etiket="Yanıt özeti — kendi cümleniz" ipucu="Ör. “İşitme kaybı saptanmadı.” Notya tanı iddia etmez; bu satır sizin klinik kaydınızdır.">
        <textarea aria-label="Yanıt özeti" value={ozet} onChange={(e) => ozetDegisti(e.target.value)} maxLength={KONSULTASYON_SINIRLARI.yanitOzeti} rows={3} style={{ ...stil.input, resize: 'vertical', fontFamily: 'inherit' }} />
      </Alan>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <Alan etiket="Yanıt tarihi">
          <input type="date" aria-label="Yanıt tarihi" value={tarih} max={bugunTrIso()} onChange={(e) => setTarih(e.target.value)} style={stil.input} />
        </Alan>
        <Alan etiket="Konsültan hekim">
          <input aria-label="Konsültan hekim" value={hekim} onChange={(e) => setHekim(e.target.value)} maxLength={KONSULTASYON_SINIRLARI.hedefHekim} placeholder="Ör. Dr. Ad Soyad" style={stil.input} />
        </Alan>
      </div>
      <div style={{ ...stil.satir, marginTop: 0 }}>
        <button type="button" onClick={kaydet} disabled={!hazir} aria-disabled={!hazir} style={{ ...stil.btn, opacity: hazir ? 1 : 0.55, cursor: hazir ? 'pointer' : 'not-allowed' }}>{gonderiyor ? 'Kaydediliyor…' : 'Onayla ve kaydet'}</button>
        <button type="button" onClick={vazgec} style={stil.ghost}>Vazgeç</button>
      </div>
      {hata && <div style={stil.hata}>{hata}</div>}
      <div style={stil.kucuk}>Yanıt kaydedilince muayene notuna kendiliğinden yazılmaz; “Bugünkü muayene formuna ekle” ile siz eklersiniz.</div>
    </div>
  );
}

/* ───────────────────────── İstem düzenleme (AYSE-KONSULTASYON-01) ───────────────────────── */

/**
 * Dr. Gökhan: "Oluştur'a bastım… düzeltme olanağı yok." İstem yanıt beklerken düzenlenir; yanıt geldikten sonra
 * KİLİTLİ (sunucu da reddeder). Kaydedince önceki metin düzenleme geçmişine yazılır — üzerine sessizce yazılmaz.
 */
export function IstemDuzenleFormu({ k, kaydedildi, vazgec }: {
  k: KonsultasyonGorunumu
  kaydedildi: (y: Partial<KonsultasyonGorunumu>) => void
  vazgec: () => void
}) {
  const stil = useAracStil();
  const [soru, setSoru] = useState(k.klinik_soru || k.not_metni || '');
  const [aciliyet, setAciliyet] = useState<Aciliyet>((['rutin', 'oncelikli', 'acil'] as const).includes(k.aciliyet as Aciliyet) ? (k.aciliyet as Aciliyet) : 'rutin');
  const [hekim, setHekim] = useState(k.hedef_hekim || '');
  const [tanilar, setTanilar] = useState(k.tanilar || '');
  const [durum, setDurum] = useState(k.mevcut_durum || '');
  const [gonderiyor, setGonderiyor] = useState(false);
  const [hata, setHata] = useState('');
  const kisaltmalar = olasiKisaltmalar(soru);
  const hazir = soru.trim().length >= KLINIK_SORU_EN_AZ && !gonderiyor;

  const kaydet = async () => {
    if (!hazir) return;
    setGonderiyor(true); setHata('');
    try {
      // Eski kayıtta istem not_metni'ndeydi; düzenlenmiş metin klinik_soru'ya yazılır (not_metni izde kalır).
      const { ok, j } = await api('/api/doktor/konsultasyon', { method: 'PATCH', govde: { id: k.id, islem: 'duzenle', klinikSoru: soru, aciliyet, hedefHekim: hekim, tanilar, mevcutDurum: durum } });
      if (ok && j.konsultasyon) kaydedildi(j.konsultasyon);
      else setHata(j.error || 'Değişiklik kaydedilemedi.');
    } catch { setHata('Kaydedilemedi — bağlantıyı kontrol edin.'); }
    finally { setGonderiyor(false); }
  };

  return (
    <div style={{ borderTop: '1px solid rgba(58,44,34,0.08)', marginTop: 12, paddingTop: 12, display: 'grid', gap: 12 }}>
      <Alan etiket="İstem metni (klinik soru)" ipucu="Yanıt gelene kadar düzenleyebilirsiniz; önceki metin düzenleme geçmişinde saklanır.">
        <textarea aria-label="İstem metni" value={soru} onChange={(e) => setSoru(e.target.value)} maxLength={KONSULTASYON_SINIRLARI.klinikSoru} rows={6} style={{ ...stil.input, resize: 'vertical', fontFamily: 'inherit' }} />
      </Alan>
      {kisaltmalar.length > 0 && (
        <div style={stil.uyari} aria-live="polite">Kısaltma olabilir: {kisaltmalar.join(', ')} — konsültasyon isteminde açık yazım önerilir (Türk Tabipleri Birliği konsültasyon ilkesi). Kaydetmenize engel değildir.</div>
      )}
      <Alan etiket="Aciliyet">
        <Segment etiket="Aciliyet" deger={aciliyet} set={setAciliyet} secenekler={(['rutin', 'oncelikli', 'acil'] as const).map((x) => [x, ACILIYET_ETIKETI[x]])} />
      </Alan>
      <Alan etiket="Konsültan hekim (isteğe bağlı)">
        <input aria-label="Konsültan hekim" value={hekim} onChange={(e) => setHekim(e.target.value)} maxLength={KONSULTASYON_SINIRLARI.hedefHekim} placeholder="Ör. Dr. Ad Soyad" style={stil.input} />
      </Alan>
      <Katlanir baslik="İstem formu ayrıntıları (isteğe bağlı)">
        <div style={{ display: 'grid', gap: 12 }}>
          <Alan etiket="Muhtemel / kesin tanılar">
            <textarea aria-label="Muhtemel / kesin tanılar" value={tanilar} onChange={(e) => setTanilar(e.target.value)} maxLength={KONSULTASYON_SINIRLARI.tanilar} rows={2} style={{ ...stil.input, resize: 'vertical', fontFamily: 'inherit' }} />
          </Alan>
          <Alan etiket="Hastanın mevcut durumu">
            <textarea aria-label="Hastanın mevcut durumu" value={durum} onChange={(e) => setDurum(e.target.value)} maxLength={KONSULTASYON_SINIRLARI.mevcutDurum} rows={2} style={{ ...stil.input, resize: 'vertical', fontFamily: 'inherit' }} />
          </Alan>
        </div>
      </Katlanir>
      <div style={{ ...stil.satir, marginTop: 0 }}>
        <button type="button" onClick={kaydet} disabled={!hazir} aria-disabled={!hazir} style={{ ...stil.btn, opacity: hazir ? 1 : 0.55, cursor: hazir ? 'pointer' : 'not-allowed' }}>{gonderiyor ? 'Kaydediliyor…' : 'Değişiklikleri kaydet'}</button>
        <button type="button" onClick={vazgec} style={stil.ghost}>Vazgeç</button>
      </div>
      {hata && <div style={stil.hata}>{hata}</div>}
    </div>
  );
}

/** Düzenleme geçmişi — kim/ne zaman/önceki metin. Klinik kayıt: önceki metin kaybolmaz. */
export function DuzenlemeGecmisi({ liste }: { liste: KonsultasyonRevizyonu[] }) {
  const stil = useAracStil();
  if (!liste.length) return null;
  return (
    <Katlanir baslik="Düzenleme geçmişi" rozet={`${liste.length}`}>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
        {[...liste].reverse().map((r) => (
          <li key={r.id} data-revizyon={r.id} style={{ borderLeft: '2px solid rgba(58,44,34,0.14)', paddingLeft: 10, minWidth: 0 }}>
            <div style={stil.kucuk}>{trGun(r.created_at)} · {REVIZYON_ALAN_ETIKETI[r.alan] || r.alan} değiştirildi (hekim)</div>
            <div style={{ ...stil.kucuk, color: CHROME_RENK.muted, marginTop: 2 }}>Önceki:</div>
            <div style={{ ...stil.metin, fontSize: 13, color: CHROME_RENK.muted, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{r.alan === 'aciliyet' && r.onceki ? (ACILIYET_ETIKETI[r.onceki as Aciliyet] || r.onceki) : (r.onceki || '(boş)')}</div>
          </li>
        ))}
      </ol>
    </Katlanir>
  );
}

/* ───────────────────────── Tek satır (kanıt kartı) ───────────────────────── */

/**
 * Uzun istem / yanıt mektubu — varsayılan daraltılmış.
 * Birden fazla konsültasyonda ekranı mektuplar kaplamasın; kısa metinler olduğu gibi kalır.
 */
export function UzunMetin({
  metin,
  esik = 240,
  stilMetin,
}: {
  metin: string
  esik?: number
  stilMetin: React.CSSProperties
}) {
  const stil = useAracStil();
  const uzun = metin.length > esik || metin.split('\n').length > 4;
  const [acik, setAcik] = useState(false);
  if (!uzun) {
    return <div style={{ ...stilMetin, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{metin}</div>;
  }
  let kes = metin.slice(0, esik);
  const sonSatir = kes.lastIndexOf('\n');
  if (sonSatir > esik * 0.35) kes = kes.slice(0, sonSatir);
  else {
    const sonBosluk = kes.lastIndexOf(' ');
    if (sonBosluk > esik * 0.5) kes = kes.slice(0, sonBosluk);
  }
  return (
    <div>
      <div style={{ ...stilMetin, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
        {acik ? metin : `${kes.trimEnd()}…`}
      </div>
      <button
        type="button"
        aria-expanded={acik}
        onClick={() => setAcik(!acik)}
        style={{ ...stil.ghost, marginTop: 6, minHeight: 44 }}
      >
        {acik ? 'Daralt' : 'Devamını göster'}
      </button>
    </div>
  );
}

export function KonsultasyonKarti({ k, patientId, guncelle, yenile, silindi, yanitAcikBaslar = false }: {
  k: KonsultasyonGorunumu
  patientId: string
  guncelle: (y: Partial<KonsultasyonGorunumu>) => void
  /** Düzenleme sonrası sessiz yeniden okuma (düzenleme geçmişi sunucudan gelir). */
  yenile?: () => void
  /** Yanıtsız kapatılmış kayıt silindiğinde listeden düşer. */
  silindi?: () => void
  /** KONSULTASYON-02: Araçlar › Bekleyen Konsültasyonlar "Yanıt ekle" → ?yanit=<id> ile form açık gelir. */
  yanitAcikBaslar?: boolean
}) {
  const stil = useAracStil();
  const g = durumGrubu(k.durum);
  const [yanitAcik, setYanitAcik] = useState(yanitAcikBaslar);
  const [duzenleAcik, setDuzenleAcik] = useState(false);
  const kartRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (yanitAcikBaslar) kartRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, [yanitAcikBaslar]);
  const [rapor, setRapor] = useState(false);
  const [calisiyor, setCalisiyor] = useState('');
  const [mesaj, setMesaj] = useState<{ iyi: boolean; metin: string } | null>(null);
  const [eklenenNot, setEklenenNot] = useState<string | null>(null);

  const islem = async (ad: 'kapat' | 'hatirlat' | 'nota_ekle' | 'sil') => {
    if (calisiyor) return;
    if (ad === 'kapat' && typeof window !== 'undefined' && !window.confirm(YANITSIZ_KAPAT_ONAYI)) return;
    if (ad === 'sil' && typeof window !== 'undefined' && !window.confirm(YANITSIZ_SIL_ONAYI)) return;
    setCalisiyor(ad); setMesaj(null);
    try {
      const { ok, j } = await konsultasyonIslemi(k.id, ad);
      if (ok) {
        if (ad === 'sil') { silindi?.(); return; }
        if (j.konsultasyon) guncelle(j.konsultasyon);
        if (ad === 'nota_ekle' && j.notId) { setEklenenNot(j.notId); setMesaj({ iyi: true, metin: 'Bugünkü muayene formuna eklendi — metni formda düzenleyebilirsiniz.' }); }
        if (ad === 'hatirlat') setMesaj({ iyi: true, metin: HATIRLATMA_GONDERILDI });
      } else setMesaj({ iyi: false, metin: j.error || 'İşlem yapılamadı.' });
    } catch { setMesaj({ iyi: false, metin: 'İşlem yapılamadı — bağlantıyı kontrol edin.' }); }
    finally { setCalisiyor(''); }
  };

  const soru = k.klinik_soru || k.not_metni || '';
  const rozet = g === 'yanitlandi'
    ? <Rozet ton="iyi">{DURUM_ETIKETI.yanitlandi}</Rozet>
    : g === 'kapandi'
      ? <Rozet ton="notr">{DURUM_ETIKETI.kapandi}</Rozet>
      : <Rozet ton={k.gun >= 30 ? 'kirmizi' : 'uyari'}>{DURUM_ETIKETI.bekliyor} · {k.gun === 0 ? 'bugün' : `${k.gun} gündür`}</Rozet>;

  return (
    <div ref={kartRef} style={{ ...stil.kutu, marginBottom: 10, scrollMarginTop: 80 }} data-konsultasyon={k.id}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {rozet}
        <span style={{ fontSize: 15, fontWeight: 700, color: CHROME_RENK.ink }}>{k.hedefEtiketi}</span>
        {k.aciliyet === 'acil' && <Rozet ton="kirmizi">Acil</Rozet>}
        {k.aciliyet === 'oncelikli' && <Rozet ton="uyari">Öncelikli</Rozet>}
        {k.eskiKayit && <Rozet ton="bilgi">eski kayıt</Rozet>}
      </div>
      {soru ? (
        <div style={{ marginTop: 8 }}>
          <UzunMetin metin={soru} stilMetin={stil.metin} />
        </div>
      ) : null}
      <div style={{ ...stil.kucuk, marginTop: 6 }}>
        İstem: {trGun(k.istem_tarihi || k.created_at)}{k.hedef_hekim ? ` · ${k.hedef_hekim}` : ''}
        {g === 'yanitlandi' ? ' · istem kilitli (yanıt geldi)' : ''}
      </div>

      {g === 'yanitlandi' && (
        <div style={{ marginTop: 10, background: 'rgba(47,67,52,0.06)', border: '1px solid rgba(47,67,52,0.25)', borderRadius: 12, padding: '10px 12px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#2E6E4E' }}>Yanıt · {trGun(k.yanit_tarihi)}{k.hedef_hekim ? ` · ${k.hedef_hekim}` : ''}</div>
          {k.yanit_ozeti ? (
            <div style={{ marginTop: 4 }}>
              <UzunMetin metin={k.yanit_ozeti} stilMetin={stil.metin} />
            </div>
          ) : null}
        </div>
      )}

      {k.belge && (
        <div style={{ ...stil.satir }}>
          {k.belge.silindi
            ? <span style={stil.kucuk}>📎 {k.belge.ad} — kasadan silinmiş</span>
            : <button type="button" onClick={() => setRapor(!rapor)} aria-expanded={rapor} style={stil.ghost}>📎 {k.belge.ad} · {trGun(k.belge.tarih)}</button>}
          {g !== 'yanitlandi' && <span style={stil.kucuk}>Rapor bağlı — “Yanıt ekle” ile Ayşe&apos;nin özet taslağını görün, onaylayın.</span>}
        </div>
      )}
      {rapor && k.belge && !k.belge.silindi && (
        <div style={{ marginTop: 10 }}>
          <DocumentViewer documentId={k.belge.id} fileName={k.belge.ad} fileType={k.belge.tur} onClose={() => setRapor(false)} />
        </div>
      )}

      <div style={stil.satir}>
        {g === 'yanitlandi' && (k.note_id || eklenenNot
          ? <a href={muayeneFormuYolu(eklenenNot || k.note_id!)} style={{ ...stil.ghost, color: '#2E6E4E' }}>Muayene notuna eklendi →</a>
          : <button type="button" onClick={() => islem('nota_ekle')} disabled={!!calisiyor} style={stil.btn}>{calisiyor === 'nota_ekle' ? 'Ekleniyor…' : 'Bugünkü muayene formuna ekle'}</button>)}
        {g !== 'yanitlandi' && !yanitAcik && (
          <button type="button" onClick={() => setYanitAcik(true)} style={stil.btn}>{g === 'kapandi' ? 'Geç gelen raporu ekle' : 'Yanıt ekle'}</button>
        )}
        {g === 'yanitlandi' && !yanitAcik && <button type="button" onClick={() => setYanitAcik(true)} style={stil.ghost}>Yanıtı düzelt</button>}
        {g === 'bekliyor' && !duzenleAcik && (
          <button type="button" onClick={() => { setDuzenleAcik(true); setYanitAcik(false); }} style={stil.ghost}>Düzenle</button>
        )}
        {g === 'bekliyor' && (
          <>
            <button type="button" onClick={() => islem('hatirlat')} disabled={!!calisiyor} style={stil.ghost}>{calisiyor === 'hatirlat' ? 'Gönderiliyor…' : 'Hatırlat'}</button>
            <button type="button" onClick={() => islem('kapat')} disabled={!!calisiyor} style={stil.ghost}>Yanıtsız kapat</button>
          </>
        )}
        {g === 'kapandi' && (
          <button
            type="button"
            onClick={() => islem('sil')}
            disabled={!!calisiyor}
            style={{ ...stil.ghost, color: 'var(--warn, #7a4a22)', borderColor: 'rgba(122,74,34,0.35)' }}
          >
            {calisiyor === 'sil' ? 'Siliniyor…' : 'Sil'}
          </button>
        )}
        {!k.eskiKayit && (
          <a href={`/dashboard/doktor/hastalar/${encodeURIComponent(patientId)}/konsultasyon/${encodeURIComponent(k.id)}/yazdir`} target="_blank" rel="noopener" style={stil.ghost}>🖨️ İstem formu</a>
        )}
      </div>
      {mesaj && (
        <div style={{ ...stil.satir }}>
          <span style={{ fontSize: 13, color: mesaj.iyi ? '#2E6E4E' : '#7A5B1E' }} aria-live="polite">{mesaj.metin}</span>
          <MuayeneFormunaDon notId={eklenenNot} />
        </div>
      )}
      {k.son_hatirlatma_at && g === 'bekliyor' && <div style={{ ...stil.kucuk, marginTop: 6 }}>Son hatırlatma: {trGun(k.son_hatirlatma_at.slice(0, 10))}</div>}
      {duzenleAcik && g === 'bekliyor' && <IstemDuzenleFormu k={k} kaydedildi={(y) => { guncelle(y); setDuzenleAcik(false); yenile?.(); }} vazgec={() => setDuzenleAcik(false)} />}
      {yanitAcik && <YanitFormu k={k} patientId={patientId} kaydedildi={(y) => { guncelle(y); setYanitAcik(false); yenile?.(); }} vazgec={() => setYanitAcik(false)} />}
      <DuzenlemeGecmisi liste={k.duzenlemeler || []} />
    </div>
  );
}

/* ───────────────────────── Zaman çizelgesi (container) ───────────────────────── */

export function KonsultasyonCizelgesi({ patientId, liste, hedefler, setListe, yenile, tabloHazir = true, yanitAc }: {
  patientId: string
  liste: KonsultasyonGorunumu[]
  hedefler: Hedefler
  setListe: (f: (l: KonsultasyonGorunumu[]) => KonsultasyonGorunumu[]) => void
  /** Sunucunun eklediği alanlar (rapor adı, belge taslağı, bekleme günü) için sessiz yeniden okuma. */
  yenile?: () => void
  tabloHazir?: boolean
  /** Yanıt formu açık gelecek konsültasyon (?yanit=<id>). */
  yanitAc?: string
}) {
  const stil = useAracStil();
  const [yeni, setYeni] = useState(false);
  const bekleyen = liste.filter((k) => durumGrubu(k.durum) === 'bekliyor').length;
  const yanitli = liste.filter((k) => durumGrubu(k.durum) === 'yanitlandi').length;
  const guncelle = (id: string) => (y: Partial<KonsultasyonGorunumu>) => {
    const belgeDegisti = liste.some((x) => x.id === id && y.belge_id !== undefined && y.belge_id !== x.belge_id);
    // PATCH yanıtı satırın ham kolonlarını döndürür; sunucu ekleri (belge, gun, eskiKayit) korunur.
    setListe((l) => l.map((x) => (x.id === id ? { ...x, ...y, belge: x.belge, belgeTaslagi: x.belgeTaslagi, gun: x.gun, eskiKayit: x.eskiKayit, duzenlemeler: x.duzenlemeler } : x)));
    if (belgeDegisti) yenile?.();
  };
  const silSatir = (id: string) => () => setListe((l) => l.filter((x) => x.id !== id));

  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ minWidth: 0, flex: '1 1 240px' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: CHROME_RENK.ink }}>Konsültasyonlar</div>
          <div style={{ ...stil.kucuk, marginTop: 2 }}>Meslektaşınızdan görüş isteyin; gelen raporu bu dosyaya kanıt olarak bağlayın.{liste.length ? ` ${bekleyen} yanıt bekliyor · ${yanitli} yanıtlandı.` : ''}</div>
        </div>
        {!yeni && tabloHazir && <button type="button" onClick={() => setYeni(true)} style={stil.btn}>+ Yeni konsültasyon</button>}
      </div>
      {!tabloHazir && <div style={stil.uyari}>Konsültasyon kayıtları henüz hazır değil — kısa süre içinde açılacak.</div>}
      {yeni && (
        <YeniKonsultasyonFormu patientId={patientId} hedefler={hedefler} vazgec={() => setYeni(false)}
          olustu={(k) => { setListe((l) => [k, ...l]); setYeni(false); }} />
      )}
      {tabloHazir && !liste.length && !yeni && (
        <div style={{ ...stil.kutu, color: CHROME_RENK.muted, fontSize: 14 }}>Bu hasta için konsültasyon kaydı yok. Bir meslektaşınızın görüşünü istediğinizde buradan istem oluşturun; gelen raporu Kasa'ya yükleyip bu kayda bağlayın.</div>
      )}
      {liste.map((k) => <KonsultasyonKarti key={k.id} k={k} patientId={patientId} guncelle={guncelle(k.id)} yenile={yenile} silindi={silSatir(k.id)} yanitAcikBaslar={!!yanitAc && k.id === yanitAc} />)}
    </div>
  );
}

export default function HastaKonsultasyonlar({ patientId, yanitAc }: { patientId: string; yanitAc?: string }) {
  const [liste, setListe] = useState<KonsultasyonGorunumu[]>([]);
  const [hedefler, setHedefler] = useState<Hedefler>({ onerilen: [], diger: [] });
  const [durum, setDurum] = useState<'yukleniyor' | 'hazir' | 'hata'>('yukleniyor');
  const [tabloHazir, setTabloHazir] = useState(true);
  const [hata, setHata] = useState('');

  const yukle = useCallback(async (sessiz = false) => {
    if (!sessiz) { setDurum('yukleniyor'); setHata(''); }
    try {
      const { ok, j } = await api(`/api/doktor/konsultasyon?patientId=${encodeURIComponent(patientId)}`);
      if (!ok && !Array.isArray(j.konsultasyonlar)) { if (!sessiz) { setHata(j.error || 'Konsültasyonlar yüklenemedi.'); setDurum('hata'); } return; }
      setListe(Array.isArray(j.konsultasyonlar) ? j.konsultasyonlar : []);
      if (j.hedefler) setHedefler(j.hedefler);
      setTabloHazir(j.tabloHazir !== false);
      setDurum('hazir');
    } catch { if (!sessiz) { setHata('Konsültasyonlar yüklenemedi — bağlantıyı kontrol edin.'); setDurum('hata'); } }
  }, [patientId]);
  useEffect(() => { yukle(); }, [yukle]);

  return (
    <AracVurguSaglayici vurgu={VURGU_TEAL}>
      <div style={{ background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 16, padding: '18px 16px', minWidth: 0, boxShadow: '0 8px 18px rgba(58,44,34,0.045)' }}>
        {durum === 'yukleniyor' && <div style={{ fontSize: 14, color: CHROME_RENK.muted }}>Konsültasyonlar yükleniyor…</div>}
        {durum === 'hata' && <div style={{ fontSize: 14, color: CHROME_RENK.warn }}>{hata}</div>}
        {durum === 'hazir' && <KonsultasyonCizelgesi patientId={patientId} liste={liste} hedefler={hedefler} setListe={setListe} yenile={() => yukle(true)} tabloHazir={tabloHazir} yanitAc={yanitAc} />}
      </div>
    </AracVurguSaglayici>
  );
}
