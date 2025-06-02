import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'Task Board',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-gray-800">
        <nav className="bg-black shadow p-4 mb-6 flex gap-4">
          <Link href="/">Dashboard</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/messages">Messages</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
