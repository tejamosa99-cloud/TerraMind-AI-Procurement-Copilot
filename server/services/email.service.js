import nodemailer from "nodemailer";
import { env } from "../config/env.js";

// SMTP credentials never leave the server — this is the only place they're
// read (from env) and used. The browser only ever sends { to, subject, body }.
let transporter = null;

// SMTP_PORT is intentionally excluded — it already has a universal default
// (587) via env.js, so it's never "missing" in a way that blocks sending.
const REQUIRED_SMTP_VARS = [
  ["SMTP_HOST", env.smtpHost],
  ["SMTP_USER", env.smtpUser],
  ["SMTP_PASS", env.smtpPass],
  ["SMTP_FROM", env.smtpFrom],
];

// Used by server startup logging and GET /api/email-health — never by the
// send path's user-facing error, so exact var names don't leak to arbitrary
// API callers on every failed send.
export function getMissingSmtpVars() {
  return REQUIRED_SMTP_VARS.filter(([, value]) => !value).map(([name]) => name);
}

const PROVIDER_LABELS = [
  [/gmail\.com$/i, "gmail"],
  [/outlook\.com$|office365\.com$/i, "outlook"],
  [/yahoo\.com$/i, "yahoo"],
  [/zoho\.com$/i, "zoho"],
  [/sendgrid\.net$/i, "sendgrid"],
  [/amazonaws\.com$/i, "ses"],
];

function smtpProviderLabel(host) {
  const match = PROVIDER_LABELS.find(([pattern]) => pattern.test(host));
  return match ? match[1] : host || "unknown";
}

// Powers GET /api/email-health.
export function getSmtpStatus() {
  const missing = getMissingSmtpVars();
  if (missing.length > 0) return { configured: false, missing };
  return { configured: true, smtp: smtpProviderLabel(env.smtpHost) };
}

export class SmtpError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "SmtpError";
    this.code = code;
  }
}

// Maps Nodemailer/SMTP transport errors onto the four categories the
// frontend needs to tell apart, each with a message safe to show a user.
function classifySmtpError(error) {
  const code = (error.code || "").toUpperCase();
  const responseCode = error.responseCode;

  if (code === "EAUTH" || responseCode === 535) {
    return new SmtpError("SMTP authentication failed — check the mailbox credentials.", "SMTP_AUTH_FAILED");
  }
  if (["ECONNECTION", "ETIMEDOUT", "ESOCKET", "EDNS", "ECONNREFUSED"].includes(code)) {
    return new SmtpError("Could not connect to the mail server. Please try again shortly.", "SMTP_CONNECTION_FAILED");
  }
  if ([550, 551, 553].includes(responseCode) || code === "EENVELOPE") {
    return new SmtpError("The recipient email address was rejected by the mail server.", "SMTP_INVALID_RECIPIENT");
  }
  return new SmtpError("The email could not be sent due to an unexpected error.", "SMTP_SEND_FAILED");
}

function getTransporter() {
  if (transporter) return transporter;

  const missing = getMissingSmtpVars();
  if (missing.length > 0) {
    console.error("[email.service] SMTP not configured — missing:", missing.join(", "));
    throw new SmtpError("Email sending is not configured on the server.", "SMTP_NOT_CONFIGURED");
  }

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: { user: env.smtpUser, pass: env.smtpPass },
  });
  return transporter;
}

export async function sendMail({ to, subject, body }) {
  const mailer = getTransporter();
  try {
    await mailer.sendMail({
      from: env.smtpFrom,
      to,
      subject,
      text: body,
    });
  } catch (error) {
    if (error instanceof SmtpError) throw error;
    throw classifySmtpError(error);
  }
}
