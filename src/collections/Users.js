"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Users = void 0;
const access_1 = require("./access");
exports.Users = {
    slug: 'users',
    admin: {
        useAsTitle: 'email',
    },
    auth: {
        forgotPassword: {
            generateEmailHTML: (data) => {
                const resetPasswordURL = `${data?.req?.payload.config.serverURL}/reset-password?token=${data?.token}`;
                return `
          <!doctype html>
          <html>
            <body>
            You are receiving this because you (or someone else) have requested the reset of the password for your account. Please click on the following link, or paste this into your browser to complete the process: ${resetPasswordURL} If you did not request this, please ignore this email and your password will remain unchanged.
              
            </body>
          </html>
        `;
            },
        },
    },
    access: {
        create: access_1.anyone, // Allow anyone to create a user account (for registration)
        read: access_1.adminsOrSelf, // Allow users to read their own profile, admins can read all
        update: access_1.adminsOrSelf, // Allow users to update their own profile, admins can update all
        admin: ({ req: { user } }) => (0, access_1.checkRole)(['admin'], user),
    },
    fields: [
        {
            name: 'customerNumber',
            type: 'text',
            label: 'Customer number',
            required: false,
            admin: {
                description: 'Primary contact number for orders and updates',
            },
        },
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
        {
            name: 'address',
            type: 'group',
            admin: {
                description: 'Shipping address used for orders',
            },
            fields: [
                {
                    name: 'line1',
                    type: 'text',
                    label: 'Address line 1',
                    required: false,
                },
                {
                    name: 'line2',
                    type: 'text',
                    label: 'Address line 2',
                    required: false,
                },
                {
                    name: 'city',
                    type: 'text',
                    required: false,
                },
                {
                    name: 'state',
                    type: 'text',
                    required: false,
                },
                {
                    name: 'postalCode',
                    type: 'text',
                    label: 'Postal code',
                    required: false,
                },
                {
                    name: 'country',
                    type: 'text',
                    required: false,
                },
            ],
        },
    ],
};
