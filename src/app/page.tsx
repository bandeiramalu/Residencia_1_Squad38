import { redirect } from "next/navigation";

// O proxy já manda cada papel para a sua tela inicial; isto é só a rede de segurança.
export default function Inicio() {
  redirect("/login");
}
