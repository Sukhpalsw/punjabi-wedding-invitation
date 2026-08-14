// ============================================================
// Shared helpers for rsvp-notify.js and rsvp-view.js
// ============================================================
//
// A leading underscore keeps Netlify from treating this file as its
// own deployable function — it's purely a module the other two
// import from, so the attendance/guest-type classification logic
// (and the store name / retention cutoff) can't quietly drift apart
// between the notification and the details page.
//
// ------------------------------------------------------------

const RSVP_STORE_NAME = "rsvp-records";

// Retention: the private details page stays reachable well past the
// wedding (11 December 2026) rather than expiring after a few days —
// a single fixed cutoff is simpler and easier to reason about than a
// rolling per-record TTL, and Netlify Blobs has no built-in expiry to
// lean on anyway.
const RSVP_VIEW_EXPIRES_AT = new Date("2027-01-31T23:59:59.000Z");

function isAccepting(attendance) {
  return String(attendance || "").toLowerCase().includes("accept");
}

function isDeclining(attendance) {
  return String(attendance || "").toLowerCase().includes("declin");
}

// Display text for the details page — distinct from the shorter
// wording rsvp-notify.js uses in the push notification itself.
function formatAttendanceStatus(attendance) {
  if (isAccepting(attendance)) {
    return "Accepted";
  }

  if (isDeclining(attendance)) {
    return "Declined";
  }

  return attendance || "Unknown";
}

// normal -> "Normal Guest", special -> "Special Guest", and anything
// else (a future role, e.g. "vip") is title-cased automatically so a
// new guest_type value doesn't need a code change here to display
// sensibly.
function formatGuestType(guestType) {
  const value = String(guestType || "").trim();

  if (value.toLowerCase() === "normal") {
    return "Normal Guest";
  }

  if (value.toLowerCase() === "special") {
    return "Special Guest";
  }

  if (!value) {
    return "Guest";
  }

  return `${value.charAt(0).toUpperCase()}${value.slice(1)} Guest`;
}

module.exports = {
  RSVP_STORE_NAME,
  RSVP_VIEW_EXPIRES_AT,
  isAccepting,
  isDeclining,
  formatAttendanceStatus,
  formatGuestType
};
