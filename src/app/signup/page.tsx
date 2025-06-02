'use client';

import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, AuthError } from 'firebase/auth';
import { auth } from '../../utils/firebase';
import { useRouter } from 'next/navigation';


export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mounted || !auth) {
      return;
    }


    if (password.length < 6) {
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (error) {
      console.log(error)
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
      <input
        type="email"
        placeholder="Email"
        className="border p-2 mb-2 w-full"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="border p-2 mb-2 w-full"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        className="bg-green-500 text-white px-4 py-2 rounded"
        onClick={handleSignup}
      >
        Sign Up
      </button>
      <p className="mt-4 text-sm">
        Already have an account? <a className="text-blue-500" href="/login">Login</a>
      </p>
    </div>
  );
}
