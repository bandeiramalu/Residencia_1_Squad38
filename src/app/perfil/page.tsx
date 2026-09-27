import type { Metadata } from "next";
import { PerfilView } from "@/components/perfil/PerfilView";

export const metadata: Metadata = { title: "Perfil" };

export default function PerfilPage() {
  return <PerfilView />;
}
