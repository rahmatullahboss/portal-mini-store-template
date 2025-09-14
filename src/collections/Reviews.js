"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reviews = void 0;
const access_1 = require("./access");
exports.Reviews = {
    slug: 'reviews',
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['item', 'user', 'rating', 'approved', 'createdAt'],
    },
    access: {
        // Anyone can read approved reviews; admins can read all
        read: ({ req: { user } }) => {
            if ((0, access_1.checkRole)(['admin'], user))
                return true;
            return {
                approved: {
                    equals: true,
                },
            };
        },
        // Only authenticated users who purchased the item can create
        create: async ({ req }) => {
            const user = req.user;
            if (!user)
                return false;
            try {
                const raw = req.body?.item;
                const itemId = typeof raw === 'string' ? parseInt(raw, 10) : raw;
                if (!itemId)
                    return false;
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
                });
                return (orders?.docs?.length || 0) > 0;
            }
            catch (e) {
                req.payload.logger?.error?.('Review create access check failed', e);
                return false;
            }
        },
        // Only admins can update/delete (e.g., approve)
        update: access_1.admins,
        delete: access_1.admins,
        admin: access_1.adminsOnly,
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
            name: 'reviewerName',
            type: 'text',
            required: false,
            admin: {
                description: 'Captured from user at time of review',
                readOnly: true,
            },
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
                    data.user = req.user.id;
                    const first = req.user?.firstName || '';
                    const last = req.user?.lastName || '';
                    const name = `${first} ${last}`.trim() || req.user?.email;
                    if (name && !data.reviewerName)
                        data.reviewerName = name;
                }
                return data;
            }],
        beforeChange: [
            async ({ req, data, operation }) => {
                if (operation === 'create') {
                    try {
                        const userId = req.user?.id;
                        const raw = data?.item;
                        const itemId = typeof raw === 'string' ? parseInt(raw, 10) : raw;
                        if (userId && itemId) {
                            const existing = await req.payload.find({
                                collection: 'reviews',
                                where: { and: [{ user: { equals: userId } }, { item: { equals: itemId } }] },
                                limit: 1,
                            });
                            if (existing?.docs?.length) {
                                throw new Error('You already reviewed this product');
                            }
                            // Ensure reviewerName exists
                            if (!data.reviewerName && req.user) {
                                const first = req.user?.firstName || '';
                                const last = req.user?.lastName || '';
                                const name = `${first} ${last}`.trim() || req.user?.email;
                                if (name)
                                    data.reviewerName = name;
                            }
                        }
                    }
                    catch (e) {
                        throw e;
                    }
                }
                return data;
            },
        ],
    },
};
