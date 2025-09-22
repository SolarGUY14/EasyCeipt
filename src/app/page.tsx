'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export default function Home() {
  const { user } = useAuth()

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
            className="inline-block px-6 py-3 text-base font-semibold text-purple-600 bg-transparent border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors duration-200"
          >
            Login
          </Link>
          <Link 
            href="/register" 
            className="inline-block px-6 py-3 text-base font-semibold text-white bg-purple-600 border border-purple-600 rounded-lg hover:bg-purple-700 transition-colors duration-200"
          >
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  )
}
