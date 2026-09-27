import Image from "next/image";

export function HeaderEsqueleto() {
  return (
    <div className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-borda bg-white/90 px-4 backdrop-blur">
      <Image src="/cepi-logo.png" alt="" width={36} height={36} className="size-9 rounded-xl bg-white object-contain ring-1 ring-borda" priority />
      <div className="flex-1 space-y-1.5">
        <div className="skeleton h-3 w-28 rounded-full" />
        <div className="skeleton h-2.5 w-36 rounded-full" />
      </div>
      <div className="skeleton h-9 w-28 rounded-full" />
    </div>
  );
}

export function Esqueleto() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Carregando o Portal do Aluno">
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton size-14 shrink-0 rounded-full" />
        ))}
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton h-8 w-20 rounded-full" />
        ))}
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="space-y-3 rounded-2xl border border-borda bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="skeleton size-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-3 w-1/2 rounded-full" />
              <div className="skeleton h-2.5 w-1/3 rounded-full" />
            </div>
          </div>
          <div className="skeleton h-3 w-full rounded-full" />
          <div className="skeleton h-3 w-4/5 rounded-full" />
        </div>
      ))}
    </div>
  );
}
