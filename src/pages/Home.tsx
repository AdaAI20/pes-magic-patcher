export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="card-gaming max-w-2xl w-full p-8 space-y-6">
        <h1 className="text-4xl font-bold text-gradient-primary">
          PES Magic Patcher
        </h1>

        <p className="text-muted-foreground text-lg">
          Welcome to the PES Magic Patcher editor suite.
          Use the tools below to edit BIN files and Option Files
          with a modern gaming-style interface.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <a
            href="/pes-magic-patcher/edit-bin"
            className="bg-gradient-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold text-center glow-primary hover:scale-[1.02] transition-transform"
          >
            Edit BIN Files
          </a>

          <a
            href="/pes-magic-patcher/option-file"
            className="bg-gradient-accent text-accent-foreground px-6 py-3 rounded-lg font-semibold text-center glow-accent hover:scale-[1.02] transition-transform"
          >
            Option File Editor
          </a>
        </div>
      </div>
    </div>
  );
}
