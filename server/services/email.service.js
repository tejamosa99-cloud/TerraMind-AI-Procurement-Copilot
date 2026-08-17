import { Resend } from "resend";

export function getMissingSmtpVars() {
  return process.env.RESEND_API_KEY ? [] : ["RESEND_API_KEY"];
}

export function getSmtpStatus() {
  return {
    configured: Boolean(process.env.RESEND_API_KEY),
    provider: "resend",
  };
}

export class SmtpError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "SmtpError";
    this.code = code;
  }
}

export async function sendMail({ to, subject, body }) {
  if (!process.env.RESEND_API_KEY) {
    console.error("[email.service] RESEND_API_KEY is missing");

    throw new SmtpError(
      "Email sending is not configured on the server.",
      "EMAIL_NOT_CONFIGURED"
    );
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log("[email.service] Sending email via Resend to:", to);

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM,
      to: [to],
      subject,
      text: body,
    });

    if (error) {
      console.error("[email.service] Resend error:", error);

      throw new SmtpError(
        error.message || "The email could not be sent.",
        "EMAIL_SEND_FAILED"
      );
    }

    console.log("[email.service] Email sent successfully:", data?.id);

    return data;
  } catch (error) {
    if (error instanceof SmtpError) {
      throw error;
    }

    console.error("[email.service] Unexpected Resend error:", error);

    throw new SmtpError(
      "The email could not be sent due to an unexpected error.",
      "EMAIL_SEND_FAILED"
    );
  }
}
