import type { Metadata } from "next";
import { FeedView } from "@/components/feed/FeedView";

export const metadata: Metadata = { title: "Feed" };

export default function FeedPage() {
  return <FeedView />;
}
