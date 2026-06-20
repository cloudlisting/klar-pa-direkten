import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { loadSignicatConfig, getDiscovery, signState, type BankIdFlow } from "../_shared/signicat.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// The browser is redirected here directly (not via fetch), so auth for the
// "register" flow travels as a query param rather than an Authorization header.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const flow = url.searchParams.get("flow") as BankIdFlow | null;
  const accessToken = url.searchParams.get("access_token");

  if (flow !== "register" && flow !== "login") {
    return new Response("flow must be 'register' or 'login'", { status: 400, headers: corsHeaders });
  }

  const config = loadSignicatConfig();
  if (!config) {
    return new Response(
      "BankID via Signicat is not configured yet (missing SIGNICAT_* secrets).",
      { status: 503, headers: corsHeaders },
    );
  }

  let uid: string | undefined;
  if (flow === "register") {
    if (!accessToken) {
      return new Response("access_token is required to verify BankID during registration", {
        status: 400,
        headers: corsHeaders,
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user) {
      return new Response("Invalid or expired session", { status: 401, headers: corsHeaders });
    }
    uid = data.user.id;
  }

  try {
    const discovery = await getDiscovery(config.issuer);
    const nonce = crypto.randomUUID();
    const state = await signState(
      { flow, uid, nonce, exp: Date.now() + 10 * 60 * 1000 },
      config.stateSecret,
    );

    const authorizeUrl = new URL(discovery.authorization_endpoint);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("client_id", config.clientId);
    authorizeUrl.searchParams.set("redirect_uri", config.redirectUri);
    authorizeUrl.searchParams.set("scope", "openid profile nin");
    authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set("nonce", nonce);
    // Which BankID variant (Swedish vs Norwegian) is decided by the OIDC
    // client configured in the Signicat dashboard, not by a param here.

    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: authorizeUrl.toString() },
    });
  } catch (err) {
    console.error("[signicat-bankid-start] error:", err);
    return new Response("Could not start BankID flow", { status: 502, headers: corsHeaders });
  }
});
