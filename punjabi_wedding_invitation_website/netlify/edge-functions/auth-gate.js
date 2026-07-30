// ============================================================
// SHARED-PASSWORD GATE (Netlify Edge Function)
// ============================================================
//
// Sits in front of every request to the site (see netlify.toml,
// path = "/*"). Nothing — HTML, CSS, JS, images, music — is served
// until a visitor has the correct password.
//
// The real password is never stored here. It is read at request
// time from the PROTECTED_PAGE_PASSWORD environment variable,
// which must be set in the Netlify dashboard (Site settings ->
// Environment variables) or via `netlify env:set`.
//
// Flow, all on the one public URL (no separate /login path):
//   - GET  with a valid session cookie      -> pass through to the real site
//   - GET  without a valid session cookie   -> serve the password screen (401)
//   - POST (password form submit)           -> verify, set cookie, redirect to "/"
//   - GET  "/?logout=1"                     -> clear cookie, redirect to "/"
//
// ------------------------------------------------------------

const SESSION_COOKIE_NAME = "wedding_session";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours, per the brief

const encoder = new TextEncoder();

// ------------------------------------------------------------
// Web Crypto helpers
// ------------------------------------------------------------

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex) {
  if (typeof hex !== "string" || hex.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(hex)) {
    return null;
  }

  const bytes = new Uint8Array(hex.length / 2);

  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }

  return bytes;
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return bufferToHex(digest);
}

// Constant-time string compare (equal-length hex digests) so a wrong
// password can't be narrowed down via response-time differences.
function constantTimeEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;

  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return mismatch === 0;
}

// Both sides are hashed with the Web Crypto API before comparison —
// the raw submitted password is never compared with `===`.
async function verifyPassword(submittedPassword, realPassword) {
  const [submittedHash, realHash] = await Promise.all([
    sha256Hex(submittedPassword),
    sha256Hex(realPassword)
  ]);

  return constantTimeEqual(submittedHash, realHash);
}

async function getHmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// Stateless session token: "<expiryTimestamp>.<hmacSignatureHex>".
// Signed with a key derived from the site password via Web Crypto,
// so rotating the password automatically invalidates old sessions.
async function createSessionToken(secret, expiresAt) {
  const key = await getHmacKey(secret);
  const message = String(expiresAt);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return `${message}.${bufferToHex(signature)}`;
}

async function verifySessionToken(token, secret) {
  if (!token) {
    return false;
  }

  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex === -1) {
    return false;
  }

  const message = token.slice(0, separatorIndex);
  const signatureHex = token.slice(separatorIndex + 1);

  const expiresAt = Number(message);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  const signatureBytes = hexToBytes(signatureHex);
  if (!signatureBytes) {
    return false;
  }

  const key = await getHmacKey(secret);

  // crypto.subtle.verify performs a constant-time comparison internally.
  return crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(message));
}

// ------------------------------------------------------------
// Cookies
// ------------------------------------------------------------

function getCookie(request, name) {
  const header = request.headers.get("cookie");
  if (!header) {
    return null;
  }

  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) {
      continue;
    }

    if (trimmed.slice(0, eqIndex) === name) {
      return decodeURIComponent(trimmed.slice(eqIndex + 1));
    }
  }

  return null;
}

function buildSessionCookie(value, isHttps, maxAgeSeconds) {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${maxAgeSeconds}`
  ];

  // "Secure" cookies are dropped by browsers over plain http, which is
  // how `netlify dev` serves locally by default — only add it over https
  // so production stays fully compliant with the brief without breaking
  // local testing.
  if (isHttps) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

// ------------------------------------------------------------
// HTML pages (self-contained — no external CSS/JS, so they render
// even before any authentication has happened)
// ------------------------------------------------------------

function renderLoginPage(errorMessage) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Private Invitation</title>
<style>
  :root {
    --ivory: #f3e8dc;
    --cream: #fff8ef;
    --mocha-dark: #503b32;
    --deep-brown: #36261f;
    --gold: #c4974f;
    --gold-light: #f0d49c;
    --gold-dark: #9d6e2e;
  }

  * {
    box-sizing: border-box;
  }

  body {
    align-items: center;
    background:
      radial-gradient(circle at 50% 18%, rgba(241, 202, 134, 0.28), transparent 45%),
      linear-gradient(135deg, #4c382f, #6c5344 55%, #36261f);
    color: var(--cream);
    display: flex;
    font-family: Georgia, "Times New Roman", serif;
    justify-content: center;
    margin: 0;
    min-height: 100vh;
    padding: 24px;
  }

  .panel {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(244, 216, 163, 0.35);
    border-radius: 14px;
    box-shadow: 0 30px 80px rgba(20, 12, 8, 0.5);
    max-width: 420px;
    padding: clamp(32px, 6vw, 56px) clamp(24px, 5vw, 44px);
    text-align: center;
    width: 100%;
  }

  .seal {
    align-items: center;
    background: linear-gradient(135deg, var(--gold-light), var(--gold), var(--gold-dark));
    border-radius: 50%;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
    color: #4a2f16;
    display: flex;
    font-size: 1.6rem;
    height: 64px;
    justify-content: center;
    margin: 0 auto 20px;
    width: 64px;
  }

  .eyebrow {
    color: var(--gold-light);
    font-family: Arial, sans-serif;
    font-size: 0.72rem;
    letter-spacing: 0.3em;
    margin: 0 0 10px;
    text-transform: uppercase;
  }

  h1 {
    color: #fff8eb;
    font-size: clamp(1.5rem, 5vw, 2rem);
    font-weight: 600;
    margin: 0 0 12px;
  }

  p.note {
    color: rgba(255, 248, 235, 0.75);
    font-family: Arial, sans-serif;
    font-size: 0.92rem;
    margin: 0 0 26px;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  input[type="password"] {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(244, 216, 163, 0.4);
    border-radius: 6px;
    color: #fff8eb;
    font-family: Arial, sans-serif;
    font-size: 1rem;
    letter-spacing: 0.05em;
    padding: 14px 16px;
  }

  input[type="password"]::placeholder {
    color: rgba(255, 248, 235, 0.5);
  }

  input[type="password"]:focus {
    background: rgba(255, 255, 255, 0.13);
    border-color: var(--gold-light);
    outline: none;
  }

  button {
    background: linear-gradient(135deg, #d3aa62, #ad7735);
    border: 1px solid #e2bd7d;
    border-radius: 6px;
    color: #fff8eb;
    cursor: pointer;
    font-family: Arial, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    padding: 14px 20px;
    text-transform: uppercase;
    transition:
      transform 0.25s ease,
      box-shadow 0.25s ease;
  }

  button:hover {
    box-shadow: 0 14px 34px rgba(67, 42, 21, 0.4);
    transform: translateY(-2px);
  }

  .error {
    background: rgba(140, 50, 40, 0.25);
    border: 1px solid rgba(220, 120, 100, 0.4);
    border-radius: 6px;
    color: #f6d3c6;
    font-family: Arial, sans-serif;
    font-size: 0.85rem;
    margin: 0 0 4px;
    padding: 10px 14px;
  }

  @media (prefers-reduced-motion: no-preference) {
    .panel {
      animation: panelIn 0.5s ease;
    }
  }

  @keyframes panelIn {
    from {
      opacity: 0;
      transform: translateY(12px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
</head>
<body>
  <main class="panel">
    <div class="seal" aria-hidden="true">ੴ</div>
    <p class="eyebrow">You are warmly invited</p>
    <h1>This Invitation Is Private</h1>
    <p class="note">Please enter the shared password to open it.</p>
    ${errorMessage ? `<p class="error">${errorMessage}</p>` : ""}
    <form method="POST" action="/">
      <label for="password" class="visually-hidden" style="position:absolute;left:-9999px;">Password</label>
      <input
        id="password"
        type="password"
        name="password"
        placeholder="Enter password"
        autocomplete="current-password"
        required
        autofocus
      />
      <button type="submit">Open Invitation</button>
    </form>
  </main>
</body>
</html>`;
}

function renderUnavailablePage() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Unavailable</title>
<style>
  body {
    align-items: center;
    background: #2b1f19;
    color: #f3e8dc;
    display: flex;
    font-family: Arial, sans-serif;
    justify-content: center;
    margin: 0;
    min-height: 100vh;
    padding: 24px;
    text-align: center;
  }
  .box { max-width: 420px; }
  h1 { font-size: 1.25rem; margin: 0 0 10px; }
  p { color: rgba(243, 232, 220, 0.75); font-size: 0.95rem; margin: 0; }
</style>
</head>
<body>
  <div class="box">
    <h1>This page isn't available right now</h1>
    <p>Please check back soon.</p>
  </div>
</body>
</html>`;
}

const LOGOUT_SNIPPET = `<a href="/?logout=1" style="position:fixed;left:22px;bottom:22px;z-index:9999;font-family:Arial,sans-serif;font-size:0.68rem;letter-spacing:0.08em;text-transform:uppercase;color:#f0d49c;background:rgba(54,38,31,0.78);border:1px solid rgba(244,216,163,0.4);padding:8px 14px;border-radius:999px;text-decoration:none;box-shadow:0 8px 22px rgba(20,12,8,0.35);">Log out</a>`;

function htmlResponse(body, status) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store"
    }
  });
}

// ------------------------------------------------------------
// Handler
// ------------------------------------------------------------

export default async (request, context) => {
  const sitePassword = Deno.env.get("PROTECTED_PAGE_PASSWORD");

  if (!sitePassword) {
    // Fail closed: nobody gets in, including the owner, until the env
    // var is set. The real reason is only visible to the site owner,
    // via the Netlify dashboard's Edge Function logs — never to visitors.
    console.error(
      "[auth-gate] PROTECTED_PAGE_PASSWORD is not set. Set it in " +
        "Site settings -> Environment variables, then redeploy."
    );
    return htmlResponse(renderUnavailablePage(), 503);
  }

  const url = new URL(request.url);
  const isHttps = url.protocol === "https:";

  // ---- Logout ----
  if (request.method === "GET" && url.searchParams.has("logout")) {
    const headers = new Headers({
      location: "/",
      "cache-control": "private, no-store"
    });
    headers.append("set-cookie", buildSessionCookie("", isHttps, 0));
    return new Response(null, { status: 303, headers });
  }

  // ---- Login attempt ----
  if (request.method === "POST") {
    let submittedPassword = "";

    try {
      const form = await request.formData();
      submittedPassword = String(form.get("password") || "");
    } catch {
      submittedPassword = "";
    }

    const isCorrect =
      submittedPassword.length > 0 &&
      (await verifyPassword(submittedPassword, sitePassword));

    if (!isCorrect) {
      return htmlResponse(
        renderLoginPage("Incorrect password. Please try again."),
        401
      );
    }

    const expiresAt = Date.now() + SESSION_DURATION_MS;
    const token = await createSessionToken(sitePassword, expiresAt);

    const headers = new Headers({
      location: "/",
      "cache-control": "private, no-store"
    });
    headers.append(
      "set-cookie",
      buildSessionCookie(token, isHttps, SESSION_DURATION_MS / 1000)
    );

    return new Response(null, { status: 303, headers });
  }

  // ---- Normal navigation / asset request ----
  const sessionToken = getCookie(request, SESSION_COOKIE_NAME);
  const isAuthenticated = await verifySessionToken(sessionToken, sitePassword);

  if (!isAuthenticated) {
    return htmlResponse(renderLoginPage(), 401);
  }

  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("text/html")) {
    return response;
  }

  // Inject a small logout link into the real site's HTML at delivery
  // time only — the source files on disk are never modified.
  const originalHtml = await response.text();
  const injectedHtml = originalHtml.includes("</body>")
    ? originalHtml.replace("</body>", `${LOGOUT_SNIPPET}</body>`)
    : `${originalHtml}${LOGOUT_SNIPPET}`;

  const headers = new Headers(response.headers);
  headers.delete("content-length");

  return new Response(injectedHtml, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};
