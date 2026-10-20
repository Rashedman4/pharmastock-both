"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";

/**
 * Theme provider for the whole app, with one exception: **the admin
 * back-office stays light.**
 *
 * The admin pages were built against the light palette only and are not in
 * scope for dark mode, so when the path is under /admin the provider forces
 * light regardless of the stored preference. `forcedTheme` has to be decided
 * on the client (the pathname isn't known in a shared server layout without
 * making every route dynamic), which is fine: next-themes writes the class
 * before paint either way.
 */
export default function AppThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      forcedTheme={isAdmin ? "light" : undefined}
    >
      {children}
    </ThemeProvider>
  );
}
