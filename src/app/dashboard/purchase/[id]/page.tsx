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
  tax_amount: number
  real_amount: number
  describe: string
  email: string
}

export default function PurchaseDetailPage() {
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Purchase>>({})
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
        // Initialize edit form with current data
        setEditForm(data)
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

  const handleDelete = async () => {
    if (!purchase) return
    
    const confirmed = confirm('Are you sure you want to delete this purchase? This action cannot be undone.')
    if (!confirmed) return

    setDeleting(true)
    setError('')
    
    try {
      // Use Supabase client directly for consistency
      const { error } = await supabase
        .from('Purchases')
        .delete()
        .eq('id', purchase.id)
        .eq('email', user?.email)
      
      if (error) {
        throw error
      }
      
      // Redirect to dashboard after successful deletion
      router.push('/dashboard')
      
    } catch (err) {
      console.error('Error deleting purchase:', err)
      setError('Failed to delete purchase. Please try again.')
      setDeleting(false)
    }
  }

  const handleEdit = () => {
    setEditing(true)
    setError('')
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setEditForm(purchase || {})
    setError('')
  }

  const handleSave = async () => {
    if (!purchase || !editForm) return

    setSaving(true)
    setError('')

    try {
      // Validate required fields
      if (!editForm.vendor || !editForm.trans_date || !editForm.tot_amount) {
        throw new Error('Please fill in all required fields')
      }

      // Calculate tax amount if tax is paid
      const taxRate = 0.06 // 6% tax rate
      const taxAmount = editForm.tax ? editForm.tot_amount * taxRate : 0

      const { error } = await supabase
        .from('Purchases')
        .update({
          vendor: editForm.vendor,
          trans_date: editForm.trans_date,
          tot_amount: editForm.tot_amount,
          tax: editForm.tax,
          tax_amount: taxAmount,
          real_amount: taxAmount + editForm.tot_amount,
          describe: editForm.describe || ''
        })
        .eq('id', purchase.id)
        .eq('email', user?.email)

      if (error) {
        throw error
      }

      // Update local state and exit edit mode
      const calculatedTaxAmount = editForm.tax ? editForm.tot_amount * 0.06 : 0
      const updatedPurchase = { 
        ...purchase, 
        ...editForm, 
        tax_amount: calculatedTaxAmount,
        real_amount: editForm.tot_amount + calculatedTaxAmount
      }
      setPurchase(updatedPurchase)
      setEditing(false)
      
    } catch (err: any) {
      console.error('Error updating purchase:', err)
      setError(err.message || 'Failed to update purchase. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof Purchase, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
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
                    Tax Paid: ${purchase.tax_amount?.toFixed(2) || '0.00'} ✓
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Purchase Details */}
          <div className="px-6 py-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Transaction Date
                  </label>
                  {editing ? (
                    <input
                      type="date"
                      value={editForm.trans_date || ''}
                      onChange={(e) => handleInputChange('trans_date', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 font-medium"
                      required
                    />
                  ) : (
                    <div className="text-lg text-gray-900">
                      {new Date(purchase.trans_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Vendor
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.vendor || ''}
                      onChange={(e) => handleInputChange('vendor', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 font-medium"
                      placeholder="Enter vendor name"
                      required
                    />
                  ) : (
                    <div className="text-lg text-gray-900">{purchase.vendor}</div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Amount
                  </label>
                  {editing ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.tot_amount || ''}
                      onChange={(e) => handleInputChange('tot_amount', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 font-medium"
                      placeholder="0.00"
                      required
                    />
                  ) : (
                    <div className="text-lg text-gray-900 font-semibold">
                      ${purchase.tot_amount.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Tax Status
                  </label>
                  {editing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editForm.tax || false}
                        onChange={(e) => handleInputChange('tax', e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-900">Tax was paid on this purchase</span>
                    </label>
                  ) : (
                    <div className="text-lg text-gray-900">
                      {purchase.tax ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Tax Paid
                          </span>
                          <div className="text-sm text-gray-600">
                            Tax Amount: ${purchase.tax_amount?.toFixed(2) || '0.00'} (6%)
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          No Tax
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Account Email
                  </label>
                  <div className="text-lg text-gray-900">{purchase.email}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Description
              </label>
              {editing ? (
                <textarea
                  value={editForm.describe || ''}
                  onChange={(e) => handleInputChange('describe', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  rows={4}
                  placeholder="Enter purchase description (optional)"
                />
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {purchase.describe || 'No description provided'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 border-t">
            <div className="flex justify-between items-center">
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                disabled={editing}
              >
                ← Back to Dashboard
              </button>
              
              <div className="flex space-x-3">
                {editing ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {saving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Save Changes
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleEdit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                    >
                      Edit Purchase
                    </button>
                    
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {deleting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Purchase
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
