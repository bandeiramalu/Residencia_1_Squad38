import Image from "next/image";

export function HeaderEsqueleto() {
  return (
    <div className="vidro sticky top-0 z-40 border-b border-borda">
      <div className="coluna flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Image src="/cepi-logo.png" alt="" width={36} height={36} className="size-8 rounded-lg bg-white object-contain ring-1 ring-borda lg:hidden" priority />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton h-3 w-28 rounded-full" />
          <div className="skeleton h-2.5 w-36 rounded-full" />
        </div>
        <div className="skeleton h-8 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function Esqueleto() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Carregando o Portal">
      <div className="skeleton h-7 w-48 rounded-lg" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton h-24 rounded-2xl" />
        ))}
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="space-y-3 rounded-2xl border border-borda bg-superficie p-4">
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
