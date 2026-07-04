import nodemailer from "nodemailer";
import dns from "dns";

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
  console.log("[email] DNS resolution order set to ipv4first");
} else {
  console.log("[email] dns.setDefaultResultOrder not available (Node < 17)");
}

let GMAIL_IPV4 = null;

const resolveGmailIpv4Sync = () => {
  try {
    const result = dns.lookupSync("smtp.gmail.com", { family: 4, hints: dns.ADDRCONFIG });
    if (result?.address) {
      GMAIL_IPV4 = result.address;
      console.log(`[email] pre-resolved smtp.gmail.com → ${GMAIL_IPV4}`);
      return;
    }
  } catch {
    // options object API failed, try positional API
  }
  try {
    const address = dns.lookupSync("smtp.gmail.com", 4);
    if (address) {
      GMAIL_IPV4 = address;
      console.log(`[email] pre-resolved smtp.gmail.com (positional) → ${GMAIL_IPV4}`);
      return;
    }
  } catch (err) {
    console.warn(`[email] DNS pre-resolution failed: ${err.code || err.message || "unknown"}`);
  }
};

const resolveGmailIpv4Async = async () => {
  if (GMAIL_IPV4) return;
  try {
    const addresses = await dns.promises.resolve4("smtp.gmail.com");
    if (addresses?.length) {
      GMAIL_IPV4 = addresses[0];
      console.log(`[email] async resolved smtp.gmail.com → ${GMAIL_IPV4}`);
    }
  } catch (err) {
    console.warn(`[email] async DNS failed: ${err.code}`);
    if (!GMAIL_IPV4) {
      GMAIL_IPV4 = "142.250.31.109";
      console.log(`[email] using fallback IP: ${GMAIL_IPV4}`);
    }
  }
};

resolveGmailIpv4Sync();

const APP_NAME = "Elegant Home Decor";
const DEFAULT_FROM_NAME = process.env.MAIL_FROM_NAME || APP_NAME;
const DEFAULT_FROM_ADDRESS = process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USER || process.env.SMTP_USER;

const trimValue = (value) => (typeof value === "string" ? value.trim() : value);

const normalizePassword = (value) => (typeof value === "string" ? value.replace(/\s+/g, "") : value);

const parseBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

const parseRecipients = (value) =>
  String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

const getFrontendUrl = () => {
  const fallback = process.env.NODE_ENV === "production" ? "" : "http://localhost:5173";
  return trimValue(process.env.CLIENT_URL || process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL || fallback);
};

const resolveFrom = () => {
  if (!DEFAULT_FROM_ADDRESS) return null;
  return `"${DEFAULT_FROM_NAME}" <${DEFAULT_FROM_ADDRESS}>`;
};

const resolveTransportConfig = () => {
  const smtpHost = trimValue(process.env.SMTP_HOST);
  const smtpUser = trimValue(process.env.SMTP_USER);
  const smtpPass = normalizePassword(process.env.SMTP_PASS);
  const emailUser = trimValue(process.env.EMAIL_USER);
  const emailPass = normalizePassword(process.env.EMAIL_PASS);
  const googleClientId = trimValue(process.env.GOOGLE_CLIENT_ID);
  const googleClientSecret = trimValue(process.env.GOOGLE_CLIENT_SECRET);
  const googleRefreshToken = trimValue(process.env.GOOGLE_REFRESH_TOKEN);

  const safePort = (raw) => {
    const n = parseInt(raw, 10);
    if (isNaN(n) || n < 1 || n > 65535) return null;
    return n;
  };

  const baseGmailConfig = (authConfig) => {
    const port = safePort(process.env.EMAIL_SMTP_PORT) || 587;
    const secure = port === 465 ? true : (port === 587 ? false : parseBool(process.env.EMAIL_SECURE, false));

    const host = GMAIL_IPV4 || "smtp.gmail.com";

    return {
      host,
      port,
      secure,
      auth: authConfig,
      family: 4,
      requireTLS: !secure,
      tls: GMAIL_IPV4 ? { servername: "smtp.gmail.com" } : undefined,
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 30000
    };
  };

  if (smtpHost) {
    if (!smtpUser || !smtpPass) {
      return {
        error: "SMTP_HOST is set, but SMTP_USER or SMTP_PASS is missing."
      };
    }

    return {
      mode: "smtp",
      config: {
        host: smtpHost,
        port: safePort(process.env.SMTP_PORT) || 587,
        secure: parseBool(process.env.SMTP_SECURE, false),
        auth: { user: smtpUser, pass: smtpPass },
        family: 4,
        connectionTimeout: 20000,
        greetingTimeout: 20000,
        socketTimeout: 30000
      }
    };
  }

  if (googleClientId && googleClientSecret && googleRefreshToken && emailUser) {
    return {
      mode: "gmail-oauth2",
      config: baseGmailConfig({
        type: "OAuth2",
        user: emailUser,
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        refreshToken: googleRefreshToken
      })
    };
  }

  if (emailUser && emailPass) {
    return {
      mode: "gmail-app-password",
      config: baseGmailConfig({ user: emailUser, pass: emailPass })
    };
  }

  return {
    error:
      "No email credentials found. Set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REFRESH_TOKEN + EMAIL_USER for OAuth2, EMAIL_USER + EMAIL_PASS for App Password, or SMTP_HOST + SMTP_USER + SMTP_PASS for generic SMTP."
  };
};

let transporterInstance = null;
let transporterMode = null;
let lastVerifyAttempt = 0;
const VERIFY_COOLDOWN_MS = 60000;

const createTransporter = async () => {
  await resolveGmailIpv4Async();
  const transport = resolveTransportConfig();
  if (transport.error) {
    return { transporter: null, mode: null, error: transport.error };
  }

  const { host, port, secure, auth } = transport.config;
  const authType = auth?.type || "password";
  const refreshTokenSnippet = auth?.refreshToken ? `${auth.refreshToken.substring(0, 8)}...` : null;
  const logAuth = authType === "OAuth2"
    ? `type=OAuth2 clientId=${auth?.clientId} refreshToken=${refreshTokenSnippet}`
    : `user=${auth?.user}`;
  const resolvedInfo = GMAIL_IPV4 ? `ipv4=${GMAIL_IPV4}` : "hostname=smtp.gmail.com";
  const usingInfo = host === GMAIL_IPV4 ? resolvedInfo : `host=${host}`;

  console.log(`[email] creating transporter: mode=${transport.mode} ${usingInfo} port=${port} secure=${secure} ${logAuth}`);

  const transporter = nodemailer.createTransport(transport.config);

  transporter.verify().then((ok) => {
    if (ok) {
      console.log(`[email] transporter verified: mode=${transport.mode} host=${host} port=${port}`);
    }
  }).catch((err) => {
    console.warn(`[email] transporter verify() failed (will retry on next send): code=${err.code} message=${err.message}`);
    if (authType === "OAuth2" && (err.code === "EAUTH" || err.response?.includes("invalid_grant"))) {
      console.error("[email] OAuth2 token may be expired or invalid. Generate a new refresh token at https://developers.google.com/oauthplayground");
    }
  });

  return { transporter, mode: transport.mode, error: null };
};

const getTransporter = async () => {
  const now = Date.now();

  if (!transporterInstance) {
    const result = await createTransporter();
    transporterInstance = result.transporter;
    transporterMode = result.mode;
    lastVerifyAttempt = now;
  }

  return { transporter: transporterInstance, mode: transporterMode };
};

const resetTransporter = () => {
  transporterInstance = null;
  transporterMode = null;
};

const sendMailWithRetry = async (mailOptions, kind, attempt = 1) => {
  const { transporter, mode } = await getTransporter();

  if (!transporter) {
    return { skipped: true, reason: getEmailConfigStatus().error || "transporter not available" };
  }

  try {
    const info = await transporter.sendMail(mailOptions);

    console.log(`[email] sent ${kind} mode=${mode}`, {
      to: mailOptions.to,
      subject: mailOptions.subject,
      messageId: info.messageId,
      response: info.response?.substring(0, 80)
    });

    return { sent: true, messageId: info.messageId };
  } catch (error) {
    const errInfo = {
      code: error.code,
      command: error.command,
      response: error.response?.substring(0, 120),
      responseCode: error.responseCode,
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port
    };

    const isIpv6 = error.address?.includes(":") && GMAIL_IPV4;
    console.error(`[email] failed ${kind} (attempt ${attempt}) mode=${mode}${isIpv6 ? " (IPv6!)" : ""}`, {
      to: mailOptions.to,
      subject: mailOptions.subject,
      error: error.message,
      resolvedIpv4: GMAIL_IPV4,
      ...errInfo
    });

    if (attempt === 1) {
      const delay = error.code === "ENETUNREACH" || error.code === "ETIMEDOUT" ? 2000 : 1000;
      console.log(`[email] retrying ${kind} in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));

      if (!transporterInstance) {
        const result = await createTransporter();
        transporterInstance = result.transporter;
        transporterMode = result.mode;
      }

      return sendMailWithRetry(mailOptions, kind, 2);
    }

    if (error.code === "EAUTH" || error.response?.includes("invalid_grant")) {
      console.error(`[email] ${mode} auth failed — resetting transporter`);
      resetTransporter();
    }

    if (mode === "gmail-oauth2" && error.response?.includes("invalid_grant")) {
      console.error("[email] OAuth2 refresh token is invalid or revoked. Generate a new one at https://developers.google.com/oauthplayground");
    }

    return { sent: false, error: error.message, code: error.code };
  }
};

export const getEmailConfigStatus = () => {
  const transport = resolveTransportConfig();
  const auth = transport.config?.auth || {};
  return {
    configured: !transport.error,
    mode: transport.mode || transporterMode || null,
    port: transport.config?.port || null,
    secure: transport.config?.secure ?? null,
    host: transport.config?.host || null,
    authType: auth.type || "password",
    oauth2: auth.type === "OAuth2" ? {
      clientId: auth.clientId ? `${auth.clientId.substring(0, 20)}...` : null,
      hasRefreshToken: !!auth.refreshToken,
      refreshTokenPrefix: auth.refreshToken ? auth.refreshToken.substring(0, 8) : null
    } : null,
    resolvedIpv4: GMAIL_IPV4,
    dnsOrder: dns.setDefaultResultOrder ? "ipv4first" : "default",
    error: transport.error || null,
    from: resolveFrom(),
    frontendUrl: getFrontendUrl()
  };
};

export const sendTestEmail = async ({ to, label = "Production Email Test" }) => {
  const subject = `${APP_NAME} - ${label}`;
  const text = [
    `Hi,`,
    "",
    `This is a test email from ${APP_NAME}.`,
    `If you received this message, the deployed email configuration is working.`,
    "",
    `Time: ${new Date().toISOString()}`,
    `Environment: ${process.env.NODE_ENV || "development"}`,
    "",
    `- ${APP_NAME} Team`
  ].join("\n");

  return sendMail({
    kind: "test-email",
    to,
    subject,
    text
  });
};

const logEmailSkip = (kind, details) => {
  console.warn(`[email] skipped ${kind}`, details);
};

const logEmailFailure = (kind, details, error) => {
  console.error(`[email] failed ${kind}`, {
    ...details,
    error: error.message,
    code: error.code,
    stack: error.stack
  });
};

const sendMail = async ({ to, subject, text, html, replyTo, kind = "message", from }) => {
  const resolvedFrom = from || resolveFrom();
  if (!resolvedFrom) {
    logEmailSkip(kind, {
      to,
      subject,
      reason: "MAIL_FROM / SMTP_FROM / EMAIL_USER / SMTP_USER is missing"
    });
    return { skipped: true };
  }

  const mailOptions = {
    from: resolvedFrom,
    to,
    subject,
    text,
    html,
    replyTo
  };

  try {
    return await sendMailWithRetry(mailOptions, kind);
  } catch (error) {
    logEmailFailure(kind, { to, subject }, error);
    return { sent: false, error: error.message };
  }
};

const formatAddressBlock = (lines = []) => lines.filter(Boolean).join("<br/>");

const buildOrderEmailHtml = (order, name) => {
  const itemsHtml = order.orderItems
    .map(
      (item) =>
        `<tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; color:#3d2c1b;">${item.name || "Item"}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: center; color:#3d2c1b;">${item.quantity}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; color:#3d2c1b;">Rs. ${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const shippingHtml = order.shippingAddress
    ? formatAddressBlock([
        order.shippingAddress.fullName,
        order.shippingAddress.addressLine1,
        order.shippingAddress.addressLine2,
        [order.shippingAddress.city, order.shippingAddress.state].filter(Boolean).join(", "),
        order.shippingAddress.postalCode,
        order.shippingAddress.country
      ])
    : "N/A";

  return `
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
          <tr>
            <td style="background:#8b4513; padding: 28px 32px; text-align: center;">
              <h1 style="margin:0; color:#ffffff; font-size: 22px; font-family: 'Playfair Display', Georgia, serif; letter-spacing: 0.5px;">${APP_NAME}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin:0 0 6px; color:#3d2c1b; font-size: 16px;">Hi ${name},</p>
              <p style="margin:0 0 20px; color:#5c4a36; font-size: 15px; line-height: 1.6;">Thank you for your order! We're thrilled to help you add a touch of elegance to your home.</p>
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
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
                <tr>
                  <td style="padding: 4px 0; color:#5c4a36; font-size: 13px;">Subtotal</td>
                  <td style="padding: 4px 0; text-align: right; color:#3d2c1b; font-size: 13px;">Rs. ${order.itemsPrice?.toFixed(2) || "0.00"}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color:#5c4a36; font-size: 13px;">Shipping</td>
                  <td style="padding: 4px 0; text-align: right; color:#3d2c1b; font-size: 13px;">${order.shippingPrice === 0 ? "Free" : `Rs. ${order.shippingPrice?.toFixed(2)}`}</td>
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
              <h2 style="margin: 24px 0 8px; color:#3d2c1b; font-size: 15px; font-weight: 600;">Shipping Address</h2>
              <p style="margin:0; color:#5c4a36; font-size: 13px; line-height: 1.7;">${shippingHtml}</p>
              <h2 style="margin: 24px 0 8px; color:#3d2c1b; font-size: 15px; font-weight: 600;">What's Next?</h2>
              <p style="margin:0; color:#5c4a36; font-size: 13px; line-height: 1.7;">We are preparing your order and will notify you once it ships. You can track your order status anytime from your account dashboard.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#fdf6f0; padding: 20px 32px; text-align: center;">
              <p style="margin:0; color:#a86445; font-size: 12px;">${APP_NAME} &bull; Crafted with Care</p>
              <p style="margin:6px 0 0; color:#b8977a; font-size: 11px;">If you have any questions, please reply to this email or contact our support team.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const buildOrderEmailText = (order, name) =>
  [
    `Hi ${name},`,
    "",
    "Thank you for your order!",
    `Order ID: ${order.orderNumber}`,
    `Payment Method: ${order.paymentMethod || "COD"}`,
    `Status: ${order.orderStatus}`,
    `Subtotal: Rs. ${order.itemsPrice?.toFixed(2) || "0.00"}`,
    `Shipping: ${order.shippingPrice === 0 ? "Free" : `Rs. ${order.shippingPrice?.toFixed(2)}`}`,
    `Tax: Rs. ${order.taxPrice?.toFixed(2) || "0.00"}`,
    order.coupon?.discountAmount ? `Coupon Discount: -Rs. ${order.coupon.discountAmount.toFixed(2)}` : null,
    `Total: Rs. ${order.totalPrice?.toFixed(2) || "0.00"}`,
    "",
    "We are preparing your order and will notify you once it ships.",
    "",
    `- ${APP_NAME} Team`
  ]
    .filter(Boolean)
    .join("\n");

export const sendOrderConfirmationEmail = async ({ to, name, order }) => {
  const subject = `Order Confirmed - ${order.orderNumber}`;
  return sendMail({
    kind: "order-confirmation",
    to,
    subject,
    text: buildOrderEmailText(order, name),
    html: buildOrderEmailHtml(order, name)
  });
};

export const sendAdminOrderNotificationEmail = async ({ order, customerName, customerEmail, isGuest = false }) => {
  const recipients = parseRecipients(process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS || process.env.EMAIL_ALERT_TO);
  if (!recipients.length) {
    logEmailSkip("admin-order-notification", {
      subject: `New order ${order.orderNumber}`,
      reason: "ADMIN_EMAIL / ADMIN_EMAILS / EMAIL_ALERT_TO is missing"
    });
    return { skipped: true };
  }

  const subject = `New Order Received - ${order.orderNumber}`;
  const text = [
    `New order received`,
    "",
    `Order ID: ${order.orderNumber}`,
    `Customer: ${customerName}`,
    `Email: ${customerEmail}`,
    `Guest Order: ${isGuest ? "Yes" : "No"}`,
    `Payment Method: ${order.paymentMethod || "COD"}`,
    `Total: Rs. ${order.totalPrice?.toFixed(2) || "0.00"}`,
    `Items: ${order.orderItems?.map((item) => `${item.name || "Item"} x ${item.quantity}`).join(", ")}`,
    "",
    `- ${APP_NAME}`
  ].join("\n");

  return sendMail({
    kind: "admin-order-notification",
    to: recipients,
    subject,
    text
  });
};

export const sendContactNotificationEmail = async ({ name, email, message }) => {
  const recipients = parseRecipients(process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS || process.env.EMAIL_ALERT_TO);
  if (!recipients.length) {
    logEmailSkip("contact-notification", {
      subject: `Contact form submission from ${name}`,
      reason: "ADMIN_EMAIL / ADMIN_EMAILS / EMAIL_ALERT_TO is missing"
    });
    return { skipped: true };
  }

  const subject = `Contact Form Submission - ${name}`;
  const text = [
    `New contact form submission`,
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    "",
    "Message:",
    message,
    "",
    `- ${APP_NAME}`
  ].join("\n");

  return sendMail({
    kind: "contact-notification",
    to: recipients,
    subject,
    text,
    replyTo: email
  });
};

export const sendContactAutoReplyEmail = async ({ to, name }) => {
  const subject = `${APP_NAME} Received Your Message`;
  const text = [
    `Hi ${name},`,
    "",
    "Thanks for reaching out. We received your message and will reply shortly.",
    "",
    `- ${APP_NAME} Team`
  ].join("\n");

  return sendMail({
    kind: "contact-autoreply",
    to,
    subject,
    text
  });
};

export const sendReviewStatusEmail = async ({ to, name, status, productName }) => {
  const subject = status === "approved" ? "Your Review Has Been Approved!" : "Your Review Has Been Rejected";

  const text =
    status === "approved"
      ? [
          `Hi ${name},`,
          "",
          `Thank you for reviewing "${productName}".`,
          "Your review has been approved and is now visible on our website.",
          "",
          "Thank you for your feedback!",
          `- ${APP_NAME} Team`
        ].join("\n")
      : [
          `Hi ${name},`,
          "",
          `Thank you for reviewing "${productName}".`,
          "Unfortunately, your review did not meet our guidelines and has been rejected.",
          "If you have any questions, please contact our support team.",
          "",
          `- ${APP_NAME} Team`
        ].join("\n");

  return sendMail({ kind: "review-status", to, subject, text });
};

export const sendReturnStatusEmail = async ({ to, name, returnId, status }) => {
  const subject = `Return ${returnId} - ${status}`;
  const statusMessages = {
    Requested: "Your return request has been submitted and is pending review.",
    Approved: "Your return request has been approved. We will schedule a pickup shortly.",
    Rejected: "Unfortunately, your return request could not be approved. Please contact support for more details.",
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
    `- ${APP_NAME} Team`
  ].join("\n");

  return sendMail({ kind: "return-status", to, subject, text });
};

export const sendPasswordResetEmail = async ({ to, name, resetToken }) => {
  const frontendUrl = getFrontendUrl();
  if (!frontendUrl) {
    throw new Error("CLIENT_URL or FRONTEND_URL is required to build password reset links");
  }

  const resetLink = `${frontendUrl.replace(/\/$/, "")}/reset-password/${resetToken}`;
  const subject = "Password Reset - Elegant Home Decor";
  const text = [
    `Hi ${name},`,
    "",
    "You requested a password reset for your Elegant Home Decor account.",
    "",
    "Click the link below to reset your password:",
    resetLink,
    "",
    "This link will expire in 15 minutes.",
    "",
    "If you did not request this, please ignore this email.",
    "",
    `- ${APP_NAME} Team`
  ].join("\n");

  return sendMail({
    kind: "password-reset",
    to,
    subject,
    text
  });
};

export const sendLowStockAlert = async ({ productName, stock, threshold }) => {
  const recipients = parseRecipients(process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS || process.env.EMAIL_ALERT_TO);
  if (!recipients.length) {
    logEmailSkip("low-stock-alert", {
      subject: `Low Stock Alert: ${productName}`,
      reason: "ADMIN_EMAIL / ADMIN_EMAILS / EMAIL_ALERT_TO is missing"
    });
    return { skipped: true };
  }

  const subject = `Low Stock Alert: ${productName}`;
  const text = [
    "Low Stock Alert",
    "",
    `Product: ${productName}`,
    `Current Stock: ${stock}`,
    `Threshold: ${threshold}`,
    "",
    "This product is running low on stock. Please restock soon.",
    "",
    `- ${APP_NAME}`
  ].join("\n");

  return sendMail({
    kind: "low-stock-alert",
    to: recipients,
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
    `- ${APP_NAME} Team`
  ].join("\n");

  return sendMail({ kind: "refund", to, subject, text });
};
