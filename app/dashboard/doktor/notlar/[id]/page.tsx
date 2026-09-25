'use client';
/**
 * NOTYA-NOT-01 — Muayene notu sayfası: tam not, düzenlenebilir, yeniden onaylanabilir.
 *
 * Kaan/Gökhan (2026-09-10): Muayene Geçmişi'nde bir vizite tıklayınca notun TAMAMI görünmeli,
 * orada yine düzeltilebilmeli ve yeniden onaylanabilmeli — sadece Yazdır/PDF değil.
 * Tek sayfa, İnceleme kartıyla aynı alanlar ve aynı onay ucu (/api/notes/[id]/approve):
 * düzenlemeler öğrenme loguna girer, ilaçlar dosya+portala işlenir (aynı ilaç aynı doz → tekrar açılmaz).
 *
 * Kaan (2026-09-18): Formda klinik yenileme (başvuru / vital / SOAP) olunca Ayşe notu yeniden
 * okur — ICD, reçete/ilaç, evde dikkat, hasta özeti pediatrideki gibi güncellenir.
 */
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { CihazdanAl, CihazDosyasi } from '@/components/core/CihazdanAl';
import { onaylananNotYolu, hastaDosyasiYolu } from '@/lib/doktor/onaySonrasiYol';
import GeriLink from '@/components/navigasyon/GeriLink';
import { notDuzenleGeriHref } from '@/lib/doktor/geriNavigasyon';
import type { BransKapsami } from '@/lib/specialties/kapsam';
import { istemciKapsami } from '@/lib/specialties/kapsamIstemci';
import { bransEtiketi } from '@/lib/doktor/bransAdlari';
import YasamsalBulgularFormu from '@/components/doktor/YasamsalBulgularFormu';
import { satirBasiNumarala } from '@/lib/doktor/satirBasiNumarala';
import {
  NOT_YENIDEN_DEGERLENDIR_DEBOUNCE_MS,
  NOT_YENIDEN_DEGERLENDIR_ISTEK,
} from '@/lib/doktor/notYenidenDegerlendir';
import {
  CEK_BLOK_BASLIK,
  cekBlokDegistir,
  cekListeDogrula,
  cekListeDogrulamaMetni,
  cekNotMetni,
  type CekMadde,
} from '@/lib/doktor/muayeneCekListesi';
import { DOZ_HESAPLANDI_ETIKETI, NOT_ASI_AZAMI, notAsisiKartDurumu, notMetninAsiIpucuVarMi, type KartAsisi, type NotAsisi } from '@/lib/doktor/notAsilari';
import { ilacListeleriAyniMi, planIlacTutarsizMi } from '@/lib/doktor/receteAktarim';
import IlacUyumKarti, { planaGoreIlacOnerisi, type IlacUyumDurumu } from '@/components/doktor/IlacUyumKarti';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme'

interface IcdOner { code?: string; description?: string; description_tr?: string; is_primary?: boolean }
interface ReceteOner { etkenMadde?: string; ticariOrnek?: string; doz?: string; kullanim?: string; sure?: string; not?: string; sgkListesinde?: boolean }

interface NotVeri {
  not: {
    id: string
    createdAt: string
    approvedAt: string | null
    /** NOTYA-ARSIV-01: muayenesi arşivde — hiçbir listede görünmez, yalnız doğrudan açılır. */
    arsivde?: boolean
    specialty: string
    basvuruYakinmasi: string
    subjektif: string
    objektif: string
    degerlendirme: string
    plan: string
    alarmBulgulari: string[]
    vitaller: Record<string, unknown> | null
    ilaclar: { ad: string; doz: string; kullanim: string; sure: string }[]
    /** NOTYA-ASI-NOT-01: bu muayenede uygulanan aşılar (onayda aşı kartına geçer) + kart (bu notun satırları hariç). */
    asilar?: NotAsisi[]
    asiKart?: KartAsisi[]
    buyumePersentilleri?: { kilo?: string; boy?: string; basCevresi?: string; vki?: string; vkiSinif?: string } | null
    hastaOzeti: string
    icdKodlari: IcdOner[]
    receteOnerisi?: ReceteOner[]
    aiDegerlendirme?: string
    bransKapsami?: BransKapsami
    tani?: string
    /** NOTYA-CEK-DOGRULA-02: çek listesi girdileri — panel bunlardan ve formun GÜNCEL alanlarından hesaplanır. */
    cek?: { maddeler: CekMadde[]; oncekiIdler: string[]; isaretler: Record<string, boolean> } | null
  }
  hasta: { ad: string; patientId: string | null }
  doktor: { ad: string }
  duzenlemeSayisi: number
}

const BOLUM = [
  ['subjektif', 'Anamnez — Şikayet · Şikayetin Hikayesi · Özgeçmiş · Soygeçmiş'],
  ['objektif', 'Fizik Muayene / Bulgular'],
  ['degerlendirme', 'Değerlendirme — Ön Tanı / Ayırıcı Tanı'],
  ['plan', 'Tedavi · Tetkik · Kontrol'],
] as const;

function ilacMetniniCoz(metin: string): { ad: string; doz: string; kullanim: string; sure: string }[] {
  return metin.split('\n').map((satir) => satir.trim()).filter(Boolean).map((satir) => {
    const p = satir.split(' — ').map((x) => x.trim())
    return { ad: p[0] || '', doz: p[1] || '', kullanim: p[2] || '', sure: p[3] || '' }
  }).filter((i) => i.ad)
}
/** Form satırı → gönderilecek aşı (boş ad atılır; doz boşsa null). */
function asiSatirlari(liste: NotAsisi[]): NotAsisi[] {
  return liste.filter((a) => a.asi_adi.trim()).map((a) => ({ ...a, asi_adi: a.asi_adi.trim() }))
}
function trTarih(iso: string | null): string { if (!iso) return ''; return new Date(iso).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }

const kutu: React.CSSProperties = { width: '100%', background: '#FFFFFF', border: '1px solid rgba(58,44,34,0.14)', borderRadius: 8, color: CHROME_RENK.ink, fontSize: 13.5, lineHeight: 1.6, padding: '10px 12px', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' };
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: CHROME_RENK.pine, marginBottom: 4 };
// NOTYA-CEK-EKSIK-SAG-01 (Gökhan, 2026-09-23): çek listesinde "✗ eksik" kalanlar formun sağında,
// göz önünde durmalı (tam doğrulama metni aşağıda AI değerlendirmesinde aynen kalır). Telefonda üste gelir.
const NOT_DUZEN_CSS = `.notDuzen{max-width:1180px;margin:0 auto;padding:18px 16px 60px;display:grid;gap:20px;grid-template-columns:minmax(0,1fr) 280px;align-items:start}
.notDuzen.tek{max-width:860px;grid-template-columns:minmax(0,1fr)}
.notDuzen aside{position:sticky;top:84px}
@media (max-width:900px){.notDuzen{grid-template-columns:minmax(0,1fr)}.notDuzen aside{order:-1;position:static}}`;
const EKSIK_SATIR = /^\s*-\s*(.+?):\s*[✗✕×]\s*eksik\s*$/;

export default function NotSayfasi() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [veri, setVeri] = useState<NotVeri | null>(null);
  const [hata, setHata] = useState('');
  const [basvuru, setBasvuru] = useState('');
  const [vital, setVital] = useState<Record<string, string>>({});
  const [taslak, setTaslak] = useState<Record<string, string>>({ subjektif: '', objektif: '', degerlendirme: '', plan: '' });
  const [alarm, setAlarm] = useState('');
  const [ozet, setOzet] = useState('');
  const [ilac, setIlac] = useState('');
  const [asilar, setAsilar] = useState<NotAsisi[]>([]);
  const [icd, setIcd] = useState<IcdOner[]>([]);
  const [recete, setRecete] = useState<ReceteOner[]>([]);
  const [aiDeg, setAiDeg] = useState('');
  const [durum, setDurum] = useState<'bos' | 'kaydediyor' | 'kaydedildi' | 'hata'>('bos');
  const [degisti, setDegisti] = useState(false);
  const [aiDurum, setAiDurum] = useState<'bos' | 'bekliyor' | 'guncellendi' | 'hata'>('bos');
  const [uyum, setUyum] = useState<IlacUyumDurumu | null>(null);
  const atlaOtomatikRef = useRef(true);
  const aiBekliyorRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const t = await ensureDoctorAccessToken();
        const r = await fetch(`/api/notes/${params.id}`, { headers: { Authorization: `Bearer ${t}` } });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Not alınamadı');
        atlaOtomatikRef.current = true;
        setVeri(j);
        setBasvuru(j.not.basvuruYakinmasi || '');
        setVital(Object.fromEntries(Object.entries((j.not.vitaller || {}) as Record<string, unknown>).map(([k, v]) => [k, v == null ? '' : String(v)])));
        setTaslak({
          subjektif: satirBasiNumarala(j.not.subjektif || ''),
          objektif: satirBasiNumarala(j.not.objektif || ''),
          degerlendirme: satirBasiNumarala(j.not.degerlendirme || ''),
          plan: satirBasiNumarala(j.not.plan || ''),
        });
        setAlarm((j.not.alarmBulgulari || []).join('\n'));
        setOzet(j.not.hastaOzeti || '');
        setIlac((j.not.ilaclar || []).map((il: { ad?: string; doz?: string; kullanim?: string; sure?: string }) => [il.ad, il.doz, il.kullanim, il.sure].filter(Boolean).join(' — ')).join('\n'));
        setAsilar(Array.isArray(j.not.asilar) ? j.not.asilar : []);
        setIcd(Array.isArray(j.not.icdKodlari) ? j.not.icdKodlari : []);
        setRecete(Array.isArray(j.not.receteOnerisi) ? j.not.receteOnerisi : []);
        setAiDeg(String(j.not.aiDegerlendirme || ''));
      } catch (e) { setHata(e instanceof Error ? e.message : 'Hata'); }
    })();
  }, [params.id]);

  const isaretle = <T,>(set: (v: T) => void) => (v: T) => { set(v); setDegisti(true); };

  // NOTYA-CEK-DOGRULA-02 (Gökhan, 2026-09-23): "Kalça muayenesi yapıldı" yazıp yeniden değerlendirince kalça listede
  // kalıyordu — panel not oluşturulurken yazılan metinden okunuyordu. Artık her düzenlemede formun GÜNCEL alanlarından
  // deterministik hesaplanır (LLM yok); kayıtta blok onay anında sunucuda aynı fonksiyonla yeniden yazılır.
  const cekSatirlari = () => {
    const c = veri?.not.cek;
    if (!c) return null;
    const metin = cekNotMetni({
      basvuruYakinmasi: basvuru, subjektif: taslak.subjektif, objektif: taslak.objektif, degerlendirme: taslak.degerlendirme,
      plan: taslak.plan, tani: veri?.not.tani, vitaller: vital, ilaclar: ilacMetniniCoz(ilac), asilar: asiSatirlari(asilar),
    });
    return cekListeDogrula(c.maddeler, { soap: metin, isaretler: c.isaretler, oncekiIdler: c.oncekiIdler });
  };
  const aiDegGuncel = () => {
    const s = cekSatirlari();
    return s ? cekBlokDegistir(aiDeg, cekListeDogrulamaMetni(s)) : aiDeg;
  };

  const aiYenidenOku = async () => {
    if (aiBekliyorRef.current || !veri) return;
    aiBekliyorRef.current = true;
    setAiDurum('bekliyor');
    const kontrolor = new AbortController();
    const zamanAsimi = setTimeout(() => kontrolor.abort(), 30000);
    try {
      const t = await ensureDoctorAccessToken();
      const r = await fetch('/api/doktor/not-konsult', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        signal: kontrolor.signal,
        body: JSON.stringify({
          noteId: params.id,
          taslak: {
            ...taslak,
            basvuruYakinmasi: basvuru,
            vitaller: vital,
            alarmBulgulari: alarm.split('\n').map((x) => x.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean),
            hastaOzeti: ozet,
            ilaclar: ilacMetniniCoz(ilac),
            asilar: asiSatirlari(asilar),
            icdKodlari: icd,
            receteOnerisi: recete,
            aiDegerlendirme: aiDeg,
          },
          mesajlar: [{ rol: 'doktor', icerik: NOT_YENIDEN_DEGERLENDIR_ISTEK }],
        }),
      });
      clearTimeout(zamanAsimi);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Ayşe yanıt veremedi.');
      const dz = (d.duzenlemeler || {}) as Record<string, unknown>;
      atlaOtomatikRef.current = true;
      if (Array.isArray(dz.alarmBulgulari)) { setAlarm((dz.alarmBulgulari as unknown[]).map(String).join('\n')); setDegisti(true); }
      if (typeof dz.hastaOzeti === 'string') { setOzet(dz.hastaOzeti as string); setDegisti(true); }
      if (Array.isArray(dz.ilaclar)) {
        setIlac((dz.ilaclar as unknown[]).map((it) => {
          const o = it as Record<string, unknown>
          return [o.ad, o.doz, o.kullanim, o.sure].filter(Boolean).join(' — ')
        }).join('\n'));
        setDegisti(true);
      }
      if (Array.isArray(dz.asilar)) { setAsilar(dz.asilar as NotAsisi[]); setDegisti(true); }
      if (Array.isArray(dz.icdKodlari)) {
        setIcd((dz.icdKodlari as unknown[]).map((it) => {
          const o = it as Record<string, unknown>
          return { code: String(o.code || ''), description: String(o.description_tr || o.description || ''), description_tr: String(o.description_tr || o.description || ''), is_primary: !!o.is_primary }
        }).filter((k) => k.code));
        setDegisti(true);
      }
      if (Array.isArray(dz.receteOnerisi)) {
        setRecete((dz.receteOnerisi as unknown[]).map((it) => {
          const o = it as Record<string, unknown>
          return { ticariOrnek: String(o.ticariOrnek || ''), etkenMadde: String(o.etkenMadde || ''), doz: String(o.doz || ''), kullanim: String(o.kullanim || ''), sure: String(o.sure || ''), sgkListesinde: !!o.sgkListesinde, not: String(o.not || '') }
        }).filter((x) => x.ticariOrnek));
        setDegisti(true);
      }
      if (typeof dz.aiDegerlendirme === 'string' && (dz.aiDegerlendirme as string).trim()) {
        setAiDeg(dz.aiDegerlendirme as string);
        setDegisti(true);
      }
      setAiDurum('guncellendi');
      setTimeout(() => setAiDurum((s) => (s === 'guncellendi' ? 'bos' : s)), 2500);
    } catch {
      clearTimeout(zamanAsimi);
      setAiDurum('hata');
      setTimeout(() => setAiDurum((s) => (s === 'hata' ? 'bos' : s)), 3500);
    } finally {
      aiBekliyorRef.current = false;
    }
  };

  useEffect(() => {
    if (!veri) return;
    if (atlaOtomatikRef.current) {
      atlaOtomatikRef.current = false;
      return;
    }
    if (aiBekliyorRef.current) return;
    const t = setTimeout(() => { void aiYenidenOku(); }, NOT_YENIDEN_DEGERLENDIR_DEBOUNCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basvuru, vital, taslak.subjektif, taslak.objektif, taslak.degerlendirme, taslak.plan, veri?.not.id]);

  /** ilacOnayli: İlaç uyum kartından gelen (hekimin seçtiği) İlaçlar metni — varsa kontroller atlanır. */
  const kaydetVeOnayla = async (ilacOnayli?: string) => {
    if (ilacOnayli === undefined) {
      // NOTYA-ASI-NOT-04: boş yapılı aşı listesi + metinde aşı uygulandı ipucu → onaydan önce hatırlat.
      // Blok değil — hekim gerekçesini bilir, son karar her zaman onun.
      if (asilar.length === 0 && notMetninAsiIpucuVarMi([taslak.subjektif, taslak.objektif, taslak.degerlendirme, taslak.plan])) {
        const devam = window.confirm('Notunuzda bu muayenede bir aşı uygulandığına dair bir ifade var gibi görünüyor, ama “Bu muayenede uygulanan aşılar” listesi boş — bu liste boş kaldığı sürece aşı kartına hiçbir şey işlenmez. Yine de onaylamak istiyor musunuz?')
        if (!devam) return
      }
      // NOTYA-RECETE-04 (Kaan, 2026-09-25): Plan metni ile İlaçlar listesi (reçeteye/dosyaya giden TEK kaynak)
      // ayrışmışsa Ayşe Plan'dan listeyi çıkarır, hekim kartta seçer. Listeler aynı çıkarsa kart açılmaz.
      const mevcut = ilacMetniniCoz(ilac)
      if (planIlacTutarsizMi(taslak.plan, mevcut)) {
        setUyum({ tur: 'kontrol' })
        let oneri = null
        try {
          oneri = await planaGoreIlacOnerisi((await ensureDoctorAccessToken()) || '', params.id, {
            ...taslak, basvuruYakinmasi: basvuru, vitaller: vital, hastaOzeti: ozet, ilaclar: mevcut,
            asilar: asiSatirlari(asilar), icdKodlari: icd, receteOnerisi: recete, aiDegerlendirme: aiDeg,
          })
        } catch { oneri = null }
        if (!oneri) { setUyum({ tur: 'uyari', mevcut }); return }
        if (!ilacListeleriAyniMi(mevcut, oneri)) { setUyum({ tur: 'oneri', mevcut, oneri }); return }
        setUyum(null)
      }
    }
    const ilacMetni = ilacOnayli ?? ilac
    if (ilacOnayli !== undefined) { setIlac(ilacOnayli); setUyum(null) }
    setDurum('kaydediyor');
    try {
      const t = await ensureDoctorAccessToken();
      const r = await fetch(`/api/notes/${params.id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({
          duzenlemeler: {
            ...taslak,
            basvuruYakinmasi: basvuru,
            vitaller: vital,
            alarmBulgulari: alarm.split('\n').map((x) => x.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean),
            hastaOzeti: ozet,
            ilaclar: ilacMetniniCoz(ilacMetni),
            asilar: asiSatirlari(asilar),
            icdKodlari: icd,
            receteOnerisi: recete,
            aiDegerlendirme: aiDegGuncel(),
          },
        }) });
      const j = await r.json();
      if (!r.ok || j.success === false) throw new Error(j.error || 'Onaylanamadı');
      const catisma = (j.asiAktarim?.catisma || []) as { mesaj: string }[];
      if (catisma.length) alert(`Not onaylandı. Şu aşı${catisma.length > 1 ? 'lar' : ''} aşı kartına yazılmadı:\n${catisma.map((c) => `• ${c.mesaj}`).join('\n')}\nDoz numarasını düzeltip yeniden onaylayabilirsiniz.`);
      // NOTYA-AKTARIM-HATA-01 (Kaan, 2026-09-24): aşı/reçete aktarımı (sistem hatası —
      // çakışma değil) sessizce yutuluyordu; not onaylanıyor ama hasta dosyasına/karta
      // hiçbir şey yazılmıyordu ve hekimin bunu fark etmesinin hiçbir yolu yoktu.
      const aktarimHatalari = [j.asiAktarim?.hata, j.receteAktarim?.hata].filter(Boolean) as string[];
      if (aktarimHatalari.length) alert(`Not onaylandı, ama aşağıdaki aktarım(lar) başarısız oldu — hasta dosyasına/aşı kartına/reçeteye yansımamış olabilir:\n${aktarimHatalari.map((h) => `• ${h}`).join('\n')}\nLütfen notu tekrar açıp yeniden onaylayın; sorun devam ederse destek ekibine bildirin.`);
      setDurum('kaydedildi'); setDegisti(false);
      setVeri((v) => v ? { ...v, not: { ...v.not, approvedAt: new Date().toISOString() } } : v);
      setTimeout(() => router.push(onaylananNotYolu(params.id)), 700);
    } catch (e) { setDurum('hata'); alert(e instanceof Error ? e.message : 'Onaylanamadı'); setTimeout(() => setDurum('bos'), 2500); }
  };

  if (hata) return <div style={{ padding: 40, color: CHROME_RENK.ink, fontFamily: 'system-ui' }}>{hata}</div>;
  if (!veri) return <div style={{ padding: 40, color: CHROME_RENK.muted, fontFamily: 'system-ui' }}>Not yükleniyor…</div>;
  const { not, hasta } = veri;
  const onayli = !!not.approvedAt;
  const kapsam = istemciKapsami(not.bransKapsami);
  const cekCanli = cekSatirlari();
  const aiDegGorunen = aiDegGuncel();
  const cekVar = !!cekCanli || aiDeg.includes(CEK_BLOK_BASLIK);
  // Girdiler gelmediyse (eski yanıt / hata) kayıtlı bloktan okunur.
  const eksikler = cekCanli
    ? cekCanli.filter((s) => s.durum === 'eksik').map((s) => s.etiket)
    : aiDeg.split('\n').map((s) => s.match(EKSIK_SATIR)?.[1]?.trim()).filter((x): x is string => !!x);
  const oncekiler = (cekCanli || []).filter((s) => s.durum === 'onceki').map((s) => s.etiket);

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', color: CHROME_RENK.ink, fontFamily: 'system-ui' }}>
      {uyum ? (
        <IlacUyumKarti durum={uyum} onGuncelleOnayla={(m) => { void kaydetVeOnayla(m) }} onMevcutlaOnayla={() => { void kaydetVeOnayla(ilac) }} onVazgec={() => setUyum(null)} />
      ) : null}
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: '#F6F0E4', borderBottom: '1px solid rgba(58,44,34,0.1)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <GeriLink
          href={notDuzenleGeriHref(hasta.patientId)}
          ileriHref={`/dashboard/doktor/notlar/${not.id}/yazdir`}
          ileriLabel="Yazdır / PDF"
        >
          {hasta.patientId ? '← Muayene Geçmişi' : '← Hastalar'}
        </GeriLink>
        <a href={hastaDosyasiYolu(hasta.patientId, 'muayene')} style={{ color: CHROME_RENK.muted, fontSize: 13, textDecoration: 'none' }}>{hasta.patientId ? 'Muayene Geçmişi →' : 'Hastalar →'}</a>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{hasta.ad} <span style={{ color: CHROME_RENK.muted, fontWeight: 500 }}>· {bransEtiketi(not.specialty)} · {trTarih(not.createdAt)}</span></div>
          <div style={{ fontSize: 12, color: onayli ? '#2E6E4E' : '#B4832F' }}>
            {onayli ? `Onaylı — ${trTarih(not.approvedAt)}` : 'Onay bekliyor'}
            {degisti ? ' · kaydedilmemiş değişiklik var' : ''}
            {aiDurum === 'bekliyor' ? ' · Ayşe notu yeniden okuyor…' : ''}
            {aiDurum === 'guncellendi' ? ' · öneriler güncellendi' : ''}
            {aiDurum === 'hata' ? ' · AI öneri güncellemesi başarısız' : ''}
          </div>
        </div>
        <a href={`/dashboard/doktor/notlar/${not.id}/yazdir`} target="_blank" rel="noreferrer" style={{ color: CHROME_RENK.ink, fontSize: 13, textDecoration: 'none', border: '1px solid rgba(58,44,34,0.16)', borderRadius: 999, padding: '7px 12px' }}>🖨️ Yazdır / PDF</a>
        <a href={`/dashboard/doktor/notlar/${not.id}/recete`} target="_blank" rel="noreferrer" style={{ color: CHROME_RENK.pine, fontSize: 13, textDecoration: 'none', border: '1px solid rgba(47,67,52,0.4)', borderRadius: 999, padding: '7px 12px' }}>🧾 Reçete</a>
        <button type="button" onClick={() => { void kaydetVeOnayla() }} disabled={durum === 'kaydediyor'} style={{ background: CHROME_RENK.pine, border: 'none', color: 'white', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 800, cursor: 'pointer', opacity: aiDurum === 'bekliyor' ? 0.85 : 1 }}>
          {durum === 'kaydediyor' ? 'Kaydediliyor…' : durum === 'kaydedildi' ? '✓ Onaylandı' : onayli ? 'Kaydet ve yeniden onayla' : 'Onayla'}
        </button>
      </div>

      {not.arsivde && (
        <div role="status" style={{ margin: '12px 16px 0', padding: '10px 14px', borderRadius: 10, background: 'rgba(139,125,112,0.12)', border: '1px solid rgba(139,125,112,0.35)', color: '#6d6055', fontSize: 13 }}>
          <b>Arşivde</b> — bu muayene arşivlendi; panoda, listelerde, aramada ve hasta portalında görünmez. Geri almak için Muayene Geçmişi › Arşivlenenler › <b>Arşivden çıkar</b>.
        </div>
      )}

      <style>{NOT_DUZEN_CSS}</style>
      <div className={cekVar ? 'notDuzen' : 'notDuzen tek'}>
      <div style={{ display: 'grid', gap: 16, minWidth: 0 }}>
        <div>
          <div style={etiket}>Başvuru Yakınması</div>
          <input value={basvuru} onChange={(e) => isaretle(setBasvuru)(e.target.value)} style={{ ...kutu, fontStyle: 'italic' }} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={etiket}>Yaşamsal Bulgular</div>
            <CihazdanAl hastaId={veri.hasta.patientId} notId={veri.not.id} onOlcum={(v) => isaretle((x: Record<string, string>) => setVital({ ...vital, ...x }))(v)} />
            <CihazDosyasi hastaId={veri.hasta.patientId} notId={veri.not.id} />
          </div>
          <YasamsalBulgularFormu
            olcumler={kapsam.olcumler}
            degerler={vital}
            onDegis={(k, v) => isaretle((x: string) => setVital({ ...vital, [k]: x }))(v)}
            persentiller={veri.not.buyumePersentilleri}
            girdiStili={{ ...kutu, width: 76, padding: '6px 8px' }}
            persentilRengi={CHROME_RENK.pine}
            eriskinVkiGoster={!kapsam.pediatrik}
          />
        </div>
        {BOLUM.map(([k, ad]) => (
          <div key={k}>
            <div style={etiket}>{ad}</div>
            <textarea value={taslak[k]} onChange={(e) => isaretle((v: string) => setTaslak({ ...taslak, [k]: v }))(e.target.value)} rows={Math.max(4, Math.min(18, Math.ceil((taslak[k] || '').length / 95)))} style={kutu} />
          </div>
        ))}
        <div>
          <div style={{ ...etiket, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span>ICD-10 <span style={{ fontWeight: 400, color: CHROME_RENK.muted }}>(onayınıza tabi)</span></span>
            <button type="button" disabled={aiDurum === 'bekliyor'} onClick={() => { void aiYenidenOku(); }} style={{ background: 'transparent', border: '1px solid rgba(180,131,47,0.4)', color: '#B4832F', borderRadius: 999, padding: '2px 10px', fontSize: 11, cursor: aiDurum === 'bekliyor' ? 'default' : 'pointer', opacity: aiDurum === 'bekliyor' ? 0.5 : 1 }}>🔄 Notu AI ile yeniden değerlendir</button>
          </div>
          {icd.length > 0 ? (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{icd.map((c, i) => <span key={i} style={{ fontSize: 12, background: '#F6F0E4', border: '1px solid rgba(58,44,34,0.14)', borderRadius: 999, padding: '3px 10px' }}>{c.code}{(c.description_tr || c.description) ? ` — ${c.description_tr || c.description}` : ''}</span>)}</div>
          ) : (
            <div style={{ fontSize: 12, color: CHROME_RENK.muted }}>Henüz ICD önerisi yok — notu düzenleyince Ayşe günceller.</div>
          )}
        </div>
        {aiDegGorunen.trim() ? (
          <div>
            <div style={etiket}>Klinik değerlendirme (AI · hastaya görünmez)</div>
            <div style={{ ...kutu, whiteSpace: 'pre-wrap', color: CHROME_RENK.ink }}>{aiDegGorunen}</div>
          </div>
        ) : null}
        <div>
          <div style={etiket}>İlaçlar <span style={{ fontWeight: 400, color: CHROME_RENK.muted }}>(her satır bir ilaç: Ad — doz — kullanım — süre)</span></div>
          <textarea value={ilac} onChange={(e) => isaretle(setIlac)(e.target.value)} rows={Math.max(2, ilac.split('\n').length)} placeholder="Örn. D vitamini — 600 ünite/gün — Günde 1 kez oral — Devam" style={kutu} />
        </div>
        <div>
          <div style={etiket}>Bu muayenede uygulanan aşılar <span style={{ fontWeight: 400, color: CHROME_RENK.muted }}>(onayda aşı kartına işlenir · planlanan aşılar burada değil, planda kalır)</span></div>
          {asilar.length === 0 ? (
            <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginBottom: 6 }}>Bu muayenede uygulanan aşı yok.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8, marginBottom: 6 }}>
              {asilar.map((a, i) => {
                const guncelle = (p: Partial<NotAsisi>) => isaretle(setAsilar)(asilar.map((x, j) => (j === i ? { ...x, ...p } : x)));
                const kartDurumu = a.asi_adi.trim() ? notAsisiKartDurumu(a, veri.not.asiKart || []) : null;
                return (
                  <div key={i} style={{ border: '1px solid rgba(58,44,34,0.14)', borderRadius: 8, padding: 8 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <input aria-label="Aşı" value={a.asi_adi} onChange={(e) => guncelle({ asi_adi: e.target.value })} placeholder="Aşı (örn. Hepatit B)" style={{ ...kutu, flex: '2 1 180px', width: 'auto', padding: '6px 8px' }} />
                      <input aria-label="Doz" type="number" min={1} max={12} value={a.doz_no ?? ''} onChange={(e) => guncelle({ doz_no: e.target.value ? Number(e.target.value) : null, doz_hesaplandi: false })} placeholder="Doz" style={{ ...kutu, width: 70, padding: '6px 8px', ...(a.doz_hesaplandi ? { borderColor: '#B4832F', background: 'rgba(180,131,47,0.12)' } : {}) }} />
                      <input aria-label="Tarih" type="date" value={a.uygulama_tarihi || ''} onChange={(e) => guncelle({ uygulama_tarihi: e.target.value || null })} style={{ ...kutu, width: 150, padding: '6px 8px' }} />
                      <input aria-label="Lot" value={a.lot_no || ''} onChange={(e) => guncelle({ lot_no: e.target.value || null })} placeholder="Lot (ops.)" style={{ ...kutu, width: 110, padding: '6px 8px' }} />
                      <input aria-label="Uygulama yeri" value={a.uygulama_yeri || ''} onChange={(e) => guncelle({ uygulama_yeri: e.target.value || null })} placeholder="Yer (ops.)" style={{ ...kutu, width: 130, padding: '6px 8px' }} />
                      <button type="button" onClick={() => isaretle(setAsilar)(asilar.filter((_, j) => j !== i))} aria-label="Aşıyı kaldır" style={{ background: 'transparent', border: '1px solid rgba(180,60,40,0.4)', color: '#A4453C', borderRadius: 8, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>Kaldır</button>
                    </div>
                    {a.doz_hesaplandi ? <div style={{ fontSize: 12, color: '#B4832F', marginTop: 4 }}>Doz: {DOZ_HESAPLANDI_ETIKETI}</div> : null}
                    {kartDurumu?.tur === 'kartta_var' ? <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 4 }}>Bu aşı aynı tarihle aşı kartında zaten var — ikinci kayıt açılmaz.</div> : null}
                    {kartDurumu?.tur === 'catisma' ? <div role="alert" style={{ fontSize: 12, color: '#B4832F', marginTop: 4 }}>⚠ {kartDurumu.mesaj}. Doz numarasını değiştirene kadar bu satır aşı kartına yazılmaz.</div> : null}
                  </div>
                );
              })}
            </div>
          )}
          {asilar.length < NOT_ASI_AZAMI ? (
            <button type="button" onClick={() => isaretle(setAsilar)([...asilar, { asi_adi: '', doz_no: null, uygulama_tarihi: new Date(not.createdAt).toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' }) }])} style={{ background: 'transparent', border: '1px solid rgba(47,67,52,0.4)', color: CHROME_RENK.pine, borderRadius: 999, padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}>+ Aşı ekle</button>
          ) : null}
        </div>
        <div>
          <div style={etiket}>Evde dikkat edilmesi gerekenler <span style={{ fontWeight: 400, color: CHROME_RENK.muted }}>({kapsam.hitap.evdeDikkatHedefi} · her satır bir madde)</span></div>
          <textarea value={alarm} onChange={(e) => isaretle(setAlarm)(e.target.value)} rows={Math.max(3, alarm.split('\n').length)} style={kutu} />
        </div>
        <div>
          <div style={etiket}>{kapsam.hitap.ozetEtiketi} <span style={{ fontWeight: 400, color: CHROME_RENK.muted }}>(portala gider)</span></div>
          <textarea value={ozet} onChange={(e) => isaretle(setOzet)(e.target.value)} rows={4} style={kutu} />
        </div>
      </div>
      {cekVar ? (
        <aside style={{ background: 'rgba(180,131,47,0.08)', border: '1px solid rgba(180,131,47,0.30)', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#B4832F' }}>
            {eksikler.length ? `Eksik kalanlar (${eksikler.length})` : 'Çek listesi tamam'}
          </div>
          <div style={{ fontSize: 11, color: CHROME_RENK.muted, margin: '2px 0 8px' }}>Çek listesi · notu düzenledikçe güncellenir · karar desteği, hekim değerlendirir</div>
          {eksikler.length ? (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
              {eksikler.map((e, i) => (
                <li key={i} style={{ fontSize: 13, color: CHROME_RENK.ink, lineHeight: 1.4, display: 'flex', gap: 6 }}>
                  <span style={{ color: '#A4453C', fontWeight: 800 }}>✗</span><span>{e}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ fontSize: 13, color: '#2E6E4E' }}>Boş madde kalmadı.</div>
          )}
          {oncekiler.length ? (
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(58,44,34,0.1)' }}>
              <div style={{ fontSize: 11, color: CHROME_RENK.muted, marginBottom: 4 }}>✓ önceki kayıtta var</div>
              <div style={{ fontSize: 12, color: CHROME_RENK.muted, lineHeight: 1.5 }}>{oncekiler.join(' · ')}</div>
            </div>
          ) : null}
        </aside>
      ) : null}
      </div>
    </div>
  );
}
