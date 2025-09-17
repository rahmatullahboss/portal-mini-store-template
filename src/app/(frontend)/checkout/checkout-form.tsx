'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

import { useCart } from '@/lib/cart-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { DeliverySettings } from '@/lib/delivery-settings'
import { DEFAULT_DELIVERY_SETTINGS } from '@/lib/delivery-settings'
import { cn } from '@/lib/utils'
import {
  PAYMENT_OPTIONS,
  type PaymentMethod,
  isDigitalPaymentMethod,
} from '@/lib/payment-options'

interface CheckoutFormProps {
  user?: any
  deliverySettings?: DeliverySettings
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ user, deliverySettings }) => {
  const { state, clearCart, getTotalPrice } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customerNumber, setCustomerNumber] = useState<string>(user?.customerNumber || '')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')
  const [paymentSenderNumber, setPaymentSenderNumber] = useState<string>('')
  const [paymentTransactionId, setPaymentTransactionId] = useState<string>('')
  const [firstName, setFirstName] = useState<string>(user?.firstName || '')
  const [lastName, setLastName] = useState<string>(user?.lastName || '')
  const [email, setEmail] = useState<string>(user?.email || '')
  const [address_line1, setAddressLine1] = useState<string>(user?.address?.line1 || '')
  const [address_line2, setAddressLine2] = useState<string>(user?.address?.line2 || '')
  const [address_city, setAddressCity] = useState<string>(user?.address?.city || '')
  const [address_state, setAddressState] = useState<string>(user?.address?.state || '')
  const [address_postalCode, setAddressPostalCode] = useState<string>(user?.address?.postalCode || '')
  const [address_country, setAddressCountry] = useState<string>(user?.address?.country || '')
  const [deliveryZone, setDeliveryZone] = useState<'inside_dhaka' | 'outside_dhaka'>(
    user?.deliveryZone === 'outside_dhaka' ? 'outside_dhaka' : 'inside_dhaka',
  )
  const settings = deliverySettings || DEFAULT_DELIVERY_SETTINGS
  const subtotal = getTotalPrice()
  const freeDelivery = subtotal >= settings.freeDeliveryThreshold
  const shippingCharge = freeDelivery
    ? 0
    : deliveryZone === 'outside_dhaka'
      ? settings.outsideDhakaCharge
      : settings.insideDhakaCharge
  const total = subtotal + shippingCharge
  const formatCurrency = (value: number) => `Tk ${value.toFixed(2)}`
  const router = useRouter()
  const requiresDigitalPaymentDetails = isDigitalPaymentMethod(paymentMethod)

  // Persist guest details for abandoned cart tracking
  React.useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem('dyad-guest-email', email || '')
        localStorage.setItem('dyad-guest-number', customerNumber || '')
        const name = `${firstName} ${lastName}`.trim()
        localStorage.setItem('dyad-guest-name', name)
      } catch {}
    }
  }, [user, email, customerNumber, firstName, lastName])

  // Proactively sync abandoned cart record when guest details change
  React.useEffect(() => {
    if (user) return
    if (!state.items.length) return
    const controller = new AbortController()
    const handle = setTimeout(() => {
      try {
        const subtotalValue = subtotal
        const shippingValue = shippingCharge
        const totalValue = subtotalValue + shippingValue
        const name = `${firstName} ${lastName}`.trim()
        fetch('/api/cart-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: state.items.map((i) => ({ id: i.id, quantity: i.quantity })),
            subtotal: subtotalValue,
            shipping: shippingValue,
            total: totalValue,
            deliveryZone,
            customerEmail: email || undefined,
            customerNumber: customerNumber || undefined,
            customerName: name || undefined,
          }),
          keepalive: true,
          signal: controller.signal,
        }).catch(() => {})
      } catch {}
    }, 600)
    return () => {
      controller.abort()
      clearTimeout(handle)
    }
  }, [user, state.items, email, customerNumber, firstName, lastName, subtotal, shippingCharge, deliveryZone])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (state.items.length === 0) {
      setError('Your cart is empty')
      return
    }

    if (requiresDigitalPaymentDetails) {
      if (!paymentSenderNumber.trim()) {
        setError('Please provide the sender number used for the payment.')
        return
      }
      if (!paymentTransactionId.trim()) {
        setError('Please provide the transaction ID from your payment receipt.')
        return
      }
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: state.items.map((ci) => ({
            item: ci.id,
            quantity: ci.quantity,
          })),
          customerNumber,
          deliveryZone,
          paymentMethod,
          paymentSenderNumber: requiresDigitalPaymentDetails ? paymentSenderNumber.trim() : undefined,
          paymentTransactionId: requiresDigitalPaymentDetails ? paymentTransactionId.trim() : undefined,
          ...(user
            ? {
                // Use provided shipping if filled, otherwise API will fall back to user profile
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
                // Guest checkout requires full details
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

      if (!response.ok) {
        throw new Error('Failed to place order')
      }

      const result = await response.json()
      // Save a lightweight preview for confirmation page
      try {
        sessionStorage.setItem(
          'last-order-preview',
          JSON.stringify({
            orderId: result?.doc?.id,
            items: state.items.map((i) => ({ name: i.name, image: i.image })),
            subtotal: result?.doc?.subtotal ?? subtotal,
            shippingCharge: result?.doc?.shippingCharge ?? shippingCharge,
            totalAmount: result?.doc?.totalAmount ?? total,
            deliveryZone: result?.doc?.deliveryZone ?? deliveryZone,
            freeDeliveryApplied: result?.doc?.freeDeliveryApplied ?? freeDelivery,
            paymentMethod,
            paymentSenderNumber: requiresDigitalPaymentDetails ? paymentSenderNumber.trim() : undefined,
            paymentTransactionId: requiresDigitalPaymentDetails ? paymentTransactionId.trim() : undefined,
          }),
        )
      } catch {}
      clearCart()
      if (user) {
        router.push(`/my-orders?success=true&orderId=${result.doc.id}`)
      } else {
        router.push(result?.doc?.id ? `/order-confirmation?orderId=${result.doc.id}` : '/order-confirmation')
      }
    } catch (err) {
      setError('Failed to place order. Please try again.')
      console.error('Order submission error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (state.items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Your cart is empty</p>
        <Button asChild>
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Summary */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
        <div className="space-y-3">
          {state.items.map((item) => (
            <Card key={item.id} className="p-3">
              <div className="flex items-center gap-3">
                {item.image && (
                  <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image.url}
                      alt={item.image.alt || item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.name}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(item.price)} x {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>
              Delivery ({deliveryZone === 'outside_dhaka' ? 'Outside Dhaka' : 'Inside Dhaka'})
            </span>
            <span>{freeDelivery ? 'Free' : formatCurrency(shippingCharge)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
      {/* Customer Details (for guests) */}
      {!user ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="firstName" className="text-sm font-medium">First name</label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="lastName" className="text-sm font-medium">Last name</label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500"
            />
          </div>
        </div>
      ) : null}

      {/* Shipping Address */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Shipping address</h3>
        <div className="space-y-1">
          <label htmlFor="address_line1" className="text-sm font-medium">Address line 1</label>
          <input
            id="address_line1"
            value={address_line1}
            onChange={(e) => setAddressLine1(e.target.value)}
            required={!user}
            placeholder="House, street, area"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="address_line2" className="text-sm font-medium">Address line 2 (optional)</label>
          <input
            id="address_line2"
            value={address_line2}
            onChange={(e) => setAddressLine2(e.target.value)}
            placeholder="Apartment, suite, etc."
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="address_city" className="text-sm font-medium">City</label>
            <input
              id="address_city"
              value={address_city}
              onChange={(e) => setAddressCity(e.target.value)}
              required={!user}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="address_state" className="text-sm font-medium">State / Region</label>
            <input
              id="address_state"
              value={address_state}
              onChange={(e) => setAddressState(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="address_postalCode" className="text-sm font-medium">Postal code</label>
            <input
              id="address_postalCode"
              value={address_postalCode}
              onChange={(e) => setAddressPostalCode(e.target.value)}
              required={!user}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="address_country" className="text-sm font-medium">Country</label>
            <input
              id="address_country"
              value={address_country}
              onChange={(e) => setAddressCountry(e.target.value)}
              required={!user}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Delivery Zone */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Delivery area</h3>
        <p className="text-sm text-gray-500">
          Select where this order will be delivered so we can apply the correct delivery charge.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            className={cn(
              "border rounded-lg p-3 cursor-pointer transition focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500",
              deliveryZone === 'inside_dhaka' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200',
            )}
          >
            <input
              type="radio"
              name="deliveryZone"
              value="inside_dhaka"
              checked={deliveryZone === 'inside_dhaka'}
              onChange={() => setDeliveryZone('inside_dhaka')}
              className="sr-only"
            />
            <div className="font-medium">Inside Dhaka</div>
            <p className="text-sm text-gray-500">Delivery charge {formatCurrency(settings.insideDhakaCharge)}</p>
          </label>
          <label
            className={cn(
              "border rounded-lg p-3 cursor-pointer transition focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500",
              deliveryZone === 'outside_dhaka' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200',
            )}
          >
            <input
              type="radio"
              name="deliveryZone"
              value="outside_dhaka"
              checked={deliveryZone === 'outside_dhaka'}
              onChange={() => setDeliveryZone('outside_dhaka')}
              className="sr-only"
            />
            <div className="font-medium">Outside Dhaka</div>
            <p className="text-sm text-gray-500">Delivery charge {formatCurrency(settings.outsideDhakaCharge)}</p>
          </label>
        </div>
        {freeDelivery ? (
          <p className="text-sm text-green-600 font-semibold">Free delivery applied for this order.</p>
        ) : (
          <p className="text-xs text-gray-500">
            Free delivery applies automatically when your subtotal reaches {formatCurrency(settings.freeDeliveryThreshold)}.
          </p>
        )}
      </div>

      {/* Payment Method */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Payment method</h3>
        <p className="text-sm text-gray-500">
          Choose how you would like to pay. Digital wallet payments require a completed transfer before placing the order.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PAYMENT_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={cn(
                  'border rounded-lg p-3 cursor-pointer transition flex flex-col items-center gap-2 text-center focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500',
                  paymentMethod === option.value ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200',
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option.value}
                  checked={paymentMethod === option.value}
                  onChange={() => {
                    setPaymentMethod(option.value)
                    if (option.value === 'cod') {
                      setPaymentSenderNumber('')
                      setPaymentTransactionId('')
                    }
                    setError(null)
                  }}
                  className="sr-only"
                />
                <div className="relative w-32 h-16">
                  <Image
                    src={option.logo.src}
                    alt={option.logo.alt}
                    width={option.logo.width}
                    height={option.logo.height}
                    className="h-full w-full object-contain"
                    sizes="128px"
                    priority={option.value === 'cod'}
                  />
                </div>
                <span className="font-medium text-sm">{option.label}</span>
              </label>
          ))}
        </div>

        {requiresDigitalPaymentDetails ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="paymentSenderNumber" className="text-sm font-medium text-gray-700">
                Sender wallet number
              </label>
              <input
                id="paymentSenderNumber"
                name="paymentSenderNumber"
                type="tel"
                value={paymentSenderNumber}
                onChange={(e) => {
                  setPaymentSenderNumber(e.target.value)
                  setError(null)
                }}
                required={requiresDigitalPaymentDetails}
                placeholder="e.g. 01XXXXXXXXX"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="paymentTransactionId" className="text-sm font-medium text-gray-700">
                Transaction ID
              </label>
              <input
                id="paymentTransactionId"
                name="paymentTransactionId"
                type="text"
                value={paymentTransactionId}
                onChange={(e) => {
                  setPaymentTransactionId(e.target.value)
                  setError(null)
                }}
                required={requiresDigitalPaymentDetails}
                placeholder="e.g. TXN123456789"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500"
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            You can pay in cash when the delivery arrives.
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Customer Number */}
      <div className="space-y-2">
        <label htmlFor="customerNumber" className="text-sm font-medium text-gray-700">
          Customer number
        </label>
        <input
          id="customerNumber"
          name="customerNumber"
          type="tel"
          required
          value={customerNumber}
          onChange={(e) => setCustomerNumber(e.target.value)}
          placeholder="e.g. +1 555 123 4567"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500">We will use this to contact you about your order.</p>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
          {isSubmitting ? 'Placing Order...' : 'Place Order'}
        </Button>
      </div>

      {user ? (
        <div className="text-sm text-gray-500 text-center">
          <p>
            Order will be placed for: {user.firstName} {user.lastName}
          </p>
          <p>Email: {user.email}</p>
        </div>
      ) : null}
    </form>
  )
}



