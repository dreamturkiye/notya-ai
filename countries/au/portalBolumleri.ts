/**
 * Australia: one patient chapter per offered role. BASE shell, specialty lines.
 * A cardiology patient does not see the paediatrics chapter. Psychology has no photograph line.
 * Hair transplantation is not a role: it is named only on non-surgical cosmetic care.
 * Wellness is named only on general practice. Clinic dermatology and longevity are not offered.
 *
 * Patient-facing. No diagnosis, no dose, no score. A kept follow-up day is added by the portal, not here.
 */
export type AuPortalBolumu = { baslik: string; satirlar: readonly string[] }

export const AU_PORTAL_BOLUMLERI: Readonly<Record<string, AuPortalBolumu>> = {
  'emergency-medicine': { baslik: 'After your emergency visit', satirlar: ['What to watch for was agreed at the visit.', 'Come back sooner if you were asked to.'] },
  'family-medicine': { baslik: 'Your general practice', satirlar: ['Check-ups and a wellness review are arranged here.', 'Bring the list of medicines you take.'] },
  'anaesthesia': { baslik: 'Before your anaesthetic', satirlar: ['Your pre-operative check is arranged with this practice.', 'Follow the fasting instructions you were given.'] },
  'neurosurgery': { baslik: 'Your neurosurgery review', satirlar: ['Wound care and the next review are arranged here.', 'A new severe headache is not a message for this page.'] },
  'paediatric-surgery': { baslik: 'Your child\'s surgery review', satirlar: ['The next review after an operation is arranged here.', 'A parent or guardian can use this page with the child.'] },
  'internal-medicine': { baslik: 'Your physician review', satirlar: ['The next review of an ongoing problem is arranged here.', 'Bring recent results your doctor asked you to keep.'] },
  'dermatology': { baslik: 'Your skin check', satirlar: ['The next skin check is arranged here.', 'Photographs stay in the practice record, not on this page.'] },
  'endocrinology': { baslik: 'Your hormone review', satirlar: ['The next review is arranged here.', 'Bring the home readings you were asked to write down.'] },
  'infectious-diseases': { baslik: 'Your infection review', satirlar: ['The next review is arranged here.', 'Finish the course you were given unless you were told to stop.'] },
  'gastroenterology': { baslik: 'Your digestive review', satirlar: ['The next review, including after a procedure, is arranged here.', 'Follow the preparation instructions you were given.'] },
  'general-surgery': { baslik: 'Your operation review', satirlar: ['Wound care and the next review are arranged here.', 'The day of an operation is agreed with the surgeon.'] },
  'respiratory-medicine': { baslik: 'Your breathing review', satirlar: ['The next breathing review is arranged here.', 'Bring the inhaler you use, if you use one.'] },
  'ophthalmology': { baslik: 'Your eye check', satirlar: ['The next eye check is arranged here.', 'Bring the drops you were asked to use.'] },
  'obstetrics-gynaecology': { baslik: 'Pregnancy or gynaecology review', satirlar: ['Antenatal visits and gynaecology reviews are arranged here.', 'Bleeding or pain that worries you is not a message for this page.'] },
  'cardiology': { baslik: 'Your heart check', satirlar: ['The next heart check is arranged here.', 'Bring the home blood-pressure readings you were asked to keep.'] },
  'otolaryngology': { baslik: 'Your ear, nose and throat review', satirlar: ['The next review is arranged here.', 'Hearing and throat checks are arranged with this practice.'] },
  'nephrology': { baslik: 'Your kidney check', satirlar: ['The next kidney check is arranged here.', 'Bring the list of medicines you take.'] },
  'neurology': { baslik: 'Your neurology review', satirlar: ['The next review is arranged here.', 'A sudden weakness or a seizure is not a message for this page.'] },
  'oncology': { baslik: 'Your treatment review', satirlar: ['The next treatment review is arranged here.', 'This page does not name a dose.'] },
  'orthopaedics': { baslik: 'Your bone and joint review', satirlar: ['The next review after an injury or an operation is arranged here.', 'Bring any brace or boot you were given.'] },
  'paediatrics': { baslik: 'Growth and immunisation reviews', satirlar: ['Growth checks and immunisation reviews for your child are arranged here.', 'A parent or guardian can use this page with the child.'] },
  'plastic-surgery': { baslik: 'Your reconstructive review', satirlar: ['Wound care and the next review are arranged here.', 'This is not the cosmetic-surgery booking page.'] },
  'psychiatry': { baslik: 'Your psychiatry review', satirlar: ['The next review is arranged here.', 'This page does not show a score or a diagnosis.'] },
  'radiology': { baslik: 'Your imaging visit', satirlar: ['When to attend, and any preparation, is arranged here.', 'The report is explained by the doctor who requested it.'] },
  'rheumatology': { baslik: 'Your joint review', satirlar: ['The next joint review is arranged here.', 'This page does not show a score.'] },
  'urology': { baslik: 'Your urology review', satirlar: ['The next review is arranged here.', 'This page does not show a laboratory number.'] },
  'sports-medicine': { baslik: 'Your return to activity', satirlar: ['The next review of an injury is arranged here.', 'When to train again is agreed at the visit.'] },
  'rehabilitation-medicine': { baslik: 'Your rehabilitation review', satirlar: ['The next review is arranged here.', 'Bring the list of exercises you were given.'] },
  'aesthetic-surgery': { baslik: 'Your cosmetic surgery', satirlar: ['The earliest day a procedure can be booked is worked out from your consent.', 'Photographs stay in the practice record.'] },
  'aesthetic-medicine': { baslik: 'Your non-surgical cosmetic care', satirlar: ['Reviews of non-surgical treatment, including hair transplantation, are arranged here.', 'Photographs stay in the practice record.'] },
  'physiotherapy': { baslik: 'Your movement review', satirlar: ['Your next session is arranged here.', 'Bring the exercises you were given.'] },
  'clinical-psychology': { baslik: 'Your next session', satirlar: ['Your next session is arranged here.', 'This page does not ask you for a picture.'] },
  'dietetics': { baslik: 'Your eating-plan review', satirlar: ['Your next review is arranged here.', 'This page does not show a calorie target.'] },
  'occupational-therapy': { baslik: 'Your daily-activity review', satirlar: ['Your next session is arranged here.', 'Bring notes on the tasks you have been practising.'] },
  'audiology': { baslik: 'Your hearing review', satirlar: ['Your next hearing review is arranged here.', 'Bring the hearing device you use, if you use one.'] },
  'cardio-thoracic-surgery': { baslik: 'Your chest-surgery review', satirlar: ['Wound care and the next review after chest surgery are arranged here.', 'This is not the cardiology check.'] },
  'vascular-surgery': { baslik: 'Your vascular review', satirlar: ['The next review after vascular surgery is arranged here.', 'This is not the cardiology check.'] },
  'radiation-oncology': { baslik: 'Your radiotherapy review', satirlar: ['The next review is arranged here.', 'This page does not name a dose.'] },
  'geriatric-medicine': { baslik: 'Your later-life review', satirlar: ['The next review is arranged here.', 'Bring the list of medicines you take.'] },
  'immunology-and-allergy': { baslik: 'Your allergy review', satirlar: ['The next allergy review is arranged here.', 'Bring the action plan you were given.'] },
  'haematology': { baslik: 'Your blood review', satirlar: ['The next blood review is arranged here.', 'This page does not show a laboratory number.'] },
  'pain-medicine': { baslik: 'Your pain review', satirlar: ['The next pain review is arranged here.', 'This page does not name a dose.'] },
  'podiatry': { baslik: 'Your foot review', satirlar: ['Your next foot review is arranged here.', 'Bring the footwear you were asked about.'] },
  'speech-pathology': { baslik: 'Your speech review', satirlar: ['Your next session is arranged here.', 'Practise the tasks you were given.'] },
}
