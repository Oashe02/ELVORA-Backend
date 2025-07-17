import express from "express";
import { Parser } from "json2csv";
import Product from "../model/Product.js"; 

const router = express.Router();

import  passport from "passport";
import isAdmin from "../middleware/isAdmin.js";
// Generic export route to export all data
router.get(
    "/generic-export",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    async (req, res) => {
        const { entity, format = "csv", status } = req.query;

        try {
            if (entity !== "products") {
                return res.status(400).json({ message: "Invalid entity" });
            }

            const query = {};
            if (status && status !== "all") {
                query.status = status;
            }

            // Use .lean() to get plain JavaScript objects and populate the full category
            const products = await Product.find(query)
                .populate("category")
                .sort({ createdAt: -1 })
                .lean();

            const filename = `${entity}-${Date.now()}`;

            if (format === "csv") {
                // Modify products to replace category object with category ID for CSV export
                const productsForCsv = products.map((p) => ({
                    ...p,
                    category: p.category ? p.category._id : "",
                }));

                const json2csvParser = new Parser();
                const csv = json2csvParser.parse(productsForCsv);

                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename=${filename}.csv`,
                );
                res.status(200).send(csv);
            } else if (format === "json") {
                res.setHeader("Content-Type", "application/json");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename=${filename}.json`,
                );
                res.status(200).json(products);
            } else {
                res.status(400).json({ message: "Invalid format" });
            }
        } catch (error) {
            console.error("Export error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
);

export default router;

