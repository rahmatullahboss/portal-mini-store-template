'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

import { useCart } from '@/lib/cart-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Minus, Plus, ShieldCheck, Store, Truck } from 'lucide-react'
import type { DeliverySettings } from '@/lib/delivery-settings'
import { DEFAULT_DELIVERY_SETTINGS } from '@/lib/delivery-settings'
import { cn } from '@/lib/utils'
import {
  PAYMENT_OPTIONS,
  type PaymentMethod,
  isDigitalPaymentMethod,
  DIGITAL_PAYMENT_INSTRUCTIONS,
} from '@/lib/payment-options'

interface CheckoutFormProps {
  user?: any
  deliverySettings?: DeliverySettings
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ user, deliverySettings }) => {
  const { state, clearCart, getTotalPrice, updateQuantity } = useCart()
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
  const [discountCode, setDiscountCode] = useState<string>('')
  const initialDeliveryZone: 'inside_dhaka' | 'outside_dhaka' =
    user?.deliveryZone === 'outside_dhaka' ? 'outside_dhaka' : 'inside_dhaka'
  const [deliveryZone, setDeliveryZone] = useState<'inside_dhaka' | 'outside_dhaka'>(initialDeliveryZone)
  const [address_city, setAddressCity] = useState<string>(
    initialDeliveryZone === 'inside_dhaka' ? 'Dhaka' : user?.address?.city || '',
  )
  const [address_state, setAddressState] = useState<string>(user?.address?.state || '')
  const [address_postalCode, setAddressPostalCode] = useState<string>(user?.address?.postalCode || '')
  const [address_country, setAddressCountry] = useState<string>(user?.address?.country || '')
  const settings = deliverySettings || DEFAULT_DELIVERY_SETTINGS
  const subtotal = getTotalPrice()
  const freeDelivery = subtotal >= settings.freeDeliveryThreshold
  const isDigitalPayment = isDigitalPaymentMethod(paymentMethod)
  const shippingCharge = freeDelivery
    ? 0
    : isDigitalPayment
      ? settings.digitalPaymentDeliveryCharge
      : deliveryZone === 'outside_dhaka'
        ? settings.outsideDhakaCharge
        : settings.insideDhakaCharge
  const total = subtotal + shippingCharge
  const formatCurrency = (value: number) => `Tk ${value.toFixed(2)}`
  const router = useRouter()
  const requiresDigitalPaymentDetails = isDigitalPayment
  const digitalPaymentInstructions = DIGITAL_PAYMENT_INSTRUCTIONS[paymentMethod]
  const isInsideDhaka = deliveryZone === 'inside_dhaka'
  const formId = React.useId()
  const inputClasses =
    'block w-full rounded-xl border border-stone-200 bg-white/85 px-4 py-2.5 text-sm text-stone-700 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-amber-400/70 focus:ring-offset-0'
  const SectionCard = ({
    title,
    description,
    children,
    className,
  }: {
    title: string
    description?: string
    children: React.ReactNode
    className?: string
  }) => (
    <div className={cn('rounded-2xl border border-amber-100/70 bg-white/85 p-6 shadow-sm shadow-amber-200/40', className)}>
      <div>
        <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
        {description ? <p className="mt-1 text-sm text-stone-500">{description}</p> : null}
      </div>
      <div className="mt-5 space-y-5">{children}</div>
    </div>
  )
  const OrderSummaryCard = ({ className, layout }: { className?: string; layout: 'desktop' | 'mobile' }) => (
    <div
      className={cn(
        'rounded-[26px] border border-amber-100/80 bg-white/90 p-6 shadow-xl shadow-amber-200/60 backdrop-blur-sm',
        layout === 'desktop' ? 'lg:sticky lg:top-28' : '',
        className,
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-stone-900">Review your cart</h3>
          <p className="text-sm text-stone-500">Double-check the details before you place your order.</p>
        </div>
        <Badge className="ml-auto h-7 rounded-full bg-amber-100 px-3 text-xs font-medium text-amber-700">
          Secure checkout
        </Badge>
      </div>
      <div className="mt-5 space-y-4">
        {state.items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-4 rounded-2xl border border-amber-50 bg-white/85 p-4 shadow-sm shadow-amber-200/40"
          >
            {item.image ? (
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-amber-100 bg-amber-50">
                <Image
                  src={item.image.url}
                  alt={item.image.alt || item.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            ) : null}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="truncate text-sm font-semibold text-stone-900">{item.name}</h4>
                {item.category ? (
                  <Badge className="hidden rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-600 sm:inline-flex">
                    {item.category}
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs text-stone-500">{formatCurrency(item.price)} each</p>
            </div>
            <div className="flex flex-col items-end gap-3 text-right">
              <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-2 py-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                  disabled={item.quantity <= 1}
                  aria-label={`Decrease quantity of ${item.name}`}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-stone-500 transition hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[2ch] text-sm font-semibold text-stone-900">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  aria-label={`Increase quantity of ${item.name}`}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-stone-500 transition hover:bg-amber-50 hover:text-amber-600"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm font-semibold text-stone-900">{formatCurrency(item.price * item.quantity)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        <label htmlFor={`discount-${layout}`} className="text-sm font-semibold text-stone-700">
          Discount code
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id={`discount-${layout}`}
            type="text"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            placeholder="Enter promo code"
            className="flex-1 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400/70"
          />
          <Button
            type="button"
            variant="outline"
            className="rounded-xl border-amber-200 bg-amber-50 text-amber-700 shadow-sm transition hover:bg-amber-100"
          >
            Apply
          </Button>
        </div>
        <p className="text-xs text-stone-500">Promotions are applied before taxes and shipping charges.</p>
      </div>
      <Separator className="my-6" />
      <div className="space-y-3 text-sm text-stone-600">
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span className="font-medium text-stone-900">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>
            Shipping {deliveryZone === 'outside_dhaka' ? '(Outside Dhaka)' : '(Inside Dhaka)'}
          </span>
          <span className="font-medium text-stone-900">{freeDelivery ? 'Free' : formatCurrency(shippingCharge)}</span>
        </div>
        <div className="flex items-center justify-between text-base font-semibold text-stone-900">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <Button
          type="submit"
          form={formId}
          size="lg"
          className="w-full rounded-full bg-[linear-gradient(135deg,#F97316_0%,#F43F5E_100%)] text-white shadow-lg shadow-orange-500/25 transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2"
        >
          {isSubmitting ? 'Processing…' : 'Pay now'}
        </Button>
        <div className="flex items-start gap-2 text-xs text-stone-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-amber-500" />
          <span>Secure checkout • Your payment details are encrypted end-to-end.</span>
        </div>
      </div>
    </div>
  )

  React.useEffect(() => {
    if (deliveryZone === 'inside_dhaka') {
      setAddressCity('Dhaka')
    }
  }, [deliveryZone])

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
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
      <div className="space-y-8">
        <form
          id={formId}
          onSubmit={handleSubmit}
          className="space-y-8 rounded-[28px] border border-amber-100/70 bg-white/90 p-6 shadow-xl shadow-amber-200/40 backdrop-blur lg:p-10"
        >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-500">Step 02</p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-900 lg:text-3xl">Shipping information</h2>
            <p className="mt-2 max-w-xl text-sm text-stone-500">
              Provide your delivery details to complete this order.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-amber-50/80 p-1 text-sm font-medium text-stone-600">
            <button
              type="button"
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-amber-600 shadow-sm shadow-amber-100 ring-1 ring-amber-200"
            >
              <Truck className="h-4 w-4" />
              Delivery
            </button>
            <button
              type="button"
              disabled
              className="flex items-center gap-2 rounded-full px-4 py-2 text-stone-400 transition disabled:cursor-not-allowed"
            >
              <Store className="h-4 w-4" />
              Pick up
              <Badge className="rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-stone-500">
                Soon
              </Badge>
            </button>
          </div>
        </div>

        {!user ? (
          <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5 text-sm text-amber-800 shadow-sm shadow-amber-200/40">
            <p className="font-semibold">Guest checkout</p>
            <p className="mt-2">
              You can place an order without creating an account. Save your details for next time by{' '}
              <Link className="font-semibold underline" href="/register">
                creating an account
              </Link>{' '}
              or{' '}
              <Link className="font-semibold underline" href="/login">
                signing in
              </Link>
              .
            </p>
          </div>
        ) : null}

        <SectionCard
          title="Contact details"
          description="We’ll use this information to send updates about your order."
        >
          {!user ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium text-stone-600">
                    First name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className={inputClasses}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium text-stone-600">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className={inputClasses}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-stone-600">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClasses}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-stone-500">
              We’ll send order updates to{' '}
              <span className="font-medium text-stone-700">{user.email}</span>. Update the phone number below if you’d like us to
              reach someone else for delivery.
            </p>
          )}
          <div className="space-y-2">
            <label htmlFor="customerNumber" className="text-sm font-medium text-stone-600">
              Phone number
            </label>
            <input
              id="customerNumber"
              name="customerNumber"
              type="tel"
              required
              value={customerNumber}
              onChange={(e) => setCustomerNumber(e.target.value)}
              placeholder="e.g. +8801XXXXXXXXX"
              className={inputClasses}
            />
            <p className="text-xs text-stone-500">We’ll use this number to coordinate your delivery.</p>
          </div>
          {user ? (
            <p className="text-xs text-stone-400">
              Order will be placed for {user.firstName} {user.lastName}.
            </p>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Shipping address"
          description="Enter the address where you’d like your order delivered."
        >
          <div className="space-y-2">
            <label htmlFor="address_line1" className="text-sm font-medium text-stone-600">
              Address line 1
            </label>
            <input
              id="address_line1"
              value={address_line1}
              onChange={(e) => setAddressLine1(e.target.value)}
              required={!user}
              placeholder="House, street, area"
              className={inputClasses}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="address_line2" className="text-sm font-medium text-stone-600">
              Address line 2 <span className="text-stone-400">(optional)</span>
            </label>
            <input
              id="address_line2"
              value={address_line2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="Apartment, floor, landmark"
              className={inputClasses}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="address_city" className="text-sm font-medium text-stone-600">
                City
              </label>
              <input
                id="address_city"
                value={address_city}
                onChange={(e) => setAddressCity(e.target.value)}
                required={!user}
                readOnly={isInsideDhaka}
                aria-readonly={isInsideDhaka}
                className={cn(
                  inputClasses,
                  isInsideDhaka ? 'cursor-not-allowed bg-stone-100 text-stone-600' : '',
                )}
              />
              {isInsideDhaka ? (
                <p className="text-xs text-stone-500">City is fixed to Dhaka for inside Dhaka delivery.</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label htmlFor="address_state" className="text-sm font-medium text-stone-600">
                State / region
              </label>
              <input
                id="address_state"
                value={address_state}
                onChange={(e) => setAddressState(e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="address_postalCode" className="text-sm font-medium text-stone-600">
                Postal code
              </label>
              <input
                id="address_postalCode"
                value={address_postalCode}
                onChange={(e) => setAddressPostalCode(e.target.value)}
                required={!user}
                className={inputClasses}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="address_country" className="text-sm font-medium text-stone-600">
                Country
              </label>
              <input
                id="address_country"
                value={address_country}
                onChange={(e) => setAddressCountry(e.target.value)}
                required={!user}
                className={inputClasses}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Delivery preferences"
          description="Select the delivery zone so we can calculate the correct shipping fee."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label
              className={cn(
                'flex cursor-pointer flex-col gap-2 rounded-2xl border border-stone-200 bg-white/85 p-4 shadow-sm transition hover:border-amber-200 hover:shadow-amber-100 focus-within:ring-2 focus-within:ring-amber-400/70 focus-within:ring-offset-0',
                deliveryZone === 'inside_dhaka' ? 'border-amber-400 shadow-amber-100 ring-2 ring-amber-200/80' : '',
              )}
            >
              <input
                type="radio"
                name="deliveryZone"
                value="inside_dhaka"
                checked={deliveryZone === 'inside_dhaka'}
                onChange={() => {
                  setDeliveryZone('inside_dhaka')
                  setAddressCity('Dhaka')
                }}
                className="sr-only"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-stone-900">Inside Dhaka</span>
                {deliveryZone === 'inside_dhaka' ? (
                  <Badge className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">Selected</Badge>
                ) : null}
              </div>
              <p className="text-xs text-stone-500">
                Delivery charge {formatCurrency(settings.insideDhakaCharge)}
              </p>
            </label>
            <label
              className={cn(
                'flex cursor-pointer flex-col gap-2 rounded-2xl border border-stone-200 bg-white/85 p-4 shadow-sm transition hover:border-amber-200 hover:shadow-amber-100 focus-within:ring-2 focus-within:ring-amber-400/70 focus-within:ring-offset-0',
                deliveryZone === 'outside_dhaka' ? 'border-amber-400 shadow-amber-100 ring-2 ring-amber-200/80' : '',
              )}
            >
              <input
                type="radio"
                name="deliveryZone"
                value="outside_dhaka"
                checked={deliveryZone === 'outside_dhaka'}
                onChange={() => {
                  setDeliveryZone('outside_dhaka')
                  if (address_city === 'Dhaka') {
                    setAddressCity('')
                  }
                }}
                className="sr-only"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-stone-900">Outside Dhaka</span>
                {deliveryZone === 'outside_dhaka' ? (
                  <Badge className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">Selected</Badge>
                ) : null}
              </div>
              <p className="text-xs text-stone-500">
                Delivery charge {formatCurrency(settings.outsideDhakaCharge)}
              </p>
            </label>
          </div>
          <div className="grid gap-3">
            {freeDelivery ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm">
                <Truck className="h-4 w-4" />
                Free delivery is applied to this order.
              </div>
            ) : (
              <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-xs font-medium text-amber-700 shadow-sm">
                Spend {formatCurrency(settings.freeDeliveryThreshold)} to unlock complimentary delivery.
              </div>
            )}
          </div>
        </SectionCard>

        {error ? (
          <Alert variant="destructive" className="rounded-2xl border border-red-200 bg-red-50/70 text-red-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

          <OrderSummaryCard className="lg:hidden" layout="mobile" />
        </form>
        <SectionCard
          title="Payment method"
          description="Choose how you would like to pay for this order."
          className="rounded-[26px] border-amber-100/80 bg-white/90 shadow-xl shadow-amber-200/60 backdrop-blur-sm"
        >
          <div className="rounded-2xl border border-amber-200/70 bg-amber-50/80 p-4 text-sm font-medium text-amber-900 shadow-sm shadow-amber-100">
            Digital wallet payments have a flat delivery charge of{' '}
            <span className="font-semibold">{formatCurrency(settings.digitalPaymentDeliveryCharge)}</span> when the subtotal is
            below <span className="font-semibold">{formatCurrency(settings.freeDeliveryThreshold)}</span>.
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {PAYMENT_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'group flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-stone-200 bg-white/85 p-4 text-center shadow-sm transition hover:border-amber-200 hover:shadow-amber-100 focus-within:ring-2 focus-within:ring-amber-400/70 focus-within:ring-offset-0',
                  paymentMethod === option.value ? 'border-amber-400 shadow-amber-100 ring-2 ring-amber-200/80' : '',
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
                  form={formId}
                />
                <div className="relative h-16 w-32">
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
                <span className="text-sm font-medium text-stone-700">{option.label}</span>
              </label>
            ))}
          </div>
          {requiresDigitalPaymentDetails ? (
            <div className="space-y-5 rounded-2xl border border-amber-100 bg-amber-50/70 p-5 text-amber-900 shadow-sm shadow-amber-100">
              {digitalPaymentInstructions?.length ? (
                <Alert className="border-transparent bg-transparent p-0 text-amber-900">
                  <AlertDescription>
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {digitalPaymentInstructions.map((instruction, index) => (
                        <li key={index}>{instruction}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="paymentSenderNumber" className="text-sm font-medium text-stone-600">
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
                    className={inputClasses}
                    form={formId}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="paymentTransactionId" className="text-sm font-medium text-stone-600">
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
                    className={inputClasses}
                    form={formId}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-stone-500">Pay with cash when your delivery arrives.</p>
          )}
        </SectionCard>
      </div>
      <div className="space-y-6">
        <OrderSummaryCard className="hidden lg:block" layout="desktop" />
      </div>
    </div>
  )
}