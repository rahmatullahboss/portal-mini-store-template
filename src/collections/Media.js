"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Media = void 0;
const access_1 = require("./access");
exports.Media = {
    slug: 'media',
    access: {
        read: access_1.anyone,
        create: access_1.admins,
        update: access_1.admins,
        delete: access_1.admins,
        admin: access_1.adminsOnly,
    },
    fields: [
        {
            name: 'alt',
            type: 'text',
            required: false,
            admin: {
                description: 'Optional. Provide descriptive text for accessibility when available.',
            },
        },
    ],
    upload: true,
};
