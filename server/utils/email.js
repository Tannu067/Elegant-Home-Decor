import nodemailer from "nodemailer";

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

export const sendOrderConfirmationEmail = async ({ to, order }) => {
  const subject = `Elegant Home Decor Order ${order.orderNumber}`;
  const text = [
    "Thank You for Your Order.",
    `Order ID: ${order.orderNumber}`,
    `Order Status: ${order.orderStatus}`,
    `Total: Rs. ${order.totalPrice}`,
    "You Can Track This Guest Order With Your Order ID and Email Address."
  ].join("\n");

  await sendMail({ to, subject, text });
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

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

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
