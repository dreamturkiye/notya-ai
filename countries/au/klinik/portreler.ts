/**
 * AU-PORTRE-01 (2026-10-23) — Australia: the portrait of each of the 44 assistant personas.
 *
 * HOW TÜRKİYE DOES IT (read, not assumed): every persona carries `photo: '/doctors/dr_<name>.jpg'`
 * (lib/asistan/specialistsCatalog.ts), 1024x1024, shown as a round crop (object-fit cover, top-centred) by
 * app/asistan/page.tsx. Both countries now render through the SAME component, components/asistan/PersonaFoto.tsx.
 *
 * HONESTY RULE: a portrait is listed in AU_PORTRE_URETILDI only when its file exists in public/portreler/au/.
 * A persona without a produced file shows its initials (PersonaFoto falls back) — never a stock or borrowed face.
 * Faces are AI-generated FICTIONAL people; never a real person, clinician or celebrity.
 * The test (./portreler.test.ts) fails if a listed file is missing, oversize, or if a persona has no manifest entry.
 *
 * PRODUCTION: `scripts/au-portreler-uret.mjs --liste` prints one prompt per persona (from AU_PORTRE_MANIFESTI);
 * generate each at 1:1, save as public/portreler/au/<rol>.webp (1024x1024, <=120 KB; the script's `--isle` converts),
 * then add the role to AU_PORTRE_URETILDI.
 *
 * Pure data, no fs: this file is bundled into the client.
 */
import { AU_ASISTAN_ADLARI, type AuAsistanCinsiyeti, type Sunulan } from './asistanAdlari'

export const AU_PORTRE_DIZIN = '/portreler/au'
export const PORTRE_BOYUT = 1024
export const PORTRE_AZAMI_BAYT = 120 * 1024

/** Roles whose portrait file has been produced and committed. EMPTY until images exist: no image generator was reachable. */
export const AU_PORTRE_URETILDI: ReadonlySet<string> = new Set<string>([
  'aesthetic-medicine', 'aesthetic-surgery', 'anaesthesia', 'audiology', 'cardio-thoracic-surgery', 'cardiology', 'clinical-psychology', 'dermatology', 'dietetics', 'emergency-medicine', 'endocrinology', 'family-medicine', 'gastroenterology', 'general-surgery', 'geriatric-medicine', 'haematology', 'immunology-and-allergy', 'infectious-diseases', 'internal-medicine', 'nephrology', 'neurology', 'neurosurgery', 'obstetrics-gynaecology', 'occupational-therapy', 'oncology', 'ophthalmology', 'orthopaedics', 'otolaryngology', 'paediatric-surgery', 'paediatrics', 'pain-medicine', 'physiotherapy', 'plastic-surgery', 'podiatry', 'psychiatry', 'radiation-oncology', 'radiology', 'rehabilitation-medicine', 'respiratory-medicine', 'rheumatology', 'speech-pathology', 'sports-medicine', 'urology', 'vascular-surgery',
])

type Gorunum = string
/** Plausible Australian clinical workforce: varied heritage and age, one short descriptor each (no real person implied). */
const GORUNUM: Record<Sunulan, Gorunum> = {
  'emergency-medicine': 'in her mid 30s, East Asian Australian, shoulder-length black hair',
  'family-medicine': 'in his late 40s, Anglo-Australian, short greying brown hair, kind lined eyes',
  anaesthesia: 'in her early 40s, South Asian Australian, dark hair tied back',
  neurosurgery: 'in his early 50s, Anglo-Australian, close-cropped silver hair, calm expression',
  'paediatric-surgery': 'in her late 30s, Anglo-Australian, fair, light brown hair in a low ponytail',
  'internal-medicine': 'in his mid 40s, Black Australian of West African heritage, short hair, neat short beard',
  dermatology: 'in her early 30s, Chinese Australian, straight dark hair with a side part',
  endocrinology: 'in his late 50s, Irish-Australian, thinning grey hair, wire-rimmed glasses',
  'infectious-diseases': 'in her early 40s, Japanese Australian, bobbed black hair, round glasses',
  gastroenterology: 'in his mid 30s, Anglo-Australian, short fair hair, light stubble',
  'general-surgery': 'in her mid 40s, Irish-Australian, red-brown hair pulled back',
  'respiratory-medicine': 'in his early 50s, Scottish-Australian, sandy hair, ruddy complexion',
  ophthalmology: 'in her late 30s, Italian Australian, wavy dark brown hair',
  'obstetrics-gynaecology': 'in her mid 40s, Anglo-Australian, blonde bob',
  cardiology: 'in his mid 40s, Indian Australian, short black hair, trimmed beard',
  otolaryngology: 'in her early 40s, Central European Australian, light brown shoulder-length hair',
  nephrology: 'in his late 30s, Vietnamese Australian, short black hair, glasses',
  neurology: 'in her late 50s, Scottish-Australian, silver bob',
  oncology: 'in his early 40s, Welsh-Australian, short dark hair, warm smile',
  orthopaedics: 'in his mid 30s, Anglo-Australian, athletic build, short brown hair',
  paediatrics: 'in her early 40s, Anglo-Australian, wavy auburn hair, very friendly smile',
  'plastic-surgery': 'in his mid 40s, Italian Australian, dark swept-back hair',
  psychiatry: 'in her mid 30s, Lebanese Australian, long dark hair, gentle expression',
  radiology: 'in his early 50s, Anglo-Australian, balding with short grey hair, glasses',
  rheumatology: 'in her late 40s, Black Australian of Ghanaian heritage, short natural hair',
  urology: 'in his late 30s, Irish-Australian, short brown hair',
  'sports-medicine': 'in his early 40s, Italian Australian, tanned, short dark hair, fit',
  'rehabilitation-medicine': 'in her mid 30s, Anglo-Australian, brown hair in a ponytail',
  'cardio-thoracic-surgery': 'in his late 50s, Anglo-Australian, white hair, distinguished',
  'vascular-surgery': 'in her early 40s, Polish Australian, blonde shoulder-length hair',
  'radiation-oncology': 'in his late 40s, Polish Australian, short fair hair, glasses',
  'geriatric-medicine': 'in her early 60s, Irish-Australian, short silver hair, warm grandmotherly smile',
  'immunology-and-allergy': 'in his mid 30s, Vietnamese Australian, short black hair',
  haematology: 'in her late 30s, Indian Australian, long black hair',
  'pain-medicine': 'in his mid 50s, Swedish-Australian, light grey hair, calm expression',
  'aesthetic-surgery': 'in her late 40s, Anglo-Australian, elegant blonde hair, polished',
  'aesthetic-medicine': 'in his late 30s, Portuguese-Australian, short dark hair, light beard, polished',
  physiotherapy: 'in her early 30s, Swedish-Australian, blonde ponytail, athletic',
  'clinical-psychology': 'in his late 30s, Anglo-Australian, short brown hair, approachable',
  dietetics: 'in her late 20s, Anglo-Australian, wavy light brown hair, bright smile',
  'occupational-therapy': 'in his early 30s, Irish-Australian, short red-brown hair, friendly',
  audiology: 'in her mid 30s, Anglo-Australian, shoulder-length brown hair',
  podiatry: 'in his late 20s, Irish-Australian, short dark hair, clean-shaven',
  'speech-pathology': 'in her early 30s, Chinese Australian, shoulder-length black hair',
}

const SCRUBS = 'navy blue scrubs with a stethoscope around the neck'
const COAT = 'a white clinical coat over a smart shirt, stethoscope around the neck'
const SMART = 'a smart open-collar shirt and a light blazer, no white coat'
const POLO = 'a clinic polo shirt in teal with a small blank embroidered logo patch, lanyard with a blank card'
const SURGICAL = 'surgical scrubs in teal-green with a surgical cap pushed back on the head, mask pulled down around the neck'
const ATTIRE: Record<Sunulan, string> = {
  'emergency-medicine': SCRUBS, 'family-medicine': COAT, anaesthesia: SURGICAL, neurosurgery: SURGICAL, 'paediatric-surgery': SURGICAL,
  'internal-medicine': COAT, dermatology: COAT, endocrinology: COAT, 'infectious-diseases': COAT, gastroenterology: COAT,
  'general-surgery': SURGICAL, 'respiratory-medicine': COAT, ophthalmology: COAT, 'obstetrics-gynaecology': SCRUBS, cardiology: COAT,
  otolaryngology: COAT, nephrology: COAT, neurology: COAT, oncology: COAT, orthopaedics: SURGICAL, paediatrics: 'a white clinical coat over a cheerful patterned shirt, stethoscope around the neck',
  'plastic-surgery': SURGICAL, psychiatry: SMART, radiology: SMART, rheumatology: COAT, urology: COAT, 'sports-medicine': POLO,
  'rehabilitation-medicine': POLO, 'cardio-thoracic-surgery': SURGICAL, 'vascular-surgery': SURGICAL, 'radiation-oncology': COAT,
  'geriatric-medicine': COAT, 'immunology-and-allergy': COAT, haematology: COAT, 'pain-medicine': COAT,
  'aesthetic-surgery': 'a tailored white clinical jacket over a dark top', 'aesthetic-medicine': 'a tailored white clinical jacket over a dark top',
  physiotherapy: POLO, 'clinical-psychology': SMART, dietetics: 'a soft green clinic top or smart blouse, no stethoscope', 'occupational-therapy': POLO,
  audiology: 'a light blue clinic tunic with a lanyard, no stethoscope', podiatry: POLO, 'speech-pathology': 'a smart blouse with a lanyard, no stethoscope',
}

const STIL = 'Professional studio headshot, chest-up, subject centred with eyes on the upper third, looking at the camera with a warm friendly expression, soft natural window light, plain warm cream background (#faf6ee) with a gentle blur, realistic photograph, sharp focus, 1:1 square, no text, no logos, no watermark. AI-generated fictional person, not a real individual.'

export type AuPortreGirdisi = { rol: Sunulan; tamAd: string; cinsiyet: AuAsistanCinsiyeti; dosya: string; yol: string; istem: string }

function istemYaz(rol: Sunulan): string {
  const ad = AU_ASISTAN_ADLARI[rol]
  const kim = ad.cinsiyet === 'kadin' ? 'woman' : 'man'
  return `Portrait of a friendly Australian ${kim} ${GORUNUM[rol]}, a clinician in ${rol.replace(/-/g, ' ')} practice, wearing ${ATTIRE[rol]}. ${STIL}`
}

export const AU_PORTRE_MANIFESTI: Readonly<Record<Sunulan, AuPortreGirdisi>> = Object.fromEntries(
  (Object.keys(AU_ASISTAN_ADLARI) as Sunulan[]).map((rol) => [rol, {
    rol, tamAd: AU_ASISTAN_ADLARI[rol].tamAd, cinsiyet: AU_ASISTAN_ADLARI[rol].cinsiyet,
    dosya: `${rol}.webp`, yol: `${AU_PORTRE_DIZIN}/${rol}.webp`, istem: istemYaz(rol),
  } satisfies AuPortreGirdisi]),
) as Record<Sunulan, AuPortreGirdisi>

/** The portrait URL of a role, or null when none was produced (the screens then show initials). */
export function auPortreYolu(rol: string): string | null {
  return AU_PORTRE_URETILDI.has(rol) && Object.prototype.hasOwnProperty.call(AU_PORTRE_MANIFESTI, rol) ? AU_PORTRE_MANIFESTI[rol as Sunulan].yol : null
}
