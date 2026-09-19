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
 */
import React, { useCallback, useEffect, useState } from 'react';
import DocumentViewer from '@/components/doktor/DocumentViewer';
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { muayeneFormuYolu } from '@/lib/doktor/muayeneFormuYolu';
import {
  AracVurguSaglayici, VURGU_TEAL, useAracStil, Alan, Segment, Katlanir, Rozet, TaslakNotu,
} from '@/lib/doktor/aracUi';
import {
  ACILIYET_ETIKETI, DURUM_ETIKETI, KLINIK_SORU_EN_AZ, KONSULTASYON_SINIRLARI,
  bugunTrIso, durumGrubu, olasiKisaltmalar, trGun, type Aciliyet, type KonsultasyonSatiri,
} from '@/lib/doktor/konsultasyon';

/** GET ?patientId= satırı (sunucu ekleri ile). */
export type KonsultasyonGorunumu = KonsultasyonSatiri & {
  hedefEtiketi: string
  eskiKayit: boolean
  gun: number
  belge: { id: string; ad: string; tur: string; tarih: string; silindi: boolean } | null
  belgeTaslagi: { durum: string; ozet: string } | null
}
type Hedefler = { onerilen: Array<[string, string]>; diger: Array<[string, string]> }
type KasaBelgesi = { id: string; fileName: string; fileType: string; category: string | null; createdAt: string }

async function api(yol: string, init?: { method?: string; govde?: unknown }): Promise<{ ok: boolean; j: Record<string, any> }> {
  const t = await getAccessTokenAsync();
  const r = await fetch(yol, {
    method: init?.method || 'GET',
    headers: { Authorization: `Bearer ${t}`, ...(init?.govde !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: init?.govde !== undefined ? JSON.stringify(init.govde) : undefined,
    cache: 'no-store',
  });
  const j = (await r.json().catch(() => ({}))) as Record<string, any>;
  return { ok: r.ok && j.ok !== false, j };
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
  const [gonderiyor, setGonderiyor] = useState(false);
  const [hata, setHata] = useState('');
  const kisaltmalar = olasiKisaltmalar(soru);
  const hazir = !!hedef && soru.trim().length >= KLINIK_SORU_EN_AZ && !gonderiyor;

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
        <Alan etiket="Hedef branş">
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
        <Alan etiket="Klinik soru (konsültasyonun nedeni)" ipucu="Açık ve kısaltmasız yazın — ör. “İşitme kaybı var mı? Okul başarısında düşüş, televizyonu yüksek sesle izliyor.”">
          <textarea aria-label="Klinik soru" value={soru} onChange={(e) => setSoru(e.target.value)} maxLength={KONSULTASYON_SINIRLARI.klinikSoru} rows={3} style={{ ...stil.input, resize: 'vertical', fontFamily: 'inherit' }} />
        </Alan>
        {kisaltmalar.length > 0 && (
          <div style={stil.uyari} aria-live="polite">Kısaltma olabilir: {kisaltmalar.join(', ')} — konsültasyon isteminde açık yazım önerilir (Türk Tabipleri Birliği konsültasyon ilkesi). Kaydetmenize engel değildir.</div>
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
        ? <div style={{ ...stil.kucuk, marginTop: 6 }}>Hedef branş ve en az {KLINIK_SORU_EN_AZ} karakterlik klinik soru gerekli.</div>
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
  const [taslak, setTaslak] = useState<{ durum: string; ozet: string } | null>(k.belgeTaslagi);
  const [gonderiyor, setGonderiyor] = useState(false);
  const [hata, setHata] = useState('');

  useEffect(() => {
    let iptal = false;
    api(`/api/doktor/documents?patientId=${encodeURIComponent(patientId)}`).then(({ j }) => { if (!iptal) setBelgeler(Array.isArray(j.documents) ? j.documents : []); }).catch(() => { if (!iptal) setBelgeler([]); });
    return () => { iptal = true; };
  }, [patientId]);

  // Seçilen belgenin (varsa) Tier A değerlendirme TASLAĞI — yalnız öneri; hekim kendi cümlesini yazar.
  useEffect(() => {
    if (!belgeId) { setTaslak(null); return; }
    if (belgeId === k.belge_id && k.belgeTaslagi) { setTaslak(k.belgeTaslagi); return; }
    let iptal = false;
    api(`/api/doktor/belgeler/analiz?documentId=${encodeURIComponent(belgeId)}`).then(({ j }) => {
      if (iptal) return;
      const a = j.analiz as { durum?: string; hekim_ozet?: string | null; sonuc?: { ozet?: string } } | null;
      setTaslak(a ? { durum: String(a.durum || ''), ozet: String(a.hekim_ozet || a.sonuc?.ozet || '').slice(0, 600) } : null);
    }).catch(() => { if (!iptal) setTaslak(null); });
    return () => { iptal = true; };
  }, [belgeId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 12, paddingTop: 12, display: 'grid', gap: 12 }}>
      <Alan etiket="Konsültan raporu (Kasa)" ipucu={<>Rapor henüz kasada değilse <a href={kasaYukle} style={{ color: '#2DD4BF' }}>kasaya yükleyin ›</a> — yüklerken bu konsültasyonu seçebilirsiniz.</>}>
        <select aria-label="Konsültan raporu" value={belgeId} onChange={(e) => setBelgeId(e.target.value)} style={stil.input}>
          <option value="" style={{ color: '#000' }}>{belgeler == null ? 'Kasa yükleniyor…' : belgeler.length ? 'Rapor seçilmedi (isteğe bağlı)' : 'Kasada belge yok'}</option>
          {(belgeler || []).map((b) => <option key={b.id} value={b.id} style={{ color: '#000' }}>{b.fileName} · {trGun(b.createdAt)}</option>)}
        </select>
      </Alan>
      {belgeId && (
        <div style={{ ...stil.kucuk }}>
          <a href={`/dashboard/doktor/hastalar/${encodeURIComponent(patientId)}/belgeler/${encodeURIComponent(belgeId)}`} style={{ color: '#2DD4BF' }}>Belgeyi değerlendir (Asistana raporla) ›</a> — belgeden taslak özet çıkarır; onay yine sizindir.
        </div>
      )}
      {taslak?.ozet ? (
        <div style={{ ...stil.uyari }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
            <Rozet ton="uyari">TASLAK · belgeden</Rozet>
            <span>{taslak.durum === 'onaylandi' || taslak.durum === 'muayene_onaylandi' ? 'belge değerlendirmesi hekim onaylı' : 'hekim onayı bekliyor'}</span>
          </div>
          <div style={{ color: '#FEF3C7', overflowWrap: 'anywhere' }}>{taslak.ozet}</div>
          <button type="button" onClick={() => setOzet(taslak.ozet)} style={{ ...stil.ghost, marginTop: 8 }}>Taslağı özete aktar (düzenleyin)</button>
        </div>
      ) : null}
      <Alan etiket="Yanıt özeti — kendi cümleniz" ipucu="Ör. “İşitme kaybı saptanmadı.” Notya tanı iddia etmez; bu satır sizin klinik kaydınızdır.">
        <textarea aria-label="Yanıt özeti" value={ozet} onChange={(e) => setOzet(e.target.value)} maxLength={KONSULTASYON_SINIRLARI.yanitOzeti} rows={3} style={{ ...stil.input, resize: 'vertical', fontFamily: 'inherit' }} />
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
        <button type="button" onClick={kaydet} disabled={!hazir} aria-disabled={!hazir} style={{ ...stil.btn, opacity: hazir ? 1 : 0.55, cursor: hazir ? 'pointer' : 'not-allowed' }}>{gonderiyor ? 'Kaydediliyor…' : 'Yanıtı kaydet'}</button>
        <button type="button" onClick={vazgec} style={stil.ghost}>Vazgeç</button>
      </div>
      {hata && <div style={stil.hata}>{hata}</div>}
      <TaslakNotu>Yanıt kaydedilince muayene notuna kendiliğinden yazılmaz; “Bugünkü muayene formuna ekle” ile siz eklersiniz.</TaslakNotu>
    </div>
  );
}

/* ───────────────────────── Tek satır (kanıt kartı) ───────────────────────── */

export function KonsultasyonKarti({ k, patientId, guncelle }: {
  k: KonsultasyonGorunumu
  patientId: string
  guncelle: (y: Partial<KonsultasyonGorunumu>) => void
}) {
  const stil = useAracStil();
  const g = durumGrubu(k.durum);
  const [yanitAcik, setYanitAcik] = useState(false);
  const [rapor, setRapor] = useState(false);
  const [calisiyor, setCalisiyor] = useState('');
  const [mesaj, setMesaj] = useState<{ iyi: boolean; metin: string } | null>(null);
  const [eklenenNot, setEklenenNot] = useState<string | null>(null);

  const islem = async (ad: 'kapat' | 'hatirlat' | 'nota_ekle') => {
    if (calisiyor) return;
    if (ad === 'kapat' && typeof window !== 'undefined' && !window.confirm('Bu konsültasyon yanıt gelmeden kapatılsın mı? Geç gelen rapor yine eklenebilir.')) return;
    setCalisiyor(ad); setMesaj(null);
    try {
      const { ok, j } = await api('/api/doktor/konsultasyon', { method: 'PATCH', govde: { id: k.id, islem: ad } });
      if (ok) {
        if (j.konsultasyon) guncelle(j.konsultasyon);
        if (ad === 'nota_ekle' && j.notId) { setEklenenNot(j.notId); setMesaj({ iyi: true, metin: 'Bugünkü muayene formuna eklendi — metni formda düzenleyebilirsiniz.' }); }
        if (ad === 'hatirlat') setMesaj({ iyi: true, metin: 'Hastaya Sağlığım üzerinden hatırlatma gönderildi (klinik bilgi içermez).' });
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
    <div style={{ ...stil.kutu, marginBottom: 10 }} data-konsultasyon={k.id}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {rozet}
        <span style={{ fontSize: 15, fontWeight: 700, color: '#EDF1F7' }}>{k.hedefEtiketi}</span>
        {k.aciliyet === 'acil' && <Rozet ton="kirmizi">Acil</Rozet>}
        {k.aciliyet === 'oncelikli' && <Rozet ton="uyari">Öncelikli</Rozet>}
        {k.eskiKayit && <Rozet ton="bilgi">eski kayıt</Rozet>}
      </div>
      {soru && <div style={{ ...stil.metin, marginTop: 8, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{soru}</div>}
      <div style={{ ...stil.kucuk, marginTop: 6 }}>
        İstem: {trGun(k.istem_tarihi || k.created_at)}{k.hedef_hekim ? ` · ${k.hedef_hekim}` : ''}
      </div>

      {g === 'yanitlandi' && (
        <div style={{ marginTop: 10, background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.25)', borderRadius: 12, padding: '10px 12px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#5EEAD4' }}>Yanıt · {trGun(k.yanit_tarihi)}{k.hedef_hekim ? ` · ${k.hedef_hekim}` : ''}</div>
          <div style={{ ...stil.metin, marginTop: 4, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{k.yanit_ozeti}</div>
        </div>
      )}

      {k.belge && (
        <div style={{ ...stil.satir }}>
          {k.belge.silindi
            ? <span style={stil.kucuk}>📎 {k.belge.ad} — kasadan silinmiş</span>
            : <button type="button" onClick={() => setRapor(!rapor)} aria-expanded={rapor} style={stil.ghost}>📎 {k.belge.ad} · {trGun(k.belge.tarih)}</button>}
          {g !== 'yanitlandi' && <span style={stil.kucuk}>Rapor bağlı — yanıt özetinizi yazın.</span>}
        </div>
      )}
      {rapor && k.belge && !k.belge.silindi && (
        <div style={{ marginTop: 10 }}>
          <DocumentViewer documentId={k.belge.id} fileName={k.belge.ad} fileType={k.belge.tur} onClose={() => setRapor(false)} />
        </div>
      )}

      <div style={stil.satir}>
        {g === 'yanitlandi' && (k.note_id || eklenenNot
          ? <a href={muayeneFormuYolu(eklenenNot || k.note_id!)} style={{ ...stil.ghost, color: '#5EEAD4' }}>Muayene notuna eklendi →</a>
          : <button type="button" onClick={() => islem('nota_ekle')} disabled={!!calisiyor} style={stil.btn}>{calisiyor === 'nota_ekle' ? 'Ekleniyor…' : 'Bugünkü muayene formuna ekle'}</button>)}
        {g !== 'yanitlandi' && !yanitAcik && (
          <button type="button" onClick={() => setYanitAcik(true)} style={stil.btn}>{g === 'kapandi' ? 'Geç gelen raporu ekle' : 'Yanıt ekle'}</button>
        )}
        {g === 'yanitlandi' && !yanitAcik && <button type="button" onClick={() => setYanitAcik(true)} style={stil.ghost}>Yanıtı düzelt</button>}
        {g === 'bekliyor' && (
          <>
            <button type="button" onClick={() => islem('hatirlat')} disabled={!!calisiyor} style={stil.ghost}>{calisiyor === 'hatirlat' ? 'Gönderiliyor…' : 'Hatırlat'}</button>
            <button type="button" onClick={() => islem('kapat')} disabled={!!calisiyor} style={stil.ghost}>Yanıtsız kapat</button>
          </>
        )}
        {!k.eskiKayit && (
          <a href={`/dashboard/doktor/hastalar/${encodeURIComponent(patientId)}/konsultasyon/${encodeURIComponent(k.id)}/yazdir`} target="_blank" rel="noopener" style={stil.ghost}>🖨️ İstem formu</a>
        )}
      </div>
      {mesaj && (
        <div style={{ ...stil.satir }}>
          <span style={{ fontSize: 13, color: mesaj.iyi ? '#5EEAD4' : '#FDE68A' }} aria-live="polite">{mesaj.metin}</span>
          <MuayeneFormunaDon notId={eklenenNot} />
        </div>
      )}
      {k.son_hatirlatma_at && g === 'bekliyor' && <div style={{ ...stil.kucuk, marginTop: 6 }}>Son hatırlatma: {trGun(k.son_hatirlatma_at.slice(0, 10))}</div>}
      {yanitAcik && <YanitFormu k={k} patientId={patientId} kaydedildi={(y) => { guncelle(y); setYanitAcik(false); }} vazgec={() => setYanitAcik(false)} />}
    </div>
  );
}

/* ───────────────────────── Zaman çizelgesi (container) ───────────────────────── */

export function KonsultasyonCizelgesi({ patientId, liste, hedefler, setListe, yenile, tabloHazir = true }: {
  patientId: string
  liste: KonsultasyonGorunumu[]
  hedefler: Hedefler
  setListe: (f: (l: KonsultasyonGorunumu[]) => KonsultasyonGorunumu[]) => void
  /** Sunucunun eklediği alanlar (rapor adı, belge taslağı, bekleme günü) için sessiz yeniden okuma. */
  yenile?: () => void
  tabloHazir?: boolean
}) {
  const stil = useAracStil();
  const [yeni, setYeni] = useState(false);
  const bekleyen = liste.filter((k) => durumGrubu(k.durum) === 'bekliyor').length;
  const yanitli = liste.filter((k) => durumGrubu(k.durum) === 'yanitlandi').length;
  const guncelle = (id: string) => (y: Partial<KonsultasyonGorunumu>) => {
    const belgeDegisti = liste.some((x) => x.id === id && y.belge_id !== undefined && y.belge_id !== x.belge_id);
    // PATCH yanıtı satırın ham kolonlarını döndürür; sunucu ekleri (belge, gun, eskiKayit) korunur.
    setListe((l) => l.map((x) => (x.id === id ? { ...x, ...y, belge: x.belge, belgeTaslagi: x.belgeTaslagi, gun: x.gun, eskiKayit: x.eskiKayit } : x)));
    if (belgeDegisti) yenile?.();
  };

  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ minWidth: 0, flex: '1 1 240px' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#EDF1F7' }}>Konsültasyonlar</div>
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
        <div style={{ ...stil.kutu, color: '#8FA0B5', fontSize: 14 }}>Bu hasta için konsültasyon kaydı yok. Bir meslektaşınızın görüşünü istediğinizde buradan istem oluşturun; gelen raporu Kasa'ya yükleyip bu kayda bağlayın.</div>
      )}
      {liste.map((k) => <KonsultasyonKarti key={k.id} k={k} patientId={patientId} guncelle={guncelle(k.id)} />)}
    </div>
  );
}

export default function HastaKonsultasyonlar({ patientId }: { patientId: string }) {
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
      <div style={{ background: '#0D1C33', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px 16px', minWidth: 0 }}>
        {durum === 'yukleniyor' && <div style={{ fontSize: 14, color: '#8FA0B5' }}>Konsültasyonlar yükleniyor…</div>}
        {durum === 'hata' && <div style={{ fontSize: 14, color: '#FCA5A5' }}>{hata}</div>}
        {durum === 'hazir' && <KonsultasyonCizelgesi patientId={patientId} liste={liste} hedefler={hedefler} setListe={setListe} yenile={() => yukle(true)} tabloHazir={tabloHazir} />}
      </div>
    </AracVurguSaglayici>
  );
}
