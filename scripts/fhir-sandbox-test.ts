// NOTYA-FHIR-01 sandbox proof — SYNTHETIC data only, through the real mapper,
// POSTed to the public HAPI FHIR R4 server. Acceptance: HTTP 200 + transaction-response.
import { notuFhirBundleYap } from '../lib/entegrasyon/fhirMapper'
import fs from 'fs'

const bundle = notuFhirBundleYap({
  noteId: 'test-' + Date.now(),
  createdAt: new Date().toISOString(),
  basvuruYakinmasi: 'Kulak ağrısı ve ateş',
  anamnez: 'Şikayet: Kulak ağrısı, sabahtan beri. Şikayetin Hikayesi: 2 gün önce burun akıntısı başlamış. Özgeçmiş: Miadında doğum, aşılar tam. Soygeçmiş: Özellik yok.',
  fizikMuayene: 'Genel durum: İyi, hidrate. KBB: Sağ timpanik membran hiperemik. Solunum: Akciğerler temiz.',
  tani: '1. Akut Otitis Media (sağ) 2. Akut Rinofarenjit',
  tedavi: '1. Amoksisilin 80-90 mg/kg/gün 2. İbuprofen 10 mg/kg/doz 3. Kontrol: 48-72 saat',
  icd10: [
    { code: 'H66.9', description: 'Otitis media, tanımlanmamış', is_primary: true },
    { code: 'J00', description: 'Akut nazofarenjit', is_primary: false },
  ],
  vitaller: { ates: 38.5, nabiz: 100, kilo: 10, solunum: 20 },
  receteOnerisi: [{ ad: 'AUGMENTIN ES 600/42,9', doz: '42,9 MG', kullanim: '2x5ml', sure: '7 gün' }],
  hasta: { id: 'sentetik-hasta-0001', adSoyad: 'Test Bebek Yılmaz', dogumTarihi: '2025-08-01', cinsiyet: 'erkek' },
  doktor: { id: 'sentetik-dr-0001', adSoyad: 'Dr. Test Pediatri', brans: 'pediatri' },
  kurumAd: 'HAPI Sandbox Test',
})

async function calistir() {
  const r = await fetch('https://hapi.fhir.org/baseR4', {
    method: 'POST',
    headers: { 'Content-Type': 'application/fhir+json' },
    body: JSON.stringify(bundle),
  })
  const metin = await r.text()
  const sonuc = {
    http: r.status,
    entrySayisi: (bundle.entry as unknown[]).length,
    yanitTipi: (() => { try { const j = JSON.parse(metin); return j.resourceType + '/' + j.type } catch { return metin.slice(0, 80) } })(),
    ilkYanitlar: (() => { try { const j = JSON.parse(metin); return (j.entry || []).slice(0, 4).map((e: { response?: { status?: string } }) => e.response?.status) } catch { return [] } })(),
  }
  fs.writeFileSync('/tmp/fhir-test.json', JSON.stringify(sonuc, null, 1))
  console.log(JSON.stringify(sonuc))
}
calistir().catch((e) => { console.error('HATA', e.message); process.exit(1) })
