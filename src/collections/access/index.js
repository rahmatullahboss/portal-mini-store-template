"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminsOrOwner = exports.adminsOrSelf = exports.authenticated = exports.adminsOnly = exports.admins = exports.anyone = exports.checkRole = void 0;
// Utility function to check if user has specific roles
const checkRole = (allRoles = [], user = null) => {
    if (user) {
        if (allRoles.some((role) => user?.role === role)) {
            return true;
        }
    }
    return false;
};
exports.checkRole = checkRole;
// Common access patterns
const anyone = () => true;
exports.anyone = anyone;
const admins = ({ req: { user } }) => (0, exports.checkRole)(['admin'], user);
exports.admins = admins;
const adminsOnly = ({ req: { user } }) => (0, exports.checkRole)(['admin'], user);
exports.adminsOnly = adminsOnly;
const authenticated = ({ req: { user } }) => !!user;
exports.authenticated = authenticated;
const adminsOrSelf = ({ req: { user } }) => {
    if (!user)
        return false;
    if ((0, exports.checkRole)(['admin'], user))
        return true;
    return {
        id: {
            equals: user.id,
        },
    };
};
exports.adminsOrSelf = adminsOrSelf;
const adminsOrOwner = (ownerField = 'user') => {
    return ({ req: { user } }) => {
        if (!user)
            return false;
        if ((0, exports.checkRole)(['admin'], user))
            return true;
        return {
            [ownerField]: {
                equals: user.id,
            },
        };
    };
};
exports.adminsOrOwner = adminsOrOwner;
