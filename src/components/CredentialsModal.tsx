import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield } from "lucide-react";
import { saveFlowCredentials } from "@/lib/sentinelle-api";
import { useToast } from "@/hooks/use-toast";

interface CredentialsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  flowId: string;
  flowLabel: string;
  /** Called after credentials are saved successfully */
  onSaved?: () => void;
  /** Pre-fill values for editing */
  initialEmail?: string;
  initialName?: string;
}

export default function CredentialsModal({
  open,
  onOpenChange,
  projectId,
  flowId,
  flowLabel,
  onSaved,
  initialEmail = "",
  initialName = "",
}: CredentialsModalProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!email.trim() || !password.trim()) return;
    setSaving(true);
    try {
      await saveFlowCredentials(projectId, flowId, {
        email: email.trim(),
        password: password.trim(),
        name: name.trim() || undefined,
      });
      toast({ title: "Identifiants enregistrés" });
      onSaved?.();
      onOpenChange(false);
    } catch (e: unknown) {
      toast({
        title: "Erreur",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-neon" />
            Configurer un compte test
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Sentinelle utilisera ce compte pour se connecter automatiquement à
            votre application et explorer les parcours internes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs">Email</Label>
            <Input
              type="email"
              placeholder="exemple@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background border-border text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Mot de passe</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background border-border text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">
              Nom utilisateur{" "}
              <span className="text-muted-foreground">(optionnel)</span>
            </Label>
            <Input
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background border-border text-sm"
            />
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Les identifiants sont stockés de manière sécurisée et ne sont jamais
            exposés côté client. Sentinelle les utilise uniquement pour tester
            votre application automatiquement.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !email.trim() || !password.trim()}
            className="bg-neon text-background hover:bg-neon/90"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
