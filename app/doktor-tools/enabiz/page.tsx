"use client";

export const dynamic = "force-dynamic";

import DoktorNav from "@/components/doktor/DoktorNav";

interface Step {
  number: number;
  title: string;
  content: string;
  tip: string;
}

const steps: Step[] = [
  {
    number: 1,
    title: "e-Nabız Nedir?",
    content: "Sağlık Bakanlığı'nın resmi elektronik sağlık kayıt sistemidir. 80 milyondan fazla vatandaş kaydı içerir. Muayene, reçete, tahlil, görüntüleme ve hastane yatış geçmişine erişim sağlar.",
    tip: "Tüm veriler SGK ve sağlık kurumlarından otomatik olarak çekilmektedir. Güncel hasta bilgilerine ulaşmak için en güvenilir kaynaktır.",
  },
  {
    number: 2,
    title: "Kurumsal Şifre Alma",
    content: "SGK İl Müdürlüğü'ne yazılı başvuruda bulunun. Kurum kodu ve e-Nabız kurumsal şifresi talep edin. İşlem süresi genellikle 1-3 iş günüdür.",
    tip: "Başvuru sırasında kurum vergi numarası ve doktor sicil belgenizi hazır bulundurun. Şifre sadece kurum adına tanımlanır.",
  },
  {
    number: 3,
    title: "Sisteme Giriş",
    content: "nabiz.saglik.gov.tr/kurumsal adresine gidin. TC Kimlik Numaranız ve kurumsal şifreniz ile giriş yapın.",
    tip: "İlk girişte şifrenizi değiştirmeniz önerilir. İki faktörlü doğrulama aktif olduğunda SMS ile doğrulama yapmanız gerekir.",
  },
  {
    number: 4,
    title: "Hasta Verilerine Erişim",
    content: "Ana ekranda TC Kimlik No ile hasta araması yapın. Hasta kaydını seçerek e-Nabız sağlık geçmişini görüntüleyin.",
    tip: "Arama sonuçları anlık olarak gelir. Hasta listesinde son muayene tarihi ve özet bilgi görünür.",
  },
  {
    number: 5,
    title: "Görüntüleme İzinleri",
    content: "Hastanın açık rızası olmadan kayıtlara erişilemez. KVKK kapsamında hastayı bilgilendirmeniz ve onay almanız zorunludur.",
    tip: "Sistemde hasta onayı dijital olarak kaydedilir. Onay tarihi ve saati loglanır.",
  },
  {
    number: 6,
    title: "Mobil Uygulama",
    content: "Resmi 'e-Nabız Doktor' uygulamasını iOS ve Android cihazlara indirin. Kurumsal giriş ile hızlı erişim sağlayın.",
    tip: "Mobil uygulama üzerinden acil durumlarda hasta özetine 10 saniye içinde ulaşabilirsiniz.",
  },
];

export default function ENabizGuidePage() {
  const copyLink = () => {
    navigator.clipboard.writeText("https://nabiz.saglik.gov.tr/kurumsal");
  };

  return (
    <div className="min-h-screen bg-[#0A1628]">
      <DoktorNav />

      <div className="flex justify-center px-4 py-10">
        <div className="w-full max-w-[800px] bg-white rounded-2xl shadow-xl p-10">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-semibold text-gray-900">e-Nabız Kurumsal Erişim Rehberi</h1>
            <p className="mt-2 text-gray-600">Türk doktorları için adım adım hasta kayıtlarına erişim kılavuzu</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Steps */}
            <div className="flex-1 space-y-8">
              {steps.map((step) => (
                <div key={step.number} className="flex gap-5">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center text-2xl font-semibold">
                      {step.number}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-700 leading-relaxed mb-4">{step.content}</p>

                    {/* Tip Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <div className="text-blue-600 mt-0.5">💡</div>
                        <p className="text-sm text-blue-800">{step.tip}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar Shortcut */}
            <div className="lg:w-72 flex-shrink-0">
              <div className="sticky top-8">
                <div className="bg-teal-600 text-white rounded-xl p-6">
                  <h4 className="font-semibold mb-3 text-lg">Hızlı Erişim</h4>
                  <p className="text-sm mb-4 text-teal-100">Kurumsal giriş sayfası:</p>
                  <div 
                    onClick={copyLink}
                    className="bg-white/10 hover:bg-white/20 cursor-pointer transition-colors p-3 rounded-lg text-sm font-mono break-all"
                  >
                    nabiz.saglik.gov.tr/kurumsal
                  </div>
                  <button
                    onClick={copyLink}
                    className="mt-3 w-full text-xs py-2 px-4 bg-white text-teal-700 rounded-lg font-medium hover:bg-teal-50 transition-colors"
                  >
                    Linki Kopyala
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* KVKK Warning */}
          <div className="mt-12 border border-amber-300 bg-amber-50 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="text-amber-600 text-xl">⚠️</div>
              <div>
                <h4 className="font-semibold text-amber-900 mb-1">KVKK ve Yasal Uyarı</h4>
                <p className="text-sm text-amber-800 leading-relaxed">
                  Hasta verilerine erişim KVKK kapsamında yalnızca tıbbi gereklilik ve hasta rızası ile mümkündür. 
                  Yetkisiz erişim cezai yaptırımlara tabidir. Tüm işlemler loglanmaktadır.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
