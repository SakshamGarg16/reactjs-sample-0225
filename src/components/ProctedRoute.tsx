'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../utils/firebase';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log('ProtectedRoute: Setting up auth listener');
    
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      console.log('ProtectedRoute: Auth state changed', { user: !!user });
      
      if (user) {
        setUser(user);
        setLoading(false);
      } else {
        console.log('ProtectedRoute: No user, redirecting to login');
        router.replace('/login');
      }
    });

    return () => {
      console.log('ProtectedRoute: Cleaning up auth listener');
      unsubscribe();
    };
  }, [router]);

  console.log('ProtectedRoute: Render state', { loading, hasUser: !!user });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Checking authentication...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting to login...</div>
      </div>
    );
  }

  return <>{children}</>;
}