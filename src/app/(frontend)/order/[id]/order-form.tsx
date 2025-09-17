'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import type { DeliverySettings } from '@/lib/delivery-settings'
import { DEFAULT_DELIVERY_SETTINGS } from '@/lib/delivery-settings'
import { cn } from '@/lib/utils'
import {
  PAYMENT_OPTIONS,
  type PaymentMethod,
  isDigitalPaymentMethod,
} from '@/lib/payment-options'

interface OrderFormProps {
  item: any
  user?: any
  deliverySettings?: DeliverySettings
}

export default function OrderForm({ item, user, deliverySettings }: OrderFormProps) {
  const [quantity, setQuantity] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [customerNumber, setCustomerNumber] = useState<string>(user?.customerNumber || '')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')
  const [paymentSenderNumber, setPaymentSenderNumber] = useState('')
  const [paymentTransactionId, setPaymentTransactionId] = useState('')
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
  const subtotal = Number(item.price) * quantity
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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    if (requiresDigitalPaymentDetails) {
      if (!paymentSenderNumber.trim()) {
        setError('Please provide the sender number used for the payment.')
        setIsSubmitting(false)
        return
      }

      if (!paymentTransactionId.trim()) {
        setError('Please provide the transaction ID from your payment receipt.')
        setIsSubmitting(false)
        return
      }
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              item: item.id,
              quantity,
            },
          ],
          customerNumber,
          deliveryZone,
          paymentMethod,
          paymentSenderNumber: requiresDigitalPaymentDetails ? paymentSenderNumber.trim() : undefined,
          paymentTransactionId: requiresDigitalPaymentDetails ? paymentTransactionId.trim() : undefined,
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
                  name: item?.name,
                  image: item?.image || (item?.imageUrl ? { url: item.imageUrl } : undefined),
                },
              ],
              subtotal: (data as any)?.doc?.subtotal ?? subtotal,
              shippingCharge: (data as any)?.doc?.shippingCharge ?? shippingCharge,
              totalAmount: (data as any)?.doc?.totalAmount ?? total,
              paymentMethod,
              paymentSenderNumber: requiresDigitalPaymentDetails ? paymentSenderNumber.trim() : undefined,
              paymentTransactionId: requiresDigitalPaymentDetails ? paymentTransactionId.trim() : undefined,
              deliveryZone: (data as any)?.doc?.deliveryZone ?? deliveryZone,
              freeDeliveryApplied: (data as any)?.doc?.freeDeliveryApplied ?? freeDelivery,
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

      {/* Delivery Zone */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Delivery area</h3>
        <p className="text-sm text-gray-500">
          Choose whether this address is inside or outside Dhaka to calculate delivery charges.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            className={cn(
              'border rounded-lg p-3 cursor-pointer transition focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500',
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
              'border rounded-lg p-3 cursor-pointer transition focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500',
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
                setError('')
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
            <Input
              id="paymentSenderNumber"
              name="paymentSenderNumber"
              type="tel"
              value={paymentSenderNumber}
              onChange={(e) => {
                setPaymentSenderNumber(e.target.value)
                setError('')
              }}
              required={requiresDigitalPaymentDetails}
              placeholder="e.g. 01XXXXXXXXX"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="paymentTransactionId" className="text-sm font-medium text-gray-700">
              Transaction ID
            </label>
            <Input
              id="paymentTransactionId"
              name="paymentTransactionId"
              type="text"
              value={paymentTransactionId}
              onChange={(e) => {
                setPaymentTransactionId(e.target.value)
                setError('')
              }}
              required={requiresDigitalPaymentDetails}
              placeholder="e.g. TXN123456789"
            />
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-500">You can pay in cash when the delivery arrives.</p>
      )}
    </div>
      <Separator />

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Order total</h3>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Delivery ({deliveryZone === 'outside_dhaka' ? 'Outside Dhaka' : 'Inside Dhaka'})</span>
            <span>{freeDelivery ? 'Free' : formatCurrency(shippingCharge)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-base font-semibold">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
        {freeDelivery ? (
          <p className="text-xs text-green-600 font-semibold">Free delivery applied for this order.</p>
        ) : (
          <p className="text-xs text-gray-500">
            Spend {formatCurrency(settings.freeDeliveryThreshold)} to unlock free delivery.
          </p>
        )}
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



