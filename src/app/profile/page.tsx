'use client';

import ProtectedRoute from '../../components/ProctedRoute';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const [pic, setPic] = useState('');

  useEffect(() => {
    const rand = Math.floor(Math.random() * 1000);
    setPic(`https://picsum.photos/id/${rand}/200`);
  }, []);
  return (
    <ProtectedRoute>
      <main className="p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">Profile</h1>
      {pic ? (
        <img src={pic} alt="profile" className="w-32 h-32 rounded-full mx-auto" />
      ) : (
        <p>Loading...</p>
      )}
    </main>
    </ProtectedRoute>
  );
}
