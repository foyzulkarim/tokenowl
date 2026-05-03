export function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-2 bg-surface-container-high">
      <h1 className="text-headline-md text-primary">TokenOwl</h1>
      <div className="flex-1" />
      <output className="bg-surface-container-high text-on-surface-variant text-body-sm rounded-full px-3 py-1">
        No runs
      </output>
    </header>
  );
}
