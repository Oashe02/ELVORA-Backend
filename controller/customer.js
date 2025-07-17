const Customer = require('../model/Customer');
const Enquiry = require('../model/Enquiry');

const moment = require('moment'); // Ensure moment.js is installed

export const getAllCustomer = async (req, res) => {
	try {
		const { siteName } = req.params;
		const { page = 1, limit = 10 } = req.query; // Default page to 1 and limit to 10 if not provided

		// Convert page and limit to integers
		const pageNum = parseInt(page, 10);
		const limitNum = parseInt(limit, 10);

		// MongoDB aggregation pipeline
		const enquiries = await Customer.aggregate([
			{
				$match: { siteName }, // Filter enquiries by siteName
			},
			{
				$facet: {
					data: [
						{ $skip: (pageNum - 1) * limitNum }, // Skip documents for pagination
						{ $limit: limitNum }, // Limit the number of results per page
					],
					totalCount: [
						{ $count: 'count' }, // Count total documents for this query
					],
				},
			},
		]);

		// Ensure totalCount is returned or set to 0 if no data is found
		const totalCount =
			enquiries[0].totalCount.length > 0 ? enquiries[0].totalCount[0].count : 0;

		return res.json({
			error: false,
			message: 'cusomters',
			payload: {
				docs: enquiries[0].data,
				totalCount,
				page: pageNum,
				limit: limitNum,
				totalPages: Math.ceil(totalCount / limitNum),
			},
		});
	} catch (error) {
		return res.status(500).json({ error: true, message: error.message });
	}
};

// Create a new customer
export const createCustomer = async (req, res) => {
	try {
		const { name, email, phoneNumber, source, siteName, status } = req.body;

		const newCustomer = new Customer({
			name,
			email,
			phoneNumber,
			source,
			siteName,
			status: status || 'PENDING', // Default to 'PENDING' if not provided
		});

		const savedCustomer = await newCustomer.save();
		res.status(201).json(savedCustomer);
	} catch (error) {
		console.error('Error creating customer:', error);
		res.status(500).json({ message: 'Failed to create customer.' });
	}
};

// Update an existing customer by ID
export const updateCustomer = async (req, res) => {
	const { id } = req.params;
	const updates = req.body;

	try {
		const updatedCustomer = await Customer.findByIdAndUpdate(id, updates, {
			new: true,
		});

		if (!updatedCustomer) {
			return res.status(404).json({ message: 'Customer not found.' });
		}

		res.status(200).json(updatedCustomer);
	} catch (error) {
		console.error('Error updating customer:', error);
		res.status(500).json({ message: 'Failed to update customer.' });
	}
};

// Delete a customer by ID
export const deleteCustomer = async (req, res) => {
	const { id } = req.params;

	try {
		const deletedCustomer = await Customer.findByIdAndDelete(id);

		if (!deletedCustomer) {
			return res.status(404).json({ message: 'Customer not found.' });
		}

		res.status(200).json({ message: 'Customer deleted successfully.' });
	} catch (error) {
		console.error('Error deleting customer:', error);
		res.status(500).json({ message: 'Failed to delete customer.' });
	}
};
