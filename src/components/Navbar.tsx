'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../utils/firebase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = async () => {
    if (!auth) {
      toast.error('Authentication service not available');
      return;
    }

    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  // Don't render anything while loading
  if (loading) {
    return (
      <nav className="bg-black shadow p-4 mb-6 flex justify-between items-center">
        <div className="flex gap-4">
          <Link href="/" className="text-white hover:text-gray-300 transition-colors">
            Dashboard
          </Link>
          <Link href="/profile" className="text-white hover:text-gray-300 transition-colors">
            Profile
          </Link>
          <Link href="/messages" className="text-white hover:text-gray-300 transition-colors">
            Messages
          </Link>
        </div>
        <div className="text-white">Loading...</div>
      </nav>
    );
  }

  return (
    <nav className="bg-black shadow p-4 mb-6 flex justify-between items-center">
      <div className="flex gap-4">
        <Link href="/" className="text-white hover:text-gray-300 transition-colors">
          Dashboard
        </Link>
        <Link href="/profile" className="text-white hover:text-gray-300 transition-colors">
          Profile
        </Link>
        <Link href="/messages" className="text-white hover:text-gray-300 transition-colors">
          Messages
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-white text-sm">
              Welcome, {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Logout
            </button>
          </>
        ) : (
          <div className="flex gap-2">
            <Link 
              href="/login" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Login
            </Link>
            <Link 
              href="/signup" 
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}