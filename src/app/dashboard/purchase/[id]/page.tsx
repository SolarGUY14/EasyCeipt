'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

interface Purchase {
  id: number
  trans_date: string
  vendor: string
  tot_amount: number
  tax: boolean
  describe: string
  email: string
}

export default function PurchaseDetailPage() {
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const purchaseId = parseInt(params.id as string, 10)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Load purchase details
  useEffect(() => {
    if (user && purchaseId) {
      loadPurchase()
    }
  }, [user, purchaseId])

  const loadPurchase = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('Purchases')
        .select('*')
        .eq('id', purchaseId)
        .eq('email', user.email)
        .single()

      if (error) {
        setError('Purchase not found or access denied')
      } else {
        setPurchase(data)
      }
    } catch (err) {
      setError('Failed to load purchase details')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/dashboard')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center">
              <div className="text-red-600 text-lg mb-4">{error}</div>
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!purchase) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center">
              <div className="text-gray-600 text-lg mb-4">Purchase not found</div>
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Purchase Details</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Purchase Header */}
          <div className="bg-purple-50 px-6 py-4 border-b">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{purchase.vendor}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Purchase ID: {purchase.id}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">
                  ${purchase.tot_amount.toFixed(2)}
                </div>
                {purchase.tax && (
                  <div className="text-sm text-green-600 font-medium mt-1">
                    Tax Paid ✓
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Purchase Details */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Transaction Date
                  </label>
                  <div className="text-lg text-gray-900">
                    {new Date(purchase.trans_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Vendor
                  </label>
                  <div className="text-lg text-gray-900">{purchase.vendor}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Amount
                  </label>
                  <div className="text-lg text-gray-900 font-semibold">
                    ${purchase.tot_amount.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Tax Status
                  </label>
                  <div className="text-lg text-gray-900">
                    {purchase.tax ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Tax Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        No Tax
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Account Email
                  </label>
                  <div className="text-lg text-gray-900">{purchase.email}</div>
                </div>
              </div>
            </div>

            {purchase.describe && (
              <div className="mt-6 pt-6 border-t">
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Description
                </label>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{purchase.describe}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 border-t">
            <div className="flex justify-between items-center">
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                ← Back to Dashboard
              </button>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    // TODO: Implement edit functionality
                    alert('Edit functionality coming soon!')
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  Edit Purchase
                </button>
                
                <button
                  onClick={() => {
                    // TODO: Implement delete functionality
                    if (confirm('Are you sure you want to delete this purchase?')) {
                      alert('Delete functionality will redirect to dashboard with this item selected for deletion')
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                >
                  Delete Purchase
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
