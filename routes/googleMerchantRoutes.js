// const express = require('express');
// const {
// 	getAuthStatus,
// 	handleAuthCallback,
// 	revokeAuth,
// 	getConfig,
// 	saveConfig,
// 	syncCron,
// 	getFeed,
// 	getHistory,
// 	clearHistory,
// 	manualSync,
// 	deleteAllProducts,
// } = require('../controller/googleMerchantController');
// const router = express.Router();

// // Auth
// router.get('/auth', getAuthStatus);
// router.get('/auth/callback', handleAuthCallback);
// router.delete('/auth', revokeAuth);

// // Config
// router.get('/config', getConfig);
// router.post('/config', saveConfig);

// // CRON sync
// router.get('/corn/google-merchant-sync', syncCron);

// // Feed
// router.get('/feed', getFeed);

// // History
// router.get('/history', getHistory);
// router.delete('/history', clearHistory);

// // Manual sync
// router.post('/sync', manualSync);
// router.delete('/sync', deleteAllProducts);

// export default router;


import express from "express";
import passport from "passport";
import isAdmin from "../middleware/isAdmin.js";
import GoogleMerchantController from "../controller/googleMerchantController.js";

// ✅ Destructure methods from the default export
const {
  getConfig,
  saveConfig,
  updateConfig,
  syncAllProducts,
  getSyncHistory,
  clearSyncHistory,
  getAuthUrl,
  handleAuthCallback,
  revokeToken,
  createFeed,
  listFeeds,
  deleteAuth,
  validateMerchantId,
  setMerchantId,
  getMerchantId,
  deleteAllProducts,
} = GoogleMerchantController;

const router = express.Router();

// Configuration
router.post("/config", passport.authenticate("user-rule", { session: false }), isAdmin, saveConfig);
router.get("/config", passport.authenticate("user-rule", { session: false }), isAdmin, getConfig);
router.put("/config", passport.authenticate("user-rule", { session: false }), isAdmin, updateConfig);

// Sync
router.get("/sync", passport.authenticate("user-rule", { session: false }), isAdmin, syncAllProducts);
router.delete("/sync", passport.authenticate("user-rule", { session: false }), isAdmin, deleteAllProducts);
router.get("/history", passport.authenticate("user-rule", { session: false }), isAdmin, getSyncHistory);
router.delete("/history", passport.authenticate("user-rule", { session: false }), isAdmin, clearSyncHistory);

// Auth
router.get("/auth/url", passport.authenticate("user-rule", { session: false }), isAdmin, getAuthUrl);
router.get("/auth/callback", handleAuthCallback); // no auth here
router.post("/auth/revoke", passport.authenticate("user-rule", { session: false }), isAdmin, revokeToken);
router.post("/auth/validate", passport.authenticate("user-rule", { session: false }), isAdmin, validateMerchantId);
router.post("/auth/set-merchant-id", passport.authenticate("user-rule", { session: false }), isAdmin, setMerchantId);
router.get("/auth/merchant-id", passport.authenticate("user-rule", { session: false }), isAdmin, getMerchantId);
router.delete("/auth", passport.authenticate("user-rule", { session: false }), isAdmin, deleteAuth);

// Feed Management
router.post("/feed", passport.authenticate("user-rule", { session: false }), isAdmin, createFeed);
router.get("/feeds", passport.authenticate("user-rule", { session: false }), isAdmin, listFeeds);

export default router;
