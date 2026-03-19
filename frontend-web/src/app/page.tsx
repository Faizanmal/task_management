'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './providers/AuthProvider';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/tasks');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
    }}>
      <p style={{ color: '#6b7280' }}>Loading...</p>
    </div>
  );
}
