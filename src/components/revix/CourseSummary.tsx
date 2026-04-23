import { Lightbulb, BookMarked, Sparkles, Quote, ListChecks } from "lucide-react";

export type SummaryBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "definition"; term: string; text: string }
  | { kind: "key_point"; text: string }
  | { kind: "example"; text: string }
  | { kind: "tip"; text: string }
  | { kind: "list"; items: string[] };

export type CourseSummaryData = {
  intro?: string;
  sections: { title: string; blocks: SummaryBlock[] }[];
};

// Render **bold** markers from the model into <strong> with primary color
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold text-primary">{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

function Block({ b }: { b: SummaryBlock }) {
  switch (b.kind) {
    case "paragraph":
      return <p className="text-[15px] leading-relaxed text-foreground/90">{renderInline(b.text)}</p>;
    case "definition":
      return (
        <div className="rounded-xl border-l-4 border-primary bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">
            <BookMarked className="h-3 w-3" /> Définition
          </div>
          <p className="text-[15px] leading-relaxed">
            <span className="font-semibold text-primary">{b.term}</span> — {renderInline(b.text)}
          </p>
        </div>
      );
    case "key_point":
      return (
        <div className="flex gap-2 items-start">
          <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
          <p className="text-[15px] leading-relaxed">
            <span className="bg-accent/40 px-1 rounded">{renderInline(b.text)}</span>
          </p>
        </div>
      );
    case "example":
      return (
        <div className="rounded-xl bg-secondary/60 px-4 py-3 border border-border/60">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
            <Quote className="h-3 w-3" /> Exemple
          </div>
          <p className="text-[14px] leading-relaxed italic text-foreground/85">{renderInline(b.text)}</p>
        </div>
      );
    case "tip":
      return (
        <div className="rounded-xl bg-[hsl(48_95%_88%)] dark:bg-[hsl(48_70%_25%)] px-4 py-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold mb-1 text-[hsl(28_80%_30%)] dark:text-[hsl(48_95%_75%)]">
            <Lightbulb className="h-3 w-3" /> Astuce
          </div>
          <p className="text-[14px] leading-relaxed text-foreground/90">{renderInline(b.text)}</p>
        </div>
      );
    case "list":
      return (
        <ul className="space-y-1.5">
          {b.items.map((it, i) => (
            <li key={i} className="flex gap-2 items-start text-[15px] leading-relaxed">
              <ListChecks className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>{renderInline(it)}</span>
            </li>
          ))}
        </ul>
      );
  }
}

export function CourseSummary({ data }: { data: CourseSummaryData }) {
  if (!data?.sections?.length) {
    return <p className="text-sm text-muted-foreground">Aucun résumé disponible pour ce cours.</p>;
  }
  return (
    <article className="space-y-7">
      {data.intro && (
        <div className="rounded-2xl gradient-primary text-primary-foreground p-4 shadow-glow">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider opacity-90 mb-1">
            <Sparkles className="h-3 w-3" /> En bref
          </div>
          <p className="text-[15px] leading-relaxed">{data.intro}</p>
        </div>
      )}
      {data.sections.map((s, i) => (
        <section key={i} className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-xl text-primary">{i + 1}.</span>
            <h2 className="font-serif text-xl">{s.title}</h2>
          </div>
          <div className="space-y-3 pl-1">
            {s.blocks.map((b, j) => <Block key={j} b={b} />)}
          </div>
        </section>
      ))}
    </article>
  );
}