/**
 * Generate order confirmation email for customer
 * @param {Object} order - Order data
 * @param {Object} profile - Customer profile data
 * @returns {string} - HTML email content
 */
export const generateOrderConfirmationEmail = (order, profile) => {
    const formatPrice = (price) => {
        return typeof price === "number"
            ? price.toLocaleString("en-AE", {
                  style: "currency",
                  currency: "AED",
              })
            : price;
    };

    const productList = order.products
        .map(
            (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
            <span style="color: #333; font-size: 14px;">${item.name}</span>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: center;">
            <span style="color: #333; font-size: 14px;">x${item.quantity}</span>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">
            <span style="color: #333; font-size: 14px; font-weight: 500;">${formatPrice(item.subtotal)}</span>
          </td>
        </tr>
      `,
        )
        .join("");

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f8f8f8; 
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background-color: #ffffff; 
          border-radius: 8px; 
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); 
        }
        .header { 
          background-color: #ffffff;
          text-align: center; 
          padding: 30px 20px 20px 20px; 
          border-bottom: 1px solid #eaeaea; 
        }
        .company-name {
          font-size: 24px;
          font-weight: 700;
          color: #333;
          margin: 0 0 10px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .content { 
          padding: 30px 40px; 
          background-color: #ffffff;
        }
        .greeting {
          font-size: 16px;
          color: #333;
          margin-bottom: 10px;
        }
        .message {
          font-size: 14px;
          color: #666;
          margin-bottom: 20px;
          line-height: 1.5;
        }
        .shipping-details {
          background-color: #ffffff;
          margin: 25px 0;
          padding: 0;
        }
        .shipping-info {
          font-size: 14px;
          color: #333;
          margin: 8px 0;
        }
        .order-summary-title {
          font-size: 20px;
          font-weight: 600;
          color: #333;
          text-align: center;
          margin: 30px 0 20px 0;
        }
        .order-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .summary-row {
          border-top: 1px solid #f0f0f0;
        }
        .summary-row.total {
          border-top: 2px solid #333;
          font-weight: 600;
        }
        .summary-cell {
          padding: 12px 0;
          font-size: 14px;
          color: #333;
        }
        .view-order-btn {
          display: inline-block;
          background-color: #333;
          color: white;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 4px;
          margin: 20px auto;
          display: block;
          text-align: center;
          font-weight: 500;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .footer-message {
          font-size: 14px;
          color: #666;
          margin: 25px 0 10px 0;
          line-height: 1.5;
        }
        .signature {
          font-size: 14px;
          color: #333;
          margin: 20px 0 5px 0;
        }
        .footer { 
          background-color: #f8f8f8;
          text-align: center; 
          padding: 30px 20px; 
          border-top: 1px solid #eaeaea; 
        }
        .social-icons {
          margin: 20px 0;
        }

          .social-icon {
          display: inline-block;
           margin: 0 8px;
           width: 36px;
           height: 36px;
           border-radius: 6px;
           text-decoration: none;
            color: white;
           line-height: 36px;
           font-size: 16px;
          font-weight: bold;
          transition: opacity 0.3s ease;
        }
          .social-icon:hover {
  opacity: 0.8;
}
.facebook {
  background-color: #1877F2;
}
.twitter {
  background-color: #1DA1F2;
}
.instagram {
  background: linear-gradient(45deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D, #F56040, #F77737, #FCAF45, #FFDC80);
}
        .footer-text {
          color: #666; 
          font-size: 12px;
          margin: 5px 0;
        }
        @media only screen and (max-width: 600px) { 
          .container { 
            margin: 10px; 
            border-radius: 0;
          }
          .content {
            padding: 20px;
          }
          .company-name {
            font-size: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="company-name">Perfum.com</h1>
        </div>
        <div class="content">
          <p class="greeting">Hey ${profile.firstName},</p>
          <p class="message">Your order <strong>${order.orderId}</strong> has been received and is currently being processed.</p>
          
          <div class="shipping-details">
            <p class="shipping-info"><strong>Shipping Details:</strong></p>
            <p class="shipping-info">${profile.firstName} ${profile.lastName}</p>
            <p class="shipping-info">${profile.address || "Address not provided"}</p>
            <p class="shipping-info">${profile.phone || "Phone not provided"}</p>
            <p class="shipping-info">${profile.city || "Dubai"}</p>
            <p class="shipping-info"><strong>Payment:</strong> ${order.paymentStatus}</p>
            <p class="shipping-info"><strong>Delivery by:</strong> ${order.deliveryDate || "TBD"}</p>
          </div>

          <h2 class="order-summary-title">Order Summary</h2>
          
          <table class="order-table">
            ${productList}
            <tr class="summary-row">
              <td class="summary-cell" colspan="2">Subtotal</td>
              <td class="summary-cell" style="text-align: right;">${formatPrice(order.subtotal)}</td>
            </tr>
            <tr class="summary-row">
              <td class="summary-cell" colspan="2">Shipping & Handling</td>
              <td class="summary-cell" style="text-align: right;">${formatPrice(order.shippingCharge)}</td>
            </tr>
            ${
                order.discount
                    ? `
            <tr class="summary-row">
              <td class="summary-cell" colspan="2">Discount</td>
              <td class="summary-cell" style="text-align: right;">-${formatPrice(order.discount)}</td>
            </tr>
            `
                    : ""
            }
            ${
                order.tax
                    ? `
            <tr class="summary-row">
              <td class="summary-cell" colspan="2">Tax</td>
              <td class="summary-cell" style="text-align: right;">${formatPrice(order.tax)}</td>
            </tr>
            `
                    : ""
            }
            <tr class="summary-row total">
              <td class="summary-cell" colspan="2"><strong>Grand Total</strong></td>
              <td class="summary-cell" style="text-align: right;"><strong>${formatPrice(order.total)}</strong></td>
            </tr>
          </table>

          <a href="https://Perfum.com//dashboard" class="view-order-btn">VIEW ORDER</a>
          <p class="footer-message">We'll let you know when your order is on its way.<br>Contact us in case you have any queries.</p>
          
          <p class="signature">Thanks,<br>PerFum Team</p>
        </div>
        <div class="footer">
          <div class="social-icons">
            <a href="https://Perfum.com/" class="social-icon facebook">f</a>
            <a href="https://Perfum.com/" class="social-icon twitter">𝕏</a>
            <a href="https://www.instagram.com/PerFum" class="social-icon instagram">ⓘ</a>
          </div>
          <p class="footer-text">© ${new Date().getFullYear()} Perfum.com. All rights reserved.</p>
          <p class="footer-text">Dubai, UAE</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate order notification email for admin
 * @param {Object} order - Order data
 * @param {Object} profile - Customer profile data
 * @returns {string} - HTML email content
 */
export const generateAdminNotificationEmail = (order, profile) => {
    const formatPrice = (price) => {
        return typeof price === "number"
            ? price.toLocaleString("en-AE", {
                  style: "currency",
                  currency: "AED",
              })
            : price;
    };

    const productList = order.products
        .map(
            (item) => `
        <div class="booking-item">
          <span class="booking-label">${item.name}</span>
          <span class="booking-quantity">Qty: ${item.quantity}</span>
          <span class="booking-value">${formatPrice(item.subtotal)}</span>
        </div>
      `,
        )
        .join("");

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Order Notification</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 20px; 
          background-color: #f5f5f5;
        }
        .container { 
          max-width: 700px; 
          margin: 0 auto; 
          background-color: #ffffff; 
          border-radius: 8px; 
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header { 
          background-color: #333;
          color: white; 
          padding: 30px 40px;
          text-align: center;
        }
        .company-name {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 10px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .alert-badge {
          background-color: #e74c3c;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: inline-block;
        }
        .content { 
          padding: 40px; 
        }
        .intro-message {
          font-size: 16px;
          color: #555;
          margin-bottom: 30px;
          text-align: center;
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 6px;
          border-left: 4px solid #333;
        }
        .booking-details, .customer-details { 
          background-color: #ffffff;
          border: 1px solid #ddd;
          border-radius: 6px;
          margin: 25px 0; 
          overflow: hidden;
        }
        .section-title { 
          font-weight: 700; 
          font-size: 16px;
          color: #fff;
          background-color: #333;
          padding: 15px 20px;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .section-content {
          padding: 20px;
        }
        .booking-item { 
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #eee;
        }
        .booking-item:last-child {
          border-bottom: none;
          font-weight: 600;
          background-color: #f8f9fa;
          margin: 10px -20px -20px -20px;
          padding: 15px 20px;
        }
        .booking-label { 
          font-weight: 600; 
          color: #333;
          flex: 1;
        }
        .booking-quantity {
          color: #666;
          font-size: 14px;
          margin: 0 15px;
        }
        .booking-value { 
          color: #333;
          font-weight: 500;
          text-align: right;
        }
        .customer-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #eee;
        }
        .customer-item:last-child {
          border-bottom: none;
        }
        .customer-label {
          font-weight: 600;
          color: #333;
          min-width: 100px;
        }
        .customer-value {
          color: #333;
          font-weight: 500;
          text-align: right;
        }
        .action-message {
          background-color: #fff3cd;
          color: #856404;
          padding: 20px;
          border-radius: 6px;
          text-align: center;
          margin: 30px 0;
          font-weight: 600;
          border: 1px solid #ffeaa7;
        }
        .footer { 
          background-color: #f8f9fa;
          text-align: center; 
          padding: 30px 40px; 
          border-top: 1px solid #eee;
          color: #666; 
          font-size: 14px; 
        }
        .footer-brand {
          font-weight: 600;
          color: #333;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .status-paid {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        .status-pending {
          background-color: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }
        .status-processing {
          background-color: #cce7ff;
          color: #004085;
          border: 1px solid #99d6ff;
        }
        @media only screen and (max-width: 600px) { 
          body { padding: 10px; }
          .container { border-radius: 6px; }
          .content { padding: 20px; }
          .header { padding: 20px; }
          .company-name { font-size: 20px; }
          .booking-item { 
            flex-direction: column; 
            align-items: flex-start; 
            gap: 5px;
          }
          .booking-value { 
            align-self: flex-end; 
            margin-top: 5px;
          }
          .customer-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
          }
          .customer-value {
            text-align: left;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="company-name">Perfum.com</h1>
          <div class="alert-badge">New Order Alert</div>
        </div>
        <div class="content">
          <div class="intro-message">
            <strong>A new order has been received and requires your attention.</strong>
          </div>
          
          <div class="booking-details">
            <div class="section-title">Order Information</div>
            <div class="section-content">
              <div class="booking-item">
                <span class="booking-label">Order ID:</span>
                <span class="booking-value"><strong>#${order.orderId}</strong></span>
              </div>
              ${productList}
              <div class="booking-item">
                <span class="booking-label">Subtotal:</span>
                <span class="booking-value">${formatPrice(order.subtotal)}</span>
              </div>
              <div class="booking-item">
                <span class="booking-label">Discount:</span>
                <span class="booking-value">-${formatPrice(order.discount)}</span>
              </div>
              <div class="booking-item">
                <span class="booking-label">Tax:</span>
                <span class="booking-value">${formatPrice(order.tax)}</span>
              </div>
              <div class="booking-item">
                <span class="booking-label">Shipping:</span>
                <span class="booking-value">${formatPrice(order.shippingCharge)}</span>
              </div>
              <div class="booking-item">
                <span class="booking-label">Grand Total:</span>
                <span class="booking-value"><strong>${formatPrice(order.total)}</strong></span>
              </div>
            </div>
          </div>
          
          <div class="customer-details">
            <div class="section-title">Customer Information</div>
            <div class="section-content">
              <div class="customer-item">
                <span class="customer-label">Name:</span>
                <span class="customer-value"><strong>${profile.firstName} ${profile.lastName}</strong></span>
              </div>
              <div class="customer-item">
                <span class="customer-label">Email:</span>
                <span class="customer-value">${order.user.email}</span>
              </div>
              <div class="customer-item">
                <span class="customer-label">Phone:</span>
                <span class="customer-value">${profile.phone || "Not provided"}</span>
              </div>
              <div class="customer-item">
                <span class="customer-label">Payment:</span>
                <span class="customer-value">
                  <span class="status-badge ${order.paymentStatus === "Paid" ? "status-paid" : "status-pending"}">${order.paymentStatus}</span>
                </span>
              </div>
              <div class="customer-item">
                <span class="customer-label">Status:</span>
                <span class="customer-value">
                  <span class="status-badge status-processing">${order.status}</span>
                </span>
              </div>
            </div>
          </div>
          
          <div class="action-message">
            <strong>Action Required:</strong> Please review and process this order to ensure timely delivery.
          </div>
        </div>
        <div class="footer">
          <div class="footer-brand">© ${new Date().getFullYear()} Perfum.com</div>
          <p>Dubai, UAE • All rights reserved</p>
          <p>This is an automated notification • Please do not reply directly</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate order status update email for customer
 * @param {Object} order - Order data
 * @param {Object} profile - Customer profile data
 * @param {string} previousStatus - Previous order status
 * @returns {string} - HTML email content
 */
export const generateStatusUpdateEmail = (order, profile, previousStatus) => {
    const formatPrice = (price) => {
        return typeof price === "number"
            ? price.toLocaleString("en-AE", {
                  style: "currency",
                  currency: "AED",
              })
            : price;
    };

    let statusMessage = "";
    let statusColor = "#4a6cf7";
    switch (order.status.toLowerCase()) {
        case "confirmed":
            statusMessage =
                "Great news! Your order has been confirmed and is being prepared for shipment.";
            statusColor = "#10b981";
            break;
        case "shipped":
            statusMessage =
                "Your order has been shipped. You'll receive tracking details soon.";
            statusColor = "#3b82f6";
            break;
        case "delivered":
            statusMessage =
                "Your order has been delivered. We hope you enjoy your purchase!";
            statusColor = "#8b5cf6";
            break;
        case "cancelled":
            statusMessage =
                "Your order has been cancelled. Please contact us if this was not intended.";
            statusColor = "#ef4444";
            break;
        default:
            statusMessage = `Your order status has been updated from "${previousStatus}" to "${order.status}".`;
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Status Update</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f8f8f8; 
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background-color: #ffffff; 
          border-radius: 8px; 
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); 
        }
        .header { 
          background-color: #ffffff;
          text-align: center; 
          padding: 30px 20px 20px 20px; 
          border-bottom: 1px solid #eaeaea; 
        }
        .company-name {
          font-size: 24px;
          font-weight: 700;
          color: #333;
          margin: 0 0 10px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .status-badge { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: ${statusColor}; 
          color: white; 
          border-radius: 4px; 
          font-weight: 600; 
          margin: 15px 0;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .content { 
          padding: 30px 40px; 
          background-color: #ffffff;
        }
        .greeting {
          font-size: 16px;
          color: #333;
          margin-bottom: 10px;
        }
        .message {
          font-size: 14px;
          color: #666;
          margin-bottom: 20px;
          line-height: 1.5;
        }
        .order-details {
          background-color: #ffffff;
          margin: 25px 0;
          padding: 0;
        }
        .order-info {
          font-size: 14px;
          color: #333;
          margin: 8px 0;
        }
        .view-order-btn {
          display: inline-block;
          background-color: #333;
          color:#fff;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 4px;
          margin: 20px auto;
          display: block;
          text-align: center;
          font-weight: 500;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .footer-message {
          font-size: 14px;
          color: #666;
          margin: 25px 0 10px 0;
          line-height: 1.5;
        }
        .signature {
          font-size: 14px;
          color: #333;
          margin: 20px 0 5px 0;
        }
        .footer { 
          background-color: #f8f8f8;
          text-align: center; 
          padding: 30px 20px; 
          border-top: 1px solid #eaeaea; 
        }
        .social-icons {
          margin: 20px 0;
        }
        .social-icon {
          display: inline-block;
          margin: 0 8px;
          width: 36px;
          height: 36px;
          border-radius: 6px;
          text-decoration: none;
          color: white;
          line-height: 36px;
          font-size: 16px;
          font-weight: bold;
          transition: opacity 0.3s ease;
        }
        .social-icon:hover {
          opacity: 0.8;
        }
        .facebook {
          background-color: #1877F2;
        }
        .twitter {
          background-color: #1DA1F2;
        }
        .instagram {
          background: linear-gradient(45deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D, #F56040, #F77737, #FCAF45, #FFDC80);
        }
        .footer-text {
          color: #666; 
          font-size: 12px;
          margin: 5px 0;
        }
        @media only screen and (max-width: 600px) { 
          .container { 
            margin: 10px; 
            border-radius: 0;
          }
          .content {
            padding: 20px;
          }
          .company-name {
            font-size: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="company-name">Perfum.com</h1>
          <div class="status-badge">${order.status}</div>
        </div>
        <div class="content">
          <p class="greeting">Hey ${profile.firstName},</p>
          <p class="message">${statusMessage}</p>
          
          <div class="order-details">
            <p class="order-info"><strong>Order Details:</strong></p>
            <p class="order-info"><strong>Order ID:</strong> ${order.orderId}</p>
            <p class="order-info"><strong>Total:</strong> ${formatPrice(order.total)}</p>
            <p class="order-info"><strong>Payment Status:</strong> ${order.paymentStatus}</p>
            ${order.trackingNumber ? `<p class="order-info"><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ""}
            ${order.deliveryDate ? `<p class="order-info"><strong>Expected Delivery:</strong> ${order.deliveryDate}</p>` : ""}
          </div>

          <a href="https://Perfum.com/dashboard" class="view-order-btn">VIEW ORDER</a>
          
          <p class="footer-message">We'll keep you updated on your order progress.<br>Contact us in case you have any queries.</p>
          
          <p class="signature">Thanks,<br>VolvoXpert's Team</p>
        </div>
        <div class="footer">
          <div class="social-icons">
            <a href="https://Perfum.com/" class="social-icon facebook">f</a>
            <a href="https://Perfum.com/" class="social-icon twitter">𝕏</a>
            <a href="https://www.instagram.com/PerFum" class="social-icon instagram">ⓘ</a>
          </div>
          <p class="footer-text">© ${new Date().getFullYear()} Perfum.com. All rights reserved.</p>
          <p class="footer-text">Dubai, UAE</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate order deletion email for customer
 * @param {Object} order - Order data
 * @param {Object} profile - Customer profile data
 * @returns {string} - HTML email content
 */
export const generateOrderDeletionEmail = (order, profile) => {
    const formatPrice = (price) => {
        return typeof price === "number"
            ? price.toLocaleString("en-AE", {
                  style: "currency",
                  currency: "AED",
              })
            : price;
    };

    const productList = order.products
        .map(
            (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
            <span style="color: #333; font-size: 14px;">${item.name}</span>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: center;">
            <span style="color: #333; font-size: 14px;">x${item.quantity}</span>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">
            <span style="color: #333; font-size: 14px; font-weight: 500;">${formatPrice(item.subtotal)}</span>
          </td>
        </tr>
      `,
        )
        .join("");

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Cancellation</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f8f8f8; 
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background-color: #ffffff; 
          border-radius: 8px; 
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); 
        }
        .header { 
          background-color: #ffffff;
          text-align: center; 
          padding: 30px 20px 20px 20px; 
          border-bottom: 1px solid #eaeaea; 
        }
        .company-name {
          font-size: 24px;
          font-weight: 700;
          color: #333;
          margin: 0 0 10px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .cancellation-badge {
          display: inline-block;
          padding: 12px 24px;
          background-color: #ef4444;
          color: white;
          border-radius: 4px;
          font-weight: 600;
          margin: 15px 0;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .content { 
          padding: 30px 40px; 
          background-color: #ffffff;
        }
        .greeting {
          font-size: 16px;
          color: #333;
          margin-bottom: 10px;
        }
        .message {
          font-size: 14px;
          color: #666;
          margin-bottom: 20px;
          line-height: 1.5;
        }
        .order-details {
          background-color: #ffffff;
          margin: 25px 0;
          padding: 0;
        }
        .order-info {
          font-size: 14px;
          color: #333;
          margin: 8px 0;
        }
        .cancelled-items-title {
          font-size: 20px;
          font-weight: 600;
          color: #333;
          text-align: center;
          margin: 30px 0 20px 0;
        }
        .order-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .summary-row {
          border-top: 1px solid #f0f0f0;
        }
        .summary-row.total {
          border-top: 2px solid #333;
          font-weight: 600;
        }
        .summary-cell {
          padding: 12px 0;
          font-size: 14px;
          color: #333;
        }
        .refund-info {
          background-color: #f0f9ff;
          border-left: 4px solid #3b82f6;
          padding: 15px 20px;
          margin: 25px 0;
          border-radius: 4px;
        }
        .refund-text {
          font-size: 14px;
          color: #1e40af;
          margin: 5px 0;
          font-weight: 500;
        }
        .contact-btn {
          display: inline-block;
          background-color: #333;
          color: white;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 4px;
          margin: 20px auto;
          display: block;
          text-align: center;
          font-weight: 500;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .footer-message {
          font-size: 14px;
          color: #666;
          margin: 25px 0 10px 0;
          line-height: 1.5;
        }
        .signature {
          font-size: 14px;
          color: #333;
          margin: 20px 0 5px 0;
        }
        .footer { 
          background-color: #f8f8f8;
          text-align: center; 
          padding: 30px 20px; 
          border-top: 1px solid #eaeaea; 
        }
        .social-icons {
          margin: 20px 0;
        }
        .social-icon {
          display: inline-block;
          margin: 0 8px;
          width: 36px;
          height: 36px;
          border-radius: 6px;
          text-decoration: none;
          color: white;
          line-height: 36px;
          font-size: 16px;
          font-weight: bold;
          transition: opacity 0.3s ease;
        }
        .social-icon:hover {
          opacity: 0.8;
        }
        .facebook {
          background-color: #1877F2;
        }
        .twitter {
          background-color: #1DA1F2;
        }
        .instagram {
          background: linear-gradient(45deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D, #F56040, #F77737, #FCAF45, #FFDC80);
        }
        .footer-text {
          color: #666; 
          font-size: 12px;
          margin: 5px 0;
        }
        @media only screen and (max-width: 600px) { 
          .container { 
            margin: 10px; 
            border-radius: 0;
          }
          .content {
            padding: 20px;
          }
          .company-name {
            font-size: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="company-name">Perfum.com</h1>
          <div class="cancellation-badge">Order Cancelled</div>
        </div>
        <div class="content">
          <p class="greeting">Hey ${profile.firstName},</p>
          <p class="message">We're writing to inform you that your order <strong>${order.orderId}</strong> has been cancelled and removed from our system.</p>
          
          <div class="order-details">
            <p class="order-info"><strong>Cancelled Order Details:</strong></p>
            <p class="order-info"><strong>Order ID:</strong> ${order.orderId}</p>
            <p class="order-info"><strong>Order Date:</strong> ${order.orderDate || "N/A"}</p>
            <p class="order-info"><strong>Payment Status:</strong> ${order.paymentStatus}</p>
            <p class="order-info"><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString("en-AE")}</p>
            ${order.cancellationReason ? `<p class="order-info"><strong>Reason:</strong> ${order.cancellationReason}</p>` : ""}
          </div>

          <h2 class="cancelled-items-title">Cancelled Items</h2>
          
          <table class="order-table">
            ${productList}
            <tr class="summary-row total">
              <td class="summary-cell" colspan="2"><strong>Total Cancelled Amount</strong></td>
              <td class="summary-cell" style="text-align: right;"><strong>${formatPrice(order.total)}</strong></td>
            </tr>
          </table>

          ${
              order.paymentStatus === "Paid" ||
              order.paymentStatus === "Completed"
                  ? `
          <div class="refund-info">
            <p class="refund-text"><strong>Refund Information:</strong></p>
            <p class="refund-text">Your refund of ${formatPrice(order.total)} is being processed and will be credited back to your original payment method within 5-7 business days.</p>
            ${order.refundId ? `<p class="refund-text"><strong>Refund Reference:</strong> ${order.refundId}</p>` : ""}
          </div>
          `
                  : ""
          }

          <a href="https://Perfum.com/contactus" class="contact-btn">CONTACT SUPPORT</a>
          
          <p class="footer-message">If this cancellation was not requested by you, please contact our customer service team immediately.<br>We apologize for any inconvenience caused.</p>
          
          <p class="signature">Thanks,<br>PerFum Team</p>
        </div>
        <div class="footer">
          <div class="social-icons">
            <a href="https://Perfum.com/" class="social-icon facebook">f</a>
            <a href="https://Perfum.com/" class="social-icon twitter">𝕏</a>
            <a href="https://www.instagram.com/PerFum" class="social-icon instagram">ⓘ</a>
          </div>
          <p class="footer-text">© ${new Date().getFullYear()} VoloXperts.com All rights reserved.</p>
          <p class="footer-text">Dubai, UAE</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate admin stock alert email
 * @param {Object} order - Order data
 * @param {Object} profile - Customer profile data
 * @returns {string} - HTML email content
 */
export const generateAdminStockAlertEmail = (order, profile) => {
    const formatPrice = (price) => {
        return typeof price === "number"
            ? price.toLocaleString("en-AE", {
                  style: "currency",
                  currency: "AED",
              })
            : price;
    };

    const productList = order.products
        .map(
            (item) => `
                <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                        <span style="color: #333; font-size: 14px;">${item.name} (SKU: ${item.sku})</span>
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: center;">
                        <span style="color: #333; font-size: 14px;">x${item.quantity}</span>
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: center;">
                        <span style="color: ${item.remainingStock <= 5 ? "#e74c3c" : "#333"}; font-size: 14px;">
                            ${item.remainingStock}${item.remainingStock <= 5 ? ' <span style="font-weight: 600;">(Low Stock!)</span>' : ""}
                        </span>
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">
                        <span style="color: #333; font-size: 14px; font-weight: 500;">${formatPrice(item.subtotal)}</span>
                    </td>
                </tr>
            `,
        )
        .join("");

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Stock Alert: New Order #${order.orderId}</title>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    margin: 0; 
                    padding: 0; 
                    background-color: #f8f8f8; 
                }
                .container { 
                    max-width: 600px; 
                    margin: 20px auto; 
                    background-color: #ffffff; 
                    border-radius: 8px; 
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); 
                }
                .header { 
                    background-color: #e74c3c;
                    text-align: center; 
                    padding: 30px 20px; 
                    color: white;
                }
                .company-name {
                    font-size: 24px;
                    font-weight: 700;
                    margin: 0 0 10px 0;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .alert-badge {
                    background-color: #ffffff;
                    color: #e74c3c;
                    padding: 8px 16px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    display: inline-block;
                    margin-top: 10px;
                }
                .content { 
                    padding: 30px 40px; 
                    background-color: #ffffff;
                }
                .message {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 20px;
                    line-height: 1.5;
                    text-align: center;
                }
                .order-details {
                    background-color: #ffffff;
                    margin: 25px 0;
                    padding: 0;
                }
                .order-info {
                    font-size: 14px;
                    color: #333;
                    margin: 8px 0;
                }
                .order-summary-title {
                    font-size: 20px;
                    font-weight: 600;
                    color: #333;
                    text-align: center;
                    margin: 30px 0 20px 0;
                }
                .order-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                .summary-row {
                    border-top: 1px solid #f0f0f0;
                }
                .summary-row.total {
                    border-top: 2px solid #333;
                    font-weight: 600;
                }
                .summary-cell {
                    padding: 12px 0;
                    font-size: 14px;
                    color: #333;
                }
                .action-message {
                    background-color: #fff3cd;
                    color: #856404;
                    padding: 15px;
                    border-radius: 6px;
                    text-align: center;
                    margin: 20px 0;
                    font-weight: 500;
                    border: 1px solid #ffeaa7;
                }
                .footer { 
                    background-color: #f8f8f8;
                    text-align: center; 
                    padding: 30px 20px; 
                    border-top: 1px solid #eaeaea; 
                }
                .footer-text {
                    color: #666; 
                    font-size: 12px;
                    margin: 5px 0;
                }
                @media only screen and (max-width: 600px) { 
                    .container { 
                        margin: 10px; 
                        border-radius: 0;
                    }
                    .content {
                        padding: 20px;
                    }
                    .company-name {
                        font-size: 20px;
                    }
                    .order-table {
                        font-size: 12px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 class="company-name">Perfum.com</h1>
                    <div class="alert-badge">Stock Alert</div>
                </div>
                <div class="content">
                    <p class="message">A new order <strong>#${order.orderId}</strong> has been placed, affecting product stock levels. Please review the updated stock below.</p>
                    
                    <div class="order-details">
                        <p class="order-info"><strong>Order ID:</strong> ${order.orderId}</p>
                        <p class="order-info"><strong>Customer:</strong> ${profile.firstName} ${profile.lastName}</p>
                        <p class="order-info"><strong>Email:</strong> ${order.user.email}</p>
                        <p class="order-info"><strong>Order Date:</strong> ${new Date().toLocaleDateString("en-AE")}</p>
                    </div>

                    <h2 class="order-summary-title">Stock Update</h2>
                    
                    <table class="order-table">
                        <tr>
                            <th style="padding: 12px 0; text-align: left; font-size: 14px; color: #333;">Product</th>
                            <th style="padding: 12px 0; text-align: center; font-size: 14px; color: #333;">Quantity</th>
                            <th style="padding: 12px 0; text-align: center; font-size: 14px; color: #333;">Remaining Stock</th>
                            <th style="padding: 12px 0; text-align: right; font-size: 14px; color: #333;">Subtotal</th>
                        </tr>
                        ${productList}
                        <tr class="summary-row total">
                            <td class="summary-cell" colspan="3"><strong>Total</strong></td>
                            <td class="summary-cell" style="text-align: right;"><strong>${formatPrice(order.total)}</strong></td>
                        </tr>
                    </table>

                    <div class="action-message">
                        <strong>Action Required:</strong> Check stock levels and restock products marked as low to avoid shortages.
                    </div>
                </div>
                <div class="footer">
                    <p class="footer-text">© ${new Date().getFullYear()} Perfum.com. All rights reserved.</p>
                    <p class="footer-text">Dubai, UAE</p>
                    <p class="footer-text">This is an automated notification. Please do not reply directly.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};
