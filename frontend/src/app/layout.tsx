import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Trading Quiz App',
  description: 'Test your trading skills with our interactive quiz',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <h1 className="text-xl font-bold text-primary-600">Trading Quiz</h1>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    <a href="/" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-primary-500">
                      Home
                    </a>
                    <a href="/quiz" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-primary-500">
                      Quiz
                    </a>
                    <a href="/leaderboard" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-primary-500">
                      Leaderboard
                    </a>
                  </div>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:items-center">
                  <a href="/profile" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-primary-500">
                    Profile
                  </a>
                </div>
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
} 