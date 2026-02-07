import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// PaymentProvider abstraction for future Swish/Klarna support
interface PaymentProvider {
  authorize(amount: number, customerId: string, metadata: Record<string, string>): Promise<{ id: string; clientSecret?: string }>;
  capture(paymentId: string): Promise<{ success: boolean }>;
  refund(paymentId: string, amount?: number): Promise<{ success: boolean }>;
}

class StripeProvider implements PaymentProvider {
  private stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, { apiVersion: "2025-08-27.basil" });
  }

  async authorize(amount: number, customerId: string, metadata: Record<string, string>) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amount * 100, // Convert SEK to öre
      currency: "sek",
      customer: customerId,
      capture_method: "manual", // Hold funds, don't capture immediately
      metadata,
    });

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret || undefined,
    };
  }

  async capture(paymentId: string) {
    await this.stripe.paymentIntents.capture(paymentId);
    return { success: true };
  }

  async refund(paymentId: string, amount?: number) {
    await this.stripe.refunds.create({
      payment_intent: paymentId,
      amount: amount ? amount * 100 : undefined,
    });
    return { success: true };
  }
}

// Factory for payment providers - extensible for Swish/Klarna
function getPaymentProvider(provider: string = "stripe"): PaymentProvider {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    throw new Error("Payment provider not configured");
  }

  switch (provider) {
    case "stripe":
      return new StripeProvider(stripeKey);
    // Future: case "swish": return new SwishProvider();
    // Future: case "klarna": return new KlarnaProvider();
    default:
      return new StripeProvider(stripeKey);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { action, taskId, offerId, amount, paymentId, provider = "stripe" } = await req.json();
    const paymentProvider = getPaymentProvider(provider);

    let result: any;

    switch (action) {
      case "create-checkout": {
        // Create Stripe Checkout session for task payment
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
          apiVersion: "2025-08-27.basil",
        });

        // Get task and offer details
        const { data: task } = await supabaseClient
          .from("tasks")
          .select("*")
          .eq("id", taskId)
          .single();

        const { data: offer } = await supabaseClient
          .from("offers")
          .select("*")
          .eq("id", offerId)
          .single();

        if (!task || !offer) {
          throw new Error("Task or offer not found");
        }

        // Calculate fees (5% customer fee)
        const customerFee = Math.round(offer.price_sek * 0.05);
        const totalAmount = offer.price_sek + customerFee;

        // Check if customer exists in Stripe
        const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
        let customerId;
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
        } else {
          const customer = await stripe.customers.create({ email: user.email! });
          customerId = customer.id;
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          line_items: [
            {
              price_data: {
                currency: "sek",
                product_data: {
                  name: task.title,
                  description: `Uppdrag: ${task.category} i ${task.city}`,
                },
                unit_amount: totalAmount * 100,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          payment_intent_data: {
            capture_method: "manual", // Hold in escrow
            metadata: {
              task_id: taskId,
              offer_id: offerId,
              customer_user_id: user.id,
              tasker_user_id: offer.tasker_user_id,
            },
          },
          success_url: `${req.headers.get("origin")}/task/${taskId}?payment=success`,
          cancel_url: `${req.headers.get("origin")}/task/${taskId}?payment=cancelled`,
        });

        result = { url: session.url, sessionId: session.id };
        break;
      }

      case "capture": {
        // Release payment from escrow (customer approves completion)
        result = await paymentProvider.capture(paymentId);
        break;
      }

      case "refund": {
        // Refund payment (dispute resolution)
        result = await paymentProvider.refund(paymentId, amount);
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
