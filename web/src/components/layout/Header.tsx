export function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-2 bg-surface-container-high">
      <div className="text-headline-md text-primary-container">TokenOwl</div>
      <div className="flex-1" />
      <div className="bg-surface-container-high text-on-surface-variant text-body-sm rounded-full px-3 py-1">
        No runs
      </div>
    </header>
  );
}
