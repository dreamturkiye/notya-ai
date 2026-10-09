'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ensureDoctorAccessToken, isOnboardingDone } from '@/lib/doktor/clientAuth';
import { hekimProfilTazeleIsaretle } from '@/lib/doktor/hekimProfilIstemci';
import { CHROME_RENK, CHROME_FONT, CHROME_FONT_HREF } from '@/lib/doktor/chromeTheme';
import SesProfiliKayit from '@/components/sesProfili/SesProfiliKayit';
import KisiselBilgilerAdimi, { type KisiselAlan } from '@/components/onboarding/KisiselBilgilerAdimi';
import { adDogrula } from '@/lib/onboarding/profilDogrula';
import { doktorCepTelefonu } from '@/lib/onboarding/cepTelefonu';
import { KVKK_ONAY_KODU } from '@/lib/onboarding/kvkkOnay';

interface Profession {
  id: string;
  label: string;
  emoji: string;
  desc: string;
}

const professions: Profession[] = [
  { id: 'doktor', label: 'Doktor/Hekim', emoji: '🩺', desc: 'Tıbbi uzmanlık alanınız' },
  { id: 'klinik-uzman', label: 'Klinik Uzman', emoji: '💉', desc: 'Estetik, saç ekimi, dermatoloji' },
  { id: 'saglik-uzmani', label: 'Sağlık Uzmanı', emoji: '🩺', desc: 'Fizyoterapi, psikoloji, diyetisyen' },
  { id: 'mali', label: 'Mali Müşavir/SMMM', emoji: '💰', desc: 'Finansal danışmanlık' },
  { id: 'avukat', label: 'Avukat', emoji: '⚖️', desc: 'Hukuki danışmanlık' },
  { id: 'psikolog', label: 'Psikolog/Terapist', emoji: '🧠', desc: 'Ruh sağlığı uzmanlığı' },
];

const unvanOptions = ['Dr.', 'Uzm.Dr.', 'Doç.Dr.', 'Prof.Dr.'];

// Full 30 medical specialties (+ a few klinik aesthetic extras)
const doctorSpecialties = [
  'Pediatri', 'Kardiyoloji', 'Nöroloji', 'Dahiliye', 'Psikiyatri',
  'Genel Cerrahi', 'Ortopedi', 'Dermatoloji', 'Kulak Burun Boğaz', 'Göz Hastalıkları',
  'Kadın Hastalıkları ve Doğum', 'Üroloji', 'Radyoloji', 'Anestezi', 'Acil Tıp',
  'Fizik Tedavi', 'Enfeksiyon Hastalıkları', 'Endokrinoloji', 'Gastroenteroloji', 'Nefroloji',
  'Romatoloji', 'Onkoloji', 'Göğüs Hastalıkları', 'Göğüs Cerrahisi', 'Plastik Cerrahi',
  'Beyin Cerrahisi', 'Kalp Damar Cerrahisi', 'Çocuk Cerrahisi', 'Aile Hekimliği', 'Spor Hekimliği',
  'Estetik & Plastik Cerrahi', 'Sac Ekimi', 'Medikal Estetik', 'Longevity & Wellness', 'Diğer',
];
const klinikUzmanSpecialties = ['Estetik & Plastik Cerrahi', 'Sac Ekimi', 'Dermatoloji', 'Medikal Estetik', 'Longevity & Wellness'];
const saglikUzmaniSpecialties = ['Fizyoterapi', 'Klinik Psikoloji', 'Diyetisyen', 'Ergoterapi', 'Odyoloji'];
// KURAL — TÜRKÇE: 'Sac Ekimi' kayıtlı değer / eşleme anahtarıdır (klinikSlugCoz, personalar) — değişmez; yalnız ekranda doğru yazılır.
const UZMANLIK_GORUNEN: Record<string, string> = { 'Sac Ekimi': 'Saç Ekimi', 'Noroloji': 'Nöroloji', 'Diger': 'Diğer' };
const uzmanlikGorunen = (s: string) => UZMANLIK_GORUNEN[s] || s;

const maliChips = ['Vergi Danışmanlığı', 'Bağımsız Denetim', 'Muhasebe', 'Mali Hukuk', 'KDV İadesi', 'Transfer Fiyatlandırması'];
const avukatUzmanlik = ['Ceza Hukuku', 'Ticaret Hukuku', 'Aile Hukuku', 'İdare Hukuku', 'İş Hukuku', 'Gayrimenkul Hukuku', 'Fikri Mülkiyet'];

const agentMapping: Record<string, string> = {
  'Pediatri': 'pediatri',
  'Kardiyoloji': 'kardiyoloji',
  'Nöroloji': 'noroloji',
  'Dahiliye': 'dahiliye',
  'Psikiyatri': 'psikiyatri',
  'Genel Cerrahi': 'genel-cerrahi',
  'Ortopedi': 'ortopedi',
  'Dermatoloji': 'dermatoloji',
  'Kulak Burun Boğaz': 'kulak-burun-bogaz',
  'Göz Hastalıkları': 'goz-hastaliklari',
  'Kadın Hastalıkları ve Doğum': 'kadin-hastaliklari-dogum',
  'Üroloji': 'uroloji',
  'Radyoloji': 'radyoloji',
  'Anestezi': 'anestezi',
  'Acil Tıp': 'acil-tip',
  'Fizik Tedavi': 'fizik-tedavi',
  'Enfeksiyon Hastalıkları': 'enfeksiyon-hastaliklari',
  'Endokrinoloji': 'endokrinoloji',
  'Gastroenteroloji': 'gastroenteroloji',
  'Nefroloji': 'nefroloji',
  'Romatoloji': 'romatoloji',
  'Onkoloji': 'onkoloji',
  'Göğüs Hastalıkları': 'gogus-hastaliklari',
  'Göğüs Cerrahisi': 'gogus-cerrahisi',
  'Plastik Cerrahi': 'plastik-cerrahi',
  'Beyin Cerrahisi': 'beyin-cerrahisi',
  'Kalp Damar Cerrahisi': 'kalp-damar-cerrahisi',
  'Çocuk Cerrahisi': 'cocuk-cerrahisi',
  'Aile Hekimliği': 'aile-hekimligi',
  'Spor Hekimliği': 'spor-hekimligi',
  'Genel Pratisyen': 'aile-hekimligi',
  'Estetik & Plastik Cerrahi': 'plastik-cerrahi',
  'Sac Ekimi': 'sac-ekimi',
  'Medikal Estetik': 'medikal-estetik',
  'Longevity & Wellness': 'longevity',
  'Fizyoterapi': 'fizyoterapi',
  'Klinik Psikoloji': 'klinik-psikolog',
  'Diyetisyen': 'diyetisyen',
  'Ergoterapi': 'ergoterapi',
  'Odyoloji': 'odyoloji',
};

export default function OnboardingPage() {
  return (
    <React.Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: CHROME_RENK.cream }} />}>
      <OnboardingInner />
    </React.Suspense>
  );
}

function OnboardingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetProfession = searchParams?.get('p') || '';
  const validPreset = professions.some(p => p.id === presetProfession) ? presetProfession : '';
  const [step, setStep] = useState(validPreset ? 2 : 1);
  const [selectedProfession, setSelectedProfession] = useState<string>(validPreset);
  const [checking, setChecking] = useState(true);
  /** NOTYA-SES-PROFILI-01: optional step 4 for doctors after the account is created; skipping only navigates on. */
  const [sesSonrasiYol, setSesSonrasiYol] = useState<string | null>(null);

  // If already onboarded, never show this screen again (iPhone PWA reopen bug).
  // NOTYA-SEKRETER-01: sekreter bu ekranı hiç görmez — doğrudan Ön büro.
  useEffect(() => {
    ;(async () => {
      const token = await ensureDoctorAccessToken()
      if (!token) {
        setChecking(false)
        return
      }
      try {
        const personelRes = await fetch('/api/personel/me', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
        if (personelRes.ok) {
          const pm = await personelRes.json().catch(() => ({} as { rol?: string }))
          if (pm.rol === 'sekreter') {
            router.replace('/dashboard/doktor')
            return
          }
        }
      } catch { /* doktor onboarding */ }
      try {
        const res = await fetch('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.status === 401) {
          setChecking(false)
          return
        }
        const json = await res.json().catch(() => ({}))
        const profile = (json as { data?: { profession_type?: string; onboarding_completed?: boolean; specialty?: string } }).data
        if (isOnboardingDone(profile)) {
          const type = profile?.profession_type || validPreset || 'doktor'
          if (type === 'mali' || type === 'mali_musavirlik') router.replace('/dashboard/mali')
          else if (type === 'avukat') router.replace('/dashboard/avukat')
          else if (type === 'klinik-uzman' || type === 'saglik-uzmani') router.replace('/dashboard/klinik')
          else router.replace('/dashboard/doktor')
          return
        }
      } catch {
        /* continue onboarding */
      }
      // NOTYA-ONBOARDING-01: giriş e-postası (salt okunur gösterilir) ve KVKK kutusu gerekli mi — kararı sunucu verir.
      try {
        const hesapRes = await fetch('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
        if (hesapRes.ok) {
          const hesap = (await hesapRes.json().catch(() => ({}))) as { data?: { email?: string; kvkk_onay_gerekli?: boolean } }
          setEposta(String(hesap.data?.email || ''))
          setKvkkGerekli(hesap.data?.kvkk_onay_gerekli === true)
        }
      } catch {
        /* kutu gizli kalır; sunucu rıza isterse gönderimde görünür olur */
      }
      setChecking(false)
    })()
  }, [router, validPreset])
  
  // Doctor fields
  const [unvan, setUnvan] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [hospital, setHospital] = useState('');
  
  // Mali fields
  const [selectedMaliChips, setSelectedMaliChips] = useState<string[]>([]);
  
  // Avukat fields
  const [baro, setBaro] = useState('');
  const [avukatUzmanlikSec, setAvukatUzmanlikSec] = useState('');

  // Klinik Uzman / Saglik Uzmani fields
  const [uzmanlikSecimi, setUzmanlikSecimi] = useState('');
  
  // Step 3 fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [addressingPreference, setAddressingPreference] = useState('');
  // NOTYA-ONBOARDING-01: cep telefonu, giriş e-postası, KVKK (yalnız kayıtlı rızası olmayan hesapta).
  const [cepTelefonu, setCepTelefonu] = useState('');
  const [eposta, setEposta] = useState('');
  const [kvkkGerekli, setKvkkGerekli] = useState(false);
  const [kvkkOnay, setKvkkOnay] = useState(false);
  const [dokunulan, setDokunulan] = useState<Partial<Record<KisiselAlan, boolean>>>({});
  const [genelHata, setGenelHata] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const isStep1Complete = !!selectedProfession;
  
  const canProceedToStep3 = () => {
    if (selectedProfession === 'doktor') {
      return !!unvan && !!specialty;
    }
    if (selectedProfession === 'mali') {
      return selectedMaliChips.length > 0;
    }
    if (selectedProfession === 'avukat') {
      return !!baro && !!avukatUzmanlikSec;
    }
    if (selectedProfession === 'klinik-uzman' || selectedProfession === 'saglik-uzmani') {
      return !!uzmanlikSecimi;
    }
    return true; // psikolog
  };

  // Aynı kurallar sunucuda da uygulanır (app/api/users/profile/route.ts) — buradaki denetim yalnız kolaylıktır.
  const adSonuc = adDogrula(firstName, 'ad');
  const soyadSonuc = adDogrula(lastName, 'soyad');
  const cepSonuc = doktorCepTelefonu(cepTelefonu);
  const canSubmit = adSonuc.ok && soyadSonuc.ok && cepSonuc.ok && !!gender && !!addressingPreference && (!kvkkGerekli || kvkkOnay) && !gonderiliyor;
  const alanHatalari: Partial<Record<KisiselAlan, string>> = {
    ...(dokunulan.firstName && !adSonuc.ok ? { firstName: adSonuc.hata } : {}),
    ...(dokunulan.lastName && !soyadSonuc.ok ? { lastName: soyadSonuc.hata } : {}),
    ...(dokunulan.cepTelefonu && !cepSonuc.ok ? { cepTelefonu: cepSonuc.hata } : {}),
  };
  const kisiselDegis = (alan: KisiselAlan, deger: string) => {
    setGenelHata('');
    if (alan === 'firstName') setFirstName(deger);
    else if (alan === 'lastName') setLastName(deger);
    else if (alan === 'cepTelefonu') setCepTelefonu(deger);
    else if (alan === 'gender') setGender(deger);
    else setAddressingPreference(deger);
  };

  const toggleMaliChip = (chip: string) => {
    setSelectedMaliChips(prev =>
      prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]
    );
  };

  const handleNext = () => {
    if (step === 1 && isStep1Complete) {
      setStep(2);
    } else if (step === 2 && canProceedToStep3()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const getRedirectPath = (profession: string) => {
    if (profession === 'doktor') return '/dashboard/doktor';
    if (profession === 'mali') return '/dashboard/mali';
    if (profession === 'avukat') return '/dashboard/avukat';
    if (profession === 'klinik-uzman') return '/dashboard/klinik';
    if (profession === 'saglik-uzmani') return '/dashboard/klinik';
    return '/dashboard';
  };

  const handleSubmit = async () => {
    if (!canSubmit || !adSonuc.ok || !soyadSonuc.ok || !cepSonuc.ok) return;
    setGenelHata('');

    // NOTYA-AUTH-01: belirteç tek yerden okunur; süresi dolduysa yenilenir (form doldurmak zaman alır).
    const access_token = await ensureDoctorAccessToken();
    if (!access_token) {
      alert('Oturum bulunamadı. Lütfen yeniden giriş yapın.');
      return;
    }

    const profession_type = selectedProfession;
    let finalSpecialty = specialty;
    
    if (profession_type === 'mali') {
      finalSpecialty = selectedMaliChips.join(', ');
    } else if (profession_type === 'avukat') {
      finalSpecialty = avukatUzmanlikSec;
    } else if (profession_type === 'psikolog') {
      finalSpecialty = 'Psikoloji';
    } else if (profession_type === 'klinik-uzman' || profession_type === 'saglik-uzmani') {
      const klinikMap: Record<string, string> = {
        'Estetik & Plastik Cerrahi': 'estetik-cerrahi',
        'Sac Ekimi': 'sac-ekimi',
        Dermatoloji: 'klinik-dermatoloji',
        'Medikal Estetik': 'medikal-estetik',
        'Longevity & Wellness': 'longevity',
        Fizyoterapi: 'fizyoterapi',
        'Klinik Psikoloji': 'klinik-psikolog',
        Diyetisyen: 'diyetisyen',
        Ergoterapi: 'ergoterapi',
        Odyoloji: 'odyoloji',
      }
      finalSpecialty = klinikMap[uzmanlikSecimi] || uzmanlikSecimi
    }

    const agent = agentMapping[specialty] || agentMapping[uzmanlikSecimi] || 'default';

    const profilePayload = {
      profession_type,
      specialty: finalSpecialty,
      title: unvan || '',
      hospital: hospital || '',
      firstName: adSonuc.deger,
      lastName: soyadSonuc.deger,
      cepTelefonu: cepSonuc.deger,
      gender,
      addressingPreference,
      // Yalnız kutu gösterildiyse ve hekim işaretlediyse gider; gerekip gerekmediğine sunucu karar verir.
      ...(kvkkGerekli && kvkkOnay ? { kvkk_onay: true } : {}),
      trial_start: new Date().toISOString(),
      plan: 'professional',
      metadata: { agent },
    };

    setGonderiliyor(true);
    try {
      // POST profile
      const profileRes = await fetch('/api/users/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify(profilePayload),
      });
      if (!profileRes.ok) {
        const errBody = (await profileRes.json().catch(() => ({}))) as { error?: string; alan?: string; kod?: string };
        if (profileRes.status === 400 && errBody.error) {
          // Sunucunun doğrulama yanıtı: Türkçe iletiyi olduğu gibi göster; rıza isteniyorsa kutuyu görünür kıl.
          if (errBody.kod === KVKK_ONAY_KODU) setKvkkGerekli(true);
          setGenelHata(errBody.error);
          setGonderiliyor(false);
          return;
        }
        throw new Error(String(errBody.error || 'Profil kaydedilemedi'));
      }
      const profilYanit = (await profileRes.json().catch(() => ({}))) as { telefon_kaydedildi?: boolean };
      if (profilYanit.telefon_kaydedildi === false) console.warn('[onboarding] cep telefonu kaydedilemedi; diğer bilgiler kaydedildi');
      hekimProfilTazeleIsaretle()

      // Activate trial
      await fetch('/api/users/trial', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      const redirectPath = getRedirectPath(profession_type);
      if (profession_type === 'doktor') {
        setSesSonrasiYol(redirectPath);
        setStep(4);
        return;
      }
      router.push(redirectPath);
    } catch (error) {
      console.error(error);
      setGonderiliyor(false);
      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const renderStep2 = () => {
    if (selectedProfession === 'doktor') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ color: CHROME_RENK.muted, fontSize: '14px', marginBottom: '8px', display: 'block' }}>Unvan</label>
            <select
              value={unvan}
              onChange={(e) => setUnvan(e.target.value)}
              style={{ width: '100%', backgroundColor: CHROME_RENK.paper, color: CHROME_RENK.ink, border: '1px solid ' + CHROME_RENK.border, borderRadius: '8px', padding: '12px', fontSize: '15px' }}
            >
              <option value="">Seçiniz</option>
              {unvanOptions.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div>
            <label style={{ color: CHROME_RENK.muted, fontSize: '14px', marginBottom: '8px', display: 'block' }}>Uzmanlık Alanı</label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              style={{ width: '100%', backgroundColor: CHROME_RENK.paper, color: CHROME_RENK.ink, border: '1px solid ' + CHROME_RENK.border, borderRadius: '8px', padding: '12px', fontSize: '15px' }}
            >
              <option value="">Seçiniz</option>
              {doctorSpecialties.map(s => <option key={s} value={s}>{uzmanlikGorunen(s)}</option>)}
            </select>
          </div>

          <div>
            <label style={{ color: CHROME_RENK.muted, fontSize: '14px', marginBottom: '8px', display: 'block' }}>Klinik / Hastane Adı</label>
            <input
              type="text"
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              placeholder="Klinik veya hastane adını girin"
              style={{ width: '100%', backgroundColor: CHROME_RENK.paper, color: CHROME_RENK.ink, border: '1px solid ' + CHROME_RENK.border, borderRadius: '8px', padding: '12px', fontSize: '15px' }}
            />
          </div>
        </div>
      );
    }

    if (selectedProfession === 'mali') {
      return (
        <div>
          <label style={{ color: CHROME_RENK.muted, fontSize: '14px', marginBottom: '12px', display: 'block' }}>Uzmanlık Alanlarınız</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {maliChips.map(chip => (
              <div
                key={chip}
                onClick={() => toggleMaliChip(chip)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '9999px',
                  backgroundColor: selectedMaliChips.includes(chip) ? 'rgba(47,67,52,0.12)' : CHROME_RENK.paper,
                  border: selectedMaliChips.includes(chip) ? '1px solid ' + CHROME_RENK.pine : '1px solid ' + CHROME_RENK.border,
                  color: CHROME_RENK.ink,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {chip}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (selectedProfession === 'avukat') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ color: CHROME_RENK.muted, fontSize: '14px', marginBottom: '8px', display: 'block' }}>Baro</label>
            <input
              type="text"
              value={baro}
              onChange={(e) => setBaro(e.target.value)}
              placeholder="Baro adını girin"
              style={{ width: '100%', backgroundColor: CHROME_RENK.paper, color: CHROME_RENK.ink, border: '1px solid ' + CHROME_RENK.border, borderRadius: '8px', padding: '12px', fontSize: '15px' }}
            />
          </div>
          <div>
            <label style={{ color: CHROME_RENK.muted, fontSize: '14px', marginBottom: '8px', display: 'block' }}>Uzmanlık Alanı</label>
            <select
              value={avukatUzmanlikSec}
              onChange={(e) => setAvukatUzmanlikSec(e.target.value)}
              style={{ width: '100%', backgroundColor: CHROME_RENK.paper, color: CHROME_RENK.ink, border: '1px solid ' + CHROME_RENK.border, borderRadius: '8px', padding: '12px', fontSize: '15px' }}
            >
              <option value="">Seçiniz</option>
              {avukatUzmanlik.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
      );
    }

    if (selectedProfession === 'klinik-uzman') {
      return (
        <div>
          <label style={{ color: CHROME_RENK.muted, fontSize: '14px', marginBottom: '8px', display: 'block' }}>Uzmanlık Alanınız</label>
          <select
            value={uzmanlikSecimi}
            onChange={(e) => setUzmanlikSecimi(e.target.value)}
            style={{ width: '100%', backgroundColor: CHROME_RENK.paper, color: CHROME_RENK.ink, border: '1px solid ' + CHROME_RENK.border, borderRadius: '8px', padding: '12px', fontSize: '15px' }}
          >
            <option value="">Seçiniz</option>
            {klinikUzmanSpecialties.map(s => <option key={s} value={s}>{uzmanlikGorunen(s)}</option>)}
          </select>
        </div>
      );
    }

    if (selectedProfession === 'saglik-uzmani') {
      return (
        <div>
          <label style={{ color: CHROME_RENK.muted, fontSize: '14px', marginBottom: '8px', display: 'block' }}>Uzmanlık Alanınız</label>
          <select
            value={uzmanlikSecimi}
            onChange={(e) => setUzmanlikSecimi(e.target.value)}
            style={{ width: '100%', backgroundColor: CHROME_RENK.paper, color: CHROME_RENK.ink, border: '1px solid ' + CHROME_RENK.border, borderRadius: '8px', padding: '12px', fontSize: '15px' }}
          >
            <option value="">Seçiniz</option>
            {saglikUzmaniSpecialties.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      );
    }

    return <div style={{ color: CHROME_RENK.muted }}>Kişisel bilgilerinize geçebilirsiniz.</div>;
  };

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: CHROME_RENK.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CHROME_RENK.muted }}>
        Yükleniyor…
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: CHROME_RENK.cream, fontFamily: CHROME_FONT.sans, color: CHROME_RENK.ink, padding: 'calc(24px + env(safe-area-inset-top, 0px)) 16px calc(24px + env(safe-area-inset-bottom, 0px))', boxSizing: 'border-box' }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', color: CHROME_RENK.pine, marginBottom: '8px' }}>KAYIT</div>
              <div style={{ fontSize: '28px', fontWeight: 600 }}>
                {step === 1 && 'Hangi alanda çalışıyorsunuz?'}
                {step === 2 && (selectedProfession === 'doktor' ? 'Uzmanlık alanı ve klinik bilgileriniz' : 'Uzmanlık bilgileriniz')}
                {step === 3 && 'Hesabınızı tamamlayın'}
                {step === 4 && 'Ayşe sesinizi tanısın'}
              </div>
            </div>
            {step < 4 && (
              <div style={{ fontSize: '12px', color: CHROME_RENK.muted, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => router.push('/giris')}>
                Giriş sayfasına dön
              </div>
            )}
          </div>
        </div>

        {step === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {professions.map((prof) => {
              const isSelected = selectedProfession === prof.id;
              return (
                <div
                  key={prof.id}
                  onClick={() => setSelectedProfession(prof.id)}
                  style={{
                    backgroundColor: CHROME_RENK.paper,
                    border: isSelected ? '2px solid ' + CHROME_RENK.pine : '1px solid ' + CHROME_RENK.border,
                    borderLeft: isSelected ? '4px solid ' + CHROME_RENK.pine : '4px solid ' + CHROME_RENK.border,
                    borderRadius: '12px',
                    padding: '24px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '16px' }}>{prof.emoji}</div>
                  <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '6px' }}>{prof.label}</div>
                  <div style={{ fontSize: '14px', color: CHROME_RENK.muted }}>{prof.desc}</div>
                </div>
              );
            })}
          </div>
        )}

        {step === 2 && renderStep2()}

        {step === 3 && (
          <KisiselBilgilerAdimi
            firstName={firstName}
            lastName={lastName}
            cepTelefonu={cepTelefonu}
            gender={gender}
            addressingPreference={addressingPreference}
            eposta={eposta}
            kvkkGerekli={kvkkGerekli}
            kvkkOnay={kvkkOnay}
            hatalar={alanHatalari}
            genelHata={genelHata}
            onDegis={kisiselDegis}
            onBirak={(alan) => setDokunulan(prev => ({ ...prev, [alan]: true }))}
            onKvkk={(isaretli) => { setGenelHata(''); setKvkkOnay(isaretli); }}
          />
        )}

        {step === 4 && (
          <SesProfiliKayit
            baslik={false}
            onSimdiDegil={() => router.push(sesSonrasiYol || '/dashboard/doktor')}
            onBitti={() => router.push(sesSonrasiYol || '/dashboard/doktor')}
          />
        )}

        <div style={{ marginTop: '40px', display: step === 4 ? 'none' : 'flex', gap: '12px' }}>
          {step > 1 && step < 4 && (
            <button onClick={handleBack} style={{ flex: 1, padding: '14px', backgroundColor: 'rgba(47,67,52,0.10)', color: CHROME_RENK.ink, border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 500, cursor: 'pointer' }}>
              Geri
            </button>
          )}
          
          {step < 3 && (
            <button
              onClick={handleNext}
              disabled={step === 1 ? !isStep1Complete : !canProceedToStep3()}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: (step === 1 ? isStep1Complete : canProceedToStep3()) ? CHROME_RENK.pine : 'rgba(47,67,52,0.35)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: (step === 1 ? isStep1Complete : canProceedToStep3()) ? 'pointer' : 'not-allowed',
              }}
            >
              Devam Et
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: canSubmit ? CHROME_RENK.pine : 'rgba(47,67,52,0.35)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >
              Deneme Süresini Başlat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
