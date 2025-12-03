// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";

import { Toaster } from '@/components/ui/toaster'


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CommissionFlow - AI-Powered Sales Commission Management",
  description: "Simplify sales commission tracking, calculation, and payments with AI-powered tools for SMBs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>{children}<Toaster/></body>
      </html>
    </ClerkProvider>
  );
}