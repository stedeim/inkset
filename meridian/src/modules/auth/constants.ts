// Pure constants shared between the Edge middleware and the Node session layer.
// Must stay free of any Node-only imports so it can be bundled for the Edge.
export const SESSION_COOKIE = "meridian_session";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
