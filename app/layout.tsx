import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Servando — שירות מענה טלפוני חכם",
    template: "%s | Servando",
  },
  description: "פלטפורמת מענה טלפוני חכם לעסקים קטנים. נציגים אנושיים עונים בשם העסק שלך, יוצרים תיקים ומסכמים שיחות עם AI.",
  keywords: ["מענה טלפוני", "שירות לקוחות", "עסקים קטנים", "AI", "ניהול שיחות"],
  openGraph: {
    title: "Servando — שירות מענה טלפוני חכם",
    description: "נציגים אנושיים + AI. כל שיחה הופכת לתיק עסקי מסודר.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value ?? "he";
  const dir = locale === "he" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
