/**
 * NOTYA-ASISTAN-SABLON — the two international titles of each specialty, with nothing else in the string.
 *
 * This is the country-facing copy of the secondary list in turkishSpecialtyRefs.ts. A country build imports
 * this file and not that one: that file carries Turkish letters, and a build that is not Turkiye must not
 * reach them. lib/asistan/tests/uluslararasiKitaplar.test.ts holds the two lists to each other. A change to
 * the secondary list fails that test until this file is updated, and every country then reads the new titles.
 */
export const ULUSLARARASI_KITAP = {
  pediatri: ['Nelson Textbook of Pediatrics', 'Harriet Lane Handbook'],
  kardiyoloji: ["Braunwald's Heart Disease", "Hurst's The Heart"],
  noroloji: ["Adams & Victor's Principles of Neurology", "Bradley and Daroff's Neurology in Clinical Practice"],
  dahiliye: ["Harrison's Principles of Internal Medicine", 'Goldman-Cecil Medicine'],
  psikiyatri: ['Kaplan & Sadock', 'DSM-5-TR'],
  'genel-cerrahi': ["Schwartz's Principles of Surgery", 'Sabiston Textbook of Surgery'],
  ortopedi: ["Rockwood and Green's Fractures", "Campbell's Operative Orthopaedics"],
  dermatoloji: ["Fitzpatrick's Dermatology", 'Bolognia Dermatology'],
  'kulak-burun-bogaz': ['Cummings Otolaryngology', "Bailey's Head and Neck Surgery"],
  'goz-hastaliklari': ["Kanski's Clinical Ophthalmology", 'Vaughan & Asbury General Ophthalmology'],
  'kadin-hastaliklari-dogum': ['Williams Obstetrics', 'Berek & Novak Gynecology'],
  uroloji: ['Campbell-Walsh-Wein Urology', 'EAU Guidelines'],
  radyoloji: ['Grainger & Allison', 'Brant & Helms Fundamentals of Diagnostic Radiology'],
  anestezi: ["Miller's Anesthesia", 'Morgan & Mikhail Clinical Anesthesiology'],
  'acil-tip': ["Tintinalli's Emergency Medicine", "Rosen's Emergency Medicine"],
  'fizik-tedavi': ["Braddom's PM&R", "DeLisa's Physical Medicine & Rehabilitation"],
  'enfeksiyon-hastaliklari': ['Mandell Principles of Infectious Diseases', 'Sanford Guide'],
  endokrinoloji: ['Williams Textbook of Endocrinology', "Greenspan's Basic & Clinical Endocrinology"],
  gastroenteroloji: ['Sleisenger and Fordtran', "Yamada's Textbook of Gastroenterology"],
  nefroloji: ["Brenner & Rector's The Kidney", 'Comprehensive Clinical Nephrology'],
  romatoloji: ["Kelley and Firestein's Rheumatology", 'Oxford Textbook of Rheumatology'],
  onkoloji: ['DeVita Cancer', 'NCCN Guidelines'],
  'gogus-hastaliklari': ["Murray & Nadel's Respiratory Medicine", "Fishman's Pulmonary Diseases"],
  'gogus-cerrahisi': ["Shields' General Thoracic Surgery", "Pearson's Thoracic & Esophageal Surgery"],
  'plastik-cerrahi': ["Grabb and Smith's Plastic Surgery", 'Plastic Surgery'],
  'beyin-cerrahisi': ['Youmans and Winn', 'Handbook of Neurosurgery'],
  'kalp-damar-cerrahisi': ['Kirklin/Barratt-Boyes', 'Cardiac Surgery in the Adult'],
  'cocuk-cerrahisi': ["Ashcraft's Pediatric Surgery", 'Pediatric Surgery'],
  'aile-hekimligi': ['Rakel Textbook of Family Medicine', 'Current Medical Diagnosis & Treatment'],
  'spor-hekimligi': ["Brukner & Khan's Clinical Sports Medicine", 'ACSM Sports Medicine'],
} as const

export type UluslararasiAnahtar = keyof typeof ULUSLARARASI_KITAP
