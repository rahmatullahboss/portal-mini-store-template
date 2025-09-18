'use client'

import React, { useState, useEffect, Suspense, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SiteHeader } from '@/components/site-header'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  const mergeGuestCart = useCallback(async () => {
    if (typeof window === 'undefined') return
    try {
      const savedCart = window.localStorage.getItem('dyad-cart')
      if (!savedCart) return
      const parsed = JSON.parse(savedCart) as unknown
      const itemsRaw = isRecord(parsed) ? parsed.items : null
      if (!Array.isArray(itemsRaw)) {
        window.localStorage.removeItem('dyad-cart')
        return
      }

      const itemsPayload = itemsRaw
        .map((item) => {
          if (!isRecord(item)) return null
          const idValue = item.id
          if (typeof idValue !== 'string' && typeof idValue !== 'number') return null
          const quantityRaw = Number(item.quantity)
          const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? Math.floor(quantityRaw) : 0
          if (quantity <= 0) return null
          return {
            id: typeof idValue === 'number' ? String(idValue) : idValue,
            quantity,
          }
        })
        .filter((item): item is { id: string; quantity: number } => item !== null)

      if (!itemsPayload.length) {
        window.localStorage.removeItem('dyad-cart')
        return
      }

      const response = await fetch('/api/cart/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items: itemsPayload }),
      })

      if (!response.ok) {
        if (response.status === 401) return
        throw new Error(`Merge failed with status ${response.status}`)
      }

      const data = (await response.json().catch(() => null)) as unknown
      if (!isRecord(data)) {
        window.localStorage.removeItem('dyad-cart')
        return
      }

      const mergedItemsRaw = Array.isArray((data as Record<string, unknown>).items)
        ? (data as Record<string, unknown>).items
        : []

      const mergedItems = mergedItemsRaw
        .map((item) => {
          if (!isRecord(item)) return null
          const idValue = item.id
          if (typeof idValue !== 'string') return null
          const quantityRaw = Number(item.quantity)
          const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? Math.floor(quantityRaw) : 0
          if (quantity <= 0) return null
          const priceRaw = Number(item.price)
          const price = Number.isFinite(priceRaw) && priceRaw >= 0 ? priceRaw : 0
          const next: Record<string, unknown> = {
            ...item,
            id: idValue,
            quantity,
            price,
          }
          const imageValue = item.image
          if (isRecord(imageValue) && typeof imageValue.url === 'string') {
            next.image = {
              url: imageValue.url,
              ...(typeof imageValue.alt === 'string' ? { alt: imageValue.alt } : {}),
            }
          }
          return next
        })
        .filter((item): item is Record<string, unknown> => item !== null)

      if (!mergedItems.length) {
        window.localStorage.removeItem('dyad-cart')
        return
      }

      const snapshotSource = isRecord((data as Record<string, unknown>).snapshot)
        ? ((data as Record<string, unknown>).snapshot as Record<string, unknown>)
        : null

      const snapshot: Record<string, number> = snapshotSource
        ? Object.entries(snapshotSource).reduce((acc, [key, value]) => {
            if (typeof key === 'string') {
              const qty = Number(value)
              if (Number.isFinite(qty) && qty >= 0) {
                acc[key] = Math.floor(qty)
              }
            }
            return acc
          }, {} as Record<string, number>)
        : mergedItems.reduce((acc, item) => {
            const idValue = item.id
            const quantityValue = Number((item as any).quantity)
            if (typeof idValue === 'string' && Number.isFinite(quantityValue)) {
              acc[idValue] = Math.floor(quantityValue)
            }
            return acc
          }, {} as Record<string, number>)

      window.localStorage.setItem(
        'dyad-cart',
        JSON.stringify({ items: mergedItems, serverSnapshot: snapshot }),
      )
    } catch (error) {
      console.error('Failed to merge guest cart:', error)
    }
  }, [])

  useEffect(() => {
    const messageParam = searchParams.get('message')
    if (messageParam) {
      setMessage(messageParam)
    }
  }, [searchParams])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    if (!formData.email || !formData.password) {
      setError('Email and password are required')
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          rememberMe,
        }),
      })

      if (response.ok) {
        // Login successful, redirect to home
        await mergeGuestCart()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dyad-auth-changed'))
        }
        router.push('/')
        router.refresh()
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Login failed. Please check your credentials.')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader variant="full" />
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Sign in to your account</h1>
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-red-600 hover:text-red-500">
              Sign up
            </Link>
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Enter your email and password to sign in</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {message && (
                <Alert>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-red-600 hover:text-red-500"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <label htmlFor="remember-me" className="text-sm text-gray-600 select-none">
                  Keep me logged in
                </label>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
