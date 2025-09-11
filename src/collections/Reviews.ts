import type { CollectionConfig } from 'payload'
import { admins, adminsOnly, anyone, authenticated, checkRole } from './access'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['item', 'user', 'rating', 'approved', 'createdAt'],
  },
  access: {
    // Anyone can read approved reviews; admins can read all
    read: ({ req: { user } }) => {
      if (checkRole(['admin'], user as any)) return true
      return {
        approved: {
          equals: true,
        },
      }
    },
    // Only authenticated users who purchased the item can create
    create: async ({ req }) => {
      const user = req.user as any
      if (!user) return false

      try {
        const itemId = (req.body as any)?.item
        if (!itemId) return false

        // Check if the user has a completed order containing this item
        const orders = await req.payload.find({
          collection: 'orders',
          where: {
            and: [
              { user: { equals: user.id } },
              { status: { equals: 'completed' } },
              {
                'items.item': { equals: itemId },
              },
            ],
          },
          limit: 1,
        })

        return (orders?.docs?.length || 0) > 0
      } catch (e) {
        req.payload.logger?.error?.('Review create access check failed', e as any)
        return false
      }
    },
    // Only admins can update/delete (e.g., approve)
    update: admins,
    delete: admins,
    admin: adminsOnly,
  },
  fields: [
    {
      name: 'item',
      type: 'relationship',
      relationTo: 'items',
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'Reviewer (auto-set)'
      }
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
    },
    {
      name: 'title',
      type: 'text',
      required: false,
    },
    {
      name: 'comment',
      type: 'textarea',
      required: true,
    },
    {
      name: 'approved',
      type: 'checkbox',
      defaultValue: false,
      required: true,
    },
  ],
  hooks: {
    beforeValidate: [async ({ data, req }) => {
      // Always set the user from the request if available
      if (req?.user) {
        (data as any).user = (req.user as any).id
      }
      return data
    }],
    beforeChange: [
      async ({ req, data, operation }) => {
        if (operation === 'create') {
          try {
            const userId = (req.user as any)?.id
            const itemId = (data as any)?.item
            if (userId && itemId) {
              const existing = await req.payload.find({
                collection: 'reviews',
                where: { and: [ { user: { equals: userId } }, { item: { equals: itemId } } ] },
                limit: 1,
              })
              if (existing?.docs?.length) {
                throw new Error('You already reviewed this product')
              }
            }
          } catch (e) {
            throw e
          }
        }
        return data
      },
    ],
  },
}
