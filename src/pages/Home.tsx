export default function Home() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gradient-primary">
        PES Magic Patcher
      </h1>

      <p className="mt-4 text-muted-foreground max-w-xl">
        Welcome! Use the menu to open EDIT.BIN, OPTION FILE (.TED),
        and PES 2021 save editors.
      </p>

      <div className="mt-6 flex gap-4">
        <a
          href="/pes-magic-patcher/edit-bin"
          className="px-4 py-2 rounded-lg bg-gradient-primary text-black font-semibold glow-primary"
        >
          EDIT.BIN Editor
        </a>

        <a
          href="/pes-magic-patcher/option-file"
          className="px-4 py-2 rounded-lg bg-secondary text-foreground border border-border"
        >
          Option File (.TED)
        </a>
      </div>
    </div>
  );
}
