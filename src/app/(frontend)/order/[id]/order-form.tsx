'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Minus, Plus, ShieldCheck, Truck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { DeliverySettings } from '@/lib/delivery-settings'
import { DEFAULT_DELIVERY_SETTINGS } from '@/lib/delivery-settings'
import { cn } from '@/lib/utils'
import {
  PAYMENT_OPTIONS,
  type PaymentMethod,
  isDigitalPaymentMethod,
  DIGITAL_PAYMENT_INSTRUCTIONS,
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

  const labelClasses = 'text-sm font-medium text-stone-700'
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
    <div className={cn('rounded-3xl border border-amber-100/70 bg-white/85 p-6 shadow-sm shadow-amber-200/40', className)}>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
        {description ? <p className="text-sm text-stone-500">{description}</p> : null}
      </div>
      <div className="mt-5 space-y-5">{children}</div>
    </div>
  )

  const ProductOverviewCard = () => (
    <div className="rounded-[26px] border border-amber-100/80 bg-white/90 p-6 shadow-xl shadow-amber-200/50">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-500">Product overview</p>
          <h2 className="text-2xl font-semibold text-stone-900">{item.name}</h2>
          <p className="text-sm text-stone-500">Review the product details before confirming your order.</p>
        </div>
        {typeof (item as any).category === 'object' || (item as any).category ? (
          <Badge className="ml-auto h-7 rounded-full bg-amber-100 px-3 text-xs font-medium text-amber-700">
            {typeof (item as any).category === 'object'
              ? ((item as any).category as any)?.name
              : (item as any).category}
          </Badge>
        ) : null}
      </div>
      {item.image && typeof item.image === 'object' && item.image.url ? (
        <div className="relative mt-6 h-56 overflow-hidden rounded-3xl border border-amber-100 bg-amber-50">
          <Image
            src={item.image.url}
            alt={item.image.alt || item.name}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 384px, 100vw"
          />
        </div>
      ) : null}
      <div className="mt-6 space-y-3 text-sm text-stone-600">
        {item.shortDescription || item.description ? (
          <p className="text-base text-stone-600">
            {(item.shortDescription as string) || (item.description as string)}
          </p>
        ) : null}
        <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-50 to-rose-50 px-4 py-3 text-sm text-amber-700">
          <span className="font-medium">Unit price</span>
          <span className="text-base font-semibold text-rose-600">৳{Number(item.price).toFixed(2)}</span>
        </div>
      </div>
    </div>
  )

  const SummaryPanel = ({ layout }: { layout: 'mobile' | 'desktop' }) => {
    const isDesktop = layout === 'desktop'
    const senderNumberId = `order-paymentSenderNumber-${layout}`
    const transactionId = `order-paymentTransactionId-${layout}`

    return (
      <div
        className={cn(
          'rounded-[26px] border border-amber-100/80 bg-white/90 p-6 shadow-xl shadow-amber-200/50',
          isDesktop ? 'hidden lg:block' : 'lg:hidden',
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-stone-900">Review your order</h3>
            <p className="text-sm text-stone-500">Confirm the quantity, payment method, and totals before placing your order.</p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <Badge className="h-7 rounded-full bg-amber-100 px-3 text-xs font-medium text-amber-700">Secure checkout</Badge>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 rounded-3xl border border-amber-50 bg-white/75 p-4 shadow-inner shadow-amber-200/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-sm text-stone-600">
            <p className="text-sm font-semibold text-stone-900">Quantity</p>
            <p>Adjust how many units you would like to order.</p>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-stone-200 bg-white/85 px-2 py-1 shadow-sm">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="flex h-9 w-9 items-center justify-center rounded-full text-stone-500 transition hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[2ch] text-base font-semibold text-stone-900">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              aria-label="Increase quantity"
              className="flex h-9 w-9 items-center justify-center rounded-full text-stone-500 transition hover:bg-amber-50 hover:text-amber-600"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-3 rounded-3xl border border-amber-50 bg-white/75 p-5 shadow-inner shadow-amber-200/40">
          <div className="flex items-center justify-between text-sm text-stone-600">
            <span>Subtotal</span>
            <span className="font-medium text-stone-900">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-stone-600">
            <span>Delivery {deliveryZone === 'outside_dhaka' ? '(Outside Dhaka)' : '(Inside Dhaka)'}</span>
            <span className="font-medium text-stone-900">{freeDelivery ? 'Free' : formatCurrency(shippingCharge)}</span>
          </div>
          <div className="flex items-center justify-between text-base font-semibold text-stone-900">
            <span>Total due</span>
            <span>{formatCurrency(total)}</span>
          </div>
          {freeDelivery ? (
            <p className="text-xs font-semibold text-emerald-600">Congratulations! Free delivery is applied to this order.</p>
          ) : (
            <p className="text-xs text-stone-500">
              Spend {formatCurrency(settings.freeDeliveryThreshold)} to unlock complimentary delivery.
            </p>
          )}
        </div>

        <Separator className="my-6" />

        <div className="space-y-5">
          <div>
            <h4 className="text-base font-semibold text-stone-900">Payment method</h4>
            <p className="text-xs text-stone-500">Select a payment option to complete your order.</p>
          </div>
          <div className="rounded-2xl border border-amber-200/70 bg-amber-50/80 p-4 text-xs font-medium text-amber-900 shadow-sm shadow-amber-100">
            Digital wallet payments have a flat delivery charge of {formatCurrency(settings.digitalPaymentDeliveryCharge)} when the subtotal is below {formatCurrency(settings.freeDeliveryThreshold)}.
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
                    setError('')
                  }}
                  className="sr-only"
                  form="order-form"
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
                        <li key={`${layout}-digital-instruction-${index}`}>{instruction}</li>
                      ))}
                      <li>
                        Delivery charge is {formatCurrency(settings.digitalPaymentDeliveryCharge)} for digital wallet payments when the subtotal is below {formatCurrency(settings.freeDeliveryThreshold)}.
                      </li>
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor={senderNumberId} className="text-sm font-medium text-stone-600">
                    Sender wallet number
                  </label>
                  <input
                    id={senderNumberId}
                    name="paymentSenderNumber"
                    type="tel"
                    value={paymentSenderNumber}
                    onChange={(e) => {
                      setPaymentSenderNumber(e.target.value)
                      setError('')
                    }}
                    required={requiresDigitalPaymentDetails}
                    placeholder="e.g. 01XXXXXXXXX"
                    className={inputClasses}
                    form="order-form"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor={transactionId} className="text-sm font-medium text-stone-600">
                    Transaction ID
                  </label>
                  <input
                    id={transactionId}
                    name="paymentTransactionId"
                    value={paymentTransactionId}
                    onChange={(e) => {
                      setPaymentTransactionId(e.target.value)
                      setError('')
                    }}
                    required={requiresDigitalPaymentDetails}
                    placeholder="e.g. TXN123456789"
                    className={inputClasses}
                    form="order-form"
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-stone-500">You can pay in cash when the delivery arrives.</p>
          )}
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-3xl border border-amber-100 bg-white/90 px-4 py-3 text-sm text-stone-600">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-amber-500" aria-hidden />
          <p>Your information is protected with secure checkout. We’ll only use it to complete your order and coordinate the delivery.</p>
        </div>

        <Button
          type="submit"
          form="order-form"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-full bg-[linear-gradient(135deg,#F97316_0%,#F43F5E_100%)] px-6 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-80"
        >
          {isSubmitting ? 'Placing Order…' : 'Confirm order'}
        </Button>
      </div>
    )
  }

  const NeedHelpCard = () => (
    <div className="rounded-3xl border border-amber-100/70 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-6 text-sm text-stone-700 shadow-lg shadow-amber-200/50">
      <h3 className="text-base font-semibold text-stone-900">Need help?</h3>
      <p className="mt-2 leading-relaxed">
        Give us a call or send us a message if you have any questions about this product or your order. Our friendly team is ready
        to talk over the phone or chat on your favourite messaging app.
      </p>
      <div className="mt-4 flex flex-col gap-2 text-sm font-semibold text-amber-700">
        <a
          href="tel:01639590392"
          className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-amber-700 shadow-sm transition hover:bg-amber-100"
        >
          <span aria-hidden>📞</span>
          Call us: 01639-590392
        </a>
        <a
          href="https://www.m.me/onlinebazarbarguna"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full bg-[#0084FF] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0073E6]"
        >
          <span aria-hidden>💬</span>
          Message us on Messenger
        </a>
      </div>
    </div>
  )

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
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
      <div className="space-y-8">
        <form
          id="order-form"
          onSubmit={handleSubmit}
          className="space-y-8 rounded-[28px] border border-amber-100/70 bg-white/90 p-6 shadow-xl shadow-amber-200/40 backdrop-blur lg:p-10"
        >
          {!user ? (
            <div className="rounded-3xl border border-amber-100 bg-amber-50/70 p-5 text-sm text-amber-800 shadow-sm shadow-amber-200/40">
              <p className="font-semibold">Guest checkout</p>
              <p className="mt-1 leading-relaxed">
                You can order this item without creating an account. Provide your contact and delivery details below or{' '}
                <a href="/login" className="font-semibold underline">
                  sign in
                </a>{' '}
                to autofill your saved information.
              </p>
            </div>
          ) : null}

          <SectionCard title="Contact information" description="We’ll use this to share order updates and delivery details.">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="customerNumber" className={labelClasses}>
                  Customer number
                </label>
                <input
                  id="customerNumber"
                  name="customerNumber"
                  value={customerNumber}
                  onChange={(e) => setCustomerNumber(e.target.value)}
                  placeholder="e.g. 01XXXXXXXXX"
                  required
                  className={inputClasses}
                />
              </div>

              {!user ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className={labelClasses}>
                      First name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className={inputClasses}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lastName" className={labelClasses}>
                      Last name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className={inputClasses}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="email" className={labelClasses}>
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={inputClasses}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard
            title="Delivery address"
            description="Tell us where to deliver your order so we can estimate shipping charges."
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="address_line1" className={labelClasses}>
                  Address line 1
                </label>
                <input
                  id="address_line1"
                  name="address_line1"
                  value={address_line1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  required={!user}
                  className={inputClasses}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="address_line2" className={labelClasses}>
                  Address line 2 (optional)
                </label>
                <input
                  id="address_line2"
                  name="address_line2"
                  value={address_line2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="address_city" className={labelClasses}>
                    City
                  </label>
                  <input
                    id="address_city"
                    name="address_city"
                    value={address_city}
                    onChange={(e) => setAddressCity(e.target.value)}
                    required={!user}
                    className={inputClasses}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="address_state" className={labelClasses}>
                    State / Region
                  </label>
                  <input
                    id="address_state"
                    name="address_state"
                    value={address_state}
                    onChange={(e) => setAddressState(e.target.value)}
                    className={inputClasses}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="address_postalCode" className={labelClasses}>
                    Postal code
                  </label>
                  <input
                    id="address_postalCode"
                    name="address_postalCode"
                    value={address_postalCode}
                    onChange={(e) => setAddressPostalCode(e.target.value)}
                    required={!user}
                    className={inputClasses}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="address_country" className={labelClasses}>
                    Country
                  </label>
                  <input
                    id="address_country"
                    name="address_country"
                    value={address_country}
                    onChange={(e) => setAddressCountry(e.target.value)}
                    required={!user}
                    className={inputClasses}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-stone-700">Delivery area</p>
              <p className="text-sm text-stone-500">
                Choose whether this address is inside or outside Dhaka to calculate delivery charges accurately.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-2xl border bg-white/85 px-4 py-3 shadow-sm transition focus-within:ring-2 focus-within:ring-amber-400/70 focus-within:ring-offset-2',
                    deliveryZone === 'inside_dhaka' ? 'border-amber-400 ring-2 ring-amber-200/70' : 'border-stone-200',
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
                  <span className="mt-1 flex size-9 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                    <Truck className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="space-y-1">
                    <span className="block text-sm font-semibold text-stone-900">Inside Dhaka</span>
                    <span className="block text-xs text-stone-500">
                      Delivery charge {formatCurrency(settings.insideDhakaCharge)}
                    </span>
                  </span>
                </label>
                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-2xl border bg-white/85 px-4 py-3 shadow-sm transition focus-within:ring-2 focus-within:ring-amber-400/70 focus-within:ring-offset-2',
                    deliveryZone === 'outside_dhaka' ? 'border-amber-400 ring-2 ring-amber-200/70' : 'border-stone-200',
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
                  <span className="mt-1 flex size-9 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                    <Truck className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="space-y-1">
                    <span className="block text-sm font-semibold text-stone-900">Outside Dhaka</span>
                    <span className="block text-xs text-stone-500">
                      Delivery charge {formatCurrency(settings.outsideDhakaCharge)}
                    </span>
                  </span>
                </label>
              </div>
              {freeDelivery ? (
                <p className="text-xs font-semibold text-emerald-600">Free delivery applied for this order.</p>
              ) : (
                <p className="text-xs text-stone-500">
                  Free delivery applies automatically when your subtotal reaches {formatCurrency(settings.freeDeliveryThreshold)}.
                </p>
              )}
            </div>
          </SectionCard>

          <SummaryPanel layout="mobile" />

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </form>
      </div>

      <div className="space-y-6 self-start lg:sticky lg:top-32">
        <ProductOverviewCard />
        <SummaryPanel layout="desktop" />
        <NeedHelpCard />
      </div>
    </div>
  )
}