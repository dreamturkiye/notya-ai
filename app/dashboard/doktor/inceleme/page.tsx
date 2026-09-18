'use client';
import HafifMarkdown from '@/components/asistan/HafifMarkdown';

export const dynamic = 'force-dynamic';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import DoktorNav from '@/components/doktor/DoktorNav';
import { CihazdanAl, CihazDosyasi } from '@/components/core/CihazdanAl';
import {
  getAccessToken, getAccessTokenAsync,
  toolsShell,
  toolsCard,
  toolsErrorBox,
} from '@/lib/doktor/toolsUi';
import {
  onaySonrasiHedef, onaylananNotYolu, hastaDosyasiYolu,
  ONAYLANAN_NOTU_AC, HASTA_LISTESINE_DON, ANA_SAYFAYA_DON,
  HASTA_LISTESI_YOLU, DOKTOR_ANA_SAYFA_YOLU,
} from '@/lib/doktor/onaySonrasiYol';
import type { BransKapsami } from '@/lib/specialties/kapsam';
import { istemciKapsami } from '@/lib/specialties/kapsamIstemci';
import { bransEtiketi } from '@/lib/doktor/bransAdlari';
import YasamsalBulgularFormu from '@/components/doktor/YasamsalBulgularFormu';
import {
  NOT_YENIDEN_DEGERLENDIR_DEBOUNCE_MS,
  NOT_YENIDEN_DEGERLENDIR_ISTEK,
} from '@/lib/doktor/notYenidenDegerlendir';

interface IlacOner { ad?: string; doz?: string; kullanim?: string; sure?: string }
interface IcdOner { code?: string; description_tr?: string; description?: string; is_primary?: boolean }
interface ReceteOner { etkenMadde?: string; ticariOrnek?: string; doz?: string; kullanim?: string; sure?: string; not?: string; sgkListesinde?: boolean }
interface Vitaller { kilo?: number | null; boy?: number | null; ates?: number | null; nabiz?: number | null; spo2?: number | null; tansiyon?: string | null }
interface Taslak { subjektif: string; objektif: string; degerlendirme: string; plan: string }
interface Eylem { tur?: string; tarih?: string; saat?: string; kim?: string; aciklama?: string; durum?: 'oneri' | 'eklendi' | 'hata' }
interface KMesaj { rol: 'doktor' | 'asistan'; icerik: string }

interface PendingNote {
  id: string;
  maskedPatient: string;
  patientId: string | null;
  specialty: string;
  date: string;
  subjektif: string;
  objektif: string;
  degerlendirme: string;
  plan: string;
  tani: string;
  ilaclar: IlacOner[];
  icdKodlari: IcdOner[];
  kritikBulgular: string[];
  hastaOzeti: string;
  basvuruYakinmasi: string;
  vitaller: Vitaller | null;
  buyumePersentilleri?: { kilo?: string; boy?: string; basCevresi?: string; vki?: string; vkiSinif?: string } | null;
  receteOnerisi: ReceteOner[];
  alarmBulgulari: string[];
  aiDegerlendirme: string;
  /** BRANS-ALAN-SIZMASI: sunucu hesaplar — ölçüm alanları + hasta/veli hitabı (yoksa baseline, "hasta") */
  bransKapsami: BransKapsami;
}

function normalizeNotes(payload: unknown): PendingNote[] {
  if (!Array.isArray(payload)) return [];

  return payload.map((item, idx) => {
    const n = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    return {
      id: String(n.id ?? idx),
      maskedPatient: String(n.maskedPatient ?? 'Hasta'),
      patientId: n.patientId ? String(n.patientId) : null,
      specialty: String(n.specialty ?? 'Genel'),
      date: String(n.date ?? ''),
      subjektif: String(n.subjektif ?? ''),
      objektif: String(n.objektif ?? ''),
      degerlendirme: String(n.degerlendirme ?? ''),
      plan: String(n.plan ?? ''),
      tani: String(n.tani ?? ''),
      ilaclar: Array.isArray(n.ilaclar) ? (n.ilaclar as IlacOner[]) : [],
      icdKodlari: Array.isArray(n.icdKodlari) ? (n.icdKodlari as IcdOner[]) : [],
      kritikBulgular: Array.isArray(n.kritikBulgular) ? (n.kritikBulgular as string[]).map(String) : [],
      hastaOzeti: String(n.hastaOzeti ?? ''),
      basvuruYakinmasi: String(n.basvuruYakinmasi ?? ''),
      vitaller: (n.vitaller && typeof n.vitaller === 'object') ? (n.vitaller as Vitaller) : null,
      buyumePersentilleri: (n.buyumePersentilleri && typeof n.buyumePersentilleri === 'object') ? (n.buyumePersentilleri as PendingNote['buyumePersentilleri']) : null,
      receteOnerisi: Array.isArray(n.receteOnerisi) ? (n.receteOnerisi as ReceteOner[]) : [],
      alarmBulgulari: Array.isArray(n.alarmBulgulari) ? (n.alarmBulgulari as string[]).map(String) : [],
      aiDegerlendirme: String(n.aiDegerlendirme ?? ''),
      bransKapsami: istemciKapsami(n.bransKapsami as BransKapsami | undefined),
    };
  });
}

function snippet(text: unknown, max = 120): string {
  const value = String(text ?? '').trim();
  if (!value) return 'Not içeriği boş';
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

export default function IncelemePage() {
  const router = useRouter();
  const [notes, setNotes] = useState<PendingNote[]>([]);
  /* NOTYA-ONAY-DONUS-01: "kuyrukta kaç not kaldı" kararı onay yanıtı döndüğünde verilir —
     o an ekrandaki (render sırasındaki) liste bayat olabilir. Ref her zaman en güncel liste. */
  const notlarRef = useRef<PendingNote[]>([]);
  const notlariYaz = (liste: PendingNote[]) => { notlarRef.current = liste; setNotes(liste); };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  // NOTYA-ONAY-DONUS-01: kuyrukta sıra işlenirken onaylanan notu gözden kaçırmayalım —
  // sayfa değişmediği durumda onaylanan nota giden bağlantı burada tutulur.
  const [sonOnaylanan, setSonOnaylanan] = useState<{ id: string; hasta: string; patientId: string | null } | null>(null);
  const [acikId, setAcikId] = useState('');
  const [taslak, setTaslak] = useState<Taslak>({ subjektif: '', objektif: '', degerlendirme: '', plan: '' });
  // Kaan/Gökhan (2026-09-10): başlık (hasta, branş, tarih) dışında her şey düzenlenebilir
  const [basvuruTaslak, setBasvuruTaslak] = useState('');
  const [vitalTaslak, setVitalTaslak] = useState<Record<string, string>>({});
  const [alarmTaslak, setAlarmTaslak] = useState('');   // satır başına bir madde
  const [ozetTaslak, setOzetTaslak] = useState('');
  const [ilacTaslak, setIlacTaslak] = useState('');   // "Ad — doz — kullanım — süre", satır başına bir ilaç
  const [icdTaslak, setIcdTaslak] = useState<IcdOner[]>([]);
  const [receteTaslak, setReceteTaslak] = useState<ReceteOner[]>([]);
  const [aiDegTaslak, setAiDegTaslak] = useState('');
  const [kMesajlar, setKMesajlar] = useState<KMesaj[]>([]);
  const [kGirdi, setKGirdi] = useState('');
  const [kBekliyor, setKBekliyor] = useState(false);
  const [eylemler, setEylemler] = useState<Eylem[]>([]);
  const atlaOtomatikRef = useRef(true);
  const kBekliyorRef = useRef(false);

  function ilacMetniniCoz(metin: string): { ad: string; doz: string; kullanim: string; sure: string }[] {
    return metin.split('\n').map((satir) => satir.trim()).filter(Boolean).map((satir) => {
      const p = satir.split(' — ').map((x) => x.trim())
      return { ad: p[0] || '', doz: p[1] || '', kullanim: p[2] || '', sure: p[3] || '' }
    }).filter((i) => i.ad)
  }

  const notuAc = (note: PendingNote) => {
    atlaOtomatikRef.current = true;
    setAcikId(note.id);
    setTaslak({ subjektif: note.subjektif, objektif: note.objektif, degerlendirme: note.degerlendirme, plan: note.plan });
    setBasvuruTaslak(note.basvuruYakinmasi || '');
    setAlarmTaslak((note.alarmBulgulari || []).join('\n'));
    setOzetTaslak(note.hastaOzeti || '');
    setIlacTaslak((note.ilaclar || []).map((il) => [il.ad, il.doz, il.kullanim, il.sure].filter(Boolean).join(' — ')).join('\n'));
    setIcdTaslak(note.icdKodlari || []);
    setReceteTaslak(note.receteOnerisi || []);
    setAiDegTaslak(note.aiDegerlendirme || '');
    setVitalTaslak(Object.fromEntries(Object.entries((note.vitaller || {}) as Record<string, unknown>).map(([k, v]) => [k, v == null ? '' : String(v)])));
    setKMesajlar([]);
    setKGirdi('');
    setEylemler([]);
  };

  // NOTYA-KONSULT-03: not üzerinde Ayşe ile konsult + sözle düzenleme.
  // sessiz=true: form yenilemesinde otomatik yeniden değerlendirme — sohbeti doldurmaz.
  const konsultGonder = async (note: PendingNote, override?: string, opts?: { sessiz?: boolean; sabitleSoap?: boolean }) => {
    const soru = (override ?? kGirdi).trim();
    if (!soru || kBekliyorRef.current) return;
    const yeni: KMesaj[] = [...kMesajlar, { rol: 'doktor', icerik: soru }];
    if (!opts?.sessiz) {
      setKMesajlar(yeni);
      setKGirdi('');
    }
    kBekliyorRef.current = true;
    setKBekliyor(true);
    try {
      const token = await getAccessTokenAsync();
      const res = await fetch('/api/doktor/not-konsult', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: note.id, taslak: { ...taslak, basvuruYakinmasi: basvuruTaslak, vitaller: vitalTaslak, alarmBulgulari: alarmTaslak.split('\n').map((x) => x.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean), hastaOzeti: ozetTaslak, ilaclar: ilacMetniniCoz(ilacTaslak), icdKodlari: icdTaslak, receteOnerisi: receteTaslak, aiDegerlendirme: aiDegTaslak }, mesajlar: yeni }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Ayşe yanıt veremedi.');
      if (!opts?.sessiz) setKMesajlar([...yeni, { rol: 'asistan', icerik: String(d.cevap || '') }]);
      else if (d.cevap) setKMesajlar((prev) => [...prev, { rol: 'asistan', icerik: `↻ ${String(d.cevap)}` }]);
      const dz = (d.duzenlemeler || {}) as Record<string, unknown>;
      atlaOtomatikRef.current = true;
      if (!opts?.sabitleSoap) {
        const g: Taslak = { ...taslak };
        (['subjektif', 'objektif', 'degerlendirme', 'plan'] as const).forEach((a) => {
          if (typeof dz[a] === 'string' && (dz[a] as string).trim()) g[a] = dz[a] as string;
        });
        setTaslak(g);
        if (typeof dz.basvuruYakinmasi === 'string') setBasvuruTaslak(dz.basvuruYakinmasi as string);
        if (dz.vitaller && typeof dz.vitaller === 'object' && !Array.isArray(dz.vitaller)) setVitalTaslak((v) => ({ ...v, ...Object.fromEntries(Object.entries(dz.vitaller as Record<string, unknown>).map(([k, x]) => [k, String(x ?? '')])) }));
      }
      if (Array.isArray(dz.alarmBulgulari)) setAlarmTaslak((dz.alarmBulgulari as unknown[]).map(String).join('\n'));
      if (typeof dz.hastaOzeti === 'string') setOzetTaslak(dz.hastaOzeti as string);
      if (Array.isArray(dz.ilaclar)) setIlacTaslak((dz.ilaclar as unknown[]).map((it) => { const o = it as Record<string, unknown>; return [o.ad, o.doz, o.kullanim, o.sure].filter(Boolean).join(' — ') }).join('\n'));
      if (Array.isArray(dz.icdKodlari)) setIcdTaslak((dz.icdKodlari as unknown[]).map((it) => { const o = it as Record<string, unknown>; return { code: String(o.code || ''), description_tr: String(o.description_tr || o.description || ''), is_primary: !!o.is_primary } }).filter((k) => k.code));
      if (Array.isArray(dz.receteOnerisi)) setReceteTaslak((dz.receteOnerisi as unknown[]).map((it) => { const o = it as Record<string, unknown>; return { ticariOrnek: String(o.ticariOrnek || ''), etkenMadde: String(o.etkenMadde || ''), doz: String(o.doz || ''), kullanim: String(o.kullanim || ''), sure: String(o.sure || ''), sgkListesinde: !!o.sgkListesinde, not: String(o.not || '') } }).filter((r) => r.ticariOrnek));
      if (typeof dz.aiDegerlendirme === 'string' && dz.aiDegerlendirme.trim()) setAiDegTaslak(dz.aiDegerlendirme as string);
      if (Array.isArray(d.eylemler) && d.eylemler.length) {
        setEylemler((prev) => [...prev, ...(d.eylemler as Eylem[]).map((e) => ({ ...e, durum: 'oneri' as const }))]);
      }
    } catch (e) {
      if (!opts?.sessiz) setKMesajlar([...yeni, { rol: 'asistan', icerik: e instanceof Error ? e.message : 'Ayşe yanıt veremedi.' }]);
    } finally {
      kBekliyorRef.current = false;
      setKBekliyor(false);
    }
  };

  const eylemOnayla = async (note: PendingNote, idx: number) => {
    const e = eylemler[idx];
    if (!e || e.durum !== 'oneri') return;
    if (!note.patientId) {
      setEylemler((prev) => prev.map((x, i) => (i === idx ? { ...x, durum: 'hata' } : x)));
      return;
    }
    try {
      const token = await getAccessTokenAsync();
      const saat = e.saat || '10:00';
      const baslangic = new Date(`${e.tarih}T${saat}:00+03:00`);
      const sureDk = e.tur === 'takip_aramasi' ? 15 : 20;
      const bitis = new Date(baslangic.getTime() + sureDk * 60000);
      const tur = e.tur === 'takip_aramasi' ? 'diger' : 'kontrol';
      const notlar = e.tur === 'takip_aramasi'
        ? `📞 Takip araması (${e.kim === 'sekreter' ? 'sekreter/hemşire arayacak' : 'doktor arayacak'})${e.aciklama ? `: ${e.aciklama}` : ''} — arama notunu buraya yazın.`
        : `Kontrol muayenesi${e.aciklama ? `: ${e.aciklama}` : ''}`;
      const res = await fetch('/api/doktor/randevular', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: note.patientId, baslangic: baslangic.toISOString(), bitis: bitis.toISOString(), tur, notlar }),
      });
      if (!res.ok) throw new Error();
      setEylemler((prev) => prev.map((x, i) => (i === idx ? { ...x, durum: 'eklendi' } : x)));
    } catch {
      setEylemler((prev) => prev.map((x, i) => (i === idx ? { ...x, durum: 'hata' } : x)));
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const token = await getAccessTokenAsync();
        if (!token) {
          if (!cancelled) {
            setError('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
            notlariYaz([]);
          }
          return;
        }

        const res = await fetch('/api/notes?pending=true', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json().catch(() => null);

        if (cancelled) return;

        if (!res.ok) {
          const message =
            data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string'
              ? (data as { error: string }).error
              : 'Bekleyen notlar alınamadı.';
          setError(message);
          notlariYaz([]);
          return;
        }

        notlariYaz(normalizeNotes(data));
      } catch {
        if (!cancelled) {
          setError('Bekleyen notlar alınamadı. Bağlantınızı kontrol edin.');
          notlariYaz([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Formda klinik yenileme → Ayşe notu yeniden okur (tüm branşlar)
  useEffect(() => {
    if (!acikId) return;
    if (atlaOtomatikRef.current) {
      atlaOtomatikRef.current = false;
      return;
    }
    if (kBekliyorRef.current) return;
    const note = notlarRef.current.find((n) => n.id === acikId);
    if (!note) return;
    const t = setTimeout(() => {
      void konsultGonder(note, NOT_YENIDEN_DEGERLENDIR_ISTEK, { sessiz: true, sabitleSoap: true });
    }, NOT_YENIDEN_DEGERLENDIR_DEBOUNCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basvuruTaslak, vitalTaslak, taslak.subjektif, taslak.objektif, taslak.degerlendirme, taslak.plan, acikId]);

  /**
   * NOTYA-ONAY-DONUS-01 (Gökhan, 2026-09-17, canlı): onay notu listeden siliyor, başka hiçbir
   * şey yapmıyordu. Kuyrukta tek not varsa hekim "Bekleyen not yok" yazan boş bir sayfada
   * kalıyor, az önce onayladığı nota da hastanın dosyasına da dönemiyordu.
   * Artık: kuyruk boşaldıysa notun kesinleşmiş haline gidilir (hasta dosyasından açılan sayfa);
   * kuyrukta iş varsa akış bölünmez ama onaylanan nota giden bağlantı ekranda kalır.
   */
  const approve = async (id: string) => {
    setError('');
    setBusyId(id);
    try {
      const token = await getAccessTokenAsync();
      const res = await fetch(`/api/notes/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(acikId === id ? { duzenlemeler: { ...taslak, basvuruYakinmasi: basvuruTaslak, vitaller: vitalTaslak, alarmBulgulari: alarmTaslak.split('\n').map((x) => x.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean), hastaOzeti: ozetTaslak, ilaclar: ilacMetniniCoz(ilacTaslak), icdKodlari: icdTaslak, receteOnerisi: receteTaslak, aiDegerlendirme: aiDegTaslak } } : {}),
      });

      if (!res.ok) {
        setError('Not onaylanamadı. Lütfen tekrar deneyin.');
        return;
      }

      const onaylanan = notlarRef.current.find((n) => n.id === id) || null;
      const kalan = notlarRef.current.filter((n) => n.id !== id);
      notlariYaz(kalan);
      if (acikId === id) setAcikId('');
      setSonOnaylanan({ id, hasta: onaylanan?.maskedPatient || '', patientId: onaylanan?.patientId ?? null });

      const hedef = onaySonrasiHedef(id, kalan.length);
      if (hedef.tur === 'not') router.push(hedef.yol);
    } catch {
      setError('Not onaylanamadı. Bağlantınızı kontrol edin.');
    } finally {
      setBusyId('');
    }
  };

  const reject = (id: string) => {
    setError('');
    notlariYaz(notlarRef.current.filter((n) => n.id !== id));
  };

  const btnStyle = (bg: string, disabled: boolean): React.CSSProperties => ({
    background: disabled ? '#334155' : bg,
    color: disabled ? '#94A3B8' : '#fff',
    padding: '8px 14px',
    borderRadius: 9,
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
  });

  return (
    <div style={toolsShell}>
      <DoktorNav />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px 56px' }}>
        <a href="/dashboard/doktor" style={{ color: '#2DD4BF', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>← Doktor</a>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '10px 0 0' }}>İnceleme Kuyruğu</h1>
        <p style={{ color: '#94A3B8', fontSize: 14, margin: '6px 0 20px' }}>
          Onay bekleyen klinik notları inceleyin
        </p>

        {error && <div style={{ ...toolsErrorBox, marginTop: 0, marginBottom: 16 }}>{error}</div>}

        {/* NOTYA-ONAY-DONUS-01: kuyrukta iş varken sayfa değişmez — onaylanan not yine de
            erişilebilir kalsın (hekim onayladığı notu gözden kaybetmesin). */}
        {sonOnaylanan && notes.length > 0 && (
          <div style={{ ...toolsCard, marginTop: 0, marginBottom: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, border: '1px solid rgba(16,185,129,0.4)' }}>
            <span style={{ color: '#34D399', fontSize: 13, fontWeight: 600 }}>✓ Not onaylandı{sonOnaylanan.hasta ? ` — ${sonOnaylanan.hasta}` : ''}</span>
            <a href={onaylananNotYolu(sonOnaylanan.id)} style={{ color: '#2DD4BF', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 36 }}>{ONAYLANAN_NOTU_AC}</a>
            <a href={hastaDosyasiYolu(sonOnaylanan.patientId, 'muayene')} style={{ color: '#9FB3C8', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 36 }}>Muayene Geçmişi →</a>
          </div>
        )}

        {loading ? (
          <div style={{ ...toolsCard, textAlign: 'center', color: '#94A3B8' }}>Yükleniyor...</div>
        ) : notes.length === 0 ? (
          /* NOTYA-ONAY-DONUS-01: "Bekleyen not yok" tek başına çıkmazdı — hekimin buradan
             gidecek yeri yoktu. Boş kuyruk artık her zaman çıkış yolu gösterir; son onaylanan
             not varsa önce ona döner. */
          <div style={{ ...toolsCard, textAlign: 'center', color: '#94A3B8' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#CBD5E1' }}>Bekleyen not yok</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              {sonOnaylanan ? 'Son not onaylandı — kuyruk boşaldı.' : 'Onay bekleyen klinik not kalmadı.'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginTop: 14 }}>
              {sonOnaylanan && (
                <a href={onaylananNotYolu(sonOnaylanan.id)} style={{ color: '#2DD4BF', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 36 }}>{ONAYLANAN_NOTU_AC}</a>
              )}
              {sonOnaylanan?.patientId && (
                <a href={hastaDosyasiYolu(sonOnaylanan.patientId)} style={{ color: '#2DD4BF', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 36 }}>Hasta Dosyası →</a>
              )}
              <a href={HASTA_LISTESI_YOLU} style={{ color: '#9FB3C8', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 36 }}>{HASTA_LISTESINE_DON}</a>
              <a href={DOKTOR_ANA_SAYFA_YOLU} style={{ color: '#9FB3C8', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 36 }}>{ANA_SAYFAYA_DON}</a>
            </div>
          </div>
        ) : (
          notes.map((note) => {
            const busy = busyId === note.id;
            return (
              <div key={note.id} style={{ ...toolsCard, marginBottom: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 12,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0', minWidth: 0 }}>
                    {[note.maskedPatient, bransEtiketi(note.specialty), note.date].filter(Boolean).join(' • ')}
                    {acikId === note.id && kBekliyor ? <span style={{ color: '#F59E0B', fontWeight: 500 }}> · Ayşe notu yeniden okuyor…</span> : null}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => approve(note.id)} disabled={busy} style={btnStyle('#10B981', busy)}>
                      {busy ? 'Onaylanıyor...' : 'Onayla'}
                    </button>
                    <button onClick={() => reject(note.id)} disabled={busy} style={btnStyle('#EF4444', busy)}>
                      Reddet
                    </button>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => (acikId === note.id ? setAcikId('') : notuAc(note))}
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) (acikId === note.id ? setAcikId('') : notuAc(note)); }}
                  style={{ marginTop: 12, color: '#94A3B8', fontSize: 13, lineHeight: 1.55, cursor: 'pointer' }}
                >
                  {acikId === note.id ? (
                    /* Kaan (2026-09-10): Ayşe kutusunda Enter notu daraltıyordu — klavye olayı kartın başlığına yükselmesin */
                    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} style={{ cursor: 'default' }}>
                      {/* NOTYA-SOAP-02: tam not incelemesi — doktor DÜZENLEYEREK onaylar; düzenlemeler Ayşe'nin öğrenme verisidir */}
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 3 }}>Başvuru Yakınması <span style={{ fontWeight: 400, color: '#64748B' }}>· düzenlenebilir</span></div>
                        <input value={basvuruTaslak} onChange={(e) => setBasvuruTaslak(e.target.value)} placeholder="Hastanın geliş nedeni"
                          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#EDF1F7', fontSize: 13, padding: '8px 10px', fontStyle: 'italic', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#0F9B8E' }}>Yaşamsal Bulgular <span style={{ fontWeight: 400, color: '#64748B' }}>· düzenlenebilir</span></span>
                          {/* NOTYA-BLE-01/02 (Kaan 2026-09-15): Bluetooth cihazdan ölçüm + cihaz uygulamasından dosya — core, tüm branşlar */}
                          <CihazdanAl hastaId={note.patientId} notId={note.id} onOlcum={(v) => setVitalTaslak({ ...vitalTaslak, ...v })} />
                          <CihazDosyasi hastaId={note.patientId} notId={note.id} />
                        </div>
                        {/* BRANS-ALAN-SIZMASI (Kaan 2026-09-17): alanlar notun branş profilinden — baş çevresi yalnız pediatrik bağlamda (KD formunda çıkıyordu) */}
                        <YasamsalBulgularFormu
                          olcumler={note.bransKapsami.olcumler}
                          degerler={vitalTaslak}
                          onDegis={(k, v) => setVitalTaslak({ ...vitalTaslak, [k]: v })}
                          persentiller={note.buyumePersentilleri}
                          eriskinVkiGoster={!note.bransKapsami.pediatrik}
                        />
                      </div>
                      {(['subjektif', 'objektif', 'degerlendirme', 'plan'] as const).map((alan) => (
                        <div key={alan} style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 3 }}>
                            {alan === 'subjektif' ? 'Anamnez — Şikayet · Şikayetin Hikayesi · Özgeçmiş · Soygeçmiş' : alan === 'objektif' ? 'Fizik Muayene (+ Laboratuvar / Görüntüleme)' : alan === 'degerlendirme' ? 'Tanı' : 'Tedavi'}
                            <span style={{ fontWeight: 400, color: '#64748B' }}> · düzenlenebilir</span>
                          </div>
                          <textarea
                            value={taslak[alan]}
                            onChange={(e) => setTaslak({ ...taslak, [alan]: e.target.value })}
                            rows={Math.min(8, Math.max(2, Math.ceil(taslak[alan].length / 90)))}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#CBD5E1', fontSize: 13, lineHeight: 1.5, padding: '8px 10px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                          />
                        </div>
                      ))}
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>Tanı / ICD-10 önerileri <span style={{ fontWeight: 400, color: '#64748B' }}>(onayınıza tabi — otomatik yazılmaz)</span></span>
                          {/* Kaan (2026-09-14): "tanı değişince ICD-10 ve öneriler de değişmeli, AI tüm notu yeniden değerlendirmeli" */}
                          <button type="button" disabled={kBekliyor} onClick={() => konsultGonder(note, NOT_YENIDEN_DEGERLENDIR_ISTEK)} style={{ background: 'transparent', border: '1px solid rgba(245,158,11,0.4)', color: '#F59E0B', borderRadius: 999, padding: '2px 10px', fontSize: 11, cursor: kBekliyor ? 'default' : 'pointer', opacity: kBekliyor ? 0.5 : 1 }}>🔄 Notu AI ile yeniden değerlendir</button>
                        </div>
                        {icdTaslak.length > 0 ? (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {icdTaslak.map((k, i2) => (
                              <span key={i2} style={{ fontSize: 12, fontWeight: k.is_primary ? 700 : 500, padding: '4px 10px', borderRadius: 999, background: 'rgba(15,155,142,0.15)', color: '#2DD4BF', border: k.is_primary ? '1px solid #0F9B8E' : '1px solid transparent' }}>
                                {k.code} · {k.description_tr || k.description || ''}
                              </span>
                            ))}
                          </div>
                        ) : <div style={{ fontSize: 12, color: '#64748B' }}>ICD-10 önerisi yok</div>}
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 3 }}>İlaçlar <span style={{ fontWeight: 400, color: '#64748B' }}>(her satır bir ilaç: Ad — doz — kullanım — süre · düzenlenebilir)</span></div>
                        <textarea value={ilacTaslak} onChange={(e) => setIlacTaslak(e.target.value)} rows={Math.max(2, ilacTaslak.split('\n').length)}
                          placeholder="Örn. D vitamini — 600 ünite/gün — Günde 1 kez oral — Devam"
                          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#CBD5E1', fontSize: 13, lineHeight: 1.55, padding: '8px 10px', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }} />
                      </div>
                      {aiDegTaslak.trim() && (
                        <div style={{ marginBottom: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 8, padding: '8px 10px' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', marginBottom: 5 }}>Ayşe'nin değerlendirmesi <span style={{ fontWeight: 400, color: '#64748B' }}>(öneridir — nota ve hastaya yansımaz, yalnız size)</span></div>
                          <div style={{ fontSize: 13, color: '#CBD5E1' }}><HafifMarkdown metin={aiDegTaslak} /></div>
                        </div>
                      )}
                      {receteTaslak.length > 0 && (
                        <div style={{ marginBottom: 10, background: 'rgba(15,155,142,0.07)', border: '1px solid rgba(15,155,142,0.3)', borderRadius: 8, padding: '8px 10px' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#2DD4BF', marginBottom: 5 }}>Ayşe'nin reçete önerisi <span style={{ fontWeight: 400, color: '#64748B' }}>(öneridir — reçeteyi doktor yazar)</span></div>
                          {receteTaslak.map((r, i2) => (
                            <div key={i2} style={{ fontSize: 13, color: '#CBD5E1', marginBottom: 3 }}>
                              • {[r.ticariOrnek, r.etkenMadde ? `(${r.etkenMadde})` : '', r.doz, r.kullanim, r.sure].filter(Boolean).join(' — ')}
                              {r.sgkListesinde && <span style={{ marginLeft: 6, fontSize: 11, color: '#22C55E' }}>SGK ✓</span>}
                              {r.not && <div style={{ fontSize: 12, color: '#F59E0B', marginLeft: 12 }}>⚠ {r.not}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 3 }}>Evde dikkat edilmesi gerekenler <span style={{ fontWeight: 400, color: '#64748B' }}>({note.bransKapsami.hitap.evdeDikkatHedefi} anlatılacak · her satır bir madde · düzenlenebilir)</span></div>
                        <textarea value={alarmTaslak} onChange={(e) => setAlarmTaslak(e.target.value)} rows={Math.max(3, alarmTaslak.split('\n').length)}
                          placeholder="Her satıra bir uyarı yazın"
                          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#CBD5E1', fontSize: 13, lineHeight: 1.55, padding: '8px 10px', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }} />
                      </div>
                      {note.kritikBulgular.length > 0 && (
                        <div style={{ marginBottom: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 8, padding: '8px 10px' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', marginBottom: 3 }}>Dikkate almayı düşünür müsünüz? <span style={{ fontWeight: 400, color: '#64748B' }}>(öneridir — nota ve hastaya yansımaz)</span></div>
                          {note.kritikBulgular.map((kb, i2) => <div key={i2} style={{ fontSize: 13, color: '#FDBA74' }}>• {kb}</div>)}
                        </div>
                      )}
                      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#8FA0B5', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {/* BRANS-ALAN-SIZMASI: "veli" yalnız pediatrik bağlamda — KD/dahiliye/göz/derm notunda "Hasta özeti" */}
                          <span>{note.bransKapsami.hitap.ozetEtiketi} <span style={{ fontWeight: 400, color: '#64748B' }}>· portala gider · düzenlenebilir</span></span>
                          <button type="button" disabled={kBekliyor} onClick={() => konsultGonder(note, note.bransKapsami.hitap.ozetYenileIstegi)} style={{ background: 'transparent', border: '1px solid rgba(45,212,191,0.35)', color: '#2DD4BF', borderRadius: 999, padding: '2px 10px', fontSize: 11, cursor: kBekliyor ? 'default' : 'pointer', opacity: kBekliyor ? 0.5 : 1 }}>↻ Notuma göre yenile</button>
                        </div>
                        <textarea value={ozetTaslak} onChange={(e) => setOzetTaslak(e.target.value)} rows={Math.max(3, Math.ceil(ozetTaslak.length / 110))}
                          placeholder={note.bransKapsami.hitap.ozetYerTutucu}
                          style={{ width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#CBD5E1', fontSize: 13, lineHeight: 1.55, padding: '8px 10px', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }} />
                      </div>
                      {/* NOTYA-KONSULT-03: Ayşe ile not üzerinde konsult, sözle düzenleme, tek-dokunuş takip eylemleri */}
                      <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#2DD4BF', marginBottom: 6 }}>🩺 Ayşe ile bu notu konuşun <span style={{ fontWeight: 400, color: '#64748B' }}>— soru sorun ya da “planı kısalt” gibi düzenleme isteyin</span></div>
                        {kMesajlar.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto', marginBottom: 8 }}>
                            {kMesajlar.map((m, i2) => (
                              <div key={i2} style={{ alignSelf: m.rol === 'doktor' ? 'flex-end' : 'flex-start', maxWidth: '92%', background: m.rol === 'doktor' ? '#0F9B8E' : 'rgba(255,255,255,0.06)', color: '#EDF1F7', borderRadius: 10, padding: '7px 10px', fontSize: 13, lineHeight: 1.5, whiteSpace: m.rol === 'doktor' ? 'pre-wrap' : 'normal' }}>{m.rol === 'asistan' ? <HafifMarkdown metin={m.icerik} /> : m.icerik}</div>
                            ))}
                            {kBekliyor && <div style={{ fontSize: 12, color: '#64748B' }}>Ayşe düşünüyor…</div>}
                          </div>
                        )}
                        {eylemler.map((e, i2) => (
                          <div key={i2} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: e.durum === 'eklendi' ? 'rgba(34,197,94,0.1)' : 'rgba(15,155,142,0.08)', border: `1px solid ${e.durum === 'eklendi' ? 'rgba(34,197,94,0.4)' : 'rgba(15,155,142,0.35)'}`, borderRadius: 9, padding: '7px 10px', marginBottom: 6, fontSize: 12, color: '#CBD5E1' }}>
                            <span>{e.tur === 'takip_aramasi' ? '📞' : '📅'} {e.tur === 'takip_aramasi' ? `Takip araması (${e.kim === 'sekreter' ? 'sekreter/hemşire' : 'doktor'})` : 'Kontrol randevusu'} — {e.tarih} {e.saat || '10:00'}</span>
                            {e.durum === 'oneri' && <button type="button" onClick={() => eylemOnayla(note, i2)} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Takvime ekle</button>}
                            {e.durum === 'eklendi' && <span style={{ color: '#22C55E', fontWeight: 700 }}>✓ Takvime eklendi</span>}
                            {e.durum === 'hata' && <span style={{ color: '#FCA5A5' }}>Eklenemedi — takvimden elle ekleyin</span>}
                          </div>
                        ))}
                        <form onSubmit={(ev) => { ev.preventDefault(); konsultGonder(note); }} style={{ display: 'flex', gap: 6 }}>
                          <input value={kGirdi} onChange={(ev) => setKGirdi(ev.target.value)} placeholder="Örn. prognoz? / kontrolü 5 gün sonraya planla / planı kısalt" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#EDF1F7', borderRadius: 9, padding: '8px 10px', fontSize: 13, minWidth: 0 }} />
                          <button type="submit" disabled={kBekliyor || !kGirdi.trim()} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 9, padding: '0 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: kBekliyor || !kGirdi.trim() ? 0.5 : 1 }}>Sor</button>
                        </form>
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', gap: 16, alignItems: 'center' }}>
                        <span role="button" tabIndex={0} onClick={() => setAcikId('')} onKeyDown={(e) => { if (e.key === 'Enter') setAcikId(''); }} style={{ fontSize: 12, color: '#14B8A6', cursor: 'pointer' }}>Daralt ▴</span>
                        <span role="button" tabIndex={0} onClick={() => window.open(`/dashboard/doktor/notlar/${note.id}/yazdir`, '_blank')} onKeyDown={(e) => { if (e.key === 'Enter') window.open(`/dashboard/doktor/notlar/${note.id}/yazdir`, '_blank'); }} style={{ fontSize: 12, color: '#8FA0B5', cursor: 'pointer' }}>🖨️ Yazdır / PDF</span>
                        {note.ilaclar.length > 0 && (
                          <span role="button" tabIndex={0} onClick={() => window.open(`/dashboard/doktor/notlar/${note.id}/recete`, '_blank')} onKeyDown={(e) => { if (e.key === 'Enter') window.open(`/dashboard/doktor/notlar/${note.id}/recete`, '_blank'); }} style={{ fontSize: 12, color: '#2DD4BF', cursor: 'pointer', fontWeight: 600 }}>🧾 Reçete ({note.ilaclar.length} ilaç)</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {snippet(note.subjektif)}
                      <span style={{ color: '#14B8A6', marginLeft: 8 }}>Notu incele ▾</span>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
