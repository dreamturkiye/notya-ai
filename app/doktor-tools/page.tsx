'use client';

export const dynamic = 'force-dynamic';

import DoktorNav from '@/components/doktor/DoktorNav';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Tool {
  letter: string;
  title: string;
  description: string;
  path: string;
  color: string;
  lightColor: string;
}

const tools: Tool[] = [
  {
    letter: 'eR',
    title: 'e-Reçete Asistanı',
    description: 'Elektronik reçete oluşturun, düzenleyin ve SGK entegrasyonunu hızlıca tamamlayın.',
    path: 'erecete',
    color: '#065F46',
    lightColor: '#d1fae5',
  },
  {
    letter: 'EP',
    title: 'Epikriz Üretici',
    description: 'Hasta özetlerini otomatik oluşturun ve profesyonel epikriz raporları hazırlayın.',
    path: 'epikriz',
    color: '#1e3a5f',
    lightColor: '#dbeafe',
  },
  {
    letter: 'IK',
    title: 'ICD-10 Kodlayıcı',
    description: 'Tanı kodlarını arayın ve doğru ICD-10 kodlarını anında bulun.',
    path: 'icd10',
    color: '#7C2D12',
    lightColor: '#fee2e2',
  },
  {
    letter: 'II',
    title: 'İlaç İnteraksiyon',
    description: 'Reçetelerdeki ilaç etkileşimlerini kontrol edin ve uyarıları görüntüleyin.',
    path: 'ilac-interaksiyon',
    color: '#4C1D95',
    lightColor: '#ede9fe',
  },
  {
    letter: 'SR',
    title: 'SGK Rapor',
    description: 'SGK uyumlu raporları hızlıca oluşturun ve onay süreçlerini yönetin.',
    path: 'sgk-rapor',
    color: '#1B4332',
    lightColor: '#d8f3dc',
  },
  {
    letter: 'HP',
    title: 'Hasta Portalı',
    description: 'Hastalarınızla güvenli iletişim kurun ve portal erişimini yönetin.',
    path: 'hasta-portali',
    color: '#92400e',
    lightColor: '#fef3c7',
  },
  {
    letter: 'HT',
    title: 'Hatırlatma',
    description: 'Randevu ve ilaç hatırlatmalarını planlayın, hasta bildirimlerini gönderin.',
    path: 'hatirlatma',
    color: '#1e40af',
    lightColor: '#eff6ff',
  },
  {
    letter: 'TS',
    title: 'Tetkik İsteği',
    description: 'Laboratuvar ve görüntüleme tetkiklerini oluşturun ve sonuçları takip edin.',
    path: 'tetkik',
    color: '#831843',
    lightColor: '#fce7f3',
  },
  {
    letter: 'eN',
    title: 'e-Nabız Rehberi',
    description: 'e-Nabız entegrasyonu ile hasta verilerine hızlı erişim sağlayın.',
    path: 'enabiz',
    color: '#374151',
    lightColor: '#f3f4f6',
  },
];

export default function DoktorToolsPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    if (!token) {
      router.push('/giris/doktor');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <DoktorNav />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">Doktor Araçları</h1>
          <p className="text-gray-600 mt-2">Günlük iş akışınızı hızlandıracak araçlara erişin.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-semibold mb-4"
                style={{ backgroundColor: tool.color }}
              >
                {tool.letter}
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">{tool.title}</h3>
              <p className="text-gray-600 flex-grow mb-6 leading-relaxed">{tool.description}</p>

              <button
                onClick={() => router.push(`/${tool.path}`)}
                className="w-full py-3 rounded-xl font-medium text-white transition-colors"
                style={{ backgroundColor: tool.color }}
              >
                Aracı Aç
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
