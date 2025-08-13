'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Purchase {
  id: string
  description: string
  amount: number
  date: string
}

export default function DashboardPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authChecked, setAuthChecked] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('http://localhost:8000/api/auth/status', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated')
        return res.json()
      })
      .then(data => {
        if (data.authenticated) {
          setAuthenticated(true)
        } else {
          router.push('/login')
        }
      })
      .catch(() => router.push('/login'))
      .finally(() => setAuthChecked(true))
  }, [])

  useEffect(() => {
    if (authenticated) {
      fetch('http://localhost:8000/api/purchases', { credentials: 'include' })
        .then(res => res.json())
        .then(data => setPurchases(data.purchases || []))
        .catch(() => setError('Failed to load purchases'))
    }
  }, [authenticated])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      return newSet
    })
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:8000/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          description: form.description,
          amount: parseFloat(form.amount)
        })
      })
      if (!res.ok) throw new Error('Failed to log purchase')
      const data = await res.json()
      setPurchases(prev => [data.purchase, ...prev])
      setForm({ description: '', amount: '' })
      setShowForm(false)
    } catch (err) {
      setError('Failed to log purchase')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('http://localhost:8000/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
    router.push('/')
  }

  if (!authChecked) {
    return <div>Loading...</div>
  }

  if (!authenticated) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
      <button
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={() => setShowForm(f => !f)}
      >
        {showForm ? 'Cancel' : 'Log New Purchase'}
      </button>
      {showForm && (
        <form className="mb-6 space-y-2" onSubmit={handleSubmit}>
          <input
            name="description"
            value={form.description}
            onChange={handleInput}
            placeholder="Description"
            className="border px-2 py-1 rounded w-full"
            required
          />
          <input
            name="amount"
            type="number"
            value={form.amount}
            onChange={handleInput}
            placeholder="Amount"
            className="border px-2 py-1 rounded w-full"
            required
            min="0"
            step="0.01"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={loading}
          >
            {loading ? 'Logging...' : 'Add Purchase'}
          </button>
        </form>
      )}
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <ul className="space-y-2">
        {purchases.map(p => (
          <li key={p.id} className="flex items-center justify-between border p-3 rounded">
            <div>
              <div className="font-medium">{p.description}</div>
              <div className="text-sm text-gray-500">${p.amount.toFixed(2)} &middot; {new Date(p.date).toLocaleDateString()}</div>
            </div>
            <button
              className={`ml-4 px-3 py-1 rounded border ${selected.has(p.id) ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600'}`}
              onClick={() => toggleSelect(p.id)}
            >
              {selected.has(p.id) ? 'Selected' : 'Select'}
            </button>
          </li>
        ))}
      </ul>
      {purchases.length === 0 && <div className="text-gray-500 mt-8">No purchases yet.</div>}
    </div>
  )
} 