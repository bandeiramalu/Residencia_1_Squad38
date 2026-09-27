export type Raridade = "Comum" | "Incomum" | "Raro" | "Especial" | "Exclusivo";
export type AbaLoja = "avatar" | "perfil" | "escola";

/** Onde o item aparece quando equipado. Recompensas da escola geram voucher. */
export type Slot =
  | "moldura"
  | "fundo"
  | "adesivo"
  | "efeito"
  | "animado"
  | "placa"
  | "tema"
  | "capa"
  | "fonte"
  | "figurinhas"
  | "voucher";

export type IconeItem =
  | "leaf"
  | "palette"
  | "sticker"
  | "gem"
  | "sprout"
  | "tag"
  | "trees"
  | "notebook"
  | "type"
  | "grin"
  | "utensils"
  | "cup"
  | "music"
  | "shirt"
  | "bot";

export interface ItemLoja {
  id: string;
  aba: AbaLoja;
  nome: string;
  descricao: string;
  raridade: Raridade;
  custo: number;
  slot: Slot;
  icone: IconeItem;
}

export const ITENS: ItemLoja[] = [
  { id: "av1", aba: "avatar", nome: "Moldura de avatar Folha", descricao: "Anel verde com folhas ao redor do seu avatar.", raridade: "Comum", custo: 150, slot: "moldura", icone: "leaf" },
  { id: "av2", aba: "avatar", nome: "Fundo de avatar Degradê Verde", descricao: "Troca o fundo do avatar por um degradê verde.", raridade: "Comum", custo: 220, slot: "fundo", icone: "palette" },
  { id: "av3", aba: "avatar", nome: "Adesivo Coruja Estudiosa", descricao: "Uma coruja no canto do seu avatar.", raridade: "Incomum", custo: 380, slot: "adesivo", icone: "sticker" },
  { id: "av4", aba: "avatar", nome: "Efeito Brilho Esmeralda", descricao: "Brilho verde pulsante ao redor do avatar.", raridade: "Raro", custo: 750, slot: "efeito", icone: "gem" },
  { id: "av5", aba: "avatar", nome: "Avatar animado Semente Crescente", descricao: "Uma semente que brota no seu avatar.", raridade: "Especial", custo: 1400, slot: "animado", icone: "sprout" },

  { id: "pf1", aba: "perfil", nome: "Placa de perfil Turma 9º A", descricao: "Placa com o nome da sua turma no perfil.", raridade: "Comum", custo: 180, slot: "placa", icone: "tag" },
  { id: "pf2", aba: "perfil", nome: "Tema do perfil Bosque", descricao: "Capa ilustrada com colinas verdes.", raridade: "Incomum", custo: 420, slot: "tema", icone: "trees" },
  { id: "pf3", aba: "perfil", nome: "Capa de perfil Caderno Pautado", descricao: "Capa com linhas de caderno.", raridade: "Comum", custo: 160, slot: "capa", icone: "notebook" },
  { id: "pf4", aba: "perfil", nome: "Fonte manuscrita no nome", descricao: "Seu nome escrito à mão no perfil.", raridade: "Raro", custo: 690, slot: "fonte", icone: "type" },
  { id: "pf5", aba: "perfil", nome: "Figurinhas do CEPI", descricao: "Coleção de figurinhas da escola no perfil.", raridade: "Especial", custo: 1500, slot: "figurinhas", icone: "grin" },

  { id: "es1", aba: "escola", nome: "Desconto de 10% na cantina", descricao: "Vale para um lanche na cantina do CEPI.", raridade: "Comum", custo: 300, slot: "voucher", icone: "utensils" },
  { id: "es2", aba: "escola", nome: "Squeeze CEPI Verde e Branco", descricao: "Retire na secretaria com o código.", raridade: "Incomum", custo: 1200, slot: "voucher", icone: "cup" },
  { id: "es3", aba: "escola", nome: "Ingresso para o Sarau Literário", descricao: "Lugar reservado no sarau do semestre.", raridade: "Raro", custo: 2000, slot: "voucher", icone: "music" },
  { id: "es4", aba: "escola", nome: "Camiseta da Feira de Ciências", descricao: "Edição da Feira de Ciências 2026.", raridade: "Especial", custo: 2600, slot: "voucher", icone: "shirt" },
  { id: "es5", aba: "escola", nome: "Vaga extra na Oficina de Robótica", descricao: "Uma vaga no módulo avançado de robótica.", raridade: "Exclusivo", custo: 3500, slot: "voucher", icone: "bot" },
];

export const ABAS_LOJA: { id: AbaLoja; nome: string }[] = [
  { id: "avatar", nome: "Avatar" },
  { id: "perfil", nome: "Perfil" },
  { id: "escola", nome: "Recompensas da escola" },
];

export function itemPorId(id: string) {
  return ITENS.find((i) => i.id === id);
}
