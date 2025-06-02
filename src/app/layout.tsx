import './globals.css';
import Navbar from '../components/Navbar';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Task Board',
  description: 'A simple task management application',
};

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-800">
        <Navbar />
        <main className="container mx-auto px-4">
          {children}
        </main>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
