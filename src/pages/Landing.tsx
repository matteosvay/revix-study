import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Logo } from "@/components/revix/Logo";
import { Upload, Brain, Calendar, Flame, Check, ArrowRight, Star, BookOpen, Target, Sparkles } from "lucide-react";
import { testimonials } from "@/data/mock";

const features = [
  { icon: Upload, title: "Upload magique", desc: "PDF, photo de cours, screenshot — l'IA digère tout en quelques secondes." },
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
    features: ["2 quizz IA / jour", "5 messages coach / jour", "1 fiche IA / semaine", "Accès communauté"],
    cta: "Commencer",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "4,99 €",
    period: "/mois TTC",
    features: ["10 quizz IA / jour", "20 messages coach / jour", "5 fiches IA / semaine", "Planning IA hebdo"],
    cta: "Passer en Pro",
    highlighted: true,
    badge: "Populaire",
  },
  {
    name: "Max",
    price: "8,99 €",
    period: "/mois TTC",
    features: ["30 quizz IA / jour", "50 messages coach / jour", "3 fiches IA / jour", "Planning IA illimité", "Mode Oral 🎤"],
    cta: "Devenir Max",
    highlighted: false,
  },
];

const faqs = [
  { q: "Est-ce vraiment gratuit ?", a: "Oui. Le plan Gratuit te donne 2 quizz IA par jour, 5 messages coach et 1 fiche IA par semaine, sans carte bancaire." },
  { q: "Mes cours sont-ils en sécurité ?", a: "100%. Tes données restent en Europe et ne sont jamais utilisées pour entraîner d'IA tierces." },
  { q: "Quels formats sont acceptés ?", a: "PDF, photos (JPG/PNG), screenshots et texte collé directement. L'IA s'occupe du reste." },
  { q: "Puis-je annuler à tout moment ?", a: "Oui, sans engagement. Tu peux passer du Pro/Max au Gratuit en un clic depuis ton profil." },
  { q: "Revix marche pour toutes les matières ?", a: "Oui — droit, marketing, maths, histoire, philo, langues, médecine... tout ce qui est texte ou notes." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      <div className="absolute inset-0 dots-bg pointer-events-none opacity-40" />

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
            ✨ L'IA française pour étudiants
          </span>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl tracking-tight leading-[0.95]">
            Transforme tes cours en{" "}
            <span className="inline-block bg-primary text-primary-foreground px-3 -rotate-1 border-[3px] border-foreground shadow-brutal-sm">
              fiches & quizz
            </span>{" "}
            en 30 secondes
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
            Revix lit tes PDF et photos, génère des fiches claires, des quizz personnalisés et un planning. Tout ça pendant que tu prends ton café ☕.
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
            Pas de CB · RGPD 🇫🇷 · Fait en France
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
                className="rounded-xl border-[3px] border-foreground bg-card p-6 shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
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

      {/* Testimonials */}
      <section className="py-20 lg:py-24 border-t-[3px] border-foreground bg-secondary/40">
        <div className="container max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-display text-3xl md:text-5xl tracking-tight">Ils ont validé leur année</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-xl border-[3px] border-foreground bg-card p-6 shadow-brutal"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-accent text-foreground" strokeWidth={2} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed font-medium">"{t.quote}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-foreground">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-display">{t.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-mono-tag text-[10px] uppercase font-bold tracking-wider">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
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
            <Sparkles className="absolute top-4 right-4 h-6 w-6" />
            <Sparkles className="absolute bottom-4 left-4 h-6 w-6" />
            <h2 className="font-display text-3xl md:text-5xl">Prêt à diviser ton temps de révision par 3 ?</h2>
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
            <nav className="flex flex-wrap gap-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <a href="#features" className="hover:text-foreground">Fonctionnalités</a>
              <a href="#pricing" className="hover:text-foreground">Tarifs</a>
              <a href="#faq" className="hover:text-foreground">FAQ</a>
              <a href="#" className="hover:text-foreground">CGU</a>
              <a href="#" className="hover:text-foreground">Confidentialité</a>
            </nav>
            <p className="font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground">
              Fait avec ❤️ en France 🇫🇷
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
