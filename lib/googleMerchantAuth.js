import  GoogleMerchantConfig from "../model/GoogleMerchantConfig.js";
import  GoogleMerchantSyncHistory from "../model/GoogleMerchantSyncHistory.js";
import GoogleMerchantToken from "../model/GoogleMerchantToken.js";

// OAuth2 configuration
const OAUTH_CONFIG = {
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirect_uri: `${process.env.SERVER_URL}/api/google-merchant/auth/callback`,
    token_uri: "https://oauth2.googleapis.com/token",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    scopes: ["https://www.googleapis.com/auth/content"],
};

class GoogleMerchantAuthService {
    // Get the authorization URL
    static getAuthorizationUrl() {
        const params = new URLSearchParams({
            client_id: OAUTH_CONFIG.client_id,
            redirect_uri: OAUTH_CONFIG.redirect_uri,
            response_type: "code",
            scope: OAUTH_CONFIG.scopes.join(" "),
            access_type: "offline",
            prompt: "consent",
        });

        return `${OAUTH_CONFIG.auth_uri}?${params.toString()}`;
    }

    // Exchange authorization code for tokens
    static async exchangeCodeForTokens(code) {
        const params = new URLSearchParams({
            client_id: OAUTH_CONFIG.client_id,
            client_secret: OAUTH_CONFIG.client_secret,
            code,
            grant_type: "authorization_code",
            redirect_uri: OAUTH_CONFIG.redirect_uri,
        });

        const response = await fetch(OAUTH_CONFIG.token_uri, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("Token exchange error:", errorData);
            throw new Error(
                `Failed to exchange code for tokens: ${response.statusText}`,
            );
        }

        const data = await response.json();
        console.log("Token exchange successful, received tokens");

        // Calculate expiration time
        const expiresAt = Date.now() + data.expires_in * 1000;

        // Clear any existing tokens
        await GoogleMerchantToken.deleteMany({});

        // Save new token
        await GoogleMerchantToken.create({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: expiresAt,
            token_type: data.token_type,
            scope: data.scope,
        });

        return {
            ...data,
            expires_at: expiresAt,
        };
    }

    // Refresh access token
    static async refreshAccessToken(refreshToken) {
        console.log("Refreshing access token...");

        const params = new URLSearchParams({
            client_id: OAUTH_CONFIG.client_id,
            client_secret: OAUTH_CONFIG.client_secret,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        });

        const response = await fetch(OAUTH_CONFIG.token_uri, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("Token refresh error:", errorData);
            throw new Error(
                `Failed to refresh access token: ${response.statusText}`,
            );
        }

        const data = await response.json();
        console.log("Token refresh successful");

        // Calculate expiration time
        const expiresAt = Date.now() + data.expires_in * 1000;

        // Update token in database
        const token = await GoogleMerchantToken.findOne();
        if (token) {
            token.access_token = data.access_token;
            token.expires_at = expiresAt;
            await token.save();
            console.log("Updated token in database");
        }

        return {
            ...data,
            refresh_token: refreshToken, // Keep the existing refresh token
            expires_at: expiresAt,
        };
    }

    // Get a valid token (refresh if necessary)
    static async getValidToken() {
        try {
            const token = await GoogleMerchantToken.findOne().lean();

            if (!token) {
                console.log("No token found in database");
                return null;
            }

            console.log(
                "Found token in database, expires at:",
                new Date(token?.expires_at || 0).toISOString(),
            );

            // Check if token is expired or about to expire (within 5 minutes)
            if (token?.expires_at < Date.now() + 5 * 60 * 1000) {
                console.log(
                    "Token is expired or about to expire, refreshing...",
                );

                if (!token?.refresh_token) {
                    console.log("No refresh token available");
                    return null;
                }

                return await this.refreshAccessToken(token?.refresh_token);
            }

            console.log("Token is valid");
            return token;
        } catch (error) {
            console.error("Error getting Google Merchant token:", error);
            return null;
        }
    }

    // Check if we have a valid token
    static async isAuthenticated() {
        try {
            const token = await this.getValidToken();
            return !!token && !!token.access_token;
        } catch (error) {
            console.error("Error checking authentication status:", error);
            return false;
        }
    }

    // Revoke token and clear from database
    static async revokeToken() {
        try {
            const token = await GoogleMerchantToken.findOne();

            if (!token) {
                console.log("No token found to revoke");
                return true; // Already no token
            }

            if (token?.access_token) {
                const params = new URLSearchParams({
                    token: token?.access_token,
                });

                try {
                    const response = await fetch(
                        `https://oauth2.googleapis.com/revoke?${params.toString()}`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/x-www-form-urlencoded",
                            },
                        },
                    );

                    if (!response.ok) {
                        console.warn(
                            "Token revocation API returned an error:",
                            await response.text(),
                        );
                    } else {
                        console.log(
                            "Token successfully revoked via Google API",
                        );
                    }
                } catch (revokeError) {
                    console.warn(
                        "Error calling revoke API, will still delete local token:",
                        revokeError,
                    );
                }
            }

            // Delete the token from the database
            const deleteResult = await GoogleMerchantToken.deleteMany({});
            console.log(
                `Deleted ${deleteResult.deletedCount} token records from database`,
            );

            return true;
        } catch (error) {
            console.error("Error in revokeToken function:", error);
            return false;
        }
    }

    // Get headers with authorization
    static async getAuthHeaders() {
        const token = await this.getValidToken();

        if (!token || !token?.access_token) {
            throw new Error("Not authenticated with Google Merchant Center");
        }

        return {
            Authorization: `Bearer ${token?.access_token}`,
            "Content-Type": "application/json",
        };
    }
}

export default  GoogleMerchantAuthService;

// services/googleMerchantConfig.js
class GoogleMerchantConfigService {
    // Get the configuration
    static async getConfig() {
        const config = await GoogleMerchantConfig.findOne().lean();

        if (!config) {
            return this.getDefaultConfig();
        }

        // Check if we're authenticated with Google
        const authenticated = await GoogleMerchantAuthService.isAuthenticated();

        return {
            ...config,
            isConnected: authenticated,
        };
    }

    // Save or update the configuration
    static async saveConfig(configData) {
        const existingConfig = await GoogleMerchantConfig.findOne();

        if (existingConfig) {
            // Update existing config
            Object.assign(existingConfig, configData);
            await existingConfig.save();
            return existingConfig.toObject();
        } else {
            // Create new config
            const newConfig = new GoogleMerchantConfig({
                ...this.getDefaultConfig(),
                ...configData,
            });
            console.log("New config created:", newConfig.toObject());
            await newConfig.save();
            return newConfig.toObject();
        }
    }

    // Update Google Merchant configuration
    static async updateConfig(configData) {
        return this.saveConfig(configData);
    }

    // Get default configuration
    static getDefaultConfig() {
        return {
            merchantId: "",
            isConnected: false,
            autoSync: false,
            syncFrequency: "daily",
            syncTime: "00:00",
            defaultCurrency: "USD",
            defaultCountry: "US",
            defaultLanguage: "en",
            attributeMapping: {
                id: "_id",
                title: "name",
                description: "description",
                link: "slug",
                imageLink: "thumbnail",
                availability: "stock",
                price: "price",
                brand: "brand",
                gtin: "barcode",
                mpn: "sku",
                condition: "new",
            },
            defaultShipping: {
                service: "Standard Shipping",
                price: 0,
                currency: "USD",
            },
            defaultTax: {
                rate: 0,
                country: "US",
                region: "",
            },
            lastSyncDate: null,
            lastSyncStats: null,
        };
    }

    // Add sync history entry
    static async addSyncHistoryEntry(entry) {
        const historyEntry = new GoogleMerchantSyncHistory({
            syncDate: new Date(),
            ...entry,
        });

        await historyEntry.save();

        // Update last sync stats in config
        await GoogleMerchantConfig.findOneAndUpdate(
            {},
            {
                lastSyncDate: new Date(),
                lastSyncStats: {
                    totalProducts: entry.totalProducts,
                    successCount: entry.successCount,
                    errorCount: entry.errorCount || entry.failureCount,
                    deletedCount: entry.deletedCount || 0,
                    syncDate: new Date(),
                },
            },
        );
    }

    // Get sync history
    static async getSyncHistory(limit = 10) {
        const history = await GoogleMerchantSyncHistory.find()
            .sort({ syncDate: -1 })
            .limit(limit)
            .lean();

        return history;
    }

    // Clear sync history
    static async clearSyncHistory() {
        try {
            await GoogleMerchantSyncHistory.deleteMany({});
            return true;
        } catch (error) {
            console.error("Error clearing sync history:", error);
            return false;
        }
    }
}

const validateMerchantId = async (merchantId) => {
    if (!merchantId) throw new Error("Merchant ID is required");
  
    // maybe hit Google's API to verify it, or just do a basic format check
    const isValid = /^[0-9]+$/.test(merchantId);
    if (!isValid) throw new Error("Invalid Merchant ID format");
  
    return true;
  };
  
  const setMerchantId = async (merchantId) => {
    const config = await GoogleMerchantConfig.findOne();
    if (config) {
      config.merchantId = merchantId;
      await config.save();
      return config.toObject();
    } else {
      const newConfig = new GoogleMerchantConfig({ merchantId });
      await newConfig.save();
      return newConfig.toObject();
    }
  };

  export {
    GoogleMerchantAuthService,
    GoogleMerchantConfigService,
    validateMerchantId,
    setMerchantId,
  };
