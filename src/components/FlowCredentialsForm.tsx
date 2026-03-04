import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, CheckCircle, Loader2, Pencil, Eye, EyeOff } from "lucide-react";
import type { SuggestedFlow } from "@/lib/sentinelle-types";

interface FlowCredentialsFormProps {
  flow: SuggestedFlow;
  onSave: (flowId: string, credentials: { email: string; password: string }) => Promise<void>;
  onRetest?: () => void;
}

export function FlowCredentialsForm({ flow, onSave, onRetest }: FlowCredentialsFormProps) {
  const hasCredentials = !!flow.credentials;
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(flow.credentials?.email ?? "");
  const [password, setPassword] = useState(flow.credentials?.password ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setSaving(true);
    try {
      await onSave(flow.id, { email: email.trim(), password: password.trim() });
      setSaved(true);
      setEditing(false);
    } catch {
      /* handled upstream */
    } finally {
      setSaving(false);
    }
  };

  // Already configured
  if (hasCredentials && !editing) {
    return (
      <div className="flex items-center gap-2 mt-2">
        {saved ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-status-pass">
            <CheckCircle className="h-3.5 w-3.5" /> Identifiants enregistrés
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-status-pass">
            <Lock className="h-3.5 w-3.5" /> Identifiants configurés
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="font-mono text-xs h-7 px-2"
          onClick={() => { setEditing(true); setSaved(false); }}
        >
          <Pencil className="h-3 w-3 mr-1" /> Modifier
        </Button>
        {saved && onRetest && (
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-xs h-7 px-2"
            onClick={onRetest}
          >
            Relancer le test
          </Button>
        )}
      </div>
    );
  }

  // Needs credentials or editing
  return (
    <div className="mt-2 space-y-3">
      {!hasCredentials && !editing && (
        <div className="rounded-md border border-status-pending/30 bg-status-pending/10 px-3 py-2">
          <p className="font-mono text-xs text-status-pending">
            Ce parcours nécessite des identifiants de test pour un résultat fiable.
          </p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="font-mono text-[10px]">Email de test</Label>
            <Input
              type="email"
              placeholder="email@test.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="font-mono text-xs h-8"
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="font-mono text-[10px]">Mot de passe de test</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="font-mono text-xs h-8 pr-8"
                required
              />
              <button
                type="button"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={saving} className="font-mono text-xs h-7">
            {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Lock className="mr-1 h-3 w-3" />}
            Enregistrer les identifiants
          </Button>
          {editing && (
            <Button type="button" variant="ghost" size="sm" className="font-mono text-xs h-7" onClick={() => setEditing(false)}>
              Annuler
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
