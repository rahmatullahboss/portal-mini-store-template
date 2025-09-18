import { NextRequest, NextResponse } from 'next/server'
import { getPayload, type Payload } from 'payload'

import config, { getServerSideURL } from '@/payload.config'

type PayloadFindArgs = Parameters<Payload['find']>
type PayloadWhere = PayloadFindArgs[0] extends { where?: infer W } ? NonNullable<W> : never

type AbandonedCartDoc = {
  id?: string | number
  customerEmail?: string | null
  cartTotal?: number | null
  subtotal?: number | null
  status?: string | null
  items?: Array<{
    item?:
      | {
          id?: string | number
          name?: string | null
          price?: number | null
          category?:
            | string
            | {
                name?: string | null
              }
          image?: {
            url?: string | null
          }
        }
      | string
      | number
      | null
    quantity?: number | null
    name?: string | null
    price?: number | null
  }> | null
  lastActivityAt?: string | Date | null
  abandonedAt?: string | Date | null
  firstReminderSentAt?: string | Date | null
  secondReminderSentAt?: string | Date | null
  finalReminderSentAt?: string | Date | null
}

type NormalisedItem = {
  id: string
  name: string
  quantity: number
  price?: number
  category?: string
  imageUrl?: string
}

const DEFAULT_TTL_MINUTES = Number(process.env.ABANDONED_CART_TTL_MINUTES || 60)
const MIN_TTL_MINUTES = 5
const FIRST_REMINDER_DELAY_MINUTES = Number(process.env.ABANDONED_CART_FIRST_DELAY_MINUTES || 0)
const SECOND_REMINDER_DELAY_HOURS = Number(process.env.ABANDONED_CART_SECOND_DELAY_HOURS || 24)
const FINAL_REMINDER_DELAY_HOURS = Number(process.env.ABANDONED_CART_FINAL_DELAY_HOURS || 72)
const FINAL_DISCOUNT_PERCENT = Number(process.env.ABANDONED_CART_DISCOUNT_PERCENT || 5)
const FINAL_DISCOUNT_CODE = process.env.ABANDONED_CART_DISCOUNT_CODE || 'SAVE5'
const FINAL_DISCOUNT_DURATION_HOURS = Number(process.env.ABANDONED_CART_DISCOUNT_DURATION_HOURS || 24)
const MAX_BATCH = 100

const resolveStorefrontURL = () => {
  const candidates = [
    process.env.ABANDONED_CART_CTA_URL,
    process.env.NEXT_PUBLIC_SERVER_URL,
    process.env.SERVER_URL,
    (() => {
      try {
        const url = getServerSideURL()
        if (typeof url === 'string' && url && url !== 'undefined') {
          return url
        }
      } catch {}
      return undefined
    })(),
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ].filter((value): value is string => typeof value === 'string' && value.length > 0)

  return candidates[0] || 'http://localhost:3000'
}

const STOREFRONT_URL = resolveStorefrontURL()

const formatCurrency = (amount?: number | null) => {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return 'Tk 0.00'
  return `Tk ${amount.toFixed(2)}`
}

const toDate = (value: unknown): Date | null => {
  if (typeof value === 'string') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  if (value instanceof Date) return value
  return null
}

const hasCartValue = (cart: AbandonedCartDoc) => {
  if (!cart) return false
  const total = typeof cart.cartTotal === 'number' ? cart.cartTotal : undefined
  const subtotal = typeof cart.subtotal === 'number' ? cart.subtotal : undefined
  if (typeof total === 'number' && total > 0) return true
  if (typeof subtotal === 'number' && subtotal > 0) return true
  if (Array.isArray(cart.items)) {
    const hasQty = cart.items.some((line) => Number(line?.quantity) > 0)
    if (hasQty) return true
  }
  return false
}

const normaliseItems = (cart: AbandonedCartDoc): NormalisedItem[] => {
  if (!Array.isArray(cart.items) || cart.items.length === 0) return []

  return cart.items
    .map<NormalisedItem | null>((line) => {
      const product = line?.item && typeof line.item === 'object' ? line.item : null
      const rawId = product?.id ?? line?.item
      if (!rawId) return null

      const quantity = Number(line?.quantity)
      const safeQty = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1
      const priceRaw = Number(product?.price ?? line?.price)
      const price = Number.isFinite(priceRaw) && priceRaw >= 0 ? priceRaw : undefined

      const imageValue = product && typeof product === 'object' ? product.image : undefined
      const imageUrl =
        imageValue && typeof imageValue === 'object' && typeof imageValue?.url === 'string'
          ? imageValue.url
          : undefined

      let category: string | undefined
      if (product) {
        if (typeof product.category === 'string') {
          category = product.category
        } else if (product.category && typeof product.category === 'object') {
          const nested = product.category as { name?: string | null }
          category = typeof nested?.name === 'string' ? nested.name : undefined
        }
      }

      return {
        id: String(rawId),
        name:
          (product && typeof product?.name === 'string' && product.name) ||
          (typeof line?.name === 'string' && line.name) ||
          'পণ্য',
        quantity: safeQty,
        price,
        category,
        imageUrl,
      }
    })
    .filter((value): value is NormalisedItem => value !== null)
}

const resolveCartId = (cart: AbandonedCartDoc) => {
  if (typeof cart.id === 'string' || typeof cart.id === 'number') {
    return cart.id
  }
  return undefined
}

const renderItemsHTML = (items: ReturnType<typeof normaliseItems>) => {
  if (!items.length) return ''
  const rows = items
    .map((item) => {
      const price = typeof item.price === 'number' ? `Tk ${(item.price * item.quantity).toFixed(2)}` : ''
      return `
        <tr>
          <td style="padding:8px 0; font-weight:600;">${item.name}</td>
          <td style="padding:8px 0; text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0; text-align:right;">${price}</td>
        </tr>
      `
    })
    .join('')
  return `
    <table role="presentation" width="100%" style="margin-top:16px; border-collapse:collapse;">
      <thead>
        <tr style="text-align:left; border-bottom:1px solid #e5e7eb;">
          <th style="padding-bottom:8px;">পণ্য</th>
          <th style="padding-bottom:8px; text-align:center;">পরিমাণ</th>
          <th style="padding-bottom:8px; text-align:right;">মোট</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

const buildCTAButton = (label: string) => `
  <a
    href="${STOREFRONT_URL}/checkout"
    style="display:inline-block; padding:12px 24px; background-color:#2563eb; color:#ffffff; border-radius:6px; text-decoration:none; font-weight:600;"
  >
    ${label}
  </a>
`

const sendEmail = async (
  payload: Payload,
  cart: AbandonedCartDoc,
  stage: 'first' | 'second' | 'final',
) => {
  const email = cart.customerEmail
  if (typeof email !== 'string' || !email) return false
  const items = normaliseItems(cart)
  const total = typeof cart.cartTotal === 'number' ? cart.cartTotal : undefined
  const subtotal = typeof cart.subtotal === 'number' ? cart.subtotal : undefined

  let subject = 'আপনার কার্টে থাকা পণ্যগুলো অপেক্ষা করছে'
  let intro = 'আপনি আপনার কার্টে কিছু পণ্য রেখে গেছেন। অর্ডার সম্পন্ন করতে মাত্র এক ধাপ বাকি!'
  let extra = ''
  if (stage === 'second') {
    subject = 'আপনার পছন্দের পণ্যগুলো সীমিত স্টকে আছে'
    intro = 'আপনার নির্বাচিত পণ্যগুলো এখনও কার্টে আছে, তবে স্টক দ্রুত শেষ হয়ে যেতে পারে। এখনই অর্ডার নিশ্চিত করুন।'
    extra = '<p style="margin:16px 0 0;">কোনো সমস্যায় পড়লে আমাদের সাপোর্ট টিমকে জানান, আমরা সাহায্য করতে প্রস্তুত।</p>'
  }
  if (stage === 'final') {
    subject = '৫% বিশেষ ছাড়ে এখনই অর্ডার সম্পন্ন করুন'
    intro = `শেষ সুযোগ! সীমিত সময়ের জন্য ${FINAL_DISCOUNT_PERCENT}% বিশেষ ছাড় পাচ্ছেন। নিচের কুপনটি ব্যবহার করুন এবং আজই অর্ডার করুন।`
    const expiresAt = new Date(Date.now() + FINAL_DISCOUNT_DURATION_HOURS * 60 * 60 * 1000)
    extra = `
      <p style="margin:16px 0 0; font-weight:600;">কুপন কোড: <span style="background:#fef3c7; padding:4px 8px; border-radius:4px;">${FINAL_DISCOUNT_CODE}</span></p>
      <p style="margin:8px 0 0; color:#dc2626;">এই অফারটি ${expiresAt.toLocaleString('bn-BD')} পর্যন্ত প্রযোজ্য।</p>
    `
  }

  const totalText = total ?? subtotal
  const totalFragment =
    typeof totalText === 'number'
      ? `<p style="margin:16px 0 0; font-weight:600;">আনুমানিক মোট: ${formatCurrency(totalText)}</p>`
      : ''
  const html = `
    <div style="font-family:Helvetica,Arial,sans-serif; background:#f9fafb; padding:24px;">
      <div style="max-width:520px; margin:0 auto; background:#ffffff; padding:24px; border-radius:12px;">
        <h2 style="margin:0 0 12px; color:#111827;">${subject}</h2>
        <p style="margin:0 0 16px; color:#374151;">${intro}</p>
        ${totalFragment}
        ${renderItemsHTML(items)}
        <div style="margin:24px 0;">${buildCTAButton('অর্ডার সম্পন্ন করুন')}</div>
        ${extra}
        <p style="margin:24px 0 0; font-size:14px; color:#6b7280;">যদি আপনি ইতোমধ্যে অর্ডার সম্পন্ন করে থাকেন, অনুগ্রহ করে এই ইমেইলটি উপেক্ষা করুন।</p>
      </div>
    </div>
  `

  const textLines: string[] = [subject, '', intro]
  if (items.length) {
    textLines.push('')
    textLines.push(...items.map((item) => `${item.name} x ${item.quantity}`))
  }
  if (typeof totalText === 'number') {
    textLines.push('', `মোট: ${formatCurrency(totalText)}`)
  }
  if (stage === 'final') {
    textLines.push('', `কুপন কোড: ${FINAL_DISCOUNT_CODE}`)
  }
  textLines.push('', `আপনার অর্ডার সম্পন্ন করতে ভিজিট করুন: ${STOREFRONT_URL}/checkout`)

  await payload.sendEmail?.({
    to: email,
    subject,
    html,
    text: textLines.join('\n'),
  })

  return true
}

const runWorkflow = async (payload: Payload, ttlMinutes: number) => {
  const ttl = Math.max(MIN_TTL_MINUTES, ttlMinutes || DEFAULT_TTL_MINUTES)
  const now = new Date()
  const inactivityCutoff = new Date(now.getTime() - ttl * 60 * 1000).toISOString()

  const candidates = await payload.find({
    collection: 'abandoned-carts',
    limit: MAX_BATCH,
    depth: 2,
    where: {
      and: [
        { status: { equals: 'active' } },
        { customerEmail: { exists: true } },
        { lastActivityAt: { less_than: inactivityCutoff } },
      ],
    },
  })

  let marked = 0
  for (const doc of (candidates.docs || []) as AbandonedCartDoc[]) {
    if (!hasCartValue(doc)) continue
    const id = resolveCartId(doc)
    if (!id) continue
    const abandonedAtDate = toDate(doc.lastActivityAt) || new Date()
    const abandonedAt = abandonedAtDate.toISOString()
    try {
      await payload.update({
        collection: 'abandoned-carts',
        id,
        data: {
          status: 'abandoned',
          abandonedAt,
          firstReminderSentAt: null,
          secondReminderSentAt: null,
          finalReminderSentAt: null,
          finalDiscountExpiresAt: null,
          finalDiscountCode: null,
        },
      })
      marked++
    } catch (error) {
      console.error('Failed to mark abandoned cart', id, error)
    }
  }

  const sendStage = async (
    stage: 'first' | 'second' | 'final',
    predicate: (cart: AbandonedCartDoc) => boolean,
    fields: Partial<AbandonedCartDoc> & Record<string, unknown>,
  ) => {
    const stageFilters: PayloadWhere[] = (() => {
      const filters: PayloadWhere[] = []
      if (stage === 'first') {
        filters.push({ firstReminderSentAt: { equals: null } })
      } else if (stage === 'second') {
        filters.push({ firstReminderSentAt: { exists: true } })
        filters.push({ secondReminderSentAt: { equals: null } })
      } else {
        filters.push({ secondReminderSentAt: { exists: true } })
        filters.push({ finalReminderSentAt: { equals: null } })
      }
      return filters
    })()

    const res = await payload.find({
      collection: 'abandoned-carts',
      limit: MAX_BATCH,
      depth: 2,
      where: {
        and: [{ status: { equals: 'abandoned' } }, { customerEmail: { exists: true } }, ...stageFilters],
      },
    })

    let sent = 0
    for (const cart of (res.docs || []) as AbandonedCartDoc[]) {
      if (!hasCartValue(cart)) continue
      if (stage === 'first' && cart.firstReminderSentAt) continue
      if (stage === 'second' && (!cart.firstReminderSentAt || cart.secondReminderSentAt)) continue
      if (stage === 'final' && (!cart.secondReminderSentAt || cart.finalReminderSentAt)) continue
      if (!predicate(cart)) continue
      const ok = await sendEmail(payload, cart, stage).catch((error: unknown) => {
        console.error(`Failed to send ${stage} reminder for cart`, resolveCartId(cart), error)
        return false
      })
      if (!ok) continue
      const id = resolveCartId(cart)
      if (!id) continue
      try {
        await payload.update({
          collection: 'abandoned-carts',
          id,
          data: fields,
        })
        sent++
      } catch (error) {
        console.error('Failed to update reminder timestamps', id, error)
      }
    }
    return sent
  }

  const firstDelayMs = FIRST_REMINDER_DELAY_MINUTES * 60 * 1000
  const secondDelayMs = SECOND_REMINDER_DELAY_HOURS * 60 * 60 * 1000
  const finalDelayMs = FINAL_REMINDER_DELAY_HOURS * 60 * 60 * 1000

  const firstSent = await sendStage(
    'first',
    (cart) => {
      const abandonedAt = toDate(cart.abandonedAt) || toDate(cart.lastActivityAt)
      if (!abandonedAt) return false
      return now.getTime() - abandonedAt.getTime() >= firstDelayMs
    },
    { firstReminderSentAt: now.toISOString(), recoveryEmailSentAt: now.toISOString() },
  )

  const secondSent = await sendStage(
    'second',
    (cart) => {
      const abandonedAt = toDate(cart.abandonedAt) || toDate(cart.lastActivityAt)
      if (!abandonedAt) return false
      return now.getTime() - abandonedAt.getTime() >= secondDelayMs
    },
    { secondReminderSentAt: now.toISOString(), recoveryEmailSentAt: now.toISOString() },
  )

  const finalSent = await sendStage(
    'final',
    (cart) => {
      const abandonedAt = toDate(cart.abandonedAt) || toDate(cart.lastActivityAt)
      if (!abandonedAt) return false
      return now.getTime() - abandonedAt.getTime() >= finalDelayMs
    },
    {
      finalReminderSentAt: now.toISOString(),
      recoveryEmailSentAt: now.toISOString(),
      finalDiscountCode: FINAL_DISCOUNT_CODE,
      finalDiscountExpiresAt: new Date(
        now.getTime() + FINAL_DISCOUNT_DURATION_HOURS * 60 * 60 * 1000,
      ).toISOString(),
    },
  )

  return {
    marked,
    firstSent,
    secondSent,
    finalSent,
    cutoff: inactivityCutoff,
  }
}

const buildUnauthorizedResponse = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: await config })
    const { user } = await payload.auth({ headers: request.headers })
    if (!user || (user as any).role !== 'admin') {
      return buildUnauthorizedResponse()
    }

    const url = new URL(request.url)
    const ttlMinutes = Number(url.searchParams.get('ttlMinutes') || DEFAULT_TTL_MINUTES)
    const summary = await runWorkflow(payload, ttlMinutes)
    return NextResponse.json({ success: true, ...summary, via: 'admin' })
  } catch (e) {
    console.error('Mark abandoned error:', e)
    return NextResponse.json({ error: 'Failed to process abandoned carts' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: await config })
    const isVercelCron = !!request.headers.get('x-vercel-cron')
    const url = new URL(request.url)
    const providedSecret = url.searchParams.get('secret') || request.headers.get('x-cron-secret')
    const secretOK = !!process.env.CRON_SECRET && providedSecret === process.env.CRON_SECRET
    if (!isVercelCron && !secretOK) {
      return buildUnauthorizedResponse()
    }

    const ttlMinutes = Number(url.searchParams.get('ttlMinutes') || DEFAULT_TTL_MINUTES)
    const summary = await runWorkflow(payload, ttlMinutes)
    return NextResponse.json({ success: true, ...summary, via: isVercelCron ? 'vercel-cron' : 'secret' })
  } catch (e) {
    console.error('Mark abandoned (GET) error:', e)
    return NextResponse.json({ error: 'Failed to process abandoned carts' }, { status: 500 })
  }
}
