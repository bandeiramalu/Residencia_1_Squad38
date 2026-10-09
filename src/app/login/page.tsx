import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginView } from "@/components/login/LoginView";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginView />
    </Suspense>
  );
}
