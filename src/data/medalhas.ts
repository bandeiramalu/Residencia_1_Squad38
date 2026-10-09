export type IconeMedalha = "users" | "flask" | "flame" | "shield" | "lightbulb" | "brain" | "megaphone" | "crown";

export interface MedalhaDef {
  id: string;
  nome: string;
  criterio: string;
  icone: IconeMedalha;
  meta: number;
}

/** Medalhas do Perfil. Só existem por conquista — nunca aparecem na Loja. */
export const MEDALHAS: MedalhaDef[] = [
  { id: "colaborador", nome: "Colaborador", criterio: "Ter 10 respostas marcadas como úteis", icone: "users", meta: 10 },
  { id: "mestre-quimica", nome: "Mestre de Química", criterio: "Dominar 20 flashcards de Química (cartas na caixa 3 ou acima)", icone: "flask", meta: 20 },
  { id: "constante", nome: "Constante", criterio: "Estudar 30 dias seguidos", icone: "flame", meta: 30 },
  { id: "sem-congelador", nome: "Sem Congelador", criterio: "20 dias seguidos sem usar congelador", icone: "shield", meta: 20 },
  { id: "mentor", nome: "Mentor", criterio: "Ter 50 respostas marcadas como úteis", icone: "lightbulb", meta: 50 },
  { id: "polimata", nome: "Polímata", criterio: "Chegar a 70% de domínio em 5 disciplinas", icone: "brain", meta: 5 },
  { id: "voz-da-escola", nome: "Voz da Escola", criterio: "Ter 5 relatos validados pela coordenação", icone: "megaphone", meta: 5 },
  { id: "topo-da-liga", nome: "Topo da Liga", criterio: "Alcançar o 1º lugar da sua liga na semana", icone: "crown", meta: 1 },
];
