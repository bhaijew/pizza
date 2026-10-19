/**
 * Sole-What WhatsApp Gateway Bridge for Pizza Management System
 * 
 * This file connects your local `sole_what-main` instance (or cloud Railway instance)
 * directly with the Pizza Management System.
 * 
 * Usage:
 *   node scripts/sole-what-bridge.js
 * 
 * Requirements:
 *   - Node.js 18+
 *   - Local sole_what running on http://localhost:3001 OR cloud gateway at https://solewhat-production-33f6.up.railway.app
 */

const https = require("https");
const http = require("http");

const CONFIG = {
  // Sole-What Gateway URL (change to http://localhost:3001 if using local sole_what-main)
  GATEWAY_URL: process.env.WHATSAPP_GATEWAY_URL || "https://solewhat-production-33f6.up.railway.app",
  
  // Default session ID (configure in Pizza Admin Settings)
  SESSION_ID: process.env.WHATSAPP_SESSION_ID || "rhs5o",
  
  // API Key for Sole-What
  API_KEY: process.env.WHATSAPP_API_KEY || "wag_qF0HVpcLGTxuqGZvBLO1I2057gJUwiV8",
  
  // Pizza App URL
  PIZZA_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};

console.log("=================================================");
console.log("   SOLE-WHAT WHATSAPP GATEWAY CONNECTOR BRIDGE   ");
console.log("   Pizza Management System & FloDesktop POS     ");
console.log("=================================================");
console.log(`[*] Target Gateway: ${CONFIG.GATEWAY_URL}`);
console.log(`[*] Active Session: ${CONFIG.SESSION_ID}`);
console.log(`[*] Pizza App URL:  ${CONFIG.PIZZA_APP_URL}`);
console.log("-------------------------------------------------");

/**
 * Standardize phone number for Pakistani / International WhatsApp
 */
function formatPhone(raw) {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("03") && digits.length === 11) {
    digits = "92" + digits.slice(1);
  } else if (digits.startsWith("3") && digits.length === 10) {
    digits = "92" + digits;
  }
  return digits;
}

/**
 * Send WhatsApp message via Sole-What
 */
async function sendWhatsApp(toPhone, messageText) {
  const formatted = formatPhone(toPhone);
  const endpoint = `${CONFIG.GATEWAY_URL.replace(/\/+$/, "")}/api/messages/${CONFIG.SESSION_ID}/send`;
  
  const payload = JSON.stringify({
    to: formatted,
    text: messageText,
  });

  const urlObj = new URL(endpoint);
  const isHttps = urlObj.protocol === "https:";
  const client = isHttps ? https : http;

  const options = {
    hostname: urlObj.hostname,
    port: urlObj.port || (isHttps ? 443 : 80),
    path: urlObj.pathname + (urlObj.search || ""),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
      "x-api-key": CONFIG.API_KEY,
    },
    timeout: 15000,
  };

  return new Promise((resolve, reject) => {
    const req = client.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, data: parsed });
          } else {
            resolve({ success: false, status: res.statusCode, error: parsed.message || parsed.error || data });
          }
        } catch {
          resolve({ success: res.statusCode < 300, status: res.statusCode, raw: data });
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out after 15 seconds"));
    });

    req.write(payload);
    req.end();
  });
}

// Check gateway connectivity
console.log("[*] Testing Sole-What Gateway connectivity...");
const pingUrl = new URL(CONFIG.GATEWAY_URL);
const pingClient = pingUrl.protocol === "https:" ? https : http;
const pingReq = pingClient.get(CONFIG.GATEWAY_URL, (res) => {
  console.log(`[✔] Sole-What Gateway responded with status: ${res.statusCode}`);
  console.log("[✔] Bridge is ready. To send a test message from CLI run:");
  console.log(`    node -e 'require("./scripts/sole-what-bridge.js").sendWhatsApp("03001234567", "Salam from Pizza System!")'`);
});
pingReq.on("error", (err) => {
  console.warn(`[!] Note: Gateway test returned: ${err.message}. If running local sole_what, ensure 'npm run dev' is running inside sole_what-main directory.`);
});

module.exports = {
  CONFIG,
  formatPhone,
  sendWhatsApp,
};
