import { Resend } from 'resend';
import  Contact from '../model/Contact.js';

const resend = new Resend(process.env.RESEND_API_KEY || '');

export const submitContactForm = async (req, res) => {
	try {
		const { name, email, message } = req.body;

		// Validate required fields
		if (!name || !email || !message) {
			return res.status(400).json({
				success: false,
				error: 'Name, email, and message are all required',
			});
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({
				success: false,
				error: 'Invalid email format',
			});
		}

		// 1. Save to database
		const contact = await Contact.create({
			name,
			email,
			message,
			status: 'new',
		});

		// 2. Send notification email
		if (process.env.RESEND_API_KEY) {
			await resend.emails.send({
				from: 'Notification <noreply@controlshift.ae>',
				to: ['alamraza812@gmail.com'],
				subject: `New Contact Form Submission from ${name}`,
				html: `
          <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; padding:20px; border:1px solid #eaeaea; border-radius:5px;">
            <h1 style="color:#333; border-bottom:1px solid #eaeaea; padding-bottom:10px;">New Contact Submission</h1>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <pre style="white-space:pre-wrap; background:#fff; padding:10px; border:1px solid #eee; border-radius:3px;">${message}</pre>
            <p>You can view all submissions in your admin dashboard.</p>
          </div>
        `,
			});
		}

		return res.json({
			success: true,
			message: 'Your message has been sent successfully!',
		});
	} catch (err) {
		console.error('submitContactForm error:', err);
		return res.status(500).json({
			success: false,
			error: 'Internal Server Error',
		});
	}
};


export const getContacts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    // Convert query params to numbers
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid page or limit value',
      });
    }

    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};

    if (status) {
      if (!['new', 'read', 'replied'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status value',
        });
      }
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    // Fetch contacts and total count
    const [contacts, totalContacts] = await Promise.all([
      Contact.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Contact.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalContacts / limitNum);

    return res.json({
      success: true,
      data: {
        contacts,
        totalContacts,
        totalPages,
        currentPage: pageNum,
      },
    });
  } catch (err) {
    console.error('getContacts error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
    });
  }
};

export const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['new', 'read', 'replied'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value',
      });
    }

    // Update contact status
    const contact = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found',
      });
    }

    return res.json({
      success: true,
      data: contact,
    });
  } catch (err) {
    console.error('updateContactStatus error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
    });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete contact
    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found',
      });
    }

    return res.json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (err) {
    console.error('deleteContact error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
    });
  }
};