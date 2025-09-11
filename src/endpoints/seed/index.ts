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
        const existing = await payload.find({ collection: 'categories', where: { name: { equals: name } }, limit: 1 })
        const doc = existing.docs[0]
          ? existing.docs[0]
          : await payload.create({ collection: 'categories', data: { name }, req })
        categories.set(name, doc)
      } catch (e) {
        payload.logger.warn(`Failed to upsert category ${name}: ${String((e as any)?.message || e)}`)
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

    payload.logger.info(
      `Successfully created ${createdItems.length} items with placeholder images`,
    )
  } catch (error) {
    payload.logger.error('Error running seed migration:', error)
    throw error
  }
}
