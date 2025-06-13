import type { CollectionConfig } from 'payload'
import { adminsOrSelf, anyone, checkRole } from './access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    create: anyone, // Allow anyone to create a user account (for registration)
    read: adminsOrSelf, // Allow users to read their own profile, admins can read all
    update: adminsOrSelf, // Allow users to update their own profile, admins can update all
    admin: ({ req: { user } }) => checkRole(['admin'], user),
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'User',
          value: 'user',
        },
      ],
      defaultValue: 'user',
      required: true,
    },
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
    },
    // Email added by default
    // Add more fields as needed
  ],
}
