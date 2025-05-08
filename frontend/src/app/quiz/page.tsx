'use client'

import { useState } from 'react'
import axios from 'axios'

export default function Quiz() {
  const [chart, setChart] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ correct: boolean; eloChange: number } | null>(null)

  const fetchRandomChart = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/quiz/random')
      setChart(response.data.chartImageUrl)
      setResult(null)
    } catch (error) {
      console.error('Error fetching chart:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitPrediction = async (prediction: 'up' | 'down') => {
    try {
      setLoading(true)
      const response = await axios.post('/api/quiz/submit', {
        chartId: chart,
        prediction,
      })
      setResult(response.data)
    } catch (error) {
      console.error('Error submitting prediction:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Trading Quiz</h1>
        
        {!chart && !loading && (
          <button
            onClick={fetchRandomChart}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-500"
          >
            Start New Quiz
          </button>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        )}

        {chart && !loading && (
          <div className="space-y-6">
            <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden">
              <img src={chart} alt="Trading Chart" className="object-contain" />
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => submitPrediction('up')}
                className="bg-green-500 text-white py-2 px-6 rounded-md hover:bg-green-600"
              >
                Price Will Go Up
              </button>
              <button
                onClick={() => submitPrediction('down')}
                className="bg-red-500 text-white py-2 px-6 rounded-md hover:bg-red-600"
              >
                Price Will Go Down
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className={`mt-6 p-4 rounded-md ${result.correct ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className="text-lg font-semibold">
              {result.correct ? 'Correct!' : 'Incorrect!'}
            </p>
            <p className="text-gray-600">
              Your ELO changed by: {result.eloChange > 0 ? '+' : ''}{result.eloChange}
            </p>
            <button
              onClick={fetchRandomChart}
              className="mt-4 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-500"
            >
              Next Question
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 