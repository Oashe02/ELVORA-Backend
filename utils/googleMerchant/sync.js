import mongoose from "mongoose";
const { v4: uuidv4 } = require('uuid');
const { syncAllProducts } = require('./api');
const {
	getGoogleMerchantConfig,
	updateGoogleMerchantConfig,
	saveGoogleMerchantConfig,
	addSyncHistoryEntry,
} = require('./config');

// Define the sync history schema
const syncHistorySchema = new mongoose.Schema(
	{
		id: String,
		date: Date,
		status: {
			type: String,
			enum: ['success', 'partial', 'failed'],
		},
		totalProducts: Number,
		successCount: Number,
		failureCount: Number,
		deletedCount: Number,
		errors: [
			{
				productId: String,
				productTitle: String,
				error: String,
			},
		],
		duration: Number,
	},
	{ timestamps: true }
);

// Get the sync history model (or create it if it doesn't exist)
const SyncHistory = mongoose.model(
	'GoogleMerchantSyncHistory',
	syncHistorySchema
);

// Run a sync and record the history
export async function runSync() {
	const startTime = Date.now();

	try {
		// Run the sync
		const result = await syncAllProducts();

		// Calculate duration
		const duration = Date.now() - startTime;

		// Determine status
		let status = 'failed';
		if (result.success && result.failureCount === 0) {
			status = 'success';
		} else if (result.success && result.successCount > 0) {
			status = 'partial';
		}

		// Create history entry
		const historyEntry = {
			id: uuidv4(),
			date: new Date(),
			status,
			totalProducts: result.totalProducts,
			successCount: result.successCount,
			failureCount: result.failureCount,
			deletedCount: result.deletedCount || 0,
			errors: result.errors,
			duration,
		};

		// Save to database
		await SyncHistory.create(historyEntry);

		// Update last sync date in config
		const config = await getGoogleMerchantConfig();
		if (config) {
			await updateGoogleMerchantConfig({
				...config,
				lastSyncDate: new Date(),
			});
		}

		return result;
	} catch (error) {
		// Calculate duration
		const duration = Date.now() - startTime;

		// Create failed history entry
		const historyEntry = {
			id: uuidv4(),
			date: new Date(),
			status: 'failed',
			totalProducts: 0,
			successCount: 0,
			failureCount: 0,
			deletedCount: 0,
			errors: [
				{
					productId: 'system',
					productTitle: 'System Error',
					error: error instanceof Error ? error.message : String(error),
				},
			],
			duration,
		};

		// Save to database
		await SyncHistory.create(historyEntry);

		return {
			success: false,
			message: `Sync failed: ${
				error instanceof Error ? error.message : String(error)
			}`,
			totalProducts: 0,
			successCount: 0,
			failureCount: 0,
			deletedCount: 0,
			errors: [
				{
					productId: 'system',
					productTitle: 'System Error',
					error: error instanceof Error ? error.message : String(error),
				},
			],
		};
	}
}

// Get sync history
export async function getSyncHistory(limit = 10) {
	const history = await SyncHistory.find()
		.sort({ date: -1 })
		.limit(limit)
		.lean();

	return history;
}

// Get a specific sync history entry
export async function getSyncHistoryEntry(id) {
	const entry = await SyncHistory.findOne({ id }).lean();

	return entry;
}

// Delete sync history
export async function clearSyncHistory() {
	try {
		await SyncHistory.deleteMany({});
		return true;
	} catch (error) {
		console.error('Error clearing sync history:', error);
		return false;
	}
}

// Sync products with Google Merchant Center
export async function syncWithGoogleMerchant(source = 'manual') {
	try {
		console.log(`Starting Google Merchant sync (source: ${source})`);

		// Get the current configuration
		const config = await getGoogleMerchantConfig();
		if (!config || !config.merchantId) {
			throw new Error('Google Merchant configuration not found or incomplete');
		}

		console.log(`Using merchant ID: ${config.merchantId}`);

		// Direct API sync approach
		console.log('Calling syncAllProducts');
		const syncResult = await syncAllProducts();
		console.log('Sync result:', syncResult);

		// Update feed URL if needed
		let feedUrl = config.feedUrl;
		if (!feedUrl) {
			// Generate the product feed URL
			feedUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/google-merchant/feed`;
			console.log(`Setting feed URL to: ${feedUrl}`);
		}

		// Create sync result
		const result = {
			success: syncResult.success,
			totalProducts: syncResult.totalProducts,
			successCount: syncResult.successCount,
			errorCount: syncResult.failureCount,
			deletedCount: syncResult.deletedCount || 0,
			errors: syncResult.errors?.map((e) => ({
				productId: e.productId,
				message: e.error,
			})),
			feedUrl,
			syncDate: new Date(),
		};

		console.log('Updating configuration with sync result');
		// Update the configuration with the sync result
		await saveGoogleMerchantConfig({
			lastSyncDate: new Date(),
			feedUrl,
			lastSyncStats: {
				totalProducts: result.totalProducts,
				successCount: result.successCount,
				errorCount: result.errorCount,
				deletedCount: result.deletedCount || 0,
				syncDate: new Date(),
			},
		});

		console.log('Adding sync history entry');
		// Add to sync history
		await addSyncHistoryEntry({
			success: result.success,
			totalProducts: result.totalProducts,
			successCount: result.successCount,
			errorCount: result.errorCount,
			deletedCount: result.deletedCount || 0,
			source,
			errors: result.errors,
		});

		console.log('Sync completed successfully');
		return result;
	} catch (error) {
		console.error('Error syncing with Google Merchant:', error);

		const errorResult = {
			success: false,
			totalProducts: 0,
			successCount: 0,
			errorCount: 1,
			deletedCount: 0,
			errors: [
				{
					productId: 'unknown',
					message: error.message || 'Unknown error occurred',
				},
			],
			syncDate: new Date(),
		};

		// Add to sync history
		try {
			await addSyncHistoryEntry({
				success: false,
				totalProducts: 0,
				successCount: 0,
				errorCount: 1,
				deletedCount: 0,
				source,
				errors: errorResult.errors,
			});
		} catch (e) {
			console.error('Error saving sync history:', e);
		}

		return errorResult;
	}
}

// Validate products against Google Merchant requirements
export async function validateProductsForGoogleMerchant() {
	// In a real implementation, you would:
	// 1. Generate the product feed
	// 2. Use Google's Content API to validate the products
	// 3. Return validation results

	// For this example, we'll return a simulated validation result
	return {
		valid: true,
		issues: [],
	};
}

// Schedule sync based on configuration
export async function scheduleSync() {
	const config = await getGoogleMerchantConfig();

	if (!config || !config.autoSync) {
		return false;
	}

	// Implement scheduling logic here
	// For the demo, you might want to use a background job or serverless function
	// In a real implementation, you would use a more robust solution like cron jobs

	return true;
}
