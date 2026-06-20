import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import {
  loadSignicatConfig,
  getDiscovery,
  verifyState,
  sha256Hex,
  decodeJwtPayload,
} from "../_shared/signicat.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function redirectTo(siteUrl: string, path: string) {
  return new Response(null, { status: 302, headers: { ...corsHeaders, Location: `${siteUrl}${path}` } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const config = loadSignicatConfig();
  if (!config) {
    return new Response("BankID via Signicat is not configured yet.", { status: 503, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const signicatError = url.searchParams.get("error");

  if (signicatError) {
    return redirectTo(config.siteUrl, `/verify-bankid?error=${encodeURIComponent(signicatError)}`);
  }
  if (!code || !stateParam) {
    return redirectTo(config.siteUrl, "/verify-bankid?error=missing_code");
  }

  let state;
  try {
    state = await verifyState(stateParam, config.stateSecret);
  } catch (err) {
    console.error("[signicat-bankid-callback] bad state:", err);
    return redirectTo(config.siteUrl, "/verify-bankid?error=bad_state");
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const discovery = await getDiscovery(config.issuer);
    const tokenRes = await fetch(discovery.token_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: config.redirectUri,
      }),
    });
    if (!tokenRes.ok) {
      console.error("[signicat-bankid-callback] token exchange failed:", await tokenRes.text());
      return redirectTo(config.siteUrl, "/verify-bankid?error=token_exchange_failed");
    }
    const tokenJson = await tokenRes.json();
    const claims = decodeJwtPayload(tokenJson.id_token as string);
    // "nin" = national identity number (personnummer), per Signicat's BankID claim set.
    const nin = (claims.nin ?? claims.sub) as string | undefined;
    if (!nin) {
      console.error("[signicat-bankid-callback] no nin claim in id_token:", claims);
      return redirectTo(config.siteUrl, "/verify-bankid?error=no_identity_claim");
    }
    const ninHash = await sha256Hex(nin);

    if (state.flow === "register") {
      if (!state.uid) {
        return redirectTo(config.siteUrl, "/verify-bankid?error=missing_user");
      }
      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("bankid_personnummer_hash", ninHash)
        .maybeSingle();
      if (existing && existing.id !== state.uid) {
        return redirectTo(config.siteUrl, "/verify-bankid?error=personnummer_already_used");
      }

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ bankid_verified: true, bankid_personnummer_hash: ninHash } as any)
        .eq("id", state.uid);
      if (updateError) {
        console.error("[signicat-bankid-callback] profile update failed:", updateError);
        return redirectTo(config.siteUrl, "/verify-bankid?error=update_failed");
      }

      await supabaseAdmin.from("verifications").insert({
        user_id: state.uid,
        verification_type: "bankid",
        status: "verified",
        verified_at: new Date().toISOString(),
      } as any);

      return redirectTo(config.siteUrl, "/dashboard?bankid=verified");
    }

    // flow === "login": find the profile this personnummer was verified
    // against during registration, then mint a one-time sign-in link for it.
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("bankid_personnummer_hash", ninHash)
      .maybeSingle();
    if (!profile) {
      return redirectTo(config.siteUrl, "/auth?error=bankid_no_account");
    }

    const { data: userResp, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    if (userError || !userResp?.user?.email) {
      console.error("[signicat-bankid-callback] could not load user for login:", userError);
      return redirectTo(config.siteUrl, "/auth?error=bankid_login_failed");
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: userResp.user.email,
    });
    if (linkError || !linkData?.properties?.action_link) {
      console.error("[signicat-bankid-callback] generateLink failed:", linkError);
      return redirectTo(config.siteUrl, "/auth?error=bankid_login_failed");
    }

    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: linkData.properties.action_link },
    });
  } catch (err) {
    console.error("[signicat-bankid-callback] unexpected error:", err);
    return redirectTo(config.siteUrl, "/verify-bankid?error=unexpected");
  }
});
