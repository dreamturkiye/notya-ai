# Uzbek landing page: copy

Text of the Uzbek landing page as rebuilt on 2026-10-08 to match the Turkish doctor landing page section for section (Kaan: "I need a landing page just like this for Uzbek"). Source of truth: `countries/uz/acilis/icerik.ts`. A test fails when a line on the page is missing from this file.

**Changed on 2026-10-09 (NOTYA-UZ-FIYAT-UNVAN-01), on the owner's instruction:** section 10 now shows prices in soʻm, converted from the Turkish page's prices ("On the landing page convert the turkish prices to Uzbek prices in turn. Use todays exchnage prices."), and the assistant is named the way the Turkish page names its own ("If prof. is used then follow the same turkish naming convention."). The amounts are not in the copy: they are data (`countries/uz/acilis/fiyatlar.ts`, with the exchange rate and every figure). The name is not in the copy either: it is read from the owner's list of assistant names (`countries/uz/klinik/asistanAdlari.ts`), so the tables below show it as the page does.

**All of it is machine-written.** Nobody who speaks Uzbek or Russian natively has read it. A native speaker must read every line, and a clinician must read the example visits (drug, dose, wording), before the page is shown to anyone outside the team.

The page exists in three forms: Uzbek in Latin script (default), Uzbek in Cyrillic script, and Russian. The tables below give Uzbek Latin and Russian with English beside each line. The Cyrillic form is the same Uzbek text written in Cyrillic letters, line for line (`UZ_CYRL` in the catalogue); it is reached from the footer of the page or at `/uzbek?dil=uz-Cyrl`.

The page is hidden from search engines, is in no sitemap, and no Turkish page links to it.

## Keep, Adapt or Drop, section by section

Keep = same meaning, translated naturally. Adapt = same section, content changed to be true for Uzbekistan. Drop = exists only in Türkiye.

| Turkish section | Decision | Why |
|---|---|---|
| Top bar | Adapt | Same bar and the same five numbered links. Added: the Uzbek / Russian switch. "15 days free" became "Request a price" (no trial is promised); "Giriş" leads to the Uzbek login. |
| Hero | Adapt | Same headline idea, same photograph, two buttons. The assistant is named as on the Turkish page: short title and given name of the paediatrics persona ("Prof. Malika" where the Turkish page says "Prof. Ayşe"). Main button: request a price. Second button scrolls to the typed illustration in section 01 of the same page. |
| 01 Conversation | Adapt | Same three typed example visits. The assistant is named as on the Turkish page ("Prof. Malika" on each visit, "Malika" as the speaker); "real-time Turkish transcription" became "the conversation becomes text, in Uzbek or Russian"; "SOAP note" became "medical note". In the examples: no brand name, no "according to the guideline". |
| 02 End of the visit | Keep | Same meaning. "Rapor" is rendered as a medical report in general, not a Turkish payer report. |
| 03 Patient portal | Keep | Same meaning. |
| 04 Consultation | Keep | Same meaning. |
| 05 Appointments and communication | Keep | Same meaning; "secretary" is the receptionist (registrator), the usual role in a clinic there. |
| 06 Specialties | Adapt | "30 specialties" is stated as what Notya is designed for, with "switched on step by step". The list of names is written for this page; the Turkish page reads Türkiye's specialty registry, which is not used. |
| 07 Follow-up | Keep | Same meaning. |
| 08 Learning | Adapt | Same idea, same photograph. The assistant is not named in this section (nor is it on the Turkish page); the example asks which form the doctor prefers, not which brand. In Russian the closing line says "she remembered", because the featured assistant is a woman. |
| 09 Safety net | Adapt | Same quote idea and photograph. The Turkish reimbursement rule and "according to the guideline" are gone. The four facts under it say what the product does (encryption, each doctor sees only their own patients, the doctor approves every step, decision support) and name no law. |
| 10 Price | Adapt | Same layout and order as the Turkish section: the doctor / clinic switch, three plans for one doctor with a monthly price, four clinic plans by request, the badge on the same two plans, one line under each list. Prices are the Turkish prices converted to soʻm at the Central Bank of Uzbekistan's rate of 9 October 2026 and rounded to the nearest 10 000 soʻm; no lira sign, code or amount is shown. Left out: the free trial and "no credit card" (sign-up is by invitation code, and the line says so), the Turkish reimbursement warnings (the line keeps "dose warnings"). The tax is not named ("taxes are not included"). The badge says "We recommend", not "most chosen": nobody has chosen yet. Every button leads to the request form. |
| Closing section (trial sign-up form) | Adapt | Same dark-green section with a form card. The trial sign-up form became the existing Uzbek "request a price" form (opens the visitor's mail app; nothing is stored). Sign-up stays by invitation code, linked beside the form. |
| Footer | Adapt | Same footer. The company line with its city, the Turkish legal page and the line of Turkish compliance marks are gone. The bottom row lists the three forms of the page (Uzbek Latin, Uzbek Cyrillic, Russian). |
| Hero strip: "30 specialties" | Adapt | Phrased as "designed for 30 specialties". |
| Hero strip: "By voice, in real time" | Adapt | "By voice, in Uzbek and Russian": the Uzbek version records and then writes; it is not real-time. |
| Price: "first 15 days free", "no credit card needed" | Drop | No trial is offered in Uzbekistan: sign-up is by invitation code. |
| Price: the plans, the annual offer (two months), the founding-doctor discount (40% for 12 months for the first 50 doctors) | Keep | Mirrored from the Turkish page on the owner's instruction of 2026-10-09. **Each is a commercial promise the owner has still to confirm for Uzbekistan** (`docs/OPEN-COMMITMENTS.md`, NOTYA-UZ-FIYAT-UNVAN-01). |
| Security: the Turkish data-protection law and the Turkish reimbursement rulebook | Drop | Türkiye only. No Uzbek law is named in their place: none has been confirmed by a lawyer. |
| Footer: Turkish legal page link, company city, compliance line | Drop | Türkiye only. |
| The assistant's Turkish name and title | Adapt | The Turkish name is never shown. Its place is taken by the Uzbek counterpart of the same persona, with the same title in the same short form ("Prof. Malika"; in Cyrillic and Russian «Проф. Малика»). No biography: no years of practice, no place of work, no degree. |

No whole section of the Turkish page was dropped: all twelve are on the Uzbek page, in the same order.

## What was removed from the Turkish page, and why

- **The assistant's Turkish name.** Replaced by the Uzbek counterpart of the same persona, titled as on the Turkish page (2026-10-09).
- **Every amount in lira, the lira sign, the free trial, "no credit card", the "most chosen" wording.** Prices are shown in soʻm; sign-up is by invitation code only; the badge says "we recommend".
- **The name of the tax.** The line says "taxes are not included" and names none.
- **The Turkish data-protection law, the reimbursement rulebook, "according to the guideline".** They are Türkiye's; no Uzbek law, protocol or reference is named because none has been confirmed.
- **The brand name of a medicine in the example visits.** Replaced by the generic name; local brand names are not verified.
- **"Real-time" transcription.** Not true of the Uzbek version.
- **The trial sign-up form** (name, e-mail, specialty → Türkiye's registration page). Replaced by the existing Uzbek request form.
- **The specialty list read from Türkiye's registry.** Replaced by 30 names written for this page.
- **Company city, Turkish legal page, Turkish support line.**
- Never present, as before: any state system, the voice profile, image evaluation, a public demo.

## The copy

### Top bar

| Key | Uzbek (Latin) | Russian | English |
|---|---|---|---|
| `nav.bolumler` | Boʻlimlar | Разделы | Sections |
| `nav.mobil` | Mobil menyu | Мобильное меню | Mobile menu |
| `nav.dil` | Til | Язык | Language |
| `nav.havolalar[1].etiket` | Yordamchi | Помощник | Assistant |
| `nav.havolalar[1].no` | 01 | 01 | 01 |
| `nav.havolalar[2].etiket` | Portal | Портал | Portal |
| `nav.havolalar[2].no` | 03 | 03 | 03 |
| `nav.havolalar[3].etiket` | Yoʻnalishlar | Специальности | Specialties |
| `nav.havolalar[3].no` | 06 | 06 | 06 |
| `nav.havolalar[4].etiket` | Xavfsizlik | Безопасность | Security |
| `nav.havolalar[4].no` | 09 | 09 | 09 |
| `nav.havolalar[5].etiket` | Narx | Цена | Price |
| `nav.havolalar[5].no` | 10 | 10 | 10 |
| `nav.giris` | Kirish | Войти | Log in |
| `nav.girisUzun` | Hisobga kirish | Войти в аккаунт | Log in to your account |
| `nav.sorov` | Narxni soʻrash | Запросить цену | Request a price |
| `nav.menyuAc` | Menyuni ochish | Открыть меню | Open the menu |
| `nav.menyuYop` | Menyuni yopish | Закрыть меню | Close the menu |

### Hero and the strip under it

| Key | Uzbek (Latin) | Russian | English |
|---|---|---|---|
| `kahraman.ustBaslik` | Shifokorlar uchun sunʼiy intellektli klinik yordamchi | Клинический ИИ-помощник для врачей | AI clinical assistant for doctors |
| `kahraman.baslik` | Bemor xonadan chiqqanda | Пациент вышел из кабинета — | When the patient leaves the room |
| `kahraman.baslikVurgu` | ishingiz bitgan boʻlsin. | и ваша работа уже сделана. | let your work be done. |
| `kahraman.giris` | Prof. Malika qabulni tinglaydi, tibbiy yozuvni yozadi, retsept va xulosa qoralamasini tayyorlaydi, bemorni kuzatuvda tutadi. Har bir qaror faqat sizning tasdigʻingiz bilan kuchga kiradi. | Проф. Малика слушает приём, пишет медицинскую запись, готовит черновик рецепта и заключения, держит пациента под наблюдением. Каждое решение вступает в силу только после вашего подтверждения. | Prof. Malika listens to the visit, writes the medical note, prepares the draft prescription and report, and keeps the patient under follow-up. Every decision takes effect only with your approval. |
| `kahraman.birinciDugme` | Narxni soʻrash | Запросить цену | Request a price |
| `kahraman.ikinciDugme` | Qabulni koʻring | Посмотреть приём | See a visit |
| `kahraman.gorselAlt` | Kunduzgi yorugʻlikdagi xususiy shifokor xonasi: koʻrik kushetkasi, stetoskop, tonometr va diplomlar | Частный врачебный кабинет при дневном свете: кушетка для осмотра, стетоскоп, тонометр и дипломы | A private doctor's room in daylight: examination couch, stethoscope, blood-pressure monitor and diplomas |
| `kahraman.gorselAlti` | Shifokor xonasi · tasviriy surat | Кабинет врача · иллюстрация | Doctor's room · illustrative picture |
| `kahraman.serit[1]` | 30 yoʻnalish uchun moʻljallangan | Рассчитан на 30 специальностей | Designed for 30 specialties |
| `kahraman.serit[2]` | Ovozli, oʻzbek va rus tillarida | Голосом, на узбекском и русском | By voice, in Uzbek and Russian |
| `kahraman.serit[3]` | Bemor portali bilan birga | Вместе с порталом пациента | Together with the patient portal |
| `kahraman.serit[4]` | Har bir qadam shifokor tasdigʻi bilan | Каждый шаг подтверждает врач | Every step with the doctor's approval |

### 01 — Conversation

| Key | Uzbek (Latin) | Russian | English |
|---|---|---|---|
| `suhbat.ustBaslik` | 01 — Suhbat | 01 — Разговор | 01 — Conversation |
| `suhbat.baslik` | Ikki hamkasb | Говорите, | Talk like |
| `suhbat.baslikVurgu` | kabi gaplashing. | как двое коллег. | two colleagues. |
| `suhbat.govde` | Bir marta bosing — Prof. Malika tinglay boshlaydi. Gapini boʻlsangiz, jim boʻladi. Tugma bosib turish shart emas. | Нажмите один раз — Проф. Малика начинает слушать. Перебьёте — замолчит. Удерживать кнопку не нужно. | Tap once — Prof. Malika starts listening. Interrupt and she falls silent. No need to hold a button. |
| `suhbat.maddeler[1]` | Suhbat oʻzbek yoki rus tilida matnga aylanadi | Разговор на узбекском или русском превращается в текст | The conversation becomes text, in Uzbek or Russian |
| `suhbat.maddeler[2]` | Tibbiy yozuv qabul tugashi bilan tayyor | Медицинская запись готова, как только приём окончен | The medical note is ready as soon as the visit ends |
| `suhbat.sekmeler` | Qabul namunalari | Примеры приёмов | Sample visits |
| `suhbat.yozmoqda` | yozmoqda | пишет | writing |
| `suhbat.tayyor` | tayyor | готово | ready |
| `suhbat.izoh` | Bu qabullar toʻqima namunalardir. Haqiqiy klinikada har bir jumla shifokor tasdigʻiga bogʻliq. | Эти приёмы — вымышленные примеры. В настоящей клинике каждая фраза зависит от подтверждения врача. | These visits are fictional examples. In a real clinic every sentence depends on the doctor's approval. |
| `suhbat.sahneler[1].meta` | 1-qabul | Приём 1 | Visit 1 |
| `suhbat.sahneler[1].yordamchi` | Prof. Malika | Проф. Малика | Prof. Malika (the featured assistant, short title and given name) |
| `suhbat.sahneler[1].alan` | Pediatriya | Педиатрия | Pediatrics |
| `suhbat.sahneler[1].saat` | 09:14 | 09:14 | 09:14 |
| `suhbat.sahneler[1].navbatlar[1].kim` | Shifokor | Врач | Doctor |
| `suhbat.sahneler[1].navbatlar[1].matn` | 7 yosh, 18 kilogramm. Isitma va quloq ogʻrigʻi. | 7 лет, 18 килограммов. Температура и боль в ухе. | 7 years old, 18 kilograms. Fever and ear pain. |
| `suhbat.sahneler[1].navbatlar[2].kim` | Malika | Малика | Malika (the given name alone, as the speaker) |
| `suhbat.sahneler[1].navbatlar[2].matn` | Oʻtkir oʻrta otitga mos keladi. Amoksitsillin 40 mg/kg/kun — bu vaznda kuniga 720 mg. Yoki amoksitsillin-klavulanatni afzal koʻrasizmi? | Похоже на острый средний отит. Амоксициллин 40 мг/кг/сут — при этом весе 720 мг в сутки. Или вы предпочитаете амоксициллин-клавуланат? | Consistent with acute otitis media. Amoxicillin 40 mg/kg/day — at this weight 720 mg a day. Or do you prefer amoxicillin-clavulanate? |
| `suhbat.sahneler[2].meta` | Xavfsizlik toʻri | Страховочная сеть | Safety net |
| `suhbat.sahneler[2].yordamchi` | Prof. Malika | Проф. Малика | Prof. Malika (the featured assistant, short title and given name) |
| `suhbat.sahneler[2].alan` | Pediatriya | Педиатрия | Pediatrics |
| `suhbat.sahneler[2].saat` | 18:47 | 18:47 | 18:47 |
| `suhbat.sahneler[2].navbatlar[1].kim` | Shifokor | Врач | Doctor |
| `suhbat.sahneler[2].navbatlar[1].matn` | Amoksitsillin 500 mg yozing, kuniga uch mahal. | Запишите амоксициллин 500 мг, три раза в день. | Write amoxicillin 500 mg, three times a day. |
| `suhbat.sahneler[2].navbatlar[2].kim` | Ogohlantirish | Предупреждение | Warning |
| `suhbat.sahneler[2].navbatlar[2].matn` | Doktor, bir daqiqa — bu kattalar dozasi. Bu vaznda bir martalik doza 250 mg dan oshmasligi kerak. Tuzataymi? | Доктор, одну минуту — это взрослая доза. При этом весе разовая доза не должна превышать 250 мг. Исправить? | Doctor, one moment — this is an adult dose. At this weight a single dose should not exceed 250 mg. Shall I correct it? |
| `suhbat.sahneler[3].meta` | 10-qabul | Приём 10 | Visit 10 |
| `suhbat.sahneler[3].yordamchi` | Prof. Malika | Проф. Малика | Prof. Malika (the featured assistant, short title and given name) |
| `suhbat.sahneler[3].alan` | Pediatriya | Педиатрия | Pediatrics |
| `suhbat.sahneler[3].saat` | 11:03 | 11:03 | 11:03 |
| `suhbat.sahneler[3].navbatlar[1].kim` | Shifokor | Врач | Doctor |
| `suhbat.sahneler[3].navbatlar[1].matn` | Amoksitsillin yozing. | Запишите амоксициллин. | Write amoxicillin. |
| `suhbat.sahneler[3].navbatlar[2].kim` | Malika | Малика | Malika (the given name alone, as the speaker) |
| `suhbat.sahneler[3].navbatlar[2].matn` | 40 mg/kg/kun, bu vaznda kuniga 720 mg. Siz odatda amoksitsillin-klavulanatni tanlaysiz — shuni yozaymi, doktor? | 40 мг/кг/сут, при этом весе 720 мг в сутки. Обычно вы выбираете амоксициллин-клавуланат — записать его, доктор? | 40 mg/kg/day, at this weight 720 mg a day. You usually choose amoxicillin-clavulanate — shall I write that, doctor? |

### 02 — End of the visit

| Key | Uzbek (Latin) | Russian | English |
|---|---|---|---|
| `qabul.ustBaslik` | 02 — Qabul yakuni | 02 — Завершение приёма | 02 — End of the visit |
| `qabul.baslik` | Qabul bitta oqimda | Приём закрывается | The visit closes |
| `qabul.baslikVurgu` | yopiladi. | одним потоком. | in one flow. |
| `qabul.govde` | Qabul yakunidagi qadamlar tartib bilan oldingizda turadi. Keraksiz qadamni oʻtkazib yuborasiz. | Шаги в конце приёма стоят перед вами по порядку. Ненужный шаг вы пропускаете. | The steps at the end of the visit are in front of you, in order. You skip the step you do not need. |
| `qabul.maddeler[1]` | Oʻz qabul shablonlaringiz bir bosishda | Ваши шаблоны приёма — одним нажатием | Your own visit templates in one tap |
| `qabul.maddeler[2]` | Keyingi qabul bemor ketmasidan belgilanadi | Следующий приём назначается, пока пациент ещё в кабинете | The next visit is set before the patient leaves |
| `qabul.maddeler[3]` | Bemor qabul xulosasini oʻz portalida koʻradi | Пациент видит итог приёма в своём портале | The patient sees the visit summary in their own portal |
| `qabul.kart.etiket` | Qabul yakuni | Завершение приёма | End of the visit |
| `qabul.kart.satirlar[1].k` | Retsept qoralamasi | Черновик рецепта | Prescription draft |
| `qabul.kart.satirlar[1].mark` | 01 | 01 | 01 |
| `qabul.kart.satirlar[2].k` | Tibbiy xulosa | Медицинское заключение | Medical report |
| `qabul.kart.satirlar[2].mark` | 02 | 02 | 02 |
| `qabul.kart.satirlar[3].k` | Keyingi qabul | Следующий приём | Next visit |
| `qabul.kart.satirlar[3].mark` | 03 | 03 | 03 |
| `qabul.kart.satirlar[4].k` | Bemor uchun xulosa | Итог для пациента | Summary for the patient |
| `qabul.kart.satirlar[4].mark` | 04 | 04 | 04 |
| `qabul.kart.not` | Har bir qadam sizning tasdigʻingiz bilan yakunlanadi. | Каждый шаг завершается вашим подтверждением. | Every step is completed with your approval. |

### 03 — Patient portal

| Key | Uzbek (Latin) | Russian | English |
|---|---|---|---|
| `portal.ustBaslik` | 03 — Bemor portali | 03 — Портал пациента | 03 — Patient portal |
| `portal.baslik` | Bemoringiz qabulxonangizni | Пациент носит ваш кабинет | Your patient carries your practice |
| `portal.baslikVurgu` | choʻntagida olib yuradi. | в кармане. | in their pocket. |
| `portal.govde` | Har bir bemorga alohida, himoyalangan sahifa: qabul xulosasi, natijalar, dorilar, kuzatuv rejasi va sizga yozilgan xabarlar. Ilova oʻrnatish shart emas. | Отдельная защищённая страница для каждого пациента: итог приёма, результаты, лекарства, план наблюдения и сообщения для вас. Устанавливать приложение не нужно. | A separate, protected page for every patient: visit summary, results, medicines, follow-up plan and the messages written to you. No app to install. |
| `portal.maddeler[1]` | Mazmun yoʻnalishga qarab tartiblangan | Содержание выстроено по специальности | Content arranged by specialty |
| `portal.maddeler[2]` | Qabulga yozilish soʻrovi va eslatmalar | Запрос на приём и напоминания | Appointment requests and reminders |
| `portal.maddeler[3]` | Bemorga koʻrsatiladigan har bir maʼlumot shifokor tasdigʻidan oʻtadi | Всё, что видит пациент, проходит подтверждение врача | Everything shown to the patient passes the doctor's approval |
| `portal.kart.etiket` | Bemor sahifasi | Страница пациента | The patient's page |
| `portal.kart.satirlar[1].k` | Qabul xulosasi | Итог приёма | Visit summary |
| `portal.kart.satirlar[2].k` | Natijalar | Результаты | Results |
| `portal.kart.satirlar[3].k` | Dorilar | Лекарства | Medicines |
| `portal.kart.satirlar[4].k` | Kuzatuv rejasi | План наблюдения | Follow-up plan |
| `portal.kart.satirlar[5].k` | Xabarlar | Сообщения | Messages |
| `portal.kart.not` | Bitta havola. Ilova kerak emas. | Одна ссылка. Приложение не нужно. | One link. No app needed. |

### 04 — Colleague consultation

| Key | Uzbek (Latin) | Russian | English |
|---|---|---|---|
| `maslahat.ustBaslik` | 04 — Hamkasb maslahati | 04 — Консультация коллеги | 04 — Colleague consultation |
| `maslahat.baslik` | Hamkasb maslahati, | Консультация коллеги, | A colleague's opinion, |
| `maslahat.baslikVurgu` | telefon qoʻngʻiroqlarisiz. | без телефонных звонков. | without phone calls. |
| `maslahat.govde` | Qabuldan chiqmay turib soʻrov oching; maslahatchi shifokor oʻziga kelgan himoyalangan havola orqali javob qoldiradi. Javob bemor kartasiga yoziladi. | Откройте запрос, не выходя с приёма; врач-консультант оставит ответ по защищённой ссылке, которая придёт ему. Ответ записывается в карту пациента. | Open a request without leaving the visit; the consulting doctor leaves an answer through the protected link sent to them. The answer is written into the patient's file. |
| `maslahat.maddeler[1]` | Ishonchli maslahatchilaringiz roʻyxati | Список консультантов, которым вы доверяете | A list of the consultants you trust |
| `maslahat.maddeler[2]` | Javobi kutilayotgan soʻrovlar bitta roʻyxatda | Запросы, ожидающие ответа, — в одном списке | Requests awaiting an answer, in one list |
| `maslahat.maddeler[3]` | Maslahatchiga hisob ochish shart emas | Консультанту не нужно заводить аккаунт | The consultant does not need to open an account |
| `maslahat.kart.etiket` | Maslahat | Консультация | Consultation |
| `maslahat.kart.satirlar[1].k` | Soʻrov | Запрос | Request |
| `maslahat.kart.satirlar[1].v` | Qabuldan chiqmay turib | Не выходя с приёма | Without leaving the visit |
| `maslahat.kart.satirlar[2].k` | Himoyalangan havola | Защищённая ссылка | Protected link |
| `maslahat.kart.satirlar[2].v` | Maslahatchi shifokorga | Врачу-консультанту | To the consulting doctor |
| `maslahat.kart.satirlar[3].k` | Javob | Ответ | Answer |
| `maslahat.kart.satirlar[3].v` | Bemor kartasida | В карте пациента | In the patient's file |

### 05 — Schedule and communication

| Key | Uzbek (Latin) | Russian | English |
|---|---|---|---|
| `jadval.ustBaslik` | 05 — Qabul jadvali va aloqa | 05 — Расписание и связь | 05 — Schedule and communication |
| `jadval.baslik` | Registraturangiz ham | Ваша регистратура — | Your front desk too |
| `jadval.baslikVurgu` | shu tizimda. | в той же системе. | is in this system. |
| `jadval.govde` | Qabul jadvali, eslatmalar va bemor xabarlari bir joyda. Registrator oʻz hisobi bilan faqat oʻziga kerakli narsani koʻradi. | Расписание приёмов, напоминания и сообщения пациентов — в одном месте. Регистратор работает под своим аккаунтом и видит только то, что ему нужно. | The appointment schedule, reminders and patient messages in one place. The receptionist, with their own account, sees only what they need. |
| `jadval.maddeler[1]` | Kelgan hujjatlar bemor kartasiga biriktiriladi | Входящие документы прикрепляются к карте пациента | Incoming documents are attached to the patient's file |
| `jadval.maddeler[2]` | Registrator hisobi alohida huquq bilan ishlaydi | Аккаунт регистратора работает с отдельными правами | The receptionist's account works with separate rights |
| `jadval.kart.etiket` | Registratura | Регистратура | Front desk |
| `jadval.kart.satirlar[1].k` | Qabul jadvali | Расписание приёмов | Appointment schedule |
| `jadval.kart.satirlar[2].k` | Eslatmalar | Напоминания | Reminders |
| `jadval.kart.satirlar[3].k` | Bemor xabarlari | Сообщения пациентов | Patient messages |
| `jadval.kart.satirlar[4].k` | Registrator | Регистратор | Receptionist |
| `jadval.kart.satirlar[4].mark` | Alohida huquq | Отдельные права | Separate rights |

### 06 — Specialties

| Key | Uzbek (Latin) | Russian | English |
|---|---|---|---|
| `yonalish.ustBaslik` | 06 — Yoʻnalishingizga mos | 06 — Под вашу специальность | 06 — Fitted to your specialty |
| `yonalish.baslik` | Umumiy yordamchi emas. | Не общий помощник. | Not a general assistant. |
| `yonalish.baslikVurgu` | Sizning yoʻnalishingiz. | Ваша специальность. | Your specialty. |
| `yonalish.govde` | Notya 30 yoʻnalish uchun moʻljallangan: har biriga oʻsha yoʻnalishning kundalik ishiga mos ish maydoni. Yoʻnalishlar bosqichma-bosqich ishga tushiriladi. | Notya рассчитан на 30 специальностей: для каждой — рабочее пространство под её повседневную работу. Специальности подключаются поэтапно. | Notya is designed for 30 specialties: for each, a workspace fitted to that specialty's daily work. Specialties are switched on step by step. |
| `yonalish.misollar[1].k` | Pediatriya | Педиатрия | Pediatrics |
| `yonalish.misollar[1].v` | Oʻsish, emlash va rivojlanish kuzatuvi bir qarashda. | Рост, вакцинация и развитие — с одного взгляда. | Growth, vaccination and development follow-up at a glance. |
| `yonalish.misollar[2].k` | Akusherlik va ginekologiya | Акушерство и гинекология | Obstetrics and gynecology |
| `yonalish.misollar[2].v` | Homiladorlik taqvimi va kuzatuv muddatlari oʻz-oʻzidan. | Календарь беременности и сроки наблюдения — сами собой. | Pregnancy calendar and follow-up windows by themselves. |
| `yonalish.misollar[3].k` | Oftalmologiya | Офтальмология | Ophthalmology |
| `yonalish.misollar[3].v` | Koʻrish kuzatuvi, qabuldan qabulga solishtirib. | Наблюдение за зрением — в сравнении от приёма к приёму. | Vision follow-up, compared from visit to visit. |
| `yonalish.royxatEtiketi` | Yoʻnalishlar | Специальности | Specialties |
| `yonalish.royxat[1]` | Pediatriya | Педиатрия | Pediatrics |
| `yonalish.royxat[2]` | Kardiologiya | Кардиология | Cardiology |
| `yonalish.royxat[3]` | Nevrologiya | Неврология | Neurology |
| `yonalish.royxat[4]` | Terapiya | Терапия | Internal medicine |
| `yonalish.royxat[5]` | Psixiatriya | Психиатрия | Psychiatry |
| `yonalish.royxat[6]` | Umumiy jarrohlik | Общая хирургия | General surgery |
| `yonalish.royxat[7]` | Travmatologiya va ortopediya | Травматология и ортопедия | Traumatology and orthopedics |
| `yonalish.royxat[8]` | Dermatologiya | Дерматология | Dermatology |
| `yonalish.royxat[9]` | Otorinolaringologiya | Оториноларингология | Otorhinolaryngology |
| `yonalish.royxat[10]` | Oftalmologiya | Офтальмология | Ophthalmology |
| `yonalish.royxat[11]` | Akusherlik va ginekologiya | Акушерство и гинекология | Obstetrics and gynecology |
| `yonalish.royxat[12]` | Urologiya | Урология | Urology |
| `yonalish.royxat[13]` | Radiologiya | Радиология | Radiology |
| `yonalish.royxat[14]` | Anesteziologiya | Анестезиология | Anesthesiology |
| `yonalish.royxat[15]` | Shoshilinch tibbiyot | Неотложная медицина | Emergency medicine |
| `yonalish.royxat[16]` | Fizioterapiya va reabilitatsiya | Физиотерапия и реабилитация | Physiotherapy and rehabilitation |
| `yonalish.royxat[17]` | Yuqumli kasalliklar | Инфекционные болезни | Infectious diseases |
| `yonalish.royxat[18]` | Endokrinologiya | Эндокринология | Endocrinology |
| `yonalish.royxat[19]` | Gastroenterologiya | Гастроэнтерология | Gastroenterology |
| `yonalish.royxat[20]` | Nefrologiya | Нефрология | Nephrology |
| `yonalish.royxat[21]` | Revmatologiya | Ревматология | Rheumatology |
| `yonalish.royxat[22]` | Onkologiya | Онкология | Oncology |
| `yonalish.royxat[23]` | Pulmonologiya | Пульмонология | Pulmonology |
| `yonalish.royxat[24]` | Torakal jarrohlik | Торакальная хирургия | Thoracic surgery |
| `yonalish.royxat[25]` | Plastik jarrohlik | Пластическая хирургия | Plastic surgery |
| `yonalish.royxat[26]` | Neyroxirurgiya | Нейрохирургия | Neurosurgery |
| `yonalish.royxat[27]` | Kardiojarrohlik | Кардиохирургия | Cardiac surgery |
| `yonalish.royxat[28]` | Bolalar jarrohligi | Детская хирургия | Pediatric surgery |
| `yonalish.royxat[29]` | Oilaviy tibbiyot | Семейная медицина | Family medicine |
| `yonalish.royxat[30]` | Sport tibbiyoti | Спортивная медицина | Sports medicine |

### 07 — Follow-up

| Key | Uzbek (Latin) | Russian | English |
|---|---|---|---|
| `kuzatuv.ustBaslik` | 07 — Kuzatuv | 07 — Наблюдение | 07 — Follow-up |
| `kuzatuv.baslik` | Hech bir bemor | Ни один пациент | No patient |
| `kuzatuv.baslikVurgu` | kuzatuvdan tushib qolmaydi. | не выпадает из наблюдения. | drops out of follow-up. |
| `kuzatuv.govde` | Qayta koʻrigi kechikkan va kuzatuvi oʻtkazib yuborilgan bemorlar oʻz-oʻzidan roʻyxatga tushadi. Bir bosishda eslatma yuborasiz. | Пациенты с просроченным повторным осмотром и пропущенным наблюдением сами попадают в список. Напоминание отправляется одним нажатием. | Patients whose check-up is overdue and whose follow-up was missed are listed by themselves. You send a reminder in one tap. |
| `kuzatuv.kart.etiket` | Kuzatuv roʻyxati | Список наблюдения | Follow-up list |
| `kuzatuv.kart.satirlar[1].k` | Qayta koʻrigi kechikkan | Повторный осмотр просрочен | Check-up overdue |
| `kuzatuv.kart.satirlar[1].mark` | Eslatish | Напомнить | Remind |
| `kuzatuv.kart.satirlar[2].k` | Kuzatuvi oʻtkazib yuborilgan | Наблюдение пропущено | Follow-up missed |
| `kuzatuv.kart.satirlar[2].mark` | Eslatish | Напомнить | Remind |
| `kuzatuv.kart.not` | Roʻyxat oʻz-oʻzidan yangilanadi. | Список обновляется сам. | The list updates itself. |

### 08 — Learning

| Key | Uzbek (Latin) | Russian | English |
|---|---|---|---|
| `organish.ustBaslik` | 08 — Oʻrganish | 08 — Обучение | 08 — Learning |
| `organish.baslik` | Oʻn qabuldan keyin | Через десять приёмов — | After ten visits |
| `organish.baslikVurgu` | goʻyo yillar davomida birgasiz. | будто вы вместе много лет. | as if you had worked together for years. |
| `organish.govde` | Afzal koʻrganlaringizni eslab qoladi; bir gapni ikki marta ayttirmaydi. Oʻzini hamkasb kabi tutadi. | Запоминает ваши предпочтения; не заставляет повторять одно и то же дважды. Ведёт себя как коллега. | It remembers your preferences; it does not make you say the same thing twice. It behaves like a colleague. |
| `organish.gorselAlt` | Ertalabki yorugʻlikdagi shifokor stoli: qabul yozuvlari, choʻntak daftari, stetoskop va ruchka | Стол врача в утреннем свете: записи приёмов, карманный блокнот, стетоскоп и ручка | A doctor's desk in morning light: visit notes, a pocket notebook, a stethoscope and a pen |
| `organish.gorselAlti` | Qabul yozuvlari · tasviriy surat | Записи приёмов · иллюстрация | Visit notes · illustrative picture |
| `organish.sekmeler` | Qabul namunasi | Пример приёма | Sample visit |
| `organish.birinchi.etiket` | 1-qabul | Приём 1 | Visit 1 |
| `organish.birinchi.sorov` | Amoksitsillin yozing. | Запишите амоксициллин. | Write amoxicillin. |
| `organish.birinchi.javob` | Qaysi dozada yozay, doktor? Qaysi shaklini afzal koʻrasiz? | В какой дозе записать, доктор? Какую форму вы предпочитаете? | At what dose shall I write it, doctor? Which form do you prefer? |
| `organish.oninchi.etiket` | 10-qabul | Приём 10 | Visit 10 |
| `organish.oninchi.sorov` | Amoksitsillin yozing. | Запишите амоксициллин. | Write amoxicillin. |
| `organish.oninchi.javob` | 40 mg/kg/kun, bu vaznda kuniga 720 mg. Siz odatda amoksitsillin-klavulanatni tanlaysiz — shuni yozaymi, doktor? | 40 мг/кг/сут, при этом весе 720 мг в сутки. Обычно вы выбираете амоксициллин-клавуланат — записать его, доктор? | 40 mg/kg/day, at this weight 720 mg a day. You usually choose amoxicillin-clavulanate — shall I write that, doctor? |
| `organish.izoh` | Siz soʻramadingiz. U esladi. | Вы не спрашивали. Она вспомнила. | You did not ask. She remembered. (Uzbek has one word for he, she and it.) |

### 09 — Safety net

| Key | Uzbek (Latin) | Russian | English |
|---|---|---|---|
| `xavfsizlik.ustBaslik` | 09 — Xavfsizlik toʻri | 09 — Страховочная сеть | 09 — Safety net |
| `xavfsizlik.baslik` | Ellik bemor, ogʻir kun — | Пятьдесят пациентов, тяжёлый день — | Fifty patients, a hard day — |
| `xavfsizlik.baslikVurgu` | u hech qachon jim turmaydi. | она никогда не промолчит. | she never stays silent. (Uzbek has one word for he, she and it.) |
| `xavfsizlik.iqtibos` | “Doktor, bir daqiqa — bu kattalar dozasi. Bu vaznda bir martalik doza 250 mg dan oshmasligi kerak. Tuzataymi?” | «Доктор, одну минуту — это взрослая доза. При этом весе разовая доза не должна превышать 250 мг. Исправить?» | “Doctor, one moment — this is an adult dose. At this weight a single dose should not exceed 250 mg. Shall I correct it?” |
| `xavfsizlik.izoh` | Notoʻgʻri doza, xavfli dori birikmasi. Soʻramasangiz ham aytadi. Toʻxtatadi. Toʻgʻrisini taklif qiladi. | Неверная доза, опасное сочетание лекарств. Скажет, даже если не спросили. Остановит. Предложит правильный вариант. | A wrong dose, a dangerous combination of medicines. It says so even if you do not ask. It stops you. It suggests the right one. |
| `xavfsizlik.gorselAlt` | Kunduzgi yorugʻlikdagi xususiy klinika yoʻlagi: shifokor xonalari eshiklari va kutish oʻrindigʻi | Коридор частной клиники при дневном свете: двери врачебных кабинетов и скамья для ожидания | A private clinic corridor in daylight: doors of doctors' rooms and a waiting bench |
| `xavfsizlik.gorselAlti` | Klinika yoʻlagi · tasviriy surat | Коридор клиники · иллюстрация | Clinic corridor · illustrative picture |
| `xavfsizlik.dalillar[1].k` | Shifrlash | Шифрование | Encryption |
| `xavfsizlik.dalillar[1].v` | Bemorning shaxsiy maʼlumotlari shifrlangan holda saqlanadi. | Личные данные пациента хранятся в зашифрованном виде. | The patient's personal data is stored encrypted. |
| `xavfsizlik.dalillar[2].k` | Alohida kirish | Раздельный доступ | Separate access |
| `xavfsizlik.dalillar[2].v` | Har bir shifokor faqat oʻz bemorlarini koʻradi. | Каждый врач видит только своих пациентов. | Each doctor sees only their own patients. |
| `xavfsizlik.dalillar[3].k` | Shifokor tasdigʻi | Подтверждение врача | Doctor's approval |
| `xavfsizlik.dalillar[3].v` | Yozuv, retsept va bemorga boradigan har bir maʼlumot sizning tasdigʻingizdan oʻtadi. | Запись, рецепт и всё, что уходит пациенту, проходит ваше подтверждение. | The note, the prescription and everything that goes to the patient passes your approval. |
| `xavfsizlik.dalillar[4].k` | Qaror koʻmagi | Поддержка решений | Decision support |
| `xavfsizlik.dalillar[4].v` | Notya — qaror qabul qilishga koʻmak; tashxis va davolash qarori shifokorga tegishli. | Notya — поддержка принятия решений; диагноз и лечение определяет врач. | Notya is decision support; the diagnosis and the treatment decision belong to the doctor. |

### 10 — Price

The amounts are **not** in the copy. The page writes them from the price list (`countries/uz/acilis/fiyatlar.ts`) with the pack's number rules, into the line `narx.oylik`: Starter **360 000 soʻm / oy**, Pro **840 000 soʻm / oy**, Private practice **1 440 000 soʻm / oy** (Russian: «360 000 сум / мес.», Uzbek Cyrillic: «360 000 сўм / ой»). The four clinic plans show "price on request". The exchange rate and every figure: `docs/COUNTRY-PACK-UZBEKISTAN.md`, "Prices on the landing page".

| Key | Uzbek (Latin) | Russian | English |
|---|---|---|---|
| `narx.ustBaslik` | 10 — Narx | 10 — Цена | 10 — Price |
| `narx.baslik` | Sodda. Shaffof. | Просто. Прозрачно. | Simple. Transparent. |
| `narx.baslikVurgu` | Adolatli. | Честно. | Fair. |
| `narx.guruhlar` | Reja turi | Тип плана | Plan type (read by a screen reader for the switch) |
| `narx.tavsiya` | Tavsiya etamiz | Рекомендуем | We recommend (the badge) |
| `narx.oylik` | % soʻm / oy | % сум / мес. | % soʻm / month — "%" is where the amount from the price list is written |
| `narx.sorovNarx` | Narx soʻrov boʻyicha | Цена по запросу | Price on request |
| `narx.dugme` | Soʻrov qoldirish | Оставить запрос | Leave a request (button of a plan with a price) |
| `narx.sorovDugme` | Narxni soʻrash | Запросить цену | Request a price (button of a plan without one) |
| `narx.gruplar[1].ad` | Shifokor | Врач | Doctor (position of the switch) |
| `narx.gruplar[1].rejalar[1].ad` | Boshlangʻich | Начальный | Starter (plan `starter`) |
| `narx.gruplar[1].rejalar[1].maddeler[1]` | Oyiga 60 ta qabul | 60 приёмов в месяц | 60 visits a month |
| `narx.gruplar[1].rejalar[1].maddeler[2]` | Bitta shifokor | Один врач | One doctor |
| `narx.gruplar[1].rejalar[1].maddeler[3]` | Ovozli yordamchi Prof. Malika | Голосовой помощник Проф. Малика | Voice assistant Prof. Malika |
| `narx.gruplar[1].rejalar[1].maddeler[4]` | Tibbiy yozuv va retsept qoralamasi | Медицинская запись и черновик рецепта | Medical note and prescription draft |
| `narx.gruplar[1].rejalar[1].maddeler[5]` | Yoʻnalishingizga mos ish maydoni | Рабочее пространство под вашу специальность | A workspace fitted to your specialty |
| `narx.gruplar[1].rejalar[1].maddeler[6]` | Doza ogohlantirishlari | Предупреждения о дозах | Dose warnings |
| `narx.gruplar[1].rejalar[1].maddeler[7]` | Bemor kartasi va arxiv | Карта пациента и архив | Patient file and archive |
| `narx.gruplar[1].rejalar[2].ad` | Pro | Про | Pro (plan `pro`) |
| `narx.gruplar[1].rejalar[2].maddeler[1]` | Boshlangʻich rejasidagi hamma narsa | Всё из плана «Начальный» | Everything in the Starter plan |
| `narx.gruplar[1].rejalar[2].maddeler[2]` | Cheklanmagan qabullar (adolatli foydalanish doirasida) | Без ограничения числа приёмов (в рамках добросовестного использования) | Unlimited visits (within fair use) |
| `narx.gruplar[1].rejalar[2].maddeler[3]` | Bemor portali | Портал пациента | Patient portal |
| `narx.gruplar[1].rejalar[2].maddeler[4]` | Hamkasb maslahati | Консультация коллеги | Colleague consultation |
| `narx.gruplar[1].rejalar[2].maddeler[5]` | Qabul jadvali va eslatmalar | Расписание приёмов и напоминания | Appointment schedule and reminders |
| `narx.gruplar[1].rejalar[2].maddeler[6]` | Bemor xabarlari va kelgan hujjatlar | Сообщения пациентов и входящие документы | Patient messages and incoming documents |
| `narx.gruplar[1].rejalar[2].maddeler[7]` | Kuzatuv roʻyxatlari | Списки наблюдения | Follow-up lists |
| `narx.gruplar[1].rejalar[2].maddeler[8]` | Qabulni bitta oqimda yakunlash va shablonlar | Завершение приёма одним потоком и шаблоны | Closing the visit in one flow, and templates |
| `narx.gruplar[1].rejalar[2].maddeler[9]` | Xulosa va epikriz qoralamalari | Черновики заключений и эпикризов | Drafts of reports and discharge summaries |
| `narx.gruplar[1].rejalar[2].maddeler[10]` | Oʻrganuvchi tizim | Система, которая учится | A system that learns |
| `narx.gruplar[1].rejalar[3].ad` | Xususiy amaliyot | Частная практика | Private practice (plan `practice`) |
| `narx.gruplar[1].rejalar[3].maddeler[1]` | Pro rejasidagi hamma narsa | Всё из плана «Про» | Everything in the Pro plan |
| `narx.gruplar[1].rejalar[3].maddeler[2]` | Registrator hisobi, alohida huquq bilan | Аккаунт регистратора с отдельными правами | Receptionist account, with separate rights |
| `narx.gruplar[1].rejalar[3].maddeler[3]` | Yordamchini sizga moslab sozlash | Настройка помощника под вас | The assistant tuned to you |
| `narx.gruplar[1].rejalar[3].maddeler[4]` | Oʻrnatishda yordam | Помощь при подключении | Help with set-up |
| `narx.gruplar[1].rejalar[3].maddeler[5]` | Ustuvor qoʻllab-quvvatlash | Приоритетная поддержка | Priority support |
| `narx.gruplar[1].izoh` | Notya hozircha taklif kodi bilan ishlaydi. Narxlarga soliqlar kiritilmagan. Yil uchun oldindan toʻlasangiz, 2 oy bizdan. Asoschi shifokorlar dasturi: dastlabki 50 shifokorga 12 oy davomida 40% chegirma. | Notya пока работает по коду приглашения. Налоги в цены не включены. При оплате за год вперёд — 2 месяца в подарок. Программа «Врачи-основатели»: первым 50 врачам — скидка 40% на 12 месяцев. | For now Notya works by invitation code. Taxes are not included in the prices. Pay for a year in advance and 2 months are on us. Founding doctors programme: 40% off for 12 months for the first 50 doctors. |
| `narx.gruplar[2].ad` | Klinika | Клиника | Clinic (position of the switch) |
| `narx.gruplar[2].rejalar[1].ad` | Klinika 5 | Клиника 5 | Clinic 5 (plan `clinic5`) |
| `narx.gruplar[2].rejalar[1].maddeler[1]` | 5 nafargacha foydalanuvchi | До 5 пользователей | Up to 5 users |
| `narx.gruplar[2].rejalar[1].maddeler[2]` | Shifokor, mutaxassis va registrator huquqlari | Права врача, специалиста и регистратора | Doctor, specialist and receptionist rights |
| `narx.gruplar[2].rejalar[1].maddeler[3]` | Seans va qabul jadvali | Расписание сеансов и приёмов | Session and appointment schedule |
| `narx.gruplar[2].rejalar[1].maddeler[4]` | Muolajadan keyingi parvarish muddatlari va eslatmalar | Сроки ухода после процедуры и напоминания | After-procedure care deadlines and reminders |
| `narx.gruplar[2].rejalar[1].maddeler[5]` | Bemor portali | Портал пациента | Patient portal |
| `narx.gruplar[2].rejalar[1].maddeler[6]` | Roʻyxatga olish va rozilik nazorat roʻyxati | Чек-лист регистрации и согласия | Registration and consent checklist |
| `narx.gruplar[2].rejalar[1].maddeler[7]` | Kuzatuv roʻyxatlari | Списки наблюдения | Follow-up lists |
| `narx.gruplar[2].rejalar[1].maddeler[8]` | Boshqaruv paneli | Панель управления | Management panel |
| `narx.gruplar[2].rejalar[2].ad` | Klinika 10 | Клиника 10 | Clinic 10 (plan `clinic10`) |
| `narx.gruplar[2].rejalar[2].maddeler[1]` | 10 nafargacha foydalanuvchi | До 10 пользователей | Up to 10 users |
| `narx.gruplar[2].rejalar[2].maddeler[2]` | Klinika 5 rejasidagi hamma narsa | Всё из плана «Клиника 5» | Everything in the Clinic 5 plan |
| `narx.gruplar[2].rejalar[2].maddeler[3]` | Brend sozlamalari | Настройки бренда | Brand settings |
| `narx.gruplar[2].rejalar[2].maddeler[4]` | Oʻrnatishda yordam | Помощь при подключении | Help with set-up |
| `narx.gruplar[2].rejalar[2].maddeler[5]` | Ustuvor qoʻllab-quvvatlash | Приоритетная поддержка | Priority support |
| `narx.gruplar[2].rejalar[3].ad` | Klinika 20 | Клиника 20 | Clinic 20 (plan `clinic20`) |
| `narx.gruplar[2].rejalar[3].maddeler[1]` | 20 nafargacha foydalanuvchi | До 20 пользователей | Up to 20 users |
| `narx.gruplar[2].rejalar[3].maddeler[2]` | Klinika 10 rejasidagi hamma narsa | Всё из плана «Клиника 10» | Everything in the Clinic 10 plan |
| `narx.gruplar[2].rejalar[3].maddeler[3]` | Jamoani oʻqitish | Обучение команды | Team training |
| `narx.gruplar[2].rejalar[3].maddeler[4]` | Alohida qoʻllab-quvvatlash | Персональная поддержка | Dedicated support |
| `narx.gruplar[2].rejalar[4].ad` | Korporativ | Корпоративный | Enterprise (plan `enterprise`) |
| `narx.gruplar[2].rejalar[4].maddeler[1]` | Cheklanmagan foydalanuvchilar | Без ограничения числа пользователей | Unlimited users |
| `narx.gruplar[2].rejalar[4].maddeler[2]` | Alohida xizmat shartnomasi | Отдельный договор на обслуживание | A service contract of its own |
| `narx.gruplar[2].rejalar[4].maddeler[3]` | Alohida oʻrnatish va oʻqitish | Индивидуальное подключение и обучение | Set-up and training of its own |
| `narx.gruplar[2].izoh` | Notya hozircha taklif kodi bilan ishlaydi. Narx foydalanuvchilar soni va yoʻnalishingizga qarab belgilanadi. | Notya пока работает по коду приглашения. Цена зависит от числа пользователей и вашего направления. | For now Notya works by invitation code. The price depends on the number of users and your field. |

### Closing section — request a price

| Key | Uzbek (Latin) | Russian | English |
|---|---|---|---|
| `sorov.ustBaslik` | Xususiy amaliyot | Частная практика | Private practice |
| `sorov.baslik` | Narxni soʻrang. | Запросите цену. | Request a price. |
| `sorov.baslikVurgu` | Siz bilan bogʻlanamiz. | Мы свяжемся с вами. | We will get in touch with you. |
| `sorov.govde` | Hozircha faqat taklif kodi bilan. Oʻzbek va rus tillarida. Qabulxonangizga yana bir hamkasb. | Пока только по коду приглашения. На узбекском и русском языках. Ещё один коллега в вашем кабинете. | For now only with an invitation code. In Uzbek and Russian. One more colleague in your practice. |
| `sorov.form.etiket` | Narx soʻrovi | Запрос цены | Price request |
| `sorov.form.adSoyad` | Ism va familiya | Имя и фамилия | First and last name |
| `sorov.form.kurum` | Klinika yoki amaliyot | Клиника или практика | Clinic or practice |
| `sorov.form.telefon` | Telefon | Телефон | Phone |
| `sorov.form.telefonOrnek` | +998 90 123 45 67 | +998 90 123 45 67 | (phone example) |
| `sorov.form.uzmanlik` | Yoʻnalish | Специальность | Specialty |
| `sorov.form.mesaj` | Xabar (ixtiyoriy) | Сообщение (необязательно) | Message (optional) |
| `sorov.form.gonder` | Soʻrov yuborish | Отправить запрос | Send the request |
| `sorov.form.ipucu` | Soʻrov qurilmangizdagi pochta ilovasi orqali yuboriladi. | Запрос отправляется через почтовое приложение на вашем устройстве. | The request is sent through the mail app on your device. |
| `sorov.form.eksik` | Ism va telefon raqamini yozing. | Укажите имя и номер телефона. | Enter your name and phone number. |
| `sorov.form.konu` | Notya: narx soʻrovi | Notya: запрос цены | Notya: price request |
| `sorov.form.satir.adSoyad` | Ism va familiya | Имя и фамилия | First and last name |
| `sorov.form.satir.kurum` | Klinika yoki amaliyot | Клиника или практика | Clinic or practice |
| `sorov.form.satir.telefon` | Telefon | Телефон | Phone |
| `sorov.form.satir.uzmanlik` | Yoʻnalish | Специальность | Specialty |
| `sorov.form.satir.mesaj` | Xabar | Сообщение | Message |
| `sorov.formYok` | Soʻrovlar qabuli tez orada ochiladi. | Приём запросов скоро откроется. | Requests will open soon. |
| `sorov.davetSorusu` | Taklif kodingiz bormi? | Есть код приглашения? | Do you have an invitation code? |
| `sorov.davetBaglantisi` | Roʻyxatdan oʻtish | Регистрация | Sign up |

### Footer

| Key | Uzbek (Latin) | Russian | English |
|---|---|---|---|
| `altBilgi.tanim` | Shifokorlar uchun sunʼiy intellektli klinik yordamchi. | Клинический ИИ-помощник для врачей. | AI clinical assistant for doctors. |
| `altBilgi.havolalar` | Quyi havolalar | Нижние ссылки | Footer links |
| `altBilgi.giris` | Kirish | Войти | Log in |
| `altBilgi.kayit` | Taklif kodi bilan roʻyxatdan oʻtish | Регистрация по коду приглашения | Sign up with an invitation code |
| `altBilgi.haklar` | Notya | Notya | Notya |
| `altBilgi.diller` | Til va yozuv | Язык и письмо | Language and script |

### Page title and description (not visible on the page)

| Key | Uzbek (Latin) | Russian | English |
|---|---|---|---|
| `meta.baslik` | Notya — shifokorlar uchun sunʼiy intellektli klinik yordamchi | Notya — клинический ИИ-помощник для врачей | Notya — AI clinical assistant for doctors |
| `meta.aciklama` | Qabulni tinglaydi, tibbiy yozuvni oʻzbek yoki rus tilida yozadi, retsept va xulosa qoralamasini tayyorlaydi, bemorni kuzatuvda tutadi. Har bir qaror shifokor tasdigʻi bilan. | Слушает приём, пишет медицинскую запись на узбекском или русском языке, готовит черновик рецепта и заключения, держит пациента под наблюдением. Каждое решение — с подтверждения врача. | Listens to the visit, writes the medical note in Uzbek or Russian, prepares the prescription and report draft, keeps the patient in follow-up. Every decision with the doctor's approval. |

## Notes for the native reviewer

- The example visits (sections 01, 08, 09) name a medicine and doses. They are fictional and marked so on the page, but a clinician should confirm the drug, the figures and the phrasing a doctor would really use.
- "Registrator" / «регистратор» stands for the Turkish page's "secretary"; "qabulxona" for the doctor's practice. Confirm both.
- "Bemor portali" / «портал пациента» is used for the patient portal; the bar says "Portal".
- Specialty names are common-usage names, not the official list (checklist C1).
- Uzbek Latin uses ʻ (U+02BB) in oʻ and gʻ and ʼ (U+02BC) for the tutuq belgisi.
- **The assistant's title (2026-10-09).** The page writes "Prof. Malika" / «Проф. Малика». Confirm that a title before a given name reads naturally in Uzbek and in Russian, with a capital letter in the middle of a sentence, or say how it should be written. The full form used inside the application is "Prof. Dr. Malika Nazarova" / «Проф. д-р Малика Назарова».
- **The currency (2026-10-09).** "soʻm" in Uzbek Latin, «сўм» in Uzbek Cyrillic, «сум» in Russian; the amount is written with a space between thousands and no decimals ("1 440 000 soʻm / oy", «1 440 000 сум / мес.»). Confirm the word, its place after the number and the way "per month" is written.
- **Plan names.** "Boshlangʻich / Pro / Xususiy amaliyot / Klinika 5, 10, 20 / Korporativ"; in Russian «Начальный / Про / Частная практика / Клиника 5, 10, 20 / Корпоративный». "Pro" is written «Про» in the two Cyrillic forms.
- **"Fair use"** is rendered "adolatli foydalanish doirasida" / «в рамках добросовестного использования»; **"discharge summary"** as "epikriz" / «эпикриз». Confirm both.
- **The footnote under the prices** promises two months with yearly prepayment and 40% off for 12 months for the first 50 doctors, and says taxes are not included. The wording is for the native reader; whether each promise holds in Uzbekistan is for the owner.
