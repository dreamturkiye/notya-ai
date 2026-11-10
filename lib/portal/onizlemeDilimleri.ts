/**
 * TR-PARITE-01 — ÜRETİLMİŞ DOSYA (scripts yok; üretim betiği iş günlüğünde). Canlı portal API'sinin
 * (app/api/portal/hasta/[token]/route.ts) aynı branş bloklarının ÖRNEK VERİYLE çalışan kopyası: aynı motor fonksiyonları,
 * aynı dilim şekli — veritabanı okuması yerine örnek görev kodları ve örnek kontrol tarihi. Önizleme sayfası
 * (lib/portal/onizleme.ts) kullanır; hasta yok, istek yok, yazma yok.
 * Canlı rotada bir bloğun dilim şekli değişirse lib/portal/onizleme.test.ts dilim anahtarlarını karşılaştırır.
 */
import type { PortalBundle } from '@/lib/portal/types'
import type { PortalModulId } from '@/lib/specialties/profile'
import { derimHatirlatmalari, seansAraligi, sonrakiKontrol } from '@/specialties/dermatoloji/engines/portal-derim'
import {
  hedefOzetleri,
  sonrakiKontrol as dahiliyeSonrakiKontrol,
  takibimHatirlatmalari,
} from '@/specialties/dahiliye/engines/portal-takibim'
import {
  ilacHatirlatmalari,
  olcekHatirlatmalari,
  ruhSagligimHatirlatmalari,
  sonrakiKontrol as psikSonrakiKontrol,
  RUH_SAGLIGIM_NOTU,
} from '@/specialties/psikiyatri/engines/portal-ruhsagligim'
import {
  kulaklarimHatirlatmalari,
  testHatirlatmalari,
  islemHatirlatmalari,
  sonrakiKontrol as kulakSonrakiKontrol,
  KULAKLARIM_NOTU,
  KULAK_BAKIM_IPUCLARI,
} from '@/specialties/kulak-burun-bogaz/engines/portal-kulaklarim'
import {
  urolojimHatirlatmalari,
  testHatirlatmalari as uroTestHatirlatmalari,
  islemHatirlatmalari as uroIslemHatirlatmalari,
  sonrakiKontrol as uroSonrakiKontrol,
  UROLOJIM_NOTU,
  URO_BAKIM_IPUCLARI,
} from '@/specialties/uroloji/engines/portal-urolojim'
import {
  sporumHatirlatmalari,
  planHatirlatmalari as sporPlanHatirlatmalari,
  sonrakiKontrol as sporSonrakiKontrol,
  rtpHastaOzeti,
  SPORUM_NOTU,
  SPOR_BAKIM_IPUCLARI,
} from '@/specialties/spor-hekimligi/engines/portal-sporum'
import {
  eklemlerimHatirlatmalari,
  izlemHatirlatmalari as ortoIzlemHatirlatmalari,
  islemHatirlatmalari as ortoIslemHatirlatmalari,
  sonrakiKontrol as eklemSonrakiKontrol,
  EKLEMLERIM_NOTU,
  ORTO_BAKIM_IPUCLARI,
} from '@/specialties/ortopedi/engines/portal-eklemlerim'
import {
  kalbimHatirlatmalari,
  olcumHatirlatmalari,
  sonrakiKontrol as kalpSonrakiKontrol,
  KALBIM_NOTU,
  KALP_BAKIM_IPUCLARI,
} from '@/specialties/kardiyoloji/engines/portal-kalbim'
import {
  norolojimHatirlatmalari,
  formHatirlatmalari as noroFormHatirlatmalari,
  ilacHatirlatmalari as noroIlacHatirlatmalari,
  sonrakiKontrol as noroSonrakiKontrol,
  NOROLOJIM_NOTU,
  NORO_IPUCLARI,
} from '@/specialties/noroloji/engines/portal-norolojim'
import {
  hormonlarimHatirlatmalari,
  labHatirlatmalari as endoLabHatirlatmalari,
  dxaHatirlatmalari as endoDxaHatirlatmalari,
  rejimHatirlatmalari as endoRejimHatirlatmalari,
  sonrakiKontrol as endoSonrakiKontrol,
  HORMONLARIM_NOTU,
  ENDO_IPUCLARI,
} from '@/specialties/endokrinoloji/engines/portal-hormonlarim'
import {
  romatizmamHatirlatmalari,
  sonrakiKontrol as romaSonrakiKontrol,
  labHatirlatmalari as romaLabHatirlatmalari,
  skorHatirlatmalari as romaSkorHatirlatmalari,
  belgeHatirlatmalari as romaBelgeHatirlatmalari,
  ROMATIZMAM_NOTU,
  ROMA_IPUCLARI,
} from '@/specialties/romatoloji/engines/portal-romatizmam'
import {
  enfeksiyonTakibimHatirlatmalari,
  viralHatirlatmalari as enfViralHatirlatmalari,
  atbHatirlatmalari as enfAtbHatirlatmalari,
  izolasyonHatirlatmalari as enfIzolasyonHatirlatmalari,
  sonrakiKontrol as enfSonrakiKontrol,
  ENFEKSIYON_TAKIBIM_NOTU,
  ENF_IPUCLARI,
} from '@/specialties/enfeksiyon-hastaliklari/engines/portal-enfeksiyon-takibim'
import {
  sindirimimHatirlatmalari,
  skorHatirlatmalari as gastroSkorHatirlatmalari,
  hepatitHatirlatmalari as gastroHepatitHatirlatmalari,
  endoskopiHatirlatmalari as gastroEndoskopiHatirlatmalari,
  rejimHatirlatmalari as gastroRejimHatirlatmalari,
  sonrakiKontrol as gastroSonrakiKontrol,
  SINDIRIMIM_NOTU,
  GASTRO_IPUCLARI,
} from '@/specialties/gastroenteroloji/engines/portal-sindirimim'
import {
  bobreklerimHatirlatmalari,
  labHatirlatmalari as nefLabHatirlatmalari,
  anemiHatirlatmalari as nefAnemiHatirlatmalari,
  diyalizHatirlatmalari as nefDiyalizHatirlatmalari,
  sonrakiKontrol as nefSonrakiKontrol,
  BOBREKLERIM_NOTU,
  NEF_IPUCLARI,
} from '@/specialties/nefroloji/engines/portal-bobreklerim'
import {
  tedavimHatirlatmalari,
  kurHatirlatmalari as onkoKurHatirlatmalari,
  labHatirlatmalari as onkoLabHatirlatmalari,
  yanEtkiHatirlatmalari as onkoYanEtkiHatirlatmalari,
  sonrakiKontrol as onkoSonrakiKontrol,
  TEDAVIM_NOTU,
  ONKO_IPUCLARI,
} from '@/specialties/onkoloji/engines/portal-tedavim'
import {
  ameliyatimHatirlatmalari,
  ameliyatHatirlatmalari as gcAmeliyatHatirlatmalari,
  yaraHatirlatmalari as gcYaraHatirlatmalari,
  raporHatirlatmalari as gcRaporHatirlatmalari,
  sonrakiKontrol as gcSonrakiKontrol,
  AMELIYATIM_NOTU,
  GC_IPUCLARI,
} from '@/specialties/genel-cerrahi/engines/portal-ameliyatim'
import {
  yaramHatirlatmalari,
  pansumanHatirlatmalari as plastikPansumanHatirlatmalari,
  fotoHatirlatmalari as plastikFotoHatirlatmalari,
  dikisHatirlatmalari as plastikDikisHatirlatmalari,
  sonrakiKontrol as plastikSonrakiKontrol,
  YARAM_NOTU,
  PLASTIK_IPUCLARI,
} from '@/specialties/plastik-cerrahi/engines/portal-yaram'
import {
  takibimHatirlatmalari as gogusCerrahiTakibimHatirlatmalari,
  tupYaraHatirlatmalari as gogusCerrahiTupHatirlatmalari,
  patolojiHatirlatmalari as gogusCerrahiPatolojiHatirlatmalari,
  preopHatirlatmalari as gogusCerrahiPreopHatirlatmalari,
  sonrakiKontrol as gogusCerrahiSonrakiKontrol,
  TAKIBIM_NOTU as GOGUS_CERRAHI_TAKIBIM_NOTU,
  GC_IPUCLARI as GOGUS_CERRAHI_IPUCLARI,
} from '@/specialties/gogus-cerrahisi/engines/portal-takibim'
import {
  beyinTakipHatirlatmalari,
  postopHatirlatmalari as beyinPostopHatirlatmalari,
  goruntuHatirlatmalari as beyinGoruntuHatirlatmalari,
  izlemHatirlatmalari as beyinIzlemHatirlatmalari,
  sonrakiKontrol as beyinSonrakiKontrol,
  BEYIN_TAKIP_NOTU,
  BEYIN_IPUCLARI,
} from '@/specialties/beyin-cerrahisi/engines/portal-beyin-takibi'
import {
  anesteziOncesiHatirlatmalari,
  preopHatirlatmalari as anesteziPreopHatirlatmalari,
  havaYoluHatirlatmalari as anesteziHavaYoluHatirlatmalari,
  agriHatirlatmalari as anesteziAgriHatirlatmalari,
  sonrakiKontrol as anesteziSonrakiKontrol,
  ANESTEZI_ONCESI_NOTU,
  ANESTEZI_IPUCLARI,
} from '@/specialties/anestezi/engines/portal-anestezi-oncesi'
import {
  cocugumunCerrahisiHatirlatmalari,
  yaraHatirlatmalari as ccYaraHatirlatmalari,
  islemHatirlatmalari as ccIslemHatirlatmalari,
  sonrakiKontrol as ccSonrakiKontrol,
  COCUGUMUN_CERRAHISI_NOTU,
  CC_BAKIM_IPUCLARI,
} from '@/specialties/cocuk-cerrahisi/engines/portal-cocugumun-cerrahisi'
import {
  acilSonrasiHatirlatmalari,
  taburcuHatirlatmalari as acilTaburcuHatirlatmalari,
  takipHatirlatmalari as acilTakipHatirlatmalari,
  sevkHatirlatmalari as acilSevkHatirlatmalari,
  sonrakiKontrol as acilSonrasiSonrakiKontrol,
  ACIL_SONRASI_NOTU,
  ACIL_SONRASI_IPUCLARI,
} from '@/specialties/acil-tip/engines/portal-acil-sonrasi'
import {
  damarHatirlatmalari,
  greftYaraHatirlatmalari as kdcGreftHatirlatmalari,
  antikoagHatirlatmalari as kdcAntikoagHatirlatmalari,
  preopHatirlatmalari as kdcPreopHatirlatmalari,
  sonrakiKontrol as kdcSonrakiKontrol,
  DAMAR_TAKIP_NOTU,
  KDC_IPUCLARI,
} from '@/specialties/kalp-damar-cerrahisi/engines/portal-damar'
import {
  tetkiklerimHatirlatmalari,
  tetkikHatirlatmalari as radyoTetkikHatirlatmalari,
  raporHatirlatmalari as radyoRaporHatirlatmalari,
  belgeHatirlatmalari as radyoBelgeHatirlatmalari,
  sonrakiKontrol as radyoSonrakiKontrol,
  TETKIKLERIM_NOTU,
  TETKIKLERIM_IPUCLARI,
} from '@/specialties/radyoloji/engines/portal-tetkiklerim'
import {
  akcigerlerimHatirlatmalari,
  testHatirlatmalari as gogusTestHatirlatmalari,
  bakimHatirlatmalari,
  sonrakiKontrol as akcigerSonrakiKontrol,
  AKCIGERLERIM_NOTU,
  AKCIGER_BAKIM_IPUCLARI,
} from '@/specialties/gogus-hastaliklari/engines/portal-akcigerlerim'
import {
  ftrmHatirlatmalari,
  seansHatirlatmalari as ftrSeansHatirlatmalari,
  egzersizHatirlatmalari as ftrEgzersizHatirlatmalari,
  sonrakiKontrol as ftrSonrakiKontrol,
  FTRM_NOTU,
  FTR_IPUCLARI,
} from '@/specialties/fizik-tedavi/engines/portal-ftrm'
import {
  saglikPaketimHatirlatmalari,
  asiTaramaHatirlatmalari as aileAsiHatirlatmalari,
  kronikHatirlatmalari as aileKronikHatirlatmalari,
  sonrakiKontrol as aileSonrakiKontrol,
  SAGLIK_PAKETIM_NOTU,
  AILE_IPUCLARI,
} from '@/specialties/aile-hekimligi/engines/portal-saglik-paketim'

export type OrnekGorev = { kod: string; due: string | null }

const gunEkle = (iso: string, gun: number): string => new Date(Date.parse(iso + 'T12:00:00Z') + gun * 86400000).toISOString().slice(0, 10)
const ORNEK_KUYRUK = (bugun: string) => [
  { tarih: gunEkle(bugun, -10), modalite: 'us', durum: 'rapor_hazir' },
  { tarih: gunEkle(bugun, 5), modalite: 'mri', durum: 'bekliyor' },
]

/** Canlı rotanın görev kodlu branş dilimlerini örnek görevlerle doldurur. Saf (bugün dışarıdan). */
export function onizlemeGorevDilimleri(bundle: PortalBundle, aktif: ReadonlySet<PortalModulId>, bugun: string, gorevler: Partial<Record<string, readonly OrnekGorev[]>>): void {
  const kontrol = gunEkle(bugun, 21)
  if (aktif.has('psikiyatri')) try {
    const gorevQ = { data: gorevler['psikiyatri'] || [] }
    const bolumQ = { data: { next_kontrol: kontrol, kuyruk: null } }
    const hatirlatmalar = ruhSagligimHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      sonrakiKontrolIso: bolumQ.data?.next_kontrol ? String(bolumQ.data.next_kontrol).slice(0, 10) : null,
    })
    bundle.psik = {
      sonrakiKontrol: psikSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      olcekHatirlatma: olcekHatirlatmalari(hatirlatmalar),
      ilacHatirlatma: ilacHatirlatmalari(hatirlatmalar),
      not: RUH_SAGLIGIM_NOTU,
    }
  } catch (e) { console.error('[portal] ruhsagligim:', e) }

  if (aktif.has('kulaklarim')) try {
    const gorevQ = { data: gorevler['kulaklarim'] || [] }
    const bolumQ = { data: { next_kontrol: kontrol, kuyruk: null } }
    const hatirlatmalar = kulaklarimHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      sonrakiKontrolIso: bolumQ.data?.next_kontrol ? String(bolumQ.data.next_kontrol).slice(0, 10) : null,
    })
    bundle.kulak = {
      sonrakiKontrol: kulakSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      testHatirlatma: testHatirlatmalari(hatirlatmalar),
      islemHatirlatma: islemHatirlatmalari(hatirlatmalar),
      bakimIpuclari: [...KULAK_BAKIM_IPUCLARI],
      not: KULAKLARIM_NOTU,
    }
  } catch (e) { console.error('[portal] kulaklarim:', e) }

  if (aktif.has('kalbim')) try {
    const gorevQ = { data: gorevler['kalbim'] || [] }
    const bolumQ = { data: { next_kontrol: kontrol, kuyruk: null } }
    const hatirlatmalar = kalbimHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      sonrakiKontrolIso: bolumQ.data?.next_kontrol ? String(bolumQ.data.next_kontrol).slice(0, 10) : null,
    })
    bundle.kalp = {
      sonrakiKontrol: kalpSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      olcumHatirlatma: olcumHatirlatmalari(hatirlatmalar),
      bakimIpuclari: [...KALP_BAKIM_IPUCLARI],
      not: KALBIM_NOTU,
    }
  } catch (e) { console.error('[portal] kalbim:', e) }

  if (aktif.has('norolojim')) try {
    const gorevQ = { data: gorevler['norolojim'] || [] }
    const bolumQ = { data: { next_kontrol: kontrol, kuyruk: null } }
    const hatirlatmalar = norolojimHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      sonrakiKontrolIso: bolumQ.data?.next_kontrol ? String(bolumQ.data.next_kontrol).slice(0, 10) : null,
    })
    bundle.noro = {
      sonrakiKontrol: noroSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      formHatirlatma: noroFormHatirlatmalari(hatirlatmalar),
      ilacHatirlatma: noroIlacHatirlatmalari(hatirlatmalar),
      ipuclari: [...NORO_IPUCLARI],
      not: NOROLOJIM_NOTU,
    }
  } catch (e) { console.error('[portal] norolojim:', e) }

  if (aktif.has('hormonlarim')) try {
    const gorevQ = { data: gorevler['hormonlarim'] || [] }
    const bolumQ = { data: { next_kontrol: kontrol, kuyruk: null } }
    const hatirlatmalar = hormonlarimHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      sonrakiKontrolIso: bolumQ.data?.next_kontrol ? String(bolumQ.data.next_kontrol).slice(0, 10) : null,
    })
    bundle.endo = {
      sonrakiKontrol: endoSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      labHatirlatma: endoLabHatirlatmalari(hatirlatmalar),
      dxaHatirlatma: endoDxaHatirlatmalari(hatirlatmalar),
      rejimHatirlatma: endoRejimHatirlatmalari(hatirlatmalar),
      ipuclari: [...ENDO_IPUCLARI],
      not: HORMONLARIM_NOTU,
    }
  } catch (e) { console.error('[portal] hormonlarim:', e) }

  if (aktif.has('romatizmam')) try {
    const gorevQ = { data: gorevler['romatizmam'] || [] }
    const bolumQ = { data: { next_kontrol: kontrol, kuyruk: null } }
    const hatirlatmalar = romatizmamHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      sonrakiKontrolIso: bolumQ.data?.next_kontrol ? String(bolumQ.data.next_kontrol).slice(0, 10) : null,
    })
    bundle.roma = {
      sonrakiKontrol: romaSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      labHatirlatma: romaLabHatirlatmalari(hatirlatmalar),
      skorHatirlatma: romaSkorHatirlatmalari(hatirlatmalar),
      belgeHatirlatma: romaBelgeHatirlatmalari(hatirlatmalar),
      ipuclari: [...ROMA_IPUCLARI],
      not: ROMATIZMAM_NOTU,
    }
  } catch (e) { console.error('[portal] romatizmam:', e) }

  if (aktif.has('enfeksiyon-takibim')) try {
    const gorevQ = { data: gorevler['enfeksiyon-takibim'] || [] }
    const bolumQ = { data: { next_kontrol: kontrol, kuyruk: null } }
    const hatirlatmalar = enfeksiyonTakibimHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      sonrakiKontrolIso: bolumQ.data?.next_kontrol ? String(bolumQ.data.next_kontrol).slice(0, 10) : null,
    })
    bundle.enfeksiyon = {
      sonrakiKontrol: enfSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      viralHatirlatma: enfViralHatirlatmalari(hatirlatmalar),
      atbHatirlatma: enfAtbHatirlatmalari(hatirlatmalar),
      izolasyonHatirlatma: enfIzolasyonHatirlatmalari(hatirlatmalar),
      ipuclari: [...ENF_IPUCLARI],
      not: ENFEKSIYON_TAKIBIM_NOTU,
    }
  } catch (e) { console.error('[portal] enfeksiyon-takibim:', e) }

  if (aktif.has('sindirimim')) try {
    const gorevQ = { data: gorevler['sindirimim'] || [] }
    const bolumQ = { data: { next_kontrol: kontrol, kuyruk: null } }
    const hatirlatmalar = sindirimimHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      sonrakiKontrolIso: bolumQ.data?.next_kontrol ? String(bolumQ.data.next_kontrol).slice(0, 10) : null,
    })
    bundle.gastro = {
      sonrakiKontrol: gastroSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      skorHatirlatma: gastroSkorHatirlatmalari(hatirlatmalar),
      hepatitHatirlatma: gastroHepatitHatirlatmalari(hatirlatmalar),
      endoskopiHatirlatma: gastroEndoskopiHatirlatmalari(hatirlatmalar),
      rejimHatirlatma: gastroRejimHatirlatmalari(hatirlatmalar),
      ipuclari: [...GASTRO_IPUCLARI],
      not: SINDIRIMIM_NOTU,
    }
  } catch (e) { console.error('[portal] sindirimim:', e) }

  if (aktif.has('bobreklerim')) try {
    const gorevQ = { data: gorevler['bobreklerim'] || [] }
    const bolumQ = { data: { next_kontrol: kontrol, kuyruk: null } }
    const hatirlatmalar = bobreklerimHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      sonrakiKontrolIso: bolumQ.data?.next_kontrol ? String(bolumQ.data.next_kontrol).slice(0, 10) : null,
    })
    bundle.nef = {
      sonrakiKontrol: nefSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      labHatirlatma: nefLabHatirlatmalari(hatirlatmalar),
      anemiHatirlatma: nefAnemiHatirlatmalari(hatirlatmalar),
      diyalizHatirlatma: nefDiyalizHatirlatmalari(hatirlatmalar),
      ipuclari: [...NEF_IPUCLARI],
      not: BOBREKLERIM_NOTU,
    }
  } catch (e) { console.error('[portal] bobreklerim:', e) }

  if (aktif.has('tedavim')) try {
    const gorevQ = { data: gorevler['tedavim'] || [] }
    const bolumQ = { data: { next_kontrol: kontrol, kuyruk: null } }
    const hatirlatmalar = tedavimHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      sonrakiKontrolIso: bolumQ.data?.next_kontrol ? String(bolumQ.data.next_kontrol).slice(0, 10) : null,
    })
    bundle.onko = {
      sonrakiKontrol: onkoSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      kurHatirlatma: onkoKurHatirlatmalari(hatirlatmalar),
      labHatirlatma: onkoLabHatirlatmalari(hatirlatmalar),
      yanEtkiHatirlatma: onkoYanEtkiHatirlatmalari(hatirlatmalar),
      ipuclari: [...ONKO_IPUCLARI],
      not: TEDAVIM_NOTU,
    }
  } catch (e) { console.error('[portal] tedavim:', e) }

  // GENEL-CERRAHI-EXCEPTIONAL-01 — "Ameliyatım": yalnız açık görev kodları + hekimin kontrol tarihi.
  // Tanı, patoloji sonucu ve doz portala GEÇMEZ.

  if (aktif.has('gogus-cerrahisi-takibim')) try {
    const gorevQ = { data: gorevler['gogus-cerrahisi-takibim'] || [] }
    const bolumQ = { data: { next_kontrol: kontrol, kuyruk: null } }
    const hatirlatmalar = gogusCerrahiTakibimHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      sonrakiKontrolIso: bolumQ.data?.next_kontrol ? String(bolumQ.data.next_kontrol).slice(0, 10) : null,
    })
    bundle.gogusCerrahi = {
      sonrakiKontrol: gogusCerrahiSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      tupYaraHatirlatma: gogusCerrahiTupHatirlatmalari(hatirlatmalar),
      patolojiHatirlatma: gogusCerrahiPatolojiHatirlatmalari(hatirlatmalar),
      preopHatirlatma: gogusCerrahiPreopHatirlatmalari(hatirlatmalar),
      ipuclari: [...GOGUS_CERRAHI_IPUCLARI],
      not: GOGUS_CERRAHI_TAKIBIM_NOTU,
    }
  } catch (e) { console.error('[portal] gogus-cerrahisi-takibim:', e) }

  if (aktif.has('damar-cerrahisi-takibi')) try {
    const gorevQ = { data: gorevler['damar-cerrahisi-takibi'] || [] }
    const bolumQ = { data: { next_kontrol: kontrol, kuyruk: null } }
    const hatirlatmalar = damarHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      sonrakiKontrolIso: bolumQ.data?.next_kontrol ? String(bolumQ.data.next_kontrol).slice(0, 10) : null,
    })
    bundle.damarCerrahisi = {
      sonrakiKontrol: kdcSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      greftYaraHatirlatma: kdcGreftHatirlatmalari(hatirlatmalar),
      antikoagHatirlatma: kdcAntikoagHatirlatmalari(hatirlatmalar),
      preopHatirlatma: kdcPreopHatirlatmalari(hatirlatmalar),
      ipuclari: [...KDC_IPUCLARI],
      not: DAMAR_TAKIP_NOTU,
    }
  } catch (e) { console.error('[portal] damar-cerrahisi-takibi:', e) }

  if (aktif.has('ameliyatim')) try {
    const gorevQ = { data: gorevler['ameliyatim'] || [] }
    const bolumQ = { data: { next_kontrol: kontrol, kuyruk: null } }
    const hatirlatmalar = ameliyatimHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      sonrakiKontrolIso: bolumQ.data?.next_kontrol ? String(bolumQ.data.next_kontrol).slice(0, 10) : null,
    })
    bundle.gc = {
      sonrakiKontrol: gcSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      ameliyatHatirlatma: gcAmeliyatHatirlatmalari(hatirlatmalar),
      yaraHatirlatma: gcYaraHatirlatmalari(hatirlatmalar),
      raporHatirlatma: gcRaporHatirlatmalari(hatirlatmalar),
      ipuclari: [...GC_IPUCLARI],
      not: AMELIYATIM_NOTU,
    }
  } catch (e) { console.error('[portal] ameliyatim:', e) }

  if (aktif.has('yaram')) try {
    const gorevQ = { data: gorevler['yaram'] || [] }
    const bolumQ = { data: { next_kontrol: kontrol, kuyruk: null } }
    const hatirlatmalar = yaramHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      sonrakiKontrolIso: bolumQ.data?.next_kontrol ? String(bolumQ.data.next_kontrol).slice(0, 10) : null,
    })
    bundle.plastik = {
      sonrakiKontrol: plastikSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      pansumanHatirlatma: plastikPansumanHatirlatmalari(hatirlatmalar),
      fotoHatirlatma: plastikFotoHatirlatmalari(hatirlatmalar),
      dikisHatirlatma: plastikDikisHatirlatmalari(hatirlatmalar),
      ipuclari: [...PLASTIK_IPUCLARI],
      not: YARAM_NOTU,
    }
  } catch (e) { console.error('[portal] yaram:', e) }

  if (aktif.has('beyin-takibi')) try {
    const gorevQ = { data: gorevler['beyin-takibi'] || [] }
    const bolumQ = { data: { next_kontrol: kontrol, kuyruk: null } }
    const hatirlatmalar = beyinTakipHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      sonrakiKontrolIso: bolumQ.data?.next_kontrol ? String(bolumQ.data.next_kontrol).slice(0, 10) : null,
    })
    bundle.beyin = {
      sonrakiKontrol: beyinSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      postopHatirlatma: beyinPostopHatirlatmalari(hatirlatmalar),
      goruntuHatirlatma: beyinGoruntuHatirlatmalari(hatirlatmalar),
      izlemHatirlatma: beyinIzlemHatirlatmalari(hatirlatmalar),
      ipuclari: [...BEYIN_IPUCLARI],
      not: BEYIN_TAKIP_NOTU,
    }
  } catch (e) { console.error('[portal] beyin-takibi:', e) }

  if (aktif.has('tetkiklerim')) try {
    const gorevQ = { data: gorevler['tetkiklerim'] || [] }
    const bolumQ = { data: { next_kontrol: kontrol, kuyruk: null } }
    const kuyrukQ = { data: ORNEK_KUYRUK(bugun) }
    const hatirlatmalar = tetkiklerimHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      sonrakiKontrolIso: bolumQ.data?.next_kontrol ? String(bolumQ.data.next_kontrol).slice(0, 10) : null,
    })
    const DURUM_MAP: Record<string, 'Bekliyor' | 'Çekildi' | 'Rapor hazır' | 'Arşiv'> = {
      bekliyor: 'Bekliyor', cekildi: 'Çekildi', rapor_hazir: 'Rapor hazır', arsiv: 'Arşiv',
    }
    const MOD_MAP: Record<string, string> = {
      xray: 'Direkt grafi', us: 'Ultrason', bt: 'BT', mri: 'MR', mamografi: 'Mamografi', pet: 'PET', diger: 'Tetkik',
    }
    const tetkikler = (kuyrukQ.data || []).map((r) => ({
      durum: DURUM_MAP[String(r.durum || 'bekliyor')] || 'Bekliyor',
      tarih: r.tarih ? String(r.tarih).slice(0, 10) : null,
      modaliteEtiket: MOD_MAP[String(r.modalite || 'diger')] || 'Tetkik',
    }))
    bundle.radyo = {
      sonrakiKontrol: radyoSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      tetkikler,
      tetkikHatirlatma: radyoTetkikHatirlatmalari(hatirlatmalar),
      raporHatirlatma: radyoRaporHatirlatmalari(hatirlatmalar),
      belgeHatirlatma: radyoBelgeHatirlatmalari(hatirlatmalar),
      ipuclari: [...TETKIKLERIM_IPUCLARI],
      not: TETKIKLERIM_NOTU,
    }
  } catch (e) { console.error('[portal] tetkiklerim:', e) }

  if (aktif.has('anestezi-oncesi')) try {
    const gorevQ = { data: gorevler['anestezi-oncesi'] || [] }
    const bolumQ = { data: { next_kontrol: kontrol, kuyruk: null } }
    const hatirlatmalar = anesteziOncesiHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      sonrakiKontrolIso: bolumQ.data?.next_kontrol ? String(bolumQ.data.next_kontrol).slice(0, 10) : null,
    })
    bundle.anestezi = {
      sonrakiKontrol: anesteziSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      preopHatirlatma: anesteziPreopHatirlatmalari(hatirlatmalar),
      havaYoluHatirlatma: anesteziHavaYoluHatirlatmalari(hatirlatmalar),
      agriHatirlatma: anesteziAgriHatirlatmalari(hatirlatmalar),
      ipuclari: [...ANESTEZI_IPUCLARI],
      not: ANESTEZI_ONCESI_NOTU,
    }
  } catch (e) { console.error('[portal] anestezi-oncesi:', e) }

  if (aktif.has('cocugumun-cerrahisi')) try {
    const gorevQ = { data: gorevler['cocugumun-cerrahisi'] || [] }
    const bolumQ = { data: { next_kontrol: kontrol, kuyruk: null } }
    const hatirlatmalar = cocugumunCerrahisiHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      sonrakiKontrolIso: bolumQ.data?.next_kontrol ? String(bolumQ.data.next_kontrol).slice(0, 10) : null,
    })
    bundle.cc = {
      sonrakiKontrol: ccSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      yaraHatirlatma: ccYaraHatirlatmalari(hatirlatmalar),
      islemHatirlatma: ccIslemHatirlatmalari(hatirlatmalar),
      bakimIpuclari: [...CC_BAKIM_IPUCLARI],
      not: COCUGUMUN_CERRAHISI_NOTU,
    }
  } catch (e) { console.error('[portal] cocugumun-cerrahisi:', e) }

  if (aktif.has('acil-sonrasi')) try {
    const gorevQ = { data: gorevler['acil-sonrasi'] || [] }
    const bolumQ = { data: { next_kontrol: kontrol, kuyruk: null } }
    const hatirlatmalar = acilSonrasiHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      sonrakiKontrolIso: bolumQ.data?.next_kontrol ? String(bolumQ.data.next_kontrol).slice(0, 10) : null,
    })
    bundle.acilSonrasi = {
      sonrakiKontrol: acilSonrasiSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      taburcuHatirlatma: acilTaburcuHatirlatmalari(hatirlatmalar),
      takipHatirlatma: acilTakipHatirlatmalari(hatirlatmalar),
      sevkHatirlatma: acilSevkHatirlatmalari(hatirlatmalar),
      ipuclari: [...ACIL_SONRASI_IPUCLARI],
      not: ACIL_SONRASI_NOTU,
    }
  } catch (e) { console.error('[portal] acil-sonrasi:', e) }

  if (aktif.has('akcigerlerim')) try {
    const gorevQ = { data: gorevler['akcigerlerim'] || [] }
    const bolumQ = { data: { next_kontrol: kontrol, kuyruk: null } }
    const hatirlatmalar = akcigerlerimHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      sonrakiKontrolIso: bolumQ.data?.next_kontrol ? String(bolumQ.data.next_kontrol).slice(0, 10) : null,
    })
    bundle.akciger = {
      sonrakiKontrol: akcigerSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      testHatirlatma: gogusTestHatirlatmalari(hatirlatmalar),
      bakimHatirlatma: bakimHatirlatmalari(hatirlatmalar),
      bakimIpuclari: [...AKCIGER_BAKIM_IPUCLARI],
      not: AKCIGERLERIM_NOTU,
    }
  } catch (e) { console.error('[portal] akcigerlerim:', e) }

  if (aktif.has('urolojim')) try {
    const gorevQ = { data: gorevler['urolojim'] || [] }
    const bolumQ = { data: { next_kontrol: kontrol, kuyruk: null } }
    const hatirlatmalar = urolojimHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      sonrakiKontrolIso: bolumQ.data?.next_kontrol ? String(bolumQ.data.next_kontrol).slice(0, 10) : null,
    })
    bundle.uro = {
      sonrakiKontrol: uroSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      testHatirlatma: uroTestHatirlatmalari(hatirlatmalar),
      islemHatirlatma: uroIslemHatirlatmalari(hatirlatmalar),
      bakimIpuclari: [...URO_BAKIM_IPUCLARI],
      not: UROLOJIM_NOTU,
    }
  } catch (e) { console.error('[portal] urolojim:', e) }

  if (aktif.has('sporum')) try {
    const gorevQ = { data: gorevler['sporum'] || [] }
    const bolumQ = { data: { next_kontrol: kontrol, kuyruk: null } }
    const rtpQ = { data: ORNEK_KUYRUK(bugun) }
    // Type-only fix (2026-11-10, unblocks the main build broken since 83e2e5f78): the preview's sample queue is a list and
    // carries no RTP step, so this was always undefined → null at runtime; the behaviour is unchanged.
    const rtpBasamakHam = (rtpQ.data as unknown as { basamak?: unknown } | null)?.basamak
    const hatirlatmalar = sporumHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      sonrakiKontrolIso: bolumQ.data?.next_kontrol ? String(bolumQ.data.next_kontrol).slice(0, 10) : null,
      rtpBasamak: rtpBasamakHam != null ? Number(rtpBasamakHam) : null,
    })
    bundle.spor = {
      sonrakiKontrol: sporSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      planHatirlatma: sporPlanHatirlatmalari(hatirlatmalar),
      rtpOzet: rtpHastaOzeti(rtpBasamakHam != null ? Number(rtpBasamakHam) : null),
      bakimIpuclari: [...SPOR_BAKIM_IPUCLARI],
      not: SPORUM_NOTU,
    }
  } catch (e) { console.error('[portal] sporum:', e) }

  if (aktif.has('eklemlerim')) try {
    const gorevQ = { data: gorevler['eklemlerim'] || [] }
    const bolumQ = { data: { next_kontrol: kontrol, kuyruk: null } }
    const hatirlatmalar = eklemlerimHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      sonrakiKontrolIso: bolumQ.data?.next_kontrol ? String(bolumQ.data.next_kontrol).slice(0, 10) : null,
    })
    bundle.eklem = {
      sonrakiKontrol: eklemSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      izlemHatirlatma: ortoIzlemHatirlatmalari(hatirlatmalar),
      islemHatirlatma: ortoIslemHatirlatmalari(hatirlatmalar),
      bakimIpuclari: [...ORTO_BAKIM_IPUCLARI],
      not: EKLEMLERIM_NOTU,
    }
  } catch (e) { console.error('[portal] eklemlerim:', e) }

  if (aktif.has('ftrm')) try {
    const gorevQ = { data: gorevler['ftrm'] || [] }
    const bolumQ = { data: { next_kontrol: kontrol, kuyruk: null } }
    const hatirlatmalar = ftrmHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      sonrakiKontrolIso: bolumQ.data?.next_kontrol ? String(bolumQ.data.next_kontrol).slice(0, 10) : null,
    })
    bundle.ftr = {
      sonrakiKontrol: ftrSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      seansHatirlatma: ftrSeansHatirlatmalari(hatirlatmalar),
      egzersizHatirlatma: ftrEgzersizHatirlatmalari(hatirlatmalar),
      ipuclari: [...FTR_IPUCLARI],
      not: FTRM_NOTU,
    }
  } catch (e) { console.error('[portal] ftrm:', e) }

  if (aktif.has('saglik-paketim')) try {
    const gorevQ = { data: gorevler['saglik-paketim'] || [] }
    const bolumQ = { data: { next_kontrol: kontrol, kuyruk: null } }
    const hatirlatmalar = saglikPaketimHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      sonrakiKontrolIso: bolumQ.data?.next_kontrol ? String(bolumQ.data.next_kontrol).slice(0, 10) : null,
    })
    bundle.aile = {
      sonrakiKontrol: aileSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      asiTaramaHatirlatma: aileAsiHatirlatmalari(hatirlatmalar),
      kronikHatirlatma: aileKronikHatirlatmalari(hatirlatmalar),
      ipuclari: [...AILE_IPUCLARI],
      not: SAGLIK_PAKETIM_NOTU,
    }
  } catch (e) { console.error('[portal] saglik-paketim:', e) }
}

export const ONIZLEME_GOREV_MODULLERI: readonly string[] = ['psikiyatri', 'kulaklarim', 'kalbim', 'norolojim', 'hormonlarim', 'romatizmam', 'enfeksiyon-takibim', 'sindirimim', 'bobreklerim', 'tedavim', 'gogus-cerrahisi-takibim', 'damar-cerrahisi-takibi', 'ameliyatim', 'yaram', 'beyin-takibi', 'tetkiklerim', 'anestezi-oncesi', 'cocugumun-cerrahisi', 'acil-sonrasi', 'akcigerlerim', 'urolojim', 'sporum', 'eklemlerim', 'ftrm', 'saglik-paketim']
