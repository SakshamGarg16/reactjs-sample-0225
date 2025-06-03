'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../utils/firebase';
import toast from 'react-hot-toast';
import WalletConnect from './Web3Wallet';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
  try {
    await signOut(auth);
    toast.success("Logged out successfully");
  } catch (err) {
    toast.error("Logout failed");
    console.error("Logout error:", err);
  }
};

  if (loading) {
    return (
      <nav className="bg-black shadow p-4 mb-6 flex justify-between items-center">
        <div className="flex gap-4">
          <Link href="/" className="text-white hover:text-gray-300 transition-colors cursor-pointer">
            Dashboard
          </Link>
          <Link href="/profile" className="text-white hover:text-gray-300 transition-colors cursor-pointer">
            Profile
          </Link>
          <Link href="/messages" className="text-white hover:text-gray-300 transition-colors cursor-pointer">
            Messages
          </Link>
        </div>
        <div className="text-white">Loading...</div>
      </nav>
    );
  }

  return (
    <nav className="bg-black shadow p-4 mb-6 flex justify-between items-center">
      <div className="flex gap-6">
        <Link 
          href="/" 
          className="text-white hover:text-blue-400 transition-all duration-200 cursor-pointer font-medium hover:scale-105"
        >
          Dashboard
        </Link>
        <Link 
          href="/profile" 
          className="text-white hover:text-blue-400 transition-all duration-200 cursor-pointer font-medium hover:scale-105"
        >
          Profile
        </Link>
        <Link 
          href="/messages" 
          className="text-white hover:text-blue-400 transition-all duration-200 cursor-pointer font-medium hover:scale-105"
        >
          Messages
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <WalletConnect />
        {user ? (
          <>
            <span className="text-white text-sm bg-gray-800 px-3 py-1 rounded-full">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200 text-sm font-medium cursor-pointer transform hover:scale-105 active:scale-95"
            >
              Logout
            </button>
          </>
        ) : (
          <div className="flex gap-3">
            <Link 
              href="/login" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium cursor-pointer transform hover:scale-105 active:scale-95"
            >
              Login
            </Link>
            <Link 
              href="/signup" 
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 text-sm font-medium cursor-pointer transform hover:scale-105 active:scale-95"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}