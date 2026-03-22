// Safety fallback — the next-intl middleware rewrites all requests to
// /[locale]/... before this page is rendered. See app/[locale]/page.tsx.
import { notFound } from "next/navigation";

export default function RootPage() {
  notFound();
}
