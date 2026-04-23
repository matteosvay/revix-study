import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthShell } from "./AuthShell";

export default function SignUp() {
  const nav = useNavigate();
  return (
    <AuthShell title="Crée ton compte ✨" subtitle="C'est gratuit, et ça change tout.">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); nav("/app"); }}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="prenom@etudiant.fr" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pwd">Mot de passe</Label>
          <Input id="pwd" type="password" placeholder="Min. 8 caractères" required />
        </div>
        <div className="space-y-2">
          <Label>Je suis étudiant en...</Label>
          <Select>
            <SelectTrigger><SelectValue placeholder="Choisis ton cursus" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bts">BTS</SelectItem>
              <SelectItem value="licence">Licence</SelectItem>
              <SelectItem value="prepa">Prépa</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="w-full rounded-full gradient-primary border-0 h-11">Créer mon compte</Button>
        <p className="text-center text-sm text-muted-foreground">
          Déjà inscrit ? <Link to="/login" className="text-primary font-medium hover:underline">Se connecter</Link>
        </p>
      </form>
    </AuthShell>
  );
}