import { BottomNavLinks } from "./NavLinks";

/** Mobile-only floating tab bar, like a native app. */
export function BottomNav() {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-30 flex gap-1 rounded-full border border-line bg-surface/95 p-1.5 shadow-2xl backdrop-blur md:hidden">
      <BottomNavLinks />
    </nav>
  );
}
