'use client'

import { useState, useEffect } from 'react'

interface APITestResult {
  url: string
  status: number
  statusText: string
  headers: { [k: string]: string }
  ok: boolean
  data?: any
  jsonError?: string
  errorText?: string
  textError?: string
  error?: string
}

export default function DebugPage() {
  const [apiTest, setApiTest] = useState<APITestResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testAPI = async () => {
    setIsLoading(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/leaderboard`)
      
      const result: APITestResult = {
        url: `${apiUrl}/api/leaderboard`,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok
      }
      
      if (response.ok) {
        try {
          const data = await response.json()
          result.data = data
        } catch (e) {
          result.jsonError = (e as Error).message
        }
      } else {
        try {
          const text = await response.text()
          result.errorText = text
        } catch (e) {
          result.textError = (e as Error).message
        }
      }
      
      setApiTest(result)
    } catch (error) {
      setApiTest({ 
        error: (error as Error).message,
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
        status: 0,
        statusText: '',
        headers: {},
        ok: false
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    testAPI()
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>Debug Information</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>Environment Variables</h2>
        <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
          NEXT_PUBLIC_API_URL: {process.env.NEXT_PUBLIC_API_URL || 'undefined'}
          {'\n'}NODE_ENV: {process.env.NODE_ENV || 'undefined'}
        </pre>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Client Info</h2>
        <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
          URL: {typeof window !== 'undefined' ? window.location.href : 'server-side'}
          {'\n'}User Agent: {typeof window !== 'undefined' ? navigator.userAgent : 'server-side'}
        </pre>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>API Test</h2>
        <button 
          onClick={testAPI} 
          disabled={isLoading}
          style={{ padding: '0.5rem 1rem', marginBottom: '1rem' }}
        >
          {isLoading ? 'Testing...' : 'Test API Connection'}
        </button>
        
        {apiTest && (
          <pre style={{ 
            background: apiTest.error ? '#ffe6e6' : '#e6ffe6', 
            padding: '1rem', 
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            {JSON.stringify(apiTest, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
} 