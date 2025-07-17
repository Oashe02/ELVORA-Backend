// utils/couponUtils.js

import  Coupon  from "../model/Coupon.js";
import  Product  from "../model/Product.js";
import User   from "../model/User.js";

/**
 * @param {Object} opts
 * @param {string} opts.code             Coupon code (uppercased/trimmed)
 * @param {string} opts.userId
 * @param {boolean} opts.isFirstPurchase
 * @param {Array<Object>} opts.cartItems [{ productId, quantity }]
 * @param {number} opts.shippingCost
 * @param {Date}   [opts.at=new Date()]
 */
export const validateAndCalculateCoupon = async ({
	code,
	userId,
	isFirstPurchase = false,
	cartItems = [],
	shippingCost = 0,
	at = new Date(),
}) => {
    // console.log("cartItems ", cartItems);
    // console.log({ code, userId, isFirstPurchase, cartItems, shippingCost, at });
    // 0) fetch & validate user
    if (userId) {
        const user = await User.findById(userId).lean();
        if (!user || user.isDeleted) {
            return {
                valid: false,
                reason: "USER_NOT_FOUND",
                message: "User not found.",
            };
        }
        if (user.isBlocked) {
            return {
                valid: false,
                reason: "USER_BLOCKED",
                message: "User account is blocked.",
            };
        }
        // if (!user.isVerified) {
        // 	return {
        // 		valid: false,
        // 		reason: 'EMAIL_NOT_VERIFIED',
        // 		message: 'Email address not verified.',
        // 	};
        // }
    }

    // 1) load coupon
    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
    console.log(coupon);
    if (!coupon) {
        return {
            valid: false,
            reason: "NOT_FOUND",
            message: "Coupon not found.",
        };
    }
    if (!coupon.isActive || coupon.status !== "active") {
        return {
            valid: false,
            reason: "COUPON_INACTIVE",
            message: "Coupon is inactive or disabled.",
        };
    }

    // 2) date window
    if (coupon.startDate && at < coupon.startDate) {
        return {
            valid: false,
            reason: "NOT_YET_ACTIVE",
            message: "Coupon is not yet active.",
        };
    }
    if (coupon.endDate && at > coupon.endDate) {
        return {
            valid: false,
            reason: "EXPIRED",
            message: "Coupon has expired.",
        };
    }

    // 3) usage limits
    if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
        return {
            valid: false,
            reason: "USAGE_LIMIT_REACHED",
            message: "Coupon usage limit has been reached.",
        };
    }
    if (userId) {
        const usedCount = (coupon.usedBy || []).filter(
            (u) => String(u) === String(userId),
        ).length;
        if (
            coupon.perCustomerLimit > 0 &&
            usedCount >= coupon.perCustomerLimit
        ) {
            return {
                valid: false,
                reason: "PER_CUSTOMER_LIMIT_REACHED",
                message: "You have used this coupon too many times.",
            };
        }
    }

    console.log({ asdasdasd: cartItems });
    // 4) fetch up-to-date product data
    const ids = cartItems.map((i) => i._id.toString());
    console.log({ ids });
    let products = await Product.find({ _id: { $in: ids } })
        // .select("price category")
        .lean();

    products = products.map((p) => {
        return {
            ...p,
            quantity: cartItems.find(
                (i) => i._id.toString() === p._id.toString(),
            )?.quantity,
        };
    });

    // const products = cartItems.map(({ productId, quantity }) => {
    // 	const prod = products.find((p) => {
    // 		console.log("p._id ", p._id.toString());
    // 		console.log("productId ", productId);

    // 		return String(p._id.toString()) === String(productId);
    // 	});
    // 	if (!prod) throw new Error(`Product ${productId} not found`);
    // 	return {
    // 		productId,
    // 		categoryId: prod.category,
    // 		price: prod.price,
    // 		quantity,
    // 	};
    // });

    // 5) compute subtotal & minPurchaseAmount
    const subtotal = products.reduce((sum, i) => {
        console.log({ i });
        return sum + i.price * i.quantity;
    }, 0);
    if (coupon.minPurchase && subtotal < coupon.minPurchase) {
        return {
            valid: false,
            reason: "MIN_PURCHASE_NOT_MET",
            message: `A minimum purchase of ${coupon.minPurchase} is required.`,
        };
    }

    console.log("Min purchase amount:", coupon.minPurchase);
    console.log("Subtotal:", subtotal);

    // 6) day / hour window
    if (
        coupon.daysOfWeek &&
        coupon.daysOfWeek.length > 0 &&
        !coupon.daysOfWeek.includes(at.getDay())
    ) {
        return {
            valid: false,
            reason: "INVALID_DAY",
            message: "Coupon not valid today.",
        };
    }
    if (
        coupon.hoursOfDay &&
        typeof coupon.hoursOfDay.start === "number" &&
        typeof coupon.hoursOfDay.end === "number"
    ) {
        const hr = at.getHours();
        if (hr < coupon.hoursOfDay.start || hr > coupon.hoursOfDay.end) {
            return {
                valid: false,
                reason: "INVALID_TIME",
                message: "Coupon not valid at this time.",
            };
        }
    }

    // 7) first-purchase-only
    if (coupon.isFirstPurchaseOnly && !isFirstPurchase) {
        return {
            valid: false,
            reason: "FIRST_PURCHASE_ONLY",
            message: "This coupon is valid for first-time purchases only.",
        };
    }

    // 8) applicability filtering
    let applicableSubtotal = 0;
    products.forEach((item) => {
        let ok = true;
        if (
            coupon.applicability === "products" &&
            !(coupon.applicableProducts || [])
                .map(String)
                .includes(String(item.productId))
        )
            ok = false;
        if (
            coupon.applicability === "categories" &&
            !(coupon.applicableCategories || [])
                .map(String)
                .includes(String(item.categoryId))
        )
            ok = false;
        if (
            (coupon.excludedProducts || [])
                .map(String)
                .includes(String(item.productId))
        )
            ok = false;
        if (
            (coupon.excludedCategories || [])
                .map(String)
                .includes(String(item.categoryId))
        )
            ok = false;
        if (ok) applicableSubtotal += item.price * item.quantity;
    });
    if (coupon.applicability !== "all" && applicableSubtotal === 0) {
        return {
            valid: false,
            reason: "NO_QUALIFYING_ITEMS",
            message: "No items in cart qualify for this coupon.",
        };
    }

    // 9) calculate discount
    let discount = 0;
    let freeShipping = false;
    let freeItems = [];

    switch (coupon.type) {
        case "percentage":
            discount =
                ((coupon.applicability === "all"
                    ? subtotal
                    : applicableSubtotal) *
                    coupon.value) /
                100;
            if (coupon.maxDiscountAmount > 0) {
                discount = Math.min(discount, coupon.maxDiscountAmount);
            }
            console.log(discount);
            console.log(coupon.maxDiscountAmount);
            console.log(
                coupon.applicability === "all" ? subtotal : applicableSubtotal,
            );
            console.log(coupon.value);
            break;

        case "fixed":
            discount = coupon.value;
            break;

        case "free_shipping":
            discount = shippingCost;
            freeShipping = true;
            break;

        case "buy_x_get_y": {
            const buyQty = coupon.buyXQuantity || 0;
            const getQty = coupon.getYQuantity || 0;
            if (!buyQty || !getQty || !coupon.getYProductId) {
                return {
                    valid: false,
                    reason: "INVALID_BOGO_CONFIG",
                    message: "Invalid BOGO configuration.",
                };
            }
            const line = products.find(
                (i) => String(i.productId) === String(coupon.getYProductId),
            );
            if (line) {
                const sets = Math.floor(line.quantity / (buyQty + getQty));
                const freeCount = sets * getQty;
                if (freeCount > 0) {
                    discount = line.price * freeCount;
                    freeItems.push({
                        productId: coupon.getYProductId,
                        quantity: freeCount,
                    });
                }
            }
            break;
        }
    }

    // cap discount
    discount = Math.min(discount, subtotal);

    // final totals
    const newSubtotal = Number(subtotal) - Number(discount);
    const newShipping = freeShipping ? 0 : Number(shippingCost);
    const newTotal = Number(newSubtotal) + Number(newShipping);

    return {
        valid: true,
        discount,
        freeShipping,
        freeItems,
        newSubtotal,
        newShipping,
        newTotal,
        message: "Coupon applied successfully",
        reason: "SUCCESS",
    };
}


