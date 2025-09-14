"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Items = void 0;
const access_1 = require("./access");
exports.Items = {
    slug: 'items',
    admin: {
        useAsTitle: 'name',
    },
    access: {
        read: access_1.anyone,
        create: access_1.admins,
        update: access_1.admins,
        delete: access_1.admins,
        admin: access_1.adminsOnly,
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
        },
        {
            name: 'description',
            type: 'textarea',
            required: true,
        },
        {
            name: 'price',
            type: 'number',
            required: true,
            min: 0,
        },
        {
            name: 'image',
            type: 'upload',
            relationTo: 'media',
            required: false,
        },
        {
            name: 'imageUrl',
            type: 'text',
            required: false,
            admin: {
                description: 'Use this for placeholder images or external image URLs. Either image or imageUrl should be provided.',
            },
        },
        {
            name: 'available',
            type: 'checkbox',
            defaultValue: true,
        },
        {
            name: 'category',
            type: 'relationship',
            relationTo: 'categories',
            required: false,
        },
    ],
};
