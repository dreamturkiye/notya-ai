// app/sandbox/dr-ayse/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DrAyseSandbox() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/sandbox/dr-ayse/doctor');
  }, [router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#333', color: '#fff' }}>
      <span>Redirecting...</span>
      <span role="img" aria-label="doctor">🏥</span>
    </div>
  );
}