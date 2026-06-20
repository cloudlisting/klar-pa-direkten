// Central payment configuration for Moas.
//
// Live betalning är ännu inte aktiverad i appen. Stripe-koden finns i
// supabase/functions/payments men checkouten i UI:t skapar i nuläget bara en
// escrow-post. Dessa flaggor styr vad som visas/erbjuds i gränssnittet så att
// vi aldrig lovar en betalmetod som inte faktiskt fungerar live.
//
// TODO (innan production): sätt enable_stripe_checkout = true när Stripe-nycklar
// (STRIPE_SECRET_KEY) finns och checkouten anropar payments-funktionen på riktigt.
// TODO (innan production): sätt enable_klarna_payments = true först när Klarna är
// aktiverat i Stripe-dashboarden (Payment methods → Klarna) för det aktuella kontot.

export const PAYMENT_FLAGS = {
  enable_stripe_checkout: false,
  enable_klarna_payments: false,
  enable_swish_payments: false,
} as const;

// Klarna visas främst för större uppdrag. Justera fritt — matchar regeln i
// edge-funktionen (supabase/functions/payments).
export const KLARNA_MIN_AMOUNT_SEK = 1000;

export type PaymentMethodId = "card" | "swish" | "klarna";

// Visas alltid i UI som tillgängliga betalmetoder (kort är standard).
// "available" = går att välja i kassan nu, annars visas som "kommer snart".
export interface PaymentMethodInfo {
  id: PaymentMethodId;
  label: string;
  available: boolean;
}

export function isKlarnaEligible(amountSek: number): boolean {
  return PAYMENT_FLAGS.enable_klarna_payments && amountSek >= KLARNA_MIN_AMOUNT_SEK;
}

// Lista över betalmetoder att visa, i ordning. Kort är alltid standard.
export function getPaymentMethods(amountSek?: number): PaymentMethodInfo[] {
  return [
    { id: "card", label: "Kort", available: true },
    { id: "swish", label: "Swish", available: PAYMENT_FLAGS.enable_swish_payments },
    {
      id: "klarna",
      label: "Klarna",
      available:
        PAYMENT_FLAGS.enable_klarna_payments &&
        (amountSek === undefined || amountSek >= KLARNA_MIN_AMOUNT_SEK),
    },
  ];
}
