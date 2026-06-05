export default function Home() {
  return (
    <main className="min-h-screen bg-[#0A1628] text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">
          <span className="text-[#2563EB]">Notya</span> AI
        </h1>
        <p className="text-2xl text-gray-300 mb-2">Konuş, Biz Yazalım</p>
        <p className="text-gray-500">Türkiye&apos;nin Evrensel Profesyonel AI Not Asistanı</p>
        <div className="mt-8 flex gap-4 justify-center">
          <a href="/dashboard" className="bg-[#2563EB] px-8 py-3 rounded-lg font-semibold hover:bg-blue-500 transition">
            Ücretsiz Dene
          </a>
          <a href="#how-it-works" className="border border-gray-600 px-8 py-3 rounded-lg font-semibold hover:border-gray-400 transition">
            Nasıl Çalışır?
          </a>
        </div>
        <p className="mt-6 text-sm text-gray-600">🔐 KVKK Uyumlu • 🇹🇷 Türkçe AI • 🏥 9 Meslek</p>
      </div>
    </main>
  )
}
