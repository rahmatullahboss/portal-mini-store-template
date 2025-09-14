"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Orders = void 0;
const access_1 = require("./access");
const orderStatusUpdate_1 = require("./hooks/orderStatusUpdate");
exports.Orders = {
    slug: 'orders',
    admin: {
        useAsTitle: 'id',
        defaultColumns: [
            'id',
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
        read: (0, access_1.adminsOrOwner)('user'), // Admins can read all orders, users can only read their own
        create: ({ req }) => true, // Allow guest checkout via API route
        update: access_1.admins, // Only admins can update orders
        delete: access_1.admins, // Only admins can delete orders
        admin: access_1.adminsOnly,
    },
    fields: [
        {
            name: 'user',
            type: 'relationship',
            relationTo: 'users',
            required: false,
        },
        // Client/device metadata for analytics
        {
            name: 'userAgent',
            type: 'text',
            required: false,
            admin: { description: 'Captured at order time' },
        },
        {
            name: 'deviceType',
            type: 'select',
            required: false,
            options: [
                { label: 'Mobile', value: 'mobile' },
                { label: 'Desktop', value: 'desktop' },
                { label: 'Tablet', value: 'tablet' },
                { label: 'Other', value: 'other' },
            ],
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
                    name: 'item',
                    type: 'relationship',
                    relationTo: 'items',
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
                { label: '⏳ Pending', value: 'pending' },
                { label: '🔄 Processing', value: 'processing' },
                { label: '📦 Shipped', value: 'shipped' },
                { label: '✅ Completed', value: 'completed' },
                { label: '❌ Cancelled', value: 'cancelled' },
                { label: '🔄 Refunded', value: 'refunded' },
            ],
            defaultValue: 'pending',
            required: true,
            admin: {
                description: 'Current status of the order - updates customer via email notifications',
                components: {
                    Field: '@/components/admin/OrderStatusSelect',
                    Cell: '@/components/admin/OrderStatusDropdown'
                }
            }
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
            orderStatusUpdate_1.default,
            async ({ doc, operation, req }) => {
                if (operation !== 'create')
                    return doc;
                try {
                    const payload = req?.payload;
                    const serverURL = payload?.config?.serverURL || process.env.NEXT_PUBLIC_SERVER_URL || '';
                    const items = Array.isArray(doc.items) ? doc.items : [];
                    const detailed = [];
                    for (const it of items) {
                        let name = 'Item';
                        let price;
                        let snackId;
                        const rel = it?.item;
                        if (rel && typeof rel === 'object') {
                            // If populated relationship
                            if (typeof rel.name === 'string')
                                name = rel.name;
                            if (typeof rel.price === 'number')
                                price = Number(rel.price);
                            if (typeof rel.id === 'string' || typeof rel.id === 'number') {
                                snackId = String(rel.id);
                            }
                            else if (typeof rel.value === 'string' || typeof rel.value === 'number') {
                                snackId = String(rel.value);
                            }
                        }
                        else if (rel != null && (typeof rel === 'string' || typeof rel === 'number')) {
                            // If stored as an ID
                            snackId = String(rel);
                        }
                        // Fetch snack if needed to fill missing fields
                        if ((!name || name === 'Item' || typeof price !== 'number') && snackId) {
                            try {
                                const itemDoc = await payload?.findByID({ collection: 'items', id: snackId });
                                if (itemDoc) {
                                    if (itemDoc.name && (!name || name === 'Item'))
                                        name = itemDoc.name;
                                    if (typeof itemDoc.price === 'number' && typeof price !== 'number') {
                                        price = Number(itemDoc.price);
                                    }
                                }
                            }
                            catch { }
                        }
                        detailed.push({ name: name || 'Item', quantity: Number(it?.quantity ?? 1), price });
                    }
                    const orderId = doc.id;
                    const total = Number(doc.totalAmount || 0);
                    const customerName = String(doc.customerName || '');
                    const customerEmail = String(doc.customerEmail || '');
                    const orderAdminURL = serverURL ? `${serverURL}/admin/collections/orders/${orderId}` : '';
                    const companyName = process.env.EMAIL_DEFAULT_FROM_NAME || 'Online Bazar';
                    const orderDate = doc.orderDate ? new Date(doc.orderDate) : new Date();
                    const orderDateStr = orderDate.toISOString().slice(0, 10);
                    const year = new Date().getFullYear();
                    const fmt = (n) => `৳${n.toFixed(2)}`;
                    // Build customer email (Bangla)
                    const subjectCustomer = `আপনার অর্ডার #${orderId} কনফার্ম করা হয়েছে!`;
                    const rowsHTML = detailed
                        .map((d) => `<tr><td style="padding:6px 8px;border:1px solid #e5e7eb;">${d.name}</td><td style=\"padding:6px 8px;border:1px solid #e5e7eb;text-align:center;\">${d.quantity}</td><td style=\"padding:6px 8px;border:1px solid #e5e7eb;text-align:right;\">${typeof d.price === 'number' ? fmt(d.price) : '-'}</td></tr>`)
                        .join('');
                    const rowsText = detailed
                        .map((d) => `${d.name}\t${d.quantity}\t${typeof d.price === 'number' ? d.price.toFixed(2) : '-'}`)
                        .join('\n');
                    const address = doc.shippingAddress || {};
                    const addressLines = [
                        String(address.line1 || '').trim(),
                        String(address.line2 || '').trim(),
                        [address.city, address.postalCode].filter(Boolean).join(', '),
                        String(address.country || '').trim(),
                    ].filter((l) => l && l.length > 0);
                    const bodyHTML = `
            <div style="font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827;">
              <p>হ্যালো ${customerName || 'গ্রাহক'},</p>
              <p>আপনার অর্ডারের জন্য ধন্যবাদ! আমরা আপনার অর্ডারটি পেয়েছি এবং এটি শিপমেন্টের জন্য প্রস্তুত করছি।</p>
              <p><strong>অর্ডার আইডি:</strong> #${orderId}<br/>
              <strong>অর্ডারের তারিখ:</strong> ${orderDateStr}</p>

              <h3 style="margin:16px 0 8px 0;">অর্ডারের বিবরণ</h3>
              <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e7eb;min-width:300px;">
                <thead>
                  <tr>
                    <th align="left" style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">পণ্য</th>
                    <th align="center" style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">পরিমাণ</th>
                    <th align="right" style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">মূল্য</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHTML}
                </tbody>
              </table>

              <p style="margin-top:12px;"><strong>মোট মূল্য:</strong> ${fmt(total)}</p>

              <h3 style="margin:16px 0 8px 0;">যে ঠিকানায় পাঠানো হবে:</h3>
              <p>${addressLines.map((l) => l.replace(/</g, '&lt;').replace(/>/g, '&gt;')).join('<br/>')}</p>

              <p style="margin-top:16px;">আমরা আপনার অর্ডারটি শিপিং করার পর আপনাকে আরেকটি ইমেলের মাধ্যমে জানিয়ে দেব।</p>
              ${serverURL ? `<p>আপনার অর্ডার হিস্টোরি দেখতে চাইলে আমাদের ওয়েবসাইটে লগইন করতে পারেন: <a href="${serverURL}" target="_blank" rel="noreferrer">${serverURL}</a></p>` : ''}

              <p>আমাদের সাথে শপিং করার জন্য আবারও ধন্যবাদ!</p>
              <p>শুভেচ্ছান্তে,<br/>${companyName} টিম</p>

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;"/>
              <p style="font-size:12px;color:#6b7280;">© ${year} ${companyName}. সর্বস্বত্ব সংরক্ষিত।</p>
            </div>
          `;
                    const bodyText = [
                        `হ্যালো ${customerName || 'গ্রাহক'},`,
                        '',
                        'আপনার অর্ডারের জন্য ধন্যবাদ! আমরা আপনার অর্ডারটি পেয়েছি এবং এটি শিপমেন্টের জন্য প্রস্তুত করছি।',
                        '',
                        `অর্ডার আইডি: #${orderId}`,
                        `অর্ডারের তারিখ: ${orderDateStr}`,
                        '',
                        'অর্ডারের বিবরণ',
                        'পণ্য\tপরিমাণ\tমূল্য',
                        rowsText,
                        '',
                        `মোট মূল্য: ${total.toFixed(2)}`,
                        '',
                        'যে ঠিকানায় পাঠানো হবে:',
                        ...addressLines,
                        '',
                        'আমরা আপনার অর্ডারটি শিপিং করার পর আপনাকে আরেকটি ইমেলের মাধ্যমে জানিয়ে দেব।',
                        serverURL ? `অর্ডার হিস্টোরি: ${serverURL}` : '',
                        '',
                        `শুভেচ্ছান্তে,\n${companyName} টিম`,
                        `© ${year} ${companyName}. সর্বস্বত্ব সংরক্ষিত।`,
                    ].filter(Boolean).join('\n');
                    // Send to customer (Bangla template)
                    if (customerEmail) {
                        await payload?.sendEmail?.({
                            to: customerEmail,
                            subject: subjectCustomer,
                            text: bodyText,
                            html: bodyHTML,
                        });
                    }
                    // Admin notification (keep English)
                    const adminEmail = process.env.ORDER_NOTIFICATIONS_EMAIL || process.env.GMAIL_USER;
                    if (adminEmail) {
                        const adminLines = detailed.map((d) => `- ${d.name} x ${d.quantity}`).join('\n');
                        const adminText = [
                            `New order #${orderId} from ${customerName} <${customerEmail}>`,
                            '',
                            'Order summary:',
                            adminLines,
                            '',
                            `Total: ${total.toFixed(2)}`,
                            orderAdminURL ? `\nAdmin link: ${orderAdminURL}` : '',
                        ].filter(Boolean).join('\n');
                        const adminHTML = `
              <div>
                <p><strong>New order #${orderId}</strong></p>
                <p>Customer: ${customerName} &lt;${customerEmail}&gt;</p>
                <p><strong>Order summary:</strong></p>
                <ul>
                  ${detailed.map((d) => `<li>${d.name} x ${d.quantity}</li>`).join('')}
                </ul>
                <p><strong>Total:</strong> ${total.toFixed(2)}</p>
                ${orderAdminURL ? `<p><a href="${orderAdminURL}">Open in Admin</a></p>` : ''}
              </div>
            `;
                        await payload?.sendEmail?.({
                            to: adminEmail,
                            subject: `New Order #${orderId} from ${customerName || 'Customer'}`,
                            text: adminText,
                            html: adminHTML,
                        });
                    }
                }
                catch (e) {
                    req?.payload?.logger?.error?.('Order email hook failed', e);
                }
                return doc;
            },
        ],
    },
};
