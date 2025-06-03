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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      setIsMobileMenuOpen(false);
    } catch (err) {
      toast.error("Logout failed");
      console.error("Logout error:", err);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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
    <nav className="bg-black shadow mb-6">
      <div className="px-4 py-4">
        {/* Main navbar content */}
        <div className="flex justify-between items-center">
          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-6">
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

          {/* Mobile Hamburger Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden text-white hover:text-blue-400 transition-colors duration-200 p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Right side - User Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:block">
              <WalletConnect />
            </div>

            {user ? (
              <>
                <span className="hidden lg:inline text-white text-sm bg-gray-800 px-3 py-1 rounded-full max-w-[150px] truncate">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200 text-xs md:text-sm font-medium cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2 md:gap-3">
                <Link 
                  href="/login" 
                  className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 text-xs md:text-sm font-medium cursor-pointer"
                >
                  Login
                </Link>
                <Link 
                  href="/signup" 
                  className="bg-green-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 text-xs md:text-sm font-medium cursor-pointer"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu - Simple dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-700">
            <div className="space-y-2">
              <Link 
                href="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-white hover:text-blue-400 transition-colors duration-200 py-2 px-2 rounded hover:bg-gray-800"
              >
                Dashboard
              </Link>
              <Link 
                href="/profile" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-white hover:text-blue-400 transition-colors duration-200 py-2 px-2 rounded hover:bg-gray-800"
              >
                Profile
              </Link>
              <Link 
                href="/messages" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-white hover:text-blue-400 transition-colors duration-200 py-2 px-2 rounded hover:bg-gray-800"
              >
                Messages
              </Link>
              
              {/* Mobile only sections */}
              <div className="sm:hidden pt-2 border-t border-gray-700">
                <WalletConnect />
              </div>
              
              {user && (
                <div className="lg:hidden pt-2">
                  <span className="block text-white text-sm bg-gray-800 px-3 py-2 rounded">
                    {user.email}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}