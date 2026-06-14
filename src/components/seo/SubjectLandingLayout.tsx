import { Link } from "react-router-dom";
import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Logo } from "@/components/revix/Logo";
import { ArrowRight, Check, RotateCw } from "lucide-react";
import { PageHead } from "@/components/seo/PageHead";

export interface SubjectFlashcard {
  front: string;
  back: string;
}

export interface SubjectQuiz {
  question: string;
  choices: string[];
  correctIndex: number;
  explanation?: string;
}

export interface SubjectFAQ {
  q: string;
  a: string;
}

interface SubjectLandingProps {
  title: string;
  metaDescription: string;
  path: string;
  subject: string;
  tagline: string;
  h1: string;
  intro: ReactNode;
  highlights: string[];
  sheetTitle: string;
  sheetSections: { heading: string; points: string[] }[];
  flashcards: SubjectFlashcard[];
  quiz: SubjectQuiz[];
  faqs: SubjectFAQ[];
}

function Flashcard({ card }: { card: SubjectFlashcard }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      className="group relative w-full text-left rounded-xl border-[3px] border-foreground bg-card p-5 shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all min-h-[140px] flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono-tag text-[10px] uppercase tracking-widest text-muted-foreground">
          {flipped ? "Réponse" : "Question"}
        </span>
        <RotateCw className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <p className="text-sm font-medium">{flipped ? card.back : card.front}</p>
    </button>
  );
}

function QuizQuestion({ q, idx }: { q: SubjectQuiz; idx: number }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="rounded-xl border-[3px] border-foreground bg-card p-5 shadow-brutal-sm space-y-3">
      <p className="font-display text-base">
        <span className="text-primary mr-2">Q{idx + 1}.</span>
        {q.question}
      </p>
      <ul className="grid gap-2">
        {q.choices.map((c, i) => {
          const isPicked = picked === i;
          const isCorrect = i === q.correctIndex;
          const reveal = picked !== null;
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => setPicked(i)}
                className={`w-full text-left rounded-md border-[2.5px] border-foreground px-3 py-2 text-sm font-medium transition-all ${
                  reveal
                    ? isCorrect
                      ? "bg-primary text-primary-foreground"
                      : isPicked
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-card opacity-70"
                    : "bg-card hover:bg-secondary"
                }`}
              >
                {c}
              </button>
            </li>
          );
        })}
      </ul>
      {picked !== null && q.explanation && (
        <p className="text-xs text-muted-foreground font-medium border-t-[2px] border-foreground/20 pt-3">
          {q.explanation}
        </p>
      )}
    </div>
  );
}

export function SubjectLandingLayout({
  title,
  metaDescription,
  path,
  subject,
  tagline,
  h1,
  intro,
  highlights,
  sheetTitle,
  sheetSections,
  flashcards,
  quiz,
  faqs,
}: SubjectLandingProps) {
  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: h1,
    description: metaDescription,
    url: `https://revix-study.lovable.app${path}`,
    inLanguage: "fr",
    provider: { "@type": "Organization", name: "Revix", url: "https://revix-study.lovable.app" },
    about: subject,
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
      <PageHead title={title} description={metaDescription} path={path} jsonLd={[courseJsonLd, faqJsonLd]} />

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
            <Link to="/signup">Créer ma fiche gratuitement <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {highlights.map((b, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border-[3px] border-foreground bg-card p-4 shadow-brutal-sm">
              <Check className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
              <p className="text-sm font-medium">{b}</p>
            </div>
          ))}
        </section>

        <section className="space-y-5">
          <h2 className="font-display text-3xl md:text-4xl text-center">Exemple de fiche — {sheetTitle}</h2>
          <div className="rounded-2xl border-[3px] border-foreground bg-card p-6 md:p-8 shadow-brutal space-y-6">
            {sheetSections.map((s, i) => (
              <div key={i}>
                <h3 className="font-display text-xl mb-2 text-primary">{i + 1}. {s.heading}</h3>
                <ul className="space-y-1.5 text-sm font-medium text-muted-foreground list-disc pl-5">
                  {s.points.map((p, j) => <li key={j}>{p}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="font-display text-3xl md:text-4xl text-center">Flashcards — clique pour retourner</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {flashcards.map((c, i) => <Flashcard key={i} card={c} />)}
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="font-display text-3xl md:text-4xl text-center">Mini-quiz</h2>
          <div className="space-y-4">
            {quiz.map((q, i) => <QuizQuestion key={i} q={q} idx={i} />)}
          </div>
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
          <h2 className="font-display text-3xl md:text-4xl">Génère ta fiche {subject} en 30 sec</h2>
          <p className="mt-3 opacity-95 font-medium">Upload ton cours, l'IA fait le reste. Gratuit.</p>
          <Button
            asChild
            size="lg"
            className="mt-6 rounded-md border-[3px] border-foreground bg-card text-foreground shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all h-14 px-8 font-bold uppercase tracking-wide text-sm"
          >
            <Link to="/signup">Commencer <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </section>

        <section className="grid gap-3 sm:grid-cols-3 text-center">
          <Link to="/fiches-de-revision/droit" className="rounded-xl border-[3px] border-foreground bg-card p-4 shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all font-display">
            Fiche Droit
          </Link>
          <Link to="/fiches-de-revision/marketing" className="rounded-xl border-[3px] border-foreground bg-card p-4 shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all font-display">
            Fiche Marketing
          </Link>
          <Link to="/fiches-de-revision/analyse-litteraire" className="rounded-xl border-[3px] border-foreground bg-card p-4 shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all font-display">
            Fiche Analyse littéraire
          </Link>
        </section>
      </main>

      <footer className="border-t-[3px] border-foreground py-8 bg-card">
        <div className="container max-w-6xl flex flex-wrap gap-4 justify-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Accueil</Link>
          <Link to="/fiches-de-revision-ia" className="hover:text-foreground">Fiches IA</Link>
          <Link to="/quiz-ia" className="hover:text-foreground">Quiz IA</Link>
          <Link to="/flashcards-ia" className="hover:text-foreground">Flashcards</Link>
          <Link to="/cgu" className="hover:text-foreground">CGU</Link>
          <Link to="/confidentialite" className="hover:text-foreground">Confidentialité</Link>
        </div>
      </footer>
    </div>
  );
}