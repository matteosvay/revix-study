import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Logo } from "@/components/revix/Logo";
import { Upload, Brain, Calendar, Mic, Check, Sparkles, ArrowRight, Star } from "lucide-react";
import { testimonials, faqs } from "@/data/mock";

const features = [
  { icon: Upload, title: "Upload Magique", desc: "PDF, photo de cours, screenshot — l'IA digère tout en quelques secondes." },
  { icon: Brain, title: "Quizz Adaptatifs", desc: "Des questions qui s'ajustent à ton niveau et ciblent tes lacunes." },
  { icon: Calendar, title: "Planning IA", desc: "Un planning de révisions sur mesure selon ta deadline d'examen." },
  { icon: Mic, title: "Mode Oral", desc: "Entraîne-toi à l'oral avec une IA qui te corrige en direct." },
];

const plans = [
  { name: "Gratuit", price: "0€", period: "", features: ["3 uploads / semaine", "Fiches basiques", "Accès communauté"], cta: "Commencer", highlighted: false },
  { name: "Pro", price: "9,99€", period: "/mois", features: ["Uploads illimités", "Quizz adaptatifs", "Planning IA", "Export PDF & Anki"], cta: "Essayer 7j gratuits", highlighted: true, badge: "Le plus populaire" },
  { name: "Premium", price: "14,99€", period: "/mois", features: ["Tout le plan Pro", "Mode Oral 🎤", "Prédiction de notes", "Coach IA prioritaire"], cta: "Devenir Premium", highlighted: false },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/70 border-b">
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
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute top-40 right-0 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        </div>
        <div className="container text-center max-w-4xl">
          <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1.5 text-sm">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> L'IA française pour étudiants sérieux
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
            Transforme tes cours en{" "}
            <span className="gradient-text">fiches, quizz et planning</span>{" "}
            en 30 secondes
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Revix lit tes PDF et photos de cours, génère des fiches claires, des quizz personnalisés et un planning de révisions. Tout ça pendant que tu prends ton café.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="rounded-full gradient-primary border-0 shadow-glow text-base h-14 px-8">
              <Link to="/signup">Essayer gratuitement <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full text-base h-14 px-8">
              <a href="#features">Voir comment ça marche</a>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">Pas de carte bancaire • RGPD 🇫🇷 • 12 000+ étudiants</p>
        </div>

        {/* Hero card preview */}
        <div className="container mt-16 max-w-4xl">
          <Card className="rounded-2xl border-2 shadow-glow overflow-hidden animate-float">
            <div className="gradient-dark p-2">
              <div className="flex gap-1.5 px-2 py-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="bg-card rounded-xl p-6 grid md:grid-cols-3 gap-4">
                {[
                  { t: "Droit des contrats", c: "8 fiches", p: 72 },
                  { t: "Marketing Mix", c: "6 fiches", p: 45 },
                  { t: "Baudelaire", c: "5 fiches", p: 88 },
                ].map((x) => (
                  <div key={x.t} className="rounded-xl border p-4 text-left">
                    <p className="font-semibold text-sm">{x.t}</p>
                    <p className="text-xs text-muted-foreground mt-1">{x.c}</p>
                    <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full gradient-primary" style={{ width: `${x.p}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-28 bg-muted/30">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Tout ce dont tu as besoin pour cartonner</h2>
            <p className="mt-4 text-lg text-muted-foreground">Quatre outils pensés par des étudiants, pour des étudiants.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="p-6 rounded-2xl border-2 hover:border-primary/40 hover:-translate-y-1 transition-all shadow-card">
                <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-4 shadow-soft">
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-lg">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 lg:py-28">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Des tarifs étudiants, vraiment.</h2>
            <p className="mt-4 text-lg text-muted-foreground">Commence gratuitement, passe en Pro quand tu veux.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((p) => (
              <Card key={p.name} className={`p-8 rounded-2xl relative ${p.highlighted ? "border-2 border-primary shadow-glow scale-105" : "border-2"}`}>
                {p.badge && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary border-0 rounded-full px-3">{p.badge}</Badge>}
                <h3 className="font-bold text-xl">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">{p.price}</span>
                  <span className="text-muted-foreground">{p.period}</span>
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
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Ils ont validé leur année avec Revix</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <Card key={t.name} className="p-6 rounded-2xl border-2 shadow-card">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed">"{t.quote}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <Avatar><AvatarFallback className="gradient-primary text-primary-foreground text-xs font-semibold">{t.avatar}</AvatarFallback></Avatar>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 lg:py-28">
        <div className="container max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-center mb-12">Questions fréquentes</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`q${i}`} className="border rounded-xl px-5 mb-3 bg-card">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container max-w-4xl">
          <Card className="p-10 lg:p-16 rounded-3xl gradient-hero text-center border-0 shadow-glow">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white">Prêt à diviser ton temps de révision par 3 ?</h2>
            <p className="mt-4 text-white/90 text-lg">Commence gratuitement, sans carte bancaire.</p>
            <Button asChild size="lg" variant="secondary" className="mt-8 rounded-full h-14 px-8 text-base">
              <Link to="/signup">Créer mon compte <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <Logo />
              <Badge variant="secondary" className="rounded-full">RGPD compliant 🇫🇷</Badge>
            </div>
            <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground">Fonctionnalités</a>
              <a href="#pricing" className="hover:text-foreground">Tarifs</a>
              <a href="#faq" className="hover:text-foreground">FAQ</a>
              <a href="#" className="hover:text-foreground">CGU</a>
              <a href="#" className="hover:text-foreground">Confidentialité</a>
            </nav>
            <p className="text-xs text-muted-foreground">© 2025 Revix · Made in France</p>
          </div>
        </div>
      </footer>
    </div>
  );
}