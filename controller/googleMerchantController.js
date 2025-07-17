// export const manualSync = async (req, res) => {
// 	try {
// 		// const user = await getUserFromRequest(req);
// 		if (!user || user.role !== 'admin') {
// 			return res.status(401).json({ error: 'Unauthorized' });
// 		}
// 		const result = await syncWithGoogleMerchant('manual');
// 		return res.json(result);
// 	} catch (err) {
// 		console.error('manualSync error:', err);
// 		return res
// 			.status(500)
// 			.json({ error: 'An error occurred during synchronization' });
// 	}
// };

// export const deleteAllProducts = async (req, res) => {
// 	try {
// 		const user = await getUserFromRequest(req);
// 		if (!user || user.role !== 'admin') {
// 			return res.status(401).json({ error: 'Unauthorized' });
// 		}
// 		const result = await deleteAllProducts();
// 		return res.json(result);
// 	} catch (err) {
// 		console.error('deleteAllProducts error:', err);
// 		return res
// 			.status(500)
// 			.json({ error: 'An error occurred while deleting products' });
// 	}
// };

// export const getHistory = async (req, res) => {
// 	try {
// 		const { id, limit } = req.query;
// 		const max = limit ? parseInt(limit, 10) : 10;
// 		if (id) {
// 			const entry = await getSyncHistoryEntry(id);
// 			if (!entry) {
// 				return res.status(404).json({ error: 'Sync history entry not found' });
// 			}
// 			return res.json(entry);
// 		} else {
// 			const list = await getSyncHistory(max);
// 			return res.json(list);
// 		}
// 	} catch (err) {
// 		console.error('getHistory error:', err);
// 		return res.status(500).json({ error: 'Failed to get sync history' });
// 	}
// };

// export const clearHistory = async (req, res) => {
// 	try {
// 		const success = await clearSyncHistory();
// 		if (success) {
// 			return res.json({
// 				success: true,
// 				message: 'Successfully cleared sync history',
// 			});
// 		}
// 		return res.status(500).json({ error: 'Failed to clear sync history' });
// 	} catch (err) {
// 		console.error('clearHistory error:', err);
// 		return res.status(500).json({ error: 'Failed to clear sync history' });
// 	}
// };

// export const getFeed = async (req, res) => {
// 	try {
// 		const format = (req.query.format || 'xml').toLowerCase();
// 		if (format === 'csv') {
// 			const csv = await generateCsvFeed();
// 			res
// 				.header('Content-Type', 'text/csv')
// 				.header(
// 					'Content-Disposition',
// 					'attachment; filename="product-feed.csv"'
// 				)
// 				.send(csv);
// 		} else {
// 			const xml = await generateXmlFeed();
// 			res
// 				.header('Content-Type', 'application/xml')
// 				.header(
// 					'Content-Disposition',
// 					'attachment; filename="product-feed.xml"'
// 				)
// 				.send(xml);
// 		}
// 	} catch (err) {
// 		console.error('getFeed error:', err);
// 		return res.status(500).json({ error: 'Failed to generate product feed' });
// 	}
// };

// export const syncCron = async (req, res) => {
// 	try {
// 		const auth = req.header('authorization');
// 		if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
// 			return res.status(401).json({ error: 'Unauthorized' });
// 		}

// 		const includeDeletes = req.query.include_deletes !== 'false'; // default true
// 		const result = await syncProductsToGoogleMerchant(includeDeletes);
// 		return res.json(result);
// 	} catch (err) {
// 		console.error('syncCron error:', err);
// 		return res
// 			.status(500)
// 			.json({ error: 'Failed to sync products', message: err.message });
// 	}
// };

// export const getConfig = async (req, res) => {
// 	try {
// 		const config = await getGoogleMerchantConfig();
// 		const connected = await isAuthenticated();
// 		return res.json({ ...config, isConnected: connected });
// 	} catch (err) {
// 		console.error('getConfig error:', err);
// 		return res
// 			.status(500)
// 			.json({ error: 'Failed to get Google Merchant configuration' });
// 	}
// };

// export const saveConfig = async (req, res) => {
// 	try {
// 		const updated = await saveGoogleMerchantConfig(req.body);
// 		return res.json(updated);
// 	} catch (err) {
// 		console.error('saveConfig error:', err);
// 		return res.status(500).json({ error: 'Failed to save configuration' });
// 	}
// };
// export const getAuthStatus = async (req, res) => {
// 	try {
// 		const authenticated = await isAuthenticated();
// 		if (authenticated) {
// 			return res.json({
// 				authenticated: true,
// 				message: 'Already authenticated with Google Merchant Center',
// 			});
// 		}
// 		const authUrl = getAuthorizationUrl();
// 		return res.json({ authenticated: false, authUrl });
// 	} catch (err) {
// 		console.error('getAuthStatus error:', err);
// 		return res.status(500).json({ error: 'Failed to get authorization URL' });
// 	}
// };

// export const handleAuthCallback = async (req, res) => {
// 	try {
// 		const { code, error, error_description } = req.query;
// 		if (error) {
// 			const msg = error_description || error;
// 			console.error('OAuth callback error:', msg);
// 			return res.redirect(
// 				`/admin/integrations/google-merchant?error=${encodeURIComponent(msg)}`
// 			);
// 		}
// 		if (!code) {
// 			console.error('No code in OAuth callback');
// 			return res.redirect(
// 				`/admin/integrations/google-merchant?error=${encodeURIComponent(
// 					'No authorization code received from Google'
// 				)}`
// 			);
// 		}

// 		await exchangeCodeForTokens(code);
// 		return res.redirect('/admin/integrations/google-merchant?success=true');
// 	} catch (err) {
// 		console.error('handleAuthCallback error:', err);
// 		const msg = err instanceof Error ? err.message : String(err);
// 		return res.redirect(
// 			`/admin/integrations/google-merchant?error=${encodeURIComponent(msg)}`
// 		);
// 	}
// };

// export const revokeAuth = async (req, res) => {
// 	try {
// 		const success = await revokeToken();
// 		if (success) {
// 			return res.json({
// 				success: true,
// 				message: 'Successfully disconnected from Google Merchant Center',
// 			});
// 		} else {
// 			console.error('Failed to revoke token');
// 			return res
// 				.status(500)
// 				.json({ error: 'Failed to disconnect from Google Merchant Center' });
// 		}
// 	} catch (err) {
// 		console.error('revokeAuth error:', err);
// 		return res
// 			.status(500)
// 			.json({ error: 'Failed to disconnect from Google Merchant Center' });
// 	}
// };

import {
    GoogleMerchantAuthService,
    GoogleMerchantConfigService,
    validateMerchantId as validateMerchantIdHelper,
    setMerchantId as setMerchantIdHelper,
  } from "../lib/googleMerchantAuth.js";
  
  import GoogleMerchantToken from "../model/GoogleMerchantToken.js";
  
  import {
    syncAllProducts,
    createFeed,
    listFeeds,
    deleteAllProducts,
  } from "../utils/googleMerchant/api.js";
  
  const GoogleMerchantController = {
    // Validate Merchant ID
    validateMerchantId: async (req, res) => {
      try {
        const { merchantId } = req.body;
        if (!merchantId) {
          return res.status(400).json({ error: "Merchant ID is required" });
        }
  
        const result = await validateMerchantIdHelper(merchantId);
        return res.json({ success: true, message: "Merchant ID is valid", result });
      } catch (error) {
        console.error("Merchant ID validation error:", error);
        return res.status(400).json({ error: error.message });
      }
    },
  
    // Set Merchant ID
    setMerchantId: async (req, res) => {
      try {
        const { merchantId } = req.body;
        if (!merchantId) {
          return res.status(400).json({ error: "Merchant ID is required" });
        }
  
        const result = await setMerchantIdHelper(merchantId);
        return res.json(result);
      } catch (error) {
        console.error("Set merchant ID error:", error);
        return res.status(500).json({ error: error.message });
      }
    },
  
    // Get Merchant ID
    getMerchantId: async (_req, res) => {
      try {
        const config = await GoogleMerchantConfigService.getConfig();
        return res.json({ merchantId: config?.merchantId || null });
      } catch (error) {
        console.error("Get merchant ID error:", error);
        return res.status(500).json({ error: error.message });
      }
    },
  
    // Config Operations
    getConfig: async (_req, res) => {
      try {
        const config = await GoogleMerchantConfigService.getConfig();
        return res.json(config);
      } catch (error) {
        console.error("getConfig error:", error);
        return res.status(500).json({ error: error.message });
      }
    },
  
    saveConfig: async (req, res) => {
      try {
        const result = await GoogleMerchantConfigService.saveConfig(req.body);
        console.log("Config saved:", result);
        return res.json(result);
      } catch (error) {
        console.error("saveConfig error:", error);
        return res.status(500).json({ error: error.message });
      }
    },
  
    updateConfig: async (req, res) => {
      try {
        const { config } = req.body;
        if (!config) {
          return res.status(400).json({ error: "Config data is required" });
        }
  
        const result = await GoogleMerchantConfigService.updateConfig(config);
        return res.json(result);
      } catch (error) {
        console.error("updateConfig error:", error);
        return res.status(500).json({ error: error.message });
      }
    },
  
    // Auth Operations
    getAuthUrl: async (_req, res) => {
      try {
        const url = GoogleMerchantAuthService.getAuthorizationUrl();
        return res.json({ url });
      } catch (error) {
        console.error("getAuthUrl error:", error);
        return res.status(500).json({ error: error.message });
      }
    },
  
    handleAuthCallback: async (req, res) => {
      try {
        const { code } = req.query;
        if (!code) {
          return res.status(400).json({ error: "Authorization code is required" });
        }
  
        await GoogleMerchantAuthService.exchangeCodeForTokens(code);
        res.redirect(`${process.env.CLIENT_URL}/admin/integrations/google-merchant`);
      } catch (error) {
        console.error("handleAuthCallback error:", error);
        return res.status(500).json({ error: error.message });
      }
    },
  
    revokeToken: async (_req, res) => {
      try {
        const result = await GoogleMerchantAuthService.revokeToken();
        return res.json({ success: result });
      } catch (error) {
        console.error("revokeToken error:", error);
        return res.status(500).json({ error: error.message });
      }
    },
  
    deleteAuth: async (_req, res) => {
      try {
        const result = await GoogleMerchantToken.deleteMany({});
        return res.json({ success: result });
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    },
  
    // Product Sync
    syncAllProducts: async (_req, res) => {
      try {
        const result = await syncAllProducts();
        return res.json(result);
      } catch (error) {
        console.error("syncAllProducts error:", error);
        return res.status(500).json({ error: error.message });
      }
    },
  
    deleteAllProducts: async (_req, res) => {
      try {
        const result = await deleteAllProducts();
        return res.json(result);
      } catch (error) {
        console.error("deleteAllProducts error:", error);
        return res.status(500).json({ error: error.message });
      }
    },
  
    // History
    getSyncHistory: async (req, res) => {
      try {
        const { limit = 10 } = req.query;
        const result = await GoogleMerchantConfigService.getSyncHistory(limit);
        return res.json(result);
      } catch (error) {
        console.error("getSyncHistory error:", error);
        return res.status(500).json({ error: error.message });
      }
    },
  
    clearSyncHistory: async (_req, res) => {
      try {
        const result = await GoogleMerchantConfigService.clearSyncHistory();
        return res.json({ success: result });
      } catch (error) {
        console.error("clearSyncHistory error:", error);
        return res.status(500).json({ error: error.message });
      }
    },
  
    // Feed Management
    createFeed: async (req, res) => {
      try {
        const { name, fetchUrl } = req.body;
        if (!name || !fetchUrl) {
          return res.status(400).json({ error: "Name and fetchUrl are required" });
        }
  
        const result = await createFeed(name, fetchUrl);
        return res.json(result);
      } catch (error) {
        console.error("createFeed error:", error);
        return res.status(500).json({ error: error.message });
      }
    },
  
    listFeeds: async (_req, res) => {
      try {
        const result = await listFeeds();
        return res.json(result);
      } catch (error) {
        console.error("listFeeds error:", error);
        return res.status(500).json({ error: error.message });
      }
    }
  };
  
  export default GoogleMerchantController;
  
