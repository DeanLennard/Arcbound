// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import React from "react";
import Header from '@/components/Header';
import ClientLayout from '@/components/ClientLayout';
import ChatDock from '@/components/chat/ChatDock';

export const metadata: Metadata = {
  title: "Arcbound",
  description: "Arcbound: Build your space story",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en">
        <body className="bg-gray-900 text-white">
          <ClientLayout>
            <Header />
            <main className="pt-4">{children}</main>
            <Toaster position="top-right" />
            <ChatDock />
          </ClientLayout>
        </body>
      </html>
  );
}