import { Link } from "react-router-dom";
import { PageHead } from "@/components/seo/PageHead";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Logo } from "@/components/revix/Logo";
import { PLANS as PRICING, PLAN_PERKS, formatPrice, VAT_NOTICE } from "@/lib/pricing";
import { Upload, Brain, Calendar, Flame, Check, ArrowRight, BookOpen, Target } from "lucide-react";

const features = [
  { icon: Upload, title: "Upload magique", desc: "PDF, photo de cours, screenshot : l'IA digère tout en quelques secondes." },
  { icon: Brain, title: "Quizz adaptatifs", desc: "QCM, vrai/faux, questions ouvertes corrigées par l'IA." },
  { icon: Calendar, title: "Planning IA", desc: "Un planning de révisions sur mesure selon ta deadline d'examen." },
  { icon: Flame, title: "Streak & XP", desc: "Garde le rythme : streaks, niveaux, quêtes journalières et hebdo." },
  { icon: Target, title: "Révisions ciblées", desc: "Heatmap des chapitres faibles + boss du jour pour combler tes lacunes." },
  { icon: BookOpen, title: "Fiches & flashcards", desc: "Fiches claires, flashcards SM-2, export PDF & Anki." },
];

const plans = [
  {
    name: "Gratuit",
    price: "0 €",
    period: "",
    features: ["20 crédits IA offerts à l'inscription", "Environ 5 fiches ou 10 quizz", "Flashcards et révisions illimitées", "Accès communauté"],
    cta: "Commencer",
    highlighted: false,
  },
  {
    name: PRICING.pro.label,
    price: formatPrice(PRICING.pro.priceTTC),
    period: "/mois TTC",
    features: PLAN_PERKS.pro.slice(0, 4),
    cta: "Passer en Pro",
    highlighted: true,
    badge: "Populaire",
  },
  {
    name: PRICING.max.label,
    price: formatPrice(PRICING.max.priceTTC),
    period: "/mois TTC",
    features: PLAN_PERKS.max,
    cta: "Devenir Max",
    highlighted: false,
  },
];

const steps = [
  { n: "1", icon: Upload, title: "Tu déposes ton cours", desc: "Un PDF, une photo de tes notes ou un simple copier-coller. Rien à mettre en forme." },
  { n: "2", icon: Brain, title: "L'IA lit et prépare", desc: "En quelques secondes, elle sort une fiche claire, un quizz adapté et un planning." },
  { n: "3", icon: Flame, title: "Tu révises pour de vrai", desc: "Quizz, flashcards, streaks. Tu vois ce que tu maîtrises et ce qui coince." },
];

const faqs = [
  { q: "Est-ce vraiment gratuit ?", a: "Oui, sans carte bancaire. Tu reçois 20 crédits IA à l'inscription, de quoi faire environ 5 fiches ou 10 quizz. Ensuite, les flashcards et les révisions de ce que tu as déjà généré restent illimitées." },
  { q: "Mes cours sont-ils en sécurité ?", a: "100%. Tes données restent en Europe et ne sont jamais utilisées pour entraîner d'IA tierces." },
  { q: "Quels formats sont acceptés ?", a: "PDF, photos (JPG/PNG), screenshots et texte collé directement. L'IA s'occupe du reste." },
  { q: "Puis-je annuler à tout moment ?", a: "Oui, sans engagement. Tu peux passer du Pro/Max au Gratuit en un clic depuis ton profil." },
  { q: "Diplo marche pour toutes les matières ?", a: "Oui : droit, marketing, maths, histoire, philo, langues, médecine, tout ce qui est texte ou notes." },
];

export default function Landing() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Diplo",
    url: "https://revix-study.lovable.app/",
    inLanguage: "fr-FR",
  };
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      <PageHead
        title="Diplo, fiches, quizz et planning IA pour étudiants"
        description="L'app de révision IA : génère fiches, quizz et plannings personnalisés à partir de tes PDF et photos de cours. Gratuit, BTS, Licence, Prépa."
        path="/"
        jsonLd={[websiteJsonLd, faqJsonLd]}
      />
      {/* Nav */}
      <header className="sticky top-0 inset-x-0 z-50 border-b-[3px] border-foreground bg-card/95 backdrop-blur">
        <div className="container max-w-6xl flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold uppercase tracking-wide">
            <a href="#features" className="hover:text-primary transition">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-primary transition">Tarifs</a>
            <a href="#faq" className="hover:text-primary transition">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="font-bold uppercase text-xs tracking-wide">
              <Link to="/login">Connexion</Link>
            </Button>
            <Button
              asChild
              className="rounded-md border-[2.5px] border-foreground bg-primary text-primary-foreground shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all font-bold uppercase text-xs tracking-wide"
            >
              <Link to="/signup">S'inscrire</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="container max-w-5xl text-center relative z-10">
          <span className="inline-block border-[2.5px] border-foreground bg-accent text-foreground shadow-brutal-sm font-mono-tag text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-md mb-6">
 L'IA française pour étudiants
          </span>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl tracking-tight leading-[0.95]">
            Tes cours en{" "}
            <span className="inline-block bg-primary text-primary-foreground px-3 -rotate-1 border-[3px] border-foreground shadow-brutal-sm">
              fiches & quizz
            </span>{" "}
            en 30 secondes
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
 Diplo lit tes PDF et photos, génère des fiches claires, des quizz personnalisés et un planning. Tout ça pendant que tu prends ton café.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="rounded-md border-[3px] border-foreground bg-primary text-primary-foreground shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all font-bold uppercase tracking-wide h-14 px-8 text-sm"
            >
              <Link to="/signup">
                Essayer gratuitement <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-md border-[3px] border-foreground bg-card shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all font-bold uppercase tracking-wide h-14 px-8 text-sm"
            >
              <a href="#features">Voir comment ça marche</a>
            </Button>
          </div>
          <p className="mt-6 font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground">
 Pas de CB · RGPD · Fait en France
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-24 border-t-[3px] border-foreground bg-secondary/40 relative">
        <div className="container max-w-6xl relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-display text-3xl md:text-5xl tracking-tight">
              Tout pour <span className="bg-accent px-2 inline-block -rotate-1 border-[3px] border-foreground shadow-brutal-sm">cartonner</span>
            </h2>
            <p className="mt-4 text-muted-foreground font-medium">Six outils pensés par un étudiant, pour les étudiants.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border-[3px] border-foreground bg-card p-6 shadow-brutal"
              >
                <div className="h-12 w-12 rounded-lg border-[2.5px] border-foreground bg-primary text-primary-foreground flex items-center justify-center mb-4 shadow-brutal-sm">
                  <f.icon className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <h3 className="font-display text-xl">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 lg:py-24 border-t-[3px] border-foreground">
        <div className="container max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-display text-3xl md:text-5xl tracking-tight">Des tarifs étudiants, vraiment.</h2>
            <p className="mt-4 text-muted-foreground font-medium">Commence gratuitement, passe en Pro ou Max quand tu veux.</p>
            <p className="mt-2 font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground">{VAT_NOTICE}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-xl border-[3px] border-foreground bg-card p-7 transition-all ${
                  p.highlighted
                    ? "shadow-brutal-primary lg:-translate-y-2"
                    : "shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                }`}
              >
                {p.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md border-[2.5px] border-foreground bg-accent text-foreground font-mono-tag text-[10px] uppercase tracking-wider shadow-brutal-sm">
                    {p.badge}
                  </span>
                )}
                <h3 className="font-display text-2xl">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-5xl">{p.price}</span>
                  <span className="text-muted-foreground font-mono-tag text-[10px] uppercase">{p.period}</span>
                </div>
                <ul className="mt-6 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-2 border-foreground bg-primary/10 flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                      </span>
                      <span className="font-medium">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className={`w-full mt-7 rounded-md border-[2.5px] border-foreground font-bold uppercase tracking-wide text-xs h-11 transition-all ${
                    p.highlighted
                      ? "bg-primary text-primary-foreground shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                      : "bg-card text-foreground shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                  }`}
                >
                  <Link to="/signup">{p.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-20 lg:py-24 border-t-[3px] border-foreground bg-secondary/40">
        <div className="container max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-display text-3xl md:text-5xl tracking-tight">Comment ça marche</h2>
            <p className="mt-4 text-muted-foreground font-medium">Trois temps, de ton cours à ta révision.</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-stretch gap-4 md:gap-2">
            {steps.map((s, i) => (
              <div key={s.n} className="flex flex-col md:flex-row md:items-stretch md:flex-1 gap-4 md:gap-2">
                <div className="flex-1 flex gap-4 items-start">
                  <div className="shrink-0 h-11 w-11 rounded-md border-[2.5px] border-foreground bg-primary text-primary-foreground font-display text-xl flex items-center justify-center shadow-brutal-sm">
                    {s.n}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <s.icon className="h-4 w-4" strokeWidth={2.5} />
                      <h3 className="font-display text-lg">{s.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:flex items-center text-foreground/30 px-1" aria-hidden="true">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 lg:py-24 border-t-[3px] border-foreground">
        <div className="container max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl tracking-tight text-center mb-12">Questions fréquentes</h2>
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`q${i}`}
                className="rounded-xl border-[3px] border-foreground bg-card px-5 shadow-brutal-sm"
              >
                <AccordionTrigger className="text-left font-display text-base hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm font-medium">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t-[3px] border-foreground bg-secondary/40">
        <div className="container max-w-4xl">
          <div className="rounded-2xl border-[3px] border-foreground bg-primary text-primary-foreground p-10 lg:p-14 text-center shadow-brutal-lg relative">
            <h2 className="font-display text-3xl md:text-5xl">Prêt à réviser autrement ?</h2>
            <p className="mt-4 text-base md:text-lg opacity-95 font-medium">Commence gratuitement, sans carte bancaire.</p>
            <Button
              asChild
              size="lg"
              className="mt-8 rounded-md border-[3px] border-foreground bg-card text-foreground shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all h-14 px-8 font-bold uppercase tracking-wide text-sm"
            >
              <Link to="/signup">
                Créer mon compte <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-[3px] border-foreground py-10 bg-card">
        <div className="container max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Logo />
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold uppercase tracking-wider text-muted-foreground justify-center">
              <a href="#features" className="hover:text-foreground transition-colors">Fonctionnalités</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">Tarifs</a>
              <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
              <Link to="/cgu" className="hover:text-foreground transition-colors">CGU</Link>
              <Link to="/cgv" className="hover:text-foreground transition-colors">CGV</Link>
              <Link to="/confidentialite" className="hover:text-foreground transition-colors">Confidentialité</Link>
              <Link to="/mentions-legales" className="hover:text-foreground transition-colors">Mentions légales</Link>
            </nav>
            <p className="font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground">
              Fait en France
            </p>
          </div>
          <div className="mt-6 pt-6 border-t-[2px] border-foreground/10 text-center">
            <p className="font-mono-tag text-[10px] text-muted-foreground uppercase tracking-wider">
              © {new Date().getFullYear()} Diplo
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
