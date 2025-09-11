import type { CollectionConfig } from 'payload'
import { admins, adminsOnly, adminsOrOwner, authenticated } from './access'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'id',
    defaultColumns: [
      'id',
      'user',
      'customerName',
      'customerEmail',
      'status',
      'orderDate',
      'customerNumber',
      'shippingAddress.city',
      'shippingAddress.line1',
    ],
  },
  access: {
    read: adminsOrOwner('user'), // Admins can read all orders, users can only read their own
    create: ({ req }) => true, // Allow guest checkout via API route
    update: admins, // Only admins can update orders
    delete: admins, // Only admins can delete orders
    admin: adminsOnly,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: false,
    },
    {
      name: 'customerName',
      type: 'text',
      label: 'Customer name',
      required: true,
      admin: {
        description: 'Name captured at time of order',
      },
    },
    {
      name: 'customerEmail',
      type: 'email',
      label: 'Customer email',
      required: true,
    },
    {
      name: 'customerNumber',
      type: 'text',
      label: 'Customer number',
      required: true,
      admin: {
        description: 'Customer contact number captured at time of order',
      },
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
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return doc

        try {
          const payload = req?.payload
          const serverURL = (payload?.config as any)?.serverURL || process.env.NEXT_PUBLIC_SERVER_URL || ''

          // Build a human-friendly items summary (attempt to fetch snack names)
          const items: any[] = Array.isArray((doc as any).items) ? ((doc as any).items as any[]) : []
          const lines: string[] = []
          for (const it of items) {
            let label = String(it?.snack || 'Item')
            try {
              if (it?.snack) {
                const snack = await payload?.findByID({ collection: 'snacks', id: String(it.snack) })
                if (snack && (snack as any).name) label = (snack as any).name
              }
            } catch {}
            lines.push(`- ${label} x ${it?.quantity ?? 1}`)
          }

          const orderId = (doc as any).id
          const total = Number((doc as any).totalAmount || 0)
          const customerName = String((doc as any).customerName || '')
          const customerEmail = String((doc as any).customerEmail || '')
          const orderAdminURL = serverURL ? `${serverURL}/admin/collections/orders/${orderId}` : ''

          const subjectCustomer = `Order Confirmation #${orderId}`
          const subjectAdmin = `New Order #${orderId} from ${customerName || 'Customer'}`
          const bodyText = [
            `Thank you for your order${customerName ? `, ${customerName}` : ''}!`,
            '',
            'Order summary:',
            ...lines,
            '',
            `Total: ${total.toFixed(2)}`,
            '',
            'We will notify you when your order is processed.',
          ].join('\n')

          const bodyHTML = `
            <div>
              <p>Thank you for your order${customerName ? `, ${customerName}` : ''}!</p>
              <p><strong>Order #${orderId}</strong></p>
              <p><strong>Order summary:</strong></p>
              <ul>
                ${lines.map((l) => `<li>${l.replace(/^\-\s*/, '')}</li>`).join('')}
              </ul>
              <p><strong>Total:</strong> ${total.toFixed(2)}</p>
              <p>We will notify you when your order is processed.</p>
            </div>
          `

          // Send to customer
          if (customerEmail) {
            await payload?.sendEmail?.({
              to: customerEmail,
              subject: subjectCustomer,
              text: bodyText,
              html: bodyHTML,
            })
          }

          // Send to admin/owner
          const adminEmail = process.env.ORDER_NOTIFICATIONS_EMAIL || process.env.GMAIL_USER
          if (adminEmail) {
            const adminText = [
              `New order #${orderId} from ${customerName} <${customerEmail}>`,
              '',
              'Order summary:',
              ...lines,
              '',
              `Total: ${total.toFixed(2)}`,
              orderAdminURL ? `\nAdmin link: ${orderAdminURL}` : '',
            ].filter(Boolean).join('\n')

            const adminHTML = `
              <div>
                <p><strong>New order #${orderId}</strong></p>
                <p>Customer: ${customerName} &lt;${customerEmail}&gt;</p>
                <p><strong>Order summary:</strong></p>
                <ul>
                  ${lines.map((l) => `<li>${l.replace(/^\-\s*/, '')}</li>`).join('')}
                </ul>
                <p><strong>Total:</strong> ${total.toFixed(2)}</p>
                ${orderAdminURL ? `<p><a href="${orderAdminURL}">Open in Admin</a></p>` : ''}
              </div>
            `

            await payload?.sendEmail?.({
              to: adminEmail,
              subject: subjectAdmin,
              text: adminText,
              html: adminHTML,
            })
          }
        } catch (e) {
          // Do not block order creation on email errors
          req?.payload?.logger?.error?.('Order email hook failed', e as any)
        }

        return doc
      },
    ],
  },
}
