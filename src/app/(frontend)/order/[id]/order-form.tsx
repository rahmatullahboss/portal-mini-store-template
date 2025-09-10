'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

interface OrderFormProps {
  snack: any
  user?: any
}

export default function OrderForm({ snack, user }: OrderFormProps) {
  const [quantity, setQuantity] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [customerNumber, setCustomerNumber] = useState<string>(user?.customerNumber || '')
  const [firstName, setFirstName] = useState<string>(user?.firstName || '')
  const [lastName, setLastName] = useState<string>(user?.lastName || '')
  const [email, setEmail] = useState<string>(user?.email || '')
  const [address_line1, setAddressLine1] = useState<string>(user?.address?.line1 || '')
  const [address_line2, setAddressLine2] = useState<string>(user?.address?.line2 || '')
  const [address_city, setAddressCity] = useState<string>(user?.address?.city || '')
  const [address_state, setAddressState] = useState<string>(user?.address?.state || '')
  const [address_postalCode, setAddressPostalCode] = useState<string>(user?.address?.postalCode || '')
  const [address_country, setAddressCountry] = useState<string>(user?.address?.country || '')
  const router = useRouter()

  const totalPrice = (snack.price * quantity).toFixed(2)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              snack: snack.id,
              quantity,
            },
          ],
          totalAmount: parseFloat(totalPrice),
          customerNumber,
          ...(user
            ? {
                // Optional override shipping
                shippingAddress:
                  address_line1 || address_city || address_postalCode || address_country
                    ? {
                        line1: address_line1,
                        line2: address_line2 || undefined,
                        city: address_city,
                        state: address_state || undefined,
                        postalCode: address_postalCode,
                        country: address_country,
                      }
                    : undefined,
              }
            : {
                // Guest checkout details
                customerName: `${firstName} ${lastName}`.trim(),
                customerEmail: email,
                shippingAddress: {
                  line1: address_line1,
                  line2: address_line2 || undefined,
                  city: address_city,
                  state: address_state || undefined,
                  postalCode: address_postalCode,
                  country: address_country,
                },
              }),
        }),
      })

      if (response.ok) {
        const data = await response.json().catch(() => null)
        const oid = (data as any)?.doc?.id
        // Save confirmation preview for guest page
        try {
          sessionStorage.setItem(
            'last-order-preview',
            JSON.stringify({
              orderId: oid,
              items: [
                {
                  name: snack?.name,
                  image: snack?.image || (snack?.imageUrl ? { url: snack.imageUrl } : undefined),
                },
              ],
            }),
          )
        } catch {}
        if (user) {
          router.push(oid ? `/my-orders?success=true&orderId=${oid}` : '/my-orders?success=true')
        } else {
          router.push(oid ? `/order-confirmation?orderId=${oid}` : '/order-confirmation')
        }
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to place order')
      }
    } catch (err) {
      setError('Failed to place order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <label htmlFor="quantity" className="text-sm font-medium">
          Quantity:
        </label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            variant="outline"
            size="sm"
          >
            -
          </Button>
          <Input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            className="w-20 text-center"
          />
          <Button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            variant="outline"
            size="sm"
          >
            +
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="customerNumber" className="text-sm font-medium">
          Customer number
        </label>
        <Input
          id="customerNumber"
          value={customerNumber}
          onChange={(e) => setCustomerNumber(e.target.value)}
          placeholder="e.g. +1 555 123 4567"
          required
        />
      </div>

      {/* Customer Details (for guests) */}
      {!user ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm font-medium">First name</label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm font-medium">Last name</label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
      ) : null}

      {/* Shipping Address */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Shipping address</h3>
        <div className="space-y-2">
          <label htmlFor="address_line1" className="text-sm font-medium">Address line 1</label>
          <Input id="address_line1" value={address_line1} onChange={(e) => setAddressLine1(e.target.value)} required={!user} />
        </div>
        <div className="space-y-2">
          <label htmlFor="address_line2" className="text-sm font-medium">Address line 2 (optional)</label>
          <Input id="address_line2" value={address_line2} onChange={(e) => setAddressLine2(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="address_city" className="text-sm font-medium">City</label>
            <Input id="address_city" value={address_city} onChange={(e) => setAddressCity(e.target.value)} required={!user} />
          </div>
          <div className="space-y-2">
            <label htmlFor="address_state" className="text-sm font-medium">State / Region</label>
            <Input id="address_state" value={address_state} onChange={(e) => setAddressState(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="address_postalCode" className="text-sm font-medium">Postal code</label>
            <Input id="address_postalCode" value={address_postalCode} onChange={(e) => setAddressPostalCode(e.target.value)} required={!user} />
          </div>
          <div className="space-y-2">
            <label htmlFor="address_country" className="text-sm font-medium">Country</label>
            <Input id="address_country" value={address_country} onChange={(e) => setAddressCountry(e.target.value)} required={!user} />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Total: ৳{totalPrice}</h3>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Placing Order...' : 'Place Order'}
      </Button>
    </form>
  )
}
