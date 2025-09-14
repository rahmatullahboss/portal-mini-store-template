"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Categories = void 0;
const access_1 = require("./access");
exports.Categories = {
    slug: 'categories',
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'updatedAt'],
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
            unique: true,
        },
        {
            name: 'description',
            type: 'textarea',
        },
    ],
};
