import nodemailer from "nodemailer";

const hasGmailConfig = () => process.env.EMAIL_USER && process.env.EMAIL_PASS;

const getGmailTransporter = () => {
  if (!hasGmailConfig()) return null;
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    family: 4,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const hasSmtpConfig = () => process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

const getTransporter = () => {
  if (!hasSmtpConfig()) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const sendMail = async ({ to, subject, text }) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`Email skipped (no SMTP): ${subject}`, { to });
    return;
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text
  });
};

export const sendOrderConfirmationEmail = async ({ to, name, order }) => {
  const transporter = getGmailTransporter();
  if (!transporter) {
    console.log("Order confirmation email skipped (no EMAIL_USER / EMAIL_PASS)", { to, order: order.orderNumber });
    return;
  }

  const itemsHtml = order.orderItems
    .map(
      (item) =>
        `<tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #3d2c1b;">${item.name || "Item"}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: center; color: #3d2c1b;">${item.quantity}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; color: #3d2c1b;">Rs. ${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const shippingHtml = order.shippingAddress
    ? [
        order.shippingAddress.fullName,
        order.shippingAddress.addressLine1,
        order.shippingAddress.addressLine2,
        [order.shippingAddress.city, order.shippingAddress.state].filter(Boolean).join(", "),
        order.shippingAddress.postalCode,
        order.shippingAddress.country
      ]
        .filter(Boolean)
        .join("<br/>")
    : "N/A";

  const subject = `Order Confirmed – ${order.orderNumber}`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0; padding:0; background:#fdf6f0; font-family: 'Segoe UI', Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6f0; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(139,69,19,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:#8b4513; padding: 28px 32px; text-align: center;">
              <h1 style="margin:0; color:#ffffff; font-size: 22px; font-family: 'Playfair Display', Georgia, serif; letter-spacing: 0.5px;">Elegant Home Decor</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin:0 0 6px; color:#3d2c1b; font-size: 16px;">Hi ${name},</p>
              <p style="margin:0 0 20px; color:#5c4a36; font-size: 15px; line-height: 1.6;">Thank you for your order! We're thrilled to help you add a touch of elegance to your home.</p>

              <!-- Order Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6f0; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 4px 0; color:#5c4a36; font-size: 13px;">Order ID</td>
                  <td style="padding: 4px 0; text-align: right; color:#3d2c1b; font-size: 13px; font-weight: 600;">${order.orderNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color:#5c4a36; font-size: 13px;">Payment Method</td>
                  <td style="padding: 4px 0; text-align: right; color:#3d2c1b; font-size: 13px; font-weight: 600;">${order.paymentMethod || "COD"}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color:#5c4a36; font-size: 13px;">Status</td>
                  <td style="padding: 4px 0; text-align: right; color:#3d2c1b; font-size: 13px; font-weight: 600;">${order.orderStatus}</td>
                </tr>
              </table>

              <!-- Items Table -->
              <h2 style="margin:0 0 12px; color:#3d2c1b; font-size: 15px; font-weight: 600;">Items Ordered</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr>
                    <th style="padding: 8px 0; border-bottom: 2px solid #e8d5c4; text-align: left; color:#8b4513; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
                    <th style="padding: 8px 0; border-bottom: 2px solid #e8d5c4; text-align: center; color:#8b4513; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                    <th style="padding: 8px 0; border-bottom: 2px solid #e8d5c4; text-align: right; color:#8b4513; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Totals -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
                <tr>
                  <td style="padding: 4px 0; color:#5c4a36; font-size: 13px;">Subtotal</td>
                  <td style="padding: 4px 0; text-align: right; color:#3d2c1b; font-size: 13px;">Rs. ${order.itemsPrice?.toFixed(2) || "0.00"}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color:#5c4a36; font-size: 13px;">Shipping</td>
                  <td style="padding: 4px 0; text-align: right; color:#3d2c1b; font-size: 13px;">${order.shippingPrice === 0 ? "Free" : "Rs. " + order.shippingPrice?.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color:#5c4a36; font-size: 13px;">Tax</td>
                  <td style="padding: 4px 0; text-align: right; color:#3d2c1b; font-size: 13px;">Rs. ${order.taxPrice?.toFixed(2) || "0.00"}</td>
                </tr>
                ${order.coupon?.discountAmount ? `
                <tr>
                  <td style="padding: 4px 0; color:#5c4a36; font-size: 13px;">Coupon Discount</td>
                  <td style="padding: 4px 0; text-align: right; color:#2e7d32; font-size: 13px;">-Rs. ${order.coupon.discountAmount.toFixed(2)}</td>
                </tr>` : ""}
                <tr>
                  <td style="padding: 8px 0 0; border-top: 2px solid #e8d5c4; color:#3d2c1b; font-size: 15px; font-weight: 700;">Total</td>
                  <td style="padding: 8px 0 0; border-top: 2px solid #e8d5c4; text-align: right; color:#8b4513; font-size: 18px; font-weight: 700;">Rs. ${order.totalPrice?.toFixed(2) || "0.00"}</td>
                </tr>
              </table>

              <!-- Shipping Address -->
              <h2 style="margin: 24px 0 8px; color:#3d2c1b; font-size: 15px; font-weight: 600;">Shipping Address</h2>
              <p style="margin:0; color:#5c4a36; font-size: 13px; line-height: 1.7;">${shippingHtml}</p>

              <!-- Next Steps -->
              <h2 style="margin: 24px 0 8px; color:#3d2c1b; font-size: 15px; font-weight: 600;">What's Next?</h2>
              <p style="margin:0; color:#5c4a36; font-size: 13px; line-height: 1.7;">We are preparing your order and will notify you once it ships. You can track your order status anytime from your account dashboard.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#fdf6f0; padding: 20px 32px; text-align: center;">
              <p style="margin:0; color:#a86445; font-size: 12px;">Elegant Home Decor &bull; Crafted with Care</p>
              <p style="margin:6px 0 0; color:#b8977a; font-size: 11px;">If you have any questions, please reply to this email or contact our support team.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Elegant Home Decor" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
};

export const sendReviewStatusEmail = async ({ to, name, status, productName }) => {
  const subject = status === "approved"
    ? "Your Review Has Been Approved!"
    : "Your Review Has Been Rejected";

  const text = status === "approved"
    ? [
        `Hi ${name},`,
        "",
        `Thank you for reviewing "${productName}".`,
        "Your review has been approved and is now visible on our website.",
        "",
        "Thank you for your feedback!",
        "- Elegant Home Decor Team"
      ].join("\n")
    : [
        `Hi ${name},`,
        "",
        `Thank you for reviewing "${productName}".`,
        "Unfortunately, your review did not meet our guidelines and has been rejected.",
        "If you have any questions, please contact our support team.",
        "",
        "- Elegant Home Decor Team"
      ].join("\n");

  await sendMail({ to, subject, text });
};

export const sendReturnStatusEmail = async ({ to, name, returnId, status }) => {
  const subject = `Return ${returnId} - ${status}`;
  const statusMessages = {
    "Requested": "Your return request has been submitted and is pending review.",
    "Approved": "Your return request has been approved. We will schedule a pickup shortly.",
    "Rejected": "Unfortunately, your return request could not be approved. Please contact support for more details.",
    "Pickup Scheduled": "A pickup has been scheduled for your return. Please keep the items ready.",
    "Refund Initiated": "Your refund has been initiated. It will reflect in your account within 5-7 business days."
  };

  const text = [
    `Hi ${name},`,
    "",
    `Return ID: ${returnId}`,
    `Status: ${status}`,
    "",
    statusMessages[status] || `Your return status has been updated to "${status}".`,
    "",
    "Thank you for your patience.",
    "- Elegant Home Decor Team"
  ].join("\n");

  await sendMail({ to, subject, text });
};

export const sendPasswordResetEmail = async ({ to, name, resetLink }) => {
  const hasGmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS;
  if (!hasGmailConfig) {
    console.log("Password reset email skipped (no EMAIL_USER / EMAIL_PASS)", { to });
    return;
  }

  const transporter = getGmailTransporter();

  const subject = "Password Reset - Elegant Home Decor";
  const text = [
    `Hi ${name},`,
    "",
    "You requested a password reset for your Elegant Home Decor account.",
    "",
    `Click the link below to reset your password:`,
    resetLink,
    "",
    "This link will expire in 15 minutes.",
    "",
    "If you did not request this, please ignore this email.",
    "",
    "- Elegant Home Decor Team"
  ].join("\n");

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text
  });
};

export const sendLowStockAlert = async ({ productName, stock, threshold }) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  if (!adminEmail) {
    console.log("Low stock alert skipped (no ADMIN_EMAIL / EMAIL_USER)");
    return;
  }

  const subject = `Low Stock Alert: ${productName}`;
  const text = [
    `Low Stock Alert`,
    ``,
    `Product: ${productName}`,
    `Current Stock: ${stock}`,
    `Threshold: ${threshold}`,
    ``,
    `This product is running low on stock. Please restock soon.`,
    ``,
    `- Elegant Home Decor`,
  ].join("\n");

  await sendMail({ to: adminEmail, subject, text });
};

export const sendRefundEmail = async ({ to, name, returnId, amount, method }) => {
  const subject = `Refund Completed for Return ${returnId}`;
  const text = [
    `Hi ${name},`,
    "",
    `Your refund for Return ${returnId} has been completed.`,
    `Amount: Rs. ${amount}`,
    `Method: ${method}`,
    "",
    "Please allow 5-7 business days for the amount to reflect in your account.",
    "",
    "Thank you for shopping with us.",
    "- Elegant Home Decor Team"
  ].join("\n");

  await sendMail({ to, subject, text });
};
