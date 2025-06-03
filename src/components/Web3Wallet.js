'use client';

import { useEffect, useState } from 'react';
import { auth } from '../utils/firebase';
import { db } from '../utils/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { ethers } from 'ethers';


export default function WalletConnect() {
  const [account, setAccount] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setIsClient(true);
    if(isClient);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setAccount(null); // disconnect wallet if user logs out
      }
    });

    return () => unsubscribe();
  }, []);

  const connectWallet = async () => {
  if (!user) {
    alert("Login first to connect wallet.");
    return;
  }

  if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();

      // Ask for signature
      const message = `Linking wallet to user: ${user.email}`;
      const signature = await signer.signMessage(message);

      // Save wallet to Firestore (optional)
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        wallet: walletAddress,
        signature: signature,
      });

      setAccount(walletAddress);
    } catch (err) {
      console.error("Error connecting wallet:", err);
    }
  } else {
    alert("MetaMask not detected!");
  }
};


  return (
    <div>
      {account ? (
        <p className="text-sm">Wallet: {account.slice(0, 6)}...{account.slice(-4)}</p>
      ) : (
        <button onClick={connectWallet} className="btn">
          Connect Wallet
        </button>
      )}
    </div>
  );
}
