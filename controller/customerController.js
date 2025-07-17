import User from "../model/User.js";
export const getAllCustomer = async (req, res) => {
    try {
        // Parse pagination params; default to page=1 & limit=10
        let { page = 1, limit = 10, search } = req.query;
        page = parseInt(page, 10);
        limit = parseInt(limit, 10);
        if (Number.isNaN(page) || page < 1) page = 1;
        if (Number.isNaN(limit) || limit < 1) limit = 10;

        // Build MongoDB filter
        const filter = { role: "customer" };
        if (search) {
            const regex = new RegExp(search, "i");
            // Search in name or email if present
            filter.$or = [
                { name: regex },
                { email: regex },
                { firstName: regex },
                { lastName: regex },
            ];
        }

        const totalCustomers = await User.countDocuments(filter);
        const totalPages = Math.ceil(totalCustomers / limit) || 1;
        const customers = await User.find(filter)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return res.json({
            success: true,
            customers,
            pagination: {
                page,
                limit,
                totalPages,
                totalCustomers,
            },
        });
    } catch (err) {
        console.error("Get customers error:", err);
        return res
            .status(500)
            .json({ success: false, error: "Failed to load customer data" });
    }
};
