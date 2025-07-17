export const generateId = () => {
	return Math.random().toString(36).substr(2, 9);
};

export const generateSKU = (productName) => {
	const prefix = productName.substring(0, 3).toUpperCase();
	const randomPart = Math.floor(Math.random() * 10000)
		.toString()
		.padStart(4, '0');
	return `${prefix}-${randomPart}`;
};

export const generateSlug = (name) => {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
};

export const formatPrice = (price, currency = 'USD') => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency,
	}).format(price);
};

export const formatDate = (date) => {
	const dateObj = typeof date === 'string' ? new Date(date) : date;
	return dateObj.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
};

export const validateEmail = (email) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

export const validatePhone = (phone) => {
	const cleaned = phone.replace(/\D/g, '');
	const phoneRegex = /^\+?[\d\s\-()]+$/;
	return phoneRegex.test(phone) && cleaned.length >= 10;
};

export const truncateText = (text, maxLength) => {
	if (text.length <= maxLength) return text;
	return text.substring(0, maxLength) + '...';
};

export const calculateDiscount = (originalPrice, discountedPrice) => {
	if (originalPrice <= 0) return 0;
	return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
};

export const isValidCoupon = (coupon) => {
	if (!coupon) return false;
	const now = new Date();
	const starts = new Date(coupon.startDate);
	const ends = new Date(coupon.endDate);
	const underLimit =
		typeof coupon.usageCount === 'number' &&
		typeof coupon.usageLimit === 'number' &&
		coupon.usageCount < coupon.usageLimit;

	return (
		coupon.status === 'active' && now >= starts && now <= ends && underLimit
	);
};
