"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";

const LOCALES = [
  { code: "he", label: "עב" },
  { code: "en", label: "EN" },
  { code: "nl", label: "NL" },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchLocale(next: string) {
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div
      className="flex gap-1 rounded-lg border border-slate-200 bg-white/90 p-1 shadow-md backdrop-blur-sm"
      dir="ltr"
    >
      {LOCALES.map((l) => (
        <button
          key={l.code}
          onClick={() => switchLocale(l.code)}
          disabled={isPending}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all disabled:opacity-60 ${
            locale === l.code
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
