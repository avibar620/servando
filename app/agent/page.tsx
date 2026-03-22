// Safety fallback — the proxy rewrites all requests to /[locale]/agent before
// this page is rendered. See app/[locale]/agent/page.tsx.
import { notFound } from "next/navigation";

export default function AgentFallback() {
  notFound();
}
