"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbandonedCarts = void 0;
const access_1 = require("./access");
exports.AbandonedCarts = {
    slug: 'abandoned-carts',
    labels: {
        singular: 'Abandoned Cart',
        plural: 'Abandoned Carts',
    },
    admin: {
        useAsTitle: 'sessionId',
        defaultColumns: ['status', 'customerEmail', 'cartTotal', 'lastActivityAt', 'updatedAt'],
    },
    access: {
        // Allow public write via API for tracking; restrict reads to admins
        read: access_1.adminsOnly,
        create: () => true,
        update: () => true,
        delete: access_1.admins,
        admin: access_1.adminsOnly,
    },
    timestamps: true,
    fields: [
        {
            name: 'sessionId',
            type: 'text',
            required: true,
            unique: false,
            admin: { description: 'Anonymous session identifier for the cart' },
        },
        {
            name: 'user',
            type: 'relationship',
            relationTo: 'users',
            required: false,
        },
        {
            name: 'customerName',
            type: 'text',
            required: false,
        },
        {
            name: 'customerEmail',
            type: 'email',
            required: false,
        },
        {
            name: 'customerNumber',
            type: 'text',
            required: false,
            label: 'Customer phone',
        },
        {
            name: 'items',
            type: 'array',
            required: false,
            minRows: 0,
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
                    min: 1,
                    required: true,
                },
            ],
        },
        {
            name: 'cartTotal',
            type: 'number',
            required: false,
            min: 0,
        },
        {
            name: 'status',
            type: 'select',
            options: [
                { label: 'Active', value: 'active' },
                { label: 'Abandoned', value: 'abandoned' },
                { label: 'Recovered', value: 'recovered' },
            ],
            defaultValue: 'active',
            required: true,
        },
        {
            name: 'lastActivityAt',
            type: 'date',
            required: true,
            defaultValue: () => new Date(),
        },
        {
            name: 'recoveredOrder',
            type: 'relationship',
            relationTo: 'orders',
            required: false,
        },
        {
            name: 'recoveryEmailSentAt',
            type: 'date',
            required: false,
        },
        {
            name: 'notes',
            type: 'textarea',
            required: false,
        },
    ],
};
