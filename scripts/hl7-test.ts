// NOTYA-HL7-01 structural test — synthetic note through both builders; assert segment grammar.
import { notuMdmYap, notuOruYap } from '../lib/entegrasyon/hl7v2Mapper'
import type { FhirNotGirdisi } from '../lib/entegrasyon/fhirMapper'

const g: FhirNotGirdisi = {
  noteId: 'abc12345-6789-4def-9012-3456789abcde',
  createdAt: '2026-09-05T14:30:00+03:00',
  basvuruYakinmasi: 'Kulak ağrısı ve ateş',
  anamnez: 'Şikayet: Kulak ağrısı.\nŞikayetin Hikayesi: 2 gün önce | burun & akıntısı ^ başladı.',
  fizikMuayene: 'Genel durum: İyi. KBB: Sağ TM hiperemik.',
  tani: '1. AOM (sağ) 2. Rinofarenjit',
  tedavi: '1. Amoksisilin 80-90 mg/kg/gün',
  icd10: [{ code: 'H66.9', is_primary: true }],
  vitaller: { ates: 38.5, nabiz: 100, kilo: 10 },
  hasta: { id: 'h-0001', adSoyad: 'Test Bebek Yılmaz', dogumTarihi: '2025-08-01', cinsiyet: 'erkek' },
  doktor: { id: 'd-0001', adSoyad: 'Dr. Gökhan Test', brans: 'pediatri' },
  kurumAd: 'Test Hastanesi',
}

const mdm = notuMdmYap(g, { aliciUygulama: 'SISOFT', aliciKurum: 'TESTHOSP', mesajTipi: 'MDM' })
const oru = notuOruYap(g, { aliciUygulama: 'SISOFT', aliciKurum: 'TESTHOSP', mesajTipi: 'ORU' })

function kontrol(ad: string, msg: string, beklenenler: string[]) {
  const segler = msg.split('\r').filter(Boolean)
  const tipler = segler.map((s) => s.split('|')[0])
  const eksik = beklenenler.filter((b) => !tipler.includes(b))
  const kacisOk = !msg.includes('|,') && msg.includes('\\F\\') && msg.includes('\\T\\') && msg.includes('\\.br\\')
  console.log(`${ad}: ${segler.length} segment [${tipler.join(',')}] eksik=[${eksik.join(',') || 'yok'}] kacis=${kacisOk ? 'OK' : 'FAIL'}`)
  console.log('  MSH:', segler[0].slice(0, 120))
  const obx = segler.find((s) => s.startsWith('OBX|2'))
  if (obx) console.log('  OBX2:', obx.slice(0, 140))
}

kontrol('MDM^T02', mdm, ['MSH', 'EVN', 'PID', 'PV1', 'TXA', 'OBX'])
kontrol('ORU^R01', oru, ['MSH', 'PID', 'PV1', 'OBR', 'OBX'])
const nmSay = oru.split('\r').filter((s) => s.startsWith('OBX') && s.includes('|NM|')).length
console.log('ORU kodlu vital OBX (NM):', nmSay, nmSay === 3 ? 'OK' : 'FAIL')
