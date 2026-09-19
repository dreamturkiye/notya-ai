'use client';

/**
 * NOTYA-DOSYA-01 — Hasta dosyası, ana sayfayla aynı birinci sınıf görsel dilde:
 * iki tonlu lacivert paneller (#0D1C33), ince rgba hatlar, teal vurgu, gradient kimlik
 * başlığı (baş harfli avatar + bilgi çipleri), yatay kaydırılabilir hap sekmeler.
 * Ek olarak: "Muayene Geçmişi" sekmesi artık gerçek bir zaman çizelgesi (eski yer tutucu
 * metin yerine) — vizitler, tanı, onay durumu ve tek tıkla Yazdır/PDF.
 */

import React, { useState, useEffect, useCallback } from 'react';
import HastaIlaclar from '@/components/doktor/HastaIlaclar';
import HastaIntake from '@/components/doktor/HastaIntake';
import HastaAsilar from '@/components/doktor/HastaAsilar';
import HastaKonsult from '@/components/doktor/HastaKonsult';
import HastaBuyumeEgrileri from '@/components/doktor/HastaBuyumeEgrileri';
import HastaMchat from '@/components/doktor/HastaMchat';
import HastaGelisimTaramasi from '@/components/doktor/HastaGelisimTaramasi';
import HastaGebelik from '@/components/doktor/HastaGebelik';
import HastaBebekKarti from '@/components/doktor/HastaBebekKarti';
import HastaDermatoloji from '@/components/doktor/HastaDermatoloji';
import DahiliyeHome from '@/specialties/dahiliye/ui/DahiliyeHome';
import GozHome from '@/specialties/goz-hastaliklari/ui/GozHome';
import PsikiyatriHome from '@/specialties/psikiyatri/ui/PsikiyatriHome';
import KbbHome from '@/specialties/kulak-burun-bogaz/ui/KbbHome';
import KardioHome from '@/specialties/kardiyoloji/ui/KardioHome';
import GogusHome from '@/specialties/gogus-hastaliklari/ui/GogusHome';
import NorolojiHome from '@/specialties/noroloji/ui/NorolojiHome';
import UrolojiHome from '@/specialties/uroloji/ui/UrolojiHome';
import SporHekimligiHome from '@/specialties/spor-hekimligi/ui/SporHekimligiHome';
import OrtopediHome from '@/specialties/ortopedi/ui/OrtopediHome';
import FtrHome from '@/specialties/fizik-tedavi/ui/FtrHome';
import AileHome from '@/specialties/aile-hekimligi/ui/AileHome';
import EndokrinolojiHome from '@/specialties/endokrinoloji/ui/EndokrinolojiHome';
import RomatolojiHome from '@/specialties/romatoloji/ui/RomatolojiHome';
import EnfeksiyonHome from '@/specialties/enfeksiyon-hastaliklari/ui/EnfeksiyonHome';
import GastroenterolojiHome from '@/specialties/gastroenteroloji/ui/GastroenterolojiHome';
import NefrolojiHome from '@/specialties/nefroloji/ui/NefrolojiHome';
import OnkolojiHome from '@/specialties/onkoloji/ui/OnkolojiHome'
import GogusCerrahiHome from '@/specialties/gogus-cerrahisi/ui/GogusCerrahiHome';
import GenelCerrahiHome from '@/specialties/genel-cerrahi/ui/GenelCerrahiHome';
import PlastikHome from '@/specialties/plastik-cerrahi/ui/PlastikHome'
import BeyinCerrahisiHome from '@/specialties/beyin-cerrahisi/ui/BeyinCerrahisiHome';
import RadyolojiHome from '@/specialties/radyoloji/ui/RadyolojiHome';
import CocukCerrahisiHome from '@/specialties/cocuk-cerrahisi/ui/CocukCerrahisiHome';
import AnesteziHome from '@/specialties/anestezi/ui/AnesteziHome';
import KalpDamarHome from '@/specialties/kalp-damar-cerrahisi/ui/KalpDamarHome';
import AcilTipHome from '@/specialties/acil-tip/ui/AcilTipHome';
import PatientDocumentVault from '@/components/doktor/PatientDocumentVault';
import HastaKonsultasyonlar from '@/components/doktor/HastaKonsultasyonlar';
import HedefBoyManken from '@/components/hedefBoy/HedefBoyManken';
import { hesaplaHedefBoy, formatBoyCm, pediatriHedefBoyBransi } from '@/lib/clinical/hedefBoy';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import DoktorNav from '@/components/doktor/DoktorNav';
import { ensureDoctorAccessToken, DOKTOR_GIRIS } from '@/lib/doktor/clientAuth';
import { yasHesapla } from '@/lib/doktor/yas';
import {
  gebelikSekmesiUygun,
  hastaDosyaSekmeleri,
  dahiliyeSekmesiBransi,
  psikiyatriSekmesiBransi,
  kbbSekmesiBransi,
  kardiyolojiSekmesiBransi,
  gogusSekmesiBransi,
  norolojiSekmesiBransi,
  urolojiSekmesiBransi,
  sporHekimligiSekmesiBransi,
  ortopediSekmesiBransi,
  fizikTedaviSekmesiBransi,
  aileHekimligiSekmesiBransi,
  endokrinolojiSekmesiBransi,
  romatolojiSekmesiBransi,
  enfeksiyonSekmesiBransi,
  gastroenterolojiSekmesiBransi,
  nefrolojiSekmesiBransi,
  onkolojiSekmesiBransi,
  gogusCerrahisiSekmesiBransi,
  genelCerrahiSekmesiBransi,
  plastikSekmesiBransi,
  beyinCerrahisiSekmesiBransi,
  cocukCerrahisiSekmesiBransi,
  anesteziSekmesiBransi,
  radyolojiSekmesiBransi,
  kalpDamarCerrahisiSekmesiBransi,
  acilTipSekmesiBransi,
  pediatriAracSekmesiUygun,
  muayeneAltiSekmeler,
  type HastaDosyaSekmeId,
  type MuayeneAltiId,
} from '@/lib/doktor/hastaDosyaSekmeleri';
import { cocukHastaMi, pediatrikBaglamMi, veliDiliMi } from '@/lib/specialties/kapsam';
import DoktorGeriLink from '@/components/doktor/DoktorGeriLink';
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';

export const dynamic = 'force-dynamic';

interface PatientData {
  id: string; ad_soyad: string; dogum_tarihi: string | null; cinsiyet: string | null;
  telefon: string | null; sehir: string | null; kan_grubu: string | null;
  kronik_hastaliklar: string[]; alerjiler: string | null; surekli_ilaclar: string | null;
  sigara_alkol: string | null;
  anne_boy_cm?: number | null;
  baba_boy_cm?: number | null;
}

interface SeansNotu { id?: string; content_tani?: string | null; content_subjektif?: string | null; approved_at?: string | null }
interface Seans { id: string; created_at: string; notes?: SeansNotu[] | SeansNotu | null }

const panel: React.CSSProperties = {
  background: '#0D1C33',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
};

function basHarfler(ad: string): string {
  return ad.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'H';
}

function trTarih(iso: string): string {
  try { return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' }); } catch { return ''; }
}

export default function HastaProfilPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const patientId = params?.id as string;
  // NOTYA-RANDEVU-09: randevu takviminden hedefli linkler ?tab=formu / ?tab=asilar ile atlar.
  const tabParam = searchParams?.get('tab');
  const [activeTab, setActiveTab] = useState<HastaDosyaSekmeId>('ozet');
  const [muayeneAlti, setMuayeneAlti] = useState<MuayeneAltiId>('vizitler');
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seanslar, setSeanslar] = useState<Seans[] | null>(null);
  const [seansYukleniyor, setSeansYukleniyor] = useState(false);
  const [pediatriAraci, setPediatriAraci] = useState(false);
  const [dahiliyeAraci, setDahiliyeAraci] = useState(false); // NOTYA-DAH-01: iç hastalıkları / aile / genel dahiliye
  const [gozAraci, setGozAraci] = useState(false); // GOZ-CHAPTER: göz hastalıkları hekimi
  const [deriAraci, setDeriAraci] = useState(false); // CHART-TAB-POLICY: dermatoloji only
  const [psikAraci, setPsikAraci] = useState(false); // PSIK-EXCEPTIONAL-01: yalnız psikiyatri hekimi
  const [kbbAraci, setKbbAraci] = useState(false); // KBB-EXCEPTIONAL-01: yalnız kulak burun boğaz hekimi
  const [kardioAraci, setKardioAraci] = useState(false); // KARDIO-EXCEPTIONAL-01: yalnız kardiyoloji hekimi
  const [gogusAraci, setGogusAraci] = useState(false); // GOGUS-EXCEPTIONAL-01: yalnız göğüs hastalıkları hekimi
  const [noroAraci, setNoroAraci] = useState(false); // NOROLOJI-EXCEPTIONAL-01: yalnız nöroloji hekimi
  const [uroAraci, setUroAraci] = useState(false); // UROLOJI-EXCEPTIONAL-01: yalnız üroloji hekimi
  const [sporAraci, setSporAraci] = useState(false); // SPOR-HEKIMLIGI-EXCEPTIONAL-01: yalnız spor hekimliği
  const [ortoAraci, setOrtoAraci] = useState(false); // ORTOPEDI-EXCEPTIONAL-01: yalnız ortopedi hekimi
  const [ftrAraci, setFtrAraci] = useState(false); // FIZIK-TEDAVI-EXCEPTIONAL-01: yalnız fizik tedavi hekimi
  const [aileAraci, setAileAraci] = useState(false); // AILE-HEKIMLIGI-EXCEPTIONAL-01: yalnız aile hekimliği
  const [endoAraci, setEndoAraci] = useState(false); // ENDOKRINOLOJI-EXCEPTIONAL-01: yalnız endokrinoloji
  const [romaAraci, setRomaAraci] = useState(false); // ROMATOLOJI-EXCEPTIONAL-01: yalnız romatoloji
  const [enfAraci, setEnfAraci] = useState(false); // ENFEKSIYON-EXCEPTIONAL-01
  const [gastroAraci, setGastroAraci] = useState(false); // GASTROENTEROLOJI-EXCEPTIONAL-01: yalnız gastroenteroloji
  const [nefAraci, setNefAraci] = useState(false); // NEFROLOJI-EXCEPTIONAL-01: yalnız nefroloji
  const [onkoAraci, setOnkoAraci] = useState(false); // ONKOLOJI-EXCEPTIONAL-01: yalnız onkoloji
  const [gogusCerrahiAraci, setGogusCerrahiAraci] = useState(false); // GOGUS-CERRAHISI-EXCEPTIONAL-01
  const [gcAraci, setGcAraci] = useState(false); // GENEL-CERRAHI-EXCEPTIONAL-01: yalnız genel-cerrahi
  const [plastikAraci, setPlastikAraci] = useState(false); // PLASTIK-CERRAHI-EXCEPTIONAL-01: yalnız plastik-cerrahi
  const [beyinAraci, setBeyinAraci] = useState(false); // BEYIN-CERRAHISI-EXCEPTIONAL-01: yalnız beyin-cerrahisi
  const [ccAraci, setCcAraci] = useState(false); // COCUK-CERRAHISI-EXCEPTIONAL-01: yalnız cocuk-cerrahisi
  const [anesteziAraci, setAnesteziAraci] = useState(false); // ANESTEZI-EXCEPTIONAL-01: yalnız anestezi
  const [radyoAraci, setRadyoAraci] = useState(false); // RADYOLOJI-EXCEPTIONAL-01: yalnız radyoloji
  const [kdcAraci, setKdcAraci] = useState(false); // KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01
  const [acilAraci, setAcilAraci] = useState(false); // ACIL-TIP-EXCEPTIONAL-01: yalnız acil-tip
  const [doktorBransi, setDoktorBransi] = useState<string | null>(null);

  const gebelikUygun = patient ? gebelikSekmesiUygun({ cinsiyet: patient.cinsiyet, dogumIso: patient.dogum_tarihi }) : false;
  const pediatriUygun = patient
    ? pediatriAracSekmesiUygun({ dogumIso: patient.dogum_tarihi, doktorBransi, pediatriDoktoru: pediatriAraci })
    : false;
  const dahiliyeUygun = dahiliyeAraci && !pediatriUygun;
  const tabs = hastaDosyaSekmeleri({ pediatriUygun, gebelikUygun, dahiliyeUygun, gozUygun: gozAraci, deriUygun: deriAraci, psikiyatriUygun: psikAraci, kbbUygun: kbbAraci, kardiyolojiUygun: kardioAraci, gogusUygun: gogusAraci, norolojiUygun: noroAraci, urolojiUygun: uroAraci, ortopediUygun: ortoAraci, fizikTedaviUygun: ftrAraci, aileUygun: aileAraci, sporHekimligiUygun: sporAraci, endokrinolojiUygun: endoAraci, enfeksiyonUygun: enfAraci, gastroenterolojiUygun: gastroAraci, nefrolojiUygun: nefAraci, romatolojiUygun: romaAraci, onkolojiUygun: onkoAraci, gogusCerrahisiUygun: gogusCerrahiAraci, genelCerrahiUygun: gcAraci, plastikUygun: plastikAraci, beyinCerrahisiUygun: beyinAraci, cocukCerrahisiUygun: ccAraci, anesteziUygun: anesteziAraci, kalpDamarCerrahisiUygun: kdcAraci, acilTipUygun: acilAraci, radyolojiUygun: radyoAraci });

  /** Keep ?tab= in the URL so Geri from lab/röntgen returns to Belgeler (not Özet).
   *  Kadın Sağlığı & Gebelik lives under Muayene Geçmişi — deep link ?tab=gebelik still works. */
  const secSekme = useCallback((id: HastaDosyaSekmeId) => {
    if (id === 'gebelik') {
      setActiveTab('muayene');
      setMuayeneAlti('gebelik');
      router.replace(hastaDosyaHref(patientId, 'gebelik'), { scroll: false });
      return;
    }
    setActiveTab(id);
    if (id === 'muayene') setMuayeneAlti('vizitler');
    router.replace(hastaDosyaHref(patientId, id), { scroll: false });
  }, [patientId, router]);

  const secMuayeneAlti = useCallback((id: MuayeneAltiId) => {
    setActiveTab('muayene');
    setMuayeneAlti(id);
    router.replace(hastaDosyaHref(patientId, id === 'gebelik' ? 'gebelik' : 'muayene'), { scroll: false });
  }, [patientId, router]);

  useEffect(() => {
    if (!tabParam) {
      setActiveTab('ozet');
      return;
    }
    const bilinen: HastaDosyaSekmeId[] = [
      'ozet', 'muayene', 'buyume', 'belgeler', 'goruntuleme', 'ilaclar', 'formu', 'asilar',
      'mchat', 'gelisim', 'ayse', 'gebelik', 'deri', 'dahiliye', 'bebek', 'goz',
      'psikiyatri', 'kbb', 'kardiyoloji', 'gogus', 'noroloji', 'uroloji', 'spor-hekimligi', 'ortopedi', 'fizik-tedavi', 'aile', 'endokrinoloji', 'enfeksiyon', 'gastroenteroloji', 'nefroloji', 'romatoloji', 'onkoloji', 'genel-cerrahi', 'plastik', 'beyin', 'gogus-cerrahisi', 'cocuk-cerrahisi', 'konsultasyon',
    ];
    if (!bilinen.includes(tabParam as HastaDosyaSekmeId)) return;
    if (tabParam === 'gebelik') {
      setActiveTab('muayene');
      setMuayeneAlti('gebelik');
      return;
    }
    setActiveTab(tabParam as HastaDosyaSekmeId);
    if (tabParam === 'muayene') setMuayeneAlti('vizitler');
  }, [tabParam]);

  useEffect(() => {
    if (!patientId) return;
    (async () => {
      try {
        // NOTYA-AUTH-01: one convention, with refresh.
        const token = await ensureDoctorAccessToken();
        if (!token) { router.push(DOKTOR_GIRIS); return; }
        const [resp, meRes] = await Promise.all([
          fetch(`/api/doktor/hastalar/${patientId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const data = await resp.json();
        if (!resp.ok) { setError(data.error || 'Hasta bilgisi alınamadı'); return; }
        setPatient(data.patient);
        if (meRes.ok) {
          const me = await meRes.json();
          const sp = String(me?.data?.specialty || '');
          setDoktorBransi(sp);
          setPediatriAraci(pediatriHedefBoyBransi(sp));
          setGozAraci(/göz|goz|oftalm/i.test(sp));
          setDeriAraci(/derma|deri ve z/i.test(sp));
          setDahiliyeAraci(dahiliyeSekmesiBransi(sp));
          setPsikAraci(psikiyatriSekmesiBransi(sp));
          setKbbAraci(kbbSekmesiBransi(sp));
          setKardioAraci(kardiyolojiSekmesiBransi(sp));
          setGogusAraci(gogusSekmesiBransi(sp));
          setNoroAraci(norolojiSekmesiBransi(sp));
          setUroAraci(urolojiSekmesiBransi(sp));
          setSporAraci(sporHekimligiSekmesiBransi(sp));
          setOrtoAraci(ortopediSekmesiBransi(sp));
          setFtrAraci(fizikTedaviSekmesiBransi(sp));
          setAileAraci(aileHekimligiSekmesiBransi(sp));
          setEndoAraci(endokrinolojiSekmesiBransi(sp));
          setRomaAraci(romatolojiSekmesiBransi(sp));
          setEnfAraci(enfeksiyonSekmesiBransi(sp));
          setGastroAraci(gastroenterolojiSekmesiBransi(sp));
          setNefAraci(nefrolojiSekmesiBransi(sp));
          setOnkoAraci(onkolojiSekmesiBransi(sp));
          setGogusCerrahiAraci(gogusCerrahisiSekmesiBransi(sp));
          setGcAraci(genelCerrahiSekmesiBransi(sp));
          setPlastikAraci(plastikSekmesiBransi(sp));
          setBeyinAraci(beyinCerrahisiSekmesiBransi(sp));
          setCcAraci(cocukCerrahisiSekmesiBransi(sp));
          setAnesteziAraci(anesteziSekmesiBransi(sp));
          setRadyoAraci(radyolojiSekmesiBransi(sp));
          setKdcAraci(kalpDamarCerrahisiSekmesiBransi(sp));
          setAcilAraci(acilTipSekmesiBransi(sp));
        }
      } catch {
        setError('Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId, router]);

  // Muayene Geçmişi: sekme ilk açıldığında tembel yüklenir
  const seansYukle = useCallback(async () => {
    if (seanslar !== null || seansYukleniyor) return;
    setSeansYukleniyor(true);
    try {
      const token = await ensureDoctorAccessToken();
      const r = await fetch(`/api/doktor/hastalar/${patientId}/sessions`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      const liste = Array.isArray(d.sessions) ? d.sessions : Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
      setSeanslar(liste);
    } catch {
      setSeanslar([]);
    } finally {
      setSeansYukleniyor(false);
    }
  }, [patientId, seanslar, seansYukleniyor]);

  useEffect(() => { if (activeTab === 'muayene') seansYukle(); }, [activeTab, seansYukle]);

  // Doğum tarihi her yerde Gün.Ay.Yıl + yaş; bebeklerde gün hassasiyeti ("8 ay 3 günlük")
  const dogumGoster = (() => {
    if (!patient?.dogum_tarihi) return null;
    const d = new Date(patient.dogum_tarihi);
    if (isNaN(d.getTime())) return patient.dogum_tarihi;
    const yas = yasHesapla(patient.dogum_tarihi);
    return `${d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Istanbul' })}${yas ? ` (${yas})` : ''}`;
  })();

  const kimlikCipleri = patient
    ? [
        patient.cinsiyet,
        dogumGoster,
        patient.telefon,
        patient.sehir,
        patient.kan_grubu ? `Kan: ${patient.kan_grubu}` : null,
      ].filter(Boolean) as string[]
    : [];

  const bilgiSatiri = (etiket: string, deger: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#14B8A6', letterSpacing: '0.03em', minWidth: 132, flexShrink: 0 }}>{etiket}</span>
      <span style={{ fontSize: 15, fontWeight: 600, color: '#F4F7FB', lineHeight: 1.45, minWidth: 0 }}>{deger || '—'}</span>
    </div>
  );

  const cipListesi = (degerler: string[], renk: string, kenar: string) => (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {degerler.map((k, i) => (
        <span key={i} style={{ fontSize: 12.5, fontWeight: 600, color: renk, background: `${kenar}1A`, border: `1px solid ${kenar}55`, borderRadius: 999, padding: '3px 11px' }}>{k}</span>
      ))}
    </span>
  );

  const notCek = (s: Seans): SeansNotu | null => {
    if (!s.notes) return null;
    return Array.isArray(s.notes) ? s.notes[0] || null : s.notes;
  };

  const vaultSpecialtyGeri: 'deri' | 'goz' | 'gebelik' | 'dahiliye' | null = searchParams?.get('dermModality')
    ? 'deri'
    : activeTab === 'deri' || activeTab === 'goz' || activeTab === 'dahiliye'
      ? activeTab
      : (activeTab === 'gebelik' || (activeTab === 'muayene' && muayeneAlti === 'gebelik'))
        ? 'gebelik'
        : null;

  return (
    <div style={{ backgroundColor: '#0A1628', minHeight: '100vh', color: '#EDF1F7', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
      <style>{`
        .dosya-sekmeler::-webkit-scrollbar { display: none; }
        .dosya-satir:hover { background: rgba(255,255,255,0.04); }
      `}</style>
      <DoktorNav />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 20px 40px' }}>

        {/* Kimlik başlığı — ana sayfa karşılama paneliyle aynı dil */}
        <div style={{ ...panel, background: 'linear-gradient(135deg, #10223D 0%, #0C1830 100%)', padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(15,155,142,0.18)', border: '1px solid rgba(15,155,142,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 800, color: '#2DD4BF', flexShrink: 0 }}>
            {loading ? '·' : basHarfler(patient?.ad_soyad || 'H')}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.3 }}>{loading ? 'Hasta Dosyası' : patient?.ad_soyad || 'Hasta Dosyası'}</div>
            {kimlikCipleri.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 7 }}>
                {kimlikCipleri.map((c, i) => (
                  <span key={i} style={{ fontSize: 11.5, color: '#C9D4E3', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '3px 10px' }}>{c}</span>
                ))}
              </div>
            )}
          </div>
          {patient && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => router.push(`/session/new?patientId=${patient.id}`)}
                style={{ padding: '10px 18px', background: '#0F9B8E', color: '#fff', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                🩺 Muayeneyi Başlat
              </button>
              <button
                onClick={() => secSekme('ayse')}
                style={{ padding: '10px 18px', background: 'rgba(255,255,255,0.07)', color: '#C9D4E3', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Ayşe&apos;ye Danış
              </button>
            </div>
          )}
        </div>

        <div style={{ margin: '10px 0 0' }}>
          <DoktorGeriLink href="/dashboard/doktor/hastalar">← Hastalar</DoktorGeriLink>
        </div>

        {/* Hap sekmeler — mobilde yatay kaydırma */}
        <div className="dosya-sekmeler" style={{ display: 'flex', gap: 6, margin: '16px 0 18px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => secSekme(tab.id)}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                background: activeTab === tab.id ? '#0F9B8E' : 'rgba(255,255,255,0.06)',
                border: activeTab === tab.id ? '1px solid #0F9B8E' : '1px solid rgba(255,255,255,0.1)',
                color: activeTab === tab.id ? 'white' : '#C9D4E3',
                fontWeight: activeTab === tab.id ? 700 : 500,
                borderRadius: 999,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background .15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && <div style={{ ...panel, padding: 18, color: '#8FA0B5', fontSize: 14 }}>Dosya yükleniyor…</div>}
        {error && <div style={{ ...panel, padding: 18, color: '#FCA5A5', fontSize: 14, borderColor: 'rgba(239,68,68,0.4)' }}>{error}</div>}

        {!loading && !error && patient && activeTab === 'ozet' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            <div style={{ ...panel, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 20, right: 20, height: 2, borderRadius: 2, background: 'linear-gradient(90deg, #0F9B8E, transparent)' }} />
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Demografik bilgiler</div>
              {bilgiSatiri('Ad Soyad', patient.ad_soyad)}
              {bilgiSatiri('Doğum tarihi', dogumGoster)}
              {bilgiSatiri('Cinsiyet', patient.cinsiyet)}
              {bilgiSatiri('Telefon', patient.telefon)}
              {bilgiSatiri('Şehir', patient.sehir)}
              {bilgiSatiri('Kan grubu', patient.kan_grubu ? cipListesi([patient.kan_grubu], '#FCA5A5', '#EF4444') : null)}
            </div>
            <div style={{ ...panel, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 20, right: 20, height: 2, borderRadius: 2, background: 'linear-gradient(90deg, #F59E0B, transparent)' }} />
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Sağlık geçmişi</div>
              {bilgiSatiri('Kronik hastalıklar', patient.kronik_hastaliklar?.length ? cipListesi(patient.kronik_hastaliklar, '#FDBA74', '#F59E0B') : null)}
              {bilgiSatiri('Alerjiler', patient.alerjiler ? cipListesi(patient.alerjiler.split(',').map((a) => a.trim()).filter(Boolean), '#FCA5A5', '#EF4444') : null)}
              {bilgiSatiri('Sürekli ilaçlar', patient.surekli_ilaclar)}
              {bilgiSatiri('Sigara / Alkol', patient.sigara_alkol)}
            </div>
            {pediatriAraci && pediatriUygun && (() => {
              const hedef = (patient.anne_boy_cm != null && patient.baba_boy_cm != null)
                ? hesaplaHedefBoy({ anneBoy: patient.anne_boy_cm, babaBoy: patient.baba_boy_cm, cinsiyet: patient.cinsiyet })
                : null
              return (
                <div style={{ ...panel, padding: '18px 20px', position: 'relative', overflow: 'hidden', gridColumn: '1 / -1' }}>
                  <div style={{ position: 'absolute', top: 0, left: 20, right: 20, height: 2, borderRadius: 2, background: 'linear-gradient(90deg, #FBBF24, transparent)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Anne-Baba Boylarına Göre Hedef Boy</div>
                    <button
                      type="button"
                      onClick={() => router.push(`/doktor-tools/hedef-boy?patientId=${patient.id}`)}
                      style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.35)', color: '#FDE68A', borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Araçlar › Hedef Boy
                    </button>
                  </div>
                  {hedef && hedef.ok ? (
                    <>
                      {bilgiSatiri('Baba', formatBoyCm(hedef.sonuc.babaCm))}
                      {bilgiSatiri('Anne', formatBoyCm(hedef.sonuc.anneCm))}
                      {bilgiSatiri('Tahmini erişkin boy', formatBoyCm(hedef.sonuc.cocukCm))}
                      <HedefBoyManken sonuc={hedef.sonuc} tema="doktor" style={{ marginTop: 8 }} />
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#8FA0B5' }}>
                        Tanner tahmini (±8,5 cm). Tanı değildir — aileye gösterilen cici bir bakış.
                      </p>
                    </>
                  ) : (
                    <p style={{ margin: '10px 0 0', fontSize: 13.5, color: '#8FA0B5', lineHeight: 1.5 }}>
                      Çekirdek veri; intake zorunlu değil. Anne ve baba boyunu Araçlar’dan girin — sonuç burada ve hasta portalında mankenlerle görünür.
                    </p>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {!loading && !error && activeTab === 'muayene' && (
          <div style={{ ...panel, padding: '10px 20px' }}>
            {gebelikUygun && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 0 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 4 }}>
                {muayeneAltiSekmeler(true).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => secMuayeneAlti(s.id)}
                    style={{
                      flexShrink: 0,
                      padding: '6px 14px',
                      background: muayeneAlti === s.id ? 'rgba(15,155,142,0.25)' : 'transparent',
                      border: muayeneAlti === s.id ? '1px solid #0F9B8E' : '1px solid rgba(255,255,255,0.12)',
                      color: muayeneAlti === s.id ? '#2DD4BF' : '#9FB3C8',
                      fontWeight: muayeneAlti === s.id ? 700 : 500,
                      borderRadius: 999,
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
            {muayeneAlti === 'gebelik' && gebelikUygun ? (
              <div style={{ padding: '8px 0 12px' }}>
                <HastaGebelik patientId={patientId} />
              </div>
            ) : (
              <>
                {seansYukleniyor && <div style={{ padding: '14px 0', color: '#8FA0B5', fontSize: 14 }}>Vizitler yükleniyor…</div>}
                {!seansYukleniyor && seanslar !== null && seanslar.length === 0 && (
                  <div style={{ padding: '18px 0', color: '#8FA0B5', fontSize: 14 }}>Henüz muayene kaydı yok — ilk muayeneyle birlikte burada görünecek.</div>
                )}
                {!seansYukleniyor && (seanslar || []).map((s, idx) => {
                  const n = notCek(s);
                  const onaylandi = Boolean(n?.approved_at);
                  const ozet = String(n?.content_tani || n?.content_subjektif || 'Not bulunamadı').slice(0, 110);
                  return (
                    <div key={s.id} className="dosya-satir" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 6px', borderBottom: idx < (seanslar?.length || 0) - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', borderRadius: 8 }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: onaylandi ? '#22C55E' : '#F59E0B' }} title={onaylandi ? 'Onaylı not' : 'Onay bekliyor'} />
                      <span role={n?.id ? 'button' : undefined} tabIndex={n?.id ? 0 : undefined}
                        onClick={() => { if (n?.id) router.push(`/dashboard/doktor/notlar/${n.id}/yazdir`); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' && n?.id) router.push(`/dashboard/doktor/notlar/${n.id}/yazdir`); }}
                        title={n?.id ? 'Raporu aç — düzenlemek için Yeniden Düzenle' : undefined}
                        style={{ minWidth: 0, flex: 1, cursor: n?.id ? 'pointer' : 'default' }}>
                        <span style={{ display: 'block', fontSize: 12, color: '#5F7189' }}>{trTarih(s.created_at)}</span>
                        <span style={{ display: 'block', fontSize: 13.5, color: '#C9D4E3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ozet}</span>
                      </span>
                      {n?.id && (
                        <button
                          type="button"
                          onClick={() => window.open(`/dashboard/doktor/notlar/${n.id}/yazdir`, '_blank')}
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#C9D4E3', borderRadius: 999, padding: '5px 12px', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}
                        >
                          🖨️ Yazdır / PDF
                        </button>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {!loading && !error && pediatriUygun && activeTab === 'buyume' && (
          <HastaBuyumeEgrileri patientId={patientId} hedefBoyGoster={pediatriAraci} />
        )}
        {!loading && !error && activeTab === 'belgeler' && (
          <PatientDocumentVault patientId={patientId} specialtyGeri={vaultSpecialtyGeri} />
        )}
        {!loading && !error && activeTab === 'konsultasyon' && <HastaKonsultasyonlar patientId={patientId} yanitAc={searchParams?.get('yanit') || undefined} />}
        {!loading && !error && activeTab === 'goruntuleme' && (
          <div style={{ ...panel, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: '#8FA0B5' }}>Röntgen, EKG ve diğer görüntüleme kayıtları görüntüleme merkezinde.</span>
            <button type="button" onClick={() => router.push(`/dashboard/doktor/goruntuleme?hastaId=${patientId}&from=goruntuleme`)} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 999, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Görüntülemeyi aç ›</button>
          </div>
        )}
        {!loading && !error && activeTab === 'ilaclar' && <HastaIlaclar patientId={patientId} />}
        {!loading && !error && activeTab === 'formu' && <HastaIntake patientId={patientId} />}
        {!loading && !error && activeTab === 'asilar' && (
          <HastaAsilar
            patientId={patientId}
            pediatrikBaglam={pediatrikBaglamMi({ doktorBransi, hastaDogumIso: patient?.dogum_tarihi })}
            veliDili={veliDiliMi({ doktorBransi, hastaDogumIso: patient?.dogum_tarihi })}
            cocukHasta={cocukHastaMi(patient?.dogum_tarihi) || (pediatriAraci && !patient?.dogum_tarihi)}
          />
        )}
        {!loading && !error && pediatriUygun && activeTab === 'mchat' && <HastaMchat patientId={patientId} />}
        {!loading && !error && pediatriUygun && activeTab === 'gelisim' && <HastaGelisimTaramasi patientId={patientId} />}
        {!loading && !error && pediatriUygun && activeTab === 'bebek' && <HastaBebekKarti patientId={patientId} />}
        {!loading && !error && activeTab === 'ayse' && <HastaKonsult patientId={patientId} />}
        {/* BRANS-ALAN-SIZMASI: ?tab=dahiliye / ?tab=deri derin bağlantısı bölüm içeriğini branş kapısı olmadan açıyordu */}
        {!loading && !error && activeTab === 'dahiliye' && dahiliyeUygun && <DahiliyeHome patientId={patientId} />}
        {!loading && !error && activeTab === 'goz' && gozAraci && <GozHome patientId={patientId} />}
        {!loading && !error && activeTab === 'psikiyatri' && psikAraci && <PsikiyatriHome patientId={patientId} />}
        {!loading && !error && activeTab === 'kbb' && kbbAraci && <KbbHome patientId={patientId} />}
        {!loading && !error && activeTab === 'kardiyoloji' && kardioAraci && <KardioHome patientId={patientId} />}
        {!loading && !error && activeTab === 'gogus' && gogusAraci && <GogusHome patientId={patientId} />}
        {!loading && !error && activeTab === 'noroloji' && noroAraci && <NorolojiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'uroloji' && uroAraci && <UrolojiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'spor-hekimligi' && sporAraci && <SporHekimligiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'ortopedi' && ortoAraci && <OrtopediHome patientId={patientId} />}
        {!loading && !error && activeTab === 'fizik-tedavi' && ftrAraci && <FtrHome patientId={patientId} />}
        {!loading && !error && activeTab === 'aile' && aileAraci && <AileHome patientId={patientId} />}
        {!loading && !error && activeTab === 'endokrinoloji' && endoAraci && <EndokrinolojiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'romatoloji' && romaAraci && <RomatolojiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'enfeksiyon' && enfAraci && <EnfeksiyonHome patientId={patientId} />}
        {!loading && !error && activeTab === 'gastroenteroloji' && gastroAraci && <GastroenterolojiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'nefroloji' && nefAraci && <NefrolojiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'onkoloji' && onkoAraci && <OnkolojiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'gogus-cerrahisi' && gogusCerrahiAraci && <GogusCerrahiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'genel-cerrahi' && gcAraci && <GenelCerrahiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'plastik' && plastikAraci && <PlastikHome patientId={patientId} />}
        {!loading && !error && activeTab === 'beyin' && beyinAraci && <BeyinCerrahisiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'cocuk-cerrahisi' && ccAraci && <CocukCerrahisiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'anestezi' && anesteziAraci && <AnesteziHome patientId={patientId} />}
        {!loading && !error && activeTab === 'radyo' && radyoAraci && <RadyolojiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'kalp-damar' && kdcAraci && <KalpDamarHome patientId={patientId} />}
        {!loading && !error && activeTab === 'acil' && acilAraci && <AcilTipHome patientId={patientId} />}
        {!loading && !error && activeTab === 'deri' && deriAraci && (
          <HastaDermatoloji patientId={patientId} cinsiyet={patient?.cinsiyet} dogumTarihi={patient?.dogum_tarihi} hastaAdi={patient?.ad_soyad} />
        )}
      </div>
    </div>
  );
}
