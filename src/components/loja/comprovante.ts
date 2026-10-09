import { ESCOLA } from "@/data/escola";
import type { ItemLoja } from "@/data/loja";
import { fmt } from "@/lib/format";
import { baixarArquivo, gerarPdfDocumento } from "@/lib/pdf";
import { dataCurta } from "@/lib/tempo";
import type { Compra } from "@/store/types";

/** Comprovante de troca em PDF, para apresentar na secretaria ou na cantina. */
export function baixarComprovante(compra: Compra, item: ItemLoja | undefined, aluno: string, saldoAtual: number) {
  const nomeItem = item?.nome ?? "Item da Loja";
  const status = compra.entregueEm ? `Entregue em ${dataCurta(compra.entregueEm)}` : "Aguardando retirada";
  const { blob } = gerarPdfDocumento({
    escola: ESCOLA.nome,
    titulo: "Comprovante de troca",
    subtitulo: nomeItem,
    blocos: [
      { tipo: "quadro", titulo: "Código do voucher", texto: compra.voucher ?? "Sem código (item digital, já aplicado ao perfil)" },
      {
        tipo: "tabela",
        colunas: ["Campo", "Informação"],
        linhas: [
          ["Nome", aluno],
          ["Item", nomeItem],
          ["Data da troca", dataCurta(compra.criadoEm)],
          ["Pontos usados", fmt(compra.custo)],
          ["Saldo atual de pontos", fmt(saldoAtual)],
          ["Situação", status],
        ],
        larguras: [0.35, 0.65],
      },
      { tipo: "secao", texto: "Como retirar" },
      {
        tipo: "numerada",
        itens: [
          "Vá à secretaria do CEPI (ou à cantina, nas recompensas de lanche).",
          "Mostre este comprovante ou diga o código do voucher.",
          "A entrega é registrada no portal e a situação muda para Entregue.",
        ],
      },
    ],
  });
  baixarArquivo(blob, `comprovante-${(compra.voucher ?? compra.id).toLowerCase()}.pdf`);
}
