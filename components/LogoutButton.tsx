"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

export default function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`text-sm text-slate-500 hover:text-red-600 transition-colors disabled:opacity-50 ${className}`}
    >
      {loading ? "…" : "התנתק"}
    </button>
  );
}
