import mongoose from "mongoose";
import fetch from "node-fetch"; // Or remove this line if using global fetch in Node 18+
import GoogleMerchantConfig from "../../model/GoogleMerchantConfig.js";

// Define the token schema
const tokenSchema = new mongoose.Schema(
  {
    access_token: String,
    refresh_token: String,
    expires_at: Number,
    token_type: String,
    scope: String,
  },
  { timestamps: true }
);

const GoogleMerchantToken =
  mongoose.models.GoogleMerchantToken ||
  mongoose.model("GoogleMerchantToken", tokenSchema);

// OAuth2 configuration
const OAUTH_CONFIG = {
  client_id: process.env.GOOGLE_CLIENT_ID || "",
  client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
  redirect_uri: `${process.env.SERVER_URL}/api/google-merchant/auth/callback`,
  token_uri: "https://oauth2.googleapis.com/token",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  scopes: ["https://www.googleapis.com/auth/content"],
};

// Get the authorization URL
export function getAuthorizationUrl() {
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

// Exchange auth code for tokens
export async function exchangeCodeForTokens(code) {
  const params = new URLSearchParams({
    client_id: OAUTH_CONFIG.client_id,
    client_secret: OAUTH_CONFIG.client_secret,
    code,
    grant_type: "authorization_code",
    redirect_uri: OAUTH_CONFIG.redirect_uri,
  });

  const response = await fetch(OAUTH_CONFIG.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to exchange code: ${errorData}`);
  }

  const data = await response.json();
  const expiresAt = Date.now() + data.expires_in * 1000;

  await GoogleMerchantToken.deleteMany({});
  await GoogleMerchantToken.create({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: expiresAt,
    token_type: data.token_type,
    scope: data.scope,
  });

  return { ...data, expires_at: expiresAt };
}

// Refresh access token
export async function refreshAccessToken(refreshToken) {
  const params = new URLSearchParams({
    client_id: OAUTH_CONFIG.client_id,
    client_secret: OAUTH_CONFIG.client_secret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(OAUTH_CONFIG.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to refresh token: ${errorData}`);
  }

  const data = await response.json();
  const expiresAt = Date.now() + data.expires_in * 1000;

  const token = await GoogleMerchantToken.findOne();
  if (token) {
    token.access_token = data.access_token;
    token.expires_at = expiresAt;
    await token.save();
  }

  return { ...data, refresh_token: refreshToken, expires_at: expiresAt };
}

// Retrieve valid token (refresh if needed)
export async function getGoogleMerchantToken() {
  const token = await GoogleMerchantToken.findOne();
  if (!token) return null;

  console.log(
    "Found token in database, expires at:",
    new Date(token?.expires_at || 0).toISOString()
  );

  if (token?.expires_at < Date.now() + 5 * 60 * 1000) {
    console.log("Token is expired or about to expire, refreshing...");

    if (!token?.refresh_token) {
      console.log("No refresh token available");
      return null;
    }

    return await refreshAccessToken(token?.refresh_token);
  }

  console.log("Token is valid");
  return token;
}

// Validate merchant ID
export async function validateMerchantId(merchantId) {
  try {
    const token = await getGoogleMerchantToken();
    if (!token?.access_token) {
      throw new Error("No valid token available");
    }

    const headers = {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
    };

    const url = `https://www.googleapis.com/content/v2/${merchantId}/products`;
    const response = await fetch(url, { method: "GET", headers });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Merchant ID validation failed: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error("Merchant ID validation error:", error);
    throw error;
  }
}

// Set merchant ID in config
export async function setMerchantId(merchantId) {
  try {
    await validateMerchantId(merchantId);

    const config = await GoogleMerchantConfig.findOne();
    if (!config) throw new Error("No configuration found");

    config.merchantId = merchantId;
    await config.save();

    return { success: true, message: "Merchant ID updated successfully" };
  } catch (error) {
    throw new Error(`Failed to set merchant ID: ${error.message}`);
  }
}

// Is authenticated
export async function isAuthenticated() {
  const token = await getGoogleMerchantToken();
  return !!(token && token.access_token);
}

// Revoke token
export async function revokeToken() {
  const token = await GoogleMerchantToken.findOne();
  if (token && token.access_token) {
    const params = new URLSearchParams({ token: token.access_token });
    await fetch(`https://oauth2.googleapis.com/revoke?${params}`, {
      method: "POST",
    });
  }

  await GoogleMerchantToken.deleteMany({});
  return true;
}

// Delete token manually
export async function deleteGoogleMerchantAuth() {
  try {
    await GoogleMerchantToken.deleteMany({});
    return { success: true, message: "Authentication deleted successfully" };
  } catch (error) {
    throw new Error("Failed to delete authentication");
  }
}
