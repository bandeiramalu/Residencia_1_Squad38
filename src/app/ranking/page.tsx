import type { Metadata } from "next";
import { RankingView } from "@/components/ranking/RankingView";

export const metadata: Metadata = { title: "Ranking" };

export default function RankingPage() {
  return <RankingView />;
}
