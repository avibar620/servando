"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

/**
 * Global keyboard shortcuts:
 * Alt+D = Dashboard/Admin
 * Alt+A = Agent workspace
 * Alt+P = Portal
 * Alt+L = Logout
 * Escape = Close modals (handled by individual components)
 */
export default function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Only trigger with Alt key, not in input fields
      if (!e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key.toLowerCase()) {
        case "d":
          e.preventDefault();
          router.push("/admin");
          break;
        case "a":
          e.preventDefault();
          router.push("/agent");
          break;
        case "p":
          e.preventDefault();
          router.push("/portal");
          break;
        case "l":
          e.preventDefault();
          fetch("/api/auth/logout", { method: "POST" }).then(() => {
            router.push("/");
          });
          break;
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  return null;
}
