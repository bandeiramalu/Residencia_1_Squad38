const numero = new Intl.NumberFormat("pt-BR");

export function fmt(n: number) {
  return numero.format(n);
}

export function primeiroNome(nome: string) {
  return nome.replace(/^(Prof\.|Profª\.|Teacher)\s+/, "").split(" ")[0];
}

export function plural(n: number, singular: string, pluralForm: string) {
  return `${fmt(n)} ${n === 1 ? singular : pluralForm}`;
}

/** Remove acentos e caixa — base da busca e da triagem. */
export function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function gerarId(prefixo: string) {
  return `${prefixo}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function gerarVoucher() {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let codigo = "";
  for (let i = 0; i < 6; i++) codigo += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  return `CEPI-${codigo.slice(0, 3)}-${codigo.slice(3)}`;
}
