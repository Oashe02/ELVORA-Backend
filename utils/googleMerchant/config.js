import GoogleMerchantConfig from "../../model/GoogleMerchantConfig.js";

export async function getGoogleMerchantConfig() {
    return await GoogleMerchantConfig.findOne().lean();
}

export async function saveGoogleMerchantConfig(cfg) {
    let existing = await GoogleMerchantConfig.findOne();
    if (existing) {
        Object.assign(existing, cfg);
        await existing.save();
        return existing.toObject();
    } else {
        const newCfg = new GoogleMerchantConfig({
            ...getDefaultConfig(),
            ...cfg,
        });
        console.log("New config created:", newCfg.toObject());
        await newCfg.save();
        return newCfg.toObject();
    }
}

export async function updateGoogleMerchantConfig(cfg) {
    return saveGoogleMerchantConfig(cfg);
}

export async function addSyncHistoryEntry(entry) {
    const historyEntry = new SyncHistoryModel({
        syncDate: new Date(),
        ...entry,
    });
    await historyEntry.save();

    await GoogleMerchantConfig.findOneAndUpdate(
        {},
        {
            lastSyncDate: new Date(),
            lastSyncStats: {
                totalProducts: entry.totalProducts,
                successCount: entry.successCount,
                errorCount: entry.errorCount,
                syncDate: new Date(),
            },
        }
    );
}

export async function getSyncHistory(limit = 10) {
    return await SyncHistoryModel.find()
        .sort({ syncDate: -1 })
        .limit(limit)
        .lean();
}

export function getDefaultConfig() {
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
        defaultTax: { rate: 0, country: "US", region: "" },
    };
}

export async function updateTokens(accessToken, refreshToken, expiresIn) {
    const update = { accessToken, isConnected: true };
    if (refreshToken) update.refreshToken = refreshToken;
    if (expiresIn) {
        const expiry = new Date();
        expiry.setSeconds(expiry.getSeconds() + expiresIn - 300);
        update.tokenExpiry = expiry;
    }
    await GoogleMerchantConfig.findOneAndUpdate({}, update);
}

export async function getConfig() {
    const cfg = await GoogleMerchantConfig.findOne().lean();
    if (!cfg) {
        return {
            ...getDefaultConfig(),
            lastSyncDate: null,
            lastSyncStats: null,
        };
    }
    return { ...cfg };
}
