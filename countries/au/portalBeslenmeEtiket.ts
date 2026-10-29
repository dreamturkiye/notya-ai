/**
 * AU dietetics — patient-facing meal plan / food diary labels (en-AU).
 * Carried on the portal payload so other countries' catalogues stay untouched.
 */
export const AU_BESLENME_ETIKET = {
  sekmeBaslik: 'Meal plan & diary',
  planBaslik: 'Your meal plan',
  planYok: 'Your dietitian has not kept a meal plan on this page yet.',
  kahvalti: 'Breakfast',
  ogle: 'Lunch',
  aksam: 'Dinner',
  atistirmalik: 'Snacks',
  notlar: 'Notes from your dietitian',
  gunlukBaslik: 'Food diary',
  gunlukYok: 'No diary entries yet. You can add a short note below.',
  gunlukEkle: 'Add what you ate',
  gun: 'Date',
  ogun: 'Meal or snack',
  aciklama: 'Short description',
  kaydet: 'Keep this note',
  kaydedildi: 'Saved. Your dietitian can see it on your file.',
  kaydedilemedi: 'That note could not be saved. Try again.',
  ogunAdi: {
    kahvalti: 'Breakfast',
    ogle: 'Lunch',
    aksam: 'Dinner',
    atistirmalik: 'Snack',
    diger: 'Other',
  },
  kimAdi: {
    diyetisyen: 'Dietitian',
    hasta: 'You',
  },
} as const
