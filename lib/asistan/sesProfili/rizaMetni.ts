/**
 * NOTYA-SES-PROFILI-01 — explicit consent texts for the doctor voice profile (KVKK biometric data).
 *
 * PENDING LAWYER REVIEW (Kaan, 2026-10-07): both texts are drafts. A Turkish lawyer must review them before this
 * step is shown to real doctors (docs/OPEN-COMMITMENTS.md NOTYA-SES-PROFILI-a). Replace them here only — the
 * onboarding step, Ayarlar and the /kvkk#ses-profili section all read this file.
 *
 * Data controller and contact are taken from the existing /kvkk page ("Dream Türkiye", kvkk@notya.ai). The lawyer
 * should confirm whether the full trade title (ticaret unvanı) must replace "Dream Türkiye".
 */

export const RIZA_VERI_SORUMLUSU = 'Dream Türkiye'
export const RIZA_ILETISIM = 'kvkk@notya.ai'

/** /kvkk anchor of the full text. Opened in a new tab so the doctor does not lose their place in onboarding. */
export const RIZA_METNI_YOLU = '/kvkk#ses-profili'

/** The checkbox line. The last words are the link to the full text. */
export const RIZA_KUTUSU_METNI = "Sesimden bir ses profili oluşturulmasına ve Ayşe'nin beni tanıması için kullanılmasına açık rıza veriyorum. Ses kaydım saklanmaz; profili dilediğim an silebilirim."
export const RIZA_BAGLANTI_METNI = 'Açık rıza metnini oku'

export const RIZA_TAM_BASLIK = 'Ses Profili İçin Açık Rıza Metni'

export const RIZA_TAM_GIRIS = `${RIZA_VERI_SORUMLUSU} (Notya) tarafından sunulan sesli asistanın, muayene odasındaki diğer seslerden hekimin sesini ayırt edebilmesi amacıyla, sesimden matematiksel bir ses profili oluşturulmasına ve bu profilin işlenmesine açık rıza veriyorum.`

export const RIZA_TAM_ARA_BASLIK = 'Bilgilendirildiğim hususlar:'

export const RIZA_TAM_MADDELER = [
  "Ses profili, 6698 sayılı Kanun'un 6. maddesi kapsamında özel nitelikli kişisel veri (biyometrik veri) sayılır ve yalnızca açık rızama dayanılarak işlenir.",
  'Kayıt sırasında okuduğum cümlelerin ses kaydı saklanmaz; yalnızca bu kayıttan türetilen matematiksel profil saklanır.',
  'Profil yalnızca yukarıdaki amaçla kullanılır; kimlik doğrulama, oturum açma veya başka bir amaçla kullanılmaz ve üçüncü kişilerle paylaşılmaz.',
  'Profil, hesabım açık kaldığı sürece veya ben silene kadar saklanır. Ayarlar bölümünden dilediğim an silebilirim; sildiğimde derhal ve geri dönüşsüz olarak yok edilir.',
  "Bu rızayı vermek zorunda değilim. Rıza vermemem veya rızamı geri almam, Notya'yı kullanmama engel olmaz; asistan ses profili olmadan da çalışır.",
  `Kanun'un 11. maddesindeki haklarımı ${RIZA_ILETISIM} üzerinden kullanabilirim.`,
] as const
