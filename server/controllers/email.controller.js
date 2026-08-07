import { sendMail, getSmtpStatus } from "../services/email.service.js";

// HTTP status per classified SMTP error code — 400 for the client's own
// mistake (bad recipient), 502/503 for server/upstream-side failures.
const STATUS_BY_CODE = {
  SMTP_NOT_CONFIGURED: 503,
  SMTP_AUTH_FAILED: 502,
  SMTP_CONNECTION_FAILED: 502,
  SMTP_INVALID_RECIPIENT: 400,
  SMTP_SEND_FAILED: 502,
};

// Dedicated response contract for this endpoint: { success: true } or
// { success: false, error } — deliberately not routed through the shared
// AppError/errorHandler pipeline, which uses a different shape.
export async function sendEmail(req, res) {
  const { to, subject, body } = req.body || {};

  if (!to || !subject || !body) {
    return res.status(400).json({ success: false, error: "Fields 'to', 'subject' and 'body' are required." });
  }

  try {
    await sendMail({ to, subject, body });
    res.json({ success: true });
  } catch (error) {
    console.error("[send-email] failed:", error.code || "UNKNOWN", "-", error.message);
    const status = STATUS_BY_CODE[error.code] || 502;
    res.status(status).json({ success: false, error: error.message || "Unable to send the email at this time." });
  }
}

export function emailHealth(req, res) {
  res.json(getSmtpStatus());
}
