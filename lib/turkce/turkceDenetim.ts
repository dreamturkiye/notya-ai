/**
 * KURAL — TÜRKÇE (NOTYA-TURKCE-01): kullanıcıya görünen metin taraması.
 *
 * Kaynak dosyadaki kullanıcıya dönük metinleri (JSX metni, placeholder / title / aria-label / alt / label
 * nitelikleri ve boşluk içeren düz yazı string'leri) TypeScript AST ile çıkarır ve iki tür hatayı bulur:
 *   - ascii: Türkçe karakteri düşmüş Türkçe kelime (Gokhan, Kayitlarda, kiz cocuk, Ilac, Gecmis …)
 *   - ingilizce: tarayıcının kendi İngilizce kontrol metinleri ve sık İngilizce arayüz kalıpları
 * Tanımlayıcılar (değişken, sütun, rota, log anahtarı) taranmaz: tek kelimelik, boşluksuz string'ler
 * yalnız JSX içinde görünüyorsa sayılır. Rehber test: lib/turkce/turkceDenetim.test.ts
 */
import ts from 'typescript'

export type BulguTuru = 'ascii' | 'ingilizce'
export interface Bulgu {
  tur: BulguTuru
  dosya: string
  satir: number
  kelime: string
  metin: string
}

/**
 * Doğru yazımıyla küçük, özenle seçilmiş Türkçe kelime listesi. Her kelimenin ASCII'ye düşmüş hali
 * (ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u) kendi başına başka bir Türkçe kelime OLMAMALI — ör. "kayıt" var,
 * "yaş" yok (yas = matem). Büyük harfli yazımda ı→I doğrudur (KADIN, DOSYASI); o durum hata sayılmaz.
 */
export const DOGRU_TURKCE: readonly string[] = [
  'Gökhan', 'Ayşe', "Ayşe'nin", 'kayıtlarda', 'kayıt', 'kayıtlı', 'kayıtlar', 'kız', 'çocuk', 'çocuğu', 'çocuklar',
  'görüntüleme', 'görüntü', 'görüntüler', 'ilaç', 'ilaçlar', 'ilacı', 'geçmiş', 'geçmişi',
  'değil', 'için', 'bulunamadı', 'başarılı', 'başarısız', 'başarıyla', 'oluştu', 'oluştur', 'oluşturuldu',
  'oluşturulamadı', 'güncelle', 'güncellendi', 'güncellenemedi', 'yükle', 'yükleniyor', 'yüklendi', 'yüklenemedi',
  'lütfen', 'geçersiz', 'şifre', 'şifreniz', 'giriş', 'çıkış', 'doğum', 'yaşında', 'kadın', 'tanısı',
  'reçete', 'reçeteler', 'özet', 'özeti', 'öneri', 'öneriler', 'sonuç', 'sonuçlar', 'sonuçları', 'bugün', 'yarın',
  'şimdi', 'göre', 'göster', 'görünüm', 'seçin', 'seçili', 'seçilen', 'gönder', 'gönderildi', 'gönderilemedi',
  'düzenle', 'açıklama', 'iletişim', 'uyarı', 'işlem', 'başlat', 'tamamlandı', 'hastalarım', 'öğleden', 'müsait',
  'sağlık', 'sağlığım', 'kullanıcı', 'kullanıcılar', 'yönetim', 'güvenli', 'güvenlik', 'bağlantı', 'bağlan', 'bağlandı',
  'görüşme', 'görüşmesi', 'düşük', 'yüksek', 'ağrı', 'öksürük', 'göğüs', 'şikayet', 'şikâyet', 'öykü',
  'kontrolü', 'dosyası', 'dosyasına', 'hastanın', 'doğrulama', 'doğrula', 'yanlış', 'seçenek', 'seçenekler',
  'vazgeç', 'söyle', 'konuşma', 'anladım', 'bulamadım', 'yapamadım', 'hazırlanıyor', 'onaylandı', 'kaydedilemedi',
  'nasıl', 'yardım', 'asistanı', 'sorularınız', 'lütfen', 'hatası', 'oluşturun', 'çalışma', 'çalışır',
]

const ASCIIYE = (s: string) => s.replace(/[çÇğĞıİöÖşŞüÜâÂ]/g, (h) => ({ ç: 'c', Ç: 'C', ğ: 'g', Ğ: 'G', ı: 'i', İ: 'I', ö: 'o', Ö: 'O', ş: 's', Ş: 'S', ü: 'u', Ü: 'U', â: 'a', Â: 'A' } as Record<string, string>)[h])

/** ASCII biçim → doğru yazım (yalnız ASCII biçimi doğrusundan farklı olanlar). */
export const ASCII_TURKCE: ReadonlyMap<string, string> = new Map(
  DOGRU_TURKCE.map((d) => [ASCIIYE(d).toLowerCase(), d] as const).filter(([a, d]) => a !== d.toLowerCase()),
)

/** Tarayıcının kendi İngilizce kontrol / doğrulama metinleri ve sık İngilizce arayüz kalıpları (küçük harf). */
export const INGILIZCE_KALIPLAR: readonly string[] = [
  'choose file', 'no file chosen', 'no file selected', 'please fill out this field', 'please fill in this field',
  "please include an '@'", 'please enter a valid', 'please select an item', 'please check this box',
  'please match the requested format', 'loading...', 'loading…', 'something went wrong', 'try again',
  'not found', 'unauthorized', 'forbidden', 'internal server error', 'bad request', 'server error', 'network error',
  'failed to', 'is required', 'are required', 'not allowed', 'access denied', 'please wait', 'no results',
  'click here', 'sign in', 'sign out', 'log in', 'log out', 'save changes', 'are you sure', 'too many requests',
  'unknown error',
]

// Tek kelime İngilizce arayüz metinleri — yalnız JSX metni / arayüz niteliği olarak tek başına geçerse sayılır.
const INGILIZCE_TEK: ReadonlySet<string> = new Set([
  'save', 'cancel', 'delete', 'edit', 'close', 'submit', 'back', 'next', 'search', 'loading', 'error', 'upload',
  'download', 'print', 'send', 'open', 'settings', 'logout', 'login', 'continue', 'confirm', 'retry', 'done',
  'yes', 'no', 'ok', 'add', 'remove', 'update', 'refresh', 'previous', 'home', 'help', 'menu', 'patients',
  'patient', 'notes', 'start', 'stop', 'pause', 'resume', 'finish', 'today', 'tomorrow', 'yesterday', 'success',
  'unauthorized', 'forbidden', 'required', 'invalid', 'failed', 'saved', 'deleted', 'uploading', 'saving',
])

// İngilizce düz yazı ölçüsü: Türkçe ile çakışmayan sık İngilizce kelimeler (not, son, on, an, ben … yok).
const INGILIZCE_SOZ: ReadonlySet<string> = new Set([
  'the', 'to', 'of', 'for', 'with', 'is', 'are', 'your', 'you', 'this', 'that', 'please', 'and', 'or', 'in',
  'at', 'from', 'be', 'was', 'were', 'has', 'have', 'cannot', 'could', 'should', 'would', 'will', 'failed', 'file',
  'patient', 'patients', 'changes', 'all', 'my', 'new', 'item', 'items', 'error', 'invalid', 'missing', 'required',
  'found', 'user', 'users', 'request', 'server', 'data', 'select', 'enter', 'upload', 'download', 'save', 'saved',
  'delete', 'deleted', 'update', 'updated', 'create', 'created', 'loading', 'please', 'try', 'again', 'unable',
  'could', 'not', 'no', 'yes', 'an', 'a', 'by', 'it', 'if', 'as', 'what', 'when', 'which', 'there', 'here',
  'unknown', 'access', 'denied', 'allowed', 'only', 'must', 'can', 'record', 'records', 'appointment', 'doctor',
  'clinic', 'email', 'password', 'name', 'date', 'time', 'phone', 'address', 'message', 'send', 'sent', 'token',
  'expired', 'session', 'note', 'notes', 'report', 'image', 'document', 'documents', 'list', 'add', 'added',
  'remove', 'removed', 'search', 'results', 'result', 'nothing', 'something', 'wrong', 'went', 'first', 'last',
  'without', 'too', 'many', 'large', 'small', 'limit', 'exceeded', 'rate', 'network', 'internal', 'bad',
  'already', 'exists', 'does', 'do', "don't", "doesn't", 'is', 'been', 'being', 'out', 'up', 'into', 'about',
  'failed', 'success', 'successfully', 'completed', 'processing', 'pending', 'confirm', 'cancel', 'close',
])

const ARAYUZ_NITELIK = new Set(['placeholder', 'title', 'aria-label', 'alt', 'label', 'aria-description', 'aria-placeholder', 'aria-roledescription', 'aria-valuetext'])

const TR_HARF = /[çğıİöşüÇĞÖŞÜ]/
// Kelime sınırı: Türkçe harfler, rakam ve yol / anahtar ayraçları (/ _ - .) kelimeye dahil sayılır.
const HARF = 'A-Za-zÇĞİÖŞÜçğıöşüâÂ0-9_'

// Yol / alan adı / JSON anahtarı / enum listesi içindeki kelime (saglik.gov.tr, {sonuclar:…}, guvenli|dikkat) sayılmaz.
const asciiDesenler = [...ASCII_TURKCE].map(([a, d]) => ({ a, d, re: new RegExp(`(^|[^${HARF}/.\\-"{|,])(${a.replace(/'/g, "['’]?")})(?=$|[^${HARF}/\\-."|]|\\.(?![A-Za-z]))`, 'gi') }))

/** Metin tamamen ASCII bir URL / yol / e-posta / sınıf adı gibi mi görünüyor? */
function teknikMi(s: string): boolean {
  const t = s.trim()
  if (!t) return true
  if (/^(https?:|mailto:|tel:|wa\.me|\/|#|\.\/|data:|var\(|rgba?\(|calc\()/.test(t)) return true
  if (/^[A-Za-z0-9_.:-]+$/.test(t) && /[_:]|\.[A-Za-z0-9]|^[a-z]+(-[a-z0-9]+)+$|^[a-z]+[A-Z]/.test(t)) return true // anahtar / slug / camelCase
  if (/^\s*(ALTER|CREATE|SELECT|INSERT|UPDATE|DELETE|DROP|WITH)\s+[A-Z]/.test(t)) return true // SQL
  if (/^[\w-]+(\s+[\w:/[\].#%-]+)*$/.test(t) && /\b(flex|grid|px|py|mt|mb|text-|bg-|border|rounded|w-|h-|items-|justify-)/.test(t)) return true
  return false
}

/** Metindeki ilk ASCII-Türkçe kelime: { ascii, dogru } ya da null. */
export function asciiTurkceBul(metin: string): { ascii: string; dogru: string } | null {
  for (const { d, re } of asciiDesenler) {
    re.lastIndex = 0
    for (let m = re.exec(metin); m; m = re.exec(metin)) {
      const bulunan = m[2]
      // Tamamı büyük harfse ı→I doğru yazımdır (KADIN, DOSYASI); yalnız ç/ğ/ö/ş/ü düşmüşse hata.
      if (bulunan === bulunan.toUpperCase() && bulunan.length > 1) {
        if (bulunan === d.toLocaleUpperCase('tr-TR').replace(/İ/g, 'I')) continue
        if (bulunan === d.toLocaleUpperCase('tr-TR')) continue
        if (ASCIIYE(d.toLocaleUpperCase('tr-TR')) === bulunan && !/[çğöşüÇĞÖŞÜ]/.test(d)) continue
      }
      return { ascii: bulunan, dogru: d }
    }
  }
  return null
}

function ingilizceOlcu(alt: string): boolean {
  const kelimeler = alt.split(/[^a-z']+/).filter(Boolean)
  if (kelimeler.length < 2) return false
  const eng = kelimeler.filter((k) => INGILIZCE_SOZ.has(k) || INGILIZCE_TEK.has(k)).length
  return eng >= 2 && eng / kelimeler.length >= 0.5
}

export function ingilizceBul(metin: string, tekKelimeSay: boolean): string | null {
  const alt = metin.toLocaleLowerCase('en-US').replace(/\s+/g, ' ').trim()
  if (!alt) return null
  if (tekKelimeSay && INGILIZCE_TEK.has(alt.replace(/[.!:…]+$/, ''))) return alt
  if (TR_HARF.test(metin)) return null
  for (const k of INGILIZCE_KALIPLAR) if (alt.includes(k)) return k
  if (ingilizceOlcu(alt)) return 'ingilizce cümle'
  return null
}

interface Aday { metin: string; satir: number; jsx: boolean }

// Metin taşıyan JSX nitelikleri (tek kelimelik değer de ekranda görünür); ton="uyari", align="start" gibi değerler sayılmaz.
const METIN_NITELIK = /^(placeholder|title|aria-label|alt|label|aria-description|aria-placeholder|aria-valuetext|etiket|baslik|başlık|metin|text|mesaj|aciklama|açıklama|bos|bosMetin|children|ipucu|altBaslik|altMetin|buttonText|dugme|dugmeMetni)$/i

/**
 * Tek kelimelik string JSX içinde ekrana doğrudan mı basılıyor? `{'Kaydet'}`, `{a ? 'Evet' : 'Hayır'}`,
 * `{x || 'Yok'}` evet; `{ton === 'uyari' && …}`, `renk('uyari')` hayır (tanımlayıcı / enum değeri).
 */
function ekranaDogrudanMi(n: ts.Node): boolean {
  let c: ts.Node = n
  for (let p = n.parent; p; c = p, p = p.parent) {
    if (ts.isJsxAttribute(p)) return METIN_NITELIK.test(p.name.getText())
    if (ts.isJsxExpression(p)) {
      if (p.parent && ts.isJsxAttribute(p.parent)) return METIN_NITELIK.test(p.parent.name.getText())
      return true
    }
    if (ts.isParenthesizedExpression(p)) continue
    if (ts.isConditionalExpression(p) && p.condition !== c) continue
    if (ts.isBinaryExpression(p) && (p.operatorToken.kind === ts.SyntaxKind.BarBarToken || p.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken || p.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) && p.right === c) continue
    return false
  }
  return false
}

/** Bir kaynak dosyadaki kullanıcıya dönük olabilecek metinleri çıkarır. */
export function metinAdaylari(kaynak: string, dosya: string): Aday[] {
  const sf = ts.createSourceFile(dosya, kaynak, ts.ScriptTarget.Latest, true, dosya.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const cikti: Aday[] = []
  const ekle = (n: ts.Node, metin: string, jsx: boolean) => {
    if (teknikMi(metin)) return
    cikti.push({ metin, satir: sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1, jsx })
  }
  const gez = (n: ts.Node, jsxIci: boolean) => {
    if (ts.isImportDeclaration(n) || ts.isExportDeclaration(n) || ts.isTypeNode(n) || ts.isLiteralTypeNode(n)) return
    if (ts.isJsxText(n)) { ekle(n, n.text, true); return }
    if (ts.isJsxAttribute(n)) {
      const ad = n.name.getText(sf)
      const deger = n.initializer
      if (deger && ts.isStringLiteral(deger)) {
        if (ARAYUZ_NITELIK.has(ad)) ekle(deger, deger.text, true)
        return
      }
      if (ad === 'className' || ad === 'style' || ad === 'href' || ad === 'src' || ad === 'key' || ad === 'id' || ad === 'type' || ad === 'name' || ad === 'accept') return
      if (deger) gez(deger, ARAYUZ_NITELIK.has(ad) || jsxIci)
      return
    }
    // Nesnede teknik anahtarlar (className, style …) atlanır.
    if (ts.isPropertyAssignment(n) && /^(className|style|href|src|key|id|type|accept|method|mode|credentials|cache|headers|Content-Type|select|order|table|from|eq|timeZone)$/.test(n.name.getText(sf).replace(/['"]/g, ''))) return
    if (ts.isElementAccessExpression(n)) { gez(n.expression, jsxIci); return }
    if (ts.isCallExpression(n)) {
      const ag = n.expression.getText(sf)
      // Sorgu / log / regex / sınıf adı çağrıları kullanıcıya görünmez.
      if (/(^console\.|\.(select|eq|neq|in|order|from|ilike|like|or|is|match|contains|filter|rpc|channel|getItem|setItem|removeItem|querySelector|querySelectorAll|addEventListener|removeEventListener|startsWith|endsWith|includes|split|replace|replaceAll|test|indexOf|join|localeCompare|toLocaleDateString|toLocaleTimeString|toLocaleString)$|^(require|RegExp|new RegExp|cn|clsx|fetch|log|logla|hataLogla|fetchJson|encodeURIComponent)$)/.test(ag)) return
    }
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      const t = n.text
      if (/\s/.test(t.trim())) ekle(n, t, jsxIci)
      else if (jsxIci && ekranaDogrudanMi(n)) ekle(n, t, true)
      return
    }
    if (ts.isTemplateExpression(n)) {
      const parcalar = [n.head.text, ...n.templateSpans.map((s) => s.literal.text)].join(' … ')
      if (/[A-Za-zÇĞİÖŞÜçğıöşü]{2,}\s+[A-Za-zÇĞİÖŞÜçğıöşü]{2,}/.test(parcalar) || jsxIci) ekle(n, parcalar, jsxIci)
      n.templateSpans.forEach((s) => gez(s.expression, jsxIci))
      return
    }
    const icerdeJsx = jsxIci || ts.isJsxExpression(n)
    ts.forEachChild(n, (c) => gez(c, icerdeJsx && !ts.isJsxElement(c) && !ts.isJsxSelfClosingElement(c) ? icerdeJsx : ts.isJsxExpression(n)))
  }
  gez(sf, false)
  return cikti
}

/** Bir dosyadaki bulgular. izinli: `dosya:kelime` ya da `dosya` biçiminde istisnalar. */
export function dosyaTara(kaynak: string, dosya: string): Bulgu[] {
  const bulgular: Bulgu[] = []
  for (const a of metinAdaylari(kaynak, dosya)) {
    const metin = a.metin.replace(/\s+/g, ' ').trim()
    const k = asciiTurkceBul(metin)
    if (k) bulgular.push({ tur: 'ascii', dosya, satir: a.satir, kelime: `${k.ascii} → ${k.dogru}`, metin: metin.slice(0, 160) })
    const e = ingilizceBul(metin, a.jsx)
    if (e) bulgular.push({ tur: 'ingilizce', dosya, satir: a.satir, kelime: e, metin: metin.slice(0, 160) })
  }
  return bulgular
}
