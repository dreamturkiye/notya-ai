/**
 * Paediatrics asks the long-term conditions question in a child's own list — not the adult list of the core form
 * (no high blood pressure, no COPD). Same question key and the same option keys where the meaning stays ('lungs' is
 * now asthma, 'heart' a heart condition the child was born with), so an answer stored earlier still reads. Everything
 * else about the question is the core question's. On the guardian form only: a patient above the guardian age who
 * is seen by a paediatrician gets the core list. Türkiye is not touched (lib/intake/coreAlanlar.ts).
 *
 * The roles are those Türkiye's child form covers (COCUK_FORMU_BRANSLARI: paediatrics and paediatric surgery).
 * MACHINE-WRITTEN; awaits a paediatric clinician in each country like every set (OPEN-COMMITMENTS, 2026-10-24).
 */
import { cok, HICBIRI, s, type HamSoru } from './yardimci'

export const EN_COCUK_ROLLERI: readonly string[] = ['paediatrics', 'paediatric-surgery']

export const EN_COCUK_KRONIK: readonly HamSoru[] = [
  cok('long_term', 'Does the child have any long-term conditions a doctor has told you about?', [
    s('lungs', 'Asthma'),
    s('epilepsy', 'Epilepsy or seizures'),
    s('heart', 'A heart condition the child was born with'),
    s('diabetes', 'Type 1 diabetes'),
    s('coeliac', 'Coeliac disease'),
    s('eczema', 'Eczema (atopic dermatitis)'),
    s('food_allergy', 'A food allergy that can cause a severe reaction (anaphylaxis)'),
    s('kidney', 'A kidney or urinary condition'),
    s('thyroid', 'A thyroid condition'),
    s('blood', 'Sickle cell disease or another blood condition'),
    s('neuro_dev', 'A developmental or neurological condition'),
    s('cancer', 'Cancer'),
    s('other', 'Another condition'),
    HICBIRI(),
  ], { zorunlu: true }),
]
