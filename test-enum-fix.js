"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const payload_1 = require("payload");
const payload_config_1 = require("./src/payload.config");
async function testEnumFix() {
    try {
        const payload = await (0, payload_1.getPayload)({ config: payload_config_1.default });
        // Try to create a test order with "processing" status
        const testOrder = await payload.create({
            collection: 'orders',
            data: {
                user: 1, // Assuming user ID 1 exists
                status: 'processing',
                totalAmount: 100,
                orderDate: new Date().toISOString(),
            },
            depth: 0,
        });
        console.log('✅ Successfully created order with "processing" status:', testOrder.id);
        // Clean up - delete the test order
        await payload.delete({
            collection: 'orders',
            id: testOrder.id,
            depth: 0,
        });
        console.log('✅ Test order cleaned up successfully');
    }
    catch (error) {
        console.error('❌ Error testing enum fix:', error);
    }
}
testEnumFix();
