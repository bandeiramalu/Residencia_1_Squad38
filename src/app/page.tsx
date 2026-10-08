import { redirect } from "next/navigation";

// A guarda do AppShell leva cada papel à sua tela inicial (login → home do papel).
export default function Inicio() {
  redirect("/login");
}
