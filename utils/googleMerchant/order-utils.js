import Order from '../../model/Order.js';

/**
 * Generates a unique order ID with format ORD-YYMMDD-XXXX
 * where XXXX is a sequential number
 */
export async function generateOrderId(lastOrderId) {
	const today = new Date();
	const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
	// Use last 6 digits (YYMMDD)
	const datePart = dateStr.substring(2);

	let nextNumber = 1;

	if (lastOrderId) {
		const parts = lastOrderId.split('-');
		if (parts.length === 3) {
			const lastNumber = parseInt(parts[2], 10);
			if (!isNaN(lastNumber)) {
				nextNumber = lastNumber + 1;
			}
		}
	}

	// Format with leading zeros (4 digits)
	return `ORD-${datePart}-${String(nextNumber).padStart(4, '0')}`;
}

/**
 * Validates if an order belongs to a specific customer
 */
export async function validateOrderOwnership(orderIdentifier, email) {
	const order = await Order.findOne({
		$or: [{ orderId: orderIdentifier }, { trackingCode: orderIdentifier }],
		'customer.email': email,
	});

	return Boolean(order);
}

/**
 * Gets the current status of an order with detailed information
 */
export async function getOrderStatusDetails(orderId) {
	const order = await Order.findOne({
		$or: [{ orderId: orderId }, { trackingCode: orderId }],
	})
		.select(
			'status paymentStatus history shippingInfo estimatedDelivery updatedAt'
		)
		.lean();

	if (!order) return null;

	return {
		status: order.status,
		paymentStatus: order.paymentStatus,
		history: order.history,
		shippingInfo: order.shippingInfo || null,
		estimatedDelivery: order.estimatedDelivery || null,
		lastUpdated: order.updatedAt,
	};
}
