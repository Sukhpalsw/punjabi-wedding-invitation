// ============================================================
// PRIVATE RSVP DETAILS PAGE (Netlify Function)
// ============================================================
//
// Renders the page a guest's RSVP notification links to. Reached via
// the clean URL /rsvp/view/<token>, which netlify.toml rewrites to
// this function with the token in the PATH (/.netlify/functions/rsvp-view/<token>)
// — see the redirect rule there and the exemption in
// netlify/edge-functions/auth-gate.js that lets this one route bypass
// the site's guest password gate. The token itself
// is the only thing that authorizes viewing a given RSVP: it's a
// cryptographically random crypto.randomUUID() (122 bits of entropy),
// used purely as an opaque lookup key into Netlify Blobs — nothing
// about a guest's identity is derivable from it, and correctly
// guessing one is computationally infeasible. A wrong, malformed, or
// expired token always gets back the exact same "not found" response,
// so there's no way to distinguish "never existed" from "expired"
// from "wrong guess".
//
// This page is completely self-contained (inline CSS, no JS, no
// dependency on the main site's style.css/script.js) so it stays
// fast and works on its own regardless of the guest gate.
//
// ------------------------------------------------------------

const { connectLambda, getStore } = require("@netlify/blobs");
const {
  RSVP_STORE_NAME,
  RSVP_VIEW_EXPIRES_AT,
  formatAttendanceStatus,
  isAccepting,
  formatGuestType
} = require("./_rsvp-shared.js");

const TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const NOT_FOUND_MESSAGE = "RSVP details not found or no longer available.";

// ------------------------------------------------------------
// Formatting helpers
// ------------------------------------------------------------

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatSubmittedAt(isoString) {
  const date = new Date(isoString);
  if (!isoString || Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  // Pinned to the wedding's own timezone (Punjab, India) rather than
  // left to default to whichever region Netlify happens to run this
  // function in — without an explicit zone here, the same timestamp
  // would render differently (and misleadingly) depending on server
  // location, which has nothing to do with when the RSVP actually came in.
  const zone = "Asia/Kolkata";

  const datePart = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: zone
  }).format(date);

  const timePart = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: zone
  }).format(date);

  return `${datePart}, ${timePart} IST`;
}

// tel: hrefs should only carry phone-safe characters — the visible
// text still shows exactly what the guest typed (escaped, not altered).
function sanitizePhoneForHref(phone) {
  return phone.replace(/[^0-9+\-() ]/g, "");
}

// Netlify has a known issue where a redirect placeholder substituted
// into a query string in netlify.toml's `to` field comes through
// empty (https://github.com/netlify/cli/issues/4273), so the token
// travels in the path instead (see netlify.toml) and is read from
// event.path here — the last path segment, regardless of whether that
// path is the original /rsvp/view/<token> or the rewritten
// /.netlify/functions/rsvp-view/<token>, since the token is the last
// segment either way. The query string is still checked first as a
// harmless fallback in case that ever works too.
function extractToken(event) {
  const fromQuery = event.queryStringParameters && event.queryStringParameters.token;
  if (fromQuery) {
    return fromQuery;
  }

  const path = event.path || "";
  const segments = path.split("/").filter(Boolean);
  return segments.length ? segments[segments.length - 1] : null;
}

// ------------------------------------------------------------
// HTML rendering — self-contained, matches the main site's ivory /
// champagne-gold / mocha palette without importing its stylesheet.
// ------------------------------------------------------------

const SHARED_STYLES = `
  :root {
    --ivory: #f3e8dc;
    --cream: #fff8ef;
    --warm-beige: #ddc7b5;
    --soft-mocha: #947565;
    --mocha: #72574a;
    --mocha-dark: #503b32;
    --deep-brown: #36261f;
    --gold: #c4974f;
    --gold-light: #f0d49c;
    --gold-dark: #9d6e2e;
    --decline: #8a4a3a;
  }

  * {
    box-sizing: border-box;
  }

  body {
    background:
      radial-gradient(circle at 50% 0%, rgba(241, 202, 134, 0.35), transparent 55%),
      linear-gradient(160deg, var(--ivory), var(--warm-beige));
    color: var(--mocha-dark);
    display: flex;
    font-family: Georgia, "Times New Roman", serif;
    justify-content: center;
    margin: 0;
    min-height: 100vh;
    padding: clamp(20px, 5vw, 48px) 16px;
  }

  .panel {
    background: linear-gradient(165deg, var(--cream), var(--ivory));
    border: 1px solid rgba(196, 151, 79, 0.4);
    border-radius: 6px;
    box-shadow: 0 30px 80px rgba(48, 29, 21, 0.22);
    max-width: 480px;
    padding: clamp(30px, 6vw, 52px) clamp(22px, 6vw, 40px);
    text-align: center;
    width: 100%;
  }

  @media (prefers-reduced-motion: no-preference) {
    .panel {
      animation: panelIn 0.5s ease;
    }
  }

  @keyframes panelIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .seal {
    font-size: 2rem;
    margin-bottom: 6px;
  }

  .eyebrow {
    color: var(--gold-dark);
    font-family: Arial, Helvetica, sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.28em;
    margin: 0 0 18px;
    text-transform: uppercase;
  }

  a {
    color: var(--gold-dark);
  }

  a:focus-visible,
  [tabindex]:focus-visible {
    border-radius: 3px;
    outline: 2px solid var(--gold-dark);
    outline-offset: 3px;
  }
`;

function renderShell({ title, bodyHtml, status }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="robots" content="noindex, nofollow" />
<title>${escapeHtml(title)}</title>
<style>${SHARED_STYLES}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

function renderNotFoundPage() {
  const body = `  <main class="panel" role="main">
    <p class="seal" aria-hidden="true">💍</p>
    <p class="eyebrow">RSVP Details</p>
    <p style="color: var(--mocha); font-size: 1.05rem; line-height: 1.7; margin: 0;">
      ${escapeHtml(NOT_FOUND_MESSAGE)}
    </p>
  </main>`;

  return renderShell({ title: "RSVP Details", bodyHtml: body });
}

function renderDetailsPage(record) {
  const accepted = isAccepting(record.attendance);
  const statusText = formatAttendanceStatus(record.attendance);
  const statusSymbol = accepted ? "✓" : "✕";
  const statusColorVar = accepted ? "var(--gold-dark)" : "var(--decline)";

  const phone = String(record.phone || "").trim();
  const phoneHtml = phone
    ? `<a href="tel:${escapeHtml(sanitizePhoneForHref(phone))}">${escapeHtml(phone)}</a>`
    : "Not provided";

  const guests = String(record.guests || "").trim();
  const guestsHtml = escapeHtml(guests || "-");

  const message = String(record.message || "").trim();
  const messageHtml = message ? escapeHtml(message) : "No message";

  const submittedHtml = escapeHtml(formatSubmittedAt(record.submitted_at));
  const guestTypeHtml = escapeHtml(formatGuestType(record.guest_type));
  const nameHtml = escapeHtml(record.name || "Guest");

  const body = `  <main class="panel" role="main">
    <p class="seal" aria-hidden="true">💍</p>
    <p class="eyebrow">RSVP Details</p>

    <h1 style="color: var(--deep-brown); font-size: clamp(1.6rem, 5vw, 2.1rem); margin: 0 0 14px;">
      ${nameHtml}
    </h1>

    <p style="
      align-items: center;
      background: rgba(196, 151, 79, 0.14);
      border: 1px solid rgba(196, 151, 79, 0.4);
      border-radius: 999px;
      color: ${statusColorVar};
      display: inline-flex;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 0.85rem;
      font-weight: 700;
      gap: 8px;
      letter-spacing: 0.08em;
      margin: 0 0 26px;
      padding: 8px 18px;
      text-transform: uppercase;
    ">
      <span aria-hidden="true">${statusSymbol}</span>
      ${escapeHtml(statusText)}
    </p>

    <hr style="border: none; border-top: 1px solid rgba(196, 151, 79, 0.35); margin: 0 0 26px;" />

    <section aria-labelledby="guest-info-heading" style="text-align: left;">
      <h2 id="guest-info-heading" style="
        color: var(--gold-dark);
        font-family: Arial, Helvetica, sans-serif;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.2em;
        margin: 0 0 16px;
        text-transform: uppercase;
      ">Guest Information</h2>

      <dl style="display: flex; flex-direction: column; gap: 16px; margin: 0;">
        <div>
          <dt style="color: var(--soft-mocha); font-family: Arial, Helvetica, sans-serif; font-size: 0.8rem; letter-spacing: 0.04em; margin-bottom: 3px;">Phone</dt>
          <dd style="color: var(--mocha-dark); font-size: 1.05rem; margin: 0;">${phoneHtml}</dd>
        </div>
        <div>
          <dt style="color: var(--soft-mocha); font-family: Arial, Helvetica, sans-serif; font-size: 0.8rem; letter-spacing: 0.04em; margin-bottom: 3px;">Number of guests</dt>
          <dd style="color: var(--mocha-dark); font-size: 1.05rem; margin: 0;">${guestsHtml}</dd>
        </div>
        <div>
          <dt style="color: var(--soft-mocha); font-family: Arial, Helvetica, sans-serif; font-size: 0.8rem; letter-spacing: 0.04em; margin-bottom: 3px;">Message</dt>
          <dd style="color: var(--mocha-dark); font-size: 1.05rem; line-height: 1.6; margin: 0;">${messageHtml}</dd>
        </div>
        <div>
          <dt style="color: var(--soft-mocha); font-family: Arial, Helvetica, sans-serif; font-size: 0.8rem; letter-spacing: 0.04em; margin-bottom: 3px;">Submitted</dt>
          <dd style="color: var(--mocha-dark); font-size: 1.05rem; margin: 0;">${submittedHtml}</dd>
        </div>
      </dl>
    </section>

    <hr style="border: none; border-top: 1px solid rgba(196, 151, 79, 0.35); margin: 26px 0;" />

    <section aria-labelledby="guest-access-heading" style="text-align: left;">
      <h2 id="guest-access-heading" style="
        color: var(--gold-dark);
        font-family: Arial, Helvetica, sans-serif;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.2em;
        margin: 0 0 10px;
        text-transform: uppercase;
      ">Guest Access</h2>
      <p style="color: var(--mocha-dark); font-size: 1.1rem; margin: 0;">${guestTypeHtml}</p>
    </section>
  </main>`;

  return renderShell({ title: `RSVP — ${record.name || "Guest"}`, bodyHtml: body });
}

function htmlResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store, no-cache, must-revalidate"
    },
    body
  };
}

// ------------------------------------------------------------
// Handler
// ------------------------------------------------------------

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const token = extractToken(event);

  if (!token || !TOKEN_PATTERN.test(token)) {
    console.error("[rsvp-view] No usable token in this request.", {
      path: event.path,
      queryStringParameters: event.queryStringParameters
    });
    return htmlResponse(404, renderNotFoundPage());
  }

  let record = null;

  try {
    connectLambda(event);
    const store = getStore(RSVP_STORE_NAME);
    // Strong consistency: Netlify Blobs' default eventual-consistency
    // reads are cached at the edge and can lag a very recent write by
    // up to ~60s — a guest could plausibly tap the notification before
    // that catches up. This read is low-traffic enough that the extra
    // latency is a non-issue.
    record = await store.get(token, { type: "json", consistency: "strong" });
  } catch (error) {
    console.error("[rsvp-view] Failed to read RSVP record from storage:", error.message);
    return htmlResponse(404, renderNotFoundPage());
  }

  if (!record) {
    // Reached only with a well-formed token that simply isn't in the
    // store — logged (token only, no guest data) so this is
    // distinguishable from the "no usable token" case above if the
    // page still shows "not found" after this fix.
    console.error("[rsvp-view] Token was well-formed but not found in storage:", token);
    return htmlResponse(404, renderNotFoundPage());
  }

  if (Date.now() > RSVP_VIEW_EXPIRES_AT.getTime()) {
    return htmlResponse(404, renderNotFoundPage());
  }

  return htmlResponse(200, renderDetailsPage(record));
};
