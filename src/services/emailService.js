// Sends the executive email through the backend (server/routes/email.routes.js),
// which relays it via Nodemailer over SMTP. Credentials never reach the
// browser — only { to, subject, body } crosses the wire.
export async function sendExecutiveEmail({ toEmail, subject, message }) {
  const res = await fetch("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to: toEmail, subject, body: message }),
  });

  const result = await res.json().catch(() => null);

  if (!result || !result.success) {
    throw new Error(result?.error || "Unable to send the email at this time.");
  }

  return result;
}
