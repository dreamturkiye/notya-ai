/**
 * DIKTE-TIBBI-01 (country port, 2026-11-21) — provider-side biasing for a visit recording: the keyterm list sent with
 * it to ElevenLabs Scribe (`keyterms`; scribe_v2 — the model every pack names). Türkiye's version is lib/dikte (main).
 *
 * Why: a KBB doctor in Türkiye dictated an ENT exam and the recogniser broke every anatomical term. The same failure
 * mode exists in every language; Scribe's documented fix is keyterm prompting (≤ 1000 terms, each ≤ 50 characters and
 * ≤ 5 words, none of < > { } [ ] \ — API reference read 2026-11-21; it adds 20 % to that transcription's cost).
 *
 * Terms: the core list every role dictates + the role's own list (keyed by the English packs' role slugs; the
 * Uzbekistan pack's Türkiye-shaped keys resolve through ROL_ESLEME). Spelling follows the doctor's note language:
 * en-US / en-CA American medical spelling, en-GB / en-AU / en-NZ British. Uzbekistan: Russian terms (the provider rates
 * Russian "Excellent") and a short Uzbek Latin list; the Uzbek list has NOT been read by a native clinician
 * (docs/OPEN-COMMITMENTS.md, DIKTE-TIBBI-01-UZ). Pure; data only.
 */
import type { DilKodu } from '../tipler'

export const KONUSMA_TERIM_AZAMI = 1000
const YASAK = /[<>{}[\]\\]/

const EN_CORE = [
  'history of presenting complaint', 'examination', 'general appearance', 'afebrile', 'febrile', 'tachycardia', 'bradycardia', 'tachypnoea',
  'dyspnoea', 'orthopnoea', 'cyanosis', 'jaundice', 'pallor', 'dehydration', 'oedema', 'pitting oedema', 'lymphadenopathy',
  'cervical lymphadenopathy', 'hepatomegaly', 'splenomegaly', 'erythema', 'erythematous', 'tenderness', 'palpation', 'auscultation',
  'bilateral', 'unilateral', 'mucoid', 'purulent', 'serous', 'haemorrhagic', 'mucopurulent', 'acute', 'chronic', 'recurrent', 'idiopathic',
  'inflammation', 'infection', 'bacterial', 'viral', 'fungal', 'allergic', 'asymptomatic', 'differential diagnosis', 'impression',
  'full blood count', 'leucocytosis', 'thrombocytopenia', 'anaemia', 'C-reactive protein', 'creatinine', 'electrolytes', 'urinalysis',
  'culture and sensitivity', 'ultrasound', 'computed tomography', 'magnetic resonance imaging', 'X-ray', 'hypertension', 'hypotension',
  'diabetes mellitus', 'hyperlipidaemia', 'hypothyroidism', 'hyperthyroidism', 'asthma', 'COPD', 'analgesia', 'antipyretic', 'antibiotic',
  'antihistamine', 'corticosteroid', 'NSAID', 'proton pump inhibitor', 'paracetamol', 'ibuprofen', 'amoxicillin', 'co-amoxiclav',
  'abdomen soft and non-tender', 'bowel sounds', 'chest clear', 'breath sounds', 'crackles', 'wheeze', 'stridor', 'heart sounds',
  'murmur', 'capillary refill', 'neurological examination', 'neck stiffness', 'reflexes', 'plantar response', 'paraesthesia', 'vertigo',
  'conjunctiva', 'sclera', 'pupils equal and reactive', 'pharynx', 'tonsils', 'larynx', 'thyroid', 'follow-up', 'referral', 'safety netting',
]

const EN_ROL: Record<string, string[]> = {
  otolaryngology: [
    'otoscopy', 'tympanic membrane', 'tympanic membranes intact', 'perforation', 'retraction pocket', 'bulging', 'light reflex', 'malleus',
    'pars tensa', 'pars flaccida', 'external auditory canal', 'cerumen', 'wax impaction', 'otorrhoea', 'otalgia', 'otitis media',
    'acute otitis media', 'otitis media with effusion', 'otitis externa', 'cholesteatoma', 'tympanosclerosis', 'mastoid', 'mastoiditis',
    'pinna', 'preauricular', 'tinnitus', 'hearing loss', 'conductive', 'sensorineural', 'audiometry', 'audiogram', 'tympanometry',
    'type B tympanogram', 'Rinne', 'Weber', 'tuning fork', 'nystagmus', 'Dix-Hallpike', 'BPPV', 'Epley manoeuvre', 'Ménière disease',
    'vestibular neuritis', 'grommets', 'ventilation tube', 'myringotomy', 'tympanoplasty', 'mastoidectomy', 'Eustachian tube dysfunction',
    'nasal endoscopy', 'anterior rhinoscopy', 'nasal mucosa', 'turbinate', 'inferior turbinate', 'middle turbinate', 'paradoxical middle turbinate',
    'turbinate hypertrophy', 'concha bullosa', 'middle meatus', 'inferior meatus', 'septum', 'septal deviation', 'deviated nasal septum',
    'septoplasty', 'septal spur', 'columella', 'nasal vestibule', 'nasal valve', 'rhinorrhoea', 'postnasal drip', 'mucoid discharge',
    'nasopharynx', 'adenoids', 'adenoid hypertrophy', 'adenoidectomy', 'choana', 'nasal polyps', 'antrochoanal polyp', 'sinusitis',
    'rhinosinusitis', 'chronic rhinosinusitis', 'maxillary sinus', 'frontal sinus', 'ethmoid', 'sphenoid', 'ostiomeatal complex',
    'uncinate process', 'FESS', 'allergic rhinitis', 'epistaxis', "Little's area", 'cautery', 'anosmia', 'hyposmia', 'oropharynx',
    'oropharynx erythematous', 'oral vestibule', 'floor of mouth', "Wharton's duct", "Wharton's duct orifices", "Stensen's duct",
    'submandibular gland', 'parotid', 'sialolithiasis', 'sialadenitis', 'tonsillar hypertrophy', 'tonsillitis', 'tonsillectomy', 'exudate',
    'peritonsillar abscess', 'quinsy', 'uvula', 'soft palate', 'posterior pharyngeal wall', 'pharyngitis', 'hypopharynx', 'laryngoscopy',
    'flexible nasendoscopy', 'videostroboscopy', 'vocal cords', 'vocal fold nodules', 'vocal fold polyp', "Reinke's oedema", 'arytenoid',
    'epiglottis', 'vallecula', 'piriform fossa', 'glottic', 'supraglottic', 'subglottic', 'dysphonia', 'hoarseness', 'dysphagia', 'odynophagia',
    'globus', 'laryngopharyngeal reflux', 'snoring', 'obstructive sleep apnoea', 'polysomnography', 'Mallampati', 'leukoplakia', 'tongue base',
    'frenulum', 'tongue tie', 'trismus', 'thyroglossal cyst', 'branchial cyst', 'neck lump', 'fine needle aspiration', 'tracheostomy',
    'laryngomalacia', 'mometasone', 'fluticasone', 'budesonide', 'azelastine', 'oxymetazoline', 'xylometazoline', 'saline irrigation',
    'betahistine', 'ciprofloxacin ear drops', 'ofloxacin', 'montelukast',
  ],
  paediatrics: ['fontanelle', 'centile', 'growth chart', 'head circumference', 'developmental milestones', 'bronchiolitis', 'croup', 'gastroenteritis', 'febrile convulsion', 'pneumonia', 'breastfeeding', 'formula feeding', 'weaning', 'immunisation schedule', 'rotavirus', 'pneumococcal', 'measles', 'chickenpox', 'vitamin D', 'neonatal jaundice', 'phototherapy', 'colic', 'reflux', 'nappy rash', 'atopic eczema', 'undescended testis', 'phimosis', 'hypospadias', 'developmental dysplasia of the hip', 'enuresis', 'salbutamol', 'nebuliser', 'oral rehydration solution', 'preterm', 'corrected age', 'RSV', 'hypotonia'],
  cardiology: ['electrocardiogram', 'echocardiogram', 'exercise tolerance test', 'Holter monitor', 'coronary artery disease', 'myocardial infarction', 'STEMI', 'NSTEMI', 'angina', 'heart failure', 'ejection fraction', 'left ventricular hypertrophy', 'atrial fibrillation', 'atrial flutter', 'ventricular tachycardia', 'ectopic beats', 'sinus rhythm', 'bundle branch block', 'heart block', 'mitral regurgitation', 'aortic stenosis', 'pericarditis', 'pericardial effusion', 'coronary angiography', 'stent', 'pacemaker', 'ICD', 'anticoagulation', 'warfarin', 'apixaban', 'rivaroxaban', 'edoxaban', 'clopidogrel', 'ticagrelor', 'bisoprolol', 'ramipril', 'sacubitril valsartan', 'spironolactone', 'furosemide', 'atorvastatin', 'troponin', 'BNP', 'palpitations', 'syncope'],
  neurology: ['cranial nerves', 'facial palsy', "Bell's palsy", 'hemiparesis', 'power', 'tone', 'spasticity', 'rigidity', 'tremor', 'bradykinesia', 'ataxia', 'dysmetria', 'Romberg', 'sensory examination', 'neuropathy', 'carpal tunnel', 'migraine', 'aura', 'tension-type headache', 'cluster headache', 'epilepsy', 'seizure', 'EEG', 'EMG', 'stroke', 'transient ischaemic attack', 'dementia', "Alzheimer's disease", "Parkinson's disease", 'multiple sclerosis', 'myasthenia gravis', 'levetiracetam', 'sodium valproate', 'carbamazepine', 'lamotrigine', 'gabapentin', 'pregabalin', 'levodopa', 'donepezil', 'topiramate', 'triptan'],
  'internal-medicine': ['HbA1c', 'fasting glucose', 'insulin resistance', 'metformin', 'dyslipidaemia', 'LDL cholesterol', 'triglycerides', 'levothyroxine', 'iron deficiency anaemia', 'ferritin', 'vitamin B12', 'chronic kidney disease', 'eGFR', 'proteinuria', 'liver function tests', 'fatty liver', 'gastritis', 'dyspepsia', 'Helicobacter pylori', 'urinary tract infection', 'gout', 'uric acid', 'osteoporosis', 'body mass index', 'metabolic syndrome', 'amlodipine', 'losartan', 'empagliflozin', 'dapagliflozin', 'semaglutide'],
  psychiatry: ['mental state examination', 'mood', 'affect', 'blunted affect', 'anhedonia', 'depression', 'major depressive disorder', 'generalised anxiety disorder', 'panic disorder', 'obsessive-compulsive disorder', 'post-traumatic stress disorder', 'bipolar disorder', 'mania', 'hypomania', 'schizophrenia', 'psychosis', 'hallucinations', 'delusions', 'thought content', 'insight', 'suicidal ideation', 'insomnia', 'ADHD', 'autism spectrum disorder', 'anorexia nervosa', 'sertraline', 'escitalopram', 'fluoxetine', 'venlafaxine', 'mirtazapine', 'quetiapine', 'olanzapine', 'aripiprazole', 'lithium', 'methylphenidate', 'cognitive behavioural therapy'],
  'general-surgery': ['acute abdomen', 'appendicitis', 'appendicectomy', 'laparoscopic', 'laparotomy', 'cholecystitis', 'cholelithiasis', 'cholecystectomy', 'pancreatitis', 'inguinal hernia', 'umbilical hernia', 'incisional hernia', 'hernia repair', 'bowel obstruction', 'peritonitis', 'abscess', 'incision and drainage', 'wound infection', 'pilonidal sinus', 'haemorrhoids', 'anal fissure', 'fistula in ano', 'thyroidectomy', 'breast lump', 'mastectomy', 'sentinel lymph node', 'colonoscopy', "McBurney's point", "Murphy's sign", 'guarding', 'rebound tenderness', 'nasogastric tube', 'postoperative'],
  orthopaedics: ['fracture', 'displaced', 'undisplaced', 'reduction', 'plaster cast', 'splint', 'internal fixation', 'intramedullary nail', 'arthroscopy', 'total knee replacement', 'total hip replacement', 'meniscal tear', 'anterior cruciate ligament', 'posterior cruciate ligament', 'collateral ligament', 'Lachman test', 'anterior drawer', "McMurray's test", 'rotator cuff', 'impingement', 'tendinopathy', 'lateral epicondylitis', 'carpal tunnel syndrome', 'trigger finger', "de Quervain's", 'scoliosis', 'lumbar disc herniation', 'radiculopathy', 'spondylolisthesis', 'osteoarthritis', 'range of motion', 'effusion', 'crepitus', 'scaphoid', 'distal radius fracture', 'neck of femur fracture', 'ankle sprain', 'Achilles tendon', 'plantar fasciitis', 'hallux valgus'],
  dermatology: ['dermoscopy', 'macule', 'papule', 'plaque', 'nodule', 'vesicle', 'bulla', 'pustule', 'scale', 'crust', 'lichenification', 'hyperpigmentation', 'acne vulgaris', 'comedones', 'rosacea', 'seborrhoeic dermatitis', 'atopic dermatitis', 'contact dermatitis', 'psoriasis', 'lichen planus', 'urticaria', 'angioedema', 'vitiligo', 'alopecia areata', 'androgenetic alopecia', 'tinea pedis', 'onychomycosis', 'pityriasis versicolor', 'scabies', 'herpes zoster', 'molluscum contagiosum', 'naevus', 'dysplastic naevus', 'melanoma', 'basal cell carcinoma', 'squamous cell carcinoma', 'actinic keratosis', 'seborrhoeic keratosis', 'cryotherapy', 'punch biopsy', 'isotretinoin', 'topical steroid', 'tacrolimus', 'methotrexate', 'narrowband UVB'],
  ophthalmology: ['visual acuity', 'intraocular pressure', 'slit lamp', 'fundoscopy', 'optic disc', 'cup-to-disc ratio', 'macula', 'retina', 'vitreous', 'cornea', 'anterior chamber', 'cataract', 'glaucoma', 'open-angle glaucoma', 'diabetic retinopathy', 'macular degeneration', 'retinal detachment', 'conjunctivitis', 'keratitis', 'uveitis', 'blepharitis', 'chalazion', 'dry eye', 'myopia', 'hypermetropia', 'astigmatism', 'presbyopia', 'strabismus', 'amblyopia', 'refraction', 'optical coherence tomography', 'visual field', 'intravitreal injection', 'phacoemulsification', 'latanoprost', 'timolol', 'cyclopentolate', 'tropicamide'],
  'obstetrics-gynaecology': ['last menstrual period', 'gestational age', 'estimated due date', 'gravida', 'parity', 'miscarriage', 'fetal heart rate', 'fetal biometry', 'biparietal diameter', 'femur length', 'amniotic fluid', 'placenta', 'cervical length', 'CTG', 'pre-eclampsia', 'gestational diabetes', 'oral glucose tolerance test', 'hyperemesis gravidarum', 'placenta praevia', 'premature rupture of membranes', 'caesarean section', 'vaginal delivery', 'episiotomy', 'postnatal', 'speculum examination', 'bimanual examination', 'cervix', 'vaginal discharge', 'candidiasis', 'bacterial vaginosis', 'cervical screening', 'HPV', 'colposcopy', 'endometrium', 'endometriosis', 'fibroids', 'ovarian cyst', 'polycystic ovary syndrome', 'dysmenorrhoea', 'menorrhagia', 'amenorrhoea', 'menopause', 'contraception', 'intrauterine device', 'folic acid', 'transvaginal ultrasound'],
  urology: ['benign prostatic hyperplasia', 'PSA', 'digital rectal examination', 'lower urinary tract symptoms', 'frequency', 'nocturia', 'dysuria', 'haematuria', 'urinary retention', 'post-void residual', 'uroflowmetry', 'urinary incontinence', 'cystitis', 'pyelonephritis', 'prostatitis', 'epididymitis', 'renal calculi', 'ureteric stone', 'renal colic', 'hydronephrosis', 'cystoscopy', 'ureteroscopy', 'lithotripsy', 'TURP', 'varicocele', 'hydrocele', 'erectile dysfunction', 'semen analysis', 'tamsulosin', 'finasteride', 'solifenacin', 'mirabegron', 'tadalafil'],
  radiology: ['contrast-enhanced', 'non-contrast', 'hypodense', 'hyperdense', 'hypoechoic', 'hyperechoic', 'anechoic', 'heterogeneous', 'homogeneous', 'T1-weighted', 'T2-weighted', 'diffusion restriction', 'lesion', 'calcification', 'consolidation', 'ground-glass opacity', 'atelectasis', 'pleural effusion', 'pneumothorax', 'hepatic steatosis', 'BI-RADS', 'TI-RADS', 'metastasis', 'osteophyte'],
  anaesthesia: ['pre-operative assessment', 'ASA grade', 'Mallampati', 'intubation', 'difficult airway', 'laryngeal mask airway', 'general anaesthesia', 'spinal anaesthesia', 'epidural', 'nerve block', 'sedation', 'induction', 'propofol', 'midazolam', 'fentanyl', 'remifentanil', 'rocuronium', 'suxamethonium', 'sugammadex', 'sevoflurane', 'ketamine', 'dexmedetomidine', 'bupivacaine', 'lidocaine', 'ondansetron', 'dexamethasone', 'PONV', 'desaturation', 'end-tidal CO2', 'PCA'],
  'emergency-medicine': ['triage', 'Glasgow Coma Scale', 'cardiopulmonary resuscitation', 'defibrillation', 'asystole', 'ventricular fibrillation', 'PEA', 'acute coronary syndrome', 'chest pain', 'polytrauma', 'head injury', 'C-spine immobilisation', 'FAST scan', 'haemothorax', 'hypovolaemic shock', 'anaphylaxis', 'adrenaline', 'sepsis', 'lactate', 'overdose', 'activated charcoal', 'naloxone', 'hypoglycaemia', 'diabetic ketoacidosis', 'status epilepticus', 'burns', 'laceration', 'tetanus prophylaxis', 'arterial blood gas'],
  'rehabilitation-medicine': ['range of motion', 'muscle strength', 'spasticity', 'modified Ashworth', 'low back pain', 'neck pain', 'myofascial pain', 'trigger point', 'fibromyalgia', 'frozen shoulder', 'adhesive capsulitis', 'TENS', 'therapeutic ultrasound', 'kinesio taping', 'exercise programme', 'gait analysis', 'orthosis', 'shockwave therapy', 'dry needling'],
  'infectious-diseases': ['febrile neutropenia', 'bacteraemia', 'blood culture', 'procalcitonin', 'community-acquired pneumonia', 'cellulitis', 'osteomyelitis', 'meningitis', 'encephalitis', 'endocarditis', 'tuberculosis', 'interferon-gamma release assay', 'HIV', 'hepatitis B', 'hepatitis C', 'malaria', 'influenza', 'ceftriaxone', 'cefazolin', 'piperacillin-tazobactam', 'meropenem', 'vancomycin', 'teicoplanin', 'linezolid', 'doxycycline', 'azithromycin', 'clindamycin', 'metronidazole', 'fluconazole', 'aciclovir', 'valaciclovir', 'oseltamivir'],
  endocrinology: ['type 1 diabetes', 'type 2 diabetes', 'hypoglycaemia', 'basal insulin', 'bolus insulin', 'insulin pump', 'continuous glucose monitoring', 'SGLT2 inhibitor', 'DPP-4 inhibitor', 'GLP-1 receptor agonist', 'tirzepatide', "Hashimoto's thyroiditis", "Graves' disease", 'thyroid nodule', 'TSH', 'free T4', 'anti-TPO', 'carbimazole', 'propylthiouracil', 'hyperparathyroidism', 'parathyroid hormone', 'adrenal insufficiency', 'cortisol', "Cushing's syndrome", 'phaeochromocytoma', 'prolactinoma', 'pituitary', 'acromegaly', 'hirsutism', 'hypogonadism', 'testosterone'],
  gastroenterology: ['gastroscopy', 'colonoscopy', 'ERCP', 'endoscopic ultrasound', 'polypectomy', 'gastro-oesophageal reflux disease', 'oesophagitis', "Barrett's oesophagus", 'peptic ulcer', 'irritable bowel syndrome', 'inflammatory bowel disease', "Crohn's disease", 'ulcerative colitis', 'coeliac disease', 'diverticulitis', 'upper GI bleed', 'melaena', 'cirrhosis', 'ascites', 'varices', 'hepatic encephalopathy', 'cholestasis', 'pancreatitis', 'diarrhoea', 'constipation', 'bloating', 'omeprazole', 'lansoprazole', 'mesalazine', 'azathioprine', 'infliximab', 'adalimumab', 'ursodeoxycholic acid', 'lactulose', 'rifaximin'],
  nephrology: ['acute kidney injury', 'glomerular filtration rate', 'albuminuria', 'urine albumin-creatinine ratio', 'glomerulonephritis', 'nephrotic syndrome', 'nephritic syndrome', 'diabetic nephropathy', 'polycystic kidney disease', 'renal biopsy', 'haemodialysis', 'peritoneal dialysis', 'arteriovenous fistula', 'renal transplant', 'hyperkalaemia', 'hyponatraemia', 'metabolic acidosis', 'erythropoietin', 'secondary hyperparathyroidism', 'phosphate binder', 'fluid restriction'],
  rheumatology: ['rheumatoid arthritis', 'ankylosing spondylitis', 'axial spondyloarthritis', 'psoriatic arthritis', 'systemic lupus erythematosus', "Sjögren's syndrome", 'systemic sclerosis', 'vasculitis', "Behçet's disease", 'familial Mediterranean fever', 'pseudogout', 'polymyalgia rheumatica', 'giant cell arteritis', 'synovitis', 'morning stiffness', 'enthesitis', 'dactylitis', 'sacroiliitis', "Raynaud's phenomenon", 'rheumatoid factor', 'anti-CCP', 'ANA', 'anti-dsDNA', 'HLA-B27', 'hydroxychloroquine', 'sulfasalazine', 'leflunomide', 'colchicine', 'prednisolone', 'etanercept', 'tocilizumab', 'rituximab', 'DAS28'],
  oncology: ['malignancy', 'metastasis', 'staging', 'TNM', 'histopathology', 'immunohistochemistry', 'chemotherapy', 'adjuvant', 'neoadjuvant', 'radiotherapy', 'immunotherapy', 'targeted therapy', 'ECOG performance status', 'tumour markers', 'CEA', 'CA-125', 'lymphoma', 'leukaemia', 'mucositis', 'peripheral neuropathy', 'port-a-cath', 'palliative', 'disease progression', 'partial response', 'PET-CT', 'cisplatin', 'carboplatin', 'paclitaxel', 'docetaxel', 'capecitabine', 'oxaliplatin', 'pembrolizumab', 'nivolumab', 'trastuzumab', 'tamoxifen', 'letrozole', 'anastrozole'],
  'respiratory-medicine': ['spirometry', 'FEV1', 'FVC', 'reversibility', 'transfer factor', 'COPD exacerbation', 'bronchiectasis', 'interstitial lung disease', 'idiopathic pulmonary fibrosis', 'sarcoidosis', 'pulmonary embolism', 'lung nodule', 'obstructive sleep apnoea', 'CPAP', 'oxygen saturation', 'home oxygen', 'inhaler technique', 'formoterol', 'salmeterol', 'tiotropium', 'budesonide', 'montelukast', 'theophylline', 'bronchoscopy'],
  'thoracic-surgery': ['thoracotomy', 'VATS', 'lobectomy', 'segmentectomy', 'wedge resection', 'pneumonectomy', 'mediastinoscopy', 'chest drain', 'spontaneous pneumothorax', 'empyema', 'pleurodesis', 'decortication', 'thymoma', 'pectus excavatum', 'rib fracture', 'flail chest', 'air leak'],
  'plastic-surgery': ['rhinoplasty', 'blepharoplasty', 'facelift', 'abdominoplasty', 'liposuction', 'breast augmentation', 'breast reduction', 'mastopexy', 'breast reconstruction', 'flap', 'skin graft', 'fat grafting', 'scar revision', 'keloid', 'hypertrophic scar', 'tendon repair', 'cleft lip', 'cleft palate', 'otoplasty', 'seroma', 'haematoma', 'botulinum toxin', 'dermal filler', 'hyaluronic acid'],
  neurosurgery: ['craniotomy', 'craniectomy', 'subdural haematoma', 'extradural haematoma', 'subarachnoid haemorrhage', 'aneurysm', 'arteriovenous malformation', 'hydrocephalus', 'ventriculoperitoneal shunt', 'glioma', 'meningioma', 'pituitary adenoma', 'microdiscectomy', 'laminectomy', 'spinal stenosis', 'spinal fusion', 'pedicle screw', 'myelopathy', 'cauda equina syndrome', 'neurological deficit'],
  'cardiovascular-surgery': ['coronary artery bypass graft', 'CABG', 'saphenous vein graft', 'internal mammary artery', 'valve replacement', 'mitral valve repair', 'TAVI', 'aortic aneurysm', 'aortic dissection', 'EVAR', 'peripheral arterial disease', 'claudication', 'ankle-brachial pressure index', 'carotid stenosis', 'carotid endarterectomy', 'deep vein thrombosis', 'venous insufficiency', 'varicose veins', 'endovenous laser ablation', 'sternotomy', 'cardiopulmonary bypass'],
  'paediatric-surgery': ['orchidopexy', 'circumcision', 'pyloric stenosis', 'pyloromyotomy', 'intussusception', "Hirschsprung's disease", 'anorectal malformation', 'vesicoureteric reflux', 'pelviureteric junction obstruction', 'foreign body aspiration', 'oesophageal atresia', 'congenital diaphragmatic hernia', 'testicular torsion', 'ovarian torsion'],
  'family-medicine': ['health check', 'screening', 'cervical screening', 'immunisation', 'antenatal care', 'child health surveillance', 'smoking cessation', 'upper respiratory tract infection', 'tonsillopharyngitis', 'otitis media', 'gastroenteritis', 'back pain', 'headache', 'anxiety', 'medication review', 'chronic disease review', 'co-amoxiclav', 'cefuroxime', 'clarithromycin'],
  'sports-medicine': ['pre-participation screening', 'cardiopulmonary exercise test', 'VO2 max', 'lactate threshold', 'muscle strain', 'hamstring injury', 'Achilles tendinopathy', 'patellar tendinopathy', 'stress fracture', 'overuse injury', 'compartment syndrome', 'concussion', 'return to play', 'platelet-rich plasma', 'heat stroke', 'body composition'],
  'hair-transplant': ['androgenetic alopecia', 'Norwood scale', 'Ludwig scale', 'FUE', 'FUT', 'DHI', 'graft', 'follicular unit', 'donor area', 'recipient area', 'hairline', 'trichoscopy', 'minoxidil', 'finasteride', 'dutasteride', 'PRP', 'shock loss', 'folliculitis'],
  'aesthetic-surgery': ['rhinoplasty', 'blepharoplasty', 'facelift', 'neck lift', 'brow lift', 'abdominoplasty', 'liposuction', 'breast augmentation', 'mastopexy', 'silicone implant', 'brachioplasty', 'Brazilian butt lift', 'fat transfer', 'capsular contracture', 'seroma', 'compression garment'],
  'aesthetic-medicine': ['botulinum toxin', 'dermal filler', 'hyaluronic acid', 'mesotherapy', 'PRP', 'chemical peel', 'laser hair removal', 'fractional laser', 'radiofrequency microneedling', 'HIFU', 'thread lift', 'melasma', 'acne scarring', 'tear trough', 'lip filler', "crow's feet", 'glabellar lines', 'nasolabial folds', 'marionette lines', 'skin booster', 'polynucleotides'],
  'clinic-dermatology': ['dermoscopy', 'acne vulgaris', 'rosacea', 'melasma', 'psoriasis', 'vitiligo', 'naevus', 'actinic keratosis', 'cryotherapy', 'isotretinoin', 'chemical peel', 'phototherapy'],
  longevity: ['biological age', 'insulin resistance', 'HOMA-IR', 'apolipoprotein B', 'lipoprotein(a)', 'homocysteine', 'hs-CRP', 'omega-3 index', 'visceral fat', 'sarcopenia', 'VO2 max', 'heart rate variability', 'sleep quality', 'circadian rhythm', 'time-restricted eating', 'resistance training', 'zone 2', 'DEXA', 'creatine'],
  physiotherapy: ['range of motion', 'manual muscle testing', 'postural assessment', 'gait analysis', 'proprioception', 'manual therapy', 'mobilisation', 'manipulation', 'core stability', 'TENS', 'kinesio taping', 'dry needling', 'myofascial release', 'trigger point', 'ACL rehabilitation', 'home exercise programme'],
  'clinical-psychology': ['cognitive behavioural therapy', 'schema therapy', 'EMDR', 'acceptance and commitment therapy', 'psychodynamic', 'formulation', 'automatic thoughts', 'cognitive distortions', 'panic attack', 'social anxiety', 'trauma', 'grief', 'sleep hygiene', 'exposure', 'PHQ-9', 'GAD-7', 'risk assessment', 'protective factors'],
  dietetics: ['body mass index', 'waist circumference', 'body composition', 'basal metabolic rate', 'macronutrients', 'micronutrients', 'glycaemic index', 'food diary', 'Mediterranean diet', 'ketogenic diet', 'intermittent fasting', 'prediabetes', 'coeliac disease', 'gluten-free', 'lactose intolerance', 'sports nutrition'],
  'occupational-therapy': ['activities of daily living', 'instrumental activities of daily living', 'sensory integration', 'sensory processing', 'fine motor', 'gross motor', 'grip strength', 'bilateral coordination', 'visual perception', 'motor planning', 'executive function', 'cerebral palsy', 'splinting', 'adaptive equipment', 'home modification', 'activity analysis'],
  audiology: ['pure tone audiometry', 'speech audiometry', 'tympanometry', 'acoustic reflex', 'otoacoustic emissions', 'auditory brainstem response', 'newborn hearing screening', 'conductive hearing loss', 'sensorineural hearing loss', 'mixed hearing loss', 'hearing aid', 'cochlear implant', 'ear mould', 'tinnitus', 'videonystagmography', 'caloric test', 'audiogram', 'threshold', 'decibel', 'speech discrimination score'],
}

// Uzbekistan pack keys (Türkiye-shaped) → the role lists above.
const ROL_ESLEME: Record<string, string> = {
  'kulak-burun-bogaz': 'otolaryngology', pediatri: 'paediatrics', kardiyoloji: 'cardiology', noroloji: 'neurology', dahiliye: 'internal-medicine',
  psikiyatri: 'psychiatry', 'genel-cerrahi': 'general-surgery', ortopedi: 'orthopaedics', dermatoloji: 'dermatology', 'goz-hastaliklari': 'ophthalmology',
  'kadin-hastaliklari-dogum': 'obstetrics-gynaecology', uroloji: 'urology', radyoloji: 'radiology', anestezi: 'anaesthesia', 'acil-tip': 'emergency-medicine',
  'fizik-tedavi': 'rehabilitation-medicine', 'enfeksiyon-hastaliklari': 'infectious-diseases', endokrinoloji: 'endocrinology', gastroenteroloji: 'gastroenterology',
  nefroloji: 'nephrology', romatoloji: 'rheumatology', onkoloji: 'oncology', 'gogus-hastaliklari': 'respiratory-medicine', 'gogus-cerrahisi': 'thoracic-surgery',
  'plastik-cerrahi': 'plastic-surgery', 'beyin-cerrahisi': 'neurosurgery', 'kalp-damar-cerrahisi': 'cardiovascular-surgery', 'damar-cerrahisi': 'cardiovascular-surgery',
  'cocuk-cerrahisi': 'paediatric-surgery', 'aile-hekimligi': 'family-medicine', 'spor-hekimligi': 'sports-medicine', 'estetik-cerrahi': 'aesthetic-surgery',
  'medikal-estetik': 'aesthetic-medicine', 'klinik-dermatoloji': 'clinic-dermatology', fizyoterapi: 'physiotherapy', 'klinik-psikolog': 'clinical-psychology',
  diyetisyen: 'dietetics', diyetoloji: 'dietetics', odyoloji: 'audiology', surdoloji: 'audiology', 'cocuk-norolojisi': 'neurology', narkoloji: 'psychiatry',
  'alerji-immunoloji': 'internal-medicine', reproduktoloji: 'obstetrics-gynaecology',
}

const RU_CORE = [
  'жалобы', 'анамнез заболевания', 'анамнез жизни', 'объективно', 'общее состояние удовлетворительное', 'температура тела', 'артериальное давление',
  'частота сердечных сокращений', 'дыхание везикулярное', 'хрипов нет', 'тоны сердца ясные', 'ритм правильный', 'живот мягкий, безболезненный',
  'отёков нет', 'лимфатические узлы', 'гиперемия', 'гиперемирована', 'слизистое отделяемое', 'гнойное отделяемое', 'диагноз', 'сопутствующий диагноз',
  'лечение', 'рекомендации', 'контрольный осмотр', 'общий анализ крови', 'общий анализ мочи', 'С-реактивный белок', 'ультразвуковое исследование',
  'компьютерная томография', 'рентгенография', 'артериальная гипертензия', 'сахарный диабет', 'бронхиальная астма', 'парацетамол', 'ибупрофен',
  'амоксициллин', 'амоксициллин клавуланат', 'цефтриаксон', 'азитромицин', 'антигистаминный препарат',
]
const RU_ROL: Record<string, string[]> = {
  otolaryngology: [
    'отоскопия', 'барабанная перепонка', 'барабанные перепонки целы', 'перфорация барабанной перепонки', 'наружный слуховой проход', 'серная пробка',
    'отит', 'острый средний отит', 'экссудативный отит', 'наружный отит', 'холестеатома', 'мастоидит', 'тугоухость', 'кондуктивная тугоухость',
    'сенсоневральная тугоухость', 'шум в ушах', 'головокружение', 'нистагм', 'аудиометрия', 'тимпанометрия', 'передняя риноскопия', 'эндоскопия носа',
    'слизистая оболочка носа', 'носовая раковина', 'нижняя носовая раковина', 'средняя носовая раковина', 'парадоксально изогнутая средняя раковина',
    'гипертрофия носовых раковин', 'буллёзная раковина', 'средний носовой ход', 'нижний носовой ход', 'перегородка носа', 'искривление перегородки носа',
    'септопластика', 'ринорея', 'носоглотка', 'аденоиды', 'гипертрофия аденоидов', 'аденотомия', 'полипы носа', 'синусит', 'гайморит', 'фронтит',
    'этмоидит', 'аллергический ринит', 'носовое кровотечение', 'аносмия', 'ротоглотка', 'фарингоскопия', 'преддверие полости рта', 'дно полости рта',
    'вартонов проток', 'устья вартоновых протоков', 'стенонов проток', 'поднижнечелюстная слюнная железа', 'околоушная железа', 'сиалоаденит',
    'нёбные миндалины', 'гипертрофия миндалин', 'тонзиллит', 'хронический тонзиллит', 'тонзиллэктомия', 'паратонзиллярный абсцесс', 'язычок',
    'мягкое нёбо', 'задняя стенка глотки', 'фарингит', 'гортаноглотка', 'ларингоскопия', 'голосовые складки', 'узелки голосовых складок', 'надгортанник',
    'дисфония', 'осиплость', 'дисфагия', 'ларингофарингеальный рефлюкс', 'храп', 'обструктивное апноэ сна', 'трахеостомия', 'мометазон', 'флутиказон',
    'ксилометазолин', 'промывание носа', 'бетагистин',
  ],
}
// A short Uzbek (Latin) core list. NOT read by a native clinician yet (OPEN-COMMITMENTS DIKTE-TIBBI-01-UZ).
const UZ_CORE = ['shikoyatlar', 'anamnez', 'tashxis', 'davolash', 'tavsiyalar', 'harorat', 'qon bosimi', 'puls', 'quloq', 'burun', 'tomoq', 'otoskopiya', 'rinoskopiya', 'faringoskopiya', 'laringoskopiya']

const AMERIKAN: [RegExp, string][] = [
  [/oedema/g, 'edema'], [/Oedema/g, 'Edema'], [/oesophag/g, 'esophag'], [/Oesophag/g, 'Esophag'], [/oestrogen/g, 'estrogen'], [/rrhoea/g, 'rrhea'],
  [/pnoea/g, 'pnea'], [/anaem/g, 'anem'], [/haem/g, 'hem'], [/Haem/g, 'Hem'], [/aem/g, 'em'], [/paed/g, 'ped'], [/anaes/g, 'anes'],
  [/gynaec/g, 'gynec'], [/orthopaed/g, 'orthoped'], [/caesarean/g, 'cesarean'], [/coeliac/g, 'celiac'], [/tumour/g, 'tumor'], [/naevus/g, 'nevus'],
  [/manoeuvre/g, 'maneuver'], [/programme/g, 'program'], [/immunisation/g, 'immunization'], [/mobilisation/g, 'mobilization'],
  [/immobilisation/g, 'immobilization'], [/generalised/g, 'generalized'], [/behavioural/g, 'behavioral'], [/leucocyt/g, 'leukocyt'], [/nebuliser/g, 'nebulizer'],
  [/praevia/g, 'previa'], [/aciclovir/g, 'acyclovir'], [/paracetamol/g, 'acetaminophen'], [/adrenaline/g, 'epinephrine'],
  [/co-amoxiclav/g, 'amoxicillin-clavulanate'], [/grommets/g, 'tympanostomy tubes'],
]
// United States only: Canada keeps the international name.
const YALNIZ_ABD: [RegExp, string][] = [[/salbutamol/g, 'albuterol']]

function rolKey(sablon: string): string { return ROL_ESLEME[sablon] || sablon }

/** The keyterms for one recording. Order: the role's own terms first, then the core list. Pure. */
export function konusmaAnahtarTerimleri(notDili: DilKodu, sablon: string, azami = KONUSMA_TERIM_AZAMI): string[] {
  const key = rolKey(sablon)
  let liste: string[]
  if (notDili === 'ru' || notDili === 'uz-Latn' || notDili === 'uz-Cyrl') {
    liste = [...(RU_ROL[key] || []), ...RU_CORE, ...UZ_CORE]
  } else {
    liste = [...(EN_ROL[key] || []), ...EN_CORE]
    if (notDili === 'en-US' || notDili === 'en-CA') liste = liste.map((t) => AMERIKAN.reduce((s, [re, y]) => s.replace(re, y), t))
    if (notDili === 'en-US') liste = liste.map((t) => YALNIZ_ABD.reduce((s, [re, y]) => s.replace(re, y), t))
  }
  const out: string[] = []
  const gorulen = new Set<string>()
  for (const t of liste) {
    if (out.length >= Math.min(azami, KONUSMA_TERIM_AZAMI)) break
    const s = t.replace(/\s+/g, ' ').trim()
    if (!s || s.length > 50 || YASAK.test(s) || s.split(' ').length > 5) continue
    const k = s.toLowerCase()
    if (gorulen.has(k)) continue
    gorulen.add(k)
    out.push(s)
  }
  return out
}

/** Role slugs this file has a list for (tests: every role of every pack resolves to one, or to the core list). */
export const KONUSMA_ROL_ANAHTARLARI = Object.keys(EN_ROL)
