// ============================================================
// RSVP -> ntfy PUSH NOTIFICATION (Netlify Function)
// ============================================================
//
// Netlify Forms calls this endpoint as an "Outgoing webhook" the
// moment a verified wedding-rsvp submission is stored (see
// netlify/edge-functions/auth-gate.js for how that submission reaches
// Netlify Forms in the first place, and the README/report for the
// exact dashboard steps). This function's only job is to turn that
// webhook payload into one short, clean push notification on ntfy —
// it does not touch the RSVP storage or the site's password gate,
// and it never forwards the raw webhook JSON anywhere.
//
// Deployed URL (once live): https://<your-site>.netlify.app/.netlify/functions/rsvp-notify
// That is the exact URL to paste into:
//   Netlify dashboard -> Forms -> your form -> Settings and usage
//   -> Form notifications -> Add notification -> Outgoing webhook
//   (labelled "HTTP POST request" in some dashboard versions)
//
// Required environment variable:
//   NTFY_TOPIC     - the ntfy topic to publish to (e.g. GoldenSeal-RSVP)
// Optional environment variables:
//   NTFY_SERVER     - defaults to https://ntfy.sh (set this if self-hosting)
//   WEBHOOK_SECRET  - if set, must match the "Secret" field Netlify lets
//                     you set on the same Outgoing webhook notification;
//                     when both are set, incoming requests are verified
//                     via Netlify's X-Webhook-Signature header (HMAC
//                     SHA-256 JWT) before anything is sent to ntfy. If
//                     left unset, verification is skipped — the endpoint
//                     still works, just without that extra check. See
//                     the final report for how to turn this on.
//
// ------------------------------------------------------------

const crypto = require("node:crypto");

const DEFAULT_NTFY_SERVER = "https://ntfy.sh";

// ------------------------------------------------------------
// Netlify webhook signature (optional — only runs if WEBHOOK_SECRET
// is set). Netlify signs outgoing webhook requests with a compact
// HS256 JWT in the X-Webhook-Signature header, whose payload carries
// a sha256 hex digest of the raw request body. Verifying it proves
// the request actually came from Netlify's Forms system and wasn't
// sent by anyone else who happened to find this URL.
// ------------------------------------------------------------

function base64UrlDecode(input) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + padding, "base64");
}

function verifyWebhookSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || typeof signatureHeader !== "string") {
    return false;
  }

  const parts = signatureHeader.split(".");
  if (parts.length !== 3) {
    return false;
  }

  const [headerPart, payloadPart, signaturePart] = parts;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${headerPart}.${payloadPart}`)
    .digest();

  const actualSignature = base64UrlDecode(signaturePart);

  if (
    expectedSignature.length !== actualSignature.length ||
    !crypto.timingSafeEqual(expectedSignature, actualSignature)
  ) {
    return false;
  }

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadPart).toString("utf8"));
  } catch {
    return false;
  }

  const bodyHash = crypto.createHash("sha256").update(rawBody, "utf8").digest("hex");

  return typeof payload.sha256 === "string" && payload.sha256 === bodyHash;
}

// ------------------------------------------------------------
// Payload parsing — Netlify's outgoing-webhook JSON usually nests the
// submitted fields under payload.data, but this checks a couple of
// reasonable shapes defensively rather than assuming one exact
// structure. Either way, only the specific field names below are ever
// read — nothing else in the webhook body (ip, user_agent, headers,
// etc.) is ever touched, let alone forwarded.
// ------------------------------------------------------------

function extractSubmittedFields(parsedBody) {
  const candidates = [
    parsedBody && parsedBody.payload && parsedBody.payload.data,
    parsedBody && parsedBody.data,
    parsedBody
  ];

  const data = candidates.find(
    (candidate) => candidate && typeof candidate === "object" && typeof candidate.name === "string"
  );

  if (!data) {
    return null;
  }

  return {
    name: String(data.name || "").trim(),
    attendance: String(data.attendance || "").trim(),
    guests: String(data.guests || "").trim(),
    phone: String(data.phone || "").trim(),
    message: String(data.message || "").trim(),
    guest_type: String(data.guest_type || "").trim()
  };
}

// ------------------------------------------------------------
// Notification formatting
// ------------------------------------------------------------

function isAccepting(attendance) {
  return attendance.toLowerCase().includes("accept");
}

function isDeclining(attendance) {
  return attendance.toLowerCase().includes("declin");
}

function buildNotification(fields) {
  const accepting = isAccepting(fields.attendance);
  const declining = isDeclining(fields.attendance);

  const verb = accepting ? "accepted 🎉" : declining ? "declined" : fields.attendance || "responded";
  const name = fields.name || "A guest";

  const lines = [
    `${name} ${verb}`,
    `Guests: ${fields.guests || "-"}`,
    `Phone: ${fields.phone || "-"}`
  ];

  if (fields.message) {
    lines.push(`Message: "${fields.message}"`);
  }

  if (fields.guest_type) {
    lines.push(`Guest type: ${fields.guest_type}`);
  }

  const tags = ["ring"];
  if (accepting) {
    tags.push("tada");
  } else if (declining) {
    tags.push("x");
  }

  return {
    title: "💍 New Wedding RSVP",
    message: lines.join("\n"),
    tags,
    priority: 4 // ntfy "high" priority
  };
}

async function publishToNtfy(notification, topic, server) {
  const response = await fetch(server, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, ...notification })
  });

  if (!response.ok) {
    throw new Error(`ntfy responded with ${response.status}`);
  }
}

// ------------------------------------------------------------
// Handler
// ------------------------------------------------------------

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const rawBody = event.body || "";
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (webhookSecret) {
    const signatureHeader =
      (event.headers && (event.headers["x-webhook-signature"] || event.headers["X-Webhook-Signature"])) || "";

    if (!verifyWebhookSignature(rawBody, signatureHeader, webhookSecret)) {
      console.error("[rsvp-notify] Webhook signature verification failed — request rejected.");
      return { statusCode: 401, body: "Invalid signature" };
    }
  }

  let parsedBody;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    console.error("[rsvp-notify] Could not parse webhook body as JSON.");
    // Acknowledge with 200 anyway so Netlify doesn't treat this as a
    // failed delivery and keep retrying a payload that will never parse.
    return { statusCode: 200, body: "ignored: unparseable body" };
  }

  const fields = extractSubmittedFields(parsedBody);
  if (!fields) {
    console.error("[rsvp-notify] Webhook body did not contain recognisable RSVP fields.");
    return { statusCode: 200, body: "ignored: no RSVP fields found" };
  }

  const topic = process.env.NTFY_TOPIC;
  if (!topic) {
    console.error("[rsvp-notify] NTFY_TOPIC is not set — set it in Site settings -> Environment variables.");
    return { statusCode: 200, body: "ignored: NTFY_TOPIC not configured" };
  }

  const server = process.env.NTFY_SERVER || DEFAULT_NTFY_SERVER;
  const notification = buildNotification(fields);

  try {
    await publishToNtfy(notification, topic, server);
  } catch (error) {
    console.error("[rsvp-notify] Failed to publish to ntfy:", error.message);
    // Still 200: the RSVP itself was already safely stored by Netlify
    // Forms before this webhook ever fired, so there's nothing to roll
    // back — a failed push notification shouldn't look like a failed
    // RSVP to Netlify's retry logic.
    return { statusCode: 200, body: "stored, but ntfy publish failed" };
  }

  return { statusCode: 200, body: "ok" };
};
