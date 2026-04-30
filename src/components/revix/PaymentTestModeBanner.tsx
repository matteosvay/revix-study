// Bandeau d'avertissement affiché uniquement en mode test (sandbox Stripe).
// Rendu en `fixed` pour ne pas casser la mise en page (bottom nav, layout
// téléphone) qui s'attend à un viewport plein écran.
const rawToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;
const clientToken = rawToken?.replace(/^["']|["']$/g, "");

export function PaymentTestModeBanner() {
  if (!clientToken?.startsWith("pk_test_")) return null;
  return (
    <div className="fixed top-0 inset-x-0 z-[60] bg-amber-100 border-b-[2.5px] border-foreground px-4 py-1 text-center text-[10px] font-bold text-amber-900 pointer-events-none">
      🧪 Mode TEST — carte 4242 4242 4242 4242
    </div>
  );
}