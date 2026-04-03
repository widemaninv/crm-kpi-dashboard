import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Land Acquisition CRM',
  description: 'CRM + KPI Dashboard for land acquisition pipeline',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="max-w-7xl mx-auto flex items-center gap-8">
              <span className="font-bold text-gray-900 text-lg">Land Acquisition CRM</span>
              <div className="flex gap-6 text-sm">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">Dashboard</Link>
                <Link href="/hot-zones" className="text-gray-600 hover:text-gray-900 font-medium">Hot Zones</Link>
                <Link href="/properties" className="text-gray-600 hover:text-gray-900 font-medium">Properties</Link>
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
        </div>
      </body>
    </html>
  )
}
