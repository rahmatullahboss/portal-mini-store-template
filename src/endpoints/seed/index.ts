// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available

import { Payload, PayloadRequest } from 'payload'
import { snackSeedData } from './snacks'

// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding database...')

  try {
    // Create categories (unique by name)
    const categoryNames = Array.from(new Set(snackSeedData.map((s) => s.category)))
    const categories = new Map<string, any>()
    for (const name of categoryNames) {
      try {
        const existing = await payload.find({
          collection: 'categories',
          where: { name: { equals: name } },
          limit: 1,
        })
        const doc = existing.docs[0]
          ? existing.docs[0]
          : await payload.create({ collection: 'categories', data: { name }, req })
        categories.set(name, doc)
      } catch (e) {
        payload.logger.warn(
          `Failed to upsert category ${name}: ${String((e as any)?.message || e)}`,
        )
      }
    }

    // Create items with placeholder image URLs
    const itemPromises = snackSeedData.map(async (seed) => {
      const cat = categories.get(seed.category)
      return await payload.create({
        collection: 'items',
        data: {
          name: seed.name,
          description: seed.description,
          price: seed.price,
          category: cat ? (cat as any).id : undefined,
          available: seed.available,
          imageUrl: seed.imageUrl,
        },
        req,
      })
    })

    const createdItems = await Promise.all(itemPromises)

    // Create sample admin user if doesn't exist
    const adminExists = await payload.find({
      collection: 'users',
      where: { role: { equals: 'admin' } },
      limit: 1,
    })

    let adminUser
    if (!adminExists.docs.length) {
      adminUser = await payload.create({
        collection: 'users',
        data: {
          email: 'admin@onlinebazar.com',
          password: 'admin123',
          role: 'admin',
          firstName: 'Admin',
          lastName: 'User',
        },
        req,
      })
    } else {
      adminUser = adminExists.docs[0]
    }

    // Create sample customer user
    const customerExists = await payload.find({
      collection: 'users',
      where: { email: { equals: 'customer@example.com' } },
      limit: 1,
    })

    let customerUser
    if (!customerExists.docs.length) {
      customerUser = await payload.create({
        collection: 'users',
        data: {
          email: 'customer@example.com',
          password: 'customer123',
          role: 'user',
          firstName: 'রহমত',
          lastName: 'উল্লাহ',
          customerNumber: '01739-416661',
        },
        req,
      })
    } else {
      customerUser = customerExists.docs[0]
    }

    // Create sample orders with different statuses
    const sampleOrderStatuses = [
      'pending',
      'processing',
      'shipped',
      'completed',
      'cancelled',
      'refunded',
    ] as const
    const orderPromises = sampleOrderStatuses.map(async (status, index) => {
      if (createdItems.length > index) {
        return await payload.create({
          collection: 'orders',
          data: {
            user: (customerUser as any).id,
            customerName: 'রহমত উল্লাহ',
            customerEmail: 'customer@example.com',
            customerNumber: '01739-416661',
            items: [
              {
                item: (createdItems[index] as any).id,
                quantity: Math.floor(Math.random() * 3) + 1,
              },
            ],
            status: status,
            totalAmount: createdItems[index].price * (Math.floor(Math.random() * 3) + 1),
            orderDate: new Date(
              Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
            ).toISOString(), // Random date within last 30 days
            shippingAddress: {
              line1: 'পাটুয়াখালী সদর',
              line2: 'সৈয়দনগর',
              city: 'পাটুয়াখালী',
              state: 'বরিশাল',
              postalCode: '8600',
              country: 'বাংলাদেশ',
            },
            deviceType: ['mobile', 'desktop', 'tablet'][Math.floor(Math.random() * 3)] as any,
            userAgent: 'Sample User Agent',
          },
          req,
        })
      }
    })

    const createdOrders = await Promise.allSettled(orderPromises)
    const successfulOrders = createdOrders.filter((result) => result.status === 'fulfilled').length

    payload.logger.info(
      `Successfully created ${createdItems.length} items and ${successfulOrders} sample orders with all status types`,
    )
  } catch (error) {
    payload.logger.error('Error running seed migration:', error)
    throw error
  }
}
