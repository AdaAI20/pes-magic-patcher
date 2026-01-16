export default function TopNavbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-lg font-semibold tracking-wide">
        PES Magic Patcher
      </h1>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>2021 Pro</span>
      </div>
    </header>
  );
}
