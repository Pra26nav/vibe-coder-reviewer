const PLATFORMS = [
  {
    name: "Lovable",
    steps: [
      "Open your project in Lovable.",
      "Click the GitHub icon in the top toolbar.",
      "Choose \"Connect to GitHub\" and authorize Lovable if prompted.",
      "Select or create the repository you want to export to.",
      "Lovable pushes your current project to that repository automatically.",
    ],
  },
  {
    name: "Replit",
    steps: [
      "Open your Repl.",
      "Click the version control icon in the left sidebar.",
      "Click \"Create a GitHub Repo\" (or \"Connect to GitHub\" if you've linked an account before).",
      "Authorize Replit's GitHub access if this is your first time.",
      "Name the repository and confirm — Replit pushes your code and keeps it synced.",
    ],
  },
  {
    name: "Bolt",
    steps: [
      "Open your Bolt project.",
      "Click the GitHub icon near the top of the editor.",
      "Choose \"Export to GitHub\" and sign in if prompted.",
      "Pick a repository name — Bolt creates it and pushes your code.",
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-10">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Exporting your project to GitHub</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vibe Coder Reviewer scans code from a GitHub repository. If you built your project in Lovable, Replit, or Bolt, export it to GitHub first using the steps below — then paste that repository's URL on the scan page.
        </p>
      </div>

      {PLATFORMS.map((p) => (
        <div key={p.name} className="space-y-3">
          <h2 className="text-base font-medium text-foreground border-b border-border pb-2">{p.name}</h2>
          <ol className="space-y-2">
            {p.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-foreground">
                <span className="text-muted-foreground font-mono shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}