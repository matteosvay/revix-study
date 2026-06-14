import { Link } from "react-router-dom";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Logo } from "@/components/revix/Logo";
import { ArrowRight, Check } from "lucide-react";
import { PageHead } from "@/components/seo/PageHead";

export interface LandingFAQ {
  q: string;
  a: string;
}

export interface LandingStep {
  title: string;
  desc: string;
}

interface FeatureLandingProps {
  title: string;
  metaDescription: string;
  path: string;
  h1: string;
  tagline: string;
  intro: ReactNode;
  bullets: string[];
  steps: LandingStep[];
  faqs: LandingFAQ[];
  ctaLabel?: string;
}

export function FeatureLandingLayout({
  title,
  metaDescription,
  path,
  h1,
  tagline,
  intro,
  bullets,
  steps,
  faqs,
  ctaLabel = "Commencer gratuitement",
}: FeatureLandingProps) {
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `Revix — ${h1}`,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web, iOS, Android",
    description: metaDescription,
    url: `https://revix-study.lovable.app${path}`,
    inLanguage: "fr",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", ratingCount: "120" },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHead
        title={title}
        description={metaDescription}
        path={path}
        jsonLd={[softwareJsonLd, faqJsonLd]}
      />

      <header className="sticky top-0 inset-x-0 z-50 border-b-[3px] border-foreground bg-card/95 backdrop-blur">
        <div className="container max-w-6xl flex h-16 items-center justify-between">
          <Link to="/"><Logo /></Link>
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

      <main className="container max-w-4xl py-16 space-y-20">
        <section className="text-center space-y-6">
          <div className="inline-block border-[2.5px] border-foreground bg-secondary px-3 py-1 rounded-md shadow-brutal-sm">
            <p className="font-mono-tag text-[10px] uppercase tracking-widest">{tagline}</p>
          </div>
          <h1 className="font-display text-4xl md:text-6xl leading-[0.95]">{h1}</h1>
          <div className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto font-medium space-y-4">
            {intro}
          </div>
          <Button
            asChild
            size="lg"
            className="rounded-md border-[3px] border-foreground bg-primary text-primary-foreground shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all h-14 px-8 font-bold uppercase tracking-wide text-sm"
          >
            <Link to="/signup">{ctaLabel} <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {bullets.map((b, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border-[3px] border-foreground bg-card p-4 shadow-brutal-sm">
              <Check className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
              <p className="text-sm font-medium">{b}</p>
            </div>
          ))}
        </section>

        <section className="space-y-6">
          <h2 className="font-display text-3xl md:text-4xl text-center">Comment ça marche</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={i} className="rounded-xl border-[3px] border-foreground bg-card p-5 shadow-brutal-sm">
                <div className="font-display text-3xl text-primary mb-2">{i + 1}.</div>
                <h3 className="font-display text-lg mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground font-medium">{s.desc}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-3xl md:text-4xl text-center">Questions fréquentes</h2>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`q${i}`}
                className="rounded-xl border-[3px] border-foreground bg-card px-5 shadow-brutal-sm"
              >
                <AccordionTrigger className="text-left font-display text-base hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm font-medium">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="rounded-2xl border-[3px] border-foreground bg-primary text-primary-foreground p-10 text-center shadow-brutal-lg">
          <h2 className="font-display text-3xl md:text-4xl">Prêt à essayer ?</h2>
          <p className="mt-3 opacity-95 font-medium">Gratuit, sans carte bancaire.</p>
          <Button
            asChild
            size="lg"
            className="mt-6 rounded-md border-[3px] border-foreground bg-card text-foreground shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all h-14 px-8 font-bold uppercase tracking-wide text-sm"
          >
            <Link to="/signup">{ctaLabel} <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </section>
      </main>

      <footer className="border-t-[3px] border-foreground py-8 bg-card">
        <div className="container max-w-6xl flex flex-wrap gap-4 justify-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Accueil</Link>
          <Link to="/fiches-de-revision-ia" className="hover:text-foreground">Fiches IA</Link>
          <Link to="/quiz-ia" className="hover:text-foreground">Quiz IA</Link>
          <Link to="/planning-de-revision" className="hover:text-foreground">Planning</Link>
          <Link to="/flashcards-ia" className="hover:text-foreground">Flashcards</Link>
          <Link to="/cgu" className="hover:text-foreground">CGU</Link>
          <Link to="/confidentialite" className="hover:text-foreground">Confidentialité</Link>
        </div>
      </footer>
    </div>
  );
}