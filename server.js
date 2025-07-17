import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import express from "express";
import mongoose from "mongoose";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import passport from "passport";
import morgan from "morgan";
import cors from "cors";
import jwt from "jsonwebtoken";
import aws from "aws-sdk";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";


// ESM doesn't support __dirname directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize app
const app = express();

// Helmet CSP
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "img-src": ["'self'", "https:", "data:"],
    },
  })
);

// Cookie parser
app.use(cookieParser());

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:4200",
        "https://perfume-ecommerce-sigma.vercel.app",
        "www.thenuaims.com",
        "https://www.thenuaims.com",
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Body parsers
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf; // For Stripe
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", 1);

// Logging
app.use(morgan("tiny"));

// AWS setup
aws.config.setPromisesDependency();
aws.config.update({
  accessKeyId: process.env.AWS_IAM_USER_KEY,
  secretAccessKey: process.env.AWS_IAM_USER_SECRET,
  region: process.env.AWS_REGION,
});

// MongoDB connect
mongoose.set("debug", true);
const mongoURI = process.env.mongoDbUrl;
mongoose.connect(mongoURI);
const db = mongoose.connection;
db.on("error", (err) => console.error("MongoDB error:", err));
db.once("open", () => console.log("Connected to MongoDB"));

// Passport
app.use(passport.initialize());
import userRule from "./utils/userRule.js";
userRule(passport);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 550,
});
app.use(limiter);

// Import routes (must be .js if using ESM)
import authRoute from "./routes/authRoutes.js";
import announcementsRoute from "./routes/announcements.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import helperRoutes from "./routes/helper.js";
import exportRoutes from "./routes/exportRoutes.js";
import faqRoutes from "./routes/faqRoutes.js";
import feedRoutes from "./routes/feedRoutes.js";
import googleMerchantRoutes from "./routes/googleMerchantRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import settingRoutes from "./routes/settingsRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import modelRoutes from "./routes/modelRoutes.js";
import makeRoutes from "./routes/makeRoutes.js";
import manufacturerRoutes from "./routes/manufacturerRoutes.js";
import importRoutes from "./routes/importRoutes.js";
import stripeRoutes from "./routes/stripeRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import tabbyRoutes from "./routes/tabbyRoutes.js";
import addonRoutes from "./routes/addonRoutes.js"
import addOnProductRoutes from "./routes/addOnProductRoutes.js"
import quoteRoutes from "./routes/quoteRoutes.js";


// Route setup
app.use("/api/tabby", tabbyRoutes);
app.use("/api/auth", authRoute);
app.use("/api/announcements", announcementsRoute);
app.use("/api/banners", bannerRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/addons", addonRoutes);
app.use("/api/addons-product", addOnProductRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/helper", helperRoutes);
app.use("/api", exportRoutes);
app.use("/api/faq", faqRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/google-merchant", googleMerchantRoutes);
app.use("/api/offer", offerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/make", makeRoutes);
app.use("/api/model", modelRoutes);
app.use("/api/manufacturer", manufacturerRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api", importRoutes);
app.use("/webhook", stripeRoutes);
app.use("/api", quoteRoutes);


// Serve frontend
app.use(express.static(path.join(__dirname, "client/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/dist/index.html"));
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, (err) => {
  if (err) throw err;
  console.log(`Server is running on port ${PORT}`);
});

// Run jobs
import "./job/report.js";
