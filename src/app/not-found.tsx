import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <div className="py-16 text-center">
      <p className="text-5xl font-extrabold text-verde-suave">404</p>
      <h1 className="mt-2 text-lg font-bold text-tinta">Página não encontrada</h1>
      <p className="mt-1 text-sm text-texto-2">Esse endereço não existe no Portal do Aluno.</p>
      <Link
        href="/feed"
        className="mt-6 inline-flex h-10 items-center rounded-xl bg-verde px-5 text-sm font-semibold text-white transition-colors hover:bg-verde-2"
      >
        Voltar ao feed
      </Link>
    </div>
  );
}
