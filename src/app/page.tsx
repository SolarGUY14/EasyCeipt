'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<string>('Loading...')
  const [supabaseStatus, setSupabaseStatus] = useState<string>('Loading...')

  useEffect(() => {
    // Test Flask backend connection
    fetch('http://localhost:8000/api/health')
      .then(res => res.json())
      .then(data => setBackendStatus(data.message))
      .catch(err => setBackendStatus('Error connecting to backend'))

    // Test Supabase connection
    const testSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('_test')
          .select('*')
          .limit(1)
        
        if (error) {
          setSupabaseStatus('Connected to Supabase (table not found, which is OK)')
        } else {
          setSupabaseStatus('Connected to Supabase successfully')
        }
      } catch (err) {
        setSupabaseStatus('Error connecting to Supabase')
      }
    }

    testSupabase()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-4xl font-extrabold text-gray-900 mb-4">
            EasyCeipt
          </h1>
          <div className="text-center space-y-2 mb-8">
            <p className="text-lg text-gray-600">
              Need to track organization expenses? Need to generate receipts at a moment's notice?
            </p>
            <p className="text-lg text-gray-600">
              Perfect!
            </p>
            <p className="text-lg text-gray-600">
              Welcome to EasyCeipt!
            </p>
          </div>
        </div>
        
        <div className="flex justify-center space-x-4">
          <Link 
            href="/login" 
            className="inline-block px-6 py-3 text-base font-semibold text-blue-600 bg-transparent border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200"
          >
            Login
          </Link>
          <Link 
            href="/register" 
            className="inline-block px-6 py-3 text-base font-semibold text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Create an Account
          </Link>
        </div>

        {/* Status cards - keeping them for debugging */}
        <div className="mt-16 grid grid-cols-1 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Backend Status</h3>
            <p className="text-sm text-gray-600">{backendStatus}</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Supabase Status</h3>
            <p className="text-sm text-gray-600">{supabaseStatus}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
