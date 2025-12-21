import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { Layout } from "../components/layout/Layout";
import { Toaster } from "../components/ui/toaster";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Prompt Engineering Studio',
  description: 'Bilingual (Arabic/English) prompt engineering IDE',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <Layout>
            {children}
          </Layout>
          <Toaster />
        </QueryClientProvider>
      </body>
    </html>
  )
}
