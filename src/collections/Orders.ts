import type { CollectionConfig } from 'payload'
import { admins, adminsOnly, adminsOrOwner, authenticated } from './access'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['id', 'user', 'status', 'orderDate', 'shippingAddress.city', 'shippingAddress.line1'],
  },
  access: {
    read: adminsOrOwner('user'), // Admins can read all orders, users can only read their own
    create: authenticated, // Any authenticated user can create orders
    update: admins, // Only admins can update orders
    delete: admins, // Only admins can delete orders
    admin: adminsOnly,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'items',
      type: 'array',
      fields: [
        {
          name: 'snack',
          type: 'relationship',
          relationTo: 'snacks',
          required: true,
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
        },
      ],
      required: true,
      minRows: 1,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'pending',
      required: true,
    },
    {
      name: 'totalAmount',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'orderDate',
      type: 'date',
      defaultValue: () => new Date(),
      required: true,
    },
    {
      name: 'shippingAddress',
      type: 'group',
      admin: {
        description: 'Shipping address captured at time of order',
      },
      fields: [
        {
          name: 'line1',
          type: 'text',
          label: 'Address line 1',
          required: true,
        },
        {
          name: 'line2',
          type: 'text',
          label: 'Address line 2',
        },
        {
          name: 'city',
          type: 'text',
          required: true,
        },
        {
          name: 'state',
          type: 'text',
        },
        {
          name: 'postalCode',
          type: 'text',
          label: 'Postal code',
          required: true,
        },
        {
          name: 'country',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
