import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Logo } from "@/components/revix/Logo";
import { Upload, Brain, Calendar, Flame, Check, Sparkles, ArrowRight, Star } from "lucide-react";
import { testimonials, faqs } from "@/data/mock";
import { Tape, Pin, ScribbleUnderline } from "@/components/revix/AcademicDecor";

const features = [
  { icon: Upload, title: "Upload magique", desc: "PDF, photo de cours, screenshot — l'IA digère tout en quelques secondes.", tape: "yellow" },
  { icon: Brain, title: "Quizz adaptatifs", desc: "QCM, vrai/faux, questions ouvertes corrigées par l'IA. Choisis ton format.", tape: "pink" },
  { icon: Calendar, title: "Planning IA", desc: "Un planning de révisions sur mesure selon ta deadline d'examen.", tape: "mint" },
  { icon: Flame, title: "Streak & XP", desc: "Garde le rythme : streaks, niveaux, quêtes journalières et hebdo.", tape: "yellow" },
];

const plans = [
  {
    name: "Gratuit",
    price: "0 €",
    period: "",
    features: [
      "2 quizz IA / jour",
      "5 messages coach / jour",
      "1 fiche IA / semaine",
      "Accès communauté",
    ],
    cta: "Commencer",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "4,99 €",
    period: "/mois TTC",
    features: [
      "10 quizz IA / jour",
      "20 messages coach / jour",
      "5 fiches IA / semaine",
      "Planning IA hebdo",
    ],
    cta: "Passer en Pro",
    highlighted: true,
    badge: "Le plus populaire",
  },
  {
    name: "Max",
    price: "8,99 €",
    period: "/mois TTC",
    features: [
      "30 quizz IA / jour",
      "50 messages coach / jour",
      "3 fiches IA / jour",
      "Planning IA illimité",
      "Mode Oral 🎤",
    ],
    cta: "Devenir Max",
    highlighted: false,
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/60">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition">Fonctionnalités</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition">Tarifs</a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost"><Link to="/login">Connexion</Link></Button>
            <Button asChild className="rounded-full gradient-primary border-0"><Link to="/signup">S'inscrire</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 relative overflow-hidden paper-grain">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 -left-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute top-40 right-0 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
        </div>

        {/* Post-its scattered */}
        <div className="hidden md:block absolute top-28 left-[8%] h-20 w-20 postit p-2 drift-slow font-hand text-sm">
          révise<br/>+ vite ✨
        </div>
        <div className="hidden md:block absolute top-44 right-[10%] h-16 w-16 postit postit-pink drift-slow" style={{ animationDelay: "2s" }} />
        <div className="hidden lg:block absolute top-[60%] left-[5%] h-14 w-32" style={{ background: "hsl(var(--tape-mint) / 0.85)", transform: "rotate(-12deg)" }} />
        <div className="hidden lg:block absolute top-[55%] right-[6%] h-12 w-12 rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, hsl(0 90% 70%), hsl(0 75% 45%))", boxShadow: "0 4px 8px rgba(0,0,0,0.25)" }} />

        <div className="container text-center max-w-4xl relative z-10">
          <span className="rubber-stamp stamp-pop inline-block mb-6">L'IA française pour étudiants</span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif tracking-tight leading-[1.05]">
            Transforme tes cours en{" "}
            <span className="font-hand text-primary">fiches, quizz & planning</span>{" "}
            en 30 secondes
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Revix lit tes PDF et photos, génère des fiches claires, des quizz personnalisés et un planning. Tout ça pendant que tu prends ton café ☕.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="rounded-full gradient-primary border-0 shadow-glow text-base h-14 px-8">
              <Link to="/signup">Essayer gratuitement <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full text-base h-14 px-8">
              <a href="#features">Voir comment ça marche</a>
            </Button>
          </div>
          <p className="mt-6 font-mono-tag text-[11px] uppercase tracking-wider text-muted-foreground">Pas de CB · RGPD 🇫🇷 · Fait en France</p>
        </div>

        {/* Hero preview : 3 cartes notebook inclinées */}
        <div className="container mt-16 max-w-4xl">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { t: "Droit des contrats", c: "8 fiches", p: 72, tape: "yellow", tilt: "tilt-l" },
              { t: "Marketing Mix", c: "6 fiches", p: 45, tape: "pink", tilt: "tilt-r" },
              { t: "Baudelaire", c: "5 fiches", p: 88, tape: "mint", tilt: "tilt-l" },
            ].map((x, i) => (
              <div key={x.t} className={`notebook-card dog-ear p-5 relative ${x.tilt}`}>
                <Tape variant={x.tape as any} position="top-right" />
                <Pin color={i === 0 ? "red" : i === 1 ? "blue" : "purple"} className="absolute -top-1 left-4" />
                <p className="font-serif text-lg">{x.t}</p>
                <span className="label-tape mt-2">{x.c}</span>
                <div className="mt-4 ruler-bar !h-2.5">
                  <div className="ruler-fill" style={{ width: `${x.p}%` }} />
                </div>
                <p className="font-mono-tag text-[10px] uppercase mt-1.5 text-muted-foreground">Quizz · {x.p}%</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-28 bg-muted/40 relative">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl md:text-5xl tracking-tight">
              Tout ce qu'il te faut pour <span className="marker-yellow">cartonner</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">Quatre outils pensés par un étudiant, pour les étudiants.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={f.title} className={`notebook-card dog-ear p-6 relative hover:shadow-glow hover:-translate-y-1 transition-all ${i % 2 === 0 ? "tilt-l" : "tilt-r"}`}>
                <Tape variant={f.tape as any} position="top" />
                <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-4 shadow-soft">
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-serif text-xl">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 lg:py-28">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl md:text-5xl tracking-tight">Des tarifs étudiants, vraiment.</h2>
            <p className="mt-4 text-lg text-muted-foreground">Commence gratuitement, passe en Pro quand tu veux.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((p, i) => (
              <div
                key={p.name}
                className={`notebook-card dog-ear p-8 relative ${p.highlighted ? "shadow-glow scale-105 z-10" : ""} ${i === 0 ? "tilt-l" : i === 2 ? "tilt-r" : ""}`}
                style={p.highlighted ? { borderLeftColor: "hsl(var(--primary))" } : undefined}
              >
                {p.badge && (
                  <div className="postit absolute -top-4 right-2 px-3 py-1 font-hand text-sm" style={{ transform: "rotate(8deg)" }}>
                    {p.badge}
                  </div>
                )}
                <h3 className="font-serif text-2xl">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-hand text-5xl text-primary">{p.price}</span>
                  <span className="text-muted-foreground font-mono-tag text-xs">{p.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className={`w-full mt-8 rounded-full ${p.highlighted ? "gradient-primary border-0" : ""}`} variant={p.highlighted ? "default" : "outline"}>
                  <Link to="/signup">{p.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-28 bg-muted/40 corkboard !rounded-none">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl md:text-5xl tracking-tight text-white drop-shadow-md">Ils ont validé leur année avec Revix</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <div key={t.name} className={`postit ${i % 2 === 1 ? "postit-pink" : ""} p-6 relative ${i === 0 ? "tilt-l" : i === 2 ? "tilt-r" : ""}`}>
                <Pin color={i === 0 ? "red" : i === 1 ? "blue" : "purple"} className="absolute -top-1.5 left-1/2 -translate-x-1/2" />
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-yellow-500 text-yellow-600" />
                  ))}
                </div>
                <p className="font-hand text-lg leading-snug text-foreground/85">"{t.quote}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <Avatar><AvatarFallback className="gradient-primary text-primary-foreground text-xs font-semibold">{t.avatar}</AvatarFallback></Avatar>
                  <div>
                    <p className="font-mono-tag text-xs uppercase font-bold">{t.name}</p>
                    <p className="text-xs text-foreground/60">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 lg:py-28">
        <div className="container max-w-3xl">
          <h2 className="font-serif text-3xl md:text-5xl tracking-tight text-center mb-12">Questions fréquentes</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`q${i}`} className="notebook-card !pl-12 px-5 mb-3 border-0">
                <AccordionTrigger className="text-left font-serif text-lg hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground font-hand text-lg">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container max-w-4xl">
          <div className="p-10 lg:p-16 rounded-3xl gradient-hero text-center shadow-glow relative overflow-hidden">
            <Pin color="red" className="absolute top-4 left-6" />
            <Pin color="blue" className="absolute top-4 right-6" />
            <h2 className="font-serif text-3xl md:text-5xl text-white">Prêt à diviser ton temps de révision par 3 ?</h2>
            <p className="font-hand text-2xl mt-4 text-white/95">Commence gratuitement, sans carte bancaire.</p>
            <Button asChild size="lg" variant="secondary" className="mt-8 rounded-full h-14 px-8 text-base">
              <Link to="/signup">Créer mon compte <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <Logo />
              <span className="rubber-stamp-blue rubber-stamp">RGPD 🇫🇷</span>
            </div>
            <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground">Fonctionnalités</a>
              <a href="#pricing" className="hover:text-foreground">Tarifs</a>
              <a href="#faq" className="hover:text-foreground">FAQ</a>
              <a href="#" className="hover:text-foreground">CGU</a>
              <a href="#" className="hover:text-foreground">Confidentialité</a>
            </nav>
            <p className="font-hand text-base text-muted-foreground">Fait avec ❤️ en France 🇫🇷</p>
          </div>
        </div>
      </footer>
    </div>
  );
}