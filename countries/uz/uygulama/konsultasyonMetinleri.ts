/**
 * NOTYA-ULKE-MESAJ-01 — Uzbekistan: every sentence of THE CONSULTATION BETWEEN DOCTORS, in the three forms of the
 * application (uz-Latn, uz-Cyrl, ru), written side by side (./uclu.ts). The tile's own name and description are with
 * the tools (./araclar/temel.ts).
 *
 *   kod     the account's own consultation code         iste    asking, on the patient's file
 *   giden   what this doctor asked                      gelen   what this doctor was asked
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN. AWAITS NATIVE REVIEW. Uzbek in Latin script and Russian were written by a machine; UZBEK IN
 * CYRILLIC SCRIPT WAS DERIVED FROM THE LATIN TEXT BY RULE (scripts/uz-kiril.mjs), letter by letter. Nobody who
 * speaks Uzbek or Russian as a first language has read a line of it.
 *
 * `iste.riza` IS A LEGAL SENTENCE AND HAS NOT BEEN READ BY A LAWYER. It is the basis on which a patient's data is
 * shared with a colleague: the asking doctor ticks it, and its stamp (../klinik/index.ts → konsultasyonRizasi.surum)
 * is stored with every consultation. Whether this sentence, and a consent the doctor records this way, is enough
 * under the country's law is a lawyer's question (docs/OPEN-COMMITMENTS.md, NOTYA-ULKE-MESAJ-01). CHANGE THE STAMP
 * WHENEVER THE SENTENCE CHANGES, in any of the three forms.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * No sentence promises that a colleague is told, names a state system, or claims that the sharing meets a law.
 * Written fresh for Uzbekistan — there is no source in another country's language.
 * PLACEHOLDERS: '%' one value; '%1' and '%2' two (each key of the type says which).
 */
import type { KonsultasyonMetni } from '@/lib/ulke/arayuz/metinTipleri'
import { u, ucBicim, type Uclu } from './uclu'

const METINLER: Uclu<KonsultasyonMetni> = {
  kod: {
    baslik: u('Konsultatsiya kodim', 'Консультация кодим', 'Мой код для консультаций'),
    aciklama: u('Sizdan fikr soʻramoqchi boʻlgan hamkasb shu kodni kiritadi. Kodni unga oʻzingiz bering. Shifokorlar roʻyxati yoʻq: kodsiz sizni hech kim topa olmaydi.', 'Сиздан фикр сўрамоқчи бўлган ҳамкасб шу кодни киритади. Кодни унга ўзингиз беринг. Шифокорлар рўйхати йўқ: кодсиз сизни ҳеч ким топа олмайди.', 'Этот код вводит коллега, который хочет узнать ваше мнение. Передайте ему код сами. Списка врачей нет: без кода вас никто не найдёт.'),
    yok: u('Sizda hali kod yoʻq: hech kim sizdan konsultatsiya soʻray olmaydi.', 'Сизда ҳали код йўқ: ҳеч ким сиздан консультация сўрай олмайди.', 'У вас ещё нет кода: никто не может запросить у вас консультацию.'),
    uret: u('Kod yaratish', 'Код яратиш', 'Создать код'),
    yenile: u('Yangi kod', 'Янги код', 'Новый код'),
    yenileUyari: u('Eski kod shu zahoti ishlamay qoladi. Avval soʻralgan konsultatsiyalar oʻzgarmaydi.', 'Эски код шу заҳоти ишламай қолади. Аввал сўралган консультациялар ўзгармайди.', 'Старый код сразу перестанет действовать. Уже запрошенные консультации не изменятся.'),
    yenileOnay: u('Ha, yangi kod', 'Ҳа, янги код', 'Да, новый код'),
    vazgec: u('Bekor qilish', 'Бекор қилиш', 'Отмена'),
    kopyala: u('Nusxalash', 'Нусхалаш', 'Скопировать'),
    kopyalandi: u('Nusxalandi.', 'Нусхаланди.', 'Скопировано.'),
    kopyalanamadi: u('Nusxalab boʻlmadi. Kodni belgilab, qoʻlda nusxalang.', 'Нусхалаб бўлмади. Кодни белгилаб, қўлда нусхаланг.', 'Не удалось скопировать. Выделите код и скопируйте вручную.'),
    yapilamadi: u('Bajarib boʻlmadi. Qaytadan urinib koʻring.', 'Бажариб бўлмади. Қайтадан уриниб кўринг.', 'Не удалось выполнить. Попробуйте ещё раз.'),
  },
  iste: {
    baslik: u('Hamkasbdan konsultatsiya', 'Ҳамкасбдан консультация', 'Консультация коллеги'),
    aciklama: u('Bu bemor boʻyicha hamkasbingizdan fikr soʻrang. Hamkasb faqat savolingizni va quyida oʻzingiz tanlagan narsani koʻradi: kartaning boshqa hech bir qismi unga ochilmaydi.', 'Бу бемор бўйича ҳамкасбингиздан фикр сўранг. Ҳамкасб фақат саволингизни ва қуйида ўзингиз танлаган нарсани кўради: картанинг бошқа ҳеч бир қисми унга очилмайди.', 'Запросите мнение коллеги об этом пациенте. Коллега увидит только ваш вопрос и то, что вы сами выберете ниже: остальная карта ему не открывается.'),
    kodEtiketi: u('Hamkasbning konsultatsiya kodi', 'Ҳамкасбнинг консультация коди', 'Код коллеги для консультаций'),
    bul: u('Topish', 'Топиш', 'Найти'),
    bulunamadi: u('Bunday kodli hamkasb topilmadi. Kodni tekshiring.', 'Бундай кодли ҳамкасб топилмади. Кодни текширинг.', 'Коллега с таким кодом не найден. Проверьте код.'),
    bulundu: u('Hamkasb: %', 'Ҳамкасб: %', 'Коллега: %'),
    soruEtiketi: u('Savolingiz', 'Саволингиз', 'Ваш вопрос'),
    soruIpucu: u('Hamkasb bilishi kerak boʻlgan narsani yozing. Bemorning ismi hamkasbga koʻrsatilmaydi, agar uni oʻzingiz yozmasangiz.', 'Ҳамкасб билиши керак бўлган нарсани ёзинг. Беморнинг исми ҳамкасбга кўрсатилмайди, агар уни ўзингиз ёзмасангиз.', 'Напишите то, что нужно знать коллеге. Имя пациента коллеге не показывается, если вы не напишете его сами.'),
    paylasimEtiketi: u('Nimani ulashish', 'Нимани улашиш', 'Чем поделиться'),
    secenekYok: u('Faqat savol', 'Фақат савол', 'Только вопрос'),
    secenekNot: u('Tasdiqlangan qayd', 'Тасдиқланган қайд', 'Утверждённая запись'),
    secenekOzet: u('Bemor uchun xulosa', 'Бемор учун хулоса', 'Резюме для пациента'),
    notSec: u('Qaysi koʻrik', 'Қайси кўрик', 'Какой приём'),
    onayliNotYok: u('Bu bemorda tasdiqlangan qayd yoʻq: faqat savolni yuborish mumkin.', 'Бу беморда тасдиқланган қайд йўқ: фақат саволни юбориш мумкин.', 'У этого пациента нет утверждённой записи: можно отправить только вопрос.'),
    ozetYok: u('Bu koʻrik uchun bemorga moʻljallangan xulosa yozilmagan.', 'Бу кўрик учун беморга мўлжалланган хулоса ёзилмаган.', 'Для этого приёма резюме для пациента не написано.'),
    rizaBaslik: u('Rozilik', 'Розилик', 'Согласие'),
    riza: u('Bemor (yoki uning qonuniy vakili) yuqorida tanlangan maʼlumotni konsultatsiya uchun shu hamkasbga ulashishimga rozi boʻlganini tasdiqlayman.', 'Бемор (ёки унинг қонуний вакили) юқорида танланган маълумотни консультация учун шу ҳамкасбга улашишимга рози бўлганини тасдиқлайман.', 'Подтверждаю, что пациент (или его законный представитель) согласился с тем, что я передаю выбранные выше сведения этому коллеге для консультации.'),
    rizaGerekli: u('Yuborish uchun rozilikni tasdiqlang.', 'Юбориш учун розиликни тасдиқланг.', 'Чтобы отправить, подтвердите согласие.'),
    soruBos: u('Savolingizni yozing.', 'Саволингизни ёзинг.', 'Напишите ваш вопрос.'),
    cokUzun: u('Matn juda uzun: koʻpi bilan % ta belgi.', 'Матн жуда узун: кўпи билан % та белги.', 'Текст слишком длинный: не более % знаков.'),
    meslektasGerekli: u('Hamkasbning kodini kiriting.', 'Ҳамкасбнинг кодини киритинг.', 'Введите код коллеги.'),
    gonder: u('Konsultatsiya soʻrash', 'Консультация сўраш', 'Запросить консультацию'),
    gonderiliyor: u('Yuborilmoqda…', 'Юборилмоқда…', 'Отправка…'),
    gonderildi: u('Konsultatsiya soʻraldi.', 'Консультация сўралди.', 'Консультация запрошена.'),
    gonderilemedi: u('Yuborib boʻlmadi. Qaytadan urinib koʻring.', 'Юбориб бўлмади. Қайтадан уриниб кўринг.', 'Не удалось отправить. Попробуйте ещё раз.'),
    limit: u('Bugun juda koʻp konsultatsiya soʻraldi. Ertaga urinib koʻring.', 'Бугун жуда кўп консультация сўралди. Эртага уриниб кўринг.', 'Сегодня запрошено слишком много консультаций. Попробуйте завтра.'),
    bildirimYok: u('Tizim hamkasbga hech narsa yubormaydi: konsultatsiya soʻraganingizni unga oʻzingiz ayting.', 'Тизим ҳамкасбга ҳеч нарса юбормайди: консультация сўраганингизни унга ўзингиз айтинг.', 'Система ничего не отправляет коллеге: скажите ему сами, что вы запросили консультацию.'),
    tumu: u('Barcha konsultatsiyalar', 'Барча консультациялар', 'Все консультации'),
  },
  giden: {
    baslik: u('Men soʻragan konsultatsiyalar', 'Мен сўраган консультациялар', 'Запрошенные мной консультации'),
    bos: u('Siz hali konsultatsiya soʻramagansiz.', 'Сиз ҳали консультация сўрамагансиз.', 'Вы ещё не запрашивали консультаций.'),
    meslektas: u('Hamkasb: %', 'Ҳамкасб: %', 'Коллега: %'),
    soru: u('Savol', 'Савол', 'Вопрос'),
    paylasilan: u('Ulashilgan', 'Улашилган', 'Передано'),
    okunmadi: u('Hamkasb hali ochmagan', 'Ҳамкасб ҳали очмаган', 'Коллега ещё не открыл'),
    okundu: u('Hamkasb ochgan: %', 'Ҳамкасб очган: %', 'Коллега открыл: %'),
    cevapYok: u('Javob hali yoʻq', 'Жавоб ҳали йўқ', 'Ответа пока нет'),
    cevap: u('Javob (%)', 'Жавоб (%)', 'Ответ (%)'),
    durumAcik: u('Ochiq. Hamkasb uni % gacha oʻqiy oladi.', 'Очиқ. Ҳамкасб уни % гача ўқий олади.', 'Открыта. Коллега может читать её до %.'),
    durumSuresiDoldu: u('Muddat tugagan: hamkasb uni endi oʻqiy olmaydi va javob bera olmaydi. Konsultatsiyani yoping.', 'Муддат тугаган: ҳамкасб уни энди ўқий олмайди ва жавоб бера олмайди. Консультацияни ёпинг.', 'Срок истёк: коллега больше не может её читать и отвечать. Закройте консультацию.'),
    durumKapali: u('Yopilgan: %1. Hamkasb uni %2 gacha oʻqiy oladi.', 'Ёпилган: %1. Ҳамкасб уни %2 гача ўқий олади.', 'Закрыта: %1. Коллега может читать её до %2.'),
    kapat: u('Konsultatsiyani yopish', 'Консультацияни ёпиш', 'Закрыть консультацию'),
    kapatUyari: u('Yopilgach javob berib boʻlmaydi. Hamkasb uni yana % kun oʻqiy oladi, soʻng u hamkasbga koʻrinmaydi.', 'Ёпилгач жавоб бериб бўлмайди. Ҳамкасб уни яна % кун ўқий олади, сўнг у ҳамкасбга кўринмайди.', 'После закрытия ответить будет нельзя. Коллега сможет читать её ещё % дн., затем она перестанет быть ему видна.'),
    kapatOnay: u('Ha, yopish', 'Ҳа, ёпиш', 'Да, закрыть'),
    vazgec: u('Bekor qilish', 'Бекор қилиш', 'Отмена'),
    kapatildi: u('Konsultatsiya yopildi.', 'Консультация ёпилди.', 'Консультация закрыта.'),
    yapilamadi: u('Bajarib boʻlmadi. Qaytadan urinib koʻring.', 'Бажариб бўлмади. Қайтадан уриниб кўринг.', 'Не удалось выполнить. Попробуйте ещё раз.'),
    yuklenemedi: u('Konsultatsiyalarni oʻqib boʻlmadi. Sahifani yangilang.', 'Консультацияларни ўқиб бўлмади. Саҳифани янгиланг.', 'Не удалось загрузить консультации. Обновите страницу.'),
  },
  gelen: {
    baslik: u('Mendan soʻralgan konsultatsiyalar', 'Мендан сўралган консультациялар', 'Консультации, запрошенные у меня'),
    aciklama: u('Siz faqat hamkasb shu konsultatsiya uchun ulashgan narsani koʻrasiz, u ham nusxa. Bemor kartasining boshqa hech bir qismi sizga ochiq emas.', 'Сиз фақат ҳамкасб шу консультация учун улашган нарсани кўрасиз, у ҳам нусха. Бемор картасининг бошқа ҳеч бир қисми сизга очиқ эмас.', 'Вы видите только то, чем коллега поделился для этой консультации, и это копия. Остальная карта пациента вам не открыта.'),
    bos: u('Sizdan hali konsultatsiya soʻralmagan.', 'Сиздан ҳали консультация сўралмаган.', 'У вас ещё не запрашивали консультаций.'),
    isteyen: u('Soʻragan: %', 'Сўраган: %', 'Запросил: %'),
    yeni: u('Yangi', 'Янги', 'Новая'),
    soru: u('Savol', 'Савол', 'Вопрос'),
    paylasilan: u('Siz bilan ulashilgan', 'Сиз билан улашилган', 'Вам передано'),
    paylasimYok: u('Savoldan boshqa hech narsa ulashilmagan.', 'Саволдан бошқа ҳеч нарса улашилмаган.', 'Кроме вопроса, ничего не передано.'),
    paylasimNot: u('Koʻrik qaydining nusxasi, koʻrik sanasi: %', 'Кўрик қайдининг нусхаси, кўрик санаси: %', 'Копия записи приёма, дата приёма: %'),
    paylasimOzet: u('Bemor uchun xulosaning nusxasi, koʻrik sanasi: %', 'Бемор учун хулосанинг нусхаси, кўрик санаси: %', 'Копия резюме для пациента, дата приёма: %'),
    kopyaNotu: u('Bu nusxa konsultatsiya soʻralgan paytda olingan va keyin oʻzgarmaydi.', 'Бу нусха консультация сўралган пайтда олинган ва кейин ўзгармайди.', 'Эта копия сделана в момент запроса консультации и после этого не меняется.'),
    okunabilir: u('Siz uni % gacha oʻqiy olasiz.', 'Сиз уни % гача ўқий оласиз.', 'Вы можете читать её до %.'),
    kapali: u('Yopilgan', 'Ёпилган', 'Закрыта'),
    cevapEtiketi: u('Javobingiz', 'Жавобингиз', 'Ваш ответ'),
    cevapUyari: u('Javob bir marta yuboriladi va keyin oʻzgartirib boʻlmaydi.', 'Жавоб бир марта юборилади ва кейин ўзгартириб бўлмайди.', 'Ответ отправляется один раз, изменить его потом нельзя.'),
    cevapGonder: u('Javobni yuborish', 'Жавобни юбориш', 'Отправить ответ'),
    cevapGonderiliyor: u('Yuborilmoqda…', 'Юборилмоқда…', 'Отправка…'),
    cevapBos: u('Javobingizni yozing.', 'Жавобингизни ёзинг.', 'Напишите ваш ответ.'),
    cokUzun: u('Matn juda uzun: koʻpi bilan % ta belgi.', 'Матн жуда узун: кўпи билан % та белги.', 'Текст слишком длинный: не более % знаков.'),
    cevapGonderilemedi: u('Javobni yuborib boʻlmadi. Qaytadan urinib koʻring.', 'Жавобни юбориб бўлмади. Қайтадан уриниб кўринг.', 'Не удалось отправить ответ. Попробуйте ещё раз.'),
    cevabiniz: u('Javobingiz (%)', 'Жавобингиз (%)', 'Ваш ответ (%)'),
    bekleyen: u('Javobingizni kutayotgan konsultatsiyalar: %', 'Жавобингизни кутаётган консультациялар: %', 'Консультаций, ожидающих вашего ответа: %'),
    ac: u('Ochish', 'Очиш', 'Открыть'),
  },
}

export const UZ_KONSULTASYON_AGACI = METINLER
export const UZ_KONSULTASYON_METINLERI = ucBicim(METINLER)
