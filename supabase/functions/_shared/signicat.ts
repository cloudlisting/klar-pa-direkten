// Shared helpers for the two signicat-bankid-* edge functions.
// Configure these as Supabase Edge Function secrets once Signicat issues
// real credentials: SIGNICAT_ISSUER, SIGNICAT_CLIENT_ID, SIGNICAT_CLIENT_SECRET,
// SIGNICAT_REDIRECT_URI, SIGNICAT_STATE_SECRET, SITE_URL.

export interface SignicatConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  stateSecret: string;
  siteUrl: string;
}

export function loadSignicatConfig(): SignicatConfig | null {
  const issuer = Deno.env.get("SIGNICAT_ISSUER");
  const clientId = Deno.env.get("SIGNICAT_CLIENT_ID");
  const clientSecret = Deno.env.get("SIGNICAT_CLIENT_SECRET");
  const redirectUri = Deno.env.get("SIGNICAT_REDIRECT_URI");
  const stateSecret = Deno.env.get("SIGNICAT_STATE_SECRET");
  const siteUrl = Deno.env.get("SITE_URL");
  if (!issuer || !clientId || !clientSecret || !redirectUri || !stateSecret || !siteUrl) {
    return null;
  }
  return { issuer, clientId, clientSecret, redirectUri, stateSecret, siteUrl };
}

// Signicat exposes a standard OIDC discovery document; we read endpoints from
// it at request time instead of hardcoding paths, since they can change.
export async function getDiscovery(issuer: string) {
  const res = await fetch(`${issuer.replace(/\/$/, "")}/.well-known/openid-configuration`);
  if (!res.ok) throw new Error(`Signicat discovery failed: ${res.status}`);
  return res.json() as Promise<{ authorization_endpoint: string; token_endpoint: string }>;
}

export type BankIdFlow = "register" | "login";

interface StatePayload {
  flow: BankIdFlow;
  uid?: string;
  nonce: string;
  exp: number;
}

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(padded + "===".slice((padded.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

// State is a signed, stateless token (payload + HMAC) so we don't need a DB
// round trip to verify the callback came from a request we issued.
export async function signState(payload: StatePayload, secret: string): Promise<string> {
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return `${body}.${toBase64Url(new Uint8Array(sig))}`;
}

export async function verifyState(state: string, secret: string): Promise<StatePayload> {
  const [body, sig] = state.split(".");
  if (!body || !sig) throw new Error("Malformed state");
  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify("HMAC", key, fromBase64Url(sig), new TextEncoder().encode(body));
  if (!valid) throw new Error("Invalid state signature");
  const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as StatePayload;
  if (payload.exp < Date.now()) throw new Error("State expired");
  return payload;
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Decodes a JWT payload without verifying the signature. Safe here because
// the token was just fetched directly from Signicat's token endpoint over a
// server-to-server TLS connection authenticated with our client secret, not
// supplied by the browser.
export function decodeJwtPayload(jwt: string): Record<string, unknown> {
  const part = jwt.split(".")[1];
  if (!part) throw new Error("Malformed JWT");
  return JSON.parse(new TextDecoder().decode(fromBase64Url(part)));
}
