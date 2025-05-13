import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from './context/AuthContext'
import Navigation from './components/Navigation'
import { CSSProperties } from 'react'

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
  const containerStyle: CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#f9fafb'
  }

  const mainStyle: CSSProperties = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '1.5rem 1rem'
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div style={containerStyle}>
            <Navigation />
            <main style={mainStyle}>
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
} 