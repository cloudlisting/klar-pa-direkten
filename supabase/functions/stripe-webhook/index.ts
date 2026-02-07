import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!signature || !webhookSecret) {
      throw new Error("Missing signature or webhook secret");
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log(`Processing Stripe event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const paymentIntentId = session.payment_intent as string;

        // Get payment intent for metadata
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        const { task_id, offer_id, customer_user_id, tasker_user_id } = paymentIntent.metadata;

        if (task_id && offer_id) {
          // Calculate fees from the amount
          const amountSek = Math.round(session.amount_total! / 100);
          const customerFee = Math.round(amountSek * 0.05 / 1.05);
          const taskPrice = amountSek - customerFee;
          const taskerFee = Math.round(taskPrice * 0.10);

          // Create payment record
          await supabaseAdmin.from("payments").insert({
            task_id,
            payer_user_id: customer_user_id,
            payee_user_id: tasker_user_id,
            amount_sek: taskPrice,
            customer_fee_sek: customerFee,
            tasker_fee_sek: taskerFee,
            platform_fee_sek: customerFee + taskerFee,
            status: "held_in_escrow",
            provider: "stripe",
            provider_reference_id: paymentIntentId,
          });

          // Update offer status
          await supabaseAdmin
            .from("offers")
            .update({ status: "accepted" })
            .eq("id", offer_id);

          // Reject other offers
          await supabaseAdmin
            .from("offers")
            .update({ status: "rejected" })
            .eq("task_id", task_id)
            .neq("id", offer_id);

          // Update task status
          await supabaseAdmin
            .from("tasks")
            .update({
              status: "assigned",
              assigned_tasker_id: tasker_user_id,
            })
            .eq("id", task_id);

          // Create chat thread
          const { data: existingThread } = await supabaseAdmin
            .from("chat_threads")
            .select("id")
            .eq("task_id", task_id)
            .eq("customer_user_id", customer_user_id)
            .eq("tasker_user_id", tasker_user_id)
            .maybeSingle();

          if (!existingThread) {
            await supabaseAdmin.from("chat_threads").insert({
              task_id,
              customer_user_id,
              tasker_user_id,
            });
          }
        }
        break;
      }

      case "payment_intent.canceled": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { task_id } = paymentIntent.metadata;

        if (task_id) {
          await supabaseAdmin
            .from("payments")
            .update({ status: "failed" })
            .eq("provider_reference_id", paymentIntent.id);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
