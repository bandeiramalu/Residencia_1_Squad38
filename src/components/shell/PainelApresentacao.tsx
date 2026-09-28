import Image from "next/image";
import Link from "next/link";
import { ESCOLA } from "@/data/escola";

const FLUXOS = [
  { href: "/feed", titulo: "Publicar material em PDF", passos: "Feed → + → Material → disciplina → Publicar" },
  { href: "/feed", titulo: "Enviar dúvida com recomendação", passos: "Feed → + → Dúvida → digite 15+ caracteres" },
  { href: "/loja", titulo: "Resgatar item na Loja", passos: "Loja → item → Confirmar troca → Comprar" },
  { href: "/missoes", titulo: "Relatar problema da escola", passos: "Missões → Abrir relato → Enviar relato" },
  { href: "/perfil", titulo: "Inspecionar medalhas", passos: "Perfil → toque numa medalha" },
];

/** Painel lateral só em telas grandes — ajuda a apresentar o protótipo. */
export function PainelApresentacao() {
  return (
    <aside className="fixed left-[max(1.5rem,calc(50%-560px))] top-1/2 hidden w-[260px] -translate-y-1/2 xl:block">
      <div className="flex items-center gap-3">
        <Image src="/cepi-logo.png" alt={ESCOLA.nome} width={56} height={56} className="size-14 rounded-2xl bg-white object-contain p-1 shadow-card ring-1 ring-borda" />
        <div>
          <p className="text-lg font-extrabold leading-tight text-tinta">Portal do Aluno</p>
          <p className="text-sm font-semibold text-cepi">{ESCOLA.nome}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-texto-2">
        Protótipo funcional da rede social educacional — Residência de Software, <b className="text-texto">Squad 38</b>.
      </p>

      <p className="mb-2 mt-6 text-xs font-bold uppercase tracking-[0.08em] text-verde">Fluxos para testar</p>
      <ol className="space-y-2">
        {FLUXOS.map((f, i) => (
          <li key={f.titulo}>
            <Link
              href={f.href}
              className="group flex gap-3 rounded-xl border border-transparent p-2 transition-colors hover:border-borda hover:bg-white"
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-verde-claro text-[11px] font-bold text-verde">3.{i + 1}</span>
              <span>
                <span className="block text-[13px] font-semibold text-tinta group-hover:text-verde">{f.titulo}</span>
                <span className="block text-[11.5px] leading-snug text-texto-2">{f.passos}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <Link
        href="/mensagens"
        className="group mt-2 flex gap-3 rounded-xl border border-transparent p-2 transition-colors hover:border-borda hover:bg-white"
      >
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-verde text-[10px] font-bold text-white">US01</span>
        <span>
          <span className="block text-[13px] font-semibold text-tinta group-hover:text-verde">Mensagens diretas</span>
          <span className="block text-[11.5px] leading-snug text-texto-2">Cabeçalho → balão de mensagens → conversa → enviar</span>
        </span>
      </Link>
      <p className="mt-6 text-[11.5px] leading-snug text-texto-2">
        Os dados ficam salvos neste navegador. Para recomeçar, use <b className="text-texto">Perfil → Reiniciar demonstração</b>.
      </p>
    </aside>
  );
}
