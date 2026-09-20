import { useState, useRef } from "react";
import { Code2, Sparkles, Zap, Boxes, Upload, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Platform, Purpose } from "@/types";

const PLATFORMS: { id: Platform; label: string; icon: typeof Code2; needsExport: boolean }[] = [
  { id: "github", label: "GitHub", icon: Code2, needsExport: false },
  { id: "lovable", label: "Lovable", icon: Sparkles, needsExport: true },
  { id: "replit", label: "Replit", icon: Boxes, needsExport: true },
  { id: "bolt", label: "Bolt", icon: Zap, needsExport: true },
];

const PURPOSES: { id: Purpose; label: string }[] = [
  { id: "business", label: "Business" },
  { id: "project", label: "Project" },
  { id: "entertainment", label: "Entertainment" },
  { id: "other", label: "Other" },
];

interface InputPanelProps {
  onSubmitUrl: (url: string, purpose: Purpose | null) => void;
  onSubmitFile: (file: File, purpose: Purpose | null) => void;
  isSubmitting: boolean;
}

export function InputPanel({ onSubmitUrl, onSubmitFile, isSubmitting }: InputPanelProps) {
  const [platform, setPlatform] = useState<Platform>("github");
  const [url, setUrl] = useState("");
  const [purpose, setPurpose] = useState<Purpose | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customPurpose, setCustomPurpose] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activePlatform = PLATFORMS.find((p) => p.id === platform)!;

  const handleSubmit = () => {
    if (!url.trim()) return;
    onSubmitUrl(url.trim(), purpose);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onSubmitFile(file, purpose);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-3">Where's your code?</p>
        <div className="grid grid-cols-4 gap-2">
          {PLATFORMS.map((p) => {
            const Icon = p.icon;
            const active = p.id === platform;
            return (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className={`flex flex-col items-center gap-1.5 rounded-md border px-3 py-3 text-sm transition-colors ${
                  active
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40"
                }`}
              >
                <Icon size={18} />
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {activePlatform.needsExport && (
        <p className="text-sm text-muted-foreground bg-secondary rounded-md px-3 py-2">
          We'll clone from your exported GitHub repo — export {activePlatform.label} projects to GitHub first if you haven't.
        </p>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="https://github.com/username/repo"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          disabled={isSubmitting}
        />
        <Button onClick={handleSubmit} disabled={isSubmitting || !url.trim()}>
          Scan <ArrowRight size={16} />
        </Button>
      </div>

            <div>
        <p className="text-xs text-muted-foreground mb-2">What's this project for? (optional — helps tailor suggestions)</p>
        <div className="flex flex-wrap gap-2">
          {PURPOSES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                if (p.id === "other") {
                  setShowCustom(!showCustom);
                  setPurpose(showCustom ? null : customPurpose || "other");
                } else {
                  setShowCustom(false);
                  setPurpose(purpose === p.id ? null : p.id);
                }
              }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                (p.id === "other" ? showCustom : purpose === p.id)
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {showCustom && (
          <div className="mt-2 space-y-1.5">
            <input
              type="text"
              list="purpose-suggestions"
              value={customPurpose}
              onChange={(e) => {
                setCustomPurpose(e.target.value);
                setPurpose(e.target.value || "other");
              }}
              placeholder="e.g. education, portfolio, internal tool..."
              className="w-full text-sm px-3 py-1.5 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground"
            />
            <datalist id="purpose-suggestions">
              <option value="education" />
              <option value="portfolio" />
              <option value="internal tool" />
              <option value="hobby" />
              <option value="research" />
            </datalist>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 rounded-md border border-dashed border-border py-4 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
      >
        <Upload size={16} />
        Upload a .zip
      </button>
      <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={handleFileChange} />
    </div>
  );
}