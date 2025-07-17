import dayjs from 'dayjs';

/**
 * Calculate the total refund amount based on returned items.
 * @param {Array<{ product: any, quantity: number, price: number }>} orderItems
 * @param {Array<{ product: any, quantity: number }>} returnItems
 * @returns {number}
 */
export function calculateRefundAmount(orderItems, returnItems) {
	let refundAmount = 0;

	for (const returnItem of returnItems) {
		const orderItem = orderItems.find(
			(p) => p.product?.toString() === returnItem.product.toString()
		);

		if (orderItem && returnItem.quantity <= orderItem.quantity) {
			refundAmount += orderItem.price * returnItem.quantity;
		}
	}

	return refundAmount;
}

/**
 * Calculate order subtotal and total.
 * @param {{ products: Array<{ price: number, quantity: number }>, tax?: number, shippingCharge?: number, discount?: number }} data
 * @returns {{ subtotal: number, total: number }}
 */
export function calculateOrderTotals(data) {
	const subtotal = data.products.reduce(
		(sum, item) => sum + item.price * item.quantity,
		0
	);
	const total =
		subtotal +
		(data.tax || 0) +
		(data.shippingCharge || 0) -
		(data.discount || 0);
	return { subtotal, total };
}

/**
 * If billing address is empty, clone values from shipping.
 * @param {{ shipping: object, billingAddress?: object }} data
 * @returns {{ shipping: object, billingAddress: object }}
 */
export function cloneShippingToBilling(data) {
	if (
		(!data.billingAddress || !data.billingAddress.address) &&
		data.shipping?.address
	) {
		data.billingAddress = {
			address: data.shipping.address,
			address2: data.shipping.address2,
			city: data.shipping.city,
			state: data.shipping.state,
			postalCode: data.shipping.postalCode,
			country: data.shipping.country,
			phone: data.shipping.phone,
			firstName: data.shipping.firstName,
			lastName: data.shipping.lastName,
			company: data.shipping.company,
		};
	}
	return data;
}

/**
 * Calculate the return deadline (30 days after delivery).
 * @param {Date} actualDeliveryDate
 * @returns {Date|undefined}
 */
export function calculateReturnDeadline(actualDeliveryDate) {
	if (!actualDeliveryDate) return undefined;
	return dayjs(actualDeliveryDate).add(30, 'day').toDate();
}
