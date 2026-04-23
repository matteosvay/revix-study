import { useState } from "react";
import { AppLayout } from "@/components/revix/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, Camera, FileText, Sparkles, Loader2, Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const messages = ["Analyse en cours...", "Extraction du contenu...", "Identification des concepts clés...", "Création des fiches..."];

export default function Upload() {
  const [step, setStep] = useState<"idle" | "loading" | "done">("idle");
  const [msgIdx, setMsgIdx] = useState(0);

  const generate = () => {
    setStep("loading");
    setMsgIdx(0);
    let i = 0;
    const id = setInterval(() => {
      i++;
      if (i >= messages.length) {
        clearInterval(id);
        setStep("done");
      } else setMsgIdx(i);
    }, 800);
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold tracking-tight">Nouveau cours ✨</h1>
        <p className="text-muted-foreground mt-1">Importe ton cours, laisse l'IA faire le reste.</p>

        {step === "idle" && (
          <div className="mt-8 space-y-6">
            <Card className="p-10 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 text-center hover:border-primary transition cursor-pointer">
              <UploadCloud className="h-12 w-12 mx-auto text-primary" />
              <p className="mt-4 font-semibold">Glisse ton cours ici (PDF ou photo)</p>
              <p className="text-sm text-muted-foreground mt-1">Ou clique pour parcourir</p>
              <div className="mt-6 flex justify-center gap-3">
                <Button variant="outline" className="rounded-full"><Camera className="h-4 w-4 mr-2" /> Photo</Button>
                <Button variant="outline" className="rounded-full"><FileText className="h-4 w-4 mr-2" /> PDF</Button>
              </div>
            </Card>

            <div className="text-center text-sm text-muted-foreground">— OU —</div>

            <div className="space-y-2">
              <Label>Coller le texte directement</Label>
              <Textarea placeholder="Colle ici tes notes de cours..." rows={6} className="rounded-xl" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Matière</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Choisis une matière" /></SelectTrigger>
                  <SelectContent>
                    {["Maths", "Histoire", "Droit", "Marketing", "Lettres", "Économie", "Philo", "Anglais"].map(s => (
                      <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date de l'examen ?</Label>
                <Input type="date" />
              </div>
            </div>

            <Button onClick={generate} size="lg" className="w-full rounded-full gradient-primary border-0 h-14 text-base shadow-glow">
              <Sparkles className="h-5 w-5 mr-2" /> Générer mes fiches avec l'IA
            </Button>
          </div>
        )}

        {step === "loading" && (
          <Card className="mt-8 p-12 rounded-2xl border-2 text-center">
            <Loader2 className="h-14 w-14 mx-auto text-primary animate-spin" />
            <p className="mt-6 font-semibold text-lg animate-fade-in" key={msgIdx}>{messages[msgIdx]}</p>
            <p className="text-sm text-muted-foreground mt-2">Encore quelques secondes...</p>
            <div className="mt-6 max-w-xs mx-auto flex gap-2">
              {messages.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= msgIdx ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
          </Card>
        )}

        {step === "done" && (
          <div className="mt-8 space-y-6 animate-scale-in">
            <Card className="p-6 rounded-2xl border-2 bg-success/5 border-success/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-success flex items-center justify-center">
                  <Check className="h-5 w-5 text-success-foreground" />
                </div>
                <div>
                  <p className="font-bold">5 fiches générées !</p>
                  <p className="text-sm text-muted-foreground">Cours : Marketing Mix BTS</p>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              {[
                { t: "Les 4P du Marketing Mix", b: "Product, Price, Place, Promotion — modèle de McCarthy (1960)" },
                { t: "Stratégie d'écrémage", b: "Prix élevé pour cibler le premium puis baisse progressive" },
                { t: "Cycle de vie produit", b: "Lancement → Croissance → Maturité → Déclin" },
                { t: "SWOT", b: "Strengths, Weaknesses, Opportunities, Threats" },
                { t: "Positionnement", b: "Image distinctive du produit dans l'esprit du consommateur" },
              ].map((f, i) => (
                <Card key={i} className="p-4 rounded-xl border-2 hover:border-primary/40 transition">
                  <p className="font-semibold text-sm">{f.t}</p>
                  <p className="text-sm text-muted-foreground mt-1">{f.b}</p>
                </Card>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <Button asChild variant="outline" className="rounded-full"><Link to="/app/fiches">Voir toutes les fiches</Link></Button>
              <Button asChild variant="outline" className="rounded-full"><Link to="/app/quizz">Générer un quizz</Link></Button>
              <Button asChild className="rounded-full gradient-primary border-0"><Link to="/app/planning">Ajouter au planning <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}