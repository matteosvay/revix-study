// Bandeau d'avertissement affiché uniquement en mode test (sandbox Stripe).
const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken?.startsWith("pk_test_")) return null;
  return (
    <div className="w-full bg-amber-100 border-b-[2.5px] border-foreground px-4 py-2 text-center text-xs font-bold text-amber-900">
      🧪 Mode TEST — utilise la carte 4242 4242 4242 4242 pour simuler un paiement.
    </div>
  );
}