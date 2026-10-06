import type { Metadata } from "next";
import { Suspense } from "react";
import { FeedView } from "@/components/feed/FeedView";

export const metadata: Metadata = { title: "Feed" };

export default function FeedPage() {
  // useSearchParams (filtro ?autor=) exige limite de Suspense no build estático.
  return (
    <Suspense fallback={null}>
      <FeedView />
    </Suspense>
  );
}
