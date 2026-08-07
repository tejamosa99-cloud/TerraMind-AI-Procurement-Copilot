import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { getMissingSmtpVars } from "./services/email.service.js";

function printStartupBanner() {
  if (env.geminiApiKey) {
    console.log("✓ Gemini configured");
  } else {
    console.log("⚠ Gemini configuration missing");
    console.log("  - GEMINI_API_KEY");
  }

  const missingSmtp = getMissingSmtpVars();
  if (missingSmtp.length === 0) {
    console.log("✓ Email configured");
  } else {
    console.log("⚠ Email configuration missing");
    console.log("Missing SMTP configuration:");
    missingSmtp.forEach((name) => console.log(`  - ${name}`));
  }
}

const app = createApp();
printStartupBanner();
app.listen(env.port, () => {
  console.log(`TerraMind AI backend listening on port ${env.port}.`);
});
